export const HELIX_MINECRAFT_PATTERN_HYPOTHESIS_SCHEMA =
  "helix.minecraft_pattern_hypothesis.v1" as const;

export type HelixMinecraftStructureType =
  | "descending_stair"
  | "parallel_trench"
  | "lava_lighting_channel"
  | "strip_mine"
  | "branch_mine"
  | "vertical_shaft"
  | "shelter_shell"
  | "bridge"
  | "escape_tunnel"
  | "resource_vein_following"
  | "unknown";

export type HelixMinecraftPatternHypothesis = {
  schema: typeof HELIX_MINECRAFT_PATTERN_HYPOTHESIS_SCHEMA;
  hypothesis_id: string;
  structure_type: HelixMinecraftStructureType;
  intent_hypothesis: string;
  confidence: number;
  evidence_refs: string[];
  missing_evidence: string[];
};
