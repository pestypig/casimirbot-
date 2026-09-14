import type { Pool } from "pg";
import { pairingDeliverySchema, type PairingDelivery } from "./pairing-delivery-contract";
import type { PairingIdentityVault } from "./pairing-ledger-repository";
import { createNativePairingLedgerRepository, nativePairingVault } from "./pairing-ledger-repository";
import { getPool, requireDurableDatabaseSnapshot } from "../../db/client";

type Stored = { delivery_id: string; owner_profile_id: string; pairing_id: string;
  revision: number; encrypted_payload: string; encryption_key_id: string };
const aad = (owner: string, id: string, revision: number) =>
  JSON.stringify(["helix.pairing_delivery.v1", owner, id, revision]);

// Internal storage only. Services must authorize the owner, pending pairing and
// supported provider before enqueue or dispatch. No dispatch worker is installed.
export class PairingDeliveryRepository {
  constructor(private readonly db: Pick<Pool, "query">, private readonly vault: PairingIdentityVault,
    private readonly flush: () => Promise<void>) {}

  async read(owner: string, pairingId: string): Promise<PairingDelivery | null> {
    const result = await this.db.query<Stored>(`SELECT * FROM helix_pairing_delivery
      WHERE owner_profile_id=$1 AND pairing_id=$2`, [owner, pairingId]);
    const stored = result.rows[0];
    if (!stored) return null;
    let raw: unknown;
    try { raw = await this.vault.open({ encryptedValue: stored.encrypted_payload,
      keyId: stored.encryption_key_id }, aad(owner, stored.delivery_id, stored.revision)); }
    catch { throw new Error("pairing_delivery_storage_unreadable"); }
    const parsed = pairingDeliverySchema.safeParse(raw);
    if (!parsed.success) throw new Error("pairing_delivery_storage_invalid");
    const row = parsed.data;
    if (row.id !== stored.delivery_id || row.pairingId !== stored.pairing_id || row.revision !== stored.revision) {
      throw new Error("pairing_delivery_storage_identity_mismatch");
    }
    return row;
  }

  async insert(owner: string, raw: PairingDelivery) {
    const row = pairingDeliverySchema.parse(raw);
    if (row.revision !== 1 || row.state !== "pending") throw new Error("pairing_delivery_initial_state_invalid");
    const sealed = await this.vault.seal(row, aad(owner, row.id, row.revision));
    const result = await this.db.query(`INSERT INTO helix_pairing_delivery
      (delivery_id,owner_profile_id,pairing_id,revision,encrypted_payload,encryption_key_id)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING delivery_id`,
    [row.id, owner, row.pairingId, row.revision, sealed.encryptedValue, sealed.keyId]);
    await this.flush();
    const stored = await this.read(owner, row.pairingId);
    if (!stored || stored.id !== row.id || stored.destinationDigest !== row.destinationDigest) {
      throw new Error("pairing_delivery_request_conflict");
    }
    return { inserted: result.rows.length === 1, delivery: stored };
  }

  async compareAndSwap(owner: string, raw: PairingDelivery, expectedRevision: number) {
    const row = pairingDeliverySchema.parse(raw);
    const prior = await this.read(owner, row.pairingId);
    if (!prior || prior.revision !== expectedRevision) { await this.flush(); return false; }
    if (row.revision !== expectedRevision + 1 || row.id !== prior.id ||
        row.destinationDigest !== prior.destinationDigest || row.createdAt !== prior.createdAt ||
        Date.parse(row.updatedAt) < Date.parse(prior.updatedAt) ||
        !((prior.state === "pending" && row.state === "unknown") ||
          (prior.state === "unknown" && row.state === "delivered"))) {
      throw new Error("pairing_delivery_transition_invalid");
    }
    const sealed = await this.vault.seal(row, aad(owner, row.id, row.revision));
    const result = await this.db.query(`UPDATE helix_pairing_delivery
      SET revision=$1,encrypted_payload=$2,encryption_key_id=$3
      WHERE delivery_id=$4 AND owner_profile_id=$5 AND pairing_id=$6 AND revision=$7 RETURNING delivery_id`,
    [row.revision, sealed.encryptedValue, sealed.keyId, row.id, owner, row.pairingId, expectedRevision]);
    await this.flush();
    return result.rows.length === 1;
  }

  async confirmDurability() { await this.flush(); }
}

export async function createNativePairingDeliveryRepository() {
  // Reuse the existing native-broker and database prerequisites, never fallback
  // to an unkeyed or plaintext store when protected persistence is unavailable.
  await createNativePairingLedgerRepository();
  await requireDurableDatabaseSnapshot(["helix_pairing_delivery"]);
  return new PairingDeliveryRepository(getPool(), nativePairingVault,
    () => requireDurableDatabaseSnapshot(["helix_pairing_delivery"]));
}
