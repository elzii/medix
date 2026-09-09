# Workspace Migration Guide: Medis → Medix

This document outlines the transition of the Electrobun port from the legacy nested repository (`/Users/azizzo/Source/NODE/medis/medix`) to its new standalone workspace at:

```
/Users/azizzo/Source/NODE/medix
```

---

## 1. Project Overview & Current State

- **Repository**: Standalone Git repository at `/Users/azizzo/Source/NODE/medix`
- **Active Branch**: `main` (clean working tree, fully committed)
- **App Bundle**: `build/stable-macos-arm64/Medix.app` (~18 MB, 96% smaller than original Electron app)
- **Tech Stack**:
  - **Main Process**: [Bun](https://bun.sh) with native Zig launcher (Cottontail)
  - **Webview**: macOS Native WebKit (`WKWebView`)
  - **UI Framework**: React 16 + Redux + CodeMirror 5
  - **Styling**: Modern Dark macOS Theme (`src/renderer/styles/dark-theme.scss`)
  - **Packaging**: Zero Electron runtime — uses system WebKit via native Electrobun bridge.


---

## 2. Launching in Your IDE / Antigravity

When opening a new session in Antigravity or your terminal/editor:

```bash
# Open directly in Antigravity / Cursor / VS Code
cd /Users/azizzo/Source/NODE/medix
code .
```

---

## Quick Reference Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts hot development mode (Webpack watch + Electrobun dev runner) |
| `npm run build:renderer` | Compiles Webpack bundles to `dist/renderer/` |
| `npm run build:app` | Builds standalone macOS application and update payload via Hutch |
| `npm run build` | Compiles Webpack renderer and packages stable release (`build/stable-macos-arm64/Medix.app` + DMG) |
| `open build/stable-macos-arm64/Medix.app` | Launches the built standalone macOS application |

---

## 4. Key Project Map

```
/Users/azizzo/Source/NODE/medix/
├── GEMINI.md                         # Architecture report, benchmarks & OTA updates roadmap
├── MIGRATION.md                      # This migration guide
├── electrobun.config.ts              # Electrobun app metadata & build settings
├── hutch.config.ts                   # Hutch toolchain config
├── webpack.config.cjs                # Webpack 5 configuration with 'Icons' alias
├── package.json                      # Scripts & dependencies (ioredis, ssh2)
│
├── src/
│   ├── bun/                          # Main Process (Bun runtime)
│   │   ├── index.ts                  # App lifecycle, Cocoa menu (About, Cmd+Q), RPC dispatch
│   │   └── redisManager.ts           # Redis client pool, SSH tunnels & SSL/TLS
│   │
│   ├── shared/
│   │   └── rpc.ts                    # Type-safe RPC schema between Bun and WebKit
│   │
│   └── renderer/                     # WebKit View
│       ├── icons.jsx                 # Zero-dependency SVG icon system
│       ├── electron-shim.js          # Electron API polyfill for WebKit
│       ├── redis-proxy.ts            # Transparent Redis command & pipeline proxy
│       ├── styles/
│       │   ├── dark-theme.scss       # Medis 2 Dark Theme (muted dividers, 10% cursorline, dark controls)
│       │   └── global.scss           # Base stylesheet entry point
│       └── windows/
│           ├── MainWindow/           # Core Redis GUI (Key browser, tables, CodeMirror editor)
│           └── PatternManagerWindow/ # Key pattern manager modal
```

---

## 5. Next Steps & Ongoing Tasks
- Refer to Section 6 of [`GEMINI.md`](./GEMINI.md) for implementing Over-The-Air (OTA) updates using Hutch and GitHub Releases.
