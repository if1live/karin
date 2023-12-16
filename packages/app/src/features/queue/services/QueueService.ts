import { Redis } from "ioredis";
import { Message } from "../types.js";

const createQueueKey = (queueName: string) => `karin:queue:${queueName}`;
const createMessageKey = (id: string) => `karin:message:${id}`;

const ttl_message = 14 * 24 * 3600;

export class QueueService {
  public readonly queueKey: string;

  constructor(private readonly redis: Redis, queueName: string) {
    this.queueKey = createQueueKey(queueName);
  }

  async enqueue(
    message: Message,
    params: {
      delaySeconds: number;
      now: Date;
    },
  ) {
    const { delaySeconds, now } = params;
    const ts_active = now.getTime() + delaySeconds * 1000;
    const text = JSON.stringify(message);

    const { messageId } = message;
    const messageKey = createMessageKey(messageId);

    const pipeline = this.redis.pipeline();
    pipeline.zadd(this.queueKey, ts_active, messageId);
    pipeline.setex(messageKey, ttl_message, text);
    await pipeline.exec();
  }

  /**
   *
   * @param now
   * @param count batch size 대응하려면 n개씩 가져올 방법이 필요
   * @returns
   */
  async peek(now: Date, count: number) {
    const ts_active = now.getTime();
    const ids = await this.redis.zrangebyscore(
      this.queueKey,
      "-inf",
      ts_active,
      "LIMIT",
      0,
      count,
    );
    if (ids.length < 0) {
      return [];
    }

    return await this.mget(ids);
  }

  async get(id: string) {
    const founds = await this.mget([id]);
    return founds[0] ?? null;
  }

  async mget(ids: string[]) {
    const keys = ids.map((id) => createMessageKey(id));
    const founds = await this.redis.mget(keys);

    const results = [];
    for (let i = 0; i < ids.length; i++) {
      const text = founds[i] ?? null;
      const message = text ? Message.parse(JSON.parse(text)) : null;
      results.push(message);
    }

    return results;
  }

  async del(id: string) {
    const messageKey = createMessageKey(id);
    const pipeline = this.redis.pipeline();
    pipeline.zrem(this.queueKey, id);
    pipeline.del(messageKey);
    await pipeline.exec();
  }

  async purge() {
    return await this.redis.del(this.queueKey);
  }

  async inspect() {
    const len = await this.redis.zcount(this.queueKey, "-inf", "+inf");
    return { len };
  }
}
