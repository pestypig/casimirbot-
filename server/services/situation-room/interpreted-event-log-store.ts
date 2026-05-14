import crypto from "node:crypto";
import {
  HELIX_INTERPRETED_EVENT_SCHEMA,
  type HelixInterpretedEvent,
  type HelixInterpretedEventKind,
} from "@shared/helix-interpreted-event-log";

const eventsByThread = new Map<string, HelixInterpretedEvent[]>();
const eventIds = new Set<string>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map(normalizeString).filter((value): value is string => Boolean(value))));

export function makeInterpretedEventId(input: {
  threadId: string;
  kind: HelixInterpretedEventKind;
  sourceId: string;
}): string {
  return `interpreted:${hashShort([input.threadId, input.kind, input.sourceId], 20)}`;
}

export function appendInterpretedEvent(input: {
  event_id?: string;
  thread_id: string;
  room_id?: string | null;
  source_family?: string | null;
  kind: HelixInterpretedEventKind;
  title: string;
  summary: string;
  confidence?: number | null;
  evidence_refs?: string[];
  source_event_ids?: string[];
  related_artifact_ids?: string[];
  related_job_ids?: string[];
  model_invoked?: boolean;
  deterministic?: boolean;
  created_at?: string;
}): HelixInterpretedEvent {
  const threadId = normalizeString(input.thread_id);
  if (!threadId) throw new Error("Interpreted event requires thread_id.");
  const eventId = input.event_id ?? makeInterpretedEventId({
    threadId,
    kind: input.kind,
    sourceId: `${input.title}:${input.created_at ?? input.summary}`,
  });
  const event: HelixInterpretedEvent = {
    schema: HELIX_INTERPRETED_EVENT_SCHEMA,
    event_id: eventId,
    thread_id: threadId,
    room_id: normalizeString(input.room_id),
    source_family: normalizeString(input.source_family),
    kind: input.kind,
    title: input.title.trim(),
    summary: input.summary.trim(),
    confidence: typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : null,
    evidence_refs: uniqueStrings(input.evidence_refs ?? []),
    source_event_ids: uniqueStrings(input.source_event_ids ?? []),
    related_artifact_ids: uniqueStrings(input.related_artifact_ids ?? []),
    related_job_ids: uniqueStrings(input.related_job_ids ?? []),
    created_at: input.created_at ?? new Date().toISOString(),
    model_invoked: input.model_invoked === true,
    deterministic: input.deterministic !== false,
    assistant_answer: false,
    raw_logs_included: false,
    context_policy: "compact_context_pack_only",
  };
  if (eventIds.has(event.event_id)) return getInterpretedEvent(event.event_id) ?? event;
  eventIds.add(event.event_id);
  const existing = eventsByThread.get(event.thread_id) ?? [];
  eventsByThread.set(event.thread_id, [...existing, event].slice(-500));
  return event;
}

export function getInterpretedEvent(eventId: string): HelixInterpretedEvent | null {
  for (const events of eventsByThread.values()) {
    const found = events.find((event) => event.event_id === eventId);
    if (found) return found;
  }
  return null;
}

export function listInterpretedEvents(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): HelixInterpretedEvent[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  return [...(eventsByThread.get(input.threadId) ?? [])]
    .filter((event) => !input.roomId || event.room_id === input.roomId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function clearInterpretedEventLogForTest(): void {
  eventsByThread.clear();
  eventIds.clear();
}
