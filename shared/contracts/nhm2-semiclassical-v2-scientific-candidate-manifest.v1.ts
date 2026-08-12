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
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID =
  "nhm2.semiclassical_v2_scientific_candidate_manifest" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_scientific_candidate_manifest/v2" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE =
  "pre_execution_scientific_freeze" as const;
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND =
  "frozen_nondegenerate_nhm2_semiclassical_candidate" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID =
  "all_admitted_samples_metric_demand_lower_frobenius_above_frozen_floor/v2" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID =
  "nhm2.semiclassical_v2_metric_demand_derivation_receipt" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_metric_demand_derivation_receipt/v1" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD =
  "componentwise_outward_rounded_interval_plus_discretization_truncation_tail_bound" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE =
  "all_64_samples_all_10_symmetric_tensor_components" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID =
  "einstein_tensor_orthonormal_tetrad_pullback_spacetime_smear/v1" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID =
  "componentwise_outward_interval_plus_quadrature_discretization_truncation_bound/v1" as const;
export const NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS =
  Object.freeze({
    derivationReplayAuthority: false as const,
    deterministicErrorBoundAuthority: false as const,
    diagnosticPass: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
  });

export type Nhm2SemiclassicalV2ScientificNonSelfInputId = Exclude<
  (typeof NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS)[number],
  "candidate_manifest"
>;

/**
 * The candidate file is deliberately not a member of its own payload. Its
 * externally observed raw-byte hash becomes entry zero (`candidate_manifest`)
 * when the server constructs the scientific preseal.
 */
export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS =
  Object.freeze(
    NHM2_SEMICLASSICAL_V2_RAW_REPLAY_SCIENTIFIC_INPUT_IDS.slice(1),
  ) as readonly Nhm2SemiclassicalV2ScientificNonSelfInputId[];

export const NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS =
  Object.freeze({
    diagnosticPass: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    routeEta: false as const,
    certifiedSpeed: false as const,
    empiricalValidation: false as const,
  });

export type Nhm2SemiclassicalV2ScientificArtifactDescriptorV1 = {
  descriptorKind: "frozen_scientific_artifact";
  scientificInputId: Nhm2SemiclassicalV2ScientificNonSelfInputId;
  artifactId: string;
  contractVersion: string;
  scientificObjectId: string;
};

export type Nhm2SemiclassicalV2ScientificApprovedPolicyDescriptorV1 = {
  descriptorKind: "approved_replay_policy";
  scientificInputId: "tolerance_policy";
  artifactId: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION;
  policyId: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID;
};

export type Nhm2SemiclassicalV2ScientificMetricDemandDescriptorV1 = {
  descriptorKind:
    | "metric_demand_tensor_float64"
    | "metric_demand_absolute_error_bound_float64";
  scientificInputId:
    "metric_demand_tensor" | "metric_demand_absolute_error_bound";
  dtype: "float64";
  binaryEncoding: "raw_ieee754";
  endianness: "little";
  shape: [64, 10];
  storageOrder: "row-major";
  componentOrder: string[];
  unit: "J/m^3";
};

export type Nhm2SemiclassicalV2ScientificMetricDemandDerivationReceiptDescriptorV1 =
  {
    descriptorKind: "metric_demand_derivation_receipt";
    scientificInputId: "metric_demand_derivation_receipt";
    artifactId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID;
    contractVersion: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION;
    scientificObjectId: string;
  };

export type Nhm2SemiclassicalV2MetricDemandDerivationReceiptV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION;
  candidateId: string;
  inputBindings: {
    geometrySha256: string;
    chartSha256: string;
    samplingBasisSha256: string;
    smearingDefinitionSha256: string;
    normalizationSha256: string;
    tolerancePolicySha256: string;
  };
  derivation: {
    formulaId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_FORMULA_ID;
    algorithmId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ALGORITHM_ID;
    enclosureMethod: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD;
    coverage: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE;
    relativeEnclosureTarget: 0.01;
    boundScope: "deterministic_numerical_error_only_physical_constant_uncertainty_excluded";
    zeroBoundDisposition: "strictly_positive_componentwise_bounds_required_pending_exact_zero_derivation_replay";
    constants: {
      speedOfLightMetersPerSecond: 299792458;
      newtonianGravitationalConstantSI: 6.6743e-11;
      newtonianGravitationalConstantStandardUncertaintySI: 1.5e-15;
      einsteinCouplingConvention: "T_hat_ab=(c^4/(8*pi*G))*G_hat_ab";
    };
    intervalTraceSha256: string;
  };
  implementation: {
    sourceSha256: string;
    dependencyLockSha256: string;
    toolchainArtifactSha256: string;
    executableSha256: string;
  };
  execution: {
    authority: "executor_observed";
    gitCommitSha: string;
    command: string;
    argv: string[];
    startedAt: string;
    completedAt: string;
    durationMs: number;
    exitCode: 0;
  };
  outputs: {
    centralTensor: {
      inputId: "metric_demand_tensor";
      sha256: string;
      sizeBytes: 5120;
      freshness: "created_or_modified_during_execution";
    };
    deterministicAbsoluteErrorBound: {
      inputId: "metric_demand_absolute_error_bound";
      sha256: string;
      sizeBytes: 5120;
      unit: "J/m^3";
      shape: [64, 10];
      componentOrder: string[];
      freshness: "created_or_modified_during_execution";
    };
    intervalTrace: {
      sha256: string;
      sizeBytes: number;
      freshness: "created_or_modified_during_execution";
    };
  };
  verificationStatus: "metric_demand_derivation_executor_provenance_unverified";
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_RECEIPT_CLAIM_LOCKS;
  integrity: {
    hashAlgorithm: "sha256";
    canonicalization: "utf8_lexicographic_object_keys_json_v1";
    receiptSha256: string;
  };
};

export type Nhm2SemiclassicalV2ScientificGenericInputV1 = {
  inputId: Exclude<
    Nhm2SemiclassicalV2ScientificNonSelfInputId,
    | "tolerance_policy"
    | "metric_demand_tensor"
    | "metric_demand_absolute_error_bound"
    | "metric_demand_derivation_receipt"
  >;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  mediaType: string;
  descriptor: Nhm2SemiclassicalV2ScientificArtifactDescriptorV1;
};

export type Nhm2SemiclassicalV2ScientificApprovedPolicyInputV1 = Omit<
  Nhm2SemiclassicalV2ScientificGenericInputV1,
  "inputId" | "descriptor"
> & {
  inputId: "tolerance_policy";
  descriptor: Nhm2SemiclassicalV2ScientificApprovedPolicyDescriptorV1;
};

export type Nhm2SemiclassicalV2ScientificMetricDemandInputV1 = Omit<
  Nhm2SemiclassicalV2ScientificGenericInputV1,
  "inputId" | "descriptor"
> & {
  inputId: "metric_demand_tensor" | "metric_demand_absolute_error_bound";
  descriptor: Nhm2SemiclassicalV2ScientificMetricDemandDescriptorV1;
};

export type Nhm2SemiclassicalV2ScientificMetricDemandDerivationReceiptInputV1 =
  Omit<
    Nhm2SemiclassicalV2ScientificGenericInputV1,
    "inputId" | "descriptor"
  > & {
    inputId: "metric_demand_derivation_receipt";
    descriptor: Nhm2SemiclassicalV2ScientificMetricDemandDerivationReceiptDescriptorV1;
  };

export type Nhm2SemiclassicalV2ScientificCandidateInputV1 =
  | Nhm2SemiclassicalV2ScientificGenericInputV1
  | Nhm2SemiclassicalV2ScientificApprovedPolicyInputV1
  | Nhm2SemiclassicalV2ScientificMetricDemandInputV1
  | Nhm2SemiclassicalV2ScientificMetricDemandDerivationReceiptInputV1;

export type Nhm2SemiclassicalV2ScientificCandidateManifestV1 = {
  artifactId: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION;
  phase: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE;
  candidateFrozenAt: string;
  candidate: {
    candidateId: string;
    candidateManifestId: string;
    selectedProfileId: string;
    candidateKind: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND;
    geometryId: string;
    quantumStateId: string;
    chartId: string;
    normalizationId: string;
    tolerancePolicyId: typeof NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID;
    smearingFunctionId: string;
    samplingBasisId: string;
    nondegeneracyCriterionId: typeof NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID;
    metricDemandInputId: "metric_demand_tensor";
    metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound";
    metricDemandDerivationWitnessInputId: "metric_demand_derivation_receipt";
    minimumMetricDemandFrobeniusSI: number;
    requiredNondegenerateSampleFraction: number;
    sampleCount: 64;
  };
  sourceProvenance: {
    sourceMode: "state_derived_not_declared_lever";
    meanRsetOrigin: "renormalized_quantum_state_expectation_value";
    noiseKernelOrigin: "connected_symmetrized_quantum_state_two_point_function";
    declaredLeverTensorUsed: false;
    inputClosureExcludesDeclaredLeverTensor: true;
  };
  scientificInputs: Nhm2SemiclassicalV2ScientificCandidateInputV1[];
  claimLocks: typeof NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS;
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "phase",
  "candidateFrozenAt",
  "candidate",
  "sourceProvenance",
  "scientificInputs",
  "claimLocks",
] as const;
const CANDIDATE_KEYS = [
  "candidateId",
  "candidateManifestId",
  "selectedProfileId",
  "candidateKind",
  "geometryId",
  "quantumStateId",
  "chartId",
  "normalizationId",
  "tolerancePolicyId",
  "smearingFunctionId",
  "samplingBasisId",
  "nondegeneracyCriterionId",
  "metricDemandInputId",
  "metricDemandErrorBoundInputId",
  "metricDemandDerivationWitnessInputId",
  "minimumMetricDemandFrobeniusSI",
  "requiredNondegenerateSampleFraction",
  "sampleCount",
] as const;
const SOURCE_PROVENANCE_KEYS = [
  "sourceMode",
  "meanRsetOrigin",
  "noiseKernelOrigin",
  "declaredLeverTensorUsed",
  "inputClosureExcludesDeclaredLeverTensor",
] as const;
const INPUT_KEYS = [
  "inputId",
  "relativePath",
  "sha256",
  "sizeBytes",
  "mediaType",
  "descriptor",
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
const CLAIM_LOCK_KEYS = Object.keys(
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
);

const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;
const FORBIDDEN_OPERATIONAL_KEY_PARTS = [
  "request",
  "receipt",
  "execution",
  "implementation",
  "output",
] as const;

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
const isContractVersion = (value: unknown): value is string =>
  typeof value === "string" && CONTRACT_VERSION.test(value);
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
const caseFoldPath = (value: string): string =>
  value.toLocaleLowerCase("en-US");
const portablePathsOverlapCaseInsensitive = (
  left: string,
  right: string,
): boolean => {
  const foldedLeft = caseFoldPath(left);
  const foldedRight = caseFoldPath(right);
  return (
    foldedLeft === foldedRight ||
    foldedLeft.startsWith(`${foldedRight}/`) ||
    foldedRight.startsWith(`${foldedLeft}/`)
  );
};
const sameStrings = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((entry, index) => entry === expected[index]);
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

const collectObjectKeys = (value: unknown, keys: string[] = []): string[] => {
  if (Array.isArray(value)) {
    for (const entry of value) collectObjectKeys(entry, keys);
  } else if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      keys.push(key);
      collectObjectKeys(entry, keys);
    }
  }
  return keys;
};

const containsForbiddenLeverIdentity = (value: unknown): boolean => {
  if (typeof value === "string") {
    const folded = value.toLocaleLowerCase("en-US");
    return NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORBIDDEN_INPUT_IDS.some((id) =>
      folded.includes(id.toLocaleLowerCase("en-US")),
    );
  }
  if (Array.isArray(value)) return value.some(containsForbiddenLeverIdentity);
  return (
    isRecord(value) && Object.values(value).some(containsForbiddenLeverIdentity)
  );
};

const descriptorViolations = (
  entry: Record<string, unknown>,
  expectedId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
  candidate: Record<string, unknown>,
  pointer: string,
): string[] => {
  const descriptor = isRecord(entry.descriptor) ? entry.descriptor : null;
  if (expectedId === "tolerance_policy") {
    if (
      descriptor == null ||
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
      return [`approved_policy_binding_invalid:${pointer}`];
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
      descriptor == null ||
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
      !sameStrings(
        descriptor.componentOrder,
        NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
      ) ||
      descriptor.unit !== "J/m^3" ||
      entry.sizeBytes !==
        64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8 ||
      entry.mediaType !== "application/octet-stream"
    ) {
      return [`metric_demand_descriptor_invalid:${pointer}`];
    }
    return [];
  }
  if (expectedId === "metric_demand_derivation_receipt") {
    if (
      descriptor == null ||
      !hasExactKeys(descriptor, GENERIC_DESCRIPTOR_KEYS) ||
      descriptor.descriptorKind !== "metric_demand_derivation_receipt" ||
      descriptor.scientificInputId !== expectedId ||
      descriptor.artifactId !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID ||
      descriptor.contractVersion !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION ||
      descriptor.scientificObjectId !== candidate.candidateId ||
      entry.mediaType !== "application/json"
    ) {
      return [`metric_demand_derivation_receipt_descriptor_invalid:${pointer}`];
    }
    return [];
  }
  if (
    descriptor == null ||
    !hasExactKeys(descriptor, GENERIC_DESCRIPTOR_KEYS) ||
    descriptor.descriptorKind !== "frozen_scientific_artifact" ||
    descriptor.scientificInputId !== expectedId ||
    !isIdentifier(descriptor.artifactId) ||
    !isContractVersion(descriptor.contractVersion) ||
    !isIdentifier(descriptor.scientificObjectId)
  ) {
    return [`scientific_descriptor_invalid:${pointer}`];
  }
  const candidateObjectBindings: Partial<
    Record<Nhm2SemiclassicalV2ScientificNonSelfInputId, string>
  > = {
    geometry: String(candidate.geometryId ?? ""),
    quantum_state: String(candidate.quantumStateId ?? ""),
    chart: String(candidate.chartId ?? ""),
    normalization: String(candidate.normalizationId ?? ""),
    smearing_definition: String(candidate.smearingFunctionId ?? ""),
    sampling_basis: String(candidate.samplingBasisId ?? ""),
  };
  const expectedObjectId = candidateObjectBindings[expectedId];
  if (
    expectedObjectId != null &&
    descriptor.scientificObjectId !== expectedObjectId
  ) {
    return [`scientific_object_id_mismatch:${pointer}`];
  }
  return [];
};

export const computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256 =
  (bytes: Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");

export const canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson = (
  value: Nhm2SemiclassicalV2ScientificCandidateManifestV1,
): string => JSON.stringify(canonicalizeJson(value));

export const nhm2SemiclassicalV2ScientificCandidateManifestViolations = (
  value: unknown,
): string[] => {
  try {
    if (!isRecord(value)) return ["candidate_manifest_shape_invalid"];
    const violations: string[] = [];
    if (!hasExactKeys(value, ROOT_KEYS)) violations.push("root_keys_not_exact");
    if (
      value.artifactId !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID ||
      value.contractVersion !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION ||
      value.phase !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE ||
      !isIsoTimestamp(value.candidateFrozenAt)
    ) {
      violations.push("candidate_manifest_identity_or_time_invalid");
    }

    const operationalKeys = collectObjectKeys(value).filter((key) => {
      const folded = key.toLocaleLowerCase("en-US");
      return FORBIDDEN_OPERATIONAL_KEY_PARTS.some((part) =>
        folded.includes(part),
      );
    });
    if (operationalKeys.length > 0) {
      violations.push("candidate_manifest_contains_operational_fields");
    }
    if (containsForbiddenLeverIdentity(value)) {
      violations.push("declared_lever_identity_forbidden");
    }

    const candidate = isRecord(value.candidate) ? value.candidate : null;
    if (candidate == null || !hasExactKeys(candidate, CANDIDATE_KEYS)) {
      violations.push("candidate_shape_invalid");
    } else if (
      !isIdentifier(candidate.candidateId) ||
      !isIdentifier(candidate.candidateManifestId) ||
      !isIdentifier(candidate.selectedProfileId) ||
      candidate.candidateKind !==
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND ||
      !isIdentifier(candidate.geometryId) ||
      !isIdentifier(candidate.quantumStateId) ||
      !isIdentifier(candidate.chartId) ||
      !isIdentifier(candidate.normalizationId) ||
      candidate.tolerancePolicyId !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID ||
      !isIdentifier(candidate.smearingFunctionId) ||
      !isIdentifier(candidate.samplingBasisId) ||
      candidate.nondegeneracyCriterionId !==
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID ||
      candidate.metricDemandInputId !== "metric_demand_tensor" ||
      candidate.metricDemandErrorBoundInputId !==
        "metric_demand_absolute_error_bound" ||
      candidate.metricDemandDerivationWitnessInputId !==
        "metric_demand_derivation_receipt" ||
      candidate.minimumMetricDemandFrobeniusSI !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI ||
      candidate.requiredNondegenerateSampleFraction !==
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction ||
      candidate.sampleCount !== 64
    ) {
      violations.push("candidate_binding_invalid");
    }

    const source = isRecord(value.sourceProvenance)
      ? value.sourceProvenance
      : null;
    if (
      source == null ||
      !hasExactKeys(source, SOURCE_PROVENANCE_KEYS) ||
      source.sourceMode !== "state_derived_not_declared_lever" ||
      source.meanRsetOrigin !==
        "renormalized_quantum_state_expectation_value" ||
      source.noiseKernelOrigin !==
        "connected_symmetrized_quantum_state_two_point_function" ||
      source.declaredLeverTensorUsed !== false ||
      source.inputClosureExcludesDeclaredLeverTensor !== true
    ) {
      violations.push("source_provenance_invalid");
    }

    const entries = Array.isArray(value.scientificInputs)
      ? value.scientificInputs
      : [];
    if (
      entries.length !==
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS.length
    ) {
      violations.push("scientific_input_count_invalid");
    }
    const paths: string[] = [];
    entries.forEach((entry, index) => {
      const expectedId =
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS[index];
      const pointer = `/scientificInputs/${index}`;
      if (
        expectedId == null ||
        !isRecord(entry) ||
        !hasExactKeys(entry, INPUT_KEYS)
      ) {
        violations.push(`scientific_input_shape_invalid:${pointer}`);
        return;
      }
      if (
        entry.inputId !== expectedId ||
        !isPortableRelativePath(entry.relativePath) ||
        !isSha256(entry.sha256) ||
        !Number.isSafeInteger(entry.sizeBytes) ||
        Number(entry.sizeBytes) <= 0 ||
        typeof entry.mediaType !== "string" ||
        entry.mediaType.length === 0
      ) {
        violations.push(`scientific_input_binding_invalid:${pointer}`);
      }
      if (typeof entry.relativePath === "string")
        paths.push(entry.relativePath);
      if (candidate != null) {
        violations.push(
          ...descriptorViolations(entry, expectedId, candidate, pointer),
        );
      }
    });
    if (
      paths.some((path, index) =>
        paths
          .slice(index + 1)
          .some((other) => portablePathsOverlapCaseInsensitive(path, other)),
      )
    ) {
      violations.push("scientific_input_paths_alias_case_insensitively");
    }

    const claimLocks = isRecord(value.claimLocks) ? value.claimLocks : null;
    if (
      claimLocks == null ||
      !hasExactKeys(claimLocks, CLAIM_LOCK_KEYS) ||
      CLAIM_LOCK_KEYS.some((key) => claimLocks[key] !== false)
    ) {
      violations.push("claim_locks_not_all_false");
    }
    return unique(violations);
  } catch {
    return ["candidate_manifest_shape_invalid"];
  }
};

export const isNhm2SemiclassicalV2ScientificCandidateManifest = (
  value: unknown,
): value is Nhm2SemiclassicalV2ScientificCandidateManifestV1 =>
  nhm2SemiclassicalV2ScientificCandidateManifestViolations(value).length === 0;
