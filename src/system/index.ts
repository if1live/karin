import { Context } from "hono";
import { engine } from "../instances.js";

export * from "./errors.js";

type MyResponse_html<T> = {
  tag: "html";
  file: string;
  payload: T;
};

type MyResponse_json<T> = {
  tag: "json";
  payload: T;
};

export type MyResponse<T extends object = object> =
  | MyResponse_html<T>
  | MyResponse_json<T>;

export const MyResponse = {
  async respond(c: Context, result: MyResponse) {
    switch (result.tag) {
      case "html": {
        const html = await engine.renderFile(result.file, result.payload);
        return c.html(html);
      }
      case "json":
        return c.json(result.payload);
    }
  },
};

export class MyRequest<T extends object = object> {
  constructor(public readonly input: T) {}
}
