import { Hono } from "hono";
import { engine, redis } from "../../instances.js";

export const resource = "/lookup" as const;
export const app = new Hono();

app.get("", async (c) => {
  const text = await engine.renderFile("admin/lookup_index", {});
  return c.html(text);
});

app.post("/synchronize", async (c) => {
  // TODO:
  console.log("TODO: synchronize");

  // TODO: redis 작동 확인
  const ping = await redis.ping();
  console.log(ping);

  // TODO: htmx가 더 적절할듯
  const nextUrl = `/admin${resource}?ts=${Date.now()}`;
  return c.redirect(nextUrl);
});
