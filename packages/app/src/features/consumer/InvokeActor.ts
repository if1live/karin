import { LambdaClient } from "@aws-sdk/client-lambda";
import { Redis } from "ioredis";
import { QueueService } from "../queue/services/QueueService.js";
import { InvokeService } from "./InvokeService.js";

export interface State {
  // immutable
  uuid: string;
  queueName: string;
  functionName: string;
  batchSize: number;

  // mutable
  tick: number;
}

export class InvokeActor {
  private state: State;

  constructor(
    initial: State,
    private readonly redis: Redis,
    private readonly client: LambdaClient,
  ) {
    this.state = initial;
  }

  async tick() {
    this.state = await this.handle_tick(this.state);
  }

  async handle_tick(prev: State) {
    const now = new Date();

    const { queueName, functionName } = prev;
    const queue = new QueueService(this.redis, queueName);
    const records = await queue.peek(now, prev.batchSize);
    if (records.length <= 0) {
      // console.log(`[${queueName}/${prev.tick}] no records`);
      return {
        ...prev,
        tick: prev.tick + 1,
      };
    }

    const ids = records.map((x) => x.message.id);
    await queue.mdel(ids);

    // TODO: 실패 처리는 어떻게 하지?
    // TODO: executor는 실행 주기를 유지하고 싶다.
    // 함수 호출 자체는 다른 promise로 떠넘긴다
    const invoker = new InvokeService(this.client, queueName, functionName);
    invoker.invoke(records).then(
      (x) => console.log(x),
      (e) => console.error(e),
    );

    console.log(`[${queueName}/${prev.tick}] ${records.length} records`);
    return {
      ...prev,
      tick: prev.tick + 1,
    };
  }

  inspect() {
    return structuredClone(this.state);
  }
}
