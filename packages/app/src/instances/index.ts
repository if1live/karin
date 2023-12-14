import amqplib from "amqplib";
import { Redis } from "ioredis";
import { Liquid } from "liquidjs";
import * as settings from "../settings.js";

export * from "./rdbms.js";
export * from "./aws.js";

// fly.io upstash redis 쓰러면 family 6 필수
export const redis = new Redis(settings.FLY_REDIS_URL, {
  lazyConnect: true,
  family: 6,
});
await redis.connect();

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});

export const rabbit = await amqplib.connect(settings.RABBITMQ_URL);
export const channel = await rabbit.createChannel();