export const HELIX_CAPABILITY_LIFECYCLE_LEDGER_SCHEMA = "helix.capability_lifecycle_ledger.v1" as const;

export type HelixCapabilityLifecycleStageName =
  | "planned"
  | "admitted"
  | "dispatched"
  | "adapter_acknowledged"
  | "result_observed"
  | "result_validated"
  | "reentered_solver"
  | "terminal_considered";

export type HelixCapabilityLifecycleStageStatus = "succeeded" | "failed" | "skipped";

export type HelixCapabilityLifecycleFailureCode =
  | "capability_dispatched_without_admission"
  | "capability_admitted_not_dispatched"
  | "capability_result_missing"
  | "capability_result_unvalidated"
  | "capability_result_not_reentered"
  | "capability_receipt_terminal_without_goal"
  | "mutating_capability_without_operator_command";

export type HelixCapabilityLifecycleStage = {
  stage: HelixCapabilityLifecycleStageName;
  status: HelixCapabilityLifecycleStageStatus;
  refs: string[];
  reason: string;
};

export type HelixCapabilityLifecycleLedger = {
  schema: typeof HELIX_CAPABILITY_LIFECYCLE_LEDGER_SCHEMA;
  turn_id: string;
  capability_plan_id: string | null;
  capability_result_id: string | null;
  reentry_authority?: "runtime_event_log" | "compatibility_projection";
  runtime_lifecycle_verified?: boolean;
  matched_reentry_refs?: string[];
  stages: HelixCapabilityLifecycleStage[];
  failure_codes: HelixCapabilityLifecycleFailureCode[];
  ok: boolean;
  assistant_answer: false;
  raw_content_included: false;
};
