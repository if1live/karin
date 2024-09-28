import { Hono } from "hono";
import { MyResponse } from "../../system/index.js";

export const resource = "/lookup" as const;
export const app = new Hono();

app.get("", async (c) => {
  const resp: MyResponse = {
    tag: "render",
    file: "lookup_index",
    payload: {
      entries_pub: [],
      entries_priv: [],
    },
  };
  return MyResponse.respond(c, resp);
});
