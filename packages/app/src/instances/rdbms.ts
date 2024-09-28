import {
  CamelCasePlugin,
  Dialect,
  Kysely,
  ParseJSONResultsPlugin,
  PostgresDialect,
  SqliteDialect,
} from "kysely";
import { TablePrefixPlugin } from "kysely-plugin-prefix";
import * as settings from "../settings.js";
import { DB } from "../tables/index.js";

type DialectFn = () => Promise<Dialect>;

const createDialect_sqlite: DialectFn = async () => {
  // 빌드에서 제외하고 싶은 패키지라서 await import
  const { default: SQLite } = await import("better-sqlite3");
  return new SqliteDialect({
    database: new SQLite(":memory:"),
  });
};

const createDialect_postgres: DialectFn = async () => {
  const { Pool } = await import("pg");

  const url = new URL(settings.DATABASE_URL);

  const isAwsLambda = !!process.env.LAMBDA_TASK_ROOT;
  const connectionLimit = isAwsLambda ? 1 : 5;

  const pool = new Pool({
    database: url.pathname.replace("/", ""),
    host: url.hostname,
    user: url.username,
    password: url.password,
    port: url.port !== "" ? parseInt(url.port, 10) : undefined,
    max: connectionLimit,
  });

  return new PostgresDialect({
    pool: pool,
  });
};

export const selectDialect = (): (() => Promise<Dialect>) => {
  switch (settings.NODE_ENV) {
    case "development":
    case "production":
      return createDialect_postgres;
    case "test":
      return createDialect_sqlite;
    default:
      throw new Error("unknown dialect", {
        cause: { NODE_ENV: settings.NODE_ENV },
      });
  }
};

export const createKysely = <T>(dialect: Dialect): Kysely<T> => {
  return new Kysely<T>({
    dialect,
    plugins: [
      new ParseJSONResultsPlugin(),
      new CamelCasePlugin(),
      new TablePrefixPlugin({ prefix: "karin" }),
    ],
    // log: ["query", "error"],
  });
};

const dialect = await selectDialect()();
export const db = createKysely<DB>(dialect);
