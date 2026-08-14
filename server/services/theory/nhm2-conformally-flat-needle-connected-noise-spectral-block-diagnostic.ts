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
import {
  evaluateNhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnostic,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_FOURIER_DIAGNOSTIC_SCHEMA_VERSION,
  type Nhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnosticResult,
} from "./nhm2-conformally-flat-needle-connected-noise-fourier-diagnostic";

const EXPECTED_TWO_PARTICLE_SYMBOL_SHA256 =
  "5ce5b293559b42b26a1c71dff782aebe5b4daf88ddfcdec131101a3fc4fee57a" as const;
const EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES = 18025 as const;
const EXPECTED_FOURIER_DIAGNOSTIC_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_fourier_diagnostic/v1" as const;
const EXPECTED_SMEARING_FOURIER_SHA256 =
  "e05e74621a1616fd7d37150f71e98632005938d42f285e30a83e760a5f1d6faf" as const;
const EXPECTED_SMEARING_FOURIER_SIZE_BYTES = 12107 as const;

const symbolCanonicalBytes = Buffer.from(
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseTwoParticleSymbolJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  ),
  "utf8",
);
const symbolActualSha256 = createHash("sha256")
  .update(symbolCanonicalBytes)
  .digest("hex");

if (
  symbolActualSha256 !== EXPECTED_TWO_PARTICLE_SYMBOL_SHA256 ||
  symbolCanonicalBytes.byteLength !== EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256 !==
    EXPECTED_TWO_PARTICLE_SYMBOL_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES !==
    EXPECTED_TWO_PARTICLE_SYMBOL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_spectral_block_diagnostic_symbol_literal_pin_mismatch",
  );
}

const SYMBOL_CONTENT =
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content;
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_FOURIER_DIAGNOSTIC_SCHEMA_VERSION !==
    EXPECTED_FOURIER_DIAGNOSTIC_SCHEMA_VERSION ||
  SYMBOL_CONTENT.executionAdmissible !== false ||
  SYMBOL_CONTENT.spectralConvention.analyticIdentityFrozen !== true ||
  SYMBOL_CONTENT.spectralConvention
    .executableDistributionalEquivalenceProofDischarged !== false ||
  SYMBOL_CONTENT.spectralConvention.positiveFrequencyStandardLips
    .coefficientDenominatorInteger !== 480 ||
  SYMBOL_CONTENT.spectralConvention.positiveFrequencyStandardLips
    .coefficientPiPower !== 1 ||
  SYMBOL_CONTENT.spectralConvention.boundarySafePolynomial
    .containsDivisionByS !== false ||
  SYMBOL_CONTENT.spectralConvention.boundarySafePolynomial
    .useForNumericalBoundaryEvaluation !== true ||
  SYMBOL_CONTENT.siRestoration.connectedCovarianceMultiplier !== "(hbar*c)^2" ||
  Object.values(SYMBOL_CONTENT.authority.locks).some(
    (value) => value !== false,
  ) ||
  Object.values(SYMBOL_CONTENT.claimLocks).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_connected_noise_spectral_block_diagnostic_upstream_identity_or_blocked_state_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_spectral_block_diagnostic/v1" as const;

type FourVector = readonly [number, number, number, number];

export type Nhm2ConformallyFlatNeedleConnectedNoiseSpectralBlockDiagnosticInput =
  {
    leftSampleOrdinal: number;
    rightSampleOrdinal: number;
    fourMomentumMInverse: FourVector;
  };

const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const INPUT_LIMITS = Object.freeze({
  maximumDepth: 2,
  maximumNodes: 8,
  maximumRootOwnKeys: 3,
  maximumMomentumArrayLength: 4,
  maximumMomentumOwnKeys: 5,
} as const);
const EXPECTED_ROOT_KEYS = Object.freeze([
  "fourMomentumMInverse",
  "leftSampleOrdinal",
  "rightSampleOrdinal",
] as const);
const EXPECTED_MOMENTUM_KEYS = Object.freeze([
  "0",
  "1",
  "2",
  "3",
  "length",
] as const);

const unsafeInput = (violation: string): TypeError =>
  new TypeError(
    `nhm2_connected_noise_spectral_block_diagnostic_input_unsafe:${violation}`,
  );

const exactEnumerableDataDescriptors = (
  value: object,
  keys: readonly string[],
  pointer: string,
): Readonly<Record<string, PropertyDescriptor & { value: unknown }>> => {
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const output: Record<string, PropertyDescriptor & { value: unknown }> = {};
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      throw unsafeInput(
        `accessor_or_hidden_property_forbidden:${pointer}/${key}`,
      );
    }
    output[key] = descriptor as PropertyDescriptor & { value: unknown };
  }
  return output;
};

const exactInput = (
  value: unknown,
): Nhm2ConformallyFlatNeedleConnectedNoiseSpectralBlockDiagnosticInput => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw unsafeInput("root_must_be_plain_object:/");
  }
  if (nodeUtilTypes.isProxy(value)) {
    throw unsafeInput("proxy_forbidden:/");
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw unsafeInput("non_plain_object:/");
  }

  // Root shape is admitted before any field descriptor value is inspected.
  // Extra subgraphs therefore cannot induce recursive traversal.
  const rootOwnKeys = Reflect.ownKeys(value);
  if (rootOwnKeys.length > INPUT_LIMITS.maximumRootOwnKeys) {
    throw unsafeInput("root_own_key_limit_exceeded:/");
  }
  if (rootOwnKeys.some((key) => typeof key !== "string")) {
    throw unsafeInput("symbol_key_forbidden:/");
  }
  const rootStringKeys = (rootOwnKeys as string[]).sort();
  const forbiddenRootKey = rootStringKeys.find((key) =>
    FORBIDDEN_DATA_KEYS.has(key),
  );
  if (forbiddenRootKey != null) {
    throw unsafeInput(`forbidden_data_key:/${forbiddenRootKey}`);
  }
  if (
    rootStringKeys.length !== EXPECTED_ROOT_KEYS.length ||
    rootStringKeys.some((key, index) => key !== EXPECTED_ROOT_KEYS[index])
  ) {
    throw unsafeInput("root_keys_invalid:/");
  }
  const rootDescriptors = exactEnumerableDataDescriptors(
    value,
    EXPECTED_ROOT_KEYS,
    "",
  );

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
    rootDescriptors.leftSampleOrdinal.value,
    "left_sample_ordinal",
  );
  const rightSampleOrdinal = exactSampleOrdinal(
    rootDescriptors.rightSampleOrdinal.value,
    "right_sample_ordinal",
  );
  const momentum = rootDescriptors.fourMomentumMInverse.value;
  if (momentum == null || typeof momentum !== "object") {
    throw unsafeInput("four_momentum_must_be_array:/fourMomentumMInverse");
  }
  if (nodeUtilTypes.isProxy(momentum)) {
    throw unsafeInput("proxy_forbidden:/fourMomentumMInverse");
  }
  if (
    !Array.isArray(momentum) ||
    Object.getPrototypeOf(momentum) !== Array.prototype
  ) {
    throw unsafeInput("non_plain_array:/fourMomentumMInverse");
  }

  const momentumOwnKeys = Reflect.ownKeys(momentum);
  if (momentumOwnKeys.length > INPUT_LIMITS.maximumMomentumOwnKeys) {
    throw unsafeInput("momentum_own_key_limit_exceeded:/fourMomentumMInverse");
  }
  if (momentumOwnKeys.some((key) => typeof key !== "string")) {
    throw unsafeInput("symbol_key_forbidden:/fourMomentumMInverse");
  }
  const momentumStringKeys = (momentumOwnKeys as string[]).sort();
  if (
    momentumStringKeys.length !== EXPECTED_MOMENTUM_KEYS.length ||
    momentumStringKeys.some(
      (key, index) => key !== EXPECTED_MOMENTUM_KEYS[index],
    )
  ) {
    throw unsafeInput("array_keys_invalid:/fourMomentumMInverse");
  }
  const lengthDescriptor = Object.getOwnPropertyDescriptor(momentum, "length");
  if (
    lengthDescriptor == null ||
    !("value" in lengthDescriptor) ||
    lengthDescriptor.value !== INPUT_LIMITS.maximumMomentumArrayLength ||
    lengthDescriptor.enumerable !== false ||
    lengthDescriptor.configurable !== false
  ) {
    throw unsafeInput("array_length_descriptor_invalid:/fourMomentumMInverse");
  }
  const momentumValues: number[] = [];
  for (
    let index = 0;
    index < INPUT_LIMITS.maximumMomentumArrayLength;
    index += 1
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(momentum, String(index));
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      throw unsafeInput(
        `accessor_sparse_or_hidden_array_entry:/fourMomentumMInverse/${index}`,
      );
    }
    const entry = descriptor.value;
    if (
      typeof entry !== "number" ||
      !Number.isFinite(entry) ||
      Object.is(entry, -0)
    ) {
      throw unsafeInput(
        `four_momentum_entry_invalid:/fourMomentumMInverse/${index}`,
      );
    }
    momentumValues.push(entry);
  }
  const admittedMaximumDepth = 2;
  if (admittedMaximumDepth > INPUT_LIMITS.maximumDepth) {
    throw unsafeInput("input_depth_limit_exceeded:/");
  }
  const admittedNodeCount = 1 + 2 + 1 + momentumValues.length;
  if (admittedNodeCount > INPUT_LIMITS.maximumNodes) {
    throw unsafeInput("input_node_limit_exceeded:/");
  }
  return {
    leftSampleOrdinal,
    rightSampleOrdinal,
    fourMomentumMInverse: momentumValues as unknown as FourVector,
  };
};

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
const EXPECTED_COMPONENT_IDS = Object.freeze([
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
  SYMBOL_CONTENT.tetradComponentConvention.componentOrder.length !==
    EXPECTED_COMPONENT_IDS.length ||
  SYMBOL_CONTENT.tetradComponentConvention.componentOrder.some(
    (entry, index) => entry !== EXPECTED_COMPONENT_IDS[index],
  ) ||
  COMPONENTS.some((entry, index) => entry.id !== EXPECTED_COMPONENT_IDS[index])
) {
  throw new Error(
    "nhm2_connected_noise_spectral_block_diagnostic_component_order_drift",
  );
}

const ETA_DIAGONAL: FourVector = [-1, 1, 1, 1];
const MAX_FOURIER_DIAGNOSTIC_CALLS = 2;
const MAX_INHERITED_FUNCTION_EVALUATIONS = 160_000;
const MAX_INHERITED_FUNCTION_EVALUATIONS_PER_CALL = 80_000;
const MAX_POLYNOMIAL_TENSOR_EVALUATIONS = 256;
const MAX_STORED_SPECTRAL_ENTRIES = 100;
const MAX_STORED_BLOCK_ENTRIES = 100;
const PLANCK_CONSTANT_J_S = 6.62607015e-34;
const SPEED_OF_LIGHT_M_PER_S = 299_792_458;
const TWO_PI = 2 * Math.PI;
const REDUCED_PLANCK_CONSTANT_J_S = PLANCK_CONSTANT_J_S / TWO_PI;
const HBAR_C_J_M = REDUCED_PLANCK_CONSTANT_J_S * SPEED_OF_LIGHT_M_PER_S;
const INVERSE_FOURIER_MEASURE_FACTOR = 1 / TWO_PI ** 4;
const SI_AND_INVERSE_FOURIER_MULTIPLIER_J2_M2 =
  HBAR_C_J_M ** 2 * INVERSE_FOURIER_MEASURE_FACTOR;
const POSITIVE_FREQUENCY_SPECTRAL_COEFFICIENT = 1 / (480 * Math.PI);

const canonicalFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `nhm2_connected_noise_spectral_block_diagnostic_nonfinite_derived_value:${label}`,
    );
  }
  return Object.is(value, -0) ? 0 : value;
};

const assertFiniteCanonicalNumericLeaves = (
  value: unknown,
  pointer = "",
): void => {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new RangeError(
        `nhm2_connected_noise_spectral_block_diagnostic_noncanonical_result_number:${pointer || "/"}`,
      );
    }
    return;
  }
  if (value == null || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assertFiniteCanonicalNumericLeaves(nested, `${pointer}/${key}`);
  }
};

const everyValueFalse = (value: Record<string, boolean>): boolean =>
  Object.values(value).every((entry) => entry === false);

const assertFourierDiagnosticBoundary = (
  result: Nhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnosticResult,
): void => {
  if (
    result.schemaVersion !== EXPECTED_FOURIER_DIAGNOSTIC_SCHEMA_VERSION ||
    result.status !== "diagnostic_binary64_not_enclosed" ||
    result.diagnosticOnly !== true ||
    result.upstreamBinding.canonicalSha256 !==
      EXPECTED_SMEARING_FOURIER_SHA256 ||
    result.upstreamBinding.canonicalSizeBytes !==
      EXPECTED_SMEARING_FOURIER_SIZE_BYTES ||
    result.upstreamBinding.exactIdentityVerifiedAtModuleInitialization !==
      true ||
    result.upstreamBinding.semanticSubstitutionAllowed !== false ||
    result.deterministicEnclosure !== null ||
    result.absoluteUncertainty95 !== null ||
    result.mayFeedFixedBackgroundRun !== false ||
    result.executionAdmissible !== false ||
    !everyValueFalse(result.authority) ||
    !everyValueFalse(result.claimLocks) ||
    result.work.maximumFunctionEvaluations !==
      MAX_INHERITED_FUNCTION_EVALUATIONS_PER_CALL ||
    result.work.functionEvaluations >
      MAX_INHERITED_FUNCTION_EVALUATIONS_PER_CALL
  ) {
    throw new Error(
      "nhm2_connected_noise_spectral_block_diagnostic_fourier_boundary_drift",
    );
  }
};

const maxCanonical = (left: number, right: number, label: string): number =>
  canonicalFiniteNumber(Math.max(left, right), label);

export const evaluateNhm2ConformallyFlatNeedleConnectedNoiseSpectralBlockDiagnostic =
  (unknownInput: unknown) => {
    const input = exactInput(unknownInput);
    const [energy, kx, ky, kz] = input.fourMomentumMInverse;
    if (!(energy > 0)) {
      throw new RangeError(
        "nhm2_connected_noise_spectral_block_diagnostic_requires_positive_K0",
      );
    }
    const energySquared = canonicalFiniteNumber(
      energy * energy,
      "energy_squared",
    );
    const spatialNormSquared = canonicalFiniteNumber(
      kx * kx + ky * ky + kz * kz,
      "spatial_norm_squared",
    );
    const s = canonicalFiniteNumber(
      energySquared - spatialNormSquared,
      "strict_timelike_invariant_s",
    );
    if (!(s > 0)) {
      throw new RangeError(
        "nhm2_connected_noise_spectral_block_diagnostic_requires_strict_future_timelike_K",
      );
    }

    const kContravariant = Object.freeze([
      ...input.fourMomentumMInverse,
    ]) as FourVector;
    const kLower = Object.freeze([
      canonicalFiniteNumber(-energy, "K_lower_0"),
      kx,
      ky,
      kz,
    ]) as FourVector;
    const bCovariant = Array.from({ length: 4 }, (_, a) =>
      Array.from({ length: 4 }, (_, b) =>
        canonicalFiniteNumber(
          (a === b ? s * ETA_DIAGONAL[a] : 0) + kLower[a] * kLower[b],
          `B_${a}${b}`,
        ),
      ),
    );

    let polynomialTensorEvaluations = 0;
    const s2Pi = Array.from({ length: 4 }, (_, a) =>
      Array.from({ length: 4 }, (_, b) =>
        Array.from({ length: 4 }, (_, c) =>
          Array.from({ length: 4 }, (_, d) => {
            polynomialTensorEvaluations += 1;
            if (
              polynomialTensorEvaluations > MAX_POLYNOMIAL_TENSOR_EVALUATIONS
            ) {
              throw new RangeError(
                "nhm2_connected_noise_spectral_block_diagnostic_polynomial_work_cap_exceeded",
              );
            }
            return canonicalFiniteNumber(
              0.5 *
                (bCovariant[a][c] * bCovariant[b][d] +
                  bCovariant[a][d] * bCovariant[b][c]) -
                (1 / 3) * bCovariant[a][b] * bCovariant[c][d],
              `s2Pi_${a}${b}${c}${d}`,
            );
          }),
        ),
      ),
    );
    if (polynomialTensorEvaluations !== MAX_POLYNOMIAL_TENSOR_EVALUATIONS) {
      throw new Error(
        "nhm2_connected_noise_spectral_block_diagnostic_polynomial_work_plan_drift",
      );
    }

    let minorLeftResidual = 0;
    let minorRightResidual = 0;
    let pairExchangeResidual = 0;
    let leftTransversalityResidual = 0;
    let rightTransversalityResidual = 0;
    let leftTraceResidual = 0;
    let rightTraceResidual = 0;
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        for (let c = 0; c < 4; c += 1) {
          for (let d = 0; d < 4; d += 1) {
            minorLeftResidual = maxCanonical(
              minorLeftResidual,
              Math.abs(s2Pi[a][b][c][d] - s2Pi[b][a][c][d]),
              "minor_left_symmetry_residual",
            );
            minorRightResidual = maxCanonical(
              minorRightResidual,
              Math.abs(s2Pi[a][b][c][d] - s2Pi[a][b][d][c]),
              "minor_right_symmetry_residual",
            );
            pairExchangeResidual = maxCanonical(
              pairExchangeResidual,
              Math.abs(s2Pi[a][b][c][d] - s2Pi[c][d][a][b]),
              "pair_exchange_symmetry_residual",
            );
          }
        }
      }
    }
    for (let b = 0; b < 4; b += 1) {
      for (let c = 0; c < 4; c += 1) {
        for (let d = 0; d < 4; d += 1) {
          let contraction = 0;
          for (let a = 0; a < 4; a += 1) {
            contraction += kContravariant[a] * s2Pi[a][b][c][d];
          }
          leftTransversalityResidual = maxCanonical(
            leftTransversalityResidual,
            Math.abs(canonicalFiniteNumber(contraction, "left_transversality")),
            "left_transversality_residual",
          );
        }
      }
    }
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        for (let d = 0; d < 4; d += 1) {
          let contraction = 0;
          for (let c = 0; c < 4; c += 1) {
            contraction += kContravariant[c] * s2Pi[a][b][c][d];
          }
          rightTransversalityResidual = maxCanonical(
            rightTransversalityResidual,
            Math.abs(
              canonicalFiniteNumber(contraction, "right_transversality"),
            ),
            "right_transversality_residual",
          );
        }
      }
    }
    for (let c = 0; c < 4; c += 1) {
      for (let d = 0; d < 4; d += 1) {
        let contraction = 0;
        for (let a = 0; a < 4; a += 1) {
          contraction += ETA_DIAGONAL[a] * s2Pi[a][a][c][d];
        }
        leftTraceResidual = maxCanonical(
          leftTraceResidual,
          Math.abs(canonicalFiniteNumber(contraction, "left_trace")),
          "left_trace_residual",
        );
      }
    }
    for (let a = 0; a < 4; a += 1) {
      for (let b = 0; b < 4; b += 1) {
        let contraction = 0;
        for (let c = 0; c < 4; c += 1) {
          contraction += ETA_DIAGONAL[c] * s2Pi[a][b][c][c];
        }
        rightTraceResidual = maxCanonical(
          rightTraceResidual,
          Math.abs(canonicalFiniteNumber(contraction, "right_trace")),
          "right_trace_residual",
        );
      }
    }

    const spectralDensityValues = Object.freeze(
      COMPONENTS.flatMap(({ a, b }) =>
        COMPONENTS.map(({ a: c, b: d }) =>
          canonicalFiniteNumber(
            s2Pi[a][b][c][d] * POSITIVE_FREQUENCY_SPECTRAL_COEFFICIENT,
            `rho_plus_${a}${b}${c}${d}`,
          ),
        ),
      ),
    );
    if (spectralDensityValues.length !== MAX_STORED_SPECTRAL_ENTRIES) {
      throw new Error(
        "nhm2_connected_noise_spectral_block_diagnostic_spectral_entry_count_drift",
      );
    }

    const leftFourier =
      evaluateNhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnostic({
        sampleOrdinal: input.leftSampleOrdinal,
        fourMomentumMInverse: input.fourMomentumMInverse,
      });
    assertFourierDiagnosticBoundary(leftFourier);
    const rightReusedLeftEvaluation =
      input.leftSampleOrdinal === input.rightSampleOrdinal;
    const rightFourier = rightReusedLeftEvaluation
      ? leftFourier
      : evaluateNhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnostic({
          sampleOrdinal: input.rightSampleOrdinal,
          fourMomentumMInverse: input.fourMomentumMInverse,
        });
    assertFourierDiagnosticBoundary(rightFourier);
    const fourierDiagnosticCalls = rightReusedLeftEvaluation ? 1 : 2;
    if (fourierDiagnosticCalls > MAX_FOURIER_DIAGNOSTIC_CALLS) {
      throw new RangeError(
        "nhm2_connected_noise_spectral_block_diagnostic_fourier_call_cap_exceeded",
      );
    }
    const inheritedFunctionEvaluations = canonicalFiniteNumber(
      leftFourier.work.functionEvaluations +
        (rightReusedLeftEvaluation ? 0 : rightFourier.work.functionEvaluations),
      "inherited_function_evaluations",
    );
    if (inheritedFunctionEvaluations > MAX_INHERITED_FUNCTION_EVALUATIONS) {
      throw new RangeError(
        "nhm2_connected_noise_spectral_block_diagnostic_inherited_work_cap_exceeded",
      );
    }

    const leftReal = leftFourier.smearingFourierTransform.real;
    const leftImaginary = leftFourier.smearingFourierTransform.imaginary;
    const rightReal = rightFourier.smearingFourierTransform.real;
    const rightImaginary = rightFourier.smearingFourierTransform.imaginary;
    const realConjugateFourierProduct = canonicalFiniteNumber(
      leftReal * rightReal + leftImaginary * rightImaginary,
      "real_conjugate_fourier_product",
    );
    const imaginaryConjugateFourierProduct = canonicalFiniteNumber(
      leftReal * rightImaginary - leftImaginary * rightReal,
      "imaginary_conjugate_fourier_product",
    );
    const blockValues = Object.freeze(
      spectralDensityValues.map((density, index) =>
        canonicalFiniteNumber(
          SI_AND_INVERSE_FOURIER_MULTIPLIER_J2_M2 *
            realConjugateFourierProduct *
            density,
          `spectral_block_${index}`,
        ),
      ),
    );
    if (blockValues.length !== MAX_STORED_BLOCK_ENTRIES) {
      throw new Error(
        "nhm2_connected_noise_spectral_block_diagnostic_block_entry_count_drift",
      );
    }

    const summarizeFourier = (
      result: Nhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnosticResult,
    ) =>
      Object.freeze({
        schemaVersion: result.schemaVersion,
        status: result.status,
        sampleOrdinal: result.input.sampleOrdinal,
        transformReal: result.smearingFourierTransform.real,
        transformImaginary: result.smearingFourierTransform.imaginary,
        functionEvaluations: result.work.functionEvaluations,
        exactSmearingBinding: Object.freeze({
          artifactId: result.upstreamBinding.artifactId,
          contractVersion: result.upstreamBinding.contractVersion,
          canonicalSha256: result.upstreamBinding.canonicalSha256,
          canonicalSizeBytes: result.upstreamBinding.canonicalSizeBytes,
          exactIdentityVerifiedAtModuleInitialization:
            result.upstreamBinding.exactIdentityVerifiedAtModuleInitialization,
          semanticSubstitutionAllowed:
            result.upstreamBinding.semanticSubstitutionAllowed,
        }),
        deterministicEnclosure: null,
        absoluteUncertainty95: null,
        executionAdmissible: false as const,
        allAuthorityAndClaimLocksVerifiedFalse: true as const,
      });

    const result = Object.freeze({
      schemaVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SPECTRAL_BLOCK_DIAGNOSTIC_SCHEMA_VERSION,
      status:
        "blocked_binary64_strict_future_cone_spectral_block_diagnostic_only" as const,
      diagnosticOnly: true as const,
      input: Object.freeze({
        leftSampleOrdinal: input.leftSampleOrdinal,
        rightSampleOrdinal: input.rightSampleOrdinal,
        fourMomentumMInverse: kContravariant,
      }),
      support: Object.freeze({
        domain: "strict_future_timelike_only" as const,
        strictFutureTimelikeInputAdmitted: true as const,
        boundaryOrExteriorEvaluationAdmitted: false as const,
        contravariantKOrder: Object.freeze(["K0", "Kx", "Ky", "Kz"]),
        covariantKLowerMInverse: kLower,
        loweringIdentity: "K_lower=(-K0,Kx,Ky,Kz)" as const,
        sMInverseSquared: s,
        invariantIdentity: "s=K0^2-Kx^2-Ky^2-Kz^2=-K^2" as const,
        futureAndTimelikeStepFactorsOnAdmittedDomain: 1 as const,
      }),
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
        fourierDiagnostic: Object.freeze({
          schemaVersion: EXPECTED_FOURIER_DIAGNOSTIC_SCHEMA_VERSION,
          exactSchemaVerifiedAtModuleInitialization: true as const,
          implementationSourceBytesPinned: false as const,
          semanticSubstitutionAllowed: false as const,
        }),
        smearingFourierViaEveryComposedResult: Object.freeze({
          canonicalSha256: EXPECTED_SMEARING_FOURIER_SHA256,
          canonicalSizeBytes: EXPECTED_SMEARING_FOURIER_SIZE_BYTES,
          everyResultExactIdentityVerified: true as const,
          semanticSubstitutionAllowed: false as const,
        }),
      }),
      tensorConvention: Object.freeze({
        componentOrder: EXPECTED_COMPONENT_IDS,
        componentPairFlattening:
          "left_component_outer_right_component_inner_row_major" as const,
        rawSymmetricComponentsStored: true as const,
        frobeniusSqrt2OffDiagonalWeightApplied: false as const,
        componentCount: 10 as const,
        componentPairCount: 100 as const,
      }),
      boundarySafePolynomial: Object.freeze({
        bCovariantIdentity: "B_ab=s*eta_ab+K_a*K_b" as const,
        s2PiIdentity:
          "s2Pi_abcd=0.5*(B_ac*B_bd+B_ad*B_bc)-(1/3)*B_ab*B_cd" as const,
        divisionBySUsed: false as const,
        fullTensorTransientlyEvaluated: true as const,
        fullTensorStoredInResult: false as const,
      }),
      binary64IdentityObservations: Object.freeze({
        minorLeftSymmetryMaxAbsResidualMInverse4: minorLeftResidual,
        minorRightSymmetryMaxAbsResidualMInverse4: minorRightResidual,
        pairExchangeSymmetryMaxAbsResidualMInverse4: pairExchangeResidual,
        leftTransversalityMaxAbsResidualMInverse5: leftTransversalityResidual,
        rightTransversalityMaxAbsResidualMInverse5: rightTransversalityResidual,
        leftTraceMaxAbsResidualMInverse4: leftTraceResidual,
        rightTraceMaxAbsResidualMInverse4: rightTraceResidual,
        deterministicTolerance: null,
        deterministicEnclosure: null,
        certifiedIdentityPass: false as const,
        interpretation:
          "binary64_observations_only_not_enclosures_or_certificates" as const,
      }),
      positiveFrequencySpectralDensity: Object.freeze({
        convention: "standard_LIPS_future_cone_rho_plus" as const,
        exactCoefficientIdentity: "1/(480*pi)" as const,
        coefficientBinary64: POSITIVE_FREQUENCY_SPECTRAL_COEFFICIENT,
        formula: "rho_plus_abcd=s2Pi_abcd/(480*pi)" as const,
        unit: "m^-4" as const,
        valuesInFrozenComponentPairOrder: spectralDensityValues,
      }),
      fourierDiagnostics: Object.freeze({
        callCount: fourierDiagnosticCalls,
        rightReusedLeftEvaluation,
        left: summarizeFourier(leftFourier),
        right: summarizeFourier(rightFourier),
      }),
      smearingOverlap: Object.freeze({
        exactIdentity: "Re(conjugate(f_hat_p)*f_hat_q)" as const,
        realConjugateFourierProduct,
        imaginaryConjugateFourierProductObserved:
          imaginaryConjugateFourierProduct,
        onlyRealPartUsedInSpectralBlock: true as const,
      }),
      siAndInverseFourierRestoration: Object.freeze({
        exactSymbolicMultiplier: "(hbar*c)^2/(2*pi)^4" as const,
        planckConstantJouleSeconds: PLANCK_CONSTANT_J_S,
        planckConstantExactBySiDefinition: true as const,
        reducedPlanckConstantJouleSecondsBinary64: REDUCED_PLANCK_CONSTANT_J_S,
        speedOfLightMetersPerSecond: SPEED_OF_LIGHT_M_PER_S,
        speedOfLightExactBySiDefinition: true as const,
        hbarC_JouleMetersBinary64: HBAR_C_J_M,
        inverseFourierMeasureFactorBinary64: INVERSE_FOURIER_MEASURE_FACTOR,
        combinedMultiplierJouleSquaredMetersSquaredBinary64:
          SI_AND_INVERSE_FOURIER_MULTIPLIER_J2_M2,
        symbolicIdentityFrozenExactly: true as const,
        numericalEvaluation: "ieee754_binary64_not_enclosed" as const,
      }),
      spectralBlock: Object.freeze({
        exactIdentity:
          "G_abcd(K;p,q)=(hbar*c)^2/(2*pi)^4*Re(conjugate(f_hat_p(K))*f_hat_q(K))*rho_plus_abcd(K)" as const,
        unitBeforeD4KIntegration: "J^2/m^2" as const,
        unitAfterD4KIntegration: "(J/m^3)^2" as const,
        valuesInFrozenComponentPairOrder: blockValues,
        thisSingleKBlockIsAnIntegratedCovariance: false as const,
      }),
      work: Object.freeze({
        arithmetic: "ieee754_binary64" as const,
        maximumFourierDiagnosticCalls: MAX_FOURIER_DIAGNOSTIC_CALLS,
        fourierDiagnosticCalls,
        maximumInheritedFunctionEvaluations: MAX_INHERITED_FUNCTION_EVALUATIONS,
        inheritedFunctionEvaluations,
        maximumPolynomialTensorEvaluations: MAX_POLYNOMIAL_TENSOR_EVALUATIONS,
        polynomialTensorEvaluations,
        maximumStoredSpectralEntries: MAX_STORED_SPECTRAL_ENTRIES,
        storedSpectralEntries: spectralDensityValues.length,
        maximumStoredBlockEntries: MAX_STORED_BLOCK_ENTRIES,
        storedBlockEntries: blockValues.length,
        inputWorkOverrideAccepted: false as const,
        hardCapDisposition: "abort_without_result" as const,
      }),
      unavailableOutputs: Object.freeze({
        fullConnectedNoiseKernel64x64x100: null,
        fullConnectedNoiseAbsoluteUncertainty95_64x64x100: null,
        deterministicEnclosure: null,
        absoluteUncertainty95: null,
        primaryExecutionReceipt: null,
        independentExecutionReceipt: null,
        replayReceipt: null,
        agreementReceipt: null,
      }),
      mayFeedFixedBackgroundRun: false as const,
      executionAdmissible: false as const,
      implementationBoundary: Object.freeze({
        fullArrayBuilderPresent: false as const,
        rawOutputWriterPresent: false as const,
        outputPath: null,
        receiptBuilderPresent: false as const,
        declaredLeverTensorAccepted: false as const,
        metricDemandAccepted: false as const,
        toleranceOverrideAccepted: false as const,
        workOverrideAccepted: false as const,
        authorityOverrideAccepted: false as const,
      }),
      authority: Object.freeze({
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
    assertFiniteCanonicalNumericLeaves(result);
    return result;
  };

export type Nhm2ConformallyFlatNeedleConnectedNoiseSpectralBlockDiagnosticResult =
  ReturnType<
    typeof evaluateNhm2ConformallyFlatNeedleConnectedNoiseSpectralBlockDiagnostic
  >;
