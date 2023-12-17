import {
  EventSourceMappingConfiguration,
  FunctionResponseType,
  ListEventSourceMappingsCommand,
} from "@aws-sdk/client-lambda";
import { lambdaClient } from "../../../instances/aws.js";
import { db } from "../../../instances/rdbms.js";
import { tableName_EventSourceMapping } from "../../../tables/types.js";

const table = tableName_EventSourceMapping;

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
    const uuid = input.UUID ?? "";

    const found = await db
      .selectFrom(table)
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    const functionResponseType: FunctionResponseType | null =
      input.FunctionResponseTypes
        ? input.FunctionResponseTypes[0] ?? null
        : null;

    const data = {
      eventSourceArn: input.EventSourceArn ?? "",
      functionArn: input.FunctionArn ?? "",
      batchSize: input.BatchSize ?? null,
      maximumBatchingWindow: input.MaximumBatchingWindowInSeconds ?? null,
      maximumConcurrency: input.ScalingConfig?.MaximumConcurrency ?? null,
      functionResponseType,
      status: input.State ?? "",
      payload: JSON.stringify(input),
    };

    if (!found) {
      const result = await db
        .insertInto(table)
        .values({ ...data, uuid })
        .execute();
      return result;
    }

    // else...
    const result = await db
      .updateTable(table)
      .where("uuid", "=", uuid)
      .set(data)
      .execute();
    return result;
  },

  async reset() {
    const result = await db.deleteFrom(table).execute();
    return result;
  },

  async findByFunctionArn(arn: string) {
    const found = await db
      .selectFrom(table)
      .selectAll()
      .where("functionArn", "=", arn)
      .executeTakeFirst();
    return found;
  },

  async findByUUID(uuid: string) {
    const found = await db
      .selectFrom(table)
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return found;
  },

  async deleteByFunctionArn(arn: string) {
    await db.deleteFrom(table).where("functionArn", "=", arn).execute();
  },

  async list() {
    const founds = await db
      .selectFrom(tableName_EventSourceMapping)
      .selectAll()
      .execute();
    return founds;
  },
};
