/* eslint-disable prettier/prettier */
import { gql } from 'graphql-request'
import { TChainConfig } from './types'

// the current squid block to start on
// wish we could define this as -1 to start from the current block
export const START_BLOCK = 10740322

// the number of blocks to query at once
export const BLOCK_LIMIT = 20

// hardcoded list of chains we're interested in.
// this should be dynamically pulled from somewhere in
// a future version as to require manual updates
export const chains: TChainConfig[] = [
  {
    "chainId": "polkadot",
    "url": "https://polkadot.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": START_BLOCK
  },
  {
    "chainId": "kusama",
    "url": "https://kusama.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": 13125230
  }
]

