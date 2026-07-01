import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  HELIX_ASK_CONSOLE_ACTIVE_RECROWN_PHASE,
  HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_OPEN_GATES,
  HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_PROVEN_GATES,
  HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_READY,
  HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS,
  HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS,
  HELIX_ASK_CONSOLE_MINIMAL_RUNTIME_SHELL_FORBIDDEN_OWNERSHIP,
  HELIX_ASK_CONSOLE_MINIMAL_RUNTIME_SHELL_OWNS,
  HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_ITEMS,
  HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_OPEN_ITEMS,
  HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_PROVEN_ITEMS,
  HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_READY,
  HELIX_ASK_CONSOLE_LEGACY_BEHAVIOR_CLASSIFICATIONS,
  HELIX_ASK_CONSOLE_RECROWN_PHASES,
  HELIX_ASK_CONSOLE_RECROWNED_DISPLAY_OWNERS,
  HELIX_ASK_CONSOLE_RECROWNED_PURE_HELPER_REQUIREMENTS,
  HELIX_ASK_CONSOLE_RECROWN_VERSION,
  HELIX_ASK_CONSOLE_RUNTIME_SHELL_ACTIVE_OWNERSHIP,
} from "@/components/helix/ask-console/HelixAskConsoleState";
import {
  HELIX_ASK_LEGACY_CONSOLE_ACTIVE_PATH,
  HELIX_ASK_LEGACY_CONSOLE_SLICES,
  HELIX_ASK_LEGACY_CONSOLE_SLICE_PROGRESS,
  HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT,
} from "@/components/helix/ask-console/HelixAskLegacyConsoleInventory";
import {
  HELIX_ASK_CONSOLE_DOCK_REPLY_LIST_CLASS_NAME,
  HELIX_ASK_CONSOLE_HERO_REPLY_LIST_CLASS_NAME,
  buildHelixAskConsoleRuntimeBridgeProps,
} from "@/components/helix/ask-console/HelixAskConsoleRuntimeShellProps";
import { buildHelixAskFinalAnswerBlocks } from "@/components/helix/ask-console/HelixAskFinalAnswer";
import {
  buildHelixAskContextBridgeSnapshot,
  readDocPathFromDesktopUrl,
} from "@/components/helix/ask-console/HelixAskContextBridge";
import {
  buildHelixAskConsoleRequestEnvelope,
  buildHelixAskConsoleBackendTurnPayloadCore,
  buildHelixAskConsoleContextFiles,
} from "@/components/helix/ask-console/HelixAskRequestEnvelope";
import {
  buildHelixAskLatestTurnBinding,
  resolveHelixAskLatestTurnId,
} from "@/components/helix/ask-console/HelixAskLatestTurnBinding";
import {
  hasSuccessfulWorkstationTerminalTranscriptRows,
  resolveHelixAskConsoleFinalAnswerSourceLabel,
} from "@/components/helix/ask-console/HelixAskFinalProjection";
import {
  selectHelixAskConsoleTurnTranscriptRowsForStream,
  selectHelixAskConsoleWorkstationTraceRows,
} from "@/components/helix/ask-console/HelixAskWorkstationTraceRows";
import { buildHelixAskRuntimePickerModel } from "@/components/helix/ask-console/HelixAskRuntimePicker";
import {
  HELIX_ASK_CONSOLE_MAX_PROMPT_LINES,
  buildHelixAskComposerViewModel,
} from "@/components/helix/ask-console/HelixAskComposer";
import { buildHelixAskSubmitAdmission } from "@/components/helix/ask-console/HelixAskSubmitAdmission";
import {
  buildHelixAskRepliesFromChatSessionProjection,
  shouldSuppressGeneratedStagePlayMailWakeChatProjection,
} from "@/components/helix/ask-console/HelixAskChatProjection";
import {
  appendHelixAskConsoleReplyChronologically,
  resolveHelixAskConsoleReplyCanonicalKey,
  shouldKeepHelixAskConsoleReplyInBriefLane,
  shouldRenderHelixAskConsoleActiveTurnStream,
  sortHelixAskConsoleRepliesChronologically,
} from "@/components/helix/ask-console/HelixAskReplyLifecycle";
import {
  buildHelixAskConsoleChatMessagePayload,
  buildHelixAskConsoleChatTurnPayloads,
} from "@/components/helix/ask-console/HelixAskChatPersistence";
import {
  completeHelixAskMinimalRuntimeTurn,
  createHelixAskMinimalRuntimeInitialState,
  failHelixAskMinimalRuntimeTurn,
  recordHelixAskMinimalRuntimeStreamEvent,
  startHelixAskMinimalRuntimeTurn,
} from "@/components/helix/ask-console/HelixAskMinimalRuntimeLifecycle";
import { buildHelixAskMinimalRuntimeSubmitPlan } from "@/components/helix/ask-console/HelixAskMinimalRuntimeSubmitPlan";
import {
  buildHelixAskMinimalRuntimeTurnPayload,
  runHelixAskMinimalRuntimeInjectedTransport,
} from "@/components/helix/ask-console/HelixAskMinimalRuntimeTransport";
import { createHelixAskMinimalRuntimeBackendRunner } from "@/components/helix/ask-console/HelixAskMinimalRuntimeBackendRunner";
import { buildHelixAskMinimalRuntimeRepliesFromChatSession } from "@/components/helix/ask-console/HelixAskMinimalRuntimeChatSession";
import {
  buildHelixAskMinimalRuntimeControlPayload,
  buildHelixAskMinimalRuntimeDebugCopyText,
} from "@/components/helix/ask-console/HelixAskMinimalRuntimeControls";
import {
  buildHelixAskMinimalRuntimeDebugExportRequest,
  materializeHelixAskMinimalRuntimeDebugCopyText,
  readHelixAskMinimalRuntimeDebugExportRef,
} from "@/components/helix/ask-console/HelixAskMinimalRuntimeDebugExport";
import { buildHelixAskMinimalRuntimeTurnViews } from "@/components/helix/ask-console/HelixAskMinimalRuntimeTurnList";
import {
  resolveHelixAskActualAgentProviderLabel,
  resolveHelixAskModelUsageLabel,
} from "@/lib/helix/ask-agent-runtime-display";
import { buildHelixTurnTranscriptRows } from "@/lib/helix/ask-turn-transcript";

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("Helix Ask Console recrown boundary", () => {
  it("loads the rendered console crown behind the app entrypoint", async () => {
    (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";

    const module = await import("@/components/helix/ask-console");

    expect(typeof module.HelixAskConsole).toBe("function");
  }, 30000);

  it("creates the new ask-console crown modules for the live surface", () => {
    const root = path.resolve(process.cwd(), "client/src/components/helix/ask-console");
    const expectedFiles = [
      "HelixAskConsole.tsx",
      "HelixAskConsoleRuntimeShell.tsx",
      "HelixAskMinimalRuntimeShell.tsx",
      "HelixAskConsoleRuntimeShellProps.ts",
      "HelixAskBusyReasoningPanel.tsx",
      "HelixAskErrorBoundary.tsx",
      "HelixAskComposer.tsx",
      "HelixAskRuntimePicker.tsx",
      "HelixAskMoodAvatar.tsx",
      "HelixAskActionToolbar.tsx",
      "HelixAskGoalPill.tsx",
      "HelixAskProceduralTimeline.tsx",
      "HelixAskConsoleStack.tsx",
      "HelixAskConsoleRuntimeLayout.tsx",
      "HelixAskReasoningAnimationStyles.tsx",
      "HelixAskReasoningBattleStage.tsx",
      "HelixAskReasoningMirekField.tsx",
      "HelixAskReasoningStatusMedalStrip.tsx",
      "HelixAskSurfaceComposerPanel.tsx",
      "HelixAskSurfaceFrame.tsx",
      "HelixAskSurfaceSupplementStack.tsx",
      "HelixAskTurnList.tsx",
      "HelixAskReplyCard.tsx",
      "HelixAskReplyTurn.tsx",
      "HelixAskTurnStreamPanel.tsx",
      "HelixAskFinalAnswer.tsx",
      "HelixAskFinalExtras.tsx",
      "HelixAskActiveTurnStreamPanel.tsx",
      "HelixAskTurnControls.tsx",
      "HelixAskDebugDrawer.tsx",
      "HelixAskAttachmentStrip.tsx",
      "HelixAskStatusLine.tsx",
      "HelixAskVoiceLevelMonitor.tsx",
      "HelixAskObserverLane.tsx",
      "HelixAskSteeringQueuePanel.tsx",
      "HelixAskContextCapsulePreview.tsx",
      "HelixAskSituationRoomSourcePanel.tsx",
      "HelixAskVoiceConfirmationPanel.tsx",
      "HelixAskLegacyConsoleInventory.ts",
      "HelixAskContextBridge.ts",
      "HelixAskRequestEnvelope.ts",
      "HelixAskMinimalRuntimeLifecycle.ts",
      "HelixAskMinimalRuntimeSubmitPlan.ts",
      "HelixAskMinimalRuntimeTransport.ts",
      "HelixAskMinimalRuntimeBackendRunner.ts",
      "HelixAskMinimalRuntimeControls.ts",
      "HelixAskMinimalRuntimeDebugExport.ts",
      "HelixAskMinimalRuntimeChatSession.ts",
      "HelixAskMinimalRuntimeTurnList.tsx",
      "HelixAskLatestTurnBinding.ts",
      "HelixAskFinalProjection.ts",
      "HelixAskWorkstationTraceRows.ts",
      "HelixAskSubmitAdmission.ts",
      "HelixAskChatProjection.ts",
      "HelixAskReplyLifecycle.ts",
      "HelixAskChatPersistence.ts",
      "HelixAskConsoleState.ts",
      "index.ts",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(root, file))).toBe(true);
    }
    expect(HELIX_ASK_CONSOLE_RECROWN_VERSION).toBe("ask-console-recrown-v1");
    expect(HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS).toEqual([
      "prompt_input",
      "runtime_picker",
      "active_docs_context_handoff",
      "request_envelope",
      "submit_stream_handling",
      "latest_turn_selection",
      "final_answer_rendering",
      "workstation_trace_rows",
      "provider_model_metadata",
      "copy_final",
      "debug_copy_export",
      "read_aloud",
      "chat_session_persistence",
    ]);
  });

  it("defines the ordered recrown phases and minimal runtime shell contract", () => {
    expect(HELIX_ASK_CONSOLE_RECROWN_PHASES).toEqual([
      "stabilize_legacy_bridge",
      "extract_display_owners",
      "quarantine_behavior_sensitive_paths",
      "build_minimal_runtime_shell",
      "replace_legacy_bridge_after_parity",
      "retire_legacy_pill_after_proof",
    ]);
    expect(HELIX_ASK_CONSOLE_ACTIVE_RECROWN_PHASE).toBe("build_minimal_runtime_shell");
    expect(HELIX_ASK_CONSOLE_MINIMAL_RUNTIME_SHELL_OWNS).toEqual(
      HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS,
    );
    expect(HELIX_ASK_CONSOLE_MINIMAL_RUNTIME_SHELL_FORBIDDEN_OWNERSHIP).toEqual([
      "backend_terminal_authority",
      "model_or_tool_execution",
      "private_retry_loop",
      "private_agent_runtime",
      "final_prose_tool_observation_scraping",
      "duplicated_backend_route_authority",
    ]);
    expect(HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_READY).toBe(false);
    expect(HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_PROVEN_GATES).toEqual([
      "desktop_entrypoints_route_to_console_crown",
      "legacy_bridge_is_named_and_quarantined",
      "runtime_shell_owns_safe_layout_defaults",
      "active_docs_context_has_pure_snapshot_helper",
      "request_envelope_has_pure_builder",
      "latest_turn_binding_has_pure_selector",
      "latest_copy_debug_read_aloud_has_pure_control_target",
      "final_answer_projection_has_pure_helper",
      "long_final_answer_has_unclipped_display_contract",
      "workstation_trace_rows_have_structured_projection",
      "workstation_no_observation_keeps_typed_failure",
      "workstation_calculator_gateway_trace_parity",
      "provider_model_metadata_has_pure_projection",
      "chat_projection_has_pure_hydration_helper",
      "chat_persistence_has_pure_payload_helper",
      "minimal_runtime_shell_surface_scaffold_exists",
      "minimal_runtime_shell_builds_submit_plan",
      "minimal_runtime_shell_starts_optimistic_turn",
      "minimal_runtime_shell_has_injected_transport_seam",
      "minimal_runtime_shell_completes_injected_turn",
      "minimal_runtime_shell_has_backend_runner_adapter",
      "minimal_runtime_shell_records_stream_events",
      "minimal_runtime_shell_renders_local_turns",
      "minimal_runtime_shell_renders_workstation_trace_rows",
      "minimal_runtime_shell_binds_latest_controls",
      "minimal_runtime_shell_materializes_backend_debug_export",
      "runtime_shell_can_select_minimal_runtime_without_legacy_pill",
      "minimal_shell_submits_and_streams_without_legacy_pill",
      "minimal_shell_preserves_active_docs_context_handoff_live",
      "minimal_runtime_shell_component_submits_injected_turn",
      "minimal_runtime_shell_persists_and_hydrates_chat_sessions",
    ]);
    expect(HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_OPEN_GATES).toEqual([
      "operator_surface_live_parity_validation",
    ]);
    expect(HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_ITEMS).toEqual([
      "prompt_composer_surface",
      "runtime_picker",
      "goal_pill",
      "steering_queue",
      "attachment_context_strip",
      "context_source_panels",
      "observer_panels",
      "debug_drawer",
      "copy_debug_read_aloud_controls",
      "voice_read_aloud_affordances",
      "visible_stream_progress_status_rows",
      "final_answer_metadata",
      "workstation_trace_rows",
      "layout_position_sizing_dock_behavior",
      "top_of_console_readable",
      "long_answer_unclipped",
    ]);
    expect(HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_READY).toBe(false);
    expect(HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_PROVEN_ITEMS).toEqual([
      "prompt_composer_surface",
      "runtime_picker",
      "goal_pill",
      "steering_queue",
      "attachment_context_strip",
      "context_source_panels",
      "observer_panels",
      "debug_drawer",
      "copy_debug_read_aloud_controls",
      "final_answer_metadata",
      "workstation_trace_rows",
      "visible_stream_progress_status_rows",
      "voice_read_aloud_affordances",
      "long_answer_unclipped",
    ]);
    expect(HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_OPEN_ITEMS).toEqual([
      "layout_position_sizing_dock_behavior",
      "top_of_console_readable",
    ]);
    expect(HELIX_ASK_CONSOLE_LEGACY_BEHAVIOR_CLASSIFICATIONS.map((entry) => entry.classification)).toEqual([
      "used_must_move",
      "used_must_move",
      "used_temporary_adapter",
      "unknown_quarantined",
      "conflicting_remove_after_golden_path_proof",
    ]);
  });

  it("tracks the live legacy console slicing inventory before bridge replacement", () => {
    const legacyPillSource = read("client/src/components/helix/HelixAskPill.tsx");
    const legacyPillLines = legacyPillSource.trimEnd().split(/\r?\n/);
    const exportedComponentLine =
      legacyPillLines.findIndex((line) => line.includes("export function HelixAskPill")) + 1;
    const activeRenderLine =
      legacyPillLines.findIndex((line) => line.includes("const activeTurnStreamPanel = (")) + 1;
    const runtimeLayoutLine =
      legacyPillLines.findIndex((line) => line.includes("<HelixAskConsoleRuntimeLayout")) + 1;

    expect(HELIX_ASK_LEGACY_CONSOLE_ACTIVE_PATH).toEqual([
      "HelixAskConsole",
      "HelixAskConsoleRuntimeShell",
      "HelixAskLegacyRuntimeBridge",
      "HelixAskPill",
    ]);
    expect(HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT).toMatchObject({
      file: "client/src/components/helix/HelixAskPill.tsx",
      exportedComponentStartsAtLine: exportedComponentLine,
      liveRenderSliceStartsAtLine: activeRenderLine,
      liveRuntimeLayoutStartsAtLine: runtimeLayoutLine,
    });
    expect(Math.abs(HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT.lineCountAtInventory - legacyPillLines.length)).toBeLessThanOrEqual(5);
    expect(HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT.lineCountAtInventory).toBeGreaterThan(29000);
    expect(HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT.exportedComponentStartsAtLine).toBeGreaterThan(10000);
    expect(HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT.liveRenderSliceStartsAtLine).toBeGreaterThan(28000);
    expect(HELIX_ASK_LEGACY_CONSOLE_SLICES.map((slice) => slice.classification)).toEqual([
      "live_day_to_day_must_move",
      "pure_display_already_recrowned",
      "pure_display_already_recrowned",
      "pure_display_already_recrowned",
      "pure_display_already_recrowned",
      "behavior_sensitive_quarantined",
      "behavior_sensitive_quarantined",
      "behavior_sensitive_quarantined",
      "behavior_sensitive_quarantined",
      "unknown_trap_door_quarantined",
    ]);
    expect(HELIX_ASK_LEGACY_CONSOLE_SLICE_PROGRESS).toMatchObject({
      activeDefaultImplementation: "legacy_bridge",
      replacementTarget: "legacy_equivalent_recrowned_runtime",
      simplifiedMinimalShellIsDefault: false,
      bridgeReplacementReady: false,
      liveDayToDaySliceCount: 1,
      pureDisplayRecrownedSliceCount: 4,
      behaviorSensitiveQuarantinedSliceCount: 4,
      unknownTrapDoorSliceCount: 1,
    });
    expect(legacyPillSource).toContain("<HelixAskConsoleRuntimeLayout");
    expect(legacyPillSource).toContain("<HelixAskSurfaceComposerPanel");
    expect(legacyPillSource).toContain("<HelixAskSurfaceSupplementStack");
    expect(legacyPillSource).toContain("<HelixAskReplyTurn");
    expect(legacyPillSource).toContain("<HelixAskDebugDrawer");
  });

  it("routes active desktop and workstation entrypoints through the new console crown", () => {
    const entrypoints = [
      "client/src/components/workstation/HelixAskDock.tsx",
      "client/src/components/workstation/mobile/MobileHelixAskDrawer.tsx",
      "client/src/pages/desktop.tsx",
      "client/src/pages/mobile-start.tsx",
    ];

    for (const entrypoint of entrypoints) {
      const source = read(entrypoint);
      expect(source).toContain("@/components/helix/ask-console");
      expect(source).not.toContain("@/components/helix/HelixAskPill");
    }
  });

  it("quarantines the remaining legacy behavior behind a named bridge", () => {
    const consoleSource = read("client/src/components/helix/ask-console/HelixAskConsole.tsx");
    const runtimeShellSource = read("client/src/components/helix/ask-console/HelixAskConsoleRuntimeShell.tsx");
    const bridgeSource = read("client/src/components/helix/ask-console/HelixAskLegacyRuntimeBridge.tsx");

    expect(consoleSource).toContain("HelixAskConsoleRuntimeShell");
    expect(consoleSource).not.toContain("@/components/helix/HelixAskPill");
    expect(consoleSource).not.toContain("HelixAskLegacyRuntimeBridge");
    expect(runtimeShellSource).toContain("HelixAskLegacyRuntimeBridge");
    expect(runtimeShellSource).not.toContain("@/components/helix/HelixAskPill");
    expect(bridgeSource).toContain("@/components/helix/HelixAskPill");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS).toMatchObject({
      activeImplementation: "legacy_bridge",
      bridge: "helix_ask_pill_legacy_runtime_bridge",
      activePhase: "build_minimal_runtime_shell",
      reason: "operator_surface_parity_not_live_proven",
      runtimeShell: "helix_ask_console_runtime_shell",
      replacementTarget: "legacy_pill_retirement_after_proof",
    });
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toBe(
      HELIX_ASK_CONSOLE_RECROWNED_DISPLAY_OWNERS,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedPureHelperRequirements).toBe(
      HELIX_ASK_CONSOLE_RECROWNED_PURE_HELPER_REQUIREMENTS,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.minimalRuntimeShellOwns).toBe(
      HELIX_ASK_CONSOLE_MINIMAL_RUNTIME_SHELL_OWNS,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.minimalRuntimeShellForbiddenOwnership).toBe(
      HELIX_ASK_CONSOLE_MINIMAL_RUNTIME_SHELL_FORBIDDEN_OWNERSHIP,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.runtimeShellActiveOwnership).toBe(
      HELIX_ASK_CONSOLE_RUNTIME_SHELL_ACTIVE_OWNERSHIP,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.remainingBehaviorSensitivePaths).toEqual(
      HELIX_ASK_CONSOLE_LIVE_SURFACE_REQUIREMENTS,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.bridgeReplacementReady).toBe(false);
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.bridgeReplacementProvenGates).toBe(
      HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_PROVEN_GATES,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.bridgeReplacementOpenGates).toBe(
      HELIX_ASK_CONSOLE_BRIDGE_REPLACEMENT_OPEN_GATES,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.bridgeReplacementProvenGates).toContain(
      "minimal_shell_submits_and_streams_without_legacy_pill",
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.bridgeReplacementOpenGates).toEqual([
      "operator_surface_live_parity_validation",
    ]);
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.operatorSurfaceParityReady).toBe(false);
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.operatorSurfaceParityOpenItems).toEqual(
      HELIX_ASK_CONSOLE_OPERATOR_SURFACE_PARITY_OPEN_ITEMS,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.legacyBehaviorClassifications).toBe(
      HELIX_ASK_CONSOLE_LEGACY_BEHAVIOR_CLASSIFICATIONS,
    );
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toContain("composer");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toContain("runtime_layout");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toContain("surface_composer_panel");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toContain("surface_supplement_stack");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toContain("busy_reasoning_panel");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedDisplayOwners).toContain("reasoning_battle_stage");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedPureHelperRequirements).toContain("request_envelope");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedPureHelperRequirements).toContain("latest_turn_selection");
    expect(HELIX_ASK_CONSOLE_LEGACY_BRIDGE_STATUS.recrownedPureHelperRequirements).toContain(
      "provider_model_metadata",
    );
    const ownershipMap = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");
    expect(ownershipMap).toContain("HelixAskConsoleState.ts");
    expect(ownershipMap).toContain("HelixAskConsoleRuntimeShell");
    expect(ownershipMap).toContain("runtimeShellActiveOwnership");
    expect(ownershipMap).toContain("HELIX_ASK_CONSOLE_RECROWN_PHASES");
    expect(ownershipMap).toContain("minimalRuntimeShellOwns");
    expect(ownershipMap).toContain("minimalRuntimeShellForbiddenOwnership");
    expect(ownershipMap).toContain("remainingBehaviorSensitivePaths");
    expect(ownershipMap).toContain("bridgeReplacementProvenGates");
    expect(ownershipMap).toContain("bridgeReplacementOpenGates");
    expect(ownershipMap).toContain("operatorSurfaceParityOpenItems");
    expect(ownershipMap).toContain("legacyBehaviorClassifications");
    expect(ownershipMap).toContain("defaults to the legacy bridge");
  });

  it("keeps the legacy bridge default while the minimal runtime shell stays explicitly selectable", () => {
    const consoleSource = read("client/src/components/helix/ask-console/HelixAskConsole.tsx");
    const runtimeShellSource = read("client/src/components/helix/ask-console/HelixAskConsoleRuntimeShell.tsx");
    const bridgeSource = read("client/src/components/helix/ask-console/HelixAskLegacyRuntimeBridge.tsx");
    const minimalShellSource = read("client/src/components/helix/ask-console/HelixAskMinimalRuntimeShell.tsx");

    expect(consoleSource).toContain("return <HelixAskConsoleRuntimeShell {...props} />");
    expect(runtimeShellSource).toContain("buildHelixAskConsoleRuntimeBridgeProps(props)");
    expect(runtimeShellSource).toContain("runtimeImplementation = \"legacy_bridge\"");
    expect(runtimeShellSource).toContain("runtimeImplementation === \"minimal_runtime_shell\"");
    expect(runtimeShellSource).toContain("<HelixAskMinimalRuntimeShell");
    expect(runtimeShellSource).toContain("<HelixAskLegacyRuntimeBridge");
    expect(bridgeSource).toContain("return <HelixAskPill {...props} />");
    expect(runtimeShellSource).not.toContain("@/components/helix/HelixAskPill");
    expect(minimalShellSource).toContain("data-testid=\"helix-ask-minimal-runtime-shell\"");
    expect(minimalShellSource).toContain("HelixAskConsoleRuntimeLayout");
    expect(minimalShellSource).toContain("HelixAskDebugDrawer");
    expect(minimalShellSource).toContain("HelixAskRuntimePicker");
    expect(minimalShellSource).toContain("HelixAskRuntimeStatusLine");
    expect(minimalShellSource).toContain("HelixAskSurfaceSupplementStack");
    expect(minimalShellSource).toContain("goalPill={visibleSurface?.goalPill}");
    expect(minimalShellSource).toContain("steeringQueue={visibleSurface?.steeringQueue}");
    expect(minimalShellSource).toContain("HelixAskComposer");
    expect(minimalShellSource).toContain("buildHelixAskMinimalRuntimeSubmitPlan");
    expect(minimalShellSource).toContain("startHelixAskMinimalRuntimeTurn");
    expect(minimalShellSource).toContain("recordHelixAskMinimalRuntimeStreamEvent");
    expect(minimalShellSource).toContain("completeHelixAskMinimalRuntimeTurn");
    expect(minimalShellSource).toContain("failHelixAskMinimalRuntimeTurn");
    expect(minimalShellSource).toContain("buildHelixAskMinimalRuntimeTurnPayload");
    expect(minimalShellSource).toContain("runHelixAskMinimalRuntimeInjectedTransport");
    expect(minimalShellSource).toContain("onEvent: (event)");
    expect(minimalShellSource).toContain("runHelixAskMinimalRuntimeBackendTurn");
    expect(minimalShellSource).toContain("HelixAskMinimalRuntimeTurnList");
    expect(minimalShellSource).toContain("useAgiChatStore");
    expect(minimalShellSource).toContain("buildHelixAskMinimalRuntimeRepliesFromChatSession");
    expect(minimalShellSource).toContain("resolveHelixAskMinimalRuntimeAnswerText");
    expect(minimalShellSource).toContain("onSubmitPlan?.(submitPlan)");
    expect(minimalShellSource).not.toContain("HelixAskLegacyRuntimeBridge");
    expect(minimalShellSource).not.toContain("@/components/helix/HelixAskPill");
    for (const forbidden of [
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speakVoice",
      "fetch(",
      "terminal_authority",
    ]) {
      expect(runtimeShellSource).not.toContain(forbidden);
    }
    for (const forbidden of [
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speakVoice",
      "fetch(",
      "terminal_authority",
    ]) {
      expect(minimalShellSource).not.toContain(forbidden);
    }
  });

  it("lets the runtime shell own safe layout defaults before bridge replacement", () => {
    expect(HELIX_ASK_CONSOLE_RUNTIME_SHELL_ACTIVE_OWNERSHIP).toEqual([
      "layout_variant_default",
      "reply_list_class_default",
    ]);
    expect(buildHelixAskConsoleRuntimeBridgeProps({
      contextId: "ctx",
    })).toMatchObject({
      contextId: "ctx",
      layoutVariant: "hero",
      replyListClassName: HELIX_ASK_CONSOLE_HERO_REPLY_LIST_CLASS_NAME,
    });
    expect(buildHelixAskConsoleRuntimeBridgeProps({
      contextId: "ctx",
      layoutVariant: "dock",
    })).toMatchObject({
      contextId: "ctx",
      layoutVariant: "dock",
      replyListClassName: HELIX_ASK_CONSOLE_DOCK_REPLY_LIST_CLASS_NAME,
    });
    expect(buildHelixAskConsoleRuntimeBridgeProps({
      contextId: "ctx",
      layoutVariant: "dock",
      replyListClassName: "custom-list",
      maxWidthClassName: undefined,
    })).toMatchObject({
      contextId: "ctx",
      layoutVariant: "dock",
      replyListClassName: "custom-list",
      maxWidthClassName: undefined,
    });
    const runtimeShellSource = read("client/src/components/helix/ask-console/HelixAskConsoleRuntimeShell.tsx");
    const runtimeShellPropsSource = read(
      "client/src/components/helix/ask-console/HelixAskConsoleRuntimeShellProps.ts",
    );
    expect(runtimeShellSource).toContain("buildHelixAskConsoleRuntimeBridgeProps");
    expect(runtimeShellSource).not.toContain("maxWidthClassName ??");
    expect(runtimeShellPropsSource).toContain("buildHelixAskConsoleRuntimeBridgeProps");
    for (const forbidden of [
      "HelixAskLegacyRuntimeBridge",
      "HelixAskPill",
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speakVoice",
      "useAgiChatStore",
      "fetch(",
      "terminal_authority",
    ]) {
      expect(runtimeShellPropsSource).not.toContain(forbidden);
    }
  });

  it("keeps active document handoff as a pure request-envelope helper", () => {
    const url =
      "http://127.0.0.1:1498/desktop?panels=docs-viewer%2Cscientific-calculator&focus=docs-viewer&doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md";
    const context = buildHelixAskContextBridgeSnapshot(url);

    expect(readDocPathFromDesktopUrl(url)).toBe(
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    );
    expect(buildHelixAskConsoleRequestEnvelope({
      question: "Summarize the current whitepaper.",
      agentRuntime: "codex",
      context,
    })).toEqual({
      question: "Summarize the current whitepaper.",
      agent_runtime: "codex",
      doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    });
    expect(buildHelixAskConsoleContextFiles({
      docsViewerAnchorPath: "workspace://docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      workspaceContextSnapshot: {
        activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        docContextPath: "docs/other.md",
      },
    })).toEqual([
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      "docs/other.md",
    ]);
  });

  it("owns the core backend turn request shape used by the legacy bridge", () => {
    expect(buildHelixAskConsoleBackendTurnPayloadCore({
      sessionId: "session-1",
      agentRuntime: "codex",
      traceId: "ask:trace",
      turnId: "ask:turn",
      maxTokens: 1234,
      question: "Use the active doc.",
      contextFiles: ["docs/current.md"],
    })).toEqual({
      sessionId: "session-1",
      agentRuntime: "codex",
      traceId: "ask:trace",
      turnId: "ask:turn",
      maxTokens: 1234,
      question: "Use the active doc.",
      contextFiles: ["docs/current.md"],
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskConsoleBackendTurnPayloadCore");
    expect(legacyPill).toContain("buildHelixAskConsoleContextFiles");
    expect(legacyPill).toContain("readDocPathFromDesktopUrl");
  });

  it("owns latest visible turn control binding for copy, debug copy, and read aloud", () => {
    const latestId = resolveHelixAskLatestTurnId([
      { id: "old-turn", finalAnswerText: "old answer" },
      { id: "latest-turn", finalAnswerText: "latest answer" },
    ]);

    expect(latestId).toBe("latest-turn");
    expect(buildHelixAskLatestTurnBinding({
      replyId: "old-turn",
      latestReplyId: latestId,
      finalAnswerText: "old answer",
    })).toEqual({
      isLatest: false,
      controlTarget: {
        replyId: "old-turn",
        isLatest: false,
        finalAnswerText: "old answer",
      },
      finalAnswerText: "old answer",
    });
    expect(buildHelixAskLatestTurnBinding({
      replyId: "latest-turn",
      latestReplyId: latestId,
      finalAnswerText: "latest answer",
    })).toEqual({
      isLatest: true,
      controlTarget: {
        replyId: "latest-turn",
        isLatest: true,
        finalAnswerText: "latest answer",
      },
      copyFinalTestId: "helix-ask-latest-copy-final",
      debugCopyTestId: "helix-ask-latest-debug-copy",
      finalAnswerTestId: "helix-ask-latest-final-answer",
      questionTestId: "helix-ask-latest-question",
      readAloudTestId: "helix-ask-latest-read-aloud",
      turnTestId: "helix-ask-latest-turn",
      workLogTestId: "helix-ask-latest-work-log",
      finalAnswerText: "latest answer",
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const latestTurnBindingSource = read("client/src/components/helix/ask-console/HelixAskLatestTurnBinding.ts");
    expect(legacyPill).toContain("buildHelixAskLatestTurnBinding");
    expect(legacyPill).toContain("latestTurnBinding.controlTarget.finalAnswerText");
    expect(latestTurnBindingSource).toContain("export type HelixAskLatestTurnControlTarget");
    for (const forbidden of [
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "fetch(",
      "copyDebugPayloadToClipboard",
      "handleCopyReply",
      "handleReadAloud",
      "runAskTurn",
      "runAskTurnStream",
    ]) {
      expect(latestTurnBindingSource).not.toContain(forbidden);
    }
  });

  it("owns structured workstation success projection without final-prose scraping", () => {
    const successfulRows = [
      {
        key: "request",
        role: "assistant",
        label: "Tool Request",
        text: "Tool request: scientific-calculator.solve_expression",
        meta: "workstation_gateway | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "observation",
        role: "tool",
        label: "Tool Observation",
        text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
        meta: "scientific-calculator.solve_expression | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "reentry",
        role: "assistant",
        label: "Model Re-entry",
        text: "Model re-entry: Codex received the workstation observation packet(s) before final answer.",
        meta: "workstation_gateway | reentry | completed",
        status: "completed",
      },
      {
        key: "final",
        role: "assistant",
        label: "Final",
        text: "Observed expression: 8*9\nResult: 72",
        meta: "terminal | final",
        status: "completed",
      },
    ];

    expect(hasSuccessfulWorkstationTerminalTranscriptRows(successfulRows)).toBe(true);
    expect(resolveHelixAskConsoleFinalAnswerSourceLabel({
      rawFinalAnswerSourceLabel: "typed failure",
      turnTranscriptRows: successfulRows,
    })).toBe("workstation tool evaluation");
    expect(resolveHelixAskConsoleFinalAnswerSourceLabel({
      rawFinalAnswerSourceLabel: "typed failure",
      turnTranscriptRows: [
        {
          key: "final-only",
          role: "assistant",
          label: "Final",
          text: "Observed expression: 8*9\nResult: 72",
          meta: "terminal | final",
          status: "completed",
        },
      ],
    })).toBe("typed failure");

    const structuredCalculatorRows = buildHelixTurnTranscriptRows({
      id: "reply-codex-structured-gateway",
      turn_id: "turn-codex-structured-gateway",
      content: "Observed expression: 8*9\nResult: 72",
      debug: {
        turn_id: "turn-codex-structured-gateway",
        agent_runtime: "codex",
        turn_transcript_events: [
          {
            role: "agent",
            type: "model_decision",
            status: "completed",
            text: "Model re-entry: no workstation observation packet was available for this Codex turn.",
            source_event_type: "model_reentry",
          },
        ],
        workstation_gateway_call_results: [
          {
            schema: "helix.workstation_tool_gateway.call_result.v1",
            ok: true,
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            gateway_admission: {
              requested_capability: "scientific-calculator.solve_expression",
              admission_status: "admitted",
            },
            observation: {
              expression: "8*9",
              result: "72",
            },
            observation_packet: {
              schema: "helix.agent_step_observation_packet.v1",
              turn_id: "turn-codex-structured-gateway",
              capability_key: "scientific-calculator.solve_expression",
              status: "succeeded",
              observation_summary: "8*9 = 72",
            },
          },
        ],
      },
    });
    const structuredCalculatorText = structuredCalculatorRows.map((row) => `${row.label}: ${row.text}`).join("\n");
    expect(structuredCalculatorText).toContain("Tool request: scientific-calculator.solve_expression.");
    expect(structuredCalculatorText).toContain("Tool observation: scientific-calculator.solve_expression observed 8*9 = 72.");
    expect(structuredCalculatorText).toContain("Model re-entry: Codex received the workstation observation packet");
    expect(structuredCalculatorText).not.toContain("no workstation observation packet was available");
    expect(selectHelixAskConsoleWorkstationTraceRows(structuredCalculatorRows).map((row) => row.label)).toEqual([
      "Tool Request",
      "Tool Observation",
      "Model Re-entry",
    ]);

    const proseOnlyRows = buildHelixTurnTranscriptRows({
      id: "reply-prose-only",
      content: "Observed expression: 8*9\nResult: 72",
      debug: {
        turn_id: "turn-prose-only",
        agent_runtime: "codex",
      },
    });
    expect(proseOnlyRows).toEqual([]);
    expect(selectHelixAskConsoleWorkstationTraceRows(proseOnlyRows)).toEqual([]);

    const noObservationRows = buildHelixTurnTranscriptRows({
      id: "reply-codex-no-observation",
      debug: {
        agent_runtime: "codex",
        workstation_gateway_call_results: [
          {
            ok: false,
            capability_id: "scientific-calculator.solve_expression",
            mode: "read",
            error: "calculator_gateway_solve_observation_missing",
            gateway_admission: {
              requested_capability: "scientific-calculator.solve_expression",
              admission_status: "blocked",
              blocked_reason: "calculator_gateway_solve_observation_missing",
            },
            observation_packet: {
              capability_key: "scientific-calculator.solve_expression",
              status: "blocked",
              observation_summary: "calculator_gateway_solve_observation_missing",
            },
          },
        ],
      },
    });
    const noObservationText = noObservationRows.map((row) => `${row.label}: ${row.text} ${row.status}`).join("\n");
    expect(noObservationText).toContain("Tool request: scientific-calculator.solve_expression.");
    expect(noObservationText).toContain(
      "Tool observation: scientific-calculator.solve_expression blocked calculator_gateway_solve_observation_missing.",
    );
    expect(noObservationText).not.toContain("Codex received the workstation observation packet");
    expect(hasSuccessfulWorkstationTerminalTranscriptRows(noObservationRows)).toBe(false);
    expect(resolveHelixAskConsoleFinalAnswerSourceLabel({
      rawFinalAnswerSourceLabel: "typed failure",
      turnTranscriptRows: noObservationRows,
    })).toBe("typed failure");

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("resolveHelixAskConsoleFinalAnswerSourceLabel");
  });

  it("owns provider and model metadata projection as a pure runtime-display helper", () => {
    expect(
      resolveHelixAskActualAgentProviderLabel({
        agent_runtime: "codex",
        selected_agent_provider: {
          id: "codex",
          label: "Codex Workstation Mode",
        },
      }),
    ).toBe("Provider: Codex Workstation Mode");
    expect(
      resolveHelixAskModelUsageLabel({
        debug: {
          agent_runtime: "codex",
          selected_agent_provider: {
            id: "codex",
            label: "Codex Workstation Mode",
          },
          codex_args: ["exec", "--sandbox", "read-only"],
        },
      }),
    ).toBe("Model: Codex default (not reported)");

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");
    const runtimeDisplay = read("client/src/lib/helix/ask-agent-runtime-display.ts");

    expect(legacyPill).toContain("resolveHelixAskActualAgentProviderLabel(reply, agentRuntimeProviders)");
    expect(legacyPill).toContain("resolveHelixAskModelUsageLabel(reply)");
    expect(legacyPill).toContain("actualAgentProviderLabel");
    expect(legacyPill).toContain("actualAgentModelLabel");
    expect(turnStreamPanel).toContain("actualAgentProviderLabel");
    expect(turnStreamPanel).toContain("actualAgentModelLabel");
    expect(turnStreamPanel).toContain("isFinalRow && actualAgentProviderLabel");
    expect(turnStreamPanel).toContain("isFinalRow && actualAgentModelLabel");

    for (const forbidden of [
      "fetch(",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "runAskTurn",
      "runAskTurnStream",
      "terminal_authority",
    ]) {
      expect(runtimeDisplay).not.toContain(forbidden);
    }
  });

  it("owns final-answer block rendering policy without UI clipping", () => {
    const longLine = `Long answer: ${"0123456789abcdef".repeat(320)}`;

    expect(buildHelixAskFinalAnswerBlocks(longLine)).toEqual([
      {
        kind: "line",
        key: "final-answer-line-0",
        text: longLine,
        isSectionHeader: false,
      },
    ]);
    expect(buildHelixAskFinalAnswerBlocks("Summary:\n- NHM2 remains bounded.\n\nDone.")).toEqual([
      {
        kind: "line",
        key: "final-answer-line-0",
        text: "Summary:",
        isSectionHeader: true,
      },
      {
        kind: "bullet",
        key: "final-answer-bullet-1",
        text: "NHM2 remains bounded.",
      },
      {
        kind: "blank",
        key: "final-answer-blank-2",
      },
      {
        kind: "line",
        key: "final-answer-line-3",
        text: "Done.",
        isSectionHeader: false,
      },
    ]);

    const finalAnswerSource = read("client/src/components/helix/ask-console/HelixAskFinalAnswer.tsx");
    expect(finalAnswerSource).toContain("buildHelixAskFinalAnswerBlocks");
    expect(finalAnswerSource).toContain("data-narrator-source-id");
    expect(finalAnswerSource).toContain("[overflow-wrap:anywhere]");
    expect(finalAnswerSource).toContain("break-words");
    expect(finalAnswerSource).not.toMatch(/\b(?:line-clamp|max-h-|overflow-hidden|truncate|text-ellipsis|whitespace-nowrap)\b/);
    for (const forbidden of ["clipText(", "slice(", "substring("]) {
      expect(finalAnswerSource).not.toContain(forbidden);
    }

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");
    expect(legacyPill).toContain("<HelixAskFinalAnswer");
    expect(legacyPill).toContain("renderContent={renderHelixAskContent}");
    expect(legacyPill).not.toContain("blocks.map((block)");
    expect(legacyPill).not.toContain("parseHelixAskFinalAnswerBulletLine");
    expect(turnStreamPanel).toContain("data-final-answer-text={isFinalRow ? finalAnswerRawText : undefined}");
    expect(turnStreamPanel).toContain("const visibleText = isFinalRow ? row.text : clipText");
  });

  it("owns final-row proof trace display while trace selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("workstation_reasoning_trace");
    expect(legacyPill).toContain("proofTrace: (replyDebugRecord as Record<string, unknown> | null | undefined)");
    expect(legacyPill).not.toContain("<summary className=\"cursor-pointer select-none text-[10px] uppercase tracking-[0.2em] text-amber-200\">");
    expect(legacyPill).not.toContain("trace.compact_steps");
    expect(legacyPill).not.toContain("trace.caveats");

    expect(replyTurn).toContain("<HelixAskTurnStreamPanel");
    expect(turnStreamPanel).toContain("<HelixAskProofTraceDetails trace={proofTrace} clipText={clipText} />");
    expect(finalExtras).toContain("export function HelixAskProofTraceDetails");
    expect(finalExtras).toContain("if (!record) return null");
    expect(finalExtras).toContain("Proof trace");
    expect(finalExtras).toContain("record.compact_steps");
    expect(finalExtras).toContain("record.caveats");
    expect(finalExtras).toContain("clipText(String(stepRecord?.summary ?? \"\"), 260)");
    expect(finalExtras).not.toContain("replyDebugRecord");
    expect(finalExtras).not.toContain("workstation_reasoning_trace");
  });

  it("owns job-ready link button display while execution stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("jobReadyLinks,");
    expect(legacyPill).toContain("onRunJobReadyLink: runJobReadyLink");
    expect(legacyPill).toContain("const jobReadyLinks = resolveHelixAskVisibleJobReadyLinks(reply)");
    expect(legacyPill).toContain("syncDocViewerStateFromWorkstationAction(action)");
    expect(legacyPill).not.toContain("jobReadyLinks.slice(0, 6).map");
    expect(legacyPill).not.toContain("title={`From ${source}`}");

    expect(replyTurn).toContain("<HelixAskTurnStreamPanel");
    expect(turnStreamPanel).toContain("<HelixAskJobReadyLinkStrip links={jobReadyLinks} onRun={onRunJobReadyLink} />");
    expect(finalExtras).toContain("export function HelixAskJobReadyLinkStrip");
    expect(finalExtras).toContain("if (links.length === 0) return null");
    expect(finalExtras).toContain("links.slice(0, 6).map");
    expect(finalExtras).toContain("onClick={() => onRun(link)}");
    expect(finalExtras).toContain("title={`From ${source}`}");
    expect(finalExtras).not.toContain("resolveHelixAskVisibleJobReadyLinks");
    expect(finalExtras).not.toContain("syncDocViewerStateFromWorkstationAction");
    expect(finalExtras).not.toContain("dispatchHelixWorkstationActions");
  });

  it("owns latest reply status footer display while latest selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyCard = read("client/src/components/helix/ask-console/HelixAskReplyCard.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("promptIngested: reply.promptIngested");
    expect(legacyPill).toContain("const isLatestReply = reply.id === transcriptLatestAskReplyId");
    expect(legacyPill).not.toContain("<HelixAskReplyStatusFooter");
    expect(legacyPill).not.toContain("In Helix Console");
    expect(legacyPill).not.toContain("{reply.promptIngested ? \" | Prompt ingested\" : \"\"}");

    expect(replyTurn).toContain("<HelixAskReplyCard");
    expect(replyCard).toContain("<HelixAskReplyStatusFooter visible={isLatestReply} promptIngested={promptIngested} />");
    expect(replyCard).not.toContain("transcriptLatestAskReplyId");
    expect(replyCard).not.toContain("reply.id");
    expect(finalExtras).toContain("export function HelixAskReplyStatusFooter");
    expect(finalExtras).toContain("if (!visible) return null");
    expect(finalExtras).toContain("In Helix Console");
    expect(finalExtras).toContain("{promptIngested ? \" | Prompt ingested\" : \"\"}");
    expect(finalExtras).not.toContain("transcriptLatestAskReplyId");
    expect(finalExtras).not.toContain("reply.id");
  });

  it("owns live bridge pill display while bridge state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("liveBridgeStatus: liveAnswerTurnBridge?.status");
    expect(legacyPill).toContain("readPillClassName: readLiveAnswerTurnBridgePillClassName");
    expect(legacyPill).toContain("liveAnswerTurnBridge = buildLiveAnswerTurnBridgeState");
    expect(legacyPill).not.toContain("row.bridgePills.map");
    expect(legacyPill).not.toContain("pills={row.bridgePills}");
    expect(legacyPill).not.toContain('data-testid={isLatestReply ? "helix-ask-latest-live-turn-bridge" : undefined}');

    expect(replyTurn).toContain("<HelixAskTurnStreamPanel");
    expect(turnStreamPanel).toContain("<HelixAskLiveBridgePillStrip");
    expect(turnStreamPanel).toContain("pills={row.bridgePills}");
    expect(turnStreamPanel).toContain("status={liveBridgeStatus}");
    expect(finalExtras).toContain("export function HelixAskLiveBridgePillStrip");
    expect(finalExtras).toContain("if (!pills?.length) return null");
    expect(finalExtras).toContain('data-testid={isLatestReply ? "helix-ask-latest-live-turn-bridge" : undefined}');
    expect(finalExtras).toContain("data-live-turn-bridge-status={status ?? undefined}");
    expect(finalExtras).toContain("pills.map((pill)");
    expect(finalExtras).toContain("readPillClassName(pill.tone)");
    expect(finalExtras).not.toContain("buildLiveAnswerTurnBridgeState");
  });

  it("owns disabled Stage Play action button display while action rows stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const finalExtras = read("client/src/components/helix/ask-console/HelixAskFinalExtras.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("stagePlayEvents: stagePlayChatLedgerEvents");
    expect(legacyPill).toContain("stagePlayEventCount: stagePlayChatLedgerEvents.length");
    expect(legacyPill).not.toContain("<HelixAskStagePlayActionButtons");
    expect(legacyPill).not.toContain("row.actions.map");
    expect(legacyPill).not.toContain("Use the Stage Play graph checkpoint controls for this v1 action.");

    expect(replyTurn).toContain("<HelixAskTurnStreamPanel");
    expect(turnStreamPanel).toContain("<HelixAskStagePlayActionButtons");
    expect(turnStreamPanel).toContain("actions={row.actions}");
    expect(finalExtras).toContain("export function HelixAskStagePlayActionButtons");
    expect(finalExtras).toContain("if (!actions?.length) return null");
    expect(finalExtras).toContain("actions.map((action)");
    expect(finalExtras).toContain("Use the Stage Play graph checkpoint controls for this v1 action.");
    expect(finalExtras).toContain("helix-ask-latest-stage-play-${action.toLowerCase().replace");
    expect(finalExtras).not.toContain("stagePlayChatLedgerEvents");
    expect(finalExtras).not.toContain("buildHelixContinuousTurnStreamRows");
  });

  it("owns structured workstation trace-row admission without final-prose scraping", () => {
    const rows = [
      {
        key: "request",
        role: "assistant",
        label: "Tool Request",
        text: "Tool request: scientific-calculator.solve_expression",
        meta: "workstation_gateway | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "observation",
        role: "tool",
        label: "Tool Observation",
        text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
        meta: "scientific-calculator.solve_expression | workstation_gateway_1 | completed",
        status: "completed",
      },
      {
        key: "reentry",
        role: "assistant",
        label: "Model Re-entry",
        text: "Model re-entry: Codex received the workstation observation packet(s) before final answer.",
        meta: "workstation_gateway | reentry | completed",
        status: "completed",
      },
      {
        key: "final",
        role: "assistant",
        label: "Final",
        text: "Observed expression: 8*9\nResult: 72",
        meta: "terminal | final",
        status: "completed",
      },
    ];

    expect(selectHelixAskConsoleWorkstationTraceRows(rows).map((row) => row.label)).toEqual([
      "Tool Request",
      "Tool Observation",
      "Model Re-entry",
    ]);
    expect(selectHelixAskConsoleTurnTranscriptRowsForStream(rows).map((row) => row.label)).toEqual([
      "Tool Request",
      "Tool Observation",
      "Model Re-entry",
    ]);
    expect(selectHelixAskConsoleWorkstationTraceRows([
      {
        key: "final-prose-only",
        role: "assistant",
        label: "Final",
        text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
        meta: "terminal | final",
        status: "completed",
      },
    ])).toEqual([]);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("selectHelixAskConsoleTurnTranscriptRowsForStream");
  });

  it("owns runtime picker labels and menu-vs-cycle view model", () => {
    const model = buildHelixAskRuntimePickerModel({
      selectedRuntime: "codex",
      providers: [
        {
          id: "helix",
          label: "Helix Ask Native",
          enabled: true,
          experimental: false,
          permission_profile: {
            id: "helix-native",
            label: "Helix native governed runtime",
            allows: { observe: true, read: true, act: true, write: false, shell: false, codeMutation: false },
          },
          supports: { streaming: true, workstationTools: true, codeMutation: false },
        },
        {
          id: "codex",
          label: "Codex Workstation Mode",
          enabled: true,
          experimental: false,
          permission_profile: {
            id: "read-observe-act",
            label: "Read/observe/action",
            allows: { observe: true, read: true, act: true, write: false, shell: false, codeMutation: false },
          },
          supports: { streaming: true, workstationTools: true, codeMutation: false },
        },
        {
          id: "future",
          label: "Future Agent Wrapper",
          enabled: false,
          experimental: true,
          permission_profile: {
            id: "read-observe",
            label: "Read/observe only",
            allows: { observe: true, read: true, act: false, write: false, shell: false, codeMutation: false },
          },
          supports: { streaming: false, workstationTools: false, codeMutation: false },
        },
      ],
    });

    expect(model.selectedLabel).toBe("Codex");
    expect(model.enabledProviderCount).toBe(2);
    expect(model.primaryButtonMode).toBe("cycle");
    expect(model.items.map((item) => ({
      id: item.id,
      shortLabel: item.shortLabel,
      selected: item.selected,
      statusLabel: item.statusLabel,
    }))).toEqual([
      { id: "helix", shortLabel: "Helix", selected: false, statusLabel: "on" },
      { id: "codex", shortLabel: "Codex", selected: true, statusLabel: "on" },
      { id: "future", shortLabel: "Future", selected: false, statusLabel: "off" },
    ]);

    const menuModel = buildHelixAskRuntimePickerModel({
      selectedRuntime: "helix",
      providers: model.items.map((item) => ({
        id: item.id,
        label: item.label,
        enabled: true,
        experimental: item.id === "future",
        permission_profile: {
          id: item.id === "helix" ? "helix-native" : "read-observe-act",
          label: "runtime",
          allows: { observe: true, read: true, act: true, write: false, shell: false, codeMutation: false },
        },
        supports: { streaming: true, workstationTools: true, codeMutation: false },
      })),
    });
    expect(menuModel.enabledProviderCount).toBe(3);
    expect(menuModel.primaryButtonMode).toBe("menu");

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const runtimePicker = read("client/src/components/helix/ask-console/HelixAskRuntimePicker.tsx");
    expect(legacyPill).toContain("buildHelixAskRuntimePickerModel");
    expect(legacyPill).toContain("<HelixAskRuntimePicker");
    expect(legacyPill).toContain("model={agentRuntimePickerModel}");
    expect(legacyPill).toContain("onPrimaryClick={handleAgentRuntimeButtonClick}");
    expect(legacyPill).toContain("onSelect={handleAgentRuntimeSelect}");
    expect(legacyPill).not.toContain("agentRuntimePickerModel.items.map");
    expect(runtimePicker).toContain("model.items.map");
    expect(runtimePicker).toContain('aria-label="Choose Ask agent runtime"');
    expect(runtimePicker).toContain('aria-label="Ask agent runtime"');
    expect(runtimePicker).toContain("disabled={!provider.enabled}");
    expect(runtimePicker).not.toContain('fetch("/api/agi/agent-providers"');
  });

  it("owns prompt composer display state without submit-stream behavior", () => {
    expect(HELIX_ASK_CONSOLE_MAX_PROMPT_LINES).toBe(10);
    expect(buildHelixAskComposerViewModel({
      busy: false,
      placeholder: null,
    })).toMatchObject({
      inputPlaceholder: "Ask anything about this system",
      currentPlaceholder: "Ask anything about this system",
      maxPromptLines: 10,
      submitMode: "submit",
      submitAriaLabel: "Submit prompt",
      submitTitle: "Submit prompt",
      submitButtonType: "submit",
      submitIcon: "search",
    });
    expect(buildHelixAskComposerViewModel({
      busy: true,
      placeholder: "Ask the active doc",
    })).toMatchObject({
      inputPlaceholder: "Ask the active doc",
      currentPlaceholder: "Add another question...",
      maxPromptLines: 10,
      submitMode: "stop",
      submitAriaLabel: "Stop generation",
      submitTitle: "Stop generation",
      submitButtonType: "button",
      submitIcon: "square",
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const composer = read("client/src/components/helix/ask-console/HelixAskComposer.tsx");
    expect(legacyPill).toContain("buildHelixAskComposerViewModel");
    expect(legacyPill).toContain("<HelixAskComposerTextarea");
    expect(legacyPill).toContain("composerViewModel.textareaClassName");
    expect(legacyPill).toContain("onInputValue={(value, target)");
    expect(legacyPill).toContain("onSubmitRequested={(form) => form?.requestSubmit?.()}");
    expect(legacyPill).toContain("<HelixAskComposerSubmitButton");
    expect(legacyPill).toContain("viewModel={composerViewModel}");
    expect(legacyPill).toContain("onSubmitIntent={() => triggerAskActionHaptic()}");
    expect(legacyPill).toContain("handleStop();");
    expect(legacyPill).toContain("handleAskSubmit");
    expect(legacyPill).not.toContain("<textarea\n                aria-label=\"Ask Helix\"");
    expect(legacyPill).not.toContain("viewModel.submitButtonType");
    expect(composer).toContain("export const HelixAskComposerTextarea");
    expect(composer).toContain("export function HelixAskComposerSubmitButton");
    expect(composer).toContain('aria-label="Ask Helix"');
    expect(composer).toContain("onSubmitRequested(event.currentTarget.form)");
    expect(composer).toContain("title={viewModel.submitTitle}");
    expect(composer).toContain("type={viewModel.submitButtonType}");
    expect(composer).toContain("<Square className=");
    expect(composer).toContain("<Search className=");
    expect(composer).not.toContain("handleAskSubmit");
    expect(composer).not.toContain("runAskTurn");
  });

  it("owns action toolbar display while input and capture behavior stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const toolbar = read("client/src/components/helix/ask-console/HelixAskActionToolbar.tsx");

    expect(legacyPill).toContain("<HelixAskActionToolbar");
    expect(legacyPill).toContain("carouselRef={askActionCarouselRef}");
    expect(legacyPill).toContain("imageInputRef={askImageInputRef}");
    expect(legacyPill).toContain("onImageSelect={handleAskImageSelect}");
    expect(legacyPill).toContain("askImageInputRef.current?.click()");
    expect(legacyPill).toContain("handleVoiceInputToggle();");
    expect(legacyPill).toContain("handleVisualSituationSourceCapture();");
    expect(legacyPill).toContain("handleVisualSituationAudioPreferenceToggle();");
    expect(legacyPill).toContain("runtimePicker={");
    expect(legacyPill).toContain("submitButton={");
    expect(legacyPill).not.toContain('title="Attach image"');
    expect(legacyPill).not.toContain("<Plus className=");
    expect(legacyPill).not.toContain("<Mic className=");
    expect(legacyPill).not.toContain("<Headphones");
    expect(legacyPill).not.toContain('aria-label="Scroll Ask controls left"');

    expect(toolbar).toContain("export function HelixAskActionToolbar");
    expect(toolbar).toContain('title="Attach image"');
    expect(toolbar).toContain('const micTitle = micEnabled ? "Disable microphone" : "Enable microphone"');
    expect(toolbar).toContain('title="Capture visual source"');
    expect(toolbar).toContain("const visualAudioTitle = visualSituationIncludeAudio");
    expect(toolbar).toContain("<Plus className=");
    expect(toolbar).toContain("<Mic className=");
    expect(toolbar).toContain("<ImageIcon className=");
    expect(toolbar).toContain("<Headphones");
    expect(toolbar).toContain('aria-label="Scroll Ask controls left"');
    expect(toolbar).toContain('aria-label="Scroll Ask controls right"');
    expect(toolbar).toContain("{runtimePicker}");
    expect(toolbar).toContain("{submitButton}");
    expect(toolbar).not.toContain("handleAskImageSelect");
    expect(toolbar).not.toContain("handleVoiceInputToggle");
    expect(toolbar).not.toContain("handleVisualSituationSourceCapture");
    expect(toolbar).not.toContain("handleVisualSituationAudioPreferenceToggle");
    expect(toolbar).not.toContain("runAskTurn");
    expect(toolbar).not.toContain("navigator.clipboard");
  });

  it("owns the surface frame display while submit and audio priming stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const consoleStack = read("client/src/components/helix/ask-console/HelixAskConsoleStack.tsx");
    const surfaceFrame = read("client/src/components/helix/ask-console/HelixAskSurfaceFrame.tsx");

    expect(legacyPill).toContain("<HelixAskConsoleRuntimeLayout");
    expect(legacyPill).toContain("<HelixAskSurfaceFrame");
    expect(legacyPill).toContain("maxWidthClassName={maxWidthClass}");
    expect(legacyPill).toContain("maxWidthStyle={formMaxWidthStyle}");
    expect(legacyPill).toContain("surfaceBorderClassName={moodPalette.surfaceBorder}");
    expect(legacyPill).toContain("surfaceTintClassName={moodPalette.surfaceTint}");
    expect(legacyPill).toContain("surfaceHaloClassName={moodPalette.surfaceHalo}");
    expect(legacyPill).toContain("isOffline={isOffline}");
    expect(legacyPill).toContain("onSubmit={handleAskSubmit}");
    expect(legacyPill).toContain("void primeVoiceAudioPlayback()");
    expect(legacyPill).not.toContain("shadow-[0_24px_60px_rgba(0,0,0,0.55)]");
    expect(legacyPill).not.toContain("Offline - reconnecting\n");

    expect(consoleStack).toContain("export function HelixAskConsoleStack");
    expect(consoleStack).toContain('layoutVariant === "dock" ? "min-h-0" : ""');
    expect(consoleStack).not.toContain("<form");
    expect(consoleStack).not.toContain("onSubmit");
    expect(consoleStack).not.toContain("runAskTurn");

    expect(surfaceFrame).toContain("export function HelixAskSurfaceFrame");
    expect(surfaceFrame).not.toContain('layoutVariant === "dock" ? "min-h-0" : ""');
    expect(surfaceFrame).toContain("transition-[max-width] duration-300 ease-out");
    expect(surfaceFrame).toContain("shadow-[0_24px_60px_rgba(0,0,0,0.55)]");
    expect(surfaceFrame).toContain("surfaceBorderClassName");
    expect(surfaceFrame).toContain("surfaceTintClassName");
    expect(surfaceFrame).toContain("surfaceHaloClassName");
    expect(surfaceFrame).toContain("onPointerDownCapture={onPrimeInteraction}");
    expect(surfaceFrame).toContain("onTouchStartCapture={onPrimeInteraction}");
    expect(surfaceFrame).toContain("onClickCapture={onPrimeInteraction}");
    expect(surfaceFrame).toContain("Offline - reconnecting");
    expect(surfaceFrame).not.toContain("handleAskSubmit");
    expect(surfaceFrame).not.toContain("primeVoiceAudioPlayback");
    expect(surfaceFrame).not.toContain("moodPalette");
    expect(surfaceFrame).not.toContain("setAskReplies");
    expect(surfaceFrame).not.toContain("runAskTurn");
  });

  it("owns runtime layout slot composition while live state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const runtimeLayout = read("client/src/components/helix/ask-console/HelixAskConsoleRuntimeLayout.tsx");
    const ownershipMap = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(legacyPill).toContain("<HelixAskConsoleRuntimeLayout");
    expect(legacyPill).toContain("surface={");
    expect(legacyPill).toContain("goalPill={askGoalSession ? (");
    expect(legacyPill).toContain("steeringQueue={");
    expect(legacyPill).toContain("errorLine={<HelixAskErrorLine message={askError} />}");
    expect(legacyPill).toContain("turnList={chronologicalAskReplies.length > 0 || visibleActiveTurnStreamRows.length > 0 ? (");
    expect(legacyPill).toContain("debugDrawer={debugExportDrawer ? (");
    expect(legacyPill).toContain("setAskGoalPillExpanded");
    expect(legacyPill).toContain("setSteeringQueueExpanded");
    expect(legacyPill).toContain("setDebugExportDrawer(null)");

    expect(runtimeLayout).toContain("export function HelixAskConsoleRuntimeLayout");
    expect(runtimeLayout).toContain("<HelixAskErrorBoundary>");
    expect(runtimeLayout).toContain("<HelixAskConsoleStack className={className} layoutVariant={layoutVariant}>");
    for (const slot of ["{surface}", "{goalPill}", "{steeringQueue}", "{errorLine}", "{turnList}", "{debugDrawer}"]) {
      expect(runtimeLayout).toContain(slot);
    }
    expect(runtimeLayout).not.toContain("askGoalSession");
    expect(runtimeLayout).not.toContain("chronologicalAskReplies");
    expect(runtimeLayout).not.toContain("setAskGoalPillExpanded");
    expect(runtimeLayout).not.toContain("setSteeringQueueExpanded");
    expect(runtimeLayout).not.toContain("setDebugExportDrawer");
    expect(runtimeLayout).not.toContain("runAskTurn");
    expect(runtimeLayout).not.toContain("fetch(");
    expect(ownershipMap).toContain("Runtime layout slot composition");
    expect(ownershipMap).toContain("HelixAskConsoleRuntimeLayout");
    expect(ownershipMap).toContain("copy/debug/read-aloud bindings");
  });

  it("owns surface composer slot layout while composer behavior stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const composerPanel = read("client/src/components/helix/ask-console/HelixAskSurfaceComposerPanel.tsx");

    expect(legacyPill).toContain("<HelixAskSurfaceComposerPanel");
    expect(legacyPill).toContain("voiceLevelMonitor={");
    expect(legacyPill).toContain("moodAvatar={");
    expect(legacyPill).toContain("actionToolbar={");
    expect(legacyPill).toContain("textarea={");
    expect(legacyPill).toContain("triggerAskActionHaptic");
    expect(legacyPill).toContain("handleAskImageSelect");
    expect(legacyPill).toContain("handleVoiceInputToggle");
    expect(legacyPill).toContain("syncAskDraftValue");
    expect(legacyPill).not.toContain('<div className="flex flex-col gap-2 px-4 py-3">');

    expect(composerPanel).toContain("export function HelixAskSurfaceComposerPanel");
    expect(composerPanel).toContain("{voiceLevelMonitor}");
    expect(composerPanel).toContain("{moodAvatar}");
    expect(composerPanel).toContain("{actionToolbar}");
    expect(composerPanel).toContain("{textarea}");
    expect(composerPanel).toContain('className="flex flex-col gap-2 px-4 py-3"');
    expect(composerPanel).not.toContain("triggerAskActionHaptic");
    expect(composerPanel).not.toContain("handleAskImageSelect");
    expect(composerPanel).not.toContain("handleVoiceInputToggle");
    expect(composerPanel).not.toContain("syncAskDraftValue");
    expect(composerPanel).not.toContain("runAskTurn");
    expect(composerPanel).not.toContain("fetch(");
  });

  it("owns surface supplemental slot order while supplemental behavior stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const supplementStack = read("client/src/components/helix/ask-console/HelixAskSurfaceSupplementStack.tsx");

    expect(legacyPill).toContain("<HelixAskSurfaceSupplementStack");
    for (const slot of [
      "attachments={",
      "contextCapsule={",
      "voiceStatus={",
      "situationRoomSource={",
      "voiceCommandConfirmation={",
      "transcriptConfirmation={",
      "contextChooser={",
      "conversationBrief={",
      "observerLane={",
      "contextMemoryStatus={",
    ]) {
      expect(legacyPill).toContain(slot);
    }
    expect(legacyPill).toContain("handleCommandConfirmationAccept");
    expect(legacyPill).toContain("handleTranscriptConfirmationAccept");
    expect(legacyPill).toContain("handleAskContextChooserRunAttached");
    expect(legacyPill).toContain("stopDisplayAudioCapture");

    expect(supplementStack).toContain("export function HelixAskSurfaceSupplementStack");
    for (const slot of [
      "{attachments}",
      "{contextCapsule}",
      "{voiceStatus}",
      "{situationRoomSource}",
      "{voiceCommandConfirmation}",
      "{transcriptConfirmation}",
      "{contextChooser}",
      "{conversationBrief}",
      "{observerLane}",
      "{contextMemoryStatus}",
    ]) {
      expect(supplementStack).toContain(slot);
    }
    expect(supplementStack).not.toContain("handleCommandConfirmationAccept");
    expect(supplementStack).not.toContain("handleTranscriptConfirmationAccept");
    expect(supplementStack).not.toContain("handleAskContextChooserRunAttached");
    expect(supplementStack).not.toContain("stopDisplayAudioCapture");
    expect(supplementStack).not.toContain("runAskTurn");
    expect(supplementStack).not.toContain("fetch(");
  });

  it("owns busy reasoning panel chrome while reasoning state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const busyPanel = read("client/src/components/helix/ask-console/HelixAskBusyReasoningPanel.tsx");

    expect(legacyPill).toContain("<HelixAskBusyReasoningPanel");
    expect(legacyPill).toContain("visible={askBusy}");
    expect(legacyPill).toContain("liveBorderClassName={moodPalette.liveBorder}");
    expect(legacyPill).toContain("replyTintClassName={moodPalette.replyTint}");
    expect(legacyPill).toContain("<HelixAskReasoningMirekField");
    expect(legacyPill).toContain("reasoningTheaterMeterFillRef");
    expect(legacyPill).toContain("setReasoningTheaterFrontierIconBrokenByPath");
    expect(legacyPill).not.toContain("HelixAskReasoningAnimationStyles");
    expect(legacyPill).not.toContain("relative overflow-hidden border-t px-4 py-2 text-[11px] text-slate-300");

    expect(busyPanel).toContain("export function HelixAskBusyReasoningPanel");
    expect(busyPanel).toContain("if (!visible) return null");
    expect(busyPanel).toContain("HelixAskReasoningAnimationStyles");
    expect(busyPanel).toContain("relative overflow-hidden border-t px-4 py-2 text-[11px] text-slate-300");
    expect(busyPanel).toContain("{children}");
    expect(busyPanel).not.toContain("reasoningTheater");
    expect(busyPanel).not.toContain("mirekReasoningDisplayGrid");
    expect(busyPanel).not.toContain("setReasoningTheater");
    expect(busyPanel).not.toContain("runAskTurn");
    expect(busyPanel).not.toContain("fetch(");
  });

  it("owns render error fallback display outside the legacy bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const errorBoundary = read("client/src/components/helix/ask-console/HelixAskErrorBoundary.tsx");
    const runtimeLayout = read("client/src/components/helix/ask-console/HelixAskConsoleRuntimeLayout.tsx");

    expect(legacyPill).toContain("<HelixAskConsoleRuntimeLayout");
    expect(legacyPill).not.toContain("<HelixAskErrorBoundary>");
    expect(runtimeLayout).toContain("<HelixAskErrorBoundary>");
    expect(runtimeLayout).toContain("</HelixAskErrorBoundary>");
    expect(legacyPill).not.toContain("class HelixAskErrorBoundary");
    expect(legacyPill).not.toContain("The Helix Ask panel hit a rendering error");
    expect(legacyPill).not.toContain("reportClientError(error");

    expect(errorBoundary).toContain("export class HelixAskErrorBoundary");
    expect(errorBoundary).toContain("componentDidCatch(error: Error, info: ErrorInfo)");
    expect(errorBoundary).toContain('scope: "helix-ask"');
    expect(errorBoundary).toContain("The Helix Ask panel hit a rendering error");
    expect(errorBoundary).toContain("this.handleRetry");
    expect(errorBoundary).toContain("window.location.reload()");
    expect(errorBoundary).not.toContain("runAskTurn");
    expect(errorBoundary).not.toContain("setAskReplies");
    expect(errorBoundary).not.toContain("handleAskSubmit");
  });

  it("owns procedural timeline display while row projection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const proceduralTimeline = read("client/src/components/helix/ask-console/HelixAskProceduralTimeline.tsx");

    expect(legacyPill).toContain("function renderProceduralTurnTimeline");
    expect(legacyPill).toContain("reply.debug?.turn_truth_table");
    expect(legacyPill).toContain("ui_answer_equals_terminal_authority_text");
    expect(legacyPill).toContain("replyRecord?.agent_runtime_loop");
    expect(legacyPill).toContain("executed_action_key");
    expect(legacyPill).toContain("<HelixAskProceduralTimeline");
    expect(legacyPill).toContain("rows={rows}");
    expect(legacyPill).toContain("truthMatchesVisible={truthMatchesVisible}");
    expect(legacyPill).toContain("toolLabel={runtimeActionLabels[0] ?? (selectedTool ? readProceduralActionLabel(selectedTool) : null)}");
    expect(legacyPill).not.toContain("Procedural workspace timeline");
    expect(legacyPill).not.toContain("rows.slice(0, 18).map");
    expect(legacyPill).not.toContain("readProceduralStatusClass(row.status)");

    expect(proceduralTimeline).toContain("export function HelixAskProceduralTimeline");
    expect(proceduralTimeline).toContain("Procedural workspace timeline");
    expect(proceduralTimeline).toContain("backend terminal == visible answer");
    expect(proceduralTimeline).toContain("rows.slice(0, 18).map");
    expect(proceduralTimeline).toContain("readProceduralStatusClass(row.status)");
    expect(proceduralTimeline).not.toContain("reply.debug?.turn_truth_table");
    expect(proceduralTimeline).not.toContain("agent_runtime_loop");
    expect(proceduralTimeline).not.toContain("buildVisibleResolvedTurn");
  });

  it("owns reasoning battle stage display while battle state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const battleStage = read("client/src/components/helix/ask-console/HelixAskReasoningBattleStage.tsx");

    expect(legacyPill).toContain("<HelixAskReasoningBattleStage");
    expect(legacyPill).toContain("buildReasoningBattleBeats({");
    expect(legacyPill).toContain("buildReasoningBattleAmbientState({");
    expect(legacyPill).toContain("buildReasoningBattleAnswerTint({");
    expect(legacyPill).not.toContain("function renderReasoningBattleStage");
    expect(legacyPill).not.toContain('data-testid="helix-ask-reasoning-battle-stage"');
    expect(legacyPill).not.toContain("reasoningBattlePrimitiveStyle({ beat, primitive");

    expect(battleStage).toContain("export function HelixAskReasoningBattleStage");
    expect(battleStage).toContain('data-testid={testId ?? "helix-ask-reasoning-battle-stage"}');
    expect(battleStage).toContain("reasoningBattleBeatPrimitive(beat)");
    expect(battleStage).toContain("reasoningBattlePrimitiveStyle({ beat, primitive");
    expect(battleStage).toContain("reasoningBattleAmbientClassName(ambient, staticMotion)");
    expect(battleStage).not.toContain("buildReasoningBattleBeats");
    expect(battleStage).not.toContain("buildReasoningBattleAmbientState");
    expect(battleStage).not.toContain("buildReasoningBattleAnswerTint");
    expect(battleStage).not.toContain("runAskTurn");
    expect(battleStage).not.toContain("fetch(");
  });

  it("owns Mirek reasoning field display while grid derivation stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const mirekField = read("client/src/components/helix/ask-console/HelixAskReasoningMirekField.tsx");
    const ownershipMap = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(legacyPill).toContain("<HelixAskReasoningMirekField");
    expect(legacyPill).toContain("grid={reasoningTheater ? mirekReasoningDisplayGrid : null}");
    expect(legacyPill).toContain("fieldStrength={mirekReasoningFieldStrength}");
    expect(legacyPill).toContain("buildMirekReasoningDisplayGrid");
    expect(legacyPill).not.toContain('data-testid="helix-ask-mirek-field"');
    expect(legacyPill).not.toContain("gridTemplateColumns: `repeat(${mirekReasoningDisplayGrid.width}");
    expect(legacyPill).not.toContain("mirekReasoningDisplayGrid.cells.map");

    expect(mirekField).toContain("export function HelixAskReasoningMirekField");
    expect(mirekField).toContain('data-testid="helix-ask-mirek-field"');
    expect(mirekField).toContain("grid.cells.map((cell, index)");
    expect(mirekField).toContain("mirekCellGridClassName(cell.kind)");
    expect(mirekField).toContain("fieldStrength");
    expect(mirekField).not.toContain("buildMirekReasoningDisplayGrid");
    expect(mirekField).not.toContain("reasoningTheater");
    expect(mirekField).not.toContain("setReasoning");
    expect(mirekField).not.toContain("runAskTurn");
    expect(mirekField).not.toContain("fetch(");
    expect(mirekField).not.toContain("navigator.clipboard");
    expect(ownershipMap).toContain("Mirek reasoning field display");
    expect(ownershipMap).toContain("HelixAskReasoningMirekField");
  });

  it("owns reasoning status and medal strip display while medal state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusMedalStrip = read(
      "client/src/components/helix/ask-console/HelixAskReasoningStatusMedalStrip.tsx",
    );
    const ownershipMap = read("client/src/lib/helix/ASK_UI_OWNERSHIP.md");

    expect(legacyPill).toContain("<HelixAskReasoningStatusMedalStrip");
    expect(legacyPill).toContain("setReasoningTheaterMedalBrokenByToken");
    expect(legacyPill).toContain("reasoningTheaterMedalQueue.map((medalPulse) => ({");
    expect(legacyPill).toContain("REASONING_THEATER_STANCE_META[reasoningTheater.stance].badge");
    expect(legacyPill).not.toContain('alt={`${REASONING_THEATER_MEDAL_LABEL[medalPulse.medal]} medal`}');
    expect(legacyPill).not.toContain("className=\"h-12 w-12 shrink-0 object-contain");

    expect(statusMedalStrip).toContain("export function HelixAskReasoningStatusMedalStrip");
    expect(statusMedalStrip).toContain("medals.map((medal)");
    expect(statusMedalStrip).toContain("alt={`${medal.label} medal`}");
    expect(statusMedalStrip).toContain("onMedalImageError?.(medal.token");
    expect(statusMedalStrip).toContain("latestMedal.reason");
    expect(statusMedalStrip).not.toContain("setReasoningTheaterMedalBrokenByToken");
    expect(statusMedalStrip).not.toContain("reasoningTheaterMedalQueue");
    expect(statusMedalStrip).not.toContain("REASONING_THEATER_STANCE_META");
    expect(statusMedalStrip).not.toContain("REASONING_THEATER_MEDAL_LABEL");
    expect(statusMedalStrip).not.toContain("runAskTurn");
    expect(statusMedalStrip).not.toContain("fetch(");
    expect(statusMedalStrip).not.toContain("navigator.clipboard");
    expect(ownershipMap).toContain("Reasoning status and medal strip display");
    expect(ownershipMap).toContain("HelixAskReasoningStatusMedalStrip");
  });

  it("owns reasoning animation keyframes outside the legacy bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const busyPanel = read("client/src/components/helix/ask-console/HelixAskBusyReasoningPanel.tsx");
    const animationStyles = read("client/src/components/helix/ask-console/HelixAskReasoningAnimationStyles.tsx");

    expect(legacyPill).toContain("<HelixAskBusyReasoningPanel");
    expect(legacyPill).not.toContain("<HelixAskReasoningAnimationStyles />");
    expect(busyPanel).toContain("<HelixAskReasoningAnimationStyles />");
    expect(legacyPill).not.toContain("@keyframes helixReasoningFloatingText{");
    expect(legacyPill).not.toContain("@keyframes helixReasoningBattleBeat{");
    expect(legacyPill).not.toContain("@keyframes helixReasoningBattlePrimitive{");

    expect(animationStyles).toContain("export function HelixAskReasoningAnimationStyles");
    expect(animationStyles).toContain("@keyframes helixReasoningFloatingText{");
    expect(animationStyles).toContain("@keyframes helixReasoningBattleBeat{");
    expect(animationStyles).toContain("@keyframes helixReasoningBattlePrimitive{");
    expect(animationStyles).not.toContain("runAskTurn");
    expect(animationStyles).not.toContain("fetch(");
    expect(animationStyles).not.toContain("@/store/");
  });

  it("owns goal-session pill display while goal actions stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const goalPill = read("client/src/components/helix/ask-console/HelixAskGoalPill.tsx");

    expect(legacyPill).toContain("<HelixAskGoalPill");
    expect(legacyPill).toContain("session={askGoalSession}");
    expect(legacyPill).toContain("expanded={askGoalPillExpanded}");
    expect(legacyPill).toContain("busyAction={askGoalPillBusyAction}");
    expect(legacyPill).toContain("error={askGoalPillError}");
    expect(legacyPill).toContain("onToggleExpanded={() => setAskGoalPillExpanded((current) => !current)}");
    expect(legacyPill).toContain("onAction={handleAskGoalSessionAction}");
    expect(legacyPill).toContain("postHelixAskGoalSessionAction");
    expect(legacyPill).not.toContain('aria-label="Helix Ask goal session"');
    expect(legacyPill).not.toContain('aria-label="Edit goal prompt"');
    expect(legacyPill).not.toContain("formatGoalPillCadence(session.cadence)");
    expect(legacyPill).not.toContain("session.contextFeeds.map");

    expect(goalPill).toContain("export function HelixAskGoalPill");
    expect(goalPill).toContain('aria-label="Helix Ask goal session"');
    expect(goalPill).toContain('aria-controls="helix-ask-goal-pill-details"');
    expect(goalPill).toContain('aria-label="Edit goal prompt"');
    expect(goalPill).toContain('aria-label={isPaused ? "Resume goal" : "Pause goal"}');
    expect(goalPill).toContain('aria-label="Archive goal"');
    expect(goalPill).toContain("formatGoalPillCadence(session.cadence)");
    expect(goalPill).toContain("session.contextFeeds.map");
    expect(goalPill).not.toContain("postHelixAskGoalSessionAction");
    expect(goalPill).not.toContain("setAskGoalPillBusyAction");
    expect(goalPill).not.toContain("fetch(");
  });

  it("owns mood avatar display while mood state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const moodAvatar = read("client/src/components/helix/ask-console/HelixAskMoodAvatar.tsx");

    expect(legacyPill).toContain("<HelixAskMoodAvatar");
    expect(legacyPill).toContain("auraClassName={moodPalette.aura}");
    expect(legacyPill).toContain("ringClassName={moodRingClass}");
    expect(legacyPill).toContain("moodSrc={moodSrc}");
    expect(legacyPill).toContain("moodLabel={moodLabel}");
    expect(legacyPill).toContain("onImageError={() => setAskMoodBroken(true)}");
    expect(legacyPill).toContain("const moodSrc = askMoodBroken ? null : moodAsset?.sources[0] ?? null");
    expect(legacyPill).not.toContain("<BrainCircuit");
    expect(legacyPill).not.toContain('className="h-9 w-9 object-contain"');

    expect(moodAvatar).toContain("export function HelixAskMoodAvatar");
    expect(moodAvatar).toContain("<BrainCircuit");
    expect(moodAvatar).toContain('className="h-9 w-9 object-contain"');
    expect(moodAvatar).toContain("onError={onImageError}");
    expect(moodAvatar).not.toContain("setAskMoodBroken");
    expect(moodAvatar).not.toContain("askMoodBroken");
    expect(moodAvatar).not.toContain("resolveMoodAsset");
  });

  it("owns pure submit admission while leaving stream transport in the bridge", () => {
    expect(buildHelixAskSubmitAdmission({
      entries: ["  first  ", " second "],
      askBusy: false,
      compactionPausePending: false,
      hasPastedTextResumeFrameForSubmit: false,
      attachmentKinds: [],
      allEntriesArePastedTextResumeRecallPrompt: false,
    })).toMatchObject({
      normalizedEntries: ["first", "second"],
      singleEntry: null,
      shouldQueueForAskHandoff: false,
      queueReason: null,
      shouldReleaseConsumedPastedTextAttachmentForResume: false,
      shouldBlockQueuedAttachments: false,
      firstEntry: "first",
      restEntries: ["second"],
    });

    expect(buildHelixAskSubmitAdmission({
      entries: ["next question"],
      askBusy: true,
      compactionPausePending: false,
      hasPastedTextResumeFrameForSubmit: false,
      attachmentKinds: ["image"],
      allEntriesArePastedTextResumeRecallPrompt: false,
    })).toMatchObject({
      singleEntry: "next question",
      shouldQueueForAskHandoff: true,
      queueReason: "busy",
      shouldBlockQueuedAttachments: true,
    });

    expect(buildHelixAskSubmitAdmission({
      entries: ["resume from pasted text"],
      askBusy: false,
      compactionPausePending: true,
      hasPastedTextResumeFrameForSubmit: true,
      attachmentKinds: ["text"],
      allEntriesArePastedTextResumeRecallPrompt: true,
    })).toMatchObject({
      shouldQueueForAskHandoff: true,
      queueReason: "compaction_pause",
      shouldReleaseConsumedPastedTextAttachmentForResume: true,
      shouldBlockQueuedAttachments: false,
    });

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskSubmitAdmission");
    expect(legacyPill).toContain("void runAsk(first, selectedCapsuleIds, runOptions)");
  });

  it("builds a minimal shell submit plan without starting transport", () => {
    expect(buildHelixAskMinimalRuntimeSubmitPlan({
      draft: "  summarize current doc  ",
      selectedRuntime: "codex",
      desktopUrl: "http://127.0.0.1:1498/desktop?doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    })).toEqual({
      admission: {
        normalizedEntries: ["summarize current doc"],
        singleEntry: "summarize current doc",
        shouldQueueForAskHandoff: false,
        queueReason: null,
        shouldReleaseConsumedPastedTextAttachmentForResume: false,
        shouldBlockQueuedAttachments: false,
        firstEntry: "summarize current doc",
        restEntries: [],
      },
      context: {
        activeDocPath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      },
      envelope: {
        question: "summarize current doc",
        agent_runtime: "codex",
        doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      },
    });

    expect(buildHelixAskMinimalRuntimeSubmitPlan({
      draft: "   ",
      selectedRuntime: "helix",
      desktopUrl: "http://127.0.0.1:1498/desktop",
    }).envelope).toBeNull();

    const submitPlanSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeSubmitPlan.ts",
    );
    for (const forbidden of [
      "fetch(",
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
    ]) {
      expect(submitPlanSource).not.toContain(forbidden);
    }
  });

  it("starts the minimal runtime optimistic turn lifecycle without backend transport", () => {
    const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
      draft: "  summarize current doc  ",
      selectedRuntime: "codex",
      desktopUrl: "http://127.0.0.1:1498/desktop?doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    });
    expect(startHelixAskMinimalRuntimeTurn({
      state: createHelixAskMinimalRuntimeInitialState(),
      submitPlan,
      turnId: "ask:test-turn",
      startedAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
    })).toEqual({
      askBusy: true,
      askStatus: "Interpreting prompt...",
      activeTurnId: "ask:test-turn",
      activeStartedAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
      replies: [
        {
          id: "ask:test-turn",
          turn_id: "ask:test-turn",
          createdAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
          content: "Reasoning in progress...",
          question: "summarize current doc",
          mode: "observe",
          liveEvents: [
            {
              id: "turn-start:ask:test-turn",
              text: "Turn started.",
              tool: "helix.ask.client",
              ts: "2026-06-29T12:00:00.000Z",
              tsMs: Date.UTC(2026, 5, 29, 12, 0, 0),
              meta: {
                kind: "client_optimistic_turn_start",
                turn_id: "ask:test-turn",
                assistant_answer: false,
              },
            },
          ],
        },
      ],
    });

    const lifecycleSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeLifecycle.ts",
    );
    for (const forbidden of [
      "fetch(",
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
    ]) {
      expect(lifecycleSource).not.toContain(forbidden);
    }
  });

  it("records minimal runtime stream events without using the legacy bridge", () => {
    const started = startHelixAskMinimalRuntimeTurn({
      state: createHelixAskMinimalRuntimeInitialState(),
      submitPlan: buildHelixAskMinimalRuntimeSubmitPlan({
        draft: "summarize current doc",
        selectedRuntime: "codex",
        desktopUrl: "http://127.0.0.1:1498/desktop",
      }),
      turnId: "ask:test-turn",
      startedAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
    });

    expect(recordHelixAskMinimalRuntimeStreamEvent({
      state: started,
      turnId: "ask:test-turn",
      eventName: "turn_delta",
      receivedAtMs: Date.UTC(2026, 5, 29, 12, 0, 1),
    }).replies[0]?.liveEvents.at(-1)).toEqual({
      id: "turn-stream:ask:test-turn:1",
      text: "Stream event: turn_delta",
      tool: "helix.ask.client",
      ts: "2026-06-29T12:00:01.000Z",
      tsMs: Date.UTC(2026, 5, 29, 12, 0, 1),
      meta: {
        kind: "client_transport_stream_event",
        turn_id: "ask:test-turn",
        stream_event: "turn_delta",
        assistant_answer: false,
      },
    });
  });

  it("builds and runs the minimal runtime transport through an injected runner", async () => {
    const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
      draft: "  summarize current doc  ",
      selectedRuntime: "codex",
      desktopUrl: "http://127.0.0.1:1498/desktop?doc=docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    });
    const payload = buildHelixAskMinimalRuntimeTurnPayload({
      submitPlan,
      sessionId: "session-1",
      traceId: "ask:test-turn",
      turnId: "ask:test-turn",
      maxTokens: 8192,
    });
    expect(payload).toEqual({
      sessionId: "session-1",
      agentRuntime: "codex",
      traceId: "ask:test-turn",
      turnId: "ask:test-turn",
      maxTokens: 8192,
      question: "summarize current doc",
      contextFiles: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
    });

    const seenEvents: unknown[] = [];
    const result = await runHelixAskMinimalRuntimeInjectedTransport({
      payload: payload!,
      onEvent: (event) => seenEvents.push(event),
      runner: async (runnerPayload, onEvent) => {
        onEvent?.({ event: "turn_final", data: { ok: true } });
        return {
          text: `ok:${runnerPayload.turnId}`,
          turn_id: runnerPayload.turnId,
        };
      },
    });
    expect(seenEvents).toEqual([{ event: "turn_final", data: { ok: true } }]);
    expect(result).toEqual({
      text: "ok:ask:test-turn",
      turn_id: "ask:test-turn",
    });

    const transportSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeTransport.ts",
    );
    for (const forbidden of [
      "fetch(",
      "runAskTurn(",
      "runAskTurnStream(",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
    ]) {
      expect(transportSource).not.toContain(forbidden);
    }
  });

  it("wraps backend stream transport with fallback for the minimal runtime shell", async () => {
    const payload = {
      agentRuntime: "codex" as const,
      traceId: "ask:test-turn",
      turnId: "ask:test-turn",
      maxTokens: 8192,
      question: "summarize current doc",
      contextFiles: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
    };
    const streamRunner = createHelixAskMinimalRuntimeBackendRunner({
      runStream: async (runnerPayload, onEvent) => {
        onEvent?.({ event: "turn_final", data: { ok: true } });
        return {
          text: `stream:${runnerPayload.turnId}`,
          turn_id: runnerPayload.turnId,
          debug: { stream_used: true },
        };
      },
      runFallback: async () => {
        throw new Error("fallback should not run");
      },
    });
    const streamEvents: unknown[] = [];
    await expect(streamRunner(payload, (event) => streamEvents.push(event))).resolves.toEqual({
      text: "stream:ask:test-turn",
      turn_id: "ask:test-turn",
      debug: { stream_used: true },
    });
    expect(streamEvents).toEqual([{ event: "turn_final", data: { ok: true } }]);

    const fallbackRunner = createHelixAskMinimalRuntimeBackendRunner({
      runStream: async () => {
        throw new Error("stream unavailable");
      },
      runFallback: async (runnerPayload) => ({
        text: `fallback:${runnerPayload.turnId}`,
        turn_id: runnerPayload.turnId,
        debug: { stream_used: false },
      }),
    });
    await expect(fallbackRunner(payload)).resolves.toEqual({
      text: "fallback:ask:test-turn",
      turn_id: "ask:test-turn",
      debug: {
        stream_used: false,
        stream_fallback_reason: "stream unavailable",
      },
    });

    const backendRunnerSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeBackendRunner.ts",
    );
    expect(backendRunnerSource).toContain('await import("@/lib/agi/api")');
    expect(backendRunnerSource).toContain("runAskTurnStream");
    expect(backendRunnerSource).toContain("runAskTurn");
    for (const forbidden of [
      "fetch(",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
    ]) {
      expect(backendRunnerSource).not.toContain(forbidden);
    }
  });

  it("completes and fails minimal runtime injected turns without backend authority decisions", () => {
    const started = startHelixAskMinimalRuntimeTurn({
      state: createHelixAskMinimalRuntimeInitialState(),
      submitPlan: buildHelixAskMinimalRuntimeSubmitPlan({
        draft: "summarize current doc",
        selectedRuntime: "codex",
        desktopUrl: "http://127.0.0.1:1498/desktop",
      }),
      turnId: "ask:test-turn",
      startedAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
    });

    expect(completeHelixAskMinimalRuntimeTurn({
      state: started,
      turnId: "ask:test-turn",
      result: {
        selected_final_answer: "Grounded final answer.",
        text: "Fallback text.",
        debug: { turn_id: "ask:test-turn" },
      },
      completedAtMs: Date.UTC(2026, 5, 29, 12, 1, 0),
    })).toMatchObject({
      askBusy: false,
      askStatus: "Final answer ready.",
      activeTurnId: null,
      activeStartedAtMs: null,
      replies: [
        {
          turn_id: "ask:test-turn",
          content: "Grounded final answer.",
          debug: { turn_id: "ask:test-turn" },
          liveEvents: [
            { id: "turn-start:ask:test-turn" },
            {
              id: "turn-final:ask:test-turn",
              text: "Final answer ready.",
              meta: {
                kind: "client_transport_turn_final",
                turn_id: "ask:test-turn",
                assistant_answer: false,
              },
            },
          ],
        },
      ],
    });

    expect(failHelixAskMinimalRuntimeTurn({
      state: started,
      turnId: "ask:test-turn",
      error: new Error("stream unavailable"),
      failedAtMs: Date.UTC(2026, 5, 29, 12, 2, 0),
    })).toMatchObject({
      askBusy: false,
      askStatus: "Ask turn failed.",
      activeTurnId: null,
      activeStartedAtMs: null,
      replies: [
        {
          turn_id: "ask:test-turn",
          content: "stream unavailable",
          liveEvents: [
            { id: "turn-start:ask:test-turn" },
            {
              id: "turn-error:ask:test-turn",
              text: "stream unavailable",
              meta: {
                kind: "client_transport_turn_error",
                turn_id: "ask:test-turn",
                assistant_answer: false,
              },
            },
          ],
        },
      ],
    });
  });

  it("renders minimal runtime local turns through recrowned final-answer display", () => {
    const started = startHelixAskMinimalRuntimeTurn({
      state: createHelixAskMinimalRuntimeInitialState(),
      submitPlan: buildHelixAskMinimalRuntimeSubmitPlan({
        draft: "calculate 8*9",
        selectedRuntime: "codex",
        desktopUrl: "http://127.0.0.1:1498/desktop",
      }),
      turnId: "ask:test-turn",
      startedAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
    });
    const completed = completeHelixAskMinimalRuntimeTurn({
      state: started,
      turnId: "ask:test-turn",
      result: {
        selected_final_answer: "Observed expression: 8*9\nResult: 72",
        text: "fallback",
        turn_id: "ask:test-turn",
        agent_runtime: "codex",
        selected_agent_provider: {
          id: "codex",
          label: "Codex Workstation Mode",
        },
        model: "gpt-5",
        debug: {
          turn_id: "ask:test-turn",
          turn_transcript_events: [
            {
              source_event_type: "tool_request",
              role: "assistant",
              text: "Tool request: scientific-calculator.solve_expression",
              status: "completed",
              tool: "workstation_gateway",
            },
            {
              source_event_type: "tool_observation",
              role: "tool",
              text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
              status: "completed",
              tool: "scientific-calculator.solve_expression",
            },
            {
              source_event_type: "model_reentry",
              role: "assistant",
              text: "Model re-entry: Codex received the workstation observation packet before final answer.",
              status: "completed",
              tool: "workstation_gateway",
            },
          ],
        },
      },
      completedAtMs: Date.UTC(2026, 5, 29, 12, 1, 0),
    });

    expect(buildHelixAskMinimalRuntimeTurnViews({
      replies: completed.replies,
    })).toEqual([
      {
        id: "ask:test-turn",
        turnId: "ask:test-turn",
        question: "calculate 8*9",
        answerText: "Observed expression: 8*9\nResult: 72",
        meta: "Provider: Codex Workstation Mode | Model: gpt-5",
        isLatest: true,
        workstationTraceRows: [
          expect.objectContaining({
            label: "Tool Request",
            text: "workstation_gateway: Tool request: scientific-calculator.solve_expression",
            status: "completed",
          }),
          expect.objectContaining({
            label: "Tool Observation",
            text: "Tool observation: scientific-calculator.solve_expression observed expression 8*9 result 72",
            status: "completed",
          }),
          expect.objectContaining({
            label: "Model Re-entry",
            text: "workstation_gateway: Model re-entry: Codex received the workstation observation packet before final answer.",
            status: "completed",
          }),
        ],
      },
    ]);

    const turnListSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeTurnList.tsx",
    );
    expect(turnListSource).toContain("HelixAskTurnList");
    expect(turnListSource).toContain("HelixAskReplyCard");
    expect(turnListSource).toContain("HelixAskFinalAnswer");
    expect(turnListSource).toContain("HelixAskTurnControls");
    expect(turnListSource).toContain("buildHelixAskMinimalRuntimeControlPayload");
    expect(turnListSource).toContain("buildHelixTurnTranscriptRows");
    expect(turnListSource).toContain("selectHelixAskConsoleWorkstationTraceRows");
    expect(turnListSource).toContain("helix-ask-minimal-runtime-workstation-trace");
    expect(turnListSource).toContain("copyFinalTestId=\"helix-ask-latest-copy-final\"");
    expect(turnListSource).toContain("debugCopyTestId=\"helix-ask-latest-debug-copy\"");
    expect(turnListSource).toContain("readAloudTestId=\"helix-ask-latest-read-aloud\"");
    expect(turnListSource).toContain("resolveHelixAskActualAgentProviderLabel");
    expect(turnListSource).toContain("resolveHelixAskModelUsageLabel");
    for (const forbidden of [
      "fetch(",
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
    ]) {
      expect(turnListSource).not.toContain(forbidden);
    }
  });

  it("binds minimal runtime copy, debug copy, and read-aloud payloads to the latest visible turn", () => {
    const started = startHelixAskMinimalRuntimeTurn({
      state: createHelixAskMinimalRuntimeInitialState(),
      submitPlan: buildHelixAskMinimalRuntimeSubmitPlan({
        draft: "calculate 8*9",
        selectedRuntime: "codex",
        desktopUrl: "http://127.0.0.1:1498/desktop",
      }),
      turnId: "ask:test-turn",
      startedAtMs: Date.UTC(2026, 5, 29, 12, 0, 0),
    });
    const completed = completeHelixAskMinimalRuntimeTurn({
      state: started,
      turnId: "ask:test-turn",
      result: {
        selected_final_answer: "Observed expression: 8*9\nResult: 72",
        turn_id: "ask:test-turn",
        agent_runtime: "codex",
        debug: {
          debug_export_ref: "debug:ask:test-turn",
          turn_id: "ask:test-turn",
        },
      },
      completedAtMs: Date.UTC(2026, 5, 29, 12, 1, 0),
    });
    const [view] = buildHelixAskMinimalRuntimeTurnViews({ replies: completed.replies });
    const [reply] = completed.replies;
    expect(reply).toBeTruthy();
    expect(view).toBeTruthy();

    const payload = buildHelixAskMinimalRuntimeControlPayload({
      reply: reply!,
      view: view!,
    });
    expect(payload).toMatchObject({
      replyId: "ask:test-turn",
      turnId: "ask:test-turn",
      isLatest: true,
      finalAnswerText: "Observed expression: 8*9\nResult: 72",
      readAloudText: "Observed expression: 8*9\nResult: 72",
    });
    expect(JSON.parse(payload.debugCopyText)).toMatchObject({
      schema: "helix.ask.minimal_runtime.debug_copy.v1",
      reply_id: "ask:test-turn",
      turn_id: "ask:test-turn",
      is_latest: true,
      question: "calculate 8*9",
      final_answer: "Observed expression: 8*9\nResult: 72",
      debug: {
        debug_export_ref: "debug:ask:test-turn",
        turn_id: "ask:test-turn",
      },
      result: {
        turn_id: "ask:test-turn",
      },
    });
    expect(buildHelixAskMinimalRuntimeDebugCopyText({
      reply: reply!,
      view: view!,
    })).toBe(payload.debugCopyText);

    const controlsSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeControls.ts",
    );
    expect(controlsSource).toContain("navigator.clipboard.writeText");
    expect(controlsSource).toContain("document.execCommand(\"copy\")");
    expect(controlsSource).toContain("SpeechSynthesisUtterance");
    expect(controlsSource).toContain("HELIX_ASK_MINIMAL_RUNTIME_BROWSER_CONTROL_ACTIONS");
    for (const forbidden of [
      "fetch(",
      "runAskTurn",
      "runAskTurnStream",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
      "useAgiChatStore",
    ]) {
      expect(controlsSource).not.toContain(forbidden);
    }
  });

  it("materializes minimal runtime debug copy from the matching backend export only", async () => {
    const payload = {
      replyId: "reply-latest",
      turnId: "ask:latest-turn",
      isLatest: true,
      finalAnswerText: "Visible latest answer.",
      readAloudText: "Visible latest answer.",
      debugCopyText: JSON.stringify({
        schema: "helix.ask.minimal_runtime.debug_copy.v1",
        turn_id: "ask:latest-turn",
        final_answer: "Visible latest answer.",
      }),
      debugSource: {
        debug_export_ref: {
          endpoint: "/api/agi/ask/turn/ask%3Alatest-turn/debug-export",
          turn_id: "ask:latest-turn",
        },
      },
    };
    const requests: unknown[] = [];
    const materialized = await materializeHelixAskMinimalRuntimeDebugCopyText({
      payload,
      materializeBackendDebugExport: async (request) => {
        requests.push(request);
        return {
          payload: {
            schema: "helix.ask.debug_export.v1",
            active_turn_id: request.turnId,
            selected_final_answer: "Visible latest answer.",
            debug_export_source: "backend_endpoint",
          },
        };
      },
    });

    expect(requests).toEqual([
      {
        replyId: "reply-latest",
        turnId: "ask:latest-turn",
        fallbackDebugCopyText: payload.debugCopyText,
        debugExportRef: {
          endpoint: "/api/agi/ask/turn/ask%3Alatest-turn/debug-export",
          turn_id: "ask:latest-turn",
        },
        endpoint: "/api/agi/ask/turn/ask%3Alatest-turn/debug-export",
      },
    ]);
    expect(JSON.parse(materialized)).toMatchObject({
      schema: "helix.ask.debug_export.v1",
      active_turn_id: "ask:latest-turn",
      debug_export_source: "backend_endpoint",
    });

    const stalePayload = {
      ...payload,
      debugSource: {
        debug_export_ref: {
          endpoint: "/api/agi/ask/turn/old-turn/debug-export",
          turn_id: "old-turn",
        },
      },
    };
    await expect(materializeHelixAskMinimalRuntimeDebugCopyText({
      payload: stalePayload,
      materializeBackendDebugExport: async () => {
        throw new Error("stale backend request should not run");
      },
    })).resolves.toBe(payload.debugCopyText);

    await expect(materializeHelixAskMinimalRuntimeDebugCopyText({
      payload: {
        ...payload,
        isLatest: false,
      },
      materializeBackendDebugExport: async () => "not used",
    })).resolves.toBe(payload.debugCopyText);

    expect(readHelixAskMinimalRuntimeDebugExportRef({
      debug: {
        debug_export_ref: {
          endpoint: "/api/agi/ask/turn/ask%3Alatest-turn/debug-export",
          turn_id: "ask:latest-turn",
        },
      },
    })).toEqual({
      endpoint: "/api/agi/ask/turn/ask%3Alatest-turn/debug-export",
      turn_id: "ask:latest-turn",
    });
    expect(buildHelixAskMinimalRuntimeDebugExportRequest({
      ...payload,
      debugSource: null,
    })).toMatchObject({
      replyId: "reply-latest",
      turnId: "ask:latest-turn",
      endpoint: "/api/agi/ask/turn/ask%3Alatest-turn/debug-export",
      debugExportRef: null,
    });

    const debugExportSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeDebugExport.ts",
    );
    expect(debugExportSource).toContain("HELIX_ASK_MINIMAL_RUNTIME_BACKEND_DEBUG_EXPORT_MATERIALIZER");
    expect(debugExportSource).toContain("/api/agi/ask/turn/");
    expect(debugExportSource).toContain("turn_id");
    for (const forbidden of [
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
      "runAskTurn",
      "runAskTurnStream",
      "terminal_authority",
      "speechSynthesis",
    ]) {
      expect(debugExportSource).not.toContain(forbidden);
    }
  });

  it("hydrates minimal runtime replies from durable chat sessions", () => {
    expect(buildHelixAskMinimalRuntimeRepliesFromChatSession({
      id: "session-1",
      title: "Helix Ask",
      createdAt: "2026-06-29T12:00:00.000Z",
      updatedAt: "2026-06-29T12:02:00.000Z",
      personaId: "default",
      contextId: "ctx",
      messages: [
        {
          id: "assistant-late",
          role: "assistant",
          content: "Hydrated answer.",
          at: "2026-06-29T12:02:00.000Z",
          traceId: "turn-1",
        },
        {
          id: "user-early",
          role: "user",
          content: "Hydrate this turn",
          at: "2026-06-29T12:00:00.000Z",
          traceId: "turn-1",
        },
      ],
    })).toEqual([
      {
        id: "helix-chat-turn:session-1:turn-1",
        turn_id: "turn-1",
        createdAtMs: Date.parse("2026-06-29T12:02:00.000Z"),
        content: "Hydrated answer.",
        question: "Hydrate this turn",
        mode: "observe",
        debug: {
          durable_chat_projection: true,
          session_id: "session-1",
          user_message_id: "user-early",
          assistant_message_id: "assistant-late",
          turn_id: "turn-1",
        },
        result: {
          selected_final_answer: "Hydrated answer.",
          turn_id: "turn-1",
          debug: {
            durable_chat_projection: true,
            session_id: "session-1",
          },
        },
        liveEvents: [],
      },
    ]);

    const chatSessionSource = read(
      "client/src/components/helix/ask-console/HelixAskMinimalRuntimeChatSession.ts",
    );
    for (const forbidden of [
      "fetch(",
      "runAskTurn",
      "runAskTurnStream",
      "navigator.clipboard",
      "speechSynthesis",
      "AudioContext",
      "terminal_authority",
      "HelixAskLegacyRuntimeBridge",
      "@/components/helix/HelixAskPill",
      "useAgiChatStore",
    ]) {
      expect(chatSessionSource).not.toContain(forbidden);
    }
  });

  it("owns pure durable chat-session projection while policy stays injected", () => {
    const replies = buildHelixAskRepliesFromChatSessionProjection({
      session: {
        id: "session-1",
        messages: [
          {
            id: "assistant-late",
            role: "assistant",
            content: "Later answer",
            at: "2026-06-30T12:02:00.000Z",
          },
          {
            id: "user-early",
            role: "user",
            content: "What changed?",
            at: "2026-06-30T12:00:00.000Z",
            traceId: "trace-1",
          },
          {
            id: "assistant-early",
            role: "assistant",
            content: "  First answer  ",
            at: "2026-06-30T12:01:00.000Z",
          },
        ],
      },
      policy: {
        backendEntrypointRequiredErrorCode: "backend_ask_entry_required",
        backendEntrypointRequiredText: "Backend required.",
        isProgressPlaceholderText: (text) => text === "Generating...",
        requiresBackendEntrypoint: (question) => question.includes("tool"),
        isInvalidTerminalAnswerText: (text) => text === "invalid",
        renderTypedFailureFallback: (code) => `typed failure: ${code}`,
        nowMs: () => 123,
      },
    });

    expect(replies).toHaveLength(2);
    expect(replies[0]).toMatchObject({
      id: "helix-chat-turn:session-1:trace-1",
      content: "First answer",
      question: "What changed?",
      turn_id: "trace-1",
      ok: true,
      final_answer_source: "durable_chat_session",
      terminal_artifact_kind: "chat_final_answer",
      debug: {
        durable_chat_projection: true,
        blocked_projection_kind: null,
        session_id: "session-1",
        user_message_id: "user-early",
        assistant_message_id: "assistant-early",
      },
    });
    expect(replies[1]).toMatchObject({
      id: "helix-chat-turn:session-1:standalone:assistant-late",
      content: "Later answer",
      question: "",
    });
  });

  it("keeps durable chat projection from bypassing hard backend or terminal authority", () => {
    const replies = buildHelixAskRepliesFromChatSessionProjection({
      session: {
        id: "session-2",
        messages: [
          {
            id: "user-tool",
            role: "user",
            content: "Use calculator tool",
            at: "2026-06-30T12:00:00.000Z",
          },
          {
            id: "assistant-tool",
            role: "assistant",
            content: "Tool-looking durable answer",
            at: "2026-06-30T12:01:00.000Z",
          },
          {
            id: "user-invalid",
            role: "user",
            content: "Normal question",
            at: "2026-06-30T12:02:00.000Z",
          },
          {
            id: "assistant-invalid",
            role: "assistant",
            content: "invalid",
            at: "2026-06-30T12:03:00.000Z",
          },
        ],
      },
      policy: {
        backendEntrypointRequiredErrorCode: "backend_ask_entry_required",
        backendEntrypointRequiredText: "Backend required.",
        isProgressPlaceholderText: () => false,
        requiresBackendEntrypoint: (question) => question.includes("tool"),
        isInvalidTerminalAnswerText: (text) => text === "invalid",
        renderTypedFailureFallback: (code) => `typed failure: ${code}`,
      },
    });

    expect(replies.map((reply) => reply.content)).toEqual([
      "Backend required.",
      "typed failure: terminal_authority_missing",
    ]);
    expect(replies.map((reply) => reply.terminal_error_code)).toEqual([
      "backend_ask_entry_required",
      "terminal_authority_missing",
    ]);
    expect(replies.every((reply) => reply.final_answer_source === "typed_failure")).toBe(true);
  });

  it("suppresses generated Stage Play mailbox durable projections", () => {
    expect(shouldSuppressGeneratedStagePlayMailWakeChatProjection(
      {
        id: "user-mail",
        role: "user",
        content: "stage_play_live_source_mail_wake:abc",
        at: "2026-06-30T12:00:00.000Z",
      },
      {
        id: "assistant-mail",
        role: "assistant",
        content: "The live-source mailbox route completed.",
        at: "2026-06-30T12:01:00.000Z",
      },
    )).toBe(true);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("buildHelixAskRepliesFromChatSessionProjection");
    expect(legacyPill).not.toContain("STAGE_PLAY_MAIL_WAKE_PROMPT_PATTERNS");
  });

  it("owns pure reply lifecycle ordering while state mutation stays in the bridge", () => {
    const replies = [
      {
        id: "late",
        content: "late",
        createdAtMs: 300,
      },
      {
        id: "first-shell",
        turn_id: "same-turn",
        content: "old",
        createdAtMs: 200,
      },
      {
        id: "first-update",
        turn_id: "same-turn",
        content: "new",
        debug: { created_at_ms: 100 },
      },
    ];

    expect(resolveHelixAskConsoleReplyCanonicalKey(replies[1])).toBe("same-turn");
    expect(sortHelixAskConsoleRepliesChronologically(replies).map((reply) => reply.id)).toEqual([
      "first-shell",
      "late",
    ]);
    expect(sortHelixAskConsoleRepliesChronologically(replies)[0]).toMatchObject({
      id: "first-shell",
      content: "new",
      createdAtMs: 200,
    });
    expect(appendHelixAskConsoleReplyChronologically(replies.slice(0, 1), {
      id: "early",
      content: "early",
      createdAtMs: 100,
    }, 2).map((reply) => reply.id)).toEqual(["early", "late"]);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    expect(legacyPill).toContain("appendHelixAskConsoleReplyChronologically");
    expect(legacyPill).toContain("setAskReplies");
  });

  it("owns pure active stream and brief-lane reply decisions", () => {
    expect(shouldRenderHelixAskConsoleActiveTurnStream({
      askBusy: true,
      activeTurnId: "active-turn",
      latestReply: {
        id: "reply",
        turn_id: "completed-turn",
        content: "done",
      },
    })).toBe(true);
    expect(shouldRenderHelixAskConsoleActiveTurnStream({
      askBusy: true,
      activeTurnId: "active-turn",
      latestReply: {
        id: "reply",
        turn_id: "active-turn",
        content: "done",
      },
    })).toBe(false);
    expect(shouldKeepHelixAskConsoleReplyInBriefLane({
      answer_path: ["ForcedAnswer:Smalltalk_Fast_Path"],
    })).toBe(true);
    expect(shouldKeepHelixAskConsoleReplyInBriefLane({
      answer_path: ["normal"],
    })).toBe(false);
  });

  it("owns pure chat persistence payloads while store mutation stays in the bridge", () => {
    expect(buildHelixAskConsoleChatMessagePayload({
      role: "user",
      content: "Ask the active doc.",
      traceId: " trace-1 ",
    })).toEqual({
      role: "user",
      content: "Ask the active doc.",
      traceId: "trace-1",
    });
    expect(buildHelixAskConsoleChatMessagePayload({
      role: "assistant",
      content: "",
      traceId: "trace-1",
    })).toBeNull();
    expect(buildHelixAskConsoleChatTurnPayloads({
      userContent: "Question",
      assistantContent: "Answer",
      traceId: "turn-1",
    })).toEqual([
      { role: "user", content: "Question", traceId: "turn-1" },
      { role: "assistant", content: "Answer", traceId: "turn-1" },
    ]);

    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const chatPersistence = read("client/src/components/helix/ask-console/HelixAskChatPersistence.ts");
    expect(legacyPill).toContain("buildHelixAskConsoleChatMessagePayload");
    expect(legacyPill).toContain("addHelixAskLegacyChatMessage(addMessage");
    expect(legacyPill).toContain("addHelixAskLegacyChatTurnMessages(addMessage");
    expect(legacyPill).not.toContain('addMessage(sessionId, { role: "user"');
    expect(legacyPill).not.toContain('addMessage(sessionId, { role: "assistant"');
    expect(legacyPill).not.toContain("userMessagePayload");
    expect(legacyPill).not.toContain("assistantMessagePayload");
    expect(chatPersistence).not.toContain("addMessage");
    expect(chatPersistence).not.toContain("setActive");
    expect(chatPersistence).not.toContain("ensureContextSession");
  });

  it("owns final-answer control button display while the bridge keeps behavior handlers", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const turnStreamPanel = read("client/src/components/helix/ask-console/HelixAskTurnStreamPanel.tsx");
    const turnControls = read("client/src/components/helix/ask-console/HelixAskTurnControls.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain(
      "onCopyFinal: () => void handleCopyReply(reply, latestTurnBinding.controlTarget.finalAnswerText)",
    );
    expect(legacyPill).toContain(
      "onReadAloud: () => void handleReadAloud(reply, latestTurnBinding.controlTarget.finalAnswerText)",
    );
    expect(legacyPill).toContain("debugCopyTestId: latestTurnBinding.debugCopyTestId");
    expect(legacyPill).not.toContain("<Copy className=");
    expect(legacyPill).not.toContain("<Bug className=");
    expect(legacyPill).not.toContain("<Volume2 className=");

    expect(replyTurn).toContain("<HelixAskTurnStreamPanel");
    expect(turnStreamPanel).toContain("<HelixAskTurnControls");
    expect(turnStreamPanel).toContain("onCopyFinal={onCopyFinal}");
    expect(turnStreamPanel).toContain("onDebugCopy={onDebugCopy}");
    expect(turnStreamPanel).toContain("onReadAloud={onReadAloud}");
    expect(turnControls).toContain('aria-label="Copy response"');
    expect(turnControls).toContain('title="Unified Debug Copy"');
    expect(turnControls).toContain("readAloudActive");
    expect(turnControls).not.toContain("handleCopyReply");
    expect(turnControls).not.toContain("handleCopyReplyMasterDebug");
    expect(turnControls).not.toContain("handleReadAloud");
    expect(turnControls).not.toContain("navigator.clipboard");
    expect(turnControls).not.toContain("speechSynthesis");
  });

  it("owns debug export drawer display while the bridge keeps selected drawer state", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const debugDrawer = read("client/src/components/helix/ask-console/HelixAskDebugDrawer.tsx");

    expect(legacyPill).toContain("<HelixAskDebugDrawer");
    expect(legacyPill).toContain("payload={debugExportDrawer.payload}");
    expect(legacyPill).toContain("readbackMatch={debugExportDrawer.result.readback_match}");
    expect(legacyPill).toContain("onClose={() => setDebugExportDrawer(null)}");
    expect(legacyPill).not.toContain('data-testid="helix-debug-export-json"');
    expect(legacyPill).not.toContain("Download JSON");

    expect(debugDrawer).toContain('aria-label="Debug Export drawer"');
    expect(debugDrawer).toContain('data-testid="helix-debug-export-drawer"');
    expect(debugDrawer).toContain('data-testid="helix-debug-export-json"');
    expect(debugDrawer).toContain("download={`helix-debug-${replyId}.json`}");
    expect(debugDrawer).toContain("Clipboard readback: {readbackMatch} | hash {payloadHash}");
    expect(debugDrawer).not.toContain("setDebugExportDrawer");
    expect(debugDrawer).not.toContain("buildDebugExport");
    expect(debugDrawer).not.toContain("navigator.clipboard");
  });

  it("owns turn-list shell display while the bridge keeps reply projection", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const turnList = read("client/src/components/helix/ask-console/HelixAskTurnList.tsx");

    expect(legacyPill).toContain("<HelixAskTurnList");
    expect(legacyPill).toContain("consoleDebugSnapshot={helixAskConsoleDebugSnapshot}");
    expect(legacyPill).toContain("activeTurnStreamPanel={activeTurnStreamPanel}");
    expect(legacyPill).toContain("bottomRef={askReplyListBottomRef}");
    expect(legacyPill).toContain("chronologicalAskReplies.map");
    expect(legacyPill).not.toContain('data-testid="helix-ask-reply-list-bottom"');
    expect(legacyPill).not.toContain('data-testid="helix-ask-console-debug"');
    expect(legacyPill).not.toContain("@keyframes helixAskTurnFadeIn");

    expect(turnList).toContain('data-testid="helix-ask-reply-list-bottom"');
    expect(turnList).toContain('data-testid="helix-ask-console-debug"');
    expect(turnList).toContain("@keyframes helixAskTurnFadeIn");
    expect(turnList).toContain("helix-ask-turn-line-enter");
    expect(turnList.indexOf("{children}")).toBeLessThan(turnList.indexOf("{activeTurnStreamPanel}"));
    expect(turnList.indexOf("{activeTurnStreamPanel}")).toBeLessThan(turnList.indexOf('data-testid="helix-ask-reply-list-bottom"'));
    expect(turnList).not.toContain("chronologicalAskReplies.map");
    expect(turnList).not.toContain("buildHelixTurnTranscriptRows");
    expect(turnList).not.toContain("resolveHelixAskVisibleTerminal");
  });

  it("owns completed reply card shell display while reply projection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyCard = read("client/src/components/helix/ask-console/HelixAskReplyCard.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("turnTestId: latestTurnBinding.turnTestId");
    expect(legacyPill).toContain("isLatestReply={isLatestReply}");
    expect(legacyPill).toContain("tintClassName: moodPalette.replyTint");
    expect(legacyPill).toContain("contextCapsule: reply.contextCapsule");
    expect(legacyPill).toContain("promptIngested: reply.promptIngested");
    expect(legacyPill).toContain("const isLatestReply = reply.id === transcriptLatestAskReplyId");
    expect(legacyPill).not.toContain("className={`relative px-1 py-1 text-sm text-slate-100 ${isLatestReply ? \"helix-ask-turn-enter\" : \"\"}`}");
    expect(legacyPill).not.toContain("pointer-events-none absolute inset-0 opacity-0 ${moodPalette.replyTint}");

    expect(replyTurn).toContain("export function HelixAskReplyTurn");
    expect(replyTurn).toContain("<HelixAskReplyCard");
    expect(replyTurn).toContain("<HelixAskTurnStreamPanel");
    expect(replyTurn).toContain("isLatestReply={isLatestReply}");
    expect(replyTurn).toContain("{...card}");
    expect(replyTurn).toContain("{...stream}");
    expect(replyTurn).not.toContain("buildHelixTurnTranscriptRows");
    expect(replyTurn).not.toContain("resolveHelixAskVisibleTerminal");
    expect(replyTurn).not.toContain("handleCopyReply");
    expect(replyTurn).not.toContain("transcriptLatestAskReplyId");
    expect(replyCard).toContain("export function HelixAskReplyCard");
    expect(replyCard).toContain('className={`relative px-1 py-1 text-sm text-slate-100 ${isLatestReply ? "helix-ask-turn-enter" : ""}`}');
    expect(replyCard).toContain("data-testid={turnTestId}");
    expect(replyCard).toContain("pointer-events-none absolute inset-0 opacity-0 ${tintClassName}");
    expect(replyCard).toContain("<HelixAskReplyContextCapsuleCard capsule={contextCapsule} />");
    expect(replyCard).toContain("<HelixAskReplyStatusFooter visible={isLatestReply} promptIngested={promptIngested} />");
    expect(replyCard).not.toContain("buildHelixTurnTranscriptRows");
    expect(replyCard).not.toContain("resolveHelixAskVisibleTerminal");
    expect(replyCard).not.toContain("handleCopyReply");
    expect(replyCard).not.toContain("transcriptLatestAskReplyId");
  });

  it("owns active turn stream panel display while active stream projection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const activeStreamPanel = read("client/src/components/helix/ask-console/HelixAskActiveTurnStreamPanel.tsx");

    expect(legacyPill).toContain("<HelixAskActiveTurnStreamPanel");
    expect(legacyPill).toContain("rows={visibleActiveTurnStreamRows}");
    expect(legacyPill).toContain("activeTurnId={activeAskTurnIdRef.current}");
    expect(legacyPill).toContain("activeTraceId={askLiveTraceId}");
    expect(legacyPill).toContain("renderFinalAnswerContent={renderHelixAskFinalAnswerContent}");
    expect(legacyPill).toContain("readRowClass={readHelixContinuousTurnStreamRowClass}");
    expect(legacyPill).toContain("readDotClass={readHelixContinuousTurnStreamDotClass}");
    expect(legacyPill).toContain("renderPlacement: \"after_completed_replies\"");
    expect(legacyPill).not.toContain("visibleActiveTurnStreamRows.map((row, index)");
    expect(legacyPill).not.toContain('data-testid="helix-ask-active-turn-stream-row"');
    expect(legacyPill).not.toContain('data-render-placement="after_completed_replies"');

    expect(activeStreamPanel).toContain("export function HelixAskActiveTurnStreamPanel");
    expect(activeStreamPanel).toContain("if (rows.length === 0) return null");
    expect(activeStreamPanel).toContain('data-testid="helix-ask-active-turn-stream"');
    expect(activeStreamPanel).toContain('data-testid="helix-ask-active-turn-stream-row"');
    expect(activeStreamPanel).toContain('data-testid="helix-ask-active-turn-latest-line"');
    expect(activeStreamPanel).toContain('data-render-placement="after_completed_replies"');
    expect(activeStreamPanel).toContain("rows.map((row, index)");
    expect(activeStreamPanel).toContain("readRowClass(row.tone)");
    expect(activeStreamPanel).toContain("readDotClass(row.tone)");
    expect(activeStreamPanel).not.toContain("visibleActiveTurnStreamRows");
    expect(activeStreamPanel).not.toContain("activeAskTurnIdRef");
    expect(activeStreamPanel).not.toContain("askLiveTraceId");
  });

  it("owns attachment strip display while validation and mutation stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const attachmentStrip = read("client/src/components/helix/ask-console/HelixAskAttachmentStrip.tsx");

    expect(legacyPill).toContain("<HelixAskAttachmentStrip");
    expect(legacyPill).toContain("items={askAttachmentCommitChecks}");
    expect(legacyPill).toContain("onRemove={removeAskAttachment}");
    expect(legacyPill).toContain("validateHelixAskAttachmentForSubmit");
    expect(legacyPill).not.toContain("askAttachmentCommitChecks.map");
    expect(legacyPill).not.toContain("image ready");
    expect(legacyPill).not.toContain("text needs reattach");
    expect(legacyPill).not.toContain("<FileText className=");
    expect(legacyPill).not.toContain("<X className=");

    expect(attachmentStrip).toContain("export function HelixAskAttachmentStrip");
    expect(attachmentStrip).toContain("items.map");
    expect(attachmentStrip).toContain("image ready");
    expect(attachmentStrip).toContain("text needs reattach");
    expect(attachmentStrip).toContain("onRemove(attachment.id)");
    expect(attachmentStrip).not.toContain("validateHelixAskAttachmentForSubmit");
    expect(attachmentStrip).not.toContain("removeAskAttachment");
    expect(attachmentStrip).not.toContain("FileReader");
  });

  it("owns ask error-line display while error state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusLine = read("client/src/components/helix/ask-console/HelixAskStatusLine.tsx");

    expect(legacyPill).toContain("<HelixAskErrorLine message={askError} />");
    expect(legacyPill).toContain("setAskError");
    expect(legacyPill).not.toContain('<p className="mt-3 text-xs text-rose-200">{askError}</p>');

    expect(statusLine).toContain("export function HelixAskErrorLine");
    expect(statusLine).toContain("if (!message) return null");
    expect(statusLine).toContain('className="mt-3 text-xs text-rose-200"');
    expect(statusLine).not.toContain("setAskError");
  });

  it("owns voice status pill display while voice capture state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusLine = read("client/src/components/helix/ask-console/HelixAskStatusLine.tsx");

    expect(legacyPill).toContain("<HelixAskVoiceStatusPill label={voiceInputStatusLabel} state={voiceInputState} />");
    expect(legacyPill).toContain("buildVoiceInputStatusLabel");
    expect(legacyPill).toContain("setVoiceInputState");
    expect(legacyPill).not.toContain("{voiceInputStatusLabel ? (");
    expect(legacyPill).not.toContain("border-emerald-300/40 bg-emerald-500/10 text-emerald-100");

    expect(statusLine).toContain("export function HelixAskVoiceStatusPill");
    expect(statusLine).toContain('state === "listening"');
    expect(statusLine).toContain("border-emerald-300/40 bg-emerald-500/10 text-emerald-100");
    expect(statusLine).not.toContain("buildVoiceInputStatusLabel");
    expect(statusLine).not.toContain("setVoiceInputState");
  });

  it("owns voice level monitor display while voice capture metrics stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceLevelMonitor = read("client/src/components/helix/ask-console/HelixAskVoiceLevelMonitor.tsx");

    expect(legacyPill).toContain("<HelixAskVoiceLevelMonitor");
    expect(legacyPill).toContain("visible={showTopInputLevelMonitor}");
    expect(legacyPill).toContain("maxHeightPx={voiceMonitorMaxHeightPx}");
    expect(legacyPill).toContain("level={voiceMonitorLevel}");
    expect(legacyPill).toContain("signalState={voiceSignalState}");
    expect(legacyPill).toContain("anchorRef={voiceMonitorAnchorRef}");
    expect(legacyPill).toContain("voiceMeterStats.displayLevel");
    expect(legacyPill).not.toContain("Array.from({ length: 16 }).map");
    expect(legacyPill).not.toContain("Voice input level meter:");
    expect(legacyPill).not.toContain("bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]");

    expect(voiceLevelMonitor).toContain("export function HelixAskVoiceLevelMonitor");
    expect(voiceLevelMonitor).toContain("aria-hidden={!visible}");
    expect(voiceLevelMonitor).toContain("Array.from({ length: 16 }).map");
    expect(voiceLevelMonitor).toContain("Voice input level meter:");
    expect(voiceLevelMonitor).toContain("level >= threshold");
    expect(voiceLevelMonitor).toContain("Math.max(0, maxHeightPx)");
    expect(voiceLevelMonitor).not.toContain("voiceMeterStats");
    expect(voiceLevelMonitor).not.toContain("setVoiceInputState");
    expect(voiceLevelMonitor).not.toContain("MediaRecorder");
  });

  it("owns context memory status display while memory state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const statusLine = read("client/src/components/helix/ask-console/HelixAskStatusLine.tsx");

    expect(legacyPill).toContain("<HelixAskContextMemoryStatusLine text={contextMemoryStatusText} />");
    expect(legacyPill).toContain("SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(legacyPill).toContain("sessionCapsuleState.confidenceBand");
    expect(legacyPill).not.toContain("{contextMemoryStatusText ? (");
    expect(legacyPill).not.toContain('text-emerald-200/85">\\n                {contextMemoryStatusText}');

    expect(statusLine).toContain("export function HelixAskContextMemoryStatusLine");
    expect(statusLine).toContain("if (!text) return null");
    expect(statusLine).toContain("text-emerald-200/85");
    expect(statusLine).not.toContain("SESSION_CAPSULE_CONFIDENCE_LABEL");
    expect(statusLine).not.toContain("sessionCapsuleState");
  });

  it("owns conversation brief display while observer selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const observerLane = read("client/src/components/helix/ask-console/HelixAskObserverLane.tsx");

    expect(legacyPill).toContain("<HelixAskConversationBriefPanel text={latestConversationBrief?.text} />");
    expect(legacyPill).toContain("userSettings.showHelixAskObserverLane");
    expect(legacyPill).toContain("latestConversationBrief");
    expect(legacyPill).not.toContain('<p className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/80">brief</p>');

    expect(observerLane).toContain("export function HelixAskConversationBriefPanel");
    expect(observerLane).toContain("if (!text) return null");
    expect(observerLane).toContain(">brief</p>");
    expect(observerLane).not.toContain("latestConversationBrief");
    expect(observerLane).not.toContain("showHelixAskObserverLane");
  });

  it("owns context chooser display while chooser state and execution stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const observerLane = read("client/src/components/helix/ask-console/HelixAskObserverLane.tsx");

    expect(legacyPill).toContain("<HelixAskContextChooserPanel");
    expect(legacyPill).toContain("visible={Boolean(askContextChooser)}");
    expect(legacyPill).toContain("autoContextMode={askContextChooser?.autoContextMode}");
    expect(legacyPill).toContain("countdownSec={askContextChooserCountdownSec}");
    expect(legacyPill).toContain("onRunAttached={handleAskContextChooserRunAttached}");
    expect(legacyPill).toContain("onRunIsolated={handleAskContextChooserRunIsolated}");
    expect(legacyPill).toContain("onCancel={dismissAskContextChooser}");
    expect(legacyPill).toContain("setAskContextChooser");
    expect(legacyPill).toContain("executeAskWithContextMode");
    expect(legacyPill).not.toContain("Reasoning context");
    expect(legacyPill).not.toContain("Attach current workspace context to this reasoning turn?");

    expect(observerLane).toContain("export function HelixAskContextChooserPanel");
    expect(observerLane).toContain("if (!visible) return null");
    expect(observerLane).toContain("Reasoning context");
    expect(observerLane).toContain("Attach current workspace context to this reasoning turn?");
    expect(observerLane).toContain("Auto-running isolated in ${countdownSec}s.");
    expect(observerLane).toContain("onClick={onRunAttached}");
    expect(observerLane).toContain("onClick={onRunIsolated}");
    expect(observerLane).toContain("onClick={onCancel}");
    expect(observerLane).not.toContain("executeAskWithContextMode");
    expect(observerLane).not.toContain("setAskContextChooser");
  });

  it("owns observer lane event display while event selection stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const observerLane = read("client/src/components/helix/ask-console/HelixAskObserverLane.tsx");

    expect(legacyPill).toContain("<HelixAskObserverLanePanel");
    expect(legacyPill).toContain("events={observerLaneEvents}");
    expect(legacyPill).toContain("clipText={clipText}");
    expect(legacyPill).toContain("const observerLaneEvents = useMemo");
    expect(legacyPill).toContain("observer_lane_commentary");
    expect(legacyPill).not.toContain("Observer lane</p>");
    expect(legacyPill).not.toContain("Waiting for observer events...");
    expect(legacyPill).not.toContain("observerLaneEvents.map");

    expect(observerLane).toContain("export function HelixAskObserverLanePanel");
    expect(observerLane).toContain("events.map");
    expect(observerLane).toContain("Observer lane");
    expect(observerLane).toContain("Waiting for observer events...");
    expect(observerLane).toContain("toLocaleTimeString");
    expect(observerLane).not.toContain("observer_lane_commentary");
    expect(observerLane).not.toContain("helixTimeline");
  });

  it("owns steering queue panel display while queue construction and expansion state stay in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const steeringPanel = read("client/src/components/helix/ask-console/HelixAskSteeringQueuePanel.tsx");
    const steeringDisplay = read("client/src/lib/helix/ask-steering-queue-display.ts");

    expect(legacyPill).toContain("<HelixAskSteeringQueuePanel");
    expect(legacyPill).toContain("items={steeringQueueItems}");
    expect(legacyPill).toContain("activeCount={activeSteeringQueueCount}");
    expect(legacyPill).toContain("expanded={steeringQueueExpanded}");
    expect(legacyPill).toContain("onToggleExpanded={() => setSteeringQueueExpanded((current) => !current)}");
    expect(legacyPill).toContain("buildHelixAskSteeringQueueItems");
    expect(legacyPill).toContain("shouldAutoWakeHelixMailboxQueueItem");
    expect(legacyPill).not.toContain("steeringQueueItems.map((item, index)");
    expect(legacyPill).not.toContain('aria-controls="helix-ask-steering-queue-items"');
    expect(legacyPill).not.toContain("readHelixSteeringQueueItemClass(item)");
    expect(legacyPill).not.toContain("readHelixSteeringQueueDotClass(item)");

    expect(steeringPanel).toContain("export function HelixAskSteeringQueuePanel");
    expect(steeringPanel).toContain("if (items.length === 0) return null");
    expect(steeringPanel).toContain('aria-label="Helix Ask steering queue"');
    expect(steeringPanel).toContain('aria-controls="helix-ask-steering-queue-items"');
    expect(steeringPanel).toContain('data-expanded={expanded ? "true" : "false"}');
    expect(steeringPanel).toContain('{expanded ? "Hide" : "Show"}');
    expect(steeringPanel).toContain("items.map((item, index)");
    expect(steeringPanel).toContain("readHelixSteeringQueueItemClass(item)");
    expect(steeringPanel).toContain("readHelixSteeringQueueDotClass(item)");
    expect(steeringPanel).not.toContain("setSteeringQueueExpanded");
    expect(steeringPanel).not.toContain("buildHelixAskSteeringQueueItems");
    expect(steeringPanel).not.toContain("shouldAutoWakeHelixMailboxQueueItem");

    expect(steeringDisplay).toContain("export function buildHelixAskSteeringQueueItems");
    expect(steeringDisplay).toContain("export function shouldAutoWakeHelixMailboxQueueItem");
  });

  it("owns context capsule preview display while capsule state derivation stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const capsulePreview = read("client/src/components/helix/ask-console/HelixAskContextCapsulePreview.tsx");

    expect(legacyPill).toContain("<HelixAskContextCapsulePreview");
    expect(legacyPill).toContain("preview={activeContextCapsulePreview}");
    expect(legacyPill).toContain("autoApplied={Boolean(sessionCapsuleState)}");
    expect(legacyPill).toContain("deriveSessionCapsuleState");
    expect(legacyPill).toContain("activeContextCapsulePreview");
    expect(legacyPill).not.toContain("visual key detected");
    expect(legacyPill).not.toContain("auto-applied");
    expect(legacyPill).not.toContain("CONVERGENCE_SOURCE_LABEL[activeContextCapsulePreview");

    expect(capsulePreview).toContain("export function HelixAskContextCapsulePreview");
    expect(capsulePreview).toContain("buildContextCapsuleStampDataUri(preview.summary.stamp)");
    expect(capsulePreview).toContain("CONVERGENCE_SOURCE_LABEL[preview.convergence.source]");
    expect(capsulePreview).toContain("visual key detected");
    expect(capsulePreview).toContain("auto-applied");
    expect(capsulePreview).not.toContain("deriveSessionCapsuleState");
    expect(capsulePreview).not.toContain("sessionCapsuleState");
  });

  it("owns reply context capsule card display while reply state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const replyCard = read("client/src/components/helix/ask-console/HelixAskReplyCard.tsx");
    const replyTurn = read("client/src/components/helix/ask-console/HelixAskReplyTurn.tsx");
    const capsulePreview = read("client/src/components/helix/ask-console/HelixAskContextCapsulePreview.tsx");

    expect(legacyPill).toContain("<HelixAskReplyTurn");
    expect(legacyPill).toContain("contextCapsule: reply.contextCapsule");
    expect(legacyPill).toContain("contextCapsule: responseContextCapsule");
    expect(legacyPill).toContain("buildContextCapsuleCopyText(reply.contextCapsule)");
    expect(legacyPill).not.toContain("<HelixAskReplyContextCapsuleCard");
    expect(legacyPill).not.toContain("buildContextCapsuleStampDataUri(reply.contextCapsule.stamp)");
    expect(legacyPill).not.toContain('alt="Context capsule fingerprint"\\n                          className="mt-1 h-10 w-44');

    expect(replyTurn).toContain("<HelixAskReplyCard");
    expect(replyCard).toContain("<HelixAskReplyContextCapsuleCard capsule={contextCapsule} />");
    expect(replyCard).not.toContain("responseContextCapsule");
    expect(replyCard).not.toContain("buildContextCapsuleCopyText");
    expect(capsulePreview).toContain("export function HelixAskReplyContextCapsuleCard");
    expect(capsulePreview).toContain("if (!capsule) return null");
    expect(capsulePreview).toContain("buildContextCapsuleStampDataUri(capsule.stamp)");
    expect(capsulePreview).toContain(">Context capsule</p>");
    expect(capsulePreview).toContain("auto\n        </span>");
    expect(capsulePreview).not.toContain("responseContextCapsule");
    expect(capsulePreview).not.toContain("buildContextCapsuleCopyText");
  });

  it("owns Situation Room source panel display while source state stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const situationPanel = read("client/src/components/helix/ask-console/HelixAskSituationRoomSourcePanel.tsx");

    expect(legacyPill).toContain("<HelixAskSituationRoomSourcePanel");
    expect(legacyPill).toContain("visible={showSituationRoomSourcePanel}");
    expect(legacyPill).toContain("onStopDisplayAudio={stopDisplayAudioCapture}");
    expect(legacyPill).toContain("displayAudioSourceSnapshot");
    expect(legacyPill).toContain("situationRoomState.recentEvents.length");
    expect(legacyPill).not.toContain("Situation Room Source");
    expect(legacyPill).not.toContain("Awaiting transcript chunks.");
    expect(legacyPill).not.toContain("Stop source");

    expect(situationPanel).toContain("export function HelixAskSituationRoomSourcePanel");
    expect(situationPanel).toContain("if (!visible) return null");
    expect(situationPanel).toContain("Situation Room Source");
    expect(situationPanel).toContain("Awaiting transcript chunks.");
    expect(situationPanel).toContain("Stop source");
    expect(situationPanel).toContain("onClick={onStopDisplayAudio}");
    expect(situationPanel).not.toContain("displayAudioSourceSnapshot");
    expect(situationPanel).not.toContain("situationRoomState");
    expect(situationPanel).not.toContain("stopDisplayAudioCapture");
  });

  it("owns voice command confirmation display while command policy stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceConfirmation = read("client/src/components/helix/ask-console/HelixAskVoiceConfirmationPanel.tsx");

    expect(legacyPill).toContain("<HelixAskVoiceCommandConfirmationPanel");
    expect(legacyPill).toContain("visible={!transcriptConfirmState && Boolean(commandConfirmState)}");
    expect(legacyPill).toContain("actionLabel={commandConfirmState ? describeVoiceCommandAction(commandConfirmState.action) : \"\"}");
    expect(legacyPill).toContain("onAccept={handleCommandConfirmationAccept}");
    expect(legacyPill).toContain("onCancel={handleCommandConfirmationCancel}");
    expect(legacyPill).toContain("setCommandConfirmState");
    expect(legacyPill).not.toContain("Voice command</p>");
    expect(legacyPill).not.toContain("Auto-confirming in {commandConfirmAutoCountdownSec}s");

    expect(voiceConfirmation).toContain("export function HelixAskVoiceCommandConfirmationPanel");
    expect(voiceConfirmation).toContain("if (!visible) return null");
    expect(voiceConfirmation).toContain("Voice command");
    expect(voiceConfirmation).toContain("Auto-confirming in {countdownSec}s");
    expect(voiceConfirmation).toContain("onClick={onAccept}");
    expect(voiceConfirmation).toContain("onClick={onCancel}");
    expect(voiceConfirmation).not.toContain("describeVoiceCommandAction");
    expect(voiceConfirmation).not.toContain("setCommandConfirmState");
  });

  it("owns transcript confirmation display while transcript policy stays in the bridge", () => {
    const legacyPill = read("client/src/components/helix/HelixAskPill.tsx");
    const voiceConfirmation = read("client/src/components/helix/ask-console/HelixAskVoiceConfirmationPanel.tsx");

    expect(legacyPill).toContain("<HelixAskTranscriptConfirmationPanel");
    expect(legacyPill).toContain("visible={Boolean(transcriptConfirmState)}");
    expect(legacyPill).toContain("countdownSec={transcriptConfirmAutoCountdownSec}");
    expect(legacyPill).toContain("onAccept={handleTranscriptConfirmationAccept}");
    expect(legacyPill).toContain("onRetry={handleTranscriptConfirmationRetry}");
    expect(legacyPill).toContain("setTranscriptConfirmState");
    expect(legacyPill).not.toContain("Confirm transcript</p>");
    expect(legacyPill).not.toContain("Auto-confirming in {transcriptConfirmAutoCountdownSec}s");

    expect(voiceConfirmation).toContain("export function HelixAskTranscriptConfirmationPanel");
    expect(voiceConfirmation).toContain("showSourceText");
    expect(voiceConfirmation).toContain("Confirm transcript");
    expect(voiceConfirmation).toContain("Auto-confirming in {countdownSec}s");
    expect(voiceConfirmation).toContain("onClick={onAccept}");
    expect(voiceConfirmation).toContain("onClick={onRetry}");
    expect(voiceConfirmation).not.toContain("setTranscriptConfirmState");
  });
});
