import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
} from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";
import { NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS } from "./nhm2-full-apparatus-source-tensor.v1";
import { NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS } from "./nhm2-prediction-falsifier-freeze.v1";

export const NHM2_INDEPENDENT_NUMERICAL_REPLICATION_CONTRACT_VERSION =
  "nhm2_independent_numerical_replication/v1" as const;

export const NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.independent_numerical_replication,
] as const;

export const NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC =
  "relative_L_inf" as const;

export const NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA = {
  sampleCount: 64,
  refinementLevels: 3,
  observedConvergenceOrder: 1,
  domainCoverageFraction: 1,
} as const;

/**
 * These blockers are derived authority limits, not producer-supplied facts.
 * The current content assessor only re-hashes opaque executor outputs and is
 * deliberately `not_evaluable`; it does not read the declared float64 arrays
 * or recompute the nine relative-L-infinity comparisons. Until a server-owned
 * replay receipt implements and binds every item below, metadata can remain
 * diagnostically useful but cannot establish independent replication.
 */
export const NHM2_INDEPENDENT_NUMERICAL_REPLICATION_SERVER_REPLAY_BLOCKERS = [
  "server_owned_float64_array_readback_recomputation_receipt_missing",
  "server_replay_primary_comparison_projection_manifest_binding_missing",
  "server_replay_independent_field_array_manifest_binding_missing",
  "server_replay_all_nine_field_comparisons_not_recomputed",
] as const;

/**
 * Exact raw-quantity comparison surface for the independent lane. Each
 * primary numerical evidence family is represented, including the complete
 * symmetric stress tensor and the six pre-registered observables. This is a
 * frozen diagnostic comparison ledger, not physical-mechanism authority.
 */
export const NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS = [
  {
    fieldId: "full_apparatus_source_tensor.full_tensor",
    componentOrder: [...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS],
  },
  {
    fieldId: "semiclassical_state.renormalized_full_tensor",
    componentOrder: [...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS],
  },
  {
    fieldId: "covariant_conservation.divergence_four_vector",
    componentOrder: ["nu0", "nu1", "nu2", "nu3"],
  },
  {
    fieldId: "continuous_observer_optimizer.minimum_energy_density",
    componentOrder: ["rho_min"],
  },
  {
    fieldId: "worldline_qei.sampled_bound_and_margin",
    componentOrder: ["sampled_integral", "qei_bound", "qei_margin"],
  },
  {
    fieldId:
      "dynamic_backreaction_stability_causality.constraint_stability_causality",
    componentOrder: [
      "hamiltonian_residual",
      "momentum_residual_x",
      "momentum_residual_y",
      "momentum_residual_z",
      "semiclassical_backreaction_residual",
      "stability_growth_rate",
      "causality_margin",
    ],
  },
  {
    fieldId:
      "finite_temperature_finite_geometry_maxwell_stress.surface_traction_and_gradient",
    componentOrder: [
      "traction_x",
      "traction_y",
      "traction_z",
      "force_gradient",
    ],
  },
  {
    fieldId:
      "mechanical_support_control_margin.stress_displacement_control_margins",
    componentOrder: [
      "displacement",
      "von_mises_stress",
      "fatigue_margin",
      "pull_in_margin",
      "control_energy",
    ],
  },
  {
    fieldId: "prediction_falsifier_freeze.pre_registered_observables",
    componentOrder: [...NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS],
  },
] as const;

export type Nhm2IndependentNumericalReplicationRequiredFieldId =
  (typeof NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS)[number]["fieldId"];

export type Nhm2IndependentNumericalReplicationCheckId =
  (typeof NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_CHECK_IDS)[number];
export type Nhm2IndependentNumericalReplicationStatus =
  "pass" | "blocked" | "fail";

export type Nhm2IndependentNumericalReplicationHashedArtifactV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2IndependentNumericalReplicationFloat64ArrayV1 =
  Nhm2IndependentNumericalReplicationHashedArtifactV1 & {
    dtype: "float64" | null;
    shape: number[];
    sizeBytes: number | null;
    storageOrder: "row-major" | "column-major" | null;
    componentOrder: string[];
  };

export type Nhm2IndependentNumericalReplicationBindingV1 =
  Nhm2IndependentNumericalReplicationHashedArtifactV1 & {
    artifactId: string | null;
    contractVersion: string | null;
  };

export type Nhm2IndependentNumericalReplicationInvocationV1 = {
  entrypoint: string | null;
  command: string | null;
  args: string[];
  cwd: string | null;
  environment: Array<{
    name: string | null;
    valueKind: "literal" | "candidate_manifest_raw_sha256" | null;
    value: string | null;
  }>;
  outputDirectory: string | null;
};

export type Nhm2IndependentNumericalReplicationV1 = {
  contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_REPLICATION_CONTRACT_VERSION;
  generatedAt: string | null;
  identity: {
    candidateId: string | null;
    candidateManifestId: string | null;
    candidateManifest: Nhm2IndependentNumericalReplicationBindingV1;
    numericPolicySet: Nhm2IndependentNumericalReplicationHashedArtifactV1 & {
      policySetId: string | null;
      semanticSha256: string | null;
    };
    laneId: "nhm2_shift_lapse" | null;
    profile: Nhm2IndependentNumericalReplicationBindingV1 & {
      selectedProfileId: string | null;
    };
    chart: Nhm2IndependentNumericalReplicationBindingV1 & {
      chartId: string | null;
    };
    atlas: Nhm2IndependentNumericalReplicationBindingV1 & {
      atlasId: string | null;
    };
    units: Nhm2IndependentNumericalReplicationBindingV1 & {
      unitsId: string | null;
    };
    normalization: Nhm2IndependentNumericalReplicationBindingV1 & {
      normalizationId: string | null;
    };
    candidateGitSha: string | null;
    primaryExecution: {
      requestId: string | null;
      runId: string | null;
      receiptId: string | null;
      runtimeId: string | null;
      solverId: string | null;
      implementationId: string | null;
      independenceGroup: string | null;
    };
    independentPlan: {
      planRole: "independent_numerical" | null;
      requestId: string | null;
      runId: string | null;
      receiptId: string | null;
      runtimeId: string | null;
      sourceCommitSha: string | null;
      deterministicSeed: string | null;
      solver: Nhm2IndependentNumericalReplicationBindingV1 & {
        solverId: string | null;
        solverVersion: string | null;
        implementationId: string | null;
        independenceGroup: string | null;
      };
      environmentLock: Nhm2IndependentNumericalReplicationBindingV1 & {
        environmentId: string | null;
      };
      expectedInvocation: Nhm2IndependentNumericalReplicationInvocationV1;
    };
  };
  coldRun: {
    completed: boolean | null;
    processStateIsolated: boolean | null;
    priorOutputsExcluded: boolean | null;
    cachesDisabledOrPurged: boolean | null;
    scratchWorkspace: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    coldStartLog: Nhm2IndependentNumericalReplicationHashedArtifactV1;
  };
  frozenReplay: {
    candidateInputs: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    replayedInputs: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    candidateMesh: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    replayedMesh: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    candidateEnvironment: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    replayedEnvironment: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    replayTranscript: Nhm2IndependentNumericalReplicationHashedArtifactV1;
  };
  comparison: {
    frozenFieldSet: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    expectedFieldCount: number | null;
    comparedFieldCount: number | null;
    policy: {
      checkId: "field_level_outputs_agree_within_frozen_tolerances" | null;
      comparator: "lte" | null;
      tolerance: number | null;
      unit: typeof NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC | null;
      frozenPolicySha256: string | null;
    };
    fields: Array<{
      fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId | null;
      primaryRawOutput: Nhm2IndependentNumericalReplicationFloat64ArrayV1;
      independentRawOutput: Nhm2IndependentNumericalReplicationFloat64ArrayV1;
      sampleDomain: Nhm2IndependentNumericalReplicationHashedArtifactV1;
      diagnosticCoverage: {
        sampleCount: number | null;
        refinementLevels: number | null;
        observedConvergenceOrder: number | null;
        domainCoverageFraction: number | null;
      };
      metric: typeof NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC | null;
      metricValue: number | null;
      tolerance: number | null;
      unit: typeof NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC | null;
      absoluteUncertainty95: number | null;
    }>;
    maximumMetricValue: number | null;
    rawComparisonTable: Nhm2IndependentNumericalReplicationHashedArtifactV1;
  };
  discrepancyDisposition: {
    uncertaintyConfidenceLevel: number | null;
    uncertaintyBudget: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    entries: Array<{
      discrepancyId: string | null;
      fieldId: string | null;
      classification: string | null;
      disposition: "resolved" | "unresolved" | null;
      absoluteUncertainty95: number | null;
      evidence: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    }>;
    dispositionLog: Nhm2IndependentNumericalReplicationHashedArtifactV1;
  };
  reproducibilityPins: {
    candidateCommitSha: string | null;
    independentCommitSha: string | null;
    candidateContainer: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    independentContainer: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    candidateToolchain: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    independentToolchain: Nhm2IndependentNumericalReplicationHashedArtifactV1;
    candidateSeed: string | null;
    independentSeed: string | null;
    pinLedger: Nhm2IndependentNumericalReplicationHashedArtifactV1;
  };
  checks: Array<{
    checkId: Nhm2IndependentNumericalReplicationCheckId;
    status: Nhm2IndependentNumericalReplicationStatus;
    metricValue: number | null;
    tolerance: number | null;
    unit: string | null;
    blockers: string[];
  }>;
  status: Nhm2IndependentNumericalReplicationStatus;
  independentNumericalReplicationReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    independentComputationOnly: true;
    rawArtifactContainsPreallocatedIdsAndPreRunHashesOnly: true;
    persistedReceiptReferencesForbidden: true;
    postRunEnvelopeReferencesForbidden: true;
    theoryClosureEstablished: false;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
    empiricalValidationEstablished: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2IndependentNumericalReplicationV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "independentNumericalReplicationReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2IndependentNumericalReplicationInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2IndependentNumericalReplicationCheckId;
  missing: string[];
  failures: string[];
  metricValue: number | null;
  tolerance: number | null;
  unit: string | null;
};

const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/i;
const REQUIRED_ENVIRONMENT = [
  "NHM2_ATLAS_SHA256",
  "NHM2_CANDIDATE_ID",
  "NHM2_CANDIDATE_MANIFEST_SHA256",
  "NHM2_CHART_ID",
  "NHM2_NORMALIZATION_SHA256",
  "NHM2_OUTPUT_DIR",
  "NHM2_RUN_ID",
  "NHM2_SELECTED_PROFILE_ID",
  "NHM2_UNITS_SHA256",
  "THEORY_RUNTIME_ID",
  "THEORY_RUNTIME_RECEIPT_ID",
  "THEORY_RUNTIME_REQUEST_ID",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const record = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const boolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;
const unique = (values: string[]): string[] => [...new Set(values)];
const isIsoTimestamp = (value: string): boolean => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const artifact = (
  value: unknown,
): Nhm2IndependentNumericalReplicationHashedArtifactV1 => {
  const source = record(value);
  return { path: text(source.path), sha256: text(source.sha256) };
};

const float64Array = (
  value: unknown,
): Nhm2IndependentNumericalReplicationFloat64ArrayV1 => {
  const source = record(value);
  const shape = Array.isArray(source.shape) ? source.shape.map(finite) : [];
  const componentOrder = Array.isArray(source.componentOrder)
    ? source.componentOrder.map(text)
    : [];
  return {
    ...artifact(source),
    dtype: source.dtype === "float64" ? source.dtype : null,
    shape: shape.every((entry): entry is number => entry != null) ? shape : [],
    sizeBytes: finite(source.sizeBytes),
    storageOrder:
      source.storageOrder === "row-major" ||
      source.storageOrder === "column-major"
        ? source.storageOrder
        : null,
    componentOrder: componentOrder.every(
      (entry): entry is string => entry != null,
    )
      ? componentOrder
      : [],
  };
};

const requiredFieldId = (
  value: unknown,
): Nhm2IndependentNumericalReplicationRequiredFieldId | null =>
  typeof value === "string" &&
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.some(
    (entry) => entry.fieldId === value,
  )
    ? (value as Nhm2IndependentNumericalReplicationRequiredFieldId)
    : null;

const binding = (
  value: unknown,
): Nhm2IndependentNumericalReplicationBindingV1 => {
  const source = record(value);
  return {
    artifactId: text(source.artifactId),
    contractVersion: text(source.contractVersion),
    ...artifact(source),
  };
};

const invocation = (
  value: unknown,
): Nhm2IndependentNumericalReplicationInvocationV1 => {
  const source = record(value);
  return {
    entrypoint: text(source.entrypoint),
    command: text(source.command),
    args: Array.isArray(source.args)
      ? source.args.map(text).filter((entry): entry is string => entry != null)
      : [],
    cwd: text(source.cwd),
    environment: Array.isArray(source.environment)
      ? source.environment.map((raw) => {
          const entry = record(raw);
          return {
            name: text(entry.name),
            valueKind:
              entry.valueKind === "literal" ||
              entry.valueKind === "candidate_manifest_raw_sha256"
                ? entry.valueKind
                : null,
            value: text(entry.value),
          };
        })
      : [],
    outputDirectory: text(source.outputDirectory),
  };
};

const normalize = (
  input: BuildNhm2IndependentNumericalReplicationInput,
): PrimitiveEvidence => {
  const root = record(input);
  const identity = record(root.identity);
  const policy = record(identity.numericPolicySet);
  const profile = record(identity.profile);
  const chart = record(identity.chart);
  const atlas = record(identity.atlas);
  const units = record(identity.units);
  const normalization = record(identity.normalization);
  const primary = record(identity.primaryExecution);
  const plan = record(identity.independentPlan);
  const solver = record(plan.solver);
  const environmentLock = record(plan.environmentLock);
  const coldRun = record(root.coldRun);
  const replay = record(root.frozenReplay);
  const comparison = record(root.comparison);
  const comparisonPolicy = record(comparison.policy);
  const discrepancy = record(root.discrepancyDisposition);
  const pins = record(root.reproducibilityPins);
  return {
    generatedAt: text(root.generatedAt),
    identity: {
      candidateId: text(identity.candidateId),
      candidateManifestId: text(identity.candidateManifestId),
      candidateManifest: binding(identity.candidateManifest),
      numericPolicySet: {
        ...artifact(policy),
        policySetId: text(policy.policySetId),
        semanticSha256: text(policy.semanticSha256),
      },
      laneId: identity.laneId === "nhm2_shift_lapse" ? identity.laneId : null,
      profile: {
        ...binding(profile),
        selectedProfileId: text(profile.selectedProfileId),
      },
      chart: { ...binding(chart), chartId: text(chart.chartId) },
      atlas: { ...binding(atlas), atlasId: text(atlas.atlasId) },
      units: { ...binding(units), unitsId: text(units.unitsId) },
      normalization: {
        ...binding(normalization),
        normalizationId: text(normalization.normalizationId),
      },
      candidateGitSha: text(identity.candidateGitSha),
      primaryExecution: {
        requestId: text(primary.requestId),
        runId: text(primary.runId),
        receiptId: text(primary.receiptId),
        runtimeId: text(primary.runtimeId),
        solverId: text(primary.solverId),
        implementationId: text(primary.implementationId),
        independenceGroup: text(primary.independenceGroup),
      },
      independentPlan: {
        planRole:
          plan.planRole === "independent_numerical" ? plan.planRole : null,
        requestId: text(plan.requestId),
        runId: text(plan.runId),
        receiptId: text(plan.receiptId),
        runtimeId: text(plan.runtimeId),
        sourceCommitSha: text(plan.sourceCommitSha),
        deterministicSeed: text(plan.deterministicSeed),
        solver: {
          ...binding(solver),
          solverId: text(solver.solverId),
          solverVersion: text(solver.solverVersion),
          implementationId: text(solver.implementationId),
          independenceGroup: text(solver.independenceGroup),
        },
        environmentLock: {
          ...binding(environmentLock),
          environmentId: text(environmentLock.environmentId),
        },
        expectedInvocation: invocation(plan.expectedInvocation),
      },
    },
    coldRun: {
      completed: boolean(coldRun.completed),
      processStateIsolated: boolean(coldRun.processStateIsolated),
      priorOutputsExcluded: boolean(coldRun.priorOutputsExcluded),
      cachesDisabledOrPurged: boolean(coldRun.cachesDisabledOrPurged),
      scratchWorkspace: artifact(coldRun.scratchWorkspace),
      coldStartLog: artifact(coldRun.coldStartLog),
    },
    frozenReplay: {
      candidateInputs: artifact(replay.candidateInputs),
      replayedInputs: artifact(replay.replayedInputs),
      candidateMesh: artifact(replay.candidateMesh),
      replayedMesh: artifact(replay.replayedMesh),
      candidateEnvironment: artifact(replay.candidateEnvironment),
      replayedEnvironment: artifact(replay.replayedEnvironment),
      replayTranscript: artifact(replay.replayTranscript),
    },
    comparison: {
      frozenFieldSet: artifact(comparison.frozenFieldSet),
      expectedFieldCount: finite(comparison.expectedFieldCount),
      comparedFieldCount: finite(comparison.comparedFieldCount),
      policy: {
        checkId:
          comparisonPolicy.checkId ===
          "field_level_outputs_agree_within_frozen_tolerances"
            ? comparisonPolicy.checkId
            : null,
        comparator: comparisonPolicy.comparator === "lte" ? "lte" : null,
        tolerance: finite(comparisonPolicy.tolerance),
        unit:
          comparisonPolicy.unit ===
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC
            ? comparisonPolicy.unit
            : null,
        frozenPolicySha256: text(comparisonPolicy.frozenPolicySha256),
      },
      fields: Array.isArray(comparison.fields)
        ? comparison.fields.map((raw) => {
            const field = record(raw);
            const coverage = record(field.diagnosticCoverage);
            return {
              fieldId: requiredFieldId(field.fieldId),
              primaryRawOutput: float64Array(field.primaryRawOutput),
              independentRawOutput: float64Array(field.independentRawOutput),
              sampleDomain: artifact(field.sampleDomain),
              diagnosticCoverage: {
                sampleCount: finite(coverage.sampleCount),
                refinementLevels: finite(coverage.refinementLevels),
                observedConvergenceOrder: finite(
                  coverage.observedConvergenceOrder,
                ),
                domainCoverageFraction: finite(coverage.domainCoverageFraction),
              },
              metric:
                field.metric ===
                NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC
                  ? field.metric
                  : null,
              metricValue: finite(field.metricValue),
              tolerance: finite(field.tolerance),
              unit:
                field.unit ===
                NHM2_INDEPENDENT_NUMERICAL_REPLICATION_FIELD_METRIC
                  ? field.unit
                  : null,
              absoluteUncertainty95: finite(field.absoluteUncertainty95),
            };
          })
        : [],
      maximumMetricValue: finite(comparison.maximumMetricValue),
      rawComparisonTable: artifact(comparison.rawComparisonTable),
    },
    discrepancyDisposition: {
      uncertaintyConfidenceLevel: finite(
        discrepancy.uncertaintyConfidenceLevel,
      ),
      uncertaintyBudget: artifact(discrepancy.uncertaintyBudget),
      entries: Array.isArray(discrepancy.entries)
        ? discrepancy.entries.map((raw) => {
            const entry = record(raw);
            return {
              discrepancyId: text(entry.discrepancyId),
              fieldId: text(entry.fieldId),
              classification: text(entry.classification),
              disposition:
                entry.disposition === "resolved" ||
                entry.disposition === "unresolved"
                  ? entry.disposition
                  : null,
              absoluteUncertainty95: finite(entry.absoluteUncertainty95),
              evidence: artifact(entry.evidence),
            };
          })
        : [],
      dispositionLog: artifact(discrepancy.dispositionLog),
    },
    reproducibilityPins: {
      candidateCommitSha: text(pins.candidateCommitSha),
      independentCommitSha: text(pins.independentCommitSha),
      candidateContainer: artifact(pins.candidateContainer),
      independentContainer: artifact(pins.independentContainer),
      candidateToolchain: artifact(pins.candidateToolchain),
      independentToolchain: artifact(pins.independentToolchain),
      candidateSeed: text(pins.candidateSeed),
      independentSeed: text(pins.independentSeed),
      pinLedger: artifact(pins.pinLedger),
    },
  };
};

const draft = (
  checkId: Nhm2IndependentNumericalReplicationCheckId,
): CheckDraft => ({
  checkId,
  missing: [],
  failures: [],
  metricValue: null,
  tolerance: null,
  unit: null,
});

const requireText = (
  value: string | null,
  label: string,
  check: CheckDraft,
) => {
  if (value == null) check.missing.push(`${label}_missing`);
};
const requireSha = (value: string | null, label: string, check: CheckDraft) => {
  if (value == null) check.missing.push(`${label}_sha256_missing`);
  else if (!SHA256.test(value)) check.failures.push(`${label}_sha256_invalid`);
};
const requireGitSha = (
  value: string | null,
  label: string,
  check: CheckDraft,
) => {
  if (value == null) check.missing.push(`${label}_missing`);
  else if (!GIT_SHA.test(value)) check.failures.push(`${label}_invalid`);
};
const requireArtifact = (
  value: Nhm2IndependentNumericalReplicationHashedArtifactV1,
  label: string,
  check: CheckDraft,
) => {
  requireText(value.path, `${label}_path`, check);
  requireSha(value.sha256, label, check);
};
const arrayElementCount = (shape: readonly number[]): number | null => {
  if (
    shape.length !== 2 ||
    shape.some(
      (dimension) => !Number.isSafeInteger(dimension) || dimension <= 0,
    )
  ) {
    return null;
  }
  const count = shape[0] * shape[1];
  return Number.isSafeInteger(count) ? count : null;
};
const requireFloat64Array = (
  value: Nhm2IndependentNumericalReplicationFloat64ArrayV1,
  label: string,
  expectedComponentOrder: readonly string[],
  check: CheckDraft,
) => {
  requireArtifact(value, label, check);
  if (value.dtype == null) check.missing.push(`${label}_dtype_missing`);
  const elementCount = arrayElementCount(value.shape);
  if (elementCount == null) check.failures.push(`${label}_shape_invalid`);
  if (value.sizeBytes == null)
    check.missing.push(`${label}_size_bytes_missing`);
  else if (
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    (elementCount != null && value.sizeBytes !== elementCount * 8)
  ) {
    check.failures.push(`${label}_size_bytes_invalid`);
  }
  if (value.storageOrder == null)
    check.missing.push(`${label}_storage_order_missing`);
  if (
    value.componentOrder.length !== expectedComponentOrder.length ||
    value.componentOrder.some(
      (component, index) => component !== expectedComponentOrder[index],
    )
  ) {
    check.failures.push(`${label}_component_order_invalid`);
  }
  if (
    value.shape.length === 2 &&
    value.shape[1] !== expectedComponentOrder.length
  ) {
    check.failures.push(`${label}_component_axis_mismatch`);
  }
};
const requireBinding = (
  value: Nhm2IndependentNumericalReplicationBindingV1,
  label: string,
  check: CheckDraft,
) => {
  requireArtifact(value, label, check);
  requireText(value.artifactId, `${label}_artifact_id`, check);
  if (value.contractVersion == null)
    check.missing.push(`${label}_contract_version_missing`);
  else if (!CONTRACT_VERSION.test(value.contractVersion))
    check.failures.push(`${label}_contract_version_invalid`);
};
const requireTrue = (
  value: boolean | null,
  label: string,
  check: CheckDraft,
) => {
  if (value == null) check.missing.push(`${label}_missing`);
  else if (!value) check.failures.push(`${label}_false`);
};

const addIdentityChecks = (
  core: PrimitiveEvidence,
  check: CheckDraft,
): void => {
  const identity = core.identity;
  if (core.generatedAt == null) check.missing.push("generated_at_missing");
  else if (!isIsoTimestamp(core.generatedAt))
    check.failures.push("generated_at_invalid");
  requireText(identity.candidateId, "candidate_id", check);
  requireText(identity.candidateManifestId, "candidate_manifest_id", check);
  requireBinding(identity.candidateManifest, "candidate_manifest", check);
  if (
    identity.candidateManifest.contractVersion != null &&
    identity.candidateManifest.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION
  ) {
    check.failures.push("candidate_manifest_contract_version_mismatch");
  }
  requireArtifact(identity.numericPolicySet, "numeric_policy_set", check);
  requireText(
    identity.numericPolicySet.policySetId,
    "numeric_policy_set_id",
    check,
  );
  requireSha(
    identity.numericPolicySet.semanticSha256,
    "numeric_policy_set_semantic",
    check,
  );
  if (identity.laneId == null) check.missing.push("lane_id_missing");
  requireBinding(identity.profile, "profile", check);
  requireText(identity.profile.selectedProfileId, "selected_profile_id", check);
  requireBinding(identity.chart, "chart", check);
  requireText(identity.chart.chartId, "chart_id", check);
  requireBinding(identity.atlas, "atlas", check);
  requireText(identity.atlas.atlasId, "atlas_id", check);
  requireBinding(identity.units, "units", check);
  requireText(identity.units.unitsId, "units_id", check);
  requireBinding(identity.normalization, "normalization", check);
  requireText(
    identity.normalization.normalizationId,
    "normalization_id",
    check,
  );
  requireGitSha(identity.candidateGitSha, "candidate_git_sha", check);
};

const addInvocationChecks = (
  core: PrimitiveEvidence,
  check: CheckDraft,
): void => {
  const identity = core.identity;
  const plan = identity.independentPlan;
  const invocationValue = plan.expectedInvocation;
  if (plan.planRole == null)
    check.missing.push("independent_plan_role_missing");
  requireText(invocationValue.entrypoint, "planned_entrypoint", check);
  requireText(invocationValue.command, "planned_command", check);
  if (invocationValue.args.length === 0)
    check.missing.push("planned_args_missing");
  requireText(invocationValue.cwd, "planned_cwd", check);
  requireText(
    invocationValue.outputDirectory,
    "planned_output_directory",
    check,
  );
  const names = invocationValue.environment.map((entry) => entry.name);
  if (names.length === 0) {
    check.missing.push("planned_environment_missing");
  } else if (
    names.some((name) => name == null) ||
    new Set(names).size !== names.length ||
    names.length !== REQUIRED_ENVIRONMENT.length ||
    REQUIRED_ENVIRONMENT.some((name) => !names.includes(name))
  ) {
    check.failures.push("planned_environment_key_set_invalid");
  }
  if (
    names.some(
      (name, index) => index > 0 && (name ?? "") < (names[index - 1] ?? ""),
    )
  )
    check.failures.push("planned_environment_not_canonical");
  const expected = new Map<string, string | null>([
    ["NHM2_ATLAS_SHA256", identity.atlas.sha256],
    ["NHM2_CANDIDATE_ID", identity.candidateId],
    ["NHM2_CHART_ID", identity.chart.chartId],
    ["NHM2_NORMALIZATION_SHA256", identity.normalization.sha256],
    ["NHM2_OUTPUT_DIR", invocationValue.outputDirectory],
    ["NHM2_RUN_ID", plan.runId],
    ["NHM2_SELECTED_PROFILE_ID", identity.profile.selectedProfileId],
    ["NHM2_UNITS_SHA256", identity.units.sha256],
    ["THEORY_RUNTIME_ID", plan.runtimeId],
    ["THEORY_RUNTIME_RECEIPT_ID", plan.receiptId],
    ["THEORY_RUNTIME_REQUEST_ID", plan.requestId],
  ]);
  for (const [name, expectedValue] of expected) {
    const entry = invocationValue.environment.find(
      (item) => item.name === name,
    );
    if (entry == null) continue;
    if (entry.valueKind !== "literal" || entry.value !== expectedValue)
      check.failures.push(`planned_environment_${name.toLowerCase()}_mismatch`);
  }
  const manifestEntry = invocationValue.environment.find(
    (entry) => entry.name === "NHM2_CANDIDATE_MANIFEST_SHA256",
  );
  if (
    manifestEntry != null &&
    (manifestEntry.valueKind !== "candidate_manifest_raw_sha256" ||
      manifestEntry.value !== null)
  ) {
    check.failures.push("planned_candidate_manifest_sha_resolver_invalid");
  }
};

const deriveChecks = (core: PrimitiveEvidence): CheckDraft[] => {
  const checks = new Map(
    NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_CHECK_IDS.map((id) => [
      id,
      draft(id),
    ]),
  );
  const get = (id: Nhm2IndependentNumericalReplicationCheckId) =>
    checks.get(id)!;

  const cold = get("independent_cold_run_completed");
  requireTrue(core.coldRun.completed, "cold_run_completed", cold);
  requireTrue(
    core.coldRun.processStateIsolated,
    "cold_process_state_isolated",
    cold,
  );
  requireTrue(
    core.coldRun.priorOutputsExcluded,
    "prior_outputs_excluded",
    cold,
  );
  requireTrue(
    core.coldRun.cachesDisabledOrPurged,
    "caches_disabled_or_purged",
    cold,
  );
  requireArtifact(
    core.coldRun.scratchWorkspace,
    "cold_scratch_workspace",
    cold,
  );
  requireArtifact(core.coldRun.coldStartLog, "cold_start_log", cold);

  const independent = get("independent_solver_and_implementation_used");
  addIdentityChecks(core, independent);
  addInvocationChecks(core, independent);
  const primary = core.identity.primaryExecution;
  const plan = core.identity.independentPlan;
  for (const [label, value] of Object.entries(primary))
    requireText(value, `primary_${label}`, independent);
  for (const [label, value] of [
    ["request_id", plan.requestId],
    ["run_id", plan.runId],
    ["receipt_id", plan.receiptId],
    ["runtime_id", plan.runtimeId],
    ["source_commit_sha", plan.sourceCommitSha],
    ["deterministic_seed", plan.deterministicSeed],
  ] as const)
    requireText(value, `independent_${label}`, independent);
  requireGitSha(
    plan.sourceCommitSha,
    "independent_source_commit_sha",
    independent,
  );
  requireBinding(plan.solver, "independent_solver", independent);
  requireText(plan.solver.solverId, "independent_solver_id", independent);
  requireText(
    plan.solver.solverVersion,
    "independent_solver_version",
    independent,
  );
  requireText(
    plan.solver.implementationId,
    "independent_implementation_id",
    independent,
  );
  requireText(plan.solver.independenceGroup, "independent_group", independent);
  requireBinding(
    plan.environmentLock,
    "independent_environment_lock",
    independent,
  );
  requireText(
    plan.environmentLock.environmentId,
    "independent_environment_id",
    independent,
  );
  const distinctPairs = [
    ["request", primary.requestId, plan.requestId],
    ["run", primary.runId, plan.runId],
    ["receipt", primary.receiptId, plan.receiptId],
    ["runtime", primary.runtimeId, plan.runtimeId],
    ["solver", primary.solverId, plan.solver.solverId],
    ["implementation", primary.implementationId, plan.solver.implementationId],
    [
      "independence_group",
      primary.independenceGroup,
      plan.solver.independenceGroup,
    ],
  ] as const;
  for (const [label, left, right] of distinctPairs) {
    if (left != null && right != null && left === right)
      independent.failures.push(`independent_${label}_not_distinct`);
  }
  if (
    plan.requestId != null &&
    plan.runtimeId != null &&
    plan.receiptId != null &&
    plan.receiptId !==
      nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
        plan.runtimeId,
        plan.requestId,
      )
  ) {
    independent.failures.push("independent_receipt_id_not_deterministic");
  }

  const replay = get("frozen_inputs_mesh_environment_replayed");
  const replayPairs = [
    [
      "inputs",
      core.frozenReplay.candidateInputs,
      core.frozenReplay.replayedInputs,
    ],
    ["mesh", core.frozenReplay.candidateMesh, core.frozenReplay.replayedMesh],
    [
      "environment",
      core.frozenReplay.candidateEnvironment,
      core.frozenReplay.replayedEnvironment,
    ],
  ] as const;
  for (const [label, expectedArtifact, actualArtifact] of replayPairs) {
    requireArtifact(expectedArtifact, `candidate_${label}`, replay);
    requireArtifact(actualArtifact, `replayed_${label}`, replay);
    if (
      expectedArtifact.sha256 != null &&
      actualArtifact.sha256 != null &&
      expectedArtifact.sha256 !== actualArtifact.sha256
    )
      replay.failures.push(`frozen_${label}_hash_mismatch`);
  }
  requireArtifact(
    core.frozenReplay.replayTranscript,
    "frozen_replay_transcript",
    replay,
  );
  if (
    core.frozenReplay.candidateEnvironment.sha256 != null &&
    plan.environmentLock.sha256 != null &&
    core.frozenReplay.candidateEnvironment.sha256 !==
      plan.environmentLock.sha256
  )
    replay.failures.push("candidate_environment_not_plan_environment_lock");

  const fields = get("field_level_outputs_agree_within_frozen_tolerances");
  // Comparison values and hashes in this raw artifact are producer-declared
  // metadata. They cannot promote themselves. The future passing path must be
  // a distinct server-owned filesystem readback/recomputation receipt bound to
  // the strict primary projection and independent field-array manifests.
  fields.missing.push(
    ...NHM2_INDEPENDENT_NUMERICAL_REPLICATION_SERVER_REPLAY_BLOCKERS,
  );
  const authoritative =
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES.field_level_outputs_agree_within_frozen_tolerances;
  fields.tolerance = core.comparison.policy.tolerance;
  fields.unit = core.comparison.policy.unit;
  fields.metricValue = core.comparison.maximumMetricValue;
  requireArtifact(core.comparison.frozenFieldSet, "frozen_field_set", fields);
  requireArtifact(
    core.comparison.rawComparisonTable,
    "raw_comparison_table",
    fields,
  );
  if (core.comparison.policy.checkId == null)
    fields.missing.push("field_policy_check_id_missing");
  if (core.comparison.policy.comparator == null)
    fields.missing.push("field_policy_comparator_missing");
  if (core.comparison.policy.tolerance == null)
    fields.missing.push("field_policy_tolerance_missing");
  else if (core.comparison.policy.tolerance !== authoritative.threshold)
    fields.failures.push("field_policy_tolerance_not_authoritative");
  if (core.comparison.policy.unit == null)
    fields.missing.push("field_policy_unit_missing");
  requireSha(
    core.comparison.policy.frozenPolicySha256,
    "field_frozen_policy",
    fields,
  );
  if (core.comparison.expectedFieldCount == null) {
    fields.missing.push("expected_field_count_missing");
  } else if (
    !Number.isInteger(core.comparison.expectedFieldCount) ||
    core.comparison.expectedFieldCount !==
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length
  ) {
    fields.failures.push("expected_field_count_not_frozen_required_count");
  }
  if (core.comparison.comparedFieldCount == null) {
    fields.missing.push("compared_field_count_missing");
  } else if (
    !Number.isInteger(core.comparison.comparedFieldCount) ||
    core.comparison.comparedFieldCount !==
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length
  ) {
    fields.failures.push("compared_field_count_not_frozen_required_count");
  }
  if (
    core.comparison.expectedFieldCount != null &&
    core.comparison.comparedFieldCount != null &&
    core.comparison.expectedFieldCount !== core.comparison.comparedFieldCount
  )
    fields.failures.push("field_set_not_fully_compared");
  if (
    core.comparison.comparedFieldCount != null &&
    core.comparison.fields.length !== core.comparison.comparedFieldCount
  )
    fields.failures.push("field_comparison_cardinality_mismatch");
  const fieldIds = core.comparison.fields.map((entry) => entry.fieldId);
  if (
    fieldIds.some((entry) => entry == null) ||
    new Set(fieldIds).size !== fieldIds.length
  )
    fields.failures.push("field_ids_missing_or_duplicate");
  if (core.comparison.fields.length === 0) {
    fields.missing.push("frozen_required_field_set_missing");
  } else if (
    core.comparison.fields.length !==
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length ||
    core.comparison.fields.some(
      (entry, index) =>
        entry.fieldId !==
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[index]?.fieldId,
    )
  ) {
    fields.failures.push("frozen_required_field_set_or_order_mismatch");
  }
  for (const [index, entry] of core.comparison.fields.entries()) {
    const label = `field_${entry.fieldId ?? "unknown"}`;
    const definition =
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS[index];
    const expectedComponentOrder = definition?.componentOrder ?? [];
    requireFloat64Array(
      entry.primaryRawOutput,
      `${label}_primary_raw`,
      expectedComponentOrder,
      fields,
    );
    requireFloat64Array(
      entry.independentRawOutput,
      `${label}_independent_raw`,
      expectedComponentOrder,
      fields,
    );
    requireArtifact(entry.sampleDomain, `${label}_sample_domain`, fields);
    if (
      entry.primaryRawOutput.path != null &&
      entry.independentRawOutput.path != null &&
      entry.primaryRawOutput.path === entry.independentRawOutput.path
    ) {
      fields.failures.push(`${label}_raw_output_paths_not_distinct`);
    }
    if (
      entry.primaryRawOutput.shape.length > 0 &&
      (entry.primaryRawOutput.shape.length !==
        entry.independentRawOutput.shape.length ||
        entry.primaryRawOutput.shape.some(
          (dimension, dimensionIndex) =>
            dimension !== entry.independentRawOutput.shape[dimensionIndex],
        ))
    ) {
      fields.failures.push(`${label}_raw_output_shape_mismatch`);
    }
    if (
      entry.primaryRawOutput.storageOrder != null &&
      entry.independentRawOutput.storageOrder != null &&
      entry.primaryRawOutput.storageOrder !==
        entry.independentRawOutput.storageOrder
    ) {
      fields.failures.push(`${label}_raw_output_storage_order_mismatch`);
    }
    const coverage = entry.diagnosticCoverage;
    if (
      coverage.sampleCount == null ||
      !Number.isSafeInteger(coverage.sampleCount) ||
      coverage.sampleCount <
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.sampleCount
    ) {
      fields.failures.push(`${label}_diagnostic_sample_count_below_minimum`);
    }
    if (
      coverage.refinementLevels == null ||
      !Number.isSafeInteger(coverage.refinementLevels) ||
      coverage.refinementLevels <
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.refinementLevels
    ) {
      fields.failures.push(
        `${label}_diagnostic_refinement_levels_below_minimum`,
      );
    }
    if (
      coverage.observedConvergenceOrder == null ||
      coverage.observedConvergenceOrder <
        NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.observedConvergenceOrder
    ) {
      fields.failures.push(
        `${label}_diagnostic_convergence_order_below_minimum`,
      );
    }
    if (
      coverage.domainCoverageFraction !==
      NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.domainCoverageFraction
    ) {
      fields.failures.push(`${label}_diagnostic_domain_coverage_incomplete`);
    }
    if (
      coverage.sampleCount != null &&
      (entry.primaryRawOutput.shape[0] !== coverage.sampleCount ||
        entry.independentRawOutput.shape[0] !== coverage.sampleCount)
    ) {
      fields.failures.push(`${label}_diagnostic_sample_shape_mismatch`);
    }
    if (entry.metric == null) fields.missing.push(`${label}_metric_missing`);
    if (entry.unit == null) fields.missing.push(`${label}_unit_missing`);
    if (entry.tolerance == null)
      fields.missing.push(`${label}_tolerance_missing`);
    else if (entry.tolerance !== authoritative.threshold)
      fields.failures.push(`${label}_tolerance_not_authoritative`);
    if (entry.metricValue == null)
      fields.missing.push(`${label}_metric_value_missing`);
    else if (entry.metricValue < 0)
      fields.failures.push(`${label}_metric_value_invalid`);
    else if (entry.metricValue > authoritative.threshold)
      fields.failures.push(`${label}_metric_exceeds_tolerance`);
    if (entry.absoluteUncertainty95 == null)
      fields.missing.push(`${label}_uncertainty_missing`);
    else if (entry.absoluteUncertainty95 < 0)
      fields.failures.push(`${label}_uncertainty_invalid`);
  }
  const derivedMaximum =
    core.comparison.fields.length > 0 &&
    core.comparison.fields.every((entry) => entry.metricValue != null)
      ? Math.max(...core.comparison.fields.map((entry) => entry.metricValue!))
      : null;
  if (core.comparison.maximumMetricValue == null)
    fields.missing.push("maximum_field_metric_missing");
  else if (core.comparison.maximumMetricValue < 0)
    fields.failures.push("maximum_field_metric_invalid");
  else if (core.comparison.maximumMetricValue > authoritative.threshold)
    fields.failures.push("maximum_field_metric_exceeds_tolerance");
  if (
    derivedMaximum != null &&
    core.comparison.maximumMetricValue != null &&
    derivedMaximum !== core.comparison.maximumMetricValue
  )
    fields.failures.push("maximum_field_metric_not_derived_from_fields");

  const disposition = get("discrepancies_and_uncertainties_dispositioned");
  if (
    core.discrepancyDisposition.uncertaintyConfidenceLevel == null ||
    core.discrepancyDisposition.uncertaintyConfidenceLevel < 0.95 ||
    core.discrepancyDisposition.uncertaintyConfidenceLevel >= 1
  )
    disposition.missing.push("uncertainty_confidence_level_unqualified");
  requireArtifact(
    core.discrepancyDisposition.uncertaintyBudget,
    "discrepancy_uncertainty_budget",
    disposition,
  );
  requireArtifact(
    core.discrepancyDisposition.dispositionLog,
    "discrepancy_disposition_log",
    disposition,
  );
  const discrepancyIds = core.discrepancyDisposition.entries.map(
    (entry) => entry.discrepancyId,
  );
  if (new Set(discrepancyIds).size !== discrepancyIds.length)
    disposition.failures.push("discrepancy_ids_not_unique");
  for (const entry of core.discrepancyDisposition.entries) {
    requireText(entry.discrepancyId, "discrepancy_id", disposition);
    requireText(entry.fieldId, "discrepancy_field_id", disposition);
    requireText(
      entry.classification,
      "discrepancy_classification",
      disposition,
    );
    if (entry.disposition == null)
      disposition.missing.push("discrepancy_disposition_missing");
    else if (entry.disposition === "unresolved")
      disposition.failures.push(
        `discrepancy_${entry.discrepancyId ?? "unknown"}_unresolved`,
      );
    if (entry.absoluteUncertainty95 == null)
      disposition.missing.push("discrepancy_uncertainty_missing");
    else if (entry.absoluteUncertainty95 < 0)
      disposition.failures.push("discrepancy_uncertainty_invalid");
    requireArtifact(entry.evidence, "discrepancy_evidence", disposition);
  }

  const pins = get("commits_containers_toolchains_seeds_pinned");
  requireGitSha(
    core.reproducibilityPins.candidateCommitSha,
    "candidate_commit_sha",
    pins,
  );
  requireGitSha(
    core.reproducibilityPins.independentCommitSha,
    "independent_commit_sha",
    pins,
  );
  requireArtifact(
    core.reproducibilityPins.candidateContainer,
    "candidate_container",
    pins,
  );
  requireArtifact(
    core.reproducibilityPins.independentContainer,
    "independent_container",
    pins,
  );
  requireArtifact(
    core.reproducibilityPins.candidateToolchain,
    "candidate_toolchain",
    pins,
  );
  requireArtifact(
    core.reproducibilityPins.independentToolchain,
    "independent_toolchain",
    pins,
  );
  requireText(core.reproducibilityPins.candidateSeed, "candidate_seed", pins);
  requireText(
    core.reproducibilityPins.independentSeed,
    "independent_seed",
    pins,
  );
  requireArtifact(
    core.reproducibilityPins.pinLedger,
    "reproducibility_pin_ledger",
    pins,
  );
  if (
    core.reproducibilityPins.candidateCommitSha != null &&
    core.reproducibilityPins.candidateCommitSha !==
      core.identity.candidateGitSha
  )
    pins.failures.push("candidate_commit_not_candidate_git_sha");
  if (
    core.reproducibilityPins.independentCommitSha != null &&
    core.reproducibilityPins.independentCommitSha !== plan.sourceCommitSha
  )
    pins.failures.push("independent_commit_not_planned_source_commit");
  if (
    core.reproducibilityPins.independentSeed != null &&
    core.reproducibilityPins.independentSeed !== plan.deterministicSeed
  )
    pins.failures.push("independent_seed_not_planned_seed");

  return [...checks.values()];
};

const result = (check: CheckDraft) => ({
  checkId: check.checkId,
  status: (check.failures.length > 0
    ? "fail"
    : check.missing.length > 0
      ? "blocked"
      : "pass") as Nhm2IndependentNumericalReplicationStatus,
  metricValue: check.metricValue,
  tolerance: check.tolerance,
  unit: check.unit,
  blockers: unique([...check.missing, ...check.failures]),
});

export const buildNhm2IndependentNumericalReplication = (
  input: BuildNhm2IndependentNumericalReplicationInput = {},
): Nhm2IndependentNumericalReplicationV1 => {
  const core = normalize(input);
  const checks = deriveChecks(core).map(result);
  const blockers = checks.flatMap((check) =>
    check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
  );
  const status: Nhm2IndependentNumericalReplicationStatus = checks.some(
    (check) => check.status === "fail",
  )
    ? "fail"
    : checks.some((check) => check.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    contractVersion: NHM2_INDEPENDENT_NUMERICAL_REPLICATION_CONTRACT_VERSION,
    ...core,
    checks,
    status,
    independentNumericalReplicationReady: status === "pass",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      independentComputationOnly: true,
      rawArtifactContainsPreallocatedIdsAndPreRunHashesOnly: true,
      persistedReceiptReferencesForbidden: true,
      postRunEnvelopeReferencesForbidden: true,
      theoryClosureEstablished: false,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
      empiricalValidationEstablished: false,
    },
  };
};

const isJson = (value: unknown): boolean => {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJson);
  return isRecord(value) && Object.values(value).every(isJson);
};
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])]),
  );
};

export const isNhm2IndependentNumericalReplication = (
  value: unknown,
): value is Nhm2IndependentNumericalReplicationV1 => {
  if (!isRecord(value) || !isJson(value)) return false;
  if (
    value.contractVersion !==
    NHM2_INDEPENDENT_NUMERICAL_REPLICATION_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2IndependentNumericalReplication({
    generatedAt: value.generatedAt,
    identity: value.identity,
    coldRun: value.coldRun,
    frozenReplay: value.frozenReplay,
    comparison: value.comparison,
    discrepancyDisposition: value.discrepancyDisposition,
    reproducibilityPins: value.reproducibilityPins,
  } as BuildNhm2IndependentNumericalReplicationInput);
  return (
    JSON.stringify(canonical(value)) === JSON.stringify(canonical(rebuilt))
  );
};
