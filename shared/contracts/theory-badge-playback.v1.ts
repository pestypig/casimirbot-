import type { ScientificCalculatorStepTraceArtifactV1 } from "./scientific-calculator-step-schema.v1";

export const THEORY_BADGE_PLAYBACK_ARTIFACT_ID = "theory_badge_playback" as const;
export const THEORY_BADGE_PLAYBACK_SCHEMA_VERSION = "theory_badge_playback/v1" as const;

export const THEORY_BADGE_PLAYBACK_STATUS_VALUES = [
  "pending",
  "running",
  "solved",
  "skipped",
  "failed",
] as const;

export const THEORY_BADGE_PLAYBACK_SKIP_REASON_VALUES = [
  "no_calculator_payload",
  "empty_expression",
  "unsupported_payload",
  "upstream_failed",
] as const;

export type TheoryBadgePlaybackStatus = (typeof THEORY_BADGE_PLAYBACK_STATUS_VALUES)[number];
export type TheoryBadgePlaybackSkipReason = (typeof THEORY_BADGE_PLAYBACK_SKIP_REASON_VALUES)[number];

export type TheoryBadgePlaybackStepV1 = {
  id: string;
  index: number;

  badgeId: string;
  badgeTitle: string;

  payloadId: string | null;
  expression: string | null;
  displayLatex: string | null;
  sourcePath: string;

  status: TheoryBadgePlaybackStatus;
  skipReason: TheoryBadgePlaybackSkipReason | null;

  startedAt: string | null;
  completedAt: string | null;

  resultText: string | null;
  resultLatex: string | null;
  resultKind: string | null;
  confidence: number | null;
  fallbackReason: string | null;

  calculatorArtifactV1: ScientificCalculatorStepTraceArtifactV1 | null;
  warnings: string[];
};

export type TheoryBadgePlaybackArtifactV1 = {
  artifactId: typeof THEORY_BADGE_PLAYBACK_ARTIFACT_ID;
  schemaVersion: typeof THEORY_BADGE_PLAYBACK_SCHEMA_VERSION;

  generatedAt: string;
  runId: string;

  graphId: string;
  targetBadgeId: string;
  targetBadgeTitle: string;

  plan: {
    mode: "dependency_closure";
    orderedBadgeIds: string[];
    executableRelationTypes: string[];
    skippedRelationTypes: string[];
  };

  steps: TheoryBadgePlaybackStepV1[];

  summary: {
    badgeCount: number;
    payloadCount: number;
    solvedCount: number;
    skippedCount: number;
    failedCount: number;
    calculatorArtifactCount: number;
    ok: boolean;
  };
};

type BuildTheoryBadgePlaybackArtifactInput = Omit<
  TheoryBadgePlaybackArtifactV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary"
> & {
  generatedAt?: string;
  summary?: Partial<TheoryBadgePlaybackArtifactV1["summary"]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function buildSummary(
  steps: TheoryBadgePlaybackStepV1[],
  orderedBadgeIds: string[],
): TheoryBadgePlaybackArtifactV1["summary"] {
  const payloadCount = steps.filter((step) => step.payloadId !== null).length;
  const solvedCount = steps.filter((step) => step.status === "solved").length;
  const skippedCount = steps.filter((step) => step.status === "skipped").length;
  const failedCount = steps.filter((step) => step.status === "failed").length;
  const calculatorArtifactCount = steps.filter((step) => step.calculatorArtifactV1 !== null).length;
  return {
    badgeCount: orderedBadgeIds.length,
    payloadCount,
    solvedCount,
    skippedCount,
    failedCount,
    calculatorArtifactCount,
    ok: failedCount === 0,
  };
}

export function buildTheoryBadgePlaybackArtifactV1(
  input: BuildTheoryBadgePlaybackArtifactInput,
): TheoryBadgePlaybackArtifactV1 {
  const summary = {
    ...buildSummary(input.steps, input.plan.orderedBadgeIds),
    ...input.summary,
  };

  return {
    artifactId: THEORY_BADGE_PLAYBACK_ARTIFACT_ID,
    schemaVersion: THEORY_BADGE_PLAYBACK_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    runId: input.runId,
    graphId: input.graphId,
    targetBadgeId: input.targetBadgeId,
    targetBadgeTitle: input.targetBadgeTitle,
    plan: input.plan,
    steps: input.steps,
    summary,
  };
}

export function validateTheoryBadgePlaybackArtifactV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["playback artifact must be an object"];

  if (value.artifactId !== THEORY_BADGE_PLAYBACK_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_BADGE_PLAYBACK_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_BADGE_PLAYBACK_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_BADGE_PLAYBACK_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.runId)) issues.push("runId must be a non-empty string");
  if (!isNonEmptyString(value.graphId)) issues.push("graphId must be a non-empty string");
  if (!isNonEmptyString(value.targetBadgeId)) issues.push("targetBadgeId must be a non-empty string");
  if (!isNonEmptyString(value.targetBadgeTitle)) issues.push("targetBadgeTitle must be a non-empty string");

  const plan = isRecord(value.plan) ? value.plan : null;
  if (!plan) {
    issues.push("plan must be an object");
  } else {
    if (plan.mode !== "dependency_closure") issues.push("plan.mode must be dependency_closure");
    if (!isStringArray(plan.orderedBadgeIds)) issues.push("plan.orderedBadgeIds must be strings");
    if (!isStringArray(plan.executableRelationTypes)) issues.push("plan.executableRelationTypes must be strings");
    if (!isStringArray(plan.skippedRelationTypes)) issues.push("plan.skippedRelationTypes must be strings");
  }

  const steps = Array.isArray(value.steps) ? value.steps : [];
  if (!Array.isArray(value.steps)) issues.push("steps must be an array");
  const stepIds = new Set<string>();
  for (const [index, rawStep] of steps.entries()) {
    const prefix = `steps[${index}]`;
    if (!isRecord(rawStep)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawStep.id)) {
      issues.push(`${prefix}.id must be a non-empty string`);
    } else if (stepIds.has(rawStep.id)) {
      issues.push(`duplicate step id: ${rawStep.id}`);
    } else {
      stepIds.add(rawStep.id);
    }
    if (rawStep.index !== index + 1) issues.push(`${prefix}.index must be ${index + 1}`);
    if (!isNonEmptyString(rawStep.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
    if (!isNonEmptyString(rawStep.badgeTitle)) issues.push(`${prefix}.badgeTitle must be a non-empty string`);
    if (!isNullableString(rawStep.payloadId)) issues.push(`${prefix}.payloadId must be string or null`);
    if (!isNullableString(rawStep.expression)) issues.push(`${prefix}.expression must be string or null`);
    if (!isNullableString(rawStep.displayLatex)) issues.push(`${prefix}.displayLatex must be string or null`);
    if (!isNonEmptyString(rawStep.sourcePath)) issues.push(`${prefix}.sourcePath must be a non-empty string`);
    if (!includes(THEORY_BADGE_PLAYBACK_STATUS_VALUES, rawStep.status)) issues.push(`${prefix}.status is invalid`);
    if (rawStep.skipReason !== null && !includes(THEORY_BADGE_PLAYBACK_SKIP_REASON_VALUES, rawStep.skipReason)) {
      issues.push(`${prefix}.skipReason is invalid`);
    }
    if (!isNullableString(rawStep.startedAt)) issues.push(`${prefix}.startedAt must be string or null`);
    if (!isNullableString(rawStep.completedAt)) issues.push(`${prefix}.completedAt must be string or null`);
    if (!isNullableString(rawStep.resultText)) issues.push(`${prefix}.resultText must be string or null`);
    if (!isNullableString(rawStep.resultLatex)) issues.push(`${prefix}.resultLatex must be string or null`);
    if (!isNullableString(rawStep.resultKind)) issues.push(`${prefix}.resultKind must be string or null`);
    if (rawStep.confidence !== null && typeof rawStep.confidence !== "number") {
      issues.push(`${prefix}.confidence must be number or null`);
    }
    if (!isNullableString(rawStep.fallbackReason)) issues.push(`${prefix}.fallbackReason must be string or null`);
    if (!isStringArray(rawStep.warnings)) issues.push(`${prefix}.warnings must be strings`);

    if (rawStep.status === "solved" && rawStep.calculatorArtifactV1 == null) {
      issues.push(`${prefix}.calculatorArtifactV1 is required for solved steps`);
    }
    if (rawStep.status === "skipped" && rawStep.skipReason == null) {
      issues.push(`${prefix}.skipReason is required for skipped steps`);
    }
    if (rawStep.status === "failed" && (!Array.isArray(rawStep.warnings) || rawStep.warnings.length === 0)) {
      issues.push(`${prefix}.warnings is required for failed steps`);
    }
  }

  const summary = isRecord(value.summary) ? value.summary : null;
  if (!summary) {
    issues.push("summary must be an object");
  } else {
    const orderedBadgeIds = plan && isStringArray(plan.orderedBadgeIds) ? plan.orderedBadgeIds : [];
    const expected = buildSummary(steps as TheoryBadgePlaybackStepV1[], orderedBadgeIds);
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (summary[key] !== expectedValue) {
        issues.push(`summary.${key} must be ${String(expectedValue)}`);
      }
    }
  }

  return issues;
}

export function isTheoryBadgePlaybackArtifactV1(value: unknown): value is TheoryBadgePlaybackArtifactV1 {
  return validateTheoryBadgePlaybackArtifactV1(value).length === 0;
}
