import './style.css';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';
import { EnliveWebSocket, type EnliveState, type ConnectionStatus, type EnliveContextState, type EnliveCapabilities } from './viewer/enlive-websocket';

const canvas = document.getElementById('live2d-canvas') as HTMLCanvasElement;
const loadingEl = document.getElementById('loading')!;
const connStatusEl = document.getElementById('connection-status')!;
const modelNameEl = document.getElementById('model-name')!;
const expressionListEl = document.getElementById('expression-list')!;
const motionsListEl = document.getElementById('motion-list')!;
const motionsBarEl = document.getElementById('motions-bar')!;
const expressionsBarEl = document.getElementById('expressions-bar')!;

const ENLIVE_WS_URL = import.meta.env.VITE_ENLIVE_WS_URL || 'ws://127.0.0.1:7500/ws';

// ── Model Configs ──────────────────────────────────
interface ModelConfig {
  name: string;
  modelJson: string;
  baseScale: number;
  /** Mapping: semantic expression name → model's native expression name */
  expressionMap: Record<string, string>;
  /** Mapping: motionId or semantic expression → { group, index } */
  motionPresets: Record<string, { group: string; index?: number }>;
  /** Expressions to exclude from the semantic UI list */
  skipFromUi?: string[];
  motionInfo: string;
  expressionInfo: string;
  defaultStart: string;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  Hiyori: {
    name: 'Hiyori',
    modelJson: '/models/Hiyori/Hiyori.model3.json',
    baseScale: 0.33,
    expressionMap: {
      neutral: 'neutral',
      slightly_curious: 'slightly_curious',
      chill: 'chill',
      interested: 'interested',
      happy: 'happy',
      angry: 'angry',
      sleepy: 'sleepy',
    },
    motionPresets: {
      neutral: { group: 'Idle', index: 0 },
      slightly_curious: { group: 'Idle', index: 1 },
      chill: { group: 'Idle', index: 2 },
      interested: { group: 'Idle', index: 5 },
      happy: { group: 'Idle', index: 6 },
      angry: { group: 'Idle', index: 7 },
      sleepy: { group: 'Idle', index: 8 },
      motion1: { group: 'Idle', index: 0 },
      motion2: { group: 'Idle', index: 1 },
      motion3: { group: 'Idle', index: 2 },
      motion4: { group: 'TapBody', index: 0 },
      motion7: { group: 'Idle', index: 5 },
      motion8: { group: 'Idle', index: 6 },
      motion9: { group: 'Idle', index: 7 },
      motion10: { group: 'Idle', index: 8 },
    },
    motionInfo: 'motion1 neutral · motion2 slightly_curious · motion3 chill · motion4 default-start · motion7 interested · motion8 happy · motion9 angry · motion10 sleepy',
    expressionInfo: 'neutral · slightly_curious · chill · interested · happy · angry · sleepy',
    defaultStart: 'motion4',
  },
  Alexia: {
    name: 'Alexia',
    modelJson: '/models/Alexia/Alexia.model3.json',
    baseScale: 0.28,
    expressionMap: {
      neutral: '',
      slightly_curious: 'wh',
      chill: 'lh',
      interested: 'xxy',
      happy: 'lzx',
      angry: 'sq',
      sleepy: 'y',
    },
    motionPresets: {
      neutral: { group: 'Idle', index: 0 },
      slightly_curious: { group: 'Idle', index: 0 },
      chill: { group: 'Idle', index: 0 },
      interested: { group: 'Idle', index: 0 },
      happy: { group: 'Idle', index: 0 },
      angry: { group: 'Idle', index: 0 },
      sleepy: { group: 'Idle', index: 0 },
    },
    motionInfo: 'user-configurable',
    expressionInfo: 'neutral · slightly_curious(wh) · chill(lh) · interested(xxy) · happy(lzx) · angry(sq) · sleepy(y)',
    defaultStart: 'neutral',
    skipFromUi: [],
  },
  LiveroiD_Y01: {
    name: 'LiveroiD Y01',
    modelJson: '/models/LiveroiD_Y01/LiveroiD_A-Y01.model3.json',
    baseScale: 0.38,
    expressionMap: {
      neutral: '',
    },
    motionPresets: {
      neutral: { group: 'Idle', index: 0 },
    },
    motionInfo: 'user-configurable',
    expressionInfo: 'neutral · blush · cool · worried',
    defaultStart: 'neutral',
    skipFromUi: [],
  },
  LiveroiD_Y02: {
    name: 'LiveroiD Y02',
    modelJson: '/models/LiveroiD_Y02/LiveroiD_A-Y02.model3.json',
    baseScale: 0.38,
    expressionMap: {
      neutral: '',
    },
    motionPresets: {
      neutral: { group: 'Idle', index: 0 },
    },
    motionInfo: 'user-configurable',
    expressionInfo: 'neutral · blush · cool · worried',
    defaultStart: 'neutral',
    skipFromUi: [],
  },
  Komi: {
    name: 'Komi',
    modelJson: '/models/Komi/Komi.model3.json',
    baseScale: 0.45,
    expressionMap: {
      neutral: '',
      slightly_curious: 'eye_shine',
      chill: '',
      interested: 'eye_size',
      happy: 'blush',
      angry: 'pout',
      sleepy: 'mouth',
    },
    motionPresets: {
      neutral: { group: 'Idle', index: 0 },
    },
    motionInfo: 'Curious · Excited · Happy · Komi · Menacing · Panting · Shy',
    expressionInfo: 'aura · blush · cat_ear · eye_shine · eye_size · mouth · nose · pout',
    defaultStart: 'neutral',
    skipFromUi: [],
  },
  Eileen: {
    name: 'Eileen',
    modelJson: '/models/Eileen/Eileen.model3.json',
    baseScale: 0.26,
    expressionMap: {
      neutral: '',
      slightly_curious: 'shock',
      chill: 'red',
      interested: 'shock',
      happy: 'tang',
      angry: 'black',
      sleepy: 'shou',
    },
    motionPresets: {
      neutral: { group: 'Idle', index: 0 },
      slightly_curious: { group: 'Idle', index: 0 },
      chill: { group: 'Idle', index: 0 },
      interested: { group: 'Idle', index: 0 },
      happy: { group: 'Idle', index: 0 },
      angry: { group: 'Idle', index: 0 },
      sleepy: { group: 'Idle', index: 0 },
    },
    motionInfo: 'user-configurable',
    expressionInfo: 'neutral · slightly_curious(shock) · chill(red) · interested(shock) · happy(tang) · angry(black) · sleepy(shou)',
    defaultStart: 'neutral',
    skipFromUi: [],
  },
};

// ── Runtime mutable state ──────────────────────────
let modelConfig: ModelConfig = MODEL_CONFIGS.Eileen;
let MOTION_PRESETS = modelConfig.motionPresets;
let EXPRESSION_MAP = modelConfig.expressionMap;
let currentModelName: string | null = null;
let modelLoadInProgress = false;

let live2d: Live2DModel | null = null;
let app: PIXI.Application | null = null;
let idleSilenceTimer: number | null = null;
const IDLE_AFTER_SILENCE_MS = 60_000;
let lastActivityAt = Date.now();

function applyModelConfig(name: string) {
  const cfg = MODEL_CONFIGS[name];
  if (!cfg) {
    console.warn(`[Viewer] Unknown model config: "${name}", falling back to Eileen`);
    modelConfig = MODEL_CONFIGS.Eileen;
  } else {
    modelConfig = cfg;
  }
  MOTION_PRESETS = modelConfig.motionPresets;
  EXPRESSION_MAP = modelConfig.expressionMap;
}

function markActivity(_source = 'unknown') {
  lastActivityAt = Date.now();
  resetIdleTimer();
}

function resetIdleTimer() {
  if (idleSilenceTimer !== null) window.clearTimeout(idleSilenceTimer);
  const elapsed = Date.now() - lastActivityAt;
  const remaining = Math.max(0, IDLE_AFTER_SILENCE_MS - elapsed);

  idleSilenceTimer = window.setTimeout(async () => {
    if (!live2d) return;

    const elapsedNow = Date.now() - lastActivityAt;
    if (elapsedNow < IDLE_AFTER_SILENCE_MS) {
      resetIdleTimer();
      return;
    }

    try {
      await live2d.motion('Idle');
    } catch (e) {
      console.warn('[Viewer] Idle motion failed:', e);
    }
  }, remaining);
}

function fitModel() {
  if (!app || !live2d) return;
  const w = app.renderer.width;
  const h = app.renderer.height;
  live2d.anchor.set(0.5, 0.5);
  live2d.x = w / 2;
  live2d.y = h / 2;

  const s = modelConfig.baseScale * (Math.min(w / 1280, h / 720));
  live2d.scale.set(s);
}

function resolveMotionSpec(input?: string | null): { group: string; index?: number } | null {
  if (!input) return null;
  const key = String(input).trim().toLowerCase();

  if (MOTION_PRESETS[key]) return MOTION_PRESETS[key];

  if (key === 'idle' || key === 'tapbody') return { group: key === 'idle' ? 'Idle' : 'TapBody' };

  return { group: input };
}

async function playMappedMotion(input?: string | null): Promise<void> {
  if (!live2d || !input) return;
  const spec = resolveMotionSpec(input);
  if (!spec) return;
  await live2d.motion(spec.group, spec.index);
}

/** Apply a semantic expression name, translating it to the model's native name */
async function applySemanticExpression(name: string): Promise<void> {
  if (!live2d) return;

  // Try translation map first
  const nativeName = EXPRESSION_MAP[name];
  if (nativeName !== undefined) {
    if (nativeName === '') {
      // Empty = neutral/reset — clear any active expression
      try { await live2d.expression(''); } catch { /* ignore */ }
    } else {
      try { await live2d.expression(nativeName); } catch { /* ignore */ }
    }
    return;
  }

  // Pass through as-is (for direct native expression access)
  try { await live2d.expression(name); } catch { /* ignore */ }
}

// ── Runtime Model Switching ────────────────────────
async function switchModel(name: string): Promise<boolean> {
  if (modelLoadInProgress) {
    console.log(`[Viewer] Model load already in progress, skipping: ${name}`);
    return false;
  }
  modelLoadInProgress = true;

  // Destroy old model
  if (live2d) {
    try {
      live2d.off('*');
      app?.stage.removeChild(live2d);
      live2d.destroy({ children: true, texture: true });
    } catch (e) {
      console.warn('[Viewer] Failed to destroy old model:', e);
    }
    live2d = null;
  }

  applyModelConfig(name);
  currentModelName = name;

  loadingEl.textContent = `Loading ${modelConfig.name}...`;

  try {
    live2d = await Live2DModel.from(modelConfig.modelJson, {
      autoInteract: false,
    });

    app!.stage.addChild(live2d);

    // Disable pixi-live2d internal auto-idle loop
    try {
      const mm = (live2d as any)?.internalModel?.motionManager;
      if (mm?.groups) mm.groups.idle = '__NO_AUTO_IDLE__';
    } catch {
      // non-fatal
    }

    fitModel();

    // Update UI
    modelNameEl.textContent = modelConfig.name;
    motionsListEl.textContent = modelConfig.motionInfo;
    motionsBarEl.classList.remove('hidden');
    expressionListEl.textContent = modelConfig.expressionInfo;
    expressionsBarEl.classList.remove('hidden');

    // default starting motion
    try {
      await playMappedMotion(modelConfig.defaultStart);
    } catch (e) {
      console.warn('[Viewer] Default start motion failed:', e);
    }

    // Hide watermark parts for models that have them (e.g. Eileen/ZZZ has Part17)
    try {
      const internalModel = (live2d as any)?.internalModel;
      if (internalModel?.coreModel) {
        const coreParts = internalModel.coreModel._model?.parts;
        if (coreParts?.ids) {
          for (let i = 0; i < coreParts.count; i++) {
            const id = coreParts.ids[i];
            if (id && id.includes('Part17')) {
              coreParts.opacities[i] = 0;
              console.log('[Viewer] Hidden watermark part:', id);
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Viewer] Failed to hide watermark:', e);
    }

    loadingEl.textContent = '';
    resetIdleTimer();
    return true;
  } catch (e) {
    loadingEl.textContent = `Error: ${(e as Error)?.message || String(e)}`;
    console.error('[Viewer] Failed to load model:', e);
    return false;
  } finally {
    modelLoadInProgress = false;
  }
}

async function main() {
  loadingEl.textContent = 'Initializing PIXI...';

  app = new PIXI.Application({
    view: canvas,
    backgroundAlpha: 0,
    autoDensity: true,
    antialias: true,
    resizeTo: window,
  });

  Live2DModel.registerTicker(PIXI.Ticker);

  // Initial load from VITE_MODEL env var
  const initialModel = import.meta.env.VITE_MODEL || 'Eileen';
  const ready = await switchModel(initialModel);
  if (!ready) return;

  // Event listeners (reference mutable live2d + modelConfig, so they survive model switches)
  window.addEventListener('resize', fitModel);

  window.addEventListener('pointermove', (event) => {
    if (!live2d) return;
    live2d.focus(event.clientX, event.clientY);
    markActivity('pointermove');
  });

  window.addEventListener('pointerdown', async (event) => {
    if (!live2d) return;
    live2d.focus(event.clientX, event.clientY);
    markActivity('pointerdown');
    try {
      await playMappedMotion(modelConfig.defaultStart);
    } catch {
      // optional motion
    }
  });

  window.addEventListener('keydown', () => markActivity('keydown'));
  window.addEventListener('touchstart', () => markActivity('touchstart'), { passive: true });
  window.addEventListener('touchmove', () => markActivity('touchmove'), { passive: true });

  canvas.addEventListener('wheel', (event) => {
    if (!live2d || !event.ctrlKey) return;
    event.preventDefault();
    const next = live2d.scale.x + (event.deltaY < 0 ? 0.02 : -0.02);
    const clamped = Math.max(0.02, Math.min(2.0, next));
    live2d.scale.set(clamped);
    markActivity('wheel-zoom');
  }, { passive: false });

  // ── WebSocket (receives live state + model switch signals) ────────
  const ws = new EnliveWebSocket(ENLIVE_WS_URL);

  ws.onStatusChange((status: ConnectionStatus) => {
    connStatusEl.textContent =
      status === 'connected'
        ? `● ${modelConfig.name} Ready · MCP Connected`
        : status === 'connecting'
          ? `● ${modelConfig.name} Ready · MCP Connecting...`
          : `● ${modelConfig.name} Ready · MCP Offline`;
    connStatusEl.className = status;
  });

  ws.onCapabilitiesChange((capabilities: EnliveCapabilities) => {
    // Runtime model switching: when server reports a different model, reload
    if (capabilities.model && capabilities.model !== currentModelName && !modelLoadInProgress) {
      console.log(`[Viewer] Model switch detected: ${currentModelName} → ${capabilities.model}`);
      switchModel(capabilities.model);
      return; // UI will be updated by switchModel
    }

    // Just update display info
    if (capabilities.model) modelNameEl.textContent = capabilities.model;
    if (capabilities.expressions?.length) {
      const displayExps = capabilities.expressions.filter(e => !modelConfig.skipFromUi?.includes(e));
      expressionListEl.textContent = displayExps.join(' · ');
      expressionsBarEl.classList.remove('hidden');
    }
    if (capabilities.motions) {
      const entries = Object.entries(capabilities.motions)
        .filter(([key]) => key !== 'default_start')
        .map(([key, value]) => `${value} ${key}`);
      if (entries.length) {
        motionsListEl.textContent = entries.join(' · ');
        motionsBarEl.classList.remove('hidden');
      }
    }
  });

  ws.onContextChange((context: EnliveContextState) => {
    const profile = context.companion_mode?.enabled ? context.companion_mode.profile : context.mode;
    connStatusEl.textContent = `● ${modelConfig.name} Ready · MCP Connected · ${profile} · ${context.priority}`;
  });

  ws.onStateChange(async (state: EnliveState) => {
    if (!live2d) return;
    markActivity('mcp-state-update');

    try {
      if (state.animation) {
        await playMappedMotion(state.animation);
      }
    } catch (e) {
      console.warn('[Viewer] Motion apply failed:', e);
    }

    try {
      if (state.expression) {
        await applySemanticExpression(state.expression);
      }
    } catch (e) {
      console.warn('[Viewer] Expression apply failed:', e);
    }

    const visibleText = state.viewer_text ?? state.text;
    if (visibleText) showText(visibleText);
  });

  ws.connect();
}

let textTimeout: number | null = null;

function showText(text: string) {
  let el = document.getElementById('display-text');
  if (!el) {
    el = document.createElement('div');
    el.id = 'display-text';
    document.getElementById('app')!.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('visible');

  if (textTimeout !== null) clearTimeout(textTimeout);
  textTimeout = window.setTimeout(() => {
    el?.classList.remove('visible');
  }, Math.max(2000, text.length * 100));
}

document.addEventListener('DOMContentLoaded', main);
