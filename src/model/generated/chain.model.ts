import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Chain {
  constructor(props?: Partial<Chain>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  url!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  startingBlock!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  latestBlock!: bigint

  @Column_("text", {nullable: false})
  hash!: string

  @Column_("int4", {nullable: false})
  ss58Format!: number

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  createdAt!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  updatedAt!: bigint
}
