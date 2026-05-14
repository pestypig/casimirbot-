export const HELIX_MINECRAFT_BLOCK_EDIT_EVENT_SCHEMA =
  "helix.minecraft_block_edit_event.v1" as const;

export type MinecraftBridgeBlockEditType =
  | "block_broken"
  | "block_placed"
  | "bucket_empty"
  | "bucket_fill";

export type MinecraftBridgeHand = "main" | "off";

export type MinecraftBridgeBlockFace =
  | "north"
  | "south"
  | "east"
  | "west"
  | "up"
  | "down";

export type MinecraftNearbyFluid = {
  type: "lava" | "water";
  x: number;
  y: number;
  z: number;
};

export type MinecraftBlockEditEvent = {
  schema: typeof HELIX_MINECRAFT_BLOCK_EDIT_EVENT_SCHEMA;
  event_id: string;
  event_type: MinecraftBridgeBlockEditType;
  room_id: string;
  source_id: string;
  world_id: string;
  actor_id: string;
  actor_label: string;
  dimension: string;
  block_x: number;
  block_y: number;
  block_z: number;
  block_type?: string | null;
  previous_block_type?: string | null;
  placed_block_type?: string | null;
  tool_item?: string | null;
  hand?: MinecraftBridgeHand | null;
  face?: MinecraftBridgeBlockFace | null;
  player_yaw?: number | null;
  player_pitch?: number | null;
  light_level?: number | null;
  nearby_fluids?: MinecraftNearbyFluid[];
  evidence_refs: string[];
  ts: string;
  raw_logs_included: false;
};

export type MinecraftBridgeEventConfig = {
  emit_block_edits: boolean;
  emit_bucket_events: boolean;
  emit_light_samples: boolean;
  emit_hostile_precursors: boolean;
  max_block_events_per_flush: number;
  location_sample_ticks: number;
};
