import { BrowserView, BrowserWindow } from "electrobun/main";
import { execFile } from "child_process";
import { promisify } from "util";
import type { MedisRPCSchema } from "../shared/rpc";
import { redisManager } from "./redisManager";

const execFileAsync = promisify(execFile);

const windows = new Map<number, BrowserWindow>();

const rpc = BrowserView.defineRPC<MedisRPCSchema>({
  maxRequestTime: 30000,
  handlers: {
    requests: {
      connectToRedis: async ({ config }) => {
        return await redisManager.connect(config);
      },

      disconnectRedis: async ({ instanceId }) => {
        return await redisManager.disconnect(instanceId);
      },

      redisCall: async ({ instanceId, command, args }) => {
        return await redisManager.call(instanceId, command, args);
      },

      redisMulti: async ({ instanceId, isMulti, commands }) => {
        return await redisManager.multi(instanceId, isMulti, commands);
      },

      redisDuplicate: async ({ instanceId }) => {
        return await redisManager.duplicate(instanceId);
      },

      showOpenDialog: async ({ title, properties }) => {
        try {
          const script = 'POSIX path of (choose file with prompt "' + (title || "Select File") + '")';
          const { stdout } = await execFileAsync("osascript", ["-e", script]);
          const chosen = stdout.trim();
          return { filePaths: chosen ? [chosen] : [] };
        } catch {
          return { filePaths: [] };
        }
      },

      writeClipboard: async ({ text }) => {
        try {
          const proc = Bun.spawn(["pbcopy"], {
            stdin: "pipe",
          });
          proc.stdin.write(text);
          proc.stdin.end();
          await proc.exited;
          return { success: true };
        } catch {
          return { success: false };
        }
      },

      createWindow: async ({ type, arg }) => {
        const title = type === "patternManager" ? "Manage Patterns" : "Medis";
        const width = type === "patternManager" ? 600 : 960;
        const height = type === "patternManager" ? 350 : 600;
        const html = type === "patternManager" ? "patternManager.html" : "main.html";

        const win = new BrowserWindow({
          title,
          url: `views://mainview/${html}`,
          rpc,
          frame: {
            width,
            height,
            x: 220,
            y: 220,
          },
        });
        windows.set(win.id, win);
        return { success: true };
      },

      closeWindow: async () => {
        return { success: true };
      },
    },
    messages: {},
  },
});

const mainWindow = new BrowserWindow({
  title: "Medis",
  url: "views://mainview/main.html",
  rpc,
  frame: {
    width: 1000,
    height: 650,
    x: 180,
    y: 120,
  },
});

windows.set(mainWindow.id, mainWindow);

console.log("Medis Electrobun main process initialized successfully.");
