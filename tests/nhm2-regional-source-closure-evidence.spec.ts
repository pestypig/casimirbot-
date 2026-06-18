import { describe, expect, it } from "vitest";

import {
  buildNhm2RegionalSourceClosureEvidenceArtifact,
  isNhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const fullTensor = (base: number): Nhm2RegionalTensor => ({
  T00: -base,
  T01: 0,
  T02: 0,
  T03: 0,
  T10: 0,
  T11: base,
  T12: 0,
  T13: 0,
  T20: 0,
  T21: 0,
  T22: base,
  T23: 0,
  T30: 0,
  T31: 0,
  T32: 0,
  T33: base,
});

const region = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  overrides: Partial<Nhm2RegionalSourceClosureEvidenceRegion> = {},
): Nhm2RegionalSourceClosureEvidenceRegion => ({
  regionId,
  status: "pass",
  comparisonBasisStatus: "same_basis",
  metricRequired: {
    tensorRef: `metric.${regionId}`,
    tensorAuthorityMode: "full_tensor",
    tensor: fullTensor(10),
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 10,
  },
  tileEffectiveCounterpart: {
    tensorRef: `tile.${regionId}`,
    tensorAuthorityMode: "full_tensor",
    tensor: fullTensor(10),
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 10,
    comparisonRole: "tile_effective_counterpart",
  },
  residuals: {
    componentResiduals: {
      T00: {
        metricRequired: -10,
        tileEffectiveCounterpart: -10,
        absResidual: 0,
        relResidual: 0,
      },
    },
    relLInf: 0,
    absLInf: 0,
    toleranceRelLInf: 0.1,
    pass: true,
  },
  blockers: [],
  ...overrides,
});

const artifact = (
  regions: Nhm2RegionalSourceClosureEvidenceRegion[],
  profile = "stage1_centerline_alpha_0p995_v1",
  expected = "stage1_centerline_alpha_0p995_v1",
) =>
  buildNhm2RegionalSourceClosureEvidenceArtifact({
    generatedAt: "2026-05-04T00:00:00.000Z",
    runId: "run-1",
    selectedProfileId: profile,
    expectedProfileId: expected,
    laneId: "nhm2_shift_lapse",
    regions,
    literatureRefs: ["natario_2001_zero_expansion"],
  });

describe("nhm2 regional source-closure evidence contract", () => {
  it("accepts complete same-basis full-tensor regional evidence for all required regions", () => {
    const evidence = artifact([
      region("global"),
      region("hull"),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(evidence.overallState).toBe("pass");
    expect(evidence.claimEffect).toBe("reduced_order_candidate_blocker_retired");
    expect(isNhm2RegionalSourceClosureEvidenceArtifact(evidence)).toBe(true);
  });

  it("rejects validation-pass state when wall is missing", () => {
    const evidence = artifact([region("global"), region("hull"), region("exterior_shell")]);

    expect(evidence.overallState).toBe("fail");
    expect(evidence.missingRequiredRegions).toContain("wall");
    expect(isNhm2RegionalSourceClosureEvidenceArtifact({
      ...evidence,
      overallState: "pass",
      missingRequiredRegions: ["wall"],
    })).toBe(false);
  });

  it("rejects gr_matter_channel_observation as tile-effective counterpart", () => {
    const evidence = artifact([
      region("global"),
      region("hull", {
        tileEffectiveCounterpart: {
          ...region("hull").tileEffectiveCounterpart,
          comparisonRole: "gr_matter_channel_observation",
        },
      }),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(evidence.overallState).toBe("review");
    expect(evidence.reasonCodes).toContain(
      "hull:tile_role_not_counterpart:gr_matter_channel_observation",
    );
  });

  it("rejects chart mismatch under same-basis status", () => {
    const evidence = artifact([
      region("global"),
      region("hull", {
        tileEffectiveCounterpart: {
          ...region("hull").tileEffectiveCounterpart,
          chartRef: "other_chart",
        },
      }),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(evidence.reasonCodes).toContain("hull:chart_mismatch");
    expect(isNhm2RegionalSourceClosureEvidenceArtifact(evidence)).toBe(false);
  });

  it("rejects same-basis comparison when finite sample counts differ", () => {
    const evidence = artifact([
      region("global", {
        metricRequired: {
          ...region("global").metricRequired,
          sampleCount: 2_097_152,
        },
        tileEffectiveCounterpart: {
          ...region("global").tileEffectiveCounterpart,
          sampleCount: 1,
        },
      }),
      region("hull"),
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(evidence.overallState).toBe("review");
    expect(evidence.reasonCodes).toContain("global:sample_count_mismatch");
    expect(evidence.reasonCodes).toContain("global:same_basis_metadata_mismatch");
    expect(isNhm2RegionalSourceClosureEvidenceArtifact(evidence)).toBe(false);
  });

  it("rejects profile mismatch", () => {
    const evidence = artifact(
      [region("global"), region("hull"), region("wall"), region("exterior_shell")],
      "stage1_centerline_alpha_0p7000_v1",
    );

    expect(evidence.profileMatch).toBe(false);
    expect(isNhm2RegionalSourceClosureEvidenceArtifact(evidence)).toBe(false);
  });

  it("marks diagonal proxy authority as review", () => {
    const diagonalRegion = region("hull", {
      tileEffectiveCounterpart: {
        ...region("hull").tileEffectiveCounterpart,
        tensorAuthorityMode: "proxy",
      },
    });
    const evidence = artifact([
      region("global"),
      diagonalRegion,
      region("wall"),
      region("exterior_shell"),
    ]);

    expect(evidence.overallState).toBe("review");
    expect(evidence.claimEffect).toBe("diagnostic_only");
    expect(evidence.reasonCodes).toContain("hull:proxy_tensor_authority");
  });

  it("preserves negative T00 values and signed residual inputs", () => {
    const evidence = artifact([
      region("global", {
        residuals: {
          componentResiduals: {
            T00: {
              metricRequired: -10,
              tileEffectiveCounterpart: -12,
              absResidual: 2,
              relResidual: 0.2,
            },
          },
          relLInf: 0.2,
          absLInf: 2,
          toleranceRelLInf: 0.1,
          pass: false,
        },
      }),
      region("hull"),
      region("wall"),
      region("exterior_shell"),
    ]);

    const residual = evidence.regions[0]?.residuals.componentResiduals.T00;
    expect(evidence.regions[0]?.metricRequired.tensor.T00).toBe(-10);
    expect(residual?.metricRequired).toBe(-10);
    expect(residual?.tileEffectiveCounterpart).toBe(-12);
    expect(evidence.reasonCodes).toContain("global:residual_exceeded");
  });
});
