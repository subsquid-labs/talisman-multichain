module.exports = class Init1655179128037 {
  name = 'Init1655179128037'

  async up(db) {
    await db.query(`CREATE TABLE "transaction" ("id" character varying NOT NULL, "chain_id" text NOT NULL, "block_number" numeric NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "section" text NOT NULL, "method" text NOT NULL, "related_addresses" text array NOT NULL, "raw" text NOT NULL, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "query_log" ("id" character varying NOT NULL, "block_number" numeric NOT NULL, "start_time" numeric NOT NULL, "end_time" numeric NOT NULL, "length_ms" integer NOT NULL, "chain_count" integer NOT NULL, "tx_count" integer NOT NULL, CONSTRAINT "PK_2dcb03c735e758040860d71f9e7" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "chain_info" ("id" character varying NOT NULL, "url" text NOT NULL, "latest_block" numeric NOT NULL, "hash" text NOT NULL, CONSTRAINT "PK_1b82ce2acbc16bfc7f84bfdc8ff" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "metadata" ("id" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "PK_56b22355e89941b9792c04ab176" PRIMARY KEY ("id"))`)
  }

  async down(db) {
    await db.query(`DROP TABLE "transaction"`)
    await db.query(`DROP TABLE "query_log"`)
    await db.query(`DROP TABLE "chain_info"`)
    await db.query(`DROP TABLE "metadata"`)
  }
}
