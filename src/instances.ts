import { Kysely, MysqlDialect } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import { Liquid } from "liquidjs";
import type { default as Mysql } from "mysql2";
import * as settings from "./settings.js";
import { DB } from "./tables/index.js";

/*
const createMysqlPool = async (url: URL): Promise<Mysql.Pool> => {
  const { default: Mysql } = await import("mysql2");
  return Mysql.createPool({
    database: url.pathname.replace("/", ""),
    host: url.hostname,
    user: url.username,
    password: url.password,
    port: url.port !== "" ? parseInt(url.port, 10) : undefined,
    connectionLimit: settings.aws.isAwsLambda ? 1 : 5,
    // 로컬에서 접속할때는 필요없는 속성. planetscale로 접속할때만 필요
    // ssl: { rejectUnauthorized: true },
  });
};

const createKysely_mysql = async (): Promise<Kysely<DB>> => {
  const databaseUrl = new URL(settings.DATABASE_URL);
  const pool = await createMysqlPool(databaseUrl);
  return new Kysely<DB>({
    dialect: new MysqlDialect({
      pool: pool,
    }),
  });
};

const createKysely_planetscale = (): Kysely<DB> => {
  return new Kysely<DB>({
    dialect: new PlanetScaleDialect({
      url: settings.DATABASE_URL,
      fetch: fetch,
    }),
  });
};

export const db = settings.aws.isAwsLambda
  ? createKysely_planetscale()
  : await createKysely_mysql();
*/

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});
