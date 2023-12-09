import path from "node:path";
import url from "node:url";
import { Credentials } from "aws-lambda";

export const NODE_ENV = process.env.NODE_ENV || "production";
export const STAGE = process.env.STAGE || "dev";

export const DATABASE_URL = process.env.DATABASE_URL || "";
export const REDIS_URL = process.env.REDIS_URL || "";

// AWS 환경 변수
export const AWS_REGION = process.env.AWS_REGION || "ap-northeast-1";
export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || "123456789012";

export const AWS_CREDENTIALS: Credentials | undefined =
  NODE_ENV !== "production"
    ? { accessKeyId: "a", secretAccessKey: "b" }
    : undefined;

// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const filename = url.fileURLToPath(import.meta.url);
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
export const rootPath = path.join(dirname, "..");
export const viewPath = path.join(rootPath, "views");

// 사용중인 런타임
// aws lambda에서 실행중인것과 fly.io같이 작동하는걸 구분하고 싶다
export const RUNTIME_NAME: "lambda" | "plain" = process.env.LAMBDA_TASK_ROOT
  ? "lambda"
  : "plain";
