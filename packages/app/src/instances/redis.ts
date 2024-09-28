import { Redis } from "ioredis";
import * as settings from "../settings.js";

export const createRedis_real = async (): Promise<Redis> => {
  // fly.io upstash redis 쓰러면 family 6 필수
  const redis = new Redis(settings.REDIS_URL, {
    lazyConnect: true,
    // family: 6,
  });
  await redis.connect();
  return redis;
};

export const createRedis_mock = async (): Promise<Redis> => {
  const RedisMock = await import("ioredis-mock");
  type MockConstructor = typeof RedisMock.redisMock;
  const Mock = RedisMock.default as any as MockConstructor;
  const redis: Redis = new Mock();
  return redis;
};

export const createRedis = async (): Promise<Redis> => {
  switch (settings.NODE_ENV) {
    case "production":
      return await createRedis_real();
    case "development":
      return await createRedis_mock();
    case "test":
      return await createRedis_mock();
    default:
      throw new Error("unknown redis NODE_ENV", {
        cause: { NODE_ENV: settings.NODE_ENV },
      });
  }
};

export const redis = await createRedis();

/**
 * ioredis-mock에서 subscribe 사용한 redis에서 publish 사용하면 에러 발생
 * Error: Connection in subscriber mode, only subscriber commands may be used
 * 에러 메세지 찾아보니까 redis-commander에서 발생하는거로 봐서
 * 진짜 redis에서도 똑같을듯
 * https://github.com/joeferner/redis-commander/issues/368
 */
export const redis_sub = await createRedis();
