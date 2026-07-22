import React, { useEffect, useId, useRef, useState } from "react";
import { Users, X } from "lucide-react";
import { SharedLiveRoomActivePanel } from "./SharedLiveRoomActivePanel";
import { SharedLiveRoomSetupPanel } from "./SharedLiveRoomSetupPanel";
import { useHelixSharedLiveRoom } from "./useHelixSharedLiveRoom";

export type HelixAskSharedLiveRoomControlsProps = {
  realtimeSessionId: string | null;
  runtimeActive: boolean;
  realtimeModel: string;
  visualInputEnabled: boolean;
  onSharedTransportChange?: (bound: boolean) => void;
  onHostTransportInvalidated?: () => void;
  onOwnerRoomClosed?: () => void;
};

export function HelixAskSharedLiveRoomControls({
  realtimeSessionId,
  runtimeActive,
  realtimeModel,
  visualInputEnabled,
  onSharedTransportChange,
  onHostTransportInvalidated,
  onOwnerRoomClosed,
}: HelixAskSharedLiveRoomControlsProps) {
  const controller = useHelixSharedLiveRoom({
    realtimeSessionId,
    runtimeActive,
    realtimeModel,
    visualInputEnabled,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const hostInvalidationHandledRef = useRef(false);
  const hostTransportSeenRef = useRef(false);
  const room = controller.room;
  const roomButtonLabel = room
    ? `Room ${room.participants.filter((participant) => participant.presence !== "left").length}/2`
    : "Room";
  const hostTransportReferencePresent = Boolean(
    controller.selfParticipant?.role === "owner" &&
    room?.runtime.transport_owner === "host_browser" &&
    room.runtime.realtime_session_ref_hash,
  );
  const sharedTransportBound = hostTransportReferencePresent && room?.runtime.state !== "closed";

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

  useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [dialogOpen]);

  return (
    <>
      <button
        type="button"
        data-helix-ask-action-item="true"
        data-shared-live-room-state={room?.status ?? "none"}
        aria-haspopup="dialog"
        aria-expanded={dialogOpen}
        aria-label="Open Shared GPT Live Room"
        title="Create or join a two-person Shared GPT Live Room"
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
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close Shared GPT Live Room dialog"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-fuchsia-300/25 bg-slate-950 shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <p id={titleId} className="text-sm font-semibold text-fuchsia-100">
                  Shared GPT Live Room
                </p>
                <p id={descriptionId} className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
                  Two signed-in developer accounts can contribute participant-labeled visual observations
                  to one host-owned model call. Shared participant audio and transcript delivery are not connected yet.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close Shared GPT Live Room"
                className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                onClick={() => setDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {controller.error ? (
                <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
                  <span>{controller.error}</span>
                  <button type="button" className="underline" onClick={controller.clearError}>Dismiss</button>
                </div>
              ) : null}

              {room ? (
                <SharedLiveRoomActivePanel
                  room={room}
                  controller={controller}
                  idPrefix={titleId}
                  onHostTransportInvalidated={onHostTransportInvalidated}
                  onOwnerRoomClosed={onOwnerRoomClosed}
                />
              ) : (
                <SharedLiveRoomSetupPanel controller={controller} fieldIdPrefix={titleId} />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
