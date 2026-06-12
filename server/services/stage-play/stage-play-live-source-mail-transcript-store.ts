import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA,
  type AskTurnTranscriptRowDraftV1,
  type LiveSourceCausalTraceV1,
  type StagePlayLiveSourceMailTranscriptEntryV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import { mergeLiveSourceCausalTraces } from "./stage-play-live-source-causal-trace";

const transcriptEntryById = new Map<string, StagePlayLiveSourceMailTranscriptEntryV1>();
const MAX_TRANSCRIPT_ENTRIES_PER_THREAD = 500;

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

const trimThreadEntries = (threadId: string): void => {
  const entries = listThreadEntries(threadId);
  if (entries.length <= MAX_TRANSCRIPT_ENTRIES_PER_THREAD) return;
  for (const entry of entries.slice(0, entries.length - MAX_TRANSCRIPT_ENTRIES_PER_THREAD)) {
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

export function resetStagePlayLiveSourceMailTranscriptStoreForTest(): void {
  transcriptEntryById.clear();
}
