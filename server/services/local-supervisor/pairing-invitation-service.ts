import crypto from "node:crypto";
import { z } from "zod";
import { PairingLedgerRepository } from "./pairing-ledger-repository";
import { createPairingLedgerRow, pairingApprovalSchema, pairingState, projectPairingLedgerRow,
  type PairingApproval, type PairingLedgerRow } from "./pairing-ledger-contract";

const requestSchema = z.object({ requestId: z.string().min(3).max(120),
  registrationId: z.string().min(3).max(320), chatId: z.string().min(3).max(320),
  environment: z.object({ roomId: z.string().min(3).max(320), runId: z.string().min(3).max(320) }).strict().nullable(),
  invitationSeconds: z.union([z.literal(300), z.literal(900), z.literal(3600)]),
  pairingSeconds: z.union([z.literal(3600), z.literal(28800), z.literal(86400)]),
}).strict();
export type PairingInvitationRequest = z.infer<typeof requestSchema>;
const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
export class PairingInvitationError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

/** The mandatory authorizer must validate the human session, exact durable
 * registration, owner/chat/run eligibility and reviewed scope on every request.
 * Returning caller-submitted identity or unsigned consent here is forbidden. */
export class PairingInvitationService<Credential> {
  constructor(private readonly repository: PairingLedgerRepository,
    private readonly authorizeHumanApproval: (credential: Credential, request: PairingInvitationRequest) =>
      Promise<{ approval: PairingApproval; consentReceiptId: string }>,
    private readonly now: () => Date = () => new Date()) {}

  private response(row: PairingLedgerRow) {
    const state = pairingState(row, this.now());
    if (state === "pending" && !row.acceptanceSecret) throw new PairingInvitationError("pairing_invitation_copy_unavailable");
    return { pairing: projectPairingLedgerRow(row, row.approval.destination.profileId, this.now()),
      invitation: state === "pending" ? { id: row.id, secret: row.acceptanceSecret! } : null };
  }

  async issue(credential: Credential, raw: unknown) {
    const request = requestSchema.parse(raw);
    const authorized = await this.authorizeHumanApproval(credential, request);
    const approval = pairingApprovalSchema.parse(authorized.approval);
    // The trusted resolver must return precisely the human-reviewed scope.
    if (approval.chatId !== request.chatId || JSON.stringify(approval.environment) !== JSON.stringify(request.environment) ||
      approval.invitationSeconds !== request.invitationSeconds || approval.pairingSeconds !== request.pairingSeconds) {
      throw new PairingInvitationError("pairing_approval_scope_mismatch");
    }
    const owner = approval.destination.profileId;
    const requestDigest = digest(JSON.stringify([owner, request.requestId]));
    const sameApproval = (row: PairingLedgerRow) => {
      if (JSON.stringify(row.approval) !== JSON.stringify(approval)) throw new PairingInvitationError("pairing_invitation_request_conflict");
    };
    const prior = await this.repository.readByRequest(owner, requestDigest);
    if (prior) {
      sameApproval(prior);
      await this.repository.confirmDurability();
    } else {
      const secret = crypto.randomBytes(32).toString("base64url");
      await this.repository.insert(createPairingLedgerRow({ id: `pairing:${crypto.randomUUID()}`,
        approval, requestDigest, acceptanceSecret: secret, acceptanceSecretDigest: digest(secret),
        consentReceiptId: authorized.consentReceiptId }, this.now()));
    }
    // A concurrent issuer can win or a grant can be revoked during the barrier.
    // Reconcile the actual row; never return an uncommitted generated secret.
    const stored = await this.repository.readByRequest(owner, requestDigest);
    if (!stored) throw new PairingInvitationError("pairing_invitation_commit_unknown", 503);
    sameApproval(stored);
    return this.response(stored);
  }
}
