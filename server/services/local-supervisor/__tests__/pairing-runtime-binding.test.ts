import { describe, expect, it, vi } from "vitest";
import { HelixReasoningTaskBindingStore } from "../reasoning-task-binding-store";
import { acceptPairingLedgerRow, createPairingLedgerRow, pairingApprovalSchema, revokePairingLedgerRow } from "../pairing-ledger-contract";

const destination = { issuer: "fixture-issuer", profileId: "fixture-owner", installationId: "fixture-device",
  clientId: "fixture-client", taskId: "fixture-task" };
const start = new Date("2026-09-08T12:00:00Z");
function fixture() {
  let now = start;
  let row = acceptPairingLedgerRow(createPairingLedgerRow({ id: "fixture-pairing", requestDigest: "a".repeat(64),
    acceptanceSecretDigest: "b".repeat(64), consentReceiptId: "fixture-human-consent",
    approval: pairingApprovalSchema.parse({ destination, chatId: "fixture-chat", environment: null,
      scope: "exact_chat_steering", policyRevision: 1 }) }, start), destination, start);
  const readAccepted = vi.fn(async () => row);
  const store = new HelixReasoningTaskBindingStore({ serviceInstanceRef: "fixture-service", listPresence: () => [] }, () => now);
  const input = { destination, clientSessionRef: "fixture-session", readAccepted };
  return { store, input, readAccepted, row: () => row,
    expire: () => { now = new Date(row.pairingExpiresAt); },
    revoke: () => { row = revokePairingLedgerRow(row, destination.profileId, now); } };
}

describe("durable runtime binding preflight", () => {
  it("requires fresh admission for every operation and preserves same-session dedupe", async () => {
    const h = fixture();
    const binding = await h.store.withAcceptedPairing(h.input, value => value);
    const request = { profileRef: destination.profileId, bindingId: binding.reasoning_binding_id,
      bindingEpoch: binding.binding_epoch, clientEventRef: "fixture-event", origin: "typed" as const,
      instructionText: "Please inspect the surroundings." };
    expect(binding).toMatchObject({ continuation_transport: "unavailable", execution_authority: false,
      pairing_id: h.row().id,
      expires_at: h.row().pairingExpiresAt });
    expect(() => h.store.dispatch(request)).toThrow("reasoning_binding_durable_preflight_required");
    const event = await h.store.withAcceptedPairing(h.input, () => h.store.dispatch(request));
    expect(await h.store.withAcceptedPairing(h.input, () => h.store.dispatch(request))).toEqual(event);
    expect(h.readAccepted).toHaveBeenCalledTimes(3);
    expect(() => h.store.inspect({ profileRef: destination.profileId, bindingId: binding.reasoning_binding_id }))
      .toThrow("reasoning_binding_durable_preflight_required");
    h.revoke();
    await expect(h.store.withAcceptedPairing(h.input, () => h.store.dispatch(request))).rejects.toThrow("pairing_revoked");
  });

  it("rejects wrong destinations, missing durable evidence and exact grant expiry", async () => {
    const h = fixture();
    for (const key of Object.keys(destination)) {
      await expect(h.store.withAcceptedPairing({ ...h.input, destination: { ...destination, [key]: "fixture-foreign" } }, x => x))
        .rejects.toThrow("pairing_destination_mismatch");
    }
    await expect(h.store.withAcceptedPairing({ ...h.input, readAccepted: async () => { throw new Error("fixture-disk-unavailable"); } }, x => x))
      .rejects.toThrow("fixture-disk-unavailable");
    h.expire();
    await expect(h.store.withAcceptedPairing(h.input, x => x)).rejects.toThrow("pairing_expired");
  });

  it("changes the transient binding identity on service replacement without extending consent", async () => {
    const h = fixture();
    const before = await h.store.withAcceptedPairing(h.input, x => x);
    const replacement = new HelixReasoningTaskBindingStore({ serviceInstanceRef: "fixture-replacement", listPresence: () => [] }, () => start);
    const after = await replacement.withAcceptedPairing({ ...h.input, clientSessionRef: "fixture-new-session" }, x => x);
    expect(after.reasoning_binding_id).not.toBe(before.reasoning_binding_id);
    expect(after.expires_at).toBe(before.expires_at);
    expect(after.pairing_id).toBe(before.pairing_id);
    expect(() => replacement.inspect({ profileRef: destination.profileId, bindingId: before.reasoning_binding_id }))
      .toThrow("reasoning_binding_not_found");
  });
});
