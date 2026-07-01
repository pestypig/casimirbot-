export type HelixAskLegacyConsoleSliceClassification =
  | "live_day_to_day_must_move"
  | "pure_display_already_recrowned"
  | "behavior_sensitive_quarantined"
  | "unknown_trap_door_quarantined"
  | "obsolete_requires_evidence_before_delete";

export type HelixAskLegacyConsoleSlice = {
  key: string;
  classification: HelixAskLegacyConsoleSliceClassification;
  source: "HelixAskPill.tsx" | "ask-console";
  evidence: string;
};

export const HELIX_ASK_LEGACY_CONSOLE_ACTIVE_PATH = [
  "HelixAskConsole",
  "HelixAskConsoleRuntimeShell",
  "HelixAskLegacyRuntimeBridge",
  "HelixAskPill",
] as const;

export const HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT = {
  file: "client/src/components/helix/HelixAskPill.tsx",
  lineCountAtInventory: 29412,
  exportedComponentStartsAtLine: 10818,
  liveRenderSliceStartsAtLine: 28768,
  liveLegacyConsoleViewStartsAtLine: 28783,
  inventoryReason:
    "The active bridge still imports the whole legacy file, but the visible console render path is concentrated near the bottom and now enters the recrowned legacy console view before composing recrowned ask-console display owners.",
} as const;

export const HELIX_ASK_LEGACY_CONSOLE_SLICES = [
  {
    key: "legacy_active_bridge",
    classification: "live_day_to_day_must_move",
    source: "HelixAskPill.tsx",
    evidence:
      "HelixAskLegacyRuntimeBridge currently returns <HelixAskPill {...props} />, so the whole file remains active through the default legacy bridge.",
  },
  {
    key: "visible_console_layout",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The bottom render slice enters HelixAskLegacyConsoleView, which delegates to HelixAskConsoleRuntimeLayout and composes HelixAskSurfaceFrame, HelixAskSurfaceComposerPanel, HelixAskSurfaceSupplementStack, HelixAskTurnList, and HelixAskDebugDrawer.",
  },
  {
    key: "prompt_composer_surface",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The live render slice uses HelixAskComposerTextarea, HelixAskComposerSubmitButton, HelixAskRuntimePicker, HelixAskMoodAvatar, and HelixAskActionToolbar.",
  },
  {
    key: "reply_projection_surface",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The live render slice uses HelixAskReplyTurn, HelixAskFinalAnswer, HelixAskActiveTurnStreamPanel, and latest-turn binding helpers.",
  },
  {
    key: "operator_supplement_surface",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The live render slice uses extracted goal, steering queue, attachment, context capsule, situation room, observer, voice status, and voice confirmation components.",
  },
  {
    key: "request_and_stream_lifecycle",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Submit, stream ingress, stale completion, active turn ids, and final response projection still live in HelixAskPill and must move only with parity tests.",
  },
  {
    key: "active_doc_and_workspace_context",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Docs-viewer URL/store reads, workspace snapshots, route metadata, and request-envelope handoff remain behavior-sensitive until HASK-BSQ-001 parity is proven.",
  },
  {
    key: "latest_debug_copy_and_read_aloud_binding",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Clipboard, backend debug-export materialization, rendered-button fallback, selected debug state, and TTS execution still bind from legacy state.",
  },
  {
    key: "voice_capture_and_command_runtime",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "MediaRecorder setup, STT dispatch, command confirmation, auto-dispatch, and voice steering remain active runtime behavior in the legacy file.",
  },
  {
    key: "legacy_fallbacks_and_dev_branches",
    classification: "unknown_trap_door_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Legacy fallback answer cleanup, local Ask fallback paths, prompt classifiers, and older runtime branches must be audited before copying or deleting.",
  },
] as const satisfies readonly HelixAskLegacyConsoleSlice[];

export const HELIX_ASK_LEGACY_CONSOLE_SLICE_PROGRESS = {
  activeDefaultImplementation: "legacy_bridge",
  replacementTarget: "legacy_equivalent_recrowned_runtime",
  simplifiedMinimalShellIsDefault: false,
  bridgeReplacementReady: false,
  liveDayToDaySliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "live_day_to_day_must_move",
  ).length,
  pureDisplayRecrownedSliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "pure_display_already_recrowned",
  ).length,
  behaviorSensitiveQuarantinedSliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "behavior_sensitive_quarantined",
  ).length,
  unknownTrapDoorSliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "unknown_trap_door_quarantined",
  ).length,
} as const;
