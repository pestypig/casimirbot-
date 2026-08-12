import { describe, expect, it } from "vitest";
import {
  HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
  helixEnvironmentActionRequestSchema,
  helixEnvironmentActionResultSchema,
} from "@shared/helix-environment-action";
import {
  canonicalizeEnvironmentActionResult,
  environmentActionWorkflowMeasurementsValid,
} from "../action-broker";
import { minecraftPlayerCapabilityForActionKind } from "@shared/helix-minecraft-player-capabilities";

const startedAt = "2026-08-05T12:00:00.000Z";
const completedAt = "2026-08-05T12:00:05.000Z";

const request = helixEnvironmentActionRequestSchema.parse({
  schema: HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
  action_request_id: "environment_action_request:canonicalization",
  workflow_id: "environment_action_workflow:canonicalization",
  action_authority_id: "environment_action_authority:canonicalization",
  environment_binding_id: "environment_binding:canonicalization",
  room_id: "shared_realtime_room:canonicalization",
  source_id: "source:canonicalization",
  world_id: "minecraft:local:canonicalization",
  participant_id: "room_participant:canonicalization",
  subject_binding_id: "environment_subject_binding:canonicalization",
  subject_native_id: "player-uuid-canonicalization",
  run_id: "helix_agent_run:canonicalization",
  turn_id: "ask:canonicalization",
  provider_execution_id: "provider_execution:canonicalization",
  tool_call_id: "tool_call:canonicalization",
  catalog_snapshot_id: "environment_catalog:canonicalization",
  capability_id: "com.casimirbot.minecraft.player.navigate",
  capability_version: 1,
  action_kind: "navigate_to",
  effect_class: "continuous_control",
  workflow_mode: "long_running",
  requested_control_engine: "native_fabric",
  arguments: {
    action_kind: "navigate_to",
    destination: { x: 8, y: 64, z: 3 },
    arrival_radius: 1,
    allow_sprint: false,
    allow_dig: false,
    allow_place: false,
    engine_preference: "native_fabric",
  },
  preconditions: [],
  postconditions: [
    {
      condition_id: "postcondition:destination",
      condition_kind: "minecraft.player.position_within_radius",
      required: true,
      parameters: { x: 8, y: 64, z: 3, radius: 1 },
    },
  ],
  idempotency_key: "canonicalization-action-result",
  confirmation_state: "approved",
  approval_ref: "environment_action_approval:canonicalization",
  created_at: startedAt,
  deadline_at: "2026-08-05T12:01:00.000Z",
  constraints: {
    max_duration_ms: 60_000,
    max_distance_blocks: 128,
    max_block_mutations: 0,
    max_inventory_transfers: 0,
    manual_override_policy: "cancel",
    require_postcondition_verification: true,
    world_mutation_allowed: false,
    combat_allowed: false,
    host_access_allowed: false,
    automatic_replay_allowed: false,
  },
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const result = helixEnvironmentActionResultSchema.parse({
  schema: HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
  action_request_id: request.action_request_id,
  workflow_id: request.workflow_id,
  action_execution_id: "environment_action_execution:canonicalization",
  capability_id: request.capability_id,
  capability_version: request.capability_version,
  action_kind: request.action_kind,
  outcome: "succeeded",
  summary: "The player reached the destination.",
  control_engine: "native_fabric",
  started_at: startedAt,
  completed_at: completedAt,
  progress_event_refs: ["environment_action_event:canonicalization"],
  postconditions: [
    {
      condition_id: "postcondition:destination",
      condition_kind: "minecraft.player.position_within_radius",
      required: true,
      status: "satisfied",
      summary: "The measured player position is within one block.",
      evidence_refs: ["environment_action_evidence:position-after"],
      checked_at: completedAt,
    },
  ],
  evidence_refs: ["environment_action_evidence:position-after"],
  side_effects_performed: true,
  player_motion_performed: true,
  player_interaction_performed: false,
  inventory_mutation_performed: false,
  world_mutation_performed: false,
  manual_override_detected: false,
  controls_released: true,
  host_access_performed: false,
  automatic_replay_performed: false,
  model_invoked: false,
  assistant_answer: false,
  raw_content_included: false,
});

describe("environment action result canonicalization", () => {
  it("admits only bounded typed manual-override causes", () => {
    const canceled = helixEnvironmentActionResultSchema.parse({
      ...result,
      outcome: "request_canceled",
      summary: "Manual player input canceled the workflow (reason: screen_open).",
      postconditions: result.postconditions.map((condition) => ({
        ...condition,
        status: "not_checked" as const,
      })),
      side_effects_performed: false,
      player_motion_performed: false,
      manual_override_detected: true,
      manual_override_reason: "screen_open",
    });

    expect(canceled.manual_override_reason).toBe("screen_open");
    expect(() => helixEnvironmentActionResultSchema.parse({
      ...canceled,
      manual_override_reason: "untrusted_free_text",
    })).toThrow();
  });

  const measurementScenarios = [
    {
      actionKind: "navigate_to",
      arguments: {
        action_kind: "navigate_to",
        destination: { x: 8, y: 64, z: 3 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
      },
      measurements: { distance_blocks: 0.5, arrival_radius: 1 },
    },
    {
      actionKind: "look_at",
      arguments: {
        action_kind: "look_at",
        target: { target_kind: "current_focus" },
        max_turn_degrees_per_tick: 15,
      },
      measurements: {
        target_kind: "current_focus",
        view_retained: true,
        final_yaw: 15,
        final_pitch: -4,
      },
    },
    {
      actionKind: "look_at",
      arguments: {
        action_kind: "look_at",
        target: {
          target_kind: "relative_rotation",
          yaw_delta_degrees: 20,
          pitch_delta_degrees: 5,
        },
        max_turn_degrees_per_tick: 15,
      },
      measurements: {
        target_kind: "relative_rotation",
        requested_yaw_delta_degrees: 20,
        requested_pitch_delta_degrees: 5,
        initial_yaw: 10,
        initial_pitch: -5,
        target_yaw: 30,
        target_pitch: 0,
        final_yaw: 30,
        final_pitch: 0,
        applied_yaw_delta_degrees: 20,
        applied_pitch_delta_degrees: 5,
        yaw_error_degrees: 0,
        pitch_error_degrees: 0,
      },
    },
    {
      actionKind: "walk",
      arguments: { action_kind: "walk", direction: "forward", duration_ms: 500, sprint: false },
      measurements: { distance_blocks: 1.25 },
    },
    {
      actionKind: "jump",
      arguments: { action_kind: "jump", count: 2 },
      measurements: { confirmed_jumps: 2 },
    },
    {
      actionKind: "interact",
      arguments: {
        action_kind: "interact",
        target: "looked_at_block",
        hand: "main_hand",
        interaction: "use",
      },
      measurements: {
        interaction_accepted: true,
        target: "looked_at_block",
        hand: "main_hand",
        interaction: "use",
      },
    },
    {
      actionKind: "hotbar_select",
      arguments: { action_kind: "hotbar_select", slot: 2 },
      measurements: { selection_matches: true, selected_slot: 2 },
    },
    {
      actionKind: "equip",
      arguments: { action_kind: "equip", item_id: "minecraft:shield", destination: "off_hand" },
      measurements: { equipment_matches: true, item_id: "minecraft:shield", destination: "off_hand" },
    },
    {
      actionKind: "follow",
      arguments: {
        action_kind: "follow",
        subject_ref: "environment_subject:friend",
        distance: 3,
        max_duration_ms: 1_000,
        stop_below_health: 6,
      },
      measurements: { target_present: true, duration_ticks: 20 },
    },
    {
      actionKind: "collect",
      arguments: { action_kind: "collect", item_or_block_id: "minecraft:apple", count: 2, search_radius: 8 },
      measurements: { item_id: "minecraft:apple", collected_count: 2 },
    },
    {
      actionKind: "mine",
      arguments: { action_kind: "mine", block_id: "minecraft:stone", count: 2, search_radius: 8 },
      measurements: { block_id: "minecraft:stone", removed_count: 2, world_mutations_performed: 2 },
    },
    {
      actionKind: "place",
      arguments: {
        action_kind: "place",
        block_id: "minecraft:cobblestone",
        positions: [{ x: 1, y: 64, z: 1 }, { x: 1, y: 65, z: 1 }],
      },
      measurements: { block_id: "minecraft:cobblestone", verified_positions: 2, world_mutations_performed: 2 },
    },
    {
      actionKind: "craft",
      arguments: { action_kind: "craft", output_item_id: "minecraft:stick", count: 4 },
      measurements: { output_item_id: "minecraft:stick", produced_count: 4 },
    },
    {
      actionKind: "inventory_transfer",
      arguments: {
        action_kind: "inventory_transfer",
        direction: "withdraw",
        item_id: "minecraft:apple",
        count: 2,
        container_target: "current_open_container",
      },
      measurements: { item_id: "minecraft:apple", direction: "withdraw", transferred_count: 2 },
    },
  ] as const;

  for (const scenario of measurementScenarios) {
    it(`requires action-specific terminal measurements for ${scenario.actionKind}`, () => {
      const motionKinds = new Set([
        "navigate_to", "look_at", "walk", "jump", "follow", "collect", "mine", "place",
      ]);
      const interactionKinds = new Set([
        "interact", "mine", "place", "craft", "inventory_transfer",
      ]);
      const inventoryKinds = new Set([
        "hotbar_select", "equip", "collect", "craft", "inventory_transfer",
      ]);
      const worldMutationKinds = new Set(["mine", "place"]);
      const matrixRequest = helixEnvironmentActionRequestSchema.parse({
        ...request,
        action_request_id: `environment_action_request:matrix:${scenario.actionKind}`,
        workflow_id: `environment_action_workflow:matrix:${scenario.actionKind}`,
        capability_id: minecraftPlayerCapabilityForActionKind(scenario.actionKind),
        action_kind: scenario.actionKind,
        effect_class: worldMutationKinds.has(scenario.actionKind)
          ? "world_mutation"
          : motionKinds.has(scenario.actionKind)
            ? "player_motion"
            : inventoryKinds.has(scenario.actionKind)
              ? "player_inventory"
              : "player_interaction",
        arguments: scenario.arguments,
        postconditions: [{
          condition_id: `postcondition:matrix:${scenario.actionKind}`,
          condition_kind: `minecraft.matrix.${scenario.actionKind}`,
          required: true,
          parameters: {},
        }],
        idempotency_key: `canonicalization-matrix-${scenario.actionKind}`,
        constraints: {
          ...request.constraints,
          max_block_mutations: worldMutationKinds.has(scenario.actionKind) ? 100 : 0,
          max_inventory_transfers: inventoryKinds.has(scenario.actionKind) ? 100 : 0,
          world_mutation_allowed: worldMutationKinds.has(scenario.actionKind),
        },
      });
      const matrixResult = helixEnvironmentActionResultSchema.parse({
        ...result,
        action_request_id: matrixRequest.action_request_id,
        workflow_id: matrixRequest.workflow_id,
        capability_id: matrixRequest.capability_id,
        action_kind: scenario.actionKind,
        postconditions: [{
          condition_id: `postcondition:matrix:${scenario.actionKind}`,
          condition_kind: `minecraft.matrix.${scenario.actionKind}`,
          required: true,
          status: "satisfied",
          summary: "The action-specific matrix postcondition was measured.",
          evidence_refs: [`environment_action_event:matrix:${scenario.actionKind}`],
          checked_at: completedAt,
        }],
        evidence_refs: [`environment_action_event:matrix:${scenario.actionKind}`],
        side_effects_performed: true,
        player_motion_performed: motionKinds.has(scenario.actionKind),
        player_interaction_performed: interactionKinds.has(scenario.actionKind),
        inventory_mutation_performed: inventoryKinds.has(scenario.actionKind),
        world_mutation_performed: worldMutationKinds.has(scenario.actionKind),
      });
      expect(environmentActionWorkflowMeasurementsValid({
        request: matrixRequest,
        result: matrixResult,
        measurements: scenario.measurements,
      })).toBe(true);
      expect(environmentActionWorkflowMeasurementsValid({
        request: matrixRequest,
        result: matrixResult,
        measurements: {},
      })).toBe(false);
    });
  }

  it("requires action-specific measured proof for a successful workflow", () => {
    expect(environmentActionWorkflowMeasurementsValid({
      request,
      result,
      measurements: {
        distance_blocks: 0.75,
        arrival_radius: 1,
        final_x: 7.5,
        final_y: 64,
        final_z: 3,
      },
    })).toBe(true);
    expect(environmentActionWorkflowMeasurementsValid({
      request,
      result,
      measurements: {},
    })).toBe(false);
  });

  it("preserves success only when every admitted required postcondition is proven", () => {
    expect(canonicalizeEnvironmentActionResult({
      request,
      result,
      identityValid: true,
      envelopeValid: true,
      currentTurn: true,
      workflowEvidenceValid: true,
      verifiedTerminalMeasurements: {
        distance_blocks: 0.5,
        arrival_radius: 1,
        final_x: 8,
        final_y: 64,
        final_z: 3,
      },
    })).toMatchObject({
      outcome: "succeeded",
      verified_terminal_measurements: {
        distance_blocks: 0.5,
        final_x: 8,
      },
    });
  });

  it("turns a connector success with substituted postcondition identity into a typed failure", () => {
    const substituted = helixEnvironmentActionResultSchema.parse({
      ...result,
      postconditions: [{
        ...result.postconditions[0],
        condition_id: "postcondition:different-goal",
      }],
    });
    expect(canonicalizeEnvironmentActionResult({
      request,
      result: substituted,
      identityValid: true,
      envelopeValid: true,
      currentTurn: true,
      workflowEvidenceValid: true,
    })).toMatchObject({
      outcome: "postcondition_failed",
      controls_released: true,
      automatic_replay_performed: false,
    });
  });

  it("keeps late success as provenance without granting current-turn success", () => {
    expect(canonicalizeEnvironmentActionResult({
      request,
      result,
      identityValid: true,
      envelopeValid: true,
      currentTurn: false,
      workflowEvidenceValid: true,
    }).outcome).toBe("action_outcome_unknown");
  });

  it("fails a mismatched result envelope closed before postcondition admission", () => {
    expect(canonicalizeEnvironmentActionResult({
      request,
      result,
      identityValid: true,
      envelopeValid: false,
      currentTurn: true,
      workflowEvidenceValid: true,
    }).outcome).toBe("capability_version_changed");
  });

  it("rejects success whose postcondition refs do not resolve to recorded workflow evidence", () => {
    expect(canonicalizeEnvironmentActionResult({
      request,
      result,
      identityValid: true,
      envelopeValid: true,
      currentTurn: true,
      workflowEvidenceValid: false,
    }).outcome).toBe("postcondition_failed");
  });

  it("rejects measured world mutation that exceeds the admitted request scope", () => {
    const mineRequest = helixEnvironmentActionRequestSchema.parse({
      ...request,
      action_request_id: "environment_action_request:mine-canonicalization",
      workflow_id: "environment_action_workflow:mine-canonicalization",
      capability_id: "com.casimirbot.minecraft.player.mine",
      action_kind: "mine",
      effect_class: "world_mutation",
      arguments: {
        action_kind: "mine",
        block_id: "minecraft:stone",
        count: 2,
        search_radius: 8,
      },
      postconditions: [{
        condition_id: "postcondition:mine",
        condition_kind: "minecraft.world.matching_blocks_removed",
        required: true,
        parameters: { block_id: "minecraft:stone", count: 2 },
      }],
      idempotency_key: "canonicalization-mine-result",
      constraints: {
        ...request.constraints,
        max_block_mutations: 2,
        max_inventory_transfers: 2,
        world_mutation_allowed: true,
      },
    });
    const mineResult = helixEnvironmentActionResultSchema.parse({
      ...result,
      action_request_id: mineRequest.action_request_id,
      workflow_id: mineRequest.workflow_id,
      capability_id: mineRequest.capability_id,
      action_kind: "mine",
      postconditions: [{
        condition_id: "postcondition:mine",
        condition_kind: "minecraft.world.matching_blocks_removed",
        required: true,
        status: "satisfied",
        summary: "Two matching blocks were observed removed.",
        evidence_refs: ["environment_action_event:mine"],
        checked_at: completedAt,
      }],
      evidence_refs: ["environment_action_event:mine"],
      player_motion_performed: true,
      player_interaction_performed: true,
      inventory_mutation_performed: false,
      world_mutation_performed: true,
    });
    expect(environmentActionWorkflowMeasurementsValid({
      request: mineRequest,
      result: mineResult,
      measurements: {
        block_id: "minecraft:stone",
        removed_count: 2,
        world_mutations_performed: 2,
      },
    })).toBe(true);
    expect(environmentActionWorkflowMeasurementsValid({
      request: mineRequest,
      result: mineResult,
      measurements: {
        block_id: "minecraft:stone",
        removed_count: 3,
        world_mutations_performed: 3,
      },
    })).toBe(false);
  });
});
