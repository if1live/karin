import { serveStatic } from "@hono/node-server/serve-static";
import { Context, Hono } from "hono";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { lookupAdmin, lookupController, sysAdmin } from "./features/index.js";
import { queueAdmin, queueController } from "./features/queue/index.js";
import { engine } from "./instances/index.js";
import { errorHandler } from "./system/errors.js";

export const app = new Hono();

const robotsTxt = `
User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /
`.trimStart();

const prefix_site = "/r" as const;
const prefix_admin = "/admin" as const;

app.onError(async (err, c) => {
  return errorHandler(err, c);
});

app.use("*", compress());

app.get("/robots.txt", async (c) => {
  return c.text(robotsTxt);
});

app.use("/static/*", serveStatic({ root: "./" }));

app.get("/", async (c) => {
  return c.redirect(`${prefix_site}/`);
});

// 공개 최상위
app.get(`${prefix_site}`, async (c) => c.redirect(`${prefix_site}/`));
app.get(`${prefix_site}/`, async (c) => {
  const text = await engine.renderFile("index", {});
  return c.html(text);
});

// 운영 최상위
app.get(`${prefix_admin}`, async (c) => c.redirect(`${prefix_admin}/`));
app.get(`${prefix_admin}/`, async (c) => {
  const text = await engine.renderFile("admin/index", {});
  return c.html(text);
});

// 일반 API
app.route(`${prefix_site}${lookupController.resource}`, lookupController.app);
app.route(`${prefix_site}${queueController.resource}`, queueController.app);

// 운영 API
app.route(`${prefix_admin}${sysAdmin.resource}`, sysAdmin.app);
app.route(`${prefix_admin}${lookupAdmin.resource}`, lookupAdmin.app);
app.route(`${prefix_admin}${queueAdmin.resource}`, queueAdmin.app);

app.get("*", async (c) => {
  throw new HTTPException(404, { message: "not found" });
});
