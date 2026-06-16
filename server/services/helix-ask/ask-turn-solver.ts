import crypto from "node:crypto";
import type { HelixLoopParityTrace } from "./loop-parity-trace";
import type { HelixCapabilityPlan } from "@shared/helix-capability-plan";
import type { HelixCapabilityResult } from "@shared/helix-capability-result";
import type { HelixCapabilityLifecycleLedger } from "@shared/helix-capability-lifecycle-ledger";
import type { HelixProcedureEvidenceRetrievalPlan } from "@shared/helix-procedure-evidence-retrieval-plan";
import type { HelixProcedureEvidenceRetrievalResult } from "@shared/helix-procedure-evidence-retrieval-result";
import type { HelixSolverInstructionFrame } from "@shared/helix-solver-instruction-frame";
import type { HelixSolverArtifactReentryAudit } from "@shared/helix-solver-artifact-reentry-audit";
import type { HelixSolverSubgoalLedger } from "@shared/helix-solver-subgoal";
import type { HelixSolverRetryPolicy } from "@shared/helix-solver-retry-policy";
import {
  interpretHelixAskPrompt,
  type HelixCompoundPromptContract,
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
import type { HelixLiveSourceIdentityAudit } from "./live-source-identity-audit";
import type { HelixCompoundPromptCoverageGate } from "./compound-prompt-coverage-gate";
import {
  detectRepoConcept,
  type RepoConceptDetection,
} from "./repo-concept-detector";
import {
  buildToolUseRestatement,
  type ToolUseRestatementV1,
} from "./internet-search-intent";
import { contextualToolSuppressionBlocksFamily } from "./contextual-tool-admission";
import type { HelixCommittedAskRoute } from "@shared/helix-committed-ask-route";
import {
  buildCommittedAskRoute,
  evaluateCommittedAskRouteCompatibility,
  readCommittedAskRoute,
} from "./committed-ask-route";

type RecordLike = Record<string, unknown>;

export type HelixAskTurnIntentKind = HelixIntentKind;

export type HelixAskTurnSolverRiskFlag =
  | "classifier_became_decision"
  | "route_selected_before_intent_arbitration"
  | "receipt_terminal_without_reentry"
  | "tool_result_terminal_without_reasoning"
  | "blocked_contextual_tool_executed"
  | "negative_constraint_ignored"
  | "primary_secondary_intent_collapsed"
  | "missing_followup_reasoning"
  | "terminal_authority_before_solver_completion";

export type HelixAskTurnSolverHardFailureCode =
  | "solver_trace_missing"
  | "intent_arbitration_missing"
  | "classifier_became_decision"
  | "route_selected_before_intent_arbitration"
  | "blocked_contextual_tool_executed"
  | "receipt_terminal_without_reentry"
  | "missing_followup_reasoning"
  | "terminal_authority_before_solver_completion"
  | "solver_path_incomplete_before_terminal"
  | "poison_clean_but_authority_failed"
  | "route_contract_missing"
  | "hard_source_target_allowed_no_tool_direct"
  | "repo_evidence_required_before_answer"
  | "compound_prompt_coverage_incomplete";

export type HelixAskTurnSolverHardGate = {
  schema: "helix.ask_turn_solver_hard_gate.v1";
  turn_id: string;
  applies: boolean;
  failed: boolean;
  failure_codes: HelixAskTurnSolverHardFailureCode[];
  primary_failure_code: HelixAskTurnSolverHardFailureCode | null;
  hard_source_target: boolean;
  complex_prompt: boolean;
  pure_control_or_status_receipt_allowed: boolean;
  failure_details: Array<{
    code: HelixAskTurnSolverHardFailureCode;
    reason: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixAskTurnSolverTrace = {
  schema: "helix.ask_turn_solver_trace.v1";
  trace_id: string;
  turn_id: string;
  prompt_hash: string;

  prompt_interpretation: HelixPromptInterpretation;
  tool_use_restatement: ToolUseRestatementV1;
  repo_concept_detection?: RepoConceptDetection;
  compound_prompt_contract?: HelixCompoundPromptContract;
  compound_prompt_coverage?: {
    schema: "helix.compound_prompt_coverage.v1";
    required_requirement_ids: string[];
    answered_requirement_ids: string[];
    missing_requirement_ids: string[];
    coverage: "complete" | "partial" | "none" | "not_compound";
    final_answer_must_cover_all: boolean;
    assistant_answer: false;
    raw_content_included: false;
  };
  compound_prompt_coverage_gate?: HelixCompoundPromptCoverageGate;
  committed_ask_route?: HelixCommittedAskRoute;
  committed_route_compatibility?: {
    schema: "helix.committed_ask_route_compatibility.v1";
    turn_id: string;
    compatible: boolean;
    violations: string[];
    assistant_answer: false;
    raw_content_included: false;
  };
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

  contextual_tool_audit: {
    schema: "helix.contextual_tool_audit.v1";
    contextual_tool_mention_present: boolean;
    contextual_tool_family_blocked: boolean;
    blocked_contextual_tool_executed: boolean;
    blocked_families: string[];
    executed_blocked_tool_ids: string[];
    assistant_answer: false;
    raw_content_included: false;
  };

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
  live_source_identity_audit?: HelixLiveSourceIdentityAudit;
  live_source_identity_audit_ref?: string | null;
  capability_plan?: HelixCapabilityPlan;
  capability_result?: HelixCapabilityResult;
  capability_lifecycle_ledger?: HelixCapabilityLifecycleLedger;
  procedure_evidence_retrieval_plan?: HelixProcedureEvidenceRetrievalPlan;
  procedure_evidence_retrieval_result?: HelixProcedureEvidenceRetrievalResult;
  solver_instruction_frame?: HelixSolverInstructionFrame;
  solver_artifact_reentry_audit?: HelixSolverArtifactReentryAudit;
  solver_subgoal_ledger?: HelixSolverSubgoalLedger;
  solver_retry_policy?: HelixSolverRetryPolicy;
  solver_retry_policies?: HelixSolverRetryPolicy[];

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
  hard_gate?: HelixAskTurnSolverHardGate;
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

const buildCompoundPromptCoverage = (
  contract: HelixCompoundPromptContract,
  finalAnswerText: string,
): NonNullable<HelixAskTurnSolverTrace["compound_prompt_coverage"]> => {
  const required = contract.requirements.filter((requirement) => requirement.required);
  const normalizedAnswer = finalAnswerText.toLowerCase();
  const answered = required.filter((requirement) => {
    const keywords = requirement.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 5)
      .slice(0, 5);
    return keywords.length > 0 && keywords.some((word) => normalizedAnswer.includes(word));
  });
  const answeredIds = answered.map((requirement) => requirement.id);
  const missingIds = required
    .filter((requirement) => !answeredIds.includes(requirement.id))
    .map((requirement) => requirement.id);
  return {
    schema: "helix.compound_prompt_coverage.v1",
    required_requirement_ids: required.map((requirement) => requirement.id),
    answered_requirement_ids: answeredIds,
    missing_requirement_ids: missingIds,
    coverage:
      required.length === 0
        ? "not_compound"
        : missingIds.length === 0
          ? "complete"
          : answeredIds.length > 0
            ? "partial"
            : "none",
    final_answer_must_cover_all: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const readTerminalGoalFrame = (payload: RecordLike): { goalKind: string; requiredTerminalKind: string } => {
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const universalGoalFrame = readRecord(payload.universal_goal_frame);
  const universalUserGoal = readRecord(universalGoalFrame?.user_goal);
  return {
    goalKind:
      readString(canonicalGoalFrame?.goal_kind) ||
      readString(universalGoalFrame?.goal_kind) ||
      readString(universalUserGoal?.goal_kind),
    requiredTerminalKind:
      readString(canonicalGoalFrame?.required_terminal_kind) ||
      readString(universalGoalFrame?.required_terminal_kind) ||
      readString(universalUserGoal?.required_terminal_kind),
  };
};

const terminalMatchesCanonicalGoalContract = (payload: RecordLike, terminalArtifactKind: string): boolean => {
  const goalFrame = readTerminalGoalFrame(payload);
  return (
    goalFrame.requiredTerminalKind === terminalArtifactKind &&
    Boolean(goalFrame.goalKind) &&
    !/^(?:unknown|ambiguous)$/i.test(goalFrame.goalKind)
  );
};

const terminalMatchesEvidenceProductContract = (payload: RecordLike, terminalArtifactKind: string): boolean => {
  if (/receipt/i.test(terminalArtifactKind)) return false;
  const contract = readRecord(payload.route_product_contract);
  if (readString(contract?.schema) !== "helix.route_product_contract.v1") return false;
  const allowed = readStringArray(contract?.allowed_terminal_artifact_kinds);
  const forbidden = readStringArray(contract?.forbidden_terminal_artifact_kinds);
  const evidenceTerminals = new Set([
    "active_doc_identity",
    "doc_location_result",
    "doc_location_matches",
    "doc_evidence_location",
    "doc_summary",
    "repo_code_evidence_answer",
    "repo_entity_definition",
    "repo_code_evidence_observation",
    "procedure_evidence_retrieval_result",
    "situation_context_pack",
    "visual_context_pack",
    "visual_frame_evidence",
    "audio_transcript_context_pack",
    "note_context_pack",
  ]);
  return evidenceTerminals.has(terminalArtifactKind) && allowed.includes(terminalArtifactKind) && !forbidden.includes(terminalArtifactKind);
};

const compliantContextualToolSuppressionAllowsDirectAnswer = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  contextualToolMentions: HelixPromptInterpretation["contextual_tool_mentions"];
  contextualToolAudit: HelixAskTurnSolverTrace["contextual_tool_audit"];
  negativeConstraints: string[];
  actualToolCalls: RecordLike[];
}): boolean => {
  if (input.terminalArtifactKind !== "direct_answer_text") return false;
  if (/receipt|typed_failure|request_user_input/i.test(input.finalAnswerSource)) return false;
  if (!terminalMatchesCanonicalGoalContract(input.payload, input.terminalArtifactKind)) return false;
  if (input.contextualToolMentions.length === 0 && input.negativeConstraints.length === 0) return false;
  if (input.contextualToolAudit.blocked_contextual_tool_executed) return false;
  if (input.actualToolCalls.length > 0) return false;
  return true;
};

const terminalAllowedByCanonicalOrCompliantConstraintPolicy = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  contextualToolMentions: HelixPromptInterpretation["contextual_tool_mentions"];
  contextualToolAudit: HelixAskTurnSolverTrace["contextual_tool_audit"];
  negativeConstraints: string[];
  actualToolCalls: RecordLike[];
}): boolean =>
  (
    terminalMatchesCanonicalGoalContract(input.payload, input.terminalArtifactKind) &&
    input.contextualToolMentions.length === 0 &&
    input.negativeConstraints.length === 0
  ) ||
  (
    terminalMatchesEvidenceProductContract(input.payload, input.terminalArtifactKind) &&
    input.negativeConstraints.length === 0
  ) ||
  compliantContextualToolSuppressionAllowsDirectAnswer(input);

const sourceTargeted = new Set([
  "visual_capture",
  "procedure_memory",
  "conversation_memory",
  "situation_epoch",
  "visual_scene_memory",
  "repo_code",
  "runtime_evidence",
  "workspace_diagnostic",
  "docs_viewer",
  "active_doc",
  "internet_search",
  "scholarly_research",
  "process_graph",
  "live_pipeline",
  "world_event",
  "active_note",
]);

const sourceRequiresEvidence = (sourceTarget: string): boolean =>
  /visual_capture|procedure_memory|conversation_memory|situation_epoch|visual_scene_memory|repo_code|runtime_evidence|workspace_diagnostic|docs_viewer|active_doc|world_event|internet_search|scholarly_research/i.test(sourceTarget);

const toolFamilyMutating = (family: string): boolean =>
  /live_pipeline|workspace_action|workstation_action|docs_viewer|process_graph|notes/i.test(family);

const inferToolFamily = (toolId: string): string => {
  if (/scholarly[-_.]?research|lookup[_-]?papers|fetch[_-]?full[_-]?text|semantic[-_.]?scholar|openalex|pubmed|crossref/i.test(toolId)) return "scholarly_research";
  if (/theory[-_.]?locator|reflect[_-]?theory[_-]?context|theory[_-]?context[_-]?reflection|badge[_-]?graph/i.test(toolId)) return "theory_locator";
  if (/internet[-_.]?search|web[-_.]?research|web\.search/i.test(toolId)) return "internet_search";
  if (/^live_env\./i.test(toolId)) return "live_environment";
  if (/^situation-room\.live-source\.|^situation-room\.pipeline\./i.test(toolId)) return "live_pipeline";
  if (/workspace[_-]?os|workspace_diagnostic/i.test(toolId)) return "workspace_diagnostic";
  if (/workspace[-_.]?directory/i.test(toolId)) return "workspace_directory";
  if (/click|open|close|panel|workspace-action|workspace_action/i.test(toolId)) return "workstation_action";
  if (/workstation-notes|note/i.test(toolId)) return "notes";
  if (/repo|code|source-tree/i.test(toolId)) return "repo_code";
  if (/docs-viewer|doc[_-]?viewer/i.test(toolId)) return "docs_viewer";
  return "unknown";
};

const CONTEXTUAL_TOOL_AUDIT_FAMILIES = [
  "docs_viewer",
  "scholarly_research",
  "internet_search",
  "theory_locator",
  "workstation_action",
  "notes",
  "repo_code",
  "live_environment",
  "live_pipeline",
  "process_graph",
  "calculator",
  "workspace_directory",
] as const;

const contextualMentionBlocksFamily = (
  mention: HelixPromptInterpretation["contextual_tool_mentions"][number],
  family: string,
): boolean =>
  contextualToolSuppressionBlocksFamily(
    {
      tool_admission_suppressed: true,
      suppression_reason: mention.reason === "negated" ? "negated_tool_instruction" : "explanatory_only",
      verb_or_cue: mention.verb_or_cue,
      text: mention.text,
    },
    family,
  );

const blockedFamiliesForContextualMentions = (
  mentions: HelixPromptInterpretation["contextual_tool_mentions"],
): string[] =>
  unique(CONTEXTUAL_TOOL_AUDIT_FAMILIES.filter((family) =>
    mentions.some((mention) => contextualMentionBlocksFamily(mention, family)),
  ));

const buildContextualToolAudit = (input: {
  contextualToolMentions: HelixPromptInterpretation["contextual_tool_mentions"];
  actualToolCalls: RecordLike[];
  unexpectedToolCalls: string[];
}): HelixAskTurnSolverTrace["contextual_tool_audit"] => {
  const blockedFamilies = blockedFamiliesForContextualMentions(input.contextualToolMentions);
  const blockedFamilySet = new Set(blockedFamilies);
  const executedBlockedToolIds = unique([
    ...input.actualToolCalls
      .map((entry) => {
        const toolId = readString(entry.tool_id);
        const family = readString(entry.family) || inferToolFamily(toolId);
        return toolId && blockedFamilySet.has(family) ? toolId : "";
      }),
    ...input.unexpectedToolCalls
      .map((toolId) => {
        const family = inferToolFamily(toolId);
        return toolId && blockedFamilySet.has(family) ? toolId : "";
      }),
  ].filter(Boolean));
  return {
    schema: "helix.contextual_tool_audit.v1",
    contextual_tool_mention_present: input.contextualToolMentions.length > 0,
    contextual_tool_family_blocked: blockedFamilies.length > 0,
    blocked_contextual_tool_executed: executedBlockedToolIds.length > 0,
    blocked_families: blockedFamilies,
    executed_blocked_tool_ids: executedBlockedToolIds,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const sourceTargetFromPayload = (payload: RecordLike): { sourceTarget: string; targetKind: string; reason: string; strength: string } => {
  const committedRoute = readCommittedAskRoute(payload);
  if (committedRoute) {
    return {
      sourceTarget: committedRoute.route.source_target,
      targetKind: committedRoute.route.target_kind,
      reason: committedRoute.route.route_reason,
      strength: committedRoute.route.strength,
    };
  }
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeContract = readRecord(payload.route_product_contract);
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  if (readString(canonicalGoalFrame?.goal_kind) === "note_mutation") {
    return {
      sourceTarget: "active_note",
      targetKind: "active_note",
      reason: "canonical_goal_note_mutation",
      strength: "hard",
    };
  }
  return {
    sourceTarget: readString(sourceTargetIntent?.target_source) || readString(routeContract?.source_target) || "unknown",
    targetKind: readString(sourceTargetIntent?.target_kind) || readString(sourceTargetIntent?.target_source) || readString(routeContract?.source_target) || "unknown",
    reason: readString(sourceTargetIntent?.precedence_reason) || readString(routeContract?.precedence_reason) || "source_target_admission_trace",
    strength: readString(sourceTargetIntent?.strength) || "unknown",
  };
};

const allowedTerminalProducts = (payload: RecordLike): string[] =>
  readCommittedAskRoute(payload)?.canonical_goal.allowed_terminal_artifact_kinds ??
  readStringArray(readRecord(payload.route_product_contract)?.allowed_terminal_artifact_kinds);

const forbiddenTerminalProducts = (payload: RecordLike): string[] =>
  readCommittedAskRoute(payload)?.canonical_goal.forbidden_terminal_artifact_kinds ??
  readStringArray(readRecord(payload.route_product_contract)?.forbidden_terminal_artifact_kinds);

const isHardSourceTarget = (payload: RecordLike, trace: HelixAskTurnSolverTrace | null): boolean => {
  const sourceTarget = readRecord(payload.source_target_intent);
  const traceSource = trace?.primary_intent?.source_target ?? "";
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const modelOnlySourceTarget =
    readString(sourceTarget?.target_source) === "model_only" ||
    readString(sourceTarget?.target_kind) === "general_background" ||
    readString(canonicalGoalFrame?.goal_kind) === "model_only_concept";
  if (modelOnlySourceTarget) return false;
  return (
    readString(sourceTarget?.strength) === "hard" ||
    sourceTarget?.must_enter_backend_ask === true ||
    sourceTargeted.has(readString(sourceTarget?.target_source)) ||
    sourceTargeted.has(traceSource)
  );
};

const isComplexSolverPrompt = (trace: HelixAskTurnSolverTrace | null): boolean => {
  if (!trace) return false;
  const primary = trace.selected_primary_intent;
  if (
    primary === "content_question" ||
    primary === "debug_diagnosis" ||
    primary === "implementation_question" ||
    primary === "procedure_memory_question" ||
    primary === "repo_evidence_question"
  ) {
    return true;
  }
  return (
    trace.secondary_intents.length > 0 ||
    trace.prompt_interpretation.contextual_tool_mentions.length > 0 ||
    trace.prompt_interpretation.negative_constraints.length > 0 ||
    trace.followup_reasoning.required ||
    trace.evidence_reentry.required
  );
};

const pureControlOrStatusReceiptAllowed = (trace: HelixAskTurnSolverTrace | null, payload: RecordLike): boolean => {
  if (!trace) return false;
  const primary = trace.selected_primary_intent;
  const terminal = trace.final_arbitration.terminal_artifact_kind;
  const reason = trace.followup_reasoning_gate.reason;
  const canonicalGoalTerminal =
    terminalMatchesCanonicalGoalContract(payload, terminal) &&
    trace.prompt_interpretation.contextual_tool_mentions.length === 0 &&
    trace.prompt_interpretation.negative_constraints.length === 0;
  const evidenceProductTerminal =
    terminalMatchesEvidenceProductContract(payload, terminal) &&
    trace.prompt_interpretation.negative_constraints.length === 0;
  const canonicalTerminal = canonicalGoalTerminal || evidenceProductTerminal;
  return (
    (
      (
        (primary === "control_command" || primary === "status_question") &&
        /receipt/i.test(terminal) &&
        canonicalTerminal &&
        (reason === "pure_control_receipt" || reason === "pure_status_receipt")
      ) ||
      canonicalTerminal
    ) &&
    (trace.route_authority_ok === true || canonicalTerminal)
  );
};

const pushHardFailure = (
  details: HelixAskTurnSolverHardGate["failure_details"],
  code: HelixAskTurnSolverHardFailureCode,
  reason: string,
): void => {
  if (details.some((entry) => entry.code === code)) return;
  details.push({ code, reason });
};

export function evaluateAskTurnSolverHardGate(input: {
  turnId: string;
  payload: RecordLike;
  trace?: HelixAskTurnSolverTrace | RecordLike | null;
  loopParityTrace?: HelixLoopParityTrace | RecordLike | null;
}): HelixAskTurnSolverHardGate {
  const trace = readRecord(input.trace ?? input.payload.ask_turn_solver_trace) as HelixAskTurnSolverTrace | null;
  const loopTrace = readRecord(input.loopParityTrace ?? input.payload.loop_parity_trace);
  const sourceTarget = readRecord(input.payload.source_target_intent);
  const routeContract = readRecord(input.payload.route_product_contract);
  const routeAuthority = readRecord(input.payload.route_authority_audit);
  const terminalAuthorityPresent = Boolean(readRecord(input.payload.terminal_answer_authority));
  const traceTerminalArtifactKind = readString(trace?.final_arbitration?.terminal_artifact_kind);
  const traceFinalAnswerSource = readString(trace?.final_arbitration?.final_answer_source);
  const typedFailureTerminal =
    traceTerminalArtifactKind === "typed_failure" ||
    traceFinalAnswerSource === "typed_failure" ||
    readString(input.payload.terminal_artifact_kind) === "typed_failure" ||
    readString(input.payload.final_answer_source) === "typed_failure";
  const requestUserInputTerminal =
    traceTerminalArtifactKind === "request_user_input" ||
    readString(input.payload.terminal_artifact_kind) === "request_user_input" ||
    traceFinalAnswerSource === "request_user_input" ||
    readString(input.payload.final_answer_source) === "request_user_input";
  const nonAnswerTerminal = typedFailureTerminal || requestUserInputTerminal;
  const hardSourceTarget = isHardSourceTarget(input.payload, trace);
  const complexPrompt = isComplexSolverPrompt(trace);
  const applies = hardSourceTarget || complexPrompt;
  const details: HelixAskTurnSolverHardGate["failure_details"] = [];
  const allowedPureReceipt = pureControlOrStatusReceiptAllowed(trace, input.payload);
  const canonicalGoalKind = readString(readRecord(input.payload.canonical_goal_frame)?.goal_kind);
  const goalSatisfaction = readRecord(input.payload.goal_satisfaction_evaluation);
  const routeContractApprovedReceiptGoal =
    canonicalGoalKind === "note_mutation" ||
    canonicalGoalKind === "doc_open_best" ||
    canonicalGoalKind === "latest_doc_navigation";
  const goalSatisfactionReceiptAllowed =
    routeContractApprovedReceiptGoal &&
    readString(goalSatisfaction?.satisfaction) === "satisfied" &&
    (
      terminalMatchesCanonicalGoalContract(input.payload, traceTerminalArtifactKind) ||
      terminalMatchesCanonicalGoalContract(input.payload, readString(input.payload.terminal_artifact_kind))
    );
  const terminalReceiptAllowed = allowedPureReceipt || goalSatisfactionReceiptAllowed;
  const actualToolCallsForHardGate = (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const tracePromptInterpretation = trace?.prompt_interpretation;
  const traceContextualToolAudit = trace?.contextual_tool_audit;
  const sourceTargetModelOnly =
    canonicalGoalKind === "model_only_concept" ||
    readString(sourceTarget?.target_source) === "model_only" ||
    readString(sourceTarget?.target_kind) === "general_background";
  const compliantSuppressedDirectAnswerAllowed =
    Boolean(trace && sourceTargetModelOnly && tracePromptInterpretation && traceContextualToolAudit) &&
    readString(goalSatisfaction?.satisfaction) === "satisfied" &&
    readString(goalSatisfaction?.next_decision) === "allow_terminal" &&
    compliantContextualToolSuppressionAllowsDirectAnswer({
      payload: input.payload,
      terminalArtifactKind: traceTerminalArtifactKind || readString(input.payload.terminal_artifact_kind) || "",
      finalAnswerSource: traceFinalAnswerSource || readString(input.payload.final_answer_source) || "",
      contextualToolMentions: tracePromptInterpretation?.contextual_tool_mentions ?? [],
      contextualToolAudit: traceContextualToolAudit as HelixAskTurnSolverTrace["contextual_tool_audit"],
      negativeConstraints: tracePromptInterpretation?.negative_constraints ?? [],
      actualToolCalls: actualToolCallsForHardGate,
    });

  if (!trace) {
    pushHardFailure(details, "solver_trace_missing", "solver trace is required before terminal authority");
  } else {
    if (!readRecord(trace.intent_arbitration)) {
      pushHardFailure(details, "intent_arbitration_missing", "intent arbitration is required before route authority");
    }
    if (
      terminalAuthorityPresent &&
      trace.completed_solver_path === false &&
      trace.final_arbitration.terminal_artifact_kind !== "typed_failure" &&
      trace.final_arbitration.terminal_artifact_kind !== "request_user_input" &&
      !terminalReceiptAllowed &&
      !compliantSuppressedDirectAnswerAllowed
    ) {
      pushHardFailure(details, "solver_path_incomplete_before_terminal", "solver path was incomplete before successful terminal selection");
    }
    if (trace.final_arbitration.selected_route && !trace.selected_primary_intent) {
      pushHardFailure(details, "route_selected_before_intent_arbitration", "selected route exists without a selected primary intent");
    }
    for (const flag of trace.solver_risk_flags) {
      if (flag === "classifier_became_decision") {
        pushHardFailure(details, "classifier_became_decision", "classifier output reached decision authority");
      }
      if (flag === "route_selected_before_intent_arbitration") {
        pushHardFailure(details, "route_selected_before_intent_arbitration", "route was selected before intent arbitration completed");
      }
      if (flag === "blocked_contextual_tool_executed" && !terminalReceiptAllowed) {
        pushHardFailure(details, "blocked_contextual_tool_executed", "a blocked contextual, negated, historical, future, quoted, or screen-visible tool family was actually executed");
      }
      if (flag === "receipt_terminal_without_reentry" && !terminalReceiptAllowed) {
        pushHardFailure(details, "receipt_terminal_without_reentry", "receipt became terminal without solver re-entry for this intent");
      }
      if (flag === "missing_followup_reasoning" && !terminalReceiptAllowed && !nonAnswerTerminal) {
        pushHardFailure(details, "missing_followup_reasoning", "follow-up reasoning was required but not completed");
      }
      if (flag === "terminal_authority_before_solver_completion" && !terminalReceiptAllowed) {
        pushHardFailure(details, "terminal_authority_before_solver_completion", "terminal authority was recorded before solver completion");
      }
    }
    for (const flag of readStringArray(loopTrace?.short_circuit_risk_flags)) {
      if (flag === "route_contract_missing") {
        pushHardFailure(details, "route_contract_missing", "route product contract missing for hard source-target turn");
      }
      if (flag === "hard_source_target_allowed_no_tool_direct") {
        pushHardFailure(details, "hard_source_target_allowed_no_tool_direct", "hard source-target allowed no_tool_direct");
      }
      if (flag === "poison_clean_but_authority_failed" && !terminalReceiptAllowed && !compliantSuppressedDirectAnswerAllowed) {
        pushHardFailure(details, "poison_clean_but_authority_failed", "poison audit was clean while route authority failed");
      }
      if (flag === "terminal_selected_before_observation_finalizer") {
        pushHardFailure(details, "terminal_authority_before_solver_completion", "terminal artifact was selected before solver finalization");
      }
    }
    if (!trace.route_authority_ok && !terminalReceiptAllowed && !nonAnswerTerminal && !compliantSuppressedDirectAnswerAllowed) {
      if (trace.poison_audit_ok) {
        pushHardFailure(details, "poison_clean_but_authority_failed", "poison audit passed but route authority failed");
      } else {
        pushHardFailure(details, "terminal_authority_before_solver_completion", "route authority failed before terminal completion");
      }
    }
  }

  if (hardSourceTarget && (!routeContract || readString(routeContract.schema) !== "helix.route_product_contract.v1")) {
    pushHardFailure(details, "route_contract_missing", "hard source-target turn lacks helix.route_product_contract.v1");
  }
  if (
    hardSourceTarget &&
    canonicalGoalKind !== "note_mutation" &&
    (
      sourceTarget?.allow_no_tool_direct === true ||
      readString(input.payload.terminal_artifact_kind) === "no_tool_direct" ||
      readString(input.payload.final_answer_source) === "no_tool_direct"
    )
  ) {
    pushHardFailure(details, "hard_source_target_allowed_no_tool_direct", "hard source-target cannot use no_tool_direct");
  }
  if (!typedFailureTerminal && routeAuthority?.route_authority_ok === false && readRecord(input.payload.poison_audit)?.ok === true && !terminalReceiptAllowed && !compliantSuppressedDirectAnswerAllowed) {
    pushHardFailure(details, "poison_clean_but_authority_failed", "clean poison audit cannot override failed route authority");
  }
  if (!typedFailureTerminal && routeAuthority?.primary_violation_code === "route_contract_missing") {
    pushHardFailure(details, "route_contract_missing", "route authority audit reported a missing route product contract");
  }
  if (!typedFailureTerminal && routeAuthority?.primary_violation_code === "no_tool_direct_used_for_hard_source_target" && canonicalGoalKind !== "note_mutation") {
    pushHardFailure(details, "hard_source_target_allowed_no_tool_direct", "route authority audit reported no_tool_direct for hard source-target");
  }
  const compoundCoverageGate = readRecord(input.payload.compound_prompt_coverage_gate ?? trace?.compound_prompt_coverage_gate);
  const modelOnlyCompoundCoverage = readRecord(input.payload.model_only_compound_coverage_from_answer ?? trace?.model_only_compound_coverage_from_answer);
  if (
    !typedFailureTerminal &&
    readString(compoundCoverageGate?.schema) === "helix.compound_prompt_coverage_gate.v1" &&
    compoundCoverageGate?.applies === true &&
    compoundCoverageGate?.passed !== true &&
    !(
      readString(modelOnlyCompoundCoverage?.schema) === "helix.model_only_compound_coverage_from_answer.v1" &&
      modelOnlyCompoundCoverage?.passed === true &&
      readString(modelOnlyCompoundCoverage?.route_scope) === "model_only_allowed"
    )
  ) {
    pushHardFailure(
      details,
      "compound_prompt_coverage_incomplete",
      "required compound prompt items were not resolved before terminal authority",
    );
  }
  const repoConceptDetection = readRecord(trace?.repo_concept_detection);
  const repoConceptRequiresEvidence = repoConceptDetection?.require_repo_evidence === true;
  const repoEvidenceSelected = (Array.isArray(trace?.evidence_results) ? trace.evidence_results : [])
    .map((entry) => readRecord(entry))
    .some((entry) => readString(entry?.source_kind) === "repo_code" && entry?.selected_for_answer === true);
  const modelDirectTerminal =
    readString(input.payload.terminal_artifact_kind) === "direct_answer_text" ||
    readString(input.payload.final_answer_source) === "model_direct_answer" ||
    traceTerminalArtifactKind === "direct_answer_text" ||
    traceFinalAnswerSource === "model_direct_answer";
  if (
    !typedFailureTerminal &&
    repoConceptRequiresEvidence &&
    modelDirectTerminal &&
    !repoEvidenceSelected
  ) {
    pushHardFailure(
      details,
      "repo_evidence_required_before_answer",
      "project-internal concept answers require repo_code_evidence_observation before model.direct_answer can terminalize",
    );
  }

  const failureCodes = details.map((entry) => entry.code);
  return {
    schema: "helix.ask_turn_solver_hard_gate.v1",
    turn_id: input.turnId,
    applies,
    failed: applies && failureCodes.length > 0,
    failure_codes: failureCodes,
    primary_failure_code: failureCodes[0] ?? null,
    hard_source_target: hardSourceTarget,
    complex_prompt: complexPrompt,
    pure_control_or_status_receipt_allowed: terminalReceiptAllowed,
    failure_details: details,
    assistant_answer: false,
    raw_content_included: false,
  };
}

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
  const committedRoute = readCommittedAskRoute(payload);
  const admittedFamilies = readStringArray(readRecord(payload.tool_call_admission_decision)?.admitted_tool_families);
  const chosenCapability = readString(readRecord(payload.agent_step_decision)?.chosen_capability);
  const actualCalls = (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const candidates = new Map<string, HelixAskTurnSolverTrace["tool_admission_candidates"][number]>();
  for (const family of committedRoute?.capability_policy.allowed_tool_families ?? []) {
    candidates.set(`committed-family:${family}`, {
      tool_family: family,
      admitted: true,
      mutating: toolFamilyMutating(family),
      reason: "allowed_by_committed_ask_route",
    });
  }
  for (const family of committedRoute?.capability_policy.suppressed_tool_families ?? []) {
    candidates.set(`committed-suppressed-family:${family}`, {
      tool_family: family,
      admitted: false,
      mutating: toolFamilyMutating(family),
      reason: "suppressed_by_committed_ask_route",
    });
  }
  for (const family of admittedFamilies) {
    if (committedRoute?.capability_policy.suppressed_tool_families.includes(family)) continue;
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
    const admittedByFamily = admittedFamilies.includes(family);
    const admittedByChosenCapability = Boolean(chosenCapability && toolId && chosenCapability === toolId);
    const admitted = call.admitted === true || admittedByFamily || admittedByChosenCapability;
    candidates.set(`tool:${toolId || family}`, {
      tool_family: family,
      tool_id: toolId || undefined,
      admitted,
      mutating: call.mutating === true,
      reason: admitted
        ? admittedByChosenCapability
          ? "actual_tool_call_matched_agent_step_decision"
          : "actual_tool_call_matched_admission"
        : "actual_tool_call_missing_admission",
    });
  }
  return Array.from(candidates.values());
};

const isRepoCodeEvidenceArtifact = (entry: RecordLike): boolean => {
  const payload = readRecord(entry.payload);
  const searchable = [
    readString(entry.kind),
    readString(payload?.kind),
    readString(payload?.schema),
    readString(payload?.source_kind),
  ].join(" ");
  return /repo_code_evidence_observation|helix\.repo_code_evidence_observation\.v1|repo_code/i.test(searchable);
};

const buildEvidenceResults = (
  loopTrace: HelixLoopParityTrace | RecordLike | null,
  payload: RecordLike,
): HelixAskTurnSolverTrace["evidence_results"] => {
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
  const ledgerRepoArtifacts = (Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry) && isRepoCodeEvidenceArtifact(entry));
  for (const artifact of ledgerRepoArtifacts) {
    const artifactId = readString(artifact.artifact_id) || readString(readRecord(artifact.payload)?.artifact_id);
    if (!artifactId || results.some((entry) => entry.result_id === artifactId)) continue;
    const artifactPayload = readRecord(artifact.payload);
    results.push({
      result_id: artifactId,
      source_kind: "repo_code",
      selected_for_answer: artifactPayload?.selected_for_answer !== false,
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
  contextualToolAudit: HelixAskTurnSolverTrace["contextual_tool_audit"];
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
  liveSourceIdentityAuditPresent: boolean;
  liveSourceIdentityOk: boolean;
  liveSourceIdentityTerminalAllowed: boolean;
}): HelixAskTurnSolverRiskFlag[] => {
  const actualToolIds = input.actualToolCalls.map((entry) => readString(entry.tool_id)).filter(Boolean);
  const mutatingToolExecuted = input.actualToolCalls.some((entry) => entry.mutating === true);
  const routeCandidates = readStringArray(readRecord(input.payload.ask_turn_preflight_context)?.route_candidate_labels);
  const canonicalTerminalAllowed = terminalAllowedByCanonicalOrCompliantConstraintPolicy({
    payload: input.payload,
    terminalArtifactKind: input.terminalArtifactKind,
    finalAnswerSource: input.finalAnswerSource,
    contextualToolMentions: input.contextualToolMentions,
    contextualToolAudit: input.contextualToolAudit,
    negativeConstraints: input.negativeConstraints,
    actualToolCalls: input.actualToolCalls,
  });
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
    input.contextualToolAudit.blocked_contextual_tool_executed
      ? "blocked_contextual_tool_executed"
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
    input.terminalAuthorityOk &&
    input.terminalArtifactKind !== "typed_failure" &&
    input.terminalArtifactKind !== "request_user_input" &&
    input.finalAnswerSource !== "typed_failure" &&
    input.finalAnswerSource !== "request_user_input" &&
    !canonicalTerminalAllowed &&
    (
      !input.finalArbitrationRan ||
      !input.routeAuthorityOk ||
      (
        input.liveSourceIdentityAuditPresent &&
        !input.liveSourceIdentityOk &&
        !input.liveSourceIdentityTerminalAllowed
      )
    )
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
  const toolUseRestatement = buildToolUseRestatement(promptText);
  const repoConceptDetection = detectRepoConcept(promptText);
  const repoConceptRequiresEvidence = repoConceptDetection.require_repo_evidence === true;
  const compoundContract = promptInterpretation.compound_contract;
  const finalAnswerText =
    readString(input.payload.selected_final_answer) ||
    readString(input.payload.answer) ||
    readString(input.payload.text);
  const compoundCoverage = compoundContract
    ? buildCompoundPromptCoverage(compoundContract, finalAnswerText)
    : null;
  const compoundCoverageGate = readRecord(input.payload.compound_prompt_coverage_gate) as HelixCompoundPromptCoverageGate | null;
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
  const committedAskRoute = buildCommittedAskRoute({
    turnId: input.turnId,
    promptText,
    selectedRoute: input.selectedRoute,
    payload: input.payload,
    promptInterpretation,
    intentArbitration,
    secondaryIntentKinds: secondary,
  });
  input.payload.committed_ask_route = committedAskRoute;
  const committedRouteCompatibility = evaluateCommittedAskRouteCompatibility({
    committedRoute: committedAskRoute,
    payload: input.payload,
  });
  const effectiveSourceTargetInfo = {
    sourceTarget: committedAskRoute.route.source_target,
    targetKind: committedAskRoute.route.target_kind,
    reason: committedAskRoute.route.route_reason,
    strength: committedAskRoute.route.strength,
  };
  const evidenceRequired =
    sourceRequiresEvidence(effectiveSourceTargetInfo.sourceTarget) ||
    repoConceptRequiresEvidence ||
    toolUseRestatement.requiredToolFamilies.includes("internet_search");
  const evidenceResults = buildEvidenceResults(loopTrace, input.payload);
  const repoEvidenceResultSelected = evidenceResults.some((entry) =>
    entry.source_kind === "repo_code" && entry.selected_for_answer,
  );
  const liveSourceIdentityAudit = readRecord(input.payload.live_source_identity_audit) as HelixLiveSourceIdentityAudit | null;
  const liveSourceIdentityAuditRef = readString(liveSourceIdentityAudit?.audit_id) || null;
  const finalArbitrationRan = Boolean(
    (readRecord(input.payload.route_authority_audit) || readBoolean(loopTrace?.route_authority_ok)) &&
    readRecord(input.payload.poison_audit) &&
    readRecord(input.payload.terminal_answer_authority)
  );
  const evidenceReentryGate = buildEvidenceReentryGate({
    turnId: input.turnId,
    payload: input.payload,
    loopTrace,
    primaryIntent: primary,
    terminalArtifactKind,
    finalAnswerSource,
    finalArbitrationRan,
    sourceEvidenceRequired: evidenceRequired,
    allowedTerminalProducts: committedAskRoute.canonical_goal.allowed_terminal_artifact_kinds,
    toolUseRestatement,
  });
  const followupReasoningGate = buildFollowupReasoningGate({
    turnId: input.turnId,
    primaryIntent: primary,
    secondaryIntentKinds: secondary,
    sourceTarget: effectiveSourceTargetInfo.sourceTarget,
    terminalArtifactKind,
    selectedEvidenceCount: evidenceReentryGate.selected_evidence_refs.length,
    conflictingHypotheses: intentHypotheses.length > 1 && secondary.length > 0,
    finalArbitrationRan,
  });
  const routeAuthorityOk = readBoolean(loopTrace?.route_authority_ok) || readBoolean(readRecord(input.payload.route_authority_audit)?.route_authority_ok);
  const poisonAuditOk = readBoolean(loopTrace?.poison_audit_ok) || readBoolean(readRecord(input.payload.poison_audit)?.ok);
  const terminalAuthorityOk = readBoolean(loopTrace?.terminal_authority_ok) || readBoolean(readRecord(input.payload.terminal_answer_authority)?.server_authoritative);
  const goalSatisfaction = readRecord(input.payload.goal_satisfaction_evaluation);
  const routeAuthorizedReceiptTerminalAllowed =
    /receipt/i.test(terminalArtifactKind) &&
    routeAuthorityOk &&
    poisonAuditOk &&
    terminalAuthorityOk &&
    readString(goalSatisfaction?.satisfaction) === "satisfied" &&
    readString(goalSatisfaction?.next_decision) === "allow_terminal" &&
    terminalMatchesCanonicalGoalContract(input.payload, terminalArtifactKind);
  const capabilityResult = readRecord(input.payload.capability_result);
  const routeAuthorizedReceiptEvidenceReentered =
    routeAuthorizedReceiptTerminalAllowed &&
    (
      evidenceReentryGate.completed ||
      capabilityResult?.reentered_solver === true ||
      readStringArray(capabilityResult?.receipt_refs).length > 0
    );
  const effectiveEvidenceReentryGate: typeof evidenceReentryGate = routeAuthorizedReceiptEvidenceReentered
    ? {
        ...evidenceReentryGate,
        completed: true,
        violation_codes: [],
      }
    : evidenceReentryGate;
  const effectiveFollowupReasoningGate: typeof followupReasoningGate = routeAuthorizedReceiptTerminalAllowed
    ? {
        schema: followupReasoningGate.schema,
        turn_id: followupReasoningGate.turn_id,
        required: false,
        completed: true,
        reason: "simple_no_source_turn",
        assistant_answer: false,
        raw_content_included: false,
      }
    : followupReasoningGate;
  const finalTraceTerminalArtifactKind =
    repoConceptRequiresEvidence && repoEvidenceResultSelected && /repo_code_evidence_answer|repo_entity_definition|repo_code_evidence_observation/i.test(terminalArtifactKind)
      ? "repo_code_evidence_answer"
      : terminalArtifactKind;
  const finalTraceAnswerSource =
    repoConceptRequiresEvidence && repoEvidenceResultSelected && finalTraceTerminalArtifactKind === "repo_code_evidence_answer"
      ? "model_synthesis_from_repo_evidence"
      : finalAnswerSource;
  const actualToolCalls = (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const contextualToolAudit = buildContextualToolAudit({
    contextualToolMentions: promptInterpretation.contextual_tool_mentions,
    actualToolCalls,
    unexpectedToolCalls: readStringArray(loopTrace?.unexpected_tool_calls),
  });
  const canonicalTerminalAllowed = terminalAllowedByCanonicalOrCompliantConstraintPolicy({
    payload: input.payload,
    terminalArtifactKind,
    finalAnswerSource,
    contextualToolMentions: promptInterpretation.contextual_tool_mentions,
    contextualToolAudit,
    negativeConstraints: promptInterpretation.negative_constraints,
    actualToolCalls,
  });
  const liveSourceIdentityOk = !liveSourceIdentityAudit || liveSourceIdentityAudit.identity_ok === true;
  const liveSourceIdentityTerminalAllowed =
    terminalArtifactKind === "live_environment_binding_diagnosis" ||
    terminalArtifactKind === "live_source_typed_failure" ||
    terminalArtifactKind === "source_binding_status" ||
    terminalArtifactKind === "source_binding_repair_candidate" ||
    terminalArtifactKind === "typed_failure" ||
    finalAnswerSource === "typed_failure";
  const solverRiskFlags = buildRiskFlags({
    payload: input.payload,
    loopTrace,
    sourceTarget: effectiveSourceTargetInfo.sourceTarget,
    selectedRoute: input.selectedRoute,
    terminalArtifactKind,
    finalAnswerSource,
    primary,
    secondary,
    contextualToolMentions: promptInterpretation.contextual_tool_mentions,
    contextualToolAudit,
    negativeConstraints: promptInterpretation.negative_constraints,
    actualToolCalls,
    evidenceReentryRequired: effectiveEvidenceReentryGate.required,
    evidenceReentryCompleted: effectiveEvidenceReentryGate.completed,
    followupRequired: effectiveFollowupReasoningGate.required,
    followupCompleted: effectiveFollowupReasoningGate.completed,
    finalArbitrationRan,
    routeAuthorityOk,
    terminalAuthorityOk,
    evidenceReentryViolationCodes: effectiveEvidenceReentryGate.violation_codes,
    followupReasoningRequired: effectiveFollowupReasoningGate.required,
    followupReasoningCompleted: effectiveFollowupReasoningGate.completed,
    liveSourceIdentityAuditPresent: Boolean(liveSourceIdentityAudit),
    liveSourceIdentityOk,
    liveSourceIdentityTerminalAllowed,
  });
  const completedSolverPath =
    finalArbitrationRan &&
    (routeAuthorityOk || canonicalTerminalAllowed) &&
    poisonAuditOk &&
    terminalAuthorityOk &&
    liveSourceIdentityOk &&
    effectiveEvidenceReentryGate.completed &&
    effectiveFollowupReasoningGate.completed &&
    solverRiskFlags.length === 0;

  return {
    schema: "helix.ask_turn_solver_trace.v1",
    trace_id: `ask-turn-solver:${hashShort([input.turnId, promptText, input.selectedRoute, terminalArtifactKind])}`,
    turn_id: input.turnId,
    prompt_hash: hashShort(promptText),
    prompt_interpretation: promptInterpretation,
    tool_use_restatement: toolUseRestatement,
    ...(repoConceptDetection.applies ? { repo_concept_detection: repoConceptDetection } : {}),
    ...(compoundContract ? { compound_prompt_contract: compoundContract } : {}),
    ...(compoundCoverage ? { compound_prompt_coverage: compoundCoverage } : {}),
    ...(compoundCoverageGate ? { compound_prompt_coverage_gate: compoundCoverageGate } : {}),
    committed_ask_route: committedAskRoute,
    committed_route_compatibility: committedRouteCompatibility,
    intent_hypotheses: intentHypotheses,
    intent_arbitration: intentArbitration,
    selected_primary_intent: primary,
    secondary_intents: secondary,
    source_admission_candidates: effectiveSourceTargetInfo.sourceTarget === "unknown"
      ? []
      : [{
          source_target: effectiveSourceTargetInfo.sourceTarget,
          admitted: true,
          reason: effectiveSourceTargetInfo.reason,
          evidence_required: evidenceRequired,
        }],
    tool_admission_candidates: buildToolAdmissions(input.payload, loopTrace),
    contextual_tool_audit: contextualToolAudit,
    evidence_requests: toolUseRestatement.requiredToolFamilies.includes("internet_search")
      ? [({
          request_id: `internet-search:${input.turnId}`,
          source_target: "internet_search",
          required: true,
          purpose: toolUseRestatement.currentAffairsRequired
            ? "Search-ground current-affairs claims before final answer"
            : "Search-ground freshness-sensitive claims before final answer",
        })]
      : repoConceptRequiresEvidence
      ? [{
          request_id: `repo-concept:${input.turnId}`,
          source_target: "repo_code",
          required: true,
          purpose: "Explain project-internal concept from repo evidence",
        }]
      : [{
          request_id: `evidence_request:${hashShort([input.turnId, effectiveSourceTargetInfo.sourceTarget, input.selectedRoute])}`,
          source_target: effectiveSourceTargetInfo.sourceTarget,
          required: evidenceReentryGate.required,
          purpose: evidenceReentryGate.required
            ? "provide source evidence before final arbitration"
            : "confirm terminal product contract without source evidence",
        }],
    evidence_results: evidenceResults,
    evidence_reentry: {
      required: effectiveEvidenceReentryGate.required,
      completed: effectiveEvidenceReentryGate.completed,
      ...(effectiveEvidenceReentryGate.completed ? {} : { skipped_reason: "terminal_selection_missing_after_required_evidence" }),
    },
    evidence_reentry_gate: effectiveEvidenceReentryGate,
    followup_reasoning: {
      required: effectiveFollowupReasoningGate.required,
      completed: effectiveFollowupReasoningGate.completed,
      ...(effectiveFollowupReasoningGate.completed ? {} : { skipped_reason: effectiveFollowupReasoningGate.skipped_reason ?? "final_arbitration_missing_after_evidence_or_tool_result" }),
    },
    followup_reasoning_gate: effectiveFollowupReasoningGate,
    ...(liveSourceIdentityAudit
      ? {
          live_source_identity_audit: liveSourceIdentityAudit,
          live_source_identity_audit_ref: liveSourceIdentityAuditRef,
        }
      : {}),
    ...(readRecord(input.payload.capability_plan)?.schema === "helix.capability_plan.v1"
      ? {
          capability_plan: input.payload.capability_plan as HelixCapabilityPlan,
        }
      : {}),
    ...(readRecord(input.payload.capability_result)?.schema === "helix.capability_result.v1"
      ? {
          capability_result: input.payload.capability_result as HelixCapabilityResult,
        }
      : {}),
    ...(readRecord(input.payload.capability_lifecycle_ledger)?.schema === "helix.capability_lifecycle_ledger.v1"
      ? {
          capability_lifecycle_ledger: input.payload.capability_lifecycle_ledger as HelixCapabilityLifecycleLedger,
        }
      : {}),
    ...(readRecord(input.payload.procedure_evidence_retrieval_plan)?.schema === "helix.procedure_evidence_retrieval_plan.v1"
      ? {
          procedure_evidence_retrieval_plan: input.payload.procedure_evidence_retrieval_plan as HelixProcedureEvidenceRetrievalPlan,
        }
      : {}),
    ...(readRecord(input.payload.procedure_evidence_retrieval_result)?.schema === "helix.procedure_evidence_retrieval_result.v1"
      ? {
          procedure_evidence_retrieval_result: input.payload.procedure_evidence_retrieval_result as HelixProcedureEvidenceRetrievalResult,
        }
      : {}),
    ...(readRecord(input.payload.solver_instruction_frame)?.schema === "helix.solver_instruction_frame.v1"
      ? {
          solver_instruction_frame: input.payload.solver_instruction_frame as HelixSolverInstructionFrame,
        }
      : {}),
    ...(readRecord(input.payload.solver_artifact_reentry_audit)?.schema === "helix.solver_artifact_reentry_audit.v1"
      ? {
          solver_artifact_reentry_audit: input.payload.solver_artifact_reentry_audit as HelixSolverArtifactReentryAudit,
        }
      : {}),
    ...(readRecord(input.payload.solver_subgoal_ledger)?.schema === "helix.solver_subgoal_ledger.v1"
      ? {
          solver_subgoal_ledger: input.payload.solver_subgoal_ledger as HelixSolverSubgoalLedger,
        }
      : {}),
    ...(readRecord(input.payload.solver_retry_policy)?.schema === "helix.solver_retry_policy.v1"
      ? {
          solver_retry_policy: input.payload.solver_retry_policy as HelixSolverRetryPolicy,
        }
      : {}),
    ...(Array.isArray(input.payload.solver_retry_policies)
      ? {
          solver_retry_policies: input.payload.solver_retry_policies
            .map((entry: unknown) => readRecord(entry))
            .filter((entry: RecordLike | null): entry is RecordLike => entry?.schema === "helix.solver_retry_policy.v1") as HelixSolverRetryPolicy[],
        }
      : {}),
    final_arbitration: {
      selected_route: input.selectedRoute,
      terminal_artifact_kind: finalTraceTerminalArtifactKind,
      final_answer_source: finalTraceAnswerSource,
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
    primary_intent: effectiveSourceTargetInfo.sourceTarget === "unknown"
      ? null
      : {
          intent_kind: primary,
          route: input.selectedRoute,
          source_target: effectiveSourceTargetInfo.sourceTarget,
          target_kind: effectiveSourceTargetInfo.targetKind,
          selection_reason: effectiveSourceTargetInfo.reason,
        },
    solver_short_circuit_flags: solverRiskFlags,
    hard_gate: readRecord(input.payload.solver_hard_gate) as HelixAskTurnSolverHardGate | undefined,
  };
}
