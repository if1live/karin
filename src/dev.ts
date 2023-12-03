import { FunctionDefinition, standalone } from "serverless-standalone";
import * as http_admin from "./handlers/http_admin.js";
import * as http_site from "./handlers/http_site.js";

const definitions: FunctionDefinition[] = [
  {
    name: "httpCentral",
    handler: http_site.dispatch,
    events: [
      { httpApi: { route: "ANY /" } },
      { httpApi: { route: "ANY /r/{pathname+}" } },
      { httpApi: { route: "ANY /robots.txt" } },
      { httpApi: { route: "ANY /static/{pathname+}" } },
    ],
  },
  {
    name: "httpAdmin",
    handler: http_admin.dispatch,
    events: [{ httpApi: { route: "ANY /admin/{pathname+}" } }],
  },
];

const options = {
  httpApi: { port: 3000 },
};

const inst = standalone({
  ...options,
  functions: definitions,
});
await inst.start();
console.log("standalone", options);
