export const HELIX_REASONING_SUBGOAL_LEDGER_SCHEMA = "helix.reasoning_subgoal_ledger.v1" as const;

export type HelixReasoningSubgoalLedger = {
  schema: typeof HELIX_REASONING_SUBGOAL_LEDGER_SCHEMA;
  thread_id: string;
  active_subgoals: Array<{
    subgoal_id: string;
    label: string;
    status: "active" | "progress" | "blocked" | "completed" | "stale";
    evidence_ids: string[];
    next_best_tool?: string | null;
    updated_at: string;
  }>;
  completed_subgoals: string[];
  stale_subgoals: string[];
  updated_at: string;
};
