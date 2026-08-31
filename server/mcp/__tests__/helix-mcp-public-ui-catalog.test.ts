import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_AGENT_RUN_READ_SCOPE } from "@shared/contracts/helix-agent-api.v1";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "@shared/contracts/helix-shared-live-room-agent.v1";
import { HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA } from
  "@shared/helix-environment-device-check";
import {
  HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  helixMcpEvidenceObservationSchema,
} from "@shared/contracts/helix-mcp-evidence-capability.v1";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import type { HelixMcpEvidenceObservation } from
  "@shared/contracts/helix-mcp-evidence-capability.v1";
import { HelixMcpEvidenceObservationStoreError } from
  "../../services/mcp-evidence/observation-store";
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

const connect = async (
  scopes: readonly string[],
  deviceCheckService?: () => Promise<{
    schema: typeof HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA;
    generated_at: string;
    devices: [];
    content_role: "device_health_observations_not_assistant_answer";
    credential_included: false;
    answer_authority: false;
    assistant_answer: false;
    terminal_eligible: false;
    raw_content_included: false;
  }>,
) => {
  const observations = new Map<string, HelixMcpEvidenceObservation>();
  const mcpEvidenceObservationStore = {
    put: async ({ observation }: { observation: HelixMcpEvidenceObservation }) => {
      observations.set(observation.observation_ref, observation);
    },
    get: async ({ observationRef }: { observationRef: string }) => {
      const observation = observations.get(observationRef);
      if (!observation) throw new HelixMcpEvidenceObservationStoreError(
        "observation_not_found", "The MCP evidence observation does not exist.",
      );
      return observation;
    },
  };
  const server = createHelixMcpServer({
    principal: principal(scopes),
    mcpEvidenceObservationStore,
    deviceCheckService,
  });
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
  it("wires Device Check evidence storage on the full MCP surface", async () => {
    const generatedAt = "2026-08-30T22:20:00.000Z";
    const connection = await connect(
      [HELIX_AGENT_RUN_READ_SCOPE, HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
      async () => ({
        schema: HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA,
        generated_at: generatedAt,
        devices: [],
        content_role: "device_health_observations_not_assistant_answer",
        credential_included: false,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    );
    try {
      const result = await connection.client.callTool({
        name: "helix_environment_device_check",
        arguments: {},
      });
      expect(result.isError, JSON.stringify(result)).not.toBe(true);
      expect(result.structuredContent).toMatchObject({
        schema: HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA,
        generated_at: generatedAt,
        devices: [],
        mcp_evidence: {
          capability_id: "helix.environment.device_check.inspect",
          payload_schema: HELIX_ENVIRONMENT_DEVICE_CHECK_LIST_SCHEMA,
        },
      });
    } finally {
      await connection.close();
    }
  });

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
          public_surface_count: 20,
          public_control_count: 398,
          public_capability_count: 42,
          public_mcp_binding_count: 9,
          matched_surface_count: 20,
          matched_control_count: 398,
          matched_capability_count: 42,
          matched_mcp_binding_count: 9,
        },
      });
      expect(JSON.stringify(catalog)).not.toMatch(
        /developer-only|source_path|handler_expression|handler_source|credential_value|pairing_material|hidden_reasoning/,
      );
      const evidence = helixMcpEvidenceObservationSchema.parse(catalog.mcp_evidence);
      const { mcp_evidence: _mcpEvidence, ...legacyCatalogPayload } = catalog;
      expect(evidence.payload).toEqual(legacyCatalogPayload);
      expect(evidence).toMatchObject({
        schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
        capability_id: "helix.public_ui.catalog.inspect",
        handler_id: "helix.public_ui.catalog.handler",
        payload_schema: "helix.public_ui_agent_catalog.v1",
        payload: {
          totals: {
            public_control_count: 398,
            public_capability_count: 42,
            public_mcp_binding_count: 9,
          },
        },
        retention: {
          class: "profile_durable",
          retrieval_allowed: true,
        },
        authority: {
          assistant_answer: false,
          answer_authority: false,
          agent_executable: false,
          terminal_eligible: false,
          raw_content_included: false,
          reentry_required: true,
        },
      });

      const replay = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {},
      });
      const replayEvidence = helixMcpEvidenceObservationSchema.parse(
        (replay.structuredContent as Record<string, unknown>).mcp_evidence,
      );
      expect(replayEvidence.observation_ref).not.toBe(evidence.observation_ref);
      expect(replayEvidence.request_fingerprint).toBe(evidence.request_fingerprint);
      expect(replayEvidence.provenance.payload_sha256).toBe(
        evidence.provenance.payload_sha256,
      );

      const retrieval = await connection.client.callTool({
        name: "helix_evidence_observation_get",
        arguments: { observation_ref: evidence.observation_ref },
      });
      expect(retrieval.isError, JSON.stringify(retrieval)).not.toBe(true);
      const retrieved = retrieval.structuredContent as Record<string, unknown>;
      expect(retrieved).toMatchObject({
        schema: "helix.mcp_evidence_retrieval.v1",
        requested_observation_ref: evidence.observation_ref,
        observation: evidence,
        assistant_answer: false,
        agent_executable: false,
        terminal_eligible: false,
        reentry_required: true,
      });
      expect(helixMcpEvidenceObservationSchema.parse(retrieved.mcp_evidence))
        .toMatchObject({
          capability_id: "helix.mcp_evidence.observation.retrieve",
          support_refs: [evidence.observation_ref],
          authority: { assistant_answer: false, terminal_eligible: false },
        });
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
        mcp_bindings: unknown[];
        mcp_evidence: unknown;
      };
      expect(askCatalog.controls.length).toBeGreaterThan(0);
      expect(askCatalog.controls.every((control) =>
        control.surface_id === "helix.ask" &&
        control.interaction_kind === "act" &&
        control.authority_state === "client_local",
      )).toBe(true);
      expect(askCatalog.capabilities).toEqual([]);
      expect(askCatalog.mcp_bindings).toEqual([]);
      expect(
        helixMcpEvidenceObservationSchema.parse(askCatalog.mcp_evidence).payload,
      ).toMatchObject({ controls: askCatalog.controls, capabilities: [] });

      const roomResult = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {
          surface_id: "helix.ask.shared_live_room",
          authority_state: "blocked_pending_contract",
        },
      });
      const roomCatalog = roomResult.structuredContent as {
        controls: Array<Record<string, unknown>>;
        mcp_bindings: unknown[];
      };
      expect(roomCatalog.controls).toHaveLength(101);
      expect(roomCatalog.controls.every((control) =>
        control.authority_state === "blocked_pending_contract",
      )).toBe(true);
      expect(roomCatalog.mcp_bindings).toEqual([]);

      const releasedFloorResult = await connection.client.callTool({
        name: "helix_public_ui_catalog",
        arguments: {
          surface_id: "helix.ask.shared_live_room",
          authority_state: "route_owned",
        },
      });
      const routeOwnedCatalog = releasedFloorResult.structuredContent as {
          controls: Array<Record<string, unknown>>;
          mcp_bindings: Array<Record<string, unknown>>;
        };
      expect(routeOwnedCatalog.controls).toEqual([
        expect.objectContaining({
          control_id: "helix.ask.shared_live_room.shared-live-room-runtime-panel.take-speaking-floor",
          route_contract_id: "room.floor.acquire",
          authority_state: "route_owned",
        }),
        expect.objectContaining({
          control_id: "helix.ask.shared_live_room.shared-live-room-runtime-panel.release-speaking-floor",
          route_contract_id: "room.floor.release",
          authority_state: "route_owned",
        }),
      ]);
      expect(routeOwnedCatalog.mcp_bindings).toHaveLength(9);
      expect(routeOwnedCatalog.mcp_bindings).toEqual(expect.arrayContaining([
        expect.objectContaining({
          tool_name: "helix_room_create",
          capability_id: "room.create",
          control_ids: [
            "helix.ask.shared_live_room.create_room_form",
            "helix.ask.shared_live_room.room_title_input",
            "helix.ask.shared_live_room.create_room",
          ],
          pre_transition_behavior: "deny_full_mcp_transition_required",
          post_transition_behavior: "execute_governed_handler",
        }),
        expect.objectContaining({
          tool_name: "helix_room_consent_grant",
          requires_signed_delegation: true,
        }),
      ]));
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
