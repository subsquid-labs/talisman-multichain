import { TChainConfig } from './types'
import { gql } from 'graphql-request'

// the current squid block to start on
// wish we could define this as -1 to start from the current block
export const START_BLOCK = 10725538

// the number of blocks to query at once
export const BLOCK_LIMIT = 10

// hardcoded list of chains we're interested in.
// this should be dynamically pulled from somewhere in
// a future version as to require manual updates
export const chains: TChainConfig[] = [
  {
    "chainId": "polkadot",
    "url": "https://polkadot.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": START_BLOCK
  },
  // {
  //   "chainId": "kusama",
  //   "url": "https://kusama.indexer.gc.subsquid.io/v4/graphql",
  //   "startBlock": 12964919
  // },
]

// todo
export const BLOCK_QUERY = gql`
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