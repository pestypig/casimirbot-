export const STAGE_PLAY_LIVE_SOURCE_CONVERSATION_EVENT_SCHEMA =
  "stage_play_live_source_conversation_event/v1" as const;
export const STAGE_PLAY_LIVE_SOURCE_CONVERSATION_CONTEXT_PACK_SCHEMA =
  "stage_play_live_source_conversation_context_pack/v1" as const;

export type StagePlayLiveSourceConversationEventSourceV1 =
  | "user_text"
  | "user_voice"
  | "assistant_answer"
  | "assistant_question"
  | "system_steering";

export type StagePlayLiveSourceConversationIntentV1 =
  | "ask_opinion"
  | "ask_strategy"
  | "constrain_policy"
  | "correct_agent"
  | "answer_agent_question"
  | "casual_comment"
  | "pause_or_stop"
  | "voice_preference_update"
  | "priority_update";

export type StagePlayLiveSourceConversationPriorityV1 =
  | "urgent_user_interrupt"
  | "active_user_prompt"
  | "policy_update"
  | "background_context";

export type StagePlayLiveSourceConversationEventV1 = {
  artifactId: "stage_play_live_source_conversation_event";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_CONVERSATION_EVENT_SCHEMA;
  eventId: string;
  threadId: string;
  jobId?: string | null;
  turnId?: string | null;
  source: StagePlayLiveSourceConversationEventSourceV1;
  textPreview: string;
  intent: StagePlayLiveSourceConversationIntentV1;
  priority: StagePlayLiveSourceConversationPriorityV1;
  appliesTo: {
    mailIds: string[];
    narrativeStateId?: string | null;
    watchJobPolicyRef?: string | null;
  };
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type StagePlayLiveSourceConversationContextPackV1 = {
  artifactId: "stage_play_live_source_conversation_context_pack";
  schemaVersion: typeof STAGE_PLAY_LIVE_SOURCE_CONVERSATION_CONTEXT_PACK_SCHEMA;
  contextPackId: string;
  threadId: string;
  jobId?: string | null;
  turnId?: string | null;
  recentUserQuestions: Array<{
    eventId: string;
    textPreview: string;
    intent: StagePlayLiveSourceConversationIntentV1;
    priority: StagePlayLiveSourceConversationPriorityV1;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  recentAssistantAnswers: Array<{
    eventId: string;
    textPreview: string;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  activeConstraints: Array<{
    eventId: string;
    textPreview: string;
    priority: StagePlayLiveSourceConversationPriorityV1;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  openQuestions: Array<{
    eventId: string;
    textPreview: string;
    source: StagePlayLiveSourceConversationEventSourceV1;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  heldCallouts: Array<{
    eventId: string;
    textPreview: string;
    priority: StagePlayLiveSourceConversationPriorityV1;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  lastAgreedObjective?: {
    eventId: string;
    textPreview: string;
    evidenceRefs: string[];
    createdAt: string;
  } | null;
  voicePreferences: Array<{
    eventId: string;
    textPreview: string;
    priority: StagePlayLiveSourceConversationPriorityV1;
    evidenceRefs: string[];
    createdAt: string;
  }>;
  events: StagePlayLiveSourceConversationEventV1[];
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};
