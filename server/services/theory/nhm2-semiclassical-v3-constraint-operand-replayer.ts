import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  validateNhm2SemiclassicalV3ConstraintOperandManifest,
  type Nhm2SemiclassicalV3ConstraintFamilyId,
  type Nhm2SemiclassicalV3ConstraintLevelId,
  type Nhm2SemiclassicalV3ConstraintOperandArrayV1,
  type Nhm2SemiclassicalV3ConstraintOperandManifestV1,
} from "../../../shared/contracts/nhm2-semiclassical-v3-constraint-operand-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT,
} from "../../../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_ARTIFACT_ID =
  "nhm2.semiclassical_v3_constraint_operand_replay_receipt" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_constraint_operand_replayer/v1" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INPUT_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_constraint_operand_replay_input/v1" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-constraint-observation-closure/v1\n" as const;

export type Nhm2SemiclassicalV3ConstraintOperandFileObservationV1 = Readonly<{
  observationMode: "caller_supplied_secure_file_reader";
  arrayRole: string;
  path: string;
  sha256: string;
  sizeBytes: number;
  freshness: "new";
  observedAt: string;
  bytes: Uint8Array;
}>;

export type Nhm2SemiclassicalV3ConstraintOperandReplayInputV1 = Readonly<{
  contractVersion: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INPUT_CONTRACT_VERSION;
  manifest: unknown;
  fileObservations: readonly Nhm2SemiclassicalV3ConstraintOperandFileObservationV1[];
}>;

export type Nhm2SemiclassicalV3ConstraintOperandReplayBlockerCode =
  | "input_snapshot_invalid"
  | "input_shape_invalid"
  | "manifest_invalid"
  | "file_observation_count_invalid"
  | "file_observation_shape_invalid"
  | "file_observation_role_invalid"
  | "file_observation_metadata_invalid"
  | "file_bytes_full_view_invalid"
  | "file_bytes_backing_buffer_not_unique"
  | "file_sha256_mismatch"
  | "decoded_operand_nonfinite"
  | "decoded_uncertainty_negative"
  | "arithmetic_nonfinite_or_overflow"
  | "submitted_residual_mismatch_tolerance_exceeded"
  | "central_residual_upper95_tolerance_exceeded"
  | "regulator_zero_or_nonpositive_interlevel_bound"
  | "regulator_monotonicity_failed"
  | "regulator_order_failed"
  | "regulator_error_tolerance_exceeded"
  | "constraint_joint_uncertainty_coverage_not_server_verified"
  | "constraint_target_derivation_not_server_replayed"
  | "internal_replay_error";

export type Nhm2SemiclassicalV3ConstraintOperandReplayBlocker = Readonly<{
  code: Nhm2SemiclassicalV3ConstraintOperandReplayBlockerCode;
  disposition: "fail" | "blocked";
  pointer: string | null;
  detail: string;
}>;

const ARITHMETIC_FAIL_CODES: ReadonlySet<Nhm2SemiclassicalV3ConstraintOperandReplayBlockerCode> =
  new Set([
    "decoded_operand_nonfinite",
    "decoded_uncertainty_negative",
    "arithmetic_nonfinite_or_overflow",
    "submitted_residual_mismatch_tolerance_exceeded",
    "central_residual_upper95_tolerance_exceeded",
    "regulator_monotonicity_failed",
    "regulator_order_failed",
    "regulator_error_tolerance_exceeded",
  ]);

export type Nhm2SemiclassicalV3ConstraintOperandLevelReplay = Readonly<{
  levelId: Nhm2SemiclassicalV3ConstraintLevelId;
  serverResidual: readonly number[];
  submittedResidualMismatchLInf: number;
  residualUpper95: number;
}>;

export type Nhm2SemiclassicalV3ConstraintOperandConvergenceReplay = Readonly<{
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

export type Nhm2SemiclassicalV3ConstraintOperandFamilyReplay = Readonly<{
  familyId: Nhm2SemiclassicalV3ConstraintFamilyId;
  producerResidualMismatchLInf: number;
  levels: readonly Nhm2SemiclassicalV3ConstraintOperandLevelReplay[];
  convergence: Nhm2SemiclassicalV3ConstraintOperandConvergenceReplay;
}>;

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_SERVICE_BOUNDARY =
  Object.freeze({
    serviceIntegrationComplete: false as const,
    filesystemSecurityVerified: false as const,
    realpathVerified: false as const,
    stableFileIdentityVerified: false as const,
    callerObservationAuthority: false as const,
    jointUncertaintyCoverageVerified: false as const,
    targetDerivationServerReplayed: false as const,
  });

const SCIENTIFIC_AUTHORITY_BLOCKERS = Object.freeze([
  Object.freeze({
    code: "constraint_joint_uncertainty_coverage_not_server_verified" as const,
    disposition: "blocked" as const,
    detail:
      "Joint simultaneous U95 coverage or a stronger deterministic enclosure has no server derivation receipt.",
    pointer: "/policy/uncertaintyCoverage",
  }),
  Object.freeze({
    code: "constraint_target_derivation_not_server_replayed" as const,
    disposition: "blocked" as const,
    detail:
      "Dirac target construction has not been replayed from the frozen structure functions by this service.",
    pointer: "/policy/targetDerivation",
  }),
] as const);

export type Nhm2SemiclassicalV3ConstraintOperandReplayReceiptV1 = Readonly<{
  artifactId: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_CONTRACT_VERSION;
  serverOwned: true;
  diagnosticOnly: true;
  arithmeticDisposition: "pass" | "fail" | "blocked";
  overallDisposition: "blocked";
  calculationComplete: boolean;
  firstBlocker: Nhm2SemiclassicalV3ConstraintOperandReplayBlockerCode | null;
  blockers: readonly Nhm2SemiclassicalV3ConstraintOperandReplayBlocker[];
  inputBinding: Readonly<{
    candidateId: string;
    manifestInventorySha256: string;
    scientificInputClosureSha256: string;
    completeInputClosureSha256: string;
    observationCount: 63;
    aggregateBytes: number;
    observationClosureSha256Domain: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN;
    observationClosureSha256: string;
  }> | null;
  families: readonly Nhm2SemiclassicalV3ConstraintOperandFamilyReplay[];
  provenanceBoundary: Readonly<{
    inputSnapshotAttemptedExactlyOnce: true;
    inputSnapshotCompleted: boolean;
    inputSnapshottedExactlyOnce: boolean;
    manifestStructurallyValidatedAfterSnapshot: boolean;
    fileBytesRehashedAndDecoded: boolean;
    callerSuppliedObservationOnly: true;
    filesystemReadPerformedByService: false;
    filesystemSecurityEstablished: false;
    jointUncertaintyCoverageServerVerified: false;
    targetDerivationServerReplayed: false;
  }>;
  serviceBoundary: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_SERVICE_BOUNDARY;
  claimLocks: typeof NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS;
}>;

const INPUT_KEYS = ["contractVersion", "manifest", "fileObservations"] as const;
const OBSERVATION_KEYS = [
  "observationMode",
  "arrayRole",
  "path",
  "sha256",
  "sizeBytes",
  "freshness",
  "observedAt",
  "bytes",
] as const;
const VECTOR_LENGTH =
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT *
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER.length;
const SHA256 = /^[a-f0-9]{64}$/;

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

const assertSnapshotSafeGraph = (
  value: unknown,
  visited: Set<object>,
): void => {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("nonfinite_number");
    return;
  }
  if (typeof value !== "object") throw new TypeError("non_snapshot_value");
  if (visited.has(value)) throw new TypeError("repeated_object_identity");
  visited.add(value);

  if (value instanceof Uint8Array) {
    if (
      Object.getPrototypeOf(value) !== Uint8Array.prototype ||
      Object.getPrototypeOf(value.buffer) !== ArrayBuffer.prototype ||
      Reflect.ownKeys(value).some(
        (key) => typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key),
      )
    ) {
      throw new TypeError("typed_array_shape_invalid");
    }
    return;
  }

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      throw new TypeError("array_prototype_invalid");
    }
    const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      string,
      PropertyDescriptor
    >;
    const length = descriptors.length?.value;
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new TypeError("array_length_invalid");
    }
    const expectedKeys = [
      ...Array.from({ length }, (_, index) => String(index)),
      "length",
    ].sort();
    const actualKeys = Reflect.ownKeys(value).map(String).sort();
    if (
      actualKeys.length !== expectedKeys.length ||
      actualKeys.some((key, index) => key !== expectedKeys[index])
    ) {
      throw new TypeError("array_keys_invalid");
    }
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.get != null ||
        descriptor.set != null ||
        descriptor.enumerable !== true
      ) {
        throw new TypeError("array_descriptor_invalid");
      }
      assertSnapshotSafeGraph(descriptor.value, visited);
    }
    return;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("object_prototype_invalid");
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new TypeError("symbol_key_invalid");
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.get != null ||
      descriptor.set != null ||
      descriptor.enumerable !== true
    ) {
      throw new TypeError("object_descriptor_invalid");
    }
    assertSnapshotSafeGraph(descriptor.value, visited);
  }
};

const snapshotReplayInputOnce = (input: unknown): unknown => {
  assertSnapshotSafeGraph(input, new Set<object>());
  const snapshot = structuredClone(input);
  assertSnapshotSafeGraph(snapshot, new Set<object>());
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

const blocker = (
  code: Nhm2SemiclassicalV3ConstraintOperandReplayBlockerCode,
  detail: string,
  pointer: string | null = null,
): Nhm2SemiclassicalV3ConstraintOperandReplayBlocker => ({
  code,
  disposition: ARITHMETIC_FAIL_CODES.has(code) ? "fail" : "blocked",
  pointer,
  detail,
});

const receipt = (input: {
  blockers: Nhm2SemiclassicalV3ConstraintOperandReplayBlocker[];
  calculationComplete: boolean;
  inputBinding: Nhm2SemiclassicalV3ConstraintOperandReplayReceiptV1["inputBinding"];
  families: Nhm2SemiclassicalV3ConstraintOperandFamilyReplay[];
  manifestValidated: boolean;
  filesDecoded: boolean;
  snapshotCompleted: boolean;
}): Nhm2SemiclassicalV3ConstraintOperandReplayReceiptV1 => {
  const blockers = [
    ...input.blockers,
    ...SCIENTIFIC_AUTHORITY_BLOCKERS.filter(
      (authorityBlocker) =>
        !input.blockers.some(
          (candidate) => candidate.code === authorityBlocker.code,
        ),
    ),
  ];
  const arithmeticDisposition = input.blockers.some(
    (candidate) => candidate.disposition === "fail",
  )
    ? ("fail" as const)
    : !input.calculationComplete || input.blockers.length > 0
      ? ("blocked" as const)
      : ("pass" as const);
  return deepFreeze({
    artifactId: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_CONTRACT_VERSION,
    serverOwned: true as const,
    diagnosticOnly: true as const,
    arithmeticDisposition,
    overallDisposition: "blocked" as const,
    calculationComplete: input.calculationComplete,
    firstBlocker: blockers[0]?.code ?? null,
    blockers,
    inputBinding: input.inputBinding,
    families: input.families,
    provenanceBoundary: {
      inputSnapshotAttemptedExactlyOnce: true as const,
      inputSnapshotCompleted: input.snapshotCompleted,
      inputSnapshottedExactlyOnce: input.snapshotCompleted,
      manifestStructurallyValidatedAfterSnapshot: input.manifestValidated,
      fileBytesRehashedAndDecoded: input.filesDecoded,
      callerSuppliedObservationOnly: true as const,
      filesystemReadPerformedByService: false as const,
      filesystemSecurityEstablished: false as const,
      jointUncertaintyCoverageServerVerified: false as const,
      targetDerivationServerReplayed: false as const,
    },
    serviceBoundary: {
      ...NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_REPLAYER_SERVICE_BOUNDARY,
    },
    claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  });
};

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");

type ExpectedArray = Readonly<{
  levelId: Nhm2SemiclassicalV3ConstraintLevelId;
  familyId: Nhm2SemiclassicalV3ConstraintFamilyId;
  descriptor: Nhm2SemiclassicalV3ConstraintOperandArrayV1;
}>;

const expectedArrays = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
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

const decodeFloat64Le = (bytes: Uint8Array): number[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: VECTOR_LENGTH }, (_, index) =>
    view.getFloat64(index * Float64Array.BYTES_PER_ELEMENT, true),
  );
};

class ArithmeticReplayError extends Error {
  constructor(
    readonly code: Nhm2SemiclassicalV3ConstraintOperandReplayBlockerCode,
    readonly pointer: string,
    message: string,
    readonly priorIssues: readonly Nhm2SemiclassicalV3ConstraintOperandReplayBlocker[] = [],
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
  return value;
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
  return {
    lower: finite(lower, `${pointer}/lower/max`),
    upper: finite(upper, `${pointer}/upper/max`),
  };
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
  return finite(maximum, `${pointer}/max`);
};

export const canonicalizeNhm2SemiclassicalV3ConstraintObservationClosureV1 = (
  observations: readonly Nhm2SemiclassicalV3ConstraintOperandFileObservationV1[],
): string =>
  JSON.stringify(
    observations.map((observation) => ({
      observationMode: observation.observationMode,
      arrayRole: observation.arrayRole,
      path: observation.path,
      sha256: observation.sha256,
      sizeBytes: observation.sizeBytes,
      freshness: observation.freshness,
      observedAt: observation.observedAt,
    })),
  );

export const computeNhm2SemiclassicalV3ConstraintObservationClosureSha256 = (
  observations: readonly Nhm2SemiclassicalV3ConstraintOperandFileObservationV1[],
): string =>
  sha256(
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN +
      canonicalizeNhm2SemiclassicalV3ConstraintObservationClosureV1(
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
  familyId: Nhm2SemiclassicalV3ConstraintFamilyId,
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
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
  arrays: Map<string, readonly number[]>,
): {
  families: Nhm2SemiclassicalV3ConstraintOperandFamilyReplay[];
  blockers: Nhm2SemiclassicalV3ConstraintOperandReplayBlocker[];
} => {
  const blockers: Nhm2SemiclassicalV3ConstraintOperandReplayBlocker[] = [];
  const families: Nhm2SemiclassicalV3ConstraintOperandFamilyReplay[] = [];
  const arithmeticPolicy = NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY;

  for (const familyId of NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER) {
    const levels: Nhm2SemiclassicalV3ConstraintOperandLevelReplay[] = [];
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
      if (mismatch > arithmeticPolicy.producerResidualConsistencyTolerance) {
        blockers.push(
          blocker(
            "submitted_residual_mismatch_tolerance_exceeded",
            `Mismatch ${mismatch} exceeds ${arithmeticPolicy.producerResidualConsistencyTolerance}.`,
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
      arithmeticPolicy.centralResidualUpper95Tolerance
    ) {
      blockers.push(
        blocker(
          "central_residual_upper95_tolerance_exceeded",
          `Central residual upper95 ${levels[2].residualUpper95} exceeds ${arithmeticPolicy.centralResidualUpper95Tolerance}.`,
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
        blockers,
      );
    }
    const deltaRatio = finite(
      D01Lower / D12Upper,
      `/families/${familyId}/convergence/deltaRatio`,
    );
    if (!(deltaRatio > 0)) {
      throw new ArithmeticReplayError(
        "arithmetic_nonfinite_or_overflow",
        `/families/${familyId}/convergence/deltaRatio`,
        "The interlevel-difference ratio underflowed or was not strictly positive.",
      );
    }
    const logTwo = finite(
      Math.log(2),
      `/families/${familyId}/convergence/log2`,
    );
    const pLower = finite(
      Math.log(deltaRatio) / logTwo,
      `/families/${familyId}/convergence/pLower`,
    );
    const delta01MonotonicLimit = add(
      D01Lower,
      arithmeticPolicy.monotonicityAbsoluteTolerance,
      `/families/${familyId}/convergence/delta01MonotonicLimit`,
    );
    if (D12Upper > delta01MonotonicLimit) {
      blockers.push(
        blocker(
          "regulator_monotonicity_failed",
          "The fine interlevel-difference upper bound exceeds the coarse bound plus the frozen tolerance.",
          `/families/${familyId}/convergence`,
        ),
      );
    }
    if (pLower < arithmeticPolicy.requiredMinimumOrder) {
      blockers.push(
        blocker(
          "regulator_order_failed",
          `Conservative order lower bound ${pLower} is below ${arithmeticPolicy.requiredMinimumOrder}.`,
          `/families/${familyId}/convergence`,
        ),
      );
    }
    if (q2 > arithmeticPolicy.finalRegulatorErrorUpper95Tolerance) {
      blockers.push(
        blocker(
          "regulator_error_tolerance_exceeded",
          `Final q ${q2} exceeds ${arithmeticPolicy.finalRegulatorErrorUpper95Tolerance}.`,
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
  return { families, blockers };
};

/**
 * Content-addressed decoder and arithmetic replay only. The caller supplies a
 * secure file observation; this service performs no filesystem operation and
 * therefore cannot establish realpath, stable-file, or filesystem authority.
 */
export const replayNhm2SemiclassicalV3ConstraintOperands = (
  callerInput: unknown,
): Nhm2SemiclassicalV3ConstraintOperandReplayReceiptV1 => {
  let snapshot: unknown;
  try {
    snapshot = snapshotReplayInputOnce(callerInput);
  } catch {
    return receipt({
      blockers: [
        blocker(
          "input_snapshot_invalid",
          "Input could not be detached as an accessor-free plain graph with full byte views.",
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
        blockers: [
          blocker("input_shape_invalid", "Input keys do not match v3."),
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
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INPUT_CONTRACT_VERSION ||
      !Array.isArray(snapshot.fileObservations)
    ) {
      return receipt({
        blockers: [
          blocker(
            "input_shape_invalid",
            "Input version or file-observation array is invalid.",
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

    const manifestValidation =
      validateNhm2SemiclassicalV3ConstraintOperandManifest(snapshot.manifest);
    if (!manifestValidation.ok) {
      return receipt({
        blockers: [
          blocker(
            "manifest_invalid",
            manifestValidation.violations.join(","),
            "/manifest",
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
    const manifest = manifestValidation.manifest;
    const expected = expectedArrays(manifest);
    const observations =
      snapshot.fileObservations as Nhm2SemiclassicalV3ConstraintOperandFileObservationV1[];
    if (
      expected.length !== NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT ||
      observations.length !== expected.length
    ) {
      return receipt({
        blockers: [
          blocker(
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

    const bindingBlockers: Nhm2SemiclassicalV3ConstraintOperandReplayBlocker[] =
      [];
    const decoded = new Map<string, readonly number[]>();
    const observedBackingBuffers = new Set<ArrayBuffer>();
    for (let index = 0; index < expected.length; index += 1) {
      const expectedEntry = expected[index];
      const observation = observations[index] as unknown;
      const pointer = `/fileObservations/${index}`;
      if (
        !isRecord(observation) ||
        !hasExactKeys(observation, OBSERVATION_KEYS)
      ) {
        bindingBlockers.push(
          blocker(
            "file_observation_shape_invalid",
            "Observation keys are not exact.",
            pointer,
          ),
        );
        continue;
      }
      const expectedRole = expectedEntry.descriptor.arrayRole;
      if (observation.arrayRole !== expectedRole) {
        bindingBlockers.push(
          blocker(
            "file_observation_role_invalid",
            `Expected ${expectedRole}.`,
            `${pointer}/arrayRole`,
          ),
        );
      }
      const descriptor = expectedEntry.descriptor;
      if (
        observation.observationMode !== "caller_supplied_secure_file_reader" ||
        observation.path !== descriptor.path ||
        observation.sha256 !== descriptor.sha256 ||
        observation.sizeBytes !== descriptor.sizeBytes ||
        observation.freshness !== descriptor.freshness ||
        observation.observedAt !== descriptor.observedAt ||
        !SHA256.test(String(observation.sha256))
      ) {
        bindingBlockers.push(
          blocker(
            "file_observation_metadata_invalid",
            "Observation metadata does not exactly match the manifest descriptor.",
            pointer,
          ),
        );
      }
      if (
        !(observation.bytes instanceof Uint8Array) ||
        Object.getPrototypeOf(observation.bytes) !== Uint8Array.prototype ||
        observation.bytes.byteOffset !== 0 ||
        observation.bytes.byteLength !== observation.bytes.buffer.byteLength ||
        observation.bytes.byteLength !==
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES ||
        observation.sizeBytes !== observation.bytes.byteLength
      ) {
        bindingBlockers.push(
          blocker(
            "file_bytes_full_view_invalid",
            "Bytes must be one exact full 2048-byte Uint8Array view.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      const backingBuffer = observation.bytes.buffer as ArrayBuffer;
      if (observedBackingBuffers.has(backingBuffer)) {
        bindingBlockers.push(
          blocker(
            "file_bytes_backing_buffer_not_unique",
            "Each observed array must own one distinct full ArrayBuffer.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      observedBackingBuffers.add(backingBuffer);
      if (sha256(observation.bytes) !== descriptor.sha256) {
        bindingBlockers.push(
          blocker(
            "file_sha256_mismatch",
            "Observed bytes do not match the descriptor SHA-256.",
            `${pointer}/bytes`,
          ),
        );
        continue;
      }
      const values = decodeFloat64Le(observation.bytes);
      const nonfiniteIndex = values.findIndex(
        (value) => !Number.isFinite(value),
      );
      if (nonfiniteIndex >= 0) {
        bindingBlockers.push(
          blocker(
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
          bindingBlockers.push(
            blocker(
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
    }

    if (bindingBlockers.length > 0) {
      return receipt({
        blockers: bindingBlockers,
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
      manifestInventorySha256: manifest.operandInventorySha256,
      scientificInputClosureSha256: manifest.scientificInputClosure.sha256,
      completeInputClosureSha256: manifest.completeInputClosure.sha256,
      observationCount: 63 as const,
      aggregateBytes:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT *
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
      observationClosureSha256Domain:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OBSERVATION_CLOSURE_SHA256_DOMAIN,
      observationClosureSha256:
        computeNhm2SemiclassicalV3ConstraintObservationClosureSha256(
          observations,
        ),
    };
    try {
      const replay = arithmeticReplay(manifest, decoded);
      return receipt({
        blockers: replay.blockers,
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
          blockers: [
            ...error.priorIssues,
            blocker(error.code, error.message, error.pointer),
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
        blockers: [
          blocker(
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
      blockers: [
        blocker(
          "internal_replay_error",
          "The secure decoder rejected an unexpected input state.",
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
