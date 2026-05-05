import { describe, expect, it } from "vitest";

import {
  buildNhm2TileCounterpartConservationArtifact,
  isNhm2TileCounterpartConservationArtifact,
} from "../shared/contracts/nhm2-tile-counterpart-conservation.v1";

const profile = "stage1_centerline_alpha_0p995_v1";
const region = (regionId: "global" | "hull" | "wall" | "exterior_shell", overrides = {}) => ({
  regionId,
  status: "pass" as const,
  divTResidualLInf: 0.01,
  continuityResidualLInf: 0.01,
  momentumResidualLInf: 0.01,
  toleranceLInf: 0.1,
  sampleCount: 10,
  blockers: [],
  ...overrides,
});

describe("nhm2 tile counterpart conservation contract", () => {
  it("accepts pass-level conservation diagnostics", () => {
    const artifact = buildNhm2TileCounterpartConservationArtifact({
      runId: "run-1",
      selectedProfileId: profile,
      expectedProfileId: profile,
      laneId: "nhm2_shift_lapse",
      chartRef: "comoving_cartesian",
      derivativeStencil: "central_difference_v1",
      unitsRef: "J/m^3/m",
      regions: [region("global"), region("hull"), region("wall"), region("exterior_shell")],
    });
    expect(artifact.overallState).toBe("pass");
    expect(artifact.promotionAllowed).toBe(false);
    expect(isNhm2TileCounterpartConservationArtifact(artifact)).toBe(true);
  });

  it("marks missing residuals as review", () => {
    const artifact = buildNhm2TileCounterpartConservationArtifact({
      runId: "run-1",
      selectedProfileId: profile,
      expectedProfileId: profile,
      laneId: "nhm2_shift_lapse",
      chartRef: "comoving_cartesian",
      derivativeStencil: "not_computed",
      unitsRef: "J/m^3/m",
      regions: [region("global", { divTResidualLInf: null }), region("hull"), region("wall"), region("exterior_shell")],
    });
    expect(artifact.overallState).toBe("review");
    expect(artifact.reasonCodes).toContain("global:divT_residual_missing");
  });

  it("fails residuals above tolerance", () => {
    const artifact = buildNhm2TileCounterpartConservationArtifact({
      runId: "run-1",
      selectedProfileId: profile,
      expectedProfileId: profile,
      laneId: "nhm2_shift_lapse",
      chartRef: "comoving_cartesian",
      derivativeStencil: "central_difference_v1",
      unitsRef: "J/m^3/m",
      regions: [region("global"), region("hull", { divTResidualLInf: 2 }), region("wall"), region("exterior_shell")],
    });
    expect(artifact.overallState).toBe("fail");
    expect(artifact.reasonCodes).toContain("hull:conservation_residual_exceeded");
  });
});
