import type { HelixMinecraftPatternHypothesis } from "./helix-minecraft-pattern-hypothesis";

export const HELIX_MINECRAFT_SPATIAL_EPISODE_SCHEMA =
  "helix.minecraft_spatial_episode.v1" as const;

export type HelixMinecraftSpatialEpisode = {
  schema: typeof HELIX_MINECRAFT_SPATIAL_EPISODE_SCHEMA;
  episode_id: string;
  room_id: string;
  world_id: string;
  actor_label?: string | null;
  from_ts: string;
  to_ts: string;
  bounding_box: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  edit_count: number;
  movement_count: number;
  dominant_direction?: string | null;
  vertical_change?: number | null;
  structure_hypotheses: HelixMinecraftPatternHypothesis[];
  risk_notes: string[];
  known_unknowns: string[];
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
};
