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
| **Enlive Server** | `enlive_server.py` (root) | Python + FastAPI + FastMCP | `7500` |
| **Enlive Viewer** | `viewer/` | Vite + TypeScript + PIXI.js | `5173` |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yodhasu/enlive.git
cd enlive

# 2. Server (terminal 1)
pip install fastmcp fastapi uvicorn
python enlive_server.py

# 3. Viewer (terminal 2)
cd viewer
pnpm install
pnpm dev
```

- Server → `http://0.0.0.0:7500` (MCP at `/mcp/`)
- Viewer → `http://127.0.0.1:5173`

> ⚠️ **Important:** Open the viewer page **first** before sending expressions. The viewer needs to connect its WebSocket and register before it can receive display commands.

### Control via MCP

From any MCP-compatible agent:

```python
# List available models
mcp_enlive_list_models()

# Switch model at runtime (viewer auto-updates, no refresh needed)
mcp_enlive_set_model(model_name="Hiyori")

# Set expression
mcp_enlive_express(expression="happy")

# Enable companion mode (context-aware expression behavior)
mcp_enlive_set_companion_mode(enabled=True)
```

Or via curl:

```bash
curl -s http://127.0.0.1:7500/mcp/ -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_models","arguments":{}}}'
```

---

## Agentic AI Setup Guide

> This section is written for AI agents that clone this repo. Follow these steps exactly.

You are an AI agent setting up Enlive for your user. Do these in order:

### 1. Check Dependencies

```bash
python3 --version  # need 3.11+
node --version     # need 18+
pnpm --version     # if missing: npm install -g pnpm
```

### 2. Install Python Dependencies

```bash
pip install fastmcp fastapi uvicorn
```

### 3. Install Viewer Dependencies

```bash
cd viewer
pnpm install
```

### 4. Verify Model Files Exist

```bash
ls viewer/public/models/
# Should see at least: Hiyori/, Alexia/, Eileen/, LiveroiD_Y01/, LiveroiD_Y02/
```

### 5. Start Server (background)

```bash
cd /path/to/enlive
python enlive_server.py &
# Wait for: "Enlive server started on port 7500"
```

### 6. Verify Server is Up

```bash
curl -s http://127.0.0.1:7500/mcp/ -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"ping","params":{}}'
# Should return {"result": "pong"}
```

### 7. Start Viewer (background)

```bash
cd viewer
pnpm dev &
# Wait for dev server ready (port 5173)
```

### 8. Tell User

Enlive is running:
- Viewer: http://127.0.0.1:5173
- Server MCP: ws://127.0.0.1:7500/ws

### Systemd Setup (Linux — optional for persistent deployment)

```bash
# Enable services
sudo systemctl enable enlive-server enlive-viewer

# Start
sudo systemctl restart enlive-server
sudo systemctl restart enlive-viewer

# Logs
sudo journalctl -u enlive-server -f
```

## Included Models

| Model | Type | Expressions | Motions | License |
|-------|------|-------------|---------|---------|
| **Hiyori** (def.) | Live2D Official Sample | 7 semantic | 10 motions | Free (Live2D Inc.) |
| **Alexia** | Community moc3 v5 | 7 mapped | 1 motion | User-provided |
| **Eileen** (Ellen Joe) | Zenless Zone Zero fan rig | 6 native | 2 motions | User-provided |
| **LiveroiD Y01/Y02** | Free VTuber model (八城惺架) | 3 native | physics only | Free (see readme.txt) |

> Default model: **Hiyori** — the official Live2D sample with the clearest licensing.

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
