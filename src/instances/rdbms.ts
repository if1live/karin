import {
  Dialect,
  Kysely,
  MysqlDialect,
  ParseJSONResultsPlugin,
  SqliteDialect,
} from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { TablePrefixPlugin } from "kysely-plugin-prefix";
import * as settings from "../settings.js";
import { DB } from "../tables.js";

type DialectFn = () => Promise<Dialect>;

const createDialect_sqlite: DialectFn = async () => {
  // 빌드에서 제외하고 싶은 패키지라서 await import
  const { default: SQLite } = await import("better-sqlite3");
  return new SqliteDialect({
    database: new SQLite(":memory:"),
  });
};

const createDialect_mysql: DialectFn = async () => {
  // 빌드에서 제외하고 싶은 패키지라서 await import
  const { default: Mysql } = await import("mysql2");

  const url = new URL(settings.DATABASE_URL);
  const pool = Mysql.createPool({
    database: url.pathname.replace("/", ""),
    host: url.hostname,
    user: url.username,
    password: url.password,
    port: url.port !== "" ? parseInt(url.port, 10) : undefined,
    connectionLimit: 5,
    // 로컬에서 접속할때는 필요없는 속성. planetscale로 접속할때만 필요
    // ssl: { rejectUnauthorized: true },
  });

  return new MysqlDialect({
    pool: pool,
  });
};

const createDialect_planetscale: DialectFn = async () => {
  return new PlanetScaleDialect({
    url: settings.DATABASE_URL,
    fetch: fetch,
  });
};

export const selectDialect = (): (() => Promise<Dialect>) => {
  switch (settings.NODE_ENV) {
    case "development":
      return createDialect_mysql;
    case "production":
      return createDialect_planetscale;
    case "test":
      return createDialect_sqlite;
    default:
      return createDialect_sqlite;
  }
};

export const createKysely = <T>(dialect: Dialect): Kysely<T> => {
  return new Kysely<T>({
    dialect,
    plugins: [
      new ParseJSONResultsPlugin(),
      new TablePrefixPlugin({ prefix: "miyako" }),
    ],
    // log: ["query", "error"],
  });
};

const dialect = await selectDialect()();
export const db = createKysely<DB>(dialect);
