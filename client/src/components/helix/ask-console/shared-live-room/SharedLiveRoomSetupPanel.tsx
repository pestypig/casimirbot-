import React, { useState } from "react";
import { DoorOpen, LoaderCircle, RadioTower } from "lucide-react";
import type { HelixSharedLiveRoomController } from "./useHelixSharedLiveRoom";

export function SharedLiveRoomSetupPanel({
  controller,
  fieldIdPrefix,
}: {
  controller: HelixSharedLiveRoomController;
  fieldIdPrefix: string;
}) {
  const [roomTitle, setRoomTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void controller.createRoom(roomTitle).then((ok) => {
            if (ok) setRoomTitle("");
          });
        }}
      >
        <label htmlFor={`${fieldIdPrefix}-room-title`} className="text-xs font-semibold text-slate-100">
          Create a room
        </label>
        <input
          id={`${fieldIdPrefix}-room-title`}
          value={roomTitle}
          onChange={(event) => setRoomTitle(event.target.value)}
          placeholder="Pair session"
          maxLength={80}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-fuchsia-300/50"
        />
        <button
          type="submit"
          disabled={controller.busyAction !== null}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-fuchsia-300/35 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 disabled:opacity-50"
        >
          {controller.busyAction === "create" ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RadioTower className="h-3.5 w-3.5" />
          )}
          Create room
        </button>
      </form>

      <form
        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void controller.joinRoom(joinCode).then((ok) => {
            if (ok) setJoinCode("");
          });
        }}
      >
        <label htmlFor={`${fieldIdPrefix}-join-code`} className="text-xs font-semibold text-slate-100">
          Join with invite
        </label>
        <input
          id={`${fieldIdPrefix}-join-code`}
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value)}
          placeholder="Invite code"
          autoComplete="off"
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-fuchsia-300/50"
        />
        <button
          type="submit"
          disabled={controller.busyAction !== null || !joinCode.trim()}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-sky-300/35 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 disabled:opacity-50"
        >
          {controller.busyAction === "join" ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <DoorOpen className="h-3.5 w-3.5" />
          )}
          Join room
        </button>
      </form>

      {controller.rooms.some((candidate) => candidate.status !== "closed") ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 md:col-span-2">
          <p className="text-xs font-semibold text-slate-100">Your existing rooms</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {controller.rooms
              .filter((candidate) => candidate.status !== "closed")
              .map((candidate) => (
                <button
                  key={candidate.room_id}
                  type="button"
                  className="rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/5"
                  onClick={() => void controller.openRoom(candidate.room_id)}
                >
                  <span className="block font-semibold">{candidate.title}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {candidate.participants.length}/2 · {candidate.status}
                  </span>
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
