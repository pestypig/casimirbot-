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
    expect(curvature.badges.filter((badge) => badge.calculatorPayloads.length > 0).length).toBeGreaterThanOrEqual(8);
    expect(graph.badges.some((badge) => badge.id === "collapse.benchmark.hazard_probability")).toBe(true);
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
    expect(JSON.stringify(curvature)).not.toMatch(
      /curvature-gravity certified|objective-collapse proof|faster-than-light|confirmed physical mechanism|validated propulsion|CL4 support/i,
    );
  });
});
