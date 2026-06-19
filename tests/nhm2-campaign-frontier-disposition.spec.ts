import { describe, expect, it } from "vitest";

import {
  buildNhm2CampaignFrontierDisposition,
  isNhm2CampaignFrontierDisposition,
} from "../shared/contracts/nhm2-campaign-frontier-disposition.v1";
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
    runId: "frontier-test",
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

describe("nhm2_campaign_frontier_disposition/v1", () => {
  it("turns non-resolvable metric momentum remediation into current-profile rejection", () => {
    const targets = buildNhm2MetricMomentumRemediationTargets({
      metricRequiredMomentumDemandAudit: demandAudit(),
      metricRequiredMomentumDemandAuditRef: "demand-audit.json",
    });
    const disposition = buildNhm2CampaignFrontierDisposition({
      generatedAt: "2026-06-19T00:00:00.000Z",
      metricMomentumRemediationTargets: targets,
      metricMomentumRemediationTargetsRef: "targets.json",
    });

    expect(disposition.disposition.status).toBe("current_profile_rejected");
    expect(disposition.disposition.reason).toBe(
      "current_profile_rejected_under_declared_reduced_order_projected_momentum_demand",
    );
    expect(disposition.frontier).toMatchObject({
      gateId: "full_regional_tensor_closure",
      blockerClass: "metric_required_momentum_density",
      currentProfileNonResolvable: true,
    });
    expect(disposition.quantitativeSummary).toMatchObject({
      worstRegionId: "hull",
      worstComponentId: "T02",
      worstRequiredSuppressionFactor: 10,
      worstRequiredFractionalReduction: 0.9,
      blockerCount: 1,
    });
    expect(disposition.disposition.allowedNextActions).toContain(
      "change_metric_profile_geometry",
    );
    expect(disposition.disposition.forbiddenNextActions).toContain("silently_zero_t0i");
    expect(disposition.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(isNhm2CampaignFrontierDisposition(disposition)).toBe(true);
  });
});
