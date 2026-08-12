import { createHash } from "node:crypto";
import { TextDecoder } from "node:util";

import { NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING } from "../../../shared/contracts/nhm2-prolate-boson-star-branch-bvp.v1";
import { NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING } from "../../../shared/contracts/nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import { NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY } from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v3";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed.v1";

export const NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_INTERPRETER_V3_VERSION =
  "nhm2_prolate_boson_star_seed_runtime_instance_interpreter/v3" as const;

export const NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_AUTHORITY_LOCKS_V3 =
  Object.freeze({
    launchApiExposed: false,
    launchAuthorized: false,
    registrationAllowed: false,
    executionAuthorized: false,
    seedAdmissionGranted: false,
    artifactAccepted: false,
    scientificAdmissionGranted: false,
    physicalAuthorityGranted: false,
    propulsionAuthorityGranted: false,
    transportAuthorityGranted: false,
    assistantAnswer: false,
    terminalEligible: false,
    promotionAllowed: false,
  } as const);

export const NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_SUPPORTED_PROFILES_V3 =
  Object.freeze([
    "verifierChannelObservation",
    "assemblerChannelObservation",
  ] as const);

const REGISTRY =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY as unknown as RegistryView;
const STRICT_UTF8 = new TextDecoder("utf-8", { fatal: true });
const SHA256 = /^[0-9a-f]{64}$/;
const OCI_SHA256 = /^sha256:[0-9a-f]{64}$/;
const UNSIGNED_DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const ATTEMPT_ID = /^[0-9a-f]{32}$/;
const SECURE_RESOLUTION_LITERAL =
  "openat2_RESOLVE_BENEATH_NO_SYMLINKS_NO_MAGICLINKS_NO_XDEV";
const CONTROL_BINDING_VERSION = "nhm2.control_plane.domain_hash_binding/v1";
const ROOT_PRESTATE_PATHS = new Set([
  "/run/staging",
  "/run/postprojection-evidence",
  "/run/replay",
  "/run/attestation",
  "/run/output",
]);
const COMPLETE_SEMANTIC_PROFILE_SCHEMA_NAMES = Object.freeze({
  verifierChannelObservation:
    "importedPrimitiveSchemaRegistry.schemas.fileObservation",
  assemblerChannelObservation:
    "importedPrimitiveSchemaRegistry.schemas.fileObservation",
} as const);

type JsonRecord = Record<string, unknown>;
type SchemaNode = Readonly<Record<string, unknown>>;
type FailureCode =
  | "file_size_cap_exceeded"
  | "maximum_depth_exceeded"
  | "maximum_total_nodes_exceeded"
  | "maximum_total_object_keys_exceeded"
  | "maximum_keys_per_object_exceeded"
  | "maximum_array_length_exceeded"
  | "maximum_string_utf8_bytes_exceeded"
  | "maximum_numeric_token_bytes_exceeded"
  | "duplicate_object_key"
  | "invalid_json_token_or_encoding"
  | "negative_zero_forbidden"
  | "raw_bytes_not_equal_recanonicalized_utf8"
  | "secure_file_resolution_or_identity_changed"
  | "declared_observed_size_or_unexpected_eof"
  | "unknown_runtime_profile"
  | "exact_schema_or_union_profile_mismatch"
  | "cross_field_invariant_mismatch"
  | "asserted_instance_binding_mismatch";

export type Nhm2ProlateBosonStarSeedRuntimeInstanceBindingV3 = Readonly<{
  bindingVersion: typeof CONTROL_BINDING_VERSION;
  artifactKind: string;
  sha256Domain: string;
  sha256: string;
  canonicalSizeBytes: number;
}>;

export type Nhm2ProlateBosonStarSeedRuntimeInstanceRejectionReceiptV3 =
  Readonly<{
    schemaVersion: "nhm2_prolate_boson_star_newtonian_seed_v3_runtime_instance_interpretation_rejection/v1";
    successorRunPlanBinding: unknown;
    evidenceSchemaRegistryBinding: unknown;
    runtimeProfile: string;
    attemptedFileObservationOrNull: null;
    attemptedInstanceBindingOrNull: unknown | null;
    declaredByteLengthOrNull: number | null;
    observedByteLengthOrNull: number | null;
    maximumCanonicalUtf8BytesOrNull: number | null;
    failureCode: FailureCode;
    firstJsonPointerOrNull: string | null;
    firstByteOffsetOrNull: number | null;
    canonicalizationCompleted: boolean;
    bindingCreated: false;
    interpretationAccepted: false;
    registrationAllowed: false;
    executionAuthorized: false;
    seedAdmissionGranted: false;
    artifactAccepted: false;
    scientificAdmissionGranted: false;
    physicalAuthorityGranted: false;
    propulsionAuthorityGranted: false;
    transportAuthorityGranted: false;
    allPassed: false;
  }>;

export type Nhm2ProlateBosonStarSeedRuntimeInstanceInterpretationV3 =
  | Readonly<{
      ok: true;
      interpreterVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_INTERPRETER_V3_VERSION;
      runtimeProfile: string;
      schemaName: string;
      canonicalJson: string;
      value: Readonly<JsonRecord>;
      binding: Nhm2ProlateBosonStarSeedRuntimeInstanceBindingV3;
      assertedBindingMatched: boolean | null;
      checks: Readonly<{
        registryCardinalityExact: true;
        profileSchemaBindingDomainExact: true;
        boundedDuplicateAwareTokenizationPassed: true;
        recursiveExactSchemaAndProfileValidationPassed: true;
        crossFieldInvariantsReplayed: true;
        canonicalUtf8Exact: true;
        domainSeparatedBindingRecomputed: true;
        launchOrRegistrationAuthorityGranted: false;
      }>;
      authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_AUTHORITY_LOCKS_V3;
    }>
  | Readonly<{
      ok: false;
      interpreterVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_INTERPRETER_V3_VERSION;
      runtimeProfile: string;
      code: FailureCode;
      issues: readonly string[];
      rejectionReceipt: Nhm2ProlateBosonStarSeedRuntimeInstanceRejectionReceiptV3;
      authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_AUTHORITY_LOCKS_V3;
    }>;

type RegistryView = Readonly<{
  runtimeInstanceResourcePolicy: Readonly<{
    maximumCanonicalUtf8BytesByRuntimeProfile: Readonly<Record<string, number>>;
    tokenizerAndStructureBudgets: Readonly<{
      maximumDepth: number;
      maximumTotalNodes: number;
      maximumTotalObjectKeys: number;
      maximumKeysPerObject: number;
      maximumArrayLength: number;
      maximumUtf8BytesPerString: number;
      maximumNumericTokenBytes: number;
    }>;
  }>;
  domains: Readonly<{
    runtimeInstances: Readonly<Record<string, string>>;
  }>;
  schemas: Readonly<Record<string, unknown>>;
  schemaBindings: Readonly<Record<string, unknown>>;
  bindingProfiles: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  importedPrimitiveSchemaRegistry: Readonly<Record<string, unknown>>;
  importedOutputDescriptorSchema: unknown;
  sealedDependencies: Readonly<Record<string, unknown>>;
}>;

type ProfileResolution = Readonly<{
  runtimeProfile: string;
  schemaName: string;
  schema: SchemaNode;
  schemaBinding: Readonly<JsonRecord>;
  sha256Domain: string;
  maximumCanonicalUtf8Bytes: number;
  stageProfile: unknown | null;
}>;

type ParseCounters = {
  nodes: number;
  objectKeys: number;
};

type SchemaContext = {
  runtimeProfile: string;
  bindingProfileName: string | null;
  tupleIndex: number | null;
  fieldName: string | null;
};

class BoundedJsonFailure extends Error {
  constructor(
    readonly code: FailureCode,
    readonly pointer: string | null,
    readonly byteOffset: number | null,
    message: string,
  ) {
    super(message);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasOwn = (value: JsonRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const readPlainDataRecord = (value: unknown): JsonRecord | null => {
  try {
    if (!isRecord(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) return null;
    const snapshot = Object.create(null) as JsonRecord;
    for (const key of keys as string[]) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      snapshot[key] = descriptor.value;
    }
    return snapshot;
  } catch {
    return null;
  }
};

const pointerSegment = (value: string): string =>
  value.replace(/~/g, "~0").replace(/\//g, "~1");

const isSafeNonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  !Object.is(value, -0);

const isSafePositiveInteger = (value: unknown): value is number =>
  isSafeNonnegativeInteger(value) && value > 0;

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

const canonicalAbsoluteLinuxPath = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value === "/" ||
    value.endsWith("/") ||
    value.includes("\0") ||
    hasUnpairedSurrogate(value)
  ) {
    return false;
  }
  return value
    .slice(1)
    .split("/")
    .every((part) => part.length > 0 && part !== "." && part !== "..");
};

const canonicalRelativePosixPath = (value: unknown): value is string =>
  typeof value === "string" &&
  !value.startsWith("/") &&
  !value.endsWith("/") &&
  value.length > 0 &&
  !value.includes("\0") &&
  value
    .split("/")
    .every((part) => part.length > 0 && part !== "." && part !== "..");

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new Error("noncanonical_number");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    if (hasUnpairedSurrogate(value)) throw new Error("invalid_string");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (!isRecord(value)) throw new Error("non_json_value");
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
};

const canonicalEqual = (left: unknown, right: unknown): boolean => {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
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

class BoundedJsonReader {
  private index = 0;
  private readonly counters: ParseCounters = { nodes: 0, objectKeys: 0 };

  constructor(
    private readonly text: string,
    private readonly budgets: RegistryView["runtimeInstanceResourcePolicy"]["tokenizerAndStructureBudgets"],
  ) {}

  parse(): unknown {
    this.skipWhitespace();
    const value = this.readValue(0, "");
    this.skipWhitespace();
    if (this.index !== this.text.length) {
      this.raise("invalid_json_token_or_encoding", "", "trailing_json_bytes");
    }
    return value;
  }

  private byteOffset(): number {
    return Buffer.byteLength(this.text.slice(0, this.index), "utf8");
  }

  private raise(code: FailureCode, pointer: string, message: string): never {
    throw new BoundedJsonFailure(code, pointer, this.byteOffset(), message);
  }

  private skipWhitespace(): void {
    while (
      this.index < this.text.length &&
      (this.text[this.index] === " " ||
        this.text[this.index] === "\n" ||
        this.text[this.index] === "\r" ||
        this.text[this.index] === "\t")
    ) {
      this.index += 1;
    }
  }

  private accountNode(depth: number, pointer: string): void {
    if (depth > this.budgets.maximumDepth) {
      this.raise("maximum_depth_exceeded", pointer, "maximum_depth_exceeded");
    }
    this.counters.nodes += 1;
    if (this.counters.nodes > this.budgets.maximumTotalNodes) {
      this.raise(
        "maximum_total_nodes_exceeded",
        pointer,
        "maximum_total_nodes_exceeded",
      );
    }
  }

  private readValue(depth: number, pointer: string): unknown {
    this.accountNode(depth, pointer);
    const token = this.text[this.index];
    if (token === "{") return this.readObject(depth, pointer);
    if (token === "[") return this.readArray(depth, pointer);
    if (token === '"') return this.readString(pointer);
    if (token === "t" && this.takeLiteral("true")) return true;
    if (token === "f" && this.takeLiteral("false")) return false;
    if (token === "n" && this.takeLiteral("null")) return null;
    if (token === "-" || (token != null && token >= "0" && token <= "9")) {
      return this.readNumber(pointer);
    }
    this.raise("invalid_json_token_or_encoding", pointer, "invalid_json_value");
  }

  private takeLiteral(literal: string): boolean {
    if (this.text.slice(this.index, this.index + literal.length) !== literal) {
      return false;
    }
    this.index += literal.length;
    return true;
  }

  private readObject(depth: number, pointer: string): JsonRecord {
    this.index += 1;
    this.skipWhitespace();
    const output = Object.create(null) as JsonRecord;
    const keys = new Set<string>();
    let count = 0;
    if (this.text[this.index] === "}") {
      this.index += 1;
      return output;
    }
    for (;;) {
      if (this.counters.objectKeys >= this.budgets.maximumTotalObjectKeys) {
        this.raise(
          "maximum_total_object_keys_exceeded",
          pointer,
          "maximum_total_object_keys_exceeded",
        );
      }
      if (count >= this.budgets.maximumKeysPerObject) {
        this.raise(
          "maximum_keys_per_object_exceeded",
          pointer,
          "maximum_keys_per_object_exceeded",
        );
      }
      if (this.text[this.index] !== '"') {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "object_key_string_required",
        );
      }
      const key = this.readString(pointer);
      count += 1;
      this.counters.objectKeys += 1;
      const childPointer = `${pointer}/${pointerSegment(key)}`;
      if (keys.has(key)) {
        this.raise(
          "duplicate_object_key",
          childPointer,
          "duplicate_object_key",
        );
      }
      keys.add(key);
      this.skipWhitespace();
      if (this.text[this.index] !== ":") {
        this.raise(
          "invalid_json_token_or_encoding",
          childPointer,
          "object_colon_required",
        );
      }
      this.index += 1;
      this.skipWhitespace();
      output[key] = this.readValue(depth + 1, childPointer);
      this.skipWhitespace();
      if (this.text[this.index] === "}") {
        this.index += 1;
        return output;
      }
      if (this.text[this.index] !== ",") {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "object_comma_or_close_required",
        );
      }
      this.index += 1;
      this.skipWhitespace();
    }
  }

  private readArray(depth: number, pointer: string): unknown[] {
    this.index += 1;
    this.skipWhitespace();
    const output: unknown[] = [];
    if (this.text[this.index] === "]") {
      this.index += 1;
      return output;
    }
    for (;;) {
      if (output.length >= this.budgets.maximumArrayLength) {
        this.raise(
          "maximum_array_length_exceeded",
          pointer,
          "maximum_array_length_exceeded",
        );
      }
      output.push(this.readValue(depth + 1, `${pointer}/${output.length}`));
      this.skipWhitespace();
      if (this.text[this.index] === "]") {
        this.index += 1;
        return output;
      }
      if (this.text[this.index] !== ",") {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "array_comma_or_close_required",
        );
      }
      this.index += 1;
      this.skipWhitespace();
    }
  }

  private readString(pointer: string): string {
    this.index += 1;
    let value = "";
    let utf8Bytes = 0;
    const append = (part: string): void => {
      utf8Bytes += Buffer.byteLength(part, "utf8");
      if (utf8Bytes > this.budgets.maximumUtf8BytesPerString) {
        this.raise(
          "maximum_string_utf8_bytes_exceeded",
          pointer,
          "maximum_string_utf8_bytes_exceeded",
        );
      }
      value += part;
    };
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (character === '"') {
        this.index += 1;
        if (hasUnpairedSurrogate(value)) {
          this.raise(
            "invalid_json_token_or_encoding",
            pointer,
            "unpaired_surrogate",
          );
        }
        return value;
      }
      if (character === "\\") {
        this.index += 1;
        const escape = this.text[this.index];
        this.index += 1;
        const simple: Record<string, string> = {
          '"': '"',
          "\\": "\\",
          "/": "/",
          b: "\b",
          f: "\f",
          n: "\n",
          r: "\r",
          t: "\t",
        };
        if (escape === "u") {
          const first = this.readUnicodeEscape(pointer);
          if (first >= 0xd800 && first <= 0xdbff) {
            if (this.text.slice(this.index, this.index + 2) !== "\\u") {
              this.raise(
                "invalid_json_token_or_encoding",
                pointer,
                "unpaired_high_surrogate",
              );
            }
            this.index += 2;
            const second = this.readUnicodeEscape(pointer);
            if (second < 0xdc00 || second > 0xdfff) {
              this.raise(
                "invalid_json_token_or_encoding",
                pointer,
                "unpaired_high_surrogate",
              );
            }
            append(String.fromCharCode(first, second));
          } else if (first >= 0xdc00 && first <= 0xdfff) {
            this.raise(
              "invalid_json_token_or_encoding",
              pointer,
              "unpaired_low_surrogate",
            );
          } else {
            append(String.fromCharCode(first));
          }
          continue;
        }
        if (escape == null || !hasOwn(simple, escape)) {
          this.raise(
            "invalid_json_token_or_encoding",
            pointer,
            "invalid_string_escape",
          );
        }
        append(simple[escape]);
        continue;
      }
      const codePoint = this.text.codePointAt(this.index);
      if (codePoint == null || codePoint < 0x20) {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "unescaped_control_character",
        );
      }
      const part = String.fromCodePoint(codePoint);
      append(part);
      this.index += part.length;
    }
    this.raise(
      "invalid_json_token_or_encoding",
      pointer,
      "unterminated_string",
    );
  }

  private readUnicodeEscape(pointer: string): number {
    const hex = this.text.slice(this.index, this.index + 4);
    if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
      this.raise(
        "invalid_json_token_or_encoding",
        pointer,
        "invalid_unicode_escape",
      );
    }
    this.index += 4;
    return Number.parseInt(hex, 16);
  }

  private readNumber(pointer: string): number {
    const start = this.index;
    const advance = (): void => {
      this.index += 1;
      if (this.index - start > this.budgets.maximumNumericTokenBytes) {
        this.raise(
          "maximum_numeric_token_bytes_exceeded",
          pointer,
          "maximum_numeric_token_bytes_exceeded",
        );
      }
    };
    if (this.text[this.index] === "-") advance();
    if (this.text[this.index] === "0") {
      advance();
      if (/[0-9]/.test(this.text[this.index] ?? "")) {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "leading_zero_forbidden",
        );
      }
    } else if (/[1-9]/.test(this.text[this.index] ?? "")) {
      while (/[0-9]/.test(this.text[this.index] ?? "")) advance();
    } else {
      this.raise(
        "invalid_json_token_or_encoding",
        pointer,
        "numeric_integer_part_required",
      );
    }
    if (this.text[this.index] === ".") {
      advance();
      if (!/[0-9]/.test(this.text[this.index] ?? "")) {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "numeric_fraction_digit_required",
        );
      }
      while (/[0-9]/.test(this.text[this.index] ?? "")) advance();
    }
    if (this.text[this.index] === "e" || this.text[this.index] === "E") {
      advance();
      if (this.text[this.index] === "+" || this.text[this.index] === "-") {
        advance();
      }
      if (!/[0-9]/.test(this.text[this.index] ?? "")) {
        this.raise(
          "invalid_json_token_or_encoding",
          pointer,
          "numeric_exponent_digit_required",
        );
      }
      while (/[0-9]/.test(this.text[this.index] ?? "")) advance();
    }
    const token = this.text.slice(start, this.index);
    const value = Number(token);
    if (!Number.isFinite(value)) {
      this.raise(
        "invalid_json_token_or_encoding",
        pointer,
        "nonfinite_number_forbidden",
      );
    }
    if (Object.is(value, -0)) {
      this.raise("negative_zero_forbidden", pointer, "negative_zero_forbidden");
    }
    return value;
  }
}

const resolvePath = (root: unknown, dottedPath: string): unknown => {
  let current: unknown = root;
  for (const segment of dottedPath.split(".")) {
    if (!isRecord(current) || !hasOwn(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
};

const exactKeySet = (
  value: JsonRecord,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
};

const sha256 = (domain: string, bytes: Uint8Array): string =>
  createHash("sha256").update(domain, "utf8").update(bytes).digest("hex");

const plainSha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const recognizedBinding = (value: unknown): value is JsonRecord => {
  const record = readPlainDataRecord(value);
  if (record == null) return false;
  const keys = Object.keys(record).sort().join(",");
  const accepted = new Set([
    "artifactId,canonicalSizeBytes,contractVersion,sha256,sha256Domain",
    "artifactId,canonicalSizeBytes,registryVersion,sha256,sha256Domain",
    "artifactId,canonicalSizeBytes,schemaVersion,sha256,sha256Domain",
    "artifactKind,bindingVersion,canonicalSizeBytes,sha256,sha256Domain",
  ]);
  if (!accepted.has(keys)) return false;
  return (
    typeof record.sha256Domain === "string" &&
    record.sha256Domain.endsWith("\n") &&
    typeof record.sha256 === "string" &&
    SHA256.test(record.sha256) &&
    isSafeNonnegativeInteger(record.canonicalSizeBytes)
  );
};

const schemaBindingIntegrity = (
  schema: unknown,
  binding: unknown,
): binding is JsonRecord => {
  if (!isRecord(schema) || !recognizedBinding(binding)) return false;
  if (
    typeof schema.artifactId !== "string" ||
    schema.artifactId !== binding.artifactId
  ) {
    return false;
  }
  const version = schema.schemaVersion ?? schema.registryVersion;
  const bindingVersion = binding.schemaVersion ?? binding.registryVersion;
  if (version !== bindingVersion) return false;
  const canonical = Buffer.from(canonicalJson(schema), "utf8");
  return (
    binding.canonicalSizeBytes === canonical.byteLength &&
    binding.sha256 === sha256(String(binding.sha256Domain), canonical)
  );
};

const schemaNameFromBindingPath = (path: string): string | null => {
  const match = /^schemaBindings\.([A-Za-z0-9_]+)$/.exec(path);
  return match?.[1] ?? null;
};

const resolveProfile = (runtimeProfile: string): ProfileResolution | null => {
  const profiles = REGISTRY.bindingProfiles;
  const caps =
    REGISTRY.runtimeInstanceResourcePolicy
      .maximumCanonicalUtf8BytesByRuntimeProfile;
  if (
    Object.keys(REGISTRY.schemas).length !== 41 ||
    Object.keys(profiles).length !== 49 ||
    Object.keys(caps).length !== 49 ||
    !hasOwn(profiles as JsonRecord, runtimeProfile) ||
    !hasOwn(caps as JsonRecord, runtimeProfile)
  ) {
    return null;
  }
  const profile = profiles[runtimeProfile];
  const schemaBindingPath = profile.schemaBinding;
  const domainPath = profile.domain;
  if (typeof schemaBindingPath !== "string" || typeof domainPath !== "string") {
    return null;
  }
  const schemaBinding = resolvePath(REGISTRY, schemaBindingPath);
  const domain = resolvePath(REGISTRY, domainPath);
  const cap = caps[runtimeProfile];
  if (
    !recognizedBinding(schemaBinding) ||
    typeof domain !== "string" ||
    !domain.endsWith("\n") ||
    domain.slice(0, -1).includes("\n") ||
    !isSafePositiveInteger(cap)
  ) {
    return null;
  }

  let schemaName: string;
  let schema: unknown;
  if (typeof profile.schema === "string") {
    schema = resolvePath(REGISTRY, profile.schema);
    schemaName = profile.schema;
    if (schema == null) return null;
    if (
      schemaBindingPath === "sealedDependencies.outputDescriptorSchemaBinding"
    ) {
      if (!schemaBindingIntegrity(schema, schemaBinding)) return null;
    } else {
      if (
        schemaBindingPath !== "importedPrimitiveSchemaRegistry.binding" ||
        profile.schemaBindingSelectsExactPath !==
          profile.schema.replace("importedPrimitiveSchemaRegistry.", "")
      ) {
        return null;
      }
    }
  } else {
    const mappedName = schemaNameFromBindingPath(schemaBindingPath);
    if (mappedName == null) return null;
    schemaName = mappedName;
    schema = REGISTRY.schemas[mappedName];
    if (schema == null || !schemaBindingIntegrity(schema, schemaBinding)) {
      return null;
    }
  }
  const stageProfile =
    typeof profile.stageProfile === "string"
      ? resolvePath(REGISTRY, profile.stageProfile)
      : null;
  if (typeof profile.stageProfile === "string" && stageProfile == null) {
    return null;
  }
  return Object.freeze({
    runtimeProfile,
    schemaName,
    schema: schema as SchemaNode,
    schemaBinding,
    sha256Domain: domain,
    maximumCanonicalUtf8Bytes: cap,
    stageProfile,
  });
};

const authoritativeValues: Readonly<Record<string, unknown>> = Object.freeze({
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
});

const literalDescriptor = (descriptor: string): unknown | undefined => {
  if (descriptor === "literal_true") return true;
  if (descriptor === "literal_false") return false;
  if (descriptor === "literal_null") return null;
  const integer = /^literal_([0-9]+)$/.exec(descriptor);
  if (integer != null) return Number(integer[1]);
  if (descriptor.startsWith("literal_/")) return descriptor.slice(8);
  if (
    descriptor.startsWith("literal_nhm2") ||
    descriptor === "literal_CLOCK_MONOTONIC_RAW" ||
    descriptor === "literal_untrusted_seed_producer" ||
    descriptor === "literal_trusted_independent_verifier" ||
    descriptor === "literal_trusted_descriptor_assembler" ||
    descriptor === "literal_producer" ||
    descriptor === "literal_verifier" ||
    descriptor === "literal_directory" ||
    descriptor === `literal_${SECURE_RESOLUTION_LITERAL}`
  ) {
    return descriptor.slice(8);
  }
  return undefined;
};

const numberConstraintSatisfied = (
  constraint: unknown,
  value: number,
): boolean => {
  if (constraint == null || constraint === "") return true;
  if (constraint === "value>0") return value > 0;
  if (constraint === "value>=0") return value >= 0;
  if (constraint === "value<0") return value < 0;
  if (constraint === "0<value<1") return value > 0 && value < 1;
  if (constraint === "-1/2<value<0") return value > -0.5 && value < 0;
  if (constraint === "0<value<32/33") return value > 0 && value < 32 / 33;
  if (constraint === "0<=value<1") return value >= 0 && value < 1;
  const upper = /^0<=value<=([0-9]+(?:e-[0-9]+)?)$/.exec(String(constraint));
  if (upper != null) return value >= 0 && value <= Number(upper[1]);
  if (constraint === "0<=value<=2^-30") {
    return value >= 0 && value <= 2 ** -30;
  }
  return false;
};

const integerConstraintSatisfied = (
  constraint: unknown,
  value: number,
): boolean => {
  if (constraint == null || constraint === "") return true;
  if (constraint === "value>0" || constraint === "value>=1") return value > 0;
  if (constraint === "value>=0") return value >= 0;
  const range = /^([0-9]+)<=value<=([0-9]+)$/.exec(String(constraint));
  return range != null
    ? value >= Number(range[1]) && value <= Number(range[2])
    : false;
};

const primitiveSatisfied = (
  source: unknown,
  value: unknown,
  context: SchemaContext,
): boolean => {
  switch (source) {
    case "canonicalAbsoluteLinuxPath":
      return canonicalAbsoluteLinuxPath(value);
    case "canonicalUnsignedDecimal":
      return typeof value === "string" && UNSIGNED_DECIMAL.test(value);
    case "lowercaseSha256":
      return typeof value === "string" && SHA256.test(value);
    case "ociSha256Digest":
      return typeof value === "string" && OCI_SHA256.test(value);
    case "safeNonnegativeInteger":
      return isSafeNonnegativeInteger(value);
    case "safePositiveInteger":
      return isSafePositiveInteger(value);
    default:
      return false;
  }
};

const validateDescriptorString = (
  descriptor: string,
  value: unknown,
  path: string,
  context: SchemaContext,
  issues: string[],
): void => {
  const literal = literalDescriptor(descriptor);
  if (literal !== undefined) {
    if (!canonicalEqual(value, literal))
      issues.push(`${path}:literal_mismatch`);
    return;
  }
  if (
    descriptor === "canonical_unsigned_decimal" ||
    descriptor === "canonical_unsigned_decimal_string"
  ) {
    if (typeof value !== "string" || !UNSIGNED_DECIMAL.test(value)) {
      issues.push(`${path}:canonical_unsigned_decimal_required`);
    }
    return;
  }
  if (descriptor === "safe_positive_integer") {
    if (!isSafePositiveInteger(value))
      issues.push(`${path}:safe_positive_integer_required`);
    return;
  }
  if (
    descriptor.includes("safe_nonnegative_integer") ||
    descriptor === "safeNonnegativeInteger"
  ) {
    if (!isSafeNonnegativeInteger(value))
      issues.push(`${path}:safe_nonnegative_integer_required`);
    return;
  }
  if (descriptor === "nullableSafeInteger") {
    if (value !== null && !isSafeNonnegativeInteger(value)) {
      issues.push(`${path}:nullable_safe_integer_required`);
    }
    return;
  }
  if (descriptor === "exactBoolean") {
    if (typeof value !== "boolean") issues.push(`${path}:boolean_required`);
    return;
  }
  if (descriptor === "controlPlaneBinding") {
    if (!recognizedBinding(value))
      issues.push(`${path}:control_binding_required`);
    return;
  }
  if (descriptor === "exact_128_bit_lowercase_hex_attempt_identifier") {
    if (typeof value !== "string" || !ATTEMPT_ID.test(value)) {
      issues.push(`${path}:attempt_identifier_required`);
    }
    return;
  }
  if (descriptor === "one_exact_five-root_profile_path") {
    if (typeof value !== "string" || !ROOT_PRESTATE_PATHS.has(value)) {
      issues.push(`${path}:five_root_path_required`);
    }
    return;
  }
  if (descriptor === "exact_4_digit_octal_directory_mode") {
    if (typeof value !== "string" || !/^0[0-7]{3}$/.test(value)) {
      issues.push(`${path}:four_digit_octal_mode_required`);
    }
    return;
  }
  if (
    descriptor.startsWith("plain_SHA256") ||
    descriptor.includes("64_lowercase_hex_SHA256")
  ) {
    if (typeof value !== "string" || !SHA256.test(value)) {
      issues.push(`${path}:lowercase_sha256_required`);
    }
    return;
  }
  if (descriptor.includes("canonical_relative_POSIX_path")) {
    if (!canonicalRelativePosixPath(value)) {
      issues.push(`${path}:canonical_relative_path_required`);
    }
    return;
  }
  if (
    descriptor.includes("nonempty_UTF8") ||
    descriptor.includes("nonempty_exact_version")
  ) {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.includes("\0")
    ) {
      issues.push(`${path}:nonempty_string_required`);
    }
    return;
  }
  if (
    descriptor.includes("value_valid_against_v3_") ||
    descriptor.includes("value_valid_against_v3")
  ) {
    issues.push(
      `${path}:unsupported_semantics:unresolved_exact_v3_schema_selector`,
    );
    return;
  }
  if (descriptor.includes("importedV2.schemas.fileObservation")) {
    const schema = resolvePath(
      REGISTRY,
      "importedPrimitiveSchemaRegistry.schemas.fileObservation",
    );
    validateSchemaNode(schema, value, path, context, issues);
    return;
  }
  if (
    descriptor.includes("binding") ||
    /Binding(?:OrNull)?$/.test(context.fieldName ?? "")
  ) {
    if (descriptor.includes("null") && value === null) return;
    if (!recognizedBinding(value))
      issues.push(`${path}:recognized_binding_required`);
    return;
  }
  if (descriptor.includes("null") && value === null) return;
  if (
    descriptor.includes("literal_true_iff") ||
    descriptor.includes("literal_true_only") ||
    /(?:Passed|Allowed|Eligible|Present|Stable|Used|Empty|Authorized|Granted|Accepted)$/.test(
      context.fieldName ?? "",
    )
  ) {
    if (typeof value !== "boolean") issues.push(`${path}:boolean_required`);
    return;
  }
  if (/Nanoseconds$/.test(context.fieldName ?? "")) {
    if (typeof value !== "string" || !UNSIGNED_DECIMAL.test(value)) {
      issues.push(`${path}:canonical_unsigned_decimal_required`);
    }
    return;
  }
  if (/(?:Count|Length|Index|Ordinal)$/.test(context.fieldName ?? "")) {
    if (!isSafeNonnegativeInteger(value))
      issues.push(`${path}:safe_integer_required`);
    return;
  }
  if (/Sha256$/.test(context.fieldName ?? "")) {
    if (typeof value !== "string" || !SHA256.test(value)) {
      issues.push(`${path}:lowercase_sha256_required`);
    }
    return;
  }
  if (/AbsolutePath$/.test(context.fieldName ?? "")) {
    if (!canonicalAbsoluteLinuxPath(value))
      issues.push(`${path}:absolute_path_required`);
    return;
  }
  if (descriptor.startsWith("literal_")) {
    issues.push(`${path}:unsupported_literal_descriptor:${descriptor}`);
    return;
  }
  issues.push(`${path}:unsupported_semantics:${descriptor}`);
};

const selectedProfile = (
  mapName: string,
  profiles: JsonRecord,
  record: JsonRecord,
): JsonRecord | null => {
  let key: unknown;
  if (mapName === "stageProfiles") {
    key = record.stageId;
    if (key === "untrusted_seed_producer") key = "producer";
    if (key === "trusted_independent_verifier") key = "verifier";
  } else if (mapName === "dispositionProfiles") {
    key = record.disposition;
  } else if (mapName === "wrapperDispositionProfiles") {
    key = record.wrapperDisposition;
  } else if (mapName === "outcomeProfiles") {
    key =
      record.outcome ??
      record.validatedCompositeOutcome ??
      record.compositeOutcome;
  } else {
    return null;
  }
  return typeof key === "string" && isRecord(profiles[key])
    ? (profiles[key] as JsonRecord)
    : null;
};

const validateProfileMaps = (
  node: JsonRecord,
  record: JsonRecord,
  path: string,
  context: SchemaContext,
  issues: string[],
): void => {
  for (const mapName of [
    "stageProfiles",
    "dispositionProfiles",
    "wrapperDispositionProfiles",
    "outcomeProfiles",
  ]) {
    const profiles = node[mapName];
    if (!isRecord(profiles)) continue;
    const profile = selectedProfile(mapName, profiles, record);
    if (profile == null) {
      issues.push(`${path}:unrecognized_${mapName}`);
      continue;
    }
    for (const [field, expected] of Object.entries(profile)) {
      if (!hasOwn(record, field)) continue;
      const fieldPath = `${path}/${pointerSegment(field)}`;
      if (
        expected === null ||
        typeof expected === "boolean" ||
        typeof expected === "number" ||
        Array.isArray(expected)
      ) {
        if (!canonicalEqual(record[field], expected)) {
          issues.push(`${fieldPath}:${mapName}_literal_mismatch`);
        }
      } else if (typeof expected === "string") {
        if (expected === "non-null" || expected.startsWith("non-null_")) {
          if (record[field] == null)
            issues.push(`${fieldPath}:non_null_required`);
        } else {
          validateDescriptorString(
            expected,
            record[field],
            fieldPath,
            { ...context, fieldName: field },
            issues,
          );
        }
      }
    }
  }
};

const validateTuple = (
  node: JsonRecord,
  value: unknown,
  path: string,
  context: SchemaContext,
  issues: string[],
): void => {
  if (!Array.isArray(value)) {
    issues.push(`${path}:tuple_required`);
    return;
  }
  if (
    isSafeNonnegativeInteger(node.exactLength) &&
    value.length !== node.exactLength
  ) {
    issues.push(`${path}:exact_tuple_length_mismatch`);
    return;
  }
  if (
    isSafeNonnegativeInteger(node.minimumLength) &&
    value.length < node.minimumLength
  ) {
    issues.push(`${path}:minimum_tuple_length_mismatch`);
    return;
  }
  if (
    isSafeNonnegativeInteger(node.maximumLength) &&
    value.length > node.maximumLength
  ) {
    issues.push(`${path}:maximum_tuple_length_mismatch`);
    return;
  }
  const itemSchema = node.itemSchema;
  const itemFields = node.itemFields;
  const itemExactKeys = node.itemExactKeys;
  for (let index = 0; index < value.length; index += 1) {
    const itemPath = `${path}/${index}`;
    const itemContext = { ...context, tupleIndex: index, fieldName: null };
    if (itemSchema != null) {
      validateSchemaNode(
        itemSchema,
        value[index],
        itemPath,
        itemContext,
        issues,
      );
    } else if (isRecord(itemFields) && Array.isArray(itemExactKeys)) {
      validateSchemaNode(
        {
          kind: "object",
          exactKeys: itemExactKeys,
          extraKeysAllowed: false,
          fields: itemFields,
        },
        value[index],
        itemPath,
        itemContext,
        issues,
      );
    }
  }
  for (const [orderKey, itemKey] of [
    ["exactAbsoluteRootPathOrder", "absoluteRootPath"],
    ["exactAbsolutePathOrder", "absolutePath"],
    ["exactPointerOrder", "pointer"],
  ] as const) {
    const order = node[orderKey];
    if (!Array.isArray(order) || order.length !== value.length) continue;
    value.forEach((item, index) => {
      if (!isRecord(item) || item[itemKey] !== order[index]) {
        issues.push(`${path}/${index}/${itemKey}:exact_order_mismatch`);
      }
    });
  }
  const expectations = node.exactEntryExpectations;
  if (Array.isArray(expectations) && expectations.length === value.length) {
    expectations.forEach((expected, index) => {
      if (!isRecord(expected) || !isRecord(value[index])) return;
      for (const [key, expectedValue] of Object.entries(expected)) {
        if (!canonicalEqual((value[index] as JsonRecord)[key], expectedValue)) {
          issues.push(
            `${path}/${index}/${pointerSegment(key)}:entry_expectation_mismatch`,
          );
        }
      }
    });
  }
};

const validateSchemaNode = (
  rawNode: unknown,
  value: unknown,
  path: string,
  context: SchemaContext,
  issues: string[],
): void => {
  if (issues.length >= 64) return;
  if (typeof rawNode === "string") {
    validateDescriptorString(rawNode, value, path, context, issues);
    return;
  }
  if (
    rawNode === null ||
    typeof rawNode === "boolean" ||
    typeof rawNode === "number" ||
    Array.isArray(rawNode)
  ) {
    if (!canonicalEqual(value, rawNode))
      issues.push(`${path}:literal_mismatch`);
    return;
  }
  if (!isRecord(rawNode)) {
    issues.push(`${path}:registered_schema_node_missing`);
    return;
  }
  if (isRecord(rawNode.topLevel)) {
    validateSchemaNode(rawNode.topLevel, value, path, context, issues);
    return;
  }
  const kind = rawNode.kind;
  if (kind === "object") {
    if (!isRecord(value) || !Array.isArray(rawNode.exactKeys)) {
      issues.push(`${path}:exact_object_required`);
      return;
    }
    const exactKeys = rawNode.exactKeys.filter(
      (entry): entry is string => typeof entry === "string",
    );
    if (
      exactKeys.length !== rawNode.exactKeys.length ||
      !exactKeySet(value, exactKeys)
    ) {
      issues.push(`${path}:exact_object_surface_mismatch`);
      return;
    }
    if (!isRecord(rawNode.fields)) {
      issues.push(`${path}:registered_fields_missing`);
      return;
    }
    for (const key of exactKeys) {
      if (!hasOwn(rawNode.fields, key)) {
        issues.push(`${path}/${pointerSegment(key)}:registered_field_missing`);
        continue;
      }
      validateSchemaNode(
        rawNode.fields[key],
        value[key],
        `${path}/${pointerSegment(key)}`,
        { ...context, fieldName: key },
        issues,
      );
    }
    validateProfileMaps(rawNode, value, path, context, issues);
    return;
  }
  if (kind === "tuple" || kind === "exact_named_binding_tuple") {
    validateTuple(rawNode, value, path, context, issues);
    return;
  }
  if (kind === "literal") {
    if (!canonicalEqual(value, rawNode.value))
      issues.push(`${path}:literal_mismatch`);
    return;
  }
  if (kind === "primitive") {
    if (!primitiveSatisfied(rawNode.source, value, context)) {
      issues.push(`${path}:primitive_mismatch:${String(rawNode.source)}`);
    }
    return;
  }
  if (kind === "nonempty_string") {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.includes("\0")
    ) {
      issues.push(`${path}:nonempty_string_required`);
    }
    return;
  }
  if (kind === "string") {
    if (typeof value !== "string") {
      issues.push(`${path}:string_required`);
    } else if (
      typeof rawNode.exactPattern === "string" &&
      !new RegExp(rawNode.exactPattern).test(value)
    ) {
      issues.push(`${path}:string_pattern_mismatch`);
    }
    return;
  }
  if (kind === "safe_integer") {
    if (
      !isSafeNonnegativeInteger(value) ||
      !integerConstraintSatisfied(rawNode.constraint, value)
    ) {
      issues.push(`${path}:safe_integer_constraint_mismatch`);
    }
    return;
  }
  if (kind === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      Object.is(value, -0) ||
      !numberConstraintSatisfied(rawNode.constraint, value)
    ) {
      issues.push(`${path}:number_constraint_mismatch`);
    }
    return;
  }
  if (kind === "enum") {
    if (
      !Array.isArray(rawNode.values) ||
      !rawNode.values.some((entry) => canonicalEqual(entry, value))
    ) {
      issues.push(`${path}:enum_mismatch`);
    }
    return;
  }
  if (kind === "literal_tuple") {
    if (!canonicalEqual(value, rawNode.value))
      issues.push(`${path}:literal_tuple_mismatch`);
    return;
  }
  if (
    kind === "authoritative_literal_binding" ||
    kind === "authoritative_literal_tuple"
  ) {
    const expected =
      typeof rawNode.source === "string"
        ? authoritativeValues[rawNode.source]
        : undefined;
    if (expected === undefined || !canonicalEqual(value, expected)) {
      issues.push(`${path}:authoritative_literal_mismatch`);
    }
    return;
  }
  if (kind === "literal_object") {
    const expected =
      typeof rawNode.exactValueSource === "string"
        ? authoritativeValues[rawNode.exactValueSource]
        : undefined;
    if (expected === undefined || !canonicalEqual(value, expected)) {
      issues.push(`${path}:literal_object_mismatch`);
    }
    return;
  }
  if (kind === "literal_by_inventory_index") {
    const index = context.tupleIndex;
    const field = context.fieldName;
    const inventory =
      index == null
        ? undefined
        : NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY[
            index
          ];
    if (
      inventory == null ||
      field == null ||
      !canonicalEqual(value, (inventory as JsonRecord)[field])
    ) {
      issues.push(`${path}:inventory_literal_mismatch`);
    }
    return;
  }
  if (kind === "binding_profile") {
    const profileName =
      typeof rawNode.profile === "string" ? rawNode.profile : null;
    const v1 =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY;
    const profile =
      profileName == null
        ? undefined
        : v1.artifactBindingProfiles[
            profileName as keyof typeof v1.artifactBindingProfiles
          ];
    const domain =
      profileName == null
        ? undefined
        : v1.domains[profileName as keyof typeof v1.domains];
    if (
      !recognizedBinding(value) ||
      value.bindingVersion !== CONTROL_BINDING_VERSION ||
      value.artifactKind !== profile?.artifactKind ||
      value.sha256Domain !== domain
    ) {
      issues.push(`${path}:binding_profile_mismatch`);
    }
    return;
  }
  if (kind === "registered_enum_by_referencing_schema") {
    if (value !== context.bindingProfileName) {
      issues.push(`${path}:registered_artifact_kind_mismatch`);
    }
    return;
  }
  if (kind === "literal_domain_by_referencing_schema") {
    const v1 =
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY;
    const expected =
      context.bindingProfileName == null
        ? undefined
        : v1.domains[context.bindingProfileName as keyof typeof v1.domains];
    if (value !== expected) issues.push(`${path}:registered_domain_mismatch`);
    return;
  }
  issues.push(`${path}:unsupported_registered_schema_kind:${String(kind)}`);
};

const replayCrossFieldInvariants = (
  resolution: ProfileResolution,
  value: JsonRecord,
): string[] => {
  const issues: string[] = [];
  const expectedSchemaName =
    COMPLETE_SEMANTIC_PROFILE_SCHEMA_NAMES[
      resolution.runtimeProfile as keyof typeof COMPLETE_SEMANTIC_PROFILE_SCHEMA_NAMES
    ];
  if (expectedSchemaName !== resolution.schemaName) {
    issues.push(
      `/:unsupported_semantics:runtime_profile_${resolution.runtimeProfile}_has_no_complete_executable_cross_field_policy`,
    );
  }
  const schemaSurface = isRecord(resolution.schema.topLevel)
    ? resolution.schema.topLevel
    : resolution.schema;
  const registeredInvariants = schemaSurface.crossFieldInvariants;
  if (
    expectedSchemaName != null &&
    Array.isArray(registeredInvariants) &&
    registeredInvariants.length > 0
  ) {
    issues.push(
      `/:unsupported_semantics:${registeredInvariants.length}_registered_cross_field_invariants_not_replayed`,
    );
  }
  const schemaName = schemaNameFromBindingPath(
    String(REGISTRY.bindingProfiles[resolution.runtimeProfile].schemaBinding),
  );
  if (schemaName === "rootPrestateReceipt") {
    const schema = REGISTRY.schemas.rootPrestateReceipt as JsonRecord;
    const policy = schema.listingHashPolicy as JsonRecord;
    const domain = String(policy.domain);
    const expected = plainSha256(
      Buffer.concat([Buffer.from(domain, "utf8"), Buffer.alloc(8)]),
    );
    if (
      value.recursiveEntryCount !== 0 ||
      value.empty !== true ||
      value.listingSha256 !== expected
    ) {
      issues.push("/:empty_root_listing_invariant_mismatch");
    }
  }
  return issues;
};

const snapshotAttemptedBinding = (value: unknown): unknown | null => {
  const record = readPlainDataRecord(value);
  if (record == null) return null;
  const snapshot = Object.create(null) as JsonRecord;
  for (const [key, entry] of Object.entries(record)) {
    if (
      entry !== null &&
      typeof entry !== "string" &&
      typeof entry !== "number" &&
      typeof entry !== "boolean"
    ) {
      return null;
    }
    if (
      typeof entry === "number" &&
      (!Number.isFinite(entry) || Object.is(entry, -0))
    ) {
      return null;
    }
    snapshot[key] = entry;
  }
  return deepFreeze(snapshot);
};

const postCanonicalFailure = (code: FailureCode): boolean =>
  code === "raw_bytes_not_equal_recanonicalized_utf8" ||
  code === "exact_schema_or_union_profile_mismatch" ||
  code === "cross_field_invariant_mismatch" ||
  code === "asserted_instance_binding_mismatch";

const reject = (
  runtimeProfile: string,
  code: FailureCode,
  issues: readonly string[],
  options: Readonly<{
    attemptedBinding?: unknown;
    declaredByteLength?: number | null;
    observedByteLength?: number | null;
    cap?: number | null;
    pointer?: string | null;
    byteOffset?: number | null;
  }> = {},
): Extract<
  Nhm2ProlateBosonStarSeedRuntimeInstanceInterpretationV3,
  { ok: false }
> => {
  const receipt = Object.freeze({
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_runtime_instance_interpretation_rejection/v1" as const,
    successorRunPlanBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
    evidenceSchemaRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
    runtimeProfile,
    attemptedFileObservationOrNull: null,
    attemptedInstanceBindingOrNull:
      code === "unknown_runtime_profile"
        ? null
        : snapshotAttemptedBinding(options.attemptedBinding),
    declaredByteLengthOrNull:
      code === "unknown_runtime_profile"
        ? null
        : (options.declaredByteLength ?? null),
    observedByteLengthOrNull:
      code === "unknown_runtime_profile"
        ? null
        : (options.observedByteLength ?? null),
    maximumCanonicalUtf8BytesOrNull:
      code === "unknown_runtime_profile" ? null : (options.cap ?? null),
    failureCode: code,
    firstJsonPointerOrNull: options.pointer ?? null,
    firstByteOffsetOrNull: options.byteOffset ?? null,
    canonicalizationCompleted: postCanonicalFailure(code),
    bindingCreated: false as const,
    interpretationAccepted: false as const,
    registrationAllowed: false as const,
    executionAuthorized: false as const,
    seedAdmissionGranted: false as const,
    artifactAccepted: false as const,
    scientificAdmissionGranted: false as const,
    physicalAuthorityGranted: false as const,
    propulsionAuthorityGranted: false as const,
    transportAuthorityGranted: false as const,
    allPassed: false as const,
  });
  return Object.freeze({
    ok: false,
    interpreterVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_INTERPRETER_V3_VERSION,
    runtimeProfile,
    code,
    issues: Object.freeze([...issues]),
    rejectionReceipt: receipt,
    authorityLocks:
      NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_AUTHORITY_LOCKS_V3,
  });
};

const computeNhm2ProlateBosonStarSeedRuntimeInstanceBindingV3 = (
  runtimeProfile: string,
  canonicalUtf8Bytes: Uint8Array,
): Nhm2ProlateBosonStarSeedRuntimeInstanceBindingV3 | null => {
  const resolution = resolveProfile(runtimeProfile);
  if (resolution == null || !(canonicalUtf8Bytes instanceof Uint8Array))
    return null;
  const bytes = Buffer.from(canonicalUtf8Bytes);
  return Object.freeze({
    bindingVersion: CONTROL_BINDING_VERSION,
    artifactKind: runtimeProfile,
    sha256Domain: resolution.sha256Domain,
    sha256: sha256(resolution.sha256Domain, bytes),
    canonicalSizeBytes: bytes.byteLength,
  });
};

const assertedBindingMatches = (
  asserted: unknown,
  expected: Nhm2ProlateBosonStarSeedRuntimeInstanceBindingV3,
): boolean => {
  const snapshot = snapshotAttemptedBinding(asserted);
  return (
    isRecord(snapshot) &&
    exactKeySet(snapshot, [
      "bindingVersion",
      "artifactKind",
      "sha256Domain",
      "sha256",
      "canonicalSizeBytes",
    ]) &&
    canonicalEqual(snapshot, expected)
  );
};

/**
 * Interprets one byte snapshot supplied by an already-isolated, separately
 * attested reader. This function neither reads a path nor constitutes file,
 * launch, registration, or execution authority. Parsing is duplicate-aware
 * and bounded and does not use the platform's generic JSON object parser.
 */
export const interpretNhm2ProlateBosonStarSeedRuntimeInstanceV3 = (
  runtimeProfile: string,
  canonicalUtf8Bytes: Uint8Array,
  assertedInstanceBinding: unknown = null,
): Nhm2ProlateBosonStarSeedRuntimeInstanceInterpretationV3 => {
  const resolution = resolveProfile(runtimeProfile);
  if (resolution == null) {
    return reject(runtimeProfile, "unknown_runtime_profile", [
      "runtime_profile_not_in_exact_sealed_registry",
    ]);
  }
  const cap = resolution.maximumCanonicalUtf8Bytes;
  let isUint8Array = false;
  try {
    isUint8Array = canonicalUtf8Bytes instanceof Uint8Array;
  } catch {
    isUint8Array = false;
  }
  if (!isUint8Array) {
    return reject(
      runtimeProfile,
      "invalid_json_token_or_encoding",
      ["uint8_array_required"],
      {
        attemptedBinding: assertedInstanceBinding,
        cap,
      },
    );
  }
  let sourceByteLength: number;
  try {
    sourceByteLength = canonicalUtf8Bytes.byteLength;
  } catch {
    return reject(
      runtimeProfile,
      "invalid_json_token_or_encoding",
      ["byte_length_unavailable"],
      {
        attemptedBinding: assertedInstanceBinding,
        cap,
      },
    );
  }
  if (sourceByteLength > cap) {
    return reject(
      runtimeProfile,
      "file_size_cap_exceeded",
      [`maximum_canonical_utf8_bytes:${cap}`],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: sourceByteLength,
        observedByteLength: Math.min(sourceByteLength, cap + 1),
        cap,
        byteOffset: cap,
      },
    );
  }
  let bytes: Buffer;
  try {
    bytes = Buffer.from(canonicalUtf8Bytes);
  } catch {
    return reject(
      runtimeProfile,
      "invalid_json_token_or_encoding",
      ["byte_snapshot_failed"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: sourceByteLength,
        observedByteLength: null,
        cap,
      },
    );
  }
  let text: string;
  try {
    text = STRICT_UTF8.decode(bytes);
  } catch {
    return reject(
      runtimeProfile,
      "invalid_json_token_or_encoding",
      ["strict_utf8_decode_failed"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
      },
    );
  }
  let parsed: unknown;
  try {
    parsed = new BoundedJsonReader(
      text,
      REGISTRY.runtimeInstanceResourcePolicy.tokenizerAndStructureBudgets,
    ).parse();
  } catch (error) {
    if (error instanceof BoundedJsonFailure) {
      return reject(runtimeProfile, error.code, [error.message], {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
        pointer: error.pointer,
        byteOffset: error.byteOffset,
      });
    }
    return reject(
      runtimeProfile,
      "invalid_json_token_or_encoding",
      ["bounded_tokenizer_failed"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
      },
    );
  }
  const recanonicalized = canonicalJson(parsed);
  if (!Buffer.from(recanonicalized, "utf8").equals(bytes)) {
    return reject(
      runtimeProfile,
      "raw_bytes_not_equal_recanonicalized_utf8",
      ["raw_bytes_must_equal_recanonicalized_utf8"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
      },
    );
  }
  if (!isRecord(parsed)) {
    return reject(
      runtimeProfile,
      "exact_schema_or_union_profile_mismatch",
      ["/:object_required"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
        pointer: "",
      },
    );
  }
  const schemaIssues: string[] = [];
  validateSchemaNode(
    resolution.schema,
    parsed,
    "",
    {
      runtimeProfile,
      bindingProfileName: runtimeProfile,
      tupleIndex: null,
      fieldName: null,
    },
    schemaIssues,
  );
  const concreteSchemaIssues = schemaIssues.filter(
    (issue) => !issue.includes(":unsupported_semantics:"),
  );
  if (concreteSchemaIssues.length > 0) {
    return reject(
      runtimeProfile,
      "exact_schema_or_union_profile_mismatch",
      concreteSchemaIssues.slice(0, 64),
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
        pointer: concreteSchemaIssues[0]?.split(":", 1)[0] ?? "",
      },
    );
  }
  const crossFieldIssues = [
    ...schemaIssues.filter((issue) =>
      issue.includes(":unsupported_semantics:"),
    ),
    ...replayCrossFieldInvariants(resolution, parsed),
  ];
  if (crossFieldIssues.length > 0) {
    return reject(
      runtimeProfile,
      "cross_field_invariant_mismatch",
      crossFieldIssues,
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
        pointer: crossFieldIssues[0]?.split(":", 1)[0] ?? "",
      },
    );
  }
  const binding = computeNhm2ProlateBosonStarSeedRuntimeInstanceBindingV3(
    runtimeProfile,
    bytes,
  );
  if (binding == null) {
    return reject(
      runtimeProfile,
      "exact_schema_or_union_profile_mismatch",
      ["profile_resolution_changed"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
      },
    );
  }
  if (
    assertedInstanceBinding != null &&
    !assertedBindingMatches(assertedInstanceBinding, binding)
  ) {
    return reject(
      runtimeProfile,
      "asserted_instance_binding_mismatch",
      ["asserted_binding_not_exact"],
      {
        attemptedBinding: assertedInstanceBinding,
        declaredByteLength: bytes.byteLength,
        observedByteLength: bytes.byteLength,
        cap,
      },
    );
  }
  return Object.freeze({
    ok: true,
    interpreterVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_INTERPRETER_V3_VERSION,
    runtimeProfile,
    schemaName: resolution.schemaName,
    canonicalJson: recanonicalized,
    value: deepFreeze(parsed),
    binding,
    assertedBindingMatched: assertedInstanceBinding == null ? null : true,
    checks: Object.freeze({
      registryCardinalityExact: true,
      profileSchemaBindingDomainExact: true,
      boundedDuplicateAwareTokenizationPassed: true,
      recursiveExactSchemaAndProfileValidationPassed: true,
      crossFieldInvariantsReplayed: true,
      canonicalUtf8Exact: true,
      domainSeparatedBindingRecomputed: true,
      launchOrRegistrationAuthorityGranted: false,
    }),
    authorityLocks:
      NHM2_PROLATE_BOSON_STAR_SEED_RUNTIME_INSTANCE_AUTHORITY_LOCKS_V3,
  });
};
