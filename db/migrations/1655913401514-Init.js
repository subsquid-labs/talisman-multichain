module.exports = class Init1655913401514 {
  name = 'Init1655913401514'

  async up(db) {
    await db.query(`CREATE TABLE "chain" ("id" character varying NOT NULL, "url" text NOT NULL, "starting_block" numeric NOT NULL, "latest_block" numeric NOT NULL, "hash" text NOT NULL, "ss58_format" integer NOT NULL, "created_at" numeric NOT NULL, "updated_at" numeric NOT NULL, CONSTRAINT "PK_8e273aafae283b886672c952ecd" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "transaction" ("id" character varying NOT NULL, "extrinsic_id" text NOT NULL, "chain_id" character varying NOT NULL, "ss58_format" integer NOT NULL, "block_number" numeric NOT NULL, "index_in_block" numeric NOT NULL, "created_at" text NOT NULL, "section" text NOT NULL, "method" text NOT NULL, "name" text NOT NULL, "signer" text NOT NULL, "related_addresses" text array NOT NULL, "fee" numeric NOT NULL, "events" text NOT NULL, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_45d29ac87dac85293d3c4ab6bd" ON "transaction" ("chain_id") `)
    await db.query(`CREATE TABLE "query_log" ("id" character varying NOT NULL, "block_number" numeric NOT NULL, "start_time" numeric NOT NULL, "end_time" numeric NOT NULL, "length_ms" integer NOT NULL, "chain_count" integer NOT NULL, "chain_ids" text array NOT NULL, "tx_count" integer NOT NULL, "tx_size" integer NOT NULL, CONSTRAINT "PK_2dcb03c735e758040860d71f9e7" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "metadata" ("id" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "PK_56b22355e89941b9792c04ab176" PRIMARY KEY ("id"))`)
    await db.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "chain"`)
    await db.query(`DROP TABLE "transaction"`)
    await db.query(`DROP INDEX "public"."IDX_45d29ac87dac85293d3c4ab6bd"`)
    await db.query(`DROP TABLE "query_log"`)
    await db.query(`DROP TABLE "metadata"`)
    await db.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda"`)
  }
}
