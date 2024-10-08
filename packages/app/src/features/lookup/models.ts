import { parse } from "@aws-sdk/util-arn-parser";
import { Selectable } from "kysely";
import {
  EventSourceMapping,
  FunctionDefinition,
  FunctionUrl,
} from "../../tables/index.js";

const parse_functionArn = (functionArn: string) => {
  return parse(functionArn).resource.replace("function:", "");
};

// db에서 그대로 읽은것에 필요한 속성 몇개 더 넣어서 쓰고 싶다
export type FunctionDefinitionModel = Selectable<FunctionDefinition.Table> & {
  display_functionArn: string;
};

export const FunctionDefinitionModel = {
  create(input: Selectable<FunctionDefinition.Table>): FunctionDefinitionModel {
    return {
      ...input,
      display_functionArn: parse_functionArn(input.functionArn),
    };
  },
};

export type FunctionUrlModel = Selectable<FunctionUrl.Table> & {
  display_functionArn: string;
};

export const FunctionUrlModel = {
  create(input: Selectable<FunctionUrl.Table>): FunctionUrlModel {
    return {
      ...input,
      display_functionArn: parse_functionArn(input.functionArn),
    };
  },
};

export type EventSourceMappingModel = Selectable<EventSourceMapping.Table> & {
  display_eventSourceArn: string;
  display_functionArn: string;
};

export const EventSourceMappingModel = {
  create(input: Selectable<EventSourceMapping.Table>): EventSourceMappingModel {
    return {
      ...input,
      display_eventSourceArn: parse(input.eventSourceArn).resource,
      display_functionArn: parse_functionArn(input.functionArn),
    };
  },
};
