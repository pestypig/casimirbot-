import { describe, expect, it } from "vitest";
import {
  DOC_MANIFEST,
  compareDocCatalogEntries,
  filterDocManifestEntries,
  type DocManifestEntry,
} from "@/lib/docs/docManifest";

function makeEntry(
  id: string,
  title: string,
  relativePath: string,
  overrides: Partial<Pick<DocManifestEntry, "subjectLabel" | "catalogDate" | "catalogDateSource" | "isLatest">> = {},
): DocManifestEntry {
  return {
    id,
    route: `/${relativePath}`,
    relativePath,
    folderChain: ["docs"],
    folderLabel: "docs",
    subjectLabel: overrides.subjectLabel ?? "General Reference",
    catalogDate: overrides.catalogDate ?? null,
    catalogDateSource: overrides.catalogDateSource ?? null,
    isLatest: overrides.isLatest ?? /\blatest\b/i.test(`${title} ${relativePath}`),
    title,
    searchText: `${title} ${relativePath}`.toLowerCase(),
    loader: async () => "",
  };
}

describe("filterDocManifestEntries", () => {
  const entries: DocManifestEntry[] = [
    makeEntry(
      "needle-directory",
      "Needle Hull Mark2 Theory Directory Latest",
      "docs/audits/research/needle-hull-mark2/theory-directory-latest.md",
    ),
    makeEntry(
      "mission-time",
      "Warp Nhm2 Mission Time Estimator Latest",
      "docs/audits/research/warp-nhm2-mission-time-estimator-latest.md",
    ),
    makeEntry("helix-flow", "Helix Ask Flow", "docs/helix-ask-flow.md"),
  ];

  it("matches mixed NHM2 aliases and descriptive paper wording", () => {
    const matches = filterDocManifestEntries("NHM2 Theory white paper", entries);
    expect(matches.map((entry) => entry.id)).toEqual(["needle-directory"]);
  });

  it("expands NHM2 entries for Needle Hull Mark 2 queries", () => {
    const matches = filterDocManifestEntries("Needle Hull Mark 2 mission", entries);
    expect(matches.map((entry) => entry.id)).toEqual(["mission-time"]);
  });

  it("keeps matching direct title characters as the typed title grows", () => {
    const matches = filterDocManifestEntries("Needle Hull Ma", entries);
    expect(matches[0]?.id).toBe("needle-directory");
  });

  it("matches titles when the user omits spaces or punctuation", () => {
    const matches = filterDocManifestEntries("helixaskfl", entries);
    expect(matches.map((entry) => entry.id)).toEqual(["helix-flow"]);
  });

  it("ranks direct title matches above path-only token matches", () => {
    const localEntries: DocManifestEntry[] = [
      makeEntry("path-only", "General Research Notes", "docs/helix/ask/flow-archive.md"),
      makeEntry("title", "Helix Ask Flow", "docs/reference/flow.md"),
    ];

    const matches = filterDocManifestEntries("Helix Ask Flow", localEntries);
    expect(matches.map((entry) => entry.id)).toEqual(["title", "path-only"]);
  });

  it("catalogs real docs with subject and filename date metadata", () => {
    const entry = DOC_MANIFEST.find(
      (candidate) =>
        candidate.relativePath === "docs/audits/research/ownership-maturity-utility-deep-research-2026-02-25.md",
    );

    expect(entry).toMatchObject({
      subjectLabel: "Research and Development Logs",
      catalogDate: "2026-02-25",
      catalogDateSource: "path",
    });
  });

  it("sorts latest docs above older dated snapshots within catalog groups", () => {
    const sorted = [
      makeEntry("older", "Warp Conceptual Guide 2026 03 19", "docs/audits/research/warp-guide-2026-03-19.md", {
        subjectLabel: "Warp Mechanics",
        catalogDate: "2026-03-19",
        catalogDateSource: "path",
      }),
      makeEntry("latest", "Warp Conceptual Guide Latest", "docs/audits/research/warp-guide-latest.md", {
        subjectLabel: "Warp Mechanics",
        isLatest: true,
      }),
    ].sort(compareDocCatalogEntries);

    expect(sorted.map((entry) => entry.id)).toEqual(["latest", "older"]);
  });

  it("finds the real NHM2 theory directory from the generated docs manifest", () => {
    const matches = filterDocManifestEntries("NHM2 Theory white paper", DOC_MANIFEST);
    expect(
      matches.some(
        (entry) => entry.relativePath === "docs/audits/research/needle-hull-mark2/theory-directory-latest.md",
      ),
    ).toBe(true);
  });
});
