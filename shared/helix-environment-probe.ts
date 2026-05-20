import type { HelixEnvironmentSensorScope } from "./helix-environment-sensor-scope";

export const HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA =
  "helix.environment_probe_request.v1" as const;

export const HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA =
  "helix.environment_probe_result.v1" as const;

export type HelixEnvironmentProbeType =
  | "route_feasibility"
  | "reachability"
  | "line_of_sight"
  | "container_freshness"
  | "crop_state"
  | "hazard_check"
  | "inventory_check"
  | "local_map_summary";

export type HelixEnvironmentProbeRequest = {
  schema: typeof HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA;
  probe_request_id: string;
  source_id: string;
  room_id: string;
  domain: string;
  domain_adapter?: string | null;
  probe_type: HelixEnvironmentProbeType;
  reason: "rehearsal" | "manual_debug" | "live_answer_validation" | "contract_test";
  objective?: string | null;
  target?: {
    target_ref?: string | null;
    target_type?: string | null;
    position?: { x: number; y: number; z?: number | null } | null;
    actor_id?: string | null;
  };
  constraints: {
    read_only: true;
    side_effects_allowed: false;
    max_radius?: number | null;
    max_duration_ms?: number | null;
    ttl_ms: number;
  };
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
  expires_at: string;
};

export type HelixEnvironmentProbeResult = {
  schema: typeof HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA;
  probe_result_id: string;
  probe_request_id: string;
  source_id: string;
  room_id: string;
  domain: string;
  probe_type: HelixEnvironmentProbeType;
  status: "succeeded" | "failed" | "partial" | "expired" | "unsupported" | "blocked_by_policy";
  result_summary: string;
  result: {
    feasible?: boolean | null;
    reachable?: boolean | null;
    line_of_sight?: boolean | null;
    path_cost_blocks?: number | null;
    distance_blocks?: number | null;
    contents_fresh?: boolean | null;
    crop_mature?: boolean | null;
    hazard_present?: boolean | null;
    confidence?: number | null;
    details?: Record<string, unknown>;
  };
  sensor_scope: HelixEnvironmentSensorScope;
  requires_caveat: boolean;
  side_effects_performed: false;
  commands_executed: [];
  world_mutation_performed: false;
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
