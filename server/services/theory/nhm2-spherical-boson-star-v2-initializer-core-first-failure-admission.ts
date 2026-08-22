/**
 * Program gate: G1-R1F — frozen-core first-failure authentication
 * Workstream: content-addressed failure evidence admission
 * Capability or component: server-owned exact-byte observer and opaque identity capability
 * Current maturity: diagnostic receipt exists; server admission implemented here
 * Target maturity: authenticated authority-neutral first-failure observation
 * Required frozen inputs: exact receipt path, raw hash/size, self-hash domain, frozen failure
 * Required evidence: stable held-file read, raw/self-hash match, false authority, opaque identity
 * Stop/fail criteria: any byte/path/identity/hash/authority drift
 * Explicit non-goals: candidate execution, replay authority, retuning, downstream numerics
 * Downstream gate unlocked: exact FAIL/BLOCKED disposition only
 *
 * Mathematical semantics: unchanged.
 * Runtime authority: server observation identity only; all scientific authority remains false.
 * Receipt semantics: validates one already materialized diagnostic receipt.
 */

import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { fileURLToPath } from "node:url";

const RECEIPT_SELF_HASH_DOMAIN =
  "nhm2-spherical-boson-star-v2/initializer-core-first-failure-receipt/v1\n";
const EXPECTED_RECEIPT_SELF_SHA256 =
  "cb9c36432486b4138ad01b8c8beebaca4eecb480fdd54a9a5f57a5030c4ed0cb";
const EXPECTED_RECEIPT_RAW_SHA256 =
  "34133d2c5e077b92618ea9420975f165c01134f5ab06c46f1e4eb4127bde730a";
const EXPECTED_RECEIPT_SIZE_BYTES = 6_837;
const EXPECTED_FAILURE_CODE = "armijo_schedule_exhausted_without_retry";
const EXPECTED_STATE_SHA256 =
  "601af0c0de01be4bb5a2abc0dc743cae57397a50c9406720856ae396c7325e50";
const EXPECTED_RESIDUAL_SHA256 =
  "13418bbf6f97925754b7dd999b1e70e2d2495d2efb4993f61ee98cf4be62dc17";
const EXPECTED_RECEIPT_PATH = fileURLToPath(
  new URL(
    "../../../docs/research/nhm2-spherical-boson-star-v2-initializer-core-first-failure-cb9c36432486b4138ad01b8c8beebaca4eecb480fdd54a9a5f57a5030c4ed0cb.json",
    import.meta.url,
  ),
);

const OUTER_BLOCKERS = Object.freeze([
  "runtime_lineage_disjoint_independent_replay_absent",
  "scientific_preseal_absent",
  "six_payload_initializer_unreachable_after_core_failure",
  "candidate_numeric_read_not_performed",
] as const);

const AUTHORITY = Object.freeze({
  candidateAdmission: false,
  candidateExecution: false,
  diagnosticTheoryGraphLamp: false,
  execution: false,
  physicalViability: false,
  propulsion: false,
  replay: false,
  transport: false,
} as const);

declare const capabilityBrand: unique symbol;

export type Nhm2SphericalBosonStarV2InitializerFirstFailureCapability = {
  readonly [capabilityBrand]: true;
};

export type Nhm2SphericalBosonStarV2InitializerFirstFailureObservation =
  Readonly<{
    status: "server_authenticated_diagnostic_first_failure_observed";
    artifactId: "nhm2.spherical_boson_star_v2_initializer_core_first_failure_receipt";
    candidateId: "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1";
    checkpoint: Readonly<{
      gridNodeCount: 64;
      amplitude: "2^-16";
      requestedCandidateCheckpointReached: false;
    }>;
    failure: Readonly<{
      code: "armijo_schedule_exhausted_without_retry";
      equationLinf: 6.052214285290347e-11;
      stateF64leSha256: string;
      residualF64leSha256: string;
    }>;
    receipt: Readonly<{
      path: string;
      rawSha256: string;
      sizeBytes: 6837;
      selfSha256: string;
    }>;
    sourceImplementationDisjoint: true;
    runtimeLineageDisjoint: false;
    qualifiesAsRuntimeDisjointIndependentReplay: false;
    receiptDeclaredServerAuthenticatedObservation: false;
    serverOwnedExactByteObservation: true;
    serverCapabilityIdentityAuthenticated: true;
    blockers: typeof OUTER_BLOCKERS;
    authority: typeof AUTHORITY;
  }>;

const admitted = new WeakMap<
  object,
  Nhm2SphericalBosonStarV2InitializerFirstFailureObservation
>();

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function u64le(value: number): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

function exactRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("initializer_first_failure_receipt_root_invalid");
  }
  return value as Record<string, unknown>;
}

function readExactReceipt(): { bytes: Buffer; canonicalPath: string } {
  const before = lstatSync(EXPECTED_RECEIPT_PATH, { bigint: true });
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n) {
    throw new Error("initializer_first_failure_receipt_path_identity_invalid");
  }
  const canonicalPath = realpathSync.native(EXPECTED_RECEIPT_PATH);
  if (canonicalPath !== realpathSync.native(EXPECTED_RECEIPT_PATH)) {
    throw new Error("initializer_first_failure_receipt_realpath_drifted");
  }
  const noFollow = "O_NOFOLLOW" in constants ? constants.O_NOFOLLOW : 0;
  const descriptor = openSync(
    EXPECTED_RECEIPT_PATH,
    constants.O_RDONLY | noFollow,
  );
  try {
    const held = fstatSync(descriptor, { bigint: true });
    if (
      !held.isFile() ||
      held.dev !== before.dev ||
      held.ino !== before.ino ||
      held.size !== BigInt(EXPECTED_RECEIPT_SIZE_BYTES)
    ) {
      throw new Error(
        "initializer_first_failure_receipt_held_identity_invalid",
      );
    }
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor, { bigint: true });
    if (
      after.dev !== held.dev ||
      after.ino !== held.ino ||
      after.size !== held.size ||
      after.mtimeNs !== held.mtimeNs ||
      after.ctimeNs !== held.ctimeNs
    ) {
      throw new Error("initializer_first_failure_receipt_read_drifted");
    }
    return { bytes, canonicalPath };
  } finally {
    closeSync(descriptor);
  }
}

function validateReceipt(bytes: Buffer): Record<string, unknown> {
  if (
    bytes.length !== EXPECTED_RECEIPT_SIZE_BYTES ||
    sha256(bytes) !== EXPECTED_RECEIPT_RAW_SHA256
  ) {
    throw new Error("initializer_first_failure_receipt_raw_binding_mismatch");
  }
  const text = bytes.toString("utf8");
  if (!text.endsWith("\n") || text.includes("\r") || text.includes("\0")) {
    throw new Error("initializer_first_failure_receipt_wire_invalid");
  }
  const parsed = exactRecord(JSON.parse(text));
  const { receiptSha256, ...unsigned } = parsed;
  const unsignedBytes = Buffer.from(
    JSON.stringify(canonicalize(unsigned)),
    "utf8",
  );
  const recomputed = sha256(
    Buffer.concat([
      Buffer.from(RECEIPT_SELF_HASH_DOMAIN, "utf8"),
      u64le(unsignedBytes.length),
      unsignedBytes,
    ]),
  );
  if (
    receiptSha256 !== EXPECTED_RECEIPT_SELF_SHA256 ||
    recomputed !== EXPECTED_RECEIPT_SELF_SHA256
  ) {
    throw new Error("initializer_first_failure_receipt_self_hash_mismatch");
  }

  const checkpoint = exactRecord(parsed.checkpoint);
  const failure = exactRecord(parsed.observedFailure);
  const comparison = exactRecord(parsed.comparison);
  const authority = exactRecord(parsed.authority);
  if (
    parsed.artifactId !==
      "nhm2.spherical_boson_star_v2_initializer_core_first_failure_receipt" ||
    parsed.candidateId !==
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" ||
    parsed.serverAuthenticatedObservation !== false ||
    checkpoint.gridNodeCount !== 64 ||
    checkpoint.amplitude !== "2^-16" ||
    checkpoint.requestedCandidateCheckpointReached !== false ||
    failure.failureCode !== EXPECTED_FAILURE_CODE ||
    failure.equationLinf !== 6.052214285290347e-11 ||
    failure.currentStateF64leSha256 !== EXPECTED_STATE_SHA256 ||
    failure.currentResidualF64leSha256 !== EXPECTED_RESIDUAL_SHA256 ||
    comparison.exactFailureFieldsMatched !== true ||
    comparison.sourceImplementationDisjoint !== true ||
    comparison.runtimeLineageDisjoint !== false ||
    comparison.qualifiesAsRuntimeDisjointIndependentReplay !== false ||
    Object.values(authority).some((value) => value !== false)
  ) {
    throw new Error("initializer_first_failure_receipt_semantic_mismatch");
  }
  return parsed;
}

export function observeNhm2SphericalBosonStarV2InitializerFirstFailure(
  ...args: readonly unknown[]
): Nhm2SphericalBosonStarV2InitializerFirstFailureCapability {
  if (args.length !== 0) {
    throw new Error(
      "initializer_first_failure_observer_zero_arguments_required",
    );
  }
  const { bytes, canonicalPath } = readExactReceipt();
  validateReceipt(bytes);
  const observation = Object.freeze({
    status: "server_authenticated_diagnostic_first_failure_observed" as const,
    artifactId:
      "nhm2.spherical_boson_star_v2_initializer_core_first_failure_receipt" as const,
    candidateId:
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1" as const,
    checkpoint: Object.freeze({
      gridNodeCount: 64 as const,
      amplitude: "2^-16" as const,
      requestedCandidateCheckpointReached: false as const,
    }),
    failure: Object.freeze({
      code: EXPECTED_FAILURE_CODE,
      equationLinf: 6.052214285290347e-11 as const,
      stateF64leSha256: EXPECTED_STATE_SHA256,
      residualF64leSha256: EXPECTED_RESIDUAL_SHA256,
    }),
    receipt: Object.freeze({
      path: canonicalPath,
      rawSha256: EXPECTED_RECEIPT_RAW_SHA256,
      sizeBytes: EXPECTED_RECEIPT_SIZE_BYTES,
      selfSha256: EXPECTED_RECEIPT_SELF_SHA256,
    }),
    sourceImplementationDisjoint: true as const,
    runtimeLineageDisjoint: false as const,
    qualifiesAsRuntimeDisjointIndependentReplay: false as const,
    receiptDeclaredServerAuthenticatedObservation: false as const,
    serverOwnedExactByteObservation: true as const,
    serverCapabilityIdentityAuthenticated: true as const,
    blockers: OUTER_BLOCKERS,
    authority: AUTHORITY,
  });
  const capability = Object.freeze(
    Object.create(null),
  ) as Nhm2SphericalBosonStarV2InitializerFirstFailureCapability;
  admitted.set(capability, observation);
  return capability;
}

export function requireNhm2SphericalBosonStarV2InitializerFirstFailure(
  value: unknown,
): Nhm2SphericalBosonStarV2InitializerFirstFailureObservation {
  if (
    (typeof value !== "object" || value === null) &&
    typeof value !== "function"
  ) {
    throw new Error("initializer_first_failure_capability_identity_required");
  }
  const observation = admitted.get(value as object);
  if (observation === undefined) {
    throw new Error("initializer_first_failure_capability_identity_required");
  }
  return observation;
}
