import type { ColumnType, Generated } from "kysely";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type JsonArray = JsonValue[];
export type JsonObject = { [K in string]?: JsonValue };
export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonArray | JsonObject | JsonPrimitive;
export type Json = ColumnType<JsonValue, JsonValue, string>;

// TODO:
export type Account = {
  id: Generated<number>;
  data: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
};

export type DB = {
  account: Account;
};
