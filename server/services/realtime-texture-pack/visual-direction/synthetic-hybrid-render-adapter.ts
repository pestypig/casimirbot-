import crypto from "node:crypto";
import {
  REALTIME_TEXTURE_PACK_HYBRID_RENDER_RECEIPT_SCHEMA,
  REALTIME_TEXTURE_PACK_FABRIC_DEBUG_PROJECTION_SCHEMA,
  realtimeTexturePackFabricDebugProjectionSchema,
  realtimeTexturePackHybridRenderReceiptSchema,
  type RealtimeTexturePackFabricDebugProjectionV1,
  type RealtimeTexturePackHybridRenderReceiptV1,
} from "@shared/realtime-texture-pack-hybrid-render";
import type { RealtimeTexturePackHybridSceneCapsuleV1 } from "@shared/realtime-texture-pack-hybrid-scene";
import type { RealtimeTexturePackDeterministicTreatmentCompilationV1 } from "./deterministic-treatment-compiler";
import { deriveRealtimeTexturePackMaterialInstanceVariation } from "./hybrid-scene-state";

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
};
const hash = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256").update(canonicalJson(value), "utf8").digest("hex")}`;
const safeIdentifier = /^[a-zA-Z0-9:._/-]{1,320}$/;

export type RealtimeTexturePackSyntheticMaterialInstanceV1 = {
  material_family: RealtimeTexturePackHybridSceneCapsuleV1["dominant_material_families"][number];
  instance_identity_hash: string;
  variation_seed: number;
  variation_slot: number;
};

export type RealtimeTexturePackSyntheticHybridProjectionV1 = {
  projection_id: string;
  projection_hash: string;
  source_binding_id: string;
  source_binding_revision: number;
  capture_session_id: string;
  source_frame_id: string;
  scene_capsule_id: string;
  scene_capsule_hash: string;
  visual_treatment_revision_id: string;
  visual_treatment_revision: number;
  treatment_hash: string;
  prompt_revision_id: string;
  overlay_prompt: string;
  overlay_prompt_hash: string;
  shader_parameter_hash: string;
  dynamic_material_prompt_hash: string;
  material_variation_policy_id: string;
  style_family_id: string;
  world_id: string;
  dimension_id: string;
  variation_slot_count: number;
  material_instances: RealtimeTexturePackSyntheticMaterialInstanceV1[];
  created_at: string;
  expires_at: string;
  synthetic_only: true;
  minecraft_render_mutation_performed: false;
  provider_request_performed: false;
};

export const projectSyntheticRealtimeTexturePackHybridRender = (input: {
  sceneCapsule: RealtimeTexturePackHybridSceneCapsuleV1;
  compilation: RealtimeTexturePackDeterministicTreatmentCompilationV1;
  dimensionId: string;
  styleFamilyId: string;
  variationSlotCount?: number;
  visibleBlocks: Array<{
    blockPosition: { x: number; y: number; z: number };
    blockType: string;
    blockState: string;
    materialFamily: RealtimeTexturePackSyntheticMaterialInstanceV1["material_family"];
  }>;
}): RealtimeTexturePackSyntheticHybridProjectionV1 => {
  const { sceneCapsule: scene, compilation } = input;
  if (!safeIdentifier.test(input.dimensionId) || !safeIdentifier.test(input.styleFamilyId)) {
    throw new Error("realtime_texture_pack_synthetic_render_identifier_invalid");
  }
  if (input.visibleBlocks.length === 0 || input.visibleBlocks.length > 256) {
    throw new Error("realtime_texture_pack_synthetic_render_block_count_invalid");
  }
  if (compilation.treatment.source_binding_id !== scene.source_binding_id ||
      compilation.treatment.source_binding_revision !== scene.source_binding_revision ||
      compilation.treatment.capture_session_id !== scene.capture_session_id ||
      compilation.treatment.cue_packet_id !== scene.cue_packet_id ||
      compilation.prompt_revision?.scene_capsule_id !== scene.scene_capsule_id) {
    throw new Error("realtime_texture_pack_synthetic_render_scene_binding_mismatch");
  }
  const overlay = compilation.target_payloads.find((payload) => payload.target_class === "overlay");
  const shader = compilation.target_payloads.find((payload) => payload.target_class === "native_shader");
  const material = compilation.target_payloads.find((payload) => payload.target_class === "dynamic_material");
  if (!overlay || overlay.target_class !== "overlay" || !shader || shader.target_class !== "native_shader" ||
      !material || material.target_class !== "dynamic_material" || !compilation.prompt_revision) {
    throw new Error("realtime_texture_pack_synthetic_render_targets_required");
  }
  if (overlay.source_frame_id !== scene.source_frame_id || shader.scene_capsule_hash !== scene.scene_capsule_hash ||
      material.scene_capsule_hash !== scene.scene_capsule_hash ||
      shader.material_variation_policy_id !== material.material_variation_policy_id) {
    throw new Error("realtime_texture_pack_synthetic_render_target_correlation_mismatch");
  }
  const materialInstances = input.visibleBlocks.map((block) => {
    if (!safeIdentifier.test(block.blockType) || !safeIdentifier.test(block.blockState) ||
        !scene.dominant_material_families.includes(block.materialFamily)) {
      throw new Error("realtime_texture_pack_synthetic_render_block_invalid");
    }
    return {
      material_family: block.materialFamily,
      ...deriveRealtimeTexturePackMaterialInstanceVariation({
        worldId: scene.world_id,
        dimensionId: input.dimensionId,
        blockPosition: block.blockPosition,
        blockType: block.blockType,
        blockState: block.blockState,
        styleFamilyId: input.styleFamilyId,
        slotCount: input.variationSlotCount,
      }),
    };
  });
  if (new Set(materialInstances.map((instance) => instance.instance_identity_hash)).size !== materialInstances.length) {
    throw new Error("realtime_texture_pack_synthetic_render_duplicate_instance");
  }
  const projectionShape = {
    source_binding_id: scene.source_binding_id,
    source_binding_revision: scene.source_binding_revision,
    capture_session_id: scene.capture_session_id,
    source_frame_id: scene.source_frame_id,
    scene_capsule_id: scene.scene_capsule_id,
    scene_capsule_hash: scene.scene_capsule_hash,
    visual_treatment_revision_id: compilation.treatment.visual_treatment_revision_id,
    visual_treatment_revision: compilation.treatment.visual_treatment_revision,
    treatment_hash: compilation.treatment.treatment_hash,
    prompt_revision_id: compilation.prompt_revision.prompt_revision_id,
    overlay_prompt: overlay.prompt,
    overlay_prompt_hash: overlay.prompt_hash,
    shader_parameter_hash: shader.parameter_hash,
    dynamic_material_prompt_hash: material.generation_prompt_hash,
    material_variation_policy_id: shader.material_variation_policy_id,
    style_family_id: input.styleFamilyId,
    world_id: scene.world_id,
    dimension_id: input.dimensionId,
    variation_slot_count: input.variationSlotCount ?? 16,
    material_instances: materialInstances,
    created_at: compilation.treatment.compiled_at,
    expires_at: compilation.treatment.expires_at,
  };
  const projectionHash = hash(projectionShape);
  return {
    projection_id: `rtp_hybrid_projection:${projectionHash.slice(7, 31)}`,
    projection_hash: projectionHash,
    ...projectionShape,
    synthetic_only: true,
    minecraft_render_mutation_performed: false,
    provider_request_performed: false,
  };
};

export const inspectSyntheticRealtimeTexturePackHybridRender = (
  projection: RealtimeTexturePackSyntheticHybridProjectionV1,
): RealtimeTexturePackHybridRenderReceiptV1 =>
  realtimeTexturePackHybridRenderReceiptSchema.parse({
    schema: REALTIME_TEXTURE_PACK_HYBRID_RENDER_RECEIPT_SCHEMA,
    projection_id: projection.projection_id,
    projection_hash: projection.projection_hash,
    source_binding_id: projection.source_binding_id,
    source_binding_revision: projection.source_binding_revision,
    capture_session_id: projection.capture_session_id,
    source_frame_id: projection.source_frame_id,
    scene_capsule_id: projection.scene_capsule_id,
    scene_capsule_hash: projection.scene_capsule_hash,
    visual_treatment_revision_id: projection.visual_treatment_revision_id,
    treatment_hash: projection.treatment_hash,
    prompt_revision_id: projection.prompt_revision_id,
    overlay_prompt_hash: projection.overlay_prompt_hash,
    shader_parameter_hash: projection.shader_parameter_hash,
    dynamic_material_prompt_hash: projection.dynamic_material_prompt_hash,
    material_variation_policy_id: projection.material_variation_policy_id,
    material_instance_count: projection.material_instances.length,
    distinct_variation_slot_count: new Set(projection.material_instances.map((instance) => instance.variation_slot)).size,
    prompt_body_included: false,
    block_identity_input_included: false,
    content_role: "realtime_texture_pack_hybrid_render_receipt_not_assistant_answer",
    presentation_only: true,
    environment_action_authority: false,
    world_mutation_authority: false,
    authoritative: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

export const buildRealtimeTexturePackFabricDebugProjection = (
  projection: RealtimeTexturePackSyntheticHybridProjectionV1,
): RealtimeTexturePackFabricDebugProjectionV1 =>
  realtimeTexturePackFabricDebugProjectionSchema.parse({
    schema: REALTIME_TEXTURE_PACK_FABRIC_DEBUG_PROJECTION_SCHEMA,
    projection_id: projection.projection_id,
    projection_hash: projection.projection_hash,
    source_binding_id: projection.source_binding_id,
    source_binding_revision: projection.source_binding_revision,
    capture_session_id: projection.capture_session_id,
    source_frame_id: projection.source_frame_id,
    scene_capsule_id: projection.scene_capsule_id,
    scene_capsule_hash: projection.scene_capsule_hash,
    visual_treatment_revision_id: projection.visual_treatment_revision_id,
    visual_treatment_revision: projection.visual_treatment_revision,
    treatment_hash: projection.treatment_hash,
    prompt_revision_id: projection.prompt_revision_id,
    overlay_prompt_hash: projection.overlay_prompt_hash,
    shader_parameter_hash: projection.shader_parameter_hash,
    dynamic_material_prompt_hash: projection.dynamic_material_prompt_hash,
    material_variation_policy_id: projection.material_variation_policy_id,
    style_family_id: projection.style_family_id,
    world_id: projection.world_id,
    dimension_id: projection.dimension_id,
    variation_slot_count: projection.variation_slot_count,
    material_instances: projection.material_instances.map((instance) => ({
      material_family: instance.material_family,
      instance_identity_hash: instance.instance_identity_hash,
      variation_seed: instance.variation_seed,
      variation_slot: instance.variation_slot,
    })),
    created_at: projection.created_at,
    expires_at: projection.expires_at,
    debug_only: true,
    texture_mutation_allowed: false,
    provider_request_allowed: false,
    prompt_body_included: false,
    block_identity_input_included: false,
    presentation_only: true,
    environment_action_authority: false,
    world_mutation_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
