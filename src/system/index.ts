import { Context } from "hono";
import { engine } from "../instances.js";

export * from "./errors.js";

type BaseResponse = {
  status?: number;
  headers?: Record<string, string | string[]>;
};

type MyResponse_html<T> = {
  tag: "html";
  file: string;
  payload: T;
} & BaseResponse;

type MyResponse_json<T> = {
  tag: "json";
  payload: T;
} & BaseResponse;

type MyResponse_text = {
  tag: "text";
  text: string;
} & BaseResponse;

type MyResponse_redirect = {
  tag: "redirect";
  location: string;
} & BaseResponse;

export type MyResponse<T extends object = object> =
  | MyResponse_redirect
  | MyResponse_text
  | MyResponse_html<T>
  | MyResponse_json<T>;

export const MyResponse = {
  async respond(c: Context, r: MyResponse) {
    switch (r.tag) {
      case "html": {
        const html = await engine.renderFile(r.file, r.payload);
        return c.html(html, r.status, r.headers);
      }
      case "json": {
        return c.json(r.payload, r.status, r.headers);
      }
      case "text": {
        return c.text(r.text, r.status, r.headers);
      }
      default: {
        return c.redirect(r.location, r.status);
      }
    }
  },
};

export class MyRequest<T extends object = object> {
  constructor(public readonly input: T) {}
}
