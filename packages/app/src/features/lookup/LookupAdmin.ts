import { parse } from "@aws-sdk/util-arn-parser";
import { Hono } from "hono";
import { z } from "zod";
import { MyResponse } from "../../system/index.js";
import { EventSourceMappingService } from "./services/EventSourceMappingService.js";
import { FunctionDefinitionService } from "./services/FunctionDefinitionService.js";
import { FunctionUrlService } from "./services/FunctionUrlService.js";
import { LookupService } from "./services/LookupService.js";

export const resource = "/lookup" as const;
export const app = new Hono();

const indexLocation = `/admin${resource}`;

const FunctionNameInput = z.object({
  functionName: z.string(),
});
type FunctionNameInput = z.infer<typeof FunctionNameInput>;

const FunctionArnInput = z.object({
  functionArn: z.string(),
});
type FunctionArnInput = z.infer<typeof FunctionArnInput>;

app.get("", async (c) => {
  const list_naive = await LookupService.load();
  const list = list_naive.map((entry) => {
    const fn_definition = (prev: NonNullable<(typeof entry)["definition"]>) => {
      const parsed = parse(prev.functionArn);
      return {
        display_functionArn: parsed.resource,
        ...prev,
      };
    };

    const fn_url = (prev: NonNullable<(typeof entry)["url"]>) => {
      const parsed = parse(prev.functionArn);
      return {
        display_functionArn: parsed.resource,
        ...prev,
      };
    };

    const fn_mapping = (prev: NonNullable<(typeof entry)["mapping"]>) => {
      return {
        display_functionArn: parse(prev.functionArn).resource,
        display_eventSourceArn: parse(prev.eventSourceArn).resource,
        ...prev,
      };
    };

    const definition = entry.definition
      ? fn_definition(entry.definition)
      : null;
    const url = entry.url ? fn_url(entry.url) : null;
    const mapping = entry.mapping ? fn_mapping(entry.mapping) : null;

    return {
      definition,
      url,
      mapping,
    };
  });

  const result: MyResponse = {
    tag: "render",
    file: "admin/lookup_index",
    payload: { list },
  };
  return MyResponse.respond(c, result);
});

// TODO: 전체 갱신은 무식하지만 확실한 방법
app.post("/truncate", async (c) => {
  await FunctionDefinitionService.reset();
  await FunctionUrlService.reset();
  await EventSourceMappingService.reset();

  return c.redirect(indexLocation);
});

app.post("/reset", async (c) => {
  const body = await c.req.parseBody();
  const input = FunctionArnInput.parse(body);
  const { functionArn } = input;

  await FunctionUrlService.deleteByFunctionArn(functionArn);
  await EventSourceMappingService.deleteByFunctionArn(functionArn);
  return c.redirect(indexLocation);
});

app.post("/synchronize/list", async (c) => {
  const founds = await FunctionDefinitionService.fetch();
  const results = await FunctionDefinitionService.synchronize(founds);

  return c.redirect(indexLocation);
});

app.post("/synchronize/url", async (c) => {
  const body = await c.req.parseBody();
  const input = FunctionNameInput.parse(body);

  const founds = await FunctionUrlService.fetch(input);
  const first = founds[0];
  const result = first ? await FunctionUrlService.synchronize(first) : null;

  return c.redirect(indexLocation);
});

app.post("/synchronize/event", async (c) => {
  const body = await c.req.parseBody();
  const input = FunctionNameInput.parse(body);

  const founds = await EventSourceMappingService.fetch(input);
  const first = founds[0];
  const result = first
    ? await EventSourceMappingService.synchronize(first)
    : null;

  return c.redirect(indexLocation);
});

// 디버깅 목적으로 상세 정보 뜯을 방법 열어두기
app.get("/inspect", async (c) => {
  const body = c.req.query();
  const input = FunctionNameInput.parse(body);
  const name = input.functionName;

  const definition = await FunctionDefinitionService.findByFunctionName(name);
  const arn = definition?.functionArn;

  const url = arn ? await FunctionUrlService.findByFunctionArn(arn) : null;

  const mapping = arn
    ? await EventSourceMappingService.findByFunctionArn(arn)
    : null;

  const payload = {
    definition: definition ?? null,
    url: url ?? null,
    mapping: mapping ?? null,
  };
  return c.json(payload as any);
});
