import { db } from "../../../instances/rdbms.js";
import {
  tableName_EventSourceMapping,
  tableName_FunctionDefinition,
  tableName_FunctionUrl,
} from "../../../tables/index.js";

export const LookupService = {
  async load() {
    const list_definition = await db
      .selectFrom(tableName_FunctionDefinition)
      .selectAll()
      .execute();

    const list_url = await db
      .selectFrom(tableName_FunctionUrl)
      .selectAll()
      .execute();

    const list_mapping = await db
      .selectFrom(tableName_EventSourceMapping)
      .selectAll()
      .execute();

    const map_url = new Map<string, (typeof list_url)[number]>();
    for (const x of list_url) {
      map_url.set(x.functionArn, x);
    }

    const map_mapping = new Map<string, (typeof list_mapping)[number]>();
    for (const x of list_mapping) {
      map_mapping.set(x.functionArn, x);
    }

    const entries = list_definition.map((definition) => {
      const url = map_url.get(definition.functionArn);
      const mapping = map_mapping.get(definition.functionArn);
      return { definition, url, mapping };
    });

    return entries;
  },
};
