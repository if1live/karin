import { ChainableCommander, Redis } from "ioredis";
import * as R from "remeda";
import {
  MyMessage,
  MyMessageHeader,
  QueueNotification,
  queueNotifyChannel,
} from "../types.js";

const createQueueKey = (queueName: string) => `karin:queue:${queueName}`;
const createMessageKey = (id: string) => `karin:message:${id}`;

const ttl_message = 14 * 24 * 3600;

interface EnqueueInput {
  message: MyMessage;
  delaySeconds: number;
}

export class QueueService {
  public readonly queueKey: string;

  constructor(
    private readonly redis: Redis,
    private readonly queueName: string,
  ) {
    this.queueKey = createQueueKey(queueName);
  }

  async enqueueAsync(input: EnqueueInput, now: Date) {
    const pipeline = this.redis.pipeline();
    this.enqueuePipeline(pipeline, input, now);
    await pipeline.exec();
  }

  enqueuePipeline(
    pipeline: ChainableCommander,
    input: EnqueueInput,
    now: Date,
  ): ChainableCommander {
    const { message, delaySeconds } = input;
    const ts_active = now.getTime() + delaySeconds * 1000;

    const header: MyMessageHeader = {
      ts_sent: now.getTime(),
    };
    const payload = {
      ...message,
      ...header,
    };
    const text = JSON.stringify(payload);

    const { id } = message;
    const messageKey = createMessageKey(id);

    pipeline.zadd(this.queueKey, ts_active, id);
    pipeline.setex(messageKey, ttl_message, text);

    return pipeline;
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

    if (ids.length <= 0) {
      return [];
    }

    // mget은 redis mget을 베낀거라서 null이 포함된다.
    // peek에서는 null을 숨기고 싶어서 떔질
    const founds = await this.mget(ids);
    return founds.filter(R.isNonNull);
  }

  async get(id: string) {
    const founds = await this.mget([id]);
    return founds[0] ?? null;
  }

  async mget(ids: string[]) {
    const keys = ids.map((id) => createMessageKey(id));
    if (keys.length <= 0) {
      return [];
    }

    const founds = await this.redis.mget(keys);

    const results = [];
    for (let i = 0; i < ids.length; i++) {
      const text = founds[i] ?? null;
      if (text === null) {
        results.push(null);
      } else {
        const obj = JSON.parse(text);
        const message = MyMessage.parse(obj);
        const header = MyMessageHeader.parse(obj);
        results.push({ message, header });
      }
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

  async mdel(ids: string[]) {
    const keys = ids.map((id) => createMessageKey(id));
    const pipeline = this.redis.pipeline();
    pipeline.zrem(this.queueKey, ...ids);
    pipeline.del(...keys);
    await pipeline.exec();
  }

  async purge() {
    return await this.redis.del(this.queueKey);
  }

  async inspect() {
    const len = await this.redis.zcount(this.queueKey, "-inf", "+inf");
    return { len };
  }

  notifyPipeline(
    pipeline: ChainableCommander,
    count: number,
    delaySeconds: number,
    now: Date,
  ): ChainableCommander {
    const notification: QueueNotification = {
      queueName: this.queueName,
      count,
      sentAt: now,
      reservedAt: new Date(now.getTime() + delaySeconds * 1000),
    };
    const m = JSON.stringify(notification);
    pipeline.publish(queueNotifyChannel, m);
    return pipeline;
  }
}
