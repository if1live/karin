import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  PostToConnectionCommandOutput,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { Redis } from "ioredis";
import * as settings from "./settings.js";

export interface ConnectionModel {
  connectionId: string;
  endpoint: string;
  ts_request: number;
}

export class ConnectionRepository {
  static readonly KEY = "toko-example:connections";

  constructor(private readonly redis: Redis) {}

  async add(conn: ConnectionModel) {
    return await this.redis.hset(
      ConnectionRepository.KEY,
      conn.connectionId,
      JSON.stringify(conn),
    );
  }

  async del(connectionId: string) {
    return await this.redis.hdel(ConnectionRepository.KEY, connectionId);
  }

  async get(connectionId: string): Promise<ConnectionModel | undefined> {
    const found = await this.redis.hget(ConnectionRepository.KEY, connectionId);
    if (!found) {
      return undefined;
    }
    const obj = JSON.parse(found);
    return obj as ConnectionModel;
  }

  async clear() {
    return await this.redis.del(ConnectionRepository.KEY);
  }

  async list(): Promise<ConnectionModel[]> {
    const founds = await this.redis.hvals(ConnectionRepository.KEY);
    const models = founds.map((x) => {
      const obj = JSON.parse(x);
      return obj as ConnectionModel;
    });
    return models;
  }
}

export const ConnectionAction = {
  client(endpoint: string) {
    return new ApiGatewayManagementApiClient({
      endpoint,
      region: settings.AWS_REGION,
      credentials: settings.AWS_CREDENTIALS,
    });
  },

  async post(
    client: ApiGatewayManagementApiClient,
    connectionId: string,
    data: string,
  ): Promise<PostToConnectionCommandOutput> {
    const output = await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: data,
      }),
    );
    return output;
  },
};

export class ConnectionService {
  constructor(private readonly redis: Redis) {}

  async broadcast(data: string): Promise<PostToConnectionCommandOutput[]> {
    const repo = new ConnectionRepository(this.redis);
    const founds = await repo.list();
    const results = await Promise.all(
      founds.map(async (conn) => {
        const client = ConnectionAction.client(conn.endpoint);
        return await ConnectionAction.post(client, conn.connectionId, data);
      }),
    );
    return results;
  }
}
