import type { LiveSourceCausalTraceV1 } from "./stage-play-live-source-mail.v1";

export const STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA = "stage_play_live_source_mail_wake_request/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA = "stage_play_live_source_mail_wake_result/v1" as const;

export type StagePlayLiveSourceMailWakeReasonV1 =
  | "unread_mail"
  | "source_recovered"
  | "user_requested_watch";

export type StagePlayLiveSourceMailWakeStatusV1 =
  | "queued"
  | "waiting_for_ui_handoff"
  | "running"
  | "completed"
  | "failed_retryable"
  | "failed_terminal"
  | "deferred_for_pressure"
  | "expired_stale"
  | "expired_superseded"
  | "skipped"
  | "failed";

export type StagePlayLiveSourceMailWakeLifecycleStageV1 =
  | "queued"
  | "waiting_for_ui_handoff"
  | "pressure_deferred"
  | "ask_entered"
  | "decision_recorded"
  | "voice_pending"
  | "voice_delivered"
  | "voice_queued_retry"
  | "voice_held"
  | "voice_blocked"
  | "voice_unknown"
  | "completed"
  | "expired"
  | "failed";

export type StagePlayLiveSourceMailWakeAskLaunchStatusV1 =
  | "not_started"
  | "launching"
  | "launched"
  | "missing_turn_id"
  | "completed"
  | "failed";

export type StagePlayLiveSourceMailWakeRequestV1 = {
  artifactId: "stage_play_live_source_mail_wake_request";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA;
  wakeRequestId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId?: string | null;
  mailIds: string[];
  sourceIds: string[];
  reason: StagePlayLiveSourceMailWakeReasonV1;
  status: StagePlayLiveSourceMailWakeStatusV1;
  askTurnId?: string | null;
  askLaunchId?: string | null;
  askLaunchStatus?: StagePlayLiveSourceMailWakeAskLaunchStatusV1;
  askLaunchStartedAt?: string | null;
  askLaunchCompletedAt?: string | null;
  askLaunchRouteMetadata?: Record<string, unknown> | null;
  routeMetadata?: Record<string, unknown> | null;
  decisionIds: string[];
  attemptCount: number;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  failureReason?: string | null;
  expiresAt?: string | null;
  supersededByWakeRequestId?: string | null;
  lifecycleStage?: StagePlayLiveSourceMailWakeLifecycleStageV1;
  lifecycleReason?: string | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  queuedAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailWakeResultV1 = {
  artifactId: "stage_play_live_source_mail_wake_result";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA;
  wakeResultId: string;
  wakeRequestId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  status:
    | "completed"
    | "skipped"
    | "failed"
    | "failed_retryable"
    | "failed_terminal"
    | "deferred_for_pressure"
    | "expired_stale"
    | "expired_superseded";
  askTurnId?: string | null;
  decisionIds: string[];
  voiceCheckpointRefs: string[];
  budgetStateRef?: string | null;
  skippedReason?: string | null;
  failedReason?: string | null;
  lifecycleStage?: StagePlayLiveSourceMailWakeLifecycleStageV1;
  lifecycleReason?: string | null;
  evidenceRefs: string[];
  causalTrace?: LiveSourceCausalTraceV1;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
