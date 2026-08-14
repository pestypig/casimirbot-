import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-connected-noise-smearing-fourier.v1";

const EXPECTED_SMEARING_FOURIER_SHA256 =
  "e05e74621a1616fd7d37150f71e98632005938d42f285e30a83e760a5f1d6faf" as const;
const EXPECTED_SMEARING_FOURIER_SIZE_BYTES = 12107 as const;

const upstreamCanonicalJson =
  canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
  );
const upstreamCanonicalBytes = Buffer.from(upstreamCanonicalJson, "utf8");
const upstreamActualSha256 = createHash("sha256")
  .update(upstreamCanonicalBytes)
  .digest("hex");

if (
  upstreamActualSha256 !== EXPECTED_SMEARING_FOURIER_SHA256 ||
  upstreamCanonicalBytes.byteLength !== EXPECTED_SMEARING_FOURIER_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256 !==
    EXPECTED_SMEARING_FOURIER_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES !==
    EXPECTED_SMEARING_FOURIER_SIZE_BYTES
) {
  throw new Error(
    "nhm2_connected_noise_fourier_diagnostic_upstream_literal_pin_mismatch",
  );
}

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
    .executionAdmissible !== false ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
    .analyticFreezeBoundary.executionAuthorized !== false ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER.content
      .authority.locks,
  ).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_connected_noise_fourier_diagnostic_upstream_blocked_state_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_FOURIER_DIAGNOSTIC_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_fourier_diagnostic/v1" as const;

type FourVector = readonly [number, number, number, number];

export type Nhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnosticInput = {
  sampleOrdinal: number;
  fourMomentumMInverse: FourVector;
};

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
): SnapshotResult => {
  const at = pointer || "/";
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, violation: `nonfinite_number:${at}` };
    }
    if (Object.is(value, -0)) {
      return { ok: false, violation: `negative_zero:${at}` };
    }
    return { ok: true, value };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: `non_json_value:${at}` };
  }
  if (nodeUtilTypes.isProxy(value)) {
    return { ok: false, violation: `proxy_forbidden:${at}` };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: `cycle_forbidden:${at}` };
  }

  ancestors.add(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return { ok: false, violation: `symbol_key_forbidden:${at}` };
  }
  const stringKeys = keys as string[];
  const forbidden = stringKeys.find((key) => FORBIDDEN_DATA_KEYS.has(key));
  if (forbidden != null) {
    ancestors.delete(value);
    return {
      ok: false,
      violation: `forbidden_data_key:${pointer}/${forbidden}`,
    };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return { ok: false, violation: `non_plain_array:${at}` };
    }
    if (
      stringKeys.length !== value.length + 1 ||
      !stringKeys.includes("length") ||
      stringKeys.some((key) => {
        if (key === "length") return false;
        if (!/^(?:0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index >= value.length;
      })
    ) {
      ancestors.delete(value);
      return { ok: false, violation: `array_keys_invalid:${at}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        ancestors.delete(value);
        return {
          ok: false,
          violation: `accessor_sparse_or_hidden_array_entry:${pointer}/${index}`,
        };
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
      );
      if (!nested.ok) {
        ancestors.delete(value);
        return nested;
      }
      output.push(nested.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    ancestors.delete(value);
    return { ok: false, violation: `non_plain_object:${at}` };
  }
  const output: Record<string, unknown> = {};
  for (const key of stringKeys) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `accessor_or_hidden_property_forbidden:${pointer}/${key}`,
      };
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
    );
    if (!nested.ok) {
      ancestors.delete(value);
      return nested;
    }
    output[key] = nested.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const exactInput = (
  value: unknown,
): Nhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnosticInput => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) {
    throw new TypeError(
      `nhm2_connected_noise_fourier_diagnostic_input_unsafe:${snapshot.violation}`,
    );
  }
  if (!isRecord(snapshot.value)) {
    throw new TypeError(
      "nhm2_connected_noise_fourier_diagnostic_input_must_be_plain_object",
    );
  }
  const keys = Object.keys(snapshot.value).sort();
  if (
    keys.length !== 2 ||
    keys[0] !== "fourMomentumMInverse" ||
    keys[1] !== "sampleOrdinal"
  ) {
    throw new TypeError(
      "nhm2_connected_noise_fourier_diagnostic_input_keys_invalid",
    );
  }
  const sampleOrdinal = snapshot.value.sampleOrdinal;
  if (
    typeof sampleOrdinal !== "number" ||
    !Number.isSafeInteger(sampleOrdinal) ||
    sampleOrdinal < 0 ||
    sampleOrdinal >= 64
  ) {
    throw new RangeError(
      "nhm2_connected_noise_fourier_diagnostic_sample_ordinal_invalid",
    );
  }
  const momentum = snapshot.value.fourMomentumMInverse;
  if (
    !Array.isArray(momentum) ||
    momentum.length !== 4 ||
    momentum.some(
      (entry) =>
        typeof entry !== "number" ||
        !Number.isFinite(entry) ||
        Object.is(entry, -0),
    )
  ) {
    throw new TypeError(
      "nhm2_connected_noise_fourier_diagnostic_four_momentum_invalid",
    );
  }
  return {
    sampleOrdinal,
    fourMomentumMInverse: momentum as unknown as FourVector,
  };
};

const Q_MIN_FINE_SUBINTERVALS = 512;
const Q_MAX_FINE_SUBINTERVALS = 8192;
const SPATIAL_COARSE_SUBINTERVALS = 12;
const SPATIAL_FINE_SUBINTERVALS = 24;
const MAX_FUNCTION_EVALUATIONS = 80_000;
const OSCILLATION_SAMPLES_PER_PI = 32;

const HALF_WIDTHS_M: FourVector = [0.002, 0.01, 0.002, 0.002];
const PRODUCT_HALF_WIDTH_VOLUME_M4 = 8e-11;
const X_CENTERS_M = [-0.125, -0.05, 0.05, 0.125] as const;
const YZ_CENTERS_M = [-0.025, -0.01, 0.01, 0.025] as const;

const canonicalFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `nhm2_connected_noise_fourier_diagnostic_nonfinite_derived_value:${label}`,
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
      throw new Error(
        `nhm2_connected_noise_fourier_diagnostic_result_numeric_leaf_invalid:${pointer || "/"}`,
      );
    }
    return;
  }
  if (value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertFiniteCanonicalNumericLeaves(entry, `${pointer}/${index}`),
    );
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    assertFiniteCanonicalNumericLeaves(entry, `${pointer}/${key}`);
  }
};

const qBump = (u: number): number => {
  const absolute = Math.abs(u);
  if (absolute >= 1) return 0;
  return Math.exp(-(u * u) / (1 - u * u));
};

const evenSubintervalsForQ = (absoluteZ: number): number => {
  const frequencyDriven = Math.ceil(
    (OSCILLATION_SAMPLES_PER_PI * absoluteZ) / Math.PI,
  );
  const requested = Math.max(Q_MIN_FINE_SUBINTERVALS, frequencyDriven);
  const remainder = requested % 4;
  return remainder === 0 ? requested : requested + (4 - remainder);
};

const simpsonQ = (absoluteZ: number, subintervals: number): number => {
  let weighted = qBump(0);
  for (let index = 1; index < subintervals; index += 1) {
    const u = index / subintervals;
    weighted += (index % 2 === 0 ? 2 : 4) * qBump(u) * Math.cos(absoluteZ * u);
  }
  // This is the exact even reduction 2*integral_0^1 q(u)cos(z*u)du.
  return canonicalFiniteNumber(
    (2 * weighted) / (3 * subintervals),
    "one_dimensional_Q",
  );
};

const evaluateQ = (absoluteZ: number, fineSubintervals: number) => {
  const coarseSubintervals = fineSubintervals / 2;
  const coarse = simpsonQ(absoluteZ, coarseSubintervals);
  const value = simpsonQ(absoluteZ, fineSubintervals);
  return {
    value,
    refinementDelta: canonicalFiniteNumber(
      Math.abs(value - coarse),
      "one_dimensional_Q_refinement_delta",
    ),
    fineSubintervals,
    coarseSubintervals,
    functionEvaluations: coarseSubintervals + 1 + (fineSubintervals + 1),
  };
};

const simpsonNodes = (subintervals: number) => {
  const nodes: Array<{ u: number; weightTimesQ: number }> = [];
  let weightSum = 0;
  for (let index = 0; index <= subintervals; index += 1) {
    const u = -1 + (2 * index) / subintervals;
    const simpsonWeight =
      index === 0 || index === subintervals ? 1 : index % 2 === 0 ? 2 : 4;
    const weightTimesQ = simpsonWeight * qBump(u);
    nodes.push({ u, weightTimesQ });
    weightSum += weightTimesQ;
  }
  return { nodes, weightSum };
};

const canonicalNormalizationCenter = (
  center: readonly [number, number, number],
): readonly [number, number, number] => {
  const yz = [Math.abs(center[1]), Math.abs(center[2])].sort(
    (left, right) => left - right,
  );
  return [Math.abs(center[0]), yz[0], yz[1]];
};

const spatialOmegaFourthExpectation = (
  center: readonly [number, number, number],
  subintervals: number,
) => {
  const canonicalCenter = canonicalNormalizationCenter(center);
  const { nodes, weightSum } = simpsonNodes(subintervals);
  let weightedOmegaFourth = 0;
  let evaluations = 0;
  for (const xNode of nodes) {
    const x = canonicalCenter[0] + 0.01 * xNode.u;
    for (const yNode of nodes) {
      const y = canonicalCenter[1] + 0.002 * yNode.u;
      for (const zNode of nodes) {
        const weight =
          xNode.weightTimesQ * yNode.weightTimesQ * zNode.weightTimesQ;
        if (weight !== 0) {
          const z = canonicalCenter[2] + 0.002 * zNode.u;
          const s = (x / 0.25) ** 2 + (y / 0.05) ** 2 + (z / 0.05) ** 2;
          const compactBump = s >= 1 ? 0 : Math.exp(-s / (1 - s));
          const omega = 1 + 0.000001 * compactBump;
          weightedOmegaFourth += weight * omega ** 4;
        }
        evaluations += 1;
      }
    }
  }
  return {
    expectation: canonicalFiniteNumber(
      weightedOmegaFourth / weightSum ** 3,
      "spatial_omega_fourth_expectation",
    ),
    evaluations,
  };
};

const sampleCenter = (
  sampleOrdinal: number,
): readonly [number, number, number, number] => {
  const xIndex = sampleOrdinal % 4;
  const yIndex = Math.floor(sampleOrdinal / 4) % 4;
  const zIndex = Math.floor(sampleOrdinal / 16);
  return [0, X_CENTERS_M[xIndex], YZ_CENTERS_M[yIndex], YZ_CENTERS_M[zIndex]];
};

const preflightWork = (argumentsZ: FourVector) => {
  const uniqueAbsoluteArguments = [0, ...argumentsZ.map(Math.abs)].filter(
    (value, index, values) => values.indexOf(value) === index,
  );
  let qFunctionEvaluations = 0;
  const fineSubintervals = new Map<number, number>();
  for (const absoluteZ of uniqueAbsoluteArguments) {
    const subintervals = evenSubintervalsForQ(absoluteZ);
    if (subintervals > Q_MAX_FINE_SUBINTERVALS) {
      throw new RangeError(
        "nhm2_connected_noise_fourier_diagnostic_hard_work_cap_exceeded",
      );
    }
    fineSubintervals.set(absoluteZ, subintervals);
    qFunctionEvaluations += subintervals / 2 + 1 + (subintervals + 1);
  }
  const spatialFunctionEvaluations =
    (SPATIAL_COARSE_SUBINTERVALS + 1) ** 3 +
    (SPATIAL_FINE_SUBINTERVALS + 1) ** 3;
  if (
    qFunctionEvaluations + spatialFunctionEvaluations >
    MAX_FUNCTION_EVALUATIONS
  ) {
    throw new RangeError(
      "nhm2_connected_noise_fourier_diagnostic_hard_work_cap_exceeded",
    );
  }
  return {
    fineSubintervals,
    maximumFunctionEvaluations: MAX_FUNCTION_EVALUATIONS,
    plannedFunctionEvaluations:
      qFunctionEvaluations + spatialFunctionEvaluations,
  };
};

export const evaluateNhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnostic =
  (unknownInput: unknown) => {
    const input = exactInput(unknownInput);
    const argumentsZ = input.fourMomentumMInverse.map((component, index) =>
      canonicalFiniteNumber(
        component * HALF_WIDTHS_M[index],
        `dimensionless_fourier_argument_${index}`,
      ),
    ) as unknown as FourVector;
    const workPlan = preflightWork(argumentsZ);

    const qCache = new Map<number, ReturnType<typeof evaluateQ>>();
    const qAt = (z: number) => {
      const absoluteZ = Math.abs(z);
      const cached = qCache.get(absoluteZ);
      if (cached != null) return cached;
      const evaluated = evaluateQ(
        absoluteZ,
        workPlan.fineSubintervals.get(absoluteZ)!,
      );
      qCache.set(absoluteZ, evaluated);
      return evaluated;
    };

    const q0 = qAt(0);
    const qByCoordinate = argumentsZ.map((argument) => qAt(argument));
    const center = sampleCenter(input.sampleOrdinal);
    const spatialCenter = [center[1], center[2], center[3]] as const;
    const spatialCoarse = spatialOmegaFourthExpectation(
      spatialCenter,
      SPATIAL_COARSE_SUBINTERVALS,
    );
    const spatialFine = spatialOmegaFourthExpectation(
      spatialCenter,
      SPATIAL_FINE_SUBINTERVALS,
    );
    const sP = canonicalFiniteNumber(
      q0.value ** 3 * spatialFine.expectation,
      "spatial_curved_normalization_S_p",
    );
    const cP = canonicalFiniteNumber(
      1 / (PRODUCT_HALF_WIDTH_VOLUME_M4 * q0.value * sP),
      "normalization_constant_C_p",
    );
    const zeroMode = canonicalFiniteNumber(q0.value ** 3 / sP, "zero_mode");
    const transformAmplitude = canonicalFiniteNumber(
      cP *
        PRODUCT_HALF_WIDTH_VOLUME_M4 *
        qByCoordinate.reduce((product, entry) => product * entry.value, 1),
      "smearing_fourier_signed_amplitude",
    );
    const spatialPhaseArgument = canonicalFiniteNumber(
      input.fourMomentumMInverse[1] * center[1] +
        input.fourMomentumMInverse[2] * center[2] +
        input.fourMomentumMInverse[3] * center[3],
      "spatial_center_phase_argument",
    );
    const transformReal = canonicalFiniteNumber(
      transformAmplitude * Math.cos(spatialPhaseArgument),
      "smearing_fourier_real",
    );
    const transformImaginary = canonicalFiniteNumber(
      -transformAmplitude * Math.sin(spatialPhaseArgument),
      "smearing_fourier_imaginary",
    );

    const actualFunctionEvaluations = canonicalFiniteNumber(
      [...qCache.values()].reduce(
        (sum, entry) => sum + entry.functionEvaluations,
        0,
      ) +
        spatialCoarse.evaluations +
        spatialFine.evaluations,
      "actual_function_evaluations",
    );

    const result = Object.freeze({
      schemaVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_FOURIER_DIAGNOSTIC_SCHEMA_VERSION,
      status: "diagnostic_binary64_not_enclosed" as const,
      diagnosticOnly: true as const,
      upstreamBinding: Object.freeze({
        artifactId:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ARTIFACT_ID,
        contractVersion:
          NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTRACT_VERSION,
        canonicalSha256: EXPECTED_SMEARING_FOURIER_SHA256,
        canonicalSizeBytes: EXPECTED_SMEARING_FOURIER_SIZE_BYTES,
        exactIdentityVerifiedAtModuleInitialization: true as const,
        semanticSubstitutionAllowed: false as const,
      }),
      input: Object.freeze({
        sampleOrdinal: input.sampleOrdinal,
        fourMomentumMInverse: Object.freeze([
          ...input.fourMomentumMInverse,
        ]) as FourVector,
      }),
      sampleCenterM: Object.freeze({
        X0: center[0],
        X: center[1],
        Y: center[2],
        Z: center[3],
      }),
      oneDimensionalTransform: Object.freeze({
        arguments: Object.freeze([...argumentsZ]) as FourVector,
        q0: q0.value,
        values: Object.freeze(
          qByCoordinate.map((entry) => entry.value),
        ) as unknown as FourVector,
        fineSubintervals: Object.freeze(
          qByCoordinate.map((entry) => entry.fineSubintervals),
        ) as unknown as FourVector,
        coarseSubintervals: Object.freeze(
          qByCoordinate.map((entry) => entry.coarseSubintervals),
        ) as unknown as FourVector,
        realForRealArguments: true as const,
        evenForRealArguments: true as const,
      }),
      spatialCurvedNormalization: Object.freeze({
        S_p: sP,
        C_pPerM4: cP,
        omegaFourthExpectation: spatialFine.expectation,
        reflectionSymmetryAppliedExactly: true as const,
        yzExchangeSymmetryAppliedExactly: true as const,
      }),
      smearingFourierTransform: Object.freeze({
        real: transformReal,
        imaginary: transformImaginary,
        amplitude: transformAmplitude,
        centerPhaseArgumentRadians: spatialPhaseArgument,
        forwardPhaseConvention: "exp(-i*K_dot_X_p)" as const,
      }),
      zeroMode: Object.freeze({
        value: zeroMode,
        assertedEqualToOne: false as const,
        analyticInclusiveLowerBound: canonicalFiniteNumber(
          (1_000_000 / 1_000_001) ** 4,
          "zero_mode_analytic_lower_bound",
        ),
        analyticInclusiveUpperBound: 1,
      }),
      refinementObservations: Object.freeze({
        q0AbsoluteDelta: q0.refinementDelta,
        qAbsoluteDeltaByCoordinate: Object.freeze(
          qByCoordinate.map((entry) => entry.refinementDelta),
        ) as unknown as FourVector,
        spatialOmegaFourthExpectationAbsoluteDelta: canonicalFiniteNumber(
          Math.abs(spatialFine.expectation - spatialCoarse.expectation),
          "spatial_omega_fourth_expectation_refinement_delta",
        ),
        interpretation:
          "nested_resolution_difference_only_not_an_error_bound_or_enclosure" as const,
      }),
      work: Object.freeze({
        arithmetic: "ieee754_binary64" as const,
        quadrature: "composite_Simpson_fixed_policy" as const,
        qMinimumFineSubintervals: Q_MIN_FINE_SUBINTERVALS,
        qMaximumFineSubintervals: Q_MAX_FINE_SUBINTERVALS,
        qOscillationSamplesPerPi: OSCILLATION_SAMPLES_PER_PI,
        spatialCoarseSubintervalsPerAxis: SPATIAL_COARSE_SUBINTERVALS,
        spatialFineSubintervalsPerAxis: SPATIAL_FINE_SUBINTERVALS,
        maximumFunctionEvaluations: workPlan.maximumFunctionEvaluations,
        functionEvaluations: actualFunctionEvaluations,
        inputWorkOverrideAccepted: false as const,
        hardCapDisposition: "abort_without_result" as const,
      }),
      deterministicEnclosure: null,
      absoluteUncertainty95: null,
      mayFeedFixedBackgroundRun: false as const,
      executionAdmissible: false as const,
      implementationBoundary: Object.freeze({
        rawOutputWriterPresent: false as const,
        outputPath: null,
        declaredLeverTensorAccepted: false as const,
        metricDemandAccepted: false as const,
        toleranceOverrideAccepted: false as const,
        authorityOverrideAccepted: false as const,
      }),
      authority: Object.freeze({
        numericalNormalizationAuthority: false as const,
        fourierEnclosureAuthority: false as const,
        deterministicErrorAuthority: false as const,
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

export type Nhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnosticResult =
  ReturnType<
    typeof evaluateNhm2ConformallyFlatNeedleConnectedNoiseFourierDiagnostic
  >;
