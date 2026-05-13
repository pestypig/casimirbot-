import {
  HELIX_CATEGORIZATION_EVENT_SCHEMA,
  type HelixCategorizationCategory,
  type HelixCategorizationEvent,
  type HelixCategorizationSourceFamily,
} from "../../../shared/helix-categorization-event";

export type CreateCategorizationEventInput = {
  thread_id: string;
  source_event_id: string;
  source_family: HelixCategorizationSourceFamily;
  category: HelixCategorizationCategory;
  summary: string;
  confidence?: number;
  evidence_refs?: string[];
  deterministic?: boolean;
  model_invoked?: boolean;
};

const categorizationEventsByThread = new Map<string, HelixCategorizationEvent[]>();

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));
}

export function recordCategorizationEvent(input: CreateCategorizationEventInput): HelixCategorizationEvent {
  const event: HelixCategorizationEvent = {
    schema: HELIX_CATEGORIZATION_EVENT_SCHEMA,
    event_id: newId("categorization"),
    thread_id: input.thread_id,
    source_event_id: input.source_event_id,
    source_family: input.source_family,
    category: input.category,
    summary: input.summary.trim(),
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.8)),
    evidence_refs: uniqueStrings(input.evidence_refs ?? []),
    deterministic: input.deterministic !== false,
    model_invoked: input.model_invoked === true,
    context_policy: "compact_context_pack_only",
    created_at: new Date().toISOString(),
  };
  const existing = categorizationEventsByThread.get(event.thread_id) ?? [];
  categorizationEventsByThread.set(event.thread_id, [...existing, event].slice(-200));
  return event;
}

export function listCategorizationEvents(threadId: string): HelixCategorizationEvent[] {
  return [...(categorizationEventsByThread.get(threadId) ?? [])];
}

export function clearCategorizationEventsForTest(): void {
  categorizationEventsByThread.clear();
}
