import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from
  "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";
import type { SharedLiveRoomControlService } from
  "../../services/shared-live-room-control/service";
import { createHelixMcpServer } from "../helix-mcp-server";

const ROOM_ID = "shared_realtime_room:mcp-consent-revoke";

const principal = (): HelixAgentApiPrincipal => ({
  tenantId: "tenant-room-consent",
  issuer: "https://issuer.example",
  subjectId: "subject-room-consent",
  accountProfileId: "profile-room-consent",
  accountType: "user",
  scopes: new Set([HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE]),
  tokenExpiresAt: "2099-01-01T00:00:00.000Z",
  accountContext: {
    session_id: "external-oauth:room-consent",
    profile_id: "profile-room-consent",
    trusted_account_session: true,
    account_session: null,
    account_policy: buildHelixSharedRealtimeRoomsExperimentPolicy("user"),
  },
});

const receipt = {
  api_version: "v1" as const,
  ok: true as const,
  schema: "helix.shared_live_room.consent_revoke_receipt.v1" as const,
  operation: "room.consent.revoke" as const,
  content_role: "room_control_receipt_not_assistant_answer" as const,
  room: { room_id: ROOM_ID },
  changed_fields: ["microphone_to_model"],
  authority_delta: "reduced_only" as const,
  reentry_required: true as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
};

const connections: Array<{ client: Client; server: ReturnType<typeof createHelixMcpServer> }> = [];

afterEach(async () => {
  await Promise.all(connections.splice(0).map(async ({ client, server }) => {
    await client.close();
    await server.close();
  }));
});

const connect = async (revokeOwnConsent: ReturnType<typeof vi.fn>) => {
  const roomControlService = {
    revokeOwnConsent,
  } as unknown as SharedLiveRoomControlService;
  const server = createHelixMcpServer({
    principal: principal(),
    roomControlService,
  });
  const client = new Client(
    { name: "room-consent-revoke-test", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  connections.push({ client, server });
  return client;
};

describe("Helix MCP Shared Live Room consent revoke", () => {
  it("exposes an idempotent authority-reducing room setting to user accounts", async () => {
    const revokeOwnConsent = vi.fn(async () => ({
      status: 201 as const,
      body: receipt,
      idempotencyReplayed: false,
    }));
    const client = await connect(revokeOwnConsent);
    const catalog = await client.listTools();
    const tool = catalog.tools.find(
      (candidate) => candidate.name === "helix_room_consent_revoke",
    );
    expect(tool).toBeDefined();
    expect(tool?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });

    const result = await client.callTool({
      name: "helix_room_consent_revoke",
      arguments: {
        idempotency_key: "mcp-consent-revoke-001",
        request: {
          room_id: ROOM_ID,
          consent: { microphone_to_model: false },
        },
      },
    });
    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect(result.structuredContent).toEqual({
      operation: "room.consent.revoke",
      idempotency_replayed: false,
      receipt,
    });
    expect(revokeOwnConsent).toHaveBeenCalledWith({
      actor: expect.objectContaining({
        authKind: "external_oauth",
        profileId: "profile-room-consent",
        accountType: "user",
      }),
      idempotencyKey: "mcp-consent-revoke-001",
      request: {
        room_id: ROOM_ID,
        consent: { microphone_to_model: false },
      },
    });
  });

  it("rejects a consent grant at MCP schema admission", async () => {
    const revokeOwnConsent = vi.fn();
    const client = await connect(revokeOwnConsent);
    const result = await client.callTool({
      name: "helix_room_consent_revoke",
      arguments: {
        idempotency_key: "mcp-consent-grant-blocked-001",
        request: {
          room_id: ROOM_ID,
          consent: { microphone_to_model: true },
        },
      },
    });
    expect(result.isError).toBe(true);
    expect(revokeOwnConsent).not.toHaveBeenCalled();
  });
});
