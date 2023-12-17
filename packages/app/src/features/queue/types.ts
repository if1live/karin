import {
  PurgeQueueRequest,
  SendMessageBatchRequest,
  SendMessageBatchResult,
  SendMessageRequest,
  SendMessageResult,
} from "@aws-sdk/client-sqs";
import * as z from "zod";

// SQS 비슷하게 만들고 싶다
export const MyMessage = z.object({
  id: z.string(),
  body: z.string(),
});
export type MyMessage = z.infer<typeof MyMessage>;

export const MyMessageHeader = z.object({
  ts_sent: z.number(),
});
export type MyMessageHeader = z.infer<typeof MyMessageHeader>;

export type SdkAction =
  | { action: "SendMessage"; request: SendMessageRequest }
  | { action: "SendMessageBatch"; request: SendMessageBatchRequest }
  | { action: "PurgeQueue"; request: PurgeQueueRequest };

export type SdkResult =
  | { action: "SendMessage"; value: SendMessageResult }
  | { action: "SendMessageBatch"; value: SendMessageBatchResult }
  | { action: "PurgeQueue"; value: object };
