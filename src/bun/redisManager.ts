import Redis from "ioredis";
import { Client as SSHClient } from "ssh2";
import net from "net";
import crypto from "crypto";
import type { RedisConnectConfig } from "../shared/rpc";

interface ManagedConnection {
  instanceId: string;
  config: RedisConnectConfig;
  redis: Redis;
  sshServer?: net.Server;
  sshClient?: SSHClient;
}

class RedisManager {
  private connections = new Map<string, ManagedConnection>();

  private deserializeArg(arg: any): any {
    if (arg && typeof arg === "object" && arg.__isBuffer && typeof arg.data === "string") {
      return Buffer.from(arg.data, "base64");
    }
    return arg;
  }

  private serializeResult(result: any): any {
    if (Buffer.isBuffer(result)) {
      return { __isBuffer: true, data: result.toString("base64") };
    }
    if (Array.isArray(result)) {
      return result.map((item) => this.serializeResult(item));
    }
    return result;
  }

  async connect(config: RedisConnectConfig): Promise<{
    success: boolean;
    instanceId?: string;
    serverInfo?: Record<string, any>;
    error?: string;
  }> {
    const instanceId = crypto.randomUUID();

    try {
      if (config.ssh) {
        return await new Promise((resolve) => {
          const conn = new SSHClient();

          conn.on("ready", () => {
            const server = net
              .createServer((sock) => {
                conn.forwardOut(
                  sock.remoteAddress || "127.0.0.1",
                  sock.remotePort || 0,
                  config.host || "127.0.0.1",
                  Number(config.port) || 6379,
                  (err, stream) => {
                    if (err) {
                      sock.end();
                    } else {
                      sock.pipe(stream).pipe(sock);
                    }
                  }
                );
              })
              .listen(0, "127.0.0.1", async () => {
                const addr = server.address() as net.AddressInfo;
                const localPort = addr.port;
                try {
                  const result = await this.initRedisClient(instanceId, config, {
                    host: "127.0.0.1",
                    port: localPort,
                  }, server, conn);
                  resolve(result);
                } catch (err: any) {
                  server.close();
                  conn.end();
                  resolve({ success: false, error: err.message || String(err) });
                }
              });
          });

          conn.on("error", (err: any) => {
            resolve({ success: false, error: `SSH Error: ${err.message}` });
          });

          try {
            const sshOptions: any = {
              host: config.sshHost,
              port: Number(config.sshPort) || 22,
              username: config.sshUser,
            };
            if (config.sshKey) {
              sshOptions.privateKey = config.sshKey;
              if (config.sshKeyPassphrase) {
                sshOptions.passphrase = config.sshKeyPassphrase;
              }
            } else {
              sshOptions.password = config.sshPassword;
            }
            conn.connect(sshOptions);
          } catch (err: any) {
            resolve({ success: false, error: `SSH Connection Error: ${err.message}` });
          }
        });
      } else {
        return await this.initRedisClient(instanceId, config);
      }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  private async initRedisClient(
    instanceId: string,
    config: RedisConnectConfig,
    override?: { host: string; port: number },
    sshServer?: net.Server,
    sshClient?: SSHClient
  ): Promise<{
    success: boolean;
    instanceId?: string;
    serverInfo?: Record<string, any>;
    error?: string;
  }> {
    const redisOptions: any = {
      ...config,
      ...(override || {}),
      retryStrategy: () => false,
      enableOfflineQueue: true,
      lazyConnect: true,
    };

    if (config.ssl) {
      redisOptions.tls = {
        rejectUnauthorized: false,
      };
      if (config.tlsca) redisOptions.tls.ca = config.tlsca;
      if (config.tlskey) redisOptions.tls.key = config.tlskey;
      if (config.tlscert) redisOptions.tls.cert = config.tlscert;
    }

    const redis = new Redis(redisOptions);

    redis.defineCommand("setKeepTTL", {
      numberOfKeys: 1,
      lua: 'local ttl = redis.call("pttl", KEYS[1]) if ttl > 0 then return redis.call("SET", KEYS[1], ARGV[1], "PX", ttl) else return redis.call("SET", KEYS[1], ARGV[1]) end',
    });
    redis.defineCommand("lremindex", {
      numberOfKeys: 1,
      lua: 'local FLAG = "$$#__@DELETE@_REDIS_@PRO@__#$$" redis.call("lset", KEYS[1], ARGV[1], FLAG) redis.call("lrem", KEYS[1], 1, FLAG)',
    });
    redis.defineCommand("duplicateKey", {
      numberOfKeys: 2,
      lua: 'local dump = redis.call("dump", KEYS[1]) local pttl = 0 if ARGV[1] == "TTL" then pttl = redis.call("pttl", KEYS[1]) end return redis.call("restore", KEYS[2], pttl, dump)',
    });

    try {
      await redis.connect();
      await redis.ping();

      const version = (redis as any).serverInfo?.redis_version;
      if (version && version.length >= 5) {
        const versionNumber = Number(version[0] + version[2]);
        if (versionNumber < 28) {
          redis.disconnect();
          sshServer?.close();
          sshClient?.end();
          return {
            success: false,
            error: "Medis only supports Redis >= 2.8 because servers older than 2.8 don't support SCAN command.",
          };
        }
      }

      this.connections.set(instanceId, {
        instanceId,
        config,
        redis,
        sshServer,
        sshClient,
      });

      return {
        success: true,
        instanceId,
        serverInfo: (redis as any).serverInfo || {},
      };
    } catch (err: any) {
      try {
        redis.disconnect();
      } catch {}
      sshServer?.close();
      sshClient?.end();
      return { success: false, error: err.message || String(err) };
    }
  }

  async call(
    instanceId: string,
    command: string,
    args: any[]
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const conn = this.connections.get(instanceId);
    if (!conn) {
      return { success: false, error: "Redis connection not found or disconnected" };
    }

    try {
      const parsedArgs = (args || []).map((a) => this.deserializeArg(a));
      const redis = conn.redis as any;

      let result: any;
      if (typeof redis[command] === "function") {
        result = await redis[command](...parsedArgs);
      } else {
        result = await redis.call(command, ...parsedArgs);
      }

      return { success: true, result: this.serializeResult(result) };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  async multi(
    instanceId: string,
    isMulti: boolean,
    commands: Array<{ command: string; args: any[] }>
  ): Promise<{ success: boolean; result?: any[]; error?: string }> {
    const conn = this.connections.get(instanceId);
    if (!conn) {
      return { success: false, error: "Redis connection not found or disconnected" };
    }

    try {
      const redis = conn.redis as any;
      const batch = isMulti ? redis.multi() : redis.pipeline();

      for (const item of commands) {
        const parsedArgs = (item.args || []).map((a) => this.deserializeArg(a));
        if (typeof batch[item.command] === "function") {
          batch[item.command](...parsedArgs);
        } else {
          batch.call(item.command, ...parsedArgs);
        }
      }

      const rawResults = await batch.exec();
      const results = (rawResults || []).map(([err, res]: [any, any]) => [
        err ? (err.message || String(err)) : null,
        this.serializeResult(res),
      ]);

      return { success: true, result: results };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  async duplicate(
    instanceId: string
  ): Promise<{
    success: boolean;
    newInstanceId?: string;
    serverInfo?: Record<string, any>;
    error?: string;
  }> {
    const conn = this.connections.get(instanceId);
    if (!conn) {
      return { success: false, error: "Connection not found" };
    }
    return this.connect(conn.config);
  }

  async disconnect(instanceId: string): Promise<{ success: boolean }> {
    const conn = this.connections.get(instanceId);
    if (conn) {
      try {
        conn.redis.disconnect();
      } catch {}
      try {
        conn.sshServer?.close();
      } catch {}
      try {
        conn.sshClient?.end();
      } catch {}
      this.connections.delete(instanceId);
    }
    return { success: true };
  }
}

export const redisManager = new RedisManager();
