import crypto from "node:crypto";
import type {
  LiveSourceEventKind,
  LiveSourceKind,
  LiveSourceObservation,
} from "@shared/live-source-observation";

const observationsById = new Map<string, LiveSourceObservation>();
const observationIdsByContract = new Map<string, string[]>();
const observationIdsByThread = new Map<string, string[]>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(normalizeString).filter((entry): entry is string => Boolean(entry))))
    : [];

export function makeLiveSourceObservationId(input: {
  sourceId: string;
  sourceKind: LiveSourceKind;
  eventKind: LiveSourceEventKind;
  observedAt: string;
  summary: string;
}): string {
  return `live_source_observation:${hashShort([
    input.sourceId,
    input.sourceKind,
    input.eventKind,
    input.observedAt,
    input.summary,
  ])}`;
}

export function recordLiveSourceObservation(observation: LiveSourceObservation): LiveSourceObservation {
  const sourceId = normalizeString(observation.source_id);
  if (!sourceId) throw new Error("Live source observation requires source_id.");
  const summary = normalizeString(observation.compact_summary);
  if (!summary) throw new Error("Live source observation requires compact_summary.");

  const normalized: LiveSourceObservation = {
    ...observation,
    source_id: sourceId,
    compact_summary: summary,
    evidence_refs: uniqueStrings(observation.evidence_refs),
    job_contract_ids: uniqueStrings(observation.job_contract_ids ?? []),
    assistant_answer: false,
    raw_content_included: false,
  };

  observationsById.set(normalized.observation_id, normalized);

  for (const contractId of normalized.job_contract_ids ?? []) {
    const current = observationIdsByContract.get(contractId) ?? [];
    observationIdsByContract.set(contractId, Array.from(new Set([...current, normalized.observation_id])).slice(-500));
  }
  if (normalized.thread_id) {
    const current = observationIdsByThread.get(normalized.thread_id) ?? [];
    observationIdsByThread.set(normalized.thread_id, Array.from(new Set([...current, normalized.observation_id])).slice(-500));
  }

  return normalized;
}

export function getLiveSourceObservation(observationId: string): LiveSourceObservation | null {
  return observationsById.get(observationId) ?? null;
}

export function listLiveSourceObservations(input: {
  contractId?: string | null;
  threadId?: string | null;
  sourceId?: string | null;
  sourceKind?: string | null;
  eventKind?: string | null;
  limit?: number;
} = {}): LiveSourceObservation[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  const ids = input.contractId
    ? observationIdsByContract.get(input.contractId) ?? []
    : input.threadId
      ? observationIdsByThread.get(input.threadId) ?? []
      : Array.from(observationsById.keys());
  return ids
    .map((id) => observationsById.get(id))
    .filter((entry): entry is LiveSourceObservation => Boolean(entry))
    .filter((entry) => !input.sourceId || entry.source_id === input.sourceId)
    .filter((entry) => !input.sourceKind || entry.source_kind === input.sourceKind)
    .filter((entry) => !input.eventKind || entry.event_kind === input.eventKind)
    .sort((a, b) => a.observed_at.localeCompare(b.observed_at))
    .slice(-limit);
}

export function resetLiveSourceObservationStoreForTest(): void {
  observationsById.clear();
  observationIdsByContract.clear();
  observationIdsByThread.clear();
}
