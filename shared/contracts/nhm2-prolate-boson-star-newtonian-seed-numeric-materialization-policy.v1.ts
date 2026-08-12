import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed.v1";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_ARTIFACT_ID =
  "nhm2.prolate_boson_star_newtonian_seed.numeric_materialization_policy" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_policy/v1" as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

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

/**
 * Runtime identity anchors are deliberately outside the canonical policy value:
 * the policy binds their canonical identities, while validation requires this
 * module's exact singleton. This avoids copying predecessor contracts into the
 * successor hash domain or pretending that a structurally equal copy has
 * authority.
 */
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_AUTHORITATIVE_SINGLETONS =
  Object.freeze({
    seedV1: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
    proofReplayProtocolV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL,
    outputDescriptorSchemaV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
    derivedHashRegistryV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY,
    amplitudeScheduleV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
    gridLevelsV1: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
    outputRolesV1: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
    outputArrayInventoryV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  });

const TAIL_COEFFICIENT_INVENTORY_HASH_PREIMAGE =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.find(
    (entry) => entry.receiptField === "tailCoefficientInventorySha256",
  );
const REPRESENTATIVE_CONTINUUM_HASH_PREIMAGE =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.find(
    (entry) => entry.receiptField === "representativeContinuumSha256",
  );
const COVER_TRACE_HASH_PREIMAGE =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.entries.find(
    (entry) => entry.receiptField === "coverTraceSha256",
  );
if (
  TAIL_COEFFICIENT_INVENTORY_HASH_PREIMAGE == null ||
  REPRESENTATIVE_CONTINUUM_HASH_PREIMAGE == null ||
  COVER_TRACE_HASH_PREIMAGE == null
) {
  throw new Error(
    "numeric_materialization_policy_v1_derived_hash_preimage_absent",
  );
}

type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;

const absBigInt = (value: bigint): bigint => (value < 0n ? -value : value);

const gcd = (left: bigint, right: bigint): bigint => {
  let a = absBigInt(left);
  let b = absBigInt(right);
  while (b !== 0n) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a === 0n ? 1n : a;
};

const rational = (numerator: bigint, denominator = 1n): Rational => {
  if (denominator === 0n) throw new Error("zero_rational_denominator");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator, denominator);
  return Object.freeze({
    numerator: (sign * numerator) / divisor,
    denominator: absBigInt(denominator) / divisor,
  });
};

const add = (a: Rational, b: Rational): Rational =>
  rational(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
const subtract = (a: Rational, b: Rational): Rational =>
  rational(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
const multiply = (a: Rational, b: Rational): Rational =>
  rational(a.numerator * b.numerator, a.denominator * b.denominator);
const divide = (a: Rational, b: Rational): Rational =>
  rational(a.numerator * b.denominator, a.denominator * b.numerator);
const isZero = (value: Rational): boolean => value.numerator === 0n;

const polynomialAdd = (left: Rational[], right: Rational[]): Rational[] => {
  const result = Array.from(
    { length: Math.max(left.length, right.length) },
    () => rational(0n),
  );
  for (let index = 0; index < result.length; index += 1) {
    result[index] = add(
      left[index] ?? rational(0n),
      right[index] ?? rational(0n),
    );
  }
  return result;
};

const polynomialScale = (
  polynomial: Rational[],
  factor: Rational,
): Rational[] => polynomial.map((coefficient) => multiply(coefficient, factor));

const polynomialShift = (polynomial: Rational[]): Rational[] => [
  rational(0n),
  ...polynomial,
];

const buildLegendrePolynomials = (maximumDegree: number): Rational[][] => {
  const polynomials: Rational[][] = [
    [rational(1n)],
    [rational(0n), rational(1n)],
  ];
  for (let ell = 1; ell < maximumDegree; ell += 1) {
    const shifted = polynomialScale(
      polynomialShift(polynomials[ell]),
      rational(BigInt(2 * ell + 1), BigInt(ell + 1)),
    );
    const previous = polynomialScale(
      polynomials[ell - 1],
      rational(BigInt(-ell), BigInt(ell + 1)),
    );
    polynomials.push(polynomialAdd(shifted, previous));
  }
  return polynomials;
};

const buildOddQuotientConnectionFixture = () => {
  const polynomials = buildLegendrePolynomials(63);
  const rows = Array.from({ length: 32 }, (_, rowIndex) => {
    const sourceOddEll = 2 * rowIndex + 1;
    const residual = polynomials[sourceOddEll].slice(1);
    const coefficients = Array.from({ length: rowIndex + 1 }, () =>
      rational(0n),
    );
    for (let q = rowIndex; q >= 0; q -= 1) {
      const evenEll = 2 * q;
      const factor = divide(residual[evenEll], polynomials[evenEll][evenEll]);
      coefficients[q] = factor;
      for (let power = 0; power <= evenEll; power += 1) {
        residual[power] = subtract(
          residual[power] ?? rational(0n),
          multiply(factor, polynomials[evenEll][power] ?? rational(0n)),
        );
      }
    }
    if (residual.some((entry) => !isZero(entry))) {
      throw new Error(
        "odd_legendre_quotient_connection_fixture_generation_failed",
      );
    }
    return {
      sourceOddEll,
      coefficients: coefficients.map((entry, q) => ({
        targetEvenEll: 2 * q,
        numerator: entry.numerator.toString(10),
        denominator: entry.denominator.toString(10),
      })),
    };
  });
  return deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.odd_legendre_quotient_connection_fixture",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_odd_legendre_quotient_connection_fixture/v1",
    status: "authoritative_exact_rational_fixture",
    sourceIdentity: "P_(2r+1)(z)/z",
    targetBasis: "P_(2q)(z)",
    normalization: "P_ell(1)=1",
    rowOrder: "r_ascending_0_through_31",
    coefficientOrder: "q_ascending_0_through_r",
    entryEncoding:
      "canonical_signed_decimal_numerator_and_positive_decimal_denominator",
    derivation:
      "exact_bigint_Bonnet_monomial_recurrence_then_descending_leading_term_elimination",
    runtimeSourceType: "GMP_mpq_set_from_canonical_numerator_and_denominator",
    runtimeConversion:
      "coefficient256=mpfr_set_q(destination_precision_256,source_mpq,MPFR_RNDN)_then_term=RN256(coefficient256*multiplicand)_as_a_separate_operation",
    exactMpfrRationalClaim: false,
    rows,
  } as const);
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1 =
  buildOddQuotientConnectionFixture();
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-odd-legendre-quotient-connection-fixture/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_EXPECTED_SHA256 =
  "75be3e81e8c2ab6a1a279f3970bece1850b2e6e1ea7f028b1387e1b1be2352aa" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  39594 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_odd_legendre_quotient_connection_fixture_v1_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1.artifactId,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1.contractVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_CANONICAL_SIZE_BYTES,
  });

const tailCoefficientTuple = (
  nonzero: Readonly<Record<string, string>>,
): ReadonlyArray<Readonly<{ n: number; q: number; bits: string }>> =>
  Object.freeze(
    Array.from({ length: 17 }, (_, n) =>
      Array.from({ length: 64 }, (_, q) =>
        Object.freeze({
          n,
          q,
          bits: nonzero[`${n}:${q}`] ?? "0000000000000000",
        }),
      ),
    ).flat(),
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE =
  deepFreeze({
    fixtureVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_input_fixture/v1",
    purpose: "representative_input_shape_and_order_only_nonphysical",
    inputOnly: true,
    operationGraphExpectedOutputs: null,
    operationGraphConformanceAuthority: false,
    schemaConformingProofRepresentativeTuple: false,
    scientificAcceptance: false,
    proofAuthority: false,
    gateAuthority: false,
    representativeInputs: {
      A0Bits: "3fb0000000000000",
      CRepresentativeBits: "3fc0000000000000",
      pRepresentativeBits: "bfec000000000000",
      tailScalarCoefficientBits: tailCoefficientTuple({
        "0:0": "3f90000000000000",
        "1:1": "bf80000000000000",
        "16:63": "3eb0000000000000",
      }),
      tailPotentialCoefficientBits: tailCoefficientTuple({
        "0:0": "bfa0000000000000",
        "2:3": "3f60000000000000",
      }),
    },
  } as const);

const REPRESENTATIVE_TUPLE_EXACT_KEYS = Object.freeze([
  "schemaVersion",
  "policyBinding",
  "sourceL2ScalarSha256",
  "sourceL2PotentialSha256",
  "A0Bits",
  "CRepresentativeBits",
  "pRepresentativeBits",
  "tailScalarCoefficientBits",
  "tailPotentialCoefficientBits",
  "tailCoefficientInventorySha256",
  "representativeContinuumSha256",
] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA =
  deepFreeze({
    schemaVersion:
      "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_tuple/v1",
    exactKeys: REPRESENTATIVE_TUPLE_EXACT_KEYS,
    extraKeysAllowed: false,
    fields: {
      schemaVersion: "literal_schema_version",
      policyBinding: "exact_policy_binding",
      sourceL2ScalarSha256: "lowercase_sha256_hex",
      sourceL2PotentialSha256: "lowercase_sha256_hex",
      A0Bits:
        "exact_16_lowercase_hex_finite_binary64_bits_negative_zero_forbidden",
      CRepresentativeBits:
        "exact_16_lowercase_hex_finite_binary64_bits_negative_zero_forbidden",
      pRepresentativeBits:
        "exact_16_lowercase_hex_finite_binary64_bits_negative_zero_forbidden",
      tailScalarCoefficientBits: {
        kind: "tuple",
        exactLength: 1088,
        order: "n_ascending_0_through_16_outer_q_ascending_0_through_63_inner",
        itemExactKeys: ["n", "q", "bits"],
        itemConstraints:
          "n_and_q_equal_the_tuple_ordinal_mapping_and_bits_are_exact_16_lowercase_hex_finite_binary64_bits_negative_zero_forbidden",
      },
      tailPotentialCoefficientBits: {
        kind: "tuple",
        exactLength: 1088,
        order: "n_ascending_0_through_16_outer_q_ascending_0_through_63_inner",
        itemExactKeys: ["n", "q", "bits"],
        itemConstraints:
          "n_and_q_equal_the_tuple_ordinal_mapping_and_bits_are_exact_16_lowercase_hex_finite_binary64_bits_negative_zero_forbidden",
      },
      tailCoefficientInventorySha256:
        "lowercase_sha256_hex_using_bound_seed_v1_derived_hash_preimage",
      representativeContinuumSha256:
        "lowercase_sha256_hex_using_bound_seed_v1_derived_hash_preimage",
    },
    constraints: {
      A0: "finite_and_strictly_positive",
      CRepresentative: "finite_and_strictly_positive",
      pRepresentative: "finite_with_no_sign_constraint",
      negativeZeroForbiddenEverywhere: true,
    },
    bitEncoding: {
      representativeFieldBits:
        "exactly_16_lowercase_hex_characters_encoding_the_MSB_first_IEEE754_binary64_numeric_bit_pattern_with_the_sign_and_high_exponent_bits_in_the_first_hex_octet",
      representativeFieldByteReversalAllowed: false,
      arrayBytes:
        "raw_IEEE754_binary64_little_endian_bytes_in_the_frozen_C_order_array_traversal",
      arrayHexAndRepresentativeNumericBitHexAreNotInterchangeable: true,
    },
    selectors: {
      CRepresentative:
        "the_unique_binary64_RNDN_value_to_which_the_whole_isolated_C_interval_rounds",
      pRepresentative:
        "exactly_operationGraph.representativeSelectorBarriers.p_with_named_kappa_divide_subtract_serialize_and_reinject_operations",
      tailCoefficients:
        "binary64_RNDN_of_each_exact_dyadic_interval_midpoint_with_zero_sign_canonicalized_positive",
      A0: "binary64_RNDN_of_the_exact_dyadic_midpoint_of_continuousPeakProofReceipt.A0Interval",
    },
    tupleAuthority:
      "only_independent_verifier_reconstruction_from_bound_inputs_and_receipts",
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPRESENTATIVE_TUPLE_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/verifier-representative-tuple/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/producer-32-array-staging/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_VALIDATION_RECEIPT_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/multipole-validation-receipt/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NODELESS_PROOF_CORE_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/nodeless-proof-core/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXTERIOR_H_EVIDENCE_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/exterior-h-lower-bound-evidence/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NUMERIC_MATCH_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/numeric-match/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPLAY_BUNDLE_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization/verifier-replay-bundle/v1\n" as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REJECTION_FAILURE_CODES =
  deepFreeze([
    "staging_observation_unformable",
    "staging_inventory_mismatch",
    "multipole_pass_through_validation_failed",
    "selector_or_proof_input_binding_mismatch",
    "continuous_nodeless_core_failed",
    "representative_tuple_invalid",
    "expected_array_materialization_failed",
    "candidate_array_count_mismatch",
    "candidate_array_size_mismatch",
    "candidate_array_sha256_mismatch",
    "candidate_array_byte_mismatch",
    "policy_binding_mismatch",
    "operation_graph_binding_mismatch",
    "same_candidate_identity_mismatch",
  ] as const);

const runtimeEvidenceBindingRecipe = (
  artifactId: string,
  schemaVersion: string,
  domain: string,
) => ({
  bindingExactKeys: [
    "artifactId",
    "schemaVersion",
    "sha256Domain",
    "sha256",
    "canonicalSizeBytes",
  ],
  bindingExtraKeysAllowed: false,
  bindingFields: {
    artifactId: `literal_${artifactId}`,
    schemaVersion: `literal_${schemaVersion}`,
    sha256Domain: `literal_unique_LF_domain_${domain.slice(0, -1)}`,
    sha256: "exact_64_lowercase_hex_SHA256",
    canonicalSizeBytes: "nonnegative_safe_integer_exact_UTF8_byte_length",
  },
  canonicalHash: {
    algorithm: "SHA-256",
    domain,
    domainEndsWithExactlyOneLf: true,
    serialization:
      "UTF8_of_no_whitespace_canonical_JSON_with_recursively_lexicographically_sorted_object_keys_and_arrays_in_schema_order",
    orderedPreimage: [
      "domain_UTF8_bytes_including_the_single_terminal_LF",
      "u64be_canonical_value_UTF8_byte_length",
      "canonical_value_UTF8_bytes",
    ],
    hashExpression:
      "sha256(domainUtf8 || u64be(canonicalValueUtf8ByteLength) || canonicalValueUtf8Bytes)",
    anyOtherPreimageComponentAllowed: false,
  },
});

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS =
  deepFreeze(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
      (entry) => ({
        inventoryIndex: entry.inventoryIndex,
        levelId: entry.levelId,
        role: entry.role,
        relativePath: entry.relativePath,
        shape: entry.shape,
        byteLength: entry.byteLength,
        dtype: entry.dtype,
        order: entry.order,
      }),
    ),
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS =
  deepFreeze(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.filter(
      (entry) =>
        entry.levelId !== "AUDIT" &&
        (entry.role === "newtonian_seed.multipole.scalar_odd" ||
          entry.role === "newtonian_seed.multipole.potential_even"),
    ).map((entry) => ({
      inventoryIndex: entry.inventoryIndex,
      levelId: entry.levelId,
      role: entry.role,
      relativePath: entry.relativePath,
      shape: entry.shape,
      byteLength: entry.byteLength,
      dtype: entry.dtype,
      order: entry.order,
    })),
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG =
  deepFreeze({
    dagVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_selection_dag/v1",
    exactStageOrder: [
      "untrusted_seed_producer",
      "trusted_independent_verifier",
      "trusted_descriptor_assembler",
    ],
    producerCandidateDAG: {
      stage: "untrusted_seed_producer",
      externalInputs: [
        "boundSeedV1Inputs",
        "boundProofReplayProtocolInput",
        "producerCandidateL0L1L2PostprojectionMultipoleBytes",
        "producerProvisionalCoulombOperatorOutputs",
        "producerProvisionalTailCoefficientIntervalOutputs",
        "producerProvisionalBoundaryLiftOutputs",
        "producerProvisionalPeakOperatorOutputs",
        "boundSeedV1DerivedHashRegistryPreimages",
        "seedV1GridAndArrayInventory",
      ],
      nodes: [
        {
          ordinal: 0,
          id: "candidate_source_multipoles",
          inputs: ["producerCandidateL0L1L2PostprojectionMultipoleBytes"],
          outputs: [
            "producerOwnLevelMultipoleBytes",
            "producerL2ScalarMultipoleBytes",
            "producerL2PotentialMultipoleBytes",
            "producerSourceL2ScalarSha256",
            "producerSourceL2PotentialSha256",
          ],
        },
        {
          ordinal: 1,
          id: "candidate_select_C",
          inputs: [
            "producerSourceL2ScalarSha256",
            "producerSourceL2PotentialSha256",
            "producerProvisionalCoulombOperatorOutputs",
          ],
          outputs: ["producerCRepresentativeBits"],
        },
        {
          ordinal: 2,
          id: "candidate_derive_p",
          inputs: ["producerCRepresentativeBits"],
          outputs: ["producerPRepresentativeBits"],
        },
        {
          ordinal: 3,
          id: "candidate_select_tail_coefficients",
          inputs: [
            "producerCRepresentativeBits",
            "producerProvisionalTailCoefficientIntervalOutputs",
            "boundProofReplayProtocolInput",
          ],
          outputs: [
            "producerTailScalarCoefficientBits",
            "producerTailPotentialCoefficientBits",
            "producerTailScalarCoefficientIntervals",
            "producerTailPotentialCoefficientIntervals",
          ],
        },
        {
          ordinal: 4,
          id: "candidate_hash_tail_coefficient_inventory",
          inputs: [
            "boundSeedV1DerivedHashRegistryPreimages",
            "boundProofReplayProtocolInput",
            "producerTailScalarCoefficientBits",
            "producerTailPotentialCoefficientBits",
            "producerTailScalarCoefficientIntervals",
            "producerTailPotentialCoefficientIntervals",
          ],
          outputs: ["producerTailCoefficientInventorySha256"],
        },
        {
          ordinal: 5,
          id: "candidate_materialize_boundary_lift_hashes",
          inputs: [
            "producerL2ScalarMultipoleBytes",
            "producerL2PotentialMultipoleBytes",
            "producerSourceL2ScalarSha256",
            "producerSourceL2PotentialSha256",
            "producerCRepresentativeBits",
            "producerPRepresentativeBits",
            "producerProvisionalBoundaryLiftOutputs",
            "boundProofReplayProtocolInput",
            "boundSeedV1DerivedHashRegistryPreimages",
          ],
          outputs: [
            "producerBoundaryLiftValues",
            "producerScalarBoundaryLiftDerivationRecords",
            "producerPotentialBoundaryLiftDerivationRecords",
            "producerScalarBoundaryLiftSha256",
            "producerPotentialBoundaryLiftSha256",
          ],
        },
        {
          ordinal: 6,
          id: "candidate_materialize_continuum_identity",
          inputs: [
            "boundSeedV1DerivedHashRegistryPreimages",
            "boundProofReplayProtocolInput",
            "producerSourceL2ScalarSha256",
            "producerSourceL2PotentialSha256",
            "producerCRepresentativeBits",
            "producerPRepresentativeBits",
            "producerScalarBoundaryLiftSha256",
            "producerPotentialBoundaryLiftSha256",
            "producerTailCoefficientInventorySha256",
          ],
          outputs: ["producerRepresentativeContinuumSha256"],
        },
        {
          ordinal: 7,
          id: "candidate_select_A0",
          inputs: [
            "producerRepresentativeContinuumSha256",
            "producerProvisionalPeakOperatorOutputs",
          ],
          outputs: ["producerA0Bits"],
        },
        {
          ordinal: 8,
          id: "candidate_materialize_32_arrays",
          inputs: [
            "producerOwnLevelMultipoleBytes",
            "producerCRepresentativeBits",
            "producerPRepresentativeBits",
            "producerTailScalarCoefficientBits",
            "producerTailPotentialCoefficientBits",
            "producerA0Bits",
            "seedV1GridAndArrayInventory",
          ],
          outputs: ["producer32OrderedF64leArrays"],
        },
        {
          ordinal: 9,
          id: "stage_exactly_32_arrays",
          inputs: ["producer32OrderedF64leArrays"],
          outputs: ["producer32ArrayStagingBundle"],
        },
      ],
      derivedHashPreimageClosures: {
        producerTailCoefficientInventorySha256: {
          registryReceiptField: "tailCoefficientInventorySha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            [
              "tailScalarRepresentativeCoefficients",
              "producerTailScalarCoefficientBits",
            ],
            [
              "tailPotentialRepresentativeCoefficients",
              "producerTailPotentialCoefficientBits",
            ],
            [
              "tailScalarContinuationCoefficientIntervals",
              "producerTailScalarCoefficientIntervals",
            ],
            [
              "tailPotentialContinuationCoefficientIntervals",
              "producerTailPotentialCoefficientIntervals",
            ],
          ],
        },
        producerScalarBoundaryLiftSha256: {
          registryReceiptField: "scalarBoundaryLiftSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2ScalarSha256", "producerSourceL2ScalarSha256"],
            ["CRepresentative", "producerCRepresentativeBits"],
            ["pRepresentative", "producerPRepresentativeBits"],
            ["formulaId", "H_boundary_lift/v1"],
            [
              "liftDerivationRecords",
              "producerScalarBoundaryLiftDerivationRecords",
            ],
          ],
        },
        producerPotentialBoundaryLiftSha256: {
          registryReceiptField: "potentialBoundaryLiftSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2PotentialSha256", "producerSourceL2PotentialSha256"],
            ["CRepresentative", "producerCRepresentativeBits"],
            ["pRepresentative", "producerPRepresentativeBits"],
            ["formulaId", "Q_boundary_lift/v1"],
            [
              "liftDerivationRecords",
              "producerPotentialBoundaryLiftDerivationRecords",
            ],
          ],
        },
        producerRepresentativeContinuumSha256: {
          registryReceiptField: "representativeContinuumSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2ScalarSha256", "producerSourceL2ScalarSha256"],
            ["sourceL2PotentialSha256", "producerSourceL2PotentialSha256"],
            ["CRepresentative", "producerCRepresentativeBits"],
            ["pRepresentative", "producerPRepresentativeBits"],
            ["scalarBoundaryLiftSha256", "producerScalarBoundaryLiftSha256"],
            [
              "potentialBoundaryLiftSha256",
              "producerPotentialBoundaryLiftSha256",
            ],
            [
              "tailCoefficientInventorySha256",
              "producerTailCoefficientInventorySha256",
            ],
            ["formulaId", "piecewise_L2_HQ_lifted_tail/v1"],
          ],
        },
      },
      outputChannel: {
        exactArrayCount: 32,
        exactPayload: "producer32ArrayStagingBundle",
        exactPayloadMembers:
          "the_32_raw_f64le_arrays_in_imported_inventory_order_only",
        representativeTupleIncluded: false,
        representativeMetadataIncluded: false,
        selectorOrDerivedHashMetadataIncluded: false,
        producerSelectorsAndDerivedHashesRemainInternalProvisionalOnly: true,
      },
      terminalAuthority: false,
    },
    verifierAdmissibilityDAG: {
      stage: "trusted_independent_verifier",
      externalInputs: [
        "immutableProducer32ArrayStagingObservation",
        "boundSeedV1Inputs",
        "boundProofReplayProtocolInput",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "boundSeedV1DerivedHashRegistryPreimages",
        "independentProofKernelToolchainBinding",
        "seedV1GridAndArrayInventory",
      ],
      nodes: [
        {
          ordinal: 0,
          id: "observe_candidate_without_trust",
          inputs: ["immutableProducer32ArrayStagingObservation"],
          outputs: ["observedProducer32ArrayBytes"],
        },
        {
          ordinal: 1,
          id: "freeze_observed_producer_32_array_staging_identity",
          inputs: [
            "observedProducer32ArrayBytes",
            "boundSeedV1Inputs",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "seedV1GridAndArrayInventory",
          ],
          outputs: [
            "observedProducer32ArrayStagingManifest",
            "observedProducer32ArrayStagingBinding",
          ],
        },
        {
          ordinal: 2,
          id: "fail_closed_validate_six_multipole_pass_through_inputs",
          inputs: [
            "observedProducer32ArrayBytes",
            "observedProducer32ArrayStagingManifest",
            "observedProducer32ArrayStagingBinding",
            "boundSeedV1Inputs",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "seedV1GridAndArrayInventory",
          ],
          outputs: [
            "validatedProducerOwnLevelMultipoleBytes",
            "validatedProducerL2ScalarMultipoleBytes",
            "validatedProducerL2PotentialMultipoleBytes",
            "verifierMultipolePassThroughValidationReceipt",
            "verifierMultipolePassThroughValidationReceiptBinding",
          ],
        },
        {
          ordinal: 3,
          id: "independently_isolate_C",
          inputs: [
            "validatedProducerOwnLevelMultipoleBytes",
            "validatedProducerL2ScalarMultipoleBytes",
            "validatedProducerL2PotentialMultipoleBytes",
            "verifierMultipolePassThroughValidationReceipt",
            "verifierMultipolePassThroughValidationReceiptBinding",
            "boundSeedV1Inputs",
            "boundProofReplayProtocolInput",
            "independentProofKernelToolchainBinding",
          ],
          outputs: [
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierCInterval",
            "verifierCoulombProofTrace",
          ],
        },
        {
          ordinal: 4,
          id: "independently_select_C",
          inputs: ["verifierCInterval"],
          outputs: ["verifierCRepresentativeBits"],
        },
        {
          ordinal: 5,
          id: "independently_derive_p",
          inputs: ["verifierCRepresentativeBits"],
          outputs: ["verifierPRepresentativeBits"],
        },
        {
          ordinal: 6,
          id: "independently_enclose_tail_coefficients",
          inputs: [
            "validatedProducerOwnLevelMultipoleBytes",
            "verifierCRepresentativeBits",
            "verifierPRepresentativeBits",
            "independentProofKernelToolchainBinding",
            "boundProofReplayProtocolInput",
            "boundSeedV1DerivedHashRegistryPreimages",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
          ],
          outputs: [
            "verifierScalarTailCoefficientIntervals",
            "verifierPotentialTailCoefficientIntervals",
            "verifierBoundaryLiftValues",
            "verifierScalarBoundaryLiftDerivationRecords",
            "verifierPotentialBoundaryLiftDerivationRecords",
            "verifierScalarBoundaryLiftSha256",
            "verifierPotentialBoundaryLiftSha256",
            "verifierAInfinityOverCosThetaGlobalIntervalBits",
            "verifierScalarWeightedRemainderRatioUpperBits",
            "verifierTailRadiiYBits",
            "verifierTailRadiiZBits",
            "verifierTailRadiusBits",
            "verifierTailContractionUpperBits",
            "verifierStrictExteriorHLowerBoundBits",
            "verifierJoinValueDefectUpperBits",
            "verifierJoinDerivativeDefectUpperBits",
          ],
        },
        {
          ordinal: 7,
          id: "independently_select_tail_coefficients",
          inputs: [
            "verifierCRepresentativeBits",
            "verifierScalarTailCoefficientIntervals",
            "verifierPotentialTailCoefficientIntervals",
            "boundProofReplayProtocolInput",
          ],
          outputs: [
            "verifierTailScalarCoefficientBits",
            "verifierTailPotentialCoefficientBits",
          ],
        },
        {
          ordinal: 8,
          id: "independently_hash_tail_coefficient_inventory",
          inputs: [
            "boundSeedV1DerivedHashRegistryPreimages",
            "boundProofReplayProtocolInput",
            "verifierTailScalarCoefficientBits",
            "verifierTailPotentialCoefficientBits",
            "verifierScalarTailCoefficientIntervals",
            "verifierPotentialTailCoefficientIntervals",
          ],
          outputs: ["verifierTailCoefficientInventorySha256"],
        },
        {
          ordinal: 9,
          id: "independently_materialize_continuum_identity",
          inputs: [
            "boundSeedV1DerivedHashRegistryPreimages",
            "boundProofReplayProtocolInput",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierCRepresentativeBits",
            "verifierPRepresentativeBits",
            "verifierScalarBoundaryLiftSha256",
            "verifierPotentialBoundaryLiftSha256",
            "verifierTailCoefficientInventorySha256",
          ],
          outputs: ["verifierRepresentativeContinuumSha256"],
        },
        {
          ordinal: 10,
          id: "close_exterior_H_lower_bound_evidence",
          inputs: [
            "boundSeedV1Inputs",
            "boundProofReplayProtocolInput",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "independentProofKernelToolchainBinding",
            "verifierSourceL2ScalarSha256",
            "verifierRepresentativeContinuumSha256",
            "verifierScalarBoundaryLiftSha256",
            "verifierTailCoefficientInventorySha256",
            "verifierAInfinityOverCosThetaGlobalIntervalBits",
            "verifierScalarWeightedRemainderRatioUpperBits",
            "verifierTailRadiiYBits",
            "verifierTailRadiiZBits",
            "verifierTailRadiusBits",
            "verifierTailContractionUpperBits",
            "verifierStrictExteriorHLowerBoundBits",
            "verifierJoinValueDefectUpperBits",
            "verifierJoinDerivativeDefectUpperBits",
          ],
          outputs: [
            "verifierExteriorHLowerBoundEvidence",
            "verifierExteriorHLowerBoundEvidenceBinding",
          ],
        },
        {
          ordinal: 11,
          id: "independently_replay_compact_regular_quotient_g_cover",
          inputs: [
            "boundSeedV1Inputs",
            "boundProofReplayProtocolInput",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "boundSeedV1DerivedHashRegistryPreimages",
            "observedProducer32ArrayStagingBinding",
            "verifierMultipolePassThroughValidationReceiptBinding",
            "validatedProducerL2ScalarMultipoleBytes",
            "verifierSourceL2ScalarSha256",
            "verifierRepresentativeContinuumSha256",
            "verifierBoundaryLiftValues",
            "verifierScalarBoundaryLiftSha256",
            "verifierTailScalarCoefficientBits",
            "verifierScalarTailCoefficientIntervals",
            "verifierTailCoefficientInventorySha256",
            "verifierExteriorHLowerBoundEvidence",
            "verifierExteriorHLowerBoundEvidenceBinding",
            "independentProofKernelToolchainBinding",
          ],
          outputs: [
            "verifierCompactRegularQuotientGCoverRecords",
            "verifierAcceptedCompactBoxCount",
            "verifierCoverRecordCount",
            "verifierMaximumDepthUsed",
            "verifierMinimumCompactRegularQuotientGLowerBoundBits",
            "verifierCoverTraceSha256",
            "verifierCompactRegularQuotientGProofPassedTrue",
          ],
        },
        {
          ordinal: 12,
          id: "independently_prove_continuous_nodeless_core",
          inputs: [
            "boundSeedV1Inputs",
            "boundProofReplayProtocolInput",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "observedProducer32ArrayStagingBinding",
            "verifierMultipolePassThroughValidationReceiptBinding",
            "validatedProducerL2ScalarMultipoleBytes",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierRepresentativeContinuumSha256",
            "verifierBoundaryLiftValues",
            "verifierScalarBoundaryLiftSha256",
            "verifierPotentialBoundaryLiftSha256",
            "verifierTailScalarCoefficientBits",
            "verifierTailPotentialCoefficientBits",
            "verifierScalarTailCoefficientIntervals",
            "verifierPotentialTailCoefficientIntervals",
            "verifierTailCoefficientInventorySha256",
            "independentProofKernelToolchainBinding",
            "verifierCompactRegularQuotientGCoverRecords",
            "verifierAcceptedCompactBoxCount",
            "verifierCoverRecordCount",
            "verifierMaximumDepthUsed",
            "verifierMinimumCompactRegularQuotientGLowerBoundBits",
            "verifierCoverTraceSha256",
            "verifierCompactRegularQuotientGProofPassedTrue",
            "verifierExteriorHLowerBoundEvidence",
            "verifierExteriorHLowerBoundEvidenceBinding",
          ],
          outputs: [
            "verifierContinuousNodelessProofCoreResult",
            "verifierContinuousNodelessProofCoreResultBinding",
            "verifierContinuousNodelessProofCorePassedTrue",
          ],
        },
        {
          ordinal: 13,
          id: "independently_prove_peak_and_select_A0",
          inputs: [
            "boundSeedV1Inputs",
            "boundProofReplayProtocolInput",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "validatedProducerL2ScalarMultipoleBytes",
            "validatedProducerL2PotentialMultipoleBytes",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierCRepresentativeBits",
            "verifierPRepresentativeBits",
            "verifierBoundaryLiftValues",
            "verifierScalarBoundaryLiftSha256",
            "verifierPotentialBoundaryLiftSha256",
            "verifierTailScalarCoefficientBits",
            "verifierTailPotentialCoefficientBits",
            "verifierScalarTailCoefficientIntervals",
            "verifierPotentialTailCoefficientIntervals",
            "verifierTailCoefficientInventorySha256",
            "verifierExteriorHLowerBoundEvidence",
            "verifierExteriorHLowerBoundEvidenceBinding",
            "verifierRepresentativeContinuumSha256",
            "verifierContinuousNodelessProofCoreResult",
            "verifierContinuousNodelessProofCoreResultBinding",
            "verifierContinuousNodelessProofCorePassedTrue",
            "independentProofKernelToolchainBinding",
          ],
          outputs: [
            "verifierA0Interval",
            "verifierA0Bits",
            "verifierPeakProofTrace",
          ],
        },
        {
          ordinal: 14,
          id: "independently_construct_representative_tuple",
          inputs: [
            "boundNumericMaterializationPolicyBinding",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierA0Bits",
            "verifierCRepresentativeBits",
            "verifierPRepresentativeBits",
            "verifierTailScalarCoefficientBits",
            "verifierTailPotentialCoefficientBits",
            "verifierTailCoefficientInventorySha256",
            "verifierRepresentativeContinuumSha256",
          ],
          outputs: [
            "verifierRepresentativeTuple",
            "verifierRepresentativeTupleCanonicalJsonUtf8",
          ],
        },
        {
          ordinal: 15,
          id: "hash_canonical_representative_tuple",
          inputs: [
            "boundNumericMaterializationPolicyBinding",
            "verifierRepresentativeTuple",
            "verifierRepresentativeTupleCanonicalJsonUtf8",
          ],
          outputs: ["verifierRepresentativeTupleSha256"],
        },
        {
          ordinal: 16,
          id: "independently_materialize_32_arrays",
          inputs: [
            "boundSeedV1Inputs",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "validatedProducerOwnLevelMultipoleBytes",
            "verifierMultipolePassThroughValidationReceipt",
            "verifierMultipolePassThroughValidationReceiptBinding",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierCRepresentativeBits",
            "verifierPRepresentativeBits",
            "verifierBoundaryLiftValues",
            "verifierTailScalarCoefficientBits",
            "verifierTailPotentialCoefficientBits",
            "verifierTailCoefficientInventorySha256",
            "verifierA0Bits",
            "verifierRepresentativeContinuumSha256",
            "verifierRepresentativeTuple",
            "verifierRepresentativeTupleSha256",
            "seedV1GridAndArrayInventory",
          ],
          outputs: ["verifierExpected32OrderedF64leArrays"],
        },
        {
          ordinal: 17,
          id: "compare_candidate_and_close_receipts",
          inputs: [
            "observedProducer32ArrayBytes",
            "observedProducer32ArrayStagingBinding",
            "verifierExpected32OrderedF64leArrays",
            "verifierMultipolePassThroughValidationReceipt",
            "verifierMultipolePassThroughValidationReceiptBinding",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "verifierRepresentativeTuple",
            "verifierRepresentativeTupleSha256",
            "verifierA0Bits",
            "verifierSourceL2ScalarSha256",
            "verifierSourceL2PotentialSha256",
            "verifierCRepresentativeBits",
            "verifierPRepresentativeBits",
            "verifierBoundaryLiftValues",
            "verifierScalarBoundaryLiftSha256",
            "verifierPotentialBoundaryLiftSha256",
            "verifierTailCoefficientInventorySha256",
            "verifierRepresentativeContinuumSha256",
            "verifierCoulombProofTrace",
            "verifierPeakProofTrace",
            "verifierExteriorHLowerBoundEvidence",
            "verifierExteriorHLowerBoundEvidenceBinding",
            "verifierContinuousNodelessProofCoreResult",
            "verifierContinuousNodelessProofCoreResultBinding",
            "verifierContinuousNodelessProofCorePassedTrue",
          ],
          outputs: [
            "numericMaterializationMatchOrRejection",
            "numericMaterializationMatchBindingOrNull",
          ],
        },
        {
          ordinal: 18,
          id: "gate_replay_on_positive_numeric_materialization_match",
          inputs: [
            "numericMaterializationMatchOrRejection",
            "numericMaterializationMatchBindingOrNull",
          ],
          outputs: [
            "validatedPositiveNumericMaterializationMatch",
            "validatedPositiveNumericMaterializationMatchBinding",
          ],
          guard: {
            dispositionMustEqual: "match",
            passedMustEqual: true,
            bindingMustBeNonNullAndRecompute: true,
            onRejectionOrInvalidBinding:
              "emit_no_validated_positive_match_no_replay_bundle_and_no_replay_binding_then_fail_closed",
          },
        },
        {
          ordinal: 19,
          id: "publish_verifier_replay_bundle",
          inputs: [
            "validatedPositiveNumericMaterializationMatch",
            "validatedPositiveNumericMaterializationMatchBinding",
            "verifierRepresentativeTuple",
            "verifierRepresentativeTupleSha256",
            "verifierRepresentativeContinuumSha256",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "observedProducer32ArrayStagingBinding",
            "verifierMultipolePassThroughValidationReceiptBinding",
            "verifierContinuousNodelessProofCoreResultBinding",
            "verifierExteriorHLowerBoundEvidenceBinding",
          ],
          outputs: [
            "verifierNumericMaterializationReplayBundle",
            "verifierNumericMaterializationReplayBundleBinding",
          ],
        },
      ],
      producer32ArrayStagingEvidenceSchema: {
        schemaVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_producer_32_array_staging/v1",
        exactKeys: [
          "schemaVersion",
          "seedBinding",
          "policyBinding",
          "operationGraphBinding",
          "entryCount",
          "entries",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: "literal_schema_version",
          seedBinding: "exact_bound_seed_v1_binding",
          policyBinding: "exact_bound_numeric_materialization_policy_binding",
          operationGraphBinding:
            "exact_bound_numeric_materialization_operation_graph_binding",
          entryCount: "literal_32",
          entries: {
            kind: "tuple",
            exactLength: 32,
            order: "imported_seed_v1_inventory_index_ascending_0_through_31",
            itemExactKeys: [
              "inventoryIndex",
              "levelId",
              "role",
              "relativePath",
              "shape",
              "byteLength",
              "dtype",
              "order",
              "rawArraySha256",
            ],
            itemExtraKeysAllowed: false,
            itemSemantics:
              "the_first_eight_fields_equal_the_same_index_imported_inventory_entry_and_rawArraySha256_is_SHA256_of_the_exact_raw_f64le_file_bytes",
          },
        },
        exactInventoryExpectations:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS,
        orderedEntryPreimage: [
          "inventoryIndex_as_u64be",
          "levelId_as_u16be_length_plus_UTF8",
          "role_as_u16be_length_plus_UTF8",
          "relativePath_as_u16be_length_plus_UTF8",
          "shape_as_u64be_rank_then_each_extent_u64be",
          "byteLength_as_u64be",
          "dtype_as_u16be_length_plus_UTF8",
          "order_as_u16be_length_plus_UTF8",
          "rawArraySha256_as_exact_32_digest_bytes",
        ],
        bindingRecipe: runtimeEvidenceBindingRecipe(
          "nhm2.prolate_boson_star_newtonian_seed.numeric_producer_32_array_staging",
          "nhm2_prolate_boson_star_newtonian_seed_numeric_producer_32_array_staging/v1",
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
        ),
      },
      multipolePassThroughValidationReceiptSchema: {
        schemaVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_multipole_validation_receipt/v1",
        exactKeys: [
          "schemaVersion",
          "policyBinding",
          "operationGraphBinding",
          "stagingBinding",
          "expectedEntryCount",
          "validatedMultipoleEntries",
          "checksPassed",
          "passed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: "literal_schema_version",
          policyBinding: "exact_bound_numeric_materialization_policy_binding",
          operationGraphBinding:
            "exact_bound_numeric_materialization_operation_graph_binding",
          stagingBinding: "exact_producer32ArrayStagingEvidenceSchema_binding",
          expectedEntryCount: "literal_6",
          validatedMultipoleEntries:
            "exact_six_entry_subsequence_at_inventory_indices_6_7_14_15_22_23_with_the_staging_entry_exact_keys_and_values",
          checksPassed:
            "exact_seven_element_boolean_tuple_in_exactChecksInOrder_order_with_every_value_literal_true",
          passed: "literal_true",
        },
        bindingRecipe: runtimeEvidenceBindingRecipe(
          "nhm2.prolate_boson_star_newtonian_seed.numeric_multipole_validation_receipt",
          "nhm2_prolate_boson_star_newtonian_seed_numeric_multipole_validation_receipt/v1",
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_VALIDATION_RECEIPT_SHA256_DOMAIN,
        ),
      },
      exteriorHLowerBoundEvidenceSchema: {
        schemaVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_exterior_H_lower_bound_evidence/v1",
        exactKeys: [
          "schemaVersion",
          "seedBinding",
          "proofReplayProtocolBinding",
          "policyBinding",
          "operationGraphBinding",
          "proofKernelBinding",
          "sourceL2ScalarSha256",
          "representativeContinuumSha256",
          "scalarBoundaryLiftSha256",
          "tailCoefficientInventorySha256",
          "scaledExteriorVariable",
          "aInfinityOverCosThetaGlobalIntervalBits",
          "scalarWeightedRemainderRatioUpperBits",
          "tailRadiiYBits",
          "tailRadiiZBits",
          "tailRadiusBits",
          "tailContractionUpperBits",
          "strictExteriorHLowerBoundBits",
          "joinValueDefectUpperBits",
          "joinDerivativeDefectUpperBits",
          "passed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: "literal_schema_version",
          seedBinding: "exact_bound_seed_v1_binding",
          proofReplayProtocolBinding:
            "exact_bound_proof_replay_protocol_binding",
          policyBinding: "exact_bound_numeric_materialization_policy_binding",
          operationGraphBinding:
            "exact_bound_numeric_materialization_operation_graph_binding",
          proofKernelBinding:
            "exact_independent_proof_kernel_toolchain_binding",
          sourceL2ScalarSha256: "exact_validated_L2_scalar_raw_array_sha256",
          representativeContinuumSha256: "exact_reconstructed_continuum_sha256",
          scalarBoundaryLiftSha256: "exact_scalar_boundary_lift_sha256",
          tailCoefficientInventorySha256:
            "exact_seed_registry_tail_inventory_hash_which_already_binds_both_representative_and_both_interval_tuples",
          scaledExteriorVariable:
            "literal_H_u=u_rep/(exp(-kappa*x)*x^pRepresentative*cos(theta))",
          aInfinityOverCosThetaGlobalIntervalBits:
            "exact_two_element_lower_upper_tuple_of_16_lowercase_hex_finite_binary64_numeric_bits_with_strictly_positive_lower",
          scalarWeightedRemainderRatioUpperBits:
            "exact_16_lowercase_hex_nonnegative_finite_binary64_numeric_bits_strictly_less_than_one",
          tailRadiiYBits:
            "exact_16_lowercase_hex_nonnegative_finite_binary64_numeric_bits",
          tailRadiiZBits:
            "exact_16_lowercase_hex_nonnegative_finite_binary64_numeric_bits",
          tailRadiusBits:
            "exact_16_lowercase_hex_positive_finite_binary64_numeric_bits",
          tailContractionUpperBits:
            "exact_16_lowercase_hex_nonnegative_finite_binary64_numeric_bits_strictly_less_than_one",
          strictExteriorHLowerBoundBits:
            "exact_16_lowercase_hex_strictly_positive_finite_binary64_numeric_bits_for_the_error_dominated_scaled_exterior_H_u",
          joinValueDefectUpperBits:
            "literal_positive_zero_bits_0000000000000000",
          joinDerivativeDefectUpperBits:
            "literal_positive_zero_bits_0000000000000000",
          passed: "literal_true",
        },
        invariants: [
          "tailRadiiY_plus_tailRadiiZ_is_at_most_tailRadius_under_the_bound_directed_rounding_proof_kernel",
          "tailContractionUpper_is_strictly_less_than_one_and_scalarWeightedRemainderRatioUpper_is_strictly_less_than_one",
          "aInfinityOverCosThetaGlobalInterval_lower_and_strictExteriorHLowerBound_are_strictly_positive",
          "the_evidence_carries_the_complete_closed_tail_positivity_and_error_summary_values_directly_for_the_pre_peak_nodeless_core",
        ],
        bindingRecipe: runtimeEvidenceBindingRecipe(
          "nhm2.prolate_boson_star_newtonian_seed.numeric_exterior_H_lower_bound_evidence",
          "nhm2_prolate_boson_star_newtonian_seed_numeric_exterior_H_lower_bound_evidence/v1",
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXTERIOR_H_EVIDENCE_SHA256_DOMAIN,
        ),
      },
      continuousNodelessProofCoreResultSchema: {
        schemaVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_nodeless_proof_core/v1",
        exactKeys: [
          "schemaVersion",
          "seedBinding",
          "proofReplayProtocolBinding",
          "policyBinding",
          "operationGraphBinding",
          "proofKernelBinding",
          "stagingBinding",
          "validationReceiptBinding",
          "sourceL2ScalarSha256",
          "sourceL2PotentialSha256",
          "representativeContinuumSha256",
          "scalarBoundaryLiftSha256",
          "tailCoefficientInventorySha256",
          "coverTraceSha256",
          "acceptedCompactBoxCount",
          "coverRecordCount",
          "maximumDepthUsed",
          "factoredCompactField",
          "minimumCompactRegularQuotientGLowerBoundBits",
          "exteriorHLowerBoundEvidenceBinding",
          "passed",
          "finalReceiptClosed",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: "literal_schema_version",
          seedBinding: "exact_bound_seed_v1_binding",
          proofReplayProtocolBinding:
            "exact_bound_proof_replay_protocol_binding",
          policyBinding: "exact_bound_numeric_materialization_policy_binding",
          operationGraphBinding:
            "exact_bound_numeric_materialization_operation_graph_binding",
          proofKernelBinding:
            "exact_independent_proof_kernel_toolchain_binding",
          stagingBinding: "exact_staging_evidence_binding",
          validationReceiptBinding: "exact_validation_receipt_binding",
          sourceL2ScalarSha256: "exact_validated_L2_scalar_raw_array_sha256",
          sourceL2PotentialSha256:
            "exact_validated_L2_potential_raw_array_sha256",
          representativeContinuumSha256: "exact_reconstructed_continuum_sha256",
          scalarBoundaryLiftSha256: "exact_scalar_boundary_lift_sha256",
          tailCoefficientInventorySha256:
            "exact_seed_registry_tail_inventory_hash_which_binds_the_consumed_scalar_and_potential_interval_and_representative_tuples",
          coverTraceSha256:
            "exact_seed_registry_cover_trace_hash_from_protocol_sourceL2ScalarSha256_and_strict_cover_record_stream",
          acceptedCompactBoxCount: "safe_integer_1_through_262144",
          coverRecordCount:
            "safe_integer_acceptedCompactBoxCount_through_262144_equal_to_the_complete_cover_queue_pop_stream_count",
          maximumDepthUsed: "safe_integer_0_through_24",
          factoredCompactField:
            "literal_g(rho,theta)=u(x,theta)/(x*cos(theta))_with_regular_endpoint_limits",
          minimumCompactRegularQuotientGLowerBoundBits:
            "exact_16_lowercase_hex_strictly_positive_finite_binary64_numeric_bits_for_g_not_for_raw_u",
          exteriorHLowerBoundEvidenceBinding:
            "exact_exteriorHLowerBoundEvidenceSchema_binding_with_passed_true",
          passed: "literal_true",
          finalReceiptClosed: "literal_false",
        },
        duty: "pre_peak_continuous_nodeless_proof_core_combining_the_compact_regular_quotient_g_cover_and_separately_bound_exterior_H_lower_bound_evidence_without_AUDIT_array_trace_or_final_receipt_closure",
        bindingRecipe: runtimeEvidenceBindingRecipe(
          "nhm2.prolate_boson_star_newtonian_seed.numeric_nodeless_proof_core",
          "nhm2_prolate_boson_star_newtonian_seed_numeric_nodeless_proof_core/v1",
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NODELESS_PROOF_CORE_SHA256_DOMAIN,
        ),
      },
      numericMaterializationMatchOrRejectionSchema: {
        discriminator: "disposition",
        positiveMatch: {
          schemaVersion:
            "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_match/v1",
          exactKeys: [
            "schemaVersion",
            "disposition",
            "policyBinding",
            "operationGraphBinding",
            "stagingBinding",
            "validationReceiptBinding",
            "nodelessProofCoreBinding",
            "exteriorHLowerBoundEvidenceBinding",
            "representativeTupleSha256",
            "representativeContinuumSha256",
            "sourceL2ScalarSha256",
            "sourceL2PotentialSha256",
            "candidateArrayRawSha256",
            "expectedArrayRawSha256",
            "passed",
          ],
          extraKeysAllowed: false,
          fields: {
            schemaVersion: "literal_schema_version",
            disposition: "literal_match",
            policyBinding: "exact_bound_numeric_materialization_policy_binding",
            operationGraphBinding:
              "exact_bound_numeric_materialization_operation_graph_binding",
            stagingBinding: "exact_staging_evidence_binding",
            validationReceiptBinding: "exact_validation_receipt_binding",
            nodelessProofCoreBinding: "exact_passed_nodeless_core_binding",
            exteriorHLowerBoundEvidenceBinding:
              "exact_binding_named_by_the_passed_nodeless_core",
            representativeTupleSha256: "exact_verifier_tuple_sha256",
            representativeContinuumSha256: "exact_verifier_continuum_sha256",
            sourceL2ScalarSha256: "exact_verifier_source_L2_scalar_sha256",
            sourceL2PotentialSha256:
              "exact_verifier_source_L2_potential_sha256",
            candidateArrayRawSha256:
              "exact_32_element_lowercase_SHA256_tuple_in_inventory_order",
            expectedArrayRawSha256:
              "exact_same_32_element_lowercase_SHA256_tuple_in_inventory_order",
            passed: "literal_true",
          },
        },
        rejection: {
          schemaVersion:
            "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_rejection/v1",
          exactKeys: [
            "schemaVersion",
            "disposition",
            "policyBinding",
            "stagingBindingOrNull",
            "failureCode",
            "firstMismatchInventoryIndexOrNull",
            "detailSha256",
          ],
          extraKeysAllowed: false,
          fields: {
            schemaVersion: "literal_schema_version",
            disposition: "literal_rejection",
            policyBinding: "exact_bound_numeric_materialization_policy_binding",
            stagingBindingOrNull: "exact_staging_binding_or_null_if_unformable",
            failureCode: {
              kind: "enum",
              exactValues:
                NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REJECTION_FAILURE_CODES,
              anyOtherValueAllowed: false,
            },
            firstMismatchInventoryIndexOrNull:
              "integer_0_through_31_or_null_if_not_array_specific",
            detailSha256: "exact_64_lowercase_hex_SHA256",
          },
        },
        positiveBindingRecipe: runtimeEvidenceBindingRecipe(
          "nhm2.prolate_boson_star_newtonian_seed.numeric_materialization_match",
          "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_match/v1",
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NUMERIC_MATCH_SHA256_DOMAIN,
        ),
        rejectionBinding: null,
        replayPublicationGuard: {
          nodeId: "gate_replay_on_positive_numeric_materialization_match",
          requiresDisposition: "match",
          requiresPassed: true,
          requiresNonNullRecomputedPositiveBinding: true,
          rejectionEmitsReplayBundle: false,
          rejectionEmitsReplayBinding: false,
        },
      },
      verifierNumericMaterializationReplayBundleSchema: {
        schemaVersion:
          "nhm2_prolate_boson_star_newtonian_seed_numeric_verifier_replay_bundle/v1",
        exactKeys: [
          "schemaVersion",
          "policyBinding",
          "operationGraphBinding",
          "stagingBinding",
          "validationReceiptBinding",
          "nodelessProofCoreBinding",
          "exteriorHLowerBoundEvidenceBinding",
          "numericMaterializationMatch",
          "numericMaterializationMatchBinding",
          "representativeTuple",
          "representativeTupleSha256",
          "representativeContinuumSha256",
          "sourceL2ScalarSha256",
          "sourceL2PotentialSha256",
        ],
        extraKeysAllowed: false,
        fields: {
          schemaVersion: "literal_schema_version",
          policyBinding: "exact_bound_numeric_materialization_policy_binding",
          operationGraphBinding:
            "exact_bound_numeric_materialization_operation_graph_binding",
          stagingBinding: "exact_staging_evidence_binding",
          validationReceiptBinding: "exact_validation_receipt_binding",
          nodelessProofCoreBinding: "exact_passed_nodeless_core_binding",
          exteriorHLowerBoundEvidenceBinding:
            "equals_numericMaterializationMatch.exteriorHLowerBoundEvidenceBinding_and_the_binding_named_by_the_nodeless_core",
          numericMaterializationMatch:
            "exact_positiveMatch_variant_never_rejection",
          numericMaterializationMatchBinding:
            "exact_positive_numeric_match_binding",
          representativeTuple:
            "exact_closed_representative_tuple_and_the_only_tuple_bearing_interstage_field",
          representativeTupleSha256:
            "exact_hash_of_representativeTuple_under_the_frozen_tuple_recipe",
          representativeContinuumSha256:
            "equals_representativeTuple.representativeContinuumSha256",
          sourceL2ScalarSha256:
            "equals_representativeTuple.sourceL2ScalarSha256",
          sourceL2PotentialSha256:
            "equals_representativeTuple.sourceL2PotentialSha256",
        },
        bindingRecipe: runtimeEvidenceBindingRecipe(
          "nhm2.prolate_boson_star_newtonian_seed.numeric_verifier_replay_bundle",
          "nhm2_prolate_boson_star_newtonian_seed_numeric_verifier_replay_bundle/v1",
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPLAY_BUNDLE_SHA256_DOMAIN,
        ),
        onlyTupleBearingInterstageChannel: true,
      },
      typedOutputBindings: {
        observedProducer32ArrayStagingManifest:
          "producer32ArrayStagingEvidenceSchema",
        observedProducer32ArrayStagingBinding:
          "producer32ArrayStagingEvidenceSchema.bindingRecipe",
        verifierMultipolePassThroughValidationReceipt:
          "multipolePassThroughValidationReceiptSchema",
        verifierMultipolePassThroughValidationReceiptBinding:
          "multipolePassThroughValidationReceiptSchema.bindingRecipe",
        verifierExteriorHLowerBoundEvidence:
          "exteriorHLowerBoundEvidenceSchema",
        verifierExteriorHLowerBoundEvidenceBinding:
          "exteriorHLowerBoundEvidenceSchema.bindingRecipe",
        verifierContinuousNodelessProofCoreResult:
          "continuousNodelessProofCoreResultSchema",
        verifierContinuousNodelessProofCoreResultBinding:
          "continuousNodelessProofCoreResultSchema.bindingRecipe",
        numericMaterializationMatchOrRejection:
          "numericMaterializationMatchOrRejectionSchema",
        numericMaterializationMatchBindingOrNull:
          "numericMaterializationMatchOrRejectionSchema.positiveBindingRecipe_or_null",
        validatedPositiveNumericMaterializationMatch:
          "numericMaterializationMatchOrRejectionSchema.positiveMatch",
        validatedPositiveNumericMaterializationMatchBinding:
          "numericMaterializationMatchOrRejectionSchema.positiveBindingRecipe",
        verifierNumericMaterializationReplayBundle:
          "verifierNumericMaterializationReplayBundleSchema",
        verifierNumericMaterializationReplayBundleBinding:
          "verifierNumericMaterializationReplayBundleSchema.bindingRecipe",
      },
      multipolePassThroughInputValidation: {
        nodeId: "fail_closed_validate_six_multipole_pass_through_inputs",
        occursBeforeAnyMultipolePassThroughOrScientificEvaluation: true,
        exactExpectedEntries:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS,
        exactChecksInOrder: [
          "staging_bundle_contains_exactly_32_arrays_in_the_imported_inventory_order",
          "each_of_the_six_L0_L1_L2_multipole_entries_has_the_exact_inventory_index_level_role_relative_path_shape_dtype_order_and_byte_length",
          "each_raw_array_byte_length_equals_the_bound_inventory_byte_length_before_decoding",
          "every_decoded_binary64_value_is_finite",
          "no_decoded_binary64_value_is_negative_zero",
          "every_seed_v1_symbolic_multipole_mask_entry_is_exact_positive_zero_and_every_required_mask_position_is_present",
          "no_unvalidated_multipole_byte_is_exposed_to_a_selector_reconstruction_or_bit_pass_through",
        ],
        expectedEntryCount: 6,
        failureDisposition: "fail_closed_before_any_pass_through_or_evaluation",
        validationReceiptAuthority: false,
      },
      continuousNodelessProofCore: {
        nodeId: "independently_prove_continuous_nodeless_core",
        requiredBeforePeakNodeId: "independently_prove_peak_and_select_A0",
        requiredResultSchema: "continuousNodelessProofCoreResultSchema",
        requiredResultBinding:
          "continuousNodelessProofCoreResultSchema.bindingRecipe",
        requiredPassedValue: true,
        requiredFinalReceiptClosedValue: false,
        compactField:
          "g(rho,theta)=u(x,theta)/(x*cos(theta))_with_regular_endpoint_limits",
        rawScalarUIsTheCertifiedCompactLowerBoundSubject: false,
        exteriorEvidenceSchema: "exteriorHLowerBoundEvidenceSchema",
        excludesDownstreamInputs: [
          "verifierExpected32OrderedF64leArrays",
          "numericMaterializationMatchOrRejection",
          "verifierNumericMaterializationReplayBundle",
          "AUDIT_array_trace",
          "finalContinuousNodelessIntervalProofReceipt",
        ],
        finalReceiptDuty:
          "external_full_seed_v1_admission_must_later_supply_the_fully_closed_continuous_nodeless_interval_proof_receipt_after_array_replay_without_replacing_or_retroactively_authorizing_this_core",
        coreMayAdmitSeedOrArtifact: false,
      },
      verifierRepresentativeTupleSha256Recipe: {
        algorithm: "SHA-256",
        domain:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPRESENTATIVE_TUPLE_SHA256_DOMAIN,
        domainEndsWithExactlyOneLf: true,
        canonicalTupleSerialization:
          "UTF8_of_no_whitespace_canonical_JSON_with_recursively_lexicographically_sorted_object_keys_arrays_in_schema_order_finite_integers_in_canonical_decimal_and_strings_byte_exact",
        tupleSchema:
          "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_tuple/v1",
        orderedPreimage: [
          "domain_UTF8_bytes_including_the_single_terminal_LF",
          "u64be_canonical_tuple_UTF8_byte_length",
          "canonical_tuple_UTF8_bytes",
        ],
        hashExpression:
          "sha256(domainUtf8 || u64be(canonicalTupleUtf8ByteLength) || canonicalTupleUtf8Bytes)",
        anyOtherPreimageComponentAllowed: false,
      },
      derivedHashPreimageClosures: {
        verifierCoverTraceSha256: {
          registryReceiptField: "coverTraceSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2ScalarSha256", "verifierSourceL2ScalarSha256"],
            ["coverRecords", "verifierCompactRegularQuotientGCoverRecords"],
          ],
        },
        verifierTailCoefficientInventorySha256: {
          registryReceiptField: "tailCoefficientInventorySha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            [
              "tailScalarRepresentativeCoefficients",
              "verifierTailScalarCoefficientBits",
            ],
            [
              "tailPotentialRepresentativeCoefficients",
              "verifierTailPotentialCoefficientBits",
            ],
            [
              "tailScalarContinuationCoefficientIntervals",
              "verifierScalarTailCoefficientIntervals",
            ],
            [
              "tailPotentialContinuationCoefficientIntervals",
              "verifierPotentialTailCoefficientIntervals",
            ],
          ],
        },
        verifierScalarBoundaryLiftSha256: {
          registryReceiptField: "scalarBoundaryLiftSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2ScalarSha256", "verifierSourceL2ScalarSha256"],
            ["CRepresentative", "verifierCRepresentativeBits"],
            ["pRepresentative", "verifierPRepresentativeBits"],
            ["formulaId", "H_boundary_lift/v1"],
            [
              "liftDerivationRecords",
              "verifierScalarBoundaryLiftDerivationRecords",
            ],
          ],
        },
        verifierPotentialBoundaryLiftSha256: {
          registryReceiptField: "potentialBoundaryLiftSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2PotentialSha256", "verifierSourceL2PotentialSha256"],
            ["CRepresentative", "verifierCRepresentativeBits"],
            ["pRepresentative", "verifierPRepresentativeBits"],
            ["formulaId", "Q_boundary_lift/v1"],
            [
              "liftDerivationRecords",
              "verifierPotentialBoundaryLiftDerivationRecords",
            ],
          ],
        },
        verifierRepresentativeContinuumSha256: {
          registryReceiptField: "representativeContinuumSha256",
          recipeBindingInput: "boundSeedV1DerivedHashRegistryPreimages",
          orderedPayloadFields: [
            ["protocolBinding", "boundProofReplayProtocolInput"],
            ["sourceL2ScalarSha256", "verifierSourceL2ScalarSha256"],
            ["sourceL2PotentialSha256", "verifierSourceL2PotentialSha256"],
            ["CRepresentative", "verifierCRepresentativeBits"],
            ["pRepresentative", "verifierPRepresentativeBits"],
            ["scalarBoundaryLiftSha256", "verifierScalarBoundaryLiftSha256"],
            [
              "potentialBoundaryLiftSha256",
              "verifierPotentialBoundaryLiftSha256",
            ],
            [
              "tailCoefficientInventorySha256",
              "verifierTailCoefficientInventorySha256",
            ],
            ["formulaId", "piecewise_L2_HQ_lifted_tail/v1"],
          ],
        },
      },
      tuplePublication: {
        producerPublishesTuple: false,
        verifierPublishesTupleOnlyAfterByteComparison: true,
        verifierPublishesReplayOnlyAfterPositiveMatchGuard: true,
        rejectionPublishesReplayBundleOrBinding: false,
        onlyTupleBearingChannel: "verifierNumericMaterializationReplayBundle",
      },
      trustsProducerRepresentativeSelection: false,
      soleScientificAdmissionStage: false,
      numericMatchHasSeedOrArtifactAdmissionAuthority: false,
      terminalDuty:
        "independent_numeric_materialization_match_or_rejection_only",
    },
    descriptorAssemblerDAG: {
      stage: "trusted_descriptor_assembler",
      externalInputs: [
        "verifierNumericMaterializationReplayBundle",
        "verifierNumericMaterializationReplayBundleBinding",
        "observedProducer32ArrayStagingBinding",
        "boundNumericMaterializationPolicyBinding",
        "boundNumericMaterializationOperationGraphIdentity",
        "externalFullSeedV1Admission",
        "immutableProducer32ArrayStagingObservation",
        "boundOutputDescriptorSchemaV1",
      ],
      nodes: [
        {
          ordinal: 0,
          id: "assemble_only_after_external_full_seed_admission_and_numeric_match",
          inputs: [
            "verifierNumericMaterializationReplayBundle",
            "verifierNumericMaterializationReplayBundleBinding",
            "observedProducer32ArrayStagingBinding",
            "boundNumericMaterializationPolicyBinding",
            "boundNumericMaterializationOperationGraphIdentity",
            "externalFullSeedV1Admission",
            "immutableProducer32ArrayStagingObservation",
            "boundOutputDescriptorSchemaV1",
          ],
          outputs: ["descriptorAssemblyOrFailClosedRejection"],
        },
      ],
      sameCandidateIdentityRequirements: [
        "verifierNumericMaterializationReplayBundleBinding_recomputes_from_the_exact_replay_bundle_under_its_unique_LF_domain_and_closed_schema",
        "the_assembler_resolves_representativeTuple_representativeTupleSha256_representativeContinuumSha256_and_numericMaterializationMatch_only_from_verifierNumericMaterializationReplayBundle_and_accepts_no_separate_tuple_tuple_hash_continuum_or_match_input",
        "the_replay_bundle_numericMaterializationMatch_is_the_positive_match_variant_with_passed_true_and_its_binding_recomputes_under_the_numeric_match_unique_LF_domain_after_the_explicit_guard_while_every_rejection_emits_no_replay_bundle_or_binding",
        "the_replay_bundle_stagingBinding_equals_observedProducer32ArrayStagingBinding_which_recomputes_from_the_exact_immutableProducer32ArrayStagingObservation_32_entry_manifest",
        "the_replay_bundle_representativeTupleSha256_recomputes_from_its_embedded_representativeTuple_under_the_frozen_tuple_LF_domain_and_ordered_preimage_recipe",
        "the_replay_bundle_representativeTuple_representativeContinuum_source_L2_exterior_H_evidence_and_cover_trace_identities_equal_the_corresponding_numeric_match_validation_nodeless_core_and_staging_identities",
        "the_replay_bundle_policyBinding_and_operationGraphBinding_equal_the_bound_policy_and_operation_graph_inputs",
        "externalFullSeedV1Admission_candidate_identity_equals_the_same_stagingBinding_and_its_complete_gate_report_final_closed_nodeless_origin_peak_and_nodal_to_postprojection_receipts_bind_the_same_source_L2_representative_continuum_policy_and_operation_graph_identities",
        "any_identity_absence_mismatch_duplicate_or_cross_candidate_mix_fails_closed_before_descriptor_assembly",
      ],
      tupleResolution: {
        soleTupleBearingInput: "verifierNumericMaterializationReplayBundle",
        separateTupleInputAllowed: false,
        separateTupleSha256InputAllowed: false,
        separateContinuumSha256InputAllowed: false,
        separateNumericMatchInputAllowed: false,
      },
      mayRecomputeOrOverrideScience: false,
      policyAloneMayAuthorizeAssembly: false,
    },
    externalFullSeedV1AdmissionRequirements: [
      "complete_seed_v1_gate_report",
      "continuous_nodeless_interval_proof_receipt",
      "numerical_origin_series_defect_gate_receipt",
      "continuous_unique_peak_interval_proof_receipt",
      "separately_bound_nodal_to_postprojection_parity_Legendre_operation_graph_and_input_acceptance_receipt",
    ],
    crossStageBindings: [
      "producer32ArrayStagingBundle_is_immutably_observed_as_immutableProducer32ArrayStagingObservation",
      "producer_to_verifier_channel_contains_exactly_32_ordered_f64le_arrays_and_no_tuple_or_metadata",
      "verifierNumericMaterializationReplayBundle_is_the_only_tuple_bearing_channel",
      "numeric_materialization_rejection_emits_no_verifier_replay_bundle_or_binding_and_only_a_guarded_positive_match_can_reach_replay_publication",
      "descriptor_assembly_extracts_the_positive_numericMaterializationMatch_tuple_tuple_hash_and_continuum_only_from_the_bound_verifierNumericMaterializationReplayBundle_and_also_requires_externalFullSeedV1Admission",
      "descriptor_assembly_requires_replay_validation_nodeless_core_policy_operation_graph_staging_and_full_admission_identities_to_name_one_exact_candidate",
    ],
    temporalCycleAllowed: false,
  } as const);

const outputRoleSource = (levelId: string, role: string) => {
  if (role === "newtonian_seed.grid.rho_nodes") {
    return {
      sourceKind: "frozen_MPFR256_mapped_rho_node_generation",
      sourceDetail:
        "serialize_once_as_raw_f64le_then_reinject_exact_bits_for_every_evaluator",
    };
  }
  if (role === "newtonian_seed.grid.theta_nodes") {
    return {
      sourceKind: "frozen_MPFR256_mapped_theta_node_generation",
      sourceDetail:
        "analytic_z_is_computed_from_the_same_pre_serialization_MPFR_theta_then_theta_is_raw_f64le",
    };
  }
  if (
    role === "newtonian_seed.base.scalar_u0" ||
    role === "newtonian_seed.base.potential_V0"
  ) {
    return levelId === "AUDIT"
      ? {
          sourceKind:
            "canonical_AUDIT_multipoles_then_frozen_angular_synthesis",
          sourceDetail:
            "base_AUDIT_nodal_values_may_not_call_the_direct_piecewise_point_evaluator",
        }
      : {
          sourceKind:
            "own_level_postprojection_multipole_frozen_angular_synthesis",
          sourceDetail: `${levelId}_uses_its_own_same_row_accepted_postprojection_multipoles`,
        };
  }
  if (
    role === "newtonian_seed.target.scalar_u_A" ||
    role === "newtonian_seed.target.potential_V_A"
  ) {
    return {
      sourceKind: "scaled_piecewise_L2_continuum_point_evaluator",
      sourceDetail:
        "amplitude_major_then_radial_then_angular_C_order_with_target_rhoLambda256_no_binary64_coordinate_barrier",
    };
  }
  if (levelId !== "AUDIT") {
    return {
      sourceKind: "validated_observed_postprojection_binary64_bit_passthrough",
      sourceDetail:
        "exact_input_bits_after_finite_negative_zero_and_symbolic_mask_validation;no_MPFR_no_reprojection_no_get_d",
    };
  }
  return {
    sourceKind: "frozen_piecewise_L2_or_analytic_tail_modal_derivation",
    sourceDetail:
      "AUDIT_interior_q0_through_31_then_positive_zero_padding_or_tail_q0_through_63_without_quadrature",
  };
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OUTPUT_ROLE_SOURCE_TABLE =
  deepFreeze(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
      (entry) => ({
        inventoryIndex: entry.inventoryIndex,
        levelIndex: entry.levelIndex,
        roleIndex: entry.roleIndex,
        levelId: entry.levelId,
        role: entry.role,
        relativePath: entry.relativePath,
        shape: entry.shape,
        byteLength: entry.byteLength,
        serialization: "raw_IEEE754_binary64_little_endian_C_order",
        ...outputRoleSource(entry.levelId, entry.role),
      }),
    ),
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH =
  deepFreeze({
    graphVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_operation_graph/mpfr256_rndn_v1",
    boundedExpectedBitFixtureStatus: {
      provenance:
        "frozen_nonphysical_spec_literals_supplied_for_adversarial_review",
      executedAgainstBoundMpfrGmpRuntime: false,
      runtimeConformanceAuthority: false,
      scientificAuthority: false,
    },
    arithmeticKernel: {
      implementationClass: "MPFR",
      precisionBits: 256,
      everyDestinationPrecisionBits: 256,
      roundingMode: "MPFR_RNDN",
      exponentRange: { emin: -1000000, emax: 1000000 },
      exponentRangeSetBeforeAnyGraphOperation: true,
      everyPrimitiveRoundsIndependently: true,
      binary64InputInjection: "exact_IEEE_754_binary64_bit_pattern_to_MPFR",
      integerInjection:
        "mpfr_set_z_into_256_bit_destination_is_exact_when_in_range",
      rationalInjection:
        "canonical_GMP_mpq_then_mpfr_set_q_into_256_bit_destination_with_MPFR_RNDN;the_MPFR_value_is_not_claimed_exact",
      finalSerialization:
        "finalElementBits=mpfr_get_d(value256,MPFR_RNDN)_at_barrier_final_ordered_array_element_bits_then_emit_raw_little_endian_bytes",
      flagDiscipline: {
        clear:
          "mpfr_clear_flags_before_each_array_element_or_modal_record_graph",
        inspectOrBranchOnFlags: false,
        acceptanceFromFlagsAllowed: false,
      },
      binary64GradualUnderflow:
        "every_mpfr_get_d_selector_or_output_barrier_requires_IEEE754_binary64_gradual_underflow_RNDN_ties_to_even_with_no_FTZ_or_DAZ",
      allowedBinary64Barriers: [
        "accepted_postprojection_multipole_input_bits",
        "serialized_rho_node_bits",
        "serialized_theta_node_bits",
        "serialized_analytic_z_bits",
        "CRepresentativeBits",
        "pRepresentativeBits",
        "A0Bits",
        "tailScalarCoefficientBits",
        "tailPotentialCoefficientBits",
        "perTargetLambdaBits",
        "final_ordered_array_element_bits",
      ],
      selectorAndSerializationBarrierInventory: [
        {
          id: "accepted_postprojection_multipole_input_bits",
          primitive:
            "exact_binary64_input_validation_and_reinjection_or_bit_passthrough",
        },
        { id: "serialized_rho_node_bits", primitive: "mpfr_get_d" },
        { id: "serialized_theta_node_bits", primitive: "mpfr_get_d" },
        { id: "serialized_analytic_z_bits", primitive: "mpfr_get_d" },
        {
          id: "CRepresentativeBits",
          primitive: "unique_whole_interval_binary64_RNDN_image_selection",
        },
        { id: "pRepresentativeBits", primitive: "mpfr_get_d" },
        { id: "A0Bits", primitive: "mpfr_get_d" },
        { id: "tailScalarCoefficientBits", primitive: "mpfr_get_d" },
        { id: "tailPotentialCoefficientBits", primitive: "mpfr_get_d" },
        { id: "perTargetLambdaBits", primitive: "mpfr_get_d" },
        { id: "final_ordered_array_element_bits", primitive: "mpfr_get_d" },
      ],
      mpfrGetDBarrierInventory: [
        "serialized_rho_node_bits",
        "serialized_theta_node_bits",
        "serialized_analytic_z_bits",
        "pRepresentativeBits",
        "tailScalarCoefficientBits",
        "tailPotentialCoefficientBits",
        "A0Bits",
        "perTargetLambdaBits",
        "final_ordered_array_element_bits",
      ],
      mpfrGetDBarrierRule:
        "every_executable_mpfr_get_d_call_is_labeled_with_exactly_one_id_from_mpfrGetDBarrierInventory_and_no_coordinate_join_or_rhoLambda_barrier_exists",
      unlistedBinary64IntermediateAllowed: false,
      prohibited: [
        "fused_multiply_add",
        "BLAS_or_vendor_reduction",
        "extended_precision_register",
        "expression_reassociation",
        "compensated_summation",
        "platform_libm",
        "any_binary64_intermediate_not_named_in_allowedBinary64Barriers",
        "flush_to_zero_or_denormals_are_zero",
        "MPFR_default_precision_inheritance",
        "branching_on_MPFR_status_flags",
      ],
      runtimeToolchainBindingRequiredBeforeExecution: true,
      runtimeToolchainBinding: null,
      runtimeConformanceBindingRequirements: {
        binding: null,
        exactKeys: [
          "mpfrBinarySha256",
          "mpfrVersion",
          "mpfrAbi",
          "gmpBinarySha256",
          "gmpVersion",
          "gmpAbi",
          "eminSetExact",
          "emaxSetExact",
          "exponentRangeSetSucceeded",
          "nonconcurrentExponentRangeMutation",
          "everyDestinationPrecisionBits",
          "flagsClearedAtNamedBoundaries",
          "noFlagDependentBranching",
          "binary64GradualUnderflowRNDNTiesToEven",
          "flushToZeroDisabled",
          "denormalsAreZeroDisabled",
        ],
        binaryDigestsRequired: true,
        abiIdentityRequired: true,
        exponentRangeSetSuccessReceiptRequired: true,
        nonconcurrentExponentRangeMutationReceiptRequired: true,
        flagDisciplineReceiptRequired: true,
        gradualUnderflowReceiptRequired: true,
        conformanceAuthorityUntilBoundAndExecuted: false,
      },
      zeroRule:
        "every_exact_or_rounded_zero_is_canonical_positive_zero_before_any_later_use_or_serialization",
    },
    mappedNodes: {
      commonProgram: [
        "pi256=MPFR_const_pi(256,MPFR_RNDN)",
        "argument=RN256(pi256*index)",
        "argument=RN256(argument/(count-1))",
        "cosine=RN256(cos(argument))",
        "difference=RN256(1-cosine)",
        "rho=RN256(difference/exact_2)",
        "thetaNumerator=RN256(pi256*difference)",
        "theta=RN256(thetaNumerator/exact_4)",
        "z=RN256(cos(theta))_before_theta_binary64_serialization",
        "rhoBits=mpfr_get_d(rho,MPFR_RNDN)_as_binary64_bits_at_barrier_serialized_rho_node_bits",
        "thetaBits=mpfr_get_d(theta,MPFR_RNDN)_as_binary64_bits_at_barrier_serialized_theta_node_bits",
        "zBits=mpfr_get_d(z,MPFR_RNDN)_as_binary64_bits_at_barrier_serialized_analytic_z_bits",
      ],
      endpoints:
        "index=0_uses_rho=theta=symbolic_+0_and_z=exact_+1;index=count-1_uses_rho=exact_1_theta=RN256(pi256/exact_2)_and_z=symbolic_+0",
      analyticZComputedBeforeThetaBinary64Serialization: true,
      evaluatorReinjection: [
        "rhoEval=mpfr_set_d_256(exact_binary64_from_rhoBits,MPFR_RNDN)",
        "zEval=mpfr_set_d_256(exact_binary64_from_zBits,MPFR_RNDN)",
        "every_grid_entry_evaluation_begins_only_from_rhoEval_and_zEval;target_rhoLambda_is_derived_only_from_rhoEval_by_the_frozen_pullback_graph",
        "pre_serialization_rho_theta_z_MPFR_values_have_node_generation_duty_only_and_never_flow_to_an_evaluator",
      ],
      rawLittleEndianBinary64Sha256: {
        rho64:
          "1f42876204af11c7eebab8bba8cbcd8694270e106f19479bbbd74fc47521ecab",
        rho96:
          "e4693c83ca71d6cba37317baa2a716b487cbd6689b003845246e9e1e235f8cd9",
        rho128:
          "9e170ea9a3c1a75005fa764258be838a2141564140e0434caeadc178863f24a4",
        rho256:
          "0de2b433de1de16840a4a63231bfe72089b4a91b6f44bbe410b3724f2a6e9e9a",
        theta32:
          "991643f4c2d20d7c7c8f639f42346af45bd2ac01cebb35c44eae06b5f38e5ae3",
        theta48:
          "e9c60c916310165f1f1719bfaef2fb7ca418e37a3a7b2d56e05878c9750e050e",
        theta64:
          "010b1fb4c92e8ae89c6ae217e98143e3d42f90f781de04e51ee61e8dbaaa5178",
        theta128:
          "0c35a610d4f1197991302eabd929da6864f5ea3a33dcf8be87401c29320aa601",
        z32: "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152",
        z48: "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c",
        z64: "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28",
        z128: "c65b4e8c6c69e02c383b7eb2cf247d450e53f4bd626686da046efa54727c2773",
      },
      boundedCount4ExpectedBitsFixture: {
        scientificAuthority: false,
        rawF64leSha256: {
          rho: "ecfe72366c4a0df3556412053b6a488285f7713e724b116c1a84cb7b8a93e0a8",
          theta:
            "1c05cdde7f66f8f7fb76613edcef0898fd042052cf94bde56472fd09ec6ae47e",
          z: "6c36ca2b7fceb265baabadaf8f281f535b9b429e51100d856aad7e17a3c716fb",
        },
        endpointBits: {
          rho0: "0000000000000000",
          rho3: "3ff0000000000000",
          theta0: "0000000000000000",
          z0: "3ff0000000000000",
          z3: "0000000000000000",
        },
        analyticZIndex2Bits: "3fd87de2a6aea963",
        rejectedAdjacentUlpBits: "3fd87de2a6aea964",
      },
    },
    inventoryTraversalAndPreArithmeticMasks: {
      importedSeedInventorySingletonIdentityRequired: true,
      traversalAndMaskDecisionsFrozenBeforeAnyArithmetic: true,
      levelOrder: ["L0", "L1", "L2", "AUDIT"],
      roleOrder: [
        "newtonian_seed.grid.rho_nodes",
        "newtonian_seed.grid.theta_nodes",
        "newtonian_seed.base.scalar_u0",
        "newtonian_seed.base.potential_V0",
        "newtonian_seed.target.scalar_u_A",
        "newtonian_seed.target.potential_V_A",
        "newtonian_seed.multipole.scalar_odd",
        "newtonian_seed.multipole.potential_even",
      ],
      amplitudeOrder: [
        "2^-16",
        "2^-15",
        "2^-14",
        "2^-13",
        "2^-12",
        "2^-11",
        "2^-10",
      ],
      arraySerializationOrder:
        "inventoryIndex_ascending_with_level_outer_then_role_inner_and_one_raw_little_endian_binary64_C_order_file_per_inventory_entry",
      withinArrayLoopOrder: {
        rhoNodes: "radial_index_j_ascending",
        thetaNodes: "angular_index_k_ascending",
        baseNodal: "radial_index_j_outer_then_angular_index_k_inner",
        targetNodal:
          "amplitude_stage_outer_then_radial_index_j_middle_then_angular_index_k_inner_matching_shape_[7,Nr,Ntheta]_C_order",
        multipole:
          "radial_index_j_outer_then_angular_mode_q_inner_matching_shape_[Nr,Ntheta/2]_C_order",
      },
      symbolicMaskPrecedence: {
        rule: "if_an_entry_matches_any_symbolic_mask_emit_0000000000000000_and_return_before_singular_coordinate_conversion_DCT_Clenshaw_Legendre_tail_point_evaluation_interpolation_pullback_or_scaling",
        evaluatorCallbackInvocationsForMaskedEntry: 0,
        masks: [
          "all_levels_scalar_multipoles_at_rho_index_0_and_rho_index_Nr-1",
          "all_levels_potential_multipoles_at_rho_index_Nr-1",
          "all_levels_base_and_seven_target_scalar_nodal_at_rho_index_0_rho_index_Nr-1_or_equator_angular_index_Ntheta-1",
          "all_levels_base_and_seven_target_potential_nodal_at_rho_index_Nr-1",
          "AUDIT_radial_index_j_0_through_226_inclusive_q_32_through_63_for_both_scalar_and_potential_multipoles",
        ],
        overlappingMasksWriteOnce: true,
      },
    },
    outputRoleSourceTableSchema: {
      levelCount: 4,
      roleCountPerLevel: 8,
      exactEntryCount: 32,
      exactEntryKeys: [
        "inventoryIndex",
        "levelIndex",
        "roleIndex",
        "levelId",
        "role",
        "relativePath",
        "shape",
        "byteLength",
        "serialization",
        "sourceKind",
        "sourceDetail",
      ],
      extraEntriesAllowed: false,
      extraEntryKeysAllowed: false,
    },
    outputRoleSourceTable:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OUTPUT_ROLE_SOURCE_TABLE,
    evaluationCoordinateSources: {
      gridBaseAndAudit: {
        source:
          "rhoEval=mpfr_set_d_256(exact_binary64_from_the_exact_serialized_rhoBits,MPFR_RNDN)",
        preSerializationMappedRhoMayFlowToEvaluator: false,
      },
      targets: {
        source:
          "rhoLambda256_is_computed_by_the_frozen_pullback_from_reinjected_rhoEval_and_reinjected_lambda_without_any_rhoLambda_binary64_barrier",
        rhoLambdaBinary64BarrierAllowed: false,
      },
      c1Join: {
        source:
          "rhoJoin256=mpfr_set_q(destination_precision_256,GMP_mpq(exact_32,exact_33),MPFR_RNDN)",
        rhoJoinBinary64BarrierAllowed: false,
        xConstants: "all_tail_join_formula_constants_are_exact_integer_32",
      },
      anyOtherCoordinateSourceAllowed: false,
    },
    representativeSelectorBarriers: {
      C: [
        "require_the_whole_verifier_isolated_C_interval_to_round_to_one_binary64_RNDN_value",
        "CRepresentativeBits=that_unique_binary64_value_with_zero_sign_canonicalized_positive",
        "C=mpfr_set_d_256(exact_binary64_from_CRepresentativeBits,MPFR_RNDN)",
      ],
      p: [
        "kappa0=mpfr_set_ui_256(exact_1,MPFR_RNDN)",
        "cOverKappa=RN256(C/kappa0)",
        "p256=RN256(cOverKappa-exact_1)",
        "pRepresentativeBits=mpfr_get_d(p256,MPFR_RNDN)_with_zero_sign_canonicalized_positive_at_barrier_pRepresentativeBits",
        "p=mpfr_set_d_256(exact_binary64_from_pRepresentativeBits,MPFR_RNDN)",
      ],
      tailCoefficients: [
        "midpointMpq=the_exact_GMP_mpq_dyadic_midpoint_of_the_same_index_verifier_interval",
        "midpoint256=mpfr_set_q(destination_precision_256,midpointMpq,MPFR_RNDN)",
        "for_a_scalar_tuple_entry_scalarCoefficientBits=mpfr_get_d(midpoint256,MPFR_RNDN)_with_zero_sign_canonicalized_positive_at_barrier_tailScalarCoefficientBits",
        "for_a_potential_tuple_entry_potentialCoefficientBits=mpfr_get_d(midpoint256,MPFR_RNDN)_with_zero_sign_canonicalized_positive_at_barrier_tailPotentialCoefficientBits",
        "selectedCoefficientBits=is_exactly_the_role_specific_scalarCoefficientBits_or_potentialCoefficientBits",
        "coefficient=mpfr_set_d_256(exact_binary64_from_selectedCoefficientBits,MPFR_RNDN)",
      ],
      A0: [
        "A0MidpointMpq=the_exact_GMP_mpq_dyadic_midpoint_of_verifierA0Interval",
        "A0Midpoint256=mpfr_set_q(destination_precision_256,A0MidpointMpq,MPFR_RNDN)",
        "A0Bits=mpfr_get_d(A0Midpoint256,MPFR_RNDN)_at_barrier_A0Bits",
        "A0=mpfr_set_d_256(exact_binary64_from_A0Bits,MPFR_RNDN)",
      ],
    },
    legendreForward: {
      normalization: "P_ell(1)=1",
      initial: ["P_0=exact_1", "P_1=z"],
      loopOrder: "ell_ascending_1_through_requiredMaximumMinus1",
      primitiveProgram: [
        "t0=RN256((2*ell+1)*z)",
        "t1=RN256(t0*P_ell)",
        "t2=RN256(ell*P_(ell-1))",
        "t3=RN256(t1-t2)",
        "P_(ell+1)=RN256(t3/(ell+1))",
      ],
      boundedExpectedBitsFixture: {
        zBits: "3fe0000000000000",
        P3Bits: "bfdc000000000000",
        P3OverZBits: "bfec000000000000",
        mpqMinusTwoThirdsAfterMpfrSetQBits: "bfe5555555555555",
        mpqFiveThirdsAfterMpfrSetQBits: "3ffaaaaaaaaaaaab",
        scientificAuthority: false,
      },
    },
    angularSynthesis: {
      productionScalarBasisOrder:
        "for_each_level_L0_L1_L2_P_(2q+1)_with_q_ascending_0_through_Ntheta(level)/2-1",
      productionPotentialBasisOrder:
        "for_each_level_L0_L1_L2_P_(2q)_with_q_ascending_0_through_Ntheta(level)/2-1",
      auditScalarBasisOrder: "P_(2q+1)_q_ascending_0_through_63",
      auditPotentialBasisOrder: "P_(2q)_q_ascending_0_through_63",
      accumulation:
        "acc=+0_then_for_q_ascending_acc=RN256(acc+RN256(a_q*P_ell))",
      productionBaseLevels:
        "each_of_L0_L1_L2_is_direct_synthesis_of_that_levels_own_accepted_postprojection_multipole_row_at_the_same_radial_index",
      projectionFromNodalValuesAllowed: false,
    },
    radialDctI: {
      sourceValues:
        "each_f_j_is_exactly_reinjected_from_its_accepted_postprojection_binary64_multipole_bits",
      evaluatorRho:
        "grid_base_and_AUDIT_use_exactly_reinjected_serialized_binary64_rho_bits;the_C1_join_uses_direct_rhoJoin256;targets_use_rhoLambda256_without_a_coordinate_binary64_barrier",
      rhoSource256Bindings: [
        {
          duty: "grid_base_and_AUDIT",
          source: "rhoEval",
          derivation:
            "mpfr_set_d_256(exact_binary64_from_the_exact_serialized_rhoBits,MPFR_RNDN)",
        },
        {
          duty: "targets",
          source: "rhoLambda256",
          derivation:
            "frozen_target_pullback_from_reinjected_rhoEval_and_reinjected_lambda_without_a_rhoLambda_binary64_barrier",
        },
        {
          duty: "C1_join",
          source: "rhoJoin256",
          derivation:
            "mpfr_set_q(destination_precision_256,GMP_mpq(exact_32,exact_33),MPFR_RNDN)_without_get_d_or_set_d",
        },
      ],
      anyOtherRhoSource256Allowed: false,
      xi: "twoRho=RN256(exact_2*rhoSource256);xi=RN256(1-twoRho)",
      n: "Nr-1",
      loopOrder:
        "m_outer_ascending_0_through_n_then_j_inner_ascending_1_through_n-1",
      primitiveProgram: [
        "acc=RN256(exact_1/2*f_0)",
        "angle=RN256(pi256*m)",
        "angle=RN256(angle*j)",
        "angle=RN256(angle/n)",
        "cosine=RN256(cos(angle))",
        "term=RN256(f_j*cosine)",
        "acc=RN256(acc+term)",
        "endpointSign=exact_symbolic_(-1)^m_without_transcendental_evaluation",
        "endpoint=RN256(RN256(exact_1/2*f_n)*endpointSign)",
        "acc=RN256(acc+endpoint)",
        "a_m=RN256(RN256(exact_2/n)*acc)",
        "after_all_m_halve_a_0_and_a_n_with_separate_RN256_divisions",
      ],
      boundedExpectedBitsFixture: {
        n: 3,
        inputFAscendingJBits: [
          "3fe6000000000000",
          "3fe4000000000000",
          "3fe0000000000000",
          "3fb0000000000000",
        ],
        coefficientAscendingMBits: [
          "3fe0000000000000",
          "3fd0000000000000",
          "bfc0000000000000",
          "3fb0000000000000",
        ],
        evaluationRhoBits: "3fe0000000000000",
        valueBits: "3fe4000000000000",
        derivativeXiBits: "3fb0000000000000",
        derivativeRhoBits: "bfc0000000000000",
        derivativeXBits: "bfa0000000000000",
        scientificAuthority: false,
      },
    },
    radialClenshaw: {
      loopOrder: "m_descending_n_through_1",
      primitiveProgram: [
        "b_(n+2)=+0;b_(n+1)=+0",
        "t0=RN256(2*xi)",
        "t1=RN256(t0*b_(m+1))",
        "t2=RN256(a_m+t1)",
        "b_m=RN256(t2-b_(m+2))",
        "t3=RN256(xi*b_1)",
        "value=RN256(RN256(a_0+t3)-b_2)",
      ],
    },
    radialDerivative: {
      outputCoefficientDegree: "n-1",
      coefficientRecurrence: [
        "work_d_n=+0_is_a_sentinel_only_and_is_not_an_output_coefficient",
        "d_(n-1)=RN256(RN256(exact_2*n)*a_n)",
        "for_m_descending_n-2_through_1_term=RN256(RN256(exact_2*(m+1))*a_(m+1));d_m=RN256(d_(m+2)+term)",
        "halfD2=RN256(d_2/exact_2)_or_+0_when_n-1_less_than_2",
        "d_0=RN256(a_1+halfD2)",
        "the_output_tuple_is_exactly_d_0_through_d_(n-1)",
      ],
      derivativeClenshaw: {
        degree: "n-1",
        loopOrder: "m_descending_n-1_through_1",
        primitiveProgram: [
          "db_(n+1)=+0;db_n=+0",
          "t0=RN256(exact_2*xi)",
          "t1=RN256(t0*db_(m+1))",
          "t2=RN256(d_m+t1)",
          "db_m=RN256(t2-db_(m+2))",
          "dValue=RN256(RN256(d_0+RN256(xi*db_1))-db_2)",
        ],
      },
      joinRhoSourceAndXiGraph: [
        "rhoJoinMpq=GMP_mpq(exact_32,exact_33)",
        "rhoJoin256=mpfr_set_q(destination_precision_256,rhoJoinMpq,MPFR_RNDN)",
        "twoRhoJoin=RN256(exact_2*rhoJoin256)",
        "xiJoin=RN256(1-twoRhoJoin)",
        "all_L2_join_value_and_derivative_Clenshaw_calls_use_xiJoin",
        "no_mpfr_get_d_or_mpfr_set_d_occurs_in_the_C1_join_coordinate_graph",
      ],
      coordinateConversion: [
        "d_rho=RN256(exact_-2*d_xi)",
        "oneMinusRho=RN256(1-rhoSource256)",
        "d_x=RN256(RN256(oneMinusRho*oneMinusRho)*d_rho)",
        "rhoSource256_is_rhoJoin256_for_C1_boundary_lifts_and_the_exact_declared_evaluation_coordinate_otherwise",
      ],
    },
    analyticTail: {
      xDomain: "x>32",
      envelopeProgram: [
        "logX=RN256(log(x))",
        "pLogX=RN256(p*logX)",
        "minusX=RN256(-x)",
        "exponentArgument=RN256(minusX+pLogX)",
        "envelope=RN256(exp(exponentArgument))",
        "s=RN256(exact_32/x)",
      ],
      c1BoundaryLiftModalProgram: {
        initialization: [
          "for_q_ascending_0_through_63_initialize_hJ_q=+0_hSJ_q=+0_qJ_q=+0_qSJ_q=+0",
          "populate_hJ_and_hSJ_only_for_q_ascending_0_through_31_from_the_odd_to_even_connection",
          "populate_qJ_and_qSJ_only_for_q_ascending_0_through_31_from_the_L2_even_modes",
          "q_32_through_63_remain_exact_symbolic_+0_in_all_four_boundary_lift_vectors",
          "tail_coefficient_corrections_never_modify_boundary_lift_vectors_and_enter_only_multiplied_by_oneMinusSSquared",
        ],
        scalar: [
          "at_the_joinRhoSourceAndXiGraph_xiJoin_evaluate_each_L2_odd_radial_mode_u_r_and_dUdx_r_by_the_frozen_DCT-I_Clenshaw_graph_while_tail_formula_constants_use_exact_x=32",
          "joinEnvelope=RN256(exp(RN256(exact_-32+RN256(p*RN256(log(exact_32))))))",
          "g_r=RN256(u_r/joinEnvelope)",
          "gX_r=RN256(dUdx_r/joinEnvelope)",
          "for_each_r_q_connection_coefficient_sourceMpq=GMP_mpq(fixture_numerator,fixture_denominator);coefficient256=mpfr_set_q(destination_precision_256,sourceMpq,MPFR_RNDN)",
          "hJ_q=accumulate_r_ascending_q_through_31_RN256(acc+RN256(g_r*coefficient256))_from_+0",
          "hSJSource_r=RN256(RN256(RN256(p-exact_32)*g_r)-RN256(exact_32*gX_r))",
          "hSJ_q=accumulate_r_ascending_q_through_31_RN256(acc+RN256(hSJSource_r*coefficient256))_from_+0",
        ],
        potential: [
          "at_the_joinRhoSourceAndXiGraph_xiJoin_evaluate_each_L2_even_radial_mode_V_q_and_dVdx_q_by_the_frozen_DCT-I_Clenshaw_graph_while_tail_formula_constants_use_exact_x=32",
          "for_q_ascending_0_through_31_compute_qJ_q_and_qSJ_q_while_q_32_through_63_remain_the_initialized_symbolic_+0",
          "joinMonopole_q=0_is_RN256(C/exact_32)_and_is_+0_for_q>0",
          "qJ_q=RN256(exact_32768*RN256(V_q+joinMonopole_q))",
          "t0=RN256(exact_32768*dVdx_q)",
          "t1=RN256(exact_3072*V_q)",
          "t2_q=0_is_RN256(exact_64*C)_and_is_+0_for_q>0",
          "qX_q=RN256(RN256(t0+t1)+t2_q)",
          "qSJ_q=RN256(exact_-32*qX_q)",
        ],
        exactJoinDuty:
          "these_modal_H_J_H_sJ_Q_J_Q_sJ_values_are_the_only_boundary_lifts",
        boundedExpectedBitsMicrofixture: {
          provenance:
            "frozen_nonphysical_spec_literals_only_not_evidence_of_MPFR_execution_or_runtime_conformance",
          HJ: [
            { q: 0, exact: "-2/3", bits: "bfe5555555555555" },
            { q: 1, exact: "5/3", bits: "3ffaaaaaaaaaaaab" },
          ],
          HSJ: [
            { q: 0, exact: "64/3", bits: "4035555555555555" },
            { q: 1, exact: "-160/3", bits: "c04aaaaaaaaaaaab" },
          ],
          QJ: [{ q: 0, exact: "2048", bits: "40a0000000000000" }],
          QSJ: [{ q: 0, exact: "-2048", bits: "c0a0000000000000" }],
          expMinus64Bits: "3a2969d47321e4cc",
          unlistedModalValues: {
            HJ: "q_2_through_63_are_exact_+0",
            HSJ: "q_2_through_63_are_exact_+0",
            QJ: "q_1_through_63_are_exact_+0",
            QSJ: "q_1_through_63_are_exact_+0",
            bits: "0000000000000000",
          },
          scientificAuthority: false,
          runtimeConformanceAuthority: false,
        },
      },
      correctionModalHorner:
        "for_each_q_ascending_0_through_63_acc=+0_then_for_n_descending_16_through_0_acc=RN256(c_(n,q)+RN256(s*acc));the_outputs_are_scalarCorrection_q_and_potentialCorrection_q_without_angular_synthesis",
      c1LiftedEvenModalProgram: [
        "sMinusOne=RN256(s-1)",
        "oneMinusS=RN256(1-s)",
        "oneMinusSSquared=RN256(oneMinusS*oneMinusS)",
        "for_q_ascending_0_through_63_hLinear_q=RN256(hJ_q+RN256(sMinusOne*hSJ_q))",
        "H_q=RN256(hLinear_q+RN256(oneMinusSSquared*scalarCorrection_q))",
        "for_q_ascending_0_through_63_qLinear_q=RN256(qJ_q+RN256(sMinusOne*qSJ_q))",
        "Q_q=RN256(qLinear_q+RN256(oneMinusSSquared*potentialCorrection_q))",
      ],
      tailMultipoleProgram: {
        scalarOdd: [
          "define_H_64=+0",
          "for_r_ascending_0_through_63_alphaMpq=GMP_mpq(2*r+1,4*r+1)_and_betaNextMpq=GMP_mpq(2*r+2,4*r+5)",
          "alpha256=mpfr_set_q(destination_precision_256,alphaMpq,MPFR_RNDN);betaNext256=mpfr_set_q(destination_precision_256,betaNextMpq,MPFR_RNDN)",
          "alphaTerm=RN256(alpha256*H_r)",
          "betaTerm=RN256(betaNext256*H_(r+1))",
          "modalBracket=RN256(alphaTerm+betaTerm)",
          "u_r=RN256(envelope*modalBracket)",
        ],
        potentialEven: [
          "inverseX=RN256(1/x)",
          "inverseX2=RN256(inverseX*inverseX)",
          "inverseX3=RN256(inverseX2*inverseX)",
          "coulomb=RN256(RN256(-C)*inverseX)",
          "for_q_ascending_0_through_63_qTerm=RN256(Q_q*inverseX3)",
          "V_0=RN256(coulomb+qTerm_for_q_0)",
          "for_q_ascending_1_through_63_V_q=qTerm",
        ],
        loopAndSerializationOrder:
          "scalar_r_ascending_0_through_63_then_potential_q_ascending_0_through_63_with_each_mode_serialized_only_at_the_named_final_array_barrier",
      },
      scalarOddConnection:
        "use_authoritative_exact_rational_P_(2r+1)_over_z_to_P_(2q)_fixture",
      potentialEvenConnection: "direct_even_Legendre_normalization_P_(2q)(1)=1",
      zTimesEvenConnection:
        "z*P_(2r)=((2r+1)/(4r+1))*P_(2r+1)+(2r/(4r+1))*P_(2r-1)_with_second_term_omitted_at_r=0",
      rationalOperationsUseExactMpqSourceThenRoundedMpfrSetQ: true,
      rationalOperationsClaimExactMpfrValue: false,
      boundedExpectedBitsFixture: {
        scalar: {
          H0Bits: "3ff0000000000000",
          H1Bits: "3fe0000000000000",
          unlistedHqPositiveZero: {
            qMinimumInclusive: 2,
            qMaximumInclusive: 64,
            bits: "0000000000000000",
          },
          envelopeBits: "3fd0000000000000",
          u0Bits: "3fd3333333333333",
          u1Bits: "3fb3333333333333",
        },
        potential: {
          xBits: "4050000000000000",
          CBits: "4010000000000000",
          Q0Bits: "40d0000000000000",
          Q1Bits: "c0c0000000000000",
          V0Bits: "0000000000000000",
          V1Bits: "bfa0000000000000",
        },
        scientificAuthority: false,
      },
    },
    audit: {
      split: "x<=32_interior_and_x>32_analytic_tail",
      radialRowPartition: {
        interiorAndPadding: "j_ascending_0_through_226_inclusive",
        analyticTail: "j_ascending_227_through_254_inclusive",
        symbolicInfinity: "j_exactly_255",
        exhaustiveAndDisjoint: true,
      },
      interiorMultipoles:
        "DCT-I_then_Clenshaw_evaluate_the_32_accepted_L2_radial_modes_q=0_through_31_then_pad_q=32_through_63_with_canonical_+0",
      tailMultipoles:
        "evaluate_H_and_Q_even_modal_lifts_and_corrections_then_map_z_times_even_H_to_odd_modes_by_the_frozen_two-term_connection_add_the_fixed_-C/x_only_to_potential_q=0_and_serialize_q=0_through_63_without_angular_quadrature",
      baseNodalArrays:
        "for_each_unmasked_AUDIT_rho_row_generate_the_canonical_64_scalar_and_64_potential_AUDIT_multipoles_first_then_obtain_base_scalar_u0_and_base_potential_V0_only_by_the_frozen_64_mode_angular_synthesis_from_that_same_row",
      baseNodalMayCallPiecewiseContinuumPointEvaluator: false,
      targetNodalDuty:
        "AUDIT_target_arrays_are_direct_scaled_piecewise_continuum_point_evaluations_and_are_not_synthesized_from_the_unscaled_AUDIT_base_multipole_arrays",
      infinity: "all_prescribed_values_are_symbolic_canonical_+0",
      angularQuadratureAllowed: false,
    },
    namedPiecewiseContinuumPointEvaluator: {
      name: "evaluatePiecewiseL2HqContinuumAtPulledRhoAndZ",
      inputCoordinateDuty:
        "evaluationRho_is_either_exact_reinjected_serialized_rhoEval_for_direct_base_calls_or_rhoLambda256_derived_only_from_reinjected_rhoEval_for_target_calls;zEval_is_exactly_reinjected_from_serialized_analytic_z_bits",
      precondition:
        "the_structural_symbolic_mask_barrier_has_already_returned_for_every_masked_endpoint",
      coordinateProgram: [
        "oneMinusEvaluationRho=RN256(1-evaluationRho)",
        "xEvaluation=RN256(evaluationRho/oneMinusEvaluationRho)",
        "if_xEvaluation<=exact_32_including_equality_use_L2_DCT-I_Clenshaw_modes_q_0_through_31",
        "if_xEvaluation>exact_32_use_the_exact_analyticTail.tailMultipoleProgram",
        "synthesize_the_selected_scalar_odd_and_potential_even_modes_at_zEval_in_q_ascending_order",
      ],
      interpolationAllowed: false,
      angularQuadratureAllowed: false,
    },
    targetScalingAndPullback: {
      lambdaProgram: [
        "for_amplitude_stage_ascending_0_through_6_with_exponent_k_descending_16_through_10_set_A=mpfr_set_z_2exp_256(exact_1,-k,MPFR_RNDN)_which_is_exact",
        "A_binary64_serialization_or_reinjection_is_forbidden",
        "ratio=RN256(A/A0)",
        "lambda256=RN256(sqrt(ratio))",
        "lambdaBits=mpfr_get_d(lambda256,MPFR_RNDN)_at_barrier_perTargetLambdaBits",
        "lambda=mpfr_set_d_256(exact_binary64_from_lambdaBits,MPFR_RNDN)",
        "lambda2=RN256(lambda*lambda)",
      ],
      pullbackProgram: [
        "num=RN256(lambda*rhoEval)",
        "oneMinusLambda=RN256(1-lambda)",
        "inner=RN256(oneMinusLambda*rhoEval)",
        "den=RN256(1-inner)",
        "rhoLambda256=RN256(num/den)",
        "oneMinusRhoLambda256=RN256(1-rhoLambda256)",
        "xLambda256=RN256(rhoLambda256/oneMinusRhoLambda256)",
        "branch_after_pullback_is_interior_if_xLambda256<=exact_32_including_equality_and_analytic_tail_only_if_xLambda256>exact_32",
        "continuumValue=evaluatePiecewiseL2HqContinuumAtPulledRhoAndZ(rhoLambda256,zEval)",
        "target=RN256(lambda2*continuumValue)",
      ],
      boundedExpectedBitsFixture: {
        amplitudeExact: "1/16",
        A0Bits: "3fd0000000000000",
        rhoBits: "3fe0000000000000",
        lambdaBits: "3fe0000000000000",
        rhoLambdaBits: "3fd5555555555555",
        continuumValueAtPulledPointBits: "3fe8000000000000",
        targetBits: "3fc8000000000000",
        scientificAuthority: false,
      },
      eachLevelDirectEvaluationRequired: true,
      interpolationAllowed: false,
      auditReuseAllowed: false,
    },
    symbolicPositiveZero: {
      requiredFor:
        "all_seed_v1_prescribed_boundaries_parity_masks_padded_multipole_rows_and_infinity_entries",
      underflowAcceptance:
        "only_independent_verifier_directed_interval_classification_may_accept_a_computed_underflow_as_+0",
      negativeZeroAllowed: false,
      exactPopulations: {
        allLevelsNodalProjectedEntries: 10816,
        allLevelsMultipoleProjectedEntries: 408,
        combinedProjectedEntries: 11224,
        auditBaseScalarPrescribedBoundaryEntries: 510,
        auditBaseScalarEligibleNonboundaryEntries: 32258,
        auditBaseAndSevenTargetsPrescribedBoundaryEntries: 4080,
        auditBaseAndSevenTargetsEligibleNonboundaryEntries: 258064,
        auditInteriorRadialRowsWithModePadding: 227,
        auditPaddingAssignments: 14528,
        auditPaddingFormula:
          "227_rows*(32_scalar_padded_modes+32_potential_padded_modes)=14528",
        overlapBetweenProjectedMasksAndAuditPadding: 32,
        overlapIdentity:
          "AUDIT_scalar_origin_row_q_32_through_63_is_both_a_projected_scalar_origin_mask_and_an_interior_padding_mask",
        uniqueStructuralMaskUnion: 25720,
        uniqueStructuralMaskUnionFormula: "11224+14528-32=25720",
      },
    },
  });

/** Conformance-only witness for the frozen pre-arithmetic mask short circuit. */
export const nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1ConformanceOnlySymbolicMaskBarrier =
  (
    isSymbolicallyMasked: boolean,
    evaluateUnmaskedEntry: () => string,
  ): string =>
    isSymbolicallyMasked ? "0000000000000000" : evaluateUnmaskedEntry();

/** Non-authoritative closed-surface checker for representative numeric-bit fields. */
export const nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1RepresentativeBitsViolations =
  (bits: unknown, expectedNumericBits?: string): string[] => {
    if (typeof bits !== "string" || !/^[0-9a-f]{16}$/.test(bits)) {
      return ["representative_bits_not_exact_16_lowercase_hex"];
    }
    const numericBits = BigInt(`0x${bits}`);
    if (((numericBits >> 52n) & 0x7ffn) === 0x7ffn) {
      return ["representative_bits_nonfinite"];
    }
    if (numericBits === 0x8000000000000000n) {
      return ["representative_bits_negative_zero"];
    }
    if (expectedNumericBits !== undefined && bits !== expectedNumericBits) {
      const reversed = bits.match(/../g)?.reverse().join("");
      return [
        reversed === expectedNumericBits
          ? "representative_bits_byte_reversed_raw_f64le_confusion"
          : "representative_bits_expected_numeric_pattern_mismatch",
      ];
    }
    return [];
  };

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-selection-dag/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_EXPECTED_SHA256 =
  "3174e8ce18a1e254417babfab3f28951309fd02d106abe19d7993c6663b3f8f6" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_EXPECTED_CANONICAL_SIZE_BYTES =
  58130 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_selection_dag_v1_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING =
  Object.freeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.numeric_materialization_selection_dag",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_selection_dag/v1",
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_CANONICAL_SIZE_BYTES,
  });

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-representative-tuple-schema/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_EXPECTED_SHA256 =
  "f8bed90558b5a4ab5d3edbc170a35d0c55f0edf232fb09e0223b13bd45cfad98" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES =
  2801 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_tuple_schema_v1_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING =
  Object.freeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_tuple_schema",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_tuple_schema/v1",
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_CANONICAL_SIZE_BYTES,
  });

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-operation-graph/mpfr256-rndn-v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_EXPECTED_SHA256 =
  "a4383a581779f90736588de253e2148c392156f001636a2b994e8eb0c905c835" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_EXPECTED_CANONICAL_SIZE_BYTES =
  39345 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_numeric_operation_graph_v1_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING =
  Object.freeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.numeric_operation_graph",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_operation_graph/mpfr256_rndn_v1",
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_CANONICAL_SIZE_BYTES,
  });

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-representative-input-fixture/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_EXPECTED_SHA256 =
  "07be01c97f3ce0b20b4b9e31a236993b3e9638f75bcbdcbaf5065badf906c756" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_EXPECTED_CANONICAL_SIZE_BYTES =
  90355 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_input_fixture_v1_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_BINDING =
  Object.freeze({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.numeric_representative_input_fixture",
    contractVersion:
      "nhm2_prolate_boson_star_newtonian_seed_numeric_representative_input_fixture/v1",
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_CANONICAL_SIZE_BYTES,
  });

const CLAIM_LOCKS = Object.freeze({
  producerRepresentativeAuthority: false,
  materializerProofAuthority: false,
  policyProofAuthority: false,
  policyGateAuthority: false,
  policyArtifactAuthority: false,
  policyPhysicalAuthority: false,
  operationGraphConformanceAuthority: false,
  sharedImplementationAuthority: false,
  toleranceBasedAcceptanceAllowed: false,
  proofKernelDefined: false,
  intervalKernelDefined: false,
  quadratureKernelDefined: false,
  mpfrRuntimeToolchainBound: false,
  symbolicMaskConformanceHelperAuthority: false,
  representativeBitsConformanceHelperAuthority: false,
  executionAuthorized: false,
  numericMaterializationMatchPresent: false,
  fullSeedV1AdmissionPresent: false,
  policyMayAdmitSeed: false,
  policyMayAdmitArtifact: false,
  policyMaySatisfyFullSeedGateReport: false,
  artifactAccepted: false,
  candidateAdmissible: false,
  relativisticBranchSolved: false,
  physicalViabilityEstablished: false,
  propulsionCapabilityEstablished: false,
  transportCapabilityEstablished: false,
  anySemiclassicalClaimEstablished: false,
});

const CONTRACT = {
  artifactId:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONTRACT_VERSION,
  status: "sealed_preregistration_read_only_red_team_clear",
  additiveSuccessorOnly: true,
  mutatesSeedV1: false,
  mutatesRunPlanV1: false,
  mutatesRunPlanV2: false,
  bindings: {
    seedV1: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1",
      binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    },
    proofReplayProtocolV1: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    },
    outputDescriptorSchemaV1: {
      authoritativeSingletonIdentityRequired: true,
      singletonExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA",
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    },
    seedV1DerivedHashPreimages: {
      authoritativeSingletonIdentityRequired: true,
      registryVersion:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.registryVersion,
      hashRecipe:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.hashRecipe,
      payloadRecipe:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY.payloadRecipe,
      tailCoefficientInventorySha256: TAIL_COEFFICIENT_INVENTORY_HASH_PREIMAGE,
      representativeContinuumSha256: REPRESENTATIVE_CONTINUUM_HASH_PREIMAGE,
      coverTraceSha256: COVER_TRACE_HASH_PREIMAGE,
    },
    seedV1InventorySingletons: {
      authoritativeSingletonIdentityRequired: true,
      sourceSeedBinding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
      amplitudeScheduleExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE",
      gridLevelsExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS",
      outputRolesExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES",
      outputArrayInventoryExportName:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY",
      outputArrayCount: 32,
      inventoryOrder:
        "level_L0_L1_L2_AUDIT_outer_then_the_eight_imported_output_roles_inner",
      targetArrayOrder:
        "amplitude_stage_outer_then_radial_index_then_angular_index_in_C_order",
    },
    selectionDAGV1: {
      authoritativeSingletonIdentityRequired: true,
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING,
    },
    representativeTupleSchemaV1: {
      authoritativeSingletonIdentityRequired: true,
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING,
    },
    operationGraphV1: {
      authoritativeSingletonIdentityRequired: true,
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
    },
    representativeInputFixtureV1: {
      authoritativeSingletonIdentityRequired: true,
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_BINDING,
    },
    oddLegendreQuotientConnectionFixtureV1:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1_BINDING,
  },
  interpretationBoundary: {
    closesOnly: "deterministic_numeric_materialization_semantics",
    acceptedScientificInput:
      "externally_supplied_candidate_seed_v1_postprojection_multipole_arrays_whose_admission_is_not_established_by_this_policy",
    postprojectionMeans:
      "multipole_arrays_after_the_proof_protocol_projection_and_acceptance_steps",
    externalPostprojectionAcceptancePrerequisite:
      "a_separately_bound_nodal_to_postprojection_parity_Legendre_operation_graph_and_input_acceptance_receipt",
    policyEstablishesPostprojectionInputAcceptance: false,
    nodalToMultipoleProjectionInsidePolicy: false,
    changesProofAcceptance: false,
    changesDescriptorAcceptance: false,
    suppliesMissingProofOperators: false,
  },
  chronology: {
    topology: "producer_then_independent_verifier_then_descriptor_assembler",
    producerCandidateDAGSeparatedFromVerifierAdmissibilityDAG: true,
    producerCandidateDAGMayAdmitScience: false,
    verifierAdmissibilityDAGIsOnlyScientificAdmissionDAG: false,
    policyTerminalDuty:
      "numericMaterializationMatchOrRejection_only_without_seed_or_artifact_admission_authority",
    fullSeedV1AdmissionMustBeExternal: true,
    fullSeedV1AdmissionComposition:
      "complete_seed_gate_report_plus_continuous_nodeless_receipt_plus_numerical_origin_receipt_plus_continuous_unique_peak_receipt_plus_separately_bound_nodal_to_postprojection_parity_Legendre_acceptance_receipt",
    descriptorAssemblerMayRecomputeOrOverrideScience: false,
    producerMayRunSameDeterministicSelection: true,
    producerSelectionStatus: "provisional_unserialized_no_authority",
    verifierMustRecomputeSelectionFromBoundInputs: true,
    verifierMayTrustProducerRepresentativeBytes: false,
    laterTrustedMaterializerRequired: false,
    selectionIsPureFunctionOfAcceptedL2MultipolesAndProofIntervals: true,
    auditInteriorTailReceiptIsSelectorInput: false,
    auditTraceCardinality: 524288,
    auditReceiptDuty:
      "downstream_closure_evidence_after_representative_selection_and_materialization",
  },
  selectionDAG:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG,
  representativeTupleSchema:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA,
  operationGraph:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH,
  exactRationalConnectionFixture:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1,
  conformanceFixture:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE,
  executionState: {
    executionAuthorized: false,
    mpfrRuntimeToolchainBinding: null,
    policyRuntimeObserved: false,
    producer32ArrayStagingBundleBinding: null,
    observedProducer32ArrayStagingBinding: null,
    multipolePassThroughValidationReceiptBinding: null,
    exteriorHLowerBoundEvidenceBinding: null,
    continuousNodelessProofCoreResultBinding: null,
    numericMaterializationMatchBinding: null,
    fullSeedV1AdmissionBinding: null,
    verifierNumericMaterializationReplayBundleBinding: null,
    materializationPresent: false,
    materializedArrayBinding: null,
    proofReceiptBindings: null,
    verified: false,
    descriptorAssembled: false,
    artifactAccepted: false,
  },
  blockers: [
    "representative_tuple_absent",
    "materialized_32_array_inventory_absent",
    "independent_bit_replay_absent",
    "representative_input_fixture_has_no_expected_outputs_and_no_conformance_authority",
    "full_end_to_end_tail_expected_bit_conformance_fixture_absent",
    "bounded_expected_bit_fixtures_are_frozen_literals_not_executed_MPFR_evidence",
    "typed_observed_staging_validation_exterior_H_evidence_nodeless_core_numeric_match_and_verifier_replay_runtime_bindings_absent",
    "pre_peak_continuous_nodeless_proof_core_is_not_the_final_closed_continuous_nodeless_interval_proof_receipt",
    "mpfr_gmp_binary_hash_version_abi_exponent_range_success_nonconcurrent_mutation_flag_and_gradual_underflow_runtime_binding_absent",
    "nodal_to_postprojection_parity_Legendre_operation_graph_and_input_acceptance_binding_absent",
    "external_full_seed_v1_admission_with_complete_gate_report_nodeless_origin_peak_and_nodal_to_postprojection_acceptance_receipts_absent",
    "proof_directed_interval_operators_remain_underdefined_by_seed_v1",
    "proof_root_isolation_operator_remains_underdefined_by_seed_v1",
    "proof_interval_transcendental_operator_remains_underdefined_by_seed_v1",
    "proof_quadrature_error_operator_remains_underdefined_by_seed_v1",
    "proof_kernel_binding_is_null",
    "run_plan_successor_binding_this_policy_is_absent",
  ],
  claimLockKeys: Object.keys(CLAIM_LOCKS),
  claimLocks: CLAIM_LOCKS,
} as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1 =
  deepFreeze(CONTRACT);

const assertInvariants = (): void => {
  const policy =
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;
  const singletonAnchors =
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_AUTHORITATIVE_SINGLETONS;
  const fixture =
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1;
  const scalarTail =
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE
      .representativeInputs.tailScalarCoefficientBits;
  const potentialTail =
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE
      .representativeInputs.tailPotentialCoefficientBits;
  const verifierNodes = policy.selectionDAG.verifierAdmissibilityDAG.nodes;
  const nodelessCoreOrdinal = verifierNodes.find(
    (node) => node.id === "independently_prove_continuous_nodeless_core",
  )?.ordinal;
  const peakOrdinal = verifierNodes.find(
    (node) => node.id === "independently_prove_peak_and_select_A0",
  )?.ordinal;
  const runtimeEvidenceDomains = [
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPRESENTATIVE_TUPLE_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_PRODUCER_32_ARRAY_STAGING_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_VALIDATION_RECEIPT_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXTERIOR_H_EVIDENCE_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NODELESS_PROOF_CORE_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_NUMERIC_MATCH_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VERIFIER_REPLAY_BUNDLE_SHA256_DOMAIN,
  ];
  if (
    singletonAnchors.seedV1 !== NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1 ||
    singletonAnchors.proofReplayProtocolV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL ||
    singletonAnchors.outputDescriptorSchemaV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA ||
    singletonAnchors.derivedHashRegistryV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY ||
    singletonAnchors.amplitudeScheduleV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE ||
    singletonAnchors.gridLevelsV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS ||
    singletonAnchors.outputRolesV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES ||
    singletonAnchors.outputArrayInventoryV1 !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY ||
    policy.bindings.seedV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING ||
    policy.bindings.proofReplayProtocolV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING ||
    policy.bindings.outputDescriptorSchemaV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING ||
    policy.bindings.seedV1DerivedHashPreimages
      .tailCoefficientInventorySha256 !==
      TAIL_COEFFICIENT_INVENTORY_HASH_PREIMAGE ||
    policy.bindings.seedV1DerivedHashPreimages.representativeContinuumSha256 !==
      REPRESENTATIVE_CONTINUUM_HASH_PREIMAGE ||
    policy.bindings.seedV1DerivedHashPreimages.coverTraceSha256 !==
      COVER_TRACE_HASH_PREIMAGE ||
    policy.bindings.selectionDAGV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING ||
    policy.bindings.representativeTupleSchemaV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA_BINDING ||
    policy.bindings.operationGraphV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING ||
    policy.bindings.representativeInputFixtureV1.binding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE_BINDING ||
    policy.selectionDAG !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG ||
    policy.representativeTupleSchema !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REPRESENTATIVE_TUPLE_SCHEMA ||
    policy.operationGraph !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH ||
    policy.operationGraph.outputRoleSourceTable !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OUTPUT_ROLE_SOURCE_TABLE ||
    policy.exactRationalConnectionFixture !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_ODD_LEGENDRE_QUOTIENT_CONNECTION_FIXTURE_V1 ||
    policy.conformanceFixture !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONFORMANCE_FIXTURE ||
    policy.bindings.seedV1.binding.sha256 !==
      "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea" ||
    policy.bindings.seedV1.binding.canonicalSizeBytes !== 50226 ||
    policy.bindings.proofReplayProtocolV1.binding.sha256 !==
      "c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b" ||
    policy.bindings.proofReplayProtocolV1.binding.canonicalSizeBytes !==
      46365 ||
    policy.bindings.outputDescriptorSchemaV1.binding.sha256 !==
      "deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58" ||
    policy.bindings.outputDescriptorSchemaV1.binding.canonicalSizeBytes !==
      56194 ||
    fixture.rows.length !== 32 ||
    fixture.rows.reduce((sum, row) => sum + row.coefficients.length, 0) !==
      528 ||
    fixture.rows[0].coefficients[0].numerator !== "1" ||
    fixture.rows[0].coefficients[0].denominator !== "1" ||
    fixture.rows[1].coefficients[0].numerator !== "-2" ||
    fixture.rows[1].coefficients[0].denominator !== "3" ||
    fixture.rows[1].coefficients[1].numerator !== "5" ||
    fixture.rows[1].coefficients[1].denominator !== "3" ||
    scalarTail.length !== 1088 ||
    potentialTail.length !== 1088 ||
    Object.keys(policy.operationGraph.mappedNodes.rawLittleEndianBinary64Sha256)
      .length !== 12 ||
    policy.operationGraph.outputRoleSourceTable.length !== 32 ||
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_STAGING_ENTRY_EXPECTATIONS.length !==
      32 ||
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS.length !==
      6 ||
    policy.selectionDAG.verifierAdmissibilityDAG
      .multipolePassThroughInputValidation.exactExpectedEntries !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_MULTIPOLE_PASS_THROUGH_EXPECTATIONS ||
    runtimeEvidenceDomains.some(
      (domain) => !domain.endsWith("\n") || domain.slice(0, -1).includes("\n"),
    ) ||
    new Set(runtimeEvidenceDomains).size !== runtimeEvidenceDomains.length ||
    nodelessCoreOrdinal == null ||
    peakOrdinal == null ||
    nodelessCoreOrdinal >= peakOrdinal ||
    policy.selectionDAG.verifierAdmissibilityDAG.continuousNodelessProofCore
      .requiredPassedValue !== true ||
    policy.selectionDAG.verifierAdmissibilityDAG.continuousNodelessProofCore
      .requiredFinalReceiptClosedValue !== false ||
    policy.selectionDAG.verifierAdmissibilityDAG
      .numericMaterializationMatchOrRejectionSchema.replayPublicationGuard
      .rejectionEmitsReplayBundle !== false ||
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_REJECTION_FAILURE_CODES.length !==
      14 ||
    policy.selectionDAG.descriptorAssemblerDAG.externalInputs.some((input) =>
      [
        "numericMaterializationMatchOrRejection",
        "verifierRepresentativeTuple",
        "verifierRepresentativeTupleSha256",
        "verifierRepresentativeContinuumSha256",
      ].includes(input),
    ) ||
    policy.selectionDAG.descriptorAssemblerDAG.tupleResolution
      .soleTupleBearingInput !== "verifierNumericMaterializationReplayBundle" ||
    policy.operationGraph.radialDctI.xi !==
      "twoRho=RN256(exact_2*rhoSource256);xi=RN256(1-twoRho)" ||
    policy.operationGraph.radialDctI.rhoSource256Bindings.length !== 3 ||
    policy.operationGraph.analyticTail.boundedExpectedBitsFixture.scalar
      .unlistedHqPositiveZero.qMinimumInclusive !== 2 ||
    policy.operationGraph.analyticTail.boundedExpectedBitsFixture.scalar
      .unlistedHqPositiveZero.qMaximumInclusive !== 64 ||
    !policy.selectionDAG.externalFullSeedV1AdmissionRequirements.includes(
      "separately_bound_nodal_to_postprojection_parity_Legendre_operation_graph_and_input_acceptance_receipt",
    ) ||
    !policy.selectionDAG.descriptorAssemblerDAG.externalInputs.includes(
      "verifierNumericMaterializationReplayBundle",
    ) ||
    policy.operationGraph.outputRoleSourceTable.filter(
      (row) =>
        row.sourceKind ===
        "validated_observed_postprojection_binary64_bit_passthrough",
    ).length !== 6 ||
    policy.operationGraph.symbolicPositiveZero.exactPopulations
      .auditPaddingAssignments !== 14528 ||
    policy.operationGraph.symbolicPositiveZero.exactPopulations
      .uniqueStructuralMaskUnion !== 25720 ||
    policy.operationGraph.arithmeticKernel.runtimeToolchainBinding !== null ||
    policy.operationGraph.arithmeticKernel.runtimeConformanceBindingRequirements
      .binding !== null ||
    policy.operationGraph.boundedExpectedBitFixtureStatus
      .executedAgainstBoundMpfrGmpRuntime !== false ||
    policy.conformanceFixture.operationGraphExpectedOutputs !== null ||
    policy.conformanceFixture.operationGraphConformanceAuthority !== false ||
    Object.values(policy.claimLocks).some((value) => value !== false) ||
    policy.executionState.executionAuthorized !== false ||
    policy.executionState.mpfrRuntimeToolchainBinding !== null ||
    policy.executionState.observedProducer32ArrayStagingBinding !== null ||
    policy.executionState.multipolePassThroughValidationReceiptBinding !==
      null ||
    policy.executionState.exteriorHLowerBoundEvidenceBinding !== null ||
    policy.executionState.continuousNodelessProofCoreResultBinding !== null ||
    policy.executionState.numericMaterializationMatchBinding !== null ||
    policy.executionState.verifierNumericMaterializationReplayBundleBinding !==
      null ||
    policy.executionState.materializedArrayBinding !== null ||
    policy.executionState.proofReceiptBindings !== null
  ) {
    throw new Error(
      "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_policy_v1_invariant_violation",
    );
  }
};

assertInvariants();

export type Nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1 =
  typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
type SnapshotBudget = { nodes: number; keys: number; stringCodeUnits: number };

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VALIDATION_LIMITS =
  Object.freeze({
    maximumDepth: 64,
    maximumNodes: 50_000,
    maximumKeys: 80_000,
    maximumArrayLength: 4_096,
    maximumStringCodeUnits: 262_144,
    maximumTotalStringCodeUnits: 2_000_000,
  });
const SNAPSHOT_LIMITS =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_VALIDATION_LIMITS;
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);
const invalid = (violation: string): SnapshotResult =>
  Object.freeze({ ok: false, violation });

const budgetPropertyNameCodeUnits = (
  keys: readonly string[],
  at: string,
  budget: SnapshotBudget,
): SnapshotResult | null => {
  for (const key of keys) {
    budget.stringCodeUnits += key.length;
    if (
      key.length > SNAPSHOT_LIMITS.maximumStringCodeUnits ||
      budget.stringCodeUnits > SNAPSHOT_LIMITS.maximumTotalStringCodeUnits
    ) {
      return invalid(`snapshot_property_name_string_limit:${at}`);
    }
  }
  return null;
};

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  budget: SnapshotBudget = { nodes: 0, keys: 0, stringCodeUnits: 0 },
  depth = 0,
): SnapshotResult => {
  const at = pointer || "/";
  if (depth > SNAPSHOT_LIMITS.maximumDepth)
    return invalid(`snapshot_depth_limit:${at}`);
  budget.nodes += 1;
  if (budget.nodes > SNAPSHOT_LIMITS.maximumNodes)
    return invalid(`snapshot_node_limit:${at}`);
  if (value === null || typeof value === "boolean")
    return Object.freeze({ ok: true, value });
  if (typeof value === "string") {
    budget.stringCodeUnits += value.length;
    return value.length <= SNAPSHOT_LIMITS.maximumStringCodeUnits &&
      budget.stringCodeUnits <= SNAPSHOT_LIMITS.maximumTotalStringCodeUnits
      ? Object.freeze({ ok: true, value })
      : invalid(`snapshot_string_limit:${at}`);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : invalid(`invalid_number:${at}`);
  }
  if (typeof value !== "object") return invalid(`non_json_value:${at}`);
  if (nodeUtilTypes.isProxy(value)) return invalid(`proxy_value:${at}`);
  if (ancestors.has(value)) return invalid(`cyclic_value:${at}`);
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype)
      return invalid(`non_plain_array:${at}`);
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string"))
      return invalid(`symbol_key:${at}`);
    const keyBudgetViolation = budgetPropertyNameCodeUnits(
      keys as string[],
      at,
      budget,
    );
    if (keyBudgetViolation) return keyBudgetViolation;
    budget.keys += keys.length;
    if (budget.keys > SNAPSHOT_LIMITS.maximumKeys)
      return invalid(`snapshot_key_limit:${at}`);
    const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      string,
      PropertyDescriptor
    >;
    const lengthDescriptor = descriptors.length;
    const length =
      lengthDescriptor && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > SNAPSHOT_LIMITS.maximumArrayLength
    ) {
      return invalid(`array_length:${at}`);
    }
    const expected = new Set([
      "length",
      ...Array.from({ length }, (_, index) => String(index)),
    ]);
    if (
      keys.length !== expected.size ||
      keys.some((key) => !expected.has(key as string))
    ) {
      return invalid(`array_surface:${at}`);
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return invalid(`array_entry_surface:${pointer}/${index}`);
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        budget,
        depth + 1,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype)
    return invalid(`non_plain_object:${at}`);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string"))
    return invalid(`symbol_key:${at}`);
  const keyBudgetViolation = budgetPropertyNameCodeUnits(
    keys as string[],
    at,
    budget,
  );
  if (keyBudgetViolation) return keyBudgetViolation;
  budget.keys += keys.length;
  if (budget.keys > SNAPSHOT_LIMITS.maximumKeys)
    return invalid(`snapshot_key_limit:${at}`);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key))
      return invalid(`forbidden_key:${pointer}/${key}`);
    const descriptor = descriptors[key];
    if (
      !descriptor ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return invalid(`object_property_surface:${pointer}/${key}`);
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      budget,
      depth + 1,
    );
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXPECTED_SHA256 =
  "ec9905f87b5d11c902a5b292772bdc11ec755ecd00fa08949382f42f1671652d" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  243240 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_numeric_materialization_policy_v1_literal_binding_drift",
  );
}
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CONTRACT_VERSION,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS =
  "sealed_preregistration_read_only_red_team_clear" as const;

const EXPECTED_CANONICAL_JSON =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON;

export const nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1Violations =
  (value: unknown): string[] => {
    if (
      value ===
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1
    ) {
      return [];
    }
    let snapshot: SnapshotResult;
    try {
      snapshot = snapshotPlainData(value);
    } catch {
      return ["numeric_materialization_policy_v1_plain_data_snapshot_invalid"];
    }
    if (!snapshot.ok) return [snapshot.violation];
    try {
      return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
        ? ["numeric_materialization_policy_v1_external_copy_not_authoritative"]
        : ["numeric_materialization_policy_v1_semantic_mismatch"];
    } catch {
      return ["numeric_materialization_policy_v1_plain_data_snapshot_invalid"];
    }
  };

export const isNhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1 =
  (
    value: unknown,
  ): value is Nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1 =>
    nhm2ProlateBosonStarNewtonianSeedNumericMaterializationPolicyV1Violations(
      value,
    ).length === 0;
