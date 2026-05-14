export const HELIX_MINECRAFT_WORLD_SENSE_EVENT_SCHEMA =
  "helix.minecraft_world_sense_event.v1" as const;

export const HELIX_MINECRAFT_WORLD_SENSE_CONTEXT_SCHEMA =
  "helix.minecraft_world_sense_context.v1" as const;

export type HelixMinecraftWorldSenseEventType =
  | "block_edit"
  | "entity_cluster_sample"
  | "containment_context_sample"
  | "item_flow_context"
  | "environment_context_sample"
  | "hazard_context_sample"
  | "inventory_context_sample"
  | "interaction_context_sample"
  | "hostile_context_sample"
  | "fluid_context_sample"
  | "light_context_sample"
  | "path_context_sample";

export type HelixMinecraftWorldSenseBoundingBox = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export type HelixMinecraftWorldSenseEvent = {
  schema: typeof HELIX_MINECRAFT_WORLD_SENSE_EVENT_SCHEMA;
  sense_event_id: string;
  room_id: string;
  world_id: string;
  source_id: string;
  actor_id?: string | null;
  actor_label?: string | null;
  event_type: HelixMinecraftWorldSenseEventType;
  ts: string;
  block_edit?: {
    action: "broken" | "placed";
    block_type: string;
    previous_block_type?: string | null;
    placed_against_block_type?: string | null;
    face?: string | null;
    tool_item?: string | null;
    exact_block_geometry: true;
  } | null;
  entity_cluster?: {
    entity_type: string;
    count: number;
    bounding_box?: HelixMinecraftWorldSenseBoundingBox | null;
    density?: "low" | "medium" | "high" | null;
    density_score?: number | null;
    nearest_player_distance?: number | null;
    exact_entity_geometry?: true;
  } | null;
  containment_context?: {
    target_entity_type?: string | null;
    nearby_blocks: string[];
    likely_barriers: string[];
    possible_escape_routes?: "low" | "medium" | "high" | "unknown" | null;
    pit_depth?: number | null;
    enclosure_width?: number | null;
    enclosure_depth?: number | null;
  } | null;
  item_flow?: {
    item_type: string;
    action: string;
    count?: number | null;
    nearby_container?: boolean | null;
    nearby_hopper?: boolean | null;
  } | null;
  environment_context?: {
    light_level?: number | null;
    biome?: string | null;
    nearby_fluids: string[];
    nearby_hostiles: string[];
    fall_risk?: "low" | "medium" | "high" | "unknown" | null;
    fire_or_lava_risk?: "low" | "medium" | "high" | "unknown" | null;
  } | null;
  path_context?: {
    sample_count?: number | null;
    dominant_direction?: string | null;
    repeated_return?: boolean | null;
  } | null;
  evidence_refs: string[];
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};

export type HelixMinecraftEntitySenseSummary = {
  entity_type: string;
  count: number;
  density?: "low" | "medium" | "high" | null;
  density_score?: number | null;
  bounding_box?: HelixMinecraftWorldSenseBoundingBox | null;
  nearest_player_distance?: number | null;
  containment?: {
    nearby_blocks: string[];
    likely_barriers: string[];
    possible_escape_routes?: "low" | "medium" | "high" | "unknown" | null;
    pit_depth?: number | null;
    enclosure_width?: number | null;
    enclosure_depth?: number | null;
  } | null;
  item_flow?: Array<{
    item_type: string;
    action: string;
    count?: number | null;
    nearby_container?: boolean | null;
    nearby_hopper?: boolean | null;
  }>;
  evidence_refs: string[];
};

export type HelixMinecraftWorldSenseInterpretationHint = {
  hint_id: string;
  hint_type:
    | "dense_entity_cluster"
    | "contained_entity_cluster"
    | "repeated_item_flow"
    | "possible_player_routine"
    | "possible_farm_interpretation"
    | "hazard_context";
  label: string;
  confidence: number;
  confidence_ladder_step: string;
  evidence_refs: string[];
  missing_evidence: string[];
  deterministic: true;
  model_invoked: false;
};

export type HelixMinecraftWorldSenseContext = {
  schema: typeof HELIX_MINECRAFT_WORLD_SENSE_CONTEXT_SCHEMA;
  context_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  from_ts: string;
  to_ts: string;
  entity_clusters: HelixMinecraftEntitySenseSummary[];
  interpretation_hints: HelixMinecraftWorldSenseInterpretationHint[];
  environment_notes: string[];
  missing_evidence: string[];
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};
