import { useEffect } from "react";
import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomVisualFrame,
} from "@shared/helix-shared-realtime-room";
import type { HelixSharedLiveRoomApi } from "./SharedLiveRoomApi";

const ROOM_REFRESH_INTERVAL_MS = 3_000;
const ROOM_PRESENCE_INTERVAL_MS = 15_000;

export const sortHelixSharedLiveRooms = (
  rooms: readonly HelixSharedRealtimeRoom[],
): HelixSharedRealtimeRoom[] => [...rooms]
  .sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at));

export function useSharedLiveRoomSync(input: {
  api: HelixSharedLiveRoomApi;
  activeRoomId: string | null;
  onInitialRooms(rooms: HelixSharedRealtimeRoom[]): void;
  onRoom(room: HelixSharedRealtimeRoom): void;
  onFrames(frames: HelixSharedRealtimeRoomVisualFrame[]): void;
  onClearRoomArtifacts(): void;
  onError(error: unknown): void;
  onLoading(loading: boolean): void;
}): void {
  useEffect(() => {
    let disposed = false;
    input.onLoading(true);
    void input.api.listRooms()
      .then((rooms) => {
        if (!disposed) input.onInitialRooms(sortHelixSharedLiveRooms(rooms));
      })
      .catch((error) => {
        if (!disposed) input.onError(error);
      })
      .finally(() => {
        if (!disposed) input.onLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [input.api, input.onError, input.onInitialRooms, input.onLoading]);

  useEffect(() => {
    if (!input.activeRoomId) {
      input.onClearRoomArtifacts();
      return;
    }
    let disposed = false;
    const refresh = async (): Promise<void> => {
      const [room, frames] = await Promise.all([
        input.api.getRoom(input.activeRoomId as string),
        input.api.listVisualFrames(input.activeRoomId as string),
      ]);
      if (disposed) return;
      input.onRoom(room);
      input.onFrames(frames);
    };
    void refresh().catch((error) => {
      if (!disposed) input.onError(error);
    });
    const interval = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, ROOM_REFRESH_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [
    input.activeRoomId,
    input.api,
    input.onClearRoomArtifacts,
    input.onError,
    input.onFrames,
    input.onRoom,
  ]);

  useEffect(() => {
    if (!input.activeRoomId) return;
    let disposed = false;
    const sendPresentHeartbeat = (): void => {
      void input.api.updatePresence(input.activeRoomId as string, "present")
        .then((room) => {
          if (!disposed) input.onRoom(room);
        })
        .catch(() => undefined);
    };
    const sendAwayOnPageExit = (): void => {
      void input.api.updatePresence(input.activeRoomId as string, "away", { keepalive: true })
        .catch(() => undefined);
    };
    // Visibility is intentionally not presence: a host may switch tabs while
    // sharing a screen. The heartbeat proves connectivity; page exit or TTL
    // expiry transitions the member away.
    sendPresentHeartbeat();
    window.addEventListener("pagehide", sendAwayOnPageExit);
    const interval = window.setInterval(sendPresentHeartbeat, ROOM_PRESENCE_INTERVAL_MS);
    return () => {
      disposed = true;
      window.removeEventListener("pagehide", sendAwayOnPageExit);
      window.clearInterval(interval);
    };
  }, [input.activeRoomId, input.api, input.onRoom]);
}
