import { z } from "zod";
import { roomMissionOwnerCatalogSchema, roomMissionOwnerSelectionSchema,
  type RoomMissionOwnerSelection, type RoomMissionTarget } from "@shared/helix-room-mission-owner";
import { helixReasoningSteeringEventProjectionSchema } from "@shared/helix-reasoning-task-binding";
import type { LocalRoomHandoff } from "./RoomMissionHandoffReview";

const base = "/api/account/session/agent-connections/room-missions";
export class RoomMissionRequestError extends Error {
  constructor(readonly code: string) { super(code); }
}
async function request(path: string, signal: AbortSignal, body?: unknown) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(base + path, { method: body === undefined ? "GET" : "POST",
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
          ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
        const result = await response.json();
        if (!response.ok) throw new RoomMissionRequestError(
          typeof result?.error === "string" && /^(room_mission_|reasoning_binding_|pairing_|session_required)[a-z0-9_]*$/u.test(result.error)
            ? result.error : "room_mission_request_failed");
        return result;
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => {
        reject(new Error("room_mission_outcome_unknown")); controller.abort();
      }, 10_000); }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
export async function readRoomMissionOptions(roomId: string, signal: AbortSignal) {
  const parsed = roomMissionOwnerCatalogSchema.safeParse(await request(`/${encodeURIComponent(roomId)}/owner-options`, signal));
  if (!parsed.success || parsed.data.room_id !== roomId ||
      (parsed.data.mission && parsed.data.mission.room_id !== roomId)) throw new RoomMissionRequestError("room_mission_response_mismatch");
  return parsed.data;
}
const selectionResponse = z.object({ ok: z.literal(true), mission: roomMissionOwnerSelectionSchema.passthrough(),
  dispatch_authority: z.literal(false), answer_authority: z.literal(false), terminal_eligible: z.literal(false) });
export async function selectRoomMission(roomId: string, candidate: RoomMissionTarget,
  expectedRevision: number | null, requestId: string, signal: AbortSignal) {
  const result = selectionResponse.safeParse(await request("/select", signal,
    { ...candidate, room_id: roomId, expected_revision: expectedRevision, request_id: requestId }));
  if (!result.success) throw new RoomMissionRequestError("room_mission_response_mismatch");
  const mission = result.data.mission;
  if (mission.room_id !== roomId || mission.status !== "active" ||
      Object.entries(candidate).some(([key, value]) => mission[key] !== value) ||
      mission.mission_revision !== (expectedRevision ?? 0) + 1)
    throw new RoomMissionRequestError("room_mission_response_mismatch");
  return mission;
}
export async function revokeRoomMission(mission: RoomMissionOwnerSelection, requestId: string, signal: AbortSignal) {
  const result = selectionResponse.safeParse(await request(`/${encodeURIComponent(mission.room_id)}/revoke`, signal,
    { expected_revision: mission.mission_revision, request_id: requestId }));
  if (!result.success || result.data.mission.room_id !== mission.room_id ||
      result.data.mission.mission_id !== mission.mission_id || result.data.mission.status !== "revoked" ||
      result.data.mission.mission_revision !== mission.mission_revision + 1)
    throw new RoomMissionRequestError("room_mission_response_mismatch");
  return result.data.mission;
}
export async function dispatchRoomMissionHandoff(mission: RoomMissionOwnerSelection,
  handoff: LocalRoomHandoff, speakerId: string, signal: AbortSignal) {
  if (mission.room_id !== handoff.roomId) throw new RoomMissionRequestError("room_mission_response_mismatch");
  // Stable across explicit retries/remounts. The server also binds this request
  // to the exact mission envelope and rejects changed scope on the same binding.
  const clientEventRef = `room-handoff:${handoff.handoffId}`;
  const result = z.object({ ok: z.literal(true), event: helixReasoningSteeringEventProjectionSchema,
    room_mission_id: z.literal(mission.mission_id), room_mission_revision: z.literal(mission.mission_revision),
    speaker_participant_id: z.literal(speakerId), provider_pickup_confirmed: z.literal(false),
    answer_authority: z.literal(false), terminal_eligible: z.literal(false),
  }).safeParse(await request("/dispatch-handoff", signal, { room_id: mission.room_id,
    room_mission_id: mission.mission_id, room_mission_revision: mission.mission_revision,
    handoff_id: handoff.handoffId, transcript_text: handoff.text, client_event_ref: clientEventRef }));
  if (!result.success || result.data.event.reasoning_binding_id !== mission.reasoning_binding_id ||
      result.data.event.binding_epoch !== mission.binding_epoch || result.data.event.client_event_ref !== clientEventRef ||
      result.data.event.instruction_sha256 !== handoff.textHash.replace(/^sha256:/u, "") ||
      result.data.event.instruction_length !== handoff.text.length || result.data.event.origin !== "gpt_live_finalized")
    throw new RoomMissionRequestError("room_mission_response_mismatch");
  return result.data.event;
}
