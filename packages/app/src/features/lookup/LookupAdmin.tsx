import { Hono } from "hono";
import { z } from "zod";
import { Layout } from "../../components/index.js";
import {
  EventSourceMappingCell,
  FunctionLink,
  SynchronizeEventButton,
  SynchronizeUrlButton,
} from "./components/index.js";
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

app.get("", async (c) => {
  const list = await LookupService.load();

  return c.html(
    <Layout>
      <h2>admin</h2>
      <table class="ui table">
        <thead>
          <tr>
            <th>name</th>
            <th>event source mapping</th>
            <th>action</th>
            <th>action</th>
          </tr>
        </thead>
        <tbody>
          {list.map((x) => {
            const functionName = x.definition.functionName;

            return (
              <tr>
                <td>
                  <FunctionLink definition={x.definition} url={x.url} />
                </td>
                <td>
                  {x.mapping ? (
                    <EventSourceMappingCell mapping={x.mapping} />
                  ) : (
                    "<BLANK>"
                  )}
                </td>
                <td>
                  <SynchronizeUrlButton functionName={functionName} />
                </td>
                <td>
                  <SynchronizeEventButton functionName={functionName} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>action</h3>

      <form method="post" action="/admin/lookup/synchronize/list">
        <button class="ui primary button" type="submit">
          synchronize
        </button>
      </form>

      <form method="post" action="/admin/lookup/reset">
        <button class="ui button" type="submit">
          reset
        </button>
      </form>
    </Layout>,
  );
});

// TODO: 전체 갱신은 무식하지만 확실한 방법
app.post("/reset", async (c) => {
  await FunctionUrlService.reset();
  await FunctionDefinitionService.reset();
  await EventSourceMappingService.reset();

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
