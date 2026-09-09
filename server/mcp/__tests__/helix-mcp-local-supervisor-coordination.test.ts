import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import * as pairingRepository from "../../services/local-supervisor/pairing-ledger-repository";
import { migration087 } from "../../db/migrations/087_pairing_ledger";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import express from "express";
import { newDb } from "pg-mem";
import * as destinationRegistration from "../../services/local-supervisor/pairing-destination-registration";
import { migration088 } from "../../db/migrations/088_pairing_destinations";
import { migration089 } from "../../db/migrations/089_pairing_destination_identity";
import { ephemeralPairingVault } from "../../services/local-supervisor/__tests__/pairing-vault-fixture";
import httpRequest from "supertest";
import { createAgentConnectionsRouter } from "../../routes/agent-connections";
import * as roomMembership from "../../services/helix-ask/realtime-room/room-store";
import { z } from "zod";
import { EnvironmentSessionPreparationError } from "../../services/environment-connectors/session/preparation-error";
import { ToolListChangedNotificationSchema } from
  "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_AGENT_RUN_READ_SCOPE } from
  "@shared/contracts/helix-agent-api.v1";
import { HELIX_ENVIRONMENT_ACTION_READ_SCOPE, HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE } from
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
  it("accepts a durable invitation through MCP after idle and service replacement without extending consent", async () => {
    const pool = new (newDb().adapters.createPg().Pool)();
    await pool.query("CREATE TABLE helix_accounts(profile_id text PRIMARY KEY)");
    await pool.query("INSERT INTO helix_accounts VALUES ('profile:pairing')");
    const dbClient = await pool.connect();
    try { for (const migration of [migration087, migration088, migration089]) {
      await migration.run(dbClient, { enablePgvector: false });
    } } finally { dbClient.release(); }
    const vault = ephemeralPairingVault();
    const repo = new pairingRepository.PairingLedgerRepository(pool, vault, async () => {});
    const factory = vi.spyOn(pairingRepository, "createNativePairingLedgerRepository").mockResolvedValue(repo);
    const registrations = new destinationRegistration.PairingDestinationRegistrationStore(pool, async () => {}, () => new Date(), vault);
    const registrationFactory = vi.spyOn(destinationRegistration, "createPairingDestinationRegistrationStore").mockResolvedValue(registrations);
    const identity = principal("profile:pairing", "oauth:pairing");
    const actor = { profileId: identity.accountProfileId, taskId: "task:pairing" };
    vi.stubEnv("HELIX_DESKTOP_DEVICE_ID", "fixture-pairing-device");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
    try {
      const trust = vi.fn().mockResolvedValue({ trusted: true, accountSessionReady: true, agentAccountBindingReady: true });
      const store = new HelixLocalSupervisorCoordinationStore("service:pairing-before");
      const client = await connect(store, identity, { desktopFullHarnessTrustReader: trust });
      const registered = await client.callTool({ name: "helix_reasoning_destination_register", arguments: {
        client_continuation_ref: actor.taskId, request_id: "fixture-register", duration_seconds: 3600 } });
      expect(registered.isError).not.toBe(true);
      const browser = (reasoningBindingStore?: HelixReasoningTaskBindingStore) => {
        const app = express(); app.use(express.json());
        app.use("/api/account", createAgentConnectionsRouter({ coordinationStore: store,
          destinationRegistrationStore: registrations,
          reasoningBindingStore,
          pairingLedgerRepository: new pairingRepository.PairingLedgerRepository(pool, vault, async () => {}),
          resolveSession: async id => id === "browser:pairing" ? {
            session_id: id, profile: { profile_id: actor.profileId } } : null,
          bindingStore: { listBindings: async () => ({ bindings: [{ status: "active", issuer: identity.issuer }] }) } as never,
          readPairingDeviceTrust: async () => ({ trusted: true }) as never,
        }));
        return app;
      };
      const app = browser();
      const listed = await httpRequest(app).get("/api/account/session/agent-connections/reasoning-destinations")
        .set("Cookie", "helix_session=browser:pairing");
      expect(listed.status).toBe(200);
      expect(listed.body.destinations).toHaveLength(1);
      expect(listed.body.destinations[0].destination.taskId).toBe(actor.taskId);
      const issued = await httpRequest(app).post("/api/account/session/agent-connections/reasoning-invitations")
        .set("Cookie", "helix_session=browser:pairing").send({ requestId: "fixture-issue",
          registrationId: listed.body.destinations[0].registrationId, chatId: "chat:fixture", environment: null,
          invitationSeconds: 900, pairingSeconds: 28800 });
      expect(issued.status).toBe(200);
      const secret = issued.body.invitation.secret;
      const args = { client_continuation_ref: actor.taskId, id: issued.body.invitation.id, secret };
      const statusPath = `/api/account/session/agent-connections/reasoning-pairings/${encodeURIComponent(args.id)}`;
      vi.setSystemTime(new Date("2026-09-08T12:05:01Z"));
      const call = (target: Client, arguments_ = args) => target.callTool({ name: "helix_reasoning_pairing_accept", arguments: arguments_ });
      const recover = (target: Client, continuation = actor.taskId) => target.callTool({ name: "helix_reasoning_pairing_recover",
        arguments: { client_continuation_ref: continuation, id: args.id } });
      const pendingRecovery = await recover(client);
      expect(pendingRecovery.isError).toBe(true);
      expect(JSON.stringify(pendingRecovery)).toContain("pairing_not_accepted");
      const wrong = await call(client, { ...args, client_continuation_ref: "task:foreign" });
      expect(wrong.isError).toBe(true);
      expect(JSON.stringify(wrong)).toContain("pairing_destination_mismatch");
      expect((await repo.read(actor.profileId, args.id))?.revision).toBe(1);
      const accepted = await Promise.all([call(client), call(client)]);
      expect(accepted[0].isError).not.toBe(true);
      expect(accepted[0].structuredContent).toEqual(accepted[1].structuredContent);
      expect(accepted[0].structuredContent).toMatchObject({ runtime_binding_active: false, pairing: {
        state: "accepted", revision: 2, executionAuthority: false, pairingExpiresAt: "2026-09-08T20:00:00.000Z" } });
      expect(JSON.stringify(accepted)).not.toContain(secret);
      expect((await repo.read(actor.profileId, args.id))?.acceptanceSecret).toBeNull();
      expect(store.listPresence()).toHaveLength(0);
      vi.setSystemTime(new Date("2026-09-08T12:20:00Z"));
      const recovered = await connect(new HelixLocalSupervisorCoordinationStore("service:pairing-after"), identity,
        { desktopFullHarnessTrustReader: trust });
      expect((await call(recovered)).structuredContent).toEqual(accepted[0].structuredContent);
      expect((await recover(recovered)).structuredContent).toEqual(accepted[0].structuredContent);
      expect((await recover(recovered, "task:foreign")).isError).toBe(true);
      vi.setSystemTime(new Date("2026-09-08T20:00:00Z"));
      const expiredRecovery = await recover(recovered);
      expect(expiredRecovery.isError).toBe(true);
      expect(JSON.stringify(expiredRecovery)).toContain("pairing_expired");
      vi.setSystemTime(new Date("2026-09-08T12:20:00Z"));
      const restoredBrowser = browser();
      const status = await httpRequest(restoredBrowser).get(statusPath).set("Cookie", "helix_session=browser:pairing");
      expect(status.status).toBe(200);
      expect(status.body.runtime_binding_active).toBeNull();
      expect(status.body.pairing).toEqual((accepted[0].structuredContent as any).pairing);
      expect(JSON.stringify(status.body)).not.toContain(secret);
      const runtimePresence = new HelixLocalSupervisorCoordinationStore("service:runtime-restored");
      const runtimeStore = new HelixReasoningTaskBindingStore(runtimePresence);
      const visualManifests = vi.fn(async () => []);
      const runtimeClient = await connect(runtimePresence, { ...identity, mcpClientRef: identity.oauthClientRef }, {
        desktopFullHarnessTrustReader: trust, reasoningTaskBindingStore: runtimeStore,
        visualSequenceService: { listManifests: visualManifests, listReasoningGrants: () => [] } });
      const restoredRuntime = await recover(runtimeClient);
      expect(restoredRuntime.isError).not.toBe(true);
      expect(restoredRuntime.structuredContent).toMatchObject({ runtime_binding_active: true,
        binding: { status: "active", continuation_transport: "unavailable", execution_authority: false } });
      const runtimeBinding = (restoredRuntime.structuredContent as any).binding;
      const visualArgs = { reasoning_binding_id: runtimeBinding.reasoning_binding_id, binding_epoch: runtimeBinding.binding_epoch };
      const visualRead = await runtimeClient.callTool({ name: "helix_visual_sequence_list", arguments: visualArgs });
      expect(visualRead.isError).not.toBe(true);
      expect(visualManifests).toHaveBeenCalledTimes(1);
      visualManifests.mockImplementationOnce(async () => {
        trust.mockResolvedValue({ trusted: false, accountSessionReady: true, agentAccountBindingReady: true });
        return [];
      });
      const revokedDuringRead = await runtimeClient.callTool({ name: "helix_visual_sequence_list", arguments: visualArgs });
      expect(revokedDuringRead.isError).toBe(true);
      expect(JSON.stringify(revokedDuringRead)).toContain("visual_sequence_reasoning_binding_invalid");
      trust.mockResolvedValue({ trusted: true, accountSessionReady: true, agentAccountBindingReady: true });
      const currentPresence = await runtimeClient.callTool({ name: "helix_local_supervisor_presence_update", arguments: {
        client_continuation_ref: actor.taskId, declared_objective_summary: "Fixture steering exchange",
        lifecycle_state: "active", resource_claims: [], heartbeat_ttl_seconds: 180,
        thread_observability_bridge: { supported_levels: ["tool_activity_only", "checkpoint_publish", "continuation_ready"],
          requested_level: "continuation_ready", checkpoint_publication: {
            freshness_window_seconds: 120, retention: "current_session", revocation: "independent" } },
      } });
      expect(currentPresence.isError).not.toBe(true);
      const prompt = { client_continuation_ref: actor.taskId, reasoning_binding_id: runtimeBinding.reasoning_binding_id,
        binding_epoch: runtimeBinding.binding_epoch, helix_conversation_id: "chat:fixture", run_id: null,
        mission_id: null, client_event_ref: "fixture-durable-prompt", instruction_text: "Inspect the surroundings." };
      const submitted = await runtimeClient.callTool({ name: "helix_reasoning_prompt_submit", arguments: prompt });
      expect(submitted.isError).not.toBe(true);
      expect(submitted.structuredContent).toMatchObject({ event: { origin: "agent_submitted", delivery_state: "pending" } });
      expect((await runtimeClient.callTool({ name: "helix_reasoning_prompt_submit", arguments: prompt })).structuredContent)
        .toEqual(submitted.structuredContent);
      const readArgs = { client_continuation_ref: actor.taskId, reasoning_binding_id: runtimeBinding.reasoning_binding_id,
        binding_epoch: runtimeBinding.binding_epoch, after_cursor: 0 };
      const pickup = await runtimeClient.callTool({ name: "helix_reasoning_steering_read", arguments: readArgs });
      expect(pickup.isError).not.toBe(true);
      expect((pickup.structuredContent as any).deliveries).toHaveLength(1);
      const acknowledgement = await runtimeClient.callTool({ name: "helix_reasoning_steering_acknowledge", arguments: {
        client_continuation_ref: actor.taskId, reasoning_binding_id: runtimeBinding.reasoning_binding_id,
        binding_epoch: runtimeBinding.binding_epoch, steering_event_ref: (submitted.structuredContent as any).event.steering_event_ref,
      } });
      expect(acknowledgement.isError).not.toBe(true);
      expect(acknowledgement.structuredContent).toMatchObject({ event: { delivery_state: "acknowledged" } });
      const runtimeBrowser = browser(runtimeStore);
      const displayPath = `/api/account/session/agent-connections/reasoning-bindings/${encodeURIComponent(runtimeBinding.reasoning_binding_id)}/chat-prompts`;
      const display = () => httpRequest(runtimeBrowser).get(displayPath).set("Cookie", "helix_session=browser:pairing")
        .query({ binding_epoch: runtimeBinding.binding_epoch, helix_conversation_id: "chat:fixture" });
      const displayed = await display();
      expect(displayed.status).toBe(200);
      expect(displayed.body.deliveries).toHaveLength(1);
      expect(displayed.body.deliveries[0]).toMatchObject({ instruction_text: prompt.instruction_text,
        event: { origin: "agent_submitted", delivery_state: "acknowledged" } });
      const currentBinding = await httpRequest(runtimeBrowser).get("/api/account/session/agent-connections/reasoning-bindings/current")
        .set("Cookie", "helix_session=browser:pairing").query({ helix_conversation_id: "chat:fixture" });
      expect(currentBinding.status).toBe(200);
      expect(currentBinding.body.binding).toMatchObject({ reasoning_binding_id: runtimeBinding.reasoning_binding_id, status: "active" });
      const typedBody = { reasoning_binding_id: runtimeBinding.reasoning_binding_id, binding_epoch: runtimeBinding.binding_epoch,
        helix_conversation_id: "chat:fixture", run_id: null, origin: "typed", client_event_ref: "fixture-browser-prompt",
        instruction_text: "Report what you observe." };
      const typed = await httpRequest(runtimeBrowser).post("/api/account/session/agent-connections/reasoning-bindings/steering/current")
        .set("Cookie", "helix_session=browser:pairing").send(typedBody);
      expect(typed.status).toBe(202);
      expect(typed.body.event.origin).toBe("typed");
      const typedReplay = await httpRequest(runtimeBrowser).post("/api/account/session/agent-connections/reasoning-bindings/steering/current")
        .set("Cookie", "helix_session=browser:pairing").send(typedBody);
      expect(typedReplay.body).toEqual(typed.body);
      expect((await display()).body.deliveries).toHaveLength(2);
      trust.mockResolvedValueOnce({ trusted: false });
      expect((await runtimeClient.callTool({ name: "helix_reasoning_steering_read", arguments: readArgs })).isError).toBe(true);
      expect((await call(recovered, { ...args, secret: "z".repeat(43) })).isError).toBe(true);
      expect((await recovered.callTool({ name: "helix_reasoning_pairing_accept",
        arguments: { ...args, human_approved: true } })).isError).toBe(true);
      trust.mockResolvedValueOnce({ trusted: false });
      expect((await call(recovered)).isError).toBe(true);
      const foreign = await connect(new HelixLocalSupervisorCoordinationStore("service:foreign"),
        principal("profile:pairing", "oauth:foreign"), { desktopFullHarnessTrustReader: trust });
      expect((await call(foreign)).isError).toBe(true);
      expect((await recover(foreign)).isError).toBe(true);
      const revokeBindingPath = `/api/account/session/agent-connections/reasoning-bindings/${encodeURIComponent(runtimeBinding.reasoning_binding_id)}/revoke`;
      expect((await httpRequest(runtimeBrowser).post(revokeBindingPath).send({})).status).toBe(401);
      const revokedBinding = await httpRequest(runtimeBrowser).post(revokeBindingPath)
        .set("Cookie", "helix_session=browser:pairing").send({});
      expect(revokedBinding.status).toBe(200);
      expect(revokedBinding.body.binding.status).toBe("revoked");
      const replayedRevoke = await httpRequest(runtimeBrowser).post(revokeBindingPath)
        .set("Cookie", "helix_session=browser:pairing").send({});
      expect(replayedRevoke.body).toEqual(revokedBinding.body);
      const revokedByOwner = await httpRequest(restoredBrowser).post(`${statusPath}/revoke`)
        .set("Cookie", "helix_session=browser:pairing").send({});
      expect(revokedByOwner.status).toBe(200);
      expect(revokedByOwner.body.pairing).toMatchObject({ state: "revoked", revision: 3 });
      const revoked = await call(recovered);
      expect(revoked.isError).toBe(true);
      expect(JSON.stringify(revoked)).toContain("pairing_revoked");
      expect((await recover(recovered)).isError).toBe(true);
      expect((await runtimeClient.callTool({ name: "helix_reasoning_steering_read", arguments: readArgs })).isError).toBe(true);
      expect((await runtimeClient.callTool({ name: "helix_reasoning_prompt_submit", arguments: prompt })).isError).toBe(true);
      const revokedDisplay = await display();
      expect(revokedDisplay.status).toBe(409);
      expect(revokedDisplay.body.error).toBe("pairing_revoked");
      expect((await repo.read(actor.profileId, args.id))?.revision).toBe(3);
    } finally { factory.mockRestore(); registrationFactory.mockRestore(); vi.useRealTimers(); vi.unstubAllEnvs(); await pool.end(); }
  });
  it("registers a durable declared destination through the real handler without heartbeat or consent", async () => {
    const pool = new (newDb().adapters.createPg().Pool)();
    await pool.query("CREATE TABLE helix_accounts(profile_id text PRIMARY KEY)");
    await pool.query("INSERT INTO helix_accounts VALUES ('profile:registration')");
    const dbClient = await pool.connect();
    try { await migration088.run(dbClient, { enablePgvector: false }); await migration089.run(dbClient, { enablePgvector: false }); } finally { dbClient.release(); }
    let clock = Date.parse("2026-09-08T12:00:00Z");
    const registrationStore = new destinationRegistration.PairingDestinationRegistrationStore(pool, async () => {}, () => new Date(clock), ephemeralPairingVault());
    const factory = vi.spyOn(destinationRegistration, "createPairingDestinationRegistrationStore").mockResolvedValue(registrationStore);
    vi.stubEnv("HELIX_DESKTOP_DEVICE_ID", "fixture-installed-device");
    try {
      const presence = new HelixLocalSupervisorCoordinationStore("service:registration");
      const identity = principal("profile:registration", "oauth:registration");
      const trust = vi.fn().mockResolvedValue({ trusted: true, accountSessionReady: true,
        agentAccountBindingReady: true, delegatedAccountSessionId: "fixture-session" });
      const client = await connect(presence, identity, { desktopFullHarnessTrustReader: trust });
      const args = { client_continuation_ref: "task:registration", request_id: "fixture-register", duration_seconds: 900 };
      const first = await client.callTool({ name: "helix_reasoning_destination_register", arguments: args });
      expect(first.isError).not.toBe(true);
      expect(first.structuredContent).toMatchObject({ ok: true, registration: {
        proofBasis: "authenticated_client_declaration", currentPresence: false, pairingAuthority: false, executionAuthority: false } });
      clock += 301000;
      const replay = await client.callTool({ name: "helix_reasoning_destination_register", arguments: args });
      expect(replay.structuredContent).toEqual(first.structuredContent);
      expect(presence.listPresence()).toHaveLength(0);
      const forged = await client.callTool({ name: "helix_reasoning_destination_register",
        arguments: { ...args, profile_id: "profile:foreign" } });
      expect(forged.isError).toBe(true);
      trust.mockResolvedValue({ trusted: false });
      const denied = await client.callTool({ name: "helix_reasoning_destination_register", arguments: args });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain("pairing_registration_device_trust_required");
      expect((await pool.query("SELECT * FROM helix_pairing_destinations")).rows).toHaveLength(1);
    } finally { factory.mockRestore(); vi.unstubAllEnvs(); await pool.end(); }
  });
  it("revalidates expired session selectors without restoring expired mutation claims or disconnected selections", async () => {
    let clock = Date.now();
    const store = new HelixLocalSupervisorCoordinationStore("service_instance:55555555555555555555555555555555", () => new Date(clock));
    const identity = principal("profile:heartbeat", "oauth:heartbeat");
    const inspectRun = vi.fn().mockResolvedValue({ run_id: "run:heartbeat", version: 1, lifecycle_status: "waiting" });
    const client = await connect(store, identity, { service: { inspectRun }, roomControlService: {
      inspectRoom: async () => ({ room: { self_participant_id: "participant:heartbeat" } }),
    }, roomBindingStore: { getActiveRunRoomBinding: async () => ({ roomId: "room:heartbeat",
      participantIdAtBind: "participant:heartbeat", bindingId: "binding:heartbeat", version: 1 }) } });
    const refresh = (extra = {}) => client.callTool({ name: "helix_local_supervisor_presence_update", arguments: {
      client_continuation_ref: "task:heartbeat", declared_objective_summary: "Maintain selected session",
      lifecycle_state: "active", ...extra } });
    expect((await refresh({ room_ref: "room:heartbeat", run_ref: "run:heartbeat", resource_claims: [
      { claim_class: "read", resource_ref: "room:heartbeat" },
      { claim_class: "retained_runtime", resource_ref: "run:heartbeat" },
      { claim_class: "mutation_lease_active", resource_ref: "lease:advisory-only" },
    ] })).isError).not.toBe(true);
    clock += 180_001;
    expect(store.listPresence()[0].active).toBe(false);
    const recovered = (await refresh()).structuredContent as any;
    expect(recovered.presence.verified_retained_runtime_identity).toMatchObject({ run_ref: "run:heartbeat" });
    expect(recovered.presence.resource_claims.map((row: any) => row.claim_class)).toEqual(["read", "retained_runtime"]);
    expect(inspectRun).toHaveBeenCalledTimes(2);
    await refresh({ lifecycle_state: "disconnected" });
    expect((await refresh()).structuredContent).toMatchObject({ presence: { run_ref: null,
      verified_retained_runtime_identity: null } });
    expect(inspectRun).toHaveBeenCalledTimes(2);
  });
  it("presents only a catalogued human-only control without invoking it", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:34343434343434343434343434343434",
    );
    const identity: HelixAgentApiPrincipal = {
      ...principal("profile:human-control", "oauth_client:human-control"),
      scopes: new Set([
        ...HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        ...HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
      ]),
    };
    const presenter = vi.fn(async () => ({ accepted: true }));
    const client = await connect(store, identity, {
      surface: "local_supervisor_coordination",
      desktopWorkstationPresenter: presenter,
    });
    const continuation = "codex_thread:human-control";
    await heartbeat(client, continuation, "Present exact binding consent.");

    const result = await client.callTool({
      name: "helix_workstation_human_control_present",
      arguments: {
        client_continuation_ref: continuation,
        control_id:
          "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
      },
    });

    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      schema: "helix.workstation_human_control_presentation.v1",
      accepted: true,
      panel_id: "agent-access",
      interaction_kind: "human_only",
      presentation_only: true,
      control_invoked: false,
      consent_granted: false,
      authority_granted: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(presenter).toHaveBeenCalledWith(expect.objectContaining({
      accountSessionId: identity.accountContext.session_id,
      panelId: "agent-access",
      controlId:
        "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
    }));

    const rejected = await client.callTool({
      name: "helix_workstation_human_control_present",
      arguments: {
        client_continuation_ref: continuation,
        control_id:
          "workstation.panel.agent-access.agent-connection-setup.check-reasoning-binding",
      },
    });
    expect(rejected.isError).toBe(true);
    expect(presenter).toHaveBeenCalledTimes(1);
  });

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
      ["helix_reasoning_prompt_submit", [{
        type: "oauth2", scopes: Array.from(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
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
    const promptArgs = { client_continuation_ref: continuation,
      reasoning_binding_id: binding.reasoning_binding_id, binding_epoch: binding.binding_epoch,
      helix_conversation_id: "helix-chat:reasoning-current", mission_id: "mission:reasoning-current",
      run_id: "run:reasoning-current", client_event_ref: "agent:mcp-request",
      instruction_text: "Inspect the platform" };
    const submit = (patch = {}) => client.callTool({ name: "helix_reasoning_prompt_submit",
      arguments: { ...promptArgs, ...patch } });
    const submitted = await submit();
    expect(submitted.isError, JSON.stringify(submitted)).not.toBe(true);
    expect((await submit()).structuredContent).toEqual(submitted.structuredContent);
    const displayApp = express();
    displayApp.use("/api/account", createAgentConnectionsRouter({ coordinationStore: store,
      reasoningBindingStore: reasoningStore,
      resolveSession: async () => ({ session_id: "browser:display", profile: { profile_id: identity.accountProfileId } }) as never,
      bindingStore: { listBindings: async () => ({ bindings: [] }) } as never,
    }));
    const display = () => httpRequest(displayApp)
      .get(`/api/account/session/agent-connections/reasoning-bindings/${encodeURIComponent(binding.reasoning_binding_id)}/chat-prompts`)
      .set("Cookie", "helix_session=browser:display")
      .query({ binding_epoch: binding.binding_epoch, helix_conversation_id: promptArgs.helix_conversation_id,
        run_id: promptArgs.run_id, after_cursor: event.cursor });
    const visible = await display();
    expect(visible.status).toBe(200);
    expect(visible.body.deliveries).toHaveLength(1);
    expect(visible.body.deliveries[0]).toMatchObject({ instruction_text: promptArgs.instruction_text,
      event: (submitted.structuredContent as any).event });
    expect(visible.body.provider_pickup_confirmed).toBe(false);
    for (const patch of [{ origin: "typed" }, { run_id: "run:foreign" },
      { binding_epoch: binding.binding_epoch + 1 }, { helix_conversation_id: "chat:foreign" },
      { instruction_text: "Changed replay" }]) expect((await submit(patch)).isError).toBe(true);
    const delivery = await client.callTool({ name: "helix_reasoning_steering_read", arguments: {
      client_continuation_ref: continuation, reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch, after_cursor: event.cursor } });
    expect((delivery.structuredContent as any).deliveries).toHaveLength(1);
    expect((delivery.structuredContent as any).deliveries[0]).toMatchObject({
      content_role: "agent_steering_advisory_not_execution",
      event: { origin: "agent_submitted", delivery_state: "pending", answer_authority: false } });
    const agentAck = await client.callTool({ name: "helix_reasoning_steering_acknowledge", arguments: {
      client_continuation_ref: continuation, reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch,
      steering_event_ref: (submitted.structuredContent as any).event.steering_event_ref } });
    expect(agentAck.structuredContent).toMatchObject({ event: { delivery_state: "acknowledged" }, answer_authority: false });
    const visibleAfterAck = await display();
    expect(visibleAfterAck.body.deliveries).toHaveLength(1);
    expect(visibleAfterAck.body.deliveries[0]).toMatchObject({ instruction_text: promptArgs.instruction_text,
      event: { steering_event_ref: (submitted.structuredContent as any).event.steering_event_ref,
        delivery_state: "acknowledged", answer_authority: false } });
    const removedScope = HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES[0];
    identity.scopes.delete(removedScope);
    expect((await submit({ client_event_ref: "agent:denied" })).isError).toBe(true);
    identity.scopes.add(removedScope);
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

  it("publishes temporal OAuth metadata in both raw transport catalogs", async () => {
    const store = new HelixLocalSupervisorCoordinationStore("service_instance:78787878787878787878787878787878");
    const reasoningTaskBindingStore = new HelixReasoningTaskBindingStore(store);
    const identity = principal("profile:temporal-catalog", "oauth_client:temporal-catalog");
    const rawCatalogSchema = z.object({ tools: z.array(z.object({
      name: z.string(), securitySchemes: z.unknown().optional(),
      _meta: z.object({ securitySchemes: z.unknown().optional() }).passthrough().optional(),
    }).passthrough()) }).passthrough();
    for (const surface of ["local_supervisor_coordination", undefined]) {
      const client = await connect(store, identity, { surface, reasoningTaskBindingStore });
      const catalog = await client.request({ method: "tools/list" }, rawCatalogSchema);
      for (const name of ["helix_environment_temporal_frontier_publish", "helix_environment_temporal_plan_submit", "helix_environment_session_ready_up"]) {
        const tool = catalog.tools.find(candidate => candidate.name === name);
        expect(tool, `${surface}: ${name}`).toBeDefined();
        expect(tool?.securitySchemes, `${surface}: ${name}`).toEqual(tool?._meta?.securitySchemes);
        expect(tool?.securitySchemes).toEqual(expect.arrayContaining([expect.objectContaining({ type: "oauth2" })]));
      }
    }
  });

  it("shares a browser preparation mailbox with exact MCP pickup and verified acknowledgement", async () => {
    vi.stubEnv("HELIX_PUBLIC_ROOMS_EXPERIMENT", "1");
    const membership = vi.spyOn(roomMembership, "readSharedRealtimeRoomMembership").mockResolvedValue({
      participantId: "participant:verified", roomStatus: "ready",
    } as never);
    try {
      const store = new HelixLocalSupervisorCoordinationStore("service_instance:88888888888888888888888888888888");
      const reasoning = new HelixReasoningTaskBindingStore(store);
      const identity = principal("profile:preparation", "oauth_client:preparation");
      identity.scopes.add(HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE);
      const verify = vi.fn().mockResolvedValue([{ runId: "run:prepared" }]);
      const startRun = vi.fn().mockResolvedValue({ body: { run_id: "run:new-preparation" }, idempotencyReplayed: false });
      const bindRun = vi.fn().mockResolvedValue({});
      const inspectRun = vi.fn().mockResolvedValue({ run_id: "run:new-preparation", version: 1, lifecycle_status: "waiting" });
      const activeBinding = vi.fn().mockResolvedValue({ roomId: "room:selected", participantIdAtBind: "participant:verified",
        bindingId: "binding:new-preparation", version: 1 });
      const client = await connect(store, identity, { reasoningTaskBindingStore: reasoning,
        service: { startRun, inspectRun },
        roomBindingStore: { listRunPreparationCandidates: verify, bindRunToRoom: bindRun,
          getActiveRunRoomBinding: activeBinding }, roomControlService: {
          inspectRoom: async () => ({ room: { self_participant_id: "participant:verified" } }),
        } });
      const presenceReply = await heartbeat(client, "task:preparation", "Prepare the selected session");
      expect(presenceReply.isError).not.toBe(true);
      const presence = (presenceReply.structuredContent as any).presence;
      const app = express();
      app.use("/api/account", createAgentConnectionsRouter({ coordinationStore: store,
        reasoningBindingStore: reasoning, preparationBindingStore: reasoning,
        resolveSession: async () => ({ session_id: "browser:preparation", profile: { profile_id: identity.accountProfileId } }) as never,
        bindingStore: { listBindings: async () => ({ bindings: [{ status: "active", binding_ref: "account:fixture" }] }) } as never,
      }));
      const enqueue = (requestId: string, chat = "chat:browser-selected") => httpRequest(app)
        .post("/api/account/session/agent-connections/environment-session/prepare-request")
        .set("Cookie", "helix_session=browser:preparation").send({ request_id: requestId,
          client_session_ref: presence.client_session_ref, client_continuation_ref: "task:preparation",
          helix_conversation_id: chat, room_id: "room:selected", requested_duration_seconds: 28800 });
      const browserReply = await enqueue("request:a");
      expect(browserReply.status, JSON.stringify(browserReply.body)).toBe(202);
      const read = () => client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "read_preparation", client_continuation_ref: "task:preparation" } });
      const picked = await read();
      expect(picked.isError).not.toBe(true);
      expect(picked.structuredContent).toMatchObject({ intents: [{ intentId: browserReply.body.intent.intentId,
        helixConversationId: "chat:browser-selected", roomId: "room:selected", status: "pending" }] });
      const acknowledge = () => client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "acknowledge_preparation", client_continuation_ref: "task:preparation",
        intent_id: browserReply.body.intent.intentId, run_id: "run:prepared" } });
      const receipt = await acknowledge();
      expect(receipt.isError, JSON.stringify(receipt)).not.toBe(true);
      expect(receipt.structuredContent).toMatchObject({ ready: false, task_binding_authority: false,
        execution_authority: false, intent: { status: "run_prepared", preparedRunId: "run:prepared" } });
      expect(verify).toHaveBeenCalledWith({ owner: { tenantId: identity.tenantId, issuer: identity.issuer,
        subjectId: identity.subjectId, accountProfileId: identity.accountProfileId },
        roomId: "room:selected", participantId: "participant:verified", runId: "run:prepared" });
      expect((await read()).structuredContent).toMatchObject({ intents: [] });
      expect((await enqueue("request:a")).body.intent.status).toBe("run_prepared");
      expect((await acknowledge()).isError).not.toBe(true);
      verify.mockResolvedValue([]);
      expect((await acknowledge()).isError).toBe(true);
      const next = await enqueue("request:new", "chat:new-preparation");
      expect(next.status).toBe(202);
      const prepare = () => client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "prepare_run", client_continuation_ref: "task:preparation",
        intent_id: next.body.intent.intentId, objective: "Prepare the selected environment session" } });
      expect((await prepare()).isError).toBe(true);
      expect(startRun).not.toHaveBeenCalled();
      identity.scopes.add("helix.agent_runs.write");
      verify.mockImplementation(async ({ runId }) => runId === "run:new-preparation"
        ? [{ runId }] : []);
      for (let i = 0; i < 3; i++) {
        const result = await prepare();
        expect(result.isError, JSON.stringify(result)).not.toBe(true);
        expect(result.structuredContent).toMatchObject({ operation: "prepare_run", ready: false,
          task_binding_authority: false, execution_authority: false,
          presence: { conversation_thread_ref: "task:preparation", client_session_ref: presence.client_session_ref,
            room_ref: "room:selected", run_ref: "run:new-preparation",
            verified_room_identity: { basis: "server_verified", room_ref: "room:selected" },
            verified_retained_runtime_identity: { basis: "server_verified", run_ref: "run:new-preparation" } },
          intent: { preparedRunId: "run:new-preparation", helixConversationId: "chat:new-preparation" } });
      }
      expect(startRun).toHaveBeenCalledTimes(1);
      expect(startRun).toHaveBeenCalledWith(expect.objectContaining({ principal: identity,
        idempotencyKey: expect.stringMatching(/^preparation:/),
        request: expect.objectContaining({ budget: { expires_in_seconds: 28800, max_steps: 12 } }) }));
      expect(bindRun).toHaveBeenCalledWith({ owner: { tenantId: identity.tenantId, issuer: identity.issuer,
        subjectId: identity.subjectId, accountProfileId: identity.accountProfileId },
        roomId: "room:selected", runId: "run:new-preparation", preserveRevocation: true });
      expect((await read()).structuredContent).toMatchObject({ intents: [] });
      const ordinaryRefresh = () => client.callTool({ name: "helix_local_supervisor_presence_update", arguments: {
        client_continuation_ref: "task:preparation", declared_objective_summary: "Continue session preparation",
        lifecycle_state: "active" } });
      expect((await ordinaryRefresh()).structuredContent).toMatchObject({ presence: {
        room_ref: "room:selected", run_ref: "run:new-preparation",
        verified_retained_runtime_identity: { run_ref: "run:new-preparation", basis: "server_verified" },
      } });
      activeBinding.mockResolvedValueOnce(null);
      expect((await ordinaryRefresh()).structuredContent).toMatchObject({ presence: {
        run_ref: "run:new-preparation", verified_retained_runtime_identity: null,
      } });
      const otherTask = await client.callTool({ name: "helix_local_supervisor_presence_update", arguments: {
        client_continuation_ref: "task:other", declared_objective_summary: "Unrelated task", lifecycle_state: "active" } });
      expect(otherTask.structuredContent).toMatchObject({ presence: { room_ref: null, run_ref: null,
        verified_retained_runtime_identity: null } });
      activeBinding.mockResolvedValueOnce(null);
      expect((await prepare()).isError).toBe(true);
      expect((await prepare()).isError).not.toBe(true);
      expect(startRun).toHaveBeenCalledTimes(1);
      const cleared = await client.callTool({ name: "helix_local_supervisor_presence_update", arguments: {
        client_continuation_ref: "task:preparation", declared_objective_summary: "Clear selection", lifecycle_state: "active",
        resource_claims: [], room_ref: null, run_ref: null, environment_ref: null } });
      expect(cleared.structuredContent).toMatchObject({ presence: { room_ref: null, run_ref: null,
        verified_retained_runtime_identity: null } });
      expect((await ordinaryRefresh()).structuredContent).toMatchObject({ presence: { run_ref: null } });
    } finally { membership.mockRestore(); vi.unstubAllEnvs(); }
  });

  it("routes Ready up through the authenticated exact task and participant", async () => {
    vi.stubEnv("HELIX_PUBLIC_ROOMS_EXPERIMENT", "1");
    try {
      const store = new HelixLocalSupervisorCoordinationStore("service_instance:78787878787878787878787878787878");
      const reasoning = new HelixReasoningTaskBindingStore(store);
      const identity = principal("profile:ready-up-success", "oauth_client:ready-up-success");
      identity.scopes.add(HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE);
      const execute = vi.fn().mockResolvedValue({ schema: "helix.environment_session_ready_up.v1",
        readiness: { ready: false }, repairs: [], execution_authority: false, answer_authority: false });
      const blockedPreparation = { readiness: { ready: false, valid_until_ms: null,
        checks: [{ layer: "authority", state: "revoked", human_approval_required: true }] },
        selection: { room_id: "room:ready-up", environment_binding_id: "environment:a" },
        session_deadlines: { run_expires_at_ms: 1900000000000 }, repairs: [],
        execution_authority: false, answer_authority: false, terminal_eligible: false };
      const automatic = vi.fn().mockResolvedValue(blockedPreparation);
      const discover = vi.fn().mockResolvedValue([{ runId: "run:existing", runVersion: 1,
        expiresAt: "2099-01-01T00:00:00.000Z", roomBindingId: "binding:room", roomBindingVersion: 1 }]);
      const client = await connect(store, identity, { reasoningTaskBindingStore: reasoning,
        roomBindingStore: { listRunPreparationCandidates: discover },
        environmentSessionReadyUp: execute, environmentSessionAutoPrepare: automatic, roomControlService: {
          inspectRoom: async () => ({ room: { self_participant_id: "participant:verified" } }),
        } });
      const presenceResult = await client.callTool({ name: "helix_local_supervisor_presence_update", arguments: {
        client_continuation_ref: "task:ready-up", declared_objective_summary: "Prepare my environment",
        lifecycle_state: "active", resource_claims: [], heartbeat_ttl_seconds: 60,
        thread_observability_bridge: { supported_levels: ["tool_activity_only", "checkpoint_publish", "continuation_ready"],
          requested_level: "continuation_ready", checkpoint_publication: {
            freshness_window_seconds: 120, retention: "current_session", revocation: "independent" } },
      } });
      expect(presenceResult.isError, JSON.stringify(presenceResult)).not.toBe(true);
      const presence = (presenceResult.structuredContent as any).presence;
      const pendingSetup = await client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "read_preparation", client_continuation_ref: "task:ready-up",
      } });
      expect(pendingSetup.isError, JSON.stringify(pendingSetup)).not.toBe(true);
      expect(pendingSetup.structuredContent).toMatchObject({ intents: [], ready: false,
        execution_authority: false, answer_authority: false });
      const missingPreparation = await client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "acknowledge_preparation", client_continuation_ref: "task:ready-up",
        intent_id: "nonexistent", run_id: "run:existing",
      } });
      expect(missingPreparation.isError).toBe(true);
      expect(discover).not.toHaveBeenCalled();
      const discovery = await client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "discover_runs", client_continuation_ref: "task:ready-up", room_id: "room:ready-up",
      } });
      expect(discovery.isError, JSON.stringify(discovery)).not.toBe(true);
      expect(discovery.structuredContent).toMatchObject({ ready: false, task_binding_verified: false,
        revalidation_required: true, execution_authority: false, candidates: [{ runId: "run:existing" }] });
      expect(discover).toHaveBeenCalledWith({ owner: { tenantId: identity.tenantId, issuer: identity.issuer,
        subjectId: identity.subjectId, accountProfileId: identity.accountProfileId },
        roomId: "room:ready-up", participantId: "participant:verified" });
      expect(automatic).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
      identity.scopes.delete(HELIX_AGENT_RUN_READ_SCOPE);
      const deniedDiscovery = await client.callTool({ name: "helix_environment_session_ready_up", arguments: {
        operation: "discover_runs", client_continuation_ref: "task:ready-up", room_id: "room:ready-up",
      } });
      expect(deniedDiscovery.isError).toBe(true);
      expect(discover).toHaveBeenCalledTimes(1);
      identity.scopes.add(HELIX_AGENT_RUN_READ_SCOPE);
      const claim = reasoning.issueClaim({ profileRef: identity.accountProfileId, clientSessionRef: presence.client_session_ref,
        helixConversationId: "chat:ready-up", missionId: null, runId: "run:ready-up" });
      const claimed = await client.callTool({ name: "helix_reasoning_task_binding_claim", arguments: {
        client_continuation_ref: "task:ready-up", claim_handle: claim.claim_handle,
      } });
      expect(claimed.isError).not.toBe(true);
      const binding = (claimed.structuredContent as any).binding;
      const args = { client_continuation_ref: "task:ready-up", reasoning_binding_id: binding.reasoning_binding_id,
        binding_epoch: binding.binding_epoch, helix_conversation_id: "chat:ready-up", mission_id: null,
        room_id: "room:ready-up", run_id: "run:ready-up", goal_id: "goal:a", expected_revision: 1,
        turn_id: "turn:a", probe_request_id: "probe:a", prior_turn_id: "turn:prior",
        environment_binding_id: "environment:a", source_id: "source:a", world_id: "world:a",
        subject_binding_id: "subject:a", action_authority_id: "authority:a" };
      const result = await client.callTool({ name: "helix_environment_session_ready_up", arguments: args });
      expect(result.isError).not.toBe(true);
      expect(execute).toHaveBeenCalledOnce();
      expect(execute.mock.calls[0][0]).toMatchObject({
        context: { profileId: identity.accountProfileId, participantId: "participant:verified", runId: "run:ready-up" },
        binding: { helixConversationId: "chat:ready-up", clientContinuationRef: "task:ready-up" },
      });
      const goalBootstrap = { environment_binding_id: "environment:a", subject_binding_id: "subject:a",
        action_authority_id: "authority:a", objective: { domain: "minecraft", goal_kind: "custom_survival",
          objective_text: "Cross the platform", game_version: "1.21.8", mechanics_collection_ref: null,
          milestones: [{ milestone_id: "cross", description: "Cross", dependency_milestone_ids: [], required_postcondition_ids: ["arrival"] }] } };
      const automaticArgs = { client_continuation_ref: args.client_continuation_ref,
        reasoning_binding_id: args.reasoning_binding_id, binding_epoch: args.binding_epoch,
        helix_conversation_id: args.helix_conversation_id, mission_id: null,
        run_id: args.run_id, request_id: "ready:automatic", goal_bootstrap: goalBootstrap };
      const catalogue = await client.listTools();
      const readySchema = catalogue.tools.find(tool => tool.name === "helix_environment_session_ready_up")!.inputSchema;
      expect(readySchema.properties).toHaveProperty("request_id");
      expect(readySchema.properties).toHaveProperty("goal_bootstrap");
      expect(readySchema.properties).toHaveProperty("client_continuation_ref");
      const prepared = await client.callTool({ name: "helix_environment_session_ready_up", arguments: automaticArgs });
      expect(prepared.isError, JSON.stringify(prepared)).not.toBe(true);
      expect(prepared.structuredContent).toMatchObject({ receipt: blockedPreparation,
        execution_authority: false, answer_authority: false, terminal_eligible: false });
      expect(automatic).toHaveBeenCalledOnce();
      expect(automatic.mock.calls[0][0]).toMatchObject({ requestId: "ready:automatic", runId: args.run_id, goalBootstrap });
      expect(automatic.mock.calls[0][0].sessionId).toBe(identity.accountContext.session_id);
      expect(automatic.mock.calls[0][4].target.clientContinuationRef).toBe(args.client_continuation_ref);
      const partialError = new EnvironmentSessionPreparationError(new Error("private detail"),
        [{ layer: "subject", changed: true, reason_code: "subject_epoch_checked" }], true);
      automatic.mockRejectedValueOnce(partialError);
      const partial = await client.callTool({ name: "helix_environment_session_ready_up", arguments: automaticArgs });
      expect(partial.isError).toBe(true);
      expect(partial.structuredContent).toEqual(partialError.projection);
      const wrongTask = await client.callTool({ name: "helix_environment_session_ready_up",
        arguments: { ...automaticArgs, client_continuation_ref: "task:foreign" } });
      expect(wrongTask.isError).toBe(true);
      expect(automatic).toHaveBeenCalledTimes(2);
      for (const mismatch of [
        { reasoning_binding_id: "binding:foreign" },
        { binding_epoch: binding.binding_epoch + 1 },
        { run_id: "run:foreign" },
        { mission_id: "mission:foreign" },
        { helix_conversation_id: "chat:foreign" },
      ]) {
        const stale = await client.callTool({ name: "helix_environment_session_ready_up",
          arguments: { ...automaticArgs, ...mismatch } });
        expect(stale.isError, JSON.stringify(mismatch)).toBe(true);
        expect(automatic).toHaveBeenCalledTimes(2);
        expect(execute).toHaveBeenCalledOnce();
      }
      expect(reasoning.inspect({ profileRef: identity.accountProfileId,
        bindingId: binding.reasoning_binding_id })).toMatchObject({
        status: "active", binding_epoch: binding.binding_epoch, run_id: args.run_id,
      });
      const rejected = await client.callTool({ name: "helix_environment_session_ready_up",
        arguments: { ...args, helix_conversation_id: "chat:other" } });
      expect(rejected.isError).toBe(true);
      expect(execute).toHaveBeenCalledOnce();
    } finally { vi.unstubAllEnvs(); }
  });

  it("does not ready up a session with read-only scopes", async () => {
    const store = new HelixLocalSupervisorCoordinationStore("service_instance:78787878787878787878787878787878");
    const executor = vi.fn();
    const client = await connect(store, principal("profile:ready-up", "oauth_client:ready-up"), {
      reasoningTaskBindingStore: new HelixReasoningTaskBindingStore(store), environmentSessionReadyUp: executor,
    });
    const result = await client.callTool({ name: "helix_environment_session_ready_up", arguments: {
      client_continuation_ref: "task:a", reasoning_binding_id: "binding:a", binding_epoch: 1,
      helix_conversation_id: "chat:a", mission_id: null, room_id: "room:a", run_id: "run:a",
      goal_id: "goal:a", expected_revision: 1, turn_id: "turn:a", probe_request_id: "probe:a", prior_turn_id: "turn:prior",
      environment_binding_id: "environment:a", source_id: "source:a", world_id: "world:a",
      subject_binding_id: "subject:a", action_authority_id: "authority:a",
    } });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).toContain("insufficient_scope");
    expect(executor).not.toHaveBeenCalled();
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
      "helix_environment_temporal_frontier_publish",
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
      "helix_environment_action_authority_revoke",
      "helix_environment_command_authority_configure",
      "helix_environment_player_pair_local",
      "helix_environment_source_pair_local",
      "helix_environment_server_pair_local",
      "helix_environment_action_authority_extend",
      "helix_minecraft_local_lifecycle_launch",
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
    const deniedFrontier = await shadowClient.callTool({
      name: "helix_environment_temporal_frontier_publish",
      arguments: {
        room_id: "shared_realtime_room:shadow-fixture",
        goal_id: "goal:shadow", expected_revision: 1, run_id: null,
        turn_id: "turn:shadow", probe_request_id: "probe:shadow", prior_turn_id: "turn:prior",
      },
    });
    expect(deniedFrontier.isError).toBe(true);
    expect(JSON.parse((deniedFrontier.content[0] as { text: string }).text)).toMatchObject({
      error: "full_mcp_transition_required", mutation_executed: false,
    });
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
    let nextNativeRouting = {
      reconnectRequired: false,
      catalogRefreshRequired: false,
      stableScopeRouting: true,
    };
    const client = await connect(store, desktopPrincipal, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
      desktopMcpTunnelTransitionExecutor: async (request: Record<string, unknown>) => {
        executed.push(request);
        if (rejectNativeTransition) {
          throw new Error("fixture_native_transition_rejected");
        }
        return {
          accepted: true,
          nativeReceiptRef: "native_transition_receipt:fixture",
          ...nextNativeRouting,
        };
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
    expect(requested.structuredContent).toMatchObject({
      reconnect_required: false,
      catalog_refresh_required: false,
      stable_scope_routing: true,
    });
    const request = (requested.structuredContent as any).request;
    expect(request).toMatchObject({
      status: "pending_user_delegation",
      independent_external_oauth_client_bound: false,
      terminal_eligible: false,
    });
    const recovered = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        declared_task_summary: "Recover the existing MCP transition.",
        requested_lease_seconds: 60,
      },
    });
    expect(recovered.isError, JSON.stringify(recovered)).not.toBe(true);
    expect(recovered.structuredContent).toMatchObject({
      existing_request_reused: true,
      reconnect_required: false,
      catalog_refresh_required: false,
      stable_scope_routing: true,
      request: {
        transition_request_ref: request.transition_request_ref,
        status: "pending_user_delegation",
      },
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
      reconnect_required: false,
      catalog_refresh_required: false,
      stable_scope_routing: true,
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
      reconnect_required: false,
      catalog_refresh_required: false,
      stable_scope_routing: true,
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
      reconnect_required: false,
      catalog_refresh_required: false,
      stable_scope_routing: true,
    });
    expect(executed).toHaveLength(1);
    expect(toolListChangedNotifications).toBe(2);

    const refreshed = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:bootstrap",
        declared_task_summary: "Refresh metadata after native acceptance.",
        requested_lease_seconds: 60,
      },
    });
    expect(refreshed.isError, JSON.stringify(refreshed)).not.toBe(true);
    expect(refreshed.structuredContent).toMatchObject({
      existing_request_reused: true,
      tool_list_changed_requested: true,
      reconnect_required: false,
      catalog_refresh_required: false,
      stable_scope_routing: true,
      request: {
        transition_request_ref: request.transition_request_ref,
        status: "transition_accepted",
      },
    });
    expect(executed).toHaveLength(1);
    expect(toolListChangedNotifications).toBe(3);

    await heartbeat(
      client,
      "codex_thread:non-stable-native",
      "Preserve a native reconnect requirement across replay and inspection.",
    );
    const nonStableRequestResult = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:non-stable-native",
        declared_task_summary:
          "Preserve a native reconnect requirement across replay and inspection.",
        requested_lease_seconds: 60,
      },
    });
    const nonStableRequest = (nonStableRequestResult.structuredContent as any)
      .request;
    transitions.grant({
      requestRef: nonStableRequest.transition_request_ref,
      authenticatedProfileRef: "profile:desktop",
      accountSessionId: "account_session:desktop-owner",
      accountType: "developer",
      leaseSeconds: 60,
    });
    nextNativeRouting = {
      reconnectRequired: true,
      catalogRefreshRequired: true,
      stableScopeRouting: false,
    };
    const nonStableAccepted = await client.callTool({
      name: "helix_desktop_tunnel_transition_execute",
      arguments: {
        client_continuation_ref: "codex_thread:non-stable-native",
        transition_request_ref: nonStableRequest.transition_request_ref,
        target_scope: "full_helix_agent",
        idempotency_key: "idempotency-non-stable-native",
      },
    });
    expect(nonStableAccepted.structuredContent).toMatchObject({
      reconnect_required: true,
      catalog_refresh_required: true,
      stable_scope_routing: false,
    });
    const nonStableReplay = await client.callTool({
      name: "helix_desktop_tunnel_transition_execute",
      arguments: {
        client_continuation_ref: "codex_thread:non-stable-native",
        transition_request_ref: nonStableRequest.transition_request_ref,
        target_scope: "full_helix_agent",
        idempotency_key: "idempotency-non-stable-native",
      },
    });
    expect(nonStableReplay.structuredContent).toMatchObject({
      idempotency_replayed: true,
      reconnect_required: true,
      catalog_refresh_required: true,
      stable_scope_routing: false,
    });
    const nonStableInspected = await client.callTool({
      name: "helix_desktop_tunnel_transition_inspect",
      arguments: {
        client_continuation_ref: "codex_thread:non-stable-native",
        transition_request_ref: nonStableRequest.transition_request_ref,
      },
    });
    expect(nonStableInspected.structuredContent).toMatchObject({
      reconnect_required: true,
      catalog_refresh_required: true,
      stable_scope_routing: false,
    });

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
    expect(toolListChangedNotifications).toBe(5);
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
        reconnectRequired: false,
        catalogRefreshRequired: false,
        stableScopeRouting: true,
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
    const expectedTransitionSecuritySchemes = new Map<string, unknown>([
      ["helix_desktop_tunnel_transition_request", [{
        type: "oauth2",
        scopes: [HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE],
      }]],
      ["helix_desktop_tunnel_transition_inspect", [{
        type: "oauth2",
        scopes: [HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE],
      }]],
      ["helix_desktop_tunnel_transition_execute", [{
        type: "oauth2",
        scopes: [HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE],
      }]],
    ]);
    for (const [toolName, securitySchemes] of expectedTransitionSecuritySchemes) {
      const tool = listed.tools.find((candidate) => candidate.name === toolName);
      expect(tool?._meta?.securitySchemes, toolName).toEqual(securitySchemes);
    }

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

  it("applies an active native trusted-device policy to a finite transition request", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:78787878787878787878787878787878",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const identity: HelixAgentApiPrincipal = {
      ...principal("profile:trusted-device", "oauth_client:trusted-device"),
      scopes: new Set([
        ...HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        ...HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
      ]),
    };
    const trustReader = vi.fn(async () => ({
      trusted: true,
      delegatedAccountSessionId: "account_session:native-trusted-device",
      accountSessionReady: true,
      agentAccountBindingReady: true,
    }));
    const presenter = vi.fn(async () => ({ accepted: true }));
    const client = await connect(store, identity, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
      desktopFullHarnessTrustReader: trustReader,
      desktopWorkstationPresenter: presenter,
    });
    await heartbeat(
      client,
      "codex_thread:trusted-device",
      "Request a finite full-harness tunnel lease.",
    );
    const result = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:trusted-device",
        declared_task_summary: "Request a finite full-harness tunnel lease.",
        requested_lease_seconds: 90,
      },
    });
    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      trusted_device_delegation_applied: true,
      native_attention_requested: true,
      native_attention_presentation_only: true,
      request: {
        status: "delegated",
        requested_lease_seconds: 90,
        environment_authority_granted: false,
        trading_authority_granted: false,
        answer_authority: false,
        terminal_eligible: false,
      },
      receipt: { event_type: "delegated" },
    });
    expect(trustReader).toHaveBeenCalledWith({
      authenticatedProfileRef: "profile:trusted-device",
    });
    expect(presenter).toHaveBeenCalledWith(expect.objectContaining({
      accountSessionId: identity.accountContext.session_id,
      controlId:
        "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
    }));
    const request = (result.structuredContent as any).request;
    expect(transitions.listReceipts(request.transition_request_ref).map(
      (receipt) => receipt.event_type,
    )).toEqual(["requested", "delegated"]);
  });

  it("presents OAuth linking before exact task binding when the agent account binding is not active", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:79797979797979797979797979797979",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const identity: HelixAgentApiPrincipal = {
      ...principal("profile:binding-prerequisite", "oauth_client:binding-prerequisite"),
      scopes: new Set([
        ...HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        ...HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
      ]),
    };
    const presenter = vi.fn(async () => ({ accepted: true }));
    const client = await connect(store, identity, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
      desktopFullHarnessTrustReader: vi.fn(async () => ({
        trusted: true,
        delegatedAccountSessionId: "account_session:native-binding-prerequisite",
        accountSessionReady: true,
        agentAccountBindingReady: false,
      })),
      desktopWorkstationPresenter: presenter,
    });
    await heartbeat(
      client,
      "codex_thread:binding-prerequisite",
      "Present the first unmet exact-binding prerequisite.",
    );

    const result = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:binding-prerequisite",
        declared_task_summary:
          "Present the first unmet exact-binding prerequisite.",
        requested_lease_seconds: 90,
      },
    });

    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      trusted_device_delegation_applied: true,
      native_attention_requested: true,
      native_attention_presentation_only: true,
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(presenter).toHaveBeenCalledWith(expect.objectContaining({
      accountSessionId: identity.accountContext.session_id,
      panelId: "agent-access",
      targetId: "auth0-account-link",
    }));
    expect(presenter).not.toHaveBeenCalledWith(expect.objectContaining({
      controlId:
        "workstation.panel.agent-access.agent-connection-setup.bind-current-helix-chat",
    }));
  });

  it("presents local sign-in before OAuth linking when the delegated desktop session is inactive", async () => {
    const store = new HelixLocalSupervisorCoordinationStore(
      "service_instance:80808080808080808080808080808080",
    );
    const transitions = new DesktopMcpTunnelTransitionStore(
      store.serviceInstanceRef,
    );
    const identity: HelixAgentApiPrincipal = {
      ...principal("profile:session-prerequisite", "oauth_client:session-prerequisite"),
      scopes: new Set([
        ...HELIX_LOCAL_SUPERVISOR_READ_MCP_SCOPES,
        ...HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES,
        HELIX_DESKTOP_TUNNEL_TRANSITION_REQUEST_SCOPE,
        HELIX_DESKTOP_TUNNEL_TRANSITION_EXECUTE_SCOPE,
      ]),
    };
    const presenter = vi.fn(async () => ({ accepted: true }));
    const client = await connect(store, identity, {
      surface: "local_supervisor_coordination",
      desktopMcpTunnelTransitionStore: transitions,
      desktopFullHarnessTrustReader: vi.fn(async () => ({
        trusted: true,
        delegatedAccountSessionId: "account_session:expired",
        accountSessionReady: false,
        agentAccountBindingReady: false,
      })),
      desktopWorkstationPresenter: presenter,
    });
    await heartbeat(
      client,
      "codex_thread:session-prerequisite",
      "Present the first unmet exact-binding prerequisite.",
    );

    const result = await client.callTool({
      name: "helix_desktop_tunnel_transition_request",
      arguments: {
        client_continuation_ref: "codex_thread:session-prerequisite",
        declared_task_summary:
          "Present the first unmet exact-binding prerequisite.",
        requested_lease_seconds: 90,
      },
    });

    expect(result.isError, JSON.stringify(result)).not.toBe(true);
    expect(presenter).toHaveBeenCalledWith(expect.objectContaining({
      accountSessionId: identity.accountContext.session_id,
      panelId: "account-session",
      targetId: "account-session-sign-in",
    }));
    expect(presenter).not.toHaveBeenCalledWith(expect.objectContaining({
      targetId: "auth0-account-link",
    }));
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
          reconnectRequired: false,
          catalogRefreshRequired: false,
          stableScopeRouting: true,
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
      "helix_environment_temporal_frontier_publish",
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
      "helix_reasoning_destination_register",
      "helix_reasoning_pairing_accept",
      "helix_reasoning_pairing_recover",
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
      "helix_workstation_human_control_present",
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
