import { describe, expect, it } from "vitest";

import type { Nhm2RegionalFullTensorResidualArtifactV1 } from "../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import type { Nhm2RegionalSupportFunctionAtlasV1 } from "../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  buildNhm2SourceMomentumDensityAudit,
  isNhm2SourceMomentumDensityAudit,
} from "../shared/contracts/nhm2-source-momentum-density-audit.v1";
import type { Nhm2SourceComponentAuthorityLedgerArtifactV1 } from "../shared/contracts/nhm2-source-component-authority-ledger.v1";

const regionIds = ["global", "hull", "wall", "exterior_shell"] as const;

const residual = (): Nhm2RegionalFullTensorResidualArtifactV1 =>
  ({
    contractVersion: "nhm2_regional_full_tensor_residual/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "momentum-audit-test",
    regionalSourceClosureEvidenceRef: "closure.json",
    requiredComponents: ["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"],
    requiredRegions: ["global", "hull", "wall", "exterior_shell"],
    regions: regionIds.map((regionId) => ({
      regionId,
      status: "fail",
      metricTensorRef: `metric#${regionId}`,
      tileTensorRef: `source#${regionId}`,
      metricTensorAuthorityMode: "full_tensor",
      tileTensorAuthorityMode: "full_tensor",
      missingMetricComponentIds: [],
      missingTileComponentIds: [],
      componentResiduals: [
        {
          componentId: "T00",
          family: "t00",
          metricRequired: -1_000_000_000,
          tileEffectiveCounterpart: -1_000_000_000,
          absResidual: 0,
          relResidual: 0,
          passWindow: {
            minCounterpartForPassSI: -1_100_000_000,
            maxCounterpartForPassSI: -900_000_000,
            toleranceAbsSI: 100_000_000,
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
          componentId: "T01",
          family: "momentum_t0i",
          metricRequired: -1_000_000,
          tileEffectiveCounterpart: 1_000,
          absResidual: 1_001_000,
          relResidual: 1.001,
          passWindow: {
            minCounterpartForPassSI: -1_100_000,
            maxCounterpartForPassSI: -900_000,
            toleranceAbsSI: 100_000,
            derivedFromMetricRequiredTensor: true,
            sourceModelInputAllowed: false,
          },
          correctionHint: {
            status: "increase_magnitude",
            signedDeltaToNearestPassSI: -901_000,
            currentToAllowedMagnitudeRatio: 0.001,
          },
          status: "fail",
          blockers: [`${regionId}:T01:full_tensor_residual_exceeded`],
        },
        {
          componentId: "T02",
          family: "momentum_t0i",
          metricRequired: 1e24,
          tileEffectiveCounterpart: -500,
          absResidual: 1e24,
          relResidual: 1,
          passWindow: {
            minCounterpartForPassSI: 9e23,
            maxCounterpartForPassSI: 1.1e24,
            toleranceAbsSI: 1e23,
            derivedFromMetricRequiredTensor: true,
            sourceModelInputAllowed: false,
          },
          correctionHint: {
            status: "increase_magnitude",
            signedDeltaToNearestPassSI: 9e23,
            currentToAllowedMagnitudeRatio: 4.5e-22,
          },
          status: "fail",
          blockers: [`${regionId}:T02:full_tensor_residual_exceeded`],
        },
        {
          componentId: "T03",
          family: "momentum_t0i",
          metricRequired: -100_000_000,
          tileEffectiveCounterpart: 200,
          absResidual: 100_000_200,
          relResidual: 1.000002,
          passWindow: {
            minCounterpartForPassSI: -110_000_000,
            maxCounterpartForPassSI: -90_000_000,
            toleranceAbsSI: 10_000_000,
            derivedFromMetricRequiredTensor: true,
            sourceModelInputAllowed: false,
          },
          correctionHint: {
            status: "increase_magnitude",
            signedDeltaToNearestPassSI: -90_000_200,
            currentToAllowedMagnitudeRatio: 0.000002,
          },
          status: "fail",
          blockers: [`${regionId}:T03:full_tensor_residual_exceeded`],
        },
      ],
      familyResiduals: [],
      t00RelResidual: 0,
      fullRelLInf: 1.001,
      fullAbsLInf: 1e24,
      toleranceRelLInf: 0.1,
      worstComponentId: "T01",
      worstComponentRelResidual: 1.001,
      blockers: [`${regionId}:T01:full_tensor_residual_exceeded`],
    })),
    summary: {
      allRequiredRegionsPresent: true,
      allRequiredComponentsPresent: true,
      t00ResidualsPass: true,
      fullTensorResidualsPass: false,
      anyAtlasMismatch: false,
      worstRegionId: "hull",
      worstComponentId: "T01",
      worstResidualFamily: "momentum_t0i",
      worstRelResidual: 1.001,
      firstBlocker: "hull:T01:full_tensor_residual_exceeded",
      firstBlockerFamily: "momentum_t0i",
      blockerCount: 4,
    },
    claimBoundary: {
      diagnosticOnly: true,
      fullTensorResidualDoesNotValidatePhysicalSource: true,
      missingComponentsCannotBeZeroFilled: true,
      globalResidualCannotMaskRegionalFailure: true,
    },
  }) as Nhm2RegionalFullTensorResidualArtifactV1;

const ledger = (sourceModelId = "axis_aligned_constitutive_shear_suppression"): Nhm2SourceComponentAuthorityLedgerArtifactV1 =>
  ({
    contractVersion: "nhm2_source_component_authority_ledger/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "momentum-audit-test",
    counterpartArtifactRef: "counterpart.json",
    sourceTensorArtifactRef: "source.json",
    regions: regionIds.map((regionId) => ({
      regionId,
      status: "review",
      comparisonRole: "tile_effective_counterpart",
      tensorAuthorityMode: "full_tensor",
      chartRef: "comoving_cartesian",
      unitsRef: "J/m^3",
      regionMaskRef: `mask:${regionId}`,
      aggregationMode: "mean",
      normalizationBasis: "sample_count",
      sampleCount: 8,
      components: [
        ["T01", 1_000],
        ["T02", -500],
        ["T03", 200],
      ].map(([componentId, valueSI]) => ({
        componentId,
        valueSI,
        authority: "source_model",
        componentGroup: "momentum_density",
        receiptRef: "source.json",
        provenance: {
          counterpartRegionRef: `counterpart.json#${regionId}`,
          derivationMode: "tile_model_direct_full_tensor",
          sourceModelId,
          sourceModelVersion: "nhm2_regional_material_source_tensor_model/v1",
          notDerivedFromMetricRequiredTensor: true,
        },
        blockers: [],
      })),
      blockers: [],
    })),
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

const atlas = (
  tensorBasis: Nhm2RegionalSupportFunctionAtlasV1["basisAndUnits"]["tensorBasis"],
): Nhm2RegionalSupportFunctionAtlasV1 =>
  ({
    contractVersion: "nhm2_regional_support_function_atlas/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "momentum-audit-test",
    chartId: "comoving_cartesian",
    metricFamily: "nhm2_shift_lapse",
    runIdentity: {
      runId: "momentum-audit-test",
      profileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      metricRef: "metric.json",
      sourceModelRef: "source.json",
      gridRef: "grid:local-frame",
      samplePlanRef: "samples.json",
      createdAt: "2026-06-18T00:00:00.000Z",
    },
    basisAndUnits: {
      tensorBasis,
      coordinateSystem: "comoving_cartesian",
      lengthUnit: "m",
      energyDensityUnit: "J/m^3",
      stressEnergyConvention: "T_mu_nu_same_chart",
      signatureConvention: "(-,+,+,+)",
    },
    regions: {},
    transitionKernels: [],
    partitionOfUnity: {
      appliesTo: ["global", "hull", "wall", "exterior_shell"],
      sumWeightsMean: 1,
      sumWeightsMaxAbsError: 0,
      negativeWeightMin: 0,
      overlapPolicy: "partition_of_unity",
      status: "pass",
    },
    derivativeSupport: {
      partialMuWAvailable: true,
      covariantDerivativeSupportAvailable: true,
      derivativeBasis: "chart",
      derivativeRef: "derivatives.json",
      transitionDerivativeTermsRequired: true,
    },
    provenance: {
      generatedFrom: ["test"],
      inputHashes: {},
      atlasHash: "atlas-hash",
      targetEchoForbidden: true,
      targetDerivedFieldsUsed: false,
    },
    eligibility: {
      atlasAvailable: true,
      sameRunIdentityAvailable: true,
      sameBasisMetadataAvailable: true,
      downstreamConsumersRequired: [],
      atlasEligibleForClosureHarness: true,
    },
  }) as Nhm2RegionalSupportFunctionAtlasV1;

describe("nhm2_source_momentum_density_audit/v1", () => {
  it("keeps chart-basis causal momentum ratios blocked until a local-frame projection receipt exists", () => {
    const artifact = buildNhm2SourceMomentumDensityAudit({
      sourceComponentAuthorityLedger: ledger(),
      regionalFullTensorResidual: residual(),
      regionalSupportFunctionAtlas: atlas("chart"),
    });

    expect(artifact.summary.uniformFractionalMomentumAnsatzDetected).toBe(true);
    expect(artifact.summary.anyMetricRequiredCausalMomentumBoundViolation).toBe(true);
    expect(artifact.summary.anySourceCausalMomentumBoundViolation).toBe(false);
    expect(artifact.summary.causalMomentumBoundApplicabilityStatus).toBe("blocked");
    expect(artifact.summary.causalMomentumBoundApplicabilityBlockers[0]).toContain(
      "causal_momentum_bound_requires_local_orthonormal_frame",
    );
    expect(artifact.summary.worstMetricRequiredMomentumToEnergyRatio ?? 0).toBeGreaterThan(1e14);
    expect(artifact.summary.anyMomentumMechanismMissing).toBe(true);
    expect(artifact.summary.falsifierCandidate).toBe(true);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(true);
    expect(artifact.summary.causalMaterialMomentumBoundFalsifier).toBe(false);
    expect(artifact.summary.falsifierReason).toBe(
      "declared_uniform_fractional_momentum_density_without_mechanism_exceeds_required_amplification",
    );
    expect(artifact.summary.worstComponentId).toBe("T02");
    expect(artifact.summary.worstRequiredAmplificationToPass ?? 0).toBeGreaterThan(1e21);
    expect(artifact.summary.sourceFractionByComponent.T01).toBeCloseTo(0.000001);
    expect(isNhm2SourceMomentumDensityAudit(artifact)).toBe(true);
  });

  it("allows causal material momentum-bound falsifiers only with local orthonormal basis evidence", () => {
    const artifact = buildNhm2SourceMomentumDensityAudit({
      sourceComponentAuthorityLedger: ledger("poynting_flux_constitutive_momentum_model"),
      regionalFullTensorResidual: residual(),
      regionalSupportFunctionAtlas: atlas("local_orthonormal_to_chart"),
    });

    expect(artifact.summary.causalMomentumBoundApplicabilityStatus).toBe("applicable");
    expect(artifact.summary.causalMomentumBoundFrameRef).toBe("grid:local-frame");
    expect(artifact.summary.anyMetricRequiredCausalMomentumBoundViolation).toBe(true);
    expect(artifact.summary.causalMaterialMomentumBoundFalsifier).toBe(true);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(false);
    expect(artifact.summary.falsifierReason).toBe(
      "metric_required_momentum_density_exceeds_causal_material_momentum_bound",
    );
  });

  it("separates documented momentum mechanism evidence from residual closure", () => {
    const artifact = buildNhm2SourceMomentumDensityAudit({
      sourceComponentAuthorityLedger: ledger("poynting_flux_constitutive_momentum_model"),
      regionalFullTensorResidual: residual(),
      regionalSupportFunctionAtlas: atlas("chart"),
    });

    expect(artifact.summary.anyMomentumMechanismMissing).toBe(false);
    expect(artifact.summary.causalMaterialMomentumBoundFalsifier).toBe(false);
    expect(artifact.summary.causalMomentumBoundApplicabilityStatus).toBe("blocked");
    expect(artifact.summary.falsifierCandidate).toBe(false);
    expect(artifact.summary.currentDeclaredSourceModelFalsified).toBe(false);
    expect(artifact.summary.falsifierScope).toBe("none");
    expect(artifact.summary.allMomentumWithinTolerance).toBe(false);
    expect(artifact.regions[0].components[0].mechanismStatus).toBe("documented");
  });
});
