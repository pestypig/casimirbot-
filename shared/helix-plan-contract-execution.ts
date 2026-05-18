export const HELIX_PLAN_CONTRACT_EXECUTION_SCHEMA =
  "helix.plan_contract_execution.v1" as const;

export type HelixPlanContractRuntimeStatus =
  | "pending"
  | "dispatched"
  | "waiting_for_client_adoption"
  | "observed"
  | "failed"
  | "cancelled";

export type HelixPlanContractExecution = {
  schema: typeof HELIX_PLAN_CONTRACT_EXECUTION_SCHEMA;
  execution_id: string;
  plan_id: string;
  situation_run_id: string;
  epoch: number;
  action_id: string;
  runtime_status: HelixPlanContractRuntimeStatus;
  dynamic_tool_call_id?: string | null;
  client_action_request_id?: string | null;
  client_adoption_id?: string | null;
  receipt_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
