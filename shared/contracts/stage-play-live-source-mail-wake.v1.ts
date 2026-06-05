export const STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_REQUEST_SCHEMA = "stage_play_live_source_mail_wake_request/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_WAKE_RESULT_SCHEMA = "stage_play_live_source_mail_wake_result/v1" as const;

export type StagePlayLiveSourceMailWakeReasonV1 =
  | "unread_mail"
  | "source_recovered"
  | "user_requested_watch";

export type StagePlayLiveSourceMailWakeStatusV1 =
  | "queued"
  | "running"
  | "completed"
  | "skipped"
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
  decisionIds: string[];
  evidenceRefs: string[];
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
  status: "completed" | "skipped" | "failed";
  askTurnId?: string | null;
  decisionIds: string[];
  skippedReason?: string | null;
  failedReason?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
