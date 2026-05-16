import type { HelixLiveRuntimeRepairActionId } from "./helix-live-runtime-repair-plan";

export const HELIX_LIVE_RUNTIME_REPAIR_RECEIPT_SCHEMA = "helix.live_runtime_repair_receipt.v1" as const;

export type HelixLiveRuntimeRepairReceipt = {
  schema: typeof HELIX_LIVE_RUNTIME_REPAIR_RECEIPT_SCHEMA;
  repair_receipt_id: string;
  repair_plan_id: string;
  thread_id: string;
  selected_action_id?: HelixLiveRuntimeRepairActionId | null;
  ok: boolean;
  summary: string;
  tool_observation_refs: string[];
  acceptance_before?: unknown | null;
  acceptance_after?: unknown | null;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};
