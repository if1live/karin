import { Hono } from "hono";
import { Layout } from "../../components/index.js";
import { FunctionLink } from "./components/index.js";
import { LookupService } from "./services/LookupService.js";

export const resource = "/lookup" as const;
export const app = new Hono();

app.get("", async (c) => {
  const founds = await LookupService.load();
  const entries = founds.filter((x) => x.url);

  return c.html(
    <Layout>
      <h2 class="ui header">lookup</h2>
      <p>{entries.length} functions</p>
      <ul>
        {entries.map((entry) => (
          <li>
            <FunctionLink definition={entry.definition} url={entry.url} />
          </li>
        ))}
      </ul>
    </Layout>,
  );
});
