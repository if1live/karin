import { SQSClient } from "@aws-sdk/client-sqs";
import { Redis } from "ioredis";
import * as settings from "./settings.js";

export const redis = new Redis(settings.REDIS_URL, {
  lazyConnect: true,
});
await redis.connect();

export const sqsEndpoint_elasticmq = "http://127.0.0.1:9324";

export const sqsEndpoint_karin = "http://127.0.0.1:4000/api/queue";

export const createSqsClient_prod = () => {
  return new SQSClient({
    region: settings.AWS_REGION,
  });
};

export const createSqsClient_dev = (endpoint: string) => {
  return new SQSClient({
    endpoint,
    credentials: settings.AWS_CREDENTIALS,
  });
};

export const createQueueUrl_dev = (endpoint: string, queue: string) => {
  return `${endpoint}/queue/${queue}`;
};

export const createQueueUrl_prod = (queue: string) => {
  const endpoint = `https://sqs.${settings.AWS_REGION}.amazonaws.com`;
  return `${endpoint}/${settings.AWS_ACCOUNT_ID}/${queue}`;
};
