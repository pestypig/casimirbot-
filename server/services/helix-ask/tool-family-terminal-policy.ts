import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import {
  resolveToolFamilyContract,
  type ToolAuthority,
  type ToolFamilyContract,
} from "./tool-family-contract";

type RecordLike = Record<string, unknown>;

export type ToolFamilyTerminalPolicyDecision = {
  schema: "helix.tool_family_terminal_policy.v1";
  tool_name: string | null;
  tool_family: string | null;
  authority: ToolAuthority;
  terminal_artifact_kind: string;
  allowed: boolean;
  reason:
    | "non_receipt_terminal_deferred_to_route_authority"
    | "terminal_kind_allowed_by_control_receipt_contract"
    | "terminal_kind_allowed_by_terminal_candidate_contract"
    | "terminal_kind_forbidden_by_route_product_contract"
    | "terminal_kind_not_allowed_by_route_product_contract"
    | "terminal_kind_not_allowed_by_tool_family_contract"
    | "observation_artifact_cannot_terminalize"
    | "evidence_only_tool_cannot_terminalize_receipt"
    | "control_receipt_requires_admitted_tool"
    | "control_receipt_requires_goal_satisfaction"
    | "control_receipt_requires_matching_goal_terminal"
    | "mutating_control_receipt_requires_operator_command"
    | "tool_family_contract_missing";
  contract: ToolFamilyContract | null;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export const isReceiptTerminalKind = (kind: string): boolean =>
  /(?:^|[_\-.])(?:receipt|tool_evaluation|workstation_tool_evaluation|action_receipt|decision|callout)(?:$|[_\-.])/i.test(kind) ||
  /\b(?:tool_evaluation|workstation_tool_evaluation|action_receipt)\b/i.test(kind);

const normalizeArtifactKind = (kind: string): string =>
  kind.trim().toLowerCase().replace(/\/v(\d+)$/i, ".v$1");

const WORKSTATION_OBSERVATION_TERMINAL_KINDS = new Set([
  "helix.agent_goal_session.v1",
  "helix.narrator_bind_stream_request.v1",
  "helix.narrator_event.v1",
  "helix.narrator_say_request.v1",
  "helix.situation_source_capability_read",
  "helix.situation_source_capability_read.v1",
  "helix.workstation_goal_context_update.v1",
  "helix.workstation_reasoning_trace_query_result",
  "helix.workstation_reasoning_trace_query_result.v1",
  "audio_transcripts",
  "automation_policies",
  "automation_status",
  "live_answer_projection",
  "live_answer_lines",
  "live_source_causal_trace.v1",
  "microdeck_output",
  "microdeck_outputs",
  "panel_projection",
  "packet_traces",
  "route_evidence",
  "source_health",
  "stage_play_live_answer_projection",
  "stage_play_live_source_current_state",
  "stage_play_live_source_current_state.v1",
  "stage_play_live_source_mail_wake_request.v1",
  "stage_play_live_source_mail_wake_result_observation.v1",
  "stage_play_live_source_mail_wake_result_projection.v1",
  "stage_play_live_source_mail_wake_result.v1",
  "stage_play_live_source_quality",
  "stage_play_live_source_quality.v1",
  "stage_play_microdeck_output",
  "stage_play_packet_trace_query_result",
  "stage_play_packet_trace_query_result.v1",
  "stage_play_workstation_context_feed_query_result",
  "stage_play_workstation_context_feed_query_result.v1",
  "stage_play_workstation_goal_context_read_result",
  "stage_play_workstation_goal_context_read_result.v1",
  "trace_memory",
  "translated_transcripts",
  "visual_summaries",
]);

export const isWorkstationObservationTerminalKind = (kind: string): boolean =>
  WORKSTATION_OBSERVATION_TERMINAL_KINDS.has(normalizeArtifactKind(kind));

const routeAllowsTerminalKind = (
  routeProductContract: HelixRouteProductContract | RecordLike | null | undefined,
  terminalArtifactKind: string,
): boolean => {
  const forbidden = readArray(routeProductContract?.forbidden_terminal_artifact_kinds).map(readString).filter(Boolean);
  if (forbidden.includes(terminalArtifactKind)) return false;
  const allowed = readArray(routeProductContract?.allowed_terminal_artifact_kinds).map(readString).filter(Boolean);
  return allowed.length === 0 || allowed.includes(terminalArtifactKind);
};

const routeForbidsTerminalKind = (
  routeProductContract: HelixRouteProductContract | RecordLike | null | undefined,
  terminalArtifactKind: string,
): boolean =>
  readArray(routeProductContract?.forbidden_terminal_artifact_kinds)
    .map(readString)
    .filter(Boolean)
    .includes(terminalArtifactKind);

const requiredTerminalKind = (canonicalGoalFrame: RecordLike | null | undefined): string =>
  readString(canonicalGoalFrame?.required_terminal_kind);

export function evaluateToolFamilyTerminalPolicy(input: {
  toolName?: unknown;
  toolFamily?: unknown;
  terminalArtifactKind?: unknown;
  routeProductContract?: HelixRouteProductContract | RecordLike | null;
  canonicalGoalFrame?: RecordLike | null;
  admitted?: boolean;
  goalSatisfied?: boolean;
  operatorCommandPresent?: boolean;
  mutating?: boolean;
}): ToolFamilyTerminalPolicyDecision {
  const terminalArtifactKind = readString(input.terminalArtifactKind) || "unknown";
  const contract = resolveToolFamilyContract({
    toolName: input.toolName,
    toolFamily: input.toolFamily,
  });
  const toolName = readString(input.toolName) || contract?.toolName || null;
  const toolFamily = contract?.toolFamily ?? (readString(input.toolFamily) || null);
  const base = {
    schema: "helix.tool_family_terminal_policy.v1" as const,
    tool_name: toolName,
    tool_family: toolFamily,
    authority: contract?.authority ?? ("evidence_only" as ToolAuthority),
    terminal_artifact_kind: terminalArtifactKind,
    contract,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
  };

  if (!contract) {
    return {
      ...base,
      allowed: false,
      reason: "tool_family_contract_missing",
    };
  }

  if (isWorkstationObservationTerminalKind(terminalArtifactKind)) {
    return {
      ...base,
      allowed: false,
      reason: "observation_artifact_cannot_terminalize",
    };
  }

  if (!isReceiptTerminalKind(terminalArtifactKind)) {
    return {
      ...base,
      allowed: true,
      reason: "non_receipt_terminal_deferred_to_route_authority",
    };
  }

  if (routeForbidsTerminalKind(input.routeProductContract, terminalArtifactKind)) {
    return {
      ...base,
      allowed: false,
      reason: "terminal_kind_forbidden_by_route_product_contract",
    };
  }

  if (!routeAllowsTerminalKind(input.routeProductContract, terminalArtifactKind)) {
    return {
      ...base,
      allowed: false,
      reason: "terminal_kind_not_allowed_by_route_product_contract",
    };
  }

  if (contract.authority === "evidence_only") {
    return {
      ...base,
      allowed: false,
      reason: "evidence_only_tool_cannot_terminalize_receipt",
    };
  }

  if (!contract.allowedTerminalKinds.includes(terminalArtifactKind)) {
    return {
      ...base,
      allowed: false,
      reason: "terminal_kind_not_allowed_by_tool_family_contract",
    };
  }

  if (contract.authority === "control_receipt" && input.admitted !== true) {
    return {
      ...base,
      allowed: false,
      reason: "control_receipt_requires_admitted_tool",
    };
  }

  if ((input.mutating === true || contract.mutating) && input.operatorCommandPresent === false) {
    return {
      ...base,
      allowed: false,
      reason: "mutating_control_receipt_requires_operator_command",
    };
  }

  const required = requiredTerminalKind(input.canonicalGoalFrame);
  if (required && required !== terminalArtifactKind) {
    return {
      ...base,
      allowed: false,
      reason: "control_receipt_requires_matching_goal_terminal",
    };
  }

  if (contract.requiresGoalSatisfaction && input.goalSatisfied === false) {
    return {
      ...base,
      allowed: false,
      reason: "control_receipt_requires_goal_satisfaction",
    };
  }

  return {
    ...base,
    allowed: true,
    reason: contract.authority === "terminal_candidate"
      ? "terminal_kind_allowed_by_terminal_candidate_contract"
      : "terminal_kind_allowed_by_control_receipt_contract",
  };
}
