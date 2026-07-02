import type { DocumentTranslationUnit } from "@shared/document-translation";
import {
  buildHelixLiveTranslationInlineUnitStates,
  buildHelixLiveTranslationUiProjections,
  type HelixLiveTranslationInlineUnitState,
} from "@/lib/helix/live-translation-projection";
import { documentMarkdownSourceId } from "@/lib/docs/documentTranslationClient";

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
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  cancelRequested?: boolean;
  source?: "capability_lane";
  terminalEligible?: false;
  assistantAnswer?: false;
  rawContentIncluded?: false;
};

export type BuildDocumentLiveTranslationInlineStatesInput = {
  payload: unknown;
  docPath: string;
  locale: string;
  units: DocumentTranslationUnit[];
  projectionTarget?: "docs_chunk" | "docs_selection" | "docs_hover" | string;
  allowStaleDisplayText?: boolean;
};

export type MergeDocumentLiveTranslationInlineStatesInput = {
  current: Record<string, DocumentInlineTranslationRenderState>;
  laneStates: Record<string, DocumentLiveTranslationInlineState>;
};

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
    (left.projectionTarget ?? "") === (right.projectionTarget ?? "") &&
    (left.targetLanguage ?? "") === (right.targetLanguage ?? "") &&
    (left.cancelRequested ?? null) === (right.cancelRequested ?? null) &&
    (left.source ?? "") === (right.source ?? "") &&
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

function shouldReplaceCurrentReadyWithProjectionError(
  current: DocumentInlineTranslationRenderState | undefined,
  laneState: DocumentInlineTranslationRenderState,
): boolean {
  if (current?.status !== "ready" || laneState.status !== "error") return false;
  if (current.source !== "capability_lane" || laneState.source !== "capability_lane") return false;
  if (laneState.projectionStatus !== "cancelled" && laneState.projectionStatus !== "failed") return false;
  return projectionEventSortValue(laneState) >= projectionEventSortValue(current);
}

export function buildDocumentLiveTranslationInlineStates(
  input: BuildDocumentLiveTranslationInlineStatesInput,
): Record<string, DocumentLiveTranslationInlineState> {
  const sourceId = documentMarkdownSourceId(input.docPath);
  const projections = buildHelixLiveTranslationUiProjections(input.payload);
  const states = buildHelixLiveTranslationInlineUnitStates({
    projections,
    sourceId,
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
  const next = { ...input.current };
  for (const [unitId, laneState] of Object.entries(simpleLaneStates)) {
    const current = next[unitId];
    if (laneState.status === "ready" && typeof laneState.text === "string" && laneState.text.trim()) {
      if (shouldKeepCurrentReadyProjection(current, laneState)) continue;
      next[unitId] = laneState;
      continue;
    }
    if (shouldReplaceCurrentReadyWithProjectionError(current, laneState)) {
      next[unitId] = laneState;
      continue;
    }
    if (!current || current.status === "loading") {
      next[unitId] = laneState;
    }
  }
  return next;
}
