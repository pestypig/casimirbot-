import type { HelixEnvironmentDomain } from "./helix-environment-state-snapshot";

export const HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA =
  "helix.environment_possibility_graph.v1" as const;

export type HelixPossibilityNodeKind =
  | "start"
  | "condition"
  | "sensor_check"
  | "resource_check"
  | "navigation"
  | "interaction"
  | "inventory_action"
  | "wait"
  | "verify"
  | "fallback"
  | "stop";

export type HelixPossibilityGraph = {
  schema: typeof HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA;
  graph_id: string;
  domain: HelixEnvironmentDomain;
  thread_id: string;
  environment_id?: string | null;
  room_id?: string | null;
  source_snapshot_refs: string[];
  evidence_refs: string[];
  objective: string;
  graph_status: "draft" | "rehearsal_ready" | "rehearsed" | "rejected" | "stale";
  nodes: Array<{
    node_id: string;
    kind: HelixPossibilityNodeKind;
    label: string;
    description?: string;
    preconditions?: string[];
    expected_effects?: string[];
    required_capabilities?: string[];
    risk_tags?: string[];
    domain_action?: {
      adapter: string;
      action_type: string;
      args: Record<string, unknown>;
    } | null;
    evidence_refs: string[];
  }>;
  edges: Array<{
    edge_id: string;
    from_node_id: string;
    to_node_id: string;
    condition?: string | null;
  }>;
  generated_by: "deterministic_template" | "model_planner" | "hybrid";
  model_invoked: boolean;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
