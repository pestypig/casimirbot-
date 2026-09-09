import { afterEach, expect, it, vi } from "vitest";
import { newDb } from "pg-mem";
import { migration087 } from "../../../db/migrations/087_pairing_ledger";
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
  try { await migration087.run(client, { enablePgvector: false }); } finally { client.release(); }
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
  const access = new DurableReasoningBindingAccess(store, authorize, async () => repository, () => now);
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
  expect(read).toHaveBeenCalledTimes(5);
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
  await expect(h.access.read(h.identity)).rejects.toThrow("fixture-disk-unavailable");
  await expect(h.access.read({ ...h.identity, profileRef: "fixture-other-owner" })).rejects.toThrow("reasoning_binding_identity_mismatch");
  await expect(h.access.restore({ destination: { ...actor, taskId: "fixture-other-task" },
    clientSessionRef: "fixture-session", pairingId: h.accepted.id })).rejects.toThrow("pairing_destination_mismatch");
  expect(await h.access.inspect(h.identity)).toEqual(h.binding);
  h.authorize.mockRejectedValueOnce(new Error("fixture-trust-revoked"));
  await expect(h.access.read(h.identity)).rejects.toThrow("fixture-trust-revoked");
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
