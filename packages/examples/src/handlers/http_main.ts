import crypto from "node:crypto";
import { setTimeout } from "node:timers/promises";
import {
  PurgeQueueCommand,
  SendMessageBatchCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import amqplib from "amqplib";
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import z from "zod";
import { createQueueUrl, redis, sqsClient } from "../instances.js";
import { ConnectionRepository, ConnectionService } from "../repositories.js";
import * as settings from "../settings.js";

const queueName = `toki-example-${settings.STAGE}`;
const queueUrl = createQueueUrl(queueName);

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

  if (check("POST", "/sqs/send")) {
    const req = SendReq.parse(event.queryStringParameters);
    const output = await fn_sqs_send(req);
    return respond_200(output);
  }

  if (check("POST", "/sqs/purge")) {
    const output = await fn_sqs_purge();
    return respond_200(output);
  }

  if (check("POST", "/rabbitmq/send")) {
    const req = SendReq.parse(event.queryStringParameters);
    const output = await fn_rabbitmq_send(req);
    return respond_200(output);
  }

  if (check("POST", "/rabbitmq/purge")) {
    const output = await fn_rabbitmq_purge();
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

const fn_sqs_send = async (req: SendReq) => {
  const message = req.message ?? "<BLANK>";
  const delay = req.delay ?? 0;

  console.log({
    QueueUrl: queueUrl,
    MessageBody: message,
    DelaySeconds: delay,
  });

  const output = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
      DelaySeconds: delay,
    }),
  );

  // const output = await sqsClient.send(
  //   new SendMessageBatchCommand({
  //     QueueUrl: queueUrl,
  //     Entries: [
  //       {
  //         Id: crypto.randomUUID(),
  //         MessageBody: message,
  //         DelaySeconds: delay,
  //       },
  //     ],
  //   }),
  // );

  return { tag: "sqs:send", delay, message, output };
};

const fn_sqs_purge = async () => {
  const output = await sqsClient.send(
    new PurgeQueueCommand({
      QueueUrl: queueUrl,
    }),
  );
  return { tag: "sqs:purge", output };
};

// TODO: 지연된 메세지 구현?
const fn_rabbitmq_send = async (req: SendReq) => {
  const delay = req.delay ?? 0;
  const message = req.message ?? "<BLANK>";
  const message_buffer = Buffer.from(message);

  const { channel } = await connectRabbitMQ();
  const result = channel.sendToQueue(queueName, message_buffer);

  // TODO: sendToQueue가 promise 리턴하는 함수가 아니다.
  // 혹시나 람다에서 멈추는거 대비해서 임시로 setTimeout을 넣어둔다.
  await setTimeout(100);
  await channel.close();

  return { tag: "rabbitmq:send", result };
};

const fn_rabbitmq_purge = async () => {
  const { channel } = await connectRabbitMQ();
  const result = await channel.purgeQueue(queueName);
  await setTimeout(100);
  await channel.close();

  return { tag: "rabbitmq:reset", result };
};

const connectRabbitMQ = async () => {
  const rabbitmq = await amqplib.connect(settings.RABBITMQ_URL);
  const channel = await rabbitmq.createChannel();
  await channel.assertQueue(queueName, {
    durable: false,
  });

  return { channel };
};
