import crypto from "node:crypto";
import type { HelixAgentRunRoute } from "./types";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixTurnTerminalAuthority } from "../turn-terminal-authority";
import { HELIX_SCHOLARLY_TERMINAL_READY_EVIDENCE_STATES } from "@shared/helix-scholarly-research-observation";

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const SCHOLARLY_GATEWAY_CAPABILITIES = new Set([
  "scholarly-research.lookup_papers",
  "scholarly-research.fetch_full_text",
  "scholarly-research.extract_numeric_parameters",
]);

const SCHOLARLY_TERMINAL_READY_EVIDENCE_STATE_SET = new Set<string>(
  HELIX_SCHOLARLY_TERMINAL_READY_EVIDENCE_STATES,
);

const gatewayCapability = (result: HelixWorkstationGatewayCallResult): string =>
  result.gateway_admission.requested_capability || result.capability_id;

const isScholarlyGatewayCapability = (result: HelixWorkstationGatewayCallResult): boolean =>
  SCHOLARLY_GATEWAY_CAPABILITIES.has(gatewayCapability(result));

const scholarlyObservationRecord = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown> | null =>
  readRecord(result.observation) ?? readRecord(result.observation_packet?.state_delta);

const scholarlyEvidenceState = (result: HelixWorkstationGatewayCallResult): string => {
  const observation = readRecord(result.observation);
  const stateDelta = readRecord(result.observation_packet?.state_delta);
  return readString(observation?.evidence_state) || readString(stateDelta?.evidence_state);
};

const isScholarlyEvidenceSelectedForAnswer = (
  result: HelixWorkstationGatewayCallResult,
): boolean => {
  if (!isScholarlyGatewayCapability(result)) return true;
  const observation = scholarlyObservationRecord(result);
  const stateDelta = readRecord(result.observation_packet?.state_delta);
  const selectedForAnswer =
    readBoolean(observation?.selected_for_answer) ??
    readBoolean(stateDelta?.selected_for_answer) ??
    false;
  if (!selectedForAnswer) return false;
  const evidenceState = scholarlyEvidenceState(result);
  return !evidenceState || SCHOLARLY_TERMINAL_READY_EVIDENCE_STATE_SET.has(evidenceState);
};

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
  hasRecoveryAffordanceEvidence(result.observation_packet?.state_delta);

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
  isScholarlyGatewayCapability(result)
    ? isScholarlyEvidenceSelectedForAnswer(result) && result.ok === true
    : result.ok === true ||
      isScholarlyNumericMissingVariablesObservation(result) ||
      isCalculatorBlockedExpressionObservation(result) ||
      isGatewayRecoveryAffordanceObservation(result);

const scholarlyGatewayAttemptWasSupersededByUsableEvidence = (
  result: HelixWorkstationGatewayCallResult,
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
): boolean => {
  if (!isScholarlyGatewayCapability(result)) return false;
  const capability = gatewayCapability(result);
  return gatewayCallResults.some((candidate) =>
    gatewayCapability(candidate) === capability &&
    candidate.ok === true &&
    isScholarlyEvidenceSelectedForAnswer(candidate)
  );
};

const scholarlyIntentForGatewayResult = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown> | null => {
  const sourceTargetIntent = readRecord(result.gateway_admission.source_target_intent);
  return readRecord(sourceTargetIntent?.scholarly_intent) ?? sourceTargetIntent;
};

const isOptionalScholarlyFailureObservation = (
  result: HelixWorkstationGatewayCallResult,
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
): boolean => {
  if (result.ok === true || !isScholarlyGatewayCapability(result)) return false;
  const sourceTargetIntent = readRecord(result.gateway_admission.source_target_intent);
  const scholarlyIntent = scholarlyIntentForGatewayResult(result);
  const evidenceDemand = readRecord(scholarlyIntent?.evidence_demand);
  const requiredModes = readArray(evidenceDemand?.required_modes).map(readString).filter(Boolean);
  const optionalModes = readArray(evidenceDemand?.optional_modes).map(readString).filter(Boolean);
  const supportingSourcesOnly =
    readBoolean(sourceTargetIntent?.supporting_sources_only) === true ||
    readBoolean(scholarlyIntent?.supporting_sources_only) === true;
  if (supportingSourcesOnly) return true;
  if (
    gatewayCapability(result) !== "scholarly-research.fetch_full_text" ||
    requiredModes.includes("full_text") ||
    !optionalModes.includes("full_text")
  ) {
    return false;
  }
  return gatewayCallResults.some((candidate) =>
    gatewayCapability(candidate) === "scholarly-research.lookup_papers" &&
    candidate.ok === true &&
    isScholarlyEvidenceSelectedForAnswer(candidate)
  );
};

const isGatewayObservationCompatibleWithProviderReasoning = (
  result: HelixWorkstationGatewayCallResult,
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
): boolean =>
  isGatewayObservationReenteredForProviderReasoning(result) ||
  scholarlyGatewayAttemptWasSupersededByUsableEvidence(result, gatewayCallResults) ||
  isOptionalScholarlyFailureObservation(result, gatewayCallResults);

const isTextToSpeechReceiptObservation = (packet: HelixAgentStepObservationPacket): boolean => {
  if (packet.capability_key !== "text_to_speech.speak_text") return false;
  const stateDelta = readRecord(packet.state_delta);
  const receipt = readRecord(stateDelta?.text_to_speech_receipt);
  const playbackStatus = readString(receipt?.playback_status);
  return ["pending", "awaiting_client_playback", "awaiting_client_receipt", "played", "blocked", "failed"].includes(
    playbackStatus,
  );
};

const isPendingTextToSpeechHandoffObservation = (packet: HelixAgentStepObservationPacket): boolean => {
  if (packet.capability_key !== "text_to_speech.speak_text") return false;
  const stateDelta = readRecord(packet.state_delta);
  const receipt =
    readRecord(stateDelta?.text_to_speech_receipt) ??
    readRecord(stateDelta?.text_to_speech_client_playback_handoff);
  const status = readString(receipt?.playback_status || receipt?.playbackStatus || packet.status).toLowerCase();
  return ["client_pending", "pending", "awaiting_client_playback", "awaiting_client_receipt"].includes(status);
};

const providerTextClaimsVoicePlaybackCompleted = (text: string): boolean =>
  /\b(?:audio\s+)?(?:played|completed|finished|delivered|heard)\b/i.test(text) ||
  /\byou\s+(?:heard|should\s+have\s+heard)\b/i.test(text);

export const buildHelixProviderReasoningReentry = (input: {
  runtime: HelixAgentRuntimeId;
  providerLabel: string;
  turnId: string;
  threadId?: string | null;
  route?: HelixAgentRunRoute | string | null;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  capabilityLaneObservationPackets?: HelixAgentStepObservationPacket[];
  priorEvidenceObservationPackets?: HelixAgentStepObservationPacket[];
  normalizedObservationPackets?: HelixAgentStepObservationPacket[];
  providerText: string;
  ok: boolean;
  solverCompleted?: boolean;
  goalSatisfied?: boolean;
  modelOnlyDirectAnswerAllowed?: boolean;
}) => {
  const capabilityLaneObservationPackets = input.capabilityLaneObservationPackets ?? [];
  const priorEvidenceObservationPackets = input.priorEvidenceObservationPackets ?? [];
  const successfulCapabilityLaneObservationPackets = capabilityLaneObservationPackets.filter((packet) => {
    const status = packet.status.trim().toLowerCase();
    if (isTextToSpeechReceiptObservation(packet)) return true;
    return status !== "blocked" && status !== "failed" && status !== "missing_input" && status !== "needs_confirmation";
  });
  const capabilityLaneObservationRefs = capabilityLaneObservationPackets.flatMap((packet) => packet.produced_artifact_refs);
  const priorEvidenceObservationRefs = priorEvidenceObservationPackets.flatMap((packet) => packet.produced_artifact_refs);
  const successfulCapabilityLaneObservationRefs =
    successfulCapabilityLaneObservationPackets.flatMap((packet) => packet.produced_artifact_refs);
  const gatewayObservationRefs = input.gatewayCallResults.flatMap((result) => result.artifact_refs);
  const observationRefs = [
    ...gatewayObservationRefs,
    ...capabilityLaneObservationRefs,
    ...priorEvidenceObservationRefs,
  ];
  const successfulGatewayObservationRefs = input.gatewayCallResults
    .filter((result) =>
      isGatewayObservationCompatibleWithProviderReasoning(result, input.gatewayCallResults)
    )
    .flatMap((result) => result.artifact_refs);
  const successfulObservationRefs = [
    ...successfulGatewayObservationRefs,
    ...successfulCapabilityLaneObservationRefs,
    ...priorEvidenceObservationRefs,
  ];
  const normalizedObservationPackets =
    input.normalizedObservationPackets ?? [
      ...input.gatewayCallResults.map((result) => result.observation_packet),
      ...capabilityLaneObservationPackets,
      ...priorEvidenceObservationPackets,
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
    input.gatewayCallResults.every((result) =>
      isGatewayObservationCompatibleWithProviderReasoning(result, input.gatewayCallResults)
    );
  const allCapabilityLaneObservationsSucceeded =
    capabilityLaneObservationPackets.length === 0 ||
    successfulCapabilityLaneObservationPackets.length === capabilityLaneObservationPackets.length;
  const evidenceSourceCount =
    input.gatewayCallResults.length + capabilityLaneObservationPackets.length + priorEvidenceObservationPackets.length;
  const allEvidenceSucceeded = allGatewayCallsSucceeded && allCapabilityLaneObservationsSucceeded;
  const evidenceReentryRequired = evidenceSourceCount > 0;
  const noEvidenceDirectAnswerReady =
    !evidenceReentryRequired &&
    input.modelOnlyDirectAnswerAllowed === true &&
    allEvidenceSucceeded;
  const normalizedObservationsReady =
    noEvidenceDirectAnswerReady ||
    (
      evidenceReentryRequired &&
      allEvidenceSucceeded &&
      normalizedObservationPackets.length >= evidenceSourceCount &&
      normalizedObservationPackets.length > 0
    );
  const solverAuthoritySatisfied = input.solverCompleted === true && input.goalSatisfied !== false;
  const candidateId = input.ok && input.providerText.trim()
    ? `${input.turnId}:agent_provider_terminal_candidate:${input.runtime}:${sha256(input.providerText).slice(0, 16)}`
    : null;
  const pendingVoiceHandoffOverclaim = Boolean(
    candidateId &&
      capabilityLaneObservationPackets.some(isPendingTextToSpeechHandoffObservation) &&
      providerTextClaimsVoicePlaybackCompleted(input.providerText),
  );
  const terminalAuthorityMayUseProviderText =
    Boolean(candidateId && normalizedObservationsReady && solverAuthoritySatisfied && !pendingVoiceHandoffOverclaim);
  const terminalAuthorityStatus = terminalAuthorityMayUseProviderText
    ? noEvidenceDirectAnswerReady
      ? "authorized_by_model_only_direct_answer_contract"
      : "authorized_by_helix_provider_candidate_bridge"
    : candidateId && pendingVoiceHandoffOverclaim
      ? "blocked_by_voice_playback_overclaim"
    : candidateId && !allEvidenceSucceeded
      ? "blocked_by_observation_state"
      : candidateId && !normalizedObservationsReady
        ? "blocked_by_missing_normalized_observations"
        : candidateId
          ? "blocked_pending_helix_solver_completion"
          : input.modelOnlyDirectAnswerAllowed === true
            ? "provider_terminal_candidate_missing_for_model_only_direct_answer"
          : "not_evaluated_provider_text_mode";
  const terminalAuthorityBlockers = candidateId
    ? terminalAuthorityMayUseProviderText
      ? []
      : pendingVoiceHandoffOverclaim
        ? ["voice_playback_completion_not_observed"]
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
        evidence_reentry_required: evidenceReentryRequired,
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
    prior_evidence_observation_packet_count: priorEvidenceObservationPackets.length,
    evidence_reentry_required: evidenceReentryRequired,
    model_only_direct_answer_allowed: input.modelOnlyDirectAnswerAllowed === true,
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
    prior_evidence_observation_refs: priorEvidenceObservationRefs,
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
    prior_evidence_observation_refs: priorEvidenceObservationRefs,
    normalized_observation_refs: normalizedObservationRefs,
    normalized_observation_packet_count: normalizedObservationPackets.length,
    capability_lane_observation_packet_count: capabilityLaneObservationPackets.length,
    prior_evidence_observation_packet_count: priorEvidenceObservationPackets.length,
    all_gateway_calls_succeeded: allGatewayCallsSucceeded,
    all_capability_lane_observations_succeeded: allCapabilityLaneObservationsSucceeded,
    all_observations_succeeded: allEvidenceSucceeded,
    normalized_observations_ready: normalizedObservationsReady,
    evidence_reentry_required: evidenceReentryRequired,
    model_only_direct_answer_allowed: input.modelOnlyDirectAnswerAllowed === true,
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
