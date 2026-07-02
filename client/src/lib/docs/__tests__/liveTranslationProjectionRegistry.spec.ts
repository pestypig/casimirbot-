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

const projectedPayload = (text: string, observedAtMs = 100) => ({
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
      latestObservedAtMs: null,
      latestSourceEventMs: null,
      latestObservationRef: null,
      latestReceiptRef: null,
      latestLaneSessionId: null,
      latestSelectedBackendProvider: null,
      latestChunkId: null,
      latestDedupeKey: null,
      latestSourceKind: null,
      latestProjectionTarget: null,
      latestAccountLocale: null,
      latestTargetLanguage: null,
      latestProjectionStatus: null,
      latestFreshnessStatus: null,
      laneSessionCount: 0,
      activeLaneSessionCount: 0,
      blockedLaneSessionCount: 0,
      latestLaneSessionStatus: null,
      latestLaneSessionHealth: null,
      latestLaneSessionUpdatedAtMs: null,
      mailLoopCount: 0,
      pendingMailLoopCount: 0,
      blockedMailLoopCount: 0,
      latestMailLoopStatus: null,
      latestMailLoopId: null,
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

  it("lets a newer cancelled projection replace a current ready document projection", () => {
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
      status: "error",
      error: "translation_projection_cancelled",
      observationRef: "obs:docs:u1:cancelled",
      receiptRef: "receipt:docs:u1:cancelled",
      projectionStatus: "cancelled",
      ...registryMeta({
        observedAtMs: 300,
        cancelRequested: true,
      }),
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
            chunk_id: "u0002",
            observed_at_ms: 300,
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
      latestObservedAtMs: 300,
      latestSourceEventMs: 290,
      latestObservationRef: "obs:docs:u2:cancelled",
      latestReceiptRef: "receipt:docs:u2:cancelled",
      latestLaneSessionId: null,
      latestSelectedBackendProvider: null,
      latestChunkId: "u0002",
      latestDedupeKey: null,
      latestSourceKind: null,
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: null,
      latestTargetLanguage: "es",
      latestProjectionStatus: "cancelled",
      latestFreshnessStatus: "unknown",
      laneSessionCount: 0,
      activeLaneSessionCount: 0,
      blockedLaneSessionCount: 0,
      latestLaneSessionStatus: null,
      latestLaneSessionHealth: null,
      latestLaneSessionUpdatedAtMs: null,
      mailLoopCount: 0,
      pendingMailLoopCount: 0,
      blockedMailLoopCount: 0,
      latestMailLoopStatus: null,
      latestMailLoopId: null,
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
      units: [unit("u0001")],
      eventPayload: laneSessionLiveEvent(),
    });

    expect(snapshot.translations).toEqual({});
    expect(snapshot.laneSessions["lane-session-docs"]).toEqual({
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      sessionStatus: "running",
      sessionHealth: "healthy",
      sourceId: "document_markdown:docs/research/nhm2.md",
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
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
      latestTargetLanguage: "es",
      latestObservedAtMs: 300,
      latestSourceEventMs: 250,
      latestObservationRef: "obs:lane-session-docs",
      latestReceiptRef: "receipt:lane-session-docs",
      latestFreshnessStatus: "fresh",
      latestLaneSessionStatus: "running",
      latestLaneSessionHealth: "healthy",
      latestLaneSessionUpdatedAtMs: 325,
      mailLoopCount: 0,
      goalBindingCount: 0,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("ingests matching Ask live-event lane mail-loop state without projecting text", () => {
    const snapshot = ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      eventPayload: laneMailLoopLiveEvent(),
    });

    expect(snapshot.translations).toEqual({});
    expect(snapshot.laneSessions).toEqual({});
    expect(snapshot.mailLoops["stage-play-mail-translation"]).toEqual({
      mailLoopId: "stage-play-mail-translation",
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      stagePlayMailId: "stage-play-mail-translation",
      stagePlayWakeExpected: true,
      mailboxThreadId: "thread-docs-translation",
      mailStatus: "unread",
      blockedReason: null,
      sourceId: "document_markdown:docs/research/nhm2.md",
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
      latestSelectedBackendProvider: "live_translation.local_runtime",
      latestSourceKind: "docs",
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
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
      units: [unit("u0001")],
      eventPayload: laneGoalBindingLiveEvent(),
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
      latestSourceKind: "docs",
      latestProjectionTarget: "docs_chunk",
      latestAccountLocale: "es-US",
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
