export const STAGE_PLAY_PREDICTION_ARTIFACT_ID =
  "stage_play_prediction_hypothesis" as const;

export const STAGE_PLAY_PREDICTION_SCHEMA_VERSION =
  "stage_play_prediction_hypothesis/v1" as const;

export const STAGE_PLAY_PREDICTION_HORIZON_KINDS = [
  "next_scene_beat",
  "next_2_to_5_beats",
  "next_observation_window",
] as const;

export const STAGE_PLAY_PREDICTED_MOVE_CLASSES = [
  "delay",
  "attack",
  "retreat",
  "reveal_information",
  "seek_confirmation",
  "negotiate",
  "deceive",
  "escalate",
  "deescalate",
  "unknown",
] as const;

export type StagePlayPredictionHorizonKindV1 =
  (typeof STAGE_PLAY_PREDICTION_HORIZON_KINDS)[number];

export type StagePlayPredictedMoveClassV1 =
  (typeof STAGE_PLAY_PREDICTED_MOVE_CLASSES)[number];

export type StagePlayPredictionHypothesisV1 = {
  artifactId: typeof STAGE_PLAY_PREDICTION_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_PREDICTION_SCHEMA_VERSION;
  predictionId: string;
  graphId: string;
  sourceObservationWindow: {
    fromTs: string;
    toTs: string;
    evidenceRefs: string[];
  };
  predictionWindow: {
    horizonKind: StagePlayPredictionHorizonKindV1;
    expiresAfterTs?: string | null;
  };
  predictedMoveClass: StagePlayPredictedMoveClassV1;
  actorRefs: string[];
  supportingBadgeIds: string[];
  blockedMoveIds: string[];
  claim: string;
  confidence: number;
  scoreableSignals: string[];
  evidenceRefs: string[];
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayPredictionHypothesisV1Input = Omit<
  StagePlayPredictionHypothesisV1,
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

const isConfidence = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export function buildStagePlayPredictionHypothesisV1(
  input: BuildStagePlayPredictionHypothesisV1Input,
): StagePlayPredictionHypothesisV1 {
  return {
    artifactId: STAGE_PLAY_PREDICTION_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_PREDICTION_SCHEMA_VERSION,
    predictionId: input.predictionId,
    graphId: input.graphId,
    sourceObservationWindow: input.sourceObservationWindow,
    predictionWindow: input.predictionWindow,
    predictedMoveClass: input.predictedMoveClass,
    actorRefs: input.actorRefs,
    supportingBadgeIds: input.supportingBadgeIds,
    blockedMoveIds: input.blockedMoveIds,
    claim: input.claim,
    confidence: input.confidence,
    scoreableSignals: input.scoreableSignals,
    evidenceRefs: input.evidenceRefs,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayPredictionHypothesisV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["prediction hypothesis must be an object"];

  if (value.artifactId !== STAGE_PLAY_PREDICTION_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_PREDICTION_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_PREDICTION_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_PREDICTION_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.predictionId)) issues.push("predictionId must be a non-empty string");
  if (!isNonEmptyString(value.graphId)) issues.push("graphId must be a non-empty string");
  if (!isRecord(value.sourceObservationWindow)) {
    issues.push("sourceObservationWindow must be an object");
  } else {
    if (!isNonEmptyString(value.sourceObservationWindow.fromTs)) issues.push("sourceObservationWindow.fromTs must be a non-empty string");
    if (!isNonEmptyString(value.sourceObservationWindow.toTs)) issues.push("sourceObservationWindow.toTs must be a non-empty string");
    if (!isStringArray(value.sourceObservationWindow.evidenceRefs)) issues.push("sourceObservationWindow.evidenceRefs must be strings");
  }
  if (!isRecord(value.predictionWindow)) {
    issues.push("predictionWindow must be an object");
  } else {
    if (!includes(STAGE_PLAY_PREDICTION_HORIZON_KINDS, value.predictionWindow.horizonKind)) {
      issues.push("predictionWindow.horizonKind is invalid");
    }
    if (value.predictionWindow.expiresAfterTs != null && typeof value.predictionWindow.expiresAfterTs !== "string") {
      issues.push("predictionWindow.expiresAfterTs must be a string or null");
    }
  }
  if (!includes(STAGE_PLAY_PREDICTED_MOVE_CLASSES, value.predictedMoveClass)) {
    issues.push("predictedMoveClass is invalid");
  }
  for (const field of ["actorRefs", "supportingBadgeIds", "blockedMoveIds", "scoreableSignals", "evidenceRefs"] as const) {
    if (!isStringArray(value[field])) issues.push(`${field} must be strings`);
  }
  if (!isNonEmptyString(value.claim)) issues.push("claim must be a non-empty string");
  if (!isConfidence(value.confidence)) issues.push("confidence must be between 0 and 1");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");

  return issues;
}

export function isStagePlayPredictionHypothesisV1(
  value: unknown,
): value is StagePlayPredictionHypothesisV1 {
  return validateStagePlayPredictionHypothesisV1(value).length === 0;
}
