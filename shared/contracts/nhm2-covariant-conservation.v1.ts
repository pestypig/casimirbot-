import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";

export const NHM2_COVARIANT_CONSERVATION_CONTRACT_VERSION =
  "nhm2_covariant_conservation/v1" as const;

export const NHM2_COVARIANT_CONSERVATION_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.covariant_conservation,
] as const;

export const NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS = [
  "D0",
  "D1",
  "D2",
  "D3",
] as const;

export const NHM2_COVARIANT_CONSERVATION_SOURCE_TERM_IDS = [
  "spacetime_switching",
  "supports",
  "controls",
  "boundary_flux",
] as const;

export const NHM2_COVARIANT_CONSERVATION_UNCERTAINTY_QUANTITIES = [
  "divergence_D0",
  "divergence_D1",
  "divergence_D2",
  "divergence_D3",
  "discrete_global_balance",
  "cycle_energy_ledger",
  "spatial_convergence_order",
  "temporal_convergence_order",
] as const;

export type Nhm2CovariantConservationCheckId =
  (typeof NHM2_COVARIANT_CONSERVATION_CHECK_IDS)[number];
export type Nhm2CovariantConservationDivergenceComponent =
  (typeof NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS)[number];
export type Nhm2CovariantConservationSourceTermId =
  (typeof NHM2_COVARIANT_CONSERVATION_SOURCE_TERM_IDS)[number];
export type Nhm2CovariantConservationUncertaintyQuantity =
  (typeof NHM2_COVARIANT_CONSERVATION_UNCERTAINTY_QUANTITIES)[number];
export type Nhm2CovariantConservationStatus = "pass" | "blocked" | "fail";

export type Nhm2CovariantConservationArtifactRefV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2CovariantConservationArrayRefV1 =
  Nhm2CovariantConservationArtifactRefV1 & {
    dtype: "float64" | null;
    shape: number[];
    unit: string | null;
  };

export type Nhm2CovariantConservationBindingV1 = {
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

export type Nhm2CovariantConservationV1 = {
  contractVersion: typeof NHM2_COVARIANT_CONSERVATION_CONTRACT_VERSION;
  generatedAt: string | null;
  binding: Nhm2CovariantConservationBindingV1;
  sourceBinding: {
    sourceContractVersion: "nhm2_full_apparatus_source_tensor/v1" | null;
    sourceEvidence: Nhm2CovariantConservationArtifactRefV1;
    rawTotalSourceTensor: Nhm2CovariantConservationArtifactRefV1;
    candidateId: string | null;
    candidateManifestSha256: string | null;
    runId: string | null;
    chartId: string | null;
  };
  divergence: {
    derivativeDefinition: Nhm2CovariantConservationArtifactRefV1;
    connectionCoefficients: Nhm2CovariantConservationArrayRefV1;
    volumeMask: Nhm2CovariantConservationArrayRefV1;
    sampleCount: number | null;
    components: Array<{
      component: Nhm2CovariantConservationDivergenceComponent | null;
      residualArray: Nhm2CovariantConservationArrayRefV1;
      maxAbsSI: number | null;
      absoluteUncertainty95SI: number | null;
      toleranceSI: number | null;
    }>;
  };
  sourceTerms: Array<{
    termId: Nhm2CovariantConservationSourceTermId | null;
    constitutiveDefinition: Nhm2CovariantConservationArtifactRefV1;
    includedInDiscreteDivergence: boolean | null;
    sampleCount: number | null;
    components: Array<{
      component: Nhm2CovariantConservationDivergenceComponent | null;
      values: Nhm2CovariantConservationArrayRefV1;
    }>;
  }>;
  discreteGlobalBalance: {
    evidence: Nhm2CovariantConservationArtifactRefV1;
    energyDerivative: Nhm2CovariantConservationArrayRefV1;
    sourcePower: Nhm2CovariantConservationArrayRefV1;
    outwardBoundaryFlux: Nhm2CovariantConservationArrayRefV1;
    sampleCount: number | null;
    energyDerivativeW: number | null;
    sourcePowerW: number | null;
    outwardBoundaryFluxW: number | null;
    absoluteUncertainty95W: number | null;
    normalizationPowerW: number | null;
    toleranceRelative: number | null;
  };
  cycleEnergyLedger: {
    evidence: Nhm2CovariantConservationArtifactRefV1;
    timeSeries: Nhm2CovariantConservationArrayRefV1;
    normalizationEnergyJ: number | null;
    toleranceRelative: number | null;
    samples: Array<{
      timeS: number | null;
      geometryEnergyJ: number | null;
      matterEnergyJ: number | null;
      switchingWorkJ: number | null;
      supportWorkJ: number | null;
      controlWorkJ: number | null;
      outwardBoundaryEnergyJ: number | null;
      absoluteUncertainty95J: number | null;
    }>;
  };
  convergence: {
    evidence: Nhm2CovariantConservationArtifactRefV1;
    minimumAcceptedOrder: number | null;
    orderUncertainty95: number | null;
    spatialResiduals: Nhm2CovariantConservationArrayRefV1;
    temporalResiduals: Nhm2CovariantConservationArrayRefV1;
    spatialSeries: Array<{
      discretizationScaleM: number | null;
      residualRelative: number | null;
      uncertainty95Relative: number | null;
    }>;
    temporalSeries: Array<{
      discretizationScaleS: number | null;
      residualRelative: number | null;
      uncertainty95Relative: number | null;
    }>;
  };
  uncertaintyBudget: {
    evidence: Nhm2CovariantConservationArtifactRefV1;
    confidenceLevel: number | null;
    bounds: Array<{
      quantity: Nhm2CovariantConservationUncertaintyQuantity | null;
      estimate: number | null;
      lower95: number | null;
      upper95: number | null;
      unit: string | null;
      method: Nhm2CovariantConservationArtifactRefV1;
    }>;
  };
  provenance: {
    producerId: string | null;
    producerVersion: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: Nhm2CovariantConservationArtifactRefV1;
    environment: Nhm2CovariantConservationArtifactRefV1;
    invocation: Nhm2CovariantConservationArtifactRefV1;
    inputManifest: Nhm2CovariantConservationArtifactRefV1;
    startedAt: string | null;
    completedAt: string | null;
    runSpecificOutput: boolean | null;
  };
  checks: Array<{
    checkId: Nhm2CovariantConservationCheckId;
    status: Nhm2CovariantConservationStatus;
    pass: boolean;
    metricValue: number | null;
    tolerance: number | null;
    unit: string | null;
    blockers: string[];
  }>;
  status: Nhm2CovariantConservationStatus;
  covariantConservationReady: boolean;
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
  Nhm2CovariantConservationV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "covariantConservationReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2CovariantConservationInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2CovariantConservationCheckId;
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

const artifact = (value: unknown): Nhm2CovariantConservationArtifactRefV1 => {
  const entry = recordOf(value);
  return { path: text(entry.path), sha256: text(entry.sha256) };
};

const arrayRef = (value: unknown): Nhm2CovariantConservationArrayRefV1 => {
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

const divergenceComponent = (
  value: unknown,
): Nhm2CovariantConservationDivergenceComponent | null => {
  const candidate = text(value);
  return NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS.includes(
    candidate as Nhm2CovariantConservationDivergenceComponent,
  )
    ? (candidate as Nhm2CovariantConservationDivergenceComponent)
    : null;
};

const sourceTermId = (
  value: unknown,
): Nhm2CovariantConservationSourceTermId | null => {
  const candidate = text(value);
  return NHM2_COVARIANT_CONSERVATION_SOURCE_TERM_IDS.includes(
    candidate as Nhm2CovariantConservationSourceTermId,
  )
    ? (candidate as Nhm2CovariantConservationSourceTermId)
    : null;
};

const uncertaintyQuantity = (
  value: unknown,
): Nhm2CovariantConservationUncertaintyQuantity | null => {
  const candidate = text(value);
  return NHM2_COVARIANT_CONSERVATION_UNCERTAINTY_QUANTITIES.includes(
    candidate as Nhm2CovariantConservationUncertaintyQuantity,
  )
    ? (candidate as Nhm2CovariantConservationUncertaintyQuantity)
    : null;
};

const normalizePrimitive = (
  input: BuildNhm2CovariantConservationInput,
): PrimitiveEvidence => {
  const root = recordOf(input);
  const binding = recordOf(root.binding);
  const sourceBinding = recordOf(root.sourceBinding);
  const divergence = recordOf(root.divergence);
  const global = recordOf(root.discreteGlobalBalance);
  const ledger = recordOf(root.cycleEnergyLedger);
  const convergence = recordOf(root.convergence);
  const uncertainty = recordOf(root.uncertaintyBudget);
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
    sourceBinding: {
      sourceContractVersion:
        sourceBinding.sourceContractVersion ===
        "nhm2_full_apparatus_source_tensor/v1"
          ? sourceBinding.sourceContractVersion
          : null,
      sourceEvidence: artifact(sourceBinding.sourceEvidence),
      rawTotalSourceTensor: artifact(sourceBinding.rawTotalSourceTensor),
      candidateId: text(sourceBinding.candidateId),
      candidateManifestSha256: text(sourceBinding.candidateManifestSha256),
      runId: text(sourceBinding.runId),
      chartId: text(sourceBinding.chartId),
    },
    divergence: {
      derivativeDefinition: artifact(divergence.derivativeDefinition),
      connectionCoefficients: arrayRef(divergence.connectionCoefficients),
      volumeMask: arrayRef(divergence.volumeMask),
      sampleCount: finite(divergence.sampleCount),
      components: (Array.isArray(divergence.components)
        ? divergence.components
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          component: divergenceComponent(item.component),
          residualArray: arrayRef(item.residualArray),
          maxAbsSI: finite(item.maxAbsSI),
          absoluteUncertainty95SI: finite(item.absoluteUncertainty95SI),
          toleranceSI: finite(item.toleranceSI),
        };
      }),
    },
    sourceTerms: (Array.isArray(root.sourceTerms) ? root.sourceTerms : []).map(
      (value) => {
        const item = recordOf(value);
        return {
          termId: sourceTermId(item.termId),
          constitutiveDefinition: artifact(item.constitutiveDefinition),
          includedInDiscreteDivergence: bool(item.includedInDiscreteDivergence),
          sampleCount: finite(item.sampleCount),
          components: (Array.isArray(item.components)
            ? item.components
            : []
          ).map((componentValue) => {
            const component = recordOf(componentValue);
            return {
              component: divergenceComponent(component.component),
              values: arrayRef(component.values),
            };
          }),
        };
      },
    ),
    discreteGlobalBalance: {
      evidence: artifact(global.evidence),
      energyDerivative: arrayRef(global.energyDerivative),
      sourcePower: arrayRef(global.sourcePower),
      outwardBoundaryFlux: arrayRef(global.outwardBoundaryFlux),
      sampleCount: finite(global.sampleCount),
      energyDerivativeW: finite(global.energyDerivativeW),
      sourcePowerW: finite(global.sourcePowerW),
      outwardBoundaryFluxW: finite(global.outwardBoundaryFluxW),
      absoluteUncertainty95W: finite(global.absoluteUncertainty95W),
      normalizationPowerW: finite(global.normalizationPowerW),
      toleranceRelative: finite(global.toleranceRelative),
    },
    cycleEnergyLedger: {
      evidence: artifact(ledger.evidence),
      timeSeries: arrayRef(ledger.timeSeries),
      normalizationEnergyJ: finite(ledger.normalizationEnergyJ),
      toleranceRelative: finite(ledger.toleranceRelative),
      samples: (Array.isArray(ledger.samples) ? ledger.samples : []).map(
        (value) => {
          const item = recordOf(value);
          return {
            timeS: finite(item.timeS),
            geometryEnergyJ: finite(item.geometryEnergyJ),
            matterEnergyJ: finite(item.matterEnergyJ),
            switchingWorkJ: finite(item.switchingWorkJ),
            supportWorkJ: finite(item.supportWorkJ),
            controlWorkJ: finite(item.controlWorkJ),
            outwardBoundaryEnergyJ: finite(item.outwardBoundaryEnergyJ),
            absoluteUncertainty95J: finite(item.absoluteUncertainty95J),
          };
        },
      ),
    },
    convergence: {
      evidence: artifact(convergence.evidence),
      minimumAcceptedOrder: finite(convergence.minimumAcceptedOrder),
      orderUncertainty95: finite(convergence.orderUncertainty95),
      spatialResiduals: arrayRef(convergence.spatialResiduals),
      temporalResiduals: arrayRef(convergence.temporalResiduals),
      spatialSeries: (Array.isArray(convergence.spatialSeries)
        ? convergence.spatialSeries
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          discretizationScaleM: finite(item.discretizationScaleM),
          residualRelative: finite(item.residualRelative),
          uncertainty95Relative: finite(item.uncertainty95Relative),
        };
      }),
      temporalSeries: (Array.isArray(convergence.temporalSeries)
        ? convergence.temporalSeries
        : []
      ).map((value) => {
        const item = recordOf(value);
        return {
          discretizationScaleS: finite(item.discretizationScaleS),
          residualRelative: finite(item.residualRelative),
          uncertainty95Relative: finite(item.uncertainty95Relative),
        };
      }),
    },
    uncertaintyBudget: {
      evidence: artifact(uncertainty.evidence),
      confidenceLevel: finite(uncertainty.confidenceLevel),
      bounds: (Array.isArray(uncertainty.bounds) ? uncertainty.bounds : []).map(
        (value) => {
          const item = recordOf(value);
          return {
            quantity: uncertaintyQuantity(item.quantity),
            estimate: finite(item.estimate),
            lower95: finite(item.lower95),
            upper95: finite(item.upper95),
            unit: text(item.unit),
            method: artifact(item.method),
          };
        },
      ),
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

const unique = (values: string[]): string[] => Array.from(new Set(values));

const draft = (checkId: Nhm2CovariantConservationCheckId): CheckDraft => ({
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
  value: Nhm2CovariantConservationArtifactRefV1,
  id: string,
  gate: CheckDraft,
): void => {
  requireText(value.path, `${id}_path`, gate);
  requireHash(value.sha256, `${id}_sha256`, gate);
  if (value.path != null && /(^|[-/\\])latest([./\\-]|$)/i.test(value.path)) {
    gate.failures.push(`${id}_mutable_latest_path_forbidden`);
  }
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

const requireArray = (
  value: Nhm2CovariantConservationArrayRefV1,
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
  ) {
    gate.failures.push(`${id}_shape_invalid`);
  }
  if (
    expectedFirstDimension != null &&
    value.shape.length > 0 &&
    value.shape[0] !== expectedFirstDimension
  ) {
    gate.failures.push(`${id}_sample_count_mismatch`);
  }
};

const validateBindingAndProvenance = (
  value: PrimitiveEvidence,
): Pick<CheckDraft, "missing" | "failures"> => {
  const common = draft(NHM2_COVARIANT_CONSERVATION_CHECK_IDS[0]);
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
  ] as const) {
    requireText(field, id, common);
  }
  for (const [id, field] of [
    ["candidate_manifest_sha256", binding.candidateManifestSha256],
    ["pre_run_manifest_sha256", binding.preRunManifestSha256],
    ["atlas_sha256", binding.atlasSha256],
    ["units_sha256", binding.unitsSha256],
    ["normalization_sha256", binding.normalizationSha256],
  ] as const) {
    requireHash(field, id, common);
  }
  if (binding.laneId == null) common.missing.push("lane_id_missing");
  if (binding.gitSha == null) common.missing.push("git_sha_missing");
  else if (!GIT_SHA.test(binding.gitSha))
    common.failures.push("git_sha_invalid");

  const sourceBinding = value.sourceBinding;
  if (sourceBinding.sourceContractVersion == null)
    common.missing.push("source_contract_version_missing");
  requireArtifact(sourceBinding.sourceEvidence, "source_evidence", common);
  requireArtifact(
    sourceBinding.rawTotalSourceTensor,
    "raw_total_source_tensor",
    common,
  );
  for (const [id, field] of [
    ["source_candidate_id", sourceBinding.candidateId],
    ["source_run_id", sourceBinding.runId],
    ["source_chart_id", sourceBinding.chartId],
  ] as const) {
    requireText(field, id, common);
  }
  requireHash(
    sourceBinding.candidateManifestSha256,
    "source_candidate_manifest_sha256",
    common,
  );
  if (
    sourceBinding.candidateId !== binding.candidateId ||
    sourceBinding.candidateManifestSha256 !== binding.candidateManifestSha256 ||
    sourceBinding.runId !== binding.runId ||
    sourceBinding.chartId !== binding.chartId
  ) {
    common.failures.push("source_binding_candidate_identity_mismatch");
  }

  const provenance = value.provenance;
  for (const [id, field] of [
    ["producer_id", provenance.producerId],
    ["producer_version", provenance.producerVersion],
    ["solver_id", provenance.solverId],
    ["solver_version", provenance.solverVersion],
  ] as const) {
    requireText(field, id, common);
  }
  for (const [id, field] of [
    ["solver", provenance.solver],
    ["environment", provenance.environment],
    ["invocation", provenance.invocation],
    ["input_manifest", provenance.inputManifest],
  ] as const) {
    requireArtifact(field, id, common);
  }
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

const requireCompleteComponentSet = <T extends { component: string | null }>(
  entries: T[],
  prefix: string,
  gate: CheckDraft,
): void => {
  for (const component of NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS) {
    const count = entries.filter(
      (entry) => entry.component === component,
    ).length;
    if (count === 0) gate.missing.push(`${prefix}_${component}_missing`);
    else if (count > 1) gate.failures.push(`${prefix}_${component}_duplicate`);
  }
  if (entries.some((entry) => entry.component == null))
    gate.failures.push(`${prefix}_unknown_component`);
};

const convergenceOrder = (
  series: Array<{
    scale: number | null;
    residual: number | null;
    uncertainty: number | null;
  }>,
  prefix: string,
  gate: CheckDraft,
): number | null => {
  if (series.length < 3) {
    gate.missing.push(`${prefix}_three_resolution_levels_required`);
    return null;
  }
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < series.length; index += 1) {
    const point = series[index];
    if (
      point.scale == null ||
      point.residual == null ||
      point.uncertainty == null
    ) {
      gate.missing.push(`${prefix}_point_${index}_incomplete`);
      continue;
    }
    if (point.scale <= 0 || point.residual < 0 || point.uncertainty < 0) {
      gate.failures.push(`${prefix}_point_${index}_invalid`);
      continue;
    }
    if (index === 0) continue;
    const coarse = series[index - 1];
    if (
      coarse.scale == null ||
      coarse.residual == null ||
      coarse.uncertainty == null
    )
      continue;
    const coarseAdjusted = coarse.residual + coarse.uncertainty;
    const fineAdjusted = point.residual + point.uncertainty;
    if (
      coarse.scale <= point.scale ||
      coarseAdjusted <= fineAdjusted ||
      fineAdjusted <= 0
    ) {
      gate.failures.push(`${prefix}_not_monotonically_convergent`);
      continue;
    }
    const order =
      Math.log(coarseAdjusted / fineAdjusted) /
      Math.log(coarse.scale / point.scale);
    if (!Number.isFinite(order) || order <= 0)
      gate.failures.push(`${prefix}_observed_order_invalid`);
    else minimum = Math.min(minimum, order);
  }
  return Number.isFinite(minimum) ? minimum : null;
};

const deriveChecks = (
  value: PrimitiveEvidence,
): Nhm2CovariantConservationV1["checks"] => {
  const common = validateBindingAndProvenance(value);
  const local = draft(
    "local_covariant_divergence_all_four_components_computed",
  );
  addCommon(local, common);
  requireArtifact(
    value.divergence.derivativeDefinition,
    "derivative_definition",
    local,
  );
  requirePositiveInteger(
    value.divergence.sampleCount,
    "divergence_sample_count",
    local,
  );
  requireArray(
    value.divergence.connectionCoefficients,
    "connection_coefficients",
    local,
    value.divergence.sampleCount,
  );
  requireArray(
    value.divergence.volumeMask,
    "volume_mask",
    local,
    value.divergence.sampleCount,
  );
  requireCompleteComponentSet(value.divergence.components, "divergence", local);
  let worstDivergenceRatio = 0;
  value.divergence.components.forEach((component, index) => {
    requireArray(
      component.residualArray,
      `divergence_component_${index}`,
      local,
      value.divergence.sampleCount,
    );
    if (
      component.maxAbsSI == null ||
      component.absoluteUncertainty95SI == null ||
      component.toleranceSI == null
    ) {
      local.missing.push(`divergence_component_${index}_numeric_bound_missing`);
    } else if (
      component.maxAbsSI < 0 ||
      component.absoluteUncertainty95SI < 0 ||
      component.toleranceSI <= 0
    ) {
      local.failures.push(
        `divergence_component_${index}_numeric_bound_invalid`,
      );
    } else {
      const ratio =
        (component.maxAbsSI + component.absoluteUncertainty95SI) /
        component.toleranceSI;
      worstDivergenceRatio = Math.max(worstDivergenceRatio, ratio);
      if (ratio > 1)
        local.failures.push(
          `divergence_component_${component.component ?? index}_exceeds_tolerance`,
        );
    }
  });
  if (value.divergence.components.length > 0) {
    local.metricValue = worstDivergenceRatio;
    local.tolerance = 1;
    local.unit = "uncertainty_adjusted_tolerance_fraction";
  }

  const switching = draft("spacetime_switching_transition_terms_included");
  addCommon(switching, common);
  const support = draft("supports_controls_and_boundary_flux_included");
  addCommon(support, common);
  const validateSourceTerm = (
    termId: Nhm2CovariantConservationSourceTermId,
    gate: CheckDraft,
  ): void => {
    const matches = value.sourceTerms.filter((term) => term.termId === termId);
    if (matches.length === 0) {
      gate.missing.push(`source_term_${termId}_missing`);
      return;
    }
    if (matches.length > 1)
      gate.failures.push(`source_term_${termId}_duplicate`);
    const term = matches[0];
    requireArtifact(
      term.constitutiveDefinition,
      `source_term_${termId}_constitutive_definition`,
      gate,
    );
    requirePositiveInteger(
      term.sampleCount,
      `source_term_${termId}_sample_count`,
      gate,
    );
    if (term.includedInDiscreteDivergence == null)
      gate.missing.push(`source_term_${termId}_inclusion_missing`);
    else if (!term.includedInDiscreteDivergence)
      gate.failures.push(`source_term_${termId}_not_included`);
    requireCompleteComponentSet(term.components, `source_term_${termId}`, gate);
    term.components.forEach((component, index) =>
      requireArray(
        component.values,
        `source_term_${termId}_component_${index}`,
        gate,
        term.sampleCount,
      ),
    );
    if (
      term.sampleCount != null &&
      value.divergence.sampleCount != null &&
      term.sampleCount !== value.divergence.sampleCount
    )
      gate.failures.push(
        `source_term_${termId}_divergence_sample_count_mismatch`,
      );
  };
  validateSourceTerm("spacetime_switching", switching);
  for (const termId of ["supports", "controls", "boundary_flux"] as const)
    validateSourceTerm(termId, support);
  switching.metricValue =
    switching.missing.length + switching.failures.length === 0 ? 1 : 0;
  switching.tolerance = 1;
  switching.unit = "required_term_coverage_fraction";
  support.metricValue = Math.max(
    0,
    1 - (support.missing.length + support.failures.length) / 3,
  );
  support.tolerance = 1;
  support.unit = "required_term_coverage_fraction";

  const global = draft("discrete_global_balance_pass");
  addCommon(global, common);
  requireArtifact(
    value.discreteGlobalBalance.evidence,
    "global_balance_evidence",
    global,
  );
  requirePositiveInteger(
    value.discreteGlobalBalance.sampleCount,
    "global_balance_sample_count",
    global,
  );
  for (const [id, ref] of [
    ["global_energy_derivative", value.discreteGlobalBalance.energyDerivative],
    ["global_source_power", value.discreteGlobalBalance.sourcePower],
    [
      "global_outward_boundary_flux",
      value.discreteGlobalBalance.outwardBoundaryFlux,
    ],
  ] as const)
    requireArray(ref, id, global, value.discreteGlobalBalance.sampleCount);
  const globalNumbers = [
    value.discreteGlobalBalance.energyDerivativeW,
    value.discreteGlobalBalance.sourcePowerW,
    value.discreteGlobalBalance.outwardBoundaryFluxW,
    value.discreteGlobalBalance.absoluteUncertainty95W,
    value.discreteGlobalBalance.normalizationPowerW,
    value.discreteGlobalBalance.toleranceRelative,
  ];
  if (globalNumbers.some((number) => number == null))
    global.missing.push("global_balance_numeric_ledger_missing");
  else {
    const [
      derivative,
      source,
      outward,
      uncertainty95,
      normalization,
      tolerance,
    ] = globalNumbers as number[];
    if (uncertainty95 < 0 || normalization <= 0 || tolerance <= 0)
      global.failures.push("global_balance_numeric_policy_invalid");
    else {
      const normalized =
        (Math.abs(derivative - source + outward) + uncertainty95) /
        normalization;
      global.metricValue = normalized;
      global.tolerance = tolerance;
      global.unit = "relative_energy_balance";
      if (normalized > tolerance)
        global.failures.push("global_balance_exceeds_tolerance");
    }
  }

  const ledger = draft("time_resolved_cycle_energy_ledger_closed");
  addCommon(ledger, common);
  requireArtifact(
    value.cycleEnergyLedger.evidence,
    "cycle_ledger_evidence",
    ledger,
  );
  requireArray(
    value.cycleEnergyLedger.timeSeries,
    "cycle_ledger_time_series",
    ledger,
    value.cycleEnergyLedger.samples.length || null,
  );
  if (value.cycleEnergyLedger.samples.length < 3)
    ledger.missing.push("cycle_ledger_multiple_time_samples_required");
  const norm = value.cycleEnergyLedger.normalizationEnergyJ;
  const ledgerTolerance = value.cycleEnergyLedger.toleranceRelative;
  if (norm == null) ledger.missing.push("cycle_ledger_normalization_missing");
  else if (norm <= 0)
    ledger.failures.push("cycle_ledger_normalization_invalid");
  if (ledgerTolerance == null)
    ledger.missing.push("cycle_ledger_tolerance_missing");
  else if (ledgerTolerance <= 0)
    ledger.failures.push("cycle_ledger_tolerance_invalid");
  const first = value.cycleEnergyLedger.samples[0];
  let maximumLedgerResidual = 0;
  value.cycleEnergyLedger.samples.forEach((sample, index) => {
    const fields = [
      sample.timeS,
      sample.geometryEnergyJ,
      sample.matterEnergyJ,
      sample.switchingWorkJ,
      sample.supportWorkJ,
      sample.controlWorkJ,
      sample.outwardBoundaryEnergyJ,
      sample.absoluteUncertainty95J,
    ];
    if (fields.some((number) => number == null)) {
      ledger.missing.push(`cycle_ledger_sample_${index}_incomplete`);
      return;
    }
    if ((sample.absoluteUncertainty95J as number) < 0)
      ledger.failures.push(`cycle_ledger_sample_${index}_uncertainty_invalid`);
    if (index === 0 && sample.timeS !== 0)
      ledger.failures.push("cycle_ledger_initial_time_not_zero");
    if (
      index > 0 &&
      value.cycleEnergyLedger.samples[index - 1].timeS != null &&
      (sample.timeS as number) <=
        (value.cycleEnergyLedger.samples[index - 1].timeS as number)
    )
      ledger.failures.push("cycle_ledger_times_not_strictly_increasing");
    if (
      first?.geometryEnergyJ != null &&
      first.matterEnergyJ != null &&
      norm != null &&
      norm > 0
    ) {
      const deltaEnergy =
        (sample.geometryEnergyJ as number) +
        (sample.matterEnergyJ as number) -
        first.geometryEnergyJ -
        first.matterEnergyJ;
      const residual =
        deltaEnergy -
        (sample.switchingWorkJ as number) -
        (sample.supportWorkJ as number) -
        (sample.controlWorkJ as number) +
        (sample.outwardBoundaryEnergyJ as number);
      maximumLedgerResidual = Math.max(
        maximumLedgerResidual,
        (Math.abs(residual) + (sample.absoluteUncertainty95J as number)) / norm,
      );
    }
  });
  if (value.cycleEnergyLedger.samples.length > 0) {
    ledger.metricValue = maximumLedgerResidual;
    ledger.tolerance = ledgerTolerance;
    ledger.unit = "relative_energy_closure";
    if (ledgerTolerance != null && maximumLedgerResidual > ledgerTolerance)
      ledger.failures.push("cycle_energy_ledger_exceeds_tolerance");
  }

  const residual = draft("residual_within_frozen_uncertainty_tolerance");
  addCommon(residual, common);
  requireArtifact(
    value.uncertaintyBudget.evidence,
    "uncertainty_budget",
    residual,
  );
  if (value.uncertaintyBudget.confidenceLevel == null)
    residual.missing.push("uncertainty_confidence_level_missing");
  else if (
    value.uncertaintyBudget.confidenceLevel < 0.95 ||
    value.uncertaintyBudget.confidenceLevel >= 1
  )
    residual.failures.push("uncertainty_confidence_level_invalid");
  for (const quantity of NHM2_COVARIANT_CONSERVATION_UNCERTAINTY_QUANTITIES) {
    const matches = value.uncertaintyBudget.bounds.filter(
      (bound) => bound.quantity === quantity,
    );
    if (matches.length === 0)
      residual.missing.push(`uncertainty_${quantity}_missing`);
    else if (matches.length > 1)
      residual.failures.push(`uncertainty_${quantity}_duplicate`);
  }
  let worstBudgetFraction = 0;
  value.uncertaintyBudget.bounds.forEach((bound, index) => {
    requireArtifact(
      bound.method,
      `uncertainty_bound_${index}_method`,
      residual,
    );
    if (
      bound.quantity == null ||
      bound.estimate == null ||
      bound.lower95 == null ||
      bound.upper95 == null ||
      bound.unit == null
    ) {
      residual.missing.push(`uncertainty_bound_${index}_incomplete`);
      return;
    }
    if (
      bound.lower95 > bound.estimate ||
      bound.estimate > bound.upper95 ||
      bound.lower95 < 0
    ) {
      residual.failures.push(`uncertainty_bound_${index}_interval_invalid`);
      return;
    }
    if (bound.unit === "tolerance_fraction")
      worstBudgetFraction = Math.max(worstBudgetFraction, bound.upper95);
  });
  residual.metricValue = worstBudgetFraction;
  residual.tolerance = 1;
  residual.unit = "sigma";
  if (worstBudgetFraction > 1)
    residual.failures.push(
      "uncertainty_adjusted_residual_exceeds_frozen_tolerance",
    );

  const convergence = draft("spatial_temporal_convergence_observed");
  addCommon(convergence, common);
  requireArtifact(
    value.convergence.evidence,
    "convergence_evidence",
    convergence,
  );
  requireArray(
    value.convergence.spatialResiduals,
    "spatial_convergence_residuals",
    convergence,
    value.convergence.spatialSeries.length || null,
  );
  requireArray(
    value.convergence.temporalResiduals,
    "temporal_convergence_residuals",
    convergence,
    value.convergence.temporalSeries.length || null,
  );
  if (value.convergence.minimumAcceptedOrder == null)
    convergence.missing.push("minimum_accepted_order_missing");
  else if (value.convergence.minimumAcceptedOrder <= 0)
    convergence.failures.push("minimum_accepted_order_invalid");
  if (value.convergence.orderUncertainty95 == null)
    convergence.missing.push("convergence_order_uncertainty_missing");
  else if (value.convergence.orderUncertainty95 < 0)
    convergence.failures.push("convergence_order_uncertainty_invalid");
  const spatialOrder = convergenceOrder(
    value.convergence.spatialSeries.map((point) => ({
      scale: point.discretizationScaleM,
      residual: point.residualRelative,
      uncertainty: point.uncertainty95Relative,
    })),
    "spatial_convergence",
    convergence,
  );
  const temporalOrder = convergenceOrder(
    value.convergence.temporalSeries.map((point) => ({
      scale: point.discretizationScaleS,
      residual: point.residualRelative,
      uncertainty: point.uncertainty95Relative,
    })),
    "temporal_convergence",
    convergence,
  );
  if (spatialOrder != null && temporalOrder != null) {
    const lowerOrder =
      Math.min(spatialOrder, temporalOrder) -
      (value.convergence.orderUncertainty95 ?? 0);
    convergence.metricValue = lowerOrder;
    convergence.tolerance = value.convergence.minimumAcceptedOrder;
    convergence.unit = "observed_order_lower95";
    if (
      value.convergence.minimumAcceptedOrder != null &&
      lowerOrder < value.convergence.minimumAcceptedOrder
    )
      convergence.failures.push("convergence_order_below_frozen_minimum");
  }

  return [local, switching, support, global, ledger, residual, convergence].map(
    (gate) => {
      const blockers = unique([...gate.failures, ...gate.missing]);
      const status: Nhm2CovariantConservationStatus =
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
    },
  );
};

export const buildNhm2CovariantConservation = (
  input: BuildNhm2CovariantConservationInput = {},
): Nhm2CovariantConservationV1 => {
  const primitive = normalizePrimitive(input);
  const checks = deriveChecks(primitive);
  const status: Nhm2CovariantConservationStatus = checks.some(
    (check) => check.status === "fail",
  )
    ? "fail"
    : checks.some((check) => check.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    contractVersion: NHM2_COVARIANT_CONSERVATION_CONTRACT_VERSION,
    ...primitive,
    checks,
    status,
    covariantConservationReady: status === "pass",
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

export const isNhm2CovariantConservation = (
  value: unknown,
): value is Nhm2CovariantConservationV1 => {
  if (
    !isRecord(value) ||
    value.contractVersion !== NHM2_COVARIANT_CONSERVATION_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2CovariantConservation(
    value as unknown as BuildNhm2CovariantConservationInput,
  );
  return (
    JSON.stringify(canonicalize(rebuilt)) ===
    JSON.stringify(canonicalize(value))
  );
};
