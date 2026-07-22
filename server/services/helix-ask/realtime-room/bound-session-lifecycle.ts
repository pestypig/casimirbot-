import {
  findSharedRealtimeRoomRuntimeByRealtimeSessionId,
  releaseSharedRealtimeRoomTransportBinding,
} from "./runtime-registry";
import { subscribeRealtimeSessionRemoval } from
  "../realtime-session/session-registry";
import { subscribeRealtimeSidebandSessionClosed } from
  "../realtime-session/sideband-control-channel";

let unsubscribeSessionRemoval: (() => void) | null = null;
let unsubscribeSidebandClose: (() => void) | null = null;

const degradeBoundRoom = (
  realtimeSessionId: string,
  limitation: string,
): void => {
  const binding = findSharedRealtimeRoomRuntimeByRealtimeSessionId({ realtimeSessionId });
  if (!binding) return;
  releaseSharedRealtimeRoomTransportBinding({
    roomId: binding.roomId,
    runtimeId: binding.runtimeId,
    limitation,
  });
};

/**
 * Installs the one process-level reconciliation listener used by the room
 * composition root. Calling this repeatedly is safe during route/test setup.
 */
export const installSharedRealtimeRoomBoundSessionLifecycle = (): void => {
  if (!unsubscribeSessionRemoval) {
    unsubscribeSessionRemoval = subscribeRealtimeSessionRemoval((session) => {
      degradeBoundRoom(session.realtimeSessionId, "bound_realtime_session_closed");
    });
  }
  if (!unsubscribeSidebandClose) {
    unsubscribeSidebandClose = subscribeRealtimeSidebandSessionClosed((event) => {
      degradeBoundRoom(event.realtimeSessionId, "bound_realtime_sideband_closed");
    });
  }
};

export const resetSharedRealtimeRoomBoundSessionLifecycleForTests = (): void => {
  unsubscribeSessionRemoval?.();
  unsubscribeSidebandClose?.();
  unsubscribeSessionRemoval = null;
  unsubscribeSidebandClose = null;
};
