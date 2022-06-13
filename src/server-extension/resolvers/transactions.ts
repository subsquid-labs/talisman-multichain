import { Arg, Field, ObjectType, Query, Resolver } from 'type-graphql'
import type { EntityManager } from 'typeorm'
import { Transaction as TransactionModel } from "../../model";
import { bigint } from '../../model/generated/marshal';

const defaultCount = 10

@ObjectType()
export class Transaction {
  constructor(props?: Partial<Transaction>) {
    Object.assign(this, props)
  }

  @Field(() => String, { nullable: true })
  chain_id!: string

  @Field(() => BigInt, { nullable: true })
  block_number!: bigint

  @Field(() => Date, { nullable: true })
  created_at!: Date

  @Field(() => String, { nullable: true })
  section!: string

  @Field(() => String, { nullable: true })
  method!: string

  @Field(() => [String], { nullable: true })
  related_addresses!: (string)[]
}


@Resolver()
export class TransactionResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => [Transaction])
  async transactionsByAccount(
    @Arg('count', { nullable: true, defaultValue: defaultCount }) count: number,
    @Arg('lastId', { nullable: true, defaultValue: '999999999999999999999' }) lastId: string
  ): Promise<Transaction[]> {
    const manager = await this.tx()
    
    const query = `
      SELECT * FROM transaction
      WHERE method = 'set'
      AND id < $1
      ORDER BY id DESC
      LIMIT $2
    `
    // limit to batches of 5, 10 or 20
    // default to 10 if count is not defined correctly
    if(![5, 10, 20].includes(count)) count = defaultCount
    
    // fetch the result
    const result = await manager.getRepository(TransactionModel).query(query, [lastId, count])

    //
    const resultFormatted = result.map((item: Transaction) => {
      return {
        ...item,
        chainId: item.chain_id,
        blockNumber: item.block_number,
        createdAt: item.created_at,
        relatedAddresses: item.related_addresses,
      }
    })

    return resultFormatted as Transaction[]
  }
}