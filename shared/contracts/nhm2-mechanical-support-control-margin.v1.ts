import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";

export const NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CONTRACT_VERSION =
  "nhm2_mechanical_support_control_margin/v1" as const;

export const NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.mechanical_support_control_margin,
] as const;

export const NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS = [
  "pull_in",
  "buckling",
  "contact",
  "stiction",
] as const;

export const NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS = [
  "stress",
  "thermal",
  "fatigue",
  "modal",
] as const;

export const NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS = [
  "gap",
  "surface_roughness",
  "alignment",
  "support_thickness",
] as const;

export const NHM2_MECHANICAL_CONTROL_BUDGET_IDS = [
  "cycle_energy",
  "displacement_noise",
  "heat_load",
  "timing_jitter",
] as const;

export const NHM2_MECHANICAL_SOURCE_TERM_IDS = [
  "mechanical_structure",
  "supports",
  "controls",
  "thermal",
] as const;

export const NHM2_MECHANICAL_DIAGNOSTIC_MINIMA = {
  forceGapSamples: 5,
  nonlinearFeaSamples: 8,
  nonlinearFeaCells: 64,
  nonlinearIterations: 3,
  supportRetentionSamples: 64,
  marginSamples: 32,
  fabricationSamples: 100,
  controlTraceSamples: 64,
  periodicCycles: 8,
  samplesPerCycle: 8,
  apparatusStressEnergySamples: 8,
} as const;

const CARTESIAN_VECTOR_COMPONENT_ORDER = ["x", "y", "z"] as const;
const CARTESIAN_TENSOR_COMPONENT_ORDER = [
  "xx",
  "xy",
  "xz",
  "yx",
  "yy",
  "yz",
  "zx",
  "zy",
  "zz",
] as const;
const SPACETIME_TENSOR_COMPONENT_ORDER = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T10",
  "T11",
  "T12",
  "T13",
  "T20",
  "T21",
  "T22",
  "T23",
  "T30",
  "T31",
  "T32",
  "T33",
] as const;
const MECHANICAL_MARGIN_COMPONENT_ORDER = [
  ...NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS,
  ...NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS,
] as const;

export type Nhm2MechanicalSupportControlCheckId =
  (typeof NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CHECK_IDS)[number];
export type Nhm2MechanicalInstabilityMarginId =
  (typeof NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS)[number];
export type Nhm2MechanicalStructuralMarginId =
  (typeof NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS)[number];
export type Nhm2MechanicalFabricationParameterId =
  (typeof NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS)[number];
export type Nhm2MechanicalControlBudgetId =
  (typeof NHM2_MECHANICAL_CONTROL_BUDGET_IDS)[number];
export type Nhm2MechanicalSourceTermId =
  (typeof NHM2_MECHANICAL_SOURCE_TERM_IDS)[number];
export type Nhm2MechanicalSupportControlStatus = "pass" | "blocked" | "fail";

export type Nhm2MechanicalArtifactRefV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2MechanicalArrayRefV1 = Nhm2MechanicalArtifactRefV1 & {
  dtype: "float64" | null;
  shape: number[];
  sizeBytes: number | null;
  storageOrder: "row-major" | "column-major" | null;
  componentOrder: string[];
  unit: string | null;
};

export type Nhm2MechanicalBindingV1 = {
  candidateId: string | null;
  candidateManifestPath: string | null;
  candidateManifestSha256: string | null;
  preRunManifestPath: string | null;
  preRunManifestSha256: string | null;
  numericPolicySetPath: string | null;
  numericPolicySetRawSha256: string | null;
  numericPolicySetSemanticSha256: string | null;
  laneId: "nhm2_shift_lapse" | null;
  runId: string | null;
  requestId: string | null;
  receiptId: string | null;
  runtimeId: string | null;
  selectedProfileId: string | null;
  chartId: string | null;
  atlasPath: string | null;
  atlasSha256: string | null;
  unitsPath: string | null;
  unitsSha256: string | null;
  normalizationPath: string | null;
  normalizationSha256: string | null;
  gitSha: string | null;
};

type Nhm2MechanicalMarginEntryV1<T extends string> = {
  marginId: T | null;
  evidence: Nhm2MechanicalArtifactRefV1;
  rawSamples: Nhm2MechanicalArrayRefV1;
  nominalMargin: number | null;
  absoluteUncertainty95: number | null;
  minimumAllowedMargin: number | null;
  unit: string | null;
};

export type Nhm2MechanicalSupportControlMarginV1 = {
  contractVersion: typeof NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CONTRACT_VERSION;
  generatedAt: string | null;
  binding: Nhm2MechanicalBindingV1;
  forceGradientImport: {
    sourceContractVersion:
      "casimir_finite_temperature_finite_geometry_maxwell_stress/v1" | null;
    sourceEvidence: Nhm2MechanicalArtifactRefV1;
    sourceCandidateId: string | null;
    sourceCandidateManifestSha256: string | null;
    sourceRunId: string | null;
    forceGapCoordinates: Nhm2MechanicalArrayRefV1;
    integratedForce: Nhm2MechanicalArrayRefV1;
    forceGradient: Nhm2MechanicalArrayRefV1;
    anchorTractionField: Nhm2MechanicalArrayRefV1;
    targetGapM: number | null;
    forceAtTargetN: number | null;
    forceUncertainty95N: number | null;
    forceGradientAtTargetNPerM: number | null;
    forceGradientUncertainty95NPerM: number | null;
    idealParallelPlateFallbackUsed: boolean | null;
  };
  nonlinearFea: {
    formulation: "coupled_nonlinear_thermomechanical_electrostatic" | null;
    solver: Nhm2MechanicalArtifactRefV1;
    geometry: Nhm2MechanicalArtifactRefV1;
    mesh: Nhm2MechanicalArtifactRefV1;
    materialModels: Nhm2MechanicalArtifactRefV1;
    contactModel: Nhm2MechanicalArtifactRefV1;
    boundaryConditions: Nhm2MechanicalArtifactRefV1;
    loadMap: Nhm2MechanicalArtifactRefV1;
    sampleCount: number | null;
    cellCount: number | null;
    nonlinearIterationCount: number | null;
    converged: boolean | null;
    residualNorm: number | null;
    residualUncertainty95: number | null;
    residualTolerance: number | null;
    displacementField: Nhm2MechanicalArrayRefV1;
    strainField: Nhm2MechanicalArrayRefV1;
    stressField: Nhm2MechanicalArrayRefV1;
    temperatureField: Nhm2MechanicalArrayRefV1;
    contactPressureField: Nhm2MechanicalArrayRefV1;
    modalSpectrum: Nhm2MechanicalArrayRefV1;
    supportsIncluded: boolean | null;
    controlsIncluded: boolean | null;
    materialNonlinearityIncluded: boolean | null;
    geometricNonlinearityIncluded: boolean | null;
  };
  supportRetention: {
    evidence: Nhm2MechanicalArtifactRefV1;
    jointSamples: Nhm2MechanicalArrayRefV1;
    confidenceLevel: number | null;
    structuralMinimumSupportFractionUpper95: number | null;
    retentionCompatibleMaximumSupportFractionLower95: number | null;
    overlapRatioLower95: number | null;
    overlapRatioConsistencyTolerance: number | null;
    requiredStrictLowerBound: 1 | null;
  };
  instabilityMargins: Array<
    Nhm2MechanicalMarginEntryV1<Nhm2MechanicalInstabilityMarginId>
  >;
  structuralMargins: Array<
    Nhm2MechanicalMarginEntryV1<Nhm2MechanicalStructuralMarginId>
  >;
  fabricationEnvelope: {
    evidence: Nhm2MechanicalArtifactRefV1;
    jointSamples: Nhm2MechanicalArrayRefV1;
    confidenceLevel: number | null;
    requiredCoverageFraction: number | null;
    parameters: Array<{
      parameterId: Nhm2MechanicalFabricationParameterId | null;
      distribution: Nhm2MechanicalArtifactRefV1;
      samples: Nhm2MechanicalArrayRefV1;
      allowedMinimum: number | null;
      allowedMaximum: number | null;
      manufacturedLower95: number | null;
      manufacturedUpper95: number | null;
      unit: string | null;
    }>;
    passingSampleCount: number | null;
    totalSampleCount: number | null;
  };
  activeControl: {
    controller: Nhm2MechanicalArtifactRefV1;
    actuatorModel: Nhm2MechanicalArtifactRefV1;
    sensorModel: Nhm2MechanicalArtifactRefV1;
    transferFunction: Nhm2MechanicalArrayRefV1;
    commandTrace: Nhm2MechanicalArrayRefV1;
    responseTrace: Nhm2MechanicalArrayRefV1;
    noiseSpectrum: Nhm2MechanicalArrayRefV1;
    heatTrace: Nhm2MechanicalArrayRefV1;
    timingTrace: Nhm2MechanicalArrayRefV1;
    cyclePeriodS: number | null;
    dutyFraction: number | null;
    budgets: Array<{
      budgetId: Nhm2MechanicalControlBudgetId | null;
      evidence: Nhm2MechanicalArtifactRefV1;
      measuredUpper95: number | null;
      maximumAllowed: number | null;
      unit: string | null;
    }>;
  };
  periodicCycleEnergy: {
    evidence: Nhm2MechanicalArtifactRefV1;
    timeSeries: Nhm2MechanicalArrayRefV1;
    cycleCount: number | null;
    inputEnergyJ: number | null;
    recoveredEnergyJ: number | null;
    dissipatedHeatJ: number | null;
    storedEnergyChangeJ: number | null;
    exportedMechanicalWorkJ: number | null;
    absoluteUncertainty95J: number | null;
    normalizationEnergyJ: number | null;
    toleranceRelative: number | null;
  };
  apparatusStressEnergy: {
    evidence: Nhm2MechanicalArtifactRefV1;
    aggregationOperator: Nhm2MechanicalArtifactRefV1;
    fullSourceTensor: Nhm2MechanicalArrayRefV1;
    chartId: string | null;
    sampleCount: number | null;
    includedInCandidateSourceTensor: boolean | null;
    candidateSourceTensor: Nhm2MechanicalArtifactRefV1;
    terms: Array<{
      termId: Nhm2MechanicalSourceTermId | null;
      constitutiveModel: Nhm2MechanicalArtifactRefV1;
      tensor: Nhm2MechanicalArrayRefV1;
      sampleCount: number | null;
    }>;
  };
  uncertainty: {
    evidence: Nhm2MechanicalArtifactRefV1;
    covariance: Nhm2MechanicalArrayRefV1;
    confidenceLevel: number | null;
    method: Nhm2MechanicalArtifactRefV1;
  };
  provenance: {
    producerId: string | null;
    implementationId: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: Nhm2MechanicalArtifactRefV1;
    environment: Nhm2MechanicalArtifactRefV1;
    invocation: Nhm2MechanicalArtifactRefV1;
    command: string | null;
    argv: string[];
    workingDirectory: string | null;
    inputManifest: Nhm2MechanicalArtifactRefV1;
    runId: string | null;
    requestId: string | null;
    receiptId: string | null;
    runtimeId: string | null;
    gitSha: string | null;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
    deterministicSeed: string | null;
    runSpecificOutput: boolean | null;
  };
  checks: Array<{
    checkId: Nhm2MechanicalSupportControlCheckId;
    status: Nhm2MechanicalSupportControlStatus;
    pass: boolean;
    metricValue: number | null;
    tolerance: number | null;
    unit: string | null;
    blockers: string[];
  }>;
  status: Nhm2MechanicalSupportControlStatus;
  mechanicalSupportControlMarginReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    apparatusTheoryEvidenceOnly: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2MechanicalSupportControlMarginV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "mechanicalSupportControlMarginReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2MechanicalSupportControlMarginInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2MechanicalSupportControlCheckId;
  missing: string[];
  failures: string[];
  metricValue: number | null;
  tolerance: number | null;
  unit: string | null;
};

const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const MATERIAL_CONTRACT =
  "casimir_finite_temperature_finite_geometry_maxwell_stress/v1" as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const recordOf = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const bool = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;
const unique = (values: string[]): string[] => [...new Set(values)];

const artifact = (value: unknown): Nhm2MechanicalArtifactRefV1 => {
  const item = recordOf(value);
  return { path: text(item.path), sha256: text(item.sha256) };
};

const arrayRef = (value: unknown): Nhm2MechanicalArrayRefV1 => {
  const item = recordOf(value);
  const shape = Array.isArray(item.shape) ? item.shape.map(finite) : [];
  const componentOrder = Array.isArray(item.componentOrder)
    ? item.componentOrder.map(text)
    : [];
  return {
    ...artifact(item),
    dtype: item.dtype === "float64" ? "float64" : null,
    shape: shape.every((entry): entry is number => entry != null) ? shape : [],
    sizeBytes: finite(item.sizeBytes),
    storageOrder:
      item.storageOrder === "row-major" || item.storageOrder === "column-major"
        ? item.storageOrder
        : null,
    componentOrder: componentOrder.every(
      (entry): entry is string => entry != null,
    )
      ? componentOrder
      : [],
    unit: text(item.unit),
  };
};

const enumValue = <T extends string>(
  value: unknown,
  values: readonly T[],
): T | null => {
  const candidate = text(value);
  return values.includes(candidate as T) ? (candidate as T) : null;
};

const marginEntry = <T extends string>(
  value: unknown,
  ids: readonly T[],
): Nhm2MechanicalMarginEntryV1<T> => {
  const item = recordOf(value);
  return {
    marginId: enumValue(item.marginId, ids),
    evidence: artifact(item.evidence),
    rawSamples: arrayRef(item.rawSamples),
    nominalMargin: finite(item.nominalMargin),
    absoluteUncertainty95: finite(item.absoluteUncertainty95),
    minimumAllowedMargin: finite(item.minimumAllowedMargin),
    unit: text(item.unit),
  };
};

const normalizePrimitive = (
  input: BuildNhm2MechanicalSupportControlMarginInput,
): PrimitiveEvidence => {
  const root = recordOf(input);
  const binding = recordOf(root.binding);
  const force = recordOf(root.forceGradientImport);
  const fea = recordOf(root.nonlinearFea);
  const overlap = recordOf(root.supportRetention);
  const fabrication = recordOf(root.fabricationEnvelope);
  const control = recordOf(root.activeControl);
  const cycle = recordOf(root.periodicCycleEnergy);
  const stressEnergy = recordOf(root.apparatusStressEnergy);
  const uncertainty = recordOf(root.uncertainty);
  const provenance = recordOf(root.provenance);
  return {
    generatedAt: text(root.generatedAt),
    binding: {
      candidateId: text(binding.candidateId),
      candidateManifestPath: text(binding.candidateManifestPath),
      candidateManifestSha256: text(binding.candidateManifestSha256),
      preRunManifestPath: text(binding.preRunManifestPath),
      preRunManifestSha256: text(binding.preRunManifestSha256),
      numericPolicySetPath: text(binding.numericPolicySetPath),
      numericPolicySetRawSha256: text(binding.numericPolicySetRawSha256),
      numericPolicySetSemanticSha256: text(
        binding.numericPolicySetSemanticSha256,
      ),
      laneId: binding.laneId === "nhm2_shift_lapse" ? "nhm2_shift_lapse" : null,
      runId: text(binding.runId),
      requestId: text(binding.requestId),
      receiptId: text(binding.receiptId),
      runtimeId: text(binding.runtimeId),
      selectedProfileId: text(binding.selectedProfileId),
      chartId: text(binding.chartId),
      atlasPath: text(binding.atlasPath),
      atlasSha256: text(binding.atlasSha256),
      unitsPath: text(binding.unitsPath),
      unitsSha256: text(binding.unitsSha256),
      normalizationPath: text(binding.normalizationPath),
      normalizationSha256: text(binding.normalizationSha256),
      gitSha: text(binding.gitSha),
    },
    forceGradientImport: {
      sourceContractVersion:
        force.sourceContractVersion === MATERIAL_CONTRACT
          ? MATERIAL_CONTRACT
          : null,
      sourceEvidence: artifact(force.sourceEvidence),
      sourceCandidateId: text(force.sourceCandidateId),
      sourceCandidateManifestSha256: text(force.sourceCandidateManifestSha256),
      sourceRunId: text(force.sourceRunId),
      forceGapCoordinates: arrayRef(force.forceGapCoordinates),
      integratedForce: arrayRef(force.integratedForce),
      forceGradient: arrayRef(force.forceGradient),
      anchorTractionField: arrayRef(force.anchorTractionField),
      targetGapM: finite(force.targetGapM),
      forceAtTargetN: finite(force.forceAtTargetN),
      forceUncertainty95N: finite(force.forceUncertainty95N),
      forceGradientAtTargetNPerM: finite(force.forceGradientAtTargetNPerM),
      forceGradientUncertainty95NPerM: finite(
        force.forceGradientUncertainty95NPerM,
      ),
      idealParallelPlateFallbackUsed: bool(
        force.idealParallelPlateFallbackUsed,
      ),
    },
    nonlinearFea: {
      formulation:
        fea.formulation === "coupled_nonlinear_thermomechanical_electrostatic"
          ? "coupled_nonlinear_thermomechanical_electrostatic"
          : null,
      solver: artifact(fea.solver),
      geometry: artifact(fea.geometry),
      mesh: artifact(fea.mesh),
      materialModels: artifact(fea.materialModels),
      contactModel: artifact(fea.contactModel),
      boundaryConditions: artifact(fea.boundaryConditions),
      loadMap: artifact(fea.loadMap),
      sampleCount: finite(fea.sampleCount),
      cellCount: finite(fea.cellCount),
      nonlinearIterationCount: finite(fea.nonlinearIterationCount),
      converged: bool(fea.converged),
      residualNorm: finite(fea.residualNorm),
      residualUncertainty95: finite(fea.residualUncertainty95),
      residualTolerance: finite(fea.residualTolerance),
      displacementField: arrayRef(fea.displacementField),
      strainField: arrayRef(fea.strainField),
      stressField: arrayRef(fea.stressField),
      temperatureField: arrayRef(fea.temperatureField),
      contactPressureField: arrayRef(fea.contactPressureField),
      modalSpectrum: arrayRef(fea.modalSpectrum),
      supportsIncluded: bool(fea.supportsIncluded),
      controlsIncluded: bool(fea.controlsIncluded),
      materialNonlinearityIncluded: bool(fea.materialNonlinearityIncluded),
      geometricNonlinearityIncluded: bool(fea.geometricNonlinearityIncluded),
    },
    supportRetention: {
      evidence: artifact(overlap.evidence),
      jointSamples: arrayRef(overlap.jointSamples),
      confidenceLevel: finite(overlap.confidenceLevel),
      structuralMinimumSupportFractionUpper95: finite(
        overlap.structuralMinimumSupportFractionUpper95,
      ),
      retentionCompatibleMaximumSupportFractionLower95: finite(
        overlap.retentionCompatibleMaximumSupportFractionLower95,
      ),
      overlapRatioLower95: finite(overlap.overlapRatioLower95),
      overlapRatioConsistencyTolerance: finite(
        overlap.overlapRatioConsistencyTolerance,
      ),
      requiredStrictLowerBound:
        overlap.requiredStrictLowerBound === 1 ? 1 : null,
    },
    instabilityMargins: (Array.isArray(root.instabilityMargins)
      ? root.instabilityMargins
      : []
    ).map((value) =>
      marginEntry(value, NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS),
    ),
    structuralMargins: (Array.isArray(root.structuralMargins)
      ? root.structuralMargins
      : []
    ).map((value) => marginEntry(value, NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS)),
    fabricationEnvelope: {
      evidence: artifact(fabrication.evidence),
      jointSamples: arrayRef(fabrication.jointSamples),
      confidenceLevel: finite(fabrication.confidenceLevel),
      requiredCoverageFraction: finite(fabrication.requiredCoverageFraction),
      parameters: (Array.isArray(fabrication.parameters)
        ? fabrication.parameters
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          parameterId: enumValue(
            item.parameterId,
            NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS,
          ),
          distribution: artifact(item.distribution),
          samples: arrayRef(item.samples),
          allowedMinimum: finite(item.allowedMinimum),
          allowedMaximum: finite(item.allowedMaximum),
          manufacturedLower95: finite(item.manufacturedLower95),
          manufacturedUpper95: finite(item.manufacturedUpper95),
          unit: text(item.unit),
        };
      }),
      passingSampleCount: finite(fabrication.passingSampleCount),
      totalSampleCount: finite(fabrication.totalSampleCount),
    },
    activeControl: {
      controller: artifact(control.controller),
      actuatorModel: artifact(control.actuatorModel),
      sensorModel: artifact(control.sensorModel),
      transferFunction: arrayRef(control.transferFunction),
      commandTrace: arrayRef(control.commandTrace),
      responseTrace: arrayRef(control.responseTrace),
      noiseSpectrum: arrayRef(control.noiseSpectrum),
      heatTrace: arrayRef(control.heatTrace),
      timingTrace: arrayRef(control.timingTrace),
      cyclePeriodS: finite(control.cyclePeriodS),
      dutyFraction: finite(control.dutyFraction),
      budgets: (Array.isArray(control.budgets) ? control.budgets : []).map(
        (value) => {
          const item = recordOf(value);
          return {
            budgetId: enumValue(
              item.budgetId,
              NHM2_MECHANICAL_CONTROL_BUDGET_IDS,
            ),
            evidence: artifact(item.evidence),
            measuredUpper95: finite(item.measuredUpper95),
            maximumAllowed: finite(item.maximumAllowed),
            unit: text(item.unit),
          };
        },
      ),
    },
    periodicCycleEnergy: {
      evidence: artifact(cycle.evidence),
      timeSeries: arrayRef(cycle.timeSeries),
      cycleCount: finite(cycle.cycleCount),
      inputEnergyJ: finite(cycle.inputEnergyJ),
      recoveredEnergyJ: finite(cycle.recoveredEnergyJ),
      dissipatedHeatJ: finite(cycle.dissipatedHeatJ),
      storedEnergyChangeJ: finite(cycle.storedEnergyChangeJ),
      exportedMechanicalWorkJ: finite(cycle.exportedMechanicalWorkJ),
      absoluteUncertainty95J: finite(cycle.absoluteUncertainty95J),
      normalizationEnergyJ: finite(cycle.normalizationEnergyJ),
      toleranceRelative: finite(cycle.toleranceRelative),
    },
    apparatusStressEnergy: {
      evidence: artifact(stressEnergy.evidence),
      aggregationOperator: artifact(stressEnergy.aggregationOperator),
      fullSourceTensor: arrayRef(stressEnergy.fullSourceTensor),
      chartId: text(stressEnergy.chartId),
      sampleCount: finite(stressEnergy.sampleCount),
      includedInCandidateSourceTensor: bool(
        stressEnergy.includedInCandidateSourceTensor,
      ),
      candidateSourceTensor: artifact(stressEnergy.candidateSourceTensor),
      terms: (Array.isArray(stressEnergy.terms) ? stressEnergy.terms : []).map(
        (value) => {
          const item = recordOf(value);
          return {
            termId: enumValue(item.termId, NHM2_MECHANICAL_SOURCE_TERM_IDS),
            constitutiveModel: artifact(item.constitutiveModel),
            tensor: arrayRef(item.tensor),
            sampleCount: finite(item.sampleCount),
          };
        },
      ),
    },
    uncertainty: {
      evidence: artifact(uncertainty.evidence),
      covariance: arrayRef(uncertainty.covariance),
      confidenceLevel: finite(uncertainty.confidenceLevel),
      method: artifact(uncertainty.method),
    },
    provenance: {
      producerId: text(provenance.producerId),
      implementationId: text(provenance.implementationId),
      solverId: text(provenance.solverId),
      solverVersion: text(provenance.solverVersion),
      solver: artifact(provenance.solver),
      environment: artifact(provenance.environment),
      invocation: artifact(provenance.invocation),
      command: text(provenance.command),
      argv: Array.isArray(provenance.argv)
        ? provenance.argv
            .map(text)
            .filter((entry): entry is string => entry != null)
        : [],
      workingDirectory: text(provenance.workingDirectory),
      inputManifest: artifact(provenance.inputManifest),
      runId: text(provenance.runId),
      requestId: text(provenance.requestId),
      receiptId: text(provenance.receiptId),
      runtimeId: text(provenance.runtimeId),
      gitSha: text(provenance.gitSha),
      startedAt: text(provenance.startedAt),
      completedAt: text(provenance.completedAt),
      durationMs: finite(provenance.durationMs),
      deterministicSeed: text(provenance.deterministicSeed),
      runSpecificOutput: bool(provenance.runSpecificOutput),
    },
  };
};

const draft = (checkId: Nhm2MechanicalSupportControlCheckId): CheckDraft => ({
  checkId,
  missing: [],
  failures: [],
  metricValue: null,
  tolerance: null,
  unit: null,
});

const requireText = (
  value: string | null,
  id: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${id}_missing`);
};

const requireHash = (
  value: string | null,
  id: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${id}_missing`);
  else if (!SHA256.test(value)) check.failures.push(`${id}_invalid`);
};

const requireArtifact = (
  value: Nhm2MechanicalArtifactRefV1,
  id: string,
  check: CheckDraft,
): void => {
  requireText(value.path, `${id}_path`, check);
  requireHash(value.sha256, `${id}_sha256`, check);
};

const requireArray = (
  value: Nhm2MechanicalArrayRefV1,
  id: string,
  check: CheckDraft,
  expectedFirstDimension?: number | null,
  expectedComponentOrder?: readonly string[],
): void => {
  requireArtifact(value, id, check);
  if (value.dtype == null) check.missing.push(`${id}_dtype_missing`);
  if (value.unit == null) check.missing.push(`${id}_unit_missing`);
  if (value.storageOrder == null)
    check.missing.push(`${id}_storage_order_missing`);
  if (value.componentOrder.length === 0)
    check.missing.push(`${id}_component_order_missing`);
  else if (
    expectedComponentOrder != null &&
    (value.componentOrder.length !== expectedComponentOrder.length ||
      value.componentOrder.some(
        (component, index) => component !== expectedComponentOrder[index],
      ))
  )
    check.failures.push(`${id}_component_order_invalid`);
  let elementCount: number | null = null;
  if (value.shape.length === 0) check.missing.push(`${id}_shape_missing`);
  else if (
    value.shape.some(
      (dimension) => !Number.isSafeInteger(dimension) || dimension <= 0,
    )
  ) {
    check.failures.push(`${id}_shape_invalid`);
  } else {
    const product = value.shape.reduce(
      (total, dimension) => total * dimension,
      1,
    );
    if (Number.isSafeInteger(product)) elementCount = product;
    else check.failures.push(`${id}_shape_product_invalid`);
  }
  if (value.sizeBytes == null) check.missing.push(`${id}_size_bytes_missing`);
  else if (
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    (elementCount != null && value.sizeBytes !== elementCount * 8)
  )
    check.failures.push(`${id}_size_bytes_invalid`);
  if (
    expectedFirstDimension != null &&
    value.shape.length > 0 &&
    value.shape[0] !== expectedFirstDimension
  )
    check.failures.push(`${id}_sample_count_mismatch`);
};

const requirePositive = (
  value: number | null,
  id: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${id}_missing`);
  else if (!(value > 0)) check.failures.push(`${id}_invalid`);
};

const requireNonnegative = (
  value: number | null,
  id: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${id}_missing`);
  else if (value < 0) check.failures.push(`${id}_invalid`);
};

const commonIntegrity = (
  value: PrimitiveEvidence,
): {
  missing: string[];
  failures: string[];
} => {
  const check = draft("force_gradient_imported_from_realistic_solver");
  const binding = value.binding;
  requireText(binding.candidateId, "candidate_id", check);
  requireText(binding.candidateManifestPath, "candidate_manifest_path", check);
  requireHash(
    binding.candidateManifestSha256,
    "candidate_manifest_sha256",
    check,
  );
  requireText(binding.preRunManifestPath, "pre_run_manifest_path", check);
  requireHash(binding.preRunManifestSha256, "pre_run_manifest_sha256", check);
  requireText(binding.numericPolicySetPath, "numeric_policy_set_path", check);
  requireHash(
    binding.numericPolicySetRawSha256,
    "numeric_policy_set_raw_sha256",
    check,
  );
  requireHash(
    binding.numericPolicySetSemanticSha256,
    "numeric_policy_set_semantic_sha256",
    check,
  );
  requireText(binding.laneId, "lane_id", check);
  requireText(binding.runId, "run_id", check);
  requireText(binding.requestId, "request_id", check);
  requireText(binding.receiptId, "receipt_id", check);
  requireText(binding.runtimeId, "runtime_id", check);
  requireText(binding.selectedProfileId, "selected_profile_id", check);
  requireText(binding.chartId, "chart_id", check);
  requireText(binding.atlasPath, "atlas_path", check);
  requireHash(binding.atlasSha256, "atlas_sha256", check);
  requireText(binding.unitsPath, "units_path", check);
  requireHash(binding.unitsSha256, "units_sha256", check);
  requireText(binding.normalizationPath, "normalization_path", check);
  requireHash(binding.normalizationSha256, "normalization_sha256", check);
  if (binding.gitSha == null) check.missing.push("git_sha_missing");
  else if (!GIT_SHA.test(binding.gitSha))
    check.failures.push("git_sha_invalid");
  if (
    binding.candidateManifestSha256 != null &&
    binding.preRunManifestSha256 != null &&
    binding.candidateManifestSha256 !== binding.preRunManifestSha256
  )
    check.failures.push("pre_run_manifest_candidate_sha_mismatch");

  const provenance = value.provenance;
  requireText(provenance.producerId, "producer_id", check);
  requireText(provenance.implementationId, "implementation_id", check);
  requireText(provenance.solverId, "solver_id", check);
  requireText(provenance.solverVersion, "solver_version", check);
  requireArtifact(provenance.solver, "solver", check);
  requireArtifact(provenance.environment, "environment", check);
  requireArtifact(provenance.invocation, "invocation", check);
  requireText(provenance.command, "command", check);
  if (provenance.argv.length === 0) check.missing.push("argv_missing");
  requireText(provenance.workingDirectory, "working_directory", check);
  requireArtifact(provenance.inputManifest, "input_manifest", check);
  requireText(provenance.deterministicSeed, "deterministic_seed", check);
  if (provenance.runSpecificOutput == null)
    check.missing.push("run_specific_output_missing");
  else if (!provenance.runSpecificOutput)
    check.failures.push("run_specific_output_false");
  for (const [id, actual, expected] of [
    ["run_id", provenance.runId, binding.runId],
    ["request_id", provenance.requestId, binding.requestId],
    ["receipt_id", provenance.receiptId, binding.receiptId],
    ["runtime_id", provenance.runtimeId, binding.runtimeId],
    ["git_sha", provenance.gitSha, binding.gitSha],
  ] as const) {
    if (actual == null) check.missing.push(`provenance_${id}_missing`);
    else if (expected != null && actual !== expected)
      check.failures.push(`provenance_${id}_mismatch`);
  }
  const started = Date.parse(provenance.startedAt ?? "");
  const completed = Date.parse(provenance.completedAt ?? "");
  const generated = Date.parse(value.generatedAt ?? "");
  if (!Number.isFinite(started)) check.missing.push("started_at_invalid");
  if (!Number.isFinite(completed)) check.missing.push("completed_at_invalid");
  if (!Number.isFinite(generated)) check.missing.push("generated_at_invalid");
  if (
    Number.isFinite(started) &&
    Number.isFinite(completed) &&
    completed < started
  )
    check.failures.push("execution_interval_invalid");
  if (
    Number.isFinite(completed) &&
    Number.isFinite(generated) &&
    generated < completed
  )
    check.failures.push("generated_before_completion");
  if (provenance.durationMs == null) check.missing.push("duration_ms_missing");
  else if (!(provenance.durationMs > 0))
    check.failures.push("duration_ms_invalid");
  else if (
    Number.isFinite(started) &&
    Number.isFinite(completed) &&
    Math.abs(completed - started - provenance.durationMs) > 1
  )
    check.failures.push("duration_interval_mismatch");

  requireArtifact(value.uncertainty.evidence, "uncertainty_evidence", check);
  requireArray(
    value.uncertainty.covariance,
    "uncertainty_covariance",
    check,
    null,
    MECHANICAL_MARGIN_COMPONENT_ORDER,
  );
  if (
    value.uncertainty.covariance.shape.length > 0 &&
    (value.uncertainty.covariance.shape.length !== 2 ||
      value.uncertainty.covariance.shape[0] !==
        MECHANICAL_MARGIN_COMPONENT_ORDER.length ||
      value.uncertainty.covariance.shape[1] !==
        MECHANICAL_MARGIN_COMPONENT_ORDER.length)
  )
    check.failures.push("uncertainty_covariance_shape_invalid");
  requireArtifact(value.uncertainty.method, "uncertainty_method", check);
  if (value.uncertainty.confidenceLevel == null)
    check.missing.push("uncertainty_confidence_level_missing");
  else if (
    value.uncertainty.confidenceLevel < 0.95 ||
    value.uncertainty.confidenceLevel >= 1
  )
    check.failures.push("uncertainty_confidence_level_invalid");
  return { missing: unique(check.missing), failures: unique(check.failures) };
};

const addCommon = (
  check: CheckDraft,
  common: { missing: string[]; failures: string[] },
): void => {
  check.missing.push(...common.missing);
  check.failures.push(...common.failures);
};

const evaluateMarginSet = <T extends string>(
  entries: Array<Nhm2MechanicalMarginEntryV1<T>>,
  requiredIds: readonly T[],
  prefix: string,
  check: CheckDraft,
): number | null => {
  let minimumLower95 = Number.POSITIVE_INFINITY;
  for (const id of requiredIds) {
    const matches = entries.filter((entry) => entry.marginId === id);
    if (matches.length === 0)
      check.missing.push(`${prefix}_${id}_margin_missing`);
    else if (matches.length > 1)
      check.failures.push(`${prefix}_${id}_margin_duplicate`);
  }
  entries.forEach((entry, index) => {
    requireArtifact(entry.evidence, `${prefix}_${index}_evidence`, check);
    requireArray(entry.rawSamples, `${prefix}_${index}_samples`, check, null, [
      entry.marginId ?? "unknown",
    ]);
    if (
      entry.rawSamples.shape.length > 0 &&
      entry.rawSamples.shape[0] <
        NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.marginSamples
    )
      check.failures.push(`${prefix}_${index}_samples_below_frozen_minimum`);
    requireText(entry.unit, `${prefix}_${index}_unit`, check);
    if (
      entry.nominalMargin == null ||
      entry.absoluteUncertainty95 == null ||
      entry.minimumAllowedMargin == null
    ) {
      check.missing.push(`${prefix}_${index}_bound_missing`);
      return;
    }
    if (entry.absoluteUncertainty95 < 0 || entry.minimumAllowedMargin < 0) {
      check.failures.push(`${prefix}_${index}_bound_invalid`);
      return;
    }
    const lower95 =
      entry.nominalMargin -
      entry.absoluteUncertainty95 -
      entry.minimumAllowedMargin;
    minimumLower95 = Math.min(minimumLower95, lower95);
    if (!(lower95 > 0))
      check.failures.push(
        `${prefix}_${entry.marginId ?? index}_margin_not_positive`,
      );
  });
  return Number.isFinite(minimumLower95) ? minimumLower95 : null;
};

const deriveChecks = (value: PrimitiveEvidence) => {
  const common = commonIntegrity(value);

  const force = draft("force_gradient_imported_from_realistic_solver");
  addCommon(force, common);
  if (value.forceGradientImport.sourceContractVersion == null)
    force.missing.push("realistic_material_contract_version_missing");
  requireArtifact(
    value.forceGradientImport.sourceEvidence,
    "material_source_evidence",
    force,
  );
  requireText(
    value.forceGradientImport.sourceCandidateId,
    "source_candidate_id",
    force,
  );
  requireHash(
    value.forceGradientImport.sourceCandidateManifestSha256,
    "source_candidate_manifest_sha256",
    force,
  );
  requireText(value.forceGradientImport.sourceRunId, "source_run_id", force);
  if (
    value.forceGradientImport.sourceCandidateId != null &&
    value.binding.candidateId != null &&
    value.forceGradientImport.sourceCandidateId !== value.binding.candidateId
  )
    force.failures.push("force_import_candidate_id_mismatch");
  if (
    value.forceGradientImport.sourceCandidateManifestSha256 != null &&
    value.binding.candidateManifestSha256 != null &&
    value.forceGradientImport.sourceCandidateManifestSha256 !==
      value.binding.candidateManifestSha256
  )
    force.failures.push("force_import_candidate_manifest_mismatch");
  if (
    value.forceGradientImport.sourceRunId != null &&
    value.binding.runId != null &&
    value.forceGradientImport.sourceRunId !== value.binding.runId
  )
    force.failures.push("force_import_run_id_mismatch");
  const importedGapSampleCount =
    value.forceGradientImport.forceGapCoordinates.shape[0] ?? null;
  for (const [id, ref, expectedSamples, components] of [
    [
      "force_gap_coordinates",
      value.forceGradientImport.forceGapCoordinates,
      null,
      ["gap"],
    ],
    [
      "integrated_force",
      value.forceGradientImport.integratedForce,
      importedGapSampleCount,
      ["force"],
    ],
    [
      "force_gradient",
      value.forceGradientImport.forceGradient,
      importedGapSampleCount,
      ["gradient"],
    ],
    [
      "anchor_traction_field",
      value.forceGradientImport.anchorTractionField,
      null,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    ],
  ] as const)
    requireArray(ref, id, force, expectedSamples, components);
  if (
    importedGapSampleCount != null &&
    importedGapSampleCount < NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.forceGapSamples
  )
    force.failures.push("force_gap_samples_below_frozen_minimum");
  if (
    value.forceGradientImport.anchorTractionField.shape.length > 0 &&
    value.forceGradientImport.anchorTractionField.shape.at(-1) !== 3
  )
    force.failures.push("anchor_traction_field_shape_not_cartesian_vector");
  requirePositive(value.forceGradientImport.targetGapM, "target_gap", force);
  if (value.forceGradientImport.forceAtTargetN == null)
    force.missing.push("force_at_target_missing");
  requireNonnegative(
    value.forceGradientImport.forceUncertainty95N,
    "force_uncertainty_95",
    force,
  );
  if (value.forceGradientImport.forceGradientAtTargetNPerM == null)
    force.missing.push("force_gradient_at_target_missing");
  requireNonnegative(
    value.forceGradientImport.forceGradientUncertainty95NPerM,
    "force_gradient_uncertainty_95",
    force,
  );
  if (value.forceGradientImport.idealParallelPlateFallbackUsed == null)
    force.missing.push("ideal_parallel_plate_fallback_disposition_missing");
  else if (value.forceGradientImport.idealParallelPlateFallbackUsed)
    force.failures.push(
      "ideal_parallel_plate_fallback_used_for_load_authority",
    );

  const fea = draft("coupled_nonlinear_fea_completed");
  addCommon(fea, common);
  if (value.nonlinearFea.formulation == null)
    fea.missing.push("coupled_nonlinear_fea_formulation_missing");
  for (const [id, ref] of [
    ["fea_solver", value.nonlinearFea.solver],
    ["fea_geometry", value.nonlinearFea.geometry],
    ["fea_mesh", value.nonlinearFea.mesh],
    ["fea_material_models", value.nonlinearFea.materialModels],
    ["fea_contact_model", value.nonlinearFea.contactModel],
    ["fea_boundary_conditions", value.nonlinearFea.boundaryConditions],
    ["fea_load_map", value.nonlinearFea.loadMap],
  ] as const)
    requireArtifact(ref, id, fea);
  requirePositive(value.nonlinearFea.sampleCount, "fea_sample_count", fea);
  requirePositive(value.nonlinearFea.cellCount, "fea_cell_count", fea);
  requirePositive(
    value.nonlinearFea.nonlinearIterationCount,
    "fea_nonlinear_iteration_count",
    fea,
  );
  if (
    value.nonlinearFea.sampleCount != null &&
    value.nonlinearFea.sampleCount <
      NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.nonlinearFeaSamples
  )
    fea.failures.push("fea_sample_count_below_frozen_minimum");
  if (
    value.nonlinearFea.cellCount != null &&
    value.nonlinearFea.cellCount <
      NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.nonlinearFeaCells
  )
    fea.failures.push("fea_cell_count_below_frozen_minimum");
  if (
    value.nonlinearFea.nonlinearIterationCount != null &&
    value.nonlinearFea.nonlinearIterationCount <
      NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.nonlinearIterations
  )
    fea.failures.push("fea_nonlinear_iterations_below_frozen_minimum");
  if (value.nonlinearFea.converged == null)
    fea.missing.push("fea_convergence_missing");
  else if (!value.nonlinearFea.converged)
    fea.failures.push("fea_not_converged");
  for (const [id, included] of [
    ["supports", value.nonlinearFea.supportsIncluded],
    ["controls", value.nonlinearFea.controlsIncluded],
    ["material_nonlinearity", value.nonlinearFea.materialNonlinearityIncluded],
    [
      "geometric_nonlinearity",
      value.nonlinearFea.geometricNonlinearityIncluded,
    ],
  ] as const) {
    if (included == null) fea.missing.push(`${id}_inclusion_missing`);
    else if (!included) fea.failures.push(`${id}_excluded_from_fea`);
  }
  for (const [id, ref, expectedSamples, components] of [
    [
      "displacement_field",
      value.nonlinearFea.displacementField,
      value.nonlinearFea.sampleCount,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    ],
    [
      "strain_field",
      value.nonlinearFea.strainField,
      value.nonlinearFea.sampleCount,
      CARTESIAN_TENSOR_COMPONENT_ORDER,
    ],
    [
      "stress_field",
      value.nonlinearFea.stressField,
      value.nonlinearFea.sampleCount,
      CARTESIAN_TENSOR_COMPONENT_ORDER,
    ],
    [
      "temperature_field",
      value.nonlinearFea.temperatureField,
      value.nonlinearFea.sampleCount,
      ["temperature"],
    ],
    [
      "contact_pressure_field",
      value.nonlinearFea.contactPressureField,
      value.nonlinearFea.sampleCount,
      ["contact_pressure"],
    ],
    [
      "modal_spectrum",
      value.nonlinearFea.modalSpectrum,
      null,
      ["frequency", "damping_rate"],
    ],
  ] as const)
    requireArray(ref, id, fea, expectedSamples, components);
  if (
    value.nonlinearFea.displacementField.shape.length > 0 &&
    value.nonlinearFea.displacementField.shape.at(-1) !== 3
  )
    fea.failures.push("displacement_field_shape_not_cartesian_vector");
  for (const [id, ref] of [
    ["strain_field", value.nonlinearFea.strainField],
    ["stress_field", value.nonlinearFea.stressField],
  ] as const) {
    if (
      ref.shape.length > 0 &&
      (ref.shape.at(-2) !== 3 || ref.shape.at(-1) !== 3)
    )
      fea.failures.push(`${id}_shape_not_cartesian_tensor`);
  }
  if (
    value.nonlinearFea.modalSpectrum.shape.length > 0 &&
    value.nonlinearFea.modalSpectrum.shape.at(-1) !== 2
  )
    fea.failures.push("modal_spectrum_shape_not_two_column");
  if (
    value.nonlinearFea.modalSpectrum.shape.length > 0 &&
    value.nonlinearFea.modalSpectrum.shape[0] <
      NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.nonlinearFeaSamples
  )
    fea.failures.push("modal_spectrum_samples_below_frozen_minimum");
  const feaResidual = [
    value.nonlinearFea.residualNorm,
    value.nonlinearFea.residualUncertainty95,
    value.nonlinearFea.residualTolerance,
  ];
  if (feaResidual.some((entry) => entry == null))
    fea.missing.push("fea_residual_bound_missing");
  else {
    const [residual, uncertainty95, tolerance] = feaResidual as number[];
    fea.metricValue = residual + uncertainty95;
    fea.tolerance = tolerance;
    fea.unit = "normalized_coupled_residual_upper95";
    if (residual < 0 || uncertainty95 < 0 || tolerance <= 0)
      fea.failures.push("fea_residual_bound_invalid");
    else if (fea.metricValue > tolerance)
      fea.failures.push("fea_residual_exceeds_tolerance");
  }

  const overlap = draft("support_retention_overlap_lower95_gt_one");
  addCommon(overlap, common);
  requireArtifact(
    value.supportRetention.evidence,
    "support_retention_evidence",
    overlap,
  );
  requireArray(
    value.supportRetention.jointSamples,
    "support_retention_joint_samples",
    overlap,
    null,
    ["support_fraction", "source_retention"],
  );
  const supportRetentionShape = value.supportRetention.jointSamples.shape;
  if (supportRetentionShape.length > 0 && supportRetentionShape.at(-1) !== 2)
    overlap.failures.push(
      "support_retention_joint_samples_shape_not_two_column",
    );
  if (
    supportRetentionShape.length > 0 &&
    supportRetentionShape[0] <
      NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.supportRetentionSamples
  )
    overlap.failures.push("support_retention_samples_below_frozen_minimum");
  if (value.supportRetention.confidenceLevel == null)
    overlap.missing.push("support_retention_confidence_level_missing");
  else if (
    value.supportRetention.confidenceLevel < 0.95 ||
    value.supportRetention.confidenceLevel >= 1
  )
    overlap.failures.push("support_retention_confidence_level_invalid");
  const minSupport =
    value.supportRetention.structuralMinimumSupportFractionUpper95;
  const maxSupport =
    value.supportRetention.retentionCompatibleMaximumSupportFractionLower95;
  const reportedRatio = value.supportRetention.overlapRatioLower95;
  const consistencyTolerance =
    value.supportRetention.overlapRatioConsistencyTolerance;
  if (minSupport == null)
    overlap.missing.push("structural_support_fraction_upper95_missing");
  else if (!(minSupport > 0 && minSupport <= 1))
    overlap.failures.push("structural_support_fraction_upper95_invalid");
  if (maxSupport == null)
    overlap.missing.push(
      "retention_compatible_support_fraction_lower95_missing",
    );
  else if (!(maxSupport > 0 && maxSupport <= 1))
    overlap.failures.push(
      "retention_compatible_support_fraction_lower95_invalid",
    );
  if (reportedRatio == null)
    overlap.missing.push("overlap_ratio_lower95_missing");
  else if (!(reportedRatio > 0))
    overlap.failures.push("overlap_ratio_lower95_invalid");
  requirePositive(
    consistencyTolerance,
    "overlap_ratio_consistency_tolerance",
    overlap,
  );
  if (value.supportRetention.requiredStrictLowerBound !== 1)
    overlap.missing.push(
      "overlap_required_strict_lower_bound_not_frozen_at_one",
    );
  if (
    minSupport != null &&
    minSupport > 0 &&
    maxSupport != null &&
    reportedRatio != null &&
    consistencyTolerance != null
  ) {
    const recomputed = maxSupport / minSupport;
    overlap.metricValue = recomputed;
    overlap.tolerance = 1;
    overlap.unit = "1";
    if (Math.abs(recomputed - reportedRatio) > consistencyTolerance)
      overlap.failures.push("overlap_ratio_not_reproducible_from_bounds");
    if (!(recomputed > 1) || !(reportedRatio > 1))
      overlap.failures.push("support_retention_overlap_lower95_not_gt_one");
  }

  const instability = draft(
    "pull_in_buckling_contact_stiction_margins_positive",
  );
  addCommon(instability, common);
  const minimumInstabilityMargin = evaluateMarginSet(
    value.instabilityMargins,
    NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS,
    "instability",
    instability,
  );
  instability.metricValue = minimumInstabilityMargin;
  instability.tolerance = 0;
  instability.unit = "dimensionless_margin";

  const structural = draft("stress_thermal_fatigue_modal_margins_positive");
  addCommon(structural, common);
  const minimumStructuralMargin = evaluateMarginSet(
    value.structuralMargins,
    NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS,
    "structural",
    structural,
  );
  structural.metricValue = minimumStructuralMargin;
  structural.tolerance = 0;
  structural.unit = "dimensionless_margin";

  const fabrication = draft("fabrication_tolerance_envelope_pass");
  addCommon(fabrication, common);
  requireArtifact(
    value.fabricationEnvelope.evidence,
    "fabrication_envelope_evidence",
    fabrication,
  );
  requireArray(
    value.fabricationEnvelope.jointSamples,
    "fabrication_joint_samples",
    fabrication,
    value.fabricationEnvelope.totalSampleCount,
    NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS,
  );
  if (
    value.fabricationEnvelope.jointSamples.shape.length > 0 &&
    value.fabricationEnvelope.jointSamples.shape.at(-1) !==
      NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS.length
  )
    fabrication.failures.push("fabrication_joint_samples_shape_invalid");
  if (value.fabricationEnvelope.confidenceLevel == null)
    fabrication.missing.push("fabrication_confidence_level_missing");
  else if (
    value.fabricationEnvelope.confidenceLevel < 0.95 ||
    value.fabricationEnvelope.confidenceLevel >= 1
  )
    fabrication.failures.push("fabrication_confidence_level_invalid");
  if (value.fabricationEnvelope.requiredCoverageFraction == null)
    fabrication.missing.push("fabrication_required_coverage_missing");
  else if (
    value.fabricationEnvelope.requiredCoverageFraction < 0.95 ||
    value.fabricationEnvelope.requiredCoverageFraction > 1
  )
    fabrication.failures.push("fabrication_required_coverage_invalid");
  for (const id of NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS) {
    const matches = value.fabricationEnvelope.parameters.filter(
      (entry) => entry.parameterId === id,
    );
    if (matches.length === 0)
      fabrication.missing.push(`${id}_fabrication_parameter_missing`);
    else if (matches.length > 1)
      fabrication.failures.push(`${id}_fabrication_parameter_duplicate`);
  }
  value.fabricationEnvelope.parameters.forEach((entry, index) => {
    requireArtifact(
      entry.distribution,
      `fabrication_${index}_distribution`,
      fabrication,
    );
    requireArray(
      entry.samples,
      `fabrication_${index}_samples`,
      fabrication,
      value.fabricationEnvelope.totalSampleCount,
      [entry.parameterId ?? "unknown"],
    );
    requireText(entry.unit, `fabrication_${index}_unit`, fabrication);
    const bounds = [
      entry.allowedMinimum,
      entry.allowedMaximum,
      entry.manufacturedLower95,
      entry.manufacturedUpper95,
    ];
    if (bounds.some((bound) => bound == null))
      fabrication.missing.push(`fabrication_${index}_bounds_missing`);
    else {
      const [allowedMin, allowedMax, manufacturedMin, manufacturedMax] =
        bounds as number[];
      if (allowedMax <= allowedMin || manufacturedMax < manufacturedMin)
        fabrication.failures.push(`fabrication_${index}_bounds_invalid`);
      else if (manufacturedMin < allowedMin || manufacturedMax > allowedMax)
        fabrication.failures.push(
          `fabrication_${entry.parameterId ?? index}_outside_envelope`,
        );
    }
  });
  requirePositive(
    value.fabricationEnvelope.totalSampleCount,
    "fabrication_total_sample_count",
    fabrication,
  );
  if (
    value.fabricationEnvelope.totalSampleCount != null &&
    (!Number.isSafeInteger(value.fabricationEnvelope.totalSampleCount) ||
      value.fabricationEnvelope.totalSampleCount <
        NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.fabricationSamples)
  )
    fabrication.failures.push(
      "fabrication_total_sample_count_below_frozen_minimum",
    );
  requireNonnegative(
    value.fabricationEnvelope.passingSampleCount,
    "fabrication_passing_sample_count",
    fabrication,
  );
  if (
    value.fabricationEnvelope.totalSampleCount != null &&
    value.fabricationEnvelope.passingSampleCount != null &&
    value.fabricationEnvelope.requiredCoverageFraction != null
  ) {
    const coverage =
      value.fabricationEnvelope.passingSampleCount /
      value.fabricationEnvelope.totalSampleCount;
    fabrication.metricValue = coverage;
    fabrication.tolerance = value.fabricationEnvelope.requiredCoverageFraction;
    fabrication.unit = "coverage_fraction";
    if (
      value.fabricationEnvelope.passingSampleCount >
      value.fabricationEnvelope.totalSampleCount
    )
      fabrication.failures.push("fabrication_passing_sample_count_invalid");
    else if (coverage < value.fabricationEnvelope.requiredCoverageFraction)
      fabrication.failures.push("fabrication_envelope_coverage_failed");
  }

  const control = draft("active_control_energy_noise_heat_timing_bounded");
  addCommon(control, common);
  for (const [id, ref] of [
    ["controller", value.activeControl.controller],
    ["actuator_model", value.activeControl.actuatorModel],
    ["sensor_model", value.activeControl.sensorModel],
  ] as const)
    requireArtifact(ref, id, control);
  for (const [id, ref, components] of [
    [
      "control_transfer_function",
      value.activeControl.transferFunction,
      ["frequency", "gain"],
    ],
    ["control_command_trace", value.activeControl.commandTrace, ["command"]],
    ["control_response_trace", value.activeControl.responseTrace, ["response"]],
    [
      "control_noise_spectrum",
      value.activeControl.noiseSpectrum,
      ["frequency", "amplitude_spectral_density"],
    ],
    ["control_heat_trace", value.activeControl.heatTrace, ["heat_load"]],
    ["control_timing_trace", value.activeControl.timingTrace, ["timing_error"]],
  ] as const)
    requireArray(ref, id, control, null, components);
  for (const [id, ref] of [
    ["transfer_function", value.activeControl.transferFunction],
    ["command_trace", value.activeControl.commandTrace],
    ["response_trace", value.activeControl.responseTrace],
    ["noise_spectrum", value.activeControl.noiseSpectrum],
    ["heat_trace", value.activeControl.heatTrace],
    ["timing_trace", value.activeControl.timingTrace],
  ] as const) {
    if (
      ref.shape.length > 0 &&
      ref.shape[0] < NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.controlTraceSamples
    )
      control.failures.push(`${id}_samples_below_frozen_minimum`);
  }
  for (const [id, ref] of [
    ["transfer_function", value.activeControl.transferFunction],
    ["noise_spectrum", value.activeControl.noiseSpectrum],
  ] as const) {
    if (ref.shape.length > 0 && ref.shape.at(-1) !== 2)
      control.failures.push(`${id}_shape_not_two_column`);
  }
  requirePositive(
    value.activeControl.cyclePeriodS,
    "control_cycle_period",
    control,
  );
  if (value.activeControl.dutyFraction == null)
    control.missing.push("control_duty_fraction_missing");
  else if (!(
    value.activeControl.dutyFraction > 0 &&
    value.activeControl.dutyFraction <= 1
  ))
    control.failures.push("control_duty_fraction_invalid");
  let worstControlRatio = 0;
  for (const id of NHM2_MECHANICAL_CONTROL_BUDGET_IDS) {
    const matches = value.activeControl.budgets.filter(
      (entry) => entry.budgetId === id,
    );
    if (matches.length === 0)
      control.missing.push(`${id}_control_budget_missing`);
    else if (matches.length > 1)
      control.failures.push(`${id}_control_budget_duplicate`);
  }
  value.activeControl.budgets.forEach((entry, index) => {
    requireArtifact(
      entry.evidence,
      `control_budget_${index}_evidence`,
      control,
    );
    requireText(entry.unit, `control_budget_${index}_unit`, control);
    if (entry.measuredUpper95 == null || entry.maximumAllowed == null)
      control.missing.push(`control_budget_${index}_bound_missing`);
    else if (entry.measuredUpper95 < 0 || entry.maximumAllowed <= 0)
      control.failures.push(`control_budget_${index}_bound_invalid`);
    else {
      const ratio = entry.measuredUpper95 / entry.maximumAllowed;
      worstControlRatio = Math.max(worstControlRatio, ratio);
      if (ratio > 1)
        control.failures.push(
          `control_${entry.budgetId ?? index}_exceeds_budget`,
        );
    }
  });
  if (value.activeControl.budgets.length > 0) {
    control.metricValue = worstControlRatio;
    control.tolerance = 1;
    control.unit = "budget_fraction";
  }

  const cycle = draft("periodic_cycle_energy_balance_closed");
  addCommon(cycle, common);
  requireArtifact(
    value.periodicCycleEnergy.evidence,
    "cycle_energy_evidence",
    cycle,
  );
  requireArray(
    value.periodicCycleEnergy.timeSeries,
    "cycle_energy_time_series",
    cycle,
    null,
    ["time", "input", "recovered", "heat", "stored", "mechanical_work"],
  );
  requirePositive(value.periodicCycleEnergy.cycleCount, "cycle_count", cycle);
  if (
    value.periodicCycleEnergy.cycleCount != null &&
    (!Number.isSafeInteger(value.periodicCycleEnergy.cycleCount) ||
      value.periodicCycleEnergy.cycleCount <
        NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.periodicCycles)
  )
    cycle.failures.push("cycle_count_below_frozen_minimum");
  const cycleSeriesShape = value.periodicCycleEnergy.timeSeries.shape;
  if (cycleSeriesShape.length > 0 && cycleSeriesShape.at(-1) !== 6)
    cycle.failures.push("cycle_energy_time_series_shape_not_six_column");
  if (
    cycleSeriesShape.length > 0 &&
    value.periodicCycleEnergy.cycleCount != null &&
    cycleSeriesShape[0] <
      value.periodicCycleEnergy.cycleCount *
        NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.samplesPerCycle
  )
    cycle.failures.push("cycle_energy_samples_per_cycle_below_frozen_minimum");
  const energyEntries = [
    value.periodicCycleEnergy.inputEnergyJ,
    value.periodicCycleEnergy.recoveredEnergyJ,
    value.periodicCycleEnergy.dissipatedHeatJ,
    value.periodicCycleEnergy.storedEnergyChangeJ,
    value.periodicCycleEnergy.exportedMechanicalWorkJ,
    value.periodicCycleEnergy.absoluteUncertainty95J,
    value.periodicCycleEnergy.normalizationEnergyJ,
    value.periodicCycleEnergy.toleranceRelative,
  ];
  if (energyEntries.some((entry) => entry == null))
    cycle.missing.push("cycle_energy_ledger_bound_missing");
  else {
    const [
      input,
      recovered,
      heat,
      stored,
      work,
      uncertainty95,
      normalization,
      tolerance,
    ] = energyEntries as number[];
    if (
      input < 0 ||
      recovered < 0 ||
      heat < 0 ||
      work < 0 ||
      uncertainty95 < 0 ||
      normalization <= 0 ||
      tolerance <= 0
    )
      cycle.failures.push("cycle_energy_ledger_bound_invalid");
    else {
      const residual = Math.abs(input - recovered - heat - stored - work);
      cycle.metricValue = (residual + uncertainty95) / normalization;
      cycle.tolerance = tolerance;
      cycle.unit = "relative_energy_closure";
      if (cycle.metricValue > tolerance)
        cycle.failures.push("periodic_cycle_energy_balance_not_closed");
    }
  }

  const source = draft(
    "mechanical_control_stress_energy_returned_to_source_tensor",
  );
  addCommon(source, common);
  requireArtifact(
    value.apparatusStressEnergy.evidence,
    "apparatus_stress_energy_evidence",
    source,
  );
  requireArtifact(
    value.apparatusStressEnergy.aggregationOperator,
    "apparatus_stress_energy_aggregation_operator",
    source,
  );
  requirePositive(
    value.apparatusStressEnergy.sampleCount,
    "apparatus_stress_energy_sample_count",
    source,
  );
  requireArray(
    value.apparatusStressEnergy.fullSourceTensor,
    "apparatus_full_source_tensor",
    source,
    value.apparatusStressEnergy.sampleCount,
    SPACETIME_TENSOR_COMPONENT_ORDER,
  );
  if (
    value.apparatusStressEnergy.sampleCount != null &&
    (!Number.isSafeInteger(value.apparatusStressEnergy.sampleCount) ||
      value.apparatusStressEnergy.sampleCount <
        NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.apparatusStressEnergySamples)
  )
    source.failures.push(
      "apparatus_stress_energy_samples_below_frozen_minimum",
    );
  const fullTensorShape = value.apparatusStressEnergy.fullSourceTensor.shape;
  if (
    fullTensorShape.length > 0 &&
    (fullTensorShape.length < 3 ||
      fullTensorShape.at(-1) !== 4 ||
      fullTensorShape.at(-2) !== 4)
  )
    source.failures.push("apparatus_full_source_tensor_shape_not_4x4");
  requireText(
    value.apparatusStressEnergy.chartId,
    "apparatus_stress_energy_chart_id",
    source,
  );
  if (
    value.apparatusStressEnergy.chartId != null &&
    value.binding.chartId != null &&
    value.apparatusStressEnergy.chartId !== value.binding.chartId
  )
    source.failures.push("apparatus_stress_energy_chart_mismatch");
  if (value.apparatusStressEnergy.includedInCandidateSourceTensor == null)
    source.missing.push("candidate_source_tensor_inclusion_missing");
  else if (!value.apparatusStressEnergy.includedInCandidateSourceTensor)
    source.failures.push(
      "apparatus_stress_energy_not_returned_to_candidate_source_tensor",
    );
  requireArtifact(
    value.apparatusStressEnergy.candidateSourceTensor,
    "candidate_source_tensor",
    source,
  );
  for (const id of NHM2_MECHANICAL_SOURCE_TERM_IDS) {
    const matches = value.apparatusStressEnergy.terms.filter(
      (entry) => entry.termId === id,
    );
    if (matches.length === 0)
      source.missing.push(`${id}_stress_energy_term_missing`);
    else if (matches.length > 1)
      source.failures.push(`${id}_stress_energy_term_duplicate`);
  }
  value.apparatusStressEnergy.terms.forEach((entry, index) => {
    requireArtifact(
      entry.constitutiveModel,
      `source_term_${index}_constitutive_model`,
      source,
    );
    requirePositive(
      entry.sampleCount,
      `source_term_${index}_sample_count`,
      source,
    );
    requireArray(
      entry.tensor,
      `source_term_${index}_tensor`,
      source,
      entry.sampleCount,
      SPACETIME_TENSOR_COMPONENT_ORDER,
    );
    if (
      entry.sampleCount != null &&
      (!Number.isSafeInteger(entry.sampleCount) ||
        entry.sampleCount <
          NHM2_MECHANICAL_DIAGNOSTIC_MINIMA.apparatusStressEnergySamples)
    )
      source.failures.push(`source_term_${index}_samples_below_frozen_minimum`);
    const shape = entry.tensor.shape;
    if (
      shape.length > 0 &&
      (shape.length < 3 || shape.at(-1) !== 4 || shape.at(-2) !== 4)
    )
      source.failures.push(`source_term_${index}_tensor_shape_not_4x4`);
    if (
      entry.sampleCount != null &&
      value.apparatusStressEnergy.sampleCount != null &&
      entry.sampleCount !== value.apparatusStressEnergy.sampleCount
    )
      source.failures.push(`source_term_${index}_sample_count_mismatch`);
  });

  return [
    force,
    fea,
    overlap,
    instability,
    structural,
    fabrication,
    control,
    cycle,
    source,
  ].map((check) => {
    const blockers = unique([...check.failures, ...check.missing]);
    const status: Nhm2MechanicalSupportControlStatus =
      check.failures.length > 0
        ? "fail"
        : check.missing.length > 0
          ? "blocked"
          : "pass";
    return {
      checkId: check.checkId,
      status,
      pass: status === "pass",
      metricValue: check.metricValue,
      tolerance: check.tolerance,
      unit: check.unit,
      blockers,
    };
  });
};

export const buildNhm2MechanicalSupportControlMargin = (
  input: BuildNhm2MechanicalSupportControlMarginInput = {},
): Nhm2MechanicalSupportControlMarginV1 => {
  const primitive = normalizePrimitive(input);
  const checks = deriveChecks(primitive);
  const status: Nhm2MechanicalSupportControlStatus = checks.some(
    (check) => check.status === "fail",
  )
    ? "fail"
    : checks.some((check) => check.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    contractVersion: NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CONTRACT_VERSION,
    ...primitive,
    checks,
    status,
    mechanicalSupportControlMarginReady: status === "pass",
    blockers: checks.flatMap((check) =>
      check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
    ),
    claimBoundary: {
      diagnosticOnly: true,
      apparatusTheoryEvidenceOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    },
  };
};

const isJsonValue = (value: unknown): boolean => {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!isRecord(value)) return false;
  return Object.values(value).every(isJsonValue);
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
};

export const isNhm2MechanicalSupportControlMargin = (
  value: unknown,
): value is Nhm2MechanicalSupportControlMarginV1 => {
  if (
    !isRecord(value) ||
    !isJsonValue(value) ||
    value.contractVersion !==
      NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2MechanicalSupportControlMargin(
    value as unknown as BuildNhm2MechanicalSupportControlMarginInput,
  );
  return (
    JSON.stringify(canonicalize(value)) ===
    JSON.stringify(canonicalize(rebuilt))
  );
};
