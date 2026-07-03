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
    displayStatus: "empty",
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
    latestObservationLaneSessionId: null,
    latestGoalBindingIdFromProjection: null,
    latestEventId: null,
    latestHasObservation: false,
    latestSelectedBackendProvider: null,
    latestChunkId: null,
    latestChunkIndex: null,
    latestDedupeKey: null,
    latestSource: null,
    latestSourceId: null,
    latestSourceHash: null,
    latestSourceKind: null,
    latestSourceTextHash: null,
    latestSourceTextCharCount: null,
    latestProjectionKey: null,
    latestServerProjectionKey: null,
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
    latestSuppressedObservationLaneSessionId: null,
    latestSuppressedGoalBindingId: null,
    latestSuppressedEventId: null,
    latestSuppressedHasObservation: false,
    latestSuppressedProjectionStatus: null,
    latestSuppressedChunkId: null,
    latestSuppressedChunkIndex: null,
    latestSuppressedDedupeKey: null,
    latestSuppressedSourceEventId: null,
    latestSuppressedSourceEventMs: null,
    latestSuppressedObservedAtMs: null,
    latestSuppressedFreshnessStatus: null,
    latestSuppressedDisplayStatus: null,
    latestSuppressedTerminalAuthorityStatus: "not_terminal_authority",
    latestSuppressedSourceId: null,
    latestSuppressedSourceHash: null,
    latestSuppressedSourceKind: null,
    latestSuppressedSourceTextHash: null,
    latestSuppressedSourceTextCharCount: null,
    latestSuppressedProjectionKey: null,
    latestSuppressedServerProjectionKey: null,
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
    latestLaneSessionEventId: null,
    latestLaneSessionHasObservation: false,
    mailLoopCount: 0,
    pendingMailLoopCount: 0,
    blockedMailLoopCount: 0,
    latestMailLoopStatus: null,
    latestMailLoopId: null,
    latestMailLoopDeliveryStatus: null,
    latestPreviousStagePlayMailId: null,
    latestMailLoopWakeKind: "none",
    latestMailLoopObservationLaneSessionId: null,
    goalBindingCount: 0,
    activeGoalBindingCount: 0,
    blockedGoalBindingCount: 0,
    latestGoalBindingId: null,
    latestGoalId: null,
    latestGoalBindingLaneSessionId: null,
    latestGoalBindingStatus: null,
    latestGoalBindingSessionStatus: null,
    latestGoalBindingSessionHealth: null,
    latestGoalBindingActivationPolicy: null,
    latestGoalBindingAttentionPolicy: null,
    latestGoalBindingStopCondition: null,
    latestGoalBindingReportPolicy: null,
    latestGoalBindingQuietBehavior: null,
    latestGoalBindingReportAction: null,
    latestGoalBindingReportReason: null,
    latestGoalBindingObservationRef: null,
    latestGoalBindingReceiptRef: null,
    latestGoalBindingEventId: null,
    latestGoalBindingHasObservation: false,
    latestGoalBindingTerminalAuthorityStatus: "not_terminal_authority",
    latestGoalBindingSourceId: null,
    latestGoalBindingSourceHash: null,
    latestGoalBindingSourceKind: null,
    latestGoalBindingProjectionTarget: null,
    latestGoalBindingAccountLocale: null,
    latestGoalBindingTargetLanguage: null,
    latestGoalBindingChunkId: null,
    latestGoalBindingChunkIndex: null,
    latestGoalBindingDedupeKey: null,
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
        latestLaneSessionHealth: "degraded",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.sessionActive:{"status":"running / degraded"}');

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "ready",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        laneSessionCount: 1,
        blockedLaneSessionCount: 1,
        latestLaneSessionStatus: "permission_blocked",
        latestLaneSessionHealth: "blocked",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.sessionBlocked:{"status":"permission_blocked / blocked"}');

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

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "idle",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        totalCount: 1,
        readyCount: 1,
        healthStatus: "ready",
        hasRenderableText: true,
        projectedCount: 1,
        latestProjectionStatus: "projected",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.ready:{"status":"projected"}');

    expect(getDocumentTranslationStatusLabel({
      translationStatus: "cached",
      translationError: null,
      liveTranslationProjectionSummary: emptyProjectionSummary({
        totalCount: 2,
        readyCount: 1,
        errorCount: 1,
        healthStatus: "degraded",
        hasRenderableText: true,
        hasProjectionErrors: true,
        projectedCount: 1,
        failedCount: 1,
        latestProjectionStatus: "failed",
      }),
      t: translate,
    })).toBe('docsViewer.translation.status.projectionDegraded:{"status":"failed"}');
  });

  it("routes inline document translation through Stage Play document Markdown mail", () => {
    const panelSource = readFileSync(join(process.cwd(), "client/src/components/DocViewerPanel.tsx"), "utf8");
    const clientSource = readFileSync(join(process.cwd(), "client/src/lib/docs/documentTranslationClient.ts"), "utf8");
    const agiApiSource = readFileSync(join(process.cwd(), "client/src/lib/agi/api.ts"), "utf8");
    const stagePlayRouteSource = readFileSync(join(process.cwd(), "server/routes/helix/stage-play.ts"), "utf8");
    const hawMessagesSource = readFileSync(join(process.cwd(), "client/src/lib/i18n/messages/haw.ts"), "utf8");

    expect(panelSource).toContain("enqueueDocumentMarkdownTranslationMail");
    expect(panelSource).toContain("runDocumentMarkdownTranslationLaneSessionControl");
    expect(panelSource).toContain("emitDocumentTranslationLaneSessionControlEvents");
    expect(panelSource).toContain("documentInlineTranslationLaneSessionId(activeTranslationScopeKey)");
    expect(panelSource).toContain("const laneSessionId = documentInlineTranslationLaneSessionId(scopeKey)");
    expect(panelSource).toContain("laneSessionId,");
    expect(panelSource).toContain("runLaneSessionControl(\"start\")");
    expect(panelSource).toContain("runLaneSessionControl(\"stop\")");
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
    expect(panelSource).toContain("docsViewer.translation.status.projectionDegraded");
    expect(hawMessagesSource).toContain("docsViewer.translation.status.projectionFailed");
    expect(hawMessagesSource).toContain("docsViewer.translation.status.projectionCancelled");
    expect(hawMessagesSource).toContain("docsViewer.translation.status.projectionStale");
    expect(hawMessagesSource).toContain("docsViewer.translation.status.projectionDegraded");
    expect(panelSource).toContain("data-doc-translation-summary-total");
    expect(panelSource).toContain("data-doc-translation-summary-ready");
    expect(panelSource).toContain("data-doc-translation-summary-error");
    expect(panelSource).toContain("data-doc-translation-summary-health");
    expect(panelSource).toContain("data-doc-translation-summary-display-status");
    expect(panelSource).toContain("data-doc-translation-summary-label-visible");
    expect(panelSource).toContain("translationEligible ? (");
    expect(panelSource).toContain("!translationStatusLabel && \"hidden\"");
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
    expect(panelSource).toContain("data-doc-translation-summary-latest-observation-lane-session-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-id-from-projection");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-binding-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-observation-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-mail-loop-observation-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-event-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-has-observation");
    expect(panelSource).toContain("data-doc-translation-summary-latest-selected-backend-provider");
    expect(panelSource).toContain("data-doc-translation-summary-latest-chunk-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-chunk-index");
    expect(panelSource).toContain("data-doc-translation-summary-latest-dedupe-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-hash");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-kind");
    expect(panelSource).toContain("data-doc-translation-summary-latest-source-text-hash");
    expect(panelSource).toContain("data-doc-translation-summary-latest-projection-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-server-projection-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-projection-target");
    expect(panelSource).toContain("data-doc-translation-summary-latest-account-locale");
    expect(panelSource).toContain("data-doc-translation-summary-latest-target-language");
    expect(panelSource).toContain("data-doc-translation-summary-latest-projection-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-freshness-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-terminal-authority-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-cancel-requested");
    expect(panelSource).toContain("data-doc-translation-summary-latest-error");
    expect(panelSource).toContain("data-doc-translation-summary-suppressed-receipts");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-observation-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-receipt-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-observation-lane-session-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-goal-binding-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-binding-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-observation-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-mail-loop-observation-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-goal-binding-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-event-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-has-observation");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-projection-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-chunk-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-chunk-index");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-dedupe-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-event-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-event-ms");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-observed-at-ms");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-freshness-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-display-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-terminal-authority-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-hash");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-kind");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-source-text-hash");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-projection-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-server-projection-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-account-locale");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-projection-target");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-target-language");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-cancel-requested");
    expect(panelSource).toContain("data-doc-translation-summary-latest-suppressed-reason");
    expect(panelSource).toContain("data-doc-translation-summary-lane-sessions");
    expect(panelSource).toContain("data-doc-translation-summary-active-lane-sessions");
    expect(panelSource).toContain("data-doc-translation-summary-blocked-lane-sessions");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-health");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-lifecycle-action");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-permission-profile");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-updated-at-ms");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-event-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-lane-session-has-observation");
    expect(panelSource).toContain("data-doc-translation-summary-mail-loops");
    expect(panelSource).toContain("data-doc-translation-summary-pending-mail-loops");
    expect(panelSource).toContain("data-doc-translation-summary-blocked-mail-loops");
    expect(panelSource).toContain("data-doc-translation-summary-latest-mail-loop-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-mail-loop-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-mail-loop-observation-lane-session-id");
    expect(panelSource).toContain("data-doc-translation-summary-goal-bindings");
    expect(panelSource).toContain("data-doc-translation-summary-active-goal-bindings");
    expect(panelSource).toContain("data-doc-translation-summary-blocked-goal-bindings");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-lane-session-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-session-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-session-health");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-activation-policy");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-attention-policy");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-stop-condition");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-report-policy");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-quiet-behavior");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-report-action");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-report-reason");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-observation-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-receipt-ref");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-event-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-has-observation");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-terminal-authority-status");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-source-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-source-hash");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-source-kind");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-projection-target");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-account-locale");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-target-language");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-chunk-id");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-chunk-index");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-dedupe-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-source-binding-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-observation-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-mail-loop-observation-key");
    expect(panelSource).toContain("data-doc-translation-summary-latest-goal-binding-key-from-binding");
    expect(panelSource).toContain("data-doc-translation-summary-terminal-eligible=\"false\"");
    expect(panelSource).toContain("data-doc-translation-summary-assistant-answer=\"false\"");
    expect(panelSource).toContain("data-doc-translation-summary-raw-content-included=\"false\"");
    expect(panelSource).toContain("data-doc-translation-control=\"inline-account-language\"");
    expect(panelSource).toContain("data-doc-translation-control-enabled={String(inlineTranslationEnabled)}");
    expect(panelSource).toContain("data-doc-translation-control-target-language={translationTargetLanguage}");
    expect(panelSource).toContain("data-doc-translation-control-account-locale={translationAccountLocale}");
    expect(panelSource).toContain("data-doc-translation-control-projection-target={HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK}");
    expect(panelSource).toContain("data-doc-translation-control-terminal-eligible=\"false\"");
    expect(panelSource).toContain("data-doc-translation-control-assistant-answer=\"false\"");
    expect(panelSource).toContain("data-doc-translation-control-raw-content-included=\"false\"");
    expect(clientSource).toContain("runCapabilityLaneSessionControl({");
    expect(clientSource).toContain("capability_lane_session_call:");
    expect(agiApiSource).toContain("/api/agi/capability-lanes/session");
    expect(agiApiSource).toContain("capability_lane_session_call");
    expect(agiApiSource).toContain("terminal_eligible?: false");
    expect(agiApiSource).toContain("assistant_answer?: false");
    expect(agiApiSource).toContain("raw_content_included?: false");
    const inlineRendererSource = readFileSync(
      join(process.cwd(), "client/src/lib/docs/liveTranslationInlineRenderer.ts"),
      "utf8",
    );
    expect(panelSource).toContain("renderDocumentMarkdownWithInlineTranslations({");
    expect(inlineRendererSource).toContain("buildDocumentInlineTranslationDataAttributes(state)");
    expect(inlineRendererSource).toContain('`${name}="${escapeHtml(value)}"`');
    expect(panelSource).toContain("type DocumentInlineTranslationRenderState");
    expect(panelSource).toContain("type InlineTranslationState = DocumentInlineTranslationRenderState");
    expect(panelSource).toContain("documentMarkdownTranslationEntryToInlineRenderState(entry)");
    expect(panelSource).toContain("documentMarkdownSourceId(currentEntry.relativePath)");
    expect(panelSource).toContain("DOC_TRANSLATION_MAX_UNITS_PER_CHUNK = 3");
    expect(panelSource).toContain("DOC_TRANSLATION_MAX_CHARS_PER_CHUNK = 2200");
    expect(panelSource).toContain("documentTranslationChunkInFlightRef");
    expect(panelSource).toContain("const chunkId = `doc-inline:${rawMarkdownSourceHash}:${targetIds.join(\",\")}`");
    expect(panelSource).toContain("buildPendingDocumentInlineTranslationState({");
    expect(panelSource).toContain("projectionStatus: \"missing\"");
    expect(panelSource).toContain("observationLaneSessionId: null");
    expect(panelSource).toContain("goalBindingId: null");
    expect(panelSource).toContain("latestEventId: null");
    expect(panelSource).toContain("hasObservation: false");
    expect(panelSource).toContain("freshnessStatus: \"pending\"");
    expect(panelSource).toContain("terminalAuthorityStatus: \"not_terminal_authority\"");
    expect(panelSource).toContain("terminalEligible: false");
    expect(panelSource).toContain("assistantAnswer: false");
    expect(panelSource).toContain("rawContentIncluded: false");
    expect(panelSource).toContain("targetLanguage: interfaceLanguage.code");
    expect(panelSource).toContain("accountLocale: interfaceLanguage.code");
    expect(panelSource).toContain("projectionTarget: HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK");
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
