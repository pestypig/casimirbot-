import React, { useMemo } from "react";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import {
  formatSharedLiveRoomTimestamp,
  labelSharedLiveRoomFrameSurface,
} from "./SharedLiveRoomFormatting";
import { buildHelixSharedLiveRoomVisualLanes } from "./SharedLiveRoomViewModel";
import type { HelixSharedLiveRoomController } from "./useHelixSharedLiveRoom";

export function SharedLiveRoomVisualLanes({
  room,
  controller,
  sectionId,
}: {
  room: HelixSharedRealtimeRoom;
  controller: HelixSharedLiveRoomController;
  sectionId: string;
}) {
  const lanes = useMemo(() => buildHelixSharedLiveRoomVisualLanes({
    room,
    frames: controller.frames,
  }), [controller.frames, room]);
  return (
    <section aria-labelledby={sectionId} className="rounded-xl border border-cyan-300/15 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p id={sectionId} className="text-xs font-semibold text-cyan-100">Participant visual lanes</p>
          <p className="mt-1 text-[10px] text-slate-500">
            Ephemeral previews only. Every frame is participant-labeled observation evidence, never an answer.
          </p>
        </div>
        <span className="rounded border border-cyan-300/20 px-2 py-1 text-[9px] uppercase text-cyan-100">
          {controller.frames.length} frames
        </span>
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {lanes.map((lane) => (
          <article key={lane.participant.participant_id} className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-slate-100">
                {lane.participant.display_name}{lane.participant.participant_id === room.self_participant_id ? " (you)" : ""}
              </p>
              <span className="text-[9px] text-slate-500">{lane.frames.length}</span>
            </div>
            {lane.latestFrame?.preview_data_url ? (
              <img
                src={lane.latestFrame.preview_data_url}
                alt={`Latest short-lived frame from ${lane.participant.display_name}`}
                className="mt-2 aspect-video w-full rounded border border-white/10 bg-black object-contain"
              />
            ) : (
              <div className="mt-2 flex aspect-video items-center justify-center rounded border border-dashed border-white/10 bg-black/30 px-3 text-center text-[10px] text-slate-500">
                {lane.latestFrame ? "Preview private; metadata received." : "Waiting for a permission-bound local frame."}
              </div>
            )}
            {lane.latestFrame ? (
              <p className="mt-1 truncate text-[9px] text-slate-500">
                {labelSharedLiveRoomFrameSurface(lane.latestFrame)} · {formatSharedLiveRoomTimestamp(lane.latestFrame.captured_at)} · {lane.latestFrame.provider_delivery}
              </p>
            ) : null}
            {lane.frames.length > 1 ? (
              <div className="mt-2 flex gap-1 overflow-x-auto" aria-label={`${lane.participant.display_name} recent visual frames`}>
                {lane.frames.map((frame) => frame.preview_data_url ? (
                  <img
                    key={frame.frame_ref}
                    src={frame.preview_data_url}
                    alt=""
                    className="h-10 w-16 shrink-0 rounded border border-white/10 bg-black object-cover"
                  />
                ) : (
                  <span key={frame.frame_ref} className="flex h-10 w-16 shrink-0 items-center justify-center rounded border border-dashed border-white/10 text-[8px] text-slate-600">
                    private
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Local room ingress: {controller.frameUpload.status}
        {controller.frameUpload.sourceId ? ` · ${controller.frameUpload.sourceId}` : ""}
        {controller.frameUpload.error ? ` · ${controller.frameUpload.error}` : ""}
      </p>
    </section>
  );
}
