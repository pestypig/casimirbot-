import type { HelixEnvironmentSensorScope } from "./helix-environment-sensor-scope";

export const HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA =
  "helix.environment_state_snapshot.v1" as const;

export type HelixEnvironmentDomain =
  | "minecraft"
  | "game"
  | "virtual_world"
  | "browser_app"
  | "desktop_app"
  | "robotics"
  | "real_world"
  | "custom";

export type EnvironmentPosition = { x: number; y: number; z?: number | null };

export type EnvironmentItemSummary = {
  item_ref?: string | null;
  item_type: string;
  count: number;
  slot?: string | number | null;
  display_name?: string | null;
  durability?: { remaining: number; max: number } | null;
  tags?: string[];
  sensor_scope?: HelixEnvironmentSensorScope;
};

export type EnvironmentObjectSummary = {
  object_ref: string;
  object_type: string;
  position?: EnvironmentPosition;
  velocity?: EnvironmentPosition | null;
  facing?: string | null;
  yaw?: number | null;
  pitch?: number | null;
  distance?: number | null;
  relative_direction?: string | null;
  bounding_box?: {
    min: EnvironmentPosition;
    max: EnvironmentPosition;
  } | null;
  classification?: string[];
  tags?: string[];
  state?: Record<string, unknown>;
  living?: Record<string, unknown> | null;
  mob_ai?: Record<string, unknown> | null;
  threat?: Record<string, unknown> | null;
  evidence_trust?: "server_observation" | string;
  instruction_authority?: "none";
  ask_context_policy?: "evidence_only" | string;
  raw_nbt_included?: false;
  sensor_scope?: HelixEnvironmentSensorScope;
};

export type EnvironmentContainerSummary = {
  container_ref: string;
  container_type: string;
  position?: EnvironmentPosition;
  contents_known: boolean;
  contents_summary?: EnvironmentItemSummary[];
  contents_hash?: string | null;
  last_verified_at?: string | null;
  sensor_scope?: HelixEnvironmentSensorScope;
  requires_caveat?: boolean;
};

export type EnvironmentResourceSummary = {
  resource_ref: string;
  resource_type: string;
  position?: EnvironmentPosition;
  state?: "available" | "growing" | "depleted" | "unknown";
  amount?: number | null;
  tags?: string[];
  sensor_scope?: HelixEnvironmentSensorScope;
};

export type EnvironmentHazardSummary = {
  hazard_ref: string;
  hazard_type: string;
  severity: "info" | "watch" | "warning" | "critical";
  position?: EnvironmentPosition;
  evidence_refs: string[];
  sensor_scope?: HelixEnvironmentSensorScope;
};

export type EnvironmentCellSummary = {
  cell_ref: string;
  cell_type: string;
  position?: EnvironmentPosition;
  tags?: string[];
  state?: Record<string, unknown>;
  sensor_scope?: HelixEnvironmentSensorScope;
};

export type HelixEnvironmentStateSnapshot = {
  schema: typeof HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA;
  snapshot_id: string;
  domain: HelixEnvironmentDomain;
  domain_adapter: string;
  room_id: string;
  world_id?: string | null;
  source_id: string;
  actor_id?: string | null;
  actor_label?: string | null;
  ts: string;
  source_tick?: number | null;
  coordinate_frame?: {
    kind: "world_xyz" | "screen_xy" | "robot_map" | "gps" | "custom";
    dimension?: string | null;
    units?: "blocks" | "pixels" | "meters" | "custom";
  };
  actor_state?: {
    sensor_scope?: HelixEnvironmentSensorScope;
    pose?: {
      position?: EnvironmentPosition;
      eye?: EnvironmentPosition;
      yaw?: number | null;
      pitch?: number | null;
      facing?: string | null;
    };
    health?: number | null;
    food_level?: number | null;
    saturation?: number | null;
    mode?: string | null;
    status_flags?: string[];
  };
  inventory_state?: {
    sensor_scope?: HelixEnvironmentSensorScope;
    selected_item?: EnvironmentItemSummary | null;
    carried_items?: EnvironmentItemSummary[];
    equipped_items?: EnvironmentItemSummary[];
    inventory_hash?: string | null;
    changed_since_last_snapshot?: boolean;
  };
  object_state?: {
    sensor_scope?: HelixEnvironmentSensorScope;
    nearby_entities?: EnvironmentObjectSummary[];
    nearby_containers?: EnvironmentContainerSummary[];
    resources?: EnvironmentResourceSummary[];
    hazards?: EnvironmentHazardSummary[];
  };
  local_map?: {
    sensor_scope?: HelixEnvironmentSensorScope;
    radius?: number | null;
    salient_cells?: EnvironmentCellSummary[];
    map_hash?: string | null;
    changed_since_last_snapshot?: boolean;
  };
  chunk_snapshot_summary?: {
    sensor_scope?: HelixEnvironmentSensorScope;
    sampled_radius_chunks?: number | null;
    loaded_chunks_sampled?: number | null;
    surface_cells?: EnvironmentCellSummary[];
    map_hash?: string | null;
    changed_since_last_snapshot?: boolean;
    evidence_trust?: "server_observation" | string;
    instruction_authority?: "none";
    ask_context_policy?: "evidence_only" | string;
    raw_chunk_included?: false;
  };
  focus?: {
    sensor_scope?: HelixEnvironmentSensorScope;
    target_kind: "object" | "entity" | "block" | "ui" | "empty" | "unknown";
    target_ref?: string | null;
    target_type?: string | null;
    distance?: number | null;
    line_of_sight?: boolean | null;
    reachable?: boolean | null;
  };
  route_state?: {
    active_objective_id?: string | null;
    latest_rehearsal_id?: string | null;
    latest_drift_event_id?: string | null;
    route_status?: string | null;
    policy_surface_status?: string | null;
    current_stage_label?: string | null;
    updated_at?: string | null;
    evidence_refs?: string[];
    instruction_authority?: "none";
    ask_context_policy?: "evidence_only" | string;
    raw_content_included?: false;
  };
  section_hashes: Record<string, string>;
  changed_sections: string[];
  domain_specific?: {
    minecraft?: {
      raw_nbt_included: false;
      nbt_component_keys_seen?: string[];
      paper_api_fields_seen?: string[];
      block_data_fields_seen?: string[];
    };
    [key: string]: unknown;
  };
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  assistant_answer: false;
  raw_payload_included: false;
  context_policy: "compact_context_pack_only";
};
