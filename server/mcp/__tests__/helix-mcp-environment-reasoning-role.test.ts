import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import { HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE } from "@shared/helix-environment-action";
import {
  HELIX_ENVIRONMENT_REASONING_ROLE_PROJECTION_SCHEMA,
  helixEnvironmentReasoningRoleSha256,
  type HelixEnvironmentReasoningRoleProjection,
} from "@shared/helix-environment-reasoning-role";
import {
  createHelixMcpServer,
  type HelixEnvironmentReasoningRoleMcpStore,
} from "../helix-mcp-server";
import type { HelixAgentApiService } from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import type { SharedLiveRoomBindingStore } from "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from "../../services/shared-live-room-control/service";

const ROOM_ID = "shared_realtime_room:g6-mcp";
const PARTICIPANT_ID = "participant:g6-mcp";
const PROFILE_ID = "profile:g6-mcp";
const GOAL_ID = "environment_durable_goal:g6-mcp";

const principal = (): HelixAgentApiPrincipal => {
  const policy = buildHelixSharedRealtimeRoomsExperimentPolicy("developer");
  const now = "2026-08-23T12:00:00.000Z";
  return {
    tenantId: "tenant:g6-mcp",
    issuer: "https://issuer.example",
    subjectId: "subject:g6-mcp",
    accountProfileId: PROFILE_ID,
    accountType: "developer",
    scopes: new Set([
      HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
      HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
    ]),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:g6-mcp",
      profile_id: PROFILE_ID,
      trusted_account_session: true,
      account_session: {
        schema: "helix.account_session.v1",
        session_id: "external-oauth:g6-mcp",
        profile: {
          profile_id: PROFILE_ID,
          display_name: "G6 MCP",
          email: null,
          auth_mode: "web_auth",
          account_type: "developer",
          provider: "external_oauth",
          provider_alias: "test",
          provider_subject: "subject:g6-mcp",
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

const projection = {
  schema: HELIX_ENVIRONMENT_REASONING_ROLE_PROJECTION_SCHEMA,
  goal_id: GOAL_ID,
  revision: 1,
  latest_event_hash: `sha256:${"a".repeat(64)}`,
  outputs: [],
  invalidated_output_ids: [],
  principal_dispositions: [],
  arbitrations: [],
  execution_links: [],
  measured_result_links: [],
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
} as HelixEnvironmentReasoningRoleProjection;

const connect = async () => {
  const roleStore = {
    recordOutput: vi.fn(async () => projection),
    inspect: vi.fn(async () => projection),
    recordPrincipalDisposition: vi.fn(async () => ({ ...projection, revision: 2 })),
    arbitrate: vi.fn(async () => ({ ...projection, revision: 3 })),
  } satisfies HelixEnvironmentReasoningRoleMcpStore;
  const server = createHelixMcpServer({
    principal: principal(),
    service: {} as HelixAgentApiService,
    roomControlService: {
      inspectRoom: vi.fn(async () => ({
        room: { self_participant_id: PARTICIPANT_ID },
      })),
    } as unknown as SharedLiveRoomControlService,
    roomBindingStore: {} as Pick<
      SharedLiveRoomBindingStore,
      | "bindRunToRoom"
      | "claimPendingChatBinding"
      | "revokeRunRoomBindingForOwner"
      | "revokeClaimedRunChatBindingForOwner"
    >,
    deviceCheckService: vi.fn(),
    environmentReasoningRoleService: roleStore,
  });
  const client = new Client(
    { name: "g6-mcp-test", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    roleStore,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
};

describe("Helix MCP G6 environment reasoning roles", () => {
  it("exposes record, inspect, disposition, and arbitration as nonterminal tools", async () => {
    const connection = await connect();
    try {
      const catalog = await connection.client.listTools();
      expect(catalog.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
        "helix_environment_reasoning_role_record",
        "helix_environment_reasoning_role_inspect",
        "helix_environment_reasoning_role_disposition",
        "helix_environment_reasoning_role_arbitrate",
      ]));

      const adoptedArgs = { direction: "forward", duration_ms: 100, sprint: false };
      const result = await connection.client.callTool({
        name: "helix_environment_reasoning_role_disposition",
        arguments: {
          room_id: ROOM_ID,
          turn_id: "ask:principal:g6-mcp",
          goal_id: GOAL_ID,
          expected_ledger_revision: 1,
          role_output_id: "environment_reasoning_role_output:one",
          disposition: "adopted",
          adopted_capability_id: "com.casimirbot.minecraft.player.walk",
          adopted_capability_arguments: adoptedArgs,
          rationale_summary: "Adopt the current bounded movement proposal.",
        },
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        operation: "com.casimirbot.environment.reasoning_role.disposition",
        reentry_required: true,
        answer_authority: false,
        terminal_eligible: false,
      });
      expect(connection.roleStore.recordPrincipalDisposition).toHaveBeenCalledWith(
        expect.objectContaining({
          principalTurnId: "ask:principal:g6-mcp",
          adoptedCapabilityArgumentsHash:
            helixEnvironmentReasoningRoleSha256(adoptedArgs),
        }),
      );
    } finally {
      await connection.close();
    }
  });
});
