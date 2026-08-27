import { z } from "zod";

const resourceLocationSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
const opaqueRefSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[A-Za-z0-9:._/-]+$/);
const finiteVectorSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
}).strict();
const blockPositionSchema = z.object({
  x: z.number().int().min(-30_000_000).max(30_000_000),
  y: z.number().int().min(-2_048).max(2_048),
  z: z.number().int().min(-30_000_000).max(30_000_000),
}).strict();

export const helixMinecraftCombatTargetLifecycleSchema = z.object({
  target_ref: opaqueRefSchema,
  incarnation_ref: opaqueRefSchema,
  entity_type_id: resourceLocationSchema,
  classification: z.enum([
    "hostile",
    "friendly",
    "passive",
    "neutral",
    "unknown",
  ]),
  alive: z.boolean(),
  targetable: z.boolean(),
  line_of_sight: z.boolean(),
  distance_blocks: z.number().finite().nonnegative(),
  position: finiteVectorSchema,
  velocity: finiteVectorSchema,
  health: z.number().finite().nonnegative().nullable(),
  max_health: z.number().finite().positive().nullable(),
  hurt_time_ticks: z.number().int().nonnegative(),
  death_time_ticks: z.number().int().nonnegative(),
  current_attacker_ref: opaqueRefSchema.nullable(),
  last_damage_source_ref: opaqueRefSchema.nullable(),
}).strict();

export const helixMinecraftProjectileForecastSchema = z.object({
  projectile_ref: opaqueRefSchema,
  incarnation_ref: opaqueRefSchema,
  projectile_type_id: resourceLocationSchema,
  owner_ref: opaqueRefSchema.nullable(),
  position: finiteVectorSchema,
  velocity: finiteVectorSchema,
  acceleration: finiteVectorSchema,
  support_ticks: z.number().int().min(1).max(80),
  predicted_collision_tick: z.number().int().min(0).max(80).nullable(),
  predicted_impact_position: finiteVectorSchema.nullable(),
  threat_classification: z.enum(["collision", "near_miss", "safe", "unknown"]),
  evidence_complete: z.boolean(),
  occluded: z.boolean(),
}).strict().superRefine((value, context) => {
  if (!value.evidence_complete && value.threat_classification === "safe") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["threat_classification"],
      message: "Incomplete projectile evidence cannot be classified safe.",
    });
  }
});

export const helixMinecraftBossStateSchema = z.object({
  boss_ref: opaqueRefSchema,
  incarnation_ref: opaqueRefSchema,
  entity_type_id: resourceLocationSchema,
  health: z.number().finite().nonnegative(),
  max_health: z.number().finite().positive(),
  phase: z.enum(["spawn_invulnerable", "ranged", "armored", "dying", "dead", "unknown"]),
  invulnerability_ticks: z.number().int().nonnegative(),
  tracked_head_target_refs: z.array(opaqueRefSchema.nullable()).length(3),
  boss_bar_visible: z.boolean(),
}).strict();

export const helixMinecraftCombatFrameSchema = z.object({
  schema: z.literal("helix.minecraft_combat_frame.v1"),
  server_instance_id: opaqueRefSchema,
  connector_epoch: opaqueRefSchema,
  actor_ref: opaqueRefSchema,
  actor_incarnation_ref: opaqueRefSchema,
  dimension_id: resourceLocationSchema,
  game_tick: z.number().int().nonnegative(),
  observation_revision: z.string().regex(/^[a-f0-9]{64}$/),
  captured_at: z.string().datetime(),
  actor: z.object({
    position: finiteVectorSchema,
    velocity: finiteVectorSchema,
    yaw_degrees: z.number().finite(),
    pitch_degrees: z.number().finite().min(-90).max(90),
    health: z.number().finite().min(0).max(20),
    absorption: z.number().finite().nonnegative(),
    attack_cooldown: z.number().finite().min(0).max(1),
    main_hand_item_id: resourceLocationSchema.nullable(),
    off_hand_item_id: resourceLocationSchema.nullable(),
    using_item: z.boolean(),
    use_ticks: z.number().int().nonnegative(),
    blocking: z.boolean(),
    on_ground: z.boolean(),
  }).strict(),
  targets: z.array(helixMinecraftCombatTargetLifecycleSchema).max(256),
  projectiles: z.array(helixMinecraftProjectileForecastSchema).max(512),
  bosses: z.array(helixMinecraftBossStateSchema).max(8),
  coverage: z.object({
    radius_blocks: z.number().finite().positive().max(256),
    entity_complete: z.boolean(),
    projectile_complete: z.boolean(),
    clipped_by_chunk_boundary: z.boolean(),
  }).strict(),
}).strict();

const arenaSpawnSchema = z.object({
  label: z.string().regex(/^[a-z0-9_/-]{1,80}$/),
  offset: blockPositionSchema,
  yaw_degrees: z.number().finite().min(-180).max(180),
  pitch_degrees: z.number().finite().min(-90).max(90),
}).strict();

export const helixMinecraftCombatArenaManifestSchema = z.object({
  schema: z.literal("helix.minecraft_combat_arena.v1"),
  arena_id: z.string().regex(/^EH-MC-C[0-8]-[A-Za-z0-9._-]{1,100}$/),
  arena_version: z.number().int().positive(),
  program_gate: z.literal("G8"),
  tier: z.enum(["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]),
  title: z.string().min(1).max(160),
  acceptance_class: z.enum(["deterministic_fixture", "diagnostic_live", "legitimate_survival"]),
  dimension_id: resourceLocationSchema,
  bounds: z.object({ min: blockPositionSchema, max: blockPositionSchema }).strict(),
  structure_asset: z.string().min(1).max(320),
  spawn_points: z.object({
    player: arenaSpawnSchema,
    entities: z.array(arenaSpawnSchema).max(32),
  }).strict(),
  entities: z.array(z.object({
    label: z.string().regex(/^[a-z0-9_/-]{1,80}$/),
    entity_type_id: resourceLocationSchema,
    classification: z.enum(["hostile", "friendly", "passive", "neutral"]),
    adult: z.boolean(),
    armored: z.boolean(),
    projectile_source: z.boolean(),
    admitted_attack_target: z.boolean(),
  }).strict()).max(32),
  equipment: z.array(z.object({
    item_id: resourceLocationSchema,
    count: z.number().int().positive().max(2_304),
    slot: z.enum(["inventory", "main_hand", "off_hand", "head", "chest", "legs", "feet"]),
  }).strict()).max(64),
  rules: z.object({
    game_mode: z.literal("survival"),
    difficulty: z.enum(["easy", "normal", "hard"]),
    keep_inventory: z.boolean(),
    daylight_neutral: z.boolean(),
    mob_spawning: z.literal(false),
    world_authority_released_before_measurement: z.literal(true),
    friendly_fire: z.literal(false),
  }).strict(),
  perturbations: z.array(z.string().min(1).max(160)).max(32),
  success_thresholds: z.array(z.string().min(1).max(240)).min(1).max(32),
  failure_conditions: z.array(z.string().min(1).max(240)).min(1).max(32),
  reset_recipe: z.object({
    mode: z.literal("server_world_snapshot"),
    pre_trial_snapshot_required: z.literal(true),
    fresh_trial_identity_required: z.literal(true),
  }).strict(),
  screenshot_checkpoints: z.array(z.enum([
    "pre_trial",
    "first_target_acquisition",
    "first_defensive_intervention",
    "material_phase_change",
    "terminal_released_controls",
  ])).min(2),
}).strict().superRefine((value, context) => {
  const labels = new Set(value.entities.map((entity) => entity.label));
  for (const spawn of value.spawn_points.entities) {
    if (!labels.has(spawn.label)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["spawn_points", "entities"],
        message: `Spawn label ${spawn.label} has no entity declaration.`,
      });
    }
  }
  if (value.tier === "C0") {
    const admitted = value.entities.filter((entity) => entity.admitted_attack_target);
    if (
      value.entities.length !== 1 ||
      admitted.length !== 1 ||
      admitted[0]?.entity_type_id !== "minecraft:zombie" ||
      admitted[0]?.classification !== "hostile" ||
      admitted[0]?.adult !== true ||
      admitted[0]?.armored !== false ||
      admitted[0]?.projectile_source !== false
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entities"],
        message: "C0 requires exactly one admitted adult, unarmored, non-projectile hostile zombie.",
      });
    }
  }
  if (value.tier === "C1") {
    if (
      value.acceptance_class !== "deterministic_fixture" ||
      value.entities.length !== 0 ||
      value.spawn_points.entities.length !== 0 ||
      value.equipment.length !== 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entities"],
        message: "C1 is a deterministic projectile-only fixture with no mobs or player equipment.",
      });
    }
  }
});

export type HelixMinecraftCombatFrame = z.infer<typeof helixMinecraftCombatFrameSchema>;
export type HelixMinecraftCombatArenaManifest = z.infer<typeof helixMinecraftCombatArenaManifestSchema>;

export const isHelixMinecraftAttackEligibleTarget = (
  target: z.infer<typeof helixMinecraftCombatTargetLifecycleSchema>,
): boolean =>
  target.classification === "hostile" &&
  target.alive &&
  target.targetable &&
  target.line_of_sight;
