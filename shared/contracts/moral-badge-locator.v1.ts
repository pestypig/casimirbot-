import {
  IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE,
  IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS,
  type IdeologyContextReflectionAuthorityV1,
  type IdeologyContextReflectionInputKindV1,
} from "../ideology-context-reflection";
import {
  validateProbabilityTerrainV1,
  type ProbabilityTerrainV1,
} from "./probability-terrain.v1";

export const MORAL_BADGE_LOCATOR_ARTIFACT_ID = "moral_badge_locator" as const;
export const MORAL_BADGE_LOCATOR_SCHEMA_VERSION = "moral_badge_locator/v1" as const;

export const MORAL_BADGE_LOCATOR_MATCH_TYPES = [
  "node_id",
  "label",
  "alias",
  "tag",
  "reference",
  "action_label",
  "gate_term",
  "keyword_overlap",
  "outer_edge_inference",
] as const;

export const MORAL_BADGE_LOCATOR_BINDING_TYPES = ["objective_binding", "preset_path"] as const;

export const MORAL_BADGE_LOCATOR_FRUITION_POSTURES = [
  "supported_action_posture",
  "constrained_action_posture",
  "requires_check",
  "blocked_or_missing_check",
] as const;

export type MoralBadgeLocatorMatchTypeV1 = (typeof MORAL_BADGE_LOCATOR_MATCH_TYPES)[number];
export type MoralBadgeLocatedBindingTypeV1 = (typeof MORAL_BADGE_LOCATOR_BINDING_TYPES)[number];
export type MoralBadgeComparisonPostureV1 = (typeof MORAL_BADGE_LOCATOR_FRUITION_POSTURES)[number];

export type MoralBadgeLocationV1 = {
  nodeId: string;
  label: string;
  confidence: number;
  matchType: MoralBadgeLocatorMatchTypeV1;
  pathToBinding: string[];
  proceduralExpression: string;
  reasonCodes: string[];
  tags?: string[];
};

export type MoralBadgeLocatedBindingV1 = {
  id: string;
  label: string;
  bindingType: MoralBadgeLocatedBindingTypeV1;
  pathNodeIds: string[];
  reasonCodes: string[];
  confidence: number;
};

export type MoralBadgeComparisonSeedV1 = {
  selectedNodeIds: string[];
  proceduralExpression: string;
  expectedFruitionPosture: MoralBadgeComparisonPostureV1;
  reasonCodes: string[];
};

export type MoralBadgeLocatorV1 = {
  artifactId: typeof MORAL_BADGE_LOCATOR_ARTIFACT_ID;
  schemaVersion: typeof MORAL_BADGE_LOCATOR_SCHEMA_VERSION;
  generatedAt: string;
  locatorId: string;
  input: {
    kind: IdeologyContextReflectionInputKindV1;
    summary: string;
    refs?: string[];
  };
  graph: {
    graphId: string;
    rootId: string;
    source: typeof IDEOLOGY_CONTEXT_REFLECTION_GRAPH_SOURCE;
  };
  locatedBadges: {
    exact: MoralBadgeLocationV1[];
    likely: MoralBadgeLocationV1[];
    inferred: MoralBadgeLocationV1[];
  };
  probabilityTerrain?: ProbabilityTerrainV1;
  locatedBindings: MoralBadgeLocatedBindingV1[];
  comparisonSeed: MoralBadgeComparisonSeedV1;
  authority: IdeologyContextReflectionAuthorityV1;
};

type BuildMoralBadgeLocatorInput = Omit<
  MoralBadgeLocatorV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "locatorId" | "authority"
> & {
  generatedAt?: string;
  locatorId?: string;
};

const AUTHORITY: IdeologyContextReflectionAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
};

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

function newLocatorId(): string {
  return `moral-badge-locator:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function validateScore(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateOptionalStringArray(prefix: string, value: unknown, issues: string[]): void {
  if (value !== undefined && !isStringArray(value)) issues.push(`${prefix} must be an array of strings`);
}

function validateLocation(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["nodeId", "label", "proceduralExpression"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  validateScore(`${prefix}.confidence`, value.confidence, issues);
  if (!includes(MORAL_BADGE_LOCATOR_MATCH_TYPES, value.matchType)) issues.push(`${prefix}.matchType is invalid`);
  if (!isStringArray(value.pathToBinding) || value.pathToBinding.length === 0) {
    issues.push(`${prefix}.pathToBinding must contain at least one node id`);
  }
  if (!isStringArray(value.reasonCodes)) issues.push(`${prefix}.reasonCodes must be a string array`);
  validateOptionalStringArray(`${prefix}.tags`, value.tags, issues);
}

function validateLocationArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry, index) => validateLocation(`${prefix}[${index}]`, entry, issues));
}

function validateBinding(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["id", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!includes(MORAL_BADGE_LOCATOR_BINDING_TYPES, value.bindingType)) {
    issues.push(`${prefix}.bindingType is invalid`);
  }
  if (!isStringArray(value.pathNodeIds) || value.pathNodeIds.length === 0) {
    issues.push(`${prefix}.pathNodeIds must contain at least one node id`);
  }
  if (!isStringArray(value.reasonCodes)) issues.push(`${prefix}.reasonCodes must be a string array`);
  validateScore(`${prefix}.confidence`, value.confidence, issues);
}

function validateComparisonSeed(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("comparisonSeed must be an object");
    return;
  }
  if (!isStringArray(value.selectedNodeIds)) issues.push("comparisonSeed.selectedNodeIds must be a string array");
  if (!isNonEmptyString(value.proceduralExpression)) {
    issues.push("comparisonSeed.proceduralExpression must be a non-empty string");
  }
  if (!includes(MORAL_BADGE_LOCATOR_FRUITION_POSTURES, value.expectedFruitionPosture)) {
    issues.push("comparisonSeed.expectedFruitionPosture is invalid");
  }
  if (!isStringArray(value.reasonCodes)) issues.push("comparisonSeed.reasonCodes must be a string array");
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

export function buildMoralBadgeLocatorV1(input: BuildMoralBadgeLocatorInput): MoralBadgeLocatorV1 {
  return {
    artifactId: MORAL_BADGE_LOCATOR_ARTIFACT_ID,
    schemaVersion: MORAL_BADGE_LOCATOR_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    locatorId: input.locatorId ?? newLocatorId(),
    input: input.input,
    graph: input.graph,
    locatedBadges: input.locatedBadges,
    ...(input.probabilityTerrain ? { probabilityTerrain: input.probabilityTerrain } : {}),
    locatedBindings: input.locatedBindings,
    comparisonSeed: input.comparisonSeed,
    authority: { ...AUTHORITY },
  };
}

export function validateMoralBadgeLocatorV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["moral badge locator must be an object"];

  if (value.artifactId !== MORAL_BADGE_LOCATOR_ARTIFACT_ID) {
    issues.push(`artifactId must be ${MORAL_BADGE_LOCATOR_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== MORAL_BADGE_LOCATOR_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${MORAL_BADGE_LOCATOR_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "locatorId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!isRecord(value.input)) {
    issues.push("input must be an object");
  } else {
    if (!includes(IDEOLOGY_CONTEXT_REFLECTION_INPUT_KINDS, value.input.kind)) issues.push("input.kind is invalid");
    if (!isNonEmptyString(value.input.summary)) issues.push("input.summary must be a non-empty string");
    validateOptionalStringArray("input.refs", value.input.refs, issues);
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

  if (!isRecord(value.locatedBadges)) {
    issues.push("locatedBadges must be an object");
  } else {
    validateLocationArray("locatedBadges.exact", value.locatedBadges.exact, issues);
    validateLocationArray("locatedBadges.likely", value.locatedBadges.likely, issues);
    validateLocationArray("locatedBadges.inferred", value.locatedBadges.inferred, issues);
  }
  if (value.probabilityTerrain !== undefined) {
    issues.push(
      ...validateProbabilityTerrainV1(value.probabilityTerrain).map((issue) => `probabilityTerrain.${issue}`),
    );
    if (isRecord(value.probabilityTerrain) && value.probabilityTerrain.graphKind !== "moral_badge_graph") {
      issues.push("probabilityTerrain.graphKind must be moral_badge_graph");
    }
  }

  if (!Array.isArray(value.locatedBindings)) {
    issues.push("locatedBindings must be an array");
  } else {
    value.locatedBindings.forEach((binding, index) => validateBinding(`locatedBindings[${index}]`, binding, issues));
  }

  validateComparisonSeed(value.comparisonSeed, issues);
  validateAuthority(value.authority, issues);

  return issues;
}

export function isMoralBadgeLocatorV1(value: unknown): value is MoralBadgeLocatorV1 {
  return validateMoralBadgeLocatorV1(value).length === 0;
}
