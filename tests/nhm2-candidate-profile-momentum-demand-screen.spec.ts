import { describe, expect, it } from "vitest";

import { buildNhm2CandidateProfileMomentumDemandScreen } from "../shared/contracts/nhm2-candidate-profile-momentum-demand-screen.v1";
import { buildNhm2CampaignFrontierDisposition } from "../shared/contracts/nhm2-campaign-frontier-disposition.v1";
import { buildNhm2CampaignProfileSearch } from "../shared/contracts/nhm2-campaign-profile-search.v1";
import { buildNhm2MetricMomentumRemediationTargets } from "../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import {
  isNhm2MetricRequiredMomentumDemandAudit,
  type Nhm2MetricRequiredMomentumDemandAuditV1,
} from "../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";

const sourceDemandAudit = (): Nhm2MetricRequiredMomentumDemandAuditV1 =>
  ({
    contractVersion: "nhm2_metric_required_momentum_demand_audit/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "candidate-screen-test",
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
      {
        regionId: "wall",
        componentId: "T01",
        projectedMetricRequiredMomentumToEnergyRatio: 0.2,
        causalMomentumToEnergyRatioLimit: 1,
        exceedanceFactor: 0.2,
        status: "pass",
        blockers: [],
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
    metricRequiredMomentumDemandAudit: sourceDemandAudit(),
    metricRequiredMomentumDemandAuditRef: "source-demand.json",
  });
  const disposition = buildNhm2CampaignFrontierDisposition({
    generatedAt: "2026-06-19T00:00:00.000Z",
    metricMomentumRemediationTargets: targets,
    metricMomentumRemediationTargetsRef: "targets.json",
  });
  return buildNhm2CampaignProfileSearch({
    generatedAt: "2026-06-19T00:00:00.000Z",
    campaignFrontierDisposition: disposition,
    campaignFrontierDispositionRef: "disposition.json",
    metricMomentumRemediationTargets: targets,
    metricMomentumRemediationTargetsRef: "targets.json",
    candidateSpecs: [
      {
        alphaCenterline: 0.7,
        proposalKind: "alpha_only",
        projectedT0iSuppressionFactor: 1,
      },
      {
        alphaCenterline: 0.9,
        proposalKind: "combined_metric_redesign",
        projectedT0iSuppressionFactor: 20,
      },
    ],
  });
};

describe("candidate profile momentum-demand screen", () => {
  it("scales the source momentum demand audit for a screened candidate without promotion claims", () => {
    const audit = buildNhm2CandidateProfileMomentumDemandScreen({
      generatedAt: "2026-06-19T00:00:00.000Z",
      sourceMetricRequiredMomentumDemandAudit: sourceDemandAudit(),
      sourceMetricRequiredMomentumDemandAuditRef: "source-demand.json",
      profileSearch: profileSearch(),
      profileSearchRef: "profile-search.json",
      candidateProfileId:
        "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
    });

    expect(audit.selectedProfileId).toBe(
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
    );
    expect(audit.ratioPolicy).toContain(
      "candidate_profile_screen_scaled_from_current_metric_momentum_audit",
    );
    expect(audit.ratioPolicy).toContain("screen_only_not_full_adm_tetrad");
    expect(audit.summary).toMatchObject({
      anyProjectedMetricRequiredCausalMomentumBoundViolation: false,
      worstRegionId: "hull",
      worstComponentId: "T02",
      worstProjectedMetricRequiredMomentumToEnergyRatio: 0.5,
      currentMetricProfileFalsified: false,
      falsifierScope: "not_applicable",
      firstBlocker: null,
      blockerCount: 0,
    });
    expect(audit.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      reducedOrderProjectionDoesNotReplaceFullAdmTetrad: true,
      transportClaimAllowed: false,
    });
    expect(isNhm2MetricRequiredMomentumDemandAudit(audit)).toBe(true);
  });

  it("refuses to screen rejected alpha-only candidates", () => {
    expect(() =>
      buildNhm2CandidateProfileMomentumDemandScreen({
        sourceMetricRequiredMomentumDemandAudit: sourceDemandAudit(),
        profileSearch: profileSearch(),
        candidateProfileId:
          "stage1_centerline_alpha_0p7000_alpha_only_campaign_screen_v1",
      }),
    ).toThrow(/not screen-pass eligible/);
  });
});
