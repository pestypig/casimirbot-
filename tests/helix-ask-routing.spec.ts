import { describe, expect, it } from "vitest";
import { matchHelixAskIntent } from "../server/services/helix-ask/intent-directory";
import { resolveHelixAskFormat } from "../server/services/helix-ask/format";

type IntentCase = {
  question: string;
  hasRepoHints: boolean;
  hasFilePathHints: boolean;
  expectedId: string;
  expectedDomain: "general" | "repo" | "hybrid" | "falsifiable";
  expectedFormat?: "steps" | "compare" | "brief";
  expectStageTags?: boolean;
};

const cases: IntentCase[] = [
  {
    question: "What is epistemology and why does it matter?",
    hasRepoHints: false,
    hasFilePathHints: false,
    expectedId: "general.conceptual_define_compare",
    expectedDomain: "general",
    expectedFormat: "compare",
  },
  {
    question: "How does this system use the scientific method for verification?",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "hybrid.concept_plus_system_mapping",
    expectedDomain: "hybrid",
    expectedFormat: "compare",
    expectStageTags: true,
  },
  {
    question: "How does the Helix Ask pipeline work in this system?",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "repo.helix_ask_pipeline_explain",
    expectedDomain: "repo",
    expectedFormat: "steps",
    expectStageTags: false,
  },
  {
    question: "How does the Helix Ask pipeline work?",
    hasRepoHints: false,
    hasFilePathHints: false,
    expectedId: "repo.helix_ask_pipeline_explain",
    expectedDomain: "repo",
    expectedFormat: "steps",
    expectStageTags: false,
  },
  {
    question: "How does Helix Ask route intent → topic → format? Cite files.",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "repo.helix_ask_routing_explain",
    expectedDomain: "repo",
    expectedFormat: "brief",
    expectStageTags: false,
  },
  {
    question:
      "What is platonic reasoning, and how does this system apply it? Two short paragraphs; second must cite repo files.",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "hybrid.concept_plus_system_mapping",
    expectedDomain: "hybrid",
    expectedFormat: "compare",
    expectStageTags: false,
  },
  {
    question: "Where is the evidence gate computed and what thresholds are enforced? Cite files.",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "repo.helix_ask_gate_explain",
    expectedDomain: "repo",
    expectedFormat: "brief",
    expectStageTags: false,
  },
  {
    question: "This repo throws an error on startup. How do I fix it?",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "repo.repo_debugging_root_cause",
    expectedDomain: "repo",
    expectedFormat: "steps",
    expectStageTags: false,
  },
  {
    question: "Update this repo to add a new API endpoint.",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "repo.repo_change_request",
    expectedDomain: "repo",
    expectedFormat: "steps",
    expectStageTags: false,
  },
  {
    question:
      "Using the system ideology, what is the right stance on verification vs persuasion?",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "repo.ideology_reference",
    expectedDomain: "repo",
    expectedFormat: "compare",
    expectStageTags: false,
  },
  {
    question: "How is warp bubble viability computed through constraint gates to a certificate?",
    hasRepoHints: true,
    hasFilePathHints: false,
    expectedId: "falsifiable.constraints.gr_viability_certificate",
    expectedDomain: "falsifiable",
    expectedFormat: "brief",
    expectStageTags: false,
  },
];

describe("Helix Ask intent routing", () => {
  for (const entry of cases) {
    it(`routes: ${entry.expectedId}`, () => {
      const match = matchHelixAskIntent({
        question: entry.question,
        hasRepoHints: entry.hasRepoHints,
        hasFilePathHints: entry.hasFilePathHints,
      });
      expect(match.profile.id).toBe(entry.expectedId);
      expect(match.profile.domain).toBe(entry.expectedDomain);
      if (entry.expectedFormat) {
        const resolved = resolveHelixAskFormat(entry.question, match.profile, false);
        expect(resolved.format).toBe(entry.expectedFormat);
        if (typeof entry.expectStageTags === "boolean") {
          expect(resolved.stageTags).toBe(entry.expectStageTags);
        }
      }
    });
  }

  it("forces repo hints when cite-file phrasing is used", () => {
    const question = "Where is the evidence gate computed and what thresholds are enforced? Cite files.";
    const hasFilePathHints = false;
    const hasRepoHints = /cite files?/i.test(question);
    const match = matchHelixAskIntent({ question, hasRepoHints, hasFilePathHints });
    expect(match.profile.domain).toBe("repo");
  });
});
