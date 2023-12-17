import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { TestDatabase } from "./framework.js";

describe("TestDatabase", async () => {
  const db = await TestDatabase.prepare();
  before(async () => TestDatabase.create(db));
  after(async () => TestDatabase.destroy(db));

  it("simple", async () => {
    const founds = await db.selectFrom("functionUrl").selectAll().execute();
    assert.equal(founds.length, 0);
  });
});
