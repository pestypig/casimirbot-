export const HELIX_ASK_HANDOFF_SCHEMA = "helix.ask_handoff.v1" as const;

export type HelixAskHandoffReasoningBudget = "cheap" | "normal" | "deep";

export type HelixAskHandoffType =
  | "helix_ask_reasoning"
  | "workstation_action_request";

export type HelixAskHandoff = {
  schema: typeof HELIX_ASK_HANDOFF_SCHEMA;
  handoff_id: string;
  thread_id: string;
  room_id?: string | null;
  handoff_type: HelixAskHandoffType;
  question: string;
  objective: string;
  selected_evidence_refs: string[];
  goal_refs: string[];
  interpretation_refs: string[];
  allowed_inputs: {
    observation_refs: string[];
    interpretation_refs: string[];
    goal_refs: string[];
  };
  forbidden_actions: string[];
  expected_output: string;
  reasoning_budget: HelixAskHandoffReasoningBudget;
  raw_context_approved: boolean;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
