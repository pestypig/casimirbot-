import React, { useEffect, useRef, useState } from "react";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  REALTIME_TEXTURE_PACK_BASELINE_FPS,
  REALTIME_TEXTURE_PACK_BASELINE_HEIGHT,
  REALTIME_TEXTURE_PACK_BASELINE_WIDTH,
  REALTIME_TEXTURE_PACK_PRESETS,
  buildRealtimeTexturePackSessionState,
  type RealtimeTexturePackConfigV1,
  type RealtimeTexturePackPresetId,
  type RealtimeTexturePackProjectionFrameV1,
  type RealtimeTexturePackSessionStateV1,
} from "@shared/realtime-texture-pack";
import {
  REALTIME_TEXTURE_PACK_HARNESS_ACTIONS,
  type RealtimeTexturePackHarnessAction,
  type RealtimeTexturePackHarnessCommand,
} from "@shared/realtime-texture-pack-harness";
import {
  createRealtimeTexturePackPreviewController,
  type RealtimeTexturePackPreviewController,
} from "@/lib/helix/realtimeTexturePack";
import {
  HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT,
  fetchAccountCapabilityPolicy,
  readCachedAccountCapabilityPolicy,
} from "@/lib/workstation/accountCapabilityPolicy";

export default function RealtimeTexturePackControls() {
  const [accountPolicy, setAccountPolicy] = useState<HelixAccountCapabilityPolicy | null>(() =>
    readCachedAccountCapabilityPolicy(),
  );
  const [presetId, setPresetId] = useState<RealtimeTexturePackPresetId>("playable");
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [projection, setProjection] = useState<RealtimeTexturePackProjectionFrameV1 | null>(null);
  const [sessionState, setSessionState] = useState<RealtimeTexturePackSessionStateV1>(() =>
    buildRealtimeTexturePackSessionState({ sessionId: "texture-session:unstarted" }),
  );
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayFailure, setOverlayFailure] = useState<string | null>(null);
  const [agentHarnessEnabled, setAgentHarnessEnabled] = useState(false);
  const [agentAllowedActions, setAgentAllowedActions] = useState<RealtimeTexturePackHarnessAction[]>(
    () => [...REALTIME_TEXTURE_PACK_HARNESS_ACTIONS],
  );
  const [agentHarnessStatus, setAgentHarnessStatus] = useState("Off — user control only");
  const mountedRef = useRef(true);
  const controllerRef = useRef<RealtimeTexturePackPreviewController | null>(null);
  const configRef = useRef<RealtimeTexturePackConfigV1 | null>(null);
  const overlayVisibleRef = useRef(false);
  const handledCommandsRef = useRef(new Set<string>());

  const postHarness = async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/agi/realtime-texture-pack/harness/${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : `harness_${path}_failed`);
    return payload;
  };

  if (!controllerRef.current) {
    controllerRef.current = createRealtimeTexturePackPreviewController({
      onState: (state) => {
        if (mountedRef.current) {
          setSessionState(state);
          if (!state.capture_active && overlayVisibleRef.current) {
            overlayVisibleRef.current = false;
            setOverlayVisible(false);
            void window.casimirDesktop?.stopRealtimeTexturePackOverlay?.();
          }
          if (!state.capture_active && configRef.current?.session_id) {
            setAgentHarnessEnabled(false);
            setAgentHarnessStatus("Off — capture inactive");
            void postHarness("lease", {
              operation: "disable",
              session_id: configRef.current.session_id,
            }).catch(() => undefined);
          }
        }
      },
      onConfig: (config) => {
        configRef.current = config;
      },
      onFrame: (frame) => {
        if (mountedRef.current) setProjection(frame);
        if (overlayVisibleRef.current) {
          void window.casimirDesktop?.updateRealtimeTexturePackFrame?.(frame)
            .then((candidate) => {
              if (
                mountedRef.current &&
                candidate &&
                typeof candidate === "object" &&
                "overlay_visible" in candidate &&
                candidate.overlay_visible === false
              ) {
                overlayVisibleRef.current = false;
                setOverlayVisible(false);
              }
            })
            .catch((error) => {
              if (mountedRef.current) {
                setOverlayFailure(error instanceof Error ? error.message : "overlay_frame_failed");
              }
            });
        }
      },
    });
  }

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void fetchAccountCapabilityPolicy()
        .then((policy) => {
          if (!cancelled) setAccountPolicy(policy);
        })
        .catch(() => {
          if (!cancelled) setAccountPolicy(readCachedAccountCapabilityPolicy());
        });
    };
    refresh();
    window.addEventListener(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, refresh);
    };
  }, []);

  useEffect(() => () => {
    mountedRef.current = false;
    const sessionId = configRef.current?.session_id;
    if (sessionId) void postHarness("lease", { operation: "disable", session_id: sessionId }).catch(() => undefined);
    controllerRef.current?.stop("panel_unmounted");
    void window.casimirDesktop?.stopRealtimeTexturePackOverlay?.();
  }, []);

  const isDeveloper = accountPolicy?.account_type === "developer";
  const captureActive = sessionState.capture_active;
  const nativeOverlayAvailable =
    typeof window.casimirDesktop?.showRealtimeTexturePackOverlay === "function" &&
    typeof window.casimirDesktop?.updateRealtimeTexturePackFrame === "function" &&
    typeof window.casimirDesktop?.revealRealtimeTexturePackOriginal === "function";

  const handleStart = async () => {
    if (!isDeveloper || busy) return;
    setBusy(true);
    setProjection(null);
    configRef.current = null;
    setOverlayFailure(null);
    try {
      await controllerRef.current?.start({ presetId, customPrompt });
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleStop = (revokeHarness = true) => {
    const sessionId = configRef.current?.session_id;
    if (revokeHarness && sessionId) void postHarness("lease", { operation: "disable", session_id: sessionId }).catch(() => undefined);
    setAgentHarnessEnabled(false);
    setAgentHarnessStatus("Off — capture stopped");
    controllerRef.current?.stop("user_stopped");
    setProjection(null);
    configRef.current = null;
    overlayVisibleRef.current = false;
    setOverlayVisible(false);
    void window.casimirDesktop?.stopRealtimeTexturePackOverlay?.();
  };

  const handleShowOverlay = async () => {
    const config = configRef.current;
    const bridge = window.casimirDesktop;
    if (!config || !bridge?.showRealtimeTexturePackOverlay || !nativeOverlayAvailable) return false;
    try {
      setOverlayFailure(null);
      await bridge.showRealtimeTexturePackOverlay(config);
      overlayVisibleRef.current = true;
      setOverlayVisible(true);
      if (projection) await bridge.updateRealtimeTexturePackFrame?.(projection);
      return true;
    } catch (error) {
      setOverlayFailure(error instanceof Error ? error.message : "overlay_show_failed");
      return false;
    }
  };

  const handleRevealOriginal = async () => {
    try {
      await window.casimirDesktop?.revealRealtimeTexturePackOriginal?.(true);
      overlayVisibleRef.current = false;
      setOverlayVisible(false);
      return true;
    } catch (error) {
      setOverlayFailure(error instanceof Error ? error.message : "overlay_reveal_failed");
      return false;
    }
  };

  useEffect(() => {
    if (!agentHarnessEnabled || !captureActive || !configRef.current) return;
    let cancelled = false;
    const sessionId = configRef.current.session_id;
    const clientState = () => ({
      capture_active: controllerRef.current?.getState().capture_active === true,
      overlay_visible: overlayVisibleRef.current,
      session_status: controllerRef.current?.getState().status ?? "unknown",
    });
    const acknowledge = async (
      command: RealtimeTexturePackHarnessCommand,
      outcome: "completed" | "blocked",
      failureReason?: string,
    ) => postHarness("ack", {
      session_id: sessionId,
      command_id: command.command_id,
      outcome,
      failure_reason: failureReason ?? null,
    });
    const execute = async (command: RealtimeTexturePackHarnessCommand) => {
      if (handledCommandsRef.current.has(command.command_id)) return;
      handledCommandsRef.current.add(command.command_id);
      let completed = false;
      if (command.action === "show_overlay") completed = await handleShowOverlay();
      if (command.action === "reveal_original") completed = await handleRevealOriginal();
      if (command.action === "stop") {
        handleStop(false);
        completed = true;
      }
      await acknowledge(command, completed ? "completed" : "blocked", completed ? undefined : "local_control_unavailable");
      if (command.action === "stop") {
        void postHarness("lease", { operation: "disable", session_id: sessionId }).catch(() => undefined);
      }
      setAgentHarnessStatus(completed ? `Agent command completed: ${command.action}` : `Agent command blocked: ${command.action}`);
    };
    const poll = async () => {
      try {
        const payload = await postHarness("poll", {
          session_id: sessionId,
          allowed_actions: agentAllowedActions,
          client_state: clientState(),
        });
        if (cancelled) return;
        setAgentHarnessStatus("On — waiting for governed commands");
        const commands = Array.isArray(payload.commands)
          ? payload.commands.filter((entry): entry is RealtimeTexturePackHarnessCommand => Boolean(
            entry && typeof entry === "object" && typeof (entry as RealtimeTexturePackHarnessCommand).command_id === "string",
          ))
          : [];
        for (const command of commands) await execute(command);
      } catch (error) {
        if (!cancelled) setAgentHarnessStatus(`Control unavailable: ${error instanceof Error ? error.message : "poll_failed"}`);
      }
    };
    void poll();
    const interval = window.setInterval(() => void poll(), 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [agentAllowedActions, agentHarnessEnabled, captureActive]);

  const setHarnessEnabled = (enabled: boolean) => {
    if (enabled && !captureActive) return;
    setAgentHarnessEnabled(enabled);
    setAgentHarnessStatus(enabled ? "Enabling…" : "Off — user control only");
    if (!enabled && configRef.current?.session_id) {
      void postHarness("lease", { operation: "disable", session_id: configRef.current.session_id }).catch(() => undefined);
    }
  };

  const toggleAgentAction = (action: RealtimeTexturePackHarnessAction) => {
    setAgentAllowedActions((current) => current.includes(action)
      ? current.filter((entry) => entry !== action)
      : [...current, action]);
  };

  if (!isDeveloper) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6" data-testid="realtime-texture-pack-locked">
        <div className="max-w-lg rounded-xl border border-amber-300/20 bg-amber-950/20 p-5 text-sm text-amber-100">
          <div className="font-semibold">Realtime Texture Pack is reserved for developer mode.</div>
          <p className="mt-2 text-amber-100/70">
            The ordinary Image Lens inspection surface remains available. This low-rate overlay experiment has no public account authority.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(270px,360px)_minmax(0,1fr)]" data-testid="realtime-texture-pack-controls">
      <section className="space-y-4 rounded-xl border border-cyan-300/15 bg-slate-900/70 p-4">
        <div>
          <div className="text-sm font-semibold text-cyan-100">Realtime Texture Pack</div>
          <div className="mt-1 text-xs text-slate-400">Non-authoritative visual projection</div>
        </div>

        <div className="rounded-lg border border-emerald-300/15 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-100">
          Local passthrough — no image API connected
        </div>

        <label className="block text-xs text-slate-300">
          Style preset
          <select data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.texture-style-preset" data-helix-interaction-kind="configure" data-helix-authority-state="client_local"
            aria-label="Texture style preset"
            value={presetId}
            onChange={(event) => setPresetId(event.target.value as RealtimeTexturePackPresetId)}
            disabled={captureActive || busy}
            className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {REALTIME_TEXTURE_PACK_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-slate-300">
          Custom prompt (optional)
          <textarea data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.texture-custom-prompt" data-helix-interaction-kind="configure" data-helix-authority-state="client_local"
            aria-label="Texture custom prompt"
            value={customPrompt}
            onChange={(event) => setCustomPrompt(event.target.value.slice(0, 2_000))}
            disabled={captureActive || busy}
            rows={4}
            placeholder="Example: moonlit watercolor ruins"
            className="mt-1 w-full resize-none rounded border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <div className="text-slate-500">Transform rate</div>
            <div className="mt-1 text-slate-100">{REALTIME_TEXTURE_PACK_BASELINE_FPS} fps</div>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <div className="text-slate-500">Source frame</div>
            <div className="mt-1 text-slate-100">{REALTIME_TEXTURE_PACK_BASELINE_WIDTH} × {REALTIME_TEXTURE_PACK_BASELINE_HEIGHT}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.void-handle-start" data-helix-interaction-kind="act" data-helix-authority-state="client_local"
            type="button"
            onClick={() => void handleStart()}
            disabled={busy || captureActive}
            className="rounded bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Opening picker…" : "Choose game/window"}
          </button>
          <button data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.show-overlay" data-helix-interaction-kind="navigate" data-helix-authority-state="client_local"
            type="button"
            onClick={() => void handleShowOverlay()}
            disabled={!nativeOverlayAvailable || !captureActive || !configRef.current || overlayVisible}
            title={nativeOverlayAvailable ? "Show the click-through native overlay" : "Requires the CasimirBot desktop app"}
            className="rounded border border-white/15 px-3 py-2 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Show overlay
          </button>
          <button data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.hide-the-projection-while-capture-continues" data-helix-interaction-kind="act" data-helix-authority-state="client_local"
            type="button"
            onClick={() => void handleRevealOriginal()}
            disabled={!nativeOverlayAvailable || !overlayVisible}
            title="Hide the projection while capture continues"
            className="rounded border border-white/15 px-3 py-2 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reveal original
          </button>
          <button data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.stop" data-helix-interaction-kind="act" data-helix-authority-state="client_local"
            type="button"
            onClick={() => handleStop()}
            disabled={!captureActive && sessionState.status !== "degraded"}
            className="rounded border border-rose-300/30 px-3 py-2 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Stop
          </button>
        </div>

        <div className="rounded-lg border border-violet-300/20 bg-violet-950/20 p-3" data-testid="realtime-texture-pack-agent-harness">
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-violet-100">
            <span>Agent harness control</span>
            <input data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.enable-agent-harness-control" data-helix-interaction-kind="configure" data-helix-authority-state="client_local"
              type="checkbox"
              aria-label="Enable agent harness control"
              checked={agentHarnessEnabled}
              disabled={!captureActive}
              onChange={(event) => setHarnessEnabled(event.target.checked)}
            />
          </label>
          <p className="mt-1 text-[11px] text-violet-100/65">
            Session-only. The agent cannot start capture or choose a source.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-300">
            {REALTIME_TEXTURE_PACK_HARNESS_ACTIONS.map((action) => (
              <label key={action} className="flex items-center gap-1 rounded border border-white/10 px-1.5 py-1">
                <input data-helix-control-id="workstation.panel.image-lens.realtime-texture-pack-controls.input" data-helix-interaction-kind="configure" data-helix-authority-state="client_local"
                  type="checkbox"
                  checked={agentAllowedActions.includes(action)}
                  disabled={!agentHarnessEnabled}
                  onChange={() => toggleAgentAction(action)}
                />
                <span>{action === "show_overlay" ? "Show" : action === "reveal_original" ? "Reveal" : "Stop"}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-slate-400" data-testid="realtime-texture-pack-agent-harness-status">
            {agentHarnessStatus}
          </div>
        </div>
      </section>

      <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10 px-4 py-3 text-xs">
          <span className="text-slate-400">State <strong className="font-medium text-slate-100">{sessionState.status}</strong></span>
          <span className="text-slate-400">Age <strong className="font-medium text-slate-100">{sessionState.frame_age_ms ?? "—"} ms</strong></span>
          <span className="text-slate-400">Dropped <strong className="font-medium text-slate-100">{sessionState.dropped_frame_count}</strong></span>
          <span className="text-slate-400">Provider <strong className="font-medium text-slate-100">{sessionState.provider_state}</strong></span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          {projection ? (
            <img
              src={projection.projection_image_data_url}
              alt="Realtime Texture Pack local preview"
              className="max-h-full max-w-full rounded border border-cyan-300/20 object-contain [image-rendering:auto]"
            />
          ) : (
            <div className="max-w-md text-center text-sm text-slate-500">
              Choose a game or application window. Whole-display capture is rejected so the future overlay cannot capture itself recursively.
            </div>
          )}
        </div>
        <div className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
          Projection only. Generated or passthrough pixels never enter Image Lens evidence receipts.
          {sessionState.failure_reason ? ` Last failure: ${sessionState.failure_reason}.` : ""}
          {overlayFailure ? ` Overlay failure: ${overlayFailure}.` : ""}
        </div>
      </section>
    </div>
  );
}
