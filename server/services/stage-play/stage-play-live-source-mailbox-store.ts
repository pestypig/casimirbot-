import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA,
  STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_SCHEMA,
  type StagePlayLiveSourceJobStateV1,
  type StagePlayLiveSourceInterpretationModeV1,
  type StagePlayLiveSourceMailDecisionV1,
  type StagePlayLiveSourceMailItemV1,
  type StagePlayLiveSourceMailProcessingModeV1,
  type StagePlayLiveSourceMailSourceKindV1,
  type StagePlayLiveSourceMailStatusV1,
  type StagePlayLiveSourceOutputCadenceV1,
  type StagePlayLiveSourceWatchJobPolicyV1,
  type StagePlayMailDecisionV1,
  type StagePlayNextLoopStateV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { queueStagePlayLiveSourceMailWakeRequest } from "./stage-play-live-source-mail-wake-store";
import {
  markNarrativeStateStaleAfterMail,
  resetStagePlayLiveSourceNarrativeStoreForTest,
} from "./stage-play-live-source-narrative-store";
import {
  markImmersionStateStaleAfterMail,
  resetStagePlayLiveSourceImmersionStateStoreForTest,
} from "./stage-play-live-source-immersion-state-store";
import {
  inferStagePlayLiveSourceInterpretationMode,
  inferStagePlayLiveSourceMailProcessingMode,
  inferStagePlayLiveSourceOutputCadence,
} from "./stage-play-live-source-watch-policy-defaults";
import {
  buildLiveSourceCausalTraceV1,
  mergeLiveSourceCausalTraces,
} from "./stage-play-live-source-causal-trace";

export {
  getLatestStagePlayLiveSourceImmersionState,
  getStagePlayLiveSourceImmersionState,
  listStagePlayLiveSourceImmersionStates,
  markImmersionStateStaleAfterMail,
  markImmersionStateSuperseded,
  recordStagePlayLiveSourceImmersionState,
  resetStagePlayLiveSourceImmersionStateStoreForTest,
} from "./stage-play-live-source-immersion-state-store";

export {
  getLatestStagePlayLiveSourceNarrativeState,
  getStagePlayLiveSourceNarrativeState,
  listStagePlayLiveSourceNarrativeStates,
  markNarrativeStateStaleAfterMail,
  markNarrativeStateSuperseded,
  recordStagePlayLiveSourceNarrativeState,
  resetStagePlayLiveSourceNarrativeStoreForTest,
} from "./stage-play-live-source-narrative-store";

const mailById = new Map<string, StagePlayLiveSourceMailItemV1>();
const decisionsById = new Map<string, StagePlayLiveSourceMailDecisionV1>();
const jobStateById = new Map<string, StagePlayLiveSourceJobStateV1>();
const watchJobPolicyById = new Map<string, StagePlayLiveSourceWatchJobPolicyV1>();
const mailCompactionIntervalsById = new Map<string, StagePlayLiveSourceMailCompactionIntervalV1>();
const MAX_MAIL_PER_THREAD = 80;
const MAX_MAIL_COMPACTION_INTERVALS_PER_THREAD = 120;
const MAIL_COMPACTION_PREVIEW_COUNT = 4;
const MAX_MAIL_PER_COMPACTION_INTERVAL = 20;

export type StagePlayLiveSourceMailCompactionIntervalV1 = {
  artifactId: "stage_play_live_source_mail_compaction_interval";
  schemaVersion: "stage_play_live_source_mail_compaction_interval/v1";
  intervalId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  sourceKinds: string[];
  startMailId: string;
  endMailId: string;
  startCreatedAt: string;
  endCreatedAt: string;
  compactedMailCount: number;
  statusCounts: Partial<Record<StagePlayLiveSourceMailStatusV1, number>>;
  summaryPreviews: string[];
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailboxRetentionStatsV1 = {
  schema: "stage_play_live_source_mailbox_retention/v1";
  threadId?: string | null;
  hotLimit: number;
  retainedMailCount: number;
  compactedIntervalCount: number;
  compactedMailCount: number;
  oldestRetainedMailId?: string | null;
  newestRetainedMailId?: string | null;
  latestCompactionIntervalId?: string | null;
  evidenceRefs: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailEnqueuedEvent = {
  mail: StagePlayLiveSourceMailItemV1;
  jobState: StagePlayLiveSourceJobStateV1;
  wakeRequestId: string | null;
};

type StagePlayLiveSourceMailEnqueuedListener = (event: StagePlayLiveSourceMailEnqueuedEvent) => void;
const mailEnqueuedListeners = new Set<StagePlayLiveSourceMailEnqueuedListener>();

export function subscribeStagePlayLiveSourceMailEnqueued(
  listener: StagePlayLiveSourceMailEnqueuedListener,
): () => void {
  mailEnqueuedListeners.add(listener);
  return () => {
    mailEnqueuedListeners.delete(listener);
  };
}

const notifyStagePlayLiveSourceMailEnqueued = (event: StagePlayLiveSourceMailEnqueuedEvent): void => {
  for (const listener of mailEnqueuedListeners) {
    try {
      listener(event);
    } catch (err) {
      console.warn("[stage-play-live-source-mailbox] mail enqueue listener failed", err);
    }
  }
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const previewText = (text: string, limit = 220): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const defaultJobId = (input: { threadId: string; roomId?: string | null; environmentId?: string | null; sourceId?: string | null }): string =>
  `stage_play_live_source_job:${hashShort([
    input.threadId,
    input.roomId ?? null,
    input.environmentId ?? null,
    input.sourceId ?? "all_sources",
  ])}`;

const defaultNextLoopStateForDecision = (decision: StagePlayMailDecisionV1): StagePlayNextLoopStateV1 => {
  if (decision === "fail_closed") return "blocked_tool_error";
  return "armed_for_next_summary";
};

const nextLoopStateForWatchPolicyStatus = (
  status: StagePlayLiveSourceWatchJobPolicyV1["status"],
): StagePlayNextLoopStateV1 => {
  if (status === "paused") return "paused_by_user";
  if (status === "blocked") return "blocked_missing_source";
  if (status === "ended") return "ended";
  return "armed_for_next_summary";
};

const listThreadMail = (threadId: string): StagePlayLiveSourceMailItemV1[] =>
  Array.from(mailById.values())
    .filter((item) => item.threadId === threadId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

const listThreadMailCompactionIntervals = (threadId: string): StagePlayLiveSourceMailCompactionIntervalV1[] =>
  Array.from(mailCompactionIntervalsById.values())
    .filter((interval) => interval.threadId === threadId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

const trimThreadMailCompactionIntervals = (threadId: string): void => {
  const entries = listThreadMailCompactionIntervals(threadId);
  if (entries.length <= MAX_MAIL_COMPACTION_INTERVALS_PER_THREAD) return;
  for (const entry of entries.slice(0, entries.length - MAX_MAIL_COMPACTION_INTERVALS_PER_THREAD)) {
    mailCompactionIntervalsById.delete(entry.intervalId);
  }
};

const recordMailCompactionInterval = (
  entries: StagePlayLiveSourceMailItemV1[],
): StagePlayLiveSourceMailCompactionIntervalV1 | null => {
  if (entries.length === 0) return null;
  const first = entries[0];
  const last = entries.at(-1) ?? first;
  const latestInterval = listThreadMailCompactionIntervals(first.threadId).at(-1) ?? null;
  if (
    latestInterval &&
    latestInterval.roomId === (first.roomId ?? null) &&
    latestInterval.environmentId === (first.environmentId ?? null) &&
    latestInterval.compactedMailCount + entries.length <= MAX_MAIL_PER_COMPACTION_INTERVAL
  ) {
    const statusCounts = entries.reduce<Partial<Record<StagePlayLiveSourceMailStatusV1, number>>>(
      (counts, entry) => {
        counts[entry.status] = (counts[entry.status] ?? 0) + 1;
        return counts;
      },
      { ...latestInterval.statusCounts },
    );
    const merged: StagePlayLiveSourceMailCompactionIntervalV1 = {
      ...latestInterval,
      sourceIds: uniqueStrings([...latestInterval.sourceIds, ...entries.map((entry) => entry.sourceId)]),
      sourceKinds: uniqueStrings([...latestInterval.sourceKinds, ...entries.map((entry) => entry.sourceKind)]),
      endMailId: last.mailId,
      endCreatedAt: last.createdAt,
      compactedMailCount: latestInterval.compactedMailCount + entries.length,
      statusCounts,
      summaryPreviews: [
        ...latestInterval.summaryPreviews,
        ...entries.map((entry) => previewText(entry.summary.preview || entry.summary.text, 80)),
      ].slice(-MAIL_COMPACTION_PREVIEW_COUNT),
      evidenceRefs: uniqueStrings([
        ...latestInterval.evidenceRefs,
        ...entries.map((entry) => entry.mailId),
        ...entries.flatMap((entry) => entry.evidenceRefs),
      ]).slice(0, 80),
      createdAt: last.updatedAt || last.createdAt,
    };
    mailCompactionIntervalsById.set(merged.intervalId, merged);
    return merged;
  }
  const statusCounts = entries.reduce<Partial<Record<StagePlayLiveSourceMailStatusV1, number>>>((counts, entry) => {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    return counts;
  }, {});
  const evidenceRefs = uniqueStrings([
    ...entries.map((entry) => entry.mailId),
    ...entries.flatMap((entry) => entry.evidenceRefs),
  ]).slice(0, 80);
  const intervalId = `stage_play_live_source_mail_compaction_interval:${hashShort([
    first.threadId,
    first.mailId,
    last.mailId,
    entries.length,
  ])}`;
  const interval: StagePlayLiveSourceMailCompactionIntervalV1 = {
    artifactId: "stage_play_live_source_mail_compaction_interval",
    schemaVersion: "stage_play_live_source_mail_compaction_interval/v1",
    intervalId,
    threadId: first.threadId,
    roomId: first.roomId ?? null,
    environmentId: first.environmentId ?? null,
    sourceIds: uniqueStrings(entries.map((entry) => entry.sourceId)),
    sourceKinds: uniqueStrings(entries.map((entry) => entry.sourceKind)),
    startMailId: first.mailId,
    endMailId: last.mailId,
    startCreatedAt: first.createdAt,
    endCreatedAt: last.createdAt,
    compactedMailCount: entries.length,
    statusCounts,
    summaryPreviews: entries
      .slice(-MAIL_COMPACTION_PREVIEW_COUNT)
      .map((entry) => previewText(entry.summary.preview || entry.summary.text, 80)),
    evidenceRefs,
    createdAt: last.updatedAt || last.createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  mailCompactionIntervalsById.set(interval.intervalId, interval);
  trimThreadMailCompactionIntervals(first.threadId);
  return interval;
};

const trimThreadMail = (threadId: string): void => {
  const entries = listThreadMail(threadId);
  if (entries.length <= MAX_MAIL_PER_THREAD) return;
  const evicted = entries.slice(0, entries.length - MAX_MAIL_PER_THREAD);
  recordMailCompactionInterval(evicted);
  for (const entry of evicted) {
    mailById.delete(entry.mailId);
  }
};

const latestMailBefore = (input: {
  threadId: string;
  sourceId?: string | null;
  createdAt?: string | null;
}): StagePlayLiveSourceMailItemV1 | null => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return listThreadMail(input.threadId)
    .filter((item) =>
      item.createdAt < createdAt &&
      (!input.sourceId || item.sourceId === input.sourceId)
    )
    .at(-1) ?? null;
};

const hasMailForEvidence = (evidenceRef: string): StagePlayLiveSourceMailItemV1 | null =>
  Array.from(mailById.values()).find((item) => item.sourceRefs.evidenceRef === evidenceRef || item.evidenceRefs.includes(evidenceRef)) ?? null;

export function enqueueStagePlayLiveSourceMailItem(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId: string;
  sourceKind: StagePlayLiveSourceMailSourceKindV1;
  frameRef?: string | null;
  evidenceRef?: string | null;
  observationRef?: string | null;
  summaryText: string;
  summaryPreview?: string | null;
  confidence?: number | null;
  analysisState?: StagePlayLiveSourceMailItemV1["summary"]["analysisState"];
  objectiveText?: string | null;
  objectiveId?: string | null;
  deterministicChangeHint?: StagePlayLiveSourceMailItemV1["hints"]["deterministicChangeHint"];
  sourceFreshness?: StagePlayLiveSourceMailItemV1["hints"]["sourceFreshness"];
  evidenceRefs?: string[];
  supersedesMailIds?: string[];
  captureIntervalMs?: number | null;
  createdAt?: string;
}): StagePlayLiveSourceMailItemV1 {
  const evidenceRefs = uniqueStrings([
    input.sourceId,
    input.frameRef,
    input.evidenceRef,
    input.observationRef,
    ...(input.evidenceRefs ?? []),
  ]);
  if (input.evidenceRef) {
    const existing = hasMailForEvidence(input.evidenceRef);
    if (existing) return existing;
  }
  const createdAt = input.createdAt ?? new Date().toISOString();
  const previous = latestMailBefore({ threadId: input.threadId, sourceId: input.sourceId, createdAt });
  const previousCreatedMs = previous ? Date.parse(previous.createdAt) : Number.NaN;
  const createdMs = Date.parse(createdAt);
  const elapsedMsSincePrevious =
    Number.isFinite(previousCreatedMs) && Number.isFinite(createdMs)
      ? Math.max(0, createdMs - previousCreatedMs)
      : null;
  const preview = previewText(input.summaryPreview ?? input.summaryText);
  const mailId = `stage_play_live_source_mail:${hashShort([
    input.threadId,
    input.sourceId,
    input.frameRef ?? null,
    input.evidenceRef ?? null,
    input.summaryText,
    createdAt,
  ])}`;
  const mail: StagePlayLiveSourceMailItemV1 = {
    artifactId: "stage_play_live_source_mail_item",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA,
    mailId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId,
    sourceKind: input.sourceKind,
    sourceRefs: {
      sourceId: input.sourceId,
      frameRef: input.frameRef ?? null,
      evidenceRef: input.evidenceRef ?? null,
      observationRef: input.observationRef ?? null,
    },
    summary: {
      text: input.summaryText,
      preview,
      confidence: input.confidence ?? null,
      analysisState: input.analysisState ?? "analysis_ready",
    },
    priorContext: {
      previousMailId: previous?.mailId ?? null,
      previousEvidenceRef: previous?.sourceRefs.evidenceRef ?? null,
      previousSummaryPreview: previous?.summary.preview ?? null,
    },
    objective: input.objectiveText || input.objectiveId
      ? {
          objectiveId: input.objectiveId ?? null,
          text: input.objectiveText ?? null,
        }
      : undefined,
    hints: {
      deterministicChangeHint: input.deterministicChangeHint ?? (previous ? "summary_changed" : "first_summary"),
      elapsedMsSincePrevious,
      sourceFreshness: input.sourceFreshness ?? "fresh",
    },
    status: "unread",
    evidenceRefs,
    causalTrace: buildLiveSourceCausalTraceV1({
      parentRefs: uniqueStrings([previous?.mailId, previous?.sourceRefs.evidenceRef]),
      causedBy: uniqueStrings([input.sourceId, input.frameRef, input.evidenceRef, input.observationRef]),
      producedRefs: [mailId],
      sourceIds: [input.sourceId],
      evidenceRefs,
    }),
    createdAt,
    updatedAt: createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  mailById.set(mail.mailId, mail);
  for (const superseded of input.supersedesMailIds ?? []) {
    updateMailStatus(superseded, "superseded", createdAt);
  }
  trimThreadMail(input.threadId);
  const visualSourceIntervalMs =
    input.sourceKind === "visual_frame" && typeof input.captureIntervalMs === "number" && input.captureIntervalMs > 0
      ? input.captureIntervalMs
      : null;
  const jobState = upsertStagePlayLiveSourceJobState({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceIds: [input.sourceId],
    lastMailId: mail.mailId,
    nextLoopState: "continue_with_unread_mail",
    nextWakePolicy: visualSourceIntervalMs
      ? {
          sourceKind: input.sourceKind,
          afterMs: visualSourceIntervalMs,
          maxConsecutiveReads: 3,
        }
      : undefined,
    status: "armed",
    updatedAt: createdAt,
  });
  markNarrativeStateStaleAfterMail({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: jobState.jobId,
    sourceId: input.sourceId,
    mailId: mail.mailId,
  });
  markImmersionStateStaleAfterMail({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    jobId: jobState.jobId,
    sourceId: input.sourceId,
    mailId: mail.mailId,
  });
  let wakeRequestId: string | null = null;
  if (jobState.status === "armed" && jobState.nextLoopState === "continue_with_unread_mail") {
    const wake = queueStagePlayLiveSourceMailWakeRequest({
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      jobId: jobState.jobId,
      mailIds: [mail.mailId],
      sourceIds: [input.sourceId],
      reason: "unread_mail",
      evidenceRefs,
      causalTraces: [mail.causalTrace],
      now: createdAt,
    });
    wakeRequestId = wake.wakeRequestId;
  }
  notifyStagePlayLiveSourceMailEnqueued({ mail, jobState, wakeRequestId });
  return mail;
}

export function getStagePlayLiveSourceMailItem(mailId: string): StagePlayLiveSourceMailItemV1 | null {
  return mailById.get(mailId) ?? null;
}

export function listStagePlayLiveSourceMailItems(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
  status?: StagePlayLiveSourceMailStatusV1 | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailItemV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(mailById.values())
    .filter((item) => {
      if (input.threadId && item.threadId !== input.threadId) return false;
      if (input.roomId && item.roomId !== input.roomId) return false;
      if (input.environmentId && item.environmentId !== input.environmentId) return false;
      if (input.sourceId && item.sourceId !== input.sourceId) return false;
      if (input.sourceKind && item.sourceKind !== input.sourceKind) return false;
      if (input.status && item.status !== input.status) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function listStagePlayLiveSourceMailCompactionIntervals(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailCompactionIntervalV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 120));
  return Array.from(mailCompactionIntervalsById.values())
    .filter((interval) => {
      if (input.threadId && interval.threadId !== input.threadId) return false;
      if (input.roomId && interval.roomId !== input.roomId) return false;
      if (input.environmentId && interval.environmentId !== input.environmentId) return false;
      if (input.sourceId && !interval.sourceIds.includes(input.sourceId)) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function getStagePlayLiveSourceMailboxRetentionStats(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
} = {}): StagePlayLiveSourceMailboxRetentionStatsV1 {
  const retainedMail = listStagePlayLiveSourceMailItems({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    limit: MAX_MAIL_PER_THREAD,
  });
  const intervals = listStagePlayLiveSourceMailCompactionIntervals({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    limit: MAX_MAIL_COMPACTION_INTERVALS_PER_THREAD,
  });
  return {
    schema: "stage_play_live_source_mailbox_retention/v1",
    threadId: input.threadId ?? null,
    hotLimit: MAX_MAIL_PER_THREAD,
    retainedMailCount: retainedMail.length,
    compactedIntervalCount: intervals.length,
    compactedMailCount: intervals.reduce((sum, interval) => sum + interval.compactedMailCount, 0),
    oldestRetainedMailId: retainedMail[0]?.mailId ?? null,
    newestRetainedMailId: retainedMail.at(-1)?.mailId ?? null,
    latestCompactionIntervalId: intervals.at(-1)?.intervalId ?? null,
    evidenceRefs: uniqueStrings([
      retainedMail[0]?.mailId,
      retainedMail.at(-1)?.mailId,
      ...intervals.slice(-8).map((interval) => interval.intervalId),
    ]),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function listUnreadStagePlayLiveSourceMailItems(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  sourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
  includeDelivered?: boolean;
  limit?: number;
}): StagePlayLiveSourceMailItemV1[] {
  const statuses: StagePlayLiveSourceMailStatusV1[] = input.includeDelivered
    ? ["unread", "delivered_to_ask"]
    : ["unread"];
  return listStagePlayLiveSourceMailItems({
    ...input,
    limit: input.limit ?? 10,
  }).filter((item) => statuses.includes(item.status));
}

const updateMailStatus = (
  mailId: string,
  status: StagePlayLiveSourceMailStatusV1,
  now = new Date().toISOString(),
): StagePlayLiveSourceMailItemV1 | null => {
  const item = mailById.get(mailId);
  if (!item) return null;
  const updated: StagePlayLiveSourceMailItemV1 = {
    ...item,
    status,
    updatedAt: now,
  };
  mailById.set(mailId, updated);
  return updated;
};

export const markStagePlayMailDeliveredToAsk = (mailIds: string[], now?: string): StagePlayLiveSourceMailItemV1[] =>
  mailIds.map((mailId) => updateMailStatus(mailId, "delivered_to_ask", now)).filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item));

export const markStagePlayMailRead = (mailIds: string[], now?: string): StagePlayLiveSourceMailItemV1[] =>
  mailIds.map((mailId) => updateMailStatus(mailId, "read", now)).filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item));

export const markStagePlayMailDecisionRecorded = (mailIds: string[], now?: string): StagePlayLiveSourceMailItemV1[] =>
  mailIds.map((mailId) => updateMailStatus(mailId, "decision_recorded", now)).filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item));

export function recordStagePlayMailDecision(input: {
  mailIds: string[];
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  decision: StagePlayMailDecisionV1;
  rationalePreview: string;
  textAnswerDraft?: string | null;
  textAnswerTerminalEligible?: boolean | null;
  voiceCalloutDraft?: string | null;
  voiceEligible?: boolean | null;
  voiceRequiresConfirmation?: boolean | null;
  voicePolicy?: StagePlayLiveSourceMailDecisionV1["voicePolicy"];
  requestedTool?: StagePlayLiveSourceMailDecisionV1["requestedTool"];
  nextLoopState?: StagePlayNextLoopStateV1 | null;
  nextExpectedSourceKind?: StagePlayLiveSourceMailDecisionV1["nextExpectedSourceKind"];
  nextExpectedAfterMs?: number | null;
  activeJobId?: string | null;
  interpreterProfileRef?: string | null;
  profileComparisonRefs?: string[];
  matchedCriteria?: string[];
  suppressedCriteria?: string[];
  observedFacts?: string[];
  inferredMeaning?: string[];
  mailCoverage?: StagePlayLiveSourceMailDecisionV1["mailCoverage"] | null;
  rearmReason?: string | null;
  evidenceRefs?: string[];
  modelReviewed?: boolean;
  createdAt?: string;
}): StagePlayLiveSourceMailDecisionV1 {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const mailItems = input.mailIds.map((mailId) => mailById.get(mailId)).filter((item): item is StagePlayLiveSourceMailItemV1 => Boolean(item));
  const evidenceRefs = uniqueStrings([
    ...input.mailIds,
    ...mailItems.flatMap((item) => item.evidenceRefs),
    input.interpreterProfileRef,
    ...(input.profileComparisonRefs ?? []),
    ...(input.evidenceRefs ?? []),
  ]);
  const nextLoopState = input.nextLoopState ?? defaultNextLoopStateForDecision(input.decision);
  const uniqueMailIds = uniqueStrings(input.mailIds);
  const mailCoverage: StagePlayLiveSourceMailDecisionV1["mailCoverage"] = input.mailCoverage ?? {
    readMailIds: uniqueMailIds,
    interpretedMailIds: input.decision === "record_interpretation" ? uniqueMailIds : [],
    compressedMailIds: input.decision === "record_interpretation" && uniqueMailIds.length > 1 ? uniqueMailIds : [],
    skippedMailIds: [],
    mode:
      input.decision !== "record_interpretation"
        ? "latest_only"
        : uniqueMailIds.length <= 1
          ? "latest_only"
          : uniqueMailIds.length <= 5
            ? "chronological_batch"
            : "micro_batch",
    reason:
      input.decision === "record_interpretation"
        ? "Read live-source mail was interpreted as a chronological observation batch."
        : "Decision did not require narrative interpretation of the full mail batch.",
  };
  const jobId = input.activeJobId ?? defaultJobId({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: mailItems[0]?.sourceId ?? null,
  });
  const decisionId = `stage_play_live_source_mail_decision:${hashShort([
    input.threadId,
    input.mailIds,
    input.decision,
    input.rationalePreview,
    createdAt,
  ])}`;
  const decision: StagePlayLiveSourceMailDecisionV1 = {
    artifactId: "stage_play_live_source_mail_decision",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA,
    decisionId,
    mailIds: uniqueMailIds,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    decision: input.decision,
    rationalePreview: previewText(input.rationalePreview || input.decision, 260),
    textAnswerDraft: input.textAnswerDraft
      ? {
          text: input.textAnswerDraft,
          terminalEligible: input.textAnswerTerminalEligible === true,
        }
      : null,
    voiceCalloutDraft: input.voiceCalloutDraft
      ? {
          text: input.voiceCalloutDraft,
          voiceEligible: input.voiceEligible === true,
          requiresConfirmation: input.voiceRequiresConfirmation === true,
        }
      : null,
    voicePolicy: input.voicePolicy ?? null,
    requestedTool: input.requestedTool ?? null,
    nextLoopState,
    nextExpectedSourceKind: input.nextExpectedSourceKind ?? mailItems[0]?.sourceKind ?? "visual_frame",
    nextExpectedAfterMs: input.nextExpectedAfterMs ?? null,
    mailboxCursor: mailItems.at(-1)?.mailId ?? input.mailIds.at(-1) ?? null,
    activeJobId: jobId,
    narrativeStateRef: null,
    narrativeStateId: null,
    interpreterProfileRef: input.interpreterProfileRef ?? null,
    profileComparisonRefs: uniqueStrings(input.profileComparisonRefs ?? []),
    matchedCriteria: uniqueStrings(input.matchedCriteria ?? []),
    suppressedCriteria: uniqueStrings(input.suppressedCriteria ?? []),
    observedFacts: uniqueStrings(input.observedFacts ?? []),
    inferredMeaning: uniqueStrings(input.inferredMeaning ?? []),
    mailCoverage,
    rearmReason: input.rearmReason ?? (nextLoopState === "armed_for_next_summary" ? "decision_recorded_rearm" : null),
    evidenceRefs,
    causalTrace: mergeLiveSourceCausalTraces(mailItems.map((item) => item.causalTrace), {
      parentRefs: input.mailIds,
      causedBy: input.mailIds,
      producedRefs: [decisionId],
      sourceIds: mailItems.map((item) => item.sourceId),
      jobId,
      profileId: input.interpreterProfileRef ?? null,
      evidenceRefs,
    }),
    modelReviewed: input.modelReviewed !== false,
    createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  decisionsById.set(decision.decisionId, decision);
  markStagePlayMailDecisionRecorded(decision.mailIds, createdAt);
  upsertStagePlayLiveSourceJobState({
    jobId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceIds: uniqueStrings(mailItems.map((item) => item.sourceId)),
    status: nextLoopState === "ended"
      ? "ended"
      : nextLoopState === "paused_by_user"
        ? "paused"
        : /^blocked/.test(nextLoopState)
          ? "blocked"
          : "armed",
    mailboxCursor: decision.mailboxCursor,
    lastMailId: decision.mailboxCursor,
    lastDecisionId: decision.decisionId,
    nextLoopState,
    nextWakePolicy: {
      sourceKind: decision.nextExpectedSourceKind,
      afterMs: decision.nextExpectedAfterMs ?? null,
      maxConsecutiveReads: 3,
    },
    updatedAt: createdAt,
  });
  return decision;
}

export function listStagePlayMailDecisions(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  mailId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailDecisionV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(decisionsById.values())
    .filter((decision) => {
      if (input.threadId && decision.threadId !== input.threadId) return false;
      if (input.roomId && decision.roomId !== input.roomId) return false;
      if (input.environmentId && decision.environmentId !== input.environmentId) return false;
      if (input.mailId && !decision.mailIds.includes(input.mailId)) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function getStagePlayMailDecision(decisionId: string): StagePlayLiveSourceMailDecisionV1 | null {
  return decisionsById.get(decisionId) ?? null;
}

export function attachStagePlayNarrativeStateToDecision(input: {
  decisionId: string;
  narrativeStateId: string;
}): StagePlayLiveSourceMailDecisionV1 | null {
  const decision = decisionsById.get(input.decisionId);
  if (!decision) return null;
  const updated: StagePlayLiveSourceMailDecisionV1 = {
    ...decision,
    narrativeStateRef: input.narrativeStateId,
    narrativeStateId: input.narrativeStateId,
    evidenceRefs: uniqueStrings([...decision.evidenceRefs, input.narrativeStateId]),
    causalTrace: mergeLiveSourceCausalTraces([decision.causalTrace], {
      parentRefs: [decision.decisionId],
      producedRefs: [input.narrativeStateId],
      evidenceRefs: [input.narrativeStateId],
    }),
  };
  decisionsById.set(input.decisionId, updated);
  return updated;
}

export function upsertStagePlayLiveSourceJobState(input: {
  jobId?: string | null;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds?: string[];
  objective?: string | null;
  watchJobPolicyRef?: string | null;
  status?: StagePlayLiveSourceJobStateV1["status"];
  mailboxCursor?: string | null;
  lastMailId?: string | null;
  lastDecisionId?: string | null;
  nextLoopState?: StagePlayNextLoopStateV1;
  nextWakePolicy?: Partial<StagePlayLiveSourceJobStateV1["nextWakePolicy"]>;
  updatedAt?: string;
}): StagePlayLiveSourceJobStateV1 {
  const jobId = input.jobId ?? defaultJobId({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceIds?.[0] ?? null,
  });
  const existing = jobStateById.get(jobId);
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const state: StagePlayLiveSourceJobStateV1 = {
    artifactId: "stage_play_live_source_job_state",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA,
    jobId,
    threadId: input.threadId,
    roomId: input.roomId ?? existing?.roomId ?? null,
    environmentId: input.environmentId ?? existing?.environmentId ?? null,
    sourceIds: uniqueStrings([...(existing?.sourceIds ?? []), ...(input.sourceIds ?? [])]),
    objective: input.objective ?? existing?.objective ?? null,
    watchJobPolicyRef: input.watchJobPolicyRef ?? existing?.watchJobPolicyRef ?? null,
    status: input.status ?? existing?.status ?? "armed",
    mailboxCursor: input.mailboxCursor ?? existing?.mailboxCursor ?? null,
    lastMailId: input.lastMailId ?? existing?.lastMailId ?? null,
    lastDecisionId: input.lastDecisionId ?? existing?.lastDecisionId ?? null,
    nextLoopState: input.nextLoopState ?? existing?.nextLoopState ?? "armed_for_next_summary",
    nextWakePolicy: {
      sourceKind: input.nextWakePolicy?.sourceKind ?? existing?.nextWakePolicy.sourceKind ?? "visual_frame",
      afterMs: input.nextWakePolicy?.afterMs ?? existing?.nextWakePolicy.afterMs ?? null,
      maxConsecutiveReads: input.nextWakePolicy?.maxConsecutiveReads ?? existing?.nextWakePolicy.maxConsecutiveReads ?? 3,
    },
    updatedAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  jobStateById.set(jobId, state);
  return state;
}

export function configureStagePlayLiveSourceWatchJobPolicy(input: {
  jobId?: string | null;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds?: string[];
  objectiveText: string;
  decisionPolicyPrompt?: string | null;
  interpretationMode?: StagePlayLiveSourceInterpretationModeV1 | null;
  mailProcessingMode?: StagePlayLiveSourceMailProcessingModeV1 | null;
  outputCadence?: StagePlayLiveSourceOutputCadenceV1 | null;
  outputPolicy?: Partial<StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"]> | null;
  importanceCriteria?: string[];
  suppressCriteria?: string[];
  priorDecisionRefs?: string[];
  priorAnswerRefs?: string[];
  evidenceRefs?: string[];
  status?: StagePlayLiveSourceWatchJobPolicyV1["status"];
  now?: string;
}): {
  policy: StagePlayLiveSourceWatchJobPolicyV1;
  jobState: StagePlayLiveSourceJobStateV1;
} {
  const now = input.now ?? new Date().toISOString();
  const sourceIds = uniqueStrings(input.sourceIds ?? []);
  const jobId = input.jobId ?? defaultJobId({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: sourceIds[0] ?? null,
  });
  const policyId = `stage_play_live_source_watch_job_policy:${hashShort([
    input.threadId,
    input.roomId ?? null,
    input.environmentId ?? null,
    jobId,
    sourceIds,
    input.objectiveText,
  ])}`;
  const existing = watchJobPolicyById.get(policyId);
  const outputPolicy = {
    allowTextAnswer: input.outputPolicy?.allowTextAnswer ?? existing?.outputPolicy.allowTextAnswer ?? true,
    allowVoiceCallout: input.outputPolicy?.allowVoiceCallout ?? existing?.outputPolicy.allowVoiceCallout ?? false,
    voiceRequiresUrgency: input.outputPolicy?.voiceRequiresUrgency ?? existing?.outputPolicy.voiceRequiresUrgency ?? true,
    confirmationRequired: input.outputPolicy?.confirmationRequired ?? existing?.outputPolicy.confirmationRequired ?? true,
  };
  const interpretationMode =
    input.interpretationMode ??
    existing?.interpretationMode ??
    inferStagePlayLiveSourceInterpretationMode({
      objectiveText: input.objectiveText,
      decisionPolicyPrompt: input.decisionPolicyPrompt ?? input.objectiveText,
      outputPolicy,
    });
  const mailProcessingMode =
    input.mailProcessingMode ??
    existing?.mailProcessingMode ??
    inferStagePlayLiveSourceMailProcessingMode({
      objectiveText: input.objectiveText,
      decisionPolicyPrompt: input.decisionPolicyPrompt ?? input.objectiveText,
      interpretationMode,
    });
  const outputCadence =
    input.outputCadence ??
    existing?.outputCadence ??
    inferStagePlayLiveSourceOutputCadence({
      objectiveText: input.objectiveText,
      decisionPolicyPrompt: input.decisionPolicyPrompt ?? input.objectiveText,
      interpretationMode,
      mailProcessingMode,
    });
  const policy: StagePlayLiveSourceWatchJobPolicyV1 = {
    artifactId: "stage_play_live_source_watch_job_policy",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_SCHEMA,
    policyId,
    jobId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceIds,
    objectiveText: input.objectiveText,
    decisionPolicyPrompt: input.decisionPolicyPrompt ?? input.objectiveText,
    interpretationMode,
    mailProcessingMode,
    outputCadence,
    outputPolicy,
    importanceCriteria: uniqueStrings(input.importanceCriteria ?? existing?.importanceCriteria ?? []),
    suppressCriteria: uniqueStrings(input.suppressCriteria ?? existing?.suppressCriteria ?? []),
    status: input.status ?? existing?.status ?? "armed",
    priorDecisionRefs: uniqueStrings(input.priorDecisionRefs ?? existing?.priorDecisionRefs ?? []),
    priorAnswerRefs: uniqueStrings(input.priorAnswerRefs ?? existing?.priorAnswerRefs ?? []),
    evidenceRefs: uniqueStrings([policyId, jobId, ...sourceIds, ...(input.evidenceRefs ?? existing?.evidenceRefs ?? [])]),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  watchJobPolicyById.set(policy.policyId, policy);
  const jobState = upsertStagePlayLiveSourceJobState({
    jobId,
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceIds,
    objective: input.objectiveText,
    watchJobPolicyRef: policy.policyId,
    status: policy.status === "armed" ? "armed" : policy.status,
    nextLoopState: nextLoopStateForWatchPolicyStatus(policy.status),
    updatedAt: now,
  });
  return { policy, jobState };
}

export function getStagePlayLiveSourceWatchJobPolicy(policyId: string): StagePlayLiveSourceWatchJobPolicyV1 | null {
  return watchJobPolicyById.get(policyId) ?? null;
}

export function listStagePlayLiveSourceWatchJobPolicies(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  status?: StagePlayLiveSourceWatchJobPolicyV1["status"] | null;
  limit?: number;
} = {}): StagePlayLiveSourceWatchJobPolicyV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(watchJobPolicyById.values())
    .filter((policy) => {
      if (input.threadId && policy.threadId !== input.threadId) return false;
      if (input.roomId && policy.roomId !== input.roomId) return false;
      if (input.environmentId && policy.environmentId !== input.environmentId) return false;
      if (input.jobId && policy.jobId !== input.jobId) return false;
      if (input.status && policy.status !== input.status) return false;
      return true;
    })
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .slice(-limit);
}

export function listStagePlayLiveSourceJobStates(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceJobStateV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(jobStateById.values())
    .filter((state) => {
      if (input.threadId && state.threadId !== input.threadId) return false;
      if (input.roomId && state.roomId !== input.roomId) return false;
      if (input.environmentId && state.environmentId !== input.environmentId) return false;
      return true;
    })
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .slice(-limit);
}

export function resetStagePlayLiveSourceMailboxForTest(): void {
  mailById.clear();
  decisionsById.clear();
  mailCompactionIntervalsById.clear();
  resetStagePlayLiveSourceImmersionStateStoreForTest();
  resetStagePlayLiveSourceNarrativeStoreForTest();
  jobStateById.clear();
  watchJobPolicyById.clear();
  mailEnqueuedListeners.clear();
}
