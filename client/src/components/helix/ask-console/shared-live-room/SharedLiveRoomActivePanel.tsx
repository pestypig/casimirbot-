import React from "react";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import { describeHelixSharedLiveRoomReadiness } from "./SharedLiveRoomViewModel";
import { SharedLiveRoomConsentPanel } from "./SharedLiveRoomConsentPanel";
import { SharedLiveRoomDebugPanel } from "./SharedLiveRoomDebugPanel";
import { SharedLiveRoomParticipantsPanel } from "./SharedLiveRoomParticipantsPanel";
import { SharedLiveRoomRuntimePanel } from "./SharedLiveRoomRuntimePanel";
import { SharedLiveRoomVisualLanes } from "./SharedLiveRoomVisualLanes";
import type { HelixSharedLiveRoomController } from "./useHelixSharedLiveRoom";

const statusClassName = (ready: boolean): string => ready
  ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100"
  : "border-amber-300/35 bg-amber-400/10 text-amber-100";

export function SharedLiveRoomActivePanel({
  room,
  controller,
  idPrefix,
  onHostTransportConsentRevoked,
  onOwnerRoomClosed,
}: {
  room: HelixSharedRealtimeRoom;
  controller: HelixSharedLiveRoomController;
  idPrefix: string;
  onHostTransportConsentRevoked?: () => void;
  onOwnerRoomClosed?: () => void;
}) {
  const isOwner = controller.selfParticipant?.role === "owner";
  const leave = async (): Promise<void> => {
    const ownerClosing = isOwner;
    if (await controller.leaveRoom()) {
      if (ownerClosing) onOwnerRoomClosed?.();
    }
  };
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">{room.title}</p>
            <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{room.room_id}</p>
          </div>
          <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${statusClassName(room.readiness.ready)}`}>
            {room.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-300">{describeHelixSharedLiveRoomReadiness(room)}</p>
        <p className="mt-1 text-[11px] leading-5 text-amber-100/80">
          Current milestone: the owner's browser hosts one model call, and both members can add
          labeled visual observations. The participant cannot hear, speak, or receive a shared
          transcript through that call until the room media bridge is implemented.
        </p>
      </section>

      <SharedLiveRoomParticipantsPanel
        room={room}
        controller={controller}
        sectionId={`${idPrefix}-participants`}
      />
      {controller.selfParticipant ? (
        <SharedLiveRoomConsentPanel
          participant={controller.selfParticipant}
          controller={controller}
          sectionId={`${idPrefix}-consent`}
          onHostTransportConsentRevoked={onHostTransportConsentRevoked}
        />
      ) : null}
      <SharedLiveRoomRuntimePanel
        room={room}
        controller={controller}
        sectionId={`${idPrefix}-runtime`}
      />
      <SharedLiveRoomVisualLanes
        room={room}
        controller={controller}
        sectionId={`${idPrefix}-frames`}
      />
      <SharedLiveRoomDebugPanel controller={controller} />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={controller.busyAction !== null}
          className="rounded-lg border border-rose-300/25 px-3 py-2 text-xs text-rose-100 disabled:opacity-50"
          onClick={() => void leave()}
        >
          {isOwner ? "Close room" : "Leave room"}
        </button>
      </div>
    </div>
  );
}
