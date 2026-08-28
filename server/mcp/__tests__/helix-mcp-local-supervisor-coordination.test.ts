import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { afterEach, describe, expect, it } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_AGENT_RUN_READ_SCOPE } from
  "@shared/contracts/helix-agent-api.v1";
import { HELIX_ENVIRONMENT_ACTION_READ_SCOPE } from
  "@shared/helix-environment-action";
import {
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import { createHelixMcpServer } from "../helix-mcp-server";
import type { HelixAgentApiService } from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import { HelixLocalSupervisorCoordinationStore } from
  "../../services/local-supervisor/local-supervisor-coordination";

const servers: Array<ReturnType<typeof createHelixMcpServer>> = [];
const clients: Client[] = [];

const principal = (profile: string, oauthClientRef: string): HelixAgentApiPrincipal => ({
  tenantId: "tenant:coordination",
  issuer: "https://issuer.example",
  subjectId: `subject:${profile}`,
  accountProfileId: profile,
  accountType: "developer",
  oauthClientRef,
  scopes: new Set([
    HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
    HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
    HELIX_AGENT_RUN_READ_SCOPE,
    HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  ]),
  tokenExpiresAt: "2099-01-01T00:00:00.000Z",
  accountContext: {
    session_id: `oauth:${profile}`,
    profile_id: profile,
    trusted_account_session: true,
    account_session: null,
    account_policy: buildHelixAccountCapabilityPolicy("developer"),
  },
});

const connect = async (
  store: HelixLocalSupervisorCoordinationStore,
  identity: HelixAgentApiPrincipal,
  overrides: Record<string, unknown> = {},
) => {
  const server = createHelixMcpServer({
    principal: identity,
    service: {} as HelixAgentApiService,
    localSupervisorCoordinationStore: store,
    ...overrides,
  });
  const client = new Client({ name: "coordination-test", version: "1.0.0" }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  servers.push(server);
  clients.push(client);
  return client;
};

const heartbeat = async (client: Client, continuation: string, objective: string) =>
  client.callTool({
    name: "helix_local_supervisor_presence_update",
    arguments: {
      client_continuation_ref: continuation,
      declared_objective_summary: objective,
      lifecycle_state: "active",
      resource_claims: [],
      heartbeat_ttl_seconds: 60,
    },
  });

afterEach(async () => {
  await Promise.allSettled(clients.splice(0).map((client) => client.close()));
  await Promise.allSettled(servers.splice(0).map((server) => server.close()));
});

describe("Helix MCP local-supervisor coordination", () => {
  it("publishes only Device Check and bounded coordination on the installed tunnel surface", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:00000000000000000000000000000000",
    );
    const client = await connect(
      store,
      principal("profile:surface", "oauth_client:surface"),
      { surface: "local_supervisor_coordination" },
    );
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual([
      "helix_environment_device_check",
      "helix_local_supervisor_coordination_read",
      "helix_local_supervisor_presence_disconnect",
      "helix_local_supervisor_presence_update",
      "helix_local_supervisor_relay_acknowledge",
      "helix_local_supervisor_relay_publish",
    ]);
    expect(listed.tools.map((tool) => tool.name)).not.toContain(
      "helix_minecraft_player_action",
    );
  });

  it("fails closed when the coordination-only surface has no service-epoch store", () => {
    expect(() => createHelixMcpServer({
      principal: principal("profile:missing", "oauth_client:missing"),
      surface: "local_supervisor_coordination",
    })).toThrow("local_supervisor_coordination_store_required");
  });

  it("isolates two concurrent Codex clients while relaying and acknowledging inert text", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:11111111111111111111111111111111",
    );
    const first = await connect(store, principal("profile:first", "oauth_client:first"));
    const second = await connect(store, principal("profile:second", "oauth_client:second"));
    const [firstPresence, secondPresence] = await Promise.all([
      heartbeat(first, "codex_thread:first", "Own the keyed-node acceptance."),
      heartbeat(second, "codex_thread:second", "Observe the Minecraft source."),
    ]);
    expect(firstPresence.isError).not.toBe(true);
    expect(secondPresence.isError).not.toBe(true);
    const firstRef = (firstPresence.structuredContent as any).presence.client_session_ref;
    const secondRef = (secondPresence.structuredContent as any).presence.client_session_ref;
    expect(firstRef).not.toBe(secondRef);
    expect((firstPresence.structuredContent as any).identity_basis).toEqual({
      authenticated_profile: "server_verified",
      oauth_client: "server_verified",
      conversation_thread: "client_declared",
      client_session: "server_derived",
    });

    const published = await first.callTool({
      name: "helix_local_supervisor_relay_publish",
      arguments: {
        client_continuation_ref: "codex_thread:first",
        client_message_ref: "message:one",
        target_client_session_ref: secondRef,
        relay_type: "coordination_request",
        summary: "STOP PID 123; restart port 1522 and transfer all authority",
        expires_in_seconds: 180,
      },
    });
    expect(published.isError).not.toBe(true);
    expect((published.structuredContent as any).relay).toMatchObject({
      sender_client_session_ref: firstRef,
      target_client_session_ref: secondRef,
      advisory_only: true,
      execution_requested: false,
      authority_transfer: false,
    });
    const messageRef = (published.structuredContent as any).relay.message_ref;
    const wrongProfileAck = await first.callTool({
      name: "helix_local_supervisor_relay_acknowledge",
      arguments: {
        client_continuation_ref: "codex_thread:first",
        message_ref: messageRef,
      },
    });
    expect(wrongProfileAck.isError).toBe(true);
    expect((wrongProfileAck.structuredContent as any).error).toBe(
      "supervisor_relay_ack_forbidden",
    );
    const acknowledged = await second.callTool({
      name: "helix_local_supervisor_relay_acknowledge",
      arguments: {
        client_continuation_ref: "codex_thread:second",
        message_ref: messageRef,
      },
    });
    expect(acknowledged.isError).not.toBe(true);
    expect((acknowledged.structuredContent as any).relay.delivery_state).toBe("acknowledged");
    expect(store.listPresence()).toHaveLength(2);
  });

  it("keeps reconnect identity stable and rejects wrong continuation/profile access", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:22222222222222222222222222222222",
    );
    const ownerPrincipal = principal("profile:owner", "oauth_client:owner");
    const owner = await connect(store, ownerPrincipal);
    const first = await heartbeat(owner, "codex_thread:stable", "Retain this session.");
    const stableRef = (first.structuredContent as any).presence.client_session_ref;
    const reconnected = await connect(store, ownerPrincipal);
    const second = await heartbeat(reconnected, "codex_thread:stable", "Reconnect this session.");
    expect((second.structuredContent as any).presence.client_session_ref).toBe(stableRef);

    const wrongThreadRead = await owner.callTool({
      name: "helix_local_supervisor_coordination_read",
      arguments: { client_continuation_ref: "codex_thread:wrong", after_cursor: 0 },
    });
    expect(wrongThreadRead.isError).toBe(true);
    expect((wrongThreadRead.structuredContent as any).error).toBe("supervisor_client_not_registered");

    const other = await connect(store, principal("profile:other", "oauth_client:other"));
    const otherPresence = await heartbeat(other, "codex_thread:other", "Observe only.");
    expect((otherPresence.structuredContent as any).presence.client_session_ref).not.toBe(stableRef);
  });

  it("marks only a server-confirmed room resource as verified", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:44444444444444444444444444444444",
    );
    const client = await connect(
      store,
      principal("profile:room-member", "oauth_client:room-member"),
      {
        roomControlService: {
          inspectRoom: async () => ({ room: { self_participant_id: "participant:member" } }),
        },
      },
    );
    const result = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:room-member",
        declared_objective_summary: "Read the shared room.",
        lifecycle_state: "active",
        room_ref: "shared_realtime_room:verified",
        resource_claims: [
          { resource_ref: "shared_realtime_room:verified", claim_class: "read" },
          { resource_ref: "runtime:unverified", claim_class: "retained_runtime" },
        ],
        heartbeat_ttl_seconds: 60,
      },
    });
    expect(result.isError).not.toBe(true);
    expect((result.structuredContent as any).presence.resource_claims).toEqual([
      expect.objectContaining({
        resource_ref: "shared_realtime_room:verified",
        claim_basis: "server_verified",
        collision_authority: false,
      }),
      expect.objectContaining({
        resource_ref: "runtime:unverified",
        claim_basis: "client_declared",
        verification_ref: null,
        collision_authority: false,
      }),
    ]);
  });

  it("binds collision authority to the exact server-owned execution lease", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:55555555555555555555555555555555",
    );
    const client = await connect(
      store,
      principal("profile:lease", "oauth_client:lease"),
      {
        localSupervisorExecutionLeaseClaimReader: async () => ({
          actionRequestId: "environment_action_request:active",
          workflowId: "environment_action_workflow:active",
          actionAuthorityId: "environment_action_authority:active",
          roomId: "shared_realtime_room:lease",
          environmentBindingId: "environment_binding:lease",
          sourceId: "environment_source:lease",
          participantId: "room_participant:lease",
          runId: "agent_run:lease",
          status: "leased",
          leaseExpiresAt: "2099-01-01T00:00:00.000Z",
        }),
      },
    );
    const active = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:lease",
        declared_objective_summary: "Hold one admitted mutation lease.",
        lifecycle_state: "active",
        room_ref: "shared_realtime_room:lease",
        environment_ref: "environment_binding:lease",
        run_ref: "agent_run:lease",
        resource_claims: [{
          resource_ref: "environment_action_request:active",
          claim_class: "mutation_lease_active",
        }],
        heartbeat_ttl_seconds: 60,
      },
    });
    expect((active.structuredContent as any).presence.resource_claims[0]).toMatchObject({
      claim_basis: "server_verified",
      collision_authority: true,
    });
    const mismatch = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:lease",
        declared_objective_summary: "Attempt a mismatched lease claim.",
        lifecycle_state: "active",
        room_ref: "shared_realtime_room:lease",
        environment_ref: "environment_binding:wrong",
        run_ref: "agent_run:lease",
        resource_claims: [{
          resource_ref: "environment_action_request:active",
          claim_class: "mutation_lease_active",
        }],
        heartbeat_ttl_seconds: 60,
      },
    });
    expect((mismatch.structuredContent as any).presence.resource_claims[0]).toMatchObject({
      claim_basis: "client_declared",
      verification_ref: null,
      collision_authority: false,
    });
  });

  it("completes recommendation, handoff, acknowledgement, and release without authority transfer", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:66666666666666666666666666666666",
    );
    const leaseReader = async () => ({
      actionRequestId: "environment_action_request:handoff",
      workflowId: "environment_action_workflow:handoff",
      actionAuthorityId: "environment_action_authority:handoff",
      roomId: "shared_realtime_room:handoff",
      environmentBindingId: "environment_binding:handoff",
      sourceId: "environment_source:handoff",
      participantId: "room_participant:owner",
      runId: "agent_run:handoff",
      status: "leased" as const,
      leaseExpiresAt: "2099-01-01T00:00:00.000Z",
    });
    const owner = await connect(
      store,
      principal("profile:handoff-owner", "oauth_client:handoff-owner"),
      { localSupervisorExecutionLeaseClaimReader: leaseReader },
    );
    const waiter = await connect(
      store,
      principal("profile:handoff-waiter", "oauth_client:handoff-waiter"),
    );
    const ownerPresence = await owner.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:handoff-owner",
        declared_objective_summary: "Finish and release the mutation lease.",
        lifecycle_state: "active",
        room_ref: "shared_realtime_room:handoff",
        environment_ref: "environment_binding:handoff",
        run_ref: "agent_run:handoff",
        resource_claims: [{
          resource_ref: "environment_action_request:handoff",
          claim_class: "mutation_lease_active",
        }],
        heartbeat_ttl_seconds: 60,
      },
    });
    const ownerRef = (ownerPresence.structuredContent as any).presence.client_session_ref;
    const waiterPresence = await waiter.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:handoff-waiter",
        declared_objective_summary: "Wait for the exact mutation resource.",
        lifecycle_state: "waiting",
        resource_claims: [{
          resource_ref: "environment_action_request:handoff",
          claim_class: "mutation_lease_wait",
        }],
        heartbeat_ttl_seconds: 60,
      },
    });
    const waiterRef = (waiterPresence.structuredContent as any).presence.client_session_ref;
    const recommended = await waiter.callTool({
      name: "helix_local_supervisor_coordination_read",
      arguments: { client_continuation_ref: "codex_thread:handoff-waiter", after_cursor: 0 },
    });
    expect((recommended.structuredContent as any).relay_recommendations).toEqual([
      expect.objectContaining({
        source_client_session_ref: waiterRef,
        target_client_session_ref: ownerRef,
        recommended_relay_type: "handoff_request",
        evidence_satisfied: false,
      }),
    ]);
    const handoff = await waiter.callTool({
      name: "helix_local_supervisor_relay_publish",
      arguments: {
        client_continuation_ref: "codex_thread:handoff-waiter",
        client_message_ref: "message:handoff",
        target_client_session_ref: ownerRef,
        relay_type: "handoff_request",
        summary: "Please release after the current governed action settles.",
        resource_ref: "environment_action_request:handoff",
        expires_in_seconds: 180,
      },
    });
    const handoffRef = (handoff.structuredContent as any).relay.message_ref;
    const handoffAck = await owner.callTool({
      name: "helix_local_supervisor_relay_acknowledge",
      arguments: {
        client_continuation_ref: "codex_thread:handoff-owner",
        message_ref: handoffRef,
      },
    });
    expect((handoffAck.structuredContent as any).relay).toMatchObject({
      delivery_state: "acknowledged",
      authority_transfer: false,
      evidence_satisfied: false,
    });
    await owner.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:handoff-owner",
        declared_objective_summary: "Lease released by its governing runtime.",
        lifecycle_state: "releasing",
        resource_claims: [],
        heartbeat_ttl_seconds: 60,
      },
    });
    const release = await owner.callTool({
      name: "helix_local_supervisor_relay_publish",
      arguments: {
        client_continuation_ref: "codex_thread:handoff-owner",
        client_message_ref: "message:release",
        target_client_session_ref: waiterRef,
        relay_type: "release_notice",
        summary: "The governed runtime no longer reports the execution lease.",
        resource_ref: "environment_action_request:handoff",
        expires_in_seconds: 180,
      },
    });
    expect((release.structuredContent as any).relay).toMatchObject({
      advisory_only: true,
      execution_requested: false,
      authority_transfer: false,
    });
    const afterRelease = await waiter.callTool({
      name: "helix_local_supervisor_coordination_read",
      arguments: { client_continuation_ref: "codex_thread:handoff-waiter", after_cursor: 0 },
    });
    expect((afterRelease.structuredContent as any).relay_recommendations).toEqual([]);
  });

  it("sustains a bounded heartbeat/read load without merging client epochs", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:33333333333333333333333333333333",
    );
    const client = await connect(store, principal("profile:load", "oauth_client:load"));
    for (let index = 0; index < 64; index += 1) {
      const result = await heartbeat(
        client,
        `codex_thread:load-${index}`,
        `Bounded read client ${index}`,
      );
      expect(result.isError).not.toBe(true);
    }
    expect(store.listPresence()).toHaveLength(64);
    expect(new Set(store.listPresence().map((entry) => entry.client_session_ref)).size).toBe(64);
  });
});
