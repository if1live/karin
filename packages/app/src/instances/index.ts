import { Redis } from "ioredis";
import { Liquid } from "liquidjs";
import * as settings from "../settings.js";

export * from "./rdbms.js";
export * from "./aws.js";

// fly.io upstash redis 쓰러면 family 6 필수
export const redis = new Redis(settings.REDIS_URL, {
  lazyConnect: true,
  family: 6,
});
await redis.connect();

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});
