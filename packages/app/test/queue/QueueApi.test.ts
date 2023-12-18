import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { extractQueueName } from "../../src/features/queue/QueueApi.js";

describe("extractQueueName", () => {
  it("ok", () => {
    const input =
      "https://sqs.ap-northeast-1.amazonaws.com/123456789012/karin-example-dev";
    const expected = "karin-example-dev";
    const actual = extractQueueName(input);
    assert.equal(actual, expected);
  });
});
