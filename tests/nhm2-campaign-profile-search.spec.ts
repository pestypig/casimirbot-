import { describe, expect, it } from "vitest";

import {
  buildNhm2CampaignFrontierDisposition,
} from "../shared/contracts/nhm2-campaign-frontier-disposition.v1";
import {
  buildNhm2CampaignProfileSearch,
  isNhm2CampaignProfileSearch,
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
    runId: "profile-search-test",
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

describe("nhm2_campaign_profile_search/v1", () => {
  it("rejects alpha-only speed seeking and ranks fastest screened metric-redesign candidates", () => {
    const targets = buildNhm2MetricMomentumRemediationTargets({
      generatedAt: "2026-06-19T00:00:00.000Z",
      metricRequiredMomentumDemandAudit: demandAudit(),
      metricRequiredMomentumDemandAuditRef: "demand-audit.json",
    });
    const disposition = buildNhm2CampaignFrontierDisposition({
      generatedAt: "2026-06-19T00:00:00.000Z",
      metricMomentumRemediationTargets: targets,
      metricMomentumRemediationTargetsRef: "targets.json",
    });
    const search = buildNhm2CampaignProfileSearch({
      generatedAt: "2026-06-19T00:00:00.000Z",
      sourceCampaignRef: "campaign.json",
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
          alphaCenterline: 0.95,
          proposalKind: "combined_metric_redesign",
          projectedT0iSuppressionFactor: 20,
        },
        {
          alphaCenterline: 0.9,
          proposalKind: "combined_metric_redesign",
          projectedT0iSuppressionFactor: 20,
        },
      ],
    });

    const alphaOnly = search.candidates.find(
      (candidate) => candidate.proposalKind === "alpha_only",
    );
    expect(alphaOnly?.candidateProfileId).toBe(
      "stage1_centerline_alpha_0p7000_alpha_only_campaign_screen_v1",
    );
    expect(alphaOnly?.campaignScreen.status).toBe("rejected_metric_momentum");
    expect(alphaOnly?.campaignScreen.blockers).toContain(
      "alpha_only_does_not_reduce_projected_t0i",
    );

    expect(search.ranking.fastestScreenedCandidateProfileId).toBe(
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
    );
    expect(search.summary).toMatchObject({
      candidateCount: 3,
      screenPassCount: 2,
      rejectedCount: 1,
      fastestScreenedAlpha: 0.9,
      firstBlocker: "full_frozen_campaign_run_required",
      profileSearchComplete: false,
    });
    expect(search.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      screenPassDoesNotPassCampaign: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    });
    expect(isNhm2CampaignProfileSearch(search)).toBe(true);
  });
});
