import crypto from "node:crypto";
import { z } from "zod";
import { PairingLedgerRepository } from "./pairing-ledger-repository";
import { acceptPairingLedgerRow, revokePairingLedgerRow, projectPairingLedgerRow,
  type PairingDestination } from "./pairing-ledger-contract";

const acceptanceSchema = z.object({
  id: z.string().min(3).max(320),
  secret: z.string().regex(/^[A-Za-z0-9_-]{43}$/u),
}).strict();
const idSchema = z.string().min(3).max(320);

/** These ports must resolve server-authenticated credentials, never fields in the
 * request body. No default authorizer, fixture principal or HTTP bypass exists. */
export type PairingAuthorizer<Credential> = {
  destination(credential: Credential): Promise<PairingDestination>;
  humanOwner(credential: Credential): Promise<string>;
};

export class PairingTransitionService<Credential> {
  constructor(private readonly repository: PairingLedgerRepository,
    private readonly authorize: PairingAuthorizer<Credential>,
    private readonly now: () => Date = () => new Date()) {}

  async recover(credential: Credential, id: unknown) {
    const pairingId = idSchema.parse(id);
    const actor = await this.authorize.destination(credential);
    await this.repository.confirmDurability();
    const row = await this.repository.read(actor.profileId, pairingId);
    if (!row) throw new Error("pairing_acceptance_invalid");
    // Validate the complete destination and finite state with the same policy as
    // acceptance, but never commit a pending invitation through this read path.
    const validated = acceptPairingLedgerRow(row, actor, this.now());
    if (!row.acceptedAt || validated.revision !== row.revision) throw new Error("pairing_not_accepted");
    return projectPairingLedgerRow(row, actor.profileId, this.now());
  }

  async accept(credential: Credential, input: unknown) {
    const request = acceptanceSchema.parse(input);
    // Re-authorize each operation, including retries of an accepted invitation.
    const actor = await this.authorize.destination(credential);
    const suppliedDigest = crypto.createHash("sha256").update(request.secret).digest();
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.repository.read(actor.profileId, request.id);
      if (!current || !crypto.timingSafeEqual(suppliedDigest, Buffer.from(current.acceptanceSecretDigest, "hex"))) {
        throw new Error("pairing_acceptance_invalid");
      }
      const next = acceptPairingLedgerRow(current, actor, this.now());
      if (next.revision === current.revision) {
        await this.repository.confirmDurability();
        // Re-read after the barrier so a revocation committed during recovery
        // cannot be projected as accepted by this reconciliation path.
        const recovered = await this.repository.read(actor.profileId, request.id);
        if (!recovered) throw new Error("pairing_acceptance_invalid");
        acceptPairingLedgerRow(recovered, actor, this.now());
        return projectPairingLedgerRow(recovered, actor.profileId, this.now());
      }
      if (await this.repository.compareAndSwap(next, current.revision)) {
        return projectPairingLedgerRow(next, actor.profileId, this.now());
      }
    }
    // Bounded database contention, not a provider/model retry loop.
    throw new Error("pairing_transition_conflict");
  }

  async revoke(credential: Credential, id: unknown) {
    const pairingId = idSchema.parse(id);
    const owner = await this.authorize.humanOwner(credential);
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.repository.read(owner, pairingId);
      if (!current) throw new Error("pairing_not_found");
      const next = revokePairingLedgerRow(current, owner, this.now());
      if (next.revision === current.revision) {
        await this.repository.confirmDurability();
        return projectPairingLedgerRow(next, owner, this.now());
      }
      if (await this.repository.compareAndSwap(next, current.revision)) {
        return projectPairingLedgerRow(next, owner, this.now());
      }
    }
    throw new Error("pairing_transition_conflict");
  }
}
