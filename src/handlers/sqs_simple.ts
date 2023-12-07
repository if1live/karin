import { SQSHandler } from "aws-lambda";

export const dispatch: SQSHandler = async (event, context) => {
  console.log("sqs_simple", JSON.stringify(event.Records, null, 2));
};
