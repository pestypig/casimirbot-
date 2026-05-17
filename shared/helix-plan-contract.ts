export const HELIX_PLAN_CONTRACT_SCHEMA = "helix.plan_contract.v1" as const;

export type HelixPlanContract = {
  schema: typeof HELIX_PLAN_CONTRACT_SCHEMA;
  plan_id: string;
  thread_id: string;
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
  evidence_refs: string[];
  client_adoption_required: boolean;
  terminal_expectation: {
    type:
      | "tool_observation_required"
      | "client_adoption_observation_required"
      | "workspace_action_receipt_required";
    artifact: string;
  };
  can_execute_itself: false;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
