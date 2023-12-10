import { LambdaClient } from "@aws-sdk/client-lambda";
import * as settings from "../settings.js";

type LambdaClientFn = () => LambdaClient;

const createLambdaClient_prod: LambdaClientFn = () => {
  return new LambdaClient({
    region: settings.AWS_REGION,
    credentials: settings.AWS_CREDENTIALS,
  });
};

const createLambdaClient_localhost: LambdaClientFn = () => {
  console.log({
    endpoint: settings.LAMBDA_URL,
    region: settings.AWS_REGION,
    credentials: settings.AWS_CREDENTIALS,
  });
  return new LambdaClient({
    endpoint: settings.LAMBDA_URL,
    region: settings.AWS_REGION,
    credentials: settings.AWS_CREDENTIALS,
  });
};

export const lambdaClient =
  settings.NODE_ENV === "development"
    ? createLambdaClient_localhost()
    : createLambdaClient_prod();
