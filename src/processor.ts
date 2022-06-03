/* eslint-disable prettier/prettier */
import * as ss58 from "@subsquid/ss58";
import {
  Store,
  SubstrateProcessor,
} from "@subsquid/substrate-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import { request, gql } from 'graphql-request'
import { TxState, QueryLog, ChainInfo, Metadata } from "./model";

const processor = new SubstrateProcessor("talisman_txs");

processor.setBatchSize(500);
processor.setDataSource({
  chain: 'wss://rpc.polkadot.io',
  archive: lookupArchive('polkadot')[0].url,
})

const query = gql`
  query ($limit: Int, $blockNumber: BigInt) {
    substrate_block(limit: $limit, order_by: {height : asc}, where: {height : {_gt: $blockNumber }}) {
      height
      substrate_extrinsics {
          id
          blockHash
          blockNumber
          created_at
          era
          tip
          signature
          signer
          indexInBlock
          name
          section
          method
          substrate_events {
              name
              section
              method
              params
          }
      }
    }
  }
`

// chains we're interested in
// will come from external source later
// hardcoded for now
const chains = [
  {
    "chainId": "polkadot",
    "url": "https://polkadot.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": 10582406
  },
  {
    "chainId": "kusama",
    "url": "https://kusama.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": 12964919
  },
]

// calculate the hash of the chains on startup
const chainsHash = md5(chains) // <-- josh

// Add pre-hook

processor.addPostHook(async (context) => {

	// set a tick start time for logging
	const startTime = (new Date()).getTime()
	
	// set a variable for counting the total number of TXs in this loop  
	let txCountTotal = 0

  // hardcoded list of chains we're interested in.
	// this should be dynamically pulled from somewhere in
	// a future version as to require manual updates.
	// do we need to store the latest tx count against the 
	// row for easier lookup?
  
  //   if what is below is different than in the DB
  //   update the DB by adding the new chains
  //   - we don;t want to do this every time
  //   - only when it's changed
  // 	- store a hash of the chains obj
  //   - compare hash to
  
  // check the chains hash is different from what we previously have
  // if !=, update all
  const previousChainsHash = context.store.get(Metadata, {where: {a: b}}) // <-- josh
  if(chainsHash != previousChainsHash){
    
    // hopefully promise is async and non-blocking
    new Promise(() => {
      chains.forEach(({chainId, url, startBlock = 0}) => {
        
        const chainFound = context.store.get(ChainInfo, {where: {id: chainId}}) // <-- josh

        if(!chainFound){
          context.store.insert(ChainInfo, {
            "id": chainId,
            "latestBlock": startBlock,
          }, ['id'])
        }
      })
    })
  }

  // now we have a updated list of all chains we're intested in and the blocks they're currently synced to
  // allows us to add chains without breaking the currently stored chains
  
  // get all the chains from the DB
  const storedChains = context.store.get(ChainInfo) // <-- josh

  // loop through all chains and fetch TXs
	const chainQueries = await Promise.all(storedChains.map(async ({id, url, latestBlock}) => {
		// currently limit is set to 10
		// future version we could have pre defined values eg 10, 20, 50?
    const variables = {
      limit: 10,
      blockNumber: latestBlock
    }

    const result = await request(url, query, variables)
		return {
			chainId: chain.chainId,
			result
		}
  }))
	
	// itterate all returned promises and add all the
  for (const chainQuery of chainQueries) {
		// pull out the relevant items
		const { chainId } = chainQuery
		const extrensics = chainQuery.result.substrate_extrinsic;
		
		// add the TX count from this chain to the total TXs
		txCountTotal += extrensics.length
    // loop all extrinsics and add to DB
		// note: can we upsert batch?
		for (const extrensic of extrensics) {
			await context.store.upsert(TxState, {
        "id" : `${chainId}-${extrensic.id}`,
        "chainId" : chainId,
        "blockNumber" : extrensic.blockNumber,
        "createdAt" : extrensic.created_at,
        "section" : extrensic.section,
        "method" : extrensic.method,
        "relatedAddresses" : []
      }, ['id'])
    }
  }

	// log an end time
	const endTime = (new Date()).getTime()

  console.log(context.block.height)
	// commit new log to log store
	await context.store.upsert(QueryLog, {
    "id": `${context.block.height}`,
	  "blockNumber": BigInt(context.block.height),
		"startTime": new Date(startTime),
	  "endTime": new Date(endTime),
	  "lengthMs": endTime - startTime,
		"chainCount": chains.length,
		"txCount": txCountTotal  
  }, ['id'])
  
})

// Subsquid won't work unless this function is here
processor.addEventHandler("balances.Transfer", async () => {
  // do nothing
});

processor.run();

async function getOrCreate<T extends { id: string }>(
  store: Store,
  EntityConstructor: EntityConstructor<T>,
  id: string
): Promise<T> {
  let entity = await store.get<T>(EntityConstructor, {
    where: { id },
  });

  if (entity == null) {
    entity = new EntityConstructor();
    entity.id = id;
  }

  return entity;
}

type EntityConstructor<T> = {
  new (...args: any[]): T;
};