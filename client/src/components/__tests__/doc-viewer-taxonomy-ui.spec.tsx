/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { DocManifestEntry } from "@/lib/docs/docManifest";
import { summarizeDocumentLiveTranslationProjectionSnapshot } from "@/lib/docs/liveTranslationProjectionRegistry";

let DocViewerPanelModule: typeof import("@/components/DocViewerPanel");

const messages: Record<string, string> = {
  "docsViewer.search.placeholder": "Search docs & digests",
  "docsViewer.search.count": "{filteredCount} of {total} documents",
  "docsViewer.empty.noMatches": "No matching documents.",
  "docsViewer.taxonomy.filterLabel": "Document category filters",
  "docsViewer.taxonomy.all": "All",
  "docsViewer.taxonomy.research": "Research",
  "docsViewer.taxonomy.development": "Development",
  "docsViewer.taxonomy.syntheticResearchShort": "Synthetic Research",
  "docsViewer.taxonomy.legacyShort": "Legacy",
  "docsViewer.taxonomy.uncategorized": "Uncategorized",
  "docsViewer.taxonomy.canonicalResearch": "Canonical research",
  "docsViewer.taxonomy.currentDevelopment": "Current development",
  "docsViewer.taxonomy.syntheticResearch": "Synthetic research",
  "docsViewer.taxonomy.legacyDevelopment": "Legacy development",
  "docsViewer.taxonomy.calculatorReady": "Calculator-ready",
  "docsViewer.taxonomy.sidecarsAttached": "Sidecars attached",
  "docsViewer.translation.status.ready": "Translation ready: {status}",
  "docsViewer.translation.status.projectionFailed": "Translation failed: {reason}",
  "docsViewer.translation.status.projectionCancelled": "Translation cancelled: {status}",
  "docsViewer.translation.status.projectionStale": "Translation stale: {status}",
  "docsViewer.translation.hideInline": "Hide translation",
  "docsViewer.translation.generateInline": "Translate",
  "docsViewer.translation.generating": "Translating",
};

const t = ((id: string, values?: Record<string, string | number>) => {
  let template = messages[id] ?? id;
  Object.entries(values ?? {}).forEach(([key, value]) => {
    template = template.replace(`{${key}}`, String(value));
  });
  return template;
}) as never;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  DocViewerPanelModule = await import("@/components/DocViewerPanel");
});

function makeEntry(overrides: Partial<DocManifestEntry>): DocManifestEntry {
  const relativePath = overrides.relativePath ?? "docs/example.md";
  return {
    id: overrides.id ?? relativePath,
    route: overrides.route ?? `/${relativePath}`,
    relativePath,
    folderChain: overrides.folderChain ?? ["docs"],
    folderLabel: overrides.folderLabel ?? "docs",
    subjectLabel: overrides.subjectLabel ?? "General Reference",
    catalogDate: overrides.catalogDate ?? null,
    catalogDateSource: overrides.catalogDateSource ?? null,
    fileMtimeIso: overrides.fileMtimeIso ?? null,
    fileMtimeMs: overrides.fileMtimeMs ?? null,
    sizeBytes: overrides.sizeBytes ?? null,
    docClass: overrides.docClass ?? null,
    bundleKind: overrides.bundleKind ?? null,
    canonical: overrides.canonical ?? false,
    sidecars: overrides.sidecars ?? [],
    toolHints: overrides.toolHints ?? null,
    title: overrides.title ?? "Example",
    searchText: overrides.searchText ?? `${overrides.title ?? "Example"} ${relativePath}`.toLowerCase(),
    loader: overrides.loader ?? (async () => ""),
  };
}

describe("DocViewerPanel taxonomy UI", () => {
  afterEach(() => {
    cleanup();
  });

  const whitepaper = makeEntry({
    id: "nhm2-whitepaper",
    route: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    relativePath: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    subjectLabel: "Warp Mechanics",
    title: "Nhm2 Current Status Whitepaper 2026 05 02",
    docClass: "canonical-research",
    bundleKind: "equation-action-whitepaper",
    canonical: true,
    sidecars: [
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.equation-actions.json",
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.equation-actions.source.json",
    ],
    toolHints: {
      calculatorReady: true,
      contentAuthority: "bounded_docs_observation_required",
    },
  });
  const developmentNote = makeEntry({
    id: "dev-note",
    route: "/docs/development/README.md",
    relativePath: "docs/development/README.md",
    title: "Development Readme",
    docClass: "current-development",
  });

  it("renders taxonomy filters and Calculator-ready whitepaper badges", () => {
    const onDocClassFilterChange = vi.fn();
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();
    const { __testDocViewerTaxonomy, DirectoryRail } = DocViewerPanelModule;
    const taxonomyCounts = __testDocViewerTaxonomy.buildDocTaxonomyCounts([whitepaper, developmentNote]);

    render(
      <DirectoryRail
        entries={[{ label: "Warp Mechanics", entries: [whitepaper, developmentNote] }]}
        total={2}
        filteredCount={2}
        currentRoute={undefined}
        query=""
        docClassFilter="all"
        taxonomyCounts={taxonomyCounts}
        onQueryChange={onQueryChange}
        onDocClassFilterChange={onDocClassFilterChange}
        onSelect={onSelect}
        variant="full"
        t={t}
      />,
    );

    expect(screen.getByLabelText("Document category filters")).toBeTruthy();
    expect(screen.getByRole("button", { name: /All\s+2/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Research\s+1/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Development\s+1/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Synthetic Research\s+0/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Legacy\s+0/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Uncategorized\s+0/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Research\s+1/i }));
    expect(onDocClassFilterChange).toHaveBeenCalledWith("canonical-research");

    const whitepaperButton = screen.getByRole("button", {
      name: /Nhm2 Current Status Whitepaper 2026 05 02/i,
    });
    expect(within(whitepaperButton).getByText("Canonical research")).toBeTruthy();
    expect(within(whitepaperButton).getByText("Calculator-ready")).toBeTruthy();
    expect(within(whitepaperButton).getByText("Sidecars attached")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Search docs & digests"), {
      target: { value: "NHM2 current status whitepaper" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("NHM2 current status whitepaper");

    fireEvent.click(whitepaperButton);
    expect(onSelect).toHaveBeenCalledWith("/docs/research/nhm2-current-status-whitepaper-2026-05-02.md");
  });

  it("matches entries by selected taxonomy filter", () => {
    const { __testDocViewerTaxonomy } = DocViewerPanelModule;

    expect(__testDocViewerTaxonomy.docMatchesTaxonomyFilter(whitepaper, "canonical-research")).toBe(true);
    expect(__testDocViewerTaxonomy.docMatchesTaxonomyFilter(whitepaper, "current-development")).toBe(false);
    expect(__testDocViewerTaxonomy.docMatchesTaxonomyFilter(developmentNote, "current-development")).toBe(true);
    expect(__testDocViewerTaxonomy.docMatchesTaxonomyFilter(makeEntry({ docClass: null }), "uncategorized")).toBe(true);
  });

  it("builds pending inline translation state with source payload identity", () => {
    const { __testDocViewerTaxonomy } = DocViewerPanelModule;

    expect(__testDocViewerTaxonomy.buildPendingDocumentInlineTranslationState({
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceHash: "fnv1a32:whole-doc",
      sourceTextHash: "fnv1a32:visible-chunk",
      sourceTextCharCount: 42,
      chunkId: "doc-inline:fnv1a32:whole-doc:u0001",
      chunkIndex: 1,
      accountLocale: "es-US",
      targetLanguage: "es",
    })).toMatchObject({
      status: "loading",
      projectionStatus: "missing",
      sourceId: "document_markdown:docs/research/nhm2.md",
      sourceIdentityKey:
        "document_markdown:docs/research/nhm2.md::fnv1a32:whole-doc::fnv1a32:visible-chunk::42::docs::docs_chunk::es-US::es",
      sourceHash: "fnv1a32:whole-doc",
      sourceKind: "docs",
      sourceTextHash: "fnv1a32:visible-chunk",
      sourceTextCharCount: 42,
      chunkId: "doc-inline:fnv1a32:whole-doc:u0001",
      chunkIndex: 1,
      accountLocale: "es-US",
      targetLanguage: "es",
      answerAuthority: false,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
  });

  it("does not requeue visible translation units whose DOM anchor already has governed projection state", () => {
    const { __testDocViewerTaxonomy } = DocViewerPanelModule;
    const container = document.createElement("div");
    container.innerHTML = [
      '<div data-doc-translation-anchor="u-ready" data-doc-translation-source-hash="fnv1a32:current" data-doc-translation-render-status="ready" data-doc-translation-display-status="ready" data-doc-translation-projection-status="projected"></div>',
      '<div data-doc-translation-anchor="u-active" data-doc-translation-render-status="loading" data-doc-translation-display-status="active" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-stale" data-doc-translation-render-status="error" data-doc-translation-display-status="stale" data-doc-translation-projection-status="stale"></div>',
      '<div data-doc-translation-anchor="u-old-source" data-doc-translation-source-hash="fnv1a32:old" data-doc-translation-render-status="ready" data-doc-translation-display-status="ready" data-doc-translation-projection-status="projected"></div>',
      '<div data-doc-translation-anchor="u-old-identity" data-doc-translation-source-hash="fnv1a32:current" data-doc-translation-source-identity-key="document_markdown:docs/research/nhm2.md::fnv1a32:current::source-text-old::18::docs::docs_chunk::es-US::es" data-doc-translation-render-status="ready" data-doc-translation-display-status="ready" data-doc-translation-projection-status="projected"></div>',
      '<div data-doc-translation-anchor="u-memory-current" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-memory-old" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-memory-old-identity" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-inflight-current" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-inflight-old" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-inflight-old-identity" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-empty" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
    ].join("");
    const rect = { top: 10, bottom: 20, left: 0, right: 10, width: 10, height: 10, x: 0, y: 10, toJSON: () => ({}) };
    container.getBoundingClientRect = () => ({ ...rect, top: 0, bottom: 100, height: 100 });
    container.querySelectorAll<HTMLElement>("[data-doc-translation-anchor]").forEach((element, index) => {
      element.getBoundingClientRect = () => ({ ...rect, top: 10 + index * 10, bottom: 20 + index * 10 });
    });

    expect(__testDocViewerTaxonomy.collectVisibleTranslationUnitIds({
      container,
      units: [
        "u-ready",
        "u-active",
        "u-stale",
        "u-old-source",
        "u-old-identity",
        "u-memory-current",
        "u-memory-old",
        "u-memory-old-identity",
        "u-inflight-current",
        "u-inflight-old",
        "u-inflight-old-identity",
        "u-empty",
      ].map((unitId) => ({
        unit_id: unitId,
        kind: "paragraph",
        source_markdown: `Source ${unitId}`,
        translatable: true,
        protected_spans: [],
      })),
      translations: {
        "u-memory-current": {
          status: "ready",
          text: "Texto actual.",
          sourceHash: "fnv1a32:current",
          sourceIdentityKey:
            "document_markdown:docs/research/nhm2.md::fnv1a32:current::source-text-current::42::docs::docs_chunk::es-US::es",
        } as never,
        "u-memory-old": {
          status: "ready",
          text: "Texto anterior.",
          sourceHash: "fnv1a32:old",
        } as never,
        "u-memory-old-identity": {
          status: "ready",
          text: "Texto identidad anterior.",
          sourceHash: "fnv1a32:current",
          sourceIdentityKey:
            "document_markdown:docs/research/nhm2.md::fnv1a32:current::source-text-old::18::docs::docs_chunk::es-US::es",
        } as never,
        "u-inflight-current": {
          status: "loading",
          text: "",
          sourceHash: "fnv1a32:current",
          sourceIdentityKey:
            "document_markdown:docs/research/nhm2.md::fnv1a32:current::source-text-current::42::docs::docs_chunk::es-US::es",
        } as never,
        "u-inflight-old": {
          status: "loading",
          text: "",
          sourceHash: "fnv1a32:old",
        } as never,
        "u-inflight-old-identity": {
          status: "loading",
          text: "",
          sourceHash: "fnv1a32:current",
          sourceIdentityKey:
            "document_markdown:docs/research/nhm2.md::fnv1a32:current::source-text-old::18::docs::docs_chunk::es-US::es",
        } as never,
      },
      inFlightIds: new Set(["u-inflight-current", "u-inflight-old", "u-inflight-old-identity"]),
      sourceHash: "fnv1a32:current",
      sourceIdentityKey:
        "document_markdown:docs/research/nhm2.md::fnv1a32:current::source-text-current::42::docs::docs_chunk::es-US::es",
      maxUnits: 10,
      maxChars: 1000,
    })).toEqual([
      "u-old-source",
      "u-old-identity",
      "u-memory-old",
      "u-memory-old-identity",
      "u-inflight-old",
      "u-inflight-old-identity",
      "u-empty",
    ]);
  });

  it("shows taxonomy badges in the open document header", () => {
    const { PanelHeader } = DocViewerPanelModule;

    render(
      <PanelHeader
        mode="doc"
        entry={whitepaper}
        anchor={undefined}
        isAutoReading={false}
        autoReadError={null}
        proceduralStatus={null}
        readProgress={null}
        onStopAutoRead={vi.fn()}
        onShowDirectory={vi.fn()}
        canRejoinLiveRead={false}
        onRejoinLiveRead={vi.fn()}
        translationEligible={false}
        translationAccountLocale="en"
        translationTargetLanguage="es"
        translationSourceId={null}
        translationSourceHash={null}
        translationSourceTextHash={null}
        translationSourceTextCharCount={null}
        translationLaneSessionId={null}
        inlineTranslationEnabled={false}
        translationStatus="idle"
        translationError={null}
        liveTranslationProjectionSummary={summarizeDocumentLiveTranslationProjectionSnapshot({
          version: 0,
          translations: {},
          laneSessions: {},
          mailLoops: {},
          goalBindings: {},
        })}
        onToggleInlineTranslation={vi.fn()}
        onToggleInlineTranslationSessionPause={vi.fn()}
        t={t}
      />,
    );

    const headerBadges = screen.getByTestId("doc-header-taxonomy-badges");
    expect(headerBadges).toHaveTextContent("Canonical research");
    expect(headerBadges).toHaveTextContent("Calculator-ready");
    expect(headerBadges).toHaveTextContent("Sidecars attached");
  });

  it("exposes governed translation source payload identity in the open document header", () => {
    const { PanelHeader } = DocViewerPanelModule;
    const liveTranslationProjectionSummary = {
      ...summarizeDocumentLiveTranslationProjectionSnapshot({
        version: 0,
        translations: {},
        laneSessions: {},
        mailLoops: {},
        goalBindings: {},
      }),
      version: 12,
      totalCount: 1,
      readyCount: 1,
      healthStatus: "ready" as const,
      displayStatus: "ready" as const,
      displayStatusReason: "ready_projection_available",
      hasRenderableText: true,
      projectedCount: 1,
      latestStatus: "ready",
      latestProjectionStatus: "projected",
      latestObservationRef: "obs:translation-header",
      latestReceiptRef: "receipt:translation-header",
      latestVisibleObservationRef: "obs:translation-header",
      latestVisibleReceiptRef: "receipt:translation-header",
      latestEvidenceObservationRef: "obs:translation-suppressed",
      latestEvidenceReceiptRef: "receipt:translation-suppressed",
      latestLaneSessionId: "lane-session-docs",
      latestLaneSessionStatus: "running" as const,
      latestLaneSessionDebugPhase: "running:record_observation:observation_recorded",
      latestLaneSessionObservationStatus: "observation_recorded",
      latestSourceBindingKey: "docs:nhm2::fnv1a32:doc-latest::docs_chunk::es-US::es",
      latestSourceIdentityKey: "docs:nhm2::fnv1a32:doc-source::fnv1a32:source-payload::2048::docs::docs_chunk::es-US::es",
      latestLaneSessionSourceBindingKey: "docs:nhm2::fnv1a32:lane-session::docs_chunk::es-US::es",
      latestLaneSessionSourceIdentityKey:
        "docs:nhm2::fnv1a32:lane-session::fnv1a32:lane-session-payload::2048::docs::docs_chunk::es-US::es",
      latestLaneSessionSelectedBackendProvider: "live_translation.local_runtime",
      latestObservationKey: "docs:nhm2::fnv1a32:doc-source::docs_chunk::es::u0001::obs:translation-header",
      latestMailLoopObservationKey:
        "docs:nhm2::fnv1a32:doc-source::docs_chunk::es::u0001::receipt:translation-header",
      latestGoalBindingKey: "goal:account-language::goal-binding-docs::lane-session-docs::live_translation",
      latestSourceId: "document_markdown:docs/research/nhm2.md",
      latestSourceHash: "fnv1a32:doc-source",
      latestSourceKind: "docs",
      latestSourceTextHash: "fnv1a32:source-payload",
      latestSourceTextCharCount: 2048,
      latestGoalBindingSourceId: "document_markdown:docs/research/nhm2.md",
      latestGoalBindingSourceHash: "fnv1a32:goal-doc-source",
      latestGoalBindingSourceKind: "docs",
      latestGoalBindingSourceTextHash: "fnv1a32:goal-source-payload",
      latestGoalBindingSourceTextCharCount: 2048,
      latestGoalBindingSourceBindingKey: "docs:nhm2::fnv1a32:goal-latest::docs_chunk::es-US::es",
      latestGoalBindingSourceBindingKeyFromEvent: "docs:nhm2::fnv1a32:goal-event-latest::docs_chunk::es-US::es",
      latestGoalBindingSourceIdentityKey:
        "docs:nhm2::fnv1a32:goal-doc-source::fnv1a32:goal-source-payload::2048::docs::docs_chunk::es-US::es",
      latestMailLoopSourceBindingKey: "docs:nhm2::fnv1a32:mail-latest::docs_chunk::es-US::es",
      latestMailLoopSourceIdentityKey:
        "docs:nhm2::fnv1a32:mail-packet::fnv1a32:mail-payload::2048::docs::docs_chunk::es-US::es",
      latestMailLoopLaneSessionSourceBindingKey:
        "docs:nhm2::fnv1a32:mail-session::docs_chunk::es-US::es",
      latestMailLoopLaneSessionSourceIdentityKey:
        "docs:nhm2::fnv1a32:mail-session::fnv1a32:mail-session-payload::2048::docs::docs_chunk::es-US::es",
      latestMailLoopSourceId: "document_markdown:docs/research/nhm2.md",
      latestMailLoopSourceHash: "fnv1a32:mail-doc-source",
      latestMailLoopSourceKind: "docs",
      latestMailLoopSourceTextHash: "fnv1a32:mail-source-payload",
      latestMailLoopSourceTextCharCount: 2048,
      latestMailLoopProjectionTarget: "docs_chunk",
      latestMailLoopAccountLocale: "es-US",
      latestMailLoopTargetLanguage: "es",
      latestMailLoopChunkId: "u0001",
      latestMailLoopChunkIndex: 0,
      latestMailLoopDedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
      latestMailLoopSourceEventId: "docs:event-mail",
      latestMailLoopSourceEventMs: 410,
      latestMailLoopObservedAtMs: 430,
      latestMailLoopFreshnessStatus: "fresh",
      latestMailLoopSelectedBackendProvider: "live_translation.local_runtime",
      latestGoalBindingLaneSessionSourceBindingKey:
        "docs:nhm2::fnv1a32:goal-session::docs_chunk::es-US::es",
      latestGoalBindingLaneSessionSourceIdentityKey:
        "docs:nhm2::fnv1a32:goal-session::fnv1a32:goal-session-payload::2048::docs::docs_chunk::es-US::es",
      latestGoalBindingSelectedBackendProvider: "live_translation.local_runtime",
      latestGoalBindingSourceIdentityKeyFromBinding:
        "docs:nhm2::fnv1a32:goal-doc-source::fnv1a32:goal-source-payload::2048::docs::docs_chunk::es-US::es",
      latestGoalBindingObservationKey:
        "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es::u0001::obs:goal-binding-docs",
      latestGoalBindingMailLoopObservationKey:
        "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es::u0001::receipt:goal-binding-docs",
      latestGoalBindingKeyFromBinding:
        "goal:account-language::goal-binding-docs::lane-session-docs::live_translation",
      suppressedReceiptCount: 1,
      latestSuppressedObservationRef: "obs:translation-suppressed",
      latestSuppressedReceiptRef: "receipt:translation-suppressed",
      latestSuppressedSourceBindingKey: "docs:nhm2-old::fnv1a32:old-doc-source::docs_chunk::es-US::es",
      latestSuppressedSourceIdentityKey:
        "docs:nhm2-old::fnv1a32:old-doc-source::fnv1a32:old-source-payload::1024::docs::docs_chunk::es-US::es",
      latestSuppressedObservationKey:
        "docs:nhm2-old::fnv1a32:old-doc-source::docs_chunk::es::u0001::obs:translation-suppressed",
      latestSuppressedSelectedBackendProvider: "live_translation.local_runtime",
      latestSuppressedProjectionStatus: "stale",
      latestSuppressedChunkId: "u0001",
      latestSuppressedSourceEventId: "docs:event-old",
      latestSuppressedSourceEventMs: 300,
      latestSuppressedObservedAtMs: 310,
      latestSuppressedFreshnessStatus: "stale",
      latestSuppressedDisplayStatus: "stale",
      latestSuppressedTerminalAuthorityStatus: "not_terminal_authority",
      latestSuppressedSourceId: "document_markdown:docs/research/old-nhm2.md",
      latestSuppressedSourceHash: "fnv1a32:old-doc-source",
      latestSuppressedSourceKind: "docs",
      latestSuppressedSourceTextHash: "fnv1a32:old-source-payload",
      latestSuppressedSourceTextCharCount: 1024,
      latestSuppressedProjectionTarget: "docs_chunk",
      latestSuppressedTargetLanguage: "es",
      latestSuppressedReason: "stale_projection_did_not_replace_fresh_text",
      latestGoalBindingQuietBehaviorApplied: true,
      latestGoalBindingWakeExpected: false,
      latestGoalBindingSurfaceBadgeExpected: true,
      latestGoalBindingTerminalReportRequested: false,
      latestGoalBindingTerminalReportAuthorized: false,
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    };

    const { container } = render(
      <PanelHeader
        mode="doc"
        entry={whitepaper}
        anchor={undefined}
        isAutoReading={false}
        autoReadError={null}
        proceduralStatus={null}
        readProgress={null}
        onStopAutoRead={vi.fn()}
        onShowDirectory={vi.fn()}
        canRejoinLiveRead={false}
        onRejoinLiveRead={vi.fn()}
        translationEligible={true}
        translationAccountLocale="es-US"
        translationTargetLanguage="es"
        translationSourceId="document_markdown:docs/research/nhm2.md"
        translationSourceHash="fnv1a32:doc-source"
        translationSourceTextHash="fnv1a32:source-payload"
        translationSourceTextCharCount={2048}
        translationLaneSessionId="lane-session-docs"
        inlineTranslationEnabled={true}
        translationStatus="cached"
        translationError={null}
        liveTranslationProjectionSummary={liveTranslationProjectionSummary}
        onToggleInlineTranslation={vi.fn()}
        onToggleInlineTranslationSessionPause={vi.fn()}
        t={t}
      />,
    );

    const summary = container.querySelector("[data-doc-translation-summary-version]");
    expect(summary?.getAttribute("data-doc-translation-summary-account-locale")).toBe("es-US");
    expect(summary?.getAttribute("data-doc-translation-summary-target-language")).toBe("es");
    expect(summary?.getAttribute("data-doc-translation-summary-source-id")).toBe(
      "document_markdown:docs/research/nhm2.md",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-source-hash")).toBe("fnv1a32:doc-source");
    expect(summary?.getAttribute("data-doc-translation-summary-source-text-hash")).toBe("fnv1a32:source-payload");
    expect(summary?.getAttribute("data-doc-translation-summary-source-text-char-count")).toBe("2048");
    expect(summary?.getAttribute("data-doc-translation-summary-lane-session-id")).toBe("lane-session-docs");
    expect(summary?.getAttribute("data-doc-translation-summary-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:doc-latest::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::fnv1a32:source-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-display-status-reason")).toBe(
      "ready_projection_available",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-text-hash")).toBe(
      "fnv1a32:source-payload",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-text-char-count")).toBe("2048");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:doc-latest::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::fnv1a32:source-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-lane-session-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:lane-session::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-lane-session-selected-backend-provider")).toBe(
      "live_translation.local_runtime",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-lane-session-debug-phase")).toBe(
      "running:record_observation:observation_recorded",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-lane-session-observation-status")).toBe(
      "observation_recorded",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-lane-session-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:lane-session::fnv1a32:lane-session-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-observation-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::docs_chunk::es::u0001::obs:translation-header",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-observation-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::docs_chunk::es::u0001::receipt:translation-header",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-visible-observation-ref")).toBe(
      "obs:translation-header",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-visible-receipt-ref")).toBe(
      "receipt:translation-header",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-evidence-observation-ref")).toBe(
      "obs:translation-suppressed",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-evidence-receipt-ref")).toBe(
      "receipt:translation-suppressed",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-key")).toBe(
      "goal:account-language::goal-binding-docs::lane-session-docs::live_translation",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-source-text-hash")).toBe(
      "fnv1a32:goal-source-payload",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-source-text-char-count")).toBe(
      "2048",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:goal-latest::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:goal-doc-source::fnv1a32:goal-source-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:mail-packet::fnv1a32:mail-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:mail-latest::docs_chunk::es-US::es",
    );
    expect(
      summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-lane-session-source-binding-key"),
    ).toBe(
      "docs:nhm2::fnv1a32:mail-session::docs_chunk::es-US::es",
    );
    expect(
      summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-lane-session-source-identity-key"),
    ).toBe(
      "docs:nhm2::fnv1a32:mail-session::fnv1a32:mail-session-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-id")).toBe(
      "document_markdown:docs/research/nhm2.md",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-hash")).toBe(
      "fnv1a32:mail-doc-source",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-kind")).toBe("docs");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-text-hash")).toBe(
      "fnv1a32:mail-source-payload",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-text-char-count")).toBe(
      "2048",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-projection-target")).toBe(
      "docs_chunk",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-account-locale")).toBe(
      "es-US",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-target-language")).toBe("es");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-chunk-id")).toBe("u0001");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-chunk-index")).toBe("0");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-dedupe-key")).toBe(
      "document_markdown:docs/research/nhm2.md:u0001:es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-event-id")).toBe(
      "docs:event-mail",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-source-event-ms")).toBe("410");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-observed-at-ms")).toBe("430");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-freshness-status")).toBe("fresh");
    expect(
      summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-lane-session-source-binding-key"),
    ).toBe(
      "docs:nhm2::fnv1a32:goal-session::docs_chunk::es-US::es",
    );
    expect(
      summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-lane-session-source-identity-key"),
    ).toBe(
      "docs:nhm2::fnv1a32:goal-session::fnv1a32:goal-session-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-source-binding-key-from-event")).toBe(
      "docs:nhm2::fnv1a32:goal-event-latest::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-source-identity-key-from-binding")).toBe(
      "docs:nhm2::fnv1a32:goal-doc-source::fnv1a32:goal-source-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-observation-key")).toBe(
      "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es::u0001::obs:goal-binding-docs",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-mail-loop-observation-key")).toBe(
      "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es::u0001::receipt:goal-binding-docs",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-key-from-binding")).toBe(
      "goal:account-language::goal-binding-docs::lane-session-docs::live_translation",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-suppressed-receipts")).toBe("1");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-observation-ref")).toBe(
      "obs:translation-suppressed",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-receipt-ref")).toBe(
      "receipt:translation-suppressed",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-binding-key")).toBe(
      "docs:nhm2-old::fnv1a32:old-doc-source::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-identity-key")).toBe(
      "docs:nhm2-old::fnv1a32:old-doc-source::fnv1a32:old-source-payload::1024::docs::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-observation-key")).toBe(
      "docs:nhm2-old::fnv1a32:old-doc-source::docs_chunk::es::u0001::obs:translation-suppressed",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-selected-backend-provider")).toBe(
      "live_translation.local_runtime",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-event-id")).toBe(
      "docs:event-old",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-event-ms")).toBe("300");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-observed-at-ms")).toBe("310");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-freshness-status")).toBe("stale");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-display-status")).toBe("stale");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-terminal-authority-status")).toBe(
      "not_terminal_authority",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-id")).toBe(
      "document_markdown:docs/research/old-nhm2.md",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-hash")).toBe(
      "fnv1a32:old-doc-source",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-kind")).toBe("docs");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-text-hash")).toBe(
      "fnv1a32:old-source-payload",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-source-text-char-count")).toBe(
      "1024",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-projection-target")).toBe(
      "docs_chunk",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-target-language")).toBe("es");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-suppressed-reason")).toBe(
      "stale_projection_did_not_replace_fresh_text",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-quiet-behavior-applied")).toBe(
      "true",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-wake-expected")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-mailbox-wake-expected")).toBe(
      "",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-decision-wake-expected")).toBe(
      "",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-surface-badge-expected")).toBe(
      "true",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-terminal-report-requested")).toBe(
      "false",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-terminal-report-authorized")).toBe(
      "false",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-selected-backend-provider")).toBe(
      "live_translation.local_runtime",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-mailbox-wake-expected")).toBe(
      "false",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-decision-wake-expected")).toBe(
      "false",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-goal-binding-selected-backend-provider")).toBe(
      "live_translation.local_runtime",
    );
    const inlineControl = container.querySelector("[data-doc-translation-control='inline-account-language']");
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:doc-latest::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::fnv1a32:source-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-latest-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::fnv1a32:source-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-account-locale")).toBe("es-US");
    expect(inlineControl?.getAttribute("data-doc-translation-control-target-language")).toBe("es");
    expect(inlineControl?.getAttribute("data-doc-translation-control-language-routing-policy")).toBe(
      "account_locale_base_target",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-target-language-source")).toBe(
      "account_locale_base",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-reentry-required")).toBe("true");
    const sessionControl = container.querySelector("[data-doc-translation-session-control='pause-resume']");
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:lane-session::docs_chunk::es-US::es",
    );
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:lane-session::fnv1a32:lane-session-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-latest-source-identity-key")).toBe(
      "docs:nhm2::fnv1a32:lane-session::fnv1a32:lane-session-payload::2048::docs::docs_chunk::es-US::es",
    );
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-reentry-required")).toBe("true");
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-language-routing-policy")).toBe(
      "account_locale_base_target",
    );
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-target-language-source")).toBe(
      "account_locale_base",
    );
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-terminal-eligible")).toBe("false");
    expect(sessionControl?.getAttribute("data-doc-translation-session-control-assistant-answer")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-language-routing-policy")).toBe(
      "account_locale_base_target",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-target-language-source")).toBe(
      "account_locale_base",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-reentry-required")).toBe("true");
    expect(summary?.getAttribute("data-doc-translation-summary-authority-policy")).toBe(
      "projection_only_not_answer_authority",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-governed-projection")).toBe("true");
    expect(summary?.getAttribute("data-doc-translation-summary-terminal-eligible")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-assistant-answer")).toBe("false");
    expect(summary).toHaveTextContent("Translation ready: projected");
  });

  it("keeps failed governed translation projection receipts inspectable in the open document header", () => {
    const { PanelHeader } = DocViewerPanelModule;
    const liveTranslationProjectionSummary = summarizeDocumentLiveTranslationProjectionSnapshot({
      version: 14,
      translations: {
        u0001: {
          status: "error",
          error: "lane_backend_timeout",
          observationRef: "obs:docs:u1:failed:newer",
          receiptRef: "receipt:docs:u1:failed:newer",
          laneSessionId: "lane-session-docs",
          selectedBackendProvider: "live_translation.local_runtime",
          projectionStatus: "failed",
          chunkId: "u0001",
          chunkIndex: 0,
          dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
          sourceEventId: "docs:event-failed-newer",
          sourceEventMs: 520,
          observedAtMs: 550,
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "fnv1a32:doc-source",
          sourceKind: "docs",
          sourceTextHash: "fnv1a32:source-payload",
          sourceTextCharCount: 2048,
          accountLocale: "es-US",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          cancelRequested: false,
          contextRole: "tool_evidence",
          source: "capability_lane",
          answerAuthority: false,
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        } as never,
      },
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });

    const { container } = render(
      <PanelHeader
        mode="doc"
        entry={whitepaper}
        anchor={undefined}
        isAutoReading={false}
        autoReadError={null}
        proceduralStatus={null}
        readProgress={null}
        onStopAutoRead={vi.fn()}
        onShowDirectory={vi.fn()}
        canRejoinLiveRead={false}
        onRejoinLiveRead={vi.fn()}
        translationEligible={true}
        translationAccountLocale="es-US"
        translationTargetLanguage="es"
        translationSourceId="document_markdown:docs/research/nhm2.md"
        translationSourceHash="fnv1a32:doc-source"
        translationSourceTextHash="fnv1a32:source-payload"
        translationSourceTextCharCount={2048}
        translationLaneSessionId="lane-session-docs"
        inlineTranslationEnabled={true}
        translationStatus="idle"
        translationError={null}
        liveTranslationProjectionSummary={liveTranslationProjectionSummary}
        onToggleInlineTranslation={vi.fn()}
        onToggleInlineTranslationSessionPause={vi.fn()}
        t={t}
      />,
    );

    const summary = container.querySelector("[data-doc-translation-summary-version]");
    expect(summary?.getAttribute("data-doc-translation-summary-version")).toBe("14");
    expect(summary?.getAttribute("data-doc-translation-summary-display-status")).toBe("failed");
    expect(summary?.getAttribute("data-doc-translation-summary-has-errors")).toBe("true");
    expect(summary?.getAttribute("data-doc-translation-summary-renderable")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-projection-status")).toBe("failed");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-error")).toBe("lane_backend_timeout");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-observation-ref")).toBe(
      "obs:docs:u1:failed:newer",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-receipt-ref")).toBe(
      "receipt:docs:u1:failed:newer",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-event-id")).toBe(
      "docs:event-failed-newer",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-event-ms")).toBe("520");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-observed-at-ms")).toBe("550");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-terminal-authority-status")).toBe(
      "not_terminal_authority",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-reentry-required")).toBe("true");
    expect(summary?.getAttribute("data-doc-translation-summary-authority-policy")).toBe(
      "projection_only_not_answer_authority",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-governed-projection")).toBe("true");
    expect(summary?.getAttribute("data-doc-translation-summary-terminal-eligible")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-assistant-answer")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-raw-content-included")).toBe("false");
    expect(summary).toHaveTextContent("Translation failed: lane_backend_timeout");
  });

  it.each([
    {
      displayStatus: "stale",
      error: "translation_projection_stale",
      freshnessStatus: "stale",
      observationRef: "obs:docs:u1:stale:newer",
      projectionStatus: "stale",
      receiptRef: "receipt:docs:u1:stale:newer",
      sourceEventId: "docs:event-stale-newer",
      statusLabel: "Translation stale: stale",
    },
    {
      displayStatus: "cancelled",
      error: "translation_projection_cancelled",
      freshnessStatus: "fresh",
      observationRef: "obs:docs:u1:cancelled:newer",
      projectionStatus: "cancelled",
      receiptRef: "receipt:docs:u1:cancelled:newer",
      sourceEventId: "docs:event-cancelled-newer",
      statusLabel: "Translation cancelled: cancelled",
    },
  ] as const)(
    "keeps $displayStatus governed translation projection receipts inspectable in the open document header",
    ({
      displayStatus,
      error,
      freshnessStatus,
      observationRef,
      projectionStatus,
      receiptRef,
      sourceEventId,
      statusLabel,
    }) => {
      const { PanelHeader } = DocViewerPanelModule;
      const liveTranslationProjectionSummary = summarizeDocumentLiveTranslationProjectionSnapshot({
        version: 15,
        translations: {
          u0001: {
            status: "error",
            error,
            observationRef,
            receiptRef,
            laneSessionId: "lane-session-docs",
            selectedBackendProvider: "live_translation.local_runtime",
            projectionStatus,
            chunkId: "u0001",
            chunkIndex: 0,
            dedupeKey: `document_markdown:docs/research/nhm2.md:u0001:es:${projectionStatus}`,
            sourceEventId,
            sourceEventMs: 620,
            observedAtMs: 650,
            freshnessStatus,
            terminalAuthorityStatus: "not_terminal_authority",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceHash: "fnv1a32:doc-source",
            sourceKind: "docs",
            sourceTextHash: "fnv1a32:source-payload",
            sourceTextCharCount: 2048,
            accountLocale: "es-US",
            projectionTarget: "docs_chunk",
            targetLanguage: "es",
            cancelRequested: projectionStatus === "cancelled",
            contextRole: "tool_evidence",
            source: "capability_lane",
            answerAuthority: false,
            terminalEligible: false,
            assistantAnswer: false,
            rawContentIncluded: false,
          } as never,
        },
        laneSessions: {},
        mailLoops: {},
        goalBindings: {},
      });

      const { container } = render(
        <PanelHeader
          mode="doc"
          entry={whitepaper}
          anchor={undefined}
          isAutoReading={false}
          autoReadError={null}
          proceduralStatus={null}
          readProgress={null}
          onStopAutoRead={vi.fn()}
          onShowDirectory={vi.fn()}
          canRejoinLiveRead={false}
          onRejoinLiveRead={vi.fn()}
          translationEligible={true}
          translationAccountLocale="es-US"
          translationTargetLanguage="es"
          translationSourceId="document_markdown:docs/research/nhm2.md"
          translationSourceHash="fnv1a32:doc-source"
          translationSourceTextHash="fnv1a32:source-payload"
          translationSourceTextCharCount={2048}
          translationLaneSessionId="lane-session-docs"
          inlineTranslationEnabled={true}
          translationStatus="idle"
          translationError={null}
          liveTranslationProjectionSummary={liveTranslationProjectionSummary}
          onToggleInlineTranslation={vi.fn()}
          onToggleInlineTranslationSessionPause={vi.fn()}
          t={t}
        />,
      );

      const summary = container.querySelector("[data-doc-translation-summary-version]");
      expect(summary?.getAttribute("data-doc-translation-summary-display-status")).toBe(displayStatus);
      expect(summary?.getAttribute("data-doc-translation-summary-renderable")).toBe("false");
      expect(summary?.getAttribute("data-doc-translation-summary-latest-projection-status")).toBe(projectionStatus);
      expect(summary?.getAttribute("data-doc-translation-summary-latest-observation-ref")).toBe(observationRef);
      expect(summary?.getAttribute("data-doc-translation-summary-latest-receipt-ref")).toBe(receiptRef);
      expect(summary?.getAttribute("data-doc-translation-summary-latest-source-event-id")).toBe(sourceEventId);
      expect(summary?.getAttribute("data-doc-translation-summary-latest-source-event-ms")).toBe("620");
      expect(summary?.getAttribute("data-doc-translation-summary-latest-observed-at-ms")).toBe("650");
      expect(summary?.getAttribute("data-doc-translation-summary-latest-terminal-authority-status")).toBe(
        "not_terminal_authority",
      );
      expect(summary?.getAttribute("data-doc-translation-summary-authority-policy")).toBe(
        "projection_only_not_answer_authority",
      );
      expect(summary?.getAttribute("data-doc-translation-summary-governed-projection")).toBe("true");
      expect(summary?.getAttribute("data-doc-translation-summary-terminal-eligible")).toBe("false");
      expect(summary?.getAttribute("data-doc-translation-summary-assistant-answer")).toBe("false");
      expect(summary?.getAttribute("data-doc-translation-summary-raw-content-included")).toBe("false");
      expect(summary).toHaveTextContent(statusLabel);
    },
  );

  it("computes governed translation source identity for a new document session before receipts exist", () => {
    const { PanelHeader } = DocViewerPanelModule;

    const { container } = render(
      <PanelHeader
        mode="doc"
        entry={whitepaper}
        anchor={undefined}
        isAutoReading={false}
        autoReadError={null}
        proceduralStatus={null}
        readProgress={null}
        onStopAutoRead={vi.fn()}
        onShowDirectory={vi.fn()}
        canRejoinLiveRead={false}
        onRejoinLiveRead={vi.fn()}
        translationEligible={true}
        translationAccountLocale="es-US"
        translationTargetLanguage="es"
        translationSourceId="document_markdown:docs/research/nhm2.md"
        translationSourceHash="fnv1a32:doc-source"
        translationSourceTextHash="fnv1a32:doc-source"
        translationSourceTextCharCount={2048}
        translationLaneSessionId="lane-session-next-docs"
        inlineTranslationEnabled={false}
        translationStatus="idle"
        translationError={null}
        liveTranslationProjectionSummary={summarizeDocumentLiveTranslationProjectionSnapshot({
          version: 0,
          translations: {},
          laneSessions: {},
          mailLoops: {},
          goalBindings: {},
        })}
        onToggleInlineTranslation={vi.fn()}
        onToggleInlineTranslationSessionPause={vi.fn()}
        t={t}
      />,
    );

    const inlineControl = container.querySelector("[data-doc-translation-control='inline-account-language']");
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-identity-key")).toBe(
      "document_markdown:docs/research/nhm2.md::fnv1a32:doc-source::fnv1a32:doc-source::2048::docs::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-current-source-identity-key")).toBe(
      "document_markdown:docs/research/nhm2.md::fnv1a32:doc-source::fnv1a32:doc-source::2048::docs::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-latest-source-identity-key")).toBe(
      "document_markdown:docs/research/nhm2.md::fnv1a32:doc-source::fnv1a32:doc-source::2048::docs::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-lane-session-id")).toBe(
      "lane-session-next-docs",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-hash")).toBe("fnv1a32:doc-source");
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-text-hash")).toBe("fnv1a32:doc-source");
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-text-char-count")).toBe("2048");
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-binding-key")).toBe(
      "document_markdown:docs/research/nhm2.md::fnv1a32:doc-source::docs_chunk::es-US::es",
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-reentry-required")).toBe("true");
    expect(inlineControl?.getAttribute("data-doc-translation-control-terminal-eligible")).toBe("false");
    expect(inlineControl?.getAttribute("data-doc-translation-control-assistant-answer")).toBe("false");
  });

  it("keeps current document identity distinct from a stale latest translation receipt in the header", () => {
    const { PanelHeader } = DocViewerPanelModule;
    const currentIdentity =
      "document_markdown:docs/research/current.md::fnv1a32:current-doc::fnv1a32:current-text::2048::docs::docs_chunk::es-US::es";
    const staleIdentity =
      "document_markdown:docs/research/previous.md::fnv1a32:previous-doc::fnv1a32:previous-text::1024::docs::docs_chunk::es-US::es";
    const liveTranslationProjectionSummary = summarizeDocumentLiveTranslationProjectionSnapshot({
      version: 16,
      translations: {
        u0001: {
          status: "error",
          error: "translation_projection_source_identity_mismatch",
          observationRef: "obs:docs:u1:stale-identity",
          receiptRef: "receipt:docs:u1:stale-identity",
          projectionStatus: "missing",
          sourceIdentityKey: currentIdentity,
          latestSourceIdentityKey: staleIdentity,
          sourceId: "document_markdown:docs/research/current.md",
          sourceHash: "fnv1a32:current-doc",
          sourceKind: "docs",
          sourceTextHash: "fnv1a32:current-text",
          sourceTextCharCount: 2048,
          accountLocale: "es-US",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          freshnessStatus: "unknown",
          terminalAuthorityStatus: "not_terminal_authority",
          source: "capability_lane",
          answerAuthority: false,
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        } as never,
      },
      laneSessions: {},
      mailLoops: {},
      goalBindings: {},
    });

    const { container } = render(
      <PanelHeader
        mode="doc"
        entry={whitepaper}
        anchor={undefined}
        isAutoReading={false}
        autoReadError={null}
        proceduralStatus={null}
        readProgress={null}
        onStopAutoRead={vi.fn()}
        onShowDirectory={vi.fn()}
        canRejoinLiveRead={false}
        onRejoinLiveRead={vi.fn()}
        translationEligible={true}
        translationAccountLocale="es-US"
        translationTargetLanguage="es"
        translationSourceId="document_markdown:docs/research/current.md"
        translationSourceHash="fnv1a32:current-doc"
        translationSourceTextHash="fnv1a32:current-text"
        translationSourceTextCharCount={2048}
        translationLaneSessionId="lane-session-current-docs"
        inlineTranslationEnabled={false}
        translationStatus="idle"
        translationError={null}
        liveTranslationProjectionSummary={liveTranslationProjectionSummary}
        onToggleInlineTranslation={vi.fn()}
        onToggleInlineTranslationSessionPause={vi.fn()}
        t={t}
      />,
    );

    const summary = container.querySelector("[data-doc-translation-summary-version]");
    expect(summary?.getAttribute("data-doc-translation-summary-current-source-identity-key")).toBe(currentIdentity);
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-identity-key")).toBe(staleIdentity);
    expect(summary?.getAttribute("data-doc-translation-summary-source-identity-key")).toBe(staleIdentity);
    expect(summary?.getAttribute("data-doc-translation-summary-observation-ref")).toBeNull();
    expect(summary?.getAttribute("data-doc-translation-summary-latest-observation-ref")).toBe(
      "obs:docs:u1:stale-identity",
    );

    const inlineControl = container.querySelector("[data-doc-translation-control='inline-account-language']");
    expect(inlineControl?.getAttribute("data-doc-translation-control-current-source-identity-key")).toBe(
      currentIdentity,
    );
    expect(inlineControl?.getAttribute("data-doc-translation-control-latest-source-identity-key")).toBe(staleIdentity);
    expect(inlineControl?.getAttribute("data-doc-translation-control-source-identity-key")).toBe(staleIdentity);
    expect(inlineControl?.getAttribute("data-doc-translation-control-reentry-required")).toBe("true");
    expect(inlineControl?.getAttribute("data-doc-translation-control-terminal-eligible")).toBe("false");
    expect(inlineControl?.getAttribute("data-doc-translation-control-assistant-answer")).toBe("false");
  });
});
