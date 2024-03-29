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

  @Index_()
  @ManyToOne_(() => Chain, {nullable: false})
  chain!: Chain

  @Column_("text", {nullable: false})
  extrinsicHash!: string

  @Index_()
  @Column_("int4", {nullable: false})
  blockNumber!: number

  @Index_()
  @Column_("timestamp with time zone", {nullable: false})
  timestamp!: Date

  @Column_("int4", {nullable: false})
  indexInBlock!: number

  @Index_()
  @Column_("text", {nullable: false})
  section!: string

  @Index_()
  @Column_("text", {nullable: false})
  method!: string

  @Index_()
  @Column_("text", {nullable: false})
  name!: string

  @Index_()
  @Column_("text", {nullable: false})
  signer!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  fee!: bigint | undefined | null
}
