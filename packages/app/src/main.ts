import { serve } from "@hono/node-server";
import { app } from "./app.js";
import * as settings from "./settings.js";

async function main_livereload() {
  const livereload = await import("livereload");
  const liveServer = livereload.createServer(
    {
      exts: ["html", "css", "liquid"],
    },
    () => console.log("livereload running..."),
  );
  liveServer.watch([settings.rootPath, settings.viewPath]);
}

if (settings.NODE_ENV === "development") {
  await main_livereload();
}

serve(
  {
    fetch: app.fetch,
    port: 4000,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  },
);
