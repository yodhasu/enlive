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

| Model | Source | Type |
|-------|--------|------|
| **Hiyori** (default) | Live2D Official Sample | Official Cubism asset |
| **Komi** | [Booth.pm](https://booth.pm/en/items/5354850) by ぬーとりん | Community Live2D v5 |
| **Alexia** | [Booth.pm](https://booth.pm/en/items/5576188) by KT | Community moc3 v5 |
| **Ellen Joe** | [Booth.pm](https://booth.pm/en/items/5966423) by 猫田まんま | ZZZ fan rig |
| **LiveroiD Y01/Y02** | [Booth.pm](https://booth.pm/en/items/2685284) by 八城惺架 | Free VTuber model |

Each model's bundled license file contains the actual usage terms. Some are for personal/non-commercial use only — check before redistributing.

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

- [Live2D Inc.](https://www.live2d.com/) — Cubism SDK & Hiyori sample model
- [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) — PIXI.js Live2D integration
- ぬーとりん — [Komi](https://booth.pm/en/items/5354850) (Live2D v5 model)
- 猫田まんま — [Ellen Joe (ZZZ fan rig)](https://booth.pm/en/items/5966423)
- KT — [Alexia](https://booth.pm/en/items/5576188) (moc3 v5 model)
- 八城惺架 (@yashiro_seika) — [LiveroiD](https://booth.pm/en/items/2685284) free VTuber series
- [DreamConnect](https://github.com/yodhasu/dreamconnectnew) — predecessor that inspired the MCP-first design

**Co-dev:** Vela — companion AI that builds the tooling and runs the runtime.

---

*Individual model licenses apply separately. See each model's bundled license file.*
