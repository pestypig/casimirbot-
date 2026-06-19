import { describe, expect, it } from "vitest";

import {
  buildNhm2CandidateCampaignGrid,
  isNhm2CandidateCampaignGrid,
} from "../shared/contracts/nhm2-candidate-campaign-grid.v1";
import type { Nhm2CandidateMetricProfileSpecV1 } from "../shared/contracts/nhm2-candidate-metric-profile-spec.v1";

const candidateProfileSpec = (
  mapped = true,
): Nhm2CandidateMetricProfileSpecV1 => ({
  contractVersion: "nhm2_candidate_metric_profile_spec/v1",
  generatedAt: "2026-06-19T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  candidateProfileId:
    "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
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
    coordinateTimeSeconds: 100,
    shipProperTimeSeconds: 90,
    clockSavingSeconds: 10,
    routeEtaCertified: false,
  },
  executableGeometry: {
    runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
    runtimeProfileRef: "runtime-profile.json",
    runtimeProfileRegistered: mapped,
    runtimeProfileMatchesCandidateLevers: mapped,
    supportedCandidateLevers: mapped ? ["lapse_depth_scale"] : [],
    unsupportedCandidateLevers: mapped ? [] : ["transition_kernel"],
    candidateGeometryAdapterStatus: mapped ? "available" : "missing",
    transitionKernelAdapterRef: mapped ? "atlas-builder#compact_bump" : null,
    shiftFieldEvaluatorStatus: mapped ? "available" : "missing",
    shiftFieldEvaluatorRef: mapped ? "shift-field.ts#evaluateShiftVector" : null,
    regionalSupportAtlasRef: null,
    gridRef: null,
    admRouteReady: false,
    blockers: mapped
      ? ["candidate_regional_support_atlas_ref_missing", "candidate_grid_ref_missing"]
      : ["candidate_transition_kernel_adapter_missing"],
  },
  campaignReadiness: {
    canEnterFullAdmMetricTensorRoute: false,
    needsFrozenCampaignRun: true,
    firstBlocker: mapped
      ? "candidate_regional_support_atlas_ref_missing"
      : "candidate_transition_kernel_adapter_missing",
    blockers: mapped
      ? ["candidate_regional_support_atlas_ref_missing", "candidate_grid_ref_missing"]
      : ["candidate_transition_kernel_adapter_missing"],
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

describe("nhm2_candidate_campaign_grid/v1", () => {
  it("emits same-chart reduced-order campaign grid refs without evaluating tensors", () => {
    const grid = buildNhm2CandidateCampaignGrid({
      generatedAt: "2026-06-19T00:00:00.000Z",
      candidateProfileSpec: candidateProfileSpec(),
      candidateProfileSpecRef: "candidate-spec.json",
      closureRegionSampleCount: 32,
      transitionRegionSampleCount: 12,
    });

    expect(grid.contractVersion).toBe("nhm2_candidate_campaign_grid/v1");
    expect(grid.candidateProfileId).toContain("0p9000");
    expect(grid.regionSamples.wall.sampleCount).toBe(32);
    expect(grid.regionSamples.hull_wall_transition.sampleCount).toBe(12);
    expect(grid.readiness).toMatchObject({
      gridAvailable: true,
      candidateRuntimeProfileMapped: true,
      admSamplingReady: true,
      blockers: [],
    });
    expect(grid.claimBoundary.gridDoesNotEvaluateMetricTensor).toBe(true);
    expect(grid.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(isNhm2CandidateCampaignGrid(grid)).toBe(true);
  });

  it("keeps grid readiness blocked when runtime profile mapping is incomplete", () => {
    const grid = buildNhm2CandidateCampaignGrid({
      candidateProfileSpec: candidateProfileSpec(false),
    });

    expect(grid.readiness).toMatchObject({
      gridAvailable: true,
      candidateRuntimeProfileMapped: false,
      admSamplingReady: false,
      blockers: ["candidate_runtime_profile_mapping_incomplete"],
    });
    expect(grid.claimBoundary.transportClaimAllowed).toBe(false);
    expect(isNhm2CandidateCampaignGrid(grid)).toBe(true);
  });
});
