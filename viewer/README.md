# Enlive Viewer

Tauri + Live2D Cubism SDK viewer for Enlive.

## Setup

```bash
npm install
```

## Cubism SDK

Two components needed:

1. **CubismWebFramework** — already included as `src/cubism-framework/` (MIT license)
2. **Cubism Core** — download from [Live2D SDK downloads](https://www.live2d.com/en/sdk/download/web/) (proprietary, free for personal use)

Place `live2dcubismcore.min.js` and `live2dcubismcore.wasm` in:

```
public/cubism-core/
```

## Development

```bash
npm run tauri dev
```

## Configuration

Set environment variables or create `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENLIVE_WS_URL` | `ws://127.0.0.1:7500/ws` | Enlive MCP Server WebSocket URL |
| `VITE_MODEL_DIR` | `/models/Hiyori` | Model directory name inside `public/models/` |

## Models

Place Live2D models in `public/models/`. Each model needs:
- `model3.json`
- `.moc3` file
- Textures (`.png`/`.webp`)
- Optional: `.exp3.json`, `.motion3.json`, `.physics3.json`, `.pose3.json`

The viewer auto-detects available expressions and motions from `model3.json`.
