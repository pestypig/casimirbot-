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
      sourceHash: "fnv1a32:whole-doc",
      sourceKind: "document_markdown",
      sourceTextHash: "fnv1a32:visible-chunk",
      sourceTextCharCount: 42,
      chunkId: "doc-inline:fnv1a32:whole-doc:u0001",
      chunkIndex: 1,
      accountLocale: "es-US",
      targetLanguage: "es",
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
      '<div data-doc-translation-anchor="u-memory-current" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-memory-old" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-inflight-current" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
      '<div data-doc-translation-anchor="u-inflight-old" data-doc-translation-render-status="empty" data-doc-translation-display-status="empty" data-doc-translation-projection-status="missing"></div>',
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
        "u-memory-current",
        "u-memory-old",
        "u-inflight-current",
        "u-inflight-old",
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
        } as never,
        "u-memory-old": {
          status: "ready",
          text: "Texto anterior.",
          sourceHash: "fnv1a32:old",
        } as never,
        "u-inflight-current": {
          status: "loading",
          text: "",
          sourceHash: "fnv1a32:current",
        } as never,
        "u-inflight-old": {
          status: "loading",
          text: "",
          sourceHash: "fnv1a32:old",
        } as never,
      },
      inFlightIds: new Set(["u-inflight-current", "u-inflight-old"]),
      sourceHash: "fnv1a32:current",
      maxUnits: 10,
      maxChars: 1000,
    })).toEqual(["u-old-source", "u-memory-old", "u-inflight-old", "u-empty"]);
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
        translationTargetLanguage="es"
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
      hasRenderableText: true,
      projectedCount: 1,
      latestStatus: "ready",
      latestProjectionStatus: "projected",
      latestObservationRef: "obs:translation-header",
      latestReceiptRef: "receipt:translation-header",
      latestSourceBindingKey: "docs:nhm2::fnv1a32:doc-source::docs_chunk::es-US::es",
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
      latestGoalBindingSourceBindingKey: "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es-US::es",
      latestGoalBindingObservationKey:
        "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es::u0001::obs:goal-binding-docs",
      latestGoalBindingMailLoopObservationKey:
        "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es::u0001::receipt:goal-binding-docs",
      latestGoalBindingKeyFromBinding:
        "goal:account-language::goal-binding-docs::lane-session-docs::live_translation",
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
        translationEligible
        translationTargetLanguage="es"
        inlineTranslationEnabled
        translationStatus="cached"
        translationError={null}
        liveTranslationProjectionSummary={liveTranslationProjectionSummary}
        onToggleInlineTranslation={vi.fn()}
        t={t}
      />,
    );

    const summary = container.querySelector("[data-doc-translation-summary-version]");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-text-hash")).toBe(
      "fnv1a32:source-payload",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-text-char-count")).toBe("2048");
    expect(summary?.getAttribute("data-doc-translation-summary-latest-source-binding-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::docs_chunk::es-US::es",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-observation-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::docs_chunk::es::u0001::obs:translation-header",
    );
    expect(summary?.getAttribute("data-doc-translation-summary-latest-mail-loop-observation-key")).toBe(
      "docs:nhm2::fnv1a32:doc-source::docs_chunk::es::u0001::receipt:translation-header",
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
      "docs:nhm2::fnv1a32:goal-doc-source::docs_chunk::es-US::es",
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
    expect(summary?.getAttribute("data-doc-translation-summary-terminal-eligible")).toBe("false");
    expect(summary?.getAttribute("data-doc-translation-summary-assistant-answer")).toBe("false");
    expect(summary).toHaveTextContent("Translation ready: projected");
  });
});
