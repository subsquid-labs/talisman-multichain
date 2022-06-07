/* eslint-disable prettier/prettier */
import { BlockHandlerContext } from "@subsquid/substrate-processor";
import { QueryLog } from "./model";
import { TChainConfig } from './types'

export default class Logger{

  ctx: BlockHandlerContext|any
  chains: TChainConfig[] = []
  startTime = (new Date()).getTime()
  txCount: Number = 0

  constructor(chains: TChainConfig[]){
    this.chains = chains
  }

  // add to the total TX count
  addTxCount(count: Number){
    this.txCount = +this.txCount + +count
  }

  // start the loggin process
  init(ctx: BlockHandlerContext){
    this.ctx = ctx
    this.txCount = 0
    this.startTime = (new Date()).getTime()
  }

  // log the current info to the DB
  write(){
    const endTime = (new Date()).getTime()

    this.ctx.store.upsert(QueryLog, {
      "id": this.ctx.block.height.toString(),
      "blockNumber": BigInt(this.ctx.block.height),
      "startTime": this.startTime,
      "endTime": endTime,
      "lengthMs": endTime - this.startTime,
      "chainCount": this.chains.length,
      "txCount": +this.txCount  
    }, ['id'])      
  }
}