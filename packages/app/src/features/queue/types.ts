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
