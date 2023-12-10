import crypto from "node:crypto";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { Hono } from "hono";
import { channel, lambdaClient } from "../../instances/index.js";
import * as settings from "../../settings.js";
import { MyRequest, MyResponse } from "../../system/index.js";
import { eventSourceMapping } from "./core.js";

export const resource = "/queue" as const;
export const app = new Hono();

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
}

const admin = new QueueAdmin();

app.get("", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.index(req);
  return MyResponse.respond(c, resp);
});

// TODO: 테스트용 떔빵
app.get("/send", async (c) => {
  const message = new Date().toISOString();
  const result = channel.sendToQueue(
    eventSourceMapping.queue,
    Buffer.from(message),
  );
  return c.json({ result });
});

// TODO: consumer? 이런건 어디에 넣는게 좋을까?
// TODO: consumer?
channel.consume(
  eventSourceMapping.queue,
  async (msg) => {
    const now = new Date();

    const body_naive = msg?.content?.toString("utf-8");
    const body = body_naive ?? "";
    const md5OfBody = crypto.createHash("md5").update(body).digest("hex");

    const messageId = crypto.randomUUID();

    const region = settings.AWS_REGION;
    const arn = `arn:aws:sqs:${region}:123456789012:${eventSourceMapping.queue}`;

    // TODO: 내용물 그럴싸하게 가라치기
    const record: SQSRecord = {
      messageId,
      receiptHandle: "",
      body,
      md5OfBody,
      attributes: {
        ApproximateReceiveCount: "1",
        SenderId: "127.0.0.1",
        SentTimestamp: now.getTime().toString(),
        ApproximateFirstReceiveTimestamp: now.getTime().toString(),
      },
      messageAttributes: {},
      eventSource: "aws:sqs",
      eventSourceARN: arn,
      awsRegion: settings.AWS_REGION,
    };

    const event: SQSEvent = {
      Records: [record],
    };

    try {
      // console.log(" [x] Received %s", msg.content.toString());
      const output = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: eventSourceMapping.lambda,
          Payload: JSON.stringify(event),
          InvocationType: "Event",
        }),
      );
      console.log(output);
    } catch (e) {
      // TODO: 적당한 에러처리 필요
      console.error(e);
    }
  },
  {
    noAck: true,
  },
);
