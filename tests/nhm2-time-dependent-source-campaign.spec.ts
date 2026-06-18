import { describe, expect, it } from "vitest";

import type { Nhm2ObserverRobustEnergyConditionArtifactV1 } from "../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import type { Nhm2QeiWorldlineDossierV1 } from "../shared/contracts/nhm2-qei-worldline-dossier.v1";
import type { Nhm2RegionalFullTensorResidualArtifactV1 } from "../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import type { Nhm2SourceComponentAuthorityLedgerArtifactV1 } from "../shared/contracts/nhm2-source-component-authority-ledger.v1";
import {
  buildNhm2TimeDependentSourceCampaign,
  isNhm2TimeDependentSourceCampaignArtifact,
  type Nhm2CampaignStabilityEvidenceV1,
  type Nhm2DynamicEffectiveGeometryEvidenceV1,
  type Nhm2FrequencyConvergenceEvidenceV1,
  type Nhm2SwitchingConservationEvidenceV1,
} from "../shared/contracts/nhm2-time-dependent-source-campaign.v1";

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
      worstRelResidual: 0.05,
      firstBlocker:
        missingTileComponentIds.length === 0
          ? null
          : `${missingTileComponentIds[0]}:tile_component_missing`,
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
  scheduleRef: "schedule.json",
  sectorBoundaryRef: "sector-boundary.json",
  switchingFunctionRef: "switching.json",
  includesRegionalSupportDerivatives: true,
  includesSectorBoundaryTerms: true,
  includesTimeDerivativeTerms: true,
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
    expect(artifact.summary.campaignPass).toBe(false);
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
