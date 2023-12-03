import { Hono } from "hono";
import { engine } from "../instances.js";

export const resource = "/lookup" as const;
export const app = new Hono();

app.get("/", async (c) => {
  const text = await engine.renderFile("lookup_index", {});
  return c.html(text);
});

app.post("/synchronize", async (c) => {
  // TODO:
  console.log("TODO: synchronize");

  // TODO: htmx가 더 적절할듯
  const nextUrl = `/r${resource}`;
  return c.redirect(nextUrl);
});
