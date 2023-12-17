import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createRedis_mock } from "../../src/instances/redis.js";

describe("TestRedis", async () => {
  const redis = await createRedis_mock();

  it("simple", async () => {
    const key = "foo";
    await redis.set(key, 1);
    const found = await redis.get(key);
    assert.equal(found, "1");
  });
});
