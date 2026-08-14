import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1,
  nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const assertDeepFrozen = (value: unknown, seen = new Set<object>()): void => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return;
  }
  seen.add(value as object);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    assertDeepFrozen(child, seen);
  }
};

const round64 = (value: number): number => {
  const rounded = new Float64Array([value])[0];
  return Object.is(rounded, -0) ? 0 : rounded;
};

const float64Bits = (value: number): string => {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setFloat64(0, value, false);
  return view.getBigUint64(0, false).toString(16).padStart(16, "0");
};

const float64FromBits = (bits: string): number => {
  const bytes = new ArrayBuffer(8);
  const view = new DataView(bytes);
  view.setBigUint64(0, BigInt(`0x${bits}`), false);
  return view.getFloat64(0, false);
};

const syntheticDifferentiationOperators = (
  nodes: readonly number[],
  weights: readonly number[],
) => {
  const count = nodes.length;
  const D = Array.from({ length: count }, () =>
    Array.from({ length: count }, () => 0),
  );
  for (let i = 0; i < count; i += 1) {
    let diagonalSum = 0;
    for (let j = 0; j < count; j += 1) {
      if (i === j) continue;
      const difference = round64(nodes[i] - nodes[j]);
      const denominator = round64(weights[i] * difference);
      D[i][j] = round64(weights[j] / denominator);
      diagonalSum = round64(diagonalSum + D[i][j]);
    }
    D[i][i] = round64(-diagonalSum);
  }
  const D2 = Array.from({ length: count }, (_, i) =>
    Array.from({ length: count }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < count; k += 1) {
        const product = round64(D[i][k] * D[k][j]);
        sum = round64(sum + product);
      }
      return sum;
    }),
  );
  return { D, D2 };
};

const syntheticLuWithThreeRefinements = (
  matrix: readonly (readonly number[])[],
  rightHandSide: readonly number[],
) => {
  const size = matrix.length;
  const original = matrix.map((row) => row.map(round64));
  const lu = original.map((row) => [...row]);
  const permutation = Array.from({ length: size }, (_, index) => index);
  const pivotRows: number[] = [];
  for (let k = 0; k < size; k += 1) {
    let pivotRow = k;
    let pivotMagnitude = Math.abs(lu[k][k]);
    for (let row = k + 1; row < size; row += 1) {
      const candidateMagnitude = Math.abs(lu[row][k]);
      if (candidateMagnitude > pivotMagnitude) {
        pivotMagnitude = candidateMagnitude;
        pivotRow = row;
      }
    }
    if (!(pivotMagnitude > 0) || !Number.isFinite(pivotMagnitude)) {
      throw new Error("synthetic_zero_or_nonfinite_pivot");
    }
    pivotRows.push(pivotRow);
    if (pivotRow !== k) {
      [lu[k], lu[pivotRow]] = [lu[pivotRow], lu[k]];
      [permutation[k], permutation[pivotRow]] = [
        permutation[pivotRow],
        permutation[k],
      ];
    }
    for (let i = k + 1; i < size; i += 1) {
      const factor = round64(lu[i][k] / lu[k][k]);
      lu[i][k] = factor;
      for (let j = k + 1; j < size; j += 1) {
        const product = round64(factor * lu[k][j]);
        lu[i][j] = round64(lu[i][j] - product);
      }
    }
  }

  const triangularSolve = (rhs: readonly number[]): number[] => {
    const permuted = permutation.map((index) => rhs[index]);
    const y = Array.from({ length: size }, () => 0);
    for (let i = 0; i < size; i += 1) {
      let value = round64(permuted[i]);
      for (let j = 0; j < i; j += 1) {
        value = round64(value - round64(lu[i][j] * y[j]));
      }
      y[i] = value;
    }
    const x = Array.from({ length: size }, () => 0);
    for (let i = size - 1; i >= 0; i -= 1) {
      let value = y[i];
      for (let j = i + 1; j < size; j += 1) {
        value = round64(value - round64(lu[i][j] * x[j]));
      }
      x[i] = round64(value / lu[i][i]);
    }
    return x;
  };

  let solution = triangularSolve(rightHandSide);
  for (let pass = 0; pass < 3; pass += 1) {
    const residual = original.map((row, i) => {
      let productSum = 0;
      for (let j = 0; j < size; j += 1) {
        productSum = round64(productSum + round64(row[j] * solution[j]));
      }
      return round64(rightHandSide[i] - productSum);
    });
    const correction = triangularSolve(residual);
    solution = solution.map((value, index) =>
      round64(value + correction[index]),
    );
  }
  return { solution, pivotRows, refinementPasses: 3 };
};

type SyntheticDual = Readonly<{ v: number; d: readonly number[] }>;

const syntheticTailDualGolden = (input: {
  C: number;
  h0: number;
  q0: number;
  R: number;
  y: number;
  kappa: number;
  H1: number;
  U1: number;
}): SyntheticDual => {
  const dimension = 3;
  const constant = (value: number): SyntheticDual => ({
    v: round64(value),
    d: Array.from({ length: dimension }, () => 0),
  });
  const variable = (value: number, index: number): SyntheticDual => ({
    v: round64(value),
    d: Array.from({ length: dimension }, (_, k) => (k === index ? 1 : 0)),
  });
  const add = (a: SyntheticDual, b: SyntheticDual): SyntheticDual => ({
    v: round64(a.v + b.v),
    d: a.d.map((entry, k) => round64(entry + b.d[k])),
  });
  const subtract = (a: SyntheticDual, b: SyntheticDual): SyntheticDual => ({
    v: round64(a.v - b.v),
    d: a.d.map((entry, k) => round64(entry - b.d[k])),
  });
  const negate = (a: SyntheticDual): SyntheticDual => ({
    v: round64(-a.v),
    d: a.d.map((entry) => round64(-entry)),
  });
  const multiply = (a: SyntheticDual, b: SyntheticDual): SyntheticDual => ({
    v: round64(a.v * b.v),
    d: a.d.map((entry, k) =>
      round64(round64(entry * b.v) + round64(a.v * b.d[k])),
    ),
  });
  const divide = (a: SyntheticDual, b: SyntheticDual): SyntheticDual => {
    const denominator = round64(b.v * b.v);
    return {
      v: round64(a.v / b.v),
      d: a.d.map((entry, k) => {
        const left = round64(entry * b.v);
        const right = round64(a.v * b.d[k]);
        return round64(round64(left - right) / denominator);
      }),
    };
  };
  const exp = (a: SyntheticDual): SyntheticDual => {
    const value = round64(Number(syntheticDecimalFromFloat64(a.v).exp()));
    return {
      v: value,
      d: a.d.map((entry) => round64(value * entry)),
    };
  };
  const log = (a: SyntheticDual): SyntheticDual => ({
    v: round64(Number(syntheticDecimalFromFloat64(a.v).ln())),
    d: a.d.map((entry) => round64(entry / a.v)),
  });

  const C = variable(input.C, 0);
  const h0 = variable(input.h0, 1);
  variable(input.q0, 2); // q0 is deliberately absent from the scalar mass integrand.
  const R = constant(input.R);
  const y = constant(input.y);
  const kappa = constant(input.kappa);
  const sigma = subtract(divide(C, kappa), constant(1));
  const a = multiply(kappa, R);
  const H1 = constant(input.H1);
  const Hy1 = subtract(
    multiply(add(negate(a), sigma), H1),
    multiply(R, constant(input.U1)),
  );
  const oneMinusY = subtract(constant(1), y);
  const H = add(
    add(H1, multiply(Hy1, subtract(y, constant(1)))),
    multiply(multiply(oneMinusY, oneMinusY), h0),
  );
  const x = divide(R, y);
  const exponent = add(
    negate(multiply(kappa, subtract(x, R))),
    multiply(sigma, log(divide(x, R))),
  );
  const B = exp(exponent);
  const E = multiply(B, B);
  const y2 = multiply(y, y);
  const y4 = multiply(y2, y2);
  const H2 = multiply(H, H);
  const R2 = multiply(R, R);
  const R3 = multiply(R2, R);
  return divide(multiply(multiply(R3, E), H2), y4);
};

const SyntheticDecimal = Decimal.clone({
  precision: 100,
  rounding: Decimal.ROUND_HALF_EVEN,
});

const syntheticDecimalFromFloat64 = (value: number): Decimal => {
  const bits = BigInt(`0x${float64Bits(value)}`);
  const negative = bits >> 63n === 1n;
  const exponentBits = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  if (exponentBits === 0x7ff) {
    throw new Error("synthetic_finite_binary64_required");
  }
  if (exponentBits === 0 && fraction === 0n) return new SyntheticDecimal(0);
  const significand = exponentBits === 0 ? fraction : (1n << 52n) + fraction;
  const exponent2 = exponentBits === 0 ? -1074 : exponentBits - 1023 - 52;
  const magnitude = new SyntheticDecimal(significand.toString()).times(
    new SyntheticDecimal(2).pow(exponent2),
  );
  return negative ? magnitude.neg() : magnitude;
};

const positiveFloat64Rational = (
  bits: string,
): Readonly<{ numerator: bigint; denominator: bigint }> => {
  const raw = BigInt(`0x${bits}`);
  const exponentBits = Number((raw >> 52n) & 0x7ffn);
  const fraction = raw & ((1n << 52n) - 1n);
  if (raw >> 63n !== 0n || exponentBits === 0x7ff) {
    throw new Error("synthetic_positive_finite_f64_required");
  }
  const significand = exponentBits === 0 ? fraction : (1n << 52n) + fraction;
  const exponent2 = exponentBits === 0 ? -1074 : exponentBits - 1023 - 52;
  return exponent2 >= 0
    ? { numerator: significand << BigInt(exponent2), denominator: 1n }
    : { numerator: significand, denominator: 1n << BigInt(-exponent2) };
};

const roundPositiveRationalToFloat64Bits = (
  numerator: bigint,
  denominator: bigint,
): string => {
  if (!(numerator > 0n && denominator > 0n)) {
    throw new Error("synthetic_positive_rational_required");
  }
  let exponent2 = numerator.toString(2).length - denominator.toString(2).length;
  const belowPower =
    exponent2 >= 0
      ? numerator < denominator << BigInt(exponent2)
      : numerator << BigInt(-exponent2) < denominator;
  if (belowPower) exponent2 -= 1;
  if (exponent2 < -1022 || exponent2 > 1023) {
    throw new Error("synthetic_normal_binary64_required");
  }
  const shift = 52 - exponent2;
  const scaledNumerator = shift >= 0 ? numerator << BigInt(shift) : numerator;
  const scaledDenominator =
    shift >= 0 ? denominator : denominator << BigInt(-shift);
  let significand = scaledNumerator / scaledDenominator;
  const remainder = scaledNumerator % scaledDenominator;
  const twiceRemainder = remainder << 1n;
  if (
    twiceRemainder > scaledDenominator ||
    (twiceRemainder === scaledDenominator && (significand & 1n) === 1n)
  ) {
    significand += 1n;
  }
  if (significand === 1n << 53n) {
    significand >>= 1n;
    exponent2 += 1;
  }
  const exponentField = BigInt(exponent2 + 1023);
  const fraction = significand - (1n << 52n);
  return ((exponentField << 52n) | fraction).toString(16).padStart(16, "0");
};

const exactRationalXMapBits = (rhoBits: string): string => {
  const rho = positiveFloat64Rational(rhoBits);
  return roundPositiveRationalToFloat64Bits(
    rho.numerator,
    rho.denominator - rho.numerator,
  );
};

const syntheticHighPrecisionInitializer = (
  rho64: number,
): Readonly<{
  kg: string;
  nu: string;
  expMinusKgX: string;
  expMinusTwoKgX: string;
  u: string;
  V: string;
}> => {
  const kgHigh = new SyntheticDecimal(7).div(8).sqrt().sqrt();
  const kg64 = Number(kgHigh);
  const kg = syntheticDecimalFromFloat64(kg64);
  const nu = kg.times(kg).neg().div(2);
  const rho = syntheticDecimalFromFloat64(rho64);
  const x = rho.div(new SyntheticDecimal(1).minus(rho));
  const kgX = kg.times(x);
  const expMinusKgX = kgX.neg().exp();
  const twoKg = new SyntheticDecimal(2).times(kg);
  const twoKgX = twoKg.times(x);
  const expMinusTwoKgX = twoKgX.neg().exp();
  const I: Decimal[] = [];
  const J: Decimal[] = [];
  for (let n = 1; n <= 4; n += 1) {
    let factorial = new SyntheticDecimal(1);
    for (let factor = 2; factor <= n; factor += 1) {
      factorial = factorial.times(factor);
    }
    let series = new SyntheticDecimal(0);
    let power = new SyntheticDecimal(1);
    let jFactorial = new SyntheticDecimal(1);
    for (let j = 0; j <= n; j += 1) {
      if (j > 0) {
        power = power.times(twoKgX);
        jFactorial = jFactorial.times(j);
      }
      series = series.plus(power.div(jFactorial));
    }
    const expSeries = expMinusTwoKgX.times(series);
    let denominator = new SyntheticDecimal(1);
    for (let powerIndex = 0; powerIndex <= n; powerIndex += 1) {
      denominator = denominator.times(twoKg);
    }
    const prefactor = factorial.div(denominator);
    I[n] = prefactor.times(new SyntheticDecimal(1).minus(expSeries));
    J[n] = prefactor.times(expSeries);
  }
  const u = new SyntheticDecimal(1).plus(kg.times(x)).times(expMinusKgX);
  const kgSquared = kg.times(kg);
  const iSum = I[2].plus(twoKg.times(I[3])).plus(kgSquared.times(I[4]));
  const jSum = J[1].plus(twoKg.times(J[2])).plus(kgSquared.times(J[3]));
  const V = iSum.div(x).neg().minus(jSum);
  return {
    kg: float64Bits(kg64),
    nu: float64Bits(Number(nu)),
    expMinusKgX: float64Bits(Number(expMinusKgX)),
    expMinusTwoKgX: float64Bits(Number(expMinusTwoKgX)),
    u: float64Bits(Number(u)),
    V: float64Bits(Number(V)),
  };
};

const syntheticHighPrecisionLobattoBits = (count: number): string[] => {
  const pi = SyntheticDecimal.acos(-1);
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return float64Bits(0);
    if (index === count - 1) return float64Bits(1);
    const theta = pi.times(index).div(count - 1);
    return float64Bits(
      Number(new SyntheticDecimal(1).minus(theta.cos()).div(2)),
    );
  });
};

const syntheticHighPrecisionDctBits = (
  valuesInRhoOrder: readonly number[],
): string[] => {
  const count = valuesInRhoOrder.length;
  const pi = SyntheticDecimal.acos(-1);
  return Array.from({ length: count }, (_, n) => {
    let sum = new SyntheticDecimal(0);
    for (let m = 0; m < count; m += 1) {
      const angle = pi
        .times(m)
        .times(n)
        .div(count - 1);
      const endpointWeight = m === 0 || m === count - 1 ? 2 : 1;
      const term = new SyntheticDecimal(valuesInRhoOrder[count - 1 - m])
        .times(angle.cos())
        .div(endpointWeight);
      sum = sum.plus(term);
    }
    const coefficientEndpointWeight = n === 0 || n === count - 1 ? 2 : 1;
    return float64Bits(
      Number(
        new SyntheticDecimal(2)
          .times(sum)
          .div(count - 1)
          .div(coefficientEndpointWeight),
      ),
    );
  });
};

const syntheticHighPrecisionJoinBits = (
  nodes: readonly number[],
  weights: readonly number[],
  values: readonly number[],
  numerator: number,
  denominator: number,
): Readonly<{ value: string; xDerivative: string }> => {
  const rho = new SyntheticDecimal(numerator).div(denominator);
  let S0 = new SyntheticDecimal(0);
  let S1 = new SyntheticDecimal(0);
  let S2 = new SyntheticDecimal(0);
  let S3 = new SyntheticDecimal(0);
  for (let index = 0; index < nodes.length; index += 1) {
    const node = new SyntheticDecimal(nodes[index]);
    const weight = new SyntheticDecimal(weights[index]);
    const value = new SyntheticDecimal(values[index]);
    const difference = rho.minus(node);
    const differenceSquared = difference.times(difference);
    const weightedValue = weight.times(value);
    S0 = S0.plus(weight.div(difference));
    S1 = S1.plus(weightedValue.div(difference));
    S2 = S2.plus(weight.div(differenceSquared));
    S3 = S3.plus(weightedValue.div(differenceSquared));
  }
  const value = S1.div(S0);
  const rhoDerivative = value.times(S2).minus(S3).div(S0);
  const xDerivative = rhoDerivative.times(
    new SyntheticDecimal(1).minus(rho).pow(2),
  );
  return {
    value: float64Bits(Number(value)),
    xDerivative: float64Bits(Number(xDerivative)),
  };
};

const syntheticEndpointProjection = (
  rawState: readonly number[],
  uInfinityIndex: number,
  VInfinityIndex: number,
): number[] => {
  const projected = [...rawState];
  projected[uInfinityIndex] = 0;
  projected[VInfinityIndex] = 0;
  return projected;
};

const syntheticScalarBarrierBits = (
  nu64: number,
  Vc64: number,
  C64: number,
): string[] => {
  const nu = syntheticDecimalFromFloat64(nu64);
  const Vc = syntheticDecimalFromFloat64(Vc64);
  const C = syntheticDecimalFromFloat64(C64);
  const kappa = new SyntheticDecimal(-2).times(nu).sqrt();
  const sigma = C.div(kappa).minus(1);
  const N0 = new SyntheticDecimal(4).times(SyntheticDecimal.acos(-1)).times(C);
  const lambda = new SyntheticDecimal(1).div(32);
  const nuStar = lambda.times(lambda).times(nu);
  const wSeed = new SyntheticDecimal(1)
    .plus(new SyntheticDecimal(2).times(nuStar))
    .sqrt();
  return [nu, Vc, N0, C, kappa, sigma, lambda, nuStar, wSeed].map((value) =>
    float64Bits(Number(value)),
  );
};

describe("spherical boson-star Newtonian seed primary numerics v1", () => {
  it("computes a deterministic canonical identity and exact-binds stable upstream dependencies", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS;

    expect(pins.semanticSeed).toEqual({
      sha256:
        "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
      canonicalSizeBytes: 18894,
    });
    expect(pins.incompleteOperationPolicy).toEqual({
      sha256:
        "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
      canonicalSizeBytes: 32308,
    });
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      pins.semanticSeed.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
    ).toBe(pins.semanticSeed.canonicalSizeBytes);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
    ).toBe(pins.incompleteOperationPolicy.sha256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
    ).toBe(pins.incompleteOperationPolicy.canonicalSizeBytes);
    expect(policy.candidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1.candidateId,
    ).toBe(policy.candidateId);

    expect(canonicalJson(policy)).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_SHA256,
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_LITERAL_SEAL_STATUS,
    ).toBe(
      "sealed_with_final_GL256_binding_and_consolidated_determinism_invariant",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256,
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256);
    assertDeepFrozen(policy);
  });

  it("exact-binds the final GL256 manifest, records, generator, and independent test", () => {
    const fixture =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_DEPENDENCY_PINS.gaussLegendre256Fixture;
    expect(fixture).toMatchObject({
      manifest: {
        relativePath:
          "configs/research/nhm2-spherical-gl256-mpfr256-manifest.v1.json",
        schemaVersion: "nhm2_spherical_gl256_mpfr256_manifest/v1",
        sha256:
          "9b600578714821fddb41ad2c1b2c456bfdb11795d500200b55515a28948774e4",
        sizeBytes: 5390,
      },
      rawRecords: {
        relativePath:
          "configs/research/fixtures/nhm2-spherical-gl256-mpfr256.v1.jsonl",
        schemaVersion: "nhm2_spherical_gl256_mpfr256_record/v1",
        sha256:
          "966a28e7a0c5633709b5e59e2c0b99bb8d25e2ddadccf0cc391ebd1a9c70f794",
        sizeBytes: 77842,
      },
      generatorVerifier: {
        relativePath:
          "scripts/research/build-verify-nhm2-spherical-gl256-mpfr256.py",
        sha256:
          "3acc145080a0bb799f58292640245d84f76c7f2ea445349bc0db58ef40eca5ed",
        sizeBytes: 25877,
      },
      independentTest: {
        relativePath: "tests/nhm2-spherical-gl256-mpfr256-fixture.spec.ts",
        sha256:
          "bbec4f9040578e3a4c9be138718bd98a3169c58d5b553c0e7a7dd49f5e1de7b5",
        sizeBytes: 31699,
      },
      finalManifestRawGeneratorAndTestPinsBound: true,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1
        .completionBoundary.gaussLegendreFixtureBound,
    ).toBe(true);
    for (const binding of [
      fixture.manifest,
      fixture.rawRecords,
      fixture.generatorVerifier,
      fixture.independentTest,
    ]) {
      const bytes = readFileSync(binding.relativePath);
      expect(bytes.byteLength).toBe(binding.sizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        binding.sha256,
      );
    }
  });

  it("freezes the exact core grids, operators, DCT-I coefficients, initializer, and transfer", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    expect(
      policy.coreNodesAndOperators.levels.map((level) => [
        level.id,
        level.radialNodeCount,
        level.unknownCount,
      ]),
    ).toEqual([
      ["L0", 64, 129],
      ["L1", 96, 193],
      ["L2", 128, 257],
    ]);
    expect(policy.coreNodesAndOperators.nodeProgram).toEqual([
      "allocate_pi_j_denominator_piTimesJ_theta_cosine_one_difference_two_rho_in_that_handle_order",
      "set_ui(jMp,j);_set_ui(denominator,N-1)",
      "if_j_equals_0_set_ui(rho,0)_and_skip_const_pi_multiply_divide_cosine",
      "else_if_j_equals_N_minus_1_set_ui(rho,1)_and_skip_const_pi_multiply_divide_cosine",
      "else_const_pi(pi);_mul(piTimesJ,pi,jMp);_div(theta,piTimesJ,denominator);_cos(cosine,theta)",
      "else_set_ui(one,1);_sub(difference,one,cosine);_set_ui(two,2);_div(rho,difference,two)",
      "rho64=get_d(rho)_exactly_once_then_store_in_j_order",
    ]);
    expect(
      policy.coreNodesAndOperators.secondDerivativeMatrixProgram.source,
    ).toContain("unrounded_256_bit_Dmp");
    expect(
      policy.coreNodesAndOperators.coreCoefficientTransform.exactFormula,
    ).toContain("2/((N-1)*c_n)");
    expect(
      policy.coreNodesAndOperators.coreCoefficientTransform.operationOrder,
    ).toContain(
      "for_m_increasing_set_ui(mMp,m);_mul(mn,mMp,nMp);_mul(piMn,pi,mn);_div(theta,piMn,denominator);_cos(cosine,theta)",
    );
    expect(policy.fixedL0Initializer.kgProgram).toContain(
      "sqrt(firstRoot,ratio);_sqrt(kg,firstRoot);_kg64=get_d(kg)_exactly_once",
    );
    expect(policy.fixedL0Initializer.interiorNodeProgram).toEqual(
      expect.arrayContaining([
        "mul(kgX,kg,x);_neg(minusKgX,kgX);_exp(expMinusKgX,minusKgX)",
        "set_ui(two,2);_mul(twoKg,two,kg);_mul(twoKgX,twoKg,x);_neg(minusTwoKgX,twoKgX);_exp(expMinusTwoKgX,minusTwoKgX)_using_a_distinct_exp_call_and_distinct_destination_from_expMinusKgX",
      ]),
    );
    expect(policy.fixedL0Initializer.alternateInitializerAllowed).toBe(false);
    expect(policy.levelTransfer.schedule).toEqual([
      "accepted_L0_to_L1",
      "accepted_L1_to_L2",
    ]);
    expect(policy.levelTransfer.sourceWeightProgram).toContain(
      "no_source_weight_array_survives_operator_reuse",
    );
    expect(
      policy.levelTransfer.restartAlternateInterpolationOrFilteringAllowed,
    ).toBe(false);
  });

  it("freezes the MPFR256 context, flag protocol, primitive dictionary, and bounded cr aliases", () => {
    const arithmetic =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.arithmetic;
    expect(arithmetic.mpfrContext).toMatchObject({
      precisionBits: 256,
      roundingMode: "MPFR_RNDN",
      exponentRange: { emin: -1000000, emax: 1000000 },
    });
    expect(arithmetic.mpfrContext.primitiveFlagProtocol).toContain(
      "mpfr_clear_flags",
    );
    expect(arithmetic.mpfrPrimitiveDictionary).toMatchObject({
      setUi:
        "set_ui(dst,u)=mpfr_set_ui(dst,u,MPFR_RNDN)_with_u_an_exact_nonnegative_integer;_require_ternary_zero",
      constPi:
        "const_pi(dst)=mpfr_const_pi(dst,MPFR_RNDN)_exactly_once_per_named_pi_handle",
      cosine: "cos(dst,a)=mpfr_cos(dst,a,MPFR_RNDN)",
      squareRoot:
        "sqrt(dst,a)=mpfr_sqrt(dst,a,MPFR_RNDN)_after_requiring_a_greater_than_or_equal_to_positive_zero",
    });
    expect(arithmetic.mpfrPrimitiveDictionary.aliasCrSqrt64).toContain(
      "set_d(op,d);_sqrt(result,op);_get_d(result)_exactly_once",
    );
    expect(arithmetic.mpfrPrimitiveDictionary.aliasAccuracyClaim).toContain(
      "do_not_claim_correct_rounding_of_an_exact_real_directly_to_binary64",
    );
    expect(arithmetic.canonicalZero).toContain(
      "set_positive_zero_is_terminal_and_is_never_recursively_canonicalized",
    );
  });

  it("matches the executable synthetic D and D2 golden fixture", () => {
    const fixture =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1
        .syntheticConformanceFixtures.differentiationN3;
    const { D, D2 } = syntheticDifferentiationOperators(
      fixture.nodeBits.map(float64FromBits),
      fixture.barycentricWeightBits.map(float64FromBits),
    );
    expect(D).toEqual([
      [-3, 4, -1],
      [-1, 0, 1],
      [1, -4, 3],
    ]);
    expect(D2).toEqual([
      [4, -8, 4],
      [4, -8, 4],
      [4, -8, 4],
    ]);
    expect(D.flat().map(float64Bits)).toEqual(fixture.expectedDBitsRowMajor);
    expect(D2.flat().map(float64Bits)).toEqual(fixture.expectedD2BitsRowMajor);
  });

  it("executes the distinct x maps and independent high-precision node/DCT goldens", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    const xFixture = policy.syntheticConformanceFixtures.xMapDivergence;
    const rho = float64FromBits(xFixture.rhoBits);
    const binaryResidualX = round64(rho / round64(1 - rho));
    expect(float64Bits(binaryResidualX)).toBe(xFixture.binary64ResidualXBits);
    expect(exactRationalXMapBits(xFixture.rhoBits)).toBe(
      xFixture.mpfrInitializerMaterializationXGetDBits,
    );
    expect(
      BigInt(`0x${xFixture.binary64ResidualXBits}`) -
        BigInt(`0x${xFixture.mpfrInitializerMaterializationXGetDBits}`),
    ).toBe(BigInt(xFixture.expectedUlpSeparation));
    expect(policy.coreNodesAndOperators.binary64ResidualXMap).toContain(
      "denominator64=round64(1-rho64)",
    );
    expect(
      policy.coreNodesAndOperators.mpfrInitializerAndMaterializationXMap,
    ).toContain(
      "otherwise_sub(denominatorMp,oneMp,rhoMp);_div(xMp,rhoMp,denominatorMp)",
    );

    const initializerFixture =
      policy.syntheticConformanceFixtures.initializerInteriorAtRhoHalf;
    expect(
      syntheticHighPrecisionInitializer(
        float64FromBits(initializerFixture.rhoBits),
      ),
    ).toEqual({
      kg: initializerFixture.expectedKgBits,
      nu: initializerFixture.expectedNuBits,
      expMinusKgX: initializerFixture.expectedExpMinusKgXBits,
      expMinusTwoKgX: initializerFixture.expectedExpMinusTwoKgXBits,
      u: initializerFixture.expectedUBits,
      V: initializerFixture.expectedVBits,
    });
    expect(initializerFixture.expectedExpMinusKgXBits).not.toBe(
      initializerFixture.expectedExpMinusTwoKgXBits,
    );

    const nodeFixture =
      policy.syntheticConformanceFixtures.lobattoNodeGroupingN5;
    expect(syntheticHighPrecisionLobattoBits(5)).toEqual(
      nodeFixture.expectedNodeBits,
    );
    const dctFixture = policy.syntheticConformanceFixtures.dctGroupingN3;
    expect(
      syntheticHighPrecisionDctBits(
        dctFixture.inputValueBitsInRhoOrder.map(float64FromBits),
      ),
    ).toEqual(dctFixture.expectedCoefficientBits);
  });

  it("closes the core row ABI, radial operator, and analytic Jacobian", () => {
    const core =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.coreResidualAndJacobian;
    expect(core.unknownOrder).toBe(
      "z=[u[0..N-1],V[0..N-1],nu]_length_2N_plus_1",
    );
    expect(core.rowOrder).toBe("F=[S[0..N-1],P[0..N-1],A]_length_2N_plus_1");
    expect(core.radialLaplacianProgram).toContain(
      "inside=round64(d2u+quotient)",
    );
    expect(core.scalarRows).toMatchObject({
      origin: "S[0]=dot64(D_row_0,u)",
      infinity: "S[N-1]=u[N-1]",
    });
    expect(core.potentialRows).toMatchObject({
      origin: "P[0]=dot64(D_row_0,V)",
      infinity: "P[N-1]=V[N-1]",
    });
    expect(core.analyticJacobian.finiteDifferenceOrGenericAdAllowed).toBe(
      false,
    );
    expect(core.analyticJacobian.fillOrder).toContain(
      "rows_increasing_then_columns_increasing",
    );
    expect(core.stateBufferProtocol.currentState).toContain(
      "bitwise_unchanged_during_every_line_search_trial",
    );
    expect(core.stateBufferProtocol.trialState).toContain(
      "without_copying_into_currentState",
    );
    expect(core.stateBufferProtocol.acceptance).toContain(
      "only_after_the_first_trial_passes_domain_and_Armijo",
    );
    expect(core.stateBufferProtocol.evaluationModes).toMatchObject({
      Newton: expect.stringContaining(
        "every_line_search_trial_evaluation_materialize_the_complete_residual_and_complete_analytic_Jacobian",
      ),
      projectedResidualGate: expect.stringContaining(
        "must_not_write_or_read_the_Jacobian_target",
      ),
    });
    expect(core.evaluationChronology).toContain(
      "projectedResidualGate_mode_stops_after_the_complete_residual",
    );
  });

  it("freezes scalar LU, exactly three refinement passes, Newton trials, and stop ordering", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    expect(policy.denseLinearSolve).toMatchObject({
      arithmetic: "scalar_binary64_only",
      scalingOrEquilibration: "none",
      factorization: "Doolittle_in_place_LU_with_partial_pivoting_k_increasing",
    });
    expect(policy.denseLinearSolve.pivotScan).toContain(
      "lowest_row_wins_exact_ties",
    );
    expect(policy.denseLinearSolve.iterativeRefinement.exactPassCount).toBe(3);
    expect(
      policy.denseLinearSolve.iterativeRefinement.refactorOrEarlyExitAllowed,
    ).toBe(false);
    expect(policy.newtonControl.maximumAcceptedUpdatesPerSystem).toBe(48);
    expect(policy.newtonControl.lineSearch).toMatchObject({
      maximumTrials: 25,
      order: "k=0..24_alpha_is_exact_binary64_2^-k",
    });
    expect(policy.newtonControl.lineSearch.trialEvaluation).toContain(
      "complete_trial_residual_then_complete_trial_Jacobian",
    );
    expect(policy.newtonControl.acceptedStepSequence).toEqual([
      "replace_current_state_with_the_accepted_trial_bits",
      "replace_current_residual_and_merit_with_the_already_evaluated_trial_values_and_reclassify_the_already_evaluated_trial_J_as_current_J_without_rewriting_it",
      "compute_equation_norm=max_i_abs(F_trial_i)_in_row_order",
      "compute_scaled_step=max_i(round64(abs(step_i)/max(1,abs(current_i))))_in_unknown_order",
      "qualifies=equation_norm<=2^-40_and_scaled_step<=2^-42",
      "increment_consecutive_qualifying_if_qualifies_else_reset_to_zero",
      "terminate_success_only_when_consecutive_qualifying_equals_2",
    ]);
    expect(policy.newtonControl.initialStateMayTerminate).toBe(false);
  });

  it("matches the executable pivoted-LU and three-pass refinement golden fixture", () => {
    const fixture =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1
        .syntheticConformanceFixtures.pivotedLuN2;
    const matrixValues = fixture.matrixBitsRowMajor.map(float64FromBits);
    const result = syntheticLuWithThreeRefinements(
      [matrixValues.slice(0, 2), matrixValues.slice(2, 4)],
      fixture.rightHandSideBits.map(float64FromBits),
    );
    expect(result.pivotRows).toEqual(fixture.expectedPivotRows);
    expect(result.refinementPasses).toBe(fixture.refinementPassCount);
    expect(result.solution).toEqual([1, 2]);
    expect(result.solution.map(float64Bits)).toEqual(
      fixture.expectedSolutionBits,
    );
  });

  it("executes the literal join grouping and deterministic endpoint projection", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    const joinFixture = policy.syntheticConformanceFixtures.joinGroupingN3;
    const nodes = joinFixture.nodeBits.map(float64FromBits);
    const weights = joinFixture.weightBits.map(float64FromBits);
    const uJoin = syntheticHighPrecisionJoinBits(
      nodes,
      weights,
      joinFixture.uValueBits.map(float64FromBits),
      joinFixture.joinNumerator,
      joinFixture.joinDenominator,
    );
    const VJoin = syntheticHighPrecisionJoinBits(
      nodes,
      weights,
      joinFixture.VValueBits.map(float64FromBits),
      joinFixture.joinNumerator,
      joinFixture.joinDenominator,
    );
    expect({
      U: uJoin.value,
      U1: uJoin.xDerivative,
      V: VJoin.value,
      V1: VJoin.xDerivative,
    }).toEqual(joinFixture.expectedBarrierBits);
    expect(policy.L2JoinExtraction.joinRhoProgram).toEqual([
      "set_ui(joinNumerator,32);_set_ui(joinDenominator,33)",
      "div(joinRho,joinNumerator,joinDenominator)_and_do_not_get_d",
    ]);
    expect(policy.L2JoinExtraction.fieldProgram).toContain(
      "sub(difference,joinRho,node);_mul(differenceSquared,difference,difference)",
    );
    expect(policy.L2JoinExtraction.barrierOrder).toEqual([
      "U",
      "U1",
      "V",
      "V1",
    ]);

    const projectionFixture =
      policy.syntheticConformanceFixtures.endpointProjectionN3;
    const raw = projectionFixture.rawStateBits.map(float64FromBits);
    const projected = syntheticEndpointProjection(
      raw,
      projectionFixture.uInfinityIndex,
      projectionFixture.VInfinityIndex,
    );
    expect(projected.map(float64Bits)).toEqual(
      projectionFixture.expectedProjectedStateBits,
    );
    expect(raw.map(float64Bits)).toEqual(projectionFixture.rawStateBits);
    expect(policy.postsolveEndpointProjection.rawAcceptedState).toContain(
      "without_a_numeric_copy_or_aliasing_any_other_range",
    );
    expect(policy.postsolveEndpointProjection.projectedStateProgram).toContain(
      "evaluate_the_complete_core_residual_on_projectedState_once_with_the_frozen_binary64_D_D2_row_and_residual_chronology",
    );
    expect(policy.postsolveEndpointProjection.acceptedConsumerState).toContain(
      "all_level_transfers_L2_join_core_quadrature_base_arrays_DCT_payloads_AUDIT_and_target_composite_inputs_use_the_same_archived_projected_bits",
    );
  });

  it("closes the 65-by-65 C1 tail ABI and fixed GL256 mass graph", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    const tail = policy.tailResidualAndJacobian;
    expect(tail).toMatchObject({
      R: 32,
      K: 32,
      unknownOrder: "z=[C,h[0..31],q[0..31]]_length_65",
      rowOrder: "F=[S(y[0..31]),P(y[0..31]),mass]_length_65",
    });
    expect(tail.nodes).toContain(
      "therefore_for_interior_j_set_ui(jMp,j);_set_ui(denominator,31);_const_pi(pi);_mul(piTimesJ,pi,jMp);_div(theta,piTimesJ,denominator);_cos(cosine,theta);_set_ui(one,1);_sub(difference,one,cosine);_set_ui(two,2);_div(y,difference,two)",
    );
    expect(tail.C1Lifts.field).toContain("(1-y)^2");
    expect(tail.exteriorFactor.yZero).toContain("without_division_log_or_exp");
    expect(tail.scaledRows.yZeroSchrodinger).toContain("Hy");
    expect(tail.scaledRows.yZeroPoisson).toContain("Q");
    expect(tail.analyticJacobian.representation).toContain(
      "derivative_d[0..64]",
    );
    expect(tail.analyticJacobian.componentLoop).toBe(
      "derivative_index_increasing_0_through_64",
    );
    expect(tail.analyticJacobian.multiply).toContain(
      "left=round64(a.d[k]*b.v)",
    );
    expect(tail.analyticJacobian.divide).toContain("den=round64(b.v*b.v)");
    expect(tail.analyticJacobian.exactRegisterCapacity).toBe(64);
    expect(tail.analyticJacobian.rowInvariantDualRegisters).toEqual([
      "register_0=R_constant_dual",
      "register_1=kappa_constant_dual",
      "register_2=a_constant_dual",
      "register_3=sigma_dual_with_C_derivative",
      "register_4=H1_constant_dual",
      "register_5=Hy1_dual",
      "register_6=Q1_dual",
      "register_7=Qy1_dual",
    ]);
    expect(tail.analyticJacobian.chebyshevStreaming).toContain(
      "never_materialize_a_32_by_3_binary64_dual_table",
    );
    expect(tail.stateBufferProtocol.trialState).toContain(
      "without_copying_into_currentState",
    );
    expect(tail.stateBufferProtocol.evaluationModes).toMatchObject({
      Newton: expect.stringContaining(
        "every_line_search_trial_evaluation_materialize_the_complete_residual_and_complete_analytic_Jacobian",
      ),
      finalResidualGate: expect.stringContaining(
        "must_not_write_or_read_the_Jacobian_target",
      ),
    });
    expect(tail.stateEvaluationChronology).toEqual(
      expect.arrayContaining([
        expect.stringContaining("finalResidualGate_mode_stops_after_F[64]"),
      ]),
    );
    expect(tail.stateBufferProtocol.finalLifetime).toContain(
      "immutable_accepted_C_h_q_source",
    );
    expect(tail.analyticJacobian.forbidden).toContain("finite_difference");

    const quadrature = policy.fixedGaussLegendre256Quadrature;
    expect(quadrature.requiredFixtureSemantics).toMatchObject({
      pointCount: 256,
      recordOrder: "index_0_through_255_in_strictly_increasing_node_order",
      topLevelCanonicalJsonByteKeyOrder: ["index", "node", "schema", "weight"],
      nestedDyadicCanonicalJsonByteKeyOrder: [
        "exponent2",
        "sign",
        "significandHex",
      ],
    });
    expect(quadrature.coreCells).toBe(256);
    expect(quadrature.tailCells).toBe(4096);
    expect(quadrature.mappedCellProgram).toHaveLength(9);
    expect(quadrature.mappedNodeWeightProgram).toEqual([
      "mul(nodeProduct,half,fixtureNodeExactDyadic)",
      "add(point,mid,nodeProduct)",
      "mul(mappedWeight,half,fixtureWeightExactDyadic)",
    ]);
    expect(quadrature.mappedPointAndWeightChronology).toHaveLength(4);
    expect(quadrature.tailCellBasisTableProgram).toHaveLength(4);
    expect(quadrature.tailPrimalAndDualProgram.join("\n")).toContain(
      "do_not_recompute_t_or_any_T_recurrence",
    );
    expect(quadrature.corePrimalProgram.at(-1)).toBe(
      "add(nextCoreSum,coreSum,term);_set(coreSum,nextCoreSum)",
    );
    expect(quadrature.tailPrimalAndDualProgram.at(-1)).toContain(
      "tailSum=dual_add",
    );
    expect(quadrature.mpfrDualPrimitiveGraph.componentOrder).toBe(
      "k_increasing_0_through_64_after_each_primal_value",
    );
    expect(quadrature.accumulation).toContain(
      "complete_core_cells_then_core_nodes_in_literal_order",
    );
    expect(quadrature.accumulation).toContain(
      "complete_tail_cells_then_tail_nodes_in_literal_order",
    );
    expect(quadrature.analyticJacobian).toContain("mass_J[33..64]");
    expect(quadrature.mpfrDualPrimitiveGraph.representation).toContain(
      "d[0..64]",
    );
    expect(quadrature.streamingAndReuse).toMatchObject({
      threadOrParallelBatchAllowed: false,
      feasibilityOrExecutionAuthorityEstablished: false,
    });
    expect(quadrature.streamingAndReuse.fixedMpfrArenaLayout).toHaveLength(7);
    expect(quadrature.streamingAndReuse.resourcePreflight).toContain(
      "exact_65536_slot_MPFR_262144_slot_binary64_and_257_slot_permutation_arenas",
    );
    expect(quadrature.streamingAndReuse.zeroDerivativeElision).toContain(
      "q_derivatives",
    );
    expect(quadrature.streamingAndReuse.coreIntegralReuse).toContain(
      "immutable_slot_13250",
    );
    expect(quadrature.streamingAndReuse.tailBasisReuse).toContain(
      "tailCellBasisTableProgram",
    );
    expect(quadrature.adaptiveSubdivisionEarlyStopOrAlternateRuleAllowed).toBe(
      false,
    );
    expect(quadrature.massResidual).toContain(
      "read_C64_from_the_same_current_or_trial_tail_state_whose_other_rows_were_evaluated;_cMinusCore=round64(C64-core64);_mass=round64(cMinusCore-tail64)",
    );
    expect(quadrature.finalAcceptedResidualGate.at(-1)).toContain(
      "scalar_array_or_coefficient_output_buffers",
    );
  });

  it("matches the executable synthetic tail primal/dual golden fixture", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1
        .syntheticConformanceFixtures.candidateDataUsed,
    ).toBe(false);
    const fixture =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1
        .syntheticConformanceFixtures.tailMassDualN3;
    const value = syntheticTailDualGolden({
      C: float64FromBits(fixture.inputBits.C),
      h0: float64FromBits(fixture.inputBits.h0),
      q0: float64FromBits(fixture.inputBits.q0),
      R: float64FromBits(fixture.inputBits.R),
      y: float64FromBits(fixture.inputBits.y),
      kappa: float64FromBits(fixture.inputBits.kappa),
      H1: float64FromBits(fixture.inputBits.H1),
      U1: float64FromBits(fixture.inputBits.U1),
    });
    expect(float64Bits(value.v)).toBe(fixture.expectedValueBits);
    expect(value.d.map(float64Bits)).toEqual(fixture.expectedDerivativeBits);
  });

  it("executes the frozen mass chronology and independent scalar MPFR barrier golden", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    const mass = policy.syntheticConformanceFixtures.massBarrierChronology;
    const C = float64FromBits(mass.CBits);
    const core = float64FromBits(mass.core64Bits);
    const tail = float64FromBits(mass.tail64Bits);
    const frozenMass = round64(round64(C - core) - tail);
    const forbiddenReassociation = round64(C - round64(core + tail));
    expect(float64Bits(frozenMass)).toBe(mass.expectedCMinusCoreMinusTailBits);
    expect(float64Bits(forbiddenReassociation)).toBe(
      mass.forbiddenCMinusCorePlusTailBits,
    );
    expect(float64Bits(frozenMass)).not.toBe(
      float64Bits(forbiddenReassociation),
    );

    const scalar = policy.syntheticConformanceFixtures.scalarMpfrBarrier;
    expect(
      syntheticScalarBarrierBits(
        float64FromBits(scalar.projectedNuBits),
        float64FromBits(scalar.projectedVcBits),
        float64FromBits(scalar.acceptedCBits),
      ),
    ).toEqual(scalar.expectedBarrierBitsInScalarOrder);
    expect(policy.outputMaterialization.scalarMpfrGraph.exactBarrierCount).toBe(
      9,
    );
    expect(policy.outputMaterialization.scalarMpfrGraph.source).toContain(
      "no_binary64_kappa_sigma_mass_integral_or_tail_residual_intermediate_is_reused",
    );
  });

  it("freezes materialization barriers but does not confer output acceptance", () => {
    const output =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.outputMaterialization;
    expect(output.scalarOrder).toEqual([
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ]);
    expect(output.arrayLevelOrder).toEqual(["L0", "L1", "L2", "AUDIT"]);
    expect(output.arrayRoleOrder).toHaveLength(5);
    expect(output.baseArrays.L0L1L2).toContain(
      "same_immutable_projected_level_archive_bits",
    );
    expect(output.baseArrays.AUDIT).toContain(
      "MPFR256_composite_evaluator_from_the_same_projected_final_L2",
    );
    expect(output.targetArrays.finiteNode).toContain(
      "set_ui(thirtyTwo,32);_div(lambdaMp,one,thirtyTwo);_mul(xBaseMp,lambdaMp,xMp)_with_no_get_d_or_binary64_lambda_x_product",
    );
    expect(output.MPFR256CompositeEvaluator.auditRhoToXProgram).toContain(
      "otherwise_sub(oneMinusRho,one,rhoMp);_div(xMp,rhoMp,oneMinusRho)_and_do_not_get_d",
    );
    expect(output.MPFR256CompositeEvaluator.input).toContain(
      "immutable_L2_rho_source_support_bits_168720_through_168847",
    );
    expect(
      output.MPFR256CompositeEvaluator.coreBranchProgram.join("\n"),
    ).toContain("set_ui(weightMagnitude,j_is_0_or_127?1:2)");
    expect(output.MPFR256CompositeEvaluator.tailBranchProgram).toContain(
      "mul(HLinearTerm,Hy1,yMinusOne);_add(HBase,H1,HLinearTerm);_mul(HCorrection,oneMinusYSquared,Ah);_add(H,HBase,HCorrection)",
    );
    expect(output.MPFR256CompositeEvaluator.tailBranchProgram).toContain(
      "mul(QLinearTerm,Qy1,yMinusOne);_add(QBase,Q1,QLinearTerm);_mul(QCorrection,oneMinusYSquared,Aq);_add(Q,QBase,QCorrection)",
    );
    expect(output.targetArrays.mixedBinary64EvaluationAllowed).toBe(false);
    expect(output.outputBarrier).toContain(
      "exactly_one_terminal_dictionary_get_d",
    );
    expect(output.materializationOrder).toEqual([
      "nine_scalars",
      "twenty_level_role_arrays",
      "six_core_coefficient_arrays",
      "two_tail_coefficient_arrays",
    ]);
    expect(output.binaryEncoding).toContain("f64le");
    expect(output.materializationIsNotAcceptance).toBe(true);
  });

  it("rejects lever/tile tensors, extra keys, and every caller numerical knob", () => {
    const api =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.closedPrimaryApi;
    expect(api.callerSuppliedNumericalKnobsAllowed).toBe(false);
    expect(api.callerSuppliedInitialValuesAllowed).toBe(false);
    expect(
      api.callerSuppliedTolerancePrecisionGridJoinTailOrderQuadratureOrIterationLimitsAllowed,
    ).toBe(false);
    expect(api.extraRequestKeysAllowed).toBe(false);
    expect(api.explicitlyForbiddenInputRoles).toEqual(
      expect.arrayContaining([
        "declared_lever_tensor",
        "tile_tensor",
        "submitted_lever_or_tile_tensor",
        "caller_initializer_C_h_q",
        "caller_tolerances",
        "caller_solver_options",
      ]),
    );
    expect(api.explicitlyForbiddenOutputRoles).toEqual(
      expect.arrayContaining([
        "lever_tensor",
        "tile_tensor",
        "physical_viability",
        "propulsion_unlock",
        "transport_unlock",
      ]),
    );
    expect(api.declaredLeverOrTileTensorUsed).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.scope
        .serverOwnedReplayLane,
    ).toContain("generic_v2_transport_target");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.scope
        .v3ReplayAuthorityAsserted,
    ).toBe(false);
  });

  it("supersedes only named predecessor numeric graphs and freezes nonoverlapping arenas", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    expect(
      policy.predecessorSupersession.rows.map((row) => row.predecessorTopic),
    ).toEqual([
      "single_underspecified_rho_to_x_mapping",
      "mass_integral_barrier_or_core_plus_tail_accumulation_wording",
      "scalar_output_values_reused_from_binary64_tail_residual_intermediates",
      "accepted_endpoint_bits_without_a_projection_gate",
      "implicit_or_dynamic_numeric_storage",
    ]);
    expect(
      policy.predecessorSupersession.successorDoesNotSupersedeSemanticSeed,
    ).toBe(true);
    expect(
      policy.predecessorSupersession
        .successorDoesNotCreateReplayTransportOrAcceptanceAuthority,
    ).toBe(true);
    expect(policy.resourceModel.mpfrArena).toMatchObject({
      elementCount: 65536,
      precisionBitsPerElement: 256,
      logicalSignificandBytes: 2097152,
    });
    expect(policy.resourceModel.binary64SolverArena).toMatchObject({
      elementCount: 262144,
      byteLength: 2097152,
    });
    expect(policy.resourceModel.permutationArena).toMatchObject({
      elementCount: 257,
      byteLength: 1028,
    });
    expect(policy.resourceModel.outputBuffers).toMatchObject({
      totalBufferCount: 37,
      totalByteLength: 26952,
    });
    expect(policy.resourceModel.coreLevelOperatorLifetime).toMatchObject({
      operatorSetCapacity: 1,
      levelOrder: ["L0", "L1", "L2"],
      simultaneousAllLevelOperatorGenerationAllowed: false,
    });
    expect(
      policy.resourceModel.coreLevelOperatorLifetime.transferSourceRhoScratch
        .L0ToL1,
    ).toContain("167821_through_167884");
    expect(
      policy.resourceModel.coreLevelOperatorLifetime.transferSourceRhoScratch
        .L1ToL2,
    ).toContain("167821_through_167916");
    expect(
      policy.resourceModel.coreLevelOperatorLifetime.L2RhoSourceSupport
        .copyAndGate,
    ).toContain("fail_before_join_on_any_mismatch");
    expect(policy.resourceModel.binary64SolverArena.tailReuse).toContain(
      "currentTailState_slots_32896_through_32960",
    );
    expect(policy.resourceModel.binary64SolverArena.tailReuse).toContain(
      "join_slots_168077_through_168080",
    );
    expect(policy.resourceModel.binary64SolverArena.tailReuse).toContain(
      "immutable_L2_rho_source_support_168720_through_168847",
    );
    expect(policy.operationSchedule).toContain(
      "generate_only_L0_nodes_and_core_D_D2_operators_in_the_single_current_operator_set;_defer_L1_L2_and_AUDIT_generation",
    );
    expect(policy.operationSchedule).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("generate_L0_L1_L2_nodes"),
      ]),
    );
    expect(policy.resourceModel.dynamicNumericAllocationAllowed).toBe(false);
    expect(policy.resourceModel.preflightOrder.at(-1)).toContain(
      "no_output_buffers",
    );
  });

  it("keeps implementation, runtime, execution, acceptance, lamps, and physical claims locked", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    expect(policy.maturity).toContain("with_bound_GL256_fixture");
    expect(policy.authorityLocks.fixtureRuntimeAuthority).toBe(false);
    expect(policy.completionBoundary).toEqual({
      primaryFiniteOperationGraphFrozen: true,
      gaussLegendreFixtureBound: true,
      primaryImplementationPresent: false,
      runtimeClosurePresent: false,
      preexecutionPresealPresent: false,
      executionAuthorized: false,
      executionObserved: false,
      outputPresent: false,
      outputAccepted: false,
      directedProofPresent: false,
      seedAccepted: false,
    });
    expect(
      Object.values(policy.unresolved).every((value) => value === null),
    ).toBe(true);
    expect(policy.blockers).not.toContain(
      "final_gauss_legendre_256_manifest_and_raw_fixture_pins_absent",
    );
    expect(
      Object.values(policy.authorityLocks).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(policy.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(policy.attemptPolicy).toMatchObject({
      maximumCandidateAttempts: 1,
      retryAllowed: false,
      retuneAllowed: false,
    });
  });

  it("accepts only the authoritative singleton and distinguishes an exact external copy", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1;
    expect(isNhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1(policy)).toBe(
      true,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(policy),
    ).toEqual([]);

    const copy = structuredClone(policy);
    expect(isNhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1(copy)).toBe(
      false,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(copy),
    ).toEqual([
      "spherical_seed_primary_numerics_external_copy_not_authoritative",
    ]);
    (
      copy.attemptPolicy as { maximumCandidateAttempts: number }
    ).maximumCandidateAttempts = 2;
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(copy),
    ).toEqual(["spherical_seed_primary_numerics_semantic_mismatch"]);
  });

  it("rejects proxies and accessors without executing user traps", () => {
    let trapReads = 0;
    const proxy = new Proxy(
      {},
      {
        get() {
          trapReads += 1;
          throw new Error("must not execute");
        },
        ownKeys() {
          trapReads += 1;
          throw new Error("must not execute");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(proxy),
    ).toEqual(["proxy_forbidden:/"]);
    expect(trapReads).toBe(0);

    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, "payload", {
      enumerable: true,
      get() {
        trapReads += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(accessor),
    ).toEqual(["object_property_surface:/payload"]);
    expect(trapReads).toBe(0);
  });

  it("rejects hostile object and array surfaces deterministically", () => {
    const hidden = { okay: true };
    Object.defineProperty(hidden, "hidden", {
      value: 1,
      enumerable: false,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(hidden),
    ).toEqual(["object_property_surface:/hidden"]);

    const symbol = { okay: true } as Record<PropertyKey, unknown>;
    symbol[Symbol("hidden")] = 1;
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(symbol),
    ).toEqual(["symbol_key:/"]);

    const forbidden: Record<string, unknown> = {};
    Object.defineProperty(forbidden, "constructor", {
      value: "poison",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(forbidden),
    ).toEqual(["forbidden_key:/constructor"]);

    const sparse = new Array(2);
    sparse[1] = "present";
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(sparse),
    ).toEqual(["array_surface:/"]);

    const side = [1] as unknown[] & { side?: string };
    side.side = "forbidden";
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(side),
    ).toEqual(["array_surface:/"]);

    const cycle: { self?: unknown } = {};
    cycle.self = cycle;
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(cycle),
    ).toEqual(["cycle:/self"]);
  });

  it("enforces depth, width, node, string, and numeric limits", () => {
    const limits =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_VALIDATOR_LIMITS;
    let deep: Record<string, unknown> = {};
    const root = deep;
    for (let index = 0; index <= limits.maximumDepth; index += 1) {
      const child: Record<string, unknown> = {};
      deep.child = child;
      deep = child;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(root)[0],
    ).toContain("snapshot_depth_limit:");

    const wide = Array.from({ length: limits.maximumArrayLength + 1 }, () => 0);
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(wide),
    ).toEqual(["array_length_limit:/"]);

    const nodeBomb = Array.from({ length: 65 }, () =>
      Array.from({ length: 256 }, () => 0),
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(
        nodeBomb,
      )[0],
    ).toContain("snapshot_node_limit:");

    const longString = "x".repeat(limits.maximumStringUtf8Bytes + 1);
    expect(
      nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(
        longString,
      ),
    ).toEqual(["string_byte_limit:/"]);
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, -0]) {
      expect(
        nhm2SphericalBosonStarNewtonianSeedPrimaryNumericsV1Violations(invalid),
      ).toEqual(["invalid_number:/"]);
    }
  });
});
