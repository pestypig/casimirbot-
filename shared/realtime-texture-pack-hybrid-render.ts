import { z } from "zod";

export const REALTIME_TEXTURE_PACK_HYBRID_RENDER_RECEIPT_SCHEMA =
  "helix.realtime_texture_pack_hybrid_render_receipt.v1" as const;
export const REALTIME_TEXTURE_PACK_FABRIC_DEBUG_PROJECTION_SCHEMA =
  "helix.realtime_texture_pack_fabric_debug_projection.v1" as const;

const identifier = z.string().trim().min(1).max(320).regex(/^[a-zA-Z0-9:._/-]+$/);
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const realtimeTexturePackHybridRenderReceiptSchema = z.object({
  schema: z.literal(REALTIME_TEXTURE_PACK_HYBRID_RENDER_RECEIPT_SCHEMA),
  projection_id: identifier,
  projection_hash: sha256,
  source_binding_id: identifier,
  source_binding_revision: z.number().int().positive(),
  capture_session_id: identifier,
  source_frame_id: identifier,
  scene_capsule_id: identifier,
  scene_capsule_hash: sha256,
  visual_treatment_revision_id: identifier,
  treatment_hash: sha256,
  prompt_revision_id: identifier,
  overlay_prompt_hash: sha256,
  shader_parameter_hash: sha256,
  dynamic_material_prompt_hash: sha256,
  material_variation_policy_id: identifier,
  material_instance_count: z.number().int().nonnegative().max(256),
  distinct_variation_slot_count: z.number().int().nonnegative().max(256),
  prompt_body_included: z.literal(false),
  block_identity_input_included: z.literal(false),
  content_role: z.literal("realtime_texture_pack_hybrid_render_receipt_not_assistant_answer"),
  presentation_only: z.literal(true),
  environment_action_authority: z.literal(false),
  world_mutation_authority: z.literal(false),
  authoritative: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();

export type RealtimeTexturePackHybridRenderReceiptV1 = z.infer<
  typeof realtimeTexturePackHybridRenderReceiptSchema
>;

export const realtimeTexturePackFabricDebugProjectionSchema = z.object({
  schema: z.literal(REALTIME_TEXTURE_PACK_FABRIC_DEBUG_PROJECTION_SCHEMA),
  projection_id: identifier,
  projection_hash: sha256,
  source_binding_id: identifier,
  source_binding_revision: z.number().int().positive(),
  capture_session_id: identifier,
  source_frame_id: identifier,
  scene_capsule_id: identifier,
  scene_capsule_hash: sha256,
  visual_treatment_revision_id: identifier,
  visual_treatment_revision: z.number().int().positive(),
  treatment_hash: sha256,
  prompt_revision_id: identifier,
  overlay_prompt_hash: sha256,
  shader_parameter_hash: sha256,
  dynamic_material_prompt_hash: sha256,
  material_variation_policy_id: identifier,
  style_family_id: identifier,
  world_id: identifier,
  dimension_id: identifier,
  variation_slot_count: z.number().int().min(2).max(256),
  material_instances: z.array(z.object({
    material_family: identifier,
    instance_identity_hash: sha256,
    variation_seed: z.number().int().min(0).max(0xffff_ffff),
    variation_slot: z.number().int().min(0).max(255),
  }).strict()).min(1).max(256),
  created_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
  debug_only: z.literal(true),
  texture_mutation_allowed: z.literal(false),
  provider_request_allowed: z.literal(false),
  prompt_body_included: z.literal(false),
  block_identity_input_included: z.literal(false),
  presentation_only: z.literal(true),
  environment_action_authority: z.literal(false),
  world_mutation_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expires_at) <= Date.parse(value.created_at)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["expires_at"], message: "Expiry must follow creation." });
  }
  if (new Set(value.material_instances.map((entry) => entry.instance_identity_hash)).size !== value.material_instances.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["material_instances"], message: "Instance identities must be unique." });
  }
});

export type RealtimeTexturePackFabricDebugProjectionV1 = z.infer<
  typeof realtimeTexturePackFabricDebugProjectionSchema
>;
