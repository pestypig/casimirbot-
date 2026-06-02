export const STAGE_PLAY_COMPACT_OBSERVATION_ARTIFACT_ID =
  "stage_play_compact_observation" as const;

export const STAGE_PLAY_COMPACT_OBSERVATION_SCHEMA_VERSION =
  "stage_play_compact_observation/v1" as const;

export const STAGE_PLAY_COMPACT_OBSERVATION_DOMAINS = [
  "minecraft_world",
  "narrative_media",
  "browser_task",
  "desktop_app",
  "custom",
] as const;

export const STAGE_PLAY_SCENE_FACT_KINDS = [
  "setting",
  "actor",
  "dialogue_act",
  "objective",
  "conflict",
  "resource",
  "hazard",
  "affordance",
  "blocked_affordance",
  "state_change",
] as const;

export type StagePlayCompactObservationDomainV1 =
  (typeof STAGE_PLAY_COMPACT_OBSERVATION_DOMAINS)[number];

export type StagePlaySceneFactKindV1 =
  (typeof STAGE_PLAY_SCENE_FACT_KINDS)[number];

export type StagePlaySceneFactV1 = {
  factId: string;
  factKind: StagePlaySceneFactKindV1;
  label: string;
  summary: string;
  confidence: number;
  evidenceRefs: string[];
};

export type StagePlayCompactObservationV1 = {
  artifactId: typeof STAGE_PLAY_COMPACT_OBSERVATION_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_COMPACT_OBSERVATION_SCHEMA_VERSION;
  observationId: string;
  domain: StagePlayCompactObservationDomainV1;
  sourceWindow: {
    sourceIds: string[];
    fromTs: string;
    toTs: string;
    windowId?: string | null;
  };
  sceneFacts: StagePlaySceneFactV1[];
  rawContentIncluded: false;
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayCompactObservationV1Input = Omit<
  StagePlayCompactObservationV1,
  "artifactId" | "schemaVersion" | "rawContentIncluded" | "assistant_answer" | "context_role"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

const isConfidence = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export function buildStagePlayCompactObservationV1(
  input: BuildStagePlayCompactObservationV1Input,
): StagePlayCompactObservationV1 {
  return {
    artifactId: STAGE_PLAY_COMPACT_OBSERVATION_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_COMPACT_OBSERVATION_SCHEMA_VERSION,
    observationId: input.observationId,
    domain: input.domain,
    sourceWindow: input.sourceWindow,
    sceneFacts: input.sceneFacts,
    rawContentIncluded: false,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayCompactObservationV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["compact observation must be an object"];

  if (value.artifactId !== STAGE_PLAY_COMPACT_OBSERVATION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_COMPACT_OBSERVATION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_COMPACT_OBSERVATION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_COMPACT_OBSERVATION_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.observationId)) issues.push("observationId must be a non-empty string");
  if (!includes(STAGE_PLAY_COMPACT_OBSERVATION_DOMAINS, value.domain)) issues.push("domain is invalid");
  if (!isRecord(value.sourceWindow)) {
    issues.push("sourceWindow must be an object");
  } else {
    if (!isStringArray(value.sourceWindow.sourceIds)) issues.push("sourceWindow.sourceIds must be strings");
    if (!isNonEmptyString(value.sourceWindow.fromTs)) issues.push("sourceWindow.fromTs must be a non-empty string");
    if (!isNonEmptyString(value.sourceWindow.toTs)) issues.push("sourceWindow.toTs must be a non-empty string");
    if (value.sourceWindow.windowId != null && typeof value.sourceWindow.windowId !== "string") {
      issues.push("sourceWindow.windowId must be a string or null");
    }
  }
  if (!Array.isArray(value.sceneFacts)) {
    issues.push("sceneFacts must be an array");
  } else {
    for (const [index, fact] of value.sceneFacts.entries()) {
      const prefix = `sceneFacts[${index}]`;
      if (!isRecord(fact)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(fact.factId)) issues.push(`${prefix}.factId must be a non-empty string`);
      if (!includes(STAGE_PLAY_SCENE_FACT_KINDS, fact.factKind)) issues.push(`${prefix}.factKind is invalid`);
      if (!isNonEmptyString(fact.label)) issues.push(`${prefix}.label must be a non-empty string`);
      if (!isNonEmptyString(fact.summary)) issues.push(`${prefix}.summary must be a non-empty string`);
      if (!isConfidence(fact.confidence)) issues.push(`${prefix}.confidence must be between 0 and 1`);
      if (!isStringArray(fact.evidenceRefs)) issues.push(`${prefix}.evidenceRefs must be strings`);
    }
  }
  if (value.rawContentIncluded !== false) issues.push("rawContentIncluded must be false");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");

  return issues;
}

export function isStagePlayCompactObservationV1(
  value: unknown,
): value is StagePlayCompactObservationV1 {
  return validateStagePlayCompactObservationV1(value).length === 0;
}
