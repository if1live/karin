import { Context, Hono } from "hono";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { engine } from "../instances.js";
import { errorHandler } from "../system/errors.js";
import { LookupApp } from "./index.js";

const robotsTxt = `
User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /
`.trimStart();

const prefix_site = "/r" as const;
const prefix_admin = "/admin" as const;

export function initApp() {
  const app = new Hono();

  app.onError(async (err, c) => {
    return errorHandler(err, c);
  });

  app.use("*", compress());

  app.get("/robots.txt", async (c) => {
    return c.text(robotsTxt);
  });

  app.get("/", async (c) => {
    return c.redirect(`${prefix_site}/`);
  });

  return app;
}

export function decorateApp_site(app: Hono): Hono {
  const prefix = prefix_site;

  app.route(`${prefix}${LookupApp.resource}`, LookupApp.app);

  const fn_index = async (c: Context) => {
    const text = await engine.renderFile("index", {});
    return c.html(text);
  };
  app.get(`${prefix}`, fn_index);
  app.get(`${prefix}/`, fn_index);

  return app;
}

export function decorateApp_finalize(app: Hono): Hono {
  app.get("*", async (c) => {
    throw new HTTPException(404, { message: "not found" });
  });

  return app;
}
