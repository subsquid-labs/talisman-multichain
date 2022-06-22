/* eslint-disable prettier/prettier */
import { SubstrateProcessor } from "@subsquid/substrate-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import Logger from './logger'
import ChainStore from './chainStore'
import ChainFactory from './chainFactory'
import { START_BLOCK, BLOCK_LIMIT, chains } from './config'

// define the processor and variables
const processor = new SubstrateProcessor("talisman_txs");
processor.setBlockRange({from: START_BLOCK});
processor.setBatchSize(1);
processor.setDataSource({
  chain: 'wss://rpc.polkadot.io',
  archive: lookupArchive('polkadot')[0].url,
})

// create a new logger object
const logger : Logger = new Logger(chains)

// create a new chainstore object
// resync every 10 blocks
const chainStore : ChainStore = new ChainStore(chains, {timeout: 10})

// create a new indexer object
const chainFactory : ChainFactory = new ChainFactory()

// post block hook used as clock to process chains 
processor.addPostHook(async ctx => {

  // start the logger for this block
  logger.init(ctx)

  // attempt to sync chain store object to the DB
  // twe let this run the in the background so it doesn't block
  await chainStore.sync(ctx)

  // fetch all chains
  const chains : ChainStore[] = await chainStore.all()

  // process all chains on each tick
  await chainFactory.processBlock({
    ctx: ctx,
    chains: chains,
    limit: BLOCK_LIMIT, // how many blocks to process at once
    afterBlockProcessed:  ({chain, extrinsics}) => {
      // update chain store to latest block in case we fail after this
      chainStore.updateChainLatestBlock(chain.id, chain.blockHeight)
      // append details to logger
      logger.addTxs(extrinsics)
    }
  })

  // write to the log
  logger.write()  
})

// Subsquid won't work unless this function is here
processor.addEventHandler("balances.Transfer", async () => {});

// run the processor
processor.run();