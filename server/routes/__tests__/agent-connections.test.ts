import express from "express";
import crypto from "node:crypto";
import { migration087 } from "../../db/migrations/087_pairing_ledger";
import { PairingLedgerRepository } from "../../services/local-supervisor/pairing-ledger-repository";
import { newDb } from "pg-mem";
import { migration088 } from "../../db/migrations/088_pairing_destinations";
import { migration089 } from "../../db/migrations/089_pairing_destination_identity";
import { PairingDestinationRegistrationStore } from "../../services/local-supervisor/pairing-destination-registration";
import { ephemeralPairingVault } from "../../services/local-supervisor/__tests__/pairing-vault-fixture";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { HelixLocalSupervisorPresence } from "@shared/helix-local-supervisor-coordination";
import type { HelixAgentAccountBindingProjection } from "../../services/helix-account/agent-account-link-store";
import { createAgentConnectionsRouter } from "../agent-connections";
import { HelixReasoningTaskBindingStore } from
  "../../services/local-supervisor/reasoning-task-binding-store";
import { EnvironmentDurableGoalError } from "../../services/environment-connectors/goals/durable-goal-store";
import { EnvironmentSessionPreparationError } from "../../services/environment-connectors/session/preparation-error";
import { EnvironmentSessionPreparationIntentStore } from "../../services/environment-connectors/session/preparation-intent-store";

const SESSION_ID = "session-owned";
const PROFILE_ID = "profile-owned";
const SERVICE_REF = "service-current";
const binding: HelixAgentAccountBindingProjection = {
  binding_ref: "binding-owned",
  issuer: "https://auth.example",
  tenant_ref: "tenant-ref",
  provider: "auth0",
  status: "active",
  created_at: "2026-08-31T12:00:00.000Z",
  updated_at: "2026-08-31T12:00:00.000Z",
  revoked_at: null,
  subject_included: false,
  bearer_included: false,
};

const presence = (overrides: Partial<HelixLocalSupervisorPresence> = {}): HelixLocalSupervisorPresence => ({
  schema: "helix.local_supervisor_coordination.v1",
  service_instance_ref: SERVICE_REF,
  client_session_ref: "client-session-owned",
  conversation_thread_ref: "thread-owned",
  authenticated_profile_ref: PROFILE_ID,
  authenticated_mcp_client_ref: "mcp-client-owned",
  declared_objective_summary: "Observe setup readiness",
  declared_objective_is_verified: false,
  lifecycle_basis: "authenticated_client_heartbeat",
  lifecycle_state: "active",
  resource_claims: [],
  room_ref: null,
  environment_ref: null,
  run_ref: null,
  verified_room_identity: null,
  verified_connector_identity: null,
  verified_retained_runtime_identity: null,
  verified_execution_lease_identity: null,
  blocker_summary: null,
  observed_at: "2026-08-31T12:00:00.000Z",
  heartbeat_expires_at: "2026-08-31T12:01:00.000Z",
  active: true,
  credential_included: false,
  private_endpoint_included: false,
  hidden_reasoning_included: false,
  native_account_identity_included: false,
  content_role: "supervisor_presence_advisory",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  ...overrides,
});

const setup = (input?: { bindings?: HelixAgentAccountBindingProjection[]; presence?: HelixLocalSupervisorPresence[];
  destinationRegistrationStore?: Parameters<typeof createAgentConnectionsRouter>[0]["destinationRegistrationStore"];
  pairingLedgerRepository?: Parameters<typeof createAgentConnectionsRouter>[0]["pairingLedgerRepository"];
  readPairingDeviceTrust?: Parameters<typeof createAgentConnectionsRouter>[0]["readPairingDeviceTrust"];
  validatePairingEnvironment?: Parameters<typeof createAgentConnectionsRouter>[0]["validatePairingEnvironment"];
  resolveRunAssociation?: Parameters<typeof createAgentConnectionsRouter>[0]["resolveRunAssociation"];
  prepareEnvironmentSession?: Parameters<typeof createAgentConnectionsRouter>[0]["prepareEnvironmentSession"];
  prepareBrowserSession?: Parameters<typeof createAgentConnectionsRouter>[0]["prepareBrowserSession"];
  preparationIntentStore?: Parameters<typeof createAgentConnectionsRouter>[0]["preparationIntentStore"];
  readPreparationMembership?: Parameters<typeof createAgentConnectionsRouter>[0]["readPreparationMembership"] }) => {
  const listBindings = vi.fn(async () => ({
    schema: "helix.agent_account_bindings.v1" as const,
    oauth_ready: (input?.bindings ?? [binding]).some((entry) => entry.status === "active"),
    bindings: input?.bindings ?? [binding],
  }));
  const coordinationStore = {
    serviceInstanceRef: SERVICE_REF,
    listPresence: vi.fn(() => input?.presence ?? [presence()]),
  };
  const reasoningStore = new HelixReasoningTaskBindingStore(coordinationStore);
  const resolveSession = vi.fn(async () => ({
    session_id: SESSION_ID,
    profile: { profile_id: PROFILE_ID },
  }));
  const app = express();
  app.use("/api/account", createAgentConnectionsRouter({
    destinationRegistrationStore: input?.destinationRegistrationStore,
    pairingLedgerRepository: input?.pairingLedgerRepository,
    readPairingDeviceTrust: input?.readPairingDeviceTrust,
    validatePairingEnvironment: input?.validatePairingEnvironment,
    bindingStore: { listBindings } as never,
    coordinationStore,
    reasoningBindingStore: reasoningStore,
    preparationBindingStore: reasoningStore,
    prepareEnvironmentSession: input?.prepareEnvironmentSession,
    prepareBrowserSession: input?.prepareBrowserSession,
    preparationIntentStore: input?.preparationIntentStore,
    readPreparationMembership: input?.readPreparationMembership,
    resolveSession,
    resolveRunAssociation: input?.resolveRunAssociation,
  }));
  return { app, listBindings, coordinationStore, reasoningStore, resolveSession };
};

const getReadiness = (app: express.Express, profile = "codex_app") =>
  request(app)
    .get(`/api/account/session/agent-connections/readiness?client_profile=${profile}`)
    .set("Cookie", `helix_session=${SESSION_ID}`);

describe("owner-scoped AI app connection readiness", () => {
  it("issues one encrypted invitation through the browser handler while idle and rejects changed authority", async () => {
    const pool = new (newDb().adapters.createPg().Pool)();
    await pool.query("CREATE TABLE helix_accounts(profile_id text PRIMARY KEY)");
    await pool.query("INSERT INTO helix_accounts VALUES ($1)", [PROFILE_ID]);
    const dbClient = await pool.connect();
    try { for (const migration of [migration087, migration088, migration089]) await migration.run(dbClient, { enablePgvector: false }); }
    finally { dbClient.release(); }
    vi.stubEnv("HELIX_DESKTOP_DEVICE_ID", "fixture-device");
    try {
      const vault = ephemeralPairingVault();
      const store = new PairingDestinationRegistrationStore(pool, async () => {}, () => new Date(), vault);
      const opaque = (prefix: string, value: string) => `${prefix}:${crypto.createHash("sha256").update(value).digest("hex")}`;
      const registered = await store.registerAuthenticated({ issuer: opaque("issuer", binding.issuer), profileId: PROFILE_ID,
        installationId: opaque("installation", "fixture-device"), clientId: "fixture-client", taskId: "fixture-exact-task" },
      { requestId: "fixture-registration", durationSeconds: 900 });
      const trust = vi.fn(async () => ({ trusted: true }) as never);
      const environment = vi.fn(async () => false);
      const h = setup({ presence: [], destinationRegistrationStore: store,
        pairingLedgerRepository: new PairingLedgerRepository(pool, vault, async () => {}),
        readPairingDeviceTrust: trust, validatePairingEnvironment: environment,
        readPreparationMembership: async () => ({ participantId: "fixture-participant", roomStatus: "open" }) as never });
      const body = { requestId: "fixture-issue", registrationId: registered.registrationId, chatId: "fixture-chat",
        environment: null, invitationSeconds: 900, pairingSeconds: 28800 };
      h.resolveSession.mockImplementation(async (...args: unknown[]) => args[0] === SESSION_ID
        ? { session_id: SESSION_ID, profile: { profile_id: PROFILE_ID } } : null as never);
      const modelOnly = await request(h.app).post("/api/account/session/agent-connections/reasoning-invitations")
        .set("Authorization", "Bearer fixture-model-credential").send(body);
      expect(modelOnly.status).toBe(401);
      const issue = (value = body) => request(h.app).post("/api/account/session/agent-connections/reasoning-invitations")
        .set("Cookie", `helix_session=${SESSION_ID}`).send(value);
      const results = await Promise.all([issue(), issue()]);
      expect(results.map(result => result.status)).toEqual([200, 200]);
      expect(results[0].body).toEqual(results[1].body);
      expect(results[0].body).toMatchObject({ ok: true, pairing: { state: "pending", executionAuthority: false } });
      expect(results[0].body.pairing.destinationDigest).toBe(registered.destinationDigest);
      const listed = await request(h.app).get("/api/account/session/agent-connections/reasoning-destinations")
        .set("Cookie", `helix_session=${SESSION_ID}`);
      expect(listed.status).toBe(200);
      expect(listed.body.destinations[0].destinationDigest).toBe(results[0].body.pairing.destinationDigest);
      expect(results[0].headers["cache-control"]).toBe("no-store");
      expect((await issue({ ...body, chatId: "fixture-changed-chat" })).status).toBe(409);
      const rejectedEnvironment = await issue({ ...body, requestId: "fixture-environment",
        environment: { roomId: "fixture-room", runId: "fixture-run" } } as never);
      expect(rejectedEnvironment.status).toBe(409);
      expect(rejectedEnvironment.body.error).toBe("pairing_environment_unavailable");
      expect((await issue({ ...body, origin: "gpt_live" } as never)).status).toBe(400);
      trust.mockResolvedValueOnce({ trusted: false } as never);
      expect((await issue()).status).toBe(403);
      h.resolveSession.mockResolvedValueOnce(null as never);
      expect((await issue()).status).toBe(401);
      const pairingPath = `/api/account/session/agent-connections/reasoning-pairings/${encodeURIComponent(results[0].body.pairing.id)}`;
      const read = () => request(h.app).get(pairingPath).set("Cookie", `helix_session=${SESSION_ID}`);
      const revoke = (value = {}) => request(h.app).post(`${pairingPath}/revoke`)
        .set("Cookie", `helix_session=${SESSION_ID}`).send(value);
      const pending = await read();
      expect(pending.status).toBe(200);
      expect(pending.body.pairing).toEqual(results[0].body.pairing);
      const reconciliationPath = `/api/account/session/agent-connections/reasoning-invitations/${body.requestId}`;
      const reconciliation = await request(h.app).get(reconciliationPath).set("Cookie", `helix_session=${SESSION_ID}`);
      expect(reconciliation.status).toBe(200);
      expect(reconciliation.body.pairing).toEqual(pending.body.pairing);
      expect(JSON.stringify(reconciliation.body)).not.toContain(results[0].body.invitation.secret);
      expect((await request(h.app).get(reconciliationPath)).status).toBe(401);
      h.resolveSession.mockResolvedValueOnce({ session_id: "fixture-foreign-session", profile: { profile_id: "fixture-foreign-owner" } });
      const foreignReconciliation = await request(h.app).get(reconciliationPath).set("Cookie", `helix_session=${SESSION_ID}`);
      expect(foreignReconciliation.body.pairing).toBeNull();
      expect(pending.headers["cache-control"]).toBe("no-store");
      expect(JSON.stringify(pending.body)).not.toContain(results[0].body.invitation.secret);
      expect((await request(h.app).get(pairingPath)).status).toBe(401);
      expect((await request(h.app).post(`${pairingPath}/revoke`)
        .set("Authorization", "Bearer fixture-model-credential").send({})).status).toBe(401);
      expect((await revoke({ profile_id: PROFILE_ID, human_approved: true })).status).toBe(400);
      h.resolveSession.mockResolvedValueOnce({ session_id: "fixture-foreign-session",
        profile: { profile_id: "fixture-foreign-owner" } });
      expect((await read()).status).toBe(404);
      h.resolveSession.mockResolvedValueOnce({ session_id: "fixture-foreign-session",
        profile: { profile_id: "fixture-foreign-owner" } });
      expect((await revoke()).status).toBe(404);
      trust.mockResolvedValue({ trusted: false } as never);
      const revocations = await Promise.all([revoke(), revoke()]);
      expect(revocations.map(result => result.status)).toEqual([200, 200]);
      expect(revocations[0].body).toEqual(revocations[1].body);
      expect(revocations[0].body).toMatchObject({ runtime_binding_active: false,
        pairing: { state: "revoked", revision: 2, executionAuthority: false } });
      expect(revocations[0].body.pairing.pairingExpiresAt).toBe(results[0].body.pairing.pairingExpiresAt);
      expect((await read()).body).toEqual(revocations[0].body);
      expect((await revoke()).body).toEqual(revocations[0].body);
      const rows = (await pool.query("SELECT * FROM helix_pairing_ledger")).rows;
      expect(rows).toHaveLength(1);
      expect(JSON.stringify(rows)).not.toContain(results[0].body.invitation.secret);
    } finally { vi.unstubAllEnvs(); await pool.end(); }
  });
  it("lists encrypted registered destinations while idle using only browser session ownership", async () => {
    const pool = new (newDb().adapters.createPg().Pool)();
    await pool.query("CREATE TABLE helix_accounts(profile_id text PRIMARY KEY)");
    await pool.query("INSERT INTO helix_accounts VALUES ($1), ($2)", [PROFILE_ID, "fixture-foreign-owner"]);
    const client = await pool.connect();
    try { await migration088.run(client, { enablePgvector: false }); await migration089.run(client, { enablePgvector: false }); }
    finally { client.release(); }
    try {
      const store = new PairingDestinationRegistrationStore(pool, async () => {}, () => new Date("2026-09-08T12:00:00Z"), ephemeralPairingVault());
      const destination = { issuer: "fixture-issuer", profileId: PROFILE_ID, installationId: "fixture-install",
        clientId: "fixture-client", taskId: "fixture-owner-task" };
      await store.registerAuthenticated(destination, { requestId: "fixture-own", durationSeconds: 900 });
      await store.registerAuthenticated({ ...destination, profileId: "fixture-foreign-owner", taskId: "fixture-private-other-task" },
        { requestId: "fixture-other", durationSeconds: 900 });
      const h = setup({ presence: [], destinationRegistrationStore: store });
      const result = await request(h.app).get("/api/account/session/agent-connections/reasoning-destinations?profile_id=fixture-foreign-owner");
      expect(result.status).toBe(200);
      expect(result.headers["cache-control"]).toBe("no-store");
      expect(result.body.destinations).toHaveLength(1);
      expect(result.body.destinations[0]).toMatchObject({ destination, currentPresence: false, pairingAuthority: false });
      expect(JSON.stringify(result.body)).not.toContain("fixture-private-other-task");
      h.resolveSession.mockResolvedValueOnce(null as never);
      expect((await request(h.app).get("/api/account/session/agent-connections/reasoning-destinations")).status).toBe(401);
    } finally { await pool.end(); }
  });
  it("routes repeated browser requests through the real mailbox and rejects stale target delivery", async () => {
    const row = presence({ observed_at: new Date().toISOString(),
      heartbeat_expires_at: new Date(Date.now() + 120000).toISOString() });
    const mailbox = new EnvironmentSessionPreparationIntentStore({ serviceInstanceRef: SERVICE_REF,
      listPresence: () => [row] }, async input => {
      if (input.roomId !== "room:owned") throw new Error("room_not_owned");
    });
    const harness = setup({ presence: [row], preparationIntentStore: mailbox });
    const send = (requestId: string) => request(harness.app)
      .post("/api/account/session/agent-connections/environment-session/prepare-request")
      .set("Cookie", `helix_session=${SESSION_ID}`).send({ request_id: requestId,
        client_session_ref: row.client_session_ref, client_continuation_ref: row.conversation_thread_ref,
        helix_conversation_id: "chat:local", room_id: "room:owned", requested_duration_seconds: 28800 });
    const replies = await Promise.all(["window:a", "window:b", "window:c"].map(send));
    expect(replies.map(reply => reply.status)).toEqual([202, 202, 202]);
    expect(new Set(replies.map(reply => reply.body.intent.intentId)).size).toBe(1);
    const target = { profileRef: PROFILE_ID, authenticatedMcpClientRef: "mcp-client-owned",
      clientSessionRef: "client-session-owned", continuationRef: "thread-owned" };
    expect(mailbox.read(target)).toHaveLength(1);
    expect(() => mailbox.read({ ...target, continuationRef: "different-task" })).toThrow();
    row.active = false;
    expect((await send("window:a")).status).toBe(409);
    expect(() => mailbox.read(target)).toThrow("preparation_target_unavailable");
  });
  it("requests pre-binding setup as the browser owner and rejects forged ownership or unlinked access", async () => {
    const enqueue = vi.fn().mockResolvedValue({ intentId: "intent:a", status: "pending",
      origin: "authenticated_browser_setup", execution_authority: false });
    const harness = setup({ preparationIntentStore: { request: enqueue } });
    const body = { request_id: "request:a", client_session_ref: "client-session-owned",
      client_continuation_ref: "thread-owned", helix_conversation_id: "chat:local",
      room_id: "room:owned", requested_duration_seconds: 28800 };
    const send = (app: typeof harness.app, payload: object) => request(app)
      .post("/api/account/session/agent-connections/environment-session/prepare-request")
      .set("Cookie", `helix_session=${SESSION_ID}`).send(payload);
    const result = await send(harness.app, body);
    expect(result.status).toBe(202);
    expect(result.body).toMatchObject({ ready: false, execution_authority: false,
      task_binding_authority: false, intent: { status: "pending" } });
    expect(enqueue).toHaveBeenCalledWith({ requestId: "request:a", profileRef: PROFILE_ID,
      clientSessionRef: "client-session-owned", continuationRef: "thread-owned",
      helixConversationId: "chat:local", roomId: "room:owned", requestedDurationSeconds: 28800 });
    expect((await send(harness.app, { ...body, profileRef: "foreign" })).status).toBe(400);
    const unlinked = setup({ bindings: [], preparationIntentStore: { request: enqueue } });
    expect((await send(unlinked.app, body)).status).toBe(403);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it("prepares as the browser owner without accepting or exposing provider identity", async () => {
    const prepare = vi.fn().mockResolvedValue({ readiness: { ready: false }, repairs: [],
      execution_authority: false, answer_authority: false, terminal_eligible: false });
    const membership = vi.fn().mockResolvedValue({ participantId: "participant-owned", roomStatus: "active" });
    const blockedPreparation = { readiness: { ready: false, valid_until_ms: null,
      checks: [{ layer: "authority", state: "revoked", human_approval_required: true }] },
      selection: { room_id: "room-owned", environment_binding_id: "environment-owned" },
      session_deadlines: { run_expires_at_ms: 1900000000000 }, repairs: [],
      execution_authority: false, answer_authority: false, terminal_eligible: false };
    const automatic = vi.fn().mockResolvedValue(blockedPreparation);
    const harness = setup({ prepareEnvironmentSession: prepare, prepareBrowserSession: automatic, readPreparationMembership: membership,
      presence: [presence({ observed_at: new Date().toISOString(),
        heartbeat_expires_at: new Date(Date.now() + 120_000).toISOString(),
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only", "continuation_ready"], requested_level: "continuation_ready",
          declaration_basis: "authenticated_client_declaration", provider_thread_content_included: false,
          hidden_reasoning_included: false, answer_authority: false, terminal_eligible: false,
        } })] });
    const issued = harness.reasoningStore.issueClaim({ profileRef: PROFILE_ID,
      clientSessionRef: "client-session-owned", helixConversationId: "chat-owned", runId: "run-owned" });
    const bound = harness.reasoningStore.claim({ profileRef: PROFILE_ID,
      authenticatedMcpClientRef: "mcp-client-owned", clientSessionRef: "client-session-owned",
      claimHandle: issued.claim_handle });
    const body = { reasoning_binding_id: bound.reasoning_binding_id, binding_epoch: bound.binding_epoch,
      helix_conversation_id: "chat-owned", mission_id: null, room_id: "room-owned", run_id: "run-owned",
      goal_id: "goal-owned", expected_revision: 4, turn_id: "turn-owned", probe_request_id: "probe-owned",
      prior_turn_id: "prior-owned", environment_binding_id: "environment-owned", source_id: "source-owned",
      world_id: "world-owned", subject_binding_id: "subject-owned", action_authority_id: "authority-owned" };
    const post = (value = body) => request(harness.app)
      .post("/api/account/session/agent-connections/environment-session/ready-up")
      .set("Cookie", `helix_session=${SESSION_ID}`).send(value);
    const response = await post().expect(200);
    expect(response.body).toMatchObject({ requested_by: "authenticated_browser_owner",
      readiness: { ready: false }, execution_authority: false });
    expect(JSON.stringify(response.body)).not.toContain("thread-owned");
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare.mock.calls[0][0]).toMatchObject({
      context: expect.objectContaining({ profileId: PROFILE_ID, participantId: "participant-owned" }),
      binding: expect.objectContaining({ clientContinuationRef: "thread-owned", profileRef: PROFILE_ID }),
    });
    const verifier = prepare.mock.calls[0][1];
    const verifiedTarget = prepare.mock.calls[0][0].binding;
    await expect(verifier.verifyTaskAssociation(verifiedTarget)).resolves.toEqual(
      harness.reasoningStore.verifyTaskAssociation(verifiedTarget));
    await expect(verifier.verifyTaskAssociation({ ...verifiedTarget, clientContinuationRef: "thread:foreign" }))
      .rejects.toThrow("reasoning_binding_task_association_mismatch");
    const goalBootstrap = { environment_binding_id: "environment-owned", subject_binding_id: "subject-owned",
      action_authority_id: "authority-owned", objective: { domain: "minecraft", goal_kind: "custom_survival",
        objective_text: "Cross the platform", game_version: "1.21.8", mechanics_collection_ref: null,
        milestones: [{ milestone_id: "cross", description: "Cross", dependency_milestone_ids: [], required_postcondition_ids: ["arrival"] }] } };
    const automaticBody = { reasoning_binding_id: bound.reasoning_binding_id, binding_epoch: bound.binding_epoch,
      helix_conversation_id: "chat-owned", mission_id: null, run_id: "run-owned", request_id: "ready-up:one",
      goal_bootstrap: goalBootstrap };
    const automaticResponse = await post(automaticBody as typeof body).expect(200);
    expect(automaticResponse.body.requested_by).toBe("authenticated_browser_owner");
    expect(automaticResponse.body).toMatchObject(blockedPreparation);
    expect(automatic.mock.calls[0][0]).toEqual({ sessionId: SESSION_ID, profileRef: PROFILE_ID,
      bindingId: bound.reasoning_binding_id, bindingEpoch: bound.binding_epoch,
      helixConversationId: "chat-owned", missionId: null, runId: "run-owned", requestId: "ready-up:one",
      goalBootstrap });
    await expect(automatic.mock.calls[0][1].verifyTaskAssociation(verifiedTarget)).resolves.toEqual(
      harness.reasoningStore.verifyTaskAssociation(verifiedTarget));
    automatic.mockRejectedValueOnce(new EnvironmentDurableGoalError("durable_goal_session_ambiguous", 409,
      "private backend context must not be returned"));
    const ambiguous = await post(automaticBody as typeof body).expect(409);
    expect(ambiguous.body.error).toBe("durable_goal_session_ambiguous");
    expect(JSON.stringify(ambiguous.body)).not.toContain("private backend");
    const partialError = new EnvironmentSessionPreparationError(new Error("private detail"),
      [{ layer: "subject", changed: true, reason_code: "subject_epoch_checked" }], true);
    automatic.mockRejectedValueOnce(partialError);
    const partial = await post(automaticBody as typeof body).expect(500);
    expect(partial.body).toEqual(partialError.projection);
    await post({ ...body, helix_conversation_id: "other-chat" }).expect(409);
    await post({ ...body, client_continuation_ref: "forged" } as typeof body).expect(400);
    membership.mockResolvedValueOnce(null);
    await post().expect(403);
    harness.listBindings.mockResolvedValueOnce({ schema: "helix.agent_account_bindings.v1", oauth_ready: false, bindings: [] });
    await post().expect(403);
    expect(prepare).toHaveBeenCalledTimes(1);
    harness.reasoningStore.revoke({ profileRef: PROFILE_ID, bindingId: bound.reasoning_binding_id });
    await post().expect(409);
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it("binds only the explicitly selected current run and preserves the claim on stale selection", async () => {
    const association = { run_id: "run-owned", run_version: 2, room_id: "room-owned",
      room_binding_id: "room-binding-owned", room_binding_version: 3, verification_ref: "verified-run-2" };
    // Match the real resolver: its finite deadline must survive the strict
    // readiness projection, not turn a successfully prepared run into HTTP 500.
    const resolveRunAssociation = vi.fn(async () => ({ ...association,
      run_expires_at: "2099-01-01T00:00:00.000Z" }));
    const harness = setup({ resolveRunAssociation });
    const ready = await getReadiness(harness.app).expect(200);
    expect(ready.body.verified_run_association).toEqual({ ...association,
      run_expires_at: "2099-01-01T00:00:00.000Z" });
    const post = (body: Record<string, unknown>) => request(harness.app)
      .post("/api/account/session/agent-connections/reasoning-bindings/claims")
      .set("Cookie", `helix_session=${SESSION_ID}`).send({
        client_session_ref: "client-session-owned", helix_conversation_id: "chat-owned", ...body,
      });
    const issued = await post({ run_id: association.run_id,
      run_verification_ref: association.verification_ref }).expect(201);
    expect(issued.body.binding.run_id).toBe("run-owned");
    for (const body of [
      { run_id: "run-other", run_verification_ref: association.verification_ref },
      { run_id: "run-owned" },
      { run_id: "run-owned", run_verification_ref: "old-version" },
      { run_id: "run-owned", run_verification_ref: association.verification_ref, mission_id: "unverified-mission" },
      { client_session_ref: "other-task", run_id: "run-owned", run_verification_ref: association.verification_ref },
    ]) {
      const rejected = await post(body).expect(409);
      expect(rejected.body.error).toBe("reasoning_binding_run_association_stale");
    }
    expect(harness.reasoningStore.inspectCurrent({ profileRef: PROFILE_ID,
      helixConversationId: "chat-owned" })).toMatchObject({
      reasoning_binding_id: issued.body.binding.reasoning_binding_id, status: "pending_claim",
    });
  });

  it("does not apply its small JSON parser to sibling account routes", async () => {
    const { app } = setup();
    app.post(
      "/api/account/profile-storage/snapshot",
      express.json({ limit: "256kb" }),
      (req, res) => res.status(200).json({ bytes: req.body.payload.length }),
    );

    const payload = "x".repeat(32 * 1024);
    const response = await request(app)
      .post("/api/account/profile-storage/snapshot")
      .send({ payload })
      .expect(200);

    expect(response.body).toEqual({ bytes: payload.length });
  });

  it("requires a signed-in profile and a supported client profile", async () => {
    const { app, listBindings } = setup();
    await request(app)
      .get("/api/account/session/agent-connections/readiness?client_profile=codex_app")
      .expect(401);
    await getReadiness(app, "unknown-client").expect(400);
    expect(listBindings).not.toHaveBeenCalled();
  });

  it("projects exact authenticated presence without claiming client-kind verification", async () => {
    const { app } = setup();
    const response = await getReadiness(app).expect(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toMatchObject({
      selected_client_profile: "codex_app",
      selected_profile_is_preference_only: true,
      client_kind_verified: false,
      authenticated_profile_ref: PROFILE_ID,
      service_instance_ref: SERVICE_REF,
      oauth_binding_ref: "binding-owned",
      authenticated_mcp_client_ref: "mcp-client-owned",
      client_session_ref: "client-session-owned",
      conversation_thread_ref: "thread-owned",
      proof_basis: "authenticated_presence_tool",
      authorization_changed_after_presence: false,
      catalog_reenumeration_required: false,
      catalog_recovery: "none",
      credential_included: false,
      oauth_subject_included: false,
      hidden_reasoning_included: false,
      environment_authority: false,
      mutation_authority: false,
      answer_authority: false,
      terminal_eligible: false,
      readiness: {
        client_authorization: "active",
        client_presence: "online",
        catalog_sync: "current",
        thread_attachment: "attached",
        continuation_readiness: "unavailable",
      },
    });
    const serialized = JSON.stringify(response.body).toLowerCase();
    expect(serialized).not.toContain("bearer");
    expect(serialized).not.toContain("objective");
  });

  it("requires reconnect and catalog re-enumeration after authorization changes", async () => {
    const upgradedBinding = {
      ...binding,
      updated_at: "2026-08-31T12:00:30.000Z",
    };
    const { app } = setup({
      bindings: [upgradedBinding],
      presence: [presence({ observed_at: "2026-08-31T12:00:00.000Z" })],
    });
    const response = await getReadiness(app).expect(200);
    expect(response.body).toMatchObject({
      proof_basis: "authenticated_presence_tool",
      authorization_changed_after_presence: true,
      catalog_reenumeration_required: true,
      catalog_recovery: "reconnect_and_refresh",
      readiness: {
        catalog_sync: "stale",
        thread_attachment: "stale",
        recovery_action: "refresh_tools",
      },
    });
  });

  it("projects optional checkpoint negotiation without claiming activity completeness", async () => {
    const { app } = setup({
      presence: [presence({
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only", "checkpoint_publish"],
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
      })],
    });
    const response = await getReadiness(app).expect(200);
    expect(response.body.thread_observability_bridge).toEqual({
      negotiated_level: "checkpoint_publish",
      declaration_basis: "authenticated_client_declaration",
      checkpoint_publication_status: "negotiated_no_checkpoint_observed",
      checkpoint_freshness_window_seconds: 120,
      checkpoint_retention: "current_session",
      checkpoint_revocation: "independent",
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      activity_completeness_claimed: false,
    });
    expect(response.body.readiness.continuation_readiness).toBe("monitor_only");
  });

  it("projects polling only for a task that explicitly declares continuation readiness", async () => {
    const { app } = setup({
      presence: [presence({
        thread_observability_bridge: {
          supported_levels: [
            "tool_activity_only",
            "checkpoint_publish",
            "continuation_ready",
          ],
          requested_level: "continuation_ready",
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
      })],
    });
    const response = await getReadiness(app).expect(200);
    expect(response.body.readiness.continuation_readiness).toBe("polling");
  });

  it("filters another profile, another node, stale, and unauthenticated presence", async () => {
    const candidates = [
      presence({ authenticated_profile_ref: "profile-other" }),
      presence({ service_instance_ref: "service-old" }),
      presence({ active: false }),
      presence({ authenticated_mcp_client_ref: null }),
    ];
    const { app } = setup({ presence: candidates });
    const response = await getReadiness(app, "standard_mcp").expect(200);
    expect(response.body).toMatchObject({
      selected_client_profile: "standard_mcp",
      proof_basis: "none",
      authenticated_mcp_client_ref: null,
      client_session_ref: null,
      conversation_thread_ref: null,
      readiness: {
        client_authorization: "active",
        client_presence: "offline",
        catalog_sync: "stale",
      },
    });
  });

  it("fails closed after authorization is revoked even if presence remains", async () => {
    const revoked = { ...binding, status: "revoked" as const, revoked_at: "2026-08-31T12:02:00.000Z" };
    const { app } = setup({ bindings: [revoked], presence: [presence()] });
    const response = await getReadiness(app).expect(200);
    expect(response.body.oauth_binding_ref).toBeNull();
    expect(response.body.proof_basis).toBe("none");
    expect(response.body.readiness.client_authorization).toBe("missing");
    expect(response.body.readiness.client_presence).toBe("offline");
  });

  it("sanitizes unexpected backend failures", async () => {
    const harness = setup();
    harness.listBindings.mockRejectedValueOnce(new Error("Bearer secret-subject"));
    const response = await getReadiness(harness.app).expect(500);
    expect(response.body).toEqual({
      schema: "helix.agent_connection_error.v1",
      ok: false,
      error: "internal_error",
      message: "AI app connection readiness is temporarily unavailable.",
      credential_included: false,
      oauth_subject_included: false,
      raw_claims_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("secret-subject");
  });

  it("issues a show-once exact-task claim and dispatches typed and GPT Live steering through one route", async () => {
    const harness = setup({
      presence: [presence({
        thread_observability_bridge: {
          supported_levels: ["tool_activity_only", "checkpoint_publish", "continuation_ready"],
          requested_level: "continuation_ready",
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
      })],
    });
    const claim = await request(harness.app)
      .post("/api/account/session/agent-connections/reasoning-bindings/claims")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .send({
        client_session_ref: "client-session-owned",
        helix_conversation_id: "helix-chat-owned",
      })
      .expect(201);
    expect(claim.headers["cache-control"]).toBe("no-store");
    expect(claim.body.binding).toMatchObject({
      status: "pending_claim",
      continuation_transport: "polling",
      hidden_reasoning_included: false,
    });
    expect(claim.body.claim_handle).toMatch(/^reasoning_claim:/);
    const binding = harness.reasoningStore.claim({
      profileRef: PROFILE_ID,
      authenticatedMcpClientRef: "mcp-client-owned",
      clientSessionRef: "client-session-owned",
      claimHandle: claim.body.claim_handle,
    });
    const current = await request(harness.app)
      .get("/api/account/session/agent-connections/reasoning-bindings/current")
      .query({ helix_conversation_id: "helix-chat-owned" })
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(200);
    expect(current.body.binding).toMatchObject({
      reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch,
      status: "active",
      answer_authority: false,
      terminal_eligible: false,
    });
    const latest = await request(harness.app)
      .get("/api/account/session/agent-connections/reasoning-bindings/current")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(200);
    expect(latest.body.binding).toMatchObject({
      reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch,
      helix_conversation_id: "helix-chat-owned",
      status: "active",
      answer_authority: false,
      terminal_eligible: false,
    });
    const exactTarget = { reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch, run_id: binding.run_id ?? null };
    for (const chat of [undefined, "", "   "]) {
      await request(harness.app)
        .post("/api/account/session/agent-connections/reasoning-bindings/steering/current")
        .set("Cookie", `helix_session=${SESSION_ID}`)
        .send({ ...exactTarget, helix_conversation_id: chat, client_event_ref: "ambiguous-event",
          origin: "typed", instruction_text: "Do not pick a chat for this request" })
        .expect(400);
    }
    for (const changed of [{ binding_epoch: binding.binding_epoch + 1 },
      { reasoning_binding_id: "binding:replaced" }, { run_id: "run:other" }]) {
      await request(harness.app)
        .post("/api/account/session/agent-connections/reasoning-bindings/steering/current")
        .set("Cookie", `helix_session=${SESSION_ID}`)
        .send({ ...exactTarget, ...changed, helix_conversation_id: "helix-chat-owned",
          client_event_ref: "stale-target-event", origin: "typed", instruction_text: "Do not retarget" })
        .expect(409);
    }
    const currentDispatch = await request(harness.app)
      .post("/api/account/session/agent-connections/reasoning-bindings/steering/current")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .send({
        helix_conversation_id: "helix-chat-owned",
        client_event_ref: "current-event",
        ...exactTarget,
        origin: "typed",
        instruction_text: "Private current-binding steering text",
      })
      .expect(202);
    expect(currentDispatch.body.binding).toMatchObject({
      reasoning_binding_id: binding.reasoning_binding_id,
      binding_epoch: binding.binding_epoch,
      status: "active",
    });
    expect(currentDispatch.body.event).toMatchObject({
      origin: "typed",
      delivery_state: "pending",
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(JSON.stringify(currentDispatch.body)).not.toContain("Private current-binding");
    const displayPath = `/api/account/session/agent-connections/reasoning-bindings/${encodeURIComponent(binding.reasoning_binding_id)}/chat-prompts`;
    const displayQuery = { binding_epoch: binding.binding_epoch, helix_conversation_id: "helix-chat-owned",
      ...(binding.run_id ? { run_id: binding.run_id } : {}) };
    const display = await request(harness.app).get(displayPath).query(displayQuery)
      .set("Cookie", `helix_session=${SESSION_ID}`).expect(200);
    expect(display.body).toMatchObject({ display_only: true, provider_pickup_confirmed: false, answer_authority: false });
    expect(display.body.deliveries).toEqual(expect.arrayContaining([expect.objectContaining({
      instruction_text: "Private current-binding steering text",
      event: expect.objectContaining({ delivery_state: "pending" }),
    })]));
    await request(harness.app).get(displayPath).query({ ...displayQuery, helix_conversation_id: "foreign-chat" })
      .set("Cookie", `helix_session=${SESSION_ID}`).expect(409);
    harness.resolveSession.mockResolvedValueOnce(null as never);
    await request(harness.app).get(displayPath).query(displayQuery).expect(401);
    await request(harness.app)
      .post("/api/account/session/agent-connections/reasoning-bindings/steering/current")
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .send({
        helix_conversation_id: "helix-chat-other",
        client_event_ref: "wrong-chat-event",
        ...exactTarget,
        origin: "typed",
        instruction_text: "Must not fall back to the latest binding",
      })
      .expect(404);
    for (const [origin, ref] of [["typed", "typed-event"], ["gpt_live_finalized", "voice-event"]] as const) {
      const dispatched = await request(harness.app)
        .post("/api/account/session/agent-connections/reasoning-bindings/steering")
        .set("Cookie", `helix_session=${SESSION_ID}`)
        .send({
          reasoning_binding_id: binding.reasoning_binding_id,
          binding_epoch: binding.binding_epoch,
          client_event_ref: ref,
          origin,
          instruction_text: `Private ${origin} steering text`,
        })
        .expect(202);
      expect(dispatched.body.event).toMatchObject({ origin, delivery_state: "pending" });
      expect(JSON.stringify(dispatched.body)).not.toContain(`Private ${origin}`);
    }
    const deliveries = harness.reasoningStore.read({
      profileRef: PROFILE_ID,
      clientSessionRef: "client-session-owned",
      bindingId: binding.reasoning_binding_id,
      bindingEpoch: binding.binding_epoch,
    });
    expect(deliveries.map((entry) => entry.event.origin)).toEqual([
      "typed",
      "typed",
      "gpt_live_finalized",
    ]);
    harness.reasoningStore.acknowledge({
      profileRef: PROFILE_ID,
      clientSessionRef: "client-session-owned",
      bindingId: binding.reasoning_binding_id,
      bindingEpoch: binding.binding_epoch,
      eventRef: deliveries[0].event.steering_event_ref,
    });
    const inspected = await request(harness.app)
      .get(
        `/api/account/session/agent-connections/reasoning-bindings/${encodeURIComponent(binding.reasoning_binding_id)}` +
          `/steering/${encodeURIComponent(deliveries[0].event.steering_event_ref)}`,
      )
      .query({ binding_epoch: binding.binding_epoch })
      .set("Cookie", `helix_session=${SESSION_ID}`)
      .expect(200);
    expect(inspected.body.event).toMatchObject({
      delivery_state: "acknowledged",
      provider_thread_content_included: false,
      hidden_reasoning_included: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(JSON.stringify(inspected.body)).not.toContain("Private typed steering text");
  });
});
