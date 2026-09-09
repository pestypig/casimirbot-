// @vitest-environment jsdom
import React from "react";
import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import { newDb } from "pg-mem";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import DurableTaskPairing from "../../../client/src/components/agent-access/DurableTaskPairing";
import { createAgentConnectionsRouter } from "../agent-connections";
import { migration087 } from "../../db/migrations/087_pairing_ledger";
import { migration088 } from "../../db/migrations/088_pairing_destinations";
import { migration089 } from "../../db/migrations/089_pairing_destination_identity";
import { PairingDestinationRegistrationStore } from "../../services/local-supervisor/pairing-destination-registration";
import { PairingLedgerRepository } from "../../services/local-supervisor/pairing-ledger-repository";
import { PairingTransitionService } from "../../services/local-supervisor/pairing-transition-service";
import { DurableReasoningBindingAccess } from "../../services/local-supervisor/durable-reasoning-binding-access";
import { HelixReasoningTaskBindingStore } from "../../services/local-supervisor/reasoning-task-binding-store";
import { ephemeralPairingVault } from "../../services/local-supervisor/__tests__/pairing-vault-fixture";

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each([false, true])("O5 real rendered lifecycle with lost issuance response = %s", async lostResponse => {
  // Only identity/trust and the encryption key are fixture ports. No production
  // identity, cookie, native broker or remote service is used by this test.
  const profileId = "fixture-rendered-owner";
  const chatId = "fixture-rendered-chat";
  const issuer = "https://fixture.invalid";
  const opaque = (prefix: string, value: string) => `${prefix}:${crypto.createHash("sha256").update(value).digest("hex")}`;
  const destination = { issuer: opaque("issuer", issuer), profileId, installationId: opaque("installation", "fixture-device"),
    clientId: "fixture-client", taskId: "fixture-task" };
  vi.stubEnv("HELIX_DESKTOP_DEVICE_ID", "fixture-device");
  const pool = new (newDb().adapters.createPg().Pool)();
  await pool.query("CREATE TABLE helix_accounts(profile_id text PRIMARY KEY)");
  await pool.query("INSERT INTO helix_accounts VALUES ($1)", [profileId]);
  const db = await pool.connect();
  try { for (const migration of [migration087, migration088, migration089]) await migration.run(db, { enablePgvector: false }); }
  finally { db.release(); }
  try {
    const vault = ephemeralPairingVault();
    const flush = vi.fn(async () => {});
    const registrations = new PairingDestinationRegistrationStore(pool, flush, () => new Date(), vault);
    await registrations.registerAuthenticated(destination, { requestId: "fixture-register", durationSeconds: 900 });
    const repository = new PairingLedgerRepository(pool, vault, flush);
    const transitions = new PairingTransitionService(repository, {
      destination: async (credential: string) => {
        if (credential !== "fixture-provider") throw new Error("fixture_provider_denied");
        return destination;
      },
      humanOwner: async () => profileId,
    });
    const makeRuntime = (serviceInstanceRef: string) => {
      const coordinationStore = { serviceInstanceRef, listPresence: () => [] };
      const store = new HelixReasoningTaskBindingStore(coordinationStore);
      const app = express();
      app.use("/api/account", createAgentConnectionsRouter({
        coordinationStore, reasoningBindingStore: store, preparationBindingStore: store,
        pairingLedgerRepository: repository, destinationRegistrationStore: registrations,
        readPairingDeviceTrust: async () => ({ trusted: true }) as never,
        bindingStore: { listBindings: async () => ({ bindings: [{ issuer, status: "active" }] }) } as never,
        resolveSession: async id => id === "fixture-browser-session"
          ? { session_id: id, profile: { profile_id: profileId } } as never : null,
      }));
      return { app, access: new DurableReasoningBindingAccess(store, async actor => {
        expect(actor).toEqual(destination);
      }, async () => repository) };
    };
    let runtime = makeRuntime("fixture-service-before");
    const mutations: Array<{ url: string; body: unknown }> = [];
    let committedInvitation: { id: string; secret: string } | undefined;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      const agent = init.method === "POST" ? request(runtime.app).post(url) : request(runtime.app).get(url);
      if (init.method === "POST") mutations.push({ url, body: JSON.parse(init.body as string) });
      agent.set("Cookie", "helix_session=fixture-browser-session");
      if (init.body) agent.send(JSON.parse(init.body as string));
      const result = await agent;
      if (lostResponse && url.endsWith("/reasoning-invitations") && result.status === 200 && !committedInvitation) {
        // The server really committed. Simulate only the loss of its response;
        // this fixture value is never a production invitation or host delivery.
        committedInvitation = result.body.invitation;
        throw new Error("fixture_response_lost_after_commit");
      }
      return new Response(JSON.stringify(result.body), { status: result.status });
    }));
    const onRuntimeBinding = vi.fn();
    let view = render(React.createElement(DurableTaskPairing, { profileId, chatId, onRuntimeBinding }));
    await screen.findByRole("option", { name: "fixture-task · fixture-client" });
    const options = screen.getByLabelText("Registered AI task") as HTMLSelectElement;
    fireEvent.change(options, { target: { value: options.options[1].value } });
    fireEvent.click(screen.getByLabelText(/I approve pairing/));
    fireEvent.click(screen.getByRole("button", { name: "Approve pairing and create invitation" }));
    let invitation: { id: string; secret: string };
    if (lostResponse) {
      await screen.findByRole("alert");
      invitation = committedInvitation!;
      view.unmount();
      view = render(React.createElement(DurableTaskPairing, { profileId, chatId, onRuntimeBinding }));
      await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Pairing: pending"));
      expect(screen.queryByLabelText("Pairing invitation")).toBeNull();
    } else {
      const field = await screen.findByLabelText("Pairing invitation") as HTMLInputElement;
      invitation = JSON.parse(field.value);
    }
    expect(mutations).toHaveLength(1);
    expect((await pool.query("SELECT count(*) AS count FROM helix_pairing_ledger")).rows[0].count).toBe(1);
    await expect(transitions.accept("fixture-wrong-provider", invitation)).rejects.toThrow("fixture_provider_denied");
    const accepted = await transitions.accept("fixture-provider", invitation);
    expect(await transitions.accept("fixture-provider", invitation)).toEqual(accepted);
    // Actual provider MCP handlers are covered separately. This joined case
    // enters through the real transition service with a fixture authenticator.
    const firstBinding = await runtime.access.restore({ destination, clientSessionRef: "fixture-session-before", pairingId: invitation.id });
    fireEvent.click(screen.getByRole("button", { name: "Check acceptance" }));
    await waitFor(() => expect(onRuntimeBinding).toHaveBeenCalledWith(expect.objectContaining({ pairing_id: invitation.id }), invitation.id));
    expect(screen.queryByLabelText("Pairing invitation")).toBeNull();
    expect(mutations).toHaveLength(1);
    view.unmount();
    runtime = makeRuntime("fixture-service-after");
    await transitions.recover("fixture-provider", invitation.id);
    const recovered = await runtime.access.restore({ destination, clientSessionRef: "fixture-session-after", pairingId: invitation.id });
    expect(recovered.reasoning_binding_id).not.toBe(firstBinding.reasoning_binding_id);
    expect(recovered.expires_at).toBe(firstBinding.expires_at);
    onRuntimeBinding.mockClear();
    view = render(React.createElement(DurableTaskPairing, { profileId, chatId, onRuntimeBinding }));
    await waitFor(() => expect(onRuntimeBinding).toHaveBeenCalledWith(expect.objectContaining({ reasoning_binding_id: recovered.reasoning_binding_id }), invitation.id));
    expect(mutations).toHaveLength(1);
    const promptBody = { reasoning_binding_id: recovered.reasoning_binding_id, binding_epoch: recovered.binding_epoch,
      client_event_ref: "fixture-prompt-once", origin: "typed", instruction_text: "Describe the observed surroundings." };
    const submitPrompt = () => request(runtime.app).post("/api/account/session/agent-connections/reasoning-bindings/steering")
      .set("Cookie", "helix_session=fixture-browser-session").send(promptBody);
    const prompt = await submitPrompt();
    expect(prompt.status).toBe(202);
    expect((await submitPrompt()).body).toEqual(prompt.body);
    const pickup = { profileRef: profileId, clientSessionRef: "fixture-session-after",
      bindingId: recovered.reasoning_binding_id, bindingEpoch: recovered.binding_epoch };
    const deliveries = await runtime.access.read(pickup);
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].instruction_text).toBe(promptBody.instruction_text);
    expect(deliveries[0].event.origin).toBe("typed");
    const acknowledgement = await runtime.access.acknowledge({ ...pickup, eventRef: prompt.body.event.steering_event_ref });
    expect(acknowledgement.delivery_state).toBe("acknowledged");
    expect(await runtime.access.acknowledge({ ...pickup, eventRef: prompt.body.event.steering_event_ref })).toEqual(acknowledgement);
    fireEvent.click(screen.getByRole("button", { name: "Revoke pairing" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Pairing: revoked"));
    expect(onRuntimeBinding).toHaveBeenCalledWith(null, invitation.id);
    expect(mutations).toHaveLength(2);
    await expect(transitions.recover("fixture-provider", invitation.id)).rejects.toThrow("pairing_revoked");
    expect((await submitPrompt()).status).toBe(409);
    await expect(runtime.access.read(pickup)).rejects.toThrow("pairing_revoked");
    expect((await repository.read(profileId, invitation.id))?.revision).toBe(3);
    expect(flush).toHaveBeenCalled();
    view.unmount();
  } finally { cleanup(); await pool.end(); }
}, 30_000);
