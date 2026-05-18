import crypto from "node:crypto";
import {
  HELIX_LIVE_CONTEXT_WINDOW_BINDING_SCHEMA,
  type HelixLiveContextWindowAnchorKind,
  type HelixLiveContextWindowAnchorPolicy,
  type HelixLiveContextWindowBinding,
  type HelixLiveContextWindowExclusionReason,
  type HelixLiveContextWindowTailPolicy,
} from "@shared/helix-live-context-window-binding";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { listObservationJournalEntries } from "./observation-journal-store";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const parseTime = (value: string | null | undefined): number | null => {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const iso = (ms: number): string => new Date(ms).toISOString();

const firstValidTime = (values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const parsed = parseTime(value);
    if (parsed !== null) return iso(parsed);
  }
  return null;
};

const sourceKindForObservation = (entry: HelixObservationJournalEntry): string =>
  entry.modality || entry.role || "observation";

export function buildLiveContextWindowBinding(input: {
  threadId: string;
  turnId: string;
  questionText?: string | null;
  anchorEventId?: string | null;
  anchorSourceId?: string | null;
  anchorKind?: HelixLiveContextWindowAnchorKind;
  anchorPolicy?: HelixLiveContextWindowAnchorPolicy;
  speechStartAt?: string | null;
  speechEndAt?: string | null;
  submittedAt?: string | null;
  serverReceivedAt?: string | null;
  manualAnchorAt?: string | null;
  answerStartedAt?: string | null;
  lookbackMs?: number;
  tailPolicy?: HelixLiveContextWindowTailPolicy;
  staleAfterMs?: number;
  minConfidence?: number;
  observations?: HelixObservationJournalEntry[];
  now?: string | Date;
}): HelixLiveContextWindowBinding {
  const createdAt = input.now instanceof Date
    ? input.now.toISOString()
    : firstValidTime([input.now]) ?? new Date().toISOString();
  const answerStartedAt = firstValidTime([input.answerStartedAt]) ?? createdAt;
  const anchorKind = input.anchorKind ?? "typed_user_prompt";
  const anchorPolicy =
    input.anchorPolicy ??
    (anchorKind === "typed_user_prompt"
      ? "typed_submit"
      : anchorKind === "manual_refresh"
        ? "manual"
        : "speech_end");
  const anchorTs =
    anchorPolicy === "speech_start"
      ? firstValidTime([input.speechStartAt, input.speechEndAt, input.serverReceivedAt, createdAt])
      : anchorPolicy === "speech_end"
        ? firstValidTime([input.speechEndAt, input.speechStartAt, input.serverReceivedAt, createdAt])
        : anchorPolicy === "manual"
          ? firstValidTime([input.manualAnchorAt, input.submittedAt, input.serverReceivedAt, createdAt])
          : anchorPolicy === "typed_submit"
            ? firstValidTime([input.submittedAt, input.serverReceivedAt, createdAt])
            : firstValidTime([input.serverReceivedAt, input.submittedAt, createdAt]);
  const anchorMs = parseTime(anchorTs) ?? Date.parse(createdAt);
  const lookbackMs = Math.max(0, Math.trunc(input.lookbackMs ?? 60_000));
  const fromMs = anchorMs - lookbackMs;
  const answerStartedMs = parseTime(answerStartedAt) ?? Date.parse(createdAt);
  const tailPolicy = input.tailPolicy ?? "strict_past";
  const toMs =
    tailPolicy === "strict_past"
      ? anchorMs
      : Math.max(anchorMs, answerStartedMs);
  const minConfidence = typeof input.minConfidence === "number"
    ? Math.max(0, Math.min(1, input.minConfidence))
    : null;
  const staleAfterMs = Math.max(1, Math.trunc(input.staleAfterMs ?? 120_000));
  const observations = input.observations ?? listObservationJournalEntries({
    threadId: input.threadId,
    limit: 300,
  });
  const included: string[] = [];
  const excluded: Array<{ ref: string; reason: HelixLiveContextWindowExclusionReason }> = [];

  for (const entry of observations) {
    const observedMs = parseTime(entry.observed_at) ?? parseTime(entry.created_at) ?? 0;
    const availableMs = parseTime(entry.available_at) ?? parseTime(entry.ingested_at) ?? parseTime(entry.created_at) ?? 0;
    if (observedMs > toMs) {
      excluded.push({ ref: entry.observation_id, reason: "after_anchor" });
      continue;
    }
    if (observedMs < fromMs) {
      excluded.push({ ref: entry.observation_id, reason: "before_window" });
      continue;
    }
    if (availableMs > answerStartedMs) {
      excluded.push({ ref: entry.observation_id, reason: "not_available_before_answer" });
      continue;
    }
    if (entry.raw_content_included !== false) {
      excluded.push({ ref: entry.observation_id, reason: "raw_content_disallowed" });
      continue;
    }
    if (minConfidence !== null && typeof entry.confidence === "number" && entry.confidence < minConfidence) {
      excluded.push({ ref: entry.observation_id, reason: "low_confidence" });
      continue;
    }
    included.push(entry.observation_id);
  }

  const latestBySource = new Map<string, HelixObservationJournalEntry>();
  for (const entry of observations) {
    const sourceId = entry.source_id || "source:unknown";
    const latest = latestBySource.get(sourceId);
    const entryObserved = parseTime(entry.observed_at) ?? parseTime(entry.created_at) ?? 0;
    const latestObserved = latest ? (parseTime(latest.observed_at) ?? parseTime(latest.created_at) ?? 0) : -1;
    if (!latest || entryObserved > latestObserved) {
      latestBySource.set(sourceId, entry);
    }
  }
  const sourceWatermarks = Array.from(latestBySource.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sourceId, entry]) => {
      const latestObservedMs = parseTime(entry.observed_at) ?? parseTime(entry.created_at);
      const freshnessMs = latestObservedMs === null ? null : Math.max(0, anchorMs - latestObservedMs);
      return {
        source_id: sourceId,
        source_kind: sourceKindForObservation(entry),
        latest_observed_at: entry.observed_at ?? entry.created_at ?? null,
        latest_ingested_at: entry.ingested_at ?? entry.created_at ?? null,
        latest_seq: entry.source_seq ?? null,
        stale: freshnessMs === null ? true : freshnessMs > staleAfterMs,
        freshness_ms: freshnessMs,
      };
    });

  return {
    schema: HELIX_LIVE_CONTEXT_WINDOW_BINDING_SCHEMA,
    binding_id: `live_context_window:${hashShort([
      input.threadId,
      input.turnId,
      anchorTs,
      included,
      excluded,
      tailPolicy,
    ])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    anchor: {
      anchor_event_id: input.anchorEventId?.trim() || input.turnId,
      anchor_source_id: input.anchorSourceId?.trim() || "user_prompt",
      anchor_kind: anchorKind,
      question_text: input.questionText?.trim() || null,
      speech_start_at: firstValidTime([input.speechStartAt]),
      speech_end_at: firstValidTime([input.speechEndAt]),
      submitted_at: firstValidTime([input.submittedAt]),
      anchor_ts: iso(anchorMs),
      anchor_policy: anchorPolicy,
    },
    window: {
      from_ts: iso(fromMs),
      to_ts: iso(toMs),
      lookback_ms: lookbackMs,
      tail_policy: tailPolicy,
      late_evidence_cutoff_at: answerStartedAt,
    },
    source_watermarks: sourceWatermarks,
    included_observation_refs: Array.from(new Set(included)),
    excluded_observation_refs: excluded,
    created_at: createdAt,
    answer_started_at: answerStartedAt,
    context_policy: "compact_context_pack_only",
    raw_audio_included: false,
    raw_transcript_included: false,
    assistant_answer: false,
  };
}
