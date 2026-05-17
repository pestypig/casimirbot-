import crypto from "node:crypto";
import {
  HELIX_OBSERVATION_JOURNAL_ENTRY_SCHEMA,
  type HelixObservationJournalEntry,
  type HelixObservationJournalRole,
} from "@shared/helix-observation-journal";

const observationsByThread = new Map<string, HelixObservationJournalEntry[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

const normalizeRole = (value: unknown): HelixObservationJournalRole => {
  if (
    value === "raw_source_event" ||
    value === "model_perception_observation" ||
    value === "tool_observation" ||
    value === "client_capability_observation"
  ) return value;
  throw new Error("observation_journal_invalid_role");
};

const forbiddenObservationTerms = /\b(?:strategy|goal|intent|risk conclusion|final answer|should do|next objective)\b/i;

export function appendObservationJournalEntry(input: Record<string, unknown>): HelixObservationJournalEntry {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const text = cleanString(input.text ?? input.summary);
  if (!threadId) throw new Error("observation_journal_requires_thread_id");
  if (!text) throw new Error("observation_journal_requires_text");
  const role = normalizeRole(input.role ?? input.kind);
  if (role === "model_perception_observation" && input.model_invoked !== true) {
    throw new Error("model_perception_observation_requires_model_invoked");
  }
  if (role === "raw_source_event" && forbiddenObservationTerms.test(text)) {
    throw new Error("plain_log_rejects_inferred_intent");
  }
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const entry: HelixObservationJournalEntry = {
    schema: HELIX_OBSERVATION_JOURNAL_ENTRY_SCHEMA,
    observation_id: cleanString(input.observation_id ?? input.observationId) ?? `observation:${hashShort([threadId, role, text, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    source_id: cleanString(input.source_id ?? input.sourceId),
    role,
    modality: cleanString(input.modality),
    text,
    evidence_refs: cleanStrings(input.evidence_refs ?? input.evidenceRefs),
    model_invoked: input.model_invoked === true,
    confidence: typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : null,
    raw_image_ref: cleanString(input.raw_image_ref ?? input.rawImageRef),
    raw_content_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  observationsByThread.set(threadId, [...(observationsByThread.get(threadId) ?? []), entry].slice(-500));
  return entry;
}

export function listObservationJournalEntries(input: {
  threadId: string;
  roomId?: string | null;
  limit?: number;
}): HelixObservationJournalEntry[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(300, Math.trunc(input.limit ?? 100))) : 100;
  return [...(observationsByThread.get(input.threadId) ?? [])]
    .filter((entry) => !input.roomId || entry.room_id === input.roomId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetObservationJournalForTest(): void {
  observationsByThread.clear();
}
