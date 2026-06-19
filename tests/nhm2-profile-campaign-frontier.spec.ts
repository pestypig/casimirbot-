import { describe, expect, it } from "vitest";

import {
  buildNhm2CampaignFrontierDisposition,
} from "../shared/contracts/nhm2-campaign-frontier-disposition.v1";
import {
  NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS,
  buildNhm2CampaignProfileRunManifest,
  type Nhm2CampaignProfileRunEvidenceInput,
} from "../shared/contracts/nhm2-campaign-profile-run-manifest.v1";
import {
  buildNhm2CampaignProfileSearch,
} from "../shared/contracts/nhm2-campaign-profile-search.v1";
import {
  buildNhm2MetricMomentumRemediationTargets,
} from "../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import {
  buildNhm2ProfileCampaignFrontier,
  isNhm2ProfileCampaignFrontier,
} from "../shared/contracts/nhm2-profile-campaign-frontier.v1";
import type { Nhm2MetricRequiredMomentumDemandAuditV1 } from "../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";

const demandAudit = (): Nhm2MetricRequiredMomentumDemandAuditV1 =>
  ({
    contractVersion: "nhm2_metric_required_momentum_demand_audit/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "profile-frontier-test",
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
      {
        alphaCenterline: 0.95,
        proposalKind: "combined_metric_redesign",
        projectedT0iSuppressionFactor: 20,
      },
    ],
  });
};

const allEvidenceProvided = (
  candidateProfileId: string,
): Record<string, Record<string, Nhm2CampaignProfileRunEvidenceInput>> => ({
  [candidateProfileId]: Object.fromEntries(
    NHM2_CAMPAIGN_PROFILE_RUN_EVIDENCE_IDS.map((evidenceId) => [
      evidenceId,
      { artifactRef: `${candidateProfileId}/${evidenceId}.json`, blockers: [] },
    ]),
  ),
});

describe("nhm2_profile_campaign_frontier/v1", () => {
  it("does not rank a fast-looking candidate while required evidence is blocked", () => {
    const candidateProfileId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const evidence = allEvidenceProvided(candidateProfileId);
    evidence[candidateProfileId].source_tile_counterpart_compatibility = {
      artifactRef: `${candidateProfileId}/source-compat.json`,
      blockers: ["candidate_tile_effective_counterpart_source_missing"],
    };
    const manifest = buildNhm2CampaignProfileRunManifest({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      candidateEvidenceRefs: evidence,
    });
    const frontier = buildNhm2ProfileCampaignFrontier({
      generatedAt: "2026-06-19T00:00:00.000Z",
      campaignProfileRunManifest: manifest,
      campaignProfileRunManifestRef: "manifest.json",
    });

    expect(frontier.frontier.fastestCampaignAdmissibleProfileId).toBeNull();
    expect(frontier.frontier.fastestBlockedProfileId).toBe(candidateProfileId);
    expect(frontier.frontier.firstBlocker).toBe(
      "candidate_tile_effective_counterpart_source_missing",
    );
    expect(frontier.frontier.firstBlockerClass).toBe(
      "source_counterpart_or_material_evidence",
    );
    expect(frontier.frontier.recommendedNextAction).toContain(
      "source-side tensor/material counterpart",
    );
    expect(frontier.summary.profileCampaignFrontierComplete).toBe(false);
    expect(frontier.summary.highestLeverageBlockerClass).toBe(
      "source_counterpart_or_material_evidence",
    );
    expect(frontier.claimBoundary.routeEtaClaimAllowed).toBe(false);
    expect(isNhm2ProfileCampaignFrontier(frontier)).toBe(true);
  });

  it("selects the lowest-alpha profile only after all campaign evidence is present and unblocked", () => {
    const fastestCandidateId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const slowerCandidateId =
      "stage1_centerline_alpha_0p9500_combined_metric_redesign_campaign_screen_v1";
    const manifest = buildNhm2CampaignProfileRunManifest({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      candidateEvidenceRefs: {
        ...allEvidenceProvided(fastestCandidateId),
        ...allEvidenceProvided(slowerCandidateId),
      },
    });
    const frontier = buildNhm2ProfileCampaignFrontier({
      generatedAt: "2026-06-19T00:00:00.000Z",
      campaignProfileRunManifest: manifest,
    });
    const rejectedAlphaOnly = frontier.candidates.find(
      (candidate) => candidate.proposalKind === "alpha_only",
    );

    expect(frontier.frontier.fastestCampaignAdmissibleProfileId).toBe(
      fastestCandidateId,
    );
    expect(frontier.frontier.firstBlockerClass).toBe("none");
    expect(
      frontier.candidates.find(
        (candidate) => candidate.candidateProfileId === fastestCandidateId,
      )?.blockerClass,
    ).toBe("none");
    expect(frontier.summary.fastestAdmissibleAlpha).toBe(0.9);
    expect(frontier.summary.highestLeverageBlockerClass).toBe("none");
    expect(rejectedAlphaOnly?.status).toBe("rejected_profile_screen");
    expect(rejectedAlphaOnly?.fastestRankEligible).toBe(false);
    expect(frontier.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(isNhm2ProfileCampaignFrontier(frontier)).toBe(true);
  });

  it("classifies observer failures after tensor closure as the next profile-design lead", () => {
    const candidateProfileId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const evidence = allEvidenceProvided(candidateProfileId);
    evidence[candidateProfileId].observer_family_energy_conditions = {
      artifactRef: `${candidateProfileId}/observer.json`,
      blockers: [
        "wall:WEC:negative_energy_density_for_boosted_timelike_grid",
        "wall:DEC:negative_null_direction_grid_flux",
      ],
    };
    evidence[candidateProfileId].time_dependent_source_campaign = {
      artifactRef: `${candidateProfileId}/campaign.json`,
      blockers: ["observer_family_pass_false"],
    };
    const manifest = buildNhm2CampaignProfileRunManifest({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      candidateEvidenceRefs: evidence,
    });
    const frontier = buildNhm2ProfileCampaignFrontier({
      generatedAt: "2026-06-19T00:00:00.000Z",
      campaignProfileRunManifest: manifest,
    });

    expect(frontier.frontier.fastestCampaignAdmissibleProfileId).toBeNull();
    expect(frontier.frontier.fastestBlockedProfileId).toBe(candidateProfileId);
    expect(frontier.frontier.firstBlockerClass).toBe(
      "observer_energy_condition_after_tensor_closure",
    );
    expect(frontier.frontier.recommendedNextAction).toContain(
      "observer-compatible metric/source family",
    );
    expect(frontier.summary.highestLeverageBlockerClass).toBe(
      "observer_energy_condition_after_tensor_closure",
    );
    expect(isNhm2ProfileCampaignFrontier(frontier)).toBe(true);
  });

  it("classifies regional tensor and momentum closure failures before observer work", () => {
    const candidateProfileId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const evidence = allEvidenceProvided(candidateProfileId);
    evidence[candidateProfileId].projected_momentum_demand_audit = {
      artifactRef: `${candidateProfileId}/momentum-demand.json`,
      blockers: ["global:T01:projected_metric_momentum_ratio_missing"],
    };
    evidence[candidateProfileId].regional_full_tensor_residuals = {
      artifactRef: `${candidateProfileId}/regional-residuals.json`,
      blockers: ["global:T01:full_tensor_residual_missing_source_counterpart"],
    };
    evidence[candidateProfileId].observer_family_energy_conditions = {
      artifactRef: `${candidateProfileId}/observer.json`,
      blockers: ["observer_robust_check_incomplete"],
    };
    const manifest = buildNhm2CampaignProfileRunManifest({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: profileSearch(),
      candidateEvidenceRefs: evidence,
    });
    const frontier = buildNhm2ProfileCampaignFrontier({
      generatedAt: "2026-06-19T00:00:00.000Z",
      campaignProfileRunManifest: manifest,
    });

    expect(frontier.frontier.fastestCampaignAdmissibleProfileId).toBeNull();
    expect(frontier.frontier.fastestBlockedProfileId).toBe(candidateProfileId);
    expect(frontier.frontier.firstBlockerClass).toBe(
      "regional_full_tensor_or_momentum_closure",
    );
    expect(frontier.frontier.recommendedNextAction).toContain(
      "regional full tensor and momentum projection closure",
    );
    expect(isNhm2ProfileCampaignFrontier(frontier)).toBe(true);
  });
});
