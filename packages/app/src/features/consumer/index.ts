/*
for (const mapping of actionMappings) {
  // TODO: consumer? 이런건 어디에 넣는게 좋을까?
  // TODO: consumer?
  channel.consume(
    mapping.queue,
    async (msg) => {
      const now = new Date();

      const body_naive = msg?.content?.toString("utf-8");
      const body = body_naive ?? "";
      const md5OfBody = crypto.createHash("md5").update(body).digest("hex");

      const messageId = crypto.randomUUID();

      const region = settings.AWS_REGION;
      const arn = `arn:aws:sqs:${region}:123456789012:${mapping.queue}`;

      // TODO: 내용물 그럴싸하게 가라치기
      const record: SQSRecord = {
        messageId,
        receiptHandle: "",
        body,
        md5OfBody,
        attributes: {
          ApproximateReceiveCount: "1",
          SenderId: "127.0.0.1",
          SentTimestamp: now.getTime().toString(),
          ApproximateFirstReceiveTimestamp: now.getTime().toString(),
        },
        messageAttributes: {},
        eventSource: "aws:sqs",
        eventSourceARN: arn,
        awsRegion: settings.AWS_REGION,
      };

      const event: SQSEvent = {
        Records: [record],
      };

      try {
        // console.log(" [x] Received %s", msg.content.toString());
        const output = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: mapping.lambda,
            Payload: JSON.stringify(event),
            InvocationType: "Event",
          }),
        );
      } catch (e) {
        // TODO: 적당한 에러처리 필요
        console.error(e);
      }
    },
    {
      noAck: true,
    },
  );
  console.log("prepare consume", mapping.queue);
}
*/
