import React from "react";
import { Activity, Radio, ShieldCheck } from "lucide-react";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
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
  controlState: HelixLiveRuntimeAgentControlState;
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
}): HelixAskLiveRuntimeControlsModel {
  const accountPolicy = args.accountPolicy ?? null;
  const developerUnlocked =
    accountPolicy?.account_type === "developer" &&
    accountPolicy.locked_features?.includes("runtime_agent_controls") !== true;
  const visible =
    developerUnlocked ||
    accountPolicy?.locked_features?.includes("runtime_agent_controls") === true ||
    accountPolicy?.feature_flags?.includes("runtime_agent_controls") === true;
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
    controlState: buildInactiveHelixLiveRuntimeAgentControlState({
      runtime_agent_mode: mode,
      runtime_agent_authority: authority,
    }),
  };
}

export function HelixAskLiveRuntimeControls({
  model,
}: {
  model: HelixAskLiveRuntimeControlsModel;
}) {
  if (!model.visible) return null;
  const disabled = model.locked || model.controlState.session_status !== "idle";
  return (
    <>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime agent mode"
        title={model.lockReason ?? "Live runtime agent mode"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-sky-300/45 bg-sky-400/12 px-3 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70 disabled:opacity-60"
        disabled={disabled}
      >
        <Radio className="h-4 w-4" />
        <span>{model.modeLabel}</span>
      </button>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime agent authority"
        title={model.lockReason ?? "Live runtime agent authority"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-emerald-300/45 bg-emerald-400/12 px-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 disabled:opacity-60"
        disabled={disabled}
      >
        <ShieldCheck className="h-4 w-4" />
        <span>{model.authorityLabel}</span>
      </button>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime agent lifecycle"
        title={model.lockReason ?? "Live runtime agent lifecycle"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-violet-300/45 bg-violet-400/12 px-3 text-sm font-medium text-violet-100 transition hover:bg-violet-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70 disabled:opacity-60"
        disabled={disabled}
        data-lifecycle-state={model.lifecycleState}
      >
        <Activity className="h-4 w-4" />
        <span>{model.lifecycleLabel}</span>
      </button>
      <button
        type="button"
        data-helix-ask-action-item="true"
        aria-label="Live runtime transport controller"
        title={model.lockReason ?? model.transportBlockedReason ?? "Live runtime transport controller"}
        className="inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border border-amber-300/45 bg-amber-400/12 px-3 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:opacity-60"
        disabled={disabled}
        data-transport-controller-state={model.transportControllerState}
        data-transport-execution-attempted="false"
      >
        <Activity className="h-4 w-4" />
        <span>{model.transportControllerLabel}</span>
      </button>
    </>
  );
}
