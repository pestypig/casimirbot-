import type { ReactNode } from "react";

import { readAgentLoopAuditArray, readAgentLoopAuditRecord } from "@/lib/helix/ask-runtime-authority-readers";
import {
  buildVisibleResolvedTurn,
  readHelixTopLevelPendingServerRequest,
  type HelixAskTerminalProjectionReply,
} from "@/lib/helix/ask-terminal-projection";
import { clipText } from "@/lib/helix/ask-value-normalization";
import { readProceduralActionLabel } from "@/lib/helix/ask-procedural-display";
import { shouldShowHelixRuntimeStopReason } from "@/lib/helix/resolveHelixVisibleTerminal";

import { type HelixAskProceduralTimelineRow } from "./HelixAskProceduralTimeline";
import { HelixAskLegacyProceduralTimelineSlot } from "./HelixAskLegacyProceduralTimelineSlot";

export type HelixAskLegacyProceduralTimelineReply = HelixAskTerminalProjectionReply & {
  content?: string;
  debug?: Record<string, unknown> | null;
};

export type HelixAskLegacyProceduralTimelineProjectionOptions = {
  resolveVisibleTerminalKind: (args: {
    reply?: HelixAskLegacyProceduralTimelineReply | null;
    terminal?: Record<string, unknown> | null;
    fallback?: string;
    extraSources?: unknown[];
  }) => string;
};

export function renderHelixAskLegacyProceduralTimeline(
  reply: HelixAskLegacyProceduralTimelineReply,
  options: HelixAskLegacyProceduralTimelineProjectionOptions,
): ReactNode {
  const replyRecord = readAgentLoopAuditRecord(reply);
  const truthTable = readAgentLoopAuditRecord(reply.debug?.turn_truth_table);
  const plannerContract = readAgentLoopAuditRecord(reply.debug?.planner_contract);
  const runtimeSummary = readAgentLoopAuditRecord(reply.debug?.turn_runtime);
  const agentLoopAudit = readAgentLoopAuditRecord(reply.debug?.agent_loop_audit);
  const uiDebugParityHarness = readAgentLoopAuditRecord(
    replyRecord?.ui_debug_parity_harness ?? reply.debug?.ui_debug_parity_harness,
  );
  const agentRuntimeLoop = readAgentLoopAuditRecord(
    replyRecord?.agent_runtime_loop ?? reply.debug?.agent_runtime_loop,
  );
  const runtimeIterations = readAgentLoopAuditArray(agentRuntimeLoop?.iterations);
  const planItems = readAgentLoopAuditArray(truthTable?.plan_items ?? plannerContract?.plan_items);
  const observations = readAgentLoopAuditArray(truthTable?.runtime_observations ?? runtimeSummary?.observations);
  const appendedSteps = readAgentLoopAuditArray(runtimeSummary?.appended_steps);
  const terminal = readAgentLoopAuditRecord(truthTable?.terminal ?? runtimeSummary?.terminal);
  const selectedTool = readAgentLoopAuditRecord(truthTable?.selected_tool ?? agentLoopAudit?.selected_action);
  const visibleResolvedTurn = buildVisibleResolvedTurn(reply);
  const route = visibleResolvedTurn.primary_route_label;
  const solverController = readAgentLoopAuditRecord(
    replyRecord?.solver_controller_decision ?? reply.debug?.solver_controller_decision,
  );
  const runtimeStopReason =
    typeof agentRuntimeLoop?.stop_reason === "string" ? agentRuntimeLoop.stop_reason.trim() : "";
  const visibleAnswer =
    typeof truthTable?.visible_answer_text === "string"
      ? truthTable.visible_answer_text
      : typeof reply.content === "string"
        ? reply.content
        : "";
  const terminalText = typeof terminal?.text === "string" ? terminal.text : "";
  const parityMatchesVisible =
    typeof uiDebugParityHarness?.ui_answer_equals_terminal_authority_text === "boolean"
      ? uiDebugParityHarness.ui_answer_equals_terminal_authority_text
      : typeof uiDebugParityHarness?.ui_answer_equals_selected_final_answer === "boolean"
        ? uiDebugParityHarness.ui_answer_equals_selected_final_answer
        : null;
  const truthMatchesVisible =
    parityMatchesVisible ??
    Boolean(terminalText && visibleAnswer && terminalText.trim() === visibleAnswer.trim());
  const pendingInput =
    visibleResolvedTurn.primary_terminal_label === "pending_input" && visibleResolvedTurn.pending_server_request_present
      ? readHelixTopLevelPendingServerRequest(reply)
      : null;
  const visibleTerminalKind = options.resolveVisibleTerminalKind({
    reply,
    terminal,
    fallback: "final_answer",
    extraSources: [truthTable, runtimeSummary, agentLoopAudit],
  });
  const showRuntimeStopReason = shouldShowHelixRuntimeStopReason({
    stopReason: runtimeStopReason,
    finalStatus: replyRecord?.final_status ?? reply.debug?.final_status,
    terminalErrorCode: visibleResolvedTurn.terminal_error_code,
    solverDecision: solverController?.decision,
    terminalKind: visibleTerminalKind,
  });

  if (!truthTable && runtimeIterations.length === 0 && planItems.length === 0 && observations.length === 0 && !terminal) {
    return null;
  }

  const rows: HelixAskProceduralTimelineRow[] = [];
  const runtimeActionLabels: string[] = [];

  runtimeIterations.slice(0, 12).forEach((item, index) => {
    const record = readAgentLoopAuditRecord(item);
    const chosenCapability = typeof record?.chosen_capability === "string" ? record.chosen_capability.trim() : "";
    const executedAction = typeof record?.executed_action_key === "string" ? record.executed_action_key.trim() : "";
    const actionLabel = executedAction || chosenCapability || String(record?.next_step ?? "model step");
    const authority = String(record?.decision_authority ?? record?.decision_source ?? "unknown");
    const producedArtifacts = Array.isArray(record?.produced_artifacts)
      ? (record.produced_artifacts as unknown[]).map((entry) => String(entry)).filter(Boolean).join(", ")
      : "";
    if (executedAction || chosenCapability) runtimeActionLabels.push(executedAction || chosenCapability);
    rows.push({
      key: `runtime-${index}`,
      label: `Runtime ${String(record?.iteration ?? index + 1)}: ${String(record?.next_step ?? "step")}`,
      detail: `${authority}: ${actionLabel}${producedArtifacts ? ` -> ${producedArtifacts}` : ""}`,
      status:
        record?.observation_role === "tool_error" || record?.status === "failed"
          ? "failed"
          : record?.next_step === "ask_user"
            ? "pending_input"
            : "completed",
    });
  });

  if (runtimeIterations.length === 0) {
    planItems.slice(0, 8).forEach((item, index) => {
      const record = readAgentLoopAuditRecord(item);
      const actionLabel = readProceduralActionLabel(record?.action);
      const lane = String(record?.lane ?? "step");
      rows.push({
        key: `plan-${index}`,
        label: `Plan ${index + 1}: ${lane}`,
        detail: actionLabel !== "model step" ? actionLabel : clipText(String(record?.title ?? record?.id ?? "planned step"), 140),
        status: String(record?.status ?? "planned"),
      });
    });
  }

  appendedSteps.slice(0, 6).forEach((item, index) => {
    const record = readAgentLoopAuditRecord(item);
    rows.push({
      key: `append-${index}`,
      label: `Appended step: ${String(record?.step_id ?? "next_step")}`,
      detail: `because ${String(record?.reason ?? "the previous observation needed another tool")}`,
      status: "running",
    });
  });

  observations.slice(-10).forEach((item, index) => {
    const record = readAgentLoopAuditRecord(item);
    const artifact = readAgentLoopAuditRecord(record?.artifact);
    const actionLabel = readProceduralActionLabel(artifact);
    const actualArtifacts = Array.isArray(record?.actual_artifacts)
      ? (record?.actual_artifacts as unknown[]).map((entry) => String(entry)).filter(Boolean).join(", ")
      : "";
    const blockedArtifacts = Array.isArray(record?.blocked_missing_artifacts)
      ? (record?.blocked_missing_artifacts as unknown[]).map((entry) => String(entry)).filter(Boolean).join(", ")
      : "";
    const detail =
      blockedArtifacts
        ? `blocked: missing ${blockedArtifacts}`
        : actualArtifacts
          ? `observed: ${actualArtifacts}`
          : actionLabel !== "model step"
            ? actionLabel
            : String(record?.step_id ?? "observation");
    rows.push({
      key: `observe-${index}`,
      label: `Observed: ${String(record?.step_id ?? "step")}`,
      detail,
      status: String(record?.status ?? "completed"),
    });
  });

  if (terminal) {
    rows.push({
      key: "terminal",
      label: `Terminal: ${visibleTerminalKind}`,
      detail: clipText(
        String(
          pendingInput?.prompt ??
            pendingInput?.text ??
            terminal.text ??
            visibleAnswer ??
            "turn completed",
        ),
        160,
      ),
      status:
        visibleTerminalKind === "pending_input"
          ? "pending_input"
          : visibleTerminalKind === "canceled"
            ? "canceled"
            : "completed",
    });
  }

  return (
    <HelixAskLegacyProceduralTimelineSlot
      rows={rows}
      truthMatchesVisible={truthMatchesVisible}
      route={route}
      toolLabel={runtimeActionLabels[0] ?? (selectedTool ? readProceduralActionLabel(selectedTool) : null)}
      runtimeStopReason={showRuntimeStopReason ? runtimeStopReason : null}
    />
  );
}
