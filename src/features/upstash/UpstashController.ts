import { Hono } from "hono";
import { Redis } from "ioredis";
import { redis } from "../../instances/index.js";

export const resource = "/upstash" as const;
export const app = new Hono();

export class UpstashController {
  constructor(private readonly redis: Redis) {}

  async ping(commands: string[]) {
    const result = await this.redis.ping();
    return { pong: result };
  }
}

const controller = new UpstashController(redis);

app.get("/ping", async (c) => {
  const output = await controller.ping([]);
  return c.json(output);
});
