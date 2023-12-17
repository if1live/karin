import { parse } from "@aws-sdk/util-arn-parser";
import { Hono } from "hono";
import * as R from "remeda";
import * as z from "zod";
import { lambdaClient, redis } from "../../instances/index.js";
import { MyResponse } from "../../system/index.js";
import { EventSourceMappingModel } from "../lookup/models.js";
import { EventSourceMappingService } from "../lookup/services/EventSourceMappingService.js";
import { QueueService } from "../queue/services/QueueService.js";
import { InvokeService } from "./InvokeService.js";

export const resource = "/consumer" as const;
export const app = new Hono();

const indexLocation = `/admin${resource}`;

app.get("", async (c) => {
  // TODO: 중복 코드 제거?
  const founds = await EventSourceMappingService.list();
  const entries = founds.map((x) => EventSourceMappingModel.create(x));

  const payload = {
    entries,
  };

  const resp: MyResponse = {
    tag: "render",
    file: "admin/consumer_index",
    payload,
  };
  return MyResponse.respond(c, resp);
});

const ConsumeReq = z.object({
  uuid: z.string(),
});

app.post("/consume", async (c) => {
  const now = new Date();
  const body = await c.req.parseBody();
  const input = ConsumeReq.parse(body);
  const { uuid } = input;

  const found = await EventSourceMappingService.findByUUID(uuid);
  if (!found) {
    throw new Error("event source mapping not found");
  }
  const mapping = EventSourceMappingModel.create(found);
  const {
    display_eventSourceArn: queueName,
    display_functionArn: functionName,
  } = mapping;

  const queueService = new QueueService(redis, queueName);
  const batchSize = found.batchSize ?? 1;
  const records = await queueService.peek(now, batchSize);
  if (records.length <= 0) {
    return c.json({ message: "no records" });
  }

  // TODO: null 처리? null은 service 수준에서 리턴 안하는게 낫나?
  const records_valid = records.filter(R.isNonNull);
  await queueService.mdel(records_valid.map((x) => x.message.id));

  const invokeService = new InvokeService(
    lambdaClient,
    queueName,
    functionName,
  );
  const result = await invokeService.invoke(records_valid);

  return c.json(result as any);
});
