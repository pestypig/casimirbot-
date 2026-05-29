import {
  isScientificCalculatorStepTraceArtifactV1,
  type ScientificCalculatorStepTraceArtifactV1,
} from "./scientific-calculator-step-schema.v1";

export const THEORY_RUNTIME_MATH_TRACE_ARTIFACT_ID = "theory_runtime_math_trace" as const;
export const THEORY_RUNTIME_MATH_TRACE_SCHEMA_VERSION = "theory_runtime_math_trace/v1" as const;

export const THEORY_RUNTIME_FAMILY_VALUES = [
  "gr_tensor",
  "casimir_field",
  "qei_worldline",
  "solar_spectrum",
  "starsim_runtime",
  "tokamak_runtime",
  "warp_full_solve",
  "generic_runtime",
] as const;

export const THEORY_RUNTIME_MATH_OPERATOR_KIND_VALUES = [
  "tensor_definition",
  "component_expansion",
  "field_sample",
  "region_aggregate",
  "worldline_integral",
  "gate_status",
  "runtime_receipt",
  "scalar_cut",
  "reference",
] as const;

export const THEORY_RUNTIME_MATH_STEP_STATUS_VALUES = [
  "pending",
  "computed",
  "skipped",
  "blocked",
  "failed",
] as const;

export type TheoryRuntimeFamily = (typeof THEORY_RUNTIME_FAMILY_VALUES)[number];
export type TheoryRuntimeMathOperatorKind = (typeof THEORY_RUNTIME_MATH_OPERATOR_KIND_VALUES)[number];
export type TheoryRuntimeMathStepStatus = (typeof THEORY_RUNTIME_MATH_STEP_STATUS_VALUES)[number];

export type TheoryRuntimeScalarCutV1 = {
  id: string;
  label: string;
  expression: string;
  displayLatex: string;
  targetVariable?: string | null;
  calculatorArtifactV1?: ScientificCalculatorStepTraceArtifactV1 | null;
};

export type TheoryRuntimeMathStepV1 = {
  id: string;
  index: number;
  title: string;
  operatorKind: TheoryRuntimeMathOperatorKind;
  displayLatex: string | null;
  expression: string | null;
  inputSymbols: string[];
  outputSymbols: string[];
  status: TheoryRuntimeMathStepStatus;
  computedBy: string;
  artifactRef?: string | null;
  scalarCuts: TheoryRuntimeScalarCutV1[];
  warnings: string[];
};

export type TheoryRuntimeMathTraceV1 = {
  artifactId: typeof THEORY_RUNTIME_MATH_TRACE_ARTIFACT_ID;
  schemaVersion: typeof THEORY_RUNTIME_MATH_TRACE_SCHEMA_VERSION;
  generatedAt: string;
  traceId: string;
  runtimeId: string;
  graphId: string;
  badgeIds: string[];
  request: {
    family: TheoryRuntimeFamily;
    target: string;
    chart?: string | null;
    assumptions: string[];
  };
  steps: TheoryRuntimeMathStepV1[];
  summary: {
    stepCount: number;
    computedCount: number;
    scalarCutCount: number;
    blockedCount: number;
    failedCount: number;
    claimBoundaryNotes: string[];
  };
};

type BuildTheoryRuntimeMathTraceV1Input = Omit<
  TheoryRuntimeMathTraceV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary"
> & {
  generatedAt?: string;
  summary?: Partial<TheoryRuntimeMathTraceV1["summary"]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function buildSummary(
  steps: TheoryRuntimeMathStepV1[],
  summary?: Partial<TheoryRuntimeMathTraceV1["summary"]>,
): TheoryRuntimeMathTraceV1["summary"] {
  return {
    stepCount: steps.length,
    computedCount: steps.filter((step) => step.status === "computed").length,
    scalarCutCount: steps.reduce((sum, step) => sum + step.scalarCuts.length, 0),
    blockedCount: steps.filter((step) => step.status === "blocked").length,
    failedCount: steps.filter((step) => step.status === "failed").length,
    claimBoundaryNotes: Array.from(new Set(summary?.claimBoundaryNotes ?? [])),
  };
}

export function buildTheoryRuntimeMathTraceV1(
  input: BuildTheoryRuntimeMathTraceV1Input,
): TheoryRuntimeMathTraceV1 {
  return {
    artifactId: THEORY_RUNTIME_MATH_TRACE_ARTIFACT_ID,
    schemaVersion: THEORY_RUNTIME_MATH_TRACE_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    traceId: input.traceId,
    runtimeId: input.runtimeId,
    graphId: input.graphId,
    badgeIds: input.badgeIds,
    request: input.request,
    steps: input.steps,
    summary: buildSummary(input.steps, input.summary),
  };
}

function validateSummary(
  value: Record<string, unknown>,
  steps: TheoryRuntimeMathStepV1[],
  issues: string[],
): void {
  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
    return;
  }
  const expected = buildSummary(steps, {
    claimBoundaryNotes: isStringArray(value.summary.claimBoundaryNotes) ? value.summary.claimBoundaryNotes : [],
  });
  for (const field of ["stepCount", "computedCount", "scalarCutCount", "blockedCount", "failedCount"] as const) {
    if (value.summary[field] !== expected[field]) {
      issues.push(`summary.${field} must be ${expected[field]}`);
    }
  }
  if (!isStringArray(value.summary.claimBoundaryNotes)) {
    issues.push("summary.claimBoundaryNotes must be an array of strings");
  }
}

export function validateTheoryRuntimeMathTraceV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["runtime math trace must be an object"];

  if (value.artifactId !== THEORY_RUNTIME_MATH_TRACE_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_RUNTIME_MATH_TRACE_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_RUNTIME_MATH_TRACE_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_RUNTIME_MATH_TRACE_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "traceId", "runtimeId", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.badgeIds)) issues.push("badgeIds must be an array of strings");

  if (!isRecord(value.request)) {
    issues.push("request must be an object");
  } else {
    if (!includes(THEORY_RUNTIME_FAMILY_VALUES, value.request.family)) issues.push("request.family is invalid");
    if (!isNonEmptyString(value.request.target)) issues.push("request.target must be a non-empty string");
    if (value.request.chart !== undefined && !isNullableString(value.request.chart)) {
      issues.push("request.chart must be a string or null");
    }
    if (!isStringArray(value.request.assumptions)) issues.push("request.assumptions must be an array of strings");
  }

  if (!Array.isArray(value.steps)) issues.push("steps must be an array");
  const steps: TheoryRuntimeMathStepV1[] = [];
  const stepIds = new Set<string>();
  for (const [index, rawStep] of (Array.isArray(value.steps) ? value.steps : []).entries()) {
    const prefix = `steps[${index}]`;
    if (!isRecord(rawStep)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawStep.id)) issues.push(`${prefix}.id must be a non-empty string`);
    else if (stepIds.has(rawStep.id)) issues.push(`duplicate step id: ${rawStep.id}`);
    else stepIds.add(rawStep.id);
    if (rawStep.index !== index + 1) issues.push(`${prefix}.index must be ${index + 1}`);
    if (!isNonEmptyString(rawStep.title)) issues.push(`${prefix}.title must be a non-empty string`);
    if (!includes(THEORY_RUNTIME_MATH_OPERATOR_KIND_VALUES, rawStep.operatorKind)) {
      issues.push(`${prefix}.operatorKind is invalid`);
    }
    if (!isNullableString(rawStep.displayLatex)) issues.push(`${prefix}.displayLatex must be a string or null`);
    if (!isNullableString(rawStep.expression)) issues.push(`${prefix}.expression must be a string or null`);
    if (!isStringArray(rawStep.inputSymbols)) issues.push(`${prefix}.inputSymbols must be an array of strings`);
    if (!isStringArray(rawStep.outputSymbols)) issues.push(`${prefix}.outputSymbols must be an array of strings`);
    if (!includes(THEORY_RUNTIME_MATH_STEP_STATUS_VALUES, rawStep.status)) issues.push(`${prefix}.status is invalid`);
    if (!isNonEmptyString(rawStep.computedBy)) issues.push(`${prefix}.computedBy must be a non-empty string`);
    if (rawStep.artifactRef !== undefined && !isNullableString(rawStep.artifactRef)) {
      issues.push(`${prefix}.artifactRef must be a string or null`);
    }
    if (!Array.isArray(rawStep.scalarCuts)) issues.push(`${prefix}.scalarCuts must be an array`);
    const scalarCuts: TheoryRuntimeScalarCutV1[] = [];
    for (const [cutIndex, rawCut] of (Array.isArray(rawStep.scalarCuts) ? rawStep.scalarCuts : []).entries()) {
      const cutPrefix = `${prefix}.scalarCuts[${cutIndex}]`;
      if (!isRecord(rawCut)) {
        issues.push(`${cutPrefix} must be an object`);
        continue;
      }
      for (const field of ["id", "label", "expression", "displayLatex"] as const) {
        if (!isNonEmptyString(rawCut[field])) issues.push(`${cutPrefix}.${field} must be a non-empty string`);
      }
      if (rawCut.targetVariable !== undefined && !isNullableString(rawCut.targetVariable)) {
        issues.push(`${cutPrefix}.targetVariable must be a string or null`);
      }
      if (
        rawCut.calculatorArtifactV1 !== undefined &&
        rawCut.calculatorArtifactV1 !== null &&
        !isScientificCalculatorStepTraceArtifactV1(rawCut.calculatorArtifactV1)
      ) {
        issues.push(`${cutPrefix}.calculatorArtifactV1 is invalid`);
      }
      scalarCuts.push(rawCut as TheoryRuntimeScalarCutV1);
    }
    if (!isStringArray(rawStep.warnings)) issues.push(`${prefix}.warnings must be an array of strings`);
    steps.push({ ...(rawStep as TheoryRuntimeMathStepV1), scalarCuts });
  }

  validateSummary(value, steps, issues);
  return issues;
}

export function isTheoryRuntimeMathTraceV1(value: unknown): value is TheoryRuntimeMathTraceV1 {
  return validateTheoryRuntimeMathTraceV1(value).length === 0;
}
