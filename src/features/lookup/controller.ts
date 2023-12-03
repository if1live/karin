import { Hono } from "hono";
import { engine } from "../../instances.js";

export const resource = "/lookup" as const;
export const app = new Hono();

app.get("/", async (c) => {
  const text = await engine.renderFile("lookup_index", {});
  return c.html(text);
});
