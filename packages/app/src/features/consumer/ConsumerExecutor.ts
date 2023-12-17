import { setTimeout } from "node:timers/promises";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { Redis } from "ioredis";
import { lambdaClient } from "../../instances/aws.js";
import { redis } from "../../instances/redis.js";
import { EventSourceMappingModel } from "../lookup/models.js";
import { InvokeActor } from "./InvokeActor.js";

export class ConsumerExecutor {
  private map: Map<string, InvokeActor> = new Map();

  constructor(
    private readonly redis: Redis,
    private readonly client: LambdaClient,
  ) {}

  add(mapping: EventSourceMappingModel) {
    const state = {
      uuid: mapping.uuid,
      queueName: mapping.display_eventSourceArn,
      functionName: mapping.display_functionArn,
      batchSize: mapping.batchSize ?? 10,
      tick: 0,
    };
    const actor = new InvokeActor(state, this.redis, this.client);
    this.map.set(mapping.uuid, actor);
  }

  remove(uuid: string) {
    this.map.delete(uuid);
  }

  inspect() {
    const actors = Array.from(this.map.values());
    return actors.map((x) => x.inspect());
  }

  async tick() {
    const actors = [...this.map.values()];
    await Promise.allSettled(actors.map((x) => x.tick()));
  }

  async main() {
    while (true) {
      const date_start = new Date();
      await this.tick();
      const date_finish = new Date();

      const ts_start = date_start.getTime();
      const ts_finish = date_finish.getTime();

      const ts_delta = ts_finish - ts_start;

      let millis = 1000 - ts_delta;
      if (millis < 0) {
        millis = 10;
      }

      // console.log(`[executor] sleep: ${millis}ms`);
      await setTimeout(millis);
    }
  }
}

export const executor = new ConsumerExecutor(redis, lambdaClient);
