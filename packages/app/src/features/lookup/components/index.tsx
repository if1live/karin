import { parse } from "@aws-sdk/util-arn-parser";
import { Selectable } from "kysely";
import {
  FunctionDefinition,
  FunctionUrl,
} from "../../../tables/index.js";

export const FunctionLink = (props: {
  definition: Selectable<FunctionDefinition>;
  url?: Selectable<FunctionUrl>;
}) => {
  const definitionTokens = parse(props.definition.functionArn);
  const functionName = definitionTokens.resource.replace("function:", "");

  const url = props.url?.functionUrl;
  return url ? <a href={url}>{functionName}</a> : <span>{functionName}</span>;
};
