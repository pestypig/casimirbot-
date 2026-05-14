export const HELIX_CLARIFICATION_NEED_SCHEMA =
  "helix.clarification_need.v1" as const;
export const HELIX_CLARIFICATION_QUESTION_PROPOSAL_SCHEMA =
  "helix.clarification_question_proposal.v1" as const;

export type HelixClarificationSourceFamily =
  | "minecraft_events"
  | "discord_voice"
  | "calculator_stream"
  | "physics_simulation"
  | "browser_transcript"
  | "research_session"
  | "custom";

export type HelixClarificationNeed = {
  schema: typeof HELIX_CLARIFICATION_NEED_SCHEMA;
  need_id: string;
  thread_id: string;
  job_id?: string | null;
  environment_id?: string | null;
  source_family: HelixClarificationSourceFamily;
  trigger:
    | "ambiguous_hypothesis"
    | "missing_evidence"
    | "conflicting_evidence"
    | "user_goal_unknown"
    | "new_pattern_candidate"
    | "low_confidence_high_impact"
    | "manual_review";
  hypothesis_ids: string[];
  evidence_ids: string[];
  missing_evidence: string[];
  importance: "low" | "medium" | "high";
  question_budget: number;
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixClarificationQuestionProposal = {
  schema: typeof HELIX_CLARIFICATION_QUESTION_PROPOSAL_SCHEMA;
  proposal_id: string;
  thread_id: string;
  need_id: string;
  question: string;
  options?: string[];
  freeform_allowed: boolean;
  expected_effect:
    | "raise_confidence"
    | "lower_confidence"
    | "set_user_goal"
    | "mark_false_positive"
    | "create_pattern_candidate"
    | "update_next_check";
  surface_policy: "silent_log" | "show_text" | "voice_on_confirm";
  created_at: string;
  assistant_answer: false;
  raw_content_included: false;
};
