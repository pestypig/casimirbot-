import type { HelixPlanContract } from "@shared/helix-plan-contract";

export type HelixPlanContractRuntimeRequest = {
  schema: "helix.plan_contract_runtime_request.v1";
  plan_id: string;
  thread_id: string;
  tool_ids: string[];
  args: Record<string, unknown>;
  terminal_expectation: HelixPlanContract["terminal_expectation"];
  client_adoption_required: boolean;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

export function buildPlanContractRuntimeRequest(input: {
  contract: HelixPlanContract;
  now?: string;
}): HelixPlanContractRuntimeRequest {
  return {
    schema: "helix.plan_contract_runtime_request.v1",
    plan_id: input.contract.plan_id,
    thread_id: input.contract.thread_id,
    tool_ids: [input.contract.action_id],
    args: input.contract.args,
    terminal_expectation: input.contract.terminal_expectation,
    client_adoption_required: input.contract.client_adoption_required,
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.now ?? new Date().toISOString(),
  };
}

