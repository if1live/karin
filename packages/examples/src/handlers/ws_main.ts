import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyWebsocketHandlerV2,
  Context,
} from "aws-lambda";
import { redis } from "../instances.js";
import { ConnectionAction, ConnectionRepository } from "../repositories.js";
import * as settings from "../settings.js";

const repo = new ConnectionRepository(redis);

export const handle_connection: APIGatewayProxyHandler = async (
  event,
  context,
) => {
  const eventType = event.requestContext.eventType;
  switch (eventType) {
    case "CONNECT":
      return await fn_connect(event, context);
    case "DISCONNECT":
      return await fn_disconnect(event, context);
    default: {
      console.error(`unknown eventType: ${eventType}`);
      return {
        statusCode: 200,
        body: "OK",
      };
    }
  }
};

export const handle_default: APIGatewayProxyWebsocketHandlerV2 = async (
  event,
  context,
) => {
  const connectionId = event.requestContext.connectionId;
  const endpoint = deriveEndpoint(event);
  const client = ConnectionAction.client(endpoint);
  const data = `pong,${connectionId},${event.body}`;
  const output = await ConnectionAction.post(client, connectionId, data);
  return {
    statusCode: 200,
    body: "OK",
  };
};

const fn_connect = async (event: APIGatewayProxyEvent, context: Context) => {
  const connectionId = event.requestContext.connectionId ?? "";
  const requestAt = new Date(event.requestContext.requestTimeEpoch);
  console.log("connect", { connectionId });

  await repo.add({
    connectionId,
    endpoint: deriveEndpoint(event),
    ts_request: requestAt.getTime(),
  });

  return {
    statusCode: 200,
    body: "OK",
  };
};

const fn_disconnect = async (event: APIGatewayProxyEvent, context: Context) => {
  const connectionId = event.requestContext.connectionId ?? "";
  const requestAt = new Date(event.requestContext.requestTimeEpoch);
  console.log("disconnect", { connectionId });

  await repo.del(connectionId);

  return {
    statusCode: 200,
    body: "OK",
  };
};

function deriveEndpoint(
  event: APIGatewayProxyEvent | APIGatewayProxyWebsocketEventV2,
): string {
  // lambda: f3w1jmmhb3.execute-api.ap-northeast-2.amazonaws.com/dev
  // offline: private.execute-api.ap-northeast-2.amazonaws.com/local
  const region = settings.AWS_REGION;
  const apiId = event.requestContext.apiId;
  const stage = event.requestContext.stage;

  const endpoint_prod = `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;

  // APIGatewayProxyWebsocketEventV2로는 포트 정보까지 얻을 수 없다.
  // 로컬이라고 가정되면 좌표가 뻔해서 편법을 써도 된다
  const endpoint_private = "ws://127.0.0.1:3001";

  return apiId === "private" ? endpoint_private : endpoint_prod;
}
