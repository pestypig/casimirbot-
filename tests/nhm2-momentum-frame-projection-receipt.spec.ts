import { describe, expect, it } from "vitest";

import {
  buildNhm2MomentumFrameProjectionReceipt,
  isNhm2MomentumFrameProjectionReceipt,
  type Nhm2MomentumFrameProjectionEvidenceV1,
} from "../shared/contracts/nhm2-momentum-frame-projection-receipt.v1";
import type { Nhm2RegionalSupportFunctionAtlasV1 } from "../shared/contracts/nhm2-regional-support-function-atlas.v1";
import type { Nhm2SourceMomentumDensityAuditArtifactV1 } from "../shared/contracts/nhm2-source-momentum-density-audit.v1";

const regionIds = ["global", "hull", "wall", "exterior_shell"] as const;
const componentIds = ["T01", "T02", "T03"] as const;

const audit = (): Nhm2SourceMomentumDensityAuditArtifactV1 =>
  ({
    contractVersion: "nhm2_source_momentum_density_audit/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "projection-test",
    sourceComponentAuthorityLedgerRef: "ledger.json",
    regionalFullTensorResidualRef: "residual.json",
    regionalSupportFunctionAtlasRef: "atlas.json",
    regions: regionIds.map((regionId) => ({
      regionId,
      status: "fail",
      components: componentIds.map((componentId, index) => ({
        componentId,
        metricRequired: 1,
        tileEffectiveCounterpart: 0.01,
        passWindow: null,
        relResidual: 1,
        currentToAllowedMagnitudeRatio: 0.01,
        requiredAmplificationToPass: 100,
        sourceFractionOfAbsT00: 1e-6,
        metricRequiredFractionOfAbsT00: index === 1 ? 2 : 0.1,
        sourceCausalMomentumBoundStatus: "pass",
        metricRequiredCausalMomentumBoundStatus: index === 1 ? "fail" : "pass",
        fractionalAmplificationToRequirement: index === 1 ? 2e6 : 1e5,
        correctionStatus: "increase_magnitude",
        authority: "source_model",
        mechanismStatus: "missing",
        mechanismEvidenceRef: null,
        provenanceRef: "source.json",
        blockers: ["momentum_component_residual_exceeded"],
      })),
      worstComponentId: "T02",
      worstRequiredAmplificationToPass: 100,
      blockers: ["T02:momentum_component_residual_exceeded"],
    })),
    summary: {
      allMomentumComponentsPresent: true,
      allMomentumWithinTolerance: false,
      anyMomentumMechanismMissing: true,
      worstRegionId: "global",
      worstComponentId: "T02",
      worstRequiredAmplificationToPass: 100,
      worstMetricRequiredMomentumToEnergyRatio: 2,
      worstSourceMomentumToEnergyRatio: 1e-6,
      causalMomentumBoundApplicabilityStatus: "blocked",
      causalMomentumBoundFrameRef: "grid",
      causalMomentumBoundRequiresLocalOrthonormalFrame: true,
      causalMomentumBoundApplicabilityBlockers: ["blocked"],
      anyMetricRequiredCausalMomentumBoundViolation: true,
      anySourceCausalMomentumBoundViolation: false,
      uniformFractionalMomentumAnsatzDetected: true,
      sourceFractionByComponent: { T01: 1e-6, T02: 1e-6, T03: 1e-6 },
      worstFractionalAmplificationToRequirement: 2e6,
      firstBlocker: "global:T02:momentum_component_residual_exceeded",
      falsifierCandidate: true,
      currentDeclaredSourceModelFalsified: true,
      causalMaterialMomentumBoundFalsifier: false,
      falsifierScope: "current_declared_source_model",
      falsifierReason: "declared_uniform_fractional_momentum_density_without_mechanism_exceeds_required_amplification",
      blockerCount: 4,
    },
    claimBoundary: {
      diagnosticOnly: true,
      momentumAuditDoesNotValidatePhysicalSource: true,
      passWindowCannotBeUsedAsSourceModelInput: true,
      missingMomentumMechanismBlocksClosure: true,
      currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true,
    },
  }) as Nhm2SourceMomentumDensityAuditArtifactV1;

const atlas = (
  tensorBasis: "chart" | "local_orthonormal_to_chart",
): Nhm2RegionalSupportFunctionAtlasV1 =>
  ({
    runIdentity: {
      runId: "projection-test",
      profileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      metricRef: "metric.json",
      sourceModelRef: "source.json",
      gridRef: "grid:local-orthonormal",
      samplePlanRef: "samples.json",
      createdAt: "2026-06-19T00:00:00.000Z",
    },
    basisAndUnits: {
      tensorBasis,
      coordinateSystem: "comoving_cartesian",
      lengthUnit: "m",
      energyDensityUnit: "J/m^3",
      stressEnergyConvention: "T_mu_nu_same_chart",
      signatureConvention: "(-,+,+,+)",
    },
    provenance: {
      generatedFrom: ["test"],
      inputHashes: {},
      atlasHash: "atlas-hash",
      targetEchoForbidden: true,
      targetDerivedFieldsUsed: false,
    },
  }) as Nhm2RegionalSupportFunctionAtlasV1;

const projectionEvidence = (): Nhm2MomentumFrameProjectionEvidenceV1 =>
  ({
    contractVersion: "nhm2_momentum_frame_projection_evidence/v1",
    generatedAt: "2026-06-19T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "projection-test",
    regionalSupportFunctionAtlasRef: "atlas.json",
    atlasHash: "atlas-hash",
    frame: {
      frameId: "declared-reduced-order-local-frame",
      requestedFrame: "local_orthonormal",
      sourceTensorBasis: "local_orthonormal_to_chart",
      tetradRef: "declared://nhm2/reduced-order/comoving-orthonormal-frame",
      projectionMethod: "declared_reduced_order_local_orthonormal",
      ratioPolicy: "use_audit_same_chart_ratios_as_local_frame_reduced_order",
      projectionStatus: "pass",
      assumptions: [
        "reduced-order smoke-chain frame evidence only",
        "does not replace a full ADM tetrad receipt",
      ],
      blockers: [],
    },
    components: [],
    claimBoundary: {
      diagnosticOnly: true,
      projectionEvidenceDoesNotValidatePhysicalSource: true,
      reducedOrderFrameDoesNotReplaceFullAdmTetrad: true,
      causalBoundConclusionRequiresProjectionStatusPass: true,
    },
  }) as Nhm2MomentumFrameProjectionEvidenceV1;

describe("nhm2_momentum_frame_projection_receipt/v1", () => {
  it("blocks causal momentum-bound applicability for chart-basis tensors", () => {
    const artifact = buildNhm2MomentumFrameProjectionReceipt({
      sourceMomentumDensityAudit: audit(),
      regionalSupportFunctionAtlas: atlas("chart"),
    });

    expect(artifact.frame.projectionStatus).toBe("blocked");
    expect(artifact.summary.projectionAvailable).toBe(false);
    expect(artifact.summary.causalBoundApplicabilityStatus).toBe("blocked");
    expect(artifact.summary.anyProjectedMetricRequiredCausalMomentumBoundViolation).toBeNull();
    expect(artifact.summary.firstBlocker).toBe(
      "local_orthonormal_tetrad_or_projection_receipt_missing",
    );
    expect(isNhm2MomentumFrameProjectionReceipt(artifact)).toBe(true);
  });

  it("projects ratios only when local orthonormal-to-chart basis evidence exists", () => {
    const artifact = buildNhm2MomentumFrameProjectionReceipt({
      sourceMomentumDensityAudit: audit(),
      regionalSupportFunctionAtlas: atlas("local_orthonormal_to_chart"),
    });

    expect(artifact.frame.projectionStatus).toBe("pass");
    expect(artifact.summary.projectionAvailable).toBe(true);
    expect(artifact.summary.causalBoundApplicabilityStatus).toBe("applicable");
    expect(artifact.summary.worstProjectedMetricRequiredMomentumToEnergyRatio).toBe(2);
    expect(artifact.summary.anyProjectedMetricRequiredCausalMomentumBoundViolation).toBe(true);
    expect(isNhm2MomentumFrameProjectionReceipt(artifact)).toBe(true);
  });

  it("uses explicit projection evidence without silently inferring it from chart basis", () => {
    const artifact = buildNhm2MomentumFrameProjectionReceipt({
      sourceMomentumDensityAudit: audit(),
      regionalSupportFunctionAtlas: atlas("chart"),
      momentumFrameProjectionEvidence: projectionEvidence(),
      momentumFrameProjectionEvidenceRef: "projection-evidence.json",
    });

    expect(artifact.frame.projectionStatus).toBe("pass");
    expect(artifact.frame.projectionMethod).toBe(
      "declared_reduced_order_local_orthonormal",
    );
    expect(artifact.momentumFrameProjectionEvidenceRef).toBe("projection-evidence.json");
    expect(artifact.summary.projectionAvailable).toBe(true);
    expect(artifact.summary.causalBoundApplicabilityStatus).toBe("applicable");
    expect(artifact.summary.worstProjectedMetricRequiredMomentumToEnergyRatio).toBe(2);
    expect(artifact.summary.anyProjectedMetricRequiredCausalMomentumBoundViolation).toBe(true);
    expect(isNhm2MomentumFrameProjectionReceipt(artifact)).toBe(true);
  });
});
