/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { DocumentTranslationUnit } from "@shared/document-translation";
import { HELIX_ASK_LIVE_EVENT_BUS_EVENT } from "@/lib/helix/liveEventsBus";
import { installDocumentLiveTranslationProjectionEventIngestion } from "@/lib/docs/liveTranslationProjectionEventIngestion";
import {
  clearDocumentLiveTranslationProjectionRegistry,
  readDocumentLiveTranslationProjectionSnapshot,
} from "@/lib/docs/liveTranslationProjectionRegistry";

const unit = (unitId: string): DocumentTranslationUnit => ({
  unit_id: unitId,
  kind: "paragraph",
  source_markdown: `Source ${unitId}`,
  translatable: true,
  protected_spans: [],
});

const eventProjectionMeta = {
  chunkId: "u0001",
  chunkIndex: null,
  dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
  sourceEventId: null,
  sourceEventMs: null,
  observedAtMs: 100,
  freshnessStatus: "fresh",
  projectionTarget: "docs_chunk",
  targetLanguage: "es",
  cancelRequested: false,
};

describe("document live translation projection event ingestion", () => {
  beforeEach(() => {
    clearDocumentLiveTranslationProjectionRegistry();
  });

  it("ingests matching Ask live-event translation projections for a document", () => {
    const target = new EventTarget();
    const unsubscribe = installDocumentLiveTranslationProjectionEventIngestion({
      eventTarget: target,
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
    });

    target.dispatchEvent(new CustomEvent(HELIX_ASK_LIVE_EVENT_BUS_EVENT, {
      detail: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:docs:u1",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
            latestObservedAtMs: 100,
            latestFreshnessStatus: "fresh",
            targetLanguage: "es",
            translatedText: "Texto desde evento.",
            projectionStatus: "projected",
            receiptRef: "receipt:docs:u1",
            observationRef: "obs:docs:u1",
          },
        },
      },
    }));

    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    }).translations.u0001).toEqual({
      status: "ready",
      text: "Texto desde evento.",
      observationRef: "obs:docs:u1",
      receiptRef: "receipt:docs:u1",
      projectionStatus: "projected",
      ...eventProjectionMeta,
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });

    unsubscribe();
    target.dispatchEvent(new CustomEvent(HELIX_ASK_LIVE_EVENT_BUS_EVENT, {
      detail: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:docs:u1:new",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestObservedAtMs: 200,
            targetLanguage: "es",
            translatedText: "Texto despues de cancelar.",
            projectionStatus: "projected",
          },
        },
      },
    }));

    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    }).translations.u0001).toEqual({
      status: "ready",
      text: "Texto desde evento.",
      observationRef: "obs:docs:u1",
      receiptRef: "receipt:docs:u1",
      projectionStatus: "projected",
      ...eventProjectionMeta,
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });
});
