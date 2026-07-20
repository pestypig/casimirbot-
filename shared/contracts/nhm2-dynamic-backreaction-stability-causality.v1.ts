import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY } from "./nhm2-experiment-ready-theory-candidate-manifest.v1";

export const NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CONTRACT_VERSION =
  "nhm2_dynamic_backreaction_stability_causality/v1" as const;

export const NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.dynamic_backreaction_stability_causality,
] as const;

export const NHM2_DYNAMIC_BSSN_CONSTRAINT_IDS = [
  "hamiltonian",
  "momentum_x",
  "momentum_y",
  "momentum_z",
] as const;

export const NHM2_DYNAMIC_CONVERGENCE_AXES = [
  "spatial",
  "temporal",
  "frequency",
  "boundary",
] as const;

export const NHM2_DYNAMIC_ROBUSTNESS_PARAMETER_IDS = [
  "alpha",
  "wall_thickness",
  "source_amplitude",
  "switching_timescale",
] as const;

export type Nhm2DynamicBackreactionCheckId =
  (typeof NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CHECK_IDS)[number];
export type Nhm2DynamicBssnConstraintId =
  (typeof NHM2_DYNAMIC_BSSN_CONSTRAINT_IDS)[number];
export type Nhm2DynamicConvergenceAxis =
  (typeof NHM2_DYNAMIC_CONVERGENCE_AXES)[number];
export type Nhm2DynamicRobustnessParameterId =
  (typeof NHM2_DYNAMIC_ROBUSTNESS_PARAMETER_IDS)[number];
export type Nhm2DynamicBackreactionStatus = "pass" | "blocked" | "fail";

export type Nhm2DynamicArtifactRefV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2DynamicArrayRefV1 = Nhm2DynamicArtifactRefV1 & {
  dtype: "float64" | null;
  shape: number[];
  unit: string | null;
};

export type Nhm2DynamicBindingV1 = {
  candidateId: string | null;
  candidateManifestPath: string | null;
  candidateManifestSha256: string | null;
  preRunManifestPath: string | null;
  preRunManifestSha256: string | null;
  runId: string | null;
  requestId: string | null;
  receiptId: string | null;
  runtimeId: string | null;
  plannedOutputDirectory: string | null;
  laneId: "nhm2_shift_lapse" | null;
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

export type Nhm2DynamicBackreactionStabilityCausalityV1 = {
  contractVersion: typeof NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CONTRACT_VERSION;
  generatedAt: string | null;
  binding: Nhm2DynamicBindingV1;
  initialCoupling: {
    initialData: Nhm2DynamicArtifactRefV1;
    geometryState: Nhm2DynamicArrayRefV1;
    sourceTensor: Nhm2DynamicArrayRefV1;
    couplingOperator: Nhm2DynamicArtifactRefV1;
    constitutiveState: Nhm2DynamicArtifactRefV1;
    sourceReturnedToEvolution: boolean | null;
    sampleCount: number | null;
    initialConstraintResidual: number | null;
    initialConstraintUncertainty95: number | null;
    initialConstraintTolerance: number | null;
  };
  evolution: {
    evolutionSystem: "BSSN" | null;
    integrator: Nhm2DynamicArtifactRefV1;
    dtS: number | null;
    durationS: number | null;
    horizonNormalization: {
      timingDefinition: Nhm2DynamicArtifactRefV1;
      switchingPeriodS: number | null;
      lightCrossingTimeS: number | null;
      controlCyclePeriodS: number | null;
    };
    metricChangeFloor: number | null;
    sourceChangeFloor: number | null;
    samples: Array<{
      step: number | null;
      timeS: number | null;
      geometryState: Nhm2DynamicArrayRefV1;
      sourceTensor: Nhm2DynamicArrayRefV1;
      metricDeltaL2: number | null;
      sourceDeltaL2: number | null;
      couplingResidual: number | null;
      couplingUncertainty95: number | null;
      couplingTolerance: number | null;
    }>;
  };
  bssnConstraints: {
    evidence: Nhm2DynamicArtifactRefV1;
    constraints: Array<{
      constraintId: Nhm2DynamicBssnConstraintId | null;
      residuals: Nhm2DynamicArrayRefV1;
      maxAbs: number | null;
      absoluteUncertainty95: number | null;
      tolerance: number | null;
    }>;
  };
  convergence: {
    evidence: Nhm2DynamicArtifactRefV1;
    minimumAcceptedOrder: number | null;
    orderUncertainty95: number | null;
    studies: Array<{
      axis: Nhm2DynamicConvergenceAxis | null;
      residuals: Nhm2DynamicArrayRefV1;
      points: Array<{
        discretizationScale: number | null;
        residualRelative: number | null;
        uncertainty95Relative: number | null;
      }>;
    }>;
  };
  semiclassicalBackreaction: {
    evidence: Nhm2DynamicArtifactRefV1;
    geometry: Nhm2DynamicArrayRefV1;
    renormalizedStressTensor: Nhm2DynamicArrayRefV1;
    sourceTensor: Nhm2DynamicArrayRefV1;
    selfConsistentIterations: number | null;
    converged: boolean | null;
    residualRelativeLInf: number | null;
    absoluteUncertainty95: number | null;
    toleranceRelativeLInf: number | null;
  };
  horizonCharacteristicScreen: {
    evidence: Nhm2DynamicArtifactRefV1;
    outgoingNullExpansion: Nhm2DynamicArrayRefV1;
    characteristicSpeeds: Nhm2DynamicArrayRefV1;
    minimumOutgoingExpansion: number | null;
    expansionUncertainty95: number | null;
    minimumAllowedExpansion: number | null;
    minimumHyperbolicityMargin: number | null;
    hyperbolicityUncertainty95: number | null;
    minimumAllowedHyperbolicityMargin: number | null;
  };
  rayParticleScreen: {
    evidence: Nhm2DynamicArtifactRefV1;
    nullRayBundle: Nhm2DynamicArrayRefV1;
    particleDistribution: Nhm2DynamicArrayRefV1;
    rayCount: number | null;
    particleSampleCount: number | null;
    maximumBlueshiftGain: number | null;
    blueshiftUncertainty95: number | null;
    maximumAllowedBlueshiftGain: number | null;
    maximumParticleAccumulationGain: number | null;
    particleAccumulationUncertainty95: number | null;
    maximumAllowedParticleAccumulationGain: number | null;
  };
  perturbationSpectrum: {
    evidence: Nhm2DynamicArtifactRefV1;
    spectrum: Nhm2DynamicArrayRefV1;
    maximumAllowedGrowthRatePerS: number | null;
    modes: Array<{
      modeId: string | null;
      waveNumberPerM: number | null;
      growthRatePerS: number | null;
      growthRateUncertainty95PerS: number | null;
    }>;
  };
  globalCausalityScreen: {
    evidence: Nhm2DynamicArtifactRefV1;
    timeFunctionGradient: Nhm2DynamicArrayRefV1;
    causalIntervalSamples: Nhm2DynamicArrayRefV1;
    geodesicSamples: Nhm2DynamicArrayRefV1;
    minimumTimelikeGradientMargin: number | null;
    timelikeGradientUncertainty95: number | null;
    minimumAllowedTimelikeGradientMargin: number | null;
    minimumCausalIntervalSquaredM2: number | null;
    causalIntervalUncertainty95M2: number | null;
    minimumAllowedCausalIntervalSquaredM2: number | null;
    ctcCandidateCount: number | null;
    minimumCompleteAffineParameterM: number | null;
    affineParameterUncertainty95M: number | null;
    minimumRequiredAffineParameterM: number | null;
  };
  parameterNeighborhood: {
    evidence: Nhm2DynamicArtifactRefV1;
    minimumRequiredPassFraction: number | null;
    samples: Array<{
      sampleId: string | null;
      parameterId: Nhm2DynamicRobustnessParameterId | "baseline" | null;
      signedOffsetFraction: number | null;
      sampleEvidence: Nhm2DynamicArtifactRefV1;
      minimumGateMargin: number | null;
      marginUncertainty95: number | null;
    }>;
  };
  uncertainty: {
    evidence: Nhm2DynamicArtifactRefV1;
    covariance: Nhm2DynamicArrayRefV1;
    method: Nhm2DynamicArtifactRefV1;
    confidenceLevel: number | null;
  };
  provenance: {
    producerId: string | null;
    producerVersion: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: Nhm2DynamicArtifactRefV1;
    environment: Nhm2DynamicArtifactRefV1;
    invocation: Nhm2DynamicArtifactRefV1;
    inputManifest: Nhm2DynamicArtifactRefV1;
    startedAt: string | null;
    completedAt: string | null;
    runSpecificOutput: boolean | null;
  };
  checks: Array<{
    checkId: Nhm2DynamicBackreactionCheckId;
    status: Nhm2DynamicBackreactionStatus;
    pass: boolean;
    metricValue: number | null;
    tolerance: number | null;
    unit: string | null;
    blockers: string[];
  }>;
  status: Nhm2DynamicBackreactionStatus;
  dynamicBackreactionStabilityCausalityReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    theoryClosureEvidenceOnly: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2DynamicBackreactionStabilityCausalityV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "dynamicBackreactionStabilityCausalityReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2DynamicBackreactionStabilityCausalityInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2DynamicBackreactionCheckId;
  missing: string[];
  failures: string[];
  metricValue: number | null;
  tolerance: number | null;
  unit: string | null;
};

const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

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

const artifact = (value: unknown): Nhm2DynamicArtifactRefV1 => {
  const entry = recordOf(value);
  return { path: text(entry.path), sha256: text(entry.sha256) };
};

const arrayRef = (value: unknown): Nhm2DynamicArrayRefV1 => {
  const entry = recordOf(value);
  return {
    ...artifact(entry),
    dtype: entry.dtype === "float64" ? "float64" : null,
    shape: Array.isArray(entry.shape)
      ? entry.shape.map(finite).filter((item): item is number => item != null)
      : [],
    unit: text(entry.unit),
  };
};

const enumValue = <T extends string>(
  value: unknown,
  values: readonly T[],
): T | null => {
  const candidate = text(value);
  return values.includes(candidate as T) ? (candidate as T) : null;
};

const normalizePrimitive = (
  input: BuildNhm2DynamicBackreactionStabilityCausalityInput,
): PrimitiveEvidence => {
  const root = recordOf(input);
  const binding = recordOf(root.binding);
  const initial = recordOf(root.initialCoupling);
  const evolution = recordOf(root.evolution);
  const horizonNormalization = recordOf(evolution.horizonNormalization);
  const constraints = recordOf(root.bssnConstraints);
  const convergence = recordOf(root.convergence);
  const backreaction = recordOf(root.semiclassicalBackreaction);
  const horizon = recordOf(root.horizonCharacteristicScreen);
  const ray = recordOf(root.rayParticleScreen);
  const perturbation = recordOf(root.perturbationSpectrum);
  const causality = recordOf(root.globalCausalityScreen);
  const neighborhood = recordOf(root.parameterNeighborhood);
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
      runId: text(binding.runId),
      requestId: text(binding.requestId),
      receiptId: text(binding.receiptId),
      runtimeId: text(binding.runtimeId),
      plannedOutputDirectory: text(binding.plannedOutputDirectory),
      laneId: binding.laneId === "nhm2_shift_lapse" ? binding.laneId : null,
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
    initialCoupling: {
      initialData: artifact(initial.initialData),
      geometryState: arrayRef(initial.geometryState),
      sourceTensor: arrayRef(initial.sourceTensor),
      couplingOperator: artifact(initial.couplingOperator),
      constitutiveState: artifact(initial.constitutiveState),
      sourceReturnedToEvolution: bool(initial.sourceReturnedToEvolution),
      sampleCount: finite(initial.sampleCount),
      initialConstraintResidual: finite(initial.initialConstraintResidual),
      initialConstraintUncertainty95: finite(
        initial.initialConstraintUncertainty95,
      ),
      initialConstraintTolerance: finite(initial.initialConstraintTolerance),
    },
    evolution: {
      evolutionSystem: evolution.evolutionSystem === "BSSN" ? "BSSN" : null,
      integrator: artifact(evolution.integrator),
      dtS: finite(evolution.dtS),
      durationS: finite(evolution.durationS),
      horizonNormalization: {
        timingDefinition: artifact(horizonNormalization.timingDefinition),
        switchingPeriodS: finite(horizonNormalization.switchingPeriodS),
        lightCrossingTimeS: finite(horizonNormalization.lightCrossingTimeS),
        controlCyclePeriodS: finite(horizonNormalization.controlCyclePeriodS),
      },
      metricChangeFloor: finite(evolution.metricChangeFloor),
      sourceChangeFloor: finite(evolution.sourceChangeFloor),
      samples: (Array.isArray(evolution.samples) ? evolution.samples : []).map(
        (value) => {
          const item = recordOf(value);
          return {
            step: finite(item.step),
            timeS: finite(item.timeS),
            geometryState: arrayRef(item.geometryState),
            sourceTensor: arrayRef(item.sourceTensor),
            metricDeltaL2: finite(item.metricDeltaL2),
            sourceDeltaL2: finite(item.sourceDeltaL2),
            couplingResidual: finite(item.couplingResidual),
            couplingUncertainty95: finite(item.couplingUncertainty95),
            couplingTolerance: finite(item.couplingTolerance),
          };
        },
      ),
    },
    bssnConstraints: {
      evidence: artifact(constraints.evidence),
      constraints: (Array.isArray(constraints.constraints)
        ? constraints.constraints
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          constraintId: enumValue(
            item.constraintId,
            NHM2_DYNAMIC_BSSN_CONSTRAINT_IDS,
          ),
          residuals: arrayRef(item.residuals),
          maxAbs: finite(item.maxAbs),
          absoluteUncertainty95: finite(item.absoluteUncertainty95),
          tolerance: finite(item.tolerance),
        };
      }),
    },
    convergence: {
      evidence: artifact(convergence.evidence),
      minimumAcceptedOrder: finite(convergence.minimumAcceptedOrder),
      orderUncertainty95: finite(convergence.orderUncertainty95),
      studies: (Array.isArray(convergence.studies)
        ? convergence.studies
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          axis: enumValue(item.axis, NHM2_DYNAMIC_CONVERGENCE_AXES),
          residuals: arrayRef(item.residuals),
          points: (Array.isArray(item.points) ? item.points : []).map(
            (pointValue) => {
              const point = recordOf(pointValue);
              return {
                discretizationScale: finite(point.discretizationScale),
                residualRelative: finite(point.residualRelative),
                uncertainty95Relative: finite(point.uncertainty95Relative),
              };
            },
          ),
        };
      }),
    },
    semiclassicalBackreaction: {
      evidence: artifact(backreaction.evidence),
      geometry: arrayRef(backreaction.geometry),
      renormalizedStressTensor: arrayRef(backreaction.renormalizedStressTensor),
      sourceTensor: arrayRef(backreaction.sourceTensor),
      selfConsistentIterations: finite(backreaction.selfConsistentIterations),
      converged: bool(backreaction.converged),
      residualRelativeLInf: finite(backreaction.residualRelativeLInf),
      absoluteUncertainty95: finite(backreaction.absoluteUncertainty95),
      toleranceRelativeLInf: finite(backreaction.toleranceRelativeLInf),
    },
    horizonCharacteristicScreen: {
      evidence: artifact(horizon.evidence),
      outgoingNullExpansion: arrayRef(horizon.outgoingNullExpansion),
      characteristicSpeeds: arrayRef(horizon.characteristicSpeeds),
      minimumOutgoingExpansion: finite(horizon.minimumOutgoingExpansion),
      expansionUncertainty95: finite(horizon.expansionUncertainty95),
      minimumAllowedExpansion: finite(horizon.minimumAllowedExpansion),
      minimumHyperbolicityMargin: finite(horizon.minimumHyperbolicityMargin),
      hyperbolicityUncertainty95: finite(horizon.hyperbolicityUncertainty95),
      minimumAllowedHyperbolicityMargin: finite(
        horizon.minimumAllowedHyperbolicityMargin,
      ),
    },
    rayParticleScreen: {
      evidence: artifact(ray.evidence),
      nullRayBundle: arrayRef(ray.nullRayBundle),
      particleDistribution: arrayRef(ray.particleDistribution),
      rayCount: finite(ray.rayCount),
      particleSampleCount: finite(ray.particleSampleCount),
      maximumBlueshiftGain: finite(ray.maximumBlueshiftGain),
      blueshiftUncertainty95: finite(ray.blueshiftUncertainty95),
      maximumAllowedBlueshiftGain: finite(ray.maximumAllowedBlueshiftGain),
      maximumParticleAccumulationGain: finite(
        ray.maximumParticleAccumulationGain,
      ),
      particleAccumulationUncertainty95: finite(
        ray.particleAccumulationUncertainty95,
      ),
      maximumAllowedParticleAccumulationGain: finite(
        ray.maximumAllowedParticleAccumulationGain,
      ),
    },
    perturbationSpectrum: {
      evidence: artifact(perturbation.evidence),
      spectrum: arrayRef(perturbation.spectrum),
      maximumAllowedGrowthRatePerS: finite(
        perturbation.maximumAllowedGrowthRatePerS,
      ),
      modes: (Array.isArray(perturbation.modes) ? perturbation.modes : []).map(
        (value) => {
          const item = recordOf(value);
          return {
            modeId: text(item.modeId),
            waveNumberPerM: finite(item.waveNumberPerM),
            growthRatePerS: finite(item.growthRatePerS),
            growthRateUncertainty95PerS: finite(
              item.growthRateUncertainty95PerS,
            ),
          };
        },
      ),
    },
    globalCausalityScreen: {
      evidence: artifact(causality.evidence),
      timeFunctionGradient: arrayRef(causality.timeFunctionGradient),
      causalIntervalSamples: arrayRef(causality.causalIntervalSamples),
      geodesicSamples: arrayRef(causality.geodesicSamples),
      minimumTimelikeGradientMargin: finite(
        causality.minimumTimelikeGradientMargin,
      ),
      timelikeGradientUncertainty95: finite(
        causality.timelikeGradientUncertainty95,
      ),
      minimumAllowedTimelikeGradientMargin: finite(
        causality.minimumAllowedTimelikeGradientMargin,
      ),
      minimumCausalIntervalSquaredM2: finite(
        causality.minimumCausalIntervalSquaredM2,
      ),
      causalIntervalUncertainty95M2: finite(
        causality.causalIntervalUncertainty95M2,
      ),
      minimumAllowedCausalIntervalSquaredM2: finite(
        causality.minimumAllowedCausalIntervalSquaredM2,
      ),
      ctcCandidateCount: finite(causality.ctcCandidateCount),
      minimumCompleteAffineParameterM: finite(
        causality.minimumCompleteAffineParameterM,
      ),
      affineParameterUncertainty95M: finite(
        causality.affineParameterUncertainty95M,
      ),
      minimumRequiredAffineParameterM: finite(
        causality.minimumRequiredAffineParameterM,
      ),
    },
    parameterNeighborhood: {
      evidence: artifact(neighborhood.evidence),
      minimumRequiredPassFraction: finite(
        neighborhood.minimumRequiredPassFraction,
      ),
      samples: (Array.isArray(neighborhood.samples)
        ? neighborhood.samples
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          sampleId: text(item.sampleId),
          parameterId:
            item.parameterId === "baseline"
              ? "baseline"
              : enumValue(
                  item.parameterId,
                  NHM2_DYNAMIC_ROBUSTNESS_PARAMETER_IDS,
                ),
          signedOffsetFraction: finite(item.signedOffsetFraction),
          sampleEvidence: artifact(item.sampleEvidence),
          minimumGateMargin: finite(item.minimumGateMargin),
          marginUncertainty95: finite(item.marginUncertainty95),
        };
      }),
    },
    uncertainty: {
      evidence: artifact(uncertainty.evidence),
      covariance: arrayRef(uncertainty.covariance),
      method: artifact(uncertainty.method),
      confidenceLevel: finite(uncertainty.confidenceLevel),
    },
    provenance: {
      producerId: text(provenance.producerId),
      producerVersion: text(provenance.producerVersion),
      solverId: text(provenance.solverId),
      solverVersion: text(provenance.solverVersion),
      solver: artifact(provenance.solver),
      environment: artifact(provenance.environment),
      invocation: artifact(provenance.invocation),
      inputManifest: artifact(provenance.inputManifest),
      startedAt: text(provenance.startedAt),
      completedAt: text(provenance.completedAt),
      runSpecificOutput: bool(provenance.runSpecificOutput),
    },
  };
};

const draft = (checkId: Nhm2DynamicBackreactionCheckId): CheckDraft => ({
  checkId,
  missing: [],
  failures: [],
  metricValue: null,
  tolerance: null,
  unit: null,
});
const unique = (values: string[]): string[] => Array.from(new Set(values));

const requireText = (
  value: string | null,
  id: string,
  gate: CheckDraft,
): void => {
  if (value == null) gate.missing.push(`${id}_missing`);
};
const requireHash = (
  value: string | null,
  id: string,
  gate: CheckDraft,
): void => {
  if (value == null) gate.missing.push(`${id}_missing`);
  else if (!SHA256.test(value)) gate.failures.push(`${id}_invalid`);
};
const requireArtifact = (
  value: Nhm2DynamicArtifactRefV1,
  id: string,
  gate: CheckDraft,
): void => {
  requireText(value.path, `${id}_path`, gate);
  requireHash(value.sha256, `${id}_sha256`, gate);
  if (value.path != null && /(^|[-/\\])latest([./\\-]|$)/i.test(value.path))
    gate.failures.push(`${id}_mutable_latest_path_forbidden`);
};
const requireArray = (
  value: Nhm2DynamicArrayRefV1,
  id: string,
  gate: CheckDraft,
  expectedFirstDimension?: number | null,
): void => {
  requireArtifact(value, id, gate);
  if (value.dtype == null) gate.missing.push(`${id}_dtype_missing`);
  if (value.unit == null) gate.missing.push(`${id}_unit_missing`);
  if (value.shape.length === 0) gate.missing.push(`${id}_shape_missing`);
  else if (
    value.shape.some(
      (dimension) => !Number.isInteger(dimension) || dimension <= 0,
    )
  )
    gate.failures.push(`${id}_shape_invalid`);
  if (
    expectedFirstDimension != null &&
    value.shape.length > 0 &&
    value.shape[0] !== expectedFirstDimension
  )
    gate.failures.push(`${id}_sample_count_mismatch`);
};
const requirePositiveInteger = (
  value: number | null,
  id: string,
  gate: CheckDraft,
): void => {
  if (value == null) gate.missing.push(`${id}_missing`);
  else if (!Number.isInteger(value) || value <= 0)
    gate.failures.push(`${id}_invalid`);
};

const commonEvidence = (
  value: PrimitiveEvidence,
): Pick<CheckDraft, "missing" | "failures"> => {
  const common = draft(
    NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CHECK_IDS[0],
  );
  const binding = value.binding;
  for (const [id, field] of [
    ["candidate_id", binding.candidateId],
    ["candidate_manifest_path", binding.candidateManifestPath],
    ["pre_run_manifest_path", binding.preRunManifestPath],
    ["run_id", binding.runId],
    ["request_id", binding.requestId],
    ["receipt_id", binding.receiptId],
    ["runtime_id", binding.runtimeId],
    ["planned_output_directory", binding.plannedOutputDirectory],
    ["selected_profile_id", binding.selectedProfileId],
    ["chart_id", binding.chartId],
    ["atlas_path", binding.atlasPath],
    ["units_path", binding.unitsPath],
    ["normalization_path", binding.normalizationPath],
  ] as const)
    requireText(field, id, common);
  for (const [id, field] of [
    ["candidate_manifest_sha256", binding.candidateManifestSha256],
    ["pre_run_manifest_sha256", binding.preRunManifestSha256],
    ["atlas_sha256", binding.atlasSha256],
    ["units_sha256", binding.unitsSha256],
    ["normalization_sha256", binding.normalizationSha256],
  ] as const)
    requireHash(field, id, common);
  if (binding.laneId == null) common.missing.push("lane_id_missing");
  if (binding.gitSha == null) common.missing.push("git_sha_missing");
  else if (!GIT_SHA.test(binding.gitSha))
    common.failures.push("git_sha_invalid");

  const provenance = value.provenance;
  for (const [id, field] of [
    ["producer_id", provenance.producerId],
    ["producer_version", provenance.producerVersion],
    ["solver_id", provenance.solverId],
    ["solver_version", provenance.solverVersion],
  ] as const)
    requireText(field, id, common);
  for (const [id, field] of [
    ["solver", provenance.solver],
    ["environment", provenance.environment],
    ["invocation", provenance.invocation],
    ["input_manifest", provenance.inputManifest],
    ["uncertainty_evidence", value.uncertainty.evidence],
    ["uncertainty_method", value.uncertainty.method],
  ] as const)
    requireArtifact(field, id, common);
  requireArray(value.uncertainty.covariance, "uncertainty_covariance", common);
  if (value.uncertainty.confidenceLevel == null)
    common.missing.push("uncertainty_confidence_level_missing");
  else if (
    value.uncertainty.confidenceLevel < 0.95 ||
    value.uncertainty.confidenceLevel >= 1
  )
    common.failures.push("uncertainty_confidence_level_invalid");
  if (provenance.runSpecificOutput == null)
    common.missing.push("run_specific_output_missing");
  else if (!provenance.runSpecificOutput)
    common.failures.push("run_specific_output_failed");
  const started =
    provenance.startedAt == null
      ? Number.NaN
      : Date.parse(provenance.startedAt);
  const completed =
    provenance.completedAt == null
      ? Number.NaN
      : Date.parse(provenance.completedAt);
  const generated =
    value.generatedAt == null ? Number.NaN : Date.parse(value.generatedAt);
  if (provenance.startedAt == null) common.missing.push("started_at_missing");
  else if (
    !Number.isFinite(started) ||
    new Date(started).toISOString() !== provenance.startedAt
  )
    common.failures.push("started_at_invalid");
  if (provenance.completedAt == null)
    common.missing.push("completed_at_missing");
  else if (
    !Number.isFinite(completed) ||
    new Date(completed).toISOString() !== provenance.completedAt
  )
    common.failures.push("completed_at_invalid");
  if (value.generatedAt == null) common.missing.push("generated_at_missing");
  else if (
    !Number.isFinite(generated) ||
    new Date(generated).toISOString() !== value.generatedAt
  )
    common.failures.push("generated_at_invalid");
  if (
    Number.isFinite(started) &&
    Number.isFinite(completed) &&
    completed <= started
  )
    common.failures.push("execution_interval_invalid");
  if (
    Number.isFinite(completed) &&
    Number.isFinite(generated) &&
    generated < completed
  )
    common.failures.push("artifact_predates_execution_completion");
  if (
    binding.preRunManifestSha256 != null &&
    provenance.inputManifest.sha256 != null &&
    binding.preRunManifestSha256 !== provenance.inputManifest.sha256
  )
    common.failures.push("pre_run_manifest_provenance_mismatch");
  if (
    binding.preRunManifestPath != null &&
    provenance.inputManifest.path != null &&
    binding.preRunManifestPath !== provenance.inputManifest.path
  )
    common.failures.push("pre_run_manifest_path_provenance_mismatch");
  if (
    binding.plannedOutputDirectory != null &&
    /(^|[-/\\])latest([./\\-]|$)/i.test(binding.plannedOutputDirectory)
  )
    common.failures.push("planned_output_directory_mutable_latest_forbidden");
  return { missing: common.missing, failures: common.failures };
};

const addCommon = (
  gate: CheckDraft,
  common: Pick<CheckDraft, "missing" | "failures">,
): void => {
  gate.missing.push(...common.missing);
  gate.failures.push(...common.failures);
};

const convergenceOrder = (
  points: Array<{
    discretizationScale: number | null;
    residualRelative: number | null;
    uncertainty95Relative: number | null;
  }>,
  axis: string,
  gate: CheckDraft,
): number | null => {
  if (points.length < 3) {
    gate.missing.push(`${axis}_three_resolution_levels_required`);
    return null;
  }
  let minimum = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    if (
      point.discretizationScale == null ||
      point.residualRelative == null ||
      point.uncertainty95Relative == null
    ) {
      gate.missing.push(`${axis}_point_${index}_incomplete`);
      return;
    }
    if (
      point.discretizationScale <= 0 ||
      point.residualRelative < 0 ||
      point.uncertainty95Relative < 0
    ) {
      gate.failures.push(`${axis}_point_${index}_invalid`);
      return;
    }
    if (index === 0) return;
    const previous = points[index - 1];
    if (
      previous.discretizationScale == null ||
      previous.residualRelative == null ||
      previous.uncertainty95Relative == null
    )
      return;
    const coarse = previous.residualRelative + previous.uncertainty95Relative;
    const fine = point.residualRelative + point.uncertainty95Relative;
    if (
      previous.discretizationScale <= point.discretizationScale ||
      coarse <= fine ||
      fine <= 0
    ) {
      gate.failures.push(`${axis}_not_monotonically_convergent`);
      return;
    }
    const order =
      Math.log(coarse / fine) /
      Math.log(previous.discretizationScale / point.discretizationScale);
    if (!Number.isFinite(order) || order <= 0)
      gate.failures.push(`${axis}_observed_order_invalid`);
    else minimum = Math.min(minimum, order);
  });
  return Number.isFinite(minimum) ? minimum : null;
};

const deriveChecks = (
  value: PrimitiveEvidence,
): Nhm2DynamicBackreactionStabilityCausalityV1["checks"] => {
  const common = commonEvidence(value);
  const initial = draft("candidate_initial_data_and_source_coupled");
  addCommon(initial, common);
  requireArtifact(
    value.initialCoupling.initialData,
    "candidate_initial_data",
    initial,
  );
  requireArtifact(
    value.initialCoupling.couplingOperator,
    "source_coupling_operator",
    initial,
  );
  requireArtifact(
    value.initialCoupling.constitutiveState,
    "source_constitutive_state",
    initial,
  );
  requirePositiveInteger(
    value.initialCoupling.sampleCount,
    "initial_sample_count",
    initial,
  );
  requireArray(
    value.initialCoupling.geometryState,
    "initial_geometry_state",
    initial,
    value.initialCoupling.sampleCount,
  );
  requireArray(
    value.initialCoupling.sourceTensor,
    "initial_source_tensor",
    initial,
    value.initialCoupling.sampleCount,
  );
  if (value.initialCoupling.sourceReturnedToEvolution == null)
    initial.missing.push("source_returned_to_evolution_missing");
  else if (!value.initialCoupling.sourceReturnedToEvolution)
    initial.failures.push("source_not_returned_to_evolution");
  const firstEvolutionSample = value.evolution.samples[0];
  if (
    value.initialCoupling.geometryState.sha256 != null &&
    firstEvolutionSample?.geometryState.sha256 != null &&
    value.initialCoupling.geometryState.sha256 !==
      firstEvolutionSample.geometryState.sha256
  )
    initial.failures.push("initial_geometry_not_bound_to_evolution_step_zero");
  if (
    value.initialCoupling.sourceTensor.sha256 != null &&
    firstEvolutionSample?.sourceTensor.sha256 != null &&
    value.initialCoupling.sourceTensor.sha256 !==
      firstEvolutionSample.sourceTensor.sha256
  )
    initial.failures.push("initial_source_not_bound_to_evolution_step_zero");
  const initialNumbers = [
    value.initialCoupling.initialConstraintResidual,
    value.initialCoupling.initialConstraintUncertainty95,
    value.initialCoupling.initialConstraintTolerance,
  ];
  if (initialNumbers.some((number) => number == null))
    initial.missing.push("initial_constraint_bound_missing");
  else {
    const [residual, uncertainty95, tolerance] = initialNumbers as number[];
    if (residual < 0 || uncertainty95 < 0 || tolerance <= 0)
      initial.failures.push("initial_constraint_bound_invalid");
    else {
      initial.metricValue = (residual + uncertainty95) / tolerance;
      initial.tolerance = 1;
      initial.unit = "uncertainty_adjusted_tolerance_fraction";
      if (initial.metricValue > 1)
        initial.failures.push("initial_constraint_exceeds_tolerance");
    }
  }

  const timestep = draft("positive_timestep_duration_and_multiple_samples");
  addCommon(timestep, common);
  requireArtifact(value.evolution.integrator, "evolution_integrator", timestep);
  if (value.evolution.evolutionSystem == null)
    timestep.missing.push("bssn_evolution_system_missing");
  if (value.evolution.dtS == null) timestep.missing.push("timestep_missing");
  else if (value.evolution.dtS <= 0)
    timestep.failures.push("timestep_not_positive");
  if (value.evolution.durationS == null)
    timestep.missing.push("duration_missing");
  else if (value.evolution.durationS <= 0)
    timestep.failures.push("duration_not_positive");
  if (value.evolution.samples.length < 3)
    timestep.missing.push("multiple_evolution_samples_required");
  value.evolution.samples.forEach((sample, index) => {
    if (sample.step == null || sample.timeS == null) {
      timestep.missing.push(`evolution_sample_${index}_coordinate_missing`);
      return;
    }
    if (!Number.isInteger(sample.step) || sample.step !== index)
      timestep.failures.push(`evolution_sample_${index}_step_invalid`);
    if (index === 0 && sample.timeS !== 0)
      timestep.failures.push("evolution_initial_time_not_zero");
    if (
      value.evolution.dtS != null &&
      Math.abs(sample.timeS - index * value.evolution.dtS) >
        Math.max(1e-15, value.evolution.dtS * 1e-9)
    )
      timestep.failures.push(`evolution_sample_${index}_time_grid_mismatch`);
  });
  if (
    value.evolution.durationS != null &&
    value.evolution.samples.length > 0 &&
    value.evolution.samples.at(-1)?.timeS != null &&
    Math.abs(
      (value.evolution.samples.at(-1)?.timeS as number) -
        value.evolution.durationS,
    ) > Math.max(1e-15, value.evolution.durationS * 1e-9)
  )
    timestep.failures.push("duration_final_sample_mismatch");
  timestep.metricValue = value.evolution.samples.length;
  timestep.tolerance = 1;
  timestep.unit = "sample_count";

  const sampleSufficiency = draft("dynamics_sample_count_meets_frozen_minimum");
  addCommon(sampleSufficiency, common);
  if (value.evolution.samples.length === 0) {
    sampleSufficiency.missing.push("evolution_samples_missing");
  } else if (
    value.evolution.samples.length <
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
      .dynamics.minimumEvolutionSamples
  ) {
    sampleSufficiency.failures.push(
      "evolution_sample_count_below_frozen_minimum",
    );
  }

  const normalizedHorizon = draft(
    "normalized_positive_time_horizon_meets_frozen_minimum",
  );
  addCommon(normalizedHorizon, common);
  requireArtifact(
    value.evolution.horizonNormalization.timingDefinition,
    "horizon_timing_definition",
    normalizedHorizon,
  );
  const horizonInputs = [
    [
      "switching_period",
      value.evolution.horizonNormalization.switchingPeriodS,
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumSwitchingPeriods,
    ],
    [
      "light_crossing_time",
      value.evolution.horizonNormalization.lightCrossingTimeS,
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumLightCrossingTimes,
    ],
    [
      "control_cycle_period",
      value.evolution.horizonNormalization.controlCyclePeriodS,
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .dynamics.minimumControlCycles,
    ],
  ] as const;
  if (value.evolution.durationS == null) {
    normalizedHorizon.missing.push("duration_missing");
  } else if (value.evolution.durationS <= 0) {
    normalizedHorizon.failures.push("duration_not_positive");
  }
  for (const [id, period, minimumCycles] of horizonInputs) {
    if (period == null) {
      normalizedHorizon.missing.push(`${id}_missing`);
    } else if (period <= 0) {
      normalizedHorizon.failures.push(`${id}_not_positive`);
    } else if (
      value.evolution.durationS != null &&
      value.evolution.durationS > 0 &&
      value.evolution.durationS / period < minimumCycles
    ) {
      normalizedHorizon.failures.push(`${id}_horizon_below_frozen_minimum`);
    }
  }

  const nontrivial = draft("dynamic_nontriviality_verified");
  addCommon(nontrivial, common);
  if (value.evolution.metricChangeFloor == null)
    nontrivial.missing.push("metric_change_floor_missing");
  else if (value.evolution.metricChangeFloor <= 0)
    nontrivial.failures.push("metric_change_floor_invalid");
  if (value.evolution.sourceChangeFloor == null)
    nontrivial.missing.push("source_change_floor_missing");
  else if (value.evolution.sourceChangeFloor <= 0)
    nontrivial.failures.push("source_change_floor_invalid");
  let maximumJointRatio = 0;
  value.evolution.samples.forEach((sample, index) => {
    requireArray(
      sample.geometryState,
      `evolution_geometry_${index}`,
      nontrivial,
      value.initialCoupling.sampleCount,
    );
    requireArray(
      sample.sourceTensor,
      `evolution_source_${index}`,
      nontrivial,
      value.initialCoupling.sampleCount,
    );
    const numbers = [
      sample.metricDeltaL2,
      sample.sourceDeltaL2,
      sample.couplingResidual,
      sample.couplingUncertainty95,
      sample.couplingTolerance,
    ];
    if (numbers.some((number) => number == null)) {
      nontrivial.missing.push(
        `evolution_sample_${index}_coupling_metrics_missing`,
      );
      return;
    }
    const [metricDelta, sourceDelta, coupling, uncertainty95, tolerance] =
      numbers as number[];
    if (
      metricDelta < 0 ||
      sourceDelta < 0 ||
      coupling < 0 ||
      uncertainty95 < 0 ||
      tolerance <= 0
    )
      nontrivial.failures.push(
        `evolution_sample_${index}_coupling_metrics_invalid`,
      );
    else if (coupling + uncertainty95 > tolerance)
      nontrivial.failures.push(
        `evolution_sample_${index}_coupling_residual_exceeds_tolerance`,
      );
    if (
      value.evolution.metricChangeFloor != null &&
      value.evolution.sourceChangeFloor != null
    )
      maximumJointRatio = Math.max(
        maximumJointRatio,
        Math.min(
          metricDelta / value.evolution.metricChangeFloor,
          sourceDelta / value.evolution.sourceChangeFloor,
        ),
      );
  });
  nontrivial.metricValue = maximumJointRatio;
  nontrivial.tolerance = 1;
  nontrivial.unit = "joint_metric_source_change_floor_ratio";
  if (value.evolution.samples.length > 0 && maximumJointRatio <= 1)
    nontrivial.failures.push("coupled_source_evolution_is_trivial");
  const firstEvolution = value.evolution.samples[0];
  const finalEvolution = value.evolution.samples.at(-1);
  if (
    firstEvolution?.geometryState.sha256 != null &&
    finalEvolution?.geometryState.sha256 != null &&
    firstEvolution.geometryState.sha256 === finalEvolution.geometryState.sha256
  )
    nontrivial.failures.push("geometry_state_hash_unchanged");
  if (
    firstEvolution?.sourceTensor.sha256 != null &&
    finalEvolution?.sourceTensor.sha256 != null &&
    firstEvolution.sourceTensor.sha256 === finalEvolution.sourceTensor.sha256
  )
    nontrivial.failures.push("source_tensor_hash_unchanged");

  const bssn = draft("bssn_constraints_propagate_within_tolerance");
  addCommon(bssn, common);
  requireArtifact(
    value.bssnConstraints.evidence,
    "bssn_constraint_evidence",
    bssn,
  );
  let worstConstraintRatio = 0;
  for (const constraintId of NHM2_DYNAMIC_BSSN_CONSTRAINT_IDS) {
    const matches = value.bssnConstraints.constraints.filter(
      (constraint) => constraint.constraintId === constraintId,
    );
    if (matches.length === 0) bssn.missing.push(`bssn_${constraintId}_missing`);
    else if (matches.length > 1)
      bssn.failures.push(`bssn_${constraintId}_duplicate`);
  }
  value.bssnConstraints.constraints.forEach((constraint, index) => {
    requireArray(
      constraint.residuals,
      `bssn_constraint_${index}_residuals`,
      bssn,
      value.evolution.samples.length || null,
    );
    if (
      constraint.maxAbs == null ||
      constraint.absoluteUncertainty95 == null ||
      constraint.tolerance == null
    )
      bssn.missing.push(`bssn_constraint_${index}_bound_missing`);
    else if (
      constraint.maxAbs < 0 ||
      constraint.absoluteUncertainty95 < 0 ||
      constraint.tolerance <= 0
    )
      bssn.failures.push(`bssn_constraint_${index}_bound_invalid`);
    else {
      const ratio =
        (constraint.maxAbs + constraint.absoluteUncertainty95) /
        constraint.tolerance;
      worstConstraintRatio = Math.max(worstConstraintRatio, ratio);
      if (ratio > 1)
        bssn.failures.push(
          `bssn_${constraint.constraintId ?? index}_exceeds_tolerance`,
        );
    }
  });
  if (value.bssnConstraints.constraints.length > 0) {
    bssn.metricValue = worstConstraintRatio;
    bssn.tolerance = 1;
    bssn.unit = "normalized_constraint_L_inf";
  }

  const convergence = draft(
    "resolution_boundary_and_frequency_convergence_observed",
  );
  addCommon(convergence, common);
  requireArtifact(
    value.convergence.evidence,
    "dynamic_convergence_evidence",
    convergence,
  );
  if (value.convergence.minimumAcceptedOrder == null)
    convergence.missing.push("minimum_accepted_order_missing");
  else if (value.convergence.minimumAcceptedOrder <= 0)
    convergence.failures.push("minimum_accepted_order_invalid");
  if (value.convergence.orderUncertainty95 == null)
    convergence.missing.push("convergence_order_uncertainty_missing");
  else if (value.convergence.orderUncertainty95 < 0)
    convergence.failures.push("convergence_order_uncertainty_invalid");
  const orders: number[] = [];
  for (const axis of NHM2_DYNAMIC_CONVERGENCE_AXES) {
    const matches = value.convergence.studies.filter(
      (study) => study.axis === axis,
    );
    if (matches.length === 0) {
      convergence.missing.push(`${axis}_convergence_study_missing`);
      continue;
    }
    if (matches.length > 1)
      convergence.failures.push(`${axis}_convergence_study_duplicate`);
    const study = matches[0];
    requireArray(
      study.residuals,
      `${axis}_convergence_residuals`,
      convergence,
      study.points.length || null,
    );
    const order = convergenceOrder(
      study.points,
      `${axis}_convergence`,
      convergence,
    );
    if (order != null) orders.push(order);
  }
  if (orders.length === NHM2_DYNAMIC_CONVERGENCE_AXES.length) {
    const lowerOrder =
      Math.min(...orders) - (value.convergence.orderUncertainty95 ?? 0);
    convergence.metricValue = lowerOrder;
    convergence.tolerance = value.convergence.minimumAcceptedOrder;
    convergence.unit = "observed_order_lower95";
    if (
      value.convergence.minimumAcceptedOrder != null &&
      lowerOrder < value.convergence.minimumAcceptedOrder
    )
      convergence.failures.push(
        "dynamic_convergence_order_below_frozen_minimum",
      );
  }

  const backreaction = draft("semiclassical_backreaction_residual_bounded");
  addCommon(backreaction, common);
  requireArtifact(
    value.semiclassicalBackreaction.evidence,
    "semiclassical_backreaction_evidence",
    backreaction,
  );
  for (const [id, ref] of [
    ["backreaction_geometry", value.semiclassicalBackreaction.geometry],
    [
      "backreaction_rset",
      value.semiclassicalBackreaction.renormalizedStressTensor,
    ],
    ["backreaction_source", value.semiclassicalBackreaction.sourceTensor],
  ] as const)
    requireArray(ref, id, backreaction, value.initialCoupling.sampleCount);
  requirePositiveInteger(
    value.semiclassicalBackreaction.selfConsistentIterations,
    "backreaction_iterations",
    backreaction,
  );
  if (value.semiclassicalBackreaction.converged == null)
    backreaction.missing.push("backreaction_converged_missing");
  else if (!value.semiclassicalBackreaction.converged)
    backreaction.failures.push("backreaction_not_converged");
  const backreactionNumbers = [
    value.semiclassicalBackreaction.residualRelativeLInf,
    value.semiclassicalBackreaction.absoluteUncertainty95,
    value.semiclassicalBackreaction.toleranceRelativeLInf,
  ];
  if (backreactionNumbers.some((number) => number == null))
    backreaction.missing.push("backreaction_residual_bound_missing");
  else {
    const [residualValue, uncertainty95, tolerance] =
      backreactionNumbers as number[];
    if (residualValue < 0 || uncertainty95 < 0 || tolerance <= 0)
      backreaction.failures.push("backreaction_residual_bound_invalid");
    else {
      backreaction.metricValue = residualValue + uncertainty95;
      backreaction.tolerance = tolerance;
      backreaction.unit = "relative_L_inf";
      if (backreaction.metricValue > tolerance)
        backreaction.failures.push("backreaction_residual_exceeds_tolerance");
    }
  }

  const horizon = draft("horizon_and_characteristic_screen_pass");
  addCommon(horizon, common);
  requireArtifact(
    value.horizonCharacteristicScreen.evidence,
    "horizon_characteristic_evidence",
    horizon,
  );
  requireArray(
    value.horizonCharacteristicScreen.outgoingNullExpansion,
    "outgoing_null_expansion",
    horizon,
  );
  requireArray(
    value.horizonCharacteristicScreen.characteristicSpeeds,
    "characteristic_speeds",
    horizon,
  );
  const expansion = [
    value.horizonCharacteristicScreen.minimumOutgoingExpansion,
    value.horizonCharacteristicScreen.expansionUncertainty95,
    value.horizonCharacteristicScreen.minimumAllowedExpansion,
  ];
  const hyperbolicity = [
    value.horizonCharacteristicScreen.minimumHyperbolicityMargin,
    value.horizonCharacteristicScreen.hyperbolicityUncertainty95,
    value.horizonCharacteristicScreen.minimumAllowedHyperbolicityMargin,
  ];
  if (expansion.some((number) => number == null))
    horizon.missing.push("horizon_expansion_bound_missing");
  if (hyperbolicity.some((number) => number == null))
    horizon.missing.push("characteristic_hyperbolicity_bound_missing");
  let minimumHorizonMargin = Number.POSITIVE_INFINITY;
  for (const [id, values] of [
    ["horizon_expansion", expansion],
    ["characteristic_hyperbolicity", hyperbolicity],
  ] as const) {
    if (values.some((number) => number == null)) continue;
    const [measured, uncertainty95, minimum] = values as number[];
    if (uncertainty95 < 0) horizon.failures.push(`${id}_uncertainty_invalid`);
    const margin = measured - uncertainty95 - minimum;
    minimumHorizonMargin = Math.min(minimumHorizonMargin, margin);
    if (margin <= 0) horizon.failures.push(`${id}_screen_failed`);
  }
  if (Number.isFinite(minimumHorizonMargin)) {
    horizon.metricValue = minimumHorizonMargin;
    horizon.tolerance = 0;
    horizon.unit = "minimum_screen_margin";
  }

  const ray = draft("ray_blueshift_and_particle_accumulation_bounded");
  addCommon(ray, common);
  requireArtifact(
    value.rayParticleScreen.evidence,
    "ray_particle_evidence",
    ray,
  );
  requirePositiveInteger(value.rayParticleScreen.rayCount, "ray_count", ray);
  requirePositiveInteger(
    value.rayParticleScreen.particleSampleCount,
    "particle_sample_count",
    ray,
  );
  requireArray(
    value.rayParticleScreen.nullRayBundle,
    "null_ray_bundle",
    ray,
    value.rayParticleScreen.rayCount,
  );
  requireArray(
    value.rayParticleScreen.particleDistribution,
    "particle_distribution",
    ray,
    value.rayParticleScreen.particleSampleCount,
  );
  const rayBounds = [
    [
      "blueshift",
      value.rayParticleScreen.maximumBlueshiftGain,
      value.rayParticleScreen.blueshiftUncertainty95,
      value.rayParticleScreen.maximumAllowedBlueshiftGain,
    ],
    [
      "particle_accumulation",
      value.rayParticleScreen.maximumParticleAccumulationGain,
      value.rayParticleScreen.particleAccumulationUncertainty95,
      value.rayParticleScreen.maximumAllowedParticleAccumulationGain,
    ],
  ] as const;
  let worstRayRatio = 0;
  for (const [id, measured, uncertainty95, maximum] of rayBounds) {
    if (measured == null || uncertainty95 == null || maximum == null) {
      ray.missing.push(`${id}_bound_missing`);
      continue;
    }
    if (measured < 0 || uncertainty95 < 0 || maximum <= 0) {
      ray.failures.push(`${id}_bound_invalid`);
      continue;
    }
    const ratio = (measured + uncertainty95) / maximum;
    worstRayRatio = Math.max(worstRayRatio, ratio);
    if (ratio > 1) ray.failures.push(`${id}_exceeds_frozen_maximum`);
  }
  ray.metricValue = worstRayRatio;
  ray.tolerance = 1;
  ray.unit = "dimensionless_gain";

  const perturbation = draft("perturbation_growth_spectrum_bounded");
  addCommon(perturbation, common);
  requireArtifact(
    value.perturbationSpectrum.evidence,
    "perturbation_evidence",
    perturbation,
  );
  requireArray(
    value.perturbationSpectrum.spectrum,
    "perturbation_spectrum",
    perturbation,
    value.perturbationSpectrum.modes.length || null,
  );
  if (value.perturbationSpectrum.modes.length < 3)
    perturbation.missing.push("perturbation_multiple_modes_required");
  if (value.perturbationSpectrum.maximumAllowedGrowthRatePerS == null)
    perturbation.missing.push("maximum_allowed_growth_rate_missing");
  const modeIds = new Set<string>();
  let maximumGrowthUpper = Number.NEGATIVE_INFINITY;
  value.perturbationSpectrum.modes.forEach((mode, index) => {
    if (mode.modeId == null)
      perturbation.missing.push(`mode_${index}_id_missing`);
    else if (modeIds.has(mode.modeId))
      perturbation.failures.push(`mode_${index}_id_duplicate`);
    else modeIds.add(mode.modeId);
    if (
      mode.waveNumberPerM == null ||
      mode.growthRatePerS == null ||
      mode.growthRateUncertainty95PerS == null
    ) {
      perturbation.missing.push(`mode_${index}_spectrum_value_missing`);
      return;
    }
    if (mode.waveNumberPerM <= 0 || mode.growthRateUncertainty95PerS < 0) {
      perturbation.failures.push(`mode_${index}_spectrum_value_invalid`);
      return;
    }
    const upper = mode.growthRatePerS + mode.growthRateUncertainty95PerS;
    maximumGrowthUpper = Math.max(maximumGrowthUpper, upper);
    if (
      value.perturbationSpectrum.maximumAllowedGrowthRatePerS != null &&
      upper > value.perturbationSpectrum.maximumAllowedGrowthRatePerS
    )
      perturbation.failures.push(`mode_${index}_growth_rate_exceeds_maximum`);
  });
  if (Number.isFinite(maximumGrowthUpper)) {
    perturbation.metricValue = maximumGrowthUpper;
    perturbation.tolerance =
      value.perturbationSpectrum.maximumAllowedGrowthRatePerS;
    perturbation.unit = "1/s";
  }

  const causality = draft("global_hyperbolicity_ctc_and_geodesic_screen_pass");
  addCommon(causality, common);
  requireArtifact(
    value.globalCausalityScreen.evidence,
    "global_causality_evidence",
    causality,
  );
  for (const [id, ref] of [
    [
      "time_function_gradient",
      value.globalCausalityScreen.timeFunctionGradient,
    ],
    [
      "causal_interval_samples",
      value.globalCausalityScreen.causalIntervalSamples,
    ],
    ["geodesic_samples", value.globalCausalityScreen.geodesicSamples],
  ] as const)
    requireArray(ref, id, causality);
  const causalityMargins = [
    [
      "timelike_gradient",
      value.globalCausalityScreen.minimumTimelikeGradientMargin,
      value.globalCausalityScreen.timelikeGradientUncertainty95,
      value.globalCausalityScreen.minimumAllowedTimelikeGradientMargin,
    ],
    [
      "causal_interval",
      value.globalCausalityScreen.minimumCausalIntervalSquaredM2,
      value.globalCausalityScreen.causalIntervalUncertainty95M2,
      value.globalCausalityScreen.minimumAllowedCausalIntervalSquaredM2,
    ],
    [
      "geodesic_affine_parameter",
      value.globalCausalityScreen.minimumCompleteAffineParameterM,
      value.globalCausalityScreen.affineParameterUncertainty95M,
      value.globalCausalityScreen.minimumRequiredAffineParameterM,
    ],
  ] as const;
  let minimumCausalityMargin = Number.POSITIVE_INFINITY;
  for (const [id, measured, uncertainty95, minimum] of causalityMargins) {
    if (measured == null || uncertainty95 == null || minimum == null) {
      causality.missing.push(`${id}_bound_missing`);
      continue;
    }
    if (uncertainty95 < 0) {
      causality.failures.push(`${id}_uncertainty_invalid`);
      continue;
    }
    const margin = measured - uncertainty95 - minimum;
    minimumCausalityMargin = Math.min(minimumCausalityMargin, margin);
    if (margin <= 0) causality.failures.push(`${id}_screen_failed`);
  }
  if (value.globalCausalityScreen.ctcCandidateCount == null)
    causality.missing.push("ctc_candidate_count_missing");
  else if (
    !Number.isInteger(value.globalCausalityScreen.ctcCandidateCount) ||
    value.globalCausalityScreen.ctcCandidateCount !== 0
  )
    causality.failures.push("ctc_candidates_detected");
  if (Number.isFinite(minimumCausalityMargin)) {
    causality.metricValue = minimumCausalityMargin;
    causality.tolerance = 0;
    causality.unit = "minimum_causality_margin";
  }

  const neighborhood = draft("parameter_neighborhood_robustness_pass");
  addCommon(neighborhood, common);
  requireArtifact(
    value.parameterNeighborhood.evidence,
    "parameter_neighborhood_evidence",
    neighborhood,
  );
  if (value.parameterNeighborhood.minimumRequiredPassFraction == null)
    neighborhood.missing.push("neighborhood_minimum_pass_fraction_missing");
  else if (
    value.parameterNeighborhood.minimumRequiredPassFraction < 0.95 ||
    value.parameterNeighborhood.minimumRequiredPassFraction > 1
  )
    neighborhood.failures.push("neighborhood_minimum_pass_fraction_invalid");
  const baseline = value.parameterNeighborhood.samples.filter(
    (sample) => sample.parameterId === "baseline",
  );
  if (baseline.length === 0)
    neighborhood.missing.push("neighborhood_baseline_missing");
  else if (baseline.length > 1)
    neighborhood.failures.push("neighborhood_baseline_duplicate");
  else if (baseline[0].signedOffsetFraction !== 0)
    neighborhood.failures.push("neighborhood_baseline_offset_invalid");
  for (const parameterId of NHM2_DYNAMIC_ROBUSTNESS_PARAMETER_IDS) {
    const samples = value.parameterNeighborhood.samples.filter(
      (sample) => sample.parameterId === parameterId,
    );
    if (!samples.some((sample) => (sample.signedOffsetFraction ?? 0) < 0))
      neighborhood.missing.push(
        `${parameterId}_negative_neighborhood_sample_missing`,
      );
    if (!samples.some((sample) => (sample.signedOffsetFraction ?? 0) > 0))
      neighborhood.missing.push(
        `${parameterId}_positive_neighborhood_sample_missing`,
      );
  }
  const sampleIds = new Set<string>();
  let passingNeighborhoodSamples = 0;
  value.parameterNeighborhood.samples.forEach((sample, index) => {
    if (sample.sampleId == null)
      neighborhood.missing.push(`neighborhood_sample_${index}_id_missing`);
    else if (sampleIds.has(sample.sampleId))
      neighborhood.failures.push(`neighborhood_sample_${index}_id_duplicate`);
    else sampleIds.add(sample.sampleId);
    requireArtifact(
      sample.sampleEvidence,
      `neighborhood_sample_${index}_evidence`,
      neighborhood,
    );
    if (
      sample.parameterId == null ||
      sample.signedOffsetFraction == null ||
      sample.minimumGateMargin == null ||
      sample.marginUncertainty95 == null
    ) {
      neighborhood.missing.push(`neighborhood_sample_${index}_incomplete`);
      return;
    }
    if (sample.marginUncertainty95 < 0)
      neighborhood.failures.push(
        `neighborhood_sample_${index}_uncertainty_invalid`,
      );
    if (sample.minimumGateMargin - sample.marginUncertainty95 > 0)
      passingNeighborhoodSamples += 1;
  });
  const passFraction =
    value.parameterNeighborhood.samples.length === 0
      ? 0
      : passingNeighborhoodSamples / value.parameterNeighborhood.samples.length;
  neighborhood.metricValue = passFraction;
  neighborhood.tolerance =
    value.parameterNeighborhood.minimumRequiredPassFraction;
  neighborhood.unit = "coverage_fraction";
  if (
    value.parameterNeighborhood.samples.length > 0 &&
    value.parameterNeighborhood.minimumRequiredPassFraction != null &&
    passFraction < value.parameterNeighborhood.minimumRequiredPassFraction
  )
    neighborhood.failures.push("parameter_neighborhood_pass_fraction_too_low");

  return [
    initial,
    timestep,
    sampleSufficiency,
    normalizedHorizon,
    nontrivial,
    bssn,
    convergence,
    backreaction,
    horizon,
    ray,
    perturbation,
    causality,
    neighborhood,
  ].map((gate) => {
    const blockers = unique([...gate.failures, ...gate.missing]);
    const status: Nhm2DynamicBackreactionStatus =
      gate.failures.length > 0
        ? "fail"
        : gate.missing.length > 0
          ? "blocked"
          : "pass";
    return {
      checkId: gate.checkId,
      status,
      pass: status === "pass",
      metricValue: gate.metricValue,
      tolerance: gate.tolerance,
      unit: gate.unit,
      blockers,
    };
  });
};

export const buildNhm2DynamicBackreactionStabilityCausality = (
  input: BuildNhm2DynamicBackreactionStabilityCausalityInput = {},
): Nhm2DynamicBackreactionStabilityCausalityV1 => {
  const primitive = normalizePrimitive(input);
  const checks = deriveChecks(primitive);
  const status: Nhm2DynamicBackreactionStatus = checks.some(
    (check) => check.status === "fail",
  )
    ? "fail"
    : checks.some((check) => check.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    contractVersion:
      NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CONTRACT_VERSION,
    ...primitive,
    checks,
    status,
    dynamicBackreactionStabilityCausalityReady: status === "pass",
    blockers: checks.flatMap((check) =>
      check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
    ),
    claimBoundary: {
      diagnosticOnly: true,
      theoryClosureEvidenceOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    },
  };
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

export const isNhm2DynamicBackreactionStabilityCausality = (
  value: unknown,
): value is Nhm2DynamicBackreactionStabilityCausalityV1 => {
  if (
    !isRecord(value) ||
    value.contractVersion !==
      NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2DynamicBackreactionStabilityCausality(
    value as unknown as BuildNhm2DynamicBackreactionStabilityCausalityInput,
  );
  return (
    JSON.stringify(canonicalize(rebuilt)) ===
    JSON.stringify(canonicalize(value))
  );
};
