import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Transactions {
  constructor(props?: Partial<Transactions>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  order!: string

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

  @Column_("text", {array: true, nullable: false})
  relatedAddresses!: (string)[]
}
