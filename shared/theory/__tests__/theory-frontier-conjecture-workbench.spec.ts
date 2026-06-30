import { describe, expect, it } from "vitest";

import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryFrontierSearch } from "../theory-frontier-search";
import {
  buildTheoryFrontierConjectureWorkbenchV1,
  THEORY_FRONTIER_CONJECTURE_WORKBENCH_SCHEMA_VERSION,
  theoryFrontierConjectureForbiddenClaimNotes,
} from "../theory-frontier-conjecture-workbench";

describe("Theory frontier conjecture workbench projection", () => {
  it("projects frontier candidates into evidence-only conjecture records", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const frontierSearch = buildTheoryFrontierSearch({
      graph,
      query: "Find missing intermediate badges between source residual, QEI margin, tensor authority, and calculator probes.",
      searchSeed: "frontier-conjecture-workbench-test",
      limit: 4,
    });

    const workbench = buildTheoryFrontierConjectureWorkbenchV1(frontierSearch, [
      {
        actionId: "theory-badge-graph.request_frontier_scholarly_lookup",
        label: "Run frontier scholarly lookup",
        panelId: "theory-badge-graph",
        args: {
          candidate_id: frontierSearch.candidates[0]?.candidateId,
          badge_ids: frontierSearch.candidates[0]?.badgeIds ?? [],
          mutating: false,
          no_auto_promote_literature: true,
        },
        mutatesCalculator: false,
        solves: false,
      },
    ]);

    expect(workbench.schema_version).toBe(THEORY_FRONTIER_CONJECTURE_WORKBENCH_SCHEMA_VERSION);
    expect(workbench.candidates.length).toBeGreaterThan(0);
    expect(workbench.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
    });

    const candidate = workbench.candidates[0];
    expect(candidate).toMatchObject({
      candidate_id: expect.any(String),
      candidate_kind: expect.stringMatching(/candidate_connection|missing_intermediate_badge|unresolved_semantic_region/),
      status: expect.stringMatching(
        /coarse_candidate|exact_verification_pending|needs_observable|needs_scholarly_evidence|blocked_by_boundary/,
      ),
      title: expect.any(String),
      summary: expect.any(String),
      proposed_relation_or_missing_badge: expect.any(String),
      congruence_score: expect.any(Number),
      information_gain_bits: expect.any(Number),
      promotion_allowed: false,
      terminal_eligible: false,
      assistant_answer: false,
      post_tool_model_step_required: true,
    });
    expect(candidate.nearby_badge_ids.length).toBeGreaterThan(0);
    expect(candidate.scale_bands).toEqual(candidate.biome_region.scaleBands);
    expect(candidate.render_chunk_ids).toEqual(candidate.biome_region.renderChunkIds);
    expect(candidate.semantic_chunk_ids).toEqual(candidate.biome_region.semanticChunkIds);
    expect(Array.isArray(candidate.required_observables)).toBe(true);
    expect(Array.isArray(candidate.required_artifacts)).toBe(true);
    expect(Array.isArray(candidate.source_references)).toBe(true);
    expect(Array.isArray(candidate.falsification_checks)).toBe(true);
    expect(Array.isArray(candidate.claim_boundary_notes)).toBe(true);
    expect(candidate.recommended_next_actions.every((action) => action.solves === false)).toBe(true);
    expect(candidate.recommended_next_actions.every((action) => action.mutates_calculator === false)).toBe(true);
  });

  it("boundary-blocks overclaim prompts without promoting candidates", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const prompt =
      "Use graph placement and calculator output to prove physical viability of the warp drive candidate.";
    const frontierSearch = buildTheoryFrontierSearch({
      graph,
      query: prompt,
      searchSeed: "frontier-conjecture-overclaim-test",
      limit: 4,
    });
    const forbiddenClaimNotes = theoryFrontierConjectureForbiddenClaimNotes(prompt);
    const workbench = buildTheoryFrontierConjectureWorkbenchV1(frontierSearch, [], forbiddenClaimNotes);

    expect(forbiddenClaimNotes.length).toBeGreaterThan(0);
    expect(workbench.candidate_status_counts).toEqual({
      blocked_by_boundary: frontierSearch.candidates.length,
    });
    expect(workbench.candidates.length).toBeGreaterThan(0);
    expect(workbench.candidates.every((candidate) => candidate.status === "blocked_by_boundary")).toBe(true);
    expect(workbench.candidates.every((candidate) => candidate.promotion_allowed === false)).toBe(true);
    expect(workbench.candidates[0]?.claim_boundary_notes).toEqual(expect.arrayContaining(forbiddenClaimNotes));
  });
});
