import { setTimeout } from "node:timers/promises";
import { LambdaClient } from "@aws-sdk/client-lambda";
import debug from "debug";
import { Redis } from "ioredis";
import * as R from "remeda";
import { lambdaClient } from "../../instances/aws.js";
import { redis, redis_sub } from "../../instances/redis.js";
import { EventSourceMappingModel } from "../lookup/models.js";
import { QueueNotification, queueNotifyChannel } from "../queue/types.js";
import { InvokeActor } from "./InvokeActor.js";

const log = debug("karin:consumer");

export class ConsumerExecutor {
  private map: Map<string, InvokeActor> = new Map();

  constructor(
    private readonly redis: Redis,
    private readonly client: LambdaClient,
  ) {}

  add(mapping: EventSourceMappingModel) {
    const now = new Date();
    const actor = new InvokeActor(
      {
        running: false,
        uuid: mapping.uuid,
        queueName: mapping.display_eventSourceArn,
        functionName: mapping.display_functionArn,
        batchSize: mapping.batchSize ?? 10,
        startedAt: now,
        executedAt: now,
        reservedAt: now,
      },
      {
        redis: this.redis,
        client: this.client,
      },
    );

    const name = mapping.display_eventSourceArn;
    this.map.set(name, actor);

    // loop start
    actor.startAsync().then(
      () => {},
      () => {},
    );
  }

  remove(name: string): boolean {
    const actor = this.map.get(name);
    if (!actor) {
      return false;
    }

    actor.stop();
    this.map.delete(name);
    return true;
  }

  inspect() {
    const actors = Array.from(this.map.values());
    return actors.map((x) => x.inspect());
  }

  async subscribe() {
    await redis_sub.subscribe(queueNotifyChannel, (err, count) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      log(`subscribed: ${queueNotifyChannel} count=${count}`);
    });

    redis_sub.on("message", async (channel, text) => {
      const obj = JSON.parse(text);
      const message = QueueNotification.parse(obj);

      const actor = this.map.get(message.queueName);
      if (!actor) {
        log(`actor not found: ${message.queueName}`);
        return;
      }

      actor.reserve(message.reservedAt);
      log(`reserved: ${message.queueName} ${message.reservedAt.toISOString()}`);
    });
  }

  async tick(now: Date) {
    const actors = [...this.map.values()].filter((x) => {
      const state = x.inspect();
      return InvokeActor.shouldExecute(state, now);
    });
    await Promise.allSettled(actors.map((x) => x.tick(now)));
  }
}

export const executor = new ConsumerExecutor(redis, lambdaClient);
