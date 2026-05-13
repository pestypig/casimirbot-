export const HELIX_CONTEXT_ECONOMY_DECISION_SCHEMA = "helix.context_economy_decision.v1" as const;

export type HelixContextEconomyDecision = {
  schema: typeof HELIX_CONTEXT_ECONOMY_DECISION_SCHEMA;
  decision_id: string;
  thread_id: string;
  source_ref: string;
  strategy: "inline_compact" | "use_reusable_ref" | "debug_only";
  reusable_context_ref?: string | null;
  raw_content_included: false;
  reason: string;
  created_at: string;
};
