import {
  EventSourceMappingConfiguration,
  FunctionConfiguration,
  FunctionUrlConfig,
  ListEventSourceMappingsCommand,
  ListFunctionUrlConfigsCommand,
  ListFunctionsCommand,
} from "@aws-sdk/client-lambda";
import * as R from "remeda";
import { db, lambdaClient } from "../../instances/index.js";
import {
  tableName_EventSourceMapping,
  tableName_FunctionDefinition,
  tableName_FunctionUrl,
} from "../../tables/types.js";

export const FunctionDefinitionService = {
  async fetch(): Promise<FunctionConfiguration[]> {
    // TODO: 페이징 구현? 당장은 함수가 그정도로 많지 않을거다
    const output = await lambdaClient.send(
      new ListFunctionsCommand({ MaxItems: 100 }),
    );
    const list = output.Functions ?? [];
    return list;
  },

  async synchronize(inputs: FunctionConfiguration[]) {
    const table = tableName_FunctionDefinition;

    const founds = await db.selectFrom(table).selectAll().execute();
    type Tuple = (typeof founds)[number];

    const map_prev = new Map<string, Tuple>();
    for (const found of founds) {
      map_prev.set(found.functionArn, found);
    }

    const map_next = new Map<string, FunctionConfiguration>();
    for (const input of inputs) {
      if (!input.FunctionArn) {
        throw new Error("empty FunctionArn");
      }
      map_next.set(input.FunctionArn, input);
    }

    // o -> o: update
    // o -> x: delete
    // x -> o: insert

    const candidates_update = [...map_prev.values()]
      .map((prev) => {
        const next = map_next.get(prev.functionArn);
        return next ? { prev, next } : null;
      })
      .filter(R.isNonNull)
      .filter(({ prev, next }) => {
        // 갱신 시간 기준으로 변경되었는지 확인
        // TODO: payload 전체를 비교하는게 더 좋을거같긴한데
        const key: keyof typeof next = "LastModified" as const;
        const val_prev = (prev.payload as any)[key];
        const val_next = next[key];
        return val_prev !== val_next;
      });

    const candidates_delete = [...map_prev.values()]
      .map((prev) => {
        const next = map_next.get(prev.functionArn);
        return next ? null : { prev, next: null };
      })
      .filter(R.isNonNull);

    const candidates_insert = [...map_next.values()]
      .map((next) => {
        const prev = map_prev.get(next.FunctionArn ?? "");
        return prev ? null : { prev: null, next };
      })
      .filter(R.isNonNull);

    if (candidates_update.length > 0) {
      for (const { prev, next } of candidates_update) {
        await db
          .updateTable(table)
          .where("functionArn", "=", prev.functionArn)
          .set({
            functionArn: next.FunctionArn ?? "",
            functionName: next.FunctionName ?? "",
            payload: JSON.stringify(next),
          })
          .execute();
      }
    }

    if (candidates_delete.length > 0) {
      const arns = candidates_delete.map((x) => x.prev.functionArn);
      const result = await db
        .deleteFrom(table)
        .where("functionArn", "in", arns)
        .execute();
    }

    if (candidates_insert.length > 0) {
      const values = candidates_insert.map((x) => {
        return {
          functionName: x.next.FunctionName ?? "",
          functionArn: x.next.FunctionArn ?? "",
          payload: JSON.stringify(x.next),
        };
      });
      const result = await db.insertInto(table).values(values).execute();
    }

    return {
      count_prev: map_prev.size,
      count_next: map_next.size,
      action_update: candidates_update.length,
      action_delete: candidates_delete.length,
      action_insert: candidates_insert.length,
    };
  },
};

export const FunctionUrlService = {
  async fetch(input: {
    functionName: string;
  }): Promise<FunctionUrlConfig[]> {
    const output = await lambdaClient.send(
      new ListFunctionUrlConfigsCommand({
        FunctionName: input.functionName,
      }),
    );

    // 배포를 여러개 하면 다른값이 나올수 있는듯? 근데 나는 하나만 쓸거니까
    const list = output.FunctionUrlConfigs ?? [];
    return list;
  },

  async synchronize(input: FunctionUrlConfig) {
    const table = tableName_FunctionUrl;
    const functionArn = input.FunctionArn ?? "";

    const found = await db
      .selectFrom(table)
      .selectAll()
      .where("functionArn", "=", functionArn)
      .executeTakeFirst();

    if (!found) {
      const result = await db
        .insertInto(table)
        .values({
          functionArn,
          functionUrl: input.FunctionUrl ?? "",
          payload: JSON.stringify(input),
        })
        .execute();
      return result;
    }

    const result = await db
      .updateTable(table)
      .where("functionArn", "=", functionArn)
      .set({
        functionUrl: input.FunctionUrl ?? "",
        payload: JSON.stringify(input),
      })
      .execute();
    return result;
  },
};

export const EventSourceMappingService = {
  async fetch(input: {
    functionName: string;
  }): Promise<EventSourceMappingConfiguration[]> {
    const output = await lambdaClient.send(
      new ListEventSourceMappingsCommand({
        FunctionName: input.functionName,
        MaxItems: 100,
      }),
    );

    const list = output.EventSourceMappings ?? [];
    return list;
  },

  async synchronize(input: EventSourceMappingConfiguration) {
    const table = tableName_EventSourceMapping;
    const uuid = input.UUID ?? "";

    const found = await db
      .selectFrom(table)
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!found) {
      const result = await db
        .insertInto(table)
        .values({
          uuid,
          eventSourceArn: input.EventSourceArn ?? "",
          functionArn: input.FunctionArn ?? "",
          payload: JSON.stringify(input),
        })
        .execute();
      return result;
    }

    // else...
    const result = await db
      .updateTable(table)
      .where("uuid", "=", uuid)
      .set({
        eventSourceArn: input.EventSourceArn ?? "",
        functionArn: input.FunctionArn ?? "",
        payload: JSON.stringify(input),
      })
      .execute();
    return result;
  },
};
