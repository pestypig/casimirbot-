import crypto from "node:crypto";
import {
  HELIX_PLAN_CONTRACT_SCHEMA,
  type HelixPlanContract,
} from "@shared/helix-plan-contract";

const contractsByThread = new Map<string, HelixPlanContract[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanStrings = (values: unknown): string[] =>
  Array.isArray(values) ? Array.from(new Set(values.map(cleanString).filter(Boolean) as string[])) : [];

export function createPlanContract(input: Record<string, unknown>): HelixPlanContract {
  const threadId = cleanString(input.thread_id ?? input.threadId);
  const panelId = cleanString(input.panel_id ?? input.panelId);
  const actionId = cleanString(input.action_id ?? input.actionId);
  if (!threadId) throw new Error("plan_contract_requires_thread_id");
  if (!panelId || !actionId) throw new Error("plan_contract_requires_action");
  if (input.execute === true || input.can_execute_itself === true) {
    throw new Error("plan_contract_cannot_execute_itself");
  }
  const terminalExpectation = input.terminal_expectation &&
    typeof input.terminal_expectation === "object" &&
    !Array.isArray(input.terminal_expectation)
    ? input.terminal_expectation as Record<string, unknown>
    : {};
  const type = terminalExpectation.type === "client_adoption_observation_required" ||
    terminalExpectation.type === "workspace_action_receipt_required"
    ? terminalExpectation.type
    : "tool_observation_required";
  const now = cleanString(input.created_at ?? input.createdAt) ?? new Date().toISOString();
  const contract: HelixPlanContract = {
    schema: HELIX_PLAN_CONTRACT_SCHEMA,
    plan_id: cleanString(input.plan_id ?? input.planId) ?? `plan_contract:${hashShort([threadId, panelId, actionId, now])}`,
    thread_id: threadId,
    panel_id: panelId,
    action_id: actionId,
    args: input.args && typeof input.args === "object" && !Array.isArray(input.args)
      ? input.args as Record<string, unknown>
      : {},
    evidence_refs: cleanStrings(input.evidence_refs ?? input.evidenceRefs),
    client_adoption_required: input.client_adoption_required === true,
    terminal_expectation: {
      type,
      artifact: cleanString(terminalExpectation.artifact) ?? (type === "client_adoption_observation_required" ? "client_capability_adoption" : "tool_observation"),
    },
    can_execute_itself: false,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
  if (contract.client_adoption_required && contract.terminal_expectation.type !== "client_adoption_observation_required") {
    throw new Error("plan_contract_client_adoption_requires_client_terminal_expectation");
  }
  contractsByThread.set(threadId, [...(contractsByThread.get(threadId) ?? []), contract].slice(-200));
  return contract;
}

export function listPlanContracts(input: { threadId: string; limit?: number }): HelixPlanContract[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80))) : 80;
  return [...(contractsByThread.get(input.threadId) ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function resetPlanContractsForTest(): void {
  contractsByThread.clear();
}
