import crypto from "node:crypto";
import type { HelixAgentRunRoute } from "./types";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixTurnTerminalAuthority } from "../turn-terminal-authority";
import { HELIX_SCHOLARLY_TERMINAL_READY_EVIDENCE_STATES } from "@shared/helix-scholarly-research-observation";
import {
  hasRuntimeSelectedUsableScholarlyLookupEvidence,
  hasRuntimeSelectedUsableScholarlyFullTextEvidence,
  isRuntimeSelectedUsableScholarlyLookupResult,
  isRuntimeSelectedUsableScholarlyFullTextResult,
} from "./scholarly-gateway-evidence";

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const readStringArray = (value: unknown): string[] =>
  readArray(value).map(readString).filter(Boolean);

export const buildTerminalLifecycleObservationProjection = (input: {
  providerEvidenceReentered: boolean;
  gatewayObservationPackets: HelixAgentStepObservationPacket[];
  capabilityLaneObservationPackets: HelixAgentStepObservationPacket[];
}): {
  lane_executed: boolean;
  observation_reentered: boolean;
  observation_ref: string | null;
  has_observation: boolean;
} => {
  const observationPackets = [
    ...input.gatewayObservationPackets,
    ...input.capabilityLaneObservationPackets,
  ];
  const observationRef = observationPackets
    .flatMap((packet) => packet.produced_artifact_refs)
    .map(readString)
    .find(Boolean);
  const hasObservation = observationPackets.length > 0;
  return {
    lane_executed: hasObservation,
    observation_reentered:
      hasObservation && input.providerEvidenceReentered === true,
    observation_ref: observationRef ?? null,
    has_observation: hasObservation,
  };
};

const committedSubgoalsAreSatisfied = (value: unknown): boolean => {
  const contract = readRecord(value);
  if (
    readString(contract?.schema) !== "helix.compound_capability_contract.v1"
  ) {
    return false;
  }
  const subgoals = readArray(contract?.subgoals)
    .map(readRecord)
    .filter((subgoal): subgoal is Record<string, unknown> => Boolean(subgoal));
  if (subgoals.length === 0) return false;
  const contractRailStatus = readString(contract?.rail_status).toLowerCase();
  if (!["satisfied", "complete"].includes(contractRailStatus)) return false;
  return subgoals.every((subgoal) => {
    const satisfied =
      readBoolean(subgoal.satisfied) === true ||
      readString(subgoal.satisfaction).toLowerCase() === "satisfied";
    const railStatus = readString(subgoal.rail_status).toLowerCase();
    const supportRefs = [
      ...readStringArray(subgoal.support_refs),
      ...readStringArray(subgoal.observation_refs),
      readString(subgoal.observation_ref),
    ].filter(Boolean);
    return (
      Boolean(readString(subgoal.requested_capability)) &&
      satisfied &&
      ["satisfied", "complete"].includes(railStatus) &&
      supportRefs.length > 0
    );
  });
};

const committedSubgoalContractApplies = (value: unknown): boolean => {
  const contract = readRecord(value);
  return Boolean(
    readString(contract?.schema) === "helix.compound_capability_contract.v1" &&
    readArray(contract?.subgoals).length > 1,
  );
};

const isActionableBlockedCapabilityLaneObservation = (input: {
  packet: HelixAgentStepObservationPacket;
  turnId: string;
  normalizedObservationPackets: HelixAgentStepObservationPacket[];
}): boolean => {
  if (
    input.packet.schema !== "helix.agent_step_observation_packet.v1" ||
    input.packet.turn_id !== input.turnId ||
    readString(input.packet.status).toLowerCase() !== "blocked" ||
    input.packet.assistant_answer !== false ||
    input.packet.terminal_eligible !== false
  ) {
    return false;
  }
  const producedRefs = readStringArray(input.packet.produced_artifact_refs);
  if (producedRefs.length === 0) return false;
  const actionableRequirement = readArray(input.packet.missing_requirements)
    .map(readRecord)
    .filter((requirement): requirement is Record<string, unknown> =>
      Boolean(requirement),
    )
    .some(
      (requirement) =>
        Boolean(readString(requirement.code)) &&
        Boolean(readString(requirement.repair_action)),
    );
  const actionableNextStep = readStringArray(
    input.packet.suggested_next_steps,
  ).some((step) =>
    ["repair", "ask_user", "use_another_tool"].includes(step.toLowerCase()),
  );
  if (!actionableRequirement || !actionableNextStep) return false;
  return input.normalizedObservationPackets.some((candidate) => {
    if (
      candidate.schema !== "helix.agent_step_observation_packet.v1" ||
      candidate.turn_id !== input.turnId ||
      candidate.capability_key !== input.packet.capability_key ||
      readString(candidate.status).toLowerCase() !== "blocked"
    ) {
      return false;
    }
    const normalizedRefs = new Set(
      readStringArray(candidate.produced_artifact_refs),
    );
    return producedRefs.every((ref) => normalizedRefs.has(ref));
  });
};

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

export const hasSuccessfulLaterRetryForFailedGatewayCapability = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  failedIndex: number,
): boolean => {
  const failed = gatewayCallResults[failedIndex];
  if (!failed || failed.ok === true) return false;
  const nextAction = readString(failed.tool_followup_decision?.next_action);
  const retryRecommendation = readString(
    failed.tool_lifecycle_trace?.retry_recommendation,
  );
  const observation = readRecord(failed.observation);
  const failureCode =
    readString(failed.error) ||
    readString(failed.gateway_admission.blocked_reason) ||
    readString(observation?.error_code);
  const retryableInvalidArguments = [
    "schema_validation_failed",
    "invalid_arguments",
    "invalid_args",
  ].includes(failureCode);
  const supersedableCurrentTurnReadFailure =
    failureCode === "current_turn_reentry_ineligible" &&
    ["read", "observe", "verify"].includes(failed.mode);
  const supersedableEnvironmentSelectionFailure = [
    "wrong_environment",
    "wrong_world",
  ].includes(failureCode);
  if (
    failureCode === "current_turn_reentry_ineligible" &&
    !supersedableCurrentTurnReadFailure
  ) {
    return false;
  }
  if (
    nextAction !== "retry" &&
    nextAction !== "alternate_probe" &&
    retryRecommendation !== "retry_same_tool" &&
    retryRecommendation !== "try_alternate_probe" &&
    !retryableInvalidArguments &&
    !supersedableCurrentTurnReadFailure &&
    !supersedableEnvironmentSelectionFailure
  ) {
    return false;
  }
  const failedCapability = gatewayCapability(failed);
  return gatewayCallResults.some((candidate, index) => {
    if (candidate.ok !== true) return false;
    const observationStatus = readString(
      candidate.observation_packet?.status,
    ).toLowerCase();
    const successfulSameCapability =
      gatewayCapability(candidate) === failedCapability &&
      (!observationStatus ||
        /^(?:succeeded|completed|complete|observed|ok)$/.test(
          observationStatus,
        ));
    if (!successfulSameCapability) return false;
    if (supersedableEnvironmentSelectionFailure) {
      const failedTurnId = readString(failed.observation_packet?.turn_id);
      const candidateTurnId = readString(candidate.observation_packet?.turn_id);
      // `wrong_environment` is an admission/selection diagnosis, not durable
      // proof that the requested subgoal can never succeed. Preserve it in the
      // evidence ledger, but do not let it overwrite a later successful
      // synthesis when the same current turn and capability produced a fresh,
      // admitted observation. Cross-turn evidence and permission/provenance
      // failures remain fail-closed.
      return (
        index > failedIndex &&
        Boolean(failedTurnId) &&
        failedTurnId === candidateTurnId
      );
    }
    if (supersedableCurrentTurnReadFailure) {
      return (
        index > failedIndex &&
        ["read", "observe", "verify"].includes(candidate.mode)
      );
    }
    // Gateway result arrays are a projection and can be reverse-ordered after
    // bounded provider continuation. A read-only invalid-argument attempt is
    // evidence-compatible once the same capability produced a successful
    // current-turn observation, regardless of projection order. Mutating and
    // non-schema failures still require an explicitly later successful retry.
    return (
      index > failedIndex ||
      (retryableInvalidArguments &&
        failed.mode === "read" &&
        candidate.mode === "read")
    );
  });
};

export const hasCurrentTurnResidentSemanticReplanRecovery = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  failedIndex: number,
): boolean => {
  const failed = gatewayCallResults[failedIndex];
  if (!failed || failed.ok === true) return false;
  const observation = readRecord(failed.observation);
  const result = readRecord(observation?.result);
  const failureCode =
    readString(failed.error) || readString(observation?.outcome);
  const summary =
    readString(observation?.summary) ||
    readString(failed.observation_packet?.observation_summary);
  const exactResidentEscalation = Boolean(
    failureCode === "request_canceled" &&
      /(?:requires?|request(?:ed|ing)?)_semantic_replan|semantic replan/i.test(
        summary,
      ) &&
      readBoolean(result?.manual_override_detected) !== true &&
      readBoolean(result?.controls_released) === true &&
      ["repair", "retry"].includes(
        readString(failed.tool_followup_decision?.next_action),
      ) &&
      readBoolean(
        failed.tool_followup_decision?.external_change_required,
      ) !== true,
  );
  if (!exactResidentEscalation) return false;
  const failedTurnId = readString(failed.observation_packet?.turn_id);
  return gatewayCallResults.some((candidate, index) => {
    if (index <= failedIndex || candidate.ok !== true) return false;
    const candidateTurnId = readString(candidate.observation_packet?.turn_id);
    return Boolean(failedTurnId) && candidateTurnId === failedTurnId;
  });
};

const providerTextContradictsResidentSemanticReplan = (input: {
  providerText: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): boolean => {
  const residentEscalationObserved = input.gatewayCallResults.some((result) => {
    const observation = readRecord(result.observation);
    const summary =
      readString(observation?.summary) ||
      readString(result.observation_packet?.observation_summary);
    return Boolean(
      result.ok !== true &&
        (readString(result.error) || readString(observation?.outcome)) ===
          "request_canceled" &&
        /(?:requires?|request(?:ed|ing)?)_semantic_replan|semantic replan/i.test(
          summary,
        ),
    );
  });
  if (!residentEscalationObserved) return false;
  const text = input.providerText;
  const deniesObservedInterruption =
    /\bno\s+(?:blocked\s+movement|blockage|obstruction|interruption)\s+(?:was\s+)?(?:detected|observed|reported|encountered)\b/i.test(
      text,
    );
  const acknowledgesObservedInterruption =
    /\b(?:blocked|blockage|obstruction|interrupted|interruption|stopped|halted|semantic\s+replan)\b/i.test(
      text,
    );
  return deniesObservedInterruption || !acknowledgesObservedInterruption;
};

const isScholarlyGatewayCapability = (
  result: HelixWorkstationGatewayCallResult,
): boolean => SCHOLARLY_GATEWAY_CAPABILITIES.has(gatewayCapability(result));

const scholarlyObservationRecord = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown> | null =>
  readRecord(result.observation) ??
  readRecord(result.observation_packet?.state_delta);

const scholarlyEvidenceState = (
  result: HelixWorkstationGatewayCallResult,
): string => {
  const observation = readRecord(result.observation);
  const stateDelta = readRecord(result.observation_packet?.state_delta);
  return (
    readString(observation?.evidence_state) ||
    readString(stateDelta?.evidence_state)
  );
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
  return (
    !evidenceState ||
    SCHOLARLY_TERMINAL_READY_EVIDENCE_STATE_SET.has(evidenceState)
  );
};

const hasRecoveryAffordanceEvidence = (value: unknown): boolean => {
  const record = readRecord(value);
  if (!record) return false;
  if (readArray(record.recovery_affordances).length > 0) return true;
  return Boolean(
    readRecord(record.scholarly_lookup_recovery_affordance) ||
    readRecord(record.scholarly_numeric_recovery_affordance) ||
    readRecord(record.scholarly_full_text_recovery_affordance),
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
  const capability =
    result.gateway_admission.requested_capability || result.capability_id;
  if (capability !== "scholarly-research.extract_numeric_parameters")
    return false;
  const observation = readRecord(result.observation);
  if (!observation) return false;
  const missingRequirements = readArray(observation.missing_requirements)
    .map(readString)
    .filter(Boolean);
  const missingVariables = readArray(observation.missing_variables)
    .map(readString)
    .filter(Boolean);
  return (
    readString(observation.schema) ===
      "helix.scholarly_numeric_parameter_observation.v1" &&
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
  const capability =
    result.gateway_admission.requested_capability || result.capability_id;
  if (capability !== "scientific-calculator.solve_expression") return false;
  const observation = readRecord(result.observation);
  if (!observation) return false;
  const blockedReason =
    readString(observation.blocked_reason) ||
    readString(result.error) ||
    readString(result.gateway_admission.blocked_reason);
  return (
    result.ok !== true &&
    readString(observation.schema) ===
      "helix.calculator_solve_observation.v1" &&
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
  return gatewayCallResults.some(
    (candidate) =>
      gatewayCapability(candidate) === capability &&
      candidate.ok === true &&
      isScholarlyEvidenceSelectedForAnswer(candidate),
  );
};

const scholarlyIntentForGatewayResult = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown> | null => {
  const sourceTargetIntent = readRecord(
    result.gateway_admission.source_target_intent,
  );
  return readRecord(sourceTargetIntent?.scholarly_intent) ?? sourceTargetIntent;
};

const isOptionalScholarlyFailureObservation = (
  result: HelixWorkstationGatewayCallResult,
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  options: {
    selectedScholarlyResultIds?: string[];
    structuredNumericEvidenceRequired?: boolean;
  },
): boolean => {
  if (result.ok === true || !isScholarlyGatewayCapability(result)) return false;
  const sourceTargetIntent = readRecord(
    result.gateway_admission.source_target_intent,
  );
  const scholarlyIntent = scholarlyIntentForGatewayResult(result);
  const evidenceDemand = readRecord(scholarlyIntent?.evidence_demand);
  const requiredModes = readArray(evidenceDemand?.required_modes)
    .map(readString)
    .filter(Boolean);
  const optionalModes = readArray(evidenceDemand?.optional_modes)
    .map(readString)
    .filter(Boolean);
  const supportingSourcesOnly =
    readBoolean(sourceTargetIntent?.supporting_sources_only) === true ||
    readBoolean(scholarlyIntent?.supporting_sources_only) === true;
  if (supportingSourcesOnly) return true;
  if (
    gatewayCapability(result) ===
      "scholarly-research.extract_numeric_parameters" &&
    options.structuredNumericEvidenceRequired !== true &&
    hasRuntimeSelectedUsableScholarlyFullTextEvidence({
      gatewayCallResults,
      selectedResultIds: options.selectedScholarlyResultIds,
    })
  ) {
    return true;
  }
  if (
    gatewayCapability(result) !== "scholarly-research.fetch_full_text" ||
    requiredModes.includes("full_text") ||
    !optionalModes.includes("full_text")
  ) {
    return false;
  }
  return gatewayCallResults.some(
    (candidate) =>
      gatewayCapability(candidate) === "scholarly-research.lookup_papers" &&
      candidate.ok === true &&
      isScholarlyEvidenceSelectedForAnswer(candidate),
  );
};

const isHardGatewayEvidenceBoundary = (
  result: HelixWorkstationGatewayCallResult,
): boolean => {
  const observation = readRecord(result.observation);
  const detail = readRecord(observation?.result);
  const failureCode =
    readString(result.error) ||
    readString(result.gateway_admission.blocked_reason) ||
    readString(observation?.outcome);
  if (
    [
      "permission_denied",
      "permission_revoked",
      "provenance_invalid",
      "source_identity_mismatch",
      "tenant_mismatch",
      "account_mismatch",
      "action_outcome_unknown",
      "connector_offline",
    ].includes(failureCode)
  ) {
    return true;
  }
  if (
    readBoolean(observation?.provenance_valid) === false ||
    readBoolean(observation?.eligible_for_current_turn_reentry) === false ||
    readBoolean(result.tool_followup_decision?.external_change_required) ===
      true ||
    readBoolean(detail?.manual_override_detected) === true
  ) {
    return true;
  }
  return false;
};

const isOperationalFailureSupersededBySatisfiedCommittedSubgoals = (input: {
  result: HelixWorkstationGatewayCallResult;
  committedSubgoalsSatisfied: boolean;
}): boolean =>
  input.result.ok !== true &&
  input.committedSubgoalsSatisfied &&
  input.result.artifact_refs.length > 0 &&
  !isHardGatewayEvidenceBoundary(input.result);

const isGatewayObservationCompatibleWithProviderReasoning = (
  result: HelixWorkstationGatewayCallResult,
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  options: {
    selectedScholarlyResultIds?: string[];
    structuredNumericEvidenceRequired?: boolean;
    committedSubgoalsSatisfied?: boolean;
  },
): boolean => {
  const resultIndex = gatewayCallResults.indexOf(result);
  return (
    isRuntimeSelectedUsableScholarlyLookupResult({
      result,
      selectedResultIds: options.selectedScholarlyResultIds,
    }) ||
    isRuntimeSelectedUsableScholarlyFullTextResult({
      result,
      selectedResultIds: options.selectedScholarlyResultIds,
    }) ||
    isGatewayObservationReenteredForProviderReasoning(result) ||
    scholarlyGatewayAttemptWasSupersededByUsableEvidence(
      result,
      gatewayCallResults,
    ) ||
    (resultIndex >= 0 &&
      hasSuccessfulLaterRetryForFailedGatewayCapability(
        gatewayCallResults,
        resultIndex,
      )) ||
    (resultIndex >= 0 &&
      hasCurrentTurnResidentSemanticReplanRecovery(
        gatewayCallResults,
        resultIndex,
      )) ||
    isOperationalFailureSupersededBySatisfiedCommittedSubgoals({
      result,
      committedSubgoalsSatisfied:
        options.committedSubgoalsSatisfied === true,
    }) ||
    isOptionalScholarlyFailureObservation(result, gatewayCallResults, options)
  );
};

const isTextToSpeechReceiptObservation = (
  packet: HelixAgentStepObservationPacket,
): boolean => {
  if (packet.capability_key !== "text_to_speech.speak_text") return false;
  const stateDelta = readRecord(packet.state_delta);
  const receipt = readRecord(stateDelta?.text_to_speech_receipt);
  const playbackStatus = readString(receipt?.playback_status);
  return [
    "pending",
    "awaiting_client_playback",
    "awaiting_client_receipt",
    "played",
    "blocked",
    "failed",
  ].includes(playbackStatus);
};

const isPendingTextToSpeechHandoffObservation = (
  packet: HelixAgentStepObservationPacket,
): boolean => {
  if (packet.capability_key !== "text_to_speech.speak_text") return false;
  const stateDelta = readRecord(packet.state_delta);
  const receipt =
    readRecord(stateDelta?.text_to_speech_receipt) ??
    readRecord(stateDelta?.text_to_speech_client_playback_handoff);
  const status = readString(
    receipt?.playback_status || receipt?.playbackStatus || packet.status,
  ).toLowerCase();
  return [
    "client_pending",
    "pending",
    "awaiting_client_playback",
    "awaiting_client_receipt",
  ].includes(status);
};

const providerTextClaimsVoicePlaybackCompleted = (text: string): boolean =>
  /\b(?:audio\s+)?(?:played|completed|finished|delivered|heard)\b/i.test(
    text,
  ) || /\byou\s+(?:heard|should\s+have\s+heard)\b/i.test(text);

export type HelixProviderTerminalIntent = "answer" | "request_user_input";

export const providerRequestUserInputBoundaryObservationRefs = (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  normalizedObservationPackets?: HelixAgentStepObservationPacket[];
}): string[] => {
  const normalizedPackets =
    input.normalizedObservationPackets ??
    input.gatewayCallResults.map((result) => result.observation_packet);
  const normalizedRefs = new Set(
    normalizedPackets
      .filter(
        (packet) =>
          packet.schema === "helix.agent_step_observation_packet.v1" &&
          packet.turn_id === input.turnId,
      )
      .flatMap((packet) => packet.produced_artifact_refs)
      .filter(Boolean),
  );
  return Array.from(
    new Set(
      input.gatewayCallResults.flatMap((result) => {
        const packet = result.observation_packet;
        const status = readString(packet.status).toLowerCase();
        const refs = Array.from(
          new Set(
            [...result.artifact_refs, ...packet.produced_artifact_refs].filter(
              Boolean,
            ),
          ),
        );
        const typedUserRepair = readArray(packet.missing_requirements)
          .map(readRecord)
          .filter((requirement): requirement is Record<string, unknown> =>
            Boolean(requirement),
          )
          .some(
            (requirement) =>
              readString(requirement.repair_action).toLowerCase() ===
                "ask_user" &&
              Boolean(readString(requirement.code)) &&
              Boolean(readString(requirement.message)),
          );
        const exactTypedBoundary =
          result.ok !== true &&
          packet.turn_id === input.turnId &&
          ["blocked", "failed", "missing_input", "needs_confirmation"].includes(
            status,
          ) &&
          readString(result.tool_followup_decision?.next_action) ===
            "ask_user" &&
          readBoolean(
            result.tool_followup_decision?.external_change_required,
          ) === true &&
          readString(result.tool_lifecycle_trace?.retry_recommendation) ===
            "ask_user" &&
          typedUserRepair &&
          refs.length > 0 &&
          refs.every((ref) => normalizedRefs.has(ref));
        return exactTypedBoundary ? refs : [];
      }),
    ),
  );
};

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
  providerObservationReentryCompleted?: boolean;
  solverCompleted?: boolean;
  goalSatisfied?: boolean;
  modelOnlyDirectAnswerAllowed?: boolean;
  currentTurnEvidenceRequired?: boolean;
  selectedScholarlyResultIds?: string[];
  structuredNumericEvidenceRequired?: boolean;
  committedSubgoalContract?: Record<string, unknown> | null;
  providerTerminalIntent?: HelixProviderTerminalIntent;
  solverCompletionAudit?: Record<string, unknown> | null;
}) => {
  const gatewayObservationRefs = input.gatewayCallResults.flatMap(
    (result) => result.artifact_refs,
  );
  const gatewayObservationRefSet = new Set(gatewayObservationRefs);
  const gatewayObservationPackets = input.gatewayCallResults.map(
    (result) => result.observation_packet,
  );
  const capabilityLaneObservationPackets = (
    input.capabilityLaneObservationPackets ?? []
  ).filter((packet) => {
    const refs = packet.produced_artifact_refs.filter(Boolean);
    const alreadyProjectedByGateway = gatewayObservationPackets.some(
      (gatewayPacket) =>
        gatewayPacket.turn_id === packet.turn_id &&
        gatewayPacket.call_id === packet.call_id &&
        gatewayPacket.decision_id === packet.decision_id &&
        gatewayPacket.capability_key === packet.capability_key &&
        gatewayPacket.status === packet.status,
    );
    return (
      !alreadyProjectedByGateway &&
      (refs.length === 0 ||
        !refs.every((ref) => gatewayObservationRefSet.has(ref)))
    );
  });
  const priorEvidenceObservationPackets =
    input.priorEvidenceObservationPackets ?? [];
  const successfulCapabilityLaneObservationPackets =
    capabilityLaneObservationPackets.filter((packet) => {
      const status = packet.status.trim().toLowerCase();
      if (isTextToSpeechReceiptObservation(packet)) return true;
      return (
        status !== "blocked" &&
        status !== "failed" &&
        status !== "missing_input" &&
        status !== "needs_confirmation"
      );
    });
  const capabilityLaneObservationRefs =
    capabilityLaneObservationPackets.flatMap(
      (packet) => packet.produced_artifact_refs,
    );
  const priorEvidenceObservationRefs = priorEvidenceObservationPackets.flatMap(
    (packet) => packet.produced_artifact_refs,
  );
  const successfulCapabilityLaneObservationRefs =
    successfulCapabilityLaneObservationPackets.flatMap(
      (packet) => packet.produced_artifact_refs,
    );
  const observationRefs = [
    ...gatewayObservationRefs,
    ...capabilityLaneObservationRefs,
    ...priorEvidenceObservationRefs,
  ];
  const transportObservationRefs = Array.from(
    new Set(observationRefs.filter((ref) => ref.trim().length > 0)),
  );
  const requiredCommittedSubgoalsSatisfied = committedSubgoalsAreSatisfied(
    input.committedSubgoalContract,
  );
  const committedSubgoalsRequired = committedSubgoalContractApplies(
    input.committedSubgoalContract,
  );
  const committedSubgoalsCompatible =
    !committedSubgoalsRequired || requiredCommittedSubgoalsSatisfied;
  const successfulGatewayObservationRefs = input.gatewayCallResults
    .filter((result) =>
      isGatewayObservationCompatibleWithProviderReasoning(
        result,
        input.gatewayCallResults,
        {
          selectedScholarlyResultIds: input.selectedScholarlyResultIds,
          structuredNumericEvidenceRequired:
            input.structuredNumericEvidenceRequired,
          committedSubgoalsSatisfied: requiredCommittedSubgoalsSatisfied,
        },
      ),
    )
    .flatMap((result) => result.artifact_refs);
  const normalizedObservationPackets = input.normalizedObservationPackets ?? [
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
  const actionableBlockedCapabilityLaneObservationPackets =
    input.solverCompleted === true &&
    input.goalSatisfied === true &&
    requiredCommittedSubgoalsSatisfied
      ? capabilityLaneObservationPackets.filter((packet) =>
          isActionableBlockedCapabilityLaneObservation({
            packet,
            turnId: input.turnId,
            normalizedObservationPackets,
          }),
        )
      : [];
  const actionableBlockedCapabilityLaneObservationRefs =
    actionableBlockedCapabilityLaneObservationPackets.flatMap(
      (packet) => packet.produced_artifact_refs,
    );
  const reenteredCapabilityLaneObservationPackets = Array.from(
    new Set([
      ...successfulCapabilityLaneObservationPackets,
      ...actionableBlockedCapabilityLaneObservationPackets,
    ]),
  );
  const reenteredCapabilityLaneObservationRefs =
    reenteredCapabilityLaneObservationPackets.flatMap(
      (packet) => packet.produced_artifact_refs,
    );
  const selectedObservationRefs = [
    ...successfulGatewayObservationRefs,
    ...reenteredCapabilityLaneObservationRefs,
    ...priorEvidenceObservationRefs,
  ];
  const allGatewayCallsSucceeded =
    input.gatewayCallResults.length === 0 ||
    input.gatewayCallResults.every((result) =>
      isGatewayObservationCompatibleWithProviderReasoning(
        result,
        input.gatewayCallResults,
        {
          selectedScholarlyResultIds: input.selectedScholarlyResultIds,
          structuredNumericEvidenceRequired:
            input.structuredNumericEvidenceRequired,
          committedSubgoalsSatisfied: requiredCommittedSubgoalsSatisfied,
        },
      ),
    );
  const allCapabilityLaneObservationsSucceeded =
    capabilityLaneObservationPackets.length === 0 ||
    successfulCapabilityLaneObservationPackets.length ===
      capabilityLaneObservationPackets.length;
  const allCapabilityLaneObservationsReentryCompatible =
    capabilityLaneObservationPackets.length === 0 ||
    reenteredCapabilityLaneObservationPackets.length ===
      capabilityLaneObservationPackets.length;
  const evidenceSourceCount =
    input.gatewayCallResults.length +
    capabilityLaneObservationPackets.length +
    priorEvidenceObservationPackets.length;
  const allEvidenceSucceeded =
    allGatewayCallsSucceeded && allCapabilityLaneObservationsSucceeded;
  const allEvidenceReentryCompatible =
    allGatewayCallsSucceeded && allCapabilityLaneObservationsReentryCompatible;
  const evidenceReentryRequired = evidenceSourceCount > 0;
  const noEvidenceDirectAnswerReady =
    !evidenceReentryRequired &&
    input.modelOnlyDirectAnswerAllowed === true &&
    allEvidenceReentryCompatible;
  const normalizedObservationsReady =
    noEvidenceDirectAnswerReady ||
    (evidenceReentryRequired &&
      allEvidenceReentryCompatible &&
      normalizedObservationPackets.length >= evidenceSourceCount &&
      normalizedObservationPackets.length > 0);
  const candidateId =
    input.ok && input.providerText.trim()
      ? `${input.turnId}:agent_provider_terminal_candidate:${input.runtime}:${sha256(input.providerText).slice(0, 16)}`
      : null;
  const providerReasoningCompleted = Boolean(candidateId);
  // Transport re-entry and evidentiary success are different facts. A typed
  // blocked/failed observation can still be normalized and supplied to the
  // next Codex step, even though it cannot support a success claim or grant
  // terminal answer authority. Transport must not depend on whether that
  // later step produced a terminal candidate: Codex may instead request a
  // retry, choose another capability, or end without a candidate.
  const observationReentered = Boolean(
    (input.providerObservationReentryCompleted ?? input.ok) &&
    evidenceReentryRequired &&
    normalizedObservationPackets.length >= evidenceSourceCount &&
    transportObservationRefs.length > 0 &&
    transportObservationRefs.every((ref) =>
      normalizedObservationRefs.includes(ref),
    ),
  );
  const evidenceReentered = Boolean(
    noEvidenceDirectAnswerReady ||
    (evidenceReentryRequired &&
      normalizedObservationsReady &&
      providerReasoningCompleted),
  );
  const solverAuthoritySatisfied =
    providerReasoningCompleted &&
    input.solverCompleted === true &&
    input.goalSatisfied !== false &&
    committedSubgoalsCompatible;
  const currentTurnObservationPresent =
    input.gatewayCallResults.length > 0 ||
    capabilityLaneObservationPackets.length > 0;
  const currentTurnEvidenceSatisfied =
    input.currentTurnEvidenceRequired !== true || currentTurnObservationPresent;
  const pendingVoiceHandoffOverclaim = Boolean(
    candidateId &&
    capabilityLaneObservationPackets.some(
      isPendingTextToSpeechHandoffObservation,
    ) &&
    providerTextClaimsVoicePlaybackCompleted(input.providerText),
  );
  const residentSemanticReplanOverclaim = Boolean(
    candidateId &&
      providerTextContradictsResidentSemanticReplan({
        providerText: input.providerText,
        gatewayCallResults: input.gatewayCallResults,
      }),
  );
  const requestUserInputBoundaryObservationRefs =
    providerRequestUserInputBoundaryObservationRefs({
      turnId: input.turnId,
      gatewayCallResults: input.gatewayCallResults,
      normalizedObservationPackets,
    });
  const providerRequestUserInputReady = Boolean(
    input.providerTerminalIntent === "request_user_input" &&
    candidateId &&
    observationReentered &&
    currentTurnEvidenceSatisfied &&
    requestUserInputBoundaryObservationRefs.length > 0 &&
    !pendingVoiceHandoffOverclaim &&
    !residentSemanticReplanOverclaim,
  );
  const terminalAuthorityMayUseProviderText = Boolean(
    providerRequestUserInputReady ||
    (candidateId &&
      evidenceReentered &&
      solverAuthoritySatisfied &&
      currentTurnEvidenceSatisfied &&
      !pendingVoiceHandoffOverclaim &&
      !residentSemanticReplanOverclaim),
  );
  const terminalAuthorityStatus = terminalAuthorityMayUseProviderText
    ? providerRequestUserInputReady
      ? "authorized_by_provider_request_user_input_bridge"
      : noEvidenceDirectAnswerReady
        ? "authorized_by_model_only_direct_answer_contract"
        : "authorized_by_helix_provider_candidate_bridge"
    : candidateId && pendingVoiceHandoffOverclaim
      ? "blocked_by_voice_playback_overclaim"
      : candidateId && residentSemanticReplanOverclaim
        ? "blocked_by_resident_semantic_replan_overclaim"
      : candidateId && !currentTurnEvidenceSatisfied
        ? "blocked_by_current_turn_observation_required"
        : candidateId && !allEvidenceReentryCompatible
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
      : input.providerTerminalIntent === "request_user_input" &&
          requestUserInputBoundaryObservationRefs.length === 0
        ? ["typed_request_user_input_boundary_missing"]
        : pendingVoiceHandoffOverclaim
          ? ["voice_playback_completion_not_observed"]
          : residentSemanticReplanOverclaim
            ? ["provider_candidate_disagrees_with_resident_semantic_replan"]
          : !currentTurnEvidenceSatisfied
            ? ["current_turn_observation_required"]
            : !allGatewayCallsSucceeded
              ? ["gateway_observation_missing_or_failed"]
              : !allCapabilityLaneObservationsReentryCompatible
                ? ["capability_lane_observation_missing_or_failed"]
                : !normalizedObservationsReady
                  ? ["normalized_observation_packet_missing"]
                  : !committedSubgoalsCompatible
                    ? ["committed_subgoal_observation_missing"]
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
        terminal_intent: input.providerTerminalIntent ?? "answer",
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
      : candidateId && providerReasoningCompleted
        ? "completed_not_terminal"
        : candidateId
          ? "pending_helix_solver_reentry"
          : input.ok
            ? "empty_provider_answer"
            : "not_run",
    input_observation_refs: observationRefs,
    normalized_observation_refs: normalizedObservationRefs,
    normalized_observation_packet_count: normalizedObservationPackets.length,
    capability_lane_observation_packet_count:
      capabilityLaneObservationPackets.length,
    prior_evidence_observation_packet_count:
      priorEvidenceObservationPackets.length,
    evidence_reentry_required: evidenceReentryRequired,
    required_committed_subgoals_satisfied: requiredCommittedSubgoalsSatisfied,
    actionable_blocked_capability_lane_observation_refs:
      actionableBlockedCapabilityLaneObservationRefs,
    request_user_input_boundary_observation_refs:
      requestUserInputBoundaryObservationRefs,
    provider_terminal_intent: input.providerTerminalIntent ?? "answer",
    reentered_capability_lane_observation_refs:
      reenteredCapabilityLaneObservationRefs,
    model_only_direct_answer_allowed:
      input.modelOnlyDirectAnswerAllowed === true,
    current_turn_evidence_required: input.currentTurnEvidenceRequired === true,
    current_turn_observation_present: currentTurnObservationPresent,
    runtime_selected_scholarly_result_ids:
      input.selectedScholarlyResultIds ?? [],
    structured_numeric_evidence_required:
      input.structuredNumericEvidenceRequired === true,
    runtime_selected_usable_lookup_evidence:
      hasRuntimeSelectedUsableScholarlyLookupEvidence({
        gatewayCallResults: input.gatewayCallResults,
        selectedResultIds: input.selectedScholarlyResultIds,
      }),
    runtime_selected_usable_full_text_evidence:
      hasRuntimeSelectedUsableScholarlyFullTextEvidence({
        gatewayCallResults: input.gatewayCallResults,
        selectedResultIds: input.selectedScholarlyResultIds,
      }),
    provider_terminal_candidate_ref: candidateId,
    provider_terminal_candidate_present: Boolean(candidateId),
    post_tool_model_step_required: Boolean(
      candidateId && !providerReasoningCompleted,
    ),
    observation_reentered: observationReentered,
    reentered_observation_refs: observationReentered
      ? transportObservationRefs
      : [],
    evidence_reentered: evidenceReentered,
    solver_completed: input.solverCompleted === true,
    goal_satisfaction_compatible:
      input.goalSatisfied === true && committedSubgoalsCompatible,
    solver_completion_audit: input.solverCompletionAudit ?? null,
    committed_subgoals_required: committedSubgoalsRequired,
    committed_subgoals_compatible: committedSubgoalsCompatible,
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
    selected_observation_refs: Array.from(
      new Set([
        ...selectedObservationRefs,
        ...(providerRequestUserInputReady
          ? requestUserInputBoundaryObservationRefs
          : []),
      ]),
    ),
    normalized_observation_refs: normalizedObservationRefs,
    capability_lane_observation_refs: reenteredCapabilityLaneObservationRefs,
    actionable_blocked_capability_lane_observation_refs:
      actionableBlockedCapabilityLaneObservationRefs,
    request_user_input_boundary_observation_refs:
      requestUserInputBoundaryObservationRefs,
    provider_terminal_intent: input.providerTerminalIntent ?? "answer",
    prior_evidence_observation_refs: priorEvidenceObservationRefs,
    current_turn_evidence_required: input.currentTurnEvidenceRequired === true,
    current_turn_observation_present: currentTurnObservationPresent,
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
          terminal_kind: providerRequestUserInputReady
            ? "request_user_input"
            : "answer",
          authority_origin: providerRequestUserInputReady
            ? "request_user_input"
            : "selected_final_answer",
          server_authoritative: true,
          terminal_eligible: true,
          assistant_answer: false,
        })
      : null;
  const terminalPresentation = terminalAnswerAuthority
    ? {
        schema: "helix.terminal_presentation.v1",
        turn_id: input.turnId,
        concise_text: input.providerText,
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_authority_ref: candidateId,
        selected_observation_refs: Array.from(
          new Set([
            ...selectedObservationRefs,
            ...(providerRequestUserInputReady
              ? requestUserInputBoundaryObservationRefs
              : []),
          ]),
        ),
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
    successful_capability_lane_observation_refs:
      successfulCapabilityLaneObservationRefs,
    actionable_blocked_capability_lane_observation_refs:
      actionableBlockedCapabilityLaneObservationRefs,
    request_user_input_boundary_observation_refs:
      requestUserInputBoundaryObservationRefs,
    provider_terminal_intent: input.providerTerminalIntent ?? "answer",
    reentered_capability_lane_observation_refs:
      reenteredCapabilityLaneObservationRefs,
    prior_evidence_observation_refs: priorEvidenceObservationRefs,
    normalized_observation_refs: normalizedObservationRefs,
    normalized_observation_packet_count: normalizedObservationPackets.length,
    capability_lane_observation_packet_count:
      capabilityLaneObservationPackets.length,
    prior_evidence_observation_packet_count:
      priorEvidenceObservationPackets.length,
    all_gateway_calls_succeeded: allGatewayCallsSucceeded,
    all_capability_lane_observations_succeeded:
      allCapabilityLaneObservationsSucceeded,
    all_observations_succeeded: allEvidenceSucceeded,
    all_capability_lane_observations_reentry_compatible:
      allCapabilityLaneObservationsReentryCompatible,
    all_observations_reentry_compatible: allEvidenceReentryCompatible,
    required_committed_subgoals_satisfied: requiredCommittedSubgoalsSatisfied,
    committed_subgoals_required: committedSubgoalsRequired,
    committed_subgoals_compatible: committedSubgoalsCompatible,
    normalized_observations_ready: normalizedObservationsReady,
    evidence_reentry_required: evidenceReentryRequired,
    model_only_direct_answer_allowed:
      input.modelOnlyDirectAnswerAllowed === true,
    current_turn_evidence_required: input.currentTurnEvidenceRequired === true,
    current_turn_observation_present: currentTurnObservationPresent,
    solver_completed: input.solverCompleted === true,
    goal_satisfaction_compatible:
      input.goalSatisfied === true && committedSubgoalsCompatible,
    solver_completion_audit: input.solverCompletionAudit ?? null,
    route_authority_status: terminalAnswerAuthority
      ? providerRequestUserInputReady
        ? "provider_typed_user_input_boundary_satisfied"
        : "provider_gateway_read_observe_contract_satisfied"
      : "not_authorized",
    terminal_authority_status:
      terminalAuthorityCandidateReview.terminal_authority_status,
    terminal_authority_granted:
      terminalAuthorityCandidateReview.terminal_authority_granted,
    final_visible_answer_authorized:
      terminalAuthorityCandidateReview.final_visible_answer_authorized,
    final_answer_source: terminalAnswerAuthority
      ? "agent_provider_terminal_candidate"
      : null,
    terminal_artifact_kind: terminalAnswerAuthority
      ? "agent_provider_terminal_candidate"
      : null,
    terminal_presentation_policy: terminalAnswerAuthority
      ? "preserve_provider_text"
      : null,
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
    terminalAuthorityStatus:
      terminalAuthorityCandidateReview.terminal_authority_status,
  };
};
