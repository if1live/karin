import { Credentials } from "aws-lambda";

export const NODE_ENV = process.env.NODE_ENV || "production";
export const STAGE = process.env.STAGE || "dev";

export const AWS_REGION = process.env.AWS_REGION || "ap-northeast-1";
export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || "123456789012";

export const REDIS_URL = process.env.REDIS_URL || "";

// ApiGatewayManagementApiClient의 경우 로컬에서 테스트할때 credential을 대충이라도 넣어야한다
export const AWS_CREDENTIALS: Credentials | undefined =
  NODE_ENV !== "production"
    ? { accessKeyId: "a", secretAccessKey: "b" }
    : undefined;
