import { Hono } from "hono";
import { MyRequest, MyResponse } from "../../system/index.js";

export const resource = "/lookup" as const;
export const app = new Hono();

export class LookupController {
  async index(req: MyRequest): Promise<MyResponse> {
    const payload = {};
    const file = "lookup_index";
    return {
      tag: "html",
      file,
      payload,
    };
  }
}

const controller = new LookupController();

app.get("/", async (c) => {
  const req = new MyRequest({});
  const resp = await controller.index(req);
  return MyResponse.respond(c, resp);
});
