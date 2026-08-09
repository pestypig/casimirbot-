import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  type HelixEnvironmentActionObservation,
} from "@shared/helix-environment-action";
import { describe, expect, it, vi } from "vitest";
import type { HelixWorkstationGatewayAccountContext } from "../account-policy";
import {
  environmentActionMinecraftManifests,
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
  ...overrides,
});

describe("Minecraft player-action workstation gateway", () => {
  it("publishes the baseline and reusable bounded, nonterminal, host-free player tools", () => {
    expect(environmentActionMinecraftManifests).toHaveLength(13);
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
