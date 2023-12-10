import path from "node:path";
import url from "node:url";
import { Credentials } from "aws-lambda";

export const NODE_ENV = process.env.NODE_ENV || "production";
export const STAGE = process.env.STAGE || "dev";

export const DATABASE_URL = process.env.DATABASE_URL || "";

export const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@127.0.0.1:5672";

// AWS 환경 변수
export const AWS_REGION = process.env.AWS_REGION || "ap-northeast-1";

export const AWS_CREDENTIALS: Credentials | undefined =
  NODE_ENV !== "production"
    ? { accessKeyId: "a", secretAccessKey: "b" }
    : undefined;

// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const filename = url.fileURLToPath(import.meta.url);
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
export const rootPath = path.join(dirname, "..");
export const viewPath = path.join(rootPath, "views");
