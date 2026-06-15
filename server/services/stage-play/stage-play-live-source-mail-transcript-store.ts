import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA,
  type AskTurnTranscriptRowDraftV1,
  type LiveSourceCausalTraceV1,
  type StagePlayLiveSourceMailTranscriptEntryV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const transcriptEntryById = new Map<string, StagePlayLiveSourceMailTranscriptEntryV1>();
const transcriptCompactionIntervalsById = new Map<string, StagePlayLiveSourceMailTranscriptCompactionIntervalV1>();
const MAX_TRANSCRIPT_ENTRIES_PER_THREAD = 180;
const MAX_TRANSCRIPT_COMPACTION_INTERVALS_PER_THREAD = 120;
const TRANSCRIPT_COMPACTION_PREVIEW_COUNT = 5;

export type StagePlayLiveSourceMailTranscriptCompactionIntervalV1 = {
  artifactId: "stage_play_live_source_mail_transcript_compaction_interval";
  schemaVersion: "stage_play_live_source_mail_transcript_compaction_interval/v1";
  intervalId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  startEntryId: string;
  endEntryId: string;
  startCreatedAt: string;
  endCreatedAt: string;
  compactedEntryCount: number;
  rowKindCounts: Record<string, number>;
  titles: string[];
  bodyPreviews: string[];
  mailIds: string[];
  sourceIds: string[];
  packetIds: string[];
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailTranscriptRetentionStatsV1 = {
  schema: "stage_play_live_source_mail_transcript_retention/v1";
  threadId?: string | null;
  hotLimit: number;
  retainedEntryCount: number;
  compactedIntervalCount: number;
  compactedEntryCount: number;
  oldestRetainedEntryId?: string | null;
  newestRetainedEntryId?: string | null;
  latestCompactionIntervalId?: string | null;
  evidenceRefs: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const listThreadEntries = (threadId: string): StagePlayLiveSourceMailTranscriptEntryV1[] =>
  Array.from(transcriptEntryById.values())
    .filter((entry) => entry.threadId === threadId)
    .sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.sequence - right.sequence ||
      left.entryId.localeCompare(right.entryId)
    );

const compactText = (value: unknown, limit = 180): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const listThreadCompactionIntervals = (threadId: string): StagePlayLiveSourceMailTranscriptCompactionIntervalV1[] =>
  Array.from(transcriptCompactionIntervalsById.values())
    .filter((interval) => interval.threadId === threadId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

const trimThreadCompactionIntervals = (threadId: string): void => {
  const entries = listThreadCompactionIntervals(threadId);
  if (entries.length <= MAX_TRANSCRIPT_COMPACTION_INTERVALS_PER_THREAD) return;
  for (const entry of entries.slice(0, entries.length - MAX_TRANSCRIPT_COMPACTION_INTERVALS_PER_THREAD)) {
    transcriptCompactionIntervalsById.delete(entry.intervalId);
  }
};

const recordTranscriptCompactionInterval = (
  entries: StagePlayLiveSourceMailTranscriptEntryV1[],
): StagePlayLiveSourceMailTranscriptCompactionIntervalV1 | null => {
  if (entries.length === 0) return null;
  const first = entries[0];
  const last = entries.at(-1) ?? first;
  const rowKindCounts = entries.reduce<Record<string, number>>((counts, entry) => {
    const kind = String(entry.row.rowKind ?? "unknown");
    counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});
  const intervalId = `stage_play_live_source_mail_transcript_compaction_interval:${hashShort([
    first.threadId,
    first.entryId,
    last.entryId,
    entries.length,
  ])}`;
  const interval: StagePlayLiveSourceMailTranscriptCompactionIntervalV1 = {
    artifactId: "stage_play_live_source_mail_transcript_compaction_interval",
    schemaVersion: "stage_play_live_source_mail_transcript_compaction_interval/v1",
    intervalId,
    threadId: first.threadId,
    roomId: first.roomId ?? null,
    environmentId: first.environmentId ?? null,
    startEntryId: first.entryId,
    endEntryId: last.entryId,
    startCreatedAt: first.createdAt,
    endCreatedAt: last.createdAt,
    compactedEntryCount: entries.length,
    rowKindCounts,
    titles: uniqueStrings(entries.slice(-TRANSCRIPT_COMPACTION_PREVIEW_COUNT).map((entry) => compactText(entry.row.title, 120))),
    bodyPreviews: entries
      .slice(-TRANSCRIPT_COMPACTION_PREVIEW_COUNT)
      .map((entry) => compactText(entry.row.body, 80))
      .filter(Boolean),
    mailIds: uniqueStrings(entries.flatMap((entry) => entry.mailIds)).slice(0, 30),
    sourceIds: uniqueStrings(entries.flatMap((entry) => entry.sourceIds)).slice(0, 12),
    packetIds: uniqueStrings(entries.flatMap((entry) => entry.packetIds ?? [])).slice(0, 20),
    evidenceRefs: uniqueStrings([
      ...entries.map((entry) => entry.entryId),
      ...entries.flatMap((entry) => entry.evidenceRefs),
    ]).slice(0, 100),
    createdAt: last.createdAt,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  transcriptCompactionIntervalsById.set(interval.intervalId, interval);
  trimThreadCompactionIntervals(first.threadId);
  return interval;
};

const trimThreadEntries = (threadId: string): void => {
  const entries = listThreadEntries(threadId);
  if (entries.length <= MAX_TRANSCRIPT_ENTRIES_PER_THREAD) return;
  const evicted = entries.slice(0, entries.length - MAX_TRANSCRIPT_ENTRIES_PER_THREAD);
  recordTranscriptCompactionInterval(evicted);
  for (const entry of evicted) {
    transcriptEntryById.delete(entry.entryId);
  }
};

export function recordStagePlayLiveSourceMailTranscriptEntries(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  wakeRequestId?: string | null;
  wakeResultId?: string | null;
  askTurnId?: string | null;
  decisionIds?: string[];
  mailIds?: string[];
  sourceIds?: string[];
  deckPresetId?: string | null;
  deckPresetTitle?: string | null;
  deckRunPlan?: string | null;
  packetIds?: string[];
  deckVerdict?: StagePlayLiveSourceMailTranscriptEntryV1["deckVerdict"];
  rows: AskTurnTranscriptRowDraftV1[];
  evidenceRefs?: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt?: string;
}): StagePlayLiveSourceMailTranscriptEntryV1[] {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const decisionIds = uniqueStrings(input.decisionIds ?? []);
  const mailIds = uniqueStrings(input.mailIds ?? []);
  const sourceIds = uniqueStrings(input.sourceIds ?? []);
  const packetIds = uniqueStrings(input.packetIds ?? []);
  const deckPresetId = input.deckPresetId ?? null;
  const deckPresetTitle = input.deckPresetTitle ?? null;
  const deckRunPlan = input.deckRunPlan ?? null;
  const deckVerdict = input.deckVerdict ?? null;
  const baseEvidenceRefs = uniqueStrings([
    input.wakeRequestId,
    input.wakeResultId,
    input.askTurnId,
    deckPresetId,
    ...decisionIds,
    ...mailIds,
    ...sourceIds,
    ...packetIds,
    ...(input.evidenceRefs ?? []),
  ]);
  const entries = input.rows.map((row, index): StagePlayLiveSourceMailTranscriptEntryV1 => {
    const evidenceRefs = uniqueStrings([...baseEvidenceRefs, ...row.evidenceRefs]);
    const rowPacketIds = uniqueStrings([...packetIds, ...(row.packetIds ?? [])]);
    const entryId = `stage_play_live_source_mail_transcript_entry:${hashShort([
      input.threadId,
      input.wakeRequestId ?? null,
      input.wakeResultId ?? null,
      input.askTurnId ?? null,
      row.rowId,
      row.rowKind,
      index,
    ])}`;
    const causalTrace = mergeLiveSourceCausalTraces([input.causalTrace, row.causalTrace], {
      parentRefs: uniqueStrings([
        input.wakeRequestId,
        input.wakeResultId,
        input.askTurnId,
        ...decisionIds,
        ...mailIds,
        row.source.artifactId,
      ]),
      causedBy: uniqueStrings([row.source.artifactId, ...mailIds]),
      producedRefs: [entryId, row.rowId],
      sourceIds,
      askTurnId: input.askTurnId ?? row.causalTrace?.askTurnId ?? null,
      evidenceRefs,
    });
    return {
      artifactId: "stage_play_live_source_mail_transcript_entry",
      schemaVersion: STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA,
      entryId,
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      wakeRequestId: input.wakeRequestId ?? null,
      wakeResultId: input.wakeResultId ?? null,
      askTurnId: input.askTurnId ?? null,
      decisionIds,
      mailIds,
      sourceIds,
      deckPresetId: row.deckPresetId ?? deckPresetId,
      deckPresetTitle: row.deckPresetTitle ?? deckPresetTitle,
      deckRunPlan: row.deckRunPlan ?? deckRunPlan,
      packetIds: rowPacketIds,
      deckVerdict: row.deckVerdict ?? deckVerdict,
      sequence: index,
      row: {
        ...row,
        deckPresetId: row.deckPresetId ?? deckPresetId,
        deckPresetTitle: row.deckPresetTitle ?? deckPresetTitle,
        deckRunPlan: row.deckRunPlan ?? deckRunPlan,
        packetIds: rowPacketIds,
        deckVerdict: row.deckVerdict ?? deckVerdict,
        evidenceRefs,
        causalTrace,
        assistantAnswer: false,
        terminalEligible: row.terminalEligible === true,
      },
      evidenceRefs,
      causalTrace,
      createdAt: row.createdAt || createdAt,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    };
  });
  for (const entry of entries) {
    transcriptEntryById.set(entry.entryId, entry);
  }
  trimThreadEntries(input.threadId);
  return entries;
}

export function listStagePlayLiveSourceMailTranscriptEntries(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  wakeRequestId?: string | null;
  askTurnId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailTranscriptEntryV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 100, 500));
  return Array.from(transcriptEntryById.values())
    .filter((entry) => {
      if (input.threadId && entry.threadId !== input.threadId) return false;
      if (input.roomId && entry.roomId !== input.roomId) return false;
      if (input.environmentId && entry.environmentId !== input.environmentId) return false;
      if (input.wakeRequestId && entry.wakeRequestId !== input.wakeRequestId) return false;
      if (input.askTurnId && entry.askTurnId !== input.askTurnId) return false;
      return true;
    })
    .sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.sequence - right.sequence ||
      left.entryId.localeCompare(right.entryId)
    )
    .slice(-limit);
}

export function listStagePlayLiveSourceMailTranscriptCompactionIntervals(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  limit?: number;
} = {}): StagePlayLiveSourceMailTranscriptCompactionIntervalV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 120));
  return Array.from(transcriptCompactionIntervalsById.values())
    .filter((interval) => {
      if (input.threadId && interval.threadId !== input.threadId) return false;
      if (input.roomId && interval.roomId !== input.roomId) return false;
      if (input.environmentId && interval.environmentId !== input.environmentId) return false;
      return true;
    })
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function getStagePlayLiveSourceMailTranscriptRetentionStats(input: {
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
} = {}): StagePlayLiveSourceMailTranscriptRetentionStatsV1 {
  const retainedEntries = listStagePlayLiveSourceMailTranscriptEntries({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: MAX_TRANSCRIPT_ENTRIES_PER_THREAD,
  });
  const intervals = listStagePlayLiveSourceMailTranscriptCompactionIntervals({
    threadId: input.threadId ?? null,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    limit: MAX_TRANSCRIPT_COMPACTION_INTERVALS_PER_THREAD,
  });
  return {
    schema: "stage_play_live_source_mail_transcript_retention/v1",
    threadId: input.threadId ?? null,
    hotLimit: MAX_TRANSCRIPT_ENTRIES_PER_THREAD,
    retainedEntryCount: retainedEntries.length,
    compactedIntervalCount: intervals.length,
    compactedEntryCount: intervals.reduce((sum, interval) => sum + interval.compactedEntryCount, 0),
    oldestRetainedEntryId: retainedEntries[0]?.entryId ?? null,
    newestRetainedEntryId: retainedEntries.at(-1)?.entryId ?? null,
    latestCompactionIntervalId: intervals.at(-1)?.intervalId ?? null,
    evidenceRefs: uniqueStrings([
      retainedEntries[0]?.entryId,
      retainedEntries.at(-1)?.entryId,
      ...intervals.slice(-8).map((interval) => interval.intervalId),
    ]),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function resetStagePlayLiveSourceMailTranscriptStoreForTest(): void {
  transcriptEntryById.clear();
  transcriptCompactionIntervalsById.clear();
}
