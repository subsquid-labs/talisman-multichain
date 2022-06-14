import { request, gql } from 'graphql-request'
import { Transaction } from "./model";
import { BlockHandlerContext } from "@subsquid/substrate-processor";

const BLOCK_QUERY = gql`
  query ($limit: Int, $blockNumber: Int) {
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

type TProcessOptions = {
  ctx: BlockHandlerContext,
  chains: any,
  limit: Number,
  afterBlockProcessed: ({chainId, height, extrinsics}:any) => void
}

export default class ChainFactory{

  async fetchChainData(chains, limit){
    // loop through all chains and fetch TXs
    const chainData = await Promise.all(chains.map(async ({id, url, latestBlock}: any) => {
      const variables = {
        limit: limit,
        blockNumber: Number(latestBlock)
      }

      const result = await request(url, BLOCK_QUERY, variables)
      
      return {
        chainId: id,
        result
      }
    }))

    return chainData
  }
  

  // fetch and store all transactons
  async processBlock({ctx, chains, limit, afterBlockProcessed}: TProcessOptions){
    const chainData = await this.fetchChainData(chains, limit)

    // process all chains
    for (const chain of chainData) {
      // <-- chain level
  
      // pull out the relevant vars
      const { 
        chainId, 
        result 
      }: any = chain

      // process all blocks in this
      for (const { height, substrate_extrinsics: extrinsics } of result.substrate_block){
        // <-- chain->block level
        
        // parse all the TXs
        for (const extrensic of extrinsics) {
          // <-- chain->block->tx level

          // find all unique addresses in the extrinsic
          const addresses = this.filterAddresses(extrensic)
          
          // if we're good to go, insert the TX
          await ctx.store.upsert(Transaction, {
            "id": `${Date.parse(extrensic.created_at)}--${extrensic.id}--${chainId}`, // 2022-06-04T12:19:20.296000Z,
            "chainId" : chainId,
            "blockNumber" : extrensic.blockNumber,
            "createdAt" : extrensic.created_at,
            "section" : extrensic.section,
            "method" : extrensic.method,
            "name": extrensic.name,
            "signer" : extrensic.signer,
            "relatedAddresses" : addresses
          }, ['id'])
        }
        

        afterBlockProcessed({
          chain: {
            id: chainId,
            blockHeight: height
          }, 
          extrinsics
        })
      }
    }

    return
  }  

  filterAddresses(extrensic){
    // pluck all address looking things from the full extrinsic
    const matches = JSON.stringify(extrensic).matchAll( /[a-zA-Z0-9]{48}/g )
    // create an address array
    const allAddresses = [...new Set([...matches].map(match => match[0]).filter(s=>s))]
    // filter by addresses we don't want
    const filteredAddresses = allAddresses.map(address => {
      if(
        address === "000000000000000000000000000000000000000000000000" || // filter out all 000...000 addresses
        address.substring(0, 2) === '0x' // filter out all 0x addresses
      ){
        return
      }

      return address
    }).filter(a=>a)

    return filteredAddresses
  }
}