import { buildRealtimeRequesterRef, listAdmittedRealtimeSessions } from "../realtime-session/session-registry";
import { buildRuntimeGoalProfileRef } from "../runtime-goals/runtime-goal-profile-ref";
import { SharedRealtimeRoomDomainError } from "./room-store/domain-error";

// Both browser and OAuth joining must use the same profile-level exclusion.
// Call while holding the existing profile admission lock.
export function assertNoPersonalRealtimeSession(profileId: string, sessionId: string | null): void {
  const requesterRef = sessionId ? buildRealtimeRequesterRef(sessionId) : null;
  const profileRef = buildRuntimeGoalProfileRef(profileId);
  if (listAdmittedRealtimeSessions().some(session =>
    (requesterRef !== null && session.requesterRef === requesterRef) ||
    session.runtimeGoalAccountScope?.profile_ref === profileRef)) {
    throw new SharedRealtimeRoomDomainError("shared_realtime_room_personal_session_blocked", 409,
      "Stop your personal GPT Live session before joining a one-model room.");
  }
}
