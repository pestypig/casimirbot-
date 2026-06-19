import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildNhm2DynamicGeometrySamples,
  isNhm2DynamicGeometrySamplesArtifact,
} from "../shared/contracts/nhm2-dynamic-geometry-samples.v1";
import type { Nhm2ObserverRobustEnergyConditionArtifactV1 } from "../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import type { Nhm2QeiWorldlineDossierV1 } from "../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  buildNhm2EffectiveGeometryReference,
  isNhm2EffectiveGeometryReference,
} from "../shared/contracts/nhm2-effective-geometry-reference.v1";
import {
  buildNhm2AveragedSourceTensorReceipt,
  isNhm2AveragedSourceTensorReceipt,
} from "../shared/contracts/nhm2-averaged-source-tensor-receipt.v1";
import {
  buildNhm2BackreactionResidualReceipt,
  isNhm2BackreactionResidualReceipt,
} from "../shared/contracts/nhm2-backreaction-residual-receipt.v1";
import { buildNhm2TileEffectiveFullTensorSourceArtifact } from "../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";
import type { Nhm2RegionalFullTensorResidualArtifactV1 } from "../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import type { Nhm2SourceComponentAuthorityLedgerArtifactV1 } from "../shared/contracts/nhm2-source-component-authority-ledger.v1";
import type { Nhm2SourceMomentumDensityAuditArtifactV1 } from "../shared/contracts/nhm2-source-momentum-density-audit.v1";
import type { Nhm2SourceOffDiagonalShearAuditArtifactV1 } from "../shared/contracts/nhm2-source-off-diagonal-shear-audit.v1";
import {
  buildNhm2DynamicEffectiveGeometryEvidence,
  buildNhm2FrequencyConvergenceEvidence,
  buildNhm2SwitchingConservationEvidence,
  buildNhm2TimeDependentSourceCampaign,
  isNhm2DynamicEffectiveGeometryEvidence,
  isNhm2FrequencyConvergenceEvidence,
  isNhm2SwitchingConservationEvidence,
  isNhm2TimeDependentSourceCampaignArtifact,
  type Nhm2CampaignStabilityEvidenceV1,
  type Nhm2DynamicEffectiveGeometryEvidenceV1,
  type Nhm2FrequencyConvergenceEvidenceV1,
  type Nhm2SwitchingConservationEvidenceV1,
} from "../shared/contracts/nhm2-time-dependent-source-campaign.v1";
import { runNhm2DynamicGeometrySamples } from "../tools/nhm2/build-dynamic-geometry-samples";
import { runNhm2DynamicEffectiveGeometryEvidence } from "../tools/nhm2/build-dynamic-effective-geometry-evidence";
import { runNhm2BackreactionResidualReceipt } from "../tools/nhm2/build-backreaction-residual-receipt";

const encodedR32 = (values: number[]): string => {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  return bytes.toString("base64");
};

const writeBrick = (
  repoRoot: string,
  path: string,
  channelValues: Record<string, number[]>,
) => {
  const firstChannel = Object.values(channelValues)[0] ?? [0];
  writeFileSync(
    join(repoRoot, path),
    `${JSON.stringify({
      kind: "gr-evolve-brick",
      dims: [firstChannel.length, 1, 1],
      format: "r32f",
      channelOrder: Object.keys(channelValues),
      channels: Object.fromEntries(
        Object.entries(channelValues).map(([channelId, values]) => [
          channelId,
          { data: encodedR32(values), min: Math.min(...values), max: Math.max(...values) },
        ]),
      ),
    })}\n`,
    "utf8",
  );
};

const fullSourceTensor = {
  T00: -1,
  T01: 0,
  T02: 0,
  T03: 0,
  T10: 0,
  T11: 1,
  T12: 0,
  T13: 0,
  T20: 0,
  T21: 0,
  T22: 1,
  T23: 0,
  T30: 0,
  T31: 0,
  T32: 0,
  T33: 1,
};

const sourceRegion = (regionId: "global" | "hull" | "wall" | "exterior_shell") => ({
  regionId,
  status: "review" as const,
  tensorAuthorityMode: "full_tensor" as const,
  tensor: fullSourceTensor,
  symmetry: { declared: false, kind: "none" as const, lowerComponentsDerivedBySymmetry: false },
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: `mask:${regionId}`,
  aggregationMode: "mean" as const,
  normalizationBasis: "sample_count" as const,
  sampleCount: 1,
  sourceSupport: {
    supportKernelId: `support:${regionId}`,
    cycleAverageStatus: "pass" as const,
    dutyCycleStatus: "pass" as const,
    lightCrossingConsistencyStatus: "review" as const,
  },
  provenance: {
    producerModule: "source-test",
    producerFunction: "emit",
    derivationMode: "source_model_direct_full_tensor" as const,
    inputRefs: [`source:${regionId}`],
    preAggregationValueRefs: [`pre:${regionId}`],
    notDerivedFromMetricRequiredTensor: true,
  },
  blockers: ["qei_dossier_not_pass", "conservation_unknown"],
});

const averagedSourceTensor = () =>
  buildNhm2TileEffectiveFullTensorSourceArtifact({
    generatedAt: "2026-06-18T00:00:00.000Z",
    runId: "campaign-test",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    expectedProfileId: "stage1_centerline_alpha_0p995_v1",
    laneId: "nhm2_shift_lapse",
    sourceModel: {
      sourceModelId: "source-test",
      sourceModelVersion: "v1",
      sourceModelClass: "cycle_averaged_tile_model",
      sourceSideOnly: true,
      notDerivedFromMetricRequiredTensor: true,
      metricRequiredInputRefs: [],
      sourceInputRefs: ["source-input.json"],
      qeiDossierRef: null,
      conservationRef: null,
    },
    regions: [
      sourceRegion("global"),
      sourceRegion("hull"),
      sourceRegion("wall"),
      sourceRegion("exterior_shell"),
    ],
    literatureRefs: ["fewster_thompson_2023_stationary_worldline_qei"],
  });

const completeLedger = (
  summary?: Partial<Nhm2SourceComponentAuthorityLedgerArtifactV1["summary"]>,
): Nhm2SourceComponentAuthorityLedgerArtifactV1 =>
  ({
    contractVersion: "nhm2_source_component_authority_ledger/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "campaign-test",
    counterpartArtifactRef: "counterpart.json",
    sourceTensorArtifactRef: "source.json",
    regions: [],
    summary: {
      allRequiredRegionsPresent: true,
      allRequiredComponentsPresent: true,
      allRequiredComponentsAuthoritative: true,
      allRequiredComponentsAdmissible: true,
      sourceSideComponentAuthorityComplete: true,
      hasWallFullTensorAuthority: true,
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
      ...summary,
    },
    claimBoundary: {
      diagnosticOnly: true,
      componentAuthorityDoesNotValidateMaterialSource: true,
      metricEchoForbidden: true,
      scalarProxyCannotProvideFullTensorAuthority: true,
      missingComponentsCannotBeZeroFilled: true,
    },
  }) as Nhm2SourceComponentAuthorityLedgerArtifactV1;

const momentumAudit = (): Nhm2SourceMomentumDensityAuditArtifactV1 =>
  ({
    contractVersion: "nhm2_source_momentum_density_audit/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "campaign-test",
    sourceComponentAuthorityLedgerRef: "ledger.json",
    regionalFullTensorResidualRef: "residual.json",
    regionalSupportFunctionAtlasRef: "atlas.json",
    regions: [],
    summary: {
      allMomentumComponentsPresent: true,
      allMomentumWithinTolerance: false,
      anyMomentumMechanismMissing: true,
      worstRegionId: "hull",
      worstComponentId: "T02",
      worstRequiredAmplificationToPass: 2.2e21,
      worstMetricRequiredMomentumToEnergyRatio: 2e15,
      worstSourceMomentumToEnergyRatio: 0.000001,
      causalMomentumBoundApplicabilityStatus: "blocked",
      causalMomentumBoundFrameRef: "grid:chart",
      causalMomentumBoundRequiresLocalOrthonormalFrame: true,
      causalMomentumBoundApplicabilityBlockers: [
        "causal_momentum_bound_requires_local_orthonormal_frame:atlas_tensor_basis=chart",
      ],
      anyMetricRequiredCausalMomentumBoundViolation: true,
      anySourceCausalMomentumBoundViolation: false,
      uniformFractionalMomentumAnsatzDetected: true,
      sourceFractionByComponent: {
        T01: 0.000001,
        T02: 0.0000005,
        T03: 0.0000002,
      },
      worstFractionalAmplificationToRequirement: 2e21,
      firstBlocker: "hull:T01:momentum_component_residual_exceeded",
      falsifierCandidate: true,
      currentDeclaredSourceModelFalsified: true,
      causalMaterialMomentumBoundFalsifier: true,
      falsifierScope: "current_declared_source_model",
      falsifierReason:
        "declared_uniform_fractional_momentum_density_without_mechanism_exceeds_required_amplification",
      blockerCount: 12,
    },
    claimBoundary: {
      diagnosticOnly: true,
      momentumAuditDoesNotValidatePhysicalSource: true,
      passWindowCannotBeUsedAsSourceModelInput: true,
      missingMomentumMechanismBlocksClosure: true,
      currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true,
    },
  }) as Nhm2SourceMomentumDensityAuditArtifactV1;

const fullTensorResidual = (
  summary?: Partial<Nhm2RegionalFullTensorResidualArtifactV1["summary"]>,
  missingTileComponentIds: string[] = [],
): Nhm2RegionalFullTensorResidualArtifactV1 =>
  ({
    contractVersion: "nhm2_regional_full_tensor_residual/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "campaign-test",
    regionalSourceClosureEvidenceRef: "closure.json",
    requiredComponents: ["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"],
    requiredRegions: ["global", "hull", "wall", "exterior_shell"],
    regions: [
      {
        regionId: "wall",
        status: missingTileComponentIds.length > 0 ? "missing" : "pass",
        metricTensorRef: "metric#wall",
        tileTensorRef: "source#wall",
        metricTensorAuthorityMode: "full_tensor",
        tileTensorAuthorityMode: "full_tensor",
        missingMetricComponentIds: [],
        missingTileComponentIds,
        componentResiduals: [],
        familyResiduals: [
          {
            family: "t00",
            status: missingTileComponentIds.length > 0 ? "missing" : "pass",
            worstComponentId: "T00",
            worstRelResidual: 0.05,
            maxCurrentToAllowedMagnitudeRatio: 1,
            failingComponentIds: [],
            missingComponentIds: [],
          },
          {
            family: "momentum_t0i",
            status: "pass",
            worstComponentId: null,
            worstRelResidual: null,
            maxCurrentToAllowedMagnitudeRatio: null,
            failingComponentIds: [],
            missingComponentIds: [],
          },
          {
            family: "diagonal_tij",
            status: "pass",
            worstComponentId: null,
            worstRelResidual: null,
            maxCurrentToAllowedMagnitudeRatio: null,
            failingComponentIds: [],
            missingComponentIds: [],
          },
          {
            family: "off_diagonal_tij",
            status: missingTileComponentIds.length > 0 ? "missing" : "pass",
            worstComponentId: missingTileComponentIds.includes("T12") ? "T12" : null,
            worstRelResidual: missingTileComponentIds.includes("T12") ? null : 0,
            maxCurrentToAllowedMagnitudeRatio: missingTileComponentIds.includes("T12") ? 5 : null,
            failingComponentIds: [],
            missingComponentIds: missingTileComponentIds.filter((component) =>
              ["T12", "T13", "T23"].includes(component),
            ) as Array<"T12" | "T13" | "T23">,
          },
        ],
        t00RelResidual: 0.05,
        fullRelLInf: missingTileComponentIds.length > 0 ? null : 0.05,
        fullAbsLInf: missingTileComponentIds.length > 0 ? null : 0.05,
        toleranceRelLInf: 0.1,
        worstComponentId: "T00",
        worstComponentRelResidual: 0.05,
        blockers: missingTileComponentIds.map((component) => `${component}:tile_component_missing`),
      },
    ],
    summary: {
      allRequiredRegionsPresent: true,
      allRequiredComponentsPresent: missingTileComponentIds.length === 0,
      t00ResidualsPass: true,
      fullTensorResidualsPass: missingTileComponentIds.length === 0,
      anyAtlasMismatch: false,
      worstRegionId: "wall",
      worstComponentId: "T00",
      worstResidualFamily: "t00",
      worstRelResidual: 0.05,
      firstBlocker:
        missingTileComponentIds.length === 0
          ? null
          : `${missingTileComponentIds[0]}:tile_component_missing`,
      firstBlockerFamily: null,
      blockerCount: missingTileComponentIds.length,
      ...summary,
    },
    claimBoundary: {
      diagnosticOnly: true,
      fullTensorResidualDoesNotValidatePhysicalSource: true,
      missingComponentsCannotBeZeroFilled: true,
      globalResidualCannotMaskRegionalFailure: true,
    },
  }) as Nhm2RegionalFullTensorResidualArtifactV1;

const qeiDossier = (): Nhm2QeiWorldlineDossierV1 =>
  ({
    contractVersion: "nhm2_qei_worldline_dossier/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    worldlines: [{ worldlineId: "wall-1", blockers: [] }],
    summary: {
      hasWallWorldline: true,
      allMarginsPass: true,
      anyProxy: false,
      dossierComplete: true,
    },
    literatureRefs: ["ford_roman_1996_quantum_inequality"],
    claimBoundary: {
      diagnosticOnly: true,
      scalarMarginCannotSubstituteForDossier: true,
    },
  }) as Nhm2QeiWorldlineDossierV1;

const shearAudit = (): Nhm2SourceOffDiagonalShearAuditArtifactV1 =>
  ({
    contractVersion: "nhm2_source_off_diagonal_shear_audit/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    runId: "campaign-test",
    sourceComponentAuthorityLedgerRef: "authority.json",
    regionalFullTensorResidualRef: "residual.json",
    regions: [],
    summary: {
      allOffDiagonalComponentsPresent: true,
      allOffDiagonalWithinTolerance: false,
      anyShearMechanismMissing: true,
      worstRegionId: "hull",
      worstComponentId: "T13",
      worstCurrentToAllowedMagnitudeRatio: 1.49e15,
      uniformFractionalShearAnsatzDetected: true,
      sourceFractionByComponent: {
        T12: 0.001,
        T13: 0.0005,
        T23: 0.0003,
      },
      worstFractionalSuppressionToRequirement: 5.83e15,
      firstBlocker: "hull:T13:off_diagonal_component_residual_exceeded",
      falsifierCandidate: true,
      currentDeclaredSourceModelFalsified: true,
      falsifierScope: "current_declared_source_model",
      falsifierReason:
        "declared_uniform_fractional_off_diagonal_shear_without_mechanism_exceeds_required_suppression",
      blockerCount: 24,
    },
    claimBoundary: {
      diagnosticOnly: true,
      shearAuditDoesNotValidatePhysicalSource: true,
      passWindowCannotBeUsedAsSourceModelInput: true,
      missingShearMechanismBlocksClosure: true,
      currentModelFalsifierDoesNotProveUniversalSourceImpossibility: true,
    },
  }) as Nhm2SourceOffDiagonalShearAuditArtifactV1;

const observerArtifact = (): Nhm2ObserverRobustEnergyConditionArtifactV1 =>
  ({
    contractVersion: "nhm2_observer_robust_energy_conditions/v1",
    generatedAt: "2026-06-18T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    tensorRef: "source.json",
    observerFamilies: [
      { familyId: "boosted_timelike_grid", status: "pass", blockers: [] },
      { familyId: "null_direction_grid", status: "pass", blockers: [] },
    ],
    summary: {
      eulerianOnly: false,
      robustCheckComplete: true,
      anyViolation: false,
      missedViolationRisk: "low",
    },
    literatureRefs: [
      "le_2026_observer_robust_warp_energy_conditions",
      "santiago_schuster_visser_2021_generic_warp_nec",
    ],
    claimBoundary: {
      diagnosticOnly: true,
      friendlyObserverCannotProveWec: true,
    },
  }) as Nhm2ObserverRobustEnergyConditionArtifactV1;

const frequencyEvidence = (): Nhm2FrequencyConvergenceEvidenceV1 => ({
  contractVersion: "nhm2_frequency_convergence_evidence/v1",
  generatedAt: "2026-06-18T00:00:00.000Z",
  baseFrequencyHz: 1,
  toleranceLInf: 0.1,
  fixedCycleAverageSource: true,
  multipliers: [1, 2, 4, 8],
  entries: [1, 2, 4, 8].map((multiplier) => ({
    multiplier,
    frequencyHz: multiplier,
    residualLInf: 0.01 / multiplier,
    residualL2: 0.005 / multiplier,
    pass: true,
    blockers: [],
  })),
  convergenceStatus: "pass",
  blockers: [],
});

const switchingEvidence = (): Nhm2SwitchingConservationEvidenceV1 => ({
  contractVersion: "nhm2_switching_covariant_conservation_evidence/v1",
  generatedAt: "2026-06-18T00:00:00.000Z",
  staticCovariantConservationRef: "static-conservation.json",
  scheduleRef: "schedule.json",
  sectorBoundaryRef: "sector-boundary.json",
  switchingFunctionRef: "switching.json",
  includesRegionalSupportDerivatives: true,
  includesSectorBoundaryTerms: true,
  includesTimeDerivativeTerms: true,
  includesTransitionKernelTerms: true,
  toleranceLInf: 0.1,
  overallResidualLInf: 0.04,
  terms: [
    {
      termId: "regional_support_derivative",
      included: true,
      residualLInf: 0.01,
      toleranceLInf: 0.1,
      pass: true,
      blockers: [],
    },
    {
      termId: "sector_boundary",
      included: true,
      residualLInf: 0.02,
      toleranceLInf: 0.1,
      pass: true,
      blockers: [],
    },
    {
      termId: "time_derivative",
      included: true,
      residualLInf: 0.03,
      toleranceLInf: 0.1,
      pass: true,
      blockers: [],
    },
    {
      termId: "transition_kernel",
      included: true,
      residualLInf: 0.04,
      toleranceLInf: 0.1,
      pass: true,
      blockers: [],
    },
  ],
  conservationStatus: "pass",
  blockers: [],
});

const dynamicGeometryEvidence = (): Nhm2DynamicEffectiveGeometryEvidenceV1 => ({
  contractVersion: "nhm2_dynamic_effective_geometry_evidence/v1",
  generatedAt: "2026-06-18T00:00:00.000Z",
  dynamicGeometryRef: "dynamic-geometry.json",
  effectiveGeometryRef: "effective-geometry.json",
  averagingWindowSeconds: 1,
  cycleAverageSourceFixed: true,
  averagedSourceTensorRef: "averaged-source.json",
  residualLInf: 0.01,
  residualL2: 0.005,
  bounded: true,
  agreementStatus: "pass",
  blockers: [],
});

const stabilityEvidence = (): Nhm2CampaignStabilityEvidenceV1 => ({
  contractVersion: "nhm2_campaign_stability_evidence/v1",
  generatedAt: "2026-06-18T00:00:00.000Z",
  horizonStatus: "pass",
  blueshiftStatus: "pass",
  particleAccumulationStatus: "pass",
  perturbativeStabilityStatus: "pass",
  blockers: [],
});

describe("NHM2 time-dependent source campaign", () => {
  it("builds switching conservation evidence that fails closed without dynamic terms", () => {
    const evidence = buildNhm2SwitchingConservationEvidence({
      staticCovariantConservationRef: "static-conservation.json",
      scheduleRef: "schedule.json",
      sectorBoundaryRef: "sector-boundary.json",
      switchingFunctionRef: "switching.json",
      terms: {
        regional_support_derivative: 0.01,
      },
    });

    expect(isNhm2SwitchingConservationEvidence(evidence)).toBe(true);
    expect(evidence.conservationStatus).toBe("fail");
    expect(evidence.blockers).toEqual(
      expect.arrayContaining([
        "sector_boundary:sector_boundary_term_missing",
        "time_derivative:time_derivative_term_missing",
        "transition_kernel:transition_kernel_term_missing",
      ]),
    );
  });

  it("builds frequency convergence evidence that fails closed for a single frequency", () => {
    const evidence = buildNhm2FrequencyConvergenceEvidence({
      baseFrequencyHz: 1,
      fixedCycleAverageSource: true,
      entries: [{ multiplier: 1, frequencyHz: 1, residualLInf: 0.01, residualL2: 0.005 }],
    });

    expect(isNhm2FrequencyConvergenceEvidence(evidence)).toBe(true);
    expect(evidence.convergenceStatus).toBe("fail");
    expect(evidence.blockers).toEqual(
      expect.arrayContaining([
        "frequency_multiplier_missing:2",
        "frequency_multiplier_missing:4",
        "frequency_ladder_too_short",
      ]),
    );
  });

  it("builds frequency convergence evidence that fails when cycle-average source is not fixed", () => {
    const evidence = buildNhm2FrequencyConvergenceEvidence({
      baseFrequencyHz: 1,
      fixedCycleAverageSource: false,
      entries: [1, 2, 4].map((multiplier) => ({
        multiplier,
        frequencyHz: multiplier,
        residualLInf: 0.01,
        residualL2: 0.005,
      })),
    });

    expect(evidence.convergenceStatus).toBe("fail");
    expect(evidence.blockers).toContain("cycle_average_source_not_fixed");
  });

  it("builds dynamic/effective geometry evidence that fails closed without dynamic refs", () => {
    const evidence = buildNhm2DynamicEffectiveGeometryEvidence({
      cycleAverageSourceFixed: true,
      residualLInf: 0.01,
      bounded: true,
    });

    expect(isNhm2DynamicEffectiveGeometryEvidence(evidence)).toBe(true);
    expect(evidence.agreementStatus).toBe("fail");
    expect(evidence.blockers).toEqual(
      expect.arrayContaining([
        "dynamic_geometry_ref_missing",
        "effective_geometry_ref_missing",
        "averaging_window_seconds_missing",
        "averaged_source_tensor_ref_missing",
      ]),
    );
  });

  it("builds dynamic/effective geometry evidence that names residual and backreaction blockers", () => {
    const evidence = buildNhm2DynamicEffectiveGeometryEvidence({
      dynamicGeometryRef: "dynamic-geometry.json",
      effectiveGeometryRef: "effective-geometry.json",
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
      averagedSourceTensorRef: "averaged-source.json",
      residualLInf: 0.12,
      residualL2: 0.04,
      toleranceLInf: 0.1,
      bounded: false,
    });

    expect(evidence.agreementStatus).toBe("fail");
    expect(evidence.blockers).toEqual(
      expect.arrayContaining([
        "dynamic_effective_residual_linf_exceeds_tolerance",
        "backreaction_residual_not_bounded",
      ]),
    );
  });

  it("builds dynamic geometry sample receipts that distinguish missing samples from a missing ref", () => {
    const samples = buildNhm2DynamicGeometrySamples({
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
    });

    expect(isNhm2DynamicGeometrySamplesArtifact(samples)).toBe(true);
    expect(samples.summary.dynamicGeometrySamplesAvailable).toBe(false);
    expect(samples.summary.firstBlocker).toBe("dynamic_geometry_samples_missing");
  });

  it("rejects computed dynamic geometry samples without ADM geometry channels", () => {
    const samples = buildNhm2DynamicGeometrySamples({
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
      samples: [
        {
          sampleId: "bad-sample",
          geometryRef: "gr-evolve-brick.json",
          sourceKind: "gr_evolve_brick",
          requiredChannels: ["alpha", "K_xx"],
          availableChannels: ["alpha"],
          status: "computed",
        },
      ],
    });

    expect(samples.summary.dynamicGeometrySamplesAvailable).toBe(false);
    expect(samples.samples[0]?.missingChannels).toContain("K_xx");
    expect(samples.samples[0]?.blockers).toContain(
      "dynamic_geometry_required_channels_missing",
    );
  });

  it("validates gr-evolve-brick refs before marking dynamic geometry samples computed", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "nhm2-gr-evolve-sample-"));
    const brickPath = "brick.json";
    const requiredChannels = [
      "alpha",
      "beta_x",
      "beta_y",
      "beta_z",
      "gamma_xx",
      "gamma_yy",
      "gamma_zz",
      "gamma_xy",
      "gamma_xz",
      "gamma_yz",
      "K_xx",
      "K_yy",
      "K_zz",
      "K_xy",
      "K_xz",
      "K_yz",
      "H_constraint",
      "M_constraint_x",
      "M_constraint_y",
      "M_constraint_z",
    ];
    writeFileSync(
      join(repoRoot, brickPath),
      `${JSON.stringify({
        kind: "gr-evolve-brick",
        time_s: 0,
        channels: Object.fromEntries(requiredChannels.map((channel) => [channel, {}])),
      })}\n`,
      "utf8",
    );

    const artifact = runNhm2DynamicGeometrySamples({
      repoRoot,
      outPath: "samples.json",
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
      grEvolveBrickRefs: [brickPath],
    });

    expect(artifact.summary.dynamicGeometrySamplesAvailable).toBe(true);
    expect(artifact.samples[0]?.sourceKind).toBe("gr_evolve_brick");
    expect(artifact.samples[0]?.missingChannels).toEqual([]);
    expect(readFileSync(join(repoRoot, "samples.json"), "utf8")).toContain(
      "nhm2_dynamic_geometry_samples/v1",
    );
  });

  it("requires effective geometry references to expose ADM geometry channels", () => {
    const artifact = buildNhm2EffectiveGeometryReference({
      effectiveGeometryRef: "effective-brick.json",
      sourceKind: "gr_evolve_brick_static_reference",
      requiredChannels: ["alpha", "K_xx"],
      availableChannels: ["alpha"],
      status: "computed",
    });

    expect(isNhm2EffectiveGeometryReference(artifact)).toBe(true);
    expect(artifact.summary.effectiveGeometryAvailable).toBe(false);
    expect(artifact.missingChannels).toContain("K_xx");
    expect(artifact.blockers).toContain("effective_geometry_required_channels_missing");
  });

  it("moves dynamic/effective evidence past missing effective geometry when a valid reference is present", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "nhm2-effective-geometry-"));
    const dynamicSamples = buildNhm2DynamicGeometrySamples({
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
      samples: [
        {
          sampleId: "dynamic",
          geometryRef: "dynamic-brick.json",
          sourceKind: "gr_evolve_brick",
          requiredChannels: ["alpha"],
          availableChannels: ["alpha"],
          status: "computed",
        },
      ],
    });
    const effectiveReference = buildNhm2EffectiveGeometryReference({
      effectiveGeometryRef: "effective-brick.json",
      sourceKind: "gr_evolve_brick_static_reference",
      requiredChannels: ["alpha"],
      availableChannels: ["alpha"],
      status: "computed",
    });
    writeFileSync(
      join(repoRoot, "dynamic-samples.json"),
      `${JSON.stringify(dynamicSamples, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(repoRoot, "effective-reference.json"),
      `${JSON.stringify(effectiveReference, null, 2)}\n`,
      "utf8",
    );

    const evidence = runNhm2DynamicEffectiveGeometryEvidence({
      repoRoot,
      outPath: "dynamic-effective.json",
      dynamicGeometrySamplesPath: "dynamic-samples.json",
      effectiveGeometryReferencePath: "effective-reference.json",
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
      residualLInf: 0.01,
      bounded: false,
    });

    expect(evidence.blockers).not.toContain("effective_geometry_ref_missing");
    expect(evidence.blockers).toEqual(
      expect.arrayContaining([
        "averaged_source_tensor_ref_missing",
        "backreaction_residual_not_bounded",
      ]),
    );
    expect(evidence.effectiveGeometryRef).toBe("effective-reference.json");
  });

  it("admits a source-side full tensor as averaged source evidence without proving backreaction", () => {
    const receipt = buildNhm2AveragedSourceTensorReceipt({
      sourceTensorRef: "source.json",
      sourceTensor: averagedSourceTensor(),
      frequencyConvergenceRef: "frequency.json",
      frequencyConvergence: frequencyEvidence(),
      switchingConservationRef: "switching.json",
      switchingConservation: switchingEvidence(),
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
    });

    expect(isNhm2AveragedSourceTensorReceipt(receipt)).toBe(true);
    expect(receipt.summary.averagedSourceTensorAvailable).toBe(true);
    expect(receipt.status).toBe("pass");
    expect(receipt.claimBoundary.averagedSourceDoesNotBoundBackreaction).toBe(true);
  });

  it("moves dynamic/effective evidence past averaged source missing when receipt is valid", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "nhm2-averaged-source-"));
    const dynamicSamples = buildNhm2DynamicGeometrySamples({
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
      samples: [
        {
          sampleId: "dynamic",
          geometryRef: "dynamic-brick.json",
          sourceKind: "gr_evolve_brick",
          requiredChannels: ["alpha"],
          availableChannels: ["alpha"],
          status: "computed",
        },
      ],
    });
    const effectiveReference = buildNhm2EffectiveGeometryReference({
      effectiveGeometryRef: "effective-brick.json",
      sourceKind: "gr_evolve_brick_static_reference",
      requiredChannels: ["alpha"],
      availableChannels: ["alpha"],
      status: "computed",
    });
    const averagedSource = buildNhm2AveragedSourceTensorReceipt({
      sourceTensorRef: "source.json",
      sourceTensor: averagedSourceTensor(),
      frequencyConvergenceRef: "frequency.json",
      frequencyConvergence: frequencyEvidence(),
      switchingConservationRef: "switching.json",
      switchingConservation: switchingEvidence(),
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
    });
    writeFileSync(
      join(repoRoot, "dynamic-samples.json"),
      `${JSON.stringify(dynamicSamples, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(repoRoot, "effective-reference.json"),
      `${JSON.stringify(effectiveReference, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(repoRoot, "averaged-source.json"),
      `${JSON.stringify(averagedSource, null, 2)}\n`,
      "utf8",
    );

    const evidence = runNhm2DynamicEffectiveGeometryEvidence({
      repoRoot,
      outPath: "dynamic-effective.json",
      dynamicGeometrySamplesPath: "dynamic-samples.json",
      effectiveGeometryReferencePath: "effective-reference.json",
      averagedSourceTensorReceiptPath: "averaged-source.json",
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
      residualLInf: 0.01,
      bounded: false,
    });

    expect(evidence.blockers).not.toContain("averaged_source_tensor_ref_missing");
    expect(evidence.blockers).toEqual(["backreaction_residual_not_bounded"]);
    expect(evidence.averagedSourceTensorRef).toBe("averaged-source.json");
  });

  it("bounds backreaction residuals from dynamic and effective gr-evolve channel data", () => {
    const receipt = buildNhm2BackreactionResidualReceipt({
      dynamicGeometrySamplesRef: "dynamic-samples.json",
      effectiveGeometryReferenceRef: "effective-reference.json",
      averagedSourceTensorRef: "averaged-source.json",
      toleranceLInf: 0.1,
      channels: [
        {
          channelId: "alpha",
          sampleCount: 1,
          dynamicLInf: 1,
          effectiveLInf: 1,
          absoluteLInf: 0.01,
          relativeLInf: 0.01,
          relativeL2: 0.01,
        },
      ],
    });

    expect(isNhm2BackreactionResidualReceipt(receipt)).toBe(true);
    expect(receipt.summary.bounded).toBe(true);
    expect(receipt.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("feeds a bounded backreaction receipt into dynamic/effective evidence", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "nhm2-backreaction-"));
    const dynamicSamples = buildNhm2DynamicGeometrySamples({
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
      samples: [
        {
          sampleId: "dynamic",
          geometryRef: "dynamic-brick.json",
          sourceKind: "gr_evolve_brick",
          requiredChannels: ["alpha"],
          availableChannels: ["alpha"],
          status: "computed",
        },
      ],
    });
    const effectiveReference = buildNhm2EffectiveGeometryReference({
      effectiveGeometryRef: "effective-brick.json",
      sourceKind: "gr_evolve_brick_static_reference",
      requiredChannels: ["alpha"],
      availableChannels: ["alpha"],
      status: "computed",
    });
    const averagedSource = buildNhm2AveragedSourceTensorReceipt({
      sourceTensorRef: "source.json",
      sourceTensor: averagedSourceTensor(),
      frequencyConvergenceRef: "frequency.json",
      frequencyConvergence: frequencyEvidence(),
      switchingConservationRef: "switching.json",
      switchingConservation: switchingEvidence(),
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
    });
    writeFileSync(
      join(repoRoot, "dynamic-samples.json"),
      `${JSON.stringify(dynamicSamples, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(repoRoot, "effective-reference.json"),
      `${JSON.stringify(effectiveReference, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(
      join(repoRoot, "averaged-source.json"),
      `${JSON.stringify(averagedSource, null, 2)}\n`,
      "utf8",
    );
    writeBrick(repoRoot, "dynamic-brick.json", { alpha: [1, 1.01] });
    writeBrick(repoRoot, "effective-brick.json", { alpha: [1, 1] });

    const backreaction = runNhm2BackreactionResidualReceipt({
      repoRoot,
      outPath: "backreaction.json",
      dynamicGeometrySamplesPath: "dynamic-samples.json",
      effectiveGeometryReferencePath: "effective-reference.json",
      averagedSourceTensorReceiptPath: "averaged-source.json",
      channels: ["alpha"],
      toleranceLInf: 0.1,
    });
    const evidence = runNhm2DynamicEffectiveGeometryEvidence({
      repoRoot,
      outPath: "dynamic-effective.json",
      dynamicGeometrySamplesPath: "dynamic-samples.json",
      effectiveGeometryReferencePath: "effective-reference.json",
      averagedSourceTensorReceiptPath: "averaged-source.json",
      backreactionResidualReceiptPath: "backreaction.json",
      averagingWindowSeconds: 1,
      cycleAverageSourceFixed: true,
    });

    expect(backreaction.summary.bounded).toBe(true);
    expect(evidence.blockers).toEqual([]);
    expect(evidence.agreementStatus).toBe("pass");
    expect(evidence.backreactionResidualRef).toBe("backreaction.json");
  });

  it("emits a valid fail-closed artifact when evidence is missing", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      generatedAt: "2026-06-18T00:00:00.000Z",
    });

    expect(isNhm2TimeDependentSourceCampaignArtifact(artifact)).toBe(true);
    expect(artifact.summary.campaignPass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("source_component_authority_ledger_missing");
    expect(artifact.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(artifact.claimBoundary.transportClaimAllowed).toBe(false);
  });

  it("does not let static source, tensor, QEI, and observer evidence pass the dynamic campaign", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
    });

    expect(artifact.summary.sourceIndependencePass).toBe(true);
    expect(artifact.summary.fullRegionalTensorClosurePass).toBe(true);
    expect(artifact.summary.qeiReceiptsPass).toBe(true);
    expect(artifact.summary.observerFamilyPass).toBe(true);
    expect(artifact.summary.campaignPass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("switching_conservation_evidence_missing");
    expect(artifact.frequencyLadder.blockers).toContain("frequency_convergence_evidence_missing");
  });

  it("moves the first blocker past switching when valid switching evidence is supplied", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      switchingConservation: switchingEvidence(),
    });

    expect(artifact.summary.switchingConservationPass).toBe(true);
    expect(artifact.summary.campaignPass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("frequency_convergence_evidence_missing");
  });

  it("moves the first blocker from missing dynamic evidence to typed dynamic blockers", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      frequencyConvergence: frequencyEvidence(),
      switchingConservation: switchingEvidence(),
      dynamicEffectiveGeometry: buildNhm2DynamicEffectiveGeometryEvidence({
        cycleAverageSourceFixed: true,
        residualLInf: 0.01,
        bounded: true,
      }),
    });

    expect(artifact.summary.dynamicGeometryAgreementPass).toBe(false);
    expect(artifact.summary.campaignPass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("dynamic_geometry_ref_missing");
    expect(artifact.claimBoundary).toMatchObject({
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    });
  });

  it("moves the first blocker from a missing dynamic ref to missing dynamic samples", () => {
    const dynamicSamples = buildNhm2DynamicGeometrySamples({
      fixedCycleAverageSource: true,
      averagingWindowSeconds: 1,
    });
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      frequencyConvergence: frequencyEvidence(),
      switchingConservation: switchingEvidence(),
      dynamicEffectiveGeometry: buildNhm2DynamicEffectiveGeometryEvidence({
        dynamicGeometryRef: "dynamic-geometry-samples.json",
        dynamicGeometryStatus: dynamicSamples.summary.dynamicGeometrySamplesAvailable
          ? "pass"
          : "missing",
        dynamicGeometryBlockers:
          dynamicSamples.summary.firstBlocker == null
            ? []
            : [dynamicSamples.summary.firstBlocker],
        cycleAverageSourceFixed: true,
        residualLInf: 0.01,
        bounded: true,
      }),
    });

    expect(artifact.summary.dynamicGeometryAgreementPass).toBe(false);
    expect(artifact.summary.campaignPass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("dynamic_geometry_samples_missing");
  });

  it("rejects source target echo as source independence failure", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger({
        anyMetricEcho: true,
        metricEchoComponentRefs: ["wall:T00"],
        sourceSideComponentAuthorityComplete: false,
        firstBlocker: "wall:T00:metric_echo",
        blockerCount: 1,
      }),
    });

    expect(artifact.sourceIndependence.copiedFromMetricRequiredTensor).toBe(true);
    expect(artifact.sourceIndependence.targetEchoDetected).toBe(true);
    expect(artifact.summary.sourceIndependencePass).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("source_target_echo_detected");
  });

  it("blocks full regional tensor closure when T0i or off-diagonal Tij are missing", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual(
        {
          allRequiredComponentsPresent: false,
          fullTensorResidualsPass: false,
          worstResidualFamily: "off_diagonal_tij",
          firstBlocker: "T01:tile_component_missing",
          blockerCount: 2,
        },
        ["T01", "T12"],
      ),
      frequencyConvergence: frequencyEvidence(),
      switchingConservation: switchingEvidence(),
      dynamicEffectiveGeometry: dynamicGeometryEvidence(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      campaignStability: stabilityEvidence(),
    });

    expect(artifact.summary.fullRegionalTensorClosurePass).toBe(false);
    expect(
      artifact.gates.find((gate) => gate.gateId === "full_regional_tensor_closure")
        ?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "regional_full_tensor_components_missing",
        "wall:T01:tile_component_missing",
        "wall:T12:tile_component_missing",
      ]),
    );
    expect(
      artifact.gates.find((gate) => gate.gateId === "full_regional_tensor_closure")
        ?.primaryMetric,
    ).toContain("family=off_diagonal_tij");
    expect(artifact.summary.campaignPass).toBe(false);
  });

  it("surfaces off-diagonal fractional shear ansatz evidence in the full tensor campaign gate", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual({
        fullTensorResidualsPass: false,
        worstRegionId: "hull",
        worstComponentId: "T13",
        worstResidualFamily: "off_diagonal_tij",
        worstRelResidual: 1.64e15,
        firstBlocker: "hull:T13:full_tensor_residual_exceeded",
        blockerCount: 1,
      }),
      sourceOffDiagonalShearAudit: shearAudit(),
      frequencyConvergence: frequencyEvidence(),
      switchingConservation: switchingEvidence(),
      dynamicEffectiveGeometry: dynamicGeometryEvidence(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      campaignStability: stabilityEvidence(),
    });
    const gate = artifact.gates.find(
      (entry) => entry.gateId === "full_regional_tensor_closure",
    );

    expect(gate?.status).toBe("fail");
    expect(gate?.blockers).toEqual(
      expect.arrayContaining([
        "source_off_diagonal_current_declared_model_falsified",
        "source_off_diagonal_shear_mechanism_missing",
        "hull:T13:full_tensor_residual_exceeded",
      ]),
    );
    expect(gate?.warnings).toEqual(
      expect.arrayContaining([
        "source_off_diagonal_uniform_fractional_shear_ansatz",
      ]),
    );
    expect(gate?.primaryMetric).toContain("shearAuditWorstSuppression=5830000000000000");
    expect(artifact.summary.firstBlocker).toBe(
      "source_off_diagonal_current_declared_model_falsified",
    );
  });

  it("surfaces momentum-density ansatz evidence in the full tensor campaign gate", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual({
        fullTensorResidualsPass: false,
        worstRegionId: "hull",
        worstComponentId: "T01",
        worstResidualFamily: "momentum_t0i",
        worstRelResidual: 1.001,
        firstBlocker: "hull:T01:full_tensor_residual_exceeded",
        blockerCount: 1,
      }),
      sourceMomentumDensityAudit: momentumAudit(),
      frequencyConvergence: frequencyEvidence(),
      switchingConservation: switchingEvidence(),
      dynamicEffectiveGeometry: dynamicGeometryEvidence(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      campaignStability: stabilityEvidence(),
    });
    const gate = artifact.gates.find(
      (entry) => entry.gateId === "full_regional_tensor_closure",
    );

    expect(gate?.status).toBe("fail");
    expect(gate?.blockers).toEqual(
      expect.arrayContaining([
        "momentum_density_causal_bound_frame_projection_missing",
        "source_momentum_density_current_declared_model_falsified",
        "source_momentum_density_mechanism_missing",
        "hull:T01:full_tensor_residual_exceeded",
      ]),
    );
    expect(gate?.warnings).toEqual(
      expect.arrayContaining(["source_momentum_density_uniform_fractional_ansatz"]),
    );
    expect(gate?.primaryMetric).toContain("momentumAuditWorstAmplification=2.2e+21");
    expect(gate?.primaryMetric).toContain("momentumAuditWorstMetricRequiredRatio=2000000000000000");
    expect(gate?.primaryMetric).toContain("momentumAuditCausalBoundApplicability=blocked");
    expect(artifact.summary.firstBlocker).toBe(
      "momentum_density_causal_bound_frame_projection_missing",
    );
  });

  it("can pass only when explicit dynamic, tensor, observer, QEI, and stability evidence pass together", () => {
    const artifact = buildNhm2TimeDependentSourceCampaign({
      sourceComponentAuthorityLedger: completeLedger(),
      regionalFullTensorResidual: fullTensorResidual(),
      frequencyConvergence: frequencyEvidence(),
      switchingConservation: switchingEvidence(),
      dynamicEffectiveGeometry: dynamicGeometryEvidence(),
      qeiWorldlineDossier: qeiDossier(),
      observerRobustEnergyConditions: observerArtifact(),
      campaignStability: stabilityEvidence(),
    });

    expect(artifact.summary).toMatchObject({
      campaignPass: true,
      sourceIndependencePass: true,
      switchingConservationPass: true,
      frequencyConvergencePass: true,
      dynamicGeometryAgreementPass: true,
      fullRegionalTensorClosurePass: true,
      observerFamilyPass: true,
      qeiReceiptsPass: true,
      stabilityPass: true,
      firstBlocker: "none",
    });
    expect(artifact.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
    });
  });
});
