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
        indexInBlock
        created_at
        era
        tip
        signature
        signer
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
    const chainData = await Promise.all(chains.map(async ({id, url, latestBlock, ss58Format}: any) => {
      const variables = {
        limit: limit,
        blockNumber: Number(latestBlock)
      }

      const result = await request(url, BLOCK_QUERY, variables)
      
      return {
        chainId: id,
        ss58Format,
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
        ss58Format, 
        result 
      }: any = chain

      // process all blocks in this
      for (const { height, substrate_extrinsics: extrinsics } of result.substrate_block){
        // <-- chain->block level
        
        // parse all the TXs
        for (const extrinsic of extrinsics) {
          // <-- chain->block->tx level

          // find all unique addresses in the extrinsic
          const signerAddressFormatted = formatAddress(extrinsic.signer)
          const relatedAddressesFormatted = this.filterAddresses(extrinsic)

          // find the fee
          const fee = this.attemptToDetermineFee(extrinsic)

          // store the events
          // should really store the events in a seperate DB
          // and should store them in some sort of JSON (or normalised) way
          const events = JSON.stringify(extrinsic.substrate_events);
          
          // if we're good to go, insert the TX
          await ctx.store.upsert(Transaction, {
            "id": `${Date.parse(extrinsic.created_at)}--${extrinsic.id}--${chainId}`, // 2022-06-04T12:19:20.296000Z,
            "extrinsicId": extrinsic.id,
            "chainId" : chainId,
            "chain" : chainId,
            "ss58Format" : ss58Format,
            "blockNumber" : extrinsic.blockNumber,
            "indexInBlock" : extrinsic.indexInBlock,
            "createdAt" : extrinsic.created_at,
            "section" : extrinsic.section,
            "method" : extrinsic.method,
            "name" : extrinsic.name,
            "signer" : signerAddressFormatted,
            "relatedAddresses" : relatedAddressesFormatted,
            "fee" : fee,
            "events" : events
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

  filterAddresses(extrinsic){
    // pluck all address looking things from the full extrinsic
    const matches = JSON.stringify(extrinsic).matchAll( /[a-zA-Z0-9]{47}/g )
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

  // --- Attempt to Determine the TX Fee based ---
  // not sure how we're going to do this with all TXs
  // we know that balances.transfer throws an event with
  // balances.Withdraw as the fee, but is this the same for all TXs?
  // do we need to have an index of all extrinsics with their associated events
  // in order to determine the fees?
  // ideally we want to store all the raw data here and do the fee parsing on the lookup
  // then we wouldn't need to re-build all the data each time we changed anything
  attemptToDetermineFee(extrinsic){

    let fee = BigInt(0)

    // we need a way to map balances.transfer and balances.Withdraw.params[0]
    // could use a simple lookup table + lodash get
    if(extrinsic.name === 'balances.transfer'){
      const feeEvent = extrinsic.substrate_events.find(event => {
        if(event.name === 'balances.Withdraw'){
          return true
          //return BigInt(event.params[1].value)
        }
        return false
      })

      if (feeEvent){
        fee = BigInt(feeEvent.params[1].value)
      }
    }

    return fee
  }
}