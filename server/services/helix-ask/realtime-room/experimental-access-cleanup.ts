import {
  leaveOrCloseSharedRealtimeRoom,
  listSharedRealtimeRooms,
  readSharedRealtimeRoomMembership,
} from "./room-store";
import { reconcileSharedRealtimeRoomRuntimeAfterLeave } from
  "./room-runtime-reconciliation";

export async function leaveSharedRealtimeRoomsForExperimentDisable(input: {
  profileId: string;
  sessionId: string;
}): Promise<void> {
  const rooms = await listSharedRealtimeRooms({ profileId: input.profileId });
  for (const room of rooms) {
    const membership = await readSharedRealtimeRoomMembership({
      roomId: room.room_id,
      profileId: input.profileId,
    });
    if (!membership) continue;
    await leaveOrCloseSharedRealtimeRoom({
      roomId: room.room_id,
      profileId: input.profileId,
    });
    reconcileSharedRealtimeRoomRuntimeAfterLeave({
      roomId: room.room_id,
      memberRole: membership.role,
      participantId: membership.participantId,
      requesterSessionId: input.sessionId,
    });
  }
}
