import { describe, expect, it } from "vitest";

import {
  buildNhm2MetricMomentumRemediationTargets,
  isNhm2MetricMomentumRemediationTargets,
} from "../shared/contracts/nhm2-metric-momentum-remediation-targets.v1";
import type { Nhm2MetricRequiredMomentumDemandAuditV1 } from "../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";

const demandAudit = (): Nhm2MetricRequiredMomentumDemandAuditV1 =>
  ({
    contractVersion: "nhm2_metric_required_momentum_demand_audit/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "remediation-test",
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

describe("nhm2_metric_momentum_remediation_targets/v1", () => {
  it("computes suppression factors for current-profile projected momentum failures", () => {
    const artifact = buildNhm2MetricMomentumRemediationTargets({
      metricRequiredMomentumDemandAudit: demandAudit(),
      metricRequiredMomentumDemandAuditRef: "demand-audit.json",
    });

    expect(artifact.summary.remediationRequired).toBe(true);
    expect(artifact.summary.nonResolvableForCurrentProfile).toBe(true);
    expect(artifact.summary.worstRequiredSuppressionFactor).toBe(10);
    expect(artifact.summary.worstRequiredFractionalReduction).toBe(0.9);
    expect(artifact.forbiddenRemediationLevers).toContain("silently_zero_t0i");
    expect(isNhm2MetricMomentumRemediationTargets(artifact)).toBe(true);
  });
});
