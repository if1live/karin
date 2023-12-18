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

/**
 * queue로 변경이 넘어왔을때 받을 채널
 * 채널을 queue별로 나누는걸 생각했으나
 * queue별로 pub/sub 관리가 귀찮을거같아서 하나로 통합
 * TODO: 상수 이름 대충 지어서 충돌 가능성이 있는데 나중에 생각한다.
 */
export const queueNotifyChannel = "karin:ch-queue";

export const QueueNotification = z.object({
  queueName: z.string(),
  count: z.number(),
  sentAt: z.coerce.date(),
  reservedAt: z.coerce.date(),
});
export type QueueNotification = z.infer<typeof QueueNotification>;
