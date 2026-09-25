import React, { useCallback, useState } from "react";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import type { RoomMissionOwnerSelection } from "@shared/helix-room-mission-owner";
import { SharedLiveRoomMissionPanel } from "./SharedLiveRoomMissionPanel";
import { SharedLiveRoomOwnerResultsPanel } from "./SharedLiveRoomOwnerResultsPanel";

export function SharedLiveRoomOwnerWorkflow({ room, onProcessed }: {
  room: HelixSharedRealtimeRoom;
  onProcessed(): Promise<unknown>;
}) {
  const [missionKey, setMissionKey] = useState("none");
  const missionChanged = useCallback((mission: RoomMissionOwnerSelection | null) => {
    setMissionKey(mission
      ? JSON.stringify([mission.mission_id, mission.mission_revision, mission.status])
      : "none");
  }, []);
  return <>
    <SharedLiveRoomMissionPanel room={room} onMissionChanged={missionChanged} />
    {/* A changed selection discards old report/disclosure state and aborts its
        pending read. The results panel must fetch its own authorized catalog. */}
    <SharedLiveRoomOwnerResultsPanel key={`${room.room_id}:${missionKey}`}
      room={room} onProcessed={onProcessed} />
  </>;
}
