import crypto from "node:crypto";
import {
  REALTIME_TEXTURE_PACK_MAX_PROMPT_LENGTH,
  getRealtimeTexturePackPreset,
  type RealtimeTexturePackPresetId,
} from "@shared/realtime-texture-pack";
import {
  REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES,
  REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPILER_VERSION,
  REALTIME_TEXTURE_PACK_VISUAL_TARGET_CLASSES,
  assertRealtimeTexturePackCueAdmissibleForBinding,
  assertRealtimeTexturePackVisualTreatmentAdmissibleForBinding,
  buildRealtimeTexturePackPromptRevision,
  buildRealtimeTexturePackVisualTargetClassification,
  buildRealtimeTexturePackVisualTreatmentRevision,
  realtimeTexturePackSourceBindingSchema,
  realtimeTexturePackVisualCuesSchema,
  type RealtimeTexturePackPromptRevisionV1,
  type RealtimeTexturePackSourceBindingV1,
  type RealtimeTexturePackVisualCuesV1,
  type RealtimeTexturePackVisualTreatmentRevisionV1,
} from "@shared/realtime-texture-pack-visual-direction";
import {
  REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID,
  type RealtimeTexturePackHybridSceneCapsuleV1,
} from "@shared/realtime-texture-pack-hybrid-scene";
import { assertRealtimeTexturePackHybridSceneAdmissible } from "./hybrid-scene-state";

export const REALTIME_TEXTURE_PACK_MAX_CUSTOM_VISUAL_DIRECTION_LENGTH = 1_000;
export const REALTIME_TEXTURE_PACK_TREATMENT_TTL_MS = 5_000;
export const REALTIME_TEXTURE_PACK_MAX_TREATMENT_TTL_MS = 60_000;

type CueFamily = (typeof REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES)[number];
type VisualTargetClass =
  (typeof REALTIME_TEXTURE_PACK_VISUAL_TARGET_CLASSES)[number];

export type RealtimeTexturePackNativeShaderPayloadV1 = {
  target_class: "native_shader";
  parameter_hash: string;
  scene_capsule_hash: string | null;
  material_variation_policy_id: typeof REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID;
  parameters: {
    palette_profile_id: string;
    ambient_brightness: number;
    saturation: number;
    contrast: number;
    fog_density: number;
    emissive_boost: number;
    hazard_accent: RealtimeTexturePackVisualCuesV1["hazard_classes"][number] | "none";
  };
};

export type RealtimeTexturePackDynamicMaterialPayloadV1 = {
  target_class: "dynamic_material";
  generation_prompt: string;
  generation_prompt_hash: string;
  tile_resolution: 32;
  seamless: true;
  material_families: Array<"terrain" | "foliage" | "fluid" | "emissive">;
  apply_mode: "atomic_dynamic_texture_swap";
  scene_capsule_hash: string | null;
  material_variation_policy_id: typeof REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID;
  instance_variation_mode: "stable_world_space_identity";
};

export type RealtimeTexturePackResourcePackPayloadV1 = {
  target_class: "resource_pack";
  generation_prompt: string;
  generation_prompt_hash: string;
  texture_resolution: 32;
  snapshot_only: true;
  attended_apply_required: true;
};

export type RealtimeTexturePackOverlayPayloadV1 = {
  target_class: "overlay";
  source_frame_id: string;
  prompt: string;
  prompt_hash: string;
  latest_result_only: true;
};

export type RealtimeTexturePackCompiledTargetPayloadV1 =
  | RealtimeTexturePackNativeShaderPayloadV1
  | RealtimeTexturePackDynamicMaterialPayloadV1
  | RealtimeTexturePackResourcePackPayloadV1
  | RealtimeTexturePackOverlayPayloadV1;

export type RealtimeTexturePackDeterministicTreatmentCompilationV1 = {
  treatment: RealtimeTexturePackVisualTreatmentRevisionV1;
  prompt_revision: RealtimeTexturePackPromptRevisionV1 | null;
  target_payloads: RealtimeTexturePackCompiledTargetPayloadV1[];
  compiled_prompt: string;
  cue_state: "current_cue" | "static_fallback";
  fallback_reason:
    | null
    | "static_binding"
    | "cue_missing"
    | "cue_expired";
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sha256 = (value: string): string =>
  `sha256:${crypto.createHash("sha256").update(value, "utf8").digest("hex")}`;

const requireNow = (value: string): number => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("realtime_texture_pack_compiled_at_invalid");
  }
  return parsed;
};

const normalizedCustomDirection = (value: string | undefined): string => {
  const normalized = (value ?? "").trim().replace(/\r\n?/gu, "\n");
  if (normalized.length > REALTIME_TEXTURE_PACK_MAX_CUSTOM_VISUAL_DIRECTION_LENGTH) {
    throw new Error("realtime_texture_pack_custom_visual_direction_too_long");
  }
  return normalized;
};

const normalizedCueFamilies = (values: CueFamily[] | undefined): CueFamily[] => {
  const requested = new Set(values ?? REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES);
  for (const value of requested) {
    if (!REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES.includes(value)) {
      throw new Error("realtime_texture_pack_cue_family_invalid");
    }
  }
  return REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES.filter((value) =>
    requested.has(value),
  );
};

const normalizedTargets = (values: VisualTargetClass[]): VisualTargetClass[] => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("realtime_texture_pack_visual_target_required");
  }
  const requested = new Set(values);
  if (requested.size !== values.length) {
    throw new Error("realtime_texture_pack_visual_target_duplicate");
  }
  for (const value of requested) {
    if (!REALTIME_TEXTURE_PACK_VISUAL_TARGET_CLASSES.includes(value)) {
      throw new Error("realtime_texture_pack_visual_target_invalid");
    }
  }
  return REALTIME_TEXTURE_PACK_VISUAL_TARGET_CLASSES.filter((value) =>
    requested.has(value),
  );
};

const cuePhrases = (
  cue: RealtimeTexturePackVisualCuesV1 | null,
  enabled: Set<CueFamily>,
): string[] => {
  if (!cue) return [];
  const phrases: string[] = [];
  const add = (family: CueFamily, value: string, unknown = "unknown") => {
    if (enabled.has(family) && value !== unknown) phrases.push(`${family}: ${value}`);
  };
  add("dimension", cue.dimension_class);
  add("biome", cue.biome_class);
  add("time", cue.time_class);
  add("weather", cue.weather_class);
  add("lighting", cue.lighting_class);
  add("activity", cue.activity_class);
  if (enabled.has("hazards") && cue.hazard_classes.length > 0) {
    phrases.push(`hazards: ${[...cue.hazard_classes].sort().join(", ")}`);
  }
  add("focus", cue.focus_kind);
  add("workflow", cue.workflow_phase);
  return phrases;
};

const applyCuePolicy = (
  cue: RealtimeTexturePackVisualCuesV1 | null,
  enabledFamilies: CueFamily[],
): RealtimeTexturePackVisualCuesV1 | null => {
  if (!cue) return null;
  const enabled = new Set(enabledFamilies);
  return {
    ...cue,
    dimension_class: enabled.has("dimension") ? cue.dimension_class : "unknown",
    biome_class: enabled.has("biome") ? cue.biome_class : "unknown",
    time_class: enabled.has("time") ? cue.time_class : "unknown",
    weather_class: enabled.has("weather") ? cue.weather_class : "unknown",
    lighting_class: enabled.has("lighting") ? cue.lighting_class : "unknown",
    activity_class: enabled.has("activity") ? cue.activity_class : "unknown",
    hazard_classes: enabled.has("hazards") ? cue.hazard_classes : [],
    focus_kind: enabled.has("focus") ? cue.focus_kind : "unknown",
    workflow_phase: enabled.has("workflow") ? cue.workflow_phase : "unknown",
  };
};

const compilePrompt = (input: {
  presetId: RealtimeTexturePackPresetId;
  customDirection: string;
  cue: RealtimeTexturePackVisualCuesV1 | null;
  cueFamilies: CueFamily[];
  sceneCapsule: RealtimeTexturePackHybridSceneCapsuleV1 | null;
}): { basePrompt: string; compiledPrompt: string } => {
  const preset = getRealtimeTexturePackPreset(input.presetId);
  const basePrompt = input.customDirection
    ? `${preset.prompt}\nUser treatment: ${input.customDirection}`
    : preset.prompt;
  const phrases = cuePhrases(input.cue, new Set(input.cueFamilies));
  const scenePhrases = input.sceneCapsule
    ? [
        input.sceneCapsule.dominant_material_families.length
          ? `materials: ${input.sceneCapsule.dominant_material_families.join(", ")}`
          : null,
        input.sceneCapsule.landmark_classes.length
          ? `landmarks: ${input.sceneCapsule.landmark_classes.join(", ")}`
          : null,
        input.sceneCapsule.depth_profile !== "unknown"
          ? `depth: ${input.sceneCapsule.depth_profile}`
          : null,
        input.sceneCapsule.camera_motion_class !== "unknown"
          ? `camera motion: ${input.sceneCapsule.camera_motion_class}`
          : null,
      ].filter((value): value is string => Boolean(value))
    : [];
  const compiledPrompt = [
    basePrompt,
    "Preserve the native camera, traversable geometry, major silhouettes, interaction readability, and HUD-safe regions.",
    phrases.length > 0
      ? `Current verified scene cues: ${phrases.join("; ")}.`
      : "No current environment cue is admitted; use the static user direction only.",
    ...(scenePhrases.length > 0
      ? [`Current verified view structure: ${scenePhrases.join("; ")}.`]
      : []),
    "Maintain a coherent palette and material language across adjacent revisions without inventing gameplay state.",
  ].join("\n");
  if (compiledPrompt.length > REALTIME_TEXTURE_PACK_MAX_PROMPT_LENGTH) {
    throw new Error("realtime_texture_pack_compiled_prompt_too_long");
  }
  return { basePrompt, compiledPrompt };
};

const round3 = (value: number): number => Math.round(value * 1_000) / 1_000;

const shaderPayload = (input: {
  presetId: RealtimeTexturePackPresetId;
  cue: RealtimeTexturePackVisualCuesV1 | null;
  sceneCapsule: RealtimeTexturePackHybridSceneCapsuleV1 | null;
}): RealtimeTexturePackNativeShaderPayloadV1 => {
  const cue = input.cue;
  const presetParameters = {
    playable: { saturation: 1, contrast: 1.05, fog: 0.08, emissive: 1 },
    painterly: { saturation: 1.12, contrast: 0.96, fog: 0.16, emissive: 1.1 },
    custom: { saturation: 1, contrast: 1, fog: 0.1, emissive: 1 },
  }[input.presetId];
  const ambient = cue?.lighting_class === "dark"
    ? 0.55
    : cue?.lighting_class === "dim"
      ? 0.75
      : 1;
  const weatherFog = cue?.weather_class === "rain"
    ? 0.08
    : cue?.weather_class === "thunder"
      ? 0.14
      : cue?.weather_class === "snow"
        ? 0.05
        : 0;
  const hazardAccent = cue?.hazard_classes[0] ?? "none";
  const parameters = {
    palette_profile_id: [
      "rtp_palette",
      input.presetId,
      cue?.dimension_class ?? "static",
      cue?.biome_class ?? "static",
      cue?.time_class ?? "static",
    ].join("."),
    ambient_brightness: ambient,
    saturation: presetParameters.saturation,
    contrast: presetParameters.contrast,
    fog_density: round3(Math.min(0.6, presetParameters.fog + weatherFog)),
    emissive_boost: round3(
      presetParameters.emissive +
        (cue?.hazard_classes.some((value) => value === "lava" || value === "fire")
          ? 0.25
          : 0),
    ),
    hazard_accent: hazardAccent,
  };
  return {
    target_class: "native_shader",
    parameter_hash: sha256(canonicalJson(parameters)),
    scene_capsule_hash: input.sceneCapsule?.scene_capsule_hash ?? null,
    material_variation_policy_id: REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID,
    parameters,
  };
};

const materialFamilies = (
  cue: RealtimeTexturePackVisualCuesV1 | null,
): RealtimeTexturePackDynamicMaterialPayloadV1["material_families"] => {
  const values = new Set<
    RealtimeTexturePackDynamicMaterialPayloadV1["material_families"][number]
  >(["terrain"]);
  if (cue?.biome_class === "forest" || cue?.biome_class === "swamp") {
    values.add("foliage");
  }
  if (
    cue?.biome_class === "ocean" ||
    cue?.biome_class === "swamp" ||
    cue?.hazard_classes.includes("lava")
  ) {
    values.add("fluid");
  }
  if (
    cue?.hazard_classes.includes("lava") ||
    cue?.hazard_classes.includes("fire")
  ) {
    values.add("emissive");
  }
  const order = ["terrain", "foliage", "fluid", "emissive"] as const;
  return order.filter((value) => values.has(value));
};

const compilePayloads = (input: {
  targets: VisualTargetClass[];
  presetId: RealtimeTexturePackPresetId;
  cue: RealtimeTexturePackVisualCuesV1 | null;
  compiledPrompt: string;
  sourceFrameId: string;
  sceneCapsule: RealtimeTexturePackHybridSceneCapsuleV1 | null;
}): RealtimeTexturePackCompiledTargetPayloadV1[] =>
  input.targets.map((target): RealtimeTexturePackCompiledTargetPayloadV1 => {
    if (target === "native_shader") {
      return shaderPayload({ presetId: input.presetId, cue: input.cue, sceneCapsule: input.sceneCapsule });
    }
    if (target === "dynamic_material") {
      const generationPrompt = `${input.compiledPrompt}\nCreate seamless low-resolution Minecraft material tiles; preserve block-face readability and tile boundaries.`;
      return {
        target_class: "dynamic_material",
        generation_prompt: generationPrompt,
        generation_prompt_hash: sha256(generationPrompt),
        tile_resolution: 32,
        seamless: true,
        material_families: materialFamilies(input.cue),
        apply_mode: "atomic_dynamic_texture_swap",
        scene_capsule_hash: input.sceneCapsule?.scene_capsule_hash ?? null,
        material_variation_policy_id: REALTIME_TEXTURE_PACK_MATERIAL_VARIATION_POLICY_ID,
        instance_variation_mode: "stable_world_space_identity",
      };
    }
    if (target === "resource_pack") {
      const generationPrompt = `${input.compiledPrompt}\nCreate one coherent Minecraft resource-pack snapshot; preserve recognizable block, item, and hazard identities.`;
      return {
        target_class: "resource_pack",
        generation_prompt: generationPrompt,
        generation_prompt_hash: sha256(generationPrompt),
        texture_resolution: 32,
        snapshot_only: true,
        attended_apply_required: true,
      };
    }
    return {
      target_class: "overlay",
      source_frame_id: input.sourceFrameId,
      prompt: input.compiledPrompt,
      prompt_hash: sha256(input.compiledPrompt),
      latest_result_only: true,
    };
  });

const minimumExpiry = (values: string[]): string =>
  new Date(Math.min(...values.map((value) => Date.parse(value)))).toISOString();

export const compileRealtimeTexturePackVisualTreatment = (input: {
  binding: RealtimeTexturePackSourceBindingV1;
  sourceFrameId: string;
  treatmentRevision: number;
  presetId: RealtimeTexturePackPresetId;
  customDirection?: string;
  enabledCueFamilies?: CueFamily[];
  targets: VisualTargetClass[];
  cue?: RealtimeTexturePackVisualCuesV1 | null;
  sceneCapsule?: RealtimeTexturePackHybridSceneCapsuleV1 | null;
  previousTreatment?: RealtimeTexturePackVisualTreatmentRevisionV1 | null;
  compiledAt: string;
  ttlMs?: number;
}): RealtimeTexturePackDeterministicTreatmentCompilationV1 => {
  const binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
  const compiledAtMs = requireNow(input.compiledAt);
  if (!Number.isInteger(input.treatmentRevision) || input.treatmentRevision <= 0) {
    throw new Error("realtime_texture_pack_treatment_revision_invalid");
  }
  if (!input.sourceFrameId.trim()) {
    throw new Error("realtime_texture_pack_source_frame_id_required");
  }
  const ttlMs = input.ttlMs ?? REALTIME_TEXTURE_PACK_TREATMENT_TTL_MS;
  if (
    !Number.isInteger(ttlMs) ||
    ttlMs < 1_000 ||
    ttlMs > REALTIME_TEXTURE_PACK_MAX_TREATMENT_TTL_MS
  ) {
    throw new Error("realtime_texture_pack_treatment_ttl_invalid");
  }
  const customDirection = normalizedCustomDirection(input.customDirection);
  const cueFamilies = normalizedCueFamilies(input.enabledCueFamilies);
  const targets = normalizedTargets(input.targets);

  let cue: RealtimeTexturePackVisualCuesV1 | null = input.cue
    ? realtimeTexturePackVisualCuesSchema.parse(input.cue)
    : null;
  let fallbackReason:
    | RealtimeTexturePackDeterministicTreatmentCompilationV1["fallback_reason"] =
    null;
  if (binding.mode === "static_prompt_only") {
    if (cue) throw new Error("realtime_texture_pack_static_binding_forbids_cue");
    fallbackReason = "static_binding";
  } else if (!cue) {
    fallbackReason = "cue_missing";
  } else {
    if (compiledAtMs < Date.parse(cue.observed_at)) {
      throw new Error("realtime_texture_pack_cue_from_future");
    }
    try {
      assertRealtimeTexturePackCueAdmissibleForBinding({
        binding,
        cue,
        at: input.compiledAt,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "realtime_texture_pack_cue_stale" &&
        compiledAtMs >= Date.parse(cue.expires_at)
      ) {
        cue = null;
        fallbackReason = "cue_expired";
      } else {
        throw error;
      }
    }
  }

  const effectiveCue = applyCuePolicy(cue, cueFamilies);
  const sceneCapsule = input.sceneCapsule ?? null;
  if (sceneCapsule) {
    if (!cue) throw new Error("realtime_texture_pack_scene_capsule_requires_current_cue");
    assertRealtimeTexturePackHybridSceneAdmissible({ binding, cue, capsule: sceneCapsule, sourceFrameId: input.sourceFrameId.trim(), at: input.compiledAt });
  }
  const { basePrompt, compiledPrompt } = compilePrompt({
    presetId: input.presetId,
    customDirection,
    cue: effectiveCue,
    cueFamilies,
    sceneCapsule,
  });
  const targetClassifications = targets.map((target) =>
    buildRealtimeTexturePackVisualTargetClassification(target),
  );
  const payloads = compilePayloads({
    targets,
    presetId: input.presetId,
    cue: effectiveCue,
    compiledPrompt,
    sourceFrameId: input.sourceFrameId.trim(),
    sceneCapsule,
  });
  const compiledPromptHash = sha256(compiledPrompt);
  const basePromptHash = sha256(basePrompt);
  const needsPromptRevision = targetClassifications.some(
    (classification) => classification.generated_pixels_allowed,
  );
  const expiresAt = minimumExpiry([
    binding.expires_at,
    new Date(compiledAtMs + ttlMs).toISOString(),
    ...(cue ? [cue.expires_at] : []),
  ]);
  const promptRevision = needsPromptRevision
    ? buildRealtimeTexturePackPromptRevision({
        prompt_revision_id: `rtp_prompt_revision:${compiledPromptHash.slice(7, 31)}:${input.treatmentRevision}`,
        prompt_revision: input.treatmentRevision,
        source_binding_id: binding.binding_id,
        source_binding_revision: binding.binding_revision,
        capture_session_id: binding.capture_session_id,
        source_frame_id: input.sourceFrameId.trim(),
        cue_packet_id: cue?.cue_packet_id ?? null,
        scene_capsule_id: sceneCapsule?.scene_capsule_id ?? null,
        base_prompt_hash: basePromptHash,
        preset_id: input.presetId,
        compiled_prompt_hash: compiledPromptHash,
        compiler_version: REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPILER_VERSION,
        compiled_at: input.compiledAt,
        expires_at: expiresAt,
      })
    : null;
  const treatmentHash = sha256(
    canonicalJson({
      source_binding_id: binding.binding_id,
      source_binding_revision: binding.binding_revision,
      cue_packet_id: cue?.cue_packet_id ?? null,
      cue_digest_hash: cue?.digest_hash ?? null,
      scene_capsule_id: sceneCapsule?.scene_capsule_id ?? null,
      scene_capsule_hash: sceneCapsule?.scene_capsule_hash ?? null,
      preset_id: input.presetId,
      custom_direction_hash: sha256(customDirection),
      enabled_cue_families: cueFamilies,
      target_classifications: targetClassifications,
      payload_hashes: payloads.map((payload) =>
        "parameter_hash" in payload
          ? payload.parameter_hash
          : "generation_prompt_hash" in payload
            ? payload.generation_prompt_hash
            : payload.prompt_hash,
      ),
      compiled_prompt_hash: compiledPromptHash,
      fallback_reason: fallbackReason,
      compiler_version: REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPILER_VERSION,
    }),
  );
  const treatment = buildRealtimeTexturePackVisualTreatmentRevision({
    visual_treatment_revision_id: `rtp_visual_treatment:${treatmentHash.slice(7, 31)}:${input.treatmentRevision}`,
    visual_treatment_revision: input.treatmentRevision,
    source_binding_id: binding.binding_id,
    source_binding_revision: binding.binding_revision,
    capture_session_id: binding.capture_session_id,
    cue_packet_id: cue?.cue_packet_id ?? null,
    prompt_revision_id: promptRevision?.prompt_revision_id ?? null,
    treatment_hash: treatmentHash,
    compiler_version: REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPILER_VERSION,
    target_classifications: targetClassifications,
    compiled_at: input.compiledAt,
    expires_at: expiresAt,
  });
  assertRealtimeTexturePackVisualTreatmentAdmissibleForBinding({
    binding,
    treatment,
    cue,
    promptRevision,
    previousTreatment: input.previousTreatment,
    at: input.compiledAt,
  });
  return {
    treatment,
    prompt_revision: promptRevision,
    target_payloads: payloads,
    compiled_prompt: compiledPrompt,
    cue_state: cue ? "current_cue" : "static_fallback",
    fallback_reason: fallbackReason,
  };
};
