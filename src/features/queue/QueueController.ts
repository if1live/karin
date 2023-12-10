import { Hono } from "hono";
import { MyRequest, MyResponse } from "../../system/index.js";

export const resource = "/queue" as const;
export const app = new Hono();

export class QueueController {
  async index(req: MyRequest): Promise<MyResponse> {
    const payload = {};
    return {
      tag: "json",
      payload,
    };
  }
}

const controller = new QueueController();

app.get("/", async (c) => {
  const req = new MyRequest({});
  const resp = await controller.index(req);
  return MyResponse.respond(c, resp);
});
