import type { DocumentTranslationUnit } from "@shared/document-translation";
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
  observationRef: string | null;
  receiptRef: string | null;
  laneSessionId: string | null;
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
  observationRef?: string | null;
  receiptRef?: string | null;
  laneSessionId?: string | null;
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
  accountLocale?: string | null;
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  cancelRequested?: boolean;
  source?: "capability_lane" | "document_microdeck";
  suppressedObservationRef?: string | null;
  suppressedReceiptRef?: string | null;
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
  units: DocumentTranslationUnit[];
  projectionTarget?: "docs_chunk" | "docs_selection" | "docs_hover" | string;
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
  return Object.fromEntries(
    [
      ["data-doc-translation-source", state.source],
      ["data-doc-translation-projection-status", state.projectionStatus],
      ["data-doc-translation-selected-backend-provider", state.selectedBackendProvider],
      ["data-doc-translation-observation-ref", state.observationRef],
      ["data-doc-translation-receipt-ref", state.receiptRef],
      ["data-doc-translation-lane-session-id", state.laneSessionId],
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
      ["data-doc-translation-account-locale", state.accountLocale],
      ["data-doc-translation-projection-target", state.projectionTarget],
      ["data-doc-translation-target-language", state.targetLanguage],
      ["data-doc-translation-cancel-requested", typeof state.cancelRequested === "boolean" ? String(state.cancelRequested) : null],
      ["data-doc-translation-suppressed-observation-ref", state.suppressedObservationRef],
      ["data-doc-translation-suppressed-receipt-ref", state.suppressedReceiptRef],
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
    terminalAuthorityStatus: "not_terminal_authority",
    selectedBackendProvider: entry.selectedBackendProvider,
    sourceId: entry.sourceId,
    ...(entry.sourceHash ? { sourceHash: entry.sourceHash } : {}),
    sourceKind: entry.sourceKind,
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
    (left.observationRef ?? "") === (right.observationRef ?? "") &&
    (left.receiptRef ?? "") === (right.receiptRef ?? "") &&
    (left.laneSessionId ?? "") === (right.laneSessionId ?? "") &&
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
    (left.accountLocale ?? "") === (right.accountLocale ?? "") &&
    (left.projectionTarget ?? "") === (right.projectionTarget ?? "") &&
    (left.targetLanguage ?? "") === (right.targetLanguage ?? "") &&
    (left.cancelRequested ?? null) === (right.cancelRequested ?? null) &&
    (left.source ?? "") === (right.source ?? "") &&
    (left.suppressedObservationRef ?? "") === (right.suppressedObservationRef ?? "") &&
    (left.suppressedReceiptRef ?? "") === (right.suppressedReceiptRef ?? "") &&
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
    (left.suppressedAccountLocale ?? "") === (right.suppressedAccountLocale ?? "") &&
    (left.suppressedProjectionTarget ?? "") === (right.suppressedProjectionTarget ?? "") &&
    (left.suppressedTargetLanguage ?? "") === (right.suppressedTargetLanguage ?? "") &&
    (left.suppressedCancelRequested ?? null) === (right.suppressedCancelRequested ?? null) &&
    (left.suppressedReason ?? "") === (right.suppressedReason ?? "") &&
    (left.terminalEligible ?? null) === (right.terminalEligible ?? null) &&
    (left.assistantAnswer ?? null) === (right.assistantAnswer ?? null) &&
    (left.rawContentIncluded ?? null) === (right.rawContentIncluded ?? null);
}

function projectionEventSortValue(state: DocumentInlineTranslationRenderState): number {
  return state.observedAtMs ?? state.sourceEventMs ?? Number.MIN_SAFE_INTEGER;
}

function shouldKeepCurrentReadyProjection(
  current: DocumentInlineTranslationRenderState | undefined,
  laneState: DocumentInlineTranslationRenderState,
): boolean {
  if (current?.status !== "ready" || laneState.status !== "ready") return false;
  if (current.source !== "capability_lane" || laneState.source !== "capability_lane") return false;
  return projectionEventSortValue(current) > projectionEventSortValue(laneState);
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
  const suppressedReason =
    laneState.projectionStatus === "cancelled"
      ? "cancelled_projection_did_not_replace_ready_text"
      : laneState.projectionStatus === "failed"
        ? "failed_projection_did_not_replace_ready_text"
        : "stale_projection_did_not_replace_fresh_text";
  return {
    ...current,
    suppressedObservationRef: laneState.observationRef ?? null,
    suppressedReceiptRef: laneState.receiptRef ?? null,
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
    projectionTarget: input.projectionTarget ?? "docs_chunk",
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
        observationRef: state.observationRef,
        receiptRef: state.receiptRef,
        laneSessionId: state.laneSessionId,
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
          observationRef: state.observationRef,
          receiptRef: state.receiptRef,
          laneSessionId: state.laneSessionId,
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
          observationRef: state.observationRef,
          receiptRef: state.receiptRef,
          laneSessionId: state.laneSessionId,
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
