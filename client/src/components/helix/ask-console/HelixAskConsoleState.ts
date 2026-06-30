import type { PanelDefinition } from "@/lib/desktop/panelRegistry";
import type { HelixWorkstationAction } from "@/lib/workstation/workstationActionContract";

export const HELIX_ASK_CONSOLE_RECROWN_VERSION = "ask-console-recrown-v1";

export const HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS = [
  "prompt_input",
  "runtime_picker",
  "active_docs_context_handoff",
  "request_envelope",
  "submit_stream_handling",
  "latest_turn_selection",
  "final_answer_rendering",
  "workstation_trace_rows",
  "copy_final",
  "debug_copy_export",
  "read_aloud",
  "chat_session_persistence",
] as const;

export type HelixAskConsoleLiveSurfaceRequirement =
  (typeof HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS)[number];

export type HelixAskConsoleProps = {
  contextId: string;
  className?: string;
  maxWidthClassName?: string;
  onOpenPanel?: (panelId: PanelDefinition["id"]) => void;
  onRunWorkstationAction?: (action: HelixWorkstationAction) => void;
  onOpenConversation?: (sessionId: string) => void;
  placeholder?: string;
  layoutVariant?: "hero" | "dock";
  replyListClassName?: string;
};

export type HelixAskConsoleLegacyBridgeStatus = {
  bridge: "helix_ask_pill_legacy_runtime_bridge";
  reason: "behavior_sensitive_paths_not_yet_recrowned";
  recrownedLiveSurfaceRequirements: readonly HelixAskConsoleLiveSurfaceRequirement[];
  remainingBehaviorSensitivePaths: readonly HelixAskConsoleLiveSurfaceRequirement[];
};

export const HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS: HelixAskConsoleLegacyBridgeStatus = {
  bridge: "helix_ask_pill_legacy_runtime_bridge",
  reason: "behavior_sensitive_paths_not_yet_recrowned",
  recrownedLiveSurfaceRequirements: [
    "prompt_input",
    "active_docs_context_handoff",
    "request_envelope",
    "runtime_picker",
    "latest_turn_selection",
    "final_answer_rendering",
    "workstation_trace_rows",
    "copy_final",
    "debug_copy_export",
    "read_aloud",
  ],
  remainingBehaviorSensitivePaths: ["submit_stream_handling", "chat_session_persistence"],
};
