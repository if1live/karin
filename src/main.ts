import crypto from "node:crypto";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { serve } from "@hono/node-server";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { Hono } from "hono";
import { channel, lambdaClient } from "./instances/index.js";
import * as settings from "./settings.js";

// TODO: 큐 목록을 얻어서 채널 목록 생성하는 시점? 서버 재시작 시점?
const eventSourceMapping = {
  queue: "toki-example-dev",
  lambda: "toki-example-dev-sqsMain",
};

await channel.assertQueue(eventSourceMapping.queue, {
  durable: false,
});

const app = new Hono();

app.get("/", (c) => c.text("Hono meets Node.js"));

app.get("/send", async (c) => {
  const message = new Date().toISOString();
  const result = channel.sendToQueue(
    eventSourceMapping.queue,
    Buffer.from(message),
  );
  return c.json({ result });
});

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

    // TODO: 내용물 그럴싸하게 가라치는건 진짜 toki에서만 해도 된다.
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

    // console.log(" [x] Received %s", msg.content.toString());
    const output = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: eventSourceMapping.lambda,
        Payload: JSON.stringify(event),
        InvocationType: "Event",
      }),
    );
    console.log(output);
  },
  {
    noAck: true,
  },
);

serve(
  {
    fetch: app.fetch,
    port: 4000,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  },
);
