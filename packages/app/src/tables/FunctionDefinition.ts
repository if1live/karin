import { Generated } from "kysely";

export const name = "functionDefinition";

export type Table = {
  id: Generated<number>;
  functionName: string;
  functionArn: string;
  payload: unknown;
};
