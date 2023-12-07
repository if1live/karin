import {
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { Hono } from "hono";
import { createQueueUrl, sqsClient } from "../../instances.js";
import * as settings from "../../settings.js";
import { MyRequest, MyResponse } from "../../system/index.js";

export const app = new Hono();
export const resource = "/queue" as const;

const queueUrl = createQueueUrl(`toki-simple-${settings.STAGE}`);

export class QueueAdmin {
  async index(req: MyRequest): Promise<MyResponse> {
    const payload = {};
    const file = "admin/queue_index";
    return {
      tag: "html",
      file,
      payload,
    };
  }

  async enqueue(req: MyRequest): Promise<MyResponse> {
    const now = new Date();
    const body = `now: ${now.toISOString()}`;
    const output = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
      }),
    );

    const payload = output;
    return {
      tag: "json",
      payload,
    };
  }

  async purge(req: MyRequest): Promise<MyResponse> {
    const output = await sqsClient.send(
      new PurgeQueueCommand({
        QueueUrl: queueUrl,
      }),
    );

    const payload = output;
    return {
      tag: "json",
      payload,
    };
  }

  async peek(req: MyRequest): Promise<MyResponse> {
    const output_receive = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
      }),
    );

    const messages = output_receive.Messages ?? [];

    const fn_delete_real = async () =>
      await sqsClient.send(
        new DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: messages.map((m) => {
            return {
              Id: m.MessageId,
              ReceiptHandle: m.ReceiptHandle,
            };
          }),
        }),
      );
    const output_delete = messages.length > 0 ? await fn_delete_real() : null;

    const payload = {
      receive: output_receive,
      delete: output_delete,
    };
    return {
      tag: "json",
      payload,
    };
  }
}

const admin = new QueueAdmin();

app.get("", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.index(req);
  return MyResponse.respond(c, resp);
});

app.post("/enqueue", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.enqueue(req);
  return MyResponse.respond(c, resp);
});

app.post("/purge", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.purge(req);
  return MyResponse.respond(c, resp);
});

app.post("/peek", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.peek(req);
  return MyResponse.respond(c, resp);
});
