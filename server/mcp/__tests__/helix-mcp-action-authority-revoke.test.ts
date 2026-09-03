import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from
  "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ACTION_AUTHORITY_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
  type HelixEnvironmentActionAuthority,
} from "@shared/helix-environment-action";
import {
  createHelixMcpServer,
  type HelixEnvironmentActionAuthorityRevoker,
} from "../helix-mcp-server";
import type { HelixAgentApiService } from
  "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";
import type { SharedLiveRoomBindingStore } from
  "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from
  "../../services/shared-live-room-control/service";

const ROOM_ID = "shared_realtime_room:revoke-hotfix";
const ENVIRONMENT_BINDING_ID = "environment_binding:revoke-hotfix";
const ACTION_AUTHORITY_ID = "environment_action_authority:revoke-hotfix";

const principal = (): HelixAgentApiPrincipal => {
  const now = "2026-09-03T20:00:00.000Z";
  const policy = buildHelixSharedRealtimeRoomsExperimentPolicy("developer");
  return {
    tenantId: "tenant-revoke-hotfix",
    issuer: "https://issuer.example",
    subjectId: "subject-revoke-hotfix",
    accountProfileId: "profile-revoke-hotfix",
    accountType: "developer",
    scopes: new Set([
      HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
      HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
      HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
    ]),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:revoke-hotfix",
      profile_id: "profile-revoke-hotfix",
      trusted_account_session: true,
      account_session: {
        schema: "helix.account_session.v1",
        session_id: "external-oauth:revoke-hotfix",
        profile: {
          profile_id: "profile-revoke-hotfix",
          display_name: "Revoke Hotfix",
          email: null,
          auth_mode: "web_auth",
          account_type: "developer",
          provider: "external_oauth",
          provider_alias: "test",
          provider_subject: "subject-revoke-hotfix",
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

const revokedAuthority: HelixEnvironmentActionAuthority = {
  schema: HELIX_ENVIRONMENT_ACTION_AUTHORITY_SCHEMA,
  action_authority_id: ACTION_AUTHORITY_ID,
  environment_binding_id: ENVIRONMENT_BINDING_ID,
  room_source_binding_id: "room_source_binding:revoke-hotfix",
  room_id: ROOM_ID,
  source_id: "environment_source:revoke-hotfix",
  world_id: "minecraft:connector:revoke-hotfix",
  adapter_profile_id: "adapter_profile:revoke-hotfix",
  domain_adapter: "minecraft.fabric_mod.v1",
  participant_id: "shared_realtime_participant:revoke-hotfix",
  subject_binding_id: "environment_subject_binding:revoke-hotfix",
  allowed_capability_ids: ["minecraft.player.move.v1"],
  autonomy_mode: "autonomous",
  manual_override_policy: "cancel",
  status: "revoked",
  policy_version: 1,
  issued_at: "2026-09-03T20:00:00.000Z",
  expires_at: "2026-09-03T21:00:00.000Z",
  revoked_at: "2026-09-03T20:05:00.000Z",
  credential_included: false,
  content_role: "environment_action_authority_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

describe("Helix MCP action-authority revoke production hotfix", () => {
  it("revokes the exact owner-scoped authority and returns nonterminal evidence", async () => {
    const revoke = vi.fn(async () => ({
      authority: revokedAuthority,
      controlRequest: {
        schema: "helix.environment_action.control_request.v1",
        control_request_id: "control_request:revoke-hotfix",
      },
    })) as unknown as HelixEnvironmentActionAuthorityRevoker;
    const server = createHelixMcpServer({
      principal: principal(),
      service: {} as HelixAgentApiService,
      roomControlService: {
        inspectRoom: vi.fn(async () => ({
          room: { self_participant_id: revokedAuthority.participant_id },
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
      environmentActionAuthorityRevoker: revoke,
    });
    const client = new Client(
      { name: "revoke-hotfix-test", version: "1.0.0" },
      { capabilities: {} },
    );
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const catalog = await client.listTools();
      expect(catalog.tools.map((tool) => tool.name)).toContain(
        "helix_environment_action_authority_revoke",
      );
      const result = await client.callTool({
        name: "helix_environment_action_authority_revoke",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: ENVIRONMENT_BINDING_ID,
          action_authority_id: ACTION_AUTHORITY_ID,
          reason: "The operator ended the play session.",
        },
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        operation: "environment.action_authority.revoke",
        authority: { status: "revoked" },
        content_role:
          "environment_action_authority_revocation_receipt_not_assistant_answer",
        reentry_required: true,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      expect(revoke).toHaveBeenCalledWith({
        roomId: ROOM_ID,
        profileId: "profile-revoke-hotfix",
        environmentBindingId: ENVIRONMENT_BINDING_ID,
        actionAuthorityId: ACTION_AUTHORITY_ID,
        reason: "The operator ended the play session.",
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
