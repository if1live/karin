import crypto from "crypto";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import amqplib from "amqplib";
import { SQSEvent, SQSRecord } from "aws-lambda";
import * as settings from "../src/settings.js";

const rabbitmq = await amqplib.connect(settings.RABBITMQ_URL);

const client = new LambdaClient({
  endpoint: "http://localhost:3002",
  region: settings.AWS_REGION,
  // 로컬에서 테스트할때는 credentials이 빈값만 아니면 된다.
  credentials: {
    accessKeyId: "a",
    secretAccessKey: "b",
  },
});

const queueName = `toki-example-${settings.STAGE}`;

const channel = await rabbitmq.createChannel();
await channel.assertQueue(queueName, {
  durable: false,
});

channel.consume(
  queueName,
  async (msg) => {
    const now = new Date();

    const body_naive = msg?.content?.toString("utf-8");
    const body = body_naive ?? "";
    const md5OfBody = crypto.createHash("md5").update(body).digest("hex");

    const messageId = crypto.randomUUID();

    const region = settings.AWS_REGION;
    const accountId = settings.AWS_ACCOUNT_ID;
    const arn = `arn:aws:sqs:${region}:${accountId}:${queueName}`;

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
    const output = await client.send(
      new InvokeCommand({
        FunctionName: "sqsMain",
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

console.log("waiting for messages...");
