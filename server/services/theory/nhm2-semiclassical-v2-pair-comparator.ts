import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY,
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS,
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS_SHA256,
  computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256,
  type Nhm2SemiclassicalV2PairArrayComparisonV1,
  type Nhm2SemiclassicalV2PairReplayMetricLeafComparisonV1,
  type Nhm2SemiclassicalV2ReplayLeafDescriptorV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-pair-agreement.v1";
import {
  collectNhm2SemiclassicalV2RawReplayOutputArrays,
  nhm2SemiclassicalV2RawReplayManifestPairViolations,
  nhm2SemiclassicalV2RawReplayManifestViolations,
  type Nhm2SemiclassicalV2RawReplayArrayV1,
  type Nhm2SemiclassicalV2RawReplayManifestV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_CONTRACT_VERSION,
  type Nhm2SemiclassicalV2ContentReplayResult,
} from "./nhm2-semiclassical-v2-content-replay";
import {
  NHM2_SECURE_RUN_OUTPUT_READER_VERSION,
  NHM2_SECURE_RUN_OUTPUT_READER_AUTHORITY_BLOCKERS,
  NHM2_SECURE_RUN_OUTPUT_READER_CLAIM_BOUNDARY,
  type Nhm2SecureRunOutputReadResultV1,
} from "./nhm2-secure-run-output-reader";
import {
  NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION,
  type Nhm2SemiclassicalV2RunReplaySuccess,
  type Nhm2SemiclassicalV2RunReplayerFileReceipt,
  type Nhm2SemiclassicalV2RunReplayerManifestBinding,
} from "./nhm2-semiclassical-v2-run-replayer";

export const NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_comparator/v2" as const;

export type Nhm2SemiclassicalV2CompletedRunSnapshotV1 = Readonly<{
  completionState: "completed";
  manifest: Readonly<Nhm2SemiclassicalV2RawReplayManifestV1>;
  manifestBinding: Readonly<Nhm2SemiclassicalV2RunReplayerManifestBinding>;
  outputSnapshot: Readonly<Nhm2SecureRunOutputReadResultV1>;
  runReplay: Nhm2SemiclassicalV2RunReplaySuccess;
}>;

export type Nhm2SemiclassicalV2PairComparatorInputV1 = Readonly<{
  primary: Nhm2SemiclassicalV2CompletedRunSnapshotV1;
  independent: Nhm2SemiclassicalV2CompletedRunSnapshotV1;
}>;

export type Nhm2SemiclassicalV2PairNumericDeltaSummaryV1 = Readonly<{
  decodableAsFiniteFloat64: boolean;
  valueCount: number | null;
  worstIndex: number | null;
  primaryValue: number | null;
  independentValue: number | null;
  maximumAbsoluteDelta: number | null;
  maximumRelativeDelta: number | null;
  relativeDenominator:
    "max_abs_primary_abs_independent_number_min_value" | null;
  deltaOverflowed: boolean;
}>;

export type Nhm2SemiclassicalV2PairArrayCalculationV1 = Readonly<{
  ordinal: number;
  arrayRole: string;
  comparator: "strict_byte_equality";
  primary: Readonly<{
    sha256: string | null;
    sizeBytes: number | null;
  }>;
  independent: Readonly<{
    sha256: string | null;
    sizeBytes: number | null;
  }>;
  descriptorChecks: Readonly<{
    role: boolean;
    shape: boolean;
    componentOrder: boolean;
    unit: boolean;
    dtype: boolean;
    binaryEncoding: boolean;
    endianness: boolean;
    storageOrder: boolean;
    sizeBytes: boolean;
  }>;
  primaryBufferHashRecomputedAndMatched: boolean;
  independentBufferHashRecomputedAndMatched: boolean;
  bytesEqual: boolean;
  numericDelta: Nhm2SemiclassicalV2PairNumericDeltaSummaryV1;
  status: "pass" | "fail" | "blocked";
}>;

type ReplayScalar = string | number | boolean | null;
type ReplayLeafKind =
  | "string"
  | "finite_number"
  | "boolean"
  | "null"
  | "missing"
  | "nonfinite_number"
  | "unsupported";

export type Nhm2SemiclassicalV2PairReplayMetricCalculationV1 = Readonly<{
  ordinal: number;
  metricLeafId: string;
  comparator: "exact_replay_leaf_equality";
  primaryKind: ReplayLeafKind;
  independentKind: ReplayLeafKind;
  primaryValue: ReplayScalar;
  independentValue: ReplayScalar;
  absoluteDelta: number | null;
  valuesEqual: boolean;
  status: "pass" | "fail" | "blocked";
}>;

export type Nhm2SemiclassicalV2PairFailureAgreementProjectionV1 = Readonly<{
  candidateDisposition: "frozen_candidate_failed_without_retuning";
  sharedReplayStatus: "fail";
  sharedIssueCodes: readonly string[];
  replayEnvelopeExact: true;
  arrayComparisons: readonly Nhm2SemiclassicalV2PairArrayComparisonV1[];
  replayMetricCoverage: Readonly<{
    ordering: "frozen_content_replay_leaf_order_v2";
    leafDescriptors: readonly Nhm2SemiclassicalV2ReplayLeafDescriptorV1[];
    leafCount: number;
    coverageSha256: string;
  }>;
  replayMetricComparisons: readonly Nhm2SemiclassicalV2PairReplayMetricLeafComparisonV1[];
  terminalFailureReceiptAuthority: false;
  retuningAuthorized: false;
}>;

export type Nhm2SemiclassicalV2PairComparatorResultV1 = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION;
  policyId: string;
  policySha256: string;
  calculationOnly: true;
  serverOwned: true;
  contentReplayRecomputedByComparator: false;
  agreementProjectionAuthority: false;
  failureAgreementProjectionAuthority: false;
  status: "pass" | "fail" | "blocked";
  candidateDisposition:
    "frozen_limits_passed" | "frozen_limits_failed" | "indeterminate";
  candidateRetuningAuthorized: false;
  strictRawByteEqualityRequired: true;
  arrayRoleCoverage: Readonly<{
    expectedCount: number;
    comparedCount: number;
    complete: boolean;
  }>;
  replayMetricCoverage: Readonly<{
    metricLeafDescriptors: readonly Nhm2SemiclassicalV2ReplayLeafDescriptorV1[];
    metricLeafIds: readonly string[];
    metricLeafCount: number;
    coverageSha256: string;
    metricLeafIdsSha256: string;
    observedPrimaryLeafCount: number;
    observedIndependentLeafCount: number;
    primarySchemaExact: boolean;
    independentSchemaExact: boolean;
  }>;
  arrayComparisons: readonly Nhm2SemiclassicalV2PairArrayCalculationV1[];
  replayMetricComparisons: readonly Nhm2SemiclassicalV2PairReplayMetricCalculationV1[];
  agreementProjection: Readonly<{
    arrayComparisons: readonly Nhm2SemiclassicalV2PairArrayComparisonV1[];
    replayMetricCoverage: Readonly<{
      ordering: "frozen_content_replay_leaf_order_v2";
      leafDescriptors: readonly Nhm2SemiclassicalV2ReplayLeafDescriptorV1[];
      leafCount: number;
      coverageSha256: string;
    }>;
    replayMetricComparisons: readonly Nhm2SemiclassicalV2PairReplayMetricLeafComparisonV1[];
  }> | null;
  failureAgreementProjection: Nhm2SemiclassicalV2PairFailureAgreementProjectionV1 | null;
  replayEnvelopeExact: boolean;
  issues: readonly string[];
  blockers: readonly string[];
  claimLocks: Readonly<{
    comparatorEstablishesImplementationIndependence: false;
    contentReplayRecomputedByComparator: false;
    coordinatorSuppliedRunReplayOriginEstablishedByComparator: false;
    agreementProjectionAuthoritative: false;
    failureAgreementProjectionAuthoritative: false;
    terminalCandidateFailureReceiptCreated: false;
    candidateRetuningAuthorized: false;
    independentImplementationAgreementEstablished: false;
    semiclassicalStressNoiseLamp: false;
    constraintClosureLamp: false;
    theoryGraphPromotion: false;
    theoryGraphSemiclassicalLampsPromotable: false;
    theoryClosure: false;
    theoryClosureEstablished: false;
    experimentReadyTheoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    physicalViability: false;
    propulsionEstablished: false;
    propulsion: false;
    transportEstablished: false;
    transport: false;
    routeEtaEstablished: false;
    routeEta: false;
    certifiedSpeedEstablished: false;
    certifiedSpeed: false;
    empiricalValidationEstablished: false;
    empiricalValidation: false;
  }>;
}>;

const CLAIM_LOCKS = Object.freeze({
  comparatorEstablishesImplementationIndependence: false as const,
  contentReplayRecomputedByComparator: false as const,
  coordinatorSuppliedRunReplayOriginEstablishedByComparator: false as const,
  agreementProjectionAuthoritative: false as const,
  failureAgreementProjectionAuthoritative: false as const,
  terminalCandidateFailureReceiptCreated: false as const,
  candidateRetuningAuthorized: false as const,
  independentImplementationAgreementEstablished: false as const,
  semiclassicalStressNoiseLamp: false as const,
  constraintClosureLamp: false as const,
  theoryGraphPromotion: false as const,
  theoryGraphSemiclassicalLampsPromotable: false as const,
  theoryClosure: false as const,
  theoryClosureEstablished: false as const,
  experimentReadyTheoryClosureEstablished: false as const,
  physicalViabilityEstablished: false as const,
  physicalViability: false as const,
  propulsionEstablished: false as const,
  propulsion: false as const,
  transportEstablished: false as const,
  transport: false as const,
  routeEtaEstablished: false as const,
  routeEta: false as const,
  certifiedSpeedEstablished: false as const,
  certifiedSpeed: false as const,
  empiricalValidationEstablished: false as const,
  empiricalValidation: false as const,
});

const BRACKET_IDS = ["H_H", "H_Hi", "Hi_Hj"] as const;
const RESIDUAL_METRIC_KEYS = [
  "residualLInf",
  "absoluteUncertainty95",
  "residualUpper95",
  "producerResidualMismatchLInf",
  "tolerance",
] as const;

const LOCAL_ARRAY_ROLES = Object.freeze([
  "noise_kernel",
  "noise_kernel_absolute_uncertainty95",
  "mean_rset",
  "mean_rset_absolute_uncertainty95",
  "smearing_weights",
  ...BRACKET_IDS.flatMap((id) => [
    `constraint_bracket.${id}.computed`,
    `constraint_bracket.${id}.target`,
    `constraint_bracket.${id}.residual`,
    `constraint_bracket.${id}.absolute_uncertainty95`,
  ]),
  "antisymmetry.forward",
  "antisymmetry.reverse",
  "antisymmetry.residual",
  "antisymmetry.absolute_uncertainty95",
  "jacobi.term_1",
  "jacobi.term_2",
  "jacobi.term_3",
  "jacobi.residual",
  "jacobi.absolute_uncertainty95",
  "regulator_level.0.residual",
  "regulator_level.0.absolute_uncertainty95",
  "regulator_level.1.residual",
  "regulator_level.1.absolute_uncertainty95",
  "regulator_level.2.residual",
  "regulator_level.2.absolute_uncertainty95",
]);

const LOCAL_REPLAY_METRIC_LEAF_IDS = Object.freeze([
  "metrics.inputContent.float64ArrayCount",
  "metrics.inputContent.float64ValueCount",
  "metrics.inputContent.allValuesFinite",
  "metrics.inputContent.allAbsoluteUncertaintiesNonnegative",
  "metrics.inputContent.buffersUniqueAndNonShared",
  "metrics.inputContent.arraysAreFullBufferViews",
  ...[
    "sampleCount",
    "covarianceDimension",
    "exchangeResidualUpper95SI",
    "exchangeToleranceSI",
    "exchangeSymmetryBasis",
    "symmetricTensorBasis",
    "covarianceSmearingMethod",
    "psdCertificateMethod",
    "psdInput",
    "psdCertificationDisposition",
    "psdDiagonalShiftSI",
    "psdResidualAllowanceSI",
    "minimumShiftedCholeskyPivotSI",
    "psdToleranceSI",
    "factorizationResidualInfinityNormUpperSI",
    "factorizationRoundoffModel",
    "maximumZeroPivotCouplingResidualSI",
    "negativeWitnessRayleighQuotientSI",
    "maximumGershgorinRadiusUpper95SI",
    "maximumEigenvalueUpper95SI",
    "covarianceTolerancePositiveSemidefiniteCertified",
  ].map((key) => `metrics.noise.${key}`),
  "metrics.mean.smearingWeightSum",
  ...Array.from(
    { length: 10 },
    (_, index) => `metrics.mean.smearedTensorComponentsSI[${index}]`,
  ),
  ...[
    "symmetricTensorFrobeniusSI",
    "normalizationFloorSI",
    "normalizationScaleSI",
    "fluctuationAmplitudeUpper95SI",
    "fluctuationToMeanRatioUpper95",
    "fluctuationRatioTolerance",
  ].map((key) => `metrics.mean.${key}`),
  ...[
    "minimumPointwiseSymmetricTensorFrobeniusSI",
    "argminPointIndex",
    "maximumPointwiseSymmetricTensorFrobeniusSI",
    "argmaxPointIndex",
    "minimumPointwiseSymmetricTensorFrobeniusLowerBoundSI",
    "argminLowerBoundPointIndex",
    "maximumPointwiseDeterministicErrorFrobeniusSI",
    "argmaxDeterministicErrorPointIndex",
    "minimumRequiredFrobeniusSI",
    "qualifyingSampleCount",
    "qualifyingSampleFraction",
    "requiredSampleFraction",
    "strictlyNondegenerate",
  ].map((key) => `metrics.metricDemand.${key}`),
  ...[
    "sampleCount",
    "relativeUpper95Tolerance",
    "requiredPassingSampleCount",
    "passingSampleCount",
    "maximumPointwiseRelativeUpper95",
    "argmaxPointIndex",
    "residualFrobeniusUpper95AtWorstPointSI",
    "metricDemandDeterministicErrorFrobeniusAtWorstPointSI",
    "metricDemandFrobeniusLowerBoundAtWorstPointSI",
    "denominatorAtWorstPointSI",
    "argmaxComponentIndex",
    "argmaxComponentContributionRelativeUpper95",
    "allSamplesWithinTolerance",
  ].map((key) => `metrics.meanMetricDemandClosure.${key}`),
  ...BRACKET_IDS.flatMap((id) =>
    RESIDUAL_METRIC_KEYS.map((key) => `metrics.brackets.${id}.${key}`),
  ),
  ...RESIDUAL_METRIC_KEYS.map((key) => `metrics.antisymmetry.${key}`),
  ...RESIDUAL_METRIC_KEYS.map((key) => `metrics.jacobi.${key}`),
  "metrics.regulator.levelCount",
  "metrics.regulator.spacing[0]",
  "metrics.regulator.spacing[1]",
  "metrics.regulator.residualUpper95ByLevel[0]",
  "metrics.regulator.residualUpper95ByLevel[1]",
  "metrics.regulator.residualUpper95ByLevel[2]",
  "metrics.regulator.observedOrders[0]",
  "metrics.regulator.observedOrders[1]",
  "metrics.regulator.minimumObservedOrder",
  "metrics.regulator.requiredMinimumOrder",
  "metrics.regulator.monotone",
  "metrics.regulator.finalResidualUpper95",
  "metrics.regulator.tolerance",
]);

const DESCRIPTOR_KEYS = [
  "role",
  "path",
  "sha256",
  "sizeBytes",
  "freshness",
  "observedAt",
  "dtype",
  "binaryEncoding",
  "endianness",
  "shape",
  "storageOrder",
  "componentOrder",
  "unit",
] as const;
const REPLAY_ROOT_KEYS = [
  "contractVersion",
  "calculationOnly",
  "serverOwned",
  "status",
  "inputBindings",
  "metrics",
  "issues",
  "blockers",
  "claimLocks",
] as const;
const REPLAY_INPUT_BINDING_KEYS = [
  "policyId",
  "candidateId",
  "geometrySha256",
  "quantumStateSha256",
  "chartId",
  "chartSha256",
  "normalizationId",
  "normalizationSha256",
  "sourceTensorProvenance",
  "declaredLeverTensorUsed",
  "manifestDeclaresFrozenBeforeExecution",
  "preexecutionFreezeVerified",
] as const;
const REPLAY_CLAIM_LOCK_KEYS = [
  "independentImplementationAgreementEstablished",
  "theoryGraphSemiclassicalLampsPromotable",
  "theoryClosureEstablished",
  "physicalViabilityEstablished",
  "propulsionEstablished",
  "transportEstablished",
  "routeEtaEstablished",
  "certifiedSpeedEstablished",
  "empiricalValidationEstablished",
] as const;
const SNAPSHOT_KEYS = [
  "completionState",
  "manifest",
  "manifestBinding",
  "outputSnapshot",
  "runReplay",
] as const;
const MANIFEST_BINDING_KEYS = [
  "bytes",
  "sha256",
  "sizeBytes",
  "mediaType",
  "relativePath",
  "observedAt",
] as const;
const SECURE_SNAPSHOT_KEYS = [
  "contractVersion",
  "readState",
  "runDirectoryRealPath",
  "aggregateSizeBytes",
  "files",
  "blockers",
  "claimBoundary",
] as const;
const SECURE_FILE_KEYS = [
  "relativePath",
  "absolutePath",
  "sha256",
  "sizeBytes",
  "bytes",
  "decoded",
  "filesystemIdentity",
] as const;
const FILESYSTEM_IDENTITY_KEYS = [
  "dev",
  "ino",
  "sizeBytes",
  "mtimeNs",
  "ctimeNs",
] as const;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const sameStrings = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

const sameStringSet = (
  left: readonly string[],
  right: readonly string[],
): boolean => sameStrings([...left].sort(), [...right].sort());

const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  isRecord(value) && sameStrings(Object.keys(value).sort(), [...keys].sort());

const canonicalNumber = (value: number): number =>
  Object.is(value, -0) ? 0 : value;

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const deepFreeze = <T>(value: T): T => {
  if (
    value == null ||
    typeof value !== "object" ||
    Buffer.isBuffer(value) ||
    Object.isFrozen(value)
  ) {
    return value;
  }
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
};

const isSharedArrayBufferBacked = (value: Buffer): boolean =>
  typeof SharedArrayBuffer !== "undefined" &&
  value.buffer instanceof SharedArrayBuffer;

const isDeepFrozenSnapshot = (
  value: unknown,
  seen = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (Buffer.isBuffer(value)) return !isSharedArrayBufferBacked(value);
  if (ArrayBuffer.isView(value)) return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (!Object.isFrozen(value)) return false;
  return Object.values(value as Record<string, unknown>).every((nested) =>
    isDeepFrozenSnapshot(nested, seen),
  );
};

const sha256 = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!isRecord(value)) throw new TypeError("canonical_json_value_invalid");
  return `{${Object.keys(value)
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    )
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
};

const portableRelative = (
  rootValue: unknown,
  pathValue: unknown,
): string | null => {
  if (typeof rootValue !== "string" || typeof pathValue !== "string")
    return null;
  const root = rootValue.replace(/\\/g, "/").replace(/\/+$/, "");
  const path = pathValue.replace(/\\/g, "/");
  if (root.length === 0 || path === root || !path.startsWith(`${root}/`)) {
    return null;
  }
  const relative = path.slice(root.length + 1);
  return relative.length > 0 ? relative : null;
};

const safeDescriptors = (
  manifest: Readonly<Nhm2SemiclassicalV2RawReplayManifestV1>,
): unknown[] => {
  try {
    return collectNhm2SemiclassicalV2RawReplayOutputArrays(
      manifest as Nhm2SemiclassicalV2RawReplayManifestV1,
    ) as unknown[];
  } catch {
    return [];
  }
};

type CapturedFile = Readonly<{
  relativePath: string;
  declaredSha256: string;
  recomputedSha256: string;
  declaredSizeBytes: bigint;
  bytes: Buffer;
  decodedKind: "bytes" | "float64_le";
  decodedShape: readonly number[] | null;
  filesystemIdentity: Readonly<{
    dev: string;
    ino: string;
    sizeBytes: string;
    mtimeNs: string;
    ctimeNs: string;
  }>;
}>;

type CapturedRun = Readonly<{
  descriptors: ReadonlyMap<string, Nhm2SemiclassicalV2RawReplayArrayV1>;
  files: ReadonlyMap<string, CapturedFile>;
  observedMetricLeaves: ReadonlyMap<string, unknown>;
}>;

const flattenLeaves = (
  value: unknown,
  path: string,
  output: Map<string, unknown>,
): void => {
  if (Array.isArray(value)) {
    if (value.length === 0) output.set(path, value);
    value.forEach((entry, index) =>
      flattenLeaves(entry, `${path}[${index}]`, output),
    );
    return;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) output.set(path, value);
    for (const [key, entry] of entries) {
      flattenLeaves(entry, path.length === 0 ? key : `${path}.${key}`, output);
    }
    return;
  }
  output.set(path, value);
};

const replayShapeExact = (replay: unknown): boolean => {
  if (
    !exactKeys(replay, REPLAY_ROOT_KEYS) ||
    !isRecord(replay) ||
    !exactKeys(replay.inputBindings, REPLAY_INPUT_BINDING_KEYS) ||
    !exactKeys(replay.claimLocks, REPLAY_CLAIM_LOCK_KEYS) ||
    !Array.isArray(replay.issues) ||
    !replay.issues.every((issue) =>
      exactKeys(issue, ["code", "disposition"]),
    ) ||
    !Array.isArray(replay.blockers)
  ) {
    return false;
  }
  return true;
};

const exactValue = (left: unknown, right: unknown): boolean => {
  if (typeof left === "number" || typeof right === "number") {
    return (
      typeof left === "number" &&
      typeof right === "number" &&
      Number.isFinite(left) &&
      Number.isFinite(right) &&
      Object.is(left, right)
    );
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((entry, index) => exactValue(entry, right[index]))
    );
  }
  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) return false;
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return (
      sameStrings(leftKeys, rightKeys) &&
      leftKeys.every((key) => exactValue(left[key], right[key]))
    );
  }
  return left === right;
};

const replayEnvelope = (
  replay: Nhm2SemiclassicalV2ContentReplayResult,
): unknown => ({
  contractVersion: replay.contractVersion,
  calculationOnly: replay.calculationOnly,
  serverOwned: replay.serverOwned,
  status: replay.status,
  inputBindings: replay.inputBindings,
  issues: replay.issues,
  blockers: replay.blockers,
  claimLocks: replay.claimLocks,
});

const descriptorMap = (
  snapshot: Nhm2SemiclassicalV2CompletedRunSnapshotV1,
  side: "primary" | "independent",
  blockers: string[],
): Map<string, Nhm2SemiclassicalV2RawReplayArrayV1> => {
  const output = new Map<string, Nhm2SemiclassicalV2RawReplayArrayV1>();
  const descriptors = safeDescriptors(snapshot.manifest);
  const roles: string[] = [];
  for (const [index, value] of descriptors.entries()) {
    if (!exactKeys(value, DESCRIPTOR_KEYS) || !isRecord(value)) {
      blockers.push(`${side}:raw_descriptor_shape_invalid:${index}`);
      continue;
    }
    const role =
      typeof value.role === "string" ? value.role : `invalid_role_${index}`;
    roles.push(role);
    if (output.has(role)) blockers.push(`${side}:duplicate_raw_role:${role}`);
    output.set(role, value as unknown as Nhm2SemiclassicalV2RawReplayArrayV1);
  }
  if (!sameStrings(roles, NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES)) {
    blockers.push(`${side}:exact_ordered_raw_role_inventory_required`);
  }
  return output;
};

const captureFiles = (
  snapshot: Nhm2SemiclassicalV2CompletedRunSnapshotV1,
  side: "primary" | "independent",
  blockers: string[],
): Map<string, CapturedFile> => {
  const output = new Map<string, CapturedFile>();
  const read = snapshot.outputSnapshot;
  if (
    !exactKeys(read, SECURE_SNAPSHOT_KEYS) ||
    read.contractVersion !== NHM2_SECURE_RUN_OUTPUT_READER_VERSION ||
    read.readState !== "bounded_bytes_read_authority_neutral" ||
    typeof read.runDirectoryRealPath !== "string" ||
    read.runDirectoryRealPath.length === 0 ||
    typeof read.aggregateSizeBytes !== "bigint" ||
    read.aggregateSizeBytes <= 0n ||
    !Array.isArray(read.files) ||
    !exactValue(
      read.blockers,
      NHM2_SECURE_RUN_OUTPUT_READER_AUTHORITY_BLOCKERS,
    ) ||
    !exactValue(
      read.claimBoundary,
      NHM2_SECURE_RUN_OUTPUT_READER_CLAIM_BOUNDARY,
    )
  ) {
    blockers.push(`${side}:secure_output_snapshot_invalid`);
    return output;
  }
  let aggregateSizeBytes = 0n;
  for (const [index, file] of read.files.entries()) {
    const decodedShape =
      isRecord(file.decoded) &&
      file.decoded.kind === "float64_le" &&
      exactKeys(file.decoded, ["kind", "shape", "finiteValuesVerified"]) &&
      file.decoded.finiteValuesVerified === true &&
      Array.isArray(file.decoded.shape) &&
      file.decoded.shape.every(
        (axis: unknown) => Number.isSafeInteger(axis) && Number(axis) > 0,
      )
        ? [...file.decoded.shape]
        : null;
    const decodedKind =
      isRecord(file.decoded) &&
      file.decoded.kind === "bytes" &&
      exactKeys(file.decoded, ["kind"])
        ? "bytes"
        : decodedShape != null
          ? "float64_le"
          : null;
    if (
      !exactKeys(file, SECURE_FILE_KEYS) ||
      typeof file.relativePath !== "string" ||
      file.relativePath.length === 0 ||
      typeof file.absolutePath !== "string" ||
      file.absolutePath.length === 0 ||
      typeof file.sha256 !== "string" ||
      !SHA256_PATTERN.test(file.sha256) ||
      typeof file.sizeBytes !== "bigint" ||
      file.sizeBytes <= 0n ||
      !Buffer.isBuffer(file.bytes) ||
      isSharedArrayBufferBacked(file.bytes) ||
      decodedKind == null ||
      !exactKeys(file.filesystemIdentity, FILESYSTEM_IDENTITY_KEYS)
    ) {
      blockers.push(`${side}:secure_output_file_invalid:${index}`);
      continue;
    }
    if (output.has(file.relativePath)) {
      blockers.push(
        `${side}:duplicate_secure_output_path:${file.relativePath}`,
      );
      continue;
    }
    // The secure reader deliberately exposes mutable Buffer instances. Copying
    // before hashing makes every later calculation operate on this invocation's
    // immutable byte snapshot rather than on caller-owned memory.
    const bytes = Buffer.from(file.bytes);
    aggregateSizeBytes += file.sizeBytes;
    output.set(file.relativePath, {
      relativePath: file.relativePath,
      declaredSha256: file.sha256,
      recomputedSha256: sha256(bytes),
      declaredSizeBytes: file.sizeBytes,
      bytes,
      decodedKind,
      decodedShape,
      filesystemIdentity: { ...file.filesystemIdentity },
    });
  }
  if (
    output.size !== read.files.length ||
    aggregateSizeBytes !== read.aggregateSizeBytes
  ) {
    blockers.push(
      `${side}:secure_output_snapshot_inventory_or_aggregate_invalid`,
    );
  }
  return output;
};

const MANIFEST_RECEIPT_MEDIA_TYPE = "application/json" as const;

const validateManifestBinding = (
  snapshot: Nhm2SemiclassicalV2CompletedRunSnapshotV1,
  files: ReadonlyMap<string, CapturedFile>,
  side: "primary" | "independent",
  blockers: string[],
): void => {
  const binding = snapshot.manifestBinding;
  if (
    !exactKeys(binding, MANIFEST_BINDING_KEYS) ||
    !Buffer.isBuffer(binding.bytes) ||
    isSharedArrayBufferBacked(binding.bytes) ||
    typeof binding.sha256 !== "string" ||
    !SHA256_PATTERN.test(binding.sha256) ||
    !Number.isSafeInteger(binding.sizeBytes) ||
    binding.sizeBytes <= 0 ||
    binding.mediaType !== MANIFEST_RECEIPT_MEDIA_TYPE ||
    typeof binding.relativePath !== "string" ||
    binding.relativePath.length === 0 ||
    typeof binding.observedAt !== "string" ||
    !Number.isFinite(Date.parse(binding.observedAt))
  ) {
    blockers.push(`${side}:manifest_binding_shape_invalid`);
    return;
  }
  const bytes = Buffer.from(binding.bytes);
  const manifestFile = files.get(binding.relativePath);
  let parsed: unknown = null;
  let canonical = false;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    parsed = JSON.parse(text) as unknown;
    canonical = canonicalJson(parsed) === text;
  } catch {
    canonical = false;
  }
  if (
    bytes.length !== binding.sizeBytes ||
    sha256(bytes) !== binding.sha256 ||
    !canonical ||
    !exactValue(parsed, snapshot.manifest) ||
    manifestFile == null ||
    manifestFile.decodedKind !== "bytes" ||
    manifestFile.declaredSha256 !== binding.sha256 ||
    manifestFile.recomputedSha256 !== binding.sha256 ||
    manifestFile.declaredSizeBytes !== BigInt(binding.sizeBytes) ||
    !manifestFile.bytes.equals(bytes)
  ) {
    blockers.push(`${side}:manifest_binding_or_secure_readback_mismatch`);
  }
};

const receiptClosureSha256 = (
  files: readonly Nhm2SemiclassicalV2RunReplayerFileReceipt[],
): string =>
  sha256(
    Buffer.from(
      `nhm2-semiclassical-v2-current-readback/v2\n${canonicalJson(
        [...files]
          .sort((left, right) =>
            Buffer.compare(
              Buffer.from(left.logicalPath),
              Buffer.from(right.logicalPath),
            ),
          )
          .map((file) => ({
            scope: file.scope,
            semanticId: file.semanticId,
            logicalPath: file.logicalPath,
            sha256: file.sha256,
            sizeBytes: file.sizeBytes,
            mediaType: file.mediaType,
            filesystemIdentity: file.filesystemIdentity,
          })),
      )}`,
      "utf8",
    ),
  );

const validateRunReplayBinding = (
  snapshot: Nhm2SemiclassicalV2CompletedRunSnapshotV1,
  descriptors: ReadonlyMap<string, Nhm2SemiclassicalV2RawReplayArrayV1>,
  files: ReadonlyMap<string, CapturedFile>,
  side: "primary" | "independent",
  blockers: string[],
): void => {
  const result = snapshot.runReplay;
  const manifest = snapshot.manifest;
  const binding = snapshot.manifestBinding;
  const replay = result?.replay;
  const provenance = result?.provenance;
  const replayDispositionValid =
    replay?.status === "pass"
      ? result?.calculationDisposition === "pass" &&
        result?.candidateDisposition === "single_run_replay_only" &&
        replay.issues.length === 0 &&
        replay.blockers.length === 0
      : replay?.status === "fail"
        ? result?.calculationDisposition === "fail" &&
          result?.candidateDisposition === "fail" &&
          replay.issues.length > 0 &&
          replay.issues.every((issue) => issue.disposition === "fail") &&
          exactValue(
            replay.blockers,
            replay.issues.map((issue) => issue.code),
          )
        : replay?.status === "blocked"
          ? result?.calculationDisposition === "blocked" &&
            result?.candidateDisposition === "blocked" &&
            replay.issues.length > 0 &&
            replay.issues.some((issue) => issue.disposition === "blocked") &&
            replay.issues.some(
              (issue) =>
                issue.code ===
                  "metric_demand_derivation_executor_provenance_unverified" &&
                issue.disposition === "blocked",
            ) &&
            replay.issues.some(
              (issue) =>
                issue.code === "interval_trace_not_server_replayed" &&
                issue.disposition === "blocked",
            ) &&
            exactValue(
              replay.blockers,
              replay.issues.map((issue) => issue.code),
            )
          : false;
  let valid =
    exactKeys(result, [
      "contractVersion",
      "serverOwned",
      "diagnosticOnly",
      "verificationState",
      "calculationDisposition",
      "candidateDisposition",
      "manifest",
      "provenance",
      "replay",
      "authorityState",
      "authorityBlockers",
      "claimLocks",
      "violations",
    ]) &&
    result.contractVersion ===
      NHM2_SEMICLASSICAL_V2_RUN_REPLAYER_CONTRACT_VERSION &&
    result.serverOwned === true &&
    result.diagnosticOnly === true &&
    result.verificationState === "bounded_filesystem_snapshots_replayed" &&
    replayDispositionValid &&
    Array.isArray(result.violations) &&
    result.violations.length === 0 &&
    exactKeys(result.manifest, [
      "relativePath",
      "sha256",
      "sizeBytes",
      "mediaType",
      "canonicalJsonVerified",
      "structuralContractVerified",
      "filesystemReadbackVerified",
    ]) &&
    result.manifest.relativePath === binding.relativePath &&
    result.manifest.sha256 === binding.sha256 &&
    result.manifest.sizeBytes === binding.sizeBytes &&
    result.manifest.mediaType === binding.mediaType &&
    result.manifest.canonicalJsonVerified === true &&
    result.manifest.structuralContractVerified === true &&
    result.manifest.filesystemReadbackVerified === true &&
    exactKeys(provenance, [
      "commitSha",
      "command",
      "argv",
      "workingDirectory",
      "startedAt",
      "completedAt",
      "durationMs",
      "manifestObservedAt",
      "scientificPresealBinding",
      "scientificPresealBindingStatus",
      "scientificClosureSha256",
      "completeClosureSha256",
      "files",
      "readbackClosureSha256",
    ]) &&
    provenance.commitSha === manifest.execution.commitSha &&
    provenance.command === manifest.execution.command &&
    exactValue(provenance.argv, manifest.execution.argv) &&
    provenance.workingDirectory === manifest.execution.workingDirectory &&
    provenance.startedAt === manifest.execution.startedAt &&
    provenance.completedAt === manifest.execution.completedAt &&
    provenance.durationMs === manifest.execution.durationMs &&
    provenance.manifestObservedAt === binding.observedAt &&
    exactValue(
      provenance.scientificPresealBinding,
      manifest.inputClosure.scientificPresealBinding,
    ) &&
    provenance.scientificPresealBindingStatus ===
      "producer_echo_matches_trusted_binding_not_persistence_receipt" &&
    provenance.scientificClosureSha256 ===
      manifest.inputClosure.scientificClosureSha256 &&
    provenance.completeClosureSha256 ===
      manifest.inputClosure.completeClosureSha256 &&
    Array.isArray(provenance.files) &&
    typeof provenance.readbackClosureSha256 === "string" &&
    receiptClosureSha256(provenance.files) === provenance.readbackClosureSha256;

  const entriesById = new Map(
    manifest.inputClosure.entries.map(
      (entry) => [entry.inputId, entry] as const,
    ),
  );
  const replayBindings = replay?.inputBindings;
  valid &&=
    replayShapeExact(replay) &&
    Object.isFrozen(replayBindings) &&
    replay.contractVersion ===
      NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_CONTRACT_VERSION &&
    replay.calculationOnly === true &&
    replay.serverOwned === true &&
    (replay.status === "pass" ||
      replay.status === "fail" ||
      replay.status === "blocked") &&
    replayBindings.policyId === manifest.candidate.tolerancePolicyId &&
    replayBindings.candidateId === manifest.candidate.candidateId &&
    replayBindings.geometrySha256 === entriesById.get("geometry")?.sha256 &&
    replayBindings.quantumStateSha256 ===
      entriesById.get("quantum_state")?.sha256 &&
    replayBindings.chartId === manifest.candidate.chartId &&
    replayBindings.chartSha256 === entriesById.get("chart")?.sha256 &&
    replayBindings.normalizationId === manifest.candidate.normalizationId &&
    replayBindings.normalizationSha256 ===
      entriesById.get("normalization")?.sha256 &&
    replayBindings.sourceTensorProvenance ===
      manifest.sourceProvenance.sourceMode &&
    replayBindings.declaredLeverTensorUsed === false &&
    replayBindings.manifestDeclaresFrozenBeforeExecution ===
      manifest.inputClosure.manifestDeclaresFrozenBeforeExecution &&
    replayBindings.preexecutionFreezeVerified === false;

  const receipts = Array.isArray(provenance?.files) ? provenance.files : [];
  const receiptByKey = new Map(
    receipts.map(
      (receipt) => [`${receipt.scope}:${receipt.semanticId}`, receipt] as const,
    ),
  );
  valid &&= receiptByKey.size === receipts.length;
  for (const entry of manifest.inputClosure.entries) {
    const scientific =
      portableRelative(
        manifest.inputClosure.scientificRootDirectory,
        entry.path,
      ) != null;
    const scope = scientific ? "scientific_input" : "implementation_input";
    const root = scientific
      ? manifest.inputClosure.scientificRootDirectory
      : manifest.inputClosure.implementationRootDirectory;
    const receipt = receiptByKey.get(`${scope}:${entry.inputId}`);
    valid &&=
      receipt != null &&
      receipt.logicalPath === entry.path &&
      receipt.relativePath === portableRelative(root, entry.path) &&
      receipt.sha256 === entry.sha256 &&
      receipt.sizeBytes === entry.sizeBytes &&
      receipt.mediaType === entry.mediaType &&
      receipt.encoding ===
        (entry.inputId === "metric_demand_tensor" ||
        entry.inputId === "metric_demand_absolute_error_bound"
          ? "raw_ieee754_float64_little_endian"
          : "bytes") &&
      receipt.freshness ===
        "snapshot_bytes_match_manifest_metadata_compatible_not_presealed";
  }
  for (const [role, descriptor] of descriptors) {
    const relative = portableRelative(
      manifest.execution.outputDirectory,
      descriptor.path,
    );
    const receipt = receiptByKey.get(`run_output:${role}`);
    const file = relative == null ? undefined : files.get(relative);
    valid &&=
      receipt != null &&
      file != null &&
      receipt.logicalPath === descriptor.path &&
      receipt.relativePath === relative &&
      receipt.sha256 === descriptor.sha256 &&
      receipt.sizeBytes === descriptor.sizeBytes &&
      receipt.mediaType === "application/vnd.nhm2.raw-float64-le" &&
      receipt.encoding === "raw_ieee754_float64_little_endian" &&
      receipt.freshness ===
        "created_or_modified_within_trusted_execution_interval" &&
      exactValue(receipt.filesystemIdentity, file.filesystemIdentity);
  }
  const manifestReceipt = receiptByKey.get("manifest:raw_replay_manifest");
  const manifestFile = files.get(binding.relativePath);
  valid &&=
    manifestReceipt != null &&
    manifestFile != null &&
    manifestReceipt.logicalPath ===
      `${manifest.execution.outputDirectory}/${binding.relativePath}` &&
    manifestReceipt.relativePath === binding.relativePath &&
    manifestReceipt.sha256 === binding.sha256 &&
    manifestReceipt.sizeBytes === binding.sizeBytes &&
    manifestReceipt.mediaType === "application/json" &&
    manifestReceipt.encoding === "bytes" &&
    manifestReceipt.freshness ===
      "created_or_modified_post_execution_before_observation" &&
    exactValue(
      manifestReceipt.filesystemIdentity,
      manifestFile.filesystemIdentity,
    );
  valid &&=
    receipts.length ===
    manifest.inputClosure.entries.length + descriptors.size + 1;

  if (!valid)
    blockers.push(`${side}:run_replay_manifest_science_binding_invalid`);
};

const captureRun = (
  snapshot: Nhm2SemiclassicalV2CompletedRunSnapshotV1,
  side: "primary" | "independent",
  blockers: string[],
): CapturedRun => {
  if (!exactKeys(snapshot, SNAPSHOT_KEYS)) {
    blockers.push(`${side}:completed_run_snapshot_shape_invalid`);
  }
  if (snapshot.completionState !== "completed") {
    blockers.push(`${side}:completed_run_snapshot_required`);
  }
  if (!isDeepFrozenSnapshot(snapshot)) {
    blockers.push(`${side}:deeply_immutable_server_snapshot_required`);
  }
  for (const violation of nhm2SemiclassicalV2RawReplayManifestViolations(
    snapshot.manifest,
  )) {
    blockers.push(`${side}:raw_manifest_invalid:${violation}`);
  }
  const expectedRole = side === "primary" ? "primary" : "independent";
  if (snapshot.manifest.implementation?.role !== expectedRole) {
    blockers.push(`${side}:implementation_role_invalid`);
  }
  const descriptors = descriptorMap(snapshot, side, blockers);
  const files = captureFiles(snapshot, side, blockers);
  validateManifestBinding(snapshot, files, side, blockers);
  validateRunReplayBinding(snapshot, descriptors, files, side, blockers);
  const expectedPaths = new Set<string>([
    snapshot.manifestBinding.relativePath,
  ]);
  for (const [role, descriptor] of descriptors) {
    const relative = portableRelative(
      snapshot.manifest.execution?.outputDirectory,
      descriptor.path,
    );
    if (relative == null) {
      blockers.push(`${side}:descriptor_output_path_invalid:${role}`);
      continue;
    }
    expectedPaths.add(relative);
    const file = files.get(relative);
    if (file == null || file.decodedKind !== "float64_le") {
      blockers.push(`${side}:raw_output_file_missing:${role}`);
    }
  }
  for (const path of files.keys()) {
    if (!expectedPaths.has(path))
      blockers.push(`${side}:extra_raw_output_file:${path}`);
  }
  const observedMetricLeaves = new Map<string, unknown>();
  const replay = snapshot.runReplay.replay;
  flattenLeaves(replay.metrics, "metrics", observedMetricLeaves);
  const envelopeShapeExact = replayShapeExact(replay);
  if (!envelopeShapeExact) {
    blockers.push(`${side}:content_replay_envelope_schema_drift`);
  } else if (
    replay.contractVersion !==
      NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_CONTRACT_VERSION ||
    replay.calculationOnly !== true ||
    replay.serverOwned !== true ||
    (replay.status !== "pass" &&
      replay.status !== "fail" &&
      replay.status !== "blocked") ||
    (replay.status === "pass" &&
      (replay.issues.length !== 0 || replay.blockers.length !== 0)) ||
    (replay.status === "fail" &&
      (replay.issues.length === 0 ||
        replay.issues.some((issue) => issue.disposition !== "fail") ||
        !exactValue(
          replay.blockers,
          replay.issues.map((issue) => issue.code),
        ))) ||
    (replay.status === "blocked" &&
      (replay.issues.length === 0 ||
        !replay.issues.some((issue) => issue.disposition === "blocked") ||
        !replay.issues.some(
          (issue) =>
            issue.code ===
              "metric_demand_derivation_executor_provenance_unverified" &&
            issue.disposition === "blocked",
        ) ||
        !replay.issues.some(
          (issue) =>
            issue.code === "interval_trace_not_server_replayed" &&
            issue.disposition === "blocked",
        ) ||
        !exactValue(
          replay.blockers,
          replay.issues.map((issue) => issue.code),
        ))) ||
    Object.values(replay.claimLocks).some((value) => value !== false)
  ) {
    blockers.push(
      `${side}:successful_authority_locked_content_replay_required`,
    );
  }
  if (replay.status === "blocked") {
    for (const issue of replay.issues) {
      if (issue.disposition === "blocked") {
        blockers.push(`${side}:${issue.code}`);
      }
    }
  }
  const observedIds = [...observedMetricLeaves.keys()];
  if (
    !sameStringSet(
      observedIds,
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS,
    )
  ) {
    blockers.push(`${side}:content_replay_metric_schema_drift`);
  }
  return { descriptors, files, observedMetricLeaves };
};

const descriptorChecks = (
  role: string,
  primary: Nhm2SemiclassicalV2RawReplayArrayV1 | undefined,
  independent: Nhm2SemiclassicalV2RawReplayArrayV1 | undefined,
) => ({
  role: primary?.role === role && independent?.role === role,
  shape:
    Array.isArray(primary?.shape) &&
    Array.isArray(independent?.shape) &&
    primary.shape.length === independent.shape.length &&
    primary.shape.every(
      (axis, index) =>
        Number.isSafeInteger(axis) &&
        axis > 0 &&
        axis === independent.shape[index],
    ),
  componentOrder:
    Array.isArray(primary?.componentOrder) &&
    Array.isArray(independent?.componentOrder) &&
    primary.componentOrder.every((entry) => typeof entry === "string") &&
    independent.componentOrder.every((entry) => typeof entry === "string") &&
    sameStrings(primary.componentOrder, independent.componentOrder),
  unit: primary?.unit === independent?.unit,
  dtype: primary?.dtype === "float64" && independent?.dtype === "float64",
  binaryEncoding:
    primary?.binaryEncoding === "raw_ieee754" &&
    independent?.binaryEncoding === "raw_ieee754",
  endianness:
    primary?.endianness === "little" && independent?.endianness === "little",
  storageOrder:
    primary?.storageOrder === "row-major" &&
    independent?.storageOrder === "row-major",
  sizeBytes: primary?.sizeBytes === independent?.sizeBytes,
});

const fileBindingMatches = (
  descriptor: Nhm2SemiclassicalV2RawReplayArrayV1 | undefined,
  file: CapturedFile | undefined,
): boolean => {
  if (
    descriptor == null ||
    file == null ||
    !Number.isSafeInteger(descriptor.sizeBytes) ||
    descriptor.sizeBytes <= 0 ||
    !Array.isArray(descriptor.shape) ||
    !descriptor.shape.every(
      (axis) => Number.isSafeInteger(axis) && Number(axis) > 0,
    ) ||
    file.decodedKind !== "float64_le" ||
    file.decodedShape == null
  ) {
    return false;
  }
  const valueCount = descriptor.shape.reduce(
    (product, axis) => product * axis,
    1,
  );
  const expectedSizeBytes = valueCount * 8;
  return (
    Number.isSafeInteger(valueCount) &&
    Number.isSafeInteger(expectedSizeBytes) &&
    expectedSizeBytes === descriptor.sizeBytes &&
    file.recomputedSha256 === file.declaredSha256 &&
    file.recomputedSha256 === descriptor.sha256 &&
    file.declaredSizeBytes === BigInt(descriptor.sizeBytes) &&
    file.bytes.length === descriptor.sizeBytes &&
    file.decodedShape.length === descriptor.shape.length &&
    file.decodedShape.every((axis, index) => axis === descriptor.shape[index])
  );
};

const emptyDelta = (): Nhm2SemiclassicalV2PairNumericDeltaSummaryV1 => ({
  decodableAsFiniteFloat64: false,
  valueCount: null,
  worstIndex: null,
  primaryValue: null,
  independentValue: null,
  maximumAbsoluteDelta: null,
  maximumRelativeDelta: null,
  relativeDenominator: null,
  deltaOverflowed: false,
});

const numericDelta = (
  primary: Buffer | undefined,
  independent: Buffer | undefined,
): Nhm2SemiclassicalV2PairNumericDeltaSummaryV1 => {
  if (
    primary == null ||
    independent == null ||
    primary.length !== independent.length ||
    primary.length === 0 ||
    primary.length % 8 !== 0
  ) {
    return emptyDelta();
  }
  const valueCount = primary.length / 8;
  let worstIndex = 0;
  let worstPrimary = 0;
  let worstIndependent = 0;
  let maximumAbsoluteDelta = -1;
  let maximumRelativeDelta = -1;
  let overflowed = false;
  for (let index = 0; index < valueCount; index += 1) {
    const offset = index * 8;
    const left = primary.readDoubleLE(offset);
    const right = independent.readDoubleLE(offset);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return emptyDelta();
    const rawAbsolute = Math.abs(right - left);
    const absolute = Number.isFinite(rawAbsolute)
      ? rawAbsolute
      : Number.MAX_VALUE;
    const denominator = Math.max(
      Math.abs(left),
      Math.abs(right),
      Number.MIN_VALUE,
    );
    const rawRelative = absolute / denominator;
    const relative = Number.isFinite(rawRelative)
      ? rawRelative
      : Number.MAX_VALUE;
    overflowed ||=
      !Number.isFinite(rawAbsolute) || !Number.isFinite(rawRelative);
    if (absolute > maximumAbsoluteDelta) {
      maximumAbsoluteDelta = absolute;
      worstIndex = index;
      worstPrimary = left;
      worstIndependent = right;
    }
    if (relative > maximumRelativeDelta) maximumRelativeDelta = relative;
  }
  return {
    decodableAsFiniteFloat64: true,
    valueCount,
    worstIndex,
    primaryValue: canonicalNumber(worstPrimary),
    independentValue: canonicalNumber(worstIndependent),
    maximumAbsoluteDelta: canonicalNumber(maximumAbsoluteDelta),
    maximumRelativeDelta: canonicalNumber(maximumRelativeDelta),
    relativeDenominator: "max_abs_primary_abs_independent_number_min_value",
    deltaOverflowed: overflowed,
  };
};

const leafKind = (value: unknown, present: boolean): ReplayLeafKind => {
  if (!present) return "missing";
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isFinite(value) ? "finite_number" : "nonfinite_number";
  }
  return "unsupported";
};

const publicLeafValue = (
  value: unknown,
  kind: ReplayLeafKind,
): ReplayScalar => {
  if (kind === "string" || kind === "boolean" || kind === "finite_number") {
    return value as string | boolean | number;
  }
  return null;
};

const INTEGER_METRIC_LEAF_IDS = new Set([
  "metrics.inputContent.float64ArrayCount",
  "metrics.inputContent.float64ValueCount",
  "metrics.noise.sampleCount",
  "metrics.noise.covarianceDimension",
  "metrics.metricDemand.argminPointIndex",
  "metrics.metricDemand.argmaxPointIndex",
  "metrics.metricDemand.argminLowerBoundPointIndex",
  "metrics.metricDemand.argmaxDeterministicErrorPointIndex",
  "metrics.metricDemand.qualifyingSampleCount",
  "metrics.meanMetricDemandClosure.sampleCount",
  "metrics.meanMetricDemandClosure.requiredPassingSampleCount",
  "metrics.meanMetricDemandClosure.passingSampleCount",
  "metrics.meanMetricDemandClosure.argmaxPointIndex",
  "metrics.meanMetricDemandClosure.argmaxComponentIndex",
  "metrics.regulator.levelCount",
]);

const leafMatchesFrozenKind = (
  value: unknown,
  kind: (typeof NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE)[number]["valueKind"],
  leafId: string,
): boolean => {
  if (kind === "boolean") return typeof value === "boolean";
  if (kind === "string") return typeof value === "string";
  if (kind === "nullable_string")
    return value === null || typeof value === "string";
  if (kind === "integer") {
    return (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0 &&
      INTEGER_METRIC_LEAF_IDS.has(leafId)
    );
  }
  if (kind === "number" || kind === "nullable_number") {
    if (value === null) return kind === "nullable_number";
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (!INTEGER_METRIC_LEAF_IDS.has(leafId) ||
        (Number.isSafeInteger(value) && value >= 0))
    );
  }
  // Fixed-size arrays are expanded before this comparator; these kinds are
  // retained in the shared type only for future contract versions.
  return false;
};

const compareReplayLeaves = (
  primary: ReadonlyMap<string, unknown>,
  independent: ReadonlyMap<string, unknown>,
  blockers: string[],
): Nhm2SemiclassicalV2PairReplayMetricCalculationV1[] =>
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map(
    (descriptor, ordinal) => {
      const metricLeafId = descriptor.leafId;
      const primaryPresent = primary.has(metricLeafId);
      const independentPresent = independent.has(metricLeafId);
      const primaryRaw = primary.get(metricLeafId);
      const independentRaw = independent.get(metricLeafId);
      const primaryKind = leafKind(primaryRaw, primaryPresent);
      const independentKind = leafKind(independentRaw, independentPresent);
      const invalid =
        [primaryKind, independentKind].some((kind) =>
          ["missing", "nonfinite_number", "unsupported"].includes(kind),
        ) ||
        !leafMatchesFrozenKind(
          primaryRaw,
          descriptor.valueKind,
          metricLeafId,
        ) ||
        !leafMatchesFrozenKind(
          independentRaw,
          descriptor.valueKind,
          metricLeafId,
        );
      if (invalid) blockers.push(`replay_metric_leaf_invalid:${metricLeafId}`);
      const valuesEqual =
        !invalid &&
        primaryKind === independentKind &&
        (primaryKind === "finite_number"
          ? Object.is(primaryRaw, independentRaw)
          : primaryRaw === independentRaw);
      const absoluteDelta =
        primaryKind === "finite_number" && independentKind === "finite_number"
          ? (() => {
              const delta = Math.abs(
                (independentRaw as number) - (primaryRaw as number),
              );
              if (!Number.isFinite(delta)) {
                blockers.push(`replay_metric_delta_overflow:${metricLeafId}`);
                return null;
              }
              return canonicalNumber(delta);
            })()
          : null;
      return {
        ordinal,
        metricLeafId,
        comparator: "exact_replay_leaf_equality" as const,
        primaryKind,
        independentKind,
        primaryValue: publicLeafValue(primaryRaw, primaryKind),
        independentValue: publicLeafValue(independentRaw, independentKind),
        absoluteDelta,
        valuesEqual,
        status: invalid
          ? ("blocked" as const)
          : valuesEqual
            ? ("pass" as const)
            : ("fail" as const),
      };
    },
  );

const contractPolicyAligned = (): boolean =>
  LOCAL_ARRAY_ROLES.length === 32 &&
  sameStrings(LOCAL_ARRAY_ROLES, NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES) &&
  LOCAL_REPLAY_METRIC_LEAF_IDS.length === 108 &&
  NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT === 108 &&
  sameStrings(
    LOCAL_REPLAY_METRIC_LEAF_IDS,
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS,
  ) &&
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.arrayComparator ===
    "strict_byte_equality" &&
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.defaultComparator ===
    "strict_byte_equality" &&
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.regulatorLevelCount === 3 &&
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.roleRules.length === 0 &&
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.retuningAfterLaunchPermitted ===
    false &&
  NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.replayMetricLeafCoverageSha256 ===
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256;

const replayMetricCoverageBase = () => ({
  metricLeafDescriptors:
    NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map((entry) => ({
      ...entry,
    })),
  metricLeafIds: [...NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS],
  metricLeafCount: NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
  coverageSha256: NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
  metricLeafIdsSha256: NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS_SHA256,
});

/**
 * Compares two already-completed, deeply immutable server snapshots. This
 * function performs no filesystem reads and grants no independence, lamp,
 * theory, experiment, or physical authority even when every byte is equal.
 */
export const compareNhm2SemiclassicalV2Pair = (
  input: Nhm2SemiclassicalV2PairComparatorInputV1,
): Nhm2SemiclassicalV2PairComparatorResultV1 => {
  const blockers: string[] = [];
  const issues: string[] = [];
  try {
    if (
      !exactKeys(input, ["primary", "independent"]) ||
      !Object.isFrozen(input)
    ) {
      blockers.push("deeply_immutable_exact_pair_input_required");
    }
    if (!contractPolicyAligned())
      blockers.push("pair_contract_policy_or_coverage_drift");
    if (!isRecord(input?.primary) || !isRecord(input?.independent)) {
      blockers.push("completed_pair_snapshots_required");
      return deepFreeze({
        contractVersion: NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION,
        policyId: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.policyId,
        policySha256: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY_SHA256,
        calculationOnly: true,
        serverOwned: true,
        contentReplayRecomputedByComparator: false,
        agreementProjectionAuthority: false,
        failureAgreementProjectionAuthority: false,
        status: "blocked",
        candidateDisposition: "indeterminate",
        candidateRetuningAuthorized: false,
        strictRawByteEqualityRequired: true,
        arrayRoleCoverage: {
          expectedCount: 32,
          comparedCount: 0,
          complete: false,
        },
        replayMetricCoverage: {
          ...replayMetricCoverageBase(),
          observedPrimaryLeafCount: 0,
          observedIndependentLeafCount: 0,
          primarySchemaExact: false,
          independentSchemaExact: false,
        },
        arrayComparisons: [],
        replayMetricComparisons: [],
        agreementProjection: null,
        failureAgreementProjection: null,
        replayEnvelopeExact: false,
        issues: [],
        blockers: unique(blockers),
        claimLocks: { ...CLAIM_LOCKS },
      });
    }

    const primary = captureRun(input.primary, "primary", blockers);
    const independent = captureRun(input.independent, "independent", blockers);
    for (const violation of nhm2SemiclassicalV2RawReplayManifestPairViolations(
      input.primary.manifest,
      input.independent.manifest,
    )) {
      blockers.push(`raw_manifest_pair_invalid:${violation}`);
    }
    if (
      input.primary.manifest.implementation.comparisonPairId !==
      input.independent.manifest.implementation.comparisonPairId
    ) {
      blockers.push("comparison_pair_id_mismatch");
    }

    const arrayComparisons = NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES.map(
      (role, ordinal): Nhm2SemiclassicalV2PairArrayCalculationV1 => {
        const primaryDescriptor = primary.descriptors.get(role);
        const independentDescriptor = independent.descriptors.get(role);
        const primaryRelative = primaryDescriptor
          ? portableRelative(
              input.primary.manifest.execution.outputDirectory,
              primaryDescriptor.path,
            )
          : null;
        const independentRelative = independentDescriptor
          ? portableRelative(
              input.independent.manifest.execution.outputDirectory,
              independentDescriptor.path,
            )
          : null;
        const primaryFile = primaryRelative
          ? primary.files.get(primaryRelative)
          : undefined;
        const independentFile = independentRelative
          ? independent.files.get(independentRelative)
          : undefined;
        const checks = descriptorChecks(
          role,
          primaryDescriptor,
          independentDescriptor,
        );
        const primaryHashMatched = fileBindingMatches(
          primaryDescriptor,
          primaryFile,
        );
        const independentHashMatched = fileBindingMatches(
          independentDescriptor,
          independentFile,
        );
        if (!primaryHashMatched)
          blockers.push(`primary:raw_output_binding_invalid:${role}`);
        if (!independentHashMatched)
          blockers.push(`independent:raw_output_binding_invalid:${role}`);
        const bytesEqual =
          primaryFile != null &&
          independentFile != null &&
          primaryFile.bytes.equals(independentFile.bytes);
        const numeric = numericDelta(
          primaryFile?.bytes,
          independentFile?.bytes,
        );
        if (!numeric.decodableAsFiniteFloat64) {
          blockers.push(`raw_output_nonfinite_or_undecodable:${role}`);
        }
        const descriptorsEqual = Object.values(checks).every(Boolean);
        if (!descriptorsEqual)
          issues.push(`raw_output_descriptor_mismatch:${role}`);
        if (!bytesEqual) issues.push(`raw_output_byte_mismatch:${role}`);
        const blocked =
          !primaryHashMatched ||
          !independentHashMatched ||
          !numeric.decodableAsFiniteFloat64;
        return {
          ordinal,
          arrayRole: role,
          comparator: "strict_byte_equality",
          primary: {
            sha256: primaryFile?.recomputedSha256 ?? null,
            sizeBytes: primaryFile?.bytes.length ?? null,
          },
          independent: {
            sha256: independentFile?.recomputedSha256 ?? null,
            sizeBytes: independentFile?.bytes.length ?? null,
          },
          descriptorChecks: checks,
          primaryBufferHashRecomputedAndMatched: primaryHashMatched,
          independentBufferHashRecomputedAndMatched: independentHashMatched,
          bytesEqual,
          numericDelta: numeric,
          status: blocked
            ? "blocked"
            : descriptorsEqual && bytesEqual
              ? "pass"
              : "fail",
        };
      },
    );

    const replayMetricComparisons = compareReplayLeaves(
      primary.observedMetricLeaves,
      independent.observedMetricLeaves,
      blockers,
    );
    for (const metric of replayMetricComparisons) {
      if (metric.status === "fail")
        issues.push(`content_replay_metric_mismatch:${metric.metricLeafId}`);
    }
    const replayEnvelopeExact = exactValue(
      replayEnvelope(input.primary.runReplay.replay),
      replayEnvelope(input.independent.runReplay.replay),
    );
    if (!replayEnvelopeExact) issues.push("content_replay_envelope_mismatch");

    const primarySchemaExact = sameStringSet(
      [...primary.observedMetricLeaves.keys()],
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS,
    );
    const independentSchemaExact = sameStringSet(
      [...independent.observedMetricLeaves.keys()],
      NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_IDS,
    );
    const finalBlockers = unique(blockers);
    const finalIssues = unique(issues);
    const allCalculationsPass =
      arrayComparisons.every((entry) => entry.status === "pass") &&
      replayMetricComparisons.every((entry) => entry.status === "pass") &&
      replayEnvelopeExact;
    const exactPairAgreement =
      finalBlockers.length === 0 && allCalculationsPass;
    const primaryReplayStatus = input.primary.runReplay.replay.status;
    const independentReplayStatus = input.independent.runReplay.replay.status;
    const passingAgreement =
      exactPairAgreement &&
      primaryReplayStatus === "pass" &&
      independentReplayStatus === "pass";
    const failureAgreement =
      exactPairAgreement &&
      primaryReplayStatus === "fail" &&
      independentReplayStatus === "fail";
    const status =
      finalBlockers.length > 0 ? "blocked" : passingAgreement ? "pass" : "fail";
    const candidateDisposition = passingAgreement
      ? "frozen_limits_passed"
      : failureAgreement
        ? "frozen_limits_failed"
        : "indeterminate";
    const projectedArrayComparisons = exactPairAgreement
      ? arrayComparisons.map(
          (entry): Nhm2SemiclassicalV2PairArrayComparisonV1 => ({
            ordinal: entry.ordinal,
            arrayRole: NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES[entry.ordinal],
            comparator: "strict_byte_equality",
            primary: {
              sha256: entry.primary.sha256!,
              sizeBytes: entry.primary.sizeBytes!,
            },
            independent: {
              sha256: entry.independent.sha256!,
              sizeBytes: entry.independent.sizeBytes!,
            },
            bytesEqual: true,
            status: "pass",
          }),
        )
      : null;
    const projectedReplayMetricCoverage = {
      ordering: "frozen_content_replay_leaf_order_v2" as const,
      leafDescriptors:
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map((entry) => ({
          ...entry,
        })),
      leafCount: NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COUNT,
      coverageSha256:
        NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE_SHA256,
    };
    const projectedReplayMetricComparisons = exactPairAgreement
      ? NHM2_SEMICLASSICAL_V2_PAIR_REPLAY_METRIC_LEAF_COVERAGE.map(
          (
            descriptor,
            ordinal,
          ): Nhm2SemiclassicalV2PairReplayMetricLeafComparisonV1 => {
            const value = primary.observedMetricLeaves.get(descriptor.leafId);
            const valueSha256 =
              computeNhm2SemiclassicalV2PairReplayMetricLeafCanonicalValueSha256(
                value as ReplayScalar,
              );
            return {
              ordinal,
              leafId: descriptor.leafId,
              valueKind: descriptor.valueKind,
              comparator: "canonical_json_value_equality",
              primaryCanonicalValueSha256: valueSha256,
              independentCanonicalValueSha256: valueSha256,
              valuesEqual: true,
              status: "pass",
            };
          },
        )
      : null;
    const agreementProjection =
      passingAgreement &&
      projectedArrayComparisons != null &&
      projectedReplayMetricComparisons != null
        ? {
            arrayComparisons: projectedArrayComparisons,
            replayMetricCoverage: projectedReplayMetricCoverage,
            replayMetricComparisons: projectedReplayMetricComparisons,
          }
        : null;
    const failureAgreementProjection =
      failureAgreement &&
      projectedArrayComparisons != null &&
      projectedReplayMetricComparisons != null
        ? {
            candidateDisposition:
              "frozen_candidate_failed_without_retuning" as const,
            sharedReplayStatus: "fail" as const,
            sharedIssueCodes: input.primary.runReplay.replay.issues.map(
              (issue) => issue.code,
            ),
            replayEnvelopeExact: true as const,
            arrayComparisons: projectedArrayComparisons,
            replayMetricCoverage: projectedReplayMetricCoverage,
            replayMetricComparisons: projectedReplayMetricComparisons,
            terminalFailureReceiptAuthority: false as const,
            retuningAuthorized: false as const,
          }
        : null;
    return deepFreeze({
      contractVersion: NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION,
      policyId: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.policyId,
      policySha256: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY_SHA256,
      calculationOnly: true,
      serverOwned: true,
      contentReplayRecomputedByComparator: false,
      agreementProjectionAuthority: false,
      failureAgreementProjectionAuthority: false,
      status,
      candidateDisposition,
      candidateRetuningAuthorized: false,
      strictRawByteEqualityRequired: true,
      arrayRoleCoverage: {
        expectedCount: NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES.length,
        comparedCount: arrayComparisons.length,
        complete:
          primary.descriptors.size ===
            NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES.length &&
          independent.descriptors.size ===
            NHM2_SEMICLASSICAL_V2_PAIR_ARRAY_ROLES.length,
      },
      replayMetricCoverage: {
        ...replayMetricCoverageBase(),
        observedPrimaryLeafCount: primary.observedMetricLeaves.size,
        observedIndependentLeafCount: independent.observedMetricLeaves.size,
        primarySchemaExact,
        independentSchemaExact,
      },
      arrayComparisons,
      replayMetricComparisons,
      agreementProjection,
      failureAgreementProjection,
      replayEnvelopeExact,
      issues: finalIssues,
      blockers: finalBlockers,
      claimLocks: { ...CLAIM_LOCKS },
    });
  } catch {
    return deepFreeze({
      contractVersion: NHM2_SEMICLASSICAL_V2_PAIR_COMPARATOR_CONTRACT_VERSION,
      policyId: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY.policyId,
      policySha256: NHM2_SEMICLASSICAL_V2_PAIR_AGREEMENT_POLICY_SHA256,
      calculationOnly: true,
      serverOwned: true,
      contentReplayRecomputedByComparator: false,
      agreementProjectionAuthority: false,
      failureAgreementProjectionAuthority: false,
      status: "blocked",
      candidateDisposition: "indeterminate",
      candidateRetuningAuthorized: false,
      strictRawByteEqualityRequired: true,
      arrayRoleCoverage: {
        expectedCount: 32,
        comparedCount: 0,
        complete: false,
      },
      replayMetricCoverage: {
        ...replayMetricCoverageBase(),
        observedPrimaryLeafCount: 0,
        observedIndependentLeafCount: 0,
        primarySchemaExact: false,
        independentSchemaExact: false,
      },
      arrayComparisons: [],
      replayMetricComparisons: [],
      agreementProjection: null,
      failureAgreementProjection: null,
      replayEnvelopeExact: false,
      issues: [],
      blockers: ["pair_comparator_input_unreadable"],
      claimLocks: { ...CLAIM_LOCKS },
    });
  }
};
