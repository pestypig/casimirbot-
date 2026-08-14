import { createHash } from "node:crypto";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
  type Nhm2SphericalV2DiagnosticSkeletonBindingV2,
} from "./nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import {
  computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding,
  deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2,
  NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION,
  nhm2SphericalBosonStarV2SkeletonPersistencePairViolations,
  type Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBindingV1,
} from "./nhm2-spherical-boson-star-v2-run-artifact-wire.v2";

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_scientific_preseal_envelope" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_scientific_preseal_envelope/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-scientific-preseal-envelope-contract/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2/scientific-preseal-envelope/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS =
  Object.freeze({
    maximumCanonicalCodeUnits: 1_048_576,
    maximumCanonicalUtf8Bytes: 1_048_576,
    maximumEnvelopeUtf8Bytes: 262_144,
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 256,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 65_536,
    maximumAggregateStringUtf8Bytes: 524_288,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS =
  Object.freeze({
    canonicalBytesGrantAuthority: false as const,
    skeletonPersistenceAuthority: false as const,
    scientificPresealPersistenceAuthority: false as const,
    filesystemObservationAuthority: false as const,
    acceptedGeometryAuthority: false as const,
    metricDemandImplementationAuthority: false as const,
    meanNoiseRealizationAuthority: false as const,
    operatorOrderingNumericalAuthority: false as const,
    implementationClosureAuthority: false as const,
    runtimeClosureAuthority: false as const,
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

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS =
  Object.freeze({
    candidateAccepted: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS =
  Object.freeze({
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    independentAgreementLamp: false as const,
    diagnosticPassLamp: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS =
  Object.freeze({
    authenticatedSkeletonPersistenceReady: false as const,
    acceptedGeometryReady: false as const,
    metricDemandAdmittedImplementationReady: false as const,
    metricDemandExecutionReady: false as const,
    meanRsetNumericalRealizationReady: false as const,
    noiseKernelNumericalRealizationReady: false as const,
    operatorOrderingNumericalRealizationReady: false as const,
    primaryImplementationReady: false as const,
    independentImplementationReady: false as const,
    authenticatedRuntimeLoaderObservationReady: false as const,
    authenticatedScientificPresealPersistenceReady: false as const,
    executionReady: false as const,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES =
  Object.freeze({
    authenticatedSkeletonPersistenceReceipt: null,
    acceptedGeometryEvaluation: null,
    metricDemandAdmittedImplementation: null,
    metricDemandExecutionReceipt: null,
    meanRsetNumericalRealization: null,
    noiseKernelNumericalRealization: null,
    operatorOrderingNumericalRealization: null,
    primaryImplementation: null,
    independentImplementation: null,
    runtimeLoaderObservation: null,
    authenticatedScientificPresealPersistenceReceipt: null,
  });

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS =
  Object.freeze([
    "server_authenticated_skeleton_durability_observation_absent",
    "accepted_geometry_evaluation_instance_absent",
    "metric_demand_admitted_implementation_absent",
    "synthetic_metric_demand_executor_does_not_satisfy_candidate_readiness",
    "metric_demand_execution_receipt_absent",
    "mean_rset_numerical_realization_absent",
    "noise_kernel_numerical_realization_absent",
    "operator_ordering_numerical_realization_absent",
    "primary_implementation_instance_absent",
    "independent_implementation_instance_absent",
    "server_authenticated_runtime_loader_observer_not_implemented",
    "server_authenticated_scientific_preseal_persistence_observer_not_implemented",
    "execution_not_authorized",
  ] as const);

export type Nhm2SphericalBosonStarV2ScientificPresealEvidenceV1 = Readonly<{
  createdAt: string;
}>;

export type Nhm2SphericalBosonStarV2ScientificPresealEnvelopeUnsignedV1 =
  Readonly<{
    artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID;
    contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION;
    phase: "scientific_definition_preseal_after_external_skeleton_receipt";
    authorityFalse: true;
    candidateBinding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING;
    preexecutionProfileBinding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING;
    runArtifactWireV2Binding: typeof NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING;
    createdAt: string;
    preexecutionSkeletonBinding: Nhm2SphericalV2DiagnosticSkeletonBindingV2;
    skeletonPersistenceReceiptBinding: Nhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBindingV1;
    prePresealStaticClosureSha256: string;
    scientificDefinitionBindings: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS;
    readiness: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS;
    instances: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES;
    blockers: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS;
    authorityLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS;
    claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS;
    lamps: typeof NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS;
  }>;

export type Nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1 = Readonly<
  Nhm2SphericalBosonStarV2ScientificPresealEnvelopeUnsignedV1 & {
    presealEnvelopeSha256: string;
  }
>;

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
    throw new TypeError("spherical_v2_scientific_preseal_u64_invalid");
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
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS;
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
  maximumBytes: number = NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS.maximumCanonicalUtf8Bytes,
): CanonicalValue => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS;
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

const RECEIPT_BYTE_BINDING_EXACT_KEYS = Object.freeze([
  "artifactId",
  "contractVersion",
  "mediaType",
  "rawSha256",
  "receiptSha256",
  "sizeBytes",
] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_UNSIGNED_EXACT_KEYS =
  Object.freeze([
    "artifactId",
    "authorityFalse",
    "authorityLocks",
    "blockers",
    "candidateBinding",
    "claimLocks",
    "contractVersion",
    "createdAt",
    "instances",
    "lamps",
    "phase",
    "prePresealStaticClosureSha256",
    "preexecutionProfileBinding",
    "preexecutionSkeletonBinding",
    "readiness",
    "runArtifactWireV2Binding",
    "scientificDefinitionBindings",
    "skeletonPersistenceReceiptBinding",
  ] as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_EXACT_KEYS =
  Object.freeze([
    ...NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_UNSIGNED_EXACT_KEYS,
    "presealEnvelopeSha256",
  ] as const);

const unsignedEnvelopeSemanticViolations = (value: unknown): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_UNSIGNED_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_scientific_preseal_unsigned_fields_invalid"];
  }
  const envelope =
    value as unknown as Nhm2SphericalBosonStarV2ScientificPresealEnvelopeUnsignedV1;
  const createdAt = parseUtcNanoseconds(envelope.createdAt);
  if (
    envelope.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID ||
    envelope.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION ||
    envelope.phase !==
      "scientific_definition_preseal_after_external_skeleton_receipt" ||
    envelope.authorityFalse !== true ||
    createdAt === null
  ) {
    return ["spherical_v2_scientific_preseal_identity_or_time_invalid"];
  }
  if (
    !sameCanonical(
      envelope.candidateBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    ) ||
    !sameCanonical(
      envelope.preexecutionProfileBinding,
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    ) ||
    !sameCanonical(
      envelope.runArtifactWireV2Binding,
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    ) ||
    !sameCanonical(
      envelope.scientificDefinitionBindings,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
    )
  ) {
    return ["spherical_v2_scientific_preseal_fixed_binding_drift"];
  }
  if (
    !exactKeys(
      envelope.preexecutionSkeletonBinding,
      SKELETON_BINDING_EXACT_KEYS,
    ) ||
    !exactKeys(
      envelope.skeletonPersistenceReceiptBinding,
      RECEIPT_BYTE_BINDING_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_scientific_preseal_source_binding_shape_invalid"];
  }
  const skeleton = envelope.preexecutionSkeletonBinding;
  const receipt = envelope.skeletonPersistenceReceiptBinding;
  const frozenAt = parseUtcNanoseconds(skeleton.skeletonFrozenAt);
  const persistedAt = parseUtcNanoseconds(skeleton.persistedAt);
  if (
    skeleton.artifactId !==
      "nhm2.spherical_boson_star_v2_preexecution_output_skeleton" ||
    skeleton.contractVersion !==
      "nhm2_spherical_boson_star_v2_preexecution_output_skeleton/v2" ||
    skeleton.mediaType !== "application/json" ||
    !isExactAbsoluteLinuxPath(skeleton.path) ||
    !nonzeroSha256(skeleton.rawSha256) ||
    !nonzeroSha256(skeleton.wireSha256) ||
    skeleton.rawSha256 === skeleton.wireSha256 ||
    !nonzeroSha256(skeleton.persistenceReceiptSha256) ||
    !nonzeroSha256(skeleton.prePresealStaticClosureSha256) ||
    !Number.isSafeInteger(skeleton.sizeBytes) ||
    skeleton.sizeBytes <= 0 ||
    frozenAt === null ||
    persistedAt === null ||
    frozenAt >= persistedAt ||
    createdAt <= persistedAt ||
    envelope.prePresealStaticClosureSha256 !==
      skeleton.prePresealStaticClosureSha256
  ) {
    return ["spherical_v2_scientific_preseal_skeleton_binding_invalid"];
  }
  if (
    receipt.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_ARTIFACT_ID ||
    receipt.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_SKELETON_PERSISTENCE_RECEIPT_CONTRACT_VERSION ||
    receipt.mediaType !== "application/json" ||
    !nonzeroSha256(receipt.rawSha256) ||
    !nonzeroSha256(receipt.receiptSha256) ||
    !Number.isSafeInteger(receipt.sizeBytes) ||
    receipt.sizeBytes <= 0 ||
    receipt.receiptSha256 !== skeleton.persistenceReceiptSha256
  ) {
    return ["spherical_v2_scientific_preseal_receipt_binding_invalid"];
  }
  if (
    !sameCanonical(
      envelope.readiness,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS,
    ) ||
    !sameCanonical(
      envelope.instances,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES,
    ) ||
    !sameCanonical(
      envelope.blockers,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS,
    ) ||
    !sameCanonical(
      envelope.authorityLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS,
    ) ||
    !sameCanonical(
      envelope.claimLocks,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS,
    ) ||
    !sameCanonical(
      envelope.lamps,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS,
    )
  ) {
    return ["spherical_v2_scientific_preseal_false_null_boundary_invalid"];
  }
  return [];
};

export const computeNhm2SphericalBosonStarV2ScientificPresealEnvelopeSha256 = (
  unsignedEnvelopeCanonicalJson: string,
): string => {
  const unsigned = parseBoundedCanonicalJson(
    unsignedEnvelopeCanonicalJson,
    "spherical_v2_scientific_preseal_unsigned",
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS.maximumEnvelopeUtf8Bytes,
  );
  const violations = unsignedEnvelopeSemanticViolations(unsigned);
  if (violations.length !== 0) throw new TypeError(violations[0]);
  return lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_SHA256_DOMAIN,
    unsignedEnvelopeCanonicalJson,
  );
};

const envelopeSemanticViolations = (value: unknown): string[] => {
  if (
    !exactKeys(
      value,
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_EXACT_KEYS,
    )
  ) {
    return ["spherical_v2_scientific_preseal_fields_invalid"];
  }
  const envelope =
    value as unknown as Nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1;
  const { presealEnvelopeSha256, ...unsigned } = envelope;
  const unsignedViolations = unsignedEnvelopeSemanticViolations(unsigned);
  if (unsignedViolations.length !== 0) return unsignedViolations;
  if (!nonzeroSha256(presealEnvelopeSha256)) {
    return ["spherical_v2_scientific_preseal_sha256_invalid"];
  }
  const unsignedCanonicalJson = canonicalJsonFromValue(
    unsigned as unknown as CanonicalValue,
  );
  let expected: string;
  try {
    expected = computeNhm2SphericalBosonStarV2ScientificPresealEnvelopeSha256(
      unsignedCanonicalJson,
    );
  } catch {
    return ["spherical_v2_scientific_preseal_unsigned_semantics_invalid"];
  }
  return presealEnvelopeSha256 === expected
    ? []
    : ["spherical_v2_scientific_preseal_sha256_mismatch"];
};

export const deriveNhm2SphericalBosonStarV2ScientificPresealEnvelopeV1CanonicalJson =
  (
    skeletonCanonicalJson: string,
    skeletonPersistenceReceiptCanonicalJson: string,
    evidenceCanonicalJson: string,
  ): string => {
    const pairViolations =
      nhm2SphericalBosonStarV2SkeletonPersistencePairViolations(
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
      );
    if (pairViolations.length !== 0) {
      throw new TypeError(
        `spherical_v2_scientific_preseal_source_pair_invalid:${pairViolations[0]}`,
      );
    }
    const persistedSkeleton =
      deriveNhm2SphericalBosonStarV2DiagnosticPersistedSkeletonBindingV2(
        skeletonCanonicalJson,
        skeletonPersistenceReceiptCanonicalJson,
      );
    const receiptBinding =
      computeNhm2SphericalBosonStarV2SkeletonPersistenceReceiptByteBinding(
        skeletonPersistenceReceiptCanonicalJson,
      );
    const evidence = parseBoundedCanonicalJson(
      evidenceCanonicalJson,
      "spherical_v2_scientific_preseal_evidence",
    );
    if (!exactKeys(evidence, ["createdAt"])) {
      throw new TypeError(
        "spherical_v2_scientific_preseal_evidence_fields_invalid",
      );
    }
    const createdAtValue = (evidence as { createdAt: unknown }).createdAt;
    const createdAt = parseUtcNanoseconds(createdAtValue);
    const persistedAt = parseUtcNanoseconds(persistedSkeleton.persistedAt);
    if (
      createdAt === null ||
      persistedAt === null ||
      createdAt <= persistedAt
    ) {
      throw new TypeError(
        "spherical_v2_scientific_preseal_evidence_chronology_invalid",
      );
    }
    const unsigned: Nhm2SphericalBosonStarV2ScientificPresealEnvelopeUnsignedV1 =
      {
        artifactId:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID,
        contractVersion:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION,
        phase: "scientific_definition_preseal_after_external_skeleton_receipt",
        authorityFalse: true,
        candidateBinding: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
        preexecutionProfileBinding:
          NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
        runArtifactWireV2Binding:
          NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
        createdAt: createdAtValue as string,
        preexecutionSkeletonBinding: persistedSkeleton,
        skeletonPersistenceReceiptBinding: receiptBinding,
        prePresealStaticClosureSha256:
          persistedSkeleton.prePresealStaticClosureSha256,
        scientificDefinitionBindings:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
        readiness:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS,
        instances:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES,
        blockers:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS,
        authorityLocks:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS,
        claimLocks:
          NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS,
        lamps: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS,
      };
    const unsignedCanonicalJson = canonicalJsonFromValue(
      unsigned as unknown as CanonicalValue,
    );
    const envelope: Nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1 = {
      ...unsigned,
      presealEnvelopeSha256:
        computeNhm2SphericalBosonStarV2ScientificPresealEnvelopeSha256(
          unsignedCanonicalJson,
        ),
    };
    const canonicalEnvelope = canonicalJsonFromValue(
      envelope as unknown as CanonicalValue,
    );
    const violations = envelopeSemanticViolations(envelope);
    if (violations.length !== 0) throw new TypeError(violations[0]);
    return canonicalEnvelope;
  };

export const nhm2SphericalBosonStarV2ScientificPresealEnvelopeV1Violations = (
  value: unknown,
): readonly string[] => {
  let root: CanonicalValue;
  try {
    root = parseBoundedCanonicalJson(
      value,
      "spherical_v2_scientific_preseal",
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS.maximumEnvelopeUtf8Bytes,
    );
  } catch (error) {
    return Object.freeze([
      error instanceof Error
        ? error.message
        : "spherical_v2_scientific_preseal_surface_invalid",
    ]);
  }
  try {
    return Object.freeze(envelopeSemanticViolations(root));
  } catch {
    return Object.freeze([
      "spherical_v2_scientific_preseal_semantic_validation_failed",
    ]);
  }
};

const CONTRACT = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  phase:
    "stage_2_scientific_definition_preseal_schema_without_persistence_or_execution_authority",
  exactBindings: {
    preexecutionProfile:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
    runArtifactWireV2:
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    candidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    scientificDefinitions:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_DEFINITION_BINDINGS,
  },
  derivationBoundary: {
    exactCanonicalInputsInOrder: [
      "preexecution_skeleton_v2",
      "external_skeleton_persistence_receipt",
      "created_at_evidence",
    ],
    SAndSRPairValidatorInvokedBeforeAnyBindingCopy: true,
    SRawV2WireSizeAndADigestRecomputed: true,
    SRRawSelfHashAndSizeRecomputed: true,
    createdAtStrictlyAfterSRPersistedAt: true,
    callerSuppliedCandidateOrScienceBindingsAllowed: false,
    syntheticMetricDemandExecutorEstablishesReadiness: false,
  },
  envelopeSchema: {
    exactRootKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_EXACT_KEYS,
    unsignedExactRootKeys:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_UNSIGNED_EXACT_KEYS,
    canonicalObjectKeyOrder: "ascending_ECMAScript_UTF16_code_units",
    selfHashDomain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_SHA256_DOMAIN,
    selfHashRecipe:
      "SHA256(domain_utf8||u64le(canonical_unsigned_P_length)||canonical_unsigned_P_bytes)",
    laterPersistenceReceiptFieldsAllowed: false,
    executionPresealLaunchOrPostrunFieldsAllowed: false,
    standalonePlainEnvelopeGrantsSourceByteAuthority: false,
  },
  publicBoundary: {
    ingress: "primitive_prebounded_canonical_JSON_text_only",
    codeUnitCapBeforeUtf8Measurement: true,
    utf8CapBeforeJsonParse: true,
    parsedTreeValidation: "iterative_and_bounded",
    exactCanonicalReserializationRequired: true,
    callerOwnedObjectsAccepted: false,
    issuerOrWeakSetExported: false,
    totalViolationFunction: true,
  },
  resourceLimits:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LIMITS,
  readiness: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS,
  instances: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES,
  blockers: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BLOCKERS,
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS,
  claimLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS,
  lamps: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS,
} as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT =
  deepFreeze(CONTRACT);
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_JSON =
  canonicalJsonFromValue(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT as unknown as CanonicalValue,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256 =
  lengthDelimitedSha256(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256_DOMAIN,
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_JSON,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_SHA256 =
  "b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES =
  10_551 as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256_DOMAIN,
    sha256:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

if (
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_AUTHORITY_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CLAIM_LOCKS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_LAMPS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_READINESS,
  ).some((value) => value !== false) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_INSTANCES,
  ).some((value) => value !== null)
) {
  throw new Error("spherical_v2_scientific_preseal_false_null_invariant");
}

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `spherical_v2_scientific_preseal_literal_seal_drift:${NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_CONTRACT_CANONICAL_SIZE_BYTES}`,
  );
}
