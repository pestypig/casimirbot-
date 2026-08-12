import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
} from "./nhm2-semiclassical-v3-replay-epoch.v1";

export {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
};

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID =
  "nhm2.semiclassical_v3_constraint_operand_manifest" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_constraint_operand_manifest/v1" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID =
  "nhm2.semiclassical_v3_constraint_scientific_input_closure" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_constraint_scientific_input_closure/v1" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID =
  "nhm2.semiclassical_v3_constraint_complete_input_closure" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_constraint_complete_input_closure/v1" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID =
  "nhm2.semiclassical_v3_constraint_scientific_preseal" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION =
  "nhm2_semiclassical_v3_constraint_scientific_preseal/v1" as const;

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES =
  2048 as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL =
  21 as const;

if (
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES !==
  NHM2_SEMICLASSICAL_V3_SAMPLE_COUNT *
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER.length *
    Float64Array.BYTES_PER_ELEMENT
) {
  throw new Error("nhm2_v3_constraint_operand_array_size_invariant_failed");
}

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY =
  Object.freeze({
    schemaImplemented: true as const,
    filesystemReadPerformed: false as const,
    filesystemSecurityVerified: false as const,
    realpathVerified: false as const,
    stableFileIdentityVerified: false as const,
    freshnessServerVerified: false as const,
    persistedScientificPresealResolved: false as const,
    serverOriginVerified: false as const,
    candidateAdmission: false as const,
    replayAuthority: false as const,
  });

export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-constraint-scientific-input-closure/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-constraint-complete-input-closure/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_PRESEAL_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-constraint-scientific-preseal/v1\n" as const;
export const NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN =
  "nhm2-semiclassical-v3-constraint-operand-inventory/v1\n" as const;

export type Nhm2SemiclassicalV3ConstraintFamilyId =
  (typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER)[number];
export type Nhm2SemiclassicalV3ConstraintLevelId =
  (typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS)[number]["levelId"];
export type Nhm2SemiclassicalV3ConstraintOperandRole =
  (typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER)[keyof typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER][number];
export type Nhm2SemiclassicalV3RequiredInputId =
  (typeof NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS)[number];
export type Nhm2SemiclassicalV3ScientificInputId =
  (typeof NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS)[number];

export type Nhm2SemiclassicalV3ConstraintInputDescriptorV1 = {
  inputId: Nhm2SemiclassicalV3RequiredInputId;
  identityId: string;
  sha256: string;
  sizeBytes: number;
  observedAt: string;
};

export type Nhm2SemiclassicalV3ConstraintScientificInputClosureV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION;
  requiredInputIds: Nhm2SemiclassicalV3ScientificInputId[];
  inputs: Nhm2SemiclassicalV3ConstraintInputDescriptorV1[];
  sha256: string;
};

export type Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION;
  requiredInputIds: Nhm2SemiclassicalV3RequiredInputId[];
  inputs: Nhm2SemiclassicalV3ConstraintInputDescriptorV1[];
  scientificInputClosureSha256: string;
  frozenAt: string;
  sha256: string;
};

export type Nhm2SemiclassicalV3ConstraintScientificPresealBindingV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION;
  presealId: string;
  sealKey: string;
  candidateId: string;
  candidateManifestSha256: string;
  scientificInputClosureSha256: string;
  sealedAt: string;
};

export type Nhm2SemiclassicalV3ConstraintCandidateBindingV1 = {
  candidateId: string;
  candidateManifestSha256: string;
  scientificInputClosureSha256: string;
  scientificPresealBinding: Nhm2SemiclassicalV3ConstraintScientificPresealBindingV1;
};

export type Nhm2SemiclassicalV3ConstraintImplementationBindingV1 = {
  comparisonPairId: string;
  role: "primary" | "independent";
  implementationId: string;
  sourceIdentityId: string;
  sourceSha256: string;
  dependencyLockIdentityId: string;
  dependencyLockSha256: string;
  executableIdentityId: string;
  executableSha256: string;
};

export type Nhm2SemiclassicalV3ConstraintExecutionBindingV1 = {
  runId: string;
  commitSha: string;
  command: string;
  argv: string[];
  outputDirectory: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  exitCode: 0;
  terminationSignal: null;
};

export type Nhm2SemiclassicalV3ConstraintOperandArrayV1 = {
  arrayRole: string;
  operandRole: Nhm2SemiclassicalV3ConstraintOperandRole;
  path: string;
  sha256: string;
  sizeBytes: 2048;
  freshness: "new";
  observedAt: string;
  scientificPresealSealKey: string;
  dtype: "float64";
  binaryEncoding: "raw_ieee754";
  endianness: "little";
  shape: [64, 4];
  storageOrder: "row-major";
  componentOrder: ["hamiltonian", "momentum_x", "momentum_y", "momentum_z"];
  sampleOrder: "candidate_sampling_ordinal_0_to_63";
  unit: "dimensionless_barred_constraint_generator";
};

export type Nhm2SemiclassicalV3ConstraintOperandFamilyV1 = {
  familyId: Nhm2SemiclassicalV3ConstraintFamilyId;
  operandOrder: Nhm2SemiclassicalV3ConstraintOperandRole[];
  residualFormula: string;
  operands: Nhm2SemiclassicalV3ConstraintOperandArrayV1[];
};

export type Nhm2SemiclassicalV3ConstraintOperandLevelV1 = {
  ordinal: 0 | 1 | 2;
  levelId: Nhm2SemiclassicalV3ConstraintLevelId;
  hExact: "1/16" | "1/32" | "1/64";
  h: number;
  families: Nhm2SemiclassicalV3ConstraintOperandFamilyV1[];
};

export type Nhm2SemiclassicalV3ConstraintOperandManifestV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION;
  generatedAt: string;
  replayEpochPolicyBinding: typeof NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING;
  constraintArithmeticPolicyBinding: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING;
  candidateBinding: Nhm2SemiclassicalV3ConstraintCandidateBindingV1;
  scientificInputClosure: Nhm2SemiclassicalV3ConstraintScientificInputClosureV1;
  completeInputClosure: Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1;
  implementation: Nhm2SemiclassicalV3ConstraintImplementationBindingV1;
  execution: Nhm2SemiclassicalV3ConstraintExecutionBindingV1;
  levels: Nhm2SemiclassicalV3ConstraintOperandLevelV1[];
  operandInventorySha256: string;
  claimLocks: typeof NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS;
  schemaBoundary: typeof NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY;
};

export type Nhm2SemiclassicalV3ConstraintOperandManifestValidationResult =
  | Readonly<{
      ok: true;
      manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1;
      violations: readonly [];
    }>
  | Readonly<{
      ok: false;
      manifest: null;
      violations: readonly string[];
    }>;

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "generatedAt",
  "replayEpochPolicyBinding",
  "constraintArithmeticPolicyBinding",
  "candidateBinding",
  "scientificInputClosure",
  "completeInputClosure",
  "implementation",
  "execution",
  "levels",
  "operandInventorySha256",
  "claimLocks",
  "schemaBoundary",
] as const;
const EPOCH_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "policyId",
  "sha256",
  "sizeBytes",
  "mediaType",
] as const;
const ARITHMETIC_BINDING_KEYS = [
  "artifactId",
  "contractVersion",
  "policyId",
  "sha256",
  "sizeBytes",
  "mediaType",
] as const;
const CANDIDATE_KEYS = [
  "candidateId",
  "candidateManifestSha256",
  "scientificInputClosureSha256",
  "scientificPresealBinding",
] as const;
const PRESEAL_KEYS = [
  "artifactId",
  "contractVersion",
  "presealId",
  "sealKey",
  "candidateId",
  "candidateManifestSha256",
  "scientificInputClosureSha256",
  "sealedAt",
] as const;
const SCIENTIFIC_INPUT_CLOSURE_KEYS = [
  "artifactId",
  "contractVersion",
  "requiredInputIds",
  "inputs",
  "sha256",
] as const;
const COMPLETE_INPUT_CLOSURE_KEYS = [
  "artifactId",
  "contractVersion",
  "requiredInputIds",
  "inputs",
  "scientificInputClosureSha256",
  "frozenAt",
  "sha256",
] as const;
const INPUT_DESCRIPTOR_KEYS = [
  "inputId",
  "identityId",
  "sha256",
  "sizeBytes",
  "observedAt",
] as const;
const IMPLEMENTATION_KEYS = [
  "comparisonPairId",
  "role",
  "implementationId",
  "sourceIdentityId",
  "sourceSha256",
  "dependencyLockIdentityId",
  "dependencyLockSha256",
  "executableIdentityId",
  "executableSha256",
] as const;
const EXECUTION_KEYS = [
  "runId",
  "commitSha",
  "command",
  "argv",
  "outputDirectory",
  "startedAt",
  "completedAt",
  "durationMs",
  "exitCode",
  "terminationSignal",
] as const;
const LEVEL_KEYS = ["ordinal", "levelId", "hExact", "h", "families"] as const;
const FAMILY_KEYS = [
  "familyId",
  "operandOrder",
  "residualFormula",
  "operands",
] as const;
const OPERAND_KEYS = [
  "arrayRole",
  "operandRole",
  "path",
  "sha256",
  "sizeBytes",
  "freshness",
  "observedAt",
  "scientificPresealSealKey",
  "dtype",
  "binaryEncoding",
  "endianness",
  "shape",
  "storageOrder",
  "componentOrder",
  "sampleOrder",
  "unit",
] as const;

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
  }
  return value;
};

const sha256CanonicalJson = (domain: string, value: unknown): string =>
  createHash("sha256")
    .update(domain, "utf8")
    .update(JSON.stringify(canonicalizeJson(value)), "utf8")
    .digest("hex");

const scientificInputClosurePayload = (
  closure: Nhm2SemiclassicalV3ConstraintScientificInputClosureV1,
) => ({
  artifactId: closure.artifactId,
  contractVersion: closure.contractVersion,
  requiredInputIds: closure.requiredInputIds,
  inputs: closure.inputs,
});

export const computeNhm2SemiclassicalV3ConstraintScientificInputClosureSha256 =
  (closure: Nhm2SemiclassicalV3ConstraintScientificInputClosureV1): string =>
    sha256CanonicalJson(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_SHA256_DOMAIN,
      scientificInputClosurePayload(closure),
    );

const completeInputClosurePayload = (
  closure: Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1,
) => ({
  artifactId: closure.artifactId,
  contractVersion: closure.contractVersion,
  requiredInputIds: closure.requiredInputIds,
  inputs: closure.inputs,
  scientificInputClosureSha256: closure.scientificInputClosureSha256,
  frozenAt: closure.frozenAt,
});

export const computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256 = (
  closure: Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1,
): string =>
  sha256CanonicalJson(
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_SHA256_DOMAIN,
    completeInputClosurePayload(closure),
  );

export const computeNhm2SemiclassicalV3ConstraintScientificPresealSealKey = (
  binding: Readonly<{
    presealId: string;
    candidateId: string;
    candidateManifestSha256: string;
    scientificInputClosureSha256: string;
  }>,
): string =>
  sha256CanonicalJson(NHM2_SEMICLASSICAL_V3_CONSTRAINT_PRESEAL_SHA256_DOMAIN, {
    presealId: binding.presealId,
    candidateId: binding.candidateId,
    candidateManifestSha256: binding.candidateManifestSha256,
    scientificInputClosureSha256: binding.scientificInputClosureSha256,
  });

const operandInventoryPayload = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
) => ({
  artifactId: manifest.artifactId,
  contractVersion: manifest.contractVersion,
  generatedAt: manifest.generatedAt,
  replayEpochPolicyBinding: manifest.replayEpochPolicyBinding,
  constraintArithmeticPolicyBinding: manifest.constraintArithmeticPolicyBinding,
  candidateBinding: manifest.candidateBinding,
  scientificInputClosure: manifest.scientificInputClosure,
  completeInputClosure: manifest.completeInputClosure,
  implementation: manifest.implementation,
  execution: manifest.execution,
  levels: manifest.levels,
  claimLocks: manifest.claimLocks,
  schemaBoundary: manifest.schemaBoundary,
});

export const computeNhm2SemiclassicalV3ConstraintOperandInventorySha256 = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
): string =>
  sha256CanonicalJson(
    NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
    operandInventoryPayload(manifest),
  );

export const collectNhm2SemiclassicalV3ConstraintOperandArrays = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
): Nhm2SemiclassicalV3ConstraintOperandArrayV1[] =>
  manifest.levels.flatMap((level) =>
    level.families.flatMap((family) => family.operands),
  );

const deepFreeze = <T>(value: T): T => {
  if (value != null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
};

const assertPlainDataGraph = (value: unknown, visited: Set<object>): void => {
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
  if (typeof value !== "object") throw new TypeError("non_plain_data_value");
  if (visited.has(value)) throw new TypeError("repeated_object_identity");
  visited.add(value);

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
      assertPlainDataGraph(descriptor.value, visited);
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
    assertPlainDataGraph(descriptor.value, visited);
  }
};

const detachedPlainDataSnapshotOnce = (input: unknown): unknown => {
  assertPlainDataGraph(input, new Set<object>());
  const snapshot = structuredClone(input);
  assertPlainDataGraph(snapshot, new Set<object>());
  return deepFreeze(snapshot);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;
const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Reflect.ownKeys(value);
  return (
    actual.length === expected.length &&
    actual.every((key) => typeof key === "string" && expected.includes(key))
  );
};
const arraysEqual = (left: unknown, right: readonly unknown[]): boolean =>
  Array.isArray(left) &&
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);
const recordsEqual = (left: unknown, right: Record<string, unknown>): boolean =>
  isRecord(left) &&
  hasExactKeys(left, Object.keys(right)) &&
  Object.entries(right).every(([key, value]) => left[key] === value);
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isGitCommitSha = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
const isNonemptyString = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 2048 &&
  !/[\u0000-\u001f\u007f]/.test(value);
const timestampMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
};
const isPortableRelativePath = (value: unknown): value is string => {
  if (!isNonemptyString(value) || value.includes("\\") || value.startsWith("/"))
    return false;
  if (/^[A-Za-z]:/.test(value)) return false;
  return value
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );
};

const graphContainsLegacyV1V2Identity = (value: unknown): boolean => {
  if (typeof value === "string") {
    return /(?:nhm2[._/-](?:[a-z0-9._/-]*?)semiclassical[._/-]v[12]|nhm2_semiclassical_v[12]|nhm2\.semiclassical_v[12])/i.test(
      value,
    );
  }
  if (Array.isArray(value)) return value.some(graphContainsLegacyV1V2Identity);
  if (isRecord(value)) {
    return Object.values(value).some(graphContainsLegacyV1V2Identity);
  }
  return false;
};

const LEGACY_ALIAS_KEYS = new Set([
  "central",
  "centrallevel",
  "centralresidual",
  "regulator",
  "regulators",
  "regulatorlevel",
  "regulatorlevels",
  "aggregateregulator",
]);
const graphContainsLegacyAliasKey = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(graphContainsLegacyAliasKey);
  if (!isRecord(value)) return false;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (LEGACY_ALIAS_KEYS.has(normalized)) return true;
    if (graphContainsLegacyAliasKey(entry)) return true;
  }
  return false;
};
const containsLegacyAliasToken = (value: unknown): boolean =>
  typeof value === "string" &&
  /(?:^|[./_-])(?:central(?:_?level|_?residual)?|regulators?|regulator_?(?:level_?)?[012])(?:$|[./_-])/i.test(
    value,
  );

const unique = (values: readonly string[]): string[] => [...new Set(values)];

/**
 * Snapshots the caller graph exactly once, validates only the detached frozen
 * data, and returns that snapshot for server consumers. A clean result is
 * schema conformance only; it establishes no filesystem or replay authority.
 */
export const validateNhm2SemiclassicalV3ConstraintOperandManifest = (
  input: unknown,
): Nhm2SemiclassicalV3ConstraintOperandManifestValidationResult => {
  let raw: unknown;
  try {
    raw = detachedPlainDataSnapshotOnce(input);
  } catch {
    return Object.freeze({
      ok: false as const,
      manifest: null,
      violations: Object.freeze(["manifest_plain_data_snapshot_invalid"]),
    });
  }

  const violations: string[] = [];
  try {
    if (graphContainsLegacyV1V2Identity(raw)) {
      violations.push("legacy_v1_v2_identity_rejected");
    }
    if (graphContainsLegacyAliasKey(raw)) {
      violations.push("legacy_central_or_regulator_alias_rejected");
    }
    if (!isRecord(raw) || !hasExactKeys(raw, ROOT_KEYS)) {
      return Object.freeze({
        ok: false as const,
        manifest: null,
        violations: Object.freeze(
          unique([...violations, "manifest_shape_invalid"]),
        ),
      });
    }
    if (
      raw.artifactId !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID ||
      raw.contractVersion !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION
    ) {
      violations.push("artifact_identity_invalid");
    }

    if (
      !isRecord(raw.replayEpochPolicyBinding) ||
      !hasExactKeys(raw.replayEpochPolicyBinding, EPOCH_BINDING_KEYS) ||
      !recordsEqual(
        raw.replayEpochPolicyBinding,
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
      )
    ) {
      violations.push("replay_epoch_policy_binding_invalid");
    }
    if (
      !isRecord(raw.constraintArithmeticPolicyBinding) ||
      !hasExactKeys(
        raw.constraintArithmeticPolicyBinding,
        ARITHMETIC_BINDING_KEYS,
      ) ||
      !recordsEqual(
        raw.constraintArithmeticPolicyBinding,
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
      )
    ) {
      violations.push("constraint_arithmetic_policy_binding_invalid");
    }

    const generatedAt = timestampMs(raw.generatedAt);
    const scientificInputClosure = isRecord(raw.scientificInputClosure)
      ? raw.scientificInputClosure
      : null;
    const completeInputClosure = isRecord(raw.completeInputClosure)
      ? raw.completeInputClosure
      : null;
    const completeInputFrozenAt =
      completeInputClosure == null
        ? null
        : timestampMs(completeInputClosure.frozenAt);
    const candidate = isRecord(raw.candidateBinding)
      ? raw.candidateBinding
      : null;
    const preseal =
      candidate != null && isRecord(candidate.scientificPresealBinding)
        ? candidate.scientificPresealBinding
        : null;
    const sealedAt = preseal == null ? null : timestampMs(preseal.sealedAt);
    const execution = isRecord(raw.execution) ? raw.execution : null;
    const startedAt =
      execution == null ? null : timestampMs(execution.startedAt);
    const completedAt =
      execution == null ? null : timestampMs(execution.completedAt);

    if (
      scientificInputClosure == null ||
      !hasExactKeys(scientificInputClosure, SCIENTIFIC_INPUT_CLOSURE_KEYS) ||
      scientificInputClosure.artifactId !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID ||
      scientificInputClosure.contractVersion !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION ||
      !arraysEqual(
        scientificInputClosure.requiredInputIds,
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
      ) ||
      !Array.isArray(scientificInputClosure.inputs) ||
      scientificInputClosure.inputs.length !==
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length ||
      !isSha256(scientificInputClosure.sha256)
    ) {
      violations.push("scientific_input_closure_shape_invalid");
    }
    if (
      completeInputClosure == null ||
      !hasExactKeys(completeInputClosure, COMPLETE_INPUT_CLOSURE_KEYS) ||
      completeInputClosure.artifactId !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID ||
      completeInputClosure.contractVersion !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION ||
      !arraysEqual(
        completeInputClosure.requiredInputIds,
        NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
      ) ||
      !Array.isArray(completeInputClosure.inputs) ||
      completeInputClosure.inputs.length !==
        NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length ||
      !isSha256(completeInputClosure.scientificInputClosureSha256) ||
      scientificInputClosure == null ||
      completeInputClosure.scientificInputClosureSha256 !==
        scientificInputClosure.sha256 ||
      completeInputFrozenAt == null ||
      !isSha256(completeInputClosure.sha256)
    ) {
      violations.push("complete_input_closure_shape_invalid");
    }

    const scientificInputDescriptors =
      scientificInputClosure != null &&
      Array.isArray(scientificInputClosure.inputs)
        ? scientificInputClosure.inputs
        : [];
    const scientificInputById = new Map<string, Record<string, unknown>>();
    for (
      let index = 0;
      index < NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length;
      index += 1
    ) {
      const expectedInputId = NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS[index];
      const descriptor = isRecord(scientificInputDescriptors[index])
        ? scientificInputDescriptors[index]
        : null;
      if (
        descriptor == null ||
        !hasExactKeys(descriptor, INPUT_DESCRIPTOR_KEYS) ||
        descriptor.inputId !== expectedInputId ||
        !isNonemptyString(descriptor.identityId) ||
        !isSha256(descriptor.sha256) ||
        !Number.isSafeInteger(descriptor.sizeBytes) ||
        !(Number(descriptor.sizeBytes) > 0) ||
        timestampMs(descriptor.observedAt) == null ||
        sealedAt == null ||
        !(timestampMs(descriptor.observedAt)! <= sealedAt)
      ) {
        violations.push(
          `scientific_input_descriptor_invalid:/scientificInputClosure/inputs/${index}`,
        );
      } else {
        scientificInputById.set(expectedInputId, descriptor);
      }
    }
    if (
      scientificInputById.size !==
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length ||
      new Set(
        [...scientificInputById.values()].map((descriptor) =>
          String(descriptor.identityId).toLocaleLowerCase("en-US"),
        ),
      ).size !== scientificInputById.size
    ) {
      violations.push("scientific_input_closure_identity_uniqueness_invalid");
    }
    if (
      scientificInputClosure != null &&
      isSha256(scientificInputClosure.sha256)
    ) {
      try {
        if (
          scientificInputClosure.sha256 !==
          computeNhm2SemiclassicalV3ConstraintScientificInputClosureSha256(
            scientificInputClosure as Nhm2SemiclassicalV3ConstraintScientificInputClosureV1,
          )
        ) {
          violations.push("scientific_input_closure_sha256_mismatch");
        }
      } catch {
        violations.push("scientific_input_closure_sha256_unrecomputable");
      }
    }

    const completeInputDescriptors =
      completeInputClosure != null && Array.isArray(completeInputClosure.inputs)
        ? completeInputClosure.inputs
        : [];
    const completeInputById = new Map<string, Record<string, unknown>>();
    for (
      let index = 0;
      index < NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length;
      index += 1
    ) {
      const expectedInputId = NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS[index];
      const descriptor = isRecord(completeInputDescriptors[index])
        ? completeInputDescriptors[index]
        : null;
      const observedAt =
        descriptor == null ? null : timestampMs(descriptor.observedAt);
      const isScientific =
        index < NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length;
      if (
        descriptor == null ||
        !hasExactKeys(descriptor, INPUT_DESCRIPTOR_KEYS) ||
        descriptor.inputId !== expectedInputId ||
        !isNonemptyString(descriptor.identityId) ||
        !isSha256(descriptor.sha256) ||
        !Number.isSafeInteger(descriptor.sizeBytes) ||
        !(Number(descriptor.sizeBytes) > 0) ||
        observedAt == null ||
        (isScientific
          ? sealedAt == null || !(observedAt <= sealedAt)
          : completeInputFrozenAt == null ||
            !(observedAt <= completeInputFrozenAt))
      ) {
        violations.push(
          `complete_input_descriptor_invalid:/completeInputClosure/inputs/${index}`,
        );
      } else {
        completeInputById.set(expectedInputId, descriptor);
      }
    }
    if (
      completeInputById.size !==
        NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.length ||
      new Set(
        [...completeInputById.values()].map((descriptor) =>
          String(descriptor.identityId).toLocaleLowerCase("en-US"),
        ),
      ).size !== completeInputById.size
    ) {
      violations.push("complete_input_closure_identity_uniqueness_invalid");
    }
    if (
      JSON.stringify(
        canonicalizeJson(
          completeInputDescriptors.slice(
            0,
            NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length,
          ),
        ),
      ) !== JSON.stringify(canonicalizeJson(scientificInputDescriptors))
    ) {
      violations.push("complete_scientific_input_prefix_mismatch");
    }
    if (
      sealedAt == null ||
      completeInputFrozenAt == null ||
      startedAt == null ||
      !(sealedAt <= completeInputFrozenAt && completeInputFrozenAt < startedAt)
    ) {
      violations.push("complete_input_closure_chronology_invalid");
    }
    if (completeInputClosure != null && isSha256(completeInputClosure.sha256)) {
      try {
        if (
          completeInputClosure.sha256 !==
          computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256(
            completeInputClosure as Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1,
          )
        ) {
          violations.push("complete_input_closure_sha256_mismatch");
        }
      } catch {
        violations.push("complete_input_closure_sha256_unrecomputable");
      }
    }

    const candidateManifestInput =
      scientificInputById.get("candidate_manifest");
    if (
      candidate == null ||
      !hasExactKeys(candidate, CANDIDATE_KEYS) ||
      !isNonemptyString(candidate.candidateId) ||
      !isSha256(candidate.candidateManifestSha256) ||
      !isSha256(candidate.scientificInputClosureSha256) ||
      scientificInputClosure == null ||
      candidate.scientificInputClosureSha256 !==
        scientificInputClosure.sha256 ||
      candidateManifestInput == null ||
      candidateManifestInput.identityId !== candidate.candidateId ||
      candidateManifestInput.sha256 !== candidate.candidateManifestSha256 ||
      preseal == null
    ) {
      violations.push("candidate_binding_invalid");
    }
    if (
      candidate == null ||
      preseal == null ||
      !hasExactKeys(preseal, PRESEAL_KEYS) ||
      preseal.artifactId !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID ||
      preseal.contractVersion !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION ||
      !isNonemptyString(preseal.presealId) ||
      !isSha256(preseal.sealKey) ||
      preseal.candidateId !== candidate?.candidateId ||
      preseal.candidateManifestSha256 !== candidate?.candidateManifestSha256 ||
      preseal.scientificInputClosureSha256 !==
        candidate?.scientificInputClosureSha256 ||
      sealedAt == null ||
      preseal.sealKey !==
        computeNhm2SemiclassicalV3ConstraintScientificPresealSealKey({
          presealId:
            typeof preseal.presealId === "string"
              ? preseal.presealId
              : "invalid",
          candidateId:
            typeof candidate?.candidateId === "string"
              ? candidate.candidateId
              : "invalid",
          candidateManifestSha256:
            typeof candidate?.candidateManifestSha256 === "string"
              ? candidate.candidateManifestSha256
              : "invalid",
          scientificInputClosureSha256:
            typeof candidate?.scientificInputClosureSha256 === "string"
              ? candidate.scientificInputClosureSha256
              : "invalid",
        })
    ) {
      violations.push("scientific_preseal_binding_invalid");
    }

    const implementation = isRecord(raw.implementation)
      ? raw.implementation
      : null;
    if (
      implementation == null ||
      !hasExactKeys(implementation, IMPLEMENTATION_KEYS) ||
      !isNonemptyString(implementation.comparisonPairId) ||
      (implementation.role !== "primary" &&
        implementation.role !== "independent") ||
      !isNonemptyString(implementation.implementationId) ||
      !isNonemptyString(implementation.sourceIdentityId) ||
      !isSha256(implementation.sourceSha256) ||
      !isNonemptyString(implementation.dependencyLockIdentityId) ||
      !isSha256(implementation.dependencyLockSha256) ||
      !isNonemptyString(implementation.executableIdentityId) ||
      !isSha256(implementation.executableSha256)
    ) {
      violations.push("implementation_binding_invalid");
    }
    const implementationLinks = [
      ["implementation_source", "sourceIdentityId", "sourceSha256"],
      ["dependency_lock", "dependencyLockIdentityId", "dependencyLockSha256"],
      ["executable", "executableIdentityId", "executableSha256"],
    ] as const;
    if (implementation != null) {
      for (const [inputId, identityKey, shaKey] of implementationLinks) {
        const descriptor = completeInputById.get(inputId);
        if (
          descriptor == null ||
          descriptor.identityId !== implementation[identityKey] ||
          descriptor.sha256 !== implementation[shaKey]
        ) {
          violations.push(`implementation_input_binding_invalid:${inputId}`);
        }
      }
    }

    if (
      execution == null ||
      !hasExactKeys(execution, EXECUTION_KEYS) ||
      !isNonemptyString(execution.runId) ||
      !isGitCommitSha(execution.commitSha) ||
      !isNonemptyString(execution.command) ||
      !Array.isArray(execution.argv) ||
      execution.argv.some((entry) => !isNonemptyString(entry)) ||
      !isPortableRelativePath(execution.outputDirectory) ||
      startedAt == null ||
      completedAt == null ||
      generatedAt == null ||
      sealedAt == null ||
      !(
        sealedAt < startedAt &&
        startedAt < completedAt &&
        completedAt <= generatedAt
      ) ||
      !Number.isSafeInteger(execution.durationMs) ||
      execution.durationMs !== completedAt - startedAt ||
      execution.exitCode !== 0 ||
      execution.terminationSignal !== null
    ) {
      violations.push("execution_binding_or_chronology_invalid");
    }

    const levels = Array.isArray(raw.levels) ? raw.levels : [];
    if (levels.length !== NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS.length) {
      violations.push("level_count_invalid");
    }
    const paths: string[] = [];
    let operandCount = 0;
    for (
      let levelIndex = 0;
      levelIndex < NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS.length;
      levelIndex += 1
    ) {
      const expectedLevel = NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS[levelIndex];
      const level = isRecord(levels[levelIndex]) ? levels[levelIndex] : null;
      if (
        level != null &&
        (containsLegacyAliasToken(level.levelId) ||
          containsLegacyAliasToken(level.hExact))
      ) {
        violations.push("legacy_central_or_regulator_alias_rejected");
      }
      if (
        level == null ||
        !hasExactKeys(level, LEVEL_KEYS) ||
        level.ordinal !== expectedLevel.ordinal ||
        level.levelId !== expectedLevel.levelId ||
        level.hExact !== expectedLevel.hExact ||
        level.h !== expectedLevel.h
      ) {
        violations.push(`level_binding_invalid:/levels/${levelIndex}`);
      }
      const families =
        level != null && Array.isArray(level.families) ? level.families : [];
      if (
        families.length !== NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER.length
      ) {
        violations.push(`family_count_invalid:/levels/${levelIndex}`);
      }
      for (
        let familyIndex = 0;
        familyIndex < NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER.length;
        familyIndex += 1
      ) {
        const familyId =
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER[familyIndex];
        const roleOrder = NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER[familyId];
        const family = isRecord(families[familyIndex])
          ? families[familyIndex]
          : null;
        const familyPointer = `/levels/${levelIndex}/families/${familyIndex}`;
        if (
          family == null ||
          !hasExactKeys(family, FAMILY_KEYS) ||
          family.familyId !== familyId ||
          !arraysEqual(family.operandOrder, roleOrder) ||
          family.residualFormula !==
            NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY.residualFormulas[
              familyId
            ]
        ) {
          violations.push(`family_binding_invalid:${familyPointer}`);
        }
        const operands =
          family != null && Array.isArray(family.operands)
            ? family.operands
            : [];
        if (operands.length !== roleOrder.length) {
          violations.push(`operand_count_invalid:${familyPointer}`);
        }
        for (let roleIndex = 0; roleIndex < roleOrder.length; roleIndex += 1) {
          operandCount += 1;
          const operand = isRecord(operands[roleIndex])
            ? operands[roleIndex]
            : null;
          const pointer = `${familyPointer}/operands/${roleIndex}`;
          const role = roleOrder[roleIndex];
          const expectedArrayRole = `constraint_operand.${expectedLevel.levelId}.${familyId}.${role}`;
          const outputDirectory =
            execution != null && typeof execution.outputDirectory === "string"
              ? execution.outputDirectory
              : null;
          const expectedPath =
            outputDirectory == null
              ? null
              : `${outputDirectory}/${expectedLevel.levelId}/${familyId}/${role}.f64le`;
          if (operand != null) {
            if (
              containsLegacyAliasToken(operand.arrayRole) ||
              containsLegacyAliasToken(operand.operandRole) ||
              containsLegacyAliasToken(operand.path)
            ) {
              violations.push("legacy_central_or_regulator_alias_rejected");
            }
            if (typeof operand.path === "string") paths.push(operand.path);
          }
          const observedAt =
            operand == null ? null : timestampMs(operand.observedAt);
          if (
            operand == null ||
            !hasExactKeys(operand, OPERAND_KEYS) ||
            operand.arrayRole !== expectedArrayRole ||
            operand.operandRole !== role ||
            expectedPath == null ||
            operand.path !== expectedPath ||
            !isPortableRelativePath(operand.path) ||
            !isSha256(operand.sha256) ||
            operand.sizeBytes !==
              NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES ||
            operand.freshness !== "new" ||
            observedAt == null ||
            completedAt == null ||
            generatedAt == null ||
            !(completedAt <= observedAt && observedAt <= generatedAt) ||
            preseal == null ||
            operand.scientificPresealSealKey !== preseal.sealKey ||
            operand.dtype !== "float64" ||
            operand.binaryEncoding !== "raw_ieee754" ||
            operand.endianness !== "little" ||
            !arraysEqual(operand.shape, [64, 4]) ||
            operand.storageOrder !== "row-major" ||
            !arraysEqual(
              operand.componentOrder,
              NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER,
            ) ||
            operand.sampleOrder !== "candidate_sampling_ordinal_0_to_63" ||
            operand.unit !== "dimensionless_barred_constraint_generator"
          ) {
            violations.push(`operand_descriptor_invalid:${pointer}`);
          }
        }
      }
    }
    if (
      operandCount !== NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT ||
      operandCount !==
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS.length *
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL
    ) {
      violations.push("operand_inventory_cardinality_invalid");
    }
    if (
      new Set(paths.map((path) => path.toLocaleLowerCase("en-US"))).size !==
      paths.length
    ) {
      violations.push("operand_paths_not_unique");
    }
    const manifestArrayRoles = levels.flatMap((level) =>
      isRecord(level) && Array.isArray(level.families)
        ? level.families.flatMap((family) =>
            isRecord(family) && Array.isArray(family.operands)
              ? family.operands.map((operand) =>
                  isRecord(operand) ? operand.arrayRole : null,
                )
              : [],
          )
        : [],
    );
    if (
      !arraysEqual(
        manifestArrayRoles,
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
      )
    ) {
      violations.push("constraint_array_role_order_invalid");
    }

    if (!isSha256(raw.operandInventorySha256)) {
      violations.push("operand_inventory_sha256_invalid");
    } else {
      try {
        const recomputed =
          computeNhm2SemiclassicalV3ConstraintOperandInventorySha256(
            raw as Nhm2SemiclassicalV3ConstraintOperandManifestV1,
          );
        if (raw.operandInventorySha256 !== recomputed) {
          violations.push("operand_inventory_sha256_mismatch");
        }
      } catch {
        violations.push("operand_inventory_sha256_unrecomputable");
      }
    }
    if (
      !recordsEqual(
        raw.claimLocks,
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
      )
    ) {
      violations.push("epoch_claim_locks_invalid");
    }
    if (
      !recordsEqual(
        raw.schemaBoundary,
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
      )
    ) {
      violations.push("schema_boundary_invalid");
    }
  } catch {
    violations.push("manifest_validation_exception");
  }

  const finalViolations = Object.freeze(unique(violations));
  if (finalViolations.length > 0) {
    return Object.freeze({
      ok: false as const,
      manifest: null,
      violations: finalViolations,
    });
  }
  return Object.freeze({
    ok: true as const,
    manifest: raw as Nhm2SemiclassicalV3ConstraintOperandManifestV1,
    violations: Object.freeze([]) as readonly [],
  });
};

/** Structural/schema violations only; this function grants no authority. */
export const nhm2SemiclassicalV3ConstraintOperandManifestViolations = (
  input: unknown,
): readonly string[] =>
  validateNhm2SemiclassicalV3ConstraintOperandManifest(input).violations;

/** Structural conformance only; never server-origin or replay authority. */
export const isNhm2SemiclassicalV3ConstraintOperandManifest = (
  input: unknown,
): input is Nhm2SemiclassicalV3ConstraintOperandManifestV1 =>
  validateNhm2SemiclassicalV3ConstraintOperandManifest(input).ok;
