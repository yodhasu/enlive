# Enlive — Roadmap

> **Status:** Early R&D · Pre-release
> **Last updated:** June 2026

---

## Core Thesis

Enlive is not a product. It's a **proven pattern**: MCP + Live2D = a thin embodiment layer that sits between any agent harness and a character model. The protocol (MCP tools + WebSocket state broadcast) is the valuable part — the viewer is just a reference implementation.

End goal: a drop-in layer that makes any agent feel present, without being tied to any specific agentic system, model, or viewer.

---

## What Already Works

- FastMCP server with HTTP + WebSocket transport
- Semantic expression system (7 presets: neutral, chill, happy, angry, sleepy, slightly_curious, interested)
- Per-model expression/motion mapping (hand-edited in code)
- Live2D Cubism 5 Core + pixi-live2d-display viewer
- Runtime model switching via WebSocket capabilities broadcast
- `set_model` / `list_models` / `set_default_model` / `get_active_model` MCP tools
- Companion mode with profiles (off, subtle, companion)
- Cross-model support (Hiyori, Alexia, Eileen/ZZZ, LiveroiD)
- Bundled repo ready for clone-and-run

---

## What's Left to Do

Things that are actually realistic for a two-person RnD effort:

### Short-term (actually needed)

- [ ] **Model motion mapper GUI** — minimal UI to map expressions → motions without editing code. Drag, save, done. The biggest pain point right now.
- [ ] **Hermes plugin for auto-embodiment** — so Enlive context feeds into the agent's system prompt automatically. This is the "layer above harness" part.
- [ ] **Cross-device via Tailscale** — server on desktop, viewer on laptop, same MCP protocol. Already works in theory, just need docs + testing.
- [ ] **TTS → lip sync (rough)** — open/close mouth on audio output. Doesn't need phoneme-level sync; good enough for presence.

### Longer-term (if still useful)

- [ ] **Custom model upload via MCP** — drop a `.zip` of model files, it gets extracted and registered without touching disk manually.
- [ ] **Plugin API for alternative backends** — so someone can write a Unity renderer, a Three.js one, etc. without forking the server.

### Explicitly Not Doing

- ❌ AR/VR overlay — cool as a demo, useless day-to-day
- ❌ Model marketplace / sharing — not a store, not interested
- ❌ Mobile viewer — phone is for chat, not Live2D (will change my mind bout this for sure LoL)
- ❌ Multi-character scenes — one body at a time is enough
- ❌ Face tracking via webcam — too many dependencies, low value
- ❌ Model parameter editors / physics tuning — per-model config is fine in code

---

## Design Principle

**Thin layer, swappable parts.** The server (MCP protocol) is the only real component. Everyone can write their own viewer, their own model set, their own expression mapper — as long as they speak the same WebSocket protocol, it just works. That's the whole point.
