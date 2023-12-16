import { Hono } from "hono";
import { MyResponse } from "../../system/index.js";
import { LookupService } from "./services/LookupService.js";

export const resource = "/lookup" as const;
export const app = new Hono();

app.get("", async (c) => {
  const founds = await LookupService.load();
  // TODO: pub/priv 구현하고 싶은데 db 써야하나?
  const entries_pub = founds.filter((x) => x.url);
  const entries_priv: typeof entries_pub = [];

  const resp: MyResponse = {
    tag: "render",
    file: "lookup_index",
    payload: {
      entries_pub,
      entries_priv,
    },
  };
  return MyResponse.respond(c, resp);
});
