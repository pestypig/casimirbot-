import crypto from "node:crypto";
import type { HelixAgentRunRoute } from "./types";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixTurnTerminalAuthority } from "../turn-terminal-authority";

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const hasRecoveryAffordanceEvidence = (value: unknown): boolean => {
  const record = readRecord(value);
  if (!record) return false;
  if (readArray(record.recovery_affordances).length > 0) return true;
  return Boolean(
    readRecord(record.scholarly_lookup_recovery_affordance) ||
      readRecord(record.scholarly_numeric_recovery_affordance) ||
      readRecord(record.scholarly_full_text_recovery_affordance)
  );
};

const isGatewayRecoveryAffordanceObservation = (
  result: HelixWorkstationGatewayCallResult,
): boolean =>
  hasRecoveryAffordanceEvidence(result.observation) ||
  hasRecoveryAffordanceEvidence(result.observation_packet.state_delta);

const isScholarlyNumericMissingVariablesObservation = (
  result: HelixWorkstationGatewayCallResult,
): boolean => {
  const capability = result.gateway_admission.requested_capability || result.capability_id;
  if (capability !== "scholarly-research.extract_numeric_parameters") return false;
  const observation = readRecord(result.observation);
  if (!observation) return false;
  const missingRequirements = readArray(observation.missing_requirements).map(readString).filter(Boolean);
  const missingVariables = readArray(observation.missing_variables).map(readString).filter(Boolean);
  return (
    readString(observation.schema) === "helix.scholarly_numeric_parameter_observation.v1" &&
    (missingRequirements.includes("missing_requested_numeric_variables") ||
      result.error === "missing_requested_numeric_variables" ||
      missingVariables.length > 0)
  );
};

const CALCULATOR_RECOVERABLE_BLOCKED_REASONS = new Set([
  "missing_expression",
  "expression_too_long",
  "unsupported_expression_syntax",
  "expression_has_no_operator",
  "expression_result_not_finite",
  "expression_evaluation_failed",
]);

const isCalculatorBlockedExpressionObservation = (
  result: HelixWorkstationGatewayCallResult,
): boolean => {
  const capability = result.gateway_admission.requested_capability || result.capability_id;
  if (capability !== "scientific-calculator.solve_expression") return false;
  const observation = readRecord(result.observation);
  if (!observation) return false;
  const blockedReason =
    readString(observation.blocked_reason) ||
    readString(result.error) ||
    readString(result.gateway_admission.blocked_reason);
  return (
    result.ok !== true &&
    readString(observation.schema) === "helix.calculator_solve_observation.v1" &&
    readString(observation.status) === "blocked" &&
    CALCULATOR_RECOVERABLE_BLOCKED_REASONS.has(blockedReason)
  );
};

const isGatewayObservationReenteredForProviderReasoning = (
  result: HelixWorkstationGatewayCallResult,
): boolean =>
  result.ok === true ||
  isScholarlyNumericMissingVariablesObservation(result) ||
  isCalculatorBlockedExpressionObservation(result) ||
  isGatewayRecoveryAffordanceObservation(result);

export const buildHelixProviderReasoningReentry = (input: {
  runtime: HelixAgentRuntimeId;
  providerLabel: string;
  turnId: string;
  threadId?: string | null;
  route?: HelixAgentRunRoute | string | null;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  capabilityLaneObservationPackets?: HelixAgentStepObservationPacket[];
  normalizedObservationPackets?: HelixAgentStepObservationPacket[];
  providerText: string;
  ok: boolean;
  solverCompleted?: boolean;
  goalSatisfied?: boolean;
}) => {
  const capabilityLaneObservationPackets = input.capabilityLaneObservationPackets ?? [];
  const successfulCapabilityLaneObservationPackets = capabilityLaneObservationPackets.filter((packet) => {
    const status = packet.status.trim().toLowerCase();
    return status !== "blocked" && status !== "failed" && status !== "missing_input" && status !== "needs_confirmation";
  });
  const capabilityLaneObservationRefs = capabilityLaneObservationPackets.flatMap((packet) => packet.produced_artifact_refs);
  const successfulCapabilityLaneObservationRefs =
    successfulCapabilityLaneObservationPackets.flatMap((packet) => packet.produced_artifact_refs);
  const gatewayObservationRefs = input.gatewayCallResults.flatMap((result) => result.artifact_refs);
  const observationRefs = [
    ...gatewayObservationRefs,
    ...capabilityLaneObservationRefs,
  ];
  const successfulGatewayObservationRefs = input.gatewayCallResults
    .filter(isGatewayObservationReenteredForProviderReasoning)
    .flatMap((result) => result.artifact_refs);
  const successfulObservationRefs = [
    ...successfulGatewayObservationRefs,
    ...successfulCapabilityLaneObservationRefs,
  ];
  const normalizedObservationPackets =
    input.normalizedObservationPackets ?? [
      ...input.gatewayCallResults.map((result) => result.observation_packet),
      ...capabilityLaneObservationPackets,
    ];
  const normalizedObservationRefs = Array.from(
    new Set(
      normalizedObservationPackets
        .flatMap((packet) => packet.produced_artifact_refs)
        .filter((ref) => ref.trim().length > 0),
    ),
  );
  const allGatewayCallsSucceeded =
    input.gatewayCallResults.length === 0 ||
    input.gatewayCallResults.every(isGatewayObservationReenteredForProviderReasoning);
  const allCapabilityLaneObservationsSucceeded =
    capabilityLaneObservationPackets.length === 0 ||
    successfulCapabilityLaneObservationPackets.length === capabilityLaneObservationPackets.length;
  const evidenceSourceCount = input.gatewayCallResults.length + capabilityLaneObservationPackets.length;
  const allEvidenceSucceeded = allGatewayCallsSucceeded && allCapabilityLaneObservationsSucceeded;
  const normalizedObservationsReady =
    evidenceSourceCount > 0 &&
    allEvidenceSucceeded &&
    normalizedObservationPackets.length >= evidenceSourceCount &&
    normalizedObservationPackets.length > 0;
  const solverAuthoritySatisfied = input.solverCompleted === true && input.goalSatisfied !== false;
  const candidateId = input.ok && input.providerText.trim()
    ? `${input.turnId}:agent_provider_terminal_candidate:${input.runtime}:${sha256(input.providerText).slice(0, 16)}`
    : null;
  const terminalAuthorityMayUseProviderText =
    Boolean(candidateId && normalizedObservationsReady && solverAuthoritySatisfied);
  const terminalAuthorityStatus = terminalAuthorityMayUseProviderText
    ? "authorized_by_helix_provider_candidate_bridge"
    : candidateId && !allEvidenceSucceeded
      ? "blocked_by_observation_state"
      : candidateId && !normalizedObservationsReady
        ? "blocked_by_missing_normalized_observations"
        : candidateId
          ? "blocked_pending_helix_solver_completion"
          : "not_evaluated_provider_text_mode";
  const terminalAuthorityBlockers = candidateId
    ? terminalAuthorityMayUseProviderText
      ? []
      : !allGatewayCallsSucceeded
        ? ["gateway_observation_missing_or_failed"]
        : !allCapabilityLaneObservationsSucceeded
          ? ["capability_lane_observation_missing_or_failed"]
        : !normalizedObservationsReady
          ? ["normalized_observation_packet_missing"]
          : ["helix_solver_completion_required"]
    : ["provider_terminal_candidate_missing"];
  const providerTerminalCandidate = candidateId
    ? {
        schema: "helix.agent_provider_terminal_candidate.v1",
        candidate_id: candidateId,
        turn_id: input.turnId,
        agent_runtime: input.runtime,
        selected_agent_provider: input.runtime,
        provider_label: input.providerLabel,
        source: "agent_provider_text_mode_adapter",
        candidate_text_hash: sha256(input.providerText),
        candidate_text_length: input.providerText.length,
        candidate_text_preview: input.providerText.slice(0, 4000),
        grounded_in_observation_refs: observationRefs,
        normalized_observation_refs: normalizedObservationRefs,
        evidence_reentry_required: evidenceSourceCount > 0,
        provider_reasoning_completed: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }
    : null;
  const providerReasoningReentry = {
    schema: "helix.provider_reasoning_reentry.v1",
    turn_id: input.turnId,
    agent_runtime: input.runtime,
    selected_agent_provider: input.runtime,
    provider_label: input.providerLabel,
    status: terminalAuthorityMayUseProviderText
      ? "completed"
      : candidateId
        ? "pending_helix_solver_reentry"
        : input.ok
          ? "empty_provider_answer"
          : "not_run",
    input_observation_refs: observationRefs,
    normalized_observation_refs: normalizedObservationRefs,
    normalized_observation_packet_count: normalizedObservationPackets.length,
    capability_lane_observation_packet_count: capabilityLaneObservationPackets.length,
    provider_terminal_candidate_ref: candidateId,
    provider_terminal_candidate_present: Boolean(candidateId),
    post_tool_model_step_required: Boolean(candidateId && !terminalAuthorityMayUseProviderText),
    evidence_reentered: terminalAuthorityMayUseProviderText,
    solver_completed: input.solverCompleted === true,
    goal_satisfaction_compatible: input.goalSatisfied === true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const terminalAuthorityCandidateReview = {
    schema: "helix.provider_terminal_authority_candidate_review.v1",
    turn_id: input.turnId,
    agent_runtime: input.runtime,
    selected_agent_provider: input.runtime,
    provider_label: input.providerLabel,
    candidate_ref: candidateId,
    terminal_authority_status: terminalAuthorityStatus,
    terminal_authority_granted: terminalAuthorityMayUseProviderText,
    final_visible_answer_authorized: terminalAuthorityMayUseProviderText,
    blockers: terminalAuthorityBlockers,
    selected_observation_refs: successfulObservationRefs,
    normalized_observation_refs: normalizedObservationRefs,
    capability_lane_observation_refs: successfulCapabilityLaneObservationRefs,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const terminalAnswerAuthority =
    candidateId && terminalAuthorityMayUseProviderText
      ? buildHelixTurnTerminalAuthority({
          thread_id: input.threadId || "helix-agent-provider",
          turn_id: input.turnId,
          route: input.route || "/ask/turn",
          final_answer_source: "agent_provider_terminal_candidate",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
          terminal_text: input.providerText,
          terminal_item_id: candidateId,
          terminal_kind: "answer",
          authority_origin: "selected_final_answer",
          server_authoritative: true,
          terminal_eligible: true,
          assistant_answer: false,
        })
      : null;
  const terminalPresentation =
    terminalAnswerAuthority
      ? {
          schema: "helix.terminal_presentation.v1",
          turn_id: input.turnId,
          concise_text: input.providerText,
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_authority_ref: candidateId,
        selected_observation_refs: successfulObservationRefs,
        presentation_policy: "preserve_provider_text",
        helix_style_rewrite_applied: false,
        assistant_answer: false,
        raw_content_included: false,
      }
      : null;
  const providerTerminalAuthorityBridge = {
    schema: "helix.provider_terminal_authority_bridge.v1",
    turn_id: input.turnId,
    agent_runtime: input.runtime,
    selected_agent_provider: input.runtime,
    provider_label: input.providerLabel,
    provider_terminal_candidate_ref: candidateId,
    gateway_observation_refs: gatewayObservationRefs,
    successful_gateway_observation_refs: successfulGatewayObservationRefs,
    capability_lane_observation_refs: capabilityLaneObservationRefs,
    successful_capability_lane_observation_refs: successfulCapabilityLaneObservationRefs,
    normalized_observation_refs: normalizedObservationRefs,
    normalized_observation_packet_count: normalizedObservationPackets.length,
    capability_lane_observation_packet_count: capabilityLaneObservationPackets.length,
    all_gateway_calls_succeeded: allGatewayCallsSucceeded,
    all_capability_lane_observations_succeeded: allCapabilityLaneObservationsSucceeded,
    all_observations_succeeded: allEvidenceSucceeded,
    normalized_observations_ready: normalizedObservationsReady,
    solver_completed: input.solverCompleted === true,
    goal_satisfaction_compatible: input.goalSatisfied === true,
    route_authority_status: terminalAnswerAuthority
      ? "provider_gateway_read_observe_contract_satisfied"
      : "not_authorized",
    terminal_authority_status: terminalAuthorityCandidateReview.terminal_authority_status,
    terminal_authority_granted: terminalAuthorityCandidateReview.terminal_authority_granted,
    final_visible_answer_authorized: terminalAuthorityCandidateReview.final_visible_answer_authorized,
    final_answer_source: terminalAnswerAuthority ? "agent_provider_terminal_candidate" : null,
    terminal_artifact_kind: terminalAnswerAuthority ? "agent_provider_terminal_candidate" : null,
    terminal_presentation_policy: terminalAnswerAuthority ? "preserve_provider_text" : null,
    helix_style_rewrite_applied: false,
    terminal_answer_authority: terminalAnswerAuthority,
    terminal_presentation: terminalPresentation,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  return {
    providerTerminalCandidate,
    providerReasoningReentry,
    terminalAuthorityCandidateReview,
    providerTerminalAuthorityBridge,
    terminalAnswerAuthority,
    terminalPresentation,
    workstationGatewayReentryStatus: providerReasoningReentry.status,
    terminalAuthorityStatus: terminalAuthorityCandidateReview.terminal_authority_status,
  };
};
