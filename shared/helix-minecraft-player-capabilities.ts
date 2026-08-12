import { z } from "zod";

export const HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY =
  "com.casimirbot.minecraft.player.workflow.status" as const;
export const HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY =
  "com.casimirbot.minecraft.player.navigate" as const;
export const HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY =
  "com.casimirbot.minecraft.player.look" as const;
export const HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY =
  "com.casimirbot.minecraft.player.walk" as const;
export const HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY =
  "com.casimirbot.minecraft.player.jump" as const;
export const HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY =
  "com.casimirbot.minecraft.player.interact" as const;
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

export const HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS = Object.freeze([
  HELIX_MINECRAFT_PLAYER_STATUS_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
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
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS,
] as const);

export const HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS = Object.freeze([
  ...HELIX_MINECRAFT_PLAYER_MVP_CAPABILITY_IDS,
  ...HELIX_MINECRAFT_PLAYER_WORKFLOW_CAPABILITY_IDS,
] as const);

export const HELIX_MINECRAFT_PLAYER_ACTION_KINDS = [
  "navigate_to",
  "look_at",
  "walk",
  "jump",
  "interact",
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

export const helixMinecraftPlayerActionArgumentsSchema = z.discriminatedUnion(
  "action_kind",
  [
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
          z.object({
            target_kind: z.literal("position"),
            position: helixMinecraftPositionSchema,
          }).strict(),
          z.object({
            target_kind: z.literal("current_focus"),
          }).strict(),
          z.object({
            target_kind: z.literal("relative_rotation"),
            yaw_delta_degrees: z
              .number()
              .finite()
              .min(-180)
              .max(180)
              .describe("Positive values turn right; negative values turn left."),
            pitch_delta_degrees: z
              .number()
              .finite()
              .min(-180)
              .max(180)
              .describe("Positive values look down; negative values look up."),
          }).strict(),
          z.object({
            target_kind: z.literal("environment_subject"),
            subject_ref: subjectRefSchema,
          }).strict(),
        ]),
        max_turn_degrees_per_tick: z.number().finite().positive().max(180),
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("walk"),
        direction: z.enum(["forward", "back", "left", "right"]),
        duration_ms: z.number().int().min(50).max(10_000),
        sprint: z.boolean(),
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
        target: z.enum(["current_focus", "looked_at_block", "looked_at_entity"]),
        hand: z.enum(["main_hand", "off_hand"]),
        interaction: z.enum(["use", "interact"]),
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
        max_duration_ms: z.number().int().min(1_000).max(30 * 60_000),
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
      })
      .strict(),
    z
      .object({
        action_kind: z.literal("place"),
        block_id: resourceLocationSchema,
        positions: z.array(helixMinecraftBlockPositionSchema).min(1).max(256),
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
        container_target: z.enum(["current_open_container", "looked_at_container"]),
      })
      .strict(),
  ],
);

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
    case "walk":
      return HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY;
    case "jump":
      return HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY;
    case "interact":
      return HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY;
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
