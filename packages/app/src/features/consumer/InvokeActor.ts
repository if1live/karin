import { setTimeout } from "node:timers/promises";
import { LambdaClient } from "@aws-sdk/client-lambda";
import debug from "debug";
import { Redis } from "ioredis";
import { QueueService } from "../queue/services/QueueService.js";
import { InvokeService } from "./InvokeService.js";

const log = debug("karin:actor");

export interface State {
  running: boolean;

  // immutable. actor 생성 시점에 결정된다.
  uuid: string;
  queueName: string;
  functionName: string;
  batchSize: number;

  /** 작업 시작 시간. 사실상 immutable */
  startedAt: Date;

  /** 마지막으로 작업 처리된 시간 */
  executedAt: Date;

  /** 다음 작업 예정시간 */
  reservedAt: Date | null;
}

interface Bindings {
  redis: Redis;
  client: LambdaClient;
}

export class InvokeActor {
  private state: State;

  private readonly queue: QueueService;
  private readonly invoker: InvokeService;

  constructor(initial: State, bidnings: Bindings) {
    const { redis, client } = bidnings;
    const { queueName, functionName } = initial;

    this.state = initial;

    this.queue = new QueueService(redis, queueName);
    this.invoker = new InvokeService(client, queueName, functionName);
  }

  async startAsync() {
    this.state = { ...this.state, running: true };

    const logFn = log.extend(`${this.state.queueName}:loop`);
    while (this.state.running) {
      const date_start = new Date();
      await this.tick(date_start);
      const date_finish = new Date();

      const ts_start = date_start.getTime();
      const ts_finish = date_finish.getTime();

      const ts_delta = ts_finish - ts_start;

      let millis = 100 - ts_delta;
      if (millis < 0) {
        millis = 1;
      }

      // logFn(`sleep: ${millis}ms`);
      await setTimeout(millis);
    }
  }

  stop() {
    this.state = { ...this.state, running: false };
  }

  reserve(reservedAt: Date) {
    const logFn = log.extend(`${this.state.queueName}:reserve`);

    this.state = {
      ...this.state,
      reservedAt,
    };

    logFn(`${reservedAt.toISOString()}`);
  }

  static shouldExecute(state: State, now: Date) {
    // 마지막 실행으로부터 너무 오래 지난거같으면 처리
    // pub/sub 고장났을때의 안전장치
    const millis_last = now.getTime() - state.executedAt.getTime();
    if (millis_last > 60_000) {
      return true;
    }

    if (!state.reservedAt) {
      return false;
    }

    return state.reservedAt <= now;
  }

  async tick(now: Date) {
    let s = this.state;
    for (let i = 0; i < 100 && InvokeActor.shouldExecute(s, now); i++) {
      s = await this.handle_tick(this.state, now);
    }
    this.state = s;
  }

  async handle_tick(prev: State, now: Date): Promise<State> {
    const queue = this.queue;
    const invoker = this.invoker;

    const logFn = log.extend(`${prev.queueName}:tick`);

    const records = await queue.peek(now, prev.batchSize);
    if (records.length <= 0) {
      logFn(`${now.toISOString()}: no records`);
      const reservedAt = await queue.loadReservedAt();
      return {
        ...prev,
        executedAt: now,
        reservedAt: reservedAt ?? null,
      };
    }

    const ids = records.map((x) => x.message.id);
    await queue.mdel(ids);

    // TODO: 실패 처리는 어떻게 하지?
    // TODO: executor는 실행 주기를 유지하고 싶다.
    // 함수 호출 자체는 다른 promise로 떠넘긴다
    invoker.invoke(records).then(
      (x) => console.log(x),
      (e) => console.error(e),
    );
    logFn(`${now.toISOString()}: ${records.length} records`);

    // 큐가 비어질때까지 처리하려고 다음 실행시간 설정
    return {
      ...prev,
      executedAt: now,
      reservedAt: now,
    };
  }

  inspect() {
    return structuredClone(this.state);
  }
}
