import type { PoolClient } from "pg";
import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomConsent,
  HelixSharedRealtimeRoomPresence,
  HelixSharedRealtimeRoomRole,
  HelixSharedRealtimeRoomStatus,
} from "@shared/helix-shared-realtime-room";

export type Queryable = Pick<PoolClient, "query">;

export type RoomRow = {
  room_id: string;
  owner_profile_id: string;
  title: string;
  status: string;
  max_participants: number | string;
  created_at: Date | string;
  updated_at: Date | string;
  closed_at: Date | string | null;
};

export type MemberRow = {
  room_id: string;
  slot_number: number | string;
  profile_id: string;
  participant_id: string;
  member_role: string;
  presence: string;
  consent: HelixSharedRealtimeRoomConsent | string | Record<string, unknown>;
  joined_at: Date | string;
  last_seen_at: Date | string;
  updated_at: Date | string;
  left_at: Date | string | null;
};

export type ProjectedMemberRow = MemberRow & { display_name: string };

export type InviteRow = {
  invite_id: string;
  room_id: string;
  created_by_profile_id: string;
  token_hash: string;
  status: string;
  expires_at: Date | string;
  redeemed_by_profile_id: string | null;
  created_at: Date | string;
  redeemed_at: Date | string | null;
  revoked_at: Date | string | null;
};

export type AuditEventRow = {
  event_id: string;
  room_id: string;
  actor_participant_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | string;
  created_at: Date | string;
};

export type AuditMetadataValue = string | number | boolean | null | string[];
export type AuditMetadata = Record<string, AuditMetadataValue>;

export type SharedRealtimeRoomMembership = {
  roomId: string;
  profileId: string;
  participantId: string;
  displayName: string;
  role: HelixSharedRealtimeRoomRole;
  presence: Exclude<HelixSharedRealtimeRoomPresence, "left">;
  consent: HelixSharedRealtimeRoomConsent;
  roomStatus: HelixSharedRealtimeRoomStatus;
};

export type SharedRealtimeRoomInviteResult = {
  room: HelixSharedRealtimeRoom;
  inviteCode: string;
  inviteExpiresAt: string;
};

export type SharedRealtimeRoomLeaveResult = {
  action: "left" | "closed";
  room: HelixSharedRealtimeRoom | null;
};

export type SharedRealtimeRoomAuditEvent = {
  schema: "helix.shared_realtime_room.audit_event.v1";
  event_id: string;
  room_id: string;
  actor_participant_id: string | null;
  event_type: string;
  metadata: AuditMetadata;
  created_at: string;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type SharedRealtimeRoomAuditSummary = {
  inviteCount: number;
  auditEventCount: number;
};
