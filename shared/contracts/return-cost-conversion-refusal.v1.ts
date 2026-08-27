export const RETURN_COST_CONVERSION_REFUSAL_ARTIFACT_ID = "return_cost_conversion_refusal_reflection" as const;
export const RETURN_COST_CONVERSION_REFUSAL_SCHEMA_VERSION = "return_cost_conversion_refusal_reflection/v1" as const;

export const RETURN_COST_CONVERSION_REFUSAL_POSITION_IDS = ["return", "cost", "conversion", "refusal"] as const;
export const RETURN_COST_CONVERSION_REFUSAL_CHECK_IDS = [
  "protected_good_served",
  "protected_party_retains_agency",
  "costs_visible_and_reciprocally_accounted",
  "symbolic_devotion_not_consent",
  "survivable_refusal_and_exit",
] as const;

export type ReturnCostConversionRefusalPositionIdV1 =
  (typeof RETURN_COST_CONVERSION_REFUSAL_POSITION_IDS)[number];
export type ReturnCostConversionRefusalCheckIdV1 =
  (typeof RETURN_COST_CONVERSION_REFUSAL_CHECK_IDS)[number];

export type ReturnCostConversionRefusalAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  diagnostic_only: true;
  no_moral_verdict: true;
  no_character_identity_claim: true;
};

export type ReturnCostConversionRefusalPositionV1 = {
  id: ReturnCostConversionRefusalPositionIdV1;
  question: string;
  primaryBadgeId: string;
  supportingBadgeIds: string[];
  activated: boolean;
  evidenceNodeIds: string[];
  missingEvidence: string[];
};

export type ReturnCostConversionRefusalCheckV1 = {
  id: ReturnCostConversionRefusalCheckIdV1;
  question: string;
  status: "in_scope" | "unresolved";
  relevantBadgeIds: string[];
};

export type ReturnCostConversionRefusalReflectionV1 = {
  artifactId: typeof RETURN_COST_CONVERSION_REFUSAL_ARTIFACT_ID;
  schemaVersion: typeof RETURN_COST_CONVERSION_REFUSAL_SCHEMA_VERSION;
  generatedAt: string;
  reflectionId: string;
  positions: ReturnCostConversionRefusalPositionV1[];
  checks: ReturnCostConversionRefusalCheckV1[];
  selectedBadgeIds: string[];
  authority: ReturnCostConversionRefusalAuthorityV1;
};

const AUTHORITY: ReturnCostConversionRefusalAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  diagnostic_only: true,
  no_moral_verdict: true,
  no_character_identity_claim: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

export function buildReturnCostConversionRefusalReflectionV1(
  input: Omit<ReturnCostConversionRefusalReflectionV1, "artifactId" | "schemaVersion" | "authority">,
): ReturnCostConversionRefusalReflectionV1 {
  return {
    artifactId: RETURN_COST_CONVERSION_REFUSAL_ARTIFACT_ID,
    schemaVersion: RETURN_COST_CONVERSION_REFUSAL_SCHEMA_VERSION,
    ...input,
    authority: { ...AUTHORITY },
  };
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  for (const field of ["assistant_answer", "raw_content_included", "terminal_eligible", "agent_executable"] as const) {
    if (value[field] !== false) issues.push(`authority.${field} must be false`);
  }
  for (const field of ["diagnostic_only", "no_moral_verdict", "no_character_identity_claim"] as const) {
    if (value[field] !== true) issues.push(`authority.${field} must be true`);
  }
  if (value.context_role !== "tool_policy") issues.push("authority.context_role must be tool_policy");
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authority.ask_context_policy must be evidence_only");
  }
}

export function validateReturnCostConversionRefusalReflectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["Return-Cost-Conversion-Refusal reflection must be an object"];
  if (value.artifactId !== RETURN_COST_CONVERSION_REFUSAL_ARTIFACT_ID) issues.push("artifactId is invalid");
  if (value.schemaVersion !== RETURN_COST_CONVERSION_REFUSAL_SCHEMA_VERSION) issues.push("schemaVersion is invalid");
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.reflectionId)) issues.push("reflectionId must be a non-empty string");
  if (!Array.isArray(value.positions) || value.positions.length !== RETURN_COST_CONVERSION_REFUSAL_POSITION_IDS.length) {
    issues.push("positions must contain return, cost, conversion, and refusal");
  } else {
    value.positions.forEach((position, index) => {
      if (!isRecord(position)) {
        issues.push(`positions[${index}] must be an object`);
        return;
      }
      if (!RETURN_COST_CONVERSION_REFUSAL_POSITION_IDS.includes(position.id as ReturnCostConversionRefusalPositionIdV1)) {
        issues.push(`positions[${index}].id is invalid`);
      }
      if (!isNonEmptyString(position.question)) issues.push(`positions[${index}].question must be non-empty`);
      if (!isNonEmptyString(position.primaryBadgeId)) issues.push(`positions[${index}].primaryBadgeId must be non-empty`);
      if (typeof position.activated !== "boolean") issues.push(`positions[${index}].activated must be boolean`);
      if (!isStringArray(position.supportingBadgeIds)) issues.push(`positions[${index}].supportingBadgeIds must be strings`);
      if (!isStringArray(position.evidenceNodeIds)) issues.push(`positions[${index}].evidenceNodeIds must be strings`);
      if (!isStringArray(position.missingEvidence)) issues.push(`positions[${index}].missingEvidence must be strings`);
    });
  }
  if (!Array.isArray(value.checks) || value.checks.length !== RETURN_COST_CONVERSION_REFUSAL_CHECK_IDS.length) {
    issues.push("checks must contain all five procedural checks");
  }
  if (!isStringArray(value.selectedBadgeIds)) issues.push("selectedBadgeIds must be strings");
  validateAuthority(value.authority, issues);
  return issues;
}
