import { describe, expect, it } from "vitest";

import { evaluateRepoEvidenceRelevanceGate } from "../services/helix-ask/repo-evidence-relevance-gate";
import {
  HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
  type HelixRepoCodeEvidenceObservation,
} from "../../shared/helix-repo-code-evidence-observation";

const observationWithPath = (concept: string, path: string): HelixRepoCodeEvidenceObservation => ({
  schema: HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
  artifact_id: "artifact:repo-observation",
  turn_id: "turn:repo-relevance",
  concept,
  query: concept,
  normalized_terms: [concept],
  search_strategy: {
    exact_terms: [concept],
    symbol_terms: [concept.replace(/\s+/g, "")],
    path_globs_considered: [path.split("/").slice(0, 3).join("/")],
    max_spans: 4,
  },
  evidence_refs: [`${path}:1`],
  observations: [],
  spans: [{
    ref: `${path}:1`,
    path,
    start_line: 1,
    end_line: 1,
    excerpt: concept,
    reason: "test",
    source_kind: path.startsWith("docs/") ? "repo_doc" : "repo_code",
    score: 1,
  }],
  selected_for_answer: true,
  assistant_answer: false,
  raw_content_included: false,
});

describe("repo evidence relevance gate", () => {
  it("blocks fuzzy-only Reasoning Theater evidence when exact concept files exist", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Reasoning Theater",
      query: "What is the reasoning theater in helix ask?",
      observation: observationWithPath("Reasoning Theater", "server/services/helix-ask/alignment-gate.ts"),
    });

    expect(gate.terminal_allowed).toBe(false);
    expect(gate.repair_required).toBe(true);
    expect(gate.violations).toEqual(expect.arrayContaining([
      "exact_match_files_found_but_not_selected",
      "weak_fuzzy_only",
    ]));
  });

  it("allows exact Reasoning Theater evidence", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Reasoning Theater",
      query: "What is the reasoning theater in helix ask?",
      observation: observationWithPath("Reasoning Theater", "server/services/helix-ask/surface/reasoning-theater-state.ts"),
    });

    expect(gate.terminal_allowed).toBe(true);
    expect(gate.coverage).toBe("strong");
    expect(gate.violations).toEqual([]);
  });

  it("allows StarSim codebase evidence from StarSim paths", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "StarSim",
      query: "Do you know what the star simulations do in the codebase?",
      observation: observationWithPath("StarSim", "server/modules/starsim/index.ts"),
    });

    expect(gate.terminal_allowed).toBe(true);
    expect(["adequate", "strong"]).toContain(gate.coverage);
    expect(gate.weak_fuzzy_only).toBe(false);
  });
});
