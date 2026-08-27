import { z } from "zod";

export const HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY =
  "com.casimirbot.minecraft.player.workflow.status" as const;
export const HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY =
  "com.casimirbot.minecraft.player.navigate" as const;
export const HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY =
  "com.casimirbot.minecraft.player.look" as const;
export const HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY =
  "com.casimirbot.minecraft.player.camera.track" as const;
export const HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY =
  "com.casimirbot.minecraft.player.walk" as const;
export const HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY =
  "com.casimirbot.minecraft.player.jump" as const;
export const HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY =
  "com.casimirbot.minecraft.player.interact" as const;
export const HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY =
  "com.casimirbot.minecraft.player.combat.attack" as const;
export const HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY =
  "com.casimirbot.minecraft.player.combat.guard" as const;
export const HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY =
  "com.casimirbot.minecraft.player.hotbar.select" as const;
export const HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY =
  "com.casimirbot.minecraft.player.equipment.equip" as const;
export const HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY =
  "com.casimirbot.minecraft.player.workflow.cancel" as const;
export const HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY =
  "com.casimirbot.minecraft.player.workflow.resume" as const;
export const HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY =
  "com.casimirbot.minecraft.player.emergency_stop" as const;

export const HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY =
  "com.casimirbot.minecraft.player.follow" as const;
export const HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY =
  "com.casimirbot.minecraft.player.collect" as const;
export const HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY =
  "com.casimirbot.minecraft.player.mine" as const;
export const HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY =
  "com.casimirbot.minecraft.player.place" as const;
export const HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY =
  "com.casimirbot.minecraft.player.craft" as const;
export const HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY =
  "com.casimirbot.minecraft.player.inventory.transfer" as const;
export const HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY =
  "com.casimirbot.minecraft.player.sequence.execute" as const;
export const HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY =
  "com.casimirbot.minecraft.player.guardian.execute" as const;
export const HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY =
  "com.casimirbot.minecraft.player.viability_guardian.arm" as const;
export const HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY =
  "com.casimirbot.minecraft.player.viability_guardian.disarm" as const;

export const HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CANCEL_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_RESUME_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
] as const);

export const HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
] as const);

export const HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS,
] as const);

export const HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS = Object.freeze([
  ...HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
] as const);

export const HELIX_MINECRAFT_PLAYER_ACTION_KINDS = [
  "navigate_to",
  "look_at",
  "track_target",
  "walk",
  "jump",
  "interact",
  "attack",
  "combat_guard",
  "hotbar_select",
  "equip",
  "follow",
  "collect",
  "mine",
  "place",
  "craft",
  "inventory_transfer",
] as const;

export const HELIX_MINECRAFT_PLAYER_CONTROL_ENGINES = [
  "native_fabric",
  "baritone",
] as const;

const coordinateSchema = z.number().finite().min(-30_000_000).max(30_000_000);
const yCoordinateSchema = z.number().finite().min(-2_048).max(2_048);
const resourceLocationSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
const subjectRefSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);

export const helixMinecraftPositionSchema = z
  .object({
    x: coordinateSchema,
    y: yCoordinateSchema,
    z: coordinateSchema,
  })
  .strict();

export const helixMinecraftBlockPositionSchema = z
  .object({
    x: z.number().int().min(-30_000_000).max(30_000_000),
    y: z.number().int().min(-2_048).max(2_048),
    z: z.number().int().min(-30_000_000).max(30_000_000),
  })
  .strict();

export const helixMinecraftPlayerActionArgumentsSchema = z
  .discriminatedUnion("action_kind", [
    z
      .object({
        action_kind: z.literal("navigate_to"),
        destination: helixMinecraftPositionSchema,
        arrival_radius: z.number().finite().min(0.25).max(16),
        allow_sprint: z.boolean(),
        allow_dig: z.literal(false),
        allow_place: z.literal(false),
        engine_preference: z.enum([
          "adapter_selected",
          "native_fabric",
          "baritone",
        ]),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("look_at"),
        target: z.discriminatedUnion("target_kind", [
          z
            .object({
              target_kind: z.literal("position"),
              position: helixMinecraftPositionSchema,
            })
            .strict(),
          z
            .object({
              target_kind: z.literal("current_focus"),
            })
            .strict(),
          z
            .object({
              target_kind: z.literal("relative_rotation"),
              yaw_delta_degrees: z
                .number()
                .finite()
                .min(-180)
                .max(180)
                .describe(
                  "Positive values turn right; negative values turn left.",
                ),
              pitch_delta_degrees: z
                .number()
                .finite()
                .min(-180)
                .max(180)
                .describe(
                  "Positive values look down; negative values look up.",
                ),
            })
            .strict(),
          z
            .object({
              target_kind: z.literal("environment_subject"),
              subject_ref: subjectRefSchema,
            })
            .strict(),
        ]),
        max_turn_degrees_per_tick: z.number().finite().positive().max(180),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("track_target"),
        target: z.discriminatedUnion("target_kind", [
          z
            .object({
              target_kind: z.literal("entity_type"),
              entity_type_id: resourceLocationSchema,
              selection: z.literal("nearest"),
            })
            .strict(),
          z
            .object({
              target_kind: z.literal("current_focus_entity"),
            })
            .strict(),
          z
            .object({
              target_kind: z.literal("particle_type"),
              particle_type_id: resourceLocationSchema,
              selection: z.literal("nearest"),
              continuity: z.enum(["single_instance", "same_type_stream"]),
              handoff_radius: z.number().finite().min(0).max(8),
              max_handoffs: z.number().int().min(0).max(1_000),
            })
            .strict(),
        ]),
        aim_point: z.enum(["center", "render_center", "eyes", "feet"]),
        max_acquisition_distance: z.number().finite().min(1).max(128),
        max_duration_ms: z
          .number()
          .int()
          .min(1_000)
          .max(5 * 60_000),
        max_turn_degrees_per_tick: z.number().finite().min(0.1).max(180),
        max_angular_acceleration_degrees_per_tick_squared: z
          .number()
          .finite()
          .min(0.01)
          .max(180),
        prediction_ticks: z.number().int().min(0).max(10),
        deadband_degrees: z.number().finite().min(0).max(10),
        reacquire_ticks: z.number().int().min(0).max(200),
        require_line_of_sight: z.boolean(),
        stop_below_health: z.number().finite().min(1).max(20),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("walk"),
        direction: z.enum(["forward", "back", "left", "right"]),
        duration_ms: z.number().int().min(50).max(10_000),
        sprint: z.boolean(),
        jump: z.boolean().optional(),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("jump"),
        count: z.number().int().min(1).max(10),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("interact"),
        target: z.enum([
          "current_focus",
          "looked_at_block",
          "looked_at_entity",
        ]),
        hand: z.enum(["main_hand", "off_hand"]),
        interaction: z.enum(["use", "interact"]),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("attack"),
        target_ref: subjectRefSchema.describe(
          "Opaque exact entity incarnation reference returned by a prior target-lock receipt.",
        ),
        target_entity_type_id: resourceLocationSchema,
        target_classification: z.literal("hostile"),
        max_acquisition_distance: z.number().finite().min(1).max(16),
        require_line_of_sight: z.literal(true),
        minimum_attack_cooldown: z.number().finite().min(0.1).max(1),
        max_attack_pulses: z.number().int().min(1).max(64),
        max_duration_ms: z.number().int().min(1_000).max(60_000),
        stop_below_health: z.number().finite().min(1).max(20),
        friendly_fire: z.literal(false),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("combat_guard"),
        hostile_entity_type_ids: z
          .array(resourceLocationSchema)
          .min(1)
          .max(16),
        max_acquisition_distance: z.number().finite().min(2).max(32),
        require_line_of_sight: z.literal(true),
        minimum_attack_cooldown: z.number().finite().min(0.1).max(1),
        max_attack_pulses: z.number().int().min(1).max(256),
        max_target_switches: z.number().int().min(0).max(64),
        target_commit_ticks: z.number().int().min(0).max(200),
        retreat_start_distance: z.number().finite().min(1).max(6),
        retreat_stop_distance: z.number().finite().min(1).max(8),
        retreat_when_hostile_count_at_least: z.number().int().min(1).max(16),
        max_duration_ms: z.number().int().min(1_000).max(120_000),
        stop_below_health: z.number().finite().min(1).max(20),
        friendly_fire: z.literal(false),
        approach_policy: z
          .enum(["none", "direct_bounded", "local_reroute_bounded"])
          .optional(),
        max_approach_ticks: z.number().int().min(0).max(1_200).optional(),
        cover_policy: z.enum(["none", "lateral_bounded"]).optional(),
        max_cover_ticks: z.number().int().min(0).max(1_200).optional(),
        projectile_response: z
          .enum(["none", "sidestep", "shield_or_sidestep"])
          .optional(),
        projectile_evasion_horizon_ticks: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional(),
        max_evasion_ticks: z.number().int().min(0).max(1_200).optional(),
        shield_hand: z.enum(["none", "off_hand"]).optional(),
        max_shield_hold_ticks: z.number().int().min(0).max(1_200).optional(),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("hotbar_select"),
        slot: z.number().int().min(0).max(8),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("equip"),
        item_id: resourceLocationSchema,
        destination: z.enum([
          "main_hand",
          "off_hand",
          "head",
          "chest",
          "legs",
          "feet",
        ]),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("follow"),
        subject_ref: subjectRefSchema,
        distance: z.number().finite().min(1).max(64),
        max_duration_ms: z
          .number()
          .int()
          .min(1_000)
          .max(30 * 60_000),
        stop_below_health: z.number().finite().min(1).max(20),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("collect"),
        item_or_block_id: resourceLocationSchema,
        count: z.number().int().min(1).max(2_304),
        search_radius: z.number().finite().positive().max(128),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("mine"),
        block_id: resourceLocationSchema,
        count: z.number().int().min(1).max(4_096),
        search_radius: z.number().int().positive().max(32),
        target_position: helixMinecraftBlockPositionSchema
          .optional()
          .describe(
            "Optional exact loaded block to mine. When supplied, count must be 1 and the block must still match block_id inside the admitted search radius.",
          ),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("place"),
        block_id: resourceLocationSchema,
        positions: z
          .array(helixMinecraftBlockPositionSchema)
          .min(1)
          .max(256)
          .optional()
          .describe(
            "Exact admitted integer placement cells. Supply either positions or position_binding, never both.",
          ),
        position_binding: z
          .object({
            binding_kind: z.literal("predicted_collision_cell"),
            horizon_ticks: z.number().int().min(1).max(20),
            max_distance_blocks: z.number().finite().positive().max(6),
            require_replaceable: z.literal(true),
          })
          .strict()
          .optional()
          .describe(
            "A bounded Fabric-local data binding that resolves the predicted landing cell from current measured trajectory. It does not choose strategy or permit arbitrary coordinates.",
          ),
        placement_method: z.enum(["block_item", "item_use"]).optional(),
        source_item_id: resourceLocationSchema.optional(),
        hand: z.enum(["main_hand", "off_hand"]).optional(),
        cleanup_after_landing: z.literal(true).optional(),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("craft"),
        output_item_id: resourceLocationSchema,
        count: z.number().int().min(1).max(2_304),
        recipe_id: resourceLocationSchema.nullable().optional(),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("inventory_transfer"),
        direction: z.enum(["deposit", "withdraw"]),
        item_id: resourceLocationSchema,
        count: z.number().int().min(1).max(2_304),
        container_target: z.enum([
          "current_open_container",
          "looked_at_container",
        ]),
      })
      .strict(),
  ])
  .superRefine((value, context) => {
    if (value.action_kind === "combat_guard") {
      if (value.retreat_stop_distance <= value.retreat_start_distance) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["retreat_stop_distance"],
          message: "retreat_stop_distance must exceed retreat_start_distance",
        });
      }
      const approachPolicy = value.approach_policy ?? "none";
      const maxApproachTicks = value.max_approach_ticks ?? 0;
      if (
        (approachPolicy !== "none") !==
        (maxApproachTicks > 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_approach_ticks"],
          message:
            "an approach policy requires a positive max_approach_ticks budget",
        });
      }
      const coverPolicy = value.cover_policy ?? "none";
      const maxCoverTicks = value.max_cover_ticks ?? 0;
      if (
        (coverPolicy === "lateral_bounded") !==
        (maxCoverTicks > 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_cover_ticks"],
          message:
            "lateral_bounded requires a positive max_cover_ticks budget",
        });
      }
      const projectileResponse = value.projectile_response ?? "none";
      const maxEvasionTicks = value.max_evasion_ticks ?? 0;
      const shieldHand = value.shield_hand ?? "none";
      const maxShieldHoldTicks = value.max_shield_hold_ticks ?? 0;
      if (projectileResponse !== "none" && maxEvasionTicks === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_evasion_ticks"],
          message: "projectile response requires a positive evasion budget",
        });
      }
      if (
        projectileResponse === "shield_or_sidestep"
          ? shieldHand !== "off_hand" || maxShieldHoldTicks === 0
          : shieldHand !== "none" || maxShieldHoldTicks !== 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["shield_hand"],
          message:
            "shield authority requires shield_or_sidestep, off_hand, and a positive hold budget",
        });
      }
      return;
    }
    if (
      value.action_kind === "mine" &&
      value.target_position &&
      value.count !== 1
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: "Exact-target mining requires count to equal 1.",
      });
      return;
    }
    if (value.action_kind === "place") {
      if (
        (value.positions === undefined) ===
        (value.position_binding === undefined)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["positions"],
          message:
            "Placement requires exactly one target source: exact positions or one bounded position_binding.",
        });
      }
      const method = value.placement_method ?? "block_item";
      if (method === "item_use") {
        if (!value.source_item_id) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["source_item_id"],
            message: "item_use placement requires the exact source item",
          });
        }
        if (!value.hand) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hand"],
            message: "item_use placement requires the exact player hand",
          });
        }
        if (
          value.cleanup_after_landing === true &&
          !(
            value.block_id === "minecraft:water" &&
            value.source_item_id === "minecraft:water_bucket" &&
            value.position_binding?.binding_kind ===
              "predicted_collision_cell"
          )
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["cleanup_after_landing"],
            message:
              "Landing cleanup is limited to a predicted-collision water-bucket rescue.",
          });
        }
      } else if (value.source_item_id || value.hand) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["placement_method"],
          message:
            "block_item placement derives its source item and main hand from block_id",
        });
      } else if (value.cleanup_after_landing) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cleanup_after_landing"],
          message: "Landing cleanup requires item_use placement.",
        });
      }
      return;
    }
    if (
      value.action_kind !== "track_target" ||
      value.target.target_kind !== "particle_type"
    )
      return;
    const target = value.target;
    const valid =
      target.continuity === "single_instance"
        ? target.handoff_radius === 0 && target.max_handoffs === 0
        : target.handoff_radius > 0 && target.max_handoffs > 0;
    if (!valid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["target", "continuity"],
        message:
          "single_instance requires zero handoff scope; same_type_stream requires a positive handoff radius and budget",
      });
    }
  });

export type HelixMinecraftPlayerActionArguments = z.infer<
  typeof helixMinecraftPlayerActionArgumentsSchema
>;

export const minecraftPlayerCapabilityForActionKind = (
  actionKind: HelixMinecraftPlayerActionArguments["action_kind"],
): (typeof HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS)[number] => {
  switch (actionKind) {
    case "navigate_to":
      return HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY;
    case "look_at":
      return HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY;
    case "track_target":
      return HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY;
    case "walk":
      return HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY;
    case "jump":
      return HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY;
    case "interact":
      return HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY;
    case "attack":
      return HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY;
    case "combat_guard":
      return HELIX_MINECRAFT_PLAYER_COMBAT_GUARD_CAPABILITY;
    case "hotbar_select":
      return HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY;
    case "equip":
      return HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY;
    case "follow":
      return HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY;
    case "collect":
      return HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY;
    case "mine":
      return HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY;
    case "place":
      return HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY;
    case "craft":
      return HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY;
    case "inventory_transfer":
      return HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY;
  }
};
