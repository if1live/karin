import { serve } from "@hono/node-server";
import * as Sentry from "@sentry/node";
import { app } from "./app.js";
import { executor } from "./features/consumer/ConsumerExecutor.js";
import { EventSourceMappingModel } from "./features/lookup/models.js";
import { db } from "./instances/rdbms.js";
import * as settings from "./settings.js";
import { tableName_EventSourceMapping } from "./tables/types.js";

if (settings.SENTRY_DSN) {
  Sentry.init({
    dsn: settings.SENTRY_DSN,
  });
}

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

// executor
await executor.subscribe();

// 서버 재시작되면 db를 기본값으로 쓴다
const founds = await db
  .selectFrom(tableName_EventSourceMapping)
  .selectAll()
  .execute();
for (const found of founds) {
  const model = EventSourceMappingModel.create(found);
  executor.add(model);
}

const port = 4000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`port=${port}, env=${settings.NODE_ENV}`);
});
