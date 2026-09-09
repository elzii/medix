'use strict';

import { rpcClient } from './electrobun-rpc';

const clipboard = {
  writeText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        rpcClient.request.writeClipboard({ text });
      });
    } else {
      rpcClient.request.writeClipboard({ text });
    }
  },
  readText() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return navigator.clipboard.readText();
    }
    return Promise.resolve('');
  }
};

const currentWindow = {
  close() {
    rpcClient.request.closeWindow({});
  },
  isFocused() {
    return document.hasFocus();
  }
};

const dialog = {
  async showOpenDialog(win, options, callback) {
    if (typeof win !== 'object' || !win.close) {
      callback = options;
      options = win;
    }
    const res = await rpcClient.request.showOpenDialog({
      title: options && options.title,
      properties: options && options.properties,
    });
    const paths = res.filePaths || [];
    if (callback) {
      callback(paths);
    }
    return { canceled: paths.length === 0, filePaths: paths };
  },
  showOpenDialogSync(win, options) {
    // Return empty fallback for sync, components also support async / fallback
    return [];
  }
};

class SimpleMenu {
  constructor(template = []) {
    this.template = template;
  }

  popup() {
    // Remove existing context menu if open
    const existing = document.getElementById('electrobun-context-menu');
    if (existing) {
      existing.remove();
    }

    const menuEl = document.createElement('div');
    menuEl.id = 'electrobun-context-menu';
    menuEl.style.position = 'fixed';
    menuEl.style.zIndex = '999999';
    menuEl.style.background = '#ffffff';
    menuEl.style.color = '#333333';
    menuEl.style.borderRadius = '5px';
    menuEl.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1)';
    menuEl.style.padding = '4px 0';
    menuEl.style.minWidth = '160px';
    menuEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    menuEl.style.fontSize = '13px';
    menuEl.style.userSelect = 'none';

    // Position near mouse or center
    const x = Math.min(window.__lastMouseX || 100, window.innerWidth - 180);
    const y = Math.min(window.__lastMouseY || 100, window.innerHeight - 200);
    menuEl.style.left = `${x}px`;
    menuEl.style.top = `${y}px`;

    for (const item of this.template) {
      if (item.type === 'separator') {
        const hr = document.createElement('div');
        hr.style.height = '1px';
        hr.style.background = '#e5e5e5';
        hr.style.margin = '4px 0';
        menuEl.appendChild(hr);
        continue;
      }

      const itemEl = document.createElement('div');
      itemEl.textContent = item.label || '';
      itemEl.style.padding = '4px 12px';
      itemEl.style.cursor = 'pointer';
      itemEl.style.whiteSpace = 'nowrap';

      itemEl.addEventListener('mouseenter', () => {
        itemEl.style.background = '#116cd6';
        itemEl.style.color = '#ffffff';
      });
      itemEl.addEventListener('mouseleave', () => {
        itemEl.style.background = 'transparent';
        itemEl.style.color = '#333333';
      });
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        menuEl.remove();
        if (typeof item.click === 'function') {
          item.click();
        }
      });

      menuEl.appendChild(itemEl);
    }

    document.body.appendChild(menuEl);

    const closeHandler = (e) => {
      if (!menuEl.contains(e.target)) {
        menuEl.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('contextmenu', closeHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
      document.addEventListener('contextmenu', closeHandler);
    }, 0);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    window.__lastMouseX = e.clientX;
    window.__lastMouseY = e.clientY;
  });
}

const Menu = {
  buildFromTemplate(template) {
    return new SimpleMenu(template);
  }
};

const ipcRenderer = {
  on(channel, callback) {
    if (channel === 'action') {
      window.addEventListener('electrobun:action', (e) => {
        callback(e, e.detail.action, e.detail.args);
      });
    }
  },
  removeListener(channel, callback) {
    // no-op
  },
  send(channel, ...args) {
    if (channel === 'create patternManager') {
      rpcClient.request.createWindow({ type: 'patternManager', arg: args[0] });
    }
  }
};

const remote = {
  getCurrentWindow() {
    return currentWindow;
  },
  dialog,
  Menu,
  clipboard,
};

export {
  clipboard,
  remote,
  ipcRenderer,
  dialog,
  Menu,
  currentWindow,
};

export default {
  clipboard,
  remote,
  ipcRenderer,
  dialog,
  Menu,
  currentWindow,
};
