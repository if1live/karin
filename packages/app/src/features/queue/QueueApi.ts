import {
  SendMessageBatchRequest,
  SendMessageRequest,
} from "@aws-sdk/client-sqs";
import { Hono } from "hono";

export const resource = "/queue/" as const;
export const app = new Hono();

app.post("*", async (c) => {
  // application/x-amz-json-1.0
  const contentType = c.req.header("content-type");

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
  console.log(req);

  // TODO: body parsing
  const body = c.req.raw.body;
  const buffer = await body?.getReader().read();
  const arraybuffer = buffer?.value?.buffer;
  if (arraybuffer) {
    const uint8Array = new Uint8Array(arraybuffer);
    const decoder = new TextDecoder("utf-8");
    const decodedString = decoder.decode(uint8Array);
    const obj = JSON.parse(decodedString);
    const req = obj as SendMessageRequest;
    console.log("sqs.req", req);
    console.log({
      x: req.DelaySeconds,
      y: req.MessageBody,
      z: req.QueueUrl,
    });
    // TODO
    // '{"DelaySeconds":5,"MessageBody":"hello","QueueUrl":"http://localhost:4000/queue/karin-example-dev"}'
    return c.text(decodedString);
  }

  return c.json({ ok: true });
});
