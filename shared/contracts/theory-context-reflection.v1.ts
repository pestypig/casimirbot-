import type { TheoryBiomeBand } from "./theory-biome-layout.v1";

export const THEORY_CONTEXT_REFLECTION_ARTIFACT_ID = "theory_context_reflection" as const;
export const THEORY_CONTEXT_REFLECTION_SCHEMA_VERSION = "theory_context_reflection/v1" as const;

export const THEORY_CONTEXT_REFLECTION_SOURCES = [
  "helix_ask",
  "manual",
  "scientific_calculator",
  "workstation_action",
] as const;

export const THEORY_CONTEXT_REFLECTION_CONFIDENCE_MODES = [
  "soft_locator",
  "strict_badge_match",
] as const;

export const THEORY_CONTEXT_REFLECTION_RESOLUTION_ROLES = [
  "prompt_center",
  "first_principles_path",
  "observable_path",
  "claim_boundary",
  "consequence_context",
  "analogy_context",
  "ambient_context",
] as const;

export const THEORY_CONTEXT_REFLECTION_RESOLUTION_MODES = [
  "focused",
  "path",
  "wide_context",
] as const;

export const THEORY_CONTEXT_REFLECTION_EXPLANATION_DEPTH_HINTS = [
  "specific",
  "path",
  "cross_scale",
] as const;

const THEORY_CONTEXT_REFLECTION_BIOME_BANDS = [
  "planck_quantum",
  "nuclear",
  "atomic",
  "molecular",
  "cellular_biophysical",
  "device_laboratory",
  "human_engineering",
  "planetary",
  "stellar",
  "galactic_cosmic",
  "abstract_formal",
  "claim_boundary",
] as const satisfies readonly TheoryBiomeBand[];

export type TheoryContextReflectionSource =
  (typeof THEORY_CONTEXT_REFLECTION_SOURCES)[number];

export type TheoryContextReflectionConfidenceMode =
  (typeof THEORY_CONTEXT_REFLECTION_CONFIDENCE_MODES)[number];

export type TheoryContextReflectionResolutionRole =
  (typeof THEORY_CONTEXT_REFLECTION_RESOLUTION_ROLES)[number];

export type TheoryContextReflectionResolutionMode =
  (typeof THEORY_CONTEXT_REFLECTION_RESOLUTION_MODES)[number];

export type TheoryContextReflectionExplanationDepthHint =
  (typeof THEORY_CONTEXT_REFLECTION_EXPLANATION_DEPTH_HINTS)[number];

export type TheoryContextReflectionMatchV1 = {
  badgeId: string;
  title: string;
  score: number;
  reasons: string[];
  matchedSymbols: string[];
  matchedEquationFamilies: string[];
  matchedRepoPaths: string[];
  claimBoundaryNotes: string[];
};

export type TheoryContextReflectionDomainV1 = {
  atlasBlockId: string;
  title: string;
  score: number;
  reasons: string[];
};

export type TheoryContextReflectionUncertaintyModeV1 =
  | "broad"
  | "focused"
  | "ambiguous";

export type TheoryContextReflectionUncertaintyV1 = {
  badgeProbabilityById: Record<string, number>;
  renderChunkProbabilityById: Record<string, number>;
  semanticChunkProbabilityById: Record<string, number>;
  priorEntropyBits: number;
  posteriorEntropyBits: number;
  informationGainBits: number;
  normalizedMass: number;
  uncertaintyMode: TheoryContextReflectionUncertaintyModeV1;
};

export type TheoryContextReflectionOverlayV1 = {
  centerBadgeIds: string[];
  highlightedBadgeIds: string[];
  highlightedEdgeIds: string[];
  heatByBadgeId: Record<string, number>;
  exactBadgeIds: string[];
  likelyBadgeIds: string[];
  suggestedBiomeChunkIds?: string[];
  suggestedSemanticChunkIds?: string[];
  suggestedScaleBands?: TheoryBiomeBand[];
  uncertainty?: TheoryContextReflectionUncertaintyV1;
  softRegion: {
    id: string;
    label: string;
    badgeIds: string[];
    confidence: number;
    tone: "green";
    meaning: "discussion_context_not_proof";
  } | null;
};

export type TheoryContextReflectionRecommendedActionV1 = {
  actionId: string;
  label: string;
  panelId: "theory-badge-graph" | "scientific-calculator";
  args: Record<string, unknown>;
  mutatesCalculator: boolean;
  solves: boolean;
};

export type TheoryContextReflectionResolutionV1 = {
  mode: TheoryContextReflectionResolutionMode;
  roleByBadgeId: Record<string, TheoryContextReflectionResolutionRole>;
  rankedBadgeIdsByRole: Record<TheoryContextReflectionResolutionRole, string[]>;
  explanationDepthHint: TheoryContextReflectionExplanationDepthHint;
};

export type TheoryContextReflectionV1 = {
  artifactId: typeof THEORY_CONTEXT_REFLECTION_ARTIFACT_ID;
  schemaVersion: typeof THEORY_CONTEXT_REFLECTION_SCHEMA_VERSION;
  generatedAt: string;
  reflectionId: string;
  graphId: string;
  input: {
    prompt: string;
    conversationContext: string | null;
    mentionedEquations: string[];
    mentionedSymbols: string[];
    mentionedDomains: string[];
    source: TheoryContextReflectionSource;
    confidenceMode: TheoryContextReflectionConfidenceMode;
  };
  exactMatches: TheoryContextReflectionMatchV1[];
  likelyMatches: TheoryContextReflectionMatchV1[];
  inferredDomains: TheoryContextReflectionDomainV1[];
  overlay: TheoryContextReflectionOverlayV1;
  resolution?: TheoryContextReflectionResolutionV1;
  evidenceForAsk: {
    summary: string;
    claimBoundaries: string[];
    recommendedNextActions: TheoryContextReflectionRecommendedActionV1[];
  };
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
  panel_generated_answer: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  deterministic_content_role: "observation_not_assistant_answer";
};

type BuildTheoryContextReflectionInput = Omit<
  TheoryContextReflectionV1,
  | "artifactId"
  | "schemaVersion"
  | "generatedAt"
  | "reflectionId"
  | "resolution"
  | "assistant_answer"
  | "raw_content_included"
  | "terminal_eligible"
  | "panel_generated_answer"
  | "context_role"
  | "ask_context_policy"
  | "deterministic_content_role"
> & {
  generatedAt?: string;
  reflectionId?: string;
  resolution?: TheoryContextReflectionResolutionV1;
};

const FORBIDDEN_THEORY_CONTEXT_REFLECTION_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\bcertified transport solution\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateProbabilityMap(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const [key, probability] of Object.entries(value)) {
    if (!key) issues.push(`${prefix} keys must be non-empty`);
    if (!isFiniteNumber(probability)) {
      issues.push(`${prefix}.${key} must be a finite number`);
    } else if (probability < 0 || probability > 1) {
      issues.push(`${prefix}.${key} must be between 0 and 1`);
    }
  }
}

function validateUncertainty(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("overlay.uncertainty must be an object");
    return;
  }
  validateProbabilityMap("overlay.uncertainty.badgeProbabilityById", value.badgeProbabilityById, issues);
  validateProbabilityMap("overlay.uncertainty.renderChunkProbabilityById", value.renderChunkProbabilityById, issues);
  validateProbabilityMap("overlay.uncertainty.semanticChunkProbabilityById", value.semanticChunkProbabilityById, issues);
  for (
    const field of [
      "priorEntropyBits",
      "posteriorEntropyBits",
      "informationGainBits",
      "normalizedMass",
    ] as const
  ) {
    if (!isFiniteNumber(value[field])) {
      issues.push(`overlay.uncertainty.${field} must be a finite number`);
    } else if (value[field] < 0) {
      issues.push(`overlay.uncertainty.${field} must be non-negative`);
    }
  }
  if (!["broad", "focused", "ambiguous"].includes(String(value.uncertaintyMode))) {
    issues.push("overlay.uncertainty.uncertaintyMode is invalid");
  }
}

function newReflectionId(): string {
  return `theory-context-reflection:${Date.now().toString(36)}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function validateMatch(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["badgeId", "title"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isFiniteNumber(value.score)) issues.push(`${prefix}.score must be a finite number`);
  for (
    const field of [
      "reasons",
      "matchedSymbols",
      "matchedEquationFamilies",
      "matchedRepoPaths",
      "claimBoundaryNotes",
    ] as const
  ) {
    if (!isStringArray(value[field])) issues.push(`${prefix}.${field} must be an array of strings`);
  }
}

function validateMatchArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  (value as unknown[]).forEach((entry: unknown, index: number) => validateMatch(`${prefix}[${index}]`, entry, issues));
}

function validateDomain(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["atlasBlockId", "title"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (!isFiniteNumber(value.score)) issues.push(`${prefix}.score must be a finite number`);
  if (!isStringArray(value.reasons)) issues.push(`${prefix}.reasons must be an array of strings`);
}

function validateOverlay(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("overlay must be an object");
    return;
  }
  for (
    const field of [
      "centerBadgeIds",
      "highlightedBadgeIds",
      "highlightedEdgeIds",
      "exactBadgeIds",
      "likelyBadgeIds",
    ] as const
  ) {
    if (!isStringArray(value[field])) issues.push(`overlay.${field} must be an array of strings`);
  }
  if (!isRecord(value.heatByBadgeId)) {
    issues.push("overlay.heatByBadgeId must be an object");
  } else {
    for (const [badgeId, heat] of Object.entries(value.heatByBadgeId)) {
      if (!badgeId) issues.push("overlay.heatByBadgeId keys must be non-empty");
      if (!isFiniteNumber(heat)) issues.push(`overlay.heatByBadgeId.${badgeId} must be a finite number`);
    }
  }

  if (value.suggestedBiomeChunkIds !== undefined && !isStringArray(value.suggestedBiomeChunkIds)) {
    issues.push("overlay.suggestedBiomeChunkIds must be an array of strings");
  }
  if (value.suggestedSemanticChunkIds !== undefined && !isStringArray(value.suggestedSemanticChunkIds)) {
    issues.push("overlay.suggestedSemanticChunkIds must be an array of strings");
  }
  if (value.uncertainty !== undefined) {
    validateUncertainty(value.uncertainty, issues);
  }
  if (value.suggestedScaleBands !== undefined) {
    if (!isStringArray(value.suggestedScaleBands)) {
      issues.push("overlay.suggestedScaleBands must be an array of strings");
    } else {
      for (const scaleBand of value.suggestedScaleBands) {
        if (!THEORY_CONTEXT_REFLECTION_BIOME_BANDS.includes(scaleBand as TheoryBiomeBand)) {
          issues.push(`overlay.suggestedScaleBands contains invalid scale band: ${scaleBand}`);
        }
      }
    }
  }

  if (value.softRegion === null) return;
  if (!isRecord(value.softRegion)) {
    issues.push("overlay.softRegion must be an object or null");
    return;
  }
  for (const field of ["id", "label"] as const) {
    if (!isNonEmptyString(value.softRegion[field])) {
      issues.push(`overlay.softRegion.${field} must be a non-empty string`);
    }
  }
  if (!isStringArray(value.softRegion.badgeIds)) {
    issues.push("overlay.softRegion.badgeIds must be an array of strings");
  } else if (value.softRegion.badgeIds.length === 0) {
    issues.push("overlay.softRegion.badgeIds must contain at least one badge id");
  }
  if (!isFiniteNumber(value.softRegion.confidence)) {
    issues.push("overlay.softRegion.confidence must be a finite number");
  } else if (value.softRegion.confidence < 0 || value.softRegion.confidence > 1) {
    issues.push("overlay.softRegion.confidence must be between 0 and 1");
  }
  if (value.softRegion.tone !== "green") issues.push("overlay.softRegion.tone must be green");
  if (value.softRegion.meaning !== "discussion_context_not_proof") {
    issues.push("overlay.softRegion.meaning must be discussion_context_not_proof");
  }
}

function validateRecommendedAction(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["actionId", "label"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
  }
  if (value.panelId !== "theory-badge-graph" && value.panelId !== "scientific-calculator") {
    issues.push(`${prefix}.panelId is invalid`);
  }
  if (!isRecord(value.args)) issues.push(`${prefix}.args must be an object`);
  if (typeof value.mutatesCalculator !== "boolean") issues.push(`${prefix}.mutatesCalculator must be boolean`);
  if (typeof value.solves !== "boolean") issues.push(`${prefix}.solves must be boolean`);
}

function emptyResolution(): TheoryContextReflectionResolutionV1 {
  return {
    mode: "path",
    roleByBadgeId: {},
    rankedBadgeIdsByRole: {
      prompt_center: [],
      first_principles_path: [],
      observable_path: [],
      claim_boundary: [],
      consequence_context: [],
      analogy_context: [],
      ambient_context: [],
    },
    explanationDepthHint: "path",
  };
}

function validateResolution(value: unknown, issues: string[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push("resolution must be an object");
    return;
  }
  if (!includes(THEORY_CONTEXT_REFLECTION_RESOLUTION_MODES, value.mode)) {
    issues.push("resolution.mode is invalid");
  }
  if (!includes(THEORY_CONTEXT_REFLECTION_EXPLANATION_DEPTH_HINTS, value.explanationDepthHint)) {
    issues.push("resolution.explanationDepthHint is invalid");
  }
  if (!isRecord(value.roleByBadgeId)) {
    issues.push("resolution.roleByBadgeId must be an object");
  } else {
    for (const [badgeId, role] of Object.entries(value.roleByBadgeId)) {
      if (!badgeId) issues.push("resolution.roleByBadgeId keys must be non-empty");
      if (!includes(THEORY_CONTEXT_REFLECTION_RESOLUTION_ROLES, role)) {
        issues.push(`resolution.roleByBadgeId.${badgeId} is invalid`);
      }
    }
  }
  if (!isRecord(value.rankedBadgeIdsByRole)) {
    issues.push("resolution.rankedBadgeIdsByRole must be an object");
  } else {
    for (const role of THEORY_CONTEXT_REFLECTION_RESOLUTION_ROLES) {
      if (!isStringArray(value.rankedBadgeIdsByRole[role])) {
        issues.push(`resolution.rankedBadgeIdsByRole.${role} must be an array of strings`);
      }
    }
  }
}

function validateEvidenceForAsk(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("evidenceForAsk must be an object");
    return;
  }
  if (!isNonEmptyString(value.summary)) issues.push("evidenceForAsk.summary must be a non-empty string");
  if (!isStringArray(value.claimBoundaries)) {
    issues.push("evidenceForAsk.claimBoundaries must be an array of strings");
  }
  if (!Array.isArray(value.recommendedNextActions)) {
    issues.push("evidenceForAsk.recommendedNextActions must be an array");
    return;
  }
  (value.recommendedNextActions as unknown[]).forEach((action: unknown, index: number) =>
    validateRecommendedAction(`evidenceForAsk.recommendedNextActions[${index}]`, action, issues),
  );
}

export function buildTheoryContextReflectionV1(
  input: BuildTheoryContextReflectionInput,
): TheoryContextReflectionV1 {
  return {
    artifactId: THEORY_CONTEXT_REFLECTION_ARTIFACT_ID,
    schemaVersion: THEORY_CONTEXT_REFLECTION_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    reflectionId: input.reflectionId ?? newReflectionId(),
    graphId: input.graphId,
    input: input.input,
    exactMatches: input.exactMatches,
    likelyMatches: input.likelyMatches,
    inferredDomains: input.inferredDomains,
    overlay: input.overlay,
    resolution: input.resolution ?? emptyResolution(),
    evidenceForAsk: input.evidenceForAsk,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    panel_generated_answer: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    deterministic_content_role: "observation_not_assistant_answer",
  };
}

export function validateTheoryContextReflectionV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["theory context reflection must be an object"];

  if (value.artifactId !== THEORY_CONTEXT_REFLECTION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_CONTEXT_REFLECTION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_CONTEXT_REFLECTION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_CONTEXT_REFLECTION_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "reflectionId", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!isRecord(value.input)) {
    issues.push("input must be an object");
  } else {
    if (!isNonEmptyString(value.input.prompt)) issues.push("input.prompt must be a non-empty string");
    if (!isNullableString(value.input.conversationContext)) {
      issues.push("input.conversationContext must be a string or null");
    }
    for (const field of ["mentionedEquations", "mentionedSymbols", "mentionedDomains"] as const) {
      if (!isStringArray(value.input[field])) issues.push(`input.${field} must be an array of strings`);
    }
    if (!includes(THEORY_CONTEXT_REFLECTION_SOURCES, value.input.source)) {
      issues.push("input.source is invalid");
    }
    if (!includes(THEORY_CONTEXT_REFLECTION_CONFIDENCE_MODES, value.input.confidenceMode)) {
      issues.push("input.confidenceMode is invalid");
    }
  }

  validateMatchArray("exactMatches", value.exactMatches, issues);
  validateMatchArray("likelyMatches", value.likelyMatches, issues);
  if (!Array.isArray(value.inferredDomains)) {
    issues.push("inferredDomains must be an array");
  } else {
    (value.inferredDomains as unknown[]).forEach((domain: unknown, index: number) =>
      validateDomain(`inferredDomains[${index}]`, domain, issues),
    );
  }
  validateOverlay(value.overlay, issues);
  validateResolution(value.resolution, issues);
  validateEvidenceForAsk(value.evidenceForAsk, issues);

  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.panel_generated_answer !== false) issues.push("panel_generated_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") {
    issues.push("ask_context_policy must be evidence_only");
  }
  if (value.deterministic_content_role !== "observation_not_assistant_answer") {
    issues.push("deterministic_content_role must be observation_not_assistant_answer");
  }

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_THEORY_CONTEXT_REFLECTION_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }

  return issues;
}

export function isTheoryContextReflectionV1(
  value: unknown,
): value is TheoryContextReflectionV1 {
  return validateTheoryContextReflectionV1(value).length === 0;
}
