import {
  CamelCasePlugin,
  Dialect,
  Kysely,
  ParseJSONResultsPlugin,
  PostgresDialect,
  WithSchemaPlugin,
} from "kysely";
import { TablePrefixPlugin } from "kysely-plugin-prefix";
import * as settings from "../settings.js";
import { DB } from "../tables/index.js";
import * as DialectFactory from "./DialectFactory.js";

export const createDialect = DialectFactory.fromConnectionString;

export const createKysely = <T>(dialect: Dialect): Kysely<T> => {
  const plugins_basic = [
    new ParseJSONResultsPlugin(),
    new CamelCasePlugin(),
    new TablePrefixPlugin({ prefix: "karin" }),
  ];
  const plugins_pg =
    dialect instanceof PostgresDialect ? [new WithSchemaPlugin("infra")] : [];

  const plugins = [...plugins_basic, ...plugins_pg];

  return new Kysely<T>({
    dialect,
    plugins,
    // log: ["query", "error"],
  });
};

const dialect =
  settings.NODE_ENV === "test"
    ? createDialect(":memory:")
    : createDialect(settings.DATABASE_URL);

export const db = createKysely<DB>(dialect);
