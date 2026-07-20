import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";

export const NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION =
  "nhm2_full_apparatus_source_tensor/v1" as const;

export const NHM2_FULL_APPARATUS_SOURCE_TENSOR_REQUIRED_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.full_apparatus_source_tensor,
] as const;

export const NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS = [
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
] as const;

export const NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS = [
  "casimir_material_field",
  "supports",
  "anchors",
  "housing",
  "controls",
  "switching_return",
  "thermal_return",
  "electromagnetic_return",
  "mechanical_return",
] as const;

export const NHM2_FULL_APPARATUS_SOURCE_TENSOR_REGIONS = [
  "hull",
  "wall",
  "exterior_shell",
] as const;

export type Nhm2FullApparatusSourceTensorCheckId =
  (typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_REQUIRED_CHECK_IDS)[number];
export type Nhm2FullApparatusSourceTensorComponent =
  (typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS)[number];
export type Nhm2FullApparatusSourceTensorTerm =
  (typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS)[number];
export type Nhm2FullApparatusSourceTensorRegion =
  (typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_REGIONS)[number];
export type Nhm2FullApparatusSourceTensorStatus = "pass" | "blocked" | "fail";

export type Nhm2FullApparatusSourceTensorHashedArtifactV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2FullApparatusSourceTensorFloat64ArrayV1 =
  Nhm2FullApparatusSourceTensorHashedArtifactV1 & {
    dtype: "float64" | null;
    shape: Array<number | null>;
    sizeBytes: number | null;
    storageOrder: "row-major" | "column-major" | null;
    /** Empty only when the array has no T_mu_nu component axis. */
    componentOrder: Array<Nhm2FullApparatusSourceTensorComponent | null>;
  };

export type Nhm2FullApparatusSourceTensorMetricV1 = {
  metricId: string;
  value: number | null;
  tolerance: number | null;
  comparator: "eq" | "gt" | "gte" | "lte";
  unit: string;
};

type BoundFrameV1 = {
  chartId: string | null;
  basis: "coordinate" | null;
  tensorIndexPosition: "covariant" | null;
  unit: "J/m^3" | null;
  atlasSha256: string | null;
  unitsSha256: string | null;
  normalizationSha256: string | null;
};

export type Nhm2FullApparatusSourceTensorV1 = {
  contractVersion: typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION;
  generatedAt: string | null;
  identity: {
    candidateId: string | null;
    candidateManifestSha256: string | null;
    preRunManifest: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    laneId: "nhm2_shift_lapse" | null;
    runId: string | null;
    requestId: string | null;
    receiptId: string | null;
    runtimeId: string | null;
    selectedProfileId: string | null;
    selectedProfile: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    chartId: string | null;
    atlas: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    units: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    normalization: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    gitSha: string | null;
  };
  frozenFrame: {
    sourceFrame: BoundFrameV1;
    metricFrame: BoundFrameV1;
    componentOrder: Array<Nhm2FullApparatusSourceTensorComponent | null>;
    tensorSymmetry: "symmetric" | null;
    dtype: "float64" | null;
    endianness: "little" | "big" | null;
    arrayShape: number[];
    spatialSampleCount: number | null;
    timeSampleCount: number | null;
    sampleIndex: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    regionsFormDisjointPartition: boolean | null;
    regionMasks: Array<{
      region: Nhm2FullApparatusSourceTensorRegion | null;
      mask: Nhm2FullApparatusSourceTensorHashedArtifactV1;
      admittedSampleCount: number | null;
      evaluatedSampleCount: number | null;
    }>;
  };
  sourceTensor: {
    rawTotalTensorArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    componentLedger: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    components: Array<{
      component: Nhm2FullApparatusSourceTensorComponent | null;
      rawArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
      sampleCount: number | null;
      minSI: number | null;
      maxSI: number | null;
      l2NormSI: number | null;
    }>;
    constitutiveRegistry: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    constitutiveEquationSet: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    decompositionLedger: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    terms: Array<{
      term: Nhm2FullApparatusSourceTensorTerm | null;
      producerFieldId: string | null;
      sourceField: Nhm2FullApparatusSourceTensorHashedArtifactV1;
      constitutiveDerivation: Nhm2FullApparatusSourceTensorHashedArtifactV1;
      rawTensorArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
      couplingCoefficientArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
      sampleCount: number | null;
      returnedToSourceTensor: boolean | null;
    }>;
  };
  sourceProvenanceDag: {
    graph: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    nodeIndex: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    edgeIndex: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    independentEchoAudit: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    auditMethod: string | null;
    sourceRootCount: number | null;
    metricTargetDependencyCount: number | null;
    forbiddenTargetEchoCount: number | null;
    metricTargetInputsUsed: string[];
  };
  metricComparison: {
    metricRouteId: string | null;
    metricImplementationId: string | null;
    metricSolver: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    metricEnvironment: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    metricInvocation: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    rawMetricTensorArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    rawRequiredSourceTensorArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    metricSignalNormSI: number | null;
    metricSignalNumericalFloorSI: number | null;
    gridResolutions: number[];
    observedConvergenceOrder: number | null;
    minimumConvergenceOrder: number | null;
    crossGridRelativeDifferenceUpper95: number | null;
    crossGridRelativeDifferenceTolerance: number | null;
    gridConvergenceStudy: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    confidenceLevel: number | null;
    absoluteResidualUpper95SI: number | null;
    absoluteResidualToleranceSI: number | null;
    relativeResidualUpper95: number | null;
    relativeResidualTolerance: number | null;
    rawAbsoluteResidualArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    rawRelativeResidualArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    uncertaintyBudget: Nhm2FullApparatusSourceTensorHashedArtifactV1;
  };
  evolutionCoupling: {
    evolutionSolver: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    evolutionEnvironment: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    evolutionInvocation: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    sourceTensorInputSha256: string | null;
    coupledStateArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    couplingResidualArray: Nhm2FullApparatusSourceTensorFloat64ArrayV1;
    backreactionIterationCount: number | null;
    evolvedTimestepCount: number | null;
    evolvedDurationSeconds: number | null;
    feedbackEnabled: boolean | null;
    couplingResidualMax: number | null;
    couplingResidualTolerance: number | null;
  };
  provenance: {
    producerId: string | null;
    implementationId: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    environment: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    invocation: Nhm2FullApparatusSourceTensorHashedArtifactV1;
    command: string | null;
    argv: string[];
    workingDirectory: string | null;
    inputManifest: Nhm2FullApparatusSourceTensorHashedArtifactV1;
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
    checkId: Nhm2FullApparatusSourceTensorCheckId;
    status: Nhm2FullApparatusSourceTensorStatus;
    blockers: string[];
    metrics: Nhm2FullApparatusSourceTensorMetricV1[];
  }>;
  status: Nhm2FullApparatusSourceTensorStatus;
  fullApparatusSourceTensorReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    contractPassIsNotPhysicalValidation: true;
    fullApparatusSourceTensorEvidenceOnly: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2FullApparatusSourceTensorV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "fullApparatusSourceTensorReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2FullApparatusSourceTensorInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2FullApparatusSourceTensorCheckId;
  missing: string[];
  failures: string[];
  metrics: Nhm2FullApparatusSourceTensorMetricV1[];
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
): Nhm2FullApparatusSourceTensorHashedArtifactV1 => {
  const record = asRecord(value);
  return { path: asText(record.path), sha256: asText(record.sha256) };
};

const normalizeComponentOrder = (
  value: unknown,
): Array<Nhm2FullApparatusSourceTensorComponent | null> =>
  Array.isArray(value)
    ? value.map((component) =>
        NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS.includes(
          component as Nhm2FullApparatusSourceTensorComponent,
        )
          ? (component as Nhm2FullApparatusSourceTensorComponent)
          : null,
      )
    : [];

const normalizeFloat64Array = (
  value: unknown,
): Nhm2FullApparatusSourceTensorFloat64ArrayV1 => {
  const record = asRecord(value);
  return {
    ...normalizeArtifact(record),
    dtype: record.dtype === "float64" ? "float64" : null,
    shape: Array.isArray(record.shape) ? record.shape.map(toFinite) : [],
    sizeBytes: toFinite(record.sizeBytes),
    storageOrder:
      record.storageOrder === "row-major" ||
      record.storageOrder === "column-major"
        ? record.storageOrder
        : null,
    componentOrder: normalizeComponentOrder(record.componentOrder),
  };
};

const normalizeFrame = (value: unknown): BoundFrameV1 => {
  const record = asRecord(value);
  return {
    chartId: asText(record.chartId),
    basis: record.basis === "coordinate" ? "coordinate" : null,
    tensorIndexPosition:
      record.tensorIndexPosition === "covariant" ? "covariant" : null,
    unit: record.unit === "J/m^3" ? "J/m^3" : null,
    atlasSha256: asText(record.atlasSha256),
    unitsSha256: asText(record.unitsSha256),
    normalizationSha256: asText(record.normalizationSha256),
  };
};

const normalizePrimitive = (
  input: BuildNhm2FullApparatusSourceTensorInput,
): PrimitiveEvidence => {
  const root = asRecord(input);
  const identity = asRecord(root.identity);
  const frame = asRecord(root.frozenFrame);
  const source = asRecord(root.sourceTensor);
  const dag = asRecord(root.sourceProvenanceDag);
  const comparison = asRecord(root.metricComparison);
  const evolution = asRecord(root.evolutionCoupling);
  const provenance = asRecord(root.provenance);
  const components = Array.isArray(source.components) ? source.components : [];
  const terms = Array.isArray(source.terms) ? source.terms : [];
  const masks = Array.isArray(frame.regionMasks) ? frame.regionMasks : [];
  const componentOrder = Array.isArray(frame.componentOrder)
    ? frame.componentOrder
    : [];
  const numberArray = (value: unknown): number[] =>
    Array.isArray(value)
      ? value.map(toFinite).filter((entry): entry is number => entry != null)
      : [];
  const textArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.map(asText).filter((entry): entry is string => entry != null)
      : [];

  return {
    generatedAt: asText(root.generatedAt),
    identity: {
      candidateId: asText(identity.candidateId),
      candidateManifestSha256: asText(identity.candidateManifestSha256),
      preRunManifest: normalizeArtifact(identity.preRunManifest),
      laneId:
        identity.laneId === "nhm2_shift_lapse" ? "nhm2_shift_lapse" : null,
      runId: asText(identity.runId),
      requestId: asText(identity.requestId),
      receiptId: asText(identity.receiptId),
      runtimeId: asText(identity.runtimeId),
      selectedProfileId: asText(identity.selectedProfileId),
      selectedProfile: normalizeArtifact(identity.selectedProfile),
      chartId: asText(identity.chartId),
      atlas: normalizeArtifact(identity.atlas),
      units: normalizeArtifact(identity.units),
      normalization: normalizeArtifact(identity.normalization),
      gitSha: asText(identity.gitSha),
    },
    frozenFrame: {
      sourceFrame: normalizeFrame(frame.sourceFrame),
      metricFrame: normalizeFrame(frame.metricFrame),
      componentOrder: normalizeComponentOrder(componentOrder),
      tensorSymmetry: frame.tensorSymmetry === "symmetric" ? "symmetric" : null,
      dtype: frame.dtype === "float64" ? "float64" : null,
      endianness:
        frame.endianness === "little" || frame.endianness === "big"
          ? frame.endianness
          : null,
      arrayShape: numberArray(frame.arrayShape),
      spatialSampleCount: toFinite(frame.spatialSampleCount),
      timeSampleCount: toFinite(frame.timeSampleCount),
      sampleIndex: normalizeArtifact(frame.sampleIndex),
      regionsFormDisjointPartition: toBoolean(
        frame.regionsFormDisjointPartition,
      ),
      regionMasks: masks.map((value) => {
        const entry = asRecord(value);
        return {
          region: NHM2_FULL_APPARATUS_SOURCE_TENSOR_REGIONS.includes(
            entry.region as Nhm2FullApparatusSourceTensorRegion,
          )
            ? (entry.region as Nhm2FullApparatusSourceTensorRegion)
            : null,
          mask: normalizeArtifact(entry.mask),
          admittedSampleCount: toFinite(entry.admittedSampleCount),
          evaluatedSampleCount: toFinite(entry.evaluatedSampleCount),
        };
      }),
    },
    sourceTensor: {
      rawTotalTensorArray: normalizeFloat64Array(source.rawTotalTensorArray),
      componentLedger: normalizeArtifact(source.componentLedger),
      components: components.map((value) => {
        const entry = asRecord(value);
        return {
          component: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS.includes(
            entry.component as Nhm2FullApparatusSourceTensorComponent,
          )
            ? (entry.component as Nhm2FullApparatusSourceTensorComponent)
            : null,
          rawArray: normalizeFloat64Array(entry.rawArray),
          sampleCount: toFinite(entry.sampleCount),
          minSI: toFinite(entry.minSI),
          maxSI: toFinite(entry.maxSI),
          l2NormSI: toFinite(entry.l2NormSI),
        };
      }),
      constitutiveRegistry: normalizeArtifact(source.constitutiveRegistry),
      constitutiveEquationSet: normalizeArtifact(
        source.constitutiveEquationSet,
      ),
      decompositionLedger: normalizeArtifact(source.decompositionLedger),
      terms: terms.map((value) => {
        const entry = asRecord(value);
        return {
          term: NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS.includes(
            entry.term as Nhm2FullApparatusSourceTensorTerm,
          )
            ? (entry.term as Nhm2FullApparatusSourceTensorTerm)
            : null,
          producerFieldId: asText(entry.producerFieldId),
          sourceField: normalizeArtifact(entry.sourceField),
          constitutiveDerivation: normalizeArtifact(
            entry.constitutiveDerivation,
          ),
          rawTensorArray: normalizeFloat64Array(entry.rawTensorArray),
          couplingCoefficientArray: normalizeFloat64Array(
            entry.couplingCoefficientArray,
          ),
          sampleCount: toFinite(entry.sampleCount),
          returnedToSourceTensor: toBoolean(entry.returnedToSourceTensor),
        };
      }),
    },
    sourceProvenanceDag: {
      graph: normalizeArtifact(dag.graph),
      nodeIndex: normalizeArtifact(dag.nodeIndex),
      edgeIndex: normalizeArtifact(dag.edgeIndex),
      independentEchoAudit: normalizeArtifact(dag.independentEchoAudit),
      auditMethod: asText(dag.auditMethod),
      sourceRootCount: toFinite(dag.sourceRootCount),
      metricTargetDependencyCount: toFinite(dag.metricTargetDependencyCount),
      forbiddenTargetEchoCount: toFinite(dag.forbiddenTargetEchoCount),
      metricTargetInputsUsed: textArray(dag.metricTargetInputsUsed),
    },
    metricComparison: {
      metricRouteId: asText(comparison.metricRouteId),
      metricImplementationId: asText(comparison.metricImplementationId),
      metricSolver: normalizeArtifact(comparison.metricSolver),
      metricEnvironment: normalizeArtifact(comparison.metricEnvironment),
      metricInvocation: normalizeArtifact(comparison.metricInvocation),
      rawMetricTensorArray: normalizeFloat64Array(
        comparison.rawMetricTensorArray,
      ),
      rawRequiredSourceTensorArray: normalizeFloat64Array(
        comparison.rawRequiredSourceTensorArray,
      ),
      metricSignalNormSI: toFinite(comparison.metricSignalNormSI),
      metricSignalNumericalFloorSI: toFinite(
        comparison.metricSignalNumericalFloorSI,
      ),
      gridResolutions: numberArray(comparison.gridResolutions),
      observedConvergenceOrder: toFinite(comparison.observedConvergenceOrder),
      minimumConvergenceOrder: toFinite(comparison.minimumConvergenceOrder),
      crossGridRelativeDifferenceUpper95: toFinite(
        comparison.crossGridRelativeDifferenceUpper95,
      ),
      crossGridRelativeDifferenceTolerance: toFinite(
        comparison.crossGridRelativeDifferenceTolerance,
      ),
      gridConvergenceStudy: normalizeArtifact(comparison.gridConvergenceStudy),
      confidenceLevel: toFinite(comparison.confidenceLevel),
      absoluteResidualUpper95SI: toFinite(comparison.absoluteResidualUpper95SI),
      absoluteResidualToleranceSI: toFinite(
        comparison.absoluteResidualToleranceSI,
      ),
      relativeResidualUpper95: toFinite(comparison.relativeResidualUpper95),
      relativeResidualTolerance: toFinite(comparison.relativeResidualTolerance),
      rawAbsoluteResidualArray: normalizeFloat64Array(
        comparison.rawAbsoluteResidualArray,
      ),
      rawRelativeResidualArray: normalizeFloat64Array(
        comparison.rawRelativeResidualArray,
      ),
      uncertaintyBudget: normalizeArtifact(comparison.uncertaintyBudget),
    },
    evolutionCoupling: {
      evolutionSolver: normalizeArtifact(evolution.evolutionSolver),
      evolutionEnvironment: normalizeArtifact(evolution.evolutionEnvironment),
      evolutionInvocation: normalizeArtifact(evolution.evolutionInvocation),
      sourceTensorInputSha256: asText(evolution.sourceTensorInputSha256),
      coupledStateArray: normalizeFloat64Array(evolution.coupledStateArray),
      couplingResidualArray: normalizeFloat64Array(
        evolution.couplingResidualArray,
      ),
      backreactionIterationCount: toFinite(
        evolution.backreactionIterationCount,
      ),
      evolvedTimestepCount: toFinite(evolution.evolvedTimestepCount),
      evolvedDurationSeconds: toFinite(evolution.evolvedDurationSeconds),
      feedbackEnabled: toBoolean(evolution.feedbackEnabled),
      couplingResidualMax: toFinite(evolution.couplingResidualMax),
      couplingResidualTolerance: toFinite(evolution.couplingResidualTolerance),
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
      argv: textArray(provenance.argv),
      workingDirectory: asText(provenance.workingDirectory),
      inputManifest: normalizeArtifact(provenance.inputManifest),
      runId: asText(provenance.runId),
      requestId: asText(provenance.requestId),
      receiptId: asText(provenance.receiptId),
      runtimeId: asText(provenance.runtimeId),
      gitSha: asText(provenance.gitSha),
      startedAt: asText(provenance.startedAt),
      completedAt: asText(provenance.completedAt),
      durationMs: toFinite(provenance.durationMs),
      deterministicSeed: asText(provenance.deterministicSeed),
      runSpecificOutput: toBoolean(provenance.runSpecificOutput),
    },
  };
};

const draft = (checkId: Nhm2FullApparatusSourceTensorCheckId): CheckDraft => ({
  checkId,
  missing: [],
  failures: [],
  metrics: [],
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
  if (value == null || !SHA256_PATTERN.test(value))
    check.missing.push(`${blocker}_sha256_unbound`);
};

const requireArtifact = (
  value: Nhm2FullApparatusSourceTensorHashedArtifactV1,
  blocker: string,
  check: CheckDraft,
): void => {
  requireText(value.path, `${blocker}_path`, check);
  requireHash(value.sha256, blocker, check);
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

const requireNonnegative = (
  value: number | null,
  blocker: string,
  check: CheckDraft,
): void => {
  if (value == null) check.missing.push(`${blocker}_missing`);
  else if (value < 0) check.failures.push(`${blocker}_invalid`);
};

const addMetric = (
  check: CheckDraft,
  metricId: string,
  value: number | null,
  tolerance: number | null,
  comparator: Nhm2FullApparatusSourceTensorMetricV1["comparator"],
  unit: string,
): void => {
  check.metrics.push({ metricId, value, tolerance, comparator, unit });
};

const requireBounded = (
  value: number | null,
  tolerance: number | null,
  blocker: string,
  metricId: string,
  unit: string,
  check: CheckDraft,
): void => {
  addMetric(check, metricId, value, tolerance, "lte", unit);
  requireNonnegative(value, blocker, check);
  if (tolerance == null) check.missing.push(`${blocker}_tolerance_missing`);
  else if (tolerance <= 0) check.failures.push(`${blocker}_tolerance_invalid`);
  if (value != null && tolerance != null && value > tolerance)
    check.failures.push(`${blocker}_exceeds_tolerance`);
};

const globalIdentityAndProvenanceBlockers = (
  core: PrimitiveEvidence,
): string[] => {
  const check = draft("all_ten_components_computed");
  const identity = core.identity;
  requireText(identity.candidateId, "candidate_id", check);
  requireHash(identity.candidateManifestSha256, "candidate_manifest", check);
  requireArtifact(identity.preRunManifest, "pre_run_manifest", check);
  requireText(identity.laneId, "lane_id", check);
  requireText(identity.runId, "run_id", check);
  requireText(identity.requestId, "request_id", check);
  requireText(identity.receiptId, "receipt_id", check);
  requireText(identity.runtimeId, "runtime_id", check);
  requireText(identity.selectedProfileId, "selected_profile_id", check);
  requireArtifact(identity.selectedProfile, "selected_profile", check);
  requireText(identity.chartId, "chart_id", check);
  requireArtifact(identity.atlas, "atlas", check);
  requireArtifact(identity.units, "units", check);
  requireArtifact(identity.normalization, "normalization", check);
  if (identity.gitSha == null || !GIT_SHA_PATTERN.test(identity.gitSha))
    check.missing.push("git_sha_unbound");
  if (
    identity.candidateManifestSha256 != null &&
    identity.preRunManifest.sha256 != null &&
    identity.candidateManifestSha256 !== identity.preRunManifest.sha256
  )
    check.missing.push("pre_run_manifest_candidate_sha_mismatch");

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
  requireText(provenance.deterministicSeed, "deterministic_seed", check);
  if (provenance.runSpecificOutput !== true)
    check.missing.push("run_specific_output_not_bound");
  if (provenance.runId !== identity.runId)
    check.missing.push("provenance_run_id_mismatch");
  if (provenance.requestId !== identity.requestId)
    check.missing.push("provenance_request_id_mismatch");
  if (provenance.receiptId !== identity.receiptId)
    check.missing.push("provenance_receipt_id_mismatch");
  if (provenance.runtimeId !== identity.runtimeId)
    check.missing.push("provenance_runtime_id_mismatch");
  if (provenance.gitSha !== identity.gitSha)
    check.missing.push("provenance_git_sha_mismatch");
  const start = Date.parse(provenance.startedAt ?? "");
  const end = Date.parse(provenance.completedAt ?? "");
  const generated = Date.parse(core.generatedAt ?? "");
  if (!Number.isFinite(start)) check.missing.push("started_at_invalid");
  if (!Number.isFinite(end)) check.missing.push("completed_at_invalid");
  if (!Number.isFinite(generated)) check.missing.push("generated_at_invalid");
  if (Number.isFinite(start) && Number.isFinite(end) && end < start)
    check.failures.push("execution_interval_invalid");
  if (Number.isFinite(end) && Number.isFinite(generated) && generated < end)
    check.failures.push("generated_before_execution_completed");
  if (provenance.durationMs == null) check.missing.push("duration_ms_missing");
  else if (provenance.durationMs < 0)
    check.failures.push("duration_ms_invalid");
  else if (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    provenance.durationMs !== end - start
  )
    check.failures.push("duration_ms_interval_mismatch");

  return unique([...check.missing, ...check.failures]);
};

const exactSetChecks = <T extends string>(
  actual: Array<T | null>,
  expected: readonly T[],
  label: string,
  check: CheckDraft,
): void => {
  if (actual.some((entry) => entry == null))
    check.failures.push(`${label}_contains_unknown_value`);
  for (const value of expected) {
    const count = actual.filter((entry) => entry === value).length;
    if (count === 0) check.missing.push(`${label}_${value}_missing`);
    else if (count !== 1) check.failures.push(`${label}_${value}_not_unique`);
  }
  if (actual.length > expected.length)
    check.failures.push(`${label}_cardinality_invalid`);
};

const exactOrderedComponents = (
  actual: Array<Nhm2FullApparatusSourceTensorComponent | null>,
  expected: readonly Nhm2FullApparatusSourceTensorComponent[],
  label: string,
  check: CheckDraft,
): void => {
  if (actual.length === 0 && expected.length > 0) {
    check.missing.push(`${label}_missing`);
    return;
  }
  if (
    actual.length !== expected.length ||
    actual.some((component, index) => component !== expected[index])
  ) {
    check.failures.push(`${label}_invalid`);
  }
};

const validatedShape = (
  shape: Array<number | null>,
): {
  shape: number[] | null;
  sizeBytes: number | null;
  blocker: string | null;
} => {
  if (
    shape.length === 0 ||
    shape.some(
      (dimension) =>
        dimension == null || !Number.isSafeInteger(dimension) || dimension <= 0,
    )
  ) {
    return { shape: null, sizeBytes: null, blocker: "shape_invalid" };
  }
  const concreteShape = shape as number[];
  let elements = 1;
  for (const dimension of concreteShape) {
    if (elements > Number.MAX_SAFE_INTEGER / dimension) {
      return { shape: null, sizeBytes: null, blocker: "shape_size_overflow" };
    }
    elements *= dimension;
  }
  if (elements > Number.MAX_SAFE_INTEGER / Float64Array.BYTES_PER_ELEMENT) {
    return { shape: null, sizeBytes: null, blocker: "shape_size_overflow" };
  }
  return {
    shape: concreteShape,
    sizeBytes: elements * Float64Array.BYTES_PER_ELEMENT,
    blocker: null,
  };
};

const sameShape = (
  left: readonly number[],
  right: readonly number[],
): boolean =>
  left.length === right.length &&
  left.every((dimension, index) => dimension === right[index]);

const requireFloat64Array = (
  value: Nhm2FullApparatusSourceTensorFloat64ArrayV1,
  label: string,
  check: CheckDraft,
  options: {
    expectedShape?: readonly number[] | null;
    expectedComponentOrder: readonly Nhm2FullApparatusSourceTensorComponent[];
  },
): void => {
  requireArtifact(value, label, check);
  const artifactIsBound = value.path != null || value.sha256 != null;
  const metadataBlockers = artifactIsBound ? check.failures : check.missing;
  if (value.dtype !== "float64")
    metadataBlockers.push(`${label}_dtype_missing`);
  if (value.storageOrder == null)
    metadataBlockers.push(`${label}_storage_order_missing`);

  const shapeValidation = validatedShape(value.shape);
  if (shapeValidation.blocker != null) {
    (artifactIsBound ? check.failures : check.missing).push(
      `${label}_${shapeValidation.blocker}`,
    );
  } else if (
    options.expectedShape != null &&
    !sameShape(shapeValidation.shape!, options.expectedShape)
  ) {
    check.failures.push(`${label}_shape_mismatch`);
  }

  if (value.sizeBytes == null) {
    metadataBlockers.push(`${label}_size_bytes_missing`);
  } else if (!Number.isSafeInteger(value.sizeBytes) || value.sizeBytes <= 0) {
    check.failures.push(`${label}_size_bytes_invalid`);
  } else if (
    shapeValidation.sizeBytes != null &&
    value.sizeBytes !== shapeValidation.sizeBytes
  ) {
    check.failures.push(`${label}_size_bytes_shape_mismatch`);
  }

  exactOrderedComponents(
    value.componentOrder,
    options.expectedComponentOrder,
    `${label}_component_order`,
    check,
  );
};

const deriveChecks = (core: PrimitiveEvidence): CheckDraft[] => {
  const byId = new Map<Nhm2FullApparatusSourceTensorCheckId, CheckDraft>(
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_REQUIRED_CHECK_IDS.map((id) => [
      id,
      draft(id),
    ]),
  );
  const get = (id: Nhm2FullApparatusSourceTensorCheckId): CheckDraft =>
    byId.get(id)!;
  const frozenShapeValidation = validatedShape(core.frozenFrame.arrayShape);
  const frozenTensorShape = frozenShapeValidation.shape;
  const frozenSampleShape = frozenTensorShape?.slice(0, -1) ?? null;
  const evolvedTensorShape =
    frozenTensorShape != null &&
    core.evolutionCoupling.evolvedTimestepCount != null &&
    Number.isSafeInteger(core.evolutionCoupling.evolvedTimestepCount) &&
    core.evolutionCoupling.evolvedTimestepCount > 0
      ? [
          core.evolutionCoupling.evolvedTimestepCount,
          ...frozenTensorShape.slice(1),
        ]
      : null;

  const components = get("all_ten_components_computed");
  exactSetChecks(
    core.sourceTensor.components.map((entry) => entry.component),
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    "component",
    components,
  );
  addMetric(
    components,
    "unique_full_tensor_component_count",
    new Set(
      core.sourceTensor.components
        .map((entry) => entry.component)
        .filter(
          (entry): entry is Nhm2FullApparatusSourceTensorComponent =>
            entry != null,
        ),
    ).size,
    10,
    "eq",
    "components",
  );
  for (const entry of core.sourceTensor.components) {
    const label = entry.component?.toLowerCase() ?? "unknown_component";
    requireFloat64Array(entry.rawArray, `${label}_raw_array`, components, {
      expectedShape: frozenSampleShape,
      expectedComponentOrder: entry.component == null ? [] : [entry.component],
    });
    requirePositiveInteger(
      entry.sampleCount,
      `${label}_sample_count`,
      components,
    );
    if (
      entry.sampleCount != null &&
      core.frozenFrame.spatialSampleCount != null &&
      entry.sampleCount !== core.frozenFrame.spatialSampleCount
    )
      components.failures.push(`${label}_sample_count_mismatch`);
    if (entry.minSI == null) components.missing.push(`${label}_min_missing`);
    if (entry.maxSI == null) components.missing.push(`${label}_max_missing`);
    if (entry.l2NormSI == null)
      components.missing.push(`${label}_l2_norm_missing`);
    else if (entry.l2NormSI < 0)
      components.failures.push(`${label}_l2_norm_invalid`);
    if (entry.minSI != null && entry.maxSI != null && entry.maxSI < entry.minSI)
      components.failures.push(`${label}_range_invalid`);
  }

  const apparatus = get("all_apparatus_terms_included");
  exactSetChecks(
    core.sourceTensor.terms.map((entry) => entry.term),
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS,
    "apparatus_term",
    apparatus,
  );
  addMetric(
    apparatus,
    "unique_required_apparatus_term_count",
    new Set(
      core.sourceTensor.terms
        .map((entry) => entry.term)
        .filter(
          (entry): entry is Nhm2FullApparatusSourceTensorTerm => entry != null,
        ),
    ).size,
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS.length,
    "eq",
    "terms",
  );
  requireArtifact(
    core.sourceTensor.decompositionLedger,
    "decomposition_ledger",
    apparatus,
  );
  for (const entry of core.sourceTensor.terms) {
    const label = entry.term ?? "unknown_term";
    requireText(entry.producerFieldId, `${label}_producer_field_id`, apparatus);
    requireArtifact(entry.sourceField, `${label}_source_field`, apparatus);
    requireFloat64Array(
      entry.rawTensorArray,
      `${label}_raw_tensor`,
      apparatus,
      {
        expectedShape: frozenTensorShape,
        expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      },
    );
    requireFloat64Array(
      entry.couplingCoefficientArray,
      `${label}_coupling_coefficients`,
      apparatus,
      {
        expectedShape: frozenTensorShape,
        expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      },
    );
    requirePositiveInteger(
      entry.sampleCount,
      `${label}_sample_count`,
      apparatus,
    );
    if (
      entry.sampleCount != null &&
      core.frozenFrame.spatialSampleCount != null &&
      entry.sampleCount !== core.frozenFrame.spatialSampleCount
    )
      apparatus.failures.push(`${label}_sample_count_mismatch`);
    if (entry.returnedToSourceTensor == null)
      apparatus.missing.push(`${label}_return_binding_missing`);
    else if (!entry.returnedToSourceTensor)
      apparatus.failures.push(`${label}_not_returned_to_source_tensor`);
  }

  const frame = get("same_chart_basis_units_normalization");
  const frameValues = [
    ["source", core.frozenFrame.sourceFrame],
    ["metric", core.frozenFrame.metricFrame],
  ] as const;
  for (const [label, value] of frameValues) {
    requireText(value.chartId, `${label}_chart_id`, frame);
    if (value.basis == null) frame.missing.push(`${label}_basis_missing`);
    if (value.tensorIndexPosition == null)
      frame.missing.push(`${label}_tensor_index_position_missing`);
    if (value.unit == null) frame.missing.push(`${label}_unit_missing`);
    requireHash(value.atlasSha256, `${label}_atlas`, frame);
    requireHash(value.unitsSha256, `${label}_units`, frame);
    requireHash(value.normalizationSha256, `${label}_normalization`, frame);
  }
  if (core.frozenFrame.tensorSymmetry !== "symmetric")
    frame.missing.push("symmetric_tensor_contract_missing");
  if (core.frozenFrame.dtype !== "float64")
    frame.missing.push("float64_dtype_missing");
  if (core.frozenFrame.endianness == null)
    frame.missing.push("array_endianness_missing");
  exactOrderedComponents(
    core.frozenFrame.componentOrder,
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    "component_order",
    frame,
  );
  if (frozenShapeValidation.blocker != null) {
    frame.failures.push(`frozen_array_${frozenShapeValidation.blocker}`);
  } else if (frozenTensorShape != null) {
    if (
      frozenTensorShape.length < 3 ||
      frozenTensorShape[frozenTensorShape.length - 1] !==
        NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS.length
    ) {
      frame.failures.push("frozen_array_tensor_component_axis_invalid");
    }
    if (
      core.frozenFrame.timeSampleCount != null &&
      frozenTensorShape[0] !== core.frozenFrame.timeSampleCount
    ) {
      frame.failures.push("frozen_array_time_sample_count_mismatch");
    }
    let spatialElements = 1;
    for (const dimension of frozenTensorShape.slice(1, -1)) {
      spatialElements *= dimension;
    }
    if (
      core.frozenFrame.spatialSampleCount != null &&
      spatialElements !== core.frozenFrame.spatialSampleCount
    ) {
      frame.failures.push("frozen_array_spatial_sample_count_mismatch");
    }
  }
  const expectedBindings = {
    chartId: core.identity.chartId,
    atlasSha256: core.identity.atlas.sha256,
    unitsSha256: core.identity.units.sha256,
    normalizationSha256: core.identity.normalization.sha256,
  };
  for (const [label, value] of frameValues) {
    for (const key of Object.keys(expectedBindings) as Array<
      keyof typeof expectedBindings
    >) {
      if (value[key] !== expectedBindings[key])
        frame.failures.push(`${label}_${key}_identity_mismatch`);
    }
  }
  if (
    JSON.stringify(core.frozenFrame.sourceFrame) !==
    JSON.stringify(core.frozenFrame.metricFrame)
  )
    frame.failures.push("source_metric_frame_mismatch");

  const masks = get("atlas_masks_and_sample_counts_bound");
  requireArtifact(core.frozenFrame.sampleIndex, "sample_index", masks);
  requirePositiveInteger(
    core.frozenFrame.spatialSampleCount,
    "spatial_sample_count",
    masks,
  );
  requirePositiveInteger(
    core.frozenFrame.timeSampleCount,
    "time_sample_count",
    masks,
  );
  if (core.frozenFrame.regionsFormDisjointPartition == null)
    masks.missing.push("region_partition_disposition_missing");
  else if (!core.frozenFrame.regionsFormDisjointPartition)
    masks.failures.push("regions_not_disjoint_partition");
  exactSetChecks(
    core.frozenFrame.regionMasks.map((entry) => entry.region),
    NHM2_FULL_APPARATUS_SOURCE_TENSOR_REGIONS,
    "region_mask",
    masks,
  );
  let admittedSum = 0;
  for (const region of core.frozenFrame.regionMasks) {
    const label = region.region ?? "unknown_region";
    requireArtifact(region.mask, `${label}_mask`, masks);
    requirePositiveInteger(
      region.admittedSampleCount,
      `${label}_admitted_sample_count`,
      masks,
    );
    requirePositiveInteger(
      region.evaluatedSampleCount,
      `${label}_evaluated_sample_count`,
      masks,
    );
    if (region.admittedSampleCount != null)
      admittedSum += region.admittedSampleCount;
    if (
      region.admittedSampleCount != null &&
      region.evaluatedSampleCount != null &&
      region.admittedSampleCount !== region.evaluatedSampleCount
    )
      masks.failures.push(`${label}_sample_coverage_mismatch`);
  }
  addMetric(
    masks,
    "partition_admitted_sample_count",
    admittedSum,
    core.frozenFrame.spatialSampleCount,
    "eq",
    "samples",
  );
  if (
    core.frozenFrame.spatialSampleCount != null &&
    core.frozenFrame.regionMasks.every(
      (region) => region.admittedSampleCount != null,
    ) &&
    admittedSum !== core.frozenFrame.spatialSampleCount
  )
    masks.failures.push("region_partition_sample_count_mismatch");

  const constitutive = get("source_side_constitutive_derivation");
  requireArtifact(
    core.sourceTensor.constitutiveRegistry,
    "constitutive_registry",
    constitutive,
  );
  requireArtifact(
    core.sourceTensor.constitutiveEquationSet,
    "constitutive_equation_set",
    constitutive,
  );
  for (const entry of core.sourceTensor.terms) {
    requireArtifact(
      entry.constitutiveDerivation,
      `${entry.term ?? "unknown_term"}_constitutive_derivation`,
      constitutive,
    );
  }

  const echo = get("metric_target_echo_excluded_by_provenance_dag");
  requireArtifact(core.sourceProvenanceDag.graph, "provenance_dag", echo);
  requireArtifact(core.sourceProvenanceDag.nodeIndex, "dag_node_index", echo);
  requireArtifact(core.sourceProvenanceDag.edgeIndex, "dag_edge_index", echo);
  requireArtifact(
    core.sourceProvenanceDag.independentEchoAudit,
    "independent_echo_audit",
    echo,
  );
  requireText(core.sourceProvenanceDag.auditMethod, "echo_audit_method", echo);
  requirePositiveInteger(
    core.sourceProvenanceDag.sourceRootCount,
    "source_root_count",
    echo,
  );
  requireNonnegative(
    core.sourceProvenanceDag.metricTargetDependencyCount,
    "metric_target_dependency_count",
    echo,
  );
  requireNonnegative(
    core.sourceProvenanceDag.forbiddenTargetEchoCount,
    "forbidden_target_echo_count",
    echo,
  );
  addMetric(
    echo,
    "metric_target_dependency_count",
    core.sourceProvenanceDag.metricTargetDependencyCount,
    0,
    "eq",
    "dependencies",
  );
  addMetric(
    echo,
    "forbidden_target_echo_count",
    core.sourceProvenanceDag.forbiddenTargetEchoCount,
    0,
    "eq",
    "dependencies",
  );
  if ((core.sourceProvenanceDag.metricTargetDependencyCount ?? 0) > 0)
    echo.failures.push("metric_target_dependency_present");
  if ((core.sourceProvenanceDag.forbiddenTargetEchoCount ?? 0) > 0)
    echo.failures.push("forbidden_metric_target_echo_present");
  if (core.sourceProvenanceDag.metricTargetInputsUsed.length > 0)
    echo.failures.push("metric_target_inputs_used");

  const signal = get("nondegenerate_metric_signal_above_numerical_floor");
  requireFloat64Array(
    core.metricComparison.rawMetricTensorArray,
    "raw_metric_tensor_array",
    signal,
    {
      expectedShape: frozenTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  requireFloat64Array(
    core.metricComparison.rawRequiredSourceTensorArray,
    "raw_required_source_tensor_array",
    signal,
    {
      expectedShape: frozenTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  addMetric(
    signal,
    "metric_signal_norm_si",
    core.metricComparison.metricSignalNormSI,
    core.metricComparison.metricSignalNumericalFloorSI,
    "gt",
    "J/m^3",
  );
  requireNonnegative(
    core.metricComparison.metricSignalNormSI,
    "metric_signal_norm",
    signal,
  );
  requireNonnegative(
    core.metricComparison.metricSignalNumericalFloorSI,
    "metric_signal_numerical_floor",
    signal,
  );
  if (
    core.metricComparison.metricSignalNormSI != null &&
    core.metricComparison.metricSignalNumericalFloorSI != null &&
    core.metricComparison.metricSignalNormSI <=
      core.metricComparison.metricSignalNumericalFloorSI
  )
    signal.failures.push("metric_signal_not_above_numerical_floor");

  const convergence = get("independent_metric_route_and_grid_convergence");
  requireText(
    core.metricComparison.metricRouteId,
    "metric_route_id",
    convergence,
  );
  requireText(
    core.metricComparison.metricImplementationId,
    "metric_implementation_id",
    convergence,
  );
  requireArtifact(
    core.metricComparison.metricSolver,
    "metric_solver",
    convergence,
  );
  requireArtifact(
    core.metricComparison.metricEnvironment,
    "metric_environment",
    convergence,
  );
  requireArtifact(
    core.metricComparison.metricInvocation,
    "metric_invocation",
    convergence,
  );
  requireArtifact(
    core.metricComparison.gridConvergenceStudy,
    "grid_convergence_study",
    convergence,
  );
  if (
    core.metricComparison.metricImplementationId != null &&
    core.metricComparison.metricImplementationId ===
      core.provenance.implementationId
  )
    convergence.failures.push(
      "metric_and_source_implementations_not_independent",
    );
  if (
    core.metricComparison.metricSolver.sha256 != null &&
    core.metricComparison.metricSolver.sha256 === core.provenance.solver.sha256
  )
    convergence.failures.push(
      "metric_and_source_solver_hashes_not_independent",
    );
  if (
    core.metricComparison.metricInvocation.sha256 != null &&
    core.metricComparison.metricInvocation.sha256 ===
      core.provenance.invocation.sha256
  )
    convergence.failures.push(
      "metric_and_source_invocation_hashes_not_independent",
    );
  if (core.metricComparison.gridResolutions.length < 3)
    convergence.missing.push("three_grid_resolutions_required");
  else if (
    core.metricComparison.gridResolutions.some(
      (value, index, values) =>
        !Number.isInteger(value) ||
        value <= 0 ||
        (index > 0 && value <= values[index - 1]),
    )
  )
    convergence.failures.push("grid_resolutions_invalid");
  if (core.metricComparison.observedConvergenceOrder == null)
    convergence.missing.push("observed_convergence_order_missing");
  if (core.metricComparison.minimumConvergenceOrder == null)
    convergence.missing.push("minimum_convergence_order_missing");
  if (
    core.metricComparison.observedConvergenceOrder != null &&
    core.metricComparison.minimumConvergenceOrder != null &&
    core.metricComparison.observedConvergenceOrder <
      core.metricComparison.minimumConvergenceOrder
  )
    convergence.failures.push("convergence_order_below_minimum");
  requireBounded(
    core.metricComparison.crossGridRelativeDifferenceUpper95,
    core.metricComparison.crossGridRelativeDifferenceTolerance,
    "cross_grid_relative_difference",
    "cross_grid_relative_difference_upper95",
    "relative_L_inf",
    convergence,
  );

  const residual = get("uncertainty_aware_absolute_relative_residuals_pass");
  requireFloat64Array(
    core.metricComparison.rawAbsoluteResidualArray,
    "raw_absolute_residual_array",
    residual,
    {
      expectedShape: frozenTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  requireFloat64Array(
    core.metricComparison.rawRelativeResidualArray,
    "raw_relative_residual_array",
    residual,
    {
      expectedShape: frozenTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  requireArtifact(
    core.metricComparison.uncertaintyBudget,
    "residual_uncertainty_budget",
    residual,
  );
  if (core.metricComparison.confidenceLevel == null)
    residual.missing.push("confidence_level_missing");
  else if (
    core.metricComparison.confidenceLevel <= 0 ||
    core.metricComparison.confidenceLevel >= 1
  )
    residual.failures.push("confidence_level_invalid");
  requireBounded(
    core.metricComparison.absoluteResidualUpper95SI,
    core.metricComparison.absoluteResidualToleranceSI,
    "absolute_residual_upper95",
    "absolute_residual_upper95_si",
    "J/m^3",
    residual,
  );
  requireBounded(
    core.metricComparison.relativeResidualUpper95,
    core.metricComparison.relativeResidualTolerance,
    "relative_residual_upper95",
    "relative_residual_upper95",
    "relative_L_inf",
    residual,
  );

  const arrays = get("raw_tensor_arrays_published");
  requireFloat64Array(
    core.sourceTensor.rawTotalTensorArray,
    "raw_total_tensor_array",
    arrays,
    {
      expectedShape: frozenTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  requireArtifact(
    core.sourceTensor.componentLedger,
    "component_ledger",
    arrays,
  );
  requireArtifact(core.frozenFrame.sampleIndex, "raw_sample_index", arrays);
  for (const entry of core.sourceTensor.components)
    requireFloat64Array(
      entry.rawArray,
      `${entry.component?.toLowerCase() ?? "unknown_component"}_raw_array`,
      arrays,
      {
        expectedShape: frozenSampleShape,
        expectedComponentOrder:
          entry.component == null ? [] : [entry.component],
      },
    );
  for (const entry of core.sourceTensor.terms)
    requireFloat64Array(
      entry.rawTensorArray,
      `${entry.term ?? "unknown_term"}_raw_tensor_array`,
      arrays,
      {
        expectedShape: frozenTensorShape,
        expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      },
    );

  const coupling = get("source_tensor_coupled_to_evolution");
  requireArtifact(
    core.evolutionCoupling.evolutionSolver,
    "evolution_solver",
    coupling,
  );
  requireArtifact(
    core.evolutionCoupling.evolutionEnvironment,
    "evolution_environment",
    coupling,
  );
  requireArtifact(
    core.evolutionCoupling.evolutionInvocation,
    "evolution_invocation",
    coupling,
  );
  requireHash(
    core.evolutionCoupling.sourceTensorInputSha256,
    "evolution_source_tensor_input",
    coupling,
  );
  if (
    core.evolutionCoupling.sourceTensorInputSha256 != null &&
    core.evolutionCoupling.sourceTensorInputSha256 !==
      core.sourceTensor.rawTotalTensorArray.sha256
  )
    coupling.failures.push("evolution_source_tensor_hash_mismatch");
  requireFloat64Array(
    core.evolutionCoupling.coupledStateArray,
    "coupled_state_array",
    coupling,
    {
      expectedShape: evolvedTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  requireFloat64Array(
    core.evolutionCoupling.couplingResidualArray,
    "coupling_residual_array",
    coupling,
    {
      expectedShape: evolvedTensorShape,
      expectedComponentOrder: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    },
  );
  requirePositiveInteger(
    core.evolutionCoupling.backreactionIterationCount,
    "backreaction_iteration_count",
    coupling,
  );
  requirePositiveInteger(
    core.evolutionCoupling.evolvedTimestepCount,
    "evolved_timestep_count",
    coupling,
  );
  if (core.evolutionCoupling.evolvedDurationSeconds == null)
    coupling.missing.push("evolved_duration_seconds_missing");
  else if (core.evolutionCoupling.evolvedDurationSeconds <= 0)
    coupling.failures.push("evolved_duration_seconds_not_positive");
  if (core.evolutionCoupling.feedbackEnabled == null)
    coupling.missing.push("evolution_feedback_disposition_missing");
  else if (!core.evolutionCoupling.feedbackEnabled)
    coupling.failures.push("evolution_feedback_not_enabled");
  requireBounded(
    core.evolutionCoupling.couplingResidualMax,
    core.evolutionCoupling.couplingResidualTolerance,
    "evolution_coupling_residual",
    "evolution_coupling_residual_max",
    "1",
    coupling,
  );

  return [...byId.values()];
};

const checkResult = (check: CheckDraft) => ({
  checkId: check.checkId,
  status: (check.failures.length > 0
    ? "fail"
    : check.missing.length > 0
      ? "blocked"
      : "pass") as Nhm2FullApparatusSourceTensorStatus,
  blockers: unique([...check.missing, ...check.failures]),
  metrics: check.metrics,
});

export const buildNhm2FullApparatusSourceTensor = (
  input: BuildNhm2FullApparatusSourceTensorInput = {},
): Nhm2FullApparatusSourceTensorV1 => {
  const core = normalizePrimitive(input);
  const identityBlockers = globalIdentityAndProvenanceBlockers(core);
  const checks = deriveChecks(core).map(checkResult);
  const checkBlockers = checks.flatMap((check) =>
    check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
  );
  const blockers = unique([
    ...identityBlockers.map((blocker) => `identity_or_provenance:${blocker}`),
    ...checkBlockers,
  ]);
  const status: Nhm2FullApparatusSourceTensorStatus =
    identityBlockers.length > 0 ||
    checks.some((check) => check.status === "blocked")
      ? "blocked"
      : checks.some((check) => check.status === "fail")
        ? "fail"
        : "pass";
  return {
    contractVersion: NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION,
    ...core,
    checks,
    status,
    fullApparatusSourceTensorReady: status === "pass",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      contractPassIsNotPhysicalValidation: true,
      fullApparatusSourceTensorEvidenceOnly: true,
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

export const isNhm2FullApparatusSourceTensor = (
  value: unknown,
): value is Nhm2FullApparatusSourceTensorV1 => {
  if (!isRecord(value) || !isJsonValue(value)) return false;
  if (
    value.contractVersion !== NHM2_FULL_APPARATUS_SOURCE_TENSOR_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2FullApparatusSourceTensor({
    generatedAt: value.generatedAt,
    identity: value.identity,
    frozenFrame: value.frozenFrame,
    sourceTensor: value.sourceTensor,
    sourceProvenanceDag: value.sourceProvenanceDag,
    metricComparison: value.metricComparison,
    evolutionCoupling: value.evolutionCoupling,
    provenance: value.provenance,
  } as BuildNhm2FullApparatusSourceTensorInput);
  return (
    JSON.stringify(canonicalize(value)) ===
    JSON.stringify(canonicalize(rebuilt))
  );
};
