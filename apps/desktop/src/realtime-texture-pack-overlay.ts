import type { Rectangle } from "electron";
import {
  buildRealtimeTexturePackSessionState,
  parseRealtimeTexturePackConfig,
  parseRealtimeTexturePackProjectionFrame,
  type RealtimeTexturePackConfigV1,
  type RealtimeTexturePackProjectionFrameV1,
  type RealtimeTexturePackSessionStateV1,
} from "../../../shared/realtime-texture-pack";
import {
  DESKTOP_TEXTURE_PACK_OVERLAY_CLEAR_CHANNEL,
  DESKTOP_TEXTURE_PACK_OVERLAY_RENDER_CHANNEL,
} from "./channels";

export type TexturePackOverlayWindow = {
  isDestroyed(): boolean;
  loadURL(url: string): Promise<void>;
  showInactive(): void;
  hide(): void;
  destroy(): void;
  setBounds(bounds: Rectangle): void;
  setAlwaysOnTop(flag: boolean, level?: "screen-saver"): void;
  setFocusable(flag: boolean): void;
  setIgnoreMouseEvents(ignore: boolean, options?: { forward: boolean }): void;
  setSkipTaskbar(skip: boolean): void;
  webContents: {
    send(channel: string, payload?: unknown): void;
    setWindowOpenHandler(handler: () => { action: "deny" }): void;
    on(event: "will-navigate", listener: (event: { preventDefault(): void }) => void): void;
  };
};

export type TexturePackOverlayDependencies = {
  createWindow(): TexturePackOverlayWindow;
  getDisplayBounds(): Rectangle;
  now?: () => Date;
  publishState?: (state: RealtimeTexturePackSessionStateV1) => void;
};

const OVERLAY_DOCUMENT = `<!doctype html>
<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#000}img{width:100%;height:100%;display:block;object-fit:cover}
</style></head><body><img id="projection" alt="" aria-hidden="true"></body></html>`;

const overlayUrl = `data:text/html;charset=utf-8,${encodeURIComponent(OVERLAY_DOCUMENT)}`;

export class RealtimeTexturePackOverlayController {
  private window: TexturePackOverlayWindow | null = null;
  private config: RealtimeTexturePackConfigV1 | null = null;
  private lastProjectionCompletedAt = 0;
  private state = buildRealtimeTexturePackSessionState({
    sessionId: "texture-session:overlay-unstarted",
  });

  constructor(private readonly dependencies: TexturePackOverlayDependencies) {}

  getState(): RealtimeTexturePackSessionStateV1 {
    return this.state;
  }

  async show(candidate: unknown): Promise<RealtimeTexturePackSessionStateV1> {
    const config = parseRealtimeTexturePackConfig(candidate as RealtimeTexturePackConfigV1);
    if (config.source_surface !== "window") {
      throw new Error("realtime_texture_pack_window_source_required");
    }
    if (this.config?.session_id !== config.session_id) {
      this.destroyWindow();
      this.lastProjectionCompletedAt = 0;
    }
    this.config = config;
    const window = await this.ensureWindow();
    this.applySafety(window);
    window.setBounds(this.dependencies.getDisplayBounds());
    window.showInactive();
    return this.publish({
      ...buildRealtimeTexturePackSessionState({
        sessionId: config.session_id,
        status: "overlay_active",
      }),
      overlay_visible: true,
      capture_active: true,
    });
  }

  updateFrame(candidate: unknown): RealtimeTexturePackSessionStateV1 {
    if (!this.config || !this.window || this.window.isDestroyed()) {
      throw new Error("realtime_texture_pack_overlay_not_started");
    }
    const frame = parseRealtimeTexturePackProjectionFrame(
      candidate as RealtimeTexturePackProjectionFrameV1,
    );
    if (frame.session_id !== this.config.session_id) {
      throw new Error("realtime_texture_pack_session_mismatch");
    }
    const completedAt = Date.parse(frame.projection_completed_at);
    const now = (this.dependencies.now ?? (() => new Date()))().getTime();
    if (completedAt <= this.lastProjectionCompletedAt) {
      return this.publish({
        ...this.state,
        dropped_frame_count: this.state.dropped_frame_count + 1,
        failure_reason: "realtime_texture_pack_out_of_order_frame",
      });
    }
    if (now - Date.parse(frame.source_captured_at) > this.config.stale_after_ms) {
      this.window.hide();
      return this.publish({
        ...this.state,
        status: "degraded",
        overlay_visible: false,
        dropped_frame_count: this.state.dropped_frame_count + 1,
        failure_reason: "realtime_texture_pack_stale_frame",
      });
    }
    this.lastProjectionCompletedAt = completedAt;
    this.window.webContents.send(
      DESKTOP_TEXTURE_PACK_OVERLAY_RENDER_CHANNEL,
      frame.projection_image_data_url,
    );
    return this.publish({
      ...this.state,
      status: this.state.overlay_visible ? "overlay_active" : "reveal_original",
      last_source_frame_id: frame.source_frame_id,
      last_projection_frame_id: frame.projection_frame_id,
      frame_age_ms: Math.max(0, now - Date.parse(frame.source_captured_at)),
      failure_reason: null,
    });
  }

  revealOriginal(reveal: unknown): RealtimeTexturePackSessionStateV1 {
    if (typeof reveal !== "boolean") {
      throw new Error("realtime_texture_pack_reveal_invalid");
    }
    if (!this.window || this.window.isDestroyed()) return this.state;
    if (reveal) this.window.hide();
    else {
      this.applySafety(this.window);
      this.window.setBounds(this.dependencies.getDisplayBounds());
      this.window.showInactive();
    }
    return this.publish({
      ...this.state,
      status: reveal ? "reveal_original" : "overlay_active",
      overlay_visible: !reveal,
    });
  }

  stop(reason = "user_stopped"): RealtimeTexturePackSessionStateV1 {
    const sessionId = this.config?.session_id ?? this.state.session_id;
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(DESKTOP_TEXTURE_PACK_OVERLAY_CLEAR_CHANNEL);
    }
    this.destroyWindow();
    this.config = null;
    this.lastProjectionCompletedAt = 0;
    return this.publish({
      ...buildRealtimeTexturePackSessionState({ sessionId, status: "stopped" }),
      failure_reason: reason,
    });
  }

  private async ensureWindow(): Promise<TexturePackOverlayWindow> {
    if (this.window && !this.window.isDestroyed()) return this.window;
    const window = this.dependencies.createWindow();
    this.window = window;
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    this.applySafety(window);
    await window.loadURL(overlayUrl);
    return window;
  }

  private applySafety(window: TexturePackOverlayWindow): void {
    window.setFocusable(false);
    window.setIgnoreMouseEvents(true, { forward: true });
    window.setSkipTaskbar(true);
    window.setAlwaysOnTop(true, "screen-saver");
  }

  private destroyWindow(): void {
    if (this.window && !this.window.isDestroyed()) this.window.destroy();
    this.window = null;
  }

  private publish(
    state: RealtimeTexturePackSessionStateV1,
  ): RealtimeTexturePackSessionStateV1 {
    this.state = Object.freeze({ ...state });
    this.dependencies.publishState?.(this.state);
    return this.state;
  }
}
