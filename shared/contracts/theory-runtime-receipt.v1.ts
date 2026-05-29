import {
  THEORY_RUNTIME_CLAIM_TIER_VALUES,
  THEORY_RUNTIME_MAXIMUM_CLAIM_TIER_VALUES,
  type TheoryRuntimeClaimTier,
  type TheoryRuntimeMaximumClaimTier,
} from "./theory-runtime-entrypoint.v1";

export const THEORY_RUNTIME_RECEIPT_ARTIFACT_ID = "theory_runtime_receipt" as const;
export const THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION = "theory_runtime_receipt/v1" as const;

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
  "fail",
  "not_ready",
  "not_applicable",
  "unknown",
] as const;

export type TheoryRuntimeReceiptStatus = (typeof THEORY_RUNTIME_RECEIPT_STATUS_VALUES)[number];
export type TheoryRuntimeGateStatus = (typeof THEORY_RUNTIME_GATE_STATUS_VALUES)[number];

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
  };
  provenance: {
    gitSha: string | null;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
  };
  claimBoundary: {
    currentTier: TheoryRuntimeClaimTier;
    maximumTier: TheoryRuntimeMaximumClaimTier;
    promotionAllowed: boolean;
    promotionBlockedBy: string[];
  };
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

const isFiniteNonNegativeNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function isGateRecord(value: unknown): value is Record<string, TheoryRuntimeGateStatus> {
  return isRecord(value) && Object.values(value).every((entry) => includes(THEORY_RUNTIME_GATE_STATUS_VALUES, entry));
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
  }

  if (!isRecord(value.provenance)) {
    issues.push("provenance must be an object");
  } else {
    if (!isNullableString(value.provenance.gitSha)) issues.push("provenance.gitSha must be a string or null");
    if (!isNullableString(value.provenance.startedAt)) issues.push("provenance.startedAt must be a string or null");
    if (!isNullableString(value.provenance.completedAt)) {
      issues.push("provenance.completedAt must be a string or null");
    }
    if (!isFiniteNonNegativeNullableNumber(value.provenance.durationMs)) {
      issues.push("provenance.durationMs must be a non-negative finite number or null");
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
