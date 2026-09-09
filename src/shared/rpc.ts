import type { RPCSchema } from "electrobun/rpc";

export interface RedisConnectConfig {
  host?: string;
  port?: number;
  password?: string;
  family?: number;
  db?: number;
  ssh?: boolean;
  sshHost?: string;
  sshPort?: number;
  sshUser?: string;
  sshPassword?: string;
  sshKey?: string;
  sshKeyPassphrase?: string;
  ssl?: boolean;
  tlsca?: string;
  tlskey?: string;
  tlscert?: string;
  [key: string]: any;
}

export type MedisRPCSchema = {
  bun: RPCSchema<{
    requests: {
      connectToRedis: {
        params: { config: RedisConnectConfig };
        response: {
          success: boolean;
          instanceId?: string;
          serverInfo?: Record<string, any>;
          error?: string;
        };
      };
      disconnectRedis: {
        params: { instanceId: string };
        response: { success: boolean };
      };
      redisCall: {
        params: {
          instanceId: string;
          command: string;
          args: any[];
        };
        response: {
          success: boolean;
          result?: any;
          error?: string;
        };
      };
      redisMulti: {
        params: {
          instanceId: string;
          isMulti: boolean;
          commands: Array<{ command: string; args: any[] }>;
        };
        response: {
          success: boolean;
          result?: any[];
          error?: string;
        };
      };
      redisDuplicate: {
        params: { instanceId: string };
        response: {
          success: boolean;
          newInstanceId?: string;
          serverInfo?: Record<string, any>;
          error?: string;
        };
      };
      showOpenDialog: {
        params: { title?: string; properties?: string[] };
        response: { filePaths: string[] };
      };
      writeClipboard: {
        params: { text: string };
        response: { success: boolean };
      };
      createWindow: {
        params: { type: string; arg?: any };
        response: { success: boolean };
      };
      closeWindow: {
        params: {};
        response: { success: boolean };
      };
    };
    messages: {};
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {
      action: {
        action: string;
        args?: any;
      };
      redisEvent: {
        instanceId: string;
        event: string;
        data?: any;
      };
    };
  }>;
};
