import { afterEach, expect, it, vi } from "vitest";
import { newDb } from "pg-mem";
import { migration087 } from "../../../db/migrations/087_pairing_ledger";
import { migration090 } from "../../../db/migrations/090_durable_steering";
import { DurableSteeringRepository } from "../durable-steering-repository";
import { PairingLedgerRepository } from "../pairing-ledger-repository";
import { ephemeralPairingVault } from "./pairing-vault-fixture";
import { createPairingLedgerRow, acceptPairingLedgerRow, pairingApprovalSchema, revokePairingLedgerRow } from "../pairing-ledger-contract";
import { HelixReasoningTaskBindingStore } from "../reasoning-task-binding-store";
import { DurableReasoningBindingAccess } from "../durable-reasoning-binding-access";

const pools: Array<{ end(): Promise<void> }> = [];
afterEach(async () => { await Promise.all(pools.splice(0).map(pool => pool.end())); });
const actor = { issuer: "fixture-issuer", profileId: "fixture-owner", installationId: "fixture-device",
  clientId: "fixture-client", taskId: "fixture-task" };

async function fixture() {
  const pool = new (newDb().adapters.createPg().Pool)(); pools.push(pool);
  await pool.query("CREATE TABLE helix_accounts(profile_id text PRIMARY KEY)");
  await pool.query("INSERT INTO helix_accounts VALUES ('fixture-owner')");
  const client = await pool.connect();
  try { await migration087.run(client, { enablePgvector: false }); await migration090.run(client, { enablePgvector: false }); } finally { client.release(); }
  const now = new Date("2026-09-08T12:00:00Z");
  const flush = vi.fn(async () => {});
  const repository = new PairingLedgerRepository(pool, ephemeralPairingVault(), flush);
  const row = createPairingLedgerRow({ id: "fixture-grant", consentReceiptId: "fixture-human-consent",
    requestDigest: "a".repeat(64), acceptanceSecretDigest: "b".repeat(64),
    approval: pairingApprovalSchema.parse({ destination: actor, chatId: "fixture-chat", environment: null,
      scope: "exact_chat_steering", policyRevision: 1 }) }, now);
  await repository.insert(row);
  const accepted = acceptPairingLedgerRow(row, actor, now);
  await repository.compareAndSwap(accepted, row.revision);
  const store = new HelixReasoningTaskBindingStore({ serviceInstanceRef: "fixture-service", listPresence: () => [] }, () => now);
  const authorize = vi.fn(async () => {});
  const steering = new DurableSteeringRepository(pool, ephemeralPairingVault(), flush);
  const access = new DurableReasoningBindingAccess(store, authorize, async () => repository, () => now, async () => steering);
  const binding = await access.restore({ destination: actor, clientSessionRef: "fixture-session", pairingId: row.id });
  const identity = { profileRef: actor.profileId, bindingId: binding.reasoning_binding_id,
    bindingEpoch: binding.binding_epoch, clientSessionRef: "fixture-session" };
  return { repository, store, access, binding, identity, accepted, flush, now, authorize };
}

it("rechecks the encrypted grant for dispatch, pickup, acknowledgement and browser display", async () => {
  const h = await fixture();
  const read = vi.spyOn(h.repository, "read");
  const request = { ...h.identity, clientEventRef: "fixture-event", origin: "typed" as const, instructionText: "Inspect the surroundings." };
  const event = await h.access.dispatch(request);
  expect(await h.access.dispatch(request)).toEqual(event);
  expect(await h.access.read(h.identity)).toHaveLength(1);
  expect(await h.access.acknowledge({ ...h.identity, eventRef: event.steering_event_ref }))
    .toMatchObject({ delivery_state: "acknowledged" });
  expect(await h.access.readForChatDisplay({ ...h.identity, helixConversationId: "fixture-chat", runId: null }))
    .toHaveLength(1);
  expect(read.mock.calls.length).toBeGreaterThanOrEqual(5); // Includes post-commit admission checks.
  expect(() => h.store.read(h.identity)).toThrow("reasoning_binding_durable_preflight_required");
  const revoked = revokePairingLedgerRow(h.accepted, actor.profileId, h.now);
  await h.repository.compareAndSwap(revoked, h.accepted.revision);
  for (const operation of [() => h.access.dispatch(request), () => h.access.read(h.identity),
    () => h.access.acknowledge({ ...h.identity, eventRef: event.steering_event_ref }),
    () => h.access.inspect(h.identity), () => h.access.inspectEvent({ ...h.identity, eventRef: event.steering_event_ref }),
    () => h.access.readForChatDisplay({ ...h.identity, helixConversationId: "fixture-chat", runId: null })]) {
    await expect(operation()).rejects.toThrow("pairing_revoked");
  }
});

it("rejects storage failure, foreign owner and wrong task without cached authority", async () => {
  const h = await fixture();
  h.flush.mockRejectedValueOnce(new Error("fixture-disk-unavailable"));
  await expect(h.access.read(h.identity)).rejects.toMatchObject({ code: "reasoning_binding_verification_failed", phase: "durability" });
  await expect(h.access.read({ ...h.identity, profileRef: "fixture-other-owner" })).rejects.toThrow("reasoning_binding_identity_mismatch");
  await expect(h.access.restore({ destination: { ...actor, taskId: "fixture-other-task" },
    clientSessionRef: "fixture-session", pairingId: h.accepted.id })).rejects.toThrow("pairing_destination_mismatch");
  expect(await h.access.inspect(h.identity)).toEqual(h.binding);
  h.authorize.mockRejectedValueOnce(new Error("fixture-trust-revoked"));
  await expect(h.access.read(h.identity)).rejects.toMatchObject({ code: "reasoning_binding_verification_failed", phase: "destination" });
});

it("preserves typed conflicts, missing events and expiry on durable steering", async () => {
  const h = await fixture();
  const request = { ...h.identity, clientEventRef: "fixture-typed-error", origin: "typed" as const,
    instructionText: "Inspect the surroundings.", expiresInSeconds: 30 };
  const event = await h.access.dispatch(request);
  await expect(h.access.dispatch({ ...request, instructionText: "Inspect the inventory." }))
    .rejects.toMatchObject({ code: "reasoning_steering_request_conflict", status: 409 });
  await expect(h.access.inspectEvent({ ...h.identity, eventRef: "reasoning_steering:missing" }))
    .rejects.toMatchObject({ code: "reasoning_steering_not_found", status: 404 });
  await expect(h.access.acknowledge({ ...h.identity, eventRef: "reasoning_steering:missing" }))
    .rejects.toMatchObject({ code: "reasoning_steering_not_found", status: 404 });
  h.now.setTime(h.now.getTime() + 30_000);
  await expect(h.access.acknowledge({ ...h.identity, eventRef: event.steering_event_ref }))
    .rejects.toMatchObject({ code: "reasoning_steering_expired", status: 409 });
  expect(await h.access.dispatch(request)).toMatchObject({ steering_event_ref: event.steering_event_ref,
    expires_at: event.expires_at, delivery_state: "expired" });
});

it("rejects superseded cached bindings before dispatch, pickup, acknowledgement or restoration", async () => {
  const h = await fixture();
  const request = { ...h.identity, clientEventRef: "fixture-before-supersession", origin: "typed" as const,
    instructionText: "Inspect the surroundings." };
  const event = await h.access.dispatch(request);
  // Admission-layer test of a persisted terminal record. Atomic creation of the
  // two-record relation is covered by the encrypted transition-service suite.
  await h.repository.compareAndSwap({ ...h.accepted, revision: 3,
    supersession: { pairingId: "fixture-successor", at: h.now.toISOString() } }, 2);
  const dispatch = vi.spyOn(h.store, "dispatch");
  const pickup = vi.spyOn(h.store, "read");
  const acknowledge = vi.spyOn(h.store, "acknowledge");
  for (const operation of [
    () => h.access.dispatch({ ...request, clientEventRef: "fixture-after-supersession" }),
    () => h.access.read(h.identity),
    () => h.access.acknowledge({ ...h.identity, eventRef: event.steering_event_ref }),
    () => h.access.inspect(h.identity),
    () => h.access.restore({ destination: actor, clientSessionRef: "fixture-session", pairingId: h.accepted.id }),
  ]) {
    await expect(operation()).rejects.toMatchObject({ code: "pairing_superseded", status: 409 });
  }
  expect(dispatch).not.toHaveBeenCalled();
  expect(pickup).not.toHaveBeenCalled();
  expect(acknowledge).not.toHaveBeenCalled();
});

it("persists owner revocation despite lost device trust and reconciles a lost commit reply", async () => {
  const h = await fixture();
  h.authorize.mockRejectedValue(new Error("fixture-trust-revoked"));
  await expect(h.access.revokeOwned(h.identity, async () => "fixture-other-owner")).rejects.toThrow("pairing_owner_mismatch");
  h.flush.mockRejectedValueOnce(new Error("fixture-lost-commit-reply"));
  await expect(h.access.revokeOwned(h.identity, async () => actor.profileId)).rejects.toThrow("fixture-lost-commit-reply");
  const revoked = await h.access.revokeOwned(h.identity, async () => actor.profileId);
  expect(revoked).toMatchObject({ status: "revoked", revoked_at: h.now.toISOString() });
  expect(await h.access.revokeOwned(h.identity, async () => actor.profileId)).toEqual(revoked);
  expect((await h.repository.read(actor.profileId, h.accepted.id))?.revision).toBe(3);
  h.authorize.mockResolvedValue(undefined);
  await expect(h.access.restore({ destination: actor, clientSessionRef: "fixture-session", pairingId: h.accepted.id }))
    .rejects.toThrow("pairing_revoked");
});

it("initializes one repository handle while every admission still flushes and reads the current grant", async () => {
  const h = await fixture();
  h.flush.mockClear(); h.authorize.mockClear();
  // Production initialization has its own durability barrier in addition to
  // the mandatory fresh barrier before each grant read.
  const initialize = vi.fn(async () => { await h.flush(); return h.repository; });
  const read = vi.spyOn(h.repository, "read");
  const access = new DurableReasoningBindingAccess(h.store, h.authorize, initialize, () => h.now);
  for (let index = 0; index < 3; index++) {
    expect(await access.inspect(h.identity)).toEqual(h.binding);
  }
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(h.authorize).toHaveBeenCalledTimes(3);
  expect(read).toHaveBeenCalledTimes(3);
  expect(h.flush).toHaveBeenCalledTimes(4);

  h.flush.mockRejectedValueOnce(new Error("fixture-durability-lost-after-initialization"));
  await expect(access.inspect(h.identity)).rejects.toMatchObject({ code: "reasoning_binding_verification_failed", phase: "durability" });
  expect(read).toHaveBeenCalledTimes(3);
  h.authorize.mockRejectedValueOnce(new Error("fixture-trust-revoked-after-initialization"));
  await expect(access.inspect(h.identity)).rejects.toMatchObject({ code: "reasoning_binding_verification_failed", phase: "destination" });
  expect(read).toHaveBeenCalledTimes(3);
  const revoked = revokePairingLedgerRow(h.accepted, actor.profileId, h.now);
  await h.repository.compareAndSwap(revoked, h.accepted.revision);
  await expect(access.inspect(h.identity)).rejects.toThrow("pairing_revoked");
  expect(read).toHaveBeenCalledTimes(4);
  expect(initialize).toHaveBeenCalledTimes(1);
});

it("shares initialization only within one access instance and retries a failed initialization only on a later call", async () => {
  const h = await fixture();
  const initialize = vi.fn(async () => h.repository)
    .mockRejectedValueOnce(new Error("fixture-initialization-unavailable"));
  const access = new DurableReasoningBindingAccess(h.store, h.authorize, initialize, () => h.now);
  const failed = await Promise.allSettled([access.inspect(h.identity), access.inspect(h.identity)]);
  expect(failed.map(result => result.status)).toEqual(["rejected", "rejected"]);
  for (const result of failed) {
    if (result.status === "rejected") expect(result.reason).toMatchObject({
      code: "reasoning_binding_verification_failed", phase: "repository", reason: "unexpected_failure",
    });
  }
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(await access.inspect(h.identity)).toEqual(h.binding);
  expect(await access.inspect(h.identity)).toEqual(h.binding);
  expect(initialize).toHaveBeenCalledTimes(2);
  const nextAccess = new DurableReasoningBindingAccess(h.store, h.authorize, initialize, () => h.now);
  expect(await nextAccess.inspect(h.identity)).toEqual(h.binding);
  expect(initialize).toHaveBeenCalledTimes(3);
});

it("rechecks the finite pairing deadline after repository initialization", async () => {
  const h = await fixture();
  const initialize = vi.fn(async () => h.repository);
  const read = vi.spyOn(h.repository, "read");
  const access = new DurableReasoningBindingAccess(h.store, h.authorize, initialize, () => h.now);
  expect(await access.inspect(h.identity)).toEqual(h.binding);
  h.now.setTime(Date.parse(h.accepted.pairingExpiresAt));
  await expect(access.inspect(h.identity)).rejects.toThrow("pairing_expired");
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(read).toHaveBeenCalledTimes(2);
});
