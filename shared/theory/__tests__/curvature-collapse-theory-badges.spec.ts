import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildCurvatureCollapseTheoryBadgesV1 } from "../curvature-collapse-theory-badges";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";

describe("curvature/collapse theory badges", () => {
  it("adds a loadable benchmark branch to the main graph", () => {
    const curvature = buildCurvatureCollapseTheoryBadgesV1();
    const graph = buildNhm2TheoryBadgeGraphV1();

    expect(curvature.badges.some((badge) => badge.id === "curvature.proxy.body_density")).toBe(true);
    expect(curvature.badges.some((badge) => badge.id === "curvature.claim_boundary.benchmark_only")).toBe(true);
    expect(curvature.badges.some((badge) => badge.id === "collapse.objective.dp_timescale")).toBe(true);
    expect(curvature.badges.some((badge) => badge.id === "collapse.objective.dp_gravitational_self_energy")).toBe(true);
    expect(curvature.badges.filter((badge) => badge.calculatorPayloads.length > 0).length).toBeGreaterThanOrEqual(8);
    expect(graph.badges.some((badge) => badge.id === "collapse.benchmark.hazard_probability")).toBe(true);
    expect(graph.badges.some((badge) => badge.id === "collapse.objective.dp_rate")).toBe(true);
    expect(
      graph.edges.some(
        (edge) =>
          edge.from === "collapse.objective.dp_gravitational_self_energy" &&
          edge.to === "collapse.objective.dp_timescale",
      ),
    ).toBe(true);
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(JSON.stringify(curvature)).not.toMatch(
      /curvature-gravity certified|objective-collapse proof|objective collapse proof|faster-than-light|confirmed physical mechanism|validated propulsion|CL4 support/i,
    );
  });

  it("keeps DP self-energy runtime-owned while exposing only scalar cuts to the calculator", () => {
    const curvature = buildCurvatureCollapseTheoryBadgesV1();
    const selfEnergy = curvature.badges.find((badge) => badge.id === "collapse.objective.dp_gravitational_self_energy");
    const timescale = curvature.badges.find((badge) => badge.id === "collapse.objective.dp_timescale");
    const bounds = curvature.badges.find((badge) => badge.id === "collapse.objective.experimental_bounds");

    expect(selfEnergy?.calculatorPayloads).toEqual([]);
    expect(selfEnergy?.equations[0]?.operatorKind).toBe("region_aggregate");
    expect(timescale?.calculatorPayloads.map((payload) => payload.targetVariable)).toContain("tau_DP_s");
    expect(bounds?.claimBoundary?.diagnosticOnly).toBe(true);
    expect(bounds?.claimBoundary?.physicalMechanismClaimAllowed).toBe(false);
  });
});
