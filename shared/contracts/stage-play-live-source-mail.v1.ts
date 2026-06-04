export const STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA = "stage_play_live_source_mail_item/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA = "stage_play_live_source_mail_read_result/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA = "stage_play_live_source_mail_decision/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA = "stage_play_live_source_job_state/v1" as const;

export type StagePlayLiveSourceMailSourceKindV1 =
  | "visual_frame"
  | "audio_transcript"
  | "minecraft_world_event"
  | "screen_summary"
  | "manual_feed"
  | "custom";

export type StagePlayLiveSourceMailStatusV1 =
  | "unread"
  | "delivered_to_ask"
  | "read"
  | "decision_recorded"
  | "superseded"
  | "failed";

export type StagePlayMailDecisionV1 =
  | "wait_for_next_summary"
  | "record_interpretation"
  | "draft_text_answer"
  | "request_voice_callout"
  | "request_more_evidence"
  | "request_stage_play_checkpoint"
  | "fail_closed";

export type StagePlayNextLoopStateV1 =
  | "armed_for_next_summary"
  | "continue_with_unread_mail"
  | "paused_by_user"
  | "blocked_missing_source"
  | "blocked_voice_policy"
  | "blocked_tool_error"
  | "ended";

export type StagePlayLiveSourceMailItemV1 = {
  artifactId: "stage_play_live_source_mail_item";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA;
  mailId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId: string;
  sourceKind: StagePlayLiveSourceMailSourceKindV1;
  sourceRefs: {
    sourceId: string;
    frameRef?: string | null;
    evidenceRef?: string | null;
    observationRef?: string | null;
  };
  summary: {
    text: string;
    preview: string;
    confidence?: number | null;
    analysisState?: "analysis_ready" | "pending" | "failed" | "unknown";
  };
  priorContext: {
    previousMailId?: string | null;
    previousEvidenceRef?: string | null;
    previousSummaryPreview?: string | null;
  };
  objective?: {
    objectiveId?: string | null;
    text?: string | null;
  };
  hints: {
    deterministicChangeHint?:
      | "first_summary"
      | "summary_changed"
      | "summary_similar"
      | "source_stale"
      | "source_recovered"
      | "unknown";
    elapsedMsSincePrevious?: number | null;
    sourceFreshness?: "fresh" | "stale" | "missing" | "unknown";
  };
  status: StagePlayLiveSourceMailStatusV1;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceVoicePolicyV1 = {
  voiceEnabled: boolean;
  requiresConfirmation: boolean;
  allowedNow: boolean;
  reason?: string | null;
};

export type StagePlayLiveSourceMailReadResultV1 = {
  artifactId: "stage_play_live_source_mail_read_result";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA;
  readId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  items: StagePlayLiveSourceMailItemV1[];
  activeObjective?: string | null;
  priorDecisionRefs: string[];
  priorAnswerObservationRefs: string[];
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
  suggestedDecisionOptions: StagePlayMailDecisionV1[];
  evidenceRefs: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailDecisionV1 = {
  artifactId: "stage_play_live_source_mail_decision";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA;
  decisionId: string;
  mailIds: string[];
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  decision: StagePlayMailDecisionV1;
  rationalePreview: string;
  textAnswerDraft?: {
    text: string;
    terminalEligible: boolean;
  } | null;
  voiceCalloutDraft?: {
    text: string;
    voiceEligible: boolean;
    requiresConfirmation: boolean;
  } | null;
  requestedTool?: {
    toolName: string;
    args: Record<string, unknown>;
  } | null;
  nextLoopState: StagePlayNextLoopStateV1;
  nextExpectedSourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
  nextExpectedAfterMs?: number | null;
  mailboxCursor?: string | null;
  activeJobId?: string | null;
  rearmReason?: string | null;
  evidenceRefs: string[];
  modelReviewed: boolean;
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceJobStateV1 = {
  artifactId: "stage_play_live_source_job_state";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA;
  jobId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  objective?: string | null;
  status: "armed" | "checking" | "paused" | "blocked" | "ended";
  mailboxCursor?: string | null;
  lastMailId?: string | null;
  lastDecisionId?: string | null;
  nextLoopState: StagePlayNextLoopStateV1;
  nextWakePolicy: {
    sourceKind?: StagePlayLiveSourceMailSourceKindV1 | string | null;
    afterMs?: number | null;
    maxConsecutiveReads?: number | null;
  };
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type AskTurnTranscriptRowDraftV1 = {
  rowId: string;
  rowKind:
    | "mail_received"
    | "mail_read_tool_call"
    | "mail_read_receipt"
    | "agent_decision"
    | "wait_for_next_summary"
    | "text_answer"
    | "voice_callout_request"
    | "voice_tool_call"
    | "loop_state"
    | "blocked";
  title: string;
  body: string;
  source: {
    toolName?: string | null;
    artifactId?: string | null;
    artifactKind?: string | null;
  };
  evidenceRefs: string[];
  authority: "tool_evidence" | "model_decision_receipt" | "generated_prompt" | "model_synthesized_answer" | "blocked";
  assistantAnswer: boolean;
  terminalEligible: boolean;
  createdAt: string;
};
