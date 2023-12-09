import { strict as assert } from "node:assert";
import { after, before, describe, it } from "node:test";
import { Generated, Selectable, SqliteAdapter, sql } from "kysely";
import { createKysely, selectDialect } from "../../src/instances/rdbms.js";
import { Json } from "../../src/tables.js";

interface User {
  id: Generated<number>;
  name: string;
  json: Json;
}

interface Database {
  user: User;
}

describe("rdbms", async () => {
  const dialect = await selectDialect()();
  const db = createKysely<Database>(dialect);

  before(async () => {
    await db.schema
      .createTable("user")
      .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
      .addColumn("name", "varchar(255)", (col) => col.notNull().unique())
      .addColumn("json", "json")
      .execute();
  });

  after(async () => {
    await db.destroy();
  });

  it("sqlite", () => {
    const adapter = db.getExecutor().adapter;
    assert.ok(adapter instanceof SqliteAdapter === true);
  });

  it("insert", async () => {
    // JSON.stringify() 거치지 않으면 에러 발생
    // TypeError [Error]: SQLite3 can only bind numbers, strings, bigints, buffers, and null
    await db
      .insertInto("user")
      .values({ name: "foo", json: JSON.stringify(["a"]) })
      .execute();

    // null은 그냥 넣어도 잘 들어간다.
    await db.insertInto("user").values({ name: "bar", json: null }).execute();
  });

  it("find all", async () => {
    const founds = await db.selectFrom("user").selectAll().execute();
    assert.equal(founds.length, 2);
  });

  it("find: foo", async () => {
    const found_foo = await db
      .selectFrom("user")
      .where("name", "=", "foo")
      .selectAll()
      .executeTakeFirstOrThrow();

    assert.equal(found_foo.name, "foo");
    assert.deepEqual(found_foo.json, ["a"]);
  });

  it("find: bar", async () => {
    const found_bar = await db
      .selectFrom("user")
      .where("name", "=", "bar")
      .selectAll()
      .executeTakeFirstOrThrow();

    assert.equal(found_bar.name, "bar");
    assert.equal(found_bar.json, null);
  });

  it("raw query", async () => {
    type Row = { v: number };
    const compiledQuery =
      sql<Row>`select 1+2 as v, datetime('now') as now`.compile(db);
    const output = await db.executeQuery(compiledQuery);
    assert.equal(output.rows[0]?.v, 3);
  });
});
