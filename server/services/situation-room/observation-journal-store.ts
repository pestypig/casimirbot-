import crypto from "node:crypto";
import {
  HELIX_OBSERVATION_JOURNAL_ENTRY_SCHEMA,
  type HelixObservationJournalEntry,
  type HelixObservationJournalRole,
} from "@shared/helix-observation-journal";
import { observeSourceBindingState, upsertSourceBindingStatus, listSourceBindingStatuses } from "./source-binding-status-store";

const observationsByThread = new Map<string, HelixObservationJournalEntry[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

const normalizeTimestamp = (value: unknown, fallback: string): string => {
  const raw = cleanString(value);
  if (!raw) return fallback;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
};

const normalizeRole = (value: unknown): HelixObservationJournalRole => {
  if (
    value === "raw_source_event" ||
    value === "model_perception_observation" ||
    value === "tool_observation" ||
    value === "client_capability_observation" ||
    value === "transcript_observation" ||
    value === "reference_observation"
  ) return value;
  throw new Error("observation_journal_invalid_role");
};

const forbiddenObservationTerms = /\b(?:strategy|goal|intent|risk conclusion|final answer|should do|next objective)\b/i;

const inferActiveSourceBindingId = (input: {
  threadId: string;
  sourceId: string | null;
  environmentId?: string | null;
  observedAt?: string | null;
}): string | null => {
  if (!input.sourceId) return null;
  const observedMs = Date.parse(String(input.observedAt ?? ""));
  return listSourceBindingStatuses({
    threadId: input.threadId,
    sourceId: input.sourceId,
    limit: 20,
  }).reverse().find((status) =>
    (status.state === "bound" || status.state === "repair_applied") &&
    status.binding_id &&
    (
      !Number.isFinite(observedMs) ||
      Date.parse(status.updated_at) <= observedMs ||
      status.replay_policy === "explicit_replay_window"
    ) &&
    (!input.environmentId || !status.environment_id || status.environment_id === input.environmentId)
  )?.binding_id ?? null;
};

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
  const now = normalizeTimestamp(input.created_at ?? input.createdAt, new Date().toISOString());
  const observedAt = normalizeTimestamp(input.observed_at ?? input.observedAt ?? input.event_ts ?? input.eventTs, now);
  const ingestedAt = normalizeTimestamp(input.ingested_at ?? input.ingestedAt, now);
  const availableAt = normalizeTimestamp(input.available_at ?? input.availableAt ?? input.finalized_at ?? input.finalizedAt, ingestedAt);
  const sourceId = cleanString(input.source_id ?? input.sourceId);
  const environmentId = cleanString(input.environment_id ?? input.environmentId);
  const sourceBindingId =
    cleanString(input.source_binding_id ?? input.sourceBindingId) ??
    inferActiveSourceBindingId({ threadId, sourceId, environmentId, observedAt });
  const entry: HelixObservationJournalEntry = {
    schema: HELIX_OBSERVATION_JOURNAL_ENTRY_SCHEMA,
    observation_id: cleanString(input.observation_id ?? input.observationId) ?? `observation:${hashShort([threadId, role, text, now])}`,
    thread_id: threadId,
    room_id: cleanString(input.room_id ?? input.roomId),
    source_id: sourceId,
    role,
    modality: cleanString(input.modality),
    text,
    evidence_refs: cleanStrings(input.evidence_refs ?? input.evidenceRefs),
    source_identity_ref: cleanString(input.source_identity_ref ?? input.sourceIdentityRef),
    model_invoked: input.model_invoked === true,
    confidence: typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : null,
    observed_at: observedAt,
    ingested_at: ingestedAt,
    available_at: availableAt,
    source_seq: typeof input.source_seq === "number" && Number.isFinite(input.source_seq)
      ? Math.trunc(input.source_seq)
      : typeof input.sourceSeq === "number" && Number.isFinite(input.sourceSeq)
        ? Math.trunc(input.sourceSeq)
        : null,
    replay_status:
      input.replay_status === "replayed"
        ? "replayed"
        : input.replay_status === "live"
          ? "live"
          : null,
    source_binding_id: sourceBindingId,
    source_epoch: typeof input.source_epoch === "number" && Number.isFinite(input.source_epoch)
      ? Math.max(1, Math.trunc(input.source_epoch))
      : typeof input.sourceEpoch === "number" && Number.isFinite(input.sourceEpoch)
        ? Math.max(1, Math.trunc(input.sourceEpoch))
        : null,
    raw_image_ref: cleanString(input.raw_image_ref ?? input.rawImageRef),
    raw_content_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  observationsByThread.set(threadId, [...(observationsByThread.get(threadId) ?? []), entry].slice(-500));
  if (entry.source_id && entry.modality) {
    if (entry.source_binding_id) {
      const boundStatus = listSourceBindingStatuses({
        threadId,
        sourceId: entry.source_id,
        limit: 20,
      }).reverse().find((status) => status.binding_id === entry.source_binding_id);
      if (boundStatus) {
        upsertSourceBindingStatus({
          thread_id: boundStatus.thread_id,
          source_id: boundStatus.source_id,
          source_kind: boundStatus.source_kind,
          modality: boundStatus.modality,
          situation_run_id: boundStatus.situation_run_id,
          environment_id: boundStatus.environment_id,
          binding_id: boundStatus.binding_id,
          state: boundStatus.state,
          replay_policy: boundStatus.replay_policy,
          latest_observation_refs: [entry.observation_id],
          terminal_eligible: boundStatus.terminal_eligible,
        });
      }
    } else {
      observeSourceBindingState({
        threadId,
        sourceId: entry.source_id,
        modality: entry.modality,
        observationRef: entry.observation_id,
        evidenceRefs: entry.evidence_refs,
        now,
      });
    }
  }
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
