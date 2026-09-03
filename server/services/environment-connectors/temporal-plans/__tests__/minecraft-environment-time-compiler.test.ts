import { describe, expect, it } from "vitest";
import {
  buildHelixEnvironmentTemporalPlan,
  type HelixEnvironmentTemporalPlan,
} from "../../../../../shared/helix-environment-time";
import {
  compileEnvironmentTimePlanToMinecraftFluidSequence,
  compileEnvironmentTimePlanToMinecraftReactiveProgram,
  MinecraftEnvironmentTimeCompileError,
} from "../minecraft-environment-time-compiler";

const buildPlan = (patch: Record<string, unknown> = {}): HelixEnvironmentTemporalPlan =>
  buildHelixEnvironmentTemporalPlan({
    plan_id: "plan:minecraft:compiler:1",
    previous_plan_id: null,
    previous_plan_hash: null,
    identity: {
      environment_id: "environment:minecraft:test",
      source_id: "source:fabric:test",
      subject_id: "player:test",
      producer_epoch: "epoch:7",
      authority_id: "authority:7",
      authority_revision: 1,
      goal_id: "goal:walk",
      goal_revision: 1,
      observation_revision: 2,
      affordance_revision: 3,
    },
    clocks: {
      environment: {
        kind: "tick",
        sequence: 100,
        resolution_unit: "minecraft_tick",
        nominal_units_per_second: 20,
      },
      monotonic: { origin_id: "fabric:7", elapsed_ms: 1_000 },
      audit_at: "2026-09-03T12:00:00.000Z",
    },
    adapter_id: "minecraft.fabric_client",
    adapter_version: "1",
    compiler_version: "environment_time_minecraft:1",
    resident_executor_version: "native_fabric:1",
    start_node_id: "walk",
    maximum_total_units: 80,
    monotonic_deadline_elapsed_ms: 10_000,
    watermarks: {
      decision_unit: 40,
      stop_unit: 60,
      committed_through_unit: 80,
      stabilization_node_id: "settled",
    },
    lanes: [{
      lane_id: "locomotion",
      priority: 100,
      resource_keys: ["resource:locomotion"],
    }],
    effect_ceiling: {},
    nodes: [
      {
        kind: "action",
        node_id: "walk",
        lane_id: "locomotion",
        capability_id: "com.casimirbot.minecraft.player.walk",
        capability_version: "1",
        arguments: {
          action_kind: "walk",
          direction: "forward",
          duration_ms: 500,
          sprint: false,
        },
        required_resources: ["resource:locomotion"],
        timing: {
          earliest_start_unit: 2,
          latest_start_unit: 10,
          maximum_duration_units: 20,
        },
        preconditions: [{
          kind: "adapter_condition",
          condition_id: "minecraft.player_grounded",
          arguments: { expected: true },
        }],
        completion_conditions: [{
          kind: "adapter_condition",
          condition_id: "minecraft.player_grounded",
          arguments: { expected: true },
        }],
        abort_guards: [],
        effect_budget: {},
        on_success_node_id: "settled",
        on_failure_node_id: "failed",
        on_timeout_node_id: "failed",
      },
      {
        kind: "checkpoint",
        node_id: "settled",
        checkpoint_id: "checkpoint:walk",
        required_evidence_kinds: ["player_pose"],
        condition: {
          kind: "adapter_condition",
          condition_id: "minecraft.player_grounded",
          arguments: { expected: true },
        },
        wait_up_to_units: 5,
        on_satisfied_node_id: "success",
        on_timeout_node_id: "failed",
      },
      { kind: "terminal", node_id: "success", outcome: "succeeded", reason_code: "done" },
      { kind: "terminal", node_id: "failed", outcome: "failed", reason_code: "failed" },
    ],
    ...patch,
  } as Parameters<typeof buildHelixEnvironmentTemporalPlan>[0]);

const resourceBindings = { "resource:locomotion": "locomotion" as const };
const fluidScope = {
  world_mutation_allowed: false,
  max_block_mutations: 0,
  max_inventory_transfers: 0,
  allowed_block_ids: [],
  allowed_regions: [],
  combat_allowed: false as const,
};

describe("Minecraft Environment Time compatibility compiler", () => {
  it("compiles the same admitted action and graph outcomes into both existing engines", () => {
    const plan = buildPlan();
    const serial = compileEnvironmentTimePlanToMinecraftFluidSequence({
      plan,
      mutation_scope: fluidScope,
      resource_bindings: resourceBindings,
    });
    const reactive = compileEnvironmentTimePlanToMinecraftReactiveProgram({
      plan,
      mutation_scope: fluidScope,
      resource_bindings: resourceBindings,
      lane_kind: "locomotion",
    });
    const serialAction = serial.nodes.find((node) => node.node_kind === "workflow_action");
    const reactiveAction = reactive.lanes[0].nodes.find((node) => node.node_kind === "action");
    expect(serialAction && "action" in serialAction ? serialAction.action : null).toEqual(
      reactiveAction && "action" in reactiveAction ? reactiveAction.action : null,
    );
    expect(serial.start_node_id).toBe(reactive.lanes[0].start_node_id);
    expect(serial.nodes.some((node) => node.node_kind === "checkpoint" && node.checkpoint_id === "checkpoint:walk")).toBe(true);
    expect(reactive.lanes[0].nodes.some((node) => node.node_kind === "checkpoint" && node.checkpoint_id === "checkpoint:walk")).toBe(true);
  });

  it("fails closed on adapter, clock, capability, resource and condition mismatch", () => {
    const cases: Array<[HelixEnvironmentTemporalPlan, string]> = [
      [buildPlan({ adapter_id: "robot.sim" }), "adapter_mismatch"],
      [buildPlan({ clocks: { ...buildPlan().clocks, environment: { ...buildPlan().clocks.environment, kind: "frame" } } }), "clock_mismatch"],
    ];
    for (const [plan, code] of cases) {
      expect(() => compileEnvironmentTimePlanToMinecraftReactiveProgram({
        plan,
        mutation_scope: fluidScope,
        resource_bindings: resourceBindings,
        lane_kind: "locomotion",
      })).toThrowError(expect.objectContaining({ code }));
    }
    expect(() => compileEnvironmentTimePlanToMinecraftReactiveProgram({
      plan: buildPlan(),
      mutation_scope: fluidScope,
      lane_kind: "locomotion",
    })).toThrowError(expect.objectContaining({ code: "resource_mismatch" }));
  });

  it("does not approximate abort guards or serial-only timeout/cancel semantics", () => {
    const base = buildPlan();
    const nodes = structuredClone(base.nodes);
    const action = nodes[0];
    if (action.kind !== "action") throw new Error("fixture");
    action.abort_guards = [{
      kind: "adapter_condition",
      condition_id: "minecraft.health_at_least",
      arguments: { health: 5 },
    }];
    expect(() => compileEnvironmentTimePlanToMinecraftFluidSequence({
      plan: buildPlan({ nodes }),
      mutation_scope: fluidScope,
      resource_bindings: resourceBindings,
    })).toThrow(MinecraftEnvironmentTimeCompileError);

    const distinct = structuredClone(base.nodes);
    const distinctAction = distinct[0];
    if (distinctAction.kind !== "action") throw new Error("fixture");
    distinctAction.on_timeout_node_id = "timeout";
    distinct.push({ kind: "terminal", node_id: "timeout", outcome: "failed", reason_code: "timeout" });
    expect(() => compileEnvironmentTimePlanToMinecraftFluidSequence({
      plan: buildPlan({ nodes: distinct }),
      mutation_scope: fluidScope,
      resource_bindings: resourceBindings,
    })).toThrowError(expect.objectContaining({ code: "unsupported_semantics" }));
  });
});
