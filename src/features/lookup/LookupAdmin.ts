import { Hono } from "hono";
import { z } from "zod";
import { MyRequest, MyResponse } from "../../system/index.js";
import { EventSourceMappingService } from "./services/EventSourceMappingService.js";
import { FunctionDefinitionService } from "./services/FunctionDefinitionService.js";
import { FunctionUrlService } from "./services/FunctionUrlService.js";

export const resource = "/lookup" as const;
export const app = new Hono();

const SynchronizeUrlInput = z.object({
  functionName: z.string(),
});
type SynchronizeUrlInput = z.infer<typeof SynchronizeUrlInput>;

export class LookupAdmin {
  async index(req: MyRequest): Promise<MyResponse> {
    const payload = {};
    const file = "admin/lookup_index";
    return {
      tag: "html",
      file,
      payload,
    };
  }

  async reset(req: MyRequest): Promise<MyResponse> {
    await FunctionUrlService.reset();
    await FunctionDefinitionService.reset();
    await EventSourceMappingService.reset();

    return {
      tag: "json",
      payload: {},
    };
  }

  async synchronize_list(req: MyRequest): Promise<MyResponse> {
    const founds = await FunctionDefinitionService.fetch();
    const results = await FunctionDefinitionService.synchronize(founds);

    // TODO: db에 목록이 저장되어야 한다
    // TODO: htmx 대응

    return {
      tag: "json",
      payload: results,
    };
  }

  async synchronize_url(
    req: MyRequest<SynchronizeUrlInput>,
  ): Promise<MyResponse> {
    const { input } = req;
    const founds = await FunctionUrlService.fetch(input);

    const first = founds[0];
    const result = first ? await FunctionUrlService.synchronize(first) : null;

    // TODO: htmx가 더 적절할듯
    return {
      tag: "json",
      payload: {},
    };
  }

  async synchronize_event(
    req: MyRequest<SynchronizeUrlInput>,
  ): Promise<MyResponse> {
    const { input } = req;
    const founds = await EventSourceMappingService.fetch(input);

    const first = founds[0];
    const result = first
      ? await EventSourceMappingService.synchronize(first)
      : null;

    return {
      tag: "json",
      payload: {},
    };
  }
}

const admin = new LookupAdmin();

app.get("", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.index(req);
  return MyResponse.respond(c, resp);
});

app.post("/synchronize/list", async (c) => {
  const req = new MyRequest({});
  const resp = await admin.synchronize_list(req);
  return MyResponse.respond(c, resp);
});

app.post("/synchronize/url", async (c) => {
  const body = await c.req.parseBody();
  const input = SynchronizeUrlInput.parse(body);

  const req = new MyRequest(input);
  const resp = await admin.synchronize_url(req);
  return MyResponse.respond(c, resp);
});

app.post("/synchronize/event", async (c) => {
  const body = await c.req.parseBody();
  const input = SynchronizeUrlInput.parse(body);

  const req = new MyRequest(input);
  const resp = await admin.synchronize_event(req);
  return MyResponse.respond(c, resp);
});
