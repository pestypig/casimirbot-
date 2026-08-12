import { createHash } from "node:crypto";
import path from "node:path";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson,
  hasValidNhm2ConformallyFlatNeedleMetricDemandRunReceiptIntegrity,
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes,
  type Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
  type Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-metric-demand-interval-producer.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT,
  computeNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationSha256,
  hasValidNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationIntegrity,
  type Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1,
  type Nhm2ConformallyFlatNeedleMetricDemandIndependentReplayIdentityV1,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-metric-demand-derivation-verification.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../../../shared/contracts/nhm2-conformally-flat-needle-scalar-reference.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
} from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES } from "../../../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../../../shared/contracts/nhm2-semiclassical-state-realizability.v1";

const SHA256 = /^[a-f0-9]{64}$/;
const RESERVED_JSON_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_JSON_DEPTH = 32;
const MAX_JSON_NODES = 1_000_000;
const OUTWARD_RELATIVE_PADDING = 2 ** -52;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_STRUCTURAL_REPLAYER_CONTRACT =
  Object.freeze({
    implementationId:
      "server_structural_trace_replayer_without_transcendental_engine/v1" as const,
    acceptedTraceContract:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION,
    checks: Object.freeze([
      "bounded_fatal_utf8_canonical_json",
      "frozen_hash_and_semantic_bindings",
      "64_by_10_by_3_trace_shape",
      "positive_denominators_and_closed_intervals",
      "cumulative_intersection_and_midpoint_radius_relations",
      "exact_float64le_central_and_error_bytes",
      "multiplicity_weighted_frobenius_ratio",
      "trace_summary_and_receipt_integrity",
    ] as const),
    explicitlyAbsentCapabilities: Object.freeze([
      "independent_elementary_transcendental_interval_engine",
      "independent_cellwise_integrand_recomputation",
      "independent_darboux_enclosure_establishment",
    ] as const),
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_STRUCTURAL_REPLAYER_CONTRACT_SHA256 =
  sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_STRUCTURAL_REPLAYER_CONTRACT,
    ),
  );

export type VerifyNhm2ConformallyFlatNeedleMetricDemandDerivationInput = {
  producerRunReceiptBytes: Uint8Array;
  centralTensorBytes: Uint8Array;
  absoluteErrorBoundBytes: Uint8Array;
  intervalTraceBytes: Uint8Array;
  structuralReplayerImplementationObservation: {
    implementationSourceSha256: string;
    dependencyLockSha256: string;
    toolchainArtifactSha256: string;
    executableSha256: string;
  };
};

export type Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierErrorCode =
  | "verification_input_invalid"
  | "producer_receipt_noncanonical"
  | "producer_receipt_integrity_invalid"
  | "producer_provenance_invalid"
  | "producer_resource_observation_invalid"
  | "producer_output_observation_invalid"
  | "producer_output_bytes_mismatch"
  | "derivation_receipt_integrity_invalid"
  | "interval_trace_noncanonical"
  | "interval_trace_semantics_invalid"
  | "interval_trace_coverage_invalid"
  | "interval_trace_enclosure_invalid"
  | "interval_trace_summary_invalid"
  | "verification_artifact_integrity_failed";

export class Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierError extends Error {
  readonly code: Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierErrorCode;
  readonly pointer: string | null;

  constructor(
    code: Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierErrorCode,
    message: string,
    pointer: string | null = null,
  ) {
    super(message);
    this.name = "Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierError";
    this.code = code;
    this.pointer = pointer;
  }
}

const fail = (
  code: Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierErrorCode,
  message: string,
  pointer: string | null = null,
): never => {
  throw new Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierError(
    code,
    message,
    pointer,
  );
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const validSha = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const validGitSha1 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Reflect.ownKeys(value);
  return (
    keys.every((key): key is string => typeof key === "string") &&
    keys.length === expected.length &&
    [...keys]
      .sort()
      .every((key, index) => key === [...expected].sort()[index]) &&
    keys.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return (
        descriptor != null && "value" in descriptor && descriptor.enumerable
      );
    })
  );
};

const assertBoundedPlainJson = (root: unknown, label: string): void => {
  const stack: Array<{ value: unknown; depth: number; pointer: string }> = [
    { value: root, depth: 0, pointer: "$" },
  ];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > MAX_JSON_NODES || current.depth > MAX_JSON_DEPTH) {
      return fail(
        "verification_input_invalid",
        `${label} exceeds the frozen JSON resource bound.`,
        current.pointer,
      );
    }
    const value = current.value;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      continue;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        return fail(
          "verification_input_invalid",
          `${label} contains a non-finite number.`,
          current.pointer,
        );
      }
      continue;
    }
    if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({
          value: value[index],
          depth: current.depth + 1,
          pointer: `${current.pointer}/${index}`,
        });
      }
      continue;
    }
    if (!isPlainRecord(value)) {
      return fail(
        "verification_input_invalid",
        `${label} must contain only plain JSON objects.`,
        current.pointer,
      );
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string" || RESERVED_JSON_KEYS.has(key)) {
        return fail(
          "verification_input_invalid",
          `${label} contains a forbidden key.`,
          current.pointer,
        );
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      ) {
        return fail(
          "verification_input_invalid",
          `${label} contains a non-data JSON property.`,
          `${current.pointer}/${key}`,
        );
      }
      stack.push({
        value: descriptor.value,
        depth: current.depth + 1,
        pointer: `${current.pointer}/${key}`,
      });
    }
  }
};

const copyBytes = (
  value: unknown,
  expectedOrMaximumBytes: number,
  exact: boolean,
  label: string,
): Buffer => {
  if (!(value instanceof Uint8Array)) {
    return fail(
      "verification_input_invalid",
      `${label} must be an owned Uint8Array view.`,
    );
  }
  const copy = Buffer.from(value);
  if (
    copy.byteLength === 0 ||
    (exact
      ? copy.byteLength !== expectedOrMaximumBytes
      : copy.byteLength > expectedOrMaximumBytes)
  ) {
    return fail(
      "verification_input_invalid",
      `${label} violates its frozen byte bound.`,
    );
  }
  return copy;
};

const parseCanonicalJson = <T>(
  bytes: Buffer,
  code: "producer_receipt_noncanonical" | "interval_trace_noncanonical",
  label: string,
): T => {
  let text: string;
  let parsed: unknown;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    parsed = JSON.parse(text);
    assertBoundedPlainJson(parsed, label);
    if (canonicalNhm2ConformallyFlatNeedleMetricDemandJson(parsed) !== text) {
      return fail(code, `${label} bytes are not exact canonical JSON.`);
    }
  } catch (error) {
    if (
      error instanceof
      Nhm2ConformallyFlatNeedleMetricDemandDerivationVerifierError
    ) {
      throw error;
    }
    return fail(code, `${label} is not bounded canonical UTF-8 JSON.`);
  }
  return parsed as T;
};

const sameCanonical = (left: unknown, right: unknown): boolean =>
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson(left) ===
  canonicalNhm2ConformallyFlatNeedleMetricDemandJson(right);

const sameNumber = (left: unknown, right: number): boolean =>
  typeof left === "number" &&
  (Object.is(left, right) || (left === 0 && right === 0));

const interval = (
  value: unknown,
  pointer: string,
): readonly [number, number] => {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !Number.isFinite(value[0]) ||
    !Number.isFinite(value[1]) ||
    value[0] > value[1]
  ) {
    return fail(
      "interval_trace_enclosure_invalid",
      "Expected a finite nonempty closed interval.",
      pointer,
    );
  }
  return [value[0], value[1]];
};

const stableFrobenius = (components: readonly number[]): number => {
  let scale = 0;
  for (let index = 0; index < components.length; index += 1) {
    scale = Math.max(
      scale,
      Math.sqrt(
        NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES[
          index
        ],
      ) * Math.abs(components[index]),
    );
  }
  if (scale === 0) return 0;
  let normalizedSquares = 0;
  for (let index = 0; index < components.length; index += 1) {
    const normalized = components[index] / scale;
    normalizedSquares +=
      NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES[index] *
      normalized *
      normalized;
  }
  return scale * Math.sqrt(normalizedSquares);
};

const outwardUp = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) {
    return fail(
      "interval_trace_enclosure_invalid",
      "A reported interval radius is invalid.",
    );
  }
  if (value === 0) return Number.MIN_VALUE;
  const padded =
    value +
    Math.max(Number.MIN_VALUE, Math.abs(value) * OUTWARD_RELATIVE_PADDING);
  if (!Number.isFinite(padded) || !(padded > value)) {
    return fail(
      "interval_trace_enclosure_invalid",
      "A reported interval radius cannot be outward padded.",
    );
  }
  return padded;
};

type ReplayInterval = { lo: number; hi: number };

const replayOutwardUp = (value: number): number => {
  if (!Number.isFinite(value)) {
    return fail(
      "interval_trace_enclosure_invalid",
      "The squared self-check produced a non-finite upper endpoint.",
    );
  }
  if (value === 0) return Number.MIN_VALUE;
  const result =
    value +
    Math.max(Number.MIN_VALUE, Math.abs(value) * OUTWARD_RELATIVE_PADDING);
  if (!Number.isFinite(result) || !(result > value)) {
    return fail(
      "interval_trace_enclosure_invalid",
      "The squared self-check could not round an upper endpoint outward.",
    );
  }
  return result;
};

const replayOutwardDown = (value: number): number => {
  if (!Number.isFinite(value)) {
    return fail(
      "interval_trace_enclosure_invalid",
      "The squared self-check produced a non-finite lower endpoint.",
    );
  }
  if (value === 0) return -Number.MIN_VALUE;
  const result =
    value -
    Math.max(Number.MIN_VALUE, Math.abs(value) * OUTWARD_RELATIVE_PADDING);
  if (!Number.isFinite(result) || !(result < value)) {
    return fail(
      "interval_trace_enclosure_invalid",
      "The squared self-check could not round a lower endpoint outward.",
    );
  }
  return result;
};

const replayMultiply = (
  left: ReplayInterval,
  right: ReplayInterval,
): ReplayInterval => {
  const products = [
    left.lo * right.lo,
    left.lo * right.hi,
    left.hi * right.lo,
    left.hi * right.hi,
  ];
  if (products.some((entry) => !Number.isFinite(entry))) {
    return fail(
      "interval_trace_enclosure_invalid",
      "The squared self-check interval product overflowed.",
    );
  }
  return {
    lo: replayOutwardDown(Math.min(...products)),
    hi: replayOutwardUp(Math.max(...products)),
  };
};

const replaySquare = (value: ReplayInterval): ReplayInterval => {
  if (value.lo <= 0 && value.hi >= 0) {
    return {
      lo: 0,
      hi: replayOutwardUp(Math.max(value.lo * value.lo, value.hi * value.hi)),
    };
  }
  const left = value.lo * value.lo;
  const right = value.hi * value.hi;
  return {
    lo: replayOutwardDown(Math.min(left, right)),
    hi: replayOutwardUp(Math.max(left, right)),
  };
};

const replayAdd = (
  left: ReplayInterval,
  right: ReplayInterval,
): ReplayInterval => ({
  lo: replayOutwardDown(left.lo + right.lo),
  hi: replayOutwardUp(left.hi + right.hi),
});

const replayScale = (value: ReplayInterval, factor: number): ReplayInterval =>
  replayMultiply(value, {
    lo: replayOutwardDown(factor),
    hi: replayOutwardUp(factor),
  });

export const replayNhm2ConformallyFlatNeedleOutwardSquaredFrobeniusGate = (
  central: readonly number[],
  errors: readonly number[],
) => {
  const sum = (values: readonly number[]): ReplayInterval =>
    values.reduce(
      (total, component, index) =>
        replayAdd(
          total,
          replayScale(
            replaySquare({ lo: component, hi: component }),
            NHM2_SEMICLASSICAL_V2_ORTHONORMAL_SYMMETRIC_TENSOR_MULTIPLICITIES[
              index
            ],
          ),
        ),
      { lo: 0, hi: 0 },
    );
  const centralSquared = sum(central);
  const errorSquared = sum(errors);
  const onePercentCentralSquared = replayMultiply(centralSquared, {
    lo: replayOutwardDown(0.0001),
    hi: replayOutwardUp(0.0001),
  });
  if (
    !(centralSquared.lo > 0) ||
    ![centralSquared.lo, errorSquared.hi, onePercentCentralSquared.lo].every(
      Number.isFinite,
    )
  ) {
    return fail(
      "interval_trace_enclosure_invalid",
      "The squared Frobenius self-check is non-finite or degenerate.",
    );
  }
  const squaredRatioUpper = replayOutwardUp(
    errorSquared.hi / centralSquared.lo,
  );
  return {
    deterministicErrorFrobeniusSquaredUpperSI2: errorSquared.hi,
    centralFrobeniusSquaredLowerSI2: centralSquared.lo,
    onePercentCentralFrobeniusSquaredLowerSI2: onePercentCentralSquared.lo,
    passed: errorSquared.hi <= onePercentCentralSquared.lo,
    displayedRatioUpper: replayOutwardUp(Math.sqrt(squaredRatioUpper)),
  };
};

const isExactIso = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const isSafeAbsoluteNonRootPath = (value: unknown): value is string =>
  typeof value === "string" &&
  path.isAbsolute(value) &&
  path.parse(path.resolve(value)).root !== path.resolve(value);

const pathIsExactChild = (
  parent: string,
  relativePath: string,
  absolutePath: string,
): boolean => {
  if (
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    path.basename(relativePath) !== relativePath ||
    !path.isAbsolute(absolutePath)
  ) {
    return false;
  }
  const expected = path.resolve(parent, relativePath);
  const actual = path.resolve(absolutePath);
  return process.platform === "win32"
    ? expected.toLocaleLowerCase("en-US") === actual.toLocaleLowerCase("en-US")
    : expected === actual;
};

const validateProducerObservation = (
  receipt: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
): void => {
  const execution = receipt.executionObservation;
  if (
    !validSha(execution.invocationId) ||
    !isSafeAbsoluteNonRootPath(execution.repositoryRoot) ||
    !validGitSha1(execution.gitCommitSha) ||
    execution.gitWorktreeState !== "clean" ||
    typeof execution.command !== "string" ||
    execution.command.length === 0 ||
    !Array.isArray(execution.argv) ||
    execution.argv.length === 0 ||
    execution.argv.some((argument) => typeof argument !== "string") ||
    !isExactIso(execution.startedAt) ||
    !isExactIso(execution.completedAt) ||
    Date.parse(execution.completedAt) < Date.parse(execution.startedAt) ||
    !Number.isFinite(execution.durationMs) ||
    execution.durationMs < 0 ||
    execution.exitCode !== 0 ||
    !validSha(execution.implementationSourceSha256) ||
    !validSha(execution.dependencyLockSha256) ||
    !validSha(execution.toolchainArtifactSha256) ||
    !validSha(execution.executableSha256) ||
    execution.observationLimit !==
      "host_process_observed_in_process_operation_not_independent_replay" ||
    execution.implementationHashesStableAcrossCalculation !== true ||
    receipt.candidateInputAdmissible !== false ||
    receipt.scientificCandidateDisposition !==
      "numerical_enclosure_protocol_failure_not_scientific_candidate_failure" ||
    receipt.frozenEnclosureGate !==
      "frozen_enclosure_target_failed_without_retuning"
  ) {
    return fail(
      "producer_provenance_invalid",
      "The producer outer-executor observation is incomplete or not clean.",
    );
  }
  const resources = receipt.resourceObservation;
  if (
    resources.requestedNodeHeapCeilingMegabytes !== 2304 ||
    resources.nodeHeapCeilingProcessArgumentObserved !== true ||
    !Number.isSafeInteger(resources.observedNodeHeapLimitBytes) ||
    resources.observedNodeHeapLimitBytes <= 0 ||
    resources.callerDeclaredExternalWallTimeCeilingMs !== 600000 ||
    resources.externalWallTimeEnforcement !==
      "caller_wrapper_declared_not_in_process_verified" ||
    resources.traceMaximumBytes !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.intervalTrace ||
    resources.traceSizeBytes <= 0 ||
    resources.traceSizeBytes > resources.traceMaximumBytes ||
    (resources.processPeakRssBytes !== null &&
      (!Number.isSafeInteger(resources.processPeakRssBytes) ||
        resources.processPeakRssBytes <= 0)) ||
    resources.peakRssObservationScope !==
      "host_process_lifetime_not_run_exclusive" ||
    resources.resourceEnvelopeIndependentlyVerified !== false
  ) {
    return fail(
      "producer_resource_observation_invalid",
      "The producer resource observation is incomplete or overstates independent enforcement.",
    );
  }
  if (
    !isSafeAbsoluteNonRootPath(receipt.outputDirectory.absolutePath) ||
    receipt.outputDirectory.prestate !==
      "absent_observed_before_exclusive_create" ||
    receipt.outputDirectory.creation !== "directory_created_exclusively" ||
    receipt.outputDirectory.freshness !== "new"
  ) {
    return fail(
      "producer_output_observation_invalid",
      "The producer output-directory observation is not exclusive and fresh.",
    );
  }
};

type BoundBytes = {
  central: Buffer;
  error: Buffer;
  trace: Buffer;
  derivationReceipt: Buffer;
};

const validateOutputObservations = (
  receipt: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
  bytes: BoundBytes,
): void => {
  const expected = new Map([
    [
      "metric_demand_tensor",
      {
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CENTRAL_FILE_NAME,
        bytes: bytes.central,
      },
    ],
    [
      "metric_demand_absolute_error_bound",
      {
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ERROR_FILE_NAME,
        bytes: bytes.error,
      },
    ],
    [
      "metric_demand_interval_trace",
      {
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TRACE_FILE_NAME,
        bytes: bytes.trace,
      },
    ],
    [
      "metric_demand_derivation_receipt",
      {
        relativePath:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_RECEIPT_FILE_NAME,
        bytes: bytes.derivationReceipt,
      },
    ],
  ]);
  if (receipt.outputs.length !== expected.size) {
    return fail(
      "producer_output_observation_invalid",
      "Exactly four non-run-receipt output observations are required.",
    );
  }
  const seen = new Set<string>();
  for (const output of receipt.outputs) {
    if (seen.has(output.role)) {
      return fail(
        "producer_output_observation_invalid",
        "Output roles must be unique.",
      );
    }
    seen.add(output.role);
    const target = expected.get(output.role);
    if (
      target == null ||
      output.relativePath !== target.relativePath ||
      !pathIsExactChild(
        receipt.outputDirectory.absolutePath,
        output.relativePath,
        output.absolutePath,
      ) ||
      output.sha256 !==
        sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(target.bytes) ||
      output.sizeBytes !== target.bytes.byteLength ||
      output.freshness !== "created_new_during_execution" ||
      output.prestate !== "absent_observed_before_exclusive_create" ||
      output.secureReadbackVerified !== true ||
      !isPlainRecord(output.filesystemIdentity) ||
      !/^[0-9]+$/.test(output.filesystemIdentity.dev) ||
      !/^[0-9]+$/.test(output.filesystemIdentity.ino) ||
      output.filesystemIdentity.sizeBytes !== String(target.bytes.byteLength) ||
      !/^[0-9]+$/.test(output.filesystemIdentity.mtimeNs) ||
      !/^[0-9]+$/.test(output.filesystemIdentity.ctimeNs)
    ) {
      return fail(
        "producer_output_bytes_mismatch",
        `Output observation or exact bytes mismatch for ${output.role}.`,
      );
    }
  }
};

const validateTerminalFailureReproduction = (
  receipt: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
): void => {
  const prior = receipt.priorTerminalObservation;
  const bitwise = receipt.bitwiseReproduction;
  if (
    receipt.runMode !== "receipt_capture_reproduction_of_terminal_v2_failure" ||
    prior?.authority !==
      "unauthenticated_partial_terminal_output_observation" ||
    !isSafeAbsoluteNonRootPath(prior.outputDirectoryAbsolutePath) ||
    prior.outputDirectoryAbsolutePath ===
      receipt.outputDirectory.absolutePath ||
    prior.configurationSha256 !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
    prior.implementationSourceSha256 !== null ||
    prior.executorReceiptPresent !== false ||
    prior.numericalGate !== "frozen_enclosure_target_failed_without_retuning" ||
    prior.maximumRelativeFrobeniusEnclosure !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT.maximumRelativeFrobeniusEnclosure ||
    prior.frozenRelativeEnclosureTarget !== 0.01 ||
    !Array.isArray(prior.outputs) ||
    prior.outputs.length !== 3 ||
    bitwise?.centralTensorSha256Identical !== true ||
    bitwise.deterministicErrorBoundSha256Identical !== true ||
    bitwise.intervalTraceSha256Identical !== true ||
    bitwise.allThreeOutputsBitwiseIdentical !== true
  ) {
    return fail(
      "producer_output_observation_invalid",
      "The terminal-v2 failure reproduction observation is incomplete.",
    );
  }
  for (let index = 0; index < prior.outputs.length; index += 1) {
    const previous = prior.outputs[index];
    const current = receipt.outputs[index];
    if (
      current == null ||
      previous.role !== current.role ||
      previous.relativePath !== current.relativePath ||
      !pathIsExactChild(
        prior.outputDirectoryAbsolutePath,
        previous.relativePath,
        previous.absolutePath,
      ) ||
      previous.sha256 !== current.sha256 ||
      previous.sizeBytes !== current.sizeBytes ||
      previous.freshness !==
        "preexisting_terminal_partial_securely_reread_for_reproduction" ||
      !isPlainRecord(previous.filesystemIdentity) ||
      !/^[0-9]+$/.test(previous.filesystemIdentity.dev) ||
      !/^[0-9]+$/.test(previous.filesystemIdentity.ino) ||
      previous.filesystemIdentity.sizeBytes !== String(previous.sizeBytes) ||
      !/^[0-9]+$/.test(previous.filesystemIdentity.mtimeNs) ||
      !/^[0-9]+$/.test(previous.filesystemIdentity.ctimeNs)
    ) {
      return fail(
        "producer_output_bytes_mismatch",
        "A current output is not bitwise identical to its prior terminal-v2 output.",
      );
    }
  }
};

const validateDerivationReceipt = (
  receipt: Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1,
  traceSha256: string,
  centralSha256: string,
  errorSha256: string,
): Buffer => {
  const derivation = receipt.derivationReceipt;
  if (
    derivation.artifactId !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
    derivation.contractVersion !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
    derivation.candidateId !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CANDIDATE_ID ||
    !sameCanonical(
      derivation.inputBindings,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
    ) ||
    derivation.derivation.formulaId !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID ||
    derivation.derivation.algorithmId !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID ||
    derivation.derivation.enclosureMethod !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD ||
    derivation.derivation.coverage !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE ||
    derivation.derivation.relativeEnclosureTarget !== 0.01 ||
    derivation.derivation.boundScope !==
      "deterministic_numerical_error_only_physical_constant_uncertainty_excluded" ||
    derivation.derivation.zeroBoundDisposition !==
      "strictly_positive_componentwise_bounds_required_pending_exact_zero_derivation_replay" ||
    !sameCanonical(derivation.derivation.constants, {
      speedOfLightMetersPerSecond: 299792458,
      newtonianGravitationalConstantSI: 6.6743e-11,
      newtonianGravitationalConstantStandardUncertaintySI: 1.5e-15,
      einsteinCouplingConvention: "T_hat_ab=(c^4/(8*pi*G))*G_hat_ab",
    }) ||
    derivation.derivation.intervalTraceSha256 !== traceSha256 ||
    derivation.implementation.sourceSha256 !==
      receipt.executionObservation.implementationSourceSha256 ||
    derivation.implementation.dependencyLockSha256 !==
      receipt.executionObservation.dependencyLockSha256 ||
    derivation.implementation.toolchainArtifactSha256 !==
      receipt.executionObservation.toolchainArtifactSha256 ||
    derivation.implementation.executableSha256 !==
      receipt.executionObservation.executableSha256 ||
    derivation.execution.authority !== "executor_observed" ||
    derivation.execution.gitCommitSha !==
      receipt.executionObservation.gitCommitSha ||
    derivation.execution.command !== receipt.executionObservation.command ||
    !sameCanonical(
      derivation.execution.argv,
      receipt.executionObservation.argv,
    ) ||
    derivation.execution.startedAt !== receipt.executionObservation.startedAt ||
    !isExactIso(derivation.execution.completedAt) ||
    Date.parse(derivation.execution.completedAt) <
      Date.parse(derivation.execution.startedAt) ||
    Date.parse(derivation.execution.completedAt) >
      Date.parse(receipt.executionObservation.completedAt) ||
    !Number.isFinite(derivation.execution.durationMs) ||
    derivation.execution.durationMs < 0 ||
    derivation.execution.exitCode !== 0 ||
    derivation.outputs.centralTensor.sha256 !== centralSha256 ||
    derivation.outputs.centralTensor.sizeBytes !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES ||
    derivation.outputs.deterministicAbsoluteErrorBound.sha256 !== errorSha256 ||
    derivation.outputs.deterministicAbsoluteErrorBound.sizeBytes !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_ARRAY_SIZE_BYTES ||
    derivation.outputs.deterministicAbsoluteErrorBound.unit !== "J/m^3" ||
    !sameCanonical(
      derivation.outputs.deterministicAbsoluteErrorBound.shape,
      [64, 10],
    ) ||
    !sameCanonical(
      derivation.outputs.deterministicAbsoluteErrorBound.componentOrder,
      NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
    ) ||
    derivation.outputs.intervalTrace.sha256 !== traceSha256 ||
    derivation.verificationStatus !==
      "metric_demand_derivation_executor_provenance_unverified" ||
    !sameCanonical(
      derivation.claimLocks,
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS,
    ) ||
    derivation.integrity.hashAlgorithm !== "sha256" ||
    derivation.integrity.canonicalization !==
      "utf8_lexicographic_object_keys_json_v1" ||
    !validSha(derivation.integrity.receiptSha256)
  ) {
    return fail(
      "derivation_receipt_integrity_invalid",
      "The embedded derivation receipt is not an exact frozen binding.",
    );
  }
  const { receiptSha256, ...integrity } = derivation.integrity;
  const unsigned = { ...derivation, integrity };
  const recomputed = sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(unsigned),
  );
  if (receiptSha256 !== recomputed) {
    return fail(
      "derivation_receipt_integrity_invalid",
      "The embedded derivation-receipt integrity hash is invalid.",
    );
  }
  return Buffer.from(
    canonicalNhm2ConformallyFlatNeedleMetricDemandJson(derivation),
    "utf8",
  );
};

export type Nhm2ConformallyFlatNeedleMetricDemandStructuralReplaySummaryV1 = {
  maximumRelativeFrobeniusEnclosure: number;
  minimumDenominatorLowerBound: number;
  strictlyPositiveComponentErrorBoundCount: number;
  targetMetAtEverySample: boolean;
  frozenGateDisposition:
    | "producer_self_check_met_but_not_server_replayed"
    | "frozen_enclosure_target_failed_without_retuning";
};

const replayTraceRelations = (
  trace: Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1,
  centralBytes: Buffer,
  errorBytes: Buffer,
): Nhm2ConformallyFlatNeedleMetricDemandStructuralReplaySummaryV1 => {
  if (
    trace.artifactId !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_ARTIFACT_ID ||
    trace.contractVersion !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTERVAL_TRACE_CONTRACT_VERSION ||
    trace.authority !==
      "producer_generated_diagnostic_interval_trace_not_server_replay" ||
    trace.configurationSha256 !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256 ||
    !sameCanonical(
      trace.configuration,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION,
    ) ||
    trace.configuration.formulaId !==
      NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID ||
    trace.configuration.integrationAlgorithmId !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID ||
    !sameCanonical(trace.configuration.priorProtocolLineage, {
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.artifactId,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.contractVersion,
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
      authority:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION.authority,
    }) ||
    trace.configuration.dimensionReduction !==
      "exact_static_time_factor_cancellation_in_normalized_spacetime_smear" ||
    !sameCanonical(
      trace.configuration.componentOrder,
      NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
    ) ||
    !sameCanonical(
      trace.configuration.constants,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION.constants,
    ) ||
    trace.derivation.conformalEinsteinTensorFormula !==
      "G_AB=-2*omega_,AB+2*omega_,A*omega_,B+2*eta_AB*box_eta(omega)+eta_AB*(partial_omega)^2 in conformal-inertial coordinate components before the equivalent pulled-back tetrad projection" ||
    trace.derivation.orthonormalSmearFormula !==
      "D_n,AB=(c^4/(8*pi*G))*integral(qx*qy*qz*Omega^2*G_AB*d3u)/integral(qx*qy*qz*Omega^4*d3u); pullback by F and projection on F_*^-1(Omega^-1*d/dX^A) preserve these component labels" ||
    trace.derivation.compactBumpDerivativeIdentities.first !==
      "db/ds=-b/(1-s)^2" ||
    trace.derivation.compactBumpDerivativeIdentities.second !==
      "d2b/ds2=b*(2*s-1)/(1-s)^4" ||
    trace.derivation.integrationEnclosureFormula !==
      "for_each_cell_I: integral_I(f) is enclosed by volume(I)*f(midpoint(I)) plus_or_minus volume(I)*sum_i(h_i^2*sup_I|partial_i^2 f|)/24; every f(midpoint) and pure_second_derivative is interval_evaluated; denominator also intersects a positive natural_Darboux enclosure" ||
    trace.derivation.compactTestBumpBoundaryDerivativeProof !==
      "with t=1/(1-u^2)>=1: |q'|=2*|u|*e^(1-t)*t^2<3; q''=e^(1-t)*(4*t^4-12*t^3+6*t^2), whose absolute value is <=54 on 1<=t<=3 by endpoint_and_stationary_point_check and <1024/e^3<51 for t>=3; implementation widens to |q''|<=160" ||
    !sameCanonical(trace.derivation.exactZeroComponents, [
      "T01",
      "T02",
      "T03",
    ]) ||
    trace.derivation.exactZeroReason !==
      "static_conformal_factor_and_diagonal_conformal_inertial_metric" ||
    !sameCanonical(trace.arithmeticEvidence, {
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
    }) ||
    !sameCanonical(
      trace.authorityBlockers,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_AUTHORITY_BLOCKERS,
    ) ||
    !sameCanonical(
      trace.claimLocks,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CLAIM_LOCKS,
    )
  ) {
    return fail(
      "interval_trace_semantics_invalid",
      "Trace semantics do not match the frozen formula/reference binding.",
    );
  }

  if (
    !Array.isArray(trace.samples) ||
    trace.samples.length !== 64 ||
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.samplePoints
      .length !== 64
  ) {
    return fail(
      "interval_trace_coverage_invalid",
      "The trace does not contain exactly 64 frozen samples.",
    );
  }

  let maximumRelativeFrobeniusEnclosure = 0;
  let minimumDenominatorLowerBound = Number.POSITIVE_INFINITY;
  let strictlyPositiveComponentErrorBoundCount = 0;
  let targetMetAtEverySample = true;

  for (let sampleIndex = 0; sampleIndex < 64; sampleIndex += 1) {
    const sample = trace.samples[sampleIndex];
    const frozenPoint =
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.samplePoints[
        sampleIndex
      ];
    const multiplier = frozenPoint.multiplier;
    const sx = Number(multiplier.x) < 0 ? -1 : 1;
    const sy = Number(multiplier.y) < 0 ? -1 : 1;
    const sz = Number(multiplier.z) < 0 ? -1 : 1;
    const expectedParity = [1, 1, 1, 1, 1, sx * sy, sx * sz, 1, sy * sz, 1];
    const expectedSymmetryKey = [
      Math.abs(Number(multiplier.x)),
      Math.abs(Number(multiplier.y)),
      Math.abs(Number(multiplier.z)),
    ]
      .map((entry) => entry.toString())
      .join(":");
    if (
      sample.ordinal !== sampleIndex ||
      !sameCanonical(sample.multiplier, multiplier) ||
      !sameCanonical(
        sample.inertialConformalCoordinatesM,
        frozenPoint.inertialConformalCoordinatesM,
      ) ||
      sample.symmetrySourceKey !== expectedSymmetryKey ||
      !sameCanonical(sample.parityTransform, expectedParity) ||
      !Array.isArray(sample.levels) ||
      sample.levels.length !==
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS.length ||
      !Array.isArray(sample.selectedComponentIntervalsSI) ||
      sample.selectedComponentIntervalsSI.length !== 10 ||
      !Array.isArray(sample.centralComponentsSI) ||
      sample.centralComponentsSI.length !== 10 ||
      !Array.isArray(sample.deterministicAbsoluteErrorBoundsSI) ||
      sample.deterministicAbsoluteErrorBoundsSI.length !== 10
    ) {
      return fail(
        "interval_trace_coverage_invalid",
        "Sample identity, parity, or component coverage drifted.",
        `/samples/${sampleIndex}`,
      );
    }

    let previousCumulative: Array<readonly [number, number]> | null = null;
    let previousWidths: number[] | null = null;
    for (
      let levelIndex = 0;
      levelIndex < sample.levels.length;
      levelIndex += 1
    ) {
      const level = sample.levels[levelIndex];
      const partitions =
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_REFINEMENT_LEVELS[
          levelIndex
        ];
      const denominator = interval(
        level.denominatorIntegral,
        `/samples/${sampleIndex}/levels/${levelIndex}/denominatorIntegral`,
      );
      if (
        level.partitionsPerAxis !== partitions ||
        level.cellCount !== partitions ** 3 ||
        level.denominatorStrictlyPositive !== true ||
        !(denominator[0] > 0) ||
        !Array.isArray(level.componentDemandIntervalsSI) ||
        level.componentDemandIntervalsSI.length !== 10 ||
        !Array.isArray(level.cumulativeIntersectionIntervalsSI) ||
        level.cumulativeIntersectionIntervalsSI.length !== 10 ||
        !Array.isArray(level.cumulativeWidthsSI) ||
        level.cumulativeWidthsSI.length !== 10
      ) {
        return fail(
          "interval_trace_coverage_invalid",
          "A refinement level is incomplete or has a nonpositive denominator.",
          `/samples/${sampleIndex}/levels/${levelIndex}`,
        );
      }
      minimumDenominatorLowerBound = Math.min(
        minimumDenominatorLowerBound,
        denominator[0],
      );
      const nextCumulative: Array<readonly [number, number]> = [];
      for (let componentIndex = 0; componentIndex < 10; componentIndex += 1) {
        const current = interval(
          level.componentDemandIntervalsSI[componentIndex],
          `/samples/${sampleIndex}/levels/${levelIndex}/componentDemandIntervalsSI/${componentIndex}`,
        );
        const reportedCumulative = interval(
          level.cumulativeIntersectionIntervalsSI[componentIndex],
          `/samples/${sampleIndex}/levels/${levelIndex}/cumulativeIntersectionIntervalsSI/${componentIndex}`,
        );
        const expectedCumulative =
          previousCumulative == null
            ? current
            : ([
                Math.max(previousCumulative[componentIndex][0], current[0]),
                Math.min(previousCumulative[componentIndex][1], current[1]),
              ] as const);
        if (
          expectedCumulative[0] > expectedCumulative[1] ||
          !sameNumber(reportedCumulative[0], expectedCumulative[0]) ||
          !sameNumber(reportedCumulative[1], expectedCumulative[1]) ||
          !Number.isFinite(level.cumulativeWidthsSI[componentIndex]) ||
          !sameNumber(
            level.cumulativeWidthsSI[componentIndex],
            replayOutwardUp(reportedCumulative[1] - reportedCumulative[0]),
          ) ||
          (previousWidths != null &&
            level.cumulativeWidthsSI[componentIndex] >
              previousWidths[componentIndex])
        ) {
          return fail(
            "interval_trace_enclosure_invalid",
            "Cumulative interval intersection or width is inconsistent.",
            `/samples/${sampleIndex}/levels/${levelIndex}/cumulativeIntersectionIntervalsSI/${componentIndex}`,
          );
        }
        nextCumulative.push(reportedCumulative);
      }
      previousCumulative = nextCumulative;
      previousWidths = [...level.cumulativeWidthsSI];
    }
    if (previousCumulative == null) {
      return fail(
        "interval_trace_coverage_invalid",
        "No refinement levels were replayed.",
      );
    }

    const central: number[] = [];
    const errors: number[] = [];
    for (let componentIndex = 0; componentIndex < 10; componentIndex += 1) {
      const selected = interval(
        sample.selectedComponentIntervalsSI[componentIndex],
        `/samples/${sampleIndex}/selectedComponentIntervalsSI/${componentIndex}`,
      );
      const expectedSelected = previousCumulative[componentIndex];
      const midpoint = selected[0] + (selected[1] - selected[0]) / 2;
      const radius = Math.max(midpoint - selected[0], selected[1] - midpoint);
      const expectedError = Math.max(Number.MIN_VALUE, outwardUp(radius));
      const reportedCentral = sample.centralComponentsSI[componentIndex];
      const reportedError =
        sample.deterministicAbsoluteErrorBoundsSI[componentIndex];
      const byteOffset = (sampleIndex * 10 + componentIndex) * 8;
      const centralFromBytes = centralBytes.readDoubleLE(byteOffset);
      const errorFromBytes = errorBytes.readDoubleLE(byteOffset);
      if (
        !sameNumber(selected[0], expectedSelected[0]) ||
        !sameNumber(selected[1], expectedSelected[1]) ||
        !Number.isFinite(reportedCentral) ||
        !Number.isFinite(reportedError) ||
        !(reportedError > 0) ||
        !sameNumber(reportedCentral, midpoint) ||
        !sameNumber(reportedError, expectedError) ||
        !sameNumber(centralFromBytes, reportedCentral) ||
        !sameNumber(errorFromBytes, reportedError) ||
        reportedCentral - reportedError > selected[0] ||
        reportedCentral + reportedError < selected[1]
      ) {
        return fail(
          "interval_trace_enclosure_invalid",
          "Selected interval, midpoint, error radius, or float64 bytes disagree.",
          `/samples/${sampleIndex}/selectedComponentIntervalsSI/${componentIndex}`,
        );
      }
      central.push(reportedCentral);
      errors.push(reportedError);
      strictlyPositiveComponentErrorBoundCount += 1;
    }
    for (const exactZeroIndex of [1, 2, 3]) {
      if (
        central[exactZeroIndex] !== 0 ||
        previousCumulative[exactZeroIndex][0] > 0 ||
        previousCumulative[exactZeroIndex][1] < 0
      ) {
        return fail(
          "interval_trace_semantics_invalid",
          "A frozen exact-zero static-flow component is nonzero.",
          `/samples/${sampleIndex}/centralComponentsSI/${exactZeroIndex}`,
        );
      }
    }
    const centralFrobenius = stableFrobenius(central);
    const errorFrobenius = stableFrobenius(errors);
    const squaredSelfCheck =
      replayNhm2ConformallyFlatNeedleOutwardSquaredFrobeniusGate(
        central,
        errors,
      );
    const relative = squaredSelfCheck.displayedRatioUpper;
    if (
      !Number.isFinite(centralFrobenius) ||
      !(centralFrobenius > 0) ||
      !Number.isFinite(errorFrobenius) ||
      !(errorFrobenius > 0) ||
      !Number.isFinite(relative) ||
      !sameNumber(sample.centralFrobeniusSI, centralFrobenius) ||
      !sameNumber(sample.deterministicErrorFrobeniusSI, errorFrobenius) ||
      !sameNumber(sample.relativeFrobeniusEnclosure, relative) ||
      !sameNumber(
        sample.outwardSquaredSelfCheck
          ?.deterministicErrorFrobeniusSquaredUpperSI2,
        squaredSelfCheck.deterministicErrorFrobeniusSquaredUpperSI2,
      ) ||
      !sameNumber(
        sample.outwardSquaredSelfCheck?.centralFrobeniusSquaredLowerSI2,
        squaredSelfCheck.centralFrobeniusSquaredLowerSI2,
      ) ||
      !sameNumber(
        sample.outwardSquaredSelfCheck
          ?.onePercentCentralFrobeniusSquaredLowerSI2,
        squaredSelfCheck.onePercentCentralFrobeniusSquaredLowerSI2,
      ) ||
      sample.outwardSquaredSelfCheck?.passed !== squaredSelfCheck.passed
    ) {
      return fail(
        "interval_trace_enclosure_invalid",
        "The multiplicity-weighted Frobenius enclosure gate failed.",
        `/samples/${sampleIndex}/relativeFrobeniusEnclosure`,
      );
    }
    if (!squaredSelfCheck.passed) targetMetAtEverySample = false;
    maximumRelativeFrobeniusEnclosure = Math.max(
      maximumRelativeFrobeniusEnclosure,
      relative,
    );
  }

  if (
    strictlyPositiveComponentErrorBoundCount !== 640 ||
    !Number.isFinite(minimumDenominatorLowerBound) ||
    !(minimumDenominatorLowerBound > 0) ||
    trace.summary.sampleCount !== 64 ||
    trace.summary.componentCount !== 10 ||
    trace.summary.strictlyPositiveComponentErrorBoundCount !== 640 ||
    trace.summary.allComponentErrorBoundsStrictlyPositive !== true ||
    !sameNumber(
      trace.summary.maximumRelativeFrobeniusEnclosure,
      maximumRelativeFrobeniusEnclosure,
    ) ||
    trace.summary.frozenRelativeEnclosureTarget !== 0.01 ||
    trace.summary.targetMetAtEverySample !== targetMetAtEverySample ||
    trace.summary.frozenGateDisposition !==
      (targetMetAtEverySample
        ? "producer_self_check_met_but_not_server_replayed"
        : "frozen_enclosure_target_failed_without_retuning") ||
    !sameNumber(
      trace.summary.minimumDenominatorLowerBound,
      minimumDenominatorLowerBound,
    ) ||
    trace.summary.allDenominatorLowerBoundsStrictlyPositive !== true ||
    trace.summary.allCumulativeWidthsNonincreasing !== true
  ) {
    return fail(
      "interval_trace_summary_invalid",
      "The trace summary does not exactly match the replayed trace relations.",
    );
  }
  return {
    maximumRelativeFrobeniusEnclosure,
    minimumDenominatorLowerBound,
    strictlyPositiveComponentErrorBoundCount,
    targetMetAtEverySample,
    frozenGateDisposition: targetMetAtEverySample
      ? "producer_self_check_met_but_not_server_replayed"
      : "frozen_enclosure_target_failed_without_retuning",
  };
};

const validateImplementationObservation = (
  value: unknown,
  producerSourceSha256: string,
): Nhm2ConformallyFlatNeedleMetricDemandIndependentReplayIdentityV1 => {
  if (
    !isPlainRecord(value) ||
    !exactKeys(value, [
      "implementationSourceSha256",
      "dependencyLockSha256",
      "toolchainArtifactSha256",
      "executableSha256",
    ]) ||
    !validSha(value.implementationSourceSha256) ||
    !validSha(value.dependencyLockSha256) ||
    !validSha(value.toolchainArtifactSha256) ||
    !validSha(value.executableSha256) ||
    value.implementationSourceSha256 === producerSourceSha256
  ) {
    return fail(
      "verification_input_invalid",
      "The structural replayer implementation observation is incomplete or aliases the producer source.",
    );
  }
  return {
    implementationId:
      "server_structural_trace_replayer_without_transcendental_engine/v1",
    implementationSourceSha256: value.implementationSourceSha256,
    dependencyLockSha256: value.dependencyLockSha256,
    toolchainArtifactSha256: value.toolchainArtifactSha256,
    executableSha256: value.executableSha256,
    implementationContractSha256:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_STRUCTURAL_REPLAYER_CONTRACT_SHA256,
    sourceRelationshipToProducer:
      "separate_server_module_but_no_independent_transcendental_implementation",
  };
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

/**
 * Replays only the relations reported in canonical producer trace bytes. This
 * surface deliberately has no receipt, candidate, or authority output and is
 * not an independent transcendental/cellwise enclosure implementation.
 */
export const replayNhm2ConformallyFlatNeedleMetricDemandStructuralTrace =
  (input: {
    centralTensorBytes: Uint8Array;
    absoluteErrorBoundBytes: Uint8Array;
    intervalTraceBytes: Uint8Array;
  }): Readonly<Nhm2ConformallyFlatNeedleMetricDemandStructuralReplaySummaryV1> => {
    if (
      !isPlainRecord(input) ||
      !exactKeys(input, [
        "centralTensorBytes",
        "absoluteErrorBoundBytes",
        "intervalTraceBytes",
      ])
    ) {
      return fail(
        "verification_input_invalid",
        "Structural replay input must be an exact plain-data request.",
      );
    }
    const centralBytes = copyBytes(
      input.centralTensorBytes,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.centralTensor,
      true,
      "centralTensorBytes",
    );
    const errorBytes = copyBytes(
      input.absoluteErrorBoundBytes,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.absoluteErrorBound,
      true,
      "absoluteErrorBoundBytes",
    );
    const traceBytes = copyBytes(
      input.intervalTraceBytes,
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.intervalTrace,
      false,
      "intervalTraceBytes",
    );
    const trace =
      parseCanonicalJson<Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1>(
        traceBytes,
        "interval_trace_noncanonical",
        "metric-demand interval trace",
      );
    return Object.freeze(replayTraceRelations(trace, centralBytes, errorBytes));
  };

export const verifyNhm2ConformallyFlatNeedleMetricDemandDerivation = (
  input: VerifyNhm2ConformallyFlatNeedleMetricDemandDerivationInput,
): Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1 => {
  if (
    !isPlainRecord(input) ||
    !exactKeys(input, [
      "producerRunReceiptBytes",
      "centralTensorBytes",
      "absoluteErrorBoundBytes",
      "intervalTraceBytes",
      "structuralReplayerImplementationObservation",
    ])
  ) {
    return fail(
      "verification_input_invalid",
      "Verifier input must be an exact plain-data request.",
    );
  }
  const producerReceiptBytes = copyBytes(
    input.producerRunReceiptBytes,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.producerRunReceipt,
    false,
    "producerRunReceiptBytes",
  );
  const centralBytes = copyBytes(
    input.centralTensorBytes,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.centralTensor,
    true,
    "centralTensorBytes",
  );
  const errorBytes = copyBytes(
    input.absoluteErrorBoundBytes,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.absoluteErrorBound,
    true,
    "absoluteErrorBoundBytes",
  );
  const traceBytes = copyBytes(
    input.intervalTraceBytes,
    NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_MAX_BYTES.intervalTrace,
    false,
    "intervalTraceBytes",
  );
  const receipt =
    parseCanonicalJson<Nhm2ConformallyFlatNeedleMetricDemandIntervalRunReceiptV1>(
      producerReceiptBytes,
      "producer_receipt_noncanonical",
      "producer run receipt",
    );
  if (
    !hasValidNhm2ConformallyFlatNeedleMetricDemandRunReceiptIntegrity(receipt)
  ) {
    return fail(
      "producer_receipt_integrity_invalid",
      "The canonical producer run receipt failed its binding-only integrity contract.",
    );
  }
  validateProducerObservation(receipt);

  const centralSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(centralBytes);
  const errorSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(errorBytes);
  const traceSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(traceBytes);
  const derivationReceiptBytes = validateDerivationReceipt(
    receipt,
    traceSha256,
    centralSha256,
    errorSha256,
  );
  validateOutputObservations(receipt, {
    central: centralBytes,
    error: errorBytes,
    trace: traceBytes,
    derivationReceipt: derivationReceiptBytes,
  });
  validateTerminalFailureReproduction(receipt);
  const trace =
    parseCanonicalJson<Nhm2ConformallyFlatNeedleMetricDemandIntervalTraceV1>(
      traceBytes,
      "interval_trace_noncanonical",
      "metric-demand interval trace",
    );
  const traceReplay = replayTraceRelations(trace, centralBytes, errorBytes);
  if (
    receipt.frozenEnclosureGate !== traceReplay.frozenGateDisposition ||
    traceReplay.targetMetAtEverySample !== false ||
    traceReplay.maximumRelativeFrobeniusEnclosure !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT.maximumRelativeFrobeniusEnclosure ||
    traceReplay.minimumDenominatorLowerBound !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_TERMINAL_V2_NUMERICAL_RESULT.minimumDenominatorLowerBound ||
    receipt.candidateInputAdmissible !== false
  ) {
    return fail(
      "interval_trace_summary_invalid",
      "The run receipt does not preserve the recomputed frozen enclosure-gate disposition.",
    );
  }

  const independentIdentity = validateImplementationObservation(
    input.structuralReplayerImplementationObservation,
    receipt.executionObservation.implementationSourceSha256,
  );
  const producerReceiptSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(producerReceiptBytes);
  const derivationReceiptSha256 =
    sha256Nhm2ConformallyFlatNeedleMetricDemandBytes(derivationReceiptBytes);
  const verificationId = createHash("sha256")
    .update(
      canonicalNhm2ConformallyFlatNeedleMetricDemandJson({
        producerReceiptSha256,
        centralSha256,
        errorSha256,
        traceSha256,
        derivationReceiptSha256,
        formulaReferenceSha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_SHA256,
        independentIdentity,
      }),
      "utf8",
    )
    .digest("hex");

  const unsigned = {
    artifactId:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CONTRACT_VERSION,
    authority: "diagnostic_structural_binding_only" as const,
    status:
      "blocked_structural_replay_only_candidate_input_inadmissible" as const,
    verificationId,
    producerBinding: {
      producerReceiptCanonicalBytes: {
        sha256: producerReceiptSha256,
        sizeBytes: producerReceiptBytes.byteLength,
      },
      producerReceiptIntegrityValid: true as const,
      producerReceiptAuthorityPreservedAsBindingOnly: true as const,
      candidateInputAdmissible: false as const,
      protocolLineage: "v2_midpoint_hessian_interval" as const,
      integrationAlgorithmId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INTEGRATION_ALGORITHM_ID,
      lineageSeparationExact: true as const,
      priorV1FailureObservation: {
        sha256:
          NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_V1_FAILURE_OBSERVATION_SHA256,
        authority: "unauthenticated_development_observation_only" as const,
        numericalGate: "failed_0p01_enclosure_target" as const,
        scientificCandidateDisposition:
          "inconclusive_not_a_candidate_failure" as const,
        executorAuthenticated: false as const,
        outputBytesPersisted: false as const,
        retuned: false as const,
        promotedIntoV2Evidence: false as const,
      },
      producerFrozenEnclosureGate: receipt.frozenEnclosureGate,
      configurationSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_CONFIGURATION_SHA256,
      formulaReferenceSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_FORMULA_REFERENCE_SHA256,
      sixFrozenScienceInputBindings:
        NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_INPUT_BINDINGS,
      centralTensorBytes: {
        sha256: centralSha256,
        sizeBytes: centralBytes.byteLength,
      },
      absoluteErrorBoundBytes: {
        sha256: errorSha256,
        sizeBytes: errorBytes.byteLength,
      },
      canonicalIntervalTraceBytes: {
        sha256: traceSha256,
        sizeBytes: traceBytes.byteLength,
      },
      canonicalDerivationReceiptBytes: {
        sha256: derivationReceiptSha256,
        sizeBytes: derivationReceiptBytes.byteLength,
      },
    },
    outerExecutorObservation: { ...receipt.executionObservation },
    exclusiveOutputObservation: {
      outputDirectory: { ...receipt.outputDirectory },
      outputs: receipt.outputs.map((output) => ({
        ...output,
        filesystemIdentity: { ...output.filesystemIdentity },
      })),
      allOutputsAbsentBeforeExclusiveCreate: true as const,
      allOutputsSecurelyReread: true as const,
    },
    terminalFailureReproduction: {
      runMode: "receipt_capture_reproduction_of_terminal_v2_failure" as const,
      priorObservation: {
        ...receipt.priorTerminalObservation,
        outputs: receipt.priorTerminalObservation.outputs.map((output) => ({
          ...output,
          filesystemIdentity: { ...output.filesystemIdentity },
        })),
      },
      bitwiseReproduction: { ...receipt.bitwiseReproduction },
      priorObservationAuthorityNotPromoted: true as const,
      candidateInputAdmissible: false as const,
    },
    structuralReplay: {
      traceParsedWithBoundedFatalUtf8CanonicalJson: true as const,
      frozenConfigurationExact: true as const,
      frozenReferenceAndFormulaBindingExact: true as const,
      unitsComponentOrderConstantsAndConventionsExact: true as const,
      exactStaticFlowTimeFactorCancellationBound: true as const,
      v2MidpointHessianTraceSemanticsExact: true as const,
      priorV1FailureObservationNotPromoted: true as const,
      sampleAndComponentCoverage64By10Exact: true as const,
      allRefinementLevelsPresentWithoutCoverageGaps: true as const,
      allDenominatorLowerBoundsStrictlyPositive: true as const,
      all640ErrorBoundsStrictlyPositive: true as const,
      intervalMidpointAndRadiusRelationsRecomputed: true as const,
      cumulativeIntersectionRelationsRecomputed: true as const,
      centralAndErrorFloat64BytesExactlyMatched: true as const,
      multiplicityWeightedFrobeniusRatiosRecomputed: true as const,
      producerReportedTargetMetAtEverySample: false as const,
      reportedFrozenEnclosureGate:
        "frozen_enclosure_target_failed_without_retuning" as const,
      maximumReportedRelativeFrobeniusEnclosure:
        traceReplay.maximumRelativeFrobeniusEnclosure,
      minimumReportedDenominatorLowerBound:
        traceReplay.minimumDenominatorLowerBound,
      traceGateDispositionExactlyRecomputed: true as const,
      candidateInputAdmissible: false as const,
      traceSummaryExactlyRecomputed: true as const,
      traceSha256AndDerivationReceiptIntegrityExact: true as const,
      mathematicalScope:
        "reported_trace_relations_only_not_independent_integrand_or_transcendental_enclosure_replay" as const,
    },
    independentReplay: {
      identity: independentIdentity,
      engineStatus: "not_implemented" as const,
      transcendentalPrimitivesRecomputed: false as const,
      cellwiseIntegrandsRecomputed: false as const,
      intervalEnclosuresIndependentlyEstablished: false as const,
      producerImplementationImportedOrCalled: false as const,
      selfAuthoredStatusCanClearAuthority: false as const,
    },
    resourceEnvelope: {
      producerObservation: { ...receipt.resourceObservation },
      traceBytesBoundedByVerifier: true as const,
      producerExecutionModel: "in_process_synchronous_derivation" as const,
      independentlyVerifiedWallTimeCap: false as const,
      independentlyVerifiedHeapCap: false as const,
      independentlyVerifiedRssCap: false as const,
      resourceSafetyAuthority: false as const,
    },
    authorityBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_BLOCKERS,
    claimLocks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_METRIC_DEMAND_DERIVATION_VERIFICATION_CLAIM_LOCKS,
    integrity: {
      hashAlgorithm: "sha256" as const,
      canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
    },
  };
  const artifact: Nhm2ConformallyFlatNeedleMetricDemandDerivationVerificationV1 =
    {
      ...unsigned,
      integrity: {
        ...unsigned.integrity,
        artifactSha256:
          computeNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationSha256(
            unsigned,
          ),
      },
    };
  if (
    !hasValidNhm2ConformallyFlatNeedleMetricDemandDerivationVerificationIntegrity(
      artifact,
    )
  ) {
    return fail(
      "verification_artifact_integrity_failed",
      "The structurally blocked verification artifact failed integrity validation.",
    );
  }
  return deepFreeze(artifact);
};
