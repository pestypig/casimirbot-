import type { HelixEnvironmentDomain } from "./helix-environment-state-snapshot";

export const HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA =
  "helix.action_rehearsal_request.v1" as const;

export const HELIX_ACTION_REHEARSAL_RESULT_SCHEMA =
  "helix.action_rehearsal_result.v1" as const;

export type HelixActionRehearsalMode =
  | "rules_only"
  | "state_snapshot_only"
  | "server_probe"
  | "shadow_world"
  | "client_mod_dry_run";

export type HelixActionRehearsalRequest = {
  schema: typeof HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA;
  request_id: string;
  graph_id: string;
  domain: HelixEnvironmentDomain;
  rehearsal_mode: HelixActionRehearsalMode;
  allowed_effects: "none" | "read_only" | "simulation_only";
  require_human_approval_for_execution: true;
  evidence_refs: string[];
  assistant_answer: false;
};

export type HelixActionRehearsalResult = {
  schema: typeof HELIX_ACTION_REHEARSAL_RESULT_SCHEMA;
  result_id: string;
  request_id: string;
  graph_id: string;
  feasibility: "feasible" | "blocked" | "risky" | "partial" | "unknown";
  confidence: number;
  evidence_refs: string[];
  checked_nodes: Array<{
    node_id: string;
    status: "passed" | "failed" | "risky" | "skipped" | "unknown";
    summary: string;
    evidence_refs: string[];
  }>;
  blockers: Array<{
    code: string;
    summary: string;
    severity: "warn" | "critical";
    evidence_refs: string[];
  }>;
  expected_outcome?: string | null;
  pending_probe_requests?: Array<{
    probe_request_id: string;
    probe_type: string;
    source_id: string;
    status: "pending";
    evidence_refs: string[];
  }>;
  recommendation_gate:
    | "safe_to_suggest"
    | "suggest_with_caveat"
    | "do_not_suggest"
    | "needs_user_confirmation";
  tested_in: HelixActionRehearsalMode;
  side_effects_performed: false;
  require_human_approval_for_execution: true;
  model_invoked: boolean;
  deterministic?: boolean;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
