import { LambdaClient } from "@aws-sdk/client-lambda";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Redis } from "ioredis";
import { Kysely, MysqlDialect } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { Liquid } from "liquidjs";
import type { default as Mysql } from "mysql2";
import * as settings from "./settings.js";
import { DB } from "./tables/index.js";

/*
const createMysqlPool = async (url: URL): Promise<Mysql.Pool> => {
  const { default: Mysql } = await import("mysql2");
  return Mysql.createPool({
    database: url.pathname.replace("/", ""),
    host: url.hostname,
    user: url.username,
    password: url.password,
    port: url.port !== "" ? parseInt(url.port, 10) : undefined,
    connectionLimit: settings.aws.isAwsLambda ? 1 : 5,
    // 로컬에서 접속할때는 필요없는 속성. planetscale로 접속할때만 필요
    // ssl: { rejectUnauthorized: true },
  });
};

const createKysely_mysql = async (): Promise<Kysely<DB>> => {
  const databaseUrl = new URL(settings.DATABASE_URL);
  const pool = await createMysqlPool(databaseUrl);
  return new Kysely<DB>({
    dialect: new MysqlDialect({
      pool: pool,
    }),
  });
};

const createKysely_planetscale = (): Kysely<DB> => {
  return new Kysely<DB>({
    dialect: new PlanetScaleDialect({
      url: settings.DATABASE_URL,
      fetch: fetch,
    }),
  });
};

export const db = settings.aws.isAwsLambda
  ? createKysely_planetscale()
  : await createKysely_mysql();
*/

export const redis = new Redis(settings.REDIS_URL, {
  lazyConnect: true,
});
await redis.connect();

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});

type LambdaClientFn = () => LambdaClient;

const createLambdaClient_prod: LambdaClientFn = () => {
  const aws = settings.aws;
  return new LambdaClient({
    region: aws.region,
    credentials: aws.credentials,
  });
};

const createLambdaClient_localhost: LambdaClientFn = () => {
  return new LambdaClient({
    region: settings.aws.region,
  });
};

export const lambdaClient =
  settings.NODE_ENV === "development"
    ? createLambdaClient_localhost()
    : createLambdaClient_prod();

const sqsEndpoint_localhost = "http://127.0.0.1:9324";
const sqsEndpoint_prod = `https://sqs.${settings.aws.region}.amazonaws.com`;
const sqsEndpoint =
  settings.NODE_ENV === "production" ? sqsEndpoint_prod : sqsEndpoint_localhost;

type SqsClientFn = () => SQSClient;

const createSqsClient_prod: SqsClientFn = () => {
  const aws = settings.aws;
  return new SQSClient({
    region: aws.region,
    credentials: aws.credentials,
  });
};

const createSqsClient_localhost: SqsClientFn = () => {
  const aws = settings.aws;
  return new SQSClient({
    region: aws.region,
    endpoint: sqsEndpoint_localhost,
  });
};

export const sqsClient: SQSClient =
  settings.NODE_ENV === "development"
    ? createSqsClient_localhost()
    : createSqsClient_prod();

type CreateQueueUrlFn = (queueName: string) => string;

const createQueueUrl_localhost: CreateQueueUrlFn = (queueName) => {
  return `${sqsEndpoint}/queue/${queueName}`;
};

const createQueueUrl_prod: CreateQueueUrlFn = (queueName) => {
  return `${sqsEndpoint}/${settings.aws.accountId}/${queueName}`;
};

export const createQueueUrl =
  settings.NODE_ENV === "production"
    ? createQueueUrl_prod
    : createQueueUrl_localhost;
