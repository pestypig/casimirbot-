import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DocumentTranslationUnit } from "@shared/document-translation";
import {
  clearDocumentLiveTranslationProjectionRegistry,
  documentLiveTranslationProjectionRegistryKey,
  ingestDocumentLiveTranslationProjection,
  ingestDocumentLiveTranslationProjectionFromAskLiveEvent,
  readDocumentLiveTranslationProjectionSnapshot,
  summarizeDocumentLiveTranslationProjectionSnapshot,
  subscribeDocumentLiveTranslationProjectionRegistry,
} from "@/lib/docs/liveTranslationProjectionRegistry";

const unit = (unitId: string): DocumentTranslationUnit => ({
  unit_id: unitId,
  kind: "paragraph",
  source_markdown: `Source ${unitId}`,
  translatable: true,
  protected_spans: [],
});

const projectedPayload = (
  text: string,
  observedAtMs = 100,
  overrides: Record<string, unknown> = {},
) => ({
  capability_lane_projection_receipts: [
    {
      schema: "helix.live_translation.projection_receipt.v1",
      receipt_ref: `receipt:docs:u1:${observedAtMs}`,
      observation_ref: `obs:docs:u1:${observedAtMs}`,
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      projection_target: "docs_chunk",
      projection_status: "projected",
      source_id: "document_markdown:docs/research/nhm2.md",
      chunk_id: "u0001",
      observed_at_ms: observedAtMs,
      target_language: "es",
      translated_text: text,
      ...overrides,
    },
  ],
});

const registryMeta = (overrides: Record<string, unknown> = {}) => ({
  chunkId: "u0001",
  chunkIndex: null,
  dedupeKey: null,
  sourceEventId: null,
  sourceEventMs: null,
  observedAtMs: 100,
  laneSessionId: null,
  selectedBackendProvider: null,
  freshnessStatus: "unknown",
  terminalAuthorityStatus: "not_terminal_authority",
  sourceId: "document_markdown:docs/research/nhm2.md",
  sourceKind: null,
  accountLocale: null,
  projectionTarget: "docs_chunk",
  targetLanguage: "es",
  cancelRequested: false,
  ...overrides,
});

const laneSessionLiveEvent = (overrides: Record<string, unknown> = {}) => ({
  contextId: "helix-ask:desktop",
  entry: {
    id: "lane-session-live-event",
    text: "Lane session update.",
    meta: {
      source_event_type: "lane_session",
      lane: "live_translation",
      laneSessionId: "lane-session-docs",
      lifecycleAction: "start",
      permissionProfile: "permissions non-mutating",
      sessionStatus: "running",
      sessionHealth: "healthy",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceKind: "docs",
      latestProjectionTarget: "docs_chunk",
      accountLocale: "es-US",
      targetLanguage: "es",
      selectedBackendProvider: "live_translation.local_runtime",
      latestChunkId: "u0001",
      latestChunkIndex: 0,
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceEventId: "docs:event:1",
      latestSourceEventMs: 250,
      latestObservedAtMs: 300,
      latestFreshnessStatus: "fresh",
      observationRef: "obs:lane-session-docs",
      receiptRef: "receipt:lane-session-docs",
      updatedAtMs: 325,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
      ...overrides,
    },
  },
});

const laneMailLoopLiveEvent = (overrides: Record<string, unknown> = {}) => ({
  contextId: "helix-ask:desktop",
  entry: {
    id: "lane-mail-loop-live-event",
    text: "Lane mail loop update.",
    meta: {
      source_event_type: "lane_mail_loop",
      lane: "live_translation",
      laneSessionId: "lane-session-docs",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceKind: "docs",
      accountLocale: "es-US",
      latestProjectionTarget: "docs_chunk",
      latestChunkId: "u0001",
      latestChunkIndex: 0,
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceEventId: "docs:event:1",
      latestSourceEventMs: 250,
      latestObservedAtMs: 300,
      latestFreshnessStatus: "fresh",
      targetLanguage: "es",
      stagePlayMailId: "stage-play-mail-translation",
      stagePlayWakeExpected: true,
      mailboxThreadId: "thread-docs-translation",
      mailStatus: "unread",
      selectedBackendProvider: "live_translation.local_runtime",
      observationRef: "obs:lane-mail-loop-docs",
      receiptRef: "receipt:lane-mail-loop-docs",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
      ...overrides,
    },
  },
});

const laneGoalBindingLiveEvent = (overrides: Record<string, unknown> = {}) => ({
  contextId: "helix-ask:desktop",
  entry: {
    id: "goal-binding-translate-docs",
    text: "Goal-bound lane session update.",
    meta: {
      source_event_type: "lane_goal_binding",
      lane: "live_translation",
      goalBindingId: "goal-binding-translate-docs",
      goalId: "goal-account-language",
      laneSessionId: "lane-session-docs",
      bindingStatus: "active",
      sessionStatus: "running",
      sessionHealth: "healthy",
      activationPolicy: "while_goal_active",
      attentionPolicy: "quiet_until_salient",
      stopCondition: "goal_complete",
      reportPolicy: "debug_only",
      quietBehavior: "record_only",
      reportAction: "record_only",
      reportReason: "goal_lane_evidence_recorded_for_debug_only",
      selectedBackendProvider: "live_translation.local_runtime",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceKind: "docs",
      accountLocale: "es-US",
      latestProjectionTarget: "docs_chunk",
      targetLanguage: "es",
      latestChunkId: "u0001",
      latestChunkIndex: 0,
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceEventId: "docs:event:1",
      latestSourceEventMs: 250,
      latestObservedAtMs: 300,
      latestFreshnessStatus: "fresh",
      observationRef: "obs:goal-binding-docs",
      receiptRef: "receipt:goal-binding-docs",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
      ...overrides,
    },
  },
});

describe("document live translation projection registry", () => {
  beforeEach(() => {
    clearDocumentLiveTranslationProjectionRegistry();
  });

  it("stores governed lane projections by document, locale, and projection target", () => {
    expect(documentLiveTranslationProjectionRegistryKey({
      docPath: "docs/research/nhm2.md",
      locale: "ES",
      projectionTarget: null,
    })).toBe("docs/research/nhm2.md|es|docs_chunk");

    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto gobernado."),
    });

    expect(snapshot).toMatchObject({
      version: 1,
      translations: {
        u0001: {
          status: "ready",
          text: "Texto gobernado.",
        },
      },
    });
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    })).toBe(snapshot);
  });

  it("can scope governed lane projections by document source hash", () => {
    expect(documentLiveTranslationProjectionRegistryKey({
      docPath: "docs/research/nhm2.md",
      locale: "ES",
      sourceHash: "fnv1a32:new",
      projectionTarget: null,
    })).toBe("docs/research/nhm2.md|es|docs_chunk|fnv1a32:new");

    const oldSnapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:old",
      units: [unit("u0001")],
      payload: projectedPayload("Texto anterior.", 100, { source_hash: "fnv1a32:old" }),
    });
    const newSnapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:new",
      units: [unit("u0001")],
      payload: projectedPayload("Texto nuevo.", 200, { source_hash: "fnv1a32:new" }),
    });

    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:old",
    })).toBe(oldSnapshot);
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:new",
    })).toBe(newSnapshot);
    expect(newSnapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto nuevo.",
    });
  });

  it("summarizes an empty projection snapshot without answer authority", () => {
    expect(summarizeDocumentLiveTranslationProjectionSnapshot({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    })).toEqual({
      version: 0,
      totalCount: 0,
      readyCount: 0,
      errorCount: 0,
      healthStatus: "empty",
      hasRenderableText: false,
      hasProjectionErrors: false,
      projectedCount: 0,
      staleCount: 0,
      cancelledCount: 0,
      failedCount: 0,
      latestStatus: null,
      latestObservedAtMs: null,
      latestSourceEventId: null,
      latestSourceEventMs: null,
      latestObservationRef: null,
      latestReceiptRef: null,
      latestLaneSessionId: null,
      latestSelectedBackendProvider: null,
      latestChunkId: null,
      latestChunkIndex: null,
      latestDedupeKey: null,
      latestSource: null,
      latestSourceId: null,
      latestSourceHash: null,
      latestSourceKind: null,
      latestProjectionTarget: null,
      latestAccountLocale: null,
      latestTargetLanguage: null,
      latestProjectionStatus: null,
      latestFreshnessStatus: null,
      latestTerminalAuthorityStatus: "not_terminal_authority",
      latestCancelRequested: false,
      latestError: null,
      suppressedReceiptCount: 0,
      latestSuppressedObservationRef: null,
      latestSuppressedReceiptRef: null,
      latestSuppressedProjectionStatus: null,
      latestSuppressedChunkId: null,
      latestSuppressedChunkIndex: null,
      latestSuppressedDedupeKey: null,
      latestSuppressedSourceEventId: null,
      latestSuppressedSourceEventMs: null,
      latestSuppressedObservedAtMs: null,
      latestSuppressedFreshnessStatus: null,
      latestSuppressedTerminalAuthorityStatus: "not_terminal_authority",
      latestSuppressedSourceId: null,
      latestSuppressedSourceHash: null,
      latestSuppressedSourceKind: null,
      latestSuppressedAccountLocale: null,
      latestSuppressedProjectionTarget: null,
      latestSuppressedTargetLanguage: null,
      latestSuppressedCancelRequested: false,
      latestSuppressedReason: null,
      laneSessionCount: 0,
      activeLaneSessionCount: 0,
      blockedLaneSessionCount: 0,
      latestLaneSessionStatus: null,
      latestLaneSessionHealth: null,
      latestLaneSessionLifecycleAction: null,
      latestLaneSessionPermissionProfile: null,
      latestLaneSessionUpdatedAtMs: null,
      mailLoopCount: 0,
      pendingMailLoopCount: 0,
      blockedMailLoopCount: 0,
      latestMailLoopStatus: null,
      latestMailLoopId: null,
      latestMailLoopDeliveryStatus: null,
      latestPreviousStagePlayMailId: null,
      goalBindingCount: 0,
      activeGoalBindingCount: 0,
      blockedGoalBindingCount: 0,
      latestGoalBindingId: null,
      latestGoalId: null,
      latestGoalBindingStatus: null,
      latestGoalBindingReportAction: null,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("summarizes blocked lane state without projected text as blocked but non-authoritative", () => {
    const summary = summarizeDocumentLiveTranslationProjectionSnapshot({
      version: 1,
      translations: {},
      laneSessions: {
        "lane-session-blocked": {
          laneSessionId: "lane-session-blocked",
          laneId: "live_translation",
          sessionStatus: "blocked",
          sessionHealth: "blocked",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "fnv1a32:block",
          sourceKind: "docs",
          projectionTarget: "docs_chunk",
          accountLocale: "es-US",
          targetLanguage: "es",
          updatedAtMs: 200,
          lastObservationRef: "obs:blocked",
          lastReceiptRef: "receipt:blocked",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      mailLoops: {},
      goalBindings: {},
    });

    expect(summary).toMatchObject({
      totalCount: 0,
      readyCount: 0,
      errorCount: 0,
      healthStatus: "blocked",
      hasRenderableText: false,
      hasProjectionErrors: false,
      laneSessionCount: 1,
      activeLaneSessionCount: 0,
      blockedLaneSessionCount: 1,
      latestLaneSessionId: "lane-session-blocked",
      latestLaneSessionStatus: "blocked",
      latestLaneSessionHealth: "blocked",
      latestLaneSessionUpdatedAtMs: 200,
      latestSourceId: "document_markdown:docs/research/nhm2.md",
      latestSourceHash: "fnv1a32:block",
      latestObservationRef: "obs:blocked",
      latestReceiptRef: "receipt:blocked",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("summarizes active lane state without projected text as degraded but non-authoritative", () => {
    const summary = summarizeDocumentLiveTranslationProjectionSnapshot({
      version: 2,
      translations: {},
      laneSessions: {
        "lane-session-running": {
          laneSessionId: "lane-session-running",
          laneId: "live_translation",
          sessionStatus: "running",
          sessionHealth: "healthy",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "fnv1a32:active",
          sourceKind: "docs",
          projectionTarget: "docs_chunk",
          accountLocale: "es-US",
          targetLanguage: "es",
          updatedAtMs: 300,
          lastObservationRef: null,
          lastReceiptRef: null,
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      mailLoops: {},
      goalBindings: {},
    });

    expect(summary).toMatchObject({
      totalCount: 0,
      readyCount: 0,
      errorCount: 0,
      healthStatus: "degraded",
      hasRenderableText: false,
      hasProjectionErrors: false,
      laneSessionCount: 1,
      activeLaneSessionCount: 1,
      blockedLaneSessionCount: 0,
      latestLaneSessionId: "lane-session-running",
      latestLaneSessionStatus: "running",
      latestLaneSessionHealth: "healthy",
      latestSourceHash: "fnv1a32:active",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("preserves current ready text when a later stale lane projection arrives", () => {
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto vigente.", 100),
    });
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:stale",
            observation_ref: "obs:docs:u1:stale",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "stale",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 200,
            target_language: "es",
            translated_text: "Texto viejo.",
            stale: true,
          },
        ],
      },
    });

    expect(snapshot.translations.u0001).toEqual({
      status: "ready",
      text: "Texto vigente.",
      observationRef: "obs:docs:u1:100",
      receiptRef: "receipt:docs:u1:100",
      projectionStatus: "projected",
      ...registryMeta(),
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("notifies subscribers only when registry state changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDocumentLiveTranslationProjectionRegistry(listener);
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto gobernado.", 100),
    });
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto gobernado.", 100),
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    clearDocumentLiveTranslationProjectionRegistry();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("refreshes subscribers when a same-text projection has newer receipt metadata", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDocumentLiveTranslationProjectionRegistry(listener);
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto gobernado.", 100),
    });
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto gobernado.", 200),
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(snapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto gobernado.",
      observationRef: "obs:docs:u1:200",
      receiptRef: "receipt:docs:u1:200",
      projectionStatus: "projected",
      ...registryMeta({ observedAtMs: 200 }),
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });

    unsubscribe();
  });

  it("refreshes subscribers when a retry has equal timing but different receipt metadata", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDocumentLiveTranslationProjectionRegistry(listener);
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto inicial.", 200),
    });
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:retry",
            observation_ref: "obs:docs:u1:retry",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "projected",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 200,
            target_language: "es",
            translated_text: "Texto reintentado.",
          },
        ],
      },
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(snapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto reintentado.",
      observationRef: "obs:docs:u1:retry",
      receiptRef: "receipt:docs:u1:retry",
      ...registryMeta({ observedAtMs: 200 }),
    });

    unsubscribe();
  });

  it("does not let a late older ready projection replace a newer document projection", () => {
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto nuevo.", 200),
    });
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto viejo.", 100),
    });

    expect(snapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto nuevo.",
      observationRef: "obs:docs:u1:200",
      receiptRef: "receipt:docs:u1:200",
      ...registryMeta({ observedAtMs: 200 }),
    });
  });

  it("does not let stale display text replace a current fresh document projection", () => {
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto fresco.", 200, {
        freshness_status: "fresh",
      }),
    });
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      allowStaleDisplayText: true,
      payload: projectedPayload("Texto obsoleto.", 300, {
        receipt_ref: "receipt:docs:u1:stale",
        observation_ref: "obs:docs:u1:stale",
        projection_status: "stale",
        chunk_index: 7,
        dedupe_key: "dedupe-stale",
        source_event_id: "event-stale",
        source_event_ms: 280,
        freshness_status: "stale",
        terminal_authority_status: "pending_helix_terminal_authority",
        source_hash: "source-hash-stale",
        source_kind: "document_markdown",
        account_locale: "es-US",
        target_language: "es",
        stale: true,
      }),
    });

    expect(snapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto fresco.",
      observationRef: "obs:docs:u1:200",
      receiptRef: "receipt:docs:u1:200",
      projectionStatus: "projected",
      ...registryMeta({
        observedAtMs: 200,
        freshnessStatus: "fresh",
      }),
      suppressedObservationRef: "obs:docs:u1:stale",
      suppressedReceiptRef: "receipt:docs:u1:stale",
      suppressedProjectionStatus: "stale",
      suppressedChunkId: "u0001",
      suppressedChunkIndex: 7,
      suppressedDedupeKey: "dedupe-stale",
      suppressedSourceEventId: "event-stale",
      suppressedSourceEventMs: 280,
      suppressedObservedAtMs: 300,
      suppressedFreshnessStatus: "stale",
      suppressedTerminalAuthorityStatus: "pending_helix_terminal_authority",
      suppressedSourceId: "document_markdown:docs/research/nhm2.md",
      suppressedSourceHash: "source-hash-stale",
      suppressedSourceKind: "document_markdown",
      suppressedAccountLocale: "es-US",
      suppressedProjectionTarget: "docs_chunk",
      suppressedTargetLanguage: "es",
      suppressedCancelRequested: false,
      suppressedReason: "stale_projection_did_not_replace_fresh_text",
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(snapshot)).toMatchObject({
      readyCount: 1,
      hasRenderableText: true,
      latestProjectionStatus: "projected",
      latestReceiptRef: "receipt:docs:u1:200",
      suppressedReceiptCount: 1,
      latestSuppressedObservationRef: "obs:docs:u1:stale",
      latestSuppressedReceiptRef: "receipt:docs:u1:stale",
      latestSuppressedProjectionStatus: "stale",
      latestSuppressedChunkId: "u0001",
      latestSuppressedChunkIndex: 7,
      latestSuppressedDedupeKey: "dedupe-stale",
      latestSuppressedSourceEventId: "event-stale",
      latestSuppressedSourceEventMs: 280,
      latestSuppressedObservedAtMs: 300,
      latestSuppressedFreshnessStatus: "stale",
      latestSuppressedTerminalAuthorityStatus: "pending_helix_terminal_authority",
      latestSuppressedSourceId: "document_markdown:docs/research/nhm2.md",
      latestSuppressedSourceHash: "source-hash-stale",
      latestSuppressedSourceKind: "document_markdown",
      latestSuppressedAccountLocale: "es-US",
      latestSuppressedProjectionTarget: "docs_chunk",
      latestSuppressedTargetLanguage: "es",
      latestSuppressedCancelRequested: false,
      latestSuppressedReason: "stale_projection_did_not_replace_fresh_text",
    });
  });

  it("does not let newer cancelled or failed receipts replace current ready document projection text", () => {
    ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto activo.", 200),
    });
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:cancelled",
            observation_ref: "obs:docs:u1:cancelled",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "cancelled",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 300,
            target_language: "es",
            cancel_requested: true,
          },
        ],
      },
    });

    expect(snapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto activo.",
      observationRef: "obs:docs:u1:200",
      receiptRef: "receipt:docs:u1:200",
      projectionStatus: "projected",
      ...registryMeta({
        observedAtMs: 200,
      }),
      suppressedObservationRef: "obs:docs:u1:cancelled",
      suppressedReceiptRef: "receipt:docs:u1:cancelled",
      suppressedProjectionStatus: "cancelled",
      suppressedChunkId: "u0001",
      suppressedObservedAtMs: 300,
      suppressedTargetLanguage: "es",
      suppressedCancelRequested: true,
      suppressedReason: "cancelled_projection_did_not_replace_ready_text",
    });

    const failedSnapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:failed",
            observation_ref: "obs:docs:u1:failed",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "failed",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 400,
            target_language: "es",
          },
        ],
      },
    });

    expect(failedSnapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto activo.",
      observationRef: "obs:docs:u1:200",
      receiptRef: "receipt:docs:u1:200",
      projectionStatus: "projected",
      ...registryMeta({
        observedAtMs: 200,
      }),
      suppressedObservationRef: "obs:docs:u1:failed",
      suppressedReceiptRef: "receipt:docs:u1:failed",
      suppressedProjectionStatus: "failed",
      suppressedChunkId: "u0001",
      suppressedObservedAtMs: 400,
      suppressedTargetLanguage: "es",
      suppressedCancelRequested: false,
      suppressedReason: "failed_projection_did_not_replace_ready_text",
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(failedSnapshot)).toMatchObject({
      readyCount: 1,
      errorCount: 0,
      hasRenderableText: true,
      hasProjectionErrors: false,
      latestProjectionStatus: "projected",
      latestReceiptRef: "receipt:docs:u1:200",
      suppressedReceiptCount: 1,
      latestSuppressedReceiptRef: "receipt:docs:u1:failed",
      latestSuppressedProjectionStatus: "failed",
      latestSuppressedReason: "failed_projection_did_not_replace_ready_text",
    });
  });

  it("uses suppressed source event time when suppressed observed time is missing", () => {
    const summary = summarizeDocumentLiveTranslationProjectionSnapshot({
      version: 3,
      translations: {
        u0001: {
          status: "ready",
          text: "Texto activo 1.",
          observationRef: "obs:docs:u1:ready",
          receiptRef: "receipt:docs:u1:ready",
          projectionStatus: "projected",
          ...registryMeta({ observedAtMs: 200 }),
          source: "capability_lane",
          suppressedObservationRef: "obs:docs:u1:failed:older",
          suppressedReceiptRef: "receipt:docs:u1:failed:older",
          suppressedProjectionStatus: "failed",
          suppressedChunkId: "u0001",
          suppressedSourceEventId: "event-older",
          suppressedSourceEventMs: 400,
          suppressedTargetLanguage: "es",
          suppressedReason: "failed_projection_did_not_replace_ready_text",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
        u0002: {
          status: "ready",
          text: "Texto activo 2.",
          observationRef: "obs:docs:u2:ready",
          receiptRef: "receipt:docs:u2:ready",
          projectionStatus: "projected",
          ...registryMeta({
            chunkId: "u0002",
            observedAtMs: 210,
          }),
          source: "capability_lane",
          suppressedObservationRef: "obs:docs:u2:cancelled:newer",
          suppressedReceiptRef: "receipt:docs:u2:cancelled:newer",
          suppressedProjectionStatus: "cancelled",
          suppressedChunkId: "u0002",
          suppressedSourceEventId: "event-newer",
          suppressedSourceEventMs: 500,
          suppressedTargetLanguage: "es",
          suppressedCancelRequested: true,
          suppressedReason: "cancelled_projection_did_not_replace_ready_text",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });

    expect(summary).toMatchObject({
      suppressedReceiptCount: 2,
      latestSuppressedObservationRef: "obs:docs:u2:cancelled:newer",
      latestSuppressedReceiptRef: "receipt:docs:u2:cancelled:newer",
      latestSuppressedProjectionStatus: "cancelled",
      latestSuppressedChunkId: "u0002",
      latestSuppressedSourceEventId: "event-newer",
      latestSuppressedSourceEventMs: 500,
      latestSuppressedObservedAtMs: null,
      latestSuppressedTargetLanguage: "es",
      latestSuppressedCancelRequested: true,
      latestSuppressedReason: "cancelled_projection_did_not_replace_ready_text",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("summarizes ready and blocked projection health states", () => {
    const readySnapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: projectedPayload("Texto listo.", 100),
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(readySnapshot)).toMatchObject({
      totalCount: 1,
      readyCount: 1,
      errorCount: 0,
      healthStatus: "ready",
      hasRenderableText: true,
      hasProjectionErrors: false,
    });

    clearDocumentLiveTranslationProjectionRegistry();
    const blockedSnapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:failed",
            observation_ref: "obs:docs:u1:failed",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "failed",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 100,
            target_language: "es",
          },
        ],
      },
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(blockedSnapshot)).toMatchObject({
      totalCount: 1,
      readyCount: 0,
      errorCount: 1,
      healthStatus: "blocked",
      hasRenderableText: false,
      hasProjectionErrors: true,
    });
  });

  it("summarizes projection snapshot health without answer authority", () => {
    const snapshot = ingestDocumentLiveTranslationProjection({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001"), unit("u0002"), unit("u0003")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1",
            observation_ref: "obs:docs:u1",
            lane_session_id: "lane-session-docs",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "projected",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 100,
            source_event_ms: 90,
            target_language: "es",
            translated_text: "Uno.",
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u2:cancelled",
            observation_ref: "obs:docs:u2:cancelled",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "cancelled",
            source_id: "document_markdown:docs/research/nhm2.md",
            source_kind: "document_markdown",
            account_locale: "es-US",
            chunk_id: "u0002",
            chunk_index: 1,
            observed_at_ms: 300,
            source_event_id: "docs:event:u0002",
            source_event_ms: 290,
            target_language: "es",
            cancel_requested: true,
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u3:failed",
            observation_ref: "obs:docs:u3:failed",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "failed",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0003",
            observed_at_ms: 200,
            source_event_ms: 190,
            target_language: "es",
          },
        ],
      },
    });

    expect(summarizeDocumentLiveTranslationProjectionSnapshot(snapshot)).toEqual({
      version: snapshot.version,
      totalCount: 3,
      readyCount: 1,
      errorCount: 2,
      healthStatus: "degraded",
      hasRenderableText: true,
      hasProjectionErrors: true,
      projectedCount: 1,
      staleCount: 0,
      cancelledCount: 1,
      failedCount: 1,
      latestStatus: "error",
      latestObservedAtMs: 300,
      latestSourceEventMs: 290,
      latestObservationRef: "obs:docs:u2:cancelled",
      latestReceiptRef: "receipt:docs:u2:cancelled",
      latestLaneSessionId: null,
      latestSelectedBackendProvider: null,
      latestChunkId: "u0002",
      latestChunkIndex: 1,
      latestDedupeKey: null,
      latestSource: "capability_lane",
      latestSourceId: "document_markdown:docs/research/nhm2.md",
      latestSourceHash: null,
      latestSourceKind: "document_markdown",
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
      latestTargetLanguage: "es",
      latestSourceEventId: "docs:event:u0002",
      latestProjectionStatus: "cancelled",
      latestFreshnessStatus: "unknown",
      latestTerminalAuthorityStatus: "not_terminal_authority",
      latestCancelRequested: true,
      latestError: "translation_projection_cancelled",
      suppressedReceiptCount: 0,
      latestSuppressedObservationRef: null,
      latestSuppressedReceiptRef: null,
      latestSuppressedProjectionStatus: null,
      latestSuppressedChunkId: null,
      latestSuppressedChunkIndex: null,
      latestSuppressedDedupeKey: null,
      latestSuppressedSourceEventId: null,
      latestSuppressedSourceEventMs: null,
      latestSuppressedObservedAtMs: null,
      latestSuppressedFreshnessStatus: null,
      latestSuppressedTerminalAuthorityStatus: "not_terminal_authority",
      latestSuppressedSourceId: null,
      latestSuppressedSourceHash: null,
      latestSuppressedSourceKind: null,
      latestSuppressedAccountLocale: null,
      latestSuppressedProjectionTarget: null,
      latestSuppressedTargetLanguage: null,
      latestSuppressedCancelRequested: false,
      latestSuppressedReason: null,
      laneSessionCount: 0,
      activeLaneSessionCount: 0,
      blockedLaneSessionCount: 0,
      latestLaneSessionStatus: null,
      latestLaneSessionHealth: null,
      latestLaneSessionLifecycleAction: null,
      latestLaneSessionPermissionProfile: null,
      latestLaneSessionUpdatedAtMs: null,
      mailLoopCount: 0,
      pendingMailLoopCount: 0,
      blockedMailLoopCount: 0,
      latestMailLoopStatus: null,
      latestMailLoopId: null,
      latestMailLoopDeliveryStatus: null,
      latestPreviousStagePlayMailId: null,
      goalBindingCount: 0,
      activeGoalBindingCount: 0,
      blockedGoalBindingCount: 0,
      latestGoalBindingId: null,
      latestGoalId: null,
      latestGoalBindingStatus: null,
      latestGoalBindingReportAction: null,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ingests matching Ask live-event translation projections into document state", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:live-event",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
            latestObservedAtMs: 300,
            latestFreshnessStatus: "fresh",
            targetLanguage: "es-US",
            translatedText: "Texto desde evento.",
            projectionStatus: "projected",
            receiptRef: "receipt:live-event",
            laneSessionId: "lane-session-live-event",
            selectedBackendProvider: "live_translation.local_runtime",
            observationRef: "obs:live-event",
            terminalEligible: false,
            assistantAnswer: false,
            rawContentIncluded: false,
          },
        },
      },
    });

    expect(snapshot.translations.u0001).toEqual({
      status: "ready",
      text: "Texto desde evento.",
      observationRef: "obs:live-event",
      receiptRef: "receipt:live-event",
      laneSessionId: "lane-session-live-event",
      projectionStatus: "projected",
      ...registryMeta({
        dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
        observedAtMs: 300,
        laneSessionId: "lane-session-live-event",
        selectedBackendProvider: "live_translation.local_runtime",
        freshnessStatus: "fresh",
        targetLanguage: "es-US",
      }),
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ingests base-language live-event projections for regional account locales", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es-US",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:live-event-base-language",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestObservedAtMs: 350,
            latestFreshnessStatus: "fresh",
            targetLanguage: "es",
            translatedText: "Texto base desde evento.",
            projectionStatus: "projected",
            receiptRef: "receipt:live-event-base-language",
            observationRef: "obs:live-event-base-language",
            terminalEligible: false,
            assistantAnswer: false,
            rawContentIncluded: false,
          },
        },
      },
    });

    expect(snapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto base desde evento.",
      observationRef: "obs:live-event-base-language",
      receiptRef: "receipt:live-event-base-language",
      projectionStatus: "projected",
      targetLanguage: "es",
      observedAtMs: 350,
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ingests matching Ask live-event lane session state without projecting text", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:session",
      units: [unit("u0001")],
      eventPayload: laneSessionLiveEvent({
        sourceHash: "fnv1a32:session",
        terminalAuthorityStatus: "pending_helix_terminal_authority",
      }),
    });

    expect(snapshot.translations).toEqual({});
    expect(snapshot.laneSessions["lane-session-docs"]).toEqual({
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      lifecycleAction: "start",
      permissionProfile: "permissions non-mutating",
      sessionStatus: "running",
      sessionHealth: "healthy",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceHash: "fnv1a32:session",
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es-US",
      targetLanguage: "es",
      selectedBackendProvider: "live_translation.local_runtime",
      latestChunkId: "u0001",
      latestChunkIndex: 0,
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceEventId: "docs:event:1",
      latestSourceEventMs: 250,
      latestObservedAtMs: 300,
      latestFreshnessStatus: "fresh",
      terminalAuthorityStatus: "pending_helix_terminal_authority",
      lastObservationRef: "obs:lane-session-docs",
      lastReceiptRef: "receipt:lane-session-docs",
      updatedAtMs: 325,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(snapshot)).toMatchObject({
      totalCount: 0,
      readyCount: 0,
      laneSessionCount: 1,
      activeLaneSessionCount: 1,
      blockedLaneSessionCount: 0,
      latestLaneSessionId: "lane-session-docs",
      latestSelectedBackendProvider: "live_translation.local_runtime",
      latestChunkId: "u0001",
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceKind: "docs",
      latestSourceHash: "fnv1a32:session",
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
      latestTargetLanguage: "es",
      latestObservedAtMs: 300,
      latestSourceEventMs: 250,
      latestObservationRef: "obs:lane-session-docs",
      latestReceiptRef: "receipt:lane-session-docs",
      latestFreshnessStatus: "fresh",
      latestTerminalAuthorityStatus: "pending_helix_terminal_authority",
      latestLaneSessionStatus: "running",
      latestLaneSessionHealth: "healthy",
      latestLaneSessionLifecycleAction: "start",
      latestLaneSessionPermissionProfile: "permissions non-mutating",
      latestLaneSessionUpdatedAtMs: 325,
      mailLoopCount: 0,
      goalBindingCount: 0,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("normalizes serialized lane session chunk timing metadata from Ask live events", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneSessionLiveEvent({
        latestChunkIndex: "4",
        latestSourceEventMs: "450",
        latestObservedAtMs: "500",
        updatedAtMs: "525",
      }),
    });

    expect(snapshot.laneSessions["lane-session-docs"]).toMatchObject({
      latestChunkIndex: 4,
      latestSourceEventMs: 450,
      latestObservedAtMs: 500,
      updatedAtMs: 525,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(snapshot)).toMatchObject({
      latestChunkIndex: 4,
      latestSourceEventMs: 450,
      latestObservedAtMs: 500,
      latestLaneSessionUpdatedAtMs: 525,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ingests matching Ask live-event lane mail-loop state without projecting text", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:mail",
      units: [unit("u0001")],
      eventPayload: laneMailLoopLiveEvent({
        sourceHash: "fnv1a32:mail",
        terminalAuthorityStatus: "pending_helix_terminal_authority",
        stagePlayMailDeliveryStatus: "deduped_existing",
        previousStagePlayMailId: "stage-play-mail-translation",
      }),
    });

    expect(snapshot.translations).toEqual({});
    expect(snapshot.laneSessions).toEqual({});
    expect(snapshot.mailLoops["stage-play-mail-translation"]).toEqual({
      mailLoopId: "stage-play-mail-translation",
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      stagePlayMailId: "stage-play-mail-translation",
      stagePlayMailDeliveryStatus: "deduped_existing",
      previousStagePlayMailId: "stage-play-mail-translation",
      stagePlayWakeExpected: true,
      mailboxThreadId: "thread-docs-translation",
      mailStatus: "unread",
      blockedReason: null,
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceHash: "fnv1a32:mail",
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es-US",
      targetLanguage: "es",
      selectedBackendProvider: "live_translation.local_runtime",
      latestChunkId: "u0001",
      latestChunkIndex: 0,
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceEventId: "docs:event:1",
      latestSourceEventMs: 250,
      latestObservedAtMs: 300,
      latestFreshnessStatus: "fresh",
      terminalAuthorityStatus: "pending_helix_terminal_authority",
      observationRef: "obs:lane-mail-loop-docs",
      receiptRef: "receipt:lane-mail-loop-docs",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(snapshot)).toMatchObject({
      totalCount: 0,
      readyCount: 0,
      laneSessionCount: 0,
      mailLoopCount: 1,
      pendingMailLoopCount: 1,
      blockedMailLoopCount: 0,
      latestMailLoopStatus: "unread",
      latestMailLoopId: "stage-play-mail-translation",
      latestMailLoopDeliveryStatus: "deduped_existing",
      latestPreviousStagePlayMailId: "stage-play-mail-translation",
      latestSelectedBackendProvider: "live_translation.local_runtime",
      latestSourceHash: "fnv1a32:mail",
      latestSourceKind: "docs",
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
      latestTerminalAuthorityStatus: "pending_helix_terminal_authority",
      goalBindingCount: 0,
      activeGoalBindingCount: 0,
      blockedGoalBindingCount: 0,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("keeps newer mail-loop lifecycle state when a late older blocked event arrives", () => {
    ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneMailLoopLiveEvent({
        stagePlayWakeExpected: true,
        mailStatus: "unread",
        blockedReason: "translation_backend_busy",
        latestObservedAtMs: 100,
        observationRef: "obs:lane-mail-loop-docs:blocked",
        stagePlayMailDeliveryStatus: "deduped_existing",
        previousStagePlayMailId: "stage-play-mail-translation",
      }),
    });
    const clearedSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneMailLoopLiveEvent({
        stagePlayWakeExpected: false,
        mailStatus: "processed",
        blockedReason: null,
        latestObservedAtMs: 300,
        observationRef: "obs:lane-mail-loop-docs:processed",
      }),
    });
    const lateSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneMailLoopLiveEvent({
        stagePlayWakeExpected: true,
        mailStatus: "unread",
        blockedReason: "translation_backend_busy",
        latestObservedAtMs: 200,
        observationRef: "obs:lane-mail-loop-docs:late-blocked",
      }),
    });

    expect(lateSnapshot).toBe(clearedSnapshot);
    expect(lateSnapshot.mailLoops["stage-play-mail-translation"]).toMatchObject({
      stagePlayWakeExpected: false,
      mailStatus: "processed",
      blockedReason: null,
      stagePlayMailDeliveryStatus: "deduped_existing",
      previousStagePlayMailId: "stage-play-mail-translation",
      selectedBackendProvider: "live_translation.local_runtime",
      latestObservedAtMs: 300,
      observationRef: "obs:lane-mail-loop-docs:processed",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(lateSnapshot)).toMatchObject({
      mailLoopCount: 1,
      pendingMailLoopCount: 0,
      blockedMailLoopCount: 0,
      latestMailLoopStatus: "processed",
      latestMailLoopId: "stage-play-mail-translation",
      latestMailLoopDeliveryStatus: "deduped_existing",
      latestPreviousStagePlayMailId: "stage-play-mail-translation",
      latestSelectedBackendProvider: "live_translation.local_runtime",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ignores Ask live-event lane mail-loop rows for a different target language than the active locale", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneMailLoopLiveEvent({
        targetLanguage: "fr",
        latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:fr",
      }),
    });

    expect(snapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
  });

  it("ingests matching Ask live-event goal binding state without projecting text", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:goal",
      units: [unit("u0001")],
      eventPayload: laneGoalBindingLiveEvent({
        sourceHash: "fnv1a32:goal",
        terminalAuthorityStatus: "pending_helix_terminal_authority",
      }),
    });

    expect(snapshot.translations).toEqual({});
    expect(snapshot.laneSessions).toEqual({});
    expect(snapshot.mailLoops).toEqual({});
    expect(snapshot.goalBindings["goal-binding-translate-docs"]).toEqual({
      goalBindingId: "goal-binding-translate-docs",
      goalId: "goal-account-language",
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      bindingStatus: "active",
      sessionStatus: "running",
      sessionHealth: "healthy",
      activationPolicy: "while_goal_active",
      attentionPolicy: "quiet_until_salient",
      stopCondition: "goal_complete",
      reportPolicy: "debug_only",
      quietBehavior: "record_only",
      reportAction: "record_only",
      reportReason: "goal_lane_evidence_recorded_for_debug_only",
      selectedBackendProvider: "live_translation.local_runtime",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceHash: "fnv1a32:goal",
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es-US",
      targetLanguage: "es",
      latestChunkId: "u0001",
      latestChunkIndex: 0,
      latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestSourceEventId: "docs:event:1",
      latestSourceEventMs: 250,
      latestObservedAtMs: 300,
      latestFreshnessStatus: "fresh",
      terminalAuthorityStatus: "pending_helix_terminal_authority",
      observationRef: "obs:goal-binding-docs",
      receiptRef: "receipt:goal-binding-docs",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(snapshot)).toMatchObject({
      totalCount: 0,
      readyCount: 0,
      laneSessionCount: 0,
      mailLoopCount: 0,
      goalBindingCount: 1,
      activeGoalBindingCount: 1,
      blockedGoalBindingCount: 0,
      latestGoalBindingId: "goal-binding-translate-docs",
      latestGoalId: "goal-account-language",
      latestGoalBindingStatus: "active",
      latestGoalBindingReportAction: "record_only",
      latestSelectedBackendProvider: "live_translation.local_runtime",
      latestSourceHash: "fnv1a32:goal",
      latestSourceKind: "docs",
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
      latestTerminalAuthorityStatus: "pending_helix_terminal_authority",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ignores Ask live-event goal binding rows for a different target language than the active locale", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneGoalBindingLiveEvent({
        targetLanguage: "fr",
        latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:fr",
      }),
    });

    expect(snapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
  });

  it("keeps newer lane session lifecycle state when a late older event arrives", () => {
    ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneSessionLiveEvent({
        sessionStatus: "running",
        sessionHealth: "healthy",
        updatedAtMs: 100,
        latestObservedAtMs: 100,
        observationRef: "obs:lane-session-docs:running",
      }),
    });
    const blockedSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneSessionLiveEvent({
        sessionStatus: "blocked",
        sessionHealth: "blocked",
        updatedAtMs: 300,
        latestObservedAtMs: 300,
        observationRef: "obs:lane-session-docs:blocked",
      }),
    });
    const lateSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneSessionLiveEvent({
        sessionStatus: "running",
        sessionHealth: "healthy",
        updatedAtMs: 200,
        latestObservedAtMs: 200,
        observationRef: "obs:lane-session-docs:late-running",
      }),
    });

    expect(lateSnapshot).toBe(blockedSnapshot);
    expect(lateSnapshot.laneSessions["lane-session-docs"]).toMatchObject({
      sessionStatus: "blocked",
      sessionHealth: "blocked",
      lastObservationRef: "obs:lane-session-docs:blocked",
      updatedAtMs: 300,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(summarizeDocumentLiveTranslationProjectionSnapshot(lateSnapshot)).toMatchObject({
      laneSessionCount: 1,
      activeLaneSessionCount: 0,
      blockedLaneSessionCount: 1,
      latestLaneSessionStatus: "blocked",
      latestLaneSessionHealth: "blocked",
      latestLaneSessionLifecycleAction: "start",
      latestLaneSessionPermissionProfile: "permissions non-mutating",
      latestLaneSessionUpdatedAtMs: 300,
      mailLoopCount: 0,
      goalBindingCount: 0,
    });
  });

  it("keeps live-event projections separated by projection target", () => {
    ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_chunk",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:hover",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_hover",
            latestChunkId: "u0001",
            latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es:hover",
            latestObservedAtMs: 400,
            latestFreshnessStatus: "fresh",
            targetLanguage: "es",
            translatedText: "Texto hover.",
            projectionStatus: "projected",
            receiptRef: "receipt:hover",
            observationRef: "obs:hover",
          },
        },
      },
    });

    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_chunk",
    })).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_hover",
    }).translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto hover.",
      observationRef: "obs:hover",
      receiptRef: "receipt:hover",
      projectionStatus: "projected",
      projectionTarget: "docs_hover",
      targetLanguage: "es",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });

    ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_chunk",
      units: [unit("u0002")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:selection",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_selection",
            latestChunkId: "u0002",
            latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0002:es:selection",
            latestObservedAtMs: 450,
            latestFreshnessStatus: "fresh",
            targetLanguage: "es",
            translatedText: "Texto seleccionado.",
            projectionStatus: "projected",
            receiptRef: "receipt:selection",
            observationRef: "obs:selection",
          },
        },
      },
    });

    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_chunk",
    }).translations.u0002).toBeUndefined();
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_hover",
    }).translations.u0002).toBeUndefined();
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      projectionTarget: "docs_selection",
    }).translations.u0002).toMatchObject({
      status: "ready",
      text: "Texto seleccionado.",
      observationRef: "obs:selection",
      receiptRef: "receipt:selection",
      projectionStatus: "projected",
      projectionTarget: "docs_selection",
      targetLanguage: "es",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("keeps live-event projections separated by document source hash when provided", () => {
    const oldSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:old",
      projectionTarget: "docs_chunk",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:old-source",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceHash: "fnv1a32:old",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestObservedAtMs: 300,
            targetLanguage: "es",
            translatedText: "Texto viejo.",
            projectionStatus: "projected",
            receiptRef: "receipt:old-source",
            observationRef: "obs:old-source",
          },
        },
      },
    });
    const mismatchedSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:new",
      projectionTarget: "docs_chunk",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:old-source",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceHash: "fnv1a32:old",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestObservedAtMs: 300,
            targetLanguage: "es",
            translatedText: "Texto viejo.",
            projectionStatus: "projected",
            receiptRef: "receipt:old-source",
            observationRef: "obs:old-source",
          },
        },
      },
    });

    expect(oldSnapshot.translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto viejo.",
      observationRef: "obs:old-source",
      receiptRef: "receipt:old-source",
    });
    expect(mismatchedSnapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:new",
      projectionTarget: "docs_chunk",
    })).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
  });

  it("ignores un-hashed live-event projections for a hash-scoped active document", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:current",
      projectionTarget: "docs_chunk",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:unhashed",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestObservedAtMs: 320,
            targetLanguage: "es",
            translatedText: "Texto sin hash.",
            projectionStatus: "projected",
            receiptRef: "receipt:unhashed",
            observationRef: "obs:unhashed",
          },
        },
      },
    });

    expect(snapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:current",
      projectionTarget: "docs_chunk",
    })).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
  });

  it("ignores stale source-hash live-event session, mail-loop, and goal-binding rows", () => {
    const activeInput = {
      docPath: "docs/research/nhm2.md",
      locale: "es",
      sourceHash: "fnv1a32:current",
      projectionTarget: "docs_chunk",
      units: [unit("u0001")],
    };

    const laneSessionSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      ...activeInput,
      eventPayload: laneSessionLiveEvent({
        sourceHash: "fnv1a32:previous",
        observationRef: "obs:lane-session-previous-source",
      }),
    });
    const mailLoopSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      ...activeInput,
      eventPayload: laneMailLoopLiveEvent({
        sourceHash: "fnv1a32:previous",
        observationRef: "obs:lane-mail-previous-source",
      }),
    });
    const goalBindingSnapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      ...activeInput,
      eventPayload: laneGoalBindingLiveEvent({
        sourceHash: "fnv1a32:previous",
        observationRef: "obs:goal-binding-previous-source",
      }),
    });

    expect(laneSessionSnapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
    expect(mailLoopSnapshot).toEqual(laneSessionSnapshot);
    expect(goalBindingSnapshot).toEqual(laneSessionSnapshot);
    expect(readDocumentLiveTranslationProjectionSnapshot(activeInput)).toEqual(laneSessionSnapshot);
  });

  it("ignores live-event projections for a different target language than the active locale", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:fr",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:fr",
            latestObservedAtMs: 500,
            latestFreshnessStatus: "fresh",
            targetLanguage: "fr",
            translatedText: "Texte francais.",
            projectionStatus: "projected",
            receiptRef: "receipt:fr",
            observationRef: "obs:fr",
          },
        },
      },
    });

    expect(snapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "fr",
      projectionTarget: "docs_chunk",
    })).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
  });

  it("ignores Ask live events that do not target the active document source", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:other-doc",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/other.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            targetLanguage: "es",
            translatedText: "Texto ajeno.",
            projectionStatus: "projected",
          },
        },
      },
    });

    expect(snapshot).toEqual({
      version: 0,
      translations: {},
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });
  });
});
