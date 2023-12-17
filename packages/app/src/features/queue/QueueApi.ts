import crypto from "node:crypto";
import {
  BatchResultErrorEntry,
  PurgeQueueRequest,
  SendMessageBatchRequest,
  SendMessageBatchResult,
  SendMessageBatchResultEntry,
  SendMessageRequest,
  SendMessageResult,
} from "@aws-sdk/client-sqs";
import { ResponseMetadata } from "@aws-sdk/types";
import { Context, Hono } from "hono";
import { redis } from "../../instances/index.js";
import * as protocols from "./protocols.js";
import { QueueService } from "./services/QueueService.js";
import { MyMessage, SdkAction, SdkResult } from "./types.js";

export const resource = "/queue/" as const;
export const app = new Hono();

// TODO:
app.post("*", async (c) => {
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

  // TODO: aws signature 기반 인증 구현

  const data = {
    sdkInvocationId,
    sdkRequest,
    date,
    contentSha256,
    authorization,
    connection,
  };

  const req = await protocols.parse(c);
  const output = await perform(req);
  const result: SdkResult = {
    action: req.action,
    value: output.result as any,
  };
  const metadata: ResponseMetadata = {
    requestId: crypto.randomUUID(),
  };
  return protocols.serialize(c, result, metadata);
});

export const extractQueueName = (queueUrl: string | undefined) => {
  const parsed = new URL(queueUrl ?? "");
  const tokens = parsed.pathname.split("/");
  const candidate = tokens[tokens.length - 1];
  if (!candidate) {
    throw new Error("queueName is empty");
  }
  return candidate;
};

const perform = async (req: SdkAction) => {
  switch (req.action) {
    case "SendMessage": {
      const result = await fn_sendMessage(req.request);
      return { action: req.action, result };
    }
    case "SendMessageBatch": {
      const result = await fn_sendMessageBatch(req.request);
      return { action: req.action, result };
    }
    case "PurgeQueue": {
      const result = await fn_purgeQueue(req.request);
      return { action: req.action, result };
    }
    default: {
      throw new Error("unknown action", {
        cause: { req },
      });
    }
  }
};

const fn_purgeQueue = async (req: PurgeQueueRequest) => {
  const { QueueUrl: queueUrl } = req;
  const queueName = extractQueueName(queueUrl);
  const s = new QueueService(redis, queueName);
  await s.purge();

  return {};
};

const fn_sendMessage = async (
  req: SendMessageRequest,
): Promise<SendMessageResult> => {
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
  return {
    MessageId: messageId,
    MD5OfMessageBody: md5OfMessageBody,
  };
};

const fn_sendMessageBatch = async (
  req: SendMessageBatchRequest,
): Promise<SendMessageBatchResult> => {
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

  return {
    Successful: list_successful,
    Failed: list_failed,
  };
};
