import { describe, expect, it } from "vitest";

import {
  buildNhm2CandidateMetricProfileSpec,
  isNhm2CandidateMetricProfileSpec,
} from "../shared/contracts/nhm2-candidate-metric-profile-spec.v1";
import {
  buildNhm2CampaignProfileSearch,
} from "../shared/contracts/nhm2-campaign-profile-search.v1";
import {
  buildNhm2MetricMomentumRemediationTargets,
} from "../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import type { Nhm2MetricRequiredMomentumDemandAuditV1 } from "../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";

const demandAudit = (): Nhm2MetricRequiredMomentumDemandAuditV1 =>
  ({
    contractVersion: "nhm2_metric_required_momentum_demand_audit/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "candidate-profile-spec-test",
    momentumFrameProjectionReceiptRef: "projection-receipt.json",
    projectionEvidenceRef: "projection-evidence.json",
    projectionApplicabilityStatus: "applicable",
    ratioPolicy: "use_audit_same_chart_ratios_as_local_frame_reduced_order",
    components: [
      {
        regionId: "hull",
        componentId: "T02",
        projectedMetricRequiredMomentumToEnergyRatio: 10,
        causalMomentumToEnergyRatioLimit: 1,
        exceedanceFactor: 10,
        status: "fail",
        blockers: ["metric_required_momentum_density_causal_bound_exceeded"],
      },
    ],
    summary: {
      allProjectedRatiosAvailable: true,
      anyProjectedMetricRequiredCausalMomentumBoundViolation: true,
      worstRegionId: "hull",
      worstComponentId: "T02",
      worstProjectedMetricRequiredMomentumToEnergyRatio: 10,
      worstExceedanceFactor: 10,
      currentMetricProfileFalsified: true,
      falsifierScope: "current_metric_profile_under_declared_projection",
      firstBlocker: "hull:T02:metric_required_momentum_density_causal_bound_exceeded",
      blockerCount: 1,
    },
    claimBoundary: {
      diagnosticOnly: true,
      metricDemandAuditDoesNotValidatePhysicalSource: true,
      reducedOrderProjectionDoesNotReplaceFullAdmTetrad: true,
      currentProfileFalsifierDoesNotProveUniversalMetricImpossibility: true,
      transportClaimAllowed: false,
    },
  }) as Nhm2MetricRequiredMomentumDemandAuditV1;

const profileSearch = () => {
  const targets = buildNhm2MetricMomentumRemediationTargets({
    generatedAt: "2026-06-19T00:00:00.000Z",
    metricRequiredMomentumDemandAudit: demandAudit(),
    metricRequiredMomentumDemandAuditRef: "demand-audit.json",
  });
  return buildNhm2CampaignProfileSearch({
    generatedAt: "2026-06-19T00:00:00.000Z",
    metricMomentumRemediationTargets: targets,
    metricMomentumRemediationTargetsRef: "targets.json",
    candidateSpecs: [
      {
        alphaCenterline: 0.9,
        proposalKind: "combined_metric_redesign",
        shiftAmplitudeScale: 1e-10,
        wallThicknessScale: 10,
        smoothingWidthScale: 20,
        transitionKernel: "compact_bump",
        projectedT0iSuppressionFactor: 20,
      },
    ],
  });
};

describe("nhm2_candidate_metric_profile_spec/v1", () => {
  it("keeps a screened profile blocked until executable geometry refs exist", () => {
    const candidateProfileId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const spec = buildNhm2CandidateMetricProfileSpec({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      profileSearchRef: "profile-search.json",
      candidateProfileId,
      coordinateTimeSeconds: 100,
    });

    expect(spec.candidateProfileId).toBe(candidateProfileId);
    expect(spec.tripClockingDiagnostic).toMatchObject({
      properTimeRatio: 0.9,
      shipProperTimeSeconds: 90,
      clockSavingSeconds: 10,
      routeEtaCertified: false,
    });
    expect(spec.executableGeometry).toMatchObject({
      runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
      runtimeProfileRegistered: false,
      runtimeProfileMatchesCandidateLevers: false,
      candidateGeometryAdapterStatus: "missing",
      shiftFieldEvaluatorStatus: "missing",
      admRouteReady: false,
    });
    expect(spec.campaignReadiness).toMatchObject({
      canEnterFullAdmMetricTensorRoute: false,
      firstBlocker: "candidate_executable_shift_field_evaluator_missing",
    });
    expect(spec.campaignReadiness.blockers).toEqual([
      "candidate_executable_shift_field_evaluator_missing",
      "candidate_regional_support_atlas_ref_missing",
      "candidate_grid_ref_missing",
    ]);
    expect(spec.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      profileSpecDoesNotValidateProfile: true,
      physicalViabilityClaimAllowed: false,
      routeEtaClaimAllowed: false,
    });
    expect(isNhm2CandidateMetricProfileSpec(spec)).toBe(true);
  });

  it("keeps a runtime-backed combined redesign blocked until non-alpha levers have an executable adapter", () => {
    const spec = buildNhm2CandidateMetricProfileSpec({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      candidateProfileId:
        "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
      runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
      runtimeProfileRef:
        "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p9000_v1/nhm2-warp-worldline-proof-2026-04-05.json",
      shiftFieldEvaluatorRef:
        "modules/warp/natario-warp.ts#calculateNatarioWarpBubble.shiftVectorField.evaluateShiftVector",
      regionalSupportAtlasRef: "candidate-profile/regional-atlas.json",
      gridRef: "candidate-profile/grid.json",
    });

    expect(spec.executableGeometry).toMatchObject({
      runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
      runtimeProfileRegistered: true,
      runtimeProfileMatchesCandidateLevers: false,
      candidateGeometryAdapterStatus: "partial_runtime_profile_only",
      shiftFieldEvaluatorStatus: "available",
      admRouteReady: false,
    });
    expect(spec.executableGeometry.unsupportedCandidateLevers).toEqual([
      "transition_kernel",
    ]);
    expect(spec.executableGeometry.supportedCandidateLevers).toEqual([
      "lapse_depth_scale",
      "shift_amplitude_scale",
      "wall_thickness_scale",
      "smoothing_width_scale",
    ]);
    expect(spec.campaignReadiness).toMatchObject({
      canEnterFullAdmMetricTensorRoute: false,
      firstBlocker: "candidate_transition_kernel_adapter_missing",
    });
    expect(spec.campaignReadiness.blockers).toContain("candidate_transition_kernel_adapter_missing");
    expect(spec.claimBoundary.transportClaimAllowed).toBe(false);
    expect(isNhm2CandidateMetricProfileSpec(spec)).toBe(true);
  });

  it("admits a screened profile to the full ADM metric tensor route only when executable refs and candidate levers match", () => {
    const search = profileSearch();
    const candidateProfileId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const compatibleSearch = {
      ...search,
      candidates: search.candidates.map((candidate) =>
        candidate.candidateProfileId === candidateProfileId
          ? {
              ...candidate,
              levers: {
                ...candidate.levers,
                shiftAmplitudeScale: 1,
                wallThicknessScale: 1,
                smoothingWidthScale: 1,
                transitionKernel: "reuse_current" as const,
              },
            }
          : candidate,
      ),
    };
    const spec = buildNhm2CandidateMetricProfileSpec({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: compatibleSearch,
      candidateProfileId,
      runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
      runtimeProfileRef: "candidate-profile/runtime-profile.json",
      shiftFieldEvaluatorRef: "candidate-profile/shift-field-evaluator.json",
      regionalSupportAtlasRef: "candidate-profile/regional-atlas.json",
      gridRef: "candidate-profile/grid.json",
    });

    expect(spec.executableGeometry).toMatchObject({
      shiftFieldEvaluatorStatus: "available",
      admRouteReady: true,
    });
    expect(spec.campaignReadiness).toMatchObject({
      canEnterFullAdmMetricTensorRoute: true,
      firstBlocker: "full_frozen_campaign_run_required",
      blockers: ["full_frozen_campaign_run_required"],
    });
    expect(spec.claimBoundary.transportClaimAllowed).toBe(false);
    expect(isNhm2CandidateMetricProfileSpec(spec)).toBe(true);
  });

  it("uses a transition-kernel adapter ref to move the blocker to missing atlas/grid evidence", () => {
    const spec = buildNhm2CandidateMetricProfileSpec({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      candidateProfileId:
        "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
      runtimeProfileId: "stage1_centerline_alpha_0p9000_v1",
      runtimeProfileRef: "candidate-profile/runtime-profile.json",
      shiftFieldEvaluatorRef: "candidate-profile/shift-field-evaluator.json",
      transitionKernelAdapterRef: "candidate-profile/compact-bump-atlas.json#transitionKernels",
    });

    expect(spec.executableGeometry).toMatchObject({
      runtimeProfileRegistered: true,
      runtimeProfileMatchesCandidateLevers: true,
      candidateGeometryAdapterStatus: "available",
      transitionKernelAdapterRef:
        "candidate-profile/compact-bump-atlas.json#transitionKernels",
      admRouteReady: false,
    });
    expect(spec.executableGeometry.unsupportedCandidateLevers).toEqual([]);
    expect(spec.executableGeometry.supportedCandidateLevers).toContain("transition_kernel");
    expect(spec.campaignReadiness).toMatchObject({
      canEnterFullAdmMetricTensorRoute: false,
      firstBlocker: "candidate_regional_support_atlas_ref_missing",
      blockers: ["candidate_regional_support_atlas_ref_missing", "candidate_grid_ref_missing"],
    });
    expect(spec.claimBoundary.routeEtaClaimAllowed).toBe(false);
    expect(isNhm2CandidateMetricProfileSpec(spec)).toBe(true);
  });
});
