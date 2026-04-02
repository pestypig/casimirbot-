import { describe, expect, it } from "vitest";
import {
  buildRelativisticMapProjection,
  type RelativisticMapVec3,
} from "../shared/relativistic-map-projections";

const SPEED_OF_LIGHT_MPS = 299_792_458;

const directionUnit = (vec: RelativisticMapVec3): RelativisticMapVec3 => {
  const magnitude = Math.hypot(vec[0], vec[1], vec[2]);
  if (!(magnitude > 0)) return [0, 0, 0];
  return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
};

describe("relativistic map projections", () => {
  it("preserves direction and remaps only radius for the Sun-centered accessibility map", () => {
    const acceleration = 9.80665;
    const result = buildRelativisticMapProjection({
      projectionKind: "sun_centered_accessibility",
      sourceModel: "flat_sr_flip_burn_control",
      catalog: [{ id: "tau-ceti", position_m: [3, 4, 0] }],
      control: {
        properAcceleration_m_s2: acceleration,
      },
    });

    expect(result.status).toBe("computed");
    expect(result.semantics).toBe("outer_reference_only");
    expect(result.observerFamily).toBe("grid_static");

    if (result.status !== "computed" || result.projectionKind !== "sun_centered_accessibility") return;
    const [entry] = result.entries;
    const expectedDirection = directionUnit([3, 4, 0]);
    const expectedTau =
      (2 * SPEED_OF_LIGHT_MPS) / acceleration *
      Math.acosh(1 + (acceleration * 5) / (2 * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS));

    expect(entry.inputDirectionUnit[0]).toBeCloseTo(expectedDirection[0], 10);
    expect(entry.inputDirectionUnit[1]).toBeCloseTo(expectedDirection[1], 10);
    expect(entry.mappedRadiusProperTime_s).toBeCloseTo(expectedTau, 12);

    const outputDirection = directionUnit(entry.outputPosition_m);
    expect(outputDirection[0]).toBeCloseTo(expectedDirection[0], 10);
    expect(outputDirection[1]).toBeCloseTo(expectedDirection[1], 10);
  });

  it("contracts only the component parallel to motion for the instantaneous ship-view map", () => {
    const acceleration = 10;
    const gamma = 2;
    const properTime = (Math.acosh(gamma) * SPEED_OF_LIGHT_MPS) / acceleration;
    const result = buildRelativisticMapProjection({
      projectionKind: "instantaneous_ship_view",
      sourceModel: "flat_sr_flip_burn_control",
      catalog: [{ id: "demo", position_m: [10, 5, 0] }],
      control: {
        properAcceleration_m_s2: acceleration,
        currentProperTime_s: properTime,
        direction: [1, 0, 0],
        shipPosition_m: [0, 0, 0],
      },
    });

    expect(result.status).toBe("computed");
    expect(result.semantics).toBe("instantaneous_comoving_projection");
    expect(result.observerFamily).toBe("ship_comoving");

    if (result.status !== "computed" || result.projectionKind !== "instantaneous_ship_view") return;
    const [entry] = result.entries;
    expect(entry.shipFramePosition_m[0]).toBeCloseTo(5, 8);
    expect(entry.shipFramePosition_m[1]).toBeCloseTo(5, 8);
    expect(entry.shipFramePosition_m[2]).toBeCloseTo(0, 8);
    expect(entry.inputParallel_m).toBeCloseTo(10, 8);
    expect(entry.outputParallel_m).toBeCloseTo(5, 8);
    expect(entry.perpendicularDistance_m).toBeCloseTo(5, 8);
  });

  it("fails closed for warp-derived projections until a warp worldline contract exists", () => {
    const result = buildRelativisticMapProjection({
      projectionKind: "sun_centered_accessibility",
      sourceModel: "warp_worldline_route_time",
      catalog: [{ id: "alpha-centauri", position_m: [1, 0, 0] }],
    });

    expect(result.status).toBe("unavailable");
    expect(result.fail_id).toBe("RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED");
    expect(result.claim_tier).toBe("diagnostic");
    expect(result.certifying).toBe(false);
  });
});
