/* eslint-disable prettier/prettier */
import * as ss58 from "@subsquid/ss58";
import {
  Store,
  SubstrateProcessor,
} from "@subsquid/substrate-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import { request, gql } from 'graphql-request'
import { TxState, QueryLog } from "./model";

const processor = new SubstrateProcessor("talisman_txs");

processor.setBatchSize(500);
processor.setDataSource({
  chain: 'wss://rpc.polkadot.io',
  archive: lookupArchive('polkadot')[0].url,
})

const query = gql`
  query ($limit: Int, $offset: Int) {
    substrate_extrinsic(order_by: { id: asc }, limit: $limit, offset: $offset) {
      id
      blockHash
      blockNumber
      era
      tip
      signature
      signer
      indexInBlock
      name
      section
      method
			created_at
      substrate_events {
          name
          section
          method
          params
      }
    }
  }
`

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
	const chains = [
    {
      "chainId": "polkadot",
      "url": "https://polkadot.indexer.gc.subsquid.io/v4/graphql"
    },
    {
      "chainId": "kusama",
      "url": "https://kusama.indexer.gc.subsquid.io/v4/graphql"
    },
  ]

  // loop through all chains and fetch TXs
	const chainQueries = await Promise.all(chains.map(async chain => {

    // is there a better way to do this, outside of having to make a DB call for each chain?
		// could we combine this into a single query outside of this loop
		// eg: fetch all chainIds with TX count as a param? 
		const offset = await context.store.count(TxState, {
      chainId: chain.chainId
    })

    console.log(chain.chainId, offset)
		
		// currently limit is set to 10
		// future version we could have pre defined values eg 10, 20, 50?
    const variables = {
      limit: 1000,
      offset
    }

    const result = await request(chain.url, query, variables)
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