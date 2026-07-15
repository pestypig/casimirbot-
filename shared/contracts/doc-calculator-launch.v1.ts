import type { TheoryRuntimeClaimBoundaryV1 } from "./theory-runtime-entrypoint.v1";
import { THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES, type TheoryRuntimeRunRequestScope } from "./theory-runtime-run-request.v1";

export const DOC_CALCULATOR_LAUNCH_SCHEMA = "helix.doc_calculator_launch.v1" as const;

export type DocCalculatorLaunchSourceV1 = {
  docPath: string;
  anchor: string | null;
  label: string | null;
};

export type DocScalarCalculatorLaunchV1 = {
  schema: typeof DOC_CALCULATOR_LAUNCH_SCHEMA;
  kind: "scalar";
  source: DocCalculatorLaunchSourceV1;
  latex: string;
  claimBoundaryNotes: string[];
};

export type DocRuntimeCalculatorLaunchV1 = {
  schema: typeof DOC_CALCULATOR_LAUNCH_SCHEMA;
  kind: "runtime";
  source: DocCalculatorLaunchSourceV1;
  runtime: {
    runtimeId: string;
    label: string;
    description: string;
    command: string;
    args: Record<string, unknown>;
    requestedScope: TheoryRuntimeRunRequestScope;
    graphId: string;
    badgeIds: string[];
    outputArtifactGlobs: string[];
    claimBoundary: TheoryRuntimeClaimBoundaryV1;
  };
};

export type DocCalculatorLaunchV1 = DocScalarCalculatorLaunchV1 | DocRuntimeCalculatorLaunchV1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

function validateSource(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("source must be an object");
    return;
  }
  if (!isNonEmptyString(value.docPath)) issues.push("source.docPath must be a non-empty string");
  if (!isNullableString(value.anchor)) issues.push("source.anchor must be a string or null");
  if (!isNullableString(value.label)) issues.push("source.label must be a string or null");
}

function validateClaimBoundary(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("runtime.claimBoundary must be an object");
    return;
  }
  if (!isNonEmptyString(value.currentTier)) issues.push("runtime.claimBoundary.currentTier is required");
  if (!isNonEmptyString(value.maximumTier)) issues.push("runtime.claimBoundary.maximumTier is required");
  if (typeof value.promotionAllowed !== "boolean") {
    issues.push("runtime.claimBoundary.promotionAllowed must be boolean");
  }
  if (!isStringArray(value.promotionRequires)) {
    issues.push("runtime.claimBoundary.promotionRequires must be an array of strings");
  }
}

export function validateDocCalculatorLaunchV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["calculator launch must be an object"];
  if (value.schema !== DOC_CALCULATOR_LAUNCH_SCHEMA) {
    issues.push(`schema must be ${DOC_CALCULATOR_LAUNCH_SCHEMA}`);
  }
  validateSource(value.source, issues);
  if (value.kind === "scalar") {
    if (!isNonEmptyString(value.latex)) issues.push("latex must be a non-empty string");
    if (!isStringArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be an array of strings");
    return issues;
  }
  if (value.kind !== "runtime") {
    issues.push("kind must be scalar or runtime");
    return issues;
  }
  if (!isRecord(value.runtime)) {
    issues.push("runtime must be an object");
    return issues;
  }
  for (const field of ["runtimeId", "label", "description", "command", "graphId"] as const) {
    if (!isNonEmptyString(value.runtime[field])) issues.push(`runtime.${field} must be a non-empty string`);
  }
  if (!isRecord(value.runtime.args)) issues.push("runtime.args must be an object");
  if (!THEORY_RUNTIME_RUN_REQUEST_SCOPE_VALUES.includes(value.runtime.requestedScope as TheoryRuntimeRunRequestScope)) {
    issues.push("runtime.requestedScope is invalid");
  }
  if (!isStringArray(value.runtime.badgeIds)) issues.push("runtime.badgeIds must be an array of strings");
  if (!isStringArray(value.runtime.outputArtifactGlobs)) {
    issues.push("runtime.outputArtifactGlobs must be an array of strings");
  }
  validateClaimBoundary(value.runtime.claimBoundary, issues);
  return issues;
}

export function isDocCalculatorLaunchV1(value: unknown): value is DocCalculatorLaunchV1 {
  return validateDocCalculatorLaunchV1(value).length === 0;
}
