import type { Pool } from "pg";
import crypto from "node:crypto";
import { ensureDatabase, getPool, requireDurableDatabaseSnapshot, confirmDurableDatabaseSnapshot, commitPairingLedgerWrites } from "../../db/client";
import type { PreparedPairingWrite } from "./embedded-pairing-replacement-commit";
import { encryptProviderCredentialForStorage, decryptStoredProviderCredentialForStorage } from "../brokerage/provider-credential-vault";
import { pairingLedgerRowSchema, pairingRequestCancellationSchema, pairingState,
  type PairingLedgerRow, type PairingRequestCancellation } from "./pairing-ledger-contract";
import type { PairingStorageErrorCode } from "@shared/helix-pairing-storage-error";

export class PairingStorageError extends Error {
  readonly status = 503;
  constructor(readonly code: PairingStorageErrorCode) { super(code); }
}

export const PAIRING_LEDGER_TABLE = "helix_pairing_ledger";
type Envelope = { encryptedValue: string; keyId: string };
type Codec = {
  seal(value: PairingLedgerRow | PairingRequestCancellation, aad: string): Promise<Envelope>;
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
    private readonly flush: () => Promise<void>,
    private readonly atomicCommit?: (writes: readonly [PreparedPairingWrite, PreparedPairingWrite]) => Promise<boolean>,
    private readonly confirm: () => Promise<void> = flush) {}

  private async decode(stored: StoredRow): Promise<PairingLedgerRow | PairingRequestCancellation> {
    let decoded: unknown;
    try {
      decoded = await this.codec.open({ encryptedValue: stored.encrypted_payload,
        keyId: stored.encryption_key_id }, aadFor(stored.owner_profile_id, stored.pairing_id, stored.revision));
    } catch (error) {
      if (error instanceof PairingStorageError) throw error;
      // Authentication failure can mean a missing key or corrupt ciphertext.
      // Do not guess which, or expose the broker's raw diagnostic.
      throw new PairingStorageError("pairing_storage_unreadable");
    }
    const parsed = pairingLedgerRowSchema.or(pairingRequestCancellationSchema).safeParse(decoded);
    if (!parsed.success) throw new PairingStorageError("pairing_storage_invalid");
    const row = parsed.data;
    const owner = row.schema === "helix.pairing_ledger.v1" ? row.approval.destination.profileId : row.ownerProfileId;
    if (row.id !== stored.pairing_id || owner !== stored.owner_profile_id ||
        row.revision !== stored.revision || row.requestDigest !== stored.request_digest) {
      throw new PairingStorageError("pairing_storage_identity_mismatch");
    }
    return row;
  }

  async read(profileId: string, id: string): Promise<PairingLedgerRow | null> {
    const result = await this.db.query<StoredRow>(
      `SELECT * FROM helix_pairing_ledger WHERE owner_profile_id = $1 AND pairing_id = $2`, [profileId, id]);
    const row = result.rows[0] ? await this.decode(result.rows[0]) : null;
    return row?.schema === "helix.pairing_ledger.v1" ? row : null;
  }

  async readByRequest(profileId: string, requestDigest: string): Promise<PairingLedgerRow | null> {
    const row = await this.inspectRequest(profileId, requestDigest);
    return row?.schema === "helix.pairing_ledger.v1" ? row : null;
  }

  async inspectRequest(profileId: string, requestDigest: string): Promise<PairingLedgerRow | PairingRequestCancellation | null> {
    const result = await this.db.query<StoredRow>(
      `SELECT * FROM helix_pairing_ledger WHERE owner_profile_id = $1 AND request_digest = $2`, [profileId, requestDigest]);
    return result.rows[0] ? this.decode(result.rows[0]) : null;
  }

  async reserveRequestCancellation(profileId: string, requestDigest: string, now: Date): Promise<PairingLedgerRow | null> {
    const row = pairingRequestCancellationSchema.parse({ schema: "helix.pairing_request_cancellation.v1",
      id: `pairing_cancel:${crypto.randomUUID()}`, ownerProfileId: profileId, revision: 1,
      requestDigest, cancelledAt: now.toISOString() });
    const encrypted = await this.codec.seal(row, aadFor(profileId, row.id, 1));
    // This unique slot is shared with issuance. Exactly one insert wins, even
    // when an older issue request resumes after cancellation's absent lookup.
    await this.db.query(`INSERT INTO helix_pairing_ledger
      (pairing_id, owner_profile_id, revision, request_digest, encrypted_payload, encryption_key_id)
      VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING RETURNING pairing_id`,
      [row.id, profileId, 1, requestDigest, encrypted.encryptedValue, encrypted.keyId]);
    await this.flush();
    const committed = await this.inspectRequest(profileId, requestDigest);
    if (!committed) throw new Error("pairing_cancellation_commit_unknown");
    return committed.schema === "helix.pairing_ledger.v1" ? committed : null;
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

  // Scan the committed approval ledger, not an in-memory post-issue callback.
  // Cursor follows all scanned rows so pages of copy-only grants still advance.
  async pendingAutomaticDelivery(profileId: string, afterId: string | null, now: Date) {
    const result = afterId === null
      ? await this.db.query<StoredRow>(`SELECT * FROM helix_pairing_ledger
          WHERE owner_profile_id=$1 ORDER BY pairing_id ASC LIMIT 50`, [profileId])
      : await this.db.query<StoredRow>(`SELECT * FROM helix_pairing_ledger
          WHERE owner_profile_id=$1 AND pairing_id>$2 ORDER BY pairing_id ASC LIMIT 50`, [profileId, afterId]);
    const pairingIds: string[] = [];
    for (const stored of result.rows) {
      const row = await this.decode(stored);
      if (row.schema !== "helix.pairing_ledger.v1") continue;
      if (row.approval.invitationDelivery === "automatic" && pairingState(row, now) === "pending") pairingIds.push(row.id);
    }
    return { pairingIds, nextCursor: result.rows.length === 50 ? result.rows[49].pairing_id : null };
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
  async confirmDurability(): Promise<void> { await this.confirm(); }

  async compareAndSwapPair(
    first: { row: PairingLedgerRow; expectedRevision: number },
    second: { row: PairingLedgerRow; expectedRevision: number },
  ): Promise<boolean> {
    if (!this.atomicCommit) throw new Error("pairing_atomic_commit_unavailable");
    const changes = [first, second].map(change => ({ ...change, row: pairingLedgerRowSchema.parse(change.row) }));
    if (changes[0].row.id === changes[1].row.id || changes[0].row.approval.destination.profileId !== changes[1].row.approval.destination.profileId) {
      throw new Error("pairing_atomic_identity_invalid");
    }
    for (const change of changes) {
      if (!Number.isInteger(change.expectedRevision) || change.expectedRevision < 1 || change.row.revision !== change.expectedRevision + 1) {
        throw new Error("pairing_revision_invalid");
      }
    }
    const writes: PreparedPairingWrite[] = [];
    // Finish both asynchronous encryptions before entering the atomic section.
    for (const { row, expectedRevision } of changes) {
      const owner = row.approval.destination.profileId;
      const encrypted = await this.codec.seal(row, aadFor(owner, row.id, row.revision));
      writes.push({ sql: `UPDATE helix_pairing_ledger SET revision=$1, encrypted_payload=$2, encryption_key_id=$3
        WHERE pairing_id=$4 AND owner_profile_id=$5 AND revision=$6 AND request_digest=$7 RETURNING pairing_id`,
        values: [row.revision, encrypted.encryptedValue, encrypted.keyId, row.id, owner, expectedRevision, row.requestDigest] });
    }
    const committed = await this.atomicCommit([writes[0], writes[1]]);
    // Conflicts also reconcile a possibly lost previous durability response.
    await this.flush();
    return committed;
  }
}

function requireNativeBroker() {
  if (!process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN?.trim() ||
      !process.env.HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN?.trim()) {
    throw new PairingStorageError("pairing_native_broker_required");
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
      throw new PairingStorageError("pairing_native_broker_required");
    }
    return envelope;
  },
  async open(envelope, aad) {
    requireNativeBroker();
    if (!envelope.keyId.startsWith("native:") || !envelope.encryptedValue.startsWith("v2:")) {
      throw new PairingStorageError("pairing_native_envelope_invalid");
    }
    return decryptStoredProviderCredentialForStorage(envelope.encryptedValue, aad, envelope.keyId);
  },
};

export async function createNativePairingLedgerRepository(): Promise<PairingLedgerRepository> {
  requireNativeBroker();
  await ensureDatabase();
  await requireDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE]);
  return new PairingLedgerRepository(getPool(), nativePairingVault,
    () => requireDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE]), commitPairingLedgerWrites,
    () => confirmDurableDatabaseSnapshot([PAIRING_LEDGER_TABLE]));
}
