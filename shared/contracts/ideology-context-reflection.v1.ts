export const IDEOLOGY_CONTEXT_REFLECTION_ARTIFACT_ID = "ideology_context_reflection" as const;
export const IDEOLOGY_CONTEXT_REFLECTION_SCHEMA_VERSION = "ideology_context_reflection/v1" as const;

export const IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE = "docs/ethos/ideology.json" as const;

export const IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS = [
  "user_prompt",
  "workstation_event",
  "document_selection",
  "note",
  "repo_evidence",
  "situation_room_event",
  "voice_event",
] as const;

export const IDEOLOGY_CONTEXT_REFLECTION_TENSION_SEVERITIES = [
  "low",
  "medium",
  "high",
] as const;

export type IdeologyContextReflectionInputKindV1 =
  (typeof IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS)[number];

export type IdeologyContextReflectionTensionSeverityV1 =
  (typeof IDEOLOGY_CONTEXT_REFLECTION_TENSION_SEVERITIES)[number];

export type IdeologyNodeMatchV1 = {
  nodeId: string;
  label: string;
  score: number;
  reasons: string[];
  tags?: string[];
  pathToRoot?: string[];
};

export type IdeologyActivatedTraitV1 = {
  nodeId: string;
  label: string;
  confidence: number;
  pathToRoot: string[];
  tags?: string[];
};

export type IdeologyContextReflectionTensionV1 = {
  nodeIds: string[];
  description: string;
  severity: IdeologyContextReflectionTensionSeverityV1;
};

export type IdeologyContextReflectionActionGateWarningV1 = {
  gateId: string;
  label: string;
  warning: string;
  requiredCheck?: string;
};

export type IdeologyContextReflectionClaimBoundariesV1 = {
  diagnostic_only: boolean;
  avoid_character_judgment: boolean;
  missing_evidence?: string[];
  needs_user_confirmation?: boolean;
};

export type IdeologyContextReflectionRecommendedActionV1 = {
  id: string;
  type: string;
  label: string;
  description?: string;
  reasonCodes?: string[];
};

export type IdeologyContextReflectionOverlayV1 = {
  title: string;
  summary: string;
  highlightedNodeIds: string[];
};

export type IdeologyContextReflectionAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  context_role: "tool_policy";
  ask_context_policy: "evidence_only";
  agent_executable: false;
};

export type IdeologyContextReflectionV1 = {
  artifactId: typeof IDEOLOGY_CONTEXT_REFLECTION_ARTIFACT_ID;
  schemaVersion: typeof IDEOLOGY_CONTEXT_REFLECTION_SCHEMA_VERSION;
  generatedAt: string;
  reflectionId: string;
  graph: {
    graphId: string;
    rootId: string;
    source: typeof IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE;
  };
  input: {
    kind: IdeologyContextReflectionInputKindV1;
    summary: string;
    refs?: string[];
  };
  matches: {
    exact: IdeologyNodeMatchV1[];
    likely: IdeologyNodeMatchV1[];
    inferred_lenses: IdeologyNodeMatchV1[];
  };
  activated_traits: IdeologyActivatedTraitV1[];
  tensions?: IdeologyContextReflectionTensionV1[];
  action_gate_warnings?: IdeologyContextReflectionActionGateWarningV1[];
  claim_boundaries: IdeologyContextReflectionClaimBoundariesV1;
  recommended_actions: IdeologyContextReflectionRecommendedActionV1[];
  overlay?: IdeologyContextReflectionOverlayV1;
  authority: IdeologyContextReflectionAuthorityV1;
};

type BuildIdeologyContextReflectionInput = Omit<
  IdeologyContextReflectionV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "reflectionId" | "authority"
> & {
  generatedAt?: string;
  reflectionId?: string;
};

const AUTHORITY: IdeologyContextReflectionAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
};

const FORBIDDEN_IDEOLOGY_CONTEXT_REFLECTION_PATTERNS = [
  /\bgood person\b/i,
  /\bbad person\b/i,
  /\bmorally approved\b/i,
  /\bmorally failed\b/i,
  /\bethically certain\b/i,
  /\bcharacter verdict\b/i,
  /\bterminal moral authority\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function newReflectionId(): string {
  return `ideology-context-reflection:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateScore(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateNodeMatch(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["nodeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateScore(`${prefix}.score`, value.score, issues);
  if (!isStringArray(value.reasons)) issues.push(`${prefix}.reasons must be an array of strings`);
  validateOptionalStringArray(`${prefix}.tags`, value.tags, issues);
  validateOptionalStringArray(`${prefix}.pathToRoot`, value.pathToRoot, issues);
}

function validateNodeMatchArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry, index) => validateNodeMatch(`${prefix}[${index}]`, entry, issues));
}

function validateActivatedTrait(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["nodeId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  if (!isStringArray(value.pathToRoot) || value.pathToRoot.length === 0) {
    issues.push(`${prefix}.pathToRoot must contain at least one node id`);
  }
  validateOptionalStringArray(`${prefix}.tags`, value.tags, issues);
}

function validateTension(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isStringArray(value.nodeIds) || value.nodeIds.length === 0) {
    issues.push(`${prefix}.nodeIds must contain at least one node id`);
  }
  if (!isNonEmptyString(value.description)) issues.push(`${prefix}.description must be a non-empty string`);
  if (!includes(IDEOLOGY_CONTEXT_REFLECTION_TENSION_SEVERITIES, value.severity)) {
    issues.push(`${prefix}.severity is invalid`);
  }
}

function validateActionGateWarning(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["gateId", "label", "warning"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (value.requiredCheck !== undefined && !isNonEmptyString(value.requiredCheck)) {
    issues.push(`${prefix}.requiredCheck must be a non-empty string when present`);
  }
}

function validateClaimBoundaries(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("claim_boundaries must be an object");
    return;
  }
  if (value.diagnostic_only !== true) issues.push("claim_boundaries.diagnostic_only must be true");
  if (value.avoid_character_judgment !== true) {
    issues.push("claim_boundaries.avoid_character_judgment must be true");
  }
  validateOptionalStringArray("claim_boundaries.missing_evidence", value.missing_evidence, issues);
  if (value.needs_user_confirmation !== undefined && typeof value.needs_user_confirmation !== "boolean") {
    issues.push("claim_boundaries.needs_user_confirmation must be boolean");
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

function validateOverlay(value: unknown, issues: string[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push("overlay must be an object");
    return;
  }
  for (const field of ["title", "summary"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`overlay.${field} must be a non-empty string`);
  }
  if (!isStringArray(value.highlightedNodeIds)) {
    issues.push("overlay.highlightedNodeIds must be an array of strings");
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
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("authority.ask_context_policy must be evidence_only");
  }
  if (value.agent_executable !== false) issues.push("authority.agent_executable must be false");
}

export function buildIdeologyContextReflectionV1(
  input: BuildIdeologyContextReflectionInput,
): IdeologyContextReflectionV1 {
  return {
    artifactId: IDEOLOGY_CONTEXT_REFLECTION_ARTIFACT_ID,
    schemaVersion: IDEOLOGY_CONTEXT_REFLECTION_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    reflectionId: input.reflectionId ?? newReflectionId(),
    graph: input.graph,
    input: input.input,
    matches: input.matches,
    activated_traits: input.activated_traits,
    ...(input.tensions ? { tensions: input.tensions } : {}),
    ...(input.action_gate_warnings ? { action_gate_warnings: input.action_gate_warnings } : {}),
    claim_boundaries: input.claim_boundaries,
    recommended_actions: input.recommended_actions,
    ...(input.overlay ? { overlay: input.overlay } : {}),
    authority: { ...AUTHORITY },
  };
}

export function validateIdeologyContextReflectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["ideology context reflection must be an object"];

  if (value.artifactId !== IDEOLOGY_CONTEXT_REFLECTION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${IDEOLOGY_CONTEXT_REFLECTION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== IDEOLOGY_CONTEXT_REFLECTION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${IDEOLOGY_CONTEXT_REFLECTION_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "reflectionId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!isRecord(value.graph)) {
    issues.push("graph must be an object");
  } else {
    for (const field of ["graphId", "rootId"] as const) {
      if (!isNonEmptyString(value.graph[field])) issues.push(`graph.${field} must be a non-empty string`);
    }
    if (value.graph.source !== IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE) {
      issues.push(`graph.source must be ${IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE}`);
    }
  }

  if (!isRecord(value.input)) {
    issues.push("input must be an object");
  } else {
    if (!includes(IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS, value.input.kind)) {
      issues.push("input.kind is invalid");
    }
    if (!isNonEmptyString(value.input.summary)) issues.push("input.summary must be a non-empty string");
    validateOptionalStringArray("input.refs", value.input.refs, issues);
  }

  if (!isRecord(value.matches)) {
    issues.push("matches must be an object");
  } else {
    validateNodeMatchArray("matches.exact", value.matches.exact, issues);
    validateNodeMatchArray("matches.likely", value.matches.likely, issues);
    validateNodeMatchArray("matches.inferred_lenses", value.matches.inferred_lenses, issues);
  }

  if (!Array.isArray(value.activated_traits)) {
    issues.push("activated_traits must be an array");
  } else {
    value.activated_traits.forEach((trait, index) =>
      validateActivatedTrait(`activated_traits[${index}]`, trait, issues),
    );
  }

  if (value.tensions !== undefined) {
    if (!Array.isArray(value.tensions)) {
      issues.push("tensions must be an array");
    } else {
      value.tensions.forEach((tension, index) => validateTension(`tensions[${index}]`, tension, issues));
    }
  }

  if (value.action_gate_warnings !== undefined) {
    if (!Array.isArray(value.action_gate_warnings)) {
      issues.push("action_gate_warnings must be an array");
    } else {
      value.action_gate_warnings.forEach((warning, index) =>
        validateActionGateWarning(`action_gate_warnings[${index}]`, warning, issues),
      );
    }
  }

  validateClaimBoundaries(value.claim_boundaries, issues);

  if (!Array.isArray(value.recommended_actions)) {
    issues.push("recommended_actions must be an array");
  } else {
    value.recommended_actions.forEach((action, index) =>
      validateRecommendedAction(`recommended_actions[${index}]`, action, issues),
    );
  }

  validateOverlay(value.overlay, issues);
  validateAuthority(value.authority, issues);

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_IDEOLOGY_CONTEXT_REFLECTION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden character-judgment text matched: ${pattern.source}`);
  }

  return issues;
}

export function isIdeologyContextReflectionV1(
  value: unknown,
): value is IdeologyContextReflectionV1 {
  return validateIdeologyContextReflectionV1(value).length === 0;
}
