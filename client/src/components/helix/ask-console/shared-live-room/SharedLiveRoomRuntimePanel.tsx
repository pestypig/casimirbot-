import React from "react";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import type { HelixSharedLiveRoomController } from "./useHelixSharedLiveRoom";

export function SharedLiveRoomRuntimePanel({
  room,
  controller,
  sectionId,
}: {
  room: HelixSharedRealtimeRoom;
  controller: HelixSharedLiveRoomController;
  sectionId: string;
}) {
  const isOwner = controller.selfParticipant?.role === "owner";
  const hostTransport = room.runtime.transport_owner === "host_browser";
  const runtimeBound = Boolean(room.runtime.realtime_session_ref_hash);
  const canReserve = Boolean(
    isOwner &&
    room.readiness.ready &&
    controller.runtimeActive &&
    controller.realtimeSessionId &&
    room.runtime.state !== "host_transport_active" &&
    room.runtime.state !== "bridge_active",
  );
  const canBind = Boolean(
    isOwner &&
    room.readiness.ready &&
    controller.runtimeActive &&
    controller.realtimeSessionId &&
    room.runtime.runtime_id &&
    room.runtime.state !== "host_transport_active" &&
    room.runtime.state !== "bridge_active",
  );
  const canTakeFloor = Boolean(
    (room.runtime.state === "host_transport_active" || room.runtime.state === "bridge_active") &&
    (isOwner || room.runtime.transport_owner === "room_media_bridge"),
  );
  return (
    <section aria-labelledby={sectionId} className="rounded-xl border border-sky-300/15 bg-sky-950/10 p-3">
      <p id={sectionId} className="text-xs font-semibold text-sky-100">One shared model session</p>
      <div className="mt-2 grid gap-1 text-[10px] text-slate-400 sm:grid-cols-2">
        <p>Room runtime: <span className="font-mono text-slate-200">{room.runtime.state}</span></p>
        <p>Transport owner: <span className="font-mono text-slate-200">{room.runtime.transport_owner}</span></p>
        <p>GPT Live here: <span className="font-mono text-slate-200">{controller.runtimeActive ? "active" : "inactive"}</span></p>
        <p>Bound reference: <span className="font-mono text-slate-200">{room.runtime.realtime_session_ref_hash ?? "none"}</span></p>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">
        Start GPT Live first, then reserve and bind it. After binding, the room route owns automatic
        visual ingress so the host frame is not sent twice. Live Vision and room visual permission must both be on.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {isOwner ? (
          <button
            type="button"
            disabled={controller.busyAction !== null || !canReserve}
            title={!controller.runtimeActive
              ? "Start GPT Live before reserving the room model"
              : !room.readiness.ready
                ? "Both present members must finish required permission records"
                : "Reserve this room's one model slot"}
            className="rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 py-1.5 text-[10px] font-semibold text-sky-100 disabled:opacity-45"
            onClick={() => void controller.reserveRuntime()}
          >
            Reserve shared model
          </button>
        ) : null}
        {isOwner ? (
          <button
            type="button"
            disabled={controller.busyAction !== null || !canBind}
            title={!room.runtime.runtime_id
              ? "Reserve the shared model before binding"
              : "Bind this GPT Live session to the room"}
            className="rounded-lg border border-violet-300/30 bg-violet-400/10 px-3 py-1.5 text-[10px] font-semibold text-violet-100 disabled:opacity-45"
            onClick={() => void controller.bindRuntime()}
          >
            Bind current GPT Live
          </button>
        ) : null}
        {canTakeFloor ? (
          <button
            type="button"
            disabled={controller.busyAction !== null}
            className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-100 disabled:opacity-45"
            onClick={() => void controller.takeFloor()}
          >
            {hostTransport ? "Mark host speaking" : "Take speaking floor"}
          </button>
        ) : null}
      </div>
      {!isOwner && hostTransport && runtimeBound ? (
        <p className="mt-2 text-[10px] text-amber-100/80">
          Your speaking control stays disabled until a room media bridge carries participant audio.
        </p>
      ) : null}
    </section>
  );
}
