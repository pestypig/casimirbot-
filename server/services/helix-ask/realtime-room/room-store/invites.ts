import {
  buildDefaultHelixSharedRealtimeRoomConsent,
  type HelixSharedRealtimeRoom,
} from "@shared/helix-shared-realtime-room";
import { withSharedRealtimeRoomTransaction } from "./database";
import { SharedRealtimeRoomDomainError } from "./domain-error";
import {
  assertAccessibleMember,
  assertOpenRoom,
  assertProfileExists,
  insertAuditEvent,
  projectRoom,
  readMemberRow,
  readRoomRow,
  refreshRoomReadinessStatus,
} from "./repository";
import type { InviteRow, SharedRealtimeRoomInviteResult } from "./types";
import {
  cleanRequired,
  createId,
  createInviteCode,
  hashInviteCode,
  isUniqueViolation,
  memberPresence,
  memberRole,
  normalizeInviteTtl,
  nowIso,
} from "./values";

export async function createSharedRealtimeRoomInvite(input: {
  roomId: string;
  ownerProfileId: string;
  expiresInMs?: number | null;
}): Promise<SharedRealtimeRoomInviteResult> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const ownerProfileId = cleanRequired(input.ownerProfileId, "ownerProfileId");
  const ttlMs = normalizeInviteTtl(input.expiresInMs);
  return withSharedRealtimeRoomTransaction(async (client) => {
    const { room, member } = await assertAccessibleMember(client, roomId, ownerProfileId, true);
    assertOpenRoom(room);
    if (memberRole(member.member_role) !== "owner") {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_forbidden",
        403,
        "Only the room owner can create an invitation.",
      );
    }
    await client.query(
      `
        UPDATE helix_shared_realtime_room_invites
        SET status = 'expired'
        WHERE room_id = $1 AND status = 'active' AND expires_at <= now();
      `,
      [roomId],
    );
    const inviteCode = createInviteCode();
    const inviteId = createId("invite");
    const createdAt = nowIso();
    const inviteExpiresAt = new Date(Date.now() + ttlMs).toISOString();
    await client.query(
      `
        INSERT INTO helix_shared_realtime_room_invites (
          invite_id, room_id, created_by_profile_id, token_hash, status, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, 'active', $5, $6);
      `,
      [inviteId, roomId, ownerProfileId, hashInviteCode(inviteCode), inviteExpiresAt, createdAt],
    );
    await insertAuditEvent({
      db: client,
      roomId,
      actorParticipantId: member.participant_id,
      eventType: "invite_created",
      metadata: { invite_id: inviteId, expires_at: inviteExpiresAt },
      createdAt,
    });
    const refreshed = await readRoomRow(client, roomId);
    if (!refreshed) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_unavailable",
        503,
        "The shared Realtime room invitation could not be created.",
      );
    }
    return {
      room: await projectRoom(client, refreshed, ownerProfileId),
      inviteCode,
      inviteExpiresAt,
    };
  });
}

export async function joinSharedRealtimeRoom(input: {
  profileId: string;
  inviteCode: string;
  roomId?: string | null;
}): Promise<HelixSharedRealtimeRoom> {
  const profileId = cleanRequired(input.profileId, "profileId");
  const inviteCode = cleanRequired(input.inviteCode, "inviteCode");
  const expectedRoomId = input.roomId?.trim() || null;
  if (inviteCode.length > 256) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invite_invalid",
      400,
      "The shared Realtime room invitation is invalid.",
    );
  }
  try {
    return await withSharedRealtimeRoomTransaction(async (client) => {
      await assertProfileExists(client, profileId);
      const tokenHash = hashInviteCode(inviteCode);

      // Resolve the room first without taking an invite lock, then lock in the
      // same room -> invite order used by invite creation. The second read is
      // authoritative and closes the race with redemption/revocation.
      const { rows: lookupRows } = await client.query<Pick<InviteRow, "room_id">>(
        `SELECT room_id FROM helix_shared_realtime_room_invites WHERE token_hash = $1;`,
        [tokenHash],
      );
      const roomId = lookupRows[0]?.room_id;
      if (!roomId || (expectedRoomId && expectedRoomId !== roomId)) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_invite_invalid",
          404,
          "The shared Realtime room invitation is invalid.",
        );
      }
      const room = await readRoomRow(client, roomId, true);
      if (!room) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_not_found",
          404,
          "Shared Realtime room not found.",
        );
      }
      const { rows: inviteRows } = await client.query<InviteRow>(
        `
          SELECT *
          FROM helix_shared_realtime_room_invites
          WHERE token_hash = $1 AND room_id = $2
          FOR UPDATE;
        `,
        [tokenHash, roomId],
      );
      const invite = inviteRows[0];
      if (!invite) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_invite_invalid",
          404,
          "The shared Realtime room invitation is invalid.",
        );
      }
      if (invite.status === "redeemed") {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_invite_redeemed",
          409,
          "The shared Realtime room invitation has already been redeemed.",
        );
      }
      if (invite.status === "expired" || new Date(invite.expires_at).getTime() <= Date.now()) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_invite_expired",
          409,
          "The shared Realtime room invitation has expired.",
        );
      }
      if (invite.status !== "active") {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_invite_invalid",
          409,
          "The shared Realtime room invitation is no longer active.",
        );
      }
      assertOpenRoom(room);
      const existingMember = await readMemberRow(client, roomId, profileId, true);
      if (existingMember && memberPresence(existingMember.presence) !== "left") {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_invalid_request",
          409,
          "This account is already a room member.",
        );
      }
      const createdAt = nowIso();
      const participantId = createId("participant");
      const consent = buildDefaultHelixSharedRealtimeRoomConsent();
      const { rows: joinedRows } = await client.query<{ participant_id: string }>(
        `
          INSERT INTO helix_shared_realtime_room_members (
            room_id, slot_number, profile_id, participant_id, member_role, presence,
            consent, joined_at, last_seen_at, updated_at, left_at
          ) VALUES ($1, 2, $2, $3, 'participant', 'present', $4::jsonb, $5, $5, $5, NULL)
          ON CONFLICT (room_id, slot_number) DO UPDATE SET
            profile_id = EXCLUDED.profile_id,
            participant_id = EXCLUDED.participant_id,
            member_role = 'participant',
            presence = 'present',
            consent = EXCLUDED.consent,
            joined_at = EXCLUDED.joined_at,
            last_seen_at = EXCLUDED.last_seen_at,
            updated_at = EXCLUDED.updated_at,
            left_at = NULL
          WHERE helix_shared_realtime_room_members.presence = 'left'
          RETURNING participant_id;
        `,
        [roomId, profileId, participantId, JSON.stringify(consent), createdAt],
      );
      if (!joinedRows[0]) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_full",
          409,
          "The shared Realtime room already has two participants.",
        );
      }
      await client.query(
        `
          UPDATE helix_shared_realtime_room_invites
          SET
            status = CASE WHEN invite_id = $2 THEN 'redeemed' ELSE 'revoked' END,
            redeemed_by_profile_id = CASE WHEN invite_id = $2 THEN $3 ELSE redeemed_by_profile_id END,
            redeemed_at = CASE WHEN invite_id = $2 THEN $4 ELSE redeemed_at END,
            revoked_at = CASE WHEN invite_id <> $2 THEN $4 ELSE revoked_at END
          WHERE room_id = $1 AND status = 'active';
        `,
        [roomId, invite.invite_id, profileId, createdAt],
      );
      await insertAuditEvent({
        db: client,
        roomId,
        actorParticipantId: participantId,
        eventType: "participant_joined",
        metadata: { slot_number: 2, invite_id: invite.invite_id },
        createdAt,
      });
      await refreshRoomReadinessStatus(client, roomId);
      const refreshed = await readRoomRow(client, roomId);
      if (!refreshed) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_unavailable",
          503,
          "The shared Realtime room could not be joined.",
        );
      }
      return projectRoom(client, refreshed, profileId);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_full",
        409,
        "The shared Realtime room already has two participants.",
      );
    }
    throw error;
  }
}
