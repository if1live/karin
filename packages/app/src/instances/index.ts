import { Liquid } from "liquidjs";
import * as settings from "../settings.js";

export * from "./rdbms.js";
export * from "./redis.js";
export * from "./aws.js";

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});
