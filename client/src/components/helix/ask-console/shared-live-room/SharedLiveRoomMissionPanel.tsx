import React, { useEffect, useRef, useState } from "react";
import type { HelixSharedRealtimeRoom } from "@shared/helix-shared-realtime-room";
import type { RoomMissionOwnerCatalog, RoomMissionOwnerSelection } from "@shared/helix-room-mission-owner";
import { useRoomMissionHandoffReview } from "./RoomMissionHandoffReview";
import { readRoomMissionOptions, selectRoomMission, revokeRoomMission,
  dispatchRoomMissionHandoff, RoomMissionRequestError } from "./RoomMissionOwnerApi";

export function SharedLiveRoomMissionPanel({ room, onMissionChanged }: {
  room: HelixSharedRealtimeRoom;
  onMissionChanged?: (mission: RoomMissionOwnerSelection | null) => void;
}) {
  const [catalog, setCatalog] = useState<RoomMissionOwnerCatalog | null>(null);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewedTask, setReviewedTask] = useState(false);
  const [handoffId, setHandoffId] = useState("");
  const [approved, setApproved] = useState(false);
  const [queued, setQueued] = useState(false);
  const entries = useRoomMissionHandoffReview(state => state.entries);
  const request = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const operationIds = useRef(new Map<string, string>());
  const mission = catalog?.mission;
  const candidate = catalog?.candidate;
  const alreadySelected = mission?.status === "active" && candidate &&
    mission.reasoning_binding_id === candidate.reasoning_binding_id && mission.binding_epoch === candidate.binding_epoch &&
    mission.helix_conversation_id === candidate.helix_conversation_id &&
    mission.binding_mission_id === candidate.binding_mission_id && mission.run_id === candidate.run_id;
  const options = (catalog?.handoffs ?? []).flatMap(option => {
    const local = entries.find(entry => entry.roomId === room.room_id && entry.handoffId === option.handoff_id &&
      entry.realtimeSessionId === option.realtime_session_id && entry.textHash === option.transcript_text_hash &&
      entry.text.length === option.transcript_text_char_count);
    return local ? [{ ...option, local }] : [];
  });
  const selected = options.find(option => option.handoff_id === handoffId);
  const speaker = (id: string) => room.participants.find(p => p.participant_id === id)?.display_name ?? "Room participant";
  const requestId = (key: string) => {
    let id = operationIds.current.get(key);
    if (!id) { id = `room-owner:${crypto.randomUUID()}`; operationIds.current.set(key, id); }
    return id;
  };
  const run = async (operation: (signal: AbortSignal) => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setMessage("");
    const abort = new AbortController(); request.current = abort;
    try { await operation(abort.signal); }
    catch (error) {
      if (!abort.signal.aborted) {
        setHidden(error instanceof RoomMissionRequestError && error.code === "room_mission_developer_required");
        setMessage(error instanceof RoomMissionRequestError
          ? `No new outcome confirmed (${error.code}). Refresh the room task before trying again.`
          : "The outcome is unknown. Retry the same action to reuse its request, or refresh to check the mission.");
      }
    } finally { if (request.current === abort) { locked.current = false; if (!abort.signal.aborted) setBusy(false); } }
  };
  const refresh = () => run(async signal => {
    setCatalog(null); setReviewedTask(false); setHandoffId(""); setApproved(false); setQueued(false);
    const next = await readRoomMissionOptions(room.room_id, signal);
    if (!signal.aborted) { setCatalog(next); setHidden(false); onMissionChanged?.(next.mission); }
  });
  useEffect(() => { locked.current = false; void refresh(); return () => { request.current?.abort(); }; }, [room.room_id]);
  // New receipts never inherit an earlier review, including a reconnect using
  // the same handoff selector or a source that has been cleared on disconnect.
  useEffect(() => { setApproved(false); setQueued(false); }, [handoffId, selected?.local.text, mission?.mission_revision]);
  if (hidden) return null;
  return <section aria-label="Room mission" className="rounded-xl border border-cyan-300/20 bg-cyan-400/[0.04] p-3 text-xs">
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-semibold text-cyan-100">Room mission task</h3>
      <button type="button" disabled={busy} onClick={() => void refresh()} className="rounded border border-white/20 px-2 py-1">Refresh room task</button>
    </div>
    <p className="mt-2 text-slate-300">Select your paired Codex task for room instructions. Selection does not start AI work or grant program actions.</p>
    {mission ? <div className="mt-3 space-y-2">
      <p>Mission: {mission.status === "active" ? "Selected" : "Revoked"} · revision {mission.mission_revision}</p>
      <p className="break-all">Connected chat: {mission.helix_conversation_id}</p>
      {mission.status === "active" ? <button type="button" disabled={busy}
        className="rounded border border-amber-300/30 px-3 py-2"
        onClick={() => void run(async signal => {
          const next = await revokeRoomMission(mission, requestId(`revoke:${mission.room_id}:${mission.mission_revision}`), signal);
          if (!signal.aborted) { setCatalog(current => current ? { ...current, mission: next } : null); onMissionChanged?.(next); setMessage("Mission revoked. Pending room instructions can no longer use this selection."); }
        })}>Revoke room mission</button> : null}
    </div> : catalog ? <p className="mt-3">No mission is selected.</p> : null}
    {candidate && !alreadySelected ? <div className="mt-3 space-y-2">
      <p className="break-all">Currently paired chat: {candidate.helix_conversation_id}</p>
      <p>Binding revision {candidate.binding_epoch}. To choose a different task, pair it in AI app connection setup, then refresh here.</p>
      <label className="flex gap-2"><input type="checkbox" checked={reviewedTask} disabled={busy}
        onChange={event => setReviewedTask(event.target.checked)} />Use this paired task for this room.</label>
      <button type="button" disabled={busy || !reviewedTask || room.status === "closed"}
        className="rounded border border-cyan-300/30 px-3 py-2 disabled:opacity-50"
        onClick={() => void run(async signal => {
          const revision = mission?.mission_revision ?? null;
          const next = await selectRoomMission(room.room_id, candidate, revision,
            requestId(JSON.stringify(["select", room.room_id, candidate, revision])), signal);
          if (!signal.aborted) { setCatalog(current => current ? { ...current, mission: next } : null); onMissionChanged?.(next); setReviewedTask(false); setMessage("Room mission selected. Review a captured instruction before sending it."); }
        })}>Select room task</button>
    </div> : null}
    {catalog?.candidate_unavailable ? <p className="mt-3">No current paired task is ready. Open AI app connection setup, restore its connection, then refresh.</p> : null}
    {mission?.status === "active" ? <div className="mt-4 space-y-3">
      <p>After room speech is captured, refresh and choose one instruction. Only speech still available in this browser and authorized by the server is listed.</p>
      {options.length ? <>
        <label className="block">Captured room instruction
          <select aria-label="Captured room instruction" value={handoffId} disabled={busy}
            className="mt-1 block w-full rounded border border-white/20 bg-slate-950 p-2"
            onChange={event => setHandoffId(event.target.value)}>
            <option value="">Choose captured speech…</option>
            {options.map(option => <option key={option.handoff_id} value={option.handoff_id}>
              {speaker(option.speaker_participant_id)} · {new Date(option.created_at_ms).toLocaleTimeString()}
            </option>)}
          </select>
        </label>
        {selected ? <>
          <p className="whitespace-pre-wrap rounded border border-white/10 p-2">{speaker(selected.speaker_participant_id)}: {selected.local.text}</p>
          <label className="flex items-start gap-2"><input type="checkbox" disabled={busy || queued} checked={approved}
            onChange={event => setApproved(event.target.checked)} />Send this exact instruction to the selected Codex task. It may use that task's model allowance; program permissions still apply.</label>
          <button type="button" disabled={busy || !approved || queued || room.status === "closed"}
            className="rounded border border-cyan-300/30 px-3 py-2 disabled:opacity-50"
            onClick={() => void run(async signal => {
              const event = await dispatchRoomMissionHandoff(mission, selected.local, selected.speaker_participant_id, signal);
              if (!signal.aborted) {
                setQueued(true); setApproved(false);
                setMessage(event.delivery_state === "pending"
                  ? "Instruction queued. Codex pickup and a result are not confirmed. Refresh task results after it reports back."
                  : event.delivery_state === "acknowledged"
                    ? "The task acknowledged this instruction. A result is not yet confirmed."
                    : `Instruction is ${event.delivery_state}. It is not confirmed as delivered.`);
              }
            })}>Send reviewed instruction</button>
        </> : null}
      </> : <p>No current captured instructions. Start the consenting room session and speak, then refresh. Reconnecting clears this browser's previews.</p>}
    </div> : null}
    {busy ? <p role="status" className="mt-2">Checking room task…</p> : null}
    {message ? <p role="status" className="mt-2 text-amber-100">{message}</p> : null}
  </section>;
}
