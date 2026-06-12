import { describe, expect, it } from "vitest";

import { buildCasimirMaterialReceipt } from "../shared/contracts/casimir-material-receipt.v1";
import {
  buildNhm2CoupledClosurePassCandidate,
  isNhm2CoupledClosurePassCandidateArtifact,
} from "../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import { buildNhm2ObserverRobustEnergyConditionArtifact } from "../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import { buildNhm2QeiWorldlineDossier } from "../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  buildNhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureEvidenceRegion,
  type Nhm2RegionalSourceClosureRegionId,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import { buildNhm2SourceSideSameBasisTensorAuthorityArtifact } from "../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import {
  buildNhm2TileCounterpartConservationArtifact,
  type Nhm2TileCounterpartConservationArtifact,
} from "../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import {
  buildNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartRegion,
} from "../shared/contracts/nhm2-tile-effective-counterpart.v1";
import { assessNhm2SourceClosurePassReadiness } from "../tools/nhm2/source-closure-pass-readiness";

const profile = "stage1_centerline_alpha_0p995_v1";
const regions = ["global", "hull", "wall", "exterior_shell"] as const;

const tensor = (value: number) => ({
  T00: -value,
  T01: 0,
  T02: 0,
  T03: 0,
  T10: 0,
  T11: value,
  T12: 0,
  T13: 0,
  T20: 0,
  T21: 0,
  T22: value,
  T23: 0,
  T30: 0,
  T31: 0,
  T32: 0,
  T33: value,
});

const materialReceipt = () =>
  buildCasimirMaterialReceipt({
    generatedAt: "2026-06-12T00:00:00.000Z",
    tileBatchId: "tile_batch:regional-source",
    geometry: {
      gapMeters: 8e-9,
      gapMetrologyStatus: "measured",
      roughnessRmsMeters: 1e-10,
      beyondPfaValidity: "pass",
    },
    material: {
      modelKind: "lifshitz",
      dielectricResponseRef: "artifact://dielectric/au-sin-aln",
      finiteConductivityIncluded: true,
      finiteTemperatureIncluded: true,
      roughnessCorrectionIncluded: true,
    },
    environment: {
      vacuumSealEvidence: "present",
      temperatureK: 4,
    },
    correctionFactors: {
      conductivity: 0.95,
      temperature: 0.99,
      roughness: 0.98,
      geometry: 0.97,
    },
  });

const tileRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
): Nhm2TileEffectiveCounterpartRegion => ({
  regionId,
  status: "pass",
  comparisonRole: "tile_effective_counterpart",
  tensorAuthorityMode: "full_tensor",
  tensor: tensor(10),
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: `mask.${regionId}`,
  aggregationMode: "mean",
  normalizationBasis: "sample_count",
  sampleCount: 64,
  provenance: {
    producerModule: "tests",
    producerFunction: "tileRegion",
    inputRefs: [`source.${regionId}`],
    sourceModelId: "regional_material_source_tensor_model",
    sourceModelVersion: "v1",
    derivationMode: "regional_material_source_tensor_model",
    notDerivedFromMetricRequiredTensor: true,
  },
  blockers: [],
});

const tileCounterpart = () =>
  buildNhm2TileEffectiveCounterpartArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "coupled-run",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    sourceAuthorityMode: "regional_material_source_tensor_model",
    qeiDossierRef: "qei-worldline.json",
    qeiApplicabilityStatus: "PASS",
    quantumStateAssumptions: ["declared"],
    renormalizationConvention: "declared",
    cavityBoundaryModel: "declared",
    cycleAverageClosureStatus: "pass",
    dutyCycleStatus: "pass",
    lightCrossingConsistencyStatus: "pass",
    conservationDiagnostics: {
      divTStatus: "pass",
      divTResidualLInf: 0,
      continuityResidualLInf: 0,
      momentumResidualLInf: 0,
    },
    regions: regions.map((regionId) => tileRegion(regionId)),
    literatureRefs: ["fewster_thompson_2023_stationary_worldline_qei"],
  });

const regionalRegion = (
  regionId: Nhm2RegionalSourceClosureRegionId,
  relLInf = 0,
): Nhm2RegionalSourceClosureEvidenceRegion => ({
  regionId,
  status: relLInf > 0.01 ? "fail" : "pass",
  comparisonBasisStatus: "same_basis",
  metricRequired: {
    tensorRef: `metric.${regionId}`,
    tensorAuthorityMode: "full_tensor",
    tensor: tensor(10),
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 64,
  },
  tileEffectiveCounterpart: {
    tensorRef: `tile.${regionId}`,
    tensorAuthorityMode: "full_tensor",
    tensor: tensor(relLInf > 0.01 ? 12 : 10),
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    aggregationMode: "mean",
    normalizationBasis: "sample_count",
    sampleCount: 64,
    comparisonRole: "tile_effective_counterpart",
  },
  residuals: {
    componentResiduals: {
      T00: {
        metricRequired: -10,
        tileEffectiveCounterpart: relLInf > 0.01 ? -12 : -10,
        absResidual: relLInf > 0.01 ? 2 : 0,
        relResidual: relLInf,
      },
    },
    relLInf,
    absLInf: relLInf > 0.01 ? 2 : 0,
    toleranceRelLInf: 0.01,
    pass: relLInf <= 0.01,
  },
  blockers: [],
});

const regionalEvidence = (relLInf = 0) =>
  buildNhm2RegionalSourceClosureEvidenceArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "coupled-run",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    regions: regions.map((regionId) => regionalRegion(regionId, relLInf)),
    literatureRefs: ["natario_2001_zero_expansion"],
  });

const sourceAuthority = () =>
  buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: profile,
    chartId: "comoving_cartesian",
    sourceModelId: "regional_material_source_tensor_model",
    counterpartArtifactRef: "tile.json",
    counterpartArtifact: tileCounterpart(),
    casimirMaterialReceipt: materialReceipt(),
  });

const readiness = () =>
  assessNhm2SourceClosurePassReadiness({
    generatedAt: "2026-06-12T00:00:00.000Z",
    regionalEvidenceRef: "regional.json",
    regionalEvidence: regionalEvidence(),
    sourceAuthorityRef: "authority.json",
    sourceAuthority: sourceAuthority(),
  });

const conservation = (
  state: "pass" | "fail" = "pass",
): Nhm2TileCounterpartConservationArtifact =>
  buildNhm2TileCounterpartConservationArtifact({
    runId: "coupled-run",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    chartRef: "comoving_cartesian",
    derivativeStencil: "fd4",
    unitsRef: "J/m^3",
    regions: regions.map((regionId) => ({
      regionId,
      status: state,
      divTResidualLInf: state === "pass" ? 0 : 2,
      continuityResidualLInf: 0,
      momentumResidualLInf: 0,
      toleranceLInf: 1,
      sampleCount: 64,
      blockers: [],
    })),
  });

const qeiWorldlineDossier = () =>
  buildNhm2QeiWorldlineDossier({
    generatedAt: "2026-06-12T00:00:00.000Z",
    selectedProfileId: profile,
    worldlines: [
      {
        worldlineId: "wall:1",
        regionId: "wall",
        chartId: "comoving_cartesian",
        samplingFunction: {
          kind: "lorentzian",
          tauSeconds: 1e-9,
          normalized: true,
        },
        sampledRho: {
          valueSI: -1,
          provenanceRef: "tile.json#wall",
          status: "computed",
        },
        bound: {
          valueSI: 0,
          provenanceRef: "ford_roman_1996_quantum_inequality",
          status: "literature_bound",
        },
        margin: {
          valueSI: 1,
          pass: true,
        },
        consistency: {
          tauVsDuty: "pass",
          tauVsLightCrossing: "pass",
          tauVsModulation: "pass",
        },
      },
    ],
  });

const robustObserver = () =>
  buildNhm2ObserverRobustEnergyConditionArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    selectedProfileId: profile,
    tensorRef: "tile.json#full",
    observerFamilies: [
      {
        familyId: "boosted_timelike_grid",
        status: "pass",
        sampleCount: 16,
        worstCase: {
          condition: "WEC",
          value: 0,
          locationRef: "wall",
        },
      },
    ],
  });

const eulerianOnlyObserver = () =>
  buildNhm2ObserverRobustEnergyConditionArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    selectedProfileId: profile,
    tensorRef: "tile.json#full",
    observerFamilies: [
      {
        familyId: "eulerian",
        status: "pass",
        sampleCount: 1,
        worstCase: {
          condition: "WEC",
          value: 0,
          locationRef: "wall",
        },
      },
    ],
  });

const allPassingArtifact = () =>
  buildNhm2CoupledClosurePassCandidate({
    artifactRefs: {
      sourceSideSameBasisTensorAuthority: "authority.json",
      regionalSourceClosureEvidence: "regional.json",
      sourceClosurePassReadiness: "readiness.json",
      conservation: "conservation.json",
      qeiWorldlineDossier: "qei-worldline.json",
      observerRobustEnergyConditions: "observer.json",
      casimirMaterialReceipt: "material.json",
    },
    sourceAuthority: sourceAuthority(),
    sourceClosurePassReadiness: readiness(),
    regionalEvidence: regionalEvidence(),
    conservation: conservation(),
    qeiWorldlineDossier: qeiWorldlineDossier(),
    observerRobustEnergyConditions: robustObserver(),
    casimirMaterialReceipt: materialReceipt(),
  });

describe("NHM2 coupled closure pass-candidate artifact", () => {
  it("does not pass from regional tensor authority alone", () => {
    const artifact = buildNhm2CoupledClosurePassCandidate({
      sourceAuthority: sourceAuthority(),
    });

    expect(isNhm2CoupledClosurePassCandidateArtifact(artifact)).toBe(true);
    expect(artifact.summary.allRequiredRegionsAuthoritative).toBe(true);
    expect(artifact.summary.passCandidate).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("source_closure_pass_readiness_missing");
  });

  it("does not pass from wall/source readiness alone", () => {
    const artifact = buildNhm2CoupledClosurePassCandidate({
      sourceClosurePassReadiness: readiness(),
    });

    expect(artifact.summary.sourceClosurePassSignalAllowed).toBe(true);
    expect(artifact.summary.passCandidate).toBe(false);
    expect(artifact.gates.find((gate) => gate.gateId === "regional_source_tensor_authority")?.status).toBe("missing");
  });

  it("blocks on missing or failing conservation even when source closure passes", () => {
    const missingConservation = buildNhm2CoupledClosurePassCandidate({
      sourceAuthority: sourceAuthority(),
      sourceClosurePassReadiness: readiness(),
      regionalEvidence: regionalEvidence(),
      qeiWorldlineDossier: qeiWorldlineDossier(),
      observerRobustEnergyConditions: robustObserver(),
      casimirMaterialReceipt: materialReceipt(),
    });
    const failingConservation = buildNhm2CoupledClosurePassCandidate({
      sourceAuthority: sourceAuthority(),
      sourceClosurePassReadiness: readiness(),
      regionalEvidence: regionalEvidence(),
      conservation: conservation("fail"),
      qeiWorldlineDossier: qeiWorldlineDossier(),
      observerRobustEnergyConditions: robustObserver(),
      casimirMaterialReceipt: materialReceipt(),
    });

    expect(missingConservation.summary.passCandidate).toBe(false);
    expect(missingConservation.summary.firstBlocker).toBe("tile_counterpart_conservation_missing");
    expect(failingConservation.summary.passCandidate).toBe(false);
    expect(failingConservation.gates.find((gate) => gate.gateId === "conservation")?.status).toBe("fail");
  });

  it("does not count Eulerian-only energy evidence as observer robust", () => {
    const artifact = buildNhm2CoupledClosurePassCandidate({
      sourceAuthority: sourceAuthority(),
      sourceClosurePassReadiness: readiness(),
      regionalEvidence: regionalEvidence(),
      conservation: conservation(),
      qeiWorldlineDossier: qeiWorldlineDossier(),
      observerRobustEnergyConditions: eulerianOnlyObserver(),
      casimirMaterialReceipt: materialReceipt(),
    });

    expect(artifact.summary.observerRobustPass).toBe(false);
    expect(artifact.summary.passCandidate).toBe(false);
    expect(artifact.gates.find((gate) => gate.gateId === "observer_robust_energy_conditions")?.blockers).toContain("observer_scope_eulerian_only");
  });

  it("does not let scalar or old QEI evidence substitute for the worldline dossier", () => {
    const scalarQeiMargin = 1;
    const artifact = buildNhm2CoupledClosurePassCandidate({
      sourceAuthority: sourceAuthority(),
      sourceClosurePassReadiness: readiness(),
      regionalEvidence: regionalEvidence(),
      conservation: conservation(),
      observerRobustEnergyConditions: robustObserver(),
      casimirMaterialReceipt: materialReceipt(),
    });

    expect(scalarQeiMargin).toBeGreaterThan(0);
    expect(artifact.summary.qeiDossierPass).toBe(false);
    expect(artifact.summary.passCandidate).toBe(false);
    expect(artifact.gates.find((gate) => gate.gateId === "qei_worldline_dossier")?.status).toBe("missing");
  });

  it("allows a diagnostic pass candidate only when every coupled gate passes", () => {
    const artifact = allPassingArtifact();

    expect(isNhm2CoupledClosurePassCandidateArtifact(artifact)).toBe(true);
    expect(artifact.gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(artifact.summary.passCandidate).toBe(true);
    expect(artifact.summary.blockerCount).toBe(0);
    expect(artifact.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
    expect(artifact.claimBoundary.transportClaimAllowed).toBe(false);
  });
});
