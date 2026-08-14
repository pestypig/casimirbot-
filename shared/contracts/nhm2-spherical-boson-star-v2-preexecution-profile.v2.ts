import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
  type Nhm2SphericalV2FreshnessObservationV1,
  type Nhm2SphericalV2LinuxFileStatV1,
  type Nhm2SphericalV2RunIdentityV1,
  type Nhm2SphericalV2StaticInputKindV1,
  type Nhm2SphericalV2StaticInputRoleV1,
} from "./nhm2-spherical-boson-star-v2-preexecution-profile.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_preexecution_profile" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_preexecution_profile/v2" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution-profile/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_V2_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/command-argv/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/pre-preseal-static-input-aggregate/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/pre-preseal-static-closure/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_FRESHNESS_INVENTORY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/pre-preseal-freshness-inventory/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_INVENTORY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/execution-freshness-inventory/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_PLAN_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/output-root-plan/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_INVENTORY_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/output-root-absence-inventory/v2\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-preexecution/diagnostic-execution-preseal/v2\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 32_768,
    maximumArrayLength: 16_384,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateStringUtf8Bytes: 1_048_576,
    maximumCanonicalCodeUnits: 2_097_152,
    maximumCanonicalUtf8Bytes: 2_097_152,
    maximumStaticInputEntries: 16_384,
    maximumArgumentCount: 256,
    maximumArgumentUtf8Bytes: 65_536,
    maximumUnsignedDecimalDigits: 20,
  } as const);

export type Nhm2SphericalV2PrePresealStaticInputRoleV2 = Exclude<
  Nhm2SphericalV2StaticInputRoleV1,
  "scientific_preseal" | "scientific_persistence_receipt"
>;

export type Nhm2SphericalV2PrePresealStaticInputEntryV2 = Readonly<{
  relativePath: string;
  semanticRole: Nhm2SphericalV2PrePresealStaticInputRoleV2;
  semanticKind: Nhm2SphericalV2StaticInputKindV1;
  mediaType: "application/json" | "application/octet-stream" | "text/plain";
  sizeBytes: number;
  sha256: string;
  stat: Nhm2SphericalV2LinuxFileStatV1;
}>;

export type Nhm2SphericalV2OutputRootPlanEntryV2 = Readonly<{
  role: "primary" | "independent";
  absolutePath: string;
}>;

export type Nhm2SphericalV2OutputRootPlanV2 = readonly [
  Nhm2SphericalV2OutputRootPlanEntryV2,
  Nhm2SphericalV2OutputRootPlanEntryV2,
];

export type Nhm2SphericalV2OutputRootAbsenceObservationV2 = Readonly<{
  role: "primary" | "independent";
  absolutePath: string;
  observedAbsent: true;
  observedAtMonotonicRawNanoseconds: string;
  observedAtWallUtc: string;
}>;

export type Nhm2SphericalV2OutputRootAbsenceInventoryV2 = readonly [
  Nhm2SphericalV2OutputRootAbsenceObservationV2,
  Nhm2SphericalV2OutputRootAbsenceObservationV2,
];

export type Nhm2SphericalV2PrePresealStaticClosureV2 = Readonly<{
  schemaVersion: "nhm2_spherical_boson_star_v2_pre_preseal_static_closure/v1";
  closurePhase: "pre_scientific_preseal";
  preexecutionProfileBinding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING;
  commandArgvSha256: string;
  prePresealStaticInputAggregateSha256: string;
  prePresealFreshnessInventorySha256: string;
  dirtyTreeDigestSha256: string;
  expectedRuntimeClosureSha256: string;
  outputRootPlan: Nhm2SphericalV2OutputRootPlanV2;
  outputRootPlanSha256: string;
}>;

export type Nhm2SphericalV2DiagnosticSkeletonBindingV2 = Readonly<{
  artifactId: "nhm2.spherical_boson_star_v2_preexecution_output_skeleton";
  contractVersion: "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2";
  path: string;
  mediaType: "application/json";
  rawSha256: string;
  wireSha256: string;
  sizeBytes: number;
  skeletonFrozenAt: string;
  persistedAt: string;
  persistenceReceiptSha256: string;
  prePresealStaticClosureSha256: string;
}>;

export type Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2 = Readonly<{
  relativePath: string;
  preopen: Nhm2SphericalV2LinuxFileStatV1;
  postread: Nhm2SphericalV2LinuxFileStatV1;
  stable: true;
  observedAtWallUtc: string;
  observedAtMonotonicRawNanoseconds: string;
}>;

export type Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2 =
  Readonly<{
    artifactId: "nhm2.spherical_boson_star_v2_diagnostic_execution_freshness_receipt";
    contractVersion: "nhm2_spherical_boson_star_v2_diagnostic_execution_freshness_receipt/v1";
    path: string;
    mediaType: "application/json";
    rawSha256: string;
    receiptSha256: string;
    sizeBytes: number;
    observedAt: string;
    executionFreshnessInventorySha256: string;
  }>;

export type Nhm2SphericalV2DiagnosticScientificPresealBindingV2 = Readonly<{
  artifactId: string;
  contractVersion: string;
  path: string;
  mediaType: "application/json";
  rawSha256: string;
  presealEnvelopeSha256: string;
  sizeBytes: number;
  createdAt: string;
  persistedAt: string;
  boundSkeletonRawSha256: string;
  boundSkeletonWireSha256: string;
  boundSkeletonSizeBytes: number;
  boundSkeletonPersistenceReceiptSha256: string;
}>;

export type Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2 = Readonly<{
  artifactId: string;
  contractVersion: string;
  path: string;
  mediaType: "application/json";
  rawSha256: string;
  receiptSha256: string;
  sizeBytes: number;
  persistenceObservedAt: string;
  persistedArtifactRawSha256: string;
  persistedArtifactSizeBytes: number;
}>;

export type Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2 =
  Readonly<{
    artifactId: string;
    contractVersion: string;
    path: string;
    mediaType: "application/json";
    rawSha256: string;
    receiptSha256: string;
    sizeBytes: number;
    observedAt: string;
    outputRootAbsenceInventorySha256: string;
  }>;

export type Nhm2SphericalV2DiagnosticPrePresealStaticClosureEvidenceV2 =
  Readonly<{
    argv: readonly [string, ...string[]];
    staticInputs: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[];
    freshnessObservations: readonly Nhm2SphericalV2FreshnessObservationV1[];
    runIdentity: Nhm2SphericalV2RunIdentityV1;
    dirtyTreeDigestSha256: string;
    expectedRuntimeClosureSha256: string;
    outputRootPlan: Nhm2SphericalV2OutputRootPlanV2;
  }>;

export type Nhm2SphericalV2DiagnosticPreexecutionPresealEvidenceV2 = Readonly<{
  attemptOrdinal: 1;
  createdMonotonicRawNanoseconds: string;
  createdWallUtc: string;
  prePresealStaticClosure: Nhm2SphericalV2PrePresealStaticClosureV2;
  staticInputs: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[];
  executionFreshnessObservations: readonly Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[];
  executionFreshnessReceiptBinding: Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2;
  runIdentity: Nhm2SphericalV2RunIdentityV1;
  preexecutionSkeletonBinding: Nhm2SphericalV2DiagnosticSkeletonBindingV2;
  scientificPresealBinding: Nhm2SphericalV2DiagnosticScientificPresealBindingV2;
  scientificPersistenceReceiptBinding: Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2;
  outputRootAbsenceInventory: Nhm2SphericalV2OutputRootAbsenceInventoryV2;
  outputRootAbsenceReceiptBinding: Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2;
}>;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_AUTHORITY_LOCKS =
  Object.freeze({
    implementationClosureAuthority: false as const,
    runtimeClosureAuthority: false as const,
    filesystemObservationAuthority: false as const,
    outputRootAbsenceAuthority: false as const,
    presealPersistenceAuthority: false as const,
    skeletonWireValidationAuthority: false as const,
    executionFreshnessObservationAuthority: false as const,
    syscallTraceAuthority: false as const,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS =
  Object.freeze({
    candidateAccepted: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_LAMPS =
  Object.freeze({
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    independentAgreementLamp: false as const,
    diagnosticPassLamp: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2 =
  Object.freeze([
    "v2_candidate_freeze",
    "initializer_bridge",
    "scientific_candidate_manifest",
    "source_manifest",
    "source_file",
    "source_payload",
    "build_recipe",
    "dependency_lock",
    "toolchain_manifest",
    "executable",
    "elf_interpreter",
    "shared_object",
  ] as const satisfies readonly Nhm2SphericalV2PrePresealStaticInputRoleV2[]);

const STATIC_ROLE_KIND_V2 = Object.freeze({
  v2_candidate_freeze: "canonical_json",
  initializer_bridge: "canonical_json",
  scientific_candidate_manifest: "canonical_json",
  source_manifest: "canonical_json",
  source_file: "source_text",
  source_payload: "f64le",
  build_recipe: "source_text",
  dependency_lock: "dependency_lock",
  toolchain_manifest: "canonical_json",
  executable: "executable",
  elf_interpreter: "elf_interpreter",
  shared_object: "shared_object",
} as const satisfies Readonly<
  Record<
    Nhm2SphericalV2PrePresealStaticInputRoleV2,
    Nhm2SphericalV2StaticInputKindV1
  >
>);

const MEDIA_TYPE_BY_KIND = Object.freeze({
  canonical_json: "application/json",
  source_text: "text/plain",
  f64le: "application/octet-stream",
  dependency_lock: "application/octet-stream",
  executable: "application/octet-stream",
  elf_interpreter: "application/octet-stream",
  shared_object: "application/octet-stream",
  opaque_binary: "application/octet-stream",
} as const);

const REPEATABLE_STATIC_INPUT_ROLES =
  new Set<Nhm2SphericalV2PrePresealStaticInputRoleV2>([
    "source_file",
    "source_payload",
    "shared_object",
  ]);
const SHA256 = /^[a-f0-9]{64}$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const U64_DECIMAL_MAX = "18446744073709551615";
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;
const ASCII_RELATIVE_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\/\/)[\x21-\x7e]+$/;
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
]);

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalValue[]
  | { readonly [key: string]: CanonicalValue };

type SnapshotResult =
  | Readonly<{ ok: true; value: CanonicalValue }>
  | Readonly<{ ok: false; violation: string }>;

type SnapshotBudget = {
  nodes: number;
  aggregateStringUtf8Bytes: number;
};

const pointerSegment = (value: string): string =>
  value.replaceAll("~", "~0").replaceAll("/", "~1");

const validCanonicalString = (
  value: string,
  pointer: string,
  budget: SnapshotBudget,
  isKey: boolean,
): string | null => {
  if (
    value.includes("\0") ||
    /[\ud800-\udfff]/u.test(value) ||
    value.normalize("NFC") !== value
  ) {
    return `string:${pointer || "/"}`;
  }
  const size = Buffer.byteLength(value, "utf8");
  if (
    size >
    (isKey
      ? NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumPropertyKeyUtf8Bytes
      : NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumStringUtf8Bytes)
  ) {
    return `${isKey ? "key_utf8" : "string_utf8"}:${pointer || "/"}`;
  }
  budget.aggregateStringUtf8Bytes += size;
  return budget.aggregateStringUtf8Bytes <=
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumAggregateStringUtf8Bytes
    ? null
    : `aggregate_string_utf8:${pointer || "/"}`;
};

const snapshotCanonicalValue = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget: SnapshotBudget = { nodes: 0, aggregateStringUtf8Bytes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS;
  if (depth > limits.maximumDepth) {
    return { ok: false, violation: `depth:${pointer || "/"}` };
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return { ok: false, violation: `nodes:${pointer || "/"}` };
  }
  if (value === null || typeof value === "boolean") {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `number:${pointer || "/"}` };
  }
  if (typeof value === "string") {
    const violation = validCanonicalString(value, pointer, budget, false);
    return violation === null ? { ok: true, value } : { ok: false, violation };
  }
  if (typeof value !== "object" || isProxy(value)) {
    return { ok: false, violation: `surface:${pointer || "/"}` };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: `cycle:${pointer || "/"}` };
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    const keys = Reflect.ownKeys(value);
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length > limits.maximumArrayLength ||
      keys.some(
        (key) =>
          key !== "length" &&
          (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key)),
      ) ||
      Object.keys(value).length !== value.length
    ) {
      return { ok: false, violation: `array:${pointer || "/"}` };
    }
    const output: CanonicalValue[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return { ok: false, violation: `array:${pointer || "/"}` };
      }
      const child = snapshotCanonicalValue(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!child.ok) return child;
      output.push(child.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    return { ok: false, violation: `object:${pointer || "/"}` };
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.length > limits.maximumObjectPropertyCount ||
    keys.some((key) => typeof key !== "string")
  ) {
    return { ok: false, violation: `object:${pointer || "/"}` };
  }
  const output = Object.create(null) as Record<string, CanonicalValue>;
  for (const key of keys as string[]) {
    const keyPointer = `${pointer}/${pointerSegment(key)}`;
    if (FORBIDDEN_KEYS.has(key)) {
      return { ok: false, violation: `key:${keyPointer}` };
    }
    const keyViolation = validCanonicalString(key, keyPointer, budget, true);
    if (keyViolation !== null) {
      return { ok: false, violation: keyViolation };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return { ok: false, violation: `property:${keyPointer}` };
    }
    const child = snapshotCanonicalValue(
      descriptor.value,
      keyPointer,
      ancestors,
      depth + 1,
      budget,
    );
    if (!child.ok) return child;
    output[key] = child.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

const trustedCanonicalJsonFromValue = (value: CanonicalValue): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(trustedCanonicalJsonFromValue).join(",")}]`;
  }
  const record = value as { readonly [key: string]: CanonicalValue };
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${trustedCanonicalJsonFromValue(record[key]!)}`,
    )
    .join(",")}}`;
};

const trustedCanonicalJson = (value: unknown, code: string): string => {
  let safe: SnapshotResult;
  try {
    safe = snapshotCanonicalValue(value);
  } catch {
    throw new TypeError(code);
  }
  if (!safe.ok) {
    throw new TypeError(`${code}:${safe.violation}`);
  }
  const canonical = trustedCanonicalJsonFromValue(safe.value);
  if (
    Buffer.byteLength(canonical, "utf8") >
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumCanonicalUtf8Bytes
  ) {
    throw new TypeError(`${code}:canonical_bytes_exceeded`);
  }
  return canonical;
};

type ParsedTraversalFrame = Readonly<{
  value: unknown;
  pointer: string;
  depth: number;
}>;

const validateParsedCanonicalTree = (root: unknown, code: string): void => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS;
  const stack: ParsedTraversalFrame[] = [
    { value: root, pointer: "", depth: 0 },
  ];
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
      const budget = { nodes: 0, aggregateStringUtf8Bytes };
      const violation = validCanonicalString(
        value,
        frame.pointer,
        budget,
        false,
      );
      if (violation !== null) throw new TypeError(`${code}:${violation}`);
      aggregateStringUtf8Bytes = budget.aggregateStringUtf8Bytes;
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
      if (FORBIDDEN_KEYS.has(key)) {
        throw new TypeError(`${code}:key:${keyPointer}`);
      }
      const budget = { nodes: 0, aggregateStringUtf8Bytes };
      const violation = validCanonicalString(key, keyPointer, budget, true);
      if (violation !== null) throw new TypeError(`${code}:${violation}`);
      aggregateStringUtf8Bytes = budget.aggregateStringUtf8Bytes;
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
): CanonicalValue => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS;
  if (typeof canonicalJson !== "string") {
    throw new TypeError(`${code}:canonical_json_text_required`);
  }
  if (canonicalJson.length > limits.maximumCanonicalCodeUnits) {
    throw new TypeError(`${code}:canonical_code_units_exceeded`);
  }
  const byteLength = Buffer.byteLength(canonicalJson, "utf8");
  if (byteLength > limits.maximumCanonicalUtf8Bytes) {
    throw new TypeError(`${code}:canonical_bytes_exceeded`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(canonicalJson) as unknown;
  } catch {
    throw new TypeError(`${code}:json_parse_invalid`);
  }
  validateParsedCanonicalTree(parsed, code);
  const rerendered = trustedCanonicalJsonFromValue(parsed as CanonicalValue);
  if (rerendered !== canonicalJson) {
    throw new TypeError(`${code}:canonical_encoding_invalid`);
  }
  return parsed as CanonicalValue;
};

export const nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson = (
  canonicalJson: string,
): string => {
  parseBoundedCanonicalJson(
    canonicalJson,
    "v2_preexecution_profile_v2_canonical_json",
  );
  return canonicalJson;
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

const trustedCanonicalSnapshot = <T>(value: T, code: string): T => {
  let safe: SnapshotResult;
  try {
    safe = snapshotCanonicalValue(value);
  } catch {
    throw new TypeError(code);
  }
  if (!safe.ok) throw new TypeError(`${code}:${safe.violation}`);
  return safe.value as T;
};

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("v2_preexecution_profile_v2_u64_invalid");
  }
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};

const nonzeroSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);

const u64DecimalValid = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    value.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumUnsignedDecimalDigits ||
    !DECIMAL.test(value)
  ) {
    return false;
  }
  return (
    value.length < U64_DECIMAL_MAX.length ||
    (value.length === U64_DECIMAL_MAX.length && value <= U64_DECIMAL_MAX)
  );
};

const strictRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.normalize("NFC") === value &&
  ASCII_RELATIVE_PATH.test(value) &&
  !value.includes("\\") &&
  Buffer.byteLength(value, "utf8") <= 4_096;

const strictAbsolutePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith("/") &&
  strictRelativePath(value.slice(1)) &&
  !value.endsWith("/");

const statValid = (value: unknown): value is Nhm2SphericalV2LinuxFileStatV1 => {
  if (
    !exactKeys(value, [
      "changeTimeNanoseconds",
      "device",
      "fileType",
      "inode",
      "linkCount",
      "modeOctal",
      "modifyTimeNanoseconds",
      "ownerGid",
      "ownerUid",
      "sha256",
      "sizeBytes",
    ])
  ) {
    return false;
  }
  const stat = value as unknown as Nhm2SphericalV2LinuxFileStatV1;
  return (
    stat.fileType === "regular" &&
    [
      stat.ownerUid,
      stat.ownerGid,
      stat.device,
      stat.inode,
      stat.changeTimeNanoseconds,
      stat.modifyTimeNanoseconds,
    ].every(u64DecimalValid) &&
    stat.ownerUid !== "0" &&
    stat.ownerGid !== "0" &&
    stat.linkCount === "1" &&
    ["0400", "0500"].includes(stat.modeOctal) &&
    Number.isSafeInteger(stat.sizeBytes) &&
    stat.sizeBytes >= 0 &&
    nonzeroSha256(stat.sha256)
  );
};

const runIdentityValid = (
  value: unknown,
): value is Nhm2SphericalV2RunIdentityV1 => {
  if (!exactKeys(value, ["ownerGid", "ownerUid", "supplementaryGids"])) {
    return false;
  }
  const identity = value as unknown as Nhm2SphericalV2RunIdentityV1;
  return (
    u64DecimalValid(identity.ownerUid) &&
    identity.ownerUid !== "0" &&
    u64DecimalValid(identity.ownerGid) &&
    identity.ownerGid !== "0" &&
    Array.isArray(identity.supplementaryGids) &&
    identity.supplementaryGids.length === 0
  );
};

const sortedUniquePaths = (paths: readonly string[]): boolean =>
  paths.every((path, index) => {
    if (index === 0) return true;
    return (
      Buffer.compare(
        Buffer.from(paths[index - 1]!, "utf8"),
        Buffer.from(path, "utf8"),
      ) < 0
    );
  }) && new Set(paths.map((path) => path.toLowerCase())).size === paths.length;

const staticEntryValid = (
  value: unknown,
): value is Nhm2SphericalV2PrePresealStaticInputEntryV2 => {
  if (
    !exactKeys(value, [
      "mediaType",
      "relativePath",
      "semanticKind",
      "semanticRole",
      "sha256",
      "sizeBytes",
      "stat",
    ])
  ) {
    return false;
  }
  const entry = value as unknown as Nhm2SphericalV2PrePresealStaticInputEntryV2;
  const expectedKind = STATIC_ROLE_KIND_V2[entry.semanticRole];
  const expectedMediaType = MEDIA_TYPE_BY_KIND[entry.semanticKind];
  if (
    !strictRelativePath(entry.relativePath) ||
    !Object.hasOwn(STATIC_ROLE_KIND_V2, entry.semanticRole) ||
    !Object.hasOwn(MEDIA_TYPE_BY_KIND, entry.semanticKind) ||
    entry.semanticKind !== expectedKind ||
    entry.mediaType !== expectedMediaType ||
    !Number.isSafeInteger(entry.sizeBytes) ||
    entry.sizeBytes < 0 ||
    !nonzeroSha256(entry.sha256) ||
    !statValid(entry.stat) ||
    entry.stat.sizeBytes !== entry.sizeBytes ||
    entry.stat.sha256 !== entry.sha256
  ) {
    return false;
  }
  return (
    entry.stat.modeOctal ===
    (entry.semanticKind === "executable" ||
    entry.semanticKind === "elf_interpreter"
      ? "0500"
      : "0400")
  );
};

const staticRoleClosureValid = (
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
): boolean => {
  const counts = new Map<Nhm2SphericalV2PrePresealStaticInputRoleV2, number>();
  for (const entry of entries) {
    counts.set(entry.semanticRole, (counts.get(entry.semanticRole) ?? 0) + 1);
  }
  return (
    counts.size ===
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2.length &&
    NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2.every(
      (role) => {
        const count = counts.get(role) ?? 0;
        return REPEATABLE_STATIC_INPUT_ROLES.has(role)
          ? count >= 1
          : count === 1;
      },
    )
  );
};

const validateStaticInventory = (
  entries: unknown,
  runIdentity: unknown,
  code: string,
): readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[] => {
  const inventory = trustedCanonicalSnapshot(
    entries,
    `${code}_surface`,
  ) as unknown;
  const identity = trustedCanonicalSnapshot(
    runIdentity,
    `${code}_identity_surface`,
  ) as unknown;
  if (
    !Array.isArray(inventory) ||
    inventory.length < 1 ||
    inventory.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumStaticInputEntries ||
    !runIdentityValid(identity) ||
    !inventory.every(staticEntryValid)
  ) {
    throw new TypeError(code);
  }
  const typed =
    inventory as readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[];
  if (
    !staticRoleClosureValid(typed) ||
    !sortedUniquePaths(typed.map((entry) => entry.relativePath)) ||
    typed.some(
      (entry) =>
        entry.stat.ownerUid !== identity.ownerUid ||
        entry.stat.ownerGid !== identity.ownerGid,
    )
  ) {
    throw new TypeError(code);
  }
  return typed;
};

const lengthDelimitedCanonicalAggregate = (
  domain: string,
  entries: readonly unknown[],
): string => {
  const hash = createHash("sha256")
    .update(domain, "utf8")
    .update(u64le(entries.length));
  for (const entry of entries) {
    const bytes = Buffer.from(
      trustedCanonicalJson(
        entry,
        "v2_preexecution_profile_v2_trusted_aggregate_entry_invalid",
      ),
      "utf8",
    );
    hash.update(u64le(bytes.length)).update(bytes);
  }
  return hash.digest("hex");
};

const computeCommandArgvSha256Trusted = (argv: readonly string[]): string => {
  const safe = trustedCanonicalSnapshot(
    argv,
    "v2_preexecution_profile_v2_argv",
  ) as readonly unknown[] | unknown;
  if (
    !Array.isArray(safe) ||
    safe.length < 1 ||
    safe.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumArgumentCount
  ) {
    throw new TypeError("v2_preexecution_profile_v2_argv_invalid");
  }
  const hash = createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_COMMAND_ARGV_V2_SHA256_DOMAIN, "utf8")
    .update(u64le(safe.length));
  for (const value of safe) {
    if (typeof value !== "string") {
      throw new TypeError("v2_preexecution_profile_v2_argv_invalid");
    }
    const bytes = Buffer.from(value, "utf8");
    if (
      bytes.length >
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS.maximumArgumentUtf8Bytes
    ) {
      throw new TypeError("v2_preexecution_profile_v2_argv_invalid");
    }
    hash.update(u64le(bytes.length)).update(bytes);
  }
  return hash.digest("hex");
};

const computePrePresealStaticInputAggregateSha256Trusted = (
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string => {
  const safe = validateStaticInventory(
    entries,
    runIdentity,
    "v2_preexecution_profile_v2_pre_preseal_static_inventory_invalid",
  );
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
    safe,
  );
};

const freshnessObservationValid = (
  value: unknown,
  expected: Nhm2SphericalV2PrePresealStaticInputEntryV2,
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): value is Nhm2SphericalV2FreshnessObservationV1 => {
  if (!exactKeys(value, ["postread", "preopen", "relativePath", "stable"])) {
    return false;
  }
  const observation = value as unknown as Nhm2SphericalV2FreshnessObservationV1;
  return (
    observation.relativePath === expected.relativePath &&
    observation.stable === true &&
    statValid(observation.preopen) &&
    statValid(observation.postread) &&
    observation.preopen.ownerUid === runIdentity.ownerUid &&
    observation.preopen.ownerGid === runIdentity.ownerGid &&
    trustedCanonicalJson(
      observation.preopen,
      "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
    ) ===
      trustedCanonicalJson(
        observation.postread,
        "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
      ) &&
    trustedCanonicalJson(
      observation.preopen,
      "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
    ) ===
      trustedCanonicalJson(
        expected.stat,
        "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
      )
  );
};

const timedExecutionFreshnessObservationValid = (
  value: unknown,
  expected: Nhm2SphericalV2PrePresealStaticInputEntryV2,
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): value is Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2 => {
  if (
    !exactKeys(value, [
      "observedAtMonotonicRawNanoseconds",
      "observedAtWallUtc",
      "postread",
      "preopen",
      "relativePath",
      "stable",
    ])
  ) {
    return false;
  }
  const observation =
    value as unknown as Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2;
  return (
    observation.relativePath === expected.relativePath &&
    observation.stable === true &&
    statValid(observation.preopen) &&
    statValid(observation.postread) &&
    observation.preopen.ownerUid === runIdentity.ownerUid &&
    observation.preopen.ownerGid === runIdentity.ownerGid &&
    trustedCanonicalJson(
      observation.preopen,
      "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
    ) ===
      trustedCanonicalJson(
        observation.postread,
        "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
      ) &&
    trustedCanonicalJson(
      observation.preopen,
      "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
    ) ===
      trustedCanonicalJson(
        expected.stat,
        "v2_preexecution_profile_v2_trusted_freshness_stat_invalid",
      ) &&
    u64DecimalValid(observation.observedAtMonotonicRawNanoseconds) &&
    parseUtcNanoseconds(observation.observedAtWallUtc) !== null
  );
};

const computeFreshnessInventorySha256 = (
  domain: string,
  observations: readonly Nhm2SphericalV2FreshnessObservationV1[],
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
  code: string,
): string => {
  const staticInputs = validateStaticInventory(entries, runIdentity, code);
  const safeObservations = trustedCanonicalSnapshot(
    observations,
    `${code}_surface`,
  ) as unknown;
  const safeIdentity = trustedCanonicalSnapshot(
    runIdentity,
    `${code}_identity_surface`,
  ) as unknown;
  if (
    !Array.isArray(safeObservations) ||
    !runIdentityValid(safeIdentity) ||
    safeObservations.length !== staticInputs.length ||
    !safeObservations.every((entry, index) =>
      freshnessObservationValid(entry, staticInputs[index]!, safeIdentity),
    )
  ) {
    throw new TypeError(code);
  }
  return lengthDelimitedCanonicalAggregate(domain, safeObservations);
};

const computePrePresealFreshnessInventorySha256Trusted = (
  observations: readonly Nhm2SphericalV2FreshnessObservationV1[],
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string =>
  computeFreshnessInventorySha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_FRESHNESS_INVENTORY_SHA256_DOMAIN,
    observations,
    entries,
    runIdentity,
    "v2_preexecution_profile_v2_pre_preseal_freshness_invalid",
  );

const computeExecutionFreshnessInventorySha256Trusted = (
  observations: readonly Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[],
  entries: readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
  runIdentity: Nhm2SphericalV2RunIdentityV1,
): string => {
  const code = "v2_preexecution_profile_v2_execution_freshness_invalid";
  const staticInputs = validateStaticInventory(entries, runIdentity, code);
  const safeObservations = trustedCanonicalSnapshot(
    observations,
    `${code}_surface`,
  ) as unknown;
  const safeIdentity = trustedCanonicalSnapshot(
    runIdentity,
    `${code}_identity_surface`,
  ) as unknown;
  if (
    !Array.isArray(safeObservations) ||
    !runIdentityValid(safeIdentity) ||
    safeObservations.length !== staticInputs.length ||
    !safeObservations.every((entry, index) =>
      timedExecutionFreshnessObservationValid(
        entry,
        staticInputs[index]!,
        safeIdentity,
      ),
    )
  ) {
    throw new TypeError(code);
  }
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_INVENTORY_SHA256_DOMAIN,
    safeObservations,
  );
};

const outputRootPlanValid = (
  value: unknown,
): value is Nhm2SphericalV2OutputRootPlanV2 => {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const roots = value as unknown as Nhm2SphericalV2OutputRootPlanV2;
  if (
    roots.some(
      (entry, index) =>
        !exactKeys(entry, ["absolutePath", "role"]) ||
        entry.role !== (index === 0 ? "primary" : "independent") ||
        !strictAbsolutePath(entry.absolutePath),
    )
  ) {
    return false;
  }
  const primary = roots[0].absolutePath.toLowerCase();
  const independent = roots[1].absolutePath.toLowerCase();
  return (
    primary !== independent &&
    !primary.startsWith(`${independent}/`) &&
    !independent.startsWith(`${primary}/`)
  );
};

const computeOutputRootPlanSha256Trusted = (
  plan: Nhm2SphericalV2OutputRootPlanV2,
): string => {
  const safe = trustedCanonicalSnapshot(
    plan,
    "v2_preexecution_profile_v2_output_root_plan_invalid",
  ) as unknown;
  if (!outputRootPlanValid(safe)) {
    throw new TypeError("v2_preexecution_profile_v2_output_root_plan_invalid");
  }
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_PLAN_SHA256_DOMAIN,
    safe,
  );
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
  return BigInt(milliseconds) * 1_000_000n + BigInt(fraction!);
};

const outputRootAbsenceInventoryValid = (
  value: unknown,
  outputRootPlan: Nhm2SphericalV2OutputRootPlanV2,
): value is Nhm2SphericalV2OutputRootAbsenceInventoryV2 => {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const inventory =
    value as unknown as Nhm2SphericalV2OutputRootAbsenceInventoryV2;
  return inventory.every(
    (entry, index) =>
      exactKeys(entry, [
        "absolutePath",
        "observedAbsent",
        "observedAtMonotonicRawNanoseconds",
        "observedAtWallUtc",
        "role",
      ]) &&
      entry.role === (index === 0 ? "primary" : "independent") &&
      entry.role === outputRootPlan[index].role &&
      entry.absolutePath === outputRootPlan[index].absolutePath &&
      entry.observedAbsent === true &&
      u64DecimalValid(entry.observedAtMonotonicRawNanoseconds) &&
      parseUtcNanoseconds(entry.observedAtWallUtc) !== null,
  );
};

const computeOutputRootAbsenceInventorySha256Trusted = (
  inventory: Nhm2SphericalV2OutputRootAbsenceInventoryV2,
  outputRootPlan: Nhm2SphericalV2OutputRootPlanV2,
): string => {
  const safeInventory = trustedCanonicalSnapshot(
    inventory,
    "v2_preexecution_profile_v2_output_root_absence_inventory_invalid",
  ) as unknown;
  const safePlan = trustedCanonicalSnapshot(
    outputRootPlan,
    "v2_preexecution_profile_v2_output_root_plan_invalid",
  ) as unknown;
  if (
    !outputRootPlanValid(safePlan) ||
    !outputRootAbsenceInventoryValid(safeInventory, safePlan)
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_output_root_absence_inventory_invalid",
    );
  }
  return lengthDelimitedCanonicalAggregate(
    NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_INVENTORY_SHA256_DOMAIN,
    safeInventory,
  );
};

const prePresealStaticClosureValid = (
  value: unknown,
): value is Nhm2SphericalV2PrePresealStaticClosureV2 => {
  if (
    !exactKeys(value, [
      "schemaVersion",
      "closurePhase",
      "preexecutionProfileBinding",
      "commandArgvSha256",
      "prePresealStaticInputAggregateSha256",
      "prePresealFreshnessInventorySha256",
      "dirtyTreeDigestSha256",
      "expectedRuntimeClosureSha256",
      "outputRootPlan",
      "outputRootPlanSha256",
    ])
  ) {
    return false;
  }
  const closure = value as unknown as Nhm2SphericalV2PrePresealStaticClosureV2;
  return (
    closure.schemaVersion ===
      "nhm2_spherical_boson_star_v2_pre_preseal_static_closure/v1" &&
    closure.closurePhase === "pre_scientific_preseal" &&
    trustedCanonicalJson(
      closure.preexecutionProfileBinding,
      "v2_preexecution_profile_v2_trusted_profile_binding_invalid",
    ) ===
      trustedCanonicalJson(
        NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
        "v2_preexecution_profile_v2_trusted_profile_binding_invalid",
      ) &&
    [
      closure.commandArgvSha256,
      closure.prePresealStaticInputAggregateSha256,
      closure.prePresealFreshnessInventorySha256,
      closure.dirtyTreeDigestSha256,
      closure.expectedRuntimeClosureSha256,
      closure.outputRootPlanSha256,
    ].every(nonzeroSha256) &&
    outputRootPlanValid(closure.outputRootPlan) &&
    closure.outputRootPlanSha256 ===
      computeOutputRootPlanSha256Trusted(closure.outputRootPlan)
  );
};

const computePrePresealStaticClosureSha256Trusted = (
  closure: Nhm2SphericalV2PrePresealStaticClosureV2,
): string => {
  if (!prePresealStaticClosureValid(closure)) {
    throw new TypeError(
      "v2_preexecution_profile_v2_pre_preseal_static_closure_invalid",
    );
  }
  const bytes = Buffer.from(
    trustedCanonicalJson(
      closure,
      "v2_preexecution_profile_v2_trusted_pre_preseal_static_closure_invalid",
    ),
    "utf8",
  );
  return createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN,
      "utf8",
    )
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

const deriveDiagnosticPrePresealStaticClosureTrusted = (
  evidence: Nhm2SphericalV2DiagnosticPrePresealStaticClosureEvidenceV2,
): Nhm2SphericalV2PrePresealStaticClosureV2 => {
  const safe = trustedCanonicalSnapshot(
    evidence,
    "v2_preexecution_profile_v2_pre_preseal_evidence_invalid",
  ) as unknown;
  if (
    !exactKeys(safe, [
      "argv",
      "dirtyTreeDigestSha256",
      "expectedRuntimeClosureSha256",
      "freshnessObservations",
      "outputRootPlan",
      "runIdentity",
      "staticInputs",
    ])
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_pre_preseal_evidence_invalid",
    );
  }
  const input =
    safe as unknown as Nhm2SphericalV2DiagnosticPrePresealStaticClosureEvidenceV2;
  if (
    !nonzeroSha256(input.dirtyTreeDigestSha256) ||
    !nonzeroSha256(input.expectedRuntimeClosureSha256)
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_pre_preseal_evidence_invalid",
    );
  }
  const closure: Nhm2SphericalV2PrePresealStaticClosureV2 = {
    schemaVersion: "nhm2_spherical_boson_star_v2_pre_preseal_static_closure/v1",
    closurePhase: "pre_scientific_preseal",
    preexecutionProfileBinding:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    commandArgvSha256: computeCommandArgvSha256Trusted(input.argv),
    prePresealStaticInputAggregateSha256:
      computePrePresealStaticInputAggregateSha256Trusted(
        input.staticInputs,
        input.runIdentity,
      ),
    prePresealFreshnessInventorySha256:
      computePrePresealFreshnessInventorySha256Trusted(
        input.freshnessObservations,
        input.staticInputs,
        input.runIdentity,
      ),
    dirtyTreeDigestSha256: input.dirtyTreeDigestSha256,
    expectedRuntimeClosureSha256: input.expectedRuntimeClosureSha256,
    outputRootPlan: input.outputRootPlan,
    outputRootPlanSha256: computeOutputRootPlanSha256Trusted(
      input.outputRootPlan,
    ),
  };
  const frozen = deepFreeze(
    trustedCanonicalSnapshot(
      closure,
      "v2_preexecution_profile_v2_pre_preseal_closure_invalid",
    ),
  );
  if (!prePresealStaticClosureValid(frozen)) {
    throw new TypeError(
      "v2_preexecution_profile_v2_pre_preseal_closure_invalid",
    );
  }
  return frozen;
};

const bindingIdentityValid = (value: {
  artifactId: unknown;
  contractVersion: unknown;
  path: unknown;
  mediaType: unknown;
  rawSha256: unknown;
  sizeBytes: unknown;
}): boolean =>
  typeof value.artifactId === "string" &&
  IDENTIFIER.test(value.artifactId) &&
  typeof value.contractVersion === "string" &&
  CONTRACT_VERSION.test(value.contractVersion) &&
  strictAbsolutePath(value.path) &&
  value.mediaType === "application/json" &&
  nonzeroSha256(value.rawSha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  Number(value.sizeBytes) > 0;

const SKELETON_BINDING_EXACT_KEYS = Object.freeze([
  "artifactId",
  "contractVersion",
  "mediaType",
  "path",
  "persistedAt",
  "persistenceReceiptSha256",
  "prePresealStaticClosureSha256",
  "rawSha256",
  "sizeBytes",
  "skeletonFrozenAt",
  "wireSha256",
] as const);

const skeletonBindingValid = (
  value: unknown,
): value is Nhm2SphericalV2DiagnosticSkeletonBindingV2 => {
  if (!exactKeys(value, SKELETON_BINDING_EXACT_KEYS)) {
    return false;
  }
  const binding =
    value as unknown as Nhm2SphericalV2DiagnosticSkeletonBindingV2;
  const frozen = parseUtcNanoseconds(binding.skeletonFrozenAt);
  const persisted = parseUtcNanoseconds(binding.persistedAt);
  return (
    bindingIdentityValid(binding) &&
    binding.artifactId ===
      "nhm2.spherical_boson_star_v2_preexecution_output_skeleton" &&
    binding.contractVersion ===
      "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2" &&
    nonzeroSha256(binding.wireSha256) &&
    nonzeroSha256(binding.persistenceReceiptSha256) &&
    nonzeroSha256(binding.prePresealStaticClosureSha256) &&
    frozen !== null &&
    persisted !== null &&
    frozen < persisted
  );
};

const SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS = Object.freeze([
  "artifactId",
  "boundSkeletonPersistenceReceiptSha256",
  "boundSkeletonRawSha256",
  "boundSkeletonSizeBytes",
  "boundSkeletonWireSha256",
  "contractVersion",
  "createdAt",
  "mediaType",
  "path",
  "persistedAt",
  "presealEnvelopeSha256",
  "rawSha256",
  "sizeBytes",
] as const);

const scientificPresealBindingValid = (
  value: unknown,
): value is Nhm2SphericalV2DiagnosticScientificPresealBindingV2 => {
  if (!exactKeys(value, SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS)) {
    return false;
  }
  const binding =
    value as unknown as Nhm2SphericalV2DiagnosticScientificPresealBindingV2;
  const created = parseUtcNanoseconds(binding.createdAt);
  const persisted = parseUtcNanoseconds(binding.persistedAt);
  return (
    bindingIdentityValid(binding) &&
    nonzeroSha256(binding.presealEnvelopeSha256) &&
    nonzeroSha256(binding.boundSkeletonRawSha256) &&
    nonzeroSha256(binding.boundSkeletonWireSha256) &&
    nonzeroSha256(binding.boundSkeletonPersistenceReceiptSha256) &&
    Number.isSafeInteger(binding.boundSkeletonSizeBytes) &&
    binding.boundSkeletonSizeBytes > 0 &&
    created !== null &&
    persisted !== null &&
    created < persisted
  );
};

const persistenceReceiptBindingValid = (
  value: unknown,
): value is Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2 => {
  if (
    !exactKeys(value, [
      "artifactId",
      "contractVersion",
      "mediaType",
      "path",
      "persistedArtifactRawSha256",
      "persistedArtifactSizeBytes",
      "persistenceObservedAt",
      "rawSha256",
      "receiptSha256",
      "sizeBytes",
    ])
  ) {
    return false;
  }
  const binding =
    value as unknown as Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2;
  return (
    bindingIdentityValid(binding) &&
    nonzeroSha256(binding.receiptSha256) &&
    nonzeroSha256(binding.persistedArtifactRawSha256) &&
    Number.isSafeInteger(binding.persistedArtifactSizeBytes) &&
    binding.persistedArtifactSizeBytes > 0 &&
    parseUtcNanoseconds(binding.persistenceObservedAt) !== null
  );
};

const EXECUTION_FRESHNESS_RECEIPT_BINDING_EXACT_KEYS = Object.freeze([
  "artifactId",
  "contractVersion",
  "executionFreshnessInventorySha256",
  "mediaType",
  "observedAt",
  "path",
  "rawSha256",
  "receiptSha256",
  "sizeBytes",
] as const);

const executionFreshnessReceiptBindingValid = (
  value: unknown,
): value is Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2 => {
  if (!exactKeys(value, EXECUTION_FRESHNESS_RECEIPT_BINDING_EXACT_KEYS)) {
    return false;
  }
  const binding =
    value as unknown as Nhm2SphericalV2DiagnosticExecutionFreshnessReceiptBindingV2;
  return (
    bindingIdentityValid(binding) &&
    binding.artifactId ===
      "nhm2.spherical_boson_star_v2_diagnostic_execution_freshness_receipt" &&
    binding.contractVersion ===
      "nhm2_spherical_boson_star_v2_diagnostic_execution_freshness_receipt/v1" &&
    nonzeroSha256(binding.receiptSha256) &&
    nonzeroSha256(binding.executionFreshnessInventorySha256) &&
    parseUtcNanoseconds(binding.observedAt) !== null
  );
};

const outputRootAbsenceReceiptBindingValid = (
  value: unknown,
): value is Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2 => {
  if (
    !exactKeys(value, [
      "artifactId",
      "contractVersion",
      "mediaType",
      "observedAt",
      "outputRootAbsenceInventorySha256",
      "path",
      "rawSha256",
      "receiptSha256",
      "sizeBytes",
    ])
  ) {
    return false;
  }
  const binding =
    value as unknown as Nhm2SphericalV2DiagnosticOutputRootAbsenceReceiptBindingV2;
  return (
    bindingIdentityValid(binding) &&
    nonzeroSha256(binding.receiptSha256) &&
    nonzeroSha256(binding.outputRootAbsenceInventorySha256) &&
    parseUtcNanoseconds(binding.observedAt) !== null
  );
};

const diagnosticExecutionPresealUnsignedSha256 = (
  value: Readonly<Record<string, unknown>>,
): string => {
  const { diagnosticPresealSha256: ignored, ...unsigned } = value;
  void ignored;
  const bytes = Buffer.from(
    trustedCanonicalJson(
      unsigned,
      "v2_preexecution_profile_v2_trusted_execution_preseal_invalid",
    ),
    "utf8",
  );
  return createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
      "utf8",
    )
    .update(u64le(bytes.length))
    .update(bytes)
    .digest("hex");
};

const deriveDiagnosticPreexecutionPresealEvidenceTrusted = (
  evidence: Nhm2SphericalV2DiagnosticPreexecutionPresealEvidenceV2,
): Readonly<Record<string, unknown>> => {
  const safe = trustedCanonicalSnapshot(
    evidence,
    "v2_preexecution_profile_v2_execution_preseal_evidence_invalid",
  ) as unknown;
  if (
    !exactKeys(safe, [
      "attemptOrdinal",
      "createdMonotonicRawNanoseconds",
      "createdWallUtc",
      "executionFreshnessObservations",
      "executionFreshnessReceiptBinding",
      "outputRootAbsenceInventory",
      "outputRootAbsenceReceiptBinding",
      "prePresealStaticClosure",
      "preexecutionSkeletonBinding",
      "runIdentity",
      "scientificPersistenceReceiptBinding",
      "scientificPresealBinding",
      "staticInputs",
    ])
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_execution_preseal_evidence_invalid",
    );
  }
  const input =
    safe as unknown as Nhm2SphericalV2DiagnosticPreexecutionPresealEvidenceV2;
  if (
    input.attemptOrdinal !== 1 ||
    !u64DecimalValid(input.createdMonotonicRawNanoseconds) ||
    parseUtcNanoseconds(input.createdWallUtc) === null ||
    !runIdentityValid(input.runIdentity) ||
    !prePresealStaticClosureValid(input.prePresealStaticClosure) ||
    !skeletonBindingValid(input.preexecutionSkeletonBinding) ||
    !scientificPresealBindingValid(input.scientificPresealBinding) ||
    !persistenceReceiptBindingValid(
      input.scientificPersistenceReceiptBinding,
    ) ||
    !executionFreshnessReceiptBindingValid(
      input.executionFreshnessReceiptBinding,
    ) ||
    !outputRootAbsenceReceiptBindingValid(input.outputRootAbsenceReceiptBinding)
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_execution_preseal_evidence_invalid",
    );
  }
  const baseAggregate = computePrePresealStaticInputAggregateSha256Trusted(
    input.staticInputs,
    input.runIdentity,
  );
  if (
    baseAggregate !==
    input.prePresealStaticClosure.prePresealStaticInputAggregateSha256
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_base_static_aggregate_drift",
    );
  }
  const prePresealStaticClosureSha256 =
    computePrePresealStaticClosureSha256Trusted(input.prePresealStaticClosure);
  const executionFreshnessInventorySha256 =
    computeExecutionFreshnessInventorySha256Trusted(
      input.executionFreshnessObservations,
      input.staticInputs,
      input.runIdentity,
    );
  const outputRootAbsenceInventorySha256 =
    computeOutputRootAbsenceInventorySha256Trusted(
      input.outputRootAbsenceInventory,
      input.prePresealStaticClosure.outputRootPlan,
    );
  const skeleton = input.preexecutionSkeletonBinding;
  const scientific = input.scientificPresealBinding;
  const scientificReceipt = input.scientificPersistenceReceiptBinding;
  const freshnessReceipt = input.executionFreshnessReceiptBinding;
  const absenceReceipt = input.outputRootAbsenceReceiptBinding;
  const skeletonPersisted = parseUtcNanoseconds(skeleton.persistedAt)!;
  const scientificCreated = parseUtcNanoseconds(scientific.createdAt)!;
  const scientificPersisted = parseUtcNanoseconds(scientific.persistedAt)!;
  const scientificReceiptObserved = parseUtcNanoseconds(
    scientificReceipt.persistenceObservedAt,
  )!;
  const freshnessReceiptObserved = parseUtcNanoseconds(
    freshnessReceipt.observedAt,
  )!;
  const absenceReceiptObserved = parseUtcNanoseconds(
    absenceReceipt.observedAt,
  )!;
  const created = parseUtcNanoseconds(input.createdWallUtc)!;
  const freshnessWallTimes = input.executionFreshnessObservations.map(
    (observation) => parseUtcNanoseconds(observation.observedAtWallUtc)!,
  );
  const earliestFreshnessWall = freshnessWallTimes.reduce((earliest, value) =>
    value < earliest ? value : earliest,
  );
  const latestFreshnessWall = freshnessWallTimes.reduce((latest, value) =>
    value > latest ? value : latest,
  );
  const latestFreshnessMonotonic = input.executionFreshnessObservations.reduce(
    (latest, observation) => {
      const value = BigInt(observation.observedAtMonotonicRawNanoseconds);
      return value > latest ? value : latest;
    },
    0n,
  );
  const earliestAbsenceWall = input.outputRootAbsenceInventory.reduce(
    (earliest, observation) => {
      const value = parseUtcNanoseconds(observation.observedAtWallUtc)!;
      return value < earliest ? value : earliest;
    },
    parseUtcNanoseconds(input.outputRootAbsenceInventory[0].observedAtWallUtc)!,
  );
  const latestAbsenceWall = input.outputRootAbsenceInventory.reduce(
    (latest, observation) => {
      const value = parseUtcNanoseconds(observation.observedAtWallUtc)!;
      return value > latest ? value : latest;
    },
    0n,
  );
  const latestAbsenceMonotonic = input.outputRootAbsenceInventory.reduce(
    (latest, observation) => {
      const value = BigInt(observation.observedAtMonotonicRawNanoseconds);
      return value > latest ? value : latest;
    },
    0n,
  );
  if (
    skeleton.prePresealStaticClosureSha256 !== prePresealStaticClosureSha256 ||
    scientific.boundSkeletonRawSha256 !== skeleton.rawSha256 ||
    scientific.boundSkeletonWireSha256 !== skeleton.wireSha256 ||
    scientific.boundSkeletonSizeBytes !== skeleton.sizeBytes ||
    scientific.boundSkeletonPersistenceReceiptSha256 !==
      skeleton.persistenceReceiptSha256 ||
    scientificReceipt.persistedArtifactRawSha256 !== scientific.rawSha256 ||
    scientificReceipt.persistedArtifactSizeBytes !== scientific.sizeBytes ||
    freshnessReceipt.executionFreshnessInventorySha256 !==
      executionFreshnessInventorySha256 ||
    absenceReceipt.outputRootAbsenceInventorySha256 !==
      outputRootAbsenceInventorySha256 ||
    !(
      skeletonPersisted < scientificCreated &&
      scientificCreated < scientificPersisted &&
      scientificPersisted <= scientificReceiptObserved &&
      scientificReceiptObserved <= earliestFreshnessWall &&
      latestFreshnessWall <= freshnessReceiptObserved &&
      freshnessReceiptObserved < created &&
      scientificReceiptObserved <= earliestAbsenceWall &&
      latestAbsenceWall <= absenceReceiptObserved &&
      absenceReceiptObserved < created
    ) ||
    latestFreshnessMonotonic >= BigInt(input.createdMonotonicRawNanoseconds) ||
    latestAbsenceMonotonic >= BigInt(input.createdMonotonicRawNanoseconds)
  ) {
    throw new TypeError(
      "v2_preexecution_profile_v2_execution_preseal_cross_binding_invalid",
    );
  }
  const preseal: Record<string, unknown> = {
    artifactId: "nhm2.spherical_boson_star_v2_diagnostic_preexecution_preseal",
    schemaVersion:
      "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal/v2",
    phase: "execution_static_closure_after_scientific_preseal",
    attemptOrdinal: 1,
    authorityFalse: true,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.candidateId,
    claimLocks: {
      ...NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
    },
    createdMonotonicRawNanoseconds: input.createdMonotonicRawNanoseconds,
    createdWallUtc: input.createdWallUtc,
    preexecutionSkeletonBinding: skeleton,
    scientificPresealBinding: scientific,
    scientificPersistenceReceiptBinding: scientificReceipt,
    prePresealStaticClosureSha256,
    prePresealStaticInputAggregateSha256: baseAggregate,
    executionFreshnessInventorySha256,
    executionFreshnessReceiptBinding: freshnessReceipt,
    expectedRuntimeClosureSha256:
      input.prePresealStaticClosure.expectedRuntimeClosureSha256,
    outputRootPlanSha256: input.prePresealStaticClosure.outputRootPlanSha256,
    outputRootAbsenceInventorySha256,
    outputRootAbsenceReceiptBinding: absenceReceipt,
    diagnosticPresealSha256: "f".repeat(64),
  };
  preseal.diagnosticPresealSha256 =
    diagnosticExecutionPresealUnsignedSha256(preseal);
  return deepFreeze(
    trustedCanonicalSnapshot(
      preseal,
      "v2_preexecution_profile_v2_execution_preseal_build_invalid",
    ),
  ) as Readonly<Record<string, unknown>>;
};

/**
 * Every exported digest/derivation ingress accepts only a primitive canonical
 * JSON string. The code-unit and UTF-8 ceilings are checked before JSON.parse;
 * no caller-owned object is enumerated at this boundary.
 */
export const computeNhm2SphericalBosonStarV2CommandArgvSha256V2 = (
  argvCanonicalJson: string,
): string =>
  computeCommandArgvSha256Trusted(
    parseBoundedCanonicalJson(
      argvCanonicalJson,
      "v2_preexecution_profile_v2_argv",
    ) as unknown as readonly string[],
  );

export const computeNhm2SphericalBosonStarV2PrePresealStaticInputAggregateSha256 =
  (entriesCanonicalJson: string, runIdentityCanonicalJson: string): string =>
    computePrePresealStaticInputAggregateSha256Trusted(
      parseBoundedCanonicalJson(
        entriesCanonicalJson,
        "v2_preexecution_profile_v2_pre_preseal_static_inventory",
      ) as unknown as readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
      parseBoundedCanonicalJson(
        runIdentityCanonicalJson,
        "v2_preexecution_profile_v2_run_identity",
      ) as unknown as Nhm2SphericalV2RunIdentityV1,
    );

export const computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256 = (
  closureCanonicalJson: string,
): string =>
  computePrePresealStaticClosureSha256Trusted(
    parseBoundedCanonicalJson(
      closureCanonicalJson,
      "v2_preexecution_profile_v2_pre_preseal_static_closure",
    ) as unknown as Nhm2SphericalV2PrePresealStaticClosureV2,
  );

export const computeNhm2SphericalBosonStarV2PrePresealFreshnessInventorySha256 =
  (
    observationsCanonicalJson: string,
    entriesCanonicalJson: string,
    runIdentityCanonicalJson: string,
  ): string =>
    computePrePresealFreshnessInventorySha256Trusted(
      parseBoundedCanonicalJson(
        observationsCanonicalJson,
        "v2_preexecution_profile_v2_pre_preseal_freshness",
      ) as unknown as readonly Nhm2SphericalV2FreshnessObservationV1[],
      parseBoundedCanonicalJson(
        entriesCanonicalJson,
        "v2_preexecution_profile_v2_pre_preseal_static_inventory",
      ) as unknown as readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
      parseBoundedCanonicalJson(
        runIdentityCanonicalJson,
        "v2_preexecution_profile_v2_run_identity",
      ) as unknown as Nhm2SphericalV2RunIdentityV1,
    );

export const computeNhm2SphericalBosonStarV2ExecutionFreshnessInventorySha256 =
  (
    observationsCanonicalJson: string,
    entriesCanonicalJson: string,
    runIdentityCanonicalJson: string,
  ): string =>
    computeExecutionFreshnessInventorySha256Trusted(
      parseBoundedCanonicalJson(
        observationsCanonicalJson,
        "v2_preexecution_profile_v2_execution_freshness",
      ) as unknown as readonly Nhm2SphericalV2DiagnosticTimedFreshnessObservationV2[],
      parseBoundedCanonicalJson(
        entriesCanonicalJson,
        "v2_preexecution_profile_v2_pre_preseal_static_inventory",
      ) as unknown as readonly Nhm2SphericalV2PrePresealStaticInputEntryV2[],
      parseBoundedCanonicalJson(
        runIdentityCanonicalJson,
        "v2_preexecution_profile_v2_run_identity",
      ) as unknown as Nhm2SphericalV2RunIdentityV1,
    );

export const computeNhm2SphericalBosonStarV2OutputRootPlanSha256 = (
  outputRootPlanCanonicalJson: string,
): string =>
  computeOutputRootPlanSha256Trusted(
    parseBoundedCanonicalJson(
      outputRootPlanCanonicalJson,
      "v2_preexecution_profile_v2_output_root_plan",
    ) as unknown as Nhm2SphericalV2OutputRootPlanV2,
  );

export const computeNhm2SphericalBosonStarV2OutputRootAbsenceInventorySha256 = (
  inventoryCanonicalJson: string,
  outputRootPlanCanonicalJson: string,
): string =>
  computeOutputRootAbsenceInventorySha256Trusted(
    parseBoundedCanonicalJson(
      inventoryCanonicalJson,
      "v2_preexecution_profile_v2_output_root_absence_inventory",
    ) as unknown as Nhm2SphericalV2OutputRootAbsenceInventoryV2,
    parseBoundedCanonicalJson(
      outputRootPlanCanonicalJson,
      "v2_preexecution_profile_v2_output_root_plan",
    ) as unknown as Nhm2SphericalV2OutputRootPlanV2,
  );

export const deriveNhm2SphericalBosonStarV2DiagnosticPrePresealStaticClosure = (
  evidenceCanonicalJson: string,
): Nhm2SphericalV2PrePresealStaticClosureV2 =>
  deriveDiagnosticPrePresealStaticClosureTrusted(
    parseBoundedCanonicalJson(
      evidenceCanonicalJson,
      "v2_preexecution_profile_v2_pre_preseal_evidence",
    ) as unknown as Nhm2SphericalV2DiagnosticPrePresealStaticClosureEvidenceV2,
  );

export const deriveNhm2SphericalBosonStarV2DiagnosticPreexecutionPresealEvidenceV2 =
  (evidenceCanonicalJson: string): Readonly<Record<string, unknown>> =>
    deriveDiagnosticPreexecutionPresealEvidenceTrusted(
      parseBoundedCanonicalJson(
        evidenceCanonicalJson,
        "v2_preexecution_profile_v2_execution_preseal_evidence",
      ) as unknown as Nhm2SphericalV2DiagnosticPreexecutionPresealEvidenceV2,
    );

const PRE_PRESEAL_CLOSURE_EXACT_KEYS = Object.freeze([
  "schemaVersion",
  "closurePhase",
  "preexecutionProfileBinding",
  "commandArgvSha256",
  "prePresealStaticInputAggregateSha256",
  "prePresealFreshnessInventorySha256",
  "dirtyTreeDigestSha256",
  "expectedRuntimeClosureSha256",
  "outputRootPlan",
  "outputRootPlanSha256",
] as const);

const DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS = Object.freeze([
  "artifactId",
  "schemaVersion",
  "phase",
  "attemptOrdinal",
  "authorityFalse",
  "candidateId",
  "claimLocks",
  "createdMonotonicRawNanoseconds",
  "createdWallUtc",
  "preexecutionSkeletonBinding",
  "scientificPresealBinding",
  "scientificPersistenceReceiptBinding",
  "prePresealStaticClosureSha256",
  "prePresealStaticInputAggregateSha256",
  "executionFreshnessInventorySha256",
  "executionFreshnessReceiptBinding",
  "expectedRuntimeClosureSha256",
  "outputRootPlanSha256",
  "outputRootAbsenceInventorySha256",
  "outputRootAbsenceReceiptBinding",
  "diagnosticPresealSha256",
] as const);

const PROFILE_V2 = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CONTRACT_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING.candidateId,
  maturity:
    "stage_2_additive_causal_preexecution_schema_without_instances_or_authority",
  predecessorBinding: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING,
  causalPhaseSplit: {
    prePresealClosurePhase: "pre_scientific_preseal",
    executionClosurePhase: "execution_static_closure_after_scientific_preseal",
    prePresealAggregateExcludes: [
      "scientific_preseal",
      "scientific_persistence_receipt",
    ],
    excludedArtifactsBoundSeparatelyLater: true,
    skeletonMustBePersistedBeforeScientificPreseal: true,
    scientificPresealMustBindExactSkeletonRawWireSizeAndPersistenceReceiptSha256: true,
    prePresealStaticClosureDigestCrossBoundIntoSkeletonBinding: true,
    byteLevelAtoSClosureProven: false,
    temporalCycleAllowed: false,
  },
  prePresealStaticInputInventory: {
    exactRoleOrder:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2,
    roleKindRegistry: STATIC_ROLE_KIND_V2,
    repeatableRoles: ["source_file", "source_payload", "shared_object"],
    singletonRolesAppearExactlyOnce: true,
    repeatableRolesAppearAtLeastOnce: true,
    scientificPresealRoleAllowed: false,
    scientificPersistenceReceiptRoleAllowed: false,
    hashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_AGGREGATE_SHA256_DOMAIN,
    hashRecipe:
      "SHA256(domain_utf8||u64le(entryCount)||for_each_entry_in_strict_raw_UTF8_path_order(u64le(canonical_entry_length)||canonical_entry_bytes))",
  },
  prePresealStaticClosureSchema: {
    exactKeys: PRE_PRESEAL_CLOSURE_EXACT_KEYS,
    schemaVersion: "nhm2_spherical_boson_star_v2_pre_preseal_static_closure/v1",
    closurePhase: "pre_scientific_preseal",
    outputRootSurface: "plan_only_without_absence_or_execution_observation",
    hashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_CLOSURE_SHA256_DOMAIN,
    hashRecipe:
      "SHA256(domain_utf8||u64le(canonical_A_length)||canonical_A_bytes)",
    actualRuntimeLoaderObservationAllowed: false,
    scientificPresealOrPersistenceReceiptBindingAllowed: false,
  },
  preexecutionSkeletonBindingSchema: {
    exactKeys: SKELETON_BINDING_EXACT_KEYS,
    contractVersion:
      "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2",
    prePresealStaticClosureSha256Required: true,
    preexecutionSkeletonV2CanonicalWireValidatorImplemented: false,
    byteLevelAtoSClosureProven: false,
    v1SkeletonIdentityAccepted: false,
  },
  outputRootPlanSchema: {
    exactRoleOrder: ["primary", "independent"],
    entryExactKeys: ["absolutePath", "role"],
    observedAbsentFieldAllowed: false,
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_PLAN_SHA256_DOMAIN,
  },
  outputRootAbsenceInventorySchema: {
    occursAfterScientificPresealPersistence: true,
    everyObservationOccursAfterScientificPresealPersistence: true,
    occursBeforeDiagnosticExecutionPresealCreation: true,
    entryExactKeys: [
      "absolutePath",
      "observedAbsent",
      "observedAtMonotonicRawNanoseconds",
      "observedAtWallUtc",
      "role",
    ],
    hashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_OUTPUT_ROOT_ABSENCE_INVENTORY_SHA256_DOMAIN,
    plainDiagnosticObjectsGrantObservationAuthority: false,
  },
  executionFreshnessInventorySchema: {
    observationExactKeys: [
      "observedAtMonotonicRawNanoseconds",
      "observedAtWallUtc",
      "postread",
      "preopen",
      "relativePath",
      "stable",
    ],
    receiptBindingExactKeys: EXECUTION_FRESHNESS_RECEIPT_BINDING_EXACT_KEYS,
    everyObservationOccursAfterScientificPresealPersistence: true,
    exactStatAndContentEqualityWithStaticInputsRequired: true,
    untimedPrePresealObservationReuseAccepted: false,
    callerClaimedDiagnosticEvidenceOnly: true,
    authenticatedObservationAuthority: false,
    hashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_FRESHNESS_INVENTORY_SHA256_DOMAIN,
  },
  scientificPresealBindingSchema: {
    exactKeys: SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS,
    boundSkeletonRawSha256Required: true,
    boundSkeletonWireSha256Required: true,
    boundSkeletonSizeBytesRequired: true,
    boundSkeletonPersistenceReceiptSha256Required: true,
  },
  executionPresealSchema: {
    exactKeys: DIAGNOSTIC_EXECUTION_PRESEAL_EXACT_KEYS,
    schemaVersion:
      "nhm2_spherical_boson_star_v2_diagnostic_preexecution_preseal/v2",
    separatelyBoundArtifacts: [
      "preexecution_skeleton",
      "scientific_preseal",
      "scientific_persistence_receipt",
      "execution_freshness_receipt",
      "output_root_absence_receipt",
    ],
    scientificPresealOrPersistenceReceiptIncludedInBaseAggregate: false,
    baseAggregateRecomputedAndRequiredEqualToSkeletonClosure: true,
    prePresealStaticClosureDigestRecomputedAndBoundIntoExecutionPreseal: true,
    executionFreshnessRecomputedAfterScientificPresealPersistence: true,
    executionFreshnessReceiptIsCallerClaimedDiagnosticOnly: true,
    expectedRuntimeClosureIsNotActualLoaderObservation: true,
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_DIAGNOSTIC_EXECUTION_PRESEAL_SHA256_DOMAIN,
  },
  chronology: {
    exactAcyclicOrder: [
      "freeze_pre_preseal_static_input_bytes_and_output_root_plan",
      "derive_pre_preseal_static_closure_A",
      "future_validate_persist_and_read_back_preexecution_skeleton_v2_declaring_A_digest",
      "create_scientific_preseal_binding_exact_skeleton_raw_wire_size_and_persistence_receipt_sha256",
      "persist_and_read_back_scientific_preseal",
      "rehash_base_static_inputs_with_timed_claimed_freshness_receipt_and_observe_output_root_absence",
      "derive_diagnostic_execution_preseal_binding_skeleton_preseal_and_receipts",
      "future_durable_execution_preseal_publication",
      "future_launch_envelope_creation",
      "future_stopped_exec_runtime_loader_admission",
      "future_execution_release",
    ],
    scientificPresealBeforeDurableSkeletonAllowed: false,
    outputObservationBeforeExecutionAllowed: false,
    actualLoaderEvidenceBeforeStoppedExecAllowed: false,
  },
  diagnosticBoundary: {
    schemaAndPureDigestDerivationOnly: true,
    publicDigestAndDerivationIngress:
      "primitive_prebounded_canonical_JSON_text_only",
    callerOwnedObjectsAcceptedAtPublicHostileBoundary: false,
    codeUnitCapCheckedBeforeUtf8Measurement: true,
    utf8CapCheckedBeforeJsonParse: true,
    parsedTreeValidation: "iterative_and_bounded_inside_the_byte_envelope",
    exactCanonicalReserializationRequired: true,
    issuerExported: false,
    opaqueAuthorityContextExported: false,
    weakSetAuthorityUsed: false,
    validatedInstanceBuilderExported: false,
    plainCallerBindingObjectsGrantAuthority: false,
    callerClaimedExecutionFreshnessReceiptGrantsAuthority: false,
    preexecutionSkeletonV2CanonicalWireValidationImplemented: false,
    byteLevelAtoSClosureProven: false,
    externallyComputedDirtyTreeDigestGrantsAuthority: false,
    expectedRuntimeClosureDigestGrantsLoaderAuthority: false,
  },
  resourceLimits:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_RESOURCE_LIMITS,
  readiness: {
    prePresealStaticInputInstanceReady: false,
    skeletonInstanceReady: false,
    skeletonPersistenceReady: false,
    preexecutionSkeletonV2CanonicalWireValidationReady: false,
    scientificPresealBindingReady: false,
    scientificPresealPersistenceReady: false,
    executionStaticClosureReady: false,
    authenticatedExecutionFreshnessObservationReady: false,
    authenticatedFilesystemObservationReady: false,
    authenticatedOutputRootAbsenceObservationReady: false,
    authenticatedRuntimeLoaderObservationReady: false,
    authenticatedSyscallTraceReady: false,
    launchReady: false,
    executionReady: false,
  },
  instances: {
    prePresealStaticClosure: null,
    preexecutionSkeleton: null,
    skeletonPersistenceReceipt: null,
    preexecutionSkeletonV2CanonicalWireValidationReceipt: null,
    scientificPreseal: null,
    scientificPersistenceReceipt: null,
    executionFreshnessReceipt: null,
    executionPreseal: null,
    executionPresealPublicationReceipt: null,
    launchEnvelope: null,
    runtimeLoaderAdmissionReceipt: null,
    executionReceipt: null,
  },
  blockers: [
    "pre_preseal_static_input_instance_absent",
    "preexecution_skeleton_instance_absent",
    "skeleton_persistence_receipt_absent",
    "preexecution_skeleton_v2_canonical_wire_validator_not_implemented",
    "scientific_preseal_binding_exact_skeleton_instance_absent",
    "scientific_persistence_receipt_absent",
    "source_toolchain_executable_runtime_instances_absent",
    "server_authenticated_filesystem_observer_not_implemented",
    "server_authenticated_freshness_observer_not_implemented",
    "server_authenticated_output_root_absence_observer_not_implemented",
    "server_authenticated_syscall_tracer_not_implemented",
    "server_authenticated_runtime_loader_observer_not_implemented",
    "actual_runtime_loader_path_identity_unobserved",
    "execution_not_authorized",
  ],
  blockerResolutionReceipt: null,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_AUTHORITY_LOCKS,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
  lamps: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_LAMPS,
} as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2 =
  deepFreeze(PROFILE_V2);

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON =
  trustedCanonicalJson(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2,
    "v2_preexecution_profile_v2_trusted_profile_invalid",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_SHA256 =
  "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8";
export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_CANONICAL_SIZE_BYTES = 11_663;

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CONTRACT_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_BINDING.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

export const nhm2SphericalBosonStarV2PreexecutionProfileV2Violations = (
  value: unknown,
): readonly string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2) return [];
  if (typeof value !== "string") {
    return Object.freeze([
      "v2_preexecution_profile_v2_canonical_json_text_required",
    ]);
  }
  let canonical: string;
  try {
    canonical =
      nhm2SphericalBosonStarV2PreexecutionProfileV2CanonicalJson(value);
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "v2_preexecution_profile_v2_surface_invalid",
    ]);
  }
  return Object.freeze([
    canonical ===
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_JSON
      ? "v2_preexecution_profile_v2_external_copy_not_authoritative"
      : "v2_preexecution_profile_v2_semantic_mismatch",
  ]);
};

export const isNhm2SphericalBosonStarV2PreexecutionProfileV2 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2 =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2;

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_EXPECTED_CANONICAL_SIZE_BYTES ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2.includes(
    "scientific_preseal" as never,
  ) ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PRE_PRESEAL_STATIC_INPUT_ROLES_V2.includes(
    "scientific_persistence_receipt" as never,
  ) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_AUTHORITY_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_CLAIM_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_LAMPS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.readiness,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2.instances,
  ).some((value) => value !== null)
) {
  throw new Error(
    "nhm2_spherical_boson_star_v2_preexecution_profile_v2_invariant",
  );
}
