import { describe, expect, it } from "vitest";
import {
  buildDocsEvidencePassages,
  buildDocsSearchDocumentCandidates,
  buildDocsSearchTerms,
  rankDocsSearchHits,
} from "../docs-search";
import type { RepoSearchHit } from "../repo-search";

const hit = (filePath: string, text: string, term = "nhm2"): RepoSearchHit => ({
  filePath,
  line: 1,
  text,
  term,
});

describe("docs search taxonomy metadata", () => {
  it("ranks a numeric mechanics example for a natural number-word goal", () => {
    const query = "Can you make me glow for ten seconds in the connected Minecraft world?";
    const terms = buildDocsSearchTerms(query);
    const ranked = rankDocsSearchHits(
      [
        {
          filePath: "docs/game-mechanics/minecraft-command-playbook-v1.md",
          line: 52,
          text: "World operator and Server administrator modes can intentionally target",
          term: "world",
        },
        {
          filePath: "docs/game-mechanics/minecraft-command-playbook-v1.md",
          line: 78,
          text: "- temporary bound-player effect: `effect give @s minecraft:glowing 10 0 true`;",
          term: "10",
        },
        {
          filePath: "docs/game-mechanics/minecraft-command-playbook-v1.md",
          line: 86,
          text: "- bound-player title: `title @s title {\"text\":\"Helix is connected\"}`;",
          term: "connected",
        },
      ],
      query,
    );

    expect(terms).toContain("10");
    expect(ranked[0]).toMatchObject({ line: 78, term: "10" });
  });

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

  it("materializes query-focused passages with stable line citations from a matched document", () => {
    const candidates = buildDocsSearchDocumentCandidates(
      [
        hit(
          "docs/research/nhm2-current-status-whitepaper.md",
          "NHM2 current status whitepaper.",
          "nhm2",
        ),
      ],
      "What is the main idea of the NHM2 current status whitepaper?",
      1,
    );

    const passages = buildDocsEvidencePassages(
      candidates,
      "What is the main idea of the NHM2 current status whitepaper?",
      4,
    );

    expect(passages.length).toBeGreaterThan(0);
    expect(passages[0]).toMatchObject({
      path: "docs/research/nhm2-current-status-whitepaper.md",
      section: "Abstract",
    });
    expect(passages[0]?.text_excerpt).toContain("NHM2");
    expect(passages[0]?.citation_ref).toMatch(/workspace:\/\/docs\/research\/nhm2-current-status-whitepaper\.md#line=\d+-\d+/);
    expect(passages[0]?.citation_label).toMatch(/line(?:s)? \d+/);
  });
});
