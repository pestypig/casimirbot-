export const STAGE_PLAY_PREDICTION_VALIDATION_ARTIFACT_ID =
  "stage_play_prediction_validation" as const;

export const STAGE_PLAY_PREDICTION_VALIDATION_SCHEMA_VERSION =
  "stage_play_prediction_validation/v1" as const;

export const STAGE_PLAY_PREDICTION_VALIDATION_OUTCOMES = [
  "confirmed",
  "partially_confirmed",
  "missed",
  "not_yet_observable",
  "too_vague_to_score",
  "source_missing",
] as const;

export type StagePlayPredictionValidationOutcomeV1 =
  (typeof STAGE_PLAY_PREDICTION_VALIDATION_OUTCOMES)[number];

export type StagePlayPredictionValidationV1 = {
  artifactId: typeof STAGE_PLAY_PREDICTION_VALIDATION_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_PREDICTION_VALIDATION_SCHEMA_VERSION;
  validationId: string;
  predictionId: string;
  graphId: string;
  validationWindow: {
    fromTs: string;
    toTs: string;
    evidenceRefs: string[];
  };
  outcome: StagePlayPredictionValidationOutcomeV1;
  matchedSignals: string[];
  contradictedSignals: string[];
  confidenceDelta: number;
  explanation: string;
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayPredictionValidationV1Input = Omit<
  StagePlayPredictionValidationV1,
  "artifactId" | "schemaVersion" | "assistant_answer" | "context_role"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

const isConfidenceDelta = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= -1 && value <= 1;

export function buildStagePlayPredictionValidationV1(
  input: BuildStagePlayPredictionValidationV1Input,
): StagePlayPredictionValidationV1 {
  return {
    artifactId: STAGE_PLAY_PREDICTION_VALIDATION_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_PREDICTION_VALIDATION_SCHEMA_VERSION,
    validationId: input.validationId,
    predictionId: input.predictionId,
    graphId: input.graphId,
    validationWindow: input.validationWindow,
    outcome: input.outcome,
    matchedSignals: input.matchedSignals,
    contradictedSignals: input.contradictedSignals,
    confidenceDelta: input.confidenceDelta,
    explanation: input.explanation,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayPredictionValidationV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["prediction validation must be an object"];

  if (value.artifactId !== STAGE_PLAY_PREDICTION_VALIDATION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_PREDICTION_VALIDATION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_PREDICTION_VALIDATION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_PREDICTION_VALIDATION_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.validationId)) issues.push("validationId must be a non-empty string");
  if (!isNonEmptyString(value.predictionId)) issues.push("predictionId must be a non-empty string");
  if (!isNonEmptyString(value.graphId)) issues.push("graphId must be a non-empty string");
  if (!isRecord(value.validationWindow)) {
    issues.push("validationWindow must be an object");
  } else {
    if (!isNonEmptyString(value.validationWindow.fromTs)) issues.push("validationWindow.fromTs must be a non-empty string");
    if (!isNonEmptyString(value.validationWindow.toTs)) issues.push("validationWindow.toTs must be a non-empty string");
    if (!isStringArray(value.validationWindow.evidenceRefs)) issues.push("validationWindow.evidenceRefs must be strings");
  }
  if (!includes(STAGE_PLAY_PREDICTION_VALIDATION_OUTCOMES, value.outcome)) {
    issues.push("outcome is invalid");
  }
  if (!isStringArray(value.matchedSignals)) issues.push("matchedSignals must be strings");
  if (!isStringArray(value.contradictedSignals)) issues.push("contradictedSignals must be strings");
  if (!isConfidenceDelta(value.confidenceDelta)) issues.push("confidenceDelta must be between -1 and 1");
  if (!isNonEmptyString(value.explanation)) issues.push("explanation must be a non-empty string");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");

  return issues;
}

export function isStagePlayPredictionValidationV1(
  value: unknown,
): value is StagePlayPredictionValidationV1 {
  return validateStagePlayPredictionValidationV1(value).length === 0;
}
