import { SQSClient } from "@aws-sdk/client-sqs";
import { Redis } from "ioredis";
import * as settings from "./settings.js";

export const redis = new Redis(settings.REDIS_URL, {
  lazyConnect: true,
});
await redis.connect();

// const sqsEndpoint_localhost = "http://127.0.0.1:9324";
const sqsEndpoint_localhost = "http://127.0.0.1:4000/sqs";
const sqsEndpoint_prod = `https://sqs.${settings.AWS_REGION}.amazonaws.com`;
const sqsEndpoint =
  settings.NODE_ENV === "production" ? sqsEndpoint_prod : sqsEndpoint_localhost;

type SqsClientFn = () => SQSClient;

const createSqsClient_prod: SqsClientFn = () => {
  return new SQSClient({
    region: settings.AWS_REGION,
  });
};

const createSqsClient_localhost: SqsClientFn = () => {
  return new SQSClient({
    // region: settings.AWS_REGION,
    endpoint: sqsEndpoint_localhost,
    credentials: settings.AWS_CREDENTIALS,
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
  return `${sqsEndpoint}/${settings.AWS_ACCOUNT_ID}/${queueName}`;
};

export const createQueueUrl =
  settings.NODE_ENV === "production"
    ? createQueueUrl_prod
    : createQueueUrl_localhost;
