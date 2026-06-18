import { describe, expect, it } from "vitest";

import {
  buildNhm2SourceOffDiagonalShearAudit,
  isNhm2SourceOffDiagonalShearAudit,
} from "../shared/contracts/nhm2-source-off-diagonal-shear-audit.v1";
import type { Nhm2RegionalFullTensorResidualArtifactV1 } from "../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import type { Nhm2SourceComponentAuthorityLedgerArtifactV1 } from "../shared/contracts/nhm2-source-component-authority-ledger.v1";

const residual = (): Nhm2RegionalFullTensorResidualArtifactV1 =>
  ({
    contractVersion: "nhm2_regional_full_tensor_residual/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "shear-audit-test",
    regionalSourceClosureEvidenceRef: "closure.json",
    requiredComponents: ["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"],
    requiredRegions: ["global", "hull", "wall", "exterior_shell"],
    regions: [
      {
        regionId: "hull",
        status: "fail",
        metricTensorRef: "metric#hull",
        tileTensorRef: "source#hull",
        metricTensorAuthorityMode: "full_tensor",
        tileTensorAuthorityMode: "full_tensor",
        missingMetricComponentIds: [],
        missingTileComponentIds: [],
        componentResiduals: [
          {
            componentId: "T00",
            family: "t00",
            metricRequired: -1,
            tileEffectiveCounterpart: -680000000,
            absResidual: 0,
            relResidual: 0,
            passWindow: {
              minCounterpartForPassSI: -1.1,
              maxCounterpartForPassSI: -0.9,
              toleranceAbsSI: 0.1,
              derivedFromMetricRequiredTensor: true,
              sourceModelInputAllowed: false,
            },
            correctionHint: {
              status: "already_within_tolerance",
              signedDeltaToNearestPassSI: 0,
              currentToAllowedMagnitudeRatio: null,
            },
            status: "pass",
            blockers: [],
          },
          {
            componentId: "T12",
            family: "off_diagonal_tij",
            metricRequired: 0,
            tileEffectiveCounterpart: 0,
            absResidual: 0,
            relResidual: 0,
            passWindow: {
              minCounterpartForPassSI: -0.1,
              maxCounterpartForPassSI: 0.1,
              toleranceAbsSI: 0.1,
              derivedFromMetricRequiredTensor: true,
              sourceModelInputAllowed: false,
            },
            correctionHint: {
              status: "already_within_tolerance",
              signedDeltaToNearestPassSI: 0,
              currentToAllowedMagnitudeRatio: null,
            },
            status: "pass",
            blockers: [],
          },
          {
            componentId: "T13",
            family: "off_diagonal_tij",
            metricRequired: -2e-10,
            tileEffectiveCounterpart: 340000,
            absResidual: 340000,
            relResidual: 1.7e15,
            passWindow: {
              minCounterpartForPassSI: -2.2e-10,
              maxCounterpartForPassSI: -1.8e-10,
              toleranceAbsSI: 2e-11,
              derivedFromMetricRequiredTensor: true,
              sourceModelInputAllowed: false,
            },
            correctionHint: {
              status: "reduce_magnitude_or_reorient",
              signedDeltaToNearestPassSI: -340000.0000000002,
              currentToAllowedMagnitudeRatio: 1.5e15,
            },
            status: "fail",
            blockers: ["hull:T13:full_tensor_residual_exceeded"],
          },
          {
            componentId: "T23",
            family: "off_diagonal_tij",
            metricRequired: 0,
            tileEffectiveCounterpart: 0,
            absResidual: 0,
            relResidual: 0,
            passWindow: {
              minCounterpartForPassSI: -0.1,
              maxCounterpartForPassSI: 0.1,
              toleranceAbsSI: 0.1,
              derivedFromMetricRequiredTensor: true,
              sourceModelInputAllowed: false,
            },
            correctionHint: {
              status: "already_within_tolerance",
              signedDeltaToNearestPassSI: 0,
              currentToAllowedMagnitudeRatio: null,
            },
            status: "pass",
            blockers: [],
          },
        ],
        familyResiduals: [],
        t00RelResidual: 0,
        fullRelLInf: 1.7e15,
        fullAbsLInf: 340000,
        toleranceRelLInf: 0.1,
        worstComponentId: "T13",
        worstComponentRelResidual: 1.7e15,
        blockers: ["hull:T13:full_tensor_residual_exceeded"],
      },
    ],
    summary: {
      allRequiredRegionsPresent: true,
      allRequiredComponentsPresent: true,
      t00ResidualsPass: true,
      fullTensorResidualsPass: false,
      anyAtlasMismatch: false,
      worstRegionId: "hull",
      worstComponentId: "T13",
      worstResidualFamily: "off_diagonal_tij",
      worstRelResidual: 1.7e15,
      firstBlocker: "hull:T13:full_tensor_residual_exceeded",
      firstBlockerFamily: "off_diagonal_tij",
      blockerCount: 1,
    },
    claimBoundary: {
      diagnosticOnly: true,
      fullTensorResidualDoesNotValidatePhysicalSource: true,
      missingComponentsCannotBeZeroFilled: true,
      globalResidualCannotMaskRegionalFailure: true,
    },
  }) as Nhm2RegionalFullTensorResidualArtifactV1;

const ledger = (sourceModelId = "nhm2_regional_material_source_tensor_model"): Nhm2SourceComponentAuthorityLedgerArtifactV1 =>
  ({
    contractVersion: "nhm2_source_component_authority_ledger/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "shear-audit-test",
    counterpartArtifactRef: "counterpart.json",
    sourceTensorArtifactRef: "source.json",
    regions: [
      {
        regionId: "hull",
        status: "review",
        comparisonRole: "tile_effective_counterpart",
        tensorAuthorityMode: "full_tensor",
        chartRef: "comoving_cartesian",
        unitsRef: "J/m^3",
        regionMaskRef: "mask:hull",
        aggregationMode: "mean",
        normalizationBasis: "sample_count",
        sampleCount: 8,
        components: ["T12", "T13", "T23"].map((componentId) => ({
          componentId,
          valueSI: componentId === "T13" ? 340000 : 0,
          authority: "source_model",
          componentGroup: "spatial_stress_off_diagonal",
          receiptRef: "source.json",
          provenance: {
            counterpartRegionRef: "counterpart.json#hull",
            derivationMode: "tile_model_direct_full_tensor",
            sourceModelId,
            sourceModelVersion: "nhm2_regional_material_source_tensor_model/v1",
            notDerivedFromMetricRequiredTensor: true,
          },
          blockers: [],
        })),
        blockers: [],
      },
    ],
    summary: {
      allRequiredRegionsPresent: true,
      allRequiredComponentsPresent: true,
      allRequiredComponentsAuthoritative: true,
      allRequiredComponentsAdmissible: true,
      sourceSideComponentAuthorityComplete: true,
      hasWallFullTensorAuthority: false,
      anyMetricEcho: false,
      anyScalarProxy: false,
      anyMissing: false,
      anyReducedOrder: false,
      missingComponentRefs: [],
      proxyComponentRefs: [],
      metricEchoComponentRefs: [],
      reducedOrderComponentRefs: [],
      firstBlocker: null,
      blockerCount: 0,
    },
    claimBoundary: {
      diagnosticOnly: true,
      componentAuthorityDoesNotValidateMaterialSource: true,
      metricEchoForbidden: true,
      scalarProxyCannotProvideFullTensorAuthority: true,
      missingComponentsCannotBeZeroFilled: true,
    },
  }) as Nhm2SourceComponentAuthorityLedgerArtifactV1;

describe("nhm2_source_off_diagonal_shear_audit/v1", () => {
  it("flags a huge off-diagonal residual without a documented shear mechanism as a falsifier candidate", () => {
    const artifact = buildNhm2SourceOffDiagonalShearAudit({
      sourceComponentAuthorityLedger: ledger(),
      regionalFullTensorResidual: residual(),
    });

    const hullT13 = artifact.regions
      .find((region) => region.regionId === "hull")
      ?.components.find((component) => component.componentId === "T13");
    expect(hullT13?.mechanismStatus).toBe("missing");
    expect(hullT13?.sourceFractionOfAbsT00).toBeCloseTo(0.0005);
    expect(hullT13?.metricRequiredFractionOfAbsT00).toBeCloseTo(2e-10);
    expect(hullT13?.fractionalSuppressionToRequirement).toBeCloseTo(
      2_500_000,
    );
    expect(hullT13?.blockers).toContain("off_diagonal_shear_mechanism_missing");
    expect(hullT13?.blockers).toContain("off_diagonal_component_residual_exceeded");
    expect(artifact.summary.uniformFractionalShearAnsatzDetected).toBe(false);
    expect(artifact.summary.sourceFractionByComponent.T13).toBeCloseTo(0.0005);
    expect(artifact.summary.worstFractionalSuppressionToRequirement).toBeCloseTo(
      2_500_000,
    );
    expect(artifact.summary.falsifierCandidate).toBe(true);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(false);
    expect(artifact.summary.falsifierScope).toBe("none");
    expect(artifact.summary.falsifierReason).toBe(
      "off_diagonal_shear_residual_and_missing_mechanism_require_new_source_model_evidence",
    );
    expect(artifact.summary.worstCurrentToAllowedMagnitudeRatio).toBe(1.5e15);
    expect(isNhm2SourceOffDiagonalShearAudit(artifact)).toBe(true);
  });

  it("separates documented shear mechanism evidence from residual closure", () => {
    const artifact = buildNhm2SourceOffDiagonalShearAudit({
      sourceComponentAuthorityLedger: ledger("anisotropic_shear_constitutive_model"),
      regionalFullTensorResidual: residual(),
    });

    const hullT13 = artifact.regions
      .find((region) => region.regionId === "hull")
      ?.components.find((component) => component.componentId === "T13");
    expect(hullT13?.mechanismStatus).toBe("documented");
    expect(hullT13?.blockers).not.toContain("off_diagonal_shear_mechanism_missing");
    expect(hullT13?.blockers).toContain("off_diagonal_component_residual_exceeded");
    expect(artifact.summary.falsifierCandidate).toBe(false);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(false);
    expect(artifact.summary.falsifierScope).toBe("none");
    expect(artifact.summary.falsifierReason).toBeNull();
    expect(artifact.summary.allOffDiagonalWithinTolerance).toBe(false);
  });

  it("promotes a uniform missing-mechanism fractional shear ansatz to a current-model falsifier", () => {
    const residualInput = residual();
    const ledgerInput = ledger();
    residualInput.regions = [
      ...residualInput.regions,
      {
        ...residualInput.regions[0],
        regionId: "global",
        metricTensorRef: "metric#global",
        tileTensorRef: "source#global",
      },
    ];
    ledgerInput.regions = [
      ...ledgerInput.regions,
      {
        ...ledgerInput.regions[0],
        regionId: "global",
        regionMaskRef: "mask:global",
        components: ledgerInput.regions[0].components.map((component) => ({
          ...component,
          provenance: {
            ...component.provenance,
            counterpartRegionRef: "counterpart.json#global",
          },
        })),
      },
    ];

    const artifact = buildNhm2SourceOffDiagonalShearAudit({
      sourceComponentAuthorityLedger: ledgerInput,
      regionalFullTensorResidual: residualInput,
    });

    expect(artifact.summary.uniformFractionalShearAnsatzDetected).toBe(true);
    expect(artifact.summary.falsifierCandidate).toBe(true);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(true);
    expect(artifact.summary.falsifierScope).toBe("current_declared_source_model");
    expect(artifact.summary.falsifierReason).toBe(
      "declared_uniform_fractional_off_diagonal_shear_without_mechanism_exceeds_required_suppression",
    );
  });

  it("does not classify documented all-zero shear suppression as the falsified fractional ansatz", () => {
    const residualInput = residual();
    const ledgerInput = ledger("axis_aligned_constitutive_shear_suppression");
    for (const region of residualInput.regions) {
      for (const component of region.componentResiduals) {
        if (component.componentId === "T12" || component.componentId === "T13" || component.componentId === "T23") {
          component.tileEffectiveCounterpart = 0;
          component.absResidual = Math.abs(component.metricRequired ?? 0);
          component.relResidual = component.metricRequired === 0 ? 0 : 1;
          component.status = component.metricRequired === 0 ? "pass" : "fail";
          component.correctionHint.status =
            component.metricRequired === 0 ? "already_within_tolerance" : "increase_magnitude";
          component.correctionHint.currentToAllowedMagnitudeRatio = 0;
        }
      }
    }
    for (const region of ledgerInput.regions) {
      for (const component of region.components) {
        if (component.componentId === "T12" || component.componentId === "T13" || component.componentId === "T23") {
          component.valueSI = 0;
        }
      }
    }

    const artifact = buildNhm2SourceOffDiagonalShearAudit({
      sourceComponentAuthorityLedger: ledgerInput,
      regionalFullTensorResidual: residualInput,
    });

    const hullT13 = artifact.regions
      .find((region) => region.regionId === "hull")
      ?.components.find((component) => component.componentId === "T13");
    expect(hullT13?.mechanismStatus).toBe("documented");
    expect(hullT13?.blockers).toEqual(["off_diagonal_component_residual_exceeded"]);
    expect(artifact.summary.sourceFractionByComponent.T12).toBe(0);
    expect(artifact.summary.sourceFractionByComponent.T13).toBe(0);
    expect(artifact.summary.sourceFractionByComponent.T23).toBe(0);
    expect(artifact.summary.uniformFractionalShearAnsatzDetected).toBe(false);
    expect(artifact.summary.anyShearMechanismMissing).toBe(false);
    expect(artifact.summary.falsifierCandidate).toBe(false);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(false);
    expect(artifact.summary.falsifierScope).toBe("none");
    expect(artifact.summary.falsifierReason).toBeNull();
  });
});
