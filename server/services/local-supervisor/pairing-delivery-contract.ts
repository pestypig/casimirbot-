import crypto from "node:crypto";
import { z } from "zod";
import { pairingDestinationDigest, pairingState, type PairingLedgerRow } from "./pairing-ledger-contract";

// Delivery is not pairing acceptance. Keep its revision independent of consent
// transitions, and never store the invitation secret in this projection.
const ref = z.string().min(3).max(320).regex(/^[^\r\n\t]+$/u);
export const pairingDeliverySchema = z.object({
  schema: z.literal("helix.pairing_delivery.v1"),
  id: ref, pairingId: ref, destinationDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  revision: z.number().int().positive(),
  state: z.enum(["pending", "unknown", "delivered"]),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  providerMessageId: ref.nullable(),
}).strict().superRefine((row, ctx) => {
  if (Date.parse(row.updatedAt) < Date.parse(row.createdAt) ||
      (row.state === "delivered") !== (row.providerMessageId !== null) ||
      (row.revision === 1 && (row.state !== "pending" || row.updatedAt !== row.createdAt))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pairing_delivery_state_invalid" });
  }
});
export type PairingDelivery = z.infer<typeof pairingDeliverySchema>;

function timestamp(now: Date) {
  if (!Number.isFinite(now.getTime())) throw new Error("pairing_delivery_clock_invalid");
  return now.toISOString();
}

/** Internal policy only. The caller must authenticate the approved host and
 * commit changes durably with CAS before dispatching any provider request. */
export function createPairingDelivery(pairing: PairingLedgerRow, now: Date): PairingDelivery {
  if (pairingState(pairing, now) !== "pending") throw new Error("pairing_delivery_grant_unavailable");
  const destinationDigest = pairingDestinationDigest(pairing.approval.destination);
  const id = `pairing_delivery:${crypto.createHash("sha256")
    .update(JSON.stringify([pairing.id, destinationDigest])).digest("hex")}`;
  const at = timestamp(now);
  return pairingDeliverySchema.parse({ schema: "helix.pairing_delivery.v1", id,
    pairingId: pairing.id, destinationDigest, revision: 1, state: "pending",
    createdAt: at, updatedAt: at, providerMessageId: null });
}

export function requirePairingDeliveryScope(raw: PairingDelivery, pairing: PairingLedgerRow, now: Date) {
  const row = pairingDeliverySchema.parse(raw);
  timestamp(now);
  if (now.getTime() < Date.parse(row.updatedAt)) throw new Error("pairing_delivery_clock_before_transition");
  if (row.pairingId !== pairing.id || row.destinationDigest !== pairingDestinationDigest(pairing.approval.destination)) {
    throw new Error("pairing_delivery_scope_mismatch");
  }
  if (pairingState(pairing, now) !== "pending") throw new Error("pairing_delivery_grant_unavailable");
  return row;
}

// Commit unknown BEFORE sending. A crash or lost reply must recover through
// provider reconciliation; it must never be mistaken for a fresh pending send.
export function beginPairingDelivery(raw: PairingDelivery, pairing: PairingLedgerRow, now: Date) {
  const row = requirePairingDeliveryScope(raw, pairing, now);
  if (row.state !== "pending") throw new Error("pairing_delivery_reconciliation_required");
  return pairingDeliverySchema.parse({ ...row, revision: row.revision + 1,
    state: "unknown", updatedAt: timestamp(now) });
}

export function confirmPairingDelivery(raw: PairingDelivery, pairing: PairingLedgerRow,
  providerMessageId: string, now: Date) {
  const row = requirePairingDeliveryScope(raw, pairing, now);
  ref.parse(providerMessageId);
  if (row.state === "pending") throw new Error("pairing_delivery_not_dispatched");
  if (row.state === "delivered") {
    if (row.providerMessageId !== providerMessageId) throw new Error("pairing_delivery_receipt_conflict");
    return row;
  }
  return pairingDeliverySchema.parse({ ...row, revision: row.revision + 1,
    state: "delivered", updatedAt: timestamp(now), providerMessageId });
}
