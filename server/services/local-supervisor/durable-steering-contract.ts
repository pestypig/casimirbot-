import crypto from "node:crypto";
import { z } from "zod";
import { pairingState, type PairingLedgerRow } from "./pairing-ledger-contract";
import { roomMissionSteeringEnvelopeSchema } from "./room-mission-steering";

const ref = z.string().trim().min(3).max(320);
const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
export const durableSteeringRequestSchema = z.object({
  clientEventRef: ref,
  origin: z.enum(["typed", "gpt_live_finalized", "agent_submitted"]),
  instructionText: z.string().trim().min(1).max(4000),
  expiresInSeconds: z.number().int().min(30).max(3600).default(600),
  roomMission: roomMissionSteeringEnvelopeSchema.optional(),
}).strict();
export type DurableSteeringRequest = z.input<typeof durableSteeringRequestSchema>;
export const durableSteeringRecordSchema = z.object({
  schema: z.literal("helix.durable_steering.v1"),
  id: ref, ownerProfileId: ref, pairingId: ref, chatId: ref,
  environment: z.object({ roomId: ref, runId: ref }).strict().nullable(),
  cursor: z.number().int().positive(), revision: z.number().int().positive(),
  request: durableSteeringRequestSchema,
  requestDigest: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string().datetime(), expiresAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().nullable(),
}).strict().superRefine((row, ctx) => {
  // This schema permits one immutable creation and one acknowledgement only.
  // Retries do not advance revision or turn an acknowledged event pending again.
  if (row.revision !== (row.acknowledgedAt === null ? 1 : 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "steering_revision_invalid" });
  }
  const created = Date.parse(row.createdAt), expiry = Date.parse(row.expiresAt);
  if (expiry <= created || expiry > created + row.request.expiresInSeconds * 1000 ||
      (row.acknowledgedAt && (Date.parse(row.acknowledgedAt) < created || Date.parse(row.acknowledgedAt) >= expiry))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "steering_time_invalid" });
  }
  if (row.requestDigest !== requestDigest(row.ownerProfileId, row.pairingId, row.chatId, row.environment, row.request) ||
      row.id !== eventId(row.ownerProfileId, row.pairingId, row.request.clientEventRef)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "steering_identity_invalid" });
  }
});
export type DurableSteeringRecord = z.infer<typeof durableSteeringRecordSchema>;
const eventId = (owner: string, pairing: string, event: string) =>
  `reasoning_steering:${hash(JSON.stringify([owner, pairing, event]))}`;
function requestDigest(owner: string, pairing: string, chat: string,
  environment: PairingLedgerRow["approval"]["environment"], request: z.output<typeof durableSteeringRequestSchema>) {
  return hash(JSON.stringify([owner, pairing, chat, environment?.roomId ?? null, environment?.runId ?? null,
    request.clientEventRef, request.origin, request.instructionText, request.expiresInSeconds,
    request.roomMission ?? null]));
}
function requireAccepted(grant: PairingLedgerRow, now: Date) {
  const state = pairingState(grant, now);
  if (state !== "accepted") throw new Error(`pairing_${state === "pending" ? "not_accepted" : state}`);
}
// Pure server policy only: callers authenticate origin/destination, allocate the
// cursor atomically, encrypt, commit and revalidate admission before delivery.
export function createDurableSteering(grant: PairingLedgerRow, raw: DurableSteeringRequest, cursor: number, now: Date) {
  requireAccepted(grant, now);
  const request = durableSteeringRequestSchema.parse(raw);
  const owner = grant.approval.destination.profileId;
  return durableSteeringRecordSchema.parse({ schema: "helix.durable_steering.v1",
    id: eventId(owner, grant.id, request.clientEventRef), ownerProfileId: owner, pairingId: grant.id,
    chatId: grant.approval.chatId, environment: grant.approval.environment, cursor, revision: 1,
    request, requestDigest: requestDigest(owner, grant.id, grant.approval.chatId, grant.approval.environment, request),
    createdAt: now.toISOString(), expiresAt: new Date(Math.min(now.getTime() + request.expiresInSeconds * 1000,
      Date.parse(grant.pairingExpiresAt))).toISOString(), acknowledgedAt: null });
}
export function validateDurableSteering(grant: PairingLedgerRow, raw: DurableSteeringRecord, now: Date) {
  requireAccepted(grant, now);
  const row = durableSteeringRecordSchema.parse(raw);
  if (row.ownerProfileId !== grant.approval.destination.profileId || row.pairingId !== grant.id ||
      row.chatId !== grant.approval.chatId || JSON.stringify(row.environment) !== JSON.stringify(grant.approval.environment) ||
      Date.parse(row.createdAt) < Date.parse(grant.acceptedAt!) || Date.parse(row.expiresAt) > Date.parse(grant.pairingExpiresAt)) {
    throw new Error("steering_scope_mismatch");
  }
  if (now.getTime() < Date.parse(row.createdAt) || (row.acknowledgedAt && now.getTime() < Date.parse(row.acknowledgedAt))) {
    throw new Error("steering_clock_before_transition");
  }
  return row;
}
export function replayDurableSteering(grant: PairingLedgerRow, existing: DurableSteeringRecord, request: DurableSteeringRequest, now: Date) {
  const row = validateDurableSteering(grant, existing, now);
  const parsed = durableSteeringRequestSchema.parse(request);
  if (row.requestDigest !== requestDigest(row.ownerProfileId, row.pairingId, row.chatId, row.environment, parsed)) {
    throw new Error("reasoning_steering_request_conflict");
  }
  return row;
}
export function acknowledgeDurableSteering(grant: PairingLedgerRow, existing: DurableSteeringRecord, now: Date) {
  const row = validateDurableSteering(grant, existing, now);
  if (row.acknowledgedAt) return row;
  if (now.getTime() >= Date.parse(row.expiresAt)) throw new Error("reasoning_steering_expired");
  return durableSteeringRecordSchema.parse({ ...row, revision: row.revision + 1, acknowledgedAt: now.toISOString() });
}
