import { describe, expect, it } from "vitest";
import {
  isTheoryFrontierSearchV1,
  validateTheoryFrontierSearchV1,
} from "../theory-frontier-search.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../../theory/helix-theory-badge-graph";
import { buildTheoryFrontierSearch } from "../../theory/theory-frontier-search";

describe("theory_frontier_search/v1", () => {
  it("validates deterministic frontier search output", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "Einstein tensor source residual QEI margin",
      searchSeed: "frontier-test-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 6,
    });

    expect(validateTheoryFrontierSearchV1(search)).toEqual([]);
    expect(isTheoryFrontierSearchV1(search)).toBe(true);
    expect(search.candidates.length).toBeGreaterThan(0);
    expect(search.scholarlyLookupRequests.length).toBeGreaterThan(0);
    expect(search.scholarlyLookupRequests.every((request) => request.targetSource === "scholarly_research")).toBe(true);
    expect(search.scholarlyLookupRequests.every((request) => request.mutating === false)).toBe(true);
    expect(search.scholarlyLookupRequests.every((request) => request.noAutoPromoteLiterature === true)).toBe(true);
    expect(search.probabilityTerrain.interpretation).toBe("placement_probability_not_truth_claim");
    expect(search.stageTrace.proceduralModel).toBe("coarse_to_fine_seed_finding_precedent");
    expect(search.stageTrace.cheapBiomeFields).toEqual([
      "scale_envelope",
      "domain",
      "fidelity",
      "semantic_chunk",
      "claim_pressure",
    ]);
    expect(search.stageTrace.progressiveCongruenceFilters).toEqual([
      "unit_dimensional_compatibility",
      "symbol_equation_family_compatibility",
      "shared_first_principles_ancestry",
      "allowed_typed_edge_semantics",
      "observable_artifact_requirements",
      "source_reference_falsifier_coverage",
    ]);
    expect(search.stageTrace.contextReuse).toMatchObject({
      strategy: "shared_biome_layout_and_connection_trace_cache",
      amortizedAcrossCandidatePairs: true,
    });
    expect(search.stageTrace.stages.map((stage) => stage.stageName)).toEqual([
      "cheap_biome_field_scan",
      "unit_dimensional_filter",
      "symbol_equation_family_filter",
      "first_principles_ancestry_filter",
      "typed_edge_semantics_filter",
      "observable_artifact_filter",
      "source_reference_falsifier_filter",
      "exact_contract_verification_queue",
    ]);
    expect(search.stageTrace.stages.every((stage) => stage.deterministic === true)).toBe(true);
    expect(search.optimization.objectiveMetric).toBe("verified_frontier_yield_per_budget");
    expect(search.optimization.rawCandidateCountOptimized).toBe(false);
    expect(search.optimization.candidateBudget.requestedLimit).toBe(6);
    expect(search.optimization.candidateBudget.emittedCandidateCount).toBe(search.candidates.length);
    expect(search.optimization.records.length).toBeGreaterThan(0);
    expect(search.optimization.records.every((record) => record.comparisonBasis === "within_replayed_candidate_set")).toBe(true);
    expect(
      search.optimization.records.every((record) =>
        search.candidates.some((candidate) => candidate.candidateId === record.candidateId),
      ),
    ).toBe(true);
    expect(search.interpretation.proceduralSearchPrecedentOnly).toBe(true);
    expect(search.interpretation.noTheoryValidation).toBe(true);
    expect(search.interpretation.noAutomaticEdgePromotion).toBe(true);
    expect(search.methodAnchors.map((anchor) => anchor.id)).toEqual([
      "cubiomes",
      "cubiomes_biome_noise",
      "cubiomes_generator_api",
      "minecraft_caves_cliffs_ii",
      "red_blob_terrain_noise",
    ]);
    expect(search.methodAnchors.map((anchor) => anchor.url)).toEqual([
      "https://github.com/Cubitect/cubiomes",
      "https://github.com/Cubitect/cubiomes/blob/master/biomenoise.h",
      "https://github.com/Cubitect/cubiomes/blob/master/generator.h",
      "https://www.minecraft.net/en-us/article/caves---cliffs-part-ii-the-features",
      "https://www.redblobgames.com/maps/terrain-from-noise/",
    ]);
  });

  it("rejects result envelopes that claim truth probability", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "source residual",
      searchSeed: "frontier-test-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 3,
    });
    const unsafe = {
      ...search,
      interpretation: {
        ...search.interpretation,
        probabilitiesArePlacementUncertaintyOnly: false,
      },
    };

    expect(validateTheoryFrontierSearchV1(unsafe)).toContain(
      "interpretation.probabilitiesArePlacementUncertaintyOnly must be true",
    );
  });

  it("rejects scholarly lookup requests that mutate or permit promotion", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "source residual",
      searchSeed: "frontier-test-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 3,
    });
    const unsafe = {
      ...search,
      scholarlyLookupRequests: [
        {
          ...search.scholarlyLookupRequests[0],
          mutating: true,
          noAutoPromoteLiterature: false,
        },
      ],
    };

    expect(validateTheoryFrontierSearchV1(unsafe)).toEqual(
      expect.arrayContaining([
        "scholarlyLookupRequests[0].mutating must be false",
        "scholarlyLookupRequests[0].noAutoPromoteLiterature must be true",
      ]),
    );
  });

  it("rejects frontier searches that omit required method-anchor citations", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const search = buildTheoryFrontierSearch({
      graph,
      query: "source residual",
      searchSeed: "frontier-test-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 3,
    });
    const unsafe = {
      ...search,
      methodAnchors: search.methodAnchors.filter((anchor) => anchor.id !== "cubiomes_generator_api"),
    };

    expect(validateTheoryFrontierSearchV1(unsafe)).toEqual(
      expect.arrayContaining([
        "methodAnchors must contain the required procedural-search anchors",
        "methodAnchors must include cubiomes_generator_api",
      ]),
    );
  });
});
