import { describe, expect, it } from "vitest";
import { buildObservableUniverseAccordionProjection } from "../shared/observable-universe-accordion-projections";
import { makeWarpCatalogEtaProjectionFixture, makeWarpMissionTimeEstimatorFixture } from "./helpers/warp-worldline-fixture";

const directionUnit = (vec: [number, number, number]): [number, number, number] => {
  const magnitude = Math.hypot(vec[0], vec[1], vec[2]);
  if (!(magnitude > 0)) return [0, 0, 0];
  return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
};

describe("observable universe accordion projections", () => {
  it("keeps raw-distance output on the original direction ray", () => {
    const result = buildObservableUniverseAccordionProjection({
      projectionKind: "observable_universe_accordion",
      accordionMode: "raw_distance",
      catalog: [{ id: "demo", position_m: [3, 4, 0] }],
    });

    expect(result.status).toBe("computed");
    expect(result.provenance_class).toBe("inferred");
    if (result.status !== "computed") return;
    const [entry] = result.entries;
    expect(entry.mappedRadiusCt_m).toBeCloseTo(5, 12);
    expect(directionUnit(entry.outputPosition_m)[0]).toBeCloseTo(0.6, 12);
    expect(directionUnit(entry.outputPosition_m)[1]).toBeCloseTo(0.8, 12);
  });

  it("uses the flat-SR accessibility radius without changing the direction ray", () => {
    const result = buildObservableUniverseAccordionProjection({
      projectionKind: "observable_universe_accordion",
      accordionMode: "sr_accessibility",
      catalog: [{ id: "demo", position_m: [3, 4, 0] }],
      control: { properAcceleration_m_s2: 9.80665 },
    });

    expect(result.status).toBe("computed");
    expect(result.provenance_class).toBe("proxy");
    if (result.status !== "computed") return;
    const [entry] = result.entries;
    expect(entry.mappedRadius_s).not.toBeNull();
    expect(directionUnit(entry.outputPosition_m)[0]).toBeCloseTo(0.6, 12);
    expect(directionUnit(entry.outputPosition_m)[1]).toBeCloseTo(0.8, 12);
  });

  it("keeps nhm2 accessibility deferred even when only the mission-time estimator chain is present", () => {
    const result = buildObservableUniverseAccordionProjection({
      projectionKind: "observable_universe_accordion",
      accordionMode: "nhm2_accessibility",
      catalog: [{ id: "demo", position_m: [3, 4, 0] }],
      warpMissionTimeEstimator: makeWarpMissionTimeEstimatorFixture(),
    });

    expect(result.status).toBe("unavailable");
    expect(result.fail_id).toBe("OBSERVABLE_UNIVERSE_ACCORDION_NHM2_DEFERRED");
    expect(result.provenance_class).toBe("deferred");
  });

  it("accepts nhm2 accessibility only from the explicit catalog ETA projection contract", () => {
    const result = buildObservableUniverseAccordionProjection({
      projectionKind: "observable_universe_accordion",
      accordionMode: "nhm2_accessibility",
      catalog: [{ id: "demo", position_m: [3, 4, 0] }],
      warpCatalogEtaProjection: makeWarpCatalogEtaProjectionFixture(),
    });

    expect(result.status).toBe("computed");
    expect(result.provenance_class).toBe("solve_backed");
    if (result.status !== "computed") return;
    const [entry] = result.entries;
    expect(entry.mappedRadius_s).toBeCloseTo(2, 12);
    expect(entry.mappedRadiusCt_m).toBeCloseTo(599584916, 3);
    expect(result.contract_badge).toBe("warp_catalog_eta_projection/v1");
    expect(result.metadata?.defaultOperatingProfileId).toBe(
      "stage1_centerline_alpha_0p8200_v1",
    );
    expect(result.metadata?.supportedBandFloorProfileId).toBe(
      "stage1_centerline_alpha_0p8000_v1",
    );
    expect(result.metadata?.evidenceFloorProfileId).toBe(
      "stage1_centerline_alpha_0p7700_v1",
    );
    expect(result.metadata?.supportBufferDeltaCenterlineAlpha).toBeCloseTo(0.03, 12);
  });
});
