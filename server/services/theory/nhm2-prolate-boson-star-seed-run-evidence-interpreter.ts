import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";

export const NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_VERSION =
  "nhm2_prolate_boson_star_seed_run_evidence_interpreter/v1" as const;

export const NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_SUPPORTED_PROFILES =
  Object.freeze(["isolatedWorkerCapability"] as const);

export const NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 4_096,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 65_536,
  } as const);

export const NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS =
  Object.freeze({
    executionAuthorized: false,
    executionObserved: false,
    outputArtifactAccepted: false,
    seedScientificallyAccepted: false,
    relativisticBranchSolved: false,
    candidateAdmissible: false,
    physicalViabilityEstablished: false,
    propulsionClaimAllowed: false,
    transportClaimAllowed: false,
    assistantAnswer: false,
    terminalEligible: false,
    promotionAllowed: false,
  } as const);

export type Nhm2ProlateBosonStarSeedRunEvidenceSupportedProfile =
  (typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_SUPPORTED_PROFILES)[number];

export type Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1 = Readonly<{
  bindingVersion: "nhm2.control_plane.domain_hash_binding/v1";
  artifactKind: string;
  sha256Domain: string;
  sha256: string;
  canonicalSizeBytes: number;
}>;

export type Nhm2ProlateBosonStarSeedRunEvidenceInterpretationV1 =
  | Readonly<{
      ok: true;
      interpreterVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_VERSION;
      profile: Nhm2ProlateBosonStarSeedRunEvidenceSupportedProfile;
      schemaName: string;
      canonicalJson: string;
      value: Readonly<Record<string, unknown>>;
      binding: Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1;
      checks: Readonly<{
        profileRegistered: true;
        instanceHashGrammarRegistered: true;
        supportedSchemaShapeValidated: true;
        canonicalUtf8Exact: true;
        bindingVersionExact: true;
        artifactKindExact: true;
        sha256DomainExact: true;
        canonicalSizeExact: true;
        domainSeparatedSha256Exact: true;
        descriptiveRegistryCrossFieldInvariantsIndependentlyReplayed: false;
      }>;
      authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS;
    }>
  | Readonly<{
      ok: false;
      interpreterVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_VERSION;
      profile: string;
      code:
        | "unsupported_profile"
        | "registry_profile_invalid"
        | "evidence_bytes_invalid"
        | "evidence_bytes_limit_exceeded"
        | "evidence_utf8_invalid"
        | "evidence_json_invalid"
        | "evidence_json_noncanonical"
        | "evidence_schema_invalid"
        | "binding_surface_invalid"
        | "binding_profile_mismatch"
        | "binding_size_mismatch"
        | "binding_hash_mismatch";
      issues: readonly string[];
      authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS;
    }>;

type RegistryBindingProfile = Readonly<{
  artifactKind: string;
  sha256DomainSource: string;
}>;

type RegistryInstanceHashGrammar = Readonly<{
  schema: string;
  bindingProfile?: string;
  exactBindingProfileOrder?: readonly string[];
  preimage: string;
}>;

type RegistrySchemaNode = Readonly<Record<string, unknown>>;

type RegistryView = Readonly<{
  domains: Readonly<Record<string, string>>;
  maximumCanonicalUtf8BytesByArtifact: Readonly<Record<string, number>>;
  artifactBindingProfiles: Readonly<Record<string, RegistryBindingProfile>>;
  instanceHashGrammars: Readonly<Record<string, RegistryInstanceHashGrammar>>;
  schemas: Readonly<Record<string, RegistrySchemaNode>>;
}>;

type SupportedProfileResolution = Readonly<{
  profile: Nhm2ProlateBosonStarSeedRunEvidenceSupportedProfile;
  artifactKind: string;
  sha256Domain: string;
  schemaName: string;
  maximumCanonicalUtf8Bytes: number;
  bindingVersion: string;
}>;

type CanonicalizationState = {
  nodes: number;
};

const REGISTRY =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY as unknown as RegistryView;
const STRICT_UTF8 = new TextDecoder("utf-8", { fatal: true });
const SHA256 = /^[0-9a-f]{64}$/;
const CANONICAL_UNSIGNED_DECIMAL = /^(?:0|[1-9][0-9]*)$/;

class CanonicalizationFailure extends Error {}

const fail = (
  profile: string,
  code: Extract<
    Nhm2ProlateBosonStarSeedRunEvidenceInterpretationV1,
    { ok: false }
  >["code"],
  ...issues: string[]
): Extract<
  Nhm2ProlateBosonStarSeedRunEvidenceInterpretationV1,
  { ok: false }
> =>
  Object.freeze({
    ok: false,
    interpreterVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_VERSION,
    profile,
    code,
    issues: Object.freeze([...issues]),
    authorityLocks: NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
  });

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
};

const readPlainDataRecord = (
  value: unknown,
): Readonly<Record<string, unknown>> | null => {
  if (!isPlainObject(value)) return null;
  try {
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) return null;
    const output = Object.create(null) as Record<string, unknown>;
    for (const key of keys as string[]) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      output[key] = descriptor.value;
    }
    return output;
  } catch {
    return null;
  }
};

const sameExactKeySet = (
  record: Readonly<Record<string, unknown>>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(record).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

const hasUnpairedSurrogate = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
};

const accountCanonicalNode = (
  state: CanonicalizationState,
  depth: number,
): void => {
  if (
    depth >
    NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumDepth
  ) {
    throw new CanonicalizationFailure("maximum_depth_exceeded");
  }
  state.nodes += 1;
  if (
    state.nodes >
    NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumNodes
  ) {
    throw new CanonicalizationFailure("maximum_nodes_exceeded");
  }
};

const canonicalJson = (
  value: unknown,
  state: CanonicalizationState,
  depth = 0,
): string => {
  accountCanonicalNode(state, depth);
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new CanonicalizationFailure("nonfinite_or_negative_zero_number");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    if (
      hasUnpairedSurrogate(value) ||
      Buffer.byteLength(value, "utf8") >
        NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumStringUtf8Bytes
    ) {
      throw new CanonicalizationFailure("invalid_or_oversize_string");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (
      value.length >
      NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumArrayLength
    ) {
      throw new CanonicalizationFailure("maximum_array_length_exceeded");
    }
    return `[${value
      .map((entry) => canonicalJson(entry, state, depth + 1))
      .join(",")}]`;
  }
  const record = readPlainDataRecord(value);
  if (record == null) {
    throw new CanonicalizationFailure("non_plain_data_object");
  }
  const keys = Object.keys(record).sort();
  if (
    keys.length >
    NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumObjectPropertyCount
  ) {
    throw new CanonicalizationFailure("maximum_object_properties_exceeded");
  }
  for (const key of keys) {
    if (
      hasUnpairedSurrogate(key) ||
      Buffer.byteLength(key, "utf8") >
        NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumStringUtf8Bytes
    ) {
      throw new CanonicalizationFailure("invalid_or_oversize_object_key");
    }
  }
  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalJson(record[key], state, depth + 1)}`,
    )
    .join(",")}}`;
};

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (
    value === null ||
    typeof value !== "object" ||
    seen.has(value as object)
  ) {
    return value;
  }
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const isSafeNonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  !Object.is(value, -0);

const isCanonicalAbsoluteLinuxPath = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    value.length < 2 ||
    !value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("\0") ||
    hasUnpairedSurrogate(value)
  ) {
    return false;
  }
  const segments = value.slice(1).split("/");
  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== "..",
  );
};

const primitiveViolation = (source: string, value: unknown): string | null => {
  switch (source) {
    case "lowercaseSha256":
      return typeof value === "string" && SHA256.test(value)
        ? null
        : "lowercase_sha256_required";
    case "safeNonnegativeInteger":
      return isSafeNonnegativeInteger(value)
        ? null
        : "safe_nonnegative_integer_required";
    case "safePositiveInteger":
      return isSafeNonnegativeInteger(value) && value > 0
        ? null
        : "safe_positive_integer_required";
    case "canonicalUnsignedDecimal":
      return typeof value === "string" && CANONICAL_UNSIGNED_DECIMAL.test(value)
        ? null
        : "canonical_unsigned_decimal_required";
    case "canonicalAbsoluteLinuxPath":
      return isCanonicalAbsoluteLinuxPath(value)
        ? null
        : "canonical_absolute_linux_path_required";
    case "boundedUtf8String":
      return typeof value === "string" &&
        !value.includes("\0") &&
        !hasUnpairedSurrogate(value) &&
        Buffer.byteLength(value, "utf8") <= 8_192
        ? null
        : "bounded_utf8_string_required";
    default:
      return `unsupported_primitive:${source}`;
  }
};

const canonicalDataEqual = (left: unknown, right: unknown): boolean => {
  try {
    return (
      canonicalJson(left, { nodes: 0 }) === canonicalJson(right, { nodes: 0 })
    );
  } catch {
    return false;
  }
};

const validateSchemaNode = (
  node: RegistrySchemaNode,
  value: unknown,
  path: string,
  depth: number,
  issues: string[],
): void => {
  if (
    depth >
    NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_LIMITS.maximumDepth
  ) {
    issues.push(`${path}:schema_depth_exceeded`);
    return;
  }
  const kind = node.kind;
  if (kind === "object") {
    const record = readPlainDataRecord(value);
    const exactKeys = node.exactKeys;
    const fields = node.fields;
    if (
      record == null ||
      !Array.isArray(exactKeys) ||
      !isPlainObject(fields) ||
      !sameExactKeySet(
        record,
        exactKeys.filter((entry): entry is string => typeof entry === "string"),
      ) ||
      exactKeys.some((entry) => typeof entry !== "string")
    ) {
      issues.push(`${path}:exact_object_surface_required`);
      return;
    }
    for (const key of exactKeys as string[]) {
      const child = (fields as Record<string, unknown>)[key];
      if (!isPlainObject(child)) {
        issues.push(`${path}/${key}:registered_field_schema_missing`);
        continue;
      }
      validateSchemaNode(
        child,
        record[key],
        `${path}/${key}`,
        depth + 1,
        issues,
      );
    }
    return;
  }
  if (kind === "literal") {
    if (!canonicalDataEqual(value, node.value)) {
      issues.push(`${path}:literal_mismatch`);
    }
    return;
  }
  if (kind === "authoritative_literal_binding") {
    if (
      node.source !==
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING" ||
      !canonicalDataEqual(
        value,
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
      )
    ) {
      issues.push(`${path}:authoritative_run_plan_binding_mismatch`);
    }
    return;
  }
  if (kind === "primitive") {
    if (typeof node.source !== "string") {
      issues.push(`${path}:primitive_source_missing`);
      return;
    }
    const violation = primitiveViolation(node.source, value);
    if (violation != null) issues.push(`${path}:${violation}`);
    return;
  }
  if (kind === "literal_tuple") {
    const values = node.values;
    if (
      !Array.isArray(values) ||
      !Array.isArray(value) ||
      value.length !== values.length ||
      value.some((entry, index) => !canonicalDataEqual(entry, values[index]))
    ) {
      issues.push(`${path}:literal_tuple_mismatch`);
    }
    return;
  }
  if (kind === "schema_reference") {
    if (typeof node.source !== "string") {
      issues.push(`${path}:schema_reference_source_missing`);
      return;
    }
    const referenced = REGISTRY.schemas[node.source];
    if (referenced == null) {
      issues.push(`${path}:unregistered_schema_reference:${node.source}`);
      return;
    }
    validateSchemaNode(referenced, value, path, depth + 1, issues);
    return;
  }
  issues.push(`${path}:unsupported_schema_kind:${String(kind)}`);
};

const resolveSupportedProfile = (
  profile: string,
): SupportedProfileResolution | null => {
  if (
    !NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_SUPPORTED_PROFILES.includes(
      profile as Nhm2ProlateBosonStarSeedRunEvidenceSupportedProfile,
    )
  ) {
    return null;
  }
  const bindingProfile = REGISTRY.artifactBindingProfiles[profile];
  if (
    bindingProfile == null ||
    typeof bindingProfile.artifactKind !== "string" ||
    typeof bindingProfile.sha256DomainSource !== "string"
  ) {
    return null;
  }
  const domainMatch = /^domains\.([A-Za-z0-9_]+)$/.exec(
    bindingProfile.sha256DomainSource,
  );
  const sha256Domain = domainMatch
    ? REGISTRY.domains[domainMatch[1]]
    : undefined;
  if (
    typeof sha256Domain !== "string" ||
    !sha256Domain.endsWith("\n") ||
    sha256Domain.slice(0, -1).includes("\n")
  ) {
    return null;
  }
  const matchingGrammars = Object.values(REGISTRY.instanceHashGrammars).filter(
    (grammar) =>
      grammar.bindingProfile === profile ||
      grammar.exactBindingProfileOrder?.includes(profile),
  );
  if (matchingGrammars.length !== 1) return null;
  const grammar = matchingGrammars[0];
  const schemaMatch = /^schemas\.([A-Za-z0-9_]+)$/.exec(grammar.schema);
  if (
    grammar.preimage !== "hashPreimage.exactBytes" ||
    schemaMatch == null ||
    REGISTRY.schemas[schemaMatch[1]] == null
  ) {
    return null;
  }
  const maximumCanonicalUtf8Bytes =
    REGISTRY.maximumCanonicalUtf8BytesByArtifact[schemaMatch[1]];
  const bindingVersion = (
    REGISTRY.schemas.controlPlaneBinding as {
      fields?: { bindingVersion?: { value?: unknown } };
    }
  ).fields?.bindingVersion?.value;
  if (
    !Number.isSafeInteger(maximumCanonicalUtf8Bytes) ||
    maximumCanonicalUtf8Bytes <= 0 ||
    typeof bindingVersion !== "string"
  ) {
    return null;
  }
  return Object.freeze({
    profile: profile as Nhm2ProlateBosonStarSeedRunEvidenceSupportedProfile,
    artifactKind: bindingProfile.artifactKind,
    sha256Domain,
    schemaName: schemaMatch[1],
    maximumCanonicalUtf8Bytes,
    bindingVersion,
  });
};

const readBinding = (
  value: unknown,
): Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1 | null => {
  const record = readPlainDataRecord(value);
  if (
    record == null ||
    !sameExactKeySet(record, [
      "bindingVersion",
      "artifactKind",
      "sha256Domain",
      "sha256",
      "canonicalSizeBytes",
    ]) ||
    typeof record.bindingVersion !== "string" ||
    typeof record.artifactKind !== "string" ||
    typeof record.sha256Domain !== "string" ||
    typeof record.sha256 !== "string" ||
    !SHA256.test(record.sha256) ||
    !isSafeNonnegativeInteger(record.canonicalSizeBytes)
  ) {
    return null;
  }
  return Object.freeze({
    bindingVersion:
      record.bindingVersion as Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1["bindingVersion"],
    artifactKind: record.artifactKind,
    sha256Domain: record.sha256Domain,
    sha256: record.sha256,
    canonicalSizeBytes: record.canonicalSizeBytes,
  });
};

/**
 * Validates the closed byte/binding surface for the explicitly supported
 * evidence profiles. It does not turn the registry's descriptive cross-field
 * prose into OS, execution, numerical, artifact, or physical authority.
 */
export const interpretNhm2ProlateBosonStarSeedRunEvidenceV1 = (
  profile: string,
  canonicalUtf8Bytes: Uint8Array,
  bindingValue: unknown,
): Nhm2ProlateBosonStarSeedRunEvidenceInterpretationV1 => {
  const resolution = resolveSupportedProfile(profile);
  if (resolution == null) {
    return NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_SUPPORTED_PROFILES.includes(
      profile as Nhm2ProlateBosonStarSeedRunEvidenceSupportedProfile,
    )
      ? fail(
          profile,
          "registry_profile_invalid",
          "supported_profile_registry_drift",
        )
      : fail(profile, "unsupported_profile", "profile_not_supported");
  }
  let bytes: Buffer;
  try {
    if (!(canonicalUtf8Bytes instanceof Uint8Array)) {
      return fail(profile, "evidence_bytes_invalid", "uint8_array_required");
    }
    if (canonicalUtf8Bytes.byteLength > resolution.maximumCanonicalUtf8Bytes) {
      return fail(
        profile,
        "evidence_bytes_limit_exceeded",
        `maximum_registered_bytes:${resolution.maximumCanonicalUtf8Bytes}`,
      );
    }
    bytes = Buffer.from(canonicalUtf8Bytes);
  } catch {
    return fail(profile, "evidence_bytes_invalid", "byte_snapshot_failed");
  }
  if (
    bytes.length === 0 ||
    (bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf)
  ) {
    return fail(profile, "evidence_utf8_invalid", "empty_or_bom_prefixed_utf8");
  }
  let text: string;
  try {
    text = STRICT_UTF8.decode(bytes);
  } catch {
    return fail(profile, "evidence_utf8_invalid", "strict_utf8_decode_failed");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail(profile, "evidence_json_invalid", "json_parse_failed");
  }
  let recanonicalized: string;
  try {
    recanonicalized = canonicalJson(parsed, { nodes: 0 });
  } catch (error) {
    return fail(
      profile,
      "evidence_json_invalid",
      error instanceof Error ? error.message : "canonicalization_failed",
    );
  }
  if (!Buffer.from(recanonicalized, "utf8").equals(bytes)) {
    return fail(
      profile,
      "evidence_json_noncanonical",
      "raw_bytes_must_equal_recanonicalized_utf8",
    );
  }
  const parsedRecord = readPlainDataRecord(parsed);
  if (parsedRecord == null) {
    return fail(profile, "evidence_schema_invalid", "/:object_required");
  }
  const schemaIssues: string[] = [];
  validateSchemaNode(
    REGISTRY.schemas[resolution.schemaName],
    parsedRecord,
    "",
    0,
    schemaIssues,
  );
  if (schemaIssues.length > 0) {
    return fail(
      profile,
      "evidence_schema_invalid",
      ...schemaIssues.slice(0, 64),
    );
  }
  const binding = readBinding(bindingValue);
  if (binding == null) {
    return fail(
      profile,
      "binding_surface_invalid",
      "exact_plain_binding_required",
    );
  }
  if (
    binding.bindingVersion !== resolution.bindingVersion ||
    binding.artifactKind !== resolution.artifactKind ||
    binding.sha256Domain !== resolution.sha256Domain
  ) {
    return fail(
      profile,
      "binding_profile_mismatch",
      "binding_version_artifact_kind_or_domain_mismatch",
    );
  }
  if (binding.canonicalSizeBytes !== bytes.byteLength) {
    return fail(profile, "binding_size_mismatch", "canonical_size_mismatch");
  }
  const expectedSha256 = createHash("sha256")
    .update(resolution.sha256Domain, "utf8")
    .update(bytes)
    .digest("hex");
  if (binding.sha256 !== expectedSha256) {
    return fail(profile, "binding_hash_mismatch", "domain_hash_mismatch");
  }
  return Object.freeze({
    ok: true,
    interpreterVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_RUN_EVIDENCE_INTERPRETER_VERSION,
    profile: resolution.profile,
    schemaName: resolution.schemaName,
    canonicalJson: recanonicalized,
    value: deepFreeze(parsedRecord),
    binding,
    checks: Object.freeze({
      profileRegistered: true,
      instanceHashGrammarRegistered: true,
      supportedSchemaShapeValidated: true,
      canonicalUtf8Exact: true,
      bindingVersionExact: true,
      artifactKindExact: true,
      sha256DomainExact: true,
      canonicalSizeExact: true,
      domainSeparatedSha256Exact: true,
      descriptiveRegistryCrossFieldInvariantsIndependentlyReplayed: false,
    }),
    authorityLocks: NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
  });
};
