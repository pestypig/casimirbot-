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
    expect(search.interpretation.proceduralSearchPrecedentOnly).toBe(true);
    expect(search.interpretation.noTheoryValidation).toBe(true);
    expect(search.interpretation.noAutomaticEdgePromotion).toBe(true);
    expect(search.methodAnchors.map((anchor) => anchor.id)).toEqual(
      expect.arrayContaining(["cubiomes", "cubiomes_biome_noise", "red_blob_terrain_noise"]),
    );
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
});
