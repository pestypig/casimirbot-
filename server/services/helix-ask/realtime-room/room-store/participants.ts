import {
  type HelixSharedRealtimeRoom,
  type HelixSharedRealtimeRoomConsent,
  type HelixSharedRealtimeRoomConsentPatch,
} from "@shared/helix-shared-realtime-room";
import { withSharedRealtimeRoomTransaction } from "./database";
import { SharedRealtimeRoomDomainError } from "./domain-error";
import {
  assertAccessibleMember,
  assertOpenRoom,
  insertAuditEvent,
  projectRoom,
  readRoomRow,
  refreshRoomReadinessStatus,
} from "./repository";
import type { SharedRealtimeRoomLeaveResult } from "./types";
import {
  cleanRequired,
  createId,
  memberPresence,
  memberRole,
  normalizeConsent,
  nowIso,
  roomStatus,
} from "./values";

const consentPatchKeys = [
  "microphone_to_room",
  "microphone_to_model",
  "transcript_to_room",
  "screen_to_model",
  "screen_thumbnail_to_room",
  "model_audio_output",
] as const satisfies ReadonlyArray<keyof HelixSharedRealtimeRoomConsentPatch>;

const normalizeConsentPatch = (
  value: HelixSharedRealtimeRoomConsentPatch,
): {
  patch: HelixSharedRealtimeRoomConsentPatch;
  changedKeys: Array<keyof HelixSharedRealtimeRoomConsentPatch>;
} => {
  const record = value as Record<string, unknown>;
  const unknownKeys = Object.keys(record).filter(
    (key) => !consentPatchKeys.includes(key as keyof HelixSharedRealtimeRoomConsentPatch),
  );
  if (unknownKeys.length > 0) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      "The consent patch contains unsupported fields.",
    );
  }

  const patch: HelixSharedRealtimeRoomConsentPatch = {};
  const changedKeys: Array<keyof HelixSharedRealtimeRoomConsentPatch> = [];
  for (const key of consentPatchKeys) {
    if (!(key in record)) continue;
    if (typeof record[key] !== "boolean") {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_invalid_request",
        400,
        `Consent field ${key} must be boolean.`,
      );
    }
    patch[key] = record[key] as boolean;
    changedKeys.push(key);
  }
  if (changedKeys.length === 0) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      "At least one consent field is required.",
    );
  }
  return { patch, changedKeys };
};

export async function patchOwnSharedRealtimeRoomConsent(input: {
  roomId: string;
  profileId: string;
  consentPatch: HelixSharedRealtimeRoomConsentPatch;
}): Promise<HelixSharedRealtimeRoom> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const profileId = cleanRequired(input.profileId, "profileId");
  const normalized = normalizeConsentPatch(input.consentPatch);

  return withSharedRealtimeRoomTransaction(async (client) => {
    const { room, member } = await assertAccessibleMember(client, roomId, profileId, true);
    assertOpenRoom(room);
    const previous = normalizeConsent(member.consent);
    const updatedAt = nowIso();
    const consent: HelixSharedRealtimeRoomConsent = {
      ...previous,
      ...normalized.patch,
      consent_version: previous.consent_version + 1,
      consent_receipt_ref: createId("consent"),
      updated_at: updatedAt,
    };
    await client.query(
      `
        UPDATE helix_shared_realtime_room_members
        SET consent = $3::jsonb, last_seen_at = $4, updated_at = $4
        WHERE room_id = $1 AND profile_id = $2 AND presence <> 'left';
      `,
      [roomId, profileId, JSON.stringify(consent), updatedAt],
    );
    await insertAuditEvent({
      db: client,
      roomId,
      actorParticipantId: member.participant_id,
      eventType: "consent_updated",
      metadata: {
        consent_version: consent.consent_version,
        changed_fields: normalized.changedKeys,
      },
      createdAt: updatedAt,
    });
    await refreshRoomReadinessStatus(client, roomId);
    const refreshed = await readRoomRow(client, roomId);
    if (!refreshed) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_unavailable",
        503,
        "The shared Realtime room consent could not be updated.",
      );
    }
    return projectRoom(client, refreshed, profileId);
  });
}

export async function updateSharedRealtimeRoomPresence(input: {
  roomId: string;
  profileId: string;
  presence: "present" | "away";
}): Promise<HelixSharedRealtimeRoom> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const profileId = cleanRequired(input.profileId, "profileId");
  if (input.presence !== "present" && input.presence !== "away") {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      "Presence must be present or away.",
    );
  }

  return withSharedRealtimeRoomTransaction(async (client) => {
    const { room, member } = await assertAccessibleMember(client, roomId, profileId, true);
    assertOpenRoom(room);
    const updatedAt = nowIso();
    await client.query(
      `
        UPDATE helix_shared_realtime_room_members
        SET presence = $3, last_seen_at = $4, updated_at = $4
        WHERE room_id = $1 AND profile_id = $2 AND presence <> 'left';
      `,
      [roomId, profileId, input.presence, updatedAt],
    );
    if (memberPresence(member.presence) !== input.presence) {
      await insertAuditEvent({
        db: client,
        roomId,
        actorParticipantId: member.participant_id,
        eventType: "presence_updated",
        metadata: { presence: input.presence },
        createdAt: updatedAt,
      });
      await client.query(
        `UPDATE helix_shared_realtime_rooms SET updated_at = $2 WHERE room_id = $1;`,
        [roomId, updatedAt],
      );
    }
    await refreshRoomReadinessStatus(client, roomId);
    const refreshed = await readRoomRow(client, roomId);
    if (!refreshed) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_unavailable",
        503,
        "The shared Realtime room presence could not be updated.",
      );
    }
    return projectRoom(client, refreshed, profileId);
  });
}

export async function leaveOrCloseSharedRealtimeRoom(input: {
  roomId: string;
  profileId: string;
}): Promise<SharedRealtimeRoomLeaveResult> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const profileId = cleanRequired(input.profileId, "profileId");

  return withSharedRealtimeRoomTransaction(async (client) => {
    const { room, member } = await assertAccessibleMember(client, roomId, profileId, true);
    const changedAt = nowIso();
    if (memberRole(member.member_role) === "owner") {
      if (roomStatus(room.status) !== "closed") {
        await client.query(
          `
            UPDATE helix_shared_realtime_rooms
            SET status = 'closed', closed_at = $2, updated_at = $2
            WHERE room_id = $1;
          `,
          [roomId, changedAt],
        );
        await client.query(
          `
            UPDATE helix_shared_realtime_room_invites
            SET status = 'revoked', revoked_at = $2
            WHERE room_id = $1 AND status = 'active';
          `,
          [roomId, changedAt],
        );
        await insertAuditEvent({
          db: client,
          roomId,
          actorParticipantId: member.participant_id,
          eventType: "room_closed",
          metadata: { reason: "owner_closed" },
          createdAt: changedAt,
        });
      }
      const closedRoom = await readRoomRow(client, roomId);
      if (!closedRoom) {
        throw new SharedRealtimeRoomDomainError(
          "shared_realtime_room_unavailable",
          503,
          "The shared Realtime room could not be closed.",
        );
      }
      return { action: "closed", room: await projectRoom(client, closedRoom, profileId) };
    }

    await client.query(
      `
        UPDATE helix_shared_realtime_room_members
        SET presence = 'left', left_at = $3, last_seen_at = $3, updated_at = $3
        WHERE room_id = $1 AND profile_id = $2 AND presence <> 'left';
      `,
      [roomId, profileId, changedAt],
    );
    await insertAuditEvent({
      db: client,
      roomId,
      actorParticipantId: member.participant_id,
      eventType: "participant_left",
      metadata: { slot_number: 2 },
      createdAt: changedAt,
    });
    if (roomStatus(room.status) !== "closed") {
      await refreshRoomReadinessStatus(client, roomId);
    }
    return { action: "left", room: null };
  });
}
