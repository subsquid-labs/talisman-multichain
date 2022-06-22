/* eslint-disable prettier/prettier */
import { gql } from 'graphql-request'
import { TChainConfig } from './chainStore'

// the current squid block to start on
// wish we could define this as -1 to start from the current block
export const START_BLOCK = 10846998

// the number of blocks to query at once
export const BLOCK_LIMIT = 20

// hardcoded list of chains we're interested in.
// this should be dynamically pulled from somewhere in
// a future version as to require manual updates
// --- to find the data we need
// https://github.com/TalismanSociety/chaindata/blob/main/chaindata.json
// https://github.com/subsquid/archive-registry/blob/b48905e6fa09d16c724d6b53ae1120189546912e/archives.json
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
    "startBlock": 13237318
  },
  {
    "chainId": "acala",
    "ss58Format": 10,
    "url": "https://acala.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": 1278252
  },
  {
    "chainId": "astar",
    "ss58Format": 5,
    "url": "https://astar-beta.indexer.gc.subsquid.io/v4/graphql",
    "startBlock": 1286238
  }
]