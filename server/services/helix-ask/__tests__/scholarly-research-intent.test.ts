import { describe, expect, it } from "vitest";
import {
  deriveDirectScholarlyPortfolioQueries,
  detectScholarlyResearchIntent,
} from "../scholarly-research-intent";
import { arbitrateAskSourceTarget } from "../ask-source-target-arbitrator";

describe("scholarly research intent", () => {
  it("does not admit scholarly research from a quoted tool identifier in a calculator request", () => {
    const intent = detectScholarlyResearchIntent(
      "Use the Scientific Calculator to compute (8 * 9) + 1. The string `internet-search.search_web` is only a non-executable example. Report the numeric result only.",
    );

    expect(intent.researchRequested).toBe(false);
    expect(intent.explicitCues).not.toContain("research_lookup_action");
    expect(intent.explicitCues).not.toContain("scholarly_full_text_or_pdf");
  });

  it("keeps a citation request scoped to the currently open local document", () => {
    const intent = detectScholarlyResearchIntent(
      "According to the currently open NHM2 status whitepaper, identify the unresolved blockers. Use only the current document and cite section headings.",
    );

    expect(intent.researchRequested).toBe(false);
  });

  it("keeps an explicit repo-relative docs path out of scholarly research", () => {
    const intent = detectScholarlyResearchIntent(
      "Open docs/research/nhm2-current-status-whitepaper.md. Within section \u201c6.7 Twin Paradox trip clocking interpretation,\u201d return only complete prose sentences containing the literal lowercase token alpha. Exclude display equations, headings, identifiers, and sentence fragments. Preserve original wording and line numbers. Do not summarize.",
    );

    expect(intent.researchRequested).toBe(false);
  });

  it("keeps local docs and repo citation requests on their explicit evidence tools", () => {
    const prompts = [
      "Use docs-viewer.locate_in_doc to find the section in the open document. Answer only from the docs-viewer observation and cite the document evidence.",
      "Use repo-code.search_concept to find terminal authority. Answer only from repo/code evidence and cite file paths.",
    ];

    for (const prompt of prompts) {
      expect(detectScholarlyResearchIntent(prompt).researchRequested).toBe(false);
    }
  });

  it("keeps full-text suitability checks metadata-only when fetching and Image Lens are negated", () => {
    const intent = detectScholarlyResearchIntent(
      "Find research papers about quantum inequality sampling constraints. Explain which returned papers have a structured source suitable for attempting full-text parsing. Do not use Image Lens and do not fetch full text.",
    );

    expect(intent.researchRequested).toBe(true);
    expect(intent.fullTextRequested).toBe(false);
    expect(intent.scholarlyIntent.requested_workflow).toBe("metadata_search");
    expect(intent.scholarlyIntent.requires_full_text).toBe(false);
    expect(intent.scholarlyIntent.requested_outputs).toEqual(["paper_metadata"]);
    expect(intent.scholarlyIntent.evidence_demand).toMatchObject({
      alternatives: [{ product: "paper_metadata", minimum_depth: "metadata_lookup" }],
      required_modes: [],
      minimum_satisfying_depth: "metadata_lookup",
    });
  });

  it("selects a typographically quoted paper title for metadata-only lookup", () => {
    const intent = detectScholarlyResearchIntent([
      "LOOKUP_SMOKE_03 — Search arXiv for “Quantum Field Theory Constrains Traversable Wormhole Geometries” by Ford and Roman.",
      "Use scholarly lookup only and return the title, authors, DOI, and arXiv ID.",
      "Do not fetch full text or inspect PDF pages.",
    ].join(" "));

    expect(intent.researchRequested).toBe(true);
    expect(intent.normalizedQuery).toBe("Quantum Field Theory Constrains Traversable Wormhole Geometries");
    expect(intent.scholarlyIntent.query_normalization_reasons).toEqual(["quoted_topic_selected"]);
    expect(intent.scholarlyIntent.requested_workflow).toBe("metadata_search");
    expect(intent.plannedScholarlyCapabilityChain.planned_capabilities)
      .toEqual(["scholarly-research.lookup_papers"]);
  });

  it("plans direct full-text retrieval without an unwanted lookup subgoal", () => {
    const intent = detectScholarlyResearchIntent(
      "Use scholarly-research.fetch_full_text directly on https://arxiv.org/pdf/2401.12345. Report whether machine-readable full text was obtained. Do not run scholarly-research.lookup_papers or use Image Lens.",
    );

    expect(intent.researchRequested).toBe(true);
    expect(intent.arxivId).toBe("2401.12345");
    expect(intent.plannedScholarlyCapabilityChain.planned_capabilities)
      .toEqual(["scholarly-research.fetch_full_text"]);
    expect(intent.plannedScholarlyCapabilityChain.terminal_evidence_requirement).toBe("full_text");
  });

  it("recognizes a natural-language direct fetch for an old-style arXiv identifier", () => {
    const prompt =
      "FULLTEXT_SMOKE_01 — Fetch and parse the full text for arXiv gr-qc/9510071. Return the title, parsed page count, and one page-numbered passage or equation. Do not search for other papers.";
    const intent = detectScholarlyResearchIntent(prompt);

    expect(intent).toMatchObject({
      researchRequested: true,
      arxivId: "gr-qc/9510071",
      fullTextRequested: true,
      scholarlyIntent: {
        requested_workflow: "full_text_summary",
        terminal_evidence_requirement: "full_text",
        evidence_demand: {
          satisfaction: "any_of",
          required_modes: ["full_text"],
          optional_modes: ["equation_extraction", "page_image_parse"],
          minimum_satisfying_depth: "full_text",
        },
      },
    });
    expect(intent.plannedScholarlyCapabilityChain.planned_capabilities)
      .toEqual(["scholarly-research.fetch_full_text"]);

    expect(arbitrateAskSourceTarget({
      turnId: "ask:scholarly-natural-direct-full-text",
      threadId: "helix-ask:test",
      promptText: prompt,
    })).toMatchObject({
      target_source: "scholarly_research",
      target_kind: "scholarly_research",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
  });

  it("does not turn fully negated, quoted, historical, or future scholarly wording into a current route", () => {
    const prompts = [
      "Do not search arXiv for Ford and Roman. Do not fetch full text; answer from general knowledge.",
      '"Search arXiv for Ford and Roman" was the prior instruction. Do not fetch full text; explain the instruction.',
      "I searched arXiv for Ford and Roman earlier. Do not fetch full text; summarize what the request means.",
      "Later, if needed, search arXiv for Ford and Roman. Do not fetch full text; for now answer from general knowledge.",
    ];

    for (const [index, promptText] of prompts.entries()) {
      expect(arbitrateAskSourceTarget({
        turnId: `ask:scholarly-contextual-${index}`,
        threadId: "helix-ask:test",
        promptText,
      }).target_source).toBe("model_only");
    }
  });

  it("does not resurrect a naturally worded direct fetch when full text is explicitly negated", () => {
    const prompt =
      "Do not fetch or parse the full text for arXiv gr-qc/9510071; answer from general knowledge.";
    const intent = detectScholarlyResearchIntent(prompt);

    expect(intent.fullTextRequested).toBe(false);
    expect(intent.plannedScholarlyCapabilityChain.planned_capabilities)
      .not.toContain("scholarly-research.fetch_full_text");
    expect(arbitrateAskSourceTarget({
      turnId: "ask:scholarly-negated-natural-direct-full-text",
      threadId: "helix-ask:test",
      promptText: prompt,
    }).target_source).toBe("model_only");
  });

  it("preserves lookup then fetch when both steps are affirmatively requested", () => {
    const intent = detectScholarlyResearchIntent(
      "Use scholarly-research.lookup_papers to resolve https://arxiv.org/abs/2401.12345, then use scholarly-research.fetch_full_text.",
    );

    expect(intent.plannedScholarlyCapabilityChain.planned_capabilities).toEqual([
      "scholarly-research.lookup_papers",
      "scholarly-research.fetch_full_text",
    ]);
  });

  it("keeps full-text portfolio instructions out of the scholarly search query", () => {
    const intent = detectScholarlyResearchIntent(
      "Find research papers about quantum inequality sampling constraints in curved spacetime. Fetch the best three accessible sources and summarize only from full text.",
    );

    expect(intent.researchRequested).toBe(true);
    expect(intent.normalizedQuery).toBe("quantum inequality sampling constraints in curved spacetime");
    expect(intent.scholarlyIntent.requested_workflow).toBe("full_text_summary");
  });

  it("splits an explicit three-topic full-text request into a bounded lookup portfolio", () => {
    expect(deriveDirectScholarlyPortfolioQueries(
      "quantum-inequality constraints on negative energy, traversable wormholes, or warp drives",
      3,
    )).toEqual([
      "quantum-inequality constraints on negative energy",
      "quantum-inequality constraints on traversable wormholes",
      "quantum-inequality constraints on warp drives",
    ]);
  });
});
