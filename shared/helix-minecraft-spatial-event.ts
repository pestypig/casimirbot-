export const HELIX_MINECRAFT_SPATIAL_EVENT_SCHEMA =
  "helix.minecraft_spatial_event.v1" as const;

export type HelixMinecraftSpatialEventType =
  | "block_broken"
  | "block_placed"
  | "item_used"
  | "item_dropped"
  | "bucket_empty"
  | "bucket_fill"
  | "fluid_changed"
  | "player_location_sample"
  | "surface_transition"
  | "light_level_sample"
  | "hostile_nearby"
  | "creeper_fuse_started"
  | "explosion_imminent";

export type HelixMinecraftSpatialEvent = {
  schema: typeof HELIX_MINECRAFT_SPATIAL_EVENT_SCHEMA;
  event_id: string;
  room_id: string;
  world_id: string;
  source_id: string;
  actor_id?: string | null;
  actor_label?: string | null;
  event_type: HelixMinecraftSpatialEventType;
  dimension: string;
  location: { x: number; y: number; z: number };
  block?: {
    before?: string | null;
    after?: string | null;
    target?: string | null;
    face?: "north" | "south" | "east" | "west" | "up" | "down" | null;
  } | null;
  player_pose?: {
    yaw?: number | null;
    pitch?: number | null;
    facing?: string | null;
  } | null;
  environment?: {
    light_level?: number | null;
    biome?: string | null;
    nearby_fluids?: Array<{ type: "lava" | "water"; distance: number }>;
    nearby_hostiles?: Array<{ type: string; distance: number }>;
  } | null;
  inventory_delta?: Record<string, unknown> | null;
  evidence_refs: string[];
  ts: string;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};
