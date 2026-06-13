import { describe, expect, it } from "vitest";

import {
  buildNhm2RegionalMaterialSourceTensorModelArtifact,
  type Nhm2RegionalMaterialSourceTensorModelV1,
} from "../shared/contracts/nhm2-regional-material-source-tensor-model.v1";
import { buildNhm2CovariantConservationDiagnostic } from "../shared/contracts/nhm2-covariant-conservation-diagnostic.v1";
import { buildNhm2RegionalFullTensorResidual } from "../shared/contracts/nhm2-regional-full-tensor-residual.v1";
import {
  buildNhm2RegionalTensorPassPathHarness,
  isNhm2RegionalTensorPassPathHarnessArtifact,
} from "../shared/contracts/nhm2-regional-tensor-pass-path-harness.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  NHM2_TENSOR_COMPONENTS,
  type Nhm2RegionalSourceClosureEvidenceArtifact,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
} from "../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import type { Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 } from "../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import type { Nhm2SourceComponentAuthorityLedgerArtifactV1 } from "../shared/contracts/nhm2-source-component-authority-ledger.v1";
import type { Nhm2TileCounterpartConservationArtifact } from "../shared/contracts/nhm2-tile-counterpart-conservation.v1";
import type { CasimirMaterialReceiptV1 } from "../shared/contracts/casimir-material-receipt.v1";
import type { Nhm2QeiWorldlineDossierV1 } from "../shared/contracts/nhm2-qei-worldline-dossier.v1";
import type { Nhm2ObserverRobustEnergyConditionArtifactV1 } from "../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import type { Nhm2CoupledClosurePassCandidateArtifactV1 } from "../shared/contracts/nhm2-coupled-closure-pass-candidate.v1";
import { buildNhm2RegionalSupportFunctionAtlas } from "../shared/contracts/nhm2-regional-support-function-atlas.v1";

const atlasRef = "atlas.json";
const atlasHash = "atlas-test-hash";

const atlasRegion = (
  regionId:
    | "global"
    | "hull"
    | "wall"
    | "exterior_shell"
    | "hull_wall_transition"
    | "wall_exterior_transition",
) => ({
  regionId,
  semanticRole:
    regionId === "global"
      ? "global_region" as const
      : regionId.includes("transition")
        ? "transition_region" as const
        : "closure_region" as const,
  maskRef: `mask.${regionId}`,
  supportFunctionRef: `support.${regionId}`,
  sampleCount: 8,
  supportStats: {
    minWeight: 0,
    maxWeight: 1,
    meanWeight: regionId.includes("transition") ? 0.5 : 1,
    nonzeroFraction: 1,
  },
  aggregationPolicy: {
    weighting: "support_weighted" as const,
    normalization: "sum_weights" as const,
    includeTransitionSamples: !regionId.includes("transition"),
  },
});

const atlas = () =>
  buildNhm2RegionalSupportFunctionAtlas({
    runIdentity: {
      runId: "pass-path-test",
      profileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      metricRef: "metric.json",
      sourceModelRef: "source.json",
      gridRef: "grid.json",
      samplePlanRef: "sample-plan.json",
      createdAt: "2026-06-12T00:00:00.000Z",
    },
    basisAndUnits: {
      tensorBasis: "chart",
      coordinateSystem: "comoving_cartesian",
      lengthUnit: "m",
      energyDensityUnit: "J/m^3",
      stressEnergyConvention: "T_mu_nu_same_chart",
      signatureConvention: "(-,+,+,+)",
    },
    regions: {
      global: atlasRegion("global"),
      hull: atlasRegion("hull"),
      wall: atlasRegion("wall"),
      exterior_shell: atlasRegion("exterior_shell"),
      hull_wall_transition: atlasRegion("hull_wall_transition"),
      wall_exterior_transition: atlasRegion("wall_exterior_transition"),
    },
    transitionKernels: [
      {
        kernelId: "kernel:hull_wall",
        fromRegion: "hull",
        toRegion: "wall",
        supportRegion: "hull_wall_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: 1,
        derivativeTermsAvailable: false,
      },
      {
        kernelId: "kernel:wall_exterior",
        fromRegion: "wall",
        toRegion: "exterior_shell",
        supportRegion: "wall_exterior_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: 1,
        derivativeTermsAvailable: false,
      },
    ],
    partitionOfUnity: {
      appliesTo: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
      sumWeightsMean: 1,
      sumWeightsMaxAbsError: 0,
      negativeWeightMin: 0,
      overlapPolicy: "partition_of_unity",
      status: "pass",
    },
    derivativeSupport: {
      partialMuWAvailable: false,
      covariantDerivativeSupportAvailable: false,
      derivativeBasis: "chart",
      transitionDerivativeTermsRequired: true,
    },
    provenance: {
      generatedFrom: ["reference.json"],
      inputHashes: { "reference.json": "hash" },
      atlasHash,
      targetEchoForbidden: true,
      targetDerivedFieldsUsed: false,
    },
  });

const tensor = (value: number): Nhm2RegionalTensor =>
  Object.fromEntries(NHM2_TENSOR_COMPONENTS.map((component) => [component, value])) as Nhm2RegionalTensor;

const regionalModel = (
  regionIds: Nhm2RegionalSourceClosureRegionId[] = [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
): Nhm2RegionalMaterialSourceTensorModelV1 =>
  buildNhm2RegionalMaterialSourceTensorModelArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    chartId: "comoving_cartesian",
    modelKind: "declared_research_tensor",
    materialReceiptRef: "casimir-material-receipt.json",
    materialReceiptTier: "declared_model_receipt",
    sourceModelRef: "regional-component-model.json",
    sourceSideOnly: true,
    notDerivedFromMetricRequiredTensor: true,
    metricRequiredInputRefs: [],
    targetEchoForbidden: true,
    targetDerivedFieldsUsed: false,
    regions: regionIds.map((regionId) => ({
      regionId,
      status: "material_receipted",
      tensor: tensor(-10),
      componentStatus: Object.fromEntries(
        NHM2_TENSOR_COMPONENTS.map((component) => [component, "material_receipted"]),
      ),
      componentAuthority: Object.fromEntries(
        NHM2_TENSOR_COMPONENTS.map((component) => [component, "source_model"]),
      ),
      tensorAuthorityMode: "full_tensor",
      missingComponentIds: [],
      chartId: "comoving_cartesian",
      basisRef: "same_basis",
      units: "J/m^3",
      regionMaskRef: `${regionId}-mask`,
      aggregationMode: "direct_region_model",
      normalizationBasis: "volume",
      sampleCount: 8,
      materialReceiptRef: "casimir-material-receipt.json",
      materialReceiptStatus: "material_receipted",
      provenanceRef: `regional-model:${regionId}`,
      notDerivedFromMetricRequiredTensor: true,
      blockers: [],
      warnings: [],
    })),
  });

const sourceAuthority = (): Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 => ({
  contractVersion: "nhm2_source_side_same_basis_tensor_authority/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  chartId: "comoving_cartesian",
  sourceModelId: "regional-component-model",
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    status: "authoritative_same_basis",
    sourceTensorRef: `regional-model:${regionId}`,
    expectedMetricCounterpartRole: "tile_effective_counterpart",
    comparisonRole: "tile_effective_counterpart",
    chartId: "comoving_cartesian",
    basisRef: "same_basis",
    units: "J/m^3",
    regionMaskRef: `${regionId}-mask`,
    aggregationMode: "mean",
    normalizationBasis: "volume",
    tensorAuthorityMode: "full_tensor",
    derivationMode: "declared_research_tensor",
    notDerivedFromMetricRequiredTensor: true,
    hasFullTensorComponents: true,
    missingComponentIds: [],
    materialReceiptRef: "casimir-material-receipt.json",
    materialReceiptStatus: "material_receipted",
    blockers: [],
    warnings: [],
  })),
  summary: {
    hasWallAuthority: true,
    allRequiredRegionsAuthoritative: true,
    anyMetricEcho: false,
    anyProxy: false,
    anyMissingCounterpart: false,
    missingRegionIds: [],
    blockerCount: 0,
  },
  claimBoundary: {
    diagnosticOnly: true,
    doesNotValidatePhysicalSource: true,
    metricEchoForbidden: true,
    wallT00ClosureRequiresWallAuthority: true,
  },
});

const staleSourceAuthority = (): Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 => {
  const artifact = sourceAuthority();
  return {
    ...artifact,
    regions: artifact.regions.map((region) => ({
      ...region,
      status: "blocked",
      blockers: [
        "qei_dossier_not_pass",
        "conservation_unknown",
        "qei_not_promotion_safe",
      ],
    })),
    summary: {
      ...artifact.summary,
      hasWallAuthority: false,
      allRequiredRegionsAuthoritative: false,
      blockerCount: 12,
    },
  };
};

const sourceComponentAuthorityLedger = (): Nhm2SourceComponentAuthorityLedgerArtifactV1 => ({
  contractVersion: "nhm2_source_component_authority_ledger/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  runId: "pass-path-test",
  counterpartArtifactRef: "counterpart.json",
  sourceTensorArtifactRef: "source.json",
  atlasRef,
  atlasHash,
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    status: "pass",
    comparisonRole: "tile_effective_counterpart",
    tensorAuthorityMode: "full_tensor",
    chartRef: "comoving_cartesian",
    unitsRef: "J/m^3",
    regionMaskRef: `${regionId}-mask`,
    aggregationMode: "mean",
    normalizationBasis: "volume",
    sampleCount: 8,
    components: ([
      "T00",
      "T01",
      "T02",
      "T03",
      "T11",
      "T12",
      "T13",
      "T22",
      "T23",
      "T33",
    ] as const).map((componentId) => ({
      componentId,
      valueSI: -10,
      authority: "source_model" as const,
      componentGroup:
        componentId === "T00"
          ? "energy_density" as const
          : componentId === "T01" ||
              componentId === "T02" ||
              componentId === "T03"
            ? "momentum_density" as const
            : componentId === "T11" ||
                componentId === "T22" ||
                componentId === "T33"
              ? "spatial_stress_diagonal" as const
              : "spatial_stress_off_diagonal" as const,
      receiptRef: "source.json",
      provenance: {
        counterpartRegionRef: `counterpart.json#${regionId}`,
        derivationMode: "regional_material_source_tensor_model",
        sourceModelId: "regional-component-model",
        sourceModelVersion: "v1",
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
  },
  claimBoundary: {
    diagnosticOnly: true,
    componentAuthorityDoesNotValidateMaterialSource: true,
    metricEchoForbidden: true,
    scalarProxyCannotProvideFullTensorAuthority: true,
    missingComponentsCannotBeZeroFilled: true,
  },
});

const regionalEvidence = (): Nhm2RegionalSourceClosureEvidenceArtifact => ({
  artifactId: "nhm2_regional_source_closure_evidence",
  schemaVersion: "nhm2_regional_source_closure_evidence/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  runId: "pass-path-test",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  expectedProfileId: "stage1_centerline_alpha_0p995_v1",
  profileMatch: true,
  laneId: "nhm2_shift_lapse",
  atlasRef,
  atlasHash,
  overallState: "pass",
  claimEffect: "reduced_order_candidate_blocker_retired",
  requiredRegions: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
  missingRequiredRegions: [],
  fullTensorRequiredForPromotion: true,
  diagonalProxyAllowedForPromotion: false,
  literatureRefs: [],
  reasonCodes: [],
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    status: "pass",
    comparisonBasisStatus: "same_basis",
    metricRequired: {
      tensorRef: `metric:${regionId}`,
      tensorAuthorityMode: "full_tensor",
      tensor: tensor(-10),
      chartRef: "comoving_cartesian",
      unitsRef: "J/m^3",
      aggregationMode: "mean",
      normalizationBasis: "volume",
      sampleCount: 8,
    },
    tileEffectiveCounterpart: {
      tensorRef: `source:${regionId}`,
      tensorAuthorityMode: "full_tensor",
      tensor: tensor(-10),
      chartRef: "comoving_cartesian",
      unitsRef: "J/m^3",
      aggregationMode: "mean",
      normalizationBasis: "volume",
      sampleCount: 8,
      comparisonRole: "tile_effective_counterpart",
    },
    residuals: {
      componentResiduals: {
        T00: {
          metricRequired: -10,
          tileEffectiveCounterpart: -10,
          absResidual: 0,
          relResidual: 0,
        },
      },
      relLInf: 0,
      absLInf: 0,
      toleranceRelLInf: 0.1,
      pass: true,
    },
    blockers: [],
  })),
});

const readiness = () => ({
  schemaVersion: "nhm2_source_closure_pass_readiness/v1" as const,
  sourceClosurePassSignalAllowed: true,
  firstRetirableBlocker: "none",
  preflightBlockers: [],
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    sourceClosurePassReady: true,
    blockers: [],
    nextRequiredEvidence: "none for this source-closure preflight",
  })),
});

const conservation = (): Nhm2TileCounterpartConservationArtifact => ({
  artifactId: "nhm2_tile_counterpart_conservation",
  schemaVersion: "nhm2_tile_counterpart_conservation/v1",
  runId: "pass-path-test",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  expectedProfileId: "stage1_centerline_alpha_0p995_v1",
  profileMatch: true,
  laneId: "nhm2_shift_lapse",
  chartRef: "comoving_cartesian",
  derivativeStencil: "fd4",
  unitsRef: "J/m^4",
  atlasRef,
  atlasHash,
  overallState: "pass",
  regions: NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.map((regionId) => ({
    regionId,
    status: "pass",
    divTResidualLInf: 0,
    continuityResidualLInf: 0,
    momentumResidualLInf: 0,
    toleranceLInf: 0.1,
    sampleCount: 8,
    blockers: [],
  })),
  claimEffect: "conservation_candidate",
  promotionAllowed: false,
  reasonCodes: [],
});

const materialReceipt = (): CasimirMaterialReceiptV1 => ({
  contractVersion: "casimir_material_receipt/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  tileBatchId: "tile-batch-material",
  geometry: {
    gapMeters: 8e-9,
    gapMetrologyStatus: "measured",
    roughnessRmsMeters: 1e-10,
    beyondPfaValidity: "pass",
  },
  material: {
    modelKind: "lifshitz",
    dielectricResponseRef: "dielectric-response.json",
    finiteConductivityIncluded: true,
    finiteTemperatureIncluded: true,
    roughnessCorrectionIncluded: true,
  },
  environment: { vacuumSealEvidence: "present", temperatureK: 4 },
  correctionFactors: { conductivity: 1, temperature: 1, roughness: 1, geometry: 1 },
  status: "material_receipted",
  literatureRefs: [
    "reid_white_johnson_2010_arbitrary_geometry_casimir",
    "klimchitskaya_mohideen_mostepanenko_2009_lifshitz_review",
  ],
  claimBoundary: {
    diagnosticOnly: true,
    idealCasimirDoesNotValidateTileSource: true,
  },
});

const qeiWorldlineDossier = (): Nhm2QeiWorldlineDossierV1 => ({
  contractVersion: "nhm2_qei_worldline_dossier/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  atlasRef,
  atlasHash,
  worldlines: [
    {
      worldlineId: "wall-1",
      regionId: "wall",
      chartId: "comoving_cartesian",
      samplingFunction: { kind: "gaussian", tauSeconds: 1e-6, normalized: true },
      sampledRho: { valueSI: -1, provenanceRef: "source:wall", status: "computed" },
      bound: { valueSI: -2, provenanceRef: "ford-roman", status: "computed" },
      margin: { valueSI: -1, pass: true },
      consistency: {
        tauVsDuty: "pass",
        tauVsLightCrossing: "pass",
        tauVsModulation: "pass",
      },
      blockers: [],
    },
  ],
  summary: {
    hasWallWorldline: true,
    allMarginsPass: true,
    anyProxy: false,
    dossierComplete: true,
  },
  literatureRefs: ["ford_roman_1996_quantum_inequality"],
  claimBoundary: { diagnosticOnly: true, scalarMarginCannotSubstituteForDossier: true },
});

const observerRobust = (): Nhm2ObserverRobustEnergyConditionArtifactV1 => ({
  contractVersion: "nhm2_observer_robust_energy_conditions/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  tensorRef: "source:regional",
  atlasRef,
  atlasHash,
  observerFamilies: [
    { familyId: "boosted_timelike_grid", status: "pass", sampleCount: 64, blockers: [] },
    { familyId: "algebraic_type_i", status: "pass", sampleCount: 4, blockers: [] },
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
});

const coupled = (): Nhm2CoupledClosurePassCandidateArtifactV1 => ({
  contractVersion: "nhm2_coupled_closure_pass_candidate/v1",
  generatedAt: "2026-06-12T00:00:00.000Z",
  laneId: "nhm2_shift_lapse",
  selectedProfileId: "stage1_centerline_alpha_0p995_v1",
  runId: "pass-path-test",
  atlasRef,
  atlasHash,
  artifactRefs: {
    regionalSupportFunctionAtlas: atlasRef,
    regionalMaterialSourceTensorModel: "regional-model.json",
    sourceComponentAuthorityLedger: "component-ledger.json",
    tileLocalSourceElements: null,
    tileEffectiveCounterpart: "counterpart.json",
    sourceSideSameBasisTensorAuthority: "authority.json",
    regionalSourceClosureEvidence: "regional.json",
    sourceClosurePassReadiness: "readiness.json",
    conservation: "conservation.json",
    qeiWorldlineDossier: "qei.json",
    observerRobustEnergyConditions: "observer.json",
    casimirMaterialReceipt: "receipt.json",
  },
  gates: [],
  summary: {
    passCandidate: true,
    sourceClosurePassSignalAllowed: true,
    allRequiredRegionsAuthoritative: true,
    sourceComponentAuthorityComplete: true,
    wallAuthorityPresent: true,
    wallClosureReady: true,
    regionalResidualsPass: true,
    conservationPass: true,
    qeiDossierPass: true,
    observerRobustPass: true,
    materialReceipted: true,
    firstBlocker: "none",
    blockerCount: 0,
    atlasConsumerCongruencePass: true,
  },
  claimBoundary: {
    diagnosticOnly: true,
    physicalViabilityClaimAllowed: false,
    transportClaimAllowed: false,
    doesNotRecomputePhysics: true,
    requiresSameRunSameChartEvidence: true,
  },
});

const allPassingInput = () => ({
  regionalSupportFunctionAtlas: atlas(),
  regionalMaterialSourceTensorModel: regionalModel(),
  sourceComponentAuthorityLedger: sourceComponentAuthorityLedger(),
  sourceSideSameBasisTensorAuthority: sourceAuthority(),
  regionalSourceClosureEvidence: regionalEvidence(),
  sourceClosurePassReadiness: readiness(),
  conservation: conservation(),
  qeiWorldlineDossier: qeiWorldlineDossier(),
  observerRobustEnergyConditions: observerRobust(),
  casimirMaterialReceipt: materialReceipt(),
  coupledClosurePassCandidate: coupled(),
});

describe("nhm2_regional_tensor_pass_path_harness/v1", () => {
  it("reports missing numerical evidence instead of passing", () => {
    const artifact = buildNhm2RegionalTensorPassPathHarness({});

    expect(artifact.summary.numericalPassPathReady).toBe(false);
    expect(artifact.summary.firstBlocker).toBe("regional_support_function_atlas_missing");
    expect(artifact.gates.every((gate) => gate.status === "missing")).toBe(true);
    expect(artifact.claimBoundary.scalarOrWallOnlyCannotPass).toBe(true);
    expect(isNhm2RegionalTensorPassPathHarnessArtifact(artifact)).toBe(true);
  });

  it("does not let a wall-only source tensor model pass regional tensor authority", () => {
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...allPassingInput(),
      regionalMaterialSourceTensorModel: regionalModel(["wall"]),
    });

    const regionalTensorGate = artifact.gates.find(
      (gate) => gate.gateId === "regional_material_source_tensors",
    );
    expect(artifact.summary.numericalPassPathReady).toBe(false);
    expect(artifact.summary.realRegionalSameBasisTensors).toBe(false);
    expect(regionalTensorGate?.status).toBe("review");
    expect(regionalTensorGate?.blockers).toContain("regional_full_tensor_authority_incomplete");
    expect(artifact.regions.find((region) => region.regionId === "hull")?.blockers).toContain(
      "source:regional_source_tensor_missing",
    );
  });

  it("does not let scalar QEI margin substitute for a worldline dossier", () => {
    const scalarQeiMargin = 1;
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...allPassingInput(),
      qeiWorldlineDossier: null,
    });

    expect(scalarQeiMargin).toBeGreaterThan(0);
    expect(artifact.summary.numericalPassPathReady).toBe(false);
    expect(artifact.summary.qeiDossierPass).toBe(false);
    expect(artifact.gates.find((gate) => gate.gateId === "qei_worldline_dossier")?.status).toBe("missing");
    expect(artifact.gates.find((gate) => gate.gateId === "qei_worldline_dossier")?.blockers).toContain(
      "qei_worldline_dossier_missing",
    );
  });

  it("moves QEI blocker from missing artifact to concrete bound provenance failure", () => {
    const incompleteQei = qeiWorldlineDossier();
    incompleteQei.worldlines = incompleteQei.worldlines.map((worldline) => ({
      ...worldline,
      bound: { valueSI: null, status: "missing" },
      margin: { valueSI: null, pass: null },
      blockers: ["qei_bound_missing", "qei_bound_provenance_missing"],
    }));
    incompleteQei.summary = {
      hasWallWorldline: true,
      allMarginsPass: null,
      anyProxy: false,
      dossierComplete: false,
    };
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...allPassingInput(),
      qeiWorldlineDossier: incompleteQei,
    });
    const gate = artifact.gates.find((entry) => entry.gateId === "qei_worldline_dossier");

    expect(gate?.status).toBe("blocked");
    expect(gate?.blockers).not.toContain("qei_worldline_dossier_missing");
    expect(gate?.blockers).toContain("qei_worldline_dossier_incomplete");
    expect(gate?.blockers).toContain("wall-1:qei_bound_missing");
    expect(artifact.summary.qeiDossierPass).toBe(false);
  });

  it("uses component authority to retire stale source authority blockers", () => {
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...allPassingInput(),
      sourceSideSameBasisTensorAuthority: staleSourceAuthority(),
    });
    const gate = artifact.gates.find(
      (entry) => entry.gateId === "source_side_same_basis_authority",
    );

    expect(gate?.status).toBe("pass");
    expect(gate?.warnings).toContain(
      "component_ledger_superseded_stale_source_authority_summary",
    );
    expect(gate?.blockers).not.toContain("wall_source_authority_missing");
    expect(artifact.summary.numericalPassPathReady).toBe(true);
  });

  it("distinguishes scalar residual alignment from authority metadata blockers", () => {
    const evidence = regionalEvidence();
    evidence.overallState = "review";
    evidence.regions = evidence.regions.map((region) =>
      region.regionId === "global"
        ? {
            ...region,
            status: "review",
            blockers: ["same_basis_metadata_missing"],
          }
        : region,
    );
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...allPassingInput(),
      regionalSourceClosureEvidence: evidence,
    });
    const gate = artifact.gates.find((entry) => entry.gateId === "regional_residuals");

    expect(gate?.status).toBe("review");
    expect(gate?.blockers).toContain(
      "global:regional_scalar_T00_pass_authority_or_metadata_incomplete",
    );
    expect(gate?.blockers).not.toContain("global:regional_residual_not_pass");
  });

  it("passes only when regional tensors and all downstream numerical gates pass together", () => {
    const artifact = buildNhm2RegionalTensorPassPathHarness(allPassingInput());

    expect(artifact.summary.numericalPassPathReady).toBe(true);
    expect(artifact.summary.firstBlocker).toBe("none");
    expect(artifact.gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(artifact.claimBoundary.numericalPassPathIsNotPhysicalViability).toBe(true);
    expect(isNhm2RegionalTensorPassPathHarnessArtifact(artifact)).toBe(true);
  });

  it("uses regional full-tensor residual artifacts instead of scalar residual summaries when present", () => {
    const evidence = regionalEvidence();
    evidence.regions = evidence.regions.map((region) =>
      region.regionId === "wall"
        ? {
            ...region,
            tileEffectiveCounterpart: {
              ...region.tileEffectiveCounterpart,
              tensor: { ...region.tileEffectiveCounterpart.tensor, T12: 3 },
            },
          }
        : region,
    );
    const fullTensorResidual = buildNhm2RegionalFullTensorResidual({
      regionalSourceClosureEvidence: evidence,
    });
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...allPassingInput(),
      regionalSourceClosureEvidence: evidence,
      regionalFullTensorResidual: fullTensorResidual,
    });
    const gate = artifact.gates.find((entry) => entry.gateId === "regional_residuals");

    expect(gate?.status).toBe("fail");
    expect(gate?.blockers.some((blocker) => blocker.includes("wall:T12"))).toBe(true);
    expect(artifact.summary.regionalResidualsPass).toBe(false);
  });

  it("uses covariant conservation diagnostics when present", () => {
    const input = allPassingInput();
    const covariant = buildNhm2CovariantConservationDiagnostic({
      atlas: input.regionalSupportFunctionAtlas,
      atlasRef,
      reducedOrderConservation: input.conservation,
      reducedOrderConservationRef: "conservation.json",
    });
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...input,
      covariantConservationDiagnostic: covariant,
    });
    const gate = artifact.gates.find((entry) => entry.gateId === "conservation");

    expect(input.conservation.overallState).toBe("pass");
    expect(covariant.summary.covariantConservationPass).toBe(false);
    expect(gate?.status).toBe("review");
    expect(gate?.blockers).toContain("global:partial_mu_support_derivatives_missing");
    expect(artifact.summary.conservationPass).toBe(false);
  });

  it("blocks numerical readiness when the coupled candidate uses a stale atlas hash", () => {
    const input = allPassingInput();
    const artifact = buildNhm2RegionalTensorPassPathHarness({
      ...input,
      coupledClosurePassCandidate: {
        ...input.coupledClosurePassCandidate,
        atlasHash: "stale-atlas-hash",
      },
    });
    const atlasGate = artifact.gates.find(
      (gate) => gate.gateId === "regional_support_function_atlas",
    );

    expect(artifact.summary.numericalPassPathReady).toBe(false);
    expect(artifact.summary.atlasConsumerCongruencePass).toBe(false);
    expect(atlasGate?.blockers).toContain(
      "coupled_closure_pass_candidate:atlas_hash_mismatch",
    );
  });
});
