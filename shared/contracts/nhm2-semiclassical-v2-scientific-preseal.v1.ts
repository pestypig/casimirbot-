import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
  canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson,
  computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256,
  nhm2SemiclassicalV2ScientificCandidateManifestViolations,
  type Nhm2SemiclassicalV2ScientificCandidateInputV1,
  type Nhm2SemiclassicalV2ScientificCandidateManifestV1,
} from "./nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID =
  "nhm2.semiclassical_v2_scientific_preseal" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_scientific_preseal/v2" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY =
  "server_owned" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE =
  "server_only" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CONTENT_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-scientific-content/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_SEALED_INVENTORY_SHA256_DOMAIN =
  "nhm2-semiclassical-v2-sealed-inventory/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_DETERMINISTIC_SEAL_KEY_DOMAIN =
  "nhm2-semiclassical-v2-deterministic-seal-key/v2\n" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_PLAN_ROLES = [
  "primary",
  "independent",
] as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID =
  "server_recomputed_all_admitted_samples_metric_demand_lower_bound_screen/v2" as const;

export type Nhm2SemiclassicalV2ScientificCandidateManifestDescriptorV1 = {
  descriptorKind: "scientific_candidate_manifest";
  scientificInputId: "candidate_manifest";
  artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION;
  candidateId: string;
  candidateManifestId: string;
  candidateFrozenAt: string;
};

export type Nhm2SemiclassicalV2ScientificCandidateManifestStagedInputV1 = {
  inputId: "candidate_manifest";
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  mediaType: "application/json";
  descriptor: Nhm2SemiclassicalV2ScientificCandidateManifestDescriptorV1;
};

export type Nhm2SemiclassicalV2ScientificPresealStagedInputV1 =
  | Nhm2SemiclassicalV2ScientificCandidateManifestStagedInputV1
  | Nhm2SemiclassicalV2ScientificCandidateInputV1;

export type Nhm2SemiclassicalV2ScientificPresealPlanV1 = {
  role: (typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_PLAN_ROLES)[number];
  planId: string;
  scientificRootDirectory: string;
  scientificRootAccess: "read_only_exact_sealed_inventory";
  implementationRootDirectory: string;
  outputDirectory: string;
  counterpartOutputs: "not_mounted";
  ambientRepository: "not_mounted";
};

export type Nhm2SemiclassicalV2ScientificPresealV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION;
  authority: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY;
  consumerScope: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE;
  sealKey: string;
  candidateFrozenAt: string;
  sealedAt: string;
  candidateBinding: {
    candidateId: string;
    candidateManifestId: string;
    candidateManifestInputId: "candidate_manifest";
    candidateManifestSha256: string;
    candidateManifestSizeBytes: number;
  };
  sealedScientificRootDirectory: string;
  stagedInputs: Nhm2SemiclassicalV2ScientificPresealStagedInputV1[];
  scientificContentSha256: string;
  approvedReplayPolicy: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING;
  metricDemandDerivationBinding: {
    inputId: "metric_demand_derivation_receipt";
    sha256: string;
    artifactId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION;
    metricDemandInputId: "metric_demand_tensor";
    metricDemandSha256: string;
    errorBoundInputId: "metric_demand_absolute_error_bound";
    errorBoundSha256: string;
    enclosureMethod: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD;
    coverage: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE;
    relativeEnclosureTarget: 0.01;
    verificationStatus: "metric_demand_derivation_executor_provenance_unverified";
    blockers: [
      "metric_demand_derivation_executor_provenance_unverified",
      "interval_trace_not_server_replayed",
    ];
  };
  metricDemandNondegeneracy: {
    screenId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID;
    authority: "server_recomputed_from_staged_metric_and_error_float64_bytes";
    inputId: "metric_demand_tensor";
    metricDemandSha256: string;
    errorBoundInputId: "metric_demand_absolute_error_bound";
    metricDemandAbsoluteErrorBoundSha256: string;
    algorithm: "stable_scaled_symmetric_tensor_frobenius_lower_bound_per_sample_float64_v2";
    sampleCount: 64;
    componentCount: 10;
    valueCount: 640;
    finiteValueCount: 640;
    errorBoundValueCount: 640;
    finiteErrorBoundValueCount: 640;
    minimumMetricDemandFrobeniusSI: number;
    requiredNondegenerateSampleFraction: number;
    observedNondegenerateSampleCount: number;
    observedNondegenerateSampleFraction: number;
    minimumObservedSampleFrobeniusSI: number;
    maximumObservedSampleFrobeniusSI: number;
    minimumObservedSampleFrobeniusLowerBoundSI: number;
    maximumObservedSampleErrorBoundFrobeniusSI: number;
    maximumAllowedRelativeErrorBound: 0.01;
    maximumObservedRelativeErrorBound: number;
    allSamplesWithinRelativeErrorBound: true;
    globalMetricDemandFrobeniusSI: number;
    allValuesFinite: true;
    allErrorBoundsFiniteAndNonnegative: true;
    allErrorBoundsStrictlyPositive: true;
    passesFrozenScreen: true;
    regionalPhysicalNondegeneracyAuthority: false;
  };
  runPlans: [
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
    Nhm2SemiclassicalV2ScientificPresealPlanV1,
  ];
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS;
  sealedInventorySha256: string;
};

export type Nhm2SemiclassicalV2ScientificPresealUnsignedV1 = Omit<
  Nhm2SemiclassicalV2ScientificPresealV1,
  "sealedInventorySha256"
>;

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "authority",
  "consumerScope",
  "sealKey",
  "candidateFrozenAt",
  "sealedAt",
  "candidateBinding",
  "sealedScientificRootDirectory",
  "stagedInputs",
  "scientificContentSha256",
  "approvedReplayPolicy",
  "metricDemandDerivationBinding",
  "metricDemandNondegeneracy",
  "runPlans",
  "claimLocks",
  "sealedInventorySha256",
] as const;
const CANDIDATE_BINDING_KEYS = [
  "candidateId",
  "candidateManifestId",
  "candidateManifestInputId",
  "candidateManifestSha256",
  "candidateManifestSizeBytes",
] as const;
const INPUT_KEYS = [
  "inputId",
  "relativePath",
  "sha256",
  "sizeBytes",
  "mediaType",
  "descriptor",
] as const;
const CANDIDATE_MANIFEST_DESCRIPTOR_KEYS = [
  "descriptorKind",
  "scientificInputId",
  "artifactId",
  "contractVersion",
  "candidateId",
  "candidateManifestId",
  "candidateFrozenAt",
] as const;
const GENERIC_DESCRIPTOR_KEYS = [
  "descriptorKind",
  "scientificInputId",
  "artifactId",
  "contractVersion",
  "scientificObjectId",
] as const;
const POLICY_DESCRIPTOR_KEYS = [
  "descriptorKind",
  "scientificInputId",
  "artifactId",
  "contractVersion",
  "policyId",
] as const;
const METRIC_DESCRIPTOR_KEYS = [
  "descriptorKind",
  "scientificInputId",
  "dtype",
  "binaryEncoding",
  "endianness",
  "shape",
  "storageOrder",
  "componentOrder",
  "unit",
] as const;
const APPROVED_POLICY_KEYS = [
  "artifactId",
  "contractVersion",
  "policyId",
  "sha256",
  "sizeBytes",
  "mediaType",
] as const;
const METRIC_DERIVATION_BINDING_KEYS = [
  "inputId",
  "sha256",
  "artifactId",
  "contractVersion",
  "metricDemandInputId",
  "metricDemandSha256",
  "errorBoundInputId",
  "errorBoundSha256",
  "enclosureMethod",
  "coverage",
  "relativeEnclosureTarget",
  "verificationStatus",
  "blockers",
] as const;
const NONDEGENERACY_KEYS = [
  "screenId",
  "authority",
  "inputId",
  "metricDemandSha256",
  "errorBoundInputId",
  "metricDemandAbsoluteErrorBoundSha256",
  "algorithm",
  "sampleCount",
  "componentCount",
  "valueCount",
  "finiteValueCount",
  "errorBoundValueCount",
  "finiteErrorBoundValueCount",
  "minimumMetricDemandFrobeniusSI",
  "requiredNondegenerateSampleFraction",
  "observedNondegenerateSampleCount",
  "observedNondegenerateSampleFraction",
  "minimumObservedSampleFrobeniusSI",
  "maximumObservedSampleFrobeniusSI",
  "minimumObservedSampleFrobeniusLowerBoundSI",
  "maximumObservedSampleErrorBoundFrobeniusSI",
  "maximumAllowedRelativeErrorBound",
  "maximumObservedRelativeErrorBound",
  "allSamplesWithinRelativeErrorBound",
  "globalMetricDemandFrobeniusSI",
  "allValuesFinite",
  "allErrorBoundsFiniteAndNonnegative",
  "allErrorBoundsStrictlyPositive",
  "passesFrozenScreen",
  "regionalPhysicalNondegeneracyAuthority",
] as const;
const PLAN_KEYS = [
  "role",
  "planId",
  "scientificRootDirectory",
  "scientificRootAccess",
  "implementationRootDirectory",
  "outputDirectory",
  "counterpartOutputs",
  "ambientRepository",
] as const;
const CLAIM_LOCK_KEYS = Object.keys(
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
);

const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => expected.includes(key))
  );
};
const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 512 &&
  value.trim() === value &&
  IDENTIFIER.test(value) &&
  !value.includes("//");
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
};
const isPortableRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 1024 &&
  value.trim() === value &&
  !value.includes("\\") &&
  !value.includes("\0") &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  !value.includes("//") &&
  value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
const caseFold = (value: string): string => value.toLocaleLowerCase("en-US");
const portablePathsOverlapCaseInsensitive = (
  left: string,
  right: string,
): boolean => {
  const foldedLeft = caseFold(left);
  const foldedRight = caseFold(right);
  return (
    foldedLeft === foldedRight ||
    foldedLeft.startsWith(`${foldedRight}/`) ||
    foldedRight.startsWith(`${foldedLeft}/`)
  );
};
const unique = (values: string[]): string[] => [...new Set(values)];

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
  }
  return value;
};
const sameCanonicalJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(canonicalizeJson(left)) ===
  JSON.stringify(canonicalizeJson(right));

const containsForbiddenLeverIdentity = (value: unknown): boolean => {
  if (typeof value === "string") {
    const folded = caseFold(value);
    return NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS.some((id) =>
      folded.includes(caseFold(id)),
    );
  }
  if (Array.isArray(value)) return value.some(containsForbiddenLeverIdentity);
  return (
    isRecord(value) && Object.values(value).some(containsForbiddenLeverIdentity)
  );
};

const scientificEntryDigestPayload = (
  entry: Nhm2SemiclassicalV2ScientificPresealStagedInputV1,
): unknown[] => [
  entry.inputId,
  entry.relativePath,
  entry.sha256,
  entry.sizeBytes,
  entry.mediaType,
  canonicalizeJson(entry.descriptor),
];

/**
 * This digest intentionally has no root or clock input. It identifies only the
 * exact ordered scientific bytes and their frozen descriptors.
 */
export const computeNhm2SemiclassicalV2ScientificContentSha256 = (
  entries: readonly Nhm2SemiclassicalV2ScientificPresealStagedInputV1[],
): string =>
  createHash("sha256")
    .update(NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CONTENT_SHA256_DOMAIN, "utf8")
    .update(JSON.stringify(entries.map(scientificEntryDigestPayload)), "utf8")
    .digest("hex");

/** One candidate identity has one deterministic seal key. */
export const computeNhm2SemiclassicalV2ScientificSealKey = (
  candidateId: string,
): string =>
  createHash("sha256")
    .update(NHM2_SEMICLASSICAL_V2_DETERMINISTIC_SEAL_KEY_DOMAIN, "utf8")
    .update(caseFold(candidateId), "utf8")
    .digest("hex");

/**
 * The sealed-inventory digest binds the content digest to the sealed root,
 * freeze/seal chronology, server certificate, and both planned lanes. Actual
 * persistence time belongs to a server readback receipt because it cannot be
 * truthfully embedded before the exclusive create has completed.
 */
export const computeNhm2SemiclassicalV2SealedInventorySha256 = (
  value: Nhm2SemiclassicalV2ScientificPresealUnsignedV1,
): string =>
  createHash("sha256")
    .update(NHM2_SEMICLASSICAL_V2_SEALED_INVENTORY_SHA256_DOMAIN, "utf8")
    .update(JSON.stringify(canonicalizeJson(value)), "utf8")
    .digest("hex");

const selfEntryViolations = (
  entry: unknown,
  candidateBinding: Record<string, unknown>,
  candidateFrozenAt: unknown,
): string[] => {
  if (!isRecord(entry) || !hasExactKeys(entry, INPUT_KEYS)) {
    return ["candidate_manifest_staged_input_shape_invalid"];
  }
  const descriptor = isRecord(entry.descriptor) ? entry.descriptor : null;
  if (
    entry.inputId !== "candidate_manifest" ||
    !isPortableRelativePath(entry.relativePath) ||
    !isSha256(entry.sha256) ||
    !Number.isSafeInteger(entry.sizeBytes) ||
    Number(entry.sizeBytes) <= 0 ||
    entry.mediaType !== "application/json" ||
    entry.sha256 !== candidateBinding.candidateManifestSha256 ||
    entry.sizeBytes !== candidateBinding.candidateManifestSizeBytes ||
    descriptor == null ||
    !hasExactKeys(descriptor, CANDIDATE_MANIFEST_DESCRIPTOR_KEYS) ||
    descriptor.descriptorKind !== "scientific_candidate_manifest" ||
    descriptor.scientificInputId !== "candidate_manifest" ||
    descriptor.artifactId !==
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID ||
    descriptor.contractVersion !==
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION ||
    descriptor.candidateId !== candidateBinding.candidateId ||
    descriptor.candidateManifestId !== candidateBinding.candidateManifestId ||
    descriptor.candidateFrozenAt !== candidateFrozenAt
  ) {
    return ["candidate_manifest_staged_input_binding_invalid"];
  }
  return [];
};

const genericStagedEntryViolations = (
  entry: unknown,
  expectedId: string,
  pointer: string,
): string[] => {
  if (!isRecord(entry) || !hasExactKeys(entry, INPUT_KEYS)) {
    return [`staged_input_shape_invalid:${pointer}`];
  }
  if (
    entry.inputId !== expectedId ||
    !isPortableRelativePath(entry.relativePath) ||
    !isSha256(entry.sha256) ||
    !Number.isSafeInteger(entry.sizeBytes) ||
    Number(entry.sizeBytes) <= 0 ||
    typeof entry.mediaType !== "string" ||
    entry.mediaType.length === 0 ||
    !isRecord(entry.descriptor)
  ) {
    return [`staged_input_binding_invalid:${pointer}`];
  }
  const descriptor = entry.descriptor;
  if (expectedId === "tolerance_policy") {
    if (
      !hasExactKeys(descriptor, POLICY_DESCRIPTOR_KEYS) ||
      descriptor.descriptorKind !== "approved_replay_policy" ||
      descriptor.scientificInputId !== expectedId ||
      descriptor.artifactId !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID ||
      descriptor.contractVersion !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION ||
      descriptor.policyId !== NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID ||
      entry.sha256 !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256 ||
      entry.sizeBytes !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes ||
      entry.mediaType !== "application/json"
    ) {
      return [`approved_policy_staged_descriptor_invalid:${pointer}`];
    }
    return [];
  }
  if (expectedId === "metric_demand_derivation_receipt") {
    if (
      !hasExactKeys(descriptor, GENERIC_DESCRIPTOR_KEYS) ||
      descriptor.descriptorKind !== "metric_demand_derivation_receipt" ||
      descriptor.scientificInputId !== expectedId ||
      descriptor.artifactId !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
      descriptor.contractVersion !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
      !isIdentifier(descriptor.scientificObjectId) ||
      entry.mediaType !== "application/json"
    ) {
      return [
        `metric_demand_derivation_receipt_staged_descriptor_invalid:${pointer}`,
      ];
    }
    return [];
  }
  if (
    expectedId === "metric_demand_tensor" ||
    expectedId === "metric_demand_absolute_error_bound"
  ) {
    const expectedDescriptorKind =
      expectedId === "metric_demand_tensor"
        ? "metric_demand_tensor_float64"
        : "metric_demand_absolute_error_bound_float64";
    if (
      !hasExactKeys(descriptor, METRIC_DESCRIPTOR_KEYS) ||
      descriptor.descriptorKind !== expectedDescriptorKind ||
      descriptor.scientificInputId !== expectedId ||
      descriptor.dtype !== "float64" ||
      descriptor.binaryEncoding !== "raw_ieee754" ||
      descriptor.endianness !== "little" ||
      !Array.isArray(descriptor.shape) ||
      descriptor.shape.length !== 2 ||
      descriptor.shape[0] !== 64 ||
      descriptor.shape[1] !== NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      descriptor.storageOrder !== "row-major" ||
      !Array.isArray(descriptor.componentOrder) ||
      descriptor.componentOrder.length !==
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      !descriptor.componentOrder.every(
        (component, index) =>
          component === NHM2_SEMICLASSICAL_TENSOR_COMPONENTS[index],
      ) ||
      descriptor.unit !== "J/m^3" ||
      entry.sizeBytes !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8 ||
      entry.mediaType !== "application/octet-stream"
    ) {
      return [`metric_demand_staged_descriptor_invalid:${pointer}`];
    }
    return [];
  }
  if (
    !hasExactKeys(descriptor, GENERIC_DESCRIPTOR_KEYS) ||
    descriptor.descriptorKind !== "frozen_scientific_artifact" ||
    descriptor.scientificInputId !== expectedId ||
    !isIdentifier(descriptor.artifactId) ||
    typeof descriptor.contractVersion !== "string" ||
    !/^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/.test(descriptor.contractVersion) ||
    !isIdentifier(descriptor.scientificObjectId)
  ) {
    return [`scientific_staged_descriptor_invalid:${pointer}`];
  }
  return [];
};

export const nhm2SemiclassicalV2ScientificPresealViolations = (
  value: unknown,
): string[] => {
  try {
    if (!isRecord(value)) return ["scientific_preseal_shape_invalid"];
    const violations: string[] = [];
    if (!hasExactKeys(value, ROOT_KEYS)) violations.push("root_keys_not_exact");
    if (
      value.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID ||
      value.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION ||
      value.authority !== NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY ||
      value.consumerScope !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE
    ) {
      violations.push("scientific_preseal_identity_invalid");
    }
    if (containsForbiddenLeverIdentity(value)) {
      violations.push("declared_lever_identity_forbidden");
    }

    const candidateFrozenAtMs = isIsoTimestamp(value.candidateFrozenAt)
      ? Date.parse(value.candidateFrozenAt)
      : Number.NaN;
    const sealedAtMs = isIsoTimestamp(value.sealedAt)
      ? Date.parse(value.sealedAt)
      : Number.NaN;
    if (
      !Number.isFinite(candidateFrozenAtMs) ||
      !Number.isFinite(sealedAtMs) ||
      !(candidateFrozenAtMs < sealedAtMs)
    ) {
      violations.push("freeze_seal_chronology_invalid");
    }

    const candidateBinding = isRecord(value.candidateBinding)
      ? value.candidateBinding
      : null;
    if (
      candidateBinding == null ||
      !hasExactKeys(candidateBinding, CANDIDATE_BINDING_KEYS) ||
      !isIdentifier(candidateBinding.candidateId) ||
      !isIdentifier(candidateBinding.candidateManifestId) ||
      candidateBinding.candidateManifestInputId !== "candidate_manifest" ||
      !isSha256(candidateBinding.candidateManifestSha256) ||
      !Number.isSafeInteger(candidateBinding.candidateManifestSizeBytes) ||
      Number(candidateBinding.candidateManifestSizeBytes) <= 0
    ) {
      violations.push("candidate_binding_invalid");
    } else if (
      value.sealKey !==
      computeNhm2SemiclassicalV2ScientificSealKey(candidateBinding.candidateId)
    ) {
      violations.push("deterministic_seal_key_invalid");
    }

    if (!isPortableRelativePath(value.sealedScientificRootDirectory)) {
      violations.push("sealed_scientific_root_invalid");
    }

    const entries = Array.isArray(value.stagedInputs) ? value.stagedInputs : [];
    if (
      entries.length !==
      NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length
    ) {
      violations.push("staged_input_count_invalid");
    }
    const paths: string[] = [];
    entries.forEach((entry, index) => {
      const expectedId =
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS[index];
      if (expectedId == null) {
        violations.push(`staged_input_unexpected:${index}`);
        return;
      }
      if (index === 0 && candidateBinding != null) {
        violations.push(
          ...selfEntryViolations(
            entry,
            candidateBinding,
            value.candidateFrozenAt,
          ),
        );
      } else {
        violations.push(
          ...genericStagedEntryViolations(
            entry,
            expectedId,
            `/stagedInputs/${index}`,
          ),
        );
      }
      if (isRecord(entry) && typeof entry.relativePath === "string") {
        paths.push(entry.relativePath);
      }
    });
    if (
      paths.some((path, index) =>
        paths
          .slice(index + 1)
          .some((other) => portablePathsOverlapCaseInsensitive(path, other)),
      )
    ) {
      violations.push("staged_input_paths_alias_case_insensitively");
    }
    if (
      entries.length ===
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.length &&
      value.scientificContentSha256 !==
        computeNhm2SemiclassicalV2ScientificContentSha256(
          entries as Nhm2SemiclassicalV2ScientificPresealStagedInputV1[],
        )
    ) {
      violations.push("scientific_content_sha256_mismatch");
    }

    const approvedPolicy = isRecord(value.approvedReplayPolicy)
      ? value.approvedReplayPolicy
      : null;
    if (
      approvedPolicy == null ||
      !hasExactKeys(approvedPolicy, APPROVED_POLICY_KEYS) ||
      !sameCanonicalJson(
        approvedPolicy,
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
      )
    ) {
      violations.push("approved_replay_policy_binding_invalid");
    }
    const toleranceEntry = entries.find(
      (entry) => isRecord(entry) && entry.inputId === "tolerance_policy",
    );
    if (
      !isRecord(toleranceEntry) ||
      toleranceEntry.sha256 !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256 ||
      toleranceEntry.sizeBytes !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes ||
      toleranceEntry.mediaType !== "application/json"
    ) {
      violations.push("approved_policy_staged_input_mismatch");
    }

    const metricEntry = entries.find(
      (entry) => isRecord(entry) && entry.inputId === "metric_demand_tensor",
    );
    const metricDescriptor =
      isRecord(metricEntry) && isRecord(metricEntry.descriptor)
        ? metricEntry.descriptor
        : null;
    if (
      !isRecord(metricEntry) ||
      metricDescriptor == null ||
      metricDescriptor.descriptorKind !== "metric_demand_tensor_float64" ||
      metricDescriptor.scientificInputId !== "metric_demand_tensor" ||
      metricDescriptor.dtype !== "float64" ||
      metricDescriptor.binaryEncoding !== "raw_ieee754" ||
      metricDescriptor.endianness !== "little" ||
      !Array.isArray(metricDescriptor.shape) ||
      metricDescriptor.shape.length !== 2 ||
      metricDescriptor.shape[0] !== 64 ||
      metricDescriptor.shape[1] !==
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      metricDescriptor.storageOrder !== "row-major" ||
      !Array.isArray(metricDescriptor.componentOrder) ||
      metricDescriptor.componentOrder.length !==
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      !metricDescriptor.componentOrder.every(
        (component, index) =>
          component === NHM2_SEMICLASSICAL_TENSOR_COMPONENTS[index],
      ) ||
      metricDescriptor.unit !== "J/m^3" ||
      metricEntry.sizeBytes !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8 ||
      metricEntry.mediaType !== "application/octet-stream"
    ) {
      violations.push("metric_demand_staged_descriptor_invalid");
    }
    const errorBoundEntry = entries.find(
      (entry) =>
        isRecord(entry) &&
        entry.inputId === "metric_demand_absolute_error_bound",
    );
    const errorBoundDescriptor =
      isRecord(errorBoundEntry) && isRecord(errorBoundEntry.descriptor)
        ? errorBoundEntry.descriptor
        : null;
    if (
      !isRecord(errorBoundEntry) ||
      errorBoundDescriptor == null ||
      errorBoundDescriptor.descriptorKind !==
        "metric_demand_absolute_error_bound_float64" ||
      errorBoundDescriptor.scientificInputId !==
        "metric_demand_absolute_error_bound" ||
      errorBoundDescriptor.dtype !== "float64" ||
      errorBoundDescriptor.binaryEncoding !== "raw_ieee754" ||
      errorBoundDescriptor.endianness !== "little" ||
      !Array.isArray(errorBoundDescriptor.shape) ||
      errorBoundDescriptor.shape.length !== 2 ||
      errorBoundDescriptor.shape[0] !== 64 ||
      errorBoundDescriptor.shape[1] !==
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      errorBoundDescriptor.storageOrder !== "row-major" ||
      !Array.isArray(errorBoundDescriptor.componentOrder) ||
      errorBoundDescriptor.componentOrder.length !==
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      !errorBoundDescriptor.componentOrder.every(
        (component, index) =>
          component === NHM2_SEMICLASSICAL_TENSOR_COMPONENTS[index],
      ) ||
      errorBoundDescriptor.unit !== "J/m^3" ||
      errorBoundEntry.sizeBytes !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8 ||
      errorBoundEntry.mediaType !== "application/octet-stream"
    ) {
      violations.push("metric_demand_error_bound_staged_descriptor_invalid");
    }
    const derivationEntry = entries.find(
      (entry) =>
        isRecord(entry) && entry.inputId === "metric_demand_derivation_receipt",
    );
    const derivationDescriptor =
      isRecord(derivationEntry) && isRecord(derivationEntry.descriptor)
        ? derivationEntry.descriptor
        : null;
    const derivationBinding = isRecord(value.metricDemandDerivationBinding)
      ? value.metricDemandDerivationBinding
      : null;
    if (
      !isRecord(derivationEntry) ||
      derivationDescriptor == null ||
      derivationDescriptor.descriptorKind !==
        "metric_demand_derivation_receipt" ||
      derivationDescriptor.artifactId !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
      derivationDescriptor.contractVersion !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
      derivationBinding == null ||
      !hasExactKeys(derivationBinding, METRIC_DERIVATION_BINDING_KEYS) ||
      derivationBinding.inputId !== "metric_demand_derivation_receipt" ||
      derivationBinding.sha256 !== derivationEntry.sha256 ||
      derivationBinding.artifactId !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
      derivationBinding.contractVersion !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
      derivationBinding.metricDemandInputId !== "metric_demand_tensor" ||
      !isRecord(metricEntry) ||
      derivationBinding.metricDemandSha256 !== metricEntry.sha256 ||
      derivationBinding.errorBoundInputId !==
        "metric_demand_absolute_error_bound" ||
      !isRecord(errorBoundEntry) ||
      derivationBinding.errorBoundSha256 !== errorBoundEntry.sha256 ||
      derivationBinding.enclosureMethod !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD ||
      derivationBinding.coverage !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE ||
      derivationBinding.relativeEnclosureTarget !== 0.01 ||
      derivationBinding.verificationStatus !==
        "metric_demand_derivation_executor_provenance_unverified" ||
      !sameCanonicalJson(derivationBinding.blockers, [
        "metric_demand_derivation_executor_provenance_unverified",
        "interval_trace_not_server_replayed",
      ])
    ) {
      violations.push("metric_demand_derivation_binding_invalid");
    }

    const nondegeneracy = isRecord(value.metricDemandNondegeneracy)
      ? value.metricDemandNondegeneracy
      : null;
    const observedMinimum = Number(
      nondegeneracy?.minimumObservedSampleFrobeniusSI,
    );
    const observedMaximum = Number(
      nondegeneracy?.maximumObservedSampleFrobeniusSI,
    );
    const observedGlobal = Number(nondegeneracy?.globalMetricDemandFrobeniusSI);
    if (
      nondegeneracy == null ||
      !hasExactKeys(nondegeneracy, NONDEGENERACY_KEYS) ||
      nondegeneracy.screenId !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID ||
      nondegeneracy.authority !==
        "server_recomputed_from_staged_metric_and_error_float64_bytes" ||
      nondegeneracy.inputId !== "metric_demand_tensor" ||
      !isRecord(metricEntry) ||
      nondegeneracy.metricDemandSha256 !== metricEntry.sha256 ||
      nondegeneracy.errorBoundInputId !==
        "metric_demand_absolute_error_bound" ||
      !isRecord(errorBoundEntry) ||
      nondegeneracy.metricDemandAbsoluteErrorBoundSha256 !==
        errorBoundEntry.sha256 ||
      nondegeneracy.algorithm !==
        "stable_scaled_symmetric_tensor_frobenius_lower_bound_per_sample_float64_v2" ||
      nondegeneracy.sampleCount !== 64 ||
      nondegeneracy.componentCount !==
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      nondegeneracy.valueCount !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      nondegeneracy.finiteValueCount !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      nondegeneracy.errorBoundValueCount !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      nondegeneracy.finiteErrorBoundValueCount !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length ||
      nondegeneracy.minimumMetricDemandFrobeniusSI !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI ||
      nondegeneracy.requiredNondegenerateSampleFraction !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction ||
      nondegeneracy.observedNondegenerateSampleCount !== 64 ||
      nondegeneracy.observedNondegenerateSampleFraction !== 1 ||
      !Number.isFinite(observedMinimum) ||
      observedMinimum <=
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI ||
      !Number.isFinite(observedMaximum) ||
      observedMaximum < observedMinimum ||
      !Number.isFinite(observedGlobal) ||
      observedGlobal < observedMaximum ||
      !Number.isFinite(
        Number(nondegeneracy.minimumObservedSampleFrobeniusLowerBoundSI),
      ) ||
      Number(nondegeneracy.minimumObservedSampleFrobeniusLowerBoundSI) <=
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI ||
      !Number.isFinite(
        Number(nondegeneracy.maximumObservedSampleErrorBoundFrobeniusSI),
      ) ||
      Number(nondegeneracy.maximumObservedSampleErrorBoundFrobeniusSI) < 0 ||
      nondegeneracy.maximumAllowedRelativeErrorBound !== 0.01 ||
      !Number.isFinite(
        Number(nondegeneracy.maximumObservedRelativeErrorBound),
      ) ||
      Number(nondegeneracy.maximumObservedRelativeErrorBound) < 0 ||
      Number(nondegeneracy.maximumObservedRelativeErrorBound) > 0.01 ||
      nondegeneracy.allSamplesWithinRelativeErrorBound !== true ||
      nondegeneracy.allValuesFinite !== true ||
      nondegeneracy.allErrorBoundsFiniteAndNonnegative !== true ||
      nondegeneracy.allErrorBoundsStrictlyPositive !== true ||
      nondegeneracy.passesFrozenScreen !== true ||
      nondegeneracy.regionalPhysicalNondegeneracyAuthority !== false
    ) {
      violations.push("metric_demand_nondegeneracy_screen_invalid");
    }

    const plans = Array.isArray(value.runPlans) ? value.runPlans : [];
    if (
      plans.length !==
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_PLAN_ROLES.length
    ) {
      violations.push("run_plan_count_invalid");
    }
    const privateRoots: string[] = [];
    const planIds: string[] = [];
    plans.forEach((plan, index) => {
      const expectedRole =
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_PLAN_ROLES[index];
      const pointer = `/runPlans/${index}`;
      if (!isRecord(plan) || !hasExactKeys(plan, PLAN_KEYS)) {
        violations.push(`run_plan_shape_invalid:${pointer}`);
        return;
      }
      if (
        plan.role !== expectedRole ||
        !isIdentifier(plan.planId) ||
        plan.scientificRootDirectory !== value.sealedScientificRootDirectory ||
        plan.scientificRootAccess !== "read_only_exact_sealed_inventory" ||
        !isPortableRelativePath(plan.implementationRootDirectory) ||
        !isPortableRelativePath(plan.outputDirectory) ||
        plan.counterpartOutputs !== "not_mounted" ||
        plan.ambientRepository !== "not_mounted"
      ) {
        violations.push(`run_plan_binding_invalid:${pointer}`);
      }
      if (typeof plan.planId === "string") planIds.push(plan.planId);
      if (typeof plan.implementationRootDirectory === "string") {
        privateRoots.push(plan.implementationRootDirectory);
      }
      if (typeof plan.outputDirectory === "string") {
        privateRoots.push(plan.outputDirectory);
      }
    });
    if (new Set(planIds.map(caseFold)).size !== planIds.length) {
      violations.push("run_plan_ids_alias_case_insensitively");
    }
    const topologyRoots = [
      typeof value.sealedScientificRootDirectory === "string"
        ? value.sealedScientificRootDirectory
        : "",
      ...privateRoots,
    ].filter((root) => root.length > 0);
    if (
      topologyRoots.some((root, index) =>
        topologyRoots
          .slice(index + 1)
          .some((other) => portablePathsOverlapCaseInsensitive(root, other)),
      )
    ) {
      violations.push("run_plan_root_topology_alias_case_insensitively");
    }

    const claimLocks = isRecord(value.claimLocks) ? value.claimLocks : null;
    if (
      claimLocks == null ||
      !hasExactKeys(claimLocks, CLAIM_LOCK_KEYS) ||
      CLAIM_LOCK_KEYS.some((key) => claimLocks[key] !== false)
    ) {
      violations.push("claim_locks_not_all_false");
    }

    if (!isSha256(value.sealedInventorySha256)) {
      violations.push("sealed_inventory_sha256_invalid");
    } else {
      const { sealedInventorySha256: _sealedInventorySha256, ...unsigned } =
        value as unknown as Nhm2SemiclassicalV2ScientificPresealV1;
      if (
        value.sealedInventorySha256 !==
        computeNhm2SemiclassicalV2SealedInventorySha256(unsigned)
      ) {
        violations.push("sealed_inventory_sha256_mismatch");
      }
    }
    return unique(violations);
  } catch {
    return ["scientific_preseal_shape_invalid"];
  }
};

export const isNhm2SemiclassicalV2ScientificPreseal = (
  value: unknown,
): value is Nhm2SemiclassicalV2ScientificPresealV1 =>
  nhm2SemiclassicalV2ScientificPresealViolations(value).length === 0;

/**
 * Cross-checks the parsed candidate and the exact external bytes whose hash is
 * staged as `candidate_manifest`. This avoids an impossible self-hash field in
 * the candidate while still making it the twenty-first scientific input.
 */
export const nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations = (
  presealValue: unknown,
  candidateValue: unknown,
  candidateManifestBytes: Uint8Array,
): string[] => {
  const violations = [
    ...nhm2SemiclassicalV2ScientificPresealViolations(presealValue).map(
      (entry) => `preseal:${entry}`,
    ),
    ...nhm2SemiclassicalV2ScientificCandidateManifestViolations(
      candidateValue,
    ).map((entry) => `candidate:${entry}`),
  ];
  if (
    violations.length > 0 ||
    !isRecord(presealValue) ||
    !isRecord(candidateValue)
  ) {
    return unique(violations);
  }
  const preseal = presealValue as Nhm2SemiclassicalV2ScientificPresealV1;
  const candidate =
    candidateValue as Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  const selfEntry = preseal.stagedInputs[0];
  const externalSha256 =
    computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
      candidateManifestBytes,
    );
  let parsedBytes: unknown = null;
  let decodedText: string | null = null;
  try {
    decodedText = new TextDecoder("utf-8", { fatal: true }).decode(
      candidateManifestBytes,
    );
    parsedBytes = JSON.parse(decodedText);
  } catch {
    violations.push("candidate_manifest_external_bytes_not_exact_utf8_json");
  }
  if (
    decodedText != null &&
    decodedText !==
      canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson(
        candidateValue as Nhm2SemiclassicalV2ScientificCandidateManifestV1,
      )
  ) {
    violations.push("candidate_manifest_external_bytes_not_canonical_json");
  }
  if (!sameCanonicalJson(parsedBytes, candidate)) {
    violations.push("candidate_manifest_external_bytes_content_mismatch");
  }
  if (
    selfEntry.sha256 !== externalSha256 ||
    selfEntry.sizeBytes !== candidateManifestBytes.byteLength ||
    preseal.candidateBinding.candidateManifestSha256 !== externalSha256 ||
    preseal.candidateBinding.candidateManifestSizeBytes !==
      candidateManifestBytes.byteLength
  ) {
    violations.push("candidate_manifest_external_byte_binding_mismatch");
  }
  if (
    preseal.candidateFrozenAt !== candidate.candidateFrozenAt ||
    preseal.candidateBinding.candidateId !== candidate.candidate.candidateId ||
    preseal.candidateBinding.candidateManifestId !==
      candidate.candidate.candidateManifestId ||
    !sameCanonicalJson(
      preseal.stagedInputs.slice(1),
      candidate.scientificInputs,
    )
  ) {
    violations.push("candidate_manifest_scientific_binding_mismatch");
  }
  return unique(violations);
};

/**
 * An exact duplicate is an idempotent read of the same seal. Any different
 * artifact under the deterministic key is a forbidden second seal.
 */
export const nhm2SemiclassicalV2ScientificPresealPairViolations = (
  existingValue: unknown,
  proposedValue: unknown,
): string[] => {
  const existingViolations =
    nhm2SemiclassicalV2ScientificPresealViolations(existingValue);
  const proposedViolations =
    nhm2SemiclassicalV2ScientificPresealViolations(proposedValue);
  const violations = [
    ...existingViolations.map((entry) => `existing:${entry}`),
    ...proposedViolations.map((entry) => `proposed:${entry}`),
  ];
  if (
    violations.length > 0 ||
    !isRecord(existingValue) ||
    !isRecord(proposedValue)
  ) {
    return unique(violations);
  }
  const existing = existingValue as Nhm2SemiclassicalV2ScientificPresealV1;
  const proposed = proposedValue as Nhm2SemiclassicalV2ScientificPresealV1;
  const sameCandidateIdentity =
    caseFold(existing.candidateBinding.candidateId) ===
    caseFold(proposed.candidateBinding.candidateId);
  const sameCandidateBytes =
    existing.candidateBinding.candidateManifestSha256 ===
    proposed.candidateBinding.candidateManifestSha256;
  if (
    (sameCandidateIdentity || existing.sealKey === proposed.sealKey) &&
    !sameCanonicalJson(existing, proposed)
  ) {
    violations.push("deterministic_seal_key_conflict_second_seal_forbidden");
  }
  if (sameCandidateBytes && existing.sealKey !== proposed.sealKey) {
    violations.push("candidate_manifest_resealed_under_different_key");
  }
  return unique(violations);
};
