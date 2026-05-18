import type { HelixAskHandoffReasoningBudget } from "./helix-ask-handoff";

export const HELIX_ASK_HANDOFF_CONSUMPTION_SCHEMA =
  "helix.ask_handoff_consumption.v1" as const;

export type HelixAskHandoffConsumptionStatus =
  | "pending"
  | "consumed"
  | "answered"
  | "suppressed"
  | "expired";

export type HelixAskHandoffConsumption = {
  schema: typeof HELIX_ASK_HANDOFF_CONSUMPTION_SCHEMA;
  consumption_id: string;
  handoff_id: string;
  situation_run_id: string;
  epoch: number;
  thread_id: string;
  selected_evidence_refs: string[];
  reasoning_budget: HelixAskHandoffReasoningBudget;
  consumed_by_turn_id?: string | null;
  terminal_turn_required: boolean;
  status: HelixAskHandoffConsumptionStatus;
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
