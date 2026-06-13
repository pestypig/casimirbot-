import { describe, expect, it } from "vitest";

import {
  buildNhm2CovariantConservationDiagnostic,
  isNhm2CovariantConservationDiagnostic,
} from "../shared/contracts/nhm2-covariant-conservation-diagnostic.v1";
import { buildNhm2RegionalSupportFunctionAtlas } from "../shared/contracts/nhm2-regional-support-function-atlas.v1";
import { buildNhm2TileCounterpartConservationArtifact } from "../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";

const profile = "stage1_centerline_alpha_0p995_v1";
const atlasHash = "atlas-covariant-test-hash";

const atlasRegion = (
  regionId:
    | "global"
    | "hull"
    | "wall"
    | "exterior_shell"
    | "hull_wall_transition"
    | "wall_exterior_transition",
) => ({
  regionId,
  semanticRole:
    regionId === "global"
      ? ("global_region" as const)
      : regionId.includes("transition")
        ? ("transition_region" as const)
        : ("closure_region" as const),
  maskRef: `mask.${regionId}`,
  supportFunctionRef: `support.${regionId}`,
  sampleCount: 8,
  supportStats: {
    minWeight: 0,
    maxWeight: 1,
    meanWeight: regionId.includes("transition") ? 0.5 : 1,
    nonzeroFraction: 1,
  },
  aggregationPolicy: {
    weighting: "support_weighted" as const,
    normalization: "sum_weights" as const,
    includeTransitionSamples: !regionId.includes("transition"),
  },
});

const atlas = (derivatives = false) =>
  buildNhm2RegionalSupportFunctionAtlas({
    runIdentity: {
      runId: "covariant-conservation-test",
      profileId: profile,
      chartId: "comoving_cartesian",
      metricRef: "metric.json",
      sourceModelRef: "source.json",
      gridRef: "grid.json",
      samplePlanRef: "sample-plan.json",
      createdAt: "2026-06-13T00:00:00.000Z",
    },
    basisAndUnits: {
      tensorBasis: "chart",
      coordinateSystem: "comoving_cartesian",
      lengthUnit: "m",
      energyDensityUnit: "J/m^3",
      stressEnergyConvention: "T_mu_nu_same_chart",
      signatureConvention: "(-,+,+,+)",
    },
    regions: {
      global: atlasRegion("global"),
      hull: atlasRegion("hull"),
      wall: atlasRegion("wall"),
      exterior_shell: atlasRegion("exterior_shell"),
      hull_wall_transition: atlasRegion("hull_wall_transition"),
      wall_exterior_transition: atlasRegion("wall_exterior_transition"),
    },
    transitionKernels: [
      {
        kernelId: "kernel:hull_wall",
        fromRegion: "hull",
        toRegion: "wall",
        supportRegion: "hull_wall_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: 1,
        derivativeTermsAvailable: derivatives,
        ...(derivatives ? { derivativeRef: "derivative:hull_wall" } : {}),
      },
      {
        kernelId: "kernel:wall_exterior",
        fromRegion: "wall",
        toRegion: "exterior_shell",
        supportRegion: "wall_exterior_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: 1,
        derivativeTermsAvailable: derivatives,
        ...(derivatives ? { derivativeRef: "derivative:wall_exterior" } : {}),
      },
    ],
    partitionOfUnity: {
      appliesTo: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
      sumWeightsMean: 1,
      sumWeightsMaxAbsError: 0,
      negativeWeightMin: 0,
      overlapPolicy: "partition_of_unity",
      status: "pass",
    },
    derivativeSupport: {
      partialMuWAvailable: derivatives,
      covariantDerivativeSupportAvailable: derivatives,
      derivativeBasis: "chart",
      transitionDerivativeTermsRequired: true,
      ...(derivatives ? { derivativeRef: "derivative:supports" } : {}),
    },
    provenance: {
      generatedFrom: ["reference.json"],
      inputHashes: { "reference.json": "hash" },
      atlasHash,
      targetEchoForbidden: true,
      targetDerivedFieldsUsed: false,
    },
  });

const conservationRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  transitionLayerResidualLInf = 0,
) => ({
  regionId,
  status: "pass" as const,
  divTResidualLInf: 0,
  continuityResidualLInf: 0,
  momentumResidualLInf: 0,
  toleranceLInf: 0.1,
  sampleCount: 8,
  transitionLayerResidualLInf,
  maxHotspotRef:
    transitionLayerResidualLInf > 0 ? `${regionId}:transition-hotspot` : null,
  blockers: [],
});

const conservation = (transitionLayerResidualLInf = 0) =>
  buildNhm2TileCounterpartConservationArtifact({
    runId: "covariant-conservation-test",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    chartRef: "comoving_cartesian",
    derivativeStencil: "regional_jump_linf_with_transition_kernel_v1",
    unitsRef: "dimensionless_normalized_tensor_jump",
    atlasRef: "atlas.json",
    atlasHash,
    regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) =>
      conservationRegion(regionId, regionId === "wall" ? transitionLayerResidualLInf : 0),
    ),
  });

describe("nhm2_covariant_conservation_diagnostic/v1", () => {
  it("fails when support-function derivative terms are missing", () => {
    const artifact = buildNhm2CovariantConservationDiagnostic({
      atlas: atlas(false),
      atlasRef: "atlas.json",
      reducedOrderConservation: conservation(),
      reducedOrderConservationRef: "conservation.json",
    });

    expect(artifact.summary.reducedOrderConservationPass).toBe(true);
    expect(artifact.summary.covariantConservationPass).toBe(false);
    expect(artifact.summary.firstBlocker).toContain("partial_mu_support_derivatives_missing");
    expect(artifact.transitionDerivativeTerms.included).toBe(false);
    expect(isNhm2CovariantConservationDiagnostic(artifact)).toBe(true);
  });

  it("reports transition derivative hotspots separately", () => {
    const artifact = buildNhm2CovariantConservationDiagnostic({
      atlas: atlas(true),
      atlasRef: "atlas.json",
      reducedOrderConservation: conservation(0.2),
      reducedOrderConservationRef: "conservation.json",
    });

    const transition = artifact.regions.find(
      (region) => region.regionId === "wall_exterior_transition",
    );
    expect(artifact.summary.covariantConservationPass).toBe(false);
    expect(transition?.status).toBe("fail");
    expect(transition?.blockers).toContain(
      "transition_derivative_contribution_out_of_tolerance",
    );
    expect(artifact.transitionDerivativeTerms.maxContributionLInf).toBe(0.2);
  });

  it("passes only when reduced-order conservation and derivative support both pass", () => {
    const artifact = buildNhm2CovariantConservationDiagnostic({
      atlas: atlas(true),
      atlasRef: "atlas.json",
      reducedOrderConservation: conservation(0),
      reducedOrderConservationRef: "conservation.json",
    });

    expect(artifact.summary.covariantConservationPass).toBe(true);
    expect(artifact.summary.transitionDerivativeTermsIncluded).toBe(true);
    expect(artifact.regions.every((region) => region.status === "pass")).toBe(true);
  });
});
