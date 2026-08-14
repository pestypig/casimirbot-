import { z } from "zod";
import {
  helixMinecraftBlockPositionSchema,
  helixMinecraftPlayerActionArgumentsSchema,
  helixMinecraftPositionSchema,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  type HelixMinecraftPlayerActionArguments,
} from "./helix-minecraft-player-capabilities";

export { HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY };
export const HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA =
  "helix.minecraft.player_sequence.v1" as const;
export const HELIX_MINECRAFT_FLUID_CONDITION_OBSERVATION_LIMIT = 512 as const;

export const HELIX_MINECRAFT_FLUID_CONDITION_KINDS = [
  "tick_at_least",
  "player_grounded",
  "health_at_least",
  "food_at_least",
  "position_within",
  "inventory_count_at_least",
  "block_matches",
  "focus_kind_is",
  "focus_reachable",
  "vertical_velocity_at_most",
  "predicted_collision_within",
  "placement_reachable_within",
  "dimension_is",
  "equipment_item_is",
  "portal_nearby",
  "hazard_clear",
  "recipe_craftable",
  "node_outcome_is",
  "checkpoint_satisfied",
] as const;

export const HELIX_MINECRAFT_FLUID_RULESETS = [
  "survival_tas",
  "command_assisted_sandbox",
  "copilot_speedrun",
] as const;

export const HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS = [
  "survival_tas",
] as const;

export const HELIX_MINECRAFT_FLUID_RULESET_DEFINITIONS = Object.freeze({
  survival_tas: {
    execution_plane: "player_embodiment",
    mutating: true,
    description:
      "Automated legal player inputs and typed client workflows. No server commands, host access, RCON, or arbitrary code.",
  },
  command_assisted_sandbox: {
    execution_plane: "world_authority",
    mutating: true,
    description:
      "Separately authorized Minecraft server commands. This ruleset requires a World Authority capability and is not admitted by the Player Embodiment sequence tool.",
  },
  copilot_speedrun: {
    execution_plane: "guidance_only",
    mutating: false,
    description:
      "Player-controlled guidance and checkpoint timing. It does not synthesize player input or server commands.",
  },
} as const);

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const resourceLocationSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
const tickSchema = z.number().int().nonnegative().max(36_000);
const nextNodeSchema = identifierSchema;

export const helixMinecraftFluidRulesetSchema = z.enum(
  HELIX_MINECRAFT_FLUID_RULESETS,
);

export type HelixMinecraftFluidRuleset = z.infer<
  typeof helixMinecraftFluidRulesetSchema
>;

export const isMinecraftFluidRulesetExecutable = (
  ruleset: HelixMinecraftFluidRuleset,
): ruleset is (typeof HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS)[number] =>
  (HELIX_MINECRAFT_EXECUTABLE_FLUID_RULESETS as readonly string[]).includes(
    ruleset,
  );

export const helixMinecraftFluidConditionSchema = z.discriminatedUnion(
  "condition_kind",
  [
    z
      .object({
        condition_kind: z.literal("tick_at_least"),
        tick_index: tickSchema,
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("player_grounded"),
        expected: z.boolean(),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("health_at_least"),
        health: z.number().finite().min(0).max(20),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("food_at_least"),
        food: z.number().int().min(0).max(20),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("position_within"),
        position: helixMinecraftPositionSchema,
        radius: z.number().finite().positive().max(64),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("inventory_count_at_least"),
        item_id: resourceLocationSchema,
        count: z.number().int().nonnegative().max(2_304),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("block_matches"),
        position: helixMinecraftBlockPositionSchema,
        block_id: resourceLocationSchema,
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("focus_kind_is"),
        focus_kind: z.enum(["miss", "block", "entity"]),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("focus_reachable"),
        expected: z.boolean(),
        max_distance: z.number().finite().positive().max(6),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("vertical_velocity_at_most"),
        velocity_y: z.number().finite().min(-16).max(16),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("predicted_collision_within"),
        max_ticks: z.number().int().min(1).max(20),
        expected: z.boolean(),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("placement_reachable_within"),
        position: helixMinecraftBlockPositionSchema,
        horizon_ticks: z.number().int().min(1).max(20),
        expected: z.boolean(),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("dimension_is"),
        dimension: resourceLocationSchema,
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("equipment_item_is"),
        destination: z.enum([
          "main_hand",
          "off_hand",
          "head",
          "chest",
          "legs",
          "feet",
        ]),
        item_id: resourceLocationSchema,
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("portal_nearby"),
        portal_kind: z.enum(["nether_portal", "end_portal", "end_gateway"]),
        radius: z.number().int().positive().max(8),
        expected: z.boolean(),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("hazard_clear"),
        hazard_kinds: z
          .array(
            z.enum([
              "lava",
              "fire",
              "magma",
              "cactus",
              "powder_snow",
              "hostile",
              "void_fall",
            ]),
          )
          .min(1)
          .max(7),
        radius: z.number().int().positive().max(8),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("recipe_craftable"),
        output_item_id: resourceLocationSchema,
        expected: z.boolean(),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("node_outcome_is"),
        node_id: identifierSchema,
        outcome: z.enum(["succeeded", "failed", "timed_out", "canceled"]),
      })
      .strict(),
    z
      .object({
        condition_kind: z.literal("checkpoint_satisfied"),
        checkpoint_id: identifierSchema,
      })
      .strict(),
  ],
);

export type HelixMinecraftFluidCondition = z.infer<
  typeof helixMinecraftFluidConditionSchema
>;

export const helixMinecraftFluidConditionObservationSchema = z
  .object({
    node_id: identifierSchema,
    tick_index: tickSchema,
    condition_kind: z.enum(HELIX_MINECRAFT_FLUID_CONDITION_KINDS),
    satisfied: z.boolean(),
    subject_item_id: resourceLocationSchema.optional(),
    subject_output_item_id: resourceLocationSchema.optional(),
    subject_dimension: resourceLocationSchema.optional(),
    subject_destination: z
      .enum(["main_hand", "off_hand", "head", "chest", "legs", "feet"])
      .optional(),
    subject_portal_kind: z
      .enum(["nether_portal", "end_portal", "end_gateway"])
      .optional(),
    subject_checkpoint_id: identifierSchema.optional(),
    subject_node_id: identifierSchema.optional(),
  })
  .strict();

export type HelixMinecraftFluidConditionObservation = z.infer<
  typeof helixMinecraftFluidConditionObservationSchema
>;

const inputControlStateSchema = z
  .object({
    forward: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
    strafe: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
    sprint: z.boolean(),
    sneak: z.literal(false),
    jump: z.enum(["idle", "pulse", "hold"]),
    use: z.enum(["idle", "pulse"]),
    hotbar_slot: z.number().int().min(0).max(8).nullable().optional(),
    look_delta: z
      .object({
        yaw_degrees: z.number().finite().min(-360).max(360),
        pitch_degrees: z.number().finite().min(-180).max(180),
        max_degrees_per_tick: z.number().finite().positive().max(180),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

const inputSegmentNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("input_segment"),
    earliest_tick: tickSchema,
    duration_ticks: z.number().int().positive().max(1_200),
    controls: inputControlStateSchema,
    on_complete: nextNodeSchema,
    on_failure: nextNodeSchema,
  })
  .strict();

const workflowActionNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("workflow_action"),
    earliest_tick: tickSchema,
    timeout_ticks: z.number().int().positive().max(36_000),
    action: helixMinecraftPlayerActionArgumentsSchema,
    on_success: nextNodeSchema,
    on_failure: nextNodeSchema,
  })
  .strict();

const checkpointNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("checkpoint"),
    earliest_tick: tickSchema,
    checkpoint_id: identifierSchema,
    condition: helixMinecraftFluidConditionSchema,
    wait_up_to_ticks: z.number().int().nonnegative().max(36_000),
    on_satisfied: nextNodeSchema,
    on_timeout: nextNodeSchema,
  })
  .strict();

const branchNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("branch"),
    earliest_tick: tickSchema,
    condition: helixMinecraftFluidConditionSchema,
    on_true: nextNodeSchema,
    on_false: nextNodeSchema,
  })
  .strict();

const terminalNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("terminal"),
    terminal_outcome: z.enum(["succeeded", "failed"]),
    reason_code: identifierSchema,
  })
  .strict();

export const helixMinecraftFluidSequenceNodeSchema = z.discriminatedUnion(
  "node_kind",
  [
    inputSegmentNodeSchema,
    workflowActionNodeSchema,
    checkpointNodeSchema,
    branchNodeSchema,
    terminalNodeSchema,
  ],
);

export type HelixMinecraftFluidSequenceNode = z.infer<
  typeof helixMinecraftFluidSequenceNodeSchema
>;

export const helixMinecraftMutationRegionSchema = z
  .object({
    min: helixMinecraftBlockPositionSchema,
    max: helixMinecraftBlockPositionSchema,
  })
  .strict()
  .superRefine((region, context) => {
    for (const axis of ["x", "y", "z"] as const) {
      if (region.min[axis] > region.max[axis]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max", axis],
          message: "Mutation-region maxima must not be below their minima.",
        });
      }
    }
  });

export const helixMinecraftFluidMutationScopeSchema = z
  .object({
    world_mutation_allowed: z.boolean(),
    max_block_mutations: z.number().int().nonnegative().max(100_000),
    max_inventory_transfers: z.number().int().nonnegative().max(10_000),
    allowed_block_ids: z.array(resourceLocationSchema).max(64),
    allowed_regions: z.array(helixMinecraftMutationRegionSchema).max(16),
    combat_allowed: z.literal(false),
  })
  .strict();

export const helixMinecraftFluidSequenceArgumentsSchema = z
  .object({
    action_kind: z.literal("execute_sequence"),
    sequence_schema: z.literal(HELIX_MINECRAFT_PLAYER_SEQUENCE_SCHEMA),
    sequence_id: identifierSchema,
    ruleset: helixMinecraftFluidRulesetSchema,
    execution_plane: z.literal("player_embodiment"),
    scheduler_engine: z.literal("native_fabric"),
    optimization: z
      .object({
        primary: z.literal("minimize_world_ticks"),
        record_wall_clock: z.literal(true),
        stop_on_first_verified_success: z.literal(true),
      })
      .strict(),
    start_node_id: identifierSchema,
    max_total_ticks: z.number().int().positive().max(36_000),
    required_checkpoint_ids: z.array(identifierSchema).max(64),
    mutation_scope: helixMinecraftFluidMutationScopeSchema,
    nodes: z.array(helixMinecraftFluidSequenceNodeSchema).min(2).max(256),
  })
  .strict()
  .superRefine((sequence, context) => {
    if (!isMinecraftFluidRulesetExecutable(sequence.ruleset)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ruleset"],
        message:
          "The Player Embodiment sequence tool currently admits survival_tas only; other rulesets require their separately governed plane.",
      });
    }

    const nodes = new Map<string, HelixMinecraftFluidSequenceNode>();
    for (const [index, node] of sequence.nodes.entries()) {
      if (nodes.has(node.node_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "node_id"],
          message: "Sequence node identifiers must be unique.",
        });
      }
      nodes.set(node.node_id, node);
    }
    if (!nodes.has(sequence.start_node_id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["start_node_id"],
        message: "The sequence start node must exist.",
      });
    }

    const transitions = (node: HelixMinecraftFluidSequenceNode): string[] => {
      switch (node.node_kind) {
        case "input_segment":
          return [node.on_complete, node.on_failure];
        case "workflow_action":
          return [node.on_success, node.on_failure];
        case "checkpoint":
          return [node.on_satisfied, node.on_timeout];
        case "branch":
          return [node.on_true, node.on_false];
        case "terminal":
          return [];
      }
    };

    for (const [index, node] of sequence.nodes.entries()) {
      for (const target of transitions(node)) {
        if (!nodes.has(target)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index],
            message: `Transition target ${target} does not exist.`,
          });
        }
      }
    }

    const reachable = new Set<string>();
    const active = new Set<string>();
    let cycleReported = false;
    const visit = (nodeId: string): void => {
      if (active.has(nodeId)) {
        if (!cycleReported) {
          cycleReported = true;
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes"],
            message:
              "Fluid sequences must be acyclic; repetition belongs inside a bounded typed workflow node.",
          });
        }
        return;
      }
      if (reachable.has(nodeId)) return;
      const node = nodes.get(nodeId);
      if (!node) return;
      reachable.add(nodeId);
      active.add(nodeId);
      for (const target of transitions(node)) visit(target);
      active.delete(nodeId);
    };
    visit(sequence.start_node_id);
    for (const [index, node] of sequence.nodes.entries()) {
      if (!reachable.has(node.node_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "node_id"],
          message: "Every sequence node must be reachable from the start node.",
        });
      }
    }
    if (
      !sequence.nodes.some(
        (node) =>
          node.node_kind === "terminal" &&
          node.terminal_outcome === "succeeded",
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes"],
        message: "A fluid sequence requires a reachable success terminal.",
      });
    }

    const checkpointIds = new Set<string>();
    for (const [index, node] of sequence.nodes.entries()) {
      if (node.node_kind !== "checkpoint") continue;
      if (checkpointIds.has(node.checkpoint_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nodes", index, "checkpoint_id"],
          message: "Checkpoint identifiers must be unique.",
        });
      }
      checkpointIds.add(node.checkpoint_id);
    }
    const required = new Set<string>();
    for (const [
      index,
      checkpointId,
    ] of sequence.required_checkpoint_ids.entries()) {
      if (required.has(checkpointId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["required_checkpoint_ids", index],
          message: "Required checkpoint identifiers must be unique.",
        });
      }
      required.add(checkpointId);
      if (!checkpointIds.has(checkpointId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["required_checkpoint_ids", index],
          message: "Every required checkpoint must name a checkpoint node.",
        });
      }
    }

    let declaredBlockMutations = 0;
    let declaredInventoryTransfers = 0;
    const allowedBlocks = new Set(sequence.mutation_scope.allowed_block_ids);
    for (const [index, node] of sequence.nodes.entries()) {
      if (node.node_kind !== "workflow_action") continue;
      const action: HelixMinecraftPlayerActionArguments = node.action;
      if (action.action_kind === "mine") {
        declaredBlockMutations += action.count;
        declaredInventoryTransfers += action.count;
        if (!allowedBlocks.has(action.block_id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "action", "block_id"],
            message:
              "Mined blocks must be named by the admitted mutation scope.",
          });
        }
      } else if (action.action_kind === "place") {
        const placementCount = action.positions?.length ?? 1;
        declaredBlockMutations += placementCount;
        declaredInventoryTransfers += placementCount;
        if (!allowedBlocks.has(action.block_id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["nodes", index, "action", "block_id"],
            message:
              "Placed blocks must be named by the admitted mutation scope.",
          });
        }
        if (
          sequence.mutation_scope.allowed_regions.length > 0 &&
          action.positions
        ) {
          for (const [positionIndex, position] of action.positions.entries()) {
            const admitted = sequence.mutation_scope.allowed_regions.some(
              (region) =>
                position.x >= region.min.x &&
                position.x <= region.max.x &&
                position.y >= region.min.y &&
                position.y <= region.max.y &&
                position.z >= region.min.z &&
                position.z <= region.max.z,
            );
            if (!admitted) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["nodes", index, "action", "positions", positionIndex],
                message:
                  "Every exact placement position must lie inside an admitted mutation region.",
              });
            }
          }
        }
      } else if (
        action.action_kind === "collect" ||
        action.action_kind === "craft" ||
        action.action_kind === "inventory_transfer"
      ) {
        declaredInventoryTransfers += action.count;
      } else if (action.action_kind === "equip") {
        declaredInventoryTransfers += 1;
      }
    }
    if (
      declaredBlockMutations > 0 &&
      (!sequence.mutation_scope.world_mutation_allowed ||
        sequence.mutation_scope.max_block_mutations < declaredBlockMutations)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope", "max_block_mutations"],
        message:
          "The mutation scope must explicitly cover every declared mine/place effect.",
      });
    }
    if (
      !sequence.mutation_scope.world_mutation_allowed &&
      (sequence.mutation_scope.max_block_mutations !== 0 ||
        sequence.mutation_scope.allowed_block_ids.length !== 0 ||
        sequence.mutation_scope.allowed_regions.length !== 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope"],
        message:
          "A non-mutating sequence must carry an empty zero-valued world mutation scope.",
      });
    }
    if (
      declaredInventoryTransfers >
      sequence.mutation_scope.max_inventory_transfers
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope", "max_inventory_transfers"],
        message:
          "The inventory-transfer ceiling must cover every declared typed workflow effect.",
      });
    }
  });

export type HelixMinecraftFluidSequenceArguments = z.infer<
  typeof helixMinecraftFluidSequenceArgumentsSchema
>;
