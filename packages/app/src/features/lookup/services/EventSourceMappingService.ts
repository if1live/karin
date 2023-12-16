import {
  EventSourceMappingConfiguration,
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

    if (!found) {
      const result = await db
        .insertInto(table)
        .values({
          uuid,
          eventSourceArn: input.EventSourceArn ?? "",
          functionArn: input.FunctionArn ?? "",
          batchSize: input.BatchSize ?? 999,
          status: input.State ?? "",
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

  async reset() {
    const result = await db.deleteFrom(table).execute();
    return result;
  },
};
