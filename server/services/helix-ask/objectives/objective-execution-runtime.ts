import {
  applyHelixAskObjectiveMiniCritique,
  applyHelixAskObjectiveMiniSynth,
  buildHelixAskObjectiveMiniCritiquePrompt,
  buildHelixAskObjectiveMiniSynthPrompt,
  parseHelixAskObjectiveMiniCritique,
  parseHelixAskObjectiveMiniSynth,
  rewriteHelixAskObjectivePromptV1,
  type HelixAskObjectivePromptRewriteMode,
  type HelixAskObjectivePromptRewriteResult,
} from "./objective-llm-contracts";
import {
  HELIX_ASK_OBJECTIVE_OES_BLOCKED_THRESHOLD,
  HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD,
  enforceHelixAskObjectiveEvidenceSufficiency,
  enforceHelixAskObjectiveUnknownBlocks,
  hasHelixAskObjectiveUnknownBlock,
  isHelixAskObjectiveTerminalStatus,
  type HelixAskObjectiveEvidenceScore,
  type HelixAskObjectiveLoopState,
  type HelixAskObjectiveMiniAnswer,
  type HelixAskObjectiveMiniValidation,
  type HelixAskObjectiveLoopStatus,
  type HelixAskObjectiveStepTranscript,
} from "./objective-loop-debug";
import { enforceHelixAskObjectiveScopedRetrievalRequirementForMiniAnswers } from "../retrieval/objective-scoped-recovery";

type RunLocalWithOverflowRetryResult = {
  result?: { text?: unknown } | null;
  llm?: unknown;
};

type ObjectiveMiniRequestShape = {
  max_tokens?: number | null;
  temperature?: unknown;
  seed?: unknown;
  stop?: unknown;
  sessionId?: string | null;
};

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const summarizeObjectiveMiniValidation = (
  miniAnswers: HelixAskObjectiveMiniAnswer[],
): HelixAskObjectiveMiniValidation => {
  const total = miniAnswers.length;
  const covered = miniAnswers.filter((entry) => entry.status === "covered").length;
  const partial = miniAnswers.filter((entry) => entry.status === "partial").length;
  const blocked = miniAnswers.filter((entry) => entry.status === "blocked").length;
  const unresolved = Math.max(0, total - covered);
  return {
    total,
    covered,
    partial,
    blocked,
    unresolved,
  };
};

const objectiveCoverageRatio = (state: HelixAskObjectiveLoopState | undefined | null): number => {
  if (!state || state.required_slots.length === 0) return 0;
  return Number((state.matched_slots.length / Math.max(1, state.required_slots.length)).toFixed(4));
};

export type HelixAskObjectiveMiniExecutionArgs = {
  request: ObjectiveMiniRequestShape;
  answerMaxTokens: number;
  baseQuestion: string;
  responseLanguage?: string | null;
  dialogueProfile?: string | null;
  personaId?: string;
  traceId: string;
  llmUnavailableAtTurnStart: boolean;
  answerGenerationFailedForTurn: boolean;
  preserveAnswerAcrossComposer: boolean;
  fastQualityMode: boolean;
  getFastElapsedMs: () => number;
  finalizeDeadlineMs: number;
  objectiveRecoveryNoContextCount: number;
  objectiveRecoveryNoContextWithFilesCount: number;
  objectiveRecoveryPassCount: number;
  objectiveRecoveryTargetsLength: number;
  objectiveScopedRetrievalMaxObjectives: number;
  objectivePromptRewriteMode: HelixAskObjectivePromptRewriteMode;
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveMiniAnswers: HelixAskObjectiveMiniAnswer[];
  objectiveRetrievalQueriesLog: Array<Record<string, unknown>>;
  debugPayload?: Record<string, unknown>;
  applyDialogueProfilePrompt: (
    prompt: string,
    dialogueProfile: string | null | undefined,
    baseQuestion: string,
  ) => string;
  recordPromptRewriteStage: (
    stage: "mini_synth" | "mini_critic",
    rewrite: HelixAskObjectivePromptRewriteResult,
    budget?: number,
  ) => void;
  runLocalWithOverflowRetry: (
    request: Record<string, unknown>,
    context: { personaId?: string; sessionId?: string; traceId: string },
    options: Record<string, unknown>,
  ) => Promise<RunLocalWithOverflowRetryResult>;
  appendLlmCallDebug: (llm: unknown) => void;
  stripPromptEchoFromAnswer: (text: string, baseQuestion: string) => string;
  clipText: (value: string, maxChars: number) => string;
  pushAnswerPath: (entry: string) => void;
  pushObjectiveStepTranscript: (entry: HelixAskObjectiveStepTranscript) => void;
  recordObjectiveTransition: (
    state: HelixAskObjectiveLoopState,
    to: HelixAskObjectiveLoopStatus,
    reason: string,
    at?: string,
  ) => HelixAskObjectiveLoopState;
};

export type HelixAskObjectiveMiniExecutionResult = {
  objectiveLoopState: HelixAskObjectiveLoopState[];
  objectiveMiniAnswers: HelixAskObjectiveMiniAnswer[];
  objectiveMiniValidation: HelixAskObjectiveMiniValidation;
  objectiveMiniSynthMode: "llm" | "heuristic_fallback" | "none";
  objectiveMiniSynthFailReason: string | null;
  objectiveMiniSynthLlmAttempted: boolean;
  objectiveMiniSynthLlmInvoked: boolean;
  objectiveMiniSynthPromptPreview: string | null;
  objectiveMiniSynthRepairAttempted: boolean;
  objectiveMiniSynthRepairSuccess: boolean;
  objectiveMiniSynthRepairFailReason: string | null;
  objectiveMiniCriticMode: "llm" | "heuristic_fallback" | "none";
  objectiveMiniCriticFailReason: string | null;
  objectiveMiniCriticLlmAttempted: boolean;
  objectiveMiniCriticLlmInvoked: boolean;
  objectiveMiniCriticPromptPreview: string | null;
  objectiveMiniCriticRepairAttempted: boolean;
  objectiveMiniCriticRepairSuccess: boolean;
  objectiveMiniCriticRepairFailReason: string | null;
  objectiveMissingScopedRetrievalIds: string[];
  objectiveMissingScopedRetrievalAny: boolean;
  objectiveMissingScopedRetrievalCount: number;
  objectiveUnknownBlockObjectiveIds: string[];
  objectiveUnresolvedWithoutUnknownBlockIds: string[];
  objectiveOesScores: HelixAskObjectiveEvidenceScore[];
  objectiveTerminalizationReasons: Record<string, string>;
  objectiveGateConsistencyBlocked: boolean;
  validationPassed: boolean;
  validationFailReason: string | null;
};

export const runHelixAskObjectiveMiniExecution = async (
  args: HelixAskObjectiveMiniExecutionArgs,
): Promise<HelixAskObjectiveMiniExecutionResult> => {
  let objectiveLoopState = args.objectiveLoopState.slice();
  let objectiveMiniAnswers = args.objectiveMiniAnswers.slice();
  let objectiveMiniSynthLlmAttempted = false;
  let objectiveMiniSynthLlmInvoked = false;
  let objectiveMiniSynthFailReason: string | null = null;
  let objectiveMiniSynthMode: "llm" | "heuristic_fallback" | "none" = "none";
  let objectiveMiniSynthPromptPreview: string | null = null;
  let objectiveMiniSynthRepairAttempted = false;
  let objectiveMiniSynthRepairSuccess = false;
  let objectiveMiniSynthRepairFailReason: string | null = null;
  let objectiveMiniCriticLlmAttempted = false;
  let objectiveMiniCriticLlmInvoked = false;
  let objectiveMiniCriticFailReason: string | null = null;
  let objectiveMiniCriticMode: "llm" | "heuristic_fallback" | "none" = "none";
  let objectiveMiniCriticPromptPreview: string | null = null;
  let objectiveMiniCriticRepairAttempted = false;
  let objectiveMiniCriticRepairSuccess = false;
  let objectiveMiniCriticRepairFailReason: string | null = null;
  let objectiveOesScores: HelixAskObjectiveEvidenceScore[] = [];
  let objectiveTerminalizationReasons: Record<string, string> = {};
  let objectiveMissingScopedRetrievalIds: string[] = [];
  let objectiveMissingScopedRetrievalAny = false;
  let objectiveMissingScopedRetrievalCount = 0;
  let objectiveUnknownBlockObjectiveIds: string[] = [];
  let objectiveUnresolvedWithoutUnknownBlockIds: string[] = [];
  let objectiveGateConsistencyBlocked = false;
  let validationPassed = true;
  let validationFailReason: string | null = null;

  const objectiveMiniBudgetEscalated =
    args.objectiveRecoveryNoContextCount > 0 ||
    args.objectiveRecoveryNoContextWithFilesCount > 0 ||
    args.objectiveRecoveryPassCount > args.objectiveRecoveryTargetsLength;
  const objectiveMiniBudgetMultiplier = objectiveMiniBudgetEscalated ? 1.2 : 1;
  const objectiveMiniCriticBudget = clampNumber(
    Math.floor((args.request.max_tokens ?? args.answerMaxTokens) * 0.3 * objectiveMiniBudgetMultiplier),
    140,
    520,
  );
  const objectiveMiniSynthBudget = clampNumber(
    Math.floor((args.request.max_tokens ?? args.answerMaxTokens) * 0.35 * objectiveMiniBudgetMultiplier),
    160,
    640,
  );

  if (args.debugPayload) {
    args.debugPayload.objective_mini_budget_escalated = objectiveMiniBudgetEscalated;
    args.debugPayload.objective_mini_budget_multiplier = objectiveMiniBudgetMultiplier;
    args.debugPayload.objective_mini_critic_budget = objectiveMiniCriticBudget;
    args.debugPayload.objective_mini_synth_budget = objectiveMiniSynthBudget;
  }

  const objectiveMiniSynthModel =
    args.dialogueProfile === "dot_min_steps_v1"
      ? (process.env.LLM_HTTP_MODEL?.trim() || "gpt-4o-mini")
      : undefined;
  const objectiveMiniCriticModel =
    args.dialogueProfile === "dot_min_steps_v1"
      ? (process.env.LLM_HTTP_MODEL?.trim() || "gpt-4o-mini")
      : undefined;
  const objectiveLoopForceStageLlm = objectiveLoopState.some(
    (state) => state.required_slots.length > 0,
  );
  const canUseObjectiveMiniSynth =
    !args.llmUnavailableAtTurnStart &&
    !args.answerGenerationFailedForTurn &&
    !args.preserveAnswerAcrossComposer &&
    (objectiveLoopForceStageLlm ||
      !args.fastQualityMode ||
      args.getFastElapsedMs() < args.finalizeDeadlineMs);
  const canUseObjectiveMiniCritic =
    !args.llmUnavailableAtTurnStart &&
    !args.answerGenerationFailedForTurn &&
    !args.preserveAnswerAcrossComposer &&
    (objectiveLoopForceStageLlm ||
      !args.fastQualityMode ||
      args.getFastElapsedMs() < args.finalizeDeadlineMs);

  objectiveMiniSynthLlmAttempted = canUseObjectiveMiniSynth;
  objectiveMiniCriticLlmAttempted = canUseObjectiveMiniCritic;

  if (objectiveMiniAnswers.length > 0) {
    if (canUseObjectiveMiniSynth) {
      try {
        objectiveMiniSynthLlmInvoked = true;
        const objectiveMiniSynthPromptBase = args.applyDialogueProfilePrompt(
          buildHelixAskObjectiveMiniSynthPrompt({
            question: args.baseQuestion,
            miniAnswers: objectiveMiniAnswers,
            responseLanguage: args.responseLanguage,
          }),
          args.dialogueProfile,
          args.baseQuestion,
        );
        const objectiveMiniSynthPromptRewrite = rewriteHelixAskObjectivePromptV1({
          stage: "mini_synth",
          basePrompt: objectiveMiniSynthPromptBase,
          mode: args.objectivePromptRewriteMode,
          responseLanguage: args.responseLanguage,
        });
        args.recordPromptRewriteStage(
          "mini_synth",
          objectiveMiniSynthPromptRewrite,
          objectiveMiniSynthBudget,
        );
        const objectiveMiniSynthPrompt = objectiveMiniSynthPromptRewrite.effectivePrompt;
        objectiveMiniSynthPromptPreview = args.clipText(objectiveMiniSynthPrompt, 1200);
        const objectiveMiniSynthAttempt = await args.runLocalWithOverflowRetry(
          {
            prompt: objectiveMiniSynthPrompt,
            max_tokens: objectiveMiniSynthBudget,
            temperature: args.request.temperature,
            seed: args.request.seed,
            stop: args.request.stop,
            model: objectiveMiniSynthModel,
          },
          {
            personaId: args.personaId,
            sessionId: args.request.sessionId ?? undefined,
            traceId: args.traceId,
          },
          {
            fallbackMaxTokens: objectiveMiniSynthBudget,
            allowContextDrop: true,
            label: "objective_mini_synth",
            dialogueProfile: args.dialogueProfile,
            dialogueQuestion: args.baseQuestion,
          },
        );
        args.appendLlmCallDebug(objectiveMiniSynthAttempt.llm);
        const objectiveMiniSynthHints = objectiveMiniAnswers.map((entry) => {
          const objectiveState = objectiveLoopState.find(
            (state) => state.objective_id === entry.objective_id,
          );
          return {
            objective_id: entry.objective_id,
            objective_label: entry.objective_label,
            required_slots: objectiveState?.required_slots ?? [],
          };
        });
        const objectiveMiniSynthRaw = args.stripPromptEchoFromAnswer(
          String(objectiveMiniSynthAttempt.result?.text ?? ""),
          args.baseQuestion,
        );
        let miniSynth = parseHelixAskObjectiveMiniSynth(objectiveMiniSynthRaw, {
          objectiveHints: objectiveMiniSynthHints,
        });
        if (!miniSynth?.objectives.length) {
          objectiveMiniSynthRepairAttempted = true;
          const objectiveMiniSynthRepairBudget = clampNumber(
            Math.floor(objectiveMiniSynthBudget * 0.6),
            120,
            420,
          );
          const objectiveMiniSynthRepairPrompt = [
            "You are Helix Ask strict JSON repair formatter for objective mini-synth.",
            "Task: convert candidate output into strict JSON that satisfies the schema.",
            "Return strict JSON only. No markdown. No commentary.",
            "Schema:",
            '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","matched_slots":["slot-id"],"missing_slots":["slot-id"],"summary":"string","evidence_refs":["path"],"unknown_block":{"unknown":"string","why":"string","what_i_checked":["string"],"next_retrieval":"string"}}] }',
            "Rules:",
            "- Preserve objective_id values from allowed_objective_ids only.",
            "- Status must be covered|partial|blocked.",
            "- If status=covered then missing_slots must be empty.",
            "- Use concise summary and keep evidence refs as file paths.",
            `responseLanguage=${args.responseLanguage ?? "auto"}`,
            `allowed_objective_ids=${objectiveMiniSynthHints.map((entry) => entry.objective_id).join(", ") || "none"}`,
            "",
            "objective_checkpoints:",
            ...objectiveMiniAnswers.slice(0, 8).map(
              (entry) =>
                `${entry.objective_id} | status=${entry.status} | matched=${entry.matched_slots.join(",") || "none"} | missing=${entry.missing_slots.join(",") || "none"}`,
            ),
            "",
            "candidate_output:",
            args.clipText(objectiveMiniSynthRaw, 6000),
          ].join("\n");
          try {
            const objectiveMiniSynthRepairAttempt = await args.runLocalWithOverflowRetry(
              {
                prompt: objectiveMiniSynthRepairPrompt,
                max_tokens: objectiveMiniSynthRepairBudget,
                temperature: args.request.temperature,
                seed: args.request.seed,
                stop: args.request.stop,
                model: objectiveMiniSynthModel,
              },
              {
                personaId: args.personaId,
                sessionId: args.request.sessionId ?? undefined,
                traceId: args.traceId,
              },
              {
                fallbackMaxTokens: objectiveMiniSynthRepairBudget,
                allowContextDrop: true,
                label: "objective_mini_synth_repair",
                dialogueProfile: args.dialogueProfile,
                dialogueQuestion: args.baseQuestion,
              },
            );
            args.appendLlmCallDebug(objectiveMiniSynthRepairAttempt.llm);
            const objectiveMiniSynthRepairRaw = args.stripPromptEchoFromAnswer(
              String(objectiveMiniSynthRepairAttempt.result?.text ?? ""),
              args.baseQuestion,
            );
            const repairedMiniSynth = parseHelixAskObjectiveMiniSynth(
              objectiveMiniSynthRepairRaw,
              {
                objectiveHints: objectiveMiniSynthHints,
              },
            );
            if (repairedMiniSynth?.objectives.length) {
              miniSynth = repairedMiniSynth;
              objectiveMiniSynthRepairSuccess = true;
              objectiveMiniSynthRepairFailReason = null;
              args.pushAnswerPath("objectiveMiniSynth:llm_schema_repair");
            } else {
              objectiveMiniSynthRepairFailReason =
                "objective_mini_synth_schema_repair_parse_failed";
            }
          } catch (error) {
            objectiveMiniSynthRepairFailReason =
              error instanceof Error ? error.message : String(error);
          }
        }
        if (miniSynth?.objectives.length) {
          objectiveMiniAnswers = applyHelixAskObjectiveMiniSynth({
            miniAnswers: objectiveMiniAnswers,
            synth: miniSynth,
            objectiveStates: objectiveLoopState,
          });
          objectiveMiniSynthMode = "llm";
          args.pushAnswerPath("objectiveMiniSynth:llm");
        } else {
          objectiveMiniSynthMode = "heuristic_fallback";
          objectiveMiniSynthFailReason = objectiveMiniSynthRepairAttempted
            ? objectiveMiniSynthRepairFailReason ??
              "objective_mini_synth_parse_failed_after_repair"
            : "objective_mini_synth_parse_failed";
          args.pushAnswerPath("objectiveMiniSynth:fallback");
        }
      } catch (error) {
        objectiveMiniSynthMode = "heuristic_fallback";
        objectiveMiniSynthFailReason =
          error instanceof Error ? error.message : String(error);
        args.pushAnswerPath("objectiveMiniSynth:fallback");
      }
    } else {
      objectiveMiniSynthMode = "heuristic_fallback";
      objectiveMiniSynthFailReason = "objective_mini_synth_llm_skipped";
      args.pushAnswerPath("objectiveMiniSynth:fallback");
    }
  }

  for (const miniAnswer of objectiveMiniAnswers) {
    const objectiveState = objectiveLoopState.find(
      (entry) => entry.objective_id === miniAnswer.objective_id,
    );
    const coverageRatio = objectiveCoverageRatio(objectiveState);
    const miniSynthLlmModel =
      objectiveMiniSynthMode === "llm"
        ? (objectiveMiniSynthModel ?? process.env.LLM_HTTP_MODEL?.trim() ?? "gpt-4o-mini")
        : null;
    args.pushObjectiveStepTranscript({
      objective_id: miniAnswer.objective_id,
      attempt: objectiveState?.attempt ?? 1,
      verb: "MINI_SYNTH",
      phase: "objective_loop",
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      llm_model: miniSynthLlmModel,
      reasoning_effort: objectiveMiniSynthMode === "llm" ? "medium" : null,
      schema_name: "helix.ask.mini_synth.v2",
      schema_valid: objectiveMiniSynthMode === "llm",
      prompt_preview: args.clipText(
        objectiveMiniSynthPromptPreview ||
          `${miniAnswer.objective_label} | refs=${miniAnswer.evidence_refs.slice(0, 4).join(", ") || "none"}`,
        280,
      ),
      output_preview: args.clipText(miniAnswer.summary, 280),
      decision:
        objectiveMiniSynthMode === "llm"
          ? `mini_synth_llm_${miniAnswer.status}`
          : `mini_synth_${miniAnswer.status}`,
      decision_reason:
        miniAnswer.missing_slots.length > 0
          ? `missing_slots:${miniAnswer.missing_slots.join(",")}`
          : objectiveMiniSynthFailReason,
      evidence_delta: {
        before_ref_count: 0,
        after_ref_count: miniAnswer.evidence_refs.length,
        before_coverage_ratio: coverageRatio,
        after_coverage_ratio: coverageRatio,
      },
      validator: {
        preconditions_ok: miniAnswer.evidence_refs.length > 0,
        postconditions_ok:
          (miniAnswer.status === "covered" || miniAnswer.missing_slots.length > 0) &&
          (objectiveMiniSynthMode === "llm" ? objectiveMiniSynthFailReason === null : true),
        violations:
          miniAnswer.status !== "covered" && miniAnswer.missing_slots.length === 0
            ? ["missing_slots_required_for_unresolved"]
            : objectiveMiniSynthFailReason
              ? [objectiveMiniSynthFailReason]
              : [],
      },
    });
  }

  if (objectiveMiniAnswers.length > 0) {
    if (canUseObjectiveMiniCritic) {
      try {
        objectiveMiniCriticLlmInvoked = true;
        const objectiveMiniCritiquePromptBase = args.applyDialogueProfilePrompt(
          buildHelixAskObjectiveMiniCritiquePrompt({
            question: args.baseQuestion,
            miniAnswers: objectiveMiniAnswers,
            responseLanguage: args.responseLanguage,
          }),
          args.dialogueProfile,
          args.baseQuestion,
        );
        const objectiveMiniCritiquePromptRewrite = rewriteHelixAskObjectivePromptV1({
          stage: "mini_critic",
          basePrompt: objectiveMiniCritiquePromptBase,
          mode: args.objectivePromptRewriteMode,
          responseLanguage: args.responseLanguage,
        });
        args.recordPromptRewriteStage(
          "mini_critic",
          objectiveMiniCritiquePromptRewrite,
          objectiveMiniCriticBudget,
        );
        const objectiveMiniCritiquePrompt =
          objectiveMiniCritiquePromptRewrite.effectivePrompt;
        objectiveMiniCriticPromptPreview = args.clipText(objectiveMiniCritiquePrompt, 1200);
        const objectiveMiniCriticStartedAt = new Date().toISOString();
        const objectiveMiniCritiqueAttempt = await args.runLocalWithOverflowRetry(
          {
            prompt: objectiveMiniCritiquePrompt,
            max_tokens: objectiveMiniCriticBudget,
            temperature: args.request.temperature,
            seed: args.request.seed,
            stop: args.request.stop,
            model: objectiveMiniCriticModel,
          },
          {
            personaId: args.personaId,
            sessionId: args.request.sessionId ?? undefined,
            traceId: args.traceId,
          },
          {
            fallbackMaxTokens: objectiveMiniCriticBudget,
            allowContextDrop: true,
            label: "objective_mini_critic",
            dialogueProfile: args.dialogueProfile,
            dialogueQuestion: args.baseQuestion,
          },
        );
        args.appendLlmCallDebug(objectiveMiniCritiqueAttempt.llm);
        const objectiveMiniCritiqueRaw = args.stripPromptEchoFromAnswer(
          String(objectiveMiniCritiqueAttempt.result?.text ?? ""),
          args.baseQuestion,
        );
        let miniCritique = parseHelixAskObjectiveMiniCritique(objectiveMiniCritiqueRaw);
        if (!miniCritique?.objectives.length) {
          objectiveMiniCriticRepairAttempted = true;
          const objectiveMiniCriticRepairBudget = clampNumber(
            Math.floor(objectiveMiniCriticBudget * 0.6),
            120,
            380,
          );
          const objectiveMiniCriticRepairPrompt = [
            "You are Helix Ask strict JSON repair formatter for objective mini-critic.",
            "Task: convert candidate output into strict JSON that satisfies the schema.",
            "Return strict JSON only. No markdown. No commentary.",
            "Schema:",
            '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","missing_slots":["slot-id"],"reason":"string"}] }',
            "Rules:",
            "- Preserve objective_id values from allowed_objective_ids only.",
            "- Status must be covered|partial|blocked.",
            "- If status=covered then missing_slots must be empty.",
            "- Keep reason concise and slot-specific.",
            `responseLanguage=${args.responseLanguage ?? "auto"}`,
            `allowed_objective_ids=${objectiveMiniAnswers.map((entry) => entry.objective_id).join(", ") || "none"}`,
            "",
            "objective_checkpoints:",
            ...objectiveMiniAnswers.slice(0, 8).map(
              (entry) =>
                `${entry.objective_id} | status=${entry.status} | matched=${entry.matched_slots.join(",") || "none"} | missing=${entry.missing_slots.join(",") || "none"}`,
            ),
            "",
            "candidate_output:",
            args.clipText(objectiveMiniCritiqueRaw, 6000),
          ].join("\n");
          try {
            const objectiveMiniCriticRepairAttempt = await args.runLocalWithOverflowRetry(
              {
                prompt: objectiveMiniCriticRepairPrompt,
                max_tokens: objectiveMiniCriticRepairBudget,
                temperature: args.request.temperature,
                seed: args.request.seed,
                stop: args.request.stop,
                model: objectiveMiniCriticModel,
              },
              {
                personaId: args.personaId,
                sessionId: args.request.sessionId ?? undefined,
                traceId: args.traceId,
              },
              {
                fallbackMaxTokens: objectiveMiniCriticRepairBudget,
                allowContextDrop: true,
                label: "objective_mini_critic_repair",
                dialogueProfile: args.dialogueProfile,
                dialogueQuestion: args.baseQuestion,
              },
            );
            args.appendLlmCallDebug(objectiveMiniCriticRepairAttempt.llm);
            const objectiveMiniCriticRepairRaw = args.stripPromptEchoFromAnswer(
              String(objectiveMiniCriticRepairAttempt.result?.text ?? ""),
              args.baseQuestion,
            );
            const repairedMiniCritique = parseHelixAskObjectiveMiniCritique(
              objectiveMiniCriticRepairRaw,
            );
            if (repairedMiniCritique?.objectives.length) {
              miniCritique = repairedMiniCritique;
              objectiveMiniCriticRepairSuccess = true;
              objectiveMiniCriticRepairFailReason = null;
              args.pushAnswerPath("objectiveMiniCritic:llm_schema_repair");
            } else {
              objectiveMiniCriticRepairFailReason =
                "objective_mini_critic_schema_repair_parse_failed";
            }
          } catch (error) {
            objectiveMiniCriticRepairFailReason =
              error instanceof Error ? error.message : String(error);
          }
        }
        if (miniCritique?.objectives.length) {
          objectiveMiniAnswers = applyHelixAskObjectiveMiniCritique({
            miniAnswers: objectiveMiniAnswers,
            critique: miniCritique,
            objectiveStates: objectiveLoopState,
          });
          objectiveMiniCriticMode = "llm";
          args.pushAnswerPath("objectiveMiniCritic:llm");
          for (const critiqueObjective of miniCritique.objectives) {
            const objectiveState = objectiveLoopState.find(
              (state) => state.objective_id === critiqueObjective.objective_id,
            );
            args.pushObjectiveStepTranscript({
              objective_id: critiqueObjective.objective_id,
              attempt: objectiveState?.attempt ?? 1,
              verb: "MINI_CRITIC",
              phase: "objective_loop",
              started_at: objectiveMiniCriticStartedAt,
              ended_at: new Date().toISOString(),
              llm_model:
                objectiveMiniCriticModel ?? process.env.LLM_HTTP_MODEL?.trim() ?? "gpt-4o-mini",
              reasoning_effort: "medium_high",
              schema_name: "helix.ask.mini_critic.v2",
              schema_valid: true,
              prompt_preview: args.clipText(objectiveMiniCritiquePrompt, 280),
              output_preview: args.clipText(
                `status=${critiqueObjective.status}; missing=${critiqueObjective.missing_slots.join(",") || "none"}`,
                220,
              ),
              decision: critiqueObjective.status === "covered" ? "critic_pass" : "critic_fail",
              decision_reason: critiqueObjective.reason ?? null,
              evidence_delta: {
                before_coverage_ratio: objectiveCoverageRatio(objectiveState),
                after_coverage_ratio: objectiveCoverageRatio(objectiveState),
              },
              validator: {
                preconditions_ok: true,
                postconditions_ok:
                  critiqueObjective.status === "covered" ||
                  critiqueObjective.missing_slots.length > 0,
                violations:
                  critiqueObjective.status !== "covered" &&
                  critiqueObjective.missing_slots.length === 0
                    ? ["critic_missing_slots_empty"]
                    : [],
              },
            });
          }
        } else {
          objectiveMiniCriticMode = "heuristic_fallback";
          objectiveMiniCriticFailReason = objectiveMiniCriticRepairAttempted
            ? objectiveMiniCriticRepairFailReason ??
              "objective_mini_critic_parse_failed_after_repair"
            : "objective_mini_critic_parse_failed";
          args.pushAnswerPath("objectiveMiniCritic:fallback");
        }
      } catch (error) {
        objectiveMiniCriticMode = "heuristic_fallback";
        objectiveMiniCriticFailReason =
          error instanceof Error ? error.message : String(error);
        args.pushAnswerPath("objectiveMiniCritic:fallback");
      }
    } else {
      objectiveMiniCriticMode = "heuristic_fallback";
      objectiveMiniCriticFailReason = "objective_mini_critic_llm_skipped";
      args.pushAnswerPath("objectiveMiniCritic:fallback");
    }
  }

  for (const miniAnswer of objectiveMiniAnswers) {
    if (objectiveMiniCriticMode === "llm") continue;
    args.pushObjectiveStepTranscript({
      objective_id: miniAnswer.objective_id,
      attempt: 1,
      verb: "MINI_CRITIC",
      phase: "objective_loop",
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      llm_model:
        objectiveMiniCriticMode === "heuristic_fallback"
          ? objectiveMiniCriticModel ?? process.env.LLM_HTTP_MODEL?.trim() ?? "gpt-4o-mini"
          : null,
      reasoning_effort: objectiveMiniCriticMode === "heuristic_fallback" ? "medium_high" : null,
      schema_name: "helix.ask.mini_critic.v2",
      schema_valid: false,
      prompt_preview:
        objectiveMiniCriticMode === "heuristic_fallback"
          ? args.clipText(objectiveMiniCriticPromptPreview ?? "", 280)
          : null,
      output_preview:
        objectiveMiniCriticMode === "heuristic_fallback"
          ? args.clipText(objectiveMiniCriticFailReason ?? "error", 180)
          : "llm_skipped",
      decision:
        objectiveMiniCriticMode === "heuristic_fallback" ? "critic_fallback" : "critic_skipped",
      decision_reason:
        objectiveMiniCriticMode === "heuristic_fallback"
          ? objectiveMiniCriticFailReason
          : "objective_mini_critic_llm_skipped",
      validator: {
        preconditions_ok: true,
        postconditions_ok: false,
        violations: [
          objectiveMiniCriticMode === "heuristic_fallback"
            ? objectiveMiniCriticFailReason ?? "critic_error"
            : "llm_skipped",
        ],
      },
    });
  }

  const objectiveScopedRetrievalEnforcement =
    enforceHelixAskObjectiveScopedRetrievalRequirementForMiniAnswers({
      miniAnswers: objectiveMiniAnswers,
      states: objectiveLoopState,
      retrievalQueries: args.objectiveRetrievalQueriesLog,
      maxObjectives: args.objectiveScopedRetrievalMaxObjectives,
    });
  objectiveMiniAnswers = objectiveScopedRetrievalEnforcement.miniAnswers;
  objectiveMissingScopedRetrievalIds = objectiveScopedRetrievalEnforcement.missingObjectiveIds;
  objectiveMissingScopedRetrievalAny = objectiveMissingScopedRetrievalIds.length > 0;
  objectiveMissingScopedRetrievalCount = objectiveMissingScopedRetrievalIds.length;

  const objectiveOesEnforcement = enforceHelixAskObjectiveEvidenceSufficiency({
    miniAnswers: objectiveMiniAnswers,
    states: objectiveLoopState,
    coveredThreshold: HELIX_ASK_OBJECTIVE_OES_COVERED_THRESHOLD,
    blockedThreshold: HELIX_ASK_OBJECTIVE_OES_BLOCKED_THRESHOLD,
  });
  objectiveMiniAnswers = objectiveOesEnforcement.miniAnswers;
  objectiveOesScores = objectiveOesEnforcement.scores;
  objectiveTerminalizationReasons = objectiveOesEnforcement.terminalizationReasons;

  const objectiveUnknownBlockEnforcement = enforceHelixAskObjectiveUnknownBlocks({
    miniAnswers: objectiveMiniAnswers,
    maxObjectives: args.objectiveScopedRetrievalMaxObjectives,
  });
  objectiveMiniAnswers = objectiveUnknownBlockEnforcement.miniAnswers;
  objectiveUnresolvedWithoutUnknownBlockIds = objectiveUnknownBlockEnforcement.missingObjectiveIds;
  objectiveUnknownBlockObjectiveIds = objectiveMiniAnswers
    .filter((entry) => entry.status !== "covered")
    .filter((entry) => hasHelixAskObjectiveUnknownBlock(entry.unknown_block))
    .map((entry) => entry.objective_id)
    .slice(0, args.objectiveScopedRetrievalMaxObjectives);

  const objectiveMiniValidation = summarizeObjectiveMiniValidation(objectiveMiniAnswers);
  for (const miniAnswer of objectiveMiniAnswers) {
    if (miniAnswer.status === "covered" || !hasHelixAskObjectiveUnknownBlock(miniAnswer.unknown_block)) {
      continue;
    }
    args.pushObjectiveStepTranscript({
      objective_id: miniAnswer.objective_id,
      attempt: 1,
      verb: "UNKNOWN_TERMINAL",
      phase: "objective_loop",
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      llm_model: null,
      reasoning_effort: null,
      schema_name: "helix.ask.unknown_terminal.v2",
      schema_valid: true,
      prompt_preview: null,
      output_preview: args.clipText(
        `${miniAnswer.unknown_block?.why ?? "unknown"} | next=${miniAnswer.unknown_block?.next_retrieval ?? "n/a"}`,
        280,
      ),
      decision: "unknown_terminalized",
      decision_reason:
        miniAnswer.missing_slots.length > 0
          ? `missing_slots:${miniAnswer.missing_slots.join(",")}`
          : "objective_blocked",
      validator: {
        preconditions_ok: true,
        postconditions_ok: true,
        violations: [],
      },
    });
  }

  if (objectiveMiniValidation.unresolved > 0) {
    validationPassed = false;
    validationFailReason = objectiveMissingScopedRetrievalAny
      ? "objective_retrieval_missing_for_unresolved"
      : objectiveUnresolvedWithoutUnknownBlockIds.length > 0
        ? "objective_unknown_block_missing_for_unresolved"
        : "objective_mini_validation_unresolved";
    args.pushAnswerPath(`objectiveMiniValidation:unresolved:${objectiveMiniValidation.unresolved}`);
  } else {
    args.pushAnswerPath("objectiveMiniValidation:pass");
  }

  objectiveGateConsistencyBlocked =
    objectiveMiniValidation.unresolved > 0 ||
    objectiveMissingScopedRetrievalAny ||
    objectiveUnresolvedWithoutUnknownBlockIds.length > 0;
  args.pushAnswerPath(objectiveGateConsistencyBlocked ? "objectiveGateConsistency:blocked" : "objectiveGateConsistency:ok");
  if (objectiveMissingScopedRetrievalAny) {
    args.pushAnswerPath(`objectiveRetrievalMissing:${objectiveMissingScopedRetrievalIds.length}`);
  }

  if (args.debugPayload) {
    args.debugPayload.objective_gate_consistency_blocked = objectiveGateConsistencyBlocked;
    args.debugPayload.objective_gate_consistency_reasons = objectiveGateConsistencyBlocked
      ? [
          objectiveMiniValidation.unresolved > 0 ? "objective_coverage_unresolved" : null,
          objectiveMissingScopedRetrievalAny ? "missing_scoped_retrieval" : null,
          objectiveUnresolvedWithoutUnknownBlockIds.length > 0 ? "missing_unknown_block" : null,
        ].filter((entry): entry is string => Boolean(entry))
      : [];
    args.debugPayload.objective_missing_scoped_retrieval_ids =
      objectiveMissingScopedRetrievalIds.slice();
    args.debugPayload.objective_missing_scoped_retrieval_count =
      objectiveMissingScopedRetrievalIds.length;
    args.debugPayload.objective_missing_scoped_retrieval_enforced =
      objectiveMissingScopedRetrievalAny;
    args.debugPayload.objective_unknown_block_count =
      objectiveUnknownBlockObjectiveIds.length;
    args.debugPayload.objective_unknown_block_objective_ids =
      objectiveUnknownBlockObjectiveIds.slice();
    args.debugPayload.objective_unresolved_without_unknown_block_ids =
      objectiveUnresolvedWithoutUnknownBlockIds.slice();
    args.debugPayload.objective_unresolved_without_unknown_block_count =
      objectiveUnresolvedWithoutUnknownBlockIds.length;
  }

  if (objectiveMiniAnswers.length > 0) {
    const miniById = new Map(
      objectiveMiniAnswers.map((entry) => [entry.objective_id, entry] as const),
    );
    objectiveLoopState = objectiveLoopState.map((state) => {
      if (isHelixAskObjectiveTerminalStatus(state.status)) return state;
      const mini = miniById.get(state.objective_id);
      if (!mini) return state;
      const nextState: HelixAskObjectiveLoopState = {
        ...state,
        matched_slots: Array.from(new Set([...state.matched_slots, ...mini.matched_slots])),
      };
      if (mini.status === "covered") {
        return args.recordObjectiveTransition(
          nextState,
          "complete",
          "objective_mini_validation_covered",
        );
      }
      return args.recordObjectiveTransition(
        nextState,
        "blocked",
        mini.status === "blocked"
          ? "objective_mini_validation_blocked"
          : "objective_mini_validation_unresolved",
      );
    });
  }

  return {
    objectiveLoopState,
    objectiveMiniAnswers,
    objectiveMiniValidation,
    objectiveMiniSynthMode,
    objectiveMiniSynthFailReason,
    objectiveMiniSynthLlmAttempted,
    objectiveMiniSynthLlmInvoked,
    objectiveMiniSynthPromptPreview,
    objectiveMiniSynthRepairAttempted,
    objectiveMiniSynthRepairSuccess,
    objectiveMiniSynthRepairFailReason,
    objectiveMiniCriticMode,
    objectiveMiniCriticFailReason,
    objectiveMiniCriticLlmAttempted,
    objectiveMiniCriticLlmInvoked,
    objectiveMiniCriticPromptPreview,
    objectiveMiniCriticRepairAttempted,
    objectiveMiniCriticRepairSuccess,
    objectiveMiniCriticRepairFailReason,
    objectiveMissingScopedRetrievalIds,
    objectiveMissingScopedRetrievalAny,
    objectiveMissingScopedRetrievalCount,
    objectiveUnknownBlockObjectiveIds,
    objectiveUnresolvedWithoutUnknownBlockIds,
    objectiveOesScores,
    objectiveTerminalizationReasons,
    objectiveGateConsistencyBlocked,
    validationPassed,
    validationFailReason,
  };
};
