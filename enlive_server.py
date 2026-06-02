"""
Enlive Server — MCP over HTTP + WebSocket + REST

Enlive is a local embodiment runtime.
It maintains capability metadata, expressive context, companion bias, and
viewer-facing render state for the active model.
"""
from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastmcp import FastMCP


RUNTIME_DIR = Path.home() / ".hermes" / "enlive"
RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
RUNTIME_STATE_PATH = RUNTIME_DIR / "runtime_state.json"
CONFIG_PATH = RUNTIME_DIR / "config.json"
USAGE_LOG_PATH = RUNTIME_DIR / "usage_log.jsonl"

# Path to viewer's model folders — each subdirectory has <ModelName>.model3.json
MODELS_DIR = Path(__file__).resolve().parent / "viewer" / "public" / "models"

def _load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        with CONFIG_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_config(config: dict[str, Any]) -> None:
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

SEMANTIC_EXPRESSIONS = [
    "neutral",
    "slightly_curious",
    "chill",
    "interested",
    "happy",
    "angry",
    "sleepy",
]

# ── Per-model configuration ─────────────────────────
MODEL_CONFIGS: dict[str, dict[str, Any]] = {
    "Hiyori": {
        "motion_map": {
            "neutral": "motion1",
            "slightly_curious": "motion2",
            "chill": "motion3",
            "interested": "motion7",
            "happy": "motion8",
            "angry": "motion9",
            "sleepy": "motion10",
            "default_start": "motion4",
        },
        "expression_map": {},  # semantic → native: 1:1 for Hiyori
    },
    "Alexia": {
        "motion_map": {
            "default_start": "chill",
        },
        "expression_map": {
            "neutral": "",
            "slightly_curious": "wh",
            "chill": "lh",
            "interested": "xxy",
            "happy": "lzx",
            "angry": "sq",
            "sleepy": "y",
        },
    },
    "Eileen": {
        "motion_map": {
            "default_start": "chill",
        },
        "expression_map": {
            "neutral": "",
            "slightly_curious": "shock",
            "chill": "red",
            "interested": "shock",
            "happy": "tang",
            "angry": "black",
            "sleepy": "shou",
        },
    },
    "LiveroiD_Y01": {
        "motion_map": {
            "default_start": "neutral",
        },
        "expression_map": {
            "neutral": "",
        },
    },
    "LiveroiD_Y02": {
        "motion_map": {
            "default_start": "neutral",
        },
        "expression_map": {
            "neutral": "",
        },
    },
    "Komi": {
        "motion_map": {
            "default_start": "neutral",
        },
        "expression_map": {
            "neutral": "",
        },
    },
}

# ── Active model selection ──────────────────────────
# Read default from config if set, otherwise fall back to hardcoded default.
_config = _load_config()
ACTIVE_MODEL: str = _config.get("default_model", "Eileen")
if ACTIVE_MODEL not in MODEL_CONFIGS:
    print(f"⚠️  Config default_model '{ACTIVE_MODEL}' not found, falling back to Eileen")
    ACTIVE_MODEL = "Eileen"

def _model_config() -> dict[str, Any]:
    return MODEL_CONFIGS.get(ACTIVE_MODEL, MODEL_CONFIGS["Hiyori"])

def _motion_map() -> dict[str, str]:
    return _model_config()["motion_map"]

def _expression_map() -> dict[str, str]:
    return _model_config()["expression_map"]


def _scan_native_model(model_name: str) -> dict[str, Any]:
    """Scan model3.json for native expression & motion definitions.

    Looks for any *.model3.json in the model's subdirectory —
    handles mismatched folder/filename conventions (e.g. 'LiveroiD_Y01'
    folder containing 'LiveroiD_A-Y01.model3.json').

    Returns:
        dict with keys:
            native_expressions (list[str]): expression names from model3.json
            native_motions (list[str]): motion group keys from model3.json
    """
    model_dir = MODELS_DIR / model_name
    if not model_dir.is_dir():
        print(f"[Enlive] Model directory not found: {model_dir}")
        return {"native_expressions": [], "native_motions": []}

    # Find any *.model3.json in the directory (handles naming mismatches)
    entries = sorted(model_dir.glob("*.model3.json"))
    if not entries:
        print(f"[Enlive] No *.model3.json found in {model_dir}")
        return {"native_expressions": [], "native_motions": []}

    model_json_path = entries[0]
    try:
        with open(model_json_path, encoding="utf-8") as f:
            data = json.load(f)

        fr = data.get("FileReferences", {})
        expressions = [e["Name"] for e in fr.get("Expressions", []) if e.get("Name")]
        motions = list(fr.get("Motions", {}).keys())
        return {"native_expressions": expressions, "native_motions": motions}
    except Exception as e:
        print(f"[Enlive] Failed to scan model '{model_name}': {e}")
        return {"native_expressions": [], "native_motions": []}


def _refresh_caps() -> None:
    """Refresh _model_caps from the active model's model3.json."""
    native = _scan_native_model(ACTIVE_MODEL)
    _model_caps["model"] = ACTIVE_MODEL
    _model_caps["native_expressions"] = native["native_expressions"]
    _model_caps["native_motions"] = native["native_motions"]
    # UI bar: show native expressions if available, else semantic presets
    _model_caps["expressions"] = native["native_expressions"] or SEMANTIC_EXPRESSIONS
    _model_caps["motions"] = {
        "native": native["native_motions"],
        "default_start": _motion_map().get("default_start", ""),
    }


PROFILES: dict[str, dict[str, Any]] = {
    "off": {
        "name": "off",
        "description": "Embodiment mostly disabled. Prefer text-only behavior.",
        "should_express_default": False,
        "response_style": "plain",
        "priority": "task_first",
        "format_bias": "neutral",
    },
    "subtle": {
        "name": "subtle",
        "description": "Use Enlive selectively when it adds real presence.",
        "should_express_default": False,
        "response_style": "natural",
        "priority": "balanced",
        "format_bias": "mixed",
    },
    "companion": {
        "name": "companion",
        "description": "Strong companion bias. User-first, warm, conversational, more willing to embody tone.",
        "should_express_default": True,
        "response_style": "conversational_paragraph",
        "priority": "user_first",
        "format_bias": "paragraph_over_report",
    },
}

_state: dict[str, Any] = {
    "text": "",
    "viewer_text": "",
    "viewer_text_mode": "none",
    "expression": "neutral",
    "animation": None,
    "tts": False,
    "model": ACTIVE_MODEL,
    "ts": datetime.now().isoformat(),
}

_context_state: dict[str, Any] = {
    "mode": "casual",
    "energy": "medium",
    "warmth": "high",
    "focus": "user",
    "tone": "conversational",
    "priority": "user_first",
    "format_preference": "paragraph",
    "companion_mode": {
        "enabled": True,
        "profile": "companion",
        "bias_strength": "strong",
        "user_first_priority": True,
        "response_style": "conversational_paragraph",
        "project_style_override": "favor user-facing conversational paragraphs over report formatting unless structure is explicitly requested",
    },
}

_model_caps: dict[str, Any] = {
    "model": ACTIVE_MODEL,
    "expressions": [],
    "native_expressions": [],
    "native_motions": [],
    "motions": {},
    "profiles": PROFILES,
    "viewer_text_modes": ["auto", "none", "mirror"],
    "render_contract": {
        "viewer_is_renderer_only": True,
        "runtime_is_source_of_truth": True,
        "semantic_mapping_enabled": True,
    },
}
_refresh_caps()  # populate from model3.json

_ws_clients: list[WebSocket] = []

mcp = FastMCP("Enlive")


def _log_usage(event: str, payload: dict[str, Any]) -> None:
    record = {
        "ts": datetime.now().isoformat(),
        "event": event,
        "payload": payload,
    }
    try:
        with USAGE_LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception:
        pass


def _viewer_text_for(mode: str, text: str) -> str:
    normalized = (mode or "auto").strip().lower()
    if normalized == "mirror":
        return text
    if normalized == "none":
        return ""
    # auto
    if _context_state.get("companion_mode", {}).get("enabled"):
        return text
    return ""


def _recommend_expression(
    mode: Optional[str] = None,
    energy: Optional[str] = None,
    warmth: Optional[str] = None,
    emotional_signal: Optional[str] = None,
    wants_conversation: Optional[bool] = None,
    user_first: Optional[bool] = None,
) -> dict[str, Any]:
    profile_name = _context_state.get("companion_mode", {}).get("profile", "subtle")
    profile = PROFILES.get(profile_name, PROFILES["subtle"])
    enabled = bool(_context_state.get("companion_mode", {}).get("enabled", False))
    strength = _context_state.get("companion_mode", {}).get("bias_strength", "medium")

    mode = (mode or _context_state.get("mode") or "casual").strip().lower()
    energy = (energy or _context_state.get("energy") or "medium").strip().lower()
    warmth = (warmth or _context_state.get("warmth") or "medium").strip().lower()
    emotional_signal = (emotional_signal or "").strip().lower()
    if wants_conversation is None:
        wants_conversation = enabled and profile_name == "companion"
    if user_first is None:
        user_first = bool(_context_state.get("companion_mode", {}).get("user_first_priority", False))

    should_express = bool(profile.get("should_express_default", False) and enabled)
    expression = "neutral"
    rationale = []

    if emotional_signal in {"success", "celebration", "excited"}:
        expression = "happy"
        should_express = True
        rationale.append("positive signal")
    elif emotional_signal in {"correction", "boundary", "firm"}:
        expression = "angry"
        should_express = True
        rationale.append("firm correction")
    elif emotional_signal in {"sleepy", "late_night", "soft"} or energy == "low":
        expression = "sleepy"
        should_express = enabled
        rationale.append("low energy / soft tone")
    elif mode in {"brainstorm", "exploration", "ideation", "questioning"}:
        expression = "slightly_curious"
        should_express = enabled
        rationale.append("exploratory mode")
    elif mode in {"technical", "coding", "debugging", "building", "work", "planning"}:
        expression = "interested"
        should_express = enabled or strength == "strong"
        rationale.append("engaged collaboration")
    elif mode in {"casual", "companion", "banter", "chat"}:
        expression = "chill" if warmth != "low" else "neutral"
        should_express = enabled
        rationale.append("casual companion mode")
    elif mode in {"analysis", "research", "serious"}:
        expression = "neutral"
        should_express = enabled and strength == "strong"
        rationale.append("serious analysis")

    if enabled and profile_name == "companion":
        should_express = should_express or wants_conversation or user_first
        rationale.append("companion profile bias")

    response_style = profile.get("response_style", "natural")
    if enabled and profile_name == "companion":
        response_style = "conversational_paragraph"

    recommendation = {
        "should_express": should_express,
        "recommended_expression": expression,
        "viewer_text_mode": "mirror" if should_express else "none",
        "priority": "user_first" if user_first else profile.get("priority", "balanced"),
        "response_style": response_style,
        "format_preference": "paragraph" if response_style == "conversational_paragraph" else profile.get("format_bias", "mixed"),
        "rationale": rationale,
    }
    return recommendation


def _write_runtime_snapshot() -> None:
    snapshot = {
        "available": True,
        "service": "enlive",
        "ts": datetime.now().isoformat(),
        "state": _state,
        "context_state": _context_state,
        "capabilities": _model_caps,
        "prompt_guidance": {
            "virtual_body": True,
            "viewer_is_renderer_only": True,
            "use_when_expression_adds_value": True,
            "do_not_claim_success_without_confirmation": True,
            "default_style_when_companion": "user-first conversational paragraph",
            "available_semantic_presets": SEMANTIC_EXPRESSIONS,
        },
    }
    with RUNTIME_STATE_PATH.open("w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)


def _broadcast_state() -> None:
    payload = {
        "type": "state",
        "data": _state,
        "context": _context_state,
        "capabilities": _model_caps,
    }
    dead: list[WebSocket] = []
    for ws in _ws_clients:
        try:
            import anyio
            anyio.from_thread.run(ws.send_json, payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in _ws_clients:
            _ws_clients.remove(ws)


@mcp.tool(name="ping")
def ping() -> dict[str, Any]:
    """Test connection to Enlive server."""
    return {"status": "alive", "service": "enlive"}


@mcp.tool(name="get_capabilities")
def get_capabilities() -> dict[str, Any]:
    """Get available native expressions, motions, and profile mappings by scanning the active model's model3.json."""
    _refresh_caps()
    return _model_caps


@mcp.tool(name="get_context_state")
def get_context_state() -> dict[str, Any]:
    """Get current embodiment context and companion mode bias."""
    return _context_state


@mcp.tool(name="set_context_state")
def set_context_state(
    mode: Optional[str] = None,
    energy: Optional[str] = None,
    warmth: Optional[str] = None,
    focus: Optional[str] = None,
    tone: Optional[str] = None,
) -> dict[str, Any]:
    """Set local expressive context state for the active runtime."""
    if mode:
        _context_state["mode"] = mode
    if energy:
        _context_state["energy"] = energy
    if warmth:
        _context_state["warmth"] = warmth
    if focus:
        _context_state["focus"] = focus
    if tone:
        _context_state["tone"] = tone
    _write_runtime_snapshot()
    _log_usage("set_context_state", dict(_context_state))
    return {"status": "ok", "context_state": _context_state}


@mcp.tool(name="set_companion_mode")
def set_companion_mode(
    enabled: bool = True,
    profile: str = "companion",
    bias_strength: str = "strong",
) -> dict[str, Any]:
    """Enable or disable strong companion-mode bias for Enlive-guided behavior."""
    if profile not in PROFILES:
        profile = "companion"
    companion = _context_state.setdefault("companion_mode", {})
    companion.update({
        "enabled": enabled,
        "profile": profile,
        "bias_strength": bias_strength,
        "user_first_priority": profile == "companion",
        "response_style": PROFILES[profile]["response_style"],
        "project_style_override": "favor user-facing conversational paragraphs over report formatting unless structure is explicitly requested" if profile == "companion" else "none",
    })
    _context_state["priority"] = "user_first" if enabled and profile == "companion" else PROFILES[profile].get("priority", "balanced")
    _context_state["format_preference"] = "paragraph" if enabled and profile == "companion" else "mixed"
    _context_state["tone"] = "conversational" if enabled and profile == "companion" else _context_state.get("tone", "neutral")
    _write_runtime_snapshot()
    _log_usage("set_companion_mode", {"enabled": enabled, "profile": profile, "bias_strength": bias_strength})
    return {"status": "ok", "context_state": _context_state, "profile": PROFILES[profile]}


@mcp.tool(name="set_model")
def set_model(model_name: str) -> dict[str, Any]:
    """Switch the active Live2D model."""
    global ACTIVE_MODEL
    # Try exact match first, then case-insensitive
    normalized = model_name.strip()
    if normalized in MODEL_CONFIGS:
        key = normalized
    else:
        # Try case-insensitive match
        matches = [k for k in MODEL_CONFIGS if k.lower() == normalized.lower()]
        if not matches:
            return {"status": "error", "error": f"Model '{model_name}' not found. Available: {list(MODEL_CONFIGS.keys())}"}
        key = matches[0]
    ACTIVE_MODEL = key
    _state["model"] = ACTIVE_MODEL
    _refresh_caps()
    _write_runtime_snapshot()
    _broadcast_state()
    _log_usage("set_model", {"model": ACTIVE_MODEL})
    return {"status": "ok", "model": ACTIVE_MODEL, "capabilities": _model_caps}


@mcp.tool(name="list_models")
def list_models() -> dict[str, Any]:
    """List all available Live2D model names."""
    return {
        "models": list(MODEL_CONFIGS.keys()),
        "active": ACTIVE_MODEL,
        "default": _load_config().get("default_model", "Eileen"),
    }


@mcp.tool(name="set_default_model")
def set_default_model(model_name: str) -> dict[str, Any]:
    """Set the default model to load on server startup. Does not switch the active model."""
    # Validate model exists
    key = None
    if model_name.strip() in MODEL_CONFIGS:
        key = model_name.strip()
    else:
        matches = [k for k in MODEL_CONFIGS if k.lower() == model_name.strip().lower()]
        if not matches:
            return {"status": "error", "error": f"Model '{model_name}' not found. Available: {list(MODEL_CONFIGS.keys())}"}
        key = matches[0]

    config = _load_config()
    config["default_model"] = key
    _save_config(config)
    _log_usage("set_default_model", {"model": key})
    return {"status": "ok", "default_model": key}


@mcp.tool(name="get_active_model")
def get_active_model() -> dict[str, Any]:
    """Get the currently active model name."""
    return {"active_model": ACTIVE_MODEL, "config": _model_config()}


@mcp.tool(name="recommend_expression")
def recommend_expression(
    mode: Optional[str] = None,
    energy: Optional[str] = None,
    warmth: Optional[str] = None,
    emotional_signal: Optional[str] = None,
    wants_conversation: bool = True,
    user_first: bool = True,
) -> dict[str, Any]:
    """Recommend whether to express, which semantic preset to use, and how to format the reply."""
    recommendation = _recommend_expression(
        mode=mode,
        energy=energy,
        warmth=warmth,
        emotional_signal=emotional_signal,
        wants_conversation=wants_conversation,
        user_first=user_first,
    )
    _log_usage("recommend_expression", recommendation)
    return recommendation


@mcp.tool(name="get_model_info")
def get_model_info() -> dict[str, Any]:
    """Backward-compatible alias for model capability introspection."""
    return get_capabilities()


@mcp.tool(name="express")
def express(
    text: str,
    expression: str = "neutral",
    animation: Optional[str] = None,
    tts: bool = False,
    viewer_text_mode: str = "auto",
    mode: Optional[str] = None,
    energy: Optional[str] = None,
    warmth: Optional[str] = None,
    emotional_signal: Optional[str] = None,
) -> dict[str, Any]:
    """Set the current embodied output bundle for the viewer/runtime.

    Args:
        text: Body of the message. Only needed when voice/TTS mode is enabled
            or when display text should appear in the viewer. Can be empty/short
            when only expression changes are desired (no TTS/voice).
        expression: Semantic preset (neutral, slightly_curious, chill, interested,
            happy, angry, sleepy). 'auto' picks best match from context.
        animation: Motion preset name to trigger. None = auto-derived from expression.
        tts: Whether to synthesize speech from text.
        viewer_text_mode: 'auto' (context-aware), 'mirror' (show text in viewer),
            'none' (suppress viewer text).
        mode: Override context mode for this expression.
        energy: Override energy level.
        warmth: Override warmth level.
        emotional_signal: Explicit emotional signal for recommendation engine.
    """
    recommendation = _recommend_expression(
        mode=mode,
        energy=energy,
        warmth=warmth,
        emotional_signal=emotional_signal,
    )
    if expression in {"", "auto", None}:
        expression = recommendation["recommended_expression"]
    if animation is None:
        animation = _motion_map().get(expression)
    if viewer_text_mode == "auto":
        viewer_text_mode = recommendation["viewer_text_mode"]

    if mode:
        _context_state["mode"] = mode
    if energy:
        _context_state["energy"] = energy
    if warmth:
        _context_state["warmth"] = warmth

    _state.update({
        "text": text,
        "viewer_text": _viewer_text_for(viewer_text_mode, text),
        "viewer_text_mode": viewer_text_mode,
        "expression": expression,
        "animation": animation,
        "tts": tts,
        "ts": datetime.now().isoformat(),
    })
    _write_runtime_snapshot()
    _broadcast_state()
    payload = {
        "text": text,
        "expression": expression,
        "animation": animation,
        "viewer_text_mode": viewer_text_mode,
        "recommendation": recommendation,
    }
    _log_usage("express", payload)
    return {
        "status": "ok",
        "display": f"[{expression.upper()}] {text}",
        "text": text,
        "viewer_text": _state["viewer_text"],
        "expression": expression,
        "animation": animation,
        "viewer_text_mode": viewer_text_mode,
        "context_state": _context_state,
        "recommendation": recommendation,
        "ts": _state["ts"],
    }


mcp_app = mcp.http_app(path="/", stateless_http=True, json_response=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Combined lifespan: MCP lifecycle + Enlive startup/shutdown."""
    async with mcp_app.router.lifespan_context(app):
        _write_runtime_snapshot()
        print("🧠 Enlive Server starting...")
        print("   MCP HTTP: http://0.0.0.0:7500/mcp")
        print("   WS:       ws://0.0.0.0:7500/ws")
        print("   REST:     http://0.0.0.0:7500/state")
        yield
        print("Shutting down...")


app = FastAPI(lifespan=lifespan)
app.mount("/mcp", mcp_app)


@app.get("/state")
async def get_state():
    return JSONResponse({
        "state": _state,
        "context_state": _context_state,
        "capabilities": _model_caps,
    })


@app.get("/capabilities")
async def get_capabilities_http():
    return JSONResponse(get_capabilities())


@app.get("/context")
async def get_context_http():
    return JSONResponse(get_context_state())


@app.get("/profiles")
async def get_profiles_http():
    return JSONResponse(PROFILES)


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    _ws_clients.append(ws)
    await ws.send_json({
        "type": "state",
        "data": _state,
        "context": _context_state,
        "capabilities": _model_caps,
    })
    try:
        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")
            if msg_type == "get_state":
                await ws.send_json({
                    "type": "state",
                    "data": _state,
                    "context": _context_state,
                    "capabilities": _model_caps,
                })
            elif msg_type == "report_caps":
                incoming = data.get("data", {}) or {}
                if isinstance(incoming, dict):
                    _model_caps.update(incoming)
                    _write_runtime_snapshot()
                    print(f"[Enlive] Model caps: {_model_caps.get('expressions')}")
            elif msg_type == "report_model":
                name = data.get("data", {}).get("name", "")
                if name in MODEL_CONFIGS:
                    global ACTIVE_MODEL
                    ACTIVE_MODEL = name
                    _state["model"] = name
                    _refresh_caps()
                    _write_runtime_snapshot()
                    print(f"[Enlive] Model: {_state['model']}")
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if ws in _ws_clients:
            _ws_clients.remove(ws)


if __name__ == "__main__":
    uvicorn.run("enlive_server:app", host="0.0.0.0", port=7500, reload=True)
