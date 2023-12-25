import { SQSHandler } from "aws-lambda";
import { redis } from "../instances.js";
import { ConnectionService } from "../repositories.js";

export const dispatch: SQSHandler = async (event, context) => {
  console.log("sqs.event", JSON.stringify(event, null, 2));

  const record = event.Records[0];
  if (!record) {
    console.log("no record");
    return;
  }

  const now = new Date();

  const service = new ConnectionService(redis);
  const message = `${now.toISOString()}, ${record.body}`;
  const output = await service.broadcast(message);
  console.log(`broadcast: ${output.length} connections`);
};
