import {
  ListEventSourceMappingsCommand,
  ListFunctionEventInvokeConfigsCommand,
  ListFunctionUrlConfigsCommand,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";
import { Hono } from "hono";
import { z } from "zod";
import { lambdaClient } from "../../instances/index.js";
import { MyRequest, MyResponse } from "../../system/index.js";

export const resource = "/lookup" as const;
export const app = new Hono();

// aws-sdk의 타입 정보를 그대로 써도 되지만
// undefined 잔뜩 붙은거 대응하는 대신 zod로 변환
const FunctionDefinition = z.object({
  Description: z.string(),
  FunctionName: z.string(),
  FunctionArn: z.string(),
  Architectures: z.array(z.string()),
  Runtime: z.string(),
  MemorySize: z.number(),
  Timeout: z.number(),
  LastModified: z.coerce.date(),
});
type FunctionDefinition = z.infer<typeof FunctionDefinition>;

const FunctionUrlConfig = z.object({
  AuthType: z.string(),
  FunctionArn: z.string(),
  FunctionUrl: z.string(),
  CreationTime: z.coerce.date(),
  LastModifiedTime: z.coerce.date(),
});
type FunctionUrlConfig = z.infer<typeof FunctionUrlConfig>;

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

  async synchronize_list(req: MyRequest): Promise<MyResponse> {
    // TODO: function url 목록 얻을 방법?
    // 함수 이름은 list-functions로 얻을수 있는데 이중에 http 요청이 붙은 함수인걸 알아낼 방법이 없다.
    // 이름의 규격화로 추적해야 되나?
    // 아니면 다 저장하고 갱신을 내가 직접 눌러야하나?

    // TODO: 페이징 구현
    const output = await lambdaClient.send(
      new ListFunctionsCommand({ MaxItems: 100 }),
    );

    const schema = z.array(FunctionDefinition);
    const results = schema.parse(output.Functions);

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

    const output = await lambdaClient.send(
      new ListFunctionUrlConfigsCommand({
        FunctionName: input.functionName,
      }),
    );
    // TODO:
    if (!output.FunctionUrlConfigs) {
      throw new Error("function url not found");
    }
    if (output.FunctionUrlConfigs.length !== 1) {
      throw new Error("mismatch function url count");
    }

    // 배포를 여러개 하면 다른값이 나올수 있는듯? 근데 나는 하나만 쓸거니까
    const result = FunctionUrlConfig.parse(output.FunctionUrlConfigs[0]);
    console.log(result);

    // TODO: htmx가 더 적절할듯
    return {
      tag: "json",
      payload: result,
    };
  }

  async synchronize_event(
    req: MyRequest<SynchronizeUrlInput>,
  ): Promise<MyResponse> {
    const { input } = req;

    const output = await lambdaClient.send(
      new ListEventSourceMappingsCommand({
        FunctionName: input.functionName,
        MaxItems: 100,
      }),
    );

    console.log(output);

    return {
      tag: "json",
      payload: output,
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
