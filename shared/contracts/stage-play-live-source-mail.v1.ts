export const STAGE_PLAY_LIVE_SOURCE_MAIL_ITEM_SCHEMA = "stage_play_live_source_mail_item/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_READ_RESULT_SCHEMA = "stage_play_live_source_mail_read_result/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_DECISION_SCHEMA = "stage_play_live_source_mail_decision/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_JOB_STATE_SCHEMA = "stage_play_live_source_job_state/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_SCHEMA = "stage_play_live_source_watch_job_policy/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA = "stage_play_live_source_mail_transcript_entry/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA = "stage_play_live_source_mail_context_pack/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA = "stage_play_live_source_voice_delivery_receipt/v1" as const;

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
  voicePolicy?: StagePlayLiveSourceVoicePolicyV1 | null;
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

export type StagePlayLiveSourceVoiceDeliveryReceiptV1 = {
  artifactId: "stage_play_live_source_voice_delivery_receipt";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA;
  receiptId: string;
  decisionId: string;
  mailIds: string[];
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  status:
    | "delivered"
    | "queued"
    | "confirmation_required"
    | "blocked_voice_disabled"
    | "blocked_voice_not_allowed"
    | "blocked_missing_callout_draft"
    | "blocked_missing_voice_tool"
    | "failed";
  voiceCalloutDraft?: {
    text: string;
    voiceEligible: boolean;
    requiresConfirmation: boolean;
  } | null;
  voicePolicy: StagePlayLiveSourceVoicePolicyV1;
  requestedTool?: {
    toolName: string;
    args: Record<string, unknown>;
  } | null;
  delivery?: {
    provider?: string | null;
    artifactRef?: string | null;
    message?: string | null;
  } | null;
  evidenceRefs: string[];
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
  watchJobPolicyRef?: string | null;
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

export type StagePlayLiveSourceWatchJobPolicyV1 = {
  artifactId: "stage_play_live_source_watch_job_policy";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_WATCH_JOB_POLICY_SCHEMA;
  policyId: string;
  jobId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceIds: string[];
  objectiveText: string;
  decisionPolicyPrompt: string;
  outputPolicy: {
    allowTextAnswer: boolean;
    allowVoiceCallout: boolean;
    voiceRequiresUrgency: boolean;
    confirmationRequired: boolean;
  };
  importanceCriteria: string[];
  suppressCriteria: string[];
  status: "armed" | "paused" | "ended" | "blocked";
  priorDecisionRefs: string[];
  priorAnswerRefs: string[];
  evidenceRefs: string[];
  createdAt: string;
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
    | "requested_tool"
    | "wait_for_next_summary"
    | "text_answer"
    | "voice_callout_request"
    | "voice_tool_call"
    | "voice_receipt"
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

export type StagePlayLiveSourceMailTranscriptEntryV1 = {
  artifactId: "stage_play_live_source_mail_transcript_entry";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_TRANSCRIPT_ENTRY_SCHEMA;
  entryId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  wakeRequestId?: string | null;
  wakeResultId?: string | null;
  askTurnId?: string | null;
  decisionIds: string[];
  mailIds: string[];
  sourceIds: string[];
  sequence: number;
  row: AskTurnTranscriptRowDraftV1;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceMailContextPackV1 = {
  artifactId: "stage_play_live_source_mail_context_pack";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_MAIL_CONTEXT_PACK_SCHEMA;
  contextPackId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  includedReason:
    | "armed_watch_job"
    | "active_stage_play_environment"
    | "none";
  activeWatchJobs: Array<{
    jobId: string;
    policyId: string;
    objectiveText: string;
    decisionPolicyPrompt: string;
    sourceIds: string[];
    outputPolicy: StagePlayLiveSourceWatchJobPolicyV1["outputPolicy"];
    importanceCriteria: string[];
    suppressCriteria: string[];
    status: StagePlayLiveSourceWatchJobPolicyV1["status"];
    updatedAt: string;
  }>;
  jobStates: Array<{
    jobId: string;
    sourceIds: string[];
    status: StagePlayLiveSourceJobStateV1["status"];
    mailboxCursor?: string | null;
    lastMailId?: string | null;
    lastDecisionId?: string | null;
    nextLoopState: StagePlayNextLoopStateV1;
    updatedAt: string;
  }>;
  latestMailItems: Array<{
    mailId: string;
    sourceId: string;
    sourceKind: StagePlayLiveSourceMailSourceKindV1 | string;
    status: StagePlayLiveSourceMailStatusV1;
    summaryPreview: string;
    confidence?: number | null;
    analysisState?: StagePlayLiveSourceMailItemV1["summary"]["analysisState"];
    evidenceRefs: string[];
    createdAt: string;
  }>;
  latestDecisions: Array<{
    decisionId: string;
    mailIds: string[];
    decision: StagePlayMailDecisionV1;
    rationalePreview: string;
    textAnswerDraft?: string | null;
    voiceCalloutDraft?: string | null;
    activeJobId?: string | null;
    mailboxCursor?: string | null;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  latestTextAnswerDrafts: Array<{
    decisionId: string;
    text: string;
    terminalEligible: boolean;
    createdAt: string;
  }>;
  latestVoiceCalloutDrafts: Array<{
    decisionId: string;
    text: string;
    voiceEligible: boolean;
    requiresConfirmation: boolean;
    createdAt: string;
  }>;
  currentMailboxCursor?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
