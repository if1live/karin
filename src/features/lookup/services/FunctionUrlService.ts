import {
  FunctionUrlConfig,
  ListFunctionUrlConfigsCommand,
} from "@aws-sdk/client-lambda";
import { lambdaClient } from "../../../instances/aws.js";
import { db } from "../../../instances/rdbms.js";
import { tableName_FunctionUrl } from "../../../tables/types.js";

const table = tableName_FunctionUrl;

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

  async reset() {
    await db.deleteFrom(table).execute();
  },
};
