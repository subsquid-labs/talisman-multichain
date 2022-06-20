import { Arg, Query, ObjectType, Field, Resolver } from 'type-graphql'
import type { EntityManager } from 'typeorm'
import { Chain } from "../../model";
import { request, gql } from 'graphql-request'

const bcrypt = require('bcryptjs');

const API_KEY = '$2a$10$uq3vg0DnhqMptxz1XJRIsuan2WNJwBrFGrY6q3h.yidTq8fGtq6au'


// the query to fetch the TXs based on address
const INSERT_CHAIN = `
  INSERT INTO chain (
    id,
    url,
    ss58_format,
    starting_block,
    latest_block,
    hash,
    created_at,
    updated_at
  )
  VALUES(
    $1,
    $2,
    $3,
    $4,
    $4,
    $5,
    $6,
    $6
  )
`

@ObjectType()
export class MutationResult {
  constructor(props?: Partial<MutationResult>) {
    Object.assign(this, props)
  }

  @Field(() => Boolean)
  success!: boolean

  @Field(() => Boolean)
  error!: boolean

  @Field(() => String)
  message!: string
}

@Resolver()
export class ChainResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => MutationResult)
  async addChain(
    @Arg('chainId', { nullable: true }) chainId: string,
    @Arg('ss58Format', { nullable: true }) ss58Format: number,
    @Arg('startBlock', { nullable: true, defaultValue: 0 }) startBlock: number,
    @Arg('apiKey', { nullable: true }) apiKey: string
  ): Promise<MutationResult> {
    const manager = await this.tx()

    try {
      
      // make sure the user has the correct apikey
      // todo: include this as part of the .evn vars on the prod server if possible 
      if(!bcrypt.compareSync(apiKey, API_KEY)) throw new Error(`Incorrect apiKey`)

      // check if we can resolve the URL by running a query
      const url = `https://${chainId}.indexer.gc.subsquid.io/v4/graphql`
      const block = 0
      const BLOCK_QUERY = gql`
        query {
          substrate_block(limit: 1, where: {height : {_eq: 0}}) {
            height
          }
        }
      `

      //console.log(url)
      
      const result = await request(url, BLOCK_QUERY)

      console.log(result)
      
      throw new Error(`weeeeee`)
      
      // make sure the ss58Format is in range
      

      // create a timestamp
      const timestamp = BigInt((new Date()).getTime())

      // add result into DB
      manager.insert(Chain, {
        "id": chainId,
        "url": url,
        "ss58Format": ss58Format,
        "startingBlock": BigInt(startBlock||0),
        "latestBlock": BigInt(startBlock||0),
        "hash": '__INSERTED__',
        "createdAt": timestamp,
        "updatedAt": timestamp
      })

      return {
        success: true,
        error: false,
        message: 'New chain added'
      }
    } catch (error) {
      return {
        success: false,
        error: true,
        message: error.message
      }
    }
 
    
  }
}