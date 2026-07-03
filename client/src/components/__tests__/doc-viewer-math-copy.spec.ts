/**
 * @vitest-environment jsdom
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dispatchScientificCalculatorMathPicked,
  type ScientificCalculatorMathPickedDetail
} from "@/lib/scientific-calculator/events";
import type { DocumentLiveTranslationProjectionSnapshotSummary } from "@/lib/docs/liveTranslationProjectionRegistry";

let handleDocMathPick: typeof import("@/components/DocViewerPanel").handleDocMathPick;
let applyDocNarratorSourceIds: typeof import("@/components/DocViewerPanel").applyDocNarratorSourceIds;
let getDocumentTranslationStatusLabel: typeof import("@/components/DocViewerPanel").getDocumentTranslationStatusLabel;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ applyDocNarratorSourceIds, getDocumentTranslationStatusLabel, handleDocMathPick } = await import("@/components/DocViewerPanel"));
});

describe("doc viewer math interaction", () => {
  const translate = (id: string, values?: Record<string, unknown>) =>
    values ? `${id}:${JSON.stringify(values)}` : id;

  const emptyProjectionSummary = (
    overrides: Partial<DocumentLiveTranslationProjectionSnapshotSummary> = {},
  ): DocumentLiveTranslationProjectionSnapshotSummary => ({
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
    latestCancelRequested: false,
    latestError: null,
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
    ...overrides,
  });

  it("dispatches scientific calculator ingest event and copies latex", () => {
    const clipboardWrite = vi.fn(async () => undefined);
    const events: ScientificCalculatorMathPickedDetail[] = [];
    const dispatch = vi.fn((detail: { latex: string; sourcePath: string | null; anchor: string | null }) => {
      events.push(
        dispatchScientificCalculatorMathPicked({
          latex: detail.latex,
          sourcePath: detail.sourcePath,
          anchor: detail.anchor,
        }),
      );
    });

    handleDocMathPick({
      latex: "x^2-4=0",
      currentPath: "/docs/research/sample.md",
      anchor: "eq-1",
      clipboardWrite,
      dispatchEvent: dispatch,
    });

    expect(clipboardWrite).toHaveBeenCalledWith("x^2-4=0");
    expect(dispatch).toHaveBeenCalledOnce();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      latex: "x^2-4=0",
      sourcePath: "/docs/research/sample.md",
      anchor: "eq-1",
    });
  });

  it("adds stable narrator source ids to rendered document text blocks", () => {
    document.body.innerHTML = `
      <div>
        <article>
          <h1>Readable heading</h1>
          <p>First readable sentence. Second readable sentence.</p>
          <div class="doc-math-clickable doc-math-clickable-display" role="button" title="Copy LaTeX">
            <span>Equation display</span>
          </div>
        </article>
      </div>
    `;

    const count = applyDocNarratorSourceIds(document.body, "docs/example/readme.md");
    const paragraph = document.querySelector("p");
    const heading = document.querySelector("h1");
    const equation = document.querySelector(".doc-math-clickable-display");

    expect(count).toBe(2);
    expect(heading?.getAttribute("data-narrator-source-id")).toBe("docs-viewer:docs-example-readme-md:h1:0");
    expect(paragraph?.getAttribute("data-narrator-source-id")).toBe("docs-viewer:docs-example-readme-md:p:1");
    expect(equation?.getAttribute("data-narrator-source-id")).toBeNull();
  });

  it("shows lane session and projection health as non-authoritative translation status", () => {
    expect(getDocumentTranslationStatusLabel({
      translationStatus: "idle",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        laneSessionCount: 1,
        activeLaneSessionCount: 1,
        latestLaneSessionStatus: "running",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.sessionActive:{"status":"running"}');

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "ready",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        laneSessionCount: 1,
        blockedLaneSessionCount: 1,
        latestLaneSessionStatus: "permission_blocked",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.sessionBlocked:{"status":"permission_blocked"}');

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "ready",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        goalBindingCount: 1,
        blockedGoalBindingCount: 1,
        latestGoalBindingStatus: "goal_paused",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.goalBindingBlocked:{"status":"goal_paused"}');

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "idle",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        totalCount: 1,
        errorCount: 1,
        failedCount: 1,
        hasProjectionErrors: true,
        latestProjectionStatus: "failed",
        latestError: "backend_unconfigured",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.projectionFailed:{"reason":"backend_unconfigured"}');

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "idle",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        totalCount: 1,
        errorCount: 1,
        staleCount: 1,
        latestProjectionStatus: "stale",
        latestFreshnessStatus: "stale_source",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.projectionStale:{"status":"stale_source"}');
  });

  it("routes inline document translation through Stage Play document Markdown mail", () => {
    const panelSource = readFileSync(join(process.cwd(), "client/src/components/DocViewerPanel.tsx"), "utf8");
    const clientSource = readFileSync(join(process.cwd(), "client/src/lib/docs/documentTranslationClient.ts"), "utf8");
    const stagePlayRouteSource = readFileSync(join(process.cwd(), "server/routes/helix/stage-play.ts"), "utf8");

    expect(panelSource).toContain("enqueueDocumentMarkdownTranslationMail");
    expect(panelSource).toContain("readDocumentMarkdownMicroDeckRuns");
    expect(panelSource).toContain("extractDocumentMarkdownTranslationsFromRuns");
    expect(panelSource).toContain("subscribeDocumentLiveTranslationProjectionRegistry");
    expect(panelSource).toContain("readDocumentLiveTranslationProjectionSnapshot");
    expect(panelSource).toContain("summarizeDocumentLiveTranslationProjectionSnapshot");
    expect(panelSource).toContain("installDocumentLiveTranslationProjectionEventIngestion");
    expect(panelSource).toContain("sourceHash: rawMarkdownSourceHash");
    expect(panelSource).toContain("allowStaleDisplayText: inlineTranslationEnabled");
    expect(panelSource).toContain("liveTranslationProjectionSnapshot.translations");
    expect(panelSource).toContain("liveTranslationProjectionSummary");
    expect(panelSource).toContain("docsViewer.translation.status.sessionActive");
    expect(panelSource).toContain("docsViewer.translation.status.sessionBlocked");
    expect(panelSource).toContain("docsViewer.translation.status.mailLoopBlocked");
    expect(panelSource).toContain("docsViewer.translation.status.mailLoopPending");
    expect(panelSource).toContain("docsViewer.translation.status.goalBindingActive");
    expect(panelSource).toContain("docsViewer.translation.status.goalBindingBlocked");
    expect(panelSource).toContain("docsViewer.translation.status.projectionFailed");
    expect(panelSource).toContain("docsViewer.translation.status.projectionCancelled");
    expect(panelSource).toContain("docsViewer.translation.status.projectionStale");
    expect(panelSource).toContain("data-doc-translation-summary-total");
    expect(panelSource).toContain("data-doc-translation-summary-ready");
    expect(panelSource).toContain("data-doc-translation-summary-error");
    expect(panelSource).toContain("data-doc-translation-summary-health");
    expect(panelSource).toContain("data-doc-translation-summary-renderable");
    expect(panelSource).toContain("data-doc-translation-summary-has-errors");
    expect(panelSource).toContain("data-doc-translation-summary-projected");
    expect(panelSource).toContain("data-doc-translation-summary-stale");
    expect(panelSource).toContain("data-doc-translation-summary-cancelled");
    expect(panelSource).toContain("data-doc-translation-summary-failed");
    expect(panelSource).toContain("data-doc-translation-summary-latest-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-observed-at-ms");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-event-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-event-ms");
    expect(panelSource).toContain("data-doc-translation-summary-latest-observation-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-receipt-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-selected-backend-provider");
    expect(panelSource).toContain("data-doc-translation-summary-latest-chunk-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-chunk-index");
    expect(panelSource).toContain("data-doc-translation-summary-latest-dedupe-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-hash");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-kind");
    expect(panelSource).toContain("data-doc-translation-summary-latest-projection-target");
    expect(panelSource).toContain("data-doc-translation-summary-latest-account-locale");
    expect(panelSource).toContain("data-doc-translation-summary-latest-target-language");
    expect(panelSource).toContain("data-doc-translation-summary-latest-projection-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-freshness-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-cancel-requested");
    expect(panelSource).toContain("data-doc-translation-summary-latest-error");
    expect(panelSource).toContain("data-doc-translation-summary-suppressed-receipts");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-observation-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-receipt-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-projection-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-observed-at-ms");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-freshness-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-reason");
    expect(panelSource).toContain("data-doc-translation-summary-lane-sessions");
    expect(panelSource).toContain("data-doc-translation-summary-active-lane-sessions");
    expect(panelSource).toContain("data-doc-translation-summary-blocked-lane-sessions");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-health");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-updated-at-ms");
    expect(panelSource).toContain("data-doc-translation-summary-mail-loops");
    expect(panelSource).toContain("data-doc-translation-summary-pending-mail-loops");
    expect(panelSource).toContain("data-doc-translation-summary-blocked-mail-loops");
    expect(panelSource).toContain("data-doc-translation-summary-latest-mail-loop-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-mail-loop-id");
    expect(panelSource).toContain("data-doc-translation-summary-goal-bindings");
    expect(panelSource).toContain("data-doc-translation-summary-active-goal-bindings");
    expect(panelSource).toContain("data-doc-translation-summary-blocked-goal-bindings");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-report-action");
    expect(panelSource).toContain("data-doc-translation-summary-terminal-eligible=\"false\"");
    expect(panelSource).toContain("data-doc-translation-summary-assistant-answer=\"false\"");
    expect(panelSource).toContain("data-doc-translation-summary-raw-content-included=\"false\"");
    expect(panelSource).toContain("buildDocumentInlineTranslationDataAttributes(state)");
    expect(panelSource).toContain('`${name}="${escapeHtml(value)}"`');
    expect(panelSource).toContain("type DocumentInlineTranslationRenderState");
    expect(panelSource).toContain("type InlineTranslationState = DocumentInlineTranslationRenderState");
    expect(panelSource).toContain("documentMarkdownTranslationEntryToInlineRenderState(entry)");
    expect(panelSource).toContain("documentMarkdownSourceId(currentEntry.relativePath)");
    expect(panelSource).toContain("DOC_TRANSLATION_MAX_UNITS_PER_CHUNK = 3");
    expect(panelSource).toContain("DOC_TRANSLATION_MAX_CHARS_PER_CHUNK = 2200");
    expect(panelSource).toContain("documentTranslationChunkInFlightRef");
    expect(panelSource).toContain("chunkId: `doc-inline:${rawMarkdownSourceHash}:${targetIds.join(\",\")}`");
    expect(panelSource).toContain("targetLanguage: interfaceLanguage.code");
    expect(panelSource).toContain("accountLocale: interfaceLanguage.code");
    expect(panelSource).not.toContain("requestDocumentTranslationUnits");
    expect(clientSource).toContain("/api/helix/stage-play/live-source-mail/document-markdown");
    expect(clientSource).toContain("/api/helix/stage-play/live-source-mail?");
    expect(clientSource).toContain('view: "full"');
    expect(clientSource).toContain("chunkId: params.chunkId");
    expect(clientSource).toContain("/api/helix/stage-play/micro-reasoner-prompt-preset/apply");
    expect(clientSource).toContain("stage_play_micro_reasoner_prompt_preset:document-translate-haw-inline:v1");
    expect(stagePlayRouteSource).toContain("DOCUMENT_MARKDOWN_TRANSLATION_MAX_UNITS_PER_MAIL = 3");
    expect(stagePlayRouteSource).toContain("DOCUMENT_MARKDOWN_TRANSLATION_MAX_CHARS_PER_MAIL = 2200");
    expect(stagePlayRouteSource).toContain("deferredUnits");
    expect(stagePlayRouteSource).toContain("acceptedChars");
  });
});
