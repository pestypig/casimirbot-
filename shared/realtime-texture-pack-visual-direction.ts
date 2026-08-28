import { z } from "zod";

export const REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_SUPPORT_SCHEMA =
  "helix.realtime_texture_pack_visual_direction_support.v1" as const;
export const REALTIME_TEXTURE_PACK_SOURCE_BINDING_SCHEMA =
  "helix.realtime_texture_pack_source_binding.v1" as const;
export const REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA =
  "helix.realtime_texture_pack_visual_cues.v1" as const;
export const REALTIME_TEXTURE_PACK_PROMPT_REVISION_SCHEMA =
  "helix.realtime_texture_pack_prompt_revision.v1" as const;

export const REALTIME_TEXTURE_PACK_MINECRAFT_VISUAL_DIRECTION_PROFILE_ID =
  "realtime_texture_pack.visual_direction.minecraft.v1" as const;
export const REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPILER_VERSION =
  "realtime_texture_pack.visual_direction.compiler.v1" as const;

export const REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES = [
  "dimension",
  "biome",
  "time",
  "weather",
  "lighting",
  "activity",
  "hazards",
  "focus",
  "workflow",
] as const;
export const REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPATIBILITY_STATES = [
  "supported",
  "degraded",
  "stale",
  "incompatible",
  "disconnected",
] as const;
export const REALTIME_TEXTURE_PACK_SOURCE_BINDING_STATUSES = [
  "active",
  "revoked",
  "expired",
] as const;

export const REALTIME_TEXTURE_PACK_DIMENSION_CLASSES = [
  "overworld",
  "nether",
  "end",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_BIOME_CLASSES = [
  "surface",
  "forest",
  "desert",
  "snow",
  "ocean",
  "swamp",
  "mountain",
  "cave",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_TIME_CLASSES = [
  "dawn",
  "day",
  "dusk",
  "night",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_WEATHER_CLASSES = [
  "clear",
  "rain",
  "thunder",
  "snow",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_LIGHTING_CLASSES = [
  "bright",
  "dim",
  "dark",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_ACTIVITY_CLASSES = [
  "idle",
  "exploring",
  "navigating",
  "mining",
  "building",
  "crafting",
  "combat",
  "interacting",
  "surviving",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_HAZARD_CLASSES = [
  "lava",
  "fire",
  "fall",
  "submersion",
  "low_health",
  "low_air",
  "hunger",
  "hostile_entity",
  "entrapment",
] as const;
export const REALTIME_TEXTURE_PACK_FOCUS_KINDS = [
  "block",
  "entity",
  "container",
  "item",
  "terrain",
  "ui",
  "unknown",
] as const;
export const REALTIME_TEXTURE_PACK_WORKFLOW_PHASES = [
  "idle",
  "started",
  "running",
  "completed",
  "failed",
  "canceled",
  "unknown",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const cueFamilySchema = z.enum(REALTIME_TEXTURE_PACK_VISUAL_CUE_FAMILIES);
const producerPlaneSchema = z.enum(["world_authority", "player_embodiment"]);

const requireOrderedWindow = (
  start: string,
  end: string,
  context: z.RefinementCtx,
  endPath: (string | number)[],
): void => {
  if (Date.parse(end) <= Date.parse(start)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: endPath,
      message: "Expiry must be later than creation or observation.",
    });
  }
};

const evidenceAuthorityShape = {
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
} as const;

export const realtimeTexturePackVisualDirectionSupportSchema = z
  .object({
    schema: z.literal(REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_SUPPORT_SCHEMA),
    support_id: identifierSchema,
    adapter_profile_id: identifierSchema,
    adapter_profile_version: z.number().int().positive(),
    adapter_kind: identifierSchema,
    controller_profile_id: identifierSchema,
    controller_profile_version: z.number().int().positive(),
    cue_schema: z.literal(REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA),
    supported_cue_families: z.array(cueFamilySchema).min(1).max(16),
    compatibility_state: z.enum(
      REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMPATIBILITY_STATES,
    ),
    observed_at: timestampSchema,
    expires_at: timestampSchema,
    content_role: z.literal(
      "realtime_texture_pack_visual_direction_support_not_assistant_answer",
    ),
    authoritative: z.literal(false),
    authority_class: z.literal("non_authoritative_projection_capability"),
    ...evidenceAuthorityShape,
  })
  .strict()
  .superRefine((value, context) => {
    requireOrderedWindow(value.observed_at, value.expires_at, context, [
      "expires_at",
    ]);
    if (new Set(value.supported_cue_families).size !== value.supported_cue_families.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supported_cue_families"],
        message: "Supported cue families must be unique.",
      });
    }
  });

const environmentContextSchema = z
  .object({
    environment_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_plane: producerPlaneSchema,
    producer_epoch_ref: identifierSchema,
    subject_ref: identifierSchema.nullable(),
    adapter_profile_id: identifierSchema,
    adapter_profile_version: z.number().int().positive(),
    support_id: identifierSchema,
    controller_profile_id: identifierSchema,
    controller_profile_version: z.number().int().positive(),
    max_digest_age_ms: z.number().int().min(1_000).max(120_000),
  })
  .strict();

export const realtimeTexturePackSourceBindingSchema = z
  .object({
    schema: z.literal(REALTIME_TEXTURE_PACK_SOURCE_BINDING_SCHEMA),
    binding_id: identifierSchema,
    binding_revision: z.number().int().positive(),
    capture_session_id: identifierSchema,
    visual_source_id: identifierSchema,
    visual_source_origin: z.literal("browser_getDisplayMedia"),
    visual_source_surface: z.enum(["window", "screen", "browser_tab"]),
    mode: z.enum(["static_prompt_only", "environment_reactive"]),
    environment_context: environmentContextSchema.nullable(),
    policy_revision: z.number().int().positive(),
    status: z.enum(REALTIME_TEXTURE_PACK_SOURCE_BINDING_STATUSES),
    created_at: timestampSchema,
    expires_at: timestampSchema,
    revoked_at: timestampSchema.nullable(),
    revocation_reason: z
      .enum([
        "user_revoked",
        "source_switched",
        "capture_stopped",
        "account_policy_lost",
        "expired",
      ])
      .nullable(),
    content_role: z.literal(
      "realtime_texture_pack_source_binding_not_assistant_answer",
    ),
    authoritative: z.literal(false),
    authority_class: z.literal("non_authoritative_projection_binding"),
    ...evidenceAuthorityShape,
  })
  .strict()
  .superRefine((value, context) => {
    requireOrderedWindow(value.created_at, value.expires_at, context, [
      "expires_at",
    ]);
    const reactive = value.mode === "environment_reactive";
    if (reactive !== Boolean(value.environment_context)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["environment_context"],
        message:
          "Environment-reactive bindings require context and static bindings forbid it.",
      });
    }
    const revoked = value.status !== "active";
    if (revoked !== Boolean(value.revoked_at) || revoked !== Boolean(value.revocation_reason)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message:
          "Inactive bindings require a revocation timestamp and reason; active bindings forbid them.",
      });
    }
  });

export const realtimeTexturePackVisualCuesSchema = z
  .object({
    schema: z.literal(REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA),
    cue_packet_id: identifierSchema,
    source_binding_id: identifierSchema,
    source_binding_revision: z.number().int().positive(),
    environment_id: identifierSchema,
    room_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    producer_plane: producerPlaneSchema,
    producer_epoch_ref: identifierSchema,
    subject_ref: identifierSchema.nullable(),
    observation_revision: z.number().int().nonnegative(),
    digest_id: identifierSchema,
    digest_hash: sha256Schema,
    observed_at: timestampSchema,
    expires_at: timestampSchema,
    dimension_class: z.enum(REALTIME_TEXTURE_PACK_DIMENSION_CLASSES),
    biome_class: z.enum(REALTIME_TEXTURE_PACK_BIOME_CLASSES),
    time_class: z.enum(REALTIME_TEXTURE_PACK_TIME_CLASSES),
    weather_class: z.enum(REALTIME_TEXTURE_PACK_WEATHER_CLASSES),
    lighting_class: z.enum(REALTIME_TEXTURE_PACK_LIGHTING_CLASSES),
    activity_class: z.enum(REALTIME_TEXTURE_PACK_ACTIVITY_CLASSES),
    hazard_classes: z.array(z.enum(REALTIME_TEXTURE_PACK_HAZARD_CLASSES)).max(16),
    focus_kind: z.enum(REALTIME_TEXTURE_PACK_FOCUS_KINDS),
    workflow_phase: z.enum(REALTIME_TEXTURE_PACK_WORKFLOW_PHASES),
    changed_fields: z.array(cueFamilySchema).max(16),
    evidence_refs: z.array(identifierSchema).min(1).max(128),
    content_role: z.literal(
      "realtime_texture_pack_visual_cues_not_assistant_answer",
    ),
    authoritative_visual_output: z.literal(false),
    authoritative: z.literal(false),
    authority_class: z.literal("non_authoritative_projection_context"),
    ...evidenceAuthorityShape,
  })
  .strict()
  .superRefine((value, context) => {
    requireOrderedWindow(value.observed_at, value.expires_at, context, [
      "expires_at",
    ]);
    if (new Set(value.hazard_classes).size !== value.hazard_classes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hazard_classes"],
        message: "Hazard classes must be unique.",
      });
    }
    if (new Set(value.changed_fields).size !== value.changed_fields.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["changed_fields"],
        message: "Changed cue families must be unique.",
      });
    }
  });

export const realtimeTexturePackPromptRevisionSchema = z
  .object({
    schema: z.literal(REALTIME_TEXTURE_PACK_PROMPT_REVISION_SCHEMA),
    prompt_revision_id: identifierSchema,
    prompt_revision: z.number().int().positive(),
    source_binding_id: identifierSchema,
    source_binding_revision: z.number().int().positive(),
    capture_session_id: identifierSchema,
    source_frame_id: identifierSchema,
    cue_packet_id: identifierSchema.nullable(),
    scene_capsule_id: identifierSchema.nullable(),
    base_prompt_hash: sha256Schema,
    preset_id: z.enum(["playable", "painterly", "custom"]),
    compiled_prompt_hash: sha256Schema,
    compiler_version: identifierSchema,
    compiled_at: timestampSchema,
    expires_at: timestampSchema,
    content_role: z.literal(
      "realtime_texture_pack_prompt_revision_not_assistant_answer",
    ),
    authoritative: z.literal(false),
    authority_class: z.literal("non_authoritative_projection_prompt"),
    ...evidenceAuthorityShape,
  })
  .strict()
  .superRefine((value, context) => {
    requireOrderedWindow(value.compiled_at, value.expires_at, context, [
      "expires_at",
    ]);
  });

export type RealtimeTexturePackVisualDirectionSupportV1 = z.infer<
  typeof realtimeTexturePackVisualDirectionSupportSchema
>;
export type RealtimeTexturePackSourceBindingV1 = z.infer<
  typeof realtimeTexturePackSourceBindingSchema
>;
export type RealtimeTexturePackVisualCuesV1 = z.infer<
  typeof realtimeTexturePackVisualCuesSchema
>;
export type RealtimeTexturePackPromptRevisionV1 = z.infer<
  typeof realtimeTexturePackPromptRevisionSchema
>;

type SupportInput = Omit<
  RealtimeTexturePackVisualDirectionSupportV1,
  | "schema"
  | "cue_schema"
  | "content_role"
  | "authoritative"
  | "authority_class"
  | "assistant_answer"
  | "terminal_eligible"
  | "raw_content_included"
>;

export const buildRealtimeTexturePackVisualDirectionSupport = (
  input: SupportInput,
): RealtimeTexturePackVisualDirectionSupportV1 =>
  realtimeTexturePackVisualDirectionSupportSchema.parse({
    ...input,
    schema: REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_SUPPORT_SCHEMA,
    cue_schema: REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA,
    content_role:
      "realtime_texture_pack_visual_direction_support_not_assistant_answer",
    authoritative: false,
    authority_class: "non_authoritative_projection_capability",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

type BindingInput = Omit<
  RealtimeTexturePackSourceBindingV1,
  | "schema"
  | "content_role"
  | "authoritative"
  | "authority_class"
  | "assistant_answer"
  | "terminal_eligible"
  | "raw_content_included"
>;

export const buildRealtimeTexturePackSourceBinding = (
  input: BindingInput,
): RealtimeTexturePackSourceBindingV1 =>
  realtimeTexturePackSourceBindingSchema.parse({
    ...input,
    schema: REALTIME_TEXTURE_PACK_SOURCE_BINDING_SCHEMA,
    content_role: "realtime_texture_pack_source_binding_not_assistant_answer",
    authoritative: false,
    authority_class: "non_authoritative_projection_binding",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

type PromptRevisionInput = Omit<
  RealtimeTexturePackPromptRevisionV1,
  | "schema"
  | "content_role"
  | "authoritative"
  | "authority_class"
  | "assistant_answer"
  | "terminal_eligible"
  | "raw_content_included"
>;

export const buildRealtimeTexturePackPromptRevision = (
  input: PromptRevisionInput,
): RealtimeTexturePackPromptRevisionV1 =>
  realtimeTexturePackPromptRevisionSchema.parse({
    ...input,
    schema: REALTIME_TEXTURE_PACK_PROMPT_REVISION_SCHEMA,
    content_role: "realtime_texture_pack_prompt_revision_not_assistant_answer",
    authoritative: false,
    authority_class: "non_authoritative_projection_prompt",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

const ensureActiveAt = (
  binding: RealtimeTexturePackSourceBindingV1,
  at: string,
): void => {
  const atMs = Date.parse(at);
  if (
    binding.status !== "active" ||
    atMs < Date.parse(binding.created_at) ||
    atMs >= Date.parse(binding.expires_at)
  ) {
    throw new Error("realtime_texture_pack_source_binding_inactive");
  }
};

export const assertRealtimeTexturePackCueAdmissibleForBinding = (input: {
  binding: RealtimeTexturePackSourceBindingV1;
  cue: RealtimeTexturePackVisualCuesV1;
  at: string;
  previousCue?: RealtimeTexturePackVisualCuesV1 | null;
}): void => {
  const binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
  const cue = realtimeTexturePackVisualCuesSchema.parse(input.cue);
  ensureActiveAt(binding, input.at);
  const context = binding.environment_context;
  if (!context || binding.mode !== "environment_reactive") {
    throw new Error("realtime_texture_pack_environment_context_required");
  }
  if (
    cue.source_binding_id !== binding.binding_id ||
    cue.source_binding_revision !== binding.binding_revision ||
    cue.environment_id !== context.environment_id ||
    cue.room_id !== context.room_id ||
    cue.source_id !== context.source_id ||
    cue.world_id !== context.world_id ||
    cue.producer_plane !== context.producer_plane ||
    cue.producer_epoch_ref !== context.producer_epoch_ref ||
    cue.subject_ref !== context.subject_ref
  ) {
    throw new Error("realtime_texture_pack_cue_binding_identity_mismatch");
  }
  const atMs = Date.parse(input.at);
  if (atMs < Date.parse(cue.observed_at) || atMs >= Date.parse(cue.expires_at)) {
    throw new Error("realtime_texture_pack_cue_stale");
  }
  if (input.previousCue) {
    const previous = realtimeTexturePackVisualCuesSchema.parse(input.previousCue);
    if (previous.source_binding_id !== binding.binding_id) {
      throw new Error("realtime_texture_pack_previous_cue_binding_mismatch");
    }
    if (cue.observation_revision < previous.observation_revision) {
      throw new Error("realtime_texture_pack_cue_revision_regressed");
    }
    if (
      cue.observation_revision === previous.observation_revision &&
      (cue.digest_id !== previous.digest_id || cue.digest_hash !== previous.digest_hash)
    ) {
      throw new Error("realtime_texture_pack_cue_revision_conflict");
    }
  }
};

export const assertRealtimeTexturePackPromptRevisionAdmissibleForBinding = (input: {
  binding: RealtimeTexturePackSourceBindingV1;
  revision: RealtimeTexturePackPromptRevisionV1;
  cue?: RealtimeTexturePackVisualCuesV1 | null;
  at: string;
}): void => {
  const binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
  const revision = realtimeTexturePackPromptRevisionSchema.parse(input.revision);
  ensureActiveAt(binding, input.at);
  if (
    revision.source_binding_id !== binding.binding_id ||
    revision.source_binding_revision !== binding.binding_revision ||
    revision.capture_session_id !== binding.capture_session_id
  ) {
    throw new Error("realtime_texture_pack_prompt_binding_identity_mismatch");
  }
  const atMs = Date.parse(input.at);
  if (atMs < Date.parse(revision.compiled_at) || atMs >= Date.parse(revision.expires_at)) {
    throw new Error("realtime_texture_pack_prompt_revision_stale");
  }
  if (revision.cue_packet_id) {
    if (!input.cue || input.cue.cue_packet_id !== revision.cue_packet_id) {
      throw new Error("realtime_texture_pack_prompt_cue_identity_mismatch");
    }
    assertRealtimeTexturePackCueAdmissibleForBinding({
      binding,
      cue: input.cue,
      at: input.at,
    });
  }
};
