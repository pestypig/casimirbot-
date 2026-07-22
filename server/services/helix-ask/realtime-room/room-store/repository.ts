import {
  HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS,
  HELIX_SHARED_REALTIME_ROOM_REQUIRED_VOICE_CONSENTS,
  HELIX_SHARED_REALTIME_ROOM_SCHEMA,
  type HelixSharedRealtimeRoom,
  type HelixSharedRealtimeRoomParticipant,
  type HelixSharedRealtimeRoomStatus,
} from "@shared/helix-shared-realtime-room";
import { SharedRealtimeRoomDomainError } from "./domain-error";
import type {
  AuditMetadata,
  MemberRow,
  ProjectedMemberRow,
  Queryable,
  RoomRow,
} from "./types";
import {
  createId,
  effectiveMemberPresence,
  iso,
  isoOrNull,
  memberPresence,
  memberRole,
  normalizeConsent,
  nowIso,
  roomStatus,
} from "./values";

export const readRoomRow = async (
  db: Queryable,
  roomId: string,
  forUpdate = false,
): Promise<RoomRow | null> => {
  const { rows } = await db.query<RoomRow>(
    `SELECT * FROM helix_shared_realtime_rooms WHERE room_id = $1${forUpdate ? " FOR UPDATE" : ""};`,
    [roomId],
  );
  return rows[0] ?? null;
};

export const readMemberRow = async (
  db: Queryable,
  roomId: string,
  profileId: string,
  forUpdate = false,
): Promise<MemberRow | null> => {
  const { rows } = await db.query<MemberRow>(
    `
      SELECT *
      FROM helix_shared_realtime_room_members
      WHERE room_id = $1 AND profile_id = $2
      ${forUpdate ? "FOR UPDATE" : ""};
    `,
    [roomId, profileId],
  );
  return rows[0] ?? null;
};

export const assertProfileExists = async (
  db: Queryable,
  profileId: string,
): Promise<void> => {
  const { rows } = await db.query<{ profile_id: string }>(
    `SELECT profile_id FROM helix_accounts WHERE profile_id = $1 AND deleted_at IS NULL LIMIT 1;`,
    [profileId],
  );
  if (!rows[0]) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_auth_required",
      401,
      "An active account profile is required.",
    );
  }
};

export const assertAccessibleMember = async (
  db: Queryable,
  roomId: string,
  profileId: string,
  forUpdate = false,
): Promise<{ room: RoomRow; member: MemberRow }> => {
  const room = await readRoomRow(db, roomId, forUpdate);
  if (!room) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_not_found",
      404,
      "Shared Realtime room not found.",
    );
  }
  const member = await readMemberRow(db, roomId, profileId, forUpdate);
  if (!member || memberPresence(member.presence) === "left") {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_not_found",
      404,
      "Shared Realtime room not found.",
    );
  }
  return { room, member };
};

export const assertOpenRoom = (room: RoomRow): void => {
  if (roomStatus(room.status) === "closed") {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_closed",
      409,
      "The shared Realtime room is closed.",
    );
  }
};

export const insertAuditEvent = async (input: {
  db: Queryable;
  roomId: string;
  actorParticipantId?: string | null;
  eventType: string;
  metadata?: AuditMetadata;
  createdAt?: string;
}): Promise<void> => {
  await input.db.query(
    `
      INSERT INTO helix_shared_realtime_room_events (
        event_id, room_id, actor_participant_id, event_type, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6);
    `,
    [
      createId("event"),
      input.roomId,
      input.actorParticipantId ?? null,
      input.eventType,
      JSON.stringify(input.metadata ?? {}),
      input.createdAt ?? nowIso(),
    ],
  );
};

export const activeMemberRows = async (
  db: Queryable,
  roomId: string,
): Promise<MemberRow[]> => {
  const { rows } = await db.query<MemberRow>(
    `
      SELECT *
      FROM helix_shared_realtime_room_members
      WHERE room_id = $1 AND presence <> 'left'
      ORDER BY slot_number ASC;
    `,
    [roomId],
  );
  return rows;
};

export const refreshRoomReadinessStatus = async (
  db: Queryable,
  roomId: string,
): Promise<HelixSharedRealtimeRoomStatus> => {
  const room = await readRoomRow(db, roomId);
  if (!room) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_not_found",
      404,
      "Shared Realtime room not found.",
    );
  }
  const current = roomStatus(room.status);
  if (current === "closed") return current;
  const members = await activeMemberRows(db, roomId);
  const allPresent = members.every((member) => effectiveMemberPresence(member) === "present");
  const hasAllVoiceConsent =
    members.length === HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS &&
    allPresent &&
    members.every((member) => {
      const consent = normalizeConsent(member.consent);
      return HELIX_SHARED_REALTIME_ROOM_REQUIRED_VOICE_CONSENTS.every((key) => consent[key]);
    });
  const next: HelixSharedRealtimeRoomStatus =
    members.length < HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS
      ? "waiting_for_participant"
      : hasAllVoiceConsent
        ? current === "active" ? "active" : "ready"
        : "waiting_for_consent";
  if (next !== current) {
    await db.query(
      `UPDATE helix_shared_realtime_rooms SET status = $2, updated_at = now() WHERE room_id = $1;`,
      [roomId, next],
    );
  }
  return next;
};

const projectedMembers = async (
  db: Queryable,
  roomId: string,
): Promise<ProjectedMemberRow[]> => {
  const { rows } = await db.query<ProjectedMemberRow>(
    `
      SELECT m.*, a.display_name
      FROM helix_shared_realtime_room_members m
      JOIN helix_accounts a ON a.profile_id = m.profile_id AND a.deleted_at IS NULL
      WHERE m.room_id = $1 AND m.presence <> 'left'
      ORDER BY m.slot_number ASC;
    `,
    [roomId],
  );
  return rows;
};

export const projectRoom = async (
  db: Queryable,
  room: RoomRow,
  profileId: string,
): Promise<HelixSharedRealtimeRoom> => {
  const memberRows = await projectedMembers(db, room.room_id);
  const self = memberRows.find((member) => member.profile_id === profileId);
  if (!self) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_not_found",
      404,
      "Shared Realtime room not found.",
    );
  }
  const participants: HelixSharedRealtimeRoomParticipant[] = memberRows.map((member) => ({
    participant_id: member.participant_id,
    display_name: member.display_name,
    role: memberRole(member.member_role),
    presence: effectiveMemberPresence(member),
    consent: normalizeConsent(member.consent),
    joined_at: iso(member.joined_at),
    last_seen_at: iso(member.last_seen_at),
  }));
  const missingConsentByParticipant: HelixSharedRealtimeRoom["readiness"]["missing_consent_by_participant"] = {};
  for (const participant of participants) {
    const missing = HELIX_SHARED_REALTIME_ROOM_REQUIRED_VOICE_CONSENTS.filter(
      (key) => !participant.consent[key],
    );
    if (missing.length > 0) missingConsentByParticipant[participant.participant_id] = [...missing];
  }
  const status = roomStatus(room.status);
  const ready =
    status !== "closed" &&
    participants.length === HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS &&
    participants.every((participant) => participant.presence === "present") &&
    Object.keys(missingConsentByParticipant).length === 0;
  const updatedAt = iso(room.updated_at);
  return {
    schema: HELIX_SHARED_REALTIME_ROOM_SCHEMA,
    room_id: room.room_id,
    title: room.title,
    status,
    max_participants: HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS,
    self_participant_id: self.participant_id,
    participants,
    readiness: {
      participant_count: participants.length,
      required_participant_count: HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS,
      ready,
      missing_participant_count: Math.max(
        0,
        HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS - participants.length,
      ),
      missing_consent_by_participant: missingConsentByParticipant,
    },
    runtime: {
      runtime_id: null,
      state: status === "closed" ? "closed" : "idle",
      topology: "single_shared_model",
      transport_owner: "unbound",
      model: null,
      active_speaker_participant_id: null,
      provider_session_ref_hash: null,
      realtime_session_ref_hash: null,
      reserved_by_participant_id: null,
      started_at: null,
      updated_at: updatedAt,
      limitations: status === "closed"
        ? ["room_closed", "room_media_bridge_not_connected"]
        : ["room_media_bridge_not_connected"],
    },
    created_at: iso(room.created_at),
    updated_at: updatedAt,
    closed_at: isoOrNull(room.closed_at),
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
