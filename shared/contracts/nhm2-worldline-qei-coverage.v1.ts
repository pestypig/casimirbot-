import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "./nhm2-experiment-ready-theory-closure.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY } from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_WORLDLINE_QEI_COVERAGE_CONTRACT_VERSION =
  "nhm2_worldline_qei_coverage/v1" as const;

export const NHM2_WORLDLINE_QEI_REGIONS = ["hull", "wall", "exterior"] as const;

export const NHM2_WORLDLINE_QEI_REQUIRED_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.worldline_qei,
] as const;

export type Nhm2WorldlineQeiRegion =
  (typeof NHM2_WORLDLINE_QEI_REGIONS)[number];
export type Nhm2WorldlineQeiCheckId =
  (typeof NHM2_WORLDLINE_QEI_REQUIRED_CHECK_IDS)[number];
export type Nhm2WorldlineQeiStatus = "pass" | "blocked" | "fail";

export type Nhm2WorldlineQeiHashedArtifactV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2WorldlineQeiNumericalArtifactV1 =
  Nhm2WorldlineQeiHashedArtifactV1 & {
    dtype: "float64" | null;
    binaryEncoding: "raw_ieee754" | null;
    endianness: "little" | null;
    shape: number[];
    sizeBytes: number | null;
    storageOrder: "row-major" | "column-major" | null;
    componentOrder: string[];
    unit: string | null;
  };

export type Nhm2WorldlineQeiCoverageV1 = {
  contractVersion: typeof NHM2_WORLDLINE_QEI_COVERAGE_CONTRACT_VERSION;
  generatedAt: string | null;
  identity: {
    candidateId: string | null;
    candidateManifestSha256: string | null;
    preRunManifest: Nhm2WorldlineQeiHashedArtifactV1;
    laneId: "nhm2_shift_lapse" | null;
    runId: string | null;
    requestId: string | null;
    receiptId: string | null;
    selectedProfileId: string | null;
    chartId: string | null;
    atlas: Nhm2WorldlineQeiHashedArtifactV1;
    units: Nhm2WorldlineQeiHashedArtifactV1;
    normalization: Nhm2WorldlineQeiHashedArtifactV1;
    gitSha: string | null;
  };
  stateBinding: {
    stateId: string | null;
    stateSha256: string | null;
    stateArtifact: Nhm2WorldlineQeiNumericalArtifactV1;
    renormalizedStressTensor: Nhm2WorldlineQeiNumericalArtifactV1;
    semiclassicalReceipt: Nhm2WorldlineQeiHashedArtifactV1;
    renormalizationPrescription: Nhm2WorldlineQeiHashedArtifactV1;
  };
  coverage: {
    admittedWorldlineCount: number | null;
    evaluatedWorldlineCount: number | null;
    worldlineSet: Nhm2WorldlineQeiHashedArtifactV1;
    coverageManifest: Nhm2WorldlineQeiHashedArtifactV1;
    regionCounts: Array<{
      region: Nhm2WorldlineQeiRegion | null;
      admittedCount: number | null;
      evaluatedCount: number | null;
    }>;
  };
  worldlines: Array<{
    worldlineId: string | null;
    region: Nhm2WorldlineQeiRegion | null;
    stateId: string | null;
    stateSha256: string | null;
    trajectory: Nhm2WorldlineQeiNumericalArtifactV1;
    properTimeGrid: Nhm2WorldlineQeiNumericalArtifactV1;
    fourVelocityArray: Nhm2WorldlineQeiNumericalArtifactV1;
    accelerationArray: Nhm2WorldlineQeiNumericalArtifactV1;
    curvatureInvariantArray: Nhm2WorldlineQeiNumericalArtifactV1;
    renormalizedTmunuUuSamples: Nhm2WorldlineQeiNumericalArtifactV1;
    samplingFunctionSamples: Nhm2WorldlineQeiNumericalArtifactV1;
    quadratureSamples: Nhm2WorldlineQeiNumericalArtifactV1;
    sampleCount: number | null;
    properTimeStartSI: number | null;
    properTimeEndSI: number | null;
    fourVelocity: {
      normalizationConvention: "g_uu_minus_one" | null;
      normalizationResidualMax: number | null;
      normalizationTolerance: number | null;
      timelikeMarginMin: number | null;
    };
    invariants: {
      properAccelerationMaxSI: number | null;
      ricciScalarAbsMaxSI: number | null;
      ricciUuAbsMaxSI: number | null;
      kretschmannMaxSI: number | null;
      method: Nhm2WorldlineQeiHashedArtifactV1;
    };
    samplingFunction: {
      functionId: string | null;
      family: string | null;
      definition: Nhm2WorldlineQeiHashedArtifactV1;
      normalizedIntegral: number | null;
      normalizationAbsoluteUncertainty: number | null;
      normalizationTolerance: number | null;
      tauSI: number | null;
      dutyFraction: number | null;
      lightCrossingTimeSI: number | null;
      modulationPeriodSI: number | null;
      maxTauToLightCrossingRatio: number | null;
      maxTauToModulationPeriodRatio: number | null;
      dutyConsistencyTolerance: number | null;
      timingPolicy: Nhm2WorldlineQeiHashedArtifactV1;
    };
    theorem: {
      theoremId: string | null;
      citation: string | null;
      boundExpression: Nhm2WorldlineQeiHashedArtifactV1;
      applicabilityAnalysis: Nhm2WorldlineQeiHashedArtifactV1;
      applicabilityConditions: Nhm2WorldlineQeiHashedArtifactV1;
      applicable: boolean | null;
    };
    integral: {
      renormalized: boolean | null;
      integrationMethod: string | null;
      integratedEnergyDensitySI: number | null;
      theoremLowerBoundSI: number | null;
      marginSI: number | null;
      marginAbsoluteUncertaintySI: number | null;
      confidenceLevel: number | null;
      minimumRequiredLowerMarginSI: number | null;
      marginClosureToleranceSI: number | null;
      quadratureErrorBoundSI: number | null;
      interpolationErrorBoundSI: number | null;
      combinedNumericalToleranceSI: number | null;
      combinedNumericalErrorRelative: number | null;
      refinementLevels: number[];
      observedConvergenceOrder: number | null;
      minimumConvergenceOrder: number | null;
      convergenceStudy: Nhm2WorldlineQeiHashedArtifactV1;
      uncertaintyBudget: Nhm2WorldlineQeiHashedArtifactV1;
      integralReceipt: Nhm2WorldlineQeiHashedArtifactV1;
    };
  }>;
  uncertainty: {
    confidenceLevel: number | null;
    method: string | null;
    correlatedBudget: Nhm2WorldlineQeiHashedArtifactV1;
    covariance: Nhm2WorldlineQeiNumericalArtifactV1;
  };
  provenance: {
    producerId: string | null;
    implementationId: string | null;
    solverId: string | null;
    solverVersion: string | null;
    solver: Nhm2WorldlineQeiHashedArtifactV1;
    environment: Nhm2WorldlineQeiHashedArtifactV1;
    invocation: Nhm2WorldlineQeiHashedArtifactV1;
    command: string | null;
    argv: string[];
    workingDirectory: string | null;
    inputManifest: Nhm2WorldlineQeiHashedArtifactV1;
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
    checkId: Nhm2WorldlineQeiCheckId;
    status: Nhm2WorldlineQeiStatus;
    blockers: string[];
  }>;
  status: Nhm2WorldlineQeiStatus;
  worldlineQeiCoverageReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    worldlineQeiCoverageOnly: true;
    negativeEnergyInventoryClaimAllowed: false;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2WorldlineQeiCoverageV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "worldlineQeiCoverageReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2WorldlineQeiCoverageInput = DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2WorldlineQeiCheckId;
  missing: string[];
  failures: string[];
};

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/i;
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
): Nhm2WorldlineQeiHashedArtifactV1 => {
  const record = asRecord(value);
  return { path: asText(record.path), sha256: asText(record.sha256) };
};

const normalizeNumericalArtifact = (
  value: unknown,
): Nhm2WorldlineQeiNumericalArtifactV1 => {
  const record = asRecord(value);
  return {
    ...normalizeArtifact(record),
    dtype: record.dtype === "float64" ? "float64" : null,
    binaryEncoding:
      record.binaryEncoding === "raw_ieee754" ? "raw_ieee754" : null,
    endianness: record.endianness === "little" ? "little" : null,
    shape: Array.isArray(record.shape)
      ? record.shape
          .map(toFinite)
          .filter((entry): entry is number => entry != null)
      : [],
    sizeBytes: toFinite(record.sizeBytes),
    storageOrder:
      record.storageOrder === "row-major" ||
      record.storageOrder === "column-major"
        ? record.storageOrder
        : null,
    componentOrder: Array.isArray(record.componentOrder)
      ? record.componentOrder
          .map(asText)
          .filter((entry): entry is string => entry != null)
      : [],
    unit: asText(record.unit),
  };
};

const combinedNumericalErrorRelative = (
  integral: Record<string, unknown>,
): number | null => {
  const quadrature = toFinite(integral.quadratureErrorBoundSI);
  const interpolation = toFinite(integral.interpolationErrorBoundSI);
  const energy = toFinite(integral.integratedEnergyDensitySI);
  const lowerBound = toFinite(integral.theoremLowerBoundSI);
  const margin = toFinite(integral.marginSI);
  if (
    quadrature == null ||
    interpolation == null ||
    quadrature < 0 ||
    interpolation < 0 ||
    energy == null ||
    lowerBound == null ||
    margin == null
  ) {
    return null;
  }
  const normalization = Math.max(
    Math.abs(energy),
    Math.abs(lowerBound),
    Math.abs(margin),
  );
  return normalization > 0
    ? (quadrature + interpolation) / normalization
    : null;
};

const normalizePrimitive = (
  input: BuildNhm2WorldlineQeiCoverageInput,
): PrimitiveEvidence => {
  const root = asRecord(input);
  const identity = asRecord(root.identity);
  const state = asRecord(root.stateBinding);
  const coverage = asRecord(root.coverage);
  const uncertainty = asRecord(root.uncertainty);
  const provenance = asRecord(root.provenance);
  const regionCounts = Array.isArray(coverage.regionCounts)
    ? coverage.regionCounts
    : [];
  const worldlines = Array.isArray(root.worldlines) ? root.worldlines : [];
  const argv = Array.isArray(provenance.argv)
    ? provenance.argv
        .map(asText)
        .filter((entry): entry is string => entry != null)
    : [];
  return {
    generatedAt: asText(root.generatedAt),
    identity: {
      candidateId: asText(identity.candidateId),
      candidateManifestSha256: asText(identity.candidateManifestSha256),
      preRunManifest: normalizeArtifact(identity.preRunManifest),
      laneId: identity.laneId === "nhm2_shift_lapse" ? identity.laneId : null,
      runId: asText(identity.runId),
      requestId: asText(identity.requestId),
      receiptId: asText(identity.receiptId),
      selectedProfileId: asText(identity.selectedProfileId),
      chartId: asText(identity.chartId),
      atlas: normalizeArtifact(identity.atlas),
      units: normalizeArtifact(identity.units),
      normalization: normalizeArtifact(identity.normalization),
      gitSha: asText(identity.gitSha),
    },
    stateBinding: {
      stateId: asText(state.stateId),
      stateSha256: asText(state.stateSha256),
      stateArtifact: normalizeNumericalArtifact(state.stateArtifact),
      renormalizedStressTensor: normalizeNumericalArtifact(
        state.renormalizedStressTensor,
      ),
      semiclassicalReceipt: normalizeArtifact(state.semiclassicalReceipt),
      renormalizationPrescription: normalizeArtifact(
        state.renormalizationPrescription,
      ),
    },
    coverage: {
      admittedWorldlineCount: toFinite(coverage.admittedWorldlineCount),
      evaluatedWorldlineCount: toFinite(coverage.evaluatedWorldlineCount),
      worldlineSet: normalizeArtifact(coverage.worldlineSet),
      coverageManifest: normalizeArtifact(coverage.coverageManifest),
      regionCounts: regionCounts.map((value) => {
        const entry = asRecord(value);
        const region = NHM2_WORLDLINE_QEI_REGIONS.includes(
          entry.region as Nhm2WorldlineQeiRegion,
        )
          ? (entry.region as Nhm2WorldlineQeiRegion)
          : null;
        return {
          region,
          admittedCount: toFinite(entry.admittedCount),
          evaluatedCount: toFinite(entry.evaluatedCount),
        };
      }),
    },
    worldlines: worldlines.map((value) => {
      const entry = asRecord(value);
      const fourVelocity = asRecord(entry.fourVelocity);
      const invariants = asRecord(entry.invariants);
      const sampling = asRecord(entry.samplingFunction);
      const theorem = asRecord(entry.theorem);
      const integral = asRecord(entry.integral);
      const refinements = Array.isArray(integral.refinementLevels)
        ? integral.refinementLevels
            .map(toFinite)
            .filter((level): level is number => level != null)
        : [];
      const region = NHM2_WORLDLINE_QEI_REGIONS.includes(
        entry.region as Nhm2WorldlineQeiRegion,
      )
        ? (entry.region as Nhm2WorldlineQeiRegion)
        : null;
      return {
        worldlineId: asText(entry.worldlineId),
        region,
        stateId: asText(entry.stateId),
        stateSha256: asText(entry.stateSha256),
        trajectory: normalizeNumericalArtifact(entry.trajectory),
        properTimeGrid: normalizeNumericalArtifact(entry.properTimeGrid),
        fourVelocityArray: normalizeNumericalArtifact(entry.fourVelocityArray),
        accelerationArray: normalizeNumericalArtifact(entry.accelerationArray),
        curvatureInvariantArray: normalizeNumericalArtifact(
          entry.curvatureInvariantArray,
        ),
        renormalizedTmunuUuSamples: normalizeNumericalArtifact(
          entry.renormalizedTmunuUuSamples,
        ),
        samplingFunctionSamples: normalizeNumericalArtifact(
          entry.samplingFunctionSamples,
        ),
        quadratureSamples: normalizeNumericalArtifact(entry.quadratureSamples),
        sampleCount: toFinite(entry.sampleCount),
        properTimeStartSI: toFinite(entry.properTimeStartSI),
        properTimeEndSI: toFinite(entry.properTimeEndSI),
        fourVelocity: {
          normalizationConvention:
            fourVelocity.normalizationConvention === "g_uu_minus_one"
              ? fourVelocity.normalizationConvention
              : null,
          normalizationResidualMax: toFinite(
            fourVelocity.normalizationResidualMax,
          ),
          normalizationTolerance: toFinite(fourVelocity.normalizationTolerance),
          timelikeMarginMin: toFinite(fourVelocity.timelikeMarginMin),
        },
        invariants: {
          properAccelerationMaxSI: toFinite(invariants.properAccelerationMaxSI),
          ricciScalarAbsMaxSI: toFinite(invariants.ricciScalarAbsMaxSI),
          ricciUuAbsMaxSI: toFinite(invariants.ricciUuAbsMaxSI),
          kretschmannMaxSI: toFinite(invariants.kretschmannMaxSI),
          method: normalizeArtifact(invariants.method),
        },
        samplingFunction: {
          functionId: asText(sampling.functionId),
          family: asText(sampling.family),
          definition: normalizeArtifact(sampling.definition),
          normalizedIntegral: toFinite(sampling.normalizedIntegral),
          normalizationAbsoluteUncertainty: toFinite(
            sampling.normalizationAbsoluteUncertainty,
          ),
          normalizationTolerance: toFinite(sampling.normalizationTolerance),
          tauSI: toFinite(sampling.tauSI),
          dutyFraction: toFinite(sampling.dutyFraction),
          lightCrossingTimeSI: toFinite(sampling.lightCrossingTimeSI),
          modulationPeriodSI: toFinite(sampling.modulationPeriodSI),
          maxTauToLightCrossingRatio: toFinite(
            sampling.maxTauToLightCrossingRatio,
          ),
          maxTauToModulationPeriodRatio: toFinite(
            sampling.maxTauToModulationPeriodRatio,
          ),
          dutyConsistencyTolerance: toFinite(sampling.dutyConsistencyTolerance),
          timingPolicy: normalizeArtifact(sampling.timingPolicy),
        },
        theorem: {
          theoremId: asText(theorem.theoremId),
          citation: asText(theorem.citation),
          boundExpression: normalizeArtifact(theorem.boundExpression),
          applicabilityAnalysis: normalizeArtifact(
            theorem.applicabilityAnalysis,
          ),
          applicabilityConditions: normalizeArtifact(
            theorem.applicabilityConditions,
          ),
          applicable: toBoolean(theorem.applicable),
        },
        integral: {
          renormalized: toBoolean(integral.renormalized),
          integrationMethod: asText(integral.integrationMethod),
          integratedEnergyDensitySI: toFinite(
            integral.integratedEnergyDensitySI,
          ),
          theoremLowerBoundSI: toFinite(integral.theoremLowerBoundSI),
          marginSI: toFinite(integral.marginSI),
          marginAbsoluteUncertaintySI: toFinite(
            integral.marginAbsoluteUncertaintySI,
          ),
          confidenceLevel: toFinite(integral.confidenceLevel),
          minimumRequiredLowerMarginSI: toFinite(
            integral.minimumRequiredLowerMarginSI,
          ),
          marginClosureToleranceSI: toFinite(integral.marginClosureToleranceSI),
          quadratureErrorBoundSI: toFinite(integral.quadratureErrorBoundSI),
          interpolationErrorBoundSI: toFinite(
            integral.interpolationErrorBoundSI,
          ),
          combinedNumericalToleranceSI: toFinite(
            integral.combinedNumericalToleranceSI,
          ),
          combinedNumericalErrorRelative:
            combinedNumericalErrorRelative(integral),
          refinementLevels: refinements,
          observedConvergenceOrder: toFinite(integral.observedConvergenceOrder),
          minimumConvergenceOrder: toFinite(integral.minimumConvergenceOrder),
          convergenceStudy: normalizeArtifact(integral.convergenceStudy),
          uncertaintyBudget: normalizeArtifact(integral.uncertaintyBudget),
          integralReceipt: normalizeArtifact(integral.integralReceipt),
        },
      };
    }),
    uncertainty: {
      confidenceLevel: toFinite(uncertainty.confidenceLevel),
      method: asText(uncertainty.method),
      correlatedBudget: normalizeArtifact(uncertainty.correlatedBudget),
      covariance: normalizeNumericalArtifact(uncertainty.covariance),
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

const draft = (checkId: Nhm2WorldlineQeiCheckId): CheckDraft => ({
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
  if (value == null || !SHA256_PATTERN.test(value))
    check.missing.push(`${blocker}_sha256_unbound`);
};

const requireArtifact = (
  value: Nhm2WorldlineQeiHashedArtifactV1,
  blocker: string,
  check: CheckDraft,
): void => {
  requireText(value.path, `${blocker}_path`, check);
  requireHash(value.sha256, blocker, check);
};

const expectedFloat64SizeBytes = (shape: readonly number[]): number | null => {
  if (
    shape.length === 0 ||
    shape.some((extent) => !Number.isSafeInteger(extent) || extent <= 0)
  ) {
    return null;
  }
  let elements = 1;
  for (const extent of shape) {
    elements *= extent;
    if (
      !Number.isSafeInteger(elements) ||
      elements > Number.MAX_SAFE_INTEGER / 8
    )
      return null;
  }
  return elements * 8;
};

const requireNumericalArtifact = (
  value: Nhm2WorldlineQeiNumericalArtifactV1,
  blocker: string,
  check: CheckDraft,
  input: {
    componentOrder: readonly string[];
    sampleCount?: number | null;
    rank?: number;
  },
): void => {
  requireArtifact(value, blocker, check);
  if (value.dtype == null) check.missing.push(`${blocker}_dtype_missing`);
  if (value.binaryEncoding == null)
    check.missing.push(`${blocker}_binary_encoding_missing`);
  if (value.endianness == null)
    check.missing.push(`${blocker}_endianness_missing`);
  if (value.storageOrder == null)
    check.missing.push(`${blocker}_storage_order_missing`);
  if (value.unit == null) check.missing.push(`${blocker}_unit_missing`);
  const expectedBytes = expectedFloat64SizeBytes(value.shape);
  if (value.shape.length === 0) check.missing.push(`${blocker}_shape_missing`);
  else if (expectedBytes == null)
    check.failures.push(`${blocker}_shape_invalid`);
  if (value.sizeBytes == null)
    check.missing.push(`${blocker}_size_bytes_missing`);
  else if (!Number.isSafeInteger(value.sizeBytes) || value.sizeBytes <= 0)
    check.failures.push(`${blocker}_size_bytes_invalid`);
  else if (expectedBytes != null && value.sizeBytes !== expectedBytes)
    check.failures.push(`${blocker}_size_bytes_shape_mismatch`);
  if (value.componentOrder.length === 0) {
    check.missing.push(`${blocker}_component_order_missing`);
  } else if (
    value.componentOrder.length !== input.componentOrder.length ||
    value.componentOrder.some(
      (component, index) => component !== input.componentOrder[index],
    )
  ) {
    check.failures.push(`${blocker}_component_order_mismatch`);
  }
  if (
    input.rank != null &&
    value.shape.length > 0 &&
    value.shape.length !== input.rank
  )
    check.failures.push(`${blocker}_rank_mismatch`);
  if (
    input.sampleCount != null &&
    value.shape.length > 0 &&
    value.shape[0] !== input.sampleCount
  ) {
    check.failures.push(`${blocker}_sample_count_mismatch`);
  }
  if (
    value.shape.length > 1 &&
    value.shape[value.shape.length - 1] !== input.componentOrder.length
  ) {
    check.failures.push(`${blocker}_final_axis_mismatch`);
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

const globalIdentityBlockers = (core: PrimitiveEvidence): string[] => {
  const check = draft("explicit_timelike_worldlines_published");
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
  if (identity.gitSha == null || !GIT_SHA_PATTERN.test(identity.gitSha))
    check.missing.push("git_sha_unbound");
  if (
    identity.candidateManifestSha256 != null &&
    identity.preRunManifest.sha256 != null &&
    identity.candidateManifestSha256 !== identity.preRunManifest.sha256
  )
    check.missing.push("pre_run_manifest_candidate_sha_mismatch");

  const state = core.stateBinding;
  requireText(state.stateId, "state_id", check);
  requireHash(state.stateSha256, "state", check);
  requireNumericalArtifact(state.stateArtifact, "state_artifact", check, {
    componentOrder: ["real", "imaginary"],
    rank: 2,
  });
  requireNumericalArtifact(
    state.renormalizedStressTensor,
    "renormalized_stress_tensor",
    check,
    {
      componentOrder: NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
      rank: 2,
    },
  );
  requireArtifact(state.semiclassicalReceipt, "semiclassical_receipt", check);
  requireArtifact(
    state.renormalizationPrescription,
    "renormalization_prescription",
    check,
  );
  if (
    state.stateSha256 != null &&
    state.stateArtifact.sha256 != null &&
    state.stateSha256 !== state.stateArtifact.sha256
  )
    check.missing.push("state_artifact_sha_mismatch");

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
  )
    check.missing.push("duration_interval_mismatch");

  requireText(core.uncertainty.method, "uncertainty_method", check);
  requireArtifact(
    core.uncertainty.correlatedBudget,
    "correlated_uncertainty_budget",
    check,
  );
  requireNumericalArtifact(
    core.uncertainty.covariance,
    "uncertainty_covariance",
    check,
    {
      componentOrder: ["quadrature_error", "state_uncertainty"],
      rank: 2,
    },
  );
  if (
    core.uncertainty.confidenceLevel == null ||
    core.uncertainty.confidenceLevel < 0.95 ||
    core.uncertainty.confidenceLevel >= 1
  )
    check.missing.push("uncertainty_confidence_level_unqualified");
  return unique([...check.missing, ...check.failures]);
};

const eachWorldline = (
  core: PrimitiveEvidence,
  check: CheckDraft,
  fn: (
    worldline: PrimitiveEvidence["worldlines"][number],
    prefix: string,
  ) => void,
): void => {
  if (core.worldlines.length === 0) {
    check.missing.push("worldlines_missing");
    return;
  }
  core.worldlines.forEach((worldline, index) =>
    fn(worldline, `worldline_${worldline.worldlineId ?? index}`),
  );
};

const deriveChecks = (core: PrimitiveEvidence): CheckDraft[] => {
  const byId = new Map(
    NHM2_WORLDLINE_QEI_REQUIRED_CHECK_IDS.map((id) => [id, draft(id)]),
  );
  const get = (id: Nhm2WorldlineQeiCheckId): CheckDraft => byId.get(id)!;

  const explicit = get("explicit_timelike_worldlines_published");
  requireArtifact(core.coverage.worldlineSet, "worldline_set", explicit);
  requirePositiveInteger(
    core.coverage.admittedWorldlineCount,
    "admitted_worldline_count",
    explicit,
  );
  requirePositiveInteger(
    core.coverage.evaluatedWorldlineCount,
    "evaluated_worldline_count",
    explicit,
  );
  const ids = core.worldlines.map((entry) => entry.worldlineId);
  if (ids.some((id) => id == null))
    explicit.missing.push("worldline_id_missing");
  if (core.worldlines.some((worldline) => worldline.region == null))
    explicit.missing.push("worldline_region_missing");
  if (new Set(ids.filter((id): id is string => id != null)).size !== ids.length)
    explicit.failures.push("worldline_ids_not_unique");
  if (
    core.coverage.admittedWorldlineCount != null &&
    core.worldlines.length !== core.coverage.admittedWorldlineCount
  )
    explicit.failures.push("published_worldline_count_mismatch");
  if (
    core.coverage.evaluatedWorldlineCount != null &&
    core.worldlines.length !== core.coverage.evaluatedWorldlineCount
  )
    explicit.failures.push("evaluated_worldline_count_mismatch");
  eachWorldline(core, explicit, (worldline, prefix) => {
    requireNumericalArtifact(
      worldline.trajectory,
      `${prefix}_trajectory`,
      explicit,
      {
        componentOrder: ["t", "x", "y", "z"],
        sampleCount: worldline.sampleCount,
        rank: 2,
      },
    );
    requireNumericalArtifact(
      worldline.properTimeGrid,
      `${prefix}_proper_time_grid`,
      explicit,
      {
        componentOrder: ["tau"],
        sampleCount: worldline.sampleCount,
        rank: 1,
      },
    );
    requireNumericalArtifact(
      worldline.fourVelocityArray,
      `${prefix}_four_velocity_array`,
      explicit,
      {
        componentOrder: ["u0", "u1", "u2", "u3"],
        sampleCount: worldline.sampleCount,
        rank: 2,
      },
    );
    requirePositiveInteger(
      worldline.sampleCount,
      `${prefix}_sample_count`,
      explicit,
    );
    if (worldline.sampleCount != null && worldline.sampleCount < 2)
      explicit.failures.push(`${prefix}_sample_count_insufficient`);
    if (
      worldline.properTimeStartSI == null ||
      worldline.properTimeEndSI == null
    )
      explicit.missing.push(`${prefix}_proper_time_interval_missing`);
    else if (worldline.properTimeEndSI <= worldline.properTimeStartSI)
      explicit.failures.push(`${prefix}_proper_time_interval_invalid`);
    if (
      worldline.stateId !== core.stateBinding.stateId ||
      worldline.stateSha256 !== core.stateBinding.stateSha256
    )
      explicit.missing.push(`${prefix}_state_binding_mismatch`);
  });

  const familySufficiency = get(
    "qei_sampling_family_count_meets_frozen_minimum",
  );
  const samplingFamilies = unique(
    core.worldlines
      .map((worldline) => worldline.samplingFunction.family)
      .filter((family): family is string => family != null),
  );
  if (
    core.worldlines.some(
      (worldline) => worldline.samplingFunction.family == null,
    )
  ) {
    familySufficiency.missing.push("sampling_function_family_missing");
  }
  if (samplingFamilies.length === 0) {
    familySufficiency.missing.push("sampling_function_families_missing");
  } else if (
    samplingFamilies.length <
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
      .worldlineQei.minimumSamplingFunctionFamilies
  ) {
    familySufficiency.failures.push(
      "sampling_function_family_count_below_frozen_minimum",
    );
  }

  const densitySufficiency = get(
    "qei_worldlines_per_region_family_meet_frozen_minimum",
  );
  if (samplingFamilies.length === 0) {
    densitySufficiency.missing.push("sampling_function_families_missing");
  } else {
    const regionFamilyCounts = NHM2_WORLDLINE_QEI_REGIONS.flatMap((region) =>
      samplingFamilies.map(
        (family) =>
          core.worldlines.filter(
            (worldline) =>
              worldline.region === region &&
              worldline.samplingFunction.family === family,
          ).length,
      ),
    );
    if (
      Math.min(...regionFamilyCounts) <
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumWorldlinesPerRegionAndFamily
    ) {
      densitySufficiency.failures.push(
        "region_family_worldline_density_below_frozen_minimum",
      );
    }
  }

  const sampleSufficiency = get(
    "qei_worldline_sample_count_meets_frozen_minimum",
  );
  eachWorldline(core, sampleSufficiency, (worldline, prefix) => {
    requirePositiveInteger(
      worldline.sampleCount,
      `${prefix}_sample_count`,
      sampleSufficiency,
    );
    if (
      worldline.sampleCount != null &&
      worldline.sampleCount <
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
          .worldlineQei.minimumSamplesPerWorldline
    ) {
      sampleSufficiency.failures.push(
        `${prefix}_sample_count_below_frozen_minimum`,
      );
    }
  });

  const velocity = get("four_velocity_normalization_verified");
  eachWorldline(core, velocity, (worldline, prefix) => {
    if (worldline.fourVelocity.normalizationConvention !== "g_uu_minus_one")
      velocity.missing.push(`${prefix}_normalization_convention_missing`);
    const residual = worldline.fourVelocity.normalizationResidualMax;
    const tolerance = worldline.fourVelocity.normalizationTolerance;
    if (residual == null)
      velocity.missing.push(`${prefix}_normalization_residual_missing`);
    else if (residual < 0)
      velocity.failures.push(`${prefix}_normalization_residual_invalid`);
    if (tolerance == null)
      velocity.missing.push(`${prefix}_normalization_tolerance_missing`);
    else if (tolerance <= 0)
      velocity.failures.push(`${prefix}_normalization_tolerance_invalid`);
    if (residual != null && tolerance != null && residual > tolerance)
      velocity.failures.push(`${prefix}_four_velocity_not_normalized`);
    if (worldline.fourVelocity.timelikeMarginMin == null)
      velocity.missing.push(`${prefix}_timelike_margin_missing`);
    else if (worldline.fourVelocity.timelikeMarginMin <= 0)
      velocity.failures.push(`${prefix}_worldline_not_strictly_timelike`);
  });

  const invariants = get("acceleration_and_curvature_invariants_computed");
  eachWorldline(core, invariants, (worldline, prefix) => {
    requireNumericalArtifact(
      worldline.accelerationArray,
      `${prefix}_acceleration_array`,
      invariants,
      {
        componentOrder: ["a0", "a1", "a2", "a3"],
        sampleCount: worldline.sampleCount,
        rank: 2,
      },
    );
    requireNumericalArtifact(
      worldline.curvatureInvariantArray,
      `${prefix}_curvature_invariant_array`,
      invariants,
      {
        componentOrder: [
          "proper_acceleration",
          "ricci_scalar",
          "ricci_uu",
          "kretschmann",
        ],
        sampleCount: worldline.sampleCount,
        rank: 2,
      },
    );
    requireArtifact(
      worldline.invariants.method,
      `${prefix}_invariant_method`,
      invariants,
    );
    for (const [name, value] of Object.entries({
      proper_acceleration: worldline.invariants.properAccelerationMaxSI,
      ricci_scalar: worldline.invariants.ricciScalarAbsMaxSI,
      ricci_uu: worldline.invariants.ricciUuAbsMaxSI,
      kretschmann: worldline.invariants.kretschmannMaxSI,
    })) {
      if (value == null) invariants.missing.push(`${prefix}_${name}_missing`);
      else if (value < 0) invariants.failures.push(`${prefix}_${name}_invalid`);
    }
  });

  const integrated = get("renormalized_tmunu_uu_samples_integrated");
  eachWorldline(core, integrated, (worldline, prefix) => {
    requireNumericalArtifact(
      worldline.renormalizedTmunuUuSamples,
      `${prefix}_renormalized_tmunu_uu_samples`,
      integrated,
      {
        componentOrder: ["Tmunu_u_mu_u_nu"],
        sampleCount: worldline.sampleCount,
        rank: 1,
      },
    );
    requireNumericalArtifact(
      worldline.quadratureSamples,
      `${prefix}_quadrature_samples`,
      integrated,
      {
        componentOrder: ["integrand", "weight"],
        sampleCount: worldline.sampleCount,
        rank: 2,
      },
    );
    requireArtifact(
      worldline.integral.integralReceipt,
      `${prefix}_integral_receipt`,
      integrated,
    );
    requireText(
      worldline.integral.integrationMethod,
      `${prefix}_integration_method`,
      integrated,
    );
    if (worldline.integral.renormalized !== true)
      integrated.failures.push(`${prefix}_samples_not_renormalized`);
    if (worldline.integral.integratedEnergyDensitySI == null)
      integrated.missing.push(`${prefix}_integrated_energy_density_missing`);
  });

  const sampling = get("sampling_function_normalized");
  eachWorldline(core, sampling, (worldline, prefix) => {
    requireText(
      worldline.samplingFunction.functionId,
      `${prefix}_sampling_function_id`,
      sampling,
    );
    requireText(
      worldline.samplingFunction.family,
      `${prefix}_sampling_function_family`,
      sampling,
    );
    requireArtifact(
      worldline.samplingFunction.definition,
      `${prefix}_sampling_definition`,
      sampling,
    );
    requireNumericalArtifact(
      worldline.samplingFunctionSamples,
      `${prefix}_sampling_function_samples`,
      sampling,
      {
        componentOrder: ["g_squared"],
        sampleCount: worldline.sampleCount,
        rank: 1,
      },
    );
    const integral = worldline.samplingFunction.normalizedIntegral;
    const uncertainty =
      worldline.samplingFunction.normalizationAbsoluteUncertainty;
    const tolerance = worldline.samplingFunction.normalizationTolerance;
    if (integral == null)
      sampling.missing.push(`${prefix}_sampling_integral_missing`);
    if (uncertainty == null)
      sampling.missing.push(`${prefix}_sampling_uncertainty_missing`);
    else if (uncertainty < 0)
      sampling.failures.push(`${prefix}_sampling_uncertainty_invalid`);
    if (tolerance == null)
      sampling.missing.push(`${prefix}_sampling_tolerance_missing`);
    else if (tolerance <= 0)
      sampling.failures.push(`${prefix}_sampling_tolerance_invalid`);
    if (
      integral != null &&
      uncertainty != null &&
      tolerance != null &&
      Math.abs(integral - 1) + uncertainty > tolerance
    )
      sampling.failures.push(`${prefix}_sampling_function_not_normalized`);
  });

  const theorem = get("applicable_theorem_bound_computed");
  eachWorldline(core, theorem, (worldline, prefix) => {
    requireText(worldline.theorem.theoremId, `${prefix}_theorem_id`, theorem);
    requireText(
      worldline.theorem.citation,
      `${prefix}_theorem_citation`,
      theorem,
    );
    requireArtifact(
      worldline.theorem.boundExpression,
      `${prefix}_bound_expression`,
      theorem,
    );
    requireArtifact(
      worldline.theorem.applicabilityAnalysis,
      `${prefix}_applicability_analysis`,
      theorem,
    );
    requireArtifact(
      worldline.theorem.applicabilityConditions,
      `${prefix}_applicability_conditions`,
      theorem,
    );
    if (worldline.theorem.applicable == null)
      theorem.missing.push(`${prefix}_theorem_applicability_missing`);
    else if (!worldline.theorem.applicable)
      theorem.failures.push(`${prefix}_theorem_not_applicable`);
    if (worldline.integral.theoremLowerBoundSI == null)
      theorem.missing.push(`${prefix}_theorem_lower_bound_missing`);
  });

  const quadrature = get("quadrature_and_interpolation_error_bounded");
  eachWorldline(core, quadrature, (worldline, prefix) => {
    const integral = worldline.integral;
    requireArtifact(
      integral.convergenceStudy,
      `${prefix}_convergence_study`,
      quadrature,
    );
    requireArtifact(
      integral.uncertaintyBudget,
      `${prefix}_uncertainty_budget`,
      quadrature,
    );
    if (integral.quadratureErrorBoundSI == null)
      quadrature.missing.push(`${prefix}_quadrature_error_missing`);
    else if (integral.quadratureErrorBoundSI < 0)
      quadrature.failures.push(`${prefix}_quadrature_error_invalid`);
    if (integral.interpolationErrorBoundSI == null)
      quadrature.missing.push(`${prefix}_interpolation_error_missing`);
    else if (integral.interpolationErrorBoundSI < 0)
      quadrature.failures.push(`${prefix}_interpolation_error_invalid`);
    if (integral.combinedNumericalToleranceSI == null)
      quadrature.missing.push(`${prefix}_numerical_tolerance_missing`);
    else if (integral.combinedNumericalToleranceSI <= 0)
      quadrature.failures.push(`${prefix}_numerical_tolerance_invalid`);
    if (
      integral.quadratureErrorBoundSI != null &&
      integral.interpolationErrorBoundSI != null &&
      integral.combinedNumericalToleranceSI != null &&
      integral.quadratureErrorBoundSI + integral.interpolationErrorBoundSI >
        integral.combinedNumericalToleranceSI
    )
      quadrature.failures.push(
        `${prefix}_combined_numerical_error_exceeds_tolerance`,
      );
    if (integral.combinedNumericalErrorRelative == null)
      quadrature.missing.push(
        `${prefix}_relative_numerical_error_normalization_missing`,
      );
    if (integral.refinementLevels.length < 3)
      quadrature.missing.push(`${prefix}_three_refinement_levels_required`);
    else if (
      integral.refinementLevels.some(
        (level, index, levels) =>
          !Number.isInteger(level) ||
          level <= 0 ||
          (index > 0 && level <= levels[index - 1]),
      )
    )
      quadrature.failures.push(`${prefix}_refinement_levels_invalid`);
    if (integral.observedConvergenceOrder == null)
      quadrature.missing.push(`${prefix}_observed_convergence_order_missing`);
    if (integral.minimumConvergenceOrder == null)
      quadrature.missing.push(`${prefix}_minimum_convergence_order_missing`);
    if (
      integral.observedConvergenceOrder != null &&
      integral.minimumConvergenceOrder != null &&
      integral.observedConvergenceOrder < integral.minimumConvergenceOrder
    )
      quadrature.failures.push(`${prefix}_convergence_order_below_minimum`);
  });

  const convergenceSufficiency = get(
    "qei_worldline_convergence_meets_frozen_minimum",
  );
  eachWorldline(core, convergenceSufficiency, (worldline, prefix) => {
    requireArtifact(
      worldline.integral.convergenceStudy,
      `${prefix}_convergence_study`,
      convergenceSufficiency,
    );
    if (
      worldline.integral.refinementLevels.length <
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumRefinementLevels
    ) {
      convergenceSufficiency.failures.push(
        `${prefix}_refinement_level_count_below_frozen_minimum`,
      );
    }
    if (worldline.integral.observedConvergenceOrder == null) {
      convergenceSufficiency.missing.push(
        `${prefix}_observed_convergence_order_missing`,
      );
    } else if (
      worldline.integral.observedConvergenceOrder <
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY
        .worldlineQei.minimumObservedConvergenceOrder
    ) {
      convergenceSufficiency.failures.push(
        `${prefix}_observed_convergence_order_below_frozen_minimum`,
      );
    }
  });

  const timing = get("tau_duty_light_crossing_modulation_consistent");
  eachWorldline(core, timing, (worldline, prefix) => {
    const value = worldline.samplingFunction;
    requireArtifact(value.timingPolicy, `${prefix}_timing_policy`, timing);
    for (const [name, number] of Object.entries({
      tau: value.tauSI,
      light_crossing_time: value.lightCrossingTimeSI,
      modulation_period: value.modulationPeriodSI,
      max_tau_to_light_crossing_ratio: value.maxTauToLightCrossingRatio,
      max_tau_to_modulation_period_ratio: value.maxTauToModulationPeriodRatio,
      duty_consistency_tolerance: value.dutyConsistencyTolerance,
    })) {
      if (number == null) timing.missing.push(`${prefix}_${name}_missing`);
      else if (number <= 0) timing.failures.push(`${prefix}_${name}_invalid`);
    }
    if (value.dutyFraction == null)
      timing.missing.push(`${prefix}_duty_fraction_missing`);
    else if (value.dutyFraction <= 0 || value.dutyFraction > 1)
      timing.failures.push(`${prefix}_duty_fraction_invalid`);
    if (
      value.tauSI != null &&
      value.lightCrossingTimeSI != null &&
      value.maxTauToLightCrossingRatio != null &&
      value.tauSI / value.lightCrossingTimeSI > value.maxTauToLightCrossingRatio
    )
      timing.failures.push(`${prefix}_tau_light_crossing_ratio_exceeded`);
    if (
      value.tauSI != null &&
      value.modulationPeriodSI != null &&
      value.maxTauToModulationPeriodRatio != null &&
      value.tauSI / value.modulationPeriodSI >
        value.maxTauToModulationPeriodRatio
    )
      timing.failures.push(`${prefix}_tau_modulation_ratio_exceeded`);
    if (
      value.tauSI != null &&
      value.modulationPeriodSI != null &&
      value.dutyFraction != null &&
      value.dutyConsistencyTolerance != null &&
      Math.abs(value.tauSI / value.modulationPeriodSI - value.dutyFraction) >
        value.dutyConsistencyTolerance
    )
      timing.failures.push(`${prefix}_duty_modulation_inconsistent`);
  });

  const regions = get("hull_wall_exterior_worldlines_covered");
  requireArtifact(core.coverage.coverageManifest, "coverage_manifest", regions);
  if (core.coverage.regionCounts.some((entry) => entry.region == null))
    regions.missing.push("region_coverage_identity_missing");
  for (const region of NHM2_WORLDLINE_QEI_REGIONS) {
    const matches = core.coverage.regionCounts.filter(
      (entry) => entry.region === region,
    );
    if (matches.length === 0) {
      regions.missing.push(`${region}_coverage_missing`);
      continue;
    }
    if (matches.length !== 1) {
      regions.failures.push(`${region}_coverage_not_unique`);
      continue;
    }
    const entry = matches[0];
    requirePositiveInteger(
      entry.admittedCount,
      `${region}_admitted_count`,
      regions,
    );
    requirePositiveInteger(
      entry.evaluatedCount,
      `${region}_evaluated_count`,
      regions,
    );
    if (entry.admittedCount !== entry.evaluatedCount)
      regions.failures.push(`${region}_worldlines_not_fully_evaluated`);
    const actual = core.worldlines.filter(
      (worldline) => worldline.region === region,
    ).length;
    if (entry.evaluatedCount != null && actual !== entry.evaluatedCount)
      regions.failures.push(`${region}_published_count_mismatch`);
  }
  if (
    core.coverage.admittedWorldlineCount != null &&
    core.coverage.evaluatedWorldlineCount != null &&
    core.coverage.admittedWorldlineCount !==
      core.coverage.evaluatedWorldlineCount
  )
    regions.failures.push("admitted_worldlines_not_fully_evaluated");
  const admittedRegionTotal = core.coverage.regionCounts.reduce(
    (total, entry) => total + (entry.admittedCount ?? 0),
    0,
  );
  const evaluatedRegionTotal = core.coverage.regionCounts.reduce(
    (total, entry) => total + (entry.evaluatedCount ?? 0),
    0,
  );
  if (
    core.coverage.admittedWorldlineCount != null &&
    admittedRegionTotal !== core.coverage.admittedWorldlineCount
  )
    regions.failures.push("regional_admitted_count_total_mismatch");
  if (
    core.coverage.evaluatedWorldlineCount != null &&
    evaluatedRegionTotal !== core.coverage.evaluatedWorldlineCount
  )
    regions.failures.push("regional_evaluated_count_total_mismatch");

  const margins = get("all_margins_pass_with_uncertainty");
  eachWorldline(core, margins, (worldline, prefix) => {
    const integral = worldline.integral;
    if (integral.marginSI == null)
      margins.missing.push(`${prefix}_margin_missing`);
    if (integral.marginAbsoluteUncertaintySI == null)
      margins.missing.push(`${prefix}_margin_uncertainty_missing`);
    else if (integral.marginAbsoluteUncertaintySI < 0)
      margins.failures.push(`${prefix}_margin_uncertainty_invalid`);
    if (integral.minimumRequiredLowerMarginSI == null)
      margins.missing.push(`${prefix}_minimum_required_margin_missing`);
    else if (integral.minimumRequiredLowerMarginSI !== 0)
      margins.failures.push(`${prefix}_minimum_required_margin_not_zero`);
    if (integral.marginClosureToleranceSI == null)
      margins.missing.push(`${prefix}_margin_closure_tolerance_missing`);
    else if (integral.marginClosureToleranceSI <= 0)
      margins.failures.push(`${prefix}_margin_closure_tolerance_invalid`);
    if (
      integral.integratedEnergyDensitySI != null &&
      integral.theoremLowerBoundSI != null &&
      integral.marginSI != null &&
      integral.marginClosureToleranceSI != null &&
      Math.abs(
        integral.integratedEnergyDensitySI -
          integral.theoremLowerBoundSI -
          integral.marginSI,
      ) > integral.marginClosureToleranceSI
    )
      margins.failures.push(`${prefix}_margin_arithmetic_not_closed`);
    if (
      integral.marginSI != null &&
      integral.marginAbsoluteUncertaintySI != null &&
      integral.minimumRequiredLowerMarginSI != null &&
      integral.marginSI - integral.marginAbsoluteUncertaintySI <
        integral.minimumRequiredLowerMarginSI
    )
      margins.failures.push(`${prefix}_qei_margin_fails_with_uncertainty`);
    if (
      integral.confidenceLevel == null ||
      integral.confidenceLevel < 0.95 ||
      integral.confidenceLevel >= 1
    )
      margins.missing.push(`${prefix}_margin_confidence_level_unqualified`);
  });

  return [...byId.values()];
};

const checkResult = (check: CheckDraft) => ({
  checkId: check.checkId,
  status: (check.failures.length > 0
    ? "fail"
    : check.missing.length > 0
      ? "blocked"
      : "pass") as Nhm2WorldlineQeiStatus,
  blockers: unique([...check.missing, ...check.failures]),
});

export const buildNhm2WorldlineQeiCoverage = (
  input: BuildNhm2WorldlineQeiCoverageInput = {},
): Nhm2WorldlineQeiCoverageV1 => {
  const core = normalizePrimitive(input);
  const identityBlockers = globalIdentityBlockers(core);
  const checks = deriveChecks(core).map(checkResult);
  const blockers = unique([
    ...identityBlockers.map((blocker) => `identity_or_provenance:${blocker}`),
    ...checks.flatMap((check) =>
      check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
    ),
  ]);
  const status: Nhm2WorldlineQeiStatus =
    identityBlockers.length > 0 ||
    checks.some((check) => check.status === "blocked")
      ? "blocked"
      : checks.some((check) => check.status === "fail")
        ? "fail"
        : "pass";
  return {
    contractVersion: NHM2_WORLDLINE_QEI_COVERAGE_CONTRACT_VERSION,
    ...core,
    checks,
    status,
    worldlineQeiCoverageReady: status === "pass",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      worldlineQeiCoverageOnly: true,
      negativeEnergyInventoryClaimAllowed: false,
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

export const isNhm2WorldlineQeiCoverage = (
  value: unknown,
): value is Nhm2WorldlineQeiCoverageV1 => {
  if (!isRecord(value) || !isJsonValue(value)) return false;
  if (value.contractVersion !== NHM2_WORLDLINE_QEI_COVERAGE_CONTRACT_VERSION)
    return false;
  const rebuilt = buildNhm2WorldlineQeiCoverage({
    generatedAt: value.generatedAt,
    identity: value.identity,
    stateBinding: value.stateBinding,
    coverage: value.coverage,
    worldlines: value.worldlines,
    uncertainty: value.uncertainty,
    provenance: value.provenance,
  } as BuildNhm2WorldlineQeiCoverageInput);
  return (
    JSON.stringify(canonicalize(value)) ===
    JSON.stringify(canonicalize(rebuilt))
  );
};
