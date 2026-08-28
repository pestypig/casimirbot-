import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_AGENT_RUN_READ_SCOPE } from "@shared/contracts/helix-agent-api.v1";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import { createHelixMcpServer } from "../helix-mcp-server";

const principal = (scopes: readonly string[]): HelixAgentApiPrincipal => ({
  tenantId: "tenant-public-ui-catalog",
  issuer: "https://issuer.example",
  subjectId: "subject-public-ui-catalog",
  accountProfileId: "profile-public-ui-catalog",
  accountType: "user",
  scopes: new Set(scopes),
  tokenExpiresAt: "2099-01-01T00:00:00.000Z",
  accountContext: {
    session_id: "external-oauth:public-ui-catalog",
    profile_id: "profile-public-ui-catalog",
    trusted_account_session: true,
    account_session: null,
    account_policy: buildHelixAccountCapabilityPolicy("user"),
  },
});

const connect = async (scopes: readonly string[]) => {
  const server = createHelixMcpServer({ principal: principal(scopes) });
  const client = new Client(
    { name: "helix-public-ui-catalog-test", version: "1.0.0" },
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

describe("Helix MCP public UI catalog", () => {
  it("publishes the public-only catalog as a read-only authenticated tool", async () => {
    const connection = await connect([HELIX_AGENT_RUN_READ_SCOPE]);
    try {
      const listed = await connection.client.listTools();
      const tool = listed.tools.find((candidate) => candidate.name === "helix_public_ui_catalog") as
        | ((typeof listed.tools)[number] & { _meta?: Record<string, unknown> })
        | undefined;
      expect(tool).toBeDefined();
      expect(tool?.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
      expect(tool?._meta?.securitySchemes).toEqual([
        { type: "oauth2", scopes: [HELIX_AGENT_RUN_READ_SCOPE] },
      ]);

      const result = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {},
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      const catalog = result.structuredContent as Record<string, unknown>;
      expect(catalog).toMatchObject({
        schema: "helix.public_ui_agent_catalog.v1",
        account_type: "user",
        content_role: "public_ui_catalog_observation_not_assistant_answer",
        credential_included: false,
        private_state_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        orphan_capability_ids: [],
        control_binding_failures: [],
        totals: {
          public_surface_count: 19,
          public_control_count: 396,
          public_capability_count: 40,
          matched_surface_count: 19,
          matched_control_count: 396,
          matched_capability_count: 40,
        },
      });
      expect(JSON.stringify(catalog)).not.toMatch(
        /developer-only|source_path|handler|credential_value|pairing_material|hidden_reasoning/,
      );
    } finally {
      await connection.close();
    }
  });

  it("filters Ask and room controls without changing authority", async () => {
    const connection = await connect([HELIX_AGENT_RUN_READ_SCOPE]);
    try {
      const askResult = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {
          surface_id: "helix.ask",
          interaction_kind: "act",
          authority_state: "client_local",
          include_capabilities: false,
        },
      });
      const askCatalog = askResult.structuredContent as {
        controls: Array<Record<string, unknown>>;
        capabilities: unknown[];
      };
      expect(askCatalog.controls.length).toBeGreaterThan(0);
      expect(askCatalog.controls.every((control) =>
        control.surface_id === "helix.ask" &&
        control.interaction_kind === "act" &&
        control.authority_state === "client_local",
      )).toBe(true);
      expect(askCatalog.capabilities).toEqual([]);

      const roomResult = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {
          surface_id: "helix.ask.shared_live_room",
          authority_state: "blocked_pending_contract",
        },
      });
      const roomCatalog = roomResult.structuredContent as {
        controls: Array<Record<string, unknown>>;
      };
      expect(roomCatalog.controls).toHaveLength(103);
      expect(roomCatalog.controls.every((control) =>
        control.authority_state === "blocked_pending_contract",
      )).toBe(true);
    } finally {
      await connection.close();
    }
  });

  it("fails closed without the read scope", async () => {
    const connection = await connect([]);
    try {
      const result = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({ error: "insufficient_scope" });
    } finally {
      await connection.close();
    }
  });
});
