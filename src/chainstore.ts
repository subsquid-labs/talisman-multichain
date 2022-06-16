/* eslint-disable prettier/prettier */
import { BlockHandlerContext } from "@subsquid/substrate-processor";
import { Chain, Metadata } from "./model";

const md5 = require('md5');

// constructor type options
type TOptions = {
  /** Check for new chains every x blocks (x * 6 seconds = check for changes) - will default to 1 (every block) if not defined */
  timeout: number
}

export type TChainConfig = {
  chainId: string
  chainNumber: number
  url: string
  startBlock: number
};


const defaultOptions: TOptions = {
  timeout: 1
}

export default class ChainStore {

  ctx: BlockHandlerContext | any
  
  chains: TChainConfig[] = []

  options: TOptions = defaultOptions 
  
  constructor(chains: TChainConfig[], options: TOptions = defaultOptions){
    this.chains = chains
    this.options = options
  }

  // sync the DB
  async sync(ctx: BlockHandlerContext) : Promise<void> {

    this.ctx = ctx

    // check for timeout by modulo-ing the current block height and the timeout
    // only run if it's a match, otherwise return
    if(ctx.block.height % this.options.timeout !== 0) return

    // we need to compare the stored and current chain hashes
    const storedChainsHash = await ctx.store.findOne(Metadata, 'chainsHash')
    const chainsHash : string = md5(this.chains)

    // resync the DB if stored and current hashes don't match
    if(chainsHash !== storedChainsHash?.value){
      
      // loop chains and add if not already
      for (const chain of this.chains) {
        const chainDetails = await ctx.store.findOne(Chain, chain.chainId)
        const chainHash = md5(JSON.stringify(chain))
        const timestamp = BigInt((new Date()).getTime())
        
        // if no entry, insert new item
        if(!chainDetails){
          ctx.store.insert(Chain, {
            "id": chain.chainId,
            "url": chain.url,
            "startingBlock": BigInt(chain?.startBlock||0),
            "latestBlock": BigInt(chain?.startBlock||0),
            "hash": chainHash,
            "createdAt": timestamp,
            "updatedAt": timestamp
          })
        }
        // else if entry hash is different from that stored
        // we want to update the details
        else if(chainDetails?.hash !== chainHash){
          ctx.store.upsert(Chain, {
            "url": chain.url,
            "startingBlock": BigInt(chain?.startBlock||0),
            "latestBlock": BigInt(chain?.startBlock||0),
            "hash": chainHash,
            "updatedAt": timestamp
          }, ["id"])
        }
      }

      // update new chain hash in DB
      ctx.store.upsert(Metadata, {
        "id": 'chainsHash',
        "value": chainsHash
      }, ['id'])
    }
  }

  // update the latest block for this chain
  // call this once a new block has come in and we've parsed all the TXs
  updateChainLatestBlock(chainId: string, blockNumber: number){
    this.ctx.store.update(
      Chain, 
      {id: chainId}, 
      {
        "latestBlock": BigInt(blockNumber)
      }
    )
  }

  async all(){
    const chains = await this.ctx.store.find(Chain)
    return chains
  }
}