import React from "react";
import type { HelixSharedLiveRoomController } from "./useHelixSharedLiveRoom";

export function SharedLiveRoomDebugPanel({
  controller,
}: {
  controller: HelixSharedLiveRoomController;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-100">Metadata-only room debug</p>
          <p className="mt-1 text-[10px] text-slate-500">
            This is a room diagnostic, not a final-answer attachment. It excludes frame pixels,
            provider payloads, raw provider/session IDs, and participant display names.
          </p>
        </div>
        <button
          type="button"
          disabled={controller.busyAction !== null}
          className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200 disabled:opacity-50"
          onClick={() => void controller.refreshDebug()}
        >
          Refresh debug
        </button>
      </div>
      {controller.debug ? (
        <div className="mt-2 grid gap-1 font-mono text-[10px] text-slate-400 sm:grid-cols-2">
          <p>participants {controller.debug.participant_count}</p>
          <p>visual frames {controller.debug.visual_frame_count}</p>
          <p>audit events {controller.debug.audit_event_count}</p>
          <p>raw content {String(controller.debug.raw_content_included)}</p>
        </div>
      ) : null}
    </section>
  );
}
