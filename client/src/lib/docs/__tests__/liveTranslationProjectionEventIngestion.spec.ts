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
  laneSessionId: null,
  selectedBackendProvider: null,
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

  it("passes stale display policy through live-event projection ingestion", () => {
    const target = new EventTarget();
    const unsubscribe = installDocumentLiveTranslationProjectionEventIngestion({
      eventTarget: target,
      docPath: "docs/research/nhm2.md",
      locale: "es",
      units: [unit("u0001")],
      allowStaleDisplayText: true,
    });

    target.dispatchEvent(new CustomEvent(HELIX_ASK_LIVE_EVENT_BUS_EVENT, {
      detail: {
        contextId: "helix-ask:desktop",
        entry: {
          id: "receipt:docs:u1:stale",
          text: "UI translation projection.",
          meta: {
            source_event_type: "ui_translation_projection",
            lane: "live_translation",
            sourceId: "document_markdown:docs/research/nhm2.md",
            latestProjectionTarget: "docs_chunk",
            latestChunkId: "u0001",
            latestObservedAtMs: 100,
            latestFreshnessStatus: "stale",
            targetLanguage: "es",
            translatedText: "Texto obsoleto visible.",
            projectionStatus: "stale",
            receiptRef: "receipt:docs:u1:stale",
            observationRef: "obs:docs:u1:stale",
          },
        },
      },
    }));

    expect(readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    }).translations.u0001).toMatchObject({
      status: "ready",
      text: "Texto obsoleto visible.",
      observationRef: "obs:docs:u1:stale",
      receiptRef: "receipt:docs:u1:stale",
      projectionStatus: "stale",
      freshnessStatus: "stale",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });

    unsubscribe();
  });

  it("ingests matching Ask live-event lane sessions without projecting text", () => {
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
          id: "lane-session-docs",
          text: "Lane session is running.",
          meta: {
            source_event_type: "lane_session",
            lane: "live_translation",
            laneSessionId: "lane-session-docs",
            sessionStatus: "running",
            sessionHealth: "healthy",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceKind: "docs",
            latestProjectionTarget: "docs_chunk",
            accountLocale: "es",
            targetLanguage: "es",
            selectedBackendProvider: "live_translation.local_runtime",
            latestChunkId: "u0001",
            latestObservedAtMs: 100,
            observationRef: "obs:lane-session-docs",
            receiptRef: "receipt:lane-session-docs",
            updatedAtMs: 125,
          },
        },
      },
    }));

    const snapshot = readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    });
    expect(snapshot.translations).toEqual({});
    expect(snapshot.laneSessions["lane-session-docs"]).toMatchObject({
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      sessionStatus: "running",
      sessionHealth: "healthy",
      sourceId: "document_markdown:docs/research/nhm2.md",
      projectionTarget: "docs_chunk",
      accountLocale: "es",
      targetLanguage: "es",
      lastObservationRef: "obs:lane-session-docs",
      lastReceiptRef: "receipt:lane-session-docs",
      updatedAtMs: 125,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    unsubscribe();
  });

  it("ingests matching Ask live-event lane mail-loop rows without projecting text", () => {
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
          id: "lane-mail-loop-docs",
          text: "Lane mail loop is pending.",
          meta: {
            source_event_type: "lane_mail_loop",
            lane: "live_translation",
            laneSessionId: "lane-session-docs",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceKind: "docs",
            latestProjectionTarget: "docs_chunk",
            accountLocale: "es",
            latestChunkId: "u0001",
            latestObservedAtMs: 100,
            latestFreshnessStatus: "fresh",
            targetLanguage: "es",
            stagePlayMailId: "stage-play-mail-translation",
            stagePlayWakeExpected: true,
            mailboxThreadId: "thread-docs-translation",
            mailStatus: "unread",
            selectedBackendProvider: "live_translation.local_runtime",
            observationRef: "obs:lane-mail-loop-docs",
            receiptRef: "receipt:lane-mail-loop-docs",
          },
        },
      },
    }));

    const snapshot = readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    });
    expect(snapshot.translations).toEqual({});
    expect(snapshot.mailLoops["stage-play-mail-translation"]).toMatchObject({
      mailLoopId: "stage-play-mail-translation",
      laneSessionId: "lane-session-docs",
      laneId: "live_translation",
      stagePlayMailId: "stage-play-mail-translation",
      stagePlayWakeExpected: true,
      mailboxThreadId: "thread-docs-translation",
      mailStatus: "unread",
      selectedBackendProvider: "live_translation.local_runtime",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es",
      targetLanguage: "es",
      latestChunkId: "u0001",
      latestObservedAtMs: 100,
      latestFreshnessStatus: "fresh",
      observationRef: "obs:lane-mail-loop-docs",
      receiptRef: "receipt:lane-mail-loop-docs",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    unsubscribe();
  });

  it("ingests matching Ask live-event goal binding rows without projecting text", () => {
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
          id: "goal-binding-translate-docs",
          text: "Goal-bound lane session is active.",
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
            targetLanguage: "es",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceKind: "docs",
            latestProjectionTarget: "docs_chunk",
            accountLocale: "es",
            latestChunkId: "u0001",
            latestObservedAtMs: 100,
            observationRef: "obs:goal-binding-docs",
            receiptRef: "receipt:goal-binding-docs",
          },
        },
      },
    }));

    const snapshot = readDocumentLiveTranslationProjectionSnapshot({
      docPath: "docs/research/nhm2.md",
      locale: "es",
    });
    expect(snapshot.translations).toEqual({});
    expect(snapshot.goalBindings["goal-binding-translate-docs"]).toMatchObject({
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
      targetLanguage: "es",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceKind: "docs",
      projectionTarget: "docs_chunk",
      accountLocale: "es",
      latestChunkId: "u0001",
      latestObservedAtMs: 100,
      observationRef: "obs:goal-binding-docs",
      receiptRef: "receipt:goal-binding-docs",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    unsubscribe();
  });
});
