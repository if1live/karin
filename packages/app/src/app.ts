import { serveStatic } from "@hono/node-server/serve-static";
import { Context, Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { consumerAdmin } from "./features/consumer/index.js";
import { lookupAdmin, lookupController } from "./features/lookup/index.js";
import {
  queueAdmin,
  queueApi,
  queueController,
} from "./features/queue/index.js";
import { sysAdmin } from "./features/sys/index.js";
import { upstashController } from "./features/upstash/index.js";
import { engine } from "./instances/index.js";
import * as settings from "./settings.js";
import { errorHandler } from "./system/errors.js";
import { MyResponse } from "./system/index.js";
import { livereloadMiddleware } from "./system/middlewares.js";

export const app = new Hono();

const robotsTxt = `
User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /
`.trimStart();

const prefix_api = "/api" as const;
const prefix_site = "/s" as const;
const prefix_admin = "/admin" as const;

app.onError(async (err, c) => {
  if (err instanceof HTTPException) {
    // HTTPException를 직접 제어하면 basicAuth가 무시되어버린다.
    const resp = err.getResponse();
    return resp;
  }
  // else...
  return errorHandler(err, c);
});

app.notFound(async (c) => {
  // TODO: logging library?
  console.log(`404: ${c.req.method} ${c.req.url}`);
  throw new HTTPException(404, { message: "not found" });
});

app.use("*", logger());
app.get("*", prettyJSON());

if (settings.NODE_ENV === "development") {
  app.use("*", livereloadMiddleware());
}

// TODO: 개발환경에서는 인증 없는게 낫나?
const myauth = basicAuth({
  username: settings.ADMIN_ID,
  password: settings.ADMIN_PW,
});
if (settings.NODE_ENV !== "development") {
  app.use("/admin/*", myauth);
}

// TODO: hono/node-server 구현에 버그가 있어서 compress 미들웨어 있으면 c.html이 plain text로 응답한다.
// https://github.com/honojs/node-server/issues/104
// app.use("*", compress());

app.get("/robots.txt", async (c) => {
  return c.text(robotsTxt);
});

app.use("/static/*", serveStatic({ root: "./" }));

app.get("/", async (c) => c.redirect(`${prefix_site}/`));

// 공개 최상위
app.get(`${prefix_site}`, async (c) => c.redirect(`${prefix_site}/`));
app.get(`${prefix_site}/`, async (c) => {
  const filenames = ["title_02.jpg"];
  const ts = Date.now();
  const filename = filenames[ts % filenames.length];
  const fp = `/static/images/${filename}`;
  const resp: MyResponse = {
    tag: "render",
    file: "index",
    payload: {
      title_image: fp,
    },
  };
  return MyResponse.respond(c, resp);
});

// 운영 최상위
app.get(`${prefix_admin}`, async (c) => c.redirect(`${prefix_admin}/`));
app.get(`${prefix_admin}/`, async (c) => {
  const text = await engine.renderFile("admin/index", {});
  return c.html(text);
});

// API
app.route(`${prefix_api}${queueApi.resource}`, queueApi.app);

// 컨트롤러
app.route(`${prefix_site}${lookupController.resource}`, lookupController.app);
app.route(`${prefix_site}${queueController.resource}`, queueController.app);
app.route(`${prefix_site}${upstashController.resource}`, upstashController.app);

// 운영
app.route(`${prefix_admin}${sysAdmin.resource}`, sysAdmin.app);
app.route(`${prefix_admin}${lookupAdmin.resource}`, lookupAdmin.app);
app.route(`${prefix_admin}${queueAdmin.resource}`, queueAdmin.app);
app.route(`${prefix_admin}${consumerAdmin.resource}`, consumerAdmin.app);
