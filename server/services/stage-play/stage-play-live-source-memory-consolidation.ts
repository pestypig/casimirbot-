import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_MEMORY_CONSOLIDATION_SCHEMA,
  type StagePlayLiveSourceMemoryConsolidationQuietWindowV1,
  type StagePlayLiveSourceMemoryConsolidationV1,
} from "@shared/contracts/stage-play-live-source-memory-consolidation.v1";
import type { StagePlayLiveSourceWatchJobPolicyV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  getStagePlayLiveSourceWatchJobPolicy,
  listStagePlayLiveSourceMailItems,
  listStagePlayMailDecisions,
  listStagePlayLiveSourceWatchJobPolicies,
} from "./stage-play-live-source-mailbox-store";
import {
  listStagePlayLiveSourceNarrativeStates,
} from "./stage-play-live-source-narrative-store";
import {
  buildStagePlayLiveSourceConversationContextPack,
  listStagePlayLiveSourceConversationEvents,
} from "./stage-play-live-source-conversation-store";
import {
  enqueueStagePlayLiveSourceTask,
  listStagePlayLiveSourceTasks,
} from "./stage-play-live-source-task-queue";

const consolidationsById = new Map<string, StagePlayLiveSourceMemoryConsolidationV1>();

const DEFAULT_PROCESSED_MAIL_BATCH_THRESHOLD = 5;
const DEFAULT_CONTEXT_PRESSURE_THRESHOLD = 18;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const clipText = (value: string | null | undefined, limit = 420): string => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const hasUrgentLanguage = (value: string): boolean =>
  /\b(?:urgent|critical|danger|hostile|attack|fire|crash|blocked|risk|warning|emergency|immediate)\b/i.test(value);

const latestConsolidationForScope = (input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
}): StagePlayLiveSourceMemoryConsolidationV1 | null =>
  Array.from(consolidationsById.values())
    .filter((item) => item.threadId === input.threadId)
    .filter((item) => !input.roomId || item.roomId === input.roomId)
    .filter((item) => !input.environmentId || item.environmentId === input.environmentId)
    .filter((item) => !input.jobId || item.jobId === input.jobId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1) ?? null;

const activePolicyForScope = (input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
}): StagePlayLiveSourceWatchJobPolicyV1 | null =>
  listStagePlayLiveSourceWatchJobPolicies({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    status: "armed",
    limit: 1,
  }).at(-1) ?? null;

export function evaluateStagePlayLiveSourceMemoryConsolidationQuietWindow(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  processedMailBatchThreshold?: number;
  contextPressureThreshold?: number;
}): StagePlayLiveSourceMemoryConsolidationQuietWindowV1 {
  const processedMailBatchThreshold = Math.max(1, input.processedMailBatchThreshold ?? DEFAULT_PROCESSED_MAIL_BATCH_THRESHOLD);
  const contextPressureThreshold = Math.max(1, input.contextPressureThreshold ?? DEFAULT_CONTEXT_PRESSURE_THRESHOLD);
  const latestConsolidation = latestConsolidationForScope(input);
  const mailItems = listStagePlayLiveSourceMailItems({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 250,
  });
  const unreadMail = mailItems.filter((mail) => mail.status === "unread" || mail.status === "delivered_to_ask");
  const urgentMail = unreadMail.filter((mail) => hasUrgentLanguage(`${mail.summary.text} ${mail.summary.preview}`));
  const decisions = listStagePlayMailDecisions({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 100,
  }).filter((decision) => !latestConsolidation || decision.createdAt > latestConsolidation.createdAt);
  const narratives = listStagePlayLiveSourceNarrativeStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    limit: 100,
  });
  const conversationEvents = listStagePlayLiveSourceConversationEvents({
    threadId: input.threadId,
    jobId: input.jobId ?? null,
    limit: 80,
  });
  const activeUserPrompt = conversationEvents.some((event) =>
    event.priority === "urgent_user_interrupt" ||
    event.priority === "active_user_prompt"
  );
  const existingConsolidationTask = listStagePlayLiveSourceTasks({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? null,
    limit: 20,
  }).find((task) =>
    task.taskKind === "memory_consolidation" &&
    (task.status === "queued" || task.status === "running")
  ) ?? null;
  const processedMailBatchCount = decisions.reduce((sum, decision) => sum + Math.max(1, decision.mailIds.length), 0);
  const contextPressureScore =
    mailItems.length +
    decisions.length +
    narratives.length +
    conversationEvents.length;
  const evidenceRefs = uniqueStrings([
    latestConsolidation?.consolidationId,
    ...urgentMail.map((mail) => mail.mailId),
    ...decisions.map((decision) => decision.decisionId),
    ...narratives.map((narrative) => narrative.narrativeStateId),
    ...conversationEvents.map((event) => event.eventId),
    existingConsolidationTask?.taskId,
  ]);
  let reason: StagePlayLiveSourceMemoryConsolidationQuietWindowV1["reason"] = "quiet_window_ready";
  if (urgentMail.length > 0) reason = "urgent_mail_present";
  else if (activeUserPrompt) reason = "active_user_prompt_present";
  else if (existingConsolidationTask) reason = "memory_consolidation_already_queued_or_running";
  else if (processedMailBatchCount < processedMailBatchThreshold) reason = "insufficient_processed_mail_batches";
  else if (contextPressureScore < contextPressureThreshold) reason = "context_pressure_below_threshold";
  return {
    schema: "stage_play_live_source_memory_consolidation_quiet_window/v1",
    quiet: reason === "quiet_window_ready",
    reason,
    processedMailBatchCount,
    contextPressureScore,
    thresholds: {
      processedMailBatchThreshold,
      contextPressureThreshold,
    },
    evidenceRefs,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function maybeQueueStagePlayLiveSourceMemoryConsolidation(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceIds?: string[];
  processedMailBatchThreshold?: number;
  contextPressureThreshold?: number;
  now?: string;
}): {
  quietWindow: StagePlayLiveSourceMemoryConsolidationQuietWindowV1;
  task: ReturnType<typeof enqueueStagePlayLiveSourceTask> | null;
} {
  const quietWindow = evaluateStagePlayLiveSourceMemoryConsolidationQuietWindow(input);
  if (!quietWindow.quiet) return { quietWindow, task: null };
  const policy = input.policyId
    ? getStagePlayLiveSourceWatchJobPolicy(input.policyId)
    : activePolicyForScope(input);
  const task = enqueueStagePlayLiveSourceTask({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? policy?.jobId ?? null,
    policyId: input.policyId ?? policy?.policyId ?? null,
    sourceIds: input.sourceIds ?? policy?.sourceIds ?? [],
    taskKind: "memory_consolidation",
    priority: "background",
    evidenceRefs: quietWindow.evidenceRefs,
    now: input.now,
  });
  return { quietWindow, task };
}

export function recordStagePlayLiveSourceMemoryConsolidation(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceIds?: string[];
  now?: string;
}): StagePlayLiveSourceMemoryConsolidationV1 {
  const createdAt = input.now ?? new Date().toISOString();
  const policy = input.policyId
    ? getStagePlayLiveSourceWatchJobPolicy(input.policyId)
    : activePolicyForScope(input);
  const narratives = listStagePlayLiveSourceNarrativeStates({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? policy?.jobId ?? null,
    limit: 12,
  });
  const latestNarrative = narratives.at(-1) ?? null;
  const decisions = listStagePlayMailDecisions({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 40,
  });
  const conversation = buildStagePlayLiveSourceConversationContextPack({
    threadId: input.threadId,
    jobId: input.jobId ?? policy?.jobId ?? null,
    limit: 40,
    now: createdAt,
  });
  const stalePredictions = narratives
    .filter((narrative) => narrative.prediction && narrative.staleness.state !== "current")
    .map((narrative) => `${narrative.narrativeStateId}: ${clipText(narrative.prediction?.text, 220)}`);
  const sourcePatterns = uniqueStrings([
    ...narratives.flatMap((narrative) => narrative.interpretedSituation.objects),
    ...narratives.flatMap((narrative) => narrative.interpretedSituation.activities),
    ...decisions.map((decision) => decision.decision),
  ]).slice(0, 12);
  const policyRelevantMemories = uniqueStrings([
    ...(policy?.importanceCriteria ?? []).map((entry) => `importance: ${entry}`),
    ...(policy?.suppressCriteria ?? []).map((entry) => `suppress: ${entry}`),
    ...conversation.voicePreferences.map((entry) => `voice: ${entry.textPreview}`),
    ...conversation.activeConstraints.map((entry) => `constraint: ${entry.textPreview}`),
  ]).slice(0, 12);
  const evidenceRefs = uniqueStrings([
    policy?.policyId,
    policy?.jobId,
    latestNarrative?.narrativeStateId,
    ...narratives.map((narrative) => narrative.narrativeStateId),
    ...decisions.map((decision) => decision.decisionId),
    conversation.contextPackId,
    ...conversation.evidenceRefs,
  ]);
  const consolidation: StagePlayLiveSourceMemoryConsolidationV1 = {
    artifactId: "stage_play_live_source_memory_consolidation",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MEMORY_CONSOLIDATION_SCHEMA,
    consolidationId: `stage_play_live_source_memory_consolidation:${hashShort([
      input.threadId,
      input.jobId ?? policy?.jobId ?? null,
      evidenceRefs,
      createdAt,
    ])}`,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: input.jobId ?? policy?.jobId ?? null,
    policyId: input.policyId ?? policy?.policyId ?? null,
    sourceIds: uniqueStrings(input.sourceIds ?? policy?.sourceIds ?? latestNarrative?.sourceIds ?? []),
    consolidatedRunningStory: clipText(
      latestNarrative?.runningStorySummary ??
      decisions.at(-1)?.rationalePreview ??
      "No consolidated running story is available yet.",
      900,
    ),
    sourcePatterns: sourcePatterns.length > 0 ? sourcePatterns : ["No stable source pattern identified yet."],
    currentObjective: clipText(policy?.objectiveText ?? latestNarrative?.watchNext.reason ?? "Continue watching the live source."),
    openQuestions: conversation.openQuestions.map((entry) => entry.textPreview).slice(-8),
    stalePredictions,
    policyRelevantMemories,
    processedMailBatchCount: decisions.reduce((sum, decision) => sum + Math.max(1, decision.mailIds.length), 0),
    contextPressureScore: decisions.length + narratives.length + conversation.events.length,
    evidenceRefs,
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  consolidationsById.set(consolidation.consolidationId, consolidation);
  return consolidation;
}

export function listStagePlayLiveSourceMemoryConsolidations(input: {
  threadId?: string | null;
  jobId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMemoryConsolidationV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(consolidationsById.values())
    .filter((item) => !input.threadId || item.threadId === input.threadId)
    .filter((item) => !input.jobId || item.jobId === input.jobId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function resetStagePlayLiveSourceMemoryConsolidationForTest(): void {
  consolidationsById.clear();
}
