import { EventEmitter } from "events";
import { Buffer } from "buffer";
import { rpcClient } from "./electrobun-rpc";

class PipelineProxy {
  private instanceId: string;
  private isMulti: boolean;
  private queue: Array<{ command: string; args: any[] }> = [];

  constructor(instanceId: string, isMulti: boolean) {
    this.instanceId = instanceId;
    this.isMulti = isMulti;

    return new Proxy(this, {
      get(target, prop: string) {
        if (prop in target) {
          return (target as any)[prop];
        }
        return (...args: any[]) => {
          target.queue.push({ command: prop, args });
          return target;
        };
      },
    });
  }

  async exec(callback?: (err: any, results: any[]) => void): Promise<any[]> {
    const commands = this.queue.map((item) => ({
      command: item.command,
      args: item.args.map((a) =>
        Buffer.isBuffer(a)
          ? { __isBuffer: true, data: a.toString("base64") }
          : a
      ),
    }));

    try {
      const response = await rpcClient.request.redisMulti({
        instanceId: this.instanceId,
        isMulti: this.isMulti,
        commands,
      });

      if (!response.success) {
        const err = new Error(response.error || "Batch execution failed");
        if (callback) callback(err, []);
        throw err;
      }

      const results = (response.result || []).map(([err, res]) => {
        let val = res;
        if (val && typeof val === "object" && val.__isBuffer) {
          val = Buffer.from(val.data, "base64");
        }
        return [err ? new Error(err) : null, val];
      });

      if (callback) callback(null, results);
      return results;
    } catch (err: any) {
      if (callback) callback(err, []);
      throw err;
    }
  }
}

export class RedisProxy extends EventEmitter {
  instanceId: string;
  serverInfo: Record<string, any>;
  status: string = "ready";

  constructor(instanceId: string, serverInfo: Record<string, any> = {}) {
    super();
    this.instanceId = instanceId;
    this.serverInfo = serverInfo;

    return new Proxy(this, {
      get(target, prop: string) {
        if (prop in target) {
          return (target as any)[prop];
        }
        return (...args: any[]) => target.call(prop, ...args);
      },
    });
  }

  async call(command: string, ...args: any[]): Promise<any> {
    let callback: Function | null = null;
    if (typeof args[args.length - 1] === "function") {
      callback = args.pop();
    }

    const run = async () => {
      const serializedArgs = args.map((arg) => {
        if (Buffer.isBuffer(arg)) {
          return { __isBuffer: true, data: arg.toString("base64") };
        }
        return arg;
      });

      const res = await rpcClient.request.redisCall({
        instanceId: this.instanceId,
        command,
        args: serializedArgs,
      });

      if (!res.success) {
        throw new Error(res.error || `Redis command ${command} failed`);
      }

      let result = res.result;
      if (result && typeof result === "object" && result.__isBuffer) {
        result = Buffer.from(result.data, "base64");
      } else if (Array.isArray(result)) {
        result = result.map((item) =>
          item && typeof item === "object" && item.__isBuffer
            ? Buffer.from(item.data, "base64")
            : item
        );
      }
      return result;
    };

    const promise = run();
    if (callback) {
      promise.then(
        (res) => callback!(null, res),
        (err) => callback!(err, null)
      );
    }
    return promise;
  }

  pipeline(): any {
    return new PipelineProxy(this.instanceId, false);
  }

  multi(): any {
    return new PipelineProxy(this.instanceId, true);
  }

  async duplicate(): Promise<RedisProxy> {
    const res = await rpcClient.request.redisDuplicate({
      instanceId: this.instanceId,
    });
    if (!res.success || !res.newInstanceId) {
      throw new Error(res.error || "Failed to duplicate redis connection");
    }
    return new RedisProxy(res.newInstanceId, res.serverInfo || this.serverInfo);
  }

  select(db: number | string, callback?: Function): Promise<any> {
    const res = this.call("select", db);
    this.emit("select", db);
    if (callback) {
      res.then(
        (val) => callback(null, val),
        (err) => callback(err, null)
      );
    }
    return res;
  }

  getBuffer(key: string, callback?: Function): Promise<Buffer> {
    const res = this.call("get", key).then((val) => {
      if (Buffer.isBuffer(val)) return val;
      if (typeof val === "string") return Buffer.from(val);
      return Buffer.alloc(0);
    });

    if (callback) {
      res.then(
        (val) => callback(null, val),
        (err) => callback(err, null)
      );
    }
    return res;
  }

  hscanBuffer(key: string, cursor: string | number, ...args: any[]): Promise<any> {
    let callback: Function | null = null;
    if (typeof args[args.length - 1] === "function") {
      callback = args.pop();
    }

    const res = this.call("hscan", key, cursor, ...args).then((val) => {
      if (Array.isArray(val) && val.length === 2 && Array.isArray(val[1])) {
        val[1] = val[1].map((item) =>
          Buffer.isBuffer(item) ? item : Buffer.from(String(item))
        );
      }
      return val;
    });

    if (callback) {
      res.then(
        (val) => callback(null, val),
        (err) => callback(err, null)
      );
    }
    return res;
  }

  scanBuffer(cursor: string | number, ...args: any[]): Promise<any> {
    return this.call("scan", cursor, ...args);
  }

  disconnect(): void {
    rpcClient.request.disconnectRedis({ instanceId: this.instanceId });
    this.status = "end";
    this.emit("end");
  }
}
