import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import { SharedLiveRoomDialog } from "./SharedLiveRoomDialog";
import {
  HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT,
  buildSharedLiveRoomGuideProjection,
  recordSharedLiveRoomGuideProjection,
  resetSharedLiveRoomGuideProjection,
} from "./SharedLiveRoomGuideProjection";
import { useHelixSharedLiveRoom } from "./useHelixSharedLiveRoom";

export type HelixAskSharedLiveRoomControlsProps = {
  realtimeSessionId: string | null;
  runtimeActive: boolean;
  realtimeModel: string;
  onActiveRoomChange?: (roomId: string | null) => void;
  onVisualSourceCaptureRequested?: () => void;
  onSharedTransportChange?: (bound: boolean) => void;
  onHostTransportInvalidated?: () => void;
  onOwnerRoomClosed?: () => void;
};

export function HelixAskSharedLiveRoomControls({
  realtimeSessionId,
  runtimeActive,
  realtimeModel,
  onActiveRoomChange,
  onVisualSourceCaptureRequested,
  onSharedTransportChange,
  onHostTransportInvalidated,
  onOwnerRoomClosed,
}: HelixAskSharedLiveRoomControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const controller = useHelixSharedLiveRoom({
    realtimeSessionId,
    runtimeActive,
    realtimeModel,
    foreground: dialogOpen,
  });
  const titleId = useId();
  const descriptionId = useId();
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const hostInvalidationHandledRef = useRef(false);
  const hostTransportSeenRef = useRef(false);
  const room = controller.room;
  const guideProjection = useMemo(() => buildSharedLiveRoomGuideProjection({
    room,
    mediaBridge: controller.mediaBridge,
    loading: controller.busyAction === "loading",
    failed: Boolean(controller.error),
  }), [controller.busyAction, controller.error, controller.mediaBridge, room]);
  const roomButtonLabel = room
    ? `Room ${room.participants.filter((participant) => participant.presence !== "left").length}/2`
    : "Room";
  const hostTransportReferencePresent = Boolean(
    controller.selfParticipant?.role === "owner" &&
    (
      room?.runtime.transport_owner === "host_browser" ||
      room?.runtime.transport_owner === "room_media_bridge"
    ) &&
    room.runtime.realtime_session_ref_hash,
  );
  const sharedTransportBound = hostTransportReferencePresent && room?.runtime.state !== "closed";

  useEffect(() => {
    recordSharedLiveRoomGuideProjection(guideProjection);
  }, [guideProjection]);

  useEffect(() => () => resetSharedLiveRoomGuideProjection(), []);

  useEffect(() => {
    const openDialog = (): void => setDialogOpen(true);
    window.addEventListener(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT, openDialog);
    return () => window.removeEventListener(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT, openDialog);
  }, []);

  useEffect(() => {
    onActiveRoomChange?.(room?.status === "closed" ? null : room?.room_id ?? null);
    return () => onActiveRoomChange?.(null);
  }, [onActiveRoomChange, room?.room_id, room?.status]);

  useEffect(() => {
    onSharedTransportChange?.(sharedTransportBound);
    return () => onSharedTransportChange?.(false);
  }, [onSharedTransportChange, sharedTransportBound]);

  useEffect(() => {
    if (sharedTransportBound) hostTransportSeenRef.current = true;
    const hostTransportConsentValid = Boolean(
      controller.selfParticipant?.consent.microphone_to_model &&
      controller.selfParticipant?.consent.model_audio_output,
    );
    const invalidRuntimeState =
      room?.runtime.state === "degraded" ||
      room?.runtime.state === "stopping" ||
      room?.runtime.state === "closed" ||
      room?.runtime.state === "error";
    const shouldInvalidate = hostTransportSeenRef.current && (
      !hostTransportConsentValid || invalidRuntimeState
    );
    if (!shouldInvalidate) {
      hostInvalidationHandledRef.current = false;
      return;
    }
    if (hostInvalidationHandledRef.current) return;
    hostInvalidationHandledRef.current = true;
    hostTransportSeenRef.current = false;
    onHostTransportInvalidated?.();
  }, [
    controller.selfParticipant?.consent.microphone_to_model,
    controller.selfParticipant?.consent.model_audio_output,
    onHostTransportInvalidated,
    room?.runtime.state,
    sharedTransportBound,
  ]);

  const closeDialog = useCallback((): void => {
    setDialogOpen(false);
    window.setTimeout(() => triggerButtonRef.current?.focus(), 0);
  }, []);

  return (
    <>
      <button
        data-helix-control-id="helix.ask.shared_live_room.open_dialog"
        data-helix-interaction-kind="navigate"
        data-helix-authority-state="blocked_pending_contract"
        ref={triggerButtonRef}
        type="button"
        data-helix-ask-action-item="true"
        data-shared-live-room-state={room?.status ?? "none"}
        aria-haspopup="dialog"
        aria-expanded={dialogOpen}
        aria-label="Open Shared GPT Live Room"
        title={room
          ? "This room scopes typed Helix Ask prompts; GPT Live voice can be connected separately"
          : "Create or join a two-person Shared GPT Live Room"}
        className={`inline-flex h-10 shrink-0 snap-center items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200/70 ${
          room
            ? "border-fuchsia-300/50 bg-fuchsia-400/15 text-fuchsia-100 hover:bg-fuchsia-400/20"
            : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
        }`}
        onClick={() => setDialogOpen(true)}
      >
        <Users className="h-4 w-4" />
        <span>{roomButtonLabel}</span>
      </button>

      {dialogOpen ? (
        <SharedLiveRoomDialog
          room={room}
          controller={controller}
          titleId={titleId}
          descriptionId={descriptionId}
          onClose={closeDialog}
          onVisualSourceCaptureRequested={onVisualSourceCaptureRequested}
          onHostTransportInvalidated={onHostTransportInvalidated}
          onOwnerRoomClosed={onOwnerRoomClosed}
        />
      ) : null}
    </>
  );
}
