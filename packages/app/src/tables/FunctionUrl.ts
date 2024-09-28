import { Generated } from "kysely";

export const name = "functionUrl";

export type Table = {
  id: Generated<number>;
  functionArn: string;
  functionUrl: string;
  payload: unknown;
};
