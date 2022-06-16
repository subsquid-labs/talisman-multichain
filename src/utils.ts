import { Keyring } from '@polkadot/keyring';

// substrate format
const type = 'sr25519'
const ss58Format = 42

// init the keyring
const keyring = new Keyring({ type, ss58Format });

// encode, lowercase and return any address by type and format
export const formatAddress = (address: string | Uint8Array) => {
  return keyring.encodeAddress(address)
}