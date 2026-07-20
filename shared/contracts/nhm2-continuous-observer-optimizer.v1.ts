import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY } from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import { NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION } from "./nhm2-full-apparatus-source-tensor.v1";

export const NHM2_CONTINUOUS_OBSERVER_OPTIMIZER_CONTRACT_VERSION =
  "nhm2_continuous_observer_optimizer/v1" as const;

export const NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS = [
  "WEC",
  "NEC",
  "SEC",
  "DEC",
] as const;

export const NHM2_CONTINUOUS_OBSERVER_REQUIRED_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.continuous_observer_optimizer,
] as const;

export type Nhm2ContinuousObserverEnergyCondition =
  (typeof NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS)[number];
export type Nhm2ContinuousObserverCheckId =
  (typeof NHM2_CONTINUOUS_OBSERVER_REQUIRED_CHECK_IDS)[number];
export type Nhm2ContinuousObserverStatus = "pass" | "blocked" | "fail";

export type Nhm2ContinuousObserverHashedArtifactV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2ContinuousObserverSourceBindingV1 = {
  sourceContractVersion:
    typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION | null;
  sourceEvidence: Nhm2ContinuousObserverHashedArtifactV1;
  rawTotalSourceTensor: Nhm2ContinuousObserverHashedArtifactV1;
  candidateId: string | null;
  candidateManifestSha256: string | null;
  runId: string | null;
  chartId: string | null;
};

export type Nhm2ContinuousObserverOptimizerV1 = {
  contractVersion: typeof NHM2_CONTINUOUS_OBSERVER_OPTIMIZER_CONTRACT_VERSION;
  generatedAt: string | null;
  identity: {
    candidateId: string | null;
    candidateManifestSha256: string | null;
    preRunManifest: Nhm2ContinuousObserverHashedArtifactV1;
    laneId: "nhm2_shift_lapse" | null;
    runId: string | null;
    requestId: string | null;
    receiptId: string | null;
    selectedProfileId: string | null;
    chartId: string | null;
    atlas: Nhm2ContinuousObserverHashedArtifactV1;
    units: Nhm2ContinuousObserverHashedArtifactV1;
    normalization: Nhm2ContinuousObserverHashedArtifactV1;
    gitSha: string | null;
  };
  sourceBinding: Nhm2ContinuousObserverSourceBindingV1;
  domain: {
    admittedSpatialSampleCount: number | null;
    optimizedSpatialSampleCount: number | null;
    spatialSampleIndex: Nhm2ContinuousObserverHashedArtifactV1;
    timelikeManifold: {
      parameterization: "unit_timelike_hyperboloid" | null;
      dimension: number | null;
      chartCount: number | null;
      atlas: Nhm2ContinuousObserverHashedArtifactV1;
      parameterSamples: Nhm2ContinuousObserverHashedArtifactV1;
    };
    nullManifold: {
      parameterization: "future_null_directions" | null;
      dimension: number | null;
      directionCount: number | null;
      atlas: Nhm2ContinuousObserverHashedArtifactV1;
      directionSamples: Nhm2ContinuousObserverHashedArtifactV1;
    };
  };
  extrema: {
    rawExtremaArray: Nhm2ContinuousObserverHashedArtifactV1;
    entries: Array<{
      condition: Nhm2ContinuousObserverEnergyCondition | null;
      observerClass: "unit_timelike" | "future_null" | null;
      extremum: "minimum" | null;
      valueSI: number | null;
      absoluteUncertaintySI: number | null;
      unit: string | null;
      spatialSampleCount: number | null;
      observerVectorCount: number | null;
      observerVectors: Nhm2ContinuousObserverHashedArtifactV1;
      valueArray: Nhm2ContinuousObserverHashedArtifactV1;
    }>;
  };
  optimizer: {
    algorithmId: string | null;
    algorithmVersion: string | null;
    objectiveDefinition: Nhm2ContinuousObserverHashedArtifactV1;
    stationarityResidualMax: number | null;
    stationarityTolerance: number | null;
    certifiedGlobalityGapMax: number | null;
    globalityGapTolerance: number | null;
    globalityCertificate: Nhm2ContinuousObserverHashedArtifactV1;
    convergence: {
      resolutionLevels: number[];
      observedOrder: number | null;
      minimumOrder: number | null;
      crossResolutionExtremumDifferenceMax: number | null;
      crossResolutionTolerance: number | null;
      study: Nhm2ContinuousObserverHashedArtifactV1;
    };
    adversarialStarts: {
      requiredCount: number | null;
      completedCount: number | null;
      distinctStartCount: number | null;
      worstExtremumDisagreement: number | null;
      disagreementTolerance: number | null;
      starts: Nhm2ContinuousObserverHashedArtifactV1;
      replay: Nhm2ContinuousObserverHashedArtifactV1;
    };
    contradictoryEvidence: {
      scannedEvidenceCount: number | null;
      contradictionsFound: number | null;
      contradictionsResolved: number | null;
      unresolvedCount: number | null;
      registry: Nhm2ContinuousObserverHashedArtifactV1;
      resolutionLog: Nhm2ContinuousObserverHashedArtifactV1;
    };
  };
  uncertainty: {
    confidenceLevel: number | null;
    method: string | null;
    budget: Nhm2ContinuousObserverHashedArtifactV1;
    rawSamples: Nhm2ContinuousObserverHashedArtifactV1;
  };
  provenance: {
    producerId: string | null;
    implementationId: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: Nhm2ContinuousObserverHashedArtifactV1;
    environment: Nhm2ContinuousObserverHashedArtifactV1;
    invocation: Nhm2ContinuousObserverHashedArtifactV1;
    command: string | null;
    argv: string[];
    workingDirectory: string | null;
    inputManifest: Nhm2ContinuousObserverHashedArtifactV1;
    outputDirectory: string | null;
    runId: string | null;
    requestId: string | null;
    receiptId: string | null;
    gitSha: string | null;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
    deterministicSeed: string | null;
    runSpecificOutput: boolean | null;
  };
  checks: Array<{
    checkId: Nhm2ContinuousObserverCheckId;
    status: Nhm2ContinuousObserverStatus;
    blockers: string[];
  }>;
  status: Nhm2ContinuousObserverStatus;
  continuousObserverOptimizationReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    continuousObserverCoverageOnly: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2ContinuousObserverOptimizerV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "continuousObserverOptimizationReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2ContinuousObserverOptimizerInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2ContinuousObserverCheckId;
  missing: string[];
  failures: string[];
};

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const GIT_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const unique = (values: string[]): string[] => Array.from(new Set(values));

const normalizeArtifact = (
  value: unknown,
): Nhm2ContinuousObserverHashedArtifactV1 => {
  const record = asRecord(value);
  return { path: asText(record.path), sha256: asText(record.sha256) };
};

const normalizeIdentity = (
  value: unknown,
): Nhm2ContinuousObserverOptimizerV1["identity"] => {
  const record = asRecord(value);
  return {
    candidateId: asText(record.candidateId),
    candidateManifestSha256: asText(record.candidateManifestSha256),
    preRunManifest: normalizeArtifact(record.preRunManifest),
    laneId: record.laneId === "nhm2_shift_lapse" ? record.laneId : null,
    runId: asText(record.runId),
    requestId: asText(record.requestId),
    receiptId: asText(record.receiptId),
    selectedProfileId: asText(record.selectedProfileId),
    chartId: asText(record.chartId),
    atlas: normalizeArtifact(record.atlas),
    units: normalizeArtifact(record.units),
    normalization: normalizeArtifact(record.normalization),
    gitSha: asText(record.gitSha),
  };
};

const normalizeSourceBinding = (
  value: unknown,
): Nhm2ContinuousObserverSourceBindingV1 => {
  const record = asRecord(value);
  return {
    sourceContractVersion:
      record.sourceContractVersion ===
      NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION
        ? NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION
        : null,
    sourceEvidence: normalizeArtifact(record.sourceEvidence),
    rawTotalSourceTensor: normalizeArtifact(record.rawTotalSourceTensor),
    candidateId: asText(record.candidateId),
    candidateManifestSha256: asText(record.candidateManifestSha256),
    runId: asText(record.runId),
    chartId: asText(record.chartId),
  };
};

const normalizePrimitive = (
  input: BuildNhm2ContinuousObserverOptimizerInput,
): PrimitiveEvidence => {
  const root = asRecord(input);
  const domain = asRecord(root.domain);
  const timelike = asRecord(domain.timelikeManifold);
  const nullManifold = asRecord(domain.nullManifold);
  const extrema = asRecord(root.extrema);
  const optimizer = asRecord(root.optimizer);
  const convergence = asRecord(optimizer.convergence);
  const starts = asRecord(optimizer.adversarialStarts);
  const contradictions = asRecord(optimizer.contradictoryEvidence);
  const uncertainty = asRecord(root.uncertainty);
  const provenance = asRecord(root.provenance);
  const entries = Array.isArray(extrema.entries) ? extrema.entries : [];
  const levels = Array.isArray(convergence.resolutionLevels)
    ? convergence.resolutionLevels
        .map(toFinite)
        .filter((value): value is number => value != null)
    : [];
  const argv = Array.isArray(provenance.argv)
    ? provenance.argv
        .map(asText)
        .filter((value): value is string => value != null)
    : [];
  return {
    generatedAt: asText(root.generatedAt),
    identity: normalizeIdentity(root.identity),
    sourceBinding: normalizeSourceBinding(root.sourceBinding),
    domain: {
      admittedSpatialSampleCount: toFinite(domain.admittedSpatialSampleCount),
      optimizedSpatialSampleCount: toFinite(domain.optimizedSpatialSampleCount),
      spatialSampleIndex: normalizeArtifact(domain.spatialSampleIndex),
      timelikeManifold: {
        parameterization:
          timelike.parameterization === "unit_timelike_hyperboloid"
            ? timelike.parameterization
            : null,
        dimension: toFinite(timelike.dimension),
        chartCount: toFinite(timelike.chartCount),
        atlas: normalizeArtifact(timelike.atlas),
        parameterSamples: normalizeArtifact(timelike.parameterSamples),
      },
      nullManifold: {
        parameterization:
          nullManifold.parameterization === "future_null_directions"
            ? nullManifold.parameterization
            : null,
        dimension: toFinite(nullManifold.dimension),
        directionCount: toFinite(nullManifold.directionCount),
        atlas: normalizeArtifact(nullManifold.atlas),
        directionSamples: normalizeArtifact(nullManifold.directionSamples),
      },
    },
    extrema: {
      rawExtremaArray: normalizeArtifact(extrema.rawExtremaArray),
      entries: entries.map((value) => {
        const entry = asRecord(value);
        const condition = NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS.includes(
          entry.condition as Nhm2ContinuousObserverEnergyCondition,
        )
          ? (entry.condition as Nhm2ContinuousObserverEnergyCondition)
          : null;
        return {
          condition,
          observerClass:
            entry.observerClass === "unit_timelike" ||
            entry.observerClass === "future_null"
              ? entry.observerClass
              : null,
          extremum: entry.extremum === "minimum" ? "minimum" : null,
          valueSI: toFinite(entry.valueSI),
          absoluteUncertaintySI: toFinite(entry.absoluteUncertaintySI),
          unit: asText(entry.unit),
          spatialSampleCount: toFinite(entry.spatialSampleCount),
          observerVectorCount: toFinite(entry.observerVectorCount),
          observerVectors: normalizeArtifact(entry.observerVectors),
          valueArray: normalizeArtifact(entry.valueArray),
        };
      }),
    },
    optimizer: {
      algorithmId: asText(optimizer.algorithmId),
      algorithmVersion: asText(optimizer.algorithmVersion),
      objectiveDefinition: normalizeArtifact(optimizer.objectiveDefinition),
      stationarityResidualMax: toFinite(optimizer.stationarityResidualMax),
      stationarityTolerance: toFinite(optimizer.stationarityTolerance),
      certifiedGlobalityGapMax: toFinite(optimizer.certifiedGlobalityGapMax),
      globalityGapTolerance: toFinite(optimizer.globalityGapTolerance),
      globalityCertificate: normalizeArtifact(optimizer.globalityCertificate),
      convergence: {
        resolutionLevels: levels,
        observedOrder: toFinite(convergence.observedOrder),
        minimumOrder: toFinite(convergence.minimumOrder),
        crossResolutionExtremumDifferenceMax: toFinite(
          convergence.crossResolutionExtremumDifferenceMax,
        ),
        crossResolutionTolerance: toFinite(
          convergence.crossResolutionTolerance,
        ),
        study: normalizeArtifact(convergence.study),
      },
      adversarialStarts: {
        requiredCount: toFinite(starts.requiredCount),
        completedCount: toFinite(starts.completedCount),
        distinctStartCount: toFinite(starts.distinctStartCount),
        worstExtremumDisagreement: toFinite(starts.worstExtremumDisagreement),
        disagreementTolerance: toFinite(starts.disagreementTolerance),
        starts: normalizeArtifact(starts.starts),
        replay: normalizeArtifact(starts.replay),
      },
      contradictoryEvidence: {
        scannedEvidenceCount: toFinite(contradictions.scannedEvidenceCount),
        contradictionsFound: toFinite(contradictions.contradictionsFound),
        contradictionsResolved: toFinite(contradictions.contradictionsResolved),
        unresolvedCount: toFinite(contradictions.unresolvedCount),
        registry: normalizeArtifact(contradictions.registry),
        resolutionLog: normalizeArtifact(contradictions.resolutionLog),
      },
    },
    uncertainty: {
      confidenceLevel: toFinite(uncertainty.confidenceLevel),
      method: asText(uncertainty.method),
      budget: normalizeArtifact(uncertainty.budget),
      rawSamples: normalizeArtifact(uncertainty.rawSamples),
    },
    provenance: {
      producerId: asText(provenance.producerId),
      implementationId: asText(provenance.implementationId),
      solverId: asText(provenance.solverId),
      solverVersion: asText(provenance.solverVersion),
      solver: normalizeArtifact(provenance.solver),
      environment: normalizeArtifact(provenance.environment),
      invocation: normalizeArtifact(provenance.invocation),
      command: asText(provenance.command),
      argv,
      workingDirectory: asText(provenance.workingDirectory),
      inputManifest: normalizeArtifact(provenance.inputManifest),
      outputDirectory: asText(provenance.outputDirectory),
      runId: asText(provenance.runId),
      requestId: asText(provenance.requestId),
      receiptId: asText(provenance.receiptId),
      gitSha: asText(provenance.gitSha),
      startedAt: asText(provenance.startedAt),
      completedAt: asText(provenance.completedAt),
      durationMs: toFinite(provenance.durationMs),
      deterministicSeed: asText(provenance.deterministicSeed),
      runSpecificOutput: toBoolean(provenance.runSpecificOutput),
    },
  };
};

const draft = (checkId: Nhm2ContinuousObserverCheckId): CheckDraft => ({
  checkId,
  missing: [],
  failures: [],
});

const requireText = (
  value: string | null,
  blocker: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${blocker}_missing`);
};

const requireHash = (
  value: string | null,
  blocker: string,
  check: CheckDraft,
): void => {
  if (value == null || !SHA256_PATTERN.test(value)) {
    check.missing.push(`${blocker}_sha256_unbound`);
  }
};

const requireArtifact = (
  value: Nhm2ContinuousObserverHashedArtifactV1,
  blocker: string,
  check: CheckDraft,
): void => {
  requireText(value.path, `${blocker}_path`, check);
  requireHash(value.sha256, blocker, check);
};

const requireRawShaArtifact = (
  value: Nhm2ContinuousObserverHashedArtifactV1,
  blocker: string,
  check: CheckDraft,
): void => {
  requireText(value.path, `${blocker}_path`, check);
  if (value.sha256 == null || !SHA256_PATTERN.test(value.sha256)) {
    check.missing.push(`${blocker}_sha256_unbound`);
  }
};

const requirePositiveInteger = (
  value: number | null,
  blocker: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${blocker}_missing`);
  else if (!Number.isInteger(value) || value <= 0)
    check.failures.push(`${blocker}_invalid`);
};

const requireNonnegativeInteger = (
  value: number | null,
  blocker: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${blocker}_missing`);
  else if (!Number.isInteger(value) || value < 0)
    check.failures.push(`${blocker}_invalid`);
};

const requireBoundedResidual = (
  value: number | null,
  tolerance: number | null,
  blocker: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${blocker}_missing`);
  else if (value < 0) check.failures.push(`${blocker}_invalid`);
  if (tolerance == null) check.missing.push(`${blocker}_tolerance_missing`);
  else if (tolerance <= 0) check.failures.push(`${blocker}_tolerance_invalid`);
  if (value != null && tolerance != null && value > tolerance) {
    check.failures.push(`${blocker}_exceeds_tolerance`);
  }
};

const globalIdentityBlockers = (core: PrimitiveEvidence): string[] => {
  const check = draft("unit_timelike_hyperboloid_continuously_optimized");
  const identity = core.identity;
  requireText(identity.candidateId, "candidate_id", check);
  requireHash(identity.candidateManifestSha256, "candidate_manifest", check);
  requireArtifact(identity.preRunManifest, "pre_run_manifest", check);
  requireText(identity.laneId, "lane_id", check);
  requireText(identity.runId, "run_id", check);
  requireText(identity.requestId, "request_id", check);
  requireText(identity.receiptId, "receipt_id", check);
  requireText(identity.selectedProfileId, "selected_profile_id", check);
  requireText(identity.chartId, "chart_id", check);
  requireArtifact(identity.atlas, "atlas", check);
  requireArtifact(identity.units, "units", check);
  requireArtifact(identity.normalization, "normalization", check);
  if (identity.gitSha == null || !GIT_SHA_PATTERN.test(identity.gitSha)) {
    check.missing.push("git_sha_unbound");
  }
  if (
    identity.candidateManifestSha256 != null &&
    identity.preRunManifest.sha256 != null &&
    identity.candidateManifestSha256 !== identity.preRunManifest.sha256
  ) {
    check.missing.push("pre_run_manifest_candidate_sha_mismatch");
  }

  const source = core.sourceBinding;
  if (
    source.sourceContractVersion !==
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION
  ) {
    check.missing.push("full_apparatus_source_contract_version_unbound");
  }
  requireRawShaArtifact(
    source.sourceEvidence,
    "full_apparatus_source_evidence",
    check,
  );
  requireRawShaArtifact(
    source.rawTotalSourceTensor,
    "full_apparatus_raw_total_source_tensor",
    check,
  );
  requireText(source.candidateId, "source_candidate_id", check);
  requireHash(
    source.candidateManifestSha256,
    "source_candidate_manifest",
    check,
  );
  requireText(source.runId, "source_run_id", check);
  requireText(source.chartId, "source_chart_id", check);
  if (
    source.sourceEvidence.path != null &&
    source.rawTotalSourceTensor.path != null &&
    source.sourceEvidence.path === source.rawTotalSourceTensor.path
  ) {
    check.failures.push("source_evidence_raw_tensor_path_collision");
  }
  if (source.candidateId !== identity.candidateId) {
    check.missing.push("source_candidate_id_mismatch");
  }
  if (source.candidateManifestSha256 !== identity.candidateManifestSha256) {
    check.missing.push("source_candidate_manifest_sha_mismatch");
  }
  if (source.runId !== identity.runId) {
    check.missing.push("source_run_id_mismatch");
  }
  if (source.chartId !== identity.chartId) {
    check.missing.push("source_chart_id_mismatch");
  }

  const provenance = core.provenance;
  requireText(provenance.producerId, "producer_id", check);
  requireText(provenance.implementationId, "implementation_id", check);
  requireText(provenance.solverId, "solver_id", check);
  requireText(provenance.solverVersion, "solver_version", check);
  requireArtifact(provenance.solver, "solver", check);
  requireArtifact(provenance.environment, "environment", check);
  requireArtifact(provenance.invocation, "invocation", check);
  requireText(provenance.command, "command", check);
  requireText(provenance.workingDirectory, "working_directory", check);
  requireArtifact(provenance.inputManifest, "input_manifest", check);
  requireText(provenance.outputDirectory, "output_directory", check);
  requireText(provenance.deterministicSeed, "deterministic_seed", check);
  if (provenance.runSpecificOutput !== true)
    check.missing.push("run_specific_output_not_bound");
  if (provenance.runId !== identity.runId)
    check.missing.push("provenance_run_id_mismatch");
  if (provenance.requestId !== identity.requestId)
    check.missing.push("provenance_request_id_mismatch");
  if (provenance.receiptId !== identity.receiptId)
    check.missing.push("provenance_receipt_id_mismatch");
  if (provenance.gitSha !== identity.gitSha)
    check.missing.push("provenance_git_sha_mismatch");
  const start = Date.parse(provenance.startedAt ?? "");
  const end = Date.parse(provenance.completedAt ?? "");
  const generated = Date.parse(core.generatedAt ?? "");
  if (!Number.isFinite(start)) check.missing.push("started_at_invalid");
  if (!Number.isFinite(end)) check.missing.push("completed_at_invalid");
  if (!Number.isFinite(generated)) check.missing.push("generated_at_invalid");
  if (Number.isFinite(start) && Number.isFinite(end) && end < start)
    check.missing.push("execution_interval_invalid");
  if (Number.isFinite(end) && Number.isFinite(generated) && generated < end)
    check.missing.push("generated_before_completion");
  if (provenance.durationMs == null || provenance.durationMs <= 0)
    check.missing.push("duration_ms_invalid");
  else if (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Math.abs(end - start - provenance.durationMs) > 1
  ) {
    check.missing.push("duration_interval_mismatch");
  }

  requireText(core.uncertainty.method, "uncertainty_method", check);
  requireArtifact(core.uncertainty.budget, "uncertainty_budget", check);
  requireArtifact(
    core.uncertainty.rawSamples,
    "uncertainty_raw_samples",
    check,
  );
  if (
    core.uncertainty.confidenceLevel == null ||
    core.uncertainty.confidenceLevel < 0.95 ||
    core.uncertainty.confidenceLevel >= 1
  ) {
    check.missing.push("uncertainty_confidence_level_unqualified");
  }
  return unique([...check.missing, ...check.failures]);
};

const deriveChecks = (core: PrimitiveEvidence): CheckDraft[] => {
  const byId = new Map(
    NHM2_CONTINUOUS_OBSERVER_REQUIRED_CHECK_IDS.map((id) => [id, draft(id)]),
  );
  const get = (id: Nhm2ContinuousObserverCheckId): CheckDraft => byId.get(id)!;

  const timelike = get("unit_timelike_hyperboloid_continuously_optimized");
  if (
    core.domain.timelikeManifold.parameterization !==
    "unit_timelike_hyperboloid"
  )
    timelike.missing.push("unit_timelike_parameterization_missing");
  if (core.domain.timelikeManifold.dimension !== 3)
    timelike.failures.push("timelike_hyperboloid_dimension_invalid");
  requirePositiveInteger(
    core.domain.timelikeManifold.chartCount,
    "timelike_chart_count",
    timelike,
  );
  requireArtifact(
    core.domain.timelikeManifold.atlas,
    "timelike_atlas",
    timelike,
  );
  requireArtifact(
    core.domain.timelikeManifold.parameterSamples,
    "timelike_parameter_samples",
    timelike,
  );
  requireText(core.optimizer.algorithmId, "optimizer_algorithm_id", timelike);
  requireText(
    core.optimizer.algorithmVersion,
    "optimizer_algorithm_version",
    timelike,
  );
  requireArtifact(
    core.optimizer.objectiveDefinition,
    "optimizer_objective_definition",
    timelike,
  );

  const spatial = get("every_admitted_spatial_sample_covered");
  requirePositiveInteger(
    core.domain.admittedSpatialSampleCount,
    "admitted_spatial_sample_count",
    spatial,
  );
  requirePositiveInteger(
    core.domain.optimizedSpatialSampleCount,
    "optimized_spatial_sample_count",
    spatial,
  );
  requireArtifact(
    core.domain.spatialSampleIndex,
    "spatial_sample_index",
    spatial,
  );
  if (
    core.domain.admittedSpatialSampleCount != null &&
    core.domain.optimizedSpatialSampleCount != null &&
    core.domain.optimizedSpatialSampleCount !==
      core.domain.admittedSpatialSampleCount
  ) {
    spatial.failures.push("admitted_spatial_samples_not_fully_covered");
  }

  const spatialSufficiency = get(
    "observer_spatial_sample_count_meets_frozen_minimum",
  );
  requirePositiveInteger(
    core.domain.admittedSpatialSampleCount,
    "admitted_spatial_sample_count",
    spatialSufficiency,
  );
  if (
    core.domain.admittedSpatialSampleCount != null &&
    core.domain.admittedSpatialSampleCount <
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .continuousObserver.minimumSpatialSamples
  ) {
    spatialSufficiency.failures.push(
      "admitted_spatial_sample_count_below_frozen_minimum",
    );
  }

  const nullDirections = get("null_direction_manifold_covered");
  if (core.domain.nullManifold.parameterization !== "future_null_directions")
    nullDirections.missing.push("null_direction_parameterization_missing");
  if (core.domain.nullManifold.dimension !== 2)
    nullDirections.failures.push("null_direction_dimension_invalid");
  requirePositiveInteger(
    core.domain.nullManifold.directionCount,
    "null_direction_count",
    nullDirections,
  );
  requireArtifact(
    core.domain.nullManifold.atlas,
    "null_direction_atlas",
    nullDirections,
  );

  const nullDirectionSufficiency = get(
    "null_direction_sample_count_meets_frozen_minimum",
  );
  requirePositiveInteger(
    core.domain.nullManifold.directionCount,
    "null_direction_count",
    nullDirectionSufficiency,
  );
  if (
    core.domain.nullManifold.directionCount != null &&
    core.domain.nullManifold.directionCount <
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .continuousObserver.minimumNullDirectionsPerSpatialSample
  ) {
    nullDirectionSufficiency.failures.push(
      "null_direction_count_below_frozen_minimum",
    );
  }
  requireArtifact(
    core.domain.nullManifold.directionSamples,
    "null_direction_samples",
    nullDirections,
  );

  const extrema = get("wec_nec_sec_dec_extrema_recorded");
  requireArtifact(core.extrema.rawExtremaArray, "raw_extrema_array", extrema);
  if (
    core.extrema.entries.length !==
    NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS.length
  )
    extrema.failures.push("energy_condition_extrema_cardinality_invalid");
  if (core.extrema.entries.some((entry) => entry.condition == null))
    extrema.missing.push("energy_condition_extremum_identity_missing");
  for (const condition of NHM2_CONTINUOUS_OBSERVER_ENERGY_CONDITIONS) {
    const matches = core.extrema.entries.filter(
      (entry) => entry.condition === condition,
    );
    if (matches.length === 0) {
      extrema.missing.push(`${condition.toLowerCase()}_extremum_missing`);
      continue;
    }
    if (matches.length !== 1) {
      extrema.failures.push(`${condition.toLowerCase()}_extremum_not_unique`);
      continue;
    }
    const entry = matches[0];
    const expectedClass = condition === "NEC" ? "future_null" : "unit_timelike";
    if (entry.observerClass !== expectedClass)
      extrema.failures.push(
        `${condition.toLowerCase()}_observer_class_invalid`,
      );
    if (entry.extremum !== "minimum")
      extrema.missing.push(`${condition.toLowerCase()}_minimum_missing`);
    if (entry.valueSI == null)
      extrema.missing.push(`${condition.toLowerCase()}_value_missing`);
    if (entry.absoluteUncertaintySI == null)
      extrema.missing.push(`${condition.toLowerCase()}_uncertainty_missing`);
    else if (entry.absoluteUncertaintySI < 0)
      extrema.failures.push(`${condition.toLowerCase()}_uncertainty_invalid`);
    requireText(entry.unit, `${condition.toLowerCase()}_unit`, extrema);
    requirePositiveInteger(
      entry.observerVectorCount,
      `${condition.toLowerCase()}_observer_vector_count`,
      extrema,
    );
    requireArtifact(
      entry.observerVectors,
      `${condition.toLowerCase()}_observer_vectors`,
      extrema,
    );
    requireArtifact(
      entry.valueArray,
      `${condition.toLowerCase()}_value_array`,
      extrema,
    );
    if (
      entry.spatialSampleCount == null ||
      entry.spatialSampleCount !== core.domain.admittedSpatialSampleCount
    ) {
      extrema.failures.push(
        `${condition.toLowerCase()}_spatial_sample_coverage_mismatch`,
      );
    }
  }

  const globality = get("optimizer_convergence_and_globality_evidence");
  requireBoundedResidual(
    core.optimizer.stationarityResidualMax,
    core.optimizer.stationarityTolerance,
    "stationarity_residual",
    globality,
  );

  const convergenceSufficiency = get(
    "observer_resolution_convergence_meets_frozen_minimum",
  );
  requireArtifact(
    core.optimizer.convergence.study,
    "convergence_study",
    convergenceSufficiency,
  );
  if (
    core.optimizer.convergence.resolutionLevels.length <
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
      .continuousObserver.minimumResolutionLevels
  ) {
    convergenceSufficiency.failures.push(
      "resolution_level_count_below_frozen_minimum",
    );
  }
  if (core.optimizer.convergence.observedOrder == null) {
    convergenceSufficiency.missing.push("observed_convergence_order_missing");
  } else if (
    core.optimizer.convergence.observedOrder <
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
      .continuousObserver.minimumObservedConvergenceOrder
  ) {
    convergenceSufficiency.failures.push(
      "observed_convergence_order_below_frozen_minimum",
    );
  }
  requireBoundedResidual(
    core.optimizer.certifiedGlobalityGapMax,
    core.optimizer.globalityGapTolerance,
    "certified_globality_gap",
    globality,
  );
  requireArtifact(
    core.optimizer.globalityCertificate,
    "globality_certificate",
    globality,
  );
  requireArtifact(
    core.optimizer.convergence.study,
    "convergence_study",
    globality,
  );
  if (core.optimizer.convergence.resolutionLevels.length < 3)
    globality.missing.push("three_resolution_levels_required");
  else if (
    core.optimizer.convergence.resolutionLevels.some(
      (value, index, values) =>
        !Number.isInteger(value) ||
        value <= 0 ||
        (index > 0 && value <= values[index - 1]),
    )
  )
    globality.failures.push("resolution_levels_invalid");
  if (core.optimizer.convergence.observedOrder == null)
    globality.missing.push("observed_convergence_order_missing");
  if (core.optimizer.convergence.minimumOrder == null)
    globality.missing.push("minimum_convergence_order_missing");
  if (
    core.optimizer.convergence.observedOrder != null &&
    core.optimizer.convergence.minimumOrder != null &&
    core.optimizer.convergence.observedOrder <
      core.optimizer.convergence.minimumOrder
  )
    globality.failures.push("observed_convergence_order_below_minimum");
  requireBoundedResidual(
    core.optimizer.convergence.crossResolutionExtremumDifferenceMax,
    core.optimizer.convergence.crossResolutionTolerance,
    "cross_resolution_extremum_difference",
    globality,
  );

  const adversarial = get("adversarial_initializations_replayed");
  requirePositiveInteger(
    core.optimizer.adversarialStarts.requiredCount,
    "adversarial_required_count",
    adversarial,
  );
  requirePositiveInteger(
    core.optimizer.adversarialStarts.completedCount,
    "adversarial_completed_count",
    adversarial,
  );
  requirePositiveInteger(
    core.optimizer.adversarialStarts.distinctStartCount,
    "adversarial_distinct_start_count",
    adversarial,
  );
  requireArtifact(
    core.optimizer.adversarialStarts.starts,
    "adversarial_starts",
    adversarial,
  );
  requireArtifact(
    core.optimizer.adversarialStarts.replay,
    "adversarial_replay",
    adversarial,
  );
  if (
    core.optimizer.adversarialStarts.requiredCount != null &&
    core.optimizer.adversarialStarts.requiredCount < 2
  )
    adversarial.failures.push("adversarial_start_count_insufficient");
  if (
    core.optimizer.adversarialStarts.completedCount !==
    core.optimizer.adversarialStarts.requiredCount
  )
    adversarial.failures.push("adversarial_initializations_incomplete");
  if (
    core.optimizer.adversarialStarts.distinctStartCount != null &&
    core.optimizer.adversarialStarts.distinctStartCount < 2
  )
    adversarial.failures.push("adversarial_starts_not_distinct");
  requireBoundedResidual(
    core.optimizer.adversarialStarts.worstExtremumDisagreement,
    core.optimizer.adversarialStarts.disagreementTolerance,
    "adversarial_extremum_disagreement",
    adversarial,
  );

  const contradictions = get("contradictory_observer_evidence_resolved");
  requirePositiveInteger(
    core.optimizer.contradictoryEvidence.scannedEvidenceCount,
    "observer_evidence_scan_count",
    contradictions,
  );
  requireNonnegativeInteger(
    core.optimizer.contradictoryEvidence.contradictionsFound,
    "contradictions_found",
    contradictions,
  );
  requireNonnegativeInteger(
    core.optimizer.contradictoryEvidence.contradictionsResolved,
    "contradictions_resolved",
    contradictions,
  );
  requireNonnegativeInteger(
    core.optimizer.contradictoryEvidence.unresolvedCount,
    "unresolved_contradictions",
    contradictions,
  );
  requireArtifact(
    core.optimizer.contradictoryEvidence.registry,
    "contradictory_evidence_registry",
    contradictions,
  );
  requireArtifact(
    core.optimizer.contradictoryEvidence.resolutionLog,
    "contradictory_evidence_resolution_log",
    contradictions,
  );
  if (
    core.optimizer.contradictoryEvidence.contradictionsFound != null &&
    core.optimizer.contradictoryEvidence.contradictionsResolved != null &&
    core.optimizer.contradictoryEvidence.contradictionsFound !==
      core.optimizer.contradictoryEvidence.contradictionsResolved
  )
    contradictions.failures.push("contradictory_evidence_not_fully_resolved");
  if (core.optimizer.contradictoryEvidence.unresolvedCount !== 0)
    contradictions.failures.push("unresolved_contradictory_evidence_present");

  return [...byId.values()];
};

const checkResult = (check: CheckDraft) => ({
  checkId: check.checkId,
  status: (check.failures.length > 0
    ? "fail"
    : check.missing.length > 0
      ? "blocked"
      : "pass") as Nhm2ContinuousObserverStatus,
  blockers: unique([...check.missing, ...check.failures]),
});

export const buildNhm2ContinuousObserverOptimizer = (
  input: BuildNhm2ContinuousObserverOptimizerInput = {},
): Nhm2ContinuousObserverOptimizerV1 => {
  const core = normalizePrimitive(input);
  const identityBlockers = globalIdentityBlockers(core);
  const checks = deriveChecks(core).map(checkResult);
  const checkBlockers = checks.flatMap((check) =>
    check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
  );
  const blockers = unique([
    ...identityBlockers.map((blocker) => `identity_or_provenance:${blocker}`),
    ...checkBlockers,
  ]);
  const status: Nhm2ContinuousObserverStatus =
    identityBlockers.length > 0 ||
    checks.some((check) => check.status === "blocked")
      ? "blocked"
      : checks.some((check) => check.status === "fail")
        ? "fail"
        : "pass";
  return {
    contractVersion: NHM2_CONTINUOUS_OBSERVER_OPTIMIZER_CONTRACT_VERSION,
    ...core,
    checks,
    status,
    continuousObserverOptimizationReady: status === "pass",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      continuousObserverCoverageOnly: true,
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

export const isNhm2ContinuousObserverOptimizer = (
  value: unknown,
): value is Nhm2ContinuousObserverOptimizerV1 => {
  if (!isRecord(value) || !isJsonValue(value)) return false;
  if (
    value.contractVersion !==
    NHM2_CONTINUOUS_OBSERVER_OPTIMIZER_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2ContinuousObserverOptimizer({
    generatedAt: value.generatedAt,
    identity: value.identity,
    sourceBinding: value.sourceBinding,
    domain: value.domain,
    extrema: value.extrema,
    optimizer: value.optimizer,
    uncertainty: value.uncertainty,
    provenance: value.provenance,
  } as BuildNhm2ContinuousObserverOptimizerInput);
  return (
    JSON.stringify(canonicalize(value)) ===
    JSON.stringify(canonicalize(rebuilt))
  );
};
