import { describe, expect, it } from "vitest";
import { GALACTIC_DYNAMICS_GROUPS, getGalacticDynamicsGroup } from "../galactic-dynamics-map";

describe("galactic dynamics map", () => {
  it("defines groups with scalar payload references and claim boundaries", () => {
    expect(GALACTIC_DYNAMICS_GROUPS.map((group) => group.id)).toEqual([
      "galactic.map.geometry",
      "galactic.map.velocity",
      "galactic.rotation.controls",
      "galactic.accordion.null_model",
      "galactic.claim_boundary",
    ]);

    const geometry = getGalacticDynamicsGroup("galactic.map.geometry");
    expect(geometry?.calculatorPayloadRefs).toContainEqual({
      badgeId: "galactic.map.distance_3d",
      payloadId: "galactic_distance_3d_payload",
    });
    expect(geometry?.claimBoundaryBadgeIds).toContain("galactic.claim_boundary.null_model_only");
    expect(geometry?.objectBindings[0]?.id).toBe("sample-local-stream");
  });
});
