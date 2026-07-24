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
  onVisualSourceCaptureRequested,
  onHostTransportInvalidated,
  onOwnerRoomClosed,
}: {
  room: HelixSharedRealtimeRoom;
  controller: HelixSharedLiveRoomController;
  idPrefix: string;
  onVisualSourceCaptureRequested?: () => void;
  onHostTransportInvalidated?: () => void;
  onOwnerRoomClosed?: () => void;
}) {
  const isOwner = controller.selfParticipant?.role === "owner";
  const roomRuntimeSupportsAudio =
    room.runtime.state === "host_transport_active" ||
    room.runtime.state === "bridge_active";
  const canStartRoomAudio = Boolean(
    room.readiness.ready &&
    roomRuntimeSupportsAudio &&
    (!isOwner || controller.runtimeActive),
  );
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
          The owner's browser hosts the room's single model call. Screen frames stay labeled by
          participant; room audio uses a separate two-browser relay and never feeds GPT audio
          back into the model microphone mix.
        </p>
      </section>

      <section className="rounded-xl border border-cyan-300/20 bg-cyan-400/[0.04] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-cyan-100">Room audio bridge</p>
            <p className="mt-1 text-[11px] text-slate-300">
              {controller.mediaBridge.state}
              {controller.mediaBridge.failure ? ` · ${controller.mediaBridge.failure}` : ""}
            </p>
          </div>
          {controller.mediaBridge.state === "idle" ||
          controller.mediaBridge.state === "closed" ||
          controller.mediaBridge.state === "error" ? (
            <button
              type="button"
              disabled={!canStartRoomAudio || controller.busyAction !== null}
              title={!room.readiness.ready
                ? "Both participants must finish the required room permissions"
                : !roomRuntimeSupportsAudio
                  ? "Connect the owner’s GPT Live session to the room first"
                  : isOwner && !controller.runtimeActive
                    ? "Start GPT Live in this browser before connecting room audio"
                    : "Connect the two-browser room audio bridge"}
              className="rounded-lg border border-cyan-300/30 px-3 py-2 text-xs text-cyan-100 disabled:opacity-40"
              onClick={() => void controller.startMediaBridge()}
            >
              Connect room audio
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200"
              onClick={() => void controller.stopMediaBridge()}
            >
              Disconnect audio
            </button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          Peer audio transport: {controller.mediaBridge.peer_audio_connected ? "connected" : "not connected"}
          {" · "}Playback: {controller.mediaBridge.remote_audio_playback_ready ? "ready" : "not ready"}
          {" · "}GPT input mix: {controller.mediaBridge.provider_input_mixed ? "ready" : "not ready"}
          {isOwner
            ? ` · GPT mic: ${controller.mediaBridge.provider_input_enabled ? "enabled" : "muted"}`
            : ""}
          {" · "}GPT audio shared: {controller.mediaBridge.provider_audio_forwarded ? "yes" : "not yet"}
          {" · "}ICE: {controller.mediaBridge.ice_configuration}
        </p>
        {controller.mediaBridge.ice_configuration_error ? (
          <p className="mt-1 text-[10px] text-amber-100">
            Configured ICE servers were invalid; using the default STUN fallback.
          </p>
        ) : null}
        {controller.mediaBridge.failure === "remote_audio_playback_blocked" ? (
          <button
            type="button"
            className="mt-2 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-[10px] font-semibold text-amber-100"
            onClick={() => void controller.resumeMediaPlayback()}
          >
            Resume room playback
          </button>
        ) : null}
        {controller.mediaBridge.provider_input_mixed &&
        !controller.mediaBridge.provider_input_enabled ? (
          <p className="mt-1 text-[10px] text-amber-100">
            Enable the owner’s GPT Live microphone before taking a speaking floor.
          </p>
        ) : null}
        {controller.mediaBridge.latest_shared_transcript ? (
          <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-[11px] leading-5 text-slate-200">
            {controller.mediaBridge.latest_shared_transcript.speaker_label}:{" "}
            {controller.mediaBridge.latest_shared_transcript.transcript}
          </p>
        ) : null}
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
          onHostTransportInvalidated={onHostTransportInvalidated}
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
        onVisualSourceCaptureRequested={onVisualSourceCaptureRequested}
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
