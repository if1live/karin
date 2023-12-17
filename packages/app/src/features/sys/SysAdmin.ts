import * as Sentry from "@sentry/node";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { engine } from "../../instances/index.js";

export const resource = "/sys" as const;
export const app = new Hono();

app.get("", async (c) => {
  const text = await engine.renderFile("admin/sys_index", {});
  return c.html(text);
});

app.get("/errors/plain", async (c) => {
  const e = new Error("plain-error-message");
  e.name = "PlainError";
  (e as any).status = 401;
  throw e;
});

app.get("/errors/http", async (c) => {
  throw new HTTPException(403, { message: "hono-http-exception" });
});

app.get("/sentry/message", async (c) => {
  Sentry.captureMessage("sample message", "info");
  return c.json({ ok: true });
});

app.get("/sentry/error", async (c) => {
  try {
    const e = new Error("sample-error", {
      cause: { foo: "bar" },
    });
    e.name = "SampleError";
    throw e;
  } catch (e) {
    Sentry.captureException(e);
    return c.json({ ok: true });
  }
});
