import crypto from "node:crypto";
import type { Pool } from "pg";
import { z } from "zod";
import { pairingDestinationSchema, pairingDestinationDigest, type PairingDestination } from "./pairing-ledger-contract";
import { ensureDatabase, getPool, requireDurableDatabaseSnapshot } from "../../db/client";
import { nativePairingVault, type PairingIdentityVault } from "./pairing-ledger-repository";

export const PAIRING_DESTINATIONS_TABLE = "helix_pairing_destinations";
const hash = (value: unknown) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const destinationDigest = pairingDestinationDigest;
const requestSchema = z.object({ requestId: z.string().min(3).max(120),
  durationSeconds: z.number().int().min(300).max(86400) }).strict();
type StoredRegistration = { registration_id: string; owner_profile_id: string; destination_digest: string;
  created_at: Date | string; expires_at: Date | string; revoked_at: Date | string | null;
  encrypted_identity: string | null; encryption_key_id: string | null };
export class PairingDestinationRegistrationError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

/** Metadata only: encrypted declared task identity, no task content, presence or grant.
 * Callers must first authenticate the client and installation and validate the
 * exact declared continuation. HTTP/MCP request bodies are not authenticators. */
export class PairingDestinationRegistrationStore {
  constructor(private readonly db: Pick<Pool, "query">,
    private readonly flush: () => Promise<void>, private readonly now: () => Date = () => new Date(),
    private readonly vault: PairingIdentityVault = nativePairingVault) {}

  private aad(owner: string, id: string, digest: string) {
    return JSON.stringify(["helix.pairing_destination_identity.v1", owner, id, digest]);
  }

  private timestamp() {
    const time = this.now().getTime();
    if (!Number.isFinite(time)) throw new PairingDestinationRegistrationError("pairing_clock_invalid");
    return time;
  }
  private active(row: StoredRegistration) {
    const time = this.timestamp();
    if (time < new Date(row.created_at).getTime()) throw new PairingDestinationRegistrationError("pairing_clock_before_creation");
    if (row.revoked_at) throw new PairingDestinationRegistrationError("pairing_registration_revoked");
    if (time >= new Date(row.expires_at).getTime()) throw new PairingDestinationRegistrationError("pairing_registration_expired");
    return { registrationId: row.registration_id,
      destinationDigest: row.destination_digest,
      expiresAt: new Date(row.expires_at).toISOString(),
      proofBasis: "authenticated_client_declaration" as const,
      currentPresence: false as const, pairingAuthority: false as const, executionAuthority: false as const };
  }
  async registerAuthenticated(destination: PairingDestination, raw: unknown) {
    const actor = pairingDestinationSchema.parse(destination);
    const request = requestSchema.parse(raw);
    const id = `pairing_destination:${hash([actor.profileId, request.requestId])}`;
    const digest = destinationDigest(actor);
    const created = this.timestamp();
    const sealed = await this.vault.seal(actor, this.aad(actor.profileId, id, digest));
    await this.db.query(`INSERT INTO helix_pairing_destinations
      (registration_id, owner_profile_id, destination_digest, created_at, expires_at, encrypted_identity, encryption_key_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
    [id, actor.profileId, digest, new Date(created).toISOString(), new Date(created + request.durationSeconds * 1000).toISOString(),
      sealed.encryptedValue, sealed.keyId]);
    const result = await this.db.query<StoredRegistration>(`SELECT * FROM helix_pairing_destinations
      WHERE registration_id = $1 AND owner_profile_id = $2`, [id, actor.profileId]);
    const row = result.rows[0];
    if (!row || row.destination_digest !== digest ||
      new Date(row.expires_at).getTime() - new Date(row.created_at).getTime() !== request.durationSeconds * 1000) {
      throw new PairingDestinationRegistrationError("pairing_registration_request_conflict");
    }
    this.active(row);
    // Only a fresh authenticated registration can enrich a legacy digest-only
    // row. Preserve its original deadline and any concurrent revocation.
    if (!row.encrypted_identity) await this.db.query(`UPDATE helix_pairing_destinations
      SET encrypted_identity = $1, encryption_key_id = $2
      WHERE registration_id = $3 AND owner_profile_id = $4 AND destination_digest = $5
        AND encrypted_identity IS NULL AND revoked_at IS NULL`,
    [sealed.encryptedValue, sealed.keyId, id, actor.profileId, digest]);
    await this.flush();
    // Retrying or reading never silently renews registration validity.
    return this.verifyAuthenticated(actor, id);
  }
  async verifyAuthenticated(destination: PairingDestination, registrationId: string) {
    const actor = pairingDestinationSchema.parse(destination);
    const result = await this.db.query<StoredRegistration>(`SELECT * FROM helix_pairing_destinations
      WHERE registration_id = $1 AND owner_profile_id = $2`, [registrationId, actor.profileId]);
    const row = result.rows[0];
    if (!row || row.destination_digest !== destinationDigest(actor)) throw new PairingDestinationRegistrationError("pairing_registration_identity_mismatch", 403);
    return this.active(row);
  }
  async revokeOwned(profileId: string, registrationId: string) {
    await this.db.query(`UPDATE helix_pairing_destinations SET revoked_at = $1
      WHERE registration_id = $2 AND owner_profile_id = $3 AND revoked_at IS NULL`,
    [new Date(this.timestamp()).toISOString(), registrationId, profileId]);
    await this.flush();
  }

  async resolveOwned(profileId: string, registrationId: string) {
    const result = await this.db.query<StoredRegistration>(`SELECT * FROM helix_pairing_destinations
      WHERE registration_id = $1 AND owner_profile_id = $2`, [registrationId, profileId]);
    const row = result.rows[0];
    if (!row) throw new PairingDestinationRegistrationError("pairing_registration_identity_mismatch", 403);
    this.active(row);
    if (!row.encrypted_identity || !row.encryption_key_id) throw new PairingDestinationRegistrationError("pairing_registration_identity_unavailable");
    const destination = pairingDestinationSchema.parse(await this.vault.open({ encryptedValue: row.encrypted_identity,
      keyId: row.encryption_key_id }, this.aad(profileId, registrationId, row.destination_digest)));
    if (destination.profileId !== profileId || destinationDigest(destination) !== row.destination_digest) {
      throw new PairingDestinationRegistrationError("pairing_registration_identity_mismatch", 403);
    }
    return { ...await this.verifyAuthenticated(destination, registrationId), destination };
  }
  async listOwned(profileId: string) {
    const result = await this.db.query<{ registration_id: string }>(`SELECT registration_id FROM helix_pairing_destinations
      WHERE owner_profile_id = $1 AND revoked_at IS NULL AND expires_at > $2
        AND encrypted_identity IS NOT NULL
      ORDER BY created_at DESC, registration_id ASC LIMIT 50`, [profileId, new Date(this.timestamp()).toISOString()]);
    const registrations = [];
    for (const row of result.rows) {
      try { registrations.push(await this.resolveOwned(profileId, row.registration_id)); }
      catch (error) {
        if (error instanceof PairingDestinationRegistrationError &&
          ["pairing_registration_expired", "pairing_registration_revoked"].includes(error.code)) continue;
        throw error;
      }
    }
    return registrations;
  }
}

export async function createPairingDestinationRegistrationStore() {
  await ensureDatabase();
  await requireDurableDatabaseSnapshot([PAIRING_DESTINATIONS_TABLE]);
  return new PairingDestinationRegistrationStore(getPool(),
    () => requireDurableDatabaseSnapshot([PAIRING_DESTINATIONS_TABLE]));
}
