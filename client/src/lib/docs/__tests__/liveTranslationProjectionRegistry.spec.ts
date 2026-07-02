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
  freshnessStatus: "unknown",
  projectionTarget: "docs_chunk",
  targetLanguage: "es",
  cancelRequested: false,
  ...overrides,
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
      projectedCount: 1,
      staleCount: 0,
      cancelledCount: 1,
      failedCount: 1,
      latestObservedAtMs: 300,
      latestSourceEventMs: 290,
      latestObservationRef: "obs:docs:u2:cancelled",
      latestReceiptRef: "receipt:docs:u2:cancelled",
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
            targetLanguage: "es",
            translatedText: "Texto desde evento.",
            projectionStatus: "projected",
            receiptRef: "receipt:live-event",
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
      projectionStatus: "projected",
      ...registryMeta({
        dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
        observedAtMs: 300,
        freshnessStatus: "fresh",
      }),
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
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
    });
    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "fr",
      projectionTarget: "docs_chunk",
    })).toEqual({
      version: 0,
      translations: {},
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
    });
  });
});
