import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  type HelixEnvironmentActionObservation,
} from "@shared/helix-environment-action";
import { describe, expect, it, vi } from "vitest";
import { EnvironmentActionBrokerError } from "../../../environment-connectors/actions/action-broker";
import type { HelixWorkstationGatewayAccountContext } from "../account-policy";
import {
  environmentActionMinecraftManifests,
  environmentActionFailureRepairAction,
  environmentActionGatewayAdmissionStatus,
  executeEnvironmentActionGatewayCapability,
  type EnvironmentActionGatewayDependencies,
} from "../environment-action";

const ROOM_ID = "shared_realtime_room:player-action-test";
const PROFILE_ID = "profile:player-action-test";
const PARTICIPANT_ID = "participant:player-action-test";
const ENVIRONMENT_ID = "environment_binding:player-action-test";
const CAPABILITY_ID = "com.casimirbot.minecraft.player.navigate";

const accountContext = (): HelixWorkstationGatewayAccountContext => {
  const accountPolicy = buildHelixAccountCapabilityPolicy("developer");
  const session = {
    schema: "helix.account_session.v1" as const,
    session_id: "account_session:player-action-test",
    profile: {
      profile_id: PROFILE_ID,
      display_name: "Player action tester",
      auth_mode: "guest" as const,
      account_type: "developer" as const,
      provider: "guest" as const,
      created_at: "2026-08-05T12:00:00.000Z",
      updated_at: "2026-08-05T12:00:00.000Z",
    },
    account_policy: accountPolicy,
    status: "active" as const,
    memory_scope: "session_only" as const,
    created_at: "2026-08-05T12:00:00.000Z",
    updated_at: "2026-08-05T12:00:00.000Z",
    expires_at: "2026-08-06T12:00:00.000Z",
  };
  return {
    session_id: session.session_id,
    profile_id: PROFILE_ID,
    trusted_account_session: true,
    account_session: session,
    account_policy: accountPolicy,
  };
};

const context = (autonomyMode: "approve_each" | "approved_capabilities" = "approved_capabilities") => ({
  actionAuthorityId: "environment_action_authority:test",
  environmentBindingId: ENVIRONMENT_ID,
  roomId: ROOM_ID,
  sourceId: "source:room-ingress:test",
  worldId: "minecraft:local:test",
  participantId: PARTICIPANT_ID,
  subjectBindingId: "subject_binding:test",
  subjectNativeId: "123e4567-e89b-12d3-a456-426614174000",
  actionAdapterProfileId: "game.minecraft.player.fabric.v1",
  actionDomainAdapter: "minecraft.fabric_client.v1",
  policyVersion: 2,
  autonomyMode,
  manualOverridePolicy: "cancel" as const,
  catalogSnapshotId: "environment_catalog:test",
  manifestId: "environment_action_manifest:test",
  capability: {
    capabilityId: CAPABILITY_ID,
    capabilityVersion: 1,
    actionKind: "navigate_to",
    effectClass: "continuous_control" as const,
    workflowModes: ["long_running" as const],
    controlEngines: ["native_fabric" as const],
  },
});

const observation: HelixEnvironmentActionObservation = {
  schema: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  action_request_ref: "environment_action_request:test",
  workflow_ref: "environment_action_workflow:test",
  action_execution_ref: "environment_action_execution:test",
  capability_id: CAPABILITY_ID,
  capability_version: 1,
  action_kind: "navigate_to",
  outcome: "succeeded",
  summary: "The paired player reached the requested destination radius.",
  result: { controls_released: true },
  progress_observation_refs: ["environment_action_event:test"],
  postcondition_evidence_refs: ["environment_action_event:test"],
  evidence_ref: "environment_action_evidence:test",
  observed_at: "2026-08-05T12:00:01.000Z",
  provenance_valid: true,
  eligible_for_current_turn_reentry: true,
  content_role: "environment_action_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const deps = (
  overrides: Partial<EnvironmentActionGatewayDependencies> = {},
): Partial<EnvironmentActionGatewayDependencies> => ({
  listRoomEnvironments: vi.fn(async () => [{
    environment_binding_id: ENVIRONMENT_ID,
    source_label: "Local Fabric 1.21.8",
    domain: "minecraft",
    connection_status: "active",
  }] as never),
  readMembership: vi.fn(async () => ({
    participantId: PARTICIPANT_ID,
    role: "owner",
    roomStatus: "active",
  }) as never),
  resolveContext: vi.fn(async () => context() as never),
  enqueueAction: vi.fn(async ({ request }) => request as never),
  awaitObservation: vi.fn(async () => observation),
  requestControl: vi.fn(async () => ({}) as never),
  ...overrides,
});

describe("Minecraft player-action workstation gateway", () => {
  it("treats manual cancellation as a same-turn human intervention boundary", () => {
    expect(environmentActionFailureRepairAction("request_canceled")).toBe("ask_user");
    expect(environmentActionFailureRepairAction("connector_offline")).toBe("ask_user");
    expect(environmentActionFailureRepairAction("action_outcome_unknown")).toBe("ask_user");
    expect(environmentActionFailureRepairAction("failed")).toBe("repair");
    expect(environmentActionGatewayAdmissionStatus("failed")).toBe("admitted");
    expect(environmentActionGatewayAdmissionStatus("blocked")).toBe("blocked");
    expect(environmentActionMinecraftManifests[0]?.description).toContain(
      "non-retryable human-intervention boundary",
    );
    expect(environmentActionMinecraftManifests[0]?.safety_tags).toContain(
      "manual_override_non_retryable_same_turn",
    );
    expect(environmentActionMinecraftManifests[0]?.safety_tags).toContain(
      "connector_recovery_non_retryable_same_turn",
    );
  });

  it("publishes the baseline and reusable bounded, nonterminal, host-free player tools", () => {
    expect(environmentActionMinecraftManifests).toHaveLength(16);
    expect(environmentActionMinecraftManifests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ capability_id: CAPABILITY_ID }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.equipment.equip",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.follow",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.collect",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.mine",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.place",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.craft",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.inventory.transfer",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.sequence.execute",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.camera.track",
        }),
        expect.objectContaining({
          capability_id: "com.casimirbot.minecraft.player.guardian.execute",
        }),
      ]),
    );
    for (const manifest of environmentActionMinecraftManifests) {
      expect(manifest).toMatchObject({
        mode: "act",
        mutating: true,
        shell_access: false,
        code_mutation: false,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
      });
      expect(manifest.description).toContain("Player Embodiment plane");
      expect(manifest.description).toContain(
        "World Authority server command, including teleport, is not an equivalent substitute",
      );
      expect(
        (manifest.input_schema as { properties: Record<string, unknown> }).properties,
      ).not.toHaveProperty("action_kind");
    }
    const look = environmentActionMinecraftManifests.find(
      (manifest) =>
        manifest.capability_id === "com.casimirbot.minecraft.player.look",
    )!;
    expect(
      (look.input_schema as { properties: Record<string, unknown> }).properties,
    ).toMatchObject({
      target_kind: expect.objectContaining({
        enum: expect.arrayContaining(["relative_rotation"]),
      }),
      yaw_delta_degrees: expect.any(Object),
      pitch_delta_degrees: expect.any(Object),
    });
  });

  it("normalizes a model-authored yaw-only relative look without asking for an unchanged pitch", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.look";
    const enqueueAction = vi.fn(async ({ request }) => request as never);
    const lookObservation = {
      ...observation,
      capability_id: capabilityId,
      action_kind: "look_at",
      result: {
        verified_terminal_measurements: {
          final_yaw: 30,
          final_pitch: 0,
        },
      },
    } satisfies HelixEnvironmentActionObservation;
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:relative-look",
      toolCallId: "tool_call:player-action-relative-look",
      providerExecutionId: "provider_execution:player-action-relative-look",
      arguments: {
        target_kind: "relative_rotation",
        yaw_delta_degrees: 20,
        max_turn_degrees_per_tick: 10,
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        resolveContext: vi.fn(async () => ({
          ...context(),
          capability: {
            capabilityId,
            capabilityVersion: 1,
            actionKind: "look_at",
            effectClass: "player_motion",
            workflowModes: ["single_action"],
            controlEngines: ["native_fabric"],
          },
        }) as never),
        awaitObservation: vi.fn(async () => lookObservation),
      }),
    });

    expect(result.ok).toBe(true);
    expect(enqueueAction.mock.calls[0]?.[0]?.request.arguments).toMatchObject({
      action_kind: "look_at",
      target: {
        target_kind: "relative_rotation",
        yaw_delta_degrees: 20,
        pitch_delta_degrees: 0,
      },
    });
  });

  it("normalizes and admits one bounded predictive entity camera tracker", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.camera.track";
    const enqueueAction = vi.fn(async ({ request }) => request as never);
    const trackingObservation = {
      ...observation,
      capability_id: capabilityId,
      action_kind: "track_target",
      summary: "The paired camera retained its locked bat target.",
    } satisfies HelixEnvironmentActionObservation;
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:track-bat",
      toolCallId: "tool_call:player-action-track-bat",
      providerExecutionId: "provider_execution:player-action-track-bat",
      arguments: {
        target_kind: "entity_type",
        entity_type_id: "minecraft:bat",
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
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        resolveContext: vi.fn(async () => ({
          ...context(),
          capability: {
            capabilityId,
            capabilityVersion: 1,
            actionKind: "track_target",
            effectClass: "continuous_control",
            workflowModes: ["long_running"],
            controlEngines: ["native_fabric"],
          },
        }) as never),
        awaitObservation: vi.fn(async () => trackingObservation),
      }),
    });

    expect(result.ok).toBe(true);
    expect(enqueueAction.mock.calls[0]?.[0]?.request).toMatchObject({
      action_kind: "track_target",
      requested_control_engine: "native_fabric",
      workflow_mode: "long_running",
      arguments: {
        action_kind: "track_target",
        target: {
          target_kind: "entity_type",
          entity_type_id: "minecraft:bat",
          selection: "nearest",
        },
        max_duration_ms: 30_000,
      },
      constraints: { max_duration_ms: 35_000 },
      postconditions: [expect.objectContaining({
        condition_kind: "minecraft.player.camera_tracking_completed",
      })],
    });
  });

  it("fails closed when an entity-type tracker omits its exact type", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.camera.track";
    const enqueueAction = vi.fn();
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:track-missing-type",
      toolCallId: "tool_call:player-action-track-missing-type",
      providerExecutionId: "provider_execution:player-action-track-missing-type",
      arguments: {
        target_kind: "entity_type",
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
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        resolveContext: vi.fn(async () => ({
          ...context(),
          capability: {
            capabilityId,
            capabilityVersion: 1,
            actionKind: "track_target",
            effectClass: "continuous_control",
            workflowModes: ["long_running"],
            controlEngines: ["native_fabric"],
          },
        }) as never),
      }),
    });

    expect(result.ok).toBe(false);
    expect(result.observation.outcome).toBe("precondition_failed");
    expect(enqueueAction).not.toHaveBeenCalled();
  });

  it("admits one bounded survival TAS graph without exposing a command or host plane", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.sequence.execute";
    const enqueueAction = vi.fn(async ({ request }) => request as never);
    const sequenceObservation = {
      ...observation,
      capability_id: capabilityId,
      action_kind: "execute_sequence",
      summary: "The bounded TAS sequence completed its checkpoint.",
    } satisfies HelixEnvironmentActionObservation;
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:fluid-sequence",
      toolCallId: "tool_call:player-action-fluid-sequence",
      providerExecutionId: "provider_execution:player-action-fluid-sequence",
      arguments: {
        sequence_schema: "helix.minecraft.player_sequence.v1",
        sequence_id: "sequence:gateway-test",
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
            reason_code: "gateway_sequence_complete",
          },
          {
            node_id: "node:failed",
            node_kind: "terminal",
            terminal_outcome: "failed",
            reason_code: "gateway_sequence_failed",
          },
        ],
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        resolveContext: vi.fn(async () => ({
          ...context(),
          capability: {
            capabilityId,
            capabilityVersion: 1,
            actionKind: "execute_sequence",
            effectClass: "continuous_control",
            workflowModes: ["long_running"],
            controlEngines: ["native_fabric"],
          },
        }) as never),
        awaitObservation: vi.fn(async () => sequenceObservation),
      }),
    });

    expect(result.ok).toBe(true);
    const request = enqueueAction.mock.calls[0]?.[0]?.request;
    expect(request).toMatchObject({
      capability_id: capabilityId,
      action_kind: "execute_sequence",
      requested_control_engine: "native_fabric",
      workflow_mode: "long_running",
      constraints: {
        max_duration_ms: 15_000,
        max_block_mutations: 0,
        max_inventory_transfers: 0,
        world_mutation_allowed: false,
        combat_allowed: false,
        host_access_allowed: false,
        automatic_replay_allowed: false,
      },
      postconditions: [expect.objectContaining({
        condition_kind: "minecraft.player.sequence_checkpoints_satisfied",
        parameters: {
          sequence_id: "sequence:gateway-test",
          ruleset: "survival_tas",
          max_total_ticks: 200,
          required_checkpoint_ids: [],
        },
      })],
    });
    expect(JSON.stringify(request)).not.toContain("command_assisted_sandbox");
    expect(JSON.stringify(request)).not.toContain("host shell");
  });

  it("fails closed instead of converting an incomplete look request into current-focus success", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.look";
    const enqueueAction = vi.fn();

    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:incomplete-relative-look",
      toolCallId: "tool_call:player-action-incomplete-relative-look",
      providerExecutionId:
        "provider_execution:player-action-incomplete-relative-look",
      arguments: {
        max_turn_degrees_per_tick: 15,
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({ enqueueAction }),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      error: "precondition_failed",
      repairAction: "repair",
      observation: {
        provenance_valid: false,
        eligible_for_current_turn_reentry: true,
        terminal_eligible: false,
      },
    });
    expect(result.summary).toContain("did not satisfy the admitted input schema");
    expect(result.summary).toContain("target_kind");
    expect(enqueueAction).not.toHaveBeenCalled();
  });

  it("returns exact admitted enum values in a model-repairable schema rejection", async () => {
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: "com.casimirbot.minecraft.player.walk",
      turnId: "ask:player-action:invalid-walk-enum",
      toolCallId: "tool_call:player-action-invalid-walk-enum",
      providerExecutionId: "provider_execution:player-action-invalid-walk-enum",
      arguments: {
        direction: "sideways",
        duration_ms: 250,
        sprint: false,
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps(),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "precondition_failed",
      repairAction: "repair",
      observation: {
        eligible_for_current_turn_reentry: true,
      },
    });
    expect(result.summary).toContain(
      'Value must be one of the admitted values: "forward", "back", "left", "right".',
    );
  });

  it("returns every bounded guardian resource and mutation repair issue to Codex", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.guardian.execute";
    const enqueueAction = vi.fn();
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:guardian-complete-repair-delta",
      toolCallId: "tool_call:player-action-guardian-complete-repair-delta",
      providerExecutionId:
        "provider_execution:player-action-guardian-complete-repair-delta",
      arguments: {
        program_schema: "helix.minecraft.reactive_program.v1",
        program_id: "guardian:complete-repair-delta",
        ruleset: "survival_tas",
        execution_plane: "player_embodiment",
        scheduler_engine: "native_fabric_concurrent",
        max_total_ticks: 120,
        completion_policy: {
          mode: "all_required",
          cancel_remaining_on_settle: true,
        },
        mutation_scope: {
          world_mutation_allowed: true,
          max_block_mutations: 1,
          max_inventory_transfers: 0,
          allowed_block_ids: ["minecraft:water"],
          allowed_regions: [],
          combat_allowed: false,
        },
        lanes: [{
          lane_id: "lane:place",
          lane_kind: "world",
          priority: 100,
          required: true,
          activation: "immediate",
          resource_ceiling: ["world", "native_workflow", "safety"],
          start_node_id: "node:place",
          nodes: [{
            node_id: "node:place",
            node_kind: "action",
            earliest_tick: 0,
            timeout_ticks: 120,
            action: {
              action_kind: "place",
              block_id: "minecraft:water",
              position_binding: {
                binding_kind: "predicted_collision_cell",
                horizon_ticks: 8,
                max_distance_blocks: 6,
                require_replaceable: true,
              },
              placement_method: "item_use",
              source_item_id: "minecraft:water_bucket",
              hand: "main_hand",
            },
            on_success: "node:succeeded",
            on_failure: "node:failed",
            on_timeout: "node:failed",
          }, {
            node_id: "node:succeeded",
            node_kind: "terminal",
            terminal_outcome: "succeeded",
            reason_code: "water:placed",
          }, {
            node_id: "node:failed",
            node_kind: "terminal",
            terminal_outcome: "failed",
            reason_code: "water:not_placed",
          }],
        }],
        races: [],
        interrupts: [],
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        resolveContext: vi.fn(async () => ({
          ...context(),
          capability: {
            capabilityId,
            capabilityVersion: 1,
            actionKind: "execute_reactive_program",
            effectClass: "continuous_control",
            workflowModes: ["long_running"],
            controlEngines: ["native_fabric"],
          },
        }) as never),
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      error: "precondition_failed",
      repairAction: "repair",
      observation: {
        eligible_for_current_turn_reentry: true,
      },
    });
    for (const resource of [
      "camera",
      "locomotion",
      "hotbar",
      "main_hand",
      "inventory",
    ]) {
      expect(result.summary).toContain(
        `Action place requires undeclared lane resource ${resource}.`,
      );
    }
    expect(result.summary).toContain(
      "The inventory-transfer ceiling must cover all bounded lane iterations: required at least 1, received 0.",
    );
    expect(enqueueAction).not.toHaveBeenCalled();
  });

  it("resolves a follow target server-side without returning its native identity to Codex", async () => {
    const capabilityId = "com.casimirbot.minecraft.player.follow";
    const enqueueAction = vi.fn(async ({ request }) => request as never);
    const resolveTargetSubject = vi.fn(async () => ({
      participantId: "participant:follow-target",
      subjectBindingId: "environment_subject_binding:follow-target",
      subjectNativeId: "123e4567-e89b-12d3-a456-426614174111",
      subjectRef: "environment_subject:follow-target",
      subjectLabel: "Friend",
      verificationMethod: "room_member_self_claim",
      confidence: 1,
      producerEpochRef: "environment_epoch:follow-target",
    }) as never);
    const followObservation = {
      ...observation,
      capability_id: capabilityId,
      action_kind: "follow",
    } satisfies HelixEnvironmentActionObservation;
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId,
      turnId: "ask:player-action:follow",
      toolCallId: "tool_call:player-action-follow",
      providerExecutionId: "provider_execution:player-action-follow",
      arguments: {
        subject_ref: "environment_subject:follow-target",
        distance: 3,
        max_duration_ms: 10_000,
        stop_below_health: 8,
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        resolveTargetSubject,
        resolveContext: vi.fn(async () => ({
          ...context(),
          capability: {
            capabilityId,
            capabilityVersion: 1,
            actionKind: "follow",
            effectClass: "continuous_control",
            workflowModes: ["long_running"],
            controlEngines: ["native_fabric"],
          },
        }) as never),
        awaitObservation: vi.fn(async () => followObservation),
      }),
    });
    expect(result.ok).toBe(true);
    expect(resolveTargetSubject).toHaveBeenCalledWith(expect.objectContaining({
      subjectRef: "environment_subject:follow-target",
    }));
    const request = enqueueAction.mock.calls[0]?.[0]?.request;
    expect(request.arguments).toMatchObject({
      subject_ref: "environment_subject:follow-target",
      target_subject_native_id: "123e4567-e89b-12d3-a456-426614174111",
      target_subject_label: "Friend",
    });
    expect(request.postconditions[0].parameters).not.toHaveProperty(
      "target_subject_native_id",
    );
    expect(JSON.stringify(result.executedArgs)).not.toContain(
      "123e4567-e89b-12d3-a456-426614174111",
    );
  });

  it("derives all authority and lifecycle identity server-side and re-enters the observation", async () => {
    const enqueueAction = vi.fn(async ({ request }) => request as never);
    const dependencies = deps({ enqueueAction });
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:turn-1",
      toolCallId: "tool_call:player-action",
      providerExecutionId: "provider_execution:player-action",
      arguments: {
        destination: { x: 10, y: 64, z: 20 },
        arrival_radius: 1.5,
        allow_sprint: true,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies,
    });
    expect(result).toMatchObject({
      ok: true,
      status: "completed",
      observation: {
        outcome: "succeeded",
        provenance_valid: true,
        eligible_for_current_turn_reentry: true,
        terminal_eligible: false,
      },
    });
    const request = enqueueAction.mock.calls[0]?.[0]?.request;
    expect(request).toMatchObject({
      action_authority_id: "environment_action_authority:test",
      environment_binding_id: ENVIRONMENT_ID,
      room_id: ROOM_ID,
      participant_id: PARTICIPANT_ID,
      subject_binding_id: "subject_binding:test",
      capability_id: CAPABILITY_ID,
      action_kind: "navigate_to",
      effect_class: "continuous_control",
      workflow_mode: "long_running",
      requested_control_engine: "native_fabric",
      confirmation_state: "not_required",
      constraints: {
        manual_override_policy: "cancel",
        host_access_allowed: false,
        automatic_replay_allowed: false,
      },
    });
    expect(JSON.stringify(result.executedArgs)).not.toContain("subject_binding");
    expect(JSON.stringify(result.executedArgs)).not.toContain("action_authority");
  });

  it("uses the sole active Minecraft binding when Codex supplies a generic environment hint", async () => {
    const resolveContext = vi.fn(async () => context() as never);
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:generic-environment-hint",
      toolCallId: "tool_call:player-action-generic-environment-hint",
      providerExecutionId:
        "provider_execution:player-action-generic-environment-hint",
      arguments: {
        destination: { x: 10, y: 64, z: 20 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
        environment_label: "minecraft",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({ resolveContext }),
    });

    expect(result).toMatchObject({ ok: true, status: "completed" });
    expect(resolveContext).toHaveBeenCalledWith(expect.objectContaining({
      environmentBindingId: ENVIRONMENT_ID,
    }));
  });

  it("still fails closed on a generic environment hint when multiple Minecraft bindings are active", async () => {
    const resolveContext = vi.fn();
    const enqueueAction = vi.fn();
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:ambiguous-environment-hint",
      toolCallId: "tool_call:player-action-ambiguous-environment-hint",
      providerExecutionId:
        "provider_execution:player-action-ambiguous-environment-hint",
      arguments: {
        destination: { x: 10, y: 64, z: 20 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
        environment_label: "minecraft",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        listRoomEnvironments: vi.fn(async () => [
          {
            environment_binding_id: "environment_binding:fabric-one",
            source_label: "Fabric one",
            domain: "minecraft",
            connection_status: "active",
          },
          {
            environment_binding_id: "environment_binding:fabric-two",
            source_label: "Fabric two",
            domain: "minecraft",
            connection_status: "active",
          },
        ] as never),
        resolveContext,
        enqueueAction,
      }),
    });

    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      error: "wrong_environment",
      observation: { outcome: "wrong_environment" },
    });
    expect(resolveContext).not.toHaveBeenCalled();
    expect(enqueueAction).not.toHaveBeenCalled();
  });

  it("uses an exact visible label to disambiguate multiple active Minecraft bindings", async () => {
    const resolveContext = vi.fn(async ({ environmentBindingId }) => ({
      ...context(),
      environmentBindingId,
    }) as never);
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:exact-environment-label",
      toolCallId: "tool_call:player-action-exact-environment-label",
      providerExecutionId:
        "provider_execution:player-action-exact-environment-label",
      arguments: {
        destination: { x: 10, y: 64, z: 20 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
        environment_label: "Fabric two",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        listRoomEnvironments: vi.fn(async () => [
          {
            environment_binding_id: "environment_binding:fabric-one",
            source_label: "Fabric one",
            domain: "minecraft",
            connection_status: "active",
          },
          {
            environment_binding_id: "environment_binding:fabric-two",
            source_label: "Fabric two",
            domain: "minecraft",
            connection_status: "active",
          },
        ] as never),
        resolveContext,
      }),
    });

    expect(result).toMatchObject({ ok: true, status: "completed" });
    expect(resolveContext).toHaveBeenCalledWith(expect.objectContaining({
      environmentBindingId: "environment_binding:fabric-two",
    }));
  });

  it("queues exact workflow cancellation when the owning provider turn aborts", async () => {
    const abortController = new AbortController();
    const requestControl = vi.fn(async () => ({}) as never);
    const enqueueAction = vi.fn(async ({ request }) => {
      abortController.abort();
      return request as never;
    });
    const awaitObservation = vi.fn(async ({ signal }: { signal?: AbortSignal }) => {
      expect(signal?.aborted).toBe(true);
      throw new EnvironmentActionBrokerError(
        "action_request_expired",
        499,
        "The action wait was canceled; the workflow was not replayed.",
      );
    });

    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:aborted",
      toolCallId: "tool_call:player-action-aborted",
      providerExecutionId: "provider_execution:player-action-aborted",
      arguments: {
        destination: { x: 2, y: 64, z: 0 },
        arrival_radius: 0.5,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      signal: abortController.signal,
      dependencies: deps({
        enqueueAction,
        awaitObservation: awaitObservation as never,
        requestControl,
      }),
    });

    expect(requestControl).toHaveBeenCalledWith(expect.objectContaining({
      controlKind: "cancel",
      workflowId: expect.stringContaining("environment_action_workflow:"),
      roomId: ROOM_ID,
      environmentBindingId: ENVIRONMENT_ID,
    }));
    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      error: "action_outcome_unknown",
    });
  });

  it("keeps an executed manual cancellation admitted while requiring user repair", async () => {
    const canceledObservation = {
      ...observation,
      outcome: "request_canceled" as const,
      summary: "Manual player input canceled the workflow and released controls.",
      result: {
        manual_override_detected: true,
        manual_override_reason: "screen_open" as const,
        controls_released: true,
      },
    } satisfies HelixEnvironmentActionObservation;
    const enqueueAction = vi.fn(async ({ request }) => request as never);
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:manual-cancel",
      toolCallId: "tool_call:player-action-manual-cancel",
      providerExecutionId: "provider_execution:player-action-manual-cancel",
      arguments: {
        destination: { x: 10, y: 64, z: 20 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        enqueueAction,
        awaitObservation: vi.fn(async () => canceledObservation),
      }),
    });

    expect(enqueueAction).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      error: "request_canceled",
      repairAction: "ask_user",
      observation: {
        outcome: "request_canceled",
        result: {
          manual_override_detected: true,
          manual_override_reason: "screen_open",
          controls_released: true,
        },
      },
    });
    expect(environmentActionGatewayAdmissionStatus(result.status)).toBe("admitted");
  });

  it("fails before environment lookup without trusted room and provider identities", async () => {
    const listRoomEnvironments = vi.fn();
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:untrusted",
      accountContext: null,
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: { listRoomEnvironments },
    });
    expect(result).toMatchObject({
      ok: false,
      status: "blocked",
      error: "permission_revoked",
      observation: {
        provenance_valid: false,
        eligible_for_current_turn_reentry: false,
      },
    });
    expect(listRoomEnvironments).not.toHaveBeenCalled();
  });

  it("keeps approve-each authority blocked until a typed approval path exists", async () => {
    const enqueueAction = vi.fn();
    const result = await executeEnvironmentActionGatewayCapability({
      capabilityId: CAPABILITY_ID,
      turnId: "ask:player-action:approval",
      toolCallId: "tool_call:player-action-approval",
      providerExecutionId: "provider_execution:player-action-approval",
      arguments: {
        destination: { x: 10, y: 64, z: 20 },
        arrival_radius: 1,
        allow_sprint: false,
        allow_dig: false,
        allow_place: false,
        engine_preference: "native_fabric",
      },
      accountContext: accountContext(),
      conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      dependencies: deps({
        resolveContext: vi.fn(async () => context("approve_each") as never),
        enqueueAction,
      }),
    });
    expect(result).toMatchObject({
      ok: false,
      error: "permission_revoked",
      summary: expect.stringContaining("per-action approval"),
    });
    expect(enqueueAction).not.toHaveBeenCalled();
  });
});
