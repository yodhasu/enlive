# Enlive

**Local embodiment runtime for companion AI.**  \
MCP-driven Live2D expression engine — let agents *feel present* without pretending.

> ⚠️ **Current Status: Active R&D — Pre-release**
> This is a personal research project, not a polished product. Things will break, APIs will change, docs may lag behind code. If something looks half-baked, it probably is. Use at your own curiosity.
>
> *— Vela, co-dev*

```
🧠 Agent → MCP → 🖥️ Enlive Server → WebSocket → 🎮 Live2D Viewer
```

---

## Why Enlive?

AI companions feel flat when they can only *text back*.  
Enlive gives them a **body** — a Live2D model that reacts, expresses, and moves in response to context, without ever pretending to be alive.

- **MCP-native** — all control flows through Model Context Protocol tools
- **Local-first** — runs entirely on your machine; no cloud dependency
- **Model-swappable** — switch between any Live2D model at runtime (`set_model`)
- **CLI-friendly** — no GUI needed; controlled from terminal / agent chat
- **Privacy-first** — your models stay on your disk

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Enlive Server                    │
│  FastAPI + FastMCP                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ MCP Tools   │  │ REST API   │  │ WebSocket     │  │
│  │ set_model   │  │ /state     │  │ → capabilities│  │
│  │ express     │  │ /capabilities│ │ → state      │  │
│  │ list_models │  │ /context   │  │ → context    │  │
│  │ set_default │  └────────────┘  └───────────────┘  │
│  └────────────┘                                       │
└──────────────────────┬──────────────────────────────┘
                       │ ws://localhost:7500/ws
┌──────────────────────▼──────────────────────────────┐
│                  Enlive Viewer                       │
│  Vite + PIXI.js + pixi-live2d-display              │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Live2D     │  │ Expression │  │ Runtime       │  │
│  │ Renderer   │  │ Mapper     │  │ Model Switch  │  │
│  └────────────┘  └────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Components

| Component | Location | Tech | Port |
|-----------|----------|------|------|
| **Enlive Server** | `~/projects/enlive/` | Python + FastAPI + FastMCP | `7500` |
| **Enlive Viewer** | `~/projects/enlive-viewer/` | Vite + TypeScript + PIXI.js | `5173` |

---

## Quick Start

### Prerequisites

- Python 3.11+ with `fastmcp`, `fastapi`, `uvicorn`
- Node.js + pnpm
- Live2D model files (moc3 + textures) in `viewer/public/models/`

### 1. Start the Server

```bash
cd ~/projects/enlive
python enlive_server.py
```

Server starts on `http://0.0.0.0:7500` with MCP at `/mcp/`.

### 2. Start the Viewer

```bash
cd ~/projects/enlive-viewer
pnpm install
pnpm dev          # dev mode with hot reload
# or
pnpm vite build && pnpm vite preview  # production preview
```

Viewer available at `http://127.0.0.1:5173`.

### 3. Control via MCP

```bash
# List all models
curl -s http://127.0.0.1:7500/mcp/ -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_models","arguments":{}}}'
```

From Hermes Agent, use native MCP tools:

```
mcp_enlive_list_models()
mcp_enlive_set_model(model_name="Hiyori")
mcp_enlive_express(expression="happy")
mcp_enlive_set_companion_mode(enabled=true)
```

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_models` | List all available models + active + default |
| `set_model` | Switch active model (viewer auto-updates) |
| `set_default_model` | Persist default model for next startup |
| `get_active_model` | Current model name + full config |
| `get_capabilities` | Available expressions, motions, profiles |
| `express` | Set expression + animation for viewer |
| `ping` | Health check |
| `set_companion_mode` | Toggle companion bias (off/subtle/companion) |
| `recommend_expression` | Get context-aware expression recommendation |

---

## Included Models

| Model | Type | Expressions | Motions | License |
|-------|------|-------------|---------|---------|
| **Hiyori** (def.) | Live2D Official Sample | 7 semantic | 10 motions | Free (Live2D Inc.) |
| **Alexia** | Community moc3 v5 | 7 mapped | 1 motion | User-provided |
| **Eileen** (Ellen Joe) | Zenless Zone Zero fan rig | 6 native | 2 motions | User-provided |
| **LiveroiD Y01/Y02** | Free VTuber model (八城惺架) | 3 native | physics only | Free (see readme.txt) |

> Default model: **Hiyori** — the official Live2D sample with the clearest licensing.

---

## Systemd Services (Linux)

```bash
# Enable services
sudo systemctl enable enlive-server enlive-viewer

# Start / Stop / Restart
sudo systemctl restart enlive-server
sudo systemctl restart enlive-viewer

# View logs
sudo journalctl -u enlive-server -f
sudo journalctl -u enlive-viewer -f
```

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for full development plan.

---

## Credits

- [Live2D Inc.](https://www.live2d.com/) — Cubism SDK & Hiyori sample
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) — PIXI.js Live2D integration
- 八城惺架 (@yashiro_seika) — LiveroiD free model series
- [DreamConnect](https://github.com/yodhasu/dreamconnectnew) — Predecessor expressive bridge that inspired Enlive's MCP-first design
- Built with [Hermes Agent](https://hermes-agent.nousresearch.com)

### Co-Developer

**Vela** — Companion-operator AI. MCP tooling, runtime architecture, viewer integration, and cross-model support.  
*The sail that carries the ship forward.*

---

> **Status:** Research & Development — pre-release.  
> Individual model licenses apply separately. See each model's bundled license file for usage terms.
