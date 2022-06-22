//import { encodeAddress } from '@polkadot/util-crypto'

// substrate format
//const ss58Format = 42

// encode, lowercase and return any address by type and format
export const formatAddress = (address: string | Uint8Array) => {
  //return encodeAddress(address, ss58Format)
  return address as string
}