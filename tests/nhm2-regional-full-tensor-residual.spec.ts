import { describe, expect, it } from "vitest";

import {
  buildNhm2RegionalFullTensorResidual,
  isNhm2RegionalFullTensorResidual,
} from "../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import {
  buildNhm2RegionalSourceClosureEvidenceArtifact,
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalTensor,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const profile = "stage1_centerline_alpha_0p995_v1";

const tensor = (value: number): Nhm2RegionalTensor => ({
  T00: -value,
  T01: 0,
  T02: 0,
  T03: 0,
  T11: value * 0.02,
  T12: 0,
  T13: 0,
  T22: value * 0.02,
  T23: 0,
  T33: value * 0.02,
});

const region = (
  regionId: Nhm2RegionalSourceClosureEvidenceRegion["regionId"],
  overrides: Partial<Nhm2RegionalSourceClosureEvidenceRegion> = {},
): Nhm2RegionalSourceClosureEvidenceRegion => ({
  regionId,
  status: "pass",
  comparisonBasisStatus: "same_basis",
  metricRequired: {
    tensorRef: `metric:${regionId}`,
    tensorAuthorityMode: "symmetric_full_tensor",
    tensor: tensor(10),
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 8,
  },
  tileEffectiveCounterpart: {
    tensorRef: `tile:${regionId}`,
    tensorAuthorityMode: "symmetric_full_tensor",
    tensor: tensor(10),
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 8,
    comparisonRole: "tile_effective_counterpart",
  },
  residuals: {
    componentResiduals: {},
    relLInf: 0,
    absLInf: 0,
    toleranceRelLInf: 0.1,
    pass: true,
  },
  blockers: [],
  ...overrides,
});

const evidence = (
  overrides: Partial<Record<Nhm2RegionalSourceClosureEvidenceRegion["regionId"], Partial<Nhm2RegionalSourceClosureEvidenceRegion>>> = {},
) =>
  buildNhm2RegionalSourceClosureEvidenceArtifact({
    generatedAt: "2026-06-13T00:00:00.000Z",
    runId: "full-tensor-residual-test",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    atlasRef: "atlas.json",
    atlasHash: "atlas-hash",
    regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
      region(regionId, overrides[regionId]),
    ),
    literatureRefs: [],
  });

describe("nhm2_regional_full_tensor_residual/v1", () => {
  it("refuses diagonal-only source tensors instead of zero-filling missing components", () => {
    const artifact = buildNhm2RegionalFullTensorResidual({
      regionalSourceClosureEvidence: evidence({
        wall: {
          tileEffectiveCounterpart: {
            tensorRef: "tile:wall",
            tensorAuthorityMode: "diagonal_reduced_order",
            tensor: { T00: -10, T11: 0.2, T22: 0.2, T33: 0.2 },
            chartRef: "comoving_cartesian",
            unitsRef: "J/m^3",
            aggregationMode: "mean",
            normalizationBasis: "sample_count",
            sampleCount: 8,
            comparisonRole: "tile_effective_counterpart",
          },
        },
      }),
    });
    const wall = artifact.regions.find((entry) => entry.regionId === "wall");

    expect(wall?.missingTileComponentIds).toContain("T01");
    expect(wall?.missingTileComponentIds).toContain("T12");
    expect(wall?.blockers).toContain("tile_full_tensor_authority_missing");
    expect(artifact.summary.allRequiredComponentsPresent).toBe(false);
    expect(artifact.summary.fullTensorResidualsPass).toBe(false);
    expect(isNhm2RegionalFullTensorResidual(artifact)).toBe(true);
  });

  it("fails stale atlas hashes even when residual values are aligned", () => {
    const artifact = buildNhm2RegionalFullTensorResidual({
      regionalSourceClosureEvidence: evidence(),
      expectedAtlasHash: "stale-atlas-hash",
    });

    expect(artifact.summary.anyAtlasMismatch).toBe(true);
    expect(artifact.summary.fullTensorResidualsPass).toBe(false);
    expect(artifact.summary.firstBlocker).toContain("atlas_hash_mismatch");
  });

  it("does not let a global pass hide a wall full-tensor residual failure", () => {
    const wallTensor = tensor(10);
    wallTensor.T12 = 4;
    const artifact = buildNhm2RegionalFullTensorResidual({
      regionalSourceClosureEvidence: evidence({
        wall: {
          tileEffectiveCounterpart: {
            ...region("wall").tileEffectiveCounterpart,
            tensor: wallTensor,
          },
        },
      }),
    });

    expect(artifact.regions.find((entry) => entry.regionId === "global")?.status).toBe("pass");
    expect(artifact.regions.find((entry) => entry.regionId === "wall")?.status).toBe("fail");
    expect(artifact.summary.worstRegionId).toBe("wall");
    expect(artifact.summary.worstComponentId).toBe("T12");
    expect(artifact.summary.fullTensorResidualsPass).toBe(false);
  });

  it("reports component first blockers without duplicating the region prefix", () => {
    const globalTensor = tensor(10);
    globalTensor.T00 = -20;
    const artifact = buildNhm2RegionalFullTensorResidual({
      regionalSourceClosureEvidence: evidence({
        global: {
          tileEffectiveCounterpart: {
            ...region("global").tileEffectiveCounterpart,
            tensor: globalTensor,
          },
          blockers: ["residual_exceeded"],
        },
      }),
    });

    expect(artifact.summary.firstBlocker).toBe("global:T00:full_tensor_residual_exceeded");
    expect(artifact.summary.firstBlocker).not.toContain("global:global:");
  });
});
