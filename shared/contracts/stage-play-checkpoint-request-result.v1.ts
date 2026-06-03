import type { StagePlayCheckpointRequestV1 } from "./stage-play-checkpoint-request.v1";

export const STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_SCHEMA =
  "stage_play_checkpoint_request_result/v1" as const;

export const STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_REASONS = [
  "queued",
  "blocked_missing_evidence",
  "throttled",
  "manual_user_priority",
] as const;

export type StagePlayCheckpointRequestResultReasonV1 =
  (typeof STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_REASONS)[number];

export type StagePlayCheckpointRequestResultV1 = {
  schema: typeof STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_SCHEMA;
  checkpointRequest: StagePlayCheckpointRequestV1;
  queueState: {
    schema: "stage_play_checkpoint_queue/v1";
    jobId?: string | null;
    requests: StagePlayCheckpointRequestV1[];
    jobState: unknown | null;
    assistant_answer: false;
    context_role: "tool_evidence";
  };
  readyToRun: boolean;
  reason: StagePlayCheckpointRequestResultReasonV1;
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayCheckpointRequestResultV1Input = Omit<
  StagePlayCheckpointRequestResultV1,
  "schema" | "assistant_answer" | "context_role"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isReason = (value: unknown): value is StagePlayCheckpointRequestResultReasonV1 =>
  typeof value === "string" &&
  STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_REASONS.includes(value as StagePlayCheckpointRequestResultReasonV1);

export function buildStagePlayCheckpointRequestResultV1(
  input: BuildStagePlayCheckpointRequestResultV1Input,
): StagePlayCheckpointRequestResultV1 {
  return {
    schema: STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_SCHEMA,
    checkpointRequest: input.checkpointRequest,
    queueState: input.queueState,
    readyToRun: input.readyToRun,
    reason: input.reason,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayCheckpointRequestResultV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["value must be an object"];
  if (value.schema !== STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_SCHEMA) {
    issues.push(`schema must be ${STAGE_PLAY_CHECKPOINT_REQUEST_RESULT_SCHEMA}`);
  }
  if (!isRecord(value.checkpointRequest)) issues.push("checkpointRequest must be an object");
  if (!isRecord(value.queueState)) issues.push("queueState must be an object");
  if (typeof value.readyToRun !== "boolean") issues.push("readyToRun must be boolean");
  if (!isReason(value.reason)) issues.push("reason is invalid");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  return issues;
}

export function isStagePlayCheckpointRequestResultV1(
  value: unknown,
): value is StagePlayCheckpointRequestResultV1 {
  return validateStagePlayCheckpointRequestResultV1(value).length === 0;
}
