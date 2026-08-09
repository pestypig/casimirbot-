import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  type Nhm2SemiclassicalConstraintBracketId,
} from "../../../shared/contracts/nhm2-semiclassical-state-realizability.v2";

export const NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_content_replay/v1" as const;

export const NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_COMPONENT_COUNTS =
  Object.freeze({
    stressTensor: 10,
    noiseKernelComponentPairs: 100,
    constraint: 4,
  });

export const NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_MINIMUM_SAMPLE_COUNT =
  64 as const;

export type Nhm2SemiclassicalV2ContentReplayStatus =
  | "pass"
  | "fail"
  | "blocked";

export type Nhm2SemiclassicalV2ContentReplayPolicy = Readonly<{
  policyId: string;
  candidateId: string;
  geometrySha256: string;
  quantumStateSha256: string;
  chartId: string;
  chartSha256: string;
  normalizationId: string;
  normalizationSha256: string;
  sourceTensorProvenance: "state_derived_not_declared_lever";
  declaredLeverTensorUsed: false;
  frozenBeforeExecution: true;
  sampleCount: number;
  regulatorLevelCount: number;
  noisePsdToleranceSI: number;
  noiseExchangeToleranceSI: number;
  fluctuationRatioTolerance: number;
  meanNormalizationFloorSI: number;
  minimumMetricDemandFrobeniusSI: number;
  smearingWeightNormalizationTolerance: number;
  bracketResidualTolerance: number;
  antisymmetryResidualTolerance: number;
  jacobiResidualTolerance: number;
  regulatorFinalResidualTolerance: number;
  producerResidualConsistencyTolerance: number;
  regulatorMonotonicityTolerance: number;
  minimumRegulatorConvergenceOrder: number;
}>;

export type Nhm2SemiclassicalV2BracketBytes = Readonly<{
  computed: Float64Array;
  classicalTarget: Float64Array;
  producerResidual: Float64Array;
  absoluteUncertainty95: Float64Array;
}>;

export type Nhm2SemiclassicalV2IdentityBytes = Readonly<{
  producerResidual: Float64Array;
  absoluteUncertainty95: Float64Array;
}>;

export type Nhm2SemiclassicalV2ContentReplayInput = Readonly<{
  policy: Nhm2SemiclassicalV2ContentReplayPolicy;
  arrays: Readonly<{
    noiseKernel: Float64Array;
    noiseAbsoluteUncertainty95: Float64Array;
    meanStressTensor: Float64Array;
    metricDemandRset: Float64Array;
    meanSmearingWeights: Float64Array;
    brackets: Readonly<
      Record<
        Nhm2SemiclassicalConstraintBracketId,
        Nhm2SemiclassicalV2BracketBytes
      >
    >;
    antisymmetry: Nhm2SemiclassicalV2IdentityBytes &
      Readonly<{
        forward: Float64Array;
        reverse: Float64Array;
      }>;
    jacobi: Nhm2SemiclassicalV2IdentityBytes &
      Readonly<{
        first: Float64Array;
        second: Float64Array;
        third: Float64Array;
      }>;
    regulator: Readonly<{
      levels: readonly Readonly<{
        scale: number;
        residual: Float64Array;
        absoluteUncertainty95: Float64Array;
      }>[];
    }>;
  }>;
}>;

type BracketIssue =
  `bracket_${Nhm2SemiclassicalConstraintBracketId}_${
    | "computed_shape_invalid"
    | "target_shape_invalid"
    | "producer_residual_shape_invalid"
    | "uncertainty_shape_invalid"
    | "target_echo"
    | "producer_residual_mismatch"
    | "residual_upper95_exceeds_tolerance"}`;

export type Nhm2SemiclassicalV2ContentReplayIssueCode =
  | "input_not_object"
  | "input_keys_invalid"
  | "policy_not_object"
  | "policy_keys_invalid"
  | "policy_not_frozen"
  | "policy_identity_invalid"
  | "policy_hash_invalid"
  | "policy_candidate_not_frozen_before_execution"
  | "policy_declared_lever_tensor_forbidden"
  | "policy_sample_count_invalid"
  | "policy_regulator_level_count_invalid"
  | "policy_tolerance_invalid"
  | "arrays_not_object"
  | "arrays_keys_invalid"
  | "brackets_not_object"
  | "brackets_keys_invalid"
  | "identity_arrays_invalid"
  | "regulator_arrays_invalid"
  | "noise_kernel_shape_invalid"
  | "noise_uncertainty_shape_invalid"
  | "mean_stress_tensor_shape_invalid"
  | "metric_demand_rset_shape_invalid"
  | "mean_smearing_weights_shape_invalid"
  | "antisymmetry_forward_shape_invalid"
  | "antisymmetry_reverse_shape_invalid"
  | "antisymmetry_producer_residual_shape_invalid"
  | "antisymmetry_uncertainty_shape_invalid"
  | "jacobi_first_shape_invalid"
  | "jacobi_second_shape_invalid"
  | "jacobi_third_shape_invalid"
  | "jacobi_producer_residual_shape_invalid"
  | "jacobi_uncertainty_shape_invalid"
  | "regulator_levels_shape_invalid"
  | "regulator_residual_shape_invalid"
  | "regulator_uncertainty_shape_invalid"
  | "array_shared_buffer_forbidden"
  | "array_partial_view_forbidden"
  | "array_nonfinite"
  | "absolute_uncertainty_negative"
  | "smearing_weight_negative"
  | "smearing_weights_not_normalized"
  | "numeric_replay_overflow"
  | "noise_exchange_symmetry_exceeds_tolerance"
  | "noise_psd_negative_witness"
  | "noise_psd_numerically_inconclusive"
  | "fluctuation_ratio_exceeds_tolerance"
  | "metric_demand_degenerate"
  | "antisymmetry_producer_residual_mismatch"
  | "antisymmetry_residual_upper95_exceeds_tolerance"
  | "jacobi_producer_residual_mismatch"
  | "jacobi_residual_upper95_exceeds_tolerance"
  | "regulator_spacing_invalid"
  | "regulator_residual_invalid"
  | "regulator_not_monotone"
  | "regulator_convergence_order_undefined"
  | "regulator_convergence_order_below_minimum"
  | "regulator_final_residual_exceeds_tolerance"
  | BracketIssue;

export type Nhm2SemiclassicalV2ContentReplayIssue = Readonly<{
  code: Nhm2SemiclassicalV2ContentReplayIssueCode;
  disposition: "blocked" | "fail";
}>;

export type Nhm2SemiclassicalV2NoiseMetrics = Readonly<{
  sampleCount: number;
  covarianceDimension: number;
  exchangeResidualUpper95SI: number;
  exchangeToleranceSI: number;
  symmetricTensorBasis:
    "orthonormal_symmetric_tensor_sqrt_component_multiplicity";
  covarianceSmearingMethod:
    "diag_sqrt_point_weights_tensor_sqrt_component_multiplicity_bilateral";
  psdCertificateMethod:
    "central_symmetric_covariance_semidefinite_ldlt_zero_pivot_checked";
  psdInput: "central_symmetric_weighted_covariance";
  psdCertificationDisposition:
    | "certified"
    | "negative_witness"
    | "numerically_inconclusive";
  minimumLdltPivotSI: number;
  psdToleranceSI: number;
  factorizationResidualLInfSI: number | null;
  maximumZeroPivotRowResidualSI: number;
  negativeWitnessRayleighQuotientSI: number | null;
  maximumGershgorinRadiusUpper95SI: number;
  maximumEigenvalueUpper95SI: number;
  covariancePositiveSemidefiniteCertified: boolean;
}>;

export type Nhm2SemiclassicalV2MeanMetrics = Readonly<{
  smearingWeightSum: number;
  smearedTensorComponentsSI: readonly number[];
  symmetricTensorFrobeniusSI: number;
  normalizationFloorSI: number;
  normalizationScaleSI: number;
  fluctuationAmplitudeUpper95SI: number;
  fluctuationToMeanRatioUpper95: number;
  fluctuationRatioTolerance: number;
}>;

export type Nhm2SemiclassicalV2MetricDemandMetrics = Readonly<{
  maximumPointwiseSymmetricTensorFrobeniusSI: number;
  argmaxPointIndex: number;
  minimumRequiredFrobeniusSI: number;
  strictlyNondegenerate: boolean;
}>;

export type Nhm2SemiclassicalV2InputContentMetrics = Readonly<{
  float64ArrayCount: number;
  float64ValueCount: number;
  allValuesFinite: true;
  allAbsoluteUncertaintiesNonnegative: true;
  buffersUniqueAndNonShared: true;
  arraysAreFullBufferViews: true;
}>;

export type Nhm2SemiclassicalV2ResidualMetrics = Readonly<{
  residualLInf: number;
  absoluteUncertainty95: number;
  residualUpper95: number;
  producerResidualMismatchLInf: number;
  tolerance: number;
}>;

export type Nhm2SemiclassicalV2RegulatorMetrics = Readonly<{
  levelCount: number;
  spacing: readonly number[];
  residualUpper95ByLevel: readonly number[];
  observedOrders: readonly number[];
  minimumObservedOrder: number;
  requiredMinimumOrder: number;
  monotone: boolean;
  finalResidualUpper95: number;
  tolerance: number;
}>;

export type Nhm2SemiclassicalV2ContentReplayResult = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_CONTRACT_VERSION;
  calculationOnly: true;
  serverOwned: true;
  status: Nhm2SemiclassicalV2ContentReplayStatus;
  frozenBindings: Readonly<{
    policyId: string | null;
    candidateId: string | null;
    geometrySha256: string | null;
    quantumStateSha256: string | null;
    chartId: string | null;
    chartSha256: string | null;
    normalizationId: string | null;
    normalizationSha256: string | null;
    sourceTensorProvenance: "state_derived_not_declared_lever" | null;
    declaredLeverTensorUsed: false;
    frozenBeforeExecution: boolean;
  }>;
  metrics: Readonly<{
    inputContent: Nhm2SemiclassicalV2InputContentMetrics | null;
    noise: Nhm2SemiclassicalV2NoiseMetrics | null;
    mean: Nhm2SemiclassicalV2MeanMetrics | null;
    metricDemand: Nhm2SemiclassicalV2MetricDemandMetrics | null;
    brackets: Readonly<
      Partial<
        Record<
          Nhm2SemiclassicalConstraintBracketId,
          Nhm2SemiclassicalV2ResidualMetrics
        >
      >
    >;
    antisymmetry: Nhm2SemiclassicalV2ResidualMetrics | null;
    jacobi: Nhm2SemiclassicalV2ResidualMetrics | null;
    regulator: Nhm2SemiclassicalV2RegulatorMetrics | null;
  }>;
  issues: readonly Nhm2SemiclassicalV2ContentReplayIssue[];
  blockers: readonly Nhm2SemiclassicalV2ContentReplayIssueCode[];
  claimLocks: Readonly<{
    independentImplementationAgreementEstablished: false;
    theoryGraphSemiclassicalLampsPromotable: false;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    propulsionEstablished: false;
    transportEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
    empiricalValidationEstablished: false;
  }>;
}>;

type MutableReplayMetrics = {
  inputContent: Nhm2SemiclassicalV2InputContentMetrics | null;
  noise: Nhm2SemiclassicalV2NoiseMetrics | null;
  mean: Nhm2SemiclassicalV2MeanMetrics | null;
  metricDemand: Nhm2SemiclassicalV2MetricDemandMetrics | null;
  brackets: Partial<
    Record<
      Nhm2SemiclassicalConstraintBracketId,
      Nhm2SemiclassicalV2ResidualMetrics
    >
  >;
  antisymmetry: Nhm2SemiclassicalV2ResidualMetrics | null;
  jacobi: Nhm2SemiclassicalV2ResidualMetrics | null;
  regulator: Nhm2SemiclassicalV2RegulatorMetrics | null;
};

const CLAIM_LOCKS = Object.freeze({
  independentImplementationAgreementEstablished: false as const,
  theoryGraphSemiclassicalLampsPromotable: false as const,
  theoryClosureEstablished: false as const,
  physicalViabilityEstablished: false as const,
  propulsionEstablished: false as const,
  transportEstablished: false as const,
  routeEtaEstablished: false as const,
  certifiedSpeedEstablished: false as const,
  empiricalValidationEstablished: false as const,
});

const ROOT_KEYS = ["policy", "arrays"] as const;
const POLICY_KEYS = [
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
  "frozenBeforeExecution",
  "sampleCount",
  "regulatorLevelCount",
  "noisePsdToleranceSI",
  "noiseExchangeToleranceSI",
  "fluctuationRatioTolerance",
  "meanNormalizationFloorSI",
  "minimumMetricDemandFrobeniusSI",
  "smearingWeightNormalizationTolerance",
  "bracketResidualTolerance",
  "antisymmetryResidualTolerance",
  "jacobiResidualTolerance",
  "regulatorFinalResidualTolerance",
  "producerResidualConsistencyTolerance",
  "regulatorMonotonicityTolerance",
  "minimumRegulatorConvergenceOrder",
] as const;
const ARRAY_KEYS = [
  "noiseKernel",
  "noiseAbsoluteUncertainty95",
  "meanStressTensor",
  "metricDemandRset",
  "meanSmearingWeights",
  "brackets",
  "antisymmetry",
  "jacobi",
  "regulator",
] as const;
const BRACKET_VALUE_KEYS = [
  "computed",
  "classicalTarget",
  "producerResidual",
  "absoluteUncertainty95",
] as const;
const ANTISYMMETRY_KEYS = [
  "forward",
  "reverse",
  "producerResidual",
  "absoluteUncertainty95",
] as const;
const JACOBI_KEYS = [
  "first",
  "second",
  "third",
  "producerResidual",
  "absoluteUncertainty95",
] as const;
const REGULATOR_KEYS = ["levels"] as const;
const REGULATOR_LEVEL_KEYS = [
  "scale",
  "residual",
  "absoluteUncertainty95",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every(
      (entry: string, index: number) => entry === expected[index],
    )
  );
};

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

const isNonEmptyText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteNonnegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isFinitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const kahanSum = (values: Float64Array): number => {
  let sum = 0;
  let compensation = 0;
  for (const value of values) {
    const adjusted = value - compensation;
    const next = sum + adjusted;
    compensation = next - sum - adjusted;
    sum = next;
  }
  return sum;
};

const maxValue = (values: Float64Array): number => {
  let maximum = 0;
  for (const value of values) maximum = Math.max(maximum, value);
  return maximum;
};

const maxAbsPlusPointwiseUncertainty = (
  values: Float64Array,
  uncertainty: Float64Array,
): number => {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    maximum = Math.max(
      maximum,
      Math.abs(values[index]) + uncertainty[index],
    );
  }
  return maximum;
};

const arraysExactlyEqual = (
  left: Float64Array,
  right: Float64Array,
): boolean => {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (!Object.is(left[index], right[index]) && left[index] !== right[index])
      return false;
  }
  return true;
};

const nullableBindings = (): Nhm2SemiclassicalV2ContentReplayResult["frozenBindings"] => ({
  policyId: null,
  candidateId: null,
  geometrySha256: null,
  quantumStateSha256: null,
  chartId: null,
  chartSha256: null,
  normalizationId: null,
  normalizationSha256: null,
  sourceTensorProvenance: null,
  declaredLeverTensorUsed: false,
  frozenBeforeExecution: false,
});

const emptyMetrics = (): MutableReplayMetrics => ({
  inputContent: null,
  noise: null,
  mean: null,
  metricDemand: null,
  brackets: {},
  antisymmetry: null,
  jacobi: null,
  regulator: null,
});

const buildResult = (
  bindings: Nhm2SemiclassicalV2ContentReplayResult["frozenBindings"],
  metrics: Nhm2SemiclassicalV2ContentReplayResult["metrics"],
  issues: Nhm2SemiclassicalV2ContentReplayIssue[],
): Nhm2SemiclassicalV2ContentReplayResult => {
  const status: Nhm2SemiclassicalV2ContentReplayStatus = issues.some(
    (issue: Nhm2SemiclassicalV2ContentReplayIssue) =>
      issue.disposition === "blocked",
  )
    ? "blocked"
    : issues.length > 0
      ? "fail"
      : "pass";
  return {
    contractVersion: NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_CONTRACT_VERSION,
    calculationOnly: true,
    serverOwned: true,
    status,
    frozenBindings: bindings,
    metrics,
    issues,
    blockers: issues.map(
      (issue: Nhm2SemiclassicalV2ContentReplayIssue) => issue.code,
    ),
    claimLocks: CLAIM_LOCKS,
  };
};

type ArrayEntry = {
  id: string;
  value: unknown;
  expectedLength: number;
  shapeIssue: Nhm2SemiclassicalV2ContentReplayIssueCode;
  uncertainty: boolean;
};

const validateArrayEntries = (
  entries: readonly ArrayEntry[],
  issues: Nhm2SemiclassicalV2ContentReplayIssue[],
): boolean => {
  const buffers = new Set<ArrayBufferLike>();
  let valid = true;
  for (const entry of entries) {
    if (
      !(entry.value instanceof Float64Array) ||
      entry.value.length !== entry.expectedLength
    ) {
      issues.push({ code: entry.shapeIssue, disposition: "blocked" });
      valid = false;
      continue;
    }
    const array = entry.value;
    if (
      typeof SharedArrayBuffer !== "undefined" &&
      array.buffer instanceof SharedArrayBuffer
    ) {
      issues.push({
        code: "array_shared_buffer_forbidden",
        disposition: "blocked",
      });
      valid = false;
    }
    if (array.byteOffset !== 0 || array.byteLength !== array.buffer.byteLength) {
      issues.push({
        code: "array_partial_view_forbidden",
        disposition: "blocked",
      });
      valid = false;
    }
    if (buffers.has(array.buffer)) {
      issues.push({
        code: "array_shared_buffer_forbidden",
        disposition: "blocked",
      });
      valid = false;
    } else {
      buffers.add(array.buffer);
    }
    for (const value of array) {
      if (!Number.isFinite(value)) {
        issues.push({ code: "array_nonfinite", disposition: "blocked" });
        valid = false;
        break;
      }
      if (entry.uncertainty && value < 0) {
        issues.push({
          code: "absolute_uncertainty_negative",
          disposition: "blocked",
        });
        valid = false;
        break;
      }
    }
  }
  return valid;
};

const computeResidualMetrics = (
  terms: readonly Float64Array[],
  producerResidual: Float64Array,
  uncertainty: Float64Array,
  tolerance: number,
): Nhm2SemiclassicalV2ResidualMetrics => {
  let residualLInf = 0;
  let residualUpper95 = 0;
  let producerResidualMismatchLInf = 0;
  for (let index = 0; index < producerResidual.length; index += 1) {
    let residual = terms[0][index];
    for (let termIndex = 1; termIndex < terms.length; termIndex += 1) {
      residual += terms[termIndex][index];
    }
    residualLInf = Math.max(residualLInf, Math.abs(residual));
    residualUpper95 = Math.max(
      residualUpper95,
      Math.abs(residual) + uncertainty[index],
    );
    producerResidualMismatchLInf = Math.max(
      producerResidualMismatchLInf,
      Math.abs(producerResidual[index] - residual),
    );
  }
  const absoluteUncertainty95 = maxValue(uncertainty);
  return {
    residualLInf,
    absoluteUncertainty95,
    residualUpper95,
    producerResidualMismatchLInf,
    tolerance,
  };
};

const addIssue = (
  issues: Nhm2SemiclassicalV2ContentReplayIssue[],
  code: Nhm2SemiclassicalV2ContentReplayIssueCode,
  disposition: "blocked" | "fail",
): void => {
  if (
    !issues.some(
      (issue: Nhm2SemiclassicalV2ContentReplayIssue) => issue.code === code,
    )
  ) {
    issues.push({ code, disposition });
  }
};

type LdltFactorEntry = Readonly<{
  index: number;
  value: number;
}>;

type CentralPsdCertification = Readonly<{
  disposition:
    | "certified"
    | "negative_witness"
    | "numerically_inconclusive";
  minimumPivot: number;
  factorizationResidualLInf: number | null;
  maximumZeroPivotRowResidual: number;
  negativeWitnessRayleighQuotient: number | null;
}>;

const factorDot = (
  left: readonly LdltFactorEntry[],
  right: readonly LdltFactorEntry[],
  diagonal: Float64Array,
): number => {
  let leftIndex = 0;
  let rightIndex = 0;
  let sum = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    const leftEntry = left[leftIndex];
    const rightEntry = right[rightIndex];
    if (leftEntry.index === rightEntry.index) {
      sum +=
        leftEntry.value *
        diagonal[leftEntry.index] *
        rightEntry.value;
      leftIndex += 1;
      rightIndex += 1;
    } else if (leftEntry.index < rightEntry.index) {
      leftIndex += 1;
    } else {
      rightIndex += 1;
    }
  }
  return sum;
};

const certifyCentralCovariancePsd = (
  dimension: number,
  centralValue: (row: number, column: number) => number,
  tolerance: number,
): CentralPsdCertification => {
  const diagonal = new Float64Array(dimension);
  const factorRows: LdltFactorEntry[][] = Array.from(
    { length: dimension },
    () => [],
  );
  const factorMaps: Array<Map<number, number>> = Array.from(
    { length: dimension },
    () => new Map<number, number>(),
  );
  let minimumPivot = Number.POSITIVE_INFINITY;
  let maximumZeroPivotRowResidual = 0;

  for (let pivotIndex = 0; pivotIndex < dimension; pivotIndex += 1) {
    const pivot =
      centralValue(pivotIndex, pivotIndex) -
      factorDot(
        factorRows[pivotIndex],
        factorRows[pivotIndex],
        diagonal,
      );
    if (!Number.isFinite(pivot)) {
      return {
        disposition: "numerically_inconclusive",
        minimumPivot,
        factorizationResidualLInf: null,
        maximumZeroPivotRowResidual,
        negativeWitnessRayleighQuotient: null,
      };
    }
    minimumPivot = Math.min(minimumPivot, pivot);

    if (pivot < -tolerance) {
      const witness = new Float64Array(pivotIndex + 1);
      witness[pivotIndex] = 1;
      for (let column = pivotIndex - 1; column >= 0; column -= 1) {
        let upperProduct = 0;
        for (let row = column + 1; row <= pivotIndex; row += 1) {
          upperProduct +=
            (factorMaps[row].get(column) ?? 0) * witness[row];
        }
        witness[column] = -upperProduct;
      }
      let quadratic = 0;
      let normSquared = 0;
      for (let row = 0; row <= pivotIndex; row += 1) {
        normSquared += witness[row] * witness[row];
        for (let column = 0; column <= pivotIndex; column += 1) {
          quadratic +=
            witness[row] *
            centralValue(row, column) *
            witness[column];
        }
      }
      const rayleigh = quadratic / normSquared;
      return {
        disposition:
          Number.isFinite(rayleigh) && rayleigh < -tolerance
            ? "negative_witness"
            : "numerically_inconclusive",
        minimumPivot,
        factorizationResidualLInf: null,
        maximumZeroPivotRowResidual,
        negativeWitnessRayleighQuotient: Number.isFinite(rayleigh)
          ? rayleigh
          : null,
      };
    }

    if (Math.abs(pivot) <= tolerance) {
      diagonal[pivotIndex] = 0;
      let zeroPivotRowResidual = 0;
      for (let row = pivotIndex + 1; row < dimension; row += 1) {
        const residual =
          centralValue(row, pivotIndex) -
          factorDot(factorRows[row], factorRows[pivotIndex], diagonal);
        zeroPivotRowResidual = Math.max(
          zeroPivotRowResidual,
          Math.abs(residual),
        );
      }
      maximumZeroPivotRowResidual = Math.max(
        maximumZeroPivotRowResidual,
        zeroPivotRowResidual,
      );
      factorRows[pivotIndex].push({ index: pivotIndex, value: 1 });
      factorMaps[pivotIndex].set(pivotIndex, 1);
      if (zeroPivotRowResidual > tolerance) {
        return {
          disposition: "numerically_inconclusive",
          minimumPivot,
          factorizationResidualLInf: zeroPivotRowResidual,
          maximumZeroPivotRowResidual,
          negativeWitnessRayleighQuotient: null,
        };
      }
      continue;
    }

    diagonal[pivotIndex] = pivot;
    for (let row = pivotIndex + 1; row < dimension; row += 1) {
      const residual =
        centralValue(row, pivotIndex) -
        factorDot(factorRows[row], factorRows[pivotIndex], diagonal);
      const factor = residual / pivot;
      if (!Number.isFinite(factor)) {
        return {
          disposition: "numerically_inconclusive",
          minimumPivot,
          factorizationResidualLInf: null,
          maximumZeroPivotRowResidual,
          negativeWitnessRayleighQuotient: null,
        };
      }
      if (factor !== 0) {
        const entry = { index: pivotIndex, value: factor };
        factorRows[row].push(entry);
        factorMaps[row].set(pivotIndex, factor);
      }
    }
    factorRows[pivotIndex].push({ index: pivotIndex, value: 1 });
    factorMaps[pivotIndex].set(pivotIndex, 1);
  }

  let factorizationResidualLInf = 0;
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column <= row; column += 1) {
      factorizationResidualLInf = Math.max(
        factorizationResidualLInf,
        Math.abs(
          centralValue(row, column) -
            factorDot(factorRows[row], factorRows[column], diagonal),
        ),
      );
    }
  }
  return {
    disposition:
      Number.isFinite(factorizationResidualLInf) &&
      factorizationResidualLInf <= tolerance
        ? "certified"
        : "numerically_inconclusive",
    minimumPivot,
    factorizationResidualLInf,
    maximumZeroPivotRowResidual,
    negativeWitnessRayleighQuotient: null,
  };
};

/**
 * Replays already-copied Float64 content only. This kernel intentionally has no
 * filesystem, process, manifest, or producer access. A separate verifier must
 * establish byte hashes, freshness, run provenance, and independent-solver
 * isolation before consuming a passing calculation.
 */
export const replayNhm2SemiclassicalV2Content = (
  input: unknown,
): Nhm2SemiclassicalV2ContentReplayResult => {
  const issues: Nhm2SemiclassicalV2ContentReplayIssue[] = [];
  const metrics = emptyMetrics();
  let bindings = nullableBindings();

  if (!isRecord(input)) {
    addIssue(issues, "input_not_object", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (!hasExactKeys(input, ROOT_KEYS)) {
    addIssue(issues, "input_keys_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (!isRecord(input.policy)) {
    addIssue(issues, "policy_not_object", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  const rawPolicy = input.policy;
  if (!hasExactKeys(rawPolicy, POLICY_KEYS)) {
    addIssue(issues, "policy_keys_invalid", "blocked");
  }
  if (!Object.isFrozen(rawPolicy)) {
    addIssue(issues, "policy_not_frozen", "blocked");
  }
  const textIdentities = [
    rawPolicy.policyId,
    rawPolicy.candidateId,
    rawPolicy.chartId,
    rawPolicy.normalizationId,
  ];
  if (!textIdentities.every(isNonEmptyText)) {
    addIssue(issues, "policy_identity_invalid", "blocked");
  }
  const hashes = [
    rawPolicy.geometrySha256,
    rawPolicy.quantumStateSha256,
    rawPolicy.chartSha256,
    rawPolicy.normalizationSha256,
  ];
  if (!hashes.every(isSha256)) {
    addIssue(issues, "policy_hash_invalid", "blocked");
  }
  if (rawPolicy.frozenBeforeExecution !== true) {
    addIssue(
      issues,
      "policy_candidate_not_frozen_before_execution",
      "blocked",
    );
  }
  if (
    rawPolicy.sourceTensorProvenance !==
      "state_derived_not_declared_lever" ||
    rawPolicy.declaredLeverTensorUsed !== false
  ) {
    addIssue(issues, "policy_declared_lever_tensor_forbidden", "blocked");
  }
  if (
    !Number.isSafeInteger(rawPolicy.sampleCount) ||
    (rawPolicy.sampleCount as number) <
      NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_MINIMUM_SAMPLE_COUNT
  ) {
    addIssue(issues, "policy_sample_count_invalid", "blocked");
  }
  if (
    !Number.isSafeInteger(rawPolicy.regulatorLevelCount) ||
    (rawPolicy.regulatorLevelCount as number) < 3
  ) {
    addIssue(issues, "policy_regulator_level_count_invalid", "blocked");
  }
  const nonnegativeTolerances = [
    rawPolicy.noisePsdToleranceSI,
    rawPolicy.smearingWeightNormalizationTolerance,
    rawPolicy.producerResidualConsistencyTolerance,
    rawPolicy.regulatorMonotonicityTolerance,
  ];
  const positiveTolerances = [
    rawPolicy.noiseExchangeToleranceSI,
    rawPolicy.fluctuationRatioTolerance,
    rawPolicy.meanNormalizationFloorSI,
    rawPolicy.minimumMetricDemandFrobeniusSI,
    rawPolicy.bracketResidualTolerance,
    rawPolicy.antisymmetryResidualTolerance,
    rawPolicy.jacobiResidualTolerance,
    rawPolicy.regulatorFinalResidualTolerance,
    rawPolicy.minimumRegulatorConvergenceOrder,
  ];
  if (
    !nonnegativeTolerances.every(isFiniteNonnegative) ||
    !positiveTolerances.every(isFinitePositive)
  ) {
    addIssue(issues, "policy_tolerance_invalid", "blocked");
  }

  bindings = {
    policyId: isNonEmptyText(rawPolicy.policyId) ? rawPolicy.policyId : null,
    candidateId: isNonEmptyText(rawPolicy.candidateId)
      ? rawPolicy.candidateId
      : null,
    geometrySha256: isSha256(rawPolicy.geometrySha256)
      ? rawPolicy.geometrySha256
      : null,
    quantumStateSha256: isSha256(rawPolicy.quantumStateSha256)
      ? rawPolicy.quantumStateSha256
      : null,
    chartId: isNonEmptyText(rawPolicy.chartId) ? rawPolicy.chartId : null,
    chartSha256: isSha256(rawPolicy.chartSha256)
      ? rawPolicy.chartSha256
      : null,
    normalizationId: isNonEmptyText(rawPolicy.normalizationId)
      ? rawPolicy.normalizationId
      : null,
    normalizationSha256: isSha256(rawPolicy.normalizationSha256)
      ? rawPolicy.normalizationSha256
      : null,
    sourceTensorProvenance:
      rawPolicy.sourceTensorProvenance ===
      "state_derived_not_declared_lever"
        ? rawPolicy.sourceTensorProvenance
        : null,
    declaredLeverTensorUsed: false,
    frozenBeforeExecution: rawPolicy.frozenBeforeExecution === true,
  };

  if (issues.length > 0) return buildResult(bindings, metrics, issues);
  const policy = rawPolicy as unknown as Nhm2SemiclassicalV2ContentReplayPolicy;

  if (!isRecord(input.arrays)) {
    addIssue(issues, "arrays_not_object", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  const rawArrays = input.arrays;
  if (!hasExactKeys(rawArrays, ARRAY_KEYS)) {
    addIssue(issues, "arrays_keys_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (!isRecord(rawArrays.brackets)) {
    addIssue(issues, "brackets_not_object", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (
    !hasExactKeys(
      rawArrays.brackets,
      NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
    )
  ) {
    addIssue(issues, "brackets_keys_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (
    !isRecord(rawArrays.antisymmetry) ||
    !hasExactKeys(rawArrays.antisymmetry, ANTISYMMETRY_KEYS) ||
    !isRecord(rawArrays.jacobi) ||
    !hasExactKeys(rawArrays.jacobi, JACOBI_KEYS)
  ) {
    addIssue(issues, "identity_arrays_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (
    !isRecord(rawArrays.regulator) ||
    !hasExactKeys(rawArrays.regulator, REGULATOR_KEYS)
  ) {
    addIssue(issues, "regulator_arrays_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  if (
    !Array.isArray(rawArrays.regulator.levels) ||
    rawArrays.regulator.levels.length !== policy.regulatorLevelCount ||
    rawArrays.regulator.levels.some(
      (level: unknown) =>
        !isRecord(level) || !hasExactKeys(level, REGULATOR_LEVEL_KEYS),
    )
  ) {
    addIssue(issues, "regulator_levels_shape_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }

  const sampleCount = policy.sampleCount;
  const constraintLength =
    sampleCount *
    NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_COMPONENT_COUNTS.constraint;
  const noiseLength =
    sampleCount *
    sampleCount *
    NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_COMPONENT_COUNTS.noiseKernelComponentPairs;
  const meanLength =
    sampleCount *
    NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_COMPONENT_COUNTS.stressTensor;
  if (
    !Number.isSafeInteger(constraintLength) ||
    !Number.isSafeInteger(noiseLength) ||
    !Number.isSafeInteger(meanLength)
  ) {
    addIssue(issues, "policy_sample_count_invalid", "blocked");
    return buildResult(bindings, metrics, issues);
  }

  const entries: ArrayEntry[] = [
    {
      id: "noiseKernel",
      value: rawArrays.noiseKernel,
      expectedLength: noiseLength,
      shapeIssue: "noise_kernel_shape_invalid",
      uncertainty: false,
    },
    {
      id: "noiseAbsoluteUncertainty95",
      value: rawArrays.noiseAbsoluteUncertainty95,
      expectedLength: noiseLength,
      shapeIssue: "noise_uncertainty_shape_invalid",
      uncertainty: true,
    },
    {
      id: "meanStressTensor",
      value: rawArrays.meanStressTensor,
      expectedLength: meanLength,
      shapeIssue: "mean_stress_tensor_shape_invalid",
      uncertainty: false,
    },
    {
      id: "metricDemandRset",
      value: rawArrays.metricDemandRset,
      expectedLength: meanLength,
      shapeIssue: "metric_demand_rset_shape_invalid",
      uncertainty: false,
    },
    {
      id: "meanSmearingWeights",
      value: rawArrays.meanSmearingWeights,
      expectedLength: sampleCount,
      shapeIssue: "mean_smearing_weights_shape_invalid",
      uncertainty: false,
    },
  ];

  for (const bracketId of NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS) {
    const bracket = rawArrays.brackets[bracketId];
    if (!isRecord(bracket) || !hasExactKeys(bracket, BRACKET_VALUE_KEYS)) {
      addIssue(issues, "brackets_keys_invalid", "blocked");
      continue;
    }
    entries.push(
      {
        id: `${bracketId}.computed`,
        value: bracket.computed,
        expectedLength: constraintLength,
        shapeIssue: `bracket_${bracketId}_computed_shape_invalid`,
        uncertainty: false,
      },
      {
        id: `${bracketId}.target`,
        value: bracket.classicalTarget,
        expectedLength: constraintLength,
        shapeIssue: `bracket_${bracketId}_target_shape_invalid`,
        uncertainty: false,
      },
      {
        id: `${bracketId}.producerResidual`,
        value: bracket.producerResidual,
        expectedLength: constraintLength,
        shapeIssue: `bracket_${bracketId}_producer_residual_shape_invalid`,
        uncertainty: false,
      },
      {
        id: `${bracketId}.absoluteUncertainty95`,
        value: bracket.absoluteUncertainty95,
        expectedLength: constraintLength,
        shapeIssue: `bracket_${bracketId}_uncertainty_shape_invalid`,
        uncertainty: true,
      },
    );
  }

  entries.push(
    {
      id: "antisymmetry.forward",
      value: rawArrays.antisymmetry.forward,
      expectedLength: constraintLength,
      shapeIssue: "antisymmetry_forward_shape_invalid",
      uncertainty: false,
    },
    {
      id: "antisymmetry.reverse",
      value: rawArrays.antisymmetry.reverse,
      expectedLength: constraintLength,
      shapeIssue: "antisymmetry_reverse_shape_invalid",
      uncertainty: false,
    },
    {
      id: "antisymmetry.producerResidual",
      value: rawArrays.antisymmetry.producerResidual,
      expectedLength: constraintLength,
      shapeIssue: "antisymmetry_producer_residual_shape_invalid",
      uncertainty: false,
    },
    {
      id: "antisymmetry.absoluteUncertainty95",
      value: rawArrays.antisymmetry.absoluteUncertainty95,
      expectedLength: constraintLength,
      shapeIssue: "antisymmetry_uncertainty_shape_invalid",
      uncertainty: true,
    },
    {
      id: "jacobi.first",
      value: rawArrays.jacobi.first,
      expectedLength: constraintLength,
      shapeIssue: "jacobi_first_shape_invalid",
      uncertainty: false,
    },
    {
      id: "jacobi.second",
      value: rawArrays.jacobi.second,
      expectedLength: constraintLength,
      shapeIssue: "jacobi_second_shape_invalid",
      uncertainty: false,
    },
    {
      id: "jacobi.third",
      value: rawArrays.jacobi.third,
      expectedLength: constraintLength,
      shapeIssue: "jacobi_third_shape_invalid",
      uncertainty: false,
    },
    {
      id: "jacobi.producerResidual",
      value: rawArrays.jacobi.producerResidual,
      expectedLength: constraintLength,
      shapeIssue: "jacobi_producer_residual_shape_invalid",
      uncertainty: false,
    },
    {
      id: "jacobi.absoluteUncertainty95",
      value: rawArrays.jacobi.absoluteUncertainty95,
      expectedLength: constraintLength,
      shapeIssue: "jacobi_uncertainty_shape_invalid",
      uncertainty: true,
    },
  );

  const rawRegulatorLevels = rawArrays.regulator.levels as Array<{
    scale: unknown;
    residual: unknown;
    absoluteUncertainty95: unknown;
  }>;
  for (const [levelIndex, level] of rawRegulatorLevels.entries()) {
    entries.push(
      {
        id: `regulator.levels.${levelIndex}.residual`,
        value: level.residual,
        expectedLength: constraintLength,
        shapeIssue: "regulator_residual_shape_invalid",
        uncertainty: false,
      },
      {
        id: `regulator.levels.${levelIndex}.absoluteUncertainty95`,
        value: level.absoluteUncertainty95,
        expectedLength: constraintLength,
        shapeIssue: "regulator_uncertainty_shape_invalid",
        uncertainty: true,
      },
    );
  }

  if (!validateArrayEntries(entries, issues)) {
    return buildResult(bindings, metrics, issues);
  }
  metrics.inputContent = {
    float64ArrayCount: entries.length,
    float64ValueCount: entries.reduce(
      (sum: number, entry: ArrayEntry) =>
        sum + (entry.value as Float64Array).length,
      0,
    ),
    allValuesFinite: true,
    allAbsoluteUncertaintiesNonnegative: true,
    buffersUniqueAndNonShared: true,
    arraysAreFullBufferViews: true,
  };
  const arrays = rawArrays as unknown as Nhm2SemiclassicalV2ContentReplayInput["arrays"];

  for (const weight of arrays.meanSmearingWeights) {
    if (weight < 0) addIssue(issues, "smearing_weight_negative", "blocked");
  }
  const weightSum = kahanSum(arrays.meanSmearingWeights);
  if (
    Math.abs(weightSum - 1) > policy.smearingWeightNormalizationTolerance
  ) {
    addIssue(issues, "smearing_weights_not_normalized", "blocked");
  }
  if (issues.length > 0) return buildResult(bindings, metrics, issues);

  const tensorComponents =
    NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_COMPONENT_COUNTS.stressTensor;
  const multiplicities = [1, 2, 2, 2, 1, 2, 2, 1, 2, 1] as const;
  let maximumPointwiseSymmetricTensorFrobeniusSI = 0;
  let metricDemandArgmaxPointIndex = 0;
  for (let point = 0; point < sampleCount; point += 1) {
    const pointwiseFrobenius = Math.hypot(
      ...multiplicities.map(
        (multiplicity: number, component: number) =>
          arrays.metricDemandRset[point * tensorComponents + component] *
          Math.sqrt(multiplicity),
      ),
    );
    if (!Number.isFinite(pointwiseFrobenius)) {
      addIssue(issues, "numeric_replay_overflow", "blocked");
      return buildResult(bindings, metrics, issues);
    }
    if (pointwiseFrobenius > maximumPointwiseSymmetricTensorFrobeniusSI) {
      maximumPointwiseSymmetricTensorFrobeniusSI = pointwiseFrobenius;
      metricDemandArgmaxPointIndex = point;
    }
  }
  const metricDemandStrictlyNondegenerate =
    maximumPointwiseSymmetricTensorFrobeniusSI >
    policy.minimumMetricDemandFrobeniusSI;
  metrics.metricDemand = {
    maximumPointwiseSymmetricTensorFrobeniusSI,
    argmaxPointIndex: metricDemandArgmaxPointIndex,
    minimumRequiredFrobeniusSI: policy.minimumMetricDemandFrobeniusSI,
    strictlyNondegenerate: metricDemandStrictlyNondegenerate,
  };
  if (!metricDemandStrictlyNondegenerate) {
    addIssue(issues, "metric_demand_degenerate", "fail");
  }
  const covarianceDimension = sampleCount * tensorComponents;
  const noiseOffset = (matrixRow: number, matrixColumn: number): number => {
    const leftPoint = Math.floor(matrixRow / tensorComponents);
    const leftComponent = matrixRow % tensorComponents;
    const rightPoint = Math.floor(matrixColumn / tensorComponents);
    const rightComponent = matrixColumn % tensorComponents;
    return (
      (leftPoint * sampleCount + rightPoint) *
        NHM2_SEMICLASSICAL_V2_CONTENT_REPLAY_COMPONENT_COUNTS.noiseKernelComponentPairs +
      leftComponent * tensorComponents +
      rightComponent
    );
  };

  const matrixPoint = (matrixIndex: number): number =>
    Math.floor(matrixIndex / tensorComponents);
  const matrixComponent = (matrixIndex: number): number =>
    matrixIndex % tensorComponents;
  const basisScale = (row: number, column: number): number =>
    Math.sqrt(
      arrays.meanSmearingWeights[matrixPoint(row)] *
        multiplicities[matrixComponent(row)] *
        arrays.meanSmearingWeights[matrixPoint(column)] *
        multiplicities[matrixComponent(column)],
    );
  const centralCovarianceValue = (row: number, column: number): number => {
    const offset = noiseOffset(row, column);
    const transposeOffset = noiseOffset(column, row);
    return (
      0.5 *
      (arrays.noiseKernel[offset] +
        arrays.noiseKernel[transposeOffset]) *
      basisScale(row, column)
    );
  };

  let exchangeResidualUpper95SI = 0;
  let maximumGershgorinRadiusUpper95SI = 0;
  let maximumEigenvalueUpper95SI = Number.NEGATIVE_INFINITY;
  for (let row = 0; row < covarianceDimension; row += 1) {
    const diagonalOffset = noiseOffset(row, row);
    const diagonalScale = basisScale(row, row);
    const diagonal =
      arrays.noiseKernel[diagonalOffset] * diagonalScale;
    const diagonalUncertainty =
      arrays.noiseAbsoluteUncertainty95[diagonalOffset] * diagonalScale;
    let offDiagonalRadiusUpper95 = 0;
    for (let column = 0; column < covarianceDimension; column += 1) {
      const offset = noiseOffset(row, column);
      const transposeOffset = noiseOffset(column, row);
      const value = arrays.noiseKernel[offset];
      const transposeValue = arrays.noiseKernel[transposeOffset];
      const uncertainty = arrays.noiseAbsoluteUncertainty95[offset];
      const transposeUncertainty =
        arrays.noiseAbsoluteUncertainty95[transposeOffset];
      const pairBasisScale = basisScale(row, column);
      const exchangeUpper95 =
        offset === transposeOffset
          ? 0
          : (Math.abs(value - transposeValue) +
              uncertainty +
              transposeUncertainty) *
            pairBasisScale;
      exchangeResidualUpper95SI = Math.max(
        exchangeResidualUpper95SI,
        exchangeUpper95,
      );
      if (column === row) continue;
      const symmetricMidpoint =
        0.5 * (value + transposeValue) * pairBasisScale;
      const intervalRadius =
        0.5 *
        (uncertainty +
          transposeUncertainty +
          Math.abs(value - transposeValue)) *
        pairBasisScale;
      offDiagonalRadiusUpper95 +=
        Math.abs(symmetricMidpoint) + intervalRadius;
    }
    const upper =
      diagonal + diagonalUncertainty + offDiagonalRadiusUpper95;
    maximumGershgorinRadiusUpper95SI = Math.max(
      maximumGershgorinRadiusUpper95SI,
      offDiagonalRadiusUpper95,
    );
    maximumEigenvalueUpper95SI = Math.max(
      maximumEigenvalueUpper95SI,
      upper,
    );
  }
  if (
    ![
      exchangeResidualUpper95SI,
      maximumGershgorinRadiusUpper95SI,
      maximumEigenvalueUpper95SI,
    ].every(Number.isFinite)
  ) {
    addIssue(issues, "numeric_replay_overflow", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  const psdCertification = certifyCentralCovariancePsd(
    covarianceDimension,
    centralCovarianceValue,
    policy.noisePsdToleranceSI,
  );
  const covariancePositiveSemidefiniteCertified =
    psdCertification.disposition === "certified";
  metrics.noise = {
    sampleCount,
    covarianceDimension,
    exchangeResidualUpper95SI,
    exchangeToleranceSI: policy.noiseExchangeToleranceSI,
    symmetricTensorBasis:
      "orthonormal_symmetric_tensor_sqrt_component_multiplicity",
    covarianceSmearingMethod:
      "diag_sqrt_point_weights_tensor_sqrt_component_multiplicity_bilateral",
    psdCertificateMethod:
      "central_symmetric_covariance_semidefinite_ldlt_zero_pivot_checked",
    psdInput: "central_symmetric_weighted_covariance",
    psdCertificationDisposition: psdCertification.disposition,
    minimumLdltPivotSI: psdCertification.minimumPivot,
    psdToleranceSI: policy.noisePsdToleranceSI,
    factorizationResidualLInfSI:
      psdCertification.factorizationResidualLInf,
    maximumZeroPivotRowResidualSI:
      psdCertification.maximumZeroPivotRowResidual,
    negativeWitnessRayleighQuotientSI:
      psdCertification.negativeWitnessRayleighQuotient,
    maximumGershgorinRadiusUpper95SI,
    maximumEigenvalueUpper95SI: Math.max(0, maximumEigenvalueUpper95SI),
    covariancePositiveSemidefiniteCertified,
  };
  if (exchangeResidualUpper95SI > policy.noiseExchangeToleranceSI) {
    addIssue(
      issues,
      "noise_exchange_symmetry_exceeds_tolerance",
      "fail",
    );
  }
  if (!covariancePositiveSemidefiniteCertified) {
    addIssue(
      issues,
      psdCertification.disposition === "negative_witness"
        ? "noise_psd_negative_witness"
        : "noise_psd_numerically_inconclusive",
      psdCertification.disposition === "negative_witness"
        ? "fail"
        : "blocked",
    );
  }

  const smearedComponents = new Array<number>(tensorComponents).fill(0);
  const compensations = new Array<number>(tensorComponents).fill(0);
  for (let point = 0; point < sampleCount; point += 1) {
    const weight = arrays.meanSmearingWeights[point];
    for (let component = 0; component < tensorComponents; component += 1) {
      const product =
        weight * arrays.meanStressTensor[point * tensorComponents + component];
      const adjusted = product - compensations[component];
      const next = smearedComponents[component] + adjusted;
      compensations[component] =
        next - smearedComponents[component] - adjusted;
      smearedComponents[component] = next;
    }
  }
  const symmetricTensorFrobeniusSI = Math.hypot(
    ...smearedComponents.map(
      (value: number, index: number) =>
        value * Math.sqrt(multiplicities[index]),
    ),
  );
  const normalizationScaleSI = Math.max(
    symmetricTensorFrobeniusSI,
    policy.meanNormalizationFloorSI,
  );
  const fluctuationAmplitudeUpper95SI = Math.sqrt(
    Math.max(0, maximumEigenvalueUpper95SI),
  );
  const fluctuationToMeanRatioUpper95 =
    fluctuationAmplitudeUpper95SI / normalizationScaleSI;
  if (
    ![
      symmetricTensorFrobeniusSI,
      normalizationScaleSI,
      fluctuationAmplitudeUpper95SI,
      fluctuationToMeanRatioUpper95,
    ].every(Number.isFinite)
  ) {
    addIssue(issues, "numeric_replay_overflow", "blocked");
    return buildResult(bindings, metrics, issues);
  }
  metrics.mean = {
    smearingWeightSum: weightSum,
    smearedTensorComponentsSI: smearedComponents,
    symmetricTensorFrobeniusSI,
    normalizationFloorSI: policy.meanNormalizationFloorSI,
    normalizationScaleSI,
    fluctuationAmplitudeUpper95SI,
    fluctuationToMeanRatioUpper95,
    fluctuationRatioTolerance: policy.fluctuationRatioTolerance,
  };
  if (fluctuationToMeanRatioUpper95 > policy.fluctuationRatioTolerance) {
    addIssue(issues, "fluctuation_ratio_exceeds_tolerance", "fail");
  }

  for (const bracketId of NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS) {
    const bracket = arrays.brackets[bracketId];
    if (arraysExactlyEqual(bracket.computed, bracket.classicalTarget)) {
      addIssue(issues, `bracket_${bracketId}_target_echo`, "blocked");
      continue;
    }
    const negativeTarget = new Float64Array(bracket.classicalTarget.length);
    for (let index = 0; index < negativeTarget.length; index += 1) {
      negativeTarget[index] = -bracket.classicalTarget[index];
    }
    const bracketMetrics = computeResidualMetrics(
      [bracket.computed, negativeTarget],
      bracket.producerResidual,
      bracket.absoluteUncertainty95,
      policy.bracketResidualTolerance,
    );
    metrics.brackets[bracketId] = bracketMetrics;
    if (
      bracketMetrics.producerResidualMismatchLInf >
      policy.producerResidualConsistencyTolerance
    ) {
      addIssue(
        issues,
        `bracket_${bracketId}_producer_residual_mismatch`,
        "fail",
      );
    }
    if (
      bracketMetrics.residualUpper95 > policy.bracketResidualTolerance
    ) {
      addIssue(
        issues,
        `bracket_${bracketId}_residual_upper95_exceeds_tolerance`,
        "fail",
      );
    }
  }

  metrics.antisymmetry = computeResidualMetrics(
    [arrays.antisymmetry.forward, arrays.antisymmetry.reverse],
    arrays.antisymmetry.producerResidual,
    arrays.antisymmetry.absoluteUncertainty95,
    policy.antisymmetryResidualTolerance,
  );
  if (
    metrics.antisymmetry.producerResidualMismatchLInf >
    policy.producerResidualConsistencyTolerance
  ) {
    addIssue(
      issues,
      "antisymmetry_producer_residual_mismatch",
      "fail",
    );
  }
  if (
    metrics.antisymmetry.residualUpper95 >
    policy.antisymmetryResidualTolerance
  ) {
    addIssue(
      issues,
      "antisymmetry_residual_upper95_exceeds_tolerance",
      "fail",
    );
  }

  metrics.jacobi = computeResidualMetrics(
    [arrays.jacobi.first, arrays.jacobi.second, arrays.jacobi.third],
    arrays.jacobi.producerResidual,
    arrays.jacobi.absoluteUncertainty95,
    policy.jacobiResidualTolerance,
  );
  if (
    metrics.jacobi.producerResidualMismatchLInf >
    policy.producerResidualConsistencyTolerance
  ) {
    addIssue(issues, "jacobi_producer_residual_mismatch", "fail");
  }
  if (
    metrics.jacobi.residualUpper95 > policy.jacobiResidualTolerance
  ) {
    addIssue(
      issues,
      "jacobi_residual_upper95_exceeds_tolerance",
      "fail",
    );
  }

  const spacing = arrays.regulator.levels.map(
    (level: Nhm2SemiclassicalV2ContentReplayInput["arrays"]["regulator"]["levels"][number]) =>
      level.scale,
  );
  const residualUpper95ByLevel = arrays.regulator.levels.map(
    (level: Nhm2SemiclassicalV2ContentReplayInput["arrays"]["regulator"]["levels"][number]) =>
      maxAbsPlusPointwiseUncertainty(
        level.residual,
        level.absoluteUncertainty95,
      ),
  );
  let regulatorInputValid = true;
  for (let index = 0; index < spacing.length; index += 1) {
    if (!(spacing[index] > 0)) {
      addIssue(issues, "regulator_spacing_invalid", "blocked");
      regulatorInputValid = false;
    }
    if (index > 0 && !(spacing[index] < spacing[index - 1])) {
      addIssue(issues, "regulator_spacing_invalid", "blocked");
      regulatorInputValid = false;
    }
    if (!(residualUpper95ByLevel[index] > 0)) {
      addIssue(
        issues,
        "regulator_convergence_order_undefined",
        "blocked",
      );
      regulatorInputValid = false;
    }
  }
  if (regulatorInputValid) {
    const observedOrders: number[] = [];
    let monotone = true;
    for (let index = 0; index < spacing.length - 1; index += 1) {
      if (
        residualUpper95ByLevel[index + 1] >
        residualUpper95ByLevel[index] + policy.regulatorMonotonicityTolerance
      ) {
        monotone = false;
      }
      observedOrders.push(
        Math.log(
          residualUpper95ByLevel[index] /
            residualUpper95ByLevel[index + 1],
        ) / Math.log(spacing[index] / spacing[index + 1]),
      );
    }
    if (!observedOrders.every(Number.isFinite)) {
      addIssue(
        issues,
        "regulator_convergence_order_undefined",
        "blocked",
      );
    } else {
      const minimumObservedOrder = Math.min(...observedOrders);
      const finalResidualUpper95 =
        residualUpper95ByLevel[residualUpper95ByLevel.length - 1];
      metrics.regulator = {
        levelCount: spacing.length,
        spacing,
        residualUpper95ByLevel: [...residualUpper95ByLevel],
        observedOrders,
        minimumObservedOrder,
        requiredMinimumOrder: policy.minimumRegulatorConvergenceOrder,
        monotone,
        finalResidualUpper95,
        tolerance: policy.regulatorFinalResidualTolerance,
      };
      if (!monotone) addIssue(issues, "regulator_not_monotone", "fail");
      if (
        minimumObservedOrder < policy.minimumRegulatorConvergenceOrder
      ) {
        addIssue(
          issues,
          "regulator_convergence_order_below_minimum",
          "fail",
        );
      }
      if (
        finalResidualUpper95 > policy.regulatorFinalResidualTolerance
      ) {
        addIssue(
          issues,
          "regulator_final_residual_exceeds_tolerance",
          "fail",
        );
      }
    }
  }

  return buildResult(bindings, metrics, issues);
};
