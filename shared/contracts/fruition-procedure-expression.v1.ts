import type { HelixRecommendedActionAdmissionV1 } from "./helix-recommended-action-admission.v1";

export const FRUITION_PROCEDURE_EXPRESSION_ARTIFACT_ID = "fruition_procedure_expression" as const;
export const FRUITION_PROCEDURE_EXPRESSION_SCHEMA_VERSION = "fruition_procedure_expression/v1" as const;

export const FRUITION_TERM_KINDS = [
  "lens",
  "trait",
  "safeguard",
  "missing_check",
  "tension",
  "action_gate",
  "authority_boundary",
] as const;

export const FRUITION_TERM_POLARITIES = ["supports", "constrains", "blocks", "requires"] as const;

export const FRUITION_OPERATOR_KINDS = [
  "requires",
  "constrains",
  "blocks",
  "supports",
  "asks_for",
  "routes_to",
] as const;

export const FRUITION_RESULT_POSTURES = [
  "diagnostic_only",
  "ask_for_clarification",
  "requires_review",
  "blocked",
  "ready_for_user_decision",
] as const;

export const FRUITION_PROCEDURAL_ROLES = [
  "first_principle",
  "lens",
  "constraint",
  "evidence_requirement",
  "action_gate",
  "balancer",
  "repair_path",
  "objective_view",
  "recommended_action",
  "authority_boundary",
] as const;

export const FRUITION_PROCEDURAL_OPERATORS = [
  "supports",
  "constrains",
  "requires",
  "blocks",
  "balances",
  "routes_to",
  "repairs",
  "asks_for",
] as const;

export type FruitionTermKindV1 = (typeof FRUITION_TERM_KINDS)[number];
export type FruitionTermPolarityV1 = (typeof FRUITION_TERM_POLARITIES)[number];
export type FruitionOperatorKindV1 = (typeof FRUITION_OPERATOR_KINDS)[number];
export type FruitionResultPostureV1 = (typeof FRUITION_RESULT_POSTURES)[number];
export type FruitionProceduralRoleV1 = (typeof FRUITION_PROCEDURAL_ROLES)[number];
export type FruitionProceduralOperatorV1 = (typeof FRUITION_PROCEDURAL_OPERATORS)[number];

export type FruitionProcedureTermV1 = {
  id: string;
  kind: FruitionTermKindV1;
  label: string;
  polarity: FruitionTermPolarityV1;
  confidence: number;
  proceduralRole?: FruitionProceduralRoleV1;
  procedureOperator?: FruitionProceduralOperatorV1;
  actionEffect?: string;
  evidenceNeeds?: string[];
  refusesAuthority?: string[];
  sourceNodeIds?: string[];
  evidenceRefs?: string[];
  reasonCodes?: string[];
};

export type FruitionProcedureOperatorV1 = {
  id: string;
  kind: FruitionOperatorKindV1;
  fromTermIds: string[];
  toTermIds: string[];
  label: string;
  rationale: string;
};

export type FruitionProcedureResultV1 = {
  posture: FruitionResultPostureV1;
  label: string;
  recommendedActionIds: string[];
  missingEvidence: string[];
  admission: HelixRecommendedActionAdmissionV1;
  agentExecutable: false;
};

export type FruitionProcedureExpressionAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
};

export type FruitionProcedureExpressionV1 = {
  artifactId: typeof FRUITION_PROCEDURE_EXPRESSION_ARTIFACT_ID;
  schemaVersion: typeof FRUITION_PROCEDURE_EXPRESSION_SCHEMA_VERSION;
  generatedAt: string;
  expressionId: string;
  sourceReflectionId: string;
  calculator: {
    name: "fruition";
    mode: "deterministic_procedure";
    modelCalls: 0;
  };
  inputs: {
    objective?: string;
    inputKind: string;
    summary: string;
    refs?: string[];
  };
  terms: FruitionProcedureTermV1[];
  operators: FruitionProcedureOperatorV1[];
  expression: string;
  result: FruitionProcedureResultV1;
  authority: FruitionProcedureExpressionAuthorityV1;
};

type BuildFruitionProcedureExpressionInput = Omit<
  FruitionProcedureExpressionV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "expressionId" | "calculator" | "authority"
> & {
  generatedAt?: string;
  expressionId?: string;
};

const AUTHORITY: FruitionProcedureExpressionAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
};

const FORBIDDEN_FRUITION_PATTERNS = [
  /\bgood person\b/i,
  /\bbad person\b/i,
  /\bmorally approved\b/i,
  /\bmorally failed\b/i,
  /\bethically certain\b/i,
  /\bapproved action\b/i,
  /\bexecution permission\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newExpressionId(): string {
  return `fruition:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateConfidence(prefix: string, value: unknown, issues: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateTerm(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(FRUITION_TERM_KINDS, value.kind)) issues.push(`${prefix}.kind is invalid`);
  if (!includes(FRUITION_TERM_POLARITIES, value.polarity)) issues.push(`${prefix}.polarity is invalid`);
  validateConfidence(`${prefix}.confidence`, value.confidence, issues);
  if (value.proceduralRole !== undefined && !includes(FRUITION_PROCEDURAL_ROLES, value.proceduralRole)) {
    issues.push(`${prefix}.proceduralRole is invalid`);
  }
  if (value.procedureOperator !== undefined && !includes(FRUITION_PROCEDURAL_OPERATORS, value.procedureOperator)) {
    issues.push(`${prefix}.procedureOperator is invalid`);
  }
  if (value.actionEffect !== undefined && !isNonEmptyString(value.actionEffect)) {
    issues.push(`${prefix}.actionEffect must be a non-empty string when present`);
  }
  validateOptionalStringArray(`${prefix}.evidenceNeeds`, value.evidenceNeeds, issues);
  validateOptionalStringArray(`${prefix}.refusesAuthority`, value.refusesAuthority, issues);
  validateOptionalStringArray(`${prefix}.sourceNodeIds`, value.sourceNodeIds, issues);
  validateOptionalStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateOptionalStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
}

function validateOperator(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "label", "rationale"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(FRUITION_OPERATOR_KINDS, value.kind)) issues.push(`${prefix}.kind is invalid`);
  if (!isStringArray(value.fromTermIds) || value.fromTermIds.length === 0) {
    issues.push(`${prefix}.fromTermIds must contain at least one term id`);
  }
  if (!isStringArray(value.toTermIds) || value.toTermIds.length === 0) {
    issues.push(`${prefix}.toTermIds must contain at least one term id`);
  }
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  if (value.assistant_answer !== false) issues.push("authority.assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("authority.raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("authority.terminal_eligible must be false");
  if (value.context_role !== "tool_policy") issues.push("authority.context_role must be tool_policy");
  if (value.ask_context_policy !== "evidence_only") issues.push("authority.ask_context_policy must be evidence_only");
  if (value.agent_executable !== false) issues.push("authority.agent_executable must be false");
}

function validateResult(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("result must be an object");
    return;
  }
  if (!includes(FRUITION_RESULT_POSTURES, value.posture)) issues.push("result.posture is invalid");
  if (!isNonEmptyString(value.label)) issues.push("result.label must be a non-empty string");
  if (!isStringArray(value.recommendedActionIds)) {
    issues.push("result.recommendedActionIds must be an array of strings");
  }
  if (!isStringArray(value.missingEvidence)) issues.push("result.missingEvidence must be an array of strings");
  if (value.agentExecutable !== false) issues.push("result.agentExecutable must be false");
  if (!isRecord(value.admission) || value.admission.artifactId !== "helix_recommended_action_admission") {
    issues.push("result.admission must be a helix recommended action admission artifact");
  }
}

export function buildFruitionProcedureExpressionV1(
  input: BuildFruitionProcedureExpressionInput,
): FruitionProcedureExpressionV1 {
  return {
    artifactId: FRUITION_PROCEDURE_EXPRESSION_ARTIFACT_ID,
    schemaVersion: FRUITION_PROCEDURE_EXPRESSION_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    expressionId: input.expressionId ?? newExpressionId(),
    sourceReflectionId: input.sourceReflectionId,
    calculator: {
      name: "fruition",
      mode: "deterministic_procedure",
      modelCalls: 0,
    },
    inputs: input.inputs,
    terms: input.terms,
    operators: input.operators,
    expression: input.expression,
    result: input.result,
    authority: { ...AUTHORITY },
  };
}

export function validateFruitionProcedureExpressionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["fruition procedure expression must be an object"];

  if (value.artifactId !== FRUITION_PROCEDURE_EXPRESSION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${FRUITION_PROCEDURE_EXPRESSION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== FRUITION_PROCEDURE_EXPRESSION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${FRUITION_PROCEDURE_EXPRESSION_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "expressionId", "sourceReflectionId", "expression"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!isRecord(value.calculator)) {
    issues.push("calculator must be an object");
  } else {
    if (value.calculator.name !== "fruition") issues.push("calculator.name must be fruition");
    if (value.calculator.mode !== "deterministic_procedure") {
      issues.push("calculator.mode must be deterministic_procedure");
    }
    if (value.calculator.modelCalls !== 0) issues.push("calculator.modelCalls must be 0");
  }

  if (!isRecord(value.inputs)) {
    issues.push("inputs must be an object");
  } else {
    if (value.inputs.objective !== undefined && !isNonEmptyString(value.inputs.objective)) {
      issues.push("inputs.objective must be a non-empty string when present");
    }
    if (!isNonEmptyString(value.inputs.inputKind)) issues.push("inputs.inputKind must be a non-empty string");
    if (!isNonEmptyString(value.inputs.summary)) issues.push("inputs.summary must be a non-empty string");
    validateOptionalStringArray("inputs.refs", value.inputs.refs, issues);
  }

  if (!Array.isArray(value.terms)) {
    issues.push("terms must be an array");
  } else {
    value.terms.forEach((term, index) => validateTerm(`terms[${index}]`, term, issues));
  }

  if (!Array.isArray(value.operators)) {
    issues.push("operators must be an array");
  } else {
    value.operators.forEach((operator, index) => validateOperator(`operators[${index}]`, operator, issues));
  }

  validateResult(value.result, issues);
  validateAuthority(value.authority, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_FRUITION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden fruition finality text matched: ${pattern.source}`);
  }

  return issues;
}

export function isFruitionProcedureExpressionV1(value: unknown): value is FruitionProcedureExpressionV1 {
  return validateFruitionProcedureExpressionV1(value).length === 0;
}
