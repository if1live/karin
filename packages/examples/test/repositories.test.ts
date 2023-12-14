import assert from "node:assert";
import { describe, it } from "node:test";
import { Redis } from "ioredis";
import * as RedisMock from "ioredis-mock";
import { ConnectionModel, ConnectionRepository } from "../src/repositories.js";

type MockConstructor = typeof RedisMock.redisMock;
const Mock = RedisMock.default as any as MockConstructor;
const redis: Redis = new Mock();

describe("ConnectionRepository", () => {
  const repo = new ConnectionRepository(redis);

  const conn_a: ConnectionModel = {
    connectionId: "a",
    endpoint: "https://foo.com",
    ts_request: 1_000,
  };
  const conn_b: ConnectionModel = {
    connectionId: "b",
    endpoint: "https://bar.com",
    ts_request: 2_000,
  };

  it("add", async () => {
    await repo.add(conn_a);
    await repo.add(conn_b);

    const founds = await repo.list();
    assert.deepEqual(founds, [conn_a, conn_b]);
  });

  it("del", async () => {
    await repo.del(conn_a.connectionId);
    const founds = await repo.list();
    assert.deepEqual(founds, [conn_b]);
  });

  it("clear", async () => {
    await repo.clear();
    const founds = await repo.list();
    assert.deepEqual(founds, []);
  });
});
