import { parse } from "@aws-sdk/util-arn-parser";
import { Hono } from "hono";
import * as z from "zod";
import { redis } from "../../instances/index.js";
import { MyRequest, MyResponse } from "../../system/index.js";
import { EventSourceMappingService } from "../lookup/services/EventSourceMappingService.js";
import { QueueService } from "./services/QueueService.js";

export const resource = "/queue" as const;
export const app = new Hono();

const indexLocation = `/admin${resource}`;

const QueueNameInput = z.object({
  queueName: z.string(),
});
type QueueNameInput = z.infer<typeof QueueNameInput>;

export class QueueAdmin {
  async index(req: MyRequest): Promise<MyResponse> {
    const founds = await EventSourceMappingService.list();
    const entries = founds.map((x) => {
      const display_eventSourceArn = parse(x.eventSourceArn).resource;
      const display_functionArn = parse(x.functionArn).resource;
      return {
        ...x,
        display_eventSourceArn,
        display_functionArn,
      };
    });

    const payload = {
      entries,
    };
    const file = "admin/queue_index";
    return {
      tag: "render",
      file,
      payload,
    };
  }
}

const admin = new QueueAdmin();

app.get("", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.index(req);
  return MyResponse.respond(c, resp);
});

app.post("/purge", async (c) => {
  const body = await c.req.parseBody();
  const input = QueueNameInput.parse(body);
  const { queueName: name } = input;

  const s = new QueueService(redis, name);
  await s.purge();

  return c.redirect(indexLocation);
});

app.get("/inspect", async (c) => {
  const body = c.req.query();
  const input = QueueNameInput.parse(body);
  const { queueName: name } = input;

  const s = new QueueService(redis, name);
  const result = await s.inspect();

  return c.json(result as any);
});
