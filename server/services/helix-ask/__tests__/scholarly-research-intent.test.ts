import { describe, expect, it } from "vitest";
import { detectScholarlyResearchIntent } from "../scholarly-research-intent";

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
  });
});
