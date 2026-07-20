import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import { NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES } from "../../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS,
  NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE,
} from "../../../shared/contracts/nhm2-independent-field-array-manifest.v1";
import { NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES } from "../../../shared/contracts/nhm2-primary-comparison-projection.v1";

export const NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_CONTRACT_VERSION =
  "nhm2_nine_field_float64_metric_kernel/v1" as const;
export const NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY_ID =
  "nhm2.server_owned_nine_field_relative_l_inf/v1" as const;
export const NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_REQUIRED_FIELD_COUNT =
  9 as const;
export const NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_TECHNICAL_ZERO_SCALE =
  NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE;

const CANDIDATE_FIELD_COMPARISON_POLICY =
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES.field_level_outputs_agree_within_frozen_tolerances;

const sameTextArray = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

const CROSS_POLICY_FIELDS_EXACTLY_ALIGNED =
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.length ===
    NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_REQUIRED_FIELD_COUNT &&
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.every(
    (primary, fieldIndex) => {
      const independent =
        NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS[fieldIndex];
      return (
        independent != null &&
        independent.ordinal === fieldIndex &&
        independent.fieldId === primary.fieldId &&
        sameTextArray(independent.componentOrder, primary.componentOrder) &&
        sameTextArray(independent.componentUnits, primary.componentUnits) &&
        independent.minimumSampleCount === primary.minimumSampleCount &&
        Number.isSafeInteger(primary.minimumSampleCount) &&
        primary.minimumSampleCount > 0 &&
        primary.componentOrder.length > 0 &&
        primary.componentOrder.length === primary.componentUnits.length &&
        primary.componentOrder.every(
          (componentId, componentIndex) =>
            componentId.length > 0 &&
            (primary.componentUnits[componentIndex]?.length ?? 0) > 0,
        )
      );
    },
  );

if (
  CANDIDATE_FIELD_COMPARISON_POLICY.comparator !== "lte" ||
  CANDIDATE_FIELD_COMPARISON_POLICY.threshold !== 0.1 ||
  CANDIDATE_FIELD_COMPARISON_POLICY.unit !== "relative_L_inf" ||
  NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_TECHNICAL_ZERO_SCALE !==
    Number.MIN_VALUE ||
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.length !==
    NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_REQUIRED_FIELD_COUNT ||
  !CROSS_POLICY_FIELDS_EXACTLY_ALIGNED
) {
  throw new Error("nhm2_nine_field_metric_authoritative_policy_invalid");
}

const deepFreeze = <Value>(value: Value): Value => {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
};

/**
 * Server-owned comparison policy. `Number.MIN_VALUE` is only a technical
 * divide-by-zero guard. It is deliberately not a producer-selectable physical
 * scale, uncertainty, noise floor, or normalization.
 */
export const NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY = deepFreeze({
  policyId: NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY_ID,
  metric: "relative_L_inf" as const,
  numerator: "max_abs_independent_minus_primary_per_component" as const,
  denominator:
    "max_authoritative_zero_scale_and_max_abs_primary_per_component" as const,
  componentReduction: "max_over_rows" as const,
  fieldReduction: "max_over_components" as const,
  overallReduction: "max_over_fields" as const,
  argmaxTieBreak:
    "frozen_field_order_then_lowest_row_then_component_order" as const,
  comparator: "lte" as const,
  tolerance: 0.1 as const,
  unit: "relative_L_inf" as const,
  fields: NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.map(
    (field, fieldIndex) => ({
      fieldIndex,
      fieldId: field.fieldId,
      componentOrder: [...field.componentOrder],
      componentUnits: [...field.componentUnits],
      minimumRows: field.minimumSampleCount,
      components: field.componentOrder.map((componentId, componentIndex) => ({
        componentIndex,
        componentId,
        unit: field.componentUnits[componentIndex],
        authoritativeZeroScale:
          NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_TECHNICAL_ZERO_SCALE,
      })),
    }),
  ),
  claimBoundary: {
    technicalZeroScaleIsPhysicalScale: false as const,
    producerSelectableZeroScale: false as const,
    calculationOnly: true as const,
    claimAuthority: false as const,
  },
});

export type Nhm2NineFieldFloat64MetricKernelPolicyV1 =
  typeof NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY;

export type Nhm2NineFieldFloat64MetricKernelFieldInputV1 = {
  fieldId: string;
  componentOrder: string[];
  componentUnits: string[];
  primarySha256: string;
  independentSha256: string;
  primaryOrderedRowsSha256: string;
  independentOrderedRowsSha256: string;
  dtype: "float64";
  encoding: "raw_ieee754";
  endianness: "little";
  shape: [number, number];
  storageOrder: "row-major";
  primary: Buffer;
  independent: Buffer;
};

export type Nhm2NineFieldFloat64MetricKernelInputV1 = {
  policy: Nhm2NineFieldFloat64MetricKernelPolicyV1;
  fields: Nhm2NineFieldFloat64MetricKernelFieldInputV1[];
};

export type Nhm2NineFieldFloat64MetricKernelArgmaxV1 = {
  rowIndex: number;
  componentIndex: number;
  componentId: string;
  primaryValue: number;
  independentValue: number;
};

export type Nhm2NineFieldFloat64MetricKernelComponentResultV1 = {
  componentIndex: number;
  componentId: string;
  unit: string;
  authoritativeZeroScale: number;
  primaryMaxAbs: number;
  independentMaxAbs: number;
  maxAbsDifference: number;
  denominator: number;
  relativeLInf: number;
  ratioOverflowed: boolean;
  argmax: Nhm2NineFieldFloat64MetricKernelArgmaxV1;
};

export type Nhm2NineFieldFloat64MetricKernelInputBindingsV1 = {
  primarySha256: string;
  independentSha256: string;
  primaryOrderedRowsSha256: string;
  independentOrderedRowsSha256: string;
  bufferHashesRecomputedAndMatched: true;
  orderedRowsHashesMatch: true;
  sharedArrayBufferBacked: false;
};

export type Nhm2NineFieldFloat64MetricKernelFieldResultV1 = {
  fieldIndex: number;
  fieldId: string;
  componentOrder: string[];
  componentUnits: string[];
  shape: [number, number];
  inputBindings: Nhm2NineFieldFloat64MetricKernelInputBindingsV1;
  components: Nhm2NineFieldFloat64MetricKernelComponentResultV1[];
  maximumRelativeLInf: number;
  argmax: Nhm2NineFieldFloat64MetricKernelArgmaxV1;
  status: "pass" | "fail";
};

export type Nhm2NineFieldFloat64MetricKernelOverallArgmaxV1 =
  Nhm2NineFieldFloat64MetricKernelArgmaxV1 & {
    fieldIndex: number;
    fieldId: string;
  };

export type Nhm2NineFieldFloat64MetricKernelResultV1 = {
  contractVersion: typeof NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_CONTRACT_VERSION;
  policyId: typeof NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY_ID;
  calculationOnly: true;
  claimAuthority: false;
  status: "pass" | "fail" | "not_ready";
  tolerance: 0.1;
  unit: "relative_L_inf";
  fields: Nhm2NineFieldFloat64MetricKernelFieldResultV1[];
  overallMaximumRelativeLInf: number | null;
  overallArgmax: Nhm2NineFieldFloat64MetricKernelOverallArgmaxV1 | null;
  blockers: string[];
  claimLocks: {
    scientificAgreementEstablished: false;
    independentNumericalReplicationReady: false;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
    empiricalValidationEstablished: false;
  };
};

const CLAIM_LOCKS = Object.freeze({
  scientificAgreementEstablished: false as const,
  independentNumericalReplicationReady: false as const,
  theoryClosureEstablished: false as const,
  physicalViabilityEstablished: false as const,
  transportEstablished: false as const,
  propulsionEstablished: false as const,
  routeEtaEstablished: false as const,
  certifiedSpeedEstablished: false as const,
  empiricalValidationEstablished: false as const,
});

const ROOT_KEYS = ["policy", "fields"] as const;
const FIELD_KEYS = [
  "fieldId",
  "componentOrder",
  "componentUnits",
  "primarySha256",
  "independentSha256",
  "primaryOrderedRowsSha256",
  "independentOrderedRowsSha256",
  "dtype",
  "encoding",
  "endianness",
  "shape",
  "storageOrder",
  "primary",
  "independent",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return (
    actual.length === required.length &&
    actual.every((key, index) => key === required[index])
  );
};

const exactTextArray = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.every((entry): entry is string => typeof entry === "string") &&
  sameTextArray(value, expected);

const unique = (values: readonly string[]): string[] => [...new Set(values)];
const SHA256 = /^[a-f0-9]{64}$/;
const exactSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);

const sha256Buffer = (buffer: Buffer): string =>
  createHash("sha256").update(buffer).digest("hex");

const isSharedArrayBufferBacked = (buffer: Buffer): boolean =>
  typeof SharedArrayBuffer !== "undefined" &&
  buffer.buffer instanceof SharedArrayBuffer;

const canonicalScalar = (value: number): number =>
  Object.is(value, -0) ? 0 : value;

const resultBase = () => ({
  contractVersion: NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_CONTRACT_VERSION,
  policyId: NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY_ID,
  calculationOnly: true as const,
  claimAuthority: false as const,
  tolerance: 0.1 as const,
  unit: "relative_L_inf" as const,
  claimLocks: { ...CLAIM_LOCKS },
});

const notReady = (
  blockers: readonly string[],
): Nhm2NineFieldFloat64MetricKernelResultV1 => ({
  ...resultBase(),
  status: "not_ready",
  fields: [],
  overallMaximumRelativeLInf: null,
  overallArgmax: null,
  blockers: unique(blockers),
});

type ValidatedField = {
  fieldId: string;
  componentOrder: readonly string[];
  componentUnits: readonly string[];
  shape: [number, number];
  primary: Buffer;
  independent: Buffer;
  inputBindings: Nhm2NineFieldFloat64MetricKernelInputBindingsV1;
};

const validateInput = (
  input: unknown,
): { fields: ValidatedField[]; blockers: string[] } => {
  if (!isRecord(input) || !hasExactKeys(input, ROOT_KEYS)) {
    return { fields: [], blockers: ["metric_kernel_root_shape_invalid"] };
  }
  if (input.policy !== NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY) {
    return {
      fields: [],
      blockers: ["server_owned_immutable_exact_policy_required"],
    };
  }
  if (
    !Array.isArray(input.fields) ||
    input.fields.length !==
      NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_REQUIRED_FIELD_COUNT
  ) {
    return {
      fields: [],
      blockers: ["exact_nine_field_inventory_required"],
    };
  }

  const fields: ValidatedField[] = [];
  const blockers: string[] = [];
  for (const [
    fieldIndex,
    expected,
  ] of NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY.fields.entries()) {
    const value = input.fields[fieldIndex];
    const prefix = `field_${fieldIndex}_${expected.fieldId}`;
    if (!isRecord(value) || !hasExactKeys(value, FIELD_KEYS)) {
      blockers.push(`${prefix}:exact_field_shape_invalid`);
      continue;
    }
    if (value.fieldId !== expected.fieldId) {
      blockers.push(`${prefix}:field_id_or_order_invalid`);
    }
    if (!exactTextArray(value.componentOrder, expected.componentOrder)) {
      blockers.push(`${prefix}:component_order_invalid`);
    }
    if (!exactTextArray(value.componentUnits, expected.componentUnits)) {
      blockers.push(`${prefix}:component_units_invalid`);
    }
    const primarySha256 = exactSha256(value.primarySha256)
      ? value.primarySha256
      : null;
    const independentSha256 = exactSha256(value.independentSha256)
      ? value.independentSha256
      : null;
    const primaryOrderedRowsSha256 = exactSha256(value.primaryOrderedRowsSha256)
      ? value.primaryOrderedRowsSha256
      : null;
    const independentOrderedRowsSha256 = exactSha256(
      value.independentOrderedRowsSha256,
    )
      ? value.independentOrderedRowsSha256
      : null;
    if (primarySha256 == null) {
      blockers.push(`${prefix}:primary_sha256_invalid`);
    }
    if (independentSha256 == null) {
      blockers.push(`${prefix}:independent_sha256_invalid`);
    }
    if (primaryOrderedRowsSha256 == null) {
      blockers.push(`${prefix}:primary_ordered_rows_sha256_invalid`);
    }
    if (independentOrderedRowsSha256 == null) {
      blockers.push(`${prefix}:independent_ordered_rows_sha256_invalid`);
    }
    if (
      primaryOrderedRowsSha256 != null &&
      independentOrderedRowsSha256 != null &&
      primaryOrderedRowsSha256 !== independentOrderedRowsSha256
    ) {
      blockers.push(`${prefix}:ordered_rows_sha256_mismatch`);
    }
    if (value.dtype !== "float64") {
      blockers.push(`${prefix}:float64_dtype_required`);
    }
    if (value.encoding !== "raw_ieee754") {
      blockers.push(`${prefix}:raw_ieee754_encoding_required`);
    }
    if (value.endianness !== "little") {
      blockers.push(`${prefix}:little_endian_required`);
    }
    if (value.storageOrder !== "row-major") {
      blockers.push(`${prefix}:row_major_storage_required`);
    }

    const shape = value.shape;
    let rows: number | null = null;
    if (
      !Array.isArray(shape) ||
      shape.length !== 2 ||
      !Number.isSafeInteger(shape[0]) ||
      !Number.isSafeInteger(shape[1]) ||
      (shape[0] as number) < expected.minimumRows ||
      shape[1] !== expected.componentOrder.length
    ) {
      blockers.push(`${prefix}:shape_or_minimum_rows_invalid`);
    } else {
      rows = shape[0] as number;
    }

    if (!Buffer.isBuffer(value.primary)) {
      blockers.push(`${prefix}:primary_buffer_required`);
    }
    if (!Buffer.isBuffer(value.independent)) {
      blockers.push(`${prefix}:independent_buffer_required`);
    }
    if (
      Buffer.isBuffer(value.primary) &&
      isSharedArrayBufferBacked(value.primary)
    ) {
      blockers.push(`${prefix}:primary_shared_array_buffer_forbidden`);
    }
    if (
      Buffer.isBuffer(value.independent) &&
      isSharedArrayBufferBacked(value.independent)
    ) {
      blockers.push(`${prefix}:independent_shared_array_buffer_forbidden`);
    }

    if (
      rows != null &&
      Buffer.isBuffer(value.primary) &&
      Buffer.isBuffer(value.independent)
    ) {
      const elementCount = rows * expected.componentOrder.length;
      const expectedBytes = elementCount * 8;
      if (
        !Number.isSafeInteger(elementCount) ||
        !Number.isSafeInteger(expectedBytes)
      ) {
        blockers.push(`${prefix}:shape_byte_length_overflow`);
      } else {
        if (value.primary.length !== expectedBytes) {
          blockers.push(`${prefix}:primary_byte_length_mismatch`);
        }
        if (value.independent.length !== expectedBytes) {
          blockers.push(`${prefix}:independent_byte_length_mismatch`);
        }
      }
    }

    if (
      Buffer.isBuffer(value.primary) &&
      !isSharedArrayBufferBacked(value.primary) &&
      primarySha256 != null &&
      sha256Buffer(value.primary) !== primarySha256
    ) {
      blockers.push(`${prefix}:primary_buffer_sha256_mismatch`);
    }
    if (
      Buffer.isBuffer(value.independent) &&
      !isSharedArrayBufferBacked(value.independent) &&
      independentSha256 != null &&
      sha256Buffer(value.independent) !== independentSha256
    ) {
      blockers.push(`${prefix}:independent_buffer_sha256_mismatch`);
    }

    if (
      blockers.some((blocker) => blocker.startsWith(`${prefix}:`)) ||
      rows == null ||
      !Buffer.isBuffer(value.primary) ||
      !Buffer.isBuffer(value.independent) ||
      primarySha256 == null ||
      independentSha256 == null ||
      primaryOrderedRowsSha256 == null ||
      independentOrderedRowsSha256 == null
    ) {
      continue;
    }
    fields.push({
      fieldId: expected.fieldId,
      componentOrder: expected.componentOrder,
      componentUnits: expected.componentUnits,
      shape: [rows, expected.componentOrder.length],
      primary: value.primary,
      independent: value.independent,
      inputBindings: {
        primarySha256,
        independentSha256,
        primaryOrderedRowsSha256,
        independentOrderedRowsSha256,
        bufferHashesRecomputedAndMatched: true,
        orderedRowsHashesMatch: true,
        sharedArrayBufferBacked: false,
      },
    });
  }
  if (
    fields.length !== NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_REQUIRED_FIELD_COUNT
  ) {
    blockers.push("all_nine_exact_float64_fields_required");
  }
  return { fields, blockers: unique(blockers) };
};

const componentTiePrecedes = (
  candidate: Nhm2NineFieldFloat64MetricKernelArgmaxV1,
  incumbent: Nhm2NineFieldFloat64MetricKernelArgmaxV1,
): boolean =>
  candidate.rowIndex < incumbent.rowIndex ||
  (candidate.rowIndex === incumbent.rowIndex &&
    candidate.componentIndex < incumbent.componentIndex);

const overallTiePrecedes = (
  candidate: Nhm2NineFieldFloat64MetricKernelOverallArgmaxV1,
  incumbent: Nhm2NineFieldFloat64MetricKernelOverallArgmaxV1,
): boolean =>
  candidate.fieldIndex < incumbent.fieldIndex ||
  (candidate.fieldIndex === incumbent.fieldIndex &&
    componentTiePrecedes(candidate, incumbent));

const computeValidated = (
  fields: readonly ValidatedField[],
): Nhm2NineFieldFloat64MetricKernelResultV1 => {
  const fieldResults: Nhm2NineFieldFloat64MetricKernelFieldResultV1[] = [];
  let overallMaximum = -1;
  let overallArgmax: Nhm2NineFieldFloat64MetricKernelOverallArgmaxV1 | null =
    null;

  for (const [fieldIndex, field] of fields.entries()) {
    const [rows, componentCount] = field.shape;
    const componentResults: Nhm2NineFieldFloat64MetricKernelComponentResultV1[] =
      [];
    let fieldMaximum = -1;
    let fieldArgmax: Nhm2NineFieldFloat64MetricKernelArgmaxV1 | null = null;

    for (
      let componentIndex = 0;
      componentIndex < componentCount;
      componentIndex += 1
    ) {
      let maximumAbsolutePrimary = 0;
      let maximumAbsoluteIndependent = 0;
      let maximumAbsoluteDifference = -1;
      let differenceArgmaxRow = 0;
      let differenceArgmaxPrimaryValue = 0;
      let differenceArgmaxIndependentValue = 0;

      for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
        const elementIndex = rowIndex * componentCount + componentIndex;
        const byteOffset = elementIndex * 8;
        const primaryValue = field.primary.readDoubleLE(byteOffset);
        const independentValue = field.independent.readDoubleLE(byteOffset);
        if (!Number.isFinite(primaryValue)) {
          return notReady([
            `${field.fieldId}:primary_non_finite:row_${rowIndex}:component_${componentIndex}`,
          ]);
        }
        if (!Number.isFinite(independentValue)) {
          return notReady([
            `${field.fieldId}:independent_non_finite:row_${rowIndex}:component_${componentIndex}`,
          ]);
        }

        const absolutePrimary = Math.abs(primaryValue);
        const absoluteIndependent = Math.abs(independentValue);
        const difference = independentValue - primaryValue;
        if (!Number.isFinite(difference)) {
          return notReady([
            `${field.fieldId}:non_finite_subtraction:row_${rowIndex}:component_${componentIndex}`,
          ]);
        }
        const absoluteDifference = Math.abs(difference);
        if (
          !Number.isFinite(absolutePrimary) ||
          !Number.isFinite(absoluteIndependent) ||
          !Number.isFinite(absoluteDifference)
        ) {
          return notReady([
            `${field.fieldId}:non_finite_absolute_value:row_${rowIndex}:component_${componentIndex}`,
          ]);
        }

        if (absolutePrimary > maximumAbsolutePrimary) {
          maximumAbsolutePrimary = absolutePrimary;
        }
        if (absoluteIndependent > maximumAbsoluteIndependent) {
          maximumAbsoluteIndependent = absoluteIndependent;
        }
        // Strict comparison preserves the lowest row on exact ties.
        if (absoluteDifference > maximumAbsoluteDifference) {
          maximumAbsoluteDifference = absoluteDifference;
          differenceArgmaxRow = rowIndex;
          differenceArgmaxPrimaryValue = primaryValue;
          differenceArgmaxIndependentValue = independentValue;
        }
      }

      const authoritativeZeroScale =
        NHM2_NINE_FIELD_FLOAT64_METRIC_KERNEL_POLICY.fields[fieldIndex]
          .components[componentIndex].authoritativeZeroScale;
      const denominator = Math.max(
        authoritativeZeroScale,
        maximumAbsolutePrimary,
      );
      const rawRelativeLInf = maximumAbsoluteDifference / denominator;
      const ratioOverflowed =
        rawRelativeLInf === Number.POSITIVE_INFINITY &&
        Number.isFinite(maximumAbsoluteDifference) &&
        Number.isFinite(denominator) &&
        denominator > 0;
      if (
        !Number.isFinite(denominator) ||
        (!Number.isFinite(rawRelativeLInf) && !ratioOverflowed)
      ) {
        return notReady([
          `${field.fieldId}:non_finite_division:row_${differenceArgmaxRow}:component_${componentIndex}`,
        ]);
      }
      const relativeLInf = ratioOverflowed
        ? Number.MAX_VALUE
        : canonicalScalar(rawRelativeLInf);

      const argmax = {
        rowIndex: differenceArgmaxRow,
        componentIndex,
        componentId: field.componentOrder[componentIndex],
        primaryValue: canonicalScalar(differenceArgmaxPrimaryValue),
        independentValue: canonicalScalar(differenceArgmaxIndependentValue),
      };
      const componentResult = {
        componentIndex,
        componentId: field.componentOrder[componentIndex],
        unit: field.componentUnits[componentIndex],
        authoritativeZeroScale,
        primaryMaxAbs: canonicalScalar(maximumAbsolutePrimary),
        independentMaxAbs: canonicalScalar(maximumAbsoluteIndependent),
        maxAbsDifference: canonicalScalar(maximumAbsoluteDifference),
        denominator: canonicalScalar(denominator),
        relativeLInf,
        ratioOverflowed,
        argmax,
      };
      componentResults.push(componentResult);

      if (
        relativeLInf > fieldMaximum ||
        (relativeLInf === fieldMaximum &&
          fieldArgmax != null &&
          componentTiePrecedes(argmax, fieldArgmax))
      ) {
        fieldMaximum = relativeLInf;
        fieldArgmax = argmax;
      }
    }

    if (fieldArgmax == null || !Number.isFinite(fieldMaximum)) {
      return notReady([`${field.fieldId}:field_metric_not_computable`]);
    }
    const fieldResult: Nhm2NineFieldFloat64MetricKernelFieldResultV1 = {
      fieldIndex,
      fieldId: field.fieldId,
      componentOrder: [...field.componentOrder],
      componentUnits: [...field.componentUnits],
      shape: [...field.shape],
      inputBindings: field.inputBindings,
      components: componentResults,
      maximumRelativeLInf: fieldMaximum,
      argmax: fieldArgmax,
      status: fieldMaximum <= 0.1 ? "pass" : "fail",
    };
    fieldResults.push(fieldResult);

    const candidateOverallArgmax = {
      fieldIndex,
      fieldId: field.fieldId,
      ...fieldArgmax,
    };
    if (
      fieldMaximum > overallMaximum ||
      (fieldMaximum === overallMaximum &&
        overallArgmax != null &&
        overallTiePrecedes(candidateOverallArgmax, overallArgmax))
    ) {
      overallMaximum = fieldMaximum;
      overallArgmax = candidateOverallArgmax;
    }
  }

  if (overallArgmax == null || !Number.isFinite(overallMaximum)) {
    return notReady(["overall_metric_not_computable"]);
  }
  return {
    ...resultBase(),
    status: overallMaximum <= 0.1 ? "pass" : "fail",
    fields: fieldResults,
    overallMaximumRelativeLInf: canonicalScalar(overallMaximum),
    overallArgmax,
    blockers: [],
  };
};

/**
 * Recomputes only the frozen nine-field numeric comparison. A numeric `pass`
 * remains calculation-only and never establishes scientific agreement,
 * independent replication, theory closure, or a physical/transport claim.
 */
export const computeNhm2NineFieldFloat64Metrics = (
  input: unknown,
): Nhm2NineFieldFloat64MetricKernelResultV1 => {
  try {
    const validation = validateInput(input);
    if (validation.blockers.length > 0) {
      return notReady(validation.blockers);
    }
    return computeValidated(validation.fields);
  } catch {
    return notReady(["metric_kernel_input_unreadable"]);
  }
};
