import { describe, expect, it } from "vitest";

import {
  buildNhm2ShiftVsLapseDecompositionArtifact,
  isNhm2ShiftVsLapseDecompositionArtifact,
  NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID,
  NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION,
} from "../shared/contracts/nhm2-shift-vs-lapse-decomposition.v1";

describe("nhm2 shift-vs-lapse decomposition artifact", () => {
  it("represents a matched selected-profile decomposition honestly", () => {
    const artifact = buildNhm2ShiftVsLapseDecompositionArtifact({
      familyId: "nhm2_shift_lapse",
      shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
      sourceMissionTimeComparisonArtifactPath:
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json",
      sourceWorldlineArtifactPath:
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json",
      centerlineAlpha: 0.995,
      centerlineDtauDt: 0.995,
      interpretationStatus: "bounded_relativistic_differential_detected",
      warpCoordinateTimeSeconds: 100,
      warpProperTimeSeconds: 99.5,
      classicalReferenceTimeSeconds: 100,
      properMinusCoordinateSeconds: -0.5,
      properVsCoordinateRatio: 0.995,
      coordinateMinusClassicalSeconds: 0,
      residualToleranceSeconds: 1e-9,
    });

    expect(artifact.artifactId).toBe(
      NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID,
    );
    expect(artifact.schemaVersion).toBe(
      NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION,
    );
    expect(artifact.status).toBe("pass");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toEqual([]);
    expect(
      artifact.decomposition.fixedShiftFamilyTransportContributionSeconds,
    ).toBe(100);
    expect(
      artifact.decomposition.lapseProfileClockRateContributionSeconds,
    ).toBeCloseTo(-0.5);
    expect(
      artifact.decomposition.residualUnexplainedContributionSeconds,
    ).toBeCloseTo(0);
    expect(artifact.decomposition.lapseDialTrackedFraction).toBeCloseTo(1);
    expect(isNhm2ShiftVsLapseDecompositionArtifact(artifact)).toBe(true);
  });

  it("labels the decomposition as review when the lapse dial leaves a residual", () => {
    const artifact = buildNhm2ShiftVsLapseDecompositionArtifact({
      shiftLapseProfileId: "stage1_centerline_alpha_0p9900_v1",
      centerlineDtauDt: 0.99,
      warpCoordinateTimeSeconds: 100,
      warpProperTimeSeconds: 98.5,
      classicalReferenceTimeSeconds: 100,
      properMinusCoordinateSeconds: -1.5,
      coordinateMinusClassicalSeconds: 0,
      residualToleranceSeconds: 0.1,
    });

    expect(artifact.status).toBe("review");
    expect(artifact.completeness).toBe("complete");
    expect(artifact.reasonCodes).toContain("residual_exceeds_tolerance");
    expect(
      artifact.decomposition.lapseProfileClockRateContributionSeconds,
    ).toBeCloseTo(-1);
    expect(
      artifact.decomposition.residualUnexplainedContributionSeconds,
    ).toBeCloseTo(-0.5);
  });

  it("marks missing timing or lapse inputs as unavailable instead of synthetic success", () => {
    const artifact = buildNhm2ShiftVsLapseDecompositionArtifact({
      shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
      warpCoordinateTimeSeconds: 100,
      warpProperTimeSeconds: null,
      classicalReferenceTimeSeconds: 100,
      centerlineDtauDt: null,
    });

    expect(artifact.status).toBe("unavailable");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.reasonCodes).toEqual(
      expect.arrayContaining(["proper_time_missing", "lapse_dial_missing"]),
    );
    expect(
      artifact.decomposition.lapseProfileClockRateContributionSeconds,
    ).toBeNull();
    expect(
      artifact.decomposition.residualUnexplainedContributionSeconds,
    ).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(
      isNhm2ShiftVsLapseDecompositionArtifact({
        artifactId: NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_ARTIFACT_ID,
        schemaVersion: NHM2_SHIFT_VS_LAPSE_DECOMPOSITION_SCHEMA_VERSION,
        status: "pass",
      }),
    ).toBe(false);
  });
});
