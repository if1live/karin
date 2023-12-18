import assert from "node:assert/strict";
import { afterAll, beforeAll, describe, it } from "vitest";
import { TestDatabase } from "./framework.js";

describe("TestDatabase", async () => {
  const db = await TestDatabase.prepare();
  beforeAll(async () => TestDatabase.create(db));
  afterAll(async () => TestDatabase.destroy(db));

  it("simple", async () => {
    const founds = await db.selectFrom("functionUrl").selectAll().execute();
    assert.equal(founds.length, 0);
  });
});
