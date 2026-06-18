import crypto from "node:crypto";
import {
  HELIX_TURN_POISON_AUDIT_SCHEMA,
  type HelixArtifactRole,
  type HelixPoisonAuditResult,
  type HelixPoisonAuditViolation,
  type HelixTerminalAuthority,
} from "@shared/helix-turn-poison-guard";
import { quarantineHelixArtifact, quarantineHelixArtifacts } from "./deterministic-artifact-quarantine";
import { hashHelixTerminalText } from "./turn-terminal-authority";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readTerminalPresentationText(payload: Record<string, unknown>): string | null {
  const presentation = asRecord(payload.terminal_presentation);
  return presentation?.schema === "helix.terminal_presentation.v1"
    ? readString(presentation.concise_text)
    : null;
}

function readTerminalAnswerEventText(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const event of [...value].reverse()) {
      const record = asRecord(event);
      if (record?.type === "terminal_answer" || record?.type === "request_user_input") {
        return readString(record.text);
      }
    }
    return null;
  }
  return (
    readString(asRecord(asRecord(value)?.terminal_answer)?.text) ??
    readString(asRecord(asRecord(value)?.request_user_input)?.text)
  );
}

function readVisibleAnswerText(payload: Record<string, unknown>): string | null {
  return (
    readString(payload.answer) ??
    readString(payload.text) ??
    readString(payload.finalAnswer) ??
    readString(payload.content)
  );
}

function readExistingTerminalAuthority(value: unknown): HelixTerminalAuthority | null {
  const record = asRecord(value);
  return record?.schema === "helix.turn_terminal_authority.v1"
    ? (record as unknown as HelixTerminalAuthority)
    : null;
}

function addMismatchViolation(input: {
  violations: HelixPoisonAuditViolation[];
  kind: HelixPoisonAuditViolation["kind"];
  itemId?: string | null;
  surface: string;
  actual: string | null;
  expected: string;
}) {
  if (input.actual !== input.expected) {
    input.violations.push({
      kind: input.kind,
      item_id: input.itemId ?? null,
      summary: `${input.surface} did not match the canonical terminal presentation text.`,
    });
  }
}

function terminalArtifactForbiddenByContract(payload: Record<string, unknown>): boolean {
  const terminalArtifactKind = readString(payload.terminal_artifact_kind);
  if (terminalArtifactKind === "typed_failure" || terminalArtifactKind === "request_user_input") return false;
  const canonicalGoal = asRecord(payload.canonical_goal_frame);
  const canonicalGoalKind = readString(canonicalGoal?.goal_kind);
  const routeReason = readString(payload.route_reason_code) ?? readString(payload.route);
  const routeBase = routeReason?.split("/")[0]?.trim() ?? null;
  const liveMaintenanceTerminal =
    ["live_pipeline_receipt", "live_environment_binding_diagnosis"].includes(terminalArtifactKind ?? "") &&
    (
      Boolean(canonicalGoalKind && /^live_(?:source_continuation|pipeline_control|runtime_repair|environment_binding_diagnosis)$/.test(canonicalGoalKind)) ||
      Boolean(routeBase && /^live_(?:source_continuation|pipeline_control|runtime_repair|environment_binding_diagnosis)$/.test(routeBase))
    );
  if (liveMaintenanceTerminal) return false;
  const contract = asRecord(payload.route_product_contract);
  const selectionGuard = asRecord(payload.terminal_artifact_selection_guard);
  const productGuard = asRecord(payload.product_authority_guard);
  const forbidden = Array.isArray(contract?.forbidden_terminal_artifact_kinds)
    ? contract.forbidden_terminal_artifact_kinds
    : [];
  if (terminalArtifactKind && forbidden.includes(terminalArtifactKind)) return true;
  return selectionGuard?.allowed === false || productGuard?.allowed === false;
}

function collectPayloadArtifacts(payload: Record<string, unknown>): Array<{ artifact: unknown; role?: HelixArtifactRole }> {
  const artifacts: Array<{ artifact: unknown; role?: HelixArtifactRole }> = [];
  const push = (key: string, role?: HelixArtifactRole) => {
    const value = payload[key];
    if (value && typeof value === "object") artifacts.push({ artifact: value, role });
  };

  push("selected_evidence_pack", "validation");
  push("situation_context_pack", "validation");
  push("interpreted_log_context", "interpreted_event");
  push("present_state_card", "ui_projection");
  push("profile_archive", "profile_archive");
  push("subgoal_ledger_snapshot", "subgoal_evaluation");
  push("context_economy_decision", "validation");
  push("tool_choice_decision", "validation");
  push("live_line_tool_request", "validation");
  push("live_line_tool_evaluation", "validation");
  push("visual_extraction_evidence", "validation");
  push("derived_equation", "validation");
  push("doc_equation_extraction", "validation");
  push("note_write_artifact", "validation");
  push("workstation_tool_plan", "validation");
  push("workstation_tool_evaluation", "validation");
  push("multimodal_subgoal_plan", "validation");
  push("pending_server_request", "request_user_input");
  push("request_user_input", "request_user_input");

  for (const key of ["live_line_tool_requests", "live_line_tool_evaluations"]) {
    const values = payload[key];
    if (Array.isArray(values)) {
      for (const artifact of values) artifacts.push({ artifact, role: "validation" });
    }
  }

  const debug = asRecord(payload.debug);
  if (debug) {
    for (const key of ["selected_evidence_pack", "situation_context_pack", "interpreted_log_context", "present_state_card", "live_line_tool_request", "live_line_tool_evaluation", "visual_extraction_evidence", "derived_equation", "doc_equation_extraction", "note_write_artifact", "workstation_tool_plan", "workstation_tool_evaluation", "multimodal_subgoal_plan", "pending_server_request", "request_user_input"]) {
      const value = debug[key];
      if (value && typeof value === "object") artifacts.push({ artifact: value });
    }
    for (const key of ["live_line_tool_requests", "live_line_tool_evaluations"]) {
      const values = debug[key];
      if (Array.isArray(values)) {
        for (const artifact of values) artifacts.push({ artifact, role: "validation" });
      }
    }
  }

  const turnTruthTable = asRecord(payload.turn_truth_table);
  const observations = asRecord(payload.turn_runtime)?.observations;
  if (Array.isArray(observations)) {
    for (const artifact of observations) artifacts.push({ artifact, role: "tool_observation" });
  }
  const runtimeObservations = turnTruthTable?.runtime_observations;
  if (Array.isArray(runtimeObservations)) {
    for (const artifact of runtimeObservations) artifacts.push({ artifact, role: "tool_observation" });
  }

  return artifacts;
}

export function auditHelixAskContextForPoison(input: {
  thread_id: string;
  turn_id?: string | null;
  payload?: Record<string, unknown> | null;
  artifacts?: Array<{ artifact: unknown; role?: HelixArtifactRole }>;
  terminal_authority?: HelixTerminalAuthority | null;
  client_visible_text?: string | null;
  assistant_history_items?: Array<{ text: string; role?: HelixArtifactRole; artifact?: unknown }>;
  created_at?: string;
}): HelixPoisonAuditResult {
  const artifacts = [
    ...(input.artifacts ?? []),
    ...(input.payload ? collectPayloadArtifacts(input.payload) : []),
  ];
  const quarantined = quarantineHelixArtifacts(artifacts);
  const violations: HelixPoisonAuditViolation[] = quarantined.flatMap((entry: (typeof quarantined)[number]) => entry.violations);
  const roleCounts = {
    source_event: 0,
    tool_observation: 0,
    validation: 0,
    synthetic_evidence: 0,
    subgoal_evaluation: 0,
    request_user_input: 0,
    user_steering: 0,
    interpreted_event: 0,
    profile_archive: 0,
    ui_projection: 0,
    assistant_answer: 0,
  } satisfies HelixPoisonAuditResult["artifact_role_counts"];

  for (const entry of quarantined) roleCounts[entry.role] += 1;

  const payload = input.payload ?? null;
  const payloadPresentationText = payload ? readTerminalPresentationText(payload) : null;
  const payloadSelectedText = payload ? readString(payload.selected_final_answer) : null;
  const canonicalTerminalText = payloadPresentationText ?? payloadSelectedText ?? "";
  const terminalAuthority =
    input.terminal_authority ??
    (payload ? readExistingTerminalAuthority(payload.terminal_answer_authority) : null);

  if (!terminalAuthority && payload && canonicalTerminalText) {
    violations.push({
      kind: "missing_terminal_authority",
      item_id: readString(payload.turn_id),
      summary: "Ask payload has terminal-visible text but no terminal authority record.",
    });
  }

  const clientVisibleHash = input.client_visible_text ? hashHelixTerminalText(input.client_visible_text) : null;
  if (terminalAuthority && clientVisibleHash && clientVisibleHash !== terminalAuthority.terminal_text_hash) {
    violations.push({
      kind: "client_fallback_overrode_terminal",
      item_id: input.turn_id ?? null,
      summary: "Client visible answer hash differs from server terminal answer hash.",
    });
  }

  if (payload && canonicalTerminalText) {
    addMismatchViolation({
      violations,
      kind: "terminal_selected_presentation_mismatch",
      itemId: input.turn_id ?? readString(payload.turn_id),
      surface: "selected_final_answer",
      actual: payloadSelectedText,
      expected: canonicalTerminalText,
    });
    addMismatchViolation({
      violations,
      kind: "terminal_authority_presentation_mismatch",
      itemId: input.turn_id ?? readString(payload.turn_id),
      surface: "terminal_answer_authority.terminal_text_preview",
      actual: readString(terminalAuthority?.terminal_text_preview),
      expected: canonicalTerminalText,
    });
    addMismatchViolation({
      violations,
      kind: "terminal_event_presentation_mismatch",
      itemId: input.turn_id ?? readString(payload.turn_id),
      surface: "current_turn_events.terminal_answer.text",
      actual: readTerminalAnswerEventText(payload.current_turn_events) ?? readTerminalAnswerEventText(payload.turn_events),
      expected: canonicalTerminalText,
    });
    addMismatchViolation({
      violations,
      kind: "terminal_visible_answer_mismatch",
      itemId: input.turn_id ?? readString(payload.turn_id),
      surface: "visible answer",
      actual: readVisibleAnswerText(payload),
      expected: canonicalTerminalText,
    });
  }

  if (terminalAuthority?.authority_origin === "fallback") {
    violations.push({
      kind: "terminal_authority_created_from_fallback",
      item_id: input.turn_id ?? (payload ? readString(payload.turn_id) : null),
      summary: "Terminal authority was created from fallback text instead of terminal presentation or selected answer.",
    });
  }

  if (payload && terminalArtifactForbiddenByContract(payload)) {
    violations.push({
      kind: "terminal_artifact_forbidden_by_route_contract",
      item_id: input.turn_id ?? readString(payload.turn_id),
      summary: "Terminal artifact kind was rejected by the route-product or tool-admission contract.",
    });
  }

  let assistantHistoryProjectionCount = 0;
  for (const item of input.assistant_history_items ?? []) {
    const normalized = quarantineHelixArtifact(
      item.artifact ?? {
        schema: "helix.present_state_card.v1",
        context_role: "projection_not_assistant_answer",
      },
      item.role,
    );
    if (normalized.role === "ui_projection") {
      assistantHistoryProjectionCount += 1;
      violations.push({
        kind: "assistant_history_contains_projection",
        item_id: normalized.item_id ?? null,
        summary: "Assistant history included a UI projection artifact.",
      });
    }
  }

  return {
    schema: HELIX_TURN_POISON_AUDIT_SCHEMA,
    audit_id: `poison-audit:${crypto
      .createHash("sha256")
      .update(JSON.stringify([input.thread_id, input.turn_id ?? null, terminalAuthority?.terminal_text_hash ?? null, artifacts.length]))
      .digest("hex")
      .slice(0, 20)}`,
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? null,
    ok: violations.length === 0,
    violations,
    terminal_authority: terminalAuthority
      ? {
          final_answer_source: terminalAuthority.final_answer_source,
          terminal_artifact_kind: terminalAuthority.terminal_artifact_kind,
          server_terminal_text_hash: terminalAuthority.terminal_text_hash,
          client_visible_text_hash: clientVisibleHash,
        }
      : null,
    artifact_role_counts: roleCounts,
    assistant_history_projection_count: assistantHistoryProjectionCount,
    created_at: input.created_at ?? new Date().toISOString(),
  };
}
