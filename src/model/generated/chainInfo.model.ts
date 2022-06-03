import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class ChainInfo {
  constructor(props?: Partial<ChainInfo>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  url!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  latestBlock!: bigint
}
