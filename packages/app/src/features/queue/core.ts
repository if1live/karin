import { parse } from "@aws-sdk/util-arn-parser";
import { db } from "../../instances/index.js";

// TODO: 큐 목록을 얻어서 채널 목록 생성하는 시점? 서버 재시작 시점?
// lookup하고 얽혀서 얻어야한다

const founds = await db
  .selectFrom("eventSourceMapping")
  .select(["eventSourceArn", "functionArn"])
  .execute();

export type ActionMapping = {
  queue: string;
  lambda: string;
};

export const actionMappings = founds.map((found): ActionMapping => {
  const eventSource = parse(found.eventSourceArn);
  const lambda = parse(found.functionArn);
  return {
    queue: eventSource.resource,
    lambda: lambda.resource,
  } as const;
});
console.log("actionMappings", actionMappings);

// TODO: 구독 구현?
