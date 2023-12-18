import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { InvokeActor, State } from "../../src/features/consumer/InvokeActor.js";

describe("InvokeActor#shouldExecute", () => {
  const now = new Date();

  const skel: State = {
    uuid: "uuid",
    queueName: "queueName",
    functionName: "functionName",
    batchSize: 10,
    startedAt: now,
    executedAt: now,
    reservedAt: now,
  };

  it("예약 시간이 지남", () => {
    const state = { ...skel, reservedAt: new Date(now.getTime() - 1) };
    const actual = InvokeActor.shouldExecute(state, now);
    assert.equal(actual, true);
  });

  it("예약 시간이 미래", () => {
    const state = { ...skel, reservedAt: new Date(now.getTime() + 1) };
    const actual = InvokeActor.shouldExecute(state, now);
    assert.equal(actual, false);
  });

  it("예약 시간 없음", () => {
    const state = { ...skel, reservedAt: null };
    const actual = InvokeActor.shouldExecute(state, now);
    assert.equal(actual, false);
  });

  it("예약 시간이 없지만 마지막 실행에서 오래 지난 경우", () => {
    const past = new Date(now.getTime() - 60_000 - 1);
    const state = { ...skel, executedAt: past, reservedAt: null };
    const actual = InvokeActor.shouldExecute(state, now);
    assert.equal(actual, true);
  });
});
