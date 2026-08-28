import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import { SharedLiveRoomActivePanel } from "./SharedLiveRoomActivePanel";
import { SharedLiveRoomSetupPanel } from "./SharedLiveRoomSetupPanel";
import type { HelixSharedLiveRoomController } from "./useHelixSharedLiveRoom";

export function SharedLiveRoomDialog({
  room,
  controller,
  titleId,
  descriptionId,
  onClose,
  onVisualSourceCaptureRequested,
  onHostTransportInvalidated,
  onOwnerRoomClosed,
}: {
  room: HelixSharedRealtimeRoom | null;
  controller: HelixSharedLiveRoomController;
  titleId: string;
  descriptionId: string;
  onClose(): void;
  onVisualSourceCaptureRequested?: () => void;
  onHostTransportInvalidated?: () => void;
  onOwnerRoomClosed?: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = priorOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-helix-interaction-kind="navigate" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-dialog.shared-live-room-overlay"
      className="fixed inset-0 z-[2147483000] isolate flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:p-6"
      data-testid="shared-live-room-overlay"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button data-helix-interaction-kind="navigate" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-dialog.close-shared-gpt-live-room-dialog"
        type="button"
        tabIndex={-1}
        aria-label="Close Shared GPT Live Room dialog"
        className="fixed inset-0 cursor-default bg-slate-950/90 backdrop-blur-md"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 mt-1 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl animate-in flex-col overflow-hidden rounded-2xl border border-fuchsia-300/30 bg-slate-950 text-slate-100 opacity-100 shadow-2xl shadow-black/80 ring-1 ring-white/5 fade-in-0 slide-in-from-top-2 sm:mt-6 sm:max-h-[calc(100dvh-4.5rem)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 py-3">
          <div>
            <p id={titleId} className="text-sm font-semibold text-fuchsia-100">
              Shared GPT Live Room
            </p>
            <p id={descriptionId} className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
              Two room members can share labeled visual frames and floor-controlled microphone audio
              with one host-owned GPT Live call, then receive the same GPT audio and transcripts.
            </p>
          </div>
          <button data-helix-interaction-kind="navigate" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-dialog.close-shared-gpt-live-room"
            ref={closeButtonRef}
            type="button"
            aria-label="Close Shared GPT Live Room"
            className="shrink-0 rounded-full border border-white/10 bg-slate-900 p-2 text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200/70"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-950 p-4">
          {controller.error ? (
            <div role="alert" className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
              <span>{controller.error}</span>
              <button data-helix-interaction-kind="navigate" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-dialog.dismiss" type="button" className="underline" onClick={controller.clearError}>Dismiss</button>
            </div>
          ) : null}

          {room ? (
            <SharedLiveRoomActivePanel
              room={room}
              controller={controller}
              idPrefix={titleId}
              onVisualSourceCaptureRequested={onVisualSourceCaptureRequested}
              onHostTransportInvalidated={onHostTransportInvalidated}
              onOwnerRoomClosed={onOwnerRoomClosed}
            />
          ) : (
            <SharedLiveRoomSetupPanel controller={controller} fieldIdPrefix={titleId} />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
