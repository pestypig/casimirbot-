import { z } from "zod";

export const REALTIME_TEXTURE_PACK_HYBRID_SCENE_CAPSULE_SCHEMA =
  "helix.realtime_texture_pack_hybrid_scene_capsule.v1" as const;
export const REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID =
  "realtime_texture_pack.material_instance_variation.v1" as const;

export const REALTIME_TEXTURE_PACK_MATERIAL_FAMILIES = [
  "terrain",
  "foliage",
  "wood",
  "masonry",
  "metal",
  "fluid",
  "emissive",
  "organic",
] as const;
export const REALTIME_TEXTURE_PACK_LANDMARK_CLASSES = [
  "open_sky",
  "horizon",
  "cave_opening",
  "water_edge",
  "lava_edge",
  "structure",
  "vegetation_cluster",
  "path",
] as const;
export const REALTIME_TEXTURE_PACK_DEPTH_PROFILES = [
  "enclosed",
  "near_field",
  "layered",
  "long_view",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_CAMERA_MOTION_CLASSES = [
  "still",
  "turning",
  "translating",
  "rapid",
  "unknown",
] as const;

const identifier = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/);
const timestamp = z.string().datetime({ offset: true });
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const realtimeTexturePackHybridSceneCapsuleSchema = z.object({
  schema: z.literal(REALTIME_TEXTURE_PACK_HYBRID_SCENE_CAPSULE_SCHEMA),
  scene_capsule_id: identifier,
  scene_capsule_revision: z.number().int().positive(),
  scene_capsule_hash: sha256,
  source_binding_id: identifier,
  source_binding_revision: z.number().int().positive(),
  capture_session_id: identifier,
  source_frame_id: identifier,
  cue_packet_id: identifier,
  environment_id: identifier,
  world_id: identifier,
  producer_epoch_ref: identifier,
  subject_ref: identifier.nullable(),
  observation_revision: z.number().int().nonnegative(),
  dominant_material_families: z.array(z.enum(REALTIME_TEXTURE_PACK_MATERIAL_FAMILIES)).max(8),
  landmark_classes: z.array(z.enum(REALTIME_TEXTURE_PACK_LANDMARK_CLASSES)).max(8),
  depth_profile: z.enum(REALTIME_TEXTURE_PACK_DEPTH_PROFILES),
  camera_motion_class: z.enum(REALTIME_TEXTURE_PACK_CAMERA_MOTION_CLASSES),
  observed_at: timestamp,
  expires_at: timestamp,
  content_role: z.literal("realtime_texture_pack_hybrid_scene_capsule_not_assistant_answer"),
  presentation_only: z.literal(true),
  environment_action_authority: z.literal(false),
  world_mutation_authority: z.literal(false),
  authoritative: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expires_at) <= Date.parse(value.observed_at)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["expires_at"], message: "Expiry must follow observation." });
  }
  for (const [key, values] of [["dominant_material_families", value.dominant_material_families], ["landmark_classes", value.landmark_classes]] as const) {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: "Values must be unique." });
    }
  }
});

export type RealtimeTexturePackHybridSceneCapsuleV1 = z.infer<
  typeof realtimeTexturePackHybridSceneCapsuleSchema
>;

type CapsuleInput = Omit<RealtimeTexturePackHybridSceneCapsuleV1,
  "schema" | "content_role" | "presentation_only" |
  "environment_action_authority" | "world_mutation_authority" |
  "authoritative" | "assistant_answer" | "terminal_eligible" |
  "raw_content_included">;

export const buildRealtimeTexturePackHybridSceneCapsule = (
  input: CapsuleInput,
): RealtimeTexturePackHybridSceneCapsuleV1 =>
  realtimeTexturePackHybridSceneCapsuleSchema.parse({
    ...input,
    schema: REALTIME_TEXTURE_PACK_HYBRID_SCENE_CAPSULE_SCHEMA,
    content_role: "realtime_texture_pack_hybrid_scene_capsule_not_assistant_answer",
    presentation_only: true,
    environment_action_authority: false,
    world_mutation_authority: false,
    authoritative: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
