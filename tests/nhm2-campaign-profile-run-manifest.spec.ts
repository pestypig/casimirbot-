import { describe, expect, it } from "vitest";

import {
  buildNhm2CampaignFrontierDisposition,
} from "../shared/contracts/nhm2-campaign-frontier-disposition.v1";
import {
  buildNhm2CampaignProfileRunManifest,
  isNhm2CampaignProfileRunManifest,
} from "../shared/contracts/nhm2-campaign-profile-run-manifest.v1";
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
    runId: "profile-run-manifest-test",
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

describe("nhm2_campaign_profile_run_manifest/v1", () => {
  it("queues only screened candidates and requires all frozen campaign evidence", () => {
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
    const manifest = buildNhm2CampaignProfileRunManifest({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: search,
      profileSearchRef: "profile-search.json",
      runRootBase: "artifacts/test-profile-runs",
    });

    const rejected = manifest.candidates.find(
      (candidate) => candidate.proposalKind === "alpha_only",
    );
    const queued = manifest.candidates.find(
      (candidate) => candidate.proposalKind === "combined_metric_redesign",
    );

    expect(rejected?.manifestStatus).toBe("not_queued_rejected_by_profile_screen");
    expect(rejected?.queuedForFrozenCampaign).toBe(false);
    expect(rejected?.requiredEvidence.every((entry) => entry.required === false)).toBe(true);

    expect(queued?.manifestStatus).toBe("queued_full_campaign_required");
    expect(queued?.queuedForFrozenCampaign).toBe(true);
    expect(queued?.priorityRank).toBe(1);
    expect(queued?.nextCommand).toContain("--selected-profile-id");
    expect(queued?.requiredEvidence.every((entry) => entry.status === "required_missing")).toBe(true);
    expect(queued?.requiredEvidence.map((entry) => entry.evidenceId)).toEqual([
      "metric_required_full_regional_tensor",
      "projected_momentum_demand_audit",
      "metric_momentum_remediation_targets",
      "source_tile_counterpart_compatibility",
      "regional_full_tensor_residuals",
      "switching_covariant_conservation",
      "frequency_convergence",
      "dynamic_effective_geometry_agreement",
      "qei_worldline_dossier",
      "observer_family_energy_conditions",
      "horizon_blueshift_particle_stability",
      "time_dependent_source_campaign",
    ]);
    expect(manifest.summary).toMatchObject({
      candidateCount: 2,
      queuedCandidateCount: 1,
      rejectedCandidateCount: 1,
      nextCandidateProfileId:
        "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1",
      firstBlocker: "candidate_frozen_campaign_evidence_missing",
      manifestComplete: false,
    });
    expect(manifest.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      runManifestDoesNotEvaluateCampaign: true,
      queuedCandidateDoesNotValidateProfile: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    });
    expect(isNhm2CampaignProfileRunManifest(manifest)).toBe(true);
  });

  it("marks provided candidate evidence refs without treating the manifest as complete", () => {
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
      campaignFrontierDisposition: disposition,
      campaignFrontierDispositionRef: "disposition.json",
      metricMomentumRemediationTargets: targets,
      metricMomentumRemediationTargetsRef: "targets.json",
      candidateSpecs: [
        {
          alphaCenterline: 0.9,
          proposalKind: "combined_metric_redesign",
          projectedT0iSuppressionFactor: 20,
        },
      ],
    });
    const candidateProfileId =
      "stage1_centerline_alpha_0p9000_combined_metric_redesign_campaign_screen_v1";
    const manifest = buildNhm2CampaignProfileRunManifest({
      generatedAt: "2026-06-19T00:00:00.000Z",
      profileSearch: search,
      candidateEvidenceRefs: {
        [candidateProfileId]: {
          metric_required_full_regional_tensor: {
            artifactRef: "candidate/nhm2-metric-required-full-regional-tensor.json",
            blockers: ["candidate_metric_required_full_tensor_screen_not_full_adm_route"],
          },
          projected_momentum_demand_audit:
            "candidate/nhm2-metric-required-momentum-demand-audit.json",
          metric_momentum_remediation_targets:
            "candidate/nhm2-metric-momentum-remediation-targets.json",
        },
      },
    });
    const candidate = manifest.candidates[0];

    expect(
      candidate.requiredEvidence.find(
        (entry) => entry.evidenceId === "metric_required_full_regional_tensor",
      ),
    ).toMatchObject({
      status: "provided_blocked",
      artifactRef: "candidate/nhm2-metric-required-full-regional-tensor.json",
      blockers: ["candidate_metric_required_full_tensor_screen_not_full_adm_route"],
    });
    expect(
      candidate.requiredEvidence.find(
        (entry) => entry.evidenceId === "projected_momentum_demand_audit",
      ),
    ).toMatchObject({
      status: "provided",
      artifactRef: "candidate/nhm2-metric-required-momentum-demand-audit.json",
      blockers: [],
    });
    expect(
      candidate.requiredEvidence.find(
        (entry) => entry.evidenceId === "metric_momentum_remediation_targets",
      ),
    ).toMatchObject({
      status: "provided",
      artifactRef: "candidate/nhm2-metric-momentum-remediation-targets.json",
      blockers: [],
    });
    expect(
      candidate.requiredEvidence.find(
        (entry) => entry.evidenceId === "qei_worldline_dossier",
      )?.status,
    ).toBe("required_missing");
    expect(manifest.summary).toMatchObject({
      queuedCandidateCount: 1,
      firstBlocker: "candidate_frozen_campaign_evidence_missing",
      manifestComplete: false,
    });
    expect(manifest.claimBoundary.transportClaimAllowed).toBe(false);
    expect(isNhm2CampaignProfileRunManifest(manifest)).toBe(true);
  });
});
