import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
} from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS,
  NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
  NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
  NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE,
} from "./nhm2-independent-field-array-manifest.v1";
import {
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS,
  type Nhm2IndependentNumericalReplicationRequiredFieldId,
} from "./nhm2-independent-numerical-replication.v1";
import {
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION,
  NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256,
} from "./nhm2-primary-comparison-projection.v1";
import {
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
  NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
} from "./nhm2-primary-raw-output-manifest.v1";
import {
  THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
  THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
} from "./theory-runtime-receipt.v1";

export const NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_ARTIFACT_ID =
  "nhm2.server_owned_nine_field_float64_replay_receipt" as const;
export const NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION =
  "nhm2_server_owned_nine_field_float64_replay_receipt/v1" as const;

/**
 * Reserved identity for the primary projection-operator replay receipt. The
 * producer for this artifact is intentionally not implemented by this schema.
 */
export const NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_ARTIFACT_ID =
  "nhm2.primary_comparison_projection_operator_replay_receipt" as const;
export const NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_CONTRACT_VERSION =
  "nhm2_primary_comparison_projection_operator_replay_receipt/v1" as const;

export const NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC =
  "relative_L_inf" as const;
export const NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_ARGMAX_TIE_BREAK =
  "frozen_field_order_then_lowest_row_then_component_order" as const;

const COMPARISON_POLICY =
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES.field_level_outputs_agree_within_frozen_tolerances;

const sameStartupTextArray = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

const STARTUP_FIELD_POLICIES_EXACTLY_ALIGNED =
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.length === 9 &&
  NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS.length === 9 &&
  NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES.length === 9 &&
  NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.every(
    (required, ordinal) => {
      const independent =
        NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_REQUIRED_FIELDS[ordinal];
      const projection =
        NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES[ordinal];
      return (
        independent != null &&
        projection != null &&
        independent.ordinal === ordinal &&
        required.fieldId === independent.fieldId &&
        required.fieldId === projection.fieldId &&
        sameStartupTextArray(
          required.componentOrder,
          independent.componentOrder,
        ) &&
        sameStartupTextArray(
          required.componentOrder,
          projection.componentOrder,
        ) &&
        sameStartupTextArray(
          independent.componentUnits,
          projection.componentUnits,
        ) &&
        independent.minimumSampleCount === projection.minimumSampleCount &&
        Number.isSafeInteger(projection.minimumSampleCount) &&
        projection.minimumSampleCount > 0 &&
        projection.componentOrder.length > 0 &&
        projection.componentOrder.length === projection.componentUnits.length &&
        projection.componentOrder.every(
          (componentId, componentIndex) =>
            componentId.length > 0 &&
            (projection.componentUnits[componentIndex]?.length ?? 0) > 0,
        )
      );
    },
  );

if (
  !STARTUP_FIELD_POLICIES_EXACTLY_ALIGNED ||
  COMPARISON_POLICY.comparator !== "lte" ||
  COMPARISON_POLICY.threshold !== 0.1 ||
  COMPARISON_POLICY.unit !== "relative_L_inf" ||
  NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE !== Number.MIN_VALUE
) {
  throw new Error("nhm2_nine_field_replay_receipt_policy_alignment_invalid");
}

export const NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS =
  Object.freeze(
    NHM2_INDEPENDENT_NUMERICAL_REPLICATION_REQUIRED_FIELDS.map(
      (required, ordinal) => {
        const projection =
          NHM2_PRIMARY_COMPARISON_PROJECTION_FIELD_POLICIES[ordinal];
        return Object.freeze({
          ordinal,
          fieldId: required.fieldId,
          componentOrder: Object.freeze([...required.componentOrder]),
          componentUnits: Object.freeze([...projection.componentUnits]),
          minimumRows: projection.minimumSampleCount,
        });
      },
    ),
  );

export type Nhm2ServerOwnedNineFieldFloat64ReplayStatus =
  "pass" | "fail" | "blocked";

export type Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1 = {
  artifactId: string;
  contractVersion: string;
  relativePath: string;
  sha256: string;
  sizeBytes: number;
};

export type Nhm2ServerOwnedNineFieldFloat64ReplayExecutionReceiptBindingV1 = {
  requestId: string;
  runId: string;
  runtimeId: string;
  receiptId: string;
  artifact: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1;
};

export type Nhm2ServerOwnedNineFieldFloat64ReplayInventoryBindingV1 = {
  semanticSha256: string;
  entryCount: number;
  aggregateSizeBytes: number;
};

export type Nhm2ServerOwnedNineFieldFloat64ReplayComponentV1 = {
  ordinal: number;
  componentId: string;
  unit: string;
  primaryMaxAbs: number;
  independentMaxAbs: number;
  maxAbsDifference: number;
  denominator: number;
  relativeLInf: number;
  ratioOverflowed: boolean;
  argmax: {
    rowIndex: number;
    primaryValue: number;
    independentValue: number;
  };
};

export type Nhm2ServerOwnedNineFieldFloat64ReplayFieldV1 = {
  ordinal: number;
  fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
  componentOrder: string[];
  componentUnits: string[];
  sampleCount: number;
  /**
   * Kernel-emitted readback facts. Schema validation checks their internal
   * shape only. A future server receipt builder must cross-bind these hashes
   * to reopened primary/independent manifests before publishing this receipt.
   */
  inputBindings: {
    primarySha256: string;
    independentSha256: string;
    primaryOrderedRowsSha256: string;
    independentOrderedRowsSha256: string;
    bufferHashesRecomputedAndMatched: true;
    orderedRowsHashesMatch: true;
    sharedArrayBufferBacked: false;
  };
  components: Nhm2ServerOwnedNineFieldFloat64ReplayComponentV1[];
  metric: {
    metricId: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC;
    value: number;
    comparator: "lte";
    tolerance: number;
    unit: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC;
    argmaxComponentIndex: number;
  };
  status: Nhm2ServerOwnedNineFieldFloat64ReplayStatus;
};

export type Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1 = {
  artifactId: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_ARTIFACT_ID;
  contractVersion: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION;
  generatedAt: string;
  receiptId: string;
  candidate: {
    candidateId: string;
    candidateManifestId: string;
    selectedProfileId: string;
    chartId: string;
    manifest: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1;
  };
  numericPolicy: {
    candidatePolicySet: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1 & {
      semanticSha256: string;
    };
    independentRelativeLInfPolicy: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1 & {
      semanticSha256: string;
    };
    checkId: "field_level_outputs_agree_within_frozen_tolerances";
    metric: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC;
    comparator: "lte";
    tolerance: number;
    unit: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC;
    argmaxTieBreak: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_ARGMAX_TIE_BREAK;
  };
  primary: {
    executionReceipt: Nhm2ServerOwnedNineFieldFloat64ReplayExecutionReceiptBindingV1;
    rawOutputManifest: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1;
    rawInventory: Nhm2ServerOwnedNineFieldFloat64ReplayInventoryBindingV1;
    projectionManifest: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1;
    projectionPolicy: {
      artifactId: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID;
      contractVersion: typeof NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION;
      semanticSha256: string;
    };
    operatorReplayReceipt: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1;
  };
  independent: {
    executionReceipt: Nhm2ServerOwnedNineFieldFloat64ReplayExecutionReceiptBindingV1;
    executionInventory: Nhm2ServerOwnedNineFieldFloat64ReplayInventoryBindingV1;
    fieldArrayManifest: Nhm2ServerOwnedNineFieldFloat64ReplayArtifactRefV1;
  };
  readback: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    serverImplementation: {
      implementationId: string;
      implementationVersion: string;
      sourceCommitSha: string;
      executableSha256: string;
    };
    inventory: Nhm2ServerOwnedNineFieldFloat64ReplayInventoryBindingV1;
  };
  fields: Nhm2ServerOwnedNineFieldFloat64ReplayFieldV1[];
  summary: {
    expectedFieldCount: number;
    comparedFieldCount: number;
    expectedComponentCount: number;
    comparedComponentCount: number;
    passingFieldCount: number;
    failingFieldCount: number;
    blockedFieldCount: number;
    maximumRelativeLInf: number;
    argmax: {
      fieldIndex: number;
      fieldId: Nhm2IndependentNumericalReplicationRequiredFieldId;
      componentIndex: number;
      componentId: string;
      rowIndex: number;
    };
    status: Nhm2ServerOwnedNineFieldFloat64ReplayStatus;
  };
  authority: {
    receiptOwner: "server";
    producerDisposition: "untrusted";
    candidateManifestServerVerified: boolean;
    numericPolicyServerVerified: boolean;
    primaryExecutionReceiptServerVerified: boolean;
    primaryRawInventoryServerVerified: boolean;
    primaryProjectionManifestServerVerified: boolean;
    primaryOperatorReplayReceiptServerVerified: boolean;
    independentExecutionReceiptServerVerified: boolean;
    independentExecutionInventoryServerVerified: boolean;
    independentFieldManifestServerVerified: boolean;
    readbackIntervalServerVerified: boolean;
    serverImplementationServerVerified: boolean;
    readbackInventoryServerVerified: boolean;
    allPrerequisitesServerVerified: boolean;
    schemaValidationEstablishesAuthority: false;
  };
  claimLocks: {
    theoryClosure: false;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
    empiricalValidation: false;
  };
};

export type Nhm2ServerOwnedNineFieldFloat64ReplayReceiptValidationV1 = {
  contractVersion: typeof NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION;
  schemaValid: boolean;
  internallyDerivedMetricsValid: boolean;
  prerequisitesDeclaredServerVerified: boolean;
  schemaConsistentPassDeclaration: boolean;
  claimAuthority: false;
  violations: string[];
};

const ROOT_KEYS = [
  "artifactId",
  "contractVersion",
  "generatedAt",
  "receiptId",
  "candidate",
  "numericPolicy",
  "primary",
  "independent",
  "readback",
  "fields",
  "summary",
  "authority",
  "claimLocks",
] as const;
const ARTIFACT_KEYS = [
  "artifactId",
  "contractVersion",
  "relativePath",
  "sha256",
  "sizeBytes",
] as const;
const CANDIDATE_POLICY_ARTIFACT_KEYS = [
  ...ARTIFACT_KEYS,
  "semanticSha256",
] as const;
const CANDIDATE_KEYS = [
  "candidateId",
  "candidateManifestId",
  "selectedProfileId",
  "chartId",
  "manifest",
] as const;
const NUMERIC_POLICY_KEYS = [
  "candidatePolicySet",
  "independentRelativeLInfPolicy",
  "checkId",
  "metric",
  "comparator",
  "tolerance",
  "unit",
  "argmaxTieBreak",
] as const;
const EXECUTION_RECEIPT_KEYS = [
  "requestId",
  "runId",
  "runtimeId",
  "receiptId",
  "artifact",
] as const;
const INVENTORY_KEYS = [
  "semanticSha256",
  "entryCount",
  "aggregateSizeBytes",
] as const;
const PRIMARY_KEYS = [
  "executionReceipt",
  "rawOutputManifest",
  "rawInventory",
  "projectionManifest",
  "projectionPolicy",
  "operatorReplayReceipt",
] as const;
const PROJECTION_POLICY_KEYS = [
  "artifactId",
  "contractVersion",
  "semanticSha256",
] as const;
const INDEPENDENT_KEYS = [
  "executionReceipt",
  "executionInventory",
  "fieldArrayManifest",
] as const;
const READBACK_KEYS = [
  "startedAt",
  "completedAt",
  "durationMs",
  "serverImplementation",
  "inventory",
] as const;
const IMPLEMENTATION_KEYS = [
  "implementationId",
  "implementationVersion",
  "sourceCommitSha",
  "executableSha256",
] as const;
const FIELD_KEYS = [
  "ordinal",
  "fieldId",
  "componentOrder",
  "componentUnits",
  "sampleCount",
  "inputBindings",
  "components",
  "metric",
  "status",
] as const;
const COMPONENT_KEYS = [
  "ordinal",
  "componentId",
  "unit",
  "primaryMaxAbs",
  "independentMaxAbs",
  "maxAbsDifference",
  "denominator",
  "relativeLInf",
  "ratioOverflowed",
  "argmax",
] as const;
const INPUT_BINDING_KEYS = [
  "primarySha256",
  "independentSha256",
  "primaryOrderedRowsSha256",
  "independentOrderedRowsSha256",
  "bufferHashesRecomputedAndMatched",
  "orderedRowsHashesMatch",
  "sharedArrayBufferBacked",
] as const;
const COMPONENT_ARGMAX_KEYS = [
  "rowIndex",
  "primaryValue",
  "independentValue",
] as const;
const FIELD_METRIC_KEYS = [
  "metricId",
  "value",
  "comparator",
  "tolerance",
  "unit",
  "argmaxComponentIndex",
] as const;
const SUMMARY_KEYS = [
  "expectedFieldCount",
  "comparedFieldCount",
  "expectedComponentCount",
  "comparedComponentCount",
  "passingFieldCount",
  "failingFieldCount",
  "blockedFieldCount",
  "maximumRelativeLInf",
  "argmax",
  "status",
] as const;
const SUMMARY_ARGMAX_KEYS = [
  "fieldIndex",
  "fieldId",
  "componentIndex",
  "componentId",
  "rowIndex",
] as const;
const AUTHORITY_KEYS = [
  "receiptOwner",
  "producerDisposition",
  "candidateManifestServerVerified",
  "numericPolicyServerVerified",
  "primaryExecutionReceiptServerVerified",
  "primaryRawInventoryServerVerified",
  "primaryProjectionManifestServerVerified",
  "primaryOperatorReplayReceiptServerVerified",
  "independentExecutionReceiptServerVerified",
  "independentExecutionInventoryServerVerified",
  "independentFieldManifestServerVerified",
  "readbackIntervalServerVerified",
  "serverImplementationServerVerified",
  "readbackInventoryServerVerified",
  "allPrerequisitesServerVerified",
  "schemaValidationEstablishesAuthority",
] as const;
const SERVER_VERIFICATION_KEYS = AUTHORITY_KEYS.filter(
  (key) =>
    key.endsWith("ServerVerified") && key !== "allPrerequisitesServerVerified",
);
const CLAIM_LOCK_KEYS = [
  "theoryClosure",
  "physicalViability",
  "transport",
  "propulsion",
  "routeEta",
  "certifiedSpeed",
  "empiricalValidation",
] as const;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const hasExactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));
const isIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 512 &&
  IDENTIFIER.test(value) &&
  !value.includes("//");
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
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0);
const isNonNegativeFinite = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0;
const sameStrings = (value: unknown, expected: readonly string[]): boolean =>
  Array.isArray(value) &&
  value.length === expected.length &&
  value.every((entry, index) => entry === expected[index]);
const unique = (values: string[]): string[] => [...new Set(values)];

const artifactViolations = (
  value: unknown,
  pointer: string,
  expected?: { artifactId: string; contractVersion: string },
  extraKeys: readonly string[] = ARTIFACT_KEYS,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, extraKeys)) {
    return [`artifact_shape_invalid:${pointer}`];
  }
  const violations: string[] = [];
  if (
    !isIdentifier(value.artifactId) ||
    typeof value.contractVersion !== "string" ||
    !CONTRACT_VERSION.test(value.contractVersion) ||
    !isPortableRelativePath(value.relativePath) ||
    !isSha256(value.sha256) ||
    !Number.isSafeInteger(value.sizeBytes) ||
    Number(value.sizeBytes) <= 0
  ) {
    violations.push(`artifact_binding_invalid:${pointer}`);
  }
  if (
    expected != null &&
    (value.artifactId !== expected.artifactId ||
      value.contractVersion !== expected.contractVersion)
  ) {
    violations.push(`artifact_identity_invalid:${pointer}`);
  }
  return violations;
};

const inventoryViolations = (value: unknown, pointer: string): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, INVENTORY_KEYS)) {
    return [`inventory_shape_invalid:${pointer}`];
  }
  return !isSha256(value.semanticSha256) ||
    !Number.isSafeInteger(value.entryCount) ||
    Number(value.entryCount) <= 0 ||
    !Number.isSafeInteger(value.aggregateSizeBytes) ||
    Number(value.aggregateSizeBytes) <= 0
    ? [`inventory_binding_invalid:${pointer}`]
    : [];
};

const executionReceiptViolations = (
  value: unknown,
  pointer: string,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, EXECUTION_RECEIPT_KEYS)) {
    return [`execution_receipt_shape_invalid:${pointer}`];
  }
  const violations = artifactViolations(value.artifact, `${pointer}/artifact`, {
    artifactId: THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
    contractVersion: THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
  });
  if (
    !isIdentifier(value.requestId) ||
    !isIdentifier(value.runId) ||
    !isIdentifier(value.runtimeId) ||
    !isIdentifier(value.receiptId) ||
    value.receiptId !==
      nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
        String(value.runtimeId),
        String(value.requestId),
      )
  ) {
    violations.push(`execution_receipt_identity_invalid:${pointer}`);
  }
  return violations;
};

const authorityAllVerified = (authority: Record<string, unknown>): boolean =>
  SERVER_VERIFICATION_KEYS.every((key) => authority[key] === true);

const expectedComponentCount = (): number =>
  NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.reduce(
    (count, field) => count + field.componentOrder.length,
    0,
  );

/**
 * Structural validation plus internal scalar-derivation checks only. This
 * function does not open any referenced file, establish that a server emitted
 * the value, or grant scientific/claim authority.
 */
export const nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations = (
  value: unknown,
): string[] => {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) {
    return ["receipt_shape_invalid"];
  }
  const violations: string[] = [];
  if (
    value.artifactId !==
      NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION ||
    !isIsoTimestamp(value.generatedAt) ||
    !isIdentifier(value.receiptId)
  ) {
    violations.push("receipt_identity_invalid");
  }

  const candidate = isRecord(value.candidate) ? value.candidate : null;
  if (candidate == null || !hasExactKeys(candidate, CANDIDATE_KEYS)) {
    violations.push("candidate_binding_shape_invalid");
  } else {
    if (
      !isIdentifier(candidate.candidateId) ||
      !isIdentifier(candidate.candidateManifestId) ||
      !isIdentifier(candidate.selectedProfileId) ||
      !isIdentifier(candidate.chartId)
    ) {
      violations.push("candidate_binding_identity_invalid");
    }
    violations.push(
      ...artifactViolations(candidate.manifest, "/candidate/manifest", {
        artifactId: NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
      }),
    );
  }

  const numericPolicy = isRecord(value.numericPolicy)
    ? value.numericPolicy
    : null;
  if (
    numericPolicy == null ||
    !hasExactKeys(numericPolicy, NUMERIC_POLICY_KEYS)
  ) {
    violations.push("numeric_policy_shape_invalid");
  } else {
    violations.push(
      ...artifactViolations(
        numericPolicy.candidatePolicySet,
        "/numericPolicy/candidatePolicySet",
        {
          artifactId:
            NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
          contractVersion:
            NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
        },
        CANDIDATE_POLICY_ARTIFACT_KEYS,
      ),
      ...artifactViolations(
        numericPolicy.independentRelativeLInfPolicy,
        "/numericPolicy/independentRelativeLInfPolicy",
        {
          artifactId: NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_ARTIFACT_ID,
          contractVersion:
            NHM2_INDEPENDENT_RELATIVE_L_INF_POLICY_CONTRACT_VERSION,
        },
        CANDIDATE_POLICY_ARTIFACT_KEYS,
      ),
    );
    if (
      !isRecord(numericPolicy.candidatePolicySet) ||
      !isSha256(numericPolicy.candidatePolicySet.semanticSha256) ||
      !isRecord(numericPolicy.independentRelativeLInfPolicy) ||
      !isSha256(numericPolicy.independentRelativeLInfPolicy.semanticSha256) ||
      numericPolicy.checkId !==
        "field_level_outputs_agree_within_frozen_tolerances" ||
      numericPolicy.metric !==
        NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC ||
      numericPolicy.comparator !== COMPARISON_POLICY.comparator ||
      numericPolicy.tolerance !== COMPARISON_POLICY.threshold ||
      numericPolicy.unit !== COMPARISON_POLICY.unit ||
      numericPolicy.argmaxTieBreak !==
        NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_ARGMAX_TIE_BREAK
    ) {
      violations.push("numeric_policy_binding_invalid");
    }
  }

  const primary = isRecord(value.primary) ? value.primary : null;
  if (primary == null || !hasExactKeys(primary, PRIMARY_KEYS)) {
    violations.push("primary_binding_shape_invalid");
  } else {
    violations.push(
      ...executionReceiptViolations(
        primary.executionReceipt,
        "/primary/executionReceipt",
      ),
      ...artifactViolations(
        primary.rawOutputManifest,
        "/primary/rawOutputManifest",
        {
          artifactId: NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_ARTIFACT_ID,
          contractVersion: NHM2_PRIMARY_RAW_OUTPUT_MANIFEST_CONTRACT_VERSION,
        },
      ),
      ...inventoryViolations(primary.rawInventory, "/primary/rawInventory"),
      ...artifactViolations(
        primary.projectionManifest,
        "/primary/projectionManifest",
        {
          artifactId: NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_ARTIFACT_ID,
          contractVersion:
            NHM2_PRIMARY_COMPARISON_PROJECTION_MANIFEST_CONTRACT_VERSION,
        },
      ),
      ...artifactViolations(
        primary.operatorReplayReceipt,
        "/primary/operatorReplayReceipt",
        {
          artifactId:
            NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_ARTIFACT_ID,
          contractVersion:
            NHM2_PRIMARY_COMPARISON_PROJECTION_OPERATOR_REPLAY_RECEIPT_CONTRACT_VERSION,
        },
      ),
    );
    const projectionPolicy = isRecord(primary.projectionPolicy)
      ? primary.projectionPolicy
      : null;
    if (
      projectionPolicy == null ||
      !hasExactKeys(projectionPolicy, PROJECTION_POLICY_KEYS) ||
      projectionPolicy.artifactId !==
        NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_ARTIFACT_ID ||
      projectionPolicy.contractVersion !==
        NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_CONTRACT_VERSION ||
      projectionPolicy.semanticSha256 !==
        NHM2_PRIMARY_COMPARISON_PROJECTION_POLICY_SHA256
    ) {
      violations.push("primary_projection_policy_binding_invalid");
    }
  }

  const independent = isRecord(value.independent) ? value.independent : null;
  if (independent == null || !hasExactKeys(independent, INDEPENDENT_KEYS)) {
    violations.push("independent_binding_shape_invalid");
  } else {
    violations.push(
      ...executionReceiptViolations(
        independent.executionReceipt,
        "/independent/executionReceipt",
      ),
      ...inventoryViolations(
        independent.executionInventory,
        "/independent/executionInventory",
      ),
      ...artifactViolations(
        independent.fieldArrayManifest,
        "/independent/fieldArrayManifest",
        {
          artifactId: NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_ARTIFACT_ID,
          contractVersion:
            NHM2_INDEPENDENT_FIELD_ARRAY_MANIFEST_CONTRACT_VERSION,
        },
      ),
    );
  }
  if (
    isRecord(primary?.executionReceipt) &&
    isRecord(independent?.executionReceipt)
  ) {
    for (const key of [
      "requestId",
      "runId",
      "runtimeId",
      "receiptId",
    ] as const) {
      if (primary.executionReceipt[key] === independent.executionReceipt[key]) {
        violations.push(`primary_independent_${key}_not_distinct`);
      }
    }
  }

  const readback = isRecord(value.readback) ? value.readback : null;
  if (readback == null || !hasExactKeys(readback, READBACK_KEYS)) {
    violations.push("readback_shape_invalid");
  } else {
    const implementation = isRecord(readback.serverImplementation)
      ? readback.serverImplementation
      : null;
    if (
      !isIsoTimestamp(readback.startedAt) ||
      !isIsoTimestamp(readback.completedAt) ||
      !Number.isSafeInteger(readback.durationMs) ||
      Number(readback.durationMs) < 0 ||
      (isIsoTimestamp(readback.startedAt) &&
        isIsoTimestamp(readback.completedAt) &&
        Date.parse(readback.completedAt) - Date.parse(readback.startedAt) !==
          readback.durationMs) ||
      (isIsoTimestamp(value.generatedAt) &&
        isIsoTimestamp(readback.completedAt) &&
        Date.parse(value.generatedAt) < Date.parse(readback.completedAt))
    ) {
      violations.push("readback_interval_invalid");
    }
    if (
      implementation == null ||
      !hasExactKeys(implementation, IMPLEMENTATION_KEYS) ||
      !isIdentifier(implementation.implementationId) ||
      !isIdentifier(implementation.implementationVersion) ||
      !isGitSha(implementation.sourceCommitSha) ||
      !isSha256(implementation.executableSha256)
    ) {
      violations.push("server_implementation_binding_invalid");
    }
    violations.push(
      ...inventoryViolations(readback.inventory, "/readback/inventory"),
    );
  }

  const authority = isRecord(value.authority) ? value.authority : null;
  let allPrerequisitesVerified = false;
  if (authority == null || !hasExactKeys(authority, AUTHORITY_KEYS)) {
    violations.push("authority_shape_invalid");
  } else {
    allPrerequisitesVerified = authorityAllVerified(authority);
    if (
      authority.receiptOwner !== "server" ||
      authority.producerDisposition !== "untrusted" ||
      SERVER_VERIFICATION_KEYS.some(
        (key) => typeof authority[key] !== "boolean",
      ) ||
      authority.allPrerequisitesServerVerified !== allPrerequisitesVerified ||
      authority.schemaValidationEstablishesAuthority !== false
    ) {
      violations.push("authority_boundary_invalid");
    }
  }

  const fields = Array.isArray(value.fields) ? value.fields : [];
  if (
    fields.length !==
    NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.length
  ) {
    violations.push("field_count_invalid");
  }
  const observedFieldIds = fields
    .map((field) => (isRecord(field) ? field.fieldId : null))
    .filter((fieldId): fieldId is string => typeof fieldId === "string");
  if (new Set(observedFieldIds).size !== observedFieldIds.length) {
    violations.push("field_ids_not_unique");
  }

  const derivedFields: Array<{
    fieldId: string;
    componentCount: number;
    maximumRelativeLInf: number;
    argmaxComponentIndex: number;
    argmaxRowIndex: number;
    status: Nhm2ServerOwnedNineFieldFloat64ReplayStatus;
  }> = [];
  for (const [
    fieldIndex,
    expected,
  ] of NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.entries()) {
    const field = fields[fieldIndex];
    const pointer = `/fields/${fieldIndex}`;
    if (!isRecord(field) || !hasExactKeys(field, FIELD_KEYS)) {
      violations.push(`field_shape_invalid:${pointer}`);
      continue;
    }
    if (
      field.ordinal !== expected.ordinal ||
      field.fieldId !== expected.fieldId ||
      !sameStrings(field.componentOrder, expected.componentOrder) ||
      !sameStrings(field.componentUnits, expected.componentUnits) ||
      !Number.isSafeInteger(field.sampleCount) ||
      Number(field.sampleCount) < expected.minimumRows
    ) {
      violations.push(`field_binding_invalid:${pointer}`);
    }
    const sampleCount =
      Number.isSafeInteger(field.sampleCount) && Number(field.sampleCount) > 0
        ? Number(field.sampleCount)
        : 0;
    const inputBindings = isRecord(field.inputBindings)
      ? field.inputBindings
      : null;
    if (
      inputBindings == null ||
      !hasExactKeys(inputBindings, INPUT_BINDING_KEYS) ||
      !isSha256(inputBindings.primarySha256) ||
      !isSha256(inputBindings.independentSha256) ||
      !isSha256(inputBindings.primaryOrderedRowsSha256) ||
      !isSha256(inputBindings.independentOrderedRowsSha256) ||
      inputBindings.primaryOrderedRowsSha256 !==
        inputBindings.independentOrderedRowsSha256 ||
      inputBindings.bufferHashesRecomputedAndMatched !== true ||
      inputBindings.orderedRowsHashesMatch !== true ||
      inputBindings.sharedArrayBufferBacked !== false
    ) {
      violations.push(`field_input_bindings_invalid:${pointer}`);
    }
    const components = Array.isArray(field.components) ? field.components : [];
    if (components.length !== expected.componentOrder.length) {
      violations.push(`component_count_invalid:${pointer}`);
    }
    const componentCandidates: Array<{
      componentIndex: number;
      relativeLInf: number;
      rowIndex: number;
    }> = [];
    for (const [
      componentIndex,
      componentId,
    ] of expected.componentOrder.entries()) {
      const component = components[componentIndex];
      const componentPointer = `${pointer}/components/${componentIndex}`;
      if (!isRecord(component) || !hasExactKeys(component, COMPONENT_KEYS)) {
        violations.push(`component_shape_invalid:${componentPointer}`);
        continue;
      }
      const argmax = isRecord(component.argmax) ? component.argmax : null;
      if (
        component.ordinal !== componentIndex ||
        component.componentId !== componentId ||
        component.unit !== expected.componentUnits[componentIndex]
      ) {
        violations.push(`component_binding_invalid:${componentPointer}`);
      }
      if (
        !isNonNegativeFinite(component.primaryMaxAbs) ||
        !isNonNegativeFinite(component.independentMaxAbs) ||
        !isNonNegativeFinite(component.maxAbsDifference) ||
        !isFiniteNumber(component.denominator) ||
        component.denominator <= 0 ||
        !isNonNegativeFinite(component.relativeLInf) ||
        typeof component.ratioOverflowed !== "boolean" ||
        argmax == null ||
        !hasExactKeys(argmax, COMPONENT_ARGMAX_KEYS) ||
        !Number.isSafeInteger(argmax.rowIndex) ||
        Number(argmax.rowIndex) < 0 ||
        Number(argmax.rowIndex) >= sampleCount ||
        !isFiniteNumber(argmax.primaryValue) ||
        !isFiniteNumber(argmax.independentValue)
      ) {
        violations.push(`component_number_invalid:${componentPointer}`);
        continue;
      }
      const derivedDifference = Math.abs(
        argmax.independentValue - argmax.primaryValue,
      );
      const derivedRelative =
        component.maxAbsDifference / component.denominator;
      const derivedRatioOverflowed =
        derivedRelative === Number.POSITIVE_INFINITY &&
        component.maxAbsDifference > 0 &&
        component.denominator > 0;
      const emittedRelative = derivedRatioOverflowed
        ? Number.MAX_VALUE
        : derivedRelative;
      if (
        component.denominator !==
          Math.max(
            NHM2_INDEPENDENT_RELATIVE_L_INF_TECHNICAL_ZERO_SCALE,
            component.primaryMaxAbs,
          ) ||
        Math.abs(argmax.primaryValue) > component.primaryMaxAbs ||
        Math.abs(argmax.independentValue) > component.independentMaxAbs ||
        component.maxAbsDifference !== derivedDifference ||
        (!derivedRatioOverflowed && !Number.isFinite(derivedRelative)) ||
        component.ratioOverflowed !== derivedRatioOverflowed ||
        component.relativeLInf !== emittedRelative
      ) {
        violations.push(`component_derivation_invalid:${componentPointer}`);
      }
      componentCandidates.push({
        componentIndex,
        relativeLInf: component.relativeLInf,
        rowIndex: Number(argmax.rowIndex),
      });
    }
    const maximumRelativeLInf =
      componentCandidates.length > 0
        ? Math.max(
            ...componentCandidates.map((component) => component.relativeLInf),
          )
        : Number.NaN;
    const selectedComponent = componentCandidates
      .filter((component) => component.relativeLInf === maximumRelativeLInf)
      .sort(
        (left, right) =>
          left.rowIndex - right.rowIndex ||
          left.componentIndex - right.componentIndex,
      )[0];
    const argmaxComponentIndex = selectedComponent?.componentIndex ?? -1;
    const expectedStatus: Nhm2ServerOwnedNineFieldFloat64ReplayStatus =
      !allPrerequisitesVerified
        ? "blocked"
        : maximumRelativeLInf <= COMPARISON_POLICY.threshold
          ? "pass"
          : "fail";
    const metric = isRecord(field.metric) ? field.metric : null;
    if (
      metric == null ||
      !hasExactKeys(metric, FIELD_METRIC_KEYS) ||
      metric.metricId !== NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_METRIC ||
      metric.value !== maximumRelativeLInf ||
      metric.comparator !== COMPARISON_POLICY.comparator ||
      metric.tolerance !== COMPARISON_POLICY.threshold ||
      metric.unit !== COMPARISON_POLICY.unit ||
      metric.argmaxComponentIndex !== argmaxComponentIndex ||
      field.status !== expectedStatus
    ) {
      violations.push(`field_metric_or_status_invalid:${pointer}`);
    }
    derivedFields.push({
      fieldId: expected.fieldId,
      componentCount: components.length,
      maximumRelativeLInf,
      argmaxComponentIndex,
      argmaxRowIndex: selectedComponent?.rowIndex ?? -1,
      status: expectedStatus,
    });
  }

  const summary = isRecord(value.summary) ? value.summary : null;
  if (summary == null || !hasExactKeys(summary, SUMMARY_KEYS)) {
    violations.push("summary_shape_invalid");
  } else {
    const validFieldMaxima = derivedFields.filter((field) =>
      Number.isFinite(field.maximumRelativeLInf),
    );
    const maximumRelativeLInf =
      validFieldMaxima.length > 0
        ? Math.max(
            ...validFieldMaxima.map((field) => field.maximumRelativeLInf),
          )
        : Number.NaN;
    const fieldIndex = derivedFields.findIndex(
      (field) => field.maximumRelativeLInf === maximumRelativeLInf,
    );
    const selectedField = derivedFields[fieldIndex];
    const selectedExpected =
      NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS[fieldIndex];
    const passingFieldCount = derivedFields.filter(
      (field) => field.status === "pass",
    ).length;
    const failingFieldCount = derivedFields.filter(
      (field) => field.status === "fail",
    ).length;
    const blockedFieldCount = derivedFields.filter(
      (field) => field.status === "blocked",
    ).length;
    const expectedStatus: Nhm2ServerOwnedNineFieldFloat64ReplayStatus =
      blockedFieldCount > 0
        ? "blocked"
        : failingFieldCount > 0
          ? "fail"
          : derivedFields.length ===
              NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.length
            ? "pass"
            : "blocked";
    const argmax = isRecord(summary.argmax) ? summary.argmax : null;
    if (
      summary.expectedFieldCount !==
        NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_REQUIRED_FIELDS.length ||
      summary.comparedFieldCount !== derivedFields.length ||
      summary.expectedComponentCount !== expectedComponentCount() ||
      summary.comparedComponentCount !==
        derivedFields.reduce(
          (count, field) => count + field.componentCount,
          0,
        ) ||
      summary.passingFieldCount !== passingFieldCount ||
      summary.failingFieldCount !== failingFieldCount ||
      summary.blockedFieldCount !== blockedFieldCount ||
      summary.maximumRelativeLInf !== maximumRelativeLInf ||
      summary.status !== expectedStatus ||
      argmax == null ||
      !hasExactKeys(argmax, SUMMARY_ARGMAX_KEYS) ||
      argmax.fieldIndex !== fieldIndex ||
      argmax.fieldId !== selectedField?.fieldId ||
      argmax.componentIndex !== selectedField?.argmaxComponentIndex ||
      argmax.componentId !==
        selectedExpected?.componentOrder[selectedField?.argmaxComponentIndex] ||
      argmax.rowIndex !== selectedField?.argmaxRowIndex
    ) {
      violations.push("summary_derivation_invalid");
    }
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

const derivationViolation = (violation: string): boolean =>
  violation.startsWith("component_") ||
  violation.startsWith("field_metric_or_status_invalid") ||
  violation === "summary_derivation_invalid";

/**
 * A valid result means only that the supplied JSON obeys this receipt schema.
 * It never proves server origin, byte readback, numerical agreement, or any
 * theory/physical/transport claim.
 */
export const validateNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1 = (
  value: unknown,
): Nhm2ServerOwnedNineFieldFloat64ReplayReceiptValidationV1 => {
  const violations =
    nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(value);
  const authority =
    isRecord(value) && isRecord(value.authority) ? value.authority : {};
  const summary =
    isRecord(value) && isRecord(value.summary) ? value.summary : {};
  return {
    contractVersion:
      NHM2_SERVER_OWNED_NINE_FIELD_FLOAT64_REPLAY_RECEIPT_CONTRACT_VERSION,
    schemaValid: violations.length === 0,
    internallyDerivedMetricsValid: !violations.some(derivationViolation),
    prerequisitesDeclaredServerVerified:
      hasExactKeys(authority, AUTHORITY_KEYS) &&
      authorityAllVerified(authority),
    schemaConsistentPassDeclaration:
      violations.length === 0 && summary.status === "pass",
    claimAuthority: false,
    violations,
  };
};

export const isNhm2ServerOwnedNineFieldFloat64ReplayReceiptV1 = (
  value: unknown,
): value is Nhm2ServerOwnedNineFieldFloat64ReplayReceiptV1 =>
  nhm2ServerOwnedNineFieldFloat64ReplayReceiptViolations(value).length === 0;
