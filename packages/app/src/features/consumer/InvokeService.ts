import crypto from "node:crypto";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { SQSEvent, SQSRecord } from "aws-lambda";
import * as settings from "../../settings.js";
import { MyMessage, MyMessageHeader } from "../queue/types.js";

type MyRecord = {
  message: MyMessage;
  header: MyMessageHeader;
};

export class InvokeService {
  constructor(
    private readonly client: LambdaClient,
    private readonly queueName: string,
    private readonly functionName: string,
  ) {}

  async invoke(inputs: MyRecord[]) {
    const records = inputs.map((input) => convert(input, this.queueName));
    const event: SQSEvent = {
      Records: records,
    };

    try {
      const output = await this.client.send(
        new InvokeCommand({
          FunctionName: this.functionName,
          Payload: JSON.stringify(event),
          InvocationType: "Event",
        }),
      );
      // TODO: 에러 처리 좋은 방법?
      return output;
    } catch (e) {
      // TODO: 적당한 에러처리 필요
      console.error(e);
    }
  }
}

const convert = (input: MyRecord, queue: string): SQSRecord => {
  const { message, header } = input;

  const region = settings.AWS_REGION;
  const arn = `arn:aws:sqs:${region}:123456789012:${queue}`;

  const body = message.body;
  const md5OfBody = crypto.createHash("md5").update(body).digest("hex");

  const record: SQSRecord = {
    messageId: message.id,
    receiptHandle: "",
    body,
    md5OfBody,
    attributes: {
      ApproximateReceiveCount: "1",
      SenderId: "127.0.0.1",
      SentTimestamp: header.ts_sent.toString(),
      ApproximateFirstReceiveTimestamp: header.ts_sent.toString(),
    },
    messageAttributes: {},
    eventSource: "aws:sqs",
    eventSourceARN: arn,
    awsRegion: settings.AWS_REGION,
  };
  return record;
};
