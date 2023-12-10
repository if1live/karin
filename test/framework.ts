import { CamelCasePlugin, Kysely, ParseJSONResultsPlugin } from "kysely";
import { TablePrefixPlugin } from "kysely-plugin-prefix";
import { selectDialect } from "../src/instances/rdbms.js";
import { DB } from "../src/tables/tables.js";
import {
  tableName_EventSourceMapping,
  tableName_FunctionDefinition,
  tableName_FunctionUrl,
} from "../src/tables/types.js";

const prepare_functionDefinition = async (db: Kysely<DB>) => {
  await db.schema
    .createTable(tableName_FunctionDefinition)
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("functionName", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("functionArn", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("payload", "json", (col) => col.notNull())
    .execute();
};

const prepare_functionUrl = async (db: Kysely<DB>) => {
  await db.schema
    .createTable(tableName_FunctionUrl)
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("functionArn", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("functionUrl", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("payload", "json", (col) => col.notNull())
    .execute();
};

const prepare_eventSourceMapping = async (db: Kysely<DB>) => {
  await db.schema
    .createTable(tableName_EventSourceMapping)
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("eventSourceArn", "varchar(255)", (col) =>
      col.notNull().unique(),
    )
    .addColumn("functionArn", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("payload", "json", (col) => col.notNull())
    .execute();
};

export const TestDatabase = {
  async prepare(): Promise<Kysely<DB>> {
    const dialect = await selectDialect()();
    return new Kysely<DB>({
      dialect,
      plugins: [
        new ParseJSONResultsPlugin(),
        new CamelCasePlugin(),
        new TablePrefixPlugin({ prefix: "miyako" }),
      ],
      // log: ["query", "error"],
    });
  },
  async create(db: Kysely<DB>) {
    await prepare_functionDefinition(db);
    await prepare_functionUrl(db);
    await prepare_eventSourceMapping(db);
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
