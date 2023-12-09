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
  return new LambdaClient({
    region: settings.AWS_REGION,
  });
};

export const lambdaClient =
  settings.NODE_ENV === "development"
    ? createLambdaClient_localhost()
    : createLambdaClient_prod();
