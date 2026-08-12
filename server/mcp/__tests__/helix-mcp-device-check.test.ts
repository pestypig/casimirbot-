import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from
  "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import { HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA } from
  "@shared/helix-environment-device-check";
import {
  createHelixDeviceCheckMcpServer,
  HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH,
  type HelixEnvironmentDeviceCheckServicePort,
} from "../helix-mcp-server";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";

const principal = (scopes: readonly string[]): HelixAgentApiPrincipal => ({
  tenantId: "tenant-device-check",
  issuer: "https://issuer.example",
  subjectId: "subject-device-check",
  accountProfileId: "profile-device-check",
  accountType: "developer",
  scopes: new Set(scopes),
  tokenExpiresAt: "2099-01-01T00:00:00.000Z",
  accountContext: {
    session_id: "external-oauth:device-check",
    profile_id: "profile-device-check",
    trusted_account_session: true,
    account_session: null,
    account_policy: buildHelixSharedRealtimeRoomsExperimentPolicy("developer"),
  },
});

const createConnectedClient = async (input: {
  scopes: readonly string[];
  deviceCheckService: HelixEnvironmentDeviceCheckServicePort;
}) => {
  const server = createHelixDeviceCheckMcpServer({
    principal: principal(input.scopes),
    deviceCheckService: input.deviceCheckService,
  });
  const client = new Client(
    { name: "casimirbot-device-check-test", version: "1.0.0" },
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

const emptyObservation = () => ({
  schema: HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA,
  generated_at: "2026-08-11T20:00:00.000Z",
  devices: [],
  content_role: "device_health_observations_not_assistant_answer" as const,
  credential_included: false as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
});

const originalPublicBaseUrl = process.env.CASIMIR_PUBLIC_BASE_URL;
const ROOM_ID = "shared_realtime_room:mcp-device-check";

afterEach(() => {
  if (originalPublicBaseUrl === undefined) {
    delete process.env.CASIMIR_PUBLIC_BASE_URL;
  } else {
    process.env.CASIMIR_PUBLIC_BASE_URL = originalPublicBaseUrl;
  }
  vi.restoreAllMocks();
});

describe("Helix MCP Device Check boundary", () => {
  it("publishes and executes one owner-scoped read-only observation tool", async () => {
    const deviceCheckService = vi.fn(async () => emptyObservation());
    const connection = await createConnectedClient({
      scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      deviceCheckService,
    });
    try {
      const catalog = await connection.client.listTools();
      expect(catalog.tools.map((candidate) => candidate.name)).toEqual([
        "helix_environment_device_check",
      ]);
      const tool = catalog.tools.find(
        (candidate) => candidate.name === "helix_environment_device_check",
      ) as (typeof catalog.tools)[number] & {
        _meta?: Record<string, unknown>;
      };
      expect(tool).toBeDefined();
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
      expect(tool._meta?.securitySchemes).toEqual([
        {
          type: "oauth2",
          scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
        },
      ]);

      const result = await connection.client.callTool({
        name: "helix_environment_device_check",
        arguments: { room_id: ROOM_ID },
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      expect(result.structuredContent).toEqual(emptyObservation());
      expect(result.structuredContent).toMatchObject({
        credential_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
      expect(deviceCheckService).toHaveBeenCalledWith({
        ownerProfileId: "profile-device-check",
        roomId: ROOM_ID,
      });
    } finally {
      await connection.close();
    }
  });

  it("fails with a scope challenge before reading device state", async () => {
    process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
    const deviceCheckService = vi.fn(async () => emptyObservation());
    const connection = await createConnectedClient({
      scopes: [],
      deviceCheckService,
    });
    try {
      const result = await connection.client.callTool({
        name: "helix_environment_device_check",
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        error: "insufficient_scope",
      });
      const meta = (result as { _meta?: Record<string, unknown> })._meta;
      const challenges = meta?.["mcp/www_authenticate"] as string[];
      expect(challenges).toHaveLength(1);
      expect(challenges[0]).toContain(
        `resource_metadata="https://agent.example${HELIX_DEVICE_CHECK_RESOURCE_METADATA_PATH}"`,
      );
      expect(challenges[0]).toContain(
        `scope="${HELIX_SHARED_LIVE_ROOM_READ_SCOPE}"`,
      );
      expect(deviceCheckService).not.toHaveBeenCalled();
    } finally {
      await connection.close();
    }
  });
});
