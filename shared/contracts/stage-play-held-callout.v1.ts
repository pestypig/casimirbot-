export const STAGE_PLAY_HELD_CALLOUT_SCHEMA = "stage_play_held_callout/v1" as const;
export const STAGE_PLAY_HELD_CALLOUT_RECHECK_SCHEMA = "stage_play_held_callout_recheck/v1" as const;

export type StagePlayHeldCalloutUrgencyV1 =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type StagePlayHeldCalloutStatusV1 =
  | "held_user_speaking"
  | "held_manual_prompt_active"
  | "ready_for_recheck"
  | "merged_into_answer"
  | "stale_after_new_mail"
  | "delivered"
  | "dropped";

export type StagePlayHeldCalloutRecheckResultV1 =
  | "still_relevant"
  | "superseded_by_user_prompt"
  | "stale_after_new_mail"
  | "merge_into_answer"
  | "drop";

export type StagePlayHeldCalloutV1 = {
  artifactId: "stage_play_held_callout";
  schemaVersion: typeof STAGE_PLAY_HELD_CALLOUT_SCHEMA;
  calloutId: string;
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  jobId: string;
  decisionId: string;
  mailIds: string[];
  text: string;
  urgency: StagePlayHeldCalloutUrgencyV1;
  status: StagePlayHeldCalloutStatusV1;
  statusReason?: string | null;
  mergedAnswerRef?: string | null;
  supersededByPromptRef?: string | null;
  staleAfterMailId?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayHeldCalloutRecheckV1 = {
  artifactId: "stage_play_held_callout_recheck";
  schemaVersion: typeof STAGE_PLAY_HELD_CALLOUT_RECHECK_SCHEMA;
  recheckId: string;
  calloutId: string;
  decisionId: string;
  threadId: string;
  result: StagePlayHeldCalloutRecheckResultV1;
  nextStatus: StagePlayHeldCalloutStatusV1;
  reason: string;
  userPromptRef?: string | null;
  newMailIds: string[];
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
