import { describe, expect, it } from "vitest";
import {
  buildHelixLiveTranslationInlineUnitStates,
  buildHelixLiveTranslationUiProjections,
  selectHelixLiveTranslationUiProjection,
  summarizeHelixLiveTranslationUiProjectionTraffic,
} from "@/lib/helix/live-translation-projection";

const inlineMeta = (overrides: Record<string, unknown> = {}) => ({
  chunkId: null,
  chunkIndex: null,
  dedupeKey: null,
  sourceEventId: null,
  sourceEventMs: null,
  observedAtMs: null,
  freshnessStatus: "unknown",
  projectionTarget: "docs_chunk",
  targetLanguage: "es",
  cancelRequested: false,
  ...overrides,
});

describe("Helix live translation UI projection", () => {
  it("projects translated chunks from lane projection receipts without terminal authority", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_projection_receipts: [
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:1",
          observation_ref: "obs:docs:1",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "projected",
          source_id: "docs:nhm2",
          chunk_id: "chunk-1",
          chunk_index: 1,
          dedupe_key: "docs:nhm2:chunk-1:es",
          source_event_id: "docs:nhm2:event-1",
          source_event_ms: 1000,
          observed_at_ms: 1200,
          freshness_status: "fresh",
          target_language: "es",
          translated_text: "hola",
          stale: false,
          cancel_requested: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
    });

    expect(projections).toEqual([
      {
        key: "docs_chunk|docs:nhm2|chunk-1|es|docs:nhm2:chunk-1:es|docs:nhm2:event-1",
        status: "projected",
        projectionTarget: "docs_chunk",
        sourceId: "docs:nhm2",
        chunkId: "chunk-1",
        chunkIndex: 1,
        dedupeKey: "docs:nhm2:chunk-1:es",
        sourceEventId: "docs:nhm2:event-1",
        targetLanguage: "es",
        translatedText: "hola",
        observationRef: "obs:docs:1",
        receiptRef: "receipt:docs:1",
        observedAtMs: 1200,
        sourceEventMs: 1000,
        freshnessStatus: "fresh",
        stale: false,
        cancelRequested: false,
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    ]);
  });

  it("surfaces stale and cancelled projection states as non-answer UI state", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      debug: {
        capability_lane_projection_receipts: [
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:hover:stale",
            observation_ref: "obs:hover:stale",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_hover",
            projection_status: "stale",
            source_id: "docs:hover",
            chunk_id: "hover-1",
            chunk_index: 0,
            dedupe_key: "hover-1:fr",
            source_event_ms: 1,
            observed_at_ms: 60_000,
            freshness_status: "stale",
            target_language: "fr",
            translated_text: "bonjour",
            stale: true,
            cancel_requested: false,
          },
          {
            schema: "helix.live_translation.projection_receipt.v1",
            receipt_ref: "receipt:hover:cancelled",
            observation_ref: "obs:hover:cancelled",
            lane_id: "live_translation",
            capability: "live_translation.translate_text",
            projection_target: "docs_hover",
            projection_status: "cancelled",
            source_id: "docs:hover",
            chunk_id: "hover-2",
            chunk_index: 1,
            dedupe_key: "hover-2:fr",
            source_event_ms: 2,
            observed_at_ms: 60_001,
            freshness_status: "fresh",
            target_language: "fr",
            translated_text: null,
            stale: false,
            cancel_requested: true,
          },
        ],
      },
    });

    expect(projections.map((entry) => ({
      status: entry.status,
      translatedText: entry.translatedText,
      stale: entry.stale,
      sourceEventId: entry.sourceEventId,
      cancelRequested: entry.cancelRequested,
      terminalEligible: entry.terminalEligible,
      assistantAnswer: entry.assistantAnswer,
    }))).toEqual([
      {
        status: "stale",
        translatedText: "bonjour",
        stale: true,
        sourceEventId: null,
        cancelRequested: false,
        terminalEligible: false,
        assistantAnswer: false,
      },
      {
        status: "cancelled",
        translatedText: null,
        stale: false,
        sourceEventId: null,
        cancelRequested: true,
        terminalEligible: false,
        assistantAnswer: false,
      },
    ]);
  });

  it("falls back to call-result observations and keeps the latest projection per chunk", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_call_results: [
        {
          capability: "live_translation.translate_text",
          observation: {
            capability: "live_translation.translate_text",
            observation_ref: "obs:selection:old",
            projection_target: "docs_selection",
            source_id: "docs:selection",
            chunk_id: "selection-1",
            chunk_index: 0,
            dedupe_key: "selection-1:es",
            source_event_ms: 10,
            observed_at_ms: 20,
            freshness_status: "fresh",
            target_language: "es",
            translated_text: "viejo",
          },
        },
      ],
      debug: {
        capability_lane_observation_packets: [
          {
            state_delta: {
              live_translation_projection_receipt: {
                schema: "helix.live_translation.projection_receipt.v1",
                receipt_ref: "receipt:selection:new",
                observation_ref: "obs:selection:new",
                lane_id: "live_translation",
                capability: "live_translation.translate_text",
                projection_target: "docs_selection",
                projection_status: "projected",
                source_id: "docs:selection",
                chunk_id: "selection-1",
                chunk_index: 0,
                dedupe_key: "selection-1:es",
                source_event_ms: 10,
                observed_at_ms: 30,
                freshness_status: "fresh",
                target_language: "es",
                translated_text: "nuevo",
                stale: false,
                cancel_requested: false,
              },
            },
          },
        ],
      },
    });

    expect(projections).toHaveLength(1);
    expect(projections[0]).toMatchObject({
      translatedText: "nuevo",
      observationRef: "obs:selection:new",
      receiptRef: "receipt:selection:new",
      observedAtMs: 30,
      terminalEligible: false,
      assistantAnswer: false,
    });
  });

  it("summarizes chunk traffic per source without creating answer authority", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_projection_receipts: [
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:1",
          observation_ref: "obs:docs:1",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "projected",
          source_id: "docs:nhm2",
          chunk_id: "chunk-1",
          chunk_index: 0,
          observed_at_ms: 100,
          source_event_ms: 80,
          freshness_status: "fresh",
          target_language: "es",
          translated_text: "uno",
        },
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:2",
          observation_ref: "obs:docs:2",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "stale",
          source_id: "docs:nhm2",
          chunk_id: "chunk-2",
          chunk_index: 1,
          observed_at_ms: 200,
          source_event_ms: 180,
          freshness_status: "stale",
          target_language: "es",
          translated_text: "dos",
          stale: true,
        },
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:3",
          observation_ref: "obs:docs:3",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "cancelled",
          source_id: "docs:nhm2",
          chunk_id: "chunk-3",
          chunk_index: 2,
          observed_at_ms: 300,
          source_event_ms: 280,
          freshness_status: "fresh",
          target_language: "es",
          cancel_requested: true,
        },
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:4",
          observation_ref: "obs:docs:4",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "failed",
          source_id: "docs:nhm2",
          chunk_id: "chunk-4",
          chunk_index: 3,
          observed_at_ms: 400,
          source_event_ms: 380,
          freshness_status: "failed",
          target_language: "es",
        },
      ],
    });

    expect(summarizeHelixLiveTranslationUiProjectionTraffic(projections)).toEqual([
      {
        sourceId: "docs:nhm2",
        projectionTarget: "docs_chunk",
        targetLanguage: "es",
        chunkCount: 4,
        projectedCount: 1,
        staleCount: 1,
        cancelledCount: 1,
        failedCount: 1,
        latestChunkId: "chunk-4",
        latestChunkIndex: 3,
        latestObservedAtMs: 400,
        latestSourceEventMs: 380,
        latestFreshnessStatus: "failed",
        latestObservationRef: "obs:docs:4",
        latestReceiptRef: "receipt:docs:4",
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    ]);
  });

  it("selects the current account-language projection without granting answer authority", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_projection_receipts: [
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:old",
          observation_ref: "obs:docs:old",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "projected",
          source_id: "docs:nhm2",
          chunk_id: "chunk-1",
          chunk_index: 1,
          dedupe_key: "docs:nhm2:chunk-1:es",
          observed_at_ms: 100,
          target_language: "es",
          translated_text: "texto anterior",
        },
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:docs:new",
          observation_ref: "obs:docs:new",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "projected",
          source_id: "docs:nhm2",
          chunk_id: "chunk-1",
          chunk_index: 1,
          dedupe_key: "docs:nhm2:chunk-1:es",
          observed_at_ms: 200,
          target_language: "es",
          translated_text: "texto nuevo",
        },
      ],
    });

    expect(selectHelixLiveTranslationUiProjection({
      projections,
      sourceId: "docs:nhm2",
      projectionTarget: "docs_chunk",
      targetLanguage: "ES",
      chunkId: "chunk-1",
    })).toMatchObject({
      status: "projected",
      reason: "translation_projection_selected",
      displayText: "texto nuevo",
      observationRef: "obs:docs:new",
      receiptRef: "receipt:docs:new",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("keeps cancelled, stale, and missing UI projection states separate from displayed text", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_projection_receipts: [
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:hover:cancelled",
          observation_ref: "obs:hover:cancelled",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_hover",
          projection_status: "cancelled",
          source_id: "docs:hover",
          chunk_id: "hover-1",
          dedupe_key: "hover-1:fr",
          observed_at_ms: 10,
          target_language: "fr",
          cancel_requested: true,
        },
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:hover:stale",
          observation_ref: "obs:hover:stale",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_hover",
          projection_status: "stale",
          source_id: "docs:hover",
          chunk_id: "hover-2",
          dedupe_key: "hover-2:fr",
          observed_at_ms: 20,
          target_language: "fr",
          translated_text: "ancien",
          stale: true,
        },
      ],
    });

    expect(selectHelixLiveTranslationUiProjection({
      projections,
      sourceId: "docs:hover",
      projectionTarget: "docs_hover",
      targetLanguage: "fr",
      chunkId: "hover-1",
    })).toMatchObject({
      status: "cancelled",
      reason: "translation_projection_cancelled",
      displayText: null,
      terminalEligible: false,
      assistantAnswer: false,
    });

    expect(selectHelixLiveTranslationUiProjection({
      projections,
      sourceId: "docs:hover",
      projectionTarget: "docs_hover",
      targetLanguage: "fr",
      chunkId: "hover-2",
    })).toMatchObject({
      status: "stale",
      reason: "translation_projection_stale",
      displayText: null,
    });

    expect(selectHelixLiveTranslationUiProjection({
      projections,
      sourceId: "docs:hover",
      projectionTarget: "docs_hover",
      targetLanguage: "fr",
      chunkId: "hover-2",
      allowStaleDisplayText: true,
    })).toMatchObject({
      status: "stale",
      reason: "translation_projection_selected",
      displayText: "ancien",
    });

    expect(selectHelixLiveTranslationUiProjection({
      projections,
      sourceId: "docs:missing",
      projectionTarget: "docs_hover",
      targetLanguage: "fr",
    })).toMatchObject({
      status: "missing",
      reason: "translation_projection_missing",
      displayText: null,
      projection: null,
      terminalEligible: false,
      assistantAnswer: false,
    });
  });

  it("maps governed lane projections into document inline unit state without answer authority", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_projection_receipts: [
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:doc:u1",
          observation_ref: "obs:doc:u1",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "projected",
          source_id: "document_markdown:docs/research/nhm2.md",
          chunk_id: "u0001",
          chunk_index: 0,
          dedupe_key: "document_markdown:docs/research/nhm2.md:u0001:es",
          observed_at_ms: 100,
          target_language: "es",
          translated_text: "Primer bloque.",
        },
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:doc:u2",
          observation_ref: "obs:doc:u2",
          lane_id: "live_translation",
          capability: "live_translation.translate_text",
          projection_target: "docs_chunk",
          projection_status: "projected",
          source_id: "document_markdown:docs/research/nhm2.md",
          chunk_id: "batch-1",
          chunk_index: 1,
          dedupe_key: "document_markdown:docs/research/nhm2.md:u0002:es",
          observed_at_ms: 110,
          target_language: "es",
          translated_text: "Segundo bloque.",
        },
      ],
    });

    expect(buildHelixLiveTranslationInlineUnitStates({
      projections,
      sourceId: "document_markdown:docs/research/nhm2.md",
      projectionTarget: "docs_chunk",
      targetLanguage: "es",
      units: [
        { unit_id: "u0001", translatable: true },
        { unit_id: "u0002", translatable: true },
        { unit_id: "u0003", translatable: false },
      ],
    })).toEqual({
      u0001: {
        status: "ready",
        text: "Primer bloque.",
        observationRef: "obs:doc:u1",
        receiptRef: "receipt:doc:u1",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "u0001",
          chunkIndex: 0,
          dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
          observedAtMs: 100,
        }),
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "ready",
        text: "Segundo bloque.",
        observationRef: "obs:doc:u2",
        receiptRef: "receipt:doc:u2",
        projectionStatus: "projected",
        ...inlineMeta({
          chunkId: "batch-1",
          chunkIndex: 1,
          dedupeKey: "document_markdown:docs/research/nhm2.md:u0002:es",
          observedAtMs: 110,
        }),
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });

  it("maps stale and cancelled lane projections into non-terminal inline unit errors", () => {
    const projections = buildHelixLiveTranslationUiProjections({
      capability_lane_projection_receipts: [
        {
          schema: "helix.live_translation.projection_receipt.v1",
          receipt_ref: "receipt:doc:stale",
          observation_ref: "obs:doc:stale",
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
          receipt_ref: "receipt:doc:cancelled",
          observation_ref: "obs:doc:cancelled",
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
      ],
    });

    expect(buildHelixLiveTranslationInlineUnitStates({
      projections,
      sourceId: "document_markdown:docs/research/nhm2.md",
      projectionTarget: "docs_chunk",
      targetLanguage: "fr",
      units: [
        { unit_id: "u0001", translatable: true },
        { unit_id: "u0002", translatable: true },
      ],
    })).toEqual({
      u0001: {
        status: "error",
        error: "translation_projection_stale",
        observationRef: "obs:doc:stale",
        receiptRef: "receipt:doc:stale",
        projectionStatus: "stale",
        ...inlineMeta({
          chunkId: "u0001",
          observedAtMs: 100,
          targetLanguage: "fr",
        }),
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
      u0002: {
        status: "error",
        error: "translation_projection_cancelled",
        observationRef: "obs:doc:cancelled",
        receiptRef: "receipt:doc:cancelled",
        projectionStatus: "cancelled",
        ...inlineMeta({
          chunkId: "u0002",
          observedAtMs: 110,
          targetLanguage: "fr",
          cancelRequested: true,
        }),
        terminalEligible: false,
        assistantAnswer: false,
        rawContentIncluded: false,
      },
    });
  });
});
