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
    menuEl.style.background = 'rgba(255, 255, 255, 0.95)';
    menuEl.style.backdropFilter = 'blur(20px)';
    menuEl.style.webkitBackdropFilter = 'blur(20px)';
    menuEl.style.color = '#222222';
    menuEl.style.borderRadius = '6px';
    menuEl.style.boxShadow = '0 10px 28px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.15)';
    menuEl.style.padding = '4px';
    menuEl.style.minWidth = '170px';
    menuEl.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
    menuEl.style.fontSize = '13px';
    menuEl.style.lineHeight = '18px';
    menuEl.style.userSelect = 'none';

    // Position near mouse or center, keeping within viewport
    const menuWidth = 180;
    const estimatedHeight = this.template.length * 26 + 10;
    let x = window.__lastMouseX || 100;
    let y = window.__lastMouseY || 100;

    if (x + menuWidth > window.innerWidth) {
      x = Math.max(10, window.innerWidth - menuWidth - 10);
    }
    if (y + estimatedHeight > window.innerHeight) {
      y = Math.max(10, window.innerHeight - estimatedHeight - 10);
    }

    menuEl.style.left = `${x}px`;
    menuEl.style.top = `${y}px`;

    for (const item of this.template) {
      if (item.type === 'separator') {
        const hr = document.createElement('div');
        hr.style.height = '1px';
        hr.style.background = 'rgba(0, 0, 0, 0.1)';
        hr.style.margin = '4px 6px';
        menuEl.appendChild(hr);
        continue;
      }

      const itemEl = document.createElement('div');
      itemEl.textContent = item.label || '';
      itemEl.style.padding = '4px 10px';
      itemEl.style.cursor = 'default';
      itemEl.style.whiteSpace = 'nowrap';
      itemEl.style.borderRadius = '4px';

      itemEl.addEventListener('mouseenter', () => {
        itemEl.style.background = '#0063e1';
        itemEl.style.color = '#ffffff';
      });
      itemEl.addEventListener('mouseleave', () => {
        itemEl.style.background = 'transparent';
        itemEl.style.color = '#222222';
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
        cleanup();
      }
    };
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        menuEl.remove();
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener('click', closeHandler, true);
      document.removeEventListener('contextmenu', closeHandler, true);
      document.removeEventListener('keydown', keyHandler, true);
      window.removeEventListener('blur', closeHandler);
    };

    setTimeout(() => {
      document.addEventListener('click', closeHandler, true);
      document.addEventListener('contextmenu', closeHandler, true);
      document.addEventListener('keydown', keyHandler, true);
      window.addEventListener('blur', closeHandler);
    }, 0);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    window.__lastMouseX = e.clientX;
    window.__lastMouseY = e.clientY;
  });

  // Global contextmenu listener in capture phase:
  // Suppresses WebKit's native "Reload Page" / "Inspect Element" menu by default.
  // Developers can hold Shift+Option or run localStorage.setItem('medix:enable_inspect', 'true') to allow it.
  window.addEventListener('contextmenu', (e) => {
    window.__lastMouseX = e.clientX;
    window.__lastMouseY = e.clientY;

    const allowInspect = (e.shiftKey && e.altKey) || 
      (typeof localStorage !== 'undefined' && localStorage.getItem('medix:enable_inspect') === 'true');

    if (!allowInspect) {
      e.preventDefault();
    }
  }, true);
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
    } else if (channel === 'quit') {
      rpcClient.request.quitApp({});
    } else if (channel === 'about') {
      rpcClient.request.showAbout({});
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.metaKey && (e.key === 'q' || e.key === 'Q')) {
      e.preventDefault();
      rpcClient.request.quitApp({});
    }
  }, true);
}

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
