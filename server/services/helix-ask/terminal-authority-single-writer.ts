import type {
  HelixTerminalAuthoritySingleWriterResult,
  HelixTerminalCandidate,
  TerminalAuthoritySingleWriterAuditRejectionReason,
} from "@shared/helix-terminal-authority";
import type { HelixWorkstationToolEvaluation } from "@shared/helix-workstation-tool-evaluation";
import type { HelixWorkstationToolPlan } from "@shared/helix-workstation-tool-plan";
import {
  HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
  type HelixCommittedAskRoute,
} from "@shared/helix-committed-ask-route";
import {
  applyTerminalAnswerEnvelope,
  resolveTerminalAnswerEnvelope,
} from "./terminal-answer-envelope";
import { committedRouteAllowsTerminalKind } from "./committed-ask-route";
import {
  findLatestFinalAnswerDraftCandidate,
  latestDirectAnswerSequence,
  materializeFinalAnswerDraftTerminal,
} from "./final-answer-draft-terminal-materializer";
import { attachHelixCapabilityItineraryExecutionState } from "./capability-itinerary-execution";
import {
  buildHelixLocalizedTypedFailureTextForPayload,
  isHelixGenericTypedFailureText,
} from "./language-contract";
import { liveSourceModelSynthesisMissingFailure } from "./live-source-terminal-failure-repair";
import { hashHelixTerminalText } from "./turn-terminal-authority";
import { evaluateCalculatorToolAnswerSupport, routeMetadataIndicatesCalculator } from "./calculator-tool-answer-support";
import { synthesizeWorkstationToolAnswer } from "./workstation-answer-synthesizer";
import { isWorkstationObservationTerminalKind } from "./tool-family-terminal-policy";
import { applyCompoundTerminalPolicy, readCompoundTerminalPolicy } from "./compound-terminal-policy";
import { resolveCompoundCapabilitySynthesisReadiness } from "./compound-capability-synthesis";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type SingleWriterInput = {
  turnId: string;
  threadId?: string | null;
  payload: Record<string, unknown>;
  artifactLedger?: ArtifactLike[] | null;
  legacyCandidates?: HelixTerminalCandidate[];
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const terminalKindForSelectedArtifact = (selectedArtifactKind: string | null): string => {
  if (selectedArtifactKind === "typed_failure") return "failure";
  if (selectedArtifactKind === "request_user_input") return "request_user_input";
  if (selectedArtifactKind === "workstation_tool_evaluation") return "tool_evaluation";
  if (selectedArtifactKind?.includes("receipt")) return "tool_receipt";
  return "answer";
};

const syncTerminalAnswerAuthorityFromSingleWriterResult = (
  payload: Record<string, unknown>,
  result: HelixTerminalAuthoritySingleWriterResult,
): void => {
  const selectedArtifactKind = readString(result.selected_terminal_artifact_kind);
  if (!selectedArtifactKind) return;

  const visibleText = readString(result.visible_text);
  const payloadFinalAnswerSource = readString(payload.final_answer_source);
  const finalAnswerSource =
    selectedArtifactKind === "tool_receipt" &&
    payloadFinalAnswerSource === "deterministic_receipt_fallback"
      ? "deterministic_receipt_fallback"
      : readString(result.source) ?? selectedArtifactKind;
  const selectedArtifactRef = readString(result.selected_terminal_artifact_ref);
  const terminalKind = terminalKindForSelectedArtifact(selectedArtifactKind);
  const authority = readRecord(payload.terminal_answer_authority);

  payload.terminal_answer_authority = {
    ...(authority ?? {}),
    schema: "helix.turn_terminal_authority.v1",
    turn_id: readString(result.turn_id) ?? readString(authority?.turn_id) ?? null,
    terminal_kind: terminalKind,
    final_answer_source: finalAnswerSource,
    terminal_artifact_kind: selectedArtifactKind,
    ...(selectedArtifactRef ? { terminal_artifact_ref: selectedArtifactRef } : {}),
    ...(visibleText
      ? {
        terminal_text_preview: visibleText.slice(0, 240),
        terminal_text_hash: hashHelixTerminalText(visibleText),
      }
      : {}),
    authority_origin:
      selectedArtifactKind === "typed_failure"
        ? "typed_failure"
        : finalAnswerSource === "final_answer_draft"
          ? "selected_final_answer"
          : finalAnswerSource,
    server_authoritative: terminalKind !== "tool_receipt",
    assistant_answer: false,
    raw_content_included: false,
    single_writer_synchronized: true,
  };
};

const artifactLedgerPayloadByKind = (
  artifacts: unknown,
  kind: string,
): Record<string, unknown> | null => {
  const artifact = readArray(artifacts)
    .map(readRecord)
    .find((entry) => readString(entry?.kind) === kind);
  return readRecord(artifact?.payload);
};

const payloadArtifactPayloadByKind = (
  payload: Record<string, unknown>,
  kind: string,
): Record<string, unknown> | null =>
  artifactLedgerPayloadByKind(payload.current_turn_artifact_ledger, kind);

const compoundTerminalSynthesisPolicyActive = (payload: Record<string, unknown>): boolean => {
  return readCompoundTerminalPolicy(payload).active;
};

const multiSubgoalCompoundTerminalSynthesisActive = (payload: Record<string, unknown>): boolean => {
  const itinerary =
    readRecord(payload.capability_itinerary) ??
    payloadArtifactPayloadByKind(payload, "capability_itinerary");
  const contract =
    readRecord(payload.compound_capability_contract) ??
    readRecord(itinerary?.compound_capability_contract) ??
    payloadArtifactPayloadByKind(payload, "compound_capability_contract");
  const executionState =
    readRecord(payload.capability_itinerary_execution_state) ??
    readRecord(itinerary?.execution_state) ??
    payloadArtifactPayloadByKind(payload, "capability_itinerary_execution_state");
  const terminalCriteria = readRecord(itinerary?.terminal_success_criteria);
  const subgoalCount = readArray(contract?.subgoals).length;
  const ledgerCount = readArray(executionState?.compound_subgoal_ledger).length;
  const requiredCapabilityCount = readArray(terminalCriteria?.required_capabilities).length;
  return (
    subgoalCount > 1 ||
    ledgerCount > 1 ||
    (
      requiredCapabilityCount > 1 &&
      terminalCriteria?.compound_terminal_policy === "synthesize_from_satisfied_subgoal_observations"
    )
  );
};

const isContextualToolReferenceSuppressed = (payload: Record<string, unknown>): boolean => {
  const capabilityPlan = readRecord(payload.capability_plan);
  const arbitration = readRecord(capabilityPlan?.capability_contract_arbitration);
  const admission = readRecord(payload.tool_call_admission_decision);
  return (
    readString(arbitration?.contract_state) === "suppressed_contextual_reference" ||
    capabilityPlan?.tool_admission_suppressed === true ||
    admission?.tool_admission_suppressed === true
  );
};

type TerminalBlockingToolRailFailure = {
  railStatus: string;
  railFailureCode: string;
  firstBrokenRail: string | null;
  repairTarget: string | null;
  selectedCapability: string | null;
  executedCapability: string | null;
};

const readTerminalBlockingToolRailFailure = (
  payload: Record<string, unknown>,
): TerminalBlockingToolRailFailure | null => {
  const audit = readRecord(payload.tool_turn_chain_audit);
  const triage = readRecord(payload.tool_rail_failure_triage);
  const railStatus = readString(triage?.rail_status) ?? readString(audit?.rail_status);
  if (railStatus !== "broken" && railStatus !== "fail_closed") return null;
  const railFailureCode =
    readString(triage?.rail_failure_code) ??
    readString(audit?.rail_failure_code) ??
    readString(payload.terminal_error_code);
  if (!railFailureCode) return null;
  return {
    railStatus,
    railFailureCode,
    firstBrokenRail: readString(triage?.first_broken_rail) ?? readString(audit?.first_broken_rail) ?? null,
    repairTarget: readString(triage?.repair_target) ?? readString(audit?.repair_target) ?? null,
    selectedCapability: readString(triage?.selected_capability) ?? readString(audit?.selected_capability) ?? null,
    executedCapability: readString(triage?.executed_capability) ?? readString(audit?.executed_capability) ?? null,
  };
};

type FirstIncompleteCompoundSubgoalRailFailure = {
  subgoalId: string | null;
  requestedCapability: string | null;
  selectedCapability: string | null;
  executedCapability: string | null;
  railFailureCode: string;
  firstBrokenRail: string | null;
  repairTarget: string | null;
};

const compoundSubgoalRailHasSatisfiedObservation = (entry: Record<string, unknown>): boolean => {
  const railStatus = readString(entry.rail_status);
  return (
    readString(entry.satisfaction) === "satisfied" &&
    Boolean(readString(entry.observation_ref)) &&
    (!railStatus || railStatus === "complete")
  );
};

const readCompoundSubgoalRailStatuses = (payload: Record<string, unknown>): Record<string, unknown>[] => {
  const debug = readRecord(payload.debug);
  const artifactQueryIndex = readRecord(payload.artifact_query_index);
  const debugArtifactQueryIndex = readRecord(debug?.artifact_query_index);
  const itinerary =
    readRecord(payload.capability_itinerary) ??
    payloadArtifactPayloadByKind(payload, "capability_itinerary");
  const executionState =
    readRecord(payload.capability_itinerary_execution_state) ??
    readRecord(itinerary?.execution_state) ??
    payloadArtifactPayloadByKind(payload, "capability_itinerary_execution_state");
  const candidates = [
    payload.compound_subgoal_rail_statuses,
    debug?.compound_subgoal_rail_statuses,
    artifactQueryIndex?.compound_subgoal_rail_statuses,
    debugArtifactQueryIndex?.compound_subgoal_rail_statuses,
    executionState?.compound_subgoal_ledger,
  ];
  for (const candidate of candidates) {
    const entries = readArray(candidate)
      .map(readRecord)
      .filter((entry): entry is Record<string, unknown> => Boolean(entry));
    if (entries.length > 0) return entries;
  }
  return [];
};

const defaultCompoundSubgoalRailFailureCode = (entry: Record<string, unknown>): string =>
  readString(entry.rail_failure_code) ??
  (readString(entry.executed_capability) ? "subgoal_observation_missing" : "compound_subgoal_dropped");

const defaultCompoundSubgoalFirstBrokenRail = (
  railFailureCode: string,
  entry: Record<string, unknown>,
): string | null => {
  const existing = readString(entry.first_broken_rail);
  if (existing) return existing;
  if (railFailureCode.startsWith("missing_required_arg:") || railFailureCode.startsWith("invalid_arg:")) {
    return "capability_execution";
  }
  if (railFailureCode === "subgoal_observation_missing") return "observation_artifact";
  if (railFailureCode === "compound_subgoal_dropped") return "capability_execution";
  return null;
};

const defaultCompoundSubgoalRepairTarget = (
  railFailureCode: string,
  entry: Record<string, unknown>,
): string | null => {
  const existing = readString(entry.repair_target);
  if (existing) return existing;
  if (railFailureCode.startsWith("missing_required_arg:") || railFailureCode.startsWith("invalid_arg:")) {
    return "subgoal_argument_extraction";
  }
  if (railFailureCode === "subgoal_observation_missing") return "observation_materializer";
  if (railFailureCode === "compound_subgoal_dropped") return "agent_step_selection";
  return null;
};

const readFirstIncompleteCompoundSubgoalRailFailure = (
  payload: Record<string, unknown>,
): FirstIncompleteCompoundSubgoalRailFailure | null => {
  const firstIncomplete = readCompoundSubgoalRailStatuses(payload).find((entry) =>
    !compoundSubgoalRailHasSatisfiedObservation(entry)
  );
  if (!firstIncomplete) return null;
  const railFailureCode = defaultCompoundSubgoalRailFailureCode(firstIncomplete);
  return {
    subgoalId: readString(firstIncomplete.subgoal_id),
    requestedCapability: readString(firstIncomplete.requested_capability) ?? readString(firstIncomplete.runtime_capability),
    selectedCapability: readString(firstIncomplete.selected_capability),
    executedCapability: readString(firstIncomplete.executed_capability),
    railFailureCode,
    firstBrokenRail: defaultCompoundSubgoalFirstBrokenRail(railFailureCode, firstIncomplete),
    repairTarget: defaultCompoundSubgoalRepairTarget(railFailureCode, firstIncomplete),
  };
};

const compoundSubgoalRailFailureTerminalText = (
  failure: FirstIncompleteCompoundSubgoalRailFailure,
): string => {
  const capability = failure.requestedCapability ?? failure.selectedCapability ?? failure.subgoalId ?? "a required subgoal";
  const missingArg = failure.railFailureCode.startsWith("missing_required_arg:")
    ? failure.railFailureCode.slice("missing_required_arg:".length)
    : null;
  const invalidArg = failure.railFailureCode.startsWith("invalid_arg:")
    ? failure.railFailureCode.slice("invalid_arg:".length)
    : null;
  if (missingArg) {
    return `I could not complete this compound turn because ${capability} is missing required argument ${missingArg}.`;
  }
  if (invalidArg) {
    return `I could not complete this compound turn because ${capability} has invalid argument ${invalidArg}.`;
  }
  if (failure.railFailureCode === "compound_subgoal_dropped") {
    return `I could not complete this compound turn because ${capability} was dropped before execution.`;
  }
  if (failure.railFailureCode === "subgoal_observation_missing") {
    return `I could not complete this compound turn because ${capability} did not produce a required observation.`;
  }
  return `I could not complete this compound turn because ${capability} did not satisfy its required rail. Cause: ${failure.railFailureCode}.`;
};

const writeCompoundSubgoalRailFailureDetails = (
  target: Record<string, unknown>,
  failure: FirstIncompleteCompoundSubgoalRailFailure | null,
): void => {
  if (!failure) return;
  target.compound_subgoal_terminal_failure = {
    schema: "helix.compound_subgoal_terminal_failure.v1",
    subgoal_id: failure.subgoalId,
    requested_capability: failure.requestedCapability,
    selected_capability: failure.selectedCapability,
    executed_capability: failure.executedCapability,
    rail_failure_code: failure.railFailureCode,
    first_broken_rail: failure.firstBrokenRail,
    repair_target: failure.repairTarget,
    assistant_answer: false,
    raw_content_included: false,
  };
  target.compound_rail_failure_code = failure.railFailureCode;
  target.compound_first_broken_rail = failure.firstBrokenRail;
  target.compound_repair_target = failure.repairTarget;
  target.first_incomplete_compound_subgoal_id = failure.subgoalId;
};

const toolRailFailureTerminalText = (
  payload: Record<string, unknown>,
  failure: TerminalBlockingToolRailFailure,
): string => {
  const typedFailure = readRecord(payload.typed_failure);
  const existingTypedFailureText =
    readString(typedFailure?.text) ??
    readString(typedFailure?.answer_text) ??
    readString(typedFailure?.message) ??
    readString(payload.terminal_failure_text);
  if (
    existingTypedFailureText &&
    (
      readString(payload.final_answer_source) === "typed_failure" ||
      readString(payload.terminal_artifact_kind) === "typed_failure"
    )
  ) {
    return existingTypedFailureText;
  }
  return `I could not produce a terminal answer because the requested tool rail did not complete. Cause: ${failure.railFailureCode}.`;
};

const workstationTerminalCanRepairToolRailFailure = (input: {
  payload: Record<string, unknown>;
  failure: TerminalBlockingToolRailFailure | null;
  terminal: { artifact: ArtifactLike; kind: "workstation_tool_evaluation"; text: string; ref: string | null } | null;
  workstationTerminalMaterialized: boolean;
}): boolean => {
  if (!input.failure || !input.terminal || !input.workstationTerminalMaterialized) return false;
  const requiredTerminal = readString(readRecord(input.payload.canonical_goal_frame)?.required_terminal_kind);
  if (requiredTerminal !== "workstation_tool_evaluation") return false;
  if (input.terminal.kind !== "workstation_tool_evaluation") return false;
  const repairableFailure =
    input.failure.railFailureCode === "terminal_not_materialized" ||
    input.failure.railFailureCode === "terminal_projection_mismatch" ||
    input.failure.railFailureCode === "debug_mirror_stale" ||
    input.failure.railFailureCode === "terminal_authority_missing";
  if (!repairableFailure) return false;
  return (
    input.failure.firstBrokenRail === "terminal_materialization" ||
    input.failure.firstBrokenRail === "terminal_authority" ||
    input.failure.firstBrokenRail === "visible_projection"
  );
};

const syncWorkstationTerminalMaterializationMirrors = (input: {
  payload: Record<string, unknown>;
  terminalArtifactRef: string | null;
}): void => {
  const draftSelection = readRecord(input.payload.final_answer_draft_selection);
  if (!draftSelection) return;
  const previousKind = readString(draftSelection.materialized_terminal_artifact_kind);
  const previousRef = readString(draftSelection.materialized_terminal_artifact_ref);
  const syncedDraftSelection = {
    ...draftSelection,
    materialized_terminal_artifact_kind: "workstation_tool_evaluation",
    materialized_terminal_artifact_ref: input.terminalArtifactRef,
    selected_terminal_artifact_kind: "workstation_tool_evaluation",
    selected_terminal_artifact_ref: input.terminalArtifactRef,
    superseded_materialized_terminal_artifact_kind:
      previousKind && previousKind !== "workstation_tool_evaluation"
        ? previousKind
        : readString(draftSelection.superseded_materialized_terminal_artifact_kind) ?? null,
    superseded_materialized_terminal_artifact_ref:
      previousRef && previousRef !== input.terminalArtifactRef
        ? previousRef
        : readString(draftSelection.superseded_materialized_terminal_artifact_ref) ?? null,
  };
  input.payload.final_answer_draft_selection = syncedDraftSelection;
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.final_answer_draft_selection = syncedDraftSelection;
  }
};

const typedFailureAuthorityApplies = (authority: Record<string, unknown> | null): boolean =>
  readString(authority?.terminal_artifact_kind) === "typed_failure" ||
  readString(authority?.final_answer_source) === "typed_failure" ||
  readString(authority?.terminal_kind) === "failure";

const failureLikeDirectAnswerText = (text: string): boolean =>
  /\b(?:could not|cannot|can't|unable to|failed|failure|typed failure|terminal boundary|blocked terminal|missing requirements?)\b/i.test(text);

const readDirectAnswerRepairText = (payload: Record<string, unknown>): string | null => {
  const draft = readRecord(payload.final_answer_draft);
  return (
    readString(payload.answer) ??
    readString(payload.text) ??
    readString(payload.selected_final_answer) ??
    readString(draft?.text) ??
    readString(draft?.answer_text)
  );
};

const simpleDirectAnswerContractRepairApplies = (payload: Record<string, unknown>): boolean => {
  if (payload.final_answer_contract_pass !== true) return false;
  if (payload.final_answer_contract_repair_applied !== true) return false;
  const text = readDirectAnswerRepairText(payload);
  if (!text || failureLikeDirectAnswerText(text)) return false;

  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const goalKind = readString(canonicalGoal?.goal_kind);
  const requiredTerminalKind = readString(canonicalGoal?.required_terminal_kind);
  const route = readString(payload.route);
  const routeReasonCode = readString(payload.route_reason_code);
  const dispatchPolicy = readString(payload.dispatch_policy);
  const finalAnswerContractFamily = readString(payload.final_answer_contract_family);

  return (
    finalAnswerContractFamily === "simple" ||
    dispatchPolicy === "direct_answer_only" ||
    route === "conversation:simple" ||
    routeReasonCode === "conversation:simple" ||
    (goalKind === "model_only_concept" && (!requiredTerminalKind || requiredTerminalKind === "direct_answer_text" || requiredTerminalKind === "unknown"))
  );
};

const applyDirectAnswerContractRepairPublicMirrors = (payload: Record<string, unknown>): boolean => {
  if (!simpleDirectAnswerContractRepairApplies(payload)) return false;
  const text = readDirectAnswerRepairText(payload);
  if (!text) return false;
  const authority = readRecord(payload.terminal_answer_authority);
  const presentation = readRecord(payload.terminal_presentation);
  const resolvedTurnSummary = readRecord(payload.resolved_turn_summary);

  payload.ok = true;
  payload.response_type = "final_answer";
  payload.final_status = "final_answer";
  payload.status = "final_answer";
  payload.final_answer_source = "final_answer_draft";
  payload.terminal_artifact_kind = "direct_answer_text";
  payload.selected_final_answer = text;
  payload.answer = text;
  payload.text = text;
  payload.assistant_answer = text;
  delete payload.terminal_error_code;
  delete payload.terminal_failure_text;
  delete payload.typed_failure;

  payload.terminal_answer_authority = {
    ...(authority ?? {}),
    terminal_kind: "answer",
    final_answer_source: "final_answer_draft",
    terminal_artifact_kind: "direct_answer_text",
    terminal_text_preview: text,
    terminal_text_hash: hashHelixTerminalText(text),
    server_authoritative: authority?.server_authoritative !== false,
  };

  if (resolvedTurnSummary) {
    payload.resolved_turn_summary = {
      ...resolvedTurnSummary,
      final_status: "final_answer",
      terminal_artifact_kind: "direct_answer_text",
      terminal_error_code: null,
      final_answer_source: "final_answer_draft",
    };
  }

  if (presentation) {
    payload.terminal_presentation = {
      ...presentation,
      terminal_artifact_kind: "direct_answer_text",
      concise_text: text,
      assistant_answer: text,
      raw_content_included: false,
    };
  }

  return true;
};

export function syncHelixTypedFailureAuthorityPublicMirrors(
  payload: Record<string, unknown>,
): boolean {
  const authority = readRecord(payload.terminal_answer_authority);
  if (typedFailureAuthorityApplies(authority) && applyDirectAnswerContractRepairPublicMirrors(payload)) {
    return true;
  }
  if (!typedFailureAuthorityApplies(authority)) return false;
  const compoundCoverageGate = readRecord(payload.compound_prompt_coverage_gate);
  const compoundCoverageFailedClosed = readString(compoundCoverageGate?.decision) === "FAIL_CLOSED";
  const compoundSubgoalRailFailure = compoundCoverageFailedClosed
    ? readFirstIncompleteCompoundSubgoalRailFailure(payload)
    : null;
  const typedFailure = readRecord(payload.typed_failure);
  const localizedFailureText = buildHelixLocalizedTypedFailureTextForPayload(payload);
  const candidateFailureText =
    readString(authority?.terminal_text_preview) ??
    readString(typedFailure?.text) ??
    readString(typedFailure?.answer_text) ??
    readString(payload.terminal_failure_text) ??
    readString(payload.selected_final_answer) ??
    localizedFailureText;
  const liveSourceFailureRepair = liveSourceModelSynthesisMissingFailure(payload, candidateFailureText);
  const compoundSubgoalRailFailureText = compoundSubgoalRailFailure
    ? compoundSubgoalRailFailureTerminalText(compoundSubgoalRailFailure)
    : null;
  const failureText = liveSourceFailureRepair?.text ??
    compoundSubgoalRailFailureText ??
    (localizedFailureText !== "I could not produce a terminal answer for this turn."
      ? localizedFailureText
      : isHelixGenericTypedFailureText(candidateFailureText)
      ? localizedFailureText
      : candidateFailureText);
  const existingErrorCode = readString(typedFailure?.error_code) ?? readString(payload.terminal_error_code);
  const fallbackErrorCode =
    compoundCoverageFailedClosed && (!existingErrorCode || existingErrorCode === "terminal_consistency_violation")
      ? "compound_prompt_coverage_incomplete"
      : existingErrorCode === "terminal_consistency_violation"
        ? "typed_failure"
        : existingErrorCode ?? "typed_failure";
  const errorCode =
    liveSourceFailureRepair?.code ??
    compoundSubgoalRailFailure?.railFailureCode ??
    fallbackErrorCode;

  payload.ok = false;
  payload.response_type = "final_failure";
  payload.final_status = "final_failure";
  payload.status = "final_failure";
  payload.final_answer_source = "typed_failure";
  payload.terminal_artifact_kind = "typed_failure";
  payload.terminal_error_code = errorCode;
  payload.terminal_failure_text = failureText;
  payload.selected_final_answer = failureText;
  payload.answer = failureText;
  payload.text = failureText;
  payload.assistant_answer = failureText;
  payload.typed_failure = {
    ...(typedFailure ?? {}),
    schema: "helix.typed_failure.v1",
    error_code: errorCode,
    message: liveSourceFailureRepair || compoundSubgoalRailFailure
      ? failureText
      : readString(typedFailure?.message) ?? failureText,
    text: failureText,
    answer_text: failureText,
    assistant_answer: false,
    raw_content_included: false,
  };
  writeCompoundSubgoalRailFailureDetails(
    readRecord(payload.typed_failure) ?? (payload.typed_failure as Record<string, unknown>),
    compoundSubgoalRailFailure,
  );
  payload.terminal_answer_authority = {
    ...(authority ?? {}),
    terminal_kind: "failure",
    final_answer_source: "typed_failure",
    terminal_artifact_kind: "typed_failure",
    terminal_text_preview: failureText,
    terminal_text_hash: hashHelixTerminalText(failureText),
    server_authoritative: authority?.server_authoritative !== false,
  };
  writeCompoundSubgoalRailFailureDetails(payload, compoundSubgoalRailFailure);

  const resolvedTurnSummary = readRecord(payload.resolved_turn_summary);
  if (resolvedTurnSummary) {
    payload.resolved_turn_summary = {
      ...resolvedTurnSummary,
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: errorCode,
      final_answer_source: "typed_failure",
    };
  }

  const presentation = readRecord(payload.terminal_presentation);
  if (presentation) {
    payload.terminal_presentation = {
      ...presentation,
      terminal_artifact_kind: "typed_failure",
      concise_text: failureText,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const artifacts = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  for (const artifact of artifacts) {
    const record = readRecord(artifact);
    if (!record || readString(record.kind) !== "typed_failure") continue;
    const artifactPayload = readRecord(record.payload);
    if (!artifactPayload) continue;
    if (readString(artifactPayload.error_code) !== "terminal_consistency_violation" && !compoundCoverageFailedClosed) continue;
    record.payload = {
      ...artifactPayload,
      error_code: errorCode,
      text: failureText,
      answer_text: failureText,
      terminal_consistency_repaired_by_authority_sync: true,
    };
  }

  const debug = readRecord(payload.debug);
  if (debug) {
    debug.ok = false;
    debug.response_type = "final_failure";
    debug.final_status = "final_failure";
    debug.status = "final_failure";
    debug.final_answer_source = "typed_failure";
    debug.terminal_artifact_kind = "typed_failure";
    debug.terminal_error_code = errorCode;
    debug.terminal_failure_text = failureText;
    debug.selected_final_answer = failureText;
    debug.answer = failureText;
    debug.text = failureText;
    debug.assistant_answer = failureText;
    debug.typed_failure = payload.typed_failure;
    debug.terminal_answer_authority = payload.terminal_answer_authority;
    if (payload.terminal_presentation) debug.terminal_presentation = payload.terminal_presentation;
    if (Array.isArray(payload.current_turn_artifact_ledger)) {
      debug.current_turn_artifact_ledger = payload.current_turn_artifact_ledger;
    }
  }
  return true;
}

const textHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const isStaleWorkspaceFailureText = (value: unknown): boolean =>
  /(?:workspace_step_failed|Failed to execute)/i.test(readString(value) ?? "");

const VISIBLE_ANSWER_FIELDS = [
  "payload.text",
  "payload.answer",
  "payload.assistant_answer",
  "payload.selected_final_answer",
  "terminal_presentation.concise_text",
] as const;

const TERMINAL_PROJECTION_MISMATCH_TEXT =
  "I could not produce a terminal answer because terminal authority and visible projection selected different artifacts.";

const syncDocsToolRailMirrorsFromTerminalAuthority = (input: {
  payload: Record<string, unknown>;
  turnId: string;
  terminalArtifactRef: string;
}): void => {
  const audit = readRecord(input.payload.tool_turn_chain_audit);
  if (
    !audit ||
    readString(audit.required_terminal_kind) !== "doc_evidence_synthesis_answer" ||
    readString(audit.visible_terminal_kind) !== "doc_evidence_synthesis_answer"
  ) {
    return;
  }
  if (
    readString(audit.rail_failure_code) &&
    readString(audit.rail_failure_code) !== "terminal_projection_mismatch"
  ) {
    return;
  }

  const syncedAudit = {
    ...audit,
    materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
    materialized_terminal_artifact_ref:
      readString(audit.materialized_terminal_artifact_ref) ?? input.terminalArtifactRef,
    terminal_authority_kind: "doc_evidence_synthesis_answer",
    visible_terminal_kind: "doc_evidence_synthesis_answer",
    rail_status: "complete",
    rail_failure_code: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const syncedTriage = {
    ...(readRecord(input.payload.tool_rail_failure_triage) ?? {}),
    schema: "helix.tool_rail_failure_triage.v1",
    turn_id: input.turnId,
    route_family: syncedAudit.route_family ?? null,
    capability_contract_guard_version: syncedAudit.capability_contract_guard_version ?? null,
    requested_capability: syncedAudit.requested_capability ?? null,
    requested_capability_family: syncedAudit.requested_capability_family ?? null,
    requested_capability_source: syncedAudit.requested_capability_source ?? null,
    requested_capability_confidence: syncedAudit.requested_capability_confidence ?? null,
    selected_capability: syncedAudit.selected_capability ?? null,
    executed_capability: syncedAudit.executed_capability ?? null,
    requested_selected_match: syncedAudit.requested_selected_match ?? null,
    selected_executed_match: syncedAudit.selected_executed_match ?? null,
    substitution_rule_applied: syncedAudit.substitution_rule_applied === true,
    substitution_rule_id: syncedAudit.substitution_rule_id ?? null,
    required_observation_kinds_for_requested_capability:
      readArray(syncedAudit.required_observation_kinds_for_requested_capability),
    observed_artifact_supports_requested_capability:
      typeof syncedAudit.observed_artifact_supports_requested_capability === "boolean"
        ? syncedAudit.observed_artifact_supports_requested_capability
        : null,
    did_tool_run: Boolean(readString(syncedAudit.executed_capability)),
    policy_rejection_ref: syncedAudit.policy_rejection_ref ?? null,
    policy_rejection_reason: syncedAudit.policy_rejection_reason ?? null,
    observation_artifact_kind: syncedAudit.observation_artifact_kind ?? null,
    observation_ref: syncedAudit.observation_ref ?? null,
    reentry_executed: syncedAudit.reentry_executed === true,
    required_terminal_kind: "doc_evidence_synthesis_answer",
    final_answer_draft_ref: syncedAudit.final_answer_draft_ref ?? null,
    support_refs_count: syncedAudit.support_refs_count ?? 0,
    materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
    terminal_authority_kind: "doc_evidence_synthesis_answer",
    visible_terminal_kind: "doc_evidence_synthesis_answer",
    first_broken_rail: null,
    failure_bucket: null,
    rail_status: "complete",
    rail_failure_code: null,
    repair_target: null,
    assistant_answer: false,
    raw_content_included: false,
  };

  input.payload.tool_turn_chain_audit = syncedAudit;
  input.payload.tool_rail_failure_triage = syncedTriage;
  const familyMatrix = readArray(input.payload.tool_turn_chain_family_matrix)
    .map((entry) => {
      const record = readRecord(entry);
      if (!record || record.observed !== true) return entry;
      return {
        ...record,
        materialized: true,
        materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
        terminal_authority_selected: true,
        visible_projection_matches: true,
        rail_status: "complete",
        rail_failure_code: null,
      };
    });
  if (familyMatrix.length > 0) {
    input.payload.tool_turn_chain_family_matrix = familyMatrix;
  }

  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.tool_turn_chain_audit = syncedAudit;
    debug.tool_rail_failure_triage = syncedTriage;
    if (familyMatrix.length > 0) {
      debug.tool_turn_chain_family_matrix = familyMatrix;
    }
  }
};

export const applyTerminalProjectionKindGuard = (
  payload: Record<string, unknown>,
  result: HelixTerminalAuthoritySingleWriterResult,
): HelixTerminalAuthoritySingleWriterResult => {
  const authorityKind = readString(result.selected_terminal_artifact_kind);
  const presentation = readRecord(payload.terminal_presentation);
  const visibleKind = readString(presentation?.terminal_artifact_kind) ?? readString(payload.terminal_artifact_kind);
  if (!authorityKind || !visibleKind || authorityKind === visibleKind) {
    return {
      ...result,
      integrity: {
        ...result.integrity,
        terminal_projection_kind_match: Boolean(authorityKind && visibleKind && authorityKind === visibleKind),
        terminal_projection_guard_applied: false,
        terminal_projection_guard_action: null,
        terminal_projection_failure_code: null,
      },
    };
  }

  payload.terminal_projection_guard = {
    schema: "helix.terminal_projection_guard.v1",
    turn_id: result.turn_id,
    terminal_authority_kind: authorityKind,
    visible_terminal_kind: visibleKind,
    action: authorityKind === "typed_failure" ? "fail_closed" : "project_authority_artifact",
    error_code: authorityKind === "typed_failure" ? "terminal_projection_mismatch" : null,
    assistant_answer: false,
    raw_content_included: false,
  };

  if (authorityKind !== "typed_failure") {
    const projectedTextHash = hashHelixTerminalText(result.visible_text);
    payload.terminal_artifact_kind = authorityKind;
    payload.final_answer_source = result.source;
    payload.selected_final_answer = result.visible_text;
    payload.answer = result.visible_text;
    payload.text = result.visible_text;
    payload.assistant_answer = result.visible_text;
    payload.terminal_presentation = {
      ...(presentation ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: result.turn_id,
      terminal_artifact_kind: authorityKind,
      concise_text: result.visible_text,
      assistant_answer: false,
      raw_content_included: false,
    };
    payload.terminal_answer_authority = {
      ...(readRecord(payload.terminal_answer_authority) ?? {}),
      schema: "helix.turn_terminal_authority.v1",
      turn_id: result.turn_id,
      terminal_kind: "answer",
      final_answer_source: result.source,
      terminal_artifact_kind: authorityKind,
      terminal_text_preview: result.visible_text.slice(0, 240),
      terminal_text_hash: projectedTextHash,
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const summary = readRecord(payload.resolved_turn_summary);
    payload.resolved_turn_summary = {
      ...(summary ?? {}),
      turn_id: result.turn_id,
      final_status: "final_answer",
      response_type: "final_answer",
      final_answer_source: result.source,
      terminal_kind: "final_answer",
      terminal_artifact_kind: authorityKind,
      terminal_error_code: null,
      pending_server_request_present: false,
    };
    const debug = readRecord(payload.debug);
    if (debug) {
      debug.ok = true;
      debug.status = "final_answer";
      debug.final_status = "final_answer";
      debug.response_type = "final_answer";
      debug.terminal_artifact_kind = authorityKind;
      debug.final_answer_source = result.source;
      debug.selected_final_answer = result.visible_text;
      debug.answer = result.visible_text;
      debug.text = result.visible_text;
      debug.assistant_answer = result.visible_text;
      debug.terminal_presentation = payload.terminal_presentation;
      debug.terminal_answer_authority = payload.terminal_answer_authority;
      debug.resolved_turn_summary = payload.resolved_turn_summary;
      delete debug.terminal_error_code;
      delete debug.terminal_failure_text;
      delete debug.typed_failure;
    }
    return {
      ...result,
      writes: {
        ...result.writes,
        payload_text: result.visible_text,
        payload_answer: result.visible_text,
        payload_assistant_answer: result.visible_text,
        payload_selected_final_answer: result.visible_text,
        terminal_presentation_concise_text: result.visible_text,
        debug_selected_final_answer: result.visible_text,
      },
      integrity: {
        ...result.integrity,
        terminal_projection_kind_match: true,
        terminal_projection_guard_applied: true,
        terminal_projection_guard_action: "project_authority_artifact",
        terminal_projection_failure_code: null,
      },
    };
  }

  const railFailure = readTerminalBlockingToolRailFailure(payload);
  const typedFailure = readRecord(payload.typed_failure);
  const compoundSupportCoverage = readRecord(payload.compound_subgoal_draft_support_coverage);
  const compoundSupportFailureCode =
    compoundSupportCoverage?.ok === false ? "compound_subgoal_support_refs_missing" : null;
  const failureCodeCandidates = [
    readString(payload.terminal_error_code) ??
      null,
    readString(typedFailure?.error_code) ?? null,
    compoundSupportFailureCode,
    railFailure?.railFailureCode ?? null,
  ];
  const specificFailureCode =
    failureCodeCandidates.find((code) => code && code !== "terminal_projection_mismatch") ??
    failureCodeCandidates.find((code) => Boolean(code));
  const failureCode =
    specificFailureCode && specificFailureCode !== "terminal_projection_mismatch"
      ? specificFailureCode
      : "terminal_projection_mismatch";
  const typedFailureText =
    readString(payload.terminal_failure_text) ??
    readString(typedFailure?.answer_text) ??
    readString(typedFailure?.text) ??
    readString(typedFailure?.message) ??
    readString(result.visible_text);
  const typedFailureTextIsGenericProjectionMismatch =
    typedFailureText === TERMINAL_PROJECTION_MISMATCH_TEXT ||
    /terminal authority and visible projection selected different artifacts/i.test(typedFailureText ?? "");
  const resultVisibleText = readString(result.visible_text);
  const resultVisibleTextIsGenericProjectionMismatch =
    resultVisibleText === TERMINAL_PROJECTION_MISMATCH_TEXT ||
    /terminal authority and visible projection selected different artifacts/i.test(resultVisibleText ?? "");
  const nonGenericExistingFailureText =
    typedFailureText && !typedFailureTextIsGenericProjectionMismatch
      ? typedFailureText
      : resultVisibleText && !resultVisibleTextIsGenericProjectionMismatch
        ? resultVisibleText
        : null;
  const compoundSupportFailureText =
    failureCode === "compound_subgoal_support_refs_missing"
      ? (() => {
          const missingRefs = readArray(compoundSupportCoverage?.missing_observation_refs)
            .map(readString)
            .filter((entry): entry is string => Boolean(entry));
          return missingRefs.length > 0
            ? `I could not complete this compound turn because the final draft was not grounded in every satisfied subgoal observation. Missing support refs: ${missingRefs.join(", ")}.`
            : "I could not complete this compound turn because the final draft was not grounded in every satisfied subgoal observation.";
        })()
      : null;
  const failureText =
    failureCode === "terminal_projection_mismatch"
      ? TERMINAL_PROJECTION_MISMATCH_TEXT
      : compoundSupportFailureText ??
        nonGenericExistingFailureText ??
        `I could not produce a terminal answer because the requested tool rail did not complete. Cause: ${failureCode}.`;

  payload.ok = false;
  payload.response_type = "final_failure";
  payload.final_status = "final_failure";
  payload.status = "final_failure";
  payload.final_answer_source = "typed_failure";
  payload.terminal_artifact_kind = "typed_failure";
  payload.terminal_error_code = failureCode;
  payload.terminal_failure_text = failureText;
  payload.selected_final_answer = failureText;
  payload.answer = failureText;
  payload.text = failureText;
  payload.assistant_answer = failureText;
  payload.typed_failure = {
    ...(typedFailure ?? {}),
    schema: "helix.typed_failure.v1",
    error_code: failureCode,
    message: failureText,
    text: failureText,
    answer_text: failureText,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.terminal_presentation = {
    ...(presentation ?? {}),
    schema: "helix.terminal_presentation.v1",
    turn_id: result.turn_id,
    terminal_artifact_kind: "typed_failure",
    concise_text: failureText,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.terminal_answer_authority = {
    ...(readRecord(payload.terminal_answer_authority) ?? {}),
    schema: "helix.turn_terminal_authority.v1",
    turn_id: result.turn_id,
    terminal_kind: "failure",
    final_answer_source: "typed_failure",
    terminal_artifact_kind: "typed_failure",
    terminal_text_preview: failureText,
    terminal_text_hash: hashHelixTerminalText(failureText),
    server_authoritative: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const summary = readRecord(payload.resolved_turn_summary);
  if (summary) {
    payload.resolved_turn_summary = {
      ...summary,
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: failureCode,
      final_answer_source: "typed_failure",
    };
  }
  return {
    ...result,
    selectedArtifactKind: "typed_failure",
    selectedArtifactRef: `typed_failure:${textHash(`${result.turn_id}:${failureText}`)}`,
    selected_terminal_artifact_kind: "typed_failure",
    selected_terminal_artifact_ref: `typed_failure:${textHash(`${result.turn_id}:${failureText}`)}`,
    visible_text: failureText,
    source: "typed_failure",
    writes: {
      payload_text: failureText,
      payload_answer: failureText,
      payload_assistant_answer: failureText,
      payload_selected_final_answer: failureText,
      terminal_presentation_concise_text: failureText,
      debug_selected_final_answer: failureText,
    },
    integrity: {
      ...result.integrity,
      terminal_projection_kind_match: false,
      terminal_projection_guard_applied: true,
      terminal_projection_guard_action: "fail_closed",
      terminal_projection_failure_code: "terminal_projection_mismatch",
    },
  };
};

export function syncDocEvidenceSynthesisSingleWriterFromTerminalAuthority(input: {
  payload: Record<string, unknown>;
  turnId: string;
  threadId?: string | null;
}): HelixTerminalAuthoritySingleWriterResult | null {
  const authority = readRecord(input.payload.terminal_answer_authority);
  if (readString(authority?.terminal_artifact_kind) !== "doc_evidence_synthesis_answer") return null;
  const docTerminal = existingDocEvidenceSynthesisTerminal(input.payload);
  if (!docTerminal) return null;

  const terminalText = readString(authority?.terminal_text_preview) ?? docTerminal.text;
  const selectedArtifactRef =
    docTerminal.ref ??
    readString(authority?.terminal_item_id) ??
    `doc_evidence_synthesis_answer:${textHash(`${input.turnId}:${terminalText}`)}`;
  const source =
    readString(authority?.final_answer_source) === "final_answer_draft"
      ? "final_answer_draft"
      : "doc_evidence_synthesis_answer";

  const previousWriter = readRecord(input.payload.terminal_authority_single_writer);
  const previousWriterKind = readString(previousWriter?.selected_terminal_artifact_kind);
  const rejectedCandidates: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"] =
    previousWriterKind && previousWriterKind !== "doc_evidence_synthesis_answer"
      ? [{
          ref: readString(previousWriter?.selected_terminal_artifact_ref) ?? undefined,
          kind: previousWriterKind,
          source: previousWriterKind === "typed_failure" ? "typed_failure" : "legacy_fallback",
          reason: previousWriterKind === "typed_failure"
            ? "stale_solver_continuation_superseded_by_docs_terminal"
            : "lower_priority_than_selected_artifact",
        }]
      : [];
  const auditRejectedCandidates = rejectedCandidates.map((candidate) => ({
    artifactKind: candidate.kind,
    artifactRef: candidate.ref,
    reason: normalizeSingleWriterAuditRejectionReason(candidate.reason),
  }));
  const wroteVisibleFields = [...VISIBLE_ANSWER_FIELDS];
  const terminalAuthoritySingleWriterAudit = {
    artifactId: "terminal_authority_single_writer" as const,
    schemaVersion: "helix.terminal_authority_single_writer.v1" as const,
    selectedArtifactKind: "doc_evidence_synthesis_answer",
    selectedArtifactRef: selectedArtifactRef,
    rejectedCandidates: auditRejectedCandidates,
    wroteVisibleFields,
    forbiddenPreAuthorityVisibleFields: [],
  };

  input.payload.ok = true;
  input.payload.response_type = "final_answer";
  input.payload.final_status = "final_answer";
  input.payload.status = "final_answer";
  input.payload.terminal_artifact_kind = "doc_evidence_synthesis_answer";
  input.payload.final_answer_source = source;
  input.payload.terminal_artifact_id = selectedArtifactRef;
  input.payload.selected_final_answer = terminalText;
  input.payload.answer = terminalText;
  input.payload.text = terminalText;
  input.payload.assistant_answer = terminalText;
  delete input.payload.terminal_error_code;
  delete input.payload.terminal_failure_text;

  input.payload.terminal_answer_authority = {
    ...(authority ?? {}),
    schema: "helix.turn_terminal_authority.v1",
    thread_id: readString(authority?.thread_id) ?? input.threadId ?? null,
    turn_id: readString(authority?.turn_id) ?? input.turnId,
    terminal_kind: "answer",
    final_answer_source: source,
    terminal_artifact_kind: "doc_evidence_synthesis_answer",
    terminal_text_preview: terminalText,
    terminal_text_hash: hashHelixTerminalText(terminalText),
    server_authoritative: true,
    terminal_eligible: true,
    assistant_answer: false,
  };
  input.payload.terminal_presentation = {
    ...(readRecord(input.payload.terminal_presentation) ?? {}),
    schema: "helix.terminal_presentation.v1",
    turn_id: input.turnId,
    terminal_artifact_kind: "doc_evidence_synthesis_answer",
    concise_text: terminalText,
    assistant_answer: false,
    raw_content_included: false,
  };

  const result: HelixTerminalAuthoritySingleWriterResult = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    artifactId: "terminal_authority_single_writer",
    schemaVersion: "helix.terminal_authority_single_writer.v1",
    turn_id: input.turnId,
    selectedArtifactKind: "doc_evidence_synthesis_answer",
    selectedArtifactRef: selectedArtifactRef,
    selected_terminal_artifact_ref: selectedArtifactRef,
    selected_terminal_artifact_kind: "doc_evidence_synthesis_answer",
    visible_text: terminalText,
    assistant_answer: false,
    source,
    rejected_candidates: rejectedCandidates,
    writes: {
      payload_text: terminalText,
      payload_answer: terminalText,
      payload_assistant_answer: terminalText,
      payload_selected_final_answer: terminalText,
      terminal_presentation_concise_text: terminalText,
      debug_selected_final_answer: terminalText,
    },
    wroteVisibleFields,
    forbiddenPreAuthorityVisibleFields: [],
    audit: terminalAuthoritySingleWriterAudit,
    integrity: {
      single_writer_applied: true,
      terminal_authority_single_writer_audit: terminalAuthoritySingleWriterAudit,
      forbidden_pre_authority_visible_fields: [],
      visible_matches_selected_artifact: true,
      visible_matches_draft: true,
      stale_failure_visible: false,
      receipt_visible_as_answer: false,
      post_tool_model_step_satisfied: true,
      legacy_terminal_candidate_count: 0,
      forbidden_terminal_candidate_count: 0,
      payload_mirror_written_after_terminal_selection: true,
      materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      materialized_terminal_artifact_ref: selectedArtifactRef,
      materialization_blocked_reason: null,
      terminal_projection_kind_match: true,
      terminal_projection_guard_applied: false,
      terminal_projection_guard_action: null,
      terminal_projection_failure_code: null,
    },
  };

  input.payload.terminal_authority_single_writer = result;
  input.payload.terminal_candidate_rejections = auditRejectedCandidates;
  syncDocsToolRailMirrorsFromTerminalAuthority({
    payload: input.payload,
    turnId: input.turnId,
    terminalArtifactRef: selectedArtifactRef,
  });
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.ok = true;
    debug.response_type = "final_answer";
    debug.final_status = "final_answer";
    debug.status = "final_answer";
    debug.final_answer_source = source;
    debug.terminal_artifact_kind = "doc_evidence_synthesis_answer";
    debug.selected_final_answer = terminalText;
    debug.answer = terminalText;
    debug.text = terminalText;
    debug.assistant_answer = terminalText;
    debug.terminal_answer_authority = input.payload.terminal_answer_authority;
    debug.terminal_presentation = input.payload.terminal_presentation;
    debug.terminal_authority_single_writer = result;
    debug.terminal_candidate_rejections = auditRejectedCandidates;
  }

  return result;
}

const isStaleModelOnlyNoObservationText = (value: unknown): boolean =>
  /\b(?:no\s+(?:accepted\s+)?observations?|no\s+(?:live[-\s]?source\s+)?context|no\s+context\s+(?:is\s+)?available|unable\s+to\s+provide\s+(?:the\s+)?context|unable\s+to\s+provide\s+(?:an\s+)?answer\s+from\s+(?:observations|context)|could\s+not\s+provide\s+(?:the\s+)?context|can't\s+provide\s+(?:the\s+)?context|cannot\s+provide\s+(?:the\s+)?context|without\s+(?:any\s+)?observations?|no\s+receipts?\s+(?:exist|available|were\s+found))\b/i.test(
    readString(value) ?? "",
  );

const isStagePlayPostObservationSynthesisText = (value: unknown): boolean =>
  /^(?:Stage Play\b|Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b|Stage Play checkpoint request (?:queued|running|completed):)/i.test(
    readString(value) ?? "",
  );

const routeContractAllowedTerminalKinds = (payload: Record<string, unknown>): string[] =>
  applyCompoundTerminalPolicy(payload, {
    allowed: readArray(
      readRecord(payload.committed_ask_route)?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA
        ? readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.allowed_terminal_artifact_kinds
        : readRecord(payload.route_product_contract)?.allowed_terminal_artifact_kinds,
    )
      .map(readString)
      .filter((entry): entry is string => Boolean(entry)),
    forbidden: readArray(
      readRecord(payload.committed_ask_route)?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA
        ? readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.forbidden_terminal_artifact_kinds
        : readRecord(payload.route_product_contract)?.forbidden_terminal_artifact_kinds,
    )
      .map(readString)
      .filter((entry): entry is string => Boolean(entry)),
    requiredTerminalKind:
      readString(readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.required_terminal_kind) ??
      readString(readRecord(payload.route_product_contract)?.required_terminal_kind),
  }).allowed;

const routeProductContractAllowedTerminalKinds = (payload: Record<string, unknown>): string[] =>
  readArray(readRecord(payload.route_product_contract)?.allowed_terminal_artifact_kinds)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));

const committedRouteForbiddenTerminalKinds = (payload: Record<string, unknown>): string[] =>
  applyCompoundTerminalPolicy(payload, {
    allowed: readArray(readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.allowed_terminal_artifact_kinds)
      .map(readString)
      .filter((entry): entry is string => Boolean(entry)),
    forbidden: readArray(readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.forbidden_terminal_artifact_kinds)
      .map(readString)
      .filter((entry): entry is string => Boolean(entry)),
    requiredTerminalKind: readString(readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.required_terminal_kind),
  }).forbidden;

const existingDocEvidenceSynthesisTerminal = (
  payload: Record<string, unknown>,
): { ref: string | null; text: string } | null => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  if (
    readString(canonicalGoal?.goal_kind) !== "doc_evidence_synthesis" ||
    readString(canonicalGoal?.required_terminal_kind) !== "doc_evidence_synthesis_answer"
  ) {
    return null;
  }
  if (committedRouteForbiddenTerminalKinds(payload).includes("doc_evidence_synthesis_answer")) {
    return null;
  }
  const routeAllowed = routeProductContractAllowedTerminalKinds(payload);
  if (
    routeAllowed.length > 0 &&
    !routeAllowed.includes("doc_evidence_synthesis_answer") &&
    !routeAllowed.includes("doc_evidence_synthesis")
  ) {
    return null;
  }
  const answer = readRecord(payload.doc_evidence_synthesis_answer);
  if (readString(answer?.terminal_artifact_kind) !== "doc_evidence_synthesis_answer") return null;
  const text = readString(answer?.answer_text) ?? readString(answer?.text);
  if (!text) return null;
  const supportRefs = readArray(answer?.support_refs)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  if (supportRefs.length === 0) return null;
  return {
    ref: readString(answer?.artifact_id),
    text,
  };
};

const routeContractAllowsTerminalKind = (
  payload: Record<string, unknown>,
  kind: string,
): boolean => {
  const compoundPolicy = applyCompoundTerminalPolicy(payload, {
    allowed: routeContractAllowedTerminalKinds(payload),
    forbidden: committedRouteForbiddenTerminalKinds(payload),
    requiredTerminalKind: readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind),
  });
  if (compoundPolicy.policy.active) {
    if (compoundPolicy.forbidden.includes(kind)) return false;
    return compoundPolicy.allowed.length === 0 ||
      compoundPolicy.allowed.includes(kind) ||
      (kind === "doc_evidence_synthesis_answer" && compoundPolicy.allowed.includes("doc_evidence_synthesis"));
  }
  const committedRoute = readRecord(payload.committed_ask_route);
  if (committedRoute?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA) {
    return committedRouteAllowsTerminalKind({
      committedRoute: committedRoute as unknown as HelixCommittedAskRoute,
      terminalArtifactKind: kind,
      finalAnswerSource: kind === "model_synthesized_answer" ? "final_answer_draft" : null,
    });
  }
  const allowed = routeContractAllowedTerminalKinds(payload);
  return allowed.length === 0 || allowed.includes(kind);
};

const routeContractRequiresScholarlyResearchAnswer = (payload: Record<string, unknown>): boolean =>
  readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) === "scholarly_research_answer" ||
  routeContractAllowedTerminalKinds(payload).includes("scholarly_research_answer");

const routeContractRequiresInternetSearchAnswer = (payload: Record<string, unknown>): boolean =>
  readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) === "internet_search_answer" ||
  routeContractAllowedTerminalKinds(payload).includes("internet_search_answer");

const goalContractAllowsWorkstationToolEvaluation = (payload: Record<string, unknown>): boolean => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  const terminalContract = readRecord(goalSatisfaction?.terminal_contract);
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const requiredKinds = [
    readString(canonicalGoal?.required_terminal_kind),
    readString(goalSatisfaction?.required_terminal_kind),
    readString(goalSatisfaction?.terminal_artifact_kind),
    ...readArray(terminalContract?.required_terminal_kinds).map(readString),
    ...readArray(sourceTargetIntent?.requested_outputs).map(readString),
  ].filter((entry): entry is string => Boolean(entry));
  if (requiredKinds.includes("workstation_tool_evaluation")) return true;
  return readArray(goalSatisfaction?.observed_results)
    .map(readRecord)
    .some((entry) =>
      Boolean(
        entry &&
          readString(entry.kind) === "workstation_tool_evaluation" &&
          entry.supports_goal === true,
      ));
};

const artifactPayload = (artifact: ArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const artifactSchema = (artifact: ArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.schema);

const artifactKind = (artifact: ArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "unknown";

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ??
  readString((artifact as Record<string, unknown>).artifact_ref) ??
  readString(artifactPayload(artifact)?.artifact_id);

const artifactText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return (
    readString(payload?.answer_text) ??
    readString(payload?.text) ??
    readString(payload?.summary) ??
    readString(payload?.result_summary) ??
    readString(payload?.result_text) ??
    readString(payload?.visible_text) ??
    readString(artifactPayload(artifact)?.message)
  );
};

const observationArtifactForRef = (
  artifacts: ArtifactLike[],
  ref: string | null | undefined,
): ArtifactLike | null => {
  if (!ref) return null;
  return artifacts.find((artifact) => artifactId(artifact) === ref) ?? null;
};

const firstObservationText = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const summarizeCompoundObservation = (
  artifact: ArtifactLike | null,
  fallbackRef: string,
): string => {
  if (!artifact) return `Observation ${fallbackRef} is present.`;
  const payload = artifactPayload(artifact);
  const kind = artifactKind(artifact);
  if (/calculator_receipt|calculator_result|workstation_tool_evaluation/i.test(kind)) {
    const result = readRecord(payload?.result);
    const expression = firstObservationText(
      payload?.expression,
      payload?.input,
      payload?.expr,
      readRecord(payload?.args)?.expression,
    );
    const value = firstObservationText(
      payload?.result,
      payload?.value,
      payload?.result_value,
      payload?.result_text,
      result?.value,
      result?.result,
      result?.text,
    );
    if (expression && value) {
      return `Calculator observation: expression ${expression} evaluated to ${value}.`;
    }
    if (value) return `Calculator observation: result ${value}.`;
    return `Calculator observation from ${firstObservationText(payload?.capability_key, payload?.tool_name) ?? kind}.`;
  }
  if (/doc_location_matches|doc_evidence_location|docs_viewer/i.test(kind)) {
    const firstMatch = readArray(payload?.matches).map(readRecord).find(Boolean);
    const path = firstObservationText(
      firstMatch?.path,
      firstMatch?.doc_path,
      firstMatch?.file_path,
      payload?.path,
      payload?.doc_path,
      payload?.file_path,
    );
    const line = firstObservationText(
      firstMatch?.line,
      firstMatch?.line_number,
      firstMatch?.line_start,
      firstMatch?.start_line,
      payload?.line,
      payload?.line_number,
      payload?.line_start,
      payload?.start_line,
    );
    const snippet = firstObservationText(
      firstMatch?.snippet,
      firstMatch?.text,
      firstMatch?.summary,
      payload?.snippet,
      payload?.text,
      payload?.summary,
    );
    const location = [path, line ? `line ${line}` : null].filter(Boolean).join(" ");
    return [
      `Document evidence${location ? ` located at ${location}` : ""}.`,
      snippet ? `Relevant excerpt: ${snippet}` : null,
    ].filter(Boolean).join(" ");
  }
  if (/capability_registry|workspace_os_status|workspace_status/i.test(kind)) {
    const count = firstObservationText(payload?.capability_count, payload?.record_count, payload?.total);
    const text = artifactText(artifact);
    return count
      ? `${kind} observation contains ${count} records.`
      : `${kind} observation${text ? `: ${text}` : " is present."}`;
  }
  const text = artifactText(artifact);
  return `${kind} observation${text ? `: ${text}` : ` ${fallbackRef} is present.`}`;
};

const ensureLedgerBackedCompoundFinalAnswerDraft = (input: {
  turnId: string;
  payload: Record<string, unknown>;
  artifacts: ArtifactLike[];
  readiness: Record<string, unknown> | null;
}): { artifact: ArtifactLike; ref: string; text: string } | null => {
  if (!input.readiness?.applies || input.readiness.complete !== true) return null;
  if (input.readiness.has_materialized_terminal_artifact === true) return null;
  if (findLatestFinalAnswerDraftCandidate(input.artifacts)) return null;
  const railRows = readCompoundSubgoalRailStatuses(input.payload)
    .filter(compoundSubgoalRailHasSatisfiedObservation);
  if (railRows.length < 2) return null;
  const observationRefs = uniqueStrings(
    railRows.map((entry) => readString(entry.observation_ref)),
  );
  if (observationRefs.length < 2) return null;
  const supportRefs = uniqueStrings([
    ...readArray(input.readiness.support_refs).map(readString),
    ...observationRefs,
  ]);
  const sourceFamilies = uniqueStrings(
    railRows.map((entry) =>
      readString(entry.capability_family) ??
      readString(entry.plan_family) ??
      readString(entry.route_family)
    ),
  );
  const summaries = railRows.map((entry, index) => {
    const observationRef = readString(entry.observation_ref);
    const capability =
      readString(entry.requested_capability) ??
      readString(entry.executed_capability) ??
      readString(entry.selected_capability) ??
      `subgoal ${index + 1}`;
    const summary = summarizeCompoundObservation(
      observationArtifactForRef(input.artifacts, observationRef),
      observationRef ?? capability,
    );
    return `${index + 1}. ${capability}: ${summary}`;
  });
  const hasDoc = summaries.some((summary) => /doc(?:s|-viewer)?|document evidence|citation|located/i.test(summary));
  const hasCalculator = summaries.some((summary) => /calculator|calculation|expression|evaluated|result/i.test(summary));
  const connection = hasDoc && hasCalculator
    ? "Connection: the document evidence supplies the policy or claim context, and the calculator observation supplies the numeric result used to check or illustrate that context."
    : "Connection: the final answer is synthesized only from the satisfied subgoal observations listed above.";
  const text = [
    "The compound tool turn completed all mandatory subgoals.",
    ...summaries,
    connection,
  ].join("\n");
  const targetKind =
    readString(input.readiness.synthesis_terminal_kind) ??
    readString(input.readiness.required_terminal_kind) ??
    "compound_evidence_synthesis_answer";
  const draftRef = `${input.turnId}:final_answer_draft:ledger_backed_compound_synthesis`;
  const draftPayload = {
    schema: "helix.final_answer_draft.v1",
    artifact_id: draftRef,
    turn_id: input.turnId,
    text,
    answer_text: text,
    authority: "ledger_backed_compound_synthesis",
    model_step_capability: "model.synthesize_from_compound_subgoal_observations",
    goal_kind: readString(input.readiness.goal_kind) ?? "compound_evidence_synthesis",
    required_terminal_kind: targetKind,
    support_refs: supportRefs,
    artifact_refs: supportRefs,
    evidence_refs: supportRefs,
    grounded_in_observation_refs: observationRefs,
    subgoal_observation_refs: observationRefs,
    source_families: sourceFamilies,
    generated_from_current_turn_ledger: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const artifact: ArtifactLike & Record<string, unknown> = {
    artifact_id: draftRef,
    turn_id: input.turnId,
    producer_item_id: "ledger_backed_compound_synthesis",
    kind: "final_answer_draft",
    created_at_ms: Date.now(),
    source_scope: "current_turn",
    payload: draftPayload,
  };
  input.artifacts.push(artifact);
  const payloadLedger = readArray(input.payload.current_turn_artifact_ledger);
  if (!payloadLedger.some((entry) => readString(readRecord(entry)?.artifact_id) === draftRef)) {
    input.payload.current_turn_artifact_ledger = [...payloadLedger, artifact];
  }
  input.payload.final_answer_draft = draftPayload;
  input.payload.ledger_backed_compound_final_answer_draft = {
    schema: "helix.ledger_backed_compound_final_answer_draft.v1",
    turn_id: input.turnId,
    final_answer_draft_ref: draftRef,
    support_refs: supportRefs,
    subgoal_observation_refs: observationRefs,
    terminal_artifact_kind: targetKind,
    reason: "compound_subgoals_satisfied_without_final_answer_draft",
    assistant_answer: false,
    raw_content_included: false,
  };
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.ledger_backed_compound_final_answer_draft =
      input.payload.ledger_backed_compound_final_answer_draft;
  }
  return { artifact, ref: draftRef, text };
};

const CONTRACT_AUTHORIZED_RECEIPT_TERMINAL_KINDS = new Set([
  "workspace_action_receipt",
  "doc_open_receipt",
  "note_update_receipt",
  "note_action_receipt",
  "note_create_receipt",
]);

const isContractAuthorizedReceiptTerminalKind = (kind: string | null | undefined): kind is string =>
  Boolean(kind && CONTRACT_AUTHORIZED_RECEIPT_TERMINAL_KINDS.has(kind));

const terminalContractKindValues = (payload: Record<string, unknown>): string[] => {
  const committedRoute = readRecord(payload.committed_ask_route);
  const committedGoal = readRecord(committedRoute?.canonical_goal);
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const routeProduct = readRecord(payload.route_product_contract);
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  const terminalContract = readRecord(goalSatisfaction?.terminal_contract);
  const satisfactionReport = readRecord(payload.satisfaction_report);
  return [
    readString(committedGoal?.required_terminal_kind),
    readString(canonicalGoal?.required_terminal_kind),
    readString(routeProduct?.required_terminal_kind),
    readString(goalSatisfaction?.required_terminal_kind),
    readString(goalSatisfaction?.terminal_artifact_kind),
    readString(satisfactionReport?.terminal_artifact_kind),
    ...readArray(committedGoal?.allowed_terminal_artifact_kinds).map(readString),
    ...readArray(routeProduct?.allowed_terminal_artifact_kinds).map(readString),
    ...readArray(routeProduct?.required_terminal_kinds).map(readString),
    ...readArray(terminalContract?.required_terminal_kinds).map(readString),
    ...readArray(terminalContract?.allowed_terminal_kinds).map(readString),
    ...readArray(terminalContract?.allowed_terminal_artifact_kinds).map(readString),
    ...routeContractAllowedTerminalKinds(payload),
    ...routeProductContractAllowedTerminalKinds(payload),
  ].filter((entry): entry is string => Boolean(entry));
};

const goalSatisfactionAllowsTerminal = (payload: Record<string, unknown>): boolean => {
  const goalSatisfaction = readRecord(payload.goal_satisfaction_evaluation);
  const satisfactionReport = readRecord(payload.satisfaction_report);
  return (
    readString(goalSatisfaction?.satisfaction) === "satisfied" ||
    readString(goalSatisfaction?.next_decision) === "allow_terminal" ||
    satisfactionReport?.satisfied === true
  );
};

const goalObservedResultsSupportKind = (
  payload: Record<string, unknown>,
  kind: string,
): boolean =>
  readArray(readRecord(payload.goal_satisfaction_evaluation)?.observed_results)
    .map(readRecord)
    .some((entry) =>
      Boolean(
        entry &&
          readString(entry.kind) === kind &&
          entry.supports_goal === true,
      ));

const goalContractAllowsReceiptTerminal = (
  payload: Record<string, unknown>,
  kind: string | null | undefined,
): kind is string => {
  if (!isContractAuthorizedReceiptTerminalKind(kind)) return false;
  if (!routeContractAllowsTerminalKind(payload, kind)) return false;
  if (committedRouteForbiddenTerminalKinds(payload).includes(kind)) return false;
  if (!terminalContractKindValues(payload).includes(kind)) return false;
  return goalSatisfactionAllowsTerminal(payload) || goalObservedResultsSupportKind(payload, kind);
};

const artifactMatchesReceiptTerminalKind = (artifact: ArtifactLike, kind: string): boolean => {
  const payload = artifactPayload(artifact);
  const result = readRecord(payload?.result);
  const observation = readRecord(payload?.observation);
  return [
    artifactKind(artifact),
    artifactSchema(artifact),
    readString(payload?.kind),
    readString(payload?.receipt_kind),
    readString(payload?.terminal_artifact_kind),
    readString(result?.kind),
    readString(result?.receipt_kind),
    readString(observation?.kind),
    readString(observation?.receipt_kind),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .includes(kind);
};

const receiptTerminalText = (
  payload: Record<string, unknown>,
  artifact: ArtifactLike,
  kind: string,
): string | null => {
  const artifactPayloadRecord = artifactPayload(artifact);
  const candidateText =
    artifactText(artifact) ??
    readString(artifactPayloadRecord?.label) ??
    readString(artifactPayloadRecord?.title);
  if (candidateText && !isStaleWorkspaceFailureText(candidateText)) return candidateText;
  const selectedText = readString(payload.selected_final_answer);
  if (selectedText && !isStaleWorkspaceFailureText(selectedText) && !isHelixGenericTypedFailureText(selectedText)) {
    return selectedText;
  }
  if (kind === "workspace_action_receipt") return "Workspace action completed.";
  if (kind === "doc_open_receipt") return "Document opened.";
  if (/note/i.test(kind)) return "Note action completed.";
  return null;
};

const findGoalSatisfyingReceiptTerminalArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: string; text: string; ref: string | null } | null => {
  const allowedKinds = Array.from(new Set(
    terminalContractKindValues(payload).filter((kind) => goalContractAllowsReceiptTerminal(payload, kind)),
  ));
  if (allowedKinds.length === 0) return null;

  const stepResultReceiptArtifacts = readArray(payload.step_results)
    .map(readRecord)
    .filter((step): step is Record<string, unknown> => Boolean(step))
    .map((step) => {
      const resultArtifact = readRecord(step.result_artifact);
      const kind = readString(resultArtifact?.kind);
      if (!resultArtifact || !kind || !allowedKinds.includes(kind)) return null;
      return {
        artifact_id:
          readString(resultArtifact.artifact_id) ??
          readString(resultArtifact.receipt_id) ??
          `${readString(step.step_id) ?? "step_result"}:${kind}`,
        kind,
        payload: resultArtifact,
      } satisfies ArtifactLike;
    })
    .filter((artifact): artifact is ArtifactLike => Boolean(artifact));

  const candidates = [...artifacts, ...stepResultReceiptArtifacts];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const artifact = candidates[index];
    if (!artifact) continue;
    const kind = allowedKinds.find((candidateKind) => artifactMatchesReceiptTerminalKind(artifact, candidateKind));
    if (!kind) continue;
    const text = receiptTerminalText(payload, artifact, kind);
    if (!text) continue;
    return {
      artifact,
      kind,
      text,
      ref: artifactId(artifact) ?? readString(artifactPayload(artifact)?.receipt_id),
    };
  }
  return null;
};

const isPostToolObservation = (artifact: ArtifactLike): boolean => {
  const payload = artifactPayload(artifact);
  if (!(
    artifactKind(artifact) === "agent_step_observation_packet" ||
    artifactSchema(artifact) === "helix.agent_step_observation_packet.v1"
  )) {
    return false;
  }
  return (
    payload?.post_tool_model_step_required === true ||
    payload?.terminal_eligible === false ||
    readString(payload?.status) === "succeeded"
  );
};

const nestedObservationPayloads = (artifact: ArtifactLike): Array<Record<string, unknown>> => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  return [payload, observation, result].filter((entry): entry is Record<string, unknown> => Boolean(entry));
};

const artifactMatchesObservationKind = (artifact: ArtifactLike, pattern: RegExp): boolean => {
  const values = [
    artifactKind(artifact),
    artifactSchema(artifact),
    artifactId(artifact),
    ...nestedObservationPayloads(artifact).flatMap((payload) => [
      readString(payload.schema),
      readString(payload.schemaVersion),
      readString(payload.artifactId),
      readString(payload.kind),
      readString(payload.tool_name),
      readString(payload.toolName),
      readString(payload.receipt_id),
      readString(payload.receiptId),
    ]),
  ].filter((entry): entry is string => Boolean(entry));
  return values.some((value) => pattern.test(value));
};

const artifactIsStagePlayReflectionObservation = (artifact: ArtifactLike): boolean => {
  if (artifactKind(artifact) !== "live_environment_tool_observation") return false;
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  if (readString(payload?.tool_name) === "live_env.reflect_stage_play_context") return true;
  if (readString(payload?.toolName) === "live_env.reflect_stage_play_context") return true;
  if (
    readString(observation?.schema) === "stage_play_reflection_result/v1" ||
    readString(observation?.tool_name) === "live_env.reflect_stage_play_context" ||
    readString(observation?.toolName) === "live_env.reflect_stage_play_context"
  ) {
    return true;
  }
  const serialized = JSON.stringify(payload ?? {});
  return /(?:live_env\.reflect_stage_play_context|stage_play_reflection_result\/v1)/i.test(serialized);
};

const hasStagePlayReflectionObservation = (artifacts: ArtifactLike[]): boolean =>
  artifacts.some(artifactIsStagePlayReflectionObservation);

const runtimeLoopExecutedStagePlayReflection = (payload: Record<string, unknown>): boolean => {
  const runtimeLoop = readRecord(payload.agent_runtime_loop);
  return readArray(runtimeLoop?.iterations)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .some((iteration) =>
      readString(iteration.chosen_capability) === "live_env.reflect_stage_play_context" ||
      readString(iteration.executed_action_key) === "live_env.reflect_stage_play_context"
    );
};

const normalizeSingleWriterAuditRejectionReason = (
  reason: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"][number]["reason"],
): TerminalAuthoritySingleWriterAuditRejectionReason => {
  if (
    reason === "receipt_not_terminal_eligible" ||
    reason === "not_terminal_eligible" ||
    reason === "receipt_or_projection" ||
    reason === "deterministic_receipt_fallback_nonterminal"
  ) {
    return "receipt_not_terminal_eligible";
  }
  if (
    reason === "stale_model_only_after_observation" ||
    reason === "composer_claimed_no_observations_but_receipts_exist" ||
    reason === "stale_failure_candidate" ||
    reason === "legacy_direct_writer_quarantined"
  ) {
    return "stale_model_only_after_observation";
  }
  if (reason === "terminal_forbidden_by_phase_lock") return "terminal_forbidden_by_phase_lock";
  if (reason === "missing_required_observation") return "missing_required_observation";
  if (reason === "missing_evidence_reentry" || reason === "missing_post_tool_model_step") {
    return "missing_evidence_reentry";
  }
  if (
    reason === "route_contract_disallowed" ||
    reason === "route_contract_forbidden" ||
    reason === "route_contract_forbids_model_synthesized_answer" ||
    reason === "route_requires_synthesis"
  ) {
    return "route_contract_disallowed";
  }
  return "missing_required_observation";
};

const isAcceptedObservationPacket = (artifact: ArtifactLike): boolean => {
  const sourceScope = readString((artifact as Record<string, unknown>).source_scope);
  if (sourceScope === "prior_context" || sourceScope === "prior_turn_context" || sourceScope === "prior_artifact") {
    return false;
  }
  if (isPostToolObservation(artifact)) return true;
  const kind = artifactKind(artifact);
  const payload = artifactPayload(artifact);
  const ok = payload?.ok;
  if (kind === "live_environment_tool_observation" && ok !== false) return true;
  return (
    artifactMatchesObservationKind(artifact, /repo_code_evidence_observation|helix\.repo_code_evidence_observation\.v1/i) ||
    artifactMatchesObservationKind(artifact, /stage_play_processed_mail_packet/i) ||
    artifactMatchesObservationKind(artifact, /stage_play_live_source_mail_decision/i) ||
    artifactMatchesObservationKind(artifact, /helix_interim_voice_callout_receipt|live_source_interim_voice_callout_receipt|voice_hold_receipt|voice_block_receipt|voice_receipt/i)
  );
};

const isFinalAnswerDraft = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "final_answer_draft" ||
  artifactSchema(artifact) === "helix.final_answer_draft.v1";

const isDirectAnswerText = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "direct_answer_text" ||
  artifactSchema(artifact) === "helix.direct_answer_text.v1";

const committedModelOnlyDirectAnswerRoute = (payload: Record<string, unknown>): boolean => {
  const committedRoute = readRecord(payload.committed_ask_route);
  if (committedRoute?.schema !== HELIX_COMMITTED_ASK_ROUTE_SCHEMA) return false;
  const route = readRecord(committedRoute.route);
  const goal = readRecord(committedRoute.canonical_goal);
  return (
    readString(route?.source_target) === "model_only" &&
    readString(goal?.goal_kind) === "model_only_concept" &&
    readString(goal?.required_terminal_kind) === "direct_answer_text"
  );
};

const findLatestDirectAnswerTerminal = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; text: string; ref: string | null } | null => {
  if (!committedModelOnlyDirectAnswerRoute(payload)) return null;
  if (!routeContractAllowsTerminalKind(payload, "direct_answer_text")) return null;
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isDirectAnswerText(artifact)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, text, ref: artifactId(artifact) };
  }
  const directAnswer = readRecord(payload.direct_answer_text);
  const text = readString(directAnswer?.answer_text) ?? readString(directAnswer?.text);
  if (!text || isStaleWorkspaceFailureText(text)) return null;
  return {
    artifact: {
      kind: "direct_answer_text",
      artifact_id: readString(directAnswer?.artifact_id) ?? undefined,
      payload: directAnswer,
    },
    text,
    ref: readString(directAnswer?.artifact_id),
  };
};

const finalAnswerDraftAuthority = (artifact: ArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.authority);

const isDeterministicStagePlayReceiptText = (value: unknown): boolean =>
  /^Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b/i.test(readString(value) ?? "");

const isDeterministicReceiptFallbackDraft = (artifact: ArtifactLike): boolean =>
  isFinalAnswerDraft(artifact) &&
  (
    finalAnswerDraftAuthority(artifact) === "deterministic_receipt_fallback" ||
    isDeterministicStagePlayReceiptText(artifactText(artifact))
  );

const isFailureLikeFinalAnswerDraftText = (text: string | null | undefined): boolean =>
  /\b(?:I could not complete|I could not produce|could not produce a terminal answer|terminal answer unavailable|missing required artifacts|missing requirements|was not satisfied|not satisfied due to missing|required artifacts were missing)\b/i.test(
    text ?? "",
  );

const findFinalAnswerDraftCandidateByRef = (
  artifacts: ArtifactLike[],
  ref: string | null | undefined,
): { artifact: ArtifactLike; sequence: number; text: string; ref: string } | null => {
  if (!ref) return null;
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isFinalAnswerDraft(artifact)) continue;
    if (artifactId(artifact) !== ref) continue;
    const text = artifactText(artifact);
    if (!text) return null;
    return { artifact, sequence: index, text, ref };
  }
  return null;
};

const findCompoundSupportedFinalAnswerDraftCandidate = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; text: string; ref: string } | null => {
  if (!compoundTerminalSynthesisPolicyActive(payload)) return null;
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isFinalAnswerDraft(artifact)) continue;
    if (isDeterministicReceiptFallbackDraft(artifact)) continue;
    const text = artifactText(artifact);
    const ref = artifactId(artifact);
    if (!text || !ref) continue;
    if (isStaleWorkspaceFailureText(text) || isStaleModelOnlyNoObservationText(text)) continue;
    if (isFailureLikeFinalAnswerDraftText(text) || isHelixGenericTypedFailureText(text)) continue;
    const coverage = resolveCompoundSubgoalDraftSupportCoverage({
      payload,
      draft: artifact,
      artifactLedger: artifacts,
      finalAnswerDraftRef: ref,
    });
    if (!coverage.applies || !coverage.ok) continue;
    return { artifact, sequence: index, text, ref };
  }
  return null;
};

const stagePlayReceiptPendingText =
  "Stage Play reflected the active visual source and queued a checkpoint.\nNo model-reviewed answer snapshot exists yet.";

const stagePlayReceiptTextForDraft = (artifact: ArtifactLike): string => {
  const text = artifactText(artifact);
  return /^Stage Play checkpoint request (?:queued|running|completed):/i.test(text ?? "")
    ? text!
    : /^Stage Play job planned\b/i.test(text ?? "")
      ? text!
    : /^Stage Play/i.test(text ?? "")
      ? stagePlayReceiptPendingText
      : text && !/\b(?:I could not|I couldn.?t|could not produce|couldn.?t produce|terminal answer|typed_failure|selected terminal product)\b/i.test(text)
        ? text
        : stagePlayReceiptPendingText;
};

const isScholarlyFullTextObservation = (artifact: ArtifactLike): boolean =>
  /scholarly_full_text_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const hasObservedScholarlyFullText = (artifacts: ArtifactLike[]): boolean =>
  artifacts.some((artifact) => {
    if (!isScholarlyFullTextObservation(artifact)) return false;
    const payload = artifactPayload(artifact);
    if (!payload) return false;
    const pagesParsed = typeof payload.pages_parsed === "number" ? payload.pages_parsed : 0;
    return (
      pagesParsed > 0 ||
      readArray(payload.selected_chunks).length > 0 ||
      readArray(payload.page_text_refs).length > 0 ||
      Boolean(readString(payload.source_url) ?? readString(payload.source_pdf_ref))
    );
  });

const attachItineraryExecutionState = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): string[] => {
  return attachHelixCapabilityItineraryExecutionState(payload, artifacts);
};

type CompoundSubgoalDraftSupportCoverage = {
  schema: "helix.compound_subgoal_draft_support_coverage.v1";
  applies: boolean;
  ok: boolean;
  required_observation_refs: string[];
  draft_support_refs: string[];
  missing_observation_refs: string[];
  final_answer_draft_ref: string | null;
  assistant_answer: false;
  raw_content_included: false;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((entry): entry is string => Boolean(entry))));

const compoundSubgoalHasSatisfiedObservation = (entry: Record<string, unknown>): boolean => {
  const railStatus = readString(entry.rail_status);
  return (
    readString(entry.satisfaction) === "satisfied" &&
    Boolean(readString(entry.observation_ref)) &&
    (!railStatus || railStatus === "complete")
  );
};

const collectRefsFromRecord = (record: Record<string, unknown> | null): string[] => {
  if (!record) return [];
  const directRefs = [
    readString(record.ref),
    readString(record.artifact_ref),
    readString(record.artifact_id),
    readString(record.observation_ref),
    readString(record.source_observation_ref),
    readString(record.citation_ref),
    readString(record.evaluation_id),
    readString(record.coverage_ref),
    readString(record.result_ref),
    readString(record.source_ref),
  ];
  const arrayRefs = [
    ...readArray(record.support_refs).map(readString),
    ...readArray(record.artifact_refs).map(readString),
    ...readArray(record.evidence_refs).map(readString),
    ...readArray(record.coverage_refs).map(readString),
    ...readArray(record.observation_refs).map(readString),
    ...readArray(record.source_observation_refs).map(readString),
    ...readArray(record.grounded_observation_refs).map(readString),
    ...readArray(record.grounded_in_observation_refs).map(readString),
    ...readArray(record.selected_evidence_refs).map(readString),
    ...readArray(record.subgoal_observation_refs).map(readString),
  ];
  return uniqueStrings([...directRefs, ...arrayRefs]);
};

const terminalPayloadKeyForKind = (kind: string | null): string | null => {
  switch (kind) {
    case "model_synthesized_answer":
    case "doc_evidence_synthesis_answer":
    case "repo_code_evidence_answer":
    case "compound_evidence_synthesis_answer":
    case "compound_research_locator_answer":
    case "scholarly_research_answer":
    case "internet_search_answer":
    case "theory_context_reflection_answer":
    case "capability_help_summary":
    case "workspace_status_answer":
    case "workstation_tool_evaluation":
      return kind;
    default:
      return null;
  }
};

const supportRefsFromTerminalRecord = (record: Record<string, unknown> | null): {
  supportRefs: string[];
  subgoalObservationRefs: string[];
  sourceFamilies: string[];
} => ({
  supportRefs: uniqueStrings([
    ...readArray(record?.support_refs).map(readString),
    ...readArray(record?.evidence_refs).map(readString),
    ...readArray(record?.artifact_refs).map(readString),
    ...readArray(record?.source_artifact_refs).map(readString),
    ...readArray(record?.observation_refs).map(readString),
    ...readArray(record?.source_observation_refs).map(readString),
    ...readArray(record?.selected_evidence_refs).map(readString),
    ...readArray(record?.grounded_observation_refs).map(readString),
    ...readArray(record?.grounded_in_observation_refs).map(readString),
  ]),
  subgoalObservationRefs: uniqueStrings([
    ...readArray(record?.subgoal_observation_refs).map(readString),
    ...readArray(record?.source_observation_refs).map(readString),
    ...readArray(record?.grounded_observation_refs).map(readString),
    ...readArray(record?.grounded_in_observation_refs).map(readString),
  ]),
  sourceFamilies: uniqueStrings([
    ...readArray(record?.source_families).map(readString),
  ]),
});

const terminalKindCanMirrorSupport = (kind: string | null): kind is string =>
  Boolean(
    kind &&
      kind !== "typed_failure" &&
      kind !== "request_user_input" &&
      kind !== "pending_server_request" &&
      kind !== "direct_answer_text" &&
      kind !== "tool_receipt",
  );

const artifactMatchesTerminalSelection = (
  artifact: ArtifactLike,
  selectedTerminalArtifactKind: string,
  selectedTerminalArtifactRef: string | null,
): boolean => {
  if (artifactKind(artifact) !== selectedTerminalArtifactKind) return false;
  if (!selectedTerminalArtifactRef) return false;
  return artifactId(artifact) === selectedTerminalArtifactRef;
};

const selectedTerminalPayloadRecords = (input: {
  payload: Record<string, unknown>;
  selectedTerminalArtifactKind: string;
  selectedTerminalArtifactRef: string | null;
  artifactLedger: ArtifactLike[];
}): Array<Record<string, unknown>> => {
  const terminalPayloadKey = terminalPayloadKeyForKind(input.selectedTerminalArtifactKind);
  const explicitPayload = terminalPayloadKey
    ? readRecord(input.payload[terminalPayloadKey])
    : readRecord(input.payload[input.selectedTerminalArtifactKind]);
  const selectedArtifactPayload = input.artifactLedger
    .filter((artifact) =>
      artifactMatchesTerminalSelection(
        artifact,
        input.selectedTerminalArtifactKind,
        input.selectedTerminalArtifactRef,
      ))
    .map(artifactPayload)
    .find((record): record is Record<string, unknown> => Boolean(record));
  const latestKindPayload = input.artifactLedger
    .slice()
    .reverse()
    .find((artifact) => artifactKind(artifact) === input.selectedTerminalArtifactKind);
  return [
    explicitPayload,
    selectedArtifactPayload,
    latestKindPayload ? artifactPayload(latestKindPayload) : null,
  ].filter((record): record is Record<string, unknown> => Boolean(record));
};

const selectedTerminalSupportMirror = (input: {
  payload: Record<string, unknown>;
  selectedTerminalArtifactKind: string | null;
  selectedTerminalArtifactRef: string | null;
  artifactLedger: ArtifactLike[];
}): {
  supportRefs: string[];
  subgoalObservationRefs: string[];
  sourceFamilies: string[];
} => {
  const terminalPresentation = readRecord(input.payload.terminal_presentation);
  if (!terminalKindCanMirrorSupport(input.selectedTerminalArtifactKind)) {
    return {
      supportRefs: [],
      subgoalObservationRefs: [],
      sourceFamilies: [],
    };
  }
  const terminalPayloadMirrors = selectedTerminalPayloadRecords({
    payload: input.payload,
    selectedTerminalArtifactKind: input.selectedTerminalArtifactKind,
    selectedTerminalArtifactRef: input.selectedTerminalArtifactRef,
    artifactLedger: input.artifactLedger,
  }).map(supportRefsFromTerminalRecord);
  return {
    supportRefs: uniqueStrings([
      ...terminalPayloadMirrors.flatMap((mirror) => mirror.supportRefs),
      ...readArray(terminalPresentation?.support_refs).map(readString),
    ]),
    subgoalObservationRefs: uniqueStrings([
      ...terminalPayloadMirrors.flatMap((mirror) => mirror.subgoalObservationRefs),
      ...readArray(terminalPresentation?.subgoal_observation_refs).map(readString),
    ]),
    sourceFamilies: uniqueStrings([
      ...terminalPayloadMirrors.flatMap((mirror) => mirror.sourceFamilies),
      ...readArray(terminalPresentation?.source_families).map(readString),
    ]),
  };
};

const collectExplicitFinalAnswerDraftSupportRefs = (draft: ArtifactLike | null | undefined): string[] => {
  const payload = draft ? artifactPayload(draft) : null;
  if (!payload) return [];
  const nestedRefs = [
    ...readArray(payload.sections).map(readRecord).flatMap(collectRefsFromRecord),
    ...readArray(payload.citations).map(readRecord).flatMap(collectRefsFromRecord),
    ...readArray(payload.sources).map(readRecord).flatMap(collectRefsFromRecord),
    ...readArray(payload.evidence).map(readRecord).flatMap(collectRefsFromRecord),
  ];
  return uniqueStrings([
    ...collectRefsFromRecord(payload),
    ...nestedRefs,
  ]);
};

const supportRefCoversObservationRef = (supportRef: string, observationRef: string): boolean =>
  supportRef === observationRef ||
  supportRef.endsWith(`#${observationRef}`) ||
  supportRef.endsWith(`/${observationRef}`);

const artifactRefMatches = (artifact: ArtifactLike, ref: string): boolean => {
  const payload = artifactPayload(artifact);
  return uniqueStrings([
    readString(artifact.artifact_id),
    readString(payload?.artifact_id),
    readString(payload?.evaluation_id),
    readString(payload?.receipt_id),
  ]).some((candidate) => candidate === ref);
};

const collectObservationEquivalentSupportRefs = (
  artifacts: ArtifactLike[],
  observationRef: string,
): string[] => {
  const artifact = artifacts.find((entry) => artifactRefMatches(entry, observationRef));
  const payload = artifact ? artifactPayload(artifact) : null;
  return uniqueStrings([
    observationRef,
    ...collectRefsFromRecord(payload),
  ]);
};

const resolveCompoundSubgoalDraftSupportCoverage = (input: {
  payload: Record<string, unknown>;
  draft: ArtifactLike | null | undefined;
  artifactLedger?: ArtifactLike[] | null;
  finalAnswerDraftRef?: string | null;
}): CompoundSubgoalDraftSupportCoverage => {
  const artifactLedger = input.artifactLedger ?? readArray(input.payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter((entry): entry is ArtifactLike => Boolean(entry));
  const executionState =
    readRecord(input.payload.capability_itinerary_execution_state) ??
    artifactLedgerPayloadByKind(artifactLedger, "capability_itinerary_execution_state");
  const ledger = readArray(executionState?.compound_subgoal_ledger)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));
  const requiredObservationRefs = uniqueStrings(
    ledger
      .filter(compoundSubgoalHasSatisfiedObservation)
      .map((entry) => readString(entry.observation_ref)),
  );
  const applies =
    executionState?.applies === true &&
    executionState?.complete === true &&
    ledger.length > 1 &&
    requiredObservationRefs.length > 0;
  const draftSupportRefs = collectExplicitFinalAnswerDraftSupportRefs(input.draft);
  const missingObservationRefs = applies
    ? requiredObservationRefs.filter((observationRef) => {
        const equivalentRefs = collectObservationEquivalentSupportRefs(artifactLedger, observationRef);
        return !equivalentRefs.some((equivalentRef) =>
          draftSupportRefs.some((supportRef) =>
            supportRefCoversObservationRef(supportRef, equivalentRef) ||
            supportRefCoversObservationRef(equivalentRef, supportRef),
          ),
        );
      })
    : [];
  return {
    schema: "helix.compound_subgoal_draft_support_coverage.v1",
    applies,
    ok: !applies || missingObservationRefs.length === 0,
    required_observation_refs: requiredObservationRefs,
    draft_support_refs: draftSupportRefs,
    missing_observation_refs: missingObservationRefs,
    final_answer_draft_ref: input.finalAnswerDraftRef ?? null,
    assistant_answer: false,
    raw_content_included: false,
  };
};

type ScholarlyCitation = {
  label: string;
  url: string;
  note: string | null;
};

const isScholarlyResearchObservation = (artifact: ArtifactLike): boolean =>
  /scholarly_research_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const firstReadableString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const firstHttpUrl = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text && /^https?:\/\//i.test(text)) return text;
  }
  return null;
};

const doiUrl = (value: unknown): string | null => {
  const doi = readString(value);
  if (!doi) return null;
  if (/^https?:\/\/(?:dx\.)?doi\.org\//i.test(doi)) return doi.replace(/^https?:\/\/dx\.doi\.org\//i, "https://doi.org/");
  return `https://doi.org/${doi.replace(/^doi:\s*/i, "")}`;
};

const arxivUrl = (value: unknown): string | null => {
  const arxivId = readString(value);
  if (!arxivId) return null;
  if (/^https?:\/\/(?:www\.)?arxiv\.org\//i.test(arxivId)) return arxivId;
  return `https://arxiv.org/abs/${arxivId.replace(/^arxiv:\s*/i, "")}`;
};

const citationKey = (value: string | null): string | null =>
  value ? value.trim().toLowerCase() : null;

const paperCitationUrl = (paper: Record<string, unknown> | null): string | null => {
  const identifiers = readRecord(paper?.identifiers);
  return firstHttpUrl(
    paper?.pdf_url,
    paper?.full_text_url,
    paper?.url,
    identifiers?.pdf_url,
    identifiers?.full_text_url,
    identifiers?.url,
    doiUrl(firstReadableString(paper?.doi, identifiers?.doi)),
    arxivUrl(firstReadableString(paper?.arxiv_id, identifiers?.arxiv_id)),
  );
};

const collectScholarlyPaperRecordsByKey = (artifacts: ArtifactLike[]): Map<string, Record<string, unknown>> => {
  const papers = new Map<string, Record<string, unknown>>();
  const add = (key: string | null, paper: Record<string, unknown>): void => {
    if (key && !papers.has(key)) papers.set(key, paper);
  };
  for (const artifact of artifacts) {
    if (!isScholarlyResearchObservation(artifact)) continue;
    const payload = artifactPayload(artifact);
    for (const paperValue of readArray(payload?.papers)) {
      const paper = readRecord(paperValue);
      if (!paper) continue;
      const identifiers = readRecord(paper.identifiers);
      add(citationKey(readString(paper.result_id)), paper);
      add(citationKey(readString(identifiers?.openalex_id)), paper);
      add(citationKey(readString(identifiers?.doi)), paper);
      add(citationKey(readString(identifiers?.arxiv_id)), paper);
      add(citationKey(readString(paper.title)), paper);
    }
  }
  return papers;
};

const findPaperForFullTextObservation = (
  payload: Record<string, unknown>,
  papersByKey: Map<string, Record<string, unknown>>,
): Record<string, unknown> | null => {
  const keys = [
    citationKey(readString(payload.paper_result_id)),
    citationKey(readString(payload.result_id)),
    citationKey(readString(payload.title)),
  ].filter((entry): entry is string => Boolean(entry));
  for (const key of keys) {
    const paper = papersByKey.get(key);
    if (paper) return paper;
  }
  return null;
};

const markdownLinkLabel = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\s+/g, " ").trim();

const hasExistingCitationFooter = (text: string): boolean =>
  /(?:^|\n)\s*(?:#{1,6}\s*)?(?:citations|references|sources)\s*:?\s*(?:\n|$)/i.test(text);

const collectScholarlyCitations = (artifacts: ArtifactLike[]): ScholarlyCitation[] => {
  const papersByKey = collectScholarlyPaperRecordsByKey(artifacts);
  const citations: ScholarlyCitation[] = [];
  const seen = new Set<string>();
  const addCitation = (citation: ScholarlyCitation): void => {
    const key = `${citation.url.toLowerCase()}|${citation.label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    citations.push(citation);
  };

  for (const artifact of artifacts) {
    if (!isScholarlyFullTextObservation(artifact)) continue;
    const payload = artifactPayload(artifact);
    if (!payload || payload.selected_for_answer === false) continue;
    const selectedChunks = readArray(payload.selected_chunks);
    const pageTextRefs = readArray(payload.page_text_refs);
    const pagesParsed = typeof payload.pages_parsed === "number" ? payload.pages_parsed : 0;
    if (selectedChunks.length === 0 && pageTextRefs.length === 0 && pagesParsed <= 0) continue;
    const paper = findPaperForFullTextObservation(payload, papersByKey);
    const url = firstHttpUrl(payload.source_url, paperCitationUrl(paper));
    if (!url) continue;
    const label = firstReadableString(payload.title, paper?.title, payload.paper_result_id, artifactId(artifact)) ?? "Scholarly source";
    const note = pagesParsed > 0 ? `PDF/full text; ${pagesParsed} parsed page${pagesParsed === 1 ? "" : "s"}` : "PDF/full text";
    addCitation({ label, url, note });
  }

  if (citations.length === 0) {
    for (const paper of papersByKey.values()) {
      if (paper.selected_for_answer === false) continue;
      const url = paperCitationUrl(paper);
      if (!url) continue;
      const label = firstReadableString(paper.title, paper.result_id, url) ?? "Scholarly source";
      addCitation({ label, url, note: null });
      if (citations.length >= 4) break;
    }
  }

  return citations.slice(0, 6);
};

const appendScholarlyCitationFooter = (
  text: string,
  artifacts: ArtifactLike[],
): { text: string; citations: ScholarlyCitation[]; footer: string | null } => {
  if (hasExistingCitationFooter(text)) return { text, citations: [], footer: null };
  const citations = collectScholarlyCitations(artifacts);
  if (citations.length === 0) return { text, citations, footer: null };
  const footer = [
    "Citations",
    ...citations.map((citation) =>
      `- [${markdownLinkLabel(citation.label)}](${citation.url})${citation.note ? ` (${citation.note})` : ""}`),
  ].join("\n");
  return { text: `${text.trimEnd()}\n\n${footer}`, citations, footer };
};

const isForbiddenReceiptOrProjection = (artifact: ArtifactLike): boolean => {
  const kind = artifactKind(artifact);
  const observationKindValues = [
    kind,
    artifactSchema(artifact),
    artifactId(artifact),
    ...nestedObservationPayloads(artifact).flatMap((payload) => [
      readString(payload.schema),
      readString(payload.schemaVersion),
      readString(payload.artifactId),
      readString(payload.artifact_id),
      readString(payload.kind),
      readString(payload.feedKind),
      readString(payload.updateKind),
      readString(payload.producerKind),
    ]),
  ].filter((entry): entry is string => Boolean(entry));
  return (
    observationKindValues.some(isWorkstationObservationTerminalKind) ||
    kind === "workspace_action_receipt" ||
    kind === "note_update_receipt" ||
    kind === "note_action_receipt" ||
    kind === "note_create_receipt" ||
    kind === "agent_step_observation_packet" ||
    kind === "client_projection" ||
    kind === "live_pipeline_receipt" ||
    kind === "voice_delivery_proposal" ||
    kind === "legacy_terminal_candidate"
  );
};

const isVisualSituationTerminalKind = (kind: string): kind is
  | "situation_context_pack"
  | "visual_context_pack"
  | "visual_frame_evidence" =>
  kind === "situation_context_pack" ||
  kind === "visual_context_pack" ||
  kind === "visual_frame_evidence";

const findGoalSatisfyingVisualSituationArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "situation_context_pack" | "visual_context_pack" | "visual_frame_evidence"; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.goal_satisfaction_evaluation);
  if (readString(goal?.next_decision) !== "allow_terminal" || readString(goal?.satisfaction) !== "satisfied") {
    return null;
  }
  const supportedRefs = Array.isArray(goal?.observed_results)
    ? (goal.observed_results as unknown[])
      .map(readRecord)
      .filter((entry): entry is Record<string, unknown> =>
        Boolean(entry?.supports_goal === true && isVisualSituationTerminalKind(readString(entry.kind) ?? "")))
      .map((entry) => readString(entry.ref))
      .filter((entry): entry is string => Boolean(entry))
    : [];
  if (supportedRefs.length === 0) {
    const requiredEvidence = Array.isArray(goal?.required_evidence)
      ? (goal.required_evidence as unknown[]).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
      : [];
    const visualObservationSatisfied = requiredEvidence.some((entry) =>
      readString(entry.kind) === "visual_observation" && entry.satisfied === true,
    );
    const fieldEvaluationSatisfied = requiredEvidence.some((entry) =>
      readString(entry.kind) === "field_evaluation" && entry.satisfied === true,
    );
    const situationContextPackSatisfied = requiredEvidence.some((entry) =>
      readString(entry.kind) === "situation_context_pack" && entry.satisfied === true,
    );
    if (!(visualObservationSatisfied && fieldEvaluationSatisfied) && !situationContextPackSatisfied) return null;
    for (const artifact of artifacts) {
      const kind = artifactKind(artifact);
      if (!isVisualSituationTerminalKind(kind)) continue;
      const text = artifactText(artifact);
      if (!text || isStaleWorkspaceFailureText(text)) continue;
      return { artifact, kind, text, ref: artifactId(artifact) };
    }
    return null;
  }
  for (const ref of supportedRefs) {
    const artifact = artifacts.find((entry) => artifactId(entry) === ref);
    if (!artifact) continue;
    const kind = artifactKind(artifact);
    if (!isVisualSituationTerminalKind(kind)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, kind, text, ref };
  }
  return null;
};

const findLiveEnvironmentBindingDiagnosisTerminal = (
  payload: Record<string, unknown>,
): { kind: "live_environment_binding_diagnosis"; text: string; ref: string | null } | null => {
  if (readString(payload.terminal_artifact_kind) !== "live_environment_binding_diagnosis") return null;
  if (readString(payload.final_answer_source) !== "live_environment_binding_diagnosis") return null;
  if (!routeContractAllowsTerminalKind(payload, "live_environment_binding_diagnosis")) return null;
  const goal = readRecord(payload.canonical_goal_frame);
  const requiredTerminalKind = readString(goal?.required_terminal_kind);
  if (readString(goal?.goal_kind) !== "live_environment_binding_diagnosis") return null;
  if (requiredTerminalKind && requiredTerminalKind !== "live_environment_binding_diagnosis") return null;
  const diagnosis = readRecord(payload.live_environment_binding_diagnosis);
  if (!/^helix\.live_environment_binding_diagnosis\.v\d+$/i.test(readString(diagnosis?.schema) ?? "")) return null;
  if (diagnosis?.assistant_answer !== false || diagnosis?.raw_content_included !== false) return null;
  const text =
    readString(payload.selected_final_answer) ??
    readString(payload.answer) ??
    readString(payload.text) ??
    readString(readRecord(payload.terminal_presentation)?.concise_text);
  if (!text || isStaleWorkspaceFailureText(text) || isStaleModelOnlyNoObservationText(text)) return null;
  return {
    kind: "live_environment_binding_diagnosis",
    text,
    ref: readString(payload.terminal_artifact_id) ?? readString(diagnosis?.diagnosis_id),
  };
};

type DocumentTerminalArtifactKind =
  | "active_doc_identity"
  | "doc_summary"
  | "doc_location_matches"
  | "doc_evidence_location"
  | "doc_location_result";

const isDocumentTerminalArtifactKind = (kind: string): kind is DocumentTerminalArtifactKind =>
  kind === "active_doc_identity" ||
  kind === "doc_summary" ||
  kind === "doc_location_matches" ||
  kind === "doc_evidence_location" ||
  kind === "doc_location_result";

const compatibleDocumentTerminalKinds = (requiredKind: DocumentTerminalArtifactKind): DocumentTerminalArtifactKind[] => {
  if (requiredKind === "doc_evidence_location" || requiredKind === "doc_location_result") {
    return ["doc_evidence_location", "doc_location_matches", "doc_location_result"];
  }
  return [requiredKind];
};

const documentTerminalText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  const kind = artifactKind(artifact);
  const text = artifactText(artifact);
  if (text) return text;
  if (kind === "active_doc_identity") {
    const path = readString(payload?.active_doc_path);
    if (!path) return null;
    const title = readString(payload?.active_doc_title) ?? path.split(/[\\/]/).pop() ?? path;
    return ["Active doc:", `Document: ${title}`, `Path: ${path}`, "", "Open active doc"].join("\n");
  }
  if (kind === "doc_location_matches" || kind === "doc_evidence_location" || kind === "doc_location_result") {
    const matches = readArray(payload?.matches)
      .map(readRecord)
      .filter((entry): entry is Record<string, unknown> => Boolean(entry))
      .slice(0, 6);
    if (matches.length === 0) return null;
    const lines = matches.map((match, index) => {
      const line =
        readString(match.line) ??
        readString(match.line_number) ??
        readString(match.lineNumber) ??
        readString(match.anchor) ??
        `${index + 1}`;
      const snippet =
        readString(match.snippet) ??
        readString(match.text) ??
        readString(match.heading) ??
        readString(match.section) ??
        "matched location";
      return `- ${line}: ${snippet}`;
    });
    return ["Locations:", ...lines].join("\n");
  }
  return null;
};

const findGoalSatisfyingDocumentArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: DocumentTerminalArtifactKind; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.canonical_goal_frame);
  const requiredTerminalKind = readString(goal?.required_terminal_kind);
  if (!requiredTerminalKind || !isDocumentTerminalArtifactKind(requiredTerminalKind)) return null;
  if (!routeContractAllowsTerminalKind(payload, requiredTerminalKind)) return null;
  const compatibleKinds = compatibleDocumentTerminalKinds(requiredTerminalKind);
  const goalEvaluation = readRecord(payload.goal_satisfaction_evaluation);
  const stepResultDocumentArtifacts = readArray(payload.step_results)
    .map(readRecord)
    .filter((step): step is Record<string, unknown> => Boolean(step))
    .map((step) => {
      const resultArtifact = readRecord(step.result_artifact);
      const kind = readString(resultArtifact?.kind);
      if (!resultArtifact || !kind || !compatibleKinds.includes(kind as DocumentTerminalArtifactKind)) return null;
      return {
        artifact_id:
          readString(resultArtifact.artifact_id) ??
          `${readString(step.step_id) ?? "step_result"}:${kind}`,
        kind,
        payload: resultArtifact,
      } satisfies ArtifactLike;
    })
    .filter((artifact): artifact is ArtifactLike => Boolean(artifact));
  const hasCurrentTurnDocumentCandidate = stepResultDocumentArtifacts.some((artifact) => {
    const payloadRecord = artifactPayload(artifact);
    return readArray(payloadRecord?.matches).length > 0 || Boolean(documentTerminalText(artifact));
  });
  if (
    readString(goalEvaluation?.satisfaction) !== "satisfied" &&
    readString(goalEvaluation?.next_decision) !== "allow_terminal" &&
    !hasCurrentTurnDocumentCandidate
  ) {
    return null;
  }
  const candidates = [...artifacts, ...stepResultDocumentArtifacts];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const artifact = candidates[index];
    const kind = artifact ? artifactKind(artifact) : null;
    if (!artifact || !kind || !compatibleKinds.includes(kind as DocumentTerminalArtifactKind)) continue;
    const text = documentTerminalText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, kind: kind as DocumentTerminalArtifactKind, text, ref: artifactId(artifact) };
  }
  return null;
};

const workspaceDirectoryResolutionText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  const text = artifactText(artifact);
  if (text) return text;
  const status = readString(payload?.status);
  const query = readString(payload?.query) ?? readString(payload?.normalized_query);
  const selectedUri =
    readString(payload?.selected_uri) ??
    readString(payload?.selected_doc_path) ??
    readString(payload?.selected_artifact_id);
  const candidates = readArray(payload?.candidates)
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .slice(0, 5)
    .map((entry, index) => {
      const uri =
        readString(entry.uri) ??
        readString(entry.doc_path) ??
        readString(entry.panel_id) ??
        readString(entry.artifact_id) ??
        "unresolved";
      const label = readString(entry.label) ?? readString(entry.title) ?? readString(entry.target_kind);
      return `- ${index + 1}. ${label ? `${label}: ` : ""}${uri}`;
    });
  const lines = [
    "Workspace directory resolution:",
    status ? `Status: ${status}` : "",
    query ? `Query: ${query}` : "",
    selectedUri ? `Selected: ${selectedUri}` : "",
    candidates.length > 0 ? "Candidates:" : "",
    ...candidates,
  ].filter(Boolean);
  return lines.length > 1 ? lines.join("\n") : null;
};

const findGoalSatisfyingWorkspaceDirectoryResolutionArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "workspace_directory_resolution"; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.canonical_goal_frame);
  if (readString(goal?.required_terminal_kind) !== "workspace_directory_resolution") return null;
  if (!routeContractAllowsTerminalKind(payload, "workspace_directory_resolution")) return null;
  const goalEvaluation = readRecord(payload.goal_satisfaction_evaluation);
  if (
    readString(goalEvaluation?.satisfaction) !== "satisfied" &&
    readString(goalEvaluation?.next_decision) !== "allow_terminal"
  ) {
    return null;
  }
  const stepResultResolutionArtifacts = readArray(payload.step_results)
    .map(readRecord)
    .filter((step): step is Record<string, unknown> => Boolean(step))
    .map((step) => {
      const resultArtifact = readRecord(step.result_artifact);
      if (!resultArtifact || readString(resultArtifact.kind) !== "workspace_directory_resolution") return null;
      return {
        artifact_id:
          readString(resultArtifact.artifact_id) ??
          `${readString(step.step_id) ?? "step_result"}:workspace_directory_resolution`,
        kind: "workspace_directory_resolution",
        payload: resultArtifact,
      } satisfies ArtifactLike;
    })
    .filter((artifact): artifact is ArtifactLike => Boolean(artifact));
  const candidates = [...artifacts, ...stepResultResolutionArtifacts];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const artifact = candidates[index];
    if (!artifact || artifactKind(artifact) !== "workspace_directory_resolution") continue;
    const text = workspaceDirectoryResolutionText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, kind: "workspace_directory_resolution", text, ref: artifactId(artifact) };
  }
  return null;
};

const findGoalSatisfyingCapabilityHelpArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "capability_help_summary"; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.canonical_goal_frame);
  if (readString(goal?.required_terminal_kind) !== "capability_help_summary") return null;
  if (!routeContractAllowsTerminalKind(payload, "capability_help_summary")) return null;
  const goalEvaluation = readRecord(payload.goal_satisfaction_evaluation);
  const satisfactionReport = readRecord(payload.satisfaction_report);
  const satisfactionReportAllowsCapabilityHelp =
    satisfactionReport?.satisfied === true ||
    readString(satisfactionReport?.terminal_artifact_kind) === "capability_help_summary";
  const capabilityHelpMaterializedByLedger =
    artifacts.some((artifact) => artifactKind(artifact) === "capability_registry") &&
    artifacts.some((artifact) => artifactKind(artifact) === "capability_help_summary");
  if (
    readString(goalEvaluation?.satisfaction) !== "satisfied" &&
    readString(goalEvaluation?.next_decision) !== "allow_terminal" &&
    !satisfactionReportAllowsCapabilityHelp &&
    !capabilityHelpMaterializedByLedger
  ) {
    return null;
  }
  const stepResultCapabilityHelpArtifacts = readArray(payload.step_results)
    .map(readRecord)
    .filter((step): step is Record<string, unknown> => Boolean(step))
    .map((step) => {
      const resultArtifact = readRecord(step.result_artifact);
      if (!resultArtifact || readString(resultArtifact.kind) !== "capability_help_summary") return null;
      return {
        artifact_id:
          readString(resultArtifact.artifact_id) ??
          `${readString(step.step_id) ?? "step_result"}:capability_help_summary`,
        kind: "capability_help_summary",
        payload: resultArtifact,
      } satisfies ArtifactLike;
    })
    .filter((artifact): artifact is ArtifactLike => Boolean(artifact));
  const candidates = [...artifacts, ...stepResultCapabilityHelpArtifacts];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const artifact = candidates[index];
    if (!artifact || artifactKind(artifact) !== "capability_help_summary") continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, kind: "capability_help_summary", text, ref: artifactId(artifact) };
  }
  const registryArtifact = [...artifacts].reverse().find((artifact) => artifactKind(artifact) === "capability_registry");
  const registryPayload = registryArtifact ? artifactPayload(registryArtifact) : null;
  const catalogObservation = readRecord(registryPayload?.capability_catalog_observation);
  const readScalar = (value: unknown): string | null =>
    typeof value === "number" && Number.isFinite(value) ? String(value) : readString(value);
  const activeToolCount = readScalar(catalogObservation?.active_dynamic_tool_count);
  const retiredToolCount = readScalar(catalogObservation?.retired_dynamic_tool_count);
  const informationReflection = readArray(catalogObservation?.information_reflection)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const utility = readArray(catalogObservation?.utility)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  if (registryArtifact && catalogObservation) {
    const lines = [
      "Helix Ask capability catalog is available from the runtime registry.",
      activeToolCount ? `Active tool records: ${activeToolCount}.` : null,
      retiredToolCount ? `Retired or legacy records: ${retiredToolCount}.` : null,
      informationReflection.length
        ? `Information/reflection examples: ${informationReflection.slice(0, 5).join("; ")}.`
        : null,
      utility.length ? `Utility examples: ${utility.slice(0, 4).join("; ")}.` : null,
    ].filter((line): line is string => Boolean(line));
    const text = lines.join("\n");
    const registryRef = artifactId(registryArtifact) ?? "capability_registry";
    const ref = `${registryRef}:capability_help_summary`;
    const terminalPayload = {
      schema: "helix.capability_help_summary.v1",
      kind: "capability_help_summary",
      text,
      capability_catalog_ref: registryRef,
      support_refs: [registryRef],
      support_refs_count: 1,
      subgoal_observation_refs: [registryRef],
      subgoal_observation_refs_count: 1,
      source_families: ["capability_catalog"],
      assistant_answer: false,
      terminal_eligible: true,
      raw_content_included: false,
    };
    payload.capability_help_summary = terminalPayload;
    return {
      artifact: {
        artifact_id: ref,
        kind: "capability_help_summary",
        payload: terminalPayload,
      },
      kind: "capability_help_summary",
      text,
      ref,
    };
  }
  return null;
};

const workstationToolEvaluationText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return (
    artifactText(artifact) ??
    readString((artifact as Record<string, unknown>).text_preview) ??
    readString((artifact as Record<string, unknown>).terminal_text_preview) ??
    readString(payload?.text_preview) ??
    readString(payload?.terminal_text_preview) ??
    readString(payload?.summary) ??
    readString(payload?.result_summary) ??
    readString(payload?.result_text) ??
    readString(readRecord(payload?.result)?.summary) ??
    readString(readRecord(payload?.result)?.text) ??
    readString(readRecord(payload?.evaluation)?.summary)
  );
};

const theoryContextPromptText = (payload: Record<string, unknown>): string | null =>
  readString(payload.active_prompt) ??
  readString(payload.question) ??
  readString(payload.prompt) ??
  readString(payload.user_prompt) ??
  readString(payload.input_text) ??
  readString(readRecord(payload.canonical_goal_frame)?.user_goal_summary);

const synthesizeTheoryContextReflectionTerminalText = (input: {
  prompt: string | null;
  evaluationSummary: string | null;
  receiptText: string | null;
}): string => {
  const prompt = input.prompt ?? "";
  const summary = input.evaluationSummary ?? input.receiptText ?? "The theory reflection located relevant graph context.";
  const asksForMainComponents =
    /\b(?:main|major|core|key)\s+(?:components?|parts?|pieces?|elements?)\b/i.test(prompt) ||
    /\bwhat\s+are\s+(?:its|the)\s+(?:components?|parts?|pieces?|elements?)\b/i.test(prompt);
  const mentionsNeedleHull =
    /\b(?:Needle\s+Hull\s+Mark\s*2|NHM2)\b/i.test(prompt) ||
    /\b(?:Needle\s+Hull\s+Mark\s*2|NHM2)\b/i.test(summary);
  if (asksForMainComponents && mentionsNeedleHull) {
    return [
      "The Theory Badge Graph reflection supports reading Needle Hull Mark 2 as a multi-part solve frame, not as one finished proof.",
      "Main components:",
      "- Hull geometry and boundary setup: the shape, scale, and coordinate assumptions that define the target being discussed.",
      "- Casimir cavity/source coupling: the negative-energy/source-side model that must be connected to the hull by evidence, not asserted from the badge route alone.",
      "- Stability and closure checks: the diagnostics that separate a proxy-constrained explanation from a stronger solve claim.",
      "- Scalar or runtime cuts: numerical subchecks that should be sent to calculator/runtime tools before supporting quantitative claims.",
      "- Terminal solver policy: the answer-authority layer that decides which observations can support a final claim and which remain context evidence.",
      `Reflection support: ${summary}`,
      "Boundary: this is graph-grounded explanation. Stronger physical or numeric conclusions still need the relevant calculator, tensor, or runtime receipts.",
    ].join("\n");
  }
  return [
    "Theory context reflection answer:",
    summary,
    "Interpretation: use this reflection as graph/context evidence. It can explain where a concept sits and what follow-up routes are relevant, but any scalar, tensor, runtime, or claim-bearing conclusion still needs the matching tool receipt before it can support a stronger answer.",
  ].join("\n");
};

const findGoalSatisfyingTheoryContextReflectionArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "theory_context_reflection_answer"; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.canonical_goal_frame);
  if (
    readString(goal?.goal_kind) !== "theory_context_reflection" &&
    readString(goal?.required_terminal_kind) !== "theory_context_reflection_answer"
  ) {
    return null;
  }
  if (
    readRecord(payload.final_answer_draft) ||
    artifacts.some((artifact) => artifactKind(artifact) === "final_answer_draft")
  ) {
    return null;
  }
  if (!routeContractAllowsTerminalKind(payload, "theory_context_reflection_answer")) return null;
  const existingCandidates = [
    readRecord(payload.theory_context_reflection_answer),
    ...artifacts
      .filter((artifact) => artifactKind(artifact) === "theory_context_reflection_answer")
      .map(artifactPayload),
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry));
  for (const candidate of existingCandidates) {
    const text = readString(candidate.answer_text) ?? readString(candidate.text);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    const ref = readString(candidate.artifact_id) ?? `${readString(payload.turn_id) ?? "turn"}:theory_context_reflection_answer`;
    return {
      artifact: {
        artifact_id: ref,
        kind: "theory_context_reflection_answer",
        payload: candidate,
      },
      kind: "theory_context_reflection_answer",
      text,
      ref,
    };
  }
  const receipt = [...artifacts].reverse().find((artifact) =>
    artifactKind(artifact) === "helix_theory_context_reflection_tool_receipt"
  );
  const evaluation = [...artifacts].reverse().find((artifact) =>
    artifactKind(artifact) === "workstation_tool_evaluation" &&
    /theory_context_reflection|reflect_theory_context|supports_subgoal/i.test(JSON.stringify(artifactPayload(artifact) ?? {}))
  );
  if (!receipt || !evaluation) return null;
  const receiptRef = artifactId(receipt);
  const evaluationRef = artifactId(evaluation) ?? readString(artifactPayload(evaluation)?.evaluation_id);
  const supportRefs = uniqueStrings([receiptRef, evaluationRef]);
  if (supportRefs.length < 2) return null;
  const text = synthesizeTheoryContextReflectionTerminalText({
    prompt: theoryContextPromptText(payload),
    evaluationSummary: workstationToolEvaluationText(evaluation),
    receiptText: artifactText(receipt),
  });
  if (!text || isStaleWorkspaceFailureText(text)) return null;
  const ref = `${readString(payload.turn_id) ?? "turn"}:theory_context_reflection_answer:from_reflection_observation`;
  const terminalPayload = {
    schema: "helix.theory_context_reflection_answer.v1",
    artifact_id: ref,
    turn_id: readString(payload.turn_id),
    text,
    answer_text: text,
    support_refs: supportRefs,
    support_refs_count: supportRefs.length,
    subgoal_observation_refs: supportRefs,
    subgoal_observation_refs_count: supportRefs.length,
    source_families: ["theory_locator"],
    model_authored: false,
    synthesis_mode: "deterministic_theory_reflection_materializer",
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.theory_context_reflection_answer = terminalPayload;
  return {
    artifact: {
      artifact_id: ref,
      kind: "theory_context_reflection_answer",
      payload: terminalPayload,
    },
    kind: "theory_context_reflection_answer",
    text,
    ref,
  };
};

const readWorkstationToolPlanForTerminalSynthesis = (
  payload: Record<string, unknown>,
): HelixWorkstationToolPlan | null => {
  const plannerContract = readRecord(payload.planner_contract);
  const debug = readRecord(payload.debug);
  const candidates = [
    payload.active_workstation_tool_plan,
    payload.workstation_tool_plan,
    plannerContract?.workstation_tool_plan,
    debug?.active_workstation_tool_plan,
    debug?.workstation_tool_plan,
  ];
  for (const candidate of candidates) {
    const record = readRecord(candidate);
    if (!record) continue;
    if (Array.isArray(record.steps) && readString(record.intent)) {
      return record as unknown as HelixWorkstationToolPlan;
    }
  }
  return null;
};

const isCalculatorWorkstationPlan = (plan: HelixWorkstationToolPlan | null): boolean =>
  Boolean(plan && /calculator_(?:verify|solve|live_source)/i.test(plan.intent));

const readPromptForWorkstationTerminalSynthesis = (
  payload: Record<string, unknown>,
  plan: HelixWorkstationToolPlan,
): string | null =>
  readString(payload.active_prompt) ??
  readString(payload.question) ??
  readString(payload.prompt) ??
  readString(payload.user_prompt) ??
  readString(payload.input_text) ??
  readString(plan.goal);

const synthesizeWorkstationToolEvaluationTerminalText = (input: {
  turnId: string;
  payload: Record<string, unknown>;
  terminal: { artifact: ArtifactLike; text: string; ref: string | null };
}): {
  text: string;
  audit: Record<string, unknown> | null;
} => {
  const plan = readWorkstationToolPlanForTerminalSynthesis(input.payload);
  if (!isCalculatorWorkstationPlan(plan)) return { text: input.terminal.text, audit: null };
  const prompt = readPromptForWorkstationTerminalSynthesis(input.payload, plan!);
  if (!prompt) return { text: input.terminal.text, audit: null };
  const evaluationPayload = {
    ...(readRecord(input.payload.workstation_tool_evaluation) ?? {}),
    ...(artifactPayload(input.terminal.artifact) ?? {}),
    terminal_text: input.terminal.text,
    text_preview: input.terminal.text,
  };
  const synthesizedText = synthesizeWorkstationToolAnswer({
    prompt,
    plan: plan!,
    evaluation: evaluationPayload as unknown as HelixWorkstationToolEvaluation,
  }).trim();
  const synthesisMissingObservedResult =
    /available in (?:the )?(?:scientific )?calculator receipt\/trace|available in the calculator receipt/i.test(synthesizedText) &&
    /\b(?:result|produced|with result|=)\s*[-+]?(?:\d|\.\d)/i.test(input.terminal.text);
  if (!synthesizedText || isStaleWorkspaceFailureText(synthesizedText) || synthesisMissingObservedResult) {
    return {
      text: input.terminal.text,
      audit: {
        schema: "helix.workstation_tool_terminal_synthesis.v1",
        turn_id: input.turnId,
        applied: false,
        reason: synthesisMissingObservedResult ? "synthesis_did_not_consume_observed_result" : "synthesis_unavailable",
        terminal_artifact_kind: "workstation_tool_evaluation",
        terminal_artifact_ref: input.terminal.ref,
        plan_id: readString(plan?.plan_id),
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }
  if (synthesizedText === input.terminal.text) return { text: input.terminal.text, audit: null };
  return {
    text: synthesizedText,
    audit: {
      schema: "helix.workstation_tool_terminal_synthesis.v1",
      turn_id: input.turnId,
      applied: true,
      source: "workstation_answer_synthesizer",
      terminal_artifact_kind: "workstation_tool_evaluation",
      terminal_artifact_ref: input.terminal.ref,
      plan_id: readString(plan?.plan_id),
      evaluation_ref: input.terminal.ref,
      original_text_preview: input.terminal.text.slice(0, 240),
      synthesized_text_preview: synthesizedText.slice(0, 240),
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const findGoalSatisfyingWorkstationToolEvaluationArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "workstation_tool_evaluation"; text: string; ref: string | null } | null => {
  if (isContextualToolReferenceSuppressed(payload)) {
    return null;
  }
  if (
    !routeMetadataIndicatesCalculator(payload) &&
    readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) !== "workstation_tool_evaluation"
  ) {
    return null;
  }
  if (
    !routeContractAllowsTerminalKind(payload, "workstation_tool_evaluation") &&
    !goalContractAllowsWorkstationToolEvaluation(payload)
  ) {
    return null;
  }
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact) continue;
    const kind = artifactKind(artifact);
    const schema = artifactSchema(artifact);
    if (kind !== "workstation_tool_evaluation" && schema !== "helix.workstation_tool_evaluation.v1") continue;
    const payloadRecord = artifactPayload(artifact);
    if (payloadRecord?.ok === false) continue;
    const supportsGoal = readString(payloadRecord?.supports_goal);
    if (supportsGoal && supportsGoal !== "true" && supportsGoal !== "partial") continue;
    const text = workstationToolEvaluationText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return {
      artifact,
      kind: "workstation_tool_evaluation",
      text,
      ref: artifactId(artifact) ?? readString(payloadRecord?.evaluation_id),
    };
  }
  const evaluation = readRecord(payload.workstation_tool_evaluation);
  if (!evaluation || evaluation.ok === false) return null;
  const supportsGoal = readString(evaluation.supports_goal);
  if (supportsGoal && supportsGoal !== "true" && supportsGoal !== "partial") return null;
  const text =
    readString(evaluation.answer_text) ??
    readString(evaluation.text) ??
    readString(evaluation.summary);
  if (!text || isStaleWorkspaceFailureText(text)) return null;
  return {
    artifact: {
      artifact_id: readString(evaluation.evaluation_id) ?? undefined,
      kind: "workstation_tool_evaluation",
      payload: evaluation,
    },
    kind: "workstation_tool_evaluation",
    text,
    ref: readString(evaluation.evaluation_id),
  };
};

const calculatorCompoundSupportedDraftText = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): string | null => {
  const route = readString(payload.route_reason_code) ?? readString(payload.route);
  if (route !== "calculator_solve / calculator_compound_chain") return null;
  if (readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) !== "workstation_tool_evaluation") {
    return null;
  }
  const coverage =
    readRecord(payload.calculator_plan_coverage) ??
    artifacts
      .map(artifactPayload)
      .find((entry) => readString(entry?.schema) === "helix.calculator_plan_coverage.v1" || readString(entry?.kind) === "calculator_plan_coverage") ??
    null;
  if (readString(coverage?.coverage) !== "complete") return null;
  const promptCoverage = readRecord(payload.prompt_requirement_coverage);
  if (promptCoverage && readString(promptCoverage.coverage) && readString(promptCoverage.coverage) !== "complete") {
    return null;
  }
  const receipts =
    readArray(payload.calculator_subgoal_receipts).length > 0 ||
    artifacts.some((artifact) => artifactKind(artifact) === "calculator_subgoal_receipt" || artifactKind(artifact) === "calculator_receipt");
  if (!receipts) return null;
  const draft =
    readRecord(payload.calculator_final_answer_draft) ??
    readRecord(payload.final_answer_draft) ??
    artifacts
      .map(artifactPayload)
      .find((entry) => readString(entry?.schema) === "helix.final_answer_draft.v1") ??
    null;
  const text =
    readString(draft?.text) ??
    readString(draft?.answer_text) ??
    readString(payload.selected_final_answer) ??
    readString(payload.answer);
  if (!text || isStaleWorkspaceFailureText(text) || isStaleModelOnlyNoObservationText(text)) return null;
  return text;
};

const quarantineStaleRequestUserInput = (payload: Record<string, unknown>): void => {
  const staleRequest =
    readRecord(payload.request_user_input) ??
    readRecord(payload.pending_server_request) ??
    readRecord(payload.pending_request);
  if (staleRequest && !readRecord(payload.stale_pending_server_request)) {
    payload.stale_pending_server_request = staleRequest;
  }
  delete payload.request_user_input;
  delete payload.pending_server_request;
  delete payload.pending_request;
};

const findSelectedDraftAfterRequiredObservation = (
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; latestObservationSequence: number } | null => {
  const latestObservationSequence = artifacts.reduce((latest, artifact, index) =>
    isAcceptedObservationPacket(artifact) ? index : latest, -1);
  if (latestObservationSequence < 0) return null;

  for (let index = artifacts.length - 1; index > latestObservationSequence; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isFinalAnswerDraft(artifact)) continue;
    if (isDeterministicReceiptFallbackDraft(artifact)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, sequence: index, latestObservationSequence };
  }
  return null;
};

const findDeterministicReceiptFallbackDraftAfterRequiredObservation = (
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; latestObservationSequence: number } | null => {
  const latestObservationSequence = artifacts.reduce((latest, artifact, index) =>
    isAcceptedObservationPacket(artifact) ? index : latest, -1);
  if (latestObservationSequence < 0) return null;

  for (let index = artifacts.length - 1; index > latestObservationSequence; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isDeterministicReceiptFallbackDraft(artifact)) continue;
    return { artifact, sequence: index, latestObservationSequence };
  }
  return null;
};

export function recordLegacyTerminalCandidate(input: {
  turn_id: string;
  source:
    | "legacy_workspace_failure"
    | "legacy_panel_open_receipt"
    | "legacy_note_receipt"
    | "legacy_doc_receipt"
    | "legacy_calculator_receipt"
    | "legacy_situation_room_receipt"
    | "legacy_voice_receipt"
    | "legacy_fallback";
  text: string;
  reason: string;
}): HelixTerminalCandidate {
  return {
    schema: "helix.terminal_candidate.v1",
    candidate_id: `${input.turn_id}:legacy_terminal_candidate:${textHash([
      input.source,
      input.reason,
      input.text,
    ].join("|"))}`,
    turn_id: input.turn_id,
    artifact_kind: input.source,
    text: input.text,
    terminal_eligible: false,
    assistant_answer: false,
    source: input.source === "legacy_workspace_failure" ? "legacy_workspace_failure" : "legacy_fallback",
    created_at_stage: "legacy_branch",
    failure_code: input.reason,
    freshness: {},
  };
}

export function applyHelixTerminalAuthoritySingleWriter(
  input: SingleWriterInput,
): HelixTerminalAuthoritySingleWriterResult {
  const artifacts = input.artifactLedger ?? (
    Array.isArray(input.payload.current_turn_artifact_ledger)
      ? (input.payload.current_turn_artifact_ledger as ArtifactLike[])
      : []
  );
  const priorPayloadFields = {
    text: readString(input.payload.text),
    answer: readString(input.payload.answer),
    assistant_answer: readString(input.payload.assistant_answer),
    selected_final_answer: readString(input.payload.selected_final_answer),
  };
  const priorTerminalPresentation = readRecord(input.payload.terminal_presentation);
  const forbiddenPreAuthorityVisibleFields = [
    priorPayloadFields.text ? "payload.text" : null,
    priorPayloadFields.answer ? "payload.answer" : null,
    priorPayloadFields.assistant_answer ? "payload.assistant_answer" : null,
    priorPayloadFields.selected_final_answer ? "payload.selected_final_answer" : null,
    readString(priorTerminalPresentation?.concise_text) ? "terminal_presentation.concise_text" : null,
  ].filter((entry): entry is typeof VISIBLE_ANSWER_FIELDS[number] => Boolean(entry));

  const rejectedCandidates: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"] = [];
  const rawSolverContinuationPending =
    readRecord(input.payload.solver_continuation_observation)?.schema === "helix.solver_continuation_observation.v1" &&
    readString(readRecord(input.payload.solver_continuation_observation)?.required_next_step) !== "typed_failure";
  const compoundCoverageGate = readRecord(input.payload.compound_prompt_coverage_gate);
  const compoundCoverageFailedClosed =
    readString(compoundCoverageGate?.decision) === "FAIL_CLOSED";
  const rawMissingItineraryFamilies = attachItineraryExecutionState(input.payload, artifacts);
  const preDraftCompoundSynthesisReadiness = resolveCompoundCapabilitySynthesisReadiness({
    payload: input.payload,
    artifacts,
  });
  if (preDraftCompoundSynthesisReadiness.applies) {
    input.payload.compound_capability_synthesis_readiness = preDraftCompoundSynthesisReadiness;
    const debug = readRecord(input.payload.debug);
    if (debug) {
      debug.compound_capability_synthesis_readiness = preDraftCompoundSynthesisReadiness;
    }
  }
  const ledgerBackedCompoundDraft = compoundCoverageFailedClosed
    ? null
    : ensureLedgerBackedCompoundFinalAnswerDraft({
        turnId: input.turnId,
        payload: input.payload,
        artifacts,
        readiness: preDraftCompoundSynthesisReadiness as unknown as Record<string, unknown>,
      });
  if (ledgerBackedCompoundDraft) {
    input.payload.ledger_backed_compound_final_answer_draft_applied = true;
  }
  const compoundPreferredDraftCandidate = compoundCoverageFailedClosed
    ? null
    : findCompoundSupportedFinalAnswerDraftCandidate(input.payload, artifacts);
  const draftMaterialization = compoundCoverageFailedClosed
    ? null
    : materializeFinalAnswerDraftTerminal({
        turnId: input.turnId,
        payload: input.payload,
        artifactLedger: artifacts,
        routeProductContract: readRecord(input.payload.route_product_contract),
        finalAnswerDraftRef: compoundPreferredDraftCandidate?.ref ?? undefined,
      });
  const compoundSynthesisReadiness = resolveCompoundCapabilitySynthesisReadiness({
    payload: input.payload,
    artifacts,
  });
  if (compoundSynthesisReadiness.applies) {
    input.payload.compound_capability_synthesis_readiness = compoundSynthesisReadiness;
    const debug = readRecord(input.payload.debug);
    if (debug) {
      debug.compound_capability_synthesis_readiness = compoundSynthesisReadiness;
    }
  }
  const missingItineraryFamilies =
    compoundSynthesisReadiness.applies === true && compoundSynthesisReadiness.complete === true
      ? []
      : rawMissingItineraryFamilies;
  const firstIncompleteCompoundSubgoalRailFailure = compoundCoverageFailedClosed
    ? readFirstIncompleteCompoundSubgoalRailFailure(input.payload)
    : null;
  const itineraryObservationCriteriaSatisfied = missingItineraryFamilies.length === 0;
  const acceptedObservationArtifacts = artifacts.filter(isAcceptedObservationPacket);
  const hasAcceptedObservation = acceptedObservationArtifacts.length > 0;
  const compoundTerminalSynthesisActive = compoundTerminalSynthesisPolicyActive(input.payload);
  const materializedDraftCandidate =
    findFinalAnswerDraftCandidateByRef(artifacts, draftMaterialization?.final_answer_draft_ref) ??
    compoundPreferredDraftCandidate;
  const latestDraftCandidateForStaleCheck =
    materializedDraftCandidate ?? findLatestFinalAnswerDraftCandidate(artifacts);
  const materializedDraftRejectedForStaleObservation =
    draftMaterialization?.ok === true &&
    hasAcceptedObservation &&
    isStaleModelOnlyNoObservationText(latestDraftCandidateForStaleCheck?.text);
  const compoundSubgoalDraftSupportCoverage = resolveCompoundSubgoalDraftSupportCoverage({
    payload: input.payload,
    draft: latestDraftCandidateForStaleCheck?.artifact,
    artifactLedger: artifacts,
    finalAnswerDraftRef: draftMaterialization?.final_answer_draft_ref ?? latestDraftCandidateForStaleCheck?.ref ?? null,
  });
  const compoundSubgoalDraftSupportMissing =
    draftMaterialization?.ok === true &&
    compoundSubgoalDraftSupportCoverage.applies &&
    !compoundSubgoalDraftSupportCoverage.ok;
  if (compoundSubgoalDraftSupportCoverage.applies) {
    input.payload.compound_subgoal_draft_support_coverage = compoundSubgoalDraftSupportCoverage;
    const debug = readRecord(input.payload.debug);
    if (debug) {
      debug.compound_subgoal_draft_support_coverage = compoundSubgoalDraftSupportCoverage;
    }
  }
  const canonicalGoal = readRecord(input.payload.canonical_goal_frame);
  const docsDraftMaterializationMatchesRequiredGoal =
    draftMaterialization?.ok === true &&
    !materializedDraftRejectedForStaleObservation &&
    draftMaterialization.materialized_terminal_artifact_kind === "doc_evidence_synthesis_answer" &&
    readString(canonicalGoal?.goal_kind) === "doc_evidence_synthesis" &&
    readString(canonicalGoal?.required_terminal_kind) === "doc_evidence_synthesis_answer";
  const repoAnswerQualityGate = readRecord(input.payload.repo_answer_text_quality_gate);
  const repoEvidenceRelevanceGate = readRecord(input.payload.repo_evidence_relevance_gate);
  const repoDraftMaterializationMatchesRequiredGoal =
    draftMaterialization?.ok === true &&
    !materializedDraftRejectedForStaleObservation &&
    draftMaterialization.materialized_terminal_artifact_kind === "repo_code_evidence_answer" &&
    (
      readString(canonicalGoal?.goal_kind) === "repo_entity_definition" ||
      readString(canonicalGoal?.goal_kind) === "repo_code_evidence_question"
    ) &&
    readString(canonicalGoal?.required_terminal_kind) === "repo_code_evidence_answer" &&
    repoAnswerQualityGate?.ok !== false &&
    repoEvidenceRelevanceGate?.terminal_allowed !== false;
  const usableDraftMaterialization =
    draftMaterialization?.ok === true &&
    !materializedDraftRejectedForStaleObservation &&
    !compoundSubgoalDraftSupportMissing &&
    (
      itineraryObservationCriteriaSatisfied ||
      docsDraftMaterializationMatchesRequiredGoal ||
      repoDraftMaterializationMatchesRequiredGoal
    );
  const draftMaterializationBlockedReason = materializedDraftRejectedForStaleObservation
    ? "composer_claimed_no_observations_but_receipts_exist"
    : compoundSubgoalDraftSupportMissing
      ? "compound_subgoal_support_refs_missing"
      : draftMaterialization?.blocked_reason
        ? draftMaterialization.blocked_reason
      : !itineraryObservationCriteriaSatisfied && !repoDraftMaterializationMatchesRequiredGoal
        ? "capability_itinerary_observations_missing"
        : null;
  if (draftMaterialization) {
    input.payload.final_answer_draft_selection = {
      candidate_count: artifacts.filter(isFinalAnswerDraft).length,
      latest_final_answer_draft_ref: draftMaterialization.final_answer_draft_ref,
      latest_final_answer_draft_sequence: findLatestFinalAnswerDraftCandidate(artifacts)?.sequence ?? null,
      selected_final_answer_draft_ref: materializedDraftCandidate?.ref ?? draftMaterialization.final_answer_draft_ref,
      selected_final_answer_draft_sequence: materializedDraftCandidate?.sequence ?? null,
      latest_final_answer_draft_quality_ok: draftMaterialization.final_answer_draft_quality_gate.ok,
      latest_final_answer_draft_quality_violations: draftMaterialization.final_answer_draft_quality_gate.violations,
      materialized_terminal_artifact_kind: draftMaterialization.materialized_terminal_artifact_kind ?? null,
      materialized_terminal_artifact_ref: draftMaterialization.materialized_terminal_artifact_ref ?? null,
      selected_over_direct_answer_text: usableDraftMaterialization && latestDirectAnswerSequence(artifacts) >= 0,
      rejected_direct_answer_text_reason:
        usableDraftMaterialization && latestDirectAnswerSequence(artifacts) >= 0
          ? "later_valid_final_answer_draft"
          : null,
      blocked_reason: draftMaterializationBlockedReason,
      compound_subgoal_support_coverage: compoundSubgoalDraftSupportCoverage.applies
        ? compoundSubgoalDraftSupportCoverage
        : null,
    };
    input.payload.route_terminal_materialization = {
      route_family: draftMaterialization.final_answer_draft_quality_gate.route_family,
      source_target: readString(readRecord(input.payload.route_product_contract)?.source_target),
      required_terminal_kind: readString(readRecord(input.payload.canonical_goal_frame)?.required_terminal_kind),
      allowed_terminal_artifact_kinds: draftMaterialization.route_allowed_terminal_artifact_kinds,
      materialization_attempted: true,
      materialization_ok: usableDraftMaterialization,
      materialization_blocked_reason: draftMaterializationBlockedReason,
      capability_itinerary_observation_missing_families: missingItineraryFamilies,
      raw_capability_itinerary_observation_missing_families: rawMissingItineraryFamilies,
      compound_synthesis_readiness_complete: compoundSynthesisReadiness.complete,
      compound_synthesis_readiness_required_terminal_kind: compoundSynthesisReadiness.required_terminal_kind ?? null,
      compound_subgoal_support_refs_missing: compoundSubgoalDraftSupportMissing,
      compound_subgoal_missing_support_refs: compoundSubgoalDraftSupportCoverage.missing_observation_refs,
      stale_model_only_blocked_reason: materializedDraftRejectedForStaleObservation
        ? "composer_claimed_no_observations_but_receipts_exist"
        : null,
    };
  }
  if (materializedDraftRejectedForStaleObservation) {
    rejectedCandidates.push({
      ref: latestDraftCandidateForStaleCheck?.ref ?? undefined,
      kind: draftMaterialization?.materialized_terminal_artifact_kind ?? "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "composer_claimed_no_observations_but_receipts_exist",
    });
  }
  const goalEvaluation = readRecord(input.payload.goal_satisfaction_evaluation);
  const goalAllowsTerminal =
    readString(goalEvaluation?.satisfaction) === "satisfied" ||
    readString(goalEvaluation?.next_decision) === "allow_terminal";
  const compoundMaterializedDraftCanSatisfyTerminal =
    usableDraftMaterialization &&
    compoundTerminalSynthesisActive &&
    itineraryObservationCriteriaSatisfied &&
    (
      !compoundSubgoalDraftSupportCoverage.applies ||
      compoundSubgoalDraftSupportCoverage.ok
    );
  const compoundSynthesisTerminalReady =
    compoundMaterializedDraftCanSatisfyTerminal &&
    draftMaterialization?.ok === true;
  const selectedDirectAnswerTerminal =
    goalAllowsTerminal
      ? findLatestDirectAnswerTerminal(input.payload, artifacts)
      : null;
  const repoTerminalMaterialized =
    usableDraftMaterialization &&
    draftMaterialization.materialized_terminal_artifact_kind === "repo_code_evidence_answer";
  const repoEvidenceAnswerCandidate = readRecord(input.payload.repo_code_evidence_answer);
  const repoAnswerText =
    readString(repoEvidenceAnswerCandidate?.answer_text) ??
    readString(repoEvidenceAnswerCandidate?.text);
  const scholarlyTerminalMaterialized =
    usableDraftMaterialization &&
    draftMaterialization.materialized_terminal_artifact_kind === "scholarly_research_answer";
  const existingDocEvidenceTerminal = existingDocEvidenceSynthesisTerminal(input.payload);
  const docsTerminalMaterialized =
    Boolean(existingDocEvidenceTerminal) ||
    (
      usableDraftMaterialization &&
      draftMaterialization.materialized_terminal_artifact_kind === "doc_evidence_synthesis_answer"
    );
  const docsTerminalMatchesRequiredGoal =
    docsTerminalMaterialized &&
    (docsDraftMaterializationMatchesRequiredGoal || Boolean(existingDocEvidenceTerminal));
  const latestDraftForContinuation = findLatestFinalAnswerDraftCandidate(artifacts);
  const stagePlayTerminalMaterialized =
    usableDraftMaterialization &&
    isStagePlayPostObservationSynthesisText(latestDraftForContinuation?.text);
  const selectedWorkstationToolEvaluation = findGoalSatisfyingWorkstationToolEvaluationArtifact(input.payload, artifacts);
  const workstationTerminalMaterialized =
    Boolean(selectedWorkstationToolEvaluation) && goalAllowsTerminal;
  const rawSelectedReceiptTerminal = findGoalSatisfyingReceiptTerminalArtifact(input.payload, artifacts);
  const compoundReceiptTerminalBlocked =
    Boolean(rawSelectedReceiptTerminal) &&
    multiSubgoalCompoundTerminalSynthesisActive(input.payload);
  const selectedReceiptTerminal = compoundReceiptTerminalBlocked ? null : rawSelectedReceiptTerminal;
  const capabilityPlan = readRecord(input.payload.capability_plan);
  const capabilityLifecycleLedger = readRecord(input.payload.capability_lifecycle_ledger);
  const capabilityFailureCodes = readArray(capabilityLifecycleLedger?.failure_codes)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const blockingMutatingCapabilityFailure =
    capabilityPlan?.mutating === true &&
    capabilityLifecycleLedger?.ok === false &&
    (
      capabilityFailureCodes.includes("mutating_capability_without_operator_command") ||
      capabilityFailureCodes.includes("capability_dispatched_without_admission") ||
      capabilityFailureCodes.includes("capability_admitted_not_dispatched") ||
      capabilityFailureCodes.includes("capability_result_missing")
    );
  const blockingMutatingCapabilityFailureCode = capabilityFailureCodes.includes("mutating_capability_without_operator_command")
    ? "mutating_capability_requires_operator_command"
    : capabilityFailureCodes.includes("capability_dispatched_without_admission")
      ? "capability_dispatched_without_admission"
      : capabilityFailureCodes.includes("capability_admitted_not_dispatched")
        ? "capability_admitted_not_dispatched"
        : capabilityFailureCodes.includes("capability_result_missing")
          ? "capability_result_missing"
          : "capability_lifecycle_failed";
  const blockingMutatingCapabilityFailureText = blockingMutatingCapabilityFailure
    ? blockingMutatingCapabilityFailureCode === "mutating_capability_requires_operator_command"
      ? `I could not run ${readString(capabilityPlan?.selected_capability) || readString(capabilityPlan?.requested_action) || "the requested mutating capability"} because this turn did not include an admitted operator command.`
      : `I could not complete this turn because ${readString(capabilityPlan?.selected_capability) || readString(capabilityPlan?.requested_action) || "the requested mutating capability"} did not complete its admitted tool lifecycle.`
    : null;
  const selectedGoalArtifact =
    findGoalSatisfyingCapabilityHelpArtifact(input.payload, artifacts) ??
    findGoalSatisfyingTheoryContextReflectionArtifact(input.payload, artifacts) ??
    findGoalSatisfyingWorkspaceDirectoryResolutionArtifact(input.payload, artifacts) ??
    findGoalSatisfyingDocumentArtifact(input.payload, artifacts) ??
    findGoalSatisfyingVisualSituationArtifact(input.payload, artifacts);
  const goalArtifactTerminalMaterialized =
    Boolean(selectedGoalArtifact) && goalAllowsTerminal;
  const pendingRequestCandidate =
    readRecord(input.payload.request_user_input) ??
    readRecord(input.payload.pending_server_request) ??
    readRecord(input.payload.pending_request);
  const noteUpdateReceiptSatisfied = readArray(input.payload.step_results)
    .map(readRecord)
    .filter((step): step is Record<string, unknown> => Boolean(step))
    .some((step) => {
      if (readArray(step.actual_artifacts).map(readString).includes("note_update_receipt")) return true;
      return readString(readRecord(step.result_artifact)?.kind) === "note_update_receipt";
    });
  const noteMutationTerminalMaterialized =
    noteUpdateReceiptSatisfied &&
    goalAllowsTerminal &&
    readString(readRecord(input.payload.canonical_goal_frame)?.goal_kind) === "note_mutation";
  const pendingControlPlaneTerminal =
    Boolean(pendingRequestCandidate) &&
    !noteUpdateReceiptSatisfied &&
    (
      readString(input.payload.response_type) === "pending_input" ||
      readString(input.payload.final_status) === "pending_input" ||
      readString(input.payload.terminal_artifact_kind) === "request_user_input" ||
      readString(input.payload.terminal_artifact_kind) === "pending_server_request" ||
      readString(input.payload.final_answer_source) === "request_user_input" ||
      readString(input.payload.final_answer_source) === "pending_server_request" ||
      /clarify:missing_args|request_user_input|pending_server_request/i.test(readString(input.payload.route_reason_code) ?? "")
    );
  const earlyDeterministicReceiptFallbackDraft = findDeterministicReceiptFallbackDraftAfterRequiredObservation(artifacts);
  const stagePlayReflectionObservationObserved =
    hasStagePlayReflectionObservation(artifacts) ||
    runtimeLoopExecutedStagePlayReflection(input.payload);
  const earlyDeterministicReceiptFallbackCanSurface =
    Boolean(earlyDeterministicReceiptFallbackDraft) &&
    (
      stagePlayReflectionObservationObserved ||
      isStagePlayPostObservationSynthesisText(artifactText(earlyDeterministicReceiptFallbackDraft!.artifact)) ||
      readString(canonicalGoal?.goal_kind) === "live_environment_review" ||
      readString(capabilityPlan?.requested_action) === "live_env.reflect_stage_play_context" ||
      (
        !compoundTerminalSynthesisActive &&
        routeContractAllowedTerminalKinds(input.payload).includes("tool_receipt")
      )
    );
  const solverContinuationPending =
    rawSolverContinuationPending &&
    !(
      (repoTerminalMaterialized && goalAllowsTerminal) ||
      (docsTerminalMaterialized && goalAllowsTerminal) ||
      docsTerminalMatchesRequiredGoal ||
      (scholarlyTerminalMaterialized && goalAllowsTerminal) ||
      (stagePlayTerminalMaterialized && goalAllowsTerminal) ||
      compoundMaterializedDraftCanSatisfyTerminal ||
      workstationTerminalMaterialized ||
      goalArtifactTerminalMaterialized ||
      Boolean(selectedReceiptTerminal && goalAllowsTerminal) ||
      earlyDeterministicReceiptFallbackCanSurface ||
      noteMutationTerminalMaterialized
    );
  if (solverContinuationPending) {
    const pendingText =
      "I could not complete this turn yet because solver continuation is required before terminal answer selection.";
    rejectedCandidates.push({
      kind: readString(input.payload.terminal_artifact_kind) ?? "direct_answer_text",
      reason: "solver_continuation_pending",
    });
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = "solver_continuation_pending";
    input.payload.selected_final_answer = pendingText;
    input.payload.answer = pendingText;
    input.payload.text = pendingText;
    input.payload.assistant_answer = pendingText;
  } else if (rawSolverContinuationPending && repoTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_repo_terminal",
    });
  } else if (rawSolverContinuationPending && docsTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_docs_terminal",
    });
  } else if (rawSolverContinuationPending && docsTerminalMatchesRequiredGoal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_required_docs_terminal",
    });
  } else if (rawSolverContinuationPending && scholarlyTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_scholarly_terminal",
    });
  } else if (rawSolverContinuationPending && stagePlayTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_stage_play_terminal",
    });
  } else if (rawSolverContinuationPending && workstationTerminalMaterialized) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_workstation_terminal",
    });
  } else if (rawSolverContinuationPending && goalArtifactTerminalMaterialized) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_goal_terminal",
    });
  } else if (rawSolverContinuationPending && selectedReceiptTerminal && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_required_receipt_terminal",
    });
  } else if (rawSolverContinuationPending && earlyDeterministicReceiptFallbackCanSurface) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_deterministic_receipt_status",
    });
  } else if (rawSolverContinuationPending && noteMutationTerminalMaterialized) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_note_update_receipt",
    });
  }
  const selectedDraftCandidate = compoundCoverageFailedClosed ? null : findSelectedDraftAfterRequiredObservation(artifacts);
  const selectedDraftRejectedForStaleObservation =
    Boolean(selectedDraftCandidate && hasAcceptedObservation && isStaleModelOnlyNoObservationText(artifactText(selectedDraftCandidate.artifact)));
  if (selectedDraftCandidate && !itineraryObservationCriteriaSatisfied && !repoDraftMaterializationMatchesRequiredGoal) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraftCandidate.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "missing_required_observation",
    });
  } else if (selectedDraftCandidate && compoundSubgoalDraftSupportMissing) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraftCandidate.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "missing_required_observation",
    });
  } else if (selectedDraftCandidate && selectedDraftRejectedForStaleObservation && !materializedDraftRejectedForStaleObservation) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraftCandidate.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "composer_claimed_no_observations_but_receipts_exist",
    });
  }
  const selectedDraft =
    selectedDraftRejectedForStaleObservation ||
    compoundSubgoalDraftSupportMissing ||
    (!itineraryObservationCriteriaSatisfied && !repoDraftMaterializationMatchesRequiredGoal) ||
    (
      selectedDraftCandidate &&
      isDeterministicReceiptFallbackDraft(selectedDraftCandidate.artifact)
    )
      ? null
      : selectedDraftCandidate;
  const noteMutationDraftCandidate =
    noteUpdateReceiptSatisfied
      ? selectedDraft ?? findLatestFinalAnswerDraftCandidate(artifacts)
      : null;
  const noteMutationFinalDraftCanSurface =
    Boolean(
      noteMutationDraftCandidate &&
      !isStaleWorkspaceFailureText(noteMutationDraftCandidate.text) &&
      !isStaleModelOnlyNoObservationText(noteMutationDraftCandidate.text),
    );
  const deterministicReceiptFallbackDraft = selectedDraft
    ? null
    : earlyDeterministicReceiptFallbackDraft;
  const selectedLiveEnvironmentBindingDiagnosis = findLiveEnvironmentBindingDiagnosisTerminal(input.payload);
  const latestRequiredObservationSequence = selectedDraft?.latestObservationSequence ??
    artifacts.reduce((latest, artifact, index) => isAcceptedObservationPacket(artifact) ? index : latest, -1);
  const routeAllowsModelSynthesizedAnswer = routeContractAllowsTerminalKind(input.payload, "model_synthesized_answer");
  const deterministicReceiptFallbackCanSurface =
    Boolean(deterministicReceiptFallbackDraft) && earlyDeterministicReceiptFallbackCanSurface;
  const scholarlyAnswerSynthesisMissing =
    routeContractRequiresScholarlyResearchAnswer(input.payload) &&
    hasObservedScholarlyFullText(artifacts);
  const internetSearchAnswerSynthesisMissing =
    routeContractRequiresInternetSearchAnswer(input.payload) &&
    artifacts.some((artifact) => /internet_search_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")));
  const calculatorToolAnswerSupport = evaluateCalculatorToolAnswerSupport({
    turnId: input.turnId,
    payload: {
      ...input.payload,
      current_turn_artifact_ledger: artifacts,
    },
  });
  const calculatorTerminalMissingSupport =
    calculatorToolAnswerSupport.applies &&
    !calculatorToolAnswerSupport.supports_goal &&
    !selectedWorkstationToolEvaluation &&
    routeMetadataIndicatesCalculator(input.payload);
  if (calculatorToolAnswerSupport.applies) {
    input.payload.calculator_tool_answer_support = calculatorToolAnswerSupport;
    const debug = readRecord(input.payload.debug);
    if (debug) debug.calculator_tool_answer_support = calculatorToolAnswerSupport;
  }

  if (
    draftMaterialization?.ok === true &&
    (!itineraryObservationCriteriaSatisfied || compoundSubgoalDraftSupportMissing) &&
    !docsDraftMaterializationMatchesRequiredGoal &&
    !repoDraftMaterializationMatchesRequiredGoal
  ) {
    rejectedCandidates.push({
      ref: draftMaterialization.materialized_terminal_artifact_ref ?? draftMaterialization.final_answer_draft_ref ?? undefined,
      kind: draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "missing_required_observation",
    });
  }
  if (selectedDraft && !routeAllowsModelSynthesizedAnswer && draftMaterialization?.ok !== true && !noteMutationFinalDraftCanSurface) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraft.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "route_contract_forbids_model_synthesized_answer",
    });
  }
  if (deterministicReceiptFallbackDraft && !deterministicReceiptFallbackCanSurface) {
    rejectedCandidates.push({
      ref: artifactId(deterministicReceiptFallbackDraft.artifact) ?? undefined,
      kind: "final_answer_draft",
      source: "final_answer_draft",
      reason: "deterministic_receipt_fallback_nonterminal",
    });
  }
  if (compoundReceiptTerminalBlocked && rawSelectedReceiptTerminal) {
    rejectedCandidates.push({
      ref: rawSelectedReceiptTerminal.ref ?? undefined,
      kind: rawSelectedReceiptTerminal.kind,
      source: rawSelectedReceiptTerminal.kind as HelixTerminalCandidate["source"],
      reason: "receipt_or_projection",
    });
  }

  for (const artifact of artifacts) {
    if (!isForbiddenReceiptOrProjection(artifact)) continue;
    if (
      selectedReceiptTerminal &&
      (
        artifact === selectedReceiptTerminal.artifact ||
        (
          selectedReceiptTerminal.ref &&
          artifactId(artifact) === selectedReceiptTerminal.ref
        )
      )
    ) {
      continue;
    }
    rejectedCandidates.push({
      ref: artifactId(artifact) ?? undefined,
      kind: artifactKind(artifact),
      reason: "receipt_or_projection",
    });
  }

  const legacyCandidates = [...(input.legacyCandidates ?? [])];
  for (const [field, value] of Object.entries(priorPayloadFields)) {
    if (isStaleWorkspaceFailureText(value)) {
      legacyCandidates.push(recordLegacyTerminalCandidate({
        turn_id: input.turnId,
        source: "legacy_workspace_failure",
        text: value ?? "",
        reason: `stale_${field}`,
      }));
    }
    if (hasAcceptedObservation && isStaleModelOnlyNoObservationText(value)) {
      rejectedCandidates.push({
        kind: readString(input.payload.terminal_artifact_kind) ?? "direct_answer_text",
        source: readString(input.payload.final_answer_source) ?? "legacy_fallback",
        reason: "stale_model_only_after_observation",
      });
    }
  }
  for (const candidate of legacyCandidates) {
    rejectedCandidates.push({
      ref: candidate.artifact_ref,
      kind: candidate.artifact_kind,
      source: candidate.source,
      reason: candidate.source === "legacy_workspace_failure"
        ? "stale_failure_candidate"
        : "legacy_direct_writer_quarantined",
    });
  }
  const modelOnlyCompoundCoverage = readRecord(input.payload.model_only_compound_coverage_from_answer);
  const coverageValidModelOnlyAnswerExists =
    modelOnlyCompoundCoverage?.schema === "helix.model_only_compound_coverage_from_answer.v1" &&
    modelOnlyCompoundCoverage?.passed === true &&
    modelOnlyCompoundCoverage?.route_scope === "model_only_allowed";
  if (
    coverageValidModelOnlyAnswerExists &&
    (readString(input.payload.terminal_artifact_kind) === "typed_failure" ||
      readString(input.payload.final_answer_source) === "typed_failure")
  ) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "coverage_valid_model_only_answer_exists",
    });
  }

  let selectedArtifactRef: string | null = null;
  let selectedArtifactKind: HelixTerminalAuthoritySingleWriterResult["selected_terminal_artifact_kind"] = null;
  let selectedSource: HelixTerminalAuthoritySingleWriterResult["source"] = "terminal_authority_repair_failure";
  const rawTerminalBlockingToolRailFailure = readTerminalBlockingToolRailFailure(input.payload);
  const noteMutationDraftSupersedesToolRailFailure =
    Boolean(noteUpdateReceiptSatisfied && latestDraftForContinuation);
  const repoDraftSupersedesToolRailFailure =
    repoDraftMaterializationMatchesRequiredGoal && goalAllowsTerminal;
  const compoundDraftSupersedesToolRailFailure =
    Boolean(
      usableDraftMaterialization &&
      compoundSubgoalDraftSupportCoverage.applies &&
      compoundSubgoalDraftSupportCoverage.ok &&
      compoundMaterializedDraftCanSatisfyTerminal &&
      rawTerminalBlockingToolRailFailure &&
      (
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_materialization" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "visible_projection" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "presenter_boundary"
      ),
    );
  const workstationTerminalSupersedesToolRailFailure = workstationTerminalCanRepairToolRailFailure({
    payload: input.payload,
    failure: rawTerminalBlockingToolRailFailure,
    terminal: selectedWorkstationToolEvaluation,
    workstationTerminalMaterialized,
  });
  const receiptTerminalSupersedesToolRailFailure =
    Boolean(
      selectedReceiptTerminal &&
      goalAllowsTerminal &&
      rawTerminalBlockingToolRailFailure &&
      (
        rawTerminalBlockingToolRailFailure.railFailureCode === "observation_missing" ||
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_not_materialized" ||
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_projection_mismatch" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "observation_artifact" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_materialization" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "visible_projection" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "observation_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "presenter_boundary"
      ),
    );
  const deterministicReceiptFallbackStatusSupersedesToolRailFailure =
    Boolean(
      deterministicReceiptFallbackCanSurface &&
      rawTerminalBlockingToolRailFailure &&
      (
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_product_mismatch" ||
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_not_materialized" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_materialization" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "visible_projection" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "presenter_boundary"
      ),
    );
  const visualGoalArtifactSupersedesToolRailFailure =
    Boolean(
      selectedGoalArtifact &&
      isVisualSituationTerminalKind(selectedGoalArtifact.kind) &&
      goalAllowsTerminal &&
      rawTerminalBlockingToolRailFailure &&
      (
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_not_materialized" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_materialization" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "visible_projection" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "presenter_boundary"
      ),
    );
  const capabilityHelpGoalArtifactSupersedesToolRailFailure =
    Boolean(
      selectedGoalArtifact?.kind === "capability_help_summary" &&
      goalAllowsTerminal &&
      rawTerminalBlockingToolRailFailure &&
      (
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_not_materialized" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_materialization" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "visible_projection" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "presenter_boundary"
      ),
    );
  const theoryGoalArtifactSupersedesToolRailFailure =
    Boolean(
      selectedGoalArtifact?.kind === "theory_context_reflection_answer" &&
      goalAllowsTerminal &&
      rawTerminalBlockingToolRailFailure &&
      (
        rawTerminalBlockingToolRailFailure.railFailureCode === "terminal_not_materialized" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_materialization" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.firstBrokenRail === "visible_projection" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_materializer" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "terminal_authority" ||
        rawTerminalBlockingToolRailFailure.repairTarget === "presenter_boundary"
      ),
    );
  const terminalBlockingToolRailFailure =
    noteMutationDraftSupersedesToolRailFailure ||
    repoDraftSupersedesToolRailFailure ||
    compoundDraftSupersedesToolRailFailure ||
    workstationTerminalSupersedesToolRailFailure ||
    receiptTerminalSupersedesToolRailFailure ||
    deterministicReceiptFallbackStatusSupersedesToolRailFailure ||
    visualGoalArtifactSupersedesToolRailFailure ||
    capabilityHelpGoalArtifactSupersedesToolRailFailure ||
    theoryGoalArtifactSupersedesToolRailFailure
      ? null
      : rawTerminalBlockingToolRailFailure?.railFailureCode === "terminal_projection_mismatch" &&
    (
      (existingDocEvidenceTerminal && docsTerminalMatchesRequiredGoal) ||
      Boolean(selectedGoalArtifact && isDocumentTerminalArtifactKind(selectedGoalArtifact.kind))
    ) &&
    goalAllowsTerminal
      ? null
      : rawTerminalBlockingToolRailFailure;

  if (terminalBlockingToolRailFailure) {
    const terminalErrorCode = terminalBlockingToolRailFailure.railFailureCode;
    const terminalErrorText = toolRailFailureTerminalText(input.payload, terminalBlockingToolRailFailure);
    if (selectedDirectAnswerTerminal) {
      rejectedCandidates.push({
        ref: selectedDirectAnswerTerminal.ref ?? undefined,
        kind: "direct_answer_text",
        source: "direct_answer_text",
        reason: "missing_required_observation",
      });
    }
    if (selectedWorkstationToolEvaluation) {
      rejectedCandidates.push({
        ref: selectedWorkstationToolEvaluation.ref ?? undefined,
        kind: "workstation_tool_evaluation",
        source: "workstation_tool_evaluation",
        reason: "missing_required_observation",
      });
    }
    if (draftMaterialization?.ok === true) {
      rejectedCandidates.push({
        ref: draftMaterialization.materialized_terminal_artifact_ref ?? draftMaterialization.final_answer_draft_ref ?? undefined,
        kind: draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    input.payload.ok = false;
    input.payload.response_type = "final_failure";
    input.payload.final_status = "final_failure";
    input.payload.status = "final_failure";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.terminal_failure_text = terminalErrorText;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    delete input.payload.model_synthesized_answer;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      rail_status: terminalBlockingToolRailFailure.railStatus,
      first_broken_rail: terminalBlockingToolRailFailure.firstBrokenRail,
      repair_target: terminalBlockingToolRailFailure.repairTarget,
      selected_capability: terminalBlockingToolRailFailure.selectedCapability,
      executed_capability: terminalBlockingToolRailFailure.executedCapability,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.terminal_answer_authority = {
      ...(readRecord(input.payload.terminal_answer_authority) ?? {}),
      schema: "helix.turn_terminal_authority.v1",
      turn_id: input.turnId,
      terminal_kind: "failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_text_preview: terminalErrorText.slice(0, 240),
      terminal_text_hash: hashHelixTerminalText(terminalErrorText),
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (calculatorTerminalMissingSupport) {
    const terminalErrorCode = "calculator_tool_answer_support_missing";
    const missingReason = calculatorToolAnswerSupport.missing_reason ?? "calculator_result_missing";
    const terminalErrorText =
      missingReason === "calculator_result_missing"
        ? "I could not complete this calculator turn because no calculator result observation was available for terminal authority."
        : missingReason === "final_answer_draft_missing"
          ? "I could not complete this calculator turn because no calculator-backed final answer draft was materialized."
          : missingReason === "draft_does_not_explain_result"
            ? "I could not complete this calculator turn because the final draft was not grounded in the calculator result observation."
            : "I could not complete this calculator turn because calculator-backed terminal support was missing.";
    if (selectedDirectAnswerTerminal) {
      rejectedCandidates.push({
        ref: selectedDirectAnswerTerminal.ref ?? undefined,
        kind: "direct_answer_text",
        source: "direct_answer_text",
        reason: "missing_required_observation",
      });
    }
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    if (latestDraft) {
      rejectedCandidates.push({
        ref: latestDraft.ref ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    if (draftMaterialization?.ok === true) {
      rejectedCandidates.push({
        ref: draftMaterialization.materialized_terminal_artifact_ref ?? draftMaterialization.final_answer_draft_ref ?? undefined,
        kind: draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    input.payload.ok = false;
    input.payload.response_type = "final_failure";
    input.payload.final_status = "final_failure";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.terminal_failure_text = terminalErrorText;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    delete input.payload.model_synthesized_answer;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      missing_reason: missingReason,
      missing_required_evidence: ["calculator_receipt", "workstation_tool_evaluation"],
      calculator_tool_answer_support: calculatorToolAnswerSupport,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (compoundSubgoalDraftSupportMissing) {
    const terminalErrorCode = "compound_subgoal_support_refs_missing";
    const missingRefs = compoundSubgoalDraftSupportCoverage.missing_observation_refs;
    const terminalErrorText = missingRefs.length > 0
      ? `I could not complete this compound turn because the final draft was not grounded in every satisfied subgoal observation. Missing support refs: ${missingRefs.join(", ")}.`
      : "I could not complete this compound turn because the final draft was not grounded in every satisfied subgoal observation.";
    if (selectedDirectAnswerTerminal) {
      rejectedCandidates.push({
        ref: selectedDirectAnswerTerminal.ref ?? undefined,
        kind: "direct_answer_text",
        source: "direct_answer_text",
        reason: "missing_required_observation",
      });
    }
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    if (latestDraft) {
      rejectedCandidates.push({
        ref: latestDraft.ref ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    input.payload.ok = false;
    input.payload.response_type = "final_failure";
    input.payload.final_status = "final_failure";
    input.payload.status = "final_failure";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.terminal_failure_text = terminalErrorText;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    delete input.payload.model_synthesized_answer;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      compound_subgoal_draft_support_coverage: compoundSubgoalDraftSupportCoverage,
      missing_observation_refs: missingRefs,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.resolved_turn_summary = {
      ...(readRecord(input.payload.resolved_turn_summary) ?? {}),
      turn_id: input.turnId,
      final_status: "final_failure",
      response_type: "final_failure",
      final_answer_source: "typed_failure",
      terminal_kind: "failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: terminalErrorCode,
      pending_server_request_present: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (compoundCoverageFailedClosed) {
    const unresolved = readArray(compoundCoverageGate?.unresolved_requirement_ids)
      .map(readString)
      .filter((entry): entry is string => Boolean(entry));
    const failedClosed = readArray(compoundCoverageGate?.resolutions)
      .map(readRecord)
      .filter((entry): entry is Record<string, unknown> => Boolean(entry))
      .filter((entry) => readString(entry.status) === "failed_closed")
      .map((entry) => readString(entry.requirement_id))
      .filter((entry): entry is string => Boolean(entry));
    const missingRequirements = unresolved.length > 0 ? unresolved : failedClosed;
    const terminalErrorCode =
      firstIncompleteCompoundSubgoalRailFailure?.railFailureCode ?? "compound_prompt_coverage_incomplete";
    const terminalErrorText = firstIncompleteCompoundSubgoalRailFailure
      ? compoundSubgoalRailFailureTerminalText(firstIncompleteCompoundSubgoalRailFailure)
      : missingRequirements.length > 0
        ? `I could not complete this compound turn because required prompt items failed closed or remain unresolved: ${missingRequirements.join(", ")}.`
        : "I could not complete this compound turn because required prompt coverage failed closed.";
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    if (latestDraft) {
      rejectedCandidates.push({
        ref: latestDraft.ref ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    input.payload.ok = false;
    input.payload.response_type = "final_failure";
    input.payload.final_status = "final_failure";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.terminal_failure_text = terminalErrorText;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      unresolved_requirement_ids: unresolved,
      failed_closed_requirement_ids: failedClosed,
      assistant_answer: false,
      raw_content_included: false,
    };
    writeCompoundSubgoalRailFailureDetails(
      readRecord(input.payload.typed_failure) ?? (input.payload.typed_failure as Record<string, unknown>),
      firstIncompleteCompoundSubgoalRailFailure,
    );
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    writeCompoundSubgoalRailFailureDetails(input.payload, firstIncompleteCompoundSubgoalRailFailure);
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (blockingMutatingCapabilityFailureText) {
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    if (latestDraft) {
      rejectedCandidates.push({
        ref: latestDraft.ref ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "capability_lifecycle_failed",
      });
    }
    if (selectedReceiptTerminal) {
      rejectedCandidates.push({
        ref: selectedReceiptTerminal.ref ?? undefined,
        kind: selectedReceiptTerminal.kind,
        source: selectedReceiptTerminal.kind,
        reason: "capability_lifecycle_failed",
      });
    }
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
    input.payload.ok = false;
    input.payload.response_type = "final_failure";
    input.payload.final_status = "final_failure";
    input.payload.status = "final_failure";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = blockingMutatingCapabilityFailureCode;
    input.payload.terminal_failure_text = blockingMutatingCapabilityFailureText;
    input.payload.selected_final_answer = blockingMutatingCapabilityFailureText;
    input.payload.answer = blockingMutatingCapabilityFailureText;
    input.payload.text = blockingMutatingCapabilityFailureText;
    input.payload.assistant_answer = blockingMutatingCapabilityFailureText;
    delete input.payload.model_synthesized_answer;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: blockingMutatingCapabilityFailureCode,
      message: blockingMutatingCapabilityFailureText,
      text: blockingMutatingCapabilityFailureText,
      answer_text: blockingMutatingCapabilityFailureText,
      capability_failure_codes: capabilityFailureCodes,
      requested_capability: readString(capabilityPlan?.requested_capability) || readString(capabilityPlan?.requested_action) || null,
      selected_capability: readString(capabilityPlan?.selected_capability) || null,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: blockingMutatingCapabilityFailureText,
      assistant_answer: false,
      raw_content_included: false,
    };
  } else if (!solverContinuationPending && selectedWorkstationToolEvaluation && !compoundSynthesisTerminalReady) {
    const workstationTerminalText = synthesizeWorkstationToolEvaluationTerminalText({
      turnId: input.turnId,
      payload: input.payload,
      terminal: selectedWorkstationToolEvaluation,
    });
    const calculatorDraftText = calculatorCompoundSupportedDraftText(input.payload, artifacts);
    const selectedWorkstationTerminalText = calculatorDraftText ?? workstationTerminalText.text;
    if (workstationTerminalText.audit) {
      input.payload.workstation_tool_terminal_synthesis = workstationTerminalText.audit;
      const debug = readRecord(input.payload.debug);
      if (debug) {
        debug.workstation_tool_terminal_synthesis = workstationTerminalText.audit;
      }
    } else if (calculatorDraftText) {
      const audit = {
        schema: "helix.workstation_tool_terminal_synthesis.v1",
        turn_id: input.turnId,
        applied: true,
        source: "calculator_compound_supported_final_answer_draft",
        terminal_artifact_kind: "workstation_tool_evaluation",
        terminal_artifact_ref: selectedWorkstationToolEvaluation.ref,
        reason: "calculator_compound_workstation_terminal_uses_coverage_backed_draft_text",
        assistant_answer: false,
        raw_content_included: false,
      };
      input.payload.workstation_tool_terminal_synthesis = audit;
      const debug = readRecord(input.payload.debug);
      if (debug) {
        debug.workstation_tool_terminal_synthesis = audit;
      }
    }
    selectedArtifactRef = selectedWorkstationToolEvaluation.ref;
    selectedArtifactKind = "workstation_tool_evaluation";
    selectedSource = "workstation_tool_evaluation";
    syncWorkstationTerminalMaterializationMirrors({
      payload: input.payload,
      terminalArtifactRef: selectedWorkstationToolEvaluation.ref,
    });
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = "workstation_tool_evaluation";
    input.payload.final_answer_source = "workstation_tool_evaluation";
    input.payload.selected_final_answer = selectedWorkstationTerminalText;
    input.payload.answer = selectedWorkstationTerminalText;
    input.payload.text = selectedWorkstationTerminalText;
    input.payload.assistant_answer = selectedWorkstationTerminalText;
    input.payload.terminal_artifact_id = selectedWorkstationToolEvaluation.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "workstation_tool_evaluation",
      concise_text: selectedWorkstationTerminalText,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
    if (selectedDraft) {
      rejectedCandidates.push({
        ref: artifactId(selectedDraft.artifact) ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "later_valid_final_answer_draft",
      });
    }
  } else if (!solverContinuationPending && selectedReceiptTerminal) {
    selectedArtifactRef = selectedReceiptTerminal.ref;
    selectedArtifactKind = selectedReceiptTerminal.kind as HelixTerminalAuthoritySingleWriterResult["selected_terminal_artifact_kind"];
    selectedSource = selectedReceiptTerminal.kind as HelixTerminalAuthoritySingleWriterResult["source"];
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = selectedReceiptTerminal.kind;
    input.payload.final_answer_source = selectedReceiptTerminal.kind;
    input.payload.selected_final_answer = selectedReceiptTerminal.text;
    input.payload.answer = selectedReceiptTerminal.text;
    input.payload.text = selectedReceiptTerminal.text;
    input.payload.assistant_answer = selectedReceiptTerminal.text;
    input.payload.terminal_artifact_id = selectedReceiptTerminal.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedReceiptTerminal.kind,
      concise_text: selectedReceiptTerminal.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
    delete input.payload.typed_failure;
    if (selectedDraft) {
      rejectedCandidates.push({
        ref: artifactId(selectedDraft.artifact) ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "later_valid_final_answer_draft",
      });
    }
  } else if (
    !solverContinuationPending &&
    !pendingControlPlaneTerminal &&
    !itineraryObservationCriteriaSatisfied &&
    !repoDraftMaterializationMatchesRequiredGoal
  ) {
    const terminalErrorCode = "capability_itinerary_observations_missing";
    const terminalErrorText = `I could not complete this turn because required itinerary observations are missing: ${missingItineraryFamilies.join(", ")}.`;
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    if (latestDraft) {
      rejectedCandidates.push({
        ref: latestDraft.ref ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.terminal_failure_text = terminalErrorText;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      missing_itinerary_observation_families: missingItineraryFamilies,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.model_synthesized_answer;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "typed_failure",
      concise_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (!solverContinuationPending && pendingControlPlaneTerminal && pendingRequestCandidate) {
    const pendingText =
      readString(pendingRequestCandidate.prompt) ??
      readString(input.payload.selected_final_answer) ??
      readString(input.payload.answer) ??
      readString(input.payload.text) ??
      "I need one missing detail before I can continue.";
    selectedArtifactRef = readString(pendingRequestCandidate.request_id) ?? `${input.turnId}:request_user_input`;
    selectedArtifactKind = "request_user_input";
    selectedSource = "request_user_input";
    input.payload.ok = true;
    input.payload.response_type = "pending_input";
    input.payload.final_status = "pending_input";
    input.payload.status = "pending_input";
    input.payload.terminal_artifact_kind = "request_user_input";
    input.payload.final_answer_source = "request_user_input";
    input.payload.selected_final_answer = pendingText;
    input.payload.answer = pendingText;
    input.payload.text = pendingText;
    input.payload.assistant_answer = false;
    input.payload.pending_server_request = pendingRequestCandidate;
    input.payload.pending_request = pendingRequestCandidate;
    input.payload.terminal_artifact_id = selectedArtifactRef;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "request_user_input",
      concise_text: pendingText,
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
  } else if (!solverContinuationPending && noteMutationFinalDraftCanSurface && noteMutationDraftCandidate) {
    const text = noteMutationDraftCandidate.text ?? artifactText(noteMutationDraftCandidate.artifact) ?? "Updated the requested note.";
    selectedArtifactRef = noteMutationDraftCandidate.ref ?? artifactId(noteMutationDraftCandidate.artifact);
    selectedArtifactKind = "model_synthesized_answer";
    selectedSource = "final_answer_draft";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = "model_synthesized_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_artifact_id = selectedArtifactRef ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
  } else if (!solverContinuationPending && repoTerminalMaterialized && repoAnswerText) {
    selectedArtifactRef =
      draftMaterialization?.materialized_terminal_artifact_ref ??
      readString(repoEvidenceAnswerCandidate?.artifact_id) ??
      null;
    selectedArtifactKind = "repo_code_evidence_answer";
    selectedSource = "final_answer_draft";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = "repo_code_evidence_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = repoAnswerText;
    input.payload.answer = repoAnswerText;
    input.payload.text = repoAnswerText;
    input.payload.assistant_answer = repoAnswerText;
    input.payload.terminal_artifact_id = selectedArtifactRef ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "repo_code_evidence_answer",
      concise_text: repoAnswerText,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
  } else if (selectedGoalArtifact?.kind === "capability_help_summary" && !compoundSynthesisTerminalReady) {
    selectedArtifactRef = selectedGoalArtifact.ref;
    selectedArtifactKind = selectedGoalArtifact.kind;
    selectedSource = selectedGoalArtifact.kind;
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = selectedGoalArtifact.kind;
    input.payload.final_answer_source = selectedGoalArtifact.kind;
    input.payload.selected_final_answer = selectedGoalArtifact.text;
    input.payload.answer = selectedGoalArtifact.text;
    input.payload.text = selectedGoalArtifact.text;
    input.payload.assistant_answer = selectedGoalArtifact.text;
    input.payload.terminal_artifact_id = selectedGoalArtifact.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedGoalArtifact.kind,
      concise_text: selectedGoalArtifact.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
  } else if (!solverContinuationPending && selectedDirectAnswerTerminal && !compoundSynthesisTerminalReady) {
    selectedArtifactRef = selectedDirectAnswerTerminal.ref;
    selectedArtifactKind = "direct_answer_text";
    selectedSource = "direct_answer_text";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.terminal_artifact_kind = "direct_answer_text";
    input.payload.final_answer_source = "model_direct_answer";
    input.payload.selected_final_answer = selectedDirectAnswerTerminal.text;
    input.payload.answer = selectedDirectAnswerTerminal.text;
    input.payload.text = selectedDirectAnswerTerminal.text;
    input.payload.assistant_answer = selectedDirectAnswerTerminal.text;
    input.payload.terminal_artifact_id = selectedDirectAnswerTerminal.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "direct_answer_text",
      concise_text: selectedDirectAnswerTerminal.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
  } else if (!solverContinuationPending && selectedLiveEnvironmentBindingDiagnosis) {
    selectedArtifactRef = selectedLiveEnvironmentBindingDiagnosis.ref;
    selectedArtifactKind = selectedLiveEnvironmentBindingDiagnosis.kind;
    selectedSource = "live_environment_binding_diagnosis";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.terminal_artifact_kind = selectedLiveEnvironmentBindingDiagnosis.kind;
    input.payload.final_answer_source = selectedLiveEnvironmentBindingDiagnosis.kind;
    input.payload.selected_final_answer = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.answer = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.text = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.assistant_answer = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.terminal_artifact_id = selectedLiveEnvironmentBindingDiagnosis.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedLiveEnvironmentBindingDiagnosis.kind,
      concise_text: selectedLiveEnvironmentBindingDiagnosis.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
  } else if (!solverContinuationPending && existingDocEvidenceTerminal && !compoundSynthesisTerminalReady) {
    selectedArtifactRef = existingDocEvidenceTerminal.ref;
    selectedArtifactKind = "doc_evidence_synthesis_answer";
    selectedSource = "final_answer_draft";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = "doc_evidence_synthesis_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = existingDocEvidenceTerminal.text;
    input.payload.answer = existingDocEvidenceTerminal.text;
    input.payload.text = existingDocEvidenceTerminal.text;
    input.payload.assistant_answer = existingDocEvidenceTerminal.text;
    input.payload.terminal_artifact_id = existingDocEvidenceTerminal.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "doc_evidence_synthesis_answer",
      concise_text: existingDocEvidenceTerminal.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
  } else if (!solverContinuationPending && selectedGoalArtifact && !compoundSynthesisTerminalReady) {
    selectedArtifactRef = selectedGoalArtifact.ref;
    selectedArtifactKind = selectedGoalArtifact.kind;
    selectedSource = selectedGoalArtifact.kind;
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.terminal_artifact_kind = selectedGoalArtifact.kind;
    input.payload.final_answer_source = selectedGoalArtifact.kind;
    input.payload.selected_final_answer = selectedGoalArtifact.text;
    input.payload.answer = selectedGoalArtifact.text;
    input.payload.text = selectedGoalArtifact.text;
    input.payload.assistant_answer = selectedGoalArtifact.text;
    input.payload.terminal_artifact_id = selectedGoalArtifact.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedGoalArtifact.kind,
      concise_text: selectedGoalArtifact.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
  } else if (!solverContinuationPending && usableDraftMaterialization) {
    const selectedMaterializationDraft =
      materializedDraftCandidate ?? findLatestFinalAnswerDraftCandidate(artifacts);
    selectedArtifactRef = draftMaterialization.materialized_terminal_artifact_ref ?? selectedMaterializationDraft?.ref ?? null;
    selectedArtifactKind = draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer";
    const materializedScholarlyAnswer =
      selectedArtifactKind === "scholarly_research_answer"
        ? readRecord(input.payload.scholarly_research_answer)
        : null;
    const materializedInternetSearchAnswer =
      selectedArtifactKind === "internet_search_answer"
        ? readRecord(input.payload.internet_search_answer)
        : null;
    const materializedDocEvidenceSynthesisAnswer =
      selectedArtifactKind === "doc_evidence_synthesis_answer"
        ? readRecord(input.payload.doc_evidence_synthesis_answer)
        : null;
    const materializedCompoundResearchLocatorAnswer =
      selectedArtifactKind === "compound_research_locator_answer"
        ? readRecord(input.payload.compound_research_locator_answer)
        : null;
    const materializedCompoundEvidenceSynthesisAnswer =
      selectedArtifactKind === "compound_evidence_synthesis_answer"
        ? readRecord(input.payload.compound_evidence_synthesis_answer)
        : null;
    const materializedTheoryContextReflectionAnswer =
      selectedArtifactKind === "theory_context_reflection_answer"
        ? readRecord(input.payload.theory_context_reflection_answer)
        : null;
    const baseText =
      readString(materializedCompoundEvidenceSynthesisAnswer?.answer_text) ??
      readString(materializedCompoundEvidenceSynthesisAnswer?.text) ??
      readString(materializedCompoundResearchLocatorAnswer?.answer_text) ??
      readString(materializedCompoundResearchLocatorAnswer?.text) ??
      readString(materializedDocEvidenceSynthesisAnswer?.answer_text) ??
      readString(materializedDocEvidenceSynthesisAnswer?.text) ??
      readString(materializedScholarlyAnswer?.answer_text) ??
      readString(materializedScholarlyAnswer?.text) ??
      readString(materializedInternetSearchAnswer?.answer_text) ??
      readString(materializedInternetSearchAnswer?.text) ??
      readString(materializedTheoryContextReflectionAnswer?.answer_text) ??
      readString(materializedTheoryContextReflectionAnswer?.text) ??
      selectedMaterializationDraft?.text ??
      readString(input.payload.selected_final_answer) ??
      "I could not produce a terminal answer for this turn.";
    const citationFooter =
      selectedArtifactKind === "scholarly_research_answer" ||
      selectedArtifactKind === "compound_research_locator_answer"
        ? appendScholarlyCitationFooter(baseText, artifacts)
        : { text: baseText, citations: [] as ScholarlyCitation[], footer: null };
    const text = citationFooter.text;
    if (materializedCompoundResearchLocatorAnswer) {
      materializedCompoundResearchLocatorAnswer.text = text;
      materializedCompoundResearchLocatorAnswer.answer_text = text;
      materializedCompoundResearchLocatorAnswer.citations = citationFooter.citations;
      materializedCompoundResearchLocatorAnswer.citation_footer = citationFooter.footer;
    }
    if (materializedCompoundEvidenceSynthesisAnswer) {
      materializedCompoundEvidenceSynthesisAnswer.text = text;
      materializedCompoundEvidenceSynthesisAnswer.answer_text = text;
    }
    if (materializedScholarlyAnswer) {
      materializedScholarlyAnswer.text = text;
      materializedScholarlyAnswer.answer_text = text;
      materializedScholarlyAnswer.citations = citationFooter.citations;
      materializedScholarlyAnswer.citation_footer = citationFooter.footer;
    }
    if (materializedInternetSearchAnswer) {
      materializedInternetSearchAnswer.text = text;
      materializedInternetSearchAnswer.answer_text = text;
    }
    if (materializedDocEvidenceSynthesisAnswer) {
      materializedDocEvidenceSynthesisAnswer.text = text;
      materializedDocEvidenceSynthesisAnswer.answer_text = text;
    }
    if (materializedTheoryContextReflectionAnswer) {
      materializedTheoryContextReflectionAnswer.text = text;
      materializedTheoryContextReflectionAnswer.answer_text = text;
    }
    selectedSource = "final_answer_draft";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = selectedArtifactKind;
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_artifact_id = selectedArtifactRef ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedArtifactKind,
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
    delete input.payload.typed_failure;
    const directSequence = latestDirectAnswerSequence(artifacts);
    if (directSequence >= 0) {
      const direct = artifacts[directSequence];
      rejectedCandidates.push({
        ref: direct ? artifactId(direct) ?? undefined : undefined,
        kind: "direct_answer_text",
        reason: "later_valid_final_answer_draft",
      });
    }
  } else if (!solverContinuationPending && selectedDraft && routeAllowsModelSynthesizedAnswer) {
    const text = artifactText(selectedDraft.artifact) ?? "I could not produce a terminal answer for this turn.";
    selectedArtifactRef = artifactId(selectedDraft.artifact);
    selectedArtifactKind = "model_synthesized_answer";
    selectedSource = "final_answer_draft";
    input.payload.terminal_artifact_kind = "model_synthesized_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
  } else if (!solverContinuationPending && deterministicReceiptFallbackDraft && deterministicReceiptFallbackCanSurface) {
    const draftRef = artifactId(deterministicReceiptFallbackDraft.artifact);
    const text = stagePlayReceiptTextForDraft(deterministicReceiptFallbackDraft.artifact);
    selectedArtifactRef = draftRef;
    selectedArtifactKind = "tool_receipt";
    selectedSource = "tool_receipt";
    input.payload.terminal_artifact_kind = "tool_receipt";
    input.payload.final_answer_source = "deterministic_receipt_fallback";
    input.payload.receipt_status_text = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = false;
    input.payload.terminal_eligible = false;
    input.payload.terminal_artifact_id = draftRef ?? undefined;
    delete input.payload.selected_final_answer;
    delete input.payload.finalAnswer;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "tool_receipt",
      concise_text: text,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    rejectedCandidates.push({
      ref: draftRef ?? undefined,
      kind: "final_answer_draft",
      source: "final_answer_draft",
      reason: "deterministic_receipt_fallback_nonterminal",
    });
  } else if (!solverContinuationPending && latestRequiredObservationSequence >= 0) {
    const terminalErrorCode = scholarlyAnswerSynthesisMissing
      ? "scholarly_answer_synthesis_failed_after_full_text_observed"
      : internetSearchAnswerSynthesisMissing
      ? "internet_search_answer_synthesis_failed_after_observation"
      : "post_tool_model_step_missing";
    const terminalErrorText = scholarlyAnswerSynthesisMissing
      ? "I could not complete this scholarly research turn because PDF/full-text evidence was observed, but no valid model-authored scholarly answer passed terminal authority."
      : internetSearchAnswerSynthesisMissing
      ? "I could not complete this internet search turn because web evidence was observed, but no valid model-authored internet search answer passed terminal authority."
      : "I could not complete this turn because a tool observation required a follow-up model answer step, but no later terminal answer artifact was available.";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
    rejectedCandidates.push({
      kind: "normal_answer",
      reason: "missing_post_tool_model_step",
    });
  }

  if (noteMutationFinalDraftCanSurface && noteMutationDraftCandidate && selectedArtifactKind === "model_synthesized_answer") {
    const text = noteMutationDraftCandidate.text ?? artifactText(noteMutationDraftCandidate.artifact) ?? "Updated the requested note.";
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.status = "final_answer";
    input.payload.terminal_artifact_kind = "model_synthesized_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_artifact_id = selectedArtifactRef ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
    delete input.payload.terminal_failure_text;
    delete input.payload.typed_failure;
  }

  if (
    readString(input.payload.terminal_artifact_kind) === "typed_failure" ||
    readString(input.payload.final_answer_source) === "typed_failure"
  ) {
    delete input.payload.model_synthesized_answer;
  }

  const workstationAuthorityEnvelopeText =
    selectedArtifactKind === "workstation_tool_evaluation" && selectedSource === "workstation_tool_evaluation"
      ? readString(input.payload.selected_final_answer) ??
        readString(input.payload.answer) ??
        readString(input.payload.text)
      : null;
  const materializedAuthorityEnvelopeText =
    selectedArtifactKind === "compound_evidence_synthesis_answer"
      ? readString(readRecord(input.payload.compound_evidence_synthesis_answer)?.answer_text) ??
        readString(readRecord(input.payload.compound_evidence_synthesis_answer)?.text)
    : selectedArtifactKind === "compound_research_locator_answer"
      ? readString(readRecord(input.payload.compound_research_locator_answer)?.answer_text) ??
        readString(readRecord(input.payload.compound_research_locator_answer)?.text)
    : selectedArtifactKind === "doc_evidence_synthesis_answer"
      ? readString(readRecord(input.payload.doc_evidence_synthesis_answer)?.answer_text) ??
        readString(readRecord(input.payload.doc_evidence_synthesis_answer)?.text)
    : selectedArtifactKind === "scholarly_research_answer"
      ? readString(readRecord(input.payload.scholarly_research_answer)?.answer_text) ??
        readString(readRecord(input.payload.scholarly_research_answer)?.text)
    : selectedArtifactKind === "internet_search_answer"
      ? readString(readRecord(input.payload.internet_search_answer)?.answer_text) ??
        readString(readRecord(input.payload.internet_search_answer)?.text)
    : selectedArtifactKind === "theory_context_reflection_answer"
      ? readString(readRecord(input.payload.theory_context_reflection_answer)?.answer_text) ??
        readString(readRecord(input.payload.theory_context_reflection_answer)?.text)
      : null;
  let envelope = resolveTerminalAnswerEnvelope(input.payload, {
    threadId: input.threadId,
    turnId: input.turnId,
  });
  if (selectedArtifactKind === "workstation_tool_evaluation" && workstationAuthorityEnvelopeText) {
    envelope = {
      ...envelope,
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      terminal_text: workstationAuthorityEnvelopeText,
      terminal_text_hash: hashHelixTerminalText(workstationAuthorityEnvelopeText),
      terminal_kind: "tool_evaluation",
      authority_origin: "workstation_tool_evaluation",
    };
  } else if (
    selectedSource === "final_answer_draft" &&
    materializedAuthorityEnvelopeText &&
    (
      selectedArtifactKind === "compound_evidence_synthesis_answer" ||
      selectedArtifactKind === "compound_research_locator_answer" ||
      selectedArtifactKind === "doc_evidence_synthesis_answer" ||
      selectedArtifactKind === "scholarly_research_answer" ||
      selectedArtifactKind === "internet_search_answer" ||
      selectedArtifactKind === "theory_context_reflection_answer"
    )
  ) {
    envelope = {
      ...envelope,
      terminal_artifact_kind: selectedArtifactKind,
      final_answer_source: "final_answer_draft",
      terminal_text: materializedAuthorityEnvelopeText,
      terminal_text_hash: hashHelixTerminalText(materializedAuthorityEnvelopeText),
      terminal_kind: "answer",
      authority_origin: "selected_final_answer",
    };
  }
  if (
    (
      deterministicReceiptFallbackCanSurface &&
      deterministicReceiptFallbackDraft
    ) ||
    (
      readString(input.payload.terminal_artifact_kind) === "tool_receipt" &&
      readString(input.payload.final_answer_source) === "deterministic_receipt_fallback"
    )
  ) {
    const receiptText = deterministicReceiptFallbackDraft
      ? stagePlayReceiptTextForDraft(deterministicReceiptFallbackDraft.artifact)
      : readString(input.payload.receipt_status_text) ??
        readString(readRecord(input.payload.terminal_presentation)?.concise_text) ??
        readString(input.payload.answer) ??
        readString(input.payload.text) ??
        stagePlayReceiptPendingText;
    envelope = {
      ...envelope,
      terminal_artifact_kind: "tool_receipt",
      final_answer_source: "deterministic_receipt_fallback",
      terminal_text: receiptText,
      terminal_text_hash: hashHelixTerminalText(receiptText),
      terminal_kind: "tool_receipt",
      authority_origin: "tool_receipt",
    };
    selectedArtifactKind = "tool_receipt";
    selectedSource = "tool_receipt";
    selectedArtifactRef = deterministicReceiptFallbackDraft
      ? artifactId(deterministicReceiptFallbackDraft.artifact)
      : readString(input.payload.terminal_artifact_id);
  }
  const appliedEnvelope = applyTerminalAnswerEnvelope(input.payload, envelope);
  if (deterministicReceiptFallbackCanSurface && deterministicReceiptFallbackDraft) {
    input.payload.final_answer_source = "deterministic_receipt_fallback";
    const terminalAuthority = readRecord(input.payload.terminal_answer_authority);
    if (terminalAuthority) {
      terminalAuthority.final_answer_source = "deterministic_receipt_fallback";
    }
    const terminalEnvelope = readRecord(input.payload.terminal_answer_envelope);
    if (terminalEnvelope) {
      terminalEnvelope.final_answer_source = "deterministic_receipt_fallback";
    }
  }
  const visibleText = appliedEnvelope.terminal_text;
  const latestDraftForIntegrity =
    materializedDraftCandidate ?? findLatestFinalAnswerDraftCandidate(artifacts);
  const draftText = latestDraftForIntegrity?.text ?? (selectedDraft ? artifactText(selectedDraft.artifact) : null);
  const selectedMaterializedAnswerText =
    readString(readRecord(input.payload.compound_evidence_synthesis_answer)?.answer_text) ??
    readString(readRecord(input.payload.model_synthesized_answer)?.answer_text) ??
    readString(readRecord(input.payload.compound_research_locator_answer)?.answer_text) ??
    readString(readRecord(input.payload.doc_evidence_synthesis_answer)?.answer_text) ??
    readString(readRecord(input.payload.scholarly_research_answer)?.answer_text) ??
    readString(readRecord(input.payload.internet_search_answer)?.answer_text) ??
    readString(readRecord(input.payload.repo_code_evidence_answer)?.answer_text);
  const selectedArtifactTextForIntegrity = selectedMaterializedAnswerText ?? draftText;
  const receiptVisibleAsAnswer = artifacts.some((artifact) => {
    if (!isForbiddenReceiptOrProjection(artifact)) return false;
    if (
      selectedReceiptTerminal &&
      (
        artifact === selectedReceiptTerminal.artifact ||
        (
          selectedReceiptTerminal.ref &&
          artifactId(artifact) === selectedReceiptTerminal.ref
        )
      )
    ) {
      return false;
    }
    const text = artifactText(artifact);
    return Boolean(text && text === visibleText);
  });
  const terminalAuthorityForEnvelopeMirror = readRecord(input.payload.terminal_answer_authority);
  const terminalPresentationForEnvelopeMirror = readRecord(input.payload.terminal_presentation);
  const appliedEnvelopeTerminalKind = readString(appliedEnvelope.terminal_artifact_kind);
  const appliedEnvelopeFinalAnswerSource = readString(appliedEnvelope.final_answer_source);
  const authorityEnvelopeTerminalKind = readString(terminalAuthorityForEnvelopeMirror?.terminal_artifact_kind);
  const presentationEnvelopeTerminalKind = readString(terminalPresentationForEnvelopeMirror?.terminal_artifact_kind);
  const envelopeMirrorFailureSelected =
    selectedArtifactKind === "typed_failure" ||
    selectedSource === "typed_failure" ||
    Boolean(readString(input.payload.terminal_error_code)) ||
    readString(input.payload.final_status) === "final_failure" ||
    readString(input.payload.response_type) === "final_failure";
  const authorityEnvelopeSelectionKind =
    !envelopeMirrorFailureSelected &&
    appliedEnvelopeTerminalKind &&
    appliedEnvelopeTerminalKind !== "tool_receipt" &&
    appliedEnvelopeTerminalKind !== "typed_failure" &&
    (
      authorityEnvelopeTerminalKind === appliedEnvelopeTerminalKind ||
      presentationEnvelopeTerminalKind === appliedEnvelopeTerminalKind
    )
      ? appliedEnvelopeTerminalKind as Exclude<HelixTerminalAuthoritySingleWriterResult["selected_terminal_artifact_kind"], null>
      : null;
  const envelopeTerminalKind =
    appliedEnvelope.terminal_artifact_kind === "typed_failure" ||
    appliedEnvelope.final_answer_source === "typed_failure" ||
    appliedEnvelope.terminal_artifact_kind === "request_user_input" ||
    appliedEnvelope.terminal_artifact_kind === "direct_answer_text" ||
    appliedEnvelope.terminal_artifact_kind === "repo_code_evidence_answer"
      ? appliedEnvelope.terminal_artifact_kind
      : authorityEnvelopeSelectionKind
        ? authorityEnvelopeSelectionKind
      : null;
  const selectedTerminalArtifactKind = envelopeTerminalKind ?? selectedArtifactKind ?? null;
  const resultSource =
    appliedEnvelope.terminal_artifact_kind === "typed_failure" ||
    appliedEnvelope.final_answer_source === "typed_failure"
      ? "typed_failure"
      : appliedEnvelope.terminal_artifact_kind === "request_user_input"
        ? "request_user_input"
      : appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
        ? "direct_answer_text"
      : appliedEnvelope.terminal_artifact_kind === "repo_code_evidence_answer"
        ? "repo_code_evidence_answer"
        : authorityEnvelopeSelectionKind
          ? readString(terminalAuthorityForEnvelopeMirror?.final_answer_source) ??
            appliedEnvelopeFinalAnswerSource ??
            authorityEnvelopeSelectionKind
          : selectedSource === "terminal_authority_repair_failure"
            ? selectedSource
          : selectedSource;
  const nonAuthoritativeReceiptStatusResult =
    selectedTerminalArtifactKind === "tool_receipt" &&
    resultSource === "tool_receipt";
  const wroteVisibleFields = VISIBLE_ANSWER_FIELDS.filter((field) =>
    !(nonAuthoritativeReceiptStatusResult && field === "payload.selected_final_answer")
  );
  const envelopeSelectedArtifactRef =
    appliedEnvelope.terminal_artifact_kind === "repo_code_evidence_answer"
      ? readString(input.payload.terminal_artifact_id) ??
        readString(readRecord(input.payload.repo_code_evidence_answer)?.artifact_id)
      : authorityEnvelopeSelectionKind
        ? readString(input.payload.terminal_artifact_id) ??
          readString(terminalAuthorityForEnvelopeMirror?.terminal_artifact_ref) ??
          readString(terminalAuthorityForEnvelopeMirror?.terminal_artifact_id) ??
          readString(readRecord(input.payload.workstation_tool_evaluation)?.evaluation_id)
      : null;
  const selectedArtifactRefForResult =
    envelopeSelectedArtifactRef ??
    (
      selectedTerminalArtifactKind &&
      selectedTerminalArtifactKind !== "typed_failure" &&
      /^typed_failure:/i.test(selectedArtifactRef ?? "")
        ? `${selectedTerminalArtifactKind}:${textHash(`${input.turnId}:${visibleText}`)}`
        : selectedArtifactRef
    );
  const auditRejectedCandidates = rejectedCandidates.map((candidate) => ({
    artifactKind: candidate.kind,
    artifactRef: candidate.ref,
    reason: normalizeSingleWriterAuditRejectionReason(candidate.reason),
  }));
  const terminalAuthoritySingleWriterAudit = {
    artifactId: "terminal_authority_single_writer" as const,
    schemaVersion: "helix.terminal_authority_single_writer.v1" as const,
    selectedArtifactKind: selectedTerminalArtifactKind,
    selectedArtifactRef: selectedArtifactRefForResult,
    rejectedCandidates: auditRejectedCandidates,
    wroteVisibleFields,
    forbiddenPreAuthorityVisibleFields,
  };
  let result: HelixTerminalAuthoritySingleWriterResult = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    artifactId: "terminal_authority_single_writer",
    schemaVersion: "helix.terminal_authority_single_writer.v1",
    turn_id: input.turnId,
    selectedArtifactKind: selectedTerminalArtifactKind,
    selectedArtifactRef: selectedArtifactRefForResult,
    selected_terminal_artifact_ref: selectedArtifactRefForResult,
    selected_terminal_artifact_kind: selectedTerminalArtifactKind,
    visible_text: visibleText,
    assistant_answer: false,
    source: resultSource,
    rejected_candidates: rejectedCandidates,
    writes: {
      payload_text: visibleText,
      payload_answer: visibleText,
      payload_assistant_answer: visibleText,
      payload_selected_final_answer: visibleText,
      terminal_presentation_concise_text: visibleText,
      debug_selected_final_answer: visibleText,
    },
    wroteVisibleFields,
    forbiddenPreAuthorityVisibleFields,
    audit: terminalAuthoritySingleWriterAudit,
    integrity: {
      single_writer_applied: true,
      terminal_authority_single_writer_audit: terminalAuthoritySingleWriterAudit,
      forbidden_pre_authority_visible_fields: forbiddenPreAuthorityVisibleFields,
      visible_matches_selected_artifact: !selectedArtifactTextForIntegrity || visibleText === selectedArtifactTextForIntegrity,
      visible_matches_draft: !draftText || visibleText === draftText || Boolean(selectedMaterializedAnswerText?.startsWith(draftText)),
      stale_failure_visible: isStaleWorkspaceFailureText(visibleText),
      receipt_visible_as_answer: receiptVisibleAsAnswer,
      post_tool_model_step_satisfied: latestRequiredObservationSequence < 0 || Boolean(
        usableDraftMaterialization ||
        selectedGoalArtifact ||
        selectedReceiptTerminal ||
        (selectedDraft && routeAllowsModelSynthesizedAnswer)
      ),
      legacy_terminal_candidate_count: legacyCandidates.length,
      forbidden_terminal_candidate_count: rejectedCandidates.filter((entry) =>
        entry.reason === "receipt_or_projection" || entry.reason === "route_contract_forbidden"
      ).length,
      payload_mirror_written_after_terminal_selection: true,
      selected_over_direct_answer_text: usableDraftMaterialization && latestDirectAnswerSequence(artifacts) >= 0,
      final_answer_draft_quality_ok: draftMaterialization?.final_answer_draft_quality_gate.ok,
      final_answer_draft_quality_violations: draftMaterialization?.final_answer_draft_quality_gate.violations,
      materialized_terminal_artifact_kind:
        selectedTerminalArtifactKind ?? draftMaterialization?.materialized_terminal_artifact_kind ?? null,
      materialized_terminal_artifact_ref:
        selectedArtifactRefForResult ?? draftMaterialization?.materialized_terminal_artifact_ref ?? null,
      materialization_blocked_reason: draftMaterialization?.blocked_reason ?? null,
      itinerary_observation_criteria_satisfied: itineraryObservationCriteriaSatisfied,
      missing_itinerary_families: missingItineraryFamilies,
      compound_materialized_draft_can_satisfy_terminal: compoundMaterializedDraftCanSatisfyTerminal,
      docs_draft_materialization_matches_required_goal: docsDraftMaterializationMatchesRequiredGoal,
      repo_draft_materialization_matches_required_goal: repoDraftMaterializationMatchesRequiredGoal,
      deterministic_receipt_fallback_draft_found: Boolean(deterministicReceiptFallbackDraft),
      deterministic_receipt_fallback_can_surface: deterministicReceiptFallbackCanSurface,
      stage_play_reflection_observation_observed: stagePlayReflectionObservationObserved,
      early_deterministic_receipt_fallback_can_surface: earlyDeterministicReceiptFallbackCanSurface,
    },
  };
  result = applyTerminalProjectionKindGuard(input.payload, result);
  const selectedTerminalArtifactKindForMirror = readString(result.selected_terminal_artifact_kind);
  const selectedTerminalArtifactRefForMirror = readString(result.selected_terminal_artifact_ref);
  const selectedTerminalPayloadForMirror = terminalKindCanMirrorSupport(selectedTerminalArtifactKindForMirror)
    ? selectedTerminalPayloadRecords({
      payload: input.payload,
      selectedTerminalArtifactKind: selectedTerminalArtifactKindForMirror,
      selectedTerminalArtifactRef: selectedTerminalArtifactRefForMirror,
      artifactLedger: artifacts,
    })[0] ?? null
    : null;
  if (
    selectedTerminalArtifactKindForMirror &&
    selectedTerminalPayloadForMirror &&
    !readRecord(input.payload[selectedTerminalArtifactKindForMirror])
  ) {
    input.payload[selectedTerminalArtifactKindForMirror] = selectedTerminalPayloadForMirror;
  }
  const finalSelectedTerminalSupport = selectedTerminalSupportMirror({
    payload: input.payload,
    selectedTerminalArtifactKind: selectedTerminalArtifactKindForMirror,
    selectedTerminalArtifactRef: selectedTerminalArtifactRefForMirror,
    artifactLedger: artifacts,
  });
  input.payload.selected_terminal_support_refs = finalSelectedTerminalSupport.supportRefs;
  input.payload.selected_terminal_support_refs_count = finalSelectedTerminalSupport.supportRefs.length;
  input.payload.terminal_synthesis_support_refs = finalSelectedTerminalSupport.supportRefs;
  input.payload.terminal_synthesis_support_refs_count = finalSelectedTerminalSupport.supportRefs.length;
  input.payload.selected_terminal_subgoal_observation_refs = finalSelectedTerminalSupport.subgoalObservationRefs;
  input.payload.selected_terminal_subgoal_observation_refs_count =
    finalSelectedTerminalSupport.subgoalObservationRefs.length;
  input.payload.terminal_synthesis_subgoal_observation_refs = finalSelectedTerminalSupport.subgoalObservationRefs;
  input.payload.terminal_synthesis_subgoal_observation_refs_count =
    finalSelectedTerminalSupport.subgoalObservationRefs.length;
  input.payload.selected_terminal_source_families = finalSelectedTerminalSupport.sourceFamilies;
  result = {
    ...result,
    selected_terminal_support_refs: finalSelectedTerminalSupport.supportRefs,
    selected_terminal_support_refs_count: finalSelectedTerminalSupport.supportRefs.length,
    selected_terminal_subgoal_observation_refs: finalSelectedTerminalSupport.subgoalObservationRefs,
    selected_terminal_subgoal_observation_refs_count: finalSelectedTerminalSupport.subgoalObservationRefs.length,
    selected_terminal_source_families: finalSelectedTerminalSupport.sourceFamilies,
  };

  syncTerminalAnswerAuthorityFromSingleWriterResult(input.payload, result);
  input.payload.terminal_authority_single_writer = result;
  input.payload.terminal_candidate_rejections = auditRejectedCandidates;
  input.payload.legacy_terminal_candidates = legacyCandidates;
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.terminal_answer_authority = input.payload.terminal_answer_authority;
    debug.terminal_authority_single_writer = result;
    debug.terminal_candidate_rejections = auditRejectedCandidates;
    debug.legacy_terminal_candidates = legacyCandidates;
    debug.terminal_artifact_kind = input.payload.terminal_artifact_kind;
    debug.final_answer_source = input.payload.final_answer_source;
    debug.terminal_error_code = input.payload.terminal_error_code;
    debug.terminal_failure_text = input.payload.terminal_failure_text;
    debug.selected_final_answer = input.payload.selected_final_answer;
    debug.answer = input.payload.answer;
    debug.text = input.payload.text;
    debug.terminal_presentation = input.payload.terminal_presentation;
    debug.selected_terminal_support_refs = input.payload.selected_terminal_support_refs;
    debug.selected_terminal_support_refs_count = input.payload.selected_terminal_support_refs_count;
    debug.terminal_synthesis_support_refs = input.payload.terminal_synthesis_support_refs;
    debug.terminal_synthesis_support_refs_count = input.payload.terminal_synthesis_support_refs_count;
    debug.selected_terminal_subgoal_observation_refs = input.payload.selected_terminal_subgoal_observation_refs;
    debug.selected_terminal_subgoal_observation_refs_count =
      input.payload.selected_terminal_subgoal_observation_refs_count;
    debug.terminal_synthesis_subgoal_observation_refs = input.payload.terminal_synthesis_subgoal_observation_refs;
    debug.terminal_synthesis_subgoal_observation_refs_count =
      input.payload.terminal_synthesis_subgoal_observation_refs_count;
    debug.selected_terminal_source_families = input.payload.selected_terminal_source_families;
    if (input.payload.model_synthesized_answer) debug.model_synthesized_answer = input.payload.model_synthesized_answer;
    if (input.payload.compound_evidence_synthesis_answer) {
      debug.compound_evidence_synthesis_answer = input.payload.compound_evidence_synthesis_answer;
    }
    if (input.payload.compound_research_locator_answer) {
      debug.compound_research_locator_answer = input.payload.compound_research_locator_answer;
    }
    if (input.payload.doc_evidence_synthesis_answer) {
      debug.doc_evidence_synthesis_answer = input.payload.doc_evidence_synthesis_answer;
    }
    if (input.payload.repo_code_evidence_answer) debug.repo_code_evidence_answer = input.payload.repo_code_evidence_answer;
    if (input.payload.scholarly_research_answer) debug.scholarly_research_answer = input.payload.scholarly_research_answer;
    if (input.payload.internet_search_answer) debug.internet_search_answer = input.payload.internet_search_answer;
    if (input.payload.theory_context_reflection_answer) {
      debug.theory_context_reflection_answer = input.payload.theory_context_reflection_answer;
    }
    if (
      selectedTerminalArtifactKindForMirror &&
      selectedTerminalPayloadForMirror &&
      !readRecord(debug[selectedTerminalArtifactKindForMirror])
    ) {
      debug[selectedTerminalArtifactKindForMirror] = selectedTerminalPayloadForMirror;
    }
    if (input.payload.terminal_projection_guard) {
      debug.terminal_projection_guard = input.payload.terminal_projection_guard;
    }
  }

  return result;
}
