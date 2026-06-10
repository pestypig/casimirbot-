import { describe, expect, it } from "vitest";
import { DOC_MANIFEST, filterDocManifestEntries, type DocManifestEntry } from "@/lib/docs/docManifest";

function makeEntry(id: string, title: string, relativePath: string): DocManifestEntry {
  return {
    id,
    route: `/${relativePath}`,
    relativePath,
    folderChain: ["docs"],
    folderLabel: "docs",
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

  it("finds the real NHM2 theory directory from the generated docs manifest", () => {
    const matches = filterDocManifestEntries("NHM2 Theory white paper", DOC_MANIFEST);
    expect(
      matches.some(
        (entry) => entry.relativePath === "docs/audits/research/needle-hull-mark2/theory-directory-latest.md",
      ),
    ).toBe(true);
  });
});
