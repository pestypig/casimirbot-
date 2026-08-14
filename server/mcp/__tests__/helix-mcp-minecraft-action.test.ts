import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
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
import { HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY } from
  "@shared/helix-minecraft-player-capabilities";
import {
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_REACTIVE_PROGRAM_SCHEMA,
} from "@shared/helix-minecraft-reactive-program";
import {
  createHelixMcpServer,
  type HelixEnvironmentActionMcpExecutor,
} from "../helix-mcp-server";
import type { HelixAgentApiService } from
  "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";
import type { SharedLiveRoomBindingStore } from
  "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from
  "../../services/shared-live-room-control/service";

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

const connect = async (input: {
  scopes: readonly string[];
  executeAction: HelixEnvironmentActionMcpExecutor;
}) => {
  const server = createHelixMcpServer({
    principal: principal(input.scopes),
    service: {} as HelixAgentApiService,
    roomControlService: {} as SharedLiveRoomControlService,
    roomBindingStore: {} as Pick<
      SharedLiveRoomBindingStore,
      | "bindRunToRoom"
      | "claimPendingChatBinding"
      | "revokeRunRoomBindingForOwner"
      | "revokeClaimedRunChatBindingForOwner"
    >,
    deviceCheckService: vi.fn(),
    environmentActionExecutor: input.executeAction,
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

describe("Helix MCP Minecraft action boundary", () => {
  it("publishes typed non-terminal tools with separate read and write scopes", async () => {
    const executeAction = vi.fn(async () => ({
      ok: true,
      status: "completed" as const,
      summary: observation.summary,
      observation,
      idempotentReplay: false,
    })) as HelixEnvironmentActionMcpExecutor;
    const connection = await connect({
      scopes: [
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
        HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
      ],
      executeAction,
    });
    try {
      const catalog = await connection.client.listTools();
      const action = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_player_action",
      ) as (typeof catalog.tools)[number] & { _meta?: Record<string, unknown> };
      const status = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_workflow_status",
      ) as (typeof catalog.tools)[number] & { _meta?: Record<string, unknown> };
      const control = catalog.tools.find(
        (candidate) => candidate.name === "helix_minecraft_workflow_control",
      );
      expect(action).toBeDefined();
      expect(status).toBeDefined();
      expect(control).toBeDefined();
      expect(action.annotations).toMatchObject({
        readOnlyHint: false,
        idempotentHint: true,
      });
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
