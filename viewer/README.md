# Enlive Viewer

Live2D viewer for [Enlive](https://github.com/yodhasu/enlive) — part of the monorepo.

Tauri + Vite + PIXI.js + Live2D Cubism 5 SDK. Connects to Enlive Server via WebSocket for real-time model switching and expression control.

## Setup

```bash
pnpm install
pnpm dev        # dev mode at http://127.0.0.1:5173
pnpm vite build     # production build
```

## Usage

1. Start Enlive Server (`../enlive_server.py` on port 7500)
2. Open viewer at `http://127.0.0.1:5173`
3. Control via MCP tools (`set_model`, `express`, etc.)

## Credits

- [Live2D Inc.](https://www.live2d.com/) — Cubism SDK
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) — PIXI.js Live2D integration
- [DreamConnect](https://github.com/yodhasu/dreamconnectnew) — Predecessor expressive bridge that inspired Enlive's MCP-first design
- **Vela** — Companion-operator AI. Runtime architecture, viewer integration, cross-model support.
