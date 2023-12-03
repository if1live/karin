import * as R from "remeda";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { handle } from "hono/aws-lambda";
import * as apps from "./apps.js";

const app = R.pipe(
  apps.initApp(),
  apps.decorateApp_admin,
  apps.decorateApp_finalize,
);

const http_inner = handle(app);
export const dispatch: APIGatewayProxyHandlerV2 = async (event, context) => {
  const response = await http_inner(event as any);
  return response;
};
