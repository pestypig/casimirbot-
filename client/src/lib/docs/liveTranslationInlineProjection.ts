import type { DocumentTranslationUnit } from "@shared/document-translation";
import {
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
  type HelixLiveTranslationProjectionTarget,
} from "@shared/helix-live-translation-projection-target";
import {
  buildHelixLiveTranslationInlineUnitStates,
  buildHelixLiveTranslationUiProjections,
  type HelixLiveTranslationInlineUnitState,
} from "@/lib/helix/live-translation-projection";
import {
  documentMarkdownSourceId,
  type DocumentMarkdownTranslationEntry,
} from "@/lib/docs/documentTranslationClient";

export type DocumentLiveTranslationInlineState = {
  status: "ready" | "error";
  text?: string;
  error?: string;
  serverProjectionKey?: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
  observationLaneSessionId: string | null;
  goalBindingId: string | null;
  sessionControlKey?: string | null;
  sourceBindingKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId: string | null;
  hasObservation: boolean;
  selectedBackendProvider: string | null;
  projectionStatus: HelixLiveTranslationInlineUnitState["projectionStatus"];
  chunkId: string | null;
  chunkIndex: number | null;
  dedupeKey: string | null;
  sourceEventId: string | null;
  sourceEventMs: number | null;
  observedAtMs: number | null;
  freshnessStatus: string;
  terminalAuthorityStatus: HelixLiveTranslationInlineUnitState["terminalAuthorityStatus"];
  sourceId: string | null;
  sourceHash?: string | null;
  sourceKind: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  accountLocale: string | null;
  projectionTarget: string | null;
  targetLanguage: string | null;
  cancelRequested: boolean;
  source: "capability_lane";
  terminalEligible: false;
  assistantAnswer: false;
  rawContentIncluded: false;
};

export type DocumentInlineTranslationRenderState = {
  status: "loading" | "ready" | "error";
  text?: string;
  error?: string;
  serverProjectionKey?: string | null;
  observationRef?: string | null;
  receiptRef?: string | null;
  laneSessionId?: string | null;
  observationLaneSessionId?: string | null;
  goalBindingId?: string | null;
  sessionControlKey?: string | null;
  sourceBindingKey?: string | null;
  latestObservationKey?: string | null;
  latestMailLoopObservationKey?: string | null;
  goalBindingKey?: string | null;
  latestEventId?: string | null;
  hasObservation?: boolean;
  selectedBackendProvider?: string | null;
  projectionStatus?: HelixLiveTranslationInlineUnitState["projectionStatus"];
  chunkId?: string | null;
  chunkIndex?: number | null;
  dedupeKey?: string | null;
  sourceEventId?: string | null;
  sourceEventMs?: number | null;
  observedAtMs?: number | null;
  freshnessStatus?: string;
  terminalAuthorityStatus?: HelixLiveTranslationInlineUnitState["terminalAuthorityStatus"];
  sourceId?: string | null;
  sourceHash?: string | null;
  sourceKind?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  accountLocale?: string | null;
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  cancelRequested?: boolean;
  source?: "capability_lane" | "document_microdeck";
  suppressedServerProjectionKey?: string | null;
  suppressedObservationRef?: string | null;
  suppressedReceiptRef?: string | null;
  suppressedObservationLaneSessionId?: string | null;
  suppressedGoalBindingId?: string | null;
  suppressedSessionControlKey?: string | null;
  suppressedSourceBindingKey?: string | null;
  suppressedLatestObservationKey?: string | null;
  suppressedLatestMailLoopObservationKey?: string | null;
  suppressedGoalBindingKey?: string | null;
  suppressedLatestEventId?: string | null;
  suppressedHasObservation?: boolean | null;
  suppressedProjectionStatus?: HelixLiveTranslationInlineUnitState["projectionStatus"] | null;
  suppressedChunkId?: string | null;
  suppressedChunkIndex?: number | null;
  suppressedDedupeKey?: string | null;
  suppressedSourceEventId?: string | null;
  suppressedSourceEventMs?: number | null;
  suppressedObservedAtMs?: number | null;
  suppressedFreshnessStatus?: string | null;
  suppressedTerminalAuthorityStatus?: HelixLiveTranslationInlineUnitState["terminalAuthorityStatus"] | null;
  suppressedSourceId?: string | null;
  suppressedSourceHash?: string | null;
  suppressedSourceKind?: string | null;
  suppressedSourceTextHash?: string | null;
  suppressedSourceTextCharCount?: number | null;
  suppressedAccountLocale?: string | null;
  suppressedProjectionTarget?: string | null;
  suppressedTargetLanguage?: string | null;
  suppressedCancelRequested?: boolean | null;
  suppressedReason?: string | null;
  terminalEligible?: false;
  assistantAnswer?: false;
  rawContentIncluded?: false;
};

export type BuildDocumentLiveTranslationInlineStatesInput = {
  payload: unknown;
  docPath: string;
  locale: string;
  sourceHash?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  units: DocumentTranslationUnit[];
  projectionTarget?: HelixLiveTranslationProjectionTarget | string;
  allowStaleDisplayText?: boolean;
};

export type MergeDocumentLiveTranslationInlineStatesInput = {
  current: Record<string, DocumentInlineTranslationRenderState>;
  laneStates: Record<string, DocumentLiveTranslationInlineState>;
};

export function isReadyDocumentInlineTranslationRenderState(
  state: DocumentInlineTranslationRenderState | undefined,
): state is DocumentInlineTranslationRenderState & { status: "ready"; text: string } {
  return state?.status === "ready" && typeof state.text === "string" && state.text.trim().length > 0;
}

export function filterReadyDocumentInlineTranslationRenderStates(
  states: Record<string, DocumentInlineTranslationRenderState>,
): Record<string, DocumentInlineTranslationRenderState & { status: "ready"; text: string }> {
  return Object.fromEntries(
    Object.entries(states).filter((entry): entry is [
      string,
      DocumentInlineTranslationRenderState & { status: "ready"; text: string },
    ] => isReadyDocumentInlineTranslationRenderState(entry[1])),
  );
}

export function buildDocumentInlineTranslationDataAttributes(
  state: DocumentInlineTranslationRenderState,
): Record<string, string> {
  const displayStatus = resolveDocumentInlineTranslationDisplayStatus(state);
  const projectionKey = buildDocumentInlineTranslationProjectionKey(state);
  const suppressedProjectionKey = buildDocumentInlineTranslationSuppressedProjectionKey(state);
  return Object.fromEntries(
    [
      ["data-doc-translation-source", state.source],
      ["data-doc-translation-projection-key", projectionKey],
      ["data-doc-translation-server-projection-key", state.serverProjectionKey],
      ["data-doc-translation-authority-policy", "projection_only_not_answer_authority"],
      ["data-doc-translation-render-status", state.status],
      ["data-doc-translation-display-status", displayStatus],
      ["data-doc-translation-governed-projection", state.source === "capability_lane" ? "true" : null],
      ["data-doc-translation-projection-status", state.projectionStatus],
      ["data-doc-translation-selected-backend-provider", state.selectedBackendProvider],
      ["data-doc-translation-observation-ref", state.observationRef],
      ["data-doc-translation-receipt-ref", state.receiptRef],
      ["data-doc-translation-lane-session-id", state.laneSessionId],
      ["data-doc-translation-observation-lane-session-id", state.observationLaneSessionId],
      ["data-doc-translation-goal-binding-id", state.goalBindingId],
      ["data-doc-translation-session-control-key", state.sessionControlKey],
      ["data-doc-translation-source-binding-key", state.sourceBindingKey],
      ["data-doc-translation-latest-observation-key", state.latestObservationKey],
      ["data-doc-translation-latest-mail-loop-observation-key", state.latestMailLoopObservationKey],
      ["data-doc-translation-goal-binding-key", state.goalBindingKey],
      ["data-doc-translation-latest-event-id", state.latestEventId],
      ["data-doc-translation-has-observation", typeof state.hasObservation === "boolean" ? String(state.hasObservation) : null],
      ["data-doc-translation-chunk-id", state.chunkId],
      ["data-doc-translation-chunk-index", typeof state.chunkIndex === "number" ? String(state.chunkIndex) : null],
      ["data-doc-translation-dedupe-key", state.dedupeKey],
      ["data-doc-translation-source-event-id", state.sourceEventId],
      ["data-doc-translation-source-event-ms", typeof state.sourceEventMs === "number" ? String(state.sourceEventMs) : null],
      ["data-doc-translation-observed-at-ms", typeof state.observedAtMs === "number" ? String(state.observedAtMs) : null],
      ["data-doc-translation-freshness-status", state.freshnessStatus],
      ["data-doc-translation-terminal-authority-status", state.terminalAuthorityStatus],
      ["data-doc-translation-source-id", state.sourceId],
      ["data-doc-translation-source-hash", state.sourceHash],
      ["data-doc-translation-source-kind", state.sourceKind],
      ["data-doc-translation-source-text-hash", state.sourceTextHash],
      ["data-doc-translation-source-text-char-count", typeof state.sourceTextCharCount === "number" ? String(state.sourceTextCharCount) : null],
      ["data-doc-translation-account-locale", state.accountLocale],
      ["data-doc-translation-projection-target", state.projectionTarget],
      ["data-doc-translation-target-language", state.targetLanguage],
      ["data-doc-translation-cancel-requested", typeof state.cancelRequested === "boolean" ? String(state.cancelRequested) : null],
      ["data-doc-translation-suppressed-observation-ref", state.suppressedObservationRef],
      ["data-doc-translation-suppressed-receipt-ref", state.suppressedReceiptRef],
      ["data-doc-translation-suppressed-projection-key", suppressedProjectionKey],
      ["data-doc-translation-suppressed-server-projection-key", state.suppressedServerProjectionKey],
      ["data-doc-translation-suppressed-observation-lane-session-id", state.suppressedObservationLaneSessionId],
      ["data-doc-translation-suppressed-goal-binding-id", state.suppressedGoalBindingId],
      ["data-doc-translation-suppressed-session-control-key", state.suppressedSessionControlKey],
      ["data-doc-translation-suppressed-source-binding-key", state.suppressedSourceBindingKey],
      ["data-doc-translation-suppressed-latest-observation-key", state.suppressedLatestObservationKey],
      ["data-doc-translation-suppressed-latest-mail-loop-observation-key", state.suppressedLatestMailLoopObservationKey],
      ["data-doc-translation-suppressed-goal-binding-key", state.suppressedGoalBindingKey],
      ["data-doc-translation-suppressed-latest-event-id", state.suppressedLatestEventId],
      [
        "data-doc-translation-suppressed-has-observation",
        typeof state.suppressedHasObservation === "boolean" ? String(state.suppressedHasObservation) : null,
      ],
      ["data-doc-translation-suppressed-projection-status", state.suppressedProjectionStatus],
      ["data-doc-translation-suppressed-chunk-id", state.suppressedChunkId],
      ["data-doc-translation-suppressed-chunk-index", typeof state.suppressedChunkIndex === "number" ? String(state.suppressedChunkIndex) : null],
      ["data-doc-translation-suppressed-dedupe-key", state.suppressedDedupeKey],
      ["data-doc-translation-suppressed-source-event-id", state.suppressedSourceEventId],
      ["data-doc-translation-suppressed-source-event-ms", typeof state.suppressedSourceEventMs === "number" ? String(state.suppressedSourceEventMs) : null],
      [
        "data-doc-translation-suppressed-observed-at-ms",
        typeof state.suppressedObservedAtMs === "number" ? String(state.suppressedObservedAtMs) : null,
      ],
      ["data-doc-translation-suppressed-freshness-status", state.suppressedFreshnessStatus],
      ["data-doc-translation-suppressed-terminal-authority-status", state.suppressedTerminalAuthorityStatus],
      ["data-doc-translation-suppressed-source-id", state.suppressedSourceId],
      ["data-doc-translation-suppressed-source-hash", state.suppressedSourceHash],
      ["data-doc-translation-suppressed-source-kind", state.suppressedSourceKind],
      ["data-doc-translation-suppressed-source-text-hash", state.suppressedSourceTextHash],
      [
        "data-doc-translation-suppressed-source-text-char-count",
        typeof state.suppressedSourceTextCharCount === "number" ? String(state.suppressedSourceTextCharCount) : null,
      ],
      ["data-doc-translation-suppressed-account-locale", state.suppressedAccountLocale],
      ["data-doc-translation-suppressed-projection-target", state.suppressedProjectionTarget],
      ["data-doc-translation-suppressed-target-language", state.suppressedTargetLanguage],
      [
        "data-doc-translation-suppressed-cancel-requested",
        typeof state.suppressedCancelRequested === "boolean" ? String(state.suppressedCancelRequested) : null,
      ],
      ["data-doc-translation-suppressed-reason", state.suppressedReason],
      ["data-doc-translation-terminal-eligible", state.terminalEligible === false ? "false" : null],
      ["data-doc-translation-assistant-answer", state.assistantAnswer === false ? "false" : null],
      ["data-doc-translation-raw-content-included", state.rawContentIncluded === false ? "false" : null],
    ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
  );
}

export function buildDocumentInlineTranslationProjectionKey(
  state: DocumentInlineTranslationRenderState,
): string | null {
  const parts = [
    state.sourceId,
    state.sourceHash,
    state.sourceTextHash,
    state.projectionTarget,
    state.targetLanguage,
    state.chunkId,
    state.receiptRef ?? state.observationRef,
  ]
    .map((value) => typeof value === "string" ? value.trim() : "")
    .filter(Boolean);
  return parts.length > 0 ? parts.join("::") : null;
}

export function buildDocumentInlineTranslationSuppressedProjectionKey(
  state: DocumentInlineTranslationRenderState,
): string | null {
  const parts = [
    state.suppressedSourceId,
    state.suppressedSourceHash,
    state.suppressedSourceTextHash,
    state.suppressedProjectionTarget,
    state.suppressedTargetLanguage,
    state.suppressedChunkId,
    state.suppressedReceiptRef ?? state.suppressedObservationRef,
  ]
    .map((value) => typeof value === "string" ? value.trim() : "")
    .filter(Boolean);
  return parts.length > 0 ? parts.join("::") : null;
}

export function resolveDocumentInlineTranslationDisplayStatus(
  state: DocumentInlineTranslationRenderState,
): "active" | "pending" | "ready" | "stale" | "cancelled" | "failed" | "blocked" {
  if (state.status === "loading") {
    return state.laneSessionId || state.goalBindingId || state.observationLaneSessionId ? "active" : "pending";
  }
  if (state.projectionStatus === "stale" || state.freshnessStatus === "stale") return "stale";
  if (state.projectionStatus === "cancelled" || state.cancelRequested === true) return "cancelled";
  if (state.projectionStatus === "failed") return "failed";
  if (state.status === "error") return "blocked";
  return "ready";
}

export function formatDocumentInlineTranslationText(text: string): string {
  return text
    .replace(/^ {0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*\|\s?/gm, "")
    .replace(/\s+\|\s*$/gm, "")
    .trim();
}

export function documentMarkdownTranslationEntryToInlineRenderState(
  entry: DocumentMarkdownTranslationEntry,
): DocumentInlineTranslationRenderState {
  const metadata = {
    ...(entry.projectionKey ? { serverProjectionKey: entry.projectionKey } : {}),
    observationRef: entry.observationRef,
    receiptRef: entry.receiptRef,
    chunkId: entry.chunkId,
    chunkIndex: entry.chunkIndex,
    dedupeKey: entry.dedupeKey,
    sourceEventId: entry.sourceEventId,
    sourceEventMs: entry.sourceEventMs,
    observedAtMs: entry.observedAtMs,
    projectionStatus: entry.projectionStatus,
    freshnessStatus: entry.freshnessStatus,
    terminalAuthorityStatus: entry.terminalAuthorityStatus ?? "not_terminal_authority",
    laneSessionId: entry.laneSessionId,
    observationLaneSessionId: entry.observationLaneSessionId,
    goalBindingId: entry.goalBindingId,
    sessionControlKey: entry.sessionControlKey,
    sourceBindingKey: entry.sourceBindingKey,
    latestObservationKey: entry.latestObservationKey,
    latestMailLoopObservationKey: entry.latestMailLoopObservationKey,
    goalBindingKey: entry.goalBindingKey,
    latestEventId: entry.latestEventId,
    hasObservation: entry.hasObservation ?? Boolean(entry.observationRef),
    selectedBackendProvider: entry.selectedBackendProvider,
    sourceId: entry.sourceId,
    ...(entry.sourceHash ? { sourceHash: entry.sourceHash } : {}),
    sourceKind: entry.sourceKind,
    ...(entry.sourceTextHash ? { sourceTextHash: entry.sourceTextHash } : {}),
    ...(typeof entry.sourceTextCharCount === "number" ? { sourceTextCharCount: entry.sourceTextCharCount } : {}),
    accountLocale: entry.accountLocale,
    projectionTarget: entry.projectionTarget,
    targetLanguage: entry.targetLanguage,
    source: entry.source ?? "document_microdeck",
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  } satisfies Omit<DocumentInlineTranslationRenderState, "status" | "text" | "error">;

  if (entry.status === "ready") {
    return {
      status: "ready",
      text: entry.text,
      ...metadata,
    };
  }

  return {
    status: "error",
    error: entry.error,
    ...metadata,
  };
}

export function sameDocumentInlineTranslationRenderState(
  left: DocumentInlineTranslationRenderState | undefined,
  right: DocumentInlineTranslationRenderState | undefined,
): boolean {
  if (!left || !right) return left === right;
  return left.status === right.status &&
    (left.text ?? "") === (right.text ?? "") &&
    (left.error ?? "") === (right.error ?? "") &&
    (left.serverProjectionKey ?? "") === (right.serverProjectionKey ?? "") &&
    (left.observationRef ?? "") === (right.observationRef ?? "") &&
    (left.receiptRef ?? "") === (right.receiptRef ?? "") &&
    (left.laneSessionId ?? "") === (right.laneSessionId ?? "") &&
    (left.observationLaneSessionId ?? "") === (right.observationLaneSessionId ?? "") &&
    (left.goalBindingId ?? "") === (right.goalBindingId ?? "") &&
    (left.sessionControlKey ?? "") === (right.sessionControlKey ?? "") &&
    (left.sourceBindingKey ?? "") === (right.sourceBindingKey ?? "") &&
    (left.latestObservationKey ?? "") === (right.latestObservationKey ?? "") &&
    (left.latestMailLoopObservationKey ?? "") === (right.latestMailLoopObservationKey ?? "") &&
    (left.goalBindingKey ?? "") === (right.goalBindingKey ?? "") &&
    (left.latestEventId ?? "") === (right.latestEventId ?? "") &&
    (left.hasObservation ?? null) === (right.hasObservation ?? null) &&
    (left.selectedBackendProvider ?? "") === (right.selectedBackendProvider ?? "") &&
    (left.projectionStatus ?? "") === (right.projectionStatus ?? "") &&
    (left.chunkId ?? "") === (right.chunkId ?? "") &&
    (left.chunkIndex ?? null) === (right.chunkIndex ?? null) &&
    (left.dedupeKey ?? "") === (right.dedupeKey ?? "") &&
    (left.sourceEventId ?? "") === (right.sourceEventId ?? "") &&
    (left.sourceEventMs ?? null) === (right.sourceEventMs ?? null) &&
    (left.observedAtMs ?? null) === (right.observedAtMs ?? null) &&
    (left.freshnessStatus ?? "") === (right.freshnessStatus ?? "") &&
    (left.terminalAuthorityStatus ?? "") === (right.terminalAuthorityStatus ?? "") &&
    (left.sourceId ?? "") === (right.sourceId ?? "") &&
    (left.sourceHash ?? "") === (right.sourceHash ?? "") &&
    (left.sourceKind ?? "") === (right.sourceKind ?? "") &&
    (left.sourceTextHash ?? "") === (right.sourceTextHash ?? "") &&
    (left.sourceTextCharCount ?? null) === (right.sourceTextCharCount ?? null) &&
    (left.accountLocale ?? "") === (right.accountLocale ?? "") &&
    (left.projectionTarget ?? "") === (right.projectionTarget ?? "") &&
    (left.targetLanguage ?? "") === (right.targetLanguage ?? "") &&
    (left.cancelRequested ?? null) === (right.cancelRequested ?? null) &&
    (left.source ?? "") === (right.source ?? "") &&
    (left.suppressedServerProjectionKey ?? "") === (right.suppressedServerProjectionKey ?? "") &&
    (left.suppressedObservationRef ?? "") === (right.suppressedObservationRef ?? "") &&
    (left.suppressedReceiptRef ?? "") === (right.suppressedReceiptRef ?? "") &&
    (left.suppressedObservationLaneSessionId ?? "") === (right.suppressedObservationLaneSessionId ?? "") &&
    (left.suppressedGoalBindingId ?? "") === (right.suppressedGoalBindingId ?? "") &&
    (left.suppressedSessionControlKey ?? "") === (right.suppressedSessionControlKey ?? "") &&
    (left.suppressedSourceBindingKey ?? "") === (right.suppressedSourceBindingKey ?? "") &&
    (left.suppressedLatestObservationKey ?? "") === (right.suppressedLatestObservationKey ?? "") &&
    (left.suppressedLatestMailLoopObservationKey ?? "") === (right.suppressedLatestMailLoopObservationKey ?? "") &&
    (left.suppressedGoalBindingKey ?? "") === (right.suppressedGoalBindingKey ?? "") &&
    (left.suppressedLatestEventId ?? "") === (right.suppressedLatestEventId ?? "") &&
    (left.suppressedHasObservation ?? null) === (right.suppressedHasObservation ?? null) &&
    (left.suppressedProjectionStatus ?? "") === (right.suppressedProjectionStatus ?? "") &&
    (left.suppressedChunkId ?? "") === (right.suppressedChunkId ?? "") &&
    (left.suppressedChunkIndex ?? null) === (right.suppressedChunkIndex ?? null) &&
    (left.suppressedDedupeKey ?? "") === (right.suppressedDedupeKey ?? "") &&
    (left.suppressedSourceEventId ?? "") === (right.suppressedSourceEventId ?? "") &&
    (left.suppressedSourceEventMs ?? null) === (right.suppressedSourceEventMs ?? null) &&
    (left.suppressedObservedAtMs ?? null) === (right.suppressedObservedAtMs ?? null) &&
    (left.suppressedFreshnessStatus ?? "") === (right.suppressedFreshnessStatus ?? "") &&
    (left.suppressedTerminalAuthorityStatus ?? "") === (right.suppressedTerminalAuthorityStatus ?? "") &&
    (left.suppressedSourceId ?? "") === (right.suppressedSourceId ?? "") &&
    (left.suppressedSourceHash ?? "") === (right.suppressedSourceHash ?? "") &&
    (left.suppressedSourceKind ?? "") === (right.suppressedSourceKind ?? "") &&
    (left.suppressedSourceTextHash ?? "") === (right.suppressedSourceTextHash ?? "") &&
    (left.suppressedSourceTextCharCount ?? null) === (right.suppressedSourceTextCharCount ?? null) &&
    (left.suppressedAccountLocale ?? "") === (right.suppressedAccountLocale ?? "") &&
    (left.suppressedProjectionTarget ?? "") === (right.suppressedProjectionTarget ?? "") &&
    (left.suppressedTargetLanguage ?? "") === (right.suppressedTargetLanguage ?? "") &&
    (left.suppressedCancelRequested ?? null) === (right.suppressedCancelRequested ?? null) &&
    (left.suppressedReason ?? "") === (right.suppressedReason ?? "") &&
    (left.terminalEligible ?? null) === (right.terminalEligible ?? null) &&
    (left.assistantAnswer ?? null) === (right.assistantAnswer ?? null) &&
    (left.rawContentIncluded ?? null) === (right.rawContentIncluded ?? null);
}

function compareProjectionOrderValues(left: {
  observedAtMs?: number | null;
  sourceEventMs?: number | null;
  chunkIndex?: number | null;
}, right: {
  observedAtMs?: number | null;
  sourceEventMs?: number | null;
  chunkIndex?: number | null;
}): number {
  const observedDelta =
    (left.observedAtMs ?? Number.MIN_SAFE_INTEGER) -
    (right.observedAtMs ?? Number.MIN_SAFE_INTEGER);
  if (observedDelta !== 0) return observedDelta;
  const sourceEventDelta =
    (left.sourceEventMs ?? Number.MIN_SAFE_INTEGER) -
    (right.sourceEventMs ?? Number.MIN_SAFE_INTEGER);
  if (sourceEventDelta !== 0) return sourceEventDelta;
  return (left.chunkIndex ?? Number.MIN_SAFE_INTEGER) -
    (right.chunkIndex ?? Number.MIN_SAFE_INTEGER);
}

function compareProjectionEventOrder(
  left: DocumentInlineTranslationRenderState,
  right: DocumentInlineTranslationRenderState,
): number {
  return compareProjectionOrderValues(left, right);
}

function compareSuppressedProjectionEventOrder(
  current: DocumentInlineTranslationRenderState,
  laneState: DocumentInlineTranslationRenderState,
): number {
  return compareProjectionOrderValues(
    {
      observedAtMs: current.suppressedObservedAtMs,
      sourceEventMs: current.suppressedSourceEventMs,
      chunkIndex: current.suppressedChunkIndex,
    },
    laneState,
  );
}

function shouldKeepCurrentReadyProjection(
  current: DocumentInlineTranslationRenderState | undefined,
  laneState: DocumentInlineTranslationRenderState,
): boolean {
  if (current?.status !== "ready" || laneState.status !== "ready") return false;
  if (current.source !== "capability_lane" || laneState.source !== "capability_lane") return false;
  return compareProjectionEventOrder(current, laneState) > 0;
}

function shouldKeepCurrentReadyOverProjectionError(
  current: DocumentInlineTranslationRenderState | undefined,
  laneState: DocumentInlineTranslationRenderState,
): boolean {
  if (current?.status !== "ready" || laneState.status !== "error") return false;
  if (current.source !== "capability_lane" || laneState.source !== "capability_lane") return false;
  if (laneState.projectionStatus !== "cancelled" && laneState.projectionStatus !== "failed") return false;
  return Boolean(current.text?.trim());
}

function shouldKeepCurrentFreshReadyOverStaleDisplayText(
  current: DocumentInlineTranslationRenderState | undefined,
  laneState: DocumentInlineTranslationRenderState,
): boolean {
  if (current?.status !== "ready" || laneState.status !== "ready") return false;
  if (current.source !== "capability_lane" || laneState.source !== "capability_lane") return false;
  if (laneState.projectionStatus !== "stale" && laneState.freshnessStatus !== "stale") return false;
  if (current.projectionStatus === "stale" || current.freshnessStatus === "stale") return false;
  return Boolean(current.text?.trim());
}

function attachSuppressedProjectionReceipt(
  current: DocumentInlineTranslationRenderState,
  laneState: DocumentInlineTranslationRenderState,
): DocumentInlineTranslationRenderState {
  if (compareSuppressedProjectionEventOrder(current, laneState) > 0) {
    return current;
  }
  const suppressedReason =
    laneState.projectionStatus === "cancelled"
      ? "cancelled_projection_did_not_replace_ready_text"
      : laneState.projectionStatus === "failed"
        ? "failed_projection_did_not_replace_ready_text"
        : "stale_projection_did_not_replace_fresh_text";
  return {
    ...current,
    ...(laneState.serverProjectionKey ? { suppressedServerProjectionKey: laneState.serverProjectionKey } : {}),
    suppressedObservationRef: laneState.observationRef ?? null,
    suppressedReceiptRef: laneState.receiptRef ?? null,
    ...(laneState.observationLaneSessionId
      ? { suppressedObservationLaneSessionId: laneState.observationLaneSessionId }
      : {}),
    ...(laneState.goalBindingId ? { suppressedGoalBindingId: laneState.goalBindingId } : {}),
    ...(laneState.sessionControlKey ? { suppressedSessionControlKey: laneState.sessionControlKey } : {}),
    ...(laneState.sourceBindingKey ? { suppressedSourceBindingKey: laneState.sourceBindingKey } : {}),
    ...(laneState.latestObservationKey ? { suppressedLatestObservationKey: laneState.latestObservationKey } : {}),
    ...(laneState.latestMailLoopObservationKey
      ? { suppressedLatestMailLoopObservationKey: laneState.latestMailLoopObservationKey }
      : {}),
    ...(laneState.goalBindingKey ? { suppressedGoalBindingKey: laneState.goalBindingKey } : {}),
    ...(laneState.latestEventId ? { suppressedLatestEventId: laneState.latestEventId } : {}),
    ...(laneState.hasObservation ? { suppressedHasObservation: true } : {}),
    suppressedProjectionStatus: laneState.projectionStatus ?? null,
    suppressedChunkId: laneState.chunkId ?? null,
    suppressedChunkIndex: laneState.chunkIndex ?? null,
    suppressedDedupeKey: laneState.dedupeKey ?? null,
    suppressedSourceEventId: laneState.sourceEventId ?? null,
    suppressedSourceEventMs: laneState.sourceEventMs ?? null,
    suppressedObservedAtMs: laneState.observedAtMs ?? null,
    suppressedFreshnessStatus: laneState.freshnessStatus ?? null,
    suppressedTerminalAuthorityStatus: laneState.terminalAuthorityStatus ?? null,
    suppressedSourceId: laneState.sourceId ?? null,
    suppressedSourceHash: laneState.sourceHash ?? null,
    suppressedSourceKind: laneState.sourceKind ?? null,
    ...(laneState.sourceTextHash ? { suppressedSourceTextHash: laneState.sourceTextHash } : {}),
    ...(typeof laneState.sourceTextCharCount === "number"
      ? { suppressedSourceTextCharCount: laneState.sourceTextCharCount }
      : {}),
    suppressedAccountLocale: laneState.accountLocale ?? null,
    suppressedProjectionTarget: laneState.projectionTarget ?? null,
    suppressedTargetLanguage: laneState.targetLanguage ?? null,
    suppressedCancelRequested: laneState.cancelRequested ?? null,
    suppressedReason,
  };
}

export function buildDocumentLiveTranslationInlineStates(
  input: BuildDocumentLiveTranslationInlineStatesInput,
): Record<string, DocumentLiveTranslationInlineState> {
  const sourceId = documentMarkdownSourceId(input.docPath);
  const projections = buildHelixLiveTranslationUiProjections(input.payload);
  const states = buildHelixLiveTranslationInlineUnitStates({
    projections,
    sourceId,
    sourceHash: input.sourceHash,
    sourceTextHash: input.sourceTextHash,
    sourceTextCharCount: input.sourceTextCharCount,
    projectionTarget: input.projectionTarget ?? HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
    targetLanguage: input.locale,
    units: input.units,
    allowStaleDisplayText: input.allowStaleDisplayText,
  });

  return Object.fromEntries(
    Object.entries(states).map(([unitId, state]) => [
      unitId,
      {
        status: state.status,
        ...(state.status === "ready" ? { text: state.text } : { error: state.error }),
        ...(state.projectionKey ? { serverProjectionKey: state.projectionKey } : {}),
        observationRef: state.observationRef,
        receiptRef: state.receiptRef,
        laneSessionId: state.laneSessionId,
        observationLaneSessionId: state.observationLaneSessionId,
        goalBindingId: state.goalBindingId,
        ...(state.sessionControlKey ? { sessionControlKey: state.sessionControlKey } : {}),
        ...(state.sourceBindingKey ? { sourceBindingKey: state.sourceBindingKey } : {}),
        ...(state.latestObservationKey ? { latestObservationKey: state.latestObservationKey } : {}),
        ...(state.latestMailLoopObservationKey
          ? { latestMailLoopObservationKey: state.latestMailLoopObservationKey }
          : {}),
        ...(state.goalBindingKey ? { goalBindingKey: state.goalBindingKey } : {}),
        latestEventId: state.latestEventId,
        hasObservation: state.hasObservation,
        selectedBackendProvider: state.selectedBackendProvider,
        projectionStatus: state.projectionStatus,
        chunkId: state.chunkId,
        chunkIndex: state.chunkIndex,
        dedupeKey: state.dedupeKey,
        sourceEventId: state.sourceEventId,
        sourceEventMs: state.sourceEventMs,
        observedAtMs: state.observedAtMs,
        freshnessStatus: state.freshnessStatus,
        terminalAuthorityStatus: state.terminalAuthorityStatus,
        sourceId: state.sourceId,
        ...(state.sourceHash ? { sourceHash: state.sourceHash } : {}),
        sourceKind: state.sourceKind,
        ...(state.sourceTextHash ? { sourceTextHash: state.sourceTextHash } : {}),
        ...(typeof state.sourceTextCharCount === "number" ? { sourceTextCharCount: state.sourceTextCharCount } : {}),
        accountLocale: state.accountLocale,
        projectionTarget: state.projectionTarget,
        targetLanguage: state.targetLanguage,
        cancelRequested: state.cancelRequested,
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    ]),
  );
}

export function simplifyDocumentLiveTranslationInlineStates(
  laneStates: Record<string, DocumentLiveTranslationInlineState>,
): Record<string, DocumentInlineTranslationRenderState> {
  return Object.fromEntries(
    Object.entries(laneStates).map(([unitId, state]) => [
      unitId,
      state.status === "ready"
        ? {
          status: "ready",
          text: state.text ?? "",
          ...(state.serverProjectionKey ? { serverProjectionKey: state.serverProjectionKey } : {}),
          observationRef: state.observationRef,
          receiptRef: state.receiptRef,
          laneSessionId: state.laneSessionId,
          observationLaneSessionId: state.observationLaneSessionId,
          goalBindingId: state.goalBindingId,
          ...(state.sessionControlKey ? { sessionControlKey: state.sessionControlKey } : {}),
          ...(state.sourceBindingKey ? { sourceBindingKey: state.sourceBindingKey } : {}),
          ...(state.latestObservationKey ? { latestObservationKey: state.latestObservationKey } : {}),
          ...(state.latestMailLoopObservationKey
            ? { latestMailLoopObservationKey: state.latestMailLoopObservationKey }
            : {}),
          ...(state.goalBindingKey ? { goalBindingKey: state.goalBindingKey } : {}),
          latestEventId: state.latestEventId,
          hasObservation: state.hasObservation,
          selectedBackendProvider: state.selectedBackendProvider,
          projectionStatus: state.projectionStatus,
          chunkId: state.chunkId,
          chunkIndex: state.chunkIndex,
          dedupeKey: state.dedupeKey,
          sourceEventId: state.sourceEventId,
          sourceEventMs: state.sourceEventMs,
          observedAtMs: state.observedAtMs,
          freshnessStatus: state.freshnessStatus,
          terminalAuthorityStatus: state.terminalAuthorityStatus,
          sourceId: state.sourceId,
          ...(state.sourceHash ? { sourceHash: state.sourceHash } : {}),
          sourceKind: state.sourceKind,
          ...(state.sourceTextHash ? { sourceTextHash: state.sourceTextHash } : {}),
          ...(typeof state.sourceTextCharCount === "number" ? { sourceTextCharCount: state.sourceTextCharCount } : {}),
          accountLocale: state.accountLocale,
          projectionTarget: state.projectionTarget,
          targetLanguage: state.targetLanguage,
          cancelRequested: state.cancelRequested,
          source: state.source,
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        }
        : {
          status: "error",
          error: state.error ?? `translation_projection_${state.projectionStatus}`,
          ...(state.serverProjectionKey ? { serverProjectionKey: state.serverProjectionKey } : {}),
          observationRef: state.observationRef,
          receiptRef: state.receiptRef,
          laneSessionId: state.laneSessionId,
          observationLaneSessionId: state.observationLaneSessionId,
          goalBindingId: state.goalBindingId,
          ...(state.sessionControlKey ? { sessionControlKey: state.sessionControlKey } : {}),
          ...(state.sourceBindingKey ? { sourceBindingKey: state.sourceBindingKey } : {}),
          ...(state.latestObservationKey ? { latestObservationKey: state.latestObservationKey } : {}),
          ...(state.latestMailLoopObservationKey
            ? { latestMailLoopObservationKey: state.latestMailLoopObservationKey }
            : {}),
          ...(state.goalBindingKey ? { goalBindingKey: state.goalBindingKey } : {}),
          latestEventId: state.latestEventId,
          hasObservation: state.hasObservation,
          selectedBackendProvider: state.selectedBackendProvider,
          projectionStatus: state.projectionStatus,
          chunkId: state.chunkId,
          chunkIndex: state.chunkIndex,
          dedupeKey: state.dedupeKey,
          sourceEventId: state.sourceEventId,
          sourceEventMs: state.sourceEventMs,
          observedAtMs: state.observedAtMs,
          freshnessStatus: state.freshnessStatus,
          terminalAuthorityStatus: state.terminalAuthorityStatus,
          sourceId: state.sourceId,
          ...(state.sourceHash ? { sourceHash: state.sourceHash } : {}),
          sourceKind: state.sourceKind,
          ...(state.sourceTextHash ? { sourceTextHash: state.sourceTextHash } : {}),
          ...(typeof state.sourceTextCharCount === "number" ? { sourceTextCharCount: state.sourceTextCharCount } : {}),
          accountLocale: state.accountLocale,
          projectionTarget: state.projectionTarget,
          targetLanguage: state.targetLanguage,
          cancelRequested: state.cancelRequested,
          source: state.source,
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
    ]),
  );
}

export function mergeDocumentLiveTranslationInlineStates(
  input: MergeDocumentLiveTranslationInlineStatesInput,
): Record<string, DocumentInlineTranslationRenderState> {
  const simpleLaneStates = simplifyDocumentLiveTranslationInlineStates(input.laneStates);
  let changed = false;
  const next = { ...input.current };
  for (const [unitId, laneState] of Object.entries(simpleLaneStates)) {
    const current = next[unitId];
    if (laneState.status === "ready" && typeof laneState.text === "string" && laneState.text.trim()) {
      if (shouldKeepCurrentFreshReadyOverStaleDisplayText(current, laneState)) {
        const preservedState = attachSuppressedProjectionReceipt(current, laneState);
        if (sameDocumentInlineTranslationRenderState(current, preservedState)) continue;
        next[unitId] = preservedState;
        changed = true;
        continue;
      }
      if (shouldKeepCurrentReadyProjection(current, laneState)) continue;
      if (sameDocumentInlineTranslationRenderState(current, laneState)) continue;
      next[unitId] = laneState;
      changed = true;
      continue;
    }
    if (shouldKeepCurrentReadyOverProjectionError(current, laneState)) {
      const preservedState = attachSuppressedProjectionReceipt(current, laneState);
      if (sameDocumentInlineTranslationRenderState(current, preservedState)) continue;
      next[unitId] = preservedState;
      changed = true;
      continue;
    }
    if (!current || current.status === "loading") {
      if (sameDocumentInlineTranslationRenderState(current, laneState)) continue;
      next[unitId] = laneState;
      changed = true;
    }
  }
  return changed ? next : input.current;
}
