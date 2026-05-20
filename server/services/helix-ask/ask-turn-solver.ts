import crypto from "node:crypto";
import type { HelixLoopParityTrace } from "./loop-parity-trace";
import {
  interpretHelixAskPrompt,
  type HelixPromptInterpretation,
} from "./prompt-interpretation";
import {
  buildHelixIntentHypotheses,
  type HelixIntentHypothesis,
  type HelixIntentKind,
  type HelixRouteCandidateForIntent,
} from "./intent-hypothesis";
import {
  arbitrateHelixIntent,
  type HelixIntentArbitration,
} from "./intent-arbitration";
import {
  buildEvidenceReentryGate,
  type HelixEvidenceReentryGate,
} from "./evidence-reentry-gate";
import {
  buildFollowupReasoningGate,
  type HelixFollowupReasoningGate,
} from "./followup-reasoning-gate";

type RecordLike = Record<string, unknown>;

export type HelixAskTurnIntentKind = HelixIntentKind;

export type HelixAskTurnSolverRiskFlag =
  | "classifier_became_decision"
  | "route_selected_before_intent_arbitration"
  | "receipt_terminal_without_reentry"
  | "tool_result_terminal_without_reasoning"
  | "contextual_tool_mention_executed"
  | "negative_constraint_ignored"
  | "primary_secondary_intent_collapsed"
  | "missing_followup_reasoning"
  | "terminal_authority_before_solver_completion";

export type HelixAskTurnSolverTrace = {
  schema: "helix.ask_turn_solver_trace.v1";
  trace_id: string;
  turn_id: string;
  prompt_hash: string;

  prompt_interpretation: HelixPromptInterpretation;
  intent_hypotheses: HelixIntentHypothesis[];
  intent_arbitration: HelixIntentArbitration;
  selected_primary_intent: HelixAskTurnIntentKind | null;
  secondary_intents: HelixAskTurnIntentKind[];

  source_admission_candidates: Array<{
    source_target: string;
    admitted: boolean;
    reason: string;
    evidence_required: boolean;
  }>;

  tool_admission_candidates: Array<{
    tool_family: string;
    tool_id?: string;
    admitted: boolean;
    mutating: boolean;
    reason: string;
  }>;

  evidence_requests: Array<{
    request_id: string;
    source_target: string;
    required: boolean;
    purpose: string;
  }>;

  evidence_results: Array<{
    result_id: string;
    source_kind: string;
    selected_for_answer: boolean;
    rejected_reason?: string;
  }>;

  evidence_reentry: {
    required: boolean;
    completed: boolean;
    skipped_reason?: string;
  };
  evidence_reentry_gate: HelixEvidenceReentryGate;

  followup_reasoning: {
    required: boolean;
    completed: boolean;
    skipped_reason?: string;
  };
  followup_reasoning_gate: HelixFollowupReasoningGate;

  final_arbitration: {
    selected_route: string;
    terminal_artifact_kind: string;
    final_answer_source: string;
    why_complete: string;
    remaining_uncertainty: string[];
  };

  route_authority_ok: boolean;
  poison_audit_ok: boolean;
  terminal_authority_ok: boolean;
  solver_risk_flags: HelixAskTurnSolverRiskFlag[];

  assistant_answer: false;
  raw_content_included: false;

  completed_solver_path: boolean;
  primary_intent: {
    intent_kind: HelixAskTurnIntentKind;
    route: string;
    source_target: string;
    target_kind: string;
    selection_reason: string;
  } | null;
  solver_short_circuit_flags: HelixAskTurnSolverRiskFlag[];
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const sourceRequiresEvidence = (sourceTarget: string): boolean =>
  /visual_capture|procedure_memory|situation_epoch|visual_scene_memory|repo_code|runtime_evidence|docs_viewer|active_doc|world_event/i.test(sourceTarget);

const toolFamilyMutating = (family: string): boolean =>
  /live_pipeline|workspace_action|workstation_action|docs_viewer|process_graph/i.test(family);

const inferToolFamily = (toolId: string): string => {
  if (/^situation-room\.live-source\.|^situation-room\.pipeline\./i.test(toolId)) return "live_pipeline";
  if (/click|open|close|panel|workspace-action|workspace_action/i.test(toolId)) return "workstation_action";
  if (/repo|code|source-tree/i.test(toolId)) return "repo_code";
  if (/docs-viewer|doc[_-]?viewer/i.test(toolId)) return "docs_viewer";
  return "unknown";
};

const sourceTargetFromPayload = (payload: RecordLike): { sourceTarget: string; targetKind: string; reason: string; strength: string } => {
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeContract = readRecord(payload.route_product_contract);
  return {
    sourceTarget: readString(sourceTargetIntent?.target_source) || readString(routeContract?.source_target) || "unknown",
    targetKind: readString(sourceTargetIntent?.target_kind) || readString(sourceTargetIntent?.target_source) || readString(routeContract?.source_target) || "unknown",
    reason: readString(sourceTargetIntent?.precedence_reason) || readString(routeContract?.precedence_reason) || "source_target_admission_trace",
    strength: readString(sourceTargetIntent?.strength) || "unknown",
  };
};

const allowedTerminalProducts = (payload: RecordLike): string[] =>
  readStringArray(readRecord(payload.route_product_contract)?.allowed_terminal_artifact_kinds);

const forbiddenTerminalProducts = (payload: RecordLike): string[] =>
  readStringArray(readRecord(payload.route_product_contract)?.forbidden_terminal_artifact_kinds);

const collectRouteCandidatesForIntent = (payload: RecordLike, selectedRoute: string): HelixRouteCandidateForIntent[] => {
  const preflight = readRecord(payload.ask_turn_preflight_context);
  const candidates = Array.isArray(preflight?.route_candidates) ? preflight.route_candidates : [];
  const normalized = candidates
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      route: readString(entry.route) || "unknown",
      confidence: readNumber(entry.confidence),
      reason: readString(entry.reason) || null,
    }))
    .filter((entry) => entry.route !== "unknown");
  if (selectedRoute && !normalized.some((entry) => entry.route === selectedRoute)) {
    normalized.push({
      route: selectedRoute,
      confidence: null,
      reason: "selected_route",
    });
  }
  return normalized;
};

const buildToolAdmissions = (payload: RecordLike, loopTrace: HelixLoopParityTrace | RecordLike | null): HelixAskTurnSolverTrace["tool_admission_candidates"] => {
  const admittedFamilies = readStringArray(readRecord(payload.tool_call_admission_decision)?.admitted_tool_families);
  const actualCalls = (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const candidates = new Map<string, HelixAskTurnSolverTrace["tool_admission_candidates"][number]>();
  for (const family of admittedFamilies) {
    candidates.set(`family:${family}`, {
      tool_family: family,
      admitted: true,
      mutating: toolFamilyMutating(family),
      reason: "admitted_by_tool_call_admission_decision",
    });
  }
  for (const call of actualCalls) {
    const toolId = readString(call.tool_id);
    const family = readString(call.family) || inferToolFamily(toolId);
    candidates.set(`tool:${toolId || family}`, {
      tool_family: family,
      tool_id: toolId || undefined,
      admitted: call.admitted === true,
      mutating: call.mutating === true,
      reason: call.admitted === true ? "actual_tool_call_matched_admission" : "actual_tool_call_missing_admission",
    });
  }
  return Array.from(candidates.values());
};

const buildEvidenceResults = (loopTrace: HelixLoopParityTrace | RecordLike | null): HelixAskTurnSolverTrace["evidence_results"] => {
  const observations = (Array.isArray(loopTrace?.observations_created) ? loopTrace.observations_created : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const selected = new Set(readStringArray(loopTrace?.evidence_selected_for_answer));
  const rejected = (Array.isArray(loopTrace?.evidence_rejected_for_answer) ? loopTrace.evidence_rejected_for_answer : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const results: HelixAskTurnSolverTrace["evidence_results"] = observations.map((observation) => {
    const id = readString(observation.observation_id) || "unknown_observation";
    return {
      result_id: id,
      source_kind: readString(observation.source_kind) || "observation",
      selected_for_answer: selected.has(id),
    };
  });
  for (const ref of selected) {
    if (!results.some((entry) => entry.result_id === ref)) {
      results.push({
        result_id: ref,
        source_kind: "selected_evidence_ref",
        selected_for_answer: true,
      });
    }
  }
  for (const entry of rejected) {
    const ref = readString(entry.ref) || "unknown_rejected_ref";
    results.push({
      result_id: ref,
      source_kind: "rejected_evidence_ref",
      selected_for_answer: false,
      rejected_reason: readString(entry.reason) || "rejected",
    });
  }
  return results;
};

const buildRiskFlags = (input: {
  payload: RecordLike;
  loopTrace: HelixLoopParityTrace | RecordLike | null;
  sourceTarget: string;
  selectedRoute: string;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  primary: HelixAskTurnIntentKind;
  secondary: HelixAskTurnIntentKind[];
  contextualToolMentions: HelixPromptInterpretation["contextual_tool_mentions"];
  negativeConstraints: string[];
  actualToolCalls: RecordLike[];
  evidenceReentryRequired: boolean;
  evidenceReentryCompleted: boolean;
  followupRequired: boolean;
  followupCompleted: boolean;
  finalArbitrationRan: boolean;
  routeAuthorityOk: boolean;
  terminalAuthorityOk: boolean;
  evidenceReentryViolationCodes: string[];
  followupReasoningRequired: boolean;
  followupReasoningCompleted: boolean;
}): HelixAskTurnSolverRiskFlag[] => {
  const unexpectedToolCalls = readStringArray(input.loopTrace?.unexpected_tool_calls);
  const actualToolIds = input.actualToolCalls.map((entry) => readString(entry.tool_id)).filter(Boolean);
  const mutatingToolExecuted = input.actualToolCalls.some((entry) => entry.mutating === true);
  const routeCandidates = readStringArray(readRecord(input.payload.ask_turn_preflight_context)?.route_candidate_labels);
  return unique([
    !readRecord(input.payload.source_target_intent) && routeCandidates.length > 0
      ? "classifier_became_decision"
      : null,
    !input.primary && input.selectedRoute !== "unknown"
      ? "route_selected_before_intent_arbitration"
      : null,
    input.evidenceReentryViolationCodes.includes("receipt_terminal_without_reentry")
      ? "receipt_terminal_without_reentry"
      : null,
    actualToolIds.length > 0 && input.followupRequired && !input.followupCompleted
      ? "tool_result_terminal_without_reasoning"
      : null,
    input.contextualToolMentions.length > 0 && (mutatingToolExecuted || unexpectedToolCalls.length > 0)
      ? "contextual_tool_mention_executed"
      : null,
    input.negativeConstraints.length > 0 && (mutatingToolExecuted || /receipt/i.test(input.finalAnswerSource))
      ? "negative_constraint_ignored"
      : null,
    input.secondary.length > 0 && input.primary === "control_command" && /content|situation_context|procedure/i.test(input.selectedRoute)
      ? "primary_secondary_intent_collapsed"
      : null,
    input.followupReasoningRequired && !input.followupReasoningCompleted
      ? "missing_followup_reasoning"
      : null,
    input.terminalAuthorityOk && (!input.finalArbitrationRan || !input.routeAuthorityOk)
      ? "terminal_authority_before_solver_completion"
      : null,
  ].filter((entry): entry is HelixAskTurnSolverRiskFlag => Boolean(entry)));
};

export function buildAskTurnSolverTrace(input: {
  turnId: string;
  promptText: string;
  selectedRoute: string;
  terminalArtifactKind: string | null | undefined;
  finalAnswerSource: string | null | undefined;
  payload: RecordLike;
  loopParityTrace?: HelixLoopParityTrace | RecordLike | null;
}): HelixAskTurnSolverTrace {
  const promptText = input.promptText;
  const terminalArtifactKind = readString(input.terminalArtifactKind) || "unknown";
  const finalAnswerSource = readString(input.finalAnswerSource) || "unknown";
  const loopTrace = (input.loopParityTrace ?? readRecord(input.payload.loop_parity_trace)) as HelixLoopParityTrace | RecordLike | null;
  const sourceTargetInfo = sourceTargetFromPayload(input.payload);
  const promptInterpretation = interpretHelixAskPrompt(promptText);
  const routeCandidatesForIntent = collectRouteCandidatesForIntent(input.payload, input.selectedRoute);
  const terminalProductsAllowed = allowedTerminalProducts(input.payload);
  const terminalProductsForbidden = forbiddenTerminalProducts(input.payload);
  const intentHypotheses = buildHelixIntentHypotheses({
    promptText,
    promptInterpretation,
    selectedRoute: input.selectedRoute,
    sourceTarget: sourceTargetInfo.sourceTarget,
    routeCandidates: routeCandidatesForIntent,
    terminalProductsAllowed,
    terminalProductsForbidden,
  });
  const intentArbitration = arbitrateHelixIntent({
    promptInterpretation,
    hypotheses: intentHypotheses,
    routeCandidates: routeCandidatesForIntent,
    terminalProductsAllowed,
    terminalProductsForbidden,
  });
  const primary = intentArbitration.selected_primary_intent_kind;
  const secondary = intentArbitration.secondary_intent_ids
    .map((id) => intentHypotheses.find((entry) => entry.id === id)?.kind)
    .filter((kind): kind is HelixAskTurnIntentKind => Boolean(kind));
  const evidenceRequired = sourceRequiresEvidence(sourceTargetInfo.sourceTarget);
  const evidenceResults = buildEvidenceResults(loopTrace);
  const finalArbitrationRan = Boolean(readRecord(input.payload.route_authority_audit) && readRecord(input.payload.poison_audit) && readRecord(input.payload.terminal_answer_authority));
  const evidenceReentryGate = buildEvidenceReentryGate({
    turnId: input.turnId,
    payload: input.payload,
    loopTrace,
    primaryIntent: primary,
    terminalArtifactKind,
    finalAnswerSource,
    finalArbitrationRan,
    sourceEvidenceRequired: evidenceRequired,
    allowedTerminalProducts: terminalProductsAllowed,
  });
  const followupReasoningGate = buildFollowupReasoningGate({
    turnId: input.turnId,
    primaryIntent: primary,
    secondaryIntentKinds: secondary,
    sourceTarget: sourceTargetInfo.sourceTarget,
    terminalArtifactKind,
    selectedEvidenceCount: evidenceReentryGate.selected_evidence_refs.length,
    conflictingHypotheses: intentHypotheses.length > 1 && secondary.length > 0,
    finalArbitrationRan,
  });
  const routeAuthorityOk = readBoolean(loopTrace?.route_authority_ok) || readBoolean(readRecord(input.payload.route_authority_audit)?.route_authority_ok);
  const poisonAuditOk = readBoolean(loopTrace?.poison_audit_ok) || readBoolean(readRecord(input.payload.poison_audit)?.ok);
  const terminalAuthorityOk = readBoolean(loopTrace?.terminal_authority_ok) || readBoolean(readRecord(input.payload.terminal_answer_authority)?.server_authoritative);
  const actualToolCalls = (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const solverRiskFlags = buildRiskFlags({
    payload: input.payload,
    loopTrace,
    sourceTarget: sourceTargetInfo.sourceTarget,
    selectedRoute: input.selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    primary,
    secondary,
    contextualToolMentions: promptInterpretation.contextual_tool_mentions,
    negativeConstraints: promptInterpretation.negative_constraints,
    actualToolCalls,
    evidenceReentryRequired: evidenceReentryGate.required,
    evidenceReentryCompleted: evidenceReentryGate.completed,
    followupRequired: followupReasoningGate.required,
    followupCompleted: followupReasoningGate.completed,
    finalArbitrationRan,
    routeAuthorityOk,
    terminalAuthorityOk,
    evidenceReentryViolationCodes: evidenceReentryGate.violation_codes,
    followupReasoningRequired: followupReasoningGate.required,
    followupReasoningCompleted: followupReasoningGate.completed,
  });
  const completedSolverPath =
    finalArbitrationRan &&
    routeAuthorityOk &&
    poisonAuditOk &&
    terminalAuthorityOk &&
    evidenceReentryGate.completed &&
    followupReasoningGate.completed &&
    solverRiskFlags.length === 0;

  return {
    schema: "helix.ask_turn_solver_trace.v1",
    trace_id: `ask-turn-solver:${hashShort([input.turnId, promptText, input.selectedRoute, terminalArtifactKind])}`,
    turn_id: input.turnId,
    prompt_hash: hashShort(promptText),
    prompt_interpretation: promptInterpretation,
    intent_hypotheses: intentHypotheses,
    intent_arbitration: intentArbitration,
    selected_primary_intent: primary,
    secondary_intents: secondary,
    source_admission_candidates: sourceTargetInfo.sourceTarget === "unknown"
      ? []
      : [{
          source_target: sourceTargetInfo.sourceTarget,
          admitted: true,
          reason: sourceTargetInfo.reason,
          evidence_required: evidenceRequired,
        }],
    tool_admission_candidates: buildToolAdmissions(input.payload, loopTrace),
    evidence_requests: [{
      request_id: `evidence_request:${hashShort([input.turnId, sourceTargetInfo.sourceTarget, input.selectedRoute])}`,
      source_target: sourceTargetInfo.sourceTarget,
      required: evidenceReentryGate.required,
      purpose: evidenceReentryGate.required
        ? "provide source evidence before final arbitration"
        : "confirm terminal product contract without source evidence",
    }],
    evidence_results: evidenceResults,
    evidence_reentry: {
      required: evidenceReentryGate.required,
      completed: evidenceReentryGate.completed,
      ...(evidenceReentryGate.completed ? {} : { skipped_reason: "terminal_selection_missing_after_required_evidence" }),
    },
    evidence_reentry_gate: evidenceReentryGate,
    followup_reasoning: {
      required: followupReasoningGate.required,
      completed: followupReasoningGate.completed,
      ...(followupReasoningGate.completed ? {} : { skipped_reason: followupReasoningGate.skipped_reason ?? "final_arbitration_missing_after_evidence_or_tool_result" }),
    },
    followup_reasoning_gate: followupReasoningGate,
    final_arbitration: {
      selected_route: input.selectedRoute,
      terminal_artifact_kind: terminalArtifactKind,
      final_answer_source: finalAnswerSource,
      why_complete: completedSolverPath
        ? "route authority, poison audit, terminal authority, evidence re-entry, and follow-up reasoning gates completed"
        : "solver path recorded with missing or risky authority gates",
      remaining_uncertainty: solverRiskFlags,
    },
    route_authority_ok: routeAuthorityOk,
    poison_audit_ok: poisonAuditOk,
    terminal_authority_ok: terminalAuthorityOk,
    solver_risk_flags: solverRiskFlags,
    assistant_answer: false,
    raw_content_included: false,
    completed_solver_path: completedSolverPath,
    primary_intent: sourceTargetInfo.sourceTarget === "unknown"
      ? null
      : {
          intent_kind: primary,
          route: input.selectedRoute,
          source_target: sourceTargetInfo.sourceTarget,
          target_kind: sourceTargetInfo.targetKind,
          selection_reason: sourceTargetInfo.reason,
        },
    solver_short_circuit_flags: solverRiskFlags,
  };
}
