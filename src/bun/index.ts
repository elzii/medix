import { ApplicationMenu, BrowserView, BrowserWindow, Updater } from "electrobun/main";
import { execFile } from "child_process";
import { promisify } from "util";
import type { MedixRPCSchema } from "../shared/rpc";
import { redisManager } from "./redisManager";

const execFileAsync = promisify(execFile);

const windows = new Map<number, BrowserWindow>();

function showAboutDialog() {
  const script =
    'display alert "Medix" message "Refactored with 💛 in an Electrobun Oven\n\nANAGRAM GROUP, LLC" as informational buttons {"OK"} default button "OK"';
  execFileAsync("osascript", ["-e", script]).catch(() => {});
}

async function checkForUpdates(manual = true) {
  try {
    const info = await Updater.checkForUpdate();
    if (info.updateAvailable) {
      const script = `display dialog "A new version of Medix (${info.version || "update"}) is available. Would you like to download and install it now?" with title "Medix Update" buttons {"Later", "Update & Restart"} default button "Update & Restart" with icon note`;
      const { stdout } = await execFileAsync("osascript", ["-e", script]);
      if (stdout.includes("Update & Restart")) {
        execFileAsync("osascript", [
          "-e",
          'display notification "Downloading and applying Medix update..." with title "Medix Update"',
        ]).catch(() => {});
        await Updater.downloadUpdate();
        await Updater.applyUpdate();
      }
    } else if (manual) {
      const script =
        'display alert "Medix is Up to Date" message "You are currently running the latest version." as informational buttons {"OK"} default button "OK"';
      await execFileAsync("osascript", ["-e", script]);
    }
  } catch (error: any) {
    if (manual) {
      const msg = (error?.message || "Failed to check for updates.").replace(/"/g, '\\"');
      const script = `display alert "Update Check Failed" message "${msg}" as warning buttons {"OK"} default button "OK"`;
      await execFileAsync("osascript", ["-e", script]).catch(() => {});
    }
  }
}

Updater.onStatusChange((entry) => {
  console.log(`[Updater] ${entry.status}: ${entry.message}`);
});

function broadcastAction(action: string, args?: any) {
  for (const win of windows.values()) {
    try {
      (win as any).rpc?.send("action", { action, args });
    } catch {}
  }
}

function createNewWindow(type = "main", arg?: any) {
  const title = type === "patternManager" ? "Manage Patterns" : "Medix";
  const width = type === "patternManager" ? 600 : 1000;
  const height = type === "patternManager" ? 350 : 650;
  const html = type === "patternManager" ? "patternManager.html" : "main.html";

  const win = new BrowserWindow({
    title,
    url: `views://mainview/${html}`,
    rpc,
    frame: {
      width,
      height,
      x: 200 + windows.size * 25,
      y: 120 + windows.size * 25,
    },
  });

  windows.set(win.id, win);
  return win;
}

const rpc = BrowserView.defineRPC<MedixRPCSchema>({
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

      showOpenDialog: async ({ title }) => {
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
        createNewWindow(type, arg);
        return { success: true };
      },

      closeWindow: async () => {
        return { success: true };
      },

      quitApp: async () => {
        process.exit(0);
        return { success: true };
      },

      showAbout: async () => {
        showAboutDialog();
        return { success: true };
      },

      checkForUpdates: async () => {
        checkForUpdates(true);
        return { success: true };
      },
    },
    messages: {},
  },
});

ApplicationMenu.setApplicationMenu([
  {
    label: "Medix",
    submenu: [
      {
        label: "About Medix",
        action: "about",
      },
      {
        label: "Check for Updates...",
        action: "checkForUpdates",
      },
      { type: "separator" },
      {
        label: "Hide Medix",
        role: "hide",
        accelerator: "Cmd+H",
      },
      {
        label: "Hide Others",
        role: "hideOthers",
        accelerator: "Cmd+Alt+H",
      },
      {
        label: "Show All",
        role: "showAll",
      },
      { type: "separator" },
      {
        label: "Quit Medix",
        action: "quit",
        role: "quit",
        accelerator: "Cmd+Q",
      },
    ],
  },
  {
    label: "File",
    submenu: [
      {
        label: "New Connection Window",
        action: "newWindow",
        accelerator: "Cmd+N",
      },
      {
        label: "New Connection Tab",
        action: "newTab",
        accelerator: "Cmd+T",
      },
      { type: "separator" },
      {
        label: "Close Tab",
        action: "closeTab",
        accelerator: "Cmd+W",
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo", accelerator: "Cmd+Z" },
      { role: "redo", accelerator: "Cmd+Shift+Z" },
      { type: "separator" },
      { role: "cut", accelerator: "Cmd+X" },
      { role: "copy", accelerator: "Cmd+C" },
      { role: "paste", accelerator: "Cmd+V" },
      { role: "selectAll", accelerator: "Cmd+A" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize", accelerator: "Cmd+M" },
      { role: "zoom" },
      { role: "close" },
    ],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "About Medix",
        action: "about",
      },
      {
        label: "Check for Updates...",
        action: "checkForUpdates",
      },
    ],
  },
]);

ApplicationMenu.on("application-menu-clicked", (event: any) => {
  const action = event?.data?.action;
  if (!action) return;

  if (action === "about") {
    showAboutDialog();
  } else if (action === "checkForUpdates") {
    checkForUpdates(true);
  } else if (action === "quit") {
    process.exit(0);
  } else if (action === "newWindow") {
    createNewWindow("main");
  } else if (action === "newTab") {
    broadcastAction("createInstance");
  } else if (action === "closeTab") {
    broadcastAction("delInstance");
  }
});

const mainWindow = createNewWindow("main");

console.log("Medix Electrobun main process initialized successfully with ApplicationMenu.");
