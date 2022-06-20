import { request, gql } from 'graphql-request'
import { Transaction } from "./model";
import { BlockHandlerContext } from "@subsquid/substrate-processor";
import { formatAddress } from './utils'

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
          const signerAddressFormatted = formatAddress(extrensic.signer)
          const relatedAddressesFormatted = this.filterAddresses(extrensic)
          
          // if we're good to go, insert the TX
          await ctx.store.upsert(Transaction, {
            "id": `${Date.parse(extrensic.created_at)}--${extrensic.id}--${chainId}`, // 2022-06-04T12:19:20.296000Z,
            "extrinsicId": extrensic.id,
            "chainId" : chainId,
            "blockNumber" : extrensic.blockNumber,
            "createdAt" : extrensic.created_at,
            "section" : extrensic.section,
            "method" : extrensic.method,
            "name" : extrensic.name,
            "signer" : signerAddressFormatted,
            "relatedAddresses" : relatedAddressesFormatted
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
    const matches = JSON.stringify(extrensic).matchAll( /[a-zA-Z0-9]{47}/g )
    // create an address array
    const allAddresses = [...new Set([...matches].map(match => match[0]).filter(s=>s))]
    // filter by addresses we don't want
    const filteredAddresses = allAddresses.map(address => {
      if(
        address === "00000000000000000000000000000000000000000000000" || // filter out all 000...000 addresses 47 length
        address.substring(0, 2) === '0x' // filter out all 0x addresses
      ){
        return
      }

      try {
        // return substrate endoded address
        return formatAddress(address) 
      } catch (error) {
        return null
      }
      
    }).filter(a=>a)

    return filteredAddresses
  }
}