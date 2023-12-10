import { Hono } from "hono";
import { db } from "../../instances/rdbms.js";
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

  async list(req: MyRequest): Promise<MyResponse> {
    const list_definition = await db
      .selectFrom("functionDefinition")
      .selectAll()
      .execute();

    const list_url = await db.selectFrom("functionUrl").selectAll().execute();

    const list_mapping = await db
      .selectFrom("eventSourceMapping")
      .selectAll()
      .execute();

    const payload = {
      list_definition,
      list_url,
      list_mapping,
    };

    return {
      tag: "json",
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

app.get("/list", async (c) => {
  const req = new MyRequest({});
  const resp = await controller.list(req);
  return MyResponse.respond(c, resp);
});
