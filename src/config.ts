/* eslint-disable prettier/prettier */
import { gql } from 'graphql-request'
import { TChainConfig } from './chainStore'

// the current squid block to start on
// wish we could define this as -1 to start from the current block
export const START_BLOCK = 10830650

// the number of blocks to query at once
export const BLOCK_LIMIT = 20

// hardcoded list of chains we're interested in.
// this should be dynamically pulled from somewhere in
// a future version as to require manual updates
export const chains: TChainConfig[] = [
  {
    "chainId": "polkadot",
    "ss58Format": 0,
    "url": "https://polkadot.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": START_BLOCK
  },
  {
    "chainId": "kusama",
    "ss58Format": 2,
    "url": "https://kusama.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": 13221900
  }
]

