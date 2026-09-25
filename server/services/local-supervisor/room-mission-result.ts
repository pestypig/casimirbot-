import crypto from "node:crypto";
import type { Pool } from "pg";
import { z } from "zod";
import { ensureDatabase, getPool, requireDurableDatabaseSnapshot } from "../../db/client";
import { nativePairingVault, PairingStorageError,
  type PairingIdentityVault } from "./pairing-ledger-repository";
import { roomMissionSteeringEnvelopeSchema } from "./room-mission-steering";

export const ROOM_MISSION_RESULT_TABLE = "helix_room_external_task_results";
const ref = z.string().trim().min(3).max(320).refine(value => !/[\r\n\t]/u.test(value));
const sha256 = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");
const resultId = (eventRef: string): string => `room_task_result:${sha256(eventRef).slice(0, 32)}`;

export const roomMissionResultRequestSchema = z.object({
  steeringEventRef: ref,
  status: z.enum(["completed", "unable"]),
  resultText: z.string().trim().min(1).max(12_000),
  evidenceRefs: z.array(ref).max(16).default([]),
}).strict();
export type RoomMissionResultRequest = z.input<typeof roomMissionResultRequestSchema>;

export const roomMissionResultRecordSchema = z.object({
  schema: z.literal("helix.room_mission_task_result.v1"),
  resultId: ref,
  ownerProfileId: ref,
  envelope: roomMissionSteeringEnvelopeSchema,
  request: roomMissionResultRequestSchema,
  requestDigest: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string().datetime(),
}).strict().superRefine((row, ctx) => {
  if (row.ownerProfileId !== row.envelope.ownerProfileId ||
      row.resultId !== resultId(row.request.steeringEventRef) ||
      row.requestDigest !== digestRequest(row.envelope, row.request)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "room_task_result_identity_invalid" });
  }
});
export type RoomMissionResultRecord = z.infer<typeof roomMissionResultRecordSchema>;

function digestRequest(envelope: z.infer<typeof roomMissionSteeringEnvelopeSchema>,
  request: z.output<typeof roomMissionResultRequestSchema>): string {
  return sha256(JSON.stringify([envelope, request.steeringEventRef, request.status,
    request.resultText, request.evidenceRefs]));
}

export function createRoomMissionResult(input: {
  ownerProfileId: string;
  envelope: z.infer<typeof roomMissionSteeringEnvelopeSchema>;
  request: RoomMissionResultRequest;
  now: Date;
}): RoomMissionResultRecord {
  const request = roomMissionResultRequestSchema.parse(input.request);
  const envelope = roomMissionSteeringEnvelopeSchema.parse(input.envelope);
  return roomMissionResultRecordSchema.parse({
    schema: "helix.room_mission_task_result.v1",
    resultId: resultId(request.steeringEventRef),
    ownerProfileId: input.ownerProfileId,
    envelope, request,
    requestDigest: digestRequest(envelope, request),
    createdAt: input.now.toISOString(),
  });
}

type Stored = { result_id: string; owner_profile_id: string; room_id: string;
  room_mission_id: string; room_mission_revision: number; steering_event_ref: string;
  request_digest: string; encrypted_payload: string; encryption_key_id: string };
const aad = (row: Pick<Stored, "result_id" | "owner_profile_id" | "steering_event_ref">): string =>
  JSON.stringify(["helix.room_mission_task_result.v1", row.owner_profile_id,
    row.steering_event_ref, row.result_id]);

export class RoomMissionResultError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = "RoomMissionResultError";
  }
}

/** Storage only; exact task, room, mission and consent admission belongs to
 * the caller before and after commit. No result is public terminal authority. */
export class RoomMissionResultRepository {
  constructor(private readonly db: Pick<Pool, "query">,
    private readonly vault: PairingIdentityVault,
    private readonly flush: () => Promise<void>) {}

  /** Candidate references only. The caller must perform a current authorized
   * source read before projecting even a receipt to the browser. */
  async listEventRefs(input: { ownerProfileId: string; roomId: string;
    missionId: string; missionRevision: number }): Promise<string[]> {
    await this.flush();
    const rows = await this.db.query<{ steering_event_ref: string }>(
      `SELECT steering_event_ref FROM helix_room_external_task_results
       WHERE owner_profile_id=$1 AND room_id=$2 AND room_mission_id=$3 AND room_mission_revision=$4
       ORDER BY created_at DESC, result_id DESC LIMIT 21`,
      [input.ownerProfileId, input.roomId, input.missionId, input.missionRevision]);
    return rows.rows.map(row => row.steering_event_ref);
  }

  async read(ownerProfileId: string, steeringEventRef: string): Promise<RoomMissionResultRecord | null> {
    await this.flush();
    const result = await this.db.query<Stored>(`SELECT * FROM helix_room_external_task_results
      WHERE owner_profile_id=$1 AND steering_event_ref=$2`, [ownerProfileId, steeringEventRef]);
    const stored = result.rows[0];
    if (!stored) return null;
    let raw: unknown;
    try { raw = await this.vault.open({ encryptedValue: stored.encrypted_payload,
      keyId: stored.encryption_key_id }, aad(stored)); }
    catch { throw new PairingStorageError("pairing_storage_unreadable"); }
    const parsed = roomMissionResultRecordSchema.safeParse(raw);
    if (!parsed.success) throw new PairingStorageError("pairing_storage_invalid");
    const row = parsed.data;
    if (row.resultId !== stored.result_id || row.ownerProfileId !== stored.owner_profile_id ||
        row.envelope.roomId !== stored.room_id ||
        row.envelope.roomMissionId !== stored.room_mission_id ||
        row.envelope.roomMissionRevision !== Number(stored.room_mission_revision) ||
        row.request.steeringEventRef !== stored.steering_event_ref ||
        row.requestDigest !== stored.request_digest) {
      throw new PairingStorageError("pairing_storage_identity_mismatch");
    }
    return row;
  }

  async submit(row: RoomMissionResultRecord): Promise<RoomMissionResultRecord> {
    const parsed = roomMissionResultRecordSchema.parse(row);
    const prior = await this.read(parsed.ownerProfileId, parsed.request.steeringEventRef);
    if (prior) {
      if (prior.requestDigest !== parsed.requestDigest) {
        throw new RoomMissionResultError("room_task_result_request_conflict", 409);
      }
      return prior;
    }
    const metadata = { result_id: parsed.resultId,
      owner_profile_id: parsed.ownerProfileId,
      steering_event_ref: parsed.request.steeringEventRef };
    const sealed = await this.vault.seal(parsed, aad(metadata));
    await this.db.query(`INSERT INTO helix_room_external_task_results
      (result_id, owner_profile_id, room_id, room_mission_id,
       room_mission_revision, steering_event_ref, request_digest,
       encrypted_payload, encryption_key_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
    [parsed.resultId, parsed.ownerProfileId, parsed.envelope.roomId,
      parsed.envelope.roomMissionId, parsed.envelope.roomMissionRevision,
      parsed.request.steeringEventRef, parsed.requestDigest,
      sealed.encryptedValue, sealed.keyId]);
    await this.flush();
    const committed = await this.read(parsed.ownerProfileId, parsed.request.steeringEventRef);
    if (!committed) throw new RoomMissionResultError("room_task_result_commit_unconfirmed", 503);
    if (committed.requestDigest !== parsed.requestDigest) {
      throw new RoomMissionResultError("room_task_result_request_conflict", 409);
    }
    return committed;
  }
}

export const projectRoomMissionResultReceipt = (row: RoomMissionResultRecord) => ({
  schema: "helix.room_mission_task_result_receipt.v1" as const,
  result_ref: row.resultId,
  steering_event_ref: row.request.steeringEventRef,
  room_id: row.envelope.roomId,
  room_mission_id: row.envelope.roomMissionId,
  room_mission_revision: row.envelope.roomMissionRevision,
  status: row.request.status,
  result_sha256: sha256(row.request.resultText),
  created_at: row.createdAt,
  observation_recorded: true as const,
  room_publication_attempted: false as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
});

export async function createNativeRoomMissionResultRepository(): Promise<RoomMissionResultRepository> {
  await ensureDatabase();
  await requireDurableDatabaseSnapshot([ROOM_MISSION_RESULT_TABLE]);
  return new RoomMissionResultRepository(getPool(), nativePairingVault,
    () => requireDurableDatabaseSnapshot([ROOM_MISSION_RESULT_TABLE]));
}
