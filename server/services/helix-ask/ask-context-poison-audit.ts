import crypto from "node:crypto";
import {
  HELIX_TURN_POISON_AUDIT_SCHEMA,
  type HelixArtifactRole,
  type HelixPoisonAuditResult,
  type HelixPoisonAuditViolation,
  type HelixTerminalAuthority,
} from "@shared/helix-turn-poison-guard";
import { quarantineHelixArtifact, quarantineHelixArtifacts } from "./deterministic-artifact-quarantine";
import { buildHelixTurnTerminalAuthority, hashHelixTerminalText } from "./turn-terminal-authority";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
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
    for (const key of ["selected_evidence_pack", "situation_context_pack", "interpreted_log_context", "present_state_card", "live_line_tool_request", "live_line_tool_evaluation", "pending_server_request", "request_user_input"]) {
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
  const violations: HelixPoisonAuditViolation[] = quarantined.flatMap((entry) => entry.violations);
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
  const terminalAuthority =
    input.terminal_authority ??
    (payload
      ? buildHelixTurnTerminalAuthority({
          thread_id: input.thread_id,
          turn_id: input.turn_id ?? readString(payload.turn_id),
          final_answer_source: readString(payload.final_answer_source),
          terminal_artifact_kind: readString(payload.terminal_artifact_kind),
          terminal_text:
            readString(payload.assistant_answer) ??
            readString(payload.answer) ??
            readString(payload.text) ??
            readString(payload.selected_final_answer) ??
            "",
          route: readString(payload.route_reason_code) ?? readString(payload.route),
          created_at: input.created_at,
        })
      : null);

  if (!terminalAuthority && payload) {
    violations.push({
      kind: "missing_terminal_authority",
      item_id: readString(payload.turn_id),
      summary: "Ask payload has no terminal authority record.",
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

  let assistantHistoryProjectionCount = 0;
  for (const item of input.assistant_history_items ?? []) {
    const normalized = quarantineHelixArtifact(item.artifact ?? { assistant_answer: true }, item.role);
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
