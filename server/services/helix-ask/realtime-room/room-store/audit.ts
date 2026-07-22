import { readSharedRealtimeRoomDatabase } from "./database";
import { assertAccessibleMember } from "./repository";
import type {
  AuditEventRow,
  SharedRealtimeRoomAuditEvent,
  SharedRealtimeRoomAuditSummary,
} from "./types";
import { cleanRequired, iso, normalizeAuditMetadata } from "./values";

export async function listSharedRealtimeRoomAuditEvents(input: {
  roomId: string;
  profileId: string;
  limit?: number;
}): Promise<SharedRealtimeRoomAuditEvent[]> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const profileId = cleanRequired(input.profileId, "profileId");
  const limit = Math.max(1, Math.min(200, Math.floor(input.limit ?? 100)));
  const db = await readSharedRealtimeRoomDatabase();
  await assertAccessibleMember(db, roomId, profileId);
  const { rows } = await db.query<AuditEventRow>(
    `
      SELECT *
      FROM helix_shared_realtime_room_events
      WHERE room_id = $1
      ORDER BY created_at ASC
      LIMIT $2;
    `,
    [roomId, limit],
  );
  return rows.map((event) => ({
    schema: "helix.shared_realtime_room.audit_event.v1",
    event_id: event.event_id,
    room_id: event.room_id,
    actor_participant_id: event.actor_participant_id,
    event_type: event.event_type,
    metadata: normalizeAuditMetadata(event.metadata),
    created_at: iso(event.created_at),
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }));
}

export async function readSharedRealtimeRoomAuditSummary(input: {
  roomId: string;
  profileId: string;
}): Promise<SharedRealtimeRoomAuditSummary> {
  const roomId = cleanRequired(input.roomId, "roomId");
  const profileId = cleanRequired(input.profileId, "profileId");
  const db = await readSharedRealtimeRoomDatabase();
  await assertAccessibleMember(db, roomId, profileId);
  const [inviteResult, auditResult] = await Promise.all([
    db.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_shared_realtime_room_invites WHERE room_id = $1;`,
      [roomId],
    ),
    db.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_shared_realtime_room_events WHERE room_id = $1;`,
      [roomId],
    ),
  ]);
  return {
    inviteCount: Number(inviteResult.rows[0]?.count ?? 0),
    auditEventCount: Number(auditResult.rows[0]?.count ?? 0),
  };
}

export async function resetSharedRealtimeRoomStore(): Promise<void> {
  const db = await readSharedRealtimeRoomDatabase();
  await db.query(`DELETE FROM helix_shared_realtime_room_events;`);
  await db.query(`DELETE FROM helix_shared_realtime_room_invites;`);
  await db.query(`DELETE FROM helix_shared_realtime_room_members;`);
  await db.query(`DELETE FROM helix_shared_realtime_rooms;`);
}
