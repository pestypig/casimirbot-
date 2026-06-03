export const STAGE_PLAY_PERTURBATION_EVENT_ARTIFACT_ID =
  "stage_play_perturbation_event" as const;

export const STAGE_PLAY_PERTURBATION_EVENT_SCHEMA_VERSION =
  "stage_play_perturbation_event/v1" as const;

export const STAGE_PLAY_PERTURBATION_REASONS = [
  "first_usable_observation",
  "new_visual_frame",
  "audio_segment_arrived",
  "scene_change",
  "actor_or_object_change",
  "hazard_change",
  "source_route_change",
  "missing_evidence_resolved",
  "prediction_horizon_expired",
  "prediction_contradicted",
  "user_objective_changed",
] as const;

export const STAGE_PLAY_PERTURBATION_MATERIALITIES = [
  "minor",
  "meaningful",
  "critical",
] as const;

export type StagePlayPerturbationReasonV1 =
  (typeof STAGE_PLAY_PERTURBATION_REASONS)[number];

export type StagePlayPerturbationMaterialityV1 =
  (typeof STAGE_PLAY_PERTURBATION_MATERIALITIES)[number];

export type StagePlayPerturbationEventV1 = {
  artifactId: typeof STAGE_PLAY_PERTURBATION_EVENT_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_PERTURBATION_EVENT_SCHEMA_VERSION;
  perturbationId: string;
  jobId: string;
  graphId: string;
  sourceWindowFromRefs: string[];
  sourceWindowToRefs: string[];
  reason: StagePlayPerturbationReasonV1;
  affectedBadgeIds: string[];
  staleAnswerSnapshotIds: string[];
  materiality: StagePlayPerturbationMaterialityV1;
  checkpointSuggested: boolean;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayPerturbationEventV1Input = Omit<
  StagePlayPerturbationEventV1,
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

export function buildStagePlayPerturbationEventV1(
  input: BuildStagePlayPerturbationEventV1Input,
): StagePlayPerturbationEventV1 {
  return {
    artifactId: STAGE_PLAY_PERTURBATION_EVENT_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_PERTURBATION_EVENT_SCHEMA_VERSION,
    perturbationId: input.perturbationId,
    jobId: input.jobId,
    graphId: input.graphId,
    sourceWindowFromRefs: input.sourceWindowFromRefs,
    sourceWindowToRefs: input.sourceWindowToRefs,
    reason: input.reason,
    affectedBadgeIds: input.affectedBadgeIds,
    staleAnswerSnapshotIds: input.staleAnswerSnapshotIds,
    materiality: input.materiality,
    checkpointSuggested: input.checkpointSuggested,
    evidenceRefs: input.evidenceRefs,
    createdAt: input.createdAt,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayPerturbationEventV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["perturbation event must be an object"];

  if (value.artifactId !== STAGE_PLAY_PERTURBATION_EVENT_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_PERTURBATION_EVENT_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_PERTURBATION_EVENT_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_PERTURBATION_EVENT_SCHEMA_VERSION}`);
  }
  for (const field of ["perturbationId", "jobId", "graphId", "createdAt"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  for (const field of [
    "sourceWindowFromRefs",
    "sourceWindowToRefs",
    "affectedBadgeIds",
    "staleAnswerSnapshotIds",
    "evidenceRefs",
  ] as const) {
    if (!isStringArray(value[field])) issues.push(`${field} must be strings`);
  }
  if (!includes(STAGE_PLAY_PERTURBATION_REASONS, value.reason)) {
    issues.push("reason is invalid");
  }
  if (!includes(STAGE_PLAY_PERTURBATION_MATERIALITIES, value.materiality)) {
    issues.push("materiality is invalid");
  }
  if (typeof value.checkpointSuggested !== "boolean") {
    issues.push("checkpointSuggested must be boolean");
  }
  if (value.materiality === "minor" && value.checkpointSuggested === true) {
    issues.push("minor perturbations must not suggest checkpoints");
  }
  if (value.materiality !== "minor" && value.checkpointSuggested !== true) {
    issues.push("meaningful or critical perturbations must suggest checkpoints");
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");

  return issues;
}

export function isStagePlayPerturbationEventV1(
  value: unknown,
): value is StagePlayPerturbationEventV1 {
  return validateStagePlayPerturbationEventV1(value).length === 0;
}
