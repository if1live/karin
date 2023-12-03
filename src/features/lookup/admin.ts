import {
  ListFunctionUrlConfigsCommand,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";
import { Hono } from "hono";
import { z } from "zod";
import { engine, lambdaClient, redis } from "../../instances.js";

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

app.get("", async (c) => {
  const text = await engine.renderFile("admin/lookup_index", {});
  return c.html(text);
});

app.post("/synchronize/list", async (c) => {
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

  return c.json(results);
});

app.post("/synchronize/url", async (c) => {
  // TODO: 명세 기반으로 안바꿔도 되나? 귀찮은데 대충 쓰자
  const Req = z.object({
    functionName: z.string(),
  });
  type Req = z.infer<typeof Req>;

  const body = await c.req.parseBody();
  const req = Req.parse(body);

  const output = await lambdaClient.send(
    new ListFunctionUrlConfigsCommand({
      FunctionName: req.functionName,
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
  return c.json(result);
});
