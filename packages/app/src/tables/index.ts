export * from "./tables.js";

import { ColumnType, Kysely, SqliteAdapter } from "kysely";
import {
  EventSourceMapping,
  FunctionDefinition,
  FunctionUrl,
} from "./tables.js";

export interface DB {
  [EventSourceMapping.name]: EventSourceMapping.Table;
  [FunctionDefinition.name]: FunctionDefinition.Table;
  [FunctionUrl.name]: FunctionUrl.Table;
}

export const tableName_EventSourceMapping = EventSourceMapping.name;
export const tableName_FunctionDefinition = FunctionDefinition.name;
export const tableName_FunctionUrl = FunctionUrl.name;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

const prepare_functionDefinition = (db: Kysely<DB>) =>
  db.schema
    .createTable(FunctionDefinition.name)
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("functionName", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("functionArn", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("payload", "json", (col) => col.notNull());

const prepare_functionUrl = (db: Kysely<DB>) =>
  db.schema
    .createTable(FunctionUrl.name)
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("functionArn", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("functionUrl", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("payload", "json", (col) => col.notNull());

const prepare_eventSourceMapping = (db: Kysely<DB>) =>
  db.schema
    .createTable(EventSourceMapping.name)
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("eventSourceArn", "varchar(255)", (col) =>
      col.notNull().unique(),
    )
    .addColumn("functionArn", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("payload", "json", (col) => col.notNull());

export const createSQLiteSchema = async (db: Kysely<DB>) => {
  if (db.getExecutor().adapter instanceof SqliteAdapter) {
    await prepare_functionDefinition(db).execute();
    await prepare_functionUrl(db).execute();
    await prepare_eventSourceMapping(db).execute();
  }
};
