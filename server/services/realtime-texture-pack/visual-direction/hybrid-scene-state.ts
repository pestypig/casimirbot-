import crypto from "node:crypto";
import {
  REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID,
  buildRealtimeTexturePackHybridSceneCapsule,
  realtimeTexturePackHybridSceneCapsuleSchema,
  type RealtimeTexturePackHybridSceneCapsuleV1,
} from "@shared/realtime-texture-pack-hybrid-scene";
import {
  assertRealtimeTexturePackCueAdmissibleForBinding,
  realtimeTexturePackSourceBindingSchema,
  realtimeTexturePackVisualCuesSchema,
  type RealtimeTexturePackSourceBindingV1,
  type RealtimeTexturePackVisualCuesV1,
} from "@shared/realtime-texture-pack-visual-direction";

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
};
const hash = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256").update(canonicalJson(value), "utf8").digest("hex")}`;

export const buildRealtimeTexturePackHybridSceneState = (input: {
  binding: RealtimeTexturePackSourceBindingV1;
  cue: RealtimeTexturePackVisualCuesV1;
  sourceFrameId: string;
  sceneCapsuleRevision: number;
  dominantMaterialFamilies: RealtimeTexturePackHybridSceneCapsuleV1["dominant_material_families"];
  landmarkClasses: RealtimeTexturePackHybridSceneCapsuleV1["landmark_classes"];
  depthProfile: RealtimeTexturePackHybridSceneCapsuleV1["depth_profile"];
  cameraMotionClass: RealtimeTexturePackHybridSceneCapsuleV1["camera_motion_class"];
  expiresAt: string;
  at: string;
}): RealtimeTexturePackHybridSceneCapsuleV1 => {
  const binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
  const cue = realtimeTexturePackVisualCuesSchema.parse(input.cue);
  assertRealtimeTexturePackCueAdmissibleForBinding({ binding, cue, at: input.at });
  if (!input.sourceFrameId.trim()) throw new Error("realtime_texture_pack_scene_source_frame_required");
  if (!Number.isInteger(input.sceneCapsuleRevision) || input.sceneCapsuleRevision <= 0) {
    throw new Error("realtime_texture_pack_scene_capsule_revision_invalid");
  }
  const context = binding.environment_context!;
  const sceneShape = {
    source_binding_id: binding.binding_id,
    source_binding_revision: binding.binding_revision,
    capture_session_id: binding.capture_session_id,
    source_frame_id: input.sourceFrameId.trim(),
    cue_packet_id: cue.cue_packet_id,
    environment_id: context.environment_id,
    world_id: context.world_id,
    producer_epoch_ref: context.producer_epoch_ref,
    subject_ref: context.subject_ref,
    observation_revision: cue.observation_revision,
    dominant_material_families: [...input.dominantMaterialFamilies].sort(),
    landmark_classes: [...input.landmarkClasses].sort(),
    depth_profile: input.depthProfile,
    camera_motion_class: input.cameraMotionClass,
    observed_at: cue.observed_at,
    expires_at: input.expiresAt,
  };
  const sceneHash = hash(sceneShape);
  return buildRealtimeTexturePackHybridSceneCapsule({
    ...sceneShape,
    scene_capsule_id: `rtp_scene_capsule:${sceneHash.slice(7, 31)}:${input.sceneCapsuleRevision}`,
    scene_capsule_revision: input.sceneCapsuleRevision,
    scene_capsule_hash: sceneHash,
  });
};

export const assertRealtimeTexturePackHybridSceneAdmissible = (input: {
  binding: RealtimeTexturePackSourceBindingV1;
  cue: RealtimeTexturePackVisualCuesV1;
  capsule: RealtimeTexturePackHybridSceneCapsuleV1;
  sourceFrameId: string;
  at: string;
}): void => {
  const binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
  const cue = realtimeTexturePackVisualCuesSchema.parse(input.cue);
  const capsule = realtimeTexturePackHybridSceneCapsuleSchema.parse(input.capsule);
  const context = binding.environment_context;
  if (!context || binding.mode !== "environment_reactive") throw new Error("realtime_texture_pack_scene_environment_context_required");
  if (capsule.source_binding_id !== binding.binding_id || capsule.source_binding_revision !== binding.binding_revision ||
      capsule.capture_session_id !== binding.capture_session_id || capsule.source_frame_id !== input.sourceFrameId ||
      capsule.cue_packet_id !== cue.cue_packet_id || capsule.environment_id !== context.environment_id ||
      capsule.world_id !== context.world_id || capsule.producer_epoch_ref !== context.producer_epoch_ref ||
      capsule.subject_ref !== context.subject_ref || capsule.observation_revision !== cue.observation_revision) {
    throw new Error("realtime_texture_pack_scene_binding_identity_mismatch");
  }
  const at = Date.parse(input.at);
  if (at < Date.parse(capsule.observed_at) || at >= Date.parse(capsule.expires_at)) {
    throw new Error("realtime_texture_pack_scene_capsule_stale");
  }
};

export type RealtimeTexturePackMaterialInstanceVariationV1 = {
  policy_id: typeof REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID;
  instance_identity_hash: string;
  variation_seed: number;
  variation_slot: number;
};

export const deriveRealtimeTexturePackMaterialInstanceVariation = (input: {
  worldId: string;
  dimensionId: string;
  blockPosition: { x: number; y: number; z: number };
  blockType: string;
  blockState: string;
  styleFamilyId: string;
  slotCount?: number;
}): RealtimeTexturePackMaterialInstanceVariationV1 => {
  const slotCount = input.slotCount ?? 16;
  if (!Number.isInteger(slotCount) || slotCount < 2 || slotCount > 256) throw new Error("realtime_texture_pack_variation_slot_count_invalid");
  for (const coordinate of Object.values(input.blockPosition)) if (!Number.isInteger(coordinate)) throw new Error("realtime_texture_pack_block_position_invalid");
  const identity = hash({ world_id: input.worldId, dimension_id: input.dimensionId, block_position: input.blockPosition, block_type: input.blockType, block_state: input.blockState });
  const seedHash = hash({ instance_identity_hash: identity, style_family_id: input.styleFamilyId, policy_id: REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID });
  const seed = Number.parseInt(seedHash.slice(7, 15), 16) >>> 0;
  return { policy_id: REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID, instance_identity_hash: identity, variation_seed: seed, variation_slot: seed % slotCount };
};
