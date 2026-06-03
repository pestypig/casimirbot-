export const STAGE_PLAY_CHECKPOINT_REQUEST_ARTIFACT_ID =
  "stage_play_checkpoint_request" as const;

export const STAGE_PLAY_CHECKPOINT_REQUEST_SCHEMA_VERSION =
  "stage_play_checkpoint_request/v1" as const;

export const STAGE_PLAY_CHECKPOINT_REQUEST_REASONS = [
  "first_usable_observation",
  "meaningful_perturbation",
  "prediction_horizon_expired",
  "prediction_validation_needed",
  "user_requested_checkpoint",
  "missing_evidence_resolved",
] as const;

export const STAGE_PLAY_CHECKPOINT_REQUEST_STATUSES = [
  "queued",
  "running",
  "completed",
  "skipped",
  "blocked",
  "superseded",
] as const;

export type StagePlayCheckpointRequestReasonV1 =
  (typeof STAGE_PLAY_CHECKPOINT_REQUEST_REASONS)[number];

export type StagePlayCheckpointRequestStatusV1 =
  (typeof STAGE_PLAY_CHECKPOINT_REQUEST_STATUSES)[number];

export type StagePlayCheckpointRequestV1 = {
  artifactId: typeof STAGE_PLAY_CHECKPOINT_REQUEST_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_CHECKPOINT_REQUEST_SCHEMA_VERSION;
  checkpointRequestId: string;
  jobId: string;
  graphId: string;
  objective: string;
  userPromptRef?: string | null;
  reason: StagePlayCheckpointRequestReasonV1;
  question: string;
  currentGraphRefs: string[];
  compactObservationRefs: string[];
  perturbationRefs: string[];
  priorAnswerSnapshotRefs: string[];
  missingEvidence: string[];
  checkpointPolicy: {
    autoRunEligible: boolean;
    requiresUserApproval: boolean;
    minMsSinceLastCheckpoint: number;
  };
  status: StagePlayCheckpointRequestStatusV1;
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayCheckpointRequestV1Input = Omit<
  StagePlayCheckpointRequestV1,
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

export function buildStagePlayCheckpointRequestV1(
  input: BuildStagePlayCheckpointRequestV1Input,
): StagePlayCheckpointRequestV1 {
  return {
    artifactId: STAGE_PLAY_CHECKPOINT_REQUEST_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_CHECKPOINT_REQUEST_SCHEMA_VERSION,
    checkpointRequestId: input.checkpointRequestId,
    jobId: input.jobId,
    graphId: input.graphId,
    objective: input.objective,
    userPromptRef: input.userPromptRef ?? null,
    reason: input.reason,
    question: input.question,
    currentGraphRefs: input.currentGraphRefs,
    compactObservationRefs: input.compactObservationRefs,
    perturbationRefs: input.perturbationRefs,
    priorAnswerSnapshotRefs: input.priorAnswerSnapshotRefs,
    missingEvidence: input.missingEvidence,
    checkpointPolicy: {
      autoRunEligible: input.checkpointPolicy.autoRunEligible,
      requiresUserApproval: input.checkpointPolicy.requiresUserApproval,
      minMsSinceLastCheckpoint: input.checkpointPolicy.minMsSinceLastCheckpoint,
    },
    status: input.status,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayCheckpointRequestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["checkpoint request must be an object"];

  if (value.artifactId !== STAGE_PLAY_CHECKPOINT_REQUEST_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_CHECKPOINT_REQUEST_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_CHECKPOINT_REQUEST_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_CHECKPOINT_REQUEST_SCHEMA_VERSION}`);
  }
  for (const field of ["checkpointRequestId", "jobId", "graphId", "objective", "question"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (
    value.userPromptRef !== undefined &&
    value.userPromptRef !== null &&
    typeof value.userPromptRef !== "string"
  ) {
    issues.push("userPromptRef must be a string or null");
  }
  if (!includes(STAGE_PLAY_CHECKPOINT_REQUEST_REASONS, value.reason)) {
    issues.push("reason is invalid");
  }
  if (!includes(STAGE_PLAY_CHECKPOINT_REQUEST_STATUSES, value.status)) {
    issues.push("status is invalid");
  }
  for (const field of [
    "currentGraphRefs",
    "compactObservationRefs",
    "perturbationRefs",
    "priorAnswerSnapshotRefs",
    "missingEvidence",
  ] as const) {
    if (!isStringArray(value[field])) issues.push(`${field} must be strings`);
  }
  if (!isRecord(value.checkpointPolicy)) {
    issues.push("checkpointPolicy must be an object");
  } else {
    if (typeof value.checkpointPolicy.autoRunEligible !== "boolean") {
      issues.push("checkpointPolicy.autoRunEligible must be boolean");
    }
    if (typeof value.checkpointPolicy.requiresUserApproval !== "boolean") {
      issues.push("checkpointPolicy.requiresUserApproval must be boolean");
    }
    if (
      typeof value.checkpointPolicy.minMsSinceLastCheckpoint !== "number" ||
      !Number.isFinite(value.checkpointPolicy.minMsSinceLastCheckpoint) ||
      value.checkpointPolicy.minMsSinceLastCheckpoint < 0
    ) {
      issues.push("checkpointPolicy.minMsSinceLastCheckpoint must be a non-negative finite number");
    }
  }
  if (value.reason === "user_requested_checkpoint" && value.status === "blocked") {
    issues.push("manual user checkpoint requests must not be blocked at admission");
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");

  return issues;
}

export function isStagePlayCheckpointRequestV1(
  value: unknown,
): value is StagePlayCheckpointRequestV1 {
  return validateStagePlayCheckpointRequestV1(value).length === 0;
}
