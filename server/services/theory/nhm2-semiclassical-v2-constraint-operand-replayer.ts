import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
  collectNhm2SemiclassicalV2ConstraintOperandArrays,
  nhm2SemiclassicalV2ConstraintOperandReplayViolations,
  type Nhm2SemiclassicalV2ConstraintOperandArrayV1,
  type Nhm2SemiclassicalV2ConstraintOperandFamilyId,
  type Nhm2SemiclassicalV2ConstraintOperandLevelId,
  type Nhm2SemiclassicalV2ConstraintOperandReplayV1,
  type Nhm2SemiclassicalV2ConstraintOperandRole,
} from "../../../shared/contracts/nhm2-semiclassical-v2-constraint-operand-replay.v1";

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_ARTIFACT_ID =
  "nhm2.semiclassical_v2_constraint_operand_server_replay_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_operand_server_replayer/v1" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_INPUT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_operand_server_replay_input/v1" as const;
export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-constraint-observation-closure/v1\n" as const;

export type Nhm2SemiclassicalV2ConstraintOperandFileObservationV1 = Readonly<{
  observationMode: "caller_supplied_secure_file_reader";
  operandRole: Nhm2SemiclassicalV2ConstraintOperandRole;
  path: string;
  sha256: string;
  sizeBytes: number;
  freshness: "new";
  observedAt: string;
  scientificPresealSealKey: string;
  bytes: Uint8Array;
}>;

export type Nhm2SemiclassicalV2ConstraintOperandReplayInputV1 = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_INPUT_CONTRACT_VERSION;
  manifest: unknown;
  fileObservations: readonly Nhm2SemiclassicalV2ConstraintOperandFileObservationV1[];
}>;

export type Nhm2SemiclassicalV2ConstraintOperandReplayIssueCode =
  | "input_snapshot_invalid"
  | "input_shape_invalid"
  | "manifest_invalid"
  | "file_observation_count_invalid"
  | "file_observation_shape_invalid"
  | "file_observation_metadata_invalid"
  | "file_bytes_full_view_invalid"
  | "file_bytes_backing_buffer_not_unique"
  | "file_sha256_mismatch"
  | "decoded_operand_nonfinite"
  | "decoded_uncertainty_negative"
  | "computed_target_exact_echo_forbidden"
  | "arithmetic_nonfinite_or_overflow"
  | "submitted_residual_mismatch_tolerance_exceeded"
  | "central_residual_upper95_tolerance_exceeded"
  | "regulator_zero_or_nonpositive_interlevel_bound"
  | "regulator_monotonicity_failed"
  | "regulator_order_failed"
  | "regulator_error_tolerance_exceeded"
  | "scientific_preseal_not_server_resolved"
  | "constraint_joint_uncertainty_coverage_not_server_verified"
  | "constraint_target_derivation_not_server_replayed"
  | "filesystem_observation_authority_not_established"
  | "internal_replay_error";

export type Nhm2SemiclassicalV2ConstraintOperandReplayIssue = Readonly<{
  code: Nhm2SemiclassicalV2ConstraintOperandReplayIssueCode;
  disposition: "fail" | "blocked";
  pointer: string | null;
  detail: string;
}>;

export type Nhm2SemiclassicalV2ConstraintOperandLevelReplay = Readonly<{
  levelId: Nhm2SemiclassicalV2ConstraintOperandLevelId;
  serverResidual: readonly number[];
  submittedResidualMismatchLInf: number;
  residualUpper95: number;
}>;

export type Nhm2SemiclassicalV2ConstraintOperandConvergenceReplay = Readonly<{
  d01: readonly number[];
  d12: readonly number[];
  E0: readonly number[];
  E1: readonly number[];
  E2: readonly number[];
  UE0: readonly number[];
  UE1: readonly number[];
  UE2: readonly number[];
  q0: number;
  q1: number;
  q2: number;
  D01Lower: number;
  D01Upper: number;
  D12Lower: number;
  D12Upper: number;
  pLower: number;
}>;

export type Nhm2SemiclassicalV2ConstraintOperandFamilyReplay = Readonly<{
  familyId: Nhm2SemiclassicalV2ConstraintOperandFamilyId;
  producerResidualMismatchLInf: number;
  levels: readonly Nhm2SemiclassicalV2ConstraintOperandLevelReplay[];
  convergence: Nhm2SemiclassicalV2ConstraintOperandConvergenceReplay;
}>;

export const NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_SERVICE_BOUNDARY =
  Object.freeze({
    calculationImplementationPresent: true as const,
    serviceIntegrationComplete: false as const,
    filesystemReadPerformed: false as const,
    filesystemSecurityEstablished: false as const,
    persistedScientificPresealResolved: false as const,
    jointUncertaintyCoverageVerified: false as const,
    targetDerivationServerReplayed: false as const,
    candidateAdmission: false as const,
    replayAuthority: false as const,
    agreementAuthority: false as const,
    lampAuthority: false as const,
    physicalClaimAuthority: false as const,
  });

export type Nhm2SemiclassicalV2ConstraintOperandReplayReceiptV1 = Readonly<{
  artifactId: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_CONTRACT_VERSION;
  serverCalculationImplementation: true;
  diagnosticOnly: true;
  arithmeticDisposition: "pass" | "fail" | "blocked";
  overallDisposition: "blocked";
  calculationComplete: boolean;
  firstIssue: Nhm2SemiclassicalV2ConstraintOperandReplayIssueCode | null;
  issues: readonly Nhm2SemiclassicalV2ConstraintOperandReplayIssue[];
  inputBinding: Readonly<{
    candidateId: string;
    candidateManifestSha256: string;
    scientificPresealSealKey: string;
    manifestInventorySha256: string;
    implementationRole: "primary" | "independent";
    implementationId: string;
    executionCommitSha: string;
    executionCommand: string;
    executionStartedAt: string;
    executionCompletedAt: string;
    observationCount: 63;
    aggregateBytes: number;
    observationClosureSha256Domain: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN;
    observationClosureSha256: string;
  }> | null;
  families: readonly Nhm2SemiclassicalV2ConstraintOperandFamilyReplay[];
  provenanceBoundary: Readonly<{
    inputSnapshotAttemptedExactlyOnce: true;
    inputSnapshotCompleted: boolean;
    manifestStructurallyValidatedAfterSnapshot: boolean;
    everyFileByteStringRehashedAndDecoded: boolean;
    callerSuppliedObservationOnly: true;
    filesystemReadPerformedByService: false;
    filesystemSecurityEstablished: false;
    persistedScientificPresealResolved: false;
    jointUncertaintyCoverageServerVerified: false;
    targetDerivationServerReplayed: false;
  }>;
  serviceBoundary: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_SERVICE_BOUNDARY;
  authorityBoundary: typeof NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY;
}>;

const INPUT_KEYS = ["contractVersion", "manifest", "fileObservations"] as const;
const OBSERVATION_KEYS = [
  "observationMode",
  "operandRole",
  "path",
  "sha256",
  "sizeBytes",
  "freshness",
  "observedAt",
  "scientificPresealSealKey",
  "bytes",
] as const;
const VECTOR_LENGTH =
  64 * NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER.length;
const SHA256 = /^[a-f0-9]{64}$/;
const SNAPSHOT_LIMITS = Object.freeze({
  maximumDepth: 16,
  maximumNodes: 4_096,
  maximumArrayLength: 256,
  maximumOwnKeysPerNode: 128,
  maximumStringLength: 4_096,
});
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedArrayBufferGetter = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  "buffer",
)?.get;
const typedArrayByteOffsetGetter = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  "byteOffset",
)?.get;
const typedArrayByteLengthGetter = Object.getOwnPropertyDescriptor(
  typedArrayPrototype,
  "byteLength",
)?.get;

if (
  typedArrayBufferGetter == null ||
  typedArrayByteOffsetGetter == null ||
  typedArrayByteLengthGetter == null
) {
  throw new Error(
    "nhm2_semiclassical_v2_constraint_operand_replayer_intrinsic_typed_array_getters_missing",
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Reflect.ownKeys(value);
  return (
    actual.length === keys.length &&
    actual.every((key) => typeof key === "string" && keys.includes(key))
  );
};

const ownDataDescriptor = (
  value: object,
  key: PropertyKey,
): PropertyDescriptor | null => {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (
    descriptor == null ||
    !("value" in descriptor) ||
    descriptor.get != null ||
    descriptor.set != null ||
    (key !== "length" && descriptor.enumerable !== true)
  ) {
    return null;
  }
  return descriptor;
};

const exactRootInputShape = (value: unknown): Record<string, unknown> => {
  if (
    value == null ||
    typeof value !== "object" ||
    nodeUtilTypes.isProxy(value) ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError("input_root_not_plain_data_object");
  }
  const root = value as Record<string, unknown>;
  if (!hasExactKeys(root, INPUT_KEYS))
    throw new TypeError("input_root_keys_invalid");
  for (const key of INPUT_KEYS) {
    if (ownDataDescriptor(root, key) == null) {
      throw new TypeError(`input_root_data_descriptor_invalid:${key}`);
    }
  }
  return root;
};

const assertBoundedPlainGraph = (root: unknown): void => {
  const visited = new Set<object>();
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: root, depth: 0 },
  ];
  let nodes = 0;
  while (stack.length > 0) {
    const current = stack.pop()!;
    const value = current.value;
    if (value == null || typeof value === "boolean") continue;
    if (typeof value === "string") {
      if (value.length > SNAPSHOT_LIMITS.maximumStringLength) {
        throw new TypeError("snapshot_string_length_exceeded");
      }
      continue;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value) || Object.is(value, -0)) {
        throw new TypeError("snapshot_number_invalid");
      }
      continue;
    }
    if (typeof value !== "object")
      throw new TypeError("snapshot_value_invalid");
    if (nodeUtilTypes.isProxy(value))
      throw new TypeError("snapshot_proxy_forbidden");
    if (visited.has(value))
      throw new TypeError("snapshot_repeated_identity_forbidden");
    visited.add(value);
    nodes += 1;
    if (
      nodes > SNAPSHOT_LIMITS.maximumNodes ||
      current.depth > SNAPSHOT_LIMITS.maximumDepth
    ) {
      throw new TypeError("snapshot_resource_limit_exceeded");
    }

    if (value instanceof Uint8Array) {
      if (Object.getPrototypeOf(value) !== Uint8Array.prototype) {
        throw new TypeError("snapshot_uint8array_subclass_forbidden");
      }
      const buffer = typedArrayBufferGetter.call(value) as ArrayBufferLike;
      const byteOffset = typedArrayByteOffsetGetter.call(value) as number;
      const byteLength = typedArrayByteLengthGetter.call(value) as number;
      if (
        Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype ||
        byteOffset !== 0 ||
        byteLength !== buffer.byteLength ||
        byteLength !== NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES
      ) {
        throw new TypeError("snapshot_uint8array_full_view_invalid");
      }
      continue;
    }

    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) {
        throw new TypeError("snapshot_array_prototype_invalid");
      }
      const lengthDescriptor = ownDataDescriptor(value, "length");
      const length = lengthDescriptor?.value;
      if (
        !Number.isSafeInteger(length) ||
        length < 0 ||
        length > SNAPSHOT_LIMITS.maximumArrayLength
      ) {
        throw new TypeError("snapshot_array_length_invalid");
      }
      const keys = Reflect.ownKeys(value);
      if (
        keys.length !== length + 1 ||
        keys.some((key) =>
          typeof key !== "string"
            ? true
            : key !== "length" &&
              (!/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key) >= length),
        )
      ) {
        throw new TypeError("snapshot_array_keys_invalid");
      }
      for (let index = 0; index < length; index += 1) {
        const descriptor = ownDataDescriptor(value, String(index));
        if (descriptor == null)
          throw new TypeError("snapshot_array_hole_or_accessor");
        stack.push({ value: descriptor.value, depth: current.depth + 1 });
      }
      continue;
    }

    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError("snapshot_object_prototype_invalid");
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.length > SNAPSHOT_LIMITS.maximumOwnKeysPerNode ||
      keys.some((key) => typeof key !== "string" || FORBIDDEN_KEYS.has(key))
    ) {
      throw new TypeError("snapshot_object_keys_invalid");
    }
    for (const key of keys as string[]) {
      const descriptor = ownDataDescriptor(value, key);
      if (descriptor == null)
        throw new TypeError("snapshot_object_accessor_forbidden");
      stack.push({ value: descriptor.value, depth: current.depth + 1 });
    }
  }
};

const snapshotReplayInputOnce = (callerInput: unknown): unknown => {
  const root = exactRootInputShape(callerInput);
  assertBoundedPlainGraph(root);
  const snapshot = structuredClone(root);
  assertBoundedPlainGraph(snapshot);
  return snapshot;
};

const deepFreeze = <T>(value: T): T => {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
};

const FAIL_CODES = new Set<Nhm2SemiclassicalV2ConstraintOperandReplayIssueCode>(
  [
    "decoded_uncertainty_negative",
    "computed_target_exact_echo_forbidden",
    "submitted_residual_mismatch_tolerance_exceeded",
    "central_residual_upper95_tolerance_exceeded",
    "regulator_monotonicity_failed",
    "regulator_order_failed",
    "regulator_error_tolerance_exceeded",
  ],
);

const issue = (
  code: Nhm2SemiclassicalV2ConstraintOperandReplayIssueCode,
  detail: string,
  pointer: string | null = null,
): Nhm2SemiclassicalV2ConstraintOperandReplayIssue => ({
  code,
  disposition: FAIL_CODES.has(code) ? "fail" : "blocked",
  pointer,
  detail,
});

const SCIENTIFIC_AUTHORITY_ISSUES = Object.freeze([
  issue(
    "scientific_preseal_not_server_resolved",
    "The manifest echoes a structurally valid preseal binding, but this service did not resolve and reopen a persisted server-owned preseal.",
    "/manifest/candidateBinding/scientificPresealBinding",
  ),
  issue(
    "constraint_joint_uncertainty_coverage_not_server_verified",
    "Joint simultaneous U95 coverage or a stronger deterministic enclosure has no server derivation receipt.",
    "/policy/uncertaintyCoverage",
  ),
  issue(
    "constraint_target_derivation_not_server_replayed",
    "Dirac targets have not been reconstructed from frozen structure functions by this service.",
    "/policy/targetDerivation",
  ),
  issue(
    "filesystem_observation_authority_not_established",
    "File observations are caller supplied; this service did not perform secure path traversal, freshness observation, or stable-identity rereads.",
    "/fileObservations",
  ),
] as const);

const receipt = (input: {
  arithmeticIssues: Nhm2SemiclassicalV2ConstraintOperandReplayIssue[];
  calculationComplete: boolean;
  inputBinding: Nhm2SemiclassicalV2ConstraintOperandReplayReceiptV1["inputBinding"];
  families: Nhm2SemiclassicalV2ConstraintOperandFamilyReplay[];
  manifestValidated: boolean;
  filesDecoded: boolean;
  snapshotCompleted: boolean;
}): Nhm2SemiclassicalV2ConstraintOperandReplayReceiptV1 => {
  const issues = [
    ...input.arithmeticIssues,
    ...SCIENTIFIC_AUTHORITY_ISSUES.filter(
      (authorityIssue) =>
        !input.arithmeticIssues.some(
          (candidate) => candidate.code === authorityIssue.code,
        ),
    ),
  ];
  const arithmeticDisposition = input.arithmeticIssues.some(
    (candidate) => candidate.disposition === "fail",
  )
    ? ("fail" as const)
    : !input.calculationComplete || input.arithmeticIssues.length > 0
      ? ("blocked" as const)
      : ("pass" as const);
  return deepFreeze({
    artifactId: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_CONTRACT_VERSION,
    serverCalculationImplementation: true as const,
    diagnosticOnly: true as const,
    arithmeticDisposition,
    overallDisposition: "blocked" as const,
    calculationComplete: input.calculationComplete,
    firstIssue: issues[0]?.code ?? null,
    issues,
    inputBinding: input.inputBinding,
    families: input.families,
    provenanceBoundary: {
      inputSnapshotAttemptedExactlyOnce: true as const,
      inputSnapshotCompleted: input.snapshotCompleted,
      manifestStructurallyValidatedAfterSnapshot: input.manifestValidated,
      everyFileByteStringRehashedAndDecoded: input.filesDecoded,
      callerSuppliedObservationOnly: true as const,
      filesystemReadPerformedByService: false as const,
      filesystemSecurityEstablished: false as const,
      persistedScientificPresealResolved: false as const,
      jointUncertaintyCoverageServerVerified: false as const,
      targetDerivationServerReplayed: false as const,
    },
    serviceBoundary:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_SERVICE_BOUNDARY,
    authorityBoundary:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
  });
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

type ExpectedArray = Readonly<{
  levelId: Nhm2SemiclassicalV2ConstraintOperandLevelId;
  familyId: Nhm2SemiclassicalV2ConstraintOperandFamilyId;
  descriptor: Nhm2SemiclassicalV2ConstraintOperandArrayV1;
}>;

const expectedArrays = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
): ExpectedArray[] =>
  manifest.levels.flatMap((level) =>
    level.families.flatMap((family) =>
      family.operands.map((descriptor) => ({
        levelId: level.levelId,
        familyId: family.familyId,
        descriptor,
      })),
    ),
  );

const copyExactBytes = (value: Uint8Array): Uint8Array => {
  const buffer = typedArrayBufferGetter.call(value) as ArrayBuffer;
  const byteOffset = typedArrayByteOffsetGetter.call(value) as number;
  const byteLength = typedArrayByteLengthGetter.call(value) as number;
  return Uint8Array.from(new Uint8Array(buffer, byteOffset, byteLength));
};

const decodeFloat64Le = (bytes: Uint8Array): number[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: VECTOR_LENGTH }, (_, index) =>
    view.getFloat64(index * Float64Array.BYTES_PER_ELEMENT, true),
  );
};

class ArithmeticReplayError extends Error {
  constructor(
    readonly code: Nhm2SemiclassicalV2ConstraintOperandReplayIssueCode,
    readonly pointer: string,
    message: string,
    readonly priorIssues: readonly Nhm2SemiclassicalV2ConstraintOperandReplayIssue[] = [],
  ) {
    super(message);
  }
}

const finite = (value: number, pointer: string): number => {
  if (!Number.isFinite(value)) {
    throw new ArithmeticReplayError(
      "arithmetic_nonfinite_or_overflow",
      pointer,
      "A primitive or derived arithmetic value was nonfinite or overflowed.",
    );
  }
  return Object.is(value, -0) ? 0 : value;
};
const add = (left: number, right: number, pointer: string): number =>
  finite(left + right, pointer);
const subtract = (left: number, right: number, pointer: string): number =>
  finite(left - right, pointer);
const multiply = (left: number, right: number, pointer: string): number =>
  finite(left * right, pointer);
const absolute = (value: number, pointer: string): number =>
  finite(Math.abs(value), pointer);

const vectorBinary = (
  left: readonly number[],
  right: readonly number[],
  operation: (leftValue: number, rightValue: number, pointer: string) => number,
  pointer: string,
): number[] =>
  left.map((value, index) =>
    operation(value, right[index], `${pointer}/${index}`),
  );
const vectorScale = (
  values: readonly number[],
  scale: number,
  pointer: string,
): number[] =>
  values.map((value, index) => multiply(value, scale, `${pointer}/${index}`));

const maximumUpper = (
  values: readonly number[],
  uncertainty: readonly number[],
  pointer: string,
): number => {
  let maximum = 0;
  for (let index = 0; index < values.length; index += 1) {
    const candidate = add(
      absolute(values[index], `${pointer}/abs/${index}`),
      uncertainty[index],
      `${pointer}/sum/${index}`,
    );
    if (candidate > maximum) maximum = candidate;
  }
  return finite(maximum, `${pointer}/max`);
};

const interlevelBounds = (
  difference: readonly number[],
  uncertaintySum: readonly number[],
  pointer: string,
): Readonly<{ lower: number; upper: number }> => {
  let lower = 0;
  let upper = 0;
  for (let index = 0; index < difference.length; index += 1) {
    const lowerCandidate = Math.max(
      0,
      subtract(
        difference[index],
        uncertaintySum[index],
        `${pointer}/lower/sub/${index}`,
      ),
    );
    const upperCandidate = add(
      difference[index],
      uncertaintySum[index],
      `${pointer}/upper/add/${index}`,
    );
    finite(lowerCandidate, `${pointer}/lower/${index}`);
    if (lowerCandidate > lower) lower = lowerCandidate;
    if (upperCandidate > upper) upper = upperCandidate;
  }
  return { lower, upper };
};

const mismatchLInf = (
  submitted: readonly number[],
  server: readonly number[],
  pointer: string,
): number => {
  let maximum = 0;
  for (let index = 0; index < submitted.length; index += 1) {
    const candidate = absolute(
      subtract(submitted[index], server[index], `${pointer}/sub/${index}`),
      `${pointer}/abs/${index}`,
    );
    if (candidate > maximum) maximum = candidate;
  }
  return maximum;
};

const vectorsExactlyEqual = (
  left: readonly number[],
  right: readonly number[],
): boolean => left.every((value, index) => value === right[index]);

export const canonicalizeNhm2SemiclassicalV2ConstraintObservationClosureV1 = (
  observations: readonly Nhm2SemiclassicalV2ConstraintOperandFileObservationV1[],
): string =>
  JSON.stringify(
    observations.map((observation) => ({
      observationMode: observation.observationMode,
      operandRole: observation.operandRole,
      path: observation.path,
      sha256: observation.sha256,
      sizeBytes: observation.sizeBytes,
      freshness: observation.freshness,
      observedAt: observation.observedAt,
      scientificPresealSealKey: observation.scientificPresealSealKey,
    })),
  );

export const computeNhm2SemiclassicalV2ConstraintObservationClosureSha256 = (
  observations: readonly Nhm2SemiclassicalV2ConstraintOperandFileObservationV1[],
): string =>
  sha256(
    NHM2_SEMICLASSICAL_V2_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN +
      canonicalizeNhm2SemiclassicalV2ConstraintObservationClosureV1(
        observations,
      ),
  );

const mapKey = (levelId: string, familyId: string, role: string): string =>
  `${levelId}\u0000${familyId}\u0000${role}`;

const requiredVector = (
  arrays: Map<string, readonly number[]>,
  levelId: string,
  familyId: string,
  role: string,
): readonly number[] => {
  const value = arrays.get(mapKey(levelId, familyId, role));
  if (value == null) {
    throw new ArithmeticReplayError(
      "internal_replay_error",
      `${levelId}/${familyId}/${role}`,
      "A validated operand role was unavailable during replay.",
    );
  }
  return value;
};

const serverResidual = (
  arrays: Map<string, readonly number[]>,
  levelId: string,
  familyId: Nhm2SemiclassicalV2ConstraintOperandFamilyId,
): number[] => {
  const pointer = `/families/${familyId}/levels/${levelId}/serverResidual`;
  if (familyId === "H_H" || familyId === "H_Hi" || familyId === "Hi_Hj") {
    return vectorBinary(
      requiredVector(arrays, levelId, familyId, "computed"),
      requiredVector(arrays, levelId, familyId, "target"),
      subtract,
      pointer,
    );
  }
  if (familyId === "antisymmetry") {
    return vectorBinary(
      requiredVector(arrays, levelId, familyId, "forward"),
      requiredVector(arrays, levelId, familyId, "reverse"),
      add,
      pointer,
    );
  }
  const firstTwo = vectorBinary(
    requiredVector(arrays, levelId, familyId, "term_1"),
    requiredVector(arrays, levelId, familyId, "term_2"),
    add,
    `${pointer}/firstTwo`,
  );
  return vectorBinary(
    firstTwo,
    requiredVector(arrays, levelId, familyId, "term_3"),
    add,
    pointer,
  );
};

const arithmeticReplay = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
  arrays: Map<string, readonly number[]>,
): {
  families: Nhm2SemiclassicalV2ConstraintOperandFamilyReplay[];
  issues: Nhm2SemiclassicalV2ConstraintOperandReplayIssue[];
} => {
  const issues: Nhm2SemiclassicalV2ConstraintOperandReplayIssue[] = [];
  const families: Nhm2SemiclassicalV2ConstraintOperandFamilyReplay[] = [];
  const policy = NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY;

  try {
    for (const familyId of NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER) {
      const levels: Nhm2SemiclassicalV2ConstraintOperandLevelReplay[] = [];
      const residuals: number[][] = [];
      const uncertainties: Array<readonly number[]> = [];
      let producerResidualMismatchLInf = 0;
      for (const level of manifest.levels) {
        const residual = serverResidual(arrays, level.levelId, familyId);
        const submitted = requiredVector(
          arrays,
          level.levelId,
          familyId,
          "residual",
        );
        const uncertainty = requiredVector(
          arrays,
          level.levelId,
          familyId,
          "absolute_uncertainty95",
        );
        const mismatch = mismatchLInf(
          submitted,
          residual,
          `/families/${familyId}/levels/${level.levelId}/mismatch`,
        );
        const upper95 = maximumUpper(
          residual,
          uncertainty,
          `/families/${familyId}/levels/${level.levelId}/upper95`,
        );
        if (familyId === "H_H" || familyId === "H_Hi" || familyId === "Hi_Hj") {
          const computed = requiredVector(
            arrays,
            level.levelId,
            familyId,
            "computed",
          );
          const target = requiredVector(
            arrays,
            level.levelId,
            familyId,
            "target",
          );
          if (vectorsExactlyEqual(computed, target)) {
            issues.push(
              issue(
                "computed_target_exact_echo_forbidden",
                "Computed and target arrays are exactly equal; the frozen v2 policy forbids target echo substitution.",
                `/families/${familyId}/levels/${level.levelId}`,
              ),
            );
          }
        }
        if (
          mismatch >
          policy.serverRecomputation.producerResidualConsistencyTolerance
        ) {
          issues.push(
            issue(
              "submitted_residual_mismatch_tolerance_exceeded",
              `Mismatch ${mismatch} exceeds ${policy.serverRecomputation.producerResidualConsistencyTolerance}.`,
              `/families/${familyId}/levels/${level.levelId}`,
            ),
          );
        }
        if (mismatch > producerResidualMismatchLInf) {
          producerResidualMismatchLInf = mismatch;
        }
        residuals.push(residual);
        uncertainties.push(uncertainty);
        levels.push({
          levelId: level.levelId,
          serverResidual: residual,
          submittedResidualMismatchLInf: mismatch,
          residualUpper95: upper95,
        });
      }

      if (
        levels[2].residualUpper95 >
        policy.convergence.finalResidualUpper95Tolerance
      ) {
        issues.push(
          issue(
            "central_residual_upper95_tolerance_exceeded",
            `Central residual upper95 ${levels[2].residualUpper95} exceeds ${policy.convergence.finalResidualUpper95Tolerance}.`,
            `/families/${familyId}/levels/level_2`,
          ),
        );
      }

      const d01 = vectorBinary(
        residuals[0],
        residuals[1],
        (left, right, pointer) =>
          absolute(subtract(left, right, pointer), pointer),
        `/families/${familyId}/convergence/d01`,
      );
      const d12 = vectorBinary(
        residuals[1],
        residuals[2],
        (left, right, pointer) =>
          absolute(subtract(left, right, pointer), pointer),
        `/families/${familyId}/convergence/d12`,
      );
      const E0 = vectorScale(d01, 2, `/families/${familyId}/convergence/E0`);
      const E1 = vectorScale(d12, 2, `/families/${familyId}/convergence/E1`);
      const E2 = [...d12];
      const U01 = vectorBinary(
        uncertainties[0],
        uncertainties[1],
        add,
        `/families/${familyId}/convergence/U01`,
      );
      const U12 = vectorBinary(
        uncertainties[1],
        uncertainties[2],
        add,
        `/families/${familyId}/convergence/U12`,
      );
      const UE0 = vectorScale(U01, 2, `/families/${familyId}/convergence/UE0`);
      const UE1 = vectorScale(U12, 2, `/families/${familyId}/convergence/UE1`);
      const UE2 = [...U12];
      const q0 = maximumUpper(E0, UE0, `/families/${familyId}/convergence/q0`);
      const q1 = maximumUpper(E1, UE1, `/families/${familyId}/convergence/q1`);
      const q2 = maximumUpper(E2, UE2, `/families/${familyId}/convergence/q2`);
      const bounds01 = interlevelBounds(
        d01,
        U01,
        `/families/${familyId}/convergence/D01`,
      );
      const bounds12 = interlevelBounds(
        d12,
        U12,
        `/families/${familyId}/convergence/D12`,
      );
      const D01Lower = bounds01.lower;
      const D01Upper = bounds01.upper;
      const D12Lower = bounds12.lower;
      const D12Upper = bounds12.upper;
      if (!(D01Lower > 0) || !(D12Upper > 0)) {
        throw new ArithmeticReplayError(
          "regulator_zero_or_nonpositive_interlevel_bound",
          `/families/${familyId}/convergence`,
          "D01Lower and D12Upper must both be strictly positive; no synthetic floor is allowed.",
          issues,
        );
      }
      const ratio = finite(
        D01Lower / D12Upper,
        `/families/${familyId}/convergence/deltaRatio`,
      );
      if (!(ratio > 0)) {
        throw new ArithmeticReplayError(
          "arithmetic_nonfinite_or_overflow",
          `/families/${familyId}/convergence/deltaRatio`,
          "The interlevel-difference ratio underflowed or was not strictly positive.",
          issues,
        );
      }
      const pLower = finite(
        Math.log(ratio) / Math.log(2),
        `/families/${familyId}/convergence/pLower`,
      );
      const monotonicLimit = add(
        D01Lower,
        policy.convergence.monotonicityAbsoluteTolerance,
        `/families/${familyId}/convergence/monotonicLimit`,
      );
      if (D12Upper > monotonicLimit) {
        issues.push(
          issue(
            "regulator_monotonicity_failed",
            "The fine interlevel-difference upper bound exceeds the coarse bound plus the frozen tolerance.",
            `/families/${familyId}/convergence`,
          ),
        );
      }
      if (pLower < policy.convergence.minimumObservedOrder) {
        issues.push(
          issue(
            "regulator_order_failed",
            `Conservative order lower bound ${pLower} is below ${policy.convergence.minimumObservedOrder}.`,
            `/families/${familyId}/convergence`,
          ),
        );
      }
      if (q2 > policy.convergence.finalRegulatorErrorUpper95Tolerance) {
        issues.push(
          issue(
            "regulator_error_tolerance_exceeded",
            `Final q ${q2} exceeds ${policy.convergence.finalRegulatorErrorUpper95Tolerance}.`,
            `/families/${familyId}/convergence`,
          ),
        );
      }
      families.push({
        familyId,
        producerResidualMismatchLInf,
        levels,
        convergence: {
          d01,
          d12,
          E0,
          E1,
          E2,
          UE0,
          UE1,
          UE2,
          q0,
          q1,
          q2,
          D01Lower,
          D01Upper,
          D12Lower,
          D12Upper,
          pLower,
        },
      });
    }
  } catch (error) {
    if (error instanceof ArithmeticReplayError) {
      const priorIssues =
        error.priorIssues.length > 0 ? error.priorIssues : issues;
      throw new ArithmeticReplayError(
        error.code,
        error.pointer,
        error.message,
        priorIssues,
      );
    }
    throw error;
  }
  return { families, issues };
};

/**
 * Content-addressed decoder and arithmetic replayer only. The caller supplies
 * already-isolated file bytes. This service does not open paths, resolve the
 * persisted scientific preseal, derive Dirac targets, or certify joint U95.
 */
export const replayNhm2SemiclassicalV2ConstraintOperands = (
  callerInput: unknown,
): Nhm2SemiclassicalV2ConstraintOperandReplayReceiptV1 => {
  let snapshot: unknown;
  try {
    snapshot = snapshotReplayInputOnce(callerInput);
  } catch {
    return receipt({
      arithmeticIssues: [
        issue(
          "input_snapshot_invalid",
          "Input could not be detached as one bounded accessor-free plain graph with exact full byte views.",
        ),
      ],
      calculationComplete: false,
      inputBinding: null,
      families: [],
      manifestValidated: false,
      filesDecoded: false,
      snapshotCompleted: false,
    });
  }

  try {
    if (!isRecord(snapshot) || !hasExactKeys(snapshot, INPUT_KEYS)) {
      return receipt({
        arithmeticIssues: [
          issue("input_shape_invalid", "Input keys do not match v1."),
        ],
        calculationComplete: false,
        inputBinding: null,
        families: [],
        manifestValidated: false,
        filesDecoded: false,
        snapshotCompleted: true,
      });
    }
    if (
      snapshot.contractVersion !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAYER_INPUT_CONTRACT_VERSION ||
      !Array.isArray(snapshot.fileObservations)
    ) {
      return receipt({
        arithmeticIssues: [
          issue(
            "input_shape_invalid",
            "Input version or observation array is invalid.",
          ),
        ],
        calculationComplete: false,
        inputBinding: null,
        families: [],
        manifestValidated: false,
        filesDecoded: false,
        snapshotCompleted: true,
      });
    }

    const manifestViolations =
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(snapshot.manifest);
    if (manifestViolations.length > 0) {
      return receipt({
        arithmeticIssues: [
          issue("manifest_invalid", manifestViolations.join(","), "/manifest"),
        ],
        calculationComplete: false,
        inputBinding: null,
        families: [],
        manifestValidated: false,
        filesDecoded: false,
        snapshotCompleted: true,
      });
    }
    const manifest =
      snapshot.manifest as Nhm2SemiclassicalV2ConstraintOperandReplayV1;
    const expected = expectedArrays(manifest);
    const observations =
      snapshot.fileObservations as Nhm2SemiclassicalV2ConstraintOperandFileObservationV1[];
    if (
      expected.length !==
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT ||
      observations.length !== expected.length
    ) {
      return receipt({
        arithmeticIssues: [
          issue(
            "file_observation_count_invalid",
            `Expected ${expected.length} observations and received ${observations.length}.`,
            "/fileObservations",
          ),
        ],
        calculationComplete: false,
        inputBinding: null,
        families: [],
        manifestValidated: true,
        filesDecoded: false,
        snapshotCompleted: true,
      });
    }

    const bindingIssues: Nhm2SemiclassicalV2ConstraintOperandReplayIssue[] = [];
    const decoded = new Map<string, readonly number[]>();
    const observedBackingBuffers = new Set<ArrayBuffer>();
    const admittedObservations: Nhm2SemiclassicalV2ConstraintOperandFileObservationV1[] =
      [];
    for (let index = 0; index < expected.length; index += 1) {
      const expectedEntry = expected[index];
      const observation = observations[index] as unknown;
      const pointer = `/fileObservations/${index}`;
      if (
        !isRecord(observation) ||
        !hasExactKeys(observation, OBSERVATION_KEYS)
      ) {
        bindingIssues.push(
          issue(
            "file_observation_shape_invalid",
            "Observation keys are not exact.",
            pointer,
          ),
        );
        continue;
      }
      const descriptor = expectedEntry.descriptor;
      if (
        observation.observationMode !== "caller_supplied_secure_file_reader" ||
        observation.operandRole !== descriptor.operandRole ||
        observation.path !== descriptor.path ||
        observation.sha256 !== descriptor.sha256 ||
        observation.sizeBytes !== descriptor.sizeBytes ||
        observation.freshness !== descriptor.freshness ||
        observation.observedAt !== descriptor.observedAt ||
        observation.scientificPresealSealKey !==
          descriptor.scientificPresealSealKey ||
        !SHA256.test(String(observation.sha256))
      ) {
        bindingIssues.push(
          issue(
            "file_observation_metadata_invalid",
            "Observation metadata does not exactly match its manifest descriptor.",
            pointer,
          ),
        );
      }
      if (
        !(observation.bytes instanceof Uint8Array) ||
        Object.getPrototypeOf(observation.bytes) !== Uint8Array.prototype
      ) {
        bindingIssues.push(
          issue(
            "file_bytes_full_view_invalid",
            "Bytes are not an exact Uint8Array.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      const buffer = typedArrayBufferGetter.call(
        observation.bytes,
      ) as ArrayBufferLike;
      const byteOffset = typedArrayByteOffsetGetter.call(
        observation.bytes,
      ) as number;
      const byteLength = typedArrayByteLengthGetter.call(
        observation.bytes,
      ) as number;
      if (
        Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype ||
        byteOffset !== 0 ||
        byteLength !== buffer.byteLength ||
        byteLength !==
          NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES ||
        observation.sizeBytes !== byteLength
      ) {
        bindingIssues.push(
          issue(
            "file_bytes_full_view_invalid",
            "Bytes must be one exact full 2048-byte Uint8Array view.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      if (observedBackingBuffers.has(buffer as ArrayBuffer)) {
        bindingIssues.push(
          issue(
            "file_bytes_backing_buffer_not_unique",
            "Each observed array must own one distinct full ArrayBuffer.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      observedBackingBuffers.add(buffer as ArrayBuffer);
      const copiedBytes = copyExactBytes(observation.bytes);
      if (sha256(copiedBytes) !== descriptor.sha256) {
        bindingIssues.push(
          issue(
            "file_sha256_mismatch",
            "Observed bytes do not match SHA-256.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      const values = decodeFloat64Le(copiedBytes);
      const nonfiniteIndex = values.findIndex(
        (value) => !Number.isFinite(value),
      );
      if (nonfiniteIndex >= 0) {
        bindingIssues.push(
          issue(
            "decoded_operand_nonfinite",
            `Decoded value ${nonfiniteIndex} is nonfinite.`,
            `${pointer}/bytes/${nonfiniteIndex}`,
          ),
        );
        continue;
      }
      if (descriptor.operandRole === "absolute_uncertainty95") {
        const negativeIndex = values.findIndex((value) => value < 0);
        if (negativeIndex >= 0) {
          bindingIssues.push(
            issue(
              "decoded_uncertainty_negative",
              `Uncertainty value ${negativeIndex} is negative.`,
              `${pointer}/bytes/${negativeIndex}`,
            ),
          );
          continue;
        }
      }
      decoded.set(
        mapKey(
          expectedEntry.levelId,
          expectedEntry.familyId,
          descriptor.operandRole,
        ),
        values,
      );
      admittedObservations.push({
        observationMode: "caller_supplied_secure_file_reader",
        operandRole: descriptor.operandRole,
        path: descriptor.path,
        sha256: descriptor.sha256,
        sizeBytes: descriptor.sizeBytes,
        freshness: descriptor.freshness,
        observedAt: descriptor.observedAt,
        scientificPresealSealKey: descriptor.scientificPresealSealKey,
        bytes: copiedBytes,
      });
    }

    if (bindingIssues.length > 0) {
      return receipt({
        arithmeticIssues: bindingIssues,
        calculationComplete: false,
        inputBinding: null,
        families: [],
        manifestValidated: true,
        filesDecoded: false,
        snapshotCompleted: true,
      });
    }

    const inputBinding = {
      candidateId: manifest.candidateBinding.candidateId,
      candidateManifestSha256:
        manifest.candidateBinding.candidateManifestSha256,
      scientificPresealSealKey:
        manifest.candidateBinding.scientificPresealBinding.sealKey,
      manifestInventorySha256: manifest.operandInventorySha256,
      implementationRole: manifest.implementation.role,
      implementationId: manifest.implementation.implementationId,
      executionCommitSha: manifest.execution.commitSha,
      executionCommand: manifest.execution.command,
      executionStartedAt: manifest.execution.startedAt,
      executionCompletedAt: manifest.execution.completedAt,
      observationCount: 63 as const,
      aggregateBytes:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT *
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
      observationClosureSha256Domain:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN,
      observationClosureSha256:
        computeNhm2SemiclassicalV2ConstraintObservationClosureSha256(
          admittedObservations,
        ),
    };
    try {
      const replay = arithmeticReplay(manifest, decoded);
      return receipt({
        arithmeticIssues: replay.issues,
        calculationComplete: true,
        inputBinding,
        families: replay.families,
        manifestValidated: true,
        filesDecoded: true,
        snapshotCompleted: true,
      });
    } catch (error) {
      if (error instanceof ArithmeticReplayError) {
        return receipt({
          arithmeticIssues: [
            ...error.priorIssues,
            issue(error.code, error.message, error.pointer),
          ],
          calculationComplete: false,
          inputBinding,
          families: [],
          manifestValidated: true,
          filesDecoded: true,
          snapshotCompleted: true,
        });
      }
      return receipt({
        arithmeticIssues: [
          issue(
            "internal_replay_error",
            "The arithmetic replay failed closed.",
          ),
        ],
        calculationComplete: false,
        inputBinding,
        families: [],
        manifestValidated: true,
        filesDecoded: true,
        snapshotCompleted: true,
      });
    }
  } catch {
    return receipt({
      arithmeticIssues: [
        issue(
          "internal_replay_error",
          "The decoder rejected an unexpected input state.",
        ),
      ],
      calculationComplete: false,
      inputBinding: null,
      families: [],
      manifestValidated: false,
      filesDecoded: false,
      snapshotCompleted: true,
    });
  }
};
