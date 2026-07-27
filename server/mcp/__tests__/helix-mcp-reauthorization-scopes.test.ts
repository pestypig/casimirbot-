import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  HELIX_AGENT_RUN_WRITE_SCOPE,
} from "@shared/contracts/helix-agent-api.v1";
import { createHelixMcpServer } from "../helix-mcp-server";
import {
  createHelixRunMcpServer,
  type HelixRunMcpServicePort,
} from "../helix-run-mcp-server";
import { HelixAgentApiServiceError } from
  "../../services/helix-agent-api/errors";
import type { HelixAgentApiService } from
  "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from
  "../../services/helix-agent-api/types";
import type { SharedLiveRoomBindingStore } from
  "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from
  "../../services/shared-live-room-control/service";

const DATA_SCOPE = "helix.data.theory_registry.read";

const principal = (): HelixAgentApiPrincipal => ({
  tenantId: "tenant-mcp-reauthorization",
  issuer: "https://issuer.example",
  subjectId: "subject-mcp-reauthorization",
  accountProfileId: "profile-mcp-reauthorization",
  accountType: "developer",
  scopes: new Set([HELIX_AGENT_RUN_WRITE_SCOPE]),
  tokenExpiresAt: "2099-01-01T00:00:00.000Z",
  accountContext: {
    session_id: "external-oauth:mcp-reauthorization",
    profile_id: "profile-mcp-reauthorization",
    trusted_account_session: true,
    account_session: null,
    account_policy: buildHelixAccountCapabilityPolicy("developer"),
  },
});

const serviceMissingLogicalDataScope = (): {
  service: HelixRunMcpServicePort;
  startRun: ReturnType<typeof vi.fn>;
} => {
  const startRun = vi.fn().mockRejectedValue(
    new HelixAgentApiServiceError(
      403,
      "insufficient_scope",
      "The verified principal is not entitled to the theory registry.",
      false,
      {
        denied_scopes: ["theory_registry"],
        required_oauth_scopes: [
          DATA_SCOPE,
          DATA_SCOPE,
          "helix.data.invalid scope.read",
          'helix.data.invalid"scope.read',
          "helix.data.invalid\r\nX-Secret: do-not-emit",
          { token: "do-not-emit" },
        ],
      },
    ),
  );
  return {
    startRun,
    service: {
      startRun,
      continueRun: vi.fn(),
      cancelRun: vi.fn(),
      inspectRun: vi.fn(),
      fetchEvidence: vi.fn(),
      listEvents: vi.fn(),
    } as unknown as HelixRunMcpServicePort,
  };
};

type ServerFactory = (
  principalValue: HelixAgentApiPrincipal,
  service: HelixRunMcpServicePort,
) => McpServer;

const serverFactories: ReadonlyArray<{
  name: string;
  create: ServerFactory;
}> = [
  {
    name: "core run server",
    create: (principalValue, service) =>
      createHelixRunMcpServer({
        principal: principalValue,
        service,
      }),
  },
  {
    name: "composed server",
    create: (principalValue, service) =>
      createHelixMcpServer({
        principal: principalValue,
        service: service as unknown as HelixAgentApiService,
        roomControlService: {} as SharedLiveRoomControlService,
        roomBindingStore: {} as Pick<
          SharedLiveRoomBindingStore,
          | "bindRunToRoom"
          | "claimPendingChatBinding"
          | "revokeRunRoomBindingForOwner"
          | "revokeClaimedRunChatBindingForOwner"
        >,
      }),
  },
];

const originalPublicBaseUrl = process.env.CASIMIR_PUBLIC_BASE_URL;

afterEach(() => {
  if (originalPublicBaseUrl === undefined) {
    delete process.env.CASIMIR_PUBLIC_BASE_URL;
  } else {
    process.env.CASIMIR_PUBLIC_BASE_URL = originalPublicBaseUrl;
  }
  vi.restoreAllMocks();
});

describe.each(serverFactories)(
  "MCP dynamic reauthorization scopes - $name",
  ({ create }) => {
    it("challenges for the missing logical data-scope entitlement only", async () => {
      process.env.CASIMIR_PUBLIC_BASE_URL = "https://agent.example";
      const service = serviceMissingLogicalDataScope();
      const server = create(principal(), service.service);
      const client = new Client(
        { name: "mcp-reauthorization-test", version: "1.0.0" },
        { capabilities: {} },
      );
      const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);
      await client.connect(clientTransport);

      try {
        const called = await client.callTool({
          name: "helix_run_start",
          arguments: {
            idempotency_key: "logical-data-scope-test",
            request: {
              objective: "Evaluate the theory registry.",
              database_scope: ["theory_registry"],
            },
          },
        });

        expect(called.isError).toBe(true);
        expect(called.structuredContent).toMatchObject({
          error: "insufficient_scope",
          details: {
            denied_scopes: ["theory_registry"],
          },
        });
        const meta = (
          called as unknown as {
            _meta?: Record<string, unknown>;
          }
        )._meta;
        const challenges = meta?.["mcp/www_authenticate"];
        expect(challenges).toEqual([expect.any(String)]);
        const challenge = (challenges as string[])[0];
        expect(challenge).toContain(
          'resource_metadata="https://agent.example/.well-known/oauth-protected-resource/mcp"',
        );
        expect(challenge).toContain('error="insufficient_scope"');
        expect(challenge).toContain(`scope="${DATA_SCOPE}"`);
        expect(challenge).not.toContain(HELIX_AGENT_RUN_WRITE_SCOPE);
        expect(challenge).not.toContain("invalid scope");
        expect(challenge).not.toContain("X-Secret");
        expect(challenge).not.toContain("do-not-emit");
        expect(service.startRun).toHaveBeenCalledWith(
          expect.objectContaining({
            request: expect.objectContaining({
              database_scope: ["theory_registry"],
            }),
          }),
        );
      } finally {
        await client.close();
        await server.close();
      }
    });
  },
);
