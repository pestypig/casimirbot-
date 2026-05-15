import crypto from "node:crypto";
import {
  HELIX_LIVE_PIPELINE_LIFECYCLE_EVENT_SCHEMA,
  type HelixLivePipelineLifecycleEvent,
  type HelixLivePipelineLifecycleKind,
  type HelixLivePipelineLifecycleStatus,
} from "@shared/helix-live-pipeline-lifecycle";

const eventsByPipeline = new Map<string, HelixLivePipelineLifecycleEvent[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)));

export function recordLivePipelineLifecycleEvent(input: {
  pipelineId: string;
  threadId: string;
  environmentId?: string | null;
  kind: HelixLivePipelineLifecycleKind;
  status: HelixLivePipelineLifecycleStatus;
  summary: string;
  relatedIds?: unknown[];
  evidenceRefs?: unknown[];
  now?: string;
}): HelixLivePipelineLifecycleEvent {
  const createdAt = input.now ?? new Date().toISOString();
  const event: HelixLivePipelineLifecycleEvent = {
    schema: HELIX_LIVE_PIPELINE_LIFECYCLE_EVENT_SCHEMA,
    event_id: `live_pipeline_lifecycle:${hashShort([
      input.pipelineId,
      input.kind,
      input.status,
      input.summary,
      createdAt,
    ])}`,
    pipeline_id: input.pipelineId,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    kind: input.kind,
    status: input.status,
    summary: input.summary,
    related_ids: uniqueStrings(input.relatedIds ?? []),
    evidence_refs: uniqueStrings(input.evidenceRefs ?? []),
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  eventsByPipeline.set(input.pipelineId, [
    ...(eventsByPipeline.get(input.pipelineId) ?? []),
    event,
  ].slice(-300));
  return event;
}

export function listLivePipelineLifecycleEvents(input: {
  pipelineId?: string | null;
  threadId?: string | null;
  limit?: number;
} = {}): HelixLivePipelineLifecycleEvent[] {
  const events = input.pipelineId
    ? [...(eventsByPipeline.get(input.pipelineId) ?? [])]
    : Array.from(eventsByPipeline.values()).flat();
  return events
    .filter((event: HelixLivePipelineLifecycleEvent) => !input.threadId || event.thread_id === input.threadId)
    .slice(-(input.limit ?? 100));
}

export function resetLivePipelineLifecycleForTest(): void {
  eventsByPipeline.clear();
}
