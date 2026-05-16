import crypto from "node:crypto";
import {
  HELIX_LIVE_SOURCE_PRODUCER_LIFECYCLE_EVENT_SCHEMA,
  type HelixLiveSourceProducerLifecycleEvent,
  type HelixLiveSourceProducerLifecycleKind,
  type HelixLiveSourceProducerLifecycleStatus,
} from "@shared/helix-live-source-producer-lifecycle";

const eventsByProducerId = new Map<string, HelixLiveSourceProducerLifecycleEvent[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const nowIso = (): string => new Date().toISOString();

export function recordLiveSourceProducerLifecycleEvent(input: {
  producerId: string;
  sourceId: string;
  threadId: string;
  environmentId?: string | null;
  pipelineId?: string | null;
  kind: HelixLiveSourceProducerLifecycleKind;
  status?: HelixLiveSourceProducerLifecycleStatus;
  summary: string;
  relatedIds?: string[];
  createdAt?: string | null;
}): HelixLiveSourceProducerLifecycleEvent {
  const createdAt = input.createdAt ?? nowIso();
  const event: HelixLiveSourceProducerLifecycleEvent = {
    schema: HELIX_LIVE_SOURCE_PRODUCER_LIFECYCLE_EVENT_SCHEMA,
    event_id: `producer_lifecycle:${hashShort([input.producerId, input.kind, createdAt, input.relatedIds ?? []])}`,
    producer_id: input.producerId,
    source_id: input.sourceId,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    kind: input.kind,
    status: input.status ?? "ok",
    summary: input.summary,
    related_ids: input.relatedIds ?? [],
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  const existing = eventsByProducerId.get(input.producerId) ?? [];
  eventsByProducerId.set(input.producerId, [...existing, event].slice(-300));
  return event;
}

export function listLiveSourceProducerLifecycleEvents(input: {
  producerId: string;
  limit?: number;
}): HelixLiveSourceProducerLifecycleEvent[] {
  return [...(eventsByProducerId.get(input.producerId) ?? [])]
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .slice(-(input.limit ?? 120));
}

export function resetLiveSourceProducerLifecycleForTest(): void {
  eventsByProducerId.clear();
}
