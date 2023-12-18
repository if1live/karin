import assert from "node:assert/strict";
import { after } from "node:test";
import { setTimeout } from "node:timers/promises";
import { afterAll, beforeAll, describe, it } from "vitest";
import { redis, redis_sub } from "../../src/instances/redis.js";

describe("TestRedis", async () => {
  describe("simple", () => {
    const key = "foo";

    afterAll(async () => {
      await redis.del(key);
    });

    it("scenario", async () => {
      await redis.set(key, 1);
      const found = await redis.get(key);
      assert.equal(found, "1");
    });
  });

  describe("pub/sub", async () => {
    const ch = "sample-channel";

    beforeAll(async () => {
      await redis_sub.subscribe(ch, (err, count) => {
        if (err) {
          assert.fail(err);
        }
      });
    });

    afterAll(async () => {
      await redis_sub.unsubscribe(ch);
    });

    it("scenario", async () => {
      type Entry = readonly [string, string];
      let receivedMessages: Entry[] = [];
      redis_sub.on("message", (channel, message) => {
        const entry = [channel, message] as const;
        receivedMessages = [...receivedMessages, entry];
      });

      await redis.publish(ch, "a");
      await redis.publish(ch, "b");

      // delay 없으면 on message가 처리되지 않는다
      await setTimeout(10);

      assert.equal(receivedMessages.length, 2);
      assert.deepEqual(receivedMessages[0], [ch, "a"]);
      assert.deepEqual(receivedMessages[1], [ch, "b"]);
    });
  });
});
