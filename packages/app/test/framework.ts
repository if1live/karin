import { CamelCasePlugin, Kysely, ParseJSONResultsPlugin } from "kysely";
import { TablePrefixPlugin } from "kysely-plugin-prefix";
import { createDialect } from "../src/instances/index.js";
import { DB, createSQLiteSchema } from "../src/tables/index.js";
import {
  tableName_EventSourceMapping,
  tableName_FunctionDefinition,
  tableName_FunctionUrl,
} from "../src/tables/index.js";

export const TestDatabase = {
  async prepare(): Promise<Kysely<DB>> {
    const dialect = createDialect(":memory:");
    return new Kysely<DB>({
      dialect,
      plugins: [
        new ParseJSONResultsPlugin(),
        new CamelCasePlugin(),
        new TablePrefixPlugin({ prefix: "karin" }),
      ],
      // log: ["query", "error"],
    });
  },
  async create(db: Kysely<DB>) {
    await createSQLiteSchema(db);
  },
  async destroy(db: Kysely<DB>) {
    const tables = [
      tableName_EventSourceMapping,
      tableName_FunctionDefinition,
      tableName_FunctionUrl,
    ];
    for (const tableName of tables) {
      await db.schema.dropTable(tableName).execute();
    }
  },
};
