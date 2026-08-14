import { z } from "zod";
import {
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  helixMinecraftPlayerActionArgumentsSchema,
  type HelixMinecraftPlayerActionArguments,
} from "./helix-minecraft-player-capabilities";
import {
  HELIX_MINECRAFT_FLUID_CONDITION_KINDS,
  helixMinecraftFluidConditionSchema,
  helixMinecraftFluidConditionObservationSchema,
  helixMinecraftFluidMutationScopeSchema,
  helixMinecraftFluidRulesetSchema,
  isMinecraftFluidRulesetExecutable,
} from "./helix-minecraft-fluid-sequence";

export { HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY };
export const HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA =
  "helix.minecraft.reactive_program.v1" as const;

export const HELIX_MINECRAFT_REACTIVE_LANE_KINDS = [
  "camera",
  "locomotion",
  "inventory",
  "hand",
  "world",
  "safety",
] as const;

export const HELIX_MINECRAFT_REACTIVE_RESOURCES = [
  "camera",
  "locomotion",
  "hotbar",
  "main_hand",
  "off_hand",
  "inventory",
  "world",
  "native_workflow",
  "safety",
] as const;

export type HelixMinecraftReactiveResource =
  (typeof HELIX_MINECRAFT_REACTIVE_RESOURCES)[number];

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const tickSchema = z.number().int().nonnegative().max(36_000);
const resourceSchema = z.enum(HELIX_MINECRAFT_REACTIVE_RESOURCES);

const embeddedActionSchema = helixMinecraftPlayerActionArgumentsSchema;

export const minecraftReactiveResourcesForAction = (
  action: HelixMinecraftPlayerActionArguments,
): readonly HelixMinecraftReactiveResource[] => {
  switch (action.action_kind) {
    case "navigate_to":
      return ["camera", "locomotion"];
    case "look_at":
    case "track_target":
      return ["camera"];
    case "walk":
    case "jump":
      return ["locomotion"];
    case "interact":
      return [action.hand];
    case "hotbar_select":
      return ["hotbar"];
    case "equip":
      return ["hotbar", "main_hand", "off_hand", "inventory"];
    case "follow":
      return ["camera", "locomotion", "native_workflow"];
    case "collect":
      return ["camera", "locomotion", "inventory", "native_workflow"];
    case "mine":
      return ["camera", "locomotion", "main_hand", "world", "native_workflow"];
    case "place":
      return action.placement_method === "item_use" &&
        action.hand === "off_hand"
        ? [
            "camera",
            "locomotion",
            "off_hand",
            "inventory",
            "world",
            "native_workflow",
          ]
        : [
            "camera",
            "locomotion",
            "hotbar",
            "main_hand",
            "inventory",
            "world",
            "native_workflow",
          ];
    case "craft":
      return ["inventory", "native_workflow"];
    case "inventory_transfer":
      return ["inventory", "native_workflow"];
  }
};

const actionNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("action"),
    earliest_tick: tickSchema,
    timeout_ticks: z.number().int().positive().max(36_000),
    action: embeddedActionSchema,
    on_success: identifierSchema,
    on_failure: identifierSchema,
    on_timeout: identifierSchema,
  })
  .strict();

const repeatNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("repeat"),
    earliest_tick: tickSchema,
    action: embeddedActionSchema,
    max_iterations: z.number().int().positive().max(256),
    timeout_ticks: z.number().int().positive().max(36_000),
    until_condition: z
      .discriminatedUnion("condition_kind", [
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
            condition_kind: z.literal("inventory_count_at_least"),
            item_id: z.string().regex(/^[a-z0-9_.-]+:[a-z0-9_./-]+$/),
            count: z.number().int().nonnegative().max(2_304),
          })
          .strict(),
        z
          .object({
            condition_kind: z.literal("checkpoint_satisfied"),
            checkpoint_id: identifierSchema,
          })
          .strict(),
      ])
      .optional(),
    on_complete: identifierSchema,
    on_failure: identifierSchema,
    on_timeout: identifierSchema,
  })
  .strict();

const maintainNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("maintain"),
    earliest_tick: tickSchema,
    action: embeddedActionSchema,
    while_condition: z.discriminatedUnion("condition_kind", [
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
    ]),
    max_restarts: z.number().int().nonnegative().max(256),
    max_duration_ticks: z.number().int().positive().max(36_000),
    on_condition_false: identifierSchema,
    on_failure: identifierSchema,
    on_timeout: identifierSchema,
  })
  .strict();

const eventNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("event"),
    earliest_tick: tickSchema,
    condition: helixMinecraftFluidConditionSchema,
    trigger_when: z.enum(["satisfied", "not_satisfied"]),
    debounce_ticks: z.number().int().positive().max(200),
    wait_up_to_ticks: z.number().int().nonnegative().max(36_000),
    on_event: identifierSchema,
    on_timeout: identifierSchema,
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
    on_satisfied: identifierSchema,
    on_timeout: identifierSchema,
  })
  .strict();

const branchNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("branch"),
    earliest_tick: tickSchema,
    condition: helixMinecraftFluidConditionSchema,
    on_true: identifierSchema,
    on_false: identifierSchema,
  })
  .strict();

const terminalNodeSchema = z
  .object({
    node_id: identifierSchema,
    node_kind: z.literal("terminal"),
    terminal_outcome: z.enum(["succeeded", "failed", "canceled"]),
    reason_code: identifierSchema,
  })
  .strict();

export const helixMinecraftReactiveNodeSchema = z.discriminatedUnion(
  "node_kind",
  [
    actionNodeSchema,
    repeatNodeSchema,
    maintainNodeSchema,
    eventNodeSchema,
    checkpointNodeSchema,
    branchNodeSchema,
    terminalNodeSchema,
  ],
);

export type HelixMinecraftReactiveNode = z.infer<
  typeof helixMinecraftReactiveNodeSchema
>;

const laneSchema = z
  .object({
    lane_id: identifierSchema,
    lane_kind: z.enum(HELIX_MINECRAFT_REACTIVE_LANE_KINDS),
    priority: z.number().int().min(0).max(255),
    required: z
      .boolean()
      .describe(
        "Must be true for required immediate work and false for every interrupt-only lane.",
      ),
    activation: z
      .enum(["immediate", "interrupt_only"])
      .describe(
        "Immediate lanes start with the program. Interrupt-only lanes stay dormant until activated and must set required false.",
      ),
    resource_ceiling: z.array(resourceSchema).max(9),
    start_node_id: identifierSchema,
    nodes: z.array(helixMinecraftReactiveNodeSchema).min(1).max(128),
  })
  .strict();

const interruptSchema = z
  .object({
    interrupt_id: identifierSchema,
    priority: z.number().int().min(0).max(255),
    condition: helixMinecraftFluidConditionSchema,
    trigger_when: z.enum(["satisfied", "not_satisfied"]),
    debounce_ticks: z.number().int().positive().max(200),
    activate_lane_id: identifierSchema.describe(
      "Exact ID of a lane declared with activation interrupt_only and required false.",
    ),
    cancel_lane_ids: z.array(identifierSchema).max(8),
    max_activations: z.literal(1),
  })
  .strict();

const raceSchema = z
  .object({
    race_id: identifierSchema,
    lane_ids: z.array(identifierSchema).min(2).max(8),
    settle_on: z.enum(["first_succeeded", "first_terminal"]),
    cancel_remaining: z.literal(true),
  })
  .strict();

const transitions = (node: HelixMinecraftReactiveNode): string[] => {
  switch (node.node_kind) {
    case "action":
      return [node.on_success, node.on_failure, node.on_timeout];
    case "repeat":
      return [node.on_complete, node.on_failure, node.on_timeout];
    case "maintain":
      return [node.on_condition_false, node.on_failure, node.on_timeout];
    case "event":
      return [node.on_event, node.on_timeout];
    case "checkpoint":
      return [node.on_satisfied, node.on_timeout];
    case "branch":
      return [node.on_true, node.on_false];
    case "terminal":
      return [];
  }
};

const negativeOutcomeTransitions = (
  node: HelixMinecraftReactiveNode,
): string[] => {
  switch (node.node_kind) {
    case "action":
    case "repeat":
      return [node.on_failure, node.on_timeout];
    case "maintain":
      return [node.on_failure, node.on_timeout];
    case "event":
    case "checkpoint":
      return [node.on_timeout];
    case "branch":
    case "terminal":
      return [];
  }
};

const nodeActions = (
  node: HelixMinecraftReactiveNode,
): HelixMinecraftPlayerActionArguments[] =>
  node.node_kind === "action" ||
  node.node_kind === "repeat" ||
  node.node_kind === "maintain"
    ? [node.action]
    : [];

export const helixMinecraftReactiveProgramArgumentsSchema = z
  .object({
    action_kind: z.literal("execute_reactive_program"),
    program_schema: z.literal(HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA),
    program_id: identifierSchema,
    ruleset: helixMinecraftFluidRulesetSchema,
    execution_plane: z.literal("player_embodiment"),
    scheduler_engine: z.literal("native_fabric_concurrent"),
    max_total_ticks: z.number().int().positive().max(36_000),
    completion_policy: z
      .object({
        mode: z.enum(["all_required", "first_success"]),
        cancel_remaining_on_settle: z.literal(true),
      })
      .strict(),
    mutation_scope: helixMinecraftFluidMutationScopeSchema,
    lanes: z.array(laneSchema).min(1).max(8),
    races: z.array(raceSchema).max(8),
    interrupts: z.array(interruptSchema).max(16),
  })
  .strict()
  .superRefine((program, context) => {
    if (!isMinecraftFluidRulesetExecutable(program.ruleset)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ruleset"],
        message:
          "The Player Embodiment reactive program currently admits survival_tas only.",
      });
    }

    const lanes = new Map(program.lanes.map((lane) => [lane.lane_id, lane]));
    if (lanes.size !== program.lanes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes"],
        message: "Reactive lane identifiers must be unique.",
      });
    }
    if (!program.lanes.some((lane) => lane.activation === "immediate")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes"],
        message: "A reactive program requires at least one immediate lane.",
      });
    }

    const observationIds = [
      ...program.lanes.flatMap((lane) =>
        lane.nodes.map((node) => node.node_id),
      ),
      ...program.interrupts.map((interrupt) => interrupt.interrupt_id),
    ];
    if (new Set(observationIds).size !== observationIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lanes"],
        message:
          "Reactive node and interrupt identifiers must be globally unique so condition evidence has one exact origin.",
      });
    }

    let declaredBlockMutations = 0;
    let declaredInventoryTransfers = 0;
    const allowedBlocks = new Set(program.mutation_scope.allowed_block_ids);

    for (const [laneIndex, lane] of program.lanes.entries()) {
      const ceiling = new Set(lane.resource_ceiling);
      if (ceiling.size !== lane.resource_ceiling.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "resource_ceiling"],
          message: "A lane resource ceiling cannot contain duplicates.",
        });
      }
      if (lane.lane_kind === "safety" && !ceiling.has("safety")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "resource_ceiling"],
          message: "A safety lane must declare the safety resource.",
        });
      }
      const nodes = new Map(lane.nodes.map((node) => [node.node_id, node]));
      if (nodes.size !== lane.nodes.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "nodes"],
          message: "Node identifiers must be unique inside each lane.",
        });
      }
      if (!nodes.has(lane.start_node_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "start_node_id"],
          message: "The lane start node must exist in that lane.",
        });
      }
      if (lane.required && lane.activation !== "immediate") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "required"],
          message: "A required lane must activate immediately.",
        });
      }
      for (const [nodeIndex, node] of lane.nodes.entries()) {
        for (const target of transitions(node)) {
          if (!nodes.has(target)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["lanes", laneIndex, "nodes", nodeIndex],
              message: `Lane transition target ${target} does not exist.`,
            });
          }
        }
        for (const target of negativeOutcomeTransitions(node)) {
          const terminal = nodes.get(target);
          if (
            terminal?.node_kind === "terminal" &&
            terminal.terminal_outcome === "succeeded"
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["lanes", laneIndex, "nodes", nodeIndex],
              message:
                `Reactive ${node.node_kind} failure or timeout cannot transition directly to succeeded terminal ${target}; route it to a failed/canceled terminal or through explicit recovery work.`,
            });
          }
        }
        for (const action of nodeActions(node)) {
          if (
            action.action_kind === "follow" ||
            (action.action_kind === "look_at" &&
              action.target.target_kind === "environment_subject")
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
              message:
                "Reactive subject-bound actions require nested room-identity resolution and are not yet admitted; use entity/particle tracking or a separate resolved follow action.",
            });
          }
          for (const resource of minecraftReactiveResourcesForAction(action)) {
            if (!ceiling.has(resource)) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["lanes", laneIndex, "nodes", nodeIndex, "action"],
                message: `Action ${action.action_kind} requires undeclared lane resource ${resource}.`,
              });
            }
          }
          const multiplier =
            node.node_kind === "repeat"
              ? node.max_iterations
              : node.node_kind === "maintain"
                ? node.max_restarts + 1
                : 1;
          if (action.action_kind === "mine") {
            declaredBlockMutations += action.count * multiplier;
            declaredInventoryTransfers += action.count * multiplier;
            if (!allowedBlocks.has(action.block_id)) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: [
                  "lanes",
                  laneIndex,
                  "nodes",
                  nodeIndex,
                  "action",
                  "block_id",
                ],
                message:
                  "Mined blocks must be named by the admitted mutation scope.",
              });
            }
          } else if (action.action_kind === "place") {
            const placementCount = action.positions?.length ?? 1;
            declaredBlockMutations += placementCount * multiplier;
            declaredInventoryTransfers += placementCount * multiplier;
            if (!allowedBlocks.has(action.block_id)) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                path: [
                  "lanes",
                  laneIndex,
                  "nodes",
                  nodeIndex,
                  "action",
                  "block_id",
                ],
                message:
                  "Placed blocks must be named by the admitted mutation scope.",
              });
            }
            if (
              program.mutation_scope.allowed_regions.length > 0 &&
              action.positions
            ) {
              for (const [
                positionIndex,
                position,
              ] of action.positions.entries()) {
                const admitted = program.mutation_scope.allowed_regions.some(
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
                    path: [
                      "lanes",
                      laneIndex,
                      "nodes",
                      nodeIndex,
                      "action",
                      "positions",
                      positionIndex,
                    ],
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
            declaredInventoryTransfers += action.count * multiplier;
          } else if (action.action_kind === "equip") {
            declaredInventoryTransfers += multiplier;
          }
        }
      }
      if (!lane.nodes.some((node) => node.node_kind === "terminal")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lanes", laneIndex, "nodes"],
          message: "Every reactive lane requires a terminal node.",
        });
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
              path: ["lanes", laneIndex, "nodes"],
              message:
                "Reactive lane graphs must be acyclic; bounded repetition belongs inside repeat or maintain nodes.",
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
      visit(lane.start_node_id);
      for (const [nodeIndex, node] of lane.nodes.entries()) {
        if (!reachable.has(node.node_id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lanes", laneIndex, "nodes", nodeIndex, "node_id"],
            message:
              "Every lane node must be reachable from its lane start node.",
          });
        }
      }
    }

    for (const [raceIndex, race] of program.races.entries()) {
      const members = new Set(race.lane_ids);
      if (members.size !== race.lane_ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["races", raceIndex, "lane_ids"],
          message: "Race lane identifiers must be unique.",
        });
      }
      for (const laneId of members) {
        if (!lanes.has(laneId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["races", raceIndex, "lane_ids"],
            message: `Race lane ${laneId} does not exist.`,
          });
        }
      }
    }

    for (const [interruptIndex, interrupt] of program.interrupts.entries()) {
      const activated = lanes.get(interrupt.activate_lane_id);
      if (!activated || activated.activation !== "interrupt_only") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interrupts", interruptIndex, "activate_lane_id"],
          message: "An interrupt must activate an interrupt-only lane.",
        });
      }
      for (const laneId of interrupt.cancel_lane_ids) {
        if (!lanes.has(laneId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["interrupts", interruptIndex, "cancel_lane_ids"],
            message: `Interrupted lane ${laneId} does not exist.`,
          });
        }
      }
    }

    if (declaredBlockMutations > program.mutation_scope.max_block_mutations) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope", "max_block_mutations"],
        message: `The mutation ceiling must cover all bounded lane iterations: required at least ${declaredBlockMutations}, received ${program.mutation_scope.max_block_mutations}.`,
      });
    }
    if (
      declaredInventoryTransfers >
      program.mutation_scope.max_inventory_transfers
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope", "max_inventory_transfers"],
        message: `The inventory-transfer ceiling must cover all bounded lane iterations: required at least ${declaredInventoryTransfers}, received ${program.mutation_scope.max_inventory_transfers}.`,
      });
    }
    if (
      declaredBlockMutations > 0 &&
      !program.mutation_scope.world_mutation_allowed
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope", "world_mutation_allowed"],
        message: "World-changing lanes require explicit mutation authority.",
      });
    }
    if (
      !program.mutation_scope.world_mutation_allowed &&
      (program.mutation_scope.max_block_mutations !== 0 ||
        program.mutation_scope.allowed_block_ids.length !== 0 ||
        program.mutation_scope.allowed_regions.length !== 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mutation_scope"],
        message:
          "A non-world-mutating reactive program must carry an empty world mutation scope.",
      });
    }
  });

export type HelixMinecraftReactiveProgramArguments = z.infer<
  typeof helixMinecraftReactiveProgramArgumentsSchema
>;

export const helixMinecraftReactiveLaneObservationSchema = z
  .object({
    lane_id: identifierSchema,
    lane_kind: z.enum(HELIX_MINECRAFT_REACTIVE_LANE_KINDS),
    state: z.enum([
      "dormant",
      "waiting_for_resources",
      "running",
      "succeeded",
      "failed",
      "canceled",
      "timed_out",
    ]),
    node_id: identifierSchema.nullable(),
    held_resources: z.array(resourceSchema).max(9),
    iteration: z.number().int().nonnegative().max(256),
    tick_index: tickSchema,
    controls_released: z.boolean(),
  })
  .strict();

export const helixMinecraftReactiveProgramObservationSchema = z
  .object({
    program_schema: z.literal(HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA),
    program_id: identifierSchema,
    tick_index: tickSchema,
    active_lane_count: z.number().int().nonnegative().max(8),
    lanes: z.array(helixMinecraftReactiveLaneObservationSchema).min(1).max(8),
    condition_observations: z
      .array(helixMinecraftFluidConditionObservationSchema)
      .max(512),
    resource_conflict_count: z.number().int().nonnegative(),
    interrupt_count: z.number().int().nonnegative().max(16),
    controls_released: z.boolean(),
  })
  .strict();

export { HELIX_MINECRAFT_FLUID_CONDITION_KINDS };
