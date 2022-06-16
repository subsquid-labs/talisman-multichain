import { Enum } from '@polkadot/types';
import { Arg, Field, ObjectType, Query, Resolver } from 'type-graphql'
import type { EntityManager } from 'typeorm'
import { Transaction as TransactionModel } from "../../model";
import { formatAddress } from '../../utils'

// how many items to return at a time
const DEFAULT_COUNT = 10

// the query to fetch the TXs based on address
const QUERY_BY_ADDRESS = `
  SELECT * FROM transaction
  WHERE (
    $1 = ANY(related_addresses) OR
    $1 = signer
  )
  AND id < $2
  ORDER BY id DESC
  LIMIT $3
`

@ObjectType()
export class TransactionResult {
  constructor(props?: Partial<TransactionResult>) {
    Object.assign(this, props)
  }

  @Field(() => String)
  id!: string

  @Field(() => String)
  chainId!: string

  @Field(() => String)
  name!: string

  @Field(() => BigInt)
  blockNumber!: bigint

  @Field(() => Date)
  createdAt!: Date

  @Field(() => String)
  section!: string

  @Field(() => String)
  method!: string

  @Field(() => [String])
  relatedAddresses!: (string)[]

  @Field(() => String)
  signer!: string

  @Field(() => String)
  direction!: String
}

@Resolver()
export class TransactionResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => [TransactionResult])
  async transactionsByAccount(
    @Arg('address', { nullable: false }) address: string,
    @Arg('count', { nullable: true, defaultValue: DEFAULT_COUNT }) count: number,
    @Arg('lastId', { nullable: true, defaultValue: 'zzzzzzz' }) lastId: string,
  ): Promise<TransactionResult[]> {
    const manager = await this.tx()

    // encode the incoming address
    const addressEncoded = formatAddress(address)
  
    // limit to batches of 5, 10 or 20
    // default to 10 if count is not defined correctly
    if(![5, 10, 20].includes(count)) count = DEFAULT_COUNT
    
    // fetch the result
    const result = await manager.getRepository(TransactionModel).query(QUERY_BY_ADDRESS, [addressEncoded, lastId, count])

    // format results
    // some crazieness happening when trying to type 'item' as TransactionModel
    // leaving as 'any' for now
    const resultFormatted = result.map((item: any) => { 
      const formattedItem: TransactionResult = {
        id: item.id,
        chainId: item.chain_id,
        blockNumber: item.block_number,
        createdAt: item.created_at,
        relatedAddresses: item.related_addresses,
        name: item.name,
        section: item.section,
        method: item.method,
        signer: item.signer,
        direction: item.signer === addressEncoded ? 'OUTBOUND' : 'INBOUND'
      } as TransactionResult

      return formattedItem
    })

    return resultFormatted
  }
}