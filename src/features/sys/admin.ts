import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { engine } from "../../instances.js";

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
