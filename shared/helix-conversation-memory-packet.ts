export const HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA =
  "helix.conversation_memory_packet.v1" as const;

export type HelixConversationMemoryReference = {
  phrase: string;
  refers_to_turn_id: string;
  refers_to_item_id?: string | null;
  refers_to_artifact_ref?: string | null;
  refers_to_kind:
    | "prior_user_goal"
    | "prior_assistant_answer"
    | "prior_plan"
    | "prior_failure"
    | "prior_evidence"
    | "pending_user_input";
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type HelixConversationMemoryAllowedUse =
  | "pronoun_binding_only"
  | "conversational_continuity"
  | "reuse_prior_evidence_refs"
  | "pending_request_resolution"
  | "blocked";

export type HelixConversationMemoryPacket = {
  schema: typeof HELIX_CONVERSATION_MEMORY_PACKET_SCHEMA;

  thread_id: string;
  current_turn_id: string;
  session_id?: string | null;

  memory_scope: "current_thread";
  selector_version: "v1";

  recent_user_goals: string[];
  recent_assistant_answers: string[];

  resolved_references: HelixConversationMemoryReference[];

  reusable_evidence_refs: string[];
  forbidden_or_stale_refs: string[];

  open_failures: string[];
  pending_user_inputs: string[];

  latest_plan_summary?: string | null;
  latest_answer_summary?: string | null;
  latest_failure_summary?: string | null;

  continuity_summary: string;
  missing_or_uncertain: string[];

  allowed_for_current_goal: boolean;
  allowed_reason: string;
  allowed_use: HelixConversationMemoryAllowedUse;

  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};
