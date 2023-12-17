import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type EventSourceMapping = {
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
export type FunctionDefinition = {
  id: Generated<number>;
  functionName: string;
  functionArn: string;
  payload: unknown;
};
export type FunctionUrl = {
  id: Generated<number>;
  functionArn: string;
  functionUrl: string;
  payload: unknown;
};
export type User = {
  id: Generated<number>;
  username: string;
  password: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
};
export type DB = {
  eventSourceMapping: EventSourceMapping;
  functionDefinition: FunctionDefinition;
  functionUrl: FunctionUrl;
  user: User;
};
