import { createHash } from "node:crypto";

import {
  computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  type Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2,
  type Nhm2SphericalV2DiagnosticScientificPresealBindingV2,
} from "./nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  computeNhm2SphericalBosonStarV2SkeletonByteBindingV2,
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding,
  deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
  nhm2SphericalBosonStarV2SkeletonPersistencePairViolations,
} from "./nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION,
  nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations,
  type Nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1,
} from "./nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_scientific_preseal_persistence_receipt" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_scientific_preseal_persistence_receipt/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt-contract/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/scientific-preseal-persistence-receipt/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS =
  Object.freeze({
    maximumCanonicalCodeUnits: 1_048_576,
    maximumCanonicalUtf8Bytes: 1_048_576,
    maximumPrePresealStaticClosureUtf8Bytes: 262_144,
    maximumSkeletonUtf8Bytes: 1_048_576,
    maximumSkeletonReceiptUtf8Bytes: 262_144,
    maximumScientificPresealUtf8Bytes: 262_144,
    maximumReceiptUtf8Bytes: 262_144,
    maximumAggregateInputCodeUnits: 2_097_152,
    maximumAggregateInputUtf8Bytes: 2_097_152,
    maximumDepth: 32,
    maximumNodes: 32_768,
    maximumArrayLength: 512,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateStringUtf8Bytes: 1_048_576,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS =
  Object.freeze({
    canonicalBytesGrantAuthority: false as const,
    receiptIntegrityGrantsPersistenceAuthority: false as const,
    authenticatedObservationAuthority: false as const,
    skeletonPersistenceAuthority: false as const,
    scientificPresealPersistenceAuthority: false as const,
    filesystemObservationAuthority: false as const,
    durabilityObservationAuthority: false as const,
    issuerAuthority: false as const,
    executionFreshnessObservationAuthority: false as const,
    outputRootAbsenceAuthority: false as const,
    implementationClosureAuthority: false as const,
    runtimeClosureAuthority: false as const,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS =
  Object.freeze({
    persistenceObserved: false as const,
    durabilityEstablished: false as const,
    candidateAccepted: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LAMPS =
  Object.freeze({
    authenticatedScientificPresealPersistenceLamp: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    independentAgreementLamp: false as const,
    diagnosticPassLamp: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_READINESS =
  Object.freeze({
    authenticatedSkeletonPersistenceReady: false as const,
    authenticatedScientificPresealPersistenceReady: false as const,
    authenticatedFilesystemObservationReady: false as const,
    authenticatedDurabilityObservationReady: false as const,
    authenticatedExecutionFreshnessObservationReady: false as const,
    authenticatedOutputRootAbsenceObservationReady: false as const,
    authenticatedRuntimeLoaderObservationReady: false as const,
    implementationClosureReady: false as const,
    runtimeClosureReady: false as const,
    executionPresealReady: false as const,
    executionReady: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_INSTANCES =
  Object.freeze({
    authenticatedSkeletonPersistenceReceipt: null,
    authenticatedScientificPresealPersistenceReceipt: null,
    authenticatedFilesystemObservation: null,
    authenticatedDurabilityObservation: null,
    authenticatedExecutionFreshnessReceipt: null,
    authenticatedOutputRootAbsenceReceipt: null,
    runtimeLoaderObservation: null,
    executionPreseal: null,
    executionReceipt: null,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BLOCKERS =
  Object.freeze([
    "server_authenticated_skeleton_durability_observation_absent",
    "server_authenticated_scientific_preseal_persistence_observer_not_implemented",
    "server_authenticated_filesystem_observer_not_implemented",
    "server_authenticated_execution_freshness_observer_not_implemented",
    "server_authenticated_output_root_absence_observer_not_implemented",
    "server_authenticated_runtime_loader_observer_not_implemented",
    "execution_preseal_not_implemented",
    "execution_not_authorized",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS =
  Object.freeze({
    preexecutionProfileV2: Object.freeze({
      sha256:
        "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
      canonicalSizeBytes: 11_663,
    }),
    runArtifactWireV2: Object.freeze({
      sha256:
        "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
      canonicalSizeBytes: 11_117,
    }),
    scientificPresealEnvelopeV1: Object.freeze({
      sha256:
        "b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca",
      canonicalSizeBytes: 10_551,
    }),
  } as const);

export type Nhm2SphericalBosonStarV2ScientificPresealByteBindingV1 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION;
  mediaType: "application/json";
  rawSha256: string;
  presealEnvelopeSha256: string;
  sizeBytes: number;
  createdAt: string;
  prePresealStaticClosureSha256: string;
  boundSkeletonRawSha256: string;
  boundSkeletonWireSha256: string;
  boundSkeletonSizeBytes: number;
  boundSkeletonPersistenceReceiptSha256: string;
}>;

export type Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptScientificPresealBindingV1 =
  Readonly<
    Nhm2SphericalBosonStarV2ScientificPresealByteBindingV1 & {
      path: string;
    }
  >;

export type Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptUnsignedV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION;
    phase: "external_scientific_preseal_durable_readback_receipt_integrity_only";
    authorityFalse: true;
    candidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.candidateId;
    persistenceKind: "external_durable_publication_readback";
    observationAuthentication: "not_established_by_plain_canonical_json";
    authenticatedObservationContext: null;
    path: string;
    scientificPresealBinding: Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptScientificPresealBindingV1;
    persistedAt: string;
    persistenceObservedAt: string;
    authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS;
    claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS;
  }>;

export type Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1 =
  Readonly<
    Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptUnsignedV1 & {
      receiptSha256: string;
    }
  >;

export type Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptByteBindingV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION;
    mediaType: "application/json";
    rawSha256: string;
    receiptSha256: string;
    sizeBytes: number;
    persistenceObservedAt: string;
  }>;

export type Nhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1 =
  Readonly<{
    scientificPresealBinding: Nhm2SphericalV2DiagnosticScientificPresealBindingV2;
    scientificPersistenceReceiptBinding: Nhm2SphericalV2DiagnosticPersistenceReceiptBindingV2;
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

type ValidScientificPresealChain = Readonly<{
  prePresealStaticClosureSha256: string;
  envelope: Nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1;
  scientificPresealByteBinding: Nhm2SphericalBosonStarV2ScientificPresealByteBindingV1;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const PRINTABLE_ASCII_PATH_SEGMENT = /^[\x20-\x7e]+$/;
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

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

const nonzeroSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);

const pointerSegment = (value: string): string =>
  value.replaceAll("~", "~0").replaceAll("/", "~1");

const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("spherical_v2_scientific_preseal_receipt_u64_invalid");
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
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS;
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
  maximumBytes: number,
): CanonicalValue => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS;
  if (typeof canonicalJson !== "string") {
    throw new TypeError(`${code}:canonical_json_text_required`);
  }
  if (canonicalJson.length > limits.maximumCanonicalCodeUnits) {
    throw new TypeError(`${code}:canonical_code_units_exceeded`);
  }
  if (Buffer.byteLength(canonicalJson, "utf8") > maximumBytes) {
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

const requireBoundedAggregateCanonicalStrings = (
  values: readonly unknown[],
): readonly string[] => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS;
  for (const value of values) {
    if (typeof value !== "string") {
      throw new TypeError(
        "spherical_v2_scientific_preseal_persistence_pair_canonical_json_text_required",
      );
    }
  }
  const strings = values as readonly string[];
  let aggregateCodeUnits = 0;
  for (const value of strings) {
    if (value.length > limits.maximumCanonicalCodeUnits) {
      throw new TypeError(
        "spherical_v2_scientific_preseal_persistence_pair_canonical_code_units_exceeded",
      );
    }
    aggregateCodeUnits += value.length;
    if (aggregateCodeUnits > limits.maximumAggregateInputCodeUnits) {
      throw new TypeError(
        "spherical_v2_scientific_preseal_persistence_pair_aggregate_code_units_exceeded",
      );
    }
  }
  let aggregateUtf8Bytes = 0;
  for (const value of strings) {
    aggregateUtf8Bytes += Buffer.byteLength(value, "utf8");
    if (aggregateUtf8Bytes > limits.maximumAggregateInputUtf8Bytes) {
      throw new TypeError(
        "spherical_v2_scientific_preseal_persistence_pair_aggregate_utf8_bytes_exceeded",
      );
    }
  }
  return strings;
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

const rawSha256 = (canonicalJson: string): string =>
  createHash("sha256").update(canonicalJson, "utf8").digest("hex");

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "boundSkeletonPersistenceReceiptSha256",
    "boundSkeletonRawSha256",
    "boundSkeletonSizeBytes",
    "boundSkeletonWireSha256",
    "contractVersion",
    "createdAt",
    "mediaType",
    "path",
    "prePresealStaticClosureSha256",
    "presealEnvelopeSha256",
    "rawSha256",
    "sizeBytes",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "observationAuthentication",
    "path",
    "persistedAt",
    "persistenceKind",
    "persistenceObservedAt",
    "phase",
    "scientificPresealBinding",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authenticatedObservationContext",
    "authorityFalse",
    "authorityLocks",
    "candidateId",
    "claimLocks",
    "contractVersion",
    "observationAuthentication",
    "path",
    "persistedAt",
    "persistenceKind",
    "persistenceObservedAt",
    "phase",
    "receiptSha256",
    "scientificPresealBinding",
  ] as const);

const scientificPresealBindingSemanticViolations = (
  value: unknown,
): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS,
    )
  ) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_preseal_binding_fields_invalid",
    ];
  }
  const binding =
    value as unknown as Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptScientificPresealBindingV1;
  if (
    binding.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID ||
    binding.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION ||
    binding.mediaType !== "application/json" ||
    !isExactAbsoluteLinuxPath(binding.path) ||
    !nonzeroSha256(binding.rawSha256) ||
    !nonzeroSha256(binding.presealEnvelopeSha256) ||
    !nonzeroSha256(binding.prePresealStaticClosureSha256) ||
    !nonzeroSha256(binding.boundSkeletonRawSha256) ||
    !nonzeroSha256(binding.boundSkeletonWireSha256) ||
    binding.boundSkeletonRawSha256 === binding.boundSkeletonWireSha256 ||
    !nonzeroSha256(binding.boundSkeletonPersistenceReceiptSha256) ||
    !Number.isSafeInteger(binding.sizeBytes) ||
    binding.sizeBytes <= 0 ||
    !Number.isSafeInteger(binding.boundSkeletonSizeBytes) ||
    binding.boundSkeletonSizeBytes <= 0 ||
    parseUtcNanoseconds(binding.createdAt) === null
  ) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_preseal_binding_invalid",
    ];
  }
  return [];
};

const unsignedReceiptSemanticViolations = (value: unknown): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
    )
  ) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_unsigned_fields_invalid",
    ];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptUnsignedV1;
  const createdAt = parseUtcNanoseconds(
    receipt.scientificPresealBinding.createdAt,
  );
  const persistedAt = parseUtcNanoseconds(receipt.persistedAt);
  const observedAt = parseUtcNanoseconds(receipt.persistenceObservedAt);
  if (
    receipt.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION ||
    receipt.phase !==
      "external_scientific_preseal_durable_readback_receipt_integrity_only" ||
    receipt.authorityFalse !== true ||
    receipt.candidateId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.candidateId ||
    receipt.persistenceKind !== "external_durable_publication_readback" ||
    receipt.observationAuthentication !==
      "not_established_by_plain_canonical_json" ||
    receipt.authenticatedObservationContext !== null ||
    !isExactAbsoluteLinuxPath(receipt.path) ||
    createdAt === null ||
    persistedAt === null ||
    observedAt === null ||
    createdAt >= persistedAt ||
    persistedAt > observedAt
  ) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_identity_or_chronology_invalid",
    ];
  }
  const bindingViolations = scientificPresealBindingSemanticViolations(
    receipt.scientificPresealBinding,
  );
  if (bindingViolations.length !== 0) return bindingViolations;
  if (
    !sameCanonical(
      receipt.authorityLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
    ) ||
    !sameCanonical(
      receipt.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
    )
  ) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_false_lock_boundary_invalid",
    ];
  }
  return [];
};

export const computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256 =
  (unsignedReceiptCanonicalJson: unknown): string => {
    const unsigned = parseBoundedCanonicalJson(
      unsignedReceiptCanonicalJson,
      "spherical_v2_scientific_preseal_persistence_receipt_unsigned",
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumReceiptUtf8Bytes,
    );
    const violations = unsignedReceiptSemanticViolations(unsigned);
    if (violations.length !== 0) throw new TypeError(violations[0]);
    return lengthDelimitedSha256(
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
      unsignedReceiptCanonicalJson as string,
    );
  };

const receiptSemanticViolations = (value: unknown): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    )
  ) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_fields_invalid",
    ];
  }
  const receipt =
    value as unknown as Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1;
  const { receiptSha256, ...unsigned } = receipt;
  const unsignedViolations = unsignedReceiptSemanticViolations(unsigned);
  if (unsignedViolations.length !== 0) return unsignedViolations;
  if (!nonzeroSha256(receiptSha256)) {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_sha256_invalid",
    ];
  }
  let expected: string;
  try {
    expected =
      computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptSha256(
        canonicalJsonFromValue(unsigned as unknown as CanonicalValue),
      );
  } catch {
    return [
      "spherical_v2_scientific_preseal_persistence_receipt_unsigned_semantics_invalid",
    ];
  }
  return receiptSha256 === expected
    ? []
    : ["spherical_v2_scientific_preseal_persistence_receipt_sha256_mismatch"];
};

export const nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations =
  (value: unknown): readonly string[] => {
    let root: CanonicalValue;
    try {
      root = parseBoundedCanonicalJson(
        value,
        "spherical_v2_scientific_preseal_persistence_receipt",
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumReceiptUtf8Bytes,
      );
    } catch (error) {
      return Object.freeze([
        error instanceof Error
          ? error.message
          : "spherical_v2_scientific_preseal_persistence_receipt_surface_invalid",
      ]);
    }
    try {
      return Object.freeze(receiptSemanticViolations(root));
    } catch {
      return Object.freeze([
        "spherical_v2_scientific_preseal_persistence_receipt_semantic_validation_failed",
      ]);
    }
  };

const requireValidReceipt = (
  canonicalJson: unknown,
): Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1 => {
  const violations =
    nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1Violations(
      canonicalJson,
    );
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return parseBoundedCanonicalJson(
    canonicalJson,
    "spherical_v2_scientific_preseal_persistence_receipt",
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumReceiptUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptV1;
};

export const computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptByteBinding =
  (
    receiptCanonicalJson: unknown,
  ): Nhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptByteBindingV1 => {
    const receipt = requireValidReceipt(receiptCanonicalJson);
    const canonicalText = receiptCanonicalJson as string;
    return deepFreeze({
      artifactId:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
      mediaType: "application/json" as const,
      rawSha256: rawSha256(canonicalText),
      receiptSha256: receipt.receiptSha256,
      sizeBytes: Buffer.byteLength(canonicalText, "utf8"),
      persistenceObservedAt: receipt.persistenceObservedAt,
    });
  };

const requireValidScientificPresealChain = (
  prePresealStaticClosureCanonicalJson: unknown,
  skeletonCanonicalJson: unknown,
  skeletonPersistenceReceiptCanonicalJson: unknown,
  scientificPresealCanonicalJson: unknown,
): ValidScientificPresealChain => {
  const [closureText, skeletonText, skeletonReceiptText, presealText] =
    requireBoundedAggregateCanonicalStrings([
      prePresealStaticClosureCanonicalJson,
      skeletonCanonicalJson,
      skeletonPersistenceReceiptCanonicalJson,
      scientificPresealCanonicalJson,
    ]);
  const closure = parseBoundedCanonicalJson(
    closureText!,
    "spherical_v2_scientific_preseal_persistence_pair_A",
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumPrePresealStaticClosureUtf8Bytes,
  );
  const sourcePairViolations =
    nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
      skeletonText,
      skeletonReceiptText,
    );
  if (sourcePairViolations.length !== 0) {
    throw new TypeError(
      `spherical_v2_scientific_preseal_persistence_pair_S_SR_invalid:${sourcePairViolations[0]}`,
    );
  }
  const skeleton = parseBoundedCanonicalJson(
    skeletonText!,
    "spherical_v2_scientific_preseal_persistence_pair_S",
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumSkeletonUtf8Bytes,
  ) as unknown as {
    prePresealStaticClosure: CanonicalValue;
    prePresealStaticClosureSha256: string;
  };
  const prePresealStaticClosureSha256 =
    computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256(closureText!);
  if (
    canonicalJsonFromValue(skeleton.prePresealStaticClosure) !== closureText ||
    skeleton.prePresealStaticClosureSha256 !== prePresealStaticClosureSha256
  ) {
    throw new TypeError(
      "spherical_v2_scientific_preseal_persistence_pair_A_S_binding_invalid",
    );
  }
  const presealViolations =
    nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations(presealText);
  if (presealViolations.length !== 0) {
    throw new TypeError(
      `spherical_v2_scientific_preseal_persistence_pair_P_invalid:${presealViolations[0]}`,
    );
  }
  const envelope = parseBoundedCanonicalJson(
    presealText!,
    "spherical_v2_scientific_preseal_persistence_pair_P",
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS.maximumScientificPresealUtf8Bytes,
  ) as unknown as Nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1;
  const skeletonBytes = computeNhm2SphericalBosonStarV2SkeletonByteBindingV2(
    skeletonText!,
  );
  const persistedSkeleton =
    deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2(
      skeletonText!,
      skeletonReceiptText!,
    );
  const skeletonReceiptBytes =
    computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding(
      skeletonReceiptText!,
    );
  if (
    envelope.prePresealStaticClosureSha256 !== prePresealStaticClosureSha256 ||
    !sameCanonical(envelope.preexecutionSkeletonBinding, persistedSkeleton) ||
    !sameCanonical(
      envelope.skeletonPersistenceReceiptBinding,
      skeletonReceiptBytes,
    )
  ) {
    throw new TypeError(
      "spherical_v2_scientific_preseal_persistence_pair_A_S_SR_P_binding_invalid",
    );
  }
  const presealBytes = Buffer.from(presealText!, "utf8");
  const scientificPresealByteBinding = deepFreeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION,
    mediaType: "application/json" as const,
    rawSha256: createHash("sha256").update(presealBytes).digest("hex"),
    presealEnvelopeSha256: envelope.presealEnvelopeSha256,
    sizeBytes: presealBytes.length,
    createdAt: envelope.createdAt,
    prePresealStaticClosureSha256,
    boundSkeletonRawSha256: skeletonBytes.rawSha256,
    boundSkeletonWireSha256: skeletonBytes.wireSha256,
    boundSkeletonSizeBytes: skeletonBytes.sizeBytes,
    boundSkeletonPersistenceReceiptSha256: skeletonReceiptBytes.receiptSha256,
  });
  return deepFreeze({
    prePresealStaticClosureSha256,
    envelope,
    scientificPresealByteBinding,
  });
};

export const computeNhm2SphericalBosonStarV2ScientificPresealByteBindingV1 = (
  prePresealStaticClosureCanonicalJson: unknown,
  skeletonCanonicalJson: unknown,
  skeletonPersistenceReceiptCanonicalJson: unknown,
  scientificPresealCanonicalJson: unknown,
): Nhm2SphericalBosonStarV2ScientificPresealByteBindingV1 =>
  requireValidScientificPresealChain(
    prePresealStaticClosureCanonicalJson,
    skeletonCanonicalJson,
    skeletonPersistenceReceiptCanonicalJson,
    scientificPresealCanonicalJson,
  ).scientificPresealByteBinding;

export const nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations =
  (
    prePresealStaticClosureCanonicalJson: unknown,
    skeletonCanonicalJson: unknown,
    skeletonPersistenceReceiptCanonicalJson: unknown,
    scientificPresealCanonicalJson: unknown,
    scientificPresealPersistenceReceiptCanonicalJson: unknown,
  ): readonly string[] => {
    try {
      const [
        closureText,
        skeletonText,
        skeletonReceiptText,
        presealText,
        receiptText,
      ] = requireBoundedAggregateCanonicalStrings([
        prePresealStaticClosureCanonicalJson,
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
        scientificPresealCanonicalJson,
        scientificPresealPersistenceReceiptCanonicalJson,
      ]);
      const chain = requireValidScientificPresealChain(
        closureText,
        skeletonText,
        skeletonReceiptText,
        presealText,
      );
      const receipt = requireValidReceipt(receiptText);
      if (
        !sameCanonical(receipt.scientificPresealBinding, {
          ...chain.scientificPresealByteBinding,
          path: receipt.scientificPresealBinding.path,
        })
      ) {
        return Object.freeze([
          "spherical_v2_scientific_preseal_persistence_pair_P_PR_byte_binding_invalid",
        ]);
      }
      return Object.freeze([]);
    } catch (error) {
      return Object.freeze([
        error instanceof Error
          ? error.message
          : "spherical_v2_scientific_preseal_persistence_pair_validation_failed",
      ]);
    }
  };

export const deriveNhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1 =
  (
    prePresealStaticClosureCanonicalJson: unknown,
    skeletonCanonicalJson: unknown,
    skeletonPersistenceReceiptCanonicalJson: unknown,
    scientificPresealCanonicalJson: unknown,
    scientificPresealPersistenceReceiptCanonicalJson: unknown,
  ): Nhm2SphericalBosonStarV2DiagnosticScientificPresealPersistencePairV1 => {
    const violations =
      nhm2SphericalBosonStarV2ScientificPresealPersistencePairViolations(
        prePresealStaticClosureCanonicalJson,
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
        scientificPresealCanonicalJson,
        scientificPresealPersistenceReceiptCanonicalJson,
      );
    if (violations.length !== 0) throw new TypeError(violations[0]);
    const chain = requireValidScientificPresealChain(
      prePresealStaticClosureCanonicalJson,
      skeletonCanonicalJson,
      skeletonPersistenceReceiptCanonicalJson,
      scientificPresealCanonicalJson,
    );
    const receipt = requireValidReceipt(
      scientificPresealPersistenceReceiptCanonicalJson,
    );
    const receiptBytes =
      computeNhm2SphericalBosonStarV2ScientificPresealPersistenceReceiptByteBinding(
        scientificPresealPersistenceReceiptCanonicalJson,
      );
    const preseal = chain.scientificPresealByteBinding;
    return deepFreeze({
      scientificPresealBinding: {
        artifactId: preseal.artifactId,
        contractVersion: preseal.contractVersion,
        path: receipt.scientificPresealBinding.path,
        mediaType: preseal.mediaType,
        rawSha256: preseal.rawSha256,
        presealEnvelopeSha256: preseal.presealEnvelopeSha256,
        sizeBytes: preseal.sizeBytes,
        createdAt: preseal.createdAt,
        persistedAt: receipt.persistedAt,
        boundSkeletonRawSha256: preseal.boundSkeletonRawSha256,
        boundSkeletonWireSha256: preseal.boundSkeletonWireSha256,
        boundSkeletonSizeBytes: preseal.boundSkeletonSizeBytes,
        boundSkeletonPersistenceReceiptSha256:
          preseal.boundSkeletonPersistenceReceiptSha256,
      },
      scientificPersistenceReceiptBinding: {
        artifactId: receiptBytes.artifactId,
        contractVersion: receiptBytes.contractVersion,
        path: receipt.path,
        mediaType: receiptBytes.mediaType,
        rawSha256: receiptBytes.rawSha256,
        receiptSha256: receiptBytes.receiptSha256,
        sizeBytes: receiptBytes.sizeBytes,
        persistenceObservedAt: receiptBytes.persistenceObservedAt,
        persistedArtifactRawSha256: preseal.rawSha256,
        persistedArtifactSizeBytes: preseal.sizeBytes,
      },
    });
  };

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
  candidateId:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.candidateId,
  phase:
    "stage_2_external_scientific_preseal_receipt_integrity_without_authenticated_observation_or_persistence_claim",
  exactBindings: {
    preexecutionProfileV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    runArtifactWireV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    scientificPresealEnvelopeV1:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
  },
  requiredDependencyPins:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS,
  sourceApis: {
    prePresealStaticClosureSha256:
      "computeNhm2SphericalBosonStarV2PrePresealStaticClosureSha256",
    skeletonPairViolations:
      "nhm2SphericalBosonStarV2SkeletonPersistencePairViolations",
    skeletonByteBinding: "computeNhm2SphericalBosonStarV2SkeletonByteBindingV2",
    persistedSkeletonBinding:
      "deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2",
    skeletonReceiptByteBinding:
      "computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding",
    scientificPresealViolations:
      "nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations",
  },
  derivationBoundary: {
    exactCanonicalInputsInOrder: [
      "pre_preseal_static_closure_A",
      "preexecution_skeleton_S",
      "skeleton_persistence_receipt_SR",
      "scientific_preseal_P",
      "scientific_preseal_persistence_receipt_PR",
    ],
    ACanonicalBytesMustEqualSkeletonEmbeddedClosure: true,
    AClosureDigestRecomputed: true,
    SAndSRPairValidatorInvoked: true,
    SRawWireSizeAndADigestRecomputed: true,
    SRRawSelfHashAndSizeRecomputed: true,
    PValidatorInvoked: true,
    PRawSelfHashSizeAndCreatedAtRecomputed: true,
    PCrossBindingToExactASAndSRRequired: true,
    PRCrossBindingToExactPRequired: true,
    chronology:
      "P.createdAt_strictly_before_PR.persistedAt_less_than_or_equal_to_PR.persistenceObservedAt",
    receiptFieldsAreCallerClaimsNotAuthenticatedObservations: true,
    issuerOrMintExported: false,
  },
  receiptSchema: {
    exactRootKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_EXACT_KEYS,
    unsignedExactRootKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_UNSIGNED_EXACT_KEYS,
    scientificPresealBindingExactKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SCIENTIFIC_PRESEAL_BINDING_EXACT_KEYS,
    canonicalObjectKeyOrder: "ascending_ECMAScript_UTF16_code_units",
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_SHA256_DOMAIN,
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_PR_length)||canonical_unsigned_PR_bytes)",
    signatureFieldAllowed: false,
    authenticatedObserverIdentityFieldAllowed: false,
    standalonePlainReceiptGrantsPersistenceOrObservationAuthority: false,
  },
  publicBoundary: {
    ingress: "primitive_prebounded_canonical_JSON_text_only",
    codeUnitCapBeforeUtf8Measurement: true,
    aggregateCodeUnitCapBeforeAggregateUtf8Measurement: true,
    utf8CapBeforeJsonParse: true,
    parsedTreeValidation: "iterative_and_bounded",
    exactCanonicalReserializationRequired: true,
    callerOwnedObjectsAccepted: false,
    issuerOrWeakSetExported: false,
    totalViolationFunctions: true,
  },
  resourceLimits:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LIMITS,
  readiness:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_READINESS,
  instances:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_INSTANCES,
  blockers:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
  claimLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
  lamps:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LAMPS,
} as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT =
  deepFreeze(CONTRACT);
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_JSON =
  canonicalJsonFromValue(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT as unknown as CanonicalValue,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256 =
  lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256_DOMAIN,
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_JSON,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_SHA256 =
  "4c4112703dc13778d7053287fa03f0a22fb532ea09c9dad5b0b7046757140605" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES =
  8_306 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
    candidateId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.candidateId,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256_DOMAIN,
    sha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS
      .preexecutionProfileV2.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS
      .preexecutionProfileV2.canonicalSizeBytes ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS
      .runArtifactWireV2.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS
      .runArtifactWireV2.canonicalSizeBytes ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.sha256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS
      .scientificPresealEnvelopeV1.sha256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.canonicalSizeBytes !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS
      .scientificPresealEnvelopeV1.canonicalSizeBytes
) {
  throw new Error(
    "spherical_v2_scientific_preseal_persistence_receipt_dependency_binding_drift",
  );
}

if (
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_AUTHORITY_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CLAIM_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_LAMPS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_READINESS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_INSTANCES,
  ).some((value) => value !== null)
) {
  throw new Error(
    "spherical_v2_scientific_preseal_persistence_receipt_false_null_invariant",
  );
}

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `spherical_v2_scientific_preseal_persistence_receipt_literal_seal_drift:${NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_CONTRACT_CANONICAL_SIZE_BYTES}`,
  );
}
