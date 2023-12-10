import type { ColumnType, Generated } from "kysely";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type JsonArray = JsonValue[];
export type JsonObject = { [K in string]?: JsonValue };
export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonArray | JsonObject | JsonPrimitive;
export type Json = ColumnType<JsonValue, JsonValue, string>;

/**
 * FunctionConfiguration
 */
export type FunctionDefinition = {
  id: Generated<number>;
  functionName: string;
  functionArn: string;
  data: Json;
};

/**
 * FunctionUrlConfig
 */
export type FunctionUrl = {
  id: Generated<number>;

  /** @example "arn:aws:lambda:ap-northeast-1:123456789012:function:ayane-dev-http" */
  functionArn: string;

  /** @example "https://abcdefghijk.lambda-url.ap-northeast-1.on.aws/" */
  functionUrl: string;

  data: Json;
};

/**
 * Lambda <-> SQS
 * EventSourceMappingConfiguration
 */
export type EventSourceMapping = {
  id: Generated<number>;

  uuid: string;

  /** @example "arn:aws:sqs:ap-northeast-1:123456789012:toki-example-dev" */
  eventSourceArn: string;

  /** @example "arn:aws:lambda:ap-northeast-1:123456789012:function:toki-example-dev-sqsMain" */
  functionArn: string;

  data: Json;
};

export type DB = {
  functionDefinition: FunctionDefinition;
  functionUrl: FunctionUrl;
  eventSourceMapping: EventSourceMapping;
};
