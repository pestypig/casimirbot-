import { createHash } from "node:crypto";

import {
  NHM2_PRIMARY_RAW_CONTENT_POLICY,
  NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS,
  type Nhm2PrimaryRawRequiredApparatusTerm,
} from "../../../shared/contracts/nhm2-primary-raw-content-policy.v1";
import type { Nhm2PrimaryRawOutputFamilyId } from "../../../shared/contracts/nhm2-primary-raw-output-manifest.v1";
import type {
  Nhm2PrimaryRawOutputFilesystemVerification,
  Nhm2PrimaryRawOutputVerifiedFile,
  Nhm2PrimaryRawOutputVerifiedNumericalFile,
  Nhm2PrimaryRawOutputVerifiedRecordFile,
} from "./nhm2-primary-raw-output-filesystem-verifier";

export const NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_ARTIFACT_ID =
  "nhm2.primary_raw_gr_content_replay" as const;
export const NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_CONTRACT_VERSION =
  "nhm2_primary_raw_gr_content_replay/v1" as const;

export const NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS = {
  comparisonAbsolute: 1e-9,
  comparisonRelative: 1e-9,
  sourceResidualRelativeMax: 0.1,
  conservationRelativeMax: 0.1,
  vectorNormalizationAbsoluteMax: 1e-8,
  samplingNormalizationAbsoluteMax: 1e-6,
  conditionAbsoluteTolerance: 1e-9,
  scaleFloor: 1e-30,
} as const;

export type Nhm2PrimaryRawGrDiagnosticDisposition = "pass" | "fail" | "blocked";

export type Nhm2PrimaryRawGrFamilyDiagnostic<Metrics> = {
  disposition: Nhm2PrimaryRawGrDiagnosticDisposition;
  blockers: string[];
  failures: string[];
  metrics: Metrics;
};

export type Nhm2PrimaryRawGrApparatusMetrics = {
  sampleCount: number;
  tensorComponentCount: number;
  requiredTermCount: number;
  ledgerTermCount: number;
  coveredRequiredTermCount: number;
  sourceBindingCount: number;
  ledgerCoveredTermRows: number;
  metricTargetDependencyCount: number;
  forbiddenTargetEchoCount: number;
  activeTensorValueCount: number;
  maxAbsRequired: number | null;
  maxAbsRecomputedTotal: number | null;
  maxAbsResidual: number | null;
  relativeResidual: number | null;
  totalComparisonMaxAbs: number | null;
  totalComparisonRelative: number | null;
  residualComparisonMaxAbs: number | null;
  residualComparisonRelative: number | null;
};

export type Nhm2PrimaryRawGrConservationMetrics = {
  sampleCount: number;
  maxAbsRecomputedDivergence: number | null;
  divergenceRelative: number | null;
  divergenceComparisonMaxAbs: number | null;
  divergenceComparisonRelative: number | null;
  boundaryFluxComparisonMaxAbs: number | null;
  boundaryFluxComparisonRelative: number | null;
  maxAbsFourComponentTransitionResidual: number | null;
  fourComponentTransitionResidualRelative: number | null;
  cycleAlgebraComparisonMaxAbs: number | null;
  cycleAlgebraComparisonRelative: number | null;
};

export type Nhm2PrimaryRawGrObserverMetrics = {
  spatialSampleCount: number;
  optimizerBindingCount: number;
  conditionOptimumCount: number;
  directionCount: number;
  directionsPerSample: number;
  maxTimelikeNormalizationError: number | null;
  maxNullNormalizationError: number | null;
  minimumWec: number | null;
  minimumNec: number | null;
  minimumDecMargin: number | null;
  minimumSec: number | null;
  optimizerTraceRowCount: number;
  adversarialStartCount: number;
  distinctAdversarialStartCount: number;
  globalityLevelCount: number;
  optimumObjectiveComparisonMaxAbs: number | null;
  optimumObjectiveComparisonRelative: number | null;
  adversarialObjectiveComparisonMaxAbs: number | null;
  adversarialObjectiveComparisonRelative: number | null;
  contractionComparisonMaxAbs: number | null;
  contractionComparisonRelative: number | null;
  extremaComparisonMaxAbs: number | null;
  extremaComparisonRelative: number | null;
};

export type Nhm2PrimaryRawGrQeiMetrics = {
  worldlineCount: number;
  coveredSampleCount: number;
  interpolationEntryCount: number;
  minimumSamplesPerWorldline: number | null;
  maximumInterpolationWeightNormalizationError: number | null;
  maximumFourVelocityNormalizationError: number | null;
  maximumSamplingNormalizationError: number | null;
  minimumMargin: number | null;
  pullbackComparisonMaxAbs: number | null;
  pullbackComparisonRelative: number | null;
  metricPullbackComparisonMaxAbs: number | null;
  metricPullbackComparisonRelative: number | null;
  contractionComparisonMaxAbs: number | null;
  contractionComparisonRelative: number | null;
  integrandComparisonMaxAbs: number | null;
  integrandComparisonRelative: number | null;
  theoremInputComparisonMaxAbs: number | null;
  theoremInputComparisonRelative: number | null;
};

export type Nhm2PrimaryRawGrHashClosure = {
  algorithm: "sha256";
  domain: "nhm2-primary-raw-gr-content-input-closure/v1";
  entryCount: number;
  sha256: string;
  entries: Array<{
    fileId: string;
    familyId: Nhm2PrimaryRawOutputFamilyId;
    semanticRole: string;
    path: string;
    sha256: string;
    sizeBytes: number;
  }>;
};

export type Nhm2PrimaryRawGrContentReplay = {
  artifactId: typeof NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_ARTIFACT_ID;
  contractVersion: typeof NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_CONTRACT_VERSION;
  source: {
    candidateId: string | null;
    runId: string | null;
    manifestSha256: string | null;
    contentPolicySha256: string | null;
  };
  inputVerificationAccepted: boolean;
  assumptions: {
    spacetimeDimension: 4;
    metricSignature: "-+++";
    tensorVariance: "covariant";
    tensorComponentOrder: readonly string[];
    spacetimeVectorVariance: "contravariant";
    connectionCoefficientIndex: string;
    tensorDerivativeIndex: string;
    apparatusTermLayout: string;
    apparatusRequiredTerms: readonly string[];
    apparatusSourceBinding: string;
    observerObjectiveLayout: string;
    observerEnergyConditionOrder: readonly string[];
    observerObjectiveFormulaIds: Readonly<Record<string, string>>;
    worldlineLayout: string;
    worldlineInterpolationLayout: string;
    worldlineInterpolationWeightNormalization: string;
    divergenceFormula: string;
    boundaryFluxFormula: string;
    cycleResidualFormula: string;
    observerEnergyFormula: string;
    decCurrentFormula: string;
    decFutureOrientationFormula: string;
    secSelectedObserverFormula: string;
    optimizerEvidenceBinding: string;
    qeiIntegralFormula: string;
    qeiMarginFormula: string;
    worldlineMetricPullbackMapping: string;
  };
  thresholds: typeof NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS;
  rawFileHashClosure: Nhm2PrimaryRawGrHashClosure | null;
  families: {
    full_apparatus_source_tensor: Nhm2PrimaryRawGrFamilyDiagnostic<Nhm2PrimaryRawGrApparatusMetrics>;
    covariant_conservation: Nhm2PrimaryRawGrFamilyDiagnostic<Nhm2PrimaryRawGrConservationMetrics>;
    continuous_observer_optimizer: Nhm2PrimaryRawGrFamilyDiagnostic<Nhm2PrimaryRawGrObserverMetrics>;
    worldline_qei: Nhm2PrimaryRawGrFamilyDiagnostic<Nhm2PrimaryRawGrQeiMetrics>;
  };
  claimBoundary: {
    diagnosticOnly: true;
    theoryClosureClaimAllowed: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedClaimAllowed: false;
    empiricalReceiptsRequired: true;
  };
};

type FamilyAccumulator = {
  blockers: string[];
  failures: string[];
};

type Matrix = {
  rows: number;
  columns: number;
  values: Float64Array;
};

type Difference = {
  maxAbs: number;
  relative: number;
  scale: number;
};

type FileIndex = Map<string, Nhm2PrimaryRawOutputVerifiedFile>;

type ApparatusState = {
  sampleCount: number;
  total: Matrix;
  required: Matrix;
  residual: Matrix;
  metric: Matrix;
  coordinates: Matrix;
  activeSamples: boolean[];
};

const TENSOR_PAIRS = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 2],
  [2, 3],
  [3, 3],
] as const;

const APPARATUS_SOURCE_FAMILY_POLICY: Record<
  Nhm2PrimaryRawRequiredApparatusTerm,
  readonly Nhm2PrimaryRawOutputFamilyId[]
> = {
  casimir_material_field: [
    "semiclassical_state",
    "finite_temperature_finite_geometry_maxwell_stress",
  ],
  supports: ["mechanical_support_control_margin"],
  anchors: ["mechanical_support_control_margin"],
  housing: ["mechanical_support_control_margin"],
  controls: [
    "mechanical_support_control_margin",
    "covariant_conservation",
    "dynamic_backreaction_stability_causality",
  ],
  switching_return: [
    "covariant_conservation",
    "dynamic_backreaction_stability_causality",
  ],
  thermal_return: [
    "mechanical_support_control_margin",
    "finite_temperature_finite_geometry_maxwell_stress",
  ],
  electromagnetic_return: ["finite_temperature_finite_geometry_maxwell_stress"],
  mechanical_return: ["mechanical_support_control_margin"],
};

const isRequiredApparatusTerm = (
  value: unknown,
): value is Nhm2PrimaryRawRequiredApparatusTerm =>
  typeof value === "string" &&
  NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS.some((term) => term === value);

const assumptions: Nhm2PrimaryRawGrContentReplay["assumptions"] = {
  spacetimeDimension: 4,
  metricSignature: "-+++",
  tensorVariance: "covariant",
  tensorComponentOrder:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.tensor10ComponentOrder,
  spacetimeVectorVariance: "contravariant",
  connectionCoefficientIndex:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.connectionCoefficientIndex,
  tensorDerivativeIndex:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.tensorDerivativeIndex,
  apparatusTermLayout:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.apparatusTermLayout,
  apparatusRequiredTerms:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.apparatusRequiredTerms,
  apparatusSourceBinding:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.apparatusSourceBinding,
  observerObjectiveLayout:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.observerObjectiveLayout,
  observerEnergyConditionOrder:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.observerEnergyConditionOrder,
  observerObjectiveFormulaIds:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.observerObjectiveFormulaIds,
  worldlineLayout: NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.worldlineLayout,
  worldlineInterpolationLayout:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.worldlineInterpolationLayout,
  worldlineInterpolationWeightNormalization:
    NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions
      .worldlineInterpolationWeightNormalization,
  divergenceFormula:
    "D_nu=g^{mu alpha}(partial_alpha T_{mu nu}-Gamma^lambda_{alpha mu}T_{lambda nu}-Gamma^lambda_{alpha nu}T_{mu lambda})",
  boundaryFluxFormula: "F_nu=w n^mu T_{mu nu}",
  cycleResidualFormula:
    "R_nu=w n^mu S_{mu nu}+w n^mu C_{mu nu}-w n^mu T_{mu nu}; producer cycle columns compare the nu=0 projection only",
  observerEnergyFormula: "rho(u)=T_{mu nu}u^mu u^nu",
  decCurrentFormula: "J^mu=-g^{mu alpha}T_{alpha nu}u^nu",
  decFutureOrientationFormula: "future(J;u)=-g_{mu nu}u^mu J^nu",
  secSelectedObserverFormula:
    "SEC(u)=(T_{mu nu}-(1/2)(g^{alpha beta}T_{alpha beta})g_{mu nu})u^mu u^nu",
  optimizerEvidenceBinding:
    "each binding joins one sample and one of WEC/SEC/DEC to a unique optimum row and exact trace/start/globality slices; producer objectives remain comparison-only and finite sampled searches do not prove continuous globality",
  qeiIntegralFormula: "I=sum_i w_i g(tau_i)^2 T_{mu nu}u^mu u^nu",
  qeiMarginFormula: "M=I+bound_density",
  worldlineMetricPullbackMapping:
    "each worldline sample declares a sparse apparatus row/weight slice normalized to sum one; outer replay forms both T_{mu nu} and g_{mu nu}, while producer pullbacks remain comparison-only",
};

const emptyApparatusMetrics = (): Nhm2PrimaryRawGrApparatusMetrics => ({
  sampleCount: 0,
  tensorComponentCount: 10,
  requiredTermCount: NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS.length,
  ledgerTermCount: 0,
  coveredRequiredTermCount: 0,
  sourceBindingCount: 0,
  ledgerCoveredTermRows: 0,
  metricTargetDependencyCount: 0,
  forbiddenTargetEchoCount: 0,
  activeTensorValueCount: 0,
  maxAbsRequired: null,
  maxAbsRecomputedTotal: null,
  maxAbsResidual: null,
  relativeResidual: null,
  totalComparisonMaxAbs: null,
  totalComparisonRelative: null,
  residualComparisonMaxAbs: null,
  residualComparisonRelative: null,
});

const emptyConservationMetrics = (): Nhm2PrimaryRawGrConservationMetrics => ({
  sampleCount: 0,
  maxAbsRecomputedDivergence: null,
  divergenceRelative: null,
  divergenceComparisonMaxAbs: null,
  divergenceComparisonRelative: null,
  boundaryFluxComparisonMaxAbs: null,
  boundaryFluxComparisonRelative: null,
  maxAbsFourComponentTransitionResidual: null,
  fourComponentTransitionResidualRelative: null,
  cycleAlgebraComparisonMaxAbs: null,
  cycleAlgebraComparisonRelative: null,
});

const emptyObserverMetrics = (): Nhm2PrimaryRawGrObserverMetrics => ({
  spatialSampleCount: 0,
  optimizerBindingCount: 0,
  conditionOptimumCount: 0,
  directionCount: 0,
  directionsPerSample: 0,
  maxTimelikeNormalizationError: null,
  maxNullNormalizationError: null,
  minimumWec: null,
  minimumNec: null,
  minimumDecMargin: null,
  minimumSec: null,
  optimizerTraceRowCount: 0,
  adversarialStartCount: 0,
  distinctAdversarialStartCount: 0,
  globalityLevelCount: 0,
  optimumObjectiveComparisonMaxAbs: null,
  optimumObjectiveComparisonRelative: null,
  adversarialObjectiveComparisonMaxAbs: null,
  adversarialObjectiveComparisonRelative: null,
  contractionComparisonMaxAbs: null,
  contractionComparisonRelative: null,
  extremaComparisonMaxAbs: null,
  extremaComparisonRelative: null,
});

const emptyQeiMetrics = (): Nhm2PrimaryRawGrQeiMetrics => ({
  worldlineCount: 0,
  coveredSampleCount: 0,
  interpolationEntryCount: 0,
  minimumSamplesPerWorldline: null,
  maximumInterpolationWeightNormalizationError: null,
  maximumFourVelocityNormalizationError: null,
  maximumSamplingNormalizationError: null,
  minimumMargin: null,
  pullbackComparisonMaxAbs: null,
  pullbackComparisonRelative: null,
  metricPullbackComparisonMaxAbs: null,
  metricPullbackComparisonRelative: null,
  contractionComparisonMaxAbs: null,
  contractionComparisonRelative: null,
  integrandComparisonMaxAbs: null,
  integrandComparisonRelative: null,
  theoremInputComparisonMaxAbs: null,
  theoremInputComparisonRelative: null,
});

const addUnique = (target: string[], value: string): void => {
  if (!target.includes(value)) target.push(value);
};

const blocked = (accumulator: FamilyAccumulator, reason: string): void =>
  addUnique(accumulator.blockers, reason);

const failed = (accumulator: FamilyAccumulator, reason: string): void =>
  addUnique(accumulator.failures, reason);

const finalize = <Metrics>(
  accumulator: FamilyAccumulator,
  metrics: Metrics,
): Nhm2PrimaryRawGrFamilyDiagnostic<Metrics> => ({
  disposition:
    accumulator.blockers.length > 0
      ? "blocked"
      : accumulator.failures.length > 0
        ? "fail"
        : "pass",
  blockers: accumulator.blockers,
  failures: accumulator.failures,
  metrics,
});

const roleKey = (familyId: string, semanticRole: string): string =>
  `${familyId}:${semanticRole}`;

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

const numericalBytes = (values: Float64Array): Buffer => {
  const bytes = Buffer.alloc(values.length * Float64Array.BYTES_PER_ELEMENT);
  for (let index = 0; index < values.length; index += 1) {
    bytes.writeDoubleLE(values[index], index * Float64Array.BYTES_PER_ELEMENT);
  }
  return bytes;
};

const recordsBytes = (file: Nhm2PrimaryRawOutputVerifiedRecordFile): Buffer => {
  const serialized = file.records.map((record) => JSON.stringify(record));
  return Buffer.from(`${serialized.join("\n")}\n`, "utf8");
};

const typedFileBytes = (file: Nhm2PrimaryRawOutputVerifiedFile): Buffer =>
  file.kind === "numerical_array"
    ? numericalBytes(file.values)
    : recordsBytes(file);

const buildHashClosure = (
  files: readonly Nhm2PrimaryRawOutputVerifiedFile[],
): Nhm2PrimaryRawGrHashClosure => {
  const entries = files
    .map((file) => ({
      fileId: file.descriptor.fileId,
      familyId: file.descriptor.familyId,
      semanticRole: file.descriptor.semanticRole,
      path: file.descriptor.path,
      sha256: file.observedSha256,
      sizeBytes: file.observedSizeBytes,
    }))
    .sort((left, right) =>
      Buffer.compare(
        Buffer.from(left.path, "utf8"),
        Buffer.from(right.path, "utf8"),
      ),
    );
  const domain = "nhm2-primary-raw-gr-content-input-closure/v1" as const;
  return {
    algorithm: "sha256",
    domain,
    entryCount: entries.length,
    sha256: sha256(`${domain}\n${JSON.stringify(entries)}`),
    entries,
  };
};

const validateTypedFileClosure = (
  files: readonly Nhm2PrimaryRawOutputVerifiedFile[],
): string[] => {
  const violations: string[] = [];
  for (const file of files) {
    if (file.kind === "numerical_array") {
      for (const value of file.values) {
        if (!Number.isFinite(value)) {
          violations.push(
            `verified_typed_data_nonfinite:${file.descriptor.path}`,
          );
          break;
        }
      }
    }
    const bytes = typedFileBytes(file);
    const observedHash = sha256(bytes);
    if (
      observedHash !== file.observedSha256 ||
      observedHash !== file.descriptor.sha256 ||
      bytes.byteLength !== file.observedSizeBytes ||
      bytes.byteLength !== file.descriptor.sizeBytes
    ) {
      violations.push(
        `verified_typed_data_hash_mismatch:${file.descriptor.path}`,
      );
    }
  }
  return violations;
};

const indexFiles = (
  files: readonly Nhm2PrimaryRawOutputVerifiedFile[],
): FileIndex =>
  new Map(
    files.map((file) => [
      roleKey(file.descriptor.familyId, file.descriptor.semanticRole),
      file,
    ]),
  );

const numericalFile = (
  index: FileIndex,
  family: Nhm2PrimaryRawOutputFamilyId,
  role: string,
  accumulator: FamilyAccumulator,
): Nhm2PrimaryRawOutputVerifiedNumericalFile | null => {
  const file = index.get(roleKey(family, role));
  if (file == null) {
    blocked(accumulator, `primitive_missing:${family}:${role}`);
    return null;
  }
  if (file.kind !== "numerical_array") {
    blocked(accumulator, `primitive_kind_invalid:${family}:${role}`);
    return null;
  }
  return file;
};

const recordFile = (
  index: FileIndex,
  family: Nhm2PrimaryRawOutputFamilyId,
  role: string,
  accumulator: FamilyAccumulator,
): Nhm2PrimaryRawOutputVerifiedRecordFile | null => {
  const file = index.get(roleKey(family, role));
  if (file == null) {
    blocked(accumulator, `primitive_missing:${family}:${role}`);
    return null;
  }
  if (file.kind !== "records") {
    blocked(accumulator, `primitive_kind_invalid:${family}:${role}`);
    return null;
  }
  return file;
};

const asMatrix = (
  file: Nhm2PrimaryRawOutputVerifiedNumericalFile | null,
  expectedColumns: number,
  accumulator: FamilyAccumulator,
): Matrix | null => {
  if (file == null) return null;
  const representation = file.descriptor.representation;
  if (
    representation.kind !== "numerical_array" ||
    representation.shape.length !== 2 ||
    representation.shape[1] !== expectedColumns ||
    representation.shape[0] * representation.shape[1] !== file.values.length
  ) {
    blocked(
      accumulator,
      `primitive_shape_inconsistent:${file.descriptor.familyId}:${file.descriptor.semanticRole}`,
    );
    return null;
  }
  return {
    rows: representation.shape[0],
    columns: representation.shape[1],
    values: new Float64Array(file.values),
  };
};

const rowValue = (matrix: Matrix, row: number, column: number): number =>
  matrix.values[row * matrix.columns + column];

const setRowValue = (
  matrix: Matrix,
  row: number,
  column: number,
  value: number,
): void => {
  matrix.values[row * matrix.columns + column] = value;
};

const matrixRowsEqual = (
  accumulator: FamilyAccumulator,
  expected: number,
  named: ReadonlyArray<[string, Matrix | null]>,
): boolean => {
  let consistent = true;
  for (const [name, matrix] of named) {
    if (matrix != null && matrix.rows !== expected) {
      blocked(accumulator, `primitive_row_count_inconsistent:${name}`);
      consistent = false;
    }
  }
  return consistent;
};

const maxAbs = (values: Iterable<number>): number => {
  let maximum = 0;
  for (const value of values) maximum = Math.max(maximum, Math.abs(value));
  return maximum;
};

const difference = (
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): Difference => {
  let maximum = 0;
  let scale: number = NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor;
  const count = Math.min(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    maximum = Math.max(maximum, Math.abs(left[index] - right[index]));
    scale = Math.max(scale, Math.abs(left[index]), Math.abs(right[index]));
  }
  return { maxAbs: maximum, relative: maximum / scale, scale };
};

const comparisonBreached = (value: Difference): boolean =>
  value.maxAbs >
  NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.comparisonAbsolute +
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.comparisonRelative * value.scale;

const tensor10ToFull = (matrix: Matrix, row: number): number[][] => {
  const full = Array.from({ length: 4 }, () => Array(4).fill(0) as number[]);
  TENSOR_PAIRS.forEach(([mu, nu], index) => {
    const value = rowValue(matrix, row, index);
    full[mu][nu] = value;
    full[nu][mu] = value;
  });
  return full;
};

const invert4 = (matrix: number[][]): number[][] | null => {
  const augmented = matrix.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: 4 }, (_, column) => (rowIndex === column ? 1 : 0)),
  ]);
  for (let column = 0; column < 4; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 4; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column]))
        pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) <= 1e-18) return null;
    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];
    const divisor = augmented[column][column];
    for (let entry = 0; entry < 8; entry += 1)
      augmented[column][entry] /= divisor;
    for (let row = 0; row < 4; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let entry = 0; entry < 8; entry += 1)
        augmented[row][entry] -= factor * augmented[column][entry];
    }
  }
  return augmented.map((row) => row.slice(4));
};

const bilinear = (
  metric: number[][],
  left: number[],
  right: number[],
): number => {
  let value = 0;
  for (let mu = 0; mu < 4; mu += 1)
    for (let nu = 0; nu < 4; nu += 1)
      value += metric[mu][nu] * left[mu] * right[nu];
  return value;
};

const tensorContraction = (
  tensor: number[][],
  left: number[],
  right: number[],
): number => {
  let value = 0;
  for (let mu = 0; mu < 4; mu += 1)
    for (let nu = 0; nu < 4; nu += 1)
      value += tensor[mu][nu] * left[mu] * right[nu];
  return value;
};

const parseNonnegativeInt64 = (value: unknown): number | null => {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(value))
    return null;
  try {
    const parsed = BigInt(value);
    return parsed <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(parsed) : null;
  } catch {
    return null;
  }
};

const roleMinimumFirstAxis = (
  family: keyof typeof NHM2_PRIMARY_RAW_CONTENT_POLICY.rolePolicies,
  role: string,
): number => {
  const policy = (
    NHM2_PRIMARY_RAW_CONTENT_POLICY.rolePolicies[family] as Record<
      string,
      { kind: string; minimumFirstAxis?: number; minimumRecordCount?: number }
    >
  )[role];
  return policy?.kind === "numerical_array"
    ? (policy.minimumFirstAxis ?? 1)
    : (policy?.minimumRecordCount ?? 1);
};

const computeApparatus = (
  index: FileIndex,
  accumulator: FamilyAccumulator,
): {
  metrics: Nhm2PrimaryRawGrApparatusMetrics;
  state: ApparatusState | null;
} => {
  const metrics = emptyApparatusMetrics();
  const family = "full_apparatus_source_tensor" as const;
  const ledger = recordFile(
    index,
    family,
    "apparatus_term_ledger",
    accumulator,
  );
  const grid = recordFile(index, family, "grid_topology_records", accumulator);
  const termFile = numericalFile(
    index,
    family,
    "term_tensor_components",
    accumulator,
  );
  const term = asMatrix(termFile, 10, accumulator);
  const producerTotal = asMatrix(
    numericalFile(index, family, "total_tensor_components", accumulator),
    10,
    accumulator,
  );
  const metric = asMatrix(
    numericalFile(index, family, "metric_tensor_components", accumulator),
    10,
    accumulator,
  );
  const required = asMatrix(
    numericalFile(
      index,
      family,
      "metric_required_tensor_components",
      accumulator,
    ),
    10,
    accumulator,
  );
  const producerResidual = asMatrix(
    numericalFile(index, family, "residual_components", accumulator),
    10,
    accumulator,
  );
  const coordinates = asMatrix(
    numericalFile(index, family, "coordinate_samples", accumulator),
    4,
    accumulator,
  );
  const weights = asMatrix(
    numericalFile(
      index,
      family,
      "integration_weight_mask_samples",
      accumulator,
    ),
    2,
    accumulator,
  );
  if (
    ledger == null ||
    grid == null ||
    termFile == null ||
    term == null ||
    producerTotal == null ||
    metric == null ||
    required == null ||
    producerResidual == null ||
    coordinates == null ||
    weights == null
  ) {
    return { metrics, state: null };
  }

  const sampleCount = required.rows;
  metrics.sampleCount = sampleCount;
  metrics.ledgerTermCount = ledger.records.length;
  if (
    sampleCount === 0 ||
    ledger.records.length === 0 ||
    !matrixRowsEqual(accumulator, sampleCount, [
      ["producer_total", producerTotal],
      ["metric", metric],
      ["producer_residual", producerResidual],
      ["coordinates", coordinates],
      ["weights", weights],
    ]) ||
    grid.records.length !== sampleCount
  ) {
    if (grid.records.length !== sampleCount)
      blocked(
        accumulator,
        "primitive_row_count_inconsistent:grid_topology_records",
      );
    return { metrics, state: null };
  }

  const recomputedTotal: Matrix = {
    rows: sampleCount,
    columns: 10,
    values: new Float64Array(sampleCount * 10),
  };
  const coveredRows = new Set<number>();
  const filesById = new Map(
    [...index.values()].map((file) => [file.descriptor.fileId, file]),
  );
  const requiredTermCounts = new Map<
    Nhm2PrimaryRawRequiredApparatusTerm,
    number
  >();
  for (const [ledgerIndex, record] of ledger.records.entries()) {
    const offset = parseNonnegativeInt64(record.sample_offset);
    const count = parseNonnegativeInt64(record.sample_count);
    const metricTargetDependencyCount = parseNonnegativeInt64(
      record.metric_target_dependency_count,
    );
    const forbiddenTargetEchoCount = parseNonnegativeInt64(
      record.forbidden_target_echo_count,
    );
    const coefficient = record.coefficient;
    const termCategory = record.term_category;
    if (!isRequiredApparatusTerm(termCategory)) {
      blocked(accumulator, `apparatus_term_category_invalid:${ledgerIndex}`);
      continue;
    }
    requiredTermCounts.set(
      termCategory,
      (requiredTermCounts.get(termCategory) ?? 0) + 1,
    );
    const sourceFile =
      typeof record.source_file_id === "string"
        ? filesById.get(record.source_file_id)
        : undefined;
    const constitutiveFile =
      typeof record.constitutive_file_id === "string"
        ? filesById.get(record.constitutive_file_id)
        : undefined;
    const sourceFieldRef =
      typeof record.source_field_ref === "string"
        ? record.source_field_ref.trim()
        : "";
    const sourceBindingValid =
      sourceFieldRef.length > 0 &&
      !sourceFieldRef.toLowerCase().includes("metric_required") &&
      sourceFile != null &&
      constitutiveFile != null &&
      sourceFile.descriptor.fileId !== constitutiveFile.descriptor.fileId &&
      record.source_sha256 === sourceFile.observedSha256 &&
      record.constitutive_sha256 === constitutiveFile.observedSha256 &&
      (
        NHM2_PRIMARY_RAW_CONTENT_POLICY.rolePolicies[
          sourceFile.descriptor.familyId
        ] as Record<string, { producerValueIsComparisonOnly: boolean }>
      )[sourceFile.descriptor.semanticRole]?.producerValueIsComparisonOnly ===
        false &&
      (
        NHM2_PRIMARY_RAW_CONTENT_POLICY.rolePolicies[
          constitutiveFile.descriptor.familyId
        ] as Record<string, { producerValueIsComparisonOnly: boolean }>
      )[constitutiveFile.descriptor.semanticRole]
        ?.producerValueIsComparisonOnly === false &&
      APPARATUS_SOURCE_FAMILY_POLICY[termCategory].includes(
        sourceFile.descriptor.familyId,
      ) &&
      APPARATUS_SOURCE_FAMILY_POLICY[termCategory].includes(
        constitutiveFile.descriptor.familyId,
      );
    if (!sourceBindingValid) {
      blocked(accumulator, `apparatus_source_binding_invalid:${termCategory}`);
    } else {
      metrics.sourceBindingCount += 1;
    }
    if (
      metricTargetDependencyCount == null ||
      forbiddenTargetEchoCount == null
    ) {
      blocked(
        accumulator,
        `apparatus_echo_declaration_invalid:${termCategory}`,
      );
    } else {
      metrics.metricTargetDependencyCount += metricTargetDependencyCount;
      metrics.forbiddenTargetEchoCount += forbiddenTargetEchoCount;
      if (metricTargetDependencyCount > 0)
        failed(
          accumulator,
          `apparatus_metric_target_dependency:${termCategory}`,
        );
      if (forbiddenTargetEchoCount > 0)
        failed(accumulator, `apparatus_forbidden_target_echo:${termCategory}`);
    }
    if (record.returned_to_source_tensor !== true)
      failed(accumulator, `apparatus_term_not_returned:${termCategory}`);
    if (
      offset == null ||
      count == null ||
      count !== sampleCount ||
      typeof coefficient !== "number" ||
      !Number.isFinite(coefficient) ||
      record.tensor_file_id !== termFile.descriptor.fileId ||
      record.tensor_sha256 !== termFile.observedSha256 ||
      offset + count > term.rows
    ) {
      blocked(
        accumulator,
        `apparatus_ledger_entry_inconsistent:${ledgerIndex}`,
      );
      continue;
    }
    for (let localRow = 0; localRow < count; localRow += 1) {
      const termRow = offset + localRow;
      if (coveredRows.has(termRow)) {
        blocked(accumulator, `apparatus_ledger_row_overlap:${termRow}`);
        continue;
      }
      coveredRows.add(termRow);
      for (let component = 0; component < 10; component += 1) {
        setRowValue(
          recomputedTotal,
          localRow,
          component,
          rowValue(recomputedTotal, localRow, component) +
            coefficient * rowValue(term, termRow, component),
        );
      }
    }
  }
  for (const requiredTerm of NHM2_PRIMARY_RAW_REQUIRED_APPARATUS_TERMS) {
    const count = requiredTermCounts.get(requiredTerm) ?? 0;
    if (count === 0)
      blocked(accumulator, `apparatus_required_term_missing:${requiredTerm}`);
    else if (count > 1)
      blocked(accumulator, `apparatus_required_term_duplicate:${requiredTerm}`);
  }
  metrics.coveredRequiredTermCount = [...requiredTermCounts.values()].filter(
    (count) => count === 1,
  ).length;
  metrics.ledgerCoveredTermRows = coveredRows.size;
  if (coveredRows.size !== term.rows)
    blocked(accumulator, "apparatus_ledger_term_rows_not_exactly_covered");

  const residual: Matrix = {
    rows: sampleCount,
    columns: 10,
    values: new Float64Array(sampleCount * 10),
  };
  for (let indexValue = 0; indexValue < residual.values.length; indexValue += 1)
    residual.values[indexValue] =
      required.values[indexValue] - recomputedTotal.values[indexValue];

  const activeSamples = Array.from({ length: sampleCount }, (_, row) => {
    const quadrature = rowValue(weights, row, 0);
    const mask = rowValue(weights, row, 1);
    return quadrature > 0 && mask > 0;
  });
  const activeValues: number[] = [];
  const activeRequired: number[] = [];
  const activeTotal: number[] = [];
  for (let row = 0; row < sampleCount; row += 1) {
    if (!activeSamples[row]) continue;
    for (let component = 0; component < 10; component += 1) {
      activeValues.push(rowValue(residual, row, component));
      activeRequired.push(rowValue(required, row, component));
      activeTotal.push(rowValue(recomputedTotal, row, component));
    }
  }
  metrics.activeTensorValueCount = activeValues.length;
  if (activeValues.length === 0) {
    blocked(accumulator, "apparatus_active_mask_coverage_vacuous");
    return { metrics, state: null };
  }
  metrics.maxAbsRequired = maxAbs(activeRequired);
  metrics.maxAbsRecomputedTotal = maxAbs(activeTotal);
  metrics.maxAbsResidual = maxAbs(activeValues);
  const residualScale = Math.max(
    metrics.maxAbsRequired,
    metrics.maxAbsRecomputedTotal,
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor,
  );
  metrics.relativeResidual = metrics.maxAbsResidual / residualScale;
  if (
    metrics.relativeResidual >
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.sourceResidualRelativeMax
  ) {
    failed(accumulator, "recomputed_source_residual_threshold_breach");
  }

  const totalComparison = difference(
    recomputedTotal.values,
    producerTotal.values,
  );
  metrics.totalComparisonMaxAbs = totalComparison.maxAbs;
  metrics.totalComparisonRelative = totalComparison.relative;
  if (comparisonBreached(totalComparison))
    failed(accumulator, "producer_total_tensor_comparison_mismatch");
  const residualComparison = difference(
    residual.values,
    producerResidual.values,
  );
  metrics.residualComparisonMaxAbs = residualComparison.maxAbs;
  metrics.residualComparisonRelative = residualComparison.relative;
  if (comparisonBreached(residualComparison))
    failed(accumulator, "producer_residual_tensor_comparison_mismatch");

  return {
    metrics,
    state: {
      sampleCount,
      total: recomputedTotal,
      required,
      residual,
      metric,
      coordinates,
      activeSamples,
    },
  };
};

const computeConservation = (
  index: FileIndex,
  apparatus: ApparatusState | null,
  accumulator: FamilyAccumulator,
): Nhm2PrimaryRawGrConservationMetrics => {
  const metrics = emptyConservationMetrics();
  if (apparatus == null) {
    blocked(accumulator, "apparatus_recomputation_unavailable");
    return metrics;
  }
  const family = "covariant_conservation" as const;
  const gamma = asMatrix(
    numericalFile(
      index,
      family,
      "connection_coefficient_components",
      accumulator,
    ),
    64,
    accumulator,
  );
  const derivatives = asMatrix(
    numericalFile(index, family, "tensor_derivative_components", accumulator),
    40,
    accumulator,
  );
  const producerDivergence = asMatrix(
    numericalFile(index, family, "divergence_components", accumulator),
    4,
    accumulator,
  );
  const switching = asMatrix(
    numericalFile(
      index,
      family,
      "switching_transition_components",
      accumulator,
    ),
    10,
    accumulator,
  );
  const support = asMatrix(
    numericalFile(
      index,
      family,
      "support_control_source_components",
      accumulator,
    ),
    10,
    accumulator,
  );
  const normals = asMatrix(
    numericalFile(index, family, "boundary_normal_weight_samples", accumulator),
    5,
    accumulator,
  );
  const producerBoundary = asMatrix(
    numericalFile(index, family, "boundary_flux_components", accumulator),
    4,
    accumulator,
  );
  const cycle = asMatrix(
    numericalFile(index, family, "cycle_energy_samples", accumulator),
    5,
    accumulator,
  );
  if (
    gamma == null ||
    derivatives == null ||
    producerDivergence == null ||
    switching == null ||
    support == null ||
    normals == null ||
    producerBoundary == null ||
    cycle == null
  ) {
    return metrics;
  }
  const sampleCount = apparatus.sampleCount;
  metrics.sampleCount = sampleCount;
  if (
    !matrixRowsEqual(accumulator, sampleCount, [
      ["connection", gamma],
      ["tensor_derivative", derivatives],
      ["producer_divergence", producerDivergence],
      ["switching", switching],
      ["support_control", support],
      ["boundary_normal", normals],
      ["producer_boundary_flux", producerBoundary],
      ["cycle_energy", cycle],
    ])
  ) {
    return metrics;
  }

  const recomputedDivergence = new Float64Array(sampleCount * 4);
  let divergenceScale: number =
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor;
  const recomputedBoundary = new Float64Array(sampleCount * 4);
  const recomputedTransitionResidual = new Float64Array(sampleCount * 4);
  const recomputedCycle = new Float64Array(sampleCount * 4);
  let transitionScale: number =
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor;
  for (let row = 0; row < sampleCount; row += 1) {
    const metric = tensor10ToFull(apparatus.metric, row);
    const inverse = invert4(metric);
    if (inverse == null) {
      blocked(accumulator, `metric_not_invertible:${row}`);
      continue;
    }
    const tensor = tensor10ToFull(apparatus.total, row);
    for (let nu = 0; nu < 4; nu += 1) {
      let divergence = 0;
      for (let mu = 0; mu < 4; mu += 1) {
        for (let alpha = 0; alpha < 4; alpha += 1) {
          const pairIndex = TENSOR_PAIRS.findIndex(
            ([left, right]) =>
              (left === mu && right === nu) || (left === nu && right === mu),
          );
          const derivative = rowValue(derivatives, row, alpha * 10 + pairIndex);
          let connectionFirst = 0;
          let connectionSecond = 0;
          for (let lambda = 0; lambda < 4; lambda += 1) {
            const gammaFirst = rowValue(
              gamma,
              row,
              lambda * 16 + alpha * 4 + mu,
            );
            const gammaSecond = rowValue(
              gamma,
              row,
              lambda * 16 + alpha * 4 + nu,
            );
            connectionFirst += gammaFirst * tensor[lambda][nu];
            connectionSecond += gammaSecond * tensor[mu][lambda];
          }
          const covariantDerivative =
            derivative - connectionFirst - connectionSecond;
          divergence += inverse[mu][alpha] * covariantDerivative;
          divergenceScale = Math.max(
            divergenceScale,
            Math.abs(inverse[mu][alpha] * derivative),
            Math.abs(inverse[mu][alpha] * connectionFirst),
            Math.abs(inverse[mu][alpha] * connectionSecond),
          );
        }
      }
      recomputedDivergence[row * 4 + nu] = divergence;
      let flux = 0;
      for (let mu = 0; mu < 4; mu += 1)
        flux += rowValue(normals, row, mu) * tensor[mu][nu];
      recomputedBoundary[row * 4 + nu] = flux * rowValue(normals, row, 4);
    }
    const switchingTensor = tensor10ToFull(switching, row);
    const supportTensor = tensor10ToFull(support, row);
    const weight = rowValue(normals, row, 4);
    for (let nu = 0; nu < 4; nu += 1) {
      let sourceComponent = 0;
      let controlComponent = 0;
      for (let mu = 0; mu < 4; mu += 1) {
        const weightedNormal = weight * rowValue(normals, row, mu);
        sourceComponent += weightedNormal * switchingTensor[mu][nu];
        controlComponent += weightedNormal * supportTensor[mu][nu];
      }
      const fluxComponent = recomputedBoundary[row * 4 + nu];
      recomputedTransitionResidual[row * 4 + nu] =
        sourceComponent + controlComponent - fluxComponent;
      transitionScale = Math.max(
        transitionScale,
        Math.abs(sourceComponent),
        Math.abs(controlComponent),
        Math.abs(fluxComponent),
      );
      if (nu === 0) {
        recomputedCycle[row * 4] = sourceComponent;
        recomputedCycle[row * 4 + 1] = fluxComponent;
        recomputedCycle[row * 4 + 2] = controlComponent;
        recomputedCycle[row * 4 + 3] = recomputedTransitionResidual[row * 4];
      }
    }
  }
  metrics.maxAbsRecomputedDivergence = maxAbs(recomputedDivergence);
  metrics.divergenceRelative =
    metrics.maxAbsRecomputedDivergence / divergenceScale;
  if (
    metrics.divergenceRelative >
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.conservationRelativeMax
  ) {
    failed(accumulator, "recomputed_covariant_divergence_threshold_breach");
  }
  const divergenceComparison = difference(
    recomputedDivergence,
    producerDivergence.values,
  );
  metrics.divergenceComparisonMaxAbs = divergenceComparison.maxAbs;
  metrics.divergenceComparisonRelative = divergenceComparison.relative;
  if (comparisonBreached(divergenceComparison))
    failed(accumulator, "producer_divergence_comparison_mismatch");
  const boundaryComparison = difference(
    recomputedBoundary,
    producerBoundary.values,
  );
  metrics.boundaryFluxComparisonMaxAbs = boundaryComparison.maxAbs;
  metrics.boundaryFluxComparisonRelative = boundaryComparison.relative;
  if (comparisonBreached(boundaryComparison))
    failed(accumulator, "producer_boundary_flux_comparison_mismatch");

  metrics.maxAbsFourComponentTransitionResidual = maxAbs(
    recomputedTransitionResidual,
  );
  metrics.fourComponentTransitionResidualRelative =
    metrics.maxAbsFourComponentTransitionResidual / transitionScale;
  if (
    metrics.fourComponentTransitionResidualRelative >
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.conservationRelativeMax
  ) {
    failed(accumulator, "four_component_transition_balance_threshold_breach");
  }

  const producerCycleComparable = new Float64Array(sampleCount * 4);
  for (let row = 0; row < sampleCount; row += 1) {
    producerCycleComparable[row * 4] = rowValue(cycle, row, 1);
    producerCycleComparable[row * 4 + 1] = rowValue(cycle, row, 2);
    producerCycleComparable[row * 4 + 2] = rowValue(cycle, row, 3);
    producerCycleComparable[row * 4 + 3] = rowValue(cycle, row, 4);
  }
  const cycleComparison = difference(recomputedCycle, producerCycleComparable);
  metrics.cycleAlgebraComparisonMaxAbs = cycleComparison.maxAbs;
  metrics.cycleAlgebraComparisonRelative = cycleComparison.relative;
  if (comparisonBreached(cycleComparison))
    failed(accumulator, "producer_cycle_algebra_comparison_mismatch");
  return metrics;
};

const OBSERVER_ENERGY_CONDITION_IDS =
  NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.observerEnergyConditionOrder;
type ObserverEnergyConditionId = (typeof OBSERVER_ENERGY_CONDITION_IDS)[number];

const OBSERVER_OBJECTIVE_FORMULA_IDS =
  NHM2_PRIMARY_RAW_CONTENT_POLICY.conventions.observerObjectiveFormulaIds;

type ObserverEvaluation = {
  wec: number;
  sec: number;
  decMargin: number;
  fluxNorm: number;
};

const observerEvaluation = (
  tensor: number[][],
  metric: number[][],
  inverse: number[][],
  u: number[],
): ObserverEvaluation => {
  const wec = tensorContraction(tensor, u, u);
  const loweredFlux = Array.from({ length: 4 }, (_, alpha) =>
    tensor[alpha].reduce((sum, value, nu) => sum + value * u[nu], 0),
  );
  const current = Array.from(
    { length: 4 },
    (_, mu) =>
      -inverse[mu].reduce(
        (sum, value, alpha) => sum + value * loweredFlux[alpha],
        0,
      ),
  );
  const currentNorm = bilinear(metric, current, current);
  const fluxNorm = Math.sqrt(Math.abs(currentNorm));
  const decScale = Math.max(
    Math.abs(wec),
    fluxNorm,
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor,
  );
  const futureProjection = -bilinear(metric, u, current);
  const decMargin = Math.min(futureProjection, -currentNorm / decScale);
  let tensorTrace = 0;
  for (let mu = 0; mu < 4; mu += 1)
    for (let nu = 0; nu < 4; nu += 1)
      tensorTrace += inverse[mu][nu] * tensor[mu][nu];
  return {
    wec,
    sec: wec + 0.5 * tensorTrace,
    decMargin,
    fluxNorm,
  };
};

const observerObjective = (
  condition: ObserverEnergyConditionId,
  evaluation: ObserverEvaluation,
): number =>
  condition === "wec"
    ? evaluation.wec
    : condition === "sec"
      ? evaluation.sec
      : evaluation.decMargin;

const computeObservers = (
  index: FileIndex,
  apparatus: ApparatusState | null,
  accumulator: FamilyAccumulator,
): Nhm2PrimaryRawGrObserverMetrics => {
  const metrics = emptyObserverMetrics();
  if (apparatus == null) {
    blocked(accumulator, "apparatus_recomputation_unavailable");
    return metrics;
  }
  const family = "continuous_observer_optimizer" as const;
  const spatial = recordFile(
    index,
    family,
    "spatial_sample_index",
    accumulator,
  );
  const bindingFile = recordFile(
    index,
    family,
    "energy_condition_optimizer_bindings",
    accumulator,
  );
  const timelike = asMatrix(
    numericalFile(index, family, "timelike_observer_vectors", accumulator),
    4,
    accumulator,
  );
  const optimumVectors = asMatrix(
    numericalFile(
      index,
      family,
      "condition_optimum_timelike_vectors",
      accumulator,
    ),
    4,
    accumulator,
  );
  const producerOptimumObjectives = asMatrix(
    numericalFile(
      index,
      family,
      "condition_optimum_objective_samples",
      accumulator,
    ),
    1,
    accumulator,
  );
  const nullDirections = asMatrix(
    numericalFile(index, family, "null_direction_vectors", accumulator),
    4,
    accumulator,
  );
  const producerContractions = asMatrix(
    numericalFile(index, family, "tensor_contraction_samples", accumulator),
    3,
    accumulator,
  );
  const producerExtrema = asMatrix(
    numericalFile(index, family, "energy_condition_extrema", accumulator),
    3,
    accumulator,
  );
  const optimizerTrace = asMatrix(
    numericalFile(index, family, "optimizer_trace_samples", accumulator),
    3,
    accumulator,
  );
  const producerTraceObjectives = asMatrix(
    numericalFile(
      index,
      family,
      "optimizer_trace_objective_samples",
      accumulator,
    ),
    1,
    accumulator,
  );
  const adversarialStarts = asMatrix(
    numericalFile(index, family, "adversarial_start_samples", accumulator),
    4,
    accumulator,
  );
  const producerAdversarialObjectives = asMatrix(
    numericalFile(
      index,
      family,
      "adversarial_start_objective_samples",
      accumulator,
    ),
    1,
    accumulator,
  );
  const globalitySearch = asMatrix(
    numericalFile(index, family, "globality_search_samples", accumulator),
    2,
    accumulator,
  );
  const producerGlobalityObjectives = asMatrix(
    numericalFile(index, family, "globality_objective_samples", accumulator),
    2,
    accumulator,
  );
  if (
    spatial == null ||
    bindingFile == null ||
    timelike == null ||
    optimumVectors == null ||
    producerOptimumObjectives == null ||
    nullDirections == null ||
    producerContractions == null ||
    producerExtrema == null ||
    optimizerTrace == null ||
    producerTraceObjectives == null ||
    adversarialStarts == null ||
    producerAdversarialObjectives == null ||
    globalitySearch == null ||
    producerGlobalityObjectives == null
  ) {
    return metrics;
  }
  const sampleCount = apparatus.sampleCount;
  metrics.spatialSampleCount = sampleCount;
  metrics.optimizerBindingCount = bindingFile.records.length;
  metrics.conditionOptimumCount = optimumVectors.rows;
  metrics.directionCount = nullDirections.rows;
  metrics.optimizerTraceRowCount = optimizerTrace.rows;
  metrics.adversarialStartCount = adversarialStarts.rows;
  metrics.globalityLevelCount = globalitySearch.rows;
  if (
    spatial.records.length !== sampleCount ||
    bindingFile.records.length !==
      sampleCount * OBSERVER_ENERGY_CONDITION_IDS.length ||
    timelike.rows !== sampleCount ||
    optimumVectors.rows !== bindingFile.records.length ||
    producerOptimumObjectives.rows !== optimumVectors.rows ||
    producerExtrema.rows !== sampleCount ||
    nullDirections.rows <
      roleMinimumFirstAxis(family, "null_direction_vectors") ||
    nullDirections.rows % sampleCount !== 0 ||
    producerContractions.rows !== nullDirections.rows ||
    producerTraceObjectives.rows !== optimizerTrace.rows ||
    producerAdversarialObjectives.rows !== adversarialStarts.rows ||
    producerGlobalityObjectives.rows !== globalitySearch.rows
  ) {
    blocked(accumulator, "observer_coverage_or_row_mapping_inconsistent");
    return metrics;
  }

  const sampleIndexById = new Map<string, number>();
  for (const [sampleIndex, record] of spatial.records.entries()) {
    const sampleId = record.sample_id;
    if (
      typeof sampleId !== "string" ||
      sampleId.length === 0 ||
      sampleIndexById.has(sampleId)
    ) {
      blocked(accumulator, `observer_spatial_sample_id_invalid:${sampleIndex}`);
      continue;
    }
    sampleIndexById.set(sampleId, sampleIndex);
  }

  type OptimizerBinding = {
    sampleIndex: number;
    condition: ObserverEnergyConditionId;
    optimumRow: number;
    traceOffset: number;
    traceCount: number;
    startOffset: number;
    startCount: number;
    globalityOffset: number;
    globalityCount: number;
  };
  const bindings: OptimizerBinding[] = [];
  const bindingKeys = new Set<string>();
  const optimumCoverage = Array(optimumVectors.rows).fill(false) as boolean[];
  const traceCoverage = Array(optimizerTrace.rows).fill(false) as boolean[];
  const startCoverage = Array(adversarialStarts.rows).fill(false) as boolean[];
  const globalityCoverage = Array(globalitySearch.rows).fill(
    false,
  ) as boolean[];
  let bindingInvalid = sampleIndexById.size !== sampleCount;
  const claimSlice = (
    offset: number,
    count: number,
    coverage: boolean[],
    minimumCount: number,
  ): boolean => {
    if (count < minimumCount || offset > coverage.length - count) return false;
    for (let row = offset; row < offset + count; row += 1) {
      if (coverage[row]) return false;
      coverage[row] = true;
    }
    return true;
  };
  for (const [bindingIndex, record] of bindingFile.records.entries()) {
    const bindingId = record.binding_id;
    const sampleId = record.sample_id;
    const conditionValue = record.energy_condition_id;
    const sampleIndex =
      typeof sampleId === "string" ? sampleIndexById.get(sampleId) : undefined;
    const condition = OBSERVER_ENERGY_CONDITION_IDS.find(
      (candidate) => candidate === conditionValue,
    );
    const optimumRow = parseNonnegativeInt64(record.optimum_row);
    const traceOffset = parseNonnegativeInt64(record.trace_offset);
    const traceCount = parseNonnegativeInt64(record.trace_count);
    const startOffset = parseNonnegativeInt64(record.adversarial_start_offset);
    const startCount = parseNonnegativeInt64(record.adversarial_start_count);
    const globalityOffset = parseNonnegativeInt64(record.globality_offset);
    const globalityCount = parseNonnegativeInt64(record.globality_count);
    if (
      typeof bindingId !== "string" ||
      bindingId.length === 0 ||
      sampleIndex == null ||
      condition == null ||
      record.objective_formula_id !==
        (condition == null
          ? undefined
          : OBSERVER_OBJECTIVE_FORMULA_IDS[condition]) ||
      optimumRow == null ||
      optimumRow >= optimumCoverage.length ||
      optimumCoverage[optimumRow] ||
      traceOffset == null ||
      traceCount == null ||
      startOffset == null ||
      startCount == null ||
      globalityOffset == null ||
      globalityCount == null ||
      !claimSlice(traceOffset, traceCount, traceCoverage, 1) ||
      !claimSlice(startOffset, startCount, startCoverage, 2) ||
      !claimSlice(globalityOffset, globalityCount, globalityCoverage, 3)
    ) {
      blocked(
        accumulator,
        `observer_optimizer_binding_invalid:${bindingIndex}`,
      );
      bindingInvalid = true;
      continue;
    }
    const bindingKey = `${sampleIndex}:${condition}`;
    if (bindingKeys.has(bindingKey)) {
      blocked(
        accumulator,
        `observer_optimizer_binding_duplicate:${bindingKey}`,
      );
      bindingInvalid = true;
      continue;
    }
    bindingKeys.add(bindingKey);
    optimumCoverage[optimumRow] = true;
    bindings.push({
      sampleIndex,
      condition,
      optimumRow,
      traceOffset,
      traceCount,
      startOffset,
      startCount,
      globalityOffset,
      globalityCount,
    });
  }
  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (const condition of OBSERVER_ENERGY_CONDITION_IDS) {
      if (!bindingKeys.has(`${sample}:${condition}`)) bindingInvalid = true;
    }
  }
  if (
    bindingInvalid ||
    bindings.length !== bindingFile.records.length ||
    !optimumCoverage.every(Boolean) ||
    !traceCoverage.every(Boolean) ||
    !startCoverage.every(Boolean) ||
    !globalityCoverage.every(Boolean)
  ) {
    blocked(accumulator, "observer_optimizer_binding_coverage_inconsistent");
    return metrics;
  }

  const sampleGeometry: Array<{
    metric: number[][];
    inverse: number[][];
    tensor: number[][];
    referenceU: number[];
    referenceEvaluation: ObserverEvaluation;
  } | null> = [];
  let maxTimelikeError = 0;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const metric = tensor10ToFull(apparatus.metric, sample);
    const inverse = invert4(metric);
    const tensor = tensor10ToFull(apparatus.total, sample);
    const rawReferenceU = Array.from({ length: 4 }, (_, component) =>
      rowValue(timelike, sample, component),
    );
    const norm = bilinear(metric, rawReferenceU, rawReferenceU);
    if (inverse == null || !(norm < 0)) {
      blocked(accumulator, `timelike_reference_or_metric_invalid:${sample}`);
      sampleGeometry.push(null);
      continue;
    }
    maxTimelikeError = Math.max(maxTimelikeError, Math.abs(norm + 1));
    const referenceU = rawReferenceU.map((value) => value / Math.sqrt(-norm));
    sampleGeometry.push({
      metric,
      inverse,
      tensor,
      referenceU,
      referenceEvaluation: observerEvaluation(
        tensor,
        metric,
        inverse,
        referenceU,
      ),
    });
  }

  const recomputedOptimumObjectives = new Float64Array(optimumVectors.rows);
  const recomputedAdversarialObjectives = new Float64Array(
    adversarialStarts.rows,
  );
  const conditionObjectives = new Float64Array(
    sampleCount * OBSERVER_ENERGY_CONDITION_IDS.length,
  );
  for (const binding of bindings) {
    const geometry = sampleGeometry[binding.sampleIndex];
    if (geometry == null) continue;
    const conditionIndex = OBSERVER_ENERGY_CONDITION_IDS.indexOf(
      binding.condition,
    );
    const rawOptimum = Array.from({ length: 4 }, (_, component) =>
      rowValue(optimumVectors, binding.optimumRow, component),
    );
    const optimumNorm = bilinear(geometry.metric, rawOptimum, rawOptimum);
    if (!(optimumNorm < 0)) {
      blocked(
        accumulator,
        `condition_optimum_not_timelike:${binding.optimumRow}`,
      );
      continue;
    }
    maxTimelikeError = Math.max(maxTimelikeError, Math.abs(optimumNorm + 1));
    const optimumU = rawOptimum.map((value) => value / Math.sqrt(-optimumNorm));
    if (-bilinear(geometry.metric, geometry.referenceU, optimumU) <= 0) {
      blocked(
        accumulator,
        `condition_optimum_future_orientation_invalid:${binding.optimumRow}`,
      );
    }
    const optimumObjective = observerObjective(
      binding.condition,
      observerEvaluation(
        geometry.tensor,
        geometry.metric,
        geometry.inverse,
        optimumU,
      ),
    );
    recomputedOptimumObjectives[binding.optimumRow] = optimumObjective;
    conditionObjectives[
      binding.sampleIndex * OBSERVER_ENERGY_CONDITION_IDS.length +
        conditionIndex
    ] = optimumObjective;

    let previousIteration = Number.NEGATIVE_INFINITY;
    for (
      let row = binding.traceOffset;
      row < binding.traceOffset + binding.traceCount;
      row += 1
    ) {
      const iteration = rowValue(optimizerTrace, row, 0);
      const gradientNorm = rowValue(optimizerTrace, row, 1);
      const stepNorm = rowValue(optimizerTrace, row, 2);
      if (
        !Number.isSafeInteger(iteration) ||
        iteration <= previousIteration ||
        gradientNorm < 0 ||
        stepNorm < 0
      ) {
        blocked(accumulator, `optimizer_trace_row_invalid:${row}`);
      }
      previousIteration = iteration;
    }
    const finalTraceRow = binding.traceOffset + binding.traceCount - 1;
    if (
      rowValue(optimizerTrace, finalTraceRow, 1) >
      NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.vectorNormalizationAbsoluteMax
    ) {
      failed(
        accumulator,
        `optimizer_trace_gradient_not_converged:${finalTraceRow}`,
      );
    }
    if (
      comparisonBreached(
        difference(
          [optimumObjective],
          [rowValue(producerTraceObjectives, finalTraceRow, 0)],
        ),
      )
    ) {
      failed(
        accumulator,
        `optimizer_trace_result_comparison_mismatch:${finalTraceRow}`,
      );
    }

    const distinctStarts = new Set<string>();
    const startObjectives: number[] = [];
    for (
      let row = binding.startOffset;
      row < binding.startOffset + binding.startCount;
      row += 1
    ) {
      const rawStart = Array.from({ length: 4 }, (_, component) =>
        rowValue(adversarialStarts, row, component),
      );
      distinctStarts.add(
        rawStart.map((value) => value.toPrecision(14)).join(","),
      );
      const startNorm = bilinear(geometry.metric, rawStart, rawStart);
      if (!(startNorm < 0)) {
        blocked(accumulator, `adversarial_start_not_timelike:${row}`);
        continue;
      }
      maxTimelikeError = Math.max(maxTimelikeError, Math.abs(startNorm + 1));
      const startU = rawStart.map((value) => value / Math.sqrt(-startNorm));
      if (-bilinear(geometry.metric, geometry.referenceU, startU) <= 0) {
        blocked(
          accumulator,
          `adversarial_start_future_orientation_invalid:${row}`,
        );
      }
      const startObjective = observerObjective(
        binding.condition,
        observerEvaluation(
          geometry.tensor,
          geometry.metric,
          geometry.inverse,
          startU,
        ),
      );
      recomputedAdversarialObjectives[row] = startObjective;
      startObjectives.push(startObjective);
    }
    metrics.distinctAdversarialStartCount += distinctStarts.size;
    if (
      distinctStarts.size < 2 ||
      startObjectives.length !== binding.startCount
    ) {
      blocked(
        accumulator,
        `adversarial_start_coverage_vacuous:${binding.sampleIndex}:${binding.condition}`,
      );
      continue;
    }

    let previousResolution = Number.NEGATIVE_INFINITY;
    let previousStartCount = 0;
    for (
      let row = binding.globalityOffset;
      row < binding.globalityOffset + binding.globalityCount;
      row += 1
    ) {
      const resolution = rowValue(globalitySearch, row, 0);
      const startCount = rowValue(globalitySearch, row, 1);
      const spread = rowValue(producerGlobalityObjectives, row, 1);
      if (
        resolution <= previousResolution ||
        !Number.isSafeInteger(startCount) ||
        startCount < previousStartCount ||
        startCount <= 0 ||
        startCount > binding.startCount ||
        spread < 0
      ) {
        blocked(accumulator, `globality_search_row_invalid:${row}`);
      } else {
        const coveredObjectives = startObjectives.slice(0, startCount);
        const coveredMinimum = Math.min(...coveredObjectives);
        const coveredSpread = Math.max(...coveredObjectives) - coveredMinimum;
        if (
          comparisonBreached(
            difference(
              [coveredMinimum, coveredSpread],
              [
                rowValue(producerGlobalityObjectives, row, 0),
                rowValue(producerGlobalityObjectives, row, 1),
              ],
            ),
          )
        ) {
          failed(
            accumulator,
            `producer_globality_search_comparison_mismatch:${row}`,
          );
        }
      }
      previousResolution = resolution;
      previousStartCount = startCount;
    }
    const finalGlobalityRow =
      binding.globalityOffset + binding.globalityCount - 1;
    if (
      rowValue(globalitySearch, finalGlobalityRow, 1) !== binding.startCount
    ) {
      blocked(
        accumulator,
        `globality_search_adversarial_coverage_incomplete:${finalGlobalityRow}`,
      );
    }
    const minimumStartObjective = Math.min(...startObjectives);
    if (
      optimumObjective >
      minimumStartObjective +
        NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.conditionAbsoluteTolerance
    ) {
      failed(
        accumulator,
        `optimizer_result_worse_than_adversarial_start:${binding.optimumRow}`,
      );
    }
  }
  blocked(accumulator, "observer_continuous_globality_unproven");

  const optimumObjectiveComparison = difference(
    recomputedOptimumObjectives,
    producerOptimumObjectives.values,
  );
  metrics.optimumObjectiveComparisonMaxAbs = optimumObjectiveComparison.maxAbs;
  metrics.optimumObjectiveComparisonRelative =
    optimumObjectiveComparison.relative;
  if (comparisonBreached(optimumObjectiveComparison))
    failed(accumulator, "producer_optimum_objective_comparison_mismatch");
  const adversarialObjectiveComparison = difference(
    recomputedAdversarialObjectives,
    producerAdversarialObjectives.values,
  );
  metrics.adversarialObjectiveComparisonMaxAbs =
    adversarialObjectiveComparison.maxAbs;
  metrics.adversarialObjectiveComparisonRelative =
    adversarialObjectiveComparison.relative;
  if (comparisonBreached(adversarialObjectiveComparison))
    failed(accumulator, "producer_adversarial_objective_comparison_mismatch");

  const directionsPerSample = nullDirections.rows / sampleCount;
  metrics.directionsPerSample = directionsPerSample;
  const recomputedContractions = new Float64Array(nullDirections.rows * 3);
  const recomputedExtrema = new Float64Array(sampleCount * 3);
  let maxNullError = 0;
  let minimumWec = Number.POSITIVE_INFINITY;
  let minimumNec = Number.POSITIVE_INFINITY;
  let minimumDec = Number.POSITIVE_INFINITY;
  let minimumSec = Number.POSITIVE_INFINITY;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const geometry = sampleGeometry[sample];
    if (geometry == null) continue;
    const wec =
      conditionObjectives[sample * OBSERVER_ENERGY_CONDITION_IDS.length];
    const sec =
      conditionObjectives[sample * OBSERVER_ENERGY_CONDITION_IDS.length + 1];
    const decMargin =
      conditionObjectives[sample * OBSERVER_ENERGY_CONDITION_IDS.length + 2];
    let sampleNec = Number.POSITIVE_INFINITY;
    const distinctNullDirections = new Set<string>();
    for (let direction = 0; direction < directionsPerSample; direction += 1) {
      const directionRow = sample * directionsPerSample + direction;
      const rawK = Array.from({ length: 4 }, (_, component) =>
        rowValue(nullDirections, directionRow, component),
      );
      const futureScale = -bilinear(geometry.metric, geometry.referenceU, rawK);
      if (!(futureScale > 0)) {
        blocked(
          accumulator,
          `null_direction_future_orientation_invalid:${directionRow}`,
        );
        continue;
      }
      const k = rawK.map((value) => value / futureScale);
      distinctNullDirections.add(
        k.map((value) => value.toPrecision(14)).join(","),
      );
      const nullNorm = bilinear(geometry.metric, k, k);
      maxNullError = Math.max(maxNullError, Math.abs(nullNorm));
      if (
        Math.abs(nullNorm) >
        NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.vectorNormalizationAbsoluteMax
      ) {
        blocked(accumulator, `null_direction_not_null:${directionRow}`);
      }
      const nec = tensorContraction(geometry.tensor, k, k);
      sampleNec = Math.min(sampleNec, nec);
      recomputedContractions[directionRow * 3] =
        geometry.referenceEvaluation.wec;
      recomputedContractions[directionRow * 3 + 1] = nec;
      recomputedContractions[directionRow * 3 + 2] =
        geometry.referenceEvaluation.fluxNorm;
    }
    if (distinctNullDirections.size !== directionsPerSample) {
      blocked(accumulator, `null_direction_coverage_duplicated:${sample}`);
    }
    recomputedExtrema[sample * 3] = wec;
    recomputedExtrema[sample * 3 + 1] = sampleNec;
    recomputedExtrema[sample * 3 + 2] = decMargin;
    minimumWec = Math.min(minimumWec, wec);
    minimumNec = Math.min(minimumNec, sampleNec);
    minimumDec = Math.min(minimumDec, decMargin);
    minimumSec = Math.min(minimumSec, sec);
  }
  metrics.maxTimelikeNormalizationError = maxTimelikeError;
  metrics.maxNullNormalizationError = maxNullError;
  metrics.minimumWec = Number.isFinite(minimumWec) ? minimumWec : null;
  metrics.minimumNec = Number.isFinite(minimumNec) ? minimumNec : null;
  metrics.minimumDecMargin = Number.isFinite(minimumDec) ? minimumDec : null;
  metrics.minimumSec = Number.isFinite(minimumSec) ? minimumSec : null;
  if (
    maxTimelikeError >
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.vectorNormalizationAbsoluteMax
  ) {
    blocked(accumulator, "timelike_vector_normalization_inconsistent");
  }
  const conditionTolerance =
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.conditionAbsoluteTolerance;
  if (metrics.minimumWec != null && metrics.minimumWec < -conditionTolerance)
    failed(accumulator, "wec_threshold_breach");
  if (metrics.minimumNec != null && metrics.minimumNec < -conditionTolerance)
    failed(accumulator, "nec_threshold_breach");
  if (
    metrics.minimumDecMargin != null &&
    metrics.minimumDecMargin < -conditionTolerance
  ) {
    failed(accumulator, "dec_causal_flux_threshold_breach");
  }
  if (metrics.minimumSec != null && metrics.minimumSec < -conditionTolerance) {
    failed(accumulator, "sec_threshold_breach");
  }
  const contractionComparison = difference(
    recomputedContractions,
    producerContractions.values,
  );
  metrics.contractionComparisonMaxAbs = contractionComparison.maxAbs;
  metrics.contractionComparisonRelative = contractionComparison.relative;
  if (comparisonBreached(contractionComparison))
    failed(accumulator, "producer_observer_contraction_comparison_mismatch");
  const extremaComparison = difference(
    recomputedExtrema,
    producerExtrema.values,
  );
  metrics.extremaComparisonMaxAbs = extremaComparison.maxAbs;
  metrics.extremaComparisonRelative = extremaComparison.relative;
  if (comparisonBreached(extremaComparison))
    failed(accumulator, "producer_observer_extrema_comparison_mismatch");
  return metrics;
};

const computeQei = (
  index: FileIndex,
  apparatus: ApparatusState | null,
  accumulator: FamilyAccumulator,
): Nhm2PrimaryRawGrQeiMetrics => {
  const metrics = emptyQeiMetrics();
  if (apparatus == null) {
    blocked(accumulator, "apparatus_recomputation_unavailable");
    return metrics;
  }
  const family = "worldline_qei" as const;
  const catalog = recordFile(index, family, "worldline_catalog", accumulator);
  const interpolationFile = recordFile(
    index,
    family,
    "worldline_apparatus_interpolation_entries",
    accumulator,
  );
  const trajectory = asMatrix(
    numericalFile(index, family, "trajectory_components", accumulator),
    4,
    accumulator,
  );
  const properTime = asMatrix(
    numericalFile(index, family, "proper_time_samples", accumulator),
    2,
    accumulator,
  );
  const velocity = asMatrix(
    numericalFile(index, family, "four_velocity_components", accumulator),
    4,
    accumulator,
  );
  const acceleration = asMatrix(
    numericalFile(
      index,
      family,
      "acceleration_curvature_components",
      accumulator,
    ),
    8,
    accumulator,
  );
  const pulledTensor = asMatrix(
    numericalFile(index, family, "pulled_back_tensor_components", accumulator),
    10,
    accumulator,
  );
  const pulledMetric = asMatrix(
    numericalFile(index, family, "pulled_back_metric_components", accumulator),
    10,
    accumulator,
  );
  const producerContracted = asMatrix(
    numericalFile(index, family, "contracted_tensor_samples", accumulator),
    1,
    accumulator,
  );
  const sampling = asMatrix(
    numericalFile(index, family, "sampling_function_samples", accumulator),
    4,
    accumulator,
  );
  const producerIntegrand = asMatrix(
    numericalFile(index, family, "quadrature_integrand_samples", accumulator),
    3,
    accumulator,
  );
  const theorem = asMatrix(
    numericalFile(index, family, "theorem_bound_inputs", accumulator),
    4,
    accumulator,
  );
  if (
    catalog == null ||
    interpolationFile == null ||
    trajectory == null ||
    properTime == null ||
    velocity == null ||
    acceleration == null ||
    pulledTensor == null ||
    pulledMetric == null ||
    producerContracted == null ||
    sampling == null ||
    producerIntegrand == null ||
    theorem == null
  ) {
    return metrics;
  }
  metrics.worldlineCount = catalog.records.length;
  if (
    catalog.records.length <
      roleMinimumFirstAxis(family, "worldline_catalog") ||
    catalog.records.length === 0 ||
    theorem.rows !== catalog.records.length
  ) {
    blocked(accumulator, "worldline_catalog_coverage_vacuous_or_inconsistent");
    return metrics;
  }

  const slices: Array<{ worldlineId: string; offset: number; count: number }> =
    [];
  let expectedOffset = 0;
  for (const [worldlineIndex, record] of catalog.records.entries()) {
    const offset = parseNonnegativeInt64(record.sample_offset);
    const count = parseNonnegativeInt64(record.sample_count);
    const worldlineId = record.worldline_id;
    if (
      typeof worldlineId !== "string" ||
      worldlineId.length === 0 ||
      offset == null ||
      count == null ||
      count === 0 ||
      offset !== expectedOffset ||
      count < 2
    ) {
      blocked(accumulator, `worldline_slice_inconsistent:${worldlineIndex}`);
      continue;
    }
    slices.push({ worldlineId, offset, count });
    expectedOffset += count;
  }
  metrics.coveredSampleCount = expectedOffset;
  metrics.minimumSamplesPerWorldline =
    slices.length > 0 ? Math.min(...slices.map((slice) => slice.count)) : null;
  const totalRows = expectedOffset;
  if (
    slices.length !== catalog.records.length ||
    totalRows === 0 ||
    !matrixRowsEqual(accumulator, totalRows, [
      ["trajectory", trajectory],
      ["proper_time", properTime],
      ["four_velocity", velocity],
      ["acceleration_curvature", acceleration],
      ["pulled_tensor", pulledTensor],
      ["pulled_metric", pulledMetric],
      ["producer_contracted", producerContracted],
      ["sampling_function", sampling],
      ["producer_integrand", producerIntegrand],
    ])
  ) {
    blocked(accumulator, "worldline_sample_coverage_not_exact");
    return metrics;
  }

  type InterpolationEntry = {
    entryIndex: number;
    apparatusSampleIndex: number;
    weight: number;
  };
  const entriesByWorldlineSample = Array.from(
    { length: totalRows },
    () => [] as InterpolationEntry[],
  );
  const expectedWorldlineIdBySample = Array(totalRows).fill("") as string[];
  for (const slice of slices) {
    for (let local = 0; local < slice.count; local += 1)
      expectedWorldlineIdBySample[slice.offset + local] = slice.worldlineId;
  }
  let interpolationInvalid = interpolationFile.records.length < totalRows;
  for (const [recordIndex, record] of interpolationFile.records.entries()) {
    const worldlineSampleIndex = parseNonnegativeInt64(
      record.worldline_sample_index,
    );
    const entryIndex = parseNonnegativeInt64(record.entry_index);
    const apparatusSampleIndex = parseNonnegativeInt64(
      record.apparatus_sample_index,
    );
    const weight = record.weight;
    if (
      worldlineSampleIndex == null ||
      worldlineSampleIndex >= totalRows ||
      entryIndex == null ||
      apparatusSampleIndex == null ||
      apparatusSampleIndex >= apparatus.sampleCount ||
      typeof weight !== "number" ||
      !Number.isFinite(weight) ||
      record.worldline_id !==
        (worldlineSampleIndex == null
          ? undefined
          : expectedWorldlineIdBySample[worldlineSampleIndex])
    ) {
      blocked(
        accumulator,
        `worldline_interpolation_entry_invalid:${recordIndex}`,
      );
      interpolationInvalid = true;
      continue;
    }
    entriesByWorldlineSample[worldlineSampleIndex].push({
      entryIndex,
      apparatusSampleIndex,
      weight,
    });
  }
  metrics.interpolationEntryCount = interpolationFile.records.length;
  const recomputedPullback = new Float64Array(totalRows * 10);
  const recomputedMetricPullback = new Float64Array(totalRows * 10);
  const recomputedCoordinatePullback = new Float64Array(totalRows * 4);
  let maximumInterpolationWeightError = 0;
  for (let row = 0; row < totalRows; row += 1) {
    const entries = entriesByWorldlineSample[row].sort(
      (left, right) => left.entryIndex - right.entryIndex,
    );
    const apparatusIndices = new Set<number>();
    if (
      entries.length === 0 ||
      entries.some((entry, entryIndex) => {
        const duplicateApparatusIndex = apparatusIndices.has(
          entry.apparatusSampleIndex,
        );
        apparatusIndices.add(entry.apparatusSampleIndex);
        return (
          entry.entryIndex !== entryIndex ||
          duplicateApparatusIndex ||
          Math.abs(entry.weight) <=
            NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor
        );
      })
    ) {
      blocked(accumulator, `worldline_interpolation_slice_invalid:${row}`);
      interpolationInvalid = true;
      continue;
    }
    let weightSum = 0;
    let absoluteWeightSum = 0;
    for (const entry of entries) {
      weightSum += entry.weight;
      absoluteWeightSum += Math.abs(entry.weight);
      for (let component = 0; component < 10; component += 1) {
        recomputedPullback[row * 10 + component] +=
          entry.weight *
          rowValue(apparatus.total, entry.apparatusSampleIndex, component);
        recomputedMetricPullback[row * 10 + component] +=
          entry.weight *
          rowValue(apparatus.metric, entry.apparatusSampleIndex, component);
      }
      for (let component = 0; component < 4; component += 1) {
        recomputedCoordinatePullback[row * 4 + component] +=
          entry.weight *
          rowValue(
            apparatus.coordinates,
            entry.apparatusSampleIndex,
            component,
          );
      }
    }
    const weightError = Math.abs(weightSum - 1);
    maximumInterpolationWeightError = Math.max(
      maximumInterpolationWeightError,
      weightError,
    );
    if (
      absoluteWeightSum <= NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor ||
      weightError >
        NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.comparisonAbsolute +
          NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.comparisonRelative *
            Math.max(1, absoluteWeightSum)
    ) {
      blocked(accumulator, `worldline_interpolation_weights_invalid:${row}`);
      interpolationInvalid = true;
    }
  }
  metrics.maximumInterpolationWeightNormalizationError =
    maximumInterpolationWeightError;
  if (interpolationInvalid) {
    blocked(accumulator, "worldline_interpolation_coverage_inconsistent");
    return metrics;
  }

  const trajectoryInterpolationComparison = difference(
    recomputedCoordinatePullback,
    trajectory.values,
  );
  if (comparisonBreached(trajectoryInterpolationComparison)) {
    blocked(accumulator, "worldline_trajectory_interpolation_mismatch");
  }

  const pullbackComparison = difference(
    recomputedPullback,
    pulledTensor.values,
  );
  metrics.pullbackComparisonMaxAbs = pullbackComparison.maxAbs;
  metrics.pullbackComparisonRelative = pullbackComparison.relative;
  if (comparisonBreached(pullbackComparison))
    failed(accumulator, "producer_qei_tensor_pullback_comparison_mismatch");
  const metricPullbackComparison = difference(
    recomputedMetricPullback,
    pulledMetric.values,
  );
  metrics.metricPullbackComparisonMaxAbs = metricPullbackComparison.maxAbs;
  metrics.metricPullbackComparisonRelative = metricPullbackComparison.relative;
  if (comparisonBreached(metricPullbackComparison))
    failed(accumulator, "producer_qei_metric_pullback_comparison_mismatch");

  const recomputedPullbackMatrix: Matrix = {
    rows: totalRows,
    columns: 10,
    values: recomputedPullback,
  };
  const recomputedMetricPullbackMatrix: Matrix = {
    rows: totalRows,
    columns: 10,
    values: recomputedMetricPullback,
  };
  const recomputedContracted = new Float64Array(totalRows);
  const recomputedIntegrand = new Float64Array(totalRows * 3);
  const recomputedTheoremComparable = new Float64Array(
    catalog.records.length * 3,
  );
  let maximumVelocityError = 0;
  let maximumSamplingError = 0;
  let minimumMargin = Number.POSITIVE_INFINITY;
  blocked(accumulator, "qei_theorem_bound_derivation_unbound");
  for (const [worldlineIndex, slice] of slices.entries()) {
    let normalization = 0;
    let integral = 0;
    let maximumCurvature = 0;
    let maximumAccelerationSquared = 0;
    let firstTau = 0;
    let lastTau = 0;
    for (let local = 0; local < slice.count; local += 1) {
      const row = slice.offset + local;
      const metric = tensor10ToFull(recomputedMetricPullbackMatrix, row);
      const tensor = tensor10ToFull(recomputedPullbackMatrix, row);
      const u = Array.from({ length: 4 }, (_, component) =>
        rowValue(velocity, row, component),
      );
      const inverseMetric = invert4(metric);
      const velocityNorm = bilinear(metric, u, u);
      if (inverseMetric == null || !(velocityNorm < 0)) {
        blocked(
          accumulator,
          `worldline_metric_or_four_velocity_invalid:${row}`,
        );
        continue;
      }
      maximumVelocityError = Math.max(
        maximumVelocityError,
        Math.abs(velocityNorm + 1),
      );
      const normalizedU = u.map((value) => value / Math.sqrt(-velocityNorm));
      const contracted = tensorContraction(tensor, normalizedU, normalizedU);
      recomputedContracted[row] = contracted;
      const tau = rowValue(properTime, row, 0);
      const weight = rowValue(properTime, row, 1);
      const samplingTau = rowValue(sampling, row, 0);
      const g = rowValue(sampling, row, 1);
      if (
        weight <= 0 ||
        Math.abs(tau - samplingTau) >
          NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.comparisonAbsolute ||
        (local > 0 && tau <= rowValue(properTime, row - 1, 0))
      ) {
        blocked(accumulator, `worldline_quadrature_or_tau_invalid:${row}`);
      }
      if (local > 0) {
        let coordinateStepMagnitude = 0;
        for (let component = 0; component < 4; component += 1) {
          coordinateStepMagnitude = Math.max(
            coordinateStepMagnitude,
            Math.abs(
              rowValue(trajectory, row, component) -
                rowValue(trajectory, row - 1, component),
            ),
          );
        }
        if (
          coordinateStepMagnitude <=
          NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.scaleFloor
        ) {
          blocked(accumulator, `worldline_trajectory_step_vacuous:${row}`);
        }
      }
      if (local === 0) firstTau = tau;
      lastTau = tau;
      const weightedEnergy = g * g * contracted;
      normalization += weight * g * g;
      integral += weight * weightedEnergy;
      recomputedIntegrand[row * 3] = tau;
      recomputedIntegrand[row * 3 + 1] = weightedEnergy;
      recomputedIntegrand[row * 3 + 2] = weight;
      maximumCurvature = Math.max(
        maximumCurvature,
        Math.abs(rowValue(acceleration, row, 4)),
      );
      const accelerationVector = Array.from({ length: 4 }, (_, component) =>
        rowValue(acceleration, row, component),
      );
      const accelerationSquared = bilinear(
        metric,
        accelerationVector,
        accelerationVector,
      );
      if (
        accelerationSquared <
        -NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.conditionAbsoluteTolerance
      ) {
        blocked(accumulator, `worldline_acceleration_not_spacelike:${row}`);
      }
      maximumAccelerationSquared = Math.max(
        maximumAccelerationSquared,
        Math.max(0, accelerationSquared),
      );
    }
    const samplingError = Math.abs(normalization - 1);
    maximumSamplingError = Math.max(maximumSamplingError, samplingError);
    if (
      samplingError >
      NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.samplingNormalizationAbsoluteMax
    ) {
      blocked(
        accumulator,
        `worldline_sampling_not_normalized:${worldlineIndex}`,
      );
    }
    const samplingWidth = lastTau - firstTau;
    recomputedTheoremComparable[worldlineIndex * 3] = maximumCurvature;
    recomputedTheoremComparable[worldlineIndex * 3 + 1] =
      maximumAccelerationSquared;
    recomputedTheoremComparable[worldlineIndex * 3 + 2] = samplingWidth;
    const boundDensity = rowValue(theorem, worldlineIndex, 3);
    if (boundDensity < 0) {
      blocked(accumulator, `worldline_bound_density_invalid:${worldlineIndex}`);
      continue;
    }
    const margin = integral + boundDensity;
    minimumMargin = Math.min(minimumMargin, margin);
    if (
      margin < -NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.conditionAbsoluteTolerance
    ) {
      failed(accumulator, `qei_margin_threshold_breach:${worldlineIndex}`);
    }
  }
  metrics.maximumFourVelocityNormalizationError = maximumVelocityError;
  metrics.maximumSamplingNormalizationError = maximumSamplingError;
  metrics.minimumMargin = Number.isFinite(minimumMargin) ? minimumMargin : null;
  if (
    maximumVelocityError >
    NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS.vectorNormalizationAbsoluteMax
  ) {
    blocked(accumulator, "worldline_four_velocity_normalization_inconsistent");
  }
  const contractionComparison = difference(
    recomputedContracted,
    producerContracted.values,
  );
  metrics.contractionComparisonMaxAbs = contractionComparison.maxAbs;
  metrics.contractionComparisonRelative = contractionComparison.relative;
  if (comparisonBreached(contractionComparison))
    failed(accumulator, "producer_qei_contraction_comparison_mismatch");
  const integrandComparison = difference(
    recomputedIntegrand,
    producerIntegrand.values,
  );
  metrics.integrandComparisonMaxAbs = integrandComparison.maxAbs;
  metrics.integrandComparisonRelative = integrandComparison.relative;
  if (comparisonBreached(integrandComparison))
    failed(accumulator, "producer_qei_integrand_comparison_mismatch");
  const theoremComparable = new Float64Array(catalog.records.length * 3);
  for (let worldline = 0; worldline < catalog.records.length; worldline += 1) {
    theoremComparable[worldline * 3] = rowValue(theorem, worldline, 0);
    theoremComparable[worldline * 3 + 1] = rowValue(theorem, worldline, 1);
    theoremComparable[worldline * 3 + 2] = rowValue(theorem, worldline, 2);
  }
  const theoremComparison = difference(
    recomputedTheoremComparable,
    theoremComparable,
  );
  metrics.theoremInputComparisonMaxAbs = theoremComparison.maxAbs;
  metrics.theoremInputComparisonRelative = theoremComparison.relative;
  if (comparisonBreached(theoremComparison))
    failed(accumulator, "qei_theorem_input_comparison_mismatch");
  return metrics;
};

const claimBoundary: Nhm2PrimaryRawGrContentReplay["claimBoundary"] = {
  diagnosticOnly: true,
  theoryClosureClaimAllowed: false,
  physicalViabilityClaimAllowed: false,
  transportClaimAllowed: false,
  propulsionClaimAllowed: false,
  routeEtaClaimAllowed: false,
  speedClaimAllowed: false,
  empiricalReceiptsRequired: true,
};

const blockedReplay = (reason: string): Nhm2PrimaryRawGrContentReplay => {
  const accumulator = (): FamilyAccumulator => ({
    blockers: [reason],
    failures: [],
  });
  return {
    artifactId: NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_CONTRACT_VERSION,
    source: {
      candidateId: null,
      runId: null,
      manifestSha256: null,
      contentPolicySha256: null,
    },
    inputVerificationAccepted: false,
    assumptions,
    thresholds: NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS,
    rawFileHashClosure: null,
    families: {
      full_apparatus_source_tensor: finalize(
        accumulator(),
        emptyApparatusMetrics(),
      ),
      covariant_conservation: finalize(
        accumulator(),
        emptyConservationMetrics(),
      ),
      continuous_observer_optimizer: finalize(
        accumulator(),
        emptyObserverMetrics(),
      ),
      worldline_qei: finalize(accumulator(), emptyQeiMetrics()),
    },
    claimBoundary,
  };
};

/**
 * Recomputes GR diagnostics exclusively from filesystem-verified raw values.
 * Producer comparison arrays can only cause failure; they never establish a
 * pass. The result is diagnostic evidence and keeps every physical claim shut.
 */
export function replayNhm2PrimaryRawGrContent(
  verification: Nhm2PrimaryRawOutputFilesystemVerification,
): Nhm2PrimaryRawGrContentReplay {
  if (!verification.verified)
    return blockedReplay("verified_filesystem_input_required");
  const typedClosureViolations = validateTypedFileClosure(verification.files);
  if (typedClosureViolations.length > 0)
    return blockedReplay(typedClosureViolations.join("|"));

  const index = indexFiles(verification.files);
  const apparatusAccumulator: FamilyAccumulator = {
    blockers: [],
    failures: [],
  };
  const conservationAccumulator: FamilyAccumulator = {
    blockers: [],
    failures: [],
  };
  const observerAccumulator: FamilyAccumulator = { blockers: [], failures: [] };
  const qeiAccumulator: FamilyAccumulator = { blockers: [], failures: [] };

  const apparatus = computeApparatus(index, apparatusAccumulator);
  const conservationMetrics = computeConservation(
    index,
    apparatus.state,
    conservationAccumulator,
  );
  const observerMetrics = computeObservers(
    index,
    apparatus.state,
    observerAccumulator,
  );
  const qeiMetrics = computeQei(index, apparatus.state, qeiAccumulator);

  return {
    artifactId: NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_ARTIFACT_ID,
    contractVersion: NHM2_PRIMARY_RAW_GR_CONTENT_REPLAY_CONTRACT_VERSION,
    source: {
      candidateId: verification.manifest.identity.candidateId,
      runId: verification.manifest.execution.runId,
      manifestSha256: verification.manifestSha256,
      contentPolicySha256: verification.manifest.contentPolicy.sha256,
    },
    inputVerificationAccepted: true,
    assumptions,
    thresholds: NHM2_PRIMARY_RAW_GR_REPLAY_THRESHOLDS,
    rawFileHashClosure: buildHashClosure(verification.files),
    families: {
      full_apparatus_source_tensor: finalize(
        apparatusAccumulator,
        apparatus.metrics,
      ),
      covariant_conservation: finalize(
        conservationAccumulator,
        conservationMetrics,
      ),
      continuous_observer_optimizer: finalize(
        observerAccumulator,
        observerMetrics,
      ),
      worldline_qei: finalize(qeiAccumulator, qeiMetrics),
    },
    claimBoundary,
  };
}
