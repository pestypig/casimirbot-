import { describe, expect, it } from "vitest";

import type { Nhm2CandidateMetricProfileSpecV1 } from "../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import { buildNhm2MetricRequiredRegionalFullTensorSourceArtifact } from "../shared/contracts/nhm2-metric-required-regional-full-tensor-source.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { buildNhm2SameChartFullTensorArtifact } from "../shared/contracts/nhm2-same-chart-full-tensor.v1";
import {
  buildNhm2SourceTileCounterpartCompatibility,
  isNhm2SourceTileCounterpartCompatibility,
} from "../shared/contracts/nhm2-source-tile-counterpart-compatibility.v1";

const candidateProfileId =
  "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";

const spec = (): Nhm2CandidateMetricProfileSpecV1 => ({
  contractVersion: "nhm2_candidate_metric_profile_spec/v1",
  generatedAt: "2026-06-19T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  candidateProfileId,
  parentProfileId: "stage1_centerline_alpha_0p995_v1",
  alphaCenterline: 0.9,
  subjectiveEfficiencyProxy: 1 / 0.9,
  proposalKind: "combined_metric_redesign",
  sourceProfileSearchRef: "profile-search.json",
  profileDefinition: {
    lapseDepthScale: 1,
    shiftAmplitudeScale: 1e-10,
    wallThicknessScale: 10,
    smoothingWidthScale: 20,
    transitionKernel: "compact_bump",
    projectedT0iSuppressionFactor: 5e16,
    sourceTensorCopiedFromMetric: false,
    silentlyZeroesT0i: false,
    silentlyZeroesOffDiagonalTij: false,
    usesScalarT00Only: false,
  },
  tripClockingDiagnostic: {
    properTimeRatio: 0.9,
    subjectiveEfficiencyProxy: 1 / 0.9,
    formula: "tau = alpha_centerline * T_coordinate",
    coordinateTimeSeconds: null,
    shipProperTimeSeconds: null,
    clockSavingSeconds: null,
    routeEtaCertified: false,
  },
  executableGeometry: {
    runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
    runtimeProfileRef: "runtime-profile.json",
    runtimeProfileRegistered: true,
    runtimeProfileMatchesCandidateLevers: true,
    supportedCandidateLevers: ["lapse_depth_scale"],
    unsupportedCandidateLevers: [],
    candidateGeometryAdapterStatus: "available",
    transitionKernelAdapterRef: "atlas-builder#compact_bump",
    shiftFieldEvaluatorStatus: "available",
    shiftFieldEvaluatorRef: "natario-warp.ts#calculateNatarioWarpBubble",
    regionalSupportAtlasRef: "candidate-atlas.json",
    gridRef: "candidate-grid.json",
    admRouteReady: true,
    blockers: [],
  },
  campaignReadiness: {
    canEnterFullAdmMetricTensorRoute: true,
    needsFrozenCampaignRun: true,
    firstBlocker: "full_frozen_campaign_run_required",
    blockers: ["full_frozen_campaign_run_required"],
  },
  claimBoundary: {
    diagnosticOnly: true,
    profileSpecDoesNotValidateProfile: true,
    tripClockingDoesNotCertifyRouteEta: true,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    routeEtaClaimAllowed: false,
    propulsionClaimAllowed: false,
  },
});

const fullTensor = (regionId: Nhm2RegionalSourceClosureRegionId) =>
  buildNhm2SameChartFullTensorArtifact({
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: candidateProfileId,
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    routeId: "candidate_adm_shift_field_region_mean_v1",
    source: "adm_projection",
    tensor: {
      T00: 1,
      T01: 0.1,
      T02: 0.2,
      T03: 0.3,
      T11: -1,
      T12: 0.01,
      T13: 0.02,
      T22: -1,
      T23: 0.03,
      T33: -1,
    },
    defaultAssumptions: [`regionId=${regionId}`],
    adm: {
      alphaStatus: "computed",
      betaStatus: "computed",
      gammaStatus: "derived_same_chart",
      extrinsicCurvatureStatus: "derived_same_chart",
    },
  });

const metric = () =>
  buildNhm2MetricRequiredRegionalFullTensorSourceArtifact({
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: candidateProfileId,
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    sourceRoute: "adm_projection",
    sourceArtifactRefs: ["candidate-metric.json"],
    regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
      regionId,
      status: "computed",
      artifactRef: `candidate-metric.json#${regionId}`,
      tensorRef: `candidate-metric.json#${regionId}/tensor`,
      regionMaskRef: `mask:${regionId}`,
      aggregationMode: "mean",
      normalizationBasis: "sample_count",
      sampleCount: 8,
      sameChartFullTensor: fullTensor(regionId),
      blockers: [],
      warnings: [],
    })),
  });

const sourceFullTensor = (selectedProfileId = candidateProfileId) => ({
  contractVersion: "test_source_full_tensor/v1",
  selectedProfileId,
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    tensorAuthorityMode: "full_tensor",
    tensor: {
      T00: 1,
      T01: 0.1,
      T02: 0.2,
      T03: 0.3,
      T11: -1,
      T12: 0.01,
      T13: 0.02,
      T22: -1,
      T23: 0.03,
      T33: -1,
    },
    blockers: [],
  })),
});

describe("nhm2_source_tile_counterpart_compatibility/v1", () => {
  it("fails closed with a typed source-missing blocker when no source counterpart is supplied", () => {
    const artifact = buildNhm2SourceTileCounterpartCompatibility({
      candidateProfileSpec: spec(),
      metricRequiredFullRegionalTensor: metric(),
      metricRequiredFullRegionalTensorRef: "candidate-metric.json",
    });

    expect(artifact.summary.firstBlocker).toBe(
      "candidate_tile_effective_counterpart_source_missing",
    );
    expect(artifact.regions.every((region) => region.status === "missing")).toBe(true);
    expect(artifact.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(isNhm2SourceTileCounterpartCompatibility(artifact)).toBe(true);
  });

  it("passes only when a same-profile full tensor source counterpart is available", () => {
    const artifact = buildNhm2SourceTileCounterpartCompatibility({
      candidateProfileSpec: spec(),
      metricRequiredFullRegionalTensor: metric(),
      metricRequiredFullRegionalTensorRef: "candidate-metric.json",
      sourceFullTensorRef: "candidate-source-full-tensor.json",
      sourceFullTensor: sourceFullTensor(),
    });

    expect(artifact.summary).toMatchObject({
      sourceCounterpartAvailable: true,
      sameProfileCounterpart: true,
      allRegionsCompatible: true,
      firstBlocker: null,
    });
    expect(artifact.regions.every((region) => region.status === "pass")).toBe(true);
    expect(artifact.claimBoundary.compatibilityDoesNotValidateSourcePhysics).toBe(true);
  });

  it("rejects source evidence from a different profile", () => {
    const artifact = buildNhm2SourceTileCounterpartCompatibility({
      candidateProfileSpec: spec(),
      metricRequiredFullRegionalTensor: metric(),
      metricRequiredFullRegionalTensorRef: "candidate-metric.json",
      sourceFullTensorRef: "parent-source-full-tensor.json",
      sourceFullTensor: sourceFullTensor("stage1_centerline_alpha_0p995_v1"),
    });

    expect(artifact.summary.firstBlocker).toBe(
      "candidate_tile_counterpart_profile_mismatch",
    );
    expect(artifact.regions[0]?.status).toBe("fail");
  });
});
