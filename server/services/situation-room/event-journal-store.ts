import crypto from "node:crypto";
import {
  HELIX_EVENT_JOURNAL_QUERY_RESULT_SCHEMA,
  HELIX_EVENT_JOURNAL_RECORD_SCHEMA,
  type HelixEventJournalQuery,
  type HelixEventJournalQueryResult,
  type HelixEventJournalRecord,
  type HelixEventJournalSourceFamily,
} from "@shared/helix-event-journal-query";
import type { HelixWorldEvent } from "@shared/helix-world-event";

const records: HelixEventJournalRecord[] = [];
const recordsById = new Map<string, HelixEventJournalRecord>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)));

const inferSourceFamily = (event: HelixWorldEvent): HelixEventJournalSourceFamily =>
  event.world_id.startsWith("minecraft:") || event.room_id.includes("minecraft")
    ? "minecraft"
    : "unknown";

const compactSummary = (event: HelixWorldEvent): string => {
  const actor = event.actor_label ?? event.actor_id ?? "world";
  const location = event.location && typeof event.location === "object"
    ? event.location as Record<string, unknown>
    : null;
  const x = typeof location?.x === "number" ? location.x : null;
  const y = typeof location?.y === "number" ? location.y : null;
  const z = typeof location?.z === "number" ? location.z : null;
  const where = x !== null && y !== null && z !== null ? ` at ${x},${y},${z}` : "";
  return `${actor} emitted ${event.event_type}${where}.`;
};

export function recordEventJournalEvent(input: {
  event: HelixWorldEvent;
  threadId?: string | null;
  sourceFamily?: HelixEventJournalSourceFamily;
}): HelixEventJournalRecord {
  const event = input.event;
  const journalEventId = `event_journal:${hashShort([
    event.world_id,
    event.room_id,
    event.source_id ?? null,
    event.event_type,
    event.ts,
    event.actor_id ?? event.actor_label ?? null,
    event.evidence_refs,
  ])}`;
  const existing = recordsById.get(journalEventId);
  if (existing) {
    const next: HelixEventJournalRecord = {
      ...existing,
      thread_id: existing.thread_id ?? input.threadId ?? null,
    };
    recordsById.set(journalEventId, next);
    const index = records.findIndex((record: HelixEventJournalRecord) => record.journal_event_id === journalEventId);
    if (index >= 0) records[index] = next;
    return next;
  }
  const record: HelixEventJournalRecord = {
    schema: HELIX_EVENT_JOURNAL_RECORD_SCHEMA,
    journal_event_id: journalEventId,
    source_family: input.sourceFamily ?? inferSourceFamily(event),
    room_id: event.room_id,
    source_id: event.source_id ?? null,
    world_id: event.world_id,
    thread_id: input.threadId ?? null,
    event_type: event.event_type,
    actor_id: event.actor_id ?? null,
    actor_label: event.actor_label ?? null,
    ts: event.ts,
    evidence_refs: uniqueStrings(event.evidence_refs ?? []),
    compact_summary: compactSummary(event),
    raw_event: event,
    raw_content_included: true,
    assistant_answer: false,
  };
  records.push(record);
  recordsById.set(journalEventId, record);
  if (records.length > 5000) {
    const removed = records.splice(0, records.length - 5000);
    for (const entry of removed) recordsById.delete(entry.journal_event_id);
  }
  return record;
}

const toPublicRecord = (record: HelixEventJournalRecord, includeRaw: boolean): HelixEventJournalRecord => ({
  ...record,
  raw_event: includeRaw ? record.raw_event : undefined,
  raw_content_included: includeRaw,
});

export function queryEventJournal(input: Partial<HelixEventJournalQuery> & {
  query_id?: string;
}): HelixEventJournalQueryResult {
  const includeRaw = input.include_raw_events === true;
  const eventTypeSet = new Set(input.event_types ?? []);
  const fromMs = input.from_ts ? Date.parse(input.from_ts) : null;
  const toMs = input.to_ts ? Date.parse(input.to_ts) : null;
  const matches = records.filter((record: HelixEventJournalRecord) => {
    if (input.source_family && record.source_family !== input.source_family) return false;
    if (input.thread_id && record.thread_id !== input.thread_id) return false;
    if (input.room_id && record.room_id !== input.room_id) return false;
    if (input.source_id && record.source_id !== input.source_id) return false;
    if (input.world_id && record.world_id !== input.world_id) return false;
    if (input.actor_id && record.actor_id !== input.actor_id) return false;
    if (eventTypeSet.size > 0 && !eventTypeSet.has(record.event_type)) return false;
    const tsMs = Date.parse(record.ts);
    if (fromMs !== null && Number.isFinite(fromMs) && tsMs < fromMs) return false;
    if (toMs !== null && Number.isFinite(toMs) && tsMs > toMs) return false;
    return true;
  });
  const limit = typeof input.limit === "number" && input.limit > 0 ? input.limit : 50;
  const selected = matches.slice(-limit);
  return {
    schema: HELIX_EVENT_JOURNAL_QUERY_RESULT_SCHEMA,
    query_id: input.query_id ?? `event_journal_query:${hashShort([input, Date.now()], 12)}`,
    matched_count: matches.length,
    returned_count: selected.length,
    events: selected.map((record: HelixEventJournalRecord) => toPublicRecord(record, includeRaw)),
    raw_content_included: includeRaw,
    assistant_answer: false,
    context_policy: includeRaw ? "debug_or_replay_only" : "compact_context_pack_only",
    created_at: new Date().toISOString(),
  };
}

export function clearEventJournalForTest(): void {
  records.splice(0, records.length);
  recordsById.clear();
}
