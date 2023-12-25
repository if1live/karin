import assert from "node:assert/strict";
import { faker } from "@faker-js/faker";
import { describe, it } from "vitest";
import { QueueService } from "../../../src/features/queue/services/QueueService.js";
import { MyMessage } from "../../../src/features/queue/types.js";
import { createRedis_mock } from "../../../src/instances/redis.js";

describe("QueueService", async () => {
  const redis = await createRedis_mock();
  const queueName = faker.string.alphanumeric(10);
  const s = new QueueService(redis, queueName);

  const message_a: MyMessage = {
    body: "a",
    id: faker.string.uuid(),
  };
  const message_b: MyMessage = {
    body: "b",
    id: faker.string.uuid(),
  };
  const message_c: MyMessage = {
    body: "c",
    id: faker.string.uuid(),
  };

  const now = new Date();

  it("enqueue", async () => {
    await s.enqueueAsync({ message: message_b, delaySeconds: 1 }, now);
    await s.enqueueAsync({ message: message_c, delaySeconds: 2 }, now);
    await s.enqueueAsync({ message: message_a, delaySeconds: 0 }, now);

    const result = await s.inspect();
    assert.equal(result.len, 3);
  });

  it("peek: 지연되지 않은 메세지", async () => {
    const founds = await s.peek(now, 1);
    assert.equal(founds.length, 1);

    const first = founds[0];
    assert.deepEqual(first?.message, message_a);
  });

  it("peek: message > count", async () => {
    const founds = await s.peek(new Date(now.getTime() + 1001), 1);
    assert.equal(founds.length, 1);

    const first = founds[0];
    assert.deepEqual(first?.message, message_a);
  });

  it("peek: message < count", async () => {
    const founds = await s.peek(new Date(now.getTime() + 1001), 3);
    assert.equal(founds.length, 2);

    const [first, second] = founds;
    assert.deepEqual(first?.message, message_a);
    assert.deepEqual(second?.message, message_b);
  });

  it("delete", async () => {
    const x = await s.del(message_b.id);

    const result = await s.inspect();
    assert.equal(result.len, 2);
  });

  it("get: found", async () => {
    const data = await s.get(message_a.id);
    assert.deepEqual(data?.message, message_a);
  });

  it("get: not found", async () => {
    const data = await s.get(message_b.id);
    assert.equal(data, null);
  });

  it("purge", async () => {
    await s.purge();
    const result = await s.inspect();
    assert.equal(result.len, 0);
  });

  describe("loadReservedAt", () => {
    const queueName = faker.string.alphanumeric(10);
    const s = new QueueService(redis, queueName);

    it("empty", async () => {
      const actual = await s.loadReservedAt();
      assert.equal(actual, undefined);
    });

    it("not empty", async () => {
      await s.enqueueAsync({ message: message_c, delaySeconds: 2 }, now);
      await s.enqueueAsync({ message: message_b, delaySeconds: 1 }, now);

      const actual = await s.loadReservedAt();
      assert.deepEqual(actual, new Date(now.getTime() + 1_000));
    });
  });
});
