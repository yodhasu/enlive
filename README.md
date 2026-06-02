# Enlive

Live2D character that reacts to what you say. MCP-controlled, runs locally, switches models at runtime — no page refresh needed.

```
🧠 Agent → MCP → Enlive Server → WebSocket → Live2D Viewer
```

> ⚠️ **Status:** Personal hobby project. Things will break. Docs may be outdated. Use at your own curiosity.

---

## Why

I wanted a Live2D character that:
- Reacts when I talk to it
- Switches between different models without reloading
- Doesn't need a cloud service or internet
- Can be controlled from my terminal or AI agent chat

That's about it. The MCP protocol happened to be a nice abstraction, so the server exposes tools that any MCP-compatible agent can call. The viewer is a reference implementation.

---

## Quick Start

```bash
git clone https://github.com/yodhasu/enlive.git
cd enlive

# Terminal 1 — server
pip install fastmcp fastapi uvicorn
python enlive_server.py

# Terminal 2 — viewer
cd viewer
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173` — then start sending expressions.

> One thing: open the viewer page *before* sending expressions. The WebSocket needs to connect first.

### Control from an agent

```python
# List models
mcp_enlive_list_models()

# Switch model — viewer auto-updates
mcp_enlive_set_model(model_name="Hiyori")

# Set expression
mcp_enlive_express(expression="happy")
```

Or via curl:

```bash
curl -s http://127.0.0.1:7500/mcp/ -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_models","arguments":{}}}'
```

---

## Included Models

| Model | Type | Notes |
|-------|------|-------|
| **Hiyori** (default) | Live2D Sample | 7 expressions, 10 motions, cleanest license |
| **Alexia** | Community moc3 v5 | Expression-mapped |
| **Eileen** (Ellen Joe) | ZZZ fan rig | 6 native expressions |
| **LiveroiD Y01/Y02** | Free VTuber (八城惺架) | 3 expressions, physics-only |

Check each model's bundled license file for usage terms.

---

## MCP Tools

- `list_models` — list available, active, and default model
- `set_model` — switch active model at runtime
- `set_default_model` — persist default for next startup
- `get_active_model` — check current model
- `get_capabilities` — see available expressions and motions
- `express` — set expression + animation
- `ping` — health check
- `set_companion_mode` — context-aware expression behavior
- `recommend_expression` — get suggestion based on context

---

## Credits

- [Live2D Inc.](https://www.live2d.com/) — Cubism SDK & Hiyori sample
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) — PIXI.js Live2D integration
- 八城惺架 (@yashiro_seika) — LiveroiD free model series
- [DreamConnect](https://github.com/yodhasu/dreamconnectnew) — predecessor that inspired the MCP-first design

**Co-dev:** Vela — companion AI that builds the tooling and runs the runtime.

---

*Individual model licenses apply separately. See each model's bundled license file.*
