import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class QueryLog {
  constructor(props?: Partial<QueryLog>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  blockNumber!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  startTime!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  endTime!: bigint

  @Column_("integer", {nullable: false})
  lengthMs!: number

  @Column_("integer", {nullable: false})
  chainCount!: number

  @Column_("integer", {nullable: false})
  txCount!: number
}
