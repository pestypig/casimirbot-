import { isHelixAskGenericUnknownScaffold } from "../objectives/objective-assembly";
import {
  buildHelixAskObjectivePlainReasoningTrace,
  hasHelixAskObjectiveUnknownBlock,
  HELIX_ASK_OBJECTIVE_OES_BLOCKED_THRESHOLD,
  HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD,
  summarizeHelixAskObjectiveLoopState,
  type HelixAskObjectiveEvidenceScore,
  type HelixAskObjectiveLoopState,
  type HelixAskObjectiveMiniAnswer,
  type HelixAskObjectiveMiniValidation,
  type HelixAskObjectiveRetrievalPass,
  type HelixAskObjectiveStepTranscript,
  type HelixAskObjectiveTelemetryUsed,
  type HelixAskObjectiveTransition,
} from "../objectives/objective-loop-debug";
import { applyObjectiveGateDebugPayload } from "./objective-gate-debug";
import { applyObjectiveLlmDebugPayload } from "./objective-llm-debug";
import { applyObjectiveRecoveryDebugPayload } from "./objective-recovery-debug";
import { applyObjectiveStateDebugPayload } from "./objective-state-debug";
import { applyObjectiveTraceDebugPayload } from "./objective-trace-debug";
import { applyObjectiveValidationDebugPayload } from "./objective-validation-debug";

type MutableDebugPayload = Record<string, unknown>;

export type HelixAskObjectivePromptRewriteStage =
  | "retrieve_proposal"
  | "mini_synth"
  | "mini_critic"
  | "assembly"
  | "assembly_rescue";

export type HelixAskObjectivePromptRewriteResult = {
  applied: boolean;
  effectiveHash: string;
  effectiveTokenEstimate: number;
  rewrittenHash?: string | null;
  rewrittenTokenEstimate?: number | null;
};

export type HelixAskObjectivePromptRewriteTelemetry = {
  applied: Partial<Record<HelixAskObjectivePromptRewriteStage, boolean>>;
  promptHashes: Partial<Record<HelixAskObjectivePromptRewriteStage, string>>;
  tokenEstimates: Partial<Record<HelixAskObjectivePromptRewriteStage, number>>;
  promptBudgets: Partial<Record<HelixAskObjectivePromptRewriteStage, number>>;
  shadowPromptHashes: Partial<Record<HelixAskObjectivePromptRewriteStage, string>>;
  shadowTokenEstimates: Partial<Record<HelixAskObjectivePromptRewriteStage, number>>;
};

type ObjectiveIntentPolicyEnvelope = {
  prompt_family: unknown;
  prompt_specificity: unknown;
  requires_code_floor: unknown;
  requires_doc_floor: unknown;
  clarify_allowed_pre_lock: unknown;
  lock_required_for_family: unknown;
  budget_profile: unknown;
  allow_two_pass: unknown;
  allow_retrieval_retry: unknown;
  question_fingerprint: unknown;
};

type ObjectiveTurnContract = {
  planner: {
    valid: unknown;
    mode: unknown;
    source: unknown;
  };
  goal: unknown;
  grounding_mode: unknown;
  output_family: unknown;
  objectives: unknown[];
  required_slots: unknown[];
  query_hints: unknown[];
  risk_flags: unknown[];
  obligations: Array<{
    id: unknown;
    label: unknown;
    kind: unknown;
    required: unknown;
    required_slots: unknown;
  }>;
};

type ObjectiveTurnRetrievalPlan = {
  depth_budget: unknown;
  diversity_budget: unknown;
  connectivity_budget: unknown;
  must_include: unknown[];
  query_count: unknown;
};

type ObjectivePromptResearchRetrievalContract = {
  must_read_paths: unknown[];
  precedence_paths: unknown[];
  expansion_rule: unknown;
  missing_required_paths: unknown[];
  unreadable_required_paths: unknown[];
};

type ObjectiveAnswerPlanSectionShape = {
  id: unknown;
  title: unknown;
  kind?: unknown;
  coverage_status?: unknown;
  obligation_ids?: unknown;
};

type ObjectiveAnswerPlanShadowShape = {
  profile_id?: unknown;
  profile_version?: unknown;
  prompt_family: unknown;
  prompt_specificity?: unknown;
  degrade_path_id?: unknown;
  evidence_pack: {
    evidence_hash: unknown;
    slot_missing: unknown;
    evidence_gap: unknown;
    objective_support: unknown;
    obligation_coverage: Array<{
      status: unknown;
      label: unknown;
    }>;
    obligation_evidence: unknown[];
    evidence_blocks: unknown[];
  };
  sections: ObjectiveAnswerPlanSectionShape[];
  selection_lock?: {
    lock_id?: unknown;
    selector_locked?: unknown;
    selector_primary_key?: unknown;
    selector_family?: unknown;
  };
};

type ObjectiveAnswerPlanValidationShape = {
  fail_reasons: unknown[];
  sections_present: unknown;
  required_section_count: unknown;
  required_section_present_count: unknown;
  family_format_accuracy: unknown;
  degrade_reason?: unknown;
};

type ObjectiveValidatedPlanShape = {
  schema_valid?: unknown;
  fail_reasons?: unknown[];
  sections_present?: unknown;
  required_section_count?: unknown;
  required_section_present_count?: unknown;
  family_format_accuracy?: unknown;
  anchor_integrity_violations: unknown[];
  debug_leak_hits?: unknown[];
  placeholder_section_count?: unknown;
  degraded?: unknown;
  degrade_reason?: unknown;
};

type ObjectivePromptResearchValidationShape = {
  fail_reasons?: unknown[];
  missing_verbatim_constraints?: unknown[];
  missing_required_sections?: unknown[];
  missing_support_sections?: unknown[];
  missing_provenance_columns?: unknown[];
  placeholder_hits?: unknown[];
};

type ObjectiveComposerProjectionGuard = {
  triggered?: unknown;
  hard?: unknown;
  mode?: unknown;
  retrieval_healthy?: unknown;
  llm_healthy?: unknown;
  reasons?: unknown[];
};

export const OBJECTIVE_STEP_TRANSCRIPT_MAX = 160;
export const OBJECTIVE_TRANSITION_LOG_MAX = 160;
export const OBJECTIVE_RETRIEVAL_PASS_LOG_MAX = 64;
export const OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX = 24;
export const HELIX_ASK_OBJECTIVE_LOOP_PATCH_REVISION =
  "2026-03-23-objective-loop-final-resolution-v3";

export const createObjectivePromptRewriteTelemetry =
  (): HelixAskObjectivePromptRewriteTelemetry => ({
    applied: {},
    promptHashes: {},
    tokenEstimates: {},
    promptBudgets: {},
    shadowPromptHashes: {},
    shadowTokenEstimates: {},
  });

export const recordObjectivePromptRewriteStage = (
  telemetry: HelixAskObjectivePromptRewriteTelemetry,
  stage: HelixAskObjectivePromptRewriteStage,
  rewrite: HelixAskObjectivePromptRewriteResult,
  budget?: number,
): void => {
  telemetry.applied[stage] = rewrite.applied;
  telemetry.promptHashes[stage] = rewrite.effectiveHash;
  telemetry.tokenEstimates[stage] = rewrite.effectiveTokenEstimate;
  if (Number.isFinite(budget)) {
    telemetry.promptBudgets[stage] = Number(budget);
  }
  if (rewrite.rewrittenHash) {
    telemetry.shadowPromptHashes[stage] = rewrite.rewrittenHash;
  }
  if (Number.isFinite(rewrite.rewrittenTokenEstimate ?? NaN)) {
    telemetry.shadowTokenEstimates[stage] = Number(rewrite.rewrittenTokenEstimate);
  }
};

export const appendObjectiveStepTranscript = (args: {
  transcripts: HelixAskObjectiveStepTranscript[];
  entry: HelixAskObjectiveStepTranscript;
}): HelixAskObjectiveStepTranscript[] => {
  const next = [...args.transcripts, args.entry];
  return next.length > OBJECTIVE_STEP_TRANSCRIPT_MAX
    ? next.slice(-OBJECTIVE_STEP_TRANSCRIPT_MAX)
    : next;
};

export const appendObjectiveRetrievalProbe = (args: {
  objectiveRetrievalQueriesLog: Array<Record<string, unknown>>;
  objectiveRetrievalSelectedFilesLog: Array<Record<string, unknown>>;
  objectiveRetrievalConfidenceDeltaLog: Array<Record<string, unknown>>;
  objectiveId: string;
  queries: string[];
  files: string[];
  before: number;
  after: number;
  passIndex?: number;
  currentPassCount: number;
}): {
  objectiveRetrievalQueriesLog: Array<Record<string, unknown>>;
  objectiveRetrievalSelectedFilesLog: Array<Record<string, unknown>>;
  objectiveRetrievalConfidenceDeltaLog: Array<Record<string, unknown>>;
} => {
  const passIndex =
    Number.isFinite(args.passIndex) && args.passIndex && args.passIndex > 0
      ? Number(args.passIndex)
      : args.currentPassCount;
  const queriesLog = [
    ...args.objectiveRetrievalQueriesLog,
    {
      objective_id: args.objectiveId,
      pass_index: passIndex,
      queries: args.queries.slice(0, 12),
    },
  ];
  const selectedFilesLog = [
    ...args.objectiveRetrievalSelectedFilesLog,
    {
      objective_id: args.objectiveId,
      pass_index: passIndex,
      files: args.files.slice(0, 16),
    },
  ];
  const confidenceDeltaLog = [
    ...args.objectiveRetrievalConfidenceDeltaLog,
    {
      objective_id: args.objectiveId,
      pass_index: passIndex,
      before: Number(args.before.toFixed(4)),
      after: Number(args.after.toFixed(4)),
      delta: Number((args.after - args.before).toFixed(4)),
    },
  ];
  return {
    objectiveRetrievalQueriesLog:
      queriesLog.length > OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX
        ? queriesLog.slice(-OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX)
        : queriesLog,
    objectiveRetrievalSelectedFilesLog:
      selectedFilesLog.length > OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX
        ? selectedFilesLog.slice(-OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX)
        : selectedFilesLog,
    objectiveRetrievalConfidenceDeltaLog:
      confidenceDeltaLog.length > OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX
        ? confidenceDeltaLog.slice(-OBJECTIVE_SCOPED_RETRIEVAL_PASS_MAX)
        : confidenceDeltaLog,
  };
};

export const applyObjectiveTurnContractDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  helixIntentPolicyEnvelope: ObjectiveIntentPolicyEnvelope;
  requiresRepoEvidence: boolean;
  helixTurnContract: ObjectiveTurnContract;
  helixTurnContractHash: string;
  helixTurnRetrievalPlan: ObjectiveTurnRetrievalPlan;
  promptResearchRetrievalContract: ObjectivePromptResearchRetrievalContract | null;
  retrievalScope: string;
}): void => {
  args.debugPayload.policy_prompt_family = args.helixIntentPolicyEnvelope.prompt_family;
  args.debugPayload.policy_prompt_specificity =
    args.helixIntentPolicyEnvelope.prompt_specificity;
  args.debugPayload.policy_requires_code_floor =
    args.helixIntentPolicyEnvelope.requires_code_floor;
  args.debugPayload.policy_requires_doc_floor =
    args.helixIntentPolicyEnvelope.requires_doc_floor;
  args.debugPayload.policy_clarify_allowed_pre_lock =
    args.helixIntentPolicyEnvelope.clarify_allowed_pre_lock;
  args.debugPayload.policy_lock_required =
    args.helixIntentPolicyEnvelope.lock_required_for_family;
  args.debugPayload.policy_budget_profile =
    args.helixIntentPolicyEnvelope.budget_profile;
  args.debugPayload.policy_allow_two_pass =
    args.helixIntentPolicyEnvelope.allow_two_pass;
  args.debugPayload.policy_allow_retrieval_retry =
    args.helixIntentPolicyEnvelope.allow_retrieval_retry;
  args.debugPayload.policy_retrieval_scope = args.retrievalScope;
  args.debugPayload.policy_question_fingerprint =
    args.helixIntentPolicyEnvelope.question_fingerprint;
  args.debugPayload.policy_requires_repo_evidence = args.requiresRepoEvidence;
  args.debugPayload.planner_valid = args.helixTurnContract.planner.valid;
  args.debugPayload.planner_mode = args.helixTurnContract.planner.mode;
  args.debugPayload.planner_source = args.helixTurnContract.planner.source;
  args.debugPayload.turn_contract_hash = args.helixTurnContractHash;
  args.debugPayload.turn_contract_goal = args.helixTurnContract.goal;
  args.debugPayload.turn_contract_grounding_mode =
    args.helixTurnContract.grounding_mode;
  args.debugPayload.turn_contract_output_family =
    args.helixTurnContract.output_family;
  args.debugPayload.objective_count = args.helixTurnContract.objectives.length;
  args.debugPayload.turn_contract_required_slots =
    args.helixTurnContract.required_slots.slice(0, 12);
  args.debugPayload.turn_contract_query_hints =
    args.helixTurnContract.query_hints.slice(0, 12);
  args.debugPayload.turn_contract_risk_flags =
    args.helixTurnContract.risk_flags.slice(0, 8);
  args.debugPayload.turn_retrieval_plan = {
    depth_budget: args.helixTurnRetrievalPlan.depth_budget,
    diversity_budget: args.helixTurnRetrievalPlan.diversity_budget,
    connectivity_budget: args.helixTurnRetrievalPlan.connectivity_budget,
    must_include: args.helixTurnRetrievalPlan.must_include.slice(0, 8),
    query_count: args.helixTurnRetrievalPlan.query_count,
  };
  if (args.promptResearchRetrievalContract) {
    args.debugPayload.prompt_retrieval_contract = {
      must_read_paths: args.promptResearchRetrievalContract.must_read_paths.slice(0, 16),
      precedence_paths:
        args.promptResearchRetrievalContract.precedence_paths.slice(0, 16),
      expansion_rule: args.promptResearchRetrievalContract.expansion_rule,
      missing_required_paths:
        args.promptResearchRetrievalContract.missing_required_paths.slice(0, 16),
      unreadable_required_paths:
        args.promptResearchRetrievalContract.unreadable_required_paths.slice(0, 16),
    };
  }
};

export const applyObjectivePlanStreamSeedDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectivePlanSeedLabels: string[];
  objectiveSeedDraft: string;
  fallbackQuestionSeed: string;
}): void => {
  args.debugPayload.objective_plan_stream_seed_labels =
    args.objectivePlanSeedLabels.slice(0, 4);
  args.debugPayload.objective_plan_stream_seed =
    args.objectiveSeedDraft || args.fallbackQuestionSeed;
};

export const applyObjectiveAnswerPlanShadowDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  answerPlanShadow: ObjectiveAnswerPlanShadowShape;
  validatedAfterEnforce: ObjectiveValidatedPlanShape;
  helixTurnContractHash: string;
  helixTurnContract: ObjectiveTurnContract;
  evidenceGap: boolean;
  openWorldBypassMode: string;
  intentDomain: string;
  composerV2FallbackReason: string | null;
  composerSoftEnforceAction: string | null;
  answerPlanValidationShadowDegradeReason: string | null;
}): void => {
  args.debugPayload.composer_evidence_hash =
    args.answerPlanShadow.evidence_pack.evidence_hash;
  args.debugPayload.turn_contract_hash = args.helixTurnContractHash;
  args.debugPayload.objective_count = args.helixTurnContract.objectives.length;
  args.debugPayload.answer_obligation_count =
    args.helixTurnContract.obligations.length;
  args.debugPayload.answer_obligations = args.helixTurnContract.obligations.map(
    (obligation) => ({
      id: obligation.id,
      label: obligation.label,
      kind: obligation.kind,
      required: obligation.required,
      required_slots: obligation.required_slots,
    }),
  );
  args.debugPayload.slot_missing = args.answerPlanShadow.evidence_pack.slot_missing;
  args.debugPayload.evidence_gap = args.answerPlanShadow.evidence_pack.evidence_gap;
  args.debugPayload.objective_support =
    args.answerPlanShadow.evidence_pack.objective_support;
  args.debugPayload.answer_obligation_coverage =
    args.answerPlanShadow.evidence_pack.obligation_coverage;
  args.debugPayload.answer_obligations_missing =
    args.answerPlanShadow.evidence_pack.obligation_coverage
      .filter((coverage) => coverage.status !== "covered")
      .map((coverage) => coverage.label);
  args.debugPayload.answer_obligation_evidence =
    args.answerPlanShadow.evidence_pack.obligation_evidence.slice(0, 8);
  args.debugPayload.answer_evidence_blocks =
    args.answerPlanShadow.evidence_pack.evidence_blocks.slice(0, 6);
  args.debugPayload.answer_plan_sections = args.answerPlanShadow.sections.map(
    (section) => ({
      id: section.id,
      title: section.title,
      kind: section.kind ?? "answer",
      coverage_status: section.coverage_status ?? null,
      obligation_ids: Array.isArray(section.obligation_ids)
        ? section.obligation_ids
        : [],
    }),
  );
  args.debugPayload.anchor_integrity_ok =
    args.validatedAfterEnforce.anchor_integrity_violations.length === 0;
  args.debugPayload.answer_mode =
    args.answerPlanShadow.prompt_family === "roadmap_planning" && args.evidenceGap
      ? "partial_roadmap"
      : args.openWorldBypassMode === "active"
        ? "open_world"
        : args.intentDomain === "hybrid"
          ? "hybrid"
          : args.intentDomain === "repo"
            ? "repo_grounded"
            : "general";
  args.debugPayload.degrade_mode =
    args.composerV2FallbackReason ??
    args.composerSoftEnforceAction ??
    args.answerPlanValidationShadowDegradeReason ??
    (args.answerPlanShadow.prompt_family === "roadmap_planning" && args.evidenceGap
      ? "partial_roadmap"
      : "none");
};

export const applyObjectiveComposerShadowDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  answerPlanShadow: ObjectiveAnswerPlanShadowShape;
  answerPlanValidationShadow: ObjectiveAnswerPlanValidationShape;
  validatedAfterEnforce: ObjectiveValidatedPlanShape;
  promptResearchValidationAfter?: ObjectivePromptResearchValidationShape | null;
  promptResearchRepairActions: string[];
  hardComposerGuardTriggered: boolean;
  softSectionGuardTriggered: boolean;
  composerSoftObserveRewriteApplied: boolean;
  deterministicPreserveBlocked: boolean;
  softSectionGuardEscalatedEnforce: boolean;
  gateMode: "observe" | "enforce";
  softSectionGuardEligible: boolean;
  softSectionGuardObserved: boolean;
  softSectionGuardObserveSkipped: boolean;
  composerSoftObserveReason: string | null;
  composerSoftHardGuardReason: string | null;
  composerSoftEnforceTriggerReason: string | null;
  composerSoftEnforceAction: string | null;
  composerFamilyDegradeSuppressed: boolean;
  composerFamilyDegradeSuppressedReason: string | null;
  objectiveLoopPrimaryComposerGuard: boolean;
  composerV2Enabled: boolean;
  composerV2Applied: boolean;
  composerV2BriefSource: string | null;
  composerV2EvidenceDigestSource: string | null;
  composerV2EvidenceDigestClaimCount: number;
  composerV2HandoffSource: string | null;
  composerV2HandoffBlockCount: number;
  composerV2HandoffChars: number;
  composerV2HandoffTruncated: boolean;
  composerV2ClaimCounts: unknown;
  composerV2PreLinkFailReasons: string[];
  composerV2PostLinkFailReasons: string[];
  composerV2RepairAttempted: boolean;
  composerV2FallbackReason: string | null;
  composerV2ExpandCharCount: number;
  composerV2ExpandRawPreview: string | null;
  composerV2RepairCharCount: number;
  composerV2RepairRawPreview: string | null;
  composerV2ExpandAttempts: number;
  composerV2RepairAttempts: number;
  composerV2ExpandTransientRetries: number;
  composerV2RepairSkippedDueToExpandError: boolean;
  composerV2ExpandErrorCode: string | null;
  composerV2ProjectionApplied: boolean;
  composerV2BestAttemptStage: string | null;
  composerV2ProjectionRegressionGuard?: ObjectiveComposerProjectionGuard | null;
  helixTurnContractHash: string;
  helixTurnContract: ObjectiveTurnContract;
  evidenceGap: boolean;
  openWorldBypassMode: string;
  intentDomain: string;
}): void => {
  args.debugPayload.composer_shadow_enabled = true;
  args.debugPayload.composer_profile_id = args.answerPlanShadow.profile_id;
  args.debugPayload.composer_profile_version = args.answerPlanShadow.profile_version;
  args.debugPayload.composer_prompt_family = args.answerPlanShadow.prompt_family;
  args.debugPayload.composer_prompt_specificity = args.answerPlanShadow.prompt_specificity;
  args.debugPayload.composer_pre_validation_fail_reasons =
    args.answerPlanValidationShadow.fail_reasons;
  args.debugPayload.composer_pre_sections_present =
    args.answerPlanValidationShadow.sections_present;
  args.debugPayload.composer_pre_required_section_count =
    args.answerPlanValidationShadow.required_section_count;
  args.debugPayload.composer_pre_required_section_present_count =
    args.answerPlanValidationShadow.required_section_present_count;
  args.debugPayload.composer_pre_family_format_accuracy =
    args.answerPlanValidationShadow.family_format_accuracy;
  args.debugPayload.composer_schema_valid = args.validatedAfterEnforce.schema_valid;
  args.debugPayload.composer_validation_fail_reason =
    args.validatedAfterEnforce.fail_reasons?.[0] ?? null;
  args.debugPayload.composer_validation_fail_reasons =
    args.validatedAfterEnforce.fail_reasons ?? [];
  args.debugPayload.composer_sections_present = args.validatedAfterEnforce.sections_present;
  args.debugPayload.composer_required_section_count =
    args.validatedAfterEnforce.required_section_count;
  args.debugPayload.composer_required_section_present_count =
    args.validatedAfterEnforce.required_section_present_count;
  args.debugPayload.composer_family_format_accuracy =
    args.validatedAfterEnforce.family_format_accuracy;
  args.debugPayload.composer_anchor_integrity_violations_count =
    args.validatedAfterEnforce.anchor_integrity_violations.length;
  args.debugPayload.composer_anchor_integrity_violations =
    args.validatedAfterEnforce.anchor_integrity_violations;
  args.debugPayload.composer_debug_leak_hit_count =
    args.validatedAfterEnforce.debug_leak_hits?.length ?? 0;
  args.debugPayload.composer_debug_leak_hits =
    args.validatedAfterEnforce.debug_leak_hits ?? [];
  args.debugPayload.composer_placeholder_section_count =
    args.validatedAfterEnforce.placeholder_section_count ?? 0;
  args.debugPayload.answer_validation_failures = [
    ...(args.validatedAfterEnforce.fail_reasons ?? []),
    ...(args.promptResearchValidationAfter?.fail_reasons ?? []),
  ];
  args.debugPayload.prompt_research_validation_failures =
    args.promptResearchValidationAfter?.fail_reasons ?? [];
  args.debugPayload.prompt_research_validation_missing_verbatim_constraints =
    args.promptResearchValidationAfter?.missing_verbatim_constraints ?? [];
  args.debugPayload.prompt_research_validation_missing_required_sections =
    args.promptResearchValidationAfter?.missing_required_sections ?? [];
  args.debugPayload.prompt_research_validation_missing_support_sections =
    args.promptResearchValidationAfter?.missing_support_sections ?? [];
  args.debugPayload.prompt_research_validation_missing_provenance_columns =
    args.promptResearchValidationAfter?.missing_provenance_columns ?? [];
  args.debugPayload.prompt_research_validation_placeholder_hits =
    args.promptResearchValidationAfter?.placeholder_hits ?? [];
  args.debugPayload.prompt_research_validation_repair_actions =
    args.promptResearchRepairActions;
  args.debugPayload.answer_sectional_compose_used =
    args.promptResearchRepairActions.includes("append_sectional_compose_sections");
  args.debugPayload.composer_degraded = args.validatedAfterEnforce.degraded;
  args.debugPayload.composer_degrade_reason = args.validatedAfterEnforce.degrade_reason;
  args.debugPayload.composer_degrade_path_id = args.answerPlanShadow.degrade_path_id;
  const composerSoftEnforceEffectiveMode: "observe" | "enforce" =
    args.hardComposerGuardTriggered ||
    args.softSectionGuardTriggered ||
    args.softSectionGuardEscalatedEnforce
      ? "enforce"
      : args.gateMode;
  args.debugPayload.composer_soft_enforce_applied =
    args.hardComposerGuardTriggered ||
    args.softSectionGuardTriggered ||
    args.composerSoftObserveRewriteApplied ||
    args.deterministicPreserveBlocked ||
    args.softSectionGuardEscalatedEnforce;
  args.debugPayload.composer_soft_enforce_gate_mode = args.gateMode;
  args.debugPayload.composer_soft_enforce_effective_mode =
    composerSoftEnforceEffectiveMode;
  args.debugPayload.composer_soft_enforce_enabled = args.softSectionGuardEligible;
  args.debugPayload.composer_soft_enforce_deterministic_preserve_blocked =
    args.deterministicPreserveBlocked;
  args.debugPayload.composer_soft_enforce_escalated_enforce =
    args.softSectionGuardEscalatedEnforce;
  args.debugPayload.composer_soft_enforce_soft_section_guard_observed =
    args.softSectionGuardObserved;
  args.debugPayload.composer_soft_enforce_observe_skip =
    args.softSectionGuardObserveSkipped;
  args.debugPayload.composer_soft_enforce_observe_reason =
    args.composerSoftObserveReason;
  args.debugPayload.composer_soft_enforce_observe_rewrite_applied =
    args.composerSoftObserveRewriteApplied;
  args.debugPayload.composer_soft_enforce_hard_guard_triggered =
    args.hardComposerGuardTriggered;
  args.debugPayload.composer_soft_enforce_hard_guard_reason =
    args.composerSoftHardGuardReason;
  args.debugPayload.composer_soft_enforce_soft_section_guard_triggered =
    args.softSectionGuardTriggered;
  args.debugPayload.composer_soft_enforce_reason =
    args.composerSoftEnforceTriggerReason;
  args.debugPayload.composer_soft_enforce_trigger_reason =
    args.composerSoftEnforceTriggerReason;
  args.debugPayload.composer_soft_enforce_action =
    args.composerSoftEnforceAction;
  args.debugPayload.composer_family_degrade_suppressed =
    args.composerFamilyDegradeSuppressed;
  args.debugPayload.composer_family_degrade_suppressed_reason =
    args.composerFamilyDegradeSuppressedReason;
  args.debugPayload.objective_loop_primary_composer_guard =
    args.objectiveLoopPrimaryComposerGuard;
  args.debugPayload.composer_v2_enabled = args.composerV2Enabled;
  args.debugPayload.composer_v2_applied = args.composerV2Applied;
  args.debugPayload.composer_v2_brief_source = args.composerV2BriefSource;
  args.debugPayload.composer_v2_evidence_digest_source =
    args.composerV2EvidenceDigestSource;
  args.debugPayload.composer_v2_evidence_digest_claim_count =
    args.composerV2EvidenceDigestClaimCount;
  args.debugPayload.composer_v2_handoff_source = args.composerV2HandoffSource;
  args.debugPayload.composer_v2_handoff_block_count =
    args.composerV2HandoffBlockCount;
  args.debugPayload.composer_v2_handoff_chars = args.composerV2HandoffChars;
  args.debugPayload.composer_v2_handoff_truncated =
    args.composerV2HandoffTruncated;
  args.debugPayload.composer_v2_claim_counts = args.composerV2ClaimCounts;
  args.debugPayload.composer_v2_pre_link_fail_reasons =
    args.composerV2PreLinkFailReasons;
  args.debugPayload.composer_v2_post_link_fail_reasons =
    args.composerV2PostLinkFailReasons;
  args.debugPayload.composer_v2_repair_attempted =
    args.composerV2RepairAttempted;
  args.debugPayload.composer_v2_fallback_reason =
    args.composerV2FallbackReason;
  args.debugPayload.composer_v2_expand_char_count =
    args.composerV2ExpandCharCount;
  args.debugPayload.composer_v2_expand_raw_preview =
    args.composerV2ExpandRawPreview;
  args.debugPayload.composer_v2_repair_char_count =
    args.composerV2RepairCharCount;
  args.debugPayload.composer_v2_repair_raw_preview =
    args.composerV2RepairRawPreview;
  args.debugPayload.composer_v2_expand_attempts =
    args.composerV2ExpandAttempts;
  args.debugPayload.composer_v2_repair_attempts =
    args.composerV2RepairAttempts;
  args.debugPayload.composer_v2_transient_retries =
    args.composerV2ExpandTransientRetries;
  args.debugPayload.composer_v2_repair_skipped_due_to_expand_error =
    args.composerV2RepairSkippedDueToExpandError;
  args.debugPayload.composer_v2_expand_error_code =
    args.composerV2ExpandErrorCode;
  args.debugPayload.composer_v2_projection_applied =
    args.composerV2ProjectionApplied;
  args.debugPayload.composer_v2_best_attempt_stage =
    args.composerV2BestAttemptStage;
  args.debugPayload.composer_v2_projection_guard_triggered =
    args.composerV2ProjectionRegressionGuard?.triggered ?? false;
  args.debugPayload.composer_v2_projection_guard_hard =
    args.composerV2ProjectionRegressionGuard?.hard ?? false;
  args.debugPayload.composer_v2_projection_guard_mode =
    args.composerV2ProjectionRegressionGuard?.mode ?? "none";
  args.debugPayload.composer_v2_projection_guard_retrieval_healthy =
    args.composerV2ProjectionRegressionGuard?.retrieval_healthy ?? false;
  args.debugPayload.composer_v2_projection_guard_llm_healthy =
    args.composerV2ProjectionRegressionGuard?.llm_healthy ?? false;
  args.debugPayload.composer_v2_projection_guard_reasons =
    args.composerV2ProjectionRegressionGuard?.reasons ?? [];
  args.debugPayload.composer_selection_lock_id =
    args.answerPlanShadow.selection_lock?.lock_id;
  args.debugPayload.composer_selection_locked =
    args.answerPlanShadow.selection_lock?.selector_locked;
  args.debugPayload.composer_selection_primary_key =
    args.answerPlanShadow.selection_lock?.selector_primary_key;
  args.debugPayload.composer_selection_family =
    args.answerPlanShadow.selection_lock?.selector_family;
  applyObjectiveAnswerPlanShadowDebugPayload({
    debugPayload: args.debugPayload,
    answerPlanShadow: args.answerPlanShadow,
    validatedAfterEnforce: args.validatedAfterEnforce,
    helixTurnContractHash: args.helixTurnContractHash,
    helixTurnContract: args.helixTurnContract,
    evidenceGap: args.evidenceGap,
    openWorldBypassMode: args.openWorldBypassMode,
    intentDomain: args.intentDomain,
    composerV2FallbackReason: args.composerV2FallbackReason,
    composerSoftEnforceAction: args.composerSoftEnforceAction,
    answerPlanValidationShadowDegradeReason:
      args.answerPlanValidationShadow.degrade_reason ?? null,
  });
};

export const applyObjectiveLoopReportTailDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectiveLoopEnabled: boolean;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveTransitionLog: HelixAskObjectiveTransition[];
  objectiveStepTranscripts: HelixAskObjectiveStepTranscript[];
  objectivePromptRewriteMode: string;
  objectivePromptRewriteTelemetry: HelixAskObjectivePromptRewriteTelemetry;
  objectiveMiniAnswers: HelixAskObjectiveMiniAnswer[];
  objectiveMiniValidation: HelixAskObjectiveMiniValidation | null;
  objectiveUnknownBlockObjectiveIds: string[];
  objectiveUnresolvedWithoutUnknownBlockIds: string[];
  objectiveMissingScopedRetrievalCount: number;
  objectiveOesScores: HelixAskObjectiveEvidenceScore[];
  objectiveTerminalizationReasons: Record<string, string>;
  objectiveRetrievalPasses: HelixAskObjectiveRetrievalPass[];
  objectiveRetrievalQueriesLog: Array<Record<string, unknown>>;
  objectiveRetrievalSelectedFilesLog: Array<Record<string, unknown>>;
  objectiveRetrievalConfidenceDeltaLog: Array<Record<string, unknown>>;
  objectiveRetrievalExhausted: boolean;
  objectiveRetrieveProposalMode: "llm" | "heuristic_fallback" | "none";
  objectiveRetrieveProposalLlmAttempted: boolean;
  objectiveRetrieveProposalLlmInvoked: boolean;
  objectiveRetrieveProposalFailReason: string | null;
  objectiveRetrieveProposalPromptPreview: string | null;
  objectiveRetrieveProposalAppliedCount: number;
  objectiveRetrieveProposalRepairAttempted: boolean;
  objectiveRetrieveProposalRepairSuccess: boolean;
  objectiveRetrieveProposalRepairFailReason: string | null;
  objectiveRecoveryNoContextRetryableCount: number;
  objectiveRecoveryNoContextTerminalCount: number;
  objectiveRecoveryErrorRetryableCount: number;
  objectiveRecoveryErrorTerminalCount: number;
  objectiveMiniSynthMode: "llm" | "heuristic_fallback" | "none";
  objectiveMiniSynthLlmAttempted: boolean;
  objectiveMiniSynthLlmInvoked: boolean;
  objectiveMiniSynthFailReason: string | null;
  objectiveMiniSynthPromptPreview: string | null;
  objectiveMiniSynthRepairAttempted: boolean;
  objectiveMiniSynthRepairSuccess: boolean;
  objectiveMiniSynthRepairFailReason: string | null;
  objectiveMiniCriticMode: "llm" | "heuristic_fallback" | "none";
  objectiveMiniCriticLlmAttempted: boolean;
  objectiveMiniCriticLlmInvoked: boolean;
  objectiveMiniCriticFailReason: string | null;
  objectiveMiniCriticPromptPreview: string | null;
  objectiveMiniCriticRepairAttempted: boolean;
  objectiveMiniCriticRepairSuccess: boolean;
  objectiveMiniCriticRepairFailReason: string | null;
  objectiveAssemblyMode: "llm" | "deterministic_fallback" | "none";
  objectiveAssemblyFailReason: string | null;
  objectiveAssemblyBlockedReason: string | null;
  objectiveAssemblyLlmAttempted: boolean;
  objectiveAssemblyLlmInvoked: boolean;
  objectiveAssemblyPromptPreview: string | null;
  objectiveAssemblyRescuePromptPreview: string | null;
  objectiveAssemblyRescueAttempted: boolean;
  objectiveAssemblyRescueSuccess: boolean;
  objectiveAssemblyRescueFailReason: string | null;
  objectiveAssemblyRepairAttempted: boolean;
  objectiveAssemblyRepairSuccess: boolean;
  objectiveAssemblyRepairFailReason: string | null;
  objectiveAssemblyRescueRepairAttempted: boolean;
  objectiveAssemblyRescueRepairSuccess: boolean;
  objectiveAssemblyRescueRepairFailReason: string | null;
  objectiveAssemblyWeakRejectCount: number;
  routingSalvageApplied: boolean;
  routingSalvageReason: string | null;
  routingSalvageRetrievalAddedCount: number;
  normalizeText: (value: string, limit?: number) => string;
}): void => {
  const objectiveLoopPrimaryActive =
    args.objectiveLoopEnabled &&
    args.objectiveLoopState.some((state) => state.required_slots.length > 0);
  const objectiveLoopPrimaryBypassReason = objectiveLoopPrimaryActive
    ? null
    : args.objectiveLoopEnabled
      ? "objective_loop_no_required_slots"
      : "objective_loop_disabled";
  const summary = summarizeHelixAskObjectiveLoopState(args.objectiveLoopState);
  const stepTranscripts = args.objectiveStepTranscripts.slice(-64);
  const expectedLlmSteps = stepTranscripts.filter(
    (entry) =>
      entry.verb === "PLAN" ||
      entry.verb === "RETRIEVE" ||
      entry.verb === "MINI_SYNTH" ||
      entry.verb === "MINI_CRITIC" ||
      entry.verb === "REPAIR" ||
      entry.verb === "ASSEMBLE",
  );
  const llmStepCount = expectedLlmSteps.filter((entry) => Boolean(entry.llm_model)).length;
  const transcriptCompleteCount = stepTranscripts.filter(
    (entry) =>
      Boolean(entry.objective_id) &&
      Boolean(entry.verb) &&
      Boolean(entry.started_at) &&
      Boolean(entry.ended_at) &&
      Boolean(entry.decision),
  ).length;
  args.debugPayload.objective_loop_enabled = args.objectiveLoopEnabled;
  args.debugPayload.objective_loop_patch_revision =
    HELIX_ASK_OBJECTIVE_LOOP_PATCH_REVISION;
  args.debugPayload.objective_prompt_rewrite_mode = args.objectivePromptRewriteMode;
  args.debugPayload.objective_prompt_rewrite_stage_applied = {
    ...args.objectivePromptRewriteTelemetry.applied,
  };
  args.debugPayload.objective_prompt_rewrite_stage_prompt_hashes = {
    ...args.objectivePromptRewriteTelemetry.promptHashes,
  };
  args.debugPayload.objective_prompt_rewrite_stage_token_estimates = {
    ...args.objectivePromptRewriteTelemetry.tokenEstimates,
  };
  args.debugPayload.objective_prompt_rewrite_stage_budgets = {
    ...args.objectivePromptRewriteTelemetry.promptBudgets,
  };
  args.debugPayload.objective_prompt_rewrite_stage_shadow_prompt_hashes = {
    ...args.objectivePromptRewriteTelemetry.shadowPromptHashes,
  };
  args.debugPayload.objective_prompt_rewrite_stage_shadow_token_estimates = {
    ...args.objectivePromptRewriteTelemetry.shadowTokenEstimates,
  };
  args.debugPayload.objective_loop_primary_active = objectiveLoopPrimaryActive;
  args.debugPayload.objective_loop_primary_bypass_reason =
    objectiveLoopPrimaryBypassReason;
  args.debugPayload.objective_loop_primary_rate = objectiveLoopPrimaryActive ? 1 : 0;
  args.debugPayload.objective_total_count = summary.total;
  args.debugPayload.objective_terminal_count = summary.terminalCount;
  args.debugPayload.objective_unresolved_count = summary.unresolvedCount;
  args.debugPayload.objective_completion_rate = summary.completionRate;
  args.debugPayload.objective_blocked_count = summary.blockedCount;

  const objectiveAnswerObligationsMissingCount = Array.isArray(
    args.debugPayload.answer_obligations_missing,
  )
    ? (args.debugPayload.answer_obligations_missing as unknown[])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean).length
    : 0;
  const objectiveComposerValidationFailCount = Array.isArray(
    args.debugPayload.composer_validation_fail_reasons,
  )
    ? (args.debugPayload.composer_validation_fail_reasons as unknown[])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean).length
    : 0;
  const strictCoveredPass = summary.unresolvedCount === 0 && summary.blockedCount === 0;
  const unknownTerminalPass = Boolean(
    args.objectiveMiniValidation &&
      args.objectiveMiniValidation.unresolved > 0 &&
      args.objectiveMissingScopedRetrievalCount === 0 &&
      args.objectiveUnresolvedWithoutUnknownBlockIds.length === 0 &&
      args.objectiveUnknownBlockObjectiveIds.length >= args.objectiveMiniValidation.unresolved,
  );
  const objectiveFinalizeGatePassed = strictCoveredPass;
  const objectiveFinalizeGateMode: "strict_covered" | "unknown_terminal" | "blocked" =
    strictCoveredPass ? "strict_covered" : unknownTerminalPass ? "unknown_terminal" : "blocked";

  applyObjectiveGateDebugPayload({
    debugPayload: args.debugPayload,
    objectiveFinalizeGatePassed,
    objectiveFinalizeGateMode,
    unknownTerminalPass,
    strictCoveredPass,
    unresolvedCount: summary.unresolvedCount,
    blockedCount: summary.blockedCount,
    objectiveAnswerObligationsMissingCount,
    objectiveComposerValidationFailCount,
  });

  applyObjectiveStateDebugPayload({
    debugPayload: args.debugPayload,
    objectiveLoopState: args.objectiveLoopState,
    objectiveTransitionLog: args.objectiveTransitionLog,
  });

  applyObjectiveRecoveryDebugPayload({
    debugPayload: args.debugPayload,
    objectiveRetrievalPasses: args.objectiveRetrievalPasses,
    objectiveRetrievalQueriesLog: args.objectiveRetrievalQueriesLog,
    objectiveRetrievalSelectedFilesLog: args.objectiveRetrievalSelectedFilesLog,
    objectiveRetrievalConfidenceDeltaLog: args.objectiveRetrievalConfidenceDeltaLog,
    objectiveRetrievalExhausted: args.objectiveRetrievalExhausted,
    objectiveRetrieveProposalMode: args.objectiveRetrieveProposalMode,
    objectiveRetrieveProposalLlmAttempted: args.objectiveRetrieveProposalLlmAttempted,
    objectiveRetrieveProposalLlmInvoked: args.objectiveRetrieveProposalLlmInvoked,
    objectiveRetrieveProposalFailReason: args.objectiveRetrieveProposalFailReason,
    objectiveRetrieveProposalPromptPreview: args.objectiveRetrieveProposalPromptPreview,
    objectiveRetrieveProposalAppliedCount: args.objectiveRetrieveProposalAppliedCount,
    objectiveRetrieveProposalRepairAttempted:
      args.objectiveRetrieveProposalRepairAttempted,
    objectiveRetrieveProposalRepairSuccess:
      args.objectiveRetrieveProposalRepairSuccess,
    objectiveRetrieveProposalRepairFailReason:
      args.objectiveRetrieveProposalRepairFailReason,
    objectiveRecoveryNoContextRetryableCount:
      args.objectiveRecoveryNoContextRetryableCount,
    objectiveRecoveryNoContextTerminalCount:
      args.objectiveRecoveryNoContextTerminalCount,
    objectiveRecoveryErrorRetryableCount: args.objectiveRecoveryErrorRetryableCount,
    objectiveRecoveryErrorTerminalCount: args.objectiveRecoveryErrorTerminalCount,
  });

  applyObjectiveLlmDebugPayload({
    debugPayload: args.debugPayload,
    objectiveMiniAnswers: args.objectiveMiniAnswers,
    objectiveMiniValidation: args.objectiveMiniValidation,
    objectiveMiniSynthMode: args.objectiveMiniSynthMode,
    objectiveMiniSynthLlmAttempted: args.objectiveMiniSynthLlmAttempted,
    objectiveMiniSynthLlmInvoked: args.objectiveMiniSynthLlmInvoked,
    objectiveMiniSynthFailReason: args.objectiveMiniSynthFailReason,
    objectiveMiniSynthPromptPreview: args.objectiveMiniSynthPromptPreview,
    objectiveMiniSynthRepairAttempted: args.objectiveMiniSynthRepairAttempted,
    objectiveMiniSynthRepairSuccess: args.objectiveMiniSynthRepairSuccess,
    objectiveMiniSynthRepairFailReason: args.objectiveMiniSynthRepairFailReason,
    objectiveMiniCriticMode: args.objectiveMiniCriticMode,
    objectiveMiniCriticLlmAttempted: args.objectiveMiniCriticLlmAttempted,
    objectiveMiniCriticLlmInvoked: args.objectiveMiniCriticLlmInvoked,
    objectiveMiniCriticFailReason: args.objectiveMiniCriticFailReason,
    objectiveMiniCriticPromptPreview: args.objectiveMiniCriticPromptPreview,
    objectiveMiniCriticRepairAttempted: args.objectiveMiniCriticRepairAttempted,
    objectiveMiniCriticRepairSuccess: args.objectiveMiniCriticRepairSuccess,
    objectiveMiniCriticRepairFailReason: args.objectiveMiniCriticRepairFailReason,
    objectiveAssemblyMode: args.objectiveAssemblyMode,
    objectiveAssemblyFailReason: args.objectiveAssemblyFailReason,
    objectiveAssemblyBlockedReason: args.objectiveAssemblyBlockedReason,
    objectiveAssemblyLlmAttempted: args.objectiveAssemblyLlmAttempted,
    objectiveAssemblyLlmInvoked: args.objectiveAssemblyLlmInvoked,
    objectiveAssemblyPromptPreview: args.objectiveAssemblyPromptPreview,
    objectiveAssemblyRescuePromptPreview: args.objectiveAssemblyRescuePromptPreview,
    objectiveAssemblyRescueAttempted: args.objectiveAssemblyRescueAttempted,
    objectiveAssemblyRescueSuccess: args.objectiveAssemblyRescueSuccess,
    objectiveAssemblyRescueFailReason: args.objectiveAssemblyRescueFailReason,
    objectiveAssemblyRepairAttempted: args.objectiveAssemblyRepairAttempted,
    objectiveAssemblyRepairSuccess: args.objectiveAssemblyRepairSuccess,
    objectiveAssemblyRepairFailReason: args.objectiveAssemblyRepairFailReason,
    objectiveAssemblyRescueRepairAttempted:
      args.objectiveAssemblyRescueRepairAttempted,
    objectiveAssemblyRescueRepairSuccess:
      args.objectiveAssemblyRescueRepairSuccess,
    objectiveAssemblyRescueRepairFailReason:
      args.objectiveAssemblyRescueRepairFailReason,
    objectiveAssemblyWeakRejectCount: args.objectiveAssemblyWeakRejectCount,
  });

  const objectiveCoverageUnresolvedObjectiveIds = args.objectiveMiniAnswers
    .filter((entry) => entry.status !== "covered")
    .map((entry) => entry.objective_id)
    .slice(0, 12);
  const unresolvedWithGenericUnknown = args.objectiveMiniAnswers
    .filter((entry) => entry.status !== "covered")
    .filter((entry) => hasHelixAskObjectiveUnknownBlock(entry.unknown_block))
    .filter((entry) => {
      const block = entry.unknown_block;
      if (!block) return false;
      return isHelixAskGenericUnknownScaffold(
        [block.unknown, block.why, block.what_i_checked.join(" "), block.next_retrieval].join(
          " ",
        ),
      );
    }).length;

  applyObjectiveValidationDebugPayload({
    debugPayload: args.debugPayload,
    objectiveCoverageUnresolvedObjectiveIds,
    objectiveUnknownBlockObjectiveIds: args.objectiveUnknownBlockObjectiveIds,
    objectiveUnresolvedWithoutUnknownBlockIds:
      args.objectiveUnresolvedWithoutUnknownBlockIds,
    unresolvedObjectiveCount: args.objectiveMiniValidation?.unresolved ?? 0,
    unresolvedWithGenericUnknownCount: unresolvedWithGenericUnknown,
    objectiveOesScores: args.objectiveOesScores,
    objectiveTerminalizationReasons: args.objectiveTerminalizationReasons,
  });

  const objectiveReasoningTrace = buildHelixAskObjectivePlainReasoningTrace({
    miniAnswers: args.objectiveMiniAnswers,
    states: args.objectiveLoopState,
    scores: args.objectiveOesScores,
    transitions: args.objectiveTransitionLog,
    stepTranscripts,
    retrievalQueries: args.objectiveRetrievalQueriesLog,
    terminalizationReasons: args.objectiveTerminalizationReasons,
    normalizeText: args.normalizeText,
  });
  const objectiveTelemetryUsed: HelixAskObjectiveTelemetryUsed = {
    version: "v1",
    objective_unresolved_count_terminal: summary.unresolvedCount,
    objective_coverage_unresolved_count: objectiveCoverageUnresolvedObjectiveIds.length,
    objective_coverage_unresolved_objective_ids:
      objectiveCoverageUnresolvedObjectiveIds.slice(),
    objective_unknown_block_count: args.objectiveUnknownBlockObjectiveIds.length,
    objective_unresolved_without_unknown_block_count:
      args.objectiveUnresolvedWithoutUnknownBlockIds.length,
    objective_missing_scoped_retrieval_count:
      args.objectiveMissingScopedRetrievalCount,
    objective_finalize_gate_mode: objectiveFinalizeGateMode,
    objective_finalize_gate_passed: objectiveFinalizeGatePassed,
    mini_modes: {
      synth: args.objectiveMiniSynthMode,
      critic: args.objectiveMiniCriticMode,
      assembly: args.objectiveAssemblyMode,
    },
    oes_thresholds: {
      covered: HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD,
      blocked: HELIX_ASK_OBJECTIVE_OES_BLOCKED_THRESHOLD,
    },
    signals: [
      "objective_required_slots",
      "objective_scoped_retrieval",
      "objective_mini_synth",
      "objective_mini_critic",
      "objective_oes",
      "objective_unknown_block",
      "objective_finalize_gate",
      "objective_assembly_mode",
    ],
  };

  applyObjectiveTraceDebugPayload({
    debugPayload: args.debugPayload,
    objectiveReasoningTrace,
    objectiveTelemetryUsed,
    stepTranscripts,
    llmStepCount,
    expectedLlmStepCount: expectedLlmSteps.length,
    transcriptCompleteCount,
    routingSalvageApplied: args.routingSalvageApplied,
    routingSalvageReason: args.routingSalvageReason,
    routingSalvageRetrievalAddedCount: args.routingSalvageRetrievalAddedCount,
  });
};
