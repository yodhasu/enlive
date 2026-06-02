# Enlive — Roadmap

> Personal open-source hobby project, nothing serious.

---

## What this is

I wanted a Live2D character that reacts to what I say, switches models without refreshing, and doesn't need a cloud service. That's it.

The MCP protocol turned out to be a decent abstraction, so I bundled it. If someone else finds it useful, cool. If not, that's also fine.

---

## What works right now

- Server with MCP tools (set_model, express, list_models, etc.)
- Runtime model switching via WebSocket — no page reload
- 7 expression presets mapped per-model
- 4 models bundled (Hiyori, Alexia, Eileen, LiveroiD × 2)
- Companion mode for context-aware expressions
- `pnpm dev` + `python enlive_server.py` and it runs

## Stuff I might do eventually

- [ ] Minimal UI for motion mapping (editing code by hand gets old)
- [ ] TTS lip sync — rough, not research-grade
- [ ] Cross-device (desktop server, laptop viewer)
- [ ] Custom model upload via MCP so I don't have to move files manually

## Stuff I'm definitely not doing

- AR/VR overlay — cool as a demo, useless day-to-day
- Model marketplace / sharing — not a store, not interested
- ~~Mobile viewer~~ — phone is for chat, not Live2D (will change my mind about this for sure LoL)
- Multi-character scenes — one body at a time is enough
- Model parameter editors / physics tuning — per-model config is fine in code

---

## The only design principle

The server defines the protocol. Anyone can write their own viewer for it. That's the whole idea.
