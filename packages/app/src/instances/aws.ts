import { LambdaClient } from "@aws-sdk/client-lambda";
import * as settings from "../settings.js";

type LambdaClientFn = () => LambdaClient;

const createLambdaClient_prod: LambdaClientFn = () => {
  return new LambdaClient({
    region: settings.AWS_REGION,
  });
};

const createLambdaClient_localhost: LambdaClientFn = () => {
  return new LambdaClient({
    endpoint: settings.LAMBDA_URL,
    region: settings.AWS_REGION,
  });
};

export const lambdaClient =
  settings.LAMBDA_URL === undefined
    ? createLambdaClient_prod()
    : createLambdaClient_localhost();
