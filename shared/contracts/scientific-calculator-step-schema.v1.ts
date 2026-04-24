export const SCIENTIFIC_CALCULATOR_STEP_TRACE_ARTIFACT_ID =
  "scientific_calculator_step_trace";
export const SCIENTIFIC_CALCULATOR_STEP_TRACE_SCHEMA_VERSION =
  "scientific_calculator_step_trace/v1";

export const SCIENTIFIC_SOLVE_MODE_VALUES = [
  "evaluate_expression",
  "solve_equation",
] as const;

export const SCIENTIFIC_STEP_STAGE_VALUES = [
  "input",
  "normalize",
  "assumptions",
  "transform",
  "method",
  "solve",
  "verify",
  "result",
] as const;

export const SCIENTIFIC_RESULT_KIND_VALUES = [
  "exact",
  "approximate",
  "symbolic_relation",
  "set_of_solutions",
  "unsolved",
] as const;

export const SCIENTIFIC_PARSE_STATUS_VALUES = [
  "ok",
  "partial",
  "fallback_text",
  "error",
] as const;

export const SCIENTIFIC_FALLBACK_REASON_VALUES = [
  "no_closed_form",
  "multiple_symbols_ambiguous_target",
  "parser_normalization_limit",
  "engine_not_implemented",
  "domain_constraint_missing",
  "internal_solver_error",
] as const;

export type ScientificSolveMode = (typeof SCIENTIFIC_SOLVE_MODE_VALUES)[number];
export type ScientificStepStage = (typeof SCIENTIFIC_STEP_STAGE_VALUES)[number];
export type ScientificResultKind = (typeof SCIENTIFIC_RESULT_KIND_VALUES)[number];
export type ScientificParseStatus = (typeof SCIENTIFIC_PARSE_STATUS_VALUES)[number];
export type ScientificFallbackReason =
  (typeof SCIENTIFIC_FALLBACK_REASON_VALUES)[number];

export type ScientificStepSchemaV1 = {
  id: string;
  index: number;
  stage: ScientificStepStage;
  title: string;
  text: string;
  latex: string | null;
  operation:
    | {
        kind: "rewrite" | "substitute" | "expand" | "factor" | "solve" | "verify" | "note";
        rule: string;
      }
    | null;
  warnings: string[];
};

export type ScientificResultSchemaV1 = {
  kind: ScientificResultKind;
  text: string;
  latex: string | null;
  solutions: Array<{
    variable: string;
    text: string;
    latex: string | null;
  }>;
  verification:
    | {
        status: "pass" | "fail" | "not_run";
        text: string;
      }
    | null;
};

export type ScientificCalculatorStepTraceArtifactV1 = {
  artifactId: typeof SCIENTIFIC_CALCULATOR_STEP_TRACE_ARTIFACT_ID;
  schemaVersion: typeof SCIENTIFIC_CALCULATOR_STEP_TRACE_SCHEMA_VERSION;
  panelId: "scientific-calculator";
  generatedAt: string;
  request: {
    mode: ScientificSolveMode;
    inputLatex: string;
    targetVariable: string | null;
    assumptions: {
      domain: "real" | "complex" | "unspecified";
      angleMode: "radian" | "degree";
    };
  };
  normalization: {
    parseStatus: ScientificParseStatus;
    canonicalText: string;
    canonicalLatex: string | null;
    issues: string[];
  };
  steps: ScientificStepSchemaV1[];
  result: ScientificResultSchemaV1;
  quality: {
    confidence: number;
    fallbackReason: ScientificFallbackReason | null;
    engine: "nerdamer" | "mathlive" | "sympy" | "hybrid";
  };
};

type BuildScientificCalculatorStepTraceInput = Omit<
  ScientificCalculatorStepTraceArtifactV1,
  "artifactId" | "schemaVersion"
>;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isArrayOfStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const includesLiteral = <T extends readonly string[]>(
  literals: T,
  value: unknown,
): value is T[number] => literals.includes(value as T[number]);

const isStage = (value: unknown): value is ScientificStepStage =>
  includesLiteral(SCIENTIFIC_STEP_STAGE_VALUES, value);

const isResultKind = (value: unknown): value is ScientificResultKind =>
  includesLiteral(SCIENTIFIC_RESULT_KIND_VALUES, value);

const isParseStatus = (value: unknown): value is ScientificParseStatus =>
  includesLiteral(SCIENTIFIC_PARSE_STATUS_VALUES, value);

const isSolveMode = (value: unknown): value is ScientificSolveMode =>
  includesLiteral(SCIENTIFIC_SOLVE_MODE_VALUES, value);

const isFallbackReason = (value: unknown): value is ScientificFallbackReason =>
  includesLiteral(SCIENTIFIC_FALLBACK_REASON_VALUES, value);

export const buildScientificCalculatorStepTraceArtifactV1 = (
  input: BuildScientificCalculatorStepTraceInput,
): ScientificCalculatorStepTraceArtifactV1 => ({
  artifactId: SCIENTIFIC_CALCULATOR_STEP_TRACE_ARTIFACT_ID,
  schemaVersion: SCIENTIFIC_CALCULATOR_STEP_TRACE_SCHEMA_VERSION,
  ...input,
  quality: {
    ...input.quality,
    confidence: Math.max(0, Math.min(1, Number(input.quality.confidence) || 0)),
  },
});

export const isScientificCalculatorStepTraceArtifactV1 = (
  value: unknown,
): value is ScientificCalculatorStepTraceArtifactV1 => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  if (
    record.artifactId !== SCIENTIFIC_CALCULATOR_STEP_TRACE_ARTIFACT_ID ||
    record.schemaVersion !== SCIENTIFIC_CALCULATOR_STEP_TRACE_SCHEMA_VERSION ||
    record.panelId !== "scientific-calculator" ||
    !isString(record.generatedAt)
  ) {
    return false;
  }

  const request =
    record.request && typeof record.request === "object"
      ? (record.request as Record<string, unknown>)
      : null;
  const normalization =
    record.normalization && typeof record.normalization === "object"
      ? (record.normalization as Record<string, unknown>)
      : null;
  const result =
    record.result && typeof record.result === "object"
      ? (record.result as Record<string, unknown>)
      : null;
  const quality =
    record.quality && typeof record.quality === "object"
      ? (record.quality as Record<string, unknown>)
      : null;

  if (
    !request ||
    !isSolveMode(request.mode) ||
    !isString(request.inputLatex) ||
    !isNullableString(request.targetVariable)
  ) {
    return false;
  }

  const assumptions =
    request.assumptions && typeof request.assumptions === "object"
      ? (request.assumptions as Record<string, unknown>)
      : null;
  if (
    !assumptions ||
    !includesLiteral(["real", "complex", "unspecified"] as const, assumptions.domain) ||
    !includesLiteral(["radian", "degree"] as const, assumptions.angleMode)
  ) {
    return false;
  }

  if (
    !normalization ||
    !isParseStatus(normalization.parseStatus) ||
    !isString(normalization.canonicalText) ||
    !isNullableString(normalization.canonicalLatex) ||
    !isArrayOfStrings(normalization.issues)
  ) {
    return false;
  }

  const steps = record.steps;
  if (!Array.isArray(steps)) return false;
  const stepsValid = steps.every((entry, index) => {
    if (!entry || typeof entry !== "object") return false;
    const step = entry as Record<string, unknown>;
    if (
      !isString(step.id) ||
      step.index !== index + 1 ||
      !isStage(step.stage) ||
      !isString(step.title) ||
      !isString(step.text) ||
      !isNullableString(step.latex) ||
      !isArrayOfStrings(step.warnings)
    ) {
      return false;
    }
    if (step.operation === null) return true;
    if (!step.operation || typeof step.operation !== "object") return false;
    const operation = step.operation as Record<string, unknown>;
    return (
      includesLiteral(
        ["rewrite", "substitute", "expand", "factor", "solve", "verify", "note"] as const,
        operation.kind,
      ) && isString(operation.rule)
    );
  });
  if (!stepsValid) return false;

  if (
    !result ||
    !isResultKind(result.kind) ||
    !isString(result.text) ||
    !isNullableString(result.latex) ||
    !Array.isArray(result.solutions)
  ) {
    return false;
  }
  const solutionsValid = (result.solutions as unknown[]).every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const solution = entry as Record<string, unknown>;
    return (
      isString(solution.variable) &&
      isString(solution.text) &&
      isNullableString(solution.latex)
    );
  });
  if (!solutionsValid) return false;

  if (result.verification !== null) {
    if (!result.verification || typeof result.verification !== "object") return false;
    const verification = result.verification as Record<string, unknown>;
    if (
      !includesLiteral(["pass", "fail", "not_run"] as const, verification.status) ||
      !isString(verification.text)
    ) {
      return false;
    }
  }

  if (
    !quality ||
    !isFiniteNumber(quality.confidence) ||
    !includesLiteral(["nerdamer", "mathlive", "sympy", "hybrid"] as const, quality.engine)
  ) {
    return false;
  }
  if (quality.fallbackReason !== null && !isFallbackReason(quality.fallbackReason)) {
    return false;
  }

  return true;
};
