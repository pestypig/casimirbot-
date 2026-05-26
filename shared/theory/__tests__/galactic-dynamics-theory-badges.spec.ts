import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildGalacticDynamicsTheoryBadgesV1 } from "../galactic-dynamics-theory-badges";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";

describe("galactic dynamics theory badges", () => {
  it("adds a loadable galactic null-model branch to the main graph", () => {
    const galactic = buildGalacticDynamicsTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();

    expect(galactic.badges.some((badge) => badge.id === "galactic.rotation.velocity_residual")).toBe(true);
    expect(galactic.badges.some((badge) => badge.id === "galactic.claim_boundary.null_model_only")).toBe(true);
    expect(galactic.badges.filter((badge) => badge.calculatorPayloads.length > 0).length).toBeGreaterThanOrEqual(7);
    expect(graph.badges.some((badge) => badge.id === "galactic.map.distance_3d")).toBe(true);
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(JSON.stringify(galactic)).not.toMatch(/physics winner selected|local Hubble-flow proof|ER=EPR proof|CL4 support/i);
  });
});
