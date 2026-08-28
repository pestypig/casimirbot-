import crypto from "node:crypto";
import {
  helixEnvironmentSituationDigestSchema,
  type HelixEnvironmentSituationDigest,
} from "@shared/helix-environment-event-stream";
import {
  REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA,
  assertRealtimeTexturePackCueAdmissibleForBinding,
  realtimeTexturePackSourceBindingSchema,
  realtimeTexturePackVisualCuesSchema,
  realtimeTexturePackVisualDirectionSupportSchema,
  type RealtimeTexturePackSourceBindingV1,
  type RealtimeTexturePackVisualCuesV1,
  type RealtimeTexturePackVisualDirectionSupportV1,
} from "@shared/realtime-texture-pack-visual-direction";

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const canonicalToken = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized.length <= 80
    ? normalized.replace(/^minecraft:/, "").replace(/[ .-]+/g, "_")
    : null;
};

const firstValue = (record: RecordValue | null, keys: string[]): unknown => {
  if (!record) return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
};

const dimensionClass = (actor: RecordValue | null) => {
  const value = canonicalToken(firstValue(actor, ["dimension_class", "dimension"]));
  if (value === "overworld") return "overworld" as const;
  if (value === "the_nether" || value === "nether") return "nether" as const;
  if (value === "the_end" || value === "end") return "end" as const;
  return "unknown" as const;
};

const biomeClass = (actor: RecordValue | null) => {
  const value = canonicalToken(firstValue(actor, ["biome_class", "biome"]));
  if (!value) return "unknown" as const;
  if (/(?:cave|cavern|deep_dark|dripstone)/u.test(value)) return "cave" as const;
  if (/(?:forest|taiga|jungle|grove)/u.test(value)) return "forest" as const;
  if (/(?:desert|badlands|savanna)/u.test(value)) return "desert" as const;
  if (/(?:snow|frozen|ice|windswept)/u.test(value)) return "snow" as const;
  if (/(?:ocean|beach|river)/u.test(value)) return "ocean" as const;
  if (/(?:swamp|mangrove)/u.test(value)) return "swamp" as const;
  if (/(?:mountain|peak|hills|slope)/u.test(value)) return "mountain" as const;
  if (/(?:plains|meadow|field|surface)/u.test(value)) return "surface" as const;
  return "unknown" as const;
};

const timeClass = (actor: RecordValue | null) => {
  const value = canonicalToken(firstValue(actor, ["time_class", "time_of_day"]));
  if (value === "dawn" || value === "sunrise") return "dawn" as const;
  if (value === "day" || value === "daytime" || value === "noon") return "day" as const;
  if (value === "dusk" || value === "sunset") return "dusk" as const;
  if (value === "night" || value === "midnight") return "night" as const;
  const isDay = firstValue(actor, ["is_day", "daylight"]);
  if (isDay === true) return "day" as const;
  if (isDay === false) return "night" as const;
  return "unknown" as const;
};

const weatherClass = (actor: RecordValue | null) => {
  const value = canonicalToken(firstValue(actor, ["weather_class", "weather"]));
  if (value === "clear" || value === "sunny") return "clear" as const;
  if (value === "rain" || value === "raining") return "rain" as const;
  if (value === "thunder" || value === "thunderstorm") return "thunder" as const;
  if (value === "snow" || value === "snowing") return "snow" as const;
  return "unknown" as const;
};

const lightingClass = (
  actor: RecordValue | null,
  biome: ReturnType<typeof biomeClass>,
) => {
  const explicit = canonicalToken(firstValue(actor, ["lighting_class", "lighting"]));
  if (explicit === "bright" || explicit === "dim" || explicit === "dark") {
    return explicit;
  }
  const level = firstValue(actor, ["light_level", "block_light"]);
  if (typeof level === "number" && Number.isFinite(level)) {
    if (level <= 4) return "dark" as const;
    if (level <= 10) return "dim" as const;
    return "bright" as const;
  }
  if (biome === "cave") return "dark" as const;
  return "unknown" as const;
};

const workflowPhase = (workflow: RecordValue | null) => {
  if (!workflow) return "idle" as const;
  const value = canonicalToken(
    firstValue(workflow, ["workflow_state", "state", "event_type"]),
  );
  if (!value) return "unknown" as const;
  if (value === "created" || value === "admitted" || value === "started" || value.endsWith("_started")) {
    return "started" as const;
  }
  if (value === "running" || value === "progress" || value.endsWith("_progress")) {
    return "running" as const;
  }
  if (value === "completed" || value === "succeeded" || value.endsWith("_completed") || value.endsWith("_succeeded")) {
    return "completed" as const;
  }
  if (value === "failed" || value === "timed_out" || value.endsWith("_failed") || value.endsWith("_timed_out")) {
    return "failed" as const;
  }
  if (value === "canceled" || value === "emergency_stopped" || value.endsWith("_canceled")) {
    return "canceled" as const;
  }
  return "unknown" as const;
};

const activityClass = (workflow: RecordValue | null) => {
  if (!workflow) return "exploring" as const;
  const value = canonicalToken(
    firstValue(workflow, ["action_kind", "workflow_kind", "capability_id"]),
  );
  if (!value) return "unknown" as const;
  if (/(?:navigate|walk|follow|travel|move)/u.test(value)) return "navigating" as const;
  if (/(?:mine|break_block|collect)/u.test(value)) return "mining" as const;
  if (/(?:place|build|construct)/u.test(value)) return "building" as const;
  if (/(?:craft|smelt)/u.test(value)) return "crafting" as const;
  if (/(?:attack|combat|fight)/u.test(value)) return "combat" as const;
  if (/(?:interact|container|inventory)/u.test(value)) return "interacting" as const;
  if (/(?:guardian|survival|rescue|recover)/u.test(value)) return "surviving" as const;
  if (/(?:explore|scout)/u.test(value)) return "exploring" as const;
  if (value === "idle") return "idle" as const;
  return "unknown" as const;
};

const truthySignal = (value: unknown): boolean =>
  value === true ||
  (typeof value === "number" && Number.isFinite(value) && value > 0) ||
  ["active", "true", "yes", "present", "danger"].includes(
    canonicalToken(value) ?? "",
  );

const hazardClasses = (hazards: RecordValue | null, actor: RecordValue | null) => {
  const output = new Set<RealtimeTexturePackVisualCuesV1["hazard_classes"][number]>();
  const check = (record: RecordValue | null, keys: string[]): boolean =>
    keys.some((key) => truthySignal(firstValue(record, [key])));
  if (check(hazards, ["lava", "in_lava", "near_lava"])) output.add("lava");
  if (check(hazards, ["fire", "on_fire", "burning"])) output.add("fire");
  if (check(hazards, ["fall", "fall_risk", "falling"])) output.add("fall");
  if (check(hazards, ["submersion", "submerged", "drowning"])) output.add("submersion");
  if (check(hazards, ["hostile_entity", "hostile_entities", "nearby_hostiles"])) output.add("hostile_entity");
  if (check(hazards, ["entrapment", "trapped", "collision_trap"])) output.add("entrapment");
  const health = firstValue(actor, ["health"]);
  if (typeof health === "number" && Number.isFinite(health) && health <= 8) output.add("low_health");
  const air = firstValue(actor, ["air", "air_supply", "breath"]);
  if (typeof air === "number" && Number.isFinite(air) && air <= 40) output.add("low_air");
  const food = firstValue(actor, ["food", "food_level", "hunger"]);
  if (typeof food === "number" && Number.isFinite(food) && food <= 4) output.add("hunger");
  const observed = hazards?.observed;
  if (Array.isArray(observed)) {
    for (const entry of observed) {
      const token = canonicalToken(entry);
      if (token === "lava" || token === "in_lava") output.add("lava");
      else if (token === "fire" || token === "on_fire") output.add("fire");
      else if (token === "fall" || token === "fall_risk") output.add("fall");
      else if (token === "submerged" || token === "submersion") output.add("submersion");
      else if (token === "hostile_entity") output.add("hostile_entity");
      else if (token === "entrapment") output.add("entrapment");
    }
  }
  return [...output].sort();
};

const focusKind = (focus: RecordValue | null) => {
  const value = canonicalToken(firstValue(focus, ["focus_kind", "target_kind", "kind"]));
  if (!value) return "unknown" as const;
  if (/(?:block|support_face)/u.test(value)) return "block" as const;
  if (/(?:entity|actor|mob|player)/u.test(value)) return "entity" as const;
  if (/(?:container|chest|barrel|furnace)/u.test(value)) return "container" as const;
  if (/(?:item|drop)/u.test(value)) return "item" as const;
  if (/(?:terrain|position|waypoint)/u.test(value)) return "terrain" as const;
  if (/(?:ui|screen|menu)/u.test(value)) return "ui" as const;
  return "unknown" as const;
};

const changedCueFamilies = (changedFields: string[]) => {
  const output = new Set<RealtimeTexturePackVisualCuesV1["changed_fields"][number]>();
  for (const field of changedFields) {
    if (/^actor\.(?:dimension|dimension_class)/u.test(field)) output.add("dimension");
    if (/^actor\.biome/u.test(field)) output.add("biome");
    if (/^actor\.(?:time|is_day|daylight)/u.test(field)) output.add("time");
    if (/^actor\.weather/u.test(field)) output.add("weather");
    if (/^actor\.(?:light|lighting)/u.test(field)) output.add("lighting");
    if (/^hazards\./u.test(field)) output.add("hazards");
    if (/^focus\./u.test(field)) output.add("focus");
    if (/^active_workflow/u.test(field)) {
      output.add("workflow");
      output.add("activity");
    }
  }
  return [...output].sort();
};

const minIso = (...values: string[]): string =>
  new Date(Math.min(...values.map((value) => Date.parse(value)))).toISOString();

export const projectMinecraftSituationDigestToVisualCues = (input: {
  binding: RealtimeTexturePackSourceBindingV1;
  support: RealtimeTexturePackVisualDirectionSupportV1;
  digest: HelixEnvironmentSituationDigest;
  now: string;
  previousCue?: RealtimeTexturePackVisualCuesV1 | null;
}): RealtimeTexturePackVisualCuesV1 => {
  const binding = realtimeTexturePackSourceBindingSchema.parse(input.binding);
  const support = realtimeTexturePackVisualDirectionSupportSchema.parse(input.support);
  const digest = helixEnvironmentSituationDigestSchema.parse(input.digest);
  const nowMs = Date.parse(input.now);
  if (!Number.isFinite(nowMs)) throw new Error("realtime_texture_pack_now_invalid");
  const context = binding.environment_context;
  if (!context || binding.mode !== "environment_reactive") {
    throw new Error("realtime_texture_pack_environment_context_required");
  }
  if (support.compatibility_state !== "supported") {
    throw new Error("realtime_texture_pack_visual_direction_not_supported");
  }
  if (
    support.support_id !== context.support_id ||
    support.adapter_profile_id !== context.adapter_profile_id ||
    support.adapter_profile_version !== context.adapter_profile_version ||
    support.controller_profile_id !== context.controller_profile_id ||
    support.controller_profile_version !== context.controller_profile_version ||
    support.cue_schema !== REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA
  ) {
    throw new Error("realtime_texture_pack_support_binding_identity_mismatch");
  }
  if (
    digest.room_id !== context.room_id ||
    digest.source_id !== context.source_id ||
    digest.world_id !== context.world_id ||
    digest.producer_plane !== context.producer_plane ||
    digest.producer_epoch_ref !== context.producer_epoch_ref ||
    digest.subject_ref !== context.subject_ref
  ) {
    throw new Error("realtime_texture_pack_digest_binding_identity_mismatch");
  }
  if (!digest.provenance_valid) {
    throw new Error("realtime_texture_pack_digest_provenance_invalid");
  }
  const observedMs = Date.parse(digest.observed_at);
  if (
    !Number.isFinite(observedMs) ||
    nowMs < observedMs ||
    nowMs - observedMs > context.max_digest_age_ms
  ) {
    throw new Error("realtime_texture_pack_digest_stale");
  }
  if (
    nowMs < Date.parse(support.observed_at) ||
    nowMs < Date.parse(binding.created_at) ||
    nowMs >= Date.parse(binding.expires_at) ||
    nowMs >= Date.parse(support.expires_at)
  ) {
    throw new Error("realtime_texture_pack_visual_direction_binding_stale");
  }

  const actor = isRecord(digest.situation.actor) ? digest.situation.actor : null;
  const hazards = isRecord(digest.situation.hazards) ? digest.situation.hazards : null;
  const focus = isRecord(digest.situation.focus) ? digest.situation.focus : null;
  const workflow = isRecord(digest.situation.active_workflow)
    ? digest.situation.active_workflow
    : null;
  const biome = biomeClass(actor);
  const cueIdentityHash = crypto
    .createHash("sha256")
    .update(
      `${binding.binding_id}\n${binding.binding_revision}\n${digest.digest_hash}`,
      "utf8",
    )
    .digest("hex")
    .slice(0, 48);
  const cue = realtimeTexturePackVisualCuesSchema.parse({
    schema: REALTIME_TEXTURE_PACK_VISUAL_CUES_SCHEMA,
    cue_packet_id: `realtime_texture_pack_visual_cues:${cueIdentityHash}`,
    source_binding_id: binding.binding_id,
    source_binding_revision: binding.binding_revision,
    environment_id: context.environment_id,
    room_id: digest.room_id,
    source_id: digest.source_id,
    world_id: digest.world_id,
    producer_plane: digest.producer_plane,
    producer_epoch_ref: digest.producer_epoch_ref,
    subject_ref: digest.subject_ref,
    observation_revision: digest.latest_event_sequence,
    digest_id: digest.digest_id,
    digest_hash: digest.digest_hash,
    observed_at: digest.observed_at,
    expires_at: minIso(
      new Date(observedMs + context.max_digest_age_ms).toISOString(),
      binding.expires_at,
      support.expires_at,
    ),
    dimension_class: dimensionClass(actor),
    biome_class: biome,
    time_class: timeClass(actor),
    weather_class: weatherClass(actor),
    lighting_class: lightingClass(actor, biome),
    activity_class: activityClass(workflow),
    hazard_classes: hazardClasses(hazards, actor),
    focus_kind: focusKind(focus),
    workflow_phase: workflowPhase(workflow),
    changed_fields: changedCueFamilies(digest.changed_fields),
    evidence_refs: [
      binding.binding_id,
      support.support_id,
      digest.digest_id,
      digest.digest_hash,
      ...digest.latest_event_refs,
    ],
    content_role: "realtime_texture_pack_visual_cues_not_assistant_answer",
    authoritative_visual_output: false,
    authoritative: false,
    authority_class: "non_authoritative_projection_context",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
  assertRealtimeTexturePackCueAdmissibleForBinding({
    binding,
    cue,
    at: input.now,
    previousCue: input.previousCue,
  });
  return cue;
};
