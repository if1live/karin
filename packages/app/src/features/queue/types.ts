import * as z from "zod";

// SQS 비슷하게 만들고 싶다
export const Message = z.object({
  messageId: z.string(),
  body: z.string(),
});
export type Message = z.infer<typeof Message>;
