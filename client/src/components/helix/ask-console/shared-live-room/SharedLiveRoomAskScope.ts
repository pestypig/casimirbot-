import type { HelixSharedLiveRoomApi } from "./SharedLiveRoomApi";
import { sortHelixSharedLiveRooms } from "./useSharedLiveRoomSync";

export async function resolveHelixAskSharedLiveRoomId(input: {
  api: HelixSharedLiveRoomApi;
  selectedRoomId: string | null;
}): Promise<string | null> {
  if (input.selectedRoomId) {
    const selectedRoom = await input.api.getRoom(input.selectedRoomId);
    return selectedRoom.status === "closed" ? null : selectedRoom.room_id;
  }

  const rooms = sortHelixSharedLiveRooms(await input.api.listRooms());
  const openRooms = rooms.filter((room) => room.status !== "closed");
  return openRooms.length === 1 ? openRooms[0].room_id : null;
}
