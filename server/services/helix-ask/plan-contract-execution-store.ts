import crypto from "node:crypto";
import {
  HELIX_PLAN_CONTRACT_EXECUTION_SCHEMA,
  type HelixPlanContractExecution,
  type HelixPlanContractRuntimeStatus,
} from "@shared/helix-plan-contract-execution";

const executionsByRun = new Map<string, HelixPlanContractExecution[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function recordPlanContractExecution(input: {
  plan_id: string;
  situation_run_id: string;
  epoch: number;
  action_id: string;
  runtime_status: HelixPlanContractRuntimeStatus;
  dynamic_tool_call_id?: string | null;
  client_action_request_id?: string | null;
  client_adoption_id?: string | null;
  receipt_refs?: string[];
  created_at?: string;
}): HelixPlanContractExecution {
  const createdAt = input.created_at ?? new Date().toISOString();
  const execution: HelixPlanContractExecution = {
    schema: HELIX_PLAN_CONTRACT_EXECUTION_SCHEMA,
    execution_id: `plan_contract_execution:${hashShort([input.plan_id, input.runtime_status, createdAt])}`,
    plan_id: input.plan_id,
    situation_run_id: input.situation_run_id,
    epoch: input.epoch,
    action_id: input.action_id,
    runtime_status: input.runtime_status,
    dynamic_tool_call_id: input.dynamic_tool_call_id ?? null,
    client_action_request_id: input.client_action_request_id ?? null,
    client_adoption_id: input.client_adoption_id ?? null,
    receipt_refs: Array.from(new Set(input.receipt_refs ?? [])).slice(-80),
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  const existing = executionsByRun.get(execution.situation_run_id) ?? [];
  executionsByRun.set(execution.situation_run_id, [
    ...existing.filter((entry: HelixPlanContractExecution) => entry.execution_id !== execution.execution_id),
    execution,
  ].slice(-500));
  return execution;
}

export function listPlanContractExecutions(input: {
  situationRunId?: string | null;
  planId?: string | null;
  limit?: number;
} = {}): HelixPlanContractExecution[] {
  const limit = Math.max(0, Math.min(500, Math.trunc(input.limit ?? 100)));
  return (Array.from(executionsByRun.values()).flat() as HelixPlanContractExecution[])
    .filter((entry: HelixPlanContractExecution) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixPlanContractExecution) => !input.planId || entry.plan_id === input.planId)
    .sort((a: HelixPlanContractExecution, b: HelixPlanContractExecution) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetPlanContractExecutionsForTest(): void {
  executionsByRun.clear();
}
