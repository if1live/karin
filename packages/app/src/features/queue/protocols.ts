import assert from "node:assert/strict";
import {
  PurgeQueueRequest,
  SendMessageBatchRequest,
  SendMessageBatchRequestEntry,
  SendMessageRequest,
} from "@aws-sdk/client-sqs";
import { MetadataBearer, ResponseMetadata } from "@aws-sdk/types";
import { Context, HonoRequest } from "hono";
import XmlJs from "xml-js";
import { SdkAction, SdkResult } from "./types.js";

const contentType_json = "application/x-amz-json-1.0";
const contentType_urlencoded = "application/x-www-form-urlencoded";

type ParseFn = (req: HonoRequest) => Promise<SdkAction>;

type SerializeFn = (
  result: SdkResult,
  metadata: ResponseMetadata,
) => { format: "json"; payload: object } | { format: "xml"; xml: string };

const parse_json: ParseFn = async (req) => {
  const obj = await req.json();
  const target = req.header("x-amz-target");
  switch (target) {
    case "AmazonSQS.SendMessage":
      return { action: "SendMessage", request: obj };
    case "AmazonSQS.SendMessageBatch":
      return { action: "SendMessageBatch", request: obj };
    case "AmazonSQS.PurgeQueue":
      return { action: "PurgeQueue", request: obj };
    default: {
      throw new Error("unknown target", {
        cause: {
          target,
        },
      });
    }
  }
};

const parse_urlencoded: ParseFn = async (req) => {
  const body = await req.parseBody();
  const { Action: action, ...rest } = body;
  assert.ok(typeof rest.QueueUrl === "string");

  switch (action) {
    case "SendMessage": {
      return {
        action: "SendMessage",
        request: rest as any as SendMessageRequest,
      };
    }
    case "SendMessageBatch": {
      // batch를 쓰면 10개까지 보낼수 있다.
      const entries: SendMessageBatchRequestEntry[] = [];
      for (let i = 1; i <= 10; i++) {
        const key_id = `SendMessageBatchRequestEntry.${i}.Id`;
        const key_messageBody = `SendMessageBatchRequestEntry.${i}.MessageBody`;
        const key_delaySeconds = `SendMessageBatchRequestEntry.${i}.DelaySeconds`;

        const val_id = rest[key_id];
        const val_messageBody = rest[key_messageBody];
        const val_delaySeconds = rest[key_delaySeconds];

        if (typeof val_id !== "string") break;
        if (typeof val_messageBody !== "string") break;
        if (typeof val_delaySeconds !== "string") break;

        const entry: SendMessageBatchRequestEntry = {
          Id: val_id,
          MessageBody: val_messageBody,
          DelaySeconds: parseInt(val_delaySeconds, 10),
        };
        entries.push(entry);
      }

      const request: SendMessageBatchRequest = {
        QueueUrl: rest.QueueUrl,
        Entries: entries,
      };
      return {
        action: "SendMessageBatch",
        request,
      };
    }
    case "PurgeQueue": {
      const request: PurgeQueueRequest = {
        QueueUrl: rest.QueueUrl,
      };
      return {
        action: "PurgeQueue",
        request,
      };
    }
    default: {
      throw new Error("unknown action", {
        cause: {
          action,
        },
      });
    }
  }
};

const serialize_json: SerializeFn = (result, metadata) => {
  const resp: SdkResult["value"] & MetadataBearer = {
    $metadata: metadata,
    ...result.value,
  };
  return { format: "json", payload: resp };
};

/**
 * aws-sdk 버전 올라가면 json으로 바뀌는데 람다 런타임은 aws-sdk가 구버전이라서 xml 대응
 * @link https://docs.aws.amazon.com/ko_kr/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-xml-api-responses.html
 */
const serialize_xml: SerializeFn = (result, metadata) => {
  const responseTagName = `${result.action}Response`;
  const resultTagName = `${result.action}Result`;

  const entries = Object.entries(result.value).map(([key, value]) => {
    return [key, { _text: value }];
  });
  const content = Object.fromEntries(entries);

  const data = {
    [responseTagName]: {
      _attributes: {
        xmlns: "https://sqs.us-east-2.amazonaws.com/doc/2012-11-05/",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:type": responseTagName,
      },
      [resultTagName]: content,
      ResponseMetadata: {
        RequestId: { _text: metadata.requestId },
      },
    },
  };

  const xml = XmlJs.js2xml(data, { compact: true, indentText: true });
  return { format: "xml", xml };
};

export const parse = async (c: Context) => {
  const contentType = c.req.header("content-type");
  switch (contentType) {
    case contentType_json:
      return await parse_json(c.req);
    case contentType_urlencoded:
      return await parse_urlencoded(c.req);
    default: {
      throw new Error("not supported content-type", {
        cause: { contentType },
      });
    }
  }
};

export const serialize = (
  c: Context,
  result: SdkResult,
  metadata: ResponseMetadata,
) => {
  const contentType = c.req.header("content-type");
  switch (contentType) {
    case contentType_json: {
      const resp = serialize_json(result, metadata);
      assert.ok(resp.format === "json");
      return c.json(resp.payload as any);
    }
    case contentType_urlencoded: {
      const resp = serialize_xml(result, metadata);
      assert.ok(resp.format === "xml");
      // TODO: content-type 야매로 해도 aws-sdk에서 돌더라
      return c.text(resp.xml);
    }
    default: {
      throw new Error("not supported content-type", {
        cause: { contentType },
      });
    }
  }
};
