import { channel } from "../../instances/index.js";

// TODO: 큐 목록을 얻어서 채널 목록 생성하는 시점? 서버 재시작 시점?
// lookup하고 얽혀서 얻어야한다
export const eventSourceMapping = {
  queue: "toki-example-dev",
  lambda: "toki-example-dev-sqsMain",
};

await channel.assertQueue(eventSourceMapping.queue, {
  durable: false,
});
