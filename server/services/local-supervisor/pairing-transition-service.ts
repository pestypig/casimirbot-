import crypto from "node:crypto";
import { z } from "zod";
import { PairingLedgerRepository } from "./pairing-ledger-repository";
import { acceptPairingLedgerRow, acceptPairingReplacement, revokePairingLedgerRow, projectPairingLedgerRow,
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
      if (current.approval.replacement && !current.acceptedAt) {
        const predecessor = await this.repository.read(actor.profileId, current.approval.replacement.pairingId);
        if (!predecessor) throw new Error("pairing_replacement_conflict");
        // These reads may straddle another acceptance of this same invitation.
        // Re-enter normal authenticated replay rather than treating its own
        // committed supersession as a competing replacement. Never infer
        // acceptance from the predecessor record alone.
        if (predecessor.supersession?.pairingId === current.id) {
          const refreshed = await this.repository.read(actor.profileId, current.id);
          if (refreshed?.acceptedAt && refreshed.revision > current.revision) continue;
        }
        const next = acceptPairingReplacement(current, predecessor, actor, this.now());
        if (!await this.repository.compareAndSwapPair(
          { row: next.predecessor, expectedRevision: predecessor.revision },
          { row: next.replacement, expectedRevision: current.revision },
        )) continue;
      } else {
        const next = acceptPairingLedgerRow(current, actor, this.now());
        if (next.revision === current.revision) {
          await this.repository.confirmDurability();
        } else if (!await this.repository.compareAndSwap(next, current.revision)) {
          continue;
        }
      }
      // Both first acceptance and replay cross an asynchronous durability
      // barrier. A revocation committed there must win over the earlier row.
      const recovered = await this.repository.read(actor.profileId, request.id);
      if (!recovered) throw new Error("pairing_acceptance_invalid");
      acceptPairingLedgerRow(recovered, actor, this.now());
      return projectPairingLedgerRow(recovered, actor.profileId, this.now());
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

  async cancelRequest(credential: Credential, rawRequestId: unknown) {
    const requestId = z.string().min(3).max(120).parse(rawRequestId);
    const owner = await this.authorize.humanOwner(credential);
    const requestDigest = crypto.createHash("sha256").update(JSON.stringify([owner, requestId])).digest("hex");
    const prior = await this.repository.reserveRequestCancellation(owner, requestDigest, this.now());
    // Issuance won the unique slot: revoke that exact row through existing CAS
    // and durability checks, including acceptance races. No predecessor revival.
    const pairing = prior ? await this.revoke(credential, prior.id) : null;
    return { cancelled: true as const, pairing };
  }
}
