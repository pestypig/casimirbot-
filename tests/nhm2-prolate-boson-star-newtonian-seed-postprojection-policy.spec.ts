import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v2";
import * as policyModule from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-postprojection-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_AUTHORITATIVE_SINGLETONS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_HASH_POLICY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256_DOMAIN,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ANALYTIC_Z_PINS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_MAPPING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_TOTALS,
  isNhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1,
  nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations,
} from "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-postprojection-policy.v1";

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

type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;

const gcd = (left: bigint, right: bigint): bigint => {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
};

const rational = (numerator: bigint, denominator = 1n): Rational => {
  if (denominator === 0n) throw new Error("zero rational denominator");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (sign * numerator) / divisor,
    denominator: (denominator < 0n ? -denominator : denominator) / divisor,
  };
};

const parseRational = (encoded: string): Rational => {
  if (!/^(0|-[1-9][0-9]*|[1-9][0-9]*)\/[1-9][0-9]*$/.test(encoded)) {
    throw new Error(`noncanonical rational grammar: ${encoded}`);
  }
  const [numerator, denominator] = encoded.split("/");
  const parsed = rational(BigInt(numerator), BigInt(denominator));
  const canonical = `${parsed.numerator}/${parsed.denominator}`;
  if (canonical !== encoded) {
    throw new Error(`nonreduced rational: ${encoded}`);
  }
  return parsed;
};

const add = (left: Rational, right: Rational): Rational =>
  rational(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
const subtract = (left: Rational, right: Rational): Rational =>
  rational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
const multiply = (left: Rational, right: Rational): Rational =>
  rational(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
const divide = (left: Rational, right: Rational): Rational =>
  rational(
    left.numerator * right.denominator,
    left.denominator * right.numerator,
  );
const equalRational = (left: Rational, right: Rational): boolean =>
  left.numerator === right.numerator && left.denominator === right.denominator;
const compareRational = (left: Rational, right: Rational): number => {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
};
const halfSum = (left: Rational, right: Rational): Rational =>
  divide(add(left, right), rational(2n));

const matrixVector = (matrix: Rational[][], vector: Rational[]): Rational[] =>
  matrix.map((row) =>
    row.reduce(
      (sum, entry, index) => add(sum, multiply(entry, vector[index])),
      rational(0n),
    ),
  );

const transposeVector = (
  matrix: Rational[][],
  vector: Rational[],
): Rational[] =>
  matrix[0].map((_, column) =>
    matrix.reduce(
      (sum, row, index) => add(sum, multiply(row[column], vector[index])),
      rational(0n),
    ),
  );

const binary64BitsToRational = (encodedBits: string): Rational => {
  if (!/^[0-9a-f]{16}$/.test(encodedBits)) {
    throw new Error(`invalid bits: ${encodedBits}`);
  }
  const bits = BigInt(`0x${encodedBits}`);
  const sign = bits >> 63n;
  const exponent = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  if (exponent === 0x7ff) throw new Error("nonfinite fixture bits");
  if (exponent === 0 && fraction === 0n) return rational(0n);
  const significand = exponent === 0 ? fraction : (1n << 52n) + fraction;
  const binaryExponent = exponent === 0 ? -1074 : exponent - 1023 - 52;
  const numerator =
    (sign === 1n ? -significand : significand) <<
    BigInt(Math.max(binaryExponent, 0));
  const denominator = 1n << BigInt(Math.max(-binaryExponent, 0));
  return rational(numerator, denominator);
};

const expectRationalRoundsToBits = (
  encodedRational: string,
  encodedBits: string,
): void => {
  const exact = parseRational(encodedRational);
  const bits = BigInt(`0x${encodedBits}`);
  const selected = binary64BitsToRational(encodedBits);
  if (exact.numerator === 0n) {
    expect(encodedBits).toBe("0000000000000000");
    return;
  }
  const negative = bits >> 63n === 1n;
  const lowerBits = negative ? bits + 1n : bits - 1n;
  const upperBits = negative ? bits - 1n : bits + 1n;
  const lower = binary64BitsToRational(
    lowerBits.toString(16).padStart(16, "0"),
  );
  const upper = binary64BitsToRational(
    upperBits.toString(16).padStart(16, "0"),
  );
  const lowerMidpoint = halfSum(lower, selected);
  const upperMidpoint = halfSum(selected, upper);
  const lowerComparison = compareRational(exact, lowerMidpoint);
  const upperComparison = compareRational(exact, upperMidpoint);
  const selectedMantissaIsEven = (bits & 1n) === 0n;
  expect(
    lowerComparison > 0 || (lowerComparison === 0 && selectedMantissaIsEven),
  ).toBe(true);
  expect(
    upperComparison < 0 || (upperComparison === 0 && selectedMantissaIsEven),
  ).toBe(true);
};

const legendreValues = (z: Rational, maximumDegree: number): Rational[] => {
  const values = [rational(1n)];
  if (maximumDegree === 0) return values;
  values.push(z);
  for (let ell = 1; ell < maximumDegree; ell += 1) {
    values.push(
      divide(
        subtract(
          multiply(multiply(rational(BigInt(2 * ell + 1)), z), values[ell]),
          multiply(rational(BigInt(ell)), values[ell - 1]),
        ),
        rational(BigInt(ell + 1)),
      ),
    );
  }
  return values;
};

const basisFromBits = (zBits: readonly string[], degrees: readonly number[]) =>
  zBits.map((bits) => {
    const values = legendreValues(
      binary64BitsToRational(bits),
      Math.max(...degrees),
    );
    return degrees.map((degree) => values[degree]);
  });

const Gram = (basis: Rational[][]): Rational[][] =>
  basis[0].map((_, left) =>
    basis[0].map((__, right) =>
      basis.reduce(
        (sum, row) => add(sum, multiply(row[left], row[right])),
        rational(0n),
      ),
    ),
  );

const exactRealDctIN2 = (valueBits: readonly string[]): Rational[] => {
  if (valueBits.length !== 3) throw new Error("n=2 fixture required");
  const values = valueBits.map(binary64BitsToRational);
  const cosineRows = [
    [rational(1n), rational(1n), rational(1n)],
    [rational(1n), rational(0n), rational(-1n)],
    [rational(1n), rational(-1n), rational(1n)],
  ];
  const coefficients = cosineRows.map((cosines) =>
    add(
      add(
        multiply(rational(1n, 2n), values[0]),
        multiply(cosines[1], values[1]),
      ),
      multiply(rational(1n, 2n), multiply(cosines[2], values[2])),
    ),
  );
  coefficients[0] = divide(coefficients[0], rational(2n));
  coefficients[2] = divide(coefficients[2], rational(2n));
  return coefficients;
};

const endpointDerivativeSum = (coefficients: Rational[]): Rational =>
  coefficients
    .slice(1)
    .reduce(
      (sum, coefficient, index) =>
        add(sum, multiply(rational(BigInt((index + 1) ** 2)), coefficient)),
      rational(0n),
    );

describe("newtonian seed postprojection policy v1", () => {
  it("identity-binds the sealed seed and numeric materialization singletons", () => {
    const anchors =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_AUTHORITATIVE_SINGLETONS;
    expect(anchors.seedV1).toBe(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1);
    expect(anchors.seedGridLevelsV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
    );
    expect(anchors.seedOutputArrayInventoryV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
    );
    expect(anchors.candidatePlanV2).toBe(
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
    );
    expect(anchors.numericMaterializationPolicyV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
    );
    expect(anchors.numericMaterializationOperationGraphV1).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
    );
    expect(anchors.predecessorRunPlanV2RuntimeChannelSchemaRegistry).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
    ).toMatchObject({
      sha256:
        "ec9905f87b5d11c902a5b292772bdc11ec755ecd00fa08949382f42f1671652d",
      canonicalSizeBytes: 243_240,
    });
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    ).toMatchObject({
      sha256:
        "a4383a581779f90736588de253e2148c392156f001636a2b994e8eb0c905c835",
      canonicalSizeBytes: 39_345,
    });
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS,
    ).toBe("sealed_preregistration_read_only_red_team_clear");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.bindings
        .seedV1.binding,
    ).toBe(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.bindings
        .candidatePlanV2.binding,
    ).toBe(NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING);
  });

  it("freezes exactly six raw arrays and 237568 bytes", () => {
    const inventory =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY;
    expect(inventory).toHaveLength(6);
    expect(inventory.map((entry) => entry.evidenceIndex)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(inventory.map((entry) => entry.shape)).toEqual([
      [64, 32],
      [64, 32],
      [96, 48],
      [96, 48],
      [128, 64],
      [128, 64],
    ]);
    expect(inventory.map((entry) => entry.byteLength)).toEqual([
      16_384, 16_384, 36_864, 36_864, 65_536, 65_536,
    ]);
    expect(inventory.map((entry) => entry.relativePath)).toEqual([
      "L0/00-raw-scalar-u.f64le",
      "L0/01-raw-potential-v.f64le",
      "L1/00-raw-scalar-u.f64le",
      "L1/01-raw-potential-v.f64le",
      "L2/00-raw-scalar-u.f64le",
      "L2/01-raw-potential-v.f64le",
    ]);
    expect(inventory.map((entry) => entry.absoluteEvidencePath)).toEqual([
      "/run/postprojection-evidence/L0/00-raw-scalar-u.f64le",
      "/run/postprojection-evidence/L0/01-raw-potential-v.f64le",
      "/run/postprojection-evidence/L1/00-raw-scalar-u.f64le",
      "/run/postprojection-evidence/L1/01-raw-potential-v.f64le",
      "/run/postprojection-evidence/L2/00-raw-scalar-u.f64le",
      "/run/postprojection-evidence/L2/01-raw-potential-v.f64le",
    ]);
    expect(
      inventory.every((entry) =>
        entry.sourceChronology.includes("no_value_normalization"),
      ),
    ).toBe(true);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_TOTALS,
    ).toEqual({
      arrayCount: 6,
      float64ElementCount: 29_696,
      arrayByteLength: 237_568,
    });
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_HASH_POLICY.recipe,
    ).toContain("u64be(relative_path_utf8_byte_length)");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_HASH_POLICY.rawBytesMustBeComparedAfterSecureRereadNotDigestOnly,
    ).toBe(true);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_HASH_POLICY.negativeZeroHandling,
    ).toBe("reject_the_raw_evidence_array_without_normalization");
  });

  it("freezes the six source-role crosswalk and regenerated analytic-z pins", () => {
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_MAPPING.map(
        (entry) => [
          entry.evidenceIndex,
          entry.seedMultipoleInventoryIndex,
          entry.seedBaseInventoryIndex,
          entry.multipoleByteLength,
          entry.baseByteLength,
        ],
      ),
    ).toEqual([
      [0, 6, 2, 8_192, 16_384],
      [1, 7, 3, 8_192, 16_384],
      [2, 14, 10, 18_432, 36_864],
      [3, 15, 11, 18_432, 36_864],
      [4, 22, 18, 32_768, 65_536],
      [5, 23, 19, 32_768, 65_536],
    ]);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SOURCE_ROLE_TOTALS,
    ).toEqual({
      multipoleByteLength: 118_784,
      comparedBaseByteLength: 237_568,
    });
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_ANALYTIC_Z_PINS,
    ).toEqual([
      {
        levelId: "L0",
        angularNodeCount: 32,
        rawF64leSha256:
          "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152",
        byteLength: 256,
      },
      {
        levelId: "L1",
        angularNodeCount: 48,
        rawF64leSha256:
          "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c",
        byteLength: 384,
      },
      {
        levelId: "L2",
        angularNodeCount: 64,
        rawF64leSha256:
          "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28",
        byteLength: 512,
      },
    ]);
    const basis =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH.angularCoordinateAndBasis;
    expect(basis.analyticZEvidence).toContain("never_staged");
    expect(basis.exactStructuralFullRankRationale.even).toContain(
      "degree_strictly_less_than_M_polynomials_in_t=z_squared",
    );
    expect(basis.exactStructuralFullRankRationale.odd).toContain(
      "nonzero_z_rows_include_at_least_M_distinct_t_values",
    );
    expect(
      basis.exactStructuralFullRankRationale
        .numericConditionOrPivotEstimateUsedForAcceptance,
    ).toBe(false);
  });

  it("freezes identity-weight MPFR256 normal equations without fallback", () => {
    const graph =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH;
    expect(graph.arithmeticKernelExtension.importedArithmeticKernel).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH.arithmeticKernel,
    );
    expect(
      graph.arithmeticKernelExtension
        .inheritedPrecisionExponentRangeRoundingFlagGradualUnderflowAndZeroRulesUnchanged,
    ).toBe(true);
    expect(
      graph.arithmeticKernelExtension.projectionIntegerInjection,
    ).toContain("mpfr_set_z");
    expect(
      graph.arithmeticKernelExtension
        .replacementPartialRestatementOrOverrideAllowed,
    ).toBe(false);
    expect(graph.objective.weights).toBe(
      "every_angular_row_weight_is_exact_integer_1",
    );
    expect(graph.objective.quadratureWeightsAllowed).toBe(false);
    expect(graph.objective.sinThetaWeightsAllowed).toBe(false);
    expect(graph.objective.endpointHalfWeightsAllowed).toBe(false);
    expect(graph.Gram.loopOrder).toBe(
      "a_ascending_0_through_M-1_outer_b_ascending_0_through_a_middle_k_ascending_0_through_N-1_inner",
    );
    expect(graph.noPivotCholesky.pivotingAllowed).toBe(false);
    expect(graph.noPivotCholesky.diagonalJitterAllowed).toBe(false);
    expect(graph.noPivotCholesky.combinedInterleavedLoopOrder).toContain(
      "first_compute_each_L[i,j]",
    );
    expect(graph.noPivotCholesky.combinedInterleavedLoopOrder).toContain(
      "then_compute_L[i,i]",
    );
    expect(
      graph.noPivotCholesky.perRowPrimitiveProgram
        .diagonalAfterEveryOffDiagonalInThisRow,
    ).toContain(
      "require_diagonalResidual_is_finite_and_strictly_greater_than_positive_zero",
    );
    expect(
      graph.noPivotCholesky.wholeOffDiagonalMatrixThenWholeDiagonalPassAllowed,
    ).toBe(false);
    expect(graph.triangularSolves.backward.loopOrder).toBe(
      "i_descending_M-1_through_0_then_k_ascending_i+1_through_M-1",
    );
    expect(graph.arithmeticKernelExtension.prohibited).toEqual(
      expect.arrayContaining([
        "binary64_intermediate_arithmetic",
        "fused_multiply_add",
        "BLAS_or_LAPACK",
        "pivoting_or_permutation",
        "regularization_or_diagonal_jitter",
        "QR_or_SVD_fallback",
        "tolerance_selected_branch",
        "producer_supplied_basis_Gram_factor_or_projector",
      ]),
    );
  });

  it("uses serialized analytic z bits and the exact imported numeric subgraphs", () => {
    const graph =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH;
    expect(graph.importedNumericDependency.policyBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
    );
    expect(graph.importedNumericDependency.operationGraphBinding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    );
    expect(graph.importedNumericDependency.requiredSubgraphs).toEqual([
      "arithmeticKernel",
      "mappedNodes",
      "legendreForward",
      "angularSynthesis",
      "radialDctI",
      "inventoryTraversalAndPreArithmeticMasks",
    ]);
    for (const requiredSubgraph of graph.importedNumericDependency
      .requiredSubgraphs) {
      expect(
        Object.prototype.hasOwnProperty.call(
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
          requiredSubgraph,
        ),
      ).toBe(true);
    }
    expect(
      graph.importedNumericDependency.requiredContextSlices
        .inventoryTraversalAndPreArithmeticMasks
        .importedWholeMultipolePreArithmeticShortCircuitReused,
    ).toBe(false);
    expect(graph.angularCoordinateAndBasis.coordinateSource).toContain(
      "serialized_analytic_z_bits",
    );
    expect(
      graph.angularCoordinateAndBasis.preSerializationMappedZMayFlowToBasis,
    ).toBe(false);
    expect(
      graph.angularCoordinateAndBasis.cosOfSerializedThetaMayFlowToBasis,
    ).toBe(false);
  });

  it("freezes exact masks, counts, DCT-I a1 phase, and reconstruction replay", () => {
    const graph =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH;
    expect(graph.postprojectionMultipoleOverwrites.multipoleMasks).toEqual([
      "scalar_all_q_at_radial_index_j=0",
      "scalar_all_q_at_radial_index_j=Nr-1",
      "potential_all_q_at_radial_index_j=Nr-1",
    ]);
    expect(graph.postprojectionMultipoleOverwrites.totals).toEqual({
      scalar: 144,
      potential: 72,
      all: 216,
    });
    expect(
      graph.postprojectionMultipoleOverwrites
        .projectionExecutedForEveryRawRadialRow,
    ).toBe(true);
    expect(
      graph.postprojectionMultipoleOverwrites
        .poisonedOrNonzeroRawBoundaryRowsStillProjectedBeforeOverwrite,
    ).toBe(true);
    expect(
      graph.postprojectionMultipoleOverwrites
        .preArithmeticMultipoleShortCircuitAllowed,
    ).toBe(false);
    expect(graph.rightHandSide.perRawRadialRow).toBe(true);
    expect(graph.rightHandSide.preprojectionRadialMaskAllowed).toBe(false);
    expect(graph.triangularSolves.coefficientBarrier).toContain(
      "overwrites_follow_only_after_every_row_barrier",
    );
    expect(graph.reconstruction.nodalMaskTotals).toEqual({
      scalar: 570,
      potential: 144,
      all: 714,
    });
    expect(graph.phase.modeFirstProgram[0]).toContain("for_q_ascending");
    expect(graph.phase.modeFirstProgram).toEqual(
      expect.arrayContaining([
        expect.stringContaining("local_provisional-source_DCT-I"),
        expect.stringContaining("a1_q=RN256(exact_-2"),
        expect.stringContaining("for_q_ascending_use_exact_P_(2q+1)(1)=1"),
      ]),
    );
    expect(graph.phase.synthesizeAxisValueBeforeModeDctAllowed).toBe(false);
    expect(graph.phase.axisValueBinary64OrMpfrBarrierAllowed).toBe(false);
    expect(
      graph.phase.provisionalDctComposition
        .importedAcceptedPostprojectionSourceSemanticsReusedForProvisionalPass,
    ).toBe(false);
    expect(graph.phase.maxMinNorthAxisHeuristicAllowed).toBe(false);
    expect(graph.phase.peakHeuristicAllowed).toBe(false);
    expect(graph.phase.crossLevelPhaseFallbackAllowed).toBe(false);
    expect(graph.reconstruction.exactByteComparison).toContain(
      "complete_recomputed_f64le_byte_strings",
    );
  });

  it("accepts only exact map replay and adds no numerical threshold", () => {
    const acceptance =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH.acceptance;
    expect(acceptance.kind).toBe("exact_deterministic_map_replay_only");
    expect(acceptance.rawToReconstructionResidualThreshold).toBeNull();
    expect(acceptance.normalEquationResidualThreshold).toBeNull();
    expect(acceptance.toleranceBasedAcceptanceAllowed).toBe(false);
    expect(acceptance.scientificAcceptanceEstablished).toBe(false);
    expect(acceptance.seedAdmissionEstablished).toBe(false);
    expect(acceptance.artifactAdmissionEstablished).toBe(false);
    expect(acceptance.mismatch).toContain("without_tolerance");
    expect(acceptance.mismatch).toContain("retune");
  });

  it("closes every additive binary64 and mpfr_get_d barrier exactly once", () => {
    const inventory =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH
        .arithmeticKernelExtension.additiveBinary64BarrierInventory;
    expect(inventory.status).toContain("effective_closed_union");
    expect(inventory.entries.map((entry) => entry.id)).toEqual(
      inventory.allowedBarrierIds,
    );
    expect(new Set(inventory.allowedBarrierIds).size).toBe(
      inventory.allowedBarrierIds.length,
    );
    expect(inventory.allowedBarrierIds).toEqual(
      expect.arrayContaining([
        "maskedProvisionalMultipoleInputBits",
        "symbolicBaseMaskBits",
      ]),
    );
    expect(
      inventory.entries.find(
        (entry) => entry.id === "maskedProvisionalMultipoleInputBits",
      )?.primitive,
    ).toContain("mpfr_set_d_reinjection");
    expect(
      inventory.entries.find((entry) => entry.id === "symbolicBaseMaskBits")
        ?.primitive,
    ).toContain("without_evaluator_or_get_d");
    expect(inventory.additiveMpfrGetDBarrierIds).toEqual([
      "serialized_analytic_z_bits",
      "provisionalPostprojectionCoefficientBits",
      "provisionalA1ReceiptBits",
      "finalA1ReceiptBits",
      "final_ordered_array_element_bits",
    ]);
    expect(inventory.importedMappedNodesContextSlice).toMatchObject({
      includedGetDBarrierIds: ["serialized_analytic_z_bits"],
      excludedAndNotExecutedGetDBarrierIds: [
        "serialized_rho_node_bits",
        "serialized_theta_node_bits",
      ],
      preSerializationThetaAndZMpfrArithmeticStillExecutedExactly: true,
    });
    expect(new Set(inventory.additiveMpfrGetDBarrierIds).size).toBe(
      inventory.additiveMpfrGetDBarrierIds.length,
    );
    expect(
      inventory.additiveMpfrGetDBarrierIds.every((id) =>
        inventory.allowedBarrierIds.includes(id),
      ),
    ).toBe(true);
    expect(inventory.unlistedBinary64IntermediateAllowed).toBe(false);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH
        .triangularSolves.coefficientBarrier,
    ).toContain("canonicalize_either_zero_sign_to_positive");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH
        .rawInput.validationOrder,
    ).toContain("negative_zero_is_rejected");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH
        .reconstruction.maskedOutputBarrier,
    ).toContain("literal_0000000000000000");
  });

  it("defines a closed independent-verifier replay receipt with no admission", () => {
    const schema =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA;
    expect(new Set(schema.matchExactKeys).size).toBe(
      schema.matchExactKeys.length,
    );
    expect(new Set(schema.rejectionExactKeys).size).toBe(
      schema.rejectionExactKeys.length,
    );
    expect(schema.extraKeysAllowed).toBe(false);
    expect(Object.keys(schema.matchFields)).toEqual(schema.matchExactKeys);
    expect(Object.keys(schema.rejectionFields)).toEqual(
      schema.rejectionExactKeys,
    );
    expect(schema.discriminator).toEqual({
      field: "outcome",
      values: ["match", "rejection"],
    });
    expect(schema.matchFields.outcome).toBe("literal_match");
    expect(schema.matchFields.scientificAdmissionGranted).toBe("literal_false");
    expect(schema.matchFields.seedAdmissionGranted).toBe("literal_false");
    expect(schema.matchFields.artifactAdmissionGranted).toBe("literal_false");
    expect(schema.matchFields.brokerSameAttemptEstablished).toBe(
      "literal_false",
    );
    expect(schema.matchFields.runtimeIsolationEstablished).toBe(
      "literal_false",
    );
    expect(schema.matchFields.authoritativeRegistrationAllowed).toBe(
      "literal_false",
    );
    expect(schema.matchOutcomeIff).toContain(
      "allReplayMatched_is_literal_true",
    );
    expect(schema.matchCrossFieldInvariants).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "commonRunRequestBinding_recursively_equals_candidateInstanceIdentity.commonRunRequestBinding",
        ),
        expect.stringContaining(
          "static_source-toolchain-executable-no-import_separation_without_same-attempt_or_runtime-isolation_authority",
        ),
        expect.stringContaining(
          "authoritativeRegistrationAllowed_scientificAdmissionGranted",
        ),
      ]),
    );
    expect(schema.levelReceipt.levelOrder).toEqual(["L0", "L1", "L2"]);
    expect(schema.levelReceipt.exactLength).toBe(3);
    expect(Object.keys(schema.levelReceipt.fields)).toEqual(
      schema.levelReceipt.exactKeys,
    );
    expect(schema.levelReceipt.fields.levelReplayMatched).toContain(
      "every_preceding_same-level_boolean",
    );
    expect(schema.levelReceipt.replayMatchConjunction).not.toMatch(
      /levelReplayMatched.*levelReplayMatched/,
    );
    expect(schema.levelReceipt.choleskyPivotCountByLevel).toEqual({
      L0: 16,
      L1: 24,
      L2: 32,
    });
    expect(
      schema.implementationIndependence
        .producerAndVerifierSourceBindingsMustDiffer,
    ).toBe(true);
    expect(
      schema.implementationIndependence
        .verifierRegeneratesZBasisGramCholeskyRhsSolveMasksPhaseAndReconstruction,
    ).toBe(true);
    expect(
      schema.implementationIndependence
        .sharedGeneratedProjectorGramCholeskyOrCoefficientTableAllowed,
    ).toBe(false);
    expect(
      schema.implementationIndependence.producerProjectionImplementationSchema,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.producerProjectionImplementation,
    );
    expect(
      schema.implementationIndependence.verifierProjectionImplementationSchema,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.verifierProjectionImplementation,
    );
    expect(
      schema.implementationIndependence.implementationSeparationReceiptSchema,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS.implementationSeparationReceipt,
    );
    expect(schema.authorityBoundary).toMatchObject({
      candidateReceiptClaimsOnly: expect.stringContaining("self-reports"),
      currentReceiptEstablishesMapping: false,
      futureV3FullValidationRequiredToEstablishMapping: true,
      candidateReceiptEstablishesObservationProvenance: false,
      candidateReceiptEstablishesSameRunOrAttemptProvenance: false,
      brokerSameAttemptEstablishedLiteral: false,
      runtimeIsolationEstablishedLiteral: false,
      authoritativeRegistrationAllowedLiteral: false,
      scientificAdmissionGrantedLiteral: false,
      seedAdmissionGrantedLiteral: false,
      artifactAdmissionGrantedLiteral: false,
      proofGateOrCertificateAuthority: false,
      physicalPropulsionTransportOrSemiclassicalAuthority: false,
    });
    expect(schema.rootConjunction).toContain("all_six_root_replay_booleans");
    expect(schema.matchFields.allReplayMatched).toBe(schema.rootConjunction);
    expect(schema.matchFields.allReplayMatched).not.toContain(
      "runtime_separation",
    );
    expect(schema.typedRejection.failureCodeEnum).toEqual(
      expect.arrayContaining([
        "static_implementation_evidence_mismatch",
        "scalar_coefficient_serialization_nonfinite",
        "potential_coefficient_serialization_nonfinite",
        "scalar_base_reconstruction_serialization_nonfinite",
        "potential_base_reconstruction_serialization_nonfinite",
      ]),
    );
    expect(
      schema.typedRejection.positiveReplayBindingLiteralOnRejection,
    ).toBeNull();
    expect(schema.typedRejection.rejectionEmitsPositiveReplayBinding).toBe(
      false,
    );
    expect(schema.rejectionExactKeys).toEqual(
      expect.arrayContaining([
        "candidateInstanceIdentityOrNull",
        "candidateInstanceIdentityBindingOrNull",
        "numericStaging32RuntimeClosureBindingOrNull",
        "rawEvidenceRuntimeClosureBindingOrNull",
        "attemptedMpfrGmpRuntimeBindingOrNull",
        "attemptedProducerProjectionImplementationBindingOrNull",
        "attemptedVerifierProjectionImplementationBindingOrNull",
        "attemptedImplementationSeparationReceiptBindingOrNull",
        "brokerSameAttemptEstablished",
        "runtimeIsolationEstablished",
        "authoritativeRegistrationAllowed",
      ]),
    );
    expect(
      schema.receiptInstanceBindingPolicy
        .staticPolicySingletonValidatorIsRuntimeReceiptSchemaInterpreter,
    ).toBe(false);
    expect(
      schema.receiptInstanceBindingPolicy.runtimeTypedInterpreterBinding,
    ).toBeNull();
    expect(
      schema.receiptInstanceBindingPolicy
        .proseSchemaAloneMayRegisterMatchBinding,
    ).toBe(false);
    expect(
      schema.receiptInstanceBindingPolicy.matchBindingRecipe.canonicalHash
        .orderedPreimage,
    ).toEqual([
      "domain_UTF8_bytes_including_the_single_terminal_LF",
      "u64be_canonical_value_UTF8_byte_length",
      "canonical_value_UTF8_bytes",
    ]);
    expect(
      schema.receiptInstanceBindingPolicy
        .bindingIdentityIsCandidateMathEvidenceOnly,
    ).toBe(true);
    expect(
      schema.receiptInstanceBindingPolicy.serverAuthoritativeBindingEstablished,
    ).toBe(false);
    expect(
      schema.receiptInstanceBindingPolicy.authoritativeRegistrationAllowed,
    ).toBe(false);
    expect(schema.receiptInstanceBindingPolicy.standaloneOutputPath).toBeNull();
    expect(Object.keys(schema.receiptInstanceBindingPolicy)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("bindingIdentityIsCandidateMathEvidenceOnly"),
        expect.stringContaining("authoritativeRegistrationAllowed"),
      ]),
    );
  });

  it("keeps S6, R6, S32, and N32 distinct with closed composite bindings", () => {
    const closures =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RUNTIME_CLOSURE_SCHEMAS;
    expect(
      closures.importedDependencies
        .inheritedV2SecureStagingObservationClosureSchema,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
        .schemas.secureStagingObservationClosure,
    );
    expect(
      closures.importedDependencies.numericPolicyStagingManifestSchema,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1
        .selectionDAG.verifierAdmissibilityDAG
        .producer32ArrayStagingEvidenceSchema,
    );
    expect(
      closures.importedDependencies.numericPolicyStagingManifestBindingRecipe,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1
        .selectionDAG.verifierAdmissibilityDAG
        .producer32ArrayStagingEvidenceSchema.bindingRecipe,
    );
    expect(
      closures.importedDependencies.numericPolicyStagingManifestSha256Domain,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
    );
    expect(
      closures.importedDependencies.numericPolicyStagingEntryExpectations,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
    );
    expect(closures.importedDependencies.predecessorRunPlanV2Binding).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
    );
    expect(
      closures.importedDependencies
        .predecessorRuntimeChannelSchemaRegistryBinding,
    ).toBe(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
    );
    const evidenceSchemas = [
      closures.mpfrGmpRuntimeConformanceReceipt,
      closures.producerProjectionImplementation,
      closures.verifierProjectionImplementation,
      closures.implementationSeparationReceipt,
    ];
    for (const schema of evidenceSchemas) {
      expect(new Set(schema.exactKeys).size).toBe(schema.exactKeys.length);
      expect(Object.keys(schema.fields)).toEqual(schema.exactKeys);
      expect(schema.extraKeysAllowed).toBe(false);
      expect(schema.bindingRecipe.canonicalHash.domain.endsWith("\n")).toBe(
        true,
      );
      expect(schema.bindingRecipe.canonicalHash.orderedPreimage).toEqual([
        "domain_UTF8_bytes_including_the_single_terminal_LF",
        "u64be_canonical_value_UTF8_byte_length",
        "canonical_value_UTF8_bytes",
      ]);
    }
    expect(
      new Set(
        evidenceSchemas.map(
          (schema) => schema.bindingRecipe.canonicalHash.domain,
        ),
      ).size,
    ).toBe(evidenceSchemas.length);
    expect(closures.producerProjectionImplementation.fields.role).toBe(
      "literal_producer",
    );
    expect(closures.verifierProjectionImplementation.fields.role).toBe(
      "literal_verifier",
    );
    expect(
      closures.implementationSeparationReceipt.fields.separationChecks
        .exactLength,
    ).toBe(6);
    expect(closures.producerProjectionImplementation.exactKeys).toEqual(
      expect.arrayContaining([
        "sourceEntries",
        "toolchainEntries",
        "executableObservation",
      ]),
    );
    for (const runtimeOnlyKey of [
      "successorRunPlanBinding",
      "commonRunRequestBinding",
      "mpfrGmpRuntimeBinding",
      "launchEnvelopeBinding",
      "producerEnforcementReceiptBinding",
      "completeLaunchMountManifestBinding",
      "readOnlyDependencyMountEntries",
    ]) {
      expect(closures.producerProjectionImplementation.exactKeys).not.toContain(
        runtimeOnlyKey,
      );
      expect(closures.verifierProjectionImplementation.exactKeys).not.toContain(
        runtimeOnlyKey,
      );
    }
    expect(
      closures.producerProjectionImplementation.crossFieldInvariants,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("static_source-and-toolchain_evidence"),
      ]),
    );
    expect(
      closures.verifierProjectionImplementation.crossFieldInvariants,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "grants_no_same-attempt_or_runtime-isolation_authority",
        ),
      ]),
    );
    expect(closures.implementationSeparationReceipt.exactKeys).not.toContain(
      "mpfrGmpRuntimeBinding",
    );
    expect(
      closures.implementationSeparationReceipt.brokerSameAttemptEstablished,
    ).toBe(false);
    expect(
      closures.implementationSeparationReceipt.runtimeIsolationEstablished,
    ).toBe(false);
    expect(
      closures.implementationSeparationReceipt.fields.separationChecks
        .exactCheckIdsInOrder,
    ).toContain(
      "no_shared_generated_projector_Gram_Cholesky_or_coefficient_table",
    );

    expect(closures.raw6Manifest.exactKeys).toEqual([
      "schemaVersion",
      "seedBinding",
      "policyBinding",
      "operationGraphBinding",
      "successorRunPlanBinding",
      "commonRunRequestBinding",
      "producerEnforcementReceiptBinding",
      "entryCount",
      "entries",
    ]);
    expect(closures.raw6Manifest.fields.entryCount).toBe("literal_6");
    expect(closures.raw6Manifest.fields.entries.exactLength).toBe(6);
    expect(closures.raw6Manifest.fields.entries.itemExactKeys).toEqual([
      "evidenceIndex",
      "levelId",
      "role",
      "parity",
      "relativePath",
      "shape",
      "elementCount",
      "byteLength",
      "dtype",
      "order",
      "plainSha256",
      "domainSha256",
    ]);
    expect(
      closures.raw6Manifest.bindingRecipe.canonicalHash.domain.endsWith("\n"),
    ).toBe(true);
    expect(
      closures.raw6SecureObservationClosure.fields
        .recursivePostStateRootObservation,
    ).toBe(closures.raw6PostStateRootObservation);
    expect(closures.raw6PostStateRootObservation.fields).toMatchObject({
      rootAbsolutePath: "literal_/run/postprojection-evidence",
      rootEntryCount: "literal_3",
      noExtraEntriesPassed: "literal_true",
      allPassed: expect.stringContaining("no-extra"),
    });
    expect(
      closures.raw6PostStateRootObservation.fields.levelDirectories.exactEntryExpectations.map(
        (entry) => [entry.levelId, entry.entryCount, entry.fileNames],
      ),
    ).toEqual([
      ["L0", 2, ["00-raw-scalar-u.f64le", "01-raw-potential-v.f64le"]],
      ["L1", 2, ["00-raw-scalar-u.f64le", "01-raw-potential-v.f64le"]],
      ["L2", 2, ["00-raw-scalar-u.f64le", "01-raw-potential-v.f64le"]],
    ]);
    expect(
      closures.raw6PostStateRootObservation.listingHashRecipe.sha256Domain,
    ).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-directory-listing/v1\n",
    );
    expect(
      closures.raw6PostStateRootObservation.bindingRecipe.canonicalHash.domain,
    ).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-postprojection/raw6-post-state-root-observation/v1\n",
    );
    expect(closures.raw6SecureObservationClosure.crossFieldInvariants).toEqual(
      expect.arrayContaining([expect.stringContaining("exactly_38")]),
    );
    expect(
      closures.raw6SecureToManifestProjectionReceipt.fields.entries.exactLength,
    ).toBe(6);
    expect(
      closures.numericStaging32SecureToManifestProjectionReceipt.fields.entries
        .exactLength,
    ).toBe(32);
    expect(
      closures.numericStaging32RuntimeClosure.fields
        .numericPolicyStagingManifestBinding,
    ).toContain("imported_numeric_policy_staging_manifest");
    expect(closures.candidateInstanceIdentity.exactKeys).toEqual([
      "schemaVersion",
      "commonRunRequestBinding",
      "producerEnforcementReceiptBinding",
      "numericStaging32RuntimeClosureBinding",
      "rawEvidenceRuntimeClosureBinding",
    ]);
    expect(closures.candidateInstanceIdentity.extraKeysAllowed).toBe(false);
    expect(
      closures.candidateInstanceIdentity.bindingRecipe.canonicalHash.domain,
    ).toBe(
      "nhm2-prolate-boson-star-newtonian-seed-postprojection/candidate-instance-identity/v1\n",
    );
    expect(closures.chronology.temporalCycleAllowed).toBe(false);
    expect(
      closures.chronology.candidateReceiptTransportOrCompositeOutputPathDefined,
    ).toBe(false);
    expect(closures.chronology.brokerSameAttemptEstablished).toBe(false);
    expect(closures.chronology.runtimeIsolationEstablished).toBe(false);
    expect(closures.chronology.authoritativeRegistrationAllowed).toBe(false);
    expect(closures.chronology.postExitCandidateComputationAllowed).toBe(false);
    expect(closures.chronology.standaloneCandidatePOutputAllowed).toBe(false);
    expect(closures.chronology.secondVerifierStageAllowed).toBe(false);
    expect(
      closures.chronology.futureV3RequiredSingleVerifierPreExitOrder,
    ).toEqual([
      "compute_untrusted_candidate_P_postprojection_math_match",
      "only_if_candidate_P_matches_compute_untrusted_candidate_N_numeric_replay",
      "only_if_candidate_N_matches_compute_untrusted_candidate_F_full-gate_result",
      "close_exactly_one_successor-bound_composite_replay_bundle_containing_candidate_P_then_N_then_F",
      "single_verifier_exit",
    ]);
    expect(closures.chronology.futureV3RequiredPostExitOrder).toEqual([
      "full_successor_verifier_output-observation_and_enforcement",
      "broker_runtime-separation_and_typed-interpreter_validation_of_the_one_composite_bundle",
      "atomic_dependency-ordered_registration_of_nested_P_then_N_then_F_bindings",
    ]);
    const chronology = closures.chronology.exactAcyclicOrder;
    const ordinal = (prefix: string) =>
      chronology.findIndex((entry) => entry.startsWith(prefix));
    expect(ordinal("O_")).toBeLessThan(ordinal("E_"));
    expect(ordinal("E_")).toBeLessThan(ordinal("S6_"));
    expect(ordinal("S6_")).toBeLessThan(ordinal("R6_"));
    expect(ordinal("R6_")).toBeLessThan(ordinal("P_candidate_"));
    expect(
      closures.chronology
        .futureV3MustCrossBindTheSameN32ManifestNamedByTheS32N32Composite,
    ).toBe(true);

    const receipt =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA;
    expect(receipt.raw6Observation.exactKeys).not.toEqual(
      receipt.seed32Observation.exactKeys,
    );
    expect(receipt.seed32Observation.exactKeys).toContain("rawArraySha256");
    expect(receipt.seed32Observation.exactKeys).not.toContain("domainSha256");
    expect(receipt.regeneratedAnalyticZObservation.exactKeys).toEqual([
      "levelId",
      "angularNodeCount",
      "byteLength",
      "rawF64leSha256",
    ]);
  });

  it("proves the consistent rational odd and even fixtures exactly", () => {
    const fixtures =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES;
    for (const fixture of [fixtures.consistentOdd, fixtures.consistentEven]) {
      const basis = basisFromBits(fixtures.common.zBits, fixture.degrees);
      const declaredBasis = fixture.basisRows.map((row) =>
        row.map(parseRational),
      );
      expect(
        basis.every((row, rowIndex) =>
          row.every((entry, columnIndex) =>
            equalRational(entry, declaredBasis[rowIndex][columnIndex]),
          ),
        ),
      ).toBe(true);
      const gram = Gram(basis);
      const declaredGram = fixture.Gram.map((row) => row.map(parseRational));
      expect(
        gram.every((row, rowIndex) =>
          row.every((entry, columnIndex) =>
            equalRational(entry, declaredGram[rowIndex][columnIndex]),
          ),
        ),
      ).toBe(true);
      const coefficients = fixture.expectedCoefficients.map(parseRational);
      const rawY = fixture.rawYBits.map(binary64BitsToRational);
      expect(
        rawY.every((entry, index) =>
          equalRational(entry, parseRational(fixture.rawY[index])),
        ),
      ).toBe(true);
      const reconstruction = matrixVector(basis, coefficients);
      expect(
        reconstruction.every((entry, index) =>
          equalRational(entry, rawY[index]),
        ),
      ).toBe(true);
      const rightHandSide = transposeVector(basis, rawY);
      expect(
        rightHandSide.every((entry, index) =>
          equalRational(entry, parseRational(fixture.rightHandSide[index])),
        ),
      ).toBe(true);
      const gramTimesCoefficients = matrixVector(gram, coefficients);
      expect(
        gramTimesCoefficients.every((entry, index) =>
          equalRational(entry, rightHandSide[index]),
        ),
      ).toBe(true);
      fixture.expectedCoefficients.forEach((entry, index) =>
        expectRationalRoundsToBits(
          entry,
          fixture.expectedCoefficientBits[index],
        ),
      );
      fixture.rawY.forEach((entry, index) =>
        expectRationalRoundsToBits(entry, fixture.rawYBits[index]),
      );
    }
  });

  it("uses an inconsistent fixture that distinguishes identity weights", () => {
    const fixtures =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES;
    const basis = basisFromBits(
      fixtures.common.zBits,
      fixtures.consistentEven.degrees,
    );
    const gram = Gram(basis);
    const discriminator = fixtures.identityWeightDiscriminatorEven;
    const coefficients = discriminator.exactCoefficients.map(parseRational);
    const reconstruction = matrixVector(basis, coefficients);
    const raw = discriminator.rawYBits.map(binary64BitsToRational);
    expect(
      raw.every((entry, index) =>
        equalRational(entry, parseRational(discriminator.rawY[index])),
      ),
    ).toBe(true);
    const residual = raw.map((entry, index) =>
      subtract(entry, reconstruction[index]),
    );
    const normalResidual = transposeVector(basis, residual);
    const rightHandSide = transposeVector(basis, raw);
    const gramTimesCoefficients = matrixVector(gram, coefficients);
    expect(
      reconstruction.every((entry, index) =>
        equalRational(
          entry,
          parseRational(discriminator.exactReconstruction[index]),
        ),
      ),
    ).toBe(true);
    expect(
      residual.every((entry, index) =>
        equalRational(
          entry,
          parseRational(
            discriminator.exactResidualRawMinusReconstruction[index],
          ),
        ),
      ),
    ).toBe(true);
    expect(normalResidual.every((entry) => entry.numerator === 0n)).toBe(true);
    expect(
      gramTimesCoefficients.every((entry, index) =>
        equalRational(entry, rightHandSide[index]),
      ),
    ).toBe(true);
    discriminator.exactCoefficients.forEach((entry, index) =>
      expectRationalRoundsToBits(
        entry,
        discriminator.expectedCoefficientBits[index],
      ),
    );
    discriminator.exactReconstruction.forEach((entry, index) =>
      expectRationalRoundsToBits(
        entry,
        discriminator.expectedReconstructionBits[index],
      ),
    );
  });

  it("derives the exact-real n=2 phase sign without claiming MPFR runtime bits", () => {
    const fixture =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES.phaseAndMask;
    const provisionalDct = exactRealDctIN2(
      fixture.provisionalScalarMultipoleBits,
    );
    const acceptedDct = exactRealDctIN2(fixture.acceptedScalarMultipoleBits);
    expect(
      provisionalDct.every((entry, index) =>
        equalRational(
          entry,
          parseRational(
            fixture.provisionalDctICoefficientsExactRealReference[index],
          ),
        ),
      ),
    ).toBe(true);
    expect(
      acceptedDct.every((entry, index) =>
        equalRational(
          entry,
          parseRational(
            fixture.acceptedDctICoefficientsExactRealReference[index],
          ),
        ),
      ),
    ).toBe(true);
    const provisionalDerivativeSum = endpointDerivativeSum(provisionalDct);
    const acceptedDerivativeSum = endpointDerivativeSum(acceptedDct);
    expect(
      equalRational(
        provisionalDerivativeSum,
        parseRational(
          fixture.provisionalEndpointDerivativeSumExactRealReference,
        ),
      ),
    ).toBe(true);
    expect(
      equalRational(
        acceptedDerivativeSum,
        parseRational(fixture.acceptedEndpointDerivativeSumExactRealReference),
      ),
    ).toBe(true);
    const provisionalA1 = multiply(rational(-2n), provisionalDerivativeSum);
    const acceptedA1 = multiply(rational(-2n), acceptedDerivativeSum);
    expect(
      equalRational(
        provisionalA1,
        parseRational(fixture.provisionalA1ExactRealReference),
      ),
    ).toBe(true);
    expect(
      equalRational(
        acceptedA1,
        parseRational(fixture.finalA1ExactRealReference),
      ),
    ).toBe(true);
    expect(compareRational(provisionalA1, rational(0n))).toBe(-1);
    expect(fixture.expectedPhaseSign).toBe(-1);
    expect(compareRational(acceptedA1, rational(0n))).toBe(1);
    expectRationalRoundsToBits(
      fixture.provisionalA1ExactRealReference,
      fixture.provisionalA1Bits,
    );
    expectRationalRoundsToBits(
      fixture.finalA1ExactRealReference,
      fixture.finalA1Bits,
    );
    expect(fixture.provisionalScalarMultipoleBits).toEqual([
      "0000000000000000",
      "bfe0000000000000",
      "0000000000000000",
    ]);
    expect(fixture.acceptedScalarMultipoleBits).toEqual([
      "0000000000000000",
      "3fe0000000000000",
      "0000000000000000",
    ]);
    expect(fixture.endpointMasksRemainPositiveZero).toBe(true);
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES.runtimeConformanceAuthority,
    ).toBe(false);
    expect(fixture.mpfrDctNuance).toContain(
      "expected_bits_require_a_future_bound_MPFR_runtime_harness",
    );
  });

  it("rejects every noncanonical or unreduced rational fixture spelling", () => {
    for (const invalid of [
      "+1/2",
      "01/2",
      "-01/2",
      "1/-2",
      "2/4",
      "0/2",
      "-0/1",
      "1/0",
      "1.0/2",
    ]) {
      expect(() => parseRational(invalid)).toThrow();
    }
    expect(parseRational("-1/2")).toEqual({
      numerator: -1n,
      denominator: 2n,
    });
  });

  it("keeps every claim lock false and every runtime authority absent", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1;
    expect(policy.claimLockKeys.length).toBeGreaterThanOrEqual(40);
    expect(Object.keys(policy.claimLocks)).toEqual(policy.claimLockKeys);
    expect(
      Object.values(policy.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(policy.executionState).toEqual({
      executionAuthorized: false,
      mpfrGmpRuntimeBinding: null,
      rawEvidenceBundleBinding: null,
      serverSecureObservationBinding: null,
      raw6SecureObservationClosureBinding: null,
      raw6ManifestBinding: null,
      raw6SecureToManifestProjectionReceiptBinding: null,
      rawEvidenceRuntimeClosureBinding: null,
      inheritedV2SecureStagingObservationClosureBinding: null,
      numericPolicyStagingManifestBinding: null,
      numericStaging32SecureToManifestProjectionReceiptBinding: null,
      numericStaging32RuntimeClosureBinding: null,
      candidateInstanceIdentity: null,
      candidateInstanceIdentityBinding: null,
      producerProjectionImplementationBinding: null,
      verifierProjectionImplementationBinding: null,
      implementationSeparationReceiptBinding: null,
      runtimeTypedInterpreterBinding: null,
      executableRuntimeSchemaAuthority: false,
      candidatePostprojectionMathMatchOrRejectionReceipt: null,
      candidatePostprojectionMathReceiptBinding: null,
      brokerSameAttemptEstablished: false,
      runtimeIsolationEstablished: false,
      authoritativeRegistrationAllowed: false,
      numericMaterializationMatchBinding: null,
      fullSeedV1AdmissionBinding: null,
      verified: false,
      descriptorAssembled: false,
      artifactAccepted: false,
    });
    expect(policy.blockers).toEqual(
      expect.arrayContaining([
        "future_run_plan_successor_binding_both_postprojection_and_numeric_materialization_policies_absent",
        "six_raw_preprojection_evidence_array_delivery_channel_absent_from_sealed_run_plans_v1_and_v2",
        "producer_MPFR256_postprojection_implementation_binding_absent",
        "independent_verifier_MPFR256_postprojection_implementation_binding_absent",
        "producer_verifier_static_source_toolchain_executable_separation_receipt_absent",
        "future_v3_three-stage_authority_layer_absent_including_full_producer-and-verifier_enforcement_exact_context-delivery_candidate-composite-output_broker-runtime-separation_receipt_complete-typed-interpreter_and_post-exit-atomic_nested-P-then-N-then-F_registration",
        "independent_candidate_postprojection_math_receipt_absent",
        "external_full_seed_v1_admission_with_complete_gate_report_and_nodeless_origin_peak_receipts_absent",
      ]),
    );
  });

  it("is additive, unexecuted, and does not mutate either sealed run plan", () => {
    const policy =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1;
    expect(policy.additiveSuccessorOnly).toBe(true);
    expect(policy.mutatesSeedV1).toBe(false);
    expect(policy.mutatesRunPlanV1).toBe(false);
    expect(policy.mutatesRunPlanV2).toBe(false);
    expect(policy.mutatesNumericMaterializationPolicyV1).toBe(false);
    expect(policy.successorIntegrationRequirements).toMatchObject({
      sealedRunPlanV1OrV2MutationAllowed: false,
      futureRunPlanSuccessorRequired: true,
      seedStagingRoot: "/run/staging",
      seedStagingArrayClosureCount: 32,
      seedStagingClosureRemainsExactAndUnchanged: true,
      postprojectionEvidenceRoot: "/run/postprojection-evidence",
      postprojectionEvidenceClosureCount: 6,
      postprojectionEvidenceLocalOrdinals: [0, 1, 2, 3, 4, 5],
      rootsMustBeNonoverlapping: true,
      combinedThirtyEightFileStagingViewAllowed: false,
      candidateMathReceiptMayBeStandaloneRuntimeOutput: false,
      futureV3MustPreserveProducerVerifierAssemblerThreeStageTopology: true,
      futureV3SingleVerifierComputesCandidatePThenNThenFBeforeOneExit: true,
      futureV3CandidateRejectionShortCircuitsCandidateNAndF: true,
      futureV3CompositeReplayBundleCount: 1,
      futureV3CompositeReplayBundleAbsolutePathDefinedAndBoundOnlyBySuccessor: true,
      futureV3PostExitCandidateComputationAllowed: false,
      futureV3SecondVerifierStageAllowed: false,
      futureV3StandaloneCandidatePOutputAllowed: false,
      futureV3MustBindFullProducerAndVerifierEnforcementReceipts: true,
      futureV3MustBindBrokerRuntimeSeparationReceipt: true,
      futureV3MustAtomicallyRegisterNestedCandidatePThenNThenFBindings: true,
      futureV3AuthorityArtifactsDefinedByThisPolicy: false,
      implementationPresentInThisPolicy: false,
    });
    expect(policy.interpretationBoundary.suppliesSolverExecution).toBe(false);
    expect(policy.interpretationBoundary.suppliesRunPlanEvidenceChannel).toBe(
      false,
    );
    expect(policy.interpretationBoundary.currentProducerSpectralPy).toContain(
      "incompatible_binary64_BLAS",
    );
    expect(policy.interpretationBoundary.currentVerifierOperatorsPy).toContain(
      "incompatible_diagnostic_binary64_without_raw6",
    );
    expect(
      policy.interpretationBoundary
        .candidateMathMatchMayBeInferredFromNumericPolicyPassThrough,
    ).toBe(false);
  });

  it("deep-freezes all authoritative data", () => {
    assertDeepFrozen(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
    );
    assertDeepFrozen(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
    );
    assertDeepFrozen(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH,
    );
    assertDeepFrozen(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
    );
    assertDeepFrozen(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES,
    );
  });

  it("locks five domain-separated projections to direct literal pins", () => {
    const projections = [
      {
        name: "policy",
        value: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
        canonical:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
        binding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_EXPECTED_SHA256,
        expectedCanonicalSizeBytes:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES,
      },
      {
        name: "rawEvidenceInventory",
        value:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY,
        canonical:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_CANONICAL_JSON,
        binding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_BINDING,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_EXPECTED_SHA256,
        expectedCanonicalSizeBytes:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_RAW_EVIDENCE_INVENTORY_EXPECTED_CANONICAL_SIZE_BYTES,
      },
      {
        name: "operationGraph",
        value:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH,
        canonical:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON,
        binding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_EXPECTED_SHA256,
        expectedCanonicalSizeBytes:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_EXPECTED_CANONICAL_SIZE_BYTES,
      },
      {
        name: "candidateReplayReceiptSchema",
        value:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
        canonical:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_CANONICAL_JSON,
        binding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_EXPECTED_SHA256,
        expectedCanonicalSizeBytes:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
      },
      {
        name: "boundedFixtures",
        value:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES,
        canonical:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_CANONICAL_JSON,
        binding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_BINDING,
        expectedSha256:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_EXPECTED_SHA256,
        expectedCanonicalSizeBytes:
          policyModule.NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BOUNDED_FIXTURES_EXPECTED_CANONICAL_SIZE_BYTES,
      },
    ];
    expect(
      new Set(projections.map((item) => item.binding.sha256Domain)).size,
    ).toBe(projections.length);
    for (const item of projections) {
      expect(canonicalJson(item.value)).toBe(item.canonical);
      expect(Buffer.byteLength(item.canonical, "utf8")).toBe(
        item.binding.canonicalSizeBytes,
      );
      expect(
        createHash("sha256")
          .update(item.binding.sha256Domain, "utf8")
          .update(item.canonical, "utf8")
          .digest("hex"),
      ).toBe(item.binding.sha256);
      expect(item.binding.sha256, `${item.name}:literal_sha256`).toBe(
        item.expectedSha256,
      );
      expect(
        item.binding.canonicalSizeBytes,
        `${item.name}:literal_canonical_size`,
      ).toBe(item.expectedCanonicalSizeBytes);
    }
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_LITERAL_SEAL_STATUS,
    ).toBe("sealed_preregistration_read_only_red_team_clear");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.status,
    ).toBe("sealed_preregistration_read_only_red_team_clear");
    expect(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.blockers,
    ).not.toContain("read_only_red_team_and_literal_seal_pending");
    expect(
      Object.keys(policyModule).filter(
        (key) =>
          key.endsWith("_EXPECTED_SHA256") ||
          key.endsWith("_EXPECTED_CANONICAL_SIZE_BYTES"),
      ),
    ).toHaveLength(10);
  });

  it("source-audits five direct literal pins and non-tautological load-time checks", () => {
    const source = readFileSync(
      new URL(
        "../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-postprojection-policy.v1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const escapeRegExp = (value: string): string =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefix =
      "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1";
    const pins = [
      {
        stem: prefix,
        sha256:
          "8894ad4c3fe5c104d8e97a8488ea8a203d35934938798f0be7ae7c13573d8072",
        canonicalSizeBytes: 220450,
        computedSha256: `${prefix}_SHA256`,
        computedCanonicalSizeBytes: `${prefix}_CANONICAL_SIZE_BYTES`,
        driftError:
          "nhm2_newtonian_seed_postprojection_policy_literal_binding_drift",
      },
      {
        stem: `${prefix}_OPERATION_GRAPH`,
        sha256:
          "091ec81bbe981363bb7e1b83897d2e18eede13f04ce17a45da955fb4814c3148",
        canonicalSizeBytes: 28272,
        computedSha256: `${prefix}_OPERATION_GRAPH_BINDING.sha256`,
        computedCanonicalSizeBytes: `${prefix}_OPERATION_GRAPH_BINDING.canonicalSizeBytes`,
        driftError:
          "nhm2_newtonian_seed_postprojection_operation_graph_literal_binding_drift",
      },
      {
        stem: `${prefix}_REPLAY_RECEIPT_SCHEMA`,
        sha256:
          "7650326d16968df1939f9470382bb39b24bb25b74560914f0843a43932cc25fe",
        canonicalSizeBytes: 91888,
        computedSha256: `${prefix}_REPLAY_RECEIPT_SCHEMA_BINDING.sha256`,
        computedCanonicalSizeBytes: `${prefix}_REPLAY_RECEIPT_SCHEMA_BINDING.canonicalSizeBytes`,
        driftError:
          "nhm2_newtonian_seed_postprojection_replay_receipt_schema_literal_binding_drift",
      },
      {
        stem: `${prefix}_RAW_EVIDENCE_INVENTORY`,
        sha256:
          "552ed2911c9b1546fa664c74643ae7d468cf73cd954d87f8db0c5d2041100f4e",
        canonicalSizeBytes: 3459,
        computedSha256: `${prefix}_RAW_EVIDENCE_INVENTORY_BINDING.sha256`,
        computedCanonicalSizeBytes: `${prefix}_RAW_EVIDENCE_INVENTORY_BINDING.canonicalSizeBytes`,
        driftError:
          "nhm2_newtonian_seed_postprojection_raw_evidence_inventory_literal_binding_drift",
      },
      {
        stem: `${prefix}_BOUNDED_FIXTURES`,
        sha256:
          "65d8ed4408cc5155952136961b548eab7a210b86a458cdcab91a4db5f6a192a8",
        canonicalSizeBytes: 3759,
        computedSha256: `${prefix}_BOUNDED_FIXTURES_BINDING.sha256`,
        computedCanonicalSizeBytes: `${prefix}_BOUNDED_FIXTURES_BINDING.canonicalSizeBytes`,
        driftError:
          "nhm2_newtonian_seed_postprojection_bounded_fixtures_literal_binding_drift",
      },
    ];
    for (const pin of pins) {
      const stem = escapeRegExp(pin.stem);
      const computedSha256 = escapeRegExp(pin.computedSha256);
      const computedCanonicalSizeBytes = escapeRegExp(
        pin.computedCanonicalSizeBytes,
      );
      expect(source, `${pin.stem}:sha256_literal`).toMatch(
        new RegExp(
          `${stem}_EXPECTED_SHA256\\s*=\\s*\\r?\\n\\s*"${pin.sha256}" as const`,
        ),
      );
      expect(source, `${pin.stem}:size_literal`).toMatch(
        new RegExp(
          `${stem}_EXPECTED_CANONICAL_SIZE_BYTES\\s*=\\s*\\r?\\n\\s*${pin.canonicalSizeBytes} as const`,
        ),
      );
      expect(source, `${pin.stem}:module_load_self_check`).toMatch(
        new RegExp(
          `${computedSha256}\\s*!==\\s*${stem}_EXPECTED_SHA256\\s*\\|\\|[\\s\\S]{0,400}${computedCanonicalSizeBytes}\\s*!==\\s*${stem}_EXPECTED_CANONICAL_SIZE_BYTES`,
        ),
      );
      expect(source, `${pin.stem}:drift_error`).toContain(pin.driftError);
    }
    expect(source).not.toMatch(
      /_EXPECTED_SHA256\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*(?:_SHA256|_BINDING\.sha256)\b/,
    );
    expect(source).not.toMatch(
      /_EXPECTED_CANONICAL_SIZE_BYTES\s*=\s*\r?\n\s*NHM2_[A-Z0-9_]*(?:_CANONICAL_SIZE_BYTES|_BINDING\.canonicalSizeBytes)\b/,
    );
  });

  it("accepts only the authoritative singleton and rejects an equal clone", () => {
    expect(
      isNhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
      ),
    ).toBe(true);
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
      ),
    ).toEqual([]);
    const clone = JSON.parse(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(clone),
    ).toEqual(["postprojection_policy_v1_external_copy_not_authoritative"]);
    clone.status = "tampered";
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(clone),
    ).toEqual(["postprojection_policy_v1_semantic_mismatch"]);
  });

  it("rejects static implementation or candidate-authority weakening", () => {
    const producerStaticEvidenceWeakened = JSON.parse(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
    );
    producerStaticEvidenceWeakened.runtimeClosureSchemas.producerProjectionImplementation.fields.sourceManifestSha256 =
      "unbound_source_summary";
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        producerStaticEvidenceWeakened,
      ),
    ).toEqual(["postprojection_policy_v1_semantic_mismatch"]);

    const candidateAuthorityWeakened = JSON.parse(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
    );
    candidateAuthorityWeakened.replayReceiptSchema.matchFields.authoritativeRegistrationAllowed =
      "literal_true";
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        candidateAuthorityWeakened,
      ),
    ).toEqual(["postprojection_policy_v1_semantic_mismatch"]);
  });

  it("rejects proxies, accessors, cycles, symbols, sparse arrays, and hostile budgets", () => {
    let proxyTrapCalls = 0;
    const proxy = new Proxy(
      {},
      {
        ownKeys() {
          proxyTrapCalls += 1;
          throw new Error("must not reflect proxy");
        },
      },
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(proxy),
    ).toEqual(["proxy_forbidden:/"]);
    expect(proxyTrapCalls).toBe(0);

    let getterCalls = 0;
    const accessor = {} as Record<string, unknown>;
    Object.defineProperty(accessor, "status", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "x";
      },
    });
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        accessor,
      )[0],
    ).toContain("object_property_surface");
    expect(getterCalls).toBe(0);

    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        cycle,
      )[0],
    ).toContain("cycle_forbidden");

    const symbolObject = { ok: true } as Record<PropertyKey, unknown>;
    symbolObject[Symbol("hidden")] = true;
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        symbolObject,
      )[0],
    ).toContain("symbol_key");

    const sparse = Array(2) as unknown[];
    sparse[1] = true;
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        sparse,
      )[0],
    ).toContain("array_surface");

    const tooManyOwnKeys = Object.fromEntries(
      Array.from({ length: 65 }, (_, index) => [`k${index}`, null]),
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        tooManyOwnKeys,
      )[0],
    ).toContain("own_keys_limit");

    const tooLongArray = Array(65);
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        tooLongArray,
      )[0],
    ).toContain("array_length");

    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations({
        value: -0,
      })[0],
    ).toContain("negative_zero");
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations({
        value: "x".repeat(1_025),
      })[0],
    ).toContain("single_string_limit");

    let deep: Record<string, unknown> = {};
    const deepRoot = deep;
    for (let index = 0; index < 30; index += 1) {
      const next: Record<string, unknown> = {};
      deep.next = next;
      deep = next;
    }
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        deepRoot,
      )[0],
    ).toContain("snapshot_depth_limit");

    const makePlainTree = (depth: number): unknown =>
      depth === 0
        ? null
        : Object.fromEntries(
            Array.from({ length: 21 }, (_, index) => [
              `k${index}`,
              makePlainTree(depth - 1),
            ]),
          );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        makePlainTree(3),
      )[0],
    ).toContain("snapshot_node_limit");

    const cumulativeKeyBomb = Array.from({ length: 63 }, () =>
      Array.from({ length: 63 }, () => [null]),
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        cumulativeKeyBomb,
      )[0],
    ).toContain("snapshot_key_limit");

    const cumulativeStringBomb = Array.from({ length: 3 }, () =>
      Array.from({ length: 63 }, () => "x".repeat(1_024)),
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        cumulativeStringBomb,
      )[0],
    ).toContain("snapshot_string_limit");

    const cumulativePropertyNameBomb = Array.from(
      { length: 63 },
      (_, outerIndex) =>
        Object.fromEntries(
          Array.from({ length: 64 }, (__, innerIndex) => [
            `property_${outerIndex}_${innerIndex}_${"x".repeat(12)}`,
            null,
          ]),
        ),
    );
    expect(
      nhm2ProlateBosonStarNewtonianSeedPostprojectionPolicyV1Violations(
        cumulativePropertyNameBomb,
      )[0],
    ).toContain("snapshot_property_name_limit");
  });
});
