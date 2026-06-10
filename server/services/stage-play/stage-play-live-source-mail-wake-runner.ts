import crypto from "node:crypto";
import type {
  StagePlayLiveSourceMailDecisionV1,
  StagePlayLiveSourceImmersionStateV1,
  StagePlayLiveSourceMailItemV1,
  StagePlayLiveSourceNarrativeStateV1,
  StagePlayLiveSourcePredictionValidationV1,
  StagePlayProcessedMailPacketV1,
  StagePlayMicroReasonerRunV1,
  StagePlayLiveSourceVoiceDeliveryReceiptV1,
  StagePlayLiveSourceVoicePolicyV1,
  StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceInterpreterProfileCriterionLedgerV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import type { StagePlayHeldCalloutV1 } from "@shared/contracts/stage-play-held-callout.v1";
import type {
  StagePlayLiveSourceConversationContextPackV1,
} from "@shared/contracts/stage-play-live-source-conversation.v1";
import type {
  StagePlayLiveSourceTaskQueueSnapshotV1,
  StagePlayLiveSourceTaskV1,
} from "@shared/contracts/stage-play-live-source-task.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import {
  getStagePlayLiveSourceMailItem,
  getLatestStagePlayLiveSourceImmersionState,
  getStagePlayLiveSourceWatchJobPolicy,
  getStagePlayMailDecision,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceJobStates,
  listStagePlayLiveSourceWatchJobPolicies,
  listUnreadStagePlayLiveSourceMailItems,
  recordStagePlayLiveSourceImmersionState,
} from "./stage-play-live-source-mailbox-store";
import {
  getLatestStagePlayLiveSourceNarrativeState,
  getStagePlayLiveSourceNarrativeState,
} from "./stage-play-live-source-narrative-store";
import { getStagePlayLiveSourceTaskQueueSnapshot } from "./stage-play-live-source-task-queue";
import { buildStagePlayLiveSourceConversationContextPack } from "./stage-play-live-source-conversation-store";
import { listStagePlayHeldCallouts } from "./stage-play-held-callout-store";
import { maybeQueueStagePlayLiveSourceMemoryConsolidation } from "./stage-play-live-source-memory-consolidation";
import { recordStagePlayLiveSourceMailTranscriptEntries } from "./stage-play-live-source-mail-transcript-store";
import {
  getActiveInterpreterProfileForJob,
  getStagePlayLiveSourceInterpreterProfile,
  listStagePlayLiveSourceInterpreterProfileCriterionLedger,
  listStagePlayLiveSourceInterpreterProfileComparisons,
} from "./stage-play-live-source-interpreter-profile-store";
import {
  maybeRunStagePlayLiveSourceVoiceDelivery,
  type StagePlayLiveSourceVoiceDeliveryRunner,
} from "./stage-play-live-source-mail-voice-bridge";
import {
  MAX_MAIL_IDS_PER_WAKE_BATCH,
  listRunnableStagePlayLiveSourceMailWakeRequests,
  listStagePlayLiveSourceMailWakeRequests,
  markStagePlayMailWakeCompleted,
  markStagePlayMailWakeRetryable,
  markStagePlayMailWakeRunning,
  markStagePlayMailWakeTerminalFailed,
  queueStagePlayLiveSourceMailWakeRequest,
  recordStagePlayMailWakeResult,
  latestStagePlayLiveSourceMailWakeResult,
  splitStagePlayLiveSourceMailWakeRequestForAsk,
  attachLiveSourceBudgetStateToWakeResult,
} from "./stage-play-live-source-mail-wake-store";
import type {
  LiveSourceBudgetActionV1,
  LiveSourceBudgetStateV1,
} from "@shared/contracts/stage-play-live-source-current-state.v1";
import { recordLiveSourceBudgetState } from "./stage-play-live-source-budget-store";
import { extractStagePlayLiveSourceDelta } from "./stage-play-live-source-delta-extractor";
import { validateStagePlayLiveSourcePredictionFromMail } from "./stage-play-live-source-prediction-validator";
import { buildStagePlayProcessedMailPacket } from "./stage-play-processed-mail-packet";
import { recordLiveSourceMailDecisionForAsk } from "./stage-play-visual-summary-mail-ingest";

type AskWakeTurnResponse = Record<string, unknown>;

export type AskWakeTurnRunner = (input: {
  prompt: string;
  threadId: string;
  evidenceRefs: string[];
  wakeRequest: StagePlayLiveSourceMailWakeRequestV1;
}) => Promise<AskWakeTurnResponse>;

export type StagePlayMailWakePressureCheckResult = {
  deferred: boolean;
  reason?: string | null;
  release?: (outcome?: "completed" | "failed" | "rejected" | "aborted") => void;
};

export type StagePlayMailWakePressureCheck = (input: {
  wakeRequest: StagePlayLiveSourceMailWakeRequestV1;
  now: string;
}) => StagePlayMailWakePressureCheckResult;

type DurableWakeTranscriptRow = import("@shared/contracts/stage-play-live-source-mail.v1").AskTurnTranscriptRowDraftV1;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const wordsFromText = (value: string): string[] =>
  Array.from(new Set(value.toLowerCase().match(/\b[a-z0-9][a-z0-9-]{2,}\b/g) ?? []))
    .filter((word) => !new Set([
      "the", "and", "for", "with", "that", "this", "from", "into", "visual", "source",
      "summary", "mail", "latest", "shows", "showing", "appears", "near", "should",
      "next", "only", "when", "thing", "things", "record", "decision", "policy",
    ]).has(word));

const mailBatchLabel = (items: StagePlayLiveSourceMailItemV1[]): string =>
  items.length > 0 && items.every((item) => item.sourceKind === "visual_frame")
    ? "visual-summary"
    : "live-source";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const STALE_RUNNING_WAKE_MS = 90_000;
const PRIOR_DECISION_LIMIT = 6;

const readPositiveIntEnv = (name: string, fallback: number): number => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

let rememberedAskBaseUrl: string | null = null;

const normalizeAskBaseUrl = (value: string | null | undefined): string | null => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed.replace(/\/+$/, "") : null;
};

export function rememberStagePlayMailWakeAskBaseUrl(value: string | null | undefined): void {
  const normalized = normalizeAskBaseUrl(value);
  if (normalized) rememberedAskBaseUrl = normalized;
}

const defaultAskBaseUrl = (): string =>
  rememberedAskBaseUrl ??
  normalizeAskBaseUrl(process.env.HELIX_ASK_WAKE_BASE_URL) ??
  normalizeAskBaseUrl(process.env.HELIX_ASK_BASE_URL) ??
  normalizeAskBaseUrl(process.env.API_PROXY_TARGET) ??
  normalizeAskBaseUrl(process.env.CASIMIR_PUBLIC_BASE_URL) ??
  `http://127.0.0.1:${process.env.PORT || process.env.SERVER_PORT || "5050"}`;

const wakeAskTurnTimeoutMs = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_ASK_TIMEOUT_MS", 120_000);

const wakeAskBatchLimit = (): number =>
  readPositiveIntEnv(
    "STAGE_PLAY_MAIL_WAKE_MAX_BATCH",
    readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_ASK_BATCH_LIMIT", 4),
  );

const latestSceneWakeBatchLimit = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_LATEST_SCENE_BATCH_LIMIT", 1);

const predictionWakeMicroBatchLimit = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_PREDICTION_MICRO_BATCH_LIMIT", wakeAskBatchLimit());

const voiceSalienceWakeBatchLimit = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_VOICE_SALIENCE_BATCH_LIMIT", wakeAskBatchLimit());

const policyAwareWakeAskBatchLimit = (
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): number => {
  if (!policy) return wakeAskBatchLimit();
  const interpretationMode = policy.interpretationMode ?? "latest_scene_answer";
  const mailProcessingMode = policy.mailProcessingMode ?? "latest_only";
  const outputCadence = policy.outputCadence ?? "every_batch";

  if (interpretationMode === "latest_scene_answer" || mailProcessingMode === "latest_only") {
    return latestSceneWakeBatchLimit();
  }
  if (
    interpretationMode === "voice_commentary_watch" ||
    interpretationMode === "voice_callout_watch" ||
    mailProcessingMode === "salience_window" ||
    outputCadence === "voice_only_salient"
  ) {
    return voiceSalienceWakeBatchLimit();
  }
  if (
    interpretationMode === "prediction_watch" ||
    interpretationMode === "batch_interpretation" ||
    mailProcessingMode === "micro_batch" ||
    mailProcessingMode === "chronological_batch"
  ) {
    return predictionWakeMicroBatchLimit();
  }
  return wakeAskBatchLimit();
};

const wakeAskPromptMaxChars = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_PROMPT_MAX_CHARS", 18_000);

const wakeMailSummaryPreviewChars = (): number =>
  readPositiveIntEnv("STAGE_PLAY_MAIL_WAKE_SUMMARY_CHARS", 360);

const manualPressureOverrideEnabled = (): boolean =>
  String(process.env.STAGE_PLAY_MAIL_WAKE_MANUAL_PRESSURE_OVERRIDE ?? "1").trim() !== "0";

const isManualPressureOverrideReason = (reason: string | null | undefined): boolean =>
  manualPressureOverrideEnabled() && /(?:^|:)(?:runtime_memory_queue_deferrable|queue_deferrable)$/i.test(String(reason ?? ""));

const clipPromptText = (value: string | null | undefined, max = 420): string => {
  const trimmed = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, Math.max(0, max - 1)).trim()}...`;
};

const formatCriteria = (values: string[]): string =>
  values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : "- none recorded";

const formatBooleanRule = (label: string, value: boolean): string =>
  `- ${label}: ${value}`;

const formatActiveInterpreterProfile = (
  profile: StagePlayLiveSourceInterpreterProfileV1 | null,
): string => {
  if (!profile) return "No active interpreter profile. Use watch policy only.";
  return [
    `Profile ref: ${profile.profileId}`,
    `Title: ${profile.title}`,
    `Domain: ${profile.domain}`,
    `Objective: ${profile.objectiveText}`,
    "Guidelines:",
    profile.interpretationGuidelines,
    "Salience criteria:",
    formatCriteria(profile.salienceCriteria),
    "Suppress criteria:",
    formatCriteria(profile.suppressCriteria),
    "Risk criteria:",
    formatCriteria(profile.riskCriteria),
    "Opportunity criteria:",
    formatCriteria(profile.opportunityCriteria),
    "Voice callout criteria:",
    formatCriteria(profile.voiceCalloutCriteria),
    "Evidence rules:",
    formatBooleanRule("preserve raw observation", profile.evidenceRules.preserveRawObservation),
    formatBooleanRule("distinguish observed vs inferred", profile.evidenceRules.distinguishObservedVsInferred),
    formatBooleanRule("require evidence refs", profile.evidenceRules.requireEvidenceRefs),
    formatBooleanRule("ask when uncertain", profile.evidenceRules.askWhenUncertain),
  ].join("\n");
};

const formatActiveCriterionLedger = (
  ledgers: StagePlayLiveSourceInterpreterProfileCriterionLedgerV1[],
): string => {
  if (ledgers.length === 0) return "No active criterion ledger entries yet.";
  return ledgers
    .slice(-12)
    .map((ledger) => [
      `- ${ledger.criterionText}`,
      `kind=${ledger.criterionKind}`,
      `status=${ledger.status}`,
      ledger.previousStatus ? `previous=${ledger.previousStatus}` : null,
      `confidence=${ledger.currentConfidence.toFixed(2)}`,
      ledger.lastMatchedMailId ? `lastMail=${ledger.lastMatchedMailId}` : null,
      ledger.lastComparisonId ? `comparison=${ledger.lastComparisonId}` : null,
    ].filter(Boolean).join("; "))
    .join("\n");
};

const formatVoicePolicy = (policy: StagePlayLiveSourceVoicePolicyV1): string =>
  [
    `voiceEnabled: ${policy.voiceEnabled}`,
    `requiresConfirmation: ${policy.requiresConfirmation}`,
    `allowedNow: ${policy.allowedNow}`,
    `reason: ${policy.reason ?? "none"}`,
  ].join("\n");

const voicePolicyFromWatchPolicy = (
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): StagePlayLiveSourceVoicePolicyV1 => {
  const voiceEnabled = policy?.outputPolicy.allowVoiceCallout === true;
  const requiresConfirmation = policy?.outputPolicy.confirmationRequired === true;
  const allowedNow = voiceEnabled && !requiresConfirmation;
  return {
    voiceEnabled,
    requiresConfirmation,
    allowedNow,
    reason: !voiceEnabled
      ? "watch_policy_disallows_voice"
      : requiresConfirmation
        ? "watch_policy_requires_confirmation"
        : policy?.outputPolicy.voiceRequiresUrgency
          ? "watch_policy_allows_urgent_voice_callout"
          : "watch_policy_allows_voice_callout",
  };
};

const resolveActiveWatchPolicy = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  mailBatch: StagePlayLiveSourceMailItemV1[];
}): StagePlayLiveSourceWatchJobPolicyV1 | null => {
  if (input.wake.jobId) {
    const direct = listStagePlayLiveSourceWatchJobPolicies({
      threadId: input.wake.threadId,
      roomId: input.wake.roomId ?? null,
      environmentId: input.wake.environmentId ?? null,
      jobId: input.wake.jobId,
      status: "armed",
      limit: 1,
    }).at(-1) ?? null;
    if (direct) return direct;
  }
  const jobState = listStagePlayLiveSourceJobStates({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    limit: 10,
  })
    .filter((state) => !input.wake.jobId || state.jobId === input.wake.jobId)
    .filter((state) => state.watchJobPolicyRef)
    .at(-1) ?? null;
  const fromJobState = jobState?.watchJobPolicyRef
    ? getStagePlayLiveSourceWatchJobPolicy(jobState.watchJobPolicyRef)
    : null;
  if (fromJobState) return fromJobState;
  const mailSourceIds = new Set(input.mailBatch.map((item) => item.sourceId));
  return listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    status: "armed",
    limit: 20,
  })
    .filter((policy) =>
      policy.sourceIds.length === 0 ||
      policy.sourceIds.some((sourceId) => mailSourceIds.has(sourceId) || input.wake.sourceIds.includes(sourceId))
    )
    .at(-1) ?? null;
};

const mailBatchForWake = (wake: StagePlayLiveSourceMailWakeRequestV1): StagePlayLiveSourceMailItemV1[] =>
  wake.mailIds
    .map((mailId) => getStagePlayLiveSourceMailItem(mailId))
    .filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

const priorDecisionsForWake = (
  wake: StagePlayLiveSourceMailWakeRequestV1,
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): StagePlayLiveSourceMailDecisionV1[] => {
  const wakeMailIds = new Set(wake.mailIds);
  const decisions = listStagePlayMailDecisions({
    threadId: wake.threadId,
    roomId: wake.roomId ?? null,
    environmentId: wake.environmentId ?? null,
    limit: 50,
  }).filter((decision) => !decision.mailIds.some((mailId) => wakeMailIds.has(mailId)));
  const policyDecisionRefs = new Set(policy?.priorDecisionRefs ?? []);
  return decisions
    .filter((decision) =>
      policyDecisionRefs.size === 0 ||
      policyDecisionRefs.has(decision.decisionId) ||
      decision.activeJobId === policy?.jobId
    )
    .slice(-PRIOR_DECISION_LIMIT);
};

const formatMailBatch = (items: StagePlayLiveSourceMailItemV1[], wake: StagePlayLiveSourceMailWakeRequestV1): string => {
  if (items.length === 0) {
    return wake.mailIds.map((mailId, index) => `${index + 1}. ${mailId} - compact summary unavailable in local store`).join("\n");
  }
  const summaryChars = wakeMailSummaryPreviewChars();
  return items.map((item, index) => [
    `${index + 1}. ${item.mailId}`,
    `   created: ${item.createdAt}`,
    `   source: ${item.sourceId} (${item.sourceKind})`,
    `   refs: ${uniqueStrings([
      item.sourceRefs.frameRef,
      item.sourceRefs.evidenceRef,
      item.sourceRefs.observationRef,
    ]).join(", ") || "none"}`,
    `   summary: ${clipPromptText(item.summary.text || item.summary.preview, summaryChars)}`,
    `   change_hint: ${item.hints.deterministicChangeHint ?? "unknown"}`,
  ].join("\n")).join("\n");
};

const formatPriorDecisions = (
  decisions: StagePlayLiveSourceMailDecisionV1[],
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null,
): string => {
  const priorAnswerRefs = policy?.priorAnswerRefs ?? [];
  const decisionLines = decisions.length > 0
    ? decisions.map((decision) => [
        `- ${decision.decisionId}`,
        `  decision: ${decision.decision}`,
        `  mail: ${decision.mailIds.join(", ") || "none"}`,
        `  rationale: ${clipPromptText(decision.rationalePreview, 240)}`,
        decision.narrativeStateRef ? `  narrative_state: ${decision.narrativeStateRef}` : null,
        decision.textAnswerDraft ? `  text_answer: ${clipPromptText(decision.textAnswerDraft.text, 180)}` : null,
        decision.voiceCalloutDraft ? `  voice_callout: ${clipPromptText(decision.voiceCalloutDraft.text, 180)}` : null,
      ].filter(Boolean).join("\n")).join("\n")
    : "- none recorded";
  return [
    decisionLines,
    "",
    "Prior answer/callout refs:",
    priorAnswerRefs.length > 0 ? priorAnswerRefs.map((ref) => `- ${ref}`).join("\n") : "- none recorded",
  ].join("\n");
};

const formatLatestNarrativeState = (
  narrative: StagePlayLiveSourceNarrativeStateV1 | null,
): string => {
  if (!narrative) return "- none recorded";
  const situation = narrative.interpretedSituation;
  const prediction = narrative.prediction;
  return [
    `- state_id: ${narrative.narrativeStateId}`,
    `  staleness: ${narrative.staleness.state}`,
    narrative.staleness.staleAfterMailId ? `  stale_after_mail: ${narrative.staleness.staleAfterMailId}` : null,
    narrative.staleness.supersededByStateId ? `  superseded_by: ${narrative.staleness.supersededByStateId}` : null,
    `  running_story_summary: ${clipPromptText(narrative.runningStorySummary, 620)}`,
    `  current_scene_summary: ${clipPromptText(narrative.currentSceneSummary, 420)}`,
    "  last_interpreted_situation:",
    situation.setting ? `    setting: ${clipPromptText(situation.setting, 180)}` : null,
    situation.activeWindowOrScene ? `    active_window_or_scene: ${clipPromptText(situation.activeWindowOrScene, 180)}` : null,
    situation.entities.length > 0 ? `    entities: ${situation.entities.join(", ")}` : null,
    situation.objects.length > 0 ? `    objects: ${situation.objects.join(", ")}` : null,
    situation.activities.length > 0 ? `    activities: ${situation.activities.join(", ")}` : null,
    `    user_relevant_meaning: ${clipPromptText(situation.userRelevantMeaning, 420)}`,
    narrative.meaningfulChanges.length > 0 ? `  meaningful_changes: ${narrative.meaningfulChanges.map((entry) => clipPromptText(entry, 160)).join(" | ")}` : null,
    narrative.uncertainties.length > 0 ? `  uncertainties: ${narrative.uncertainties.map((entry) => clipPromptText(entry, 160)).join(" | ")}` : null,
    "  watch_next:",
    `    targets: ${narrative.watchNext.targets.join(", ") || "next compact source summary"}`,
    `    reason: ${clipPromptText(narrative.watchNext.reason, 320)}`,
    prediction ? "  last_prediction:" : null,
    prediction ? `    text: ${clipPromptText(prediction.text, 360)}` : null,
    prediction ? `    horizon: ${prediction.horizon}` : null,
    prediction ? `    confidence: ${prediction.confidence}` : null,
    prediction && prediction.validationSignals.length > 0 ? `    validation_signals: ${prediction.validationSignals.join(" | ")}` : null,
  ].filter(Boolean).join("\n");
};

const formatPriorPrediction = (
  narrative: StagePlayLiveSourceNarrativeStateV1 | null,
): string => {
  const prediction = narrative?.prediction ?? null;
  if (!prediction) return "- none recorded";
  return [
    `- narrative_state: ${narrative.narrativeStateId}`,
    `  text: ${clipPromptText(prediction.text, 520)}`,
    `  horizon: ${prediction.horizon}`,
    `  confidence: ${prediction.confidence}`,
    prediction.validationSignals.length > 0
      ? `  validation_signals: ${prediction.validationSignals.map((entry) => clipPromptText(entry, 160)).join(" | ")}`
      : "  validation_signals: none recorded",
    "  validation_hook:",
    "    Compare the unread mail batch against this prediction.",
    "    If the new mail supports the prediction, include a meaningfulChanges entry beginning with \"Prediction supported:\".",
    "    If the new mail contradicts the prediction, include a meaningfulChanges entry beginning with \"Prediction contradicted:\".",
    "    If the new mail is not enough to validate it, include a meaningfulChanges entry beginning with \"Prediction pending:\".",
  ].join("\n");
};

const formatTaskLine = (task: StagePlayLiveSourceTaskV1 | null | undefined): string | null => {
  if (!task) return null;
  return [
    `- ${task.taskId}`,
    `  kind: ${task.taskKind}`,
    `  status: ${task.status}`,
    `  priority: ${task.priority}`,
    task.statusReason ? `  reason: ${clipPromptText(task.statusReason, 180)}` : null,
    task.mailIds.length > 0 ? `  mail_refs: ${task.mailIds.slice(0, 8).join(", ")}` : null,
    task.narrativeStateRef ? `  narrative_state: ${task.narrativeStateRef}` : null,
    task.deadlineHintMs ? `  deadline_hint_ms: ${task.deadlineHintMs}` : null,
  ].filter(Boolean).join("\n");
};

const formatTaskQueueSnapshot = (
  snapshot: StagePlayLiveSourceTaskQueueSnapshotV1 | null,
): string => {
  if (!snapshot) return "- none recorded";
  const queued = snapshot.queuedTasks.slice(0, 6).map(formatTaskLine).filter((entry): entry is string => Boolean(entry));
  const deferred = snapshot.deferredTasks.slice(0, 4).map(formatTaskLine).filter((entry): entry is string => Boolean(entry));
  const blocked = snapshot.blockedTasks.slice(0, 3).map(formatTaskLine).filter((entry): entry is string => Boolean(entry));
  return [
    `snapshot_at: ${snapshot.createdAt}`,
    `soft_interrupt_recommended: ${snapshot.softInterruptRecommended}`,
    snapshot.softInterruptReason ? `soft_interrupt_reason: ${snapshot.softInterruptReason}` : null,
    "running_task:",
    formatTaskLine(snapshot.runningTask) ?? "- none",
    "queued_tasks:",
    ...(queued.length > 0 ? queued : ["- none"]),
    "deferred_tasks:",
    ...(deferred.length > 0 ? deferred : ["- none"]),
    ...(blocked.length > 0 ? ["blocked_tasks:", ...blocked] : []),
  ].filter(Boolean).join("\n");
};

const activeTaskKindFromSnapshot = (
  snapshot: StagePlayLiveSourceTaskQueueSnapshotV1 | null,
): StagePlayLiveSourceTaskV1["taskKind"] | null =>
  snapshot?.runningTask?.taskKind ??
  snapshot?.queuedTasks[0]?.taskKind ??
  null;

const inferredTaskKindFromLiveReceipts = (input: {
  immersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  predictionValidation?: StagePlayLiveSourcePredictionValidationV1 | null;
  processedPacket?: StagePlayProcessedMailPacketV1 | null;
}): StagePlayLiveSourceTaskV1["taskKind"] => {
  const voiceCandidate =
    (
      input.processedPacket?.salience.voiceCandidate === true &&
      (input.processedPacket.salience.level === "high" || input.processedPacket.salience.level === "urgent")
    ) ||
    (
      input.immersionState?.salience.voiceCandidate === true &&
      (input.immersionState.salience.level === "high" || input.immersionState.salience.level === "urgent")
    );
  if (
    voiceCandidate ||
    input.processedPacket?.recommendedNext === "request_voice_callout" ||
    input.predictionValidation?.recommendedNext === "request_voice_callout"
  ) {
    return "voice_callout_candidate";
  }
  if (
    input.predictionValidation?.result === "contradicted" ||
    input.predictionValidation?.result === "partially_supported"
  ) {
    return "prediction_error_review";
  }
  if (input.predictionValidation?.result === "supported") return "immediate_prediction_check";
  return "mail_batch_interpretation";
};

const formatConversationContextPack = (
  pack: StagePlayLiveSourceConversationContextPackV1 | null,
): string => {
  if (!pack) return "- none recorded";
  const formatCompact = (entry: { eventId: string; textPreview: string; priority?: string; intent?: string }) =>
    `- ${entry.eventId}${entry.intent ? ` [${entry.intent}]` : ""}${entry.priority ? ` (${entry.priority})` : ""}: ${clipPromptText(entry.textPreview, 220)}`;
  return [
    `context_pack: ${pack.contextPackId}`,
    "recent_user_questions:",
    ...(pack.recentUserQuestions.length > 0 ? pack.recentUserQuestions.slice(-4).map(formatCompact) : ["- none"]),
    "active_constraints:",
    ...(pack.activeConstraints.length > 0 ? pack.activeConstraints.slice(-5).map(formatCompact) : ["- none"]),
    "open_questions:",
    ...(pack.openQuestions.length > 0
      ? pack.openQuestions.slice(-4).map((entry) => `- ${entry.eventId} [${entry.source}]: ${clipPromptText(entry.textPreview, 220)}`)
      : ["- none"]),
    "voice_preferences:",
    ...(pack.voicePreferences.length > 0 ? pack.voicePreferences.slice(-4).map(formatCompact) : ["- none"]),
    "last_agreed_objective:",
    pack.lastAgreedObjective
      ? `- ${pack.lastAgreedObjective.eventId}: ${clipPromptText(pack.lastAgreedObjective.textPreview, 260)}`
      : "- none",
  ].join("\n");
};

const hasActiveUserPromptContext = (
  pack: StagePlayLiveSourceConversationContextPackV1 | null,
): boolean =>
  Boolean(pack?.recentUserQuestions.some((entry) => entry.priority === "active_user_prompt" || entry.priority === "urgent_user_interrupt"));

const formatHeldCallouts = (callouts: StagePlayHeldCalloutV1[]): string =>
  callouts.length > 0
    ? callouts.slice(-6).map((callout) => [
        `- ${callout.calloutId}`,
        `  status: ${callout.status}`,
        `  urgency: ${callout.urgency}`,
        `  decision: ${callout.decisionId}`,
        callout.mailIds.length > 0 ? `  mail_refs: ${callout.mailIds.slice(0, 6).join(", ")}` : null,
        `  text: ${clipPromptText(callout.text, 220)}`,
        callout.statusReason ? `  reason: ${clipPromptText(callout.statusReason, 180)}` : null,
      ].filter(Boolean).join("\n")).join("\n")
    : "- none recorded";

const formatLatestPredictionErrorReceipt = (
  narrative: StagePlayLiveSourceNarrativeStateV1 | null,
): string =>
  narrative?.prediction
    ? [
        "- none persisted yet for this wake.",
        `  prior_prediction_ref: ${narrative.narrativeStateId}`,
        "  use live_env.compare_live_source_prediction when the current task is prediction_error_review or when validating prior prediction signals.",
      ].join("\n")
    : "- none recorded";

const formatLatestImmersionState = (
  state: StagePlayLiveSourceImmersionStateV1 | null,
): string => {
  if (!state) return "- none recorded";
  return [
    `- state_id: ${state.immersionStateId}`,
    `  identity: ${state.sourceIdentity.label} (${Math.round(state.sourceIdentity.confidence * 100)}%, stable=${state.sourceIdentity.stable})`,
    `  activity: ${state.currentActivity}`,
    `  salience: ${state.salience.level}${state.salience.voiceCandidate ? " (voice candidate)" : ""}`,
    state.stableFacts.length > 0 ? `  stable_facts: ${state.stableFacts.slice(0, 8).join(" | ")}` : null,
    state.currentSceneFacts.length > 0 ? `  current_scene_facts: ${state.currentSceneFacts.slice(0, 8).join(" | ")}` : null,
    state.changedFacts.length > 0 ? `  changed_facts: ${state.changedFacts.slice(0, 8).join(" | ")}` : null,
    state.uncertainties.length > 0 ? `  uncertainties: ${state.uncertainties.slice(0, 5).join(" | ")}` : null,
    state.prediction ? `  prediction: ${clipPromptText(state.prediction.text, 360)}` : null,
    state.prediction ? `  prediction_watch_targets: ${state.prediction.watchTargets.slice(0, 8).join(" | ") || "none"}` : null,
  ].filter(Boolean).join("\n");
};

const formatPredictionValidation = (
  validation: StagePlayLiveSourcePredictionValidationV1 | null,
): string => {
  if (!validation) return "- none recorded";
  return [
    `- validation_id: ${validation.validationId}`,
    `  result: ${validation.result}`,
    `  prior_prediction: ${validation.priorPredictionId ?? "none"}`,
    `  salience_hint: ${validation.salienceHint}`,
    `  recommended_next: ${validation.recommendedNext}`,
    validation.supportedSignals.length > 0 ? `  supported: ${validation.supportedSignals.slice(0, 8).join(" | ")}` : null,
    validation.contradictedSignals.length > 0 ? `  contradicted: ${validation.contradictedSignals.slice(0, 8).join(" | ")}` : null,
    validation.newSignals.length > 0 ? `  new_signals: ${validation.newSignals.slice(0, 8).join(" | ")}` : null,
  ].filter(Boolean).join("\n");
};

const formatProcessedMailPacket = (
  packet: StagePlayProcessedMailPacketV1 | null,
): string => {
  if (!packet) return "- none recorded";
  return [
    `- packet_id: ${packet.packetId}`,
    `  source: ${packet.sourceId}`,
    `  mail_refs: ${packet.mailIds.slice(0, 12).join(", ")}`,
    `  resolution: ${packet.resolutionState}`,
    `  recommended_next: ${packet.recommendedNext}`,
    `  salience: ${packet.salience.level}${packet.salience.voiceCandidate ? " (voice candidate)" : ""}`,
    packet.observedFacts.length > 0 ? `  observed: ${packet.observedFacts.slice(0, 6).map((fact) => clipPromptText(fact, 160)).join(" | ")}` : null,
    packet.inferredFacts.length > 0 ? `  inferred: ${packet.inferredFacts.slice(0, 6).map((fact) => clipPromptText(fact, 160)).join(" | ")}` : null,
    packet.changedFacts.length > 0 ? `  changed: ${packet.changedFacts.slice(0, 6).join(" | ")}` : null,
    packet.uncertainties.length > 0 ? `  uncertain: ${packet.uncertainties.slice(0, 4).join(" | ")}` : null,
    packet.effortEstimate ? `  effort: ${packet.effortEstimate.currentEffort}; confidence ${packet.effortEstimate.confidence.toFixed(2)}` : null,
    packet.axioms?.axioms.length ? `  axioms: ${packet.axioms.axioms.slice(0, 5).join(" | ")}` : null,
    packet.hypotheses?.length ? `  hypotheses: ${packet.hypotheses.slice(0, 4).map((hypothesis) => `${hypothesis.label}:${hypothesis.confidence.toFixed(2)}`).join(" | ")}` : null,
    packet.arbiter ? `  arbiter: ${packet.arbiter.recommendedNext}; wake ${packet.arbiter.wakeAsk ? "yes" : "no"}; ${clipPromptText(packet.arbiter.reason, 180)}` : null,
    packet.watchNext.length > 0 ? `  watch_next: ${packet.watchNext.slice(0, 8).join(" | ")}` : null,
    packet.voiceCalloutMatches.length > 0 ? `  voice_matches: ${packet.voiceCalloutMatches.slice(0, 6).join(" | ")}` : null,
    packet.salience.calloutDraft ? `  callout_candidate: ${clipPromptText(packet.salience.calloutDraft, 180)}` : null,
    packet.microReasonerRunRefs.length > 0 ? `  micro_reasoners: ${packet.microReasonerRunRefs.slice(0, 8).join(", ")}` : null,
  ].filter(Boolean).join("\n");
};

const formatVoiceCandidateReceipt = (input: {
  immersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  predictionValidation?: StagePlayLiveSourcePredictionValidationV1 | null;
  processedPacket?: StagePlayProcessedMailPacketV1 | null;
}): string => {
  const state = input.immersionState ?? null;
  const validation = input.predictionValidation ?? null;
  const packet = input.processedPacket ?? null;
  const isCandidate =
    state?.salience.voiceCandidate === true &&
    (state.salience.level === "high" || state.salience.level === "urgent");
  if (!isCandidate && validation?.recommendedNext !== "request_voice_callout" && packet?.recommendedNext !== "request_voice_callout") {
    return "- none";
  }
  return [
    `- candidate: ${isCandidate || validation?.recommendedNext === "request_voice_callout" || packet?.recommendedNext === "request_voice_callout"}`,
    `  salience: ${packet?.salience.level ?? state?.salience.level ?? validation?.salienceHint ?? "unknown"}`,
    `  voice_candidate: ${packet?.salience.voiceCandidate === true || state?.salience.voiceCandidate === true}`,
    `  recommended_next: ${packet?.recommendedNext ?? validation?.recommendedNext ?? "model_decides"}`,
    state?.salience.reasons.length ? `  reasons: ${state.salience.reasons.slice(0, 6).join(" | ")}` : null,
    packet?.voiceCalloutMatches.length ? `  voice_matches: ${packet.voiceCalloutMatches.slice(0, 6).join(" | ")}` : null,
    packet?.salience.calloutDraft ? `  callout_candidate: ${clipPromptText(packet.salience.calloutDraft, 180)}` : null,
    validation?.newSignals.length ? `  signals: ${validation.newSignals.slice(0, 8).join(" | ")}` : null,
    "  decision_required: choose request_voice_callout, draft_text_answer, or wait_for_next_summary after checking voice policy and suppression criteria.",
  ].filter(Boolean).join("\n");
};

const buildImmersionPredictionForWake = (input: {
  jobId: string;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  delta: ReturnType<typeof extractStagePlayLiveSourceDelta>;
}): NonNullable<StagePlayLiveSourceImmersionStateV1["prediction"]> => {
  const latestSummary = clipPromptText(input.mailBatch.at(-1)?.summary.text ?? input.mailBatch.at(-1)?.summary.preview ?? "", 240);
  const predictionText = input.delta.watchTargets.length > 0
    ? `Watch whether ${input.delta.watchTargets.slice(0, 3).join(", ")} changes in the next live-source window.`
    : latestSummary
      ? `Watch whether the current scene remains consistent with: ${latestSummary}`
      : "Watch the next compact source update for scene, activity, or salience changes.";
  return {
    predictionId: `stage_play_live_source_prediction:${hashShort([
      input.jobId,
      input.mailBatch.map((item) => item.mailId),
      predictionText,
    ])}`,
    text: predictionText,
    horizonMs: 10_000,
    watchTargets: input.delta.watchTargets,
    validationSignals: uniqueStrings([
      ...input.delta.watchTargets,
      ...input.delta.changedFacts,
      input.delta.currentActivity,
      input.delta.salience.level,
    ]),
    confidence: 0.48,
  };
};

const policyWantsEveryBatch = (policy: StagePlayLiveSourceWatchJobPolicyV1 | null): boolean =>
  policy?.outputCadence === "every_batch";

const salienceNeedsSlowAsk = (salience: StagePlayLiveSourceImmersionStateV1["salience"]): boolean =>
  salience.level === "urgent" || salience.voiceCandidate;

const processedPacketNeedsSlowAsk = (packet: StagePlayProcessedMailPacketV1): boolean =>
  packet.arbiter?.wakeAsk === true ||
  packet.recommendedNext === "request_voice_callout" ||
  packet.recommendedNext === "request_more_evidence" ||
  packet.recommendedNext === "request_stage_play_checkpoint" ||
  packet.recommendedNext === "draft_text_answer";

const policyCriteriaNeedsSlowAsk = (input: {
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  mailBatch: StagePlayLiveSourceMailItemV1[];
}): boolean => {
  if (!input.policy) return false;
  const text = input.mailBatch.map((item) => item.summary.text || item.summary.preview).join("\n").toLowerCase();
  const criteria = [
    ...input.policy.importanceCriteria,
    ...(input.policy.outputPolicy.allowVoiceCallout ? input.policy.importanceCriteria : []),
  ].join("\n").toLowerCase();
  const textWords = new Set(wordsFromText(text));
  const criteriaWords = wordsFromText(criteria);
  const overlap = criteriaWords.filter((word) => textWords.has(word));
  if (overlap.length > 0) return true;
  return (
    /\b(?:dark|darker|night|hostile|mob|creeper|zombie|skeleton|fire|damage|danger|urgent|risk|lava|combat)\b/i.test(text) &&
    /\b(?:night|hostile|mob|danger|urgent|risk|voice|callout|important|salient)\b/i.test([
      criteria,
      input.policy.objectiveText,
      input.policy.decisionPolicyPrompt,
    ].join("\n"))
  );
};

const buildWakeFastLayer = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  activeInterpreterProfile: StagePlayLiveSourceInterpreterProfileV1 | null;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  now: string;
  manualRun?: boolean;
}): {
  priorImmersionState: StagePlayLiveSourceImmersionStateV1 | null;
  immersionState: StagePlayLiveSourceImmersionStateV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  processedPacket: StagePlayProcessedMailPacketV1;
  microReasonerRuns: StagePlayMicroReasonerRunV1[];
  shouldRunSlowAsk: boolean;
  slowAskReason: string;
} => {
  const jobId = input.policy?.jobId ?? input.wake.jobId ?? `stage_play_live_source_job:${hashShort([
    input.wake.threadId,
    input.wake.roomId ?? null,
    input.wake.environmentId ?? null,
    input.mailBatch[0]?.sourceId ?? input.wake.sourceIds[0] ?? "source",
  ])}`;
  const priorImmersionState = getLatestStagePlayLiveSourceImmersionState({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    jobId,
    policyId: input.policy?.policyId ?? null,
    profileId: input.activeInterpreterProfile?.profileId ?? null,
    sourceId: input.mailBatch[0]?.sourceId ?? input.wake.sourceIds[0] ?? null,
  }) ?? getLatestStagePlayLiveSourceImmersionState({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    sourceId: input.mailBatch[0]?.sourceId ?? input.wake.sourceIds[0] ?? null,
  });
  const delta = extractStagePlayLiveSourceDelta({
    latestMailItems: input.mailBatch,
    priorImmersionState,
    activeProfile: input.activeInterpreterProfile,
  });
  const predictionValidation = validateStagePlayLiveSourcePredictionFromMail({
    jobId,
    priorImmersionState,
    latestMailItems: input.mailBatch,
    delta,
    createdAt: input.now,
  });
  const prediction = buildImmersionPredictionForWake({
    jobId,
    mailBatch: input.mailBatch,
    delta,
  });
  const evidenceRefs = uniqueStrings([
    input.wake.wakeRequestId,
    input.policy?.policyId,
    input.activeInterpreterProfile?.profileId,
    priorImmersionState?.immersionStateId,
    predictionValidation.validationId,
    ...input.wake.evidenceRefs,
    ...input.wake.mailIds,
    ...input.wake.sourceIds,
    ...input.mailBatch.flatMap((item) => item.evidenceRefs),
  ]);
  const immersionState = recordStagePlayLiveSourceImmersionState({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    jobId,
    policyId: input.policy?.policyId ?? priorImmersionState?.policyId ?? null,
    profileId: input.activeInterpreterProfile?.profileId ?? priorImmersionState?.profileId ?? null,
    sourceIds: uniqueStrings([
      ...input.wake.sourceIds,
      ...input.mailBatch.map((item) => item.sourceId),
      ...(input.policy?.sourceIds ?? []),
      ...(priorImmersionState?.sourceIds ?? []),
    ]),
    latestMailIds: input.mailBatch.map((item) => item.mailId),
    latestEvidenceRefs: uniqueStrings([
      ...input.mailBatch.flatMap((item) => item.evidenceRefs),
      ...input.mailBatch.flatMap((item) => [item.sourceRefs.frameRef, item.sourceRefs.evidenceRef, item.sourceRefs.observationRef]),
    ]),
    sourceIdentity: delta.sourceIdentity,
    stableFacts: delta.stableFacts,
    currentSceneFacts: delta.currentSceneFacts,
    changedFacts: delta.changedFacts,
    uncertainties: delta.uncertainties,
    currentActivity: delta.currentActivity,
    salience: delta.salience,
    prediction,
    lastValidation: {
      validationId: predictionValidation.validationId,
      priorPredictionId: predictionValidation.priorPredictionId,
      result: predictionValidation.result,
      evidenceSummary: predictionValidation.newSignals.slice(0, 6).join("; ") || "No validation signals were available.",
    },
    evidenceRefs,
    causalTrace: input.wake.causalTrace,
    createdAt: input.now,
  });
  const { packet: processedPacket, microReasonerRuns } = buildStagePlayProcessedMailPacket({
    jobId,
    sourceId: input.mailBatch[0]?.sourceId ?? input.wake.sourceIds[0] ?? "unknown_source",
    mailItems: input.mailBatch,
    priorImmersionState,
    immersionState,
    predictionValidation,
    activeProfile: input.activeInterpreterProfile ?? null,
    causalTrace: input.wake.causalTrace,
    now: input.now,
  });
  const shouldRunSlowAsk =
    input.manualRun === true ||
    !input.policy ||
    policyWantsEveryBatch(input.policy) ||
    processedPacketNeedsSlowAsk(processedPacket) ||
    salienceNeedsSlowAsk(immersionState.salience) ||
    policyCriteriaNeedsSlowAsk({
      policy: input.policy,
      mailBatch: input.mailBatch,
    });
  const slowAskReason = input.manualRun === true
    ? "manual_or_explicit_checkpoint"
    : !input.policy
      ? "missing_policy_requires_model_decision"
      : policyWantsEveryBatch(input.policy)
        ? "policy_output_cadence_every_batch"
        : processedPacketNeedsSlowAsk(processedPacket)
          ? processedPacket.recommendedNext === "request_voice_callout"
            ? "processed_packet_voice_candidate"
            : `processed_packet_${processedPacket.recommendedNext}`
          : salienceNeedsSlowAsk(immersionState.salience)
            ? `salience_${immersionState.salience.level}`
          : policyCriteriaNeedsSlowAsk({ policy: input.policy, mailBatch: input.mailBatch })
            ? "policy_criteria_matched"
          : predictionValidation.result === "contradicted" || predictionValidation.result === "partially_supported"
            ? `fast_layer_local_interpretation_${predictionValidation.result}`
            : "fast_layer_wait";
  return {
    priorImmersionState,
    immersionState,
    predictionValidation,
    processedPacket,
    microReasonerRuns,
    shouldRunSlowAsk,
    slowAskReason,
  };
};

const immediatePredictionTextForMail = (
  mailBatch: StagePlayLiveSourceMailItemV1[],
): string => {
  const latestSummary = clipPromptText(mailBatch.at(-1)?.summary.text ?? mailBatch.at(-1)?.summary.preview ?? "", 260);
  if (!latestSummary) return "Likely next: waiting for the next compact source summary to establish the visible state.";
  if (/\b(?:night|dark|darker|low light|sunset|evening)\b/i.test(latestSummary)) {
    return "Likely next: seeking shelter, adding light, or reassessing outdoor movement.";
  }
  if (/\b(?:forest|tree|wood|log|daylight|player)\b/i.test(latestSummary)) {
    return "Likely next: gathering wood or scanning resources.";
  }
  if (/\b(?:hostile|mob|creeper|skeleton|zombie|danger|attack)\b/i.test(latestSummary)) {
    return "Likely next: responding to the threat or repositioning.";
  }
  return `Likely next: checking whether this state changes or remains stable: ${latestSummary}`;
};

const predictionCheckTextForNarrative = (
  narrative: StagePlayLiveSourceNarrativeStateV1 | null,
): string => {
  if (!narrative?.prediction) return "No prior prediction.";
  const prediction = clipPromptText(narrative.prediction.text, 260);
  if (narrative.staleness.state === "stale_after_new_mail") {
    return `Prior prediction is stale after new mail: ${prediction}`;
  }
  if (narrative.staleness.state === "superseded") {
    return `Prior prediction was superseded: ${prediction}`;
  }
  return `Prior prediction available: ${prediction}`;
};

const makeWakeTranscriptRow = (input: {
  rowId: string;
  rowKind: DurableWakeTranscriptRow["rowKind"];
  title: string;
  body: string;
  toolName?: string | null;
  artifactId?: string | null;
  artifactKind?: string | null;
  evidenceRefs?: string[];
  authority?: DurableWakeTranscriptRow["authority"];
  terminalEligible?: boolean;
  createdAt: string;
}): DurableWakeTranscriptRow => ({
  rowId: input.rowId,
  rowKind: input.rowKind,
  title: input.title,
  body: input.body,
  source: {
    toolName: input.toolName ?? null,
    artifactId: input.artifactId ?? null,
    artifactKind: input.artifactKind ?? null,
  },
  evidenceRefs: uniqueStrings(input.evidenceRefs ?? []),
  authority: input.authority ?? "tool_evidence",
  assistantAnswer: false,
  terminalEligible: input.terminalEligible === true,
  createdAt: input.createdAt,
});

const budgetActionForWakeResult = (input: {
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  retainedMailCount?: number;
}): LiveSourceBudgetActionV1 => {
  if (input.wakeResult.status === "completed") {
    return (input.retainedMailCount ?? 0) > 0 ? "batched" : "processed";
  }
  if (input.wakeResult.status === "deferred_for_pressure") return "pressure_blocked";
  if (/paused/i.test(input.wakeResult.failedReason ?? input.wakeResult.skippedReason ?? "")) return "paused";
  return "deferred";
};

const recordWakeBudgetReceipt = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  action?: LiveSourceBudgetActionV1;
  reason?: string | null;
  processedMailCount?: number | null;
  retainedMailCount?: number | null;
  evidenceRefs: string[];
  pressureReason?: string | null;
  createdAt: string;
}): {
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  budgetState: LiveSourceBudgetStateV1;
} => {
  const action = input.action ?? budgetActionForWakeResult({
    wakeResult: input.wakeResult,
    retainedMailCount: input.retainedMailCount ?? 0,
  });
  const budgetState = recordLiveSourceBudgetState({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    jobId: input.wake.jobId ?? null,
    wakeRequest: input.wake,
    wakeResult: input.wakeResult,
    action,
    reason:
      input.reason ??
      input.wakeResult.failedReason ??
      input.wakeResult.skippedReason ??
      (action === "batched" ? "wake_batch_split" : `wake_${action}`),
    processedMailCount: input.processedMailCount ?? input.wake.mailIds.length,
    retainedMailCount: input.retainedMailCount ?? 0,
    pressureReason: input.pressureReason ?? (
      action === "pressure_blocked"
        ? input.wakeResult.failedReason ?? input.wakeResult.skippedReason ?? "runtime_pressure"
        : null
    ),
    evidenceRefs: input.evidenceRefs,
    causalTraces: [input.wake.causalTrace, input.wakeResult.causalTrace],
    now: input.createdAt,
  });
  const attached = attachLiveSourceBudgetStateToWakeResult({
    wakeResultId: input.wakeResult.wakeResultId,
    budgetStateId: budgetState.budgetStateId,
  });
  return {
    wakeResult: attached ?? {
      ...input.wakeResult,
      budgetStateRef: budgetState.budgetStateId,
      evidenceRefs: uniqueStrings([...input.wakeResult.evidenceRefs, budgetState.budgetStateId]),
    },
    budgetState,
  };
};

const buildBudgetTranscriptRow = (budgetState: LiveSourceBudgetStateV1, createdAt: string): DurableWakeTranscriptRow =>
  makeWakeTranscriptRow({
    rowId: `wake_budget_state:${hashShort(budgetState.budgetStateId)}`,
    rowKind: "budget_state",
    title: "Budget state",
    body: [
      `${budgetState.action}: ${budgetState.reason}`,
      `Processed ${budgetState.mailCounts.processedMailCount}/${budgetState.mailCounts.wakeMailCount} mail item(s); retained ${budgetState.mailCounts.retainedMailCount}; unread backlog ${budgetState.mailCounts.unreadBacklogCount}.`,
      `Wake counts: queued ${budgetState.wakeCounts.queuedWakeCount}, running ${budgetState.wakeCounts.runningWakeCount}, deferred ${budgetState.wakeCounts.deferredWakeCount}, failed ${budgetState.wakeCounts.failedWakeCount}.`,
      `Next: ${budgetState.allowedNextAction}.`,
    ].join("\n"),
    artifactId: budgetState.budgetStateId,
    artifactKind: budgetState.artifactId,
    evidenceRefs: budgetState.evidenceRefs,
    authority: "tool_evidence",
    createdAt,
  });

const microReasonerTranscriptTitle = (role: StagePlayMicroReasonerRunV1["role"]): string => {
  switch (role) {
    case "claim_extractor":
      return "Claims extracted";
    case "observation_classifier":
      return "Observation classified";
    case "profile_comparator":
      return "Profile compared";
    case "delta_extractor":
      return "Delta extracted";
    case "prediction_validator":
      return "Prediction micro-check";
    case "salience_scorer":
      return "Salience scored";
    case "decision_selector":
      return "Decision selected";
    case "voice_callout_drafter":
      return "Voice draft prepared";
    case "packet_composer":
      return "Packet composed";
    default:
      return "Micro-reasoner run";
  }
};

const microReasonerWakeReason = (input: {
  processedPacket?: StagePlayProcessedMailPacketV1 | null;
  microReasonerRuns?: StagePlayMicroReasonerRunV1[];
}): string => {
  const decisionRun = (input.microReasonerRuns ?? [])
    .filter((run) => run.role === "decision_selector")
    .at(-1) ?? null;
  const selectedDecision = decisionRun?.selectedDecision ?? input.processedPacket?.recommendedNext ?? null;
  const nextTool = decisionRun?.recommendedNextTool ?? (
    selectedDecision && selectedDecision !== "wait_for_next_summary"
      ? "live_env.record_live_source_mail_decision"
      : null
  );
  if (decisionRun && selectedDecision) {
    return [
      `decision_selector selected ${selectedDecision}`,
      nextTool ? `next tool ${nextTool}` : null,
    ].filter(Boolean).join("; ");
  }
  if (input.processedPacket?.recommendedNext) {
    return `processed packet recommended ${input.processedPacket.recommendedNext}`;
  }
  return "live-source wake policy admitted the mail batch";
};

const buildWakeMicroReasonerTranscriptRows = (input: {
  microReasonerRuns?: StagePlayMicroReasonerRunV1[];
  createdAt: string;
}): DurableWakeTranscriptRow[] =>
  (input.microReasonerRuns ?? []).slice(0, 16).map((run) => makeWakeTranscriptRow({
    rowId: `wake_micro_reasoner:${hashShort(run.runId)}`,
    rowKind: "micro_reasoner_run",
    title: microReasonerTranscriptTitle(run.role),
    body: [
      `Role: ${run.role}.`,
      `Mode: ${run.reasoningMode}; model: ${run.modelUsed}; latency: ${run.latencyMs}ms.`,
      run.selectedDecision ? `Decision: ${run.selectedDecision}.` : null,
      run.recommendedNextTool ? `Recommended next tool: ${run.recommendedNextTool}.` : null,
      run.salienceLevel ? `Salience: ${run.salienceLevel}${run.voiceCandidate ? " (voice candidate)" : ""}.` : null,
      typeof run.confidence === "number" ? `Confidence: ${Math.round(run.confidence * 100)}%.` : null,
      run.outputPreview ? `Output: ${clipPromptText(run.outputPreview, 260)}` : null,
      run.missingEvidence.length > 0
        ? `Missing evidence: ${run.missingEvidence.slice(0, 5).join("; ")}.`
        : null,
    ].filter(Boolean).join("\n"),
    toolName: "live_env.process_live_source_mail_packet",
    artifactId: run.runId,
    artifactKind: run.artifactId,
    evidenceRefs: uniqueStrings([run.runId, ...run.inputRefs, ...run.outputRefs]),
    authority: "tool_evidence",
    terminalEligible: false,
    createdAt: input.createdAt,
  }));

const buildDurableWakeTranscriptRows = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  priorNarrativeState?: StagePlayLiveSourceNarrativeStateV1 | null;
  immersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  predictionValidation?: StagePlayLiveSourcePredictionValidationV1 | null;
  processedPacket?: StagePlayProcessedMailPacketV1 | null;
  microReasonerRuns?: StagePlayMicroReasonerRunV1[];
  slowAskRan?: boolean;
  decisionIds: string[];
  budgetState?: LiveSourceBudgetStateV1 | null;
  voiceReceipts?: StagePlayLiveSourceVoiceDeliveryReceiptV1[];
  evidenceRefs: string[];
  createdAt: string;
}): DurableWakeTranscriptRow[] => {
  const rows: DurableWakeTranscriptRow[] = [];
  for (const item of input.mailBatch) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_mail_received:${hashShort([input.wake.wakeRequestId, item.mailId])}`,
      rowKind: "mail_received",
      title: "Observation mail",
      body: item.summary.preview,
      artifactId: item.mailId,
      artifactKind: item.artifactId,
      evidenceRefs: item.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.immersionState) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_immersion_update:${hashShort(input.immersionState.immersionStateId)}`,
      rowKind: "interpretation_state",
      title: "Immersion state",
      body: [
        `Identity: ${input.immersionState.sourceIdentity.label} (${Math.round(input.immersionState.sourceIdentity.confidence * 100)}%).`,
        `Activity: ${input.immersionState.currentActivity}. Salience: ${input.immersionState.salience.level}.`,
        input.immersionState.changedFacts.length > 0
          ? `Deltas: ${input.immersionState.changedFacts.slice(0, 4).join("; ")}.`
          : "Deltas: no new heuristic deltas.",
        input.immersionState.prediction
          ? `Prediction: ${input.immersionState.prediction.text}`
          : null,
      ].filter(Boolean).join("\n"),
      toolName: "live_env.update_live_source_immersion_state",
      artifactId: input.immersionState.immersionStateId,
      artifactKind: input.immersionState.artifactId,
      evidenceRefs: input.immersionState.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.predictionValidation) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_prediction_validation:${hashShort(input.predictionValidation.validationId)}`,
      rowKind: "prediction_check",
      title: "Prediction validation",
      body: [
        `${input.predictionValidation.result}; recommended next ${input.predictionValidation.recommendedNext}.`,
        input.predictionValidation.supportedSignals.length > 0
          ? `Supported: ${input.predictionValidation.supportedSignals.slice(0, 4).join("; ")}.`
          : null,
        input.predictionValidation.contradictedSignals.length > 0
          ? `Contradicted: ${input.predictionValidation.contradictedSignals.slice(0, 4).join("; ")}.`
          : null,
        input.predictionValidation.newSignals.length > 0
          ? `New: ${input.predictionValidation.newSignals.slice(0, 4).join("; ")}.`
          : null,
      ].filter(Boolean).join("\n"),
      toolName: "live_env.validate_live_source_prediction",
      artifactId: input.predictionValidation.validationId,
      artifactKind: input.predictionValidation.artifactId,
      evidenceRefs: input.predictionValidation.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.processedPacket) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_processed_packet:${hashShort(input.processedPacket.packetId)}`,
      rowKind: "processed_mail_packet",
      title: "Processed mail packet",
      body: [
        `${input.processedPacket.resolutionState}; recommended ${input.processedPacket.recommendedNext}.`,
        `Salience: ${input.processedPacket.salience.level}${input.processedPacket.salience.voiceCandidate ? " (voice candidate)" : ""}.`,
        input.processedPacket.observedFacts.length > 0
          ? `Observed: ${input.processedPacket.observedFacts.slice(0, 3).map((fact) => clipPromptText(fact, 120)).join("; ")}.`
          : null,
        input.processedPacket.changedFacts.length > 0
          ? `Changed: ${input.processedPacket.changedFacts.slice(0, 4).join("; ")}.`
          : null,
        input.processedPacket.watchNext.length > 0
          ? `Watch next: ${input.processedPacket.watchNext.slice(0, 5).join("; ")}.`
          : null,
      ].filter(Boolean).join("\n"),
      toolName: "live_env.process_live_source_mail_packet",
      artifactId: input.processedPacket.packetId,
      artifactKind: input.processedPacket.artifactId,
      evidenceRefs: input.processedPacket.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  rows.push(...buildWakeMicroReasonerTranscriptRows({
    microReasonerRuns: input.microReasonerRuns,
    createdAt: input.createdAt,
  }));
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_prediction_check:${hashShort(input.wake.wakeRequestId)}`,
    rowKind: "prediction_check",
    title: "Prediction check",
    body: predictionCheckTextForNarrative(input.priorNarrativeState ?? null),
    toolName: "live_env.compare_live_source_prediction",
    artifactId: input.priorNarrativeState?.narrativeStateId ?? input.wake.wakeRequestId,
    artifactKind: input.priorNarrativeState?.artifactId ?? input.wake.artifactId,
    evidenceRefs: uniqueStrings([
      input.priorNarrativeState?.narrativeStateId,
      ...(input.priorNarrativeState?.evidenceRefs ?? []),
      ...input.evidenceRefs,
    ]),
    createdAt: input.createdAt,
  }));
  if (!input.priorNarrativeState?.prediction) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_immediate_prediction:${hashShort(input.wake.wakeRequestId)}`,
      rowKind: "prediction",
      title: "Immediate prediction",
      body: immediatePredictionTextForMail(input.mailBatch),
      toolName: "live_env.predict_live_source_immediate",
      artifactId: input.wake.wakeRequestId,
      artifactKind: input.wake.artifactId,
      evidenceRefs: input.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_requested:${hashShort(input.wake.wakeRequestId)}`,
    rowKind: "mail_wake_requested",
    title: "Wake requested",
    body: `${input.wake.mailIds.length} live-source mail item(s) queued for Helix Ask wake because ${microReasonerWakeReason({
      processedPacket: input.processedPacket,
      microReasonerRuns: input.microReasonerRuns,
    })}.`,
    artifactId: input.wake.wakeRequestId,
    artifactKind: input.wake.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  if (input.slowAskRan !== false) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_mail_read_tool_call:${hashShort(input.wake.wakeRequestId)}`,
      rowKind: "mail_read_tool_call",
      title: "Tool call",
      body: "live_env.read_live_source_mail",
      toolName: "live_env.read_live_source_mail",
      artifactId: input.wake.wakeRequestId,
      artifactKind: input.wake.artifactId,
      evidenceRefs: input.evidenceRefs,
      createdAt: input.createdAt,
    }));
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_mail_read_receipt:${hashShort(input.wake.wakeRequestId)}`,
      rowKind: "mail_read_receipt",
      title: "Tool receipt",
      body: `Read ${input.mailBatch.length || input.wake.mailIds.length} ${mailBatchLabel(input.mailBatch)} mail item${(input.mailBatch.length || input.wake.mailIds.length) === 1 ? "" : "s"}.`,
      toolName: "live_env.read_live_source_mail",
      artifactId: input.wake.wakeRequestId,
      artifactKind: input.wake.artifactId,
      evidenceRefs: input.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.budgetState) {
    rows.push(buildBudgetTranscriptRow(input.budgetState, input.createdAt));
  }
  const decisions = input.decisionIds
    .map((decisionId) => getStagePlayMailDecision(decisionId))
    .filter((decision): decision is StagePlayLiveSourceMailDecisionV1 => Boolean(decision));
  const voiceReceiptByDecisionId = new Map(
    (input.voiceReceipts ?? []).map((receipt) => [receipt.decisionId, receipt]),
  );
  if (decisions.length > 0) {
    for (const decision of decisions) {
      const voiceReceipt = voiceReceiptByDecisionId.get(decision.decisionId) ?? null;
      const decisionProfile = decision.interpreterProfileRef
        ? getStagePlayLiveSourceInterpreterProfile(decision.interpreterProfileRef)
        : null;
      if (decision.interpreterProfileRef) {
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_interpreter_profile:${hashShort([decision.decisionId, decision.interpreterProfileRef])}`,
          rowKind: "interpreter_profile",
          title: "Interpreter profile",
          body: decisionProfile
            ? `${decisionProfile.title} applied.\nDomain: ${decisionProfile.domain}. Voice: ${decisionProfile.outputStyle.voiceStyle}.\nSuppressed: ${decisionProfile.suppressCriteria.join(", ") || "none"}.\nWatch: ${decisionProfile.salienceCriteria.join(", ") || "profile criteria"}.`
            : `${decision.interpreterProfileRef} applied.`,
          toolName: "live_env.record_live_source_mail_decision",
          artifactId: decision.interpreterProfileRef,
          artifactKind: "stage_play_live_source_interpreter_profile",
          evidenceRefs: uniqueStrings([decision.interpreterProfileRef, ...decision.evidenceRefs]),
          authority: "tool_evidence",
          createdAt: input.createdAt,
        }));
      }
      for (const comparisonRef of decision.profileComparisonRefs ?? []) {
        const comparison = listStagePlayLiveSourceInterpreterProfileComparisons({ limit: 250 })
          .find((entry) => entry.comparisonId === comparisonRef) ?? null;
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_profile_comparison:${hashShort([decision.decisionId, comparisonRef])}`,
          rowKind: "profile_comparison",
          title: "Profile comparison",
          body: comparison
            ? [
                comparison.matchedCriteria.length ? `Matched: ${comparison.matchedCriteria.join(", ")}.` : "Matched: none.",
                comparison.suppressedCriteria.length ? `Suppressed: ${comparison.suppressedCriteria.join(", ")}.` : "Suppressed: none.",
                comparison.criterionLedgerStatuses?.length
                  ? `Ledger: ${comparison.criterionLedgerStatuses.map((entry) => `${entry.criterionText} -> ${entry.status}`).join("; ")}.`
                  : "Ledger: no criterion state changes.",
                `Recommended: ${comparison.recommendedDecision}.`,
              ].join("\n")
            : [
                decision.matchedCriteria?.length ? `Matched: ${decision.matchedCriteria.join(", ")}.` : "Matched: none recorded.",
                decision.suppressedCriteria?.length ? `Suppressed: ${decision.suppressedCriteria.join(", ")}.` : "Suppressed: none recorded.",
                `Comparison: ${comparisonRef}.`,
              ].join("\n"),
          toolName: "live_env.record_live_source_mail_decision",
          artifactId: comparisonRef,
          artifactKind: "stage_play_live_source_interpreter_profile_comparison",
          evidenceRefs: uniqueStrings([comparisonRef, ...decision.evidenceRefs]),
          authority: "tool_evidence",
          createdAt: input.createdAt,
        }));
      }
      rows.push(makeWakeTranscriptRow({
        rowId: `wake_agent_decision:${hashShort(decision.decisionId)}`,
        rowKind: "agent_decision",
        title: "Agent decision",
        body: `${decision.decision}: ${decision.rationalePreview}`,
        toolName: "live_env.record_live_source_mail_decision",
        artifactId: decision.decisionId,
        artifactKind: decision.artifactId,
        evidenceRefs: decision.evidenceRefs,
        authority: "model_decision_receipt",
        createdAt: input.createdAt,
      }));
      if (decision.textAnswerDraft) {
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_text_answer:${hashShort(decision.decisionId)}`,
          rowKind: "text_answer",
          title: "Text draft",
          body: decision.textAnswerDraft.text,
          artifactId: decision.decisionId,
          artifactKind: decision.artifactId,
          evidenceRefs: decision.evidenceRefs,
          authority: "model_decision_receipt",
          terminalEligible: decision.textAnswerDraft.terminalEligible,
          createdAt: input.createdAt,
        }));
      }
      const narrativeState = decision.narrativeStateRef
        ? getStagePlayLiveSourceNarrativeState(decision.narrativeStateRef)
        : null;
      if (narrativeState) {
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_interpretation:${hashShort(narrativeState.narrativeStateId)}`,
          rowKind: "interpretation",
          title: "Interpretation",
          body: narrativeState.interpretedSituation.userRelevantMeaning,
          artifactId: narrativeState.narrativeStateId,
          artifactKind: narrativeState.artifactId,
          evidenceRefs: narrativeState.evidenceRefs,
          authority: "model_decision_receipt",
          createdAt: input.createdAt,
        }));
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_watch_next:${hashShort(narrativeState.narrativeStateId)}`,
          rowKind: "watch_next",
          title: "Watch next",
          body: [
            narrativeState.watchNext.targets.length > 0
              ? `Targets: ${narrativeState.watchNext.targets.join(", ")}.`
              : "Targets: next compact source summary.",
            `Reason: ${narrativeState.watchNext.reason}`,
          ].join("\n"),
          artifactId: narrativeState.narrativeStateId,
          artifactKind: narrativeState.artifactId,
          evidenceRefs: narrativeState.evidenceRefs,
          authority: "model_decision_receipt",
          createdAt: input.createdAt,
        }));
        if (narrativeState.prediction) {
          rows.push(makeWakeTranscriptRow({
            rowId: `wake_prediction:${hashShort(narrativeState.narrativeStateId)}`,
            rowKind: "prediction",
            title: "Prediction",
            body: [
              narrativeState.prediction.text,
              `Horizon: ${narrativeState.prediction.horizon}. Confidence: ${Math.round(narrativeState.prediction.confidence * 100)}%.`,
              narrativeState.prediction.validationSignals.length > 0
                ? `Validation: ${narrativeState.prediction.validationSignals.join("; ")}.`
                : null,
            ].filter(Boolean).join("\n"),
            artifactId: narrativeState.narrativeStateId,
            artifactKind: narrativeState.artifactId,
            evidenceRefs: narrativeState.evidenceRefs,
            authority: "model_decision_receipt",
            createdAt: input.createdAt,
          }));
        }
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_narrative_state:${hashShort(narrativeState.narrativeStateId)}`,
          rowKind: "narrative_state",
          title: "Narrative state",
          body: narrativeState.narrativeStateId,
          artifactId: narrativeState.narrativeStateId,
          artifactKind: narrativeState.artifactId,
          evidenceRefs: narrativeState.evidenceRefs,
          authority: "tool_evidence",
          createdAt: input.createdAt,
        }));
      }
      if (decision.voiceCalloutDraft) {
        const requiresConfirmation =
          decision.voicePolicy?.requiresConfirmation === true ||
          decision.voiceCalloutDraft.requiresConfirmation === true;
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_voice_callout:${hashShort(decision.decisionId)}`,
          rowKind: "voice_callout_request",
          title: "Voice callout draft",
          body: requiresConfirmation
            ? `${decision.voiceCalloutDraft.text}\nAwaiting confirmation before voice delivery.`
            : decision.voiceCalloutDraft.text,
          artifactId: decision.decisionId,
          artifactKind: decision.artifactId,
          evidenceRefs: decision.evidenceRefs,
          authority: "model_decision_receipt",
          createdAt: input.createdAt,
        }));
      }
      if (voiceReceipt?.requestedTool && voiceReceipt.status !== "confirmation_required") {
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_voice_tool_call:${hashShort(voiceReceipt.receiptId)}`,
          rowKind: "voice_tool_call",
          title: "Voice tool call",
          body: `${voiceReceipt.requestedTool.toolName}: ${voiceReceipt.voiceCalloutDraft?.text ?? ""}`.trim(),
          toolName: voiceReceipt.requestedTool.toolName,
          artifactId: voiceReceipt.decisionId,
          artifactKind: decision.artifactId,
          evidenceRefs: voiceReceipt.evidenceRefs,
          authority: "model_decision_receipt",
          createdAt: input.createdAt,
        }));
      }
      if (voiceReceipt) {
        const receiptBody = [
          voiceReceipt.status,
          voiceReceipt.delivery?.message,
          voiceReceipt.delivery?.artifactRef ? `artifact: ${voiceReceipt.delivery.artifactRef}` : null,
        ].filter(Boolean).join(" - ");
        rows.push(makeWakeTranscriptRow({
          rowId: `wake_voice_receipt:${hashShort(voiceReceipt.receiptId)}`,
          rowKind: voiceReceipt.status === "confirmation_required" ? "voice_callout_request" : "voice_receipt",
          title: voiceReceipt.status === "confirmation_required" ? "Voice confirmation required" : "Voice receipt",
          body: receiptBody || voiceReceipt.status,
          toolName: voiceReceipt.requestedTool?.toolName ?? null,
          artifactId: voiceReceipt.receiptId,
          artifactKind: voiceReceipt.artifactId,
          evidenceRefs: voiceReceipt.evidenceRefs,
          authority: voiceReceipt.status === "failed" ? "blocked" : "tool_evidence",
          createdAt: input.createdAt,
        }));
      }
      rows.push(makeWakeTranscriptRow({
        rowId: `wake_loop_state:${hashShort(decision.decisionId)}`,
        rowKind: "loop_state",
        title: "Loop state",
        body: decision.nextLoopState === "armed_for_next_summary"
          ? "Armed for the next live-source update."
          : decision.nextLoopState,
        artifactId: decision.decisionId,
        artifactKind: decision.artifactId,
        evidenceRefs: decision.evidenceRefs,
        createdAt: input.createdAt,
      }));
    }
    return rows;
  }
  for (const decisionId of input.decisionIds) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_agent_decision:${hashShort(decisionId)}`,
      rowKind: "agent_decision",
      title: "Agent decision",
      body: `Decision recorded: ${decisionId}`,
      toolName: "live_env.record_live_source_mail_decision",
      artifactId: decisionId,
      artifactKind: "stage_play_live_source_mail_decision",
      evidenceRefs: uniqueStrings([decisionId, ...input.evidenceRefs]),
      authority: "model_decision_receipt",
      createdAt: input.createdAt,
    }));
  }
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_loop_state:${hashShort(input.wakeResult.wakeResultId)}`,
    rowKind: "loop_state",
    title: "Loop state",
    body: "Wake result completed.",
    artifactId: input.wakeResult.wakeResultId,
    artifactKind: input.wakeResult.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  return rows;
};

const buildNonTerminalWakeTranscriptRows = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  immersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  predictionValidation?: StagePlayLiveSourcePredictionValidationV1 | null;
  processedPacket?: StagePlayProcessedMailPacketV1 | null;
  microReasonerRuns?: StagePlayMicroReasonerRunV1[];
  budgetState?: LiveSourceBudgetStateV1 | null;
  evidenceRefs: string[];
  createdAt: string;
}): DurableWakeTranscriptRow[] => {
  const rows: DurableWakeTranscriptRow[] = [];
  const failureReason = input.wakeResult.failedReason ?? input.wakeResult.skippedReason ?? "wake did not complete";
  const blockedTitle = /^mail_wake_ask_turn_timeout:/i.test(failureReason)
    ? "Wake Ask timed out"
    : /^wake_preflight_blocked:/i.test(failureReason)
      ? "Wake preflight blocked"
      : failureReason === "mail_wake_decision_missing"
        ? "Wake decision missing"
        : "Wake blocked";
  const blockedBody = /^mail_wake_ask_turn_timeout:/i.test(failureReason)
    ? `${failureReason}. The bounded mail batch was retained for retry; no model-reviewed decision was recorded.`
    : /^wake_preflight_blocked:/i.test(failureReason)
      ? `${failureReason}. Ask was not called; the bounded mail batch was retained for retry.`
      : failureReason === "mail_wake_decision_missing"
        ? "Ask returned without a stage_play_live_source_mail_decision receipt. The batch was not treated as answered."
        : `${input.wakeResult.status}: ${failureReason}`;
  for (const item of input.mailBatch) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_mail_received:${hashShort([input.wake.wakeRequestId, item.mailId])}`,
      rowKind: "mail_received",
      title: "Observation mail",
      body: `Visual summary received. Preview: ${item.summary.preview}`,
      artifactId: item.mailId,
      artifactKind: item.artifactId,
      evidenceRefs: item.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.immersionState) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_immersion_update:${hashShort(input.immersionState.immersionStateId)}`,
      rowKind: "interpretation_state",
      title: "Immersion state",
      body: [
        `Identity: ${input.immersionState.sourceIdentity.label} (${Math.round(input.immersionState.sourceIdentity.confidence * 100)}%).`,
        `Activity: ${input.immersionState.currentActivity}. Salience: ${input.immersionState.salience.level}.`,
        input.immersionState.changedFacts.length > 0
          ? `Deltas: ${input.immersionState.changedFacts.slice(0, 4).join("; ")}.`
          : "Deltas: no new heuristic deltas.",
      ].join("\n"),
      toolName: "live_env.update_live_source_immersion_state",
      artifactId: input.immersionState.immersionStateId,
      artifactKind: input.immersionState.artifactId,
      evidenceRefs: input.immersionState.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.predictionValidation) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_prediction_validation:${hashShort(input.predictionValidation.validationId)}`,
      rowKind: "prediction_check",
      title: "Prediction validation",
      body: [
        `${input.predictionValidation.result}; recommended next ${input.predictionValidation.recommendedNext}.`,
        input.predictionValidation.newSignals.length > 0
          ? `New: ${input.predictionValidation.newSignals.slice(0, 4).join("; ")}.`
          : null,
      ].filter(Boolean).join("\n"),
      toolName: "live_env.validate_live_source_prediction",
      artifactId: input.predictionValidation.validationId,
      artifactKind: input.predictionValidation.artifactId,
      evidenceRefs: input.predictionValidation.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  if (input.processedPacket) {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_processed_packet:${hashShort(input.processedPacket.packetId)}`,
      rowKind: "processed_mail_packet",
      title: "Processed mail packet",
      body: [
        `${input.processedPacket.resolutionState}; recommended ${input.processedPacket.recommendedNext}.`,
        `Salience: ${input.processedPacket.salience.level}${input.processedPacket.salience.voiceCandidate ? " (voice candidate)" : ""}.`,
        input.processedPacket.observedFacts.length > 0
          ? `Observed: ${input.processedPacket.observedFacts.slice(0, 3).map((fact) => clipPromptText(fact, 120)).join("; ")}.`
          : null,
      ].filter(Boolean).join("\n"),
      toolName: "live_env.process_live_source_mail_packet",
      artifactId: input.processedPacket.packetId,
      artifactKind: input.processedPacket.artifactId,
      evidenceRefs: input.processedPacket.evidenceRefs,
      createdAt: input.createdAt,
    }));
  }
  rows.push(...buildWakeMicroReasonerTranscriptRows({
    microReasonerRuns: input.microReasonerRuns,
    createdAt: input.createdAt,
  }));
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_requested:${hashShort(input.wake.wakeRequestId)}`,
    rowKind: "mail_wake_requested",
    title: "Wake requested",
    body: `${input.wake.mailIds.length} live-source mail item(s) queued for Helix Ask wake because ${microReasonerWakeReason({
      processedPacket: input.processedPacket,
      microReasonerRuns: input.microReasonerRuns,
    })}.`,
    artifactId: input.wake.wakeRequestId,
    artifactKind: input.wake.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  if (input.budgetState) {
    rows.push(buildBudgetTranscriptRow(input.budgetState, input.createdAt));
  }
  if (input.wakeResult.status === "deferred_for_pressure") {
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_deferred:${hashShort(input.wakeResult.wakeResultId)}`,
      rowKind: "mail_wake_deferred",
      title: "Wake deferred",
      body: `Deferred for pressure: ${input.wakeResult.failedReason ?? "runtime pressure"}. Mailbox remains armed for retry.`,
      artifactId: input.wakeResult.wakeResultId,
      artifactKind: input.wakeResult.artifactId,
      evidenceRefs: input.evidenceRefs,
      authority: "blocked",
      createdAt: input.createdAt,
    }));
    rows.push(makeWakeTranscriptRow({
      rowId: `wake_loop_state:${hashShort(input.wakeResult.wakeResultId)}`,
      rowKind: "loop_state",
      title: "Loop state",
      body: "Mailbox remains armed; unread mail is retained for the next wake.",
      artifactId: input.wakeResult.wakeResultId,
      artifactKind: input.wakeResult.artifactId,
      evidenceRefs: input.evidenceRefs,
      createdAt: input.createdAt,
    }));
    return rows;
  }
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_blocked:${hashShort(input.wakeResult.wakeResultId)}`,
    rowKind: "blocked",
    title: blockedTitle,
    body: blockedBody,
    artifactId: input.wakeResult.wakeResultId,
    artifactKind: input.wakeResult.artifactId,
    evidenceRefs: input.evidenceRefs,
    authority: "blocked",
    createdAt: input.createdAt,
  }));
  rows.push(makeWakeTranscriptRow({
    rowId: `wake_loop_state:${hashShort(input.wakeResult.wakeResultId)}`,
    rowKind: "loop_state",
    title: "Loop state",
    body: "Wake did not complete; mailbox remains available for a later check and no final answer authority was granted.",
    artifactId: input.wakeResult.wakeResultId,
    artifactKind: input.wakeResult.artifactId,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
  }));
  return rows;
};

const recordNonTerminalWakeTranscript = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  wakeResult: StagePlayLiveSourceMailWakeResultV1;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  fastLayer?: {
    immersionState: StagePlayLiveSourceImmersionStateV1;
    predictionValidation: StagePlayLiveSourcePredictionValidationV1;
    processedPacket: StagePlayProcessedMailPacketV1;
    microReasonerRuns: StagePlayMicroReasonerRunV1[];
  } | null;
  action?: LiveSourceBudgetActionV1;
  retainedMailCount?: number | null;
  evidenceRefs: string[];
  createdAt: string;
}): StagePlayLiveSourceMailWakeResultV1 => {
  const budgetReceipt = recordWakeBudgetReceipt({
    wake: input.wake,
    wakeResult: input.wakeResult,
    action: input.action,
    retainedMailCount: input.retainedMailCount ?? 0,
    evidenceRefs: input.evidenceRefs,
    pressureReason: input.wakeResult.status === "deferred_for_pressure" ? input.wakeResult.failedReason ?? null : null,
    createdAt: input.createdAt,
  });
  const transcriptEntries = recordStagePlayLiveSourceMailTranscriptEntries({
    threadId: input.wake.threadId,
    roomId: input.wake.roomId ?? null,
    environmentId: input.wake.environmentId ?? null,
    wakeRequestId: input.wake.wakeRequestId,
    wakeResultId: budgetReceipt.wakeResult.wakeResultId,
    askTurnId: budgetReceipt.wakeResult.askTurnId ?? null,
    decisionIds: budgetReceipt.wakeResult.decisionIds,
    mailIds: input.wake.mailIds,
    sourceIds: input.wake.sourceIds,
    rows: buildNonTerminalWakeTranscriptRows({
      ...input,
      wakeResult: budgetReceipt.wakeResult,
      immersionState: input.fastLayer?.immersionState ?? null,
      predictionValidation: input.fastLayer?.predictionValidation ?? null,
      processedPacket: input.fastLayer?.processedPacket ?? null,
      microReasonerRuns: input.fastLayer?.microReasonerRuns ?? [],
      budgetState: budgetReceipt.budgetState,
      evidenceRefs: uniqueStrings([...input.evidenceRefs, budgetReceipt.budgetState.budgetStateId]),
    }),
    evidenceRefs: budgetReceipt.wakeResult.evidenceRefs,
    causalTrace: budgetReceipt.wakeResult.causalTrace ?? budgetReceipt.budgetState.causalTrace ?? input.wake.causalTrace,
    createdAt: input.createdAt,
  });
  return {
    ...budgetReceipt.wakeResult,
    evidenceRefs: uniqueStrings([
      ...budgetReceipt.wakeResult.evidenceRefs,
      budgetReceipt.budgetState.budgetStateId,
      ...transcriptEntries.map((entry) => entry.entryId),
    ]),
  };
};

const buildWakePrompt = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  activeInterpreterProfile: StagePlayLiveSourceInterpreterProfileV1 | null;
  activeCriterionLedger: StagePlayLiveSourceInterpreterProfileCriterionLedgerV1[];
  mailBatch: StagePlayLiveSourceMailItemV1[];
  priorDecisions: StagePlayLiveSourceMailDecisionV1[];
  latestNarrativeState: StagePlayLiveSourceNarrativeStateV1 | null;
  latestImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  predictionValidation?: StagePlayLiveSourcePredictionValidationV1 | null;
  processedPacket?: StagePlayProcessedMailPacketV1 | null;
  taskQueueSnapshot: StagePlayLiveSourceTaskQueueSnapshotV1 | null;
  conversationContextPack: StagePlayLiveSourceConversationContextPackV1 | null;
  heldCallouts: StagePlayHeldCalloutV1[];
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
  retainedMailCount?: number;
}): string => {
  const objective = input.policy?.objectiveText ?? "Read the live-source mailbox and decide what to do with this unread source update batch.";
  const decisionPolicy = input.policy?.decisionPolicyPrompt ?? "If there is no user-facing change, record wait_for_next_summary. If there is a meaningful user-facing change, draft a concise text answer.";
  const interpretationMode = input.policy?.interpretationMode ?? "latest_scene_answer";
  const mailProcessingMode = input.policy?.mailProcessingMode ?? "latest_only";
  const outputCadence = input.policy?.outputCadence ?? "every_batch";
  const activeTaskKind = activeTaskKindFromSnapshot(input.taskQueueSnapshot) ?? inferredTaskKindFromLiveReceipts({
    immersionState: input.latestImmersionState ?? null,
    predictionValidation: input.predictionValidation ?? null,
    processedPacket: input.processedPacket ?? null,
  });
  const activeUserPrompt = hasActiveUserPromptContext(input.conversationContextPack);
  return [
    "Continuing live-source watch job:",
    objective,
    `Watch policy ref: ${input.policy?.policyId ?? "none"}`,
    `Watch job ref: ${input.policy?.jobId ?? input.wake.jobId ?? "none"}`,
    `Interpretation mode: ${interpretationMode}`,
    `Mail processing mode: ${mailProcessingMode}`,
    `Output cadence: ${outputCadence}`,
    `Wake batch size for this policy: ${policyAwareWakeAskBatchLimit(input.policy)}`,
    `Current task: ${activeTaskKind ?? "mail_batch_interpretation"}`,
    `Active user prompt context: ${activeUserPrompt}`,
    "",
    "Decision policy:",
    decisionPolicy,
    "",
    "Active interpreter profile:",
    formatActiveInterpreterProfile(input.activeInterpreterProfile),
    "",
    "Active criterion ledger:",
    formatActiveCriterionLedger(input.activeCriterionLedger),
    "",
    "Interpreter profile instructions:",
    "1. Preserve observed facts from the mail summaries.",
    "2. Compare observed facts against the active interpreter profile when one exists.",
    "3. Do not overwrite observations with profile assumptions.",
    "4. State matched and suppressed criteria when a profile is active.",
    "5. Use the criterion ledger to distinguish newly matched, still matched, resolved, contradicted, and uncertain profile criteria.",
    "6. If uncertain, record uncertainty or request more evidence.",
    "7. Use profile comparison to choose wait, interpretation, text, voice, or checkpoint.",
    "",
    "The mail is perturbation evidence for this continuing job.",
    "Use the processed mail packet as the primary compact evidence packet. Use raw mail summaries below only to audit or clarify the packet.",
    "Use live_env.read_processed_live_source_mail first. Fall back to live_env.read_live_source_mail only if no processed packet exists, then record the decision with live_env.record_live_source_mail_decision.",
    "Read only the mail refs listed below for this wake request; do not widen to newer mailbox items in this turn.",
    "Treat the listed mail refs as one chronological observation window from the same live source.",
    "Do not claim visual evidence is unavailable when the unread mail refs or compact summaries below exist.",
    "Decision mode guidance:",
    "- latest_scene_answer: non-empty mail should normally produce draft_text_answer.",
    "- batch_interpretation: non-empty mail should normally produce record_interpretation.",
    "- salience_watch: compare to prior state and wait unless the policy salience criteria are matched.",
    "- prediction_watch: produce record_interpretation with prediction and validation signals.",
    "- voice_callout_watch: request_voice_callout only if policy allows voice and salience criteria are matched.",
    "- voice_commentary_watch: maintain interpretation over micro-batches, but only emit voice when output cadence and voice policy allow it.",
    "Mail processing mode guidance:",
    "- latest_only: treat the newest mail as the primary scene answer context.",
    "- chronological_batch: preserve time order and describe how the batch evolves.",
    "- micro_batch: group nearby mail into short chronological segments before synthesizing.",
    "- per_mail: handle each mail item as its own observation, preserving chronology.",
    "- salience_window: scan the batch for policy-relevant changes and suppress routine updates.",
    "Output cadence guidance:",
    "- every_batch: produce the configured output for each non-empty batch.",
    "- only_salient: wait unless salience, risk, opportunity, or user-target criteria match.",
    "- voice_only_salient: text/narrative may update internally, but voice callouts require salience and voice permission.",
    "- manual_only: record state without user-facing output unless the user explicitly asks.",
    "- If current task is immediate_prediction_check: use live_env.compare_live_source_prediction when prior prediction exists; otherwise use live_env.predict_live_source_immediate.",
    "- If current task is prediction_error_review: use live_env.compare_live_source_prediction before deciding whether to wait, interpret, draft text, or request a callout.",
    "- If current task is mail_batch_interpretation: use live_env.project_live_source_narrative and record_interpretation.",
    "- If current task is voice_callout_candidate: confirm salience and voice policy before requesting voice callout; if confirmationRequired is true, draft only.",
    "- If current task is voice_callout_candidate: the trigger is live-source salience, not final-answer timing. Decide between request_voice_callout, draft_text_answer, and wait_for_next_summary.",
    "- If current task is long_horizon_projection: use live_env.project_live_source_narrative unless an active user prompt or urgent voice candidate has priority.",
    "- If active user prompt context is true: answer the user first, and merge or recheck held callouts instead of speaking an older warning separately.",
    "- Use draft_text_answer when the standing policy or current prompt asks what the latest mail shows or asks for a one-sentence scene answer.",
    "- Use record_interpretation when the task asks what is happening, what changed, what should be watched next, or when the mail should update the continuing story without a direct answer.",
    "- If the policy asks to interpret, compare, explain what is happening, predict, or say what to watch next, choose record_interpretation.",
    "- When choosing record_interpretation: include a concise batch interpretation, update the running story, state what changed if anything, state uncertainties, state watch-next targets, optionally include a prediction and validation signals, then set nextLoopState = armed_for_next_summary.",
    "- If a prior prediction is listed below, compare the unread mail batch to its validation signals. Mention support, contradiction, or pending validation in meaningfulChanges. Do not calculate a score yet.",
    "- Use wait_for_next_summary only when the batch is empty or the standing policy suppresses harmless/non-salient changes.",
    "- Use request_voice_callout only when the policy allows voice and the update meets the policy's salience/urgency threshold.",
    "",
    "Importance criteria:",
    formatCriteria(input.policy?.importanceCriteria ?? []),
    "",
    "Suppress criteria:",
    formatCriteria(input.policy?.suppressCriteria ?? []),
    "",
    "Voice policy:",
    formatVoicePolicy(input.voicePolicy),
    "Voice decision rules:",
    "- request_voice_callout requires voiceCalloutDraft.text.",
    "- If voiceEnabled is false, draft text only and do not request a voice tool.",
    "- If requiresConfirmation is true, produce the callout draft and wait for confirmation; do not request a voice tool.",
    "- If allowedNow is true and speech is appropriate, record the decision first and request the separate voice delivery tool from that decision.",
    "- Live-source voice must come from a model-reviewed mail decision. Visual capture, prediction receipts, narrative projection receipts, and task queue receipts do not speak automatically.",
    "- Minecraft voice candidates include player on fire, hostile mob, lava, fall, low health, and optionally rare resources if the active profile says to call out opportunities.",
    "- Suppress voice for stable chest/inventory frames, repeated interior/base frames, routine walking, and low-salience summaries unless the user explicitly requested narration/commentary.",
    "",
    "Voice candidate receipt:",
    formatVoiceCandidateReceipt({
      immersionState: input.latestImmersionState ?? null,
      predictionValidation: input.predictionValidation ?? null,
      processedPacket: input.processedPacket ?? null,
    }),
    "",
    "Processed mail packet:",
    formatProcessedMailPacket(input.processedPacket ?? null),
    "",
    "Task queue state:",
    formatTaskQueueSnapshot(input.taskQueueSnapshot),
    "",
    "Latest narrative state:",
    formatLatestNarrativeState(input.latestNarrativeState),
    "",
    "Latest immersion state:",
    formatLatestImmersionState(input.latestImmersionState ?? null),
    "",
    "Prediction validation receipt:",
    formatPredictionValidation(input.predictionValidation ?? null),
    "",
    "Prior prediction:",
    formatPriorPrediction(input.latestNarrativeState),
    "",
    "Latest prediction error receipt:",
    formatLatestPredictionErrorReceipt(input.latestNarrativeState),
    "",
    "Conversation steering context:",
    formatConversationContextPack(input.conversationContextPack),
    "",
    "Held callouts:",
    formatHeldCallouts(input.heldCallouts),
    "",
    "Unread mail batch:",
    `Wake request: ${input.wake.wakeRequestId}`,
    `Batch size: ${input.wake.mailIds.length}`,
    `Retained unread mail outside this Ask batch: ${Math.max(0, input.retainedMailCount ?? 0)}`,
    `Mail refs: ${input.wake.mailIds.join(", ")}`,
    `Source refs: ${input.wake.sourceIds.join(", ")}`,
    formatMailBatch(input.mailBatch, input.wake),
    "",
    "Prior decisions:",
    formatPriorDecisions(input.priorDecisions, input.policy),
    "",
    "Choose one:",
    "- wait_for_next_summary",
    "- record_interpretation",
    "- draft_text_answer",
    "- request_voice_callout",
    "- request_more_evidence",
    "- request_stage_play_checkpoint",
    "- fail_closed",
  ].join("\n");
};

const formatCompactMicroReasonerFinding = (
  runs: StagePlayMicroReasonerRunV1[],
): string => {
  const preferred = runs
    .filter((run) =>
      run.role === "decision_selector" ||
      run.role === "hypothesis_arbiter" ||
      run.role === "voice_callout_drafter" ||
      run.role === "packet_composer" ||
      run.role === "hypothesis_generator" ||
      run.role === "axiom_extractor" ||
      run.role === "effort_estimator" ||
      run.role === "prediction_validator" ||
      run.role === "salience_scorer"
    )
    .slice(-4);
  const selected = preferred.length > 0 ? preferred : runs.slice(-2);
  if (selected.length === 0) return "- none recorded";
  return selected.map((run) => [
    `- ${run.runId}`,
    `  role: ${run.role}`,
    run.selectedDecision ? `  selected_decision: ${run.selectedDecision}` : null,
    run.recommendedNextTool ? `  next_tool: ${run.recommendedNextTool}` : null,
    run.salienceLevel ? `  salience: ${run.salienceLevel}${run.voiceCandidate ? " (voice candidate)" : ""}` : null,
    run.outputPreview ? `  finding: ${clipPromptText(run.outputPreview, 220)}` : null,
  ].filter(Boolean).join("\n")).join("\n");
};

const buildCompactWakePrompt = (input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  policy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  mailBatch: StagePlayLiveSourceMailItemV1[];
  priorDecisions: StagePlayLiveSourceMailDecisionV1[];
  latestNarrativeState: StagePlayLiveSourceNarrativeStateV1 | null;
  latestImmersionState: StagePlayLiveSourceImmersionStateV1;
  predictionValidation: StagePlayLiveSourcePredictionValidationV1;
  processedPacket: StagePlayProcessedMailPacketV1;
  microReasonerRuns: StagePlayMicroReasonerRunV1[];
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
  retainedMailCount?: number;
}): string => {
  const latestMail = input.mailBatch.at(-1) ?? null;
  const latestDecision = input.priorDecisions.at(-1) ?? null;
  const phaseRequirement =
    input.processedPacket.recommendedNext === "request_voice_callout"
      ? "phase requirement: record live_env.record_live_source_mail_decision first; then request live_env.request_interim_voice_callout; do not terminal-answer until voice receipt/hold/block exists."
      : input.processedPacket.recommendedNext === "wait_for_next_summary"
        ? "phase requirement: do not wake Ask for routine mail; record/keep wait_for_next_summary and retain observer backlog."
        : "phase requirement: record live_env.record_live_source_mail_decision before terminal synthesis.";
  return [
    "Continuing live-source watch job compact Ask handoff:",
    input.policy?.objectiveText ?? "Watch the active visual source through micro-reasoner findings.",
    `Watch policy ref: ${input.policy?.policyId ?? "none"}`,
    `Watch job ref: ${input.policy?.jobId ?? input.wake.jobId ?? "none"}`,
    `Wake request: ${input.wake.wakeRequestId}`,
    `Retained unread mail outside this Ask batch: ${Math.max(0, input.retainedMailCount ?? 0)}`,
    "",
    "Use this compact grammar only:",
    "1. Treat the processed packet as primary evidence.",
    "2. Use raw mail only as a short audit trail.",
    "3. Do not widen to newer mailbox items.",
    "4. Receipts are evidence, not the final answer.",
    `5. ${phaseRequirement}`,
    "",
    "Processed packet:",
    `- packet_id: ${input.processedPacket.packetId}`,
    `  recommended_next: ${input.processedPacket.recommendedNext}`,
    `  salience: ${input.processedPacket.salience.level}${input.processedPacket.salience.voiceCandidate ? " (voice candidate)" : ""}`,
    input.processedPacket.salience.calloutDraft ? `  callout_candidate: ${clipPromptText(input.processedPacket.salience.calloutDraft, 180)}` : null,
    input.processedPacket.observedFacts.length > 0
      ? `  observed: ${input.processedPacket.observedFacts.slice(0, 4).map((fact) => clipPromptText(fact, 150)).join(" | ")}`
      : null,
    input.processedPacket.changedFacts.length > 0
      ? `  changed: ${input.processedPacket.changedFacts.slice(0, 4).map((fact) => clipPromptText(fact, 130)).join(" | ")}`
      : null,
    input.processedPacket.effortEstimate
      ? `  effort: ${input.processedPacket.effortEstimate.currentEffort}; confidence ${input.processedPacket.effortEstimate.confidence.toFixed(2)}`
      : null,
    input.processedPacket.axioms?.axioms.length
      ? `  axioms: ${input.processedPacket.axioms.axioms.slice(0, 4).join(" | ")}`
      : null,
    input.processedPacket.hypotheses?.length
      ? `  hypotheses: ${input.processedPacket.hypotheses.slice(0, 3).map((hypothesis) => `${hypothesis.label}:${hypothesis.confidence.toFixed(2)}`).join(" | ")}`
      : null,
    input.processedPacket.arbiter
      ? `  arbiter: ${input.processedPacket.arbiter.recommendedNext}; wake ${input.processedPacket.arbiter.wakeAsk ? "yes" : "no"}; ${clipPromptText(input.processedPacket.arbiter.reason, 160)}`
      : null,
    input.processedPacket.watchNext.length > 0
      ? `  watch_next: ${input.processedPacket.watchNext.slice(0, 6).join(" | ")}`
      : null,
    "",
    "Latest micro-reasoner finding:",
    formatCompactMicroReasonerFinding(input.microReasonerRuns),
    "",
    "Prediction/immersion:",
    `- prediction_validation: ${input.predictionValidation.result}; recommended ${input.predictionValidation.recommendedNext}`,
    `- activity: ${clipPromptText(input.latestImmersionState.currentActivity, 180)}`,
    input.latestImmersionState.prediction ? `- latest_prediction: ${clipPromptText(input.latestImmersionState.prediction.text, 240)}` : null,
    "",
    "Latest unresolved/prior decision:",
    latestDecision
      ? [
          `- ${latestDecision.decisionId}`,
          `  decision: ${latestDecision.decision}`,
          `  rationale: ${clipPromptText(latestDecision.rationalePreview, 220)}`,
        ].join("\n")
      : "- none recorded",
    "",
    "Short mailbox summary:",
    latestMail
      ? [
          `- latest_mail: ${latestMail.mailId}`,
          `  source: ${latestMail.sourceId}`,
          `  summary: ${clipPromptText(latestMail.summary.text || latestMail.summary.preview, 360)}`,
        ].join("\n")
      : "- compact mail unavailable",
    "",
    "Voice policy:",
    formatVoicePolicy(input.voicePolicy),
    "",
    "Required evidence refs:",
    uniqueStrings([
      input.wake.wakeRequestId,
      input.processedPacket.packetId,
      input.predictionValidation.validationId,
      input.latestImmersionState.immersionStateId,
      latestMail?.mailId,
      ...(latestMail?.evidenceRefs ?? []),
      ...input.processedPacket.microReasonerRunRefs.slice(-6),
    ]).slice(0, 32).map((ref) => `- ${ref}`).join("\n") || "- none",
    "",
    "Choose one:",
    "- wait_for_next_summary",
    "- record_interpretation",
    "- draft_text_answer",
    "- request_voice_callout",
    "- request_more_evidence",
    "- request_stage_play_checkpoint",
    "- fail_closed",
  ].filter((entry): entry is string => Boolean(entry)).join("\n");
};

const defaultAskTurnRunner = (baseUrl?: string): AskWakeTurnRunner =>
  async ({ prompt, threadId, evidenceRefs, wakeRequest }) => {
    const timeoutMs = wakeAskTurnTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${normalizeAskBaseUrl(baseUrl) ?? defaultAskBaseUrl()}/api/agi/ask/turn`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          question: prompt,
          prompt,
          sessionId: threadId,
          debug: true,
          evidence_refs: evidenceRefs,
          stage_play_live_source_mail_wake_request_id: wakeRequest.wakeRequestId,
        }),
      });
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(`mail_wake_ask_turn_timeout:${timeoutMs}`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      throw new Error(`mail_wake_ask_turn_failed:${response.status}`);
    }
    return await response.json() as AskWakeTurnResponse;
  };

const extractAskTurnId = (response: AskWakeTurnResponse): string | null =>
  readString(response.turn_id) ??
  readString(response.trace_id) ??
  readString(response.id);

const extractDecisionIds = (response: AskWakeTurnResponse): string[] => {
  const ledger = readArray(response.current_turn_artifact_ledger);
  const ids = ledger.flatMap((artifact): string[] => {
    const record = readRecord(artifact);
    const payload = readRecord(record?.payload);
    const observation = readRecord(payload?.observation);
    const observationIsMailDecision =
      readString(observation?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(observation?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    const payloadIsMailDecision =
      readString(payload?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(payload?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    if (!observationIsMailDecision && !payloadIsMailDecision) return [];
    return uniqueStrings([
      readString(observation?.decisionId),
      readString(payload?.decisionId),
      readString(payload?.decision_id),
    ]);
  });
  return uniqueStrings(ids);
};

const wakeAttemptBackoffMs = (attemptCount: number): number => {
  if (attemptCount <= 1) return 15_000;
  if (attemptCount === 2) return 30_000;
  if (attemptCount === 3) return 60_000;
  return 120_000;
};

const addMs = (iso: string, ms: number): string =>
  new Date(Date.parse(iso) + ms).toISOString();

const isPressure503 = (err: unknown): boolean =>
  /\b(?:mail_wake_ask_turn_failed:503|503)\b/i.test(err instanceof Error ? err.message : String(err));

const wakeMatchesScope = (
  wake: StagePlayLiveSourceMailWakeRequestV1,
  input: {
    threadId?: string | null;
    roomId?: string | null;
    environmentId?: string | null;
    jobId?: string | null;
  },
): boolean => {
  if (input.threadId && wake.threadId !== input.threadId) return false;
  if (input.roomId && wake.roomId !== input.roomId) return false;
  if (input.environmentId && wake.environmentId !== input.environmentId) return false;
  if (input.jobId && wake.jobId !== input.jobId) return false;
  return true;
};

export function queueMailWakeForUnreadItems(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  limit?: number;
  now?: string;
}): StagePlayLiveSourceMailWakeRequestV1 | null {
  const jobs = listStagePlayLiveSourceJobStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 10,
  });
  const activeJob = jobs.at(-1) ?? null;
  if (activeJob && (activeJob.status === "paused" || activeJob.status === "ended")) return null;
  const unread = listUnreadStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    limit: Math.max(MAX_MAIL_IDS_PER_WAKE_BATCH, input.limit ?? MAX_MAIL_IDS_PER_WAKE_BATCH),
  });
  const activeWakeMailIds = new Set(
    listStagePlayLiveSourceMailWakeRequests({
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: activeJob?.jobId ?? null,
      limit: 250,
    })
      .filter((wake) =>
        wake.status === "queued" ||
        wake.status === "running" ||
        wake.status === "failed_retryable" ||
        wake.status === "deferred_for_pressure"
      )
      .flatMap((wake) => wake.mailIds),
  );
  const unclaimed = unread.filter((item) => !activeWakeMailIds.has(item.mailId));
  if (unclaimed.length === 0) return null;
  const oldestSourceId = unclaimed[0].sourceId;
  const batchLimit = Math.max(1, Math.min(input.limit ?? MAX_MAIL_IDS_PER_WAKE_BATCH, MAX_MAIL_IDS_PER_WAKE_BATCH));
  const batch = unclaimed.filter((item) => item.sourceId === oldestSourceId).slice(0, batchLimit);
  if (batch.length === 0) return null;
  return queueStagePlayLiveSourceMailWakeRequest({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: activeJob?.jobId ?? null,
    mailIds: batch.map((item) => item.mailId),
    sourceIds: batch.map((item) => item.sourceId),
    reason: "unread_mail",
    evidenceRefs: batch.flatMap((item: StagePlayLiveSourceMailItemV1) => item.evidenceRefs),
    causalTraces: batch.map((item) => item.causalTrace),
    now: input.now,
  });
}

export async function runNextMailWakeRequest(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  baseUrl?: string;
  askTurnRunner?: AskWakeTurnRunner;
  voiceDeliveryRunner?: StagePlayLiveSourceVoiceDeliveryRunner | null;
  pressureCheck?: StagePlayMailWakePressureCheck | null;
  manualRun?: boolean;
  now?: string;
} = {}): Promise<StagePlayLiveSourceMailWakeResultV1 | null> {
  const now = input.now ?? new Date().toISOString();
  const scopedWakes = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    limit: 250,
  });
  const activeRunning = scopedWakes.filter((wake) =>
    wake.status === "running" &&
    wakeMatchesScope(wake, input)
  );
  for (const wake of activeRunning) {
    const lastAttemptMs = Date.parse(wake.lastAttemptAt ?? wake.updatedAt);
    const stale = Number.isFinite(lastAttemptMs) && Date.parse(now) - lastAttemptMs > STALE_RUNNING_WAKE_MS;
    if (stale && !wake.askTurnId) {
      markStagePlayMailWakeRetryable({
        wakeRequestId: wake.wakeRequestId,
        failureReason: "stale_running_wake",
        nextRetryAt: now,
        now,
      });
    }
  }
  const stillRunning = listStagePlayLiveSourceMailWakeRequests({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    status: "running",
    limit: 250,
  }).find((wake) => wakeMatchesScope(wake, input));
  if (stillRunning) return null;
  const selectedWake = (
    input.manualRun
      ? listStagePlayLiveSourceMailWakeRequests({
          threadId: input.threadId ?? null,
          roomId: input.roomId ?? null,
          environmentId: input.environmentId ?? null,
          jobId: input.jobId ?? null,
          limit: 250,
        }).filter((wake) =>
          wake.status === "queued" ||
          wake.status === "failed_retryable" ||
          wake.status === "deferred_for_pressure"
        )
      : listRunnableStagePlayLiveSourceMailWakeRequests({
          threadId: input.threadId ?? null,
          roomId: input.roomId ?? null,
          environmentId: input.environmentId ?? null,
          jobId: input.jobId ?? null,
          now,
          limit: 250,
      })
  ).at(0) ?? null;
  if (!selectedWake) return null;

  const selectedMailBatch = mailBatchForWake(selectedWake);
  const selectedPolicy = resolveActiveWatchPolicy({ wake: selectedWake, mailBatch: selectedMailBatch });
  const selectedBatchLimit = policyAwareWakeAskBatchLimit(selectedPolicy);
  const splitWake = splitStagePlayLiveSourceMailWakeRequestForAsk({
    wakeRequestId: selectedWake.wakeRequestId,
    maxMailIds: selectedBatchLimit,
    now,
  });
  const running = splitWake?.wake ?? selectedWake;
  const retainedMailCount = splitWake?.retainedMailIds.length ?? 0;
  const mailBatch = mailBatchForWake(running);
  const policy = resolveActiveWatchPolicy({ wake: running, mailBatch });
  const priorDecisions = priorDecisionsForWake(running, policy);
  const voicePolicy = voicePolicyFromWatchPolicy(policy);
  const latestNarrativeState = getLatestStagePlayLiveSourceNarrativeState({
    threadId: running.threadId,
    roomId: running.roomId ?? null,
    environmentId: running.environmentId ?? null,
    jobId: policy?.jobId ?? running.jobId ?? null,
    sourceId: mailBatch[0]?.sourceId ?? running.sourceIds[0] ?? null,
  });
  const activeInterpreterProfile = getActiveInterpreterProfileForJob({
    threadId: running.threadId,
    roomId: running.roomId ?? null,
    environmentId: running.environmentId ?? null,
    jobId: policy?.jobId ?? running.jobId ?? null,
    policyId: policy?.policyId ?? null,
    sourceKind: mailBatch[0]?.sourceKind ?? null,
  });
  const activeCriterionLedger = activeInterpreterProfile
    ? listStagePlayLiveSourceInterpreterProfileCriterionLedger({
        profileId: activeInterpreterProfile.profileId,
        jobId: policy?.jobId ?? running.jobId ?? null,
        policyId: policy?.policyId ?? null,
        limit: 24,
      })
    : [];
  const taskQueueSnapshot = getStagePlayLiveSourceTaskQueueSnapshot({
    threadId: running.threadId,
    roomId: running.roomId ?? null,
    environmentId: running.environmentId ?? null,
    jobId: policy?.jobId ?? running.jobId ?? null,
    limit: 8,
    now,
  });
  const conversationContextPack = buildStagePlayLiveSourceConversationContextPack({
    threadId: running.threadId,
    jobId: policy?.jobId ?? running.jobId ?? null,
    limit: 30,
    now,
  });
  const heldCallouts = listStagePlayHeldCallouts({
    threadId: running.threadId,
    jobId: policy?.jobId ?? running.jobId ?? null,
    limit: 8,
  });
  let evidenceRefs = uniqueStrings([
    ...running.evidenceRefs,
    ...running.mailIds,
    ...running.sourceIds,
    ...(policy ? [policy.policyId, policy.jobId, ...policy.evidenceRefs, ...policy.priorAnswerRefs, ...policy.priorDecisionRefs] : []),
    activeInterpreterProfile?.profileId,
    ...(activeInterpreterProfile?.evidenceRefs ?? []),
    ...activeCriterionLedger.map((ledger) => ledger.ledgerId),
    latestNarrativeState?.narrativeStateId,
    ...taskQueueSnapshot.evidenceRefs,
    conversationContextPack.contextPackId,
    ...conversationContextPack.evidenceRefs,
    ...heldCallouts.flatMap((callout) => [callout.calloutId, ...callout.evidenceRefs]),
    ...mailBatch.flatMap((item) => item.evidenceRefs),
    ...priorDecisions.flatMap((decision) => [decision.decisionId, ...decision.evidenceRefs]),
  ]);
  const fastLayer = buildWakeFastLayer({
    wake: running,
    policy,
    activeInterpreterProfile,
    mailBatch,
    now,
    manualRun: input.manualRun,
  });
  evidenceRefs = uniqueStrings([
    ...evidenceRefs,
    fastLayer.immersionState.immersionStateId,
    fastLayer.predictionValidation.validationId,
    fastLayer.processedPacket.packetId,
    ...(fastLayer.immersionState.evidenceRefs ?? []),
    ...(fastLayer.predictionValidation.evidenceRefs ?? []),
    ...(fastLayer.processedPacket.evidenceRefs ?? []),
  ]);
  const taskNeedsSlowAsk = Boolean(activeTaskKindFromSnapshot(taskQueueSnapshot));
  if (!fastLayer.shouldRunSlowAsk && !taskNeedsSlowAsk) {
    const runningAttempt = markStagePlayMailWakeRunning(running.wakeRequestId, now) ?? running;
    const decision = recordLiveSourceMailDecisionForAsk({
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      mailIds: running.mailIds,
      decision: "wait_for_next_summary",
      rationalePreview: [
        "Fast live-source layer updated immersion state and validated the prior prediction.",
        `Slow Ask was skipped because ${fastLayer.slowAskReason}.`,
        `Processed packet: ${fastLayer.processedPacket.packetId}.`,
        `Prediction validation: ${fastLayer.predictionValidation.result}; salience: ${fastLayer.immersionState.salience.level}.`,
      ].join(" "),
      nextLoopState: "armed_for_next_summary",
      interpreterProfileRef: activeInterpreterProfile?.profileId ?? null,
      observedFacts: fastLayer.immersionState.currentSceneFacts,
      inferredMeaning: fastLayer.immersionState.changedFacts,
      mailCoverage: {
        readMailIds: running.mailIds,
        interpretedMailIds: [],
        compressedMailIds: running.mailIds.length > 1 ? running.mailIds : [],
        skippedMailIds: [],
        mode: policy?.mailProcessingMode ?? (running.mailIds.length > 1 ? "micro_batch" : "latest_only"),
        reason: "Fast layer updated immersion and prediction validation; slow Ask was not admitted for this non-salient batch.",
      },
      evidenceRefs: uniqueStrings([
        ...evidenceRefs,
        fastLayer.immersionState.immersionStateId,
        fastLayer.predictionValidation.validationId,
        fastLayer.processedPacket.packetId,
      ]),
      modelReviewed: false,
      now,
    });
    const completed = markStagePlayMailWakeCompleted({
      wakeRequestId: running.wakeRequestId,
      askTurnId: null,
      decisionIds: [decision.decisionId],
      evidenceRefs,
      now,
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "completed",
      askTurnId: null,
      decisionIds: [decision.decisionId],
      evidenceRefs: uniqueStrings([
        ...evidenceRefs,
        decision.decisionId,
        fastLayer.immersionState.immersionStateId,
        fastLayer.predictionValidation.validationId,
        fastLayer.processedPacket.packetId,
      ]),
      skippedReason: "fast_layer_wait_for_next_summary",
      createdAt: now,
    });
    const budgetReceipt = recordWakeBudgetReceipt({
      wake: completed ?? runningAttempt,
      wakeResult,
      action: retainedMailCount > 0 ? "batched" : "processed",
      reason: retainedMailCount > 0 ? "fast_layer_wait_batch_split" : "fast_layer_wait_for_next_summary",
      processedMailCount: running.mailIds.length,
      retainedMailCount,
      evidenceRefs: wakeResult.evidenceRefs,
      createdAt: wakeResult.createdAt,
    });
    const transcriptRows = buildDurableWakeTranscriptRows({
      wake: completed ?? runningAttempt,
      wakeResult: budgetReceipt.wakeResult,
      mailBatch,
      priorNarrativeState: latestNarrativeState,
      immersionState: fastLayer.immersionState,
      predictionValidation: fastLayer.predictionValidation,
      processedPacket: fastLayer.processedPacket,
      microReasonerRuns: fastLayer.microReasonerRuns,
      slowAskRan: false,
      decisionIds: [decision.decisionId],
      budgetState: budgetReceipt.budgetState,
      evidenceRefs: uniqueStrings([
        ...budgetReceipt.wakeResult.evidenceRefs,
        budgetReceipt.budgetState.budgetStateId,
      ]),
      createdAt: budgetReceipt.wakeResult.createdAt,
    });
    const transcriptEntries = recordStagePlayLiveSourceMailTranscriptEntries({
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      wakeRequestId: running.wakeRequestId,
      wakeResultId: budgetReceipt.wakeResult.wakeResultId,
      askTurnId: null,
      decisionIds: [decision.decisionId],
      mailIds: running.mailIds,
      sourceIds: running.sourceIds,
      rows: transcriptRows,
      evidenceRefs: uniqueStrings([
        ...budgetReceipt.wakeResult.evidenceRefs,
        budgetReceipt.budgetState.budgetStateId,
      ]),
      causalTrace: budgetReceipt.wakeResult.causalTrace ?? budgetReceipt.budgetState.causalTrace ?? completed?.causalTrace ?? running.causalTrace,
      createdAt: budgetReceipt.wakeResult.createdAt,
    });
    return {
      ...budgetReceipt.wakeResult,
      evidenceRefs: uniqueStrings([
        ...budgetReceipt.wakeResult.evidenceRefs,
        budgetReceipt.budgetState.budgetStateId,
        ...transcriptEntries.map((entry) => entry.entryId),
      ]),
    };
  }
  const batchLimit = policyAwareWakeAskBatchLimit(policy);
  if (running.mailIds.length > batchLimit) {
    const failedAt = now;
    const failedReason = `wake_preflight_blocked:batch_too_large:${running.mailIds.length}>${batchLimit}`;
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      failureReason: failedReason,
      nextRetryAt: addMs(failedAt, wakeAttemptBackoffMs(running.attemptCount)),
      now: failedAt,
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "failed_retryable",
      failedReason,
      evidenceRefs,
      createdAt: failedAt,
    });
    return recordNonTerminalWakeTranscript({
      wake: running,
      wakeResult,
      mailBatch,
      fastLayer,
      action: "deferred",
      retainedMailCount,
      evidenceRefs,
      createdAt: wakeResult.createdAt,
    });
  }
  const fullPrompt = buildWakePrompt({
    wake: running,
    policy,
    activeInterpreterProfile,
    activeCriterionLedger,
    mailBatch,
    priorDecisions,
    latestNarrativeState,
    latestImmersionState: fastLayer.immersionState,
    predictionValidation: fastLayer.predictionValidation,
    processedPacket: fastLayer.processedPacket,
    taskQueueSnapshot,
    conversationContextPack,
    heldCallouts,
    voicePolicy,
    retainedMailCount,
  });
  const promptMaxChars = wakeAskPromptMaxChars();
  const compactPrompt = fullPrompt.length > promptMaxChars
    ? buildCompactWakePrompt({
        wake: running,
        policy,
        mailBatch,
        priorDecisions,
        latestNarrativeState,
        latestImmersionState: fastLayer.immersionState,
        predictionValidation: fastLayer.predictionValidation,
        processedPacket: fastLayer.processedPacket,
        microReasonerRuns: fastLayer.microReasonerRuns,
        voicePolicy,
        retainedMailCount,
      })
    : null;
  const prompt = compactPrompt && compactPrompt.length <= promptMaxChars ? compactPrompt : fullPrompt;
  if (prompt.length > promptMaxChars) {
    const failedAt = now;
    const failedReason = `wake_preflight_blocked:prompt_too_large:${prompt.length}>${promptMaxChars}`;
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      failureReason: failedReason,
      nextRetryAt: addMs(failedAt, wakeAttemptBackoffMs(running.attemptCount)),
      now: failedAt,
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "failed_retryable",
      failedReason,
      evidenceRefs,
      createdAt: failedAt,
    });
    return recordNonTerminalWakeTranscript({
      wake: running,
      wakeResult,
      mailBatch,
      fastLayer,
      action: "deferred",
      retainedMailCount,
      evidenceRefs,
      createdAt: wakeResult.createdAt,
    });
  }
  const runningAttempt = markStagePlayMailWakeRunning(running.wakeRequestId, now) ?? running;
  const pressure = input.pressureCheck?.({
    wakeRequest: runningAttempt,
    now,
  }) ?? null;
  const manualPressureOverride = input.manualRun && pressure?.deferred === true && isManualPressureOverrideReason(pressure.reason);
  let admissionReleased = false;
  const releaseAdmission = (outcome: "completed" | "failed" | "rejected" | "aborted") => {
    if (admissionReleased) return;
    admissionReleased = true;
    pressure?.release?.(outcome);
  };
  if (pressure?.deferred && !manualPressureOverride) {
    const nextRetryAt = addMs(now, wakeAttemptBackoffMs(runningAttempt.attemptCount));
    const rawReason = pressure.reason ?? "runtime_memory_pressure";
    const reason = input.manualRun && !rawReason.startsWith("manual_wake_deferred_for_pressure")
      ? `manual_wake_deferred_for_pressure:${rawReason}`
      : rawReason;
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      status: "deferred_for_pressure",
      failureReason: reason,
      nextRetryAt,
      now,
    });
    releaseAdmission("rejected");
    const priorDeferred = latestStagePlayLiveSourceMailWakeResult(running.wakeRequestId);
    const priorCoversCurrentBatch = running.mailIds.every((mailId) => priorDeferred?.evidenceRefs.includes(mailId));
    if (priorDeferred?.status === "deferred_for_pressure" && priorDeferred.failedReason === reason && priorCoversCurrentBatch) {
      return priorDeferred;
    }
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "deferred_for_pressure",
      failedReason: reason,
      evidenceRefs,
      createdAt: now,
    });
    return recordNonTerminalWakeTranscript({
      wake: running,
      wakeResult,
      mailBatch,
      fastLayer,
      action: "pressure_blocked",
      retainedMailCount,
      evidenceRefs,
      createdAt: wakeResult.createdAt,
    });
  }
  try {
    const response = await (input.askTurnRunner ?? defaultAskTurnRunner(input.baseUrl))({
      prompt,
      threadId: running.threadId,
      evidenceRefs,
      wakeRequest: runningAttempt,
    });
    const askTurnId = extractAskTurnId(response);
    const decisionIds = extractDecisionIds(response);
    if (decisionIds.length === 0) {
      const failedReason = "mail_wake_decision_missing";
      markStagePlayMailWakeTerminalFailed({
        wakeRequestId: running.wakeRequestId,
        failureReason: failedReason,
        now: new Date().toISOString(),
      });
      releaseAdmission("failed");
      const wakeResult = recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "failed_terminal",
        askTurnId,
        failedReason,
        evidenceRefs: uniqueStrings([...evidenceRefs, ...(askTurnId ? [askTurnId] : [])]),
        createdAt: new Date().toISOString(),
      });
      return recordNonTerminalWakeTranscript({
        wake: running,
        wakeResult,
        mailBatch,
        fastLayer,
        action: "deferred",
        retainedMailCount,
        evidenceRefs: wakeResult.evidenceRefs,
        createdAt: wakeResult.createdAt,
      });
    }
    const completionAt = new Date().toISOString();
    const storedDecisions = decisionIds
      .map((decisionId) => getStagePlayMailDecision(decisionId))
      .filter((decision): decision is StagePlayLiveSourceMailDecisionV1 => Boolean(decision));
    const voiceReceipts: StagePlayLiveSourceVoiceDeliveryReceiptV1[] = [];
    for (const decision of storedDecisions) {
      const receipt = await maybeRunStagePlayLiveSourceVoiceDelivery({
        decision,
        runner: input.voiceDeliveryRunner ?? null,
        now: completionAt,
      });
      if (receipt) voiceReceipts.push(receipt);
    }
    const voiceDecisionIds = storedDecisions
      .filter((decision) => decision.decision === "request_voice_callout")
      .map((decision) => decision.decisionId);
    const missingVoiceReceipt = voiceDecisionIds.some((decisionId) =>
      !voiceReceipts.some((receipt) => receipt.decisionId === decisionId)
    );
    if (missingVoiceReceipt) {
      const failedReason = "missing_required_voice_checkpoint";
      markStagePlayMailWakeRetryable({
        wakeRequestId: running.wakeRequestId,
        failureReason: failedReason,
        nextRetryAt: addMs(completionAt, wakeAttemptBackoffMs(runningAttempt.attemptCount)),
        now: completionAt,
      });
      releaseAdmission("failed");
      const wakeResult = recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "failed_retryable",
        askTurnId,
        decisionIds,
        failedReason,
        evidenceRefs: uniqueStrings([...evidenceRefs, ...(askTurnId ? [askTurnId] : []), ...decisionIds]),
        createdAt: completionAt,
      });
      return recordNonTerminalWakeTranscript({
        wake: runningAttempt,
        wakeResult,
        mailBatch,
        fastLayer,
        action: "deferred",
        retainedMailCount,
        evidenceRefs: wakeResult.evidenceRefs,
        createdAt: wakeResult.createdAt,
      });
    }
    const voiceReceiptRefs = voiceReceipts.flatMap((receipt) => [receipt.receiptId, ...receipt.evidenceRefs]);
    const completionEvidenceRefs = uniqueStrings([
      ...evidenceRefs,
      ...(askTurnId ? [askTurnId] : []),
      ...decisionIds,
      ...voiceReceiptRefs,
    ]);
    const completed = markStagePlayMailWakeCompleted({
      wakeRequestId: running.wakeRequestId,
      askTurnId,
      decisionIds,
      evidenceRefs: completionEvidenceRefs,
      now: completionAt,
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "completed",
      askTurnId: completed?.askTurnId ?? askTurnId,
      decisionIds: completed?.decisionIds ?? decisionIds,
      evidenceRefs: completed?.evidenceRefs ?? completionEvidenceRefs,
      createdAt: completionAt,
    });
    const budgetReceipt = recordWakeBudgetReceipt({
      wake: completed ?? running,
      wakeResult,
      action: retainedMailCount > 0 ? "batched" : "processed",
      reason: retainedMailCount > 0 ? "wake_batch_split" : "wake_processed",
      processedMailCount: running.mailIds.length,
      retainedMailCount,
      evidenceRefs: wakeResult.evidenceRefs,
      createdAt: wakeResult.createdAt,
    });
    const transcriptRows = buildDurableWakeTranscriptRows({
      wake: completed ?? running,
      wakeResult: budgetReceipt.wakeResult,
      mailBatch,
      priorNarrativeState: latestNarrativeState,
      immersionState: fastLayer.immersionState,
      predictionValidation: fastLayer.predictionValidation,
      processedPacket: fastLayer.processedPacket,
      microReasonerRuns: fastLayer.microReasonerRuns,
      slowAskRan: true,
      decisionIds: completed?.decisionIds ?? decisionIds,
      budgetState: budgetReceipt.budgetState,
      voiceReceipts,
      evidenceRefs: uniqueStrings([
        ...(budgetReceipt.wakeResult.evidenceRefs ?? completed?.evidenceRefs ?? evidenceRefs),
        budgetReceipt.budgetState.budgetStateId,
        fastLayer.processedPacket.packetId,
        ...voiceReceipts.flatMap((receipt) => receipt.evidenceRefs),
      ]),
      createdAt: budgetReceipt.wakeResult.createdAt,
    });
    const transcriptEntries = recordStagePlayLiveSourceMailTranscriptEntries({
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      wakeRequestId: running.wakeRequestId,
      wakeResultId: budgetReceipt.wakeResult.wakeResultId,
      askTurnId: budgetReceipt.wakeResult.askTurnId ?? askTurnId,
      decisionIds: budgetReceipt.wakeResult.decisionIds,
      mailIds: running.mailIds,
      sourceIds: running.sourceIds,
      rows: transcriptRows,
      evidenceRefs: uniqueStrings([
        ...budgetReceipt.wakeResult.evidenceRefs,
        budgetReceipt.budgetState.budgetStateId,
        ...voiceReceipts.flatMap((receipt) => [receipt.receiptId, ...receipt.evidenceRefs]),
      ]),
      causalTrace: budgetReceipt.wakeResult.causalTrace ?? budgetReceipt.budgetState.causalTrace ?? completed?.causalTrace ?? running.causalTrace,
      createdAt: budgetReceipt.wakeResult.createdAt,
    });
    const consolidation = maybeQueueStagePlayLiveSourceMemoryConsolidation({
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      jobId: policy?.jobId ?? running.jobId ?? null,
      policyId: policy?.policyId ?? null,
      sourceIds: running.sourceIds,
      now: budgetReceipt.wakeResult.createdAt,
    });
    return {
      ...budgetReceipt.wakeResult,
      evidenceRefs: uniqueStrings([
        ...budgetReceipt.wakeResult.evidenceRefs,
        budgetReceipt.budgetState.budgetStateId,
        fastLayer.processedPacket.packetId,
        ...transcriptEntries.map((entry) => entry.entryId),
        consolidation.task?.taskId,
      ]),
    };
  } catch (err) {
    releaseAdmission(isPressure503(err) ? "rejected" : "failed");
    const failedAt = now;
    if (isPressure503(err)) {
      const nextRetryAt = addMs(failedAt, wakeAttemptBackoffMs(runningAttempt.attemptCount));
      markStagePlayMailWakeRetryable({
        wakeRequestId: running.wakeRequestId,
        status: "deferred_for_pressure",
        failureReason: "ask_turn_pressure_503",
        nextRetryAt,
        now: failedAt,
      });
      const wakeResult = recordStagePlayMailWakeResult({
        wakeRequestId: running.wakeRequestId,
        threadId: running.threadId,
        roomId: running.roomId ?? null,
        environmentId: running.environmentId ?? null,
        status: "deferred_for_pressure",
        failedReason: "ask_turn_pressure_503",
        evidenceRefs,
        createdAt: failedAt,
      });
      return recordNonTerminalWakeTranscript({
        wake: runningAttempt,
        wakeResult,
        mailBatch,
        fastLayer,
        action: "pressure_blocked",
        retainedMailCount,
        evidenceRefs,
        createdAt: wakeResult.createdAt,
      });
    }
    markStagePlayMailWakeRetryable({
      wakeRequestId: running.wakeRequestId,
      failureReason: err instanceof Error ? err.message : String(err),
      nextRetryAt: addMs(failedAt, wakeAttemptBackoffMs(runningAttempt.attemptCount)),
      now: failedAt,
    });
    const wakeResult = recordStagePlayMailWakeResult({
      wakeRequestId: running.wakeRequestId,
      threadId: running.threadId,
      roomId: running.roomId ?? null,
      environmentId: running.environmentId ?? null,
      status: "failed_retryable",
      failedReason: err instanceof Error ? err.message : String(err),
      evidenceRefs,
      createdAt: failedAt,
    });
    return recordNonTerminalWakeTranscript({
      wake: runningAttempt,
      wakeResult,
      mailBatch,
      fastLayer,
      action: "deferred",
      retainedMailCount,
      evidenceRefs,
      createdAt: wakeResult.createdAt,
    });
  } finally {
    releaseAdmission("completed");
  }
}
