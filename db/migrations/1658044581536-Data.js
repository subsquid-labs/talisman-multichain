module.exports = class Data1658044581536 {
  name = 'Data1658044581536'

  async up(db) {
    await db.query(`CREATE INDEX "IDX_2d99bb5a0ab5fb8cf8b746eb39" ON "transaction" ("block_number") `)
    await db.query(`CREATE INDEX "IDX_87f2932d4a558d44a2915f849a" ON "transaction" ("timestamp") `)
    await db.query(`CREATE INDEX "IDX_2e2ff311bcce6731fdc13d960e" ON "transaction" ("section") `)
    await db.query(`CREATE INDEX "IDX_366e048315512cdd2d46dd210e" ON "transaction" ("method") `)
    await db.query(`CREATE INDEX "IDX_09fa7a1d3624cbeaa7174ba573" ON "transaction" ("name") `)
    await db.query(`CREATE INDEX "IDX_8b99ecb6087c6696bd18e9c9b4" ON "transaction" ("signer") `)
  }

  async down(db) {
    await db.query(`DROP INDEX "public"."IDX_2d99bb5a0ab5fb8cf8b746eb39"`)
    await db.query(`DROP INDEX "public"."IDX_87f2932d4a558d44a2915f849a"`)
    await db.query(`DROP INDEX "public"."IDX_2e2ff311bcce6731fdc13d960e"`)
    await db.query(`DROP INDEX "public"."IDX_366e048315512cdd2d46dd210e"`)
    await db.query(`DROP INDEX "public"."IDX_09fa7a1d3624cbeaa7174ba573"`)
    await db.query(`DROP INDEX "public"."IDX_8b99ecb6087c6696bd18e9c9b4"`)
  }
}
