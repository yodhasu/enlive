/**
 * WebSocket client — connects to Enlive MCP server for live state updates.
 */

export interface EnliveState {
  text: string;
  viewer_text?: string;
  viewer_text_mode?: string;
  expression: string;
  animation: string | null;
  tts: boolean;
  model: string | null;
}

export interface EnliveContextState {
  mode: string;
  energy: string;
  warmth: string;
  tone: string;
  priority: string;
  format_preference: string;
  companion_mode?: {
    enabled: boolean;
    profile: string;
    bias_strength: string;
    user_first_priority: boolean;
    response_style: string;
  };
}

export interface EnliveCapabilities {
  model?: string;
  expressions?: string[];
  motions?: Record<string, string>;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export class EnliveWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private _status: ConnectionStatus = "disconnected";
  private onState: ((state: EnliveState) => void) | null = null;
  private onStatus: ((status: ConnectionStatus) => void) | null = null;
  private onContext: ((context: EnliveContextState) => void) | null = null;
  private onCapabilities: ((capabilities: EnliveCapabilities) => void) | null = null;
  private hasSeenInitialState = false;

  constructor(url: string) {
    this.url = url;
  }

  get status() { return this._status; }

  onStateChange(cb: (state: EnliveState) => void) { this.onState = cb; }
  onStatusChange(cb: (status: ConnectionStatus) => void) { this.onStatus = cb; }
  onContextChange(cb: (context: EnliveContextState) => void) { this.onContext = cb; }
  onCapabilitiesChange(cb: (capabilities: EnliveCapabilities) => void) { this.onCapabilities = cb; }

  connect() {
    if (this.ws) return;
    this._setStatus("connecting");

    this.ws = new WebSocket(this.url);
    this.hasSeenInitialState = false;
    this.ws.onopen = () => {
      console.log("[Enlive WS] Connected");
      this._setStatus("connected");
    };
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.capabilities && this.onCapabilities) {
          this.onCapabilities(msg.capabilities as EnliveCapabilities);
        }
        if (msg.context && this.onContext) {
          this.onContext(msg.context as EnliveContextState);
        }
        if (msg.type === "state" && this.onState) {
          if (!this.hasSeenInitialState) {
            this.hasSeenInitialState = true;
            console.log("[Enlive WS] Ignoring initial state snapshot; local idle remains authoritative until MCP update.");
            return;
          }
          this.onState(msg.data as EnliveState);
        }
      } catch (e) {
        console.warn("[Enlive WS] Invalid message:", e);
      }
    };
    this.ws.onclose = () => {
      console.log("[Enlive WS] Disconnected");
      this.ws = null;
      this._setStatus("disconnected");
      this._scheduleReconnect();
    };
    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this._setStatus("disconnected");
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private _setStatus(s: ConnectionStatus) {
    this._status = s;
    this.onStatus?.(s);
  }

  private _scheduleReconnect() {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      console.log("[Enlive WS] Reconnecting...");
      this.connect();
    }, 3000);
  }
}
