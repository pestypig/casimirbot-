import { describe, expect, it } from "vitest";

import { applyHelixAskPlatonicGates } from "../server/services/helix-ask/platonic-gates";

function sentenceCount(text: string): number {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length || (text.trim() ? 1 : 0);
}

describe("helix ask platonic gates", () => {
  it("applies concept lint for general F0 answers", () => {
    const answer =
      "Helix Ask is certified. See server/routes/agi.plan.ts for details. This should stay general.";
    const result = applyHelixAskPlatonicGates({
      question: "What is epistemology?",
      answer,
      domain: "general",
      tier: "F0",
      intentId: "general.conceptual_define_compare",
      format: "compare",
      evidenceText: "",
    });
    expect(result.conceptLintApplied).toBe(true);
    expect(result.answer).not.toMatch(/server\/routes\/agi\.plan\.ts/i);
    expect(result.answer).not.toMatch(/certified/i);
    expect(sentenceCount(result.answer)).toBeLessThanOrEqual(3);
  });

  it("blocks repo answers when unsupported rate is too high", () => {
    const result = applyHelixAskPlatonicGates({
      question: "How does the Helix Ask pipeline work?",
      answer:
        "It relies on orbital harmonics and morphospace attractors. The UI renders belief pressure.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.helix_ask_pipeline_explain",
      format: "steps",
      evidenceText: "client/src/components/helix/HelixAskPill.tsx handles ask UI state.",
    });
    expect(result.beliefSummary.claimCount).toBeGreaterThan(0);
    expect(result.beliefSummary.unsupportedRate).toBeGreaterThanOrEqual(0.85);
    expect(result.beliefGateApplied).toBe(true);
    expect(result.answer).toMatch(/repo-backed claims|weakly reflected/i);
  });

  it("blocks warp bubble answers that drift into FTL lore", () => {
    const result = applyHelixAskPlatonicGates({
      question: "what is a warp bubble?",
      answer:
        "In practice, a warp bubble enables faster-than-light travel by manipulating space-time. It moves matter through space at speeds exceeding light.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.warp_conceptual_explain",
      format: "compare",
      evidenceText:
        "Warp Bubble Casimir Module integrates Natario zero-expansion warp bubble calculations with the module system.",
    });
    expect(result.beliefGateApplied || result.rattlingGateApplied).toBe(true);
    expect(result.answer).toMatch(/weakly reflected|drifted too far/i);
  });

  it("guards repo answers when key query terms are missing from evidence", () => {
    const result = applyHelixAskPlatonicGates({
      question: "How does the Helix Ask pipeline use morphospace attractors?",
      answer:
        "Route intent, gather evidence, synthesize an answer, and render the envelope in the UI.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.helix_ask_pipeline_explain",
      format: "compare",
      evidenceGateOk: true,
      evidenceText:
        "helix ask pipeline intent directory evidence gate format envelope helix ask pill.",
    });
    expect(result.coverageSummary.keyCount).toBeGreaterThan(0);
    expect(result.coverageSummary.missingKeyCount).toBeGreaterThan(0);
    expect(result.coverageGateApplied).toBe(true);
    expect(result.answer).toMatch(/I don't see repo evidence/i);
    expect(result.answer).toMatch(/morphospace|attractors/i);
  });

  it("uses explicit coverage slots when provided", () => {
    const result = applyHelixAskPlatonicGates({
      question:
        "How does the plan to save the sun fit into the creation of warp bubble ships?",
      answer: "The repo defines solar restoration and warp bubble concepts.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.warp_conceptual_explain",
      format: "compare",
      evidenceGateOk: true,
      evidenceText:
        "docs/knowledge/solar-restoration.md docs/knowledge/warp/warp-bubble.md helix ask pipeline",
      coverageSlots: ["solar-restoration", "warp-bubble"],
    });
    expect(result.coverageSummary.keyCount).toBe(2);
    expect(result.coverageSummary.missingKeys.join(" ")).not.toMatch(
      /\b(plan|fit|creation)\b/i,
    );
  });

  it("flags unsupported claims when repo evidence is required without citations", () => {
    const result = applyHelixAskPlatonicGates({
      question: "How does the Helix Ask pipeline work?",
      answer: "The pipeline routes intents and applies evidence gates.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.helix_ask_pipeline_explain",
      format: "brief",
      evidenceText: "helix ask pipeline intent evidence gate server/routes/agi.plan.ts",
      requiresRepoEvidence: true,
    });
    expect(result.beliefSummary.unsupportedRate).toBeGreaterThanOrEqual(0.85);
    expect(result.beliefGateApplied).toBe(true);
  });

  it("ignores instruction tokens when gating hybrid coverage", () => {
    const result = applyHelixAskPlatonicGates({
      question:
        "What is the scientific method, and how does this system apply it for verification? Two short paragraphs; second must cite repo files.",
      answer:
        "The scientific method is a falsifiable loop. This system applies evidence gates and verification steps.",
      domain: "hybrid",
      tier: "F1",
      intentId: "hybrid.concept_plus_system_mapping",
      format: "compare",
      evidenceText:
        "server/routes/agi.plan.ts drives intent routing, evidence gates, synthesis, and verification.",
      repoScaffold:
        "agi plan intent routing evidence gate verification envelope helix ask pipeline",
      generalScaffold: "scientific method hypothesis experiment analysis falsifiable verification",
    });
    expect(result.coverageGateApplied).toBe(false);
    expect(result.coverageSummary.missingKeys.join(" ")).not.toMatch(
      /\b(short|paragraphs|second|files|apply)\b/i,
    );
  });

  it("skips coverage gating for composite synthesis", () => {
    const result = applyHelixAskPlatonicGates({
      question:
        "Using the repo, synthesize how the save-the-Sun plan, warp-bubble viability, ideology/ledger gates, and the wavefunction/uncertainty business model fit together.",
      answer:
        "The plan ties mission ethos to verification gates and viability certificates across subsystems.",
      domain: "hybrid",
      tier: "F1",
      intentId: "hybrid.composite_system_synthesis",
      format: "compare",
      evidenceText: "docs/ethos/ideology.json server/gr/gr-evaluation.ts",
    });
    expect(result.coverageGateApplied).toBe(false);
  });

  it("treats file-name tokens like ideology.json as covered by path evidence", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does 'tend the Sun ledger' mean here?",
      answer:
        "It means capability must be paired with measurable replenishment and non-harm, anchored to the mission ethos.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.ideology_reference",
      format: "compare",
      evidenceText:
        "docs/knowledge/sun-ledger.md anchors the phrase to docs/ethos/ideology.json and docs/ethos/why.md.",
      repoScaffold:
        "docs/knowledge/sun-ledger.md docs/ethos/ideology.json docs/ethos/why.md mission ethos sun ledger",
    });
    expect(result.coverageGateApplied).toBe(false);
    expect(result.coverageSummary.missingKeys.join(" ")).not.toMatch(/\b(using|ideology\.json)\b/i);
  });

  it("flags high rattling even when some claims are supported", () => {
    const result = applyHelixAskPlatonicGates({
      question: "How does the Helix Ask pipeline work?",
      answer:
        "The Helix Ask pipeline uses the intent directory, evidence gate, and format step before building the envelope. " +
        "Astrophysics and cicadas dominate the rest of the discussion. " +
        "Plasma storms and sand dunes are unrelated digressions. " +
        "The narrative then jumps to ancient calendars and mythic rivers. " +
        "These topics are unrelated to the prompt.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.helix_ask_pipeline_explain",
      format: "compare",
      evidenceText: "helix ask pipeline stage evidence gate intent directory.",
      repoScaffold: "intent directory evidence gate pipeline stage",
    });
    expect(result.beliefGateApplied).toBe(false);
    expect(result.rattlingScore).toBeGreaterThanOrEqual(0.8);
    expect(result.rattlingGateApplied).toBe(true);
    expect(result.answer).toMatch(/intent directory/i);
    expect(result.answer).not.toMatch(/drifted too far/i);
  });

  it("removes prompt leakage fragments before other gates", () => {
    const answer =
      '", no headings.\nts` uses the `req` object to fetch query parameters.\ntsx). ts). ts).\nHelix Ask works through intent and evidence.';
    const result = applyHelixAskPlatonicGates({
      question: "How does the Helix Ask pipeline work?",
      answer,
      domain: "repo",
      tier: "F1",
      intentId: "repo.helix_ask_pipeline_explain",
      format: "brief",
      evidenceText: "helix ask pipeline intent evidence",
    });
    expect(result.junkCleanApplied).toBe(true);
    expect(result.answer).not.toMatch(/no headings|tsx\)\.|ts\)\.|ts` uses/i);
  });

  it("does not apply belief gates in general domain", () => {
    const answer = "This is a general definition that cites no repo evidence.";
    const result = applyHelixAskPlatonicGates({
      question: "What is epistemology?",
      answer,
      domain: "general",
      tier: "F1",
      intentId: "general.fallback",
      format: "brief",
      evidenceText: "server/routes/agi.plan.ts contains repo logic.",
    });
    expect(result.beliefGateApplied).toBe(false);
    expect(result.rattlingGateApplied).toBe(false);
    expect(result.answer).toBe(answer);
  });

  it("removes orphan extension tokens inline", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does tend the Sun ledger mean?",
      answer: "md. json, highlighting its importance in the ideology.",
      domain: "general",
      tier: "F0",
      intentId: "general.fallback",
      format: "brief",
    });
    expect(result.junkCleanApplied).toBe(true);
    expect(result.answer).not.toMatch(/\bmd\.\b|\bjson,\b/i);
    expect(result.answer).toMatch(/highlighting its importance/i);
  });

  it("removes orphan extension tokens with closing parentheses", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does tend the Sun ledger mean?",
      answer: "md) json) are mentioned in the notes.",
      domain: "general",
      tier: "F0",
      intentId: "general.fallback",
      format: "brief",
    });
    expect(result.junkCleanApplied).toBe(true);
    expect(result.answer).not.toMatch(/\bmd\)|\bjson\)/i);
  });

  it("removes orphan extension tokens with trailing backticks", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does tend the Sun ledger mean?",
      answer: "md` json` are trailing in the snippet.",
      domain: "general",
      tier: "F0",
      intentId: "general.fallback",
      format: "brief",
    });
    expect(result.junkCleanApplied).toBe(true);
    expect(result.answer).not.toMatch(/\bmd`|\bjson`/i);
  });

  it("anchors concept matches from evidence paths even when scaffolds omit paths", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does 'tend the Sun ledger' mean here?",
      answer:
        "The Sun ledger is the stewardship promise that capability must be paired with auditable replenishment.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.ideology_reference",
      format: "compare",
      evidenceText: "mission ethos stewardship replenishment auditable repayment",
      evidencePaths: ["docs/knowledge/sun-ledger.md", "docs/ethos/ideology.json"],
      conceptMatch: {
        matchedField: "alias",
        matchedTerm: "tend the sun ledger",
        card: {
          id: "sun-ledger",
          aliases: ["sun ledger", "stellar ledger", "tend the sun ledger"],
          scope: "mission ethos stewardship ledger",
          definition:
            "The Sun ledger is the mission-ethos promise that every extracted joule must be matched by measurable replenishment and non-harm.",
          sourcePath: "docs/knowledge/sun-ledger.md",
        },
      },
    });
    expect(result.beliefGateApplied).toBe(false);
    expect(result.answer).not.toMatch(/weakly reflected/i);
  });

  it("overrides ideology references with anchored concept + repo evidence", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does 'tend the Sun ledger' mean here?",
      answer: "md. json, highlighting its importance in the organization's ideology.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.ideology_reference",
      format: "compare",
      evidenceText: "docs/knowledge/sun-ledger.md anchors the phrase to ideology.",
      repoScaffold:
        "1. The Sun ledger is described as the mission-ethos promise in docs/knowledge/sun-ledger.md.\n2. The mission ethos is defined in docs/ethos/ideology.json.",
      evidencePaths: ["docs/knowledge/sun-ledger.md", "docs/ethos/ideology.json"],
      conceptMatch: {
        matchedField: "id",
        matchedTerm: "sun-ledger",
        card: {
          id: "sun-ledger",
          aliases: ["sun ledger", "stellar ledger", "tend the sun ledger"],
          scope: "mission ethos stewardship ledger",
          definition:
            "The Sun ledger is the mission-ethos promise that every extracted joule must be matched by measurable replenishment and non-harm.",
          sourcePath: "docs/knowledge/sun-ledger.md",
        },
      },
    });
    expect(result.answer).toMatch(/Sun ledger is the mission-ethos promise/i);
    expect(result.answer).toMatch(/docs\/knowledge\/sun-ledger\.md/i);
    expect(result.answer).not.toMatch(/\bmd\.\b|\bjson,\b/i);
    expect(result.answer).not.toMatch(/weakly reflected/i);
  });

  it("skips belief gate when concept evidence is explicitly anchored", () => {
    const result = applyHelixAskPlatonicGates({
      question: "Using ideology.json, what does 'tend the Sun ledger' mean here?",
      answer:
        "The Sun ledger is the mission-ethos promise that extracted capability must be paired with measurable replenishment.",
      domain: "repo",
      tier: "F1",
      intentId: "repo.ideology_reference",
      format: "compare",
      evidenceText:
        "docs/knowledge/sun-ledger.md anchors the phrase to docs/ethos/ideology.json and docs/ethos/why.md.",
      conceptMatch: {
        matchedField: "id",
        matchedTerm: "sun-ledger",
        card: {
          id: "sun-ledger",
          aliases: ["sun ledger", "stellar ledger"],
          scope: "mission ethos stewardship ledger",
          definition:
            "The Sun ledger is the mission-ethos promise that every extracted joule must be matched by measurable replenishment and non-harm.",
          sourcePath: "docs/knowledge/sun-ledger.md",
        },
      },
    });
    expect(result.beliefGateApplied).toBe(false);
    expect(result.answer).not.toMatch(/weakly reflected/i);
  });
});
