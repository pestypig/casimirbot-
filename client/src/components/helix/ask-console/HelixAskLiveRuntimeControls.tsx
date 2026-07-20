import React, { useEffect, useState } from "react";
import {
  Activity,
  CircleCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  Mic,
  Radio,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixRealtimeGroundedRelayStatusV1 } from "@shared/contracts/helix-realtime-worker-relay.v1";
import {
  buildInactiveHelixLiveRuntimeAgentControlState,
  resolveHelixLiveRuntimeAuthority,
  resolveHelixLiveRuntimeMode,
  type HelixLiveRuntimeAgentAuthority,
  type HelixLiveRuntimeAgentControlState,
  type HelixLiveRuntimeAgentMode,
} from "@shared/helix-live-runtime-agent";
import {
  labelForHelixAskLiveRuntimeLifecycleState,
  labelForHelixAskLiveRuntimeTransportControllerState,
  type HelixAskLiveRuntimeLifecycleState,
  type HelixAskLiveRuntimeTransportControllerState,
} from "./HelixAskLiveRuntimeLifecycle";
import { useHelixAskLiveRuntimeSession } from "./useHelixAskLiveRuntimeSession";

export type HelixAskLiveRuntimeControlsModel = {
  visible: boolean;
  locked: boolean;
  lockReason: string | null;
  modeLabel: string;
  authorityLabel: string;
  lifecycleState: HelixAskLiveRuntimeLifecycleState;
  lifecycleLabel: string;
  transportControllerState: HelixAskLiveRuntimeTransportControllerState;
  transportControllerLabel: string;
  transportBlockedReason: string | null;
  selectedRuntimeAgentProvider: HelixAgentRuntimeId;
  controlState: HelixLiveRuntimeAgentControlState;
};

export type HelixAskLiveRuntimeToolbarBridge = {
  engaged: boolean;
  active: boolean;
  microphoneEnabled: boolean;
  microphoneToggleDisabled: boolean;
  toggleMicrophone: () => void;
  visualInputEnabled: boolean;
  visualInputToggleDisabled: boolean;
  toggleVisualInput: () => void;
};

const labelForMode = (mode: HelixLiveRuntimeAgentMode): string => {
  switch (mode) {
    case "live_voice":
      return "Live Voice";
    case "live_voice_mini":
      return "Live Mini";
    case "live_transcription":
      return "Transcript";
    case "live_translation":
      return "Translate";
    case "off":
      return "Live Off";
  }
};

const labelForAuthority = (authority: HelixLiveRuntimeAgentAuthority): string => {
  switch (authority) {
    case "suggest_actions":
      return "Suggest";
    case "execute_safe_actions":
      return "Safe Act";
    case "execute_confirmed_actions":
      return "Confirm";
    case "observe_only":
      return "Observe";
  }
};

export const describeHelixAskWorkerRelayStatus = (
  status: HelixRealtimeGroundedRelayStatusV1 | null,
): { label: string; icon: "checking" | "ready" | "speaking" } | null => {
  if (status === "worker_running") {
    return { label: "Checking workspace", icon: "checking" };
  }
  if (
    status === "result_ready" ||
    status === "relay_queued_busy" ||
    status === "response_requested"
  ) {
    return { label: "Result ready", icon: "ready" };
  }
  if (status === "speaking") {
    return { label: "Speaking result", icon: "speaking" };
  }
  return null;
};

export function buildHelixAskLiveRuntimeControlsModel(args: {
  accountPolicy?: Pick<
    HelixAccountCapabilityPolicy,
    "account_type" | "feature_flags" | "locked_features"
  > | null;
  mode?: unknown;
  authority?: unknown;
  lifecycleState?: HelixAskLiveRuntimeLifecycleState;
  transportControllerState?: HelixAskLiveRuntimeTransportControllerState;
  transportBlockedReason?: string | null;
  selectedRuntimeAgentProvider?: HelixAgentRuntimeId;
}): HelixAskLiveRuntimeControlsModel {
  const accountPolicy = args.accountPolicy ?? null;
  const developerUnlocked =
    accountPolicy?.account_type === "developer" &&
    accountPolicy.locked_features?.includes("runtime_agent_controls") !== true;
  const visible = developerUnlocked;
  const mode = resolveHelixLiveRuntimeMode(args.mode);
  const authority = resolveHelixLiveRuntimeAuthority(args.authority);
  const lifecycleState = args.lifecycleState ?? "off";
  const transportControllerState = args.transportControllerState ?? "idle";
  return {
    visible,
    locked: !developerUnlocked,
    lockReason: developerUnlocked ? null : "developer_runtime_agent_controls_required",
    modeLabel: labelForMode(mode),
    authorityLabel: labelForAuthority(authority),
    lifecycleState,
    lifecycleLabel: labelForHelixAskLiveRuntimeLifecycleState(lifecycleState),
    transportControllerState,
    transportControllerLabel:
      labelForHelixAskLiveRuntimeTransportControllerState(transportControllerState),
    transportBlockedReason: args.transportBlockedReason ?? null,
    selectedRuntimeAgentProvider: args.selectedRuntimeAgentProvider ?? "helix",
    controlState: buildInactiveHelixLiveRuntimeAgentControlState({
      runtime_agent_mode: mode,
      runtime_agent_authority: authority,
    }),
  };
}

export function HelixAskLiveRuntimeControls({
  model,
  onToolbarBridgeChange,
}: {
  model: HelixAskLiveRuntimeControlsModel;
  onToolbarBridgeChange?: (bridge: HelixAskLiveRuntimeToolbarBridge | null) => void;
}) {
  if (!model.visible) return null;
  return (
    <HelixAskVisibleLiveRuntimeControls
      model={model}
      onToolbarBridgeChange={onToolbarBridgeChange}
    />
  );
}

function HelixAskVisibleLiveRuntimeControls({
  model,
  onToolbarBridgeChange,
}: {
  model: HelixAskLiveRuntimeControlsModel;
  onToolbarBridgeChange?: (bridge: HelixAskLiveRuntimeToolbarBridge | null) => void;
}) {
  const [mode, setMode] = useState<HelixLiveRuntimeAgentMode>(
    model.controlState.runtime_agent_mode,
  );
  const [authority, setAuthority] = useState<HelixLiveRuntimeAgentAuthority>(
    model.controlState.runtime_agent_authority,
  );
  const runtime = useHelixAskLiveRuntimeSession({
    enabled: !model.locked,
    mode,
    authority,
    selectedRuntimeAgentProvider: model.selectedRuntimeAgentProvider,
    initialLifecycleState: model.lifecycleState,
    initialTransportState: model.transportControllerState,
  });
  const modeOptions: HelixLiveRuntimeAgentMode[] = [
    "live_voice",
    "live_voice_mini",
  ];
  const authorityOptions: HelixLiveRuntimeAgentAuthority[] = [
    "observe_only",
    "suggest_actions",
  ];
  const selectionDisabled = model.locked || runtime.active || runtime.lifecycleState === "requesting";
  const startDisabled = model.locked || runtime.lifecycleState === "requesting" || runtime.transportState === "connecting";
  const engaged = runtime.active ||
    runtime.lifecycleState === "requesting" ||
    runtime.lifecycleState === "stopping" ||
    runtime.transportState === "connecting" ||
    runtime.transportState === "active";
  const workerRelayIndicator = describeHelixAskWorkerRelayStatus(runtime.workerRelayStatus);
  useEffect(() => {
    if (!onToolbarBridgeChange) return;
    onToolbarBridgeChange({
      engaged,
      active: runtime.active,
      microphoneEnabled: runtime.microphoneEnabled,
      microphoneToggleDisabled: !runtime.active,
      toggleMicrophone: () => {
        runtime.setMicrophoneEnabled(!runtime.microphoneEnabled);
      },
      visualInputEnabled: runtime.visualInputEnabled,
      visualInputToggleDisabled: !runtime.active,
      toggleVisualInput: () => {
        runtime.setVisualInputEnabled(!runtime.visualInputEnabled);
      },
    });
    return () => onToolbarBridgeChange(null);
  }, [
    engaged,
    onToolbarBridgeChange,
    runtime.active,
    runtime.microphoneEnabled,
    runtime.setMicrophoneEnabled,
    runtime.setVisualInputEnabled,
    runtime.visualInputEnabled,
  ]);
  const cycleMode = () => {
    const index = modeOptions.indexOf(mode);
    setMode(modeOptions[(index + 1) % modeOptions.length]);
  };
  const cycleAuthority = () => {
    const index = authorityOptions.indexOf(authority);
    setAuthority(authorityOptions[(index + 1) % authorityOptions.length]);
  };
  return (
    <>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime agent mode"
        title={model.lockReason ?? "Live runtime agent mode"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-sky-300/45 bg-sky-400/12 px-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70 disabled:opacity-60"
        disabled={selectionDisabled}
        onClick={cycleMode}
      >
        <Radio className="h-4 w-4" />
        <span>{labelForMode(mode)}</span>
      </button>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime agent authority"
        title={model.lockReason ?? "Live runtime agent authority"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-emerald-300/45 bg-emerald-400/12 px-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 disabled:opacity-60"
        disabled={selectionDisabled}
        onClick={cycleAuthority}
      >
        <ShieldCheck className="h-4 w-4" />
        <span>{labelForAuthority(authority)}</span>
      </button>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime agent lifecycle"
        title={model.lockReason ?? runtime.error ?? "Start or stop live runtime agent"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-violet-300/45 bg-violet-400/12 px-3 text-sm font-medium text-violet-100 transition hover:bg-violet-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70 disabled:opacity-60"
        disabled={startDisabled}
        data-lifecycle-state={runtime.lifecycleState}
        onClick={() => void (runtime.active ? runtime.stop() : runtime.start())}
      >
        <Activity className="h-4 w-4" />
        <span>{labelForHelixAskLiveRuntimeLifecycleState(runtime.lifecycleState)}</span>
      </button>
      {runtime.active ? (
        <>
          <button
            type="button"
            data-helix-ask-action-item="true"
            aria-label={runtime.microphoneEnabled
              ? "Disable Live Voice microphone"
              : "Enable Live Voice microphone"}
            aria-pressed={runtime.microphoneEnabled}
            title={runtime.microphoneEnabled
              ? "Disable Live Voice microphone"
              : "Enable Live Voice microphone"}
            className={`inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 ${
              runtime.microphoneEnabled
                ? "border-emerald-300/55 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            }`}
            data-live-microphone-enabled={runtime.microphoneEnabled ? "true" : "false"}
            onClick={() => runtime.setMicrophoneEnabled(!runtime.microphoneEnabled)}
          >
            <Mic className={`h-4 w-4 ${runtime.microphoneEnabled ? "animate-pulse" : ""}`} />
            <span>{runtime.microphoneEnabled ? "Mic On" : "Mic Off"}</span>
          </button>
          <button
            type="button"
            data-helix-ask-action-item="true"
            data-live-visual-input-enabled={runtime.visualInputEnabled ? "true" : "false"}
            aria-label={runtime.visualInputEnabled
              ? "Stop sharing visual frames with GPT Live"
              : "Share visual frames with GPT Live"}
            aria-pressed={runtime.visualInputEnabled}
            title={runtime.visualInputError ?? (runtime.visualInputEnabled
              ? `GPT Live receives frames from the active Screen or Camera source (${runtime.visualInputFrameCount} sent)`
              : "Route the active Screen or Camera source to GPT Live")}
            className={`inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 ${
              runtime.visualInputEnabled
                ? "border-cyan-300/55 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20"
                : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
            }`}
            onClick={() => runtime.setVisualInputEnabled(!runtime.visualInputEnabled)}
          >
            {runtime.visualInputEnabled ? (
              <Eye className="h-4 w-4 animate-pulse" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            <span>{runtime.visualInputEnabled ? "Vision On" : "Vision Off"}</span>
          </button>
        </>
      ) : null}
      {workerRelayIndicator ? (
        <span
          role="status"
          aria-live="polite"
          data-helix-ask-worker-relay-status={runtime.workerRelayStatus}
          className="inline-flex h-10 shrink-0 snap-center items-center gap-2 border-l border-white/15 px-3 text-sm font-medium text-slate-100"
        >
          {workerRelayIndicator.icon === "checking" ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-cyan-200" />
          ) : workerRelayIndicator.icon === "speaking" ? (
            <Volume2 className="h-4 w-4 text-emerald-200" />
          ) : (
            <CircleCheck className="h-4 w-4 text-amber-200" />
          )}
          <span>{workerRelayIndicator.label}</span>
        </span>
      ) : null}
    </>
  );
}
