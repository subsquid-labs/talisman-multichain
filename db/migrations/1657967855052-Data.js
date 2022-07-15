module.exports = class Data1657967855052 {
  name = 'Data1657967855052'

  async up(db) {
    await db.query(`CREATE TABLE "chain" ("id" character varying NOT NULL, "latest_block" integer NOT NULL, "ss58_format" integer NOT NULL, CONSTRAINT "PK_8e273aafae283b886672c952ecd" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "transaction" ("id" character varying NOT NULL, "chain_id" character varying NOT NULL, "extrinsic_hash" text NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "index_in_block" integer NOT NULL, "section" text NOT NULL, "method" text NOT NULL, "name" text NOT NULL, "signer" text NOT NULL, "fee" numeric, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_45d29ac87dac85293d3c4ab6bd" ON "transaction" ("chain_id") `)
    await db.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "chain"`)
    await db.query(`DROP TABLE "transaction"`)
    await db.query(`DROP INDEX "public"."IDX_45d29ac87dac85293d3c4ab6bd"`)
    await db.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda"`)
  }
}
