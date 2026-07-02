export const PROCEDURAL_MORAL_CLASSIFICATION_ARTIFACT_ID = "procedural_moral_classification" as const;
export const PROCEDURAL_MORAL_CLASSIFICATION_SCHEMA_VERSION = "procedural_moral_classification/v1" as const;

export const PROCEDURAL_MORAL_OBSERVED_PATTERNS = [
  "identity_view",
  "rumination_loop",
  "information_overload",
  "private_language_bond",
  "aspiration_drift",
  "creative_expression",
  "healing_before_action",
  "comparison_pressure",
  "feedback_loop",
  "practice_commitment",
  "unconsidered_harm",
  "guilt_signal",
  "ignorance_boundary",
  "willful_avoidance_risk",
  "repair_readiness",
  "unclear_evidence",
] as const;

export const PROCEDURAL_MORAL_MOVES = [
  "separate_observation_from_story",
  "name_the_attachment",
  "convert_reflection_to_experiment",
  "reduce_input_noise",
  "preserve_uncertainty",
  "ask_for_concrete_evidence",
  "choose_small_practice",
  "reframe_without_finality",
  "check_for_feedback_loop",
  "route_to_repair_or_review",
  "research_missing_considerations",
  "identify_affected_parties",
  "separate_guilt_from_repair",
  "ask_what_was_reasonably_knowable",
  "update_responsibility_tier",
] as const;

export type ProceduralMoralObservedPatternV1 = (typeof PROCEDURAL_MORAL_OBSERVED_PATTERNS)[number];
export type ProceduralMoralMoveV1 = (typeof PROCEDURAL_MORAL_MOVES)[number];

export type ProceduralMoralClassificationAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  character_verdict: false;
  moral_finality: false;
};

export type ProceduralMoralClassificationEntryV1 = {
  id: string;
  observedPattern: ProceduralMoralObservedPatternV1;
  moralRootId: string;
  moralRootLabel: string;
  proceduralMove: ProceduralMoralMoveV1;
  explanation: string;
  confidence: number;
  evidenceRefs: string[];
  missingEvidence: string[];
  warnings: string[];
};

export type ProceduralMoralRecommendedNextMoveV1 = {
  id: string;
  label: string;
  description: string;
  reasonCodes: string[];
};

export type ProceduralMoralClassificationV1 = {
  artifactId: typeof PROCEDURAL_MORAL_CLASSIFICATION_ARTIFACT_ID;
  schemaVersion: typeof PROCEDURAL_MORAL_CLASSIFICATION_SCHEMA_VERSION;
  classificationId: string;
  generatedAt: string;
  sourceReflectionId: string;
  input: {
    kind: string;
    summary: string;
    refs?: string[];
  };
  classifications: ProceduralMoralClassificationEntryV1[];
  recommendedNextMoves: ProceduralMoralRecommendedNextMoveV1[];
  authority: ProceduralMoralClassificationAuthorityV1;
};

export type BuildProceduralMoralClassificationInput = Omit<
  ProceduralMoralClassificationV1,
  "artifactId" | "schemaVersion" | "classificationId" | "generatedAt" | "authority"
> & {
  classificationId?: string;
  generatedAt?: string;
};

const AUTHORITY: ProceduralMoralClassificationAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  character_verdict: false,
  moral_finality: false,
};

const FORBIDDEN_PROCEDURAL_MORAL_PATTERNS = [
  /\bgood person\b/i,
  /\bbad person\b/i,
  /\bmorally approved\b/i,
  /\bmorally failed\b/i,
  /\bethically certain\b/i,
  /\bterminal moral authority\b/i,
  /\bexecution permission\b/i,
  /\bcharacter verdict\b/i,
] as const;

function newClassificationId(): string {
  return `procedural-moral:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function includes<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function validateStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isStringArray(value)) issues.push(`${prefix} must be a string array`);
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be a string array`);
}

function validateConfidence(prefix: string, value: unknown, issues: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(`${prefix} must be a finite number`);
    return;
  }
  if (value < 0 || value > 1) issues.push(`${prefix} must be between 0 and 1`);
}

function validateClassificationEntry(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "moralRootId", "moralRootLabel", "explanation"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(PROCEDURAL_MORAL_OBSERVED_PATTERNS, value.observedPattern)) {
    issues.push(`${prefix}.observedPattern is invalid`);
  }
  if (!includes(PROCEDURAL_MORAL_MOVES, value.proceduralMove)) {
    issues.push(`${prefix}.proceduralMove is invalid`);
  }
  validateConfidence(`${prefix}.confidence`, value.confidence, issues);
  validateStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateStringArray(`${prefix}.warnings`, value.warnings, issues);
}

function validateRecommendedNextMove(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "label", "description"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
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
  if (value.character_verdict !== false) issues.push("authority.character_verdict must be false");
  if (value.moral_finality !== false) issues.push("authority.moral_finality must be false");
}

export function buildProceduralMoralClassificationV1(
  input: BuildProceduralMoralClassificationInput,
): ProceduralMoralClassificationV1 {
  return {
    artifactId: PROCEDURAL_MORAL_CLASSIFICATION_ARTIFACT_ID,
    schemaVersion: PROCEDURAL_MORAL_CLASSIFICATION_SCHEMA_VERSION,
    classificationId: input.classificationId ?? newClassificationId(),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceReflectionId: input.sourceReflectionId,
    input: input.input,
    classifications: input.classifications,
    recommendedNextMoves: input.recommendedNextMoves,
    authority: { ...AUTHORITY },
  };
}

export function validateProceduralMoralClassificationV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["procedural moral classification must be an object"];

  if (value.artifactId !== PROCEDURAL_MORAL_CLASSIFICATION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${PROCEDURAL_MORAL_CLASSIFICATION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== PROCEDURAL_MORAL_CLASSIFICATION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${PROCEDURAL_MORAL_CLASSIFICATION_SCHEMA_VERSION}`);
  }
  for (const field of ["classificationId", "generatedAt", "sourceReflectionId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!isRecord(value.input)) {
    issues.push("input must be an object");
  } else {
    if (!isNonEmptyString(value.input.kind)) issues.push("input.kind must be a non-empty string");
    if (!isNonEmptyString(value.input.summary)) issues.push("input.summary must be a non-empty string");
    validateOptionalStringArray("input.refs", value.input.refs, issues);
  }

  if (!Array.isArray(value.classifications)) {
    issues.push("classifications must be an array");
  } else {
    value.classifications.forEach((entry, index) =>
      validateClassificationEntry(`classifications[${index}]`, entry, issues),
    );
  }

  if (!Array.isArray(value.recommendedNextMoves)) {
    issues.push("recommendedNextMoves must be an array");
  } else {
    value.recommendedNextMoves.forEach((entry, index) =>
      validateRecommendedNextMove(`recommendedNextMoves[${index}]`, entry, issues),
    );
  }

  validateAuthority(value.authority, issues);

  const text = JSON.stringify({
    classifications: value.classifications,
    recommendedNextMoves: value.recommendedNextMoves,
    authority: value.authority,
  });
  for (const pattern of FORBIDDEN_PROCEDURAL_MORAL_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden procedural Moral overclaim text matched: ${pattern.source}`);
  }

  return issues;
}

export function isProceduralMoralClassificationV1(value: unknown): value is ProceduralMoralClassificationV1 {
  return validateProceduralMoralClassificationV1(value).length === 0;
}
