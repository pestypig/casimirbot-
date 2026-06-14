import { describe, expect, it } from "vitest";

import { evaluateRepoEvidenceRelevanceGate } from "../services/helix-ask/repo-evidence-relevance-gate";
import {
  HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
  type HelixRepoCodeEvidenceObservation,
} from "../../shared/helix-repo-code-evidence-observation";

const observationWithPaths = (concept: string, paths: string[]): HelixRepoCodeEvidenceObservation => ({
  schema: HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
  artifact_id: "artifact:repo-observation",
  turn_id: "turn:repo-relevance",
  concept,
  query: concept,
  normalized_terms: [concept],
  search_strategy: {
    exact_terms: [concept],
    symbol_terms: [concept.replace(/\s+/g, "")],
    path_globs_considered: paths.map((path) => path.split("/").slice(0, 3).join("/")),
    max_spans: 4,
  },
  evidence_refs: paths.map((path) => `${path}:1`),
  observations: [],
  spans: paths.map((path) => ({
    ref: `${path}:1`,
    path,
    start_line: 1,
    end_line: 1,
    excerpt: concept,
    reason: "test",
    source_kind: path.startsWith("docs/") ? "repo_doc" : "repo_code",
    score: 1,
  })),
  selected_for_answer: true,
  assistant_answer: false,
  raw_content_included: false,
});

const observationWithPath = (concept: string, path: string): HelixRepoCodeEvidenceObservation =>
  observationWithPaths(concept, [path]);

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

  it("requires role coverage for broad exact Reasoning Theater evidence", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Reasoning Theater",
      query: "What is the reasoning theater in helix ask?",
      observation: observationWithPaths("Reasoning Theater", [
        "server/routes/helix/reasoning-theater.ts",
        "server/services/helix-ask/surface/reasoning-theater-state.ts",
        "client/src/components/helix/HelixAskPill.tsx",
        "server/__tests__/helix.reasoning-theater.topology.test.ts",
      ]),
    });

    expect(gate.terminal_allowed).toBe(true);
    expect(gate.coverage).toBe("strong");
    expect(gate.violations).toEqual([]);
    expect(gate.selected_evidence_roles).toEqual(expect.arrayContaining(["runtime_contract", "test_contract"]));
  });

  it("blocks store-only Situation Room evidence for broad concept answers", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Situation Room",
      query: "What is the Situation Room?",
      observation: observationWithPath("Situation Room", "client/src/store/useSituationRoomStore.ts"),
    });

    expect(gate.terminal_allowed).toBe(false);
    expect(gate.repair_required).toBe(true);
    expect(gate.selected_evidence_roles).toEqual(["state_model"]);
    expect(gate.missing_required_roles).toEqual(expect.arrayContaining(["ui_surface", "capability_registry"]));
    expect(gate.violations).toEqual(expect.arrayContaining(["missing_required_evidence_roles"]));
  });

  it("allows multi-role Situation Room evidence", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Situation Room",
      query: "What is the Situation Room?",
      observation: observationWithPaths("Situation Room", [
        "client/src/components/workstation/SituationRoomPipelinesPanel.tsx",
        "shared/workstation-dynamic-tools.ts",
        "client/src/store/useSituationRoomStore.ts",
        "server/services/helix-ask/situation-context-turn-router.ts",
      ]),
    });

    expect(gate.terminal_allowed).toBe(true);
    expect(["adequate", "strong"]).toContain(gate.coverage);
    expect(gate.selected_evidence_roles).toEqual(expect.arrayContaining(["ui_surface", "capability_registry", "state_model"]));
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

  it("rejects off-topic selected evidence for final-answer language debug prompts", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Helix Ask",
      query:
        "Busca en el repo como Helix Ask decide el idioma final. Usa evidencia del codigo y cita archivos y lineas.",
      observation: observationWithPaths("Helix Ask", [
        "server/services/helix-ask/__tests__/civilization-bounds-roadmap-tool.test.ts",
        "server/services/helix-ask/__tests__/fruition-tool.test.ts",
      ]),
    });

    expect(gate.prompt_facet).toMatchObject({
      applies: true,
      facet: "final_answer_language_debug_contract",
    });
    expect(gate.terminal_allowed).toBe(false);
    expect(gate.violations).toContain("prompt_facet_evidence_missing");
    expect(gate.selected_prompt_facet_paths).toEqual([]);
  });

  it("allows final-answer language debug prompts when selected evidence hits Ask language files", () => {
    const gate = evaluateRepoEvidenceRelevanceGate({
      turnId: "turn:repo-relevance",
      concept: "Helix Ask",
      query:
        "Explain Helix Ask final answer language, but use repo code evidence and debug export sources.",
      observation: observationWithPaths("Helix Ask", [
        "server/services/helix-ask/runtime/ask-handler.ts",
        "server/services/helix-ask/surface/ask-answer-surface.ts",
      ]),
    });

    expect(gate.prompt_facet.applies).toBe(true);
    expect(gate.terminal_allowed).toBe(true);
    expect(gate.violations).not.toContain("prompt_facet_evidence_missing");
    expect(gate.selected_prompt_facet_paths).toEqual(expect.arrayContaining([
      "server/services/helix-ask/runtime/ask-handler.ts",
      "server/services/helix-ask/surface/ask-answer-surface.ts",
    ]));
  });
});
