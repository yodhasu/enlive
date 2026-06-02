# Enlive — Roadmap

> **Status:** Early R&D · Pre-release  
> **Last updated:** June 2026

---

## Vision

Enlive is a local-first, MCP-driven embodiment runtime for companion-style AI agents.  
It separates the *brain* (the AI agent) from the *body* (Live2D renderer) through a clean MCP protocol — enabling model switching, semantic expression, and runtime control without touching code.

---

## Phases

### Phase 1 · Core Runtime ✅ (Current)
- [x] FastMCP server with HTTP + WebSocket transport
- [x] Semantic expression system (7 presets: neutral, chill, happy, angry, sleepy, slightly_curious, interested)
- [x] Per-model expression/motion mapping
- [x] Live2D Cubism 5 Core + pixi-live2d-display viewer
- [x] Runtime model switching via WebSocket capabilities broadcast
- [x] `set_model` / `list_models` / `set_default_model` / `get_active_model` MCP tools
- [x] Companion mode with profiles (off, subtle, companion)
- [x] Systemd service integration
- [ ] Clean up viewer rebuild step (optional)

### Phase 2 · Multi-Model & Customization 🔜
- [ ] GUI for per-model motion mapping (drag-and-drop expression → motion)
- [ ] Model parameter preview / edit
- [ ] Runtime body tracking (pointer follow, face tracking via webcam)
- [ ] Per-model physics tuning
- [ ] Preset/snapshot system (save expression+animation combos)

### Phase 3 · Integration & Deployment 🔜
- [ ] Hermes Agent plugin for auto-embodiment
- [ ] Cross-device via Tailscale (server on desktop, viewer on laptop)
- [ ] AR/VR overlay mode
- [ ] Custom Live2D model upload via MCP
- [ ] Voice synthesis integration (TTS → lip sync)

### Phase 4 · Ecosystem 🔮
- [ ] Model marketplace / sharing
- [ ] Plugin API for third-party embodiment backends
- [ ] Mobile companion viewer
- [ ] Multi-character scenes

---

## Current Dev Focus

- Stabilizing runtime model switching
- Building out MCP utility tools for CLI-first control
- Testing with diverse Live2D models (Hiyori, Alexia, Eileen, LiveroiD)

---

## Known Limitations

- No GUI motion mapper yet — motion config is hand-edited in code
- Model switch requires WebSocket round-trip; no offline fallback
- Only single model at a time (no multi-character)
