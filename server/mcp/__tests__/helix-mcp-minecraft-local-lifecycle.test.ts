import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from
  "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
  type HelixEnvironmentActionAuthority,
} from "@shared/helix-environment-action";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";
import type { HelixAgentApiService } from
  "../../services/helix-agent-api/service";
import type { SharedLiveRoomBindingStore } from
  "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from
  "../../services/shared-live-room-control/service";
import {
  createHelixMcpServer,
  type HelixEnvironmentActionAuthorityRevoker,
} from "../helix-mcp-server";

const ROOM_ID = "shared_realtime_room:mcp-local-lifecycle";
const ENVIRONMENT_ID = "environment_binding:mcp-local-lifecycle";
const AUTHORITY_ID = "environment_action_authority:mcp-local-lifecycle";

const principal = (): HelixAgentApiPrincipal => {
  const policy = buildHelixSharedRealtimeRoomsExperimentPolicy("developer");
  return {
    tenantId: "tenant:mcp-local-lifecycle",
    issuer: "https://issuer.example",
    subjectId: "subject:mcp-local-lifecycle",
    accountProfileId: "profile:mcp-local-lifecycle",
    accountType: "developer",
    scopes: new Set([
      HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
      HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
    ]),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:mcp-local-lifecycle",
      profile_id: "profile:mcp-local-lifecycle",
      trusted_account_session: true,
      account_session: null,
      account_policy: policy,
    },
  } as HelixAgentApiPrincipal;
};

const authority = (
  overrides: Partial<HelixEnvironmentActionAuthority> = {},
): HelixEnvironmentActionAuthority => ({
  schema: "helix.environment_action.authority.v1",
  action_authority_id: AUTHORITY_ID,
  environment_binding_id: ENVIRONMENT_ID,
  room_source_binding_id: "room_source_binding:mcp-local-lifecycle",
  room_id: ROOM_ID,
  source_id: "source:mcp-local-lifecycle",
  world_id: "minecraft:local:mcp-local-lifecycle",
  adapter_profile_id: "game.minecraft.player.fabric.v1",
  domain_adapter: "minecraft.fabric_client.v1",
  participant_id: "participant:mcp-local-lifecycle",
  subject_binding_id: "subject_binding:mcp-local-lifecycle",
  allowed_capability_ids: ["environment.minecraft.player.look"],
  autonomy_mode: "approved_capabilities",
  manual_override_policy: "cancel",
  status: "active",
  policy_version: 1,
  issued_at: "2026-09-03T20:00:00.000Z",
  expires_at: "2099-09-03T22:00:00.000Z",
  revoked_at: null,
  credential_included: false,
  content_role: "environment_action_authority_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

const connect = async (currentAuthority: HelixEnvironmentActionAuthority) => {
  const launch = vi.fn(async () => ({
    schema: "helix.minecraft.workstation_launch_receipt.v1" as const,
    status: "connected" as const,
    profile_id: "helix-fabric-player",
    profile_version: "1",
    isolated_game_directory: true,
    client_process_id: 1234,
    server_address: "localhost:25565",
    launcher_action: "launched_client" as const,
    connection_action: "autojoin_staged" as const,
    play_control_point: "fabric-client",
    mod_loaded: true as const,
    memory_used_percent: 42,
    credentials_exposed: false as const,
  }));
  const revoke = vi.fn(async () => ({
    authority: authority({ status: "suspended" }),
    controlRequest: {
      schema: "helix.environment_action.control_request.v1",
      control_request_id: "control_request:mcp-local-lifecycle",
    },
  }));
  const server = createHelixMcpServer({
    principal: principal(),
    service: {} as HelixAgentApiService,
    roomControlService: {
      inspectRoom: vi.fn(async () => ({
        room: { self_participant_id: "participant:mcp-local-lifecycle" },
      })),
    } as unknown as SharedLiveRoomControlService,
    roomBindingStore: {} as Pick<SharedLiveRoomBindingStore,
      "bindRunToRoom" | "getActiveRunRoomBinding" |
      "claimPendingChatBinding" | "revokeRunRoomBindingForOwner" |
      "revokeClaimedRunChatBindingForOwner">,
    environmentActionAuthorityInspector: vi.fn(async () => ({
      authorities: [currentAuthority],
      connectorReadiness: [],
    })),
    environmentActionAuthorityRevoker:
      revoke as unknown as HelixEnvironmentActionAuthorityRevoker,
    minecraftLocalLifecycleRunner: launch,
    deviceCheckService: vi.fn(),
  });
  const client = new Client(
    { name: "mcp-local-lifecycle-test", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server, launch, revoke };
};

describe("Helix MCP local Minecraft lifecycle", () => {
  it("launches only through the exact active authority and returns nonterminal evidence", async () => {
    const connection = await connect(authority());
    try {
      const catalog = await connection.client.listTools();
      expect(catalog.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
        "helix_minecraft_local_lifecycle_launch",
        "helix_environment_action_authority_revoke",
      ]));
      const result = await connection.client.callTool({
        name: "helix_minecraft_local_lifecycle_launch",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: ENVIRONMENT_ID,
          action_authority_id: AUTHORITY_ID,
          operator_confirmation: true,
          request: { address: "localhost:25565" },
        },
      });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        status: "connected",
        authority_widened: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      expect(connection.launch).toHaveBeenCalledOnce();
    } finally {
      await connection.client.close();
      await connection.server.close();
    }
  });

  it("rejects an inactive or mismatched authority without launching", async () => {
    const connection = await connect(authority({ status: "revoked" }));
    try {
      for (const actionAuthorityId of [AUTHORITY_ID, "environment_action_authority:wrong"]) {
        const result = await connection.client.callTool({
          name: "helix_minecraft_local_lifecycle_launch",
          arguments: {
            room_id: ROOM_ID,
            environment_binding_id: ENVIRONMENT_ID,
            action_authority_id: actionAuthorityId,
            operator_confirmation: true,
            request: { address: "localhost:25565" },
          },
        });
        expect(result.isError).toBe(true);
      }
      expect(connection.launch).not.toHaveBeenCalled();
    } finally {
      await connection.client.close();
      await connection.server.close();
    }
  });

  it("rejects launch when explicit operator confirmation is absent", async () => {
    const connection = await connect(authority());
    try {
      const result = await connection.client.callTool({
        name: "helix_minecraft_local_lifecycle_launch",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: ENVIRONMENT_ID,
          action_authority_id: AUTHORITY_ID,
          request: { address: "localhost:25565" },
        },
      });
      expect(result.isError).toBe(true);
      expect(connection.launch).not.toHaveBeenCalled();
    } finally {
      await connection.client.close();
      await connection.server.close();
    }
  });

  it("rejects a current authority for a non-Fabric player adapter", async () => {
    const connection = await connect(authority({
      domain_adapter: "minecraft.paper_server.v1",
    }));
    try {
      const result = await connection.client.callTool({
        name: "helix_minecraft_local_lifecycle_launch",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: ENVIRONMENT_ID,
          action_authority_id: AUTHORITY_ID,
          operator_confirmation: true,
          request: { address: "localhost:25565" },
        },
      });
      expect(result.isError).toBe(true);
      expect(connection.launch).not.toHaveBeenCalled();
    } finally {
      await connection.client.close();
      await connection.server.close();
    }
  });

  it("exposes an authority-reducing emergency stop with no terminal authority", async () => {
    const connection = await connect(authority());
    try {
      const result = await connection.client.callTool({
        name: "helix_environment_action_authority_revoke",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: ENVIRONMENT_ID,
          action_authority_id: AUTHORITY_ID,
          reason: "The operator ended the play session.",
        },
      });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        operation: "environment.action_authority.revoke",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      expect(connection.revoke).toHaveBeenCalledOnce();
    } finally {
      await connection.client.close();
      await connection.server.close();
    }
  });
});
