import type { Pool } from "pg";
import { ensureDatabase, getPool, requireDurableDatabaseSnapshot } from "../../db/client";
import { encryptProviderCredentialForStorage, decryptStoredProviderCredentialForStorage } from "../brokerage/provider-credential-vault";
import { pairingLedgerRowSchema, type PairingLedgerRow } from "./pairing-ledger-contract";

export const PAIRING_LEDGER_TABLE = "helix_pairing_ledger";
type Envelope = { encryptedValue: string; keyId: string };
type Codec = {
  seal(value: PairingLedgerRow, aad: string): Promise<Envelope>;
  open(envelope: Envelope, aad: string): Promise<unknown>;
};
type StoredRow = {
  pairing_id: string; owner_profile_id: string; revision: number; request_digest: string;
  encrypted_payload: string; encryption_key_id: string;
};
const aadFor = (profileId: string, id: string, revision: number) =>
  JSON.stringify(["helix.pairing_ledger.v1", profileId, id, revision]);

// Repository is not an admission API. A trusted service must establish consent,
// destination and secret validity, then use CAS to commit the policy transition.
export class PairingLedgerRepository {
  constructor(private readonly db: Pick<Pool, "query">, private readonly codec: Codec,
    private readonly flush: () => Promise<void>) {}

  private async decode(stored: StoredRow): Promise<PairingLedgerRow> {
    const decoded = await this.codec.open({ encryptedValue: stored.encrypted_payload,
      keyId: stored.encryption_key_id }, aadFor(stored.owner_profile_id, stored.pairing_id, stored.revision));
    const row = pairingLedgerRowSchema.parse(decoded);
    if (row.id !== stored.pairing_id || row.approval.destination.profileId !== stored.owner_profile_id ||
        row.revision !== stored.revision || row.requestDigest !== stored.request_digest) {
      throw new Error("pairing_storage_identity_mismatch");
    }
    return row;
  }

  async read(profileId: string, id: string): Promise<PairingLedgerRow | null> {
    const result = await this.db.query<StoredRow>(
      `SELECT * FROM helix_pairing_ledger WHERE owner_profile_id = $1 AND pairing_id = $2`, [profileId, id]);
    return result.rows[0] ? this.decode(result.rows[0]) : null;
  }

  async readByRequest(profileId: string, requestDigest: string): Promise<PairingLedgerRow | null> {
    const result = await this.db.query<StoredRow>(
      `SELECT * FROM helix_pairing_ledger WHERE owner_profile_id = $1 AND request_digest = $2`, [profileId, requestDigest]);
    return result.rows[0] ? this.decode(result.rows[0]) : null;
  }

  async insert(raw: PairingLedgerRow): Promise<boolean> {
    const row = pairingLedgerRowSchema.parse(raw);
    if (row.revision !== 1 || row.acceptedAt || row.revokedAt) throw new Error("pairing_initial_state_invalid");
    const owner = row.approval.destination.profileId;
    const encrypted = await this.codec.seal(row, aadFor(owner, row.id, row.revision));
    const result = await this.db.query(`INSERT INTO helix_pairing_ledger
      (pairing_id, owner_profile_id, revision, request_digest, encrypted_payload, encryption_key_id)
      VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING pairing_id`,
    [row.id, owner, row.revision, row.requestDigest, encrypted.encryptedValue, encrypted.keyId]);
    // Flush even on conflict: a prior commit may have lost its durability reply.
    await this.flush();
    return result.rows.length === 1;
  }

  async compareAndSwap(raw: PairingLedgerRow, expectedRevision: number): Promise<boolean> {
    const row = pairingLedgerRowSchema.parse(raw);
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1 || row.revision !== expectedRevision + 1) {
      throw new Error("pairing_revision_invalid");
    }
    const owner = row.approval.destination.profileId;
    const encrypted = await this.codec.seal(row, aadFor(owner, row.id, row.revision));
    const result = await this.db.query(`UPDATE helix_pairing_ledger
      SET revision = $1, encrypted_payload = $2, encryption_key_id = $3
      WHERE pairing_id = $4 AND owner_profile_id = $5 AND revision = $6 AND request_digest = $7
      RETURNING pairing_id`, [row.revision, encrypted.encryptedValue, encrypted.keyId,
      row.id, owner, expectedRevision, row.requestDigest]);
    await this.flush();
    return result.rows.length === 1;
  }

  // Reconciliation after an unknown commit outcome must establish durability
  // again before an idempotent successful response is exposed.
  async confirmDurability(): Promise<void> { await this.flush(); }
}

function requireNativeBroker() {
  if (!process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN?.trim() ||
      !process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN?.trim()) {
    throw new Error("pairing_native_broker_required");
  }
}
export type PairingIdentityVault = {
  seal(value: unknown, aad: string): Promise<Envelope>;
  open(envelope: Envelope, aad: string): Promise<unknown>;
};
export const nativePairingVault: PairingIdentityVault = {
  async seal(value, aad) {
    requireNativeBroker();
    const envelope = await encryptProviderCredentialForStorage(value, aad);
    if (!envelope.keyId.startsWith("native:") || !envelope.encryptedValue.startsWith("v2:")) {
      throw new Error("pairing_native_broker_required");
    }
    return envelope;
  },
  async open(envelope, aad) {
    requireNativeBroker();
    if (!envelope.keyId.startsWith("native:") || !envelope.encryptedValue.startsWith("v2:")) {
      throw new Error("pairing_native_envelope_invalid");
    }
    return decryptStoredProviderCredentialForStorage(envelope.encryptedValue, aad, envelope.keyId);
  },
};

export async function createNativePairingLedgerRepository(): Promise<PairingLedgerRepository> {
  requireNativeBroker();
  await ensureDatabase();
  await requireDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE]);
  return new PairingLedgerRepository(getPool(), nativePairingVault,
    () => requireDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE]));
}
