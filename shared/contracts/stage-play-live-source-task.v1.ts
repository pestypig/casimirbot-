export const STAGE_PLAY_LIVE_SOURCE_TASK_SCHEMA = "stage_play_live_source_task/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_TASK_QUEUE_SNAPSHOT_SCHEMA =
  "stage_play_live_source_task_queue_snapshot/v1" as const;

export type StagePlayLiveSourceTaskKindV1 =
  | "immediate_prediction_check"
  | "prediction_error_review"
  | "mail_batch_interpretation"
  | "voice_callout_candidate"
  | "long_horizon_projection"
  | "memory_consolidation"
  | "user_prompt_response";

export type StagePlayLiveSourceTaskPriorityV1 =
  | "urgent"
  | "high"
  | "normal"
  | "background";

export type StagePlayLiveSourceTaskStatusV1 =
  | "queued"
  | "running"
  | "deferred"
  | "completed"
  | "superseded"
  | "blocked";

export type StagePlayLiveSourceTaskV1 = {
  artifactId: "stage_play_live_source_task";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_TASK_SCHEMA;
  taskId: string;
  taskKind: StagePlayLiveSourceTaskKindV1;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  policyId?: string | null;
  sourceIds: string[];
  mailIds: string[];
  narrativeStateRef?: string | null;
  priority: StagePlayLiveSourceTaskPriorityV1;
  deadlineHintMs?: number | null;
  supersedesTaskRefs: string[];
  status: StagePlayLiveSourceTaskStatusV1;
  statusReason?: string | null;
  softInterruptRecommended?: boolean;
  activeTaskRef?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceTaskQueueSnapshotV1 = {
  artifactId: "stage_play_live_source_task_queue_snapshot";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_TASK_QUEUE_SNAPSHOT_SCHEMA;
  threadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
  runningTask?: StagePlayLiveSourceTaskV1 | null;
  queuedTasks: StagePlayLiveSourceTaskV1[];
  deferredTasks: StagePlayLiveSourceTaskV1[];
  blockedTasks: StagePlayLiveSourceTaskV1[];
  completedTaskRefs: string[];
  softInterruptRecommended: boolean;
  softInterruptReason?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
