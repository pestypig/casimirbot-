import { describe, expect, it } from "vitest";
import {
  buildProbabilityTerrainV1,
  isProbabilityTerrainV1,
  validateProbabilityTerrainV1,
} from "../../probability-terrain";

describe("probability terrain v1", () => {
  it("normalizes candidate weights into placement probability terrain", () => {
    const terrain = buildProbabilityTerrainV1({
      graphKind: "generic_graph",
      candidates: [
        {
          id: "a",
          weight: 3,
          renderChunkId: "render:left",
          semanticChunkId: "semantic:alpha",
        },
        {
          id: "b",
          weight: 1,
          renderChunkId: "render:right",
          semanticChunkId: "semantic:beta",
        },
      ],
    });

    expect(validateProbabilityTerrainV1(terrain)).toEqual([]);
    expect(isProbabilityTerrainV1(terrain)).toBe(true);
    expect(terrain.candidateProbabilityById.a).toBe(0.75);
    expect(terrain.renderChunkProbabilityById["render:left"]).toBe(0.75);
    expect(terrain.semanticChunkProbabilityById["semantic:beta"]).toBe(0.25);
    expect(terrain.normalizedMass).toBe(1);
    expect(terrain.priorEntropyBits).toBe(1);
    expect(terrain.posteriorEntropyBits).toBeGreaterThan(0);
    expect(terrain.informationGainBits).toBeGreaterThan(0);
    expect(terrain.dominantCandidateId).toBe("a");
    expect(terrain.interpretation).toBe("placement_probability_not_truth_claim");
    expect(terrain.representedProbabilityMass).toBe(1);
    expect(terrain.outOfGraphProbability).toBe(0);
    expect(terrain.openWorldCandidateProbabilityById).toEqual({ a: 0.75, b: 0.25 });
    expect(terrain.openWorldInterpretation).toBe("includes_out_of_graph_hypothesis_not_truth_claim");
  });

  it("preserves explicit out-of-graph mass instead of forcing a weak singleton to certainty", () => {
    const terrain = buildProbabilityTerrainV1({
      graphKind: "theory_badge_graph",
      candidates: [{ id: "weak", weight: 1 }],
      coverageProbability: 0.35,
      coverageBasis: "absolute_match_score_heuristic",
    });

    expect(validateProbabilityTerrainV1(terrain)).toEqual([]);
    expect(terrain.candidateProbabilityById).toEqual({ weak: 1 });
    expect(terrain.openWorldCandidateProbabilityById).toEqual({ weak: 0.35 });
    expect(terrain.representedProbabilityMass).toBe(0.35);
    expect(terrain.outOfGraphProbability).toBe(0.65);
    expect(terrain.openWorldEntropyBits).toBeGreaterThan(0);
    expect(terrain.openWorldPlacementCertainty).toBeLessThan(1);
  });

  it("represents an empty candidate set as entirely out of graph", () => {
    const terrain = buildProbabilityTerrainV1({ graphKind: "generic_graph", candidates: [] });

    expect(validateProbabilityTerrainV1(terrain)).toEqual([]);
    expect(terrain.representedProbabilityMass).toBe(0);
    expect(terrain.outOfGraphProbability).toBe(1);
    expect(terrain.openWorldCandidateProbabilityById).toEqual({});
    expect(terrain.coverageBasis).toBe("no_candidates");
  });

  it("rejects invalid probabilities and graph kinds", () => {
    const terrain = buildProbabilityTerrainV1({ graphKind: "generic_graph", candidates: [] });

    expect(
      validateProbabilityTerrainV1({
        ...terrain,
        graphKind: "bad_graph",
        candidateProbabilityById: { a: 1.4 },
      }),
    ).toEqual(expect.arrayContaining(["graphKind is invalid", "candidateProbabilityById.a must be between 0 and 1"]));
  });
});
