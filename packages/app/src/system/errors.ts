import { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { engine } from "../instances/index.js";

type StatusCodeModel = {
  status?: number;
  statusCode?: number;
};

function extractStatusCode(err: Error & StatusCodeModel) {
  return err.status ?? err.statusCode ?? 500;
}

interface ErrorModel {
  name: string;
  message: string;
}

const fn_http = async (err: HTTPException): Promise<ErrorModel> => {
  const res = err.getResponse();
  return {
    name: err.name,
    message: await res.text(),
  };
};

const fn_plain = (err: Error): ErrorModel => {
  return {
    name: err.name,
    message: err.message,
  };
};

async function extractErrorModel(err: Error): Promise<ErrorModel> {
  let model = fn_plain(err);
  if (err instanceof HTTPException) {
    model = await fn_http(err);
  }

  return model;
}

const onError_html: ErrorHandler = async (err, c) => {
  const status = extractStatusCode(err);
  const model = await extractErrorModel(err);

  const text = await engine.renderFile("error", {
    error: {
      ...model,
      stack: err.stack ?? "",
    },
    error_naive: err,
  });
  return c.html(text, status);
};

export const errorHandler: ErrorHandler = async (err, c) => {
  // TODO: html 요청인지 json 요청인지는 무엇으로 결정하지?
  return onError_html(err, c);
};
