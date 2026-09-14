import { z } from "zod";
import crypto from "node:crypto";

const ref = z.string().min(3).max(320).regex(/^[^\r\n\t]+$/u)
  .refine(value => !/(?:https?:\/\/|bearer\s|token=|password=)/iu.test(value), "private_value_forbidden");
const digest = z.string().regex(/^[a-f0-9]{64}$/u);
export const pairingDestinationSchema = z.object({
  issuer: ref, profileId: ref, installationId: ref, clientId: ref, taskId: ref,
}).strict();
export type PairingDestination = z.infer<typeof pairingDestinationSchema>;
// Public correlation only; authentication remains the caller's responsibility.
export function pairingDestinationDigest(raw: PairingDestination) {
  const value = pairingDestinationSchema.parse(raw);
  return crypto.createHash("sha256").update(JSON.stringify([
    value.issuer, value.profileId, value.installationId, value.clientId, value.taskId,
  ])).digest("hex");
}
export const pairingApprovalSchema = z.object({
  destination: pairingDestinationSchema,
  chatId: ref,
  environment: z.object({ roomId: ref, runId: ref }).strict().nullable(),
  scope: z.literal("exact_chat_steering"),
  // Absence is copy-only legacy consent, never automatic delivery authority.
  invitationDelivery: z.literal("automatic").optional(),
  policyRevision: z.union([z.literal(1), z.literal(2)]),
  replacement: z.object({ pairingId: ref, revision: z.number().int().positive() }).strict().optional(),
  invitationSeconds: z.union([z.literal(300), z.literal(900), z.literal(3600)]).default(900),
  pairingSeconds: z.union([z.literal(3600), z.literal(28800), z.literal(86400)]).default(28800),
}).strict().superRefine((approval, ctx) => {
  if ((approval.policyRevision === 2) !== Boolean(approval.replacement)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pairing_replacement_policy_mismatch" });
  }
});
export type PairingApproval = z.infer<typeof pairingApprovalSchema>;

export const pairingLedgerRowSchema = z.object({
  schema: z.literal("helix.pairing_ledger.v1"),
  id: ref, revision: z.number().int().positive(),
  approval: pairingApprovalSchema,
  // Provenance supplied only by authenticated human-consent admission.
  consentReceiptId: ref,
  requestDigest: digest,
  acceptanceSecretDigest: digest,
  // Recoverable only inside the encrypted server record for owner-authorized Copy.
  acceptanceSecret: z.string().regex(/^[A-Za-z0-9_-]{43}$/u).nullable().default(null),
  createdAt: z.string().datetime(), invitationExpiresAt: z.string().datetime(),
  pairingExpiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(), revokedAt: z.string().datetime().nullable(),
  supersession: z.object({ pairingId: ref, at: z.string().datetime() }).strict().optional(),
}).strict().superRefine((row, ctx) => {
  const created = Date.parse(row.createdAt);
  const invalid = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  if (row.acceptanceSecret && crypto.createHash("sha256").update(row.acceptanceSecret).digest("hex") !== row.acceptanceSecretDigest) {
    invalid("pairing_secret_digest_mismatch");
  }
  if (Date.parse(row.invitationExpiresAt) !== created + row.approval.invitationSeconds * 1000 ||
      Date.parse(row.pairingExpiresAt) !== created + row.approval.pairingSeconds * 1000) {
    invalid("pairing_deadline_not_bound_to_approval");
  }
  if (row.acceptedAt && (Date.parse(row.acceptedAt) < created ||
      Date.parse(row.acceptedAt) >= Date.parse(row.invitationExpiresAt) ||
      Date.parse(row.acceptedAt) >= Date.parse(row.pairingExpiresAt))) invalid("pairing_acceptance_time_invalid");
  if (row.revokedAt && Date.parse(row.revokedAt) < created) invalid("pairing_revocation_time_invalid");
  if (row.acceptedAt && row.revokedAt && Date.parse(row.revokedAt) < Date.parse(row.acceptedAt)) {
    invalid("pairing_revocation_before_acceptance");
  }
  if (row.supersession && (!row.acceptedAt || row.supersession.pairingId === row.id || row.revision < 3 ||
      Date.parse(row.supersession.at) < Date.parse(row.acceptedAt) ||
      Date.parse(row.supersession.at) >= Date.parse(row.pairingExpiresAt))) invalid("pairing_supersession_invalid");
  if (row.approval.replacement?.pairingId === row.id) invalid("pairing_self_replacement");
});
export type PairingLedgerRow = z.infer<typeof pairingLedgerRowSchema>;

// Shares the ledger's unique owner/request slot, but carries no consent,
// destination or acceptance secret. It can only prevent future issuance.
export const pairingRequestCancellationSchema = z.object({
  schema: z.literal("helix.pairing_request_cancellation.v1"),
  id: ref, ownerProfileId: ref, revision: z.literal(1), requestDigest: digest,
  cancelledAt: z.string().datetime(),
}).strict();
export type PairingRequestCancellation = z.infer<typeof pairingRequestCancellationSchema>;

const nowMs = (now: Date) => {
  const value = now.getTime();
  if (!Number.isFinite(value)) throw new Error("pairing_clock_invalid");
  return value;
};
export function pairingState(row: PairingLedgerRow, now: Date) {
  const value = nowMs(now);
  if (value < Date.parse(row.createdAt)) throw new Error("pairing_clock_before_creation");
  if ((row.acceptedAt && value < Date.parse(row.acceptedAt)) ||
      (row.revokedAt && value < Date.parse(row.revokedAt)) ||
      (row.supersession && value < Date.parse(row.supersession.at))) throw new Error("pairing_clock_before_transition");
  if (row.revokedAt) return "revoked" as const;
  if (row.supersession) return "superseded" as const;
  if (value >= Date.parse(row.pairingExpiresAt)) return "expired" as const;
  if (row.acceptedAt) return "accepted" as const;
  return value >= Date.parse(row.invitationExpiresAt) ? "expired" as const : "pending" as const;
}

// Policy functions are server-internal, not authentication or persistence APIs.
// Callers MUST establish human consent/provider identity before invoking these,
// and commit transitions atomically in the server-owned durable repository.
export function createPairingLedgerRow(input: {
  id: string; approval: PairingApproval; consentReceiptId: string;
  requestDigest: string; acceptanceSecretDigest: string;
  acceptanceSecret?: string | null;
}, now: Date): PairingLedgerRow {
  const approval = pairingApprovalSchema.parse(input.approval);
  const timestamp = nowMs(now);
  return pairingLedgerRowSchema.parse({ ...input, approval,
    schema: "helix.pairing_ledger.v1", revision: 1, createdAt: now.toISOString(),
    invitationExpiresAt: new Date(timestamp + approval.invitationSeconds * 1000).toISOString(),
    pairingExpiresAt: new Date(timestamp + approval.pairingSeconds * 1000).toISOString(),
    acceptedAt: null, revokedAt: null,
  });
}

export function acceptPairingLedgerRow(raw: PairingLedgerRow, actor: PairingDestination, now: Date): PairingLedgerRow {
  const row = pairingLedgerRowSchema.parse(raw);
  const identity = pairingDestinationSchema.parse(actor);
  for (const key of Object.keys(identity) as Array<keyof PairingDestination>) {
    if (identity[key] !== row.approval.destination[key]) throw new Error("pairing_destination_mismatch");
  }
  const state = pairingState(row, now);
  if (state === "revoked" || state === "expired" || state === "superseded") throw new Error(`pairing_${state}`);
  if (state === "accepted") return row;
  if (row.approval.replacement) throw new Error("pairing_replacement_required");
  return pairingLedgerRowSchema.parse({ ...row, revision: row.revision + 1, acceptedAt: now.toISOString(), acceptanceSecret: null });
}

/** Policy only: both returned rows MUST be committed atomically. This function
 * neither authenticates the caller nor mutates/persists either input. */
export function acceptPairingReplacement(raw: PairingLedgerRow, predecessorRaw: PairingLedgerRow,
  actor: PairingDestination, now: Date) {
  const replacement = pairingLedgerRowSchema.parse(raw);
  const predecessor = pairingLedgerRowSchema.parse(predecessorRaw);
  const identity = pairingDestinationSchema.parse(actor);
  for (const key of Object.keys(identity) as Array<keyof PairingDestination>) {
    if (identity[key] !== replacement.approval.destination[key]) throw new Error("pairing_destination_mismatch");
  }
  const reviewed = replacement.approval.replacement;
  if (!reviewed || reviewed.pairingId !== predecessor.id || reviewed.revision !== predecessor.revision) {
    throw new Error("pairing_replacement_conflict");
  }
  if (predecessor.approval.destination.profileId !== identity.profileId ||
      predecessor.approval.destination.installationId !== identity.installationId ||
      predecessor.approval.chatId !== replacement.approval.chatId) throw new Error("pairing_replacement_scope_mismatch");
  if (pairingState(predecessor, now) !== "accepted") throw new Error("pairing_predecessor_unavailable");
  if (pairingState(replacement, now) !== "pending") throw new Error("pairing_replacement_not_pending");
  return {
    predecessor: pairingLedgerRowSchema.parse({ ...predecessor, revision: predecessor.revision + 1,
      supersession: { pairingId: replacement.id, at: now.toISOString() }, acceptanceSecret: null }),
    replacement: pairingLedgerRowSchema.parse({ ...replacement, revision: replacement.revision + 1,
      acceptedAt: now.toISOString(), acceptanceSecret: null }),
  };
}

export function revokePairingLedgerRow(raw: PairingLedgerRow, profileId: string, now: Date): PairingLedgerRow {
  const row = pairingLedgerRowSchema.parse(raw);
  if (profileId !== row.approval.destination.profileId) throw new Error("pairing_owner_mismatch");
  pairingState(row, now);
  if (row.revokedAt) return row;
  return pairingLedgerRowSchema.parse({ ...row, revision: row.revision + 1, revokedAt: now.toISOString(), acceptanceSecret: null });
}

export function projectPairingLedgerRow(raw: PairingLedgerRow, profileId: string, now: Date) {
  const row = pairingLedgerRowSchema.parse(raw);
  if (profileId !== row.approval.destination.profileId) throw new Error("pairing_owner_mismatch");
  return {
    schema: "helix.pairing_status.v1" as const, id: row.id, revision: row.revision,
    destinationDigest: pairingDestinationDigest(row.approval.destination),
    chatId: row.approval.chatId, environment: row.approval.environment,
    state: pairingState(row, now), createdAt: row.createdAt,
    invitationExpiresAt: row.invitationExpiresAt, pairingExpiresAt: row.pairingExpiresAt,
    acceptedAt: row.acceptedAt, revokedAt: row.revokedAt,
    ...(row.approval.replacement ? { replacement: row.approval.replacement } : {}),
    ...(row.supersession ? { supersession: row.supersession } : {}),
    executionAuthority: false as const, answerAuthority: false as const,
    // This projection says nothing about current transport, model or game state.
  };
}
