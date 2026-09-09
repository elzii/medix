let requestId = 0;
const pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

function sendToHost(packet: any) {
  const msg = JSON.stringify(packet);
  const bridge = (window as any).__electrobunHostBridge;
  if (typeof bridge?.postMessage === "function") {
    bridge.postMessage(msg);
  } else {
    // Queue until bridge is available
    const checkBridge = () => {
      const b = (window as any).__electrobunHostBridge;
      if (typeof b?.postMessage === "function") {
        b.postMessage(msg);
      } else {
        setTimeout(checkBridge, 10);
      }
    };
    checkBridge();
  }
}

function handleMessageFromHost(msg: any) {
  if (typeof msg === "string") {
    try {
      msg = JSON.parse(msg);
    } catch {}
  }
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "response" && typeof msg.id === "number") {
    const p = pending.get(msg.id);
    if (p) {
      pending.delete(msg.id);
      if (msg.success) {
        p.resolve(msg.payload);
      } else {
        p.reject(new Error(msg.error || "RPC call failed"));
      }
    }
  } else if (msg.type === "message") {
    if (msg.id === "action") {
      window.dispatchEvent(
        new CustomEvent("electrobun:action", { detail: msg.payload })
      );
    } else if (msg.id === "redisEvent") {
      const { instanceId, event, data } = msg.payload || {};
      window.dispatchEvent(
        new CustomEvent(`redis:${instanceId}:${event}`, { detail: data })
      );
    }
  }
}

if (typeof window !== "undefined") {
  const eb = (window as any).__electrobun || ((window as any).__electrobun = {});
  eb.receiveMessageFromHost = handleMessageFromHost;
  eb.receiveMessageFromBun = handleMessageFromHost;
}

export const rpcClient = {
  request: new Proxy({} as any, {
    get(_, method: string) {
      return (params: any = {}) => {
        return new Promise((resolve, reject) => {
          const id = ++requestId;
          pending.set(id, { resolve, reject });
          sendToHost({
            type: "request",
            id,
            method,
            params,
          });

          setTimeout(() => {
            if (pending.has(id)) {
              pending.delete(id);
              reject(new Error(`RPC request '${method}' timed out.`));
            }
          }, 30000);
        });
      };
    },
  }),
};
