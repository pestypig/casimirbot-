import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING } from "./nhm2-spherical-boson-star-v2-branch-solver-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING } from "./nhm2-spherical-boson-star-v2-operator-ordering-derivation-closure.v1";
import {
  computeNhm2SphericalBosonStarV2CommandArgvSha256,
  computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
} from "./nhm2-spherical-boson-star-v2-preexecution-profile.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
} from "./nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "./nhm2-spherical-boson-star-v2-si-output-normalization.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_run_artifact_wire" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_run_artifact_wire/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-run-artifact-wire/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/preexecution-output-skeleton-wire/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_POSTRUN_WIRE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/postrun-raw-manifest-wire/v1\n" as const;

const CANDIDATE_ID = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID;
const RAW_DESCRIPTORS =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS;
const RAW_ALIASES =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES;

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS =
  Object.freeze({
    maximumSkeletonBytes: 1_048_576,
    maximumPostrunManifestBytes: 4_194_304,
    maximumDepth: 32,
    maximumNodes: 65_536,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 128,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateStringUtf8Bytes: 8_388_608,
    exactPhysicalFileCount: 68,
    exactAliasCount: 21,
    exactPayloadSizeBytes: 6_693_376,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS =
  Object.freeze({
    candidateAccepted: false,
    replayAuthority: false,
    independentAgreement: false,
    semiclassicalReplayLampDiagnosticPass: false,
    independentAgreementLampDiagnosticPass: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
    declaredLeverTensorUsed: false,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_INCOMPLETENESS_BLOCKERS =
  Object.freeze([
    "postrun_commit_authentication_evidence_missing",
    "postrun_run_identity_authentication_evidence_missing",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_NUMERICAL_POLICY_BINDING =
  Object.freeze({
    rawReplaySchema: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    siOutputNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    operatorOrderingDerivationClosure:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING,
    branchSolverPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
  } as const);

const SOURCE_PROVENANCE_SCHEMA =
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.provenanceSchema
    .sourceProvenance;
const SOURCE_PROVENANCE_FIELDS = Object.freeze([
  "sourceMode",
  "meanRsetOrigin",
  "noiseKernelOrigin",
  "declaredLeverTensorUsed",
  "inputClosureExcludesDeclaredLeverTensor",
] as const);
const SOURCE_PROVENANCE = Object.freeze({
  sourceMode: SOURCE_PROVENANCE_SCHEMA.sourceMode,
  meanRsetOrigin: SOURCE_PROVENANCE_SCHEMA.meanRsetOrigin,
  noiseKernelOrigin: SOURCE_PROVENANCE_SCHEMA.noiseKernelOrigin,
  declaredLeverTensorUsed: SOURCE_PROVENANCE_SCHEMA.declaredLeverTensorUsed,
  inputClosureExcludesDeclaredLeverTensor:
    SOURCE_PROVENANCE_SCHEMA.inputClosureExcludesDeclaredLeverTensor,
});
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
]);

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CONTRACT_VERSION,
  candidateId: CANDIDATE_ID,
  phase: "stage_2_exact_wire_schema_without_run_instance_or_authority",
  exactBindings: {
    candidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    rawReplaySchema: NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    siOutputNormalization:
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    preexecutionProfile:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
    operatorOrderingDerivationClosure:
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING,
    branchSolverPolicy:
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SOLVER_POLICY_BINDING,
  },
  encoding: {
    mediaType: "application/json",
    bytes: "canonical_UTF8_without_BOM_or_trailing_LF",
    objectKeyOrder: "ascending_ECMAScript_UTF16_code_units",
    numbers: "finite_safe_integers_only_negative_zero_forbidden",
    strings: "Unicode_scalar_values_only_NUL_forbidden",
    unknownDuplicateAccessorSymbolOrPrototypeKeysAllowed: false,
    canonicalizerInputSurface: "exact_plain_dense_acyclic_data_properties_only",
    canonicalizerUsesExactWireResourceLimits: true,
    wireGraphValidation: "fail_fast_first_violation_without_accumulation",
    rawSha256: "SHA256(exact_canonical_wire_bytes)",
    skeletonWireSha256:
      "SHA256(skeleton_domain_utf8||exact_canonical_skeleton_bytes)",
    postrunWireSha256:
      "SHA256(postrun_domain_utf8||exact_canonical_postrun_bytes)",
  },
  preexecutionSkeleton: {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION,
    exactRootFieldOrder: [
      "artifactId",
      "contractVersion",
      "skeletonFrozenAt",
      "candidate",
      "sourceProvenance",
      "numericalPolicyBinding",
      "implementation",
      "staticInputClosure",
      "plannedPhysicalFiles",
      "centralLevel2LogicalAliases",
      "claimLocks",
    ],
    exactPhysicalFileCount: 68,
    exactAliasCount: 21,
    containsOutputHashesExecutionOrFreshness: false,
    persistedBeforeScientificPresealAndExecution: true,
  },
  postrunManifest: {
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION,
    exactRootFieldOrder: [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "preexecutionSkeletonBinding",
      "scientificPresealBinding",
      "candidate",
      "sourceProvenance",
      "numericalPolicyBinding",
      "implementation",
      "execution",
      "staticInputClosure",
      "physicalFiles",
      "centralLevel2LogicalAliases",
      "claimLocks",
    ],
    exactPhysicalFileCount: 68,
    exactAliasCount: 21,
    everyFileCarriesHashSizeFreshnessStableStatAndObservationTime: true,
    linuxStatUnsignedDecimalDomain: "canonical_u64_base10",
    generatedAfterExecutionAndEveryFileObservation: true,
    mayBeInputToOwnScientificPreseal: false,
  },
  pairValidation: {
    postrunSkeletonBindingRecomputedFromExactSkeletonBytes: true,
    frozenCandidateSourceNumericalImplementationAndStaticClosureMustMatch: true,
    commandArgvSha256RecomputedFromExactExecutionArgv: true,
    commandDisplayDerivedFromExactExecutionArgv:
      "canonical_JSON_argv_display_only_without_execution_authority",
    authenticatedCommitCrossBindingPresent: false,
    authenticatedRunIdentityCrossBindingPresent: false,
    missingAuthenticatedCommitOrRunIdentityIsTypedBlockingViolation: true,
    physicalFileOwnerUidAndGidMustBeInternallyConsistent: true,
    outputRootSha256RecomputedFromBothPreexecutionRootObservations: true,
    executionOutputDirectoryMustEqualOnePredeclaredRoleRoot: true,
    strictChronology:
      "skeletonFrozenAt<=skeletonPersistedAt<=presealCreatedAt<=presealPersistedAt<=startedAt<=completedAt<=everyObservedAt<=generatedAt",
    durationMillisecondsEqualsExactTimestampDifference: true,
    aliasesBindCanonicalPhysicalFileHashes: true,
  },
  failurePolicy: {
    anyWireBindingChronologyFreshnessIdentityOrInventoryMismatch:
      "fail_frozen_candidate_without_retuning",
    partialArtifactAuthority: false,
  },
  completion: {
    exactSkeletonWireSchemaComplete: true,
    exactPostrunWireSchemaComplete: true,
    exactPairValidatorComplete: true,
    executionProvenanceAuthenticationComplete: false,
    skeletonInstancePresent: false,
    scientificPresealInstancePresent: false,
    postrunManifestInstancePresent: false,
    executionObserved: false,
    replayObserved: false,
    independentAgreementObserved: false,
    diagnosticLampsMayPass: false,
    physicalClaimsMayUnlock: false,
  },
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE =
  deepFreeze(CONTRACT);

const isUnicodeScalarString = (value: string): boolean => {
  if (value.includes("\u0000")) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      if (index + 1 >= value.length) return false;
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
};

export const nhm2SphericalBosonStarV2RunArtifactCanonicalJson = (
  value: unknown,
): string => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS;
  const budget = { nodes: 0, strings: 0 };
  const ancestors = new WeakSet<object>();
  const encode = (entry: unknown, depth: number): string => {
    budget.nodes += 1;
    if (budget.nodes > limits.maximumNodes)
      throw new TypeError("run_artifact_wire_node_budget_exceeded");
    if (depth > limits.maximumDepth)
      throw new TypeError("run_artifact_wire_depth_exceeded");
    if (entry === null || typeof entry === "boolean")
      return JSON.stringify(entry);
    if (typeof entry === "number") {
      if (!Number.isSafeInteger(entry) || Object.is(entry, -0))
        throw new TypeError("run_artifact_wire_number_invalid");
      return JSON.stringify(entry);
    }
    if (typeof entry === "string") {
      const size = Buffer.byteLength(entry, "utf8");
      budget.strings += size;
      if (
        !isUnicodeScalarString(entry) ||
        size > limits.maximumStringUtf8Bytes ||
        budget.strings > limits.maximumAggregateStringUtf8Bytes
      )
        throw new TypeError("run_artifact_wire_string_invalid");
      return JSON.stringify(entry);
    }
    if (entry == null || typeof entry !== "object" || isProxy(entry))
      throw new TypeError("run_artifact_wire_value_invalid");
    if (ancestors.has(entry))
      throw new TypeError("run_artifact_wire_cycle_invalid");
    ancestors.add(entry);
    try {
      if (Array.isArray(entry)) {
        if (
          Object.getPrototypeOf(entry) !== Array.prototype ||
          entry.length > limits.maximumArrayLength
        )
          throw new TypeError("run_artifact_wire_array_invalid");
        const ownKeys = Reflect.ownKeys(entry);
        if (
          ownKeys.length !== entry.length + 1 ||
          ownKeys[ownKeys.length - 1] !== "length"
        )
          throw new TypeError("run_artifact_wire_array_surface_invalid");
        const encoded: string[] = [];
        for (let index = 0; index < entry.length; index += 1) {
          const key = String(index);
          if (ownKeys[index] !== key)
            throw new TypeError("run_artifact_wire_array_dense_invalid");
          const descriptor = Object.getOwnPropertyDescriptor(entry, key);
          if (
            descriptor == null ||
            !("value" in descriptor) ||
            descriptor.enumerable !== true
          )
            throw new TypeError("run_artifact_wire_array_entry_invalid");
          encoded.push(encode(descriptor.value, depth + 1));
        }
        return `[${encoded.join(",")}]`;
      }
      if (Object.getPrototypeOf(entry) !== Object.prototype)
        throw new TypeError("run_artifact_wire_object_invalid");
      const ownKeys = Reflect.ownKeys(entry);
      if (
        ownKeys.length > limits.maximumObjectPropertyCount ||
        ownKeys.some((key) => typeof key !== "string")
      )
        throw new TypeError("run_artifact_wire_object_surface_invalid");
      const record = entry as Record<string, unknown>;
      const encoded: string[] = [];
      for (const key of (ownKeys as string[]).sort()) {
        const size = Buffer.byteLength(key, "utf8");
        budget.strings += size;
        if (
          FORBIDDEN_KEYS.has(key) ||
          !isUnicodeScalarString(key) ||
          size > limits.maximumPropertyKeyUtf8Bytes ||
          budget.strings > limits.maximumAggregateStringUtf8Bytes
        )
          throw new TypeError("run_artifact_wire_key_invalid");
        const descriptor = Object.getOwnPropertyDescriptor(record, key);
        if (
          descriptor == null ||
          !("value" in descriptor) ||
          descriptor.enumerable !== true
        )
          throw new TypeError("run_artifact_wire_object_entry_invalid");
        encoded.push(
          `${JSON.stringify(key)}:${encode(descriptor.value, depth + 1)}`,
        );
      }
      return `{${encoded.join(",")}}`;
    } finally {
      ancestors.delete(entry);
    }
  };
  return encode(value, 0);
};

export const computeNhm2SphericalBosonStarV2CanonicalCommandDisplay = (
  argv: readonly string[],
): string => {
  computeNhm2SphericalBosonStarV2CommandArgvSha256(argv);
  return nhm2SphericalBosonStarV2RunArtifactCanonicalJson(argv);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_JSON =
  nhm2SphericalBosonStarV2RunArtifactCanonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256_DOMAIN, "utf8")
  .update(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_SHA256 =
  "a71789ad71fff564c96d8a13eddd2dc0503e92827e66dcec73ba25bdfe9eefa1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_CANONICAL_SIZE_BYTES =
  6_934 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CONTRACT_VERSION,
    candidateId: CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

type JsonRecord = Record<string, unknown>;
type GraphBudget = { nodes: number; strings: number };

const SHA256 = /^[a-f0-9]{64}$/;
const RFC3339_NS =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{9})Z$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const U64_DECIMAL_MAX = "18446744073709551615";
const ABSOLUTE_LINUX_PATH =
  /^\/(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\/\/)[\x20-\x7e]+$/;
const RELATIVE_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\/\/)[\x21-\x7e]+$/;
const nonzeroSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const u64DecimalValid = (value: unknown): value is string =>
  typeof value === "string" &&
  DECIMAL.test(value) &&
  (value.length < U64_DECIMAL_MAX.length ||
    (value.length === U64_DECIMAL_MAX.length && value <= U64_DECIMAL_MAX));

const exactKeys = (
  value: unknown,
  keys: readonly string[],
): value is JsonRecord =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));

const sameCanonical = (left: unknown, right: unknown): boolean =>
  nhm2SphericalBosonStarV2RunArtifactCanonicalJson(left) ===
  nhm2SphericalBosonStarV2RunArtifactCanonicalJson(right);

const validateGraph = (
  value: unknown,
  budget: GraphBudget = { nodes: 0, strings: 0 },
  depth = 0,
): string | null => {
  const limits = NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS;
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) return "wire_node_budget_exceeded";
  if (depth > limits.maximumDepth) return "wire_depth_exceeded";
  if (value === null || typeof value === "boolean") return null;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0))
      return "wire_number_invalid";
    return null;
  }
  if (typeof value === "string") {
    const size = Buffer.byteLength(value, "utf8");
    budget.strings += size;
    if (
      !isUnicodeScalarString(value) ||
      size > limits.maximumStringUtf8Bytes ||
      budget.strings > limits.maximumAggregateStringUtf8Bytes
    )
      return "wire_string_invalid_or_budget_exceeded";
    return null;
  }
  if (Array.isArray(value)) {
    if (value.length > limits.maximumArrayLength)
      return "wire_array_length_exceeded";
    for (const child of value) {
      const violation = validateGraph(child, budget, depth + 1);
      if (violation !== null) return violation;
    }
    return null;
  }
  if (
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    return "wire_object_invalid";
  const keys = Object.keys(value as JsonRecord);
  if (keys.length > limits.maximumObjectPropertyCount)
    return "wire_object_property_count_exceeded";
  for (const key of keys) {
    const size = Buffer.byteLength(key, "utf8");
    budget.strings += size;
    if (
      FORBIDDEN_KEYS.has(key) ||
      !isUnicodeScalarString(key) ||
      size > limits.maximumPropertyKeyUtf8Bytes ||
      budget.strings > limits.maximumAggregateStringUtf8Bytes
    )
      return "wire_key_invalid_or_budget_exceeded";
    const violation = validateGraph(
      (value as JsonRecord)[key],
      budget,
      depth + 1,
    );
    if (violation !== null) return violation;
  }
  return null;
};

const parseWire = (
  bytes: unknown,
  maximumBytes: number,
): Readonly<{ root: unknown; owned: Buffer }> | string => {
  if (bytes === null || typeof bytes !== "object")
    return "wire_exact_buffer_required";
  let owned: Buffer;
  try {
    if (
      isProxy(bytes) ||
      !Buffer.isBuffer(bytes) ||
      Object.getPrototypeOf(bytes) !== Buffer.prototype
    )
      return "wire_exact_buffer_required";
    if (bytes.length === 0 || bytes.length > maximumBytes)
      return "wire_byte_length_invalid";
    owned = Buffer.from(bytes);
  } catch {
    return "wire_exact_buffer_required";
  }
  if (
    owned.length >= 3 &&
    owned[0] === 0xef &&
    owned[1] === 0xbb &&
    owned[2] === 0xbf
  )
    return "wire_BOM_forbidden";
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      owned,
    );
  } catch {
    return "wire_UTF8_invalid";
  }
  let root: unknown;
  try {
    root = JSON.parse(text) as unknown;
  } catch {
    return "wire_JSON_invalid";
  }
  const graphViolation = validateGraph(root);
  if (graphViolation !== null) return graphViolation;
  let canonical: string;
  try {
    canonical = nhm2SphericalBosonStarV2RunArtifactCanonicalJson(root);
  } catch {
    return "wire_canonicalization_invalid";
  }
  if (canonical !== text) return "wire_not_canonical";
  return Object.freeze({ root, owned });
};

const parseTimestampNs = (value: unknown): bigint | null => {
  if (typeof value !== "string") return null;
  const match = RFC3339_NS.exec(value);
  if (match === null) return null;
  const [, year, month, day, hour, minute, second, fraction] = match;
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  const h = Number(hour);
  const mi = Number(minute);
  const s = Number(second);
  if (y < 1970 || mo < 1 || mo > 12 || h > 23 || mi > 59 || s > 59) return null;
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
  )
    return null;
  return BigInt(milliseconds) * 1_000_000n + BigInt(fraction);
};

const bindingValid = (value: unknown): boolean =>
  exactKeys(value, [
    "artifactId",
    "contractVersion",
    "candidateId",
    "sha256Domain",
    "sha256",
    "canonicalSizeBytes",
    "mediaType",
  ]) &&
  typeof value.artifactId === "string" &&
  typeof value.contractVersion === "string" &&
  value.candidateId === CANDIDATE_ID &&
  typeof value.sha256Domain === "string" &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  !/^0{64}$/.test(value.sha256) &&
  Number.isSafeInteger(value.canonicalSizeBytes) &&
  (value.canonicalSizeBytes as number) > 0 &&
  value.mediaType === "application/json";

const candidateValid = (value: unknown): boolean =>
  exactKeys(value, ["candidateId", "candidateFreezeBinding"]) &&
  value.candidateId === CANDIDATE_ID &&
  sameCanonical(
    value.candidateFreezeBinding,
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  );

const implementationEntryValid = (value: unknown, role: string): boolean =>
  exactKeys(value, ["role", "path", "sha256", "sizeBytes", "mediaType"]) &&
  value.role === role &&
  typeof value.path === "string" &&
  RELATIVE_PATH.test(value.path) &&
  nonzeroSha256(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0 &&
  value.mediaType === "text/plain";

const implementationValid = (value: unknown): boolean =>
  exactKeys(value, ["primary", "independent"]) &&
  implementationEntryValid(value.primary, "primary") &&
  implementationEntryValid(value.independent, "independent") &&
  (value.primary as JsonRecord).path !==
    (value.independent as JsonRecord).path &&
  (value.primary as JsonRecord).sha256 !==
    (value.independent as JsonRecord).sha256;

const outputRootIdentitySha256 = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length !== 2) return null;
  try {
    return computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256(
      value as unknown as Parameters<
        typeof computeNhm2SphericalBosonStarV2OutputRootSetIdentitySha256
      >[0],
    );
  } catch {
    return null;
  }
};

const staticClosureValid = (value: unknown): boolean => {
  if (
    !exactKeys(value, [
      "preexecutionProfileBinding",
      "commandArgvSha256",
      "staticInputAggregateSha256",
      "freshnessInventorySha256",
      "dirtyTreeSha256",
      "runtimeClosureSha256",
      "outputRootObservations",
      "outputRootSha256",
    ]) ||
    !sameCanonical(
      value.preexecutionProfileBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
    ) ||
    ![
      value.commandArgvSha256,
      value.staticInputAggregateSha256,
      value.freshnessInventorySha256,
      value.dirtyTreeSha256,
      value.runtimeClosureSha256,
      value.outputRootSha256,
    ].every(nonzeroSha256)
  )
    return false;
  const recomputedOutputRootSha256 = outputRootIdentitySha256(
    value.outputRootObservations,
  );
  return (
    recomputedOutputRootSha256 !== null &&
    value.outputRootSha256 === recomputedOutputRootSha256
  );
};

const skeletonRootViolations = (root: unknown): string[] => {
  const violations: string[] = [];
  const keys = CONTRACT.preexecutionSkeleton.exactRootFieldOrder;
  if (!exactKeys(root, keys)) return ["skeleton_root_fields_invalid"];
  if (
    root.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_ARTIFACT_ID ||
    root.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_OUTPUT_SKELETON_CONTRACT_VERSION
  )
    violations.push("skeleton_identity_invalid");
  if (parseTimestampNs(root.skeletonFrozenAt) === null)
    violations.push("skeleton_timestamp_invalid");
  if (!candidateValid(root.candidate))
    violations.push("skeleton_candidate_invalid");
  if (!sameCanonical(root.sourceProvenance, SOURCE_PROVENANCE))
    violations.push("skeleton_source_provenance_invalid");
  if (
    !sameCanonical(
      root.numericalPolicyBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_NUMERICAL_POLICY_BINDING,
    )
  )
    violations.push("skeleton_numerical_policy_invalid");
  if (!implementationValid(root.implementation))
    violations.push("skeleton_implementation_invalid");
  if (!staticClosureValid(root.staticInputClosure))
    violations.push("skeleton_static_closure_invalid");
  if (!sameCanonical(root.plannedPhysicalFiles, RAW_DESCRIPTORS))
    violations.push("skeleton_physical_inventory_invalid");
  if (!sameCanonical(root.centralLevel2LogicalAliases, RAW_ALIASES))
    violations.push("skeleton_alias_inventory_invalid");
  if (
    !sameCanonical(
      root.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS,
    )
  )
    violations.push("skeleton_claim_locks_invalid");
  return violations;
};

export const nhm2SphericalBosonStarV2SkeletonWireViolations = (
  bytes: unknown,
): readonly string[] => {
  const parsed = parseWire(
    bytes,
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.maximumSkeletonBytes,
  );
  if (typeof parsed === "string") return Object.freeze([parsed]);
  return Object.freeze(skeletonRootViolations(parsed.root));
};

const statValid = (value: unknown, expectedSize: number): boolean =>
  exactKeys(value, [
    "device",
    "inode",
    "ownerUid",
    "ownerGid",
    "linkCount",
    "modeOctal",
    "fileType",
    "sizeBytes",
    "modifyTimeNanoseconds",
    "changeTimeNanoseconds",
  ]) &&
  [
    value.device,
    value.inode,
    value.ownerUid,
    value.ownerGid,
    value.linkCount,
    value.modifyTimeNanoseconds,
    value.changeTimeNanoseconds,
  ].every(u64DecimalValid) &&
  value.ownerUid !== "0" &&
  value.ownerGid !== "0" &&
  value.linkCount === "1" &&
  value.modeOctal === "0400" &&
  value.fileType === "regular" &&
  value.sizeBytes === expectedSize;

const physicalFileValid = (
  value: unknown,
  descriptor: (typeof RAW_DESCRIPTORS)[number],
  outputDirectory: string,
): boolean => {
  if (
    !exactKeys(value, [
      "descriptor",
      "absolutePath",
      "sha256",
      "freshness",
      "observedAt",
      "preexecutionAbsent",
      "preexecutionAbsenceReceiptSha256",
      "postrunObservationReceiptSha256",
      "preReadStat",
      "postReadStat",
    ]) ||
    !sameCanonical(value.descriptor, descriptor) ||
    typeof value.absolutePath !== "string" ||
    !ABSOLUTE_LINUX_PATH.test(value.absolutePath) ||
    typeof value.sha256 !== "string" ||
    !SHA256.test(value.sha256) ||
    /^0{64}$/.test(value.sha256) ||
    value.freshness !== "new" ||
    parseTimestampNs(value.observedAt) === null ||
    value.preexecutionAbsent !== true ||
    typeof value.preexecutionAbsenceReceiptSha256 !== "string" ||
    !SHA256.test(value.preexecutionAbsenceReceiptSha256) ||
    /^0{64}$/.test(value.preexecutionAbsenceReceiptSha256) ||
    typeof value.postrunObservationReceiptSha256 !== "string" ||
    !SHA256.test(value.postrunObservationReceiptSha256) ||
    /^0{64}$/.test(value.postrunObservationReceiptSha256) ||
    !statValid(value.preReadStat, descriptor.sizeBytes) ||
    !statValid(value.postReadStat, descriptor.sizeBytes) ||
    !sameCanonical(value.preReadStat, value.postReadStat)
  )
    return false;
  const suffix = descriptor.path.replace("{outputDirectory}/", "");
  return value.absolutePath === `${outputDirectory}/${suffix}`;
};

const executionValid = (
  value: unknown,
  staticInputClosure: unknown,
): boolean => {
  if (
    !exactKeys(value, [
      "commitSha",
      "command",
      "argv",
      "workingDirectory",
      "outputDirectory",
      "startedAt",
      "completedAt",
      "durationMs",
      "exitCode",
      "terminationSignal",
    ]) ||
    typeof value.commitSha !== "string" ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value.commitSha) ||
    /^(?:0{40}|0{64})$/.test(value.commitSha) ||
    typeof value.command !== "string" ||
    value.command.length === 0 ||
    !Array.isArray(value.argv) ||
    value.argv.length === 0 ||
    !value.argv.every(
      (entry) => typeof entry === "string" && entry.length > 0,
    ) ||
    typeof value.workingDirectory !== "string" ||
    !ABSOLUTE_LINUX_PATH.test(value.workingDirectory) ||
    typeof value.outputDirectory !== "string" ||
    !ABSOLUTE_LINUX_PATH.test(value.outputDirectory) ||
    value.outputDirectory.endsWith("/") ||
    value.exitCode !== 0 ||
    value.terminationSignal !== null ||
    !Number.isSafeInteger(value.durationMs) ||
    (value.durationMs as number) < 0
  )
    return false;
  if (!staticClosureValid(staticInputClosure)) return false;
  const closure = staticInputClosure as JsonRecord;
  let commandArgvSha256: string;
  let canonicalCommandDisplay: string;
  try {
    commandArgvSha256 = computeNhm2SphericalBosonStarV2CommandArgvSha256(
      value.argv as string[],
    );
    canonicalCommandDisplay =
      computeNhm2SphericalBosonStarV2CanonicalCommandDisplay(
        value.argv as string[],
      );
  } catch {
    return false;
  }
  const outputRoots = closure.outputRootObservations as readonly JsonRecord[];
  if (
    closure.commandArgvSha256 !== commandArgvSha256 ||
    value.command !== canonicalCommandDisplay ||
    !outputRoots.some(
      (observation) => observation.absolutePath === value.outputDirectory,
    )
  )
    return false;
  const started = parseTimestampNs(value.startedAt);
  const completed = parseTimestampNs(value.completedAt);
  return (
    started !== null &&
    completed !== null &&
    completed >= started &&
    (completed - started) % 1_000_000n === 0n &&
    BigInt(value.durationMs as number) === (completed - started) / 1_000_000n
  );
};

const skeletonBindingValid = (value: unknown): boolean =>
  exactKeys(value, [
    "path",
    "mediaType",
    "rawSha256",
    "wireSha256",
    "sizeBytes",
    "persistedAt",
  ]) &&
  typeof value.path === "string" &&
  ABSOLUTE_LINUX_PATH.test(value.path) &&
  value.mediaType === "application/json" &&
  typeof value.rawSha256 === "string" &&
  nonzeroSha256(value.rawSha256) &&
  typeof value.wireSha256 === "string" &&
  nonzeroSha256(value.wireSha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0 &&
  parseTimestampNs(value.persistedAt) !== null;

const presealBindingValid = (value: unknown): boolean =>
  exactKeys(value, [
    "path",
    "mediaType",
    "rawSha256",
    "presealEnvelopeSha256",
    "sizeBytes",
    "createdAt",
    "persistedAt",
  ]) &&
  typeof value.path === "string" &&
  ABSOLUTE_LINUX_PATH.test(value.path) &&
  value.mediaType === "application/json" &&
  typeof value.rawSha256 === "string" &&
  nonzeroSha256(value.rawSha256) &&
  typeof value.presealEnvelopeSha256 === "string" &&
  nonzeroSha256(value.presealEnvelopeSha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 0 &&
  parseTimestampNs(value.createdAt) !== null &&
  parseTimestampNs(value.persistedAt) !== null;

const postrunRootViolations = (root: unknown): string[] => {
  const violations: string[] = [];
  const keys = CONTRACT.postrunManifest.exactRootFieldOrder;
  if (!exactKeys(root, keys)) return ["postrun_root_fields_invalid"];
  if (
    root.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_ARTIFACT_ID ||
    root.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SUCCESSOR_RAW_REPLAY_MANIFEST_CONTRACT_VERSION
  )
    violations.push("postrun_identity_invalid");
  if (parseTimestampNs(root.generatedAt) === null)
    violations.push("postrun_generated_timestamp_invalid");
  if (!skeletonBindingValid(root.preexecutionSkeletonBinding))
    violations.push("postrun_skeleton_binding_invalid");
  if (!presealBindingValid(root.scientificPresealBinding))
    violations.push("postrun_preseal_binding_invalid");
  if (!candidateValid(root.candidate))
    violations.push("postrun_candidate_invalid");
  if (!sameCanonical(root.sourceProvenance, SOURCE_PROVENANCE))
    violations.push("postrun_source_provenance_invalid");
  if (
    !sameCanonical(
      root.numericalPolicyBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_NUMERICAL_POLICY_BINDING,
    )
  )
    violations.push("postrun_numerical_policy_invalid");
  if (!implementationValid(root.implementation))
    violations.push("postrun_implementation_invalid");
  if (!executionValid(root.execution, root.staticInputClosure))
    violations.push("postrun_execution_invalid");
  if (!staticClosureValid(root.staticInputClosure))
    violations.push("postrun_static_closure_invalid");
  const outputDirectory =
    exactKeys(root.execution, [
      "commitSha",
      "command",
      "argv",
      "workingDirectory",
      "outputDirectory",
      "startedAt",
      "completedAt",
      "durationMs",
      "exitCode",
      "terminationSignal",
    ]) && typeof root.execution.outputDirectory === "string"
      ? root.execution.outputDirectory
      : null;
  if (
    !Array.isArray(root.physicalFiles) ||
    root.physicalFiles.length !== RAW_DESCRIPTORS.length
  ) {
    violations.push("postrun_physical_file_count_invalid");
  } else if (
    outputDirectory === null ||
    !root.physicalFiles.every((entry, index) =>
      physicalFileValid(entry, RAW_DESCRIPTORS[index], outputDirectory),
    )
  ) {
    violations.push("postrun_physical_files_invalid");
  } else {
    const files = root.physicalFiles as JsonRecord[];
    if (
      new Set(files.map((entry) => entry.absolutePath)).size !== files.length ||
      new Set(
        files.map((entry) => {
          const stat = entry.preReadStat as JsonRecord;
          return `${stat.device}:${stat.inode}`;
        }),
      ).size !== files.length
    )
      violations.push("postrun_physical_file_identity_alias_invalid");
    if (
      new Set(
        files.map(
          (entry) => (entry.preReadStat as JsonRecord).ownerUid as string,
        ),
      ).size !== 1 ||
      new Set(
        files.map(
          (entry) => (entry.preReadStat as JsonRecord).ownerGid as string,
        ),
      ).size !== 1
    )
      violations.push("postrun_physical_file_owner_identity_drift");
  }
  if (
    !Array.isArray(root.centralLevel2LogicalAliases) ||
    root.centralLevel2LogicalAliases.length !== RAW_ALIASES.length ||
    !root.centralLevel2LogicalAliases.every((entry, index) => {
      if (!exactKeys(entry, ["alias", "canonicalSha256"])) return false;
      const alias = RAW_ALIASES[index];
      const physical = Array.isArray(root.physicalFiles)
        ? (root.physicalFiles[alias.canonicalFileOrdinal] as
            JsonRecord | undefined)
        : undefined;
      return (
        sameCanonical(entry.alias, alias) &&
        typeof entry.canonicalSha256 === "string" &&
        SHA256.test(entry.canonicalSha256) &&
        physical !== null &&
        typeof physical === "object" &&
        !Array.isArray(physical) &&
        entry.canonicalSha256 === physical.sha256
      );
    })
  )
    violations.push("postrun_aliases_invalid");
  if (
    !sameCanonical(
      root.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS,
    )
  )
    violations.push("postrun_claim_locks_invalid");
  violations.push(
    ...NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_INCOMPLETENESS_BLOCKERS,
  );
  return violations;
};

export const nhm2SphericalBosonStarV2PostrunWireViolations = (
  bytes: unknown,
): readonly string[] => {
  const parsed = parseWire(
    bytes,
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.maximumPostrunManifestBytes,
  );
  if (typeof parsed === "string") return Object.freeze([parsed]);
  return Object.freeze(postrunRootViolations(parsed.root));
};

export const nhm2SphericalBosonStarV2RunArtifactPairViolations = (
  skeletonBytes: unknown,
  postrunBytes: unknown,
): readonly string[] => {
  const skeleton = parseWire(
    skeletonBytes,
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.maximumSkeletonBytes,
  );
  if (typeof skeleton === "string") return Object.freeze([skeleton]);
  const postrun = parseWire(
    postrunBytes,
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.maximumPostrunManifestBytes,
  );
  if (typeof postrun === "string") return Object.freeze([postrun]);
  const violations = [
    ...skeletonRootViolations(skeleton.root),
    ...postrunRootViolations(postrun.root),
  ];
  if (
    !exactKeys(skeleton.root, CONTRACT.preexecutionSkeleton.exactRootFieldOrder)
  )
    return Object.freeze(violations);
  if (!exactKeys(postrun.root, CONTRACT.postrunManifest.exactRootFieldOrder))
    return Object.freeze(violations);
  const skeletonRawSha = createHash("sha256")
    .update(skeleton.owned)
    .digest("hex");
  const skeletonWireSha = createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_WIRE_SHA256_DOMAIN, "utf8")
    .update(skeleton.owned)
    .digest("hex");
  const bindingValue = postrun.root.preexecutionSkeletonBinding;
  const binding = exactKeys(bindingValue, [
    "path",
    "mediaType",
    "rawSha256",
    "wireSha256",
    "sizeBytes",
    "persistedAt",
  ])
    ? bindingValue
    : null;
  if (
    binding !== null &&
    (binding.rawSha256 !== skeletonRawSha ||
      binding.wireSha256 !== skeletonWireSha ||
      binding.sizeBytes !== skeleton.owned.length)
  )
    violations.push("pair_skeleton_byte_binding_invalid");
  for (const key of [
    "candidate",
    "sourceProvenance",
    "numericalPolicyBinding",
    "implementation",
    "staticInputClosure",
    "claimLocks",
  ] as const) {
    if (!sameCanonical(skeleton.root[key], postrun.root[key]))
      violations.push(`pair_${key}_drift`);
  }
  const skeletonFrozen = parseTimestampNs(skeleton.root.skeletonFrozenAt);
  const skeletonPersisted = parseTimestampNs(binding?.persistedAt);
  const presealValue = postrun.root.scientificPresealBinding;
  const preseal = exactKeys(presealValue, [
    "path",
    "mediaType",
    "rawSha256",
    "presealEnvelopeSha256",
    "sizeBytes",
    "createdAt",
    "persistedAt",
  ])
    ? presealValue
    : null;
  const presealCreated = parseTimestampNs(preseal?.createdAt);
  const presealPersisted = parseTimestampNs(preseal?.persistedAt);
  const executionValue = postrun.root.execution;
  const execution = exactKeys(executionValue, [
    "commitSha",
    "command",
    "argv",
    "workingDirectory",
    "outputDirectory",
    "startedAt",
    "completedAt",
    "durationMs",
    "exitCode",
    "terminationSignal",
  ])
    ? executionValue
    : null;
  const started = parseTimestampNs(execution?.startedAt);
  const completed = parseTimestampNs(execution?.completedAt);
  const generated = parseTimestampNs(postrun.root.generatedAt);
  const observed = Array.isArray(postrun.root.physicalFiles)
    ? postrun.root.physicalFiles.map((entry) =>
        exactKeys(entry, [
          "descriptor",
          "absolutePath",
          "sha256",
          "freshness",
          "observedAt",
          "preexecutionAbsent",
          "preexecutionAbsenceReceiptSha256",
          "postrunObservationReceiptSha256",
          "preReadStat",
          "postReadStat",
        ])
          ? parseTimestampNs(entry.observedAt)
          : null,
      )
    : [];
  if (
    skeletonFrozen === null ||
    skeletonPersisted === null ||
    presealCreated === null ||
    presealPersisted === null ||
    started === null ||
    completed === null ||
    generated === null ||
    observed.length !== RAW_DESCRIPTORS.length ||
    observed.some((value) => value === null) ||
    !(
      skeletonFrozen <= skeletonPersisted &&
      skeletonPersisted <= presealCreated &&
      presealCreated <= presealPersisted &&
      presealPersisted <= started &&
      started <= completed &&
      observed.every(
        (value) => value !== null && completed <= value && value <= generated,
      )
    )
  )
    violations.push("pair_chronology_invalid");
  return Object.freeze(violations);
};

if (
  RAW_DESCRIPTORS.length !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.exactPhysicalFileCount ||
  RAW_DESCRIPTORS.reduce((sum, entry) => sum + entry.sizeBytes, 0) !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.exactPayloadSizeBytes ||
  RAW_ALIASES.length !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_LIMITS.exactAliasCount ||
  !sameCanonical(
    SOURCE_PROVENANCE_SCHEMA.exactFields,
    SOURCE_PROVENANCE_FIELDS,
  ) ||
  !exactKeys(SOURCE_PROVENANCE, SOURCE_PROVENANCE_FIELDS) ||
  !bindingValid(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_BINDING) ||
  Object.values(NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_CLAIM_LOCKS).some(
    (value) => value !== false,
  )
)
  throw new Error("spherical_v2_run_artifact_wire_invariant");

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_EXPECTED_CANONICAL_SIZE_BYTES
)
  throw new Error(
    `spherical_v2_run_artifact_wire_literal_seal_drift:${NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_CANONICAL_SIZE_BYTES}`,
  );
