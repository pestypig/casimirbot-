import { describe, expect, it } from "vitest";
import { buildDocsSearchDocumentCandidates } from "../docs-search";
import type { RepoSearchHit } from "../repo-search";

const hit = (filePath: string, text: string, term = "nhm2"): RepoSearchHit => ({
  filePath,
  line: 1,
  text,
  term,
});

describe("docs search taxonomy metadata", () => {
  it("infers taxonomy classes from folder rules when no explicit document entry exists", () => {
    const candidates = buildDocsSearchDocumentCandidates(
      [
        hit(
          "docs/audits/research/ownership-maturity-utility-deep-research-2026-02-25.md",
          "Generated deep research packet for ownership maturity.",
          "research",
        ),
        hit(
          "docs/specs/warp-promotion-readiness-suite-contract-v1.md",
          "Specification contract for promotion readiness.",
          "contract",
        ),
        hit(
          "docs/audits/toe-sequence-forest-lane-closure-2026-02-19.md",
          "Historical audit trail for a superseded sequence lane.",
          "audit",
        ),
      ],
      "research contract audit",
      8,
    );

    expect(candidates.find((candidate) => candidate.path.startsWith("docs/audits/research/"))).toMatchObject({
      doc_class: "synthetic-research",
    });
    expect(candidates.find((candidate) => candidate.path.startsWith("docs/specs/"))).toMatchObject({
      doc_class: "current-development",
    });
    expect(candidates.find((candidate) => candidate.path === "docs/audits/toe-sequence-forest-lane-closure-2026-02-19.md")).toMatchObject({
      doc_class: "legacy-development",
    });
  });

  it("keeps explicit canonical whitepaper sidecar metadata above folder defaults", () => {
    const candidates = buildDocsSearchDocumentCandidates(
      [
        hit(
          "docs/research/nhm2-current-status-whitepaper.md",
          "NHM2 current status whitepaper.",
          "whitepaper",
        ),
      ],
      "NHM2 whitepaper",
      1,
    );

    expect(candidates[0]).toMatchObject({
      path: "docs/research/nhm2-current-status-whitepaper.md",
      doc_class: "canonical-research",
      bundle_kind: "equation-action-whitepaper",
      canonical: true,
      tool_hints: {
        calculatorReady: true,
      },
    });
    expect(candidates[0]?.sidecars).toEqual([
      "docs/research/nhm2-current-status-whitepaper.equation-actions.json",
      "docs/research/nhm2-current-status-whitepaper.equation-actions.source.json",
    ]);
  });
});
