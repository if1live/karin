import path from "node:path";
import url from "node:url";
import { Credentials } from "aws-lambda";

export const NODE_ENV = process.env.NODE_ENV || "production";
export const STAGE = process.env.STAGE || "dev";

export const DATABASE_URL = process.env.DATABASE_URL || "";

// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const filename = url.fileURLToPath(import.meta.url);
const dirname = url.fileURLToPath(new URL(".", import.meta.url));
export const rootPath = path.join(dirname, "..");
export const viewPath = path.join(rootPath, "views");

const credentials: Credentials | undefined =
  NODE_ENV !== "production"
    ? { accessKeyId: "a", secretAccessKey: "b" }
    : undefined;

export const aws = Object.freeze({
  isAwsLambda: !!process.env.LAMBDA_TASK_ROOT,
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials,

  // account id는 환경변수에서 얻을수 없다. context를 뜯어서 빼내기
  extractAccountId(functionArn: string): string {
    return functionArn.split(":")[4] ?? "123456789012";
  },
});
