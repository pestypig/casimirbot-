import type { Pool } from "pg";
import { ensureDatabase, getPool, requireDurableDatabaseSnapshot } from "../../db/client";
import { nativePairingVault, PairingStorageError, type PairingIdentityVault } from "./pairing-ledger-repository";
import { durableSteeringRecordSchema, type DurableSteeringRecord } from "./durable-steering-contract";

export const DURABLE_STEERING_TABLE = "helix_durable_steering";
type Stored = { event_id: string; owner_profile_id: string; pairing_id: string; event_cursor: number;
  revision: number; request_digest: string; encrypted_payload: string; encryption_key_id: string };
const aad = (owner: string, pairing: string, id: string, revision: number) =>
  JSON.stringify(["helix.durable_steering.v1", owner, pairing, id, revision]);

// Storage primitive, not admission. The service must authenticate and validate
// the accepted grant on every operation, including after asynchronous commits.
export class DurableSteeringRepository {
  constructor(private readonly db: Pick<Pool, "query">, private readonly vault: PairingIdentityVault,
    private readonly flush: () => Promise<void>) {}
  async confirmDurability() { await this.flush(); }
  private async decode(stored: Stored) {
    let raw: unknown;
    try { raw = await this.vault.open({ encryptedValue: stored.encrypted_payload, keyId: stored.encryption_key_id },
      aad(stored.owner_profile_id, stored.pairing_id, stored.event_id, stored.revision)); }
    catch { throw new PairingStorageError("pairing_storage_unreadable"); }
    const parsed = durableSteeringRecordSchema.safeParse(raw);
    if (!parsed.success) throw new PairingStorageError("pairing_storage_invalid");
    const row = parsed.data;
    if (row.ownerProfileId !== stored.owner_profile_id || row.pairingId !== stored.pairing_id ||
        row.id !== stored.event_id || row.cursor !== stored.event_cursor || row.revision !== stored.revision || row.requestDigest !== stored.request_digest) {
      throw new PairingStorageError("pairing_storage_identity_mismatch");
    }
    return row;
  }
  async read(owner: string, pairing: string, id: string) {
    const result = await this.db.query<Stored>(`SELECT * FROM helix_durable_steering
      WHERE owner_profile_id=$1 AND pairing_id=$2 AND event_id=$3`, [owner, pairing, id]);
    return result.rows[0] ? this.decode(result.rows[0]) : null;
  }
  async list(owner: string, pairing: string, afterCursor = 0, recent = false) {
    if (!Number.isSafeInteger(afterCursor) || afterCursor < 0) throw new Error("steering_cursor_invalid");
    const result = await this.db.query<Stored>(`SELECT * FROM helix_durable_steering
      WHERE owner_profile_id=$1 AND pairing_id=$2 AND event_cursor>$3 ORDER BY event_cursor ${recent ? "DESC" : "ASC"} LIMIT 50`, [owner, pairing, afterCursor]);
    return Promise.all((recent ? result.rows.reverse() : result.rows).map(row => this.decode(row)));
  }
  // Optimistic allocation; the unique pairing/cursor index arbitrates races.
  // Caller retries a conflicting insert after rechecking event identity.
  async nextCursor(owner: string, pairing: string) {
    const result = await this.db.query<{ cursor: number }>(`SELECT COALESCE(MAX(event_cursor), 0) AS cursor
      FROM helix_durable_steering WHERE owner_profile_id=$1 AND pairing_id=$2`, [owner, pairing]);
    const next = Number(result.rows[0].cursor) + 1;
    if (!Number.isSafeInteger(next) || next > 2147483647) throw new Error("steering_cursor_exhausted");
    return next;
  }
  async insert(raw: DurableSteeringRecord) {
    const row = durableSteeringRecordSchema.parse(raw);
    if (row.revision !== 1 || row.acknowledgedAt) throw new Error("steering_initial_state_invalid");
    const envelope = await this.vault.seal(row, aad(row.ownerProfileId, row.pairingId, row.id, row.revision));
    const result = await this.db.query(`INSERT INTO helix_durable_steering
      (event_id, owner_profile_id, pairing_id, event_cursor, revision, request_digest, encrypted_payload, encryption_key_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING event_id`,
    [row.id, row.ownerProfileId, row.pairingId, row.cursor, row.revision, row.requestDigest, envelope.encryptedValue, envelope.keyId]);
    await this.flush();
    return result.rows.length === 1;
  }
  async compareAndSwap(raw: DurableSteeringRecord, expectedRevision: number) {
    const row = durableSteeringRecordSchema.parse(raw);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1 || row.revision !== expectedRevision + 1) throw new Error("steering_revision_invalid");
    const previous = await this.read(row.ownerProfileId, row.pairingId, row.id);
    if (previous && previous.revision === expectedRevision &&
        (previous.createdAt !== row.createdAt || previous.expiresAt !== row.expiresAt ||
         previous.requestDigest !== row.requestDigest || previous.cursor !== row.cursor)) {
      throw new Error("steering_immutable_fields_changed");
    }
    const envelope = await this.vault.seal(row, aad(row.ownerProfileId, row.pairingId, row.id, row.revision));
    const result = await this.db.query(`UPDATE helix_durable_steering SET revision=$1, encrypted_payload=$2, encryption_key_id=$3
      WHERE owner_profile_id=$4 AND pairing_id=$5 AND event_id=$6 AND revision=$7 AND request_digest=$8 AND event_cursor=$9 RETURNING event_id`,
    [row.revision, envelope.encryptedValue, envelope.keyId, row.ownerProfileId, row.pairingId, row.id, expectedRevision, row.requestDigest, row.cursor]);
    await this.flush();
    return result.rows.length === 1;
  }
}
export async function createNativeDurableSteeringRepository() {
  await ensureDatabase();
  await requireDurableDatabaseSnapshot([DURABLE_STEERING_TABLE]);
  return new DurableSteeringRepository(getPool(), nativePairingVault,
    () => requireDurableDatabaseSnapshot([DURABLE_STEERING_TABLE]));
}
