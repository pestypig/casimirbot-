import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION } from "./nhm2-conformally-flat-needle-connected-noise-spectral-block-diagnostic";

const EXPECTED_TWO_PARTICLE_SYMBOL_SHA256 =
  "5ce5b293559b42b26a1c71dff782aebe5b4daf88ddfcdec131101a3fc4fee57a" as const;
const EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES = 18025 as const;
const EXPECTED_SPECTRAL_BLOCK_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_spectral_block_diagnostic/v1" as const;

const symbolCanonicalBytes = Buffer.from(
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  ),
  "utf8",
);
const symbolActualSha256 = createHash("sha256")
  .update(symbolCanonicalBytes)
  .digest("hex");
const SYMBOL_CONTENT =
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content;

if (
  symbolActualSha256 !== EXPECTED_TWO_PARTICLE_SYMBOL_SHA256 ||
  symbolCanonicalBytes.byteLength !== EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256 !==
    EXPECTED_TWO_PARTICLE_SYMBOL_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES !==
    EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION !==
    EXPECTED_SPECTRAL_BLOCK_SCHEMA_VERSION ||
  SYMBOL_CONTENT.executionAdmissible !== false ||
  SYMBOL_CONTENT.spectralConvention.analyticIdentityFrozen !== true ||
  SYMBOL_CONTENT.spectralConvention.boundarySafePolynomial
    .containsDivisionByS !== false ||
  SYMBOL_CONTENT.spectralConvention.boundarySafePolynomial
    .useForNumericalBoundaryEvaluation !== true ||
  SYMBOL_CONTENT.spectralConvention.positiveFrequencyStandardLips
    .coefficientDenominatorInteger !== 480 ||
  SYMBOL_CONTENT.spectralConvention.positiveFrequencyStandardLips
    .coefficientPiPower !== 1 ||
  Object.values(SYMBOL_CONTENT.authority.locks).some(
    (value) => value !== false,
  ) ||
  Object.values(SYMBOL_CONTENT.claimLocks).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_connected_noise_spectral_moment_map_upstream_identity_or_blocked_state_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_spectral_moment_map/v1" as const;

type Exponents = readonly [number, number, number, number];
type SignTriple = readonly [1 | -1, 1 | -1, 1 | -1];

const COMPONENTS = Object.freeze([
  Object.freeze({ id: "T00" as const, a: 0, b: 0 }),
  Object.freeze({ id: "T01" as const, a: 0, b: 1 }),
  Object.freeze({ id: "T02" as const, a: 0, b: 2 }),
  Object.freeze({ id: "T03" as const, a: 0, b: 3 }),
  Object.freeze({ id: "T11" as const, a: 1, b: 1 }),
  Object.freeze({ id: "T12" as const, a: 1, b: 2 }),
  Object.freeze({ id: "T13" as const, a: 1, b: 3 }),
  Object.freeze({ id: "T22" as const, a: 2, b: 2 }),
  Object.freeze({ id: "T23" as const, a: 2, b: 3 }),
  Object.freeze({ id: "T33" as const, a: 3, b: 3 }),
] as const);
const COMPONENT_ORDER = Object.freeze(COMPONENTS.map(({ id }) => id));
const EXPECTED_COMPONENT_ORDER = Object.freeze([
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const);

if (
  SYMBOL_CONTENT.tetradComponentConvention.componentOrder.length !== 10 ||
  SYMBOL_CONTENT.tetradComponentConvention.componentOrder.some(
    (entry, index) => entry !== EXPECTED_COMPONENT_ORDER[index],
  ) ||
  COMPONENT_ORDER.some(
    (entry, index) => entry !== EXPECTED_COMPONENT_ORDER[index],
  )
) {
  throw new Error(
    "nhm2_connected_noise_spectral_moment_map_component_order_drift",
  );
}

const EVEN_MONOMIALS = Object.freeze([
  Object.freeze({
    id: "K0^4" as const,
    exponents: Object.freeze([4, 0, 0, 0] as const),
  }),
  Object.freeze({
    id: "K0^2*Kx^2" as const,
    exponents: Object.freeze([2, 2, 0, 0] as const),
  }),
  Object.freeze({
    id: "K0^2*Kx*Ky" as const,
    exponents: Object.freeze([2, 1, 1, 0] as const),
  }),
  Object.freeze({
    id: "K0^2*Kx*Kz" as const,
    exponents: Object.freeze([2, 1, 0, 1] as const),
  }),
  Object.freeze({
    id: "K0^2*Ky^2" as const,
    exponents: Object.freeze([2, 0, 2, 0] as const),
  }),
  Object.freeze({
    id: "K0^2*Ky*Kz" as const,
    exponents: Object.freeze([2, 0, 1, 1] as const),
  }),
  Object.freeze({
    id: "K0^2*Kz^2" as const,
    exponents: Object.freeze([2, 0, 0, 2] as const),
  }),
  Object.freeze({
    id: "Kx^4" as const,
    exponents: Object.freeze([0, 4, 0, 0] as const),
  }),
  Object.freeze({
    id: "Kx^3*Ky" as const,
    exponents: Object.freeze([0, 3, 1, 0] as const),
  }),
  Object.freeze({
    id: "Kx^3*Kz" as const,
    exponents: Object.freeze([0, 3, 0, 1] as const),
  }),
  Object.freeze({
    id: "Kx^2*Ky^2" as const,
    exponents: Object.freeze([0, 2, 2, 0] as const),
  }),
  Object.freeze({
    id: "Kx^2*Ky*Kz" as const,
    exponents: Object.freeze([0, 2, 1, 1] as const),
  }),
  Object.freeze({
    id: "Kx^2*Kz^2" as const,
    exponents: Object.freeze([0, 2, 0, 2] as const),
  }),
  Object.freeze({
    id: "Kx*Ky^3" as const,
    exponents: Object.freeze([0, 1, 3, 0] as const),
  }),
  Object.freeze({
    id: "Kx*Ky^2*Kz" as const,
    exponents: Object.freeze([0, 1, 2, 1] as const),
  }),
  Object.freeze({
    id: "Kx*Ky*Kz^2" as const,
    exponents: Object.freeze([0, 1, 1, 2] as const),
  }),
  Object.freeze({
    id: "Kx*Kz^3" as const,
    exponents: Object.freeze([0, 1, 0, 3] as const),
  }),
  Object.freeze({
    id: "Ky^4" as const,
    exponents: Object.freeze([0, 0, 4, 0] as const),
  }),
  Object.freeze({
    id: "Ky^3*Kz" as const,
    exponents: Object.freeze([0, 0, 3, 1] as const),
  }),
  Object.freeze({
    id: "Ky^2*Kz^2" as const,
    exponents: Object.freeze([0, 0, 2, 2] as const),
  }),
  Object.freeze({
    id: "Ky*Kz^3" as const,
    exponents: Object.freeze([0, 0, 1, 3] as const),
  }),
  Object.freeze({
    id: "Kz^4" as const,
    exponents: Object.freeze([0, 0, 0, 4] as const),
  }),
] as const);

const exponentKey = (exponents: Exponents): string => exponents.join(",");
const evenMonomialOrdinalByKey = new Map(
  EVEN_MONOMIALS.map(({ exponents }, ordinal) => [
    exponentKey(exponents),
    ordinal,
  ]),
);
if (
  evenMonomialOrdinalByKey.size !== 22 ||
  EVEN_MONOMIALS.some(
    ({ exponents }) =>
      exponents[0] % 2 !== 0 ||
      exponents.reduce<number>((sum, entry) => sum + entry, 0) !== 4,
  )
) {
  throw new Error(
    "nhm2_connected_noise_spectral_moment_map_even_monomial_order_drift",
  );
}

type IntegerPolynomial = Map<string, { exponents: Exponents; value: number }>;

const addIntegerTerm = (
  polynomial: IntegerPolynomial,
  exponents: Exponents,
  value: number,
): void => {
  if (!Number.isSafeInteger(value)) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_noninteger_derivation",
    );
  }
  if (value === 0) return;
  const key = exponentKey(exponents);
  const next = (polynomial.get(key)?.value ?? 0) + value;
  if (!Number.isSafeInteger(next)) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_integer_derivation_overflow",
    );
  }
  if (next === 0) polynomial.delete(key);
  else polynomial.set(key, { exponents, value: next });
};

const scaleAndAddIntegerPolynomial = (
  target: IntegerPolynomial,
  source: IntegerPolynomial,
  scale: number,
): void => {
  if (!Number.isSafeInteger(scale)) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_noninteger_scale",
    );
  }
  for (const { exponents, value } of source.values()) {
    addIntegerTerm(target, exponents, value * scale);
  }
};

const multiplyIntegerPolynomials = (
  left: IntegerPolynomial,
  right: IntegerPolynomial,
): IntegerPolynomial => {
  const product: IntegerPolynomial = new Map();
  for (const leftTerm of left.values()) {
    for (const rightTerm of right.values()) {
      const exponents = leftTerm.exponents.map(
        (entry, index) => entry + rightTerm.exponents[index],
      ) as unknown as Exponents;
      addIntegerTerm(product, exponents, leftTerm.value * rightTerm.value);
    }
  }
  return product;
};

const ETA_DIAGONAL = [-1, 1, 1, 1] as const;
const K_LOWER_SIGNS = [-1, 1, 1, 1] as const;
const S_TERMS = Object.freeze([
  Object.freeze({ exponents: [2, 0, 0, 0] as const, value: 1 }),
  Object.freeze({ exponents: [0, 2, 0, 0] as const, value: -1 }),
  Object.freeze({ exponents: [0, 0, 2, 0] as const, value: -1 }),
  Object.freeze({ exponents: [0, 0, 0, 2] as const, value: -1 }),
] as const);

const bPolynomial = (a: number, b: number): IntegerPolynomial => {
  const polynomial: IntegerPolynomial = new Map();
  if (a === b) {
    for (const term of S_TERMS) {
      addIntegerTerm(polynomial, term.exponents, ETA_DIAGONAL[a] * term.value);
    }
  }
  const exponents = [0, 0, 0, 0];
  exponents[a] += 1;
  exponents[b] += 1;
  addIntegerTerm(
    polynomial,
    exponents as unknown as Exponents,
    K_LOWER_SIGNS[a] * K_LOWER_SIGNS[b],
  );
  return polynomial;
};

const B_POLYNOMIALS = Array.from({ length: 4 }, (_, a) =>
  Array.from({ length: 4 }, (_, b) => bPolynomial(a, b)),
);
const COMMON_RATIONAL_DENOMINATOR = 6 as const;

const sixTimesS2PiPolynomial = (
  a: number,
  b: number,
  c: number,
  d: number,
): IntegerPolynomial => {
  // 6*s^2*Pi_abcd = 3*(B_ac*B_bd+B_ad*B_bc)-2*B_ab*B_cd.
  // Every operation above is integer addition/multiplication; no sampled or
  // floating coefficient enters this derivation.
  const result: IntegerPolynomial = new Map();
  scaleAndAddIntegerPolynomial(
    result,
    multiplyIntegerPolynomials(B_POLYNOMIALS[a][c], B_POLYNOMIALS[b][d]),
    3,
  );
  scaleAndAddIntegerPolynomial(
    result,
    multiplyIntegerPolynomials(B_POLYNOMIALS[a][d], B_POLYNOMIALS[b][c]),
    3,
  );
  scaleAndAddIntegerPolynomial(
    result,
    multiplyIntegerPolynomials(B_POLYNOMIALS[a][b], B_POLYNOMIALS[c][d]),
    -2,
  );
  return result;
};

const componentReflectionSign = (a: number, b: number, axis: number): 1 | -1 =>
  ((a === axis ? -1 : 1) * (b === axis ? -1 : 1)) as 1 | -1;
const multiplySigns = (left: 1 | -1, right: 1 | -1): 1 | -1 =>
  (left * right) as 1 | -1;
const componentReflectionSignatures = Object.freeze(
  COMPONENTS.map(({ a, b }) =>
    Object.freeze([
      componentReflectionSign(a, b, 1),
      componentReflectionSign(a, b, 2),
      componentReflectionSign(a, b, 3),
    ] as SignTriple),
  ),
);
const pairReflectionSignatures = Object.freeze(
  COMPONENTS.flatMap((_, leftOrdinal) =>
    COMPONENTS.map((__, rightOrdinal) =>
      Object.freeze([
        multiplySigns(
          componentReflectionSignatures[leftOrdinal][0],
          componentReflectionSignatures[rightOrdinal][0],
        ),
        multiplySigns(
          componentReflectionSignatures[leftOrdinal][1],
          componentReflectionSignatures[rightOrdinal][1],
        ),
        multiplySigns(
          componentReflectionSignatures[leftOrdinal][2],
          componentReflectionSignatures[rightOrdinal][2],
        ),
      ] as SignTriple),
    ),
  ),
);

const fullPolynomials = COMPONENTS.flatMap(({ a, b }) =>
  COMPONENTS.map(({ a: c, b: d }) => sixTimesS2PiPolynomial(a, b, c, d)),
);
const pointwiseQuarticMonomialKeys = new Set(
  fullPolynomials.flatMap((polynomial) => [...polynomial.keys()]),
);
if (
  fullPolynomials.length !== 100 ||
  fullPolynomials.some((polynomial) => polynomial.size === 0) ||
  pointwiseQuarticMonomialKeys.size !== 35
) {
  throw new Error(
    "nhm2_connected_noise_spectral_moment_map_pointwise_polynomial_count_drift",
  );
}
const parityProjectedZeroPairOrdinals: number[] = [];
const numeratorRows: number[][] = [];

for (let pairOrdinal = 0; pairOrdinal < 100; pairOrdinal += 1) {
  const polynomial = fullPolynomials[pairOrdinal];
  const energyParities = new Set<number>();
  for (const { exponents } of polynomial.values()) {
    if (exponents.reduce((sum, entry) => sum + entry, 0) !== 4) {
      throw new Error(
        "nhm2_connected_noise_spectral_moment_map_nonquartic_term_drift",
      );
    }
    energyParities.add(exponents[0] % 2);
  }
  if (energyParities.size !== 1) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_mixed_parity_pair_drift",
    );
  }
  const energyParity = [...energyParities][0];
  const simultaneousSpatialInversionSignature =
    pairReflectionSignatures[pairOrdinal][0] *
    pairReflectionSignatures[pairOrdinal][1] *
    pairReflectionSignatures[pairOrdinal][2];
  if (simultaneousSpatialInversionSignature !== (energyParity === 0 ? 1 : -1)) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_parity_signature_drift",
    );
  }

  const row = Array.from({ length: EVEN_MONOMIALS.length }, () => 0);
  if (energyParity === 1) {
    parityProjectedZeroPairOrdinals.push(pairOrdinal);
  } else {
    for (const { exponents, value } of polynomial.values()) {
      const monomialOrdinal = evenMonomialOrdinalByKey.get(
        exponentKey(exponents),
      );
      if (monomialOrdinal == null) {
        throw new Error(
          "nhm2_connected_noise_spectral_moment_map_even_monomial_basis_incomplete",
        );
      }
      row[monomialOrdinal] = value;
    }
  }
  numeratorRows.push(row);
}

const exchangeComponentPairOrdinals = Object.freeze(
  Array.from(
    { length: 100 },
    (_, ordinal) => (ordinal % 10) * 10 + Math.floor(ordinal / 10),
  ),
);
const parityAdmittedUpperPairOrdinals = Object.freeze(
  Array.from({ length: 100 }, (_, ordinal) => ordinal).filter(
    (ordinal) =>
      Math.floor(ordinal / 10) <= ordinal % 10 &&
      !parityProjectedZeroPairOrdinals.includes(ordinal),
  ),
);

const swapYzTensorIndex = (index: number): number =>
  index === 2 ? 3 : index === 3 ? 2 : index;
const yzExchangeComponentOrdinals = Object.freeze(
  COMPONENTS.map(({ a, b }) => {
    const swapped = [swapYzTensorIndex(a), swapYzTensorIndex(b)].sort(
      (left, right) => left - right,
    );
    const ordinal = COMPONENTS.findIndex(
      (candidate) => candidate.a === swapped[0] && candidate.b === swapped[1],
    );
    if (ordinal < 0) {
      throw new Error(
        "nhm2_connected_noise_spectral_moment_map_yz_component_mapping_incomplete",
      );
    }
    return ordinal;
  }),
);
const yzExchangeComponentPairOrdinals = Object.freeze(
  Array.from({ length: 100 }, (_, ordinal) => {
    const left = Math.floor(ordinal / 10);
    const right = ordinal % 10;
    return (
      yzExchangeComponentOrdinals[left] * 10 +
      yzExchangeComponentOrdinals[right]
    );
  }),
);
const yzExchangeMonomialOrdinals = Object.freeze(
  EVEN_MONOMIALS.map(({ exponents }) => {
    const swapped: Exponents = [
      exponents[0],
      exponents[1],
      exponents[3],
      exponents[2],
    ];
    const ordinal = evenMonomialOrdinalByKey.get(exponentKey(swapped));
    if (ordinal == null) {
      throw new Error(
        "nhm2_connected_noise_spectral_moment_map_yz_monomial_mapping_incomplete",
      );
    }
    return ordinal;
  }),
);

if (
  parityProjectedZeroPairOrdinals.length !== 42 ||
  parityAdmittedUpperPairOrdinals.length !== 34 ||
  numeratorRows.length !== 100 ||
  numeratorRows.some(
    (row) =>
      row.length !== 22 ||
      row.some((coefficient) => !Number.isSafeInteger(coefficient)),
  )
) {
  throw new Error(
    "nhm2_connected_noise_spectral_moment_map_count_or_integer_drift",
  );
}

for (let pairOrdinal = 0; pairOrdinal < 100; pairOrdinal += 1) {
  const exchanged = exchangeComponentPairOrdinals[pairOrdinal];
  if (
    numeratorRows[pairOrdinal].some(
      (coefficient, monomialOrdinal) =>
        coefficient !== numeratorRows[exchanged][monomialOrdinal],
    )
  ) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_pair_exchange_drift",
    );
  }
  const yzPair = yzExchangeComponentPairOrdinals[pairOrdinal];
  if (
    numeratorRows[pairOrdinal].some(
      (coefficient, monomialOrdinal) =>
        coefficient !==
        numeratorRows[yzPair][yzExchangeMonomialOrdinals[monomialOrdinal]],
    )
  ) {
    throw new Error(
      "nhm2_connected_noise_spectral_moment_map_yz_exchange_drift",
    );
  }
  for (let monomialOrdinal = 0; monomialOrdinal < 22; monomialOrdinal += 1) {
    if (numeratorRows[pairOrdinal][monomialOrdinal] === 0) continue;
    const exponents = EVEN_MONOMIALS[monomialOrdinal].exponents;
    for (let axis = 0; axis < 3; axis += 1) {
      const monomialSign = exponents[axis + 1] % 2 === 0 ? 1 : -1;
      if (monomialSign !== pairReflectionSignatures[pairOrdinal][axis]) {
        throw new Error(
          "nhm2_connected_noise_spectral_moment_map_reflection_signature_drift",
        );
      }
    }
  }
}

const frozenNumeratorRows = Object.freeze(
  numeratorRows.map((row) => Object.freeze([...row])),
);
const frozenParityProjectedZeroPairOrdinals = Object.freeze([
  ...parityProjectedZeroPairOrdinals,
]);
const MOMENT_MAP_CANONICAL_PAYLOAD = Object.freeze({
  schemaVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SCHEMA_VERSION,
  componentOrder: COMPONENT_ORDER,
  monomialExponents: Object.freeze(
    EVEN_MONOMIALS.map(({ exponents }) => exponents),
  ),
  commonDenominator: COMMON_RATIONAL_DENOMINATOR,
  numeratorRows: frozenNumeratorRows,
  parityProjectedZeroPairOrdinals: frozenParityProjectedZeroPairOrdinals,
  parityAdmittedUpperPairOrdinals,
  pairReflectionSignatures,
  exchangeComponentPairOrdinals,
  yzExchangeComponentOrdinals,
  yzExchangeComponentPairOrdinals,
  yzExchangeMonomialOrdinals,
  scatter: Object.freeze({
    targetShape: Object.freeze([64, 64, 100] as const),
    sampleCount: 64 as const,
    componentPairCount: 100 as const,
    targetElementCount: 409_600 as const,
    flatIndexFormula:
      "((leftSampleOrdinal*64+rightSampleOrdinal)*100)+componentPairOrdinal" as const,
    pairExchangeUsesComponentPairOrdinals: exchangeComponentPairOrdinals,
  }),
});
const momentMapCanonicalBytes = Buffer.from(
  JSON.stringify(MOMENT_MAP_CANONICAL_PAYLOAD),
  "utf8",
);
const momentMapActualSha256 = createHash("sha256")
  .update(momentMapCanonicalBytes)
  .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256 =
  "4a09a273d759851979b6b7ef7a1f381d19dec82474e4fc5088cbdf87ac086fff" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES =
  7738 as const;
const EXPECTED_MOMENT_MAP_SHA256 =
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SHA256;
const EXPECTED_MOMENT_MAP_SIZE_BYTES =
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SIZE_BYTES;

if (
  momentMapActualSha256 !== EXPECTED_MOMENT_MAP_SHA256 ||
  momentMapCanonicalBytes.byteLength !== EXPECTED_MOMENT_MAP_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_spectral_moment_map_literal_pin_mismatch",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_WORKER_DESCRIPTOR =
  MOMENT_MAP_CANONICAL_PAYLOAD;

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMapJson =
  (): string => JSON.stringify(MOMENT_MAP_CANONICAL_PAYLOAD);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP =
  Object.freeze({
    schemaVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SCHEMA_VERSION,
    status: "exact_rational_parity_projected_map_diagnostic_only" as const,
    diagnosticOnly: true as const,
    upstreamBindings: Object.freeze({
      twoParticleSymbol: Object.freeze({
        artifactId:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
        contractVersion:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
        canonicalSha256: EXPECTED_TWO_PARTICLE_SYMBOL_SHA256,
        canonicalSizeBytes: EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
        exactIdentityVerifiedAtModuleInitialization: true as const,
        semanticSubstitutionAllowed: false as const,
      }),
      spectralBlockDiagnostic: Object.freeze({
        schemaVersion: EXPECTED_SPECTRAL_BLOCK_SCHEMA_VERSION,
        exactSchemaVerifiedAtModuleInitialization: true as const,
        implementationSourceBytesPinned: false as const,
        semanticSubstitutionAllowed: false as const,
      }),
    }),
    exactIdentity: Object.freeze({
      canonicalization: "JSON.stringify_of_frozen_ordered_payload_v1" as const,
      canonicalSha256: EXPECTED_MOMENT_MAP_SHA256,
      canonicalSizeBytes: EXPECTED_MOMENT_MAP_SIZE_BYTES,
      exactLiteralPinVerifiedAtModuleInitialization: true as const,
    }),
    tensorConvention: Object.freeze({
      componentOrder: COMPONENT_ORDER,
      componentPairFlattening:
        "left_component_outer_right_component_inner_row_major" as const,
      componentCount: 10 as const,
      componentPairCount: 100 as const,
      frobeniusSqrt2OffDiagonalWeightApplied: false as const,
      exchangeComponentPairOrdinals,
    }),
    exactRationalMap: Object.freeze({
      derivation: "6*s2Pi_abcd=3*(B_ac*B_bd+B_ad*B_bc)-2*B_ab*B_cd" as const,
      bDefinition: "B_ab=s*eta_ab+K_lower_a*K_lower_b" as const,
      sDefinition: "s=K0^2-Kx^2-Ky^2-Kz^2" as const,
      kLowerOrder: Object.freeze(["-K0", "Kx", "Ky", "Kz"] as const),
      coefficientDerivationArithmetic:
        "safe_integer_addition_and_multiplication_only_no_fitting" as const,
      commonDenominator: COMMON_RATIONAL_DENOMINATOR,
      positiveFrequencySpectralDensityAdditionalFactor: "1/(480*pi)" as const,
      combinedSpectralDensityDenominatorApartFromPi: 2880 as const,
      monomialOrder: EVEN_MONOMIALS,
      monomialCount: 22 as const,
      numeratorRowsInFrozenComponentPairOrder: frozenNumeratorRows,
      rowCount: 100 as const,
      denseCoefficientCount: 2200 as const,
    }),
    parityReduction: Object.freeze({
      pointwiseQuarticMonomialCountBeforeProjection: 35 as const,
      pointwiseIdenticallyZeroComponentPairCount: 0 as const,
      simultaneousSpatialInversion:
        "(Kx,Ky,Kz)->(-Kx,-Ky,-Kz)_with_K0_fixed" as const,
      exactProjection:
        "P_even[F](K)=(F(K0,Kx,Ky,Kz)+F(K0,-Kx,-Ky,-Kz))/2" as const,
      integrationJustification:
        "full_spatial_R3_domain_and_real_cosine_phase_are_invariant_under_simultaneous_spatial_inversion" as const,
      oddPairsArePointwiseZero: false as const,
      oddPairsHaveExactlyZeroFullConeIntegralUnderFrozenSymmetry: true as const,
      parityProjectedZeroPairOrdinals: frozenParityProjectedZeroPairOrdinals,
      parityProjectedZeroOrderedPairCount: 42 as const,
      parityAdmittedOrderedPairCount: 58 as const,
      parityAdmittedUpperPairOrdinals,
      parityAdmittedUpperPairCount: 34 as const,
      componentReflectionSignaturesXYZ: componentReflectionSignatures,
      componentPairReflectionSignaturesXYZ: pairReflectionSignatures,
    }),
    yzExchange: Object.freeze({
      exact: true as const,
      componentOrdinals: yzExchangeComponentOrdinals,
      componentPairOrdinals: yzExchangeComponentPairOrdinals,
      monomialOrdinals: yzExchangeMonomialOrdinals,
    }),
    intendedIntegratedMomentMeaning: Object.freeze({
      valueAtMonomialOrdinal:
        "integral_d4K_of_scalar_even_weight_times_the_frozen_quartic_monomial" as const,
      intendedUnitForD4KIntegration: "m^-8" as const,
      K0MayBeIntegratedAnalyticallyFirst: true as const,
      scalarWeightOrCubatureRuleFrozenHere: false as const,
      deterministicEnclosureProducedHere: false as const,
      absoluteUncertainty95ProducedHere: false as const,
    }),
    scatterConvention: Object.freeze({
      targetShape: Object.freeze([64, 64, 100] as const),
      targetElementCount: 409_600 as const,
      flatIndexFormula:
        "((leftSampleOrdinal*64+rightSampleOrdinal)*100)+componentPairOrdinal" as const,
      pairExchangeFlatIndexFormula:
        "((rightSampleOrdinal*64+leftSampleOrdinal)*100)+exchangeComponentPairOrdinal" as const,
      fullArrayAllocatedByThisModule: false as const,
      outputMutationPerformedByThisModule: false as const,
    }),
    unavailableOutputs: Object.freeze({
      fullConnectedNoiseKernel64x64x100: null,
      fullConnectedNoiseAbsoluteUncertainty95_64x64x100: null,
      deterministicEnclosure: null,
      absoluteUncertainty95: null,
      cubaturePolicy: null,
      primaryExecutionReceipt: null,
      independentExecutionReceipt: null,
      replayReceipt: null,
      agreementReceipt: null,
    }),
    mayFeedFixedBackgroundRun: false as const,
    executionAdmissible: false as const,
    implementationBoundary: Object.freeze({
      exactMomentMapPresent: true as const,
      binary64MapApplicationPresent: true as const,
      fullArrayBuilderPresent: false as const,
      rawOutputWriterPresent: false as const,
      receiptBuilderPresent: false as const,
      declaredLeverTensorAccepted: false as const,
      metricDemandAccepted: false as const,
      toleranceOverrideAccepted: false as const,
      workOverrideAccepted: false as const,
      authorityOverrideAccepted: false as const,
    }),
    authority: Object.freeze({
      cubatureExecutionAuthority: false as const,
      spectralDensityExecutionAuthority: false as const,
      numericalEnclosureAuthority: false as const,
      deterministicErrorAuthority: false as const,
      jointPsdAuthority: false as const,
      fixedBackgroundRunAuthority: false as const,
      executionAuthority: false as const,
      replayAuthority: false as const,
      agreementAuthority: false as const,
      lampAuthority: false as const,
      admConstraintAuthority: false as const,
      physicalClaimAuthority: false as const,
      propulsionAuthority: false as const,
      transportAuthority: false as const,
      certificateAuthority: false as const,
    }),
    claimLocks: Object.freeze({
      deterministicErrorCertified: false as const,
      jointPsdCertified: false as const,
      primaryExecutionPass: false as const,
      independentExecutionPass: false as const,
      independentAgreementPass: false as const,
      connectedNoiseDiagnosticPass: false as const,
      fixedBackgroundNoiseLamp: false as const,
      semiclassicalStressNoiseLamp: false as const,
      constraintClosureLamp: false as const,
      admConstraintClosure: false as const,
      physicalViability: false as const,
      propulsion: false as const,
      transport: false as const,
      certificateEligibility: false as const,
      certificateIssued: false as const,
    }),
  });

export type Nhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMapInput = {
  leftSampleOrdinal: number;
  rightSampleOrdinal: number;
  evenMonomialValuesInFrozenOrder: readonly number[];
};

const INPUT_LIMITS = Object.freeze({
  maximumRootOwnKeys: 3,
  maximumMomentArrayOwnKeys: 23,
  maximumMomentCount: 22,
  maximumNodes: 26,
  maximumDepth: 2,
} as const);
const EXPECTED_ROOT_KEYS = Object.freeze([
  "evenMonomialValuesInFrozenOrder",
  "leftSampleOrdinal",
  "rightSampleOrdinal",
] as const);
const EXPECTED_MOMENT_ARRAY_KEYS = Object.freeze(
  [...Array.from({ length: 22 }, (_, index) => String(index)), "length"].sort(),
);
const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const unsafeInput = (violation: string): TypeError =>
  new TypeError(
    `nhm2_connected_noise_spectral_moment_map_input_unsafe:${violation}`,
  );

const exactInput = (
  value: unknown,
): Nhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMapInput => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw unsafeInput("root_must_be_plain_object:/");
  }
  if (nodeUtilTypes.isProxy(value)) throw unsafeInput("proxy_forbidden:/");
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw unsafeInput("non_plain_object:/");
  }
  const rootOwnKeys = Reflect.ownKeys(value);
  if (rootOwnKeys.length > INPUT_LIMITS.maximumRootOwnKeys) {
    throw unsafeInput("root_own_key_limit_exceeded:/");
  }
  if (rootOwnKeys.some((key) => typeof key !== "string")) {
    throw unsafeInput("symbol_key_forbidden:/");
  }
  const rootKeys = (rootOwnKeys as string[]).sort();
  const forbiddenRootKey = rootKeys.find((key) => FORBIDDEN_DATA_KEYS.has(key));
  if (forbiddenRootKey != null) {
    throw unsafeInput(`forbidden_data_key:/${forbiddenRootKey}`);
  }
  if (
    rootKeys.length !== EXPECTED_ROOT_KEYS.length ||
    rootKeys.some((key, index) => key !== EXPECTED_ROOT_KEYS[index])
  ) {
    throw unsafeInput("root_keys_invalid:/");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of EXPECTED_ROOT_KEYS) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      throw unsafeInput(`accessor_or_hidden_property_forbidden:/${key}`);
    }
  }
  const exactSampleOrdinal = (candidate: unknown, label: string): number => {
    if (
      typeof candidate !== "number" ||
      !Number.isSafeInteger(candidate) ||
      candidate < 0 ||
      candidate >= 64
    ) {
      throw unsafeInput(`${label}_invalid`);
    }
    return candidate;
  };
  const leftSampleOrdinal = exactSampleOrdinal(
    descriptors.leftSampleOrdinal.value,
    "left_sample_ordinal",
  );
  const rightSampleOrdinal = exactSampleOrdinal(
    descriptors.rightSampleOrdinal.value,
    "right_sample_ordinal",
  );
  const moments = descriptors.evenMonomialValuesInFrozenOrder.value;
  if (moments == null || typeof moments !== "object") {
    throw unsafeInput(
      "even_monomial_values_must_be_array:/evenMonomialValuesInFrozenOrder",
    );
  }
  if (nodeUtilTypes.isProxy(moments)) {
    throw unsafeInput("proxy_forbidden:/evenMonomialValuesInFrozenOrder");
  }
  if (
    !Array.isArray(moments) ||
    Object.getPrototypeOf(moments) !== Array.prototype
  ) {
    throw unsafeInput("non_plain_array:/evenMonomialValuesInFrozenOrder");
  }
  const momentOwnKeys = Reflect.ownKeys(moments);
  if (momentOwnKeys.length > INPUT_LIMITS.maximumMomentArrayOwnKeys) {
    throw unsafeInput(
      "moment_array_own_key_limit_exceeded:/evenMonomialValuesInFrozenOrder",
    );
  }
  if (momentOwnKeys.some((key) => typeof key !== "string")) {
    throw unsafeInput("symbol_key_forbidden:/evenMonomialValuesInFrozenOrder");
  }
  const momentKeys = (momentOwnKeys as string[]).sort();
  if (
    momentKeys.length !== EXPECTED_MOMENT_ARRAY_KEYS.length ||
    momentKeys.some((key, index) => key !== EXPECTED_MOMENT_ARRAY_KEYS[index])
  ) {
    throw unsafeInput("array_keys_invalid:/evenMonomialValuesInFrozenOrder");
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(moments, "length");
  if (
    lengthDescriptor == null ||
    !("value" in lengthDescriptor) ||
    lengthDescriptor.value !== INPUT_LIMITS.maximumMomentCount ||
    lengthDescriptor.enumerable !== false ||
    lengthDescriptor.configurable !== false
  ) {
    throw unsafeInput(
      "array_length_descriptor_invalid:/evenMonomialValuesInFrozenOrder",
    );
  }
  const admittedMoments: number[] = [];
  for (let index = 0; index < INPUT_LIMITS.maximumMomentCount; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(moments, String(index));
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      throw unsafeInput(
        `accessor_sparse_or_hidden_array_entry:/evenMonomialValuesInFrozenOrder/${index}`,
      );
    }
    if (
      typeof descriptor.value !== "number" ||
      !Number.isFinite(descriptor.value) ||
      Object.is(descriptor.value, -0)
    ) {
      throw unsafeInput(
        `even_monomial_value_invalid:/evenMonomialValuesInFrozenOrder/${index}`,
      );
    }
    admittedMoments.push(descriptor.value);
  }
  const admittedDepth = 2;
  const admittedNodes = 1 + 2 + 1 + admittedMoments.length;
  if (
    admittedDepth > INPUT_LIMITS.maximumDepth ||
    admittedNodes > INPUT_LIMITS.maximumNodes
  ) {
    throw unsafeInput("input_resource_limit_exceeded:/");
  }
  return {
    leftSampleOrdinal,
    rightSampleOrdinal,
    evenMonomialValuesInFrozenOrder: admittedMoments,
  };
};

const canonicalFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `nhm2_connected_noise_spectral_moment_map_nonfinite_derived_value:${label}`,
    );
  }
  return Object.is(value, -0) ? 0 : value;
};

const applyNumeratorRow = (
  row: readonly number[],
  moments: readonly number[],
  pairOrdinal: number,
): number => {
  let numerator = 0;
  for (let monomialOrdinal = 0; monomialOrdinal < 22; monomialOrdinal += 1) {
    numerator = canonicalFiniteNumber(
      numerator + row[monomialOrdinal] * moments[monomialOrdinal],
      `pair_${pairOrdinal}_numerator_after_monomial_${monomialOrdinal}`,
    );
  }
  return canonicalFiniteNumber(
    numerator / COMMON_RATIONAL_DENOMINATOR,
    `pair_${pairOrdinal}_s2Pi_value`,
  );
};

export const evaluateNhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMap =
  (unknownInput: unknown) => {
    const input = exactInput(unknownInput);
    const s2PiValues = Object.freeze(
      frozenNumeratorRows.map((row, pairOrdinal) =>
        applyNumeratorRow(
          row,
          input.evenMonomialValuesInFrozenOrder,
          pairOrdinal,
        ),
      ),
    );
    const spectralDensityValues = Object.freeze(
      s2PiValues.map((value, pairOrdinal) =>
        canonicalFiniteNumber(
          value / (480 * Math.PI),
          `pair_${pairOrdinal}_positive_frequency_spectral_density`,
        ),
      ),
    );
    const leftRightBlockStart =
      (input.leftSampleOrdinal * 64 + input.rightSampleOrdinal) * 100;
    const rightLeftBlockStart =
      (input.rightSampleOrdinal * 64 + input.leftSampleOrdinal) * 100;
    const leftRightFlatIndices = Object.freeze(
      Array.from(
        { length: 100 },
        (_, ordinal) => leftRightBlockStart + ordinal,
      ),
    );
    const rightLeftPairExchangeFlatIndices = Object.freeze(
      exchangeComponentPairOrdinals.map(
        (exchangeOrdinal) => rightLeftBlockStart + exchangeOrdinal,
      ),
    );
    if (
      leftRightFlatIndices.some(
        (index) =>
          !Number.isSafeInteger(index) || index < 0 || index >= 409_600,
      ) ||
      rightLeftPairExchangeFlatIndices.some(
        (index) =>
          !Number.isSafeInteger(index) || index < 0 || index >= 409_600,
      )
    ) {
      throw new Error(
        "nhm2_connected_noise_spectral_moment_map_scatter_index_drift",
      );
    }

    return Object.freeze({
      schemaVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP_SCHEMA_VERSION,
      status:
        "diagnostic_exact_rational_map_binary64_application_not_enclosed" as const,
      diagnosticOnly: true as const,
      input: Object.freeze({
        leftSampleOrdinal: input.leftSampleOrdinal,
        rightSampleOrdinal: input.rightSampleOrdinal,
        evenMonomialValuesInFrozenOrder: Object.freeze([
          ...input.evenMonomialValuesInFrozenOrder,
        ]),
      }),
      exactMapBinding: Object.freeze({
        canonicalSha256: EXPECTED_MOMENT_MAP_SHA256,
        canonicalSizeBytes: EXPECTED_MOMENT_MAP_SIZE_BYTES,
        exactLiteralPinVerifiedAtModuleInitialization: true as const,
        commonRationalDenominator: COMMON_RATIONAL_DENOMINATOR,
        coefficientFittingUsed: false as const,
      }),
      parityProjectedS2Pi: Object.freeze({
        valuesInFrozenComponentPairOrder: s2PiValues,
        valueUnitsInheritedFromInputMoments: true as const,
        pointwiseOddParityInformationRetained: false as const,
        intendedForFullConeEvenWeightIntegrationOnly: true as const,
      }),
      positiveFrequencySpectralDensity: Object.freeze({
        valuesInFrozenComponentPairOrder: spectralDensityValues,
        appliedAdditionalFactor: "1/(480*pi)" as const,
        arithmetic: "ieee754_binary64_not_enclosed" as const,
      }),
      parityAdmittedUpperTriangle: Object.freeze({
        componentPairOrdinals: parityAdmittedUpperPairOrdinals,
        s2PiValues: Object.freeze(
          parityAdmittedUpperPairOrdinals.map((ordinal) => s2PiValues[ordinal]),
        ),
        positiveFrequencySpectralDensityValues: Object.freeze(
          parityAdmittedUpperPairOrdinals.map(
            (ordinal) => spectralDensityValues[ordinal],
          ),
        ),
      }),
      scatterPlan: Object.freeze({
        targetShape: Object.freeze([64, 64, 100] as const),
        targetElementCount: 409_600 as const,
        leftRightBlockStart,
        rightLeftBlockStart,
        leftRightFlatIndices,
        rightLeftPairExchangeFlatIndices,
        pairExchangeIsSameBlock:
          input.leftSampleOrdinal === input.rightSampleOrdinal,
        valuesWrittenByThisFunction: false as const,
        fullTargetAllocatedByThisFunction: false as const,
      }),
      deterministicEnclosure: null,
      absoluteUncertainty95: null,
      mayFeedFixedBackgroundRun: false as const,
      executionAdmissible: false as const,
      authority:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP.authority,
      claimLocks:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_MOMENT_MAP.claimLocks,
    });
  };

export type Nhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMapResult =
  ReturnType<
    typeof evaluateNhm2ConformallyFlatNeedleConnectedNoiseSpectralMomentMap
  >;
