module.exports = class Init1654101556934 {
  name = 'Init1654101556934'

  async up(db) {
    await db.query(`CREATE TABLE "historical_balance" ("id" character varying NOT NULL, "balance" numeric NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "account_id" character varying NOT NULL, CONSTRAINT "PK_74ac29ad0bdffb6d1281a1e17e8" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_383ff006e4b59db91d32cb891e" ON "historical_balance" ("account_id") `)
    await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, "balance" numeric NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "tx_state" ("id" character varying NOT NULL, "chain_id" text NOT NULL, "block_number" numeric NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "section" text NOT NULL, "method" text NOT NULL, "related_addresses" text array NOT NULL, CONSTRAINT "PK_dad76f5ddb054e954b6d5aaf23b" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "query_log" ("id" character varying NOT NULL, "block_number" numeric NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE NOT NULL, "length_ms" integer NOT NULL, "chain_count" integer NOT NULL, "tx_count" integer NOT NULL, CONSTRAINT "PK_2dcb03c735e758040860d71f9e7" PRIMARY KEY ("id"))`)
    await db.query(`ALTER TABLE "historical_balance" ADD CONSTRAINT "FK_383ff006e4b59db91d32cb891e9" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "historical_balance"`)
    await db.query(`DROP INDEX "public"."IDX_383ff006e4b59db91d32cb891e"`)
    await db.query(`DROP TABLE "account"`)
    await db.query(`DROP TABLE "tx_state"`)
    await db.query(`DROP TABLE "query_log"`)
    await db.query(`ALTER TABLE "historical_balance" DROP CONSTRAINT "FK_383ff006e4b59db91d32cb891e9"`)
  }
}
