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
