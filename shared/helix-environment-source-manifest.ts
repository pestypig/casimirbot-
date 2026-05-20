import type { HelixEnvironmentDomain } from "./helix-environment-state-snapshot";
import type { HelixEnvironmentSensorScope } from "./helix-environment-sensor-scope";

export const HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA =
  "helix.environment_source_manifest.v1" as const;

export const HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA =
  "helix.environment_source_heartbeat.v1" as const;

export type HelixEnvironmentSourceModality =
  | "environment_state"
  | "environment_affordance"
  | "procedure_graph"
  | "simulation_stream"
  | "visual_frame"
  | "audio_transcript";

export type HelixEnvironmentSnapshotSection =
  | "actor_state"
  | "inventory_state"
  | "object_state"
  | "local_map"
  | "focus"
  | "affordances"
  | "domain_specific";

export type HelixEnvironmentManifestProbeType =
  | "route_feasibility"
  | "reachability"
  | "line_of_sight"
  | "container_freshness"
  | "crop_state"
  | "hazard_check"
  | "inventory_check"
  | "local_map_summary";

export type HelixEnvironmentForbiddenProbeType =
  | "move_actor"
  | "use_item"
  | "take_item"
  | "place_block"
  | "break_block"
  | "attack_entity"
  | "open_container";

export type HelixEnvironmentSourceManifest = {
  schema: typeof HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA;
  manifest_id: string;
  source_id: string;
  room_id: string;
  domain: HelixEnvironmentDomain;
  domain_adapter: string;
  source_label: string;
  adapter_version: string;
  protocol_version: string;
  modalities: HelixEnvironmentSourceModality[];
  supported_snapshot_sections: HelixEnvironmentSnapshotSection[];
  supported_probe_types: HelixEnvironmentManifestProbeType[];
  forbidden_probe_types: HelixEnvironmentForbiddenProbeType[];
  snapshot_policy: {
    baseline_interval_ms: number;
    burst_interval_ms?: number | null;
    send_only_changed_sections: boolean;
    include_section_hashes: boolean;
    max_payload_bytes: number;
    raw_payload_included: false;
    raw_nbt_included?: false;
  };
  sensor_scope_policy: {
    default_scope: HelixEnvironmentSensorScope;
    can_report_privileged_state: boolean;
    privileged_state_requires_caveat: true;
    player_memory_requires_prior_observation: true;
  };
  execution_policy: {
    may_execute_live_actions: false;
    may_perform_read_only_probes: true;
    require_human_approval_for_execution: true;
  };
  auth_policy: {
    bearer_required: boolean;
    source_signature_required?: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};

export type HelixEnvironmentSourceHeartbeat = {
  schema: typeof HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA;
  heartbeat_id: string;
  source_id: string;
  room_id: string;
  domain: string;
  domain_adapter: string;
  status: "active" | "degraded" | "paused" | "stale" | "error";
  server_tick?: number | null;
  latest_snapshot_id?: string | null;
  latest_snapshot_ts?: string | null;
  active_players?: Array<{
    actor_id: string;
    actor_label: string;
    dimension?: string | null;
  }>;
  pending_probe_count?: number;
  backpressure?: {
    snapshot_upload_pending: boolean;
    skipped_snapshot_count: number;
    avg_payload_bytes?: number | null;
  };
  runtime_status?: {
    upload_queue?: string | null;
    backoff_state?: string | null;
    auth_failure_count?: number | null;
    oversized_payload_count?: number | null;
    contract_failure_count?: number | null;
    last_error?: string | null;
  };
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
