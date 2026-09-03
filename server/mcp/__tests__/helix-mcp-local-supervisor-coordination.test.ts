import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ToolListChangedNotificationSchema } from
  "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_AGENT_RUN_READ_SCOPE } from
  "@shared/contracts/helix-agent-api.v1";
import { HELIX_ENVIRONMENT_ACTION_READ_SCOPE } from
  "@shared/helix-environment-action";
import {
  HELIX_SHARED_LIVE_ROOM_MANAGE_SCOPE,
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  createHelixMcpServer,
  HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
  HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
} from "../helix-mcp-server";
import type { HelixAgentApiService } from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import { HelixLocalSupervisorCoordinationStore } from
  "../../services/local-supervisor/local-supervisor-coordination";
import { DesktopMcpTunnelTransitionStore } from
  "../../services/local-supervisor/desktop-mcp-tunnel-transition-store";
import { HelixReasoningTaskBindingStore } from
  "../../services/local-supervisor/reasoning-task-binding-store";
import {
  HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
  HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
} from "@shared/desktop-mcp-tunnel-transition";

const servers: Array<ReturnType<typeof createHelixMcpServer>> = [];
const clients: Client[] = [];

const principal = (profile: string, oauthClientRef: string): HelixAgentApiPrincipal => ({
  tenantId: "tenant:coordination",
  issuer: "https://issuer.example",
  subjectId: `subject:${profile}`,
  accountProfileId: profile,
  accountType: "developer",
  trustedDeveloperProfile: true,
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
    mcpEvidenceObservationStore: {
      put: async () => undefined,
      get: async () => {
        throw new Error("fixture_observation_not_found");
      },
    },
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
  it("claims, reads, and acknowledges steering only through the exact authenticated continuation", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:90909090909090909090909090909090",
    );
    const reasoningStore = new HelixReasoningTaskBindingStore(store);
    const identity = principal("profile:reasoning", "oauth_client:reasoning");
    const client = await connect(store, identity, {
      surface: "local_supervisor_coordination",
      reasoningTaskBindingStore: reasoningStore,
    });
    const fullClient = await connect(store, identity, {
      reasoningTaskBindingStore: reasoningStore,
    });
    const catalogs = await Promise.all([
      client.listTools(),
      fullClient.listTools(),
    ]);
    const expectedSecuritySchemes = new Map<string, unknown>([
      ["helix_reasoning_task_binding_claim", [{
        type: "oauth2",
        scopes: Array.from(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
      }]],
      ["helix_reasoning_steering_read", [{
        type: "oauth2",
        scopes: Array.from(HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES),
      }]],
      ["helix_reasoning_steering_acknowledge", [{
        type: "oauth2",
        scopes: Array.from(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
      }]],
    ]);
    for (const catalog of catalogs) {
      for (const [toolName, securitySchemes] of expectedSecuritySchemes) {
        const tool = catalog.tools.find((candidate) => candidate.name === toolName);
        expect(tool, `missing reasoning tool ${toolName}`).toBeDefined();
        expect(tool?._meta?.securitySchemes, toolName).toEqual(securitySchemes);
      }
    }
    const continuation = "codex_thread:reasoning-current";
    const heartbeatResult = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: continuation,
        declared_objective_summary: "Pick up operator steering",
        lifecycle_state: "active",
        resource_claims: [],
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only", "checkpoint_publish", "continuation_ready"],
          requested_level: "continuation_ready",
          checkpoint_publication: {
            freshness_window_seconds: 120,
            retention: "current_session",
            revocation: "independent",
          },
        },
        heartbeat_ttl_seconds: 60,
      },
    });
    const presence = (heartbeatResult.structuredContent as {
      presence: { client_session_ref: string };
    }).presence;
    const issued = reasoningStore.issueClaim({
      profileRef: identity.accountProfileId,
      clientSessionRef: presence.client_session_ref,
      helixConversationId: "helix-chat:reasoning-current",
      missionId: "mission:reasoning-current",
      runId: "run:reasoning-current",
    });
    const claimed = await client.callTool({
      name: "helix_reasoning_task_binding_claim",
      arguments: {
        client_continuation_ref: continuation,
        claim_handle: issued.claim_handle,
      },
    });
    expect(claimed.isError).not.toBe(true);
    const binding = (claimed.structuredContent as {
      binding: { reasoning_binding_id: string; binding_epoch: number };
    }).binding;
    const event = reasoningStore.dispatch({
      profileRef: identity.accountProfileId,
      bindingId: binding.reasoning_binding_id,
      bindingEpoch: binding.binding_epoch,
      clientEventRef: "voice-final:mcp-test",
      origin: "gpt_live_finalized",
      instructionText: "Inspect the Minecraft player state, then report evidence.",
    });
    const read = await client.callTool({
      name: "helix_reasoning_steering_read",
      arguments: {
        client_continuation_ref: continuation,
        reasoning_binding_id: binding.reasoning_binding_id,
        binding_epoch: binding.binding_epoch,
        after_cursor: 0,
      },
    });
    expect(read.isError).not.toBe(true);
    expect(read.structuredContent).toMatchObject({
      deliveries: [{
        event: {
          steering_event_ref: event.steering_event_ref,
          origin: "gpt_live_finalized",
          delivery_state: "pending",
          execution_requested: false,
          answer_authority: false,
        },
        instruction_text: "Inspect the Minecraft player state, then report evidence.",
      }],
      hidden_reasoning_included: false,
      terminal_eligible: false,
    });
    const acknowledged = await client.callTool({
      name: "helix_reasoning_steering_acknowledge",
      arguments: {
        client_continuation_ref: continuation,
        reasoning_binding_id: binding.reasoning_binding_id,
        binding_epoch: binding.binding_epoch,
        steering_event_ref: event.steering_event_ref,
      },
    });
    expect(acknowledged.isError).not.toBe(true);
    expect(acknowledged.structuredContent).toMatchObject({
      event: { delivery_state: "acknowledged" },
      answer_authority: false,
      terminal_eligible: false,
    });
    const wrongContinuation = await client.callTool({
      name: "helix_reasoning_steering_read",
      arguments: {
        client_continuation_ref: "codex_thread:wrong-task",
        reasoning_binding_id: binding.reasoning_binding_id,
        binding_epoch: binding.binding_epoch,
        after_cursor: 0,
      },
    });
    expect(wrongContinuation.isError).toBe(true);
    expect(JSON.stringify(wrongContinuation)).toContain("supervisor_client_not_registered");
  });

  it("reports ordinary tool lifecycle without exposing arguments or results", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:56565656565656565656565656565656",
    );
    const observations: Array<Record<string, unknown>> = [];
    const observer = vi.fn(async (observation: Record<string, unknown>) => {
      observations.push(observation);
    });
    const client = await connect(
      store,
      principal("profile:activity", "oauth_client:activity"),
      {
        surface: "local_supervisor_coordination",
        mcpToolLifecycleObserver: observer,
      },
    );

    const result = await heartbeat(
      client,
      "codex_thread:private-continuation",
      "Private objective text must not enter activity.",
    );
    expect(result.isError).not.toBe(true);
    expect(observer).toHaveBeenCalledTimes(1);
    expect(observations[0]).toMatchObject({
      toolName: "helix_local_supervisor_presence_update",
      outcome: "succeeded",
    });
    expect(Object.keys(observations[0]).sort()).toEqual([
      "observedAt",
      "occurredAt",
      "outcome",
      "toolName",
    ]);
    expect(JSON.stringify(observations)).not.toContain("private-continuation");
    expect(JSON.stringify(observations)).not.toContain("Private objective");
  });

  it("pre-advertises exact room and environment schemas while denying every shadow call", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:78787878787878787878787878787878",
    );
    const identity = principal("profile:shadow-catalog", "oauth_client:shadow-catalog");
    const shadowClient = await connect(store, identity, {
      surface: "local_supervisor_coordination",
    });
    const fullClient = await connect(store, identity);
    const [shadowCatalog, fullCatalog] = await Promise.all([
      shadowClient.listTools(),
      fullClient.listTools(),
    ]);
    const transitionShadowToolNames = [
      "helix_room_list",
      "helix_room_inspect",
      "helix_room_floor_inspect",
      "helix_room_create",
      "helix_room_presence_set",
      "helix_room_consent_revoke",
      "helix_room_consent_grant",
      "helix_room_floor_release",
      "helix_room_floor_acquire",
      "helix_room_source_list",
      "helix_room_source_create",
      "helix_environment_subject_list",
      "helix_environment_subject_select",
      "helix_environment_action_authority_inspect",
      "helix_environment_action_authority_configure",
      "helix_environment_command_authority_configure",
      "helix_environment_player_pair_local",
      "helix_environment_source_pair_local",
      "helix_environment_server_pair_local",
      "helix_environment_action_authority_extend",
      "helix_minecraft_actor_status",
      "helix_minecraft_player_action",
      "helix_minecraft_workflow_status",
      "helix_minecraft_workflow_control",
    ];
    const comparable = (tool: (typeof shadowCatalog.tools)[number]) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
      annotations: tool.annotations,
      securitySchemes: (tool as typeof tool & {
        securitySchemes?: unknown;
      }).securitySchemes,
    });
    for (const name of transitionShadowToolNames) {
      const shadow = shadowCatalog.tools.find((tool) => tool.name === name);
      const full = fullCatalog.tools.find((tool) => tool.name === name);
      expect(shadow, `missing shadow tool ${name}`).toBeDefined();
      expect(full, `missing full tool ${name}`).toBeDefined();
      expect(comparable(shadow!)).toEqual(comparable(full!));
    }

    const denied = await shadowClient.callTool({
      name: "helix_room_list",
      arguments: {},
    });
    expect(denied.isError).toBe(true);
    expect(JSON.stringify(denied)).toContain("full_mcp_transition_required");
    const deniedEnvironmentMutation = await shadowClient.callTool({
      name: "helix_minecraft_player_action",
      arguments: {
        room_id: "shared_realtime_room:shadow-fixture",
        idempotency_key: "shadow-action-denied",
        action: { action_kind: "jump", count: 1 },
      },
    });
    expect(deniedEnvironmentMutation.isError).toBe(true);
    expect(JSON.stringify(deniedEnvironmentMutation)).toContain(
      "full_mcp_transition_required",
    );
    expect(JSON.parse(
      (deniedEnvironmentMutation.content[0] as { text: string }).text,
    )).toMatchObject({ mutation_executed: false });
  });

  it("binds governed tunnel requests to active native presence and requires a separate user grant", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:99999999999999999999999999999999",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const desktopPrincipal: HelixAgentApiPrincipal = {
      ...principal("profile:desktop", "oauth_client:unused"),
      issuer: "urn:casimirbot:desktop-session",
      subjectId: "profile:desktop",
      accountType: "developer",
      mcpClientRef: "mcp_client:native_desktop:fixture",
      oauthClientRef: null,
      scopes: new Set([
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
      ].flat()),
      accountContext: {
        ...principal("profile:desktop", "oauth_client:unused").accountContext,
        session_id: "account_session:desktop-owner",
        profile_id: "profile:desktop",
      },
    };
    const executed: Array<Record<string, unknown>> = [];
    let rejectNativeTransition = false;
    const client = await connect(store, desktopPrincipal, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
      desktopMcpTunnelTransitionExecutor: async (request: Record<string, unknown>) => {
        executed.push(request);
        if (rejectNativeTransition) {
          throw new Error("fixture_native_transition_rejected");
        }
        return { accepted: true, nativeReceiptRef: "native_transition_receipt:fixture" };
      },
    });
    let toolListChangedNotifications = 0;
    client.setNotificationHandler(
      ToolListChangedNotificationSchema,
      async () => {
        toolListChangedNotifications += 1;
      },
    );
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
      "helix_desktop_tunnel_transition_request",
      "helix_desktop_tunnel_transition_inspect",
      "helix_desktop_tunnel_transition_execute",
    ]));

    const beforePresence = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        declared_task_summary: "Refresh the MCP catalog.",
        requested_lease_seconds: 60,
      },
    });
    expect(beforePresence.isError).toBe(true);
    expect((beforePresence.structuredContent as any).error).toBe(
      "transition_active_presence_required",
    );
    expect(toolListChangedNotifications).toBe(0);

    await heartbeat(client, "codex_thread:bootstrap", "Refresh the MCP catalog.");
    const requested = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        declared_task_summary: "Refresh the MCP catalog.",
        requested_lease_seconds: 60,
      },
    });
    expect(requested.isError).not.toBe(true);
    const request = (requested.structuredContent as any).request;
    expect(request).toMatchObject({
      status: "pending_user_delegation",
      independent_external_oauth_client_bound: false,
      terminal_eligible: false,
    });
    const inspected = await client.callTool({
      name: "helix_desktop_tunnel_transition_inspect",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        transition_request_ref: request.transition_request_ref,
      },
    });
    expect(inspected.structuredContent).toMatchObject({
      receipt_chain_scope: "service_instance",
      receipts: [{
        event_type: "requested",
        previous_receipt_hash: null,
        immutable_event: true,
      }],
    });
    expect((inspected.structuredContent as any).receipts[0].receipt_hash)
      .toMatch(/^[a-f0-9]{64}$/u);
    transitions.grant({
      requestRef: request.transition_request_ref,
      authenticatedProfileRef: "profile:desktop",
      accountSessionId: "account_session:desktop-owner",
      accountType: "developer",
      leaseSeconds: 60,
    });
    const accepted = await client.callTool({
      name: "helix_desktop_tunnel_transition_execute",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        transition_request_ref: request.transition_request_ref,
        target_scope: "full_helix_agent",
        idempotency_key: "idempotency-native-bootstrap",
      },
    });
    expect(accepted.isError, JSON.stringify(accepted)).not.toBe(true);
    expect(accepted.structuredContent).toMatchObject({
      accepted: true,
      idempotency_replayed: false,
      native_transition_resubmitted: true,
      reconnect_required: true,
      catalog_refresh_required: true,
      shared_live_room_catalog_pre_advertised: true,
      tool_list_changed_supported: true,
      tool_list_changed_requested: true,
      environment_authority_granted: false,
      trading_authority_granted: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(executed).toHaveLength(1);
    expect(toolListChangedNotifications).toBe(1);
    expect(JSON.stringify(executed[0])).not.toContain("credential");
    const replayed = await client.callTool({
      name: "helix_desktop_tunnel_transition_execute",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        transition_request_ref: request.transition_request_ref,
        target_scope: "full_helix_agent",
        idempotency_key: "idempotency-native-bootstrap",
      },
    });
    expect(replayed.structuredContent).toMatchObject({
      accepted: true,
      native_receipt_ref: null,
      idempotency_replayed: true,
      native_transition_resubmitted: false,
      tool_list_changed_requested: true,
    });
    expect(executed).toHaveLength(1);
    expect(toolListChangedNotifications).toBe(2);

    rejectNativeTransition = true;
    await heartbeat(
      client,
      "codex_thread:native-failure",
      "Prove rejected native transitions never refresh the catalog.",
    );
    const failedRequestResult = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:native-failure",
        declared_task_summary:
          "Prove rejected native transitions never refresh the catalog.",
        requested_lease_seconds: 60,
      },
    });
    const failedRequest = (failedRequestResult.structuredContent as any).request;
    transitions.grant({
      requestRef: failedRequest.transition_request_ref,
      authenticatedProfileRef: "profile:desktop",
      accountSessionId: "account_session:desktop-owner",
      accountType: "developer",
      leaseSeconds: 60,
    });
    const rejected = await client.callTool({
      name: "helix_desktop_tunnel_transition_execute",
      arguments: {
        client_continuation_ref: "codex_thread:native-failure",
        transition_request_ref: failedRequest.transition_request_ref,
        target_scope: "full_helix_agent",
        idempotency_key: "idempotency-native-rejection",
      },
    });
    expect(rejected.isError).toBe(true);
    expect(toolListChangedNotifications).toBe(2);
  });

  it("keeps governed transition controls registered on the full MCP surface", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:67676767676767676767676767676767",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const desktopPrincipal: HelixAgentApiPrincipal = {
      ...principal("profile:full-surface", "oauth_client:unused"),
      issuer: "urn:casimirbot:desktop-session",
      subjectId: "profile:full-surface",
      accountType: "developer",
      mcpClientRef: "mcp_client:native_desktop:full-surface",
      oauthClientRef: null,
      scopes: new Set([
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
      ].flat()),
      accountContext: {
        ...principal("profile:full-surface", "oauth_client:unused")
          .accountContext,
        session_id: "account_session:full-surface-owner",
        profile_id: "profile:full-surface",
      },
    };
    const client = await connect(store, desktopPrincipal, {
      desktopMcpTunnelTransitionStore: transitions,
      desktopMcpTunnelTransitionExecutor: async () => ({
        accepted: true,
        nativeReceiptRef: "native_transition_receipt:full-surface",
      }),
    });

    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "helix_desktop_tunnel_transition_request",
        "helix_desktop_tunnel_transition_inspect",
        "helix_desktop_tunnel_transition_execute",
        "helix_environment_subject_list",
        "helix_minecraft_actor_status",
        "helix_minecraft_player_action",
      ]),
    );

    await heartbeat(
      client,
      "codex_thread:full-surface",
      "Verify stable Tool Pulse catalog continuity.",
    );
    const requested = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:full-surface",
        declared_task_summary:
          "Verify stable Tool Pulse catalog continuity.",
        requested_lease_seconds: 60,
      },
    });
    expect(requested.isError, JSON.stringify(requested)).not.toBe(true);
    expect(requested.structuredContent).toMatchObject({
      request: {
        status: "pending_user_delegation",
      },
      assistant_answer: false,
      terminal_eligible: false,
    });
  });

  it("keeps an OAuth requester bound while executing only with a separately delegated native session", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:abababababababababababababababab",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const oauthPrincipal: HelixAgentApiPrincipal = {
      ...principal("profile:oauth-transition", "oauth_client:chatgpt-current"),
      accountType: "user",
      accountContext: {
        ...principal("profile:oauth-transition", "oauth_client:chatgpt-current")
          .accountContext,
        account_policy: buildHelixAccountCapabilityPolicy("user"),
      },
      scopes: new Set([
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
      ].flat()),
    };
    const executed: Array<Record<string, unknown>> = [];
    const client = await connect(store, oauthPrincipal, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
      desktopMcpTunnelTransitionExecutor: async (request: Record<string, unknown>) => {
        executed.push(request);
        return {
          accepted: true,
          nativeReceiptRef: "native_transition_receipt:oauth-fixture",
        };
      },
    });
    const continuation = "codex_thread:oauth-native-transition";
    await heartbeat(client, continuation, "Transition the installed MCP catalog.");
    const requested = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: continuation,
        declared_task_summary: "Transition the installed MCP catalog.",
        requested_lease_seconds: 60,
      },
    });
    expect(requested.isError, JSON.stringify(requested)).not.toBe(true);
    const transitionRequest = (requested.structuredContent as any).request;
    expect(transitionRequest).toMatchObject({
      status: "pending_user_delegation",
      client_identity_assurance:
        "external_oauth_client_plus_server_derived_continuation",
      independent_external_oauth_client_bound: true,
    });
    const nativeSessionId = "account_session:native-oauth-owner";
    transitions.grant({
      requestRef: transitionRequest.transition_request_ref,
      authenticatedProfileRef: oauthPrincipal.accountProfileId,
      accountSessionId: nativeSessionId,
      accountType: "developer",
      leaseSeconds: 60,
    });
    const accepted = await client.callTool({
      name: "helix_desktop_tunnel_transition_execute",
      arguments: {
        client_continuation_ref: continuation,
        transition_request_ref: transitionRequest.transition_request_ref,
        target_scope: "full_helix_agent",
        idempotency_key: "oauth-native-transition-fixture",
      },
    });
    expect(accepted.isError, JSON.stringify(accepted)).not.toBe(true);
    expect(executed).toEqual([
      expect.objectContaining({
        transitionRequestRef: transitionRequest.transition_request_ref,
        accountSessionId: nativeSessionId,
        targetScope: "full_helix_agent",
      }),
    ]);
  });

  it("rejects a non-developer OAuth requester before creating transition state", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const userPrincipal: HelixAgentApiPrincipal = {
      ...principal("profile:user-transition", "oauth_client:chatgpt-user"),
      accountType: "user",
      trustedDeveloperProfile: false,
      accountContext: {
        ...principal("profile:user-transition", "oauth_client:chatgpt-user")
          .accountContext,
        account_policy: buildHelixAccountCapabilityPolicy("user"),
      },
      scopes: new Set([
        HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
      ]),
    };
    const client = await connect(store, userPrincipal, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
    });
    const continuation = "codex_thread:user-transition";
    await heartbeat(client, continuation, "Attempt an unauthorized transition.");
    const denied = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: continuation,
        declared_task_summary: "Attempt an unauthorized transition.",
      },
    });
    expect(denied.isError).toBe(true);
    expect(JSON.stringify(denied)).toContain(
      "transition_trusted_developer_session_required",
    );
  });

  it("publishes public observations and bounded coordination on the installed tunnel surface", async () => {
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
      "helix_environment_action_authority_configure",
      "helix_environment_action_authority_extend",
      "helix_environment_action_authority_inspect",
      "helix_environment_action_authority_revoke",
      "helix_environment_command_authority_configure",
      "helix_environment_device_check",
      "helix_environment_player_pair_local",
      "helix_environment_server_pair_local",
      "helix_environment_source_pair_local",
      "helix_environment_subject_list",
      "helix_environment_subject_select",
      "helix_evidence_observation_get",
      "helix_local_supervisor_coordination_read",
      "helix_local_supervisor_presence_disconnect",
      "helix_local_supervisor_presence_update",
      "helix_local_supervisor_relay_acknowledge",
      "helix_local_supervisor_relay_publish",
      "helix_minecraft_actor_status",
      "helix_minecraft_local_lifecycle_launch",
      "helix_minecraft_player_action",
      "helix_minecraft_workflow_control",
      "helix_minecraft_workflow_status",
      "helix_public_ui_catalog",
      "helix_room_consent_grant",
      "helix_room_consent_revoke",
      "helix_room_create",
      "helix_room_floor_acquire",
      "helix_room_floor_inspect",
      "helix_room_floor_release",
      "helix_room_inspect",
      "helix_room_list",
      "helix_room_presence_set",
      "helix_room_source_create",
      "helix_room_source_list",
    ]);
    expect(listed.tools.map((tool) => tool.name)).toContain(
      "helix_minecraft_player_action",
    );
    const publicUiTool = listed.tools.find((tool) =>
      tool.name === "helix_public_ui_catalog") as
        | ((typeof listed.tools)[number] & { _meta?: Record<string, unknown> })
        | undefined;
    expect(publicUiTool?._meta?.securitySchemes).toEqual([{
      type: "oauth2",
      scopes: [HELIX_SHARED_LIVE_ROOM_READ_SCOPE],
    }]);
    const publicUiResult = await client.callTool({
      name: "helix_public_ui_catalog",
      arguments: {
        surface_id: "helix.ask.shared_live_room",
        authority_state: "blocked_pending_contract",
      },
    });
    expect(publicUiResult.isError, JSON.stringify(publicUiResult)).not.toBe(true);
    expect(publicUiResult.structuredContent).toMatchObject({
      schema: "helix.public_ui_agent_catalog.v1",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      totals: {
        matched_surface_count: 1,
        matched_control_count: 101,
      },
    });
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
      authenticated_mcp_client: "server_verified",
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

  it("negotiates a bounded Thread Observability Bridge declaration through MCP", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:45454545454545454545454545454545",
    );
    const client = await connect(
      store,
      principal("profile:observability", "oauth_client:observability"),
    );
    const result = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:observability",
        declared_objective_summary: "Publish bounded public checkpoints.",
        lifecycle_state: "active",
        resource_claims: [],
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only", "checkpoint_publish"],
          requested_level: "checkpoint_publish",
          checkpoint_publication: {
            freshness_window_seconds: 120,
            retention: "current_session",
            revocation: "independent",
          },
        },
        heartbeat_ttl_seconds: 60,
      },
    });
    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect((result.structuredContent as any).presence)
      .toMatchObject({
        thread_observability_bridge: {
          requested_level: "checkpoint_publish",
          checkpoint_publication: {
            freshness_window_seconds: 120,
            retention: "current_session",
            revocation: "independent",
          },
          declaration_basis: "authenticated_client_declaration",
          provider_thread_content_included: false,
          hidden_reasoning_included: false,
          answer_authority: false,
          terminal_eligible: false,
        },
      });

    const invalid = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:invalid-observability",
        declared_objective_summary: "Claim an unsupported continuation.",
        lifecycle_state: "active",
        resource_claims: [],
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only"],
          requested_level: "continuation_ready",
          checkpoint_publication: null,
        },
        heartbeat_ttl_seconds: 60,
      },
    });
    expect(invalid.isError).toBe(true);
  });

  it("binds collision authority to the exact server-owned execution lease", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:55555555555555555555555555555555",
    );
    const client = await connect(
      store,
      principal("profile:lease", "oauth_client:lease"),
      {
        roomControlService: {
          inspectRoom: async () => ({
            room: { self_participant_id: "room_participant:lease" },
          }),
        },
        localSupervisorEnvironmentIdentityReader: async () => ({
          roomId: "shared_realtime_room:lease",
          participantId: "room_participant:lease",
          environmentBindingId: "environment_binding:lease",
          connectorInstallationId: "connector_installation:lease",
          sourceId: "environment_source:lease",
          producerEpochRef: "producer_epoch:lease-1",
        }),
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
    expect((active.structuredContent as any).presence).toMatchObject({
      verified_room_identity: {
        participant_ref: "room_participant:lease",
        basis: "server_verified",
      },
      verified_connector_identity: {
        connector_installation_ref: "connector_installation:lease",
        source_ref: "environment_source:lease",
        producer_epoch_ref: "producer_epoch:lease-1",
        basis: "server_verified",
      },
      verified_execution_lease_identity: {
        execution_lease_ref: "environment_action_request:active",
        participant_ref: "room_participant:lease",
        source_ref: "environment_source:lease",
        basis: "server_verified",
      },
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
    expect((mismatch.structuredContent as any).presence).toMatchObject({
      verified_connector_identity: null,
      verified_execution_lease_identity: null,
    });
  });

  it("binds a retained runtime to its exact active room binding and run version", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:56565656565656565656565656565656",
    );
    const identity = principal("profile:run", "oauth_client:run");
    const client = await connect(store, identity, {
      service: {
        inspectRun: async () => ({
          run_id: "agent_run:retained",
          version: 7,
          lifecycle_status: "waiting",
        }),
      } as unknown as HelixAgentApiService,
      roomControlService: {
        inspectRoom: async () => ({
          room: { self_participant_id: "room_participant:run" },
        }),
      },
      roomBindingStore: {
        getActiveRunRoomBinding: async () => ({
          bindingId: "agent_room_binding:retained",
          runId: "agent_run:retained",
          owner: {
            tenantId: identity.tenantId,
            issuer: identity.issuer,
            subjectId: identity.subjectId,
            accountProfileId: identity.accountProfileId,
          },
          roomId: "shared_realtime_room:run",
          authorizedByProfileId: identity.accountProfileId,
          participantIdAtBind: "room_participant:run",
          memberRoleAtBind: "owner",
          consentVersionAtBind: 1,
          consentReceiptRefAtBind: "consent_receipt:run",
          status: "active",
          version: 3,
          createdAt: "2026-08-29T00:00:00.000Z",
          updatedAt: "2026-08-29T00:00:00.000Z",
          revokedAt: null,
          revokeReason: null,
        }),
      },
    });
    const result = await client.callTool({
      name: "helix_local_supervisor_presence_update",
      arguments: {
        client_continuation_ref: "codex_thread:retained-run",
        declared_objective_summary: "Retain the exact governed run.",
        lifecycle_state: "active",
        room_ref: "shared_realtime_room:run",
        run_ref: "agent_run:retained",
        resource_claims: [{
          resource_ref: "agent_run:retained",
          claim_class: "retained_runtime",
        }],
        heartbeat_ttl_seconds: 60,
      },
    });
    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect((result.structuredContent as any).presence).toMatchObject({
      authenticated_mcp_client_ref: "oauth_client:run",
      verified_room_identity: {
        room_ref: "shared_realtime_room:run",
        participant_ref: "room_participant:run",
      },
      verified_retained_runtime_identity: {
        run_ref: "agent_run:retained",
        run_version: 7,
        run_room_binding_ref: "agent_room_binding:retained",
        run_room_binding_version: 3,
        basis: "server_verified",
      },
      resource_claims: [expect.objectContaining({
        claim_basis: "server_verified",
        collision_authority: true,
      })],
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
      {
        roomControlService: {
          inspectRoom: async () => ({
            room: { self_participant_id: "room_participant:owner" },
          }),
        },
        localSupervisorEnvironmentIdentityReader: async () => ({
          roomId: "shared_realtime_room:handoff",
          participantId: "room_participant:owner",
          environmentBindingId: "environment_binding:handoff",
          connectorInstallationId: "connector_installation:handoff",
          sourceId: "environment_source:handoff",
          producerEpochRef: "producer_epoch:handoff-1",
        }),
        localSupervisorExecutionLeaseClaimReader: leaseReader,
      },
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
    const results = await Promise.all(Array.from({ length: 64 }, (_, index) =>
      heartbeat(
        client,
        `codex_thread:load-${index}`,
        `Bounded read client ${index}`,
      )));
    for (const result of results) {
      expect(result.isError).not.toBe(true);
    }
    expect(store.listPresence()).toHaveLength(64);
    expect(new Set(store.listPresence().map((entry) => entry.client_session_ref)).size).toBe(64);
  });

  it("evicts relay dedupe state with the bounded relay history", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:44444444444444444444444444444444",
    );
    const sender = await connect(store, principal("profile:sender", "oauth_client:sender"));
    const target = await connect(store, principal("profile:target", "oauth_client:target"));
    const senderPresence = await heartbeat(sender, "codex_thread:sender", "Send bounded relays.");
    const targetPresence = await heartbeat(target, "codex_thread:target", "Receive bounded relays.");
    const targetRef = (targetPresence.structuredContent as any).presence.client_session_ref;
    let firstMessageRef = "";
    for (let index = 0; index < 301; index += 1) {
      const result = await sender.callTool({
        name: "helix_local_supervisor_relay_publish",
        arguments: {
          client_continuation_ref: "codex_thread:sender",
          client_message_ref: `message:bounded-${index}`,
          target_client_session_ref: targetRef,
          relay_type: "coordination_request",
          summary: `Bounded inert relay ${index}`,
          expires_in_seconds: 180,
        },
      });
      expect(result.isError).not.toBe(true);
      if (index === 0) {
        firstMessageRef = (result.structuredContent as any).relay.message_ref;
      }
    }
    expect(senderPresence.isError).not.toBe(true);
    const replayAfterEviction = await sender.callTool({
      name: "helix_local_supervisor_relay_publish",
      arguments: {
        client_continuation_ref: "codex_thread:sender",
        client_message_ref: "message:bounded-0",
        target_client_session_ref: targetRef,
        relay_type: "coordination_request",
        summary: "Reused only after bounded history eviction",
        expires_in_seconds: 180,
      },
    });
    expect((replayAfterEviction.structuredContent as any).relay.message_ref)
      .not.toBe(firstMessageRef);
  });
});
