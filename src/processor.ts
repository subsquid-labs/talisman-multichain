/* eslint-disable prettier/prettier */
import * as ss58 from "@subsquid/ss58";
import {
  Store,
  SubstrateProcessor,
} from "@subsquid/substrate-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import { request, gql } from 'graphql-request'
import { Transactions, QueryLog, ChainInfo, Metadata } from "./model";
import Logger from './Logger'
import ChainStore from './ChainStore'
import { START_BLOCK, BLOCK_QUERY, BLOCK_LIMIT, chains } from './config'

// define the processor and variables
const processor = new SubstrateProcessor("talisman_txs");
processor.setBlockRange({from: START_BLOCK}); // ???? maybe: -1 starts processing at the latest block so we don't go back in history from genesis
processor.setBatchSize(1);
processor.setDataSource({
  chain: 'wss://rpc.polkadot.io',
  archive: lookupArchive('polkadot')[0].url,
})

// create a new logger object
const logger = new Logger(chains)

// create a new chainstore object
// resync every 10 blocks
const chainStore = new ChainStore(chains, {timeout: 10})

// post block hook used as clock to process chains 
processor.addPostHook(async ctx => {

  // start the logger for this block
  logger.init(ctx)

  // attempt to sync chain store object
  chainStore.sync(ctx)

  // fetch all chains
  const allChains = await chainStore.all()

  // loop through all chains and fetch TXs
	const chainQueries = await Promise.all(allChains.map(async ({id, url, latestBlock}: any) => {
    const variables = {
      limit: BLOCK_LIMIT,
      blockNumber: Number(latestBlock)
    }

    const result = await request(url, BLOCK_QUERY, variables)
    
    return {
      chainId: id,
      result
    }
  }))
	
  //itterate all returned promises and add all the
  for (const chainQuery of chainQueries) {
    // pull out the relevant items
    const { chainId, result }: any = chainQuery

    for (const { height, substrate_extrinsics } of result.substrate_block){
      
      for (const extrensic of substrate_extrinsics) {
        await ctx.store.upsert(Transactions, {
          "id" : `${chainId}-${extrensic.id}`,
          "chainId" : chainId,
          "blockNumber" : extrensic.blockNumber,
          "createdAt" : extrensic.created_at,
          "section" : extrensic.section,
          "method" : extrensic.method,
          "relatedAddresses" : []
        }, ['id'])
      }

      // update chain store to latest block in case we fail after this
      chainStore.updateChainLatestBlock(chainId, height)

      // add this TX count to logger
      logger.addTxCount(substrate_extrinsics.length)

    }
  }

  // log the result
  logger.write()  
})

// Subsquid won't work unless this function is here
processor.addEventHandler("balances.Transfer", async () => {});

// run the processor
processor.run();