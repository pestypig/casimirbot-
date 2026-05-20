import type { EvidenceSafety } from "./helix-minecraft-evidence.ts";
import { toolEvidenceSafety } from "./helix-minecraft-evidence.ts";

export const HELIX_MINECRAFT_VISUAL_OBSERVATION_SCHEMA =
  "helix.minecraft_visual_observation.v1" as const;

export type MinecraftVisualFact =
  | { kind: "dimension_hint"; value: "minecraft:the_end" | string; confidence: number }
  | { kind: "facing_hint"; direction: string; confidence: number }
  | { kind: "void_nearby"; confidence: number }
  | { kind: "bridge_visible"; direction?: string | null; confidence: number }
  | { kind: "hotbar_item_hint"; item_id: string; confidence: number }
  | { kind: "coordinate_hint"; x: number; y?: number | null; z: number; confidence: number };

export type MinecraftVisualObservation = EvidenceSafety & {
  schema: typeof HELIX_MINECRAFT_VISUAL_OBSERVATION_SCHEMA;
  observation_id: string;
  room_id: string;
  thread_id: string;
  world_id?: string | null;
  source_id: string;
  evidence_layer: "visual_capture";
  evidence_trust: "visual_capture";
  facts: MinecraftVisualFact[];
  evidence_refs: string[];
  raw_image_included: false;
  raw_caption_included: false;
  model_invoked_for_observation: boolean;
  model_instruction_authority: "none";
  ts: string;
};

export function createMinecraftVisualObservation(
  input: Omit<
    MinecraftVisualObservation,
    | "schema"
    | keyof EvidenceSafety
    | "evidence_layer"
    | "evidence_trust"
    | "raw_image_included"
    | "raw_caption_included"
    | "model_instruction_authority"
  >,
): MinecraftVisualObservation {
  return {
    schema: HELIX_MINECRAFT_VISUAL_OBSERVATION_SCHEMA,
    ...toolEvidenceSafety(),
    ...input,
    evidence_layer: "visual_capture",
    evidence_trust: "visual_capture",
    raw_image_included: false,
    raw_caption_included: false,
    model_instruction_authority: "none",
  };
}
