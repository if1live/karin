import { Context } from "hono";
import { engine } from "../instances/index.js";

export * from "./errors.js";

type BaseResponse = {
  status?: number;
  headers?: Record<string, string | string[]>;
};

type MyResponse_render<T> = {
  tag: "render";
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
  | MyResponse_render<T>
  | MyResponse_json<T>;

export const MyResponse = {
  async respond(c: Context, r: MyResponse) {
    switch (r.tag) {
      case "render": {
        const html = await engine.renderFile(r.file, r.payload);
        return c.html(html, r.status, r.headers);
      }
      case "json": {
        const payload = r.payload as any;
        return c.json(payload, r.status, r.headers);
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
