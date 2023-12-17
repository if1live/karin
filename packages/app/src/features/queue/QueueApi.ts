import crypto from "node:crypto";
import {
  BatchResultErrorEntry,
  PurgeQueueCommandOutput,
  PurgeQueueRequest,
  SendMessageBatchCommandOutput,
  SendMessageBatchRequest,
  SendMessageBatchResult,
  SendMessageBatchResultEntry,
  SendMessageCommandOutput,
  SendMessageRequest,
  SendMessageResult,
} from "@aws-sdk/client-sqs";
import { Context, Hono } from "hono";
import { redis } from "../../instances/index.js";
import { QueueService } from "./services/QueueService.js";
import { MyMessage } from "./types.js";

export const resource = "/queue/" as const;
export const app = new Hono();

// TODO:
app.post("*", async (c) => {
  // application/x-amz-json-1.0
  const contentType = c.req.header("content-type");
  if (contentType !== "application/x-amz-json-1.0") {
    throw new Error("not supported content-type", {
      cause: { contentType },
    });
  }

  // AmazonSQS.SendMessage | AmazonSQS.SendMessageBatch
  const target = c.req.header("x-amz-target");

  // c18c5542-d2ad-48b3-b7e1-fd561d1ddfe7
  const sdkInvocationId = c.req.header("amz-sdk-invocation-id");

  // attempt=1; max=3
  const sdkRequest = c.req.header("amz-sdk-request");

  // 20231213T151409Z
  const date = c.req.header("x-amz-date");

  // 71cff866caa03a4725e160508ce926d4f152ccb6d78616c648c478112889c4a2
  const contentSha256 = c.req.header("x-amz-content-sha256");

  // TODO: aws signate 뜯기
  // AWS4-HMAC-SHA256 Credential=a/20231213/ap-northeast-1/sqs/aws4_request,
  // SignedHeaders=amz-sdk-invocation-id;amz-sdk-request;content-length;content-type;host;x-amz-content-sha256;x-amz-date;x-amz-target;x-amz-user-agent,
  // Signature=c2c164d0bc32c3de0cff47d472d8aa8b72c39a5d41da2ae0617deaf8756c7d1c
  const authorization = c.req.header("authorization");

  // keep-alive
  const connection = c.req.header("connection");

  const req = {
    contentType,
    target,
    sdkInvocationId,
    sdkRequest,
    date,
    contentSha256,
    authorization,
    connection,
  };
  // console.log(req);

  // TODO: aws signature 기반 인증 구현

  switch (target) {
    case "AmazonSQS.SendMessage":
      return fn_sendMessage(c);
    case "AmazonSQS.SendMessageBatch":
      return fn_sendMessageBatch(c);
    case "AmazonSQS.PurgeQueue":
      return fn_purgeQueue(c);
    default: {
      throw new Error("unknown target", {
        cause: {
          target,
        },
      });
    }
  }
});

const parseReq = async <T>(c: Context) => {
  // TODO: body parsing
  const body = c.req.raw.body;
  const buffer = await body?.getReader().read();
  const arraybuffer = buffer?.value?.buffer;
  if (!arraybuffer) {
    throw new Error("arraybuffer is null");
  }

  const uint8Array = new Uint8Array(arraybuffer);
  const decoder = new TextDecoder("utf-8");
  const decodedString = decoder.decode(uint8Array);
  const obj = JSON.parse(decodedString);
  return obj as T;
};

export const extractQueueName = (queueUrl: string | undefined) => {
  const parsed = new URL(queueUrl ?? "");
  const tokens = parsed.pathname.split("/");
  const candidate = tokens[tokens.length - 1];
  if (!candidate) {
    throw new Error("queueName is empty");
  }
  return candidate;
};

const fn_purgeQueue = async (c: Context) => {
  const req = await parseReq<PurgeQueueRequest>(c);
  const { QueueUrl: queueUrl } = req;
  const queueName = extractQueueName(queueUrl);
  const s = new QueueService(redis, queueName);
  await s.purge();

  const resp: PurgeQueueCommandOutput = {
    $metadata: {
      requestId: crypto.randomUUID(),
    },
  };
  return c.json(resp);
};

const fn_sendMessage = async (c: Context) => {
  const req = await parseReq<SendMessageRequest>(c);
  const queueName = extractQueueName(req.QueueUrl);
  const s = new QueueService(redis, queueName);

  const messageId = crypto.randomUUID();
  const body = req.MessageBody ?? "";
  const message: MyMessage = {
    id: messageId,
    body,
  };
  const now = new Date();
  await s.enqueueAsync({ message, delaySeconds: req.DelaySeconds ?? 0 }, now);

  const md5OfMessageBody = crypto.createHash("md5").update(body).digest("hex");
  const result: SendMessageResult = {
    MessageId: messageId,
    MD5OfMessageBody: md5OfMessageBody,
  };
  const resp: SendMessageCommandOutput = {
    $metadata: {
      requestId: crypto.randomUUID(),
    },
    ...result,
  };
  return c.json(resp);
};

const fn_sendMessageBatch = async (c: Context) => {
  const req = await parseReq<SendMessageBatchRequest>(c);
  const queueName = extractQueueName(req.QueueUrl);
  const s = new QueueService(redis, queueName);

  const now = new Date();
  const entries = req.Entries ?? [];

  const list_successful: SendMessageBatchResultEntry[] = [];
  const list_failed: BatchResultErrorEntry[] = [];

  const pipeline = redis.pipeline();
  for (const entry of entries) {
    const messageId = entry.Id ?? crypto.randomUUID();
    const body = entry.MessageBody ?? "";
    const md5OfMessageBody = crypto
      .createHash("md5")
      .update(body)
      .digest("hex");
    const delaySeconds = entry.DelaySeconds ?? 0;

    s.enqueuePipeline(
      pipeline,
      {
        message: { id: messageId, body },
        delaySeconds,
      },
      now,
    );

    const result_successful: SendMessageBatchResultEntry = {
      Id: messageId,
      MessageId: messageId,
      MD5OfMessageBody: md5OfMessageBody,
    };
    list_successful.push(result_successful);
  }
  await pipeline.exec();

  const result: SendMessageBatchResult = {
    Successful: list_successful,
    Failed: list_failed,
  };
  const resp: SendMessageBatchCommandOutput = {
    $metadata: {
      requestId: crypto.randomUUID(),
    },
    ...result,
  };
  return c.json(resp);
};
