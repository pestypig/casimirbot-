import { THEORY_RUNTIME_FAMILY_VALUES, type TheoryRuntimeFamily } from "./theory-runtime-math-trace.v1";

export const THEORY_RUNTIME_ENTRYPOINT_ARTIFACT_ID = "theory_runtime_entrypoint" as const;
export const THEORY_RUNTIME_ENTRYPOINT_SCHEMA_VERSION = "theory_runtime_entrypoint/v1" as const;

export const THEORY_RUNTIME_SOURCE_REF_KIND_VALUES = [
  "repo_module",
  "script",
  "artifact",
  "doc",
  "config",
  "runtime",
] as const;

export const THEORY_RUNTIME_CLAIM_TIER_VALUES = [
  "concept",
  "exploratory",
  "diagnostic",
  "reduced_order",
  "certified",
] as const;

export const THEORY_RUNTIME_MAXIMUM_CLAIM_TIER_VALUES = [
  "diagnostic",
  "reduced_order",
  "certified",
] as const;

export type TheoryRuntimeSourceRefKind = (typeof THEORY_RUNTIME_SOURCE_REF_KIND_VALUES)[number];
export type TheoryRuntimeClaimTier = (typeof THEORY_RUNTIME_CLAIM_TIER_VALUES)[number];
export type TheoryRuntimeMaximumClaimTier = (typeof THEORY_RUNTIME_MAXIMUM_CLAIM_TIER_VALUES)[number];

export type TheoryRuntimeSourceRefV1 = {
  kind: TheoryRuntimeSourceRefKind;
  path: string;
  id?: string | null;
  note?: string | null;
};

export type TheoryRuntimeClaimBoundaryV1 = {
  currentTier: TheoryRuntimeClaimTier;
  maximumTier: TheoryRuntimeMaximumClaimTier;
  promotionAllowed: boolean;
  promotionRequires: string[];
};

export type TheoryRuntimeEntrypointV1 = {
  artifactId: typeof THEORY_RUNTIME_ENTRYPOINT_ARTIFACT_ID;
  schemaVersion: typeof THEORY_RUNTIME_ENTRYPOINT_SCHEMA_VERSION;
  generatedAt: string;
  runtimeId: string;
  family: TheoryRuntimeFamily;
  label: string;
  description: string;
  command: string | null;
  argsSchema: Record<string, unknown> | null;
  outputArtifactGlobs: string[];
  expectedReceiptKind: string;
  ownedBadgeIds: string[];
  sourceRefs: TheoryRuntimeSourceRefV1[];
  timeoutPolicy: {
    smallMs: number;
    fullMs: number;
  };
  claimBoundary: TheoryRuntimeClaimBoundaryV1;
};

type BuildTheoryRuntimeEntrypointV1Input = Omit<
  TheoryRuntimeEntrypointV1,
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

const isFiniteNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

export function buildTheoryRuntimeEntrypointV1(
  input: BuildTheoryRuntimeEntrypointV1Input,
): TheoryRuntimeEntrypointV1 {
  return {
    artifactId: THEORY_RUNTIME_ENTRYPOINT_ARTIFACT_ID,
    schemaVersion: THEORY_RUNTIME_ENTRYPOINT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    runtimeId: input.runtimeId,
    family: input.family,
    label: input.label,
    description: input.description,
    command: input.command,
    argsSchema: input.argsSchema,
    outputArtifactGlobs: input.outputArtifactGlobs,
    expectedReceiptKind: input.expectedReceiptKind,
    ownedBadgeIds: input.ownedBadgeIds,
    sourceRefs: input.sourceRefs,
    timeoutPolicy: input.timeoutPolicy,
    claimBoundary: input.claimBoundary,
  };
}

export function validateTheoryRuntimeEntrypointV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["runtime entrypoint must be an object"];

  if (value.artifactId !== THEORY_RUNTIME_ENTRYPOINT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_RUNTIME_ENTRYPOINT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_RUNTIME_ENTRYPOINT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_RUNTIME_ENTRYPOINT_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "runtimeId", "label", "description", "expectedReceiptKind"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!includes(THEORY_RUNTIME_FAMILY_VALUES, value.family)) issues.push("family is invalid");
  if (!isNullableString(value.command)) issues.push("command must be a string or null");
  if (value.argsSchema !== null && !isRecord(value.argsSchema)) issues.push("argsSchema must be an object or null");
  if (!isStringArray(value.outputArtifactGlobs)) issues.push("outputArtifactGlobs must be an array of strings");
  if (!isStringArray(value.ownedBadgeIds)) issues.push("ownedBadgeIds must be an array of strings");

  if (!Array.isArray(value.sourceRefs)) {
    issues.push("sourceRefs must be an array");
  } else {
    for (const [index, rawRef] of value.sourceRefs.entries()) {
      const prefix = `sourceRefs[${index}]`;
      if (!isRecord(rawRef)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!includes(THEORY_RUNTIME_SOURCE_REF_KIND_VALUES, rawRef.kind)) issues.push(`${prefix}.kind is invalid`);
      if (!isNonEmptyString(rawRef.path)) issues.push(`${prefix}.path must be a non-empty string`);
      if (rawRef.id !== undefined && !isNullableString(rawRef.id)) issues.push(`${prefix}.id must be a string or null`);
      if (rawRef.note !== undefined && !isNullableString(rawRef.note)) {
        issues.push(`${prefix}.note must be a string or null`);
      }
    }
  }

  if (!isRecord(value.timeoutPolicy)) {
    issues.push("timeoutPolicy must be an object");
  } else {
    if (!isFiniteNonNegativeNumber(value.timeoutPolicy.smallMs)) {
      issues.push("timeoutPolicy.smallMs must be a non-negative finite number");
    }
    if (!isFiniteNonNegativeNumber(value.timeoutPolicy.fullMs)) {
      issues.push("timeoutPolicy.fullMs must be a non-negative finite number");
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
    if (!isStringArray(value.claimBoundary.promotionRequires)) {
      issues.push("claimBoundary.promotionRequires must be an array of strings");
    }
  }

  return issues;
}

export function isTheoryRuntimeEntrypointV1(value: unknown): value is TheoryRuntimeEntrypointV1 {
  return validateTheoryRuntimeEntrypointV1(value).length === 0;
}
