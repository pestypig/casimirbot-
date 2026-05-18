import crypto from "node:crypto";
import {
  HELIX_ASK_HANDOFF_CONSUMPTION_SCHEMA,
  type HelixAskHandoffConsumption,
  type HelixAskHandoffConsumptionStatus,
} from "@shared/helix-ask-handoff-consumption";
import type { HelixAskHandoffReasoningBudget } from "@shared/helix-ask-handoff";

const consumptionsByThread = new Map<string, HelixAskHandoffConsumption[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function recordAskHandoffConsumption(input: {
  handoff_id: string;
  situation_run_id: string;
  epoch: number;
  thread_id: string;
  selected_evidence_refs: string[];
  reasoning_budget: HelixAskHandoffReasoningBudget;
  consumed_by_turn_id?: string | null;
  terminal_turn_required: boolean;
  status: HelixAskHandoffConsumptionStatus;
  created_at?: string;
}): HelixAskHandoffConsumption {
  const createdAt = input.created_at ?? new Date().toISOString();
  const consumption: HelixAskHandoffConsumption = {
    schema: HELIX_ASK_HANDOFF_CONSUMPTION_SCHEMA,
    consumption_id: `ask_handoff_consumption:${hashShort([input.handoff_id, input.status, createdAt])}`,
    handoff_id: input.handoff_id,
    situation_run_id: input.situation_run_id,
    epoch: input.epoch,
    thread_id: input.thread_id,
    selected_evidence_refs: Array.from(new Set(input.selected_evidence_refs)).slice(-80),
    reasoning_budget: input.reasoning_budget,
    consumed_by_turn_id: input.consumed_by_turn_id ?? null,
    terminal_turn_required: input.terminal_turn_required,
    status: input.status,
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  const existing = consumptionsByThread.get(consumption.thread_id) ?? [];
  consumptionsByThread.set(consumption.thread_id, [
    ...existing.filter((entry: HelixAskHandoffConsumption) => entry.consumption_id !== consumption.consumption_id),
    consumption,
  ].slice(-500));
  return consumption;
}

export function listAskHandoffConsumptions(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixAskHandoffConsumption[] {
  const limit = Math.max(0, Math.min(500, Math.trunc(input.limit ?? 100)));
  return (Array.from(consumptionsByThread.values()).flat() as HelixAskHandoffConsumption[])
    .filter((entry: HelixAskHandoffConsumption) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixAskHandoffConsumption) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .sort((a: HelixAskHandoffConsumption, b: HelixAskHandoffConsumption) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function getLatestAskHandoffConsumption(handoffId: string): HelixAskHandoffConsumption | null {
  return (Array.from(consumptionsByThread.values()).flat() as HelixAskHandoffConsumption[])
    .filter((entry: HelixAskHandoffConsumption) => entry.handoff_id === handoffId)
    .sort((a: HelixAskHandoffConsumption, b: HelixAskHandoffConsumption) => a.created_at.localeCompare(b.created_at))
    .at(-1) ?? null;
}

export function resetAskHandoffConsumptionsForTest(): void {
  consumptionsByThread.clear();
}
