import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { handle } from "hono/aws-lambda";
import * as R from "remeda";
import * as apps from "./apps.js";

const app = R.pipe(
  apps.initApp(),
  apps.decorateApp_site,
  apps.decorateApp_finalize,
);

const http_inner = handle(app);
export const dispatch = async (
  event: APIGatewayProxyEventV2,
  context: Context,
) => {
  // TODO: lint 한줄만 끄는 방법 있으면 좋겠는데. 몰라서 any 전체 풀었음
  const response = await http_inner(event as any, context);
  return response;
};
