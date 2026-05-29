import type { TheoryRuntimeClaimBoundaryV1 } from "./theory-runtime-entrypoint.v1";

export const THEORY_RUNTIME_RUN_REQUEST_ARTIFACT_ID = "theory_runtime_run_request" as const;
export const THEORY_RUNTIME_RUN_REQUEST_SCHEMA_VERSION = "theory_runtime_run_request/v1" as const;

export const THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES = [
  "quick",
  "full",
  "sweep",
  "evidence_refresh",
] as const;

export const THEORY_RUNTIME_RUN_REQUEST_STATUS_VALUES = [
  "created",
  "queued",
  "running",
  "completed",
  "failed",
  "timeout",
  "cancelled",
] as const;

export type TheoryRuntimeRunRequestScope = (typeof THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES)[number];
export type TheoryRuntimeRunRequestStatus = (typeof THEORY_RUNTIME_RUN_REQUEST_STATUS_VALUES)[number];

export type TheoryRuntimeRunRequestHeartbeatV1 = {
  updatedAt: string;
  stage: string | null;
  message: string | null;
  progress: number | null;
};

export type TheoryRuntimeRunRequestV1 = {
  artifactId: typeof THEORY_RUNTIME_RUN_REQUEST_ARTIFACT_ID;
  schemaVersion: typeof THEORY_RUNTIME_RUN_REQUEST_SCHEMA_VERSION;
  generatedAt: string;
  requestId: string;
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  args: Record<string, unknown>;
  requestedScope: TheoryRuntimeRunRequestScope;
  status: TheoryRuntimeRunRequestStatus;
  createdAt: string;
  updatedAt: string;
  heartbeat: TheoryRuntimeRunRequestHeartbeatV1;
  outputArtifactGlobs: string[];
  claimBoundary: TheoryRuntimeClaimBoundaryV1;
};

type BuildTheoryRuntimeRunRequestV1Input = Omit<
  TheoryRuntimeRunRequestV1,
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

const isFiniteProgress = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

export function buildTheoryRuntimeRunRequestV1(
  input: BuildTheoryRuntimeRunRequestV1Input,
): TheoryRuntimeRunRequestV1 {
  return {
    artifactId: THEORY_RUNTIME_RUN_REQUEST_ARTIFACT_ID,
    schemaVersion: THEORY_RUNTIME_RUN_REQUEST_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    requestId: input.requestId,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    args: input.args,
    requestedScope: input.requestedScope,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    heartbeat: input.heartbeat,
    outputArtifactGlobs: input.outputArtifactGlobs,
    claimBoundary: input.claimBoundary,
  };
}

function validateClaimBoundary(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("claimBoundary must be an object");
    return;
  }
  if (
    !includes(["concept", "exploratory", "diagnostic", "reduced_order", "certified"] as const, value.currentTier)
  ) {
    issues.push("claimBoundary.currentTier is invalid");
  }
  if (!includes(["diagnostic", "reduced_order", "certified"] as const, value.maximumTier)) {
    issues.push("claimBoundary.maximumTier is invalid");
  }
  if (typeof value.promotionAllowed !== "boolean") {
    issues.push("claimBoundary.promotionAllowed must be boolean");
  }
  if (!isStringArray(value.promotionRequires)) {
    issues.push("claimBoundary.promotionRequires must be an array of strings");
  }
}

export function validateTheoryRuntimeRunRequestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["runtime run request must be an object"];

  if (value.artifactId !== THEORY_RUNTIME_RUN_REQUEST_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_RUNTIME_RUN_REQUEST_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_RUNTIME_RUN_REQUEST_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_RUNTIME_RUN_REQUEST_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "requestId", "runtimeId", "graphId", "createdAt", "updatedAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.badgeIds)) issues.push("badgeIds must be an array of strings");
  if (!isRecord(value.args)) issues.push("args must be an object");
  if (!includes(THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES, value.requestedScope)) {
    issues.push("requestedScope is invalid");
  }
  if (!includes(THEORY_RUNTIME_RUN_REQUEST_STATUS_VALUES, value.status)) {
    issues.push("status is invalid");
  }
  if (!isStringArray(value.outputArtifactGlobs)) {
    issues.push("outputArtifactGlobs must be an array of strings");
  }

  if (!isRecord(value.heartbeat)) {
    issues.push("heartbeat must be an object");
  } else {
    if (!isNonEmptyString(value.heartbeat.updatedAt)) issues.push("heartbeat.updatedAt must be a non-empty string");
    if (!isNullableString(value.heartbeat.stage)) issues.push("heartbeat.stage must be string or null");
    if (!isNullableString(value.heartbeat.message)) issues.push("heartbeat.message must be string or null");
    if (!isFiniteProgress(value.heartbeat.progress)) issues.push("heartbeat.progress must be in [0, 1] or null");
  }

  validateClaimBoundary(value.claimBoundary, issues);
  return issues;
}

export function isTheoryRuntimeRunRequestV1(value: unknown): value is TheoryRuntimeRunRequestV1 {
  return validateTheoryRuntimeRunRequestV1(value).length === 0;
}
