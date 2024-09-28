import { Generated } from "kysely";

export const name = "eventSourceMapping";

export type Table = {
  id: Generated<number>;
  uuid: string;
  eventSourceArn: string;
  functionArn: string;
  batchSize: number | null;
  maximumBatchingWindow: number | null;
  maximumConcurrency: number | null;
  functionResponseType: string | null;
  status: string;
  payload: unknown;
};
