import { describe, expect, it } from "vitest";
import { buildDirectDiagnosticEnvelope } from "../../scripts/helix-minecraft-player-stage-diagnostic";

describe("Minecraft direct diagnostic inbox staging", () => {
  it("normalizes a native navigation request into the bounded client envelope", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "navigate_to",
        destination: { x: 4, y: 64, z: -2 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
      },
      maxDurationMs: 20_000,
      requestId: "direct_diagnostic_request:navigate-test",
    });

    expect(envelope).toMatchObject({
      action_kind: "navigate_to",
      control_engine: "native_fabric",
      max_duration_ticks: 400,
      arguments: {
        destination: { x: 4, y: 64, z: -2 },
        allow_dig: false,
        allow_place: false,
      },
    });
    expect(envelope.arguments).not.toHaveProperty("action_kind");
  });

  it("stages the exact resident guardian profile for direct viability proof", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "arm_viability_guardian",
        profile_id: "resident.minecraft.fabric-guardian.v1",
        duration_ticks: 2_400,
        minimum_air: 80,
        dangerous_vertical_velocity: -0.72,
        maximum_swim_ticks: 200,
        maximum_observation_age_ticks: 1,
        response_repertoire: [
          "swim_up",
          "release_controls",
          "request_semantic_replan",
        ],
      },
      requestId: "direct_diagnostic_request:resident-guardian",
    });

    expect(envelope).toMatchObject({
      action_kind: "arm_viability_guardian",
      control_engine: "native_fabric",
      max_duration_ticks: 2_500,
      arguments: {
        profile_id: "resident.minecraft.fabric-guardian.v1",
        duration_ticks: 2_400,
        response_repertoire: [
          "swim_up",
          "release_controls",
          "request_semantic_replan",
        ],
      },
    });
    expect(envelope.arguments).not.toHaveProperty("action_kind");
  });

  it("stages a symmetric resident guardian disarm", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "disarm_viability_guardian",
        profile_id: "resident.minecraft.fabric-guardian.v1",
      },
      requestId: "direct_diagnostic_request:resident-guardian-disarm",
    });

    expect(envelope).toMatchObject({
      action_kind: "disarm_viability_guardian",
      control_engine: "native_fabric",
      max_duration_ticks: 100,
      arguments: {
        profile_id: "resident.minecraft.fabric-guardian.v1",
      },
    });
  });

  it("preserves a separately resolved follow identity for the direct lane", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "follow",
        subject_ref: "player:Alex",
        target_subject_native_id: "Alex",
        target_subject_label: "Alex",
        distance: 3,
        max_duration_ms: 5_000,
        stop_below_health: 6,
      },
      requestId: "direct_diagnostic_request:follow-test",
    });

    expect(envelope.arguments).toMatchObject({
      subject_ref: "player:Alex",
      target_subject_native_id: "Alex",
      target_subject_label: "Alex",
    });
    expect(envelope.max_duration_ticks).toBe(200);
  });

  it("selects Baritone only for an exact Baritone navigation preference", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "navigate_to",
        destination: { x: 4, y: 64, z: -2 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "baritone",
      },
    });

    expect(envelope.control_engine).toBe("baritone");
  });

  it("stages a bounded camera tracker with its exact entity selector", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "track_target",
        target: {
          target_kind: "entity_type",
          entity_type_id: "minecraft:bat",
          selection: "nearest",
        },
        aim_point: "center",
        max_acquisition_distance: 64,
        max_duration_ms: 30_000,
        max_turn_degrees_per_tick: 20,
        max_angular_acceleration_degrees_per_tick_squared: 4,
        prediction_ticks: 2,
        deadband_degrees: 0.5,
        reacquire_ticks: 10,
        require_line_of_sight: false,
        stop_below_health: 4,
      },
      requestId: "direct_diagnostic_request:track-bat-test",
    });

    expect(envelope).toMatchObject({
      action_kind: "track_target",
      control_engine: "native_fabric",
      max_duration_ticks: 700,
      arguments: {
        target: {
          target_kind: "entity_type",
          entity_type_id: "minecraft:bat",
          selection: "nearest",
        },
        max_duration_ms: 30_000,
      },
    });
  });

  it("stages an exact hostile attack with a finite outer diagnostic deadline", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "attack",
        target_ref: "target:00dd51226cf33aa465b609dc08fa100b0ae2c3bc",
        target_entity_type_id: "minecraft:zombie",
        target_classification: "hostile",
        max_acquisition_distance: 16,
        require_line_of_sight: true,
        minimum_attack_cooldown: 0.9,
        max_attack_pulses: 8,
        max_duration_ms: 15_000,
        stop_below_health: 6,
        friendly_fire: false,
      },
      maxDurationMs: 20_000,
      requestId: "direct_diagnostic_request:attack-test",
    });

    expect(envelope).toMatchObject({
      action_kind: "attack",
      control_engine: "native_fabric",
      max_duration_ticks: 400,
      arguments: {
        target_ref: "target:00dd51226cf33aa465b609dc08fa100b0ae2c3bc",
        max_attack_pulses: 8,
        max_duration_ms: 15_000,
      },
    });
    expect(Number.isFinite(envelope.max_duration_ticks)).toBe(true);
  });

  it("stages one bounded fluid sequence for direct-Codex parity testing", () => {
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "execute_sequence",
        sequence_schema: "helix.minecraft.player_sequence.v1",
        sequence_id: "sequence:direct-tas-test",
        ruleset: "survival_tas",
        execution_plane: "player_embodiment",
        scheduler_engine: "native_fabric",
        optimization: {
          primary: "minimize_world_ticks",
          record_wall_clock: true,
          stop_on_first_verified_success: true,
        },
        start_node_id: "node:input",
        max_total_ticks: 200,
        required_checkpoint_ids: [],
        mutation_scope: {
          world_mutation_allowed: false,
          max_block_mutations: 0,
          max_inventory_transfers: 0,
          allowed_block_ids: [],
          allowed_regions: [],
          combat_allowed: false,
        },
        nodes: [
          {
            node_id: "node:input",
            node_kind: "input_segment",
            earliest_tick: 0,
            duration_ticks: 2,
            controls: {
              forward: 1,
              strafe: 0,
              sprint: true,
              sneak: false,
              jump: "pulse",
              use: "idle",
            },
            on_complete: "node:succeeded",
            on_failure: "node:failed",
          },
          {
            node_id: "node:succeeded",
            node_kind: "terminal",
            terminal_outcome: "succeeded",
            reason_code: "direct_tas_complete",
          },
          {
            node_id: "node:failed",
            node_kind: "terminal",
            terminal_outcome: "failed",
            reason_code: "direct_tas_failed",
          },
        ],
      },
      requestId: "direct_diagnostic_request:sequence-test",
    });

    expect(envelope).toMatchObject({
      action_kind: "execute_sequence",
      control_engine: "native_fabric",
      max_duration_ticks: 300,
      arguments: {
        sequence_id: "sequence:direct-tas-test",
        max_total_ticks: 200,
      },
    });
    expect(envelope.arguments).not.toHaveProperty("action_kind");
  });

  it("stages one bounded concurrent guardian program for direct-Codex parity testing", () => {
    const terminal = (nodeId: string, outcome: "succeeded" | "failed") => ({
      node_id: nodeId,
      node_kind: "terminal",
      terminal_outcome: outcome,
      reason_code: `direct_${outcome}`,
    });
    const envelope = buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "execute_reactive_program",
        program_schema: "helix.minecraft.reactive_program.v1",
        program_id: "program:direct-guardian-test",
        ruleset: "survival_tas",
        execution_plane: "player_embodiment",
        scheduler_engine: "native_fabric_concurrent",
        max_total_ticks: 80,
        completion_policy: {
          mode: "all_required",
          cancel_remaining_on_settle: true,
        },
        mutation_scope: {
          world_mutation_allowed: false,
          max_block_mutations: 0,
          max_inventory_transfers: 0,
          allowed_block_ids: [],
          allowed_regions: [],
          combat_allowed: false,
        },
        lanes: [
          {
            lane_id: "lane:camera",
            lane_kind: "camera",
            priority: 80,
            required: true,
            activation: "immediate",
            resource_ceiling: ["camera"],
            start_node_id: "node:look",
            nodes: [
              {
                node_id: "node:look",
                node_kind: "action",
                earliest_tick: 0,
                timeout_ticks: 20,
                action: {
                  action_kind: "look_at",
                  target: {
                    target_kind: "relative_rotation",
                    yaw_delta_degrees: 10,
                    pitch_delta_degrees: 0,
                  },
                  max_turn_degrees_per_tick: 5,
                },
                on_success: "node:look-done",
                on_failure: "node:look-failed",
                on_timeout: "node:look-failed",
              },
              terminal("node:look-done", "succeeded"),
              terminal("node:look-failed", "failed"),
            ],
          },
          {
            lane_id: "lane:move",
            lane_kind: "locomotion",
            priority: 60,
            required: true,
            activation: "immediate",
            resource_ceiling: ["locomotion"],
            start_node_id: "node:walk",
            nodes: [
              {
                node_id: "node:walk",
                node_kind: "action",
                earliest_tick: 0,
                timeout_ticks: 30,
                action: {
                  action_kind: "walk",
                  direction: "forward",
                  duration_ms: 250,
                  sprint: false,
                },
                on_success: "node:walk-done",
                on_failure: "node:walk-failed",
                on_timeout: "node:walk-failed",
              },
              terminal("node:walk-done", "succeeded"),
              terminal("node:walk-failed", "failed"),
            ],
          },
        ],
        races: [],
        interrupts: [],
      },
      requestId: "direct_diagnostic_request:guardian-test",
    });

    expect(envelope).toMatchObject({
      action_kind: "execute_reactive_program",
      control_engine: "native_fabric",
      max_duration_ticks: 180,
      arguments: {
        program_id: "program:direct-guardian-test",
        max_total_ticks: 80,
      },
    });
    expect(envelope.arguments).not.toHaveProperty("action_kind");
  });

  it("rejects extra fields and invalid mutation parameters before staging", () => {
    expect(() => buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "walk",
        direction: "forward",
        duration_ms: 250,
        sprint: false,
        command: "/op player",
      },
    })).toThrow(/player_diagnostic_action_invalid/);

    expect(() => buildDirectDiagnosticEnvelope({
      action: {
        action_kind: "mine",
        block_id: "not a resource id",
        count: 1,
        search_radius: 4,
      },
    })).toThrow(/player_diagnostic_action_invalid/);
  });
});
