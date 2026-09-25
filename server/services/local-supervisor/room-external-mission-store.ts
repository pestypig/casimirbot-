import crypto from "node:crypto";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from "../helix-ask/realtime-room/room-store/types";

export const ROOM_EXTERNAL_MISSION_TABLE = "helix_room_external_missions";

export class RoomExternalMissionError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = "RoomExternalMissionError";
  }
}

type MissionRow = {
  room_id: string;
  owner_profile_id: string;
  owner_participant_id: string;
  mission_id: string;
  mission_revision: number | string;
  status: "active" | "revoked";
  reasoning_binding_id: string;
  binding_epoch: number | string;
  helix_conversation_id: string;
  binding_mission_id: string | null;
  run_id: string | null;
  request_id: string;
  request_digest: string;
  created_at: Date | string;
  updated_at: Date | string;
  revoked_at: Date | string | null;
};

export type RoomExternalMission = Readonly<{
  schema: "helix.room_external_mission.v1";
  room_id: string;
  owner_profile_id: string;
  owner_participant_id: string;
  mission_id: string;
  mission_revision: number;
  status: "active" | "revoked";
  reasoning_binding_id: string;
  binding_epoch: number;
  helix_conversation_id: string;
  binding_mission_id: string | null;
  run_id: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  execution_authority: false;
  answer_authority: false;
  terminal_eligible: false;
}>;

export type SelectRoomExternalMission = {
  roomId: string;
  ownerProfileId: string;
  ownerParticipantId: string;
  bindingId: string;
  bindingEpoch: number;
  helixConversationId: string;
  bindingMissionId: string | null;
  runId: string | null;
  expectedRevision: number | null;
  requestId: string;
};

export type CurrentRoomExternalMissionIdentity = Pick<SelectRoomExternalMission,
  "roomId" | "ownerProfileId" | "bindingId" | "bindingEpoch" |
  "helixConversationId" | "bindingMissionId" | "runId"> & {
    missionId: string;
    missionRevision: number;
  };

const iso = (value: Date | string | null): string | null => value === null
  ? null : value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const project = (row: MissionRow): RoomExternalMission => ({
  schema: "helix.room_external_mission.v1",
  room_id: row.room_id,
  owner_profile_id: row.owner_profile_id,
  owner_participant_id: row.owner_participant_id,
  mission_id: row.mission_id,
  mission_revision: Number(row.mission_revision),
  status: row.status,
  reasoning_binding_id: row.reasoning_binding_id,
  binding_epoch: Number(row.binding_epoch),
  helix_conversation_id: row.helix_conversation_id,
  binding_mission_id: row.binding_mission_id,
  run_id: row.run_id,
  created_at: iso(row.created_at)!,
  updated_at: iso(row.updated_at)!,
  revoked_at: iso(row.revoked_at),
  execution_authority: false,
  answer_authority: false,
  terminal_eligible: false,
});

const requestDigest = (operation: "select" | "revoke", input: SelectRoomExternalMission | {
  roomId: string; ownerProfileId: string; expectedRevision: number; requestId: string;
}) => crypto.createHash("sha256").update(JSON.stringify([operation, input])).digest("hex");

const readRow = async (db: Queryable, roomId: string, lock = false): Promise<MissionRow | null> => {
  const result = await db.query<MissionRow>(
    `SELECT * FROM helix_room_external_missions WHERE room_id=$1${lock ? " FOR UPDATE" : ""}`,
    [roomId],
  );
  return result.rows[0] ?? null;
};

const isUniqueViolation = (error: unknown): boolean =>
  Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");

/** A server-owned selection, not provider continuation or answer authority. */
export class RoomExternalMissionStore {
  constructor(
    private readonly transaction: typeof withSharedRealtimeRoomTransaction = withSharedRealtimeRoomTransaction,
    private readonly readDatabase: typeof readSharedRealtimeRoomDatabase = readSharedRealtimeRoomDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async inspect(roomId: string): Promise<RoomExternalMission | null> {
    const row = await readRow(await this.readDatabase(), roomId);
    return row ? project(row) : null;
  }

  /** Fresh exact selection check for dispatch and pickup; a saved snapshot
   * alone cannot authorize either boundary after reselection or revoke. */
  async requireCurrent(input: CurrentRoomExternalMissionIdentity): Promise<RoomExternalMission> {
    const current = await this.inspect(input.roomId);
    if (!current || current.status !== "active" ||
        current.mission_id !== input.missionId ||
        current.mission_revision !== input.missionRevision ||
        current.owner_profile_id !== input.ownerProfileId ||
        current.reasoning_binding_id !== input.bindingId ||
        current.binding_epoch !== input.bindingEpoch ||
        current.helix_conversation_id !== input.helixConversationId ||
        current.binding_mission_id !== input.bindingMissionId ||
        current.run_id !== input.runId) {
      throw new RoomExternalMissionError("room_mission_not_current", 409);
    }
    return current;
  }

  async select(input: SelectRoomExternalMission): Promise<RoomExternalMission> {
    const digest = requestDigest("select", input);
    try { return await this.transaction(async db => {
      const prior = await readRow(db, input.roomId, true);
      if (prior && prior.owner_profile_id !== input.ownerProfileId) {
        throw new RoomExternalMissionError("room_mission_owner_mismatch", 403);
      }
      if (prior?.request_id === input.requestId) {
        if (prior.request_digest !== digest) throw new RoomExternalMissionError("room_mission_request_conflict", 409);
        return project(prior);
      }
      if ((prior ? Number(prior.mission_revision) : null) !== input.expectedRevision) {
        throw new RoomExternalMissionError("room_mission_revision_conflict", 409);
      }
      const now = this.now().toISOString();
      const result = prior
        ? await db.query<MissionRow>(`UPDATE helix_room_external_missions SET
            owner_participant_id=$2, mission_revision=mission_revision+1, status='active',
            reasoning_binding_id=$3, binding_epoch=$4, helix_conversation_id=$5,
            binding_mission_id=$6, run_id=$7, request_id=$8, request_digest=$9,
            updated_at=$10, revoked_at=NULL
          WHERE room_id=$1 AND owner_profile_id=$11 AND mission_revision=$12
          RETURNING *`, [input.roomId, input.ownerParticipantId, input.bindingId, input.bindingEpoch,
            input.helixConversationId, input.bindingMissionId, input.runId, input.requestId,
            digest, now, input.ownerProfileId, input.expectedRevision])
        : await db.query<MissionRow>(`INSERT INTO helix_room_external_missions
            (room_id, owner_profile_id, owner_participant_id, mission_id,
             mission_revision, status, reasoning_binding_id, binding_epoch,
             helix_conversation_id, binding_mission_id, run_id, request_id,
             request_digest, created_at, updated_at, revoked_at)
          VALUES ($1,$2,$3,$4,1,'active',$5,$6,$7,$8,$9,$10,$11,$12,$12,NULL)
          RETURNING *`, [input.roomId, input.ownerProfileId, input.ownerParticipantId,
            `room_mission:${crypto.randomUUID()}`, input.bindingId, input.bindingEpoch,
            input.helixConversationId, input.bindingMissionId, input.runId, input.requestId,
            digest, now]);
      if (!result.rows[0]) throw new RoomExternalMissionError("room_mission_revision_conflict", 409);
      return project(result.rows[0]);
    }, { requireLocalSnapshot: true, snapshotTables: [ROOM_EXTERNAL_MISSION_TABLE] }); }
    catch (error) {
      // Two initial selections can both observe an empty row. The room PK
      // arbitrates; inspect only after rollback to recognize an exact retry.
      if (!isUniqueViolation(error)) throw error;
      const committed = await readRow(await this.readDatabase(), input.roomId);
      if (committed?.owner_profile_id === input.ownerProfileId &&
          committed.request_id === input.requestId && committed.request_digest === digest) {
        return project(committed);
      }
      throw new RoomExternalMissionError("room_mission_revision_conflict", 409);
    }
  }

  async revoke(input: { roomId: string; ownerProfileId: string; expectedRevision: number; requestId: string }): Promise<RoomExternalMission> {
    const digest = requestDigest("revoke", input);
    return this.transaction(async db => {
      const prior = await readRow(db, input.roomId, true);
      if (!prior) throw new RoomExternalMissionError("room_mission_not_found", 404);
      if (prior.owner_profile_id !== input.ownerProfileId) throw new RoomExternalMissionError("room_mission_owner_mismatch", 403);
      if (prior.request_id === input.requestId) {
        if (prior.request_digest !== digest) throw new RoomExternalMissionError("room_mission_request_conflict", 409);
        return project(prior);
      }
      if (prior.status !== "active" || Number(prior.mission_revision) !== input.expectedRevision) {
        throw new RoomExternalMissionError("room_mission_revision_conflict", 409);
      }
      const now = this.now().toISOString();
      const result = await db.query<MissionRow>(`UPDATE helix_room_external_missions SET
          mission_revision=mission_revision+1, status='revoked', request_id=$3,
          request_digest=$4, updated_at=$5, revoked_at=$5
        WHERE room_id=$1 AND owner_profile_id=$2 AND mission_revision=$6 AND status='active'
        RETURNING *`, [input.roomId, input.ownerProfileId, input.requestId, digest, now, input.expectedRevision]);
      if (!result.rows[0]) throw new RoomExternalMissionError("room_mission_revision_conflict", 409);
      return project(result.rows[0]);
    }, { requireLocalSnapshot: true, snapshotTables: [ROOM_EXTERNAL_MISSION_TABLE] });
  }
}

export const roomExternalMissionStore = new RoomExternalMissionStore();
