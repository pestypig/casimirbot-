import type { FruitionProcedureExpressionV1, FruitionResultPostureV1 } from "../fruition-procedure-expression";
import type { MoralBadgeComparisonPostureV1, MoralBadgeLocatorV1 } from "../moral-badge-locator";

export const CHARACTER_IDEAL_PROFILE_ARTIFACT_ID = "character_moral_procedural_profile" as const;
export const CHARACTER_IDEAL_PROFILE_SCHEMA_VERSION = "character_moral_procedural_profile/v1" as const;
export const CHARACTER_SITUATION_COMPARISON_ARTIFACT_ID = "character_situation_comparison" as const;
export const CHARACTER_SITUATION_COMPARISON_SCHEMA_VERSION = "character_situation_comparison/v1" as const;

export const CHARACTER_PROFILE_OPERATORS = [
  "supports",
  "requires",
  "balances",
  "constrains",
  "routes_to",
  "blocks",
] as const;

export const CHARACTER_PROFILE_RELATIONS = ["aligns", "tensions", "missing", "counterweighted"] as const;

export type CharacterProfileOperatorV1 = (typeof CHARACTER_PROFILE_OPERATORS)[number];
export type CharacterProfileRelationV1 = (typeof CHARACTER_PROFILE_RELATIONS)[number];

export type CharacterAuthorityV1 = {
  diagnostic_only: true;
  no_moral_verdict: true;
  no_canon_claim_without_source: true;
  no_execution_authority: true;
};

export type CharacterIdealProfileBadgeWeightV1 = {
  nodeId: string;
  weight: number;
  mode?: string;
  operator: CharacterProfileOperatorV1;
  note: string;
};

export type CharacterDecisionRuleV1 = {
  id: string;
  if: string;
  then: string;
  posture: MoralBadgeComparisonPostureV1;
  risks: string[];
  activates: string[];
  matchTerms: string[];
  likelyChoice: string;
  likelySpeechStyle: string[];
  likelyInnerConflict: string[];
  missingEvidence: string[];
};

export type CharacterSituationArchetypeV1 = {
  id: string;
  volume: number;
  topic: string;
  gist: string;
};

export type CharacterIdealProfileV1 = {
  artifactId: typeof CHARACTER_IDEAL_PROFILE_ARTIFACT_ID;
  schemaVersion: typeof CHARACTER_IDEAL_PROFILE_SCHEMA_VERSION;
  generatedAt: string;
  character: {
    id: string;
    displayName: string;
    series: string;
    coverage: {
      volumes_present: number[];
      volumes_missing: number[];
      status: "partial_corpus" | "complete_corpus" | "unknown";
    };
  };
  authority: CharacterAuthorityV1;
  moralBadgeWeights: CharacterIdealProfileBadgeWeightV1[];
  characterSpecificBadges: CharacterIdealProfileBadgeWeightV1[];
  proceduralDecisionRules: CharacterDecisionRuleV1[];
  situationArchetypes: CharacterSituationArchetypeV1[];
  promptRuntimePlan: {
    input: string;
    steps: string[];
    forbidden_outputs: string[];
  };
};

export type CharacterSituationActivationV1 = {
  nodeId: string;
  graphConfidence: number;
  characterWeight: number;
  relation: CharacterProfileRelationV1;
  reason: string;
};

export type CharacterSituationComparisonV1 = {
  artifactId: typeof CHARACTER_SITUATION_COMPARISON_ARTIFACT_ID;
  schemaVersion: typeof CHARACTER_SITUATION_COMPARISON_SCHEMA_VERSION;
  generatedAt: string;
  comparisonId: string;
  characterId: string;
  situationText: string;
  locator: MoralBadgeLocatorV1;
  fruition: FruitionProcedureExpressionV1;
  activatedProfileWeights: CharacterSituationActivationV1[];
  matchedRules: Array<{
    id: string;
    posture: MoralBadgeComparisonPostureV1;
    confidence: number;
    risks: string[];
  }>;
  predictedPosture: FruitionResultPostureV1;
  behavioralHypothesis: {
    likelyChoice: string;
    likelySpeechStyle: string[];
    likelyInnerConflict: string[];
    missingEvidence: string[];
  };
  authority: CharacterAuthorityV1;
};

const AUTHORITY: CharacterAuthorityV1 = {
  diagnostic_only: true,
  no_moral_verdict: true,
  no_canon_claim_without_source: true,
  no_execution_authority: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

function validateWeight(prefix: string, value: unknown, issues: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateAuthority(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (value.diagnostic_only !== true) issues.push(`${prefix}.diagnostic_only must be true`);
  if (value.no_moral_verdict !== true) issues.push(`${prefix}.no_moral_verdict must be true`);
  if (value.no_canon_claim_without_source !== true) {
    issues.push(`${prefix}.no_canon_claim_without_source must be true`);
  }
  if (value.no_execution_authority !== true) issues.push(`${prefix}.no_execution_authority must be true`);
}

function validateBadge(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.nodeId)) issues.push(`${prefix}.nodeId must be a non-empty string`);
  validateWeight(`${prefix}.weight`, value.weight, issues);
  if (!CHARACTER_PROFILE_OPERATORS.includes(value.operator as CharacterProfileOperatorV1)) {
    issues.push(`${prefix}.operator is invalid`);
  }
  if (!isNonEmptyString(value.note)) issues.push(`${prefix}.note must be a non-empty string`);
}

function validateBadgeArray(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  value.forEach((entry, index) => validateBadge(`${prefix}[${index}]`, entry, issues));
}

export function buildCharacterIdealProfileV1(
  input: Omit<CharacterIdealProfileV1, "artifactId" | "schemaVersion" | "authority">,
): CharacterIdealProfileV1 {
  return {
    artifactId: CHARACTER_IDEAL_PROFILE_ARTIFACT_ID,
    schemaVersion: CHARACTER_IDEAL_PROFILE_SCHEMA_VERSION,
    ...input,
    authority: { ...AUTHORITY },
  };
}

export function buildCharacterSituationComparisonV1(
  input: Omit<CharacterSituationComparisonV1, "artifactId" | "schemaVersion" | "authority">,
): CharacterSituationComparisonV1 {
  return {
    artifactId: CHARACTER_SITUATION_COMPARISON_ARTIFACT_ID,
    schemaVersion: CHARACTER_SITUATION_COMPARISON_SCHEMA_VERSION,
    ...input,
    authority: { ...AUTHORITY },
  };
}

export function validateCharacterIdealProfileV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["character profile must be an object"];
  if (value.artifactId !== CHARACTER_IDEAL_PROFILE_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CHARACTER_IDEAL_PROFILE_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CHARACTER_IDEAL_PROFILE_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CHARACTER_IDEAL_PROFILE_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isRecord(value.character)) {
    issues.push("character must be an object");
  } else {
    for (const field of ["id", "displayName", "series"] as const) {
      if (!isNonEmptyString(value.character[field])) issues.push(`character.${field} must be a non-empty string`);
    }
    const coverage = value.character.coverage;
    if (!isRecord(coverage)) {
      issues.push("character.coverage must be an object");
    } else {
      if (!isNumberArray(coverage.volumes_present)) issues.push("character.coverage.volumes_present must be numbers");
      if (!isNumberArray(coverage.volumes_missing)) issues.push("character.coverage.volumes_missing must be numbers");
    }
  }
  validateAuthority("authority", value.authority, issues);
  validateBadgeArray("moralBadgeWeights", value.moralBadgeWeights, issues);
  validateBadgeArray("characterSpecificBadges", value.characterSpecificBadges, issues);
  if (!Array.isArray(value.proceduralDecisionRules)) issues.push("proceduralDecisionRules must be an array");
  if (!Array.isArray(value.situationArchetypes)) issues.push("situationArchetypes must be an array");
  return issues;
}

export function validateCharacterSituationComparisonV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["character situation comparison must be an object"];
  if (value.artifactId !== CHARACTER_SITUATION_COMPARISON_ARTIFACT_ID) {
    issues.push(`artifactId must be ${CHARACTER_SITUATION_COMPARISON_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== CHARACTER_SITUATION_COMPARISON_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CHARACTER_SITUATION_COMPARISON_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "comparisonId", "characterId", "situationText"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!Array.isArray(value.activatedProfileWeights)) issues.push("activatedProfileWeights must be an array");
  if (!Array.isArray(value.matchedRules)) issues.push("matchedRules must be an array");
  if (!FRUITION_POSTURE_VALUES.has(value.predictedPosture)) issues.push("predictedPosture is invalid");
  if (!isRecord(value.behavioralHypothesis)) {
    issues.push("behavioralHypothesis must be an object");
  } else {
    if (!isNonEmptyString(value.behavioralHypothesis.likelyChoice)) {
      issues.push("behavioralHypothesis.likelyChoice must be a non-empty string");
    }
    if (!isStringArray(value.behavioralHypothesis.likelySpeechStyle)) {
      issues.push("behavioralHypothesis.likelySpeechStyle must be a string array");
    }
    if (!isStringArray(value.behavioralHypothesis.likelyInnerConflict)) {
      issues.push("behavioralHypothesis.likelyInnerConflict must be a string array");
    }
    if (!isStringArray(value.behavioralHypothesis.missingEvidence)) {
      issues.push("behavioralHypothesis.missingEvidence must be a string array");
    }
  }
  validateAuthority("authority", value.authority, issues);
  return issues;
}

const FRUITION_POSTURE_VALUES = new Set<string>([
  "diagnostic_only",
  "ask_for_clarification",
  "requires_review",
  "blocked",
  "ready_for_user_decision",
]);
