import { parse } from "@aws-sdk/util-arn-parser";
import { Selectable } from "kysely";
import {
  EventSourceMapping,
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

export const SynchronizeUrlButton = (props: { functionName: string }) => {
  const { functionName } = props;
  return (
    <form method="post" action="/admin/lookup/synchronize/url">
      <input type="hidden" name="functionName" value={functionName} />
      <button class="ui mini button" type="submit">
        url
      </button>
    </form>
  );
};

export const SynchronizeEventButton = (props: { functionName: string }) => {
  const { functionName } = props;
  return (
    <form method="post" action="/admin/lookup/synchronize/event">
      <input type="hidden" name="functionName" value={functionName} />
      <button class="ui mini button" type="submit">
        event
      </button>
    </form>
  );
};

export const EventSourceMappingCell = (props: {
  mapping: Selectable<EventSourceMapping>;
}) => {
  const { mapping } = props;
  const parsed = parse(mapping.eventSourceArn);
  const name = parsed.resource;
  return (
    <dl>
      <dt>name</dt>
      <dd>{name}</dd>
      <dt>batch size</dt>
      <dd>{mapping.batchSize}</dd>
    </dl>
  );
};
