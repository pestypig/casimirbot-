import type {
  HelixAskObjectiveLoopState,
  HelixAskObjectiveStepTranscript,
} from "./objective-loop-debug";
import type {
  HelixAskObjectivePromptRewriteMode,
  HelixAskObjectivePromptRewriteResult,
} from "./objective-llm-contracts";
import { runHelixAskObjectiveRetrieveProposal } from "./objective-retrieval-shell";
import {
  buildHelixAskObjectiveScopedRecoveryEscalationHints,
  buildHelixAskObjectiveScopedRecoveryQueryVariants,
  collectHelixAskObjectiveScopedRetrievalRecoveryTargets,
  expandHelixAskObjectiveScopedRecoveryTargets,
  scoreHelixAskObjectiveRecoveryVariantResult,
  shouldBypassHelixAskObjectiveScopedRetrievalAgentGate,
} from "../retrieval/objective-scoped-recovery";

type ObjectiveContractShape = {
  label?: string;
  query_hints?: string[];
};

type ObjectiveRecoveryRequestShape = {
  max_tokens?: number | null;
  temperature?: unknown;
  seed?: unknown;
  stop?: unknown;
  sessionId?: string | null;
  topK?: number | null;
};

type ObjectiveRecoveryBuildResult = {
  files: string[];
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  topicMustIncludeOk?: boolean;
};

type ObjectiveRecoveryOutcome = {
  applied: boolean;
  observedDelta?: string;
  missingSlots: string[];
};

type ObjectiveRecoveryStepStart = number;

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export type HelixAskObjectiveScopedRecoveryShellArgs = {
  objectiveLoopEnabled: boolean;
  initialObjectiveLoopState: HelixAskObjectiveLoopState[];
  getObjectiveLoopState: () => HelixAskObjectiveLoopState[];
  getObjectiveRetrievalQueriesLog: () => Array<{ objective_id: string }>;
  getObjectiveRetrievalPassCount: () => number;
  getRetrievalConfidence: () => number;
  promptIngested: boolean;
  definitionRoutingSalvagePreEligible: boolean;
  definitionRepoAnchorCueDetected: boolean;
  definitionRepoAnchorObjectiveCue: boolean;
  definitionCommonalityCueDetected: boolean;
  definitionCommonalityObjectiveCue: boolean;
  baseQuestion: string;
  responseLanguage?: string | null;
  dialogueProfile?: string | null;
  personaId?: string;
  traceId: string;
  request: ObjectiveRecoveryRequestShape;
  llmUnavailableAtTurnStart: boolean;
  answerGenerationFailedForTurn: boolean;
  preserveAnswerAcrossComposer: boolean;
  fastQualityMode: boolean;
  getFastElapsedMs: () => number;
  finalizeDeadlineMs: number;
  answerMaxTokens: number;
  queryMergeMax: number;
  contextFilesLimit: number;
  objectiveScopedRetrievalMaxObjectives: number;
  objectiveScopedRetrievalMaxQueryHints: number;
  objectivePromptRewriteMode: HelixAskObjectivePromptRewriteMode;
  objectiveRetrieveProposalMode: "llm" | "heuristic_fallback" | "none";
  objectiveRetrieveProposalFailReason: string | null;
  objectiveRetrieveProposalLlmAttempted: boolean;
  objectiveRetrieveProposalLlmInvoked: boolean;
  objectiveRetrieveProposalPromptPreview: string | null;
  objectiveRetrieveProposalAppliedCount: number;
  objectiveRetrieveProposalRepairAttempted: boolean;
  objectiveRetrieveProposalRepairSuccess: boolean;
  objectiveRetrieveProposalRepairFailReason: string | null;
  objectiveRecoveryNoContextRetryableCount: number;
  objectiveRecoveryNoContextTerminalCount: number;
  objectiveRecoveryErrorRetryableCount: number;
  objectiveRecoveryErrorTerminalCount: number;
  routingSalvageApplied: boolean;
  routingSalvageReason: string | null;
  routingSalvageRetrievalAddedCount: number;
  verificationAnchorHints: string[];
  routingSalvageHints: string[];
  contextFiles: string[];
  objectiveContractsByLabel: Map<string, ObjectiveContractShape>;
  normalizeObjectiveLabelKey: (value: string) => string;
  canAgentAct: () => boolean;
  computeObjectiveLoopPrimaryActive: () => boolean;
  buildRetryHintsForSlots: (slots: string[]) => string[];
  mergeQueries: (baseQueries: string[], extraQueries: string[], maxQueries: number) => string[];
  buildAskContextFromQueries: (
    baseQuestion: string,
    queries: string[],
    topK: number,
    topicProfile: unknown,
    options: Record<string, unknown>,
  ) => Promise<ObjectiveRecoveryBuildResult>;
  topicProfile: unknown;
  planScope?: Record<string, unknown> | null;
  intentDomain: string;
  intentId: string;
  topicTags: unknown;
  codeMixedTurn: boolean;
  applyContextAttempt: (
    label: string,
    result: ObjectiveRecoveryBuildResult,
    startedAt: ObjectiveRecoveryStepStart,
    queries: string[],
    scopeOverride?: Record<string, unknown> | null,
    objectiveIds?: string[],
  ) => ObjectiveRecoveryOutcome;
  objectiveCoverageRatio: (
    state: HelixAskObjectiveLoopState | undefined | null,
  ) => number;
  beginObjectiveRetrievalPass: (
    reason: string,
    queries: string[],
    objectiveIds?: string[],
  ) => void;
  pushObjectiveRetrievalProbe: (args: {
    objectiveId: string;
    queries: string[];
    files: string[];
    before: number;
    after: number;
    passIndex?: number;
  }) => void;
  logStepStart: (
    title: string,
    summary: string,
    details?: Record<string, unknown>,
  ) => ObjectiveRecoveryStepStart;
  logStepEnd: (
    title: string,
    summary: string,
    startedAt: ObjectiveRecoveryStepStart,
    ok: boolean,
    details?: Record<string, unknown>,
  ) => void;
  pushObjectiveStepTranscript: (entry: HelixAskObjectiveStepTranscript) => void;
  pushAnswerPath: (entry: string) => void;
  applyDialogueProfilePrompt: (
    prompt: string,
    dialogueProfile: string | null | undefined,
    baseQuestion: string,
  ) => string;
  recordPromptRewriteStage: (
    stage: "retrieve_proposal",
    rewrite: HelixAskObjectivePromptRewriteResult,
    budget?: number,
  ) => void;
  runLocalWithOverflowRetry: (
    request: Record<string, unknown>,
    context: { personaId?: string; sessionId?: string; traceId: string },
    options: Record<string, unknown>,
  ) => Promise<{ result?: { text?: unknown } | null; llm?: unknown }>;
  appendLlmCallDebug: (llm: unknown) => void;
  stripPromptEchoFromAnswer: (text: string, baseQuestion: string) => string;
  clipText: (value: string, maxChars: number) => string;
  isObjectiveRecoveryRetryableError: (errorCode: string) => boolean;
  debugPayload?: Record<string, unknown>;
  syncObjectiveLoopDebug: () => void;
};

export type HelixAskObjectiveScopedRecoveryShellResult = {
  objectiveRecoveryTargets: HelixAskObjectiveLoopState[];
  objectiveRecoveryTargetsExpanded: HelixAskObjectiveLoopState[];
  objectiveRecoveryNoContextCount: number;
  objectiveRecoveryNoContextWithFilesCount: number;
  objectiveRecoveryPassCount: number;
  objectiveRetrieveProposalMode: "llm" | "heuristic_fallback" | "none";
  objectiveRetrieveProposalFailReason: string | null;
  objectiveRetrieveProposalLlmAttempted: boolean;
  objectiveRetrieveProposalLlmInvoked: boolean;
  objectiveRetrieveProposalPromptPreview: string | null;
  objectiveRetrieveProposalAppliedCount: number;
  objectiveRetrieveProposalRepairAttempted: boolean;
  objectiveRetrieveProposalRepairSuccess: boolean;
  objectiveRetrieveProposalRepairFailReason: string | null;
  objectiveRecoveryNoContextRetryableCount: number;
  objectiveRecoveryNoContextTerminalCount: number;
  objectiveRecoveryErrorRetryableCount: number;
  objectiveRecoveryErrorTerminalCount: number;
  routingSalvageApplied: boolean;
  routingSalvageReason: string | null;
  routingSalvageRetrievalAddedCount: number;
};

export const runHelixAskObjectiveScopedRecoveryShell = async (
  args: HelixAskObjectiveScopedRecoveryShellArgs,
): Promise<HelixAskObjectiveScopedRecoveryShellResult> => {
  let objectiveRecoveryTargets = args.initialObjectiveLoopState.slice(0, 0);
  let objectiveRecoveryTargetsExpanded = args.initialObjectiveLoopState.slice(0, 0);
  let objectiveRecoveryRepeatCount = 1;
  let objectiveRecoveryNoContextCount = 0;
  let objectiveRecoveryNoContextWithFilesCount = 0;
  let objectiveRecoveryPassCount = 0;
  let objectiveRecoveryNoGainSkipCount = 0;
  let objectiveRecoveryFileCandidateStallSkipCount = 0;
  let objectiveRecoveryParallelVariantCount = 0;
  let objectiveRecoveryParallelAppliedCount = 0;
  let objectiveRetrieveProposalMode = args.objectiveRetrieveProposalMode;
  let objectiveRetrieveProposalFailReason = args.objectiveRetrieveProposalFailReason;
  let objectiveRetrieveProposalLlmAttempted = args.objectiveRetrieveProposalLlmAttempted;
  let objectiveRetrieveProposalLlmInvoked = args.objectiveRetrieveProposalLlmInvoked;
  let objectiveRetrieveProposalPromptPreview = args.objectiveRetrieveProposalPromptPreview;
  let objectiveRetrieveProposalAppliedCount = args.objectiveRetrieveProposalAppliedCount;
  let objectiveRetrieveProposalRepairAttempted = args.objectiveRetrieveProposalRepairAttempted;
  let objectiveRetrieveProposalRepairSuccess = args.objectiveRetrieveProposalRepairSuccess;
  let objectiveRetrieveProposalRepairFailReason =
    args.objectiveRetrieveProposalRepairFailReason;
  let objectiveRecoveryNoContextRetryableCount =
    args.objectiveRecoveryNoContextRetryableCount;
  let objectiveRecoveryNoContextTerminalCount =
    args.objectiveRecoveryNoContextTerminalCount;
  let objectiveRecoveryErrorRetryableCount =
    args.objectiveRecoveryErrorRetryableCount;
  let objectiveRecoveryErrorTerminalCount =
    args.objectiveRecoveryErrorTerminalCount;
  let routingSalvageApplied = args.routingSalvageApplied;
  let routingSalvageReason = args.routingSalvageReason;
  let routingSalvageRetrievalAddedCount = args.routingSalvageRetrievalAddedCount;

  const canRunObjectiveScopedRetrievalRecovery =
    args.objectiveLoopEnabled &&
    args.initialObjectiveLoopState.length > 0 &&
    (!args.promptIngested || args.definitionRoutingSalvagePreEligible);

  if (!canRunObjectiveScopedRetrievalRecovery) {
    return {
      objectiveRecoveryTargets,
      objectiveRecoveryTargetsExpanded,
      objectiveRecoveryNoContextCount,
      objectiveRecoveryNoContextWithFilesCount,
      objectiveRecoveryPassCount,
      objectiveRetrieveProposalMode,
      objectiveRetrieveProposalFailReason,
      objectiveRetrieveProposalLlmAttempted,
      objectiveRetrieveProposalLlmInvoked,
      objectiveRetrieveProposalPromptPreview,
      objectiveRetrieveProposalAppliedCount,
      objectiveRetrieveProposalRepairAttempted,
      objectiveRetrieveProposalRepairSuccess,
      objectiveRetrieveProposalRepairFailReason,
      objectiveRecoveryNoContextRetryableCount,
      objectiveRecoveryNoContextTerminalCount,
      objectiveRecoveryErrorRetryableCount,
      objectiveRecoveryErrorTerminalCount,
      routingSalvageApplied,
      routingSalvageReason,
      routingSalvageRetrievalAddedCount,
    };
  }

  const objectiveRecoveryNoGainByObjective = new Map<string, number>();
  const objectiveRecoveryNoContextWithFilesByObjective = new Map<string, number>();
  const objectiveRecoveryAttemptsByObjective = new Map<string, number>();
  let objectiveRecoveryApplied = false;
  let objectiveRecoveryCount = 0;
  let objectiveRecoveryBudgetBypassCount = 0;
  let objectiveRecoveryErrorCount = 0;
  const objectiveRecoveryErrorCodes = new Set<string>();
  let objectiveRecoverySkippedReason: string | null = null;

  objectiveRecoveryNoContextRetryableCount = 0;
  objectiveRecoveryNoContextTerminalCount = 0;
  objectiveRecoveryErrorRetryableCount = 0;
  objectiveRecoveryErrorTerminalCount = 0;

  const objectiveRetrieveProposalBudget = clampNumber(
    Math.floor((args.request.max_tokens ?? args.answerMaxTokens) * 0.22),
    120,
    360,
  );
  const objectiveRetrieveProposalModel =
    args.dialogueProfile === "dot_min_steps_v1"
      ? (process.env.LLM_HTTP_MODEL?.trim() || "gpt-4o-mini")
      : undefined;
  const objectiveLoopForceRetrieveProposalLlm =
    args.computeObjectiveLoopPrimaryActive();
  const canUseObjectiveRetrieveProposal =
    !args.llmUnavailableAtTurnStart &&
    !args.answerGenerationFailedForTurn &&
    !args.preserveAnswerAcrossComposer &&
    (objectiveLoopForceRetrieveProposalLlm ||
      !args.fastQualityMode ||
      args.getFastElapsedMs() < args.finalizeDeadlineMs);
  const definitionRoutingSalvageEligible =
    args.definitionRoutingSalvagePreEligible;

  const objectiveRecoveryTargetsBase =
    collectHelixAskObjectiveScopedRetrievalRecoveryTargets({
      states: args.getObjectiveLoopState(),
      retrievalQueries: args.getObjectiveRetrievalQueriesLog(),
      maxObjectives: args.objectiveScopedRetrievalMaxObjectives,
    });
  const routingSalvageTargets = definitionRoutingSalvageEligible
    ? args
        .getObjectiveLoopState()
        .filter((state) => state.status !== "complete" && state.status !== "blocked")
        .filter((state) => state.required_slots.length > 0)
        .slice(
          0,
          Math.max(
            1,
            Math.min(2, args.objectiveScopedRetrievalMaxObjectives),
          ),
        )
    : [];

  objectiveRecoveryTargets = definitionRoutingSalvageEligible
    ? Array.from(
        new Map(
          [...routingSalvageTargets, ...objectiveRecoveryTargetsBase].map((state) => [
            state.objective_id,
            state,
          ]),
        ).values(),
      ).slice(0, args.objectiveScopedRetrievalMaxObjectives)
    : objectiveRecoveryTargetsBase;
  objectiveRecoveryRepeatCount = definitionRoutingSalvageEligible ? 3 : 2;
  objectiveRecoveryTargetsExpanded = expandHelixAskObjectiveScopedRecoveryTargets({
    targets: objectiveRecoveryTargets,
    repeatCount: objectiveRecoveryRepeatCount,
    maxPasses:
      args.objectiveScopedRetrievalMaxObjectives * objectiveRecoveryRepeatCount,
  });
  objectiveRetrieveProposalLlmAttempted =
    objectiveRetrieveProposalLlmAttempted ||
    (canUseObjectiveRetrieveProposal &&
      objectiveRecoveryTargetsExpanded.length > 0);
  routingSalvageApplied = definitionRoutingSalvageEligible;

  const routingSalvageReasonPrefix =
    args.definitionRepoAnchorCueDetected || args.definitionRepoAnchorObjectiveCue
      ? "general_definition_repo_anchor"
      : args.definitionCommonalityCueDetected ||
          args.definitionCommonalityObjectiveCue
        ? "general_definition_commonality"
        : "general_definition";
  routingSalvageReason = definitionRoutingSalvageEligible
    ? objectiveRecoveryTargetsExpanded.length > 0
      ? `${routingSalvageReasonPrefix}_zero_context`
      : `${routingSalvageReasonPrefix}_no_recovery_targets`
    : null;
  if (definitionRoutingSalvageEligible && objectiveRecoveryTargetsExpanded.length > 0) {
    args.pushAnswerPath(
      args.definitionRepoAnchorCueDetected || args.definitionRepoAnchorObjectiveCue
        ? "routingSalvage:repo_anchor_pre_unknown_terminal"
        : "routingSalvage:commonality_pre_unknown_terminal",
    );
  }

  if (objectiveRecoveryTargetsExpanded.length > 0) {
    for (const recoveryState of objectiveRecoveryTargetsExpanded) {
      objectiveRecoveryPassCount += 1;
      const currentState = args
        .getObjectiveLoopState()
        .find((state) => state.objective_id === recoveryState.objective_id);
      if (
        !currentState ||
        currentState.status === "complete" ||
        currentState.status === "blocked"
      ) {
        continue;
      }
      if (currentState.required_slots.length === 0) continue;

      const objectiveAttemptForObjective =
        (objectiveRecoveryAttemptsByObjective.get(currentState.objective_id) ?? 0) + 1;
      objectiveRecoveryAttemptsByObjective.set(
        currentState.objective_id,
        objectiveAttemptForObjective,
      );
      const objectiveMissingSlotsAtLoopStart = currentState.required_slots.filter(
        (slot) => !currentState.matched_slots.includes(slot),
      );
      const objectiveMechanismOnlyMissingAtLoopStart =
        objectiveMissingSlotsAtLoopStart.length > 0 &&
        objectiveMissingSlotsAtLoopStart.every((slot) => slot === "mechanism");
      const objectiveNoGainStreak =
        objectiveRecoveryNoGainByObjective.get(currentState.objective_id) ?? 0;
      const objectiveNoContextWithFilesStreak =
        objectiveRecoveryNoContextWithFilesByObjective.get(currentState.objective_id) ??
        0;
      const objectiveMechanismOnlyStallSkip =
        objectiveMechanismOnlyMissingAtLoopStart &&
        objectiveNoContextWithFilesStreak >= 1 &&
        objectiveNoGainStreak >= 1;
      if (
        (objectiveNoContextWithFilesStreak >= 2 && objectiveNoGainStreak >= 2) ||
        objectiveMechanismOnlyStallSkip
      ) {
        objectiveRecoveryNoGainSkipCount += 1;
        objectiveRecoveryFileCandidateStallSkipCount += 1;
        objectiveRecoverySkippedReason =
          objectiveRecoverySkippedReason ??
          (objectiveMechanismOnlyStallSkip
            ? "objective_recovery_file_candidates_mechanism_stall"
            : "objective_recovery_file_candidates_stall");
        args.pushAnswerPath(
          `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:file_candidates_stall_skip`,
        );
        if (objectiveMechanismOnlyStallSkip) {
          args.pushAnswerPath(
            `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:mechanism_only_stall_skip`,
          );
        }
        continue;
      }
      if (objectiveNoGainStreak >= 3) {
        objectiveRecoveryNoGainSkipCount += 1;
        objectiveRecoverySkippedReason =
          objectiveRecoverySkippedReason ?? "objective_recovery_no_gain_stall";
        args.pushAnswerPath(
          `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:stall_skip`,
        );
        continue;
      }

      const objectiveHasPriorRetrievalPass = args
        .getObjectiveRetrievalQueriesLog()
        .some((entry) => entry.objective_id === currentState.objective_id);
      const agentCanActNow = args.canAgentAct();
      const routingSalvageAgentGateBypass =
        definitionRoutingSalvageEligible && !agentCanActNow;
      const objectiveAllowAgentGateBypass =
        shouldBypassHelixAskObjectiveScopedRetrievalAgentGate({
          canAgentAct: agentCanActNow,
          objectiveAttempt: 0,
          objectiveHasPriorRetrievalPass,
        }) || routingSalvageAgentGateBypass;
      if (!agentCanActNow && !objectiveAllowAgentGateBypass) {
        objectiveRecoverySkippedReason =
          objectiveRecoverySkippedReason ?? "agent_gate_blocked";
        continue;
      }
      if (objectiveAllowAgentGateBypass) {
        objectiveRecoveryBudgetBypassCount += 1;
        args.pushAnswerPath(
          `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:budget_bypass`,
        );
      }

      const objectiveContract = args.objectiveContractsByLabel.get(
        args.normalizeObjectiveLabelKey(currentState.objective_label),
      );
      const objectiveMissingSlots = objectiveMissingSlotsAtLoopStart;
      if (objectiveMissingSlots.length === 0) continue;

      const objectiveTargetSlots =
        objectiveMissingSlots.length > 0
          ? objectiveMissingSlots
          : currentState.required_slots;
      const objectiveSlotHints = args.buildRetryHintsForSlots(objectiveTargetSlots);
      const objectiveEscalationHints =
        objectiveRecoveryPassCount > 1
          ? buildHelixAskObjectiveScopedRecoveryEscalationHints({
              objectiveLabel: currentState.objective_label,
              missingSlots: objectiveTargetSlots,
              priorEvidenceRefs: args.contextFiles.slice(0, 6),
              maxHints: args.objectiveScopedRetrievalMaxQueryHints,
            })
          : [];
      const objectiveHints = [
        currentState.objective_label,
        objectiveContract?.label ?? "",
        ...(objectiveContract?.query_hints ?? []),
        ...objectiveTargetSlots,
        ...objectiveSlotHints,
        ...args.verificationAnchorHints,
        ...args.routingSalvageHints,
        ...objectiveEscalationHints,
      ]
        .filter(Boolean)
        .slice(0, args.objectiveScopedRetrievalMaxQueryHints * 2 + 2);
      const mergeQueryLimit = Math.min(
        args.queryMergeMax + 4,
        args.queryMergeMax + args.objectiveScopedRetrievalMaxQueryHints + 2,
      );
      const deterministicObjectiveQueries = args.mergeQueries(
        [args.baseQuestion],
        objectiveHints,
        mergeQueryLimit,
      );
      if (deterministicObjectiveQueries.length === 0) {
        objectiveRecoverySkippedReason =
          objectiveRecoverySkippedReason ?? "no_recovery_queries";
        continue;
      }

      let objectiveQueries = deterministicObjectiveQueries.slice();
      let objectiveRetrievePromptForTranscript: string | null = null;
      let objectiveRetrieveProposalReason: string | null = null;
      let objectiveRetrieveProposalUsed = false;
      let objectiveRetrieveProposalInvokedForObjective = false;
      const objectiveRetrieveProposalDynamicBudget = clampNumber(
        objectiveRetrieveProposalBudget + Math.max(0, objectiveRecoveryPassCount - 1) * 64,
        120,
        520,
      );
      if (canUseObjectiveRetrieveProposal) {
        const retrieveProposal = await runHelixAskObjectiveRetrieveProposal({
          baseQuestion: args.baseQuestion,
          objectiveId: currentState.objective_id,
          objectiveLabel: currentState.objective_label,
          requiredSlots: currentState.required_slots,
          missingSlots: objectiveTargetSlots,
          queryHints: objectiveHints,
          responseLanguage: args.responseLanguage,
          dialogueProfile: args.dialogueProfile,
          promptRewriteMode: args.objectivePromptRewriteMode,
          proposalBudget: objectiveRetrieveProposalDynamicBudget,
          mergeQueryLimit,
          deterministicQueries: deterministicObjectiveQueries,
          temperature: args.request.temperature,
          seed: args.request.seed,
          stop: args.request.stop,
          model: objectiveRetrieveProposalModel,
          personaId: args.personaId,
          sessionId: args.request.sessionId ?? undefined,
          traceId: args.traceId,
          applyDialogueProfilePrompt: args.applyDialogueProfilePrompt,
          recordPromptRewriteStage: args.recordPromptRewriteStage,
          runLocalWithOverflowRetry: args.runLocalWithOverflowRetry,
          appendLlmCallDebug: args.appendLlmCallDebug,
          stripPromptEchoFromAnswer: args.stripPromptEchoFromAnswer,
          clipText: args.clipText,
          mergeQueries: args.mergeQueries,
          onSchemaRepairApplied: () =>
            args.pushAnswerPath("objectiveRetrieveProposal:llm_schema_repair"),
        });
        objectiveRetrieveProposalLlmInvoked =
          objectiveRetrieveProposalLlmInvoked || retrieveProposal.invoked;
        objectiveRetrieveProposalInvokedForObjective = retrieveProposal.invoked;
        objectiveRetrieveProposalPromptPreview =
          retrieveProposal.promptPreview ?? objectiveRetrieveProposalPromptPreview;
        objectiveRetrievePromptForTranscript = retrieveProposal.promptForTranscript;
        objectiveRetrieveProposalRepairAttempted =
          objectiveRetrieveProposalRepairAttempted || retrieveProposal.repairAttempted;
        objectiveRetrieveProposalRepairSuccess =
          objectiveRetrieveProposalRepairSuccess || retrieveProposal.repairSuccess;
        if (!objectiveRetrieveProposalRepairSuccess && retrieveProposal.repairFailReason) {
          objectiveRetrieveProposalRepairFailReason =
            retrieveProposal.repairFailReason;
        } else if (retrieveProposal.repairSuccess) {
          objectiveRetrieveProposalRepairFailReason = null;
        }
        if (retrieveProposal.used) {
          objectiveQueries = retrieveProposal.queries;
          objectiveRetrieveProposalMode = "llm";
          objectiveRetrieveProposalFailReason = null;
          objectiveRetrieveProposalAppliedCount += 1;
          objectiveRetrieveProposalUsed = true;
          objectiveRetrieveProposalReason = retrieveProposal.reason;
          args.pushAnswerPath(
            `objectiveRetrieveProposal:${currentState.objective_id}:llm`,
          );
        } else {
          objectiveRetrieveProposalReason = retrieveProposal.reason;
          if (objectiveRetrieveProposalMode !== "llm") {
            objectiveRetrieveProposalMode = "heuristic_fallback";
            objectiveRetrieveProposalFailReason =
              retrieveProposal.failReason ?? retrieveProposal.reason;
          }
          args.pushAnswerPath(
            `objectiveRetrieveProposal:${currentState.objective_id}:fallback`,
          );
        }
      } else if (objectiveRetrieveProposalMode !== "llm") {
        objectiveRetrieveProposalMode = "heuristic_fallback";
        objectiveRetrieveProposalFailReason = "objective_retrieve_proposal_llm_skipped";
      }

      if (definitionRoutingSalvageEligible) {
        routingSalvageRetrievalAddedCount += 1;
      }
      const objectiveQueryVariants = buildHelixAskObjectiveScopedRecoveryQueryVariants({
        baseQuestion: args.baseQuestion,
        primaryQueries: objectiveQueries,
        objectiveLabel: currentState.objective_label,
        missingSlots: objectiveTargetSlots,
        maxQueries: mergeQueryLimit,
        maxVariants: objectiveRecoveryPassCount <= 2 ? 2 : 1,
      });
      const objectiveVariantQueries = objectiveQueryVariants.filter(
        (variant) => Array.isArray(variant) && variant.length > 0,
      );
      const objectivePrimaryQueries =
        objectiveVariantQueries[0]?.length ? objectiveVariantQueries[0] : objectiveQueries;
      objectiveQueries = objectivePrimaryQueries;
      objectiveRecoveryParallelVariantCount += Math.max(
        0,
        objectiveVariantQueries.length - 1,
      );
      args.beginObjectiveRetrievalPass(
        `objective_recovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}`,
        objectiveQueries,
        [currentState.objective_id],
      );
      const objectivePassIndex = args.getObjectiveRetrievalPassCount();
      const objectiveBefore = args.getRetrievalConfidence();
      const objectiveCoverageBefore = args.objectiveCoverageRatio(currentState);
      const objectiveRecoveryTopK = Math.min(
        args.contextFilesLimit,
        (args.request.topK ?? args.contextFilesLimit) + Math.max(0, objectiveRecoveryPassCount - 1),
      );
      const objectiveRetrievalStartedAt = new Date().toISOString();
      const objectiveStart = args.logStepStart(
        "Retrieval objective-recovery",
        `${currentState.objective_id} attempt=${objectiveRecoveryPassCount} queries=${objectiveQueries.length}`,
        {
          objectiveId: currentState.objective_id,
          attempt: objectiveRecoveryPassCount,
          queryCount: objectiveQueries.length,
          topK: objectiveRecoveryTopK,
          fn: "buildAskContextFromQueries",
          phase: "objective_recovery",
        },
      );

      try {
        const objectiveRecoveryOptions = {
          ...(args.planScope ?? {}),
          mode: "fallback" as const,
          intentDomain: args.intentDomain,
          intentId: args.intentId,
          topicTags: args.topicTags,
          sessionId: args.request.sessionId ?? null,
          codeMixed: args.codeMixedTurn,
        };
        let objectiveResult: ObjectiveRecoveryBuildResult;
        if (objectiveVariantQueries.length > 1) {
          const objectiveVariantOutcomes = await Promise.allSettled(
            objectiveVariantQueries.map((variantQueries) =>
              args.buildAskContextFromQueries(
                args.baseQuestion,
                variantQueries,
                objectiveRecoveryTopK,
                args.topicProfile,
                objectiveRecoveryOptions,
              ),
            ),
          );
          const fulfilledVariants = objectiveVariantOutcomes
            .map((outcome, index) => {
              if (outcome.status !== "fulfilled") return null;
              const variantResult = outcome.value;
              return {
                index,
                queries: objectiveVariantQueries[index] ?? objectiveQueries,
                result: variantResult,
                score: scoreHelixAskObjectiveRecoveryVariantResult(variantResult),
              };
            })
            .filter(
              (
                entry,
              ): entry is {
                index: number;
                queries: string[];
                result: ObjectiveRecoveryBuildResult;
                score: number;
              } => Boolean(entry),
            );
          if (fulfilledVariants.length === 0) {
            const firstRejected = objectiveVariantOutcomes.find(
              (entry) => entry.status === "rejected",
            );
            throw (
              firstRejected && firstRejected.status === "rejected"
                ? firstRejected.reason
                : new Error("objective_recovery_no_variant_result")
            );
          }
          const bestVariant = fulfilledVariants.reduce((best, current) => {
            if (current.score > best.score) return current;
            if (current.score === best.score && current.index < best.index) {
              return current;
            }
            return best;
          }, fulfilledVariants[0]);
          objectiveResult = bestVariant.result;
          objectiveQueries = bestVariant.queries;
          args.pushAnswerPath(
            `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:parallel_variant_selected:v${bestVariant.index + 1}`,
          );
          if (bestVariant.index > 0) {
            objectiveRecoveryParallelAppliedCount += 1;
            args.pushAnswerPath(
              `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:parallel_variant_applied`,
            );
          }
        } else {
          objectiveResult = await args.buildAskContextFromQueries(
            args.baseQuestion,
            objectiveQueries,
            objectiveRecoveryTopK,
            args.topicProfile,
            objectiveRecoveryOptions,
          );
        }

        const objectiveOutcome = args.applyContextAttempt(
          `objective-recovery-${currentState.objective_id}-attempt-${objectiveRecoveryPassCount}`,
          objectiveResult,
          objectiveStart,
          objectiveQueries,
          args.planScope ?? undefined,
          [currentState.objective_id],
        );
        const objectiveAfter = args.getRetrievalConfidence();
        args.pushObjectiveRetrievalProbe({
          objectiveId: currentState.objective_id,
          queries: objectiveQueries,
          files: objectiveResult.files,
          before: objectiveBefore,
          after: objectiveAfter,
          passIndex: objectivePassIndex,
        });
        const objectiveAfterState = args
          .getObjectiveLoopState()
          .find((state) => state.objective_id === currentState.objective_id);
        const objectiveCoverageAfter =
          args.objectiveCoverageRatio(objectiveAfterState);
        const objectiveMissingAfter = objectiveAfterState
          ? objectiveAfterState.required_slots.filter(
              (slot) => !objectiveAfterState.matched_slots.includes(slot),
            )
          : objectiveOutcome.missingSlots;
        const objectiveHasFileCandidates = objectiveResult.files.length > 0;
        const objectiveCoverageImproved =
          objectiveCoverageAfter > objectiveCoverageBefore;
        const objectiveConfidenceImproved = objectiveAfter > objectiveBefore;
        const objectiveRetrieveProposalLlmModel =
          objectiveRetrieveProposalInvokedForObjective
            ? objectiveRetrieveProposalModel ??
              process.env.LLM_HTTP_MODEL?.trim() ??
              "gpt-4o-mini"
            : null;
        if (objectiveOutcome.applied) {
          objectiveRecoveryApplied = true;
          objectiveRecoveryCount += 1;
          objectiveRecoveryNoGainByObjective.set(currentState.objective_id, 0);
          objectiveRecoveryNoContextWithFilesByObjective.set(
            currentState.objective_id,
            0,
          );
          args.pushAnswerPath(
            `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:applied`,
          );
          args.logStepEnd(
            "Retrieval objective-recovery",
            `files=${objectiveResult.files.length} remaining=${objectiveMissingAfter.length}`,
            objectiveStart,
            true,
            {
              objectiveId: currentState.objective_id,
              attempt: objectiveRecoveryPassCount,
              files: objectiveResult.files.length,
              missingSlots: objectiveMissingAfter,
              fn: "buildAskContextFromQueries",
            },
          );
          args.pushObjectiveStepTranscript({
            objective_id: currentState.objective_id,
            attempt: objectiveRecoveryPassCount,
            verb: "RETRIEVE",
            phase: "objective_loop",
            started_at: objectiveRetrievalStartedAt,
            ended_at: new Date().toISOString(),
            llm_model: objectiveRetrieveProposalLlmModel,
            reasoning_effort: objectiveRetrieveProposalInvokedForObjective ? "medium" : null,
            schema_name: "helix.ask.retrieve.proposal.v2",
            schema_valid: objectiveRetrieveProposalInvokedForObjective
              ? objectiveRetrieveProposalUsed
              : true,
            prompt_preview: args.clipText(
              objectiveRetrievePromptForTranscript ?? objectiveQueries.join(" | "),
              240,
            ),
            output_preview: args.clipText(
              `files=${objectiveResult.files.length}; missing=${objectiveMissingAfter.join(", ") || "none"}`,
              280,
            ),
            decision: objectiveRetrieveProposalUsed
              ? "retrieval_proposal_llm_applied"
              : "retrieval_applied",
            decision_reason: objectiveRetrieveProposalUsed
              ? objectiveRetrieveProposalReason
              : objectiveMissingAfter.length === 0
                ? "objective_slots_closed"
                : objectiveRetrieveProposalReason,
            evidence_delta: {
              before_ref_count: 0,
              after_ref_count: objectiveResult.files.length,
              before_coverage_ratio: objectiveCoverageBefore,
              after_coverage_ratio: objectiveCoverageAfter,
              before_oes: objectiveBefore,
              after_oes: objectiveAfter,
            },
            validator: {
              preconditions_ok: objectiveQueries.length > 0,
              postconditions_ok: true,
              violations:
                objectiveRetrieveProposalInvokedForObjective &&
                !objectiveRetrieveProposalUsed &&
                objectiveRetrieveProposalReason
                  ? [objectiveRetrieveProposalReason]
                  : [],
            },
          });
        } else {
          if (objectiveCoverageImproved || objectiveConfidenceImproved) {
            objectiveRecoveryNoGainByObjective.set(currentState.objective_id, 0);
            objectiveRecoveryNoContextWithFilesByObjective.set(
              currentState.objective_id,
              0,
            );
          } else {
            objectiveRecoveryNoGainByObjective.set(
              currentState.objective_id,
              (objectiveRecoveryNoGainByObjective.get(currentState.objective_id) ?? 0) + 1,
            );
          }
          const objectiveNoContextDetail = objectiveHasFileCandidates
            ? "no_context_with_files"
            : "no_context";
          if (objectiveHasFileCandidates) {
            objectiveRecoveryNoContextWithFilesCount += 1;
            objectiveRecoveryNoContextWithFilesByObjective.set(
              currentState.objective_id,
              (objectiveRecoveryNoContextWithFilesByObjective.get(currentState.objective_id) ?? 0) + 1,
            );
            args.pushAnswerPath(
              `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:file_candidates_no_context`,
            );
          } else {
            objectiveRecoveryNoContextCount += 1;
            args.pushAnswerPath(
              `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:no_context`,
            );
          }
          const objectiveNoContextNoGainStreak =
            objectiveRecoveryNoGainByObjective.get(currentState.objective_id) ?? 0;
          const objectiveNoContextWithFilesStreak =
            objectiveRecoveryNoContextWithFilesByObjective.get(currentState.objective_id) ?? 0;
          const objectiveNoContextAttemptCount =
            objectiveRecoveryAttemptsByObjective.get(currentState.objective_id) ??
            objectiveRecoveryPassCount;
          const objectiveNoContextTerminal = objectiveHasFileCandidates
            ? objectiveNoContextAttemptCount >= 2 &&
              objectiveNoContextWithFilesStreak >= 2 &&
              objectiveNoContextNoGainStreak >= 2
            : objectiveNoContextAttemptCount >= 2 &&
              objectiveNoContextNoGainStreak >= 2;
          if (objectiveNoContextTerminal) {
            objectiveRecoveryNoContextTerminalCount += 1;
            args.pushAnswerPath(
              `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:no_context_terminal`,
            );
          } else {
            objectiveRecoveryNoContextRetryableCount += 1;
            args.pushAnswerPath(
              `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:no_context_retryable`,
            );
          }
          const objectiveNoContextReasonSuffix = objectiveNoContextTerminal
            ? "terminal"
            : "retryable";
          const objectiveNoContextDecisionReason = `${
            objectiveRetrieveProposalReason ?? objectiveNoContextDetail
          }:${objectiveNoContextReasonSuffix}`;
          args.logStepEnd(
            "Retrieval objective-recovery",
            `${objectiveNoContextDetail}:${objectiveNoContextReasonSuffix}`,
            objectiveStart,
            false,
            {
              objectiveId: currentState.objective_id,
              attempt: objectiveRecoveryPassCount,
              fn: "buildAskContextFromQueries",
              classification: objectiveNoContextReasonSuffix,
              objectiveAttempt: objectiveNoContextAttemptCount,
              noContextWithFilesStreak: objectiveNoContextWithFilesStreak,
              noGainStreak: objectiveNoContextNoGainStreak,
            },
          );
          args.pushObjectiveStepTranscript({
            objective_id: currentState.objective_id,
            attempt: objectiveRecoveryPassCount,
            verb: "RETRIEVE",
            phase: "objective_loop",
            started_at: objectiveRetrievalStartedAt,
            ended_at: new Date().toISOString(),
            llm_model: objectiveRetrieveProposalLlmModel,
            reasoning_effort: objectiveRetrieveProposalInvokedForObjective ? "medium" : null,
            schema_name: "helix.ask.retrieve.proposal.v2",
            schema_valid: objectiveRetrieveProposalInvokedForObjective
              ? objectiveRetrieveProposalUsed
              : true,
            prompt_preview: args.clipText(
              objectiveRetrievePromptForTranscript ?? objectiveQueries.join(" | "),
              240,
            ),
            output_preview: "no_context",
            decision: "retrieval_no_context",
            decision_reason: objectiveNoContextDecisionReason,
            evidence_delta: {
              before_ref_count: 0,
              after_ref_count: 0,
              before_coverage_ratio: objectiveCoverageBefore,
              after_coverage_ratio: objectiveCoverageAfter,
              before_oes: objectiveBefore,
              after_oes: objectiveAfter,
            },
            validator: {
              preconditions_ok: objectiveQueries.length > 0,
              postconditions_ok: false,
              violations: [
                objectiveRetrieveProposalInvokedForObjective &&
                !objectiveRetrieveProposalUsed &&
                objectiveRetrieveProposalReason
                  ? objectiveRetrieveProposalReason
                  : objectiveNoContextDecisionReason,
              ],
            },
          });
        }
      } catch (error) {
        objectiveRecoveryErrorCount += 1;
        const errorCode =
          error instanceof Error
            ? error.message || error.name || "objective_recovery_error"
            : String(error);
        if (errorCode) {
          objectiveRecoveryErrorCodes.add(errorCode);
        }
        const objectiveRecoveryErrorRetryable =
          args.isObjectiveRecoveryRetryableError(errorCode);
        if (objectiveRecoveryErrorRetryable) {
          objectiveRecoveryErrorRetryableCount += 1;
        } else {
          objectiveRecoveryErrorTerminalCount += 1;
        }
        objectiveRecoverySkippedReason =
          objectiveRecoverySkippedReason ?? "objective_recovery_error";
        args.pushAnswerPath(
          `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:error`,
        );
        args.pushAnswerPath(
          `objectiveScopedRetrievalRecovery:${currentState.objective_id}:attempt${objectiveRecoveryPassCount}:${
            objectiveRecoveryErrorRetryable ? "error_retryable" : "error_terminal"
          }`,
        );
        args.logStepEnd(
          "Retrieval objective-recovery",
          `error:${objectiveRecoveryErrorRetryable ? "retryable" : "terminal"}`,
          objectiveStart,
          false,
          {
            objectiveId: currentState.objective_id,
            attempt: objectiveRecoveryPassCount,
            fn: "buildAskContextFromQueries",
            error: errorCode,
            classification: objectiveRecoveryErrorRetryable ? "retryable" : "terminal",
          },
        );
        args.pushObjectiveStepTranscript({
          objective_id: currentState.objective_id,
          attempt: objectiveRecoveryPassCount,
          verb: "RETRIEVE",
          phase: "objective_loop",
          started_at: objectiveRetrievalStartedAt,
          ended_at: new Date().toISOString(),
          llm_model: objectiveRetrieveProposalInvokedForObjective
            ? objectiveRetrieveProposalModel ??
              process.env.LLM_HTTP_MODEL?.trim() ??
              "gpt-4o-mini"
            : null,
          reasoning_effort: objectiveRetrieveProposalInvokedForObjective ? "medium" : null,
          schema_name: "helix.ask.retrieve.proposal.v2",
          schema_valid: false,
          prompt_preview: args.clipText(
            objectiveRetrievePromptForTranscript ?? objectiveQueries.join(" | "),
            240,
          ),
          output_preview: args.clipText(errorCode, 200),
          decision: "retrieval_error",
          decision_reason: `${objectiveRetrieveProposalReason ?? errorCode}:${
            objectiveRecoveryErrorRetryable ? "retryable" : "terminal"
          }`,
          evidence_delta: {
            before_ref_count: 0,
            after_ref_count: 0,
            before_coverage_ratio: objectiveCoverageBefore,
            after_coverage_ratio: objectiveCoverageBefore,
            before_oes: objectiveBefore,
            after_oes: objectiveBefore,
          },
          validator: {
            preconditions_ok: objectiveQueries.length > 0,
            postconditions_ok: false,
            violations: [
              objectiveRetrieveProposalInvokedForObjective &&
              !objectiveRetrieveProposalUsed &&
              objectiveRetrieveProposalReason
                ? objectiveRetrieveProposalReason
                : errorCode,
            ],
          },
        });
        continue;
      }
    }
  }

  if (args.debugPayload) {
    args.debugPayload.objective_scoped_retrieval_recovery_attempted = true;
    args.debugPayload.objective_scoped_retrieval_recovery_target_count =
      objectiveRecoveryTargets.length;
    args.debugPayload.objective_scoped_retrieval_recovery_pass_target_count =
      objectiveRecoveryTargetsExpanded.length;
    args.debugPayload.objective_scoped_retrieval_recovery_repeat_count =
      objectiveRecoveryRepeatCount;
    args.debugPayload.objective_scoped_retrieval_recovery_applied =
      objectiveRecoveryApplied;
    args.debugPayload.objective_scoped_retrieval_recovery_count =
      objectiveRecoveryCount;
    args.debugPayload.objective_scoped_retrieval_recovery_pass_count =
      objectiveRecoveryPassCount;
    args.debugPayload.objective_scoped_retrieval_recovery_budget_bypass_count =
      objectiveRecoveryBudgetBypassCount;
    args.debugPayload.objective_scoped_retrieval_recovery_no_context_count =
      objectiveRecoveryNoContextCount;
    args.debugPayload.objective_scoped_retrieval_recovery_no_context_with_files_count =
      objectiveRecoveryNoContextWithFilesCount;
    args.debugPayload.objective_scoped_retrieval_recovery_no_context_retryable_count =
      objectiveRecoveryNoContextRetryableCount;
    args.debugPayload.objective_scoped_retrieval_recovery_no_context_terminal_count =
      objectiveRecoveryNoContextTerminalCount;
    args.debugPayload.objective_scoped_retrieval_recovery_no_gain_skip_count =
      objectiveRecoveryNoGainSkipCount;
    args.debugPayload.objective_scoped_retrieval_recovery_file_candidate_stall_skip_count =
      objectiveRecoveryFileCandidateStallSkipCount;
    args.debugPayload.objective_scoped_retrieval_recovery_parallel_variant_count =
      objectiveRecoveryParallelVariantCount;
    args.debugPayload.objective_scoped_retrieval_recovery_parallel_applied_count =
      objectiveRecoveryParallelAppliedCount;
    args.debugPayload.objective_scoped_retrieval_recovery_error_count =
      objectiveRecoveryErrorCount;
    args.debugPayload.objective_scoped_retrieval_recovery_error_retryable_count =
      objectiveRecoveryErrorRetryableCount;
    args.debugPayload.objective_scoped_retrieval_recovery_error_terminal_count =
      objectiveRecoveryErrorTerminalCount;
    args.debugPayload.objective_scoped_retrieval_recovery_error_codes =
      Array.from(objectiveRecoveryErrorCodes).slice(0, 8);
    args.debugPayload.objective_scoped_retrieval_recovery_skipped_reason =
      objectiveRecoverySkippedReason;
    args.debugPayload.routing_salvage_applied = routingSalvageApplied;
    args.debugPayload.routing_salvage_reason = routingSalvageReason;
    args.debugPayload.routing_salvage_retrieval_added_count =
      routingSalvageRetrievalAddedCount;
  }
  args.syncObjectiveLoopDebug();

  return {
    objectiveRecoveryTargets,
    objectiveRecoveryTargetsExpanded,
    objectiveRecoveryNoContextCount,
    objectiveRecoveryNoContextWithFilesCount,
    objectiveRecoveryPassCount,
    objectiveRetrieveProposalMode,
    objectiveRetrieveProposalFailReason,
    objectiveRetrieveProposalLlmAttempted,
    objectiveRetrieveProposalLlmInvoked,
    objectiveRetrieveProposalPromptPreview,
    objectiveRetrieveProposalAppliedCount,
    objectiveRetrieveProposalRepairAttempted,
    objectiveRetrieveProposalRepairSuccess,
    objectiveRetrieveProposalRepairFailReason,
    objectiveRecoveryNoContextRetryableCount,
    objectiveRecoveryNoContextTerminalCount,
    objectiveRecoveryErrorRetryableCount,
    objectiveRecoveryErrorTerminalCount,
    routingSalvageApplied,
    routingSalvageReason,
    routingSalvageRetrievalAddedCount,
  };
};
