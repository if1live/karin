import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { TestDatabase, TestRedis } from "./framework.js";

describe("TestDatabase", async () => {
  const db = await TestDatabase.prepare();
  before(async () => TestDatabase.create(db));
  after(async () => TestDatabase.destroy(db));

  it("simple", async () => {
    const founds = await db.selectFrom("functionUrl").selectAll().execute();
    assert.equal(founds.length, 0);
  });
});

describe("TestRedis", () => {
  const redis = TestRedis.create();

  it("simple", async () => {
    const key = "foo";
    await redis.set(key, 1);
    const found = await redis.get(key);
    assert.equal(found, "1");
  });
});
