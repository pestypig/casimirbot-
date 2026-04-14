import { shouldOverrideHelixAskRetrievalRetryPolicy } from "../policy/execution-policy";

type RetrievalBuildResult = {
  files: string[];
};

type RetrievalAttemptOutcome = {
  applied: boolean;
  observedDelta?: string;
  missingSlots: string[];
};

type RetrievalStepStart = number;

type CoverageSummaryShape = {
  missingSlots: string[];
} | null | undefined;

export type HelixAskRetrievalRuntimeArgs = {
  capsuleRetryApplied: boolean;
  contextText: string;
  contextFiles: string[];
  capsuleMustKeepTerms: string[];
  capsulePreferredEvidencePaths: string[];
  retrievalRetryEnabled: boolean;
  promptIngested: boolean;
  objectiveLoopEnabled: boolean;
  objectiveLoopStateLength: number;
  canAgentAct: () => boolean;
  baseQueries: string[];
  queryMergeMax: number;
  contextFilesLimit: number;
  requestTopK?: number | null;
  retryTopKBonus: number;
  planScope?: Record<string, unknown> | null;
  buildFallbackContext: (
    queries: string[],
    topK: number,
    scopeOverride?: Record<string, unknown> | null,
  ) => Promise<RetrievalBuildResult>;
  applyContextAttempt: (
    label: string,
    result: RetrievalBuildResult,
    startedAt: RetrievalStepStart,
    queries: string[],
    scopeOverride?: Record<string, unknown> | null,
  ) => RetrievalAttemptOutcome;
  beginObjectiveRetrievalPass: (reason: string, queries: string[]) => void;
  logStepStart: (
    title: string,
    summary: string,
    details?: Record<string, unknown>,
  ) => RetrievalStepStart;
  logStepEnd: (
    title: string,
    summary: string,
    startedAt: RetrievalStepStart,
    ok: boolean,
    details?: Record<string, unknown>,
  ) => void;
  mergeQueries: (baseQueries: string[], extraQueries: string[], maxQueries: number) => string[];
  pushAnswerPath: (entry: string) => void;
  hasCapsuleFocusTerm: (contextText: string, mustKeepTerms: string[]) => boolean;
  normalizeCapsulePathKey: (path: string) => string;
  isCapsuleRetrievalDriftDetected: (args: {
    contextText: string;
    contextFiles: string[];
    mustKeepTerms: string[];
    preferredEvidencePaths: string[];
  }) => boolean;
  fastQualityMode: boolean;
  getAskElapsedMs: () => number;
  fastQualityPlanRetrievalBudgetMs: number;
  pushFastQualityDecision: (
    stage: string,
    action: string,
    reason: string,
  ) => void;
  isRepoQuestion: boolean;
  hasRepoHints: boolean;
  slotCoverageFailed: boolean;
  docSlotSummary?: CoverageSummaryShape;
  coverageSlotSummary?: CoverageSummaryShape;
  retrievalConfidence: number;
  arbiterRepoRatio: number;
  arbiterHybridRatio: number;
  allowRetrievalRetryByPolicy: boolean;
  buildRetryHintsForSlots: (slotIds: string[]) => string[];
  topicMustIncludeFiles: string[];
  compositeRequiredFiles: string[];
  verificationAnchorHints: string[];
  codeFirstEnabled: boolean;
  buildCodeFirstPlanScopeOverride: (
    scope?: Record<string, unknown> | null,
  ) => Record<string, unknown>;
  recordAgentAction: (
    action: string,
    reason: string,
    goal: string,
    delta: string,
    applied?: boolean,
    durationMs?: number,
  ) => void;
  recordControllerStep: (entry: {
    step: string;
    action: string;
    reason: string;
    evidenceOk: boolean;
    slotCoverageOk: boolean;
    docCoverageOk: boolean;
    missingSlots: string[];
    retrievalConfidence: number;
  }) => void;
  evidenceGateOk: boolean;
  slotCoverageOk: boolean;
  docSlotCoverageFailed: boolean;
  markAgentStopIfBlocked: () => void;
  debugPayload?: Record<string, unknown>;
};

export type HelixAskRetrievalRuntimeResult = {
  capsuleRetryApplied: boolean;
  retrievalRetryPolicyOverride: boolean;
  allowRetrievalRetryEffective: boolean;
  shouldRetryRetrieval: boolean;
};

export const runHelixAskRetrievalRuntimeShell = async (
  args: HelixAskRetrievalRuntimeArgs,
): Promise<HelixAskRetrievalRuntimeResult> => {
  let capsuleRetryApplied = args.capsuleRetryApplied;

  const capsuleContextFocusHit = args.hasCapsuleFocusTerm(
    args.contextText,
    args.capsuleMustKeepTerms,
  );
  const capsuleContextAnchorHit =
    args.capsulePreferredEvidencePaths.length === 0 ||
    args.capsulePreferredEvidencePaths.some((entry) =>
      args.contextFiles.some(
        (filePath) =>
          args.normalizeCapsulePathKey(filePath) === args.normalizeCapsulePathKey(entry),
      ),
    );
  const capsuleRetrievalDrift = args.isCapsuleRetrievalDriftDetected({
    contextText: args.contextText,
    contextFiles: args.contextFiles,
    mustKeepTerms: args.capsuleMustKeepTerms,
    preferredEvidencePaths: args.capsulePreferredEvidencePaths,
  });
  const capsuleRetryEligible =
    args.retrievalRetryEnabled &&
    !args.promptIngested &&
    !capsuleRetryApplied &&
    (args.capsuleMustKeepTerms.length > 0 ||
      args.capsulePreferredEvidencePaths.length > 0) &&
    capsuleRetrievalDrift &&
    args.canAgentAct();

  if (args.debugPayload) {
    args.debugPayload.capsule_retry_triggered = capsuleRetryEligible;
    args.debugPayload.capsule_retry_reason = capsuleRetrievalDrift
      ? [
          capsuleContextFocusHit ? "" : "focus_miss",
          capsuleContextAnchorHit ? "" : "anchor_miss",
        ]
          .filter(Boolean)
          .join("|") || "constraint_drift"
      : "not_needed";
  }

  if (capsuleRetryEligible) {
    const capsuleRetryHints = [
      ...args.capsulePreferredEvidencePaths,
      ...args.capsuleMustKeepTerms,
    ];
    const capsuleRetryQueries = args.mergeQueries(
      args.baseQueries,
      capsuleRetryHints,
      args.queryMergeMax + 4,
    );
    const capsuleRetryTopK = Math.min(
      args.contextFilesLimit,
      (args.requestTopK ?? args.contextFilesLimit) + 1,
    );
    if (args.objectiveLoopEnabled && args.objectiveLoopStateLength > 0) {
      args.beginObjectiveRetrievalPass("capsule_retry", capsuleRetryQueries);
    }
    const capsuleRetryStart = args.logStepStart(
      "Retrieval capsule-retry",
      `queries=${capsuleRetryQueries.length}`,
      {
        queryCount: capsuleRetryQueries.length,
        topK: capsuleRetryTopK,
        fn: "buildAskContextFromQueries",
        phase: "capsuleRetry",
      },
    );
    const capsuleRetryResult = await args.buildFallbackContext(
      capsuleRetryQueries,
      capsuleRetryTopK,
      args.planScope ?? undefined,
    );
    const capsuleRetryOutcome = args.applyContextAttempt(
      "capsule-retry",
      capsuleRetryResult,
      capsuleRetryStart,
      capsuleRetryQueries,
      args.planScope ?? undefined,
    );
    capsuleRetryApplied = capsuleRetryOutcome.applied;
    if (args.debugPayload) {
      args.debugPayload.capsule_retry_applied = capsuleRetryApplied;
      args.debugPayload.capsule_retry_reason = capsuleRetryOutcome.applied
        ? "constraint_drift_recovered"
        : (args.debugPayload.capsule_retry_reason ?? "constraint_drift_no_context");
    }
    if (capsuleRetryOutcome.applied) {
      args.pushAnswerPath("retrieval:capsule_retry");
      args.logStepEnd(
        "Retrieval capsule-retry",
        `files=${capsuleRetryResult.files.length}`,
        capsuleRetryStart,
        true,
        {
          files: capsuleRetryResult.files.length,
          fn: "buildAskContextFromQueries",
          missingSlots: capsuleRetryOutcome.missingSlots,
        },
      );
    } else {
      args.logStepEnd(
        "Retrieval capsule-retry",
        "no_context",
        capsuleRetryStart,
        false,
        {
          fn: "buildAskContextFromQueries",
        },
      );
    }
  }

  const arbiterHybridThreshold = Math.min(args.arbiterRepoRatio, args.arbiterHybridRatio);
  const coverageSlotsMissing = Boolean(
    args.coverageSlotSummary && args.coverageSlotSummary.missingSlots.length > 0,
  );
  const missingSlotsForRetry =
    args.slotCoverageFailed ||
    (args.docSlotSummary?.missingSlots?.length ?? 0) > 0 ||
    coverageSlotsMissing;
  const planRetrievalBudgetExceeded =
    args.fastQualityMode &&
    args.getAskElapsedMs() >= args.fastQualityPlanRetrievalBudgetMs;
  if (planRetrievalBudgetExceeded) {
    args.pushFastQualityDecision(
      "plan_retrieval",
      "deadline",
      "plan_retrieval_stage_budget_exhausted",
    );
  }

  const retrievalRetryPolicyOverride = shouldOverrideHelixAskRetrievalRetryPolicy({
    fastQualityMode: args.fastQualityMode,
    isRepoQuestion: args.isRepoQuestion,
    hasRepoHints: args.hasRepoHints,
    missingSlotsForRetry,
    retrievalConfidence: args.retrievalConfidence,
    hybridThreshold: arbiterHybridThreshold,
  });
  const allowRetrievalRetryEffective =
    args.allowRetrievalRetryByPolicy || retrievalRetryPolicyOverride;
  const shouldRetryRetrieval =
    args.retrievalRetryEnabled &&
    allowRetrievalRetryEffective &&
    !args.promptIngested &&
    args.hasRepoHints &&
    (
      args.fastQualityMode
        ? (missingSlotsForRetry && args.isRepoQuestion) ||
          args.retrievalConfidence < Math.max(0.2, arbiterHybridThreshold - 0.2)
        : args.retrievalConfidence < arbiterHybridThreshold || missingSlotsForRetry
    ) &&
    args.canAgentAct() &&
    !planRetrievalBudgetExceeded;

  if (args.debugPayload && !args.allowRetrievalRetryByPolicy) {
    args.debugPayload.retrieval_retry_skipped_by_policy = true;
  }
  if (args.debugPayload) {
    args.debugPayload.retrieval_retry_policy_override = retrievalRetryPolicyOverride;
    args.debugPayload.retrieval_retry_allow_effective = allowRetrievalRetryEffective;
    if (args.fastQualityMode) {
      args.debugPayload.fast_quality_retry_strict_mode = true;
    }
  }

  let retryMissingSlots: string[] = [];
  if (shouldRetryRetrieval) {
    const retrySlotTargets =
      args.docSlotSummary?.missingSlots?.length
        ? args.docSlotSummary.missingSlots
        : args.coverageSlotSummary?.missingSlots ?? [];
    const retrySlotHints = args.buildRetryHintsForSlots(retrySlotTargets);
    const retryHints = [
      ...args.topicMustIncludeFiles,
      ...args.compositeRequiredFiles,
      ...args.verificationAnchorHints,
      ...retrySlotTargets.slice(0, 4),
      ...retrySlotHints,
    ];
    const retryQueries = args.mergeQueries(
      args.baseQueries,
      retryHints,
      args.queryMergeMax + 4,
    );
    const retryTopK = Math.min(
      args.contextFilesLimit,
      (args.requestTopK ?? args.contextFilesLimit) + args.retryTopKBonus,
    );
    if (args.objectiveLoopEnabled && args.objectiveLoopStateLength > 0) {
      args.beginObjectiveRetrievalPass("retry_retrieval", retryQueries);
    }
    const retryStart = args.logStepStart(
      "Retrieval retry",
      `slots=${retrySlotTargets.length} queries=${retryQueries.length}`,
      {
        slotCount: retrySlotTargets.length,
        queryCount: retryQueries.length,
        topK: retryTopK,
        fn: "buildAskContextFromQueries",
        phase: "retry",
      },
    );
    const retryResult = await args.buildFallbackContext(
      retryQueries,
      retryTopK,
      args.planScope ?? undefined,
    );
    const retryApplied = args.applyContextAttempt(
      "retry",
      retryResult,
      retryStart,
      retryQueries,
      args.planScope ?? undefined,
    );
    const retryDurationMs = Date.now() - retryStart;
    if (retryApplied.applied) {
      args.logStepEnd(
        "Retrieval retry",
        `files=${retryResult.files.length}`,
        retryStart,
        true,
        {
          files: retryResult.files.length,
          missingSlots: retryApplied.missingSlots,
          fn: "buildAskContextFromQueries",
        },
      );
      retryMissingSlots = retryApplied.missingSlots;
      args.recordAgentAction(
        "slot_local_retry",
        "slot_missing",
        "recover_missing_slots",
        retryApplied.observedDelta ?? "applied",
        true,
        retryDurationMs,
      );
    } else {
      args.recordAgentAction(
        "slot_local_retry",
        "no_context",
        "recover_missing_slots",
        "no_context",
        false,
        retryDurationMs,
      );
    }
    args.recordControllerStep({
      step: "retry",
      action: retryApplied.applied ? "applied" : "no_context",
      reason: retryApplied.applied ? "slot_missing" : "no_context",
      evidenceOk: args.evidenceGateOk,
      slotCoverageOk: args.slotCoverageOk,
      docCoverageOk: !args.docSlotCoverageFailed,
      missingSlots: retryApplied.missingSlots,
      retrievalConfidence: args.retrievalConfidence,
    });
  }

  const missingSlotsForCodeFirst =
    (args.docSlotSummary?.missingSlots?.length ?? 0) > 0 ||
    (args.coverageSlotSummary?.missingSlots?.length ?? 0) > 0 ||
    retryMissingSlots.length > 0;

  if (args.codeFirstEnabled && missingSlotsForCodeFirst && args.canAgentAct()) {
    const codeSlotTargets =
      args.docSlotSummary?.missingSlots?.length
        ? args.docSlotSummary.missingSlots
        : args.coverageSlotSummary?.missingSlots ?? retryMissingSlots;
    const codeSlotHints = args.buildRetryHintsForSlots(codeSlotTargets);
    const codeHints = [
      ...args.topicMustIncludeFiles,
      ...args.compositeRequiredFiles,
      ...args.verificationAnchorHints,
      ...codeSlotTargets.slice(0, 4),
      ...codeSlotHints,
    ];
    const codeQueries = args.mergeQueries(
      args.baseQueries,
      codeHints,
      args.queryMergeMax + 2,
    );
    const codeScope = args.buildCodeFirstPlanScopeOverride(args.planScope ?? undefined);
    if (args.objectiveLoopEnabled && args.objectiveLoopStateLength > 0) {
      args.beginObjectiveRetrievalPass("code_first_retrieval", codeQueries);
    }
    const codeStart = args.logStepStart(
      "Retrieval code-first",
      `slots=${codeSlotTargets.length} queries=${codeQueries.length}`,
      {
        slotCount: codeSlotTargets.length,
        queryCount: codeQueries.length,
        fn: "buildAskContextFromQueries",
        phase: "codeFirst",
      },
    );
    const codeResult = await args.buildFallbackContext(
      codeQueries,
      args.requestTopK ?? args.contextFilesLimit,
      codeScope,
    );
    const codeApplied = args.applyContextAttempt(
      "code-first",
      codeResult,
      codeStart,
      codeQueries,
      codeScope,
    );
    const codeDurationMs = Date.now() - codeStart;
    if (codeApplied.applied) {
      args.logStepEnd(
        "Retrieval code-first",
        `files=${codeResult.files.length}`,
        codeStart,
        true,
        {
          files: codeResult.files.length,
          missingSlots: codeApplied.missingSlots,
          fn: "buildAskContextFromQueries",
        },
      );
      args.recordAgentAction(
        "retrieve_code_first",
        "slot_missing",
        "surface_code",
        codeApplied.observedDelta ?? "applied",
        true,
        codeDurationMs,
      );
    } else {
      args.recordAgentAction(
        "retrieve_code_first",
        "no_context",
        "surface_code",
        "no_context",
        false,
        codeDurationMs,
      );
    }
    args.recordControllerStep({
      step: "code_first",
      action: codeApplied.applied ? "applied" : "no_context",
      reason: codeApplied.applied ? "slot_missing" : "no_context",
      evidenceOk: args.evidenceGateOk,
      slotCoverageOk: args.slotCoverageOk,
      docCoverageOk: !args.docSlotCoverageFailed,
      missingSlots: codeApplied.missingSlots,
      retrievalConfidence: args.retrievalConfidence,
    });
  } else if (!args.canAgentAct() && missingSlotsForCodeFirst) {
    args.markAgentStopIfBlocked();
  }

  return {
    capsuleRetryApplied,
    retrievalRetryPolicyOverride,
    allowRetrievalRetryEffective,
    shouldRetryRetrieval,
  };
};
