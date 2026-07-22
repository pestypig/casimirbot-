import {
  buildDefaultHelixSharedRealtimeRoomConsent,
  HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS,
  type HelixSharedRealtimeRoom,
} from "@shared/helix-shared-realtime-room";
import { readSharedRealtimeRoomDatabase, withSharedRealtimeRoomTransaction } from "./database";
import {
  isSharedRealtimeRoomDomainError,
  SharedRealtimeRoomDomainError,
} from "./domain-error";
import {
  assertAccessibleMember,
  assertProfileExists,
  insertAuditEvent,
  projectRoom,
  readRoomRow,
} from "./repository";
import type { ProjectedMemberRow, SharedRealtimeRoomMembership } from "./types";
import {
  cleanRequired,
  createId,
  effectiveMemberPresence,
  memberPresence,
  memberRole,
  normalizeConsent,
  normalizeTitle,
  nowIso,
  roomStatus,
} from "./values";

export async function createSharedRealtimeRoom(input: {
  ownerProfileId: string;
  title?: string | null;
}): Promise<HelixSharedRealtimeRoom> {
  const ownerProfileId = cleanRequired(input.ownerProfileId, "ownerProfileId");
  const title = normalizeTitle(input.title);
  return withSharedRealtimeRoomTransaction(async (client) => {
    await assertProfileExists(client, ownerProfileId);
    const createdAt = nowIso();
    const roomId = createId("room");
    const participantId = createId("participant");
    const consent = buildDefaultHelixSharedRealtimeRoomConsent();
    await client.query(
      `
        INSERT INTO helix_shared_realtime_rooms (
          room_id, owner_profile_id, title, status, max_participants, created_at, updated_at
        ) VALUES ($1, $2, $3, 'waiting_for_participant', $4, $5, $5);
      `,
      [roomId, ownerProfileId, title, HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS, createdAt],
    );
    await client.query(
      `
        INSERT INTO helix_shared_realtime_room_members (
          room_id, slot_number, profile_id, participant_id, member_role, presence,
          consent, joined_at, last_seen_at, updated_at
        ) VALUES ($1, 1, $2, $3, 'owner', 'present', $4::jsonb, $5, $5, $5);
      `,
      [roomId, ownerProfileId, participantId, JSON.stringify(consent), createdAt],
    );
    await insertAuditEvent({
      db: client,
      roomId,
      actorParticipantId: participantId,
      eventType: "room_created",
      metadata: {
        slot_number: 1,
        max_participants: HELIX_SHARED_REALTIME_ROOM_MAX_PARTICIPANTS,
      },
      createdAt,
    });
    const room = await readRoomRow(client, roomId);
    if (!room) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_unavailable",
        503,
        "The shared Realtime room could not be created.",
      );
    }
    return projectRoom(client, room, ownerProfileId);
  });
}

export async function listSharedRealtimeRooms(input: {
  profileId: string;
}): Promise<HelixSharedRealtimeRoom[]> {
  const profileId = cleanRequired(input.profileId, "profileId");
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = await db.query<{ room_id: string }>(
    `
      SELECT r.room_id
      FROM helix_shared_realtime_rooms r
      JOIN helix_shared_realtime_room_members m ON m.room_id = r.room_id
      WHERE m.profile_id = $1 AND m.presence <> 'left'
      ORDER BY r.updated_at DESC;
    `,
    [profileId],
  );
  const rooms: HelixSharedRealtimeRoom[] = [];
  for (const item of rows) {
    const room = await readRoomRow(db, item.room_id);
    if (!room) continue;
    try {
      rooms.push(await projectRoom(db, room, profileId));
    } catch (error) {
      if (!isSharedRealtimeRoomDomainError(error) || error.code !== "shared_realtime_room_not_found") {
        throw error;
      }
    }
  }
  return rooms;
}

export async function readSharedRealtimeRoom(input: {
  roomId: string;
  profileId: string;
}): Promise<HelixSharedRealtimeRoom> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const profileId = cleanRequired(input.profileId, "profileId");
  const db = await readSharedRealtimeRoomDatabase();
  const { room } = await assertAccessibleMember(db, roomId, profileId);
  return projectRoom(db, room, profileId);
}

export async function readSharedRealtimeRoomMembership(input: {
  roomId: string;
  profileId: string;
}): Promise<SharedRealtimeRoomMembership | null> {
  const roomId = input.roomId.trim();
  const profileId = input.profileId.trim();
  if (!roomId || !profileId) return null;
  const db = await readSharedRealtimeRoomDatabase();
  const room = await readRoomRow(db, roomId);
  if (!room) return null;
  const { rows } = await db.query<ProjectedMemberRow>(
    `
      SELECT m.*, a.display_name
      FROM helix_shared_realtime_room_members m
      JOIN helix_accounts a ON a.profile_id = m.profile_id AND a.deleted_at IS NULL
      WHERE m.room_id = $1 AND m.profile_id = $2 AND m.presence <> 'left'
      LIMIT 1;
    `,
    [roomId, profileId],
  );
  const member = rows[0];
  if (!member) return null;
  const presence = effectiveMemberPresence(member);
  if (presence === "left") return null;
  return {
    roomId,
    profileId,
    participantId: member.participant_id,
    displayName: member.display_name,
    role: memberRole(member.member_role),
    presence,
    consent: normalizeConsent(member.consent),
    roomStatus: roomStatus(room.status),
  };
}
