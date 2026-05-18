import type { HelixPlanContract } from "@shared/helix-plan-contract";
import { recordPlanContractExecution } from "./plan-contract-execution-store";

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
  const now = input.now ?? new Date().toISOString();
  const situationRunId = typeof input.contract.args.situation_run_id === "string"
    ? input.contract.args.situation_run_id
    : "unknown_situation_run";
  const epoch = typeof input.contract.args.epoch === "number"
    ? input.contract.args.epoch
    : Number(input.contract.args.epoch ?? 0);
  recordPlanContractExecution({
    plan_id: input.contract.plan_id,
    situation_run_id: situationRunId,
    epoch: Number.isFinite(epoch) ? epoch : 0,
    action_id: input.contract.action_id,
    runtime_status: input.contract.client_adoption_required ? "waiting_for_client_adoption" : "dispatched",
    dynamic_tool_call_id: `dynamic_tool_call:${input.contract.plan_id}`,
    receipt_refs: input.contract.evidence_refs,
    created_at: now,
  });
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
    created_at: now,
  };
}
