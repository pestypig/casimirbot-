import { createHash } from "node:crypto";

import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY,
  NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES,
  NHM2_PRIMARY_RAW_OBSERVABLE_SOURCE_FAMILY_IDS,
  NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID,
  NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS,
  type Nhm2PrimaryRawRoleContentPolicyV1,
} from "../../../shared/contracts/nhm2-primary-raw-content-policy.v1";
import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
  type Nhm2PrimaryRawOutputFamilyId,
} from "../../../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import type {
  Nhm2PrimaryRawOutputFilesystemVerification,
  Nhm2PrimaryRawOutputVerifiedFile,
  Nhm2PrimaryRawOutputVerifiedNumericalFile,
  Nhm2PrimaryRawOutputVerifiedRecordFile,
} from "./nhm2-primary-raw-output-filesystem-verifier";

export const NHM2_PRIMARY_RAW_MATERIAL_DYNAMICS_REPLAY_CONTRACT_VERSION =
  "nhm2_primary_raw_material_dynamics_content_replay/v1" as const;

export const NHM2_SI_VACUUM_PERMITTIVITY_F_PER_M = 8.854_187_812_8e-12;
export const NHM2_SI_VACUUM_PERMEABILITY_N_PER_A2 = 1.256_637_062_12e-6;

const THRESHOLD_HASH_DOMAIN =
  "nhm2-primary-raw-material-dynamics-thresholds/v1\n";
const FILE_CLOSURE_HASH_DOMAIN =
  "nhm2-primary-raw-material-dynamics-file-closure/v1\n";
const SHA256 = /^[a-f0-9]{64}$/;

export type Nhm2ScientificDisposition = "pass" | "fail" | "blocked";

export type Nhm2VerifiedReceiptHash = {
  sha256: string;
  verified: true;
};

export type Nhm2PrimaryRawMaterialDynamicsThresholds = {
  relativeFloor: number;
  semiclassical: {
    rsetAbsoluteToleranceJPerM3: number;
    rsetRelativeTolerance: number;
    maxRelativeUncertainty95: number;
    maxFinalBackreactionDeltaJPerM3: number;
    maxBackreactionConvergenceRatio: number;
  };
  maxwell: {
    correlationAbsoluteTolerance: number;
    correlationRelativeTolerance: number;
    stressAbsoluteTolerancePa: number;
    stressRelativeTolerance: number;
    forceAbsoluteToleranceN: number;
    forceRelativeTolerance: number;
    gradientAbsoluteToleranceNPerM: number;
    gradientRelativeTolerance: number;
    maxAbsoluteForceGradientNPerM: number;
  };
  mechanics: {
    residualAbsoluteToleranceN: number;
    residualRelativeTolerance: number;
    residualComparisonAbsoluteToleranceN: number;
    residualComparisonRelativeTolerance: number;
    minimumStructuralMargin: number;
    minimumSourceRetentionMargin: number;
    minimumOverlapRatio: number;
    maxCycleEnergyJ: number;
    maxWeightedHeatJ: number;
    maxWeightedNoise: number;
    maxTimingFraction: number;
  };
  dynamics: {
    minimumRefinementOrder: number;
    maxFinalIterationDelta: number;
    maxPerturbationGrowthRate: number;
    perturbationGrowthAbsoluteTolerance: number;
    minimumRayFrequency: number;
    maximumCausalIntervalSquared: number;
    minimumHyperbolicityMargin: number;
    minimumNeighborhoodRobustMargin: number;
    minimumNeighborhoodSamplesPerSide: number;
  };
  observable: {
    predictionAbsoluteTolerance: number;
    predictionRelativeTolerance: number;
    uncertaintyAbsoluteTolerance: number;
    uncertaintyRelativeTolerance: number;
    maxPropagatedUncertainty95: number;
  };
};

export type Nhm2PrimaryRawMaterialDynamicsReplayInput = {
  rawVerification: Nhm2PrimaryRawOutputFilesystemVerification;
  receipts: {
    materialMeasurement: readonly Nhm2VerifiedReceiptHash[];
    materialCoupon: readonly Nhm2VerifiedReceiptHash[];
  };
  thresholds: Readonly<Nhm2PrimaryRawMaterialDynamicsThresholds>;
  thresholdBinding: {
    frozenBeforeReplay: true;
    sha256: string;
  };
};

export type Nhm2ComparisonCrossCheck = {
  id: string;
  maxAbsoluteError: number;
  maxRelativeError: number;
  absoluteTolerance: number;
  relativeTolerance: number;
  pass: boolean;
};

export type Nhm2ScientificFamilyResult<Metrics> = {
  status: Nhm2ScientificDisposition;
  metrics: Metrics;
  comparisonCrossChecks: Nhm2ComparisonCrossCheck[];
  breaches: string[];
  blockers: string[];
};

export type Nhm2SemiclassicalReplayMetrics = {
  sampleCount: number;
  modeCountPerSample: number;
  reconstructedTensorComponentsJPerM3: number[];
  maximumRelativeUncertainty95: number;
  backreactionIterationDifferencesJPerM3: number[];
  finalBackreactionDifferenceJPerM3: number;
  backreactionConvergenceRatio: number;
};

export type Nhm2MaxwellReplayMetrics = {
  surfaceCount: number;
  matsubaraModeCountPerSurface: number;
  electricCorrelationComponents: number[];
  magneticCorrelationComponents: number[];
  maxwellStressComponentsPa: number[];
  totalForceN: [number, number, number];
  normalForceByGapN: number[];
  gapValuesM: number[];
  forceGradientNPerM: number[];
  maximumAbsoluteForceGradientNPerM: number;
};

export type Nhm2MechanicalReplayMetrics = {
  degreeOfFreedomCount: number;
  residualComponentsN: number[];
  residualL2N: number;
  relativeResidual: number;
  minimumStructuralSupportFraction: number | null;
  maximumSourceRetentionSupportFraction: number | null;
  overlapRatio: number | null;
  powerIntegratedCycleEnergyJ: number;
  mechanicalWorkMagnitudeJ: number;
  weightedEnergyJ: number;
  weightedHeatJ: number;
  weightedNoiseRms: number;
  maximumTimingFraction: number;
};

export type Nhm2DynamicsReplayMetrics = {
  nonnegativeSampleAndTimeIndices: boolean;
  refinementOrders: number[];
  minimumRefinementOrder: number;
  backreactionIterationDifferences: number[];
  finalBackreactionIterationDifference: number;
  perturbationGrowthRates: number[];
  maximumPerturbationGrowthRate: number;
  minimumRayFrequency: number;
  minimumRayAffineParameter: number;
  minimumOutgoingExpansion: number;
  maximumOutgoingExpansion: number;
  maximumCausalIntervalSquared: number;
  minimumHyperbolicityMargin: number;
  minimumNeighborhoodRobustMargin: number;
  negativeNeighborhoodSampleCount: number;
  positiveNeighborhoodSampleCount: number;
  producerConstraintResidualMaximumAbsolute: number;
  producerConstraintResidualHasAuthority: false;
};

export type Nhm2ObservableReplayMetrics = {
  observableIds: string[];
  sourceValueCount: number;
  verifiedDerivationSourceBindings: Array<{
    observableId: string;
    sourceFileId: string;
    sourceFamilyId: Nhm2PrimaryRawOutputFamilyId;
    sourceSemanticRole: string;
    sourceSha256: string;
  }>;
  predictedValues: number[];
  propagatedUncertainty95: number[];
  dimensionalNormalizationResolved: false;
  comparisonSampleVectorsHaveAuthority: false;
};

export type Nhm2PrimaryRawMaterialDynamicsFileHashClosure = {
  verified: true;
  manifestSha256: string;
  contentPolicySha256: string;
  files: Array<{
    familyId: Nhm2PrimaryRawOutputFamilyId;
    semanticRole: string;
    fileId: string;
    path: string;
    sha256: string;
    sizeBytes: number;
  }>;
  closureSha256: string;
};

export type Nhm2PrimaryRawMaterialDynamicsReplayResult = {
  contractVersion: typeof NHM2_PRIMARY_RAW_MATERIAL_DYNAMICS_REPLAY_CONTRACT_VERSION;
  status: Nhm2ScientificDisposition;
  acceptedInput: boolean;
  inputBlockers: string[];
  fileHashClosure: Nhm2PrimaryRawMaterialDynamicsFileHashClosure | null;
  families: {
    semiclassical: Nhm2ScientificFamilyResult<Nhm2SemiclassicalReplayMetrics>;
    maxwell: Nhm2ScientificFamilyResult<Nhm2MaxwellReplayMetrics>;
    mechanics: Nhm2ScientificFamilyResult<Nhm2MechanicalReplayMetrics>;
    dynamics: Nhm2ScientificFamilyResult<Nhm2DynamicsReplayMetrics>;
    observableProjection: Nhm2ScientificFamilyResult<Nhm2ObservableReplayMetrics>;
  };
  unresolvedKernelBlockers: string[];
  claimBoundary: {
    diagnosticReplayOnly: true;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
    empiricalValidationEstablished: false;
  };
};

type FileIndex = Map<string, Nhm2PrimaryRawOutputVerifiedFile>;

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    )
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

const sha256Text = (domain: string, value: string): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(value, "utf8")
    .digest("hex");

export const computeNhm2PrimaryRawMaterialDynamicsThresholdSha256 = (
  thresholds: Nhm2PrimaryRawMaterialDynamicsThresholds,
): string => sha256Text(THRESHOLD_HASH_DOMAIN, stableJson(thresholds));

const uniqueSorted = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) =>
    Buffer.compare(Buffer.from(left), Buffer.from(right)),
  );

const disposition = (
  blockers: readonly string[],
  breaches: readonly string[],
): Nhm2ScientificDisposition =>
  blockers.length > 0 ? "blocked" : breaches.length > 0 ? "fail" : "pass";

const finiteNonnegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const finitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const validateThresholds = (
  value: Nhm2PrimaryRawMaterialDynamicsThresholds,
): string[] => {
  const blockers: string[] = [];
  if (!finitePositive(value?.relativeFloor))
    blockers.push("relative_floor_invalid");
  const nonnegative = [
    value?.semiclassical?.rsetAbsoluteToleranceJPerM3,
    value?.semiclassical?.rsetRelativeTolerance,
    value?.semiclassical?.maxRelativeUncertainty95,
    value?.semiclassical?.maxFinalBackreactionDeltaJPerM3,
    value?.semiclassical?.maxBackreactionConvergenceRatio,
    value?.maxwell?.correlationAbsoluteTolerance,
    value?.maxwell?.correlationRelativeTolerance,
    value?.maxwell?.stressAbsoluteTolerancePa,
    value?.maxwell?.stressRelativeTolerance,
    value?.maxwell?.forceAbsoluteToleranceN,
    value?.maxwell?.forceRelativeTolerance,
    value?.maxwell?.gradientAbsoluteToleranceNPerM,
    value?.maxwell?.gradientRelativeTolerance,
    value?.maxwell?.maxAbsoluteForceGradientNPerM,
    value?.mechanics?.residualAbsoluteToleranceN,
    value?.mechanics?.residualRelativeTolerance,
    value?.mechanics?.residualComparisonAbsoluteToleranceN,
    value?.mechanics?.residualComparisonRelativeTolerance,
    value?.mechanics?.minimumOverlapRatio,
    value?.mechanics?.maxCycleEnergyJ,
    value?.mechanics?.maxWeightedHeatJ,
    value?.mechanics?.maxWeightedNoise,
    value?.mechanics?.maxTimingFraction,
    value?.dynamics?.maxFinalIterationDelta,
    value?.dynamics?.maxPerturbationGrowthRate,
    value?.dynamics?.perturbationGrowthAbsoluteTolerance,
    value?.dynamics?.minimumRayFrequency,
    value?.dynamics?.minimumNeighborhoodSamplesPerSide,
    value?.observable?.predictionAbsoluteTolerance,
    value?.observable?.predictionRelativeTolerance,
    value?.observable?.uncertaintyAbsoluteTolerance,
    value?.observable?.uncertaintyRelativeTolerance,
    value?.observable?.maxPropagatedUncertainty95,
  ];
  if (nonnegative.some((entry) => !finiteNonnegative(entry))) {
    blockers.push("nonnegative_threshold_invalid");
  }
  const signed = [
    value?.mechanics?.minimumStructuralMargin,
    value?.mechanics?.minimumSourceRetentionMargin,
    value?.dynamics?.minimumRefinementOrder,
    value?.dynamics?.maximumCausalIntervalSquared,
    value?.dynamics?.minimumHyperbolicityMargin,
    value?.dynamics?.minimumNeighborhoodRobustMargin,
  ];
  if (
    signed.some((entry) => typeof entry !== "number" || !Number.isFinite(entry))
  ) {
    blockers.push("signed_threshold_invalid");
  }
  if (
    !Number.isSafeInteger(value?.dynamics?.minimumNeighborhoodSamplesPerSide) ||
    value.dynamics.minimumNeighborhoodSamplesPerSide < 1
  ) {
    blockers.push("neighborhood_sample_threshold_invalid");
  }
  return uniqueSorted(blockers);
};

const emptySemiclassicalMetrics = (): Nhm2SemiclassicalReplayMetrics => ({
  sampleCount: 0,
  modeCountPerSample: 0,
  reconstructedTensorComponentsJPerM3: [],
  maximumRelativeUncertainty95: Number.NaN,
  backreactionIterationDifferencesJPerM3: [],
  finalBackreactionDifferenceJPerM3: Number.NaN,
  backreactionConvergenceRatio: Number.NaN,
});

const emptyMaxwellMetrics = (): Nhm2MaxwellReplayMetrics => ({
  surfaceCount: 0,
  matsubaraModeCountPerSurface: 0,
  electricCorrelationComponents: [],
  magneticCorrelationComponents: [],
  maxwellStressComponentsPa: [],
  totalForceN: [0, 0, 0],
  normalForceByGapN: [],
  gapValuesM: [],
  forceGradientNPerM: [],
  maximumAbsoluteForceGradientNPerM: Number.NaN,
});

const emptyMechanicalMetrics = (): Nhm2MechanicalReplayMetrics => ({
  degreeOfFreedomCount: 0,
  residualComponentsN: [],
  residualL2N: Number.NaN,
  relativeResidual: Number.NaN,
  minimumStructuralSupportFraction: null,
  maximumSourceRetentionSupportFraction: null,
  overlapRatio: null,
  powerIntegratedCycleEnergyJ: Number.NaN,
  mechanicalWorkMagnitudeJ: Number.NaN,
  weightedEnergyJ: Number.NaN,
  weightedHeatJ: Number.NaN,
  weightedNoiseRms: Number.NaN,
  maximumTimingFraction: Number.NaN,
});

const emptyDynamicsMetrics = (): Nhm2DynamicsReplayMetrics => ({
  nonnegativeSampleAndTimeIndices: false,
  refinementOrders: [],
  minimumRefinementOrder: Number.NaN,
  backreactionIterationDifferences: [],
  finalBackreactionIterationDifference: Number.NaN,
  perturbationGrowthRates: [],
  maximumPerturbationGrowthRate: Number.NaN,
  minimumRayFrequency: Number.NaN,
  minimumRayAffineParameter: Number.NaN,
  minimumOutgoingExpansion: Number.NaN,
  maximumOutgoingExpansion: Number.NaN,
  maximumCausalIntervalSquared: Number.NaN,
  minimumHyperbolicityMargin: Number.NaN,
  minimumNeighborhoodRobustMargin: Number.NaN,
  negativeNeighborhoodSampleCount: 0,
  positiveNeighborhoodSampleCount: 0,
  producerConstraintResidualMaximumAbsolute: Number.NaN,
  producerConstraintResidualHasAuthority: false,
});

const emptyObservableMetrics = (): Nhm2ObservableReplayMetrics => ({
  observableIds: [...NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS],
  sourceValueCount: 0,
  verifiedDerivationSourceBindings: [],
  predictedValues: [],
  propagatedUncertainty95: [],
  dimensionalNormalizationResolved: false,
  comparisonSampleVectorsHaveAuthority: false,
});

const blockedResult = <Metrics>(metrics: Metrics, blockers: string[]) => ({
  status: "blocked" as const,
  metrics,
  comparisonCrossChecks: [],
  breaches: [],
  blockers: uniqueSorted(blockers),
});

const allBlockedResult = (
  blockers: string[],
): Nhm2PrimaryRawMaterialDynamicsReplayResult => ({
  contractVersion: NHM2_PRIMARY_RAW_MATERIAL_DYNAMICS_REPLAY_CONTRACT_VERSION,
  status: "blocked",
  acceptedInput: false,
  inputBlockers: uniqueSorted(blockers),
  fileHashClosure: null,
  families: {
    semiclassical: blockedResult(emptySemiclassicalMetrics(), blockers),
    maxwell: blockedResult(emptyMaxwellMetrics(), blockers),
    mechanics: blockedResult(emptyMechanicalMetrics(), blockers),
    dynamics: blockedResult(emptyDynamicsMetrics(), blockers),
    observableProjection: blockedResult(emptyObservableMetrics(), blockers),
  },
  unresolvedKernelBlockers: [],
  claimBoundary: claimBoundary(),
});

function claimBoundary(): Nhm2PrimaryRawMaterialDynamicsReplayResult["claimBoundary"] {
  return {
    diagnosticReplayOnly: true,
    theoryClosureEstablished: false,
    physicalViabilityEstablished: false,
    transportEstablished: false,
    propulsionEstablished: false,
    routeEtaEstablished: false,
    certifiedSpeedEstablished: false,
    empiricalValidationEstablished: false,
  };
}

const fileKey = (familyId: string, semanticRole: string): string =>
  `${familyId}\u0000${semanticRole}`;

const validateAndIndexVerification = (
  verification: Extract<
    Nhm2PrimaryRawOutputFilesystemVerification,
    { verified: true }
  >,
): { blockers: string[]; index: FileIndex } => {
  const blockers: string[] = [];
  const index: FileIndex = new Map();
  if (
    verification.violations.length !== 0 ||
    verification.manifest.contentPolicy.sha256 !==
      NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256
  ) {
    blockers.push("raw_filesystem_verification_not_closed");
  }
  if (
    verification.files.length !==
    verification.manifest.fileInventory.files.length
  ) {
    blockers.push("raw_file_inventory_cardinality_mismatch");
  }
  const descriptors = new Map(
    verification.manifest.fileInventory.files.map((descriptor) => [
      descriptor.fileId,
      descriptor,
    ]),
  );
  for (const file of verification.files) {
    const descriptor = descriptors.get(file.descriptor.fileId);
    if (
      descriptor == null ||
      descriptor.path !== file.descriptor.path ||
      descriptor.familyId !== file.descriptor.familyId ||
      descriptor.semanticRole !== file.descriptor.semanticRole ||
      descriptor.sha256 !== file.observedSha256 ||
      descriptor.sizeBytes !== file.observedSizeBytes
    ) {
      blockers.push(`raw_file_binding_mismatch:${file.descriptor.fileId}`);
      continue;
    }
    if (file.kind === "numerical_array") {
      if (file.descriptor.representation.kind !== "numerical_array") {
        blockers.push(
          `raw_numerical_descriptor_invalid:${file.descriptor.fileId}`,
        );
        continue;
      }
      const shape = file.descriptor.representation.shape;
      const expectedLength = shape.reduce(
        (product, entry) => product * entry,
        1,
      );
      if (
        shape.length !== 2 ||
        expectedLength !== file.values.length ||
        [...file.values].some((entry) => !Number.isFinite(entry))
      ) {
        blockers.push(`raw_numerical_file_invalid:${file.descriptor.fileId}`);
      }
    }
    const key = fileKey(file.descriptor.familyId, file.descriptor.semanticRole);
    if (index.has(key)) blockers.push(`raw_semantic_role_duplicate:${key}`);
    index.set(key, file);
  }
  return { blockers: uniqueSorted(blockers), index };
};

const buildFileHashClosure = (
  verification: Extract<
    Nhm2PrimaryRawOutputFilesystemVerification,
    { verified: true }
  >,
): Nhm2PrimaryRawMaterialDynamicsFileHashClosure => {
  const files = verification.files
    .map((file) => ({
      familyId: file.descriptor.familyId,
      semanticRole: file.descriptor.semanticRole,
      fileId: file.descriptor.fileId,
      path: file.descriptor.path,
      sha256: file.observedSha256,
      sizeBytes: file.observedSizeBytes,
    }))
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)),
    );
  const payload = {
    manifestSha256: verification.manifestSha256,
    contentPolicySha256: NHM2_PRIMARY_RAW_CONTENT_POLICY_SHA256,
    files,
  };
  return {
    verified: true,
    ...payload,
    closureSha256: sha256Text(FILE_CLOSURE_HASH_DOMAIN, stableJson(payload)),
  };
};

const numerical = (
  index: FileIndex,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  role: string,
  blockers: string[],
): Nhm2PrimaryRawOutputVerifiedNumericalFile | null => {
  const file = index.get(fileKey(familyId, role));
  if (file?.kind !== "numerical_array") {
    blockers.push(`primitive_missing:${familyId}:${role}`);
    return null;
  }
  return file;
};

const records = (
  index: FileIndex,
  familyId: Nhm2PrimaryRawOutputFamilyId,
  role: string,
  blockers: string[],
): Nhm2PrimaryRawOutputVerifiedRecordFile | null => {
  const file = index.get(fileKey(familyId, role));
  if (file?.kind !== "records") {
    blockers.push(`primitive_missing:${familyId}:${role}`);
    return null;
  }
  return file;
};

const rowCount = (file: Nhm2PrimaryRawOutputVerifiedNumericalFile): number =>
  file.descriptor.representation.kind === "numerical_array"
    ? (file.descriptor.representation.shape[0] ?? 0)
    : 0;

const columnCount = (
  file: Nhm2PrimaryRawOutputVerifiedNumericalFile,
): number =>
  file.descriptor.representation.kind === "numerical_array"
    ? (file.descriptor.representation.shape[1] ?? 0)
    : 0;

const at = (
  file: Nhm2PrimaryRawOutputVerifiedNumericalFile,
  row: number,
  column: number,
): number => file.values[row * columnCount(file) + column] ?? Number.NaN;

const l2 = (values: readonly number[]): number =>
  Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));

const rowDifferences = (
  file: Nhm2PrimaryRawOutputVerifiedNumericalFile,
): number[] => {
  const result: number[] = [];
  for (let row = 1; row < rowCount(file); row += 1) {
    const difference: number[] = [];
    for (let column = 0; column < columnCount(file); column += 1) {
      difference.push(at(file, row, column) - at(file, row - 1, column));
    }
    result.push(l2(difference));
  }
  return result;
};

const maxAbs = (values: Iterable<number>): number => {
  let maximum = 0;
  for (const value of values) maximum = Math.max(maximum, Math.abs(value));
  return maximum;
};

const comparison = (input: {
  id: string;
  computed: readonly number[];
  observed: readonly number[];
  absoluteTolerance: number;
  relativeTolerance: number;
  relativeFloor: number;
}): Nhm2ComparisonCrossCheck => {
  let maximumAbsoluteError = 0;
  let maximumRelativeError = 0;
  let scale = input.relativeFloor;
  if (input.computed.length !== input.observed.length) {
    return {
      id: input.id,
      maxAbsoluteError: Number.POSITIVE_INFINITY,
      maxRelativeError: Number.POSITIVE_INFINITY,
      absoluteTolerance: input.absoluteTolerance,
      relativeTolerance: input.relativeTolerance,
      pass: false,
    };
  }
  for (let index = 0; index < input.computed.length; index += 1) {
    const computed = input.computed[index] ?? Number.NaN;
    const observed = input.observed[index] ?? Number.NaN;
    const error = Math.abs(computed - observed);
    const localScale = Math.max(Math.abs(computed), input.relativeFloor);
    maximumAbsoluteError = Math.max(maximumAbsoluteError, error);
    maximumRelativeError = Math.max(maximumRelativeError, error / localScale);
    scale = Math.max(scale, Math.abs(computed));
  }
  return {
    id: input.id,
    maxAbsoluteError: maximumAbsoluteError,
    maxRelativeError: maximumRelativeError,
    absoluteTolerance: input.absoluteTolerance,
    relativeTolerance: input.relativeTolerance,
    pass:
      Number.isFinite(maximumAbsoluteError) &&
      maximumAbsoluteError <=
        input.absoluteTolerance + input.relativeTolerance * scale,
  };
};

const applyCrossCheck = (
  checks: Nhm2ComparisonCrossCheck[],
  breaches: string[],
  check: Nhm2ComparisonCrossCheck,
): void => {
  checks.push(check);
  if (!check.pass) breaches.push(`comparison_cross_check_failed:${check.id}`);
};

const gateUpper = (
  breaches: string[],
  id: string,
  value: number,
  limit: number,
): void => {
  if (!Number.isFinite(value) || value > limit) breaches.push(id);
};

const gateLower = (
  breaches: string[],
  id: string,
  value: number,
  limit: number,
): void => {
  if (!Number.isFinite(value) || value < limit) breaches.push(id);
};

const verifiedHashSet = (
  values: readonly Nhm2VerifiedReceiptHash[],
  blockerPrefix: string,
  blockers: string[],
): Set<string> => {
  const hashes = new Set<string>();
  for (const value of values) {
    if (
      value?.verified !== true ||
      !SHA256.test(value.sha256) ||
      /^0{64}$/.test(value.sha256)
    ) {
      blockers.push(`${blockerPrefix}_receipt_binding_invalid`);
      continue;
    }
    hashes.add(value.sha256);
  }
  return hashes;
};

const finalizeFamily = <Metrics>(input: {
  metrics: Metrics;
  comparisonCrossChecks: Nhm2ComparisonCrossCheck[];
  breaches: string[];
  blockers: string[];
}): Nhm2ScientificFamilyResult<Metrics> => {
  const blockers = uniqueSorted(input.blockers);
  const breaches = uniqueSorted(input.breaches);
  return {
    status: disposition(blockers, breaches),
    metrics: input.metrics,
    comparisonCrossChecks: input.comparisonCrossChecks,
    breaches,
    blockers,
  };
};

const replaySemiclassical = (
  index: FileIndex,
  thresholds: Nhm2PrimaryRawMaterialDynamicsThresholds,
): Nhm2ScientificFamilyResult<Nhm2SemiclassicalReplayMetrics> => {
  // This layer can independently replay mode-sum bookkeeping, but the raw
  // producer still supplies the mode tensors and subtraction terms. Until an
  // outer kernel reconstructs those values from the field equation, state
  // preparation, and renormalization prescription, a bookkeeping agreement
  // is not semiclassical-state closure.
  const blockers: string[] = [
    "semiclassical_mode_equation_kernel_unreplayed",
    "hadamard_state_admissibility_unreplayed",
    "renormalization_counterterm_and_ward_identity_unreplayed",
    "qei_semiclassical_state_identity_binding_unresolved",
  ];
  const breaches: string[] = [];
  const checks: Nhm2ComparisonCrossCheck[] = [];
  const coefficients = numerical(
    index,
    "semiclassical_state",
    "state_mode_coefficients",
    blockers,
  );
  const contributions = numerical(
    index,
    "semiclassical_state",
    "mode_tensor_contribution_components",
    blockers,
  );
  const subtraction = numerical(
    index,
    "semiclassical_state",
    "renormalization_subtraction_samples",
    blockers,
  );
  const rset = numerical(
    index,
    "semiclassical_state",
    "renormalized_tensor_components",
    blockers,
  );
  const uncertainty = numerical(
    index,
    "semiclassical_state",
    "uncertainty_samples",
    blockers,
  );
  const iterations = numerical(
    index,
    "semiclassical_state",
    "backreaction_iteration_fields",
    blockers,
  );
  const basis = numerical(
    index,
    "semiclassical_state",
    "mode_basis_samples",
    blockers,
  );
  if (
    coefficients == null ||
    contributions == null ||
    subtraction == null ||
    rset == null ||
    uncertainty == null ||
    iterations == null ||
    basis == null
  ) {
    return finalizeFamily({
      metrics: emptySemiclassicalMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  const sampleCount = rowCount(subtraction);
  const modeRows = rowCount(coefficients);
  if (
    columnCount(coefficients) !== 2 ||
    columnCount(basis) !== 2 ||
    columnCount(contributions) !== 10 ||
    columnCount(subtraction) !== 10 ||
    rowCount(basis) !== modeRows ||
    rowCount(contributions) !== modeRows ||
    sampleCount < 1 ||
    modeRows % sampleCount !== 0 ||
    rowCount(rset) !== sampleCount ||
    columnCount(rset) !== 10
  ) {
    blockers.push("semiclassical_sample_major_layout_unresolved");
    return finalizeFamily({
      metrics: emptySemiclassicalMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  const modeCount = modeRows / sampleCount;
  const reconstructed = new Array<number>(sampleCount * 10).fill(0);
  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (let mode = 0; mode < modeCount; mode += 1) {
      const row = sample * modeCount + mode;
      const real = at(coefficients, row, 0);
      const imaginary = at(coefficients, row, 1);
      const occupationWeight = real * real + imaginary * imaginary;
      for (let component = 0; component < 10; component += 1) {
        reconstructed[sample * 10 + component] +=
          occupationWeight * at(contributions, row, component);
      }
    }
    for (let component = 0; component < 10; component += 1) {
      reconstructed[sample * 10 + component] -= at(
        subtraction,
        sample,
        component,
      );
    }
  }
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "semiclassical_rset",
      computed: reconstructed,
      observed: [...rset.values],
      absoluteTolerance: thresholds.semiclassical.rsetAbsoluteToleranceJPerM3,
      relativeTolerance: thresholds.semiclassical.rsetRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  let maximumRelativeUncertainty95 = 0;
  if (rowCount(uncertainty) !== sampleCount || columnCount(uncertainty) !== 3) {
    blockers.push("semiclassical_uncertainty_layout_unresolved");
  } else {
    for (let row = 0; row < sampleCount; row += 1) {
      const lower = at(uncertainty, row, 0);
      const central = at(uncertainty, row, 1);
      const upper = at(uncertainty, row, 2);
      if (lower > central || central > upper)
        breaches.push("semiclassical_uncertainty_interval_invalid");
      const halfWidth = Math.max(
        Math.abs(central - lower),
        Math.abs(upper - central),
      );
      maximumRelativeUncertainty95 = Math.max(
        maximumRelativeUncertainty95,
        halfWidth / Math.max(Math.abs(central), thresholds.relativeFloor),
      );
    }
  }
  gateUpper(
    breaches,
    "semiclassical_uncertainty_threshold_breached",
    maximumRelativeUncertainty95,
    thresholds.semiclassical.maxRelativeUncertainty95,
  );
  const differences = rowDifferences(iterations);
  const finalDifference = differences.at(-1) ?? Number.POSITIVE_INFINITY;
  const priorDifference = differences.at(-2) ?? Number.POSITIVE_INFINITY;
  const convergenceRatio =
    finalDifference / Math.max(priorDifference, thresholds.relativeFloor);
  gateUpper(
    breaches,
    "semiclassical_backreaction_delta_threshold_breached",
    finalDifference,
    thresholds.semiclassical.maxFinalBackreactionDeltaJPerM3,
  );
  gateUpper(
    breaches,
    "semiclassical_backreaction_convergence_threshold_breached",
    convergenceRatio,
    thresholds.semiclassical.maxBackreactionConvergenceRatio,
  );
  return finalizeFamily({
    metrics: {
      sampleCount,
      modeCountPerSample: modeCount,
      reconstructedTensorComponentsJPerM3: reconstructed,
      maximumRelativeUncertainty95,
      backreactionIterationDifferencesJPerM3: differences,
      finalBackreactionDifferenceJPerM3: finalDifference,
      backreactionConvergenceRatio: convergenceRatio,
    },
    comparisonCrossChecks: checks,
    breaches,
    blockers,
  });
};

const reconstructCorrelation = (
  green: Nhm2PrimaryRawOutputVerifiedNumericalFile,
  matsubara: Nhm2PrimaryRawOutputVerifiedNumericalFile,
  surfaceCount: number,
): { components: number[]; modeCount: number } | null => {
  const greenRows = rowCount(green);
  if (
    columnCount(green) !== 18 ||
    columnCount(matsubara) !== 4 ||
    rowCount(matsubara) !== greenRows ||
    greenRows % surfaceCount !== 0
  ) {
    return null;
  }
  const modeCount = greenRows / surfaceCount;
  const result = new Array<number>(surfaceCount * 6).fill(0);
  for (let surface = 0; surface < surfaceCount; surface += 1) {
    for (let mode = 0; mode < modeCount; mode += 1) {
      const row = surface * modeCount + mode;
      const weight = at(matsubara, row, 3);
      const symmetric = [
        at(green, row, 0),
        0.5 * (at(green, row, 2) + at(green, row, 6)),
        0.5 * (at(green, row, 4) + at(green, row, 12)),
        at(green, row, 8),
        0.5 * (at(green, row, 10) + at(green, row, 14)),
        at(green, row, 16),
      ];
      for (let component = 0; component < 6; component += 1) {
        result[surface * 6 + component] += weight * (symmetric[component] ?? 0);
      }
    }
  }
  return { components: result, modeCount };
};

const maxwellStressFromCorrelations = (
  electric: readonly number[],
  magnetic: readonly number[],
): number[] => {
  const result = new Array<number>(electric.length).fill(0);
  for (let row = 0; row < electric.length / 6; row += 1) {
    const offset = row * 6;
    const traceElectric =
      (electric[offset] ?? 0) +
      (electric[offset + 3] ?? 0) +
      (electric[offset + 5] ?? 0);
    const traceMagnetic =
      (magnetic[offset] ?? 0) +
      (magnetic[offset + 3] ?? 0) +
      (magnetic[offset + 5] ?? 0);
    for (let component = 0; component < 6; component += 1) {
      const diagonal = component === 0 || component === 3 || component === 5;
      result[offset + component] =
        NHM2_SI_VACUUM_PERMITTIVITY_F_PER_M *
          ((electric[offset + component] ?? 0) -
            (diagonal ? 0.5 * traceElectric : 0)) +
        (1 / NHM2_SI_VACUUM_PERMEABILITY_N_PER_A2) *
          ((magnetic[offset + component] ?? 0) -
            (diagonal ? 0.5 * traceMagnetic : 0));
    }
  }
  return result;
};

const traction = (
  stress: readonly number[],
  offset: number,
  normal: readonly number[],
): [number, number, number] => {
  const xx = stress[offset] ?? 0;
  const xy = stress[offset + 1] ?? 0;
  const xz = stress[offset + 2] ?? 0;
  const yy = stress[offset + 3] ?? 0;
  const yz = stress[offset + 4] ?? 0;
  const zz = stress[offset + 5] ?? 0;
  const [nx, ny, nz] = normal;
  return [
    xx * (nx ?? 0) + xy * (ny ?? 0) + xz * (nz ?? 0),
    xy * (nx ?? 0) + yy * (ny ?? 0) + yz * (nz ?? 0),
    xz * (nx ?? 0) + yz * (ny ?? 0) + zz * (nz ?? 0),
  ];
};

const finiteDifference = (
  coordinates: readonly number[],
  values: readonly number[],
): number[] => {
  const result = new Array<number>(coordinates.length).fill(Number.NaN);
  for (let index = 0; index < coordinates.length; index += 1) {
    const left = index === 0 ? 0 : index - 1;
    const right =
      index === coordinates.length - 1 ? coordinates.length - 1 : index + 1;
    const denominator =
      (coordinates[right] ?? Number.NaN) - (coordinates[left] ?? Number.NaN);
    result[index] =
      ((values[right] ?? Number.NaN) - (values[left] ?? Number.NaN)) /
      denominator;
  }
  return result;
};

const replayMaxwell = (
  index: FileIndex,
  thresholds: Nhm2PrimaryRawMaterialDynamicsThresholds,
  materialReceiptHashes: ReadonlySet<string>,
): Nhm2ScientificFamilyResult<Nhm2MaxwellReplayMetrics> => {
  // Correlation, stress, traction, and force-gradient algebra is replayed
  // below. The Green dyadics themselves are still producer outputs rather
  // than an independently solved Maxwell operator on the pinned mesh and
  // dielectric data, and the caller-supplied receipt booleans are not yet a
  // byte-verifying receipt adapter.
  const blockers: string[] = [
    "finite_geometry_maxwell_green_operator_kernel_unreplayed",
    "material_measurement_receipt_content_verifier_unbound",
    "gap_surface_topology_binding_unresolved",
  ];
  const breaches: string[] = [];
  const checks: Nhm2ComparisonCrossCheck[] = [];
  const matsubara = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "matsubara_mode_samples",
    blockers,
  );
  const electricGreen = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "electric_green_dyadic_components",
    blockers,
  );
  const magneticGreen = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "magnetic_green_dyadic_components",
    blockers,
  );
  const electricObserved = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "electric_field_correlation_components",
    blockers,
  );
  const magneticObserved = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "magnetic_field_correlation_components",
    blockers,
  );
  const surface = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "integration_surface_samples",
    blockers,
  );
  const stressObserved = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "maxwell_stress_components",
    blockers,
  );
  const gapObserved = numerical(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "force_gap_gradient_samples",
    blockers,
  );
  const materialRegions = records(
    index,
    "finite_temperature_finite_geometry_maxwell_stress",
    "material_region_records",
    blockers,
  );
  if (
    matsubara == null ||
    electricGreen == null ||
    magneticGreen == null ||
    electricObserved == null ||
    magneticObserved == null ||
    surface == null ||
    stressObserved == null ||
    gapObserved == null ||
    materialRegions == null
  ) {
    return finalizeFamily({
      metrics: emptyMaxwellMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  for (const record of materialRegions.records) {
    const hash = record.measurement_receipt_sha256;
    if (typeof hash !== "string" || !materialReceiptHashes.has(hash)) {
      blockers.push(`material_measurement_receipt_unverified:${String(hash)}`);
    }
  }
  const surfaceCount = rowCount(surface);
  if (columnCount(surface) !== 7 || surfaceCount < 2) {
    blockers.push("maxwell_surface_layout_unresolved");
    return finalizeFamily({
      metrics: emptyMaxwellMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  for (let row = 0; row < rowCount(matsubara); row += 1) {
    if (
      at(matsubara, row, 0) <= 0 ||
      !Number.isSafeInteger(at(matsubara, row, 1)) ||
      at(matsubara, row, 1) < 0 ||
      at(matsubara, row, 2) < 0 ||
      at(matsubara, row, 3) < 0
    ) {
      breaches.push("maxwell_matsubara_domain_invalid");
    }
  }
  const electric = reconstructCorrelation(
    electricGreen,
    matsubara,
    surfaceCount,
  );
  const magnetic = reconstructCorrelation(
    magneticGreen,
    matsubara,
    surfaceCount,
  );
  if (
    electric == null ||
    magnetic == null ||
    electric.modeCount !== magnetic.modeCount
  ) {
    blockers.push("maxwell_surface_major_matsubara_layout_unresolved");
    return finalizeFamily({
      metrics: emptyMaxwellMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "electric_field_correlation",
      computed: electric.components,
      observed: [...electricObserved.values],
      absoluteTolerance: thresholds.maxwell.correlationAbsoluteTolerance,
      relativeTolerance: thresholds.maxwell.correlationRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "magnetic_field_correlation",
      computed: magnetic.components,
      observed: [...magneticObserved.values],
      absoluteTolerance: thresholds.maxwell.correlationAbsoluteTolerance,
      relativeTolerance: thresholds.maxwell.correlationRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  const stress = maxwellStressFromCorrelations(
    electric.components,
    magnetic.components,
  );
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "maxwell_stress",
      computed: stress,
      observed: [...stressObserved.values],
      absoluteTolerance: thresholds.maxwell.stressAbsoluteTolerancePa,
      relativeTolerance: thresholds.maxwell.stressRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  const totalForce: [number, number, number] = [0, 0, 0];
  const localNormalForces: number[] = [];
  for (let row = 0; row < surfaceCount; row += 1) {
    const normal = [
      at(surface, row, 3),
      at(surface, row, 4),
      at(surface, row, 5),
    ];
    const normalNorm = l2(normal);
    if (
      Math.abs(normalNorm - 1) > thresholds.maxwell.correlationAbsoluteTolerance
    ) {
      breaches.push("maxwell_surface_normal_not_unit");
    }
    const localTraction = traction(stress, row * 6, normal);
    const weight = at(surface, row, 6);
    if (weight <= 0) breaches.push("maxwell_surface_weight_not_positive");
    for (let axis = 0; axis < 3; axis += 1)
      totalForce[axis] += (localTraction[axis] ?? 0) * weight;
    localNormalForces.push(
      localTraction.reduce(
        (sum, value, axis) => sum + value * (normal[axis] ?? 0),
        0,
      ) * weight,
    );
  }
  const gapCount = rowCount(gapObserved);
  if (
    columnCount(gapObserved) !== 3 ||
    gapCount < 2 ||
    surfaceCount % gapCount !== 0
  ) {
    blockers.push("maxwell_gap_surface_grouping_unresolved");
    return finalizeFamily({
      metrics: {
        ...emptyMaxwellMetrics(),
        surfaceCount,
        matsubaraModeCountPerSurface: electric.modeCount,
        electricCorrelationComponents: electric.components,
        magneticCorrelationComponents: magnetic.components,
        maxwellStressComponentsPa: stress,
        totalForceN: totalForce,
      },
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  const surfacesPerGap = surfaceCount / gapCount;
  const gaps: number[] = [];
  const forceByGap: number[] = [];
  for (let gapIndex = 0; gapIndex < gapCount; gapIndex += 1) {
    gaps.push(at(gapObserved, gapIndex, 0));
    let force = 0;
    for (let local = 0; local < surfacesPerGap; local += 1) {
      force += localNormalForces[gapIndex * surfacesPerGap + local] ?? 0;
    }
    forceByGap.push(force);
    if (gapIndex > 0 && gaps[gapIndex] <= (gaps[gapIndex - 1] ?? Number.NaN)) {
      breaches.push("maxwell_gap_coordinates_not_strictly_increasing");
    }
  }
  const gradients = finiteDifference(gaps, forceByGap);
  const observedForces = Array.from({ length: gapCount }, (_, row) =>
    at(gapObserved, row, 1),
  );
  const observedGradients = Array.from({ length: gapCount }, (_, row) =>
    at(gapObserved, row, 2),
  );
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "surface_integrated_force",
      computed: forceByGap,
      observed: observedForces,
      absoluteTolerance: thresholds.maxwell.forceAbsoluteToleranceN,
      relativeTolerance: thresholds.maxwell.forceRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "force_gap_gradient",
      computed: gradients,
      observed: observedGradients,
      absoluteTolerance: thresholds.maxwell.gradientAbsoluteToleranceNPerM,
      relativeTolerance: thresholds.maxwell.gradientRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  const maximumGradient = maxAbs(gradients);
  gateUpper(
    breaches,
    "maxwell_force_gradient_threshold_breached",
    maximumGradient,
    thresholds.maxwell.maxAbsoluteForceGradientNPerM,
  );
  return finalizeFamily({
    metrics: {
      surfaceCount,
      matsubaraModeCountPerSurface: electric.modeCount,
      electricCorrelationComponents: electric.components,
      magneticCorrelationComponents: magnetic.components,
      maxwellStressComponentsPa: stress,
      totalForceN: totalForce,
      normalForceByGapN: forceByGap,
      gapValuesM: gaps,
      forceGradientNPerM: gradients,
      maximumAbsoluteForceGradientNPerM: maximumGradient,
    },
    comparisonCrossChecks: checks,
    breaches,
    blockers,
  });
};

const canonicalIndex = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  try {
    const parsed = BigInt(value);
    if (parsed < 0n || parsed > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return Number(parsed);
  } catch {
    return null;
  }
};

const replayMechanics = (
  index: FileIndex,
  thresholds: Nhm2PrimaryRawMaterialDynamicsThresholds,
  couponReceiptHashes: ReadonlySet<string>,
): Nhm2ScientificFamilyResult<Nhm2MechanicalReplayMetrics> => {
  // K*u-f and support-window arithmetic is useful post-processing, but the
  // stiffness matrix and support/retention surfaces remain producer values.
  // They cannot stand in for nonlinear constitutive assembly or the required
  // instability, fatigue, thermal, modal, and source-feedback solves.
  const blockers: string[] = [
    "nonlinear_fea_constitutive_assembly_unreplayed",
    "pull_in_buckling_contact_stiction_solver_unreplayed",
    "stress_thermal_fatigue_modal_solver_unreplayed",
    "material_coupon_receipt_content_verifier_unbound",
    "mechanical_source_tensor_feedback_unreplayed",
  ];
  const breaches: string[] = [];
  const checks: Nhm2ComparisonCrossCheck[] = [];
  const stiffness = records(
    index,
    "mechanical_support_control_margin",
    "stiffness_matrix_entries",
    blockers,
  );
  const materials = records(
    index,
    "mechanical_support_control_margin",
    "material_constitutive_records",
    blockers,
  );
  const load = numerical(
    index,
    "mechanical_support_control_margin",
    "load_vector_components",
    blockers,
  );
  const displacement = numerical(
    index,
    "mechanical_support_control_margin",
    "displacement_components",
    blockers,
  );
  const observedResidual = numerical(
    index,
    "mechanical_support_control_margin",
    "residual_force_components",
    blockers,
  );
  const support = numerical(
    index,
    "mechanical_support_control_margin",
    "support_retention_samples",
    blockers,
  );
  const control = numerical(
    index,
    "mechanical_support_control_margin",
    "active_control_cycle_samples",
    blockers,
  );
  const budgets = numerical(
    index,
    "mechanical_support_control_margin",
    "energy_heat_noise_samples",
    blockers,
  );
  if (
    stiffness == null ||
    materials == null ||
    load == null ||
    displacement == null ||
    observedResidual == null ||
    support == null ||
    control == null ||
    budgets == null
  ) {
    return finalizeFamily({
      metrics: emptyMechanicalMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  for (const record of materials.records) {
    const hash = record.coupon_receipt_sha256;
    if (typeof hash !== "string" || !couponReceiptHashes.has(hash)) {
      blockers.push(`material_coupon_receipt_unverified:${String(hash)}`);
    }
  }
  if (
    columnCount(load) !== 3 ||
    columnCount(displacement) !== 3 ||
    rowCount(load) !== rowCount(displacement) ||
    rowCount(observedResidual) !== rowCount(load) ||
    columnCount(observedResidual) !== 3
  ) {
    blockers.push("mechanical_node_major_xyz_layout_unresolved");
    return finalizeFamily({
      metrics: emptyMechanicalMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  const dofCount = load.values.length;
  const ku = new Array<number>(dofCount).fill(0);
  for (const entry of stiffness.records) {
    const row = canonicalIndex(entry.row_index);
    const column = canonicalIndex(entry.column_index);
    const value = entry.value;
    if (
      row == null ||
      column == null ||
      row >= dofCount ||
      column >= dofCount ||
      typeof value !== "number"
    ) {
      blockers.push("mechanical_sparse_stiffness_index_invalid");
      continue;
    }
    ku[row] += value * (displacement.values[column] ?? Number.NaN);
  }
  const residual = ku.map(
    (value, dof) => value - (load.values[dof] ?? Number.NaN),
  );
  const residualL2 = l2(residual);
  const relativeResidual =
    residualL2 / Math.max(l2([...load.values]), thresholds.relativeFloor);
  gateUpper(
    breaches,
    "mechanical_residual_absolute_threshold_breached",
    residualL2,
    thresholds.mechanics.residualAbsoluteToleranceN,
  );
  gateUpper(
    breaches,
    "mechanical_residual_relative_threshold_breached",
    relativeResidual,
    thresholds.mechanics.residualRelativeTolerance,
  );
  applyCrossCheck(
    checks,
    breaches,
    comparison({
      id: "mechanical_residual_force",
      computed: residual,
      observed: [...observedResidual.values],
      absoluteTolerance:
        thresholds.mechanics.residualComparisonAbsoluteToleranceN,
      relativeTolerance:
        thresholds.mechanics.residualComparisonRelativeTolerance,
      relativeFloor: thresholds.relativeFloor,
    }),
  );
  let structuralMinimum = Number.POSITIVE_INFINITY;
  let sourceMaximum = Number.NEGATIVE_INFINITY;
  if (columnCount(support) !== 5) {
    blockers.push("mechanical_support_retention_layout_unresolved");
  } else {
    for (let row = 0; row < rowCount(support); row += 1) {
      const fraction = at(support, row, 0);
      const structuralMargin = at(support, row, 1);
      const retentionFraction = at(support, row, 2);
      const sourceMargin = at(support, row, 3);
      if (
        fraction < 0 ||
        fraction > 1 ||
        retentionFraction < 0 ||
        retentionFraction > 1
      ) {
        breaches.push("mechanical_support_fraction_domain_invalid");
      }
      if (structuralMargin >= thresholds.mechanics.minimumStructuralMargin) {
        structuralMinimum = Math.min(structuralMinimum, fraction);
      }
      if (sourceMargin >= thresholds.mechanics.minimumSourceRetentionMargin) {
        sourceMaximum = Math.max(sourceMaximum, fraction);
      }
    }
  }
  const minimumStructuralSupportFraction = Number.isFinite(structuralMinimum)
    ? structuralMinimum
    : null;
  const maximumSourceRetentionSupportFraction = Number.isFinite(sourceMaximum)
    ? sourceMaximum
    : null;
  let overlapRatio: number | null = null;
  if (
    minimumStructuralSupportFraction == null ||
    maximumSourceRetentionSupportFraction == null ||
    minimumStructuralSupportFraction <= 0
  ) {
    breaches.push("mechanical_support_feasible_boundary_missing");
  } else {
    overlapRatio =
      maximumSourceRetentionSupportFraction / minimumStructuralSupportFraction;
    gateLower(
      breaches,
      "mechanical_support_retention_overlap_missing",
      overlapRatio,
      thresholds.mechanics.minimumOverlapRatio,
    );
  }
  let powerIntegratedCycleEnergy = 0;
  let mechanicalWork = 0;
  if (columnCount(control) !== 6 || rowCount(control) < 2) {
    blockers.push("mechanical_control_cycle_layout_unresolved");
  } else {
    for (let row = 1; row < rowCount(control); row += 1) {
      const deltaTime = at(control, row, 0) - at(control, row - 1, 0);
      if (deltaTime <= 0)
        breaches.push("mechanical_control_time_not_strictly_increasing");
      powerIntegratedCycleEnergy +=
        0.5 *
        (Math.abs(at(control, row - 1, 3)) + Math.abs(at(control, row, 3))) *
        deltaTime;
      mechanicalWork += Math.abs(
        0.5 *
          (at(control, row - 1, 1) + at(control, row, 1)) *
          (at(control, row, 2) - at(control, row - 1, 2)),
      );
    }
  }
  let weightedEnergy = 0;
  let weightedHeat = 0;
  let weightedNoiseSquare = 0;
  let weightTotal = 0;
  let maximumTimingFraction = 0;
  if (columnCount(budgets) !== 4) {
    blockers.push("mechanical_energy_heat_noise_layout_unresolved");
  } else {
    for (let row = 0; row < rowCount(budgets); row += 1) {
      const timing = at(budgets, row, 3);
      if (timing < 0 || timing > 1)
        breaches.push("mechanical_timing_fraction_domain_invalid");
      maximumTimingFraction = Math.max(maximumTimingFraction, timing);
      weightedEnergy += Math.abs(at(budgets, row, 0)) * timing;
      weightedHeat += Math.abs(at(budgets, row, 1)) * timing;
      weightedNoiseSquare += at(budgets, row, 2) ** 2 * timing;
      weightTotal += timing;
    }
  }
  const weightedNoiseRms = Math.sqrt(
    weightedNoiseSquare / Math.max(weightTotal, thresholds.relativeFloor),
  );
  gateUpper(
    breaches,
    "mechanical_cycle_energy_budget_breached",
    powerIntegratedCycleEnergy,
    thresholds.mechanics.maxCycleEnergyJ,
  );
  gateUpper(
    breaches,
    "mechanical_weighted_heat_budget_breached",
    weightedHeat,
    thresholds.mechanics.maxWeightedHeatJ,
  );
  gateUpper(
    breaches,
    "mechanical_weighted_noise_budget_breached",
    weightedNoiseRms,
    thresholds.mechanics.maxWeightedNoise,
  );
  gateUpper(
    breaches,
    "mechanical_timing_fraction_budget_breached",
    maximumTimingFraction,
    thresholds.mechanics.maxTimingFraction,
  );
  return finalizeFamily({
    metrics: {
      degreeOfFreedomCount: dofCount,
      residualComponentsN: residual,
      residualL2N: residualL2,
      relativeResidual,
      minimumStructuralSupportFraction,
      maximumSourceRetentionSupportFraction,
      overlapRatio,
      powerIntegratedCycleEnergyJ: powerIntegratedCycleEnergy,
      mechanicalWorkMagnitudeJ: mechanicalWork,
      weightedEnergyJ: weightedEnergy,
      weightedHeatJ: weightedHeat,
      weightedNoiseRms,
      maximumTimingFraction,
    },
    comparisonCrossChecks: checks,
    breaches,
    blockers,
  });
};

const replayDynamics = (
  index: FileIndex,
  thresholds: Nhm2PrimaryRawMaterialDynamicsThresholds,
): Nhm2ScientificFamilyResult<Nhm2DynamicsReplayMetrics> => {
  const blockers = ["bssn_evolution_equations_unresolved"];
  const breaches: string[] = [];
  const checks: Nhm2ComparisonCrossCheck[] = [];
  const grid = records(
    index,
    "dynamic_backreaction_stability_causality",
    "evolution_grid_records",
    blockers,
  );
  const refinement = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "resolution_refinement_samples",
    blockers,
  );
  const iterations = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "backreaction_iteration_fields",
    blockers,
  );
  const perturbation = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "perturbation_mode_samples",
    blockers,
  );
  const rays = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "characteristic_ray_samples",
    blockers,
  );
  const causal = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "causal_screen_samples",
    blockers,
  );
  const neighborhood = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "parameter_neighborhood_samples",
    blockers,
  );
  const producerConstraints = numerical(
    index,
    "dynamic_backreaction_stability_causality",
    "constraint_residual_components",
    blockers,
  );
  if (
    grid == null ||
    refinement == null ||
    iterations == null ||
    perturbation == null ||
    rays == null ||
    causal == null ||
    neighborhood == null ||
    producerConstraints == null
  ) {
    return finalizeFamily({
      metrics: emptyDynamicsMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  let nonnegativeIndices = true;
  for (const record of grid.records) {
    const timeIndex = canonicalIndex(record.time_index);
    const gridIndex = canonicalIndex(record.grid_index);
    if (timeIndex == null || gridIndex == null) nonnegativeIndices = false;
  }
  if (!nonnegativeIndices)
    breaches.push("dynamic_sample_or_time_index_negative");
  const refinementRows = Array.from(
    { length: rowCount(refinement) },
    (_, row) => ({
      resolution: at(refinement, row, 0),
      norm: at(refinement, row, 1),
    }),
  ).sort((left, right) => left.resolution - right.resolution);
  const refinementOrders: number[] = [];
  if (columnCount(refinement) !== 3 || refinementRows.length < 3) {
    blockers.push("dynamic_refinement_primitives_missing");
  } else {
    for (let row = 1; row < refinementRows.length; row += 1) {
      const coarse = refinementRows[row - 1];
      const fine = refinementRows[row];
      if (
        coarse == null ||
        fine == null ||
        coarse.resolution <= 0 ||
        fine.resolution <= coarse.resolution ||
        coarse.norm < 0 ||
        fine.norm < 0
      ) {
        breaches.push("dynamic_refinement_domain_invalid");
        continue;
      }
      refinementOrders.push(
        Math.log(
          Math.max(coarse.norm, thresholds.relativeFloor) /
            Math.max(fine.norm, thresholds.relativeFloor),
        ) / Math.log(fine.resolution / coarse.resolution),
      );
    }
  }
  const minimumRefinementOrder = Math.min(...refinementOrders);
  gateLower(
    breaches,
    "dynamic_refinement_order_threshold_breached",
    minimumRefinementOrder,
    thresholds.dynamics.minimumRefinementOrder,
  );
  const iterationDifferences = rowDifferences(iterations);
  const finalIterationDifference =
    iterationDifferences.at(-1) ?? Number.POSITIVE_INFINITY;
  gateUpper(
    breaches,
    "dynamic_iteration_delta_threshold_breached",
    finalIterationDifference,
    thresholds.dynamics.maxFinalIterationDelta,
  );
  const growthRates: number[] = [];
  const reportedGrowth: number[] = [];
  if (columnCount(perturbation) !== 4 || rowCount(perturbation) < 2) {
    blockers.push("dynamic_perturbation_primitives_missing");
  } else {
    growthRates.push(0);
    reportedGrowth.push(at(perturbation, 0, 3));
    for (let row = 1; row < rowCount(perturbation); row += 1) {
      const deltaTime = at(perturbation, row, 0) - at(perturbation, row - 1, 0);
      if (deltaTime <= 0)
        breaches.push("dynamic_perturbation_time_not_strictly_increasing");
      const priorAmplitude = Math.hypot(
        at(perturbation, row - 1, 1),
        at(perturbation, row - 1, 2),
      );
      const amplitude = Math.hypot(
        at(perturbation, row, 1),
        at(perturbation, row, 2),
      );
      growthRates.push(
        Math.log(
          Math.max(amplitude, thresholds.relativeFloor) /
            Math.max(priorAmplitude, thresholds.relativeFloor),
        ) / deltaTime,
      );
      reportedGrowth.push(at(perturbation, row, 3));
    }
    applyCrossCheck(
      checks,
      breaches,
      comparison({
        id: "perturbation_growth_rate",
        computed: growthRates,
        observed: reportedGrowth,
        absoluteTolerance:
          thresholds.dynamics.perturbationGrowthAbsoluteTolerance,
        relativeTolerance: 0,
        relativeFloor: thresholds.relativeFloor,
      }),
    );
  }
  const maximumGrowthRate = Math.max(...growthRates);
  gateUpper(
    breaches,
    "dynamic_perturbation_growth_threshold_breached",
    maximumGrowthRate,
    thresholds.dynamics.maxPerturbationGrowthRate,
  );
  let minimumRayFrequency = Number.POSITIVE_INFINITY;
  let minimumRayAffine = Number.POSITIVE_INFINITY;
  let minimumOutgoingExpansion = Number.POSITIVE_INFINITY;
  let maximumOutgoingExpansion = Number.NEGATIVE_INFINITY;
  if (columnCount(rays) !== 7) {
    blockers.push("dynamic_characteristic_ray_primitives_missing");
  } else {
    for (let row = 0; row < rowCount(rays); row += 1) {
      const affine = at(rays, row, 0);
      const frequency = at(rays, row, 5);
      const expansion = at(rays, row, 6);
      minimumRayAffine = Math.min(minimumRayAffine, affine);
      minimumRayFrequency = Math.min(minimumRayFrequency, frequency);
      minimumOutgoingExpansion = Math.min(minimumOutgoingExpansion, expansion);
      maximumOutgoingExpansion = Math.max(maximumOutgoingExpansion, expansion);
      if (row > 0 && affine <= at(rays, row - 1, 0))
        breaches.push("dynamic_ray_affine_parameter_not_increasing");
    }
  }
  gateLower(
    breaches,
    "dynamic_ray_affine_parameter_not_nonnegative",
    minimumRayAffine,
    0,
  );
  gateLower(
    breaches,
    "dynamic_ray_frequency_threshold_breached",
    minimumRayFrequency,
    thresholds.dynamics.minimumRayFrequency,
  );
  let maximumCausalInterval = Number.NEGATIVE_INFINITY;
  let minimumHyperbolicity = Number.POSITIVE_INFINITY;
  if (columnCount(causal) !== 5) {
    blockers.push("dynamic_causal_screen_primitives_missing");
  } else {
    for (let row = 0; row < rowCount(causal); row += 1) {
      maximumCausalInterval = Math.max(
        maximumCausalInterval,
        at(causal, row, 1),
      );
      minimumHyperbolicity = Math.min(minimumHyperbolicity, at(causal, row, 4));
    }
  }
  gateUpper(
    breaches,
    "dynamic_causal_interval_threshold_breached",
    maximumCausalInterval,
    thresholds.dynamics.maximumCausalIntervalSquared,
  );
  gateLower(
    breaches,
    "dynamic_hyperbolicity_threshold_breached",
    minimumHyperbolicity,
    thresholds.dynamics.minimumHyperbolicityMargin,
  );
  let minimumNeighborhoodRobust = Number.POSITIVE_INFINITY;
  let negativeNeighborhoodSamples = 0;
  let positiveNeighborhoodSamples = 0;
  if (columnCount(neighborhood) !== 3) {
    blockers.push("dynamic_parameter_neighborhood_primitives_missing");
  } else {
    for (let row = 0; row < rowCount(neighborhood); row += 1) {
      const delta = at(neighborhood, row, 0);
      if (delta < 0) negativeNeighborhoodSamples += 1;
      if (delta > 0) positiveNeighborhoodSamples += 1;
      minimumNeighborhoodRobust = Math.min(
        minimumNeighborhoodRobust,
        at(neighborhood, row, 1) - Math.abs(at(neighborhood, row, 2)),
      );
    }
  }
  gateLower(
    breaches,
    "dynamic_neighborhood_robust_margin_breached",
    minimumNeighborhoodRobust,
    thresholds.dynamics.minimumNeighborhoodRobustMargin,
  );
  gateLower(
    breaches,
    "dynamic_negative_neighborhood_coverage_missing",
    negativeNeighborhoodSamples,
    thresholds.dynamics.minimumNeighborhoodSamplesPerSide,
  );
  gateLower(
    breaches,
    "dynamic_positive_neighborhood_coverage_missing",
    positiveNeighborhoodSamples,
    thresholds.dynamics.minimumNeighborhoodSamplesPerSide,
  );
  return finalizeFamily({
    metrics: {
      nonnegativeSampleAndTimeIndices: nonnegativeIndices,
      refinementOrders,
      minimumRefinementOrder,
      backreactionIterationDifferences: iterationDifferences,
      finalBackreactionIterationDifference: finalIterationDifference,
      perturbationGrowthRates: growthRates,
      maximumPerturbationGrowthRate: maximumGrowthRate,
      minimumRayFrequency,
      minimumRayAffineParameter: minimumRayAffine,
      minimumOutgoingExpansion,
      maximumOutgoingExpansion,
      maximumCausalIntervalSquared: maximumCausalInterval,
      minimumHyperbolicityMargin: minimumHyperbolicity,
      minimumNeighborhoodRobustMargin: minimumNeighborhoodRobust,
      negativeNeighborhoodSampleCount: negativeNeighborhoodSamples,
      positiveNeighborhoodSampleCount: positiveNeighborhoodSamples,
      producerConstraintResidualMaximumAbsolute: maxAbs(
        producerConstraints.values,
      ),
      producerConstraintResidualHasAuthority: false,
    },
    comparisonCrossChecks: checks,
    breaches,
    blockers,
  });
};

const replayObservableProjection = (
  index: FileIndex,
  thresholds: Nhm2PrimaryRawMaterialDynamicsThresholds,
): Nhm2ScientificFamilyResult<Nhm2ObservableReplayMetrics> => {
  const blockers: string[] = [];
  const breaches: string[] = [];
  const checks: Nhm2ComparisonCrossCheck[] = [];
  const definitions = records(
    index,
    "observable_projection",
    "observable_definition_records",
    blockers,
  );
  const derivations = records(
    index,
    "observable_projection",
    "projection_derivation_inputs",
    blockers,
  );
  const operators = records(
    index,
    "observable_projection",
    "projection_operator_entries",
    blockers,
  );
  const source = numerical(
    index,
    "observable_projection",
    "projection_source_values",
    blockers,
  );
  const jacobian = numerical(
    index,
    "observable_projection",
    "projection_jacobian_components",
    blockers,
  );
  const sourceUncertainty = numerical(
    index,
    "observable_projection",
    "projection_uncertainty_samples",
    blockers,
  );
  const observed = numerical(
    index,
    "observable_projection",
    "observable_sample_vectors",
    blockers,
  );
  if (
    definitions == null ||
    derivations == null ||
    operators == null ||
    source == null ||
    jacobian == null ||
    sourceUncertainty == null
  ) {
    return finalizeFamily({
      metrics: emptyObservableMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  const observableIds = [...NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS];
  if (definitions.records.length !== observableIds.length)
    blockers.push("observable_definition_cardinality_not_six");
  if (
    definitions.records.some(
      (record, index) =>
        record.observable_id !== observableIds[index] ||
        record.unit !==
          NHM2_PRIMARY_RAW_OBSERVABLE_UNIT_BY_ID[
            observableIds[index] ?? "DeltaTmunu_xt"
          ],
    )
  ) {
    blockers.push("observable_definition_identity_order_or_unit_mismatch");
  }
  const observableIndex = new Map<string, number>(
    observableIds.map((id, position) => [id, position]),
  );
  if (
    derivations.records.length !== observableIds.length ||
    derivations.records.some(
      (record, index) => record.observable_id !== observableIds[index],
    )
  ) {
    blockers.push("observable_derivation_binding_not_exact");
  }
  const allowedSourceFamilies = new Set<string>(
    NHM2_PRIMARY_RAW_OBSERVABLE_SOURCE_FAMILY_IDS,
  );
  const rolePolicies =
    NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES as unknown as Record<
      string,
      Record<string, Nhm2PrimaryRawRoleContentPolicyV1>
    >;
  const verifiedDerivationSourceBindings: Nhm2ObservableReplayMetrics["verifiedDerivationSourceBindings"] =
    [];
  for (const [derivationIndex, derivation] of derivations.records.entries()) {
    const expectedObservableId = observableIds[derivationIndex];
    const sourceFileId = derivation.source_file_id;
    const sourceSha256 = derivation.source_sha256;
    if (
      expectedObservableId == null ||
      derivation.observable_id !== expectedObservableId ||
      typeof sourceFileId !== "string" ||
      sourceFileId.length === 0 ||
      typeof sourceSha256 !== "string" ||
      !SHA256.test(sourceSha256)
    ) {
      blockers.push(
        `observable_derivation_source_binding_invalid:${derivationIndex}`,
      );
      continue;
    }
    const matchingSources = [...index.values()].filter(
      (file) => file.descriptor.fileId === sourceFileId,
    );
    if (matchingSources.length !== 1) {
      blockers.push(
        `observable_derivation_source_file_unverified:${expectedObservableId}`,
      );
      continue;
    }
    const sourceFile = matchingSources[0]!;
    if (
      sourceFile.observedSha256 !== sourceSha256 ||
      sourceFile.descriptor.sha256 !== sourceSha256
    ) {
      blockers.push(
        `observable_derivation_source_hash_mismatch:${expectedObservableId}`,
      );
      continue;
    }
    const sourceRolePolicy =
      rolePolicies[sourceFile.descriptor.familyId]?.[
        sourceFile.descriptor.semanticRole
      ];
    if (
      sourceFile.kind !== "numerical_array" ||
      !allowedSourceFamilies.has(sourceFile.descriptor.familyId) ||
      sourceRolePolicy?.kind !== "numerical_array" ||
      sourceRolePolicy.producerValueIsComparisonOnly
    ) {
      blockers.push(
        `observable_derivation_source_role_not_allowed:${expectedObservableId}`,
      );
      continue;
    }
    verifiedDerivationSourceBindings.push({
      observableId: expectedObservableId,
      sourceFileId,
      sourceFamilyId: sourceFile.descriptor.familyId,
      sourceSemanticRole: sourceFile.descriptor.semanticRole,
      sourceSha256,
    });
  }
  if (verifiedDerivationSourceBindings.length !== observableIds.length) {
    blockers.push("observable_derivation_source_hash_closure_incomplete");
  }
  blockers.push(
    "observable_projection_source_component_unit_conversion_unresolved",
  );
  if (
    columnCount(source) !== 1 ||
    columnCount(jacobian) !== 1 ||
    rowCount(jacobian) !== operators.records.length ||
    columnCount(sourceUncertainty) !== 3 ||
    rowCount(sourceUncertainty) !== rowCount(source)
  ) {
    blockers.push("observable_sparse_projection_layout_unresolved");
    return finalizeFamily({
      metrics: emptyObservableMetrics(),
      comparisonCrossChecks: checks,
      breaches,
      blockers,
    });
  }
  const sourceSigma: number[] = [];
  for (let row = 0; row < rowCount(source); row += 1) {
    const lower = at(sourceUncertainty, row, 0);
    const central = at(sourceUncertainty, row, 1);
    const upper = at(sourceUncertainty, row, 2);
    if (lower > central || central > upper)
      breaches.push("observable_source_uncertainty_interval_invalid");
    sourceSigma.push(
      Math.max(Math.abs(central - lower), Math.abs(upper - central)),
    );
  }
  const predicted = new Array<number>(observableIds.length).fill(0);
  const variance = new Array<number>(observableIds.length).fill(0);
  const entryCounts = new Array<number>(observableIds.length).fill(0);
  for (const [entryIndex, entry] of operators.records.entries()) {
    const outputIndex = observableIndex.get(String(entry.observable_id));
    const sourceIndex = canonicalIndex(entry.source_index);
    const coefficient = entry.coefficient;
    if (
      outputIndex == null ||
      sourceIndex == null ||
      sourceIndex >= rowCount(source) ||
      typeof coefficient !== "number"
    ) {
      blockers.push("observable_sparse_projection_entry_invalid");
      continue;
    }
    predicted[outputIndex] += coefficient * at(source, sourceIndex, 0);
    const derivative = at(jacobian, entryIndex, 0);
    variance[outputIndex] +=
      (derivative * (sourceSigma[sourceIndex] ?? Number.NaN)) ** 2;
    entryCounts[outputIndex] += 1;
  }
  if (entryCounts.some((count) => count < 1))
    blockers.push("observable_sparse_projection_row_empty");
  const propagated = variance.map(Math.sqrt);
  if (
    observed != null &&
    columnCount(observed) === 3 &&
    rowCount(observed) === observableIds.length
  ) {
    const observedPredicted = Array.from(
      { length: observableIds.length },
      (_, row) => at(observed, row, 1),
    );
    const observedUncertainty = Array.from(
      { length: observableIds.length },
      (_, row) => at(observed, row, 2),
    );
    applyCrossCheck(
      checks,
      breaches,
      comparison({
        id: "observable_predicted_values",
        computed: predicted,
        observed: observedPredicted,
        absoluteTolerance: thresholds.observable.predictionAbsoluteTolerance,
        relativeTolerance: thresholds.observable.predictionRelativeTolerance,
        relativeFloor: thresholds.relativeFloor,
      }),
    );
    applyCrossCheck(
      checks,
      breaches,
      comparison({
        id: "observable_propagated_uncertainty",
        computed: propagated,
        observed: observedUncertainty,
        absoluteTolerance: thresholds.observable.uncertaintyAbsoluteTolerance,
        relativeTolerance: thresholds.observable.uncertaintyRelativeTolerance,
        relativeFloor: thresholds.relativeFloor,
      }),
    );
  } else if (observed != null) {
    blockers.push("observable_comparison_sample_layout_invalid");
  }
  gateUpper(
    breaches,
    "observable_uncertainty_threshold_breached",
    Math.max(...propagated),
    thresholds.observable.maxPropagatedUncertainty95,
  );
  return finalizeFamily({
    metrics: {
      observableIds,
      sourceValueCount: rowCount(source),
      verifiedDerivationSourceBindings,
      predictedValues: predicted,
      propagatedUncertainty95: propagated,
      dimensionalNormalizationResolved: false,
      comparisonSampleVectorsHaveAuthority: false,
    },
    comparisonCrossChecks: checks,
    breaches,
    blockers,
  });
};

/**
 * Replays non-GR scientific content from filesystem-verified primitive files.
 * Producer-authored comparison arrays are never used as governing values. This
 * function deliberately cannot resolve the BSSN evolution equations and keeps
 * every physical, transport, propulsion, ETA, and speed claim locked false.
 */
export function replayNhm2PrimaryRawMaterialDynamicsContent(
  input: Nhm2PrimaryRawMaterialDynamicsReplayInput,
): Nhm2PrimaryRawMaterialDynamicsReplayResult {
  if (input.rawVerification.verified !== true) {
    return allBlockedResult(["raw_filesystem_verification_required"]);
  }
  const inputBlockers = validateThresholds(input.thresholds);
  if (
    input.thresholdBinding?.frozenBeforeReplay !== true ||
    !SHA256.test(input.thresholdBinding.sha256) ||
    input.thresholdBinding.sha256 !==
      computeNhm2PrimaryRawMaterialDynamicsThresholdSha256(input.thresholds)
  ) {
    inputBlockers.push("diagnostic_threshold_binding_invalid");
  }
  if (
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.metricSignature !== "-+++" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.tensor10Variance !==
      "covariant" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.spacetimeVectorVariance !==
      "contravariant" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.modeTensorLayout !==
      "sample_major_then_mode_minor" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.matsubaraGreenDyadicLayout !==
      "surface_major_then_mode_minor" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.mechanicalDofLayout !==
      "node_major_xyz" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.projectionOperatorLayout !==
      "observable_id_by_source_index_sparse" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.projectionRequiredObservableIds
      .length !== NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS.length ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.projectionRequiredObservableIds.some(
      (observableId, index) =>
        observableId !== NHM2_PRIMARY_RAW_REQUIRED_OBSERVABLE_IDS[index],
    ) ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions
      .projectionDerivationSourcePolicy !==
      "filesystem_verified_upstream_numerical_non_comparison_role" ||
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions
      .projectionDimensionalNormalizationContract !==
      "unresolved_v1_requires_source_component_unit_and_conversion_binding" ||
    NHM2_PRIMARY_RAW_CONTENT_ROLE_POLICIES.observable_projection
      .observable_definition_records.minimumRecordCount !== 6
  ) {
    inputBlockers.push("raw_content_convention_mismatch");
  }
  const indexed = validateAndIndexVerification(input.rawVerification);
  inputBlockers.push(...indexed.blockers);
  if (inputBlockers.length > 0) return allBlockedResult(inputBlockers);
  const receiptBlockers: string[] = [];
  const materialReceiptHashes = verifiedHashSet(
    input.receipts?.materialMeasurement ?? [],
    "material_measurement",
    receiptBlockers,
  );
  const couponReceiptHashes = verifiedHashSet(
    input.receipts?.materialCoupon ?? [],
    "material_coupon",
    receiptBlockers,
  );
  const semiclassical = replaySemiclassical(indexed.index, input.thresholds);
  const maxwell = replayMaxwell(
    indexed.index,
    input.thresholds,
    materialReceiptHashes,
  );
  const mechanics = replayMechanics(
    indexed.index,
    input.thresholds,
    couponReceiptHashes,
  );
  maxwell.blockers.push(
    ...receiptBlockers.filter((entry) =>
      entry.startsWith("material_measurement"),
    ),
  );
  mechanics.blockers.push(
    ...receiptBlockers.filter((entry) => entry.startsWith("material_coupon")),
  );
  maxwell.blockers = uniqueSorted(maxwell.blockers);
  mechanics.blockers = uniqueSorted(mechanics.blockers);
  maxwell.status = disposition(maxwell.blockers, maxwell.breaches);
  mechanics.status = disposition(mechanics.blockers, mechanics.breaches);
  const dynamics = replayDynamics(indexed.index, input.thresholds);
  const observableProjection = replayObservableProjection(
    indexed.index,
    input.thresholds,
  );
  const families = {
    semiclassical,
    maxwell,
    mechanics,
    dynamics,
    observableProjection,
  };
  const statuses = Object.values(families).map((family) => family.status);
  const status: Nhm2ScientificDisposition = statuses.includes("blocked")
    ? "blocked"
    : statuses.includes("fail")
      ? "fail"
      : "pass";
  const unresolvedKernelBlockers = uniqueSorted(
    Object.values(families).flatMap((family) =>
      family.blockers.filter((blocker) =>
        /(?:unresolved|unreplayed|unbound)$/.test(blocker),
      ),
    ),
  );
  return {
    contractVersion: NHM2_PRIMARY_RAW_MATERIAL_DYNAMICS_REPLAY_CONTRACT_VERSION,
    status,
    acceptedInput: true,
    inputBlockers: [],
    fileHashClosure: buildFileHashClosure(input.rawVerification),
    families,
    unresolvedKernelBlockers,
    claimBoundary: claimBoundary(),
  };
}
