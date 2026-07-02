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
  laneSessions: Record<string, DocumentLiveTranslationLaneSessionState>;
  mailLoops: Record<string, DocumentLiveTranslationMailLoopState>;
  goalBindings: Record<string, DocumentLiveTranslationGoalBindingState>;
};

export type DocumentLiveTranslationLaneSessionState = {
  laneSessionId: string;
  laneId: string;
  sessionStatus: string;
  sessionHealth: string;
  sourceId: string | null;
  sourceKind: string | null;
  projectionTarget: string | null;
  accountLocale: string | null;
  targetLanguage: string | null;
  selectedBackendProvider: string | null;
  latestChunkId: string | null;
  latestChunkIndex: number | null;
  latestDedupeKey: string | null;
  latestSourceEventId: string | null;
  latestSourceEventMs: number | null;
  latestObservedAtMs: number | null;
  latestFreshnessStatus: string | null;
  lastObservationRef: string | null;
  lastReceiptRef: string | null;
  updatedAtMs: number | null;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type DocumentLiveTranslationMailLoopState = {
  mailLoopId: string;
  laneSessionId: string | null;
  laneId: string;
  stagePlayMailId: string | null;
  stagePlayWakeExpected: boolean;
  mailboxThreadId: string | null;
  mailStatus: string | null;
  blockedReason: string | null;
  sourceId: string | null;
  sourceKind: string | null;
  projectionTarget: string | null;
  accountLocale: string | null;
  targetLanguage: string | null;
  selectedBackendProvider: string | null;
  latestChunkId: string | null;
  latestChunkIndex: number | null;
  latestDedupeKey: string | null;
  latestSourceEventId: string | null;
  latestSourceEventMs: number | null;
  latestObservedAtMs: number | null;
  latestFreshnessStatus: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type DocumentLiveTranslationGoalBindingState = {
  goalBindingId: string;
  goalId: string | null;
  laneSessionId: string | null;
  laneId: string;
  bindingStatus: string | null;
  sessionStatus: string | null;
  sessionHealth: string | null;
  activationPolicy: string | null;
  attentionPolicy: string | null;
  stopCondition: string | null;
  reportPolicy: string | null;
  quietBehavior: string | null;
  reportAction: string | null;
  reportReason: string | null;
  selectedBackendProvider: string | null;
  sourceId: string | null;
  sourceKind: string | null;
  projectionTarget: string | null;
  accountLocale: string | null;
  targetLanguage: string | null;
  latestChunkId: string | null;
  latestChunkIndex: number | null;
  latestDedupeKey: string | null;
  latestSourceEventId: string | null;
  latestSourceEventMs: number | null;
  latestObservedAtMs: number | null;
  latestFreshnessStatus: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type DocumentLiveTranslationProjectionSnapshotSummary = {
  version: number;
  totalCount: number;
  readyCount: number;
  errorCount: number;
  healthStatus: "empty" | "ready" | "degraded" | "blocked";
  hasRenderableText: boolean;
  hasProjectionErrors: boolean;
  projectedCount: number;
  staleCount: number;
  cancelledCount: number;
  failedCount: number;
  latestObservedAtMs: number | null;
  latestSourceEventMs: number | null;
  latestObservationRef: string | null;
  latestReceiptRef: string | null;
  latestLaneSessionId: string | null;
  latestSelectedBackendProvider: string | null;
  latestChunkId: string | null;
  latestDedupeKey: string | null;
  latestSourceKind: string | null;
  latestProjectionTarget: string | null;
  latestAccountLocale: string | null;
  latestTargetLanguage: string | null;
  latestProjectionStatus: DocumentInlineTranslationRenderState["projectionStatus"] | null;
  latestFreshnessStatus: string | null;
  laneSessionCount: number;
  activeLaneSessionCount: number;
  blockedLaneSessionCount: number;
  latestLaneSessionStatus: string | null;
  latestLaneSessionHealth: string | null;
  latestLaneSessionUpdatedAtMs: number | null;
  mailLoopCount: number;
  pendingMailLoopCount: number;
  blockedMailLoopCount: number;
  latestMailLoopStatus: string | null;
  latestMailLoopId: string | null;
  goalBindingCount: number;
  activeGoalBindingCount: number;
  blockedGoalBindingCount: number;
  latestGoalBindingId: string | null;
  latestGoalId: string | null;
  latestGoalBindingStatus: string | null;
  latestGoalBindingReportAction: string | null;
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

const DEFAULT_PROJECTION_TARGET = "docs_chunk";
const emptySnapshot: DocumentLiveTranslationProjectionSnapshot = {
  version: 0,
  translations: {},
  laneSessions: {},
  mailLoops: {},
  goalBindings: {},
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

const localeMatches = (candidate: string, locale: string): boolean => {
  const normalizedCandidate = normalizeText(candidate).toLowerCase();
  const normalizedLocale = normalizeText(locale).toLowerCase();
  return !normalizedCandidate ||
    !normalizedLocale ||
    normalizedCandidate === normalizedLocale ||
    normalizedCandidate.startsWith(`${normalizedLocale}-`) ||
    normalizedLocale.startsWith(`${normalizedCandidate}-`);
};

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
  const sessions = Object.values(snapshot.laneSessions);
  const mailLoops = Object.values(snapshot.mailLoops);
  const goalBindings = Object.values(snapshot.goalBindings);
  const readyCount = states.filter((state) => state.status === "ready").length;
  const errorCount = states.filter((state) => state.status === "error").length;
  const healthStatus =
    states.length === 0
      ? "empty"
      : readyCount > 0 && errorCount > 0
        ? "degraded"
        : readyCount > 0
          ? "ready"
          : "blocked";
  const ordered = [...states].sort((left, right) => {
    const observedDelta =
      (right.observedAtMs ?? Number.MIN_SAFE_INTEGER) -
      (left.observedAtMs ?? Number.MIN_SAFE_INTEGER);
    if (observedDelta !== 0) return observedDelta;
    return (right.sourceEventMs ?? Number.MIN_SAFE_INTEGER) -
      (left.sourceEventMs ?? Number.MIN_SAFE_INTEGER);
  });
  const latest = ordered[0] ?? null;
  const latestSession =
    [...sessions].sort((left, right) =>
      (right.updatedAtMs ?? Number.MIN_SAFE_INTEGER) -
      (left.updatedAtMs ?? Number.MIN_SAFE_INTEGER),
    )[0] ?? null;
  const latestMailLoop =
    [...mailLoops].sort((left, right) =>
      mailLoopSortValue(right) - mailLoopSortValue(left),
    )[0] ?? null;
  const latestGoalBinding =
    [...goalBindings].sort((left, right) =>
      goalBindingSortValue(right) - goalBindingSortValue(left),
    )[0] ?? null;
  return {
    version: snapshot.version,
    totalCount: states.length,
    readyCount,
    errorCount,
    healthStatus,
    hasRenderableText: readyCount > 0,
    hasProjectionErrors: errorCount > 0,
    projectedCount: states.filter((state) => state.projectionStatus === "projected").length,
    staleCount: states.filter((state) => state.projectionStatus === "stale").length,
    cancelledCount: states.filter((state) => state.projectionStatus === "cancelled").length,
    failedCount: states.filter((state) => state.projectionStatus === "failed").length,
    latestObservedAtMs:
      latest?.observedAtMs ??
      latestSession?.latestObservedAtMs ??
      latestMailLoop?.latestObservedAtMs ??
      latestGoalBinding?.latestObservedAtMs ??
      null,
    latestSourceEventMs:
      latest?.sourceEventMs ??
      latestSession?.latestSourceEventMs ??
      latestMailLoop?.latestSourceEventMs ??
      latestGoalBinding?.latestSourceEventMs ??
      null,
    latestObservationRef:
      latest?.observationRef ??
      latestSession?.lastObservationRef ??
      latestMailLoop?.observationRef ??
      latestGoalBinding?.observationRef ??
      null,
    latestReceiptRef:
      latest?.receiptRef ??
      latestSession?.lastReceiptRef ??
      latestMailLoop?.receiptRef ??
      latestGoalBinding?.receiptRef ??
      null,
    latestLaneSessionId: latest?.laneSessionId ?? latestSession?.laneSessionId ?? null,
    latestSelectedBackendProvider:
      latest?.selectedBackendProvider ??
      latestSession?.selectedBackendProvider ??
      latestMailLoop?.selectedBackendProvider ??
      latestGoalBinding?.selectedBackendProvider ??
      null,
    latestChunkId:
      latest?.chunkId ??
      latestSession?.latestChunkId ??
      latestMailLoop?.latestChunkId ??
      latestGoalBinding?.latestChunkId ??
      null,
    latestDedupeKey:
      latest?.dedupeKey ??
      latestSession?.latestDedupeKey ??
      latestMailLoop?.latestDedupeKey ??
      latestGoalBinding?.latestDedupeKey ??
      null,
    latestSourceKind:
      latestSession?.sourceKind ??
      latestMailLoop?.sourceKind ??
      latestGoalBinding?.sourceKind ??
      null,
    latestProjectionTarget:
      latest?.projectionTarget ??
      latestSession?.projectionTarget ??
      latestMailLoop?.projectionTarget ??
      latestGoalBinding?.projectionTarget ??
      null,
    latestAccountLocale:
      latestSession?.accountLocale ??
      latestMailLoop?.accountLocale ??
      latestGoalBinding?.accountLocale ??
      null,
    latestTargetLanguage:
      latest?.targetLanguage ??
      latestSession?.targetLanguage ??
      latestMailLoop?.targetLanguage ??
      latestGoalBinding?.targetLanguage ??
      null,
    latestProjectionStatus: latest?.projectionStatus ?? null,
    latestFreshnessStatus:
      latest?.freshnessStatus ??
      latestSession?.latestFreshnessStatus ??
      latestMailLoop?.latestFreshnessStatus ??
      latestGoalBinding?.latestFreshnessStatus ??
      null,
    laneSessionCount: sessions.length,
    activeLaneSessionCount: sessions.filter((session) =>
      session.sessionStatus === "running" || session.sessionStatus === "paused",
    ).length,
    blockedLaneSessionCount: sessions.filter((session) =>
      session.sessionStatus === "blocked" || session.sessionHealth === "blocked",
    ).length,
    latestLaneSessionStatus: latestSession?.sessionStatus ?? null,
    latestLaneSessionHealth: latestSession?.sessionHealth ?? null,
    latestLaneSessionUpdatedAtMs: latestSession?.updatedAtMs ?? null,
    mailLoopCount: mailLoops.length,
    pendingMailLoopCount: mailLoops.filter((loop) => loop.stagePlayWakeExpected).length,
    blockedMailLoopCount: mailLoops.filter((loop) => Boolean(loop.blockedReason)).length,
    latestMailLoopStatus: latestMailLoop?.mailStatus ?? null,
    latestMailLoopId: latestMailLoop?.mailLoopId ?? null,
    goalBindingCount: goalBindings.length,
    activeGoalBindingCount: goalBindings.filter((binding) =>
      binding.bindingStatus === "active" ||
      binding.sessionStatus === "running" ||
      binding.sessionStatus === "paused",
    ).length,
    blockedGoalBindingCount: goalBindings.filter((binding) =>
      binding.bindingStatus === "blocked" ||
      binding.sessionStatus === "blocked" ||
      binding.sessionHealth === "blocked",
    ).length,
    latestGoalBindingId: latestGoalBinding?.goalBindingId ?? null,
    latestGoalId: latestGoalBinding?.goalId ?? null,
    latestGoalBindingStatus: latestGoalBinding?.bindingStatus ?? null,
    latestGoalBindingReportAction: latestGoalBinding?.reportAction ?? null,
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
    laneSessions: current.laneSessions,
    mailLoops: current.mailLoops,
    goalBindings: current.goalBindings,
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
  if (sourceEventType === "lane_session" && lane === "live_translation" && sourceId === docSourceId) {
    return ingestDocumentLiveTranslationLaneSessionFromAskLiveEvent({
      ...input,
      meta,
      sourceId,
    });
  }
  if (sourceEventType === "lane_mail_loop" && lane === "live_translation" && sourceId === docSourceId) {
    return ingestDocumentLiveTranslationMailLoopFromAskLiveEvent({
      ...input,
      meta,
      sourceId,
    });
  }
  if (sourceEventType === "lane_goal_binding" && lane === "live_translation" && sourceId === docSourceId) {
    return ingestDocumentLiveTranslationGoalBindingFromAskLiveEvent({
      ...input,
      meta,
      sourceId,
    });
  }
  if (sourceEventType !== "ui_translation_projection" || lane !== "live_translation" || sourceId !== docSourceId) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }

  const projectionTarget =
    readString(meta?.latestProjectionTarget ?? meta?.latest_projection_target) ||
    normalizeText(input.projectionTarget) ||
    DEFAULT_PROJECTION_TARGET;
  const targetLanguage = readString(meta?.targetLanguage ?? meta?.target_language) || normalizeText(input.locale);
  if (!localeMatches(targetLanguage, input.locale)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }
  const payload = {
    capability_lane_projection_receipts: [
      {
        schema: "helix.live_translation.projection_receipt.v1",
        receipt_ref: readString(meta?.receiptRef ?? meta?.receipt_ref) || null,
        observation_ref: readString(meta?.observationRef ?? meta?.observation_ref) || null,
        lane_session_id: readString(meta?.laneSessionId ?? meta?.lane_session_id) || null,
        selected_backend_provider:
          readString(meta?.selectedBackendProvider ?? meta?.selected_backend_provider) || null,
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

function ingestDocumentLiveTranslationLaneSessionFromAskLiveEvent(
  input: IngestDocumentLiveTranslationProjectionLiveEventInput & {
    meta: Record<string, unknown>;
    sourceId: string;
  },
): DocumentLiveTranslationProjectionSnapshot {
  const projectionTarget =
    readString(input.meta.latestProjectionTarget ?? input.meta.latest_projection_target) ||
    readString(input.meta.projectionTarget ?? input.meta.projection_target) ||
    normalizeText(input.projectionTarget) ||
    DEFAULT_PROJECTION_TARGET;
  if (projectionTarget !== (normalizeText(input.projectionTarget) || DEFAULT_PROJECTION_TARGET)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }

  const accountLocale = readString(input.meta.accountLocale ?? input.meta.account_locale);
  if (!localeMatches(accountLocale, input.locale)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }
  const targetLanguage =
    readString(input.meta.targetLanguage ?? input.meta.target_language) ||
    readString(input.meta.latestTargetLanguage ?? input.meta.latest_target_language) ||
    accountLocale;

  const laneSessionId = readString(input.meta.laneSessionId ?? input.meta.lane_session_id);
  if (!laneSessionId) return readDocumentLiveTranslationProjectionSnapshot(input);

  const key = documentLiveTranslationProjectionRegistryKey(input);
  const current = snapshots.get(key) ?? emptySnapshot;
  const nextSession: DocumentLiveTranslationLaneSessionState = {
    laneSessionId,
    laneId: "live_translation",
    sessionStatus: readString(input.meta.sessionStatus ?? input.meta.session_status) || "unknown",
    sessionHealth: readString(input.meta.sessionHealth ?? input.meta.session_health) || "unknown",
    sourceId: input.sourceId,
    sourceKind: readString(input.meta.sourceKind ?? input.meta.source_kind) || null,
    projectionTarget,
    accountLocale: accountLocale || null,
    targetLanguage: targetLanguage || null,
    selectedBackendProvider:
      readString(input.meta.selectedBackendProvider ?? input.meta.selected_backend_provider) || null,
    latestChunkId: readString(input.meta.latestChunkId ?? input.meta.latest_chunk_id) || null,
    latestChunkIndex: readNumber(input.meta.latestChunkIndex ?? input.meta.latest_chunk_index),
    latestDedupeKey: readString(input.meta.latestDedupeKey ?? input.meta.latest_dedupe_key) || null,
    latestSourceEventId:
      readString(input.meta.latestSourceEventId ?? input.meta.latest_source_event_id) || null,
    latestSourceEventMs: readNumber(input.meta.latestSourceEventMs ?? input.meta.latest_source_event_ms),
    latestObservedAtMs: readNumber(input.meta.latestObservedAtMs ?? input.meta.latest_observed_at_ms),
    latestFreshnessStatus:
      readString(input.meta.latestFreshnessStatus ?? input.meta.latest_freshness_status) || null,
    lastObservationRef: readString(input.meta.observationRef ?? input.meta.observation_ref) || null,
    lastReceiptRef: readString(input.meta.receiptRef ?? input.meta.receipt_ref) || null,
    updatedAtMs: readNumber(input.meta.updatedAtMs ?? input.meta.updated_at_ms) ??
      readNumber(input.meta.latestObservedAtMs ?? input.meta.latest_observed_at_ms),
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
  const previous = current.laneSessions[laneSessionId];
  if (sameDocumentLiveTranslationLaneSessionState(previous, nextSession)) return current;
  if (shouldKeepCurrentLaneSessionState(previous, nextSession)) return current;
  const snapshot = {
    version: ++registryVersion,
    translations: current.translations,
    laneSessions: {
      ...current.laneSessions,
      [laneSessionId]: nextSession,
    },
    mailLoops: current.mailLoops,
    goalBindings: current.goalBindings,
  };
  snapshots.set(key, snapshot);
  emitRegistryChange();
  return snapshot;
}

function ingestDocumentLiveTranslationMailLoopFromAskLiveEvent(
  input: IngestDocumentLiveTranslationProjectionLiveEventInput & {
    meta: Record<string, unknown>;
    sourceId: string;
  },
): DocumentLiveTranslationProjectionSnapshot {
  const projectionTarget =
    readString(input.meta.latestProjectionTarget ?? input.meta.latest_projection_target) ||
    readString(input.meta.projectionTarget ?? input.meta.projection_target) ||
    normalizeText(input.projectionTarget) ||
    DEFAULT_PROJECTION_TARGET;
  if (projectionTarget !== (normalizeText(input.projectionTarget) || DEFAULT_PROJECTION_TARGET)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }
  const targetLanguage =
    readString(input.meta.targetLanguage ?? input.meta.target_language) ||
    readString(input.meta.latestTargetLanguage ?? input.meta.latest_target_language);
  if (!localeMatches(targetLanguage, input.locale)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }

  const mailLoopId =
    readString(input.meta.stagePlayMailId ?? input.meta.stage_play_mail_id) ||
    readString(input.meta.observationRef ?? input.meta.observation_ref) ||
    readString(input.eventPayload.entry.id);
  if (!mailLoopId) return readDocumentLiveTranslationProjectionSnapshot(input);

  const key = documentLiveTranslationProjectionRegistryKey(input);
  const current = snapshots.get(key) ?? emptySnapshot;
  const nextMailLoop: DocumentLiveTranslationMailLoopState = {
    mailLoopId,
    laneSessionId: readString(input.meta.laneSessionId ?? input.meta.lane_session_id) || null,
    laneId: "live_translation",
    stagePlayMailId: readString(input.meta.stagePlayMailId ?? input.meta.stage_play_mail_id) || null,
    stagePlayWakeExpected: readBoolean(input.meta.stagePlayWakeExpected ?? input.meta.stage_play_wake_expected),
    mailboxThreadId: readString(input.meta.mailboxThreadId ?? input.meta.mailbox_thread_id) || null,
    mailStatus: readString(input.meta.mailStatus ?? input.meta.mail_status) || null,
    blockedReason: readString(input.meta.blockedReason ?? input.meta.blocked_reason) || null,
    sourceId: input.sourceId,
    sourceKind: readString(input.meta.sourceKind ?? input.meta.source_kind) || null,
    projectionTarget,
    accountLocale: readString(input.meta.accountLocale ?? input.meta.account_locale) || null,
    targetLanguage: targetLanguage || null,
    selectedBackendProvider:
      readString(input.meta.selectedBackendProvider ?? input.meta.selected_backend_provider) || null,
    latestChunkId: readString(input.meta.latestChunkId ?? input.meta.latest_chunk_id) || null,
    latestChunkIndex: readNumber(input.meta.latestChunkIndex ?? input.meta.latest_chunk_index),
    latestDedupeKey: readString(input.meta.latestDedupeKey ?? input.meta.latest_dedupe_key) || null,
    latestSourceEventId:
      readString(input.meta.latestSourceEventId ?? input.meta.latest_source_event_id) || null,
    latestSourceEventMs: readNumber(input.meta.latestSourceEventMs ?? input.meta.latest_source_event_ms),
    latestObservedAtMs: readNumber(input.meta.latestObservedAtMs ?? input.meta.latest_observed_at_ms),
    latestFreshnessStatus:
      readString(input.meta.latestFreshnessStatus ?? input.meta.latest_freshness_status) || null,
    observationRef: readString(input.meta.observationRef ?? input.meta.observation_ref) || null,
    receiptRef: readString(input.meta.receiptRef ?? input.meta.receipt_ref) || null,
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
  const previous = current.mailLoops[mailLoopId];
  if (sameDocumentLiveTranslationMailLoopState(previous, nextMailLoop)) return current;
  if (shouldKeepCurrentMailLoopState(previous, nextMailLoop)) return current;
  const snapshot = {
    version: ++registryVersion,
    translations: current.translations,
    laneSessions: current.laneSessions,
    mailLoops: {
      ...current.mailLoops,
      [mailLoopId]: nextMailLoop,
    },
    goalBindings: current.goalBindings,
  };
  snapshots.set(key, snapshot);
  emitRegistryChange();
  return snapshot;
}

function ingestDocumentLiveTranslationGoalBindingFromAskLiveEvent(
  input: IngestDocumentLiveTranslationProjectionLiveEventInput & {
    meta: Record<string, unknown>;
    sourceId: string;
  },
): DocumentLiveTranslationProjectionSnapshot {
  const projectionTarget =
    readString(input.meta.latestProjectionTarget ?? input.meta.latest_projection_target) ||
    readString(input.meta.projectionTarget ?? input.meta.projection_target) ||
    normalizeText(input.projectionTarget) ||
    DEFAULT_PROJECTION_TARGET;
  if (projectionTarget !== (normalizeText(input.projectionTarget) || DEFAULT_PROJECTION_TARGET)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }
  const targetLanguage =
    readString(input.meta.targetLanguage ?? input.meta.target_language) ||
    readString(input.meta.latestTargetLanguage ?? input.meta.latest_target_language);
  if (!localeMatches(targetLanguage, input.locale)) {
    return readDocumentLiveTranslationProjectionSnapshot(input);
  }

  const goalBindingId =
    readString(input.meta.goalBindingId ?? input.meta.goal_binding_id) ||
    readString(input.eventPayload.entry.id);
  if (!goalBindingId) return readDocumentLiveTranslationProjectionSnapshot(input);

  const key = documentLiveTranslationProjectionRegistryKey(input);
  const current = snapshots.get(key) ?? emptySnapshot;
  const nextGoalBinding: DocumentLiveTranslationGoalBindingState = {
    goalBindingId,
    goalId: readString(input.meta.goalId ?? input.meta.goal_id) || null,
    laneSessionId: readString(input.meta.laneSessionId ?? input.meta.lane_session_id) || null,
    laneId: "live_translation",
    bindingStatus: readString(input.meta.bindingStatus ?? input.meta.binding_status) || null,
    sessionStatus: readString(input.meta.sessionStatus ?? input.meta.session_status) || null,
    sessionHealth: readString(input.meta.sessionHealth ?? input.meta.session_health) || null,
    activationPolicy: readString(input.meta.activationPolicy ?? input.meta.activation_policy) || null,
    attentionPolicy: readString(input.meta.attentionPolicy ?? input.meta.attention_policy) || null,
    stopCondition: readString(input.meta.stopCondition ?? input.meta.stop_condition) || null,
    reportPolicy: readString(input.meta.reportPolicy ?? input.meta.report_policy) || null,
    quietBehavior: readString(input.meta.quietBehavior ?? input.meta.quiet_behavior) || null,
    reportAction: readString(input.meta.reportAction ?? input.meta.report_action) || null,
    reportReason: readString(input.meta.reportReason ?? input.meta.report_reason) || null,
    selectedBackendProvider:
      readString(input.meta.selectedBackendProvider ?? input.meta.selected_backend_provider) || null,
    sourceId: input.sourceId,
    sourceKind: readString(input.meta.sourceKind ?? input.meta.source_kind) || null,
    projectionTarget,
    accountLocale: readString(input.meta.accountLocale ?? input.meta.account_locale) || null,
    targetLanguage: targetLanguage || null,
    latestChunkId: readString(input.meta.latestChunkId ?? input.meta.latest_chunk_id) || null,
    latestChunkIndex: readNumber(input.meta.latestChunkIndex ?? input.meta.latest_chunk_index),
    latestDedupeKey: readString(input.meta.latestDedupeKey ?? input.meta.latest_dedupe_key) || null,
    latestSourceEventId:
      readString(input.meta.latestSourceEventId ?? input.meta.latest_source_event_id) || null,
    latestSourceEventMs: readNumber(input.meta.latestSourceEventMs ?? input.meta.latest_source_event_ms),
    latestObservedAtMs: readNumber(input.meta.latestObservedAtMs ?? input.meta.latest_observed_at_ms),
    latestFreshnessStatus:
      readString(input.meta.latestFreshnessStatus ?? input.meta.latest_freshness_status) || null,
    observationRef: readString(input.meta.observationRef ?? input.meta.observation_ref) || null,
    receiptRef: readString(input.meta.receiptRef ?? input.meta.receipt_ref) || null,
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
  const previous = current.goalBindings[goalBindingId];
  if (sameDocumentLiveTranslationGoalBindingState(previous, nextGoalBinding)) return current;
  if (shouldKeepCurrentGoalBindingState(previous, nextGoalBinding)) return current;
  const snapshot = {
    version: ++registryVersion,
    translations: current.translations,
    laneSessions: current.laneSessions,
    mailLoops: current.mailLoops,
    goalBindings: {
      ...current.goalBindings,
      [goalBindingId]: nextGoalBinding,
    },
  };
  snapshots.set(key, snapshot);
  emitRegistryChange();
  return snapshot;
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

function sameDocumentLiveTranslationLaneSessionState(
  left: DocumentLiveTranslationLaneSessionState | undefined,
  right: DocumentLiveTranslationLaneSessionState | undefined,
): boolean {
  if (!left || !right) return left === right;
  return left.laneSessionId === right.laneSessionId &&
    left.laneId === right.laneId &&
    left.sessionStatus === right.sessionStatus &&
    left.sessionHealth === right.sessionHealth &&
    (left.sourceId ?? "") === (right.sourceId ?? "") &&
    (left.sourceKind ?? "") === (right.sourceKind ?? "") &&
    (left.projectionTarget ?? "") === (right.projectionTarget ?? "") &&
    (left.accountLocale ?? "") === (right.accountLocale ?? "") &&
    (left.targetLanguage ?? "") === (right.targetLanguage ?? "") &&
    (left.selectedBackendProvider ?? "") === (right.selectedBackendProvider ?? "") &&
    (left.latestChunkId ?? "") === (right.latestChunkId ?? "") &&
    (left.latestChunkIndex ?? null) === (right.latestChunkIndex ?? null) &&
    (left.latestDedupeKey ?? "") === (right.latestDedupeKey ?? "") &&
    (left.latestSourceEventId ?? "") === (right.latestSourceEventId ?? "") &&
    (left.latestSourceEventMs ?? null) === (right.latestSourceEventMs ?? null) &&
    (left.latestObservedAtMs ?? null) === (right.latestObservedAtMs ?? null) &&
    (left.latestFreshnessStatus ?? "") === (right.latestFreshnessStatus ?? "") &&
    (left.lastObservationRef ?? "") === (right.lastObservationRef ?? "") &&
    (left.lastReceiptRef ?? "") === (right.lastReceiptRef ?? "") &&
    (left.updatedAtMs ?? null) === (right.updatedAtMs ?? null);
}

function sameDocumentLiveTranslationMailLoopState(
  left: DocumentLiveTranslationMailLoopState | undefined,
  right: DocumentLiveTranslationMailLoopState | undefined,
): boolean {
  if (!left || !right) return left === right;
  return left.mailLoopId === right.mailLoopId &&
    (left.laneSessionId ?? "") === (right.laneSessionId ?? "") &&
    left.laneId === right.laneId &&
    (left.stagePlayMailId ?? "") === (right.stagePlayMailId ?? "") &&
    left.stagePlayWakeExpected === right.stagePlayWakeExpected &&
    (left.mailboxThreadId ?? "") === (right.mailboxThreadId ?? "") &&
    (left.mailStatus ?? "") === (right.mailStatus ?? "") &&
    (left.blockedReason ?? "") === (right.blockedReason ?? "") &&
    (left.sourceId ?? "") === (right.sourceId ?? "") &&
    (left.sourceKind ?? "") === (right.sourceKind ?? "") &&
    (left.projectionTarget ?? "") === (right.projectionTarget ?? "") &&
    (left.accountLocale ?? "") === (right.accountLocale ?? "") &&
    (left.targetLanguage ?? "") === (right.targetLanguage ?? "") &&
    (left.selectedBackendProvider ?? "") === (right.selectedBackendProvider ?? "") &&
    (left.latestChunkId ?? "") === (right.latestChunkId ?? "") &&
    (left.latestChunkIndex ?? null) === (right.latestChunkIndex ?? null) &&
    (left.latestDedupeKey ?? "") === (right.latestDedupeKey ?? "") &&
    (left.latestSourceEventId ?? "") === (right.latestSourceEventId ?? "") &&
    (left.latestSourceEventMs ?? null) === (right.latestSourceEventMs ?? null) &&
    (left.latestObservedAtMs ?? null) === (right.latestObservedAtMs ?? null) &&
    (left.latestFreshnessStatus ?? "") === (right.latestFreshnessStatus ?? "") &&
    (left.observationRef ?? "") === (right.observationRef ?? "") &&
    (left.receiptRef ?? "") === (right.receiptRef ?? "");
}

function sameDocumentLiveTranslationGoalBindingState(
  left: DocumentLiveTranslationGoalBindingState | undefined,
  right: DocumentLiveTranslationGoalBindingState | undefined,
): boolean {
  if (!left || !right) return left === right;
  return left.goalBindingId === right.goalBindingId &&
    (left.goalId ?? "") === (right.goalId ?? "") &&
    (left.laneSessionId ?? "") === (right.laneSessionId ?? "") &&
    left.laneId === right.laneId &&
    (left.bindingStatus ?? "") === (right.bindingStatus ?? "") &&
    (left.sessionStatus ?? "") === (right.sessionStatus ?? "") &&
    (left.sessionHealth ?? "") === (right.sessionHealth ?? "") &&
    (left.activationPolicy ?? "") === (right.activationPolicy ?? "") &&
    (left.attentionPolicy ?? "") === (right.attentionPolicy ?? "") &&
    (left.stopCondition ?? "") === (right.stopCondition ?? "") &&
    (left.reportPolicy ?? "") === (right.reportPolicy ?? "") &&
    (left.quietBehavior ?? "") === (right.quietBehavior ?? "") &&
    (left.reportAction ?? "") === (right.reportAction ?? "") &&
    (left.reportReason ?? "") === (right.reportReason ?? "") &&
    (left.selectedBackendProvider ?? "") === (right.selectedBackendProvider ?? "") &&
    (left.sourceId ?? "") === (right.sourceId ?? "") &&
    (left.sourceKind ?? "") === (right.sourceKind ?? "") &&
    (left.projectionTarget ?? "") === (right.projectionTarget ?? "") &&
    (left.accountLocale ?? "") === (right.accountLocale ?? "") &&
    (left.targetLanguage ?? "") === (right.targetLanguage ?? "") &&
    (left.latestChunkId ?? "") === (right.latestChunkId ?? "") &&
    (left.latestChunkIndex ?? null) === (right.latestChunkIndex ?? null) &&
    (left.latestDedupeKey ?? "") === (right.latestDedupeKey ?? "") &&
    (left.latestSourceEventId ?? "") === (right.latestSourceEventId ?? "") &&
    (left.latestSourceEventMs ?? null) === (right.latestSourceEventMs ?? null) &&
    (left.latestObservedAtMs ?? null) === (right.latestObservedAtMs ?? null) &&
    (left.latestFreshnessStatus ?? "") === (right.latestFreshnessStatus ?? "") &&
    (left.observationRef ?? "") === (right.observationRef ?? "") &&
    (left.receiptRef ?? "") === (right.receiptRef ?? "");
}

function laneSessionSortValue(
  state: DocumentLiveTranslationLaneSessionState | undefined,
): number {
  return state?.updatedAtMs ??
    state?.latestObservedAtMs ??
    state?.latestSourceEventMs ??
    Number.MIN_SAFE_INTEGER;
}

function shouldKeepCurrentLaneSessionState(
  current: DocumentLiveTranslationLaneSessionState | undefined,
  next: DocumentLiveTranslationLaneSessionState,
): boolean {
  if (!current) return false;
  return laneSessionSortValue(current) > laneSessionSortValue(next);
}

function mailLoopSortValue(
  state: DocumentLiveTranslationMailLoopState | undefined,
): number {
  return state?.latestObservedAtMs ??
    state?.latestSourceEventMs ??
    Number.MIN_SAFE_INTEGER;
}

function shouldKeepCurrentMailLoopState(
  current: DocumentLiveTranslationMailLoopState | undefined,
  next: DocumentLiveTranslationMailLoopState,
): boolean {
  if (!current) return false;
  return mailLoopSortValue(current) > mailLoopSortValue(next);
}

function goalBindingSortValue(
  state: DocumentLiveTranslationGoalBindingState | undefined,
): number {
  return state?.latestObservedAtMs ??
    state?.latestSourceEventMs ??
    Number.MIN_SAFE_INTEGER;
}

function shouldKeepCurrentGoalBindingState(
  current: DocumentLiveTranslationGoalBindingState | undefined,
  next: DocumentLiveTranslationGoalBindingState,
): boolean {
  if (!current) return false;
  return goalBindingSortValue(current) > goalBindingSortValue(next);
}
