import { describe, expect, it } from "vitest";

import {
  buildNhm2MetricRequiredMomentumDemandAudit,
  isNhm2MetricRequiredMomentumDemandAudit,
} from "../shared/contracts/nhm2-metric-required-momentum-demand-audit.v1";
import type { Nhm2MomentumFrameProjectionReceiptV1 } from "../shared/contracts/nhm2-momentum-frame-projection-receipt.v1";

const regionIds = ["global", "hull", "wall", "exterior_shell"] as const;
const componentIds = ["T01", "T02", "T03"] as const;

const projectionReceipt = (): Nhm2MomentumFrameProjectionReceiptV1 =>
  ({
    contractVersion: "nhm2_momentum_frame_projection_receipt/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "demand-test",
    sourceMomentumDensityAuditRef: "momentum-audit.json",
    regionalSupportFunctionAtlasRef: "atlas.json",
    atlasHash: "atlas-hash",
    momentumFrameProjectionEvidenceRef: "projection-evidence.json",
    frame: {
      requestedFrame: "local_orthonormal",
      sourceTensorBasis: "local_orthonormal_to_chart",
      tetradRef: "declared://frame",
      projectionMethod: "declared_reduced_order_local_orthonormal",
      ratioPolicy: "use_audit_same_chart_ratios_as_local_frame_reduced_order",
      projectionStatus: "pass",
      assumptions: ["test reduced-order frame"],
      blockers: [],
    },
    regions: regionIds.map((regionId) => ({
      regionId,
      projectionStatus: "pass",
      components: componentIds.map((componentId, index) => ({
        componentId,
        sameChartMetricRequiredMomentumToEnergyRatio: index === 1 ? 2 : 0.5,
        projectedMetricRequiredMomentumToEnergyRatio: index === 1 ? 2 : 0.5,
        sameChartSourceMomentumToEnergyRatio: 1e-6,
        projectedSourceMomentumToEnergyRatio: 1e-6,
        projectionStatus: "pass",
        blockers: [],
      })),
      blockers: [],
    })),
    summary: {
      projectionAvailable: true,
      causalBoundApplicabilityStatus: "applicable",
      worstProjectedMetricRequiredMomentumToEnergyRatio: 2,
      worstProjectedSourceMomentumToEnergyRatio: 1e-6,
      anyProjectedMetricRequiredCausalMomentumBoundViolation: true,
      anyProjectedSourceCausalMomentumBoundViolation: false,
      firstBlocker: null,
      blockerCount: 0,
    },
    claimBoundary: {
      diagnosticOnly: true,
      frameProjectionDoesNotValidatePhysicalSource: true,
      chartBasisRatioCannotProveCausalBound: true,
      localFrameReceiptRequiredForCausalMaterialBound: true,
    },
  }) as Nhm2MomentumFrameProjectionReceiptV1;

describe("nhm2_metric_required_momentum_demand_audit/v1", () => {
  it("marks the current metric profile falsified under applicable projected momentum demand", () => {
    const artifact = buildNhm2MetricRequiredMomentumDemandAudit({
      momentumFrameProjectionReceipt: projectionReceipt(),
      momentumFrameProjectionReceiptRef: "projection-receipt.json",
    });

    expect(artifact.summary.currentMetricProfileFalsified).toBe(true);
    expect(artifact.summary.falsifierScope).toBe(
      "current_metric_profile_under_declared_projection",
    );
    expect(artifact.summary.worstProjectedMetricRequiredMomentumToEnergyRatio).toBe(2);
    expect(artifact.summary.firstBlocker).toContain(
      "metric_required_momentum_density_causal_bound_exceeded",
    );
    expect(isNhm2MetricRequiredMomentumDemandAudit(artifact)).toBe(true);
  });
});
