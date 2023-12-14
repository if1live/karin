import {
  PurgeQueueCommand,
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import z from "zod";
import {
  createQueueUrl_dev,
  createQueueUrl_prod,
  createSqsClient_dev,
  redis,
  sqsEndpoint_elasticmq,
  sqsEndpoint_shiroko,
} from "../instances.js";
import { ConnectionRepository, ConnectionService } from "../repositories.js";
import * as settings from "../settings.js";

const queueName = `toki-example-${settings.STAGE}`;

const SendReq = z.object({
  message: z.string().optional(),
  delay: z.coerce.number().max(900).optional(),
});
type SendReq = z.infer<typeof SendReq>;

export const dispatch: APIGatewayProxyHandlerV2 = async (event, context) => {
  const repo = new ConnectionRepository(redis);
  const service = new ConnectionService(redis);

  // TODO: url 단위 분기? 더 멀쩡한 방법?
  const httpReq = event.requestContext.http;
  const check = (method: "GET" | "POST", path: string) => {
    return httpReq.method === method && httpReq.path === path;
  };

  if (check("GET", "/")) {
    return {
      statusCode: 200,
      body: "toki-example",
    };
  }

  if (check("GET", "/ws/list")) {
    const models = await repo.list();
    return respond_200(models);
  }

  if (check("POST", "/ws/clear")) {
    const result = await repo.clear();
    return respond_200({ tag: "clear", result });
  }

  if (check("POST", "/ws/broadcast")) {
    const data = new Date().toISOString();
    const result = await service.broadcast(data);
    return respond_200({ tag: "broadcast", result });
  }

  if (check("POST", "/elasticmq/send")) {
    const req = SendReq.parse(event.queryStringParameters);
    const endpoint = sqsEndpoint_elasticmq;
    const queueUrl = createQueueUrl_dev(endpoint, queueName);
    const client = createSqsClient_dev(endpoint);
    const output = await fn_sqs_send(req, client, queueUrl);
    return respond_200(output);
  }

  if (check("POST", "/elasticmq/send-batch")) {
    const req = SendReq.parse(event.queryStringParameters);
    const endpoint = sqsEndpoint_elasticmq;
    const queueUrl = createQueueUrl_dev(endpoint, queueName);
    const client = createSqsClient_dev(endpoint);
    const output = await fn_sqs_sendBatch(req, client, queueUrl);
    return respond_200(output);
  }

  if (check("POST", "/elasticmq/purge")) {
    const endpoint = sqsEndpoint_elasticmq;
    const queueUrl = createQueueUrl_dev(endpoint, queueName);
    const client = createSqsClient_dev(endpoint);
    const output = await fn_sqs_purge(client, queueUrl);
    return respond_200(output);
  }

  if (check("POST", "/shiroko/send")) {
    const req = SendReq.parse(event.queryStringParameters);
    const endpoint = sqsEndpoint_shiroko;
    const queueUrl = createQueueUrl_prod(queueName);
    const client = createSqsClient_dev(endpoint);
    const output = await fn_sqs_send(req, client, queueUrl);
    return respond_200(output);
  }

  if (check("POST", "/shiroko/send-batch")) {
    const req = SendReq.parse(event.queryStringParameters);
    const endpoint = sqsEndpoint_shiroko;
    const queueUrl = createQueueUrl_prod(queueName);
    const client = createSqsClient_dev(endpoint);
    const output = await fn_sqs_sendBatch(req, client, queueUrl);
    return respond_200(output);
  }

  // else...
  return {
    statusCode: 404,
    body: "action not found",
  };
};

const respond_200 = (input: unknown): APIGatewayProxyResultV2 => {
  return {
    statusCode: 200,
    body: JSON.stringify(input),
  };
};

const fn_sqs_send = async (
  req: SendReq,
  client: SQSClient,
  queueUrl: string,
) => {
  const message = req.message ?? "<BLANK>";
  const delay = req.delay ?? 0;

  console.log({
    QueueUrl: queueUrl,
    MessageBody: message,
    DelaySeconds: delay,
  });

  const output = await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
      DelaySeconds: delay,
    }),
  );

  return { tag: "sqs:send", delay, message, output };
};

const fn_sqs_sendBatch = async (
  req: SendReq,
  client: SQSClient,
  queueUrl: string,
) => {
  const message = req.message ?? "<BLANK>";
  const delay = req.delay ?? 0;

  console.log({
    QueueUrl: queueUrl,
    MessageBody: message,
    DelaySeconds: delay,
  });

  const entries = [1, 2, 3].map((x): SendMessageBatchRequestEntry => {
    return {
      Id: crypto.randomUUID(),
      MessageBody: `${message}-${x}`,
      DelaySeconds: delay,
    };
  });

  const output = await client.send(
    new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: entries,
    }),
  );

  return { tag: "sqs:sendBatch", delay, message, output };
};

const fn_sqs_purge = async (client: SQSClient, queueUrl: string) => {
  const output = await client.send(
    new PurgeQueueCommand({
      QueueUrl: queueUrl,
    }),
  );
  return { tag: "sqs:purge", output };
};
