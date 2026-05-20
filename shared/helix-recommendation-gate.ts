export const HELIX_RECOMMENDATION_GATE_SCHEMA =
  "helix.recommendation_gate.v1" as const;

export type HelixRecommendationGateStatus =
  | "not_considered"
  | "possible_only"
  | "awaiting_rehearsal"
  | "safe_to_suggest"
  | "suggest_with_caveat"
  | "blocked"
  | "needs_user_confirmation"
  | "stale";

export type HelixRecommendationGate = {
  schema: typeof HELIX_RECOMMENDATION_GATE_SCHEMA;
  gate_id: string;
  thread_id: string;
  environment_id?: string | null;
  domain: string;
  objective: string;
  possibility_graph_id?: string | null;
  rehearsal_result_id?: string | null;
  status: HelixRecommendationGateStatus;
  recommendation_text?: string | null;
  caveat_text?: string | null;
  reason: string;
  blockers: Array<{
    code: string;
    summary: string;
    severity: "info" | "warn" | "critical";
    evidence_refs: string[];
  }>;
  evidence_refs: string[];
  source_snapshot_refs: string[];
  side_effects_performed: false;
  require_human_approval_for_execution: true;
  deterministic: boolean;
  model_invoked: boolean;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};

