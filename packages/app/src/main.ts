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

const port = 4000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`port=${port}, env=${settings.NODE_ENV}`);
});
