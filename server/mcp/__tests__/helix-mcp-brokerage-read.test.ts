import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import { HELIX_ENVIRONMENT_ACTION_READ_SCOPE } from "@shared/helix-environment-action";
import {
  HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  type HelixBrokerageObservation,
} from "@shared/helix-brokerage-environment";
import { createHelixMcpServer } from "../helix-mcp-server";
import type { HelixAgentApiService } from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";

const ROOM_ID = "shared_realtime_room:g7-mcp";
const PROFILE_ID = "profile:g7-mcp";
const CONNECTION_ID = "brokerage_connection:g7-mcp";
const SOURCE_BINDING_ID = "brokerage_room_binding:g7-mcp";

const principal = (scopes = new Set<string>([
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
])): HelixAgentApiPrincipal => {
  const policy = buildHelixSharedRealtimeRoomsExperimentPolicy("developer");
  const now = "2026-08-23T12:00:00.000Z";
  return {
    tenantId: "tenant:g7-mcp",
    issuer: "https://issuer.example",
    subjectId: "subject:g7-mcp",
    accountProfileId: PROFILE_ID,
    accountType: "developer",
    scopes,
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:g7-mcp",
      profile_id: PROFILE_ID,
      trusted_account_session: true,
      account_session: {
        schema: "helix.account_session.v1",
        session_id: "external-oauth:g7-mcp",
        profile: {
          profile_id: PROFILE_ID,
          display_name: "G7 MCP",
          email: null,
          auth_mode: "web_auth",
          account_type: "developer",
          provider: "external_oauth",
          provider_alias: "test",
          provider_subject: "subject:g7-mcp",
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

const observation: HelixBrokerageObservation = {
  schema: HELIX_BROKERAGE_OBSERVATION_SCHEMA,
  ok: true,
  observation_id: "brokerage_observation:g7-mcp",
  connection_id: CONNECTION_ID,
  room_id: ROOM_ID,
  provider: "robinhood",
  environment_domain: "brokerage",
  upstream_tool: "get_equity_quotes",
  capability_id: "brokerage.robinhood.market_data.read",
  producer_epoch_ref: "brokerage_producer_epoch:g7-mcp",
  observed_at: "2026-08-23T12:00:00.000Z",
  freshness_state: "fresh",
  data: { results: [{ symbol: "TEST", bid: "10.00", ask: "10.01" }] },
  input_hash: `sha256:${"a".repeat(64)}`,
  output_hash: `sha256:${"b".repeat(64)}`,
  redaction_count: 0,
  truncated: false,
  read_only: true,
  live_order_execution_enabled: false,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const connect = async (scopes?: Set<string>) => {
  const brokerageReadExecutor = vi.fn(async () => ({
    ok: true,
    status: "completed" as const,
    summary: "Fresh private-room quote evidence returned.",
    observation,
    sourceBindingId: SOURCE_BINDING_ID,
  }));
  const server = createHelixMcpServer({
    principal: principal(scopes),
    service: {} as HelixAgentApiService,
    brokerageReadExecutor,
  });
  const client = new Client(
    { name: "g7-brokerage-mcp-test", version: "1.0.0" },
    { capabilities: {} },
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    server,
    brokerageReadExecutor,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
};

describe("Helix MCP G7 brokerage read transfer", () => {
  it("exposes a read-only MCP tool and preserves the normalized observation", async () => {
    const connection = await connect();
    try {
      const catalog = await connection.client.listTools();
      const tool = catalog.tools.find(
        (entry) => entry.name === "helix_brokerage_robinhood_read",
      );
      expect(tool).toMatchObject({
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
        },
      });
      expect(JSON.stringify(tool)).not.toContain("place_equity_order");
      expect(JSON.stringify(tool)).not.toContain("get_accounts");

      const result = await connection.client.callTool({
        name: "helix_brokerage_robinhood_read",
        arguments: {
          room_id: ROOM_ID,
          connection_id: CONNECTION_ID,
          upstream_tool: "get_equity_quotes",
          upstream_arguments: { symbols: ["TEST"] },
        },
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        operation: "brokerage.robinhood.read",
        room_id: ROOM_ID,
        source_binding_id: SOURCE_BINDING_ID,
        ok: true,
        observation: {
          observation_id: observation.observation_id,
          producer_epoch_ref: observation.producer_epoch_ref,
          credential_included: false,
          account_numbers_included: false,
          raw_provider_payload_included: false,
          answer_authority: false,
          terminal_eligible: false,
        },
        answer_authority: false,
        terminal_eligible: false,
      });
      expect(connection.brokerageReadExecutor).toHaveBeenCalledWith({
        arguments: {
          connection_id: CONNECTION_ID,
          upstream_tool: "get_equity_quotes",
          upstream_arguments: { symbols: ["TEST"] },
        },
        accountContext: expect.objectContaining({ profile_id: PROFILE_ID }),
        conversationThreadId: `helix-ask:room:${ROOM_ID}`,
      });
    } finally {
      await connection.close();
    }
  });

  it("requires both room-read and environment-read OAuth scopes", async () => {
    const connection = await connect(new Set([HELIX_SHARED_LIVE_ROOM_READ_SCOPE]));
    try {
      const result = await connection.client.callTool({
        name: "helix_brokerage_robinhood_read",
        arguments: {
          room_id: ROOM_ID,
          connection_id: CONNECTION_ID,
          upstream_tool: "get_portfolio",
        },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).toContain("insufficient_scope");
      expect(JSON.stringify(result)).toContain(HELIX_ENVIRONMENT_ACTION_READ_SCOPE);
      expect(connection.brokerageReadExecutor).not.toHaveBeenCalled();
    } finally {
      await connection.close();
    }
  });
});
