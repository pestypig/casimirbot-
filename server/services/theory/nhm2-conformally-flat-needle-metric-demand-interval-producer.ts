import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { createReadStream, constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { getHeapStatistics } from "node:v8";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_COMPONENT_COUNT,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_AUTHORITY_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_RECEIPT_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_SAMPLE_COUNT,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson,
  computeNhm2ConformallyFlatNeedleMetricDemandRunReceiptSha256,
  hasValidNhm2ConformallyFlatNeedleMetricDemandRunReceiptIntegrity,
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes,
  type Nhm2ConformallyFlatNeedleClosedIntervalV1,
  type Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
  type Nhm2ConformallyFlatNeedleMetricDemandIntervalSampleTraceV1,
  type Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1,
  type Nhm2ConformallyFlatNeedleMetricDemandOutputFileV1,
  type Nhm2ConformallyFlatNeedleMetricDemandPriorTerminalOutputV1,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-metric-demand-interval-producer.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../../../shared/contracts/nhm2-conformally-flat-needle-scalar-reference.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
  type Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../../../shared/contracts/nhm2-semiclassical-state-realizability.v1";
import {
  Nhm2SecureRunOutputReaderError,
  readNhm2SecureRunOutputs,
  type Nhm2SecureRunOutputReadFileV1,
} from "./nhm2-secure-run-output-reader";

const execFileAsync = promisify(execFile);
const THIS_SOURCE_PATH = fileURLToPath(import.meta.url);
const COMPONENT_MULTIPLICITIES = Object.freeze([
  1, 2, 2, 2, 1, 2, 2, 1, 2, 1,
] as const);
const OUTWARD_RELATIVE_PADDING = 2 ** -52;
const EXP_TAYLOR_TERMS = 96;
const MAX_TRACE_BYTES = 8n * 1024n * 1024n;

type Interval = { lo: number; hi: number };
type SecondOrderIntervalJet = {
  value: Interval;
  first: readonly [Interval, Interval, Interval];
  secondDiagonal: readonly [Interval, Interval, Interval];
};

export type Nhm2ConformallyFlatNeedleMetricDemandDerivedArraysV1 = {
  central: Float64Array;
  deterministicAbsoluteErrorBound: Float64Array;
  trace: Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1;
};

export type ProduceNhm2ConformallyFlatNeedleMetricDemandIntervalInput = {
  /** Existing, absolute, non-symlink directory beneath which one child is created. */
  outputParentDirectory: string;
  /** Exact repository whose HEAD, worktree state, sources, lock, and toolchain are observed. */
  repositoryRoot: string;
  /** Required partial v2 terminal directory from the first calculation. */
  priorTerminalObservationDirectory: string;
  /** Enforced by the caller wrapper; retained as non-independent receipt metadata. */
  externalWallTimeCeilingMs: 600000;
  now?: () => Date;
  invocationNonce?: () => Uint8Array;
};

export type ProduceNhm2ConformallyFlatNeedleMetricDemandIntervalResult = {
  receipt: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1;
  receiptSha256: string;
  receiptAbsolutePath: string;
  outputDirectoryRealPath: string;
};

export type Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerErrorCode =
  | "producer_input_invalid"
  | "repository_provenance_observation_failed"
  | "implementation_hash_observation_failed"
  | "prior_terminal_observation_invalid"
  | "interval_derivation_failed"
  | "interval_enclosure_target_not_met"
  | "output_parent_invalid"
  | "output_directory_create_failed"
  | "output_write_failed"
  | "output_secure_readback_failed"
  | "output_secure_readback_mismatch"
  | "receipt_integrity_failed";

export class Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError extends Error {
  readonly code: Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerErrorCode;
  readonly detailCode: string | null;

  constructor(
    code: Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerErrorCode,
    message: string,
    options: { cause?: unknown; detailCode?: string | null } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError";
    this.code = code;
    this.detailCode = options.detailCode ?? null;
  }
}

const fail = (
  code: Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerErrorCode,
  message: string,
  options: { cause?: unknown; detailCode?: string | null } = {},
): never => {
  throw new Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError(
    code,
    message,
    options,
  );
};

const outwardUp = (value: number): number => {
  if (value === Number.POSITIVE_INFINITY) return value;
  if (!Number.isFinite(value)) {
    return fail("interval_derivation_failed", "Non-finite interval endpoint.");
  }
  if (value === 0) return Number.MIN_VALUE;
  const padding = Math.max(
    Number.MIN_VALUE,
    Math.abs(value) * OUTWARD_RELATIVE_PADDING,
  );
  const result = value + padding;
  if (!Number.isFinite(result) || !(result > value)) {
    return fail("interval_derivation_failed", "Outward upper rounding failed.");
  }
  return result;
};

const outwardDown = (value: number): number => {
  if (value === Number.NEGATIVE_INFINITY) return value;
  if (!Number.isFinite(value)) {
    return fail("interval_derivation_failed", "Non-finite interval endpoint.");
  }
  if (value === 0) return -Number.MIN_VALUE;
  const padding = Math.max(
    Number.MIN_VALUE,
    Math.abs(value) * OUTWARD_RELATIVE_PADDING,
  );
  const result = value - padding;
  if (!Number.isFinite(result) || !(result < value)) {
    return fail("interval_derivation_failed", "Outward lower rounding failed.");
  }
  return result;
};

const exactZero = (): Interval => ({ lo: 0, hi: 0 });
const scalarInterval = (value: number): Interval => ({
  lo: outwardDown(value),
  hi: outwardUp(value),
});
const exactIntegerInterval = (value: number): Interval => ({
  lo: value,
  hi: value,
});
const clampNonnegative = (value: Interval): Interval => ({
  lo: Math.max(0, value.lo),
  hi: Math.max(0, value.hi),
});
const add = (left: Interval, right: Interval): Interval => ({
  lo: outwardDown(left.lo + right.lo),
  hi: outwardUp(left.hi + right.hi),
});
const subtract = (left: Interval, right: Interval): Interval => ({
  lo: outwardDown(left.lo - right.hi),
  hi: outwardUp(left.hi - right.lo),
});
const negate = (value: Interval): Interval => ({
  lo: -value.hi,
  hi: -value.lo,
});
const multiply = (left: Interval, right: Interval): Interval => {
  const candidates = [
    left.lo * right.lo,
    left.lo * right.hi,
    left.hi * right.lo,
    left.hi * right.hi,
  ];
  if (candidates.some((entry) => !Number.isFinite(entry))) {
    return fail("interval_derivation_failed", "Interval product overflowed.");
  }
  return {
    lo: outwardDown(Math.min(...candidates)),
    hi: outwardUp(Math.max(...candidates)),
  };
};
const divide = (numerator: Interval, denominator: Interval): Interval => {
  if (!(denominator.lo > 0) || !Number.isFinite(denominator.hi)) {
    return fail(
      "interval_derivation_failed",
      "Interval denominator lacks a strictly positive lower bound.",
    );
  }
  return multiply(numerator, {
    lo: outwardDown(1 / denominator.hi),
    hi: outwardUp(1 / denominator.lo),
  });
};
const square = (value: Interval): Interval => {
  if (value.lo <= 0 && value.hi >= 0) {
    return {
      lo: 0,
      hi: outwardUp(Math.max(value.lo * value.lo, value.hi * value.hi)),
    };
  }
  const left = value.lo * value.lo;
  const right = value.hi * value.hi;
  return {
    lo: outwardDown(Math.min(left, right)),
    hi: outwardUp(Math.max(left, right)),
  };
};
const scale = (value: Interval, factor: number): Interval =>
  multiply(value, scalarInterval(factor));
const width = (value: Interval): number => outwardUp(value.hi - value.lo);
const intersect = (left: Interval, right: Interval): Interval => {
  const result = {
    lo: Math.max(left.lo, right.lo),
    hi: Math.min(left.hi, right.hi),
  };
  if (result.lo > result.hi) {
    return fail(
      "interval_derivation_failed",
      "Independently valid refinement enclosures did not intersect.",
    );
  }
  return result;
};
const serializeInterval = (
  value: Interval,
): Nhm2ConformallyFlatNeedleClosedIntervalV1 => [value.lo, value.hi];

const jetConstant = (value: Interval): SecondOrderIntervalJet => ({
  value,
  first: [exactZero(), exactZero(), exactZero()],
  secondDiagonal: [exactZero(), exactZero(), exactZero()],
});

const jetVariable = (
  value: Interval,
  axis: number,
): SecondOrderIntervalJet => ({
  value,
  first: [0, 1, 2].map((entry) =>
    exactIntegerInterval(entry === axis ? 1 : 0),
  ) as [Interval, Interval, Interval],
  secondDiagonal: [exactZero(), exactZero(), exactZero()],
});

const jetAdd = (
  left: SecondOrderIntervalJet,
  right: SecondOrderIntervalJet,
): SecondOrderIntervalJet => ({
  value: add(left.value, right.value),
  first: [0, 1, 2].map((axis) => add(left.first[axis], right.first[axis])) as [
    Interval,
    Interval,
    Interval,
  ],
  secondDiagonal: [0, 1, 2].map((axis) =>
    add(left.secondDiagonal[axis], right.secondDiagonal[axis]),
  ) as [Interval, Interval, Interval],
});

const jetNegate = (value: SecondOrderIntervalJet): SecondOrderIntervalJet => ({
  value: negate(value.value),
  first: value.first.map(negate) as [Interval, Interval, Interval],
  secondDiagonal: value.secondDiagonal.map(negate) as [
    Interval,
    Interval,
    Interval,
  ],
});

const jetSubtract = (
  left: SecondOrderIntervalJet,
  right: SecondOrderIntervalJet,
): SecondOrderIntervalJet => jetAdd(left, jetNegate(right));

const jetMultiply = (
  left: SecondOrderIntervalJet,
  right: SecondOrderIntervalJet,
): SecondOrderIntervalJet => ({
  value: multiply(left.value, right.value),
  first: [0, 1, 2].map((axis) =>
    add(
      multiply(left.first[axis], right.value),
      multiply(left.value, right.first[axis]),
    ),
  ) as [Interval, Interval, Interval],
  secondDiagonal: [0, 1, 2].map((axis) =>
    addMany([
      multiply(left.secondDiagonal[axis], right.value),
      scale(multiply(left.first[axis], right.first[axis]), 2),
      multiply(left.value, right.secondDiagonal[axis]),
    ]),
  ) as [Interval, Interval, Interval],
});

const jetReciprocal = (
  value: SecondOrderIntervalJet,
): SecondOrderIntervalJet => {
  const reciprocalValue = divide(exactIntegerInterval(1), value.value);
  const valueSquared = square(value.value);
  const valueCubed = multiply(valueSquared, value.value);
  return {
    value: reciprocalValue,
    first: value.first.map((entry) => negate(divide(entry, valueSquared))) as [
      Interval,
      Interval,
      Interval,
    ],
    secondDiagonal: [0, 1, 2].map((axis) =>
      subtract(
        divide(scale(square(value.first[axis]), 2), valueCubed),
        divide(value.secondDiagonal[axis], valueSquared),
      ),
    ) as [Interval, Interval, Interval],
  };
};

const jetDivide = (
  numerator: SecondOrderIntervalJet,
  denominator: SecondOrderIntervalJet,
): SecondOrderIntervalJet => jetMultiply(numerator, jetReciprocal(denominator));

const jetScale = (
  value: SecondOrderIntervalJet,
  factor: number,
): SecondOrderIntervalJet =>
  jetMultiply(value, jetConstant(scalarInterval(factor)));

const jetSquare = (value: SecondOrderIntervalJet): SecondOrderIntervalJet =>
  jetMultiply(value, value);

const jetNegativeExponential = (
  nonnegativeExponent: SecondOrderIntervalJet,
): SecondOrderIntervalJet => {
  const value = negativeExponential(
    clampNonnegative(nonnegativeExponent.value),
  );
  return {
    value,
    first: nonnegativeExponent.first.map((entry) =>
      negate(multiply(value, entry)),
    ) as [Interval, Interval, Interval],
    secondDiagonal: [0, 1, 2].map((axis) =>
      multiply(
        value,
        subtract(
          square(nonnegativeExponent.first[axis]),
          nonnegativeExponent.secondDiagonal[axis],
        ),
      ),
    ) as [Interval, Interval, Interval],
  };
};

const jetAddMany = (
  values: readonly SecondOrderIntervalJet[],
): SecondOrderIntervalJet =>
  values.reduce((sum, value) => jetAdd(sum, value), jetConstant(exactZero()));

/**
 * Bounds exp(t), t>=0, using a positive Taylor partial sum and a geometric
 * majorant of the positive tail. No platform libm exponential is admitted.
 */
const positiveExponentialBounds = (t: number): Interval => {
  if (!Number.isFinite(t) || t < 0 || t >= EXP_TAYLOR_TERMS + 2) {
    return fail(
      "interval_derivation_failed",
      "Exponential argument is outside the certified Taylor work range.",
    );
  }
  let lowerTerm = 1;
  let upperTerm = 1;
  let lowerSum = 1;
  let upperSum = 1;
  for (let order = 1; order <= EXP_TAYLOR_TERMS; order += 1) {
    lowerTerm = outwardDown((lowerTerm * t) / order);
    upperTerm = outwardUp((upperTerm * t) / order);
    lowerSum = outwardDown(lowerSum + lowerTerm);
    upperSum = outwardUp(upperSum + upperTerm);
  }
  const nextTermUpper = outwardUp((upperTerm * t) / (EXP_TAYLOR_TERMS + 1));
  const tailRatioUpper = outwardUp(t / (EXP_TAYLOR_TERMS + 2));
  if (!(tailRatioUpper < 1)) {
    return fail(
      "interval_derivation_failed",
      "Exponential tail ratio did not contract.",
    );
  }
  const tailUpper = outwardUp(nextTermUpper / (1 - tailRatioUpper));
  return {
    lo: lowerSum,
    hi: outwardUp(upperSum + tailUpper),
  };
};

const negativeExponential = (nonnegativeExponent: Interval): Interval => {
  if (nonnegativeExponent.lo < 0 || !Number.isFinite(nonnegativeExponent.hi)) {
    return fail(
      "interval_derivation_failed",
      "Negative-exponential input must be finite and nonnegative.",
    );
  }
  const lowExp = positiveExponentialBounds(nonnegativeExponent.lo);
  const highExp = positiveExponentialBounds(nonnegativeExponent.hi);
  return {
    lo: outwardDown(1 / highExp.hi),
    hi: outwardUp(1 / lowExp.lo),
  };
};

const absoluteBounds = (
  value: Interval,
): { minimum: number; maximum: number } => {
  if (value.lo <= 0 && value.hi >= 0) {
    return { minimum: 0, maximum: Math.max(-value.lo, value.hi) };
  }
  return {
    minimum: Math.min(Math.abs(value.lo), Math.abs(value.hi)),
    maximum: Math.max(Math.abs(value.lo), Math.abs(value.hi)),
  };
};

const compactTestBump = (u: Interval): Interval => {
  const absolute = absoluteBounds(u);
  if (absolute.minimum >= 1) return exactZero();
  const minimumSquare = scalarInterval(absolute.minimum * absolute.minimum);
  const maximumSquare =
    absolute.maximum >= 1
      ? { lo: 1, hi: 1 }
      : scalarInterval(absolute.maximum * absolute.maximum);
  const minimumRatio = clampNonnegative(
    divide(
      clampNonnegative(minimumSquare),
      subtract(exactIntegerInterval(1), clampNonnegative(minimumSquare)),
    ),
  );
  const upper = negativeExponential(minimumRatio).hi;
  if (absolute.maximum >= 1) return { lo: 0, hi: upper };
  const maximumRatio = clampNonnegative(
    divide(
      clampNonnegative(maximumSquare),
      subtract(exactIntegerInterval(1), clampNonnegative(maximumSquare)),
    ),
  );
  return {
    lo: negativeExponential(maximumRatio).lo,
    hi: upper,
  };
};

const compactTestBumpDerivativeU = (u: Interval): Interval => {
  if (u.lo <= -1 || u.hi >= 1) {
    // With t=1/(1-u^2)>=1, |q'|=2|u|*e*e^-t*t^2 < 8/e < 3.
    if (u.lo >= 0) return { lo: -3, hi: 0 };
    if (u.hi <= 0) return { lo: 0, hi: 3 };
    return { lo: -3, hi: 3 };
  }
  return divide(
    multiply(scale(u, -2), compactTestBump(u)),
    square(subtract(exactIntegerInterval(1), square(u))),
  );
};

const addMany = (values: readonly Interval[]): Interval =>
  values.reduce((sum, value) => add(sum, value), exactZero());

const evaluateConformalEinsteinIntegrands = (
  multiplier: readonly [number, number, number],
  u: readonly [Interval, Interval, Interval],
): {
  denominator: Interval;
  numerators: readonly Interval[];
} => {
  const ratioHalfWidth = scalarInterval(0.04);
  const axes = [
    scalarInterval(0.25),
    scalarInterval(0.05),
    scalarInterval(0.05),
  ];
  const normalizedCoordinates = u.map((entry, axis) =>
    add(scalarInterval(multiplier[axis]), multiply(ratioHalfWidth, entry)),
  );
  const ellipsoidalS = clampNonnegative(
    addMany(normalizedCoordinates.map((entry) => square(entry))),
  );
  if (!(ellipsoidalS.hi < 1)) {
    return fail(
      "interval_derivation_failed",
      "A smear cell escaped the frozen compact conformal-bump support proof.",
    );
  }
  const oneMinusS = subtract(exactIntegerInterval(1), ellipsoidalS);
  const bumpExponent = clampNonnegative(divide(ellipsoidalS, oneMinusS));
  const bump = negativeExponential(bumpExponent);
  const amplitude = scalarInterval(0.000001);
  const omegaFactor = add(exactIntegerInterval(1), multiply(amplitude, bump));
  const oneMinusSSquared = square(oneMinusS);
  const bumpFirst = negate(divide(bump, oneMinusSSquared));
  const sGradients = normalizedCoordinates.map((entry, axis) =>
    divide(scale(entry, 2), axes[axis]),
  );
  const omegaGradients = sGradients.map((entry) =>
    multiply(multiply(amplitude, bumpFirst), entry),
  );
  const omegaSquared = square(omegaFactor);
  const omegaFourth = square(omegaSquared);
  const q = u.map(compactTestBump);
  const qProduct = multiply(multiply(q[0], q[1]), q[2]);
  const physicalHalfWidths = [
    scalarInterval(0.01),
    scalarInterval(0.002),
    scalarInterval(0.002),
  ];
  const qGradients = u.map((entry, axis) => {
    const otherAxes = [0, 1, 2].filter((candidate) => candidate !== axis);
    return divide(
      multiply(
        compactTestBumpDerivativeU(entry),
        multiply(q[otherAxes[0]], q[otherAxes[1]]),
      ),
      physicalHalfWidths[axis],
    );
  });
  const qGradientDotOmegaGradient = addMany(
    qGradients.map((entry, axis) => multiply(entry, omegaGradients[axis])),
  );
  const omegaGradientSquare = addMany(
    omegaGradients.map((entry) => square(entry)),
  );

  /*
   * Exact integration by parts removes every second derivative from the
   * normalized smear. q and all of its boundary jets vanish at |u_i|=1.
   * These are integrated Omega^2 G_AB numerators, not point samples.
   */
  const weakG00Numerator = add(
    scale(multiply(omegaFactor, qGradientDotOmegaGradient), 2),
    scale(multiply(qProduct, omegaGradientSquare), 3),
  );
  const diagonalWeakTerm = add(
    scale(multiply(omegaFactor, qGradientDotOmegaGradient), -2),
    scale(multiply(qProduct, omegaGradientSquare), -3),
  );
  const weakSpatialNumerators = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => exactZero()),
  );
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const symmetrizedBoundaryTerm = multiply(
        omegaFactor,
        add(
          multiply(qGradients[row], omegaGradients[column]),
          multiply(qGradients[column], omegaGradients[row]),
        ),
      );
      const gradientProductTerm = scale(
        multiply(
          qProduct,
          multiply(omegaGradients[row], omegaGradients[column]),
        ),
        6,
      );
      const base = add(symmetrizedBoundaryTerm, gradientProductTerm);
      weakSpatialNumerators[row][column] =
        row === column ? add(base, diagonalWeakTerm) : base;
    }
  }
  const integratedNumeratorComponents = [
    weakG00Numerator,
    exactZero(),
    exactZero(),
    exactZero(),
    weakSpatialNumerators[0][0],
    weakSpatialNumerators[0][1],
    weakSpatialNumerators[0][2],
    weakSpatialNumerators[1][1],
    weakSpatialNumerators[1][2],
    weakSpatialNumerators[2][2],
  ];
  return {
    denominator: multiply(qProduct, omegaFourth),
    numerators: integratedNumeratorComponents,
  };
};

const compactTestBumpJet = (
  u: SecondOrderIntervalJet,
): SecondOrderIntervalJet => {
  if (u.value.lo <= -1 || u.value.hi >= 1) {
    // The trace carries the analytic t=1/(1-u^2) proof of |q'|<3 and
    // |q''|<=54. The second derivative is deliberately widened to 160.
    const firstDerivative =
      u.value.lo >= 0
        ? { lo: -3, hi: 0 }
        : u.value.hi <= 0
          ? { lo: 0, hi: 3 }
          : { lo: -3, hi: 3 };
    const secondDerivative = { lo: -160, hi: 160 };
    return {
      value: compactTestBump(u.value),
      first: u.first.map((entry) => multiply(firstDerivative, entry)) as [
        Interval,
        Interval,
        Interval,
      ],
      secondDiagonal: [0, 1, 2].map((axis) =>
        add(
          multiply(secondDerivative, square(u.first[axis])),
          multiply(firstDerivative, u.secondDiagonal[axis]),
        ),
      ) as [Interval, Interval, Interval],
    };
  }
  const uSquared = jetSquare(u);
  const exponent = jetDivide(
    uSquared,
    jetSubtract(jetConstant(exactIntegerInterval(1)), uSquared),
  );
  return jetNegativeExponential(exponent);
};

const evaluateConformalEinsteinIntegrandJets = (
  multiplier: readonly [number, number, number],
  u: readonly [
    SecondOrderIntervalJet,
    SecondOrderIntervalJet,
    SecondOrderIntervalJet,
  ],
): {
  denominator: SecondOrderIntervalJet;
  numerators: readonly SecondOrderIntervalJet[];
} => {
  const ratioHalfWidth = jetConstant(scalarInterval(0.04));
  const axes = [
    jetConstant(scalarInterval(0.25)),
    jetConstant(scalarInterval(0.05)),
    jetConstant(scalarInterval(0.05)),
  ];
  const normalizedCoordinates = u.map((entry, axis) =>
    jetAdd(
      jetConstant(scalarInterval(multiplier[axis])),
      jetMultiply(ratioHalfWidth, entry),
    ),
  );
  const ellipsoidalS = jetAddMany(
    normalizedCoordinates.map((entry) => jetSquare(entry)),
  );
  ellipsoidalS.value = clampNonnegative(ellipsoidalS.value);
  if (!(ellipsoidalS.value.hi < 1)) {
    return fail(
      "interval_derivation_failed",
      "A jet smear cell escaped the frozen support proof.",
    );
  }
  const oneMinusS = jetSubtract(
    jetConstant(exactIntegerInterval(1)),
    ellipsoidalS,
  );
  const bump = jetNegativeExponential(jetDivide(ellipsoidalS, oneMinusS));
  const amplitude = jetConstant(scalarInterval(0.000001));
  const omegaFactor = jetAdd(
    jetConstant(exactIntegerInterval(1)),
    jetMultiply(amplitude, bump),
  );
  const oneMinusSSquared = jetSquare(oneMinusS);
  const oneMinusSFourth = jetSquare(oneMinusSSquared);
  const bumpFirst = jetNegate(jetDivide(bump, oneMinusSSquared));
  const bumpSecond = jetDivide(
    jetMultiply(
      bump,
      jetSubtract(
        jetScale(ellipsoidalS, 2),
        jetConstant(exactIntegerInterval(1)),
      ),
    ),
    oneMinusSFourth,
  );
  const omegaFirstS = jetDivide(jetMultiply(amplitude, bumpFirst), omegaFactor);
  const omegaSecondS = jetSubtract(
    jetDivide(jetMultiply(amplitude, bumpSecond), omegaFactor),
    jetSquare(omegaFirstS),
  );
  const sGradients = normalizedCoordinates.map((entry, axis) =>
    jetDivide(jetScale(entry, 2), axes[axis]),
  );
  const sDiagonalHessians = axes.map((axis) =>
    jetDivide(jetConstant(exactIntegerInterval(2)), jetSquare(axis)),
  );
  const omegaGradients = sGradients.map((entry) =>
    jetMultiply(omegaFirstS, entry),
  );
  const omegaHessian = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => jetConstant(exactZero())),
  );
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const chain = jetMultiply(
        omegaSecondS,
        jetMultiply(sGradients[row], sGradients[column]),
      );
      omegaHessian[row][column] =
        row === column
          ? jetAdd(chain, jetMultiply(omegaFirstS, sDiagonalHessians[row]))
          : chain;
    }
  }
  const laplacian = jetAddMany([
    omegaHessian[0][0],
    omegaHessian[1][1],
    omegaHessian[2][2],
  ]);
  const gradientSquare = jetAddMany(
    omegaGradients.map((entry) => jetSquare(entry)),
  );
  const diagonalMetricTerm = jetAdd(jetScale(laplacian, 2), gradientSquare);
  const g00 = jetNegate(jetAdd(jetScale(laplacian, 2), gradientSquare));
  const spatial = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => jetConstant(exactZero())),
  );
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const base = jetAdd(
        jetScale(omegaHessian[row][column], -2),
        jetScale(jetMultiply(omegaGradients[row], omegaGradients[column]), 2),
      );
      spatial[row][column] =
        row === column ? jetAdd(base, diagonalMetricTerm) : base;
    }
  }
  const components = [
    g00,
    jetConstant(exactZero()),
    jetConstant(exactZero()),
    jetConstant(exactZero()),
    spatial[0][0],
    spatial[0][1],
    spatial[0][2],
    spatial[1][1],
    spatial[1][2],
    spatial[2][2],
  ];
  const omegaSquared = jetSquare(omegaFactor);
  const omegaFourth = jetSquare(omegaSquared);
  const qProduct = jetMultiply(
    jetMultiply(compactTestBumpJet(u[0]), compactTestBumpJet(u[1])),
    compactTestBumpJet(u[2]),
  );
  return {
    denominator: jetMultiply(qProduct, omegaFourth),
    numerators: components.map((entry) =>
      jetMultiply(qProduct, jetMultiply(omegaSquared, entry)),
    ),
  };
};

const midpointCellIntegralEnclosure = (
  centerValue: Interval,
  fullCellJet: SecondOrderIntervalJet,
  step: Interval,
  cellVolume: Interval,
): Interval => {
  const stepSquared = square(step);
  const derivativeRemainderDensity = fullCellJet.secondDiagonal.reduce(
    (sum, derivative) => {
      const maximumMagnitude = Math.max(
        Math.abs(derivative.lo),
        Math.abs(derivative.hi),
      );
      return add(
        sum,
        multiply(stepSquared, {
          lo: 0,
          hi: outwardUp(maximumMagnitude),
        }),
      );
    },
    exactZero(),
  );
  const remainder = divide(
    multiply(cellVolume, derivativeRemainderDensity),
    exactIntegerInterval(24),
  );
  const centerContribution = multiply(cellVolume, centerValue);
  return {
    lo: outwardDown(centerContribution.lo - remainder.hi),
    hi: outwardUp(centerContribution.hi + remainder.hi),
  };
};

const einsteinCouplingInterval = (): Interval => {
  const c = exactIntegerInterval(299792458);
  const cSquared = square(c);
  const cFourth = square(cSquared);
  const pi = {
    lo: 3.141592653589793,
    hi: 3.1415926535897936,
  };
  const gravitationalConstant = scalarInterval(6.6743e-11);
  return divide(
    cFourth,
    multiply(multiply(exactIntegerInterval(8), pi), gravitationalConstant),
  );
};

const integrateOneLevel = (
  multiplier: readonly [number, number, number],
  partitionsPerAxis: number,
): { denominator: Interval; components: Interval[] } => {
  const normalizedCells: Array<{ coordinate: Interval; midpoint: number }> = [];
  for (let index = 0; index < partitionsPerAxis; index += 1) {
    const lower = -1 + (2 * index) / partitionsPerAxis;
    const upper = -1 + (2 * (index + 1)) / partitionsPerAxis;
    const coordinate = { lo: outwardDown(lower), hi: outwardUp(upper) };
    normalizedCells.push({ coordinate, midpoint: (lower + upper) / 2 });
  }
  const step = scalarInterval(2 / partitionsPerAxis);
  const cellVolume = multiply(multiply(step, step), step);
  let denominator = exactZero();
  let denominatorNaturalDarboux = exactZero();
  const numerators = Array.from(
    { length: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_COMPONENT_COUNT },
    () => exactZero(),
  );
  for (let zIndex = 0; zIndex < normalizedCells.length; zIndex += 1) {
    for (let yIndex = 0; yIndex < normalizedCells.length; yIndex += 1) {
      for (let xIndex = 0; xIndex < normalizedCells.length; xIndex += 1) {
        const fullCell = evaluateConformalEinsteinIntegrandJets(multiplier, [
          jetVariable(normalizedCells[xIndex].coordinate, 0),
          jetVariable(normalizedCells[yIndex].coordinate, 1),
          jetVariable(normalizedCells[zIndex].coordinate, 2),
        ]);
        const center = evaluateConformalEinsteinIntegrandJets(multiplier, [
          jetVariable(
            {
              lo: normalizedCells[xIndex].midpoint,
              hi: normalizedCells[xIndex].midpoint,
            },
            0,
          ),
          jetVariable(
            {
              lo: normalizedCells[yIndex].midpoint,
              hi: normalizedCells[yIndex].midpoint,
            },
            1,
          ),
          jetVariable(
            {
              lo: normalizedCells[zIndex].midpoint,
              hi: normalizedCells[zIndex].midpoint,
            },
            2,
          ),
        ]);
        denominator = add(
          denominator,
          midpointCellIntegralEnclosure(
            center.denominator.value,
            fullCell.denominator,
            step,
            cellVolume,
          ),
        );
        denominatorNaturalDarboux = add(
          denominatorNaturalDarboux,
          multiply(fullCell.denominator.value, cellVolume),
        );
        for (let component = 0; component < numerators.length; component += 1) {
          numerators[component] = add(
            numerators[component],
            midpointCellIntegralEnclosure(
              center.numerators[component].value,
              fullCell.numerators[component],
              step,
              cellVolume,
            ),
          );
        }
      }
    }
  }
  denominator = intersect(denominator, denominatorNaturalDarboux);
  if (!(denominator.lo > 0)) {
    return fail(
      "interval_derivation_failed",
      "The denominator lower Darboux sum was not strictly positive.",
    );
  }
  const coupling = einsteinCouplingInterval();
  return {
    denominator,
    components: numerators.map((numerator) =>
      multiply(divide(numerator, denominator), coupling),
    ),
  };
};

const stableFrobenius = (components: readonly number[]): number => {
  let scaleValue = 0;
  for (let index = 0; index < components.length; index += 1) {
    scaleValue = Math.max(
      scaleValue,
      Math.sqrt(COMPONENT_MULTIPLICITIES[index]) * Math.abs(components[index]),
    );
  }
  if (scaleValue === 0) return 0;
  let normalizedSquares = 0;
  for (let index = 0; index < components.length; index += 1) {
    const normalized = components[index] / scaleValue;
    normalizedSquares +=
      COMPONENT_MULTIPLICITIES[index] * normalized * normalized;
  }
  return scaleValue * Math.sqrt(normalizedSquares);
};

const outwardSquaredFrobeniusSelfCheck = (
  centralComponents: readonly number[],
  errorComponents: readonly number[],
) => {
  const centralSquared = addMany(
    centralComponents.map((component, index) =>
      scale(
        square({ lo: component, hi: component }),
        COMPONENT_MULTIPLICITIES[index],
      ),
    ),
  );
  const errorSquared = addMany(
    errorComponents.map((component, index) =>
      scale(
        square({ lo: component, hi: component }),
        COMPONENT_MULTIPLICITIES[index],
      ),
    ),
  );
  const onePercentCentralSquared = multiply(
    centralSquared,
    scalarInterval(0.0001),
  );
  if (
    !(centralSquared.lo > 0) ||
    ![centralSquared.lo, errorSquared.hi, onePercentCentralSquared.lo].every(
      Number.isFinite,
    )
  ) {
    return fail(
      "interval_derivation_failed",
      "The outward squared Frobenius self-check was non-finite or degenerate.",
    );
  }
  const squaredRatioUpper = outwardUp(errorSquared.hi / centralSquared.lo);
  const displayedRatioUpper = outwardUp(Math.sqrt(squaredRatioUpper));
  return {
    deterministicErrorFrobeniusSquaredUpperSI2: errorSquared.hi,
    centralFrobeniusSquaredLowerSI2: centralSquared.lo,
    onePercentCentralFrobeniusSquaredLowerSI2: onePercentCentralSquared.lo,
    passed: errorSquared.hi <= onePercentCentralSquared.lo,
    displayedRatioUpper,
  };
};

type CanonicalMagnitudeTrace = {
  levels: Array<{
    partitionsPerAxis: number;
    cellCount: number;
    denominator: Interval;
    components: Interval[];
    cumulative: Interval[];
  }>;
  selected: Interval[];
};

const magnitudeKey = (multiplier: {
  x: string;
  y: string;
  z: string;
}): string =>
  [
    Math.abs(Number(multiplier.x)),
    Math.abs(Number(multiplier.y)),
    Math.abs(Number(multiplier.z)),
  ]
    .map((entry) => entry.toString())
    .join(":");

const parityFor = (multiplier: {
  x: string;
  y: string;
  z: string;
}): readonly [1, 1, 1, 1, 1, 1 | -1, 1 | -1, 1, 1 | -1, 1] => {
  const sx: 1 | -1 = Number(multiplier.x) < 0 ? -1 : 1;
  const sy: 1 | -1 = Number(multiplier.y) < 0 ? -1 : 1;
  const sz: 1 | -1 = Number(multiplier.z) < 0 ? -1 : 1;
  return [
    1,
    1,
    1,
    1,
    1,
    (sx * sy) as 1 | -1,
    (sx * sz) as 1 | -1,
    1,
    (sy * sz) as 1 | -1,
    1,
  ];
};

const parityTransformInterval = (value: Interval, parity: 1 | -1): Interval =>
  parity === 1 ? value : { lo: -value.hi, hi: -value.lo };

export const deriveNhm2ConformallyFlatNeedleMetricDemandIntervals =
  (): Nhm2ConformallyFlatNeedleMetricDemandDerivedArraysV1 => {
    const reference = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
    if (
      reference.sampling.sampleCount !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_SAMPLE_COUNT ||
      reference.tensorConvention.symmetricTensorComponentOrder.length !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_COMPONENT_COUNT
    ) {
      return fail(
        "interval_derivation_failed",
        "The frozen reference no longer has the required 64 by 10 shape.",
      );
    }

    const canonicalByMagnitude = new Map<string, CanonicalMagnitudeTrace>();
    for (const point of reference.sampling.samplePoints) {
      const key = magnitudeKey(point.multiplier);
      if (canonicalByMagnitude.has(key)) continue;
      const absoluteMultiplier = [
        Math.abs(Number(point.multiplier.x)),
        Math.abs(Number(point.multiplier.y)),
        Math.abs(Number(point.multiplier.z)),
      ] as const;
      const levels: CanonicalMagnitudeTrace["levels"] = [];
      let cumulative: Interval[] | null = null;
      for (const partitionsPerAxis of NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS) {
        const level = integrateOneLevel(absoluteMultiplier, partitionsPerAxis);
        cumulative =
          cumulative == null
            ? level.components
            : cumulative.map((entry, index) =>
                intersect(entry, level.components[index]),
              );
        levels.push({
          partitionsPerAxis,
          cellCount: partitionsPerAxis ** 3,
          denominator: level.denominator,
          components: level.components,
          cumulative: cumulative.map((entry) => ({ ...entry })),
        });
      }
      if (cumulative == null) {
        return fail(
          "interval_derivation_failed",
          "No refinement level executed.",
        );
      }
      canonicalByMagnitude.set(key, { levels, selected: cumulative });
    }

    const central = new Float64Array(
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_SAMPLE_COUNT *
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_COMPONENT_COUNT,
    );
    const deterministicAbsoluteErrorBound = new Float64Array(central.length);
    const samples: Nhm2ConformallyFlatNeedleMetricDemandIntervalSampleTraceV1[] =
      [];
    let maximumRelativeFrobeniusEnclosure = 0;
    let minimumDenominatorLowerBound = Number.POSITIVE_INFINITY;
    let strictlyPositiveComponentErrorBoundCount = 0;
    let allCumulativeWidthsNonincreasing = true;
    let allSquaredSelfChecksPass = true;

    for (const point of reference.sampling.samplePoints) {
      const key = magnitudeKey(point.multiplier);
      const canonical = canonicalByMagnitude.get(key);
      if (canonical == null) {
        return fail(
          "interval_derivation_failed",
          "Missing exact parity source.",
        );
      }
      const parity = parityFor(point.multiplier);
      const levels = canonical.levels.map((level) => {
        const transformedComponents = level.components.map((entry, index) =>
          parityTransformInterval(entry, parity[index]),
        );
        const transformedCumulative = level.cumulative.map((entry, index) =>
          parityTransformInterval(entry, parity[index]),
        );
        minimumDenominatorLowerBound = Math.min(
          minimumDenominatorLowerBound,
          level.denominator.lo,
        );
        return {
          partitionsPerAxis: level.partitionsPerAxis,
          cellCount: level.cellCount,
          denominatorIntegral: serializeInterval(level.denominator),
          denominatorStrictlyPositive: true as const,
          componentDemandIntervalsSI:
            transformedComponents.map(serializeInterval),
          cumulativeIntersectionIntervalsSI:
            transformedCumulative.map(serializeInterval),
          cumulativeWidthsSI: transformedCumulative.map(width),
        };
      });
      for (let levelIndex = 1; levelIndex < levels.length; levelIndex += 1) {
        for (let component = 0; component < 10; component += 1) {
          if (
            levels[levelIndex].cumulativeWidthsSI[component] >
            levels[levelIndex - 1].cumulativeWidthsSI[component]
          ) {
            allCumulativeWidthsNonincreasing = false;
          }
        }
      }
      const selected = canonical.selected.map((entry, index) =>
        parityTransformInterval(entry, parity[index]),
      );
      const centralComponents: number[] = [];
      const errorComponents: number[] = [];
      selected.forEach((interval, component) => {
        const midpoint = interval.lo + (interval.hi - interval.lo) / 2;
        if (
          !Number.isFinite(midpoint) ||
          midpoint < interval.lo ||
          midpoint > interval.hi
        ) {
          return fail(
            "interval_derivation_failed",
            "A selected interval midpoint was not finite and internal.",
          );
        }
        const error = Math.max(
          Number.MIN_VALUE,
          outwardUp(Math.max(midpoint - interval.lo, interval.hi - midpoint)),
        );
        const offset = point.ordinal * 10 + component;
        central[offset] = midpoint;
        deterministicAbsoluteErrorBound[offset] = error;
        centralComponents.push(midpoint);
        errorComponents.push(error);
        if (error > 0) strictlyPositiveComponentErrorBoundCount += 1;
      });
      const centralFrobeniusSI = stableFrobenius(centralComponents);
      const deterministicErrorFrobeniusSI = stableFrobenius(errorComponents);
      const squaredSelfCheck = outwardSquaredFrobeniusSelfCheck(
        centralComponents,
        errorComponents,
      );
      const relativeFrobeniusEnclosure = squaredSelfCheck.displayedRatioUpper;
      if (
        !Number.isFinite(relativeFrobeniusEnclosure) ||
        !(centralFrobeniusSI > 0)
      ) {
        return fail(
          "interval_derivation_failed",
          "A sample Frobenius enclosure was non-finite or degenerate.",
        );
      }
      maximumRelativeFrobeniusEnclosure = Math.max(
        maximumRelativeFrobeniusEnclosure,
        relativeFrobeniusEnclosure,
      );
      allSquaredSelfChecksPass &&= squaredSelfCheck.passed;
      samples.push({
        ordinal: point.ordinal,
        multiplier: { ...point.multiplier },
        inertialConformalCoordinatesM: {
          ...point.inertialConformalCoordinatesM,
        },
        symmetrySourceKey: key,
        parityTransform: parity,
        levels,
        selectedComponentIntervalsSI: selected.map(serializeInterval),
        centralComponentsSI: centralComponents,
        deterministicAbsoluteErrorBoundsSI: errorComponents,
        centralFrobeniusSI,
        deterministicErrorFrobeniusSI,
        relativeFrobeniusEnclosure,
        outwardSquaredSelfCheck: {
          deterministicErrorFrobeniusSquaredUpperSI2:
            squaredSelfCheck.deterministicErrorFrobeniusSquaredUpperSI2,
          centralFrobeniusSquaredLowerSI2:
            squaredSelfCheck.centralFrobeniusSquaredLowerSI2,
          onePercentCentralFrobeniusSquaredLowerSI2:
            squaredSelfCheck.onePercentCentralFrobeniusSquaredLowerSI2,
          passed: squaredSelfCheck.passed,
        },
      });
    }

    if (
      strictlyPositiveComponentErrorBoundCount !== 640 ||
      !allCumulativeWidthsNonincreasing ||
      !(minimumDenominatorLowerBound > 0)
    ) {
      return fail(
        "interval_derivation_failed",
        "A structural interval invariant failed before the frozen numerical gate.",
      );
    }

    const frozenGateDisposition = allSquaredSelfChecksPass
      ? ("producer_self_check_met_but_not_server_replayed" as const)
      : ("frozen_enclosure_target_failed_without_retuning" as const);

    const trace: Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1 = {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION,
      authority:
        "producer_generated_diagnostic_interval_trace_not_server_replay",
      configuration: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION,
      configurationSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
      derivation: {
        conformalEinsteinTensorFormula:
          "G_AB=-2*omega_,AB+2*omega_,A*omega_,B+2*eta_AB*box_eta(omega)+eta_AB*(partial_omega)^2 in conformal-inertial coordinate components before the equivalent pulled-back tetrad projection",
        orthonormalSmearFormula:
          "D_n,AB=(c^4/(8*pi*G))*integral(qx*qy*qz*Omega^2*G_AB*d3u)/integral(qx*qy*qz*Omega^4*d3u); pullback by F and projection on F_*^-1(Omega^-1*d/dX^A) preserve these component labels",
        compactBumpDerivativeIdentities: {
          first: "db/ds=-b/(1-s)^2",
          second: "d2b/ds2=b*(2*s-1)/(1-s)^4",
        },
        integrationEnclosureFormula:
          "for_each_cell_I: integral_I(f) is enclosed by volume(I)*f(midpoint(I)) plus_or_minus volume(I)*sum_i(h_i^2*sup_I|partial_i^2 f|)/24; every f(midpoint) and pure_second_derivative is interval_evaluated; denominator also intersects a positive natural_Darboux enclosure",
        compactTestBumpBoundaryDerivativeProof:
          "with t=1/(1-u^2)>=1: |q'|=2*|u|*e^(1-t)*t^2<3; q''=e^(1-t)*(4*t^4-12*t^3+6*t^2), whose absolute value is <=54 on 1<=t<=3 by endpoint_and_stationary_point_check and <1024/e^3<51 for t>=3; implementation widens to |q''|<=160",
        exactZeroComponents: ["T01", "T02", "T03"],
        exactZeroReason:
          "static_conformal_factor_and_diagonal_conformal_inertial_metric",
      },
      arithmeticEvidence: {
        primitiveOutwardRoundingApplied: true,
        elementaryExponentialRemainderBoundApplied: true,
        refinementDeltaUsedAsSoleErrorProof: false,
        eachLevelIndependentlyEnclosesTheIntegral: true,
        cumulativeIntersectionOfValidEnclosures: true,
        denominatorPositiveAtEverySampleAndLevel: true,
        compositeMidpointPureSecondDerivativeRemainderApplied: true,
        naturalDenominatorIntersectionApplied: true,
        hardTargetUsesOutwardSquaredComparison: true,
        producerSelfCheckIsNotServerProof: true,
      },
      samples,
      summary: {
        sampleCount: 64,
        componentCount: 10,
        strictlyPositiveComponentErrorBoundCount: 640,
        allComponentErrorBoundsStrictlyPositive: true,
        maximumRelativeFrobeniusEnclosure,
        frozenRelativeEnclosureTarget: 0.01,
        targetMetAtEverySample: allSquaredSelfChecksPass,
        frozenGateDisposition,
        minimumDenominatorLowerBound,
        allDenominatorLowerBoundsStrictlyPositive: true,
        allCumulativeWidthsNonincreasing: true,
      },
      authorityBlockers:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS,
      claimLocks: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
    };
    return { central, deterministicAbsoluteErrorBound, trace };
  };

const float64LeBytes = (values: Float64Array): Buffer => {
  const bytes = Buffer.alloc(values.length * 8);
  for (let index = 0; index < values.length; index += 1) {
    bytes.writeDoubleLE(values[index], index * 8);
  }
  return bytes;
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value))
    return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const samePath = (left: string, right: string): boolean =>
  process.platform === "win32"
    ? left.toLocaleLowerCase("en-US") === right.toLocaleLowerCase("en-US")
    : left === right;

const isPathInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

const assertExactProducerInputSurface = (input: unknown): void => {
  if (
    input == null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    return fail(
      "producer_input_invalid",
      "Producer input must be a plain object.",
    );
  }
  const required = [
    "outputParentDirectory",
    "repositoryRoot",
    "priorTerminalObservationDirectory",
    "externalWallTimeCeilingMs",
  ] as const;
  const allowed = new Set<string>([...required, "now", "invocationNonce"]);
  const keys = Reflect.ownKeys(input);
  if (
    keys.some((key) => typeof key !== "string" || !allowed.has(key)) ||
    required.some((key) => !Object.hasOwn(input, key))
  ) {
    return fail(
      "producer_input_invalid",
      "Producer input keys must match the exact bounded surface.",
    );
  }
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (
    (keys as string[]).some((key) => {
      const descriptor = descriptors[key];
      return (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      );
    })
  ) {
    return fail(
      "producer_input_invalid",
      "Producer input must contain only enumerable data properties.",
    );
  }
};

const assertExistingIdentityDirectory = async (
  value: unknown,
  role: "output_parent" | "repository",
): Promise<string> => {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    return fail("producer_input_invalid", `${role} must be an absolute path.`);
  }
  const resolved = path.resolve(value);
  if (path.parse(resolved).root === resolved) {
    return fail(
      "producer_input_invalid",
      `${role} cannot be a filesystem root.`,
    );
  }
  try {
    const [stats, realPath] = await Promise.all([
      fs.lstat(resolved),
      fs.realpath(resolved),
    ]);
    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      !samePath(realPath, resolved)
    ) {
      return fail(
        role === "repository"
          ? "repository_provenance_observation_failed"
          : "output_parent_invalid",
        `${role} must be a non-symlink identity-preserving directory.`,
      );
    }
    return resolved;
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      role === "repository"
        ? "repository_provenance_observation_failed"
        : "output_parent_invalid",
      `${role} could not be securely resolved.`,
      { cause: error },
    );
  }
};

const hashStableRegularFile = async (
  absolutePath: string,
  maximumSizeBytes: bigint,
): Promise<string> => {
  const before = await fs.lstat(absolutePath, { bigint: true });
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.size <= 0n ||
    before.size > maximumSizeBytes
  ) {
    return fail(
      "implementation_hash_observation_failed",
      "A provenance input is not a bounded regular file.",
    );
  }
  const digest = await new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    let observedBytes = 0n;
    const stream = createReadStream(absolutePath);
    stream.on("data", (chunk: Buffer) => {
      observedBytes += BigInt(chunk.byteLength);
      if (observedBytes > maximumSizeBytes) {
        stream.destroy(new Error("provenance_file_size_limit_exceeded"));
        return;
      }
      hash.update(chunk);
    });
    stream.on("error", reject);
    stream.on("end", () =>
      observedBytes === before.size
        ? resolve(hash.digest("hex"))
        : reject(new Error("provenance_file_size_changed")),
    );
  });
  const after = await fs.lstat(absolutePath, { bigint: true });
  if (
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs ||
    before.ctimeNs !== after.ctimeNs ||
    before.mode !== after.mode
  ) {
    return fail(
      "implementation_hash_observation_failed",
      "A provenance input changed while it was hashed.",
    );
  }
  return digest;
};

const observeRepository = async (
  repositoryRoot: string,
): Promise<{ gitCommitSha: string; gitWorktreeState: "clean" | "dirty" }> => {
  try {
    const [head, status] = await Promise.all([
      execFileAsync("git", ["-C", repositoryRoot, "rev-parse", "HEAD"], {
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      }),
      execFileAsync(
        "git",
        [
          "-C",
          repositoryRoot,
          "status",
          "--porcelain=v1",
          "--untracked-files=all",
        ],
        { windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      ),
    ]);
    const gitCommitSha = head.stdout.trim();
    if (!/^[a-f0-9]{40}$/.test(gitCommitSha)) {
      return fail(
        "repository_provenance_observation_failed",
        "Git HEAD was not a full SHA-1 object identifier.",
      );
    }
    return {
      gitCommitSha,
      gitWorktreeState: status.stdout.length === 0 ? "clean" : "dirty",
    };
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      "repository_provenance_observation_failed",
      "Git provenance could not be observed without a shell.",
      { cause: error },
    );
  }
};

const observeImplementation = async (
  repositoryRoot: string,
): Promise<{
  implementationSourceSha256: string;
  dependencyLockSha256: string;
  toolchainArtifactSha256: string;
  executableSha256: string;
}> => {
  const dependencyLockPath = path.join(repositoryRoot, "package-lock.json");
  try {
    const [sourceRealPath, lockRealPath, executableRealPath] =
      await Promise.all([
        fs.realpath(THIS_SOURCE_PATH),
        fs.realpath(dependencyLockPath),
        fs.realpath(process.execPath),
      ]);
    if (
      !samePath(sourceRealPath, THIS_SOURCE_PATH) ||
      !samePath(lockRealPath, dependencyLockPath) ||
      !samePath(executableRealPath, path.resolve(process.execPath)) ||
      !isPathInside(repositoryRoot, sourceRealPath) ||
      !isPathInside(repositoryRoot, lockRealPath)
    ) {
      return fail(
        "implementation_hash_observation_failed",
        "A source, dependency lock, or executable path changed identity.",
      );
    }
    const [implementationSourceSha256, dependencyLockSha256, executableSha256] =
      await Promise.all([
        hashStableRegularFile(sourceRealPath, 8n * 1024n * 1024n),
        hashStableRegularFile(lockRealPath, 64n * 1024n * 1024n),
        hashStableRegularFile(executableRealPath, 256n * 1024n * 1024n),
      ]);
    return {
      implementationSourceSha256,
      dependencyLockSha256,
      toolchainArtifactSha256: executableSha256,
      executableSha256,
    };
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      "implementation_hash_observation_failed",
      "Implementation provenance hashes could not be observed.",
      { cause: error },
    );
  }
};

const exclusiveCreateDirectory = async (
  parent: string,
  invocationId: string,
): Promise<string> => {
  const outputDirectory = path.join(
    parent,
    `nhm2-conformal-demand-${invocationId.slice(0, 24)}`,
  );
  try {
    await fs.mkdir(outputDirectory, { recursive: false, mode: 0o700 });
    const [stats, realPath] = await Promise.all([
      fs.lstat(outputDirectory),
      fs.realpath(outputDirectory),
    ]);
    if (
      !stats.isDirectory() ||
      stats.isSymbolicLink() ||
      !samePath(realPath, outputDirectory)
    ) {
      return fail(
        "output_directory_create_failed",
        "The newly created output directory failed identity checks.",
      );
    }
    return realPath;
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      "output_directory_create_failed",
      "The run-specific output directory was not created exclusively.",
      { cause: error },
    );
  }
};

const writeExclusive = async (
  absolutePath: string,
  bytes: Buffer,
): Promise<void> => {
  let handle: fs.FileHandle | null = null;
  try {
    handle = await fs.open(
      absolutePath,
      fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
      0o600,
    );
    let offset = 0;
    while (offset < bytes.byteLength) {
      const result = await handle.write(
        bytes,
        offset,
        bytes.byteLength - offset,
        offset,
      );
      if (result.bytesWritten <= 0) throw new Error("zero_length_write");
      offset += result.bytesWritten;
    }
    await handle.sync();
  } catch (error) {
    return fail(
      "output_write_failed",
      "An output was not created exclusively.",
      {
        cause: error,
      },
    );
  } finally {
    await handle?.close().catch(() => undefined);
  }
};

const secureRead = async (
  runDirectory: string,
  requests: readonly {
    relativePath: string;
    bytes: Buffer;
    float64Shape?: readonly number[];
  }[],
): Promise<readonly Nhm2SecureRunOutputReadFileV1[]> => {
  try {
    const result = await readNhm2SecureRunOutputs({
      runDirectory,
      files: requests.map((request) => ({
        relativePath: request.relativePath,
        expectedSha256: sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
          request.bytes,
        ),
        expectedSizeBytes: BigInt(request.bytes.byteLength),
        decode:
          request.float64Shape == null
            ? { kind: "bytes" as const }
            : { kind: "float64_le" as const, shape: request.float64Shape },
      })),
      maxFileBytes: MAX_TRACE_BYTES,
      maxAggregateBytes: 32n * 1024n * 1024n,
    });
    const filesByRelativePath = new Map(
      result.files.map((file) => [file.relativePath, file]),
    );
    const requestOrderedFiles = requests.map((request) => {
      const file = filesByRelativePath.get(request.relativePath);
      if (file == null || !file.bytes.equals(request.bytes)) {
        return fail(
          "output_secure_readback_mismatch",
          `Securely reread output changed or disappeared: ${request.relativePath}.`,
        );
      }
      return file;
    });
    return requestOrderedFiles;
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      "output_secure_readback_failed",
      "Run outputs failed the bounded secure reread.",
      {
        cause: error,
        detailCode:
          error instanceof Nhm2SecureRunOutputReaderError ? error.code : null,
      },
    );
  }
};

const observePriorTerminalPartial = async (
  directoryInput: unknown,
): Promise<{
  outputDirectoryAbsolutePath: string;
  centralBytes: Buffer;
  errorBytes: Buffer;
  centralSha256: string;
  errorSha256: string;
  traceSha256: string;
  traceBytes: Buffer;
  outputs: Nhm2ConformallyFlatNeedleMetricDemandPriorTerminalOutputV1[];
}> => {
  const directory = await assertExistingIdentityDirectory(
    directoryInput,
    "output_parent",
  );
  const relativePaths = [
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
  ] as const;
  const frozenOutputs =
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V2_FIRST_TERMINAL_PARTIAL_OBSERVATION.outputs;
  let reread: readonly Nhm2SecureRunOutputReadFileV1[];
  try {
    const result = await readNhm2SecureRunOutputs({
      runDirectory: directory,
      files: frozenOutputs.map((output, index) => ({
        relativePath: output.relativePath,
        expectedSha256: output.sha256,
        expectedSizeBytes: BigInt(output.sizeBytes),
        decode:
          index < 2
            ? ({ kind: "float64_le", shape: [64, 10] } as const)
            : ({ kind: "bytes" } as const),
      })),
      maxFileBytes: MAX_TRACE_BYTES,
      maxAggregateBytes: 32n * 1024n * 1024n,
    });
    const byPath = new Map<string, Nhm2SecureRunOutputReadFileV1>(
      result.files.map((file) => [file.relativePath, file]),
    );
    reread = relativePaths.map((relativePath) => {
      const file = byPath.get(relativePath);
      if (file == null) {
        return fail(
          "prior_terminal_observation_invalid",
          "The prior terminal partial is missing a frozen output.",
        );
      }
      return file;
    });
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      "prior_terminal_observation_invalid",
      "The prior terminal partial failed its bounded secure observation.",
      {
        cause: error,
        detailCode:
          error instanceof Nhm2SecureRunOutputReaderError ? error.code : null,
      },
    );
  }
  let trace: Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1;
  try {
    const text = reread[2].bytes.toString("utf8");
    trace = JSON.parse(
      text,
    ) as Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1;
    if (
      canonicalNhm2ConformallyFlatNeedleMetricDemandJson(trace) !== text ||
      trace.artifactId !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID ||
      trace.contractVersion !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION ||
      trace.configurationSha256 !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
      trace.summary.frozenGateDisposition !==
        "frozen_enclosure_target_failed_without_retuning" ||
      trace.summary.targetMetAtEverySample !== false ||
      !Object.is(
        trace.summary.maximumRelativeFrobeniusEnclosure,
        0.12854082269732725,
      ) ||
      trace.summary.frozenRelativeEnclosureTarget !== 0.01 ||
      Object.values(trace.claimLocks).some((entry) => entry !== false)
    ) {
      return fail(
        "prior_terminal_observation_invalid",
        "The prior terminal trace is not the frozen v2 failure observation.",
      );
    }
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandIntervalProducerError
    ) {
      throw error;
    }
    return fail(
      "prior_terminal_observation_invalid",
      "The prior terminal trace is not canonical frozen v2 JSON.",
      { cause: error },
    );
  }
  const roles = [
    "metric_demand_tensor",
    "metric_demand_absolute_error_bound",
    "metric_demand_interval_trace",
  ] as const;
  const frozenObservationMatches = reread.every((file, index) => {
    const frozen = frozenOutputs[index];
    return (
      frozen != null &&
      file.relativePath === frozen.relativePath &&
      file.sha256 === frozen.sha256 &&
      Number(file.sizeBytes) === frozen.sizeBytes
    );
  });
  if (!frozenObservationMatches) {
    return fail(
      "prior_terminal_observation_invalid",
      "The prior terminal output bytes do not match the frozen first-v2 observation.",
    );
  }
  return {
    outputDirectoryAbsolutePath: directory,
    centralBytes: reread[0].bytes,
    errorBytes: reread[1].bytes,
    centralSha256: reread[0].sha256,
    errorSha256: reread[1].sha256,
    traceSha256: reread[2].sha256,
    traceBytes: reread[2].bytes,
    outputs: reread.map((file, index) => ({
      role: roles[index],
      relativePath: file.relativePath,
      absolutePath: file.absolutePath,
      sha256: file.sha256,
      sizeBytes: Number(file.sizeBytes),
      freshness:
        "preexisting_terminal_partial_securely_reread_for_reproduction" as const,
      filesystemIdentity: { ...file.filesystemIdentity },
    })),
  };
};

const nowIso = (clock: () => Date): string => {
  const value = clock();
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    return fail(
      "producer_input_invalid",
      "The server clock returned an invalid Date.",
    );
  }
  return value.toISOString();
};

const canonicalBytes = (value: unknown): Buffer =>
  Buffer.from(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(value),
    "utf8",
  );

const derivationReceiptHash = (
  receipt: Omit<
    Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1,
    "integrity"
  > & {
    integrity: Omit<
      Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1["integrity"],
      "receiptSha256"
    >;
  },
): string =>
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(receipt),
  );

const outputMetadata = (
  role: Nhm2ConformallyFlatNeedleMetricDemandOutputFileV1["role"],
  file: Nhm2SecureRunOutputReadFileV1,
): Nhm2ConformallyFlatNeedleMetricDemandOutputFileV1 => ({
  role,
  relativePath: file.relativePath,
  absolutePath: file.absolutePath,
  sha256: file.sha256,
  sizeBytes: Number(file.sizeBytes),
  freshness: "created_new_during_execution",
  prestate: "absent_observed_before_exclusive_create",
  secureReadbackVerified: true,
  filesystemIdentity: { ...file.filesystemIdentity },
});

export const produceNhm2ConformallyFlatNeedleMetricDemandIntervals = async (
  input: ProduceNhm2ConformallyFlatNeedleMetricDemandIntervalInput,
): Promise<ProduceNhm2ConformallyFlatNeedleMetricDemandIntervalResult> => {
  assertExactProducerInputSurface(input);
  if (input.externalWallTimeCeilingMs !== 600000) {
    return fail(
      "producer_input_invalid",
      "The receipt-capture reproduction requires the frozen 600000 ms caller wall-time ceiling.",
    );
  }
  const heapCeilingProcessArgumentObserved = process.execArgv.some((entry) =>
    /^--max[-_]old[-_]space[-_]size=2304$/.test(entry),
  );
  if (!heapCeilingProcessArgumentObserved) {
    return fail(
      "producer_input_invalid",
      "The receipt-capture reproduction requires Node --max-old-space-size=2304.",
    );
  }
  const observedNodeHeapLimitBytes = getHeapStatistics().heap_size_limit;
  if (
    !Number.isSafeInteger(observedNodeHeapLimitBytes) ||
    observedNodeHeapLimitBytes <= 0
  ) {
    return fail(
      "producer_input_invalid",
      "The Node heap limit could not be observed.",
    );
  }
  if (input.now != null && typeof input.now !== "function") {
    return fail("producer_input_invalid", "now must be a function.");
  }
  if (
    input.invocationNonce != null &&
    typeof input.invocationNonce !== "function"
  ) {
    return fail(
      "producer_input_invalid",
      "invocationNonce must be a function.",
    );
  }
  const clock = input.now ?? (() => new Date());
  const nonceProvider = input.invocationNonce ?? (() => randomBytes(32));
  const parent = await assertExistingIdentityDirectory(
    input.outputParentDirectory,
    "output_parent",
  );
  const repositoryRoot = await assertExistingIdentityDirectory(
    input.repositoryRoot,
    "repository",
  );
  const startedAt = nowIso(clock);
  const startedNs = process.hrtime.bigint();
  const priorTerminal = await observePriorTerminalPartial(
    input.priorTerminalObservationDirectory,
  );
  const nonce = nonceProvider();
  if (!(nonce instanceof Uint8Array) || nonce.byteLength !== 32) {
    return fail(
      "producer_input_invalid",
      "invocationNonce must return exactly 32 bytes.",
    );
  }
  const invocationId = sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    Buffer.concat([
      Buffer.from(
        `${NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256}\n${startedAt}\n`,
        "utf8",
      ),
      Buffer.from(nonce),
    ]),
  );
  const repository = await observeRepository(repositoryRoot);
  const implementation = await observeImplementation(repositoryRoot);
  const derived = deriveNhm2ConformallyFlatNeedleMetricDemandIntervals();
  const centralBytes = float64LeBytes(derived.central);
  const errorBytes = float64LeBytes(derived.deterministicAbsoluteErrorBound);
  if (
    centralBytes.byteLength !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES ||
    errorBytes.byteLength !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES
  ) {
    return fail(
      "interval_derivation_failed",
      "The encoded array size drifted.",
    );
  }
  const traceBytes = canonicalBytes(derived.trace);
  if (BigInt(traceBytes.byteLength) > MAX_TRACE_BYTES) {
    return fail(
      "interval_derivation_failed",
      "The interval trace exceeded the frozen resource bound.",
    );
  }
  const centralSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(centralBytes);
  const errorSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(errorBytes);
  const traceSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(traceBytes);
  if (
    !centralBytes.equals(priorTerminal.centralBytes) ||
    !errorBytes.equals(priorTerminal.errorBytes) ||
    !traceBytes.equals(priorTerminal.traceBytes) ||
    centralSha256 !== priorTerminal.centralSha256 ||
    errorSha256 !== priorTerminal.errorSha256 ||
    traceSha256 !== priorTerminal.traceSha256 ||
    derived.trace.summary.frozenGateDisposition !==
      "frozen_enclosure_target_failed_without_retuning" ||
    derived.trace.summary.targetMetAtEverySample !== false ||
    !Object.is(
      derived.trace.summary.maximumRelativeFrobeniusEnclosure,
      0.12854082269732725,
    ) ||
    derived.trace.summary.frozenRelativeEnclosureTarget !== 0.01
  ) {
    return fail(
      "prior_terminal_observation_invalid",
      "The receipt-capture reproduction did not bitwise reproduce the frozen terminal v2 failure.",
    );
  }
  const [repositoryAfterCalculation, implementationAfterCalculation] =
    await Promise.all([
      observeRepository(repositoryRoot),
      observeImplementation(repositoryRoot),
    ]);
  if (
    repositoryAfterCalculation.gitCommitSha !== repository.gitCommitSha ||
    implementationAfterCalculation.implementationSourceSha256 !==
      implementation.implementationSourceSha256 ||
    implementationAfterCalculation.dependencyLockSha256 !==
      implementation.dependencyLockSha256 ||
    implementationAfterCalculation.toolchainArtifactSha256 !==
      implementation.toolchainArtifactSha256 ||
    implementationAfterCalculation.executableSha256 !==
      implementation.executableSha256
  ) {
    return fail(
      "implementation_hash_observation_failed",
      "The repository head or implementation provenance changed across the calculation.",
    );
  }
  const outputDirectoryRealPath = await exclusiveCreateDirectory(
    parent,
    invocationId,
  );
  const scienceOutputRequests = [
    {
      relativePath:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
      bytes: centralBytes,
      float64Shape: [64, 10] as const,
    },
    {
      relativePath: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
      bytes: errorBytes,
      float64Shape: [64, 10] as const,
    },
    {
      relativePath: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
      bytes: traceBytes,
    },
  ];
  for (const request of scienceOutputRequests) {
    await writeExclusive(
      path.join(outputDirectoryRealPath, request.relativePath),
      request.bytes,
    );
  }
  await secureRead(outputDirectoryRealPath, scienceOutputRequests);
  const preliminaryCompletedAt = nowIso(clock);
  const preliminaryDurationMs =
    Number(process.hrtime.bigint() - startedNs) / 1e6;
  if (Date.parse(preliminaryCompletedAt) < Date.parse(startedAt)) {
    return fail("producer_input_invalid", "The server clock moved backward.");
  }
  const derivationUnsigned = {
    artifactId:
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
    candidateId: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID,
    inputBindings: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
    derivation: {
      formulaId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID,
      algorithmId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID,
      enclosureMethod:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
      coverage: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
      relativeEnclosureTarget: 0.01 as const,
      boundScope:
        "deterministic_numerical_error_only_physical_constant_uncertainty_excluded" as const,
      zeroBoundDisposition:
        "strictly_positive_componentwise_bounds_required_pending_exact_zero_derivation_replay" as const,
      constants: {
        speedOfLightMetersPerSecond: 299792458 as const,
        newtonianGravitationalConstantSI: 6.6743e-11 as const,
        newtonianGravitationalConstantStandardUncertaintySI: 1.5e-15 as const,
        einsteinCouplingConvention: "T_hat_ab=(c^4/(8*pi*G))*G_hat_ab" as const,
      },
      intervalTraceSha256: traceSha256,
    },
    implementation: {
      sourceSha256: implementation.implementationSourceSha256,
      dependencyLockSha256: implementation.dependencyLockSha256,
      toolchainArtifactSha256: implementation.toolchainArtifactSha256,
      executableSha256: implementation.executableSha256,
    },
    execution: {
      authority: "executor_observed" as const,
      gitCommitSha: repository.gitCommitSha,
      command: process.execPath,
      argv: [...process.execArgv, ...process.argv.slice(1)],
      startedAt,
      completedAt: preliminaryCompletedAt,
      durationMs: preliminaryDurationMs,
      exitCode: 0 as const,
    },
    outputs: {
      centralTensor: {
        inputId: "metric_demand_tensor" as const,
        sha256: centralSha256,
        sizeBytes: 5120 as const,
        freshness: "created_or_modified_during_execution" as const,
      },
      deterministicAbsoluteErrorBound: {
        inputId: "metric_demand_absolute_error_bound" as const,
        sha256: errorSha256,
        sizeBytes: 5120 as const,
        unit: "J/m^3" as const,
        shape: [64, 10] as [64, 10],
        componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
        freshness: "created_or_modified_during_execution" as const,
      },
      intervalTrace: {
        sha256: traceSha256,
        sizeBytes: traceBytes.byteLength,
        freshness: "created_or_modified_during_execution" as const,
      },
    },
    verificationStatus:
      "metric_demand_derivation_executor_provenance_unverified" as const,
    claimLocks: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
    integrity: {
      hashAlgorithm: "sha256" as const,
      canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
    },
  };
  const derivationReceipt: Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1 =
    {
      ...derivationUnsigned,
      integrity: {
        ...derivationUnsigned.integrity,
        receiptSha256: derivationReceiptHash(derivationUnsigned),
      },
    };
  const derivationReceiptBytes = canonicalBytes(derivationReceipt);
  const initialRequests = [
    ...scienceOutputRequests,
    {
      relativePath:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME,
      bytes: derivationReceiptBytes,
    },
  ];
  await writeExclusive(
    path.join(
      outputDirectoryRealPath,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME,
    ),
    derivationReceiptBytes,
  );
  const initialRead = await secureRead(
    outputDirectoryRealPath,
    initialRequests,
  );
  const roles = [
    "metric_demand_tensor",
    "metric_demand_absolute_error_bound",
    "metric_demand_interval_trace",
    "metric_demand_derivation_receipt",
  ] as const;
  const outputs = initialRead.map((file, index) =>
    outputMetadata(roles[index], file),
  );
  const observedPeakRssBytes = process.resourceUsage().maxRSS * 1024;
  const processPeakRssBytes =
    Number.isSafeInteger(observedPeakRssBytes) && observedPeakRssBytes > 0
      ? observedPeakRssBytes
      : null;
  const completedAt = nowIso(clock);
  const durationMs = Number(process.hrtime.bigint() - startedNs) / 1e6;
  if (Date.parse(completedAt) < Date.parse(startedAt)) {
    return fail("producer_input_invalid", "The server clock moved backward.");
  }
  const unsignedRunReceipt = {
    artifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_RUN_CONTRACT_VERSION,
    authority: "server_executor_observation_diagnostic_only" as const,
    status: "outputs_exclusively_created_and_securely_reread" as const,
    runMode: "receipt_capture_reproduction_of_terminal_v2_failure" as const,
    configurationSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
    executionObservation: {
      invocationId,
      repositoryRoot,
      gitCommitSha: repository.gitCommitSha,
      gitWorktreeState: repository.gitWorktreeState,
      command: process.execPath,
      argv: [...process.execArgv, ...process.argv.slice(1)],
      startedAt,
      completedAt,
      durationMs,
      exitCode: 0 as const,
      implementationSourceSha256: implementation.implementationSourceSha256,
      dependencyLockSha256: implementation.dependencyLockSha256,
      toolchainArtifactSha256: implementation.toolchainArtifactSha256,
      executableSha256: implementation.executableSha256,
      observationLimit:
        "host_process_observed_in_process_operation_not_independent_replay" as const,
      implementationHashesStableAcrossCalculation: true as const,
    },
    outputDirectory: {
      absolutePath: outputDirectoryRealPath,
      prestate: "absent_observed_before_exclusive_create" as const,
      creation: "directory_created_exclusively" as const,
      freshness: "new" as const,
    },
    outputs,
    priorTerminalObservation: {
      authority: "unauthenticated_partial_terminal_output_observation" as const,
      outputDirectoryAbsolutePath: priorTerminal.outputDirectoryAbsolutePath,
      configurationSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
      implementationSourceSha256: null,
      executorReceiptPresent: false as const,
      numericalGate: "frozen_enclosure_target_failed_without_retuning" as const,
      maximumRelativeFrobeniusEnclosure: 0.12854082269732725 as const,
      frozenRelativeEnclosureTarget: 0.01 as const,
      outputs: priorTerminal.outputs,
    },
    bitwiseReproduction: {
      centralTensorSha256Identical: true as const,
      deterministicErrorBoundSha256Identical: true as const,
      intervalTraceSha256Identical: true as const,
      allThreeOutputsBitwiseIdentical: true as const,
    },
    resourceObservation: {
      requestedNodeHeapCeilingMegabytes: 2304 as const,
      nodeHeapCeilingProcessArgumentObserved: true as const,
      observedNodeHeapLimitBytes,
      callerDeclaredExternalWallTimeCeilingMs: 600000 as const,
      externalWallTimeEnforcement:
        "caller_wrapper_declared_not_in_process_verified" as const,
      traceMaximumBytes: Number(MAX_TRACE_BYTES) as 8388608,
      traceSizeBytes: traceBytes.byteLength,
      processPeakRssBytes,
      peakRssObservationScope:
        "host_process_lifetime_not_run_exclusive" as const,
      resourceEnvelopeIndependentlyVerified: false as const,
    },
    derivationReceipt,
    candidateInputAdmissible: false as const,
    scientificCandidateDisposition:
      "numerical_enclosure_protocol_failure_not_scientific_candidate_failure" as const,
    frozenEnclosureGate: derived.trace.summary.frozenGateDisposition,
    intervalTraceVerificationStatus:
      "producer_self_check_only_not_server_replayed" as const,
    authorityBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_AUTHORITY_BLOCKERS,
    claimLocks: NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
    integrity: {
      hashAlgorithm: "sha256" as const,
      canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
    },
  };
  const receipt: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1 = {
    ...unsignedRunReceipt,
    integrity: {
      ...unsignedRunReceipt.integrity,
      receiptSha256:
        computeNhm2ConformallyFlatNeedleMetricDemandRunReceiptSha256(
          unsignedRunReceipt,
        ),
    },
  };
  if (
    !hasValidNhm2ConformallyFlatNeedleMetricDemandRunReceiptIntegrity(receipt)
  ) {
    return fail(
      "receipt_integrity_failed",
      "The diagnostic run receipt failed its integrity contract.",
    );
  }
  const receiptBytes = canonicalBytes(receipt);
  const receiptAbsolutePath = path.join(
    outputDirectoryRealPath,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_RECEIPT_FILE_NAME,
  );
  await writeExclusive(receiptAbsolutePath, receiptBytes);
  await secureRead(outputDirectoryRealPath, [
    ...initialRequests,
    {
      relativePath:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_RUN_RECEIPT_FILE_NAME,
      bytes: receiptBytes,
    },
  ]);
  return deepFreeze({
    receipt,
    receiptSha256:
      sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(receiptBytes),
    receiptAbsolutePath,
    outputDirectoryRealPath,
  });
};
