import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";

export const CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CONTRACT_VERSION =
  "casimir_finite_temperature_finite_geometry_maxwell_stress/v1" as const;

export const CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CHECK_IDS =
  [
    ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.finite_temperature_finite_geometry_maxwell_stress,
  ] as const;

export const CASIMIR_DIELECTRIC_SENSITIVITY_MODELS = [
  "measured_dispersion",
  "drude",
  "plasma",
] as const;

export const CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS = [
  "roughness",
  "patch_potential",
  "temperature",
] as const;

export const CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA = {
  matsubaraTermCount: 8,
  temperatureSweepSamples: 3,
  dielectricFrequencySamplesPerSurface: 4,
  finiteGeometrySamples: 4,
  finiteGeometryCells: 64,
  matsubaraConvergenceLevels: 3,
  meshConvergenceLevels: 3,
  minimumObservedOrderLower95: 1.5,
  forceGapSamples: 5,
  uncertaintySamplesPerComponent: 32,
} as const;

const CARTESIAN_VECTOR_COMPONENT_ORDER = ["x", "y", "z"] as const;
const MAXWELL_STRESS_COMPONENT_ORDER = [
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

export type CasimirFiniteGeometryCheckId =
  (typeof CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CHECK_IDS)[number];
export type CasimirDielectricSensitivityModel =
  (typeof CASIMIR_DIELECTRIC_SENSITIVITY_MODELS)[number];
export type CasimirMaterialUncertaintyComponent =
  (typeof CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS)[number];
export type CasimirFiniteGeometryStatus = "pass" | "blocked" | "fail";

export type CasimirFiniteGeometryArtifactRefV1 = {
  path: string | null;
  sha256: string | null;
};

export type CasimirFiniteGeometryArrayRefV1 =
  CasimirFiniteGeometryArtifactRefV1 & {
    dtype: "float64" | null;
    shape: number[];
    sizeBytes: number | null;
    storageOrder: "row-major" | "column-major" | null;
    componentOrder: string[];
    unit: string | null;
  };

export type CasimirFiniteGeometryBindingV1 = {
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

export type CasimirFiniteTemperatureFiniteGeometryMaxwellStressV1 = {
  contractVersion: typeof CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CONTRACT_VERSION;
  generatedAt: string | null;
  binding: CasimirFiniteGeometryBindingV1;
  thermodynamics: {
    formulation: "finite_temperature_lifshitz_matsubara" | null;
    temperatureK: number | null;
    targetGapM: number | null;
    lifshitzKernel: CasimirFiniteGeometryArtifactRefV1;
    zeroFrequencyPrescription: "measured_response" | "drude" | "plasma" | null;
    matsubaraFrequencies: CasimirFiniteGeometryArrayRefV1;
    matsubaraTermContributions: CasimirFiniteGeometryArrayRefV1;
    temperatureSweep: CasimirFiniteGeometryArrayRefV1;
    matsubaraTermCount: number | null;
    truncationRemainderRelative: number | null;
    truncationToleranceRelative: number | null;
  };
  dielectricResponse: {
    datasets: Array<{
      materialId: string | null;
      specimenId: string | null;
      sourceReceipt: CasimirFiniteGeometryArtifactRefV1;
      frequencyHz: CasimirFiniteGeometryArrayRefV1;
      epsilonReal: CasimirFiniteGeometryArrayRefV1;
      epsilonImaginary: CasimirFiniteGeometryArrayRefV1;
      temperatureK: number | null;
      frequencyMinimumHz: number | null;
      frequencyMaximumHz: number | null;
      measurementUncertaintyRelative95: number | null;
    }>;
    kramersKronig: {
      evidence: CasimirFiniteGeometryArtifactRefV1;
      residuals: CasimirFiniteGeometryArrayRefV1;
      maximumResidualRelative: number | null;
      absoluteUncertainty95: number | null;
      toleranceRelative: number | null;
    };
    sensitivity: Array<{
      model: CasimirDielectricSensitivityModel | null;
      constitutiveModel: CasimirFiniteGeometryArtifactRefV1;
      forceField: CasimirFiniteGeometryArrayRefV1;
      pressureField: CasimirFiniteGeometryArrayRefV1;
      integratedForceN: number | null;
      absoluteUncertainty95N: number | null;
    }>;
    maximumModelSpreadRelative: number | null;
    modelSpreadUncertainty95: number | null;
    modelSpreadToleranceRelative: number | null;
    nonlocalResponse: {
      disposition: "computed" | "bounded_negligible" | "out_of_domain" | null;
      evidence: CasimirFiniteGeometryArtifactRefV1;
      targetGapM: number | null;
      correctionRelative: number | null;
      absoluteUncertainty95: number | null;
      toleranceRelative: number | null;
    };
  };
  finiteGeometry: {
    authorityModel: "finite_cad_maxwell_stress" | null;
    cadModel: CasimirFiniteGeometryArtifactRefV1;
    mesh: CasimirFiniteGeometryArtifactRefV1;
    materialMap: CasimirFiniteGeometryArtifactRefV1;
    boundaryConditions: CasimirFiniteGeometryArtifactRefV1;
    integrationSurface: CasimirFiniteGeometryArtifactRefV1;
    supportAnchorsIncluded: boolean | null;
    pocketIncluded: boolean | null;
    rimIncluded: boolean | null;
    supportLatticeIncluded: boolean | null;
    cellCount: number | null;
    sampleCount: number | null;
    electricField: CasimirFiniteGeometryArrayRefV1;
    magneticField: CasimirFiniteGeometryArrayRefV1;
    maxwellStressTensor: CasimirFiniteGeometryArrayRefV1;
    surfaceNormals: CasimirFiniteGeometryArrayRefV1;
    tractionField: CasimirFiniteGeometryArrayRefV1;
    pressureField: CasimirFiniteGeometryArrayRefV1;
    integratedForceVector: CasimirFiniteGeometryArrayRefV1;
  };
  convergence: {
    evidence: CasimirFiniteGeometryArtifactRefV1;
    minimumAcceptedOrder: number | null;
    orderUncertainty95: number | null;
    matsubaraSeries: Array<{
      termCount: number | null;
      integratedForceN: number | null;
      absoluteUncertainty95N: number | null;
    }>;
    meshSeries: Array<{
      maximumElementSizeM: number | null;
      cellCount: number | null;
      integratedForceN: number | null;
      absoluteUncertainty95N: number | null;
    }>;
    matsubaraResiduals: CasimirFiniteGeometryArrayRefV1;
    meshResiduals: CasimirFiniteGeometryArrayRefV1;
    matsubaraObservedOrder: number | null;
    meshObservedOrder: number | null;
  };
  forceGapGradient: {
    evidence: CasimirFiniteGeometryArtifactRefV1;
    gapCoordinates: CasimirFiniteGeometryArrayRefV1;
    integratedForce: CasimirFiniteGeometryArrayRefV1;
    forceGradient: CasimirFiniteGeometryArrayRefV1;
    localPressureFields: CasimirFiniteGeometryArrayRefV1;
    sampleCount: number | null;
    minimumGapM: number | null;
    maximumGapM: number | null;
    gradientDerivedFromFiniteGeometryField: boolean | null;
  };
  uncertainty: {
    evidence: CasimirFiniteGeometryArtifactRefV1;
    covariance: CasimirFiniteGeometryArrayRefV1;
    confidenceLevel: number | null;
    components: Array<{
      component: CasimirMaterialUncertaintyComponent | null;
      model: CasimirFiniteGeometryArtifactRefV1;
      samples: CasimirFiniteGeometryArrayRefV1;
      contributionRelative95: number | null;
    }>;
    combinedRelative95: number | null;
    maximumAllowedRelative95: number | null;
  };
  crossChecks: {
    analyticLimit: {
      evidence: CasimirFiniteGeometryArtifactRefV1;
      limitId: "large_separation" | "parallel_plate_asymptote" | null;
      residualRelative: number | null;
      absoluteUncertainty95: number | null;
      toleranceRelative: number | null;
    };
    independentSolver: {
      implementationId: string | null;
      solverId: string | null;
      solver: CasimirFiniteGeometryArtifactRefV1;
      environment: CasimirFiniteGeometryArtifactRefV1;
      output: CasimirFiniteGeometryArrayRefV1;
      relativeDifference: number | null;
      absoluteUncertainty95: number | null;
      toleranceRelative: number | null;
    };
  };
  authority: {
    primaryAuthority:
      "finite_temperature_finite_geometry_maxwell_stress" | null;
    idealParallelPlateUsedAsAuthority: boolean | null;
    idealParallelPlateRole:
      "analytic_limit_crosscheck_only" | "not_used" | null;
  };
  provenance: {
    producerId: string | null;
    implementationId: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: CasimirFiniteGeometryArtifactRefV1;
    environment: CasimirFiniteGeometryArtifactRefV1;
    invocation: CasimirFiniteGeometryArtifactRefV1;
    command: string | null;
    argv: string[];
    workingDirectory: string | null;
    inputManifest: CasimirFiniteGeometryArtifactRefV1;
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
    checkId: CasimirFiniteGeometryCheckId;
    status: CasimirFiniteGeometryStatus;
    pass: boolean;
    metricValue: number | null;
    tolerance: number | null;
    unit: string | null;
    blockers: string[];
  }>;
  status: CasimirFiniteGeometryStatus;
  finiteTemperatureFiniteGeometryMaxwellStressReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    apparatusTheoryEvidenceOnly: true;
    idealScalarCannotEstablishMechanism: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  CasimirFiniteTemperatureFiniteGeometryMaxwellStressV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "finiteTemperatureFiniteGeometryMaxwellStressReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildCasimirFiniteTemperatureFiniteGeometryMaxwellStressInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: CasimirFiniteGeometryCheckId;
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
const unique = (values: string[]): string[] => [...new Set(values)];

const artifact = (value: unknown): CasimirFiniteGeometryArtifactRefV1 => {
  const item = recordOf(value);
  return { path: text(item.path), sha256: text(item.sha256) };
};

const arrayRef = (value: unknown): CasimirFiniteGeometryArrayRefV1 => {
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

const normalizePrimitive = (
  input: BuildCasimirFiniteTemperatureFiniteGeometryMaxwellStressInput,
): PrimitiveEvidence => {
  const root = recordOf(input);
  const binding = recordOf(root.binding);
  const thermodynamics = recordOf(root.thermodynamics);
  const dielectric = recordOf(root.dielectricResponse);
  const kk = recordOf(dielectric.kramersKronig);
  const nonlocal = recordOf(dielectric.nonlocalResponse);
  const geometry = recordOf(root.finiteGeometry);
  const convergence = recordOf(root.convergence);
  const forceGap = recordOf(root.forceGapGradient);
  const uncertainty = recordOf(root.uncertainty);
  const crossChecks = recordOf(root.crossChecks);
  const analytic = recordOf(crossChecks.analyticLimit);
  const independent = recordOf(crossChecks.independentSolver);
  const authority = recordOf(root.authority);
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
    thermodynamics: {
      formulation:
        thermodynamics.formulation === "finite_temperature_lifshitz_matsubara"
          ? "finite_temperature_lifshitz_matsubara"
          : null,
      temperatureK: finite(thermodynamics.temperatureK),
      targetGapM: finite(thermodynamics.targetGapM),
      lifshitzKernel: artifact(thermodynamics.lifshitzKernel),
      zeroFrequencyPrescription: enumValue(
        thermodynamics.zeroFrequencyPrescription,
        ["measured_response", "drude", "plasma"] as const,
      ),
      matsubaraFrequencies: arrayRef(thermodynamics.matsubaraFrequencies),
      matsubaraTermContributions: arrayRef(
        thermodynamics.matsubaraTermContributions,
      ),
      temperatureSweep: arrayRef(thermodynamics.temperatureSweep),
      matsubaraTermCount: finite(thermodynamics.matsubaraTermCount),
      truncationRemainderRelative: finite(
        thermodynamics.truncationRemainderRelative,
      ),
      truncationToleranceRelative: finite(
        thermodynamics.truncationToleranceRelative,
      ),
    },
    dielectricResponse: {
      datasets: (Array.isArray(dielectric.datasets)
        ? dielectric.datasets
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          materialId: text(item.materialId),
          specimenId: text(item.specimenId),
          sourceReceipt: artifact(item.sourceReceipt),
          frequencyHz: arrayRef(item.frequencyHz),
          epsilonReal: arrayRef(item.epsilonReal),
          epsilonImaginary: arrayRef(item.epsilonImaginary),
          temperatureK: finite(item.temperatureK),
          frequencyMinimumHz: finite(item.frequencyMinimumHz),
          frequencyMaximumHz: finite(item.frequencyMaximumHz),
          measurementUncertaintyRelative95: finite(
            item.measurementUncertaintyRelative95,
          ),
        };
      }),
      kramersKronig: {
        evidence: artifact(kk.evidence),
        residuals: arrayRef(kk.residuals),
        maximumResidualRelative: finite(kk.maximumResidualRelative),
        absoluteUncertainty95: finite(kk.absoluteUncertainty95),
        toleranceRelative: finite(kk.toleranceRelative),
      },
      sensitivity: (Array.isArray(dielectric.sensitivity)
        ? dielectric.sensitivity
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          model: enumValue(item.model, CASIMIR_DIELECTRIC_SENSITIVITY_MODELS),
          constitutiveModel: artifact(item.constitutiveModel),
          forceField: arrayRef(item.forceField),
          pressureField: arrayRef(item.pressureField),
          integratedForceN: finite(item.integratedForceN),
          absoluteUncertainty95N: finite(item.absoluteUncertainty95N),
        };
      }),
      maximumModelSpreadRelative: finite(dielectric.maximumModelSpreadRelative),
      modelSpreadUncertainty95: finite(dielectric.modelSpreadUncertainty95),
      modelSpreadToleranceRelative: finite(
        dielectric.modelSpreadToleranceRelative,
      ),
      nonlocalResponse: {
        disposition: enumValue(nonlocal.disposition, [
          "computed",
          "bounded_negligible",
          "out_of_domain",
        ] as const),
        evidence: artifact(nonlocal.evidence),
        targetGapM: finite(nonlocal.targetGapM),
        correctionRelative: finite(nonlocal.correctionRelative),
        absoluteUncertainty95: finite(nonlocal.absoluteUncertainty95),
        toleranceRelative: finite(nonlocal.toleranceRelative),
      },
    },
    finiteGeometry: {
      authorityModel:
        geometry.authorityModel === "finite_cad_maxwell_stress"
          ? "finite_cad_maxwell_stress"
          : null,
      cadModel: artifact(geometry.cadModel),
      mesh: artifact(geometry.mesh),
      materialMap: artifact(geometry.materialMap),
      boundaryConditions: artifact(geometry.boundaryConditions),
      integrationSurface: artifact(geometry.integrationSurface),
      supportAnchorsIncluded: bool(geometry.supportAnchorsIncluded),
      pocketIncluded: bool(geometry.pocketIncluded),
      rimIncluded: bool(geometry.rimIncluded),
      supportLatticeIncluded: bool(geometry.supportLatticeIncluded),
      cellCount: finite(geometry.cellCount),
      sampleCount: finite(geometry.sampleCount),
      electricField: arrayRef(geometry.electricField),
      magneticField: arrayRef(geometry.magneticField),
      maxwellStressTensor: arrayRef(geometry.maxwellStressTensor),
      surfaceNormals: arrayRef(geometry.surfaceNormals),
      tractionField: arrayRef(geometry.tractionField),
      pressureField: arrayRef(geometry.pressureField),
      integratedForceVector: arrayRef(geometry.integratedForceVector),
    },
    convergence: {
      evidence: artifact(convergence.evidence),
      minimumAcceptedOrder: finite(convergence.minimumAcceptedOrder),
      orderUncertainty95: finite(convergence.orderUncertainty95),
      matsubaraSeries: (Array.isArray(convergence.matsubaraSeries)
        ? convergence.matsubaraSeries
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          termCount: finite(item.termCount),
          integratedForceN: finite(item.integratedForceN),
          absoluteUncertainty95N: finite(item.absoluteUncertainty95N),
        };
      }),
      meshSeries: (Array.isArray(convergence.meshSeries)
        ? convergence.meshSeries
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          maximumElementSizeM: finite(item.maximumElementSizeM),
          cellCount: finite(item.cellCount),
          integratedForceN: finite(item.integratedForceN),
          absoluteUncertainty95N: finite(item.absoluteUncertainty95N),
        };
      }),
      matsubaraResiduals: arrayRef(convergence.matsubaraResiduals),
      meshResiduals: arrayRef(convergence.meshResiduals),
      matsubaraObservedOrder: finite(convergence.matsubaraObservedOrder),
      meshObservedOrder: finite(convergence.meshObservedOrder),
    },
    forceGapGradient: {
      evidence: artifact(forceGap.evidence),
      gapCoordinates: arrayRef(forceGap.gapCoordinates),
      integratedForce: arrayRef(forceGap.integratedForce),
      forceGradient: arrayRef(forceGap.forceGradient),
      localPressureFields: arrayRef(forceGap.localPressureFields),
      sampleCount: finite(forceGap.sampleCount),
      minimumGapM: finite(forceGap.minimumGapM),
      maximumGapM: finite(forceGap.maximumGapM),
      gradientDerivedFromFiniteGeometryField: bool(
        forceGap.gradientDerivedFromFiniteGeometryField,
      ),
    },
    uncertainty: {
      evidence: artifact(uncertainty.evidence),
      covariance: arrayRef(uncertainty.covariance),
      confidenceLevel: finite(uncertainty.confidenceLevel),
      components: (Array.isArray(uncertainty.components)
        ? uncertainty.components
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          component: enumValue(
            item.component,
            CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS,
          ),
          model: artifact(item.model),
          samples: arrayRef(item.samples),
          contributionRelative95: finite(item.contributionRelative95),
        };
      }),
      combinedRelative95: finite(uncertainty.combinedRelative95),
      maximumAllowedRelative95: finite(uncertainty.maximumAllowedRelative95),
    },
    crossChecks: {
      analyticLimit: {
        evidence: artifact(analytic.evidence),
        limitId: enumValue(analytic.limitId, [
          "large_separation",
          "parallel_plate_asymptote",
        ] as const),
        residualRelative: finite(analytic.residualRelative),
        absoluteUncertainty95: finite(analytic.absoluteUncertainty95),
        toleranceRelative: finite(analytic.toleranceRelative),
      },
      independentSolver: {
        implementationId: text(independent.implementationId),
        solverId: text(independent.solverId),
        solver: artifact(independent.solver),
        environment: artifact(independent.environment),
        output: arrayRef(independent.output),
        relativeDifference: finite(independent.relativeDifference),
        absoluteUncertainty95: finite(independent.absoluteUncertainty95),
        toleranceRelative: finite(independent.toleranceRelative),
      },
    },
    authority: {
      primaryAuthority:
        authority.primaryAuthority ===
        "finite_temperature_finite_geometry_maxwell_stress"
          ? "finite_temperature_finite_geometry_maxwell_stress"
          : null,
      idealParallelPlateUsedAsAuthority: bool(
        authority.idealParallelPlateUsedAsAuthority,
      ),
      idealParallelPlateRole: enumValue(authority.idealParallelPlateRole, [
        "analytic_limit_crosscheck_only",
        "not_used",
      ] as const),
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
            .filter((item): item is string => item != null)
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

const draft = (checkId: CasimirFiniteGeometryCheckId): CheckDraft => ({
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
  value: CasimirFiniteGeometryArtifactRefV1,
  id: string,
  check: CheckDraft,
): void => {
  requireText(value.path, `${id}_path`, check);
  requireHash(value.sha256, `${id}_sha256`, check);
};

const requireArray = (
  value: CasimirFiniteGeometryArrayRefV1,
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
  const check = draft("finite_temperature_lifshitz_terms_computed");
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
  return { missing: unique(check.missing), failures: unique(check.failures) };
};

const addCommon = (
  check: CheckDraft,
  common: { missing: string[]; failures: string[] },
): void => {
  check.missing.push(...common.missing);
  check.failures.push(...common.failures);
};

const deriveChecks = (value: PrimitiveEvidence) => {
  const common = commonIntegrity(value);

  const lifshitz = draft("finite_temperature_lifshitz_terms_computed");
  addCommon(lifshitz, common);
  if (value.thermodynamics.formulation == null)
    lifshitz.missing.push("finite_temperature_lifshitz_formulation_missing");
  requirePositive(value.thermodynamics.temperatureK, "temperature_k", lifshitz);
  requirePositive(value.thermodynamics.targetGapM, "target_gap_m", lifshitz);
  requireArtifact(
    value.thermodynamics.lifshitzKernel,
    "lifshitz_kernel",
    lifshitz,
  );
  if (value.thermodynamics.zeroFrequencyPrescription == null)
    lifshitz.missing.push("zero_frequency_prescription_missing");
  requirePositive(
    value.thermodynamics.matsubaraTermCount,
    "matsubara_term_count",
    lifshitz,
  );
  if (
    value.thermodynamics.matsubaraTermCount != null &&
    (!Number.isSafeInteger(value.thermodynamics.matsubaraTermCount) ||
      value.thermodynamics.matsubaraTermCount <
        CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.matsubaraTermCount)
  )
    lifshitz.failures.push("matsubara_term_count_below_frozen_minimum");
  requireArray(
    value.thermodynamics.matsubaraFrequencies,
    "matsubara_frequencies",
    lifshitz,
    value.thermodynamics.matsubaraTermCount,
    ["angular_frequency"],
  );
  requireArray(
    value.thermodynamics.matsubaraTermContributions,
    "matsubara_term_contributions",
    lifshitz,
    value.thermodynamics.matsubaraTermCount,
    ["force_contribution"],
  );
  requireArray(
    value.thermodynamics.temperatureSweep,
    "temperature_sweep",
    lifshitz,
    null,
    ["temperature", "integrated_force"],
  );
  if (
    value.thermodynamics.temperatureSweep.shape.length > 0 &&
    value.thermodynamics.temperatureSweep.shape[0] <
      CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.temperatureSweepSamples
  )
    lifshitz.failures.push("temperature_sweep_below_frozen_minimum");
  if (
    value.thermodynamics.temperatureSweep.shape.length > 0 &&
    value.thermodynamics.temperatureSweep.shape.at(-1) !== 2
  )
    lifshitz.failures.push("temperature_sweep_shape_not_two_column");
  requireNonnegative(
    value.thermodynamics.truncationRemainderRelative,
    "matsubara_truncation_remainder",
    lifshitz,
  );
  requirePositive(
    value.thermodynamics.truncationToleranceRelative,
    "matsubara_truncation_tolerance",
    lifshitz,
  );
  if (
    value.thermodynamics.truncationRemainderRelative != null &&
    value.thermodynamics.truncationToleranceRelative != null
  ) {
    lifshitz.metricValue = value.thermodynamics.truncationRemainderRelative;
    lifshitz.tolerance = value.thermodynamics.truncationToleranceRelative;
    lifshitz.unit = "relative_remainder";
    if (lifshitz.metricValue > lifshitz.tolerance)
      lifshitz.failures.push("matsubara_truncation_not_converged");
  }

  const finiteGeometry = draft("finite_geometry_maxwell_stress_field_computed");
  addCommon(finiteGeometry, common);
  if (value.finiteGeometry.authorityModel == null)
    finiteGeometry.missing.push("finite_geometry_authority_model_missing");
  for (const [id, ref] of [
    ["cad_model", value.finiteGeometry.cadModel],
    ["finite_geometry_mesh", value.finiteGeometry.mesh],
    ["material_map", value.finiteGeometry.materialMap],
    ["boundary_conditions", value.finiteGeometry.boundaryConditions],
    ["integration_surface", value.finiteGeometry.integrationSurface],
  ] as const)
    requireArtifact(ref, id, finiteGeometry);
  for (const [id, included] of [
    ["support_anchors", value.finiteGeometry.supportAnchorsIncluded],
    ["pocket", value.finiteGeometry.pocketIncluded],
    ["rim", value.finiteGeometry.rimIncluded],
    ["support_lattice", value.finiteGeometry.supportLatticeIncluded],
  ] as const) {
    if (included == null)
      finiteGeometry.missing.push(`${id}_inclusion_missing`);
    else if (!included)
      finiteGeometry.failures.push(`${id}_excluded_from_geometry`);
  }
  requirePositive(
    value.finiteGeometry.cellCount,
    "mesh_cell_count",
    finiteGeometry,
  );
  requirePositive(
    value.finiteGeometry.sampleCount,
    "field_sample_count",
    finiteGeometry,
  );
  if (
    value.finiteGeometry.cellCount != null &&
    (!Number.isSafeInteger(value.finiteGeometry.cellCount) ||
      value.finiteGeometry.cellCount <
        CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.finiteGeometryCells)
  )
    finiteGeometry.failures.push("mesh_cell_count_below_frozen_minimum");
  if (
    value.finiteGeometry.sampleCount != null &&
    (!Number.isSafeInteger(value.finiteGeometry.sampleCount) ||
      value.finiteGeometry.sampleCount <
        CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.finiteGeometrySamples)
  )
    finiteGeometry.failures.push("field_sample_count_below_frozen_minimum");
  for (const [id, ref, components] of [
    [
      "electric_field",
      value.finiteGeometry.electricField,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    ],
    [
      "magnetic_field",
      value.finiteGeometry.magneticField,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    ],
    [
      "maxwell_stress_tensor",
      value.finiteGeometry.maxwellStressTensor,
      MAXWELL_STRESS_COMPONENT_ORDER,
    ],
    [
      "surface_normals",
      value.finiteGeometry.surfaceNormals,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    ],
    [
      "traction_field",
      value.finiteGeometry.tractionField,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    ],
    ["pressure_field", value.finiteGeometry.pressureField, ["pressure"]],
  ] as const)
    requireArray(
      ref,
      id,
      finiteGeometry,
      value.finiteGeometry.sampleCount,
      components,
    );
  requireArray(
    value.finiteGeometry.integratedForceVector,
    "integrated_force_vector",
    finiteGeometry,
    null,
    CARTESIAN_VECTOR_COMPONENT_ORDER,
  );
  const stressShape = value.finiteGeometry.maxwellStressTensor.shape;
  if (
    stressShape.length > 0 &&
    (stressShape.length < 3 ||
      stressShape.at(-1) !== 3 ||
      stressShape.at(-2) !== 3)
  )
    finiteGeometry.failures.push("maxwell_stress_tensor_shape_not_3x3");
  for (const [id, ref] of [
    ["electric_field", value.finiteGeometry.electricField],
    ["magnetic_field", value.finiteGeometry.magneticField],
    ["surface_normals", value.finiteGeometry.surfaceNormals],
    ["traction_field", value.finiteGeometry.tractionField],
  ] as const) {
    if (ref.shape.length > 0 && ref.shape.at(-1) !== 3)
      finiteGeometry.failures.push(`${id}_shape_not_cartesian_vector`);
  }
  if (
    value.finiteGeometry.integratedForceVector.shape.length > 0 &&
    (value.finiteGeometry.integratedForceVector.shape.length !== 1 ||
      value.finiteGeometry.integratedForceVector.shape[0] !== 3)
  )
    finiteGeometry.failures.push("integrated_force_vector_shape_not_three");

  const dielectric = draft("real_dielectric_response_data_pinned");
  addCommon(dielectric, common);
  if (value.dielectricResponse.datasets.length < 2)
    dielectric.missing.push("two_surface_dielectric_datasets_required");
  const materialIds = new Set<string>();
  value.dielectricResponse.datasets.forEach((dataset, index) => {
    requireText(
      dataset.materialId,
      `dielectric_${index}_material_id`,
      dielectric,
    );
    requireText(
      dataset.specimenId,
      `dielectric_${index}_specimen_id`,
      dielectric,
    );
    if (dataset.materialId != null) {
      if (materialIds.has(dataset.materialId))
        dielectric.failures.push(`dielectric_${index}_material_duplicate`);
      materialIds.add(dataset.materialId);
    }
    requireArtifact(
      dataset.sourceReceipt,
      `dielectric_${index}_source_receipt`,
      dielectric,
    );
    requireArray(
      dataset.frequencyHz,
      `dielectric_${index}_frequency`,
      dielectric,
      null,
      ["frequency"],
    );
    requireArray(
      dataset.epsilonReal,
      `dielectric_${index}_epsilon_real`,
      dielectric,
      dataset.frequencyHz.shape[0] ?? null,
      ["epsilon_real"],
    );
    requireArray(
      dataset.epsilonImaginary,
      `dielectric_${index}_epsilon_imaginary`,
      dielectric,
      dataset.frequencyHz.shape[0] ?? null,
      ["epsilon_imaginary"],
    );
    if (
      dataset.frequencyHz.shape.length > 0 &&
      dataset.frequencyHz.shape[0] <
        CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.dielectricFrequencySamplesPerSurface
    )
      dielectric.failures.push(
        `dielectric_${index}_frequency_samples_below_frozen_minimum`,
      );
    requirePositive(
      dataset.temperatureK,
      `dielectric_${index}_temperature`,
      dielectric,
    );
    requirePositive(
      dataset.frequencyMinimumHz,
      `dielectric_${index}_frequency_minimum`,
      dielectric,
    );
    requirePositive(
      dataset.frequencyMaximumHz,
      `dielectric_${index}_frequency_maximum`,
      dielectric,
    );
    if (
      dataset.frequencyMinimumHz != null &&
      dataset.frequencyMaximumHz != null &&
      dataset.frequencyMaximumHz <= dataset.frequencyMinimumHz
    )
      dielectric.failures.push(`dielectric_${index}_frequency_range_invalid`);
    requireNonnegative(
      dataset.measurementUncertaintyRelative95,
      `dielectric_${index}_measurement_uncertainty`,
      dielectric,
    );
  });

  const sensitivity = draft("kramers_kronig_drude_plasma_sensitivity_bounded");
  addCommon(sensitivity, common);
  requireArtifact(
    value.dielectricResponse.kramersKronig.evidence,
    "kramers_kronig_evidence",
    sensitivity,
  );
  requireArray(
    value.dielectricResponse.kramersKronig.residuals,
    "kramers_kronig_residuals",
    sensitivity,
    null,
    ["relative_residual"],
  );
  if (
    value.dielectricResponse.kramersKronig.residuals.shape.length > 0 &&
    value.dielectricResponse.kramersKronig.residuals.shape[0] <
      CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.dielectricFrequencySamplesPerSurface
  )
    sensitivity.failures.push("kramers_kronig_samples_below_frozen_minimum");
  const kkValues = [
    value.dielectricResponse.kramersKronig.maximumResidualRelative,
    value.dielectricResponse.kramersKronig.absoluteUncertainty95,
    value.dielectricResponse.kramersKronig.toleranceRelative,
  ];
  if (kkValues.some((entry) => entry == null))
    sensitivity.missing.push("kramers_kronig_bound_missing");
  else {
    const [residual, uncertainty95, tolerance] = kkValues as number[];
    if (residual < 0 || uncertainty95 < 0 || tolerance <= 0)
      sensitivity.failures.push("kramers_kronig_bound_invalid");
    else if (residual + uncertainty95 > tolerance)
      sensitivity.failures.push("kramers_kronig_residual_exceeds_tolerance");
  }
  for (const model of CASIMIR_DIELECTRIC_SENSITIVITY_MODELS) {
    const matches = value.dielectricResponse.sensitivity.filter(
      (entry) => entry.model === model,
    );
    if (matches.length === 0)
      sensitivity.missing.push(`${model}_sensitivity_missing`);
    else if (matches.length > 1)
      sensitivity.failures.push(`${model}_sensitivity_duplicate`);
  }
  value.dielectricResponse.sensitivity.forEach((entry, index) => {
    requireArtifact(
      entry.constitutiveModel,
      `sensitivity_${index}_model`,
      sensitivity,
    );
    requireArray(
      entry.forceField,
      `sensitivity_${index}_force_field`,
      sensitivity,
      value.finiteGeometry.sampleCount,
      CARTESIAN_VECTOR_COMPONENT_ORDER,
    );
    requireArray(
      entry.pressureField,
      `sensitivity_${index}_pressure_field`,
      sensitivity,
      value.finiteGeometry.sampleCount,
      ["pressure"],
    );
    if (
      entry.forceField.shape.length > 0 &&
      entry.forceField.shape.at(-1) !== 3
    )
      sensitivity.failures.push(
        `sensitivity_${index}_force_field_shape_not_cartesian_vector`,
      );
    if (entry.integratedForceN == null)
      sensitivity.missing.push(`sensitivity_${index}_integrated_force_missing`);
    requireNonnegative(
      entry.absoluteUncertainty95N,
      `sensitivity_${index}_force_uncertainty`,
      sensitivity,
    );
  });
  const spreadValues = [
    value.dielectricResponse.maximumModelSpreadRelative,
    value.dielectricResponse.modelSpreadUncertainty95,
    value.dielectricResponse.modelSpreadToleranceRelative,
  ];
  if (spreadValues.some((entry) => entry == null))
    sensitivity.missing.push("dielectric_model_spread_bound_missing");
  else {
    const [spread, uncertainty95, tolerance] = spreadValues as number[];
    sensitivity.metricValue = spread + uncertainty95;
    sensitivity.tolerance = tolerance;
    sensitivity.unit = "relative_force_spread_upper95";
    if (spread < 0 || uncertainty95 < 0 || tolerance <= 0)
      sensitivity.failures.push("dielectric_model_spread_bound_invalid");
    else if (sensitivity.metricValue > tolerance)
      sensitivity.failures.push("dielectric_model_spread_exceeds_tolerance");
  }

  const nonlocal = draft("nonlocal_response_at_target_gap_dispositioned");
  addCommon(nonlocal, common);
  if (value.dielectricResponse.nonlocalResponse.disposition == null)
    nonlocal.missing.push("nonlocal_disposition_missing");
  else if (
    value.dielectricResponse.nonlocalResponse.disposition === "out_of_domain"
  )
    nonlocal.failures.push("target_gap_outside_nonlocal_model_domain");
  requireArtifact(
    value.dielectricResponse.nonlocalResponse.evidence,
    "nonlocal_response_evidence",
    nonlocal,
  );
  requirePositive(
    value.dielectricResponse.nonlocalResponse.targetGapM,
    "nonlocal_target_gap",
    nonlocal,
  );
  if (
    value.dielectricResponse.nonlocalResponse.targetGapM != null &&
    value.thermodynamics.targetGapM != null &&
    value.dielectricResponse.nonlocalResponse.targetGapM !==
      value.thermodynamics.targetGapM
  )
    nonlocal.failures.push("nonlocal_target_gap_mismatch");
  const nonlocalValues = [
    value.dielectricResponse.nonlocalResponse.correctionRelative,
    value.dielectricResponse.nonlocalResponse.absoluteUncertainty95,
    value.dielectricResponse.nonlocalResponse.toleranceRelative,
  ];
  if (nonlocalValues.some((entry) => entry == null))
    nonlocal.missing.push("nonlocal_correction_bound_missing");
  else {
    const [correction, uncertainty95, tolerance] = nonlocalValues as number[];
    nonlocal.metricValue = Math.abs(correction) + uncertainty95;
    nonlocal.tolerance = tolerance;
    nonlocal.unit = "relative_nonlocal_correction_upper95";
    if (uncertainty95 < 0 || tolerance <= 0)
      nonlocal.failures.push("nonlocal_correction_bound_invalid");
    else if (nonlocal.metricValue > tolerance)
      nonlocal.failures.push("nonlocal_correction_exceeds_tolerance");
  }

  const geometryPinned = draft("cad_mesh_support_anchor_geometry_pinned");
  addCommon(geometryPinned, common);
  for (const [id, ref] of [
    ["cad_model", value.finiteGeometry.cadModel],
    ["finite_geometry_mesh", value.finiteGeometry.mesh],
    ["material_map", value.finiteGeometry.materialMap],
    ["boundary_conditions", value.finiteGeometry.boundaryConditions],
    ["integration_surface", value.finiteGeometry.integrationSurface],
  ] as const)
    requireArtifact(ref, id, geometryPinned);
  if (value.finiteGeometry.supportAnchorsIncluded == null)
    geometryPinned.missing.push("support_anchor_disposition_missing");
  else if (!value.finiteGeometry.supportAnchorsIncluded)
    geometryPinned.failures.push("support_anchors_not_in_cad_mesh");

  const convergence = draft(
    "matsubara_frequency_and_mesh_convergence_observed",
  );
  addCommon(convergence, common);
  requireArtifact(
    value.convergence.evidence,
    "convergence_evidence",
    convergence,
  );
  requirePositive(
    value.convergence.minimumAcceptedOrder,
    "minimum_accepted_order",
    convergence,
  );
  if (
    value.convergence.minimumAcceptedOrder != null &&
    value.convergence.minimumAcceptedOrder !==
      CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.minimumObservedOrderLower95
  )
    convergence.failures.push("minimum_accepted_order_not_frozen_policy");
  requireNonnegative(
    value.convergence.orderUncertainty95,
    "order_uncertainty_95",
    convergence,
  );
  requireArray(
    value.convergence.matsubaraResiduals,
    "matsubara_convergence_residuals",
    convergence,
    value.convergence.matsubaraSeries.length || null,
    ["force_residual"],
  );
  requireArray(
    value.convergence.meshResiduals,
    "mesh_convergence_residuals",
    convergence,
    value.convergence.meshSeries.length || null,
    ["force_residual"],
  );
  if (value.convergence.matsubaraSeries.length === 0)
    convergence.missing.push("three_matsubara_convergence_levels_required");
  else if (
    value.convergence.matsubaraSeries.length <
    CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.matsubaraConvergenceLevels
  )
    convergence.failures.push("matsubara_convergence_levels_below_minimum");
  if (value.convergence.meshSeries.length === 0)
    convergence.missing.push("three_mesh_convergence_levels_required");
  else if (
    value.convergence.meshSeries.length <
    CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.meshConvergenceLevels
  )
    convergence.failures.push("mesh_convergence_levels_below_minimum");
  value.convergence.matsubaraSeries.forEach((entry, index, entries) => {
    requirePositive(
      entry.termCount,
      `matsubara_level_${index}_term_count`,
      convergence,
    );
    if (entry.integratedForceN == null)
      convergence.missing.push(`matsubara_level_${index}_force_missing`);
    requireNonnegative(
      entry.absoluteUncertainty95N,
      `matsubara_level_${index}_uncertainty`,
      convergence,
    );
    if (
      index > 0 &&
      entry.termCount != null &&
      entries[index - 1].termCount != null &&
      entry.termCount! <= entries[index - 1].termCount!
    )
      convergence.failures.push("matsubara_term_counts_not_increasing");
  });
  value.convergence.meshSeries.forEach((entry, index, entries) => {
    requirePositive(
      entry.maximumElementSizeM,
      `mesh_level_${index}_element_size`,
      convergence,
    );
    requirePositive(
      entry.cellCount,
      `mesh_level_${index}_cell_count`,
      convergence,
    );
    if (entry.integratedForceN == null)
      convergence.missing.push(`mesh_level_${index}_force_missing`);
    requireNonnegative(
      entry.absoluteUncertainty95N,
      `mesh_level_${index}_uncertainty`,
      convergence,
    );
    if (
      index > 0 &&
      entry.maximumElementSizeM != null &&
      entries[index - 1].maximumElementSizeM != null &&
      entry.maximumElementSizeM! >= entries[index - 1].maximumElementSizeM!
    )
      convergence.failures.push("mesh_element_sizes_not_decreasing");
    if (
      index > 0 &&
      entry.cellCount != null &&
      entries[index - 1].cellCount != null &&
      entry.cellCount! <= entries[index - 1].cellCount!
    )
      convergence.failures.push("mesh_cell_counts_not_increasing");
  });
  const lowerOrders = [
    value.convergence.matsubaraObservedOrder,
    value.convergence.meshObservedOrder,
  ].map((order) =>
    order == null || value.convergence.orderUncertainty95 == null
      ? null
      : order - value.convergence.orderUncertainty95,
  );
  if (lowerOrders.some((entry) => entry == null))
    convergence.missing.push("observed_convergence_orders_missing");
  else {
    convergence.metricValue = Math.min(...(lowerOrders as number[]));
    convergence.tolerance = value.convergence.minimumAcceptedOrder;
    convergence.unit = "observed_order";
    if (
      value.convergence.minimumAcceptedOrder != null &&
      convergence.metricValue < value.convergence.minimumAcceptedOrder
    )
      convergence.failures.push("convergence_order_below_frozen_minimum");
  }

  const forceGap = draft("force_gap_and_gradient_fields_published");
  addCommon(forceGap, common);
  requireArtifact(
    value.forceGapGradient.evidence,
    "force_gap_evidence",
    forceGap,
  );
  requirePositive(
    value.forceGapGradient.sampleCount,
    "force_gap_sample_count",
    forceGap,
  );
  if (
    value.forceGapGradient.sampleCount != null &&
    (!Number.isSafeInteger(value.forceGapGradient.sampleCount) ||
      value.forceGapGradient.sampleCount <
        CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.forceGapSamples)
  )
    forceGap.failures.push("force_gap_sample_count_insufficient");
  for (const [id, ref, components] of [
    ["gap_coordinates", value.forceGapGradient.gapCoordinates, ["gap"]],
    ["integrated_force", value.forceGapGradient.integratedForce, ["force"]],
    ["force_gradient", value.forceGapGradient.forceGradient, ["gradient"]],
    [
      "local_pressure_fields",
      value.forceGapGradient.localPressureFields,
      ["pressure"],
    ],
  ] as const)
    requireArray(
      ref,
      id,
      forceGap,
      value.forceGapGradient.sampleCount,
      components,
    );
  requirePositive(value.forceGapGradient.minimumGapM, "minimum_gap", forceGap);
  requirePositive(value.forceGapGradient.maximumGapM, "maximum_gap", forceGap);
  if (
    value.forceGapGradient.minimumGapM != null &&
    value.forceGapGradient.maximumGapM != null &&
    value.forceGapGradient.maximumGapM <= value.forceGapGradient.minimumGapM
  )
    forceGap.failures.push("force_gap_range_invalid");
  if (value.forceGapGradient.gradientDerivedFromFiniteGeometryField == null)
    forceGap.missing.push("force_gradient_derivation_missing");
  else if (!value.forceGapGradient.gradientDerivedFromFiniteGeometryField)
    forceGap.failures.push(
      "force_gradient_not_derived_from_finite_geometry_field",
    );

  const uncertainty = draft("roughness_patch_temperature_uncertainty_bounded");
  addCommon(uncertainty, common);
  requireArtifact(
    value.uncertainty.evidence,
    "uncertainty_evidence",
    uncertainty,
  );
  requireArray(
    value.uncertainty.covariance,
    "uncertainty_covariance",
    uncertainty,
    null,
    CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS,
  );
  if (
    value.uncertainty.covariance.shape.length > 0 &&
    (value.uncertainty.covariance.shape.length !== 2 ||
      value.uncertainty.covariance.shape[0] !==
        CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS.length ||
      value.uncertainty.covariance.shape[1] !==
        CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS.length)
  )
    uncertainty.failures.push("uncertainty_covariance_shape_invalid");
  if (value.uncertainty.confidenceLevel == null)
    uncertainty.missing.push("uncertainty_confidence_level_missing");
  else if (
    value.uncertainty.confidenceLevel < 0.95 ||
    value.uncertainty.confidenceLevel >= 1
  )
    uncertainty.failures.push("uncertainty_confidence_level_invalid");
  for (const component of CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS) {
    const matches = value.uncertainty.components.filter(
      (entry) => entry.component === component,
    );
    if (matches.length === 0)
      uncertainty.missing.push(`${component}_uncertainty_missing`);
    else if (matches.length > 1)
      uncertainty.failures.push(`${component}_uncertainty_duplicate`);
  }
  value.uncertainty.components.forEach((entry, index) => {
    requireArtifact(entry.model, `uncertainty_${index}_model`, uncertainty);
    requireArray(
      entry.samples,
      `uncertainty_${index}_samples`,
      uncertainty,
      null,
      [entry.component ?? "unknown"],
    );
    if (
      entry.samples.shape.length > 0 &&
      entry.samples.shape[0] <
        CASIMIR_FINITE_GEOMETRY_DIAGNOSTIC_MINIMA.uncertaintySamplesPerComponent
    )
      uncertainty.failures.push(
        `uncertainty_${index}_samples_below_frozen_minimum`,
      );
    requireNonnegative(
      entry.contributionRelative95,
      `uncertainty_${index}_contribution`,
      uncertainty,
    );
  });
  requireNonnegative(
    value.uncertainty.combinedRelative95,
    "combined_uncertainty_95",
    uncertainty,
  );
  requirePositive(
    value.uncertainty.maximumAllowedRelative95,
    "maximum_allowed_uncertainty_95",
    uncertainty,
  );
  if (
    value.uncertainty.combinedRelative95 != null &&
    value.uncertainty.maximumAllowedRelative95 != null
  ) {
    uncertainty.metricValue = value.uncertainty.combinedRelative95;
    uncertainty.tolerance = value.uncertainty.maximumAllowedRelative95;
    uncertainty.unit = "relative_fraction";
    if (uncertainty.metricValue > uncertainty.tolerance)
      uncertainty.failures.push("combined_uncertainty_exceeds_tolerance");
  }

  const crossCheck = draft(
    "analytic_limits_and_independent_solver_crosscheck_pass",
  );
  addCommon(crossCheck, common);
  requireArtifact(
    value.crossChecks.analyticLimit.evidence,
    "analytic_limit_evidence",
    crossCheck,
  );
  if (value.crossChecks.analyticLimit.limitId == null)
    crossCheck.missing.push("analytic_limit_id_missing");
  const analyticValues = [
    value.crossChecks.analyticLimit.residualRelative,
    value.crossChecks.analyticLimit.absoluteUncertainty95,
    value.crossChecks.analyticLimit.toleranceRelative,
  ];
  if (analyticValues.some((entry) => entry == null))
    crossCheck.missing.push("analytic_limit_bound_missing");
  else {
    const [residual, uncertainty95, tolerance] = analyticValues as number[];
    if (residual < 0 || uncertainty95 < 0 || tolerance <= 0)
      crossCheck.failures.push("analytic_limit_bound_invalid");
    else if (residual + uncertainty95 > tolerance)
      crossCheck.failures.push("analytic_limit_crosscheck_failed");
  }
  requireText(
    value.crossChecks.independentSolver.implementationId,
    "independent_implementation_id",
    crossCheck,
  );
  requireText(
    value.crossChecks.independentSolver.solverId,
    "independent_solver_id",
    crossCheck,
  );
  requireArtifact(
    value.crossChecks.independentSolver.solver,
    "independent_solver",
    crossCheck,
  );
  requireArtifact(
    value.crossChecks.independentSolver.environment,
    "independent_environment",
    crossCheck,
  );
  requireArray(
    value.crossChecks.independentSolver.output,
    "independent_output",
    crossCheck,
    value.finiteGeometry.sampleCount,
    MAXWELL_STRESS_COMPONENT_ORDER,
  );
  const independentOutputShape =
    value.crossChecks.independentSolver.output.shape;
  if (
    independentOutputShape.length > 0 &&
    (independentOutputShape.length < 3 ||
      independentOutputShape.at(-2) !== 3 ||
      independentOutputShape.at(-1) !== 3)
  )
    crossCheck.failures.push("independent_output_shape_not_3x3");
  if (
    value.crossChecks.independentSolver.implementationId != null &&
    value.crossChecks.independentSolver.implementationId ===
      value.provenance.implementationId
  )
    crossCheck.failures.push("independent_implementation_not_independent");
  if (
    value.crossChecks.independentSolver.solverId != null &&
    value.crossChecks.independentSolver.solverId === value.provenance.solverId
  )
    crossCheck.failures.push("independent_solver_not_independent");
  const independentValues = [
    value.crossChecks.independentSolver.relativeDifference,
    value.crossChecks.independentSolver.absoluteUncertainty95,
    value.crossChecks.independentSolver.toleranceRelative,
  ];
  if (independentValues.some((entry) => entry == null))
    crossCheck.missing.push("independent_crosscheck_bound_missing");
  else {
    const [difference, uncertainty95, tolerance] =
      independentValues as number[];
    crossCheck.metricValue = difference + uncertainty95;
    crossCheck.tolerance = tolerance;
    crossCheck.unit = "relative_L_inf";
    if (difference < 0 || uncertainty95 < 0 || tolerance <= 0)
      crossCheck.failures.push("independent_crosscheck_bound_invalid");
    else if (crossCheck.metricValue > tolerance)
      crossCheck.failures.push("independent_solver_crosscheck_failed");
  }

  const authority = draft("ideal_parallel_plate_scalar_not_used_as_authority");
  addCommon(authority, common);
  if (value.authority.primaryAuthority == null)
    authority.missing.push("primary_authority_missing");
  if (value.authority.idealParallelPlateUsedAsAuthority == null)
    authority.missing.push(
      "ideal_parallel_plate_authority_disposition_missing",
    );
  else if (value.authority.idealParallelPlateUsedAsAuthority)
    authority.failures.push("ideal_parallel_plate_scalar_used_as_authority");
  if (value.authority.idealParallelPlateRole == null)
    authority.missing.push("ideal_parallel_plate_role_missing");

  return [
    lifshitz,
    finiteGeometry,
    dielectric,
    sensitivity,
    nonlocal,
    geometryPinned,
    convergence,
    forceGap,
    uncertainty,
    crossCheck,
    authority,
  ].map((check) => {
    const blockers = unique([...check.failures, ...check.missing]);
    const status: CasimirFiniteGeometryStatus =
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

export const buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress = (
  input: BuildCasimirFiniteTemperatureFiniteGeometryMaxwellStressInput = {},
): CasimirFiniteTemperatureFiniteGeometryMaxwellStressV1 => {
  const primitive = normalizePrimitive(input);
  const checks = deriveChecks(primitive);
  const status: CasimirFiniteGeometryStatus = checks.some(
    (check) => check.status === "fail",
  )
    ? "fail"
    : checks.some((check) => check.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    contractVersion:
      CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CONTRACT_VERSION,
    ...primitive,
    checks,
    status,
    finiteTemperatureFiniteGeometryMaxwellStressReady: status === "pass",
    blockers: checks.flatMap((check) =>
      check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
    ),
    claimBoundary: {
      diagnosticOnly: true,
      apparatusTheoryEvidenceOnly: true,
      idealScalarCannotEstablishMechanism: true,
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

export const isCasimirFiniteTemperatureFiniteGeometryMaxwellStress = (
  value: unknown,
): value is CasimirFiniteTemperatureFiniteGeometryMaxwellStressV1 => {
  if (
    !isRecord(value) ||
    !isJsonValue(value) ||
    value.contractVersion !==
      CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(
    value as unknown as BuildCasimirFiniteTemperatureFiniteGeometryMaxwellStressInput,
  );
  return (
    JSON.stringify(canonicalize(value)) ===
    JSON.stringify(canonicalize(rebuilt))
  );
};
