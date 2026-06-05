export const THEORY_IDEOLOGY_BRIDGE_ARTIFACT_ID = "theory_ideology_bridge" as const;
export const THEORY_IDEOLOGY_BRIDGE_SCHEMA_VERSION = "theory_ideology_bridge/v1" as const;

export const THEORY_IDEOLOGY_BRIDGE_RELATIONS = [
  "supports",
  "constrains",
  "requires_evidence",
  "analogy_only",
  "overclaim_warning",
] as const;

export type TheoryIdeologyBridgeRelationV1 =
  (typeof THEORY_IDEOLOGY_BRIDGE_RELATIONS)[number];

export type TheoryIdeologyBridgeAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
  moral_finality: false;
  execution_permission: false;
  physics_proves_morality: false;
};

export type TheoryIdeologyBridgeLinkV1 = {
  id: string;
  theoryBadgeIds: string[];
  theoryLabels?: string[];
  ideologyNodeIds: string[];
  ideologyLabels?: string[];
  relation: TheoryIdeologyBridgeRelationV1;
  explanation: string;
  proceduralEffect: string;
  confidence: number;
  evidenceRefs: string[];
  missingEvidence?: string[];
  refusesAuthority: string[];
  reasonCodes: string[];
};

export type TheoryIdeologyBridgeRecommendedActionV1 = {
  id: string;
  type: string;
  label: string;
  description?: string;
  reasonCodes?: string[];
};

export type TheoryIdeologyBridgeV1 = {
  artifactId: typeof THEORY_IDEOLOGY_BRIDGE_ARTIFACT_ID;
  schemaVersion: typeof THEORY_IDEOLOGY_BRIDGE_SCHEMA_VERSION;
  generatedAt: string;
  bridgeId: string;
  sourceTheoryReflectionId?: string;
  sourceIdeologyReflectionId: string;
  inputs: {
    prompt: string;
    objective?: string;
    refs?: string[];
  };
  links: TheoryIdeologyBridgeLinkV1[];
  missingEvidence: string[];
  recommendedActions: TheoryIdeologyBridgeRecommendedActionV1[];
  authority: TheoryIdeologyBridgeAuthorityV1;
};

export type BuildTheoryIdeologyBridgeInput = Omit<
  TheoryIdeologyBridgeV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "bridgeId" | "authority"
> & {
  generatedAt?: string;
  bridgeId?: string;
};

const AUTHORITY: TheoryIdeologyBridgeAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
  moral_finality: false,
  execution_permission: false,
  physics_proves_morality: false,
};

const FORBIDDEN_THEORY_IDEOLOGY_BRIDGE_PATTERNS = [
  /\bphysics proves morality\b/i,
  /\bobjective moral proof\b/i,
  /\bmorally certain\b/i,
  /\bgood person\b/i,
  /\bbad person\b/i,
  /\bexecution permission\b/i,
  /\bterminal moral authority\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  isStringArray(value) && value.length > 0 && value.every((item) => item.trim().length > 0);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newBridgeId(): string {
  return `theory-ideology-bridge:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateRequiredStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateRequiredNonEmptyStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (!isNonEmptyStringArray(value)) issues.push(`${prefix} must contain at least one non-empty string`);
}

function validateScore(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateRecommendedAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "type", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (value.description !== undefined && !isNonEmptyString(value.description)) {
    issues.push(`${prefix}.description must be a non-empty string when present`);
  }
  validateOptionalStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
}

function validateLink(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.id)) issues.push(`${prefix}.id must be a non-empty string`);
  validateRequiredNonEmptyStringArray(`${prefix}.theoryBadgeIds`, value.theoryBadgeIds, issues);
  validateOptionalStringArray(`${prefix}.theoryLabels`, value.theoryLabels, issues);
  validateRequiredNonEmptyStringArray(`${prefix}.ideologyNodeIds`, value.ideologyNodeIds, issues);
  validateOptionalStringArray(`${prefix}.ideologyLabels`, value.ideologyLabels, issues);
  if (!includes(THEORY_IDEOLOGY_BRIDGE_RELATIONS, value.relation)) {
    issues.push(`${prefix}.relation is invalid`);
  }
  if (!isNonEmptyString(value.explanation)) issues.push(`${prefix}.explanation must be a non-empty string`);
  if (!isNonEmptyString(value.proceduralEffect)) {
    issues.push(`${prefix}.proceduralEffect must be a non-empty string`);
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  validateRequiredStringArray(`${prefix}.evidenceRefs`, value.evidenceRefs, issues);
  validateOptionalStringArray(`${prefix}.missingEvidence`, value.missingEvidence, issues);
  validateRequiredStringArray(`${prefix}.refusesAuthority`, value.refusesAuthority, issues);
  if (
    value.relation === "analogy_only" &&
    (!isStringArray(value.refusesAuthority) ||
      !value.refusesAuthority.includes("physics_derived_moral_certainty"))
  ) {
    issues.push(`${prefix}.analogy_only links must refuse physics_derived_moral_certainty`);
  }
  validateRequiredStringArray(`${prefix}.reasonCodes`, value.reasonCodes, issues);
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
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authority.ask_context_policy must be evidence_only");
  }
  if (value.agent_executable !== false) issues.push("authority.agent_executable must be false");
  if (value.moral_finality !== false) issues.push("authority.moral_finality must be false");
  if (value.execution_permission !== false) issues.push("authority.execution_permission must be false");
  if (value.physics_proves_morality !== false) {
    issues.push("authority.physics_proves_morality must be false");
  }
}

export function buildTheoryIdeologyBridgeV1(
  input: BuildTheoryIdeologyBridgeInput,
): TheoryIdeologyBridgeV1 {
  return {
    artifactId: THEORY_IDEOLOGY_BRIDGE_ARTIFACT_ID,
    schemaVersion: THEORY_IDEOLOGY_BRIDGE_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    bridgeId: input.bridgeId ?? newBridgeId(),
    ...(input.sourceTheoryReflectionId ? { sourceTheoryReflectionId: input.sourceTheoryReflectionId } : {}),
    sourceIdeologyReflectionId: input.sourceIdeologyReflectionId,
    inputs: input.inputs,
    links: input.links,
    missingEvidence: input.missingEvidence,
    recommendedActions: input.recommendedActions,
    authority: { ...AUTHORITY },
  };
}

export function validateTheoryIdeologyBridgeV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["theory ideology bridge must be an object"];

  if (value.artifactId !== THEORY_IDEOLOGY_BRIDGE_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_IDEOLOGY_BRIDGE_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_IDEOLOGY_BRIDGE_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_IDEOLOGY_BRIDGE_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "bridgeId", "sourceIdeologyReflectionId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (value.sourceTheoryReflectionId !== undefined && !isNonEmptyString(value.sourceTheoryReflectionId)) {
    issues.push("sourceTheoryReflectionId must be a non-empty string when present");
  }

  if (!isRecord(value.inputs)) {
    issues.push("inputs must be an object");
  } else {
    if (!isNonEmptyString(value.inputs.prompt)) issues.push("inputs.prompt must be a non-empty string");
    if (value.inputs.objective !== undefined && !isNonEmptyString(value.inputs.objective)) {
      issues.push("inputs.objective must be a non-empty string when present");
    }
    validateOptionalStringArray("inputs.refs", value.inputs.refs, issues);
  }

  if (!Array.isArray(value.links)) {
    issues.push("links must be an array");
  } else {
    value.links.forEach((link, index) => validateLink(`links[${index}]`, link, issues));
  }

  validateRequiredStringArray("missingEvidence", value.missingEvidence, issues);

  if (!Array.isArray(value.recommendedActions)) {
    issues.push("recommendedActions must be an array");
  } else {
    value.recommendedActions.forEach((action, index) =>
      validateRecommendedAction(`recommendedActions[${index}]`, action, issues),
    );
  }

  validateAuthority(value.authority, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_THEORY_IDEOLOGY_BRIDGE_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden theory-ideology overclaim text matched: ${pattern.source}`);
  }

  return issues;
}

export function isTheoryIdeologyBridgeV1(value: unknown): value is TheoryIdeologyBridgeV1 {
  return validateTheoryIdeologyBridgeV1(value).length === 0;
}
