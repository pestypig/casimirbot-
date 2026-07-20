import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  sha256Nhm2CanonicalText,
} from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA,
  type Nhm2IndependentNumericalReplicationRequiredFieldId,
} from "./nhm2-independent-numerical-replication.v1";
import {
  NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256,
} from "./nhm2-primary-comparison-projection.v1";

export const NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID =
  "nhm2.independent_field_array_manifest" as const;
export const NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION =
  "nhm2_independent_field_array_manifest/v1" as const;
export const NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_OUTPUT_ROLE =
  "independent_field_array_manifest" as const;
export const NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_ARTIFACT_ID =
  "nhm2.ordered_sample_domain_manifest" as const;
export const NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_CONTRACT_VERSION =
  "nhm2_ordered_sample_domain_manifest/v1" as const;
export const NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID =
  "nhm2.independent_relative_l_inf_policy" as const;
export const NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION =
  "nhm2_independent_relative_l_inf_policy/v1" as const;
export const NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_SHA256_DOMAIN =
  "nhm2-independent-relative-l-inf-policy/v1\n" as const;
/**
 * This is a technical divide-by-zero guard, not a producer-tunable physical
 * scale.  Requiring the least positive IEEE-754 binary64 value makes the zero
 * branch effectively exact: a non-zero independent value cannot be hidden by
 * choosing an arbitrarily large denominator after observing the primary run.
 */
export const NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE =
  Number.MIN_VALUE;

/**
 * Registration is deliberately pending. The current external-kernel executor
 * admits an exact, fixed three-file output inventory. Registering only this
 * JSON role would leave its declared raw arrays and ordered-domain manifests
 * outside the run-owned inventory; registering arbitrary manifest-declared
 * sidecars would weaken the executor's fail-closed inventory rule.
 */
export const NHM2_INDEPENDENT_FIELD_ARRAY_EXTERNAL_KERNEL_INTEGRATION =
  Object.freeze({
    outputRole: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_OUTPUT_ROLE,
    status: "pending" as const,
    registeredInExternalKernelPolicy: false as const,
    blocker:
      "external_kernel_manifest_declared_sidecar_closure_not_implemented" as const,
  });

export const NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS =
  Object.freeze(
    NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.map((policy, ordinal) =>
      Object.freeze({
        ordinal,
        fieldId: policy.fieldId,
        componentOrder: Object.freeze([...policy.componentOrder]),
        componentUnits: Object.freeze([...policy.componentUnits]),
        minimumSampleCount: policy.minimumSampleCount,
      }),
    ),
  );

export type Nhm2IndependentFieldArrayFieldId =
  Nhm2IndependentNumericalReplicationRequiredFieldId;

export type Nhm2IndependentFieldArrayArtifactRefV1 = {
  artifactId: string;
  contractVersion: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2IndependentOrderedSampleDomainBindingV1 = {
  ordinal: number;
  domainId: string;
  appliesToFieldIds: Nhm2IndependentFieldArrayFieldId[];
  sampleCount: number;
  axisOrder: string[];
  rowIdentityFields: string[];
  ordering: {
    rule: "lexicographic_key_tuple/v1";
    keyOrder: string[];
    direction: "ascending";
    duplicateRowIdentities: "forbidden";
    canonicalScalarEncoding: "ieee754_hex_or_utf8_length_prefixed/v1";
  };
  primaryDomainManifest: Nhm2IndependentFieldArrayArtifactRefV1;
  independentDomainManifest: Nhm2IndependentFieldArrayArtifactRefV1;
  primaryOrderedRowsSha256: string;
  independentOrderedRowsSha256: string;
  sharedOrderedRowsSha256: string;
};

export type Nhm2IndependentFieldArrayRawArrayV1 = {
  arrayId: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
  mediaType: "application/octet-stream";
  representation: {
    dtype: "float64";
    encoding: "raw_ieee754";
    endianness: "little";
    rank: 2;
    shape: [number, number];
    storageOrder: "row-major";
    componentOrder: string[];
    componentUnits: string[];
    finiteValuesRequired: true;
  };
};

export type Nhm2IndependentFieldArrayDerivationRefV1 = {
  derivationId: string;
  methodId: string;
  artifact: Nhm2IndependentFieldArrayArtifactRefV1;
  semanticSha256: string;
  sourceArraySha256: string;
  orderedDomainSha256: string;
};

export type Nhm2IndependentFieldArrayFieldV1 = {
  ordinal: number;
  fieldId: Nhm2IndependentFieldArrayFieldId;
  componentOrder: string[];
  componentUnits: string[];
  sampleDomainId: string;
  independentRawArray: Nhm2IndependentFieldArrayRawArrayV1;
  diagnostics: {
    sampleCount: number;
    domainCoverageFraction: number;
    refinementLevels: number;
    refinementLevelIds: string[];
    refinementOrdering: "coarse_to_fine";
    observedConvergenceOrder: number;
    coverageDerivation: Nhm2IndependentFieldArrayDerivationRefV1;
    refinementDerivation: Nhm2IndependentFieldArrayDerivationRefV1;
    convergenceDerivation: Nhm2IndependentFieldArrayDerivationRefV1;
  };
  uncertaintyDerivation: Nhm2IndependentFieldArrayDerivationRefV1 & {
    confidenceLevel: 0.95;
  };
};

export type Nhm2IndependentRelativeLInfPolicyV1 = {
  policyId: string;
  artifact: Nhm2IndependentFieldArrayArtifactRefV1;
  frozenAt: string;
  sealedInputLedgerSha256: string;
  semanticSha256: string;
  metric: "relative_L_inf";
  numerator: "abs_independent_minus_primary";
  reduction: "max_over_all_samples_and_components";
  denominator: {
    referenceSide: "primary";
    formula: "max_abs_primary_component_or_frozen_absolute_zero_scale";
    zeroScaleMode: "componentwise_frozen_absolute_floor";
    nonFiniteInputPolicy: "fail_closed";
  };
  comparator: "lte";
  tolerance: number;
  unit: "relative_L_inf";
  fields: Array<{
    fieldId: Nhm2IndependentFieldArrayFieldId;
    components: Array<{
      componentId: string;
      absoluteZeroScale: number;
      unit: string;
    }>;
  }>;
};

export type Nhm2IndependentFieldArrayManifestV1 = {
  artifactId: typeof NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID;
  contractVersion: typeof NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION;
  generatedAt: string;
  identity: {
    candidate: {
      candidateId: string;
      candidateManifestId: string;
      selectedProfileId: string;
      chartId: string;
      atlasSha256: string;
      unitsSha256: string;
      normalizationSha256: string;
      sourceCommitSha: string;
      candidateManifest: Nhm2IndependentFieldArrayArtifactRefV1;
    };
    primaryExecution: {
      requestId: string;
      runId: string;
      runtimeId: string;
      receiptId: string;
      solverId: string;
      implementationId: string;
      independenceGroup: string;
      comparisonProjectionManifest: Nhm2IndependentFieldArrayArtifactRefV1;
      comparisonProjectionPolicy: {
        artifactId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID;
        contractVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION;
        semanticSha256: string;
      };
    };
    independentExecution: {
      planRole: "independent_numerical";
      requestId: string;
      runId: string;
      runtimeId: string;
      receiptId: string;
      sourceCommitSha: string;
      deterministicSeed: string;
      startedAt: string;
      completedAt: string;
      durationMs: number;
      inputLedger: Nhm2IndependentFieldArrayArtifactRefV1;
    };
    toolchain: {
      solverFamily: "independent_replication_suite";
      solverId: string;
      solverVersion: string;
      implementationId: string;
      independenceGroup: string;
      executable: Nhm2IndependentFieldArrayArtifactRefV1;
      toolchainLedger: Nhm2IndependentFieldArrayArtifactRefV1;
      environmentLock: Nhm2IndependentFieldArrayArtifactRefV1;
    };
  };
  domainMode: "field_specific_domains";
  orderedSampleDomains: Nhm2IndependentOrderedSampleDomainBindingV1[];
  comparisonPolicy: Nhm2IndependentRelativeLInfPolicyV1;
  fields: Nhm2IndependentFieldArrayFieldV1[];
  publicationBoundary: {
    rawIndependentKernelDeclarationsOnly: true;
    serverFilesystemReadbackRequired: true;
    serverFloat64FiniteReplayRequired: true;
    serverPrimaryProjectionBindingRequired: true;
    serverMetricRecomputationRequired: true;
    producerAuthoredScientificDispositionForbidden: true;
    persistedReceiptBindingDeferredToServer: true;
  };
  claimLocks: {
    schemaConformanceEstablishesScientificAgreement: false;
    independentNumericalReplicationReady: false;
    theoryClosureEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
    empiricalValidationEstablished: false;
  };
};

export type Nhm2IndependentFieldArrayManifestValidationV1 = {
  contractVersion: typeof NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION;
  schemaValid: boolean;
  scientificAgreementEstablished: false;
  claimAuthority: false;
  violations: string[];
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "generatedAt",
  "identity",
  "domainMode",
  "orderedSampleDomains",
  "comparisonPolicy",
  "fields",
  "publicationBoundary",
  "claimLocks",
] as const;
const IDENTITY_KEYS = [
  "candidate",
  "primaryExecution",
  "independentExecution",
  "toolchain",
] as const;
const CANDIDATE_KEYS = [
  "candidateId",
  "candidateManifestId",
  "selectedProfileId",
  "chartId",
  "atlasSha256",
  "unitsSha256",
  "normalizationSha256",
  "sourceCommitSha",
  "candidateManifest",
] as const;
const PRIMARY_EXECUTION_KEYS = [
  "requestId",
  "runId",
  "runtimeId",
  "receiptId",
  "solverId",
  "implementationId",
  "independenceGroup",
  "comparisonProjectionManifest",
  "comparisonProjectionPolicy",
] as const;
const PRIMARY_PROJECTION_POLICY_KEYS = [
  "artifactId",
  "contractVersion",
  "semanticSha256",
] as const;
const INDEPENDENT_EXECUTION_KEYS = [
  "planRole",
  "requestId",
  "runId",
  "runtimeId",
  "receiptId",
  "sourceCommitSha",
  "deterministicSeed",
  "startedAt",
  "completedAt",
  "durationMs",
  "inputLedger",
] as const;
const TOOLCHAIN_KEYS = [
  "solverFamily",
  "solverId",
  "solverVersion",
  "implementationId",
  "independenceGroup",
  "executable",
  "toolchainLedger",
  "environmentLock",
] as const;
const ARTIFACT_KEYS = [
  "artifactId",
  "contractVersion",
  "relativePath",
  "sha256",
  "sizeBytes",
] as const;
const DOMAIN_KEYS = [
  "ordinal",
  "domainId",
  "appliesToFieldIds",
  "sampleCount",
  "axisOrder",
  "rowIdentityFields",
  "ordering",
  "primaryDomainManifest",
  "independentDomainManifest",
  "primaryOrderedRowsSha256",
  "independentOrderedRowsSha256",
  "sharedOrderedRowsSha256",
] as const;
const ORDERING_KEYS = [
  "rule",
  "keyOrder",
  "direction",
  "duplicateRowIdentities",
  "canonicalScalarEncoding",
] as const;
const POLICY_KEYS = [
  "policyId",
  "artifact",
  "frozenAt",
  "sealedInputLedgerSha256",
  "semanticSha256",
  "metric",
  "numerator",
  "reduction",
  "denominator",
  "comparator",
  "tolerance",
  "unit",
  "fields",
] as const;
const DENOMINATOR_KEYS = [
  "referenceSide",
  "formula",
  "zeroScaleMode",
  "nonFiniteInputPolicy",
] as const;
const POLICY_FIELD_KEYS = ["fieldId", "components"] as const;
const POLICY_COMPONENT_KEYS = [
  "componentId",
  "absoluteZeroScale",
  "unit",
] as const;
const FIELD_KEYS = [
  "ordinal",
  "fieldId",
  "componentOrder",
  "componentUnits",
  "sampleDomainId",
  "independentRawArray",
  "diagnostics",
  "uncertaintyDerivation",
] as const;
const ARRAY_KEYS = [
  "arrayId",
  "relativePath",
  "sha256",
  "sizeBytes",
  "mediaType",
  "representation",
] as const;
const REPRESENTATION_KEYS = [
  "dtype",
  "encoding",
  "endianness",
  "rank",
  "shape",
  "storageOrder",
  "componentOrder",
  "componentUnits",
  "finiteValuesRequired",
] as const;
const DIAGNOSTIC_KEYS = [
  "sampleCount",
  "domainCoverageFraction",
  "refinementLevels",
  "refinementLevelIds",
  "refinementOrdering",
  "observedConvergenceOrder",
  "coverageDerivation",
  "refinementDerivation",
  "convergenceDerivation",
] as const;
const DERIVATION_KEYS = [
  "derivationId",
  "methodId",
  "artifact",
  "semanticSha256",
  "sourceArraySha256",
  "orderedDomainSha256",
] as const;
const UNCERTAINTY_KEYS = [...DERIVATION_KEYS, "confidenceLevel"] as const;
const PUBLICATION_KEYS = [
  "rawIndependentKernelDeclarationsOnly",
  "serverFilesystemReadbackRequired",
  "serverFloat64FiniteReplayRequired",
  "serverPrimaryProjectionBindingRequired",
  "serverMetricRecomputationRequired",
  "producerAuthoredScientificDispositionForbidden",
  "persistedReceiptBindingDeferredToServer",
] as const;
const CLAIM_LOCK_KEYS = [
  "schemaConformanceEstablishesScientificAgreement",
  "independentNumericalReplicationReady",
  "theoryClosureEstablished",
  "physicalViabilityEstablished",
  "transportEstablished",
  "propulsionEstablished",
  "routeEtaEstablished",
  "certifiedSpeedEstablished",
  "empiricalValidationEstablished",
] as const;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;
const RUNTIME_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));
const isText = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 512 &&
  value.trim() === value;
const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" && IDENTIFIER.test(value);
const isRuntimeToken = (value: unknown): value is string =>
  typeof value === "string" && RUNTIME_TOKEN.test(value);
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value) && !/^0{64}$/.test(value);
const isGitSha = (value: unknown): value is string =>
  typeof value === "string" && GIT_SHA.test(value) && !/^0+$/.test(value);
const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
};
const isPortableRelativePath = (value: unknown): value is string => {
  if (!isText(value) || value.includes("\\") || value.includes("\0"))
    return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value) || value.includes("//"))
    return false;
  const segments = value.split("/");
  return segments.every(
    (segment) => segment !== "" && segment !== "." && segment !== "..",
  );
};
const isExactTextArray = (
  value: unknown,
  expected: readonly string[],
): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((entry, index) => entry === expected[index]);
const isUniqueIdentifierArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isIdentifier) &&
  new Set(value).size === value.length;
const unique = (values: string[]): string[] => [...new Set(values)];

const validateArtifact = (
  value: unknown,
  pointer: string,
  violations: string[],
  expected?: { artifactId: string; contractVersion: string },
): Nhm2IndependentFieldArrayArtifactRefV1 | null => {
  if (!isRecord(value) || !hasExactKeys(value, ARTIFACT_KEYS)) {
    violations.push(`artifact_shape_invalid:${pointer}`);
    return null;
  }
  if (
    !isIdentifier(value.artifactId) ||
    typeof value.contractVersion !== "string" ||
    !CONTRACT_VERSION.test(value.contractVersion) ||
    !isPortableRelativePath(value.relativePath) ||
    !isSha256(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    Number(value.sizeBytes) <= 0 ||
    (expected != null &&
      (value.artifactId !== expected.artifactId ||
        value.contractVersion !== expected.contractVersion))
  ) {
    violations.push(`artifact_identity_invalid:${pointer}`);
    return null;
  }
  return value as unknown as Nhm2IndependentFieldArrayArtifactRefV1;
};

const policySemanticPayload = (
  policy: Nhm2IndependentRelativeLInfPolicyV1,
): unknown => [
  policy.policyId,
  policy.metric,
  policy.numerator,
  policy.reduction,
  [
    policy.denominator.referenceSide,
    policy.denominator.formula,
    policy.denominator.zeroScaleMode,
    policy.denominator.nonFiniteInputPolicy,
  ],
  policy.comparator,
  policy.tolerance,
  policy.unit,
  policy.fields.map((field) => [
    field.fieldId,
    field.components.map((component) => [
      component.componentId,
      component.absoluteZeroScale,
      component.unit,
    ]),
  ]),
];

export const computeNhm2IndependentRelativeLInfPolicySemanticSha256 = (
  policy: Nhm2IndependentRelativeLInfPolicyV1,
): string =>
  sha256Nhm2CanonicalText(
    `${NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_SHA256_DOMAIN}${JSON.stringify(
      policySemanticPayload(policy),
    )}`,
  );

const validateDerivation = (input: {
  value: unknown;
  pointer: string;
  sourceArraySha256: string;
  orderedDomainSha256: string;
  violations: string[];
  uncertainty: boolean;
}): void => {
  const keys = input.uncertainty ? UNCERTAINTY_KEYS : DERIVATION_KEYS;
  if (!isRecord(input.value) || !hasExactKeys(input.value, keys)) {
    input.violations.push(`derivation_shape_invalid:${input.pointer}`);
    return;
  }
  validateArtifact(
    input.value.artifact,
    `${input.pointer}/artifact`,
    input.violations,
  );
  if (
    !isIdentifier(input.value.derivationId) ||
    !isIdentifier(input.value.methodId) ||
    !isSha256(input.value.semanticSha256) ||
    input.value.sourceArraySha256 !== input.sourceArraySha256 ||
    input.value.orderedDomainSha256 !== input.orderedDomainSha256 ||
    (input.uncertainty && input.value.confidenceLevel !== 0.95)
  ) {
    input.violations.push(`derivation_binding_invalid:${input.pointer}`);
  }
};

const validateIdentity = (
  value: unknown,
  generatedAt: unknown,
  violations: string[],
): Record<string, unknown> | null => {
  if (!isRecord(value) || !hasExactKeys(value, IDENTITY_KEYS)) {
    violations.push("identity_shape_invalid");
    return null;
  }
  const candidate = isRecord(value.candidate) ? value.candidate : null;
  const primary = isRecord(value.primaryExecution)
    ? value.primaryExecution
    : null;
  const independent = isRecord(value.independentExecution)
    ? value.independentExecution
    : null;
  const toolchain = isRecord(value.toolchain) ? value.toolchain : null;
  if (candidate == null || !hasExactKeys(candidate, CANDIDATE_KEYS)) {
    violations.push("candidate_identity_shape_invalid");
  } else {
    validateArtifact(
      candidate.candidateManifest,
      "/identity/candidate/candidateManifest",
      violations,
      {
        artifactId: NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
      },
    );
    if (
      !isIdentifier(candidate.candidateId) ||
      !isIdentifier(candidate.candidateManifestId) ||
      !isIdentifier(candidate.selectedProfileId) ||
      !isIdentifier(candidate.chartId) ||
      !isSha256(candidate.atlasSha256) ||
      !isSha256(candidate.unitsSha256) ||
      !isSha256(candidate.normalizationSha256) ||
      !isGitSha(candidate.sourceCommitSha)
    ) {
      violations.push("candidate_identity_invalid");
    }
  }
  if (primary == null || !hasExactKeys(primary, PRIMARY_EXECUTION_KEYS)) {
    violations.push("primary_execution_shape_invalid");
  } else {
    validateArtifact(
      primary.comparisonProjectionManifest,
      "/identity/primaryExecution/comparisonProjectionManifest",
      violations,
      {
        artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
      },
    );
    const projectionPolicy = isRecord(primary.comparisonProjectionPolicy)
      ? primary.comparisonProjectionPolicy
      : null;
    if (
      !isRuntimeToken(primary.requestId) ||
      !isRuntimeToken(primary.runId) ||
      !isRuntimeToken(primary.runtimeId) ||
      !isRuntimeToken(primary.receiptId) ||
      !isIdentifier(primary.solverId) ||
      !isIdentifier(primary.implementationId) ||
      !isIdentifier(primary.independenceGroup) ||
      projectionPolicy == null ||
      !hasExactKeys(projectionPolicy, PRIMARY_PROJECTION_POLICY_KEYS) ||
      projectionPolicy.artifactId !==
        NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID ||
      projectionPolicy.contractVersion !==
        NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION ||
      projectionPolicy.semanticSha256 !==
        NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256 ||
      primary.receiptId !==
        nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
          String(primary.runtimeId),
          String(primary.requestId),
        )
    ) {
      violations.push("primary_execution_identity_invalid");
    }
  }
  if (
    independent == null ||
    !hasExactKeys(independent, INDEPENDENT_EXECUTION_KEYS)
  ) {
    violations.push("independent_execution_shape_invalid");
  } else {
    validateArtifact(
      independent.inputLedger,
      "/identity/independentExecution/inputLedger",
      violations,
    );
    if (
      independent.planRole !== "independent_numerical" ||
      !isRuntimeToken(independent.requestId) ||
      !isRuntimeToken(independent.runId) ||
      !isRuntimeToken(independent.runtimeId) ||
      !isRuntimeToken(independent.receiptId) ||
      !isGitSha(independent.sourceCommitSha) ||
      !isText(independent.deterministicSeed) ||
      independent.receiptId !==
        nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
          String(independent.runtimeId),
          String(independent.requestId),
        )
    ) {
      violations.push("independent_execution_identity_invalid");
    }
    if (
      !isIsoTimestamp(independent.startedAt) ||
      !isIsoTimestamp(independent.completedAt) ||
      !Number.isSafeInteger(independent.durationMs) ||
      Number(independent.durationMs) <= 0 ||
      (isIsoTimestamp(independent.startedAt) &&
        isIsoTimestamp(independent.completedAt) &&
        Date.parse(independent.completedAt) -
          Date.parse(independent.startedAt) !==
          independent.durationMs) ||
      (isIsoTimestamp(generatedAt) &&
        isIsoTimestamp(independent.completedAt) &&
        Date.parse(generatedAt) < Date.parse(independent.completedAt))
    ) {
      violations.push("independent_execution_interval_invalid");
    }
  }
  if (toolchain == null || !hasExactKeys(toolchain, TOOLCHAIN_KEYS)) {
    violations.push("toolchain_shape_invalid");
  } else {
    validateArtifact(
      toolchain.executable,
      "/identity/toolchain/executable",
      violations,
    );
    validateArtifact(
      toolchain.toolchainLedger,
      "/identity/toolchain/toolchainLedger",
      violations,
    );
    validateArtifact(
      toolchain.environmentLock,
      "/identity/toolchain/environmentLock",
      violations,
    );
    if (
      toolchain.solverFamily !== "independent_replication_suite" ||
      !isIdentifier(toolchain.solverId) ||
      !isText(toolchain.solverVersion) ||
      !isIdentifier(toolchain.implementationId) ||
      !isIdentifier(toolchain.independenceGroup)
    ) {
      violations.push("toolchain_identity_invalid");
    }
  }
  if (primary != null && independent != null) {
    for (const key of [
      "requestId",
      "runId",
      "runtimeId",
      "receiptId",
    ] as const) {
      if (primary[key] === independent[key])
        violations.push(`primary_independent_${key}_not_distinct`);
    }
    if (
      toolchain != null &&
      (primary.solverId === toolchain.solverId ||
        primary.implementationId === toolchain.implementationId ||
        primary.independenceGroup === toolchain.independenceGroup)
    ) {
      violations.push("primary_independent_toolchain_not_distinct");
    }
  }
  return value;
};

/**
 * Returns deterministic schema/binding violations only. It does not read any
 * referenced bytes and therefore cannot establish numerical agreement.
 */
export const nhm2IndependentFieldArrayManifestViolations = (
  value: unknown,
): string[] => {
  const violations: string[] = [];
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS))
    return ["manifest_shape_invalid"];
  if (
    value.artifactId !== NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION ||
    !isIsoTimestamp(value.generatedAt)
  ) {
    violations.push("manifest_identity_invalid");
  }
  const identity = validateIdentity(
    value.identity,
    value.generatedAt,
    violations,
  );
  const independentExecution =
    identity != null && isRecord(identity.independentExecution)
      ? identity.independentExecution
      : null;
  const inputLedger =
    independentExecution != null && isRecord(independentExecution.inputLedger)
      ? independentExecution.inputLedger
      : null;

  const requiredFields = NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS;
  const domains = Array.isArray(value.orderedSampleDomains)
    ? value.orderedSampleDomains
    : [];
  if (value.domainMode !== "field_specific_domains") {
    violations.push("domain_mode_invalid");
  }
  const expectedDomainCount = requiredFields.length;
  if (domains.length !== expectedDomainCount)
    violations.push("ordered_domain_count_invalid");
  const validDomains = new Map<
    string,
    { sampleCount: number; sharedOrderedRowsSha256: string }
  >();
  const coveredFields: string[] = [];
  for (const [index, domainValue] of domains.entries()) {
    const pointer = `/orderedSampleDomains/${index}`;
    if (!isRecord(domainValue) || !hasExactKeys(domainValue, DOMAIN_KEYS)) {
      violations.push(`ordered_domain_shape_invalid:${pointer}`);
      continue;
    }
    const expectedFieldIds = [requiredFields[index]?.fieldId].filter(
      (fieldId): fieldId is Nhm2IndependentFieldArrayFieldId => fieldId != null,
    );
    const minimumSampleCount = expectedFieldIds.reduce(
      (minimum, fieldId) =>
        Math.max(
          minimum,
          requiredFields.find((field) => field.fieldId === fieldId)
            ?.minimumSampleCount ?? Number.POSITIVE_INFINITY,
        ),
      0,
    );
    const primaryManifest = validateArtifact(
      domainValue.primaryDomainManifest,
      `${pointer}/primaryDomainManifest`,
      violations,
      {
        artifactId: NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_ARTIFACT_ID,
        contractVersion:
          NHM2_PRIMARY_COMPARISON_ORDERED_DOMAIN_CONTRACT_VERSION,
      },
    );
    const independentManifest = validateArtifact(
      domainValue.independentDomainManifest,
      `${pointer}/independentDomainManifest`,
      violations,
      {
        artifactId: NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_ARTIFACT_ID,
        contractVersion: NHM2_ORDERED_SAMPLE_DOMAIN_MANIFEST_CONTRACT_VERSION,
      },
    );
    const ordering = isRecord(domainValue.ordering)
      ? domainValue.ordering
      : null;
    const rowIdentityFields = Array.isArray(domainValue.rowIdentityFields)
      ? domainValue.rowIdentityFields.filter(isIdentifier)
      : [];
    if (
      domainValue.ordinal !== index ||
      !isIdentifier(domainValue.domainId) ||
      !isExactTextArray(domainValue.appliesToFieldIds, expectedFieldIds) ||
      !Number.isSafeInteger(domainValue.sampleCount) ||
      Number(domainValue.sampleCount) < minimumSampleCount ||
      !isUniqueIdentifierArray(domainValue.axisOrder) ||
      !isUniqueIdentifierArray(domainValue.rowIdentityFields) ||
      ordering == null ||
      !hasExactKeys(ordering, ORDERING_KEYS) ||
      ordering.rule !== "lexicographic_key_tuple/v1" ||
      !isExactTextArray(ordering.keyOrder, rowIdentityFields) ||
      ordering.direction !== "ascending" ||
      ordering.duplicateRowIdentities !== "forbidden" ||
      ordering.canonicalScalarEncoding !==
        "ieee754_hex_or_utf8_length_prefixed/v1" ||
      !isSha256(domainValue.primaryOrderedRowsSha256) ||
      domainValue.primaryOrderedRowsSha256 !==
        domainValue.independentOrderedRowsSha256 ||
      domainValue.primaryOrderedRowsSha256 !==
        domainValue.sharedOrderedRowsSha256
    ) {
      violations.push(`ordered_domain_binding_invalid:${pointer}`);
    }
    if (
      primaryManifest != null &&
      independentManifest != null &&
      primaryManifest.relativePath === independentManifest.relativePath
    ) {
      violations.push(`ordered_domain_paths_not_distinct:${pointer}`);
    }
    if (
      isIdentifier(domainValue.domainId) &&
      Number.isSafeInteger(domainValue.sampleCount) &&
      isSha256(domainValue.sharedOrderedRowsSha256)
    ) {
      if (validDomains.has(domainValue.domainId))
        violations.push(`ordered_domain_id_duplicate:${pointer}`);
      validDomains.set(domainValue.domainId, {
        sampleCount: Number(domainValue.sampleCount),
        sharedOrderedRowsSha256: domainValue.sharedOrderedRowsSha256,
      });
    }
    if (Array.isArray(domainValue.appliesToFieldIds))
      coveredFields.push(
        ...domainValue.appliesToFieldIds.filter(
          (fieldId): fieldId is string => typeof fieldId === "string",
        ),
      );
  }
  if (
    coveredFields.length !== requiredFields.length ||
    coveredFields.some(
      (fieldId, index) => fieldId !== requiredFields[index]?.fieldId,
    )
  ) {
    violations.push("ordered_domain_field_coverage_not_exact");
  }

  const policy = isRecord(value.comparisonPolicy)
    ? value.comparisonPolicy
    : null;
  if (policy == null || !hasExactKeys(policy, POLICY_KEYS)) {
    violations.push("comparison_policy_shape_invalid");
  } else {
    validateArtifact(
      policy.artifact,
      "/comparisonPolicy/artifact",
      violations,
      {
        artifactId: NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
        contractVersion:
          NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
      },
    );
    const denominator = isRecord(policy.denominator)
      ? policy.denominator
      : null;
    if (
      !isIdentifier(policy.policyId) ||
      !isIsoTimestamp(policy.frozenAt) ||
      !isSha256(policy.sealedInputLedgerSha256) ||
      policy.sealedInputLedgerSha256 !== inputLedger?.sha256 ||
      !isSha256(policy.semanticSha256) ||
      policy.metric !== "relative_L_inf" ||
      policy.numerator !== "abs_independent_minus_primary" ||
      policy.reduction !== "max_over_all_samples_and_components" ||
      denominator == null ||
      !hasExactKeys(denominator, DENOMINATOR_KEYS) ||
      denominator.referenceSide !== "primary" ||
      denominator.formula !==
        "max_abs_primary_component_or_frozen_absolute_zero_scale" ||
      denominator.zeroScaleMode !== "componentwise_frozen_absolute_floor" ||
      denominator.nonFiniteInputPolicy !== "fail_closed" ||
      policy.comparator !== "lte" ||
      policy.tolerance !==
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES
          .field_level_outputs_agree_within_frozen_tolerances.threshold ||
      policy.unit !== "relative_L_inf" ||
      (independentExecution != null &&
        isIsoTimestamp(independentExecution.startedAt) &&
        isIsoTimestamp(policy.frozenAt) &&
        Date.parse(policy.frozenAt) >=
          Date.parse(independentExecution.startedAt))
    ) {
      violations.push("comparison_policy_binding_invalid");
    }
    const policyFields = Array.isArray(policy.fields) ? policy.fields : [];
    if (policyFields.length !== requiredFields.length)
      violations.push("comparison_policy_field_count_invalid");
    for (const [index, fieldValue] of policyFields.entries()) {
      const expected = requiredFields[index];
      const pointer = `/comparisonPolicy/fields/${index}`;
      if (expected == null) {
        violations.push(`comparison_policy_field_unexpected:${pointer}`);
        continue;
      }
      if (
        !isRecord(fieldValue) ||
        !hasExactKeys(fieldValue, POLICY_FIELD_KEYS) ||
        fieldValue.fieldId !== expected.fieldId ||
        !Array.isArray(fieldValue.components) ||
        fieldValue.components.length !== expected.componentOrder.length
      ) {
        violations.push(`comparison_policy_field_invalid:${pointer}`);
        continue;
      }
      for (const [
        componentIndex,
        componentValue,
      ] of fieldValue.components.entries()) {
        if (
          !isRecord(componentValue) ||
          !hasExactKeys(componentValue, POLICY_COMPONENT_KEYS) ||
          componentValue.componentId !==
            expected.componentOrder[componentIndex] ||
          componentValue.absoluteZeroScale !==
            NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE ||
          componentValue.unit !== expected.componentUnits[componentIndex]
        ) {
          violations.push(
            `comparison_policy_component_invalid:${pointer}/${componentIndex}`,
          );
        }
      }
    }
    const semanticPayloadIsComputable =
      denominator != null &&
      hasExactKeys(denominator, DENOMINATOR_KEYS) &&
      Array.isArray(policy.fields) &&
      policy.fields.every(
        (fieldValue) =>
          isRecord(fieldValue) &&
          hasExactKeys(fieldValue, POLICY_FIELD_KEYS) &&
          typeof fieldValue.fieldId === "string" &&
          Array.isArray(fieldValue.components) &&
          fieldValue.components.every(
            (componentValue) =>
              isRecord(componentValue) &&
              hasExactKeys(componentValue, POLICY_COMPONENT_KEYS) &&
              typeof componentValue.componentId === "string" &&
              typeof componentValue.absoluteZeroScale === "number" &&
              typeof componentValue.unit === "string",
          ),
      );
    if (
      semanticPayloadIsComputable &&
      isSha256(policy.semanticSha256) &&
      policy.semanticSha256 !==
        computeNhm2IndependentRelativeLInfPolicySemanticSha256(
          policy as unknown as Nhm2IndependentRelativeLInfPolicyV1,
        )
    ) {
      violations.push("comparison_policy_semantic_sha256_mismatch");
    }
  }

  const fields = Array.isArray(value.fields) ? value.fields : [];
  if (fields.length !== requiredFields.length)
    violations.push("field_count_invalid");
  const arrayPaths = new Set<string>();
  const arrayIds = new Set<string>();
  for (const [index, fieldValue] of fields.entries()) {
    const expected = requiredFields[index];
    const pointer = `/fields/${index}`;
    if (expected == null) {
      violations.push(`field_unexpected:${pointer}`);
      continue;
    }
    if (!isRecord(fieldValue) || !hasExactKeys(fieldValue, FIELD_KEYS)) {
      violations.push(`field_shape_invalid:${pointer}`);
      continue;
    }
    if (
      fieldValue.ordinal !== index ||
      fieldValue.fieldId !== expected.fieldId ||
      !isExactTextArray(fieldValue.componentOrder, expected.componentOrder) ||
      !isExactTextArray(fieldValue.componentUnits, expected.componentUnits) ||
      !isIdentifier(fieldValue.sampleDomainId)
    ) {
      violations.push(`field_identity_or_order_invalid:${pointer}`);
    }
    const domain =
      typeof fieldValue.sampleDomainId === "string"
        ? validDomains.get(fieldValue.sampleDomainId)
        : undefined;
    const rawArray = isRecord(fieldValue.independentRawArray)
      ? fieldValue.independentRawArray
      : null;
    const representation =
      rawArray != null && isRecord(rawArray.representation)
        ? rawArray.representation
        : null;
    let rawSha256 = "";
    if (
      rawArray == null ||
      !hasExactKeys(rawArray, ARRAY_KEYS) ||
      representation == null ||
      !hasExactKeys(representation, REPRESENTATION_KEYS)
    ) {
      violations.push(`field_array_shape_invalid:${pointer}`);
    } else {
      rawSha256 = typeof rawArray.sha256 === "string" ? rawArray.sha256 : "";
      const shape = Array.isArray(representation.shape)
        ? representation.shape
        : [];
      const expectedSize =
        domain == null
          ? null
          : domain.sampleCount * expected.componentOrder.length * 8;
      if (
        !isIdentifier(rawArray.arrayId) ||
        !isPortableRelativePath(rawArray.relativePath) ||
        !isSha256(rawArray.sha256) ||
        !Number.isSafeInteger(rawArray.sizeBytes) ||
        rawArray.sizeBytes !== expectedSize ||
        rawArray.mediaType !== "application/octet-stream" ||
        representation.dtype !== "float64" ||
        representation.encoding !== "raw_ieee754" ||
        representation.endianness !== "little" ||
        representation.rank !== 2 ||
        shape.length !== 2 ||
        shape[0] !== domain?.sampleCount ||
        shape[1] !== expected.componentOrder.length ||
        representation.storageOrder !== "row-major" ||
        !isExactTextArray(
          representation.componentOrder,
          expected.componentOrder,
        ) ||
        !isExactTextArray(
          representation.componentUnits,
          expected.componentUnits,
        ) ||
        representation.finiteValuesRequired !== true
      ) {
        violations.push(`field_array_binding_invalid:${pointer}`);
      }
      if (typeof rawArray.relativePath === "string") {
        if (arrayPaths.has(rawArray.relativePath))
          violations.push(`field_array_path_duplicate:${pointer}`);
        arrayPaths.add(rawArray.relativePath);
      }
      if (typeof rawArray.arrayId === "string") {
        if (arrayIds.has(rawArray.arrayId))
          violations.push(`field_array_id_duplicate:${pointer}`);
        arrayIds.add(rawArray.arrayId);
      }
    }
    const diagnostics = isRecord(fieldValue.diagnostics)
      ? fieldValue.diagnostics
      : null;
    if (diagnostics == null || !hasExactKeys(diagnostics, DIAGNOSTIC_KEYS)) {
      violations.push(`field_diagnostics_shape_invalid:${pointer}`);
    } else {
      const refinementIds = Array.isArray(diagnostics.refinementLevelIds)
        ? diagnostics.refinementLevelIds
        : [];
      if (
        diagnostics.sampleCount !== domain?.sampleCount ||
        diagnostics.domainCoverageFraction !==
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.domainCoverageFraction ||
        !Number.isSafeInteger(diagnostics.refinementLevels) ||
        Number(diagnostics.refinementLevels) <
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.refinementLevels ||
        refinementIds.length !== diagnostics.refinementLevels ||
        !refinementIds.every(isIdentifier) ||
        new Set(refinementIds).size !== refinementIds.length ||
        diagnostics.refinementOrdering !== "coarse_to_fine" ||
        typeof diagnostics.observedConvergenceOrder !== "number" ||
        !Number.isFinite(diagnostics.observedConvergenceOrder) ||
        diagnostics.observedConvergenceOrder <
          NHM2_INDEPENDENT_NUMERICAL_REPLICATION_DIAGNOSTIC_MINIMA.observedConvergenceOrder
      ) {
        violations.push(`field_diagnostics_invalid:${pointer}`);
      }
      for (const key of [
        "coverageDerivation",
        "refinementDerivation",
        "convergenceDerivation",
      ] as const) {
        validateDerivation({
          value: diagnostics[key],
          pointer: `${pointer}/diagnostics/${key}`,
          sourceArraySha256: rawSha256,
          orderedDomainSha256: domain?.sharedOrderedRowsSha256 ?? "",
          violations,
          uncertainty: false,
        });
      }
    }
    validateDerivation({
      value: fieldValue.uncertaintyDerivation,
      pointer: `${pointer}/uncertaintyDerivation`,
      sourceArraySha256: rawSha256,
      orderedDomainSha256: domain?.sharedOrderedRowsSha256 ?? "",
      violations,
      uncertainty: true,
    });
  }

  const publication = isRecord(value.publicationBoundary)
    ? value.publicationBoundary
    : null;
  if (
    publication == null ||
    !hasExactKeys(publication, PUBLICATION_KEYS) ||
    PUBLICATION_KEYS.some((key) => publication[key] !== true)
  ) {
    violations.push("publication_boundary_invalid");
  }
  const claimLocks = isRecord(value.claimLocks) ? value.claimLocks : null;
  if (
    claimLocks == null ||
    !hasExactKeys(claimLocks, CLAIM_LOCK_KEYS) ||
    CLAIM_LOCK_KEYS.some((key) => claimLocks[key] !== false)
  ) {
    violations.push("claim_locks_invalid");
  }
  return unique(violations);
};

export const validateNhm2IndependentFieldArrayManifestV1 = (
  value: unknown,
): Nhm2IndependentFieldArrayManifestValidationV1 => {
  const violations = nhm2IndependentFieldArrayManifestViolations(value);
  return {
    contractVersion: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
    schemaValid: violations.length === 0,
    scientificAgreementEstablished: false,
    claimAuthority: false,
    violations,
  };
};

export const isNhm2IndependentFieldArrayManifestV1 = (
  value: unknown,
): value is Nhm2IndependentFieldArrayManifestV1 =>
  nhm2IndependentFieldArrayManifestViolations(value).length === 0;
