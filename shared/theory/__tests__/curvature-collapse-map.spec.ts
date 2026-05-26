import { describe, expect, it } from "vitest";
import { CURVATURE_COLLAPSE_GROUPS, getCurvatureCollapseGroup } from "../curvature-collapse-map";

describe("curvature/collapse map", () => {
  it("defines compact groups for the atlas lens", () => {
    expect(CURVATURE_COLLAPSE_GROUPS.map((group) => group.id)).toEqual([
      "curvature.proxy.kappa",
      "collapse.benchmark.cadence",
      "curvature.uncertainty.margin",
      "collapse.runtime.benchmark",
      "curvature.claim_boundary",
    ]);

    const proxy = getCurvatureCollapseGroup("curvature.proxy.kappa");
    expect(proxy?.calculatorPayloadRefs.map((ref) => ref.payloadId)).toContain("curvature_kappa_body_payload");
    expect(proxy?.claimBoundaryBadgeIds).toContain("curvature.claim_boundary.benchmark_only");
  });
});
