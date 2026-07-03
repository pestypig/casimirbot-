/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { DocManifestEntry } from "@/lib/docs/docManifest";

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
        inlineTranslationEnabled={false}
        translationStatus="idle"
        translationError={null}
        liveTranslationProjectionSummary={{
          version: 0,
          readyCount: 0,
          loadingCount: 0,
          failedCount: 0,
          cancelledCount: 0,
          staleCount: 0,
          blockedLaneSessionCount: 0,
          blockedMailLoopCount: 0,
          blockedGoalBindingCount: 0,
        } as never}
        onToggleInlineTranslation={vi.fn()}
        t={t}
      />,
    );

    const headerBadges = screen.getByTestId("doc-header-taxonomy-badges");
    expect(headerBadges).toHaveTextContent("Canonical research");
    expect(headerBadges).toHaveTextContent("Calculator-ready");
    expect(headerBadges).toHaveTextContent("Sidecars attached");
  });
});
