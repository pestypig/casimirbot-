import { createHash } from "node:crypto";

import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "./nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING } from "./nhm2-spherical-boson-star-v2-metric-demand-program.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING } from "./nhm2-spherical-boson-star-v2-operator-ordering-derivation-closure.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING } from "./nhm2-spherical-boson-star-v2-pair-agreement.v1";
import {
  computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  type Nhm2SphericalV2DiagnosticSkeletonBindingV2,
  type Nhm2SphericalV2PrePresealStaticClosureV2,
} from "./nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
} from "./nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING } from "./nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_run_artifact_wire" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_run_artifact_wire/v2" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-run-artifact-wire/v2\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_preexecution_output_skeleton" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_V2_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/preexecution-output-skeleton-wire/v2\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_preexecution_output_skeleton_persistence_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_preexecution_output_skeleton_persistence_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/preexecution-output-skeleton-persistence-receipt/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS =
  Object.freeze({
    maximumCanonicalCodeUnits: 2_097_152,
    maximumCanonicalUtf8Bytes: 2_097_152,
    maximumDepth: 32,
    maximumNodes: 32_768,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateStringUtf8Bytes: 1_048_576,
    maximumSkeletonUtf8Bytes: 1_048_576,
    maximumReceiptUtf8Bytes: 262_144,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS =
  Object.freeze({
    canonicalBytesGrantAuthority: false as const,
    skeletonWireValidationAuthority: false as const,
    filesystemObservationAuthority: false as const,
    durabilityAuthority: false as const,
    issuerAuthority: false as const,
    implementationClosureAuthority: false as const,
    runtimeClosureAuthority: false as const,
    outputAuthority: false as const,
    executionAuthority: false as const,
    executionObserved: false as const,
    candidateAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS =
  Object.freeze({
    candidateAccepted: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS =
  Object.freeze({
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    independentAgreementLamp: false as const,
    diagnosticPassLamp: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS = Object.freeze({
  authenticatedSkeletonDurabilityReady: false as const,
  acceptedGeometryReady: false as const,
  metricDemandExecutionReady: false as const,
  meanNoiseRealizationReady: false as const,
  operatorOrderingNumericalRealizationReady: false as const,
  primaryImplementationReady: false as const,
  independentImplementationReady: false as const,
  authenticatedRuntimeLoaderObservationReady: false as const,
  scientificPresealReady: false as const,
  executionReady: false as const,
  replayReady: false as const,
  pairAgreementReady: false as const,
});

export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES = Object.freeze({
  authenticatedSkeletonDurabilityReceipt: null,
  acceptedGeometryEvaluation: null,
  metricDemandExecutionReceipt: null,
  meanRsetRealization: null,
  noiseKernelRealization: null,
  operatorOrderingNumericalRealization: null,
  primaryImplementation: null,
  independentImplementation: null,
  runtimeLoaderObservation: null,
  scientificPreseal: null,
  outputManifest: null,
  replayReceipt: null,
  pairAgreementReceipt: null,
});

export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS = Object.freeze([
  "server_authenticated_skeleton_durability_observer_not_implemented",
  "accepted_geometry_evaluation_instance_absent",
  "metric_demand_execution_instance_absent",
  "mean_rset_realization_instance_absent",
  "noise_kernel_realization_instance_absent",
  "operator_ordering_numerical_realization_instance_absent",
  "primary_implementation_instance_absent",
  "independent_implementation_instance_absent",
  "server_authenticated_runtime_loader_observer_not_implemented",
  "scientific_preseal_instance_absent",
  "output_manifest_instance_absent",
  "replay_receipt_absent",
  "pair_agreement_receipt_absent",
  "execution_not_authorized",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS =
  Object.freeze({
    rawReplaySchema: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    siOutputNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    metricDemandProgram:
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
    smearingWeightFreeze:
      NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
    staticGroundStateHadamardMeanNoiseRealization:
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
    operatorOrderingDerivationClosure:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING,
    branchSolverPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
    pairAgreement: NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SOURCE_PROVENANCE = Object.freeze({
  sourceMode: "state_derived_not_declared_lever" as const,
  meanRsetOrigin: "renormalized_quantum_state_expectation_value" as const,
  noiseKernelOrigin:
    "connected_symmetrized_quantum_state_two_point_function" as const,
  declaredLeverTensorUsed: false as const,
  inputClosureExcludesDeclaredLeverTensor: true as const,
});

export const NHM2_SPHERICAL_BOSON_STAR_V2_IMPLEMENTATION_PAIR_PLAN =
  Object.freeze({
    exactRoleOrder: Object.freeze(["primary", "independent"] as const),
    independentlyAuthoredNumericalPathsRequired: true as const,
    sourceDependencyExecutableAndRuntimeBytesCommittedByA: true as const,
    separateImplementationRootsRequired: true as const,
    separateOutputRootsRequired: true as const,
    outputRootsTakenExactlyFromA: true as const,
    counterpartOutputsMounted: false as const,
    ambientRepositoryMounted: false as const,
    implementationInstancesPresent: false as const,
  });

const RAW_DESCRIPTORS =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS;
const RAW_ALIASES =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES;
const EXACT_PAYLOAD_SIZE_BYTES = RAW_DESCRIPTORS.reduce(
  (sum, entry) => sum + entry.sizeBytes,
  0,
);

export const NHM2_SPHERICAL_BOSON_STAR_V2_HASHLESS_OUTPUT_INVENTORY_PLAN =
  Object.freeze({
    exactPhysicalFileCount: 68 as const,
    exactLogicalAliasCount: 21 as const,
    exactPayloadSizeBytes: 6_693_376 as const,
    plannedPhysicalFiles: RAW_DESCRIPTORS,
    centralLevel2LogicalAliases: RAW_ALIASES,
    actualOutputSha256FieldsAllowed: false as const,
    outputFreshnessOrObservationFieldsAllowed: false as const,
    outputPersistenceOrExecutionReceiptFieldsAllowed: false as const,
    outputBytesPresent: false as const,
  });

export type Nhm2SphericalBosonStarV2SkeletonEvidenceV2 = Readonly<{
  skeletonFrozenAt: string;
}>;

export type Nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION;
  phase: "pre_scientific_preseal_hashless_output_skeleton";
  authorityFalse: true;
  candidateBinding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING;
  sourceProvenance: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SOURCE_PROVENANCE;
  preexecutionProfileBinding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING;
  skeletonFrozenAt: string;
  prePresealStaticClosure: Nhm2SphericalV2PrePresealStaticClosureV2;
  prePresealStaticClosureSha256: string;
  scientificDefinitionBindings: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS;
  implementationPairPlan: typeof NHM2_SPHERICAL_BOSON_STAR_V2_IMPLEMENTATION_PAIR_PLAN;
  outputInventoryPlan: typeof NHM2_SPHERICAL_BOSON_STAR_V2_HASHLESS_OUTPUT_INVENTORY_PLAN;
  readiness: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS;
  instances: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES;
  blockers: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS;
  authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS;
  claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS;
  lamps: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS;
}>;

export type Nhm2SphericalBosonStarV2SkeletonByteBindingV2 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION;
  mediaType: "application/json";
  rawSha256: string;
  wireSha256: string;
  sizeBytes: number;
  skeletonFrozenAt: string;
  prePresealStaticClosureSha256: string;
}>;

export type Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptSkeletonBindingV1 =
  Readonly<
    Nhm2SphericalBosonStarV2SkeletonByteBindingV2 & {
      path: string;
    }
  >;

export type Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptUnsignedV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION;
    phase: "external_durable_readback_receipt_integrity_only";
    authorityFalse: true;
    candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID;
    persistenceKind: "external_durable_publication_readback";
    observationAuthentication: "not_established_by_plain_canonical_json";
    authenticatedObservationContext: null;
    skeletonBinding: Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptSkeletonBindingV1;
    persistedAt: string;
    authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS;
    claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS;
  }>;

export type Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptV1 = Readonly<
  Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptUnsignedV1 & {
    receiptSha256: string;
  }
>;

export type Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBindingV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION;
    mediaType: "application/json";
    rawSha256: string;
    receiptSha256: string;
    sizeBytes: number;
  }>;

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

type ParsedFrame = Readonly<{
  value: unknown;
  pointer: string;
  depth: number;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const PRINTABLE_ASCII_PATH_SEGMENT = /^[\x20-\x7e]+$/;

const isExactAbsoluteLinuxPath = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.startsWith("/")) return false;
  const segments = value.slice(1).split("/");
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      PRINTABLE_ASCII_PATH_SEGMENT.test(segment),
  );
};
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const pointerSegment = (value: string): string =>
  value.replaceAll("~", "~0").replaceAll("/", "~1");

const nonzeroSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("run_artifact_wire_v2_u64_invalid");
  }
  const output = Buffer.alloc(8);
  output.writeBigUInt64LE(BigInt(value));
  return output;
};

const canonicalJsonFromValue = (value: CanonicalValue): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonFromValue).join(",")}]`;
  }
  const record = value as { readonly [key: string]: CanonicalValue };
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${canonicalJsonFromValue(record[key]!)}`,
    )
    .join(",")}}`;
};

const validateParsedTree = (root: unknown, code: string): void => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS;
  const stack: ParsedFrame[] = [{ value: root, pointer: "", depth: 0 }];
  let nodes = 0;
  let aggregateStringUtf8Bytes = 0;
  while (stack.length > 0) {
    const frame = stack.pop()!;
    nodes += 1;
    if (nodes > limits.maximumNodes) {
      throw new TypeError(`${code}:nodes:${frame.pointer || "/"}`);
    }
    if (frame.depth > limits.maximumDepth) {
      throw new TypeError(`${code}:depth:${frame.pointer || "/"}`);
    }
    const value = frame.value;
    if (value === null || typeof value === "boolean") continue;
    if (typeof value === "number") {
      if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
        throw new TypeError(`${code}:number:${frame.pointer || "/"}`);
      }
      continue;
    }
    if (typeof value === "string") {
      if (
        value.includes("\0") ||
        /[\ud800-\udfff]/u.test(value) ||
        value.normalize("NFC") !== value
      ) {
        throw new TypeError(`${code}:string:${frame.pointer || "/"}`);
      }
      const size = Buffer.byteLength(value, "utf8");
      if (size > limits.maximumStringUtf8Bytes) {
        throw new TypeError(`${code}:string_utf8:${frame.pointer || "/"}`);
      }
      aggregateStringUtf8Bytes += size;
      if (aggregateStringUtf8Bytes > limits.maximumAggregateStringUtf8Bytes) {
        throw new TypeError(
          `${code}:aggregate_string_utf8:${frame.pointer || "/"}`,
        );
      }
      continue;
    }
    if (typeof value !== "object") {
      throw new TypeError(`${code}:surface:${frame.pointer || "/"}`);
    }
    if (Array.isArray(value)) {
      if (value.length > limits.maximumArrayLength) {
        throw new TypeError(`${code}:array:${frame.pointer || "/"}`);
      }
      for (let index = value.length - 1; index >= 0; index -= 1) {
        stack.push({
          value: value[index],
          pointer: `${frame.pointer}/${index}`,
          depth: frame.depth + 1,
        });
      }
      continue;
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length > limits.maximumObjectPropertyCount) {
      throw new TypeError(`${code}:object:${frame.pointer || "/"}`);
    }
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index]!;
      const keyPointer = `${frame.pointer}/${pointerSegment(key)}`;
      if (
        FORBIDDEN_KEYS.has(key) ||
        key.includes("\0") ||
        /[\ud800-\udfff]/u.test(key) ||
        key.normalize("NFC") !== key
      ) {
        throw new TypeError(`${code}:key:${keyPointer}`);
      }
      const size = Buffer.byteLength(key, "utf8");
      if (size > limits.maximumPropertyKeyUtf8Bytes) {
        throw new TypeError(`${code}:key_utf8:${keyPointer}`);
      }
      aggregateStringUtf8Bytes += size;
      if (aggregateStringUtf8Bytes > limits.maximumAggregateStringUtf8Bytes) {
        throw new TypeError(`${code}:aggregate_string_utf8:${keyPointer}`);
      }
      stack.push({
        value: record[key],
        pointer: keyPointer,
        depth: frame.depth + 1,
      });
    }
  }
};

const parseBoundedCanonicalJson = (
  canonicalJson: unknown,
  code: string,
  maximumBytes: number = NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumCanonicalUtf8Bytes,
): CanonicalValue => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS;
  if (typeof canonicalJson !== "string") {
    throw new TypeError(`${code}:canonical_json_text_required`);
  }
  if (canonicalJson.length > limits.maximumCanonicalCodeUnits) {
    throw new TypeError(`${code}:canonical_code_units_exceeded`);
  }
  const byteLength = Buffer.byteLength(canonicalJson, "utf8");
  if (byteLength > maximumBytes) {
    throw new TypeError(`${code}:canonical_bytes_exceeded`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(canonicalJson) as unknown;
  } catch {
    throw new TypeError(`${code}:json_parse_invalid`);
  }
  validateParsedTree(parsed, code);
  if (canonicalJsonFromValue(parsed as CanonicalValue) !== canonicalJson) {
    throw new TypeError(`${code}:canonical_encoding_invalid`);
  }
  return parsed as CanonicalValue;
};

const exactKeys = (value: unknown, expected: readonly string[]): boolean => {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
};

const sameCanonical = (left: unknown, right: unknown): boolean =>
  canonicalJsonFromValue(left as CanonicalValue) ===
  canonicalJsonFromValue(right as CanonicalValue);

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

const parseUtcNanoseconds = (value: unknown): bigint | null => {
  if (typeof value !== "string") return null;
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{9})Z$/.exec(value);
  if (match === null) return null;
  const [, year, month, day, hour, minute, second, fraction] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second);
  if (y < 1970 || mo < 1 || mo > 12 || h > 23 || mi > 59 || s > 59) {
    return null;
  }
  const maxDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (d < 1 || d > maxDay) return null;
  const milliseconds = Date.UTC(y, mo - 1, d, h, mi, s);
  const roundTrip = new Date(milliseconds);
  if (
    roundTrip.getUTCFullYear() !== y ||
    roundTrip.getUTCMonth() !== mo - 1 ||
    roundTrip.getUTCDate() !== d ||
    roundTrip.getUTCHours() !== h ||
    roundTrip.getUTCMinutes() !== mi ||
    roundTrip.getUTCSeconds() !== s
  ) {
    return null;
  }
  return BigInt(milliseconds) * 1_000_000n + BigInt(fraction);
};

const lengthDelimitedSha256 = (
  domain: string,
  canonicalJson: string,
): string => {
  const bytes = Buffer.from(canonicalJson, "utf8");
  return createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_EXACT_KEYS = Object.freeze([
  "artifactId",
  "authorityFalse",
  "authorityLocks",
  "blockers",
  "candidateBinding",
  "claimLocks",
  "contractVersion",
  "implementationPairPlan",
  "instances",
  "lamps",
  "outputInventoryPlan",
  "phase",
  "prePresealStaticClosure",
  "prePresealStaticClosureSha256",
  "preexecutionProfileBinding",
  "readiness",
  "scientificDefinitionBindings",
  "skeletonFrozenAt",
  "sourceProvenance",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_EXACT_KEYS =
  Object.freeze([
    "closurePhase",
    "commandArgvSha256",
    "dirtyTreeDigestSha256",
    "expectedRuntimeClosureSha256",
    "outputRootPlan",
    "outputRootPlanSha256",
    "prePresealFreshnessInventorySha256",
    "prePresealStaticInputAggregateSha256",
    "preexecutionProfileBinding",
    "schemaVersion",
  ] as const);

const skeletonSemanticViolations = (value: unknown): string[] => {
  if (!exactKeys(value, NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_EXACT_KEYS)) {
    return ["spherical_v2_skeleton_v2_root_fields_invalid"];
  }
  const root =
    value as unknown as Nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2;
  if (
    root.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID ||
    root.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION ||
    root.phase !== "pre_scientific_preseal_hashless_output_skeleton" ||
    root.authorityFalse !== true ||
    parseUtcNanoseconds(root.skeletonFrozenAt) === null
  ) {
    return ["spherical_v2_skeleton_v2_identity_or_timestamp_invalid"];
  }
  if (
    !sameCanonical(
      root.preexecutionProfileBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    ) ||
    !sameCanonical(
      root.candidateBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    ) ||
    !sameCanonical(
      root.sourceProvenance,
      NHM2_SPHERICAL_BOSON_STAR_V2_SOURCE_PROVENANCE,
    ) ||
    !sameCanonical(
      root.scientificDefinitionBindings,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
    ) ||
    !sameCanonical(
      root.implementationPairPlan,
      NHM2_SPHERICAL_BOSON_STAR_V2_IMPLEMENTATION_PAIR_PLAN,
    ) ||
    !sameCanonical(
      root.outputInventoryPlan,
      NHM2_SPHERICAL_BOSON_STAR_V2_HASHLESS_OUTPUT_INVENTORY_PLAN,
    )
  ) {
    return ["spherical_v2_skeleton_v2_fixed_binding_or_plan_drift"];
  }
  if (
    !exactKeys(
      root.prePresealStaticClosure,
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_skeleton_v2_A_shape_invalid"];
  }
  const closureCanonicalJson = canonicalJsonFromValue(
    root.prePresealStaticClosure as unknown as CanonicalValue,
  );
  let expectedClosureSha256: string;
  try {
    expectedClosureSha256 =
      computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(
        closureCanonicalJson,
      );
  } catch {
    return ["spherical_v2_skeleton_v2_A_semantics_invalid"];
  }
  if (
    root.prePresealStaticClosureSha256 !== expectedClosureSha256 ||
    !sameCanonical(
      root.prePresealStaticClosure.preexecutionProfileBinding,
      root.preexecutionProfileBinding,
    )
  ) {
    return ["spherical_v2_skeleton_v2_A_digest_or_profile_binding_invalid"];
  }
  if (
    !sameCanonical(
      root.readiness,
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS,
    ) ||
    !sameCanonical(
      root.instances,
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES,
    ) ||
    !sameCanonical(
      root.blockers,
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS,
    ) ||
    !sameCanonical(
      root.authorityLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
    ) ||
    !sameCanonical(
      root.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
    ) ||
    !sameCanonical(
      root.lamps,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS,
    )
  ) {
    return ["spherical_v2_skeleton_v2_false_null_boundary_invalid"];
  }
  return [];
};

export const nhm2SphericalBosonStarV2RunArtifactWireV2CanonicalJson = (
  canonicalJson: string,
): string => {
  parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_run_artifact_wire_v2_canonical_json",
  );
  return canonicalJson;
};

export const deriveNhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2CanonicalJson =
  (
    prePresealStaticClosureCanonicalJson: string,
    evidenceCanonicalJson: string,
  ): string => {
    const closure = parseBoundedCanonicalJson(
      prePresealStaticClosureCanonicalJson,
      "spherical_v2_skeleton_v2_A",
    ) as unknown as Nhm2SphericalV2PrePresealStaticClosureV2;
    const evidence = parseBoundedCanonicalJson(
      evidenceCanonicalJson,
      "spherical_v2_skeleton_v2_evidence",
    );
    if (!exactKeys(evidence, ["skeletonFrozenAt"])) {
      throw new TypeError("spherical_v2_skeleton_v2_evidence_shape_invalid");
    }
    const skeletonFrozenAtValue = (evidence as { skeletonFrozenAt: unknown })
      .skeletonFrozenAt;
    if (parseUtcNanoseconds(skeletonFrozenAtValue) === null) {
      throw new TypeError(
        "spherical_v2_skeleton_v2_evidence_timestamp_invalid",
      );
    }
    const skeletonFrozenAt = skeletonFrozenAtValue as string;
    const prePresealStaticClosureSha256 =
      computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(
        prePresealStaticClosureCanonicalJson,
      );
    const skeleton: Nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2 = {
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION,
      phase: "pre_scientific_preseal_hashless_output_skeleton",
      authorityFalse: true,
      candidateBinding: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      sourceProvenance: NHM2_SPHERICAL_BOSON_STAR_V2_SOURCE_PROVENANCE,
      preexecutionProfileBinding:
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
      skeletonFrozenAt,
      prePresealStaticClosure: closure,
      prePresealStaticClosureSha256,
      scientificDefinitionBindings:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
      implementationPairPlan:
        NHM2_SPHERICAL_BOSON_STAR_V2_IMPLEMENTATION_PAIR_PLAN,
      outputInventoryPlan:
        NHM2_SPHERICAL_BOSON_STAR_V2_HASHLESS_OUTPUT_INVENTORY_PLAN,
      readiness: NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS,
      instances: NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES,
      blockers: NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS,
      authorityLocks:
        NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
      claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
      lamps: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS,
    };
    const violations = skeletonSemanticViolations(skeleton);
    if (violations.length !== 0) {
      throw new TypeError(violations[0]);
    }
    return canonicalJsonFromValue(skeleton as unknown as CanonicalValue);
  };

export const nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations = (
  value: unknown,
): readonly string[] => {
  let root: CanonicalValue;
  try {
    root = parseBoundedCanonicalJson(
      value,
      "spherical_v2_skeleton_v2",
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumSkeletonUtf8Bytes,
    );
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_skeleton_v2_surface_invalid",
    ]);
  }
  try {
    return Object.freeze(skeletonSemanticViolations(root));
  } catch {
    return Object.freeze([
      "spherical_v2_skeleton_v2_semantic_validation_failed",
    ]);
  }
};

const requireValidSkeletonCanonicalJson = (
  canonicalJson: string,
): CanonicalValue => {
  const violations =
    nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
      canonicalJson,
    );
  if (violations.length !== 0) {
    throw new TypeError(violations[0]);
  }
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_skeleton_v2",
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumSkeletonUtf8Bytes,
  );
};

export const computeNhm2SphericalBosonStarV2SkeletonByteBindingV2 = (
  skeletonCanonicalJson: string,
): Nhm2SphericalBosonStarV2SkeletonByteBindingV2 => {
  const root = requireValidSkeletonCanonicalJson(
    skeletonCanonicalJson,
  ) as unknown as Nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2;
  const bytes = Buffer.from(skeletonCanonicalJson, "utf8");
  return deepFreeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION,
    mediaType: "application/json" as const,
    rawSha256: createHash("sha256").update(bytes).digest("hex"),
    wireSha256: lengthDelimitedSha256(
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_V2_SHA256_DOMAIN,
      skeletonCanonicalJson,
    ),
    sizeBytes: bytes.length,
    skeletonFrozenAt: root.skeletonFrozenAt,
    prePresealStaticClosureSha256: root.prePresealStaticClosureSha256,
  });
};

const RECEIPT_SKELETON_BINDING_EXACT_KEYS = Object.freeze([
  "artifactId",
  "contractVersion",
  "mediaType",
  "path",
  "prePresealStaticClosureSha256",
  "rawSha256",
  "sizeBytes",
  "skeletonFrozenAt",
  "wireSha256",
] as const);

const RECEIPT_UNSIGNED_EXACT_KEYS = Object.freeze([
  "artifactId",
  "authorityFalse",
  "authorityLocks",
  "authenticatedObservationContext",
  "candidateId",
  "claimLocks",
  "contractVersion",
  "observationAuthentication",
  "persistedAt",
  "persistenceKind",
  "phase",
  "skeletonBinding",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_EXACT_KEYS =
  Object.freeze([...RECEIPT_UNSIGNED_EXACT_KEYS, "receiptSha256"] as const);

const receiptUnsignedSemanticViolations = (value: unknown): string[] => {
  if (!exactKeys(value, RECEIPT_UNSIGNED_EXACT_KEYS)) {
    return ["spherical_v2_skeleton_receipt_unsigned_fields_invalid"];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptUnsignedV1;
  if (
    receipt.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION ||
    receipt.phase !== "external_durable_readback_receipt_integrity_only" ||
    receipt.authorityFalse !== true ||
    receipt.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
    receipt.persistenceKind !== "external_durable_publication_readback" ||
    receipt.observationAuthentication !==
      "not_established_by_plain_canonical_json" ||
    receipt.authenticatedObservationContext !== null ||
    parseUtcNanoseconds(receipt.persistedAt) === null
  ) {
    return ["spherical_v2_skeleton_receipt_identity_invalid"];
  }
  if (
    !exactKeys(receipt.skeletonBinding, RECEIPT_SKELETON_BINDING_EXACT_KEYS)
  ) {
    return ["spherical_v2_skeleton_receipt_skeleton_binding_fields_invalid"];
  }
  const binding = receipt.skeletonBinding;
  const frozenAt = parseUtcNanoseconds(binding.skeletonFrozenAt);
  const persistedAt = parseUtcNanoseconds(receipt.persistedAt);
  if (
    binding.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID ||
    binding.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION ||
    binding.mediaType !== "application/json" ||
    !isExactAbsoluteLinuxPath(binding.path) ||
    !nonzeroSha256(binding.rawSha256) ||
    !nonzeroSha256(binding.wireSha256) ||
    !nonzeroSha256(binding.prePresealStaticClosureSha256) ||
    !Number.isSafeInteger(binding.sizeBytes) ||
    binding.sizeBytes <= 0 ||
    frozenAt === null ||
    persistedAt === null ||
    frozenAt >= persistedAt
  ) {
    return ["spherical_v2_skeleton_receipt_skeleton_binding_invalid"];
  }
  if (
    !sameCanonical(
      receipt.authorityLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
    ) ||
    !sameCanonical(
      receipt.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
    )
  ) {
    return ["spherical_v2_skeleton_receipt_false_lock_boundary_invalid"];
  }
  return [];
};

export const computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256 = (
  unsignedReceiptCanonicalJson: string,
): string => {
  const unsigned = parseBoundedCanonicalJson(
    unsignedReceiptCanonicalJson,
    "spherical_v2_skeleton_receipt_unsigned",
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumReceiptUtf8Bytes,
  );
  const violations = receiptUnsignedSemanticViolations(unsigned);
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
    unsignedReceiptCanonicalJson,
  );
};

const receiptSemanticViolations = (value: unknown): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_skeleton_receipt_fields_invalid"];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptV1;
  const { receiptSha256, ...unsigned } = receipt;
  const unsignedViolations = receiptUnsignedSemanticViolations(unsigned);
  if (unsignedViolations.length !== 0) return unsignedViolations;
  if (!nonzeroSha256(receiptSha256)) {
    return ["spherical_v2_skeleton_receipt_sha256_invalid"];
  }
  const canonicalUnsigned = canonicalJsonFromValue(
    unsigned as unknown as CanonicalValue,
  );
  let expected: string;
  try {
    expected =
      computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptSha256(
        canonicalUnsigned,
      );
  } catch {
    return ["spherical_v2_skeleton_receipt_unsigned_semantics_invalid"];
  }
  return receiptSha256 === expected
    ? []
    : ["spherical_v2_skeleton_receipt_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations = (
  value: unknown,
): readonly string[] => {
  let root: CanonicalValue;
  try {
    root = parseBoundedCanonicalJson(
      value,
      "spherical_v2_skeleton_receipt",
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumReceiptUtf8Bytes,
    );
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_skeleton_receipt_surface_invalid",
    ]);
  }
  try {
    return Object.freeze(receiptSemanticViolations(root));
  } catch {
    return Object.freeze([
      "spherical_v2_skeleton_receipt_semantic_validation_failed",
    ]);
  }
};

const requireValidReceiptCanonicalJson = (
  canonicalJson: string,
): Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptV1 => {
  const violations =
    nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations(canonicalJson);
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_skeleton_receipt",
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS.maximumReceiptUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptV1;
};

export const computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding =
  (
    receiptCanonicalJson: string,
  ): Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBindingV1 => {
    const receipt = requireValidReceiptCanonicalJson(receiptCanonicalJson);
    const bytes = Buffer.from(receiptCanonicalJson, "utf8");
    return deepFreeze({
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
      mediaType: "application/json" as const,
      rawSha256: createHash("sha256").update(bytes).digest("hex"),
      receiptSha256: receipt.receiptSha256,
      sizeBytes: bytes.length,
    });
  };

export const nhm2SphericalBosonStarV2SkeletonPersistencePairViolations = (
  skeletonCanonicalJson: unknown,
  receiptCanonicalJson: unknown,
): readonly string[] => {
  const skeletonViolations =
    nhm2SphericalBosonStarV2PreexecutionOutputSkeletonV2Violations(
      skeletonCanonicalJson,
    );
  if (skeletonViolations.length !== 0) return skeletonViolations;
  const receiptViolations =
    nhm2SphericalBosonStarV2SkeletonPersistenceReceiptViolations(
      receiptCanonicalJson,
    );
  if (receiptViolations.length !== 0) return receiptViolations;
  try {
    const skeletonBinding =
      computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(
        skeletonCanonicalJson as string,
      );
    const receipt = requireValidReceiptCanonicalJson(
      receiptCanonicalJson as string,
    );
    const observed = receipt.skeletonBinding;
    if (
      observed.artifactId !== skeletonBinding.artifactId ||
      observed.contractVersion !== skeletonBinding.contractVersion ||
      observed.mediaType !== skeletonBinding.mediaType ||
      observed.rawSha256 !== skeletonBinding.rawSha256 ||
      observed.wireSha256 !== skeletonBinding.wireSha256 ||
      observed.sizeBytes !== skeletonBinding.sizeBytes ||
      observed.skeletonFrozenAt !== skeletonBinding.skeletonFrozenAt ||
      observed.prePresealStaticClosureSha256 !==
        skeletonBinding.prePresealStaticClosureSha256
    ) {
      return Object.freeze([
        "spherical_v2_skeleton_receipt_pair_byte_binding_invalid",
      ]);
    }
    return Object.freeze([]);
  } catch {
    return Object.freeze([
      "spherical_v2_skeleton_receipt_pair_validation_failed",
    ]);
  }
};

export const deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2 =
  (
    skeletonCanonicalJson: string,
    receiptCanonicalJson: string,
  ): Nhm2SphericalV2DiagnosticSkeletonBindingV2 => {
    const violations =
      nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
        skeletonCanonicalJson,
        receiptCanonicalJson,
      );
    if (violations.length !== 0) throw new TypeError(violations[0]);
    const skeleton = computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(
      skeletonCanonicalJson,
    );
    const receipt = requireValidReceiptCanonicalJson(receiptCanonicalJson);
    return deepFreeze({
      artifactId: skeleton.artifactId,
      contractVersion: skeleton.contractVersion,
      path: receipt.skeletonBinding.path,
      mediaType: skeleton.mediaType,
      rawSha256: skeleton.rawSha256,
      wireSha256: skeleton.wireSha256,
      sizeBytes: skeleton.sizeBytes,
      skeletonFrozenAt: skeleton.skeletonFrozenAt,
      persistedAt: receipt.persistedAt,
      persistenceReceiptSha256: receipt.receiptSha256,
      prePresealStaticClosureSha256: skeleton.prePresealStaticClosureSha256,
    });
  };

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CONTRACT_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  phase: "stage_2_A_to_hashless_S_and_external_SR_integrity_without_authority",
  exactBindings: {
    preexecutionProfile:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    candidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    scientificDefinitions:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
  },
  AtoSClosure: {
    exactAKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_EXACT_KEYS,
    AHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN,
    AHashRecipe:
      "SHA256(domain_utf8||u64le(exact_canonical_A_length)||exact_canonical_A_bytes)",
    fullAEmbeddedInSkeleton: true,
    AProfileBindingMustEqualSkeletonProfileBinding: true,
    ACanonicalBytesRecomputedBeforeDigestComparison: true,
    callerOwnedObjectsAcceptedAtPublicBoundary: false,
  },
  skeletonSchema: {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_V2_CONTRACT_VERSION,
    exactRootKeys: NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_EXACT_KEYS,
    canonicalObjectKeyOrder: "ascending_ECMAScript_UTF16_code_units",
    rawSha256Recipe: "SHA256(exact_canonical_S_bytes)",
    wireSha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_V2_SHA256_DOMAIN,
    wireSha256Recipe:
      "SHA256(domain_utf8||u64le(exact_canonical_S_length)||exact_canonical_S_bytes)",
    rawWireAndSizeEmbeddedInsideSkeleton: false,
    scientificPresealOrPersistenceReceiptFieldsAllowed: false,
    executionOrPostrunFieldsAllowed: false,
  },
  hashlessOutputInventory: {
    exactPhysicalFileCount: 68,
    exactLogicalAliasCount: 21,
    exactPayloadSizeBytes: 6_693_376,
    actualOutputHashesAllowed: false,
    freshnessObservationOrExecutionReceiptAllowed: false,
  },
  externalPersistenceReceiptSchema: {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
    exactRootKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_EXACT_KEYS,
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_SR_length)||canonical_unsigned_SR_bytes)",
    exactSkeletonRawWireSizeAHashAndFrozenTimeCrossBindingRequired: true,
    strictFrozenBeforePersistedChronologyRequired: true,
    pathGrammar: {
      rootPrefix: "/",
      separator: "/",
      minimumSegmentCount: 1,
      emptySegmentsAllowed: false,
      dotSegmentsAllowed: false,
      segmentCodeUnits: "inclusive_printable_ASCII_0x20_through_0x7e",
      slashInsideSegmentAllowed: false,
      spacePlusAtBackslashAndColonAreOrdinarySegmentData: true,
      trailingSeparatorAllowed: false,
    },
    plainJsonGrantsFilesystemObservationAuthority: false,
    plainJsonGrantsDurabilityAuthority: false,
    issuerOrWeakSetExported: false,
  },
  publicBoundary: {
    ingress: "primitive_prebounded_canonical_JSON_text_only",
    codeUnitCapBeforeUtf8Measurement: true,
    utf8CapBeforeJsonParse: true,
    parsedTreeValidation: "iterative_and_bounded",
    exactCanonicalReserializationRequired: true,
    totalViolationFunctions: true,
  },
  resourceLimits: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LIMITS,
  readiness: NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS,
  instances: {
    prePresealStaticClosure: null,
    preexecutionSkeleton: null,
    externalSkeletonPersistenceReceipt: null,
    authenticatedSkeletonDurabilityReceipt: null,
    scientificPreseal: null,
    executionPreseal: null,
    launchEnvelope: null,
    runtimeLoaderAdmissionReceipt: null,
    outputManifest: null,
  },
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
  lamps: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS,
} as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2 =
  deepFreeze(CONTRACT);
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON =
  canonicalJsonFromValue(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2 as unknown as CanonicalValue,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256 =
  lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256_DOMAIN,
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_SHA256 =
  "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_CANONICAL_SIZE_BYTES =
  11_117 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

if (
  RAW_DESCRIPTORS.length !== 68 ||
  RAW_ALIASES.length !== 21 ||
  EXACT_PAYLOAD_SIZE_BYTES !== 6_693_376 ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_AUTHORITY_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CLAIM_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_LAMPS).some(
    (value) => value !== false,
  ) ||
  Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_READINESS).some(
    (value) => value !== false,
  ) ||
  Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_INSTANCES).some(
    (value) => value !== null,
  )
) {
  throw new Error("spherical_v2_run_artifact_wire_v2_false_null_invariant");
}

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `spherical_v2_run_artifact_wire_v2_literal_seal_drift:${NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_CANONICAL_SIZE_BYTES}`,
  );
}
