/**
 * Stable public façade for shared Realtime room persistence.
 *
 * Keep route and coordinator imports on this path while the implementation is
 * partitioned by lifecycle concern under `room-store/`.
 */
export {
  isSharedRealtimeRoomDomainError,
  SharedRealtimeRoomDomainError,
} from "./room-store/domain-error";
export type {
  SharedRealtimeRoomDomainStatus,
} from "./room-store/domain-error";

export {
  createSharedRealtimeRoom,
  listSharedRealtimeRooms,
  readSharedRealtimeRoom,
  readSharedRealtimeRoomMembership,
} from "./room-store/rooms";

export {
  createSharedRealtimeRoomInvite,
  joinSharedRealtimeRoom,
} from "./room-store/invites";

export {
  leaveOrCloseSharedRealtimeRoom,
  patchOwnSharedRealtimeRoomConsent,
  updateSharedRealtimeRoomPresence,
} from "./room-store/participants";

export {
  listSharedRealtimeRoomAuditEvents,
  readSharedRealtimeRoomAuditSummary,
  resetSharedRealtimeRoomStore,
} from "./room-store/audit";

export type {
  SharedRealtimeRoomAuditEvent,
  SharedRealtimeRoomAuditSummary,
  SharedRealtimeRoomInviteResult,
  SharedRealtimeRoomLeaveResult,
  SharedRealtimeRoomMembership,
} from "./room-store/types";
