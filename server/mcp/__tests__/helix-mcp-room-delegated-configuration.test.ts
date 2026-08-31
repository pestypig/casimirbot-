import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import type { SharedLiveRoomControlService } from "../../services/shared-live-room-control/service";
import type { SharedLiveRoomMcpDelegationVerifier } from "../../services/shared-live-room-control/mcp-delegation-verifier";
import { createHelixMcpServer } from "../helix-mcp-server";

const ROOM_ID = "shared_realtime_room:mcp-delegated-configuration";
const SESSION_ID = "external-oauth:delegated-configuration";
const CLIENT_REF = "mcp-client:delegated-configuration";
const THREAD_REF = "codex-thread:delegated-configuration";
const connections: Array<{ client: Client; server: ReturnType<typeof createHelixMcpServer> }> = [];

const principal = (): HelixAgentApiPrincipal => ({
  tenantId: "tenant-room-delegated",
  issuer: "https://issuer.example",
  subjectId: "subject-room-delegated",
  accountProfileId: "profile-room-delegated",
  accountType: "user",
  mcpClientRef: CLIENT_REF,
  scopes: new Set([HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE]),
  tokenExpiresAt: "2099-01-01T00:00:00.000Z",
  accountContext: {
    session_id: SESSION_ID,
    profile_id: "profile-room-delegated",
    trusted_account_session: true,
    account_session: null,
    account_policy: buildHelixSharedRealtimeRoomsExperimentPolicy("user"),
  },
});

const delegation = { receiptId: "opaque-delegation-for-adapter-test" };
const authority = {
  api_version: "v1" as const,
  ok: true as const,
  content_role: "room_control_receipt_not_assistant_answer" as const,
  reentry_required: true as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
};

afterEach(async () => {
  await Promise.all(connections.splice(0).map(async ({ client, server }) => {
    await client.close();
    await server.close();
  }));
});

const connect = async (input: {
  service: SharedLiveRoomControlService;
  verifier?: SharedLiveRoomMcpDelegationVerifier;
  withIdentity?: boolean;
}) => {
  const server = createHelixMcpServer({
    principal: principal(),
    roomControlService: input.service,
    roomMcpDelegationVerifier: input.verifier,
    roomMcpDelegationIdentity: input.withIdentity === false ? undefined : {
      authenticatedMcpClientRef: CLIENT_REF,
      conversationThreadRef: THREAD_REF,
      accountSessionId: SESSION_ID,
    },
  });
  const client = new Client({ name: "room-delegated-configuration-test", version: "1.0.0" }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  connections.push({ client, server });
  return client;
};

describe("Helix MCP delegated Shared Live Room configuration", () => {
  it("exposes both authority-increasing tools but fails closed without trusted conversation identity", async () => {
    const service = { grantOwnConsent: vi.fn(), acquireOwnFloor: vi.fn() } as unknown as SharedLiveRoomControlService;
    const client = await connect({ service, withIdentity: false });
    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(["helix_room_consent_grant", "helix_room_floor_acquire"]));
    const result = await client.callTool({
      name: "helix_room_consent_grant",
      arguments: { idempotency_key: "delegated-consent-001", request: { room_id: ROOM_ID, consent: { microphone_to_model: true } }, delegation },
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ error: "room_mcp_delegation_identity_unavailable", assistant_answer: false, terminal_eligible: false });
    expect((service.grantOwnConsent as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("binds exact request/client/thread identity before invoking the shared handlers", async () => {
    const consume = vi.fn(async ({ expectedBinding }: any) => ({ ok: true as const, delegationRef: `${expectedBinding.capabilityId}:delegation`, requestRef: "request-ref", issues: [] as [] }));
    const grantOwnConsent = vi.fn(async ({ delegationRef }: any) => ({
      status: 201 as const,
      idempotencyReplayed: false,
      body: { ...authority, schema: "helix.shared_live_room.consent_grant_receipt.v1" as const, operation: "room.consent.grant" as const, room: { room_id: ROOM_ID }, changed_fields: ["microphone_to_model"], delegation_ref: delegationRef, authority_delta: "increased_bounded" as const },
    }));
    const acquireOwnFloor = vi.fn(async ({ delegationRef }: any) => ({
      status: 201 as const,
      idempotencyReplayed: false,
      body: { ...authority, schema: "helix.shared_live_room.floor_acquire_receipt.v1" as const, operation: "room.floor.acquire" as const, room: { room_id: ROOM_ID }, granted: true as const, floor: { participant_id: "participant:self", epoch: 4, acquired_at: "2026-08-29T17:00:00.000Z", lease_expires_at: "2026-08-29T17:00:30.000Z" }, delegation_ref: delegationRef, authority_delta: "increased_bounded" as const },
    }));
    const client = await connect({
      service: { grantOwnConsent, acquireOwnFloor } as unknown as SharedLiveRoomControlService,
      verifier: { consume } as SharedLiveRoomMcpDelegationVerifier,
    });
    const grantRequest = { room_id: ROOM_ID, consent: { microphone_to_model: true } };
    const grant = await client.callTool({ name: "helix_room_consent_grant", arguments: { idempotency_key: "delegated-consent-002", request: grantRequest, delegation } });
    expect(grant.isError, JSON.stringify(grant)).not.toBe(true);
    expect(grant.structuredContent).toMatchObject({ operation: "room.consent.grant", receipt: { delegation_ref: "room.consent.grant:delegation", authority_delta: "increased_bounded", assistant_answer: false } });
    const floorRequest = { room_id: ROOM_ID, lease_ms: 15_000 };
    const floor = await client.callTool({ name: "helix_room_floor_acquire", arguments: { idempotency_key: "delegated-floor-001", request: floorRequest, delegation } });
    expect(floor.isError, JSON.stringify(floor)).not.toBe(true);
    expect(floor.structuredContent).toMatchObject({ operation: "room.floor.acquire", receipt: { delegation_ref: "room.floor.acquire:delegation", authority_delta: "increased_bounded", terminal_eligible: false } });
    expect(consume).toHaveBeenNthCalledWith(1, expect.objectContaining({ expectedBinding: expect.objectContaining({ capabilityId: "room.consent.grant", authenticatedMcpClientRef: CLIENT_REF, conversationThreadRef: THREAD_REF, accountSessionId: SESSION_ID, roomId: ROOM_ID }) }));
    expect(consume).toHaveBeenNthCalledWith(2, expect.objectContaining({ expectedBinding: expect.objectContaining({ capabilityId: "room.floor.acquire", authenticatedMcpClientRef: CLIENT_REF, conversationThreadRef: THREAD_REF, roomId: ROOM_ID }) }));
  });
});
