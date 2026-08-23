import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from
  "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
  type HelixEnvironmentActionObservation,
} from "@shared/helix-environment-action";
import {
  HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  type HelixEnvironmentProbeObservation,
} from "@shared/helix-environment-connector";
import {
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
} from
  "@shared/helix-minecraft-player-capabilities";
import {
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA,
} from "@shared/helix-minecraft-reactive-program";
import {
  createHelixMcpServer,
  type HelixEnvironmentActionMcpExecutor,
  type HelixEnvironmentActionAuthorityLeaseExtender,
  type HelixEnvironmentProbeMcpExecutor,
} from "../helix-mcp-server";
import type { HelixAgentApiService } from
  "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";
import type { SharedLiveRoomBindingStore } from
  "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from
  "../../services/shared-live-room-control/service";
import {
  enqueueStagePlayLiveSourceMailItem,
  resetStagePlayLiveSourceMailboxForTest,
} from "../../services/stage-play/stage-play-live-source-mailbox-store";

const ROOM_ID = "shared_realtime_room:mcp-minecraft-action";

const principal = (scopes: readonly string[]): HelixAgentApiPrincipal => {
  const policy = buildHelixSharedRealtimeRoomsExperimentPolicy("developer");
  const now = "2026-08-12T20:00:00.000Z";
  return {
    tenantId: "tenant-mcp-minecraft-action",
    issuer: "https://issuer.example",
    subjectId: "subject-mcp-minecraft-action",
    accountProfileId: "profile-mcp-minecraft-action",
    accountType: "developer",
    scopes: new Set(scopes),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:mcp-minecraft-action",
      profile_id: "profile-mcp-minecraft-action",
      trusted_account_session: true,
      account_session: {
        schema: "helix.account_session.v1",
        session_id: "external-oauth:mcp-minecraft-action",
        profile: {
          profile_id: "profile-mcp-minecraft-action",
          display_name: "MCP Minecraft Action",
          email: null,
          auth_mode: "web_auth",
          account_type: "developer",
          provider: "external_oauth",
          provider_alias: "test",
          provider_subject: "subject-mcp-minecraft-action",
          picture_url: null,
          created_at: now,
          updated_at: now,
        },
        account_policy: policy,
        status: "active",
        memory_scope: "profile",
        created_at: now,
        updated_at: now,
        expires_at: "2099-01-01T00:00:00.000Z",
      },
      account_policy: policy,
    },
  };
};

const observation: HelixEnvironmentActionObservation = {
  schema: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  action_request_ref: "environment_action_request:mcp-jump",
  workflow_ref: "environment_action_workflow:mcp-jump",
  action_execution_ref: "environment_action_execution:mcp-jump",
  capability_id: HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  capability_version: 1,
  action_kind: "jump",
  outcome: "succeeded",
  summary: "The paired player completed one jump.",
  result: { controls_released: true },
  progress_observation_refs: ["environment_action_event:mcp-jump"],
  postcondition_evidence_refs: ["environment_action_event:mcp-jump"],
  evidence_ref: "environment_action_evidence:mcp-jump",
  observed_at: "2026-08-12T20:00:01.000Z",
  provenance_valid: true,
  eligible_for_current_turn_reentry: true,
  content_role: "environment_action_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const actorStatusObservation: HelixEnvironmentProbeObservation = {
  schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  probe_request_ref: "environment_probe_request:mcp-actor-status",
  probe_attempt_ref: "environment_probe_attempt:mcp-actor-status",
  capability_id: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  capability_version: 1,
  outcome: "succeeded",
  summary: "The selected player is alive and viable.",
  result: { health: 20, air: 300, alive: true, controls_released: true },
  evidence_ref: "environment_probe_evidence:mcp-actor-status",
  observed_at: "2026-08-12T20:00:01.000Z",
  freshness_age_ms: 0,
  provenance_valid: true,
  eligible_for_current_turn_reentry: true,
  late_result_disposition: null,
  content_role: "environment_probe_observation_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const connect = async (input: {
  scopes: readonly string[];
  executeAction: HelixEnvironmentActionMcpExecutor;
  executeProbe?: HelixEnvironmentProbeMcpExecutor;
  extendAuthority?: HelixEnvironmentActionAuthorityLeaseExtender;
}) => {
  const roomControlService = {
    inspectRoom: vi.fn(async () => ({
      room: { self_participant_id: "participant:mcp-self" },
    })),
  } as unknown as SharedLiveRoomControlService;
  const server = createHelixMcpServer({
    principal: principal(input.scopes),
    service: {} as HelixAgentApiService,
    roomControlService,
    roomBindingStore: {} as Pick<
      SharedLiveRoomBindingStore,
      | "bindRunToRoom"
      | "claimPendingChatBinding"
      | "revokeRunRoomBindingForOwner"
      | "revokeClaimedRunChatBindingForOwner"
    >,
    deviceCheckService: vi.fn(),
    environmentActionExecutor: input.executeAction,
    environmentProbeExecutor: input.executeProbe,
    environmentActionAuthorityLeaseExtender: input.extendAuthority,
  });
  const client = new Client(
    { name: "helix-minecraft-action-mcp-test", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
};

afterEach(() => {
  resetStagePlayLiveSourceMailboxForTest();
});

describe("Helix MCP Minecraft action boundary", () => {
  it("publishes typed non-terminal tools with separate read and write scopes", async () => {
    const executeAction = vi.fn(async () => ({
      ok: true,
      status: "completed" as const,
      summary: observation.summary,
      observation,
      idempotentReplay: false,
    })) as HelixEnvironmentActionMcpExecutor;
    const executeProbe = vi.fn(async () => ({
      ok: true,
      status: "completed" as const,
      summary: actorStatusObservation.summary,
      observation: actorStatusObservation,
    })) as HelixEnvironmentProbeMcpExecutor;
    const extendAuthority = vi.fn(async (input) => ({
      schema: "helix.environment_action_authority.v1",
      action_authority_id: input.actionAuthorityId,
      environment_binding_id: input.environmentBindingId,
      room_source_binding_id: "room_source_binding:mcp",
      room_id: input.roomId,
      source_id: "source:mcp",
      world_id: "minecraft:local:mcp",
      adapter_profile_id: "game.minecraft.player.fabric.v1",
      domain_adapter: "minecraft.fabric_mod.v1",
      participant_id: "participant:mcp-self",
      subject_binding_id: "subject_binding:mcp",
      allowed_capability_ids: [HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY],
      autonomy_mode: "approved_capabilities",
      manual_override_policy: "pause",
      status: "active",
      policy_version: 1,
      issued_at: "2026-08-12T20:00:00.000Z",
      expires_at: input.expiresAt,
      revoked_at: null,
      credential_included: false,
      content_role: "environment_action_authority_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    })) as HelixEnvironmentActionAuthorityLeaseExtender;
    const connection = await connect({
      scopes: [
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
        HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
      ],
      executeAction,
      executeProbe,
      extendAuthority,
    });
    try {
      const catalog = await connection.client.listTools();
      const action = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_player_action",
      ) as (typeof catalog.tools)[number] & { _meta?: Record<string, unknown> };
      const actorStatus = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_actor_status",
      ) as (typeof catalog.tools)[number] & { _meta?: Record<string, unknown> };
      const semanticWake = catalog.tools.find(
        (candidate) => candidate.name === "helix_environment_semantic_wake_read",
      ) as (typeof catalog.tools)[number] & { _meta?: Record<string, unknown> };
      const status = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_workflow_status",
      ) as (typeof catalog.tools)[number] & { _meta?: Record<string, unknown> };
      const control = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_workflow_control",
      );
      expect(action).toBeDefined();
      expect(actorStatus).toBeDefined();
      expect(semanticWake).toBeDefined();
      expect(status).toBeDefined();
      expect(control).toBeDefined();
      expect(action.annotations).toMatchObject({
        readOnlyHint: false,
        idempotentHint: true,
      });
      expect(actorStatus.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
      });
      expect(actorStatus._meta?.securitySchemes).toEqual([{
        type: "oauth2",
        scopes: [
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
        ],
      }]);
      expect(action._meta?.securitySchemes).toEqual([{
        type: "oauth2",
        scopes: [
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
        ],
      }]);
      expect(status._meta?.securitySchemes).toEqual([{
        type: "oauth2",
        scopes: [
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
        ],
      }]);

      const extendedExpiry = new Date(Date.now() + 60 * 60_000).toISOString();
      const extendedAuthority = await connection.client.callTool({
        name: "helix_environment_action_authority_extend",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: "environment:mcp",
          action_authority_id: "environment_action_authority:mcp",
          expires_at: extendedExpiry,
        },
      });
      expect(extendedAuthority.isError, JSON.stringify(extendedAuthority)).not.toBe(true);
      expect(extendedAuthority.structuredContent).toMatchObject({
        operation: "environment.action_authority.extend",
        authority: {
          action_authority_id: "environment_action_authority:mcp",
          expires_at: extendedExpiry,
          credential_included: false,
        },
        reentry_required: true,
        answer_authority: false,
        terminal_eligible: false,
      });
      expect(semanticWake.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      });
      expect(semanticWake._meta?.securitySchemes).toEqual([{
        type: "oauth2",
        scopes: [
          HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
          HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
        ],
      }]);

      enqueueStagePlayLiveSourceMailItem({
        threadId: `helix-ask:room:${ROOM_ID}`,
        roomId: ROOM_ID,
        environmentId: "room_source_binding:mcp-wake",
        sourceId: "source:mcp-wake",
        sourceKind: "minecraft_world_event",
        environmentIdentity: {
          producerPlane: "player_embodiment",
          roomSourceBindingId: "room_source_binding:mcp-wake",
          worldId: "minecraft:local:mcp-wake",
          producerEpochRef: "environment_action_epoch:mcp-wake",
          subjectRef: "environment_subject_binding:mcp-wake",
          participantId: "participant:mcp-self",
          selectedPlayerRef: "environment_subject_binding:mcp-wake",
          selectedPlayerNativeId: "player-native:mcp-self",
          observationRevision: 7,
          digestId: "environment_situation_digest:mcp-wake",
          digestHash: "sha256:mcp-wake",
          provenanceValid: true,
        },
        evidenceRef: "environment_situation_digest:mcp-wake",
        summaryText: JSON.stringify({
          schema: "helix.minecraft_semantic_wake_evidence.v1",
          semantic_state: { active_workflow: null },
          answer_authority: false,
        }),
        summaryPreview: "Minecraft semantic change: workflow.succeeded.",
        createdAt: new Date().toISOString(),
      });
      enqueueStagePlayLiveSourceMailItem({
        threadId: `helix-ask:room:${ROOM_ID}`,
        roomId: ROOM_ID,
        environmentId: "room_source_binding:mcp-other",
        sourceId: "source:mcp-other",
        sourceKind: "minecraft_world_event",
        environmentIdentity: {
          producerPlane: "player_embodiment",
          roomSourceBindingId: "room_source_binding:mcp-other",
          worldId: "minecraft:local:mcp-other",
          producerEpochRef: "environment_action_epoch:mcp-other",
          subjectRef: "environment_subject_binding:mcp-other",
          participantId: "participant:mcp-other",
          selectedPlayerRef: "environment_subject_binding:mcp-other",
          selectedPlayerNativeId: "player-native:mcp-other",
          observationRevision: 8,
          digestId: "environment_situation_digest:mcp-other",
          digestHash: "sha256:mcp-other",
          provenanceValid: true,
        },
        evidenceRef: "environment_situation_digest:mcp-other",
        summaryText: "{}",
        createdAt: new Date().toISOString(),
      });

      const semanticWakeResult = await connection.client.callTool({
        name: "helix_environment_semantic_wake_read",
        arguments: { room_id: ROOM_ID, after_observation_revision: 6 },
      });
      expect(semanticWakeResult.isError, JSON.stringify(semanticWakeResult)).not.toBe(true);
      expect(semanticWakeResult.structuredContent).toMatchObject({
        operation: "environment.semantic_wake.read",
        room_id: ROOM_ID,
        items: [{
          digest_id: "environment_situation_digest:mcp-wake",
          observation_revision: 7,
          participant_id: "participant:mcp-self",
          freshness: "fresh",
        }],
        reentry_required: true,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });

      const actorStatusResult = await connection.client.callTool({
        name: "helix_minecraft_actor_status",
        arguments: { room_id: ROOM_ID },
      });
      expect(actorStatusResult.isError, JSON.stringify(actorStatusResult)).not.toBe(true);
      expect(actorStatusResult.structuredContent).toMatchObject({
        operation: "minecraft.actor.status.read",
        room_id: ROOM_ID,
        ok: true,
        status: "completed",
        observation: {
          capability_id: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
          evidence_ref: "environment_probe_evidence:mcp-actor-status",
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
        },
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      expect(executeProbe).toHaveBeenCalledWith(expect.objectContaining({
        capabilityId: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
        arguments: {},
        accountContext: expect.objectContaining({
          profile_id: "profile-mcp-minecraft-action",
        }),
        conversationThreadId: `helix-ask:room:${ROOM_ID}`,
        turnId: expect.stringMatching(/^mcp_environment_probe_turn:/),
        toolCallId: expect.stringMatching(/^mcp_environment_probe_tool_call:/),
        providerExecutionId: expect.stringMatching(/^mcp_environment_probe_execution:/),
      }));

      const result = await connection.client.callTool({
        name: "helix_minecraft_player_action",
        arguments: {
          room_id: ROOM_ID,
          idempotency_key: "mcp-minecraft-jump-once",
          action: { action_kind: "jump", count: 1 },
        },
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        operation: "minecraft.player.action",
        room_id: ROOM_ID,
        ok: true,
        status: "completed",
        observation: {
          workflow_ref: "environment_action_workflow:mcp-jump",
          answer_authority: false,
          assistant_answer: false,
          terminal_eligible: false,
        },
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({
        capabilityId: HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
        arguments: { count: 1 },
        accountContext: expect.objectContaining({
          profile_id: "profile-mcp-minecraft-action",
        }),
        conversationThreadId: `helix-ask:room:${ROOM_ID}`,
        turnId: expect.stringMatching(/^mcp_environment_turn:/),
        toolCallId: expect.stringMatching(/^mcp_environment_tool_call:/),
        providerExecutionId: expect.stringMatching(/^mcp_environment_execution:/),
      }));

      const lookResult = await connection.client.callTool({
        name: "helix_minecraft_player_action",
        arguments: {
          room_id: ROOM_ID,
          idempotency_key: "mcp-minecraft-retain-focus",
          action: {
            action_kind: "look_at",
            target: { target_kind: "current_focus" },
            max_turn_degrees_per_tick: 1,
          },
        },
      });
      expect(lookResult.isError, JSON.stringify(lookResult)).not.toBe(true);
      expect(executeAction).toHaveBeenLastCalledWith(expect.objectContaining({
        capabilityId: HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
        arguments: {
          target_kind: "current_focus",
          max_turn_degrees_per_tick: 1,
        },
      }));

      const reactiveResult = await connection.client.callTool({
        name: "helix_minecraft_player_action",
        arguments: {
          room_id: ROOM_ID,
          idempotency_key: "mcp-minecraft-reactive-jump",
          action: {
            action_kind: "execute_reactive_program",
            program_schema: HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA,
            program_id: "program:mcp-reactive-jump",
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
            lanes: [{
              lane_id: "lane:jump",
              lane_kind: "locomotion",
              priority: 50,
              required: true,
              activation: "immediate",
              resource_ceiling: ["locomotion"],
              start_node_id: "node:jump",
              nodes: [
                {
                  node_id: "node:jump",
                  node_kind: "action",
                  earliest_tick: 0,
                  timeout_ticks: 40,
                  action: { action_kind: "jump", count: 1 },
                  on_success: "node:done",
                  on_failure: "node:failed",
                  on_timeout: "node:failed",
                },
                {
                  node_id: "node:done",
                  node_kind: "terminal",
                  terminal_outcome: "succeeded",
                  reason_code: "jump_done",
                },
                {
                  node_id: "node:failed",
                  node_kind: "terminal",
                  terminal_outcome: "failed",
                  reason_code: "jump_failed",
                },
              ],
            }],
            races: [],
            interrupts: [],
          },
        },
      });
      expect(reactiveResult.isError, JSON.stringify(reactiveResult)).not.toBe(true);
      expect(executeAction).toHaveBeenLastCalledWith(expect.objectContaining({
        capabilityId: HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
        arguments: expect.objectContaining({
          program_id: "program:mcp-reactive-jump",
          scheduler_engine: "native_fabric_concurrent",
        }),
      }));
    } finally {
      await connection.close();
    }
  });

  it("rejects action execution before the broker when the write scope is absent", async () => {
    const executeAction = vi.fn() as unknown as HelixEnvironmentActionMcpExecutor;
    const connection = await connect({
      scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      executeAction,
    });
    try {
      const result = await connection.client.callTool({
        name: "helix_minecraft_player_action",
        arguments: {
          room_id: ROOM_ID,
          idempotency_key: "mcp-minecraft-scope-denial",
          action: { action_kind: "jump", count: 1 },
        },
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        error: "insufficient_scope",
      });
      const challenge = (
        result as unknown as { _meta?: { "mcp/www_authenticate"?: string[] } }
      )._meta?.["mcp/www_authenticate"]?.[0] ?? "";
      expect(challenge).toContain(HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE);
      expect(executeAction).not.toHaveBeenCalled();
    } finally {
      await connection.close();
    }
  });
});
