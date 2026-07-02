import type { DocumentTranslationUnit } from "@shared/document-translation";
import type { HelixAskLiveEventBusPayload } from "@/lib/helix/liveEventsBus";
import {
  buildDocumentLiveTranslationInlineStates,
  mergeDocumentLiveTranslationInlineStates,
  sameDocumentInlineTranslationRenderState,
  type DocumentInlineTranslationRenderState,
} from "@/lib/docs/liveTranslationInlineProjection";
import { documentMarkdownSourceId } from "@/lib/docs/documentTranslationClient";

export type DocumentLiveTranslationProjectionRegistryKey = {
  docPath: string;
  locale: string;
  projectionTarget?: string | null;
};

export type IngestDocumentLiveTranslationProjectionInput = DocumentLiveTranslationProjectionRegistryKey & {
  payload: unknown;
  units: DocumentTranslationUnit[];
  allowStaleDisplayText?: boolean;
};

export type IngestDocumentLiveTranslationProjectionLiveEventInput = DocumentLiveTranslationProjectionRegistryKey & {
  eventPayload: HelixAskLiveEventBusPayload;
  units: DocumentTranslationUnit[];
  allowStaleDisplayText?: boolean;
};

export type DocumentLiveTranslationProjectionSnapshot = {
  version: number;
  translations: Record<string, DocumentInlineTranslationRenderState>;
};

export type DocumentLiveTranslationProjectionSnapshotSummary = {
  version: number;
  totalCount: number;
  readyCount: number;
  errorCount: number;
  projectedCount: number;
  staleCount: number;
  cancelledCount: number;
  failedCount: number;
  latestObservedAtMs: number | null;
  latestSourceEventMs: number | null;
  latestObservationRef: string | null;
  latestReceiptRef: string | null;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

const DEFAULT_PROJECTION_TARGET = "docs_chunk";
const emptySnapshot: DocumentLiveTranslationProjectionSnapshot = {
  version: 0,
  translations: {},
};

let registryVersion = 0;
const snapshots = new Map<string, DocumentLiveTranslationProjectionSnapshot>();
const listeners = new Set<() => void>();

const normalizeText = (value: string | null | undefined): string =>
  typeof value === "string" ? value.trim() : "";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;

const readBoolean = (value: unknown): boolean =>
  value === true;

export function documentLiveTranslationProjectionRegistryKey(
  input: DocumentLiveTranslationProjectionRegistryKey,
): string {
  return [
    normalizeText(input.docPath),
    normalizeText(input.locale).toLowerCase(),
    normalizeText(input.projectionTarget) || DEFAULT_PROJECTION_TARGET,
  ].join("|");
}

export function readDocumentLiveTranslationProjectionSnapshot(
  input: DocumentLiveTranslationProjectionRegistryKey,
): DocumentLiveTranslationProjectionSnapshot {
  return snapshots.get(documentLiveTranslationProjectionRegistryKey(input)) ?? emptySnapshot;
}

export function summarizeDocumentLiveTranslationProjectionSnapshot(
  snapshot: DocumentLiveTranslationProjectionSnapshot,
): DocumentLiveTranslationProjectionSnapshotSummary {
  const states = Object.values(snapshot.translations);
  const ordered = [...states].sort((left, right) => {
    const observedDelta =
      (right.observedAtMs ?? Number.MIN_SAFE_INTEGER) -
      (left.observedAtMs ?? Number.MIN_SAFE_INTEGER);
    if (observedDelta !== 0) return observedDelta;
    return (right.sourceEventMs ?? Number.MIN_SAFE_INTEGER) -
      (left.sourceEventMs ?? Number.MIN_SAFE_INTEGER);
  });
  const latest = ordered[0] ?? null;
  return {
    version: snapshot.version,
    totalCount: states.length,
    readyCount: states.filter((state) => state.status === "ready").length,
    errorCount: states.filter((state) => state.status === "error").length,
    projectedCount: states.filter((state) => state.projectionStatus === "projected").length,
    staleCount: states.filter((state) => state.projectionStatus === "stale").length,
    cancelledCount: states.filter((state) => state.projectionStatus === "cancelled").length,
    failedCount: states.filter((state) => state.projectionStatus === "failed").length,
    latestObservedAtMs: latest?.observedAtMs ?? null,
    latestSourceEventMs: latest?.sourceEventMs ?? null,
    latestObservationRef: latest?.observationRef ?? null,
    latestReceiptRef: latest?.receiptRef ?? null,
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
}

export function subscribeDocumentLiveTranslationProjectionRegistry(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDocumentLiveTranslationProjectionRegistry(): void {
  if (snapshots.size === 0) return;
  snapshots.clear();
  registryVersion += 1;
  emitRegistryChange();
}

export function ingestDocumentLiveTranslationProjection(
  input: IngestDocumentLiveTranslationProjectionInput,
): DocumentLiveTranslationProjectionSnapshot {
  const key = documentLiveTranslationProjectionRegistryKey(input);
  const current = snapshots.get(key) ?? emptySnapshot;
  const laneStates = buildDocumentLiveTranslationInlineStates({
    payload: input.payload,
    docPath: input.docPath,
    locale: input.locale,
    units: input.units,
    projectionTarget: input.projectionTarget ?? DEFAULT_PROJECTION_TARGET,
    allowStaleDisplayText: input.allowStaleDisplayText,
  });
  const translations = mergeDocumentLiveTranslationInlineStates({
    current: current.translations,
    laneStates,
  });
  const changed = !sameTranslationStateMap(current.translations, translations);
  if (!changed) return current;
  const snapshot = {
    version: ++registryVersion,
    translations,
  };
  snapshots.set(key, snapshot);
  emitRegistryChange();
  return snapshot;
}

export function ingestDocumentLiveTranslationProjectionFromAskLiveEvent(
  input: IngestDocumentLiveTranslationProjectionLiveEventInput,
): DocumentLiveTranslationProjectionSnapshot {
  const meta = readRecord(input.eventPayload.entry.meta);
  const sourceEventType = readString(meta?.source_event_type);
  const lane = readString(meta?.lane);
  const sourceId = readString(meta?.sourceId ?? meta?.source_id);
  const docSourceId = documentMarkdownSourceId(input.docPath);
  if (sourceEventType !== "ui_translation_projection" || lane !== "live_translation" || sourceId !== docSourceId) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }

  const projectionTarget =
    readString(meta?.latestProjectionTarget ?? meta?.latest_projection_target) ||
    normalizeText(input.projectionTarget) ||
    DEFAULT_PROJECTION_TARGET;
  const targetLanguage = readString(meta?.targetLanguage ?? meta?.target_language) || normalizeText(input.locale);
  if (
    normalizeText(targetLanguage).toLowerCase() !== normalizeText(input.locale).toLowerCase()
  ) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }
  const payload = {
    capability_lane_projection_receipts: [
      {
        schema: "helix.live_translation.projection_receipt.v1",
        receipt_ref: readString(meta?.receiptRef ?? meta?.receipt_ref) || null,
        observation_ref: readString(meta?.observationRef ?? meta?.observation_ref) || null,
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        projection_target: projectionTarget,
        projection_status: readString(meta?.projectionStatus ?? meta?.projection_status) || "projected",
        source_id: sourceId,
        chunk_id: readString(meta?.latestChunkId ?? meta?.latest_chunk_id) || null,
        chunk_index: readNumber(meta?.latestChunkIndex ?? meta?.latest_chunk_index),
        dedupe_key: readString(meta?.latestDedupeKey ?? meta?.latest_dedupe_key) || null,
        source_event_id: readString(meta?.latestSourceEventId ?? meta?.latest_source_event_id) || null,
        source_event_ms: readNumber(meta?.latestSourceEventMs ?? meta?.latest_source_event_ms),
        observed_at_ms: readNumber(meta?.latestObservedAtMs ?? meta?.latest_observed_at_ms),
        freshness_status: readString(meta?.latestFreshnessStatus ?? meta?.latest_freshness_status) || "unknown",
        target_language: targetLanguage,
        translated_text: readString(meta?.translatedText ?? meta?.translated_text) || null,
        cancel_requested: readBoolean(meta?.latestCancelRequested ?? meta?.latest_cancel_requested),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    ],
  };

  return ingestDocumentLiveTranslationProjection({
    docPath: input.docPath,
    locale: input.locale,
    projectionTarget,
    units: input.units,
    payload,
    allowStaleDisplayText: input.allowStaleDisplayText,
  });
}

function emitRegistryChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function sameTranslationStateMap(
  left: Record<string, DocumentInlineTranslationRenderState>,
  right: Record<string, DocumentInlineTranslationRenderState>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    const leftState = left[key];
    const rightState = right[key];
    if (!sameDocumentInlineTranslationRenderState(leftState, rightState)) return false;
  }
  return true;
}
