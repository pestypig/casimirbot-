export const HELIX_CAPABILITY_RESULT_SCHEMA = "helix.capability_result.v1" as const;

export type HelixCapabilityResultStatus = "succeeded" | "failed" | "partial" | "not_run";

export type HelixCapabilityResult = {
  schema: typeof HELIX_CAPABILITY_RESULT_SCHEMA;
  turn_id: string;
  capability_plan_id: string;

  status: HelixCapabilityResultStatus;

  receipt_refs: string[];
  evidence_refs: string[];

  selected_for_answer: boolean;
  reentered_solver: boolean;

  failure_reason?: string;

  assistant_answer: false;
  raw_content_included: false;
};
