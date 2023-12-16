import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { faker } from "@faker-js/faker";
import { QueueService } from "../../../src/features/queue/services/QueueService.js";
import { Message } from "../../../src/features/queue/types.js";
import { TestRedis } from "../../framework.js";

describe("QueueService", () => {
  const redis = TestRedis.create();
  const queueName = faker.string.alphanumeric(10);
  const s = new QueueService(redis, queueName);

  const message_a: Message = {
    body: "a",
    messageId: faker.string.uuid(),
  };
  const message_b: Message = {
    body: "b",
    messageId: faker.string.uuid(),
  };
  const message_c: Message = {
    body: "c",
    messageId: faker.string.uuid(),
  };

  const now = new Date();

  it("enqueue", async () => {
    await s.enqueue(message_b, { delaySeconds: 1, now });
    await s.enqueue(message_c, { delaySeconds: 2, now });
    await s.enqueue(message_a, { delaySeconds: 0, now });

    const result = await s.inspect();
    assert.equal(result.len, 3);
  });

  it("peek: 지연되지 않은 메세지", async () => {
    const founds = await s.peek(now, 1);
    assert.equal(founds.length, 1);

    const first = founds[0];
    assert.deepEqual(first, message_a);
  });

  it("peek: message > count", async () => {
    const founds = await s.peek(new Date(now.getTime() + 1001), 1);
    assert.equal(founds.length, 1);

    const first = founds[0];
    assert.deepEqual(first, message_a);
  });

  it("peek: message < count", async () => {
    const founds = await s.peek(new Date(now.getTime() + 1001), 3);
    assert.equal(founds.length, 2);

    const [first, second] = founds;
    assert.deepEqual(first, message_a);
    assert.deepEqual(second, message_b);
  });

  it("delete", async () => {
    const x = await s.del(message_b.messageId);
    console.log(x);

    const result = await s.inspect();
    assert.equal(result.len, 2);
  });

  it("get: found", async () => {
    const data = await s.get(message_a.messageId);
    assert.deepEqual(data, message_a);
  });

  it("get: not found", async () => {
    const data = await s.get(message_b.messageId);
    assert.equal(data, null);
  });

  it("purge", async () => {
    await s.purge();
    const result = await s.inspect();
    assert.equal(result.len, 0);
  });
});