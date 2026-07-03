import { describe, expect, it } from "vitest";
import type { DocumentTranslationUnit } from "@shared/document-translation";
import {
  buildDocumentInlineTranslationDataAttributes,
  buildDocumentLiveTranslationInlineStates,
  documentMarkdownTranslationEntryToInlineRenderState,
  filterReadyDocumentInlineTranslationRenderStates,
  formatDocumentInlineTranslationText,
  mergeDocumentLiveTranslationInlineStates,
  sameDocumentInlineTranslationRenderState,
  simplifyDocumentLiveTranslationInlineStates,
} from "@/lib/docs/liveTranslationInlineProjection";
import type { DocumentMarkdownTranslationEntry } from "@/lib/docs/documentTranslationClient";

const unit = (unitId: string, translatable = true): DocumentTranslationUnit => ({
  unit_id: unitId,
  kind: "paragraph",
  source_markdown: `Source ${unitId}`,
  translatable,
  protected_spans: [],
});

const inlineMeta = (overrides: Record<string, unknown> = {}) => ({
  chunkId: null,
  chunkIndex: null,
  dedupeKey: null,
  sourceEventId: null,
  sourceEventMs: null,
  observedAtMs: null,
  laneSessionId: null,
  selectedBackendProvider: null,
  freshnessStatus: "unknown",
  sourceId: "document_markdown:docs/research/nhm2.md",
  sourceKind: null,
  accountLocale: null,
  projectionTarget: "docs_chunk",
  targetLanguage: "es",
  cancelRequested: false,
  ...overrides,
});

describe("document live translation inline projection", () => {
  it("adapts MicroDeck document translation entries into non-terminal inline render state", () => {
    const entry: DocumentMarkdownTranslationEntry = {
      unitId: "u0001",
      status: "ready",
      text: "Texto desde MicroDeck.",
      runId: "micro-run-1",
      role: "assistant",
      observationRef: "obs:micro:u1",
      receiptRef: "receipt:micro:u1",
      docPath: "docs/research/nhm2.md",
      sourceHash: "source-hash",
      chunkId: "doc-inline:source-hash:u0001",
      chunkIndex: 2,
      dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      sourceEventId: "source-event-1",
      sourceEventMs: 240,
      observedAtMs: 250,
      projectionStatus: "projected",
      freshnessStatus: "fresh",
      selectedBackendProvider: "live_translation.local_runtime",
      sourceId: "document_markdown:docs/research/nhm2.md",
      source: "document_microdeck",
      sourceKind: "document_markdown",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      accountLocale: "es-US",
    };

    expect(documentMarkdownTranslationEntryToInlineRenderState(entry)).toEqual({
      status: "ready",
      text: "Texto desde MicroDeck.",
      observationRef: "obs:micro:u1",
      receiptRef: "receipt:micro:u1",
      chunkId: "doc-inline:source-hash:u0001",
      chunkIndex: 2,
      dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      sourceEventId: "source-event-1",
      sourceEventMs: 240,
      observedAtMs: 250,
      projectionStatus: "projected",
      freshnessStatus: "fresh",
      selectedBackendProvider: "live_translation.local_runtime",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceHash: "source-hash",
      sourceKind: "document_markdown",
      accountLocale: "es-US",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      source: "document_microdeck",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("filters cached inline render state down to ready translated text", () => {
    expect(filterReadyDocumentInlineTranslationRenderStates({
      ready: {
        status: "ready",
        text: "Texto listo.",
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      blankReady: {
        status: "ready",
        text: "   ",
      },
      loading: {
        status: "loading",
      },
      error: {
        status: "error",
        error: "translation_projection_failed",
      },
    })).toEqual({
      ready: {
        status: "ready",
        text: "Texto listo.",
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("builds render data attributes for translation projection metadata", () => {
    expect(buildDocumentInlineTranslationDataAttributes({
      status: "error",
      error: "translation_projection_cancelled",
      observationRef: "obs:docs:u1",
      receiptRef: "receipt:docs:u1",
      laneSessionId: "lane-session-docs",
      selectedBackendProvider: "live_translation.local_runtime",
      projectionStatus: "cancelled",
      chunkId: "chunk-1",
      chunkIndex: 3,
      dedupeKey: "dedupe-1",
      sourceEventId: "event-1",
      sourceEventMs: 123,
      observedAtMs: 456,
      freshnessStatus: "fresh",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceHash: "source-hash",
      sourceKind: "document_markdown",
      accountLocale: "es-US",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      cancelRequested: true,
      suppressedObservationRef: "obs:docs:u1:stale",
      suppressedReceiptRef: "receipt:docs:u1:stale",
      suppressedProjectionStatus: "stale",
      suppressedObservedAtMs: 789,
      suppressedFreshnessStatus: "stale",
      suppressedReason: "stale_projection_did_not_replace_fresh_text",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    })).toEqual({
      "data-doc-translation-source": "capability_lane",
      "data-doc-translation-projection-status": "cancelled",
      "data-doc-translation-selected-backend-provider": "live_translation.local_runtime",
      "data-doc-translation-observation-ref": "obs:docs:u1",
      "data-doc-translation-receipt-ref": "receipt:docs:u1",
      "data-doc-translation-lane-session-id": "lane-session-docs",
      "data-doc-translation-chunk-id": "chunk-1",
      "data-doc-translation-chunk-index": "3",
      "data-doc-translation-dedupe-key": "dedupe-1",
      "data-doc-translation-source-event-id": "event-1",
      "data-doc-translation-source-event-ms": "123",
      "data-doc-translation-observed-at-ms": "456",
      "data-doc-translation-freshness-status": "fresh",
      "data-doc-translation-source-id": "document_markdown:docs/research/nhm2.md",
      "data-doc-translation-source-hash": "source-hash",
      "data-doc-translation-source-kind": "document_markdown",
      "data-doc-translation-account-locale": "es-US",
      "data-doc-translation-projection-target": "docs_chunk",
      "data-doc-translation-target-language": "es",
      "data-doc-translation-cancel-requested": "true",
      "data-doc-translation-suppressed-observation-ref": "obs:docs:u1:stale",
      "data-doc-translation-suppressed-receipt-ref": "receipt:docs:u1:stale",
      "data-doc-translation-suppressed-projection-status": "stale",
      "data-doc-translation-suppressed-observed-at-ms": "789",
      "data-doc-translation-suppressed-freshness-status": "stale",
      "data-doc-translation-suppressed-reason": "stale_projection_did_not_replace_fresh_text",
      "data-doc-translation-terminal-eligible": "false",
      "data-doc-translation-assistant-answer": "false",
      "data-doc-translation-raw-content-included": "false",
    });
  });

  it("formats translated markdown-like text for inline document projection", () => {
    expect(formatDocumentInlineTranslationText([
      "### Titulo",
      "- primer punto",
      "1. segundo punto",
      "| celda traducida |",
    ].join("\n"))).toBe([
      "Titulo",
      "primer punto",
      "segundo punto",
      "celda traducida",
    ].join("\n"));
  });

  it("adapts governed live translation receipts into docs inline translation state", () => {
    expect(buildDocumentLiveTranslationInlineStates({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001"), unit("u0002"), unit("u0003", false)],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1",
            observation_ref: "obs:docs:u1",
            lane_session_id: "lane-session-docs",
            selected_backend_provider: "live_translation.local_runtime",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "projected",
            source_id: "document_markdown:docs/research/nhm2.md",
            source_kind: "docs",
            account_locale: "es-US",
            chunk_id: "u0001",
            dedupe_key: "document_markdown:docs/research/nhm2.md:u0001:es",
            observed_at_ms: 100,
            target_language: "es",
            translated_text: "Primer bloque.",
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u2",
            observation_ref: "obs:docs:u2",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "projected",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "batch-1",
            dedupe_key: "document_markdown:docs/research/nhm2.md:u0002:es",
            observed_at_ms: 110,
            target_language: "es",
            translated_text: "Segundo bloque.",
          },
        ],
      },
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Primer bloque.",
        observationRef: "obs:docs:u1",
        receiptRef: "receipt:docs:u1",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
          observedAtMs: 100,
          laneSessionId: "lane-session-docs",
          selectedBackendProvider: "live_translation.local_runtime",
          sourceKind: "docs",
          accountLocale: "es-US",
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "ready",
        text: "Segundo bloque.",
        observationRef: "obs:docs:u2",
        receiptRef: "receipt:docs:u2",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "batch-1",
          dedupeKey: "document_markdown:docs/research/nhm2.md:u0002:es",
          observedAtMs: 110,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("preserves stale, cancelled, and failed lane receipts as non-terminal inline errors", () => {
    expect(buildDocumentLiveTranslationInlineStates({
      docPath: "docs/research/nhm2.md",
      locale: "fr",
      units: [unit("u0001"), unit("u0002"), unit("u0003")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:stale",
            observation_ref: "obs:docs:stale",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "stale",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 100,
            target_language: "fr",
            translated_text: "Ancien bloc.",
            stale: true,
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:cancelled",
            observation_ref: "obs:docs:cancelled",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "cancelled",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0002",
            observed_at_ms: 110,
            target_language: "fr",
            cancel_requested: true,
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:failed",
            observation_ref: "obs:docs:failed",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "failed",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0003",
            observed_at_ms: 120,
            target_language: "fr",
          },
        ],
      },
    })).toEqual({
      u0001: {
        status: "error",
        error: "translation_projection_stale",
        observationRef: "obs:docs:stale",
        receiptRef: "receipt:docs:stale",
        projectionStatus: "stale",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 100,
          targetLanguage: "fr",
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "error",
        error: "translation_projection_cancelled",
        observationRef: "obs:docs:cancelled",
        receiptRef: "receipt:docs:cancelled",
        projectionStatus: "cancelled",
        ...inlineMeta({
          chunkId: "u0002",
          observedAtMs: 110,
          targetLanguage: "fr",
          cancelRequested: true,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0003: {
        status: "error",
        error: "translation_projection_failed",
        observationRef: "obs:docs:failed",
        receiptRef: "receipt:docs:failed",
        projectionStatus: "failed",
        ...inlineMeta({
          chunkId: "u0003",
          observedAtMs: 120,
          targetLanguage: "fr",
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("simplifies and merges lane states into the docs renderer state shape conservatively", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
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
            target_language: "es",
            translated_text: "Texto gobernado.",
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u2",
            observation_ref: "obs:docs:u2",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "cancelled",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0002",
            observed_at_ms: 110,
            target_language: "es",
            cancel_requested: true,
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u3",
            observation_ref: "obs:docs:u3",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "stale",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0003",
            observed_at_ms: 120,
            target_language: "es",
            translated_text: "Texto viejo.",
            stale: true,
          },
        ],
      },
    });

    expect(simplifyDocumentLiveTranslationInlineStates(laneStates)).toEqual({
      u0001: {
        status: "ready",
        text: "Texto gobernado.",
        observationRef: "obs:docs:u1",
        receiptRef: "receipt:docs:u1",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 100,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "error",
        error: "translation_projection_cancelled",
        observationRef: "obs:docs:u2",
        receiptRef: "receipt:docs:u2",
        projectionStatus: "cancelled",
        ...inlineMeta({
          chunkId: "u0002",
          observedAtMs: 110,
          cancelRequested: true,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0003: {
        status: "error",
        error: "translation_projection_stale",
        observationRef: "obs:docs:u3",
        receiptRef: "receipt:docs:u3",
        projectionStatus: "stale",
        ...inlineMeta({
          chunkId: "u0003",
          observedAtMs: 120,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: { status: "loading" },
        u0002: { status: "loading" },
        u0003: { status: "ready", text: "Texto vigente." },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Texto gobernado.",
        observationRef: "obs:docs:u1",
        receiptRef: "receipt:docs:u1",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 100,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "error",
        error: "translation_projection_cancelled",
        observationRef: "obs:docs:u2",
        receiptRef: "receipt:docs:u2",
        projectionStatus: "cancelled",
        ...inlineMeta({
          chunkId: "u0002",
          observedAtMs: 110,
          cancelRequested: true,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0003: {
        status: "ready",
        text: "Texto vigente.",
      },
    });
  });

  it("treats projection receipt and source hash metadata as part of inline render state identity", () => {
    expect(sameDocumentInlineTranslationRenderState(
      {
        status: "ready",
        text: "Texto gobernado.",
        observationRef: "obs:docs:u1:100",
        receiptRef: "receipt:docs:u1:100",
        projectionStatus: "projected",
        ...inlineMeta(),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      {
        status: "ready",
        text: "Texto gobernado.",
        observationRef: "obs:docs:u1:200",
        receiptRef: "receipt:docs:u1:200",
        projectionStatus: "projected",
        ...inlineMeta(),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    )).toBe(false);

    expect(sameDocumentInlineTranslationRenderState(
      {
        status: "ready",
        text: "Texto gobernado.",
        observationRef: "obs:docs:u1",
        receiptRef: "receipt:docs:u1",
        projectionStatus: "projected",
        ...inlineMeta({ sourceHash: "fnv1a32:current" }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      {
        status: "ready",
        text: "Texto gobernado.",
        observationRef: "obs:docs:u1",
        receiptRef: "receipt:docs:u1",
        projectionStatus: "projected",
        ...inlineMeta({ sourceHash: "fnv1a32:previous" }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    )).toBe(false);
  });

  it("keeps the existing inline render state map when lane projection metadata is unchanged", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
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
            target_language: "es",
            translated_text: "Texto gobernado.",
          },
        ],
      },
    });
    const current = simplifyDocumentLiveTranslationInlineStates(laneStates);

    expect(mergeDocumentLiveTranslationInlineStates({
      current,
      laneStates,
    })).toBe(current);
  });

  it("keeps the newer ready projection when an older ready receipt arrives late", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:older",
            observation_ref: "obs:docs:u1:older",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "projected",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 100,
            target_language: "es",
            translated_text: "Texto anterior.",
          },
        ],
      },
    });

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: {
          status: "ready",
          text: "Texto nuevo.",
          observationRef: "obs:docs:u1:newer",
          receiptRef: "receipt:docs:u1:newer",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0001",
            observedAtMs: 200,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Texto nuevo.",
        observationRef: "obs:docs:u1:newer",
        receiptRef: "receipt:docs:u1:newer",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 200,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("uses source event time for ready projection ordering when observed time is missing", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:older",
            observation_ref: "obs:docs:u1:older",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "projected",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            source_event_ms: 100,
            target_language: "es",
            translated_text: "Texto anterior.",
          },
        ],
      },
    });

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: {
          status: "ready",
          text: "Texto nuevo.",
          observationRef: "obs:docs:u1:newer",
          receiptRef: "receipt:docs:u1:newer",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0001",
            sourceEventMs: 200,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Texto nuevo.",
        observationRef: "obs:docs:u1:newer",
        receiptRef: "receipt:docs:u1:newer",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          sourceEventMs: 200,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("refreshes ready projection metadata when a retry has equal timing", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
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
            source_event_ms: 150,
            target_language: "es",
            translated_text: "Texto reintentado.",
          },
        ],
      },
    });

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: {
          status: "ready",
          text: "Texto inicial.",
          observationRef: "obs:docs:u1:initial",
          receiptRef: "receipt:docs:u1:initial",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0001",
            observedAtMs: 200,
            sourceEventMs: 150,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Texto reintentado.",
        observationRef: "obs:docs:u1:retry",
        receiptRef: "receipt:docs:u1:retry",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 200,
          sourceEventMs: 150,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("replaces ready text with a newer cancelled projection state", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
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

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: {
          status: "ready",
          text: "Texto activo.",
          observationRef: "obs:docs:u1:ready",
          receiptRef: "receipt:docs:u1:ready",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0001",
            observedAtMs: 200,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "error",
        error: "translation_projection_cancelled",
        observationRef: "obs:docs:u1:cancelled",
        receiptRef: "receipt:docs:u1:cancelled",
        projectionStatus: "cancelled",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 300,
          cancelRequested: true,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("uses source event time when deciding whether cancellation replaces ready text", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
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
            source_event_ms: 300,
            target_language: "es",
            cancel_requested: true,
          },
        ],
      },
    });

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: {
          status: "ready",
          text: "Texto activo.",
          observationRef: "obs:docs:u1:ready",
          receiptRef: "receipt:docs:u1:ready",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0001",
            sourceEventMs: 200,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "error",
        error: "translation_projection_cancelled",
        observationRef: "obs:docs:u1:cancelled",
        receiptRef: "receipt:docs:u1:cancelled",
        projectionStatus: "cancelled",
        ...inlineMeta({
          chunkId: "u0001",
          sourceEventMs: 300,
          cancelRequested: true,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("keeps newer ready text when older cancelled or failed receipts arrive late", () => {
    const laneStates = buildDocumentLiveTranslationInlineStates({
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001"), unit("u0002")],
      payload: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u1:cancelled:older",
            observation_ref: "obs:docs:u1:cancelled:older",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "cancelled",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0001",
            observed_at_ms: 100,
            target_language: "es",
            cancel_requested: true,
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:docs:u2:failed:older",
            observation_ref: "obs:docs:u2:failed:older",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_chunk",
            projection_status: "failed",
            source_id: "document_markdown:docs/research/nhm2.md",
            chunk_id: "u0002",
            observed_at_ms: 110,
            target_language: "es",
            error: "backend_unconfigured",
          },
        ],
      },
    });

    expect(mergeDocumentLiveTranslationInlineStates({
      current: {
        u0001: {
          status: "ready",
          text: "Texto activo uno.",
          observationRef: "obs:docs:u1:ready:newer",
          receiptRef: "receipt:docs:u1:ready:newer",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0001",
            observedAtMs: 200,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
        u0002: {
          status: "ready",
          text: "Texto activo dos.",
          observationRef: "obs:docs:u2:ready:newer",
          receiptRef: "receipt:docs:u2:ready:newer",
          projectionStatus: "projected",
          ...inlineMeta({
            chunkId: "u0002",
            observedAtMs: 210,
          }),
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      laneStates,
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Texto activo uno.",
        observationRef: "obs:docs:u1:ready:newer",
        receiptRef: "receipt:docs:u1:ready:newer",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 200,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "ready",
        text: "Texto activo dos.",
        observationRef: "obs:docs:u2:ready:newer",
        receiptRef: "receipt:docs:u2:ready:newer",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0002",
          observedAtMs: 210,
        }),
        source: "capability_lane",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });
});
