import {
  THEORY_RUNTIME_CLAIM_TIER_VALUES,
  THEORY_RUNTIME_MAXIMUM_CLAIM_TIER_VALUES,
  type TheoryRuntimeClaimTier,
  type TheoryRuntimeMaximumClaimTier,
} from "./theory-runtime-entrypoint.v1";

export const THEORY_RUNTIME_RECEIPT_ARTIFACT_ID = "theory_runtime_receipt" as const;
export const THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION = "theory_runtime_receipt/v1" as const;
export const THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID = "theory_runtime_output_manifest" as const;
export const THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION = "theory_runtime_output_manifest/v1" as const;

export const THEORY_RUNTIME_RECEIPT_STATUS_VALUES = [
  "completed",
  "failed",
  "timeout",
  "blocked",
  "stale",
  "not_run",
] as const;

export const THEORY_RUNTIME_GATE_STATUS_VALUES = [
  "pass",
  "review",
  "fail",
  "not_ready",
  "not_applicable",
  "unknown",
] as const;

export const THEORY_RUNTIME_ARTIFACT_FRESHNESS_VALUES = [
  "new",
  "changed",
  "preexisting",
] as const;

export type TheoryRuntimeReceiptStatus = (typeof THEORY_RUNTIME_RECEIPT_STATUS_VALUES)[number];
export type TheoryRuntimeGateStatus = (typeof THEORY_RUNTIME_GATE_STATUS_VALUES)[number];
export type TheoryRuntimeArtifactFreshness = (typeof THEORY_RUNTIME_ARTIFACT_FRESHNESS_VALUES)[number];

export type TheoryRuntimeOutputManifestEntryV1 = {
  path: string;
  sha256: string;
  sizeBytes: number;
  modifiedAt: string;
  freshness: TheoryRuntimeArtifactFreshness;
};

export type TheoryRuntimeOutputManifestV1 = {
  artifactId: typeof THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID;
  schemaVersion: typeof THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION;
  generatedAt: string;
  requestId: string | null;
  runtimeId: string;
  gitSha: string | null;
  startedAt: string | null;
  completedAt: string | null;
  outputDirectory: string | null;
  boundToExecution: boolean;
  manifestPath: string | null;
  manifestSha256: string | null;
  entries: TheoryRuntimeOutputManifestEntryV1[];
};

export type TheoryRuntimeArtifactEvidenceV1 = {
  path: string;
  sha256: string;
  freshness: TheoryRuntimeArtifactFreshness;
  status: TheoryRuntimeGateStatus;
  gates: Record<string, TheoryRuntimeGateStatus>;
};

export type TheoryRuntimeExecutionV1 = {
  command: string;
  args: string[];
  cwd: string;
  environment: Record<string, string>;
  outputDirectory: string | null;
  outputDirectoryBound: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error: string | null;
};

export type TheoryRuntimeReceiptV1 = {
  artifactId: typeof THEORY_RUNTIME_RECEIPT_ARTIFACT_ID;
  schemaVersion: typeof THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION;
  generatedAt: string;
  receiptId: string;
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  command: string | null;
  args: Record<string, unknown>;
  status: TheoryRuntimeReceiptStatus;
  outputs: {
    artifacts: string[];
    scalars: Record<string, number | string | boolean | null>;
    units: Record<string, string | null>;
    gates: Record<string, TheoryRuntimeGateStatus>;
    missingSignals: string[];
    warnings: string[];
    artifactManifest?: TheoryRuntimeOutputManifestV1;
    artifactEvidence?: TheoryRuntimeArtifactEvidenceV1[];
  };
  provenance: {
    gitSha: string | null;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
  };
  execution?: TheoryRuntimeExecutionV1;
  claimBoundary: {
    currentTier: TheoryRuntimeClaimTier;
    maximumTier: TheoryRuntimeMaximumClaimTier;
    promotionAllowed: boolean;
    promotionBlockedBy: string[];
  };
};

type BuildTheoryRuntimeOutputManifestV1Input = Omit<
  TheoryRuntimeOutputManifestV1,
  "artifactId" | "schemaVersion" | "generatedAt"
> & {
  generatedAt?: string;
};

type BuildTheoryRuntimeReceiptV1Input = Omit<
  TheoryRuntimeReceiptV1,
  "artifactId" | "schemaVersion" | "generatedAt"
> & {
  generatedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isScalarRecord = (value: unknown): value is Record<string, number | string | boolean | null> =>
  isRecord(value) &&
  Object.values(value).every(
    (entry) =>
      entry === null ||
      typeof entry === "number" ||
      typeof entry === "string" ||
      typeof entry === "boolean",
  );

const isNullableStringRecord = (value: unknown): value is Record<string, string | null> =>
  isRecord(value) && Object.values(value).every((entry) => entry === null || typeof entry === "string");

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");

const isFiniteNonNegativeNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const isFiniteNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;

const isGitSha = (value: unknown): value is string =>
  typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value);

const isNullableGitSha = (value: unknown): value is string | null => value === null || isGitSha(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));

const isNullableIsoTimestamp = (value: unknown): value is string | null =>
  value === null || isIsoTimestamp(value);

const isNullableInteger = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isInteger(value));

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function isGateRecord(value: unknown): value is Record<string, TheoryRuntimeGateStatus> {
  return isRecord(value) && Object.values(value).every((entry) => includes(THEORY_RUNTIME_GATE_STATUS_VALUES, entry));
}

function isOutputManifestEntry(value: unknown): value is TheoryRuntimeOutputManifestEntryV1 {
  return isRecord(value) &&
    isNonEmptyString(value.path) &&
    typeof value.sha256 === "string" && /^[a-f0-9]{64}$/i.test(value.sha256) &&
    isFiniteNonNegativeInteger(value.sizeBytes) &&
    isIsoTimestamp(value.modifiedAt) &&
    includes(THEORY_RUNTIME_ARTIFACT_FRESHNESS_VALUES, value.freshness);
}

function isArtifactEvidence(value: unknown): value is TheoryRuntimeArtifactEvidenceV1 {
  return isRecord(value) &&
    isNonEmptyString(value.path) &&
    typeof value.sha256 === "string" && /^[a-f0-9]{64}$/i.test(value.sha256) &&
    includes(THEORY_RUNTIME_ARTIFACT_FRESHNESS_VALUES, value.freshness) &&
    includes(THEORY_RUNTIME_GATE_STATUS_VALUES, value.status) &&
    isGateRecord(value.gates);
}

export function buildTheoryRuntimeOutputManifestV1(
  input: BuildTheoryRuntimeOutputManifestV1Input,
): TheoryRuntimeOutputManifestV1 {
  return {
    artifactId: THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID,
    schemaVersion: THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    requestId: input.requestId,
    runtimeId: input.runtimeId,
    gitSha: input.gitSha,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    outputDirectory: input.outputDirectory,
    boundToExecution: input.boundToExecution,
    manifestPath: input.manifestPath,
    manifestSha256: input.manifestSha256,
    entries: input.entries,
  };
}

export function validateTheoryRuntimeOutputManifestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["runtime output manifest must be an object"];
  if (value.artifactId !== THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_RUNTIME_OUTPUT_MANIFEST_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_RUNTIME_OUTPUT_MANIFEST_SCHEMA_VERSION}`);
  }
  if (!isIsoTimestamp(value.generatedAt)) issues.push("generatedAt must be an ISO timestamp");
  if (!isNullableString(value.requestId)) issues.push("requestId must be a string or null");
  if (!isNonEmptyString(value.runtimeId)) issues.push("runtimeId must be a non-empty string");
  if (!isNullableGitSha(value.gitSha)) issues.push("gitSha must be a 40- or 64-character hex commit SHA or null");
  if (!isNullableIsoTimestamp(value.startedAt)) issues.push("startedAt must be an ISO timestamp or null");
  if (!isNullableIsoTimestamp(value.completedAt)) issues.push("completedAt must be an ISO timestamp or null");
  if (!isNullableString(value.outputDirectory)) issues.push("outputDirectory must be a string or null");
  if (typeof value.boundToExecution !== "boolean") issues.push("boundToExecution must be boolean");
  if (!isNullableString(value.manifestPath)) issues.push("manifestPath must be a string or null");
  if (
    value.manifestSha256 !== null &&
    (typeof value.manifestSha256 !== "string" || !/^[a-f0-9]{64}$/i.test(value.manifestSha256))
  ) {
    issues.push("manifestSha256 must be a SHA-256 hex string or null");
  }
  if (!Array.isArray(value.entries) || !value.entries.every(isOutputManifestEntry)) {
    issues.push("entries must be an array of runtime output manifest entries");
  }
  if (value.boundToExecution === true) {
    if (!isNonEmptyString(value.requestId)) issues.push("bound manifests require a non-empty requestId");
    if (!isIsoTimestamp(value.startedAt) || !isIsoTimestamp(value.completedAt)) {
      issues.push("bound manifests require ISO startedAt and completedAt timestamps");
    } else if (Date.parse(value.completedAt) < Date.parse(value.startedAt)) {
      issues.push("bound manifest completedAt must not precede startedAt");
    }
    if (!isNonEmptyString(value.outputDirectory)) issues.push("bound manifests require an outputDirectory");
    if (!isNonEmptyString(value.manifestPath)) issues.push("bound manifests require a manifestPath");
  }
  return issues;
}

export function isTheoryRuntimeOutputManifestV1(value: unknown): value is TheoryRuntimeOutputManifestV1 {
  return validateTheoryRuntimeOutputManifestV1(value).length === 0;
}

export function buildTheoryRuntimeReceiptV1(input: BuildTheoryRuntimeReceiptV1Input): TheoryRuntimeReceiptV1 {
  return {
    artifactId: THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
    schemaVersion: THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    receiptId: input.receiptId,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    command: input.command,
    args: input.args,
    status: input.status,
    outputs: input.outputs,
    provenance: input.provenance,
    ...(input.execution ? { execution: input.execution } : {}),
    claimBoundary: input.claimBoundary,
  };
}

export function validateTheoryRuntimeReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["runtime receipt must be an object"];

  if (value.artifactId !== THEORY_RUNTIME_RECEIPT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_RUNTIME_RECEIPT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "receiptId", "runtimeId", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.badgeIds)) issues.push("badgeIds must be an array of strings");
  if (!isNullableString(value.command)) issues.push("command must be a string or null");
  if (!isRecord(value.args)) issues.push("args must be an object");
  if (!includes(THEORY_RUNTIME_RECEIPT_STATUS_VALUES, value.status)) issues.push("status is invalid");

  if (!isRecord(value.outputs)) {
    issues.push("outputs must be an object");
  } else {
    if (!isStringArray(value.outputs.artifacts)) issues.push("outputs.artifacts must be an array of strings");
    if (!isScalarRecord(value.outputs.scalars)) issues.push("outputs.scalars must be a scalar record");
    if (!isNullableStringRecord(value.outputs.units)) issues.push("outputs.units must be a nullable string record");
    if (!isGateRecord(value.outputs.gates)) issues.push("outputs.gates must be a gate status record");
    if (!isStringArray(value.outputs.missingSignals)) {
      issues.push("outputs.missingSignals must be an array of strings");
    }
    if (!isStringArray(value.outputs.warnings)) issues.push("outputs.warnings must be an array of strings");
    if (
      value.outputs.artifactManifest !== undefined &&
      validateTheoryRuntimeOutputManifestV1(value.outputs.artifactManifest).length > 0
    ) {
      issues.push("outputs.artifactManifest must be a valid theory runtime output manifest");
    }
    if (
      value.outputs.artifactEvidence !== undefined &&
      (!Array.isArray(value.outputs.artifactEvidence) || !value.outputs.artifactEvidence.every(isArtifactEvidence))
    ) {
      issues.push("outputs.artifactEvidence must be an array of typed artifact evidence entries");
    }
  }

  if (!isRecord(value.provenance)) {
    issues.push("provenance must be an object");
  } else {
    if (!isNullableGitSha(value.provenance.gitSha)) {
      issues.push("provenance.gitSha must be a 40- or 64-character hex commit SHA or null");
    }
    if (!isNullableIsoTimestamp(value.provenance.startedAt)) {
      issues.push("provenance.startedAt must be an ISO timestamp or null");
    }
    if (!isNullableIsoTimestamp(value.provenance.completedAt)) {
      issues.push("provenance.completedAt must be an ISO timestamp or null");
    }
    if (
      isIsoTimestamp(value.provenance.startedAt) &&
      isIsoTimestamp(value.provenance.completedAt) &&
      Date.parse(value.provenance.completedAt) < Date.parse(value.provenance.startedAt)
    ) {
      issues.push("provenance.completedAt must not precede provenance.startedAt");
    }
    if (!isFiniteNonNegativeNullableNumber(value.provenance.durationMs)) {
      issues.push("provenance.durationMs must be a non-negative finite number or null");
    }
  }

  if (value.execution !== undefined) {
    if (!isRecord(value.execution)) {
      issues.push("execution must be an object when present");
    } else {
      if (!isNonEmptyString(value.execution.command)) issues.push("execution.command must be a non-empty string");
      if (!isStringArray(value.execution.args)) issues.push("execution.args must be an array of strings");
      if (!isNonEmptyString(value.execution.cwd)) issues.push("execution.cwd must be a non-empty string");
      if (!isStringRecord(value.execution.environment)) issues.push("execution.environment must be a string record");
      if (!isNullableString(value.execution.outputDirectory)) {
        issues.push("execution.outputDirectory must be a string or null");
      }
      if (typeof value.execution.outputDirectoryBound !== "boolean") {
        issues.push("execution.outputDirectoryBound must be boolean");
      }
      if (!isNullableInteger(value.execution.exitCode)) issues.push("execution.exitCode must be an integer or null");
      if (typeof value.execution.stdout !== "string") issues.push("execution.stdout must be a string");
      if (typeof value.execution.stderr !== "string") issues.push("execution.stderr must be a string");
      if (typeof value.execution.timedOut !== "boolean") issues.push("execution.timedOut must be boolean");
      if (!isNullableString(value.execution.error)) issues.push("execution.error must be a string or null");
    }
  }

  if (!isRecord(value.claimBoundary)) {
    issues.push("claimBoundary must be an object");
  } else {
    if (!includes(THEORY_RUNTIME_CLAIM_TIER_VALUES, value.claimBoundary.currentTier)) {
      issues.push("claimBoundary.currentTier is invalid");
    }
    if (!includes(THEORY_RUNTIME_MAXIMUM_CLAIM_TIER_VALUES, value.claimBoundary.maximumTier)) {
      issues.push("claimBoundary.maximumTier is invalid");
    }
    if (typeof value.claimBoundary.promotionAllowed !== "boolean") {
      issues.push("claimBoundary.promotionAllowed must be boolean");
    }
    if (!isStringArray(value.claimBoundary.promotionBlockedBy)) {
      issues.push("claimBoundary.promotionBlockedBy must be an array of strings");
    }
  }

  return issues;
}

export function isTheoryRuntimeReceiptV1(value: unknown): value is TheoryRuntimeReceiptV1 {
  return validateTheoryRuntimeReceiptV1(value).length === 0;
}
