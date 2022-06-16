import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Chain} from "./chain.model"

@Entity_()
export class Transaction {
  constructor(props?: Partial<Transaction>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  chainId!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  blockNumber!: bigint

  @Column_("timestamp with time zone", {nullable: false})
  createdAt!: Date

  @Column_("text", {nullable: false})
  section!: string

  @Column_("text", {nullable: false})
  method!: string

  @Column_("text", {nullable: false})
  name!: string

  @Column_("text", {nullable: false})
  signer!: string

  @Column_("text", {array: true, nullable: false})
  relatedAddresses!: (string)[]

  @Index_()
  @ManyToOne_(() => Chain, {nullable: false})
  chain!: Chain
}
