import { Router } from "express";
import { getAccountSessionStatus } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import { helixAgentAccountLinkStore } from "../services/helix-account/agent-account-link-store";
import { readSharedRealtimeRoomMembership } from "../services/helix-ask/realtime-room/room-store";
import { roomExternalMissionStore } from "../services/local-supervisor/room-external-mission-store";
import { createNativeRoomMissionResultRepository, RoomMissionResultError,
  type RoomMissionResultRepository, type RoomMissionResultRecord } from "../services/local-supervisor/room-mission-result";
import { createBrowserDurableReasoningAccess } from "../services/local-supervisor/browser-reasoning-access";
import type { HelixReasoningTaskBindingStore } from "../services/local-supervisor/reasoning-task-binding-store";
import { roomResultKnownError } from "../services/helix-ask/realtime-room/mission-result-ask";
import { roomResultCatalogSchema, type RoomResultOption } from "@shared/helix-room-result-catalog";

type Session = NonNullable<Awaited<ReturnType<typeof getAccountSessionStatus>>["session"]>;
type Dependencies = {
  reasoningBindingStore?: HelixReasoningTaskBindingStore;
  accountStatus?: typeof getAccountSessionStatus;
  membership?: typeof readSharedRealtimeRoomMembership;
  accountLinks?: Pick<typeof helixAgentAccountLinkStore, "listBindings">;
  missionStore?: Pick<typeof roomExternalMissionStore, "inspect" | "requireCurrent">;
  repository?: () => Promise<Pick<RoomMissionResultRepository, "listEventRefs">>;
  readEvidence?: (session: Session, eventRef: string) => Promise<RoomMissionResultRecord>;
};
const deny = (code: string, status = 409): never => { throw new RoomMissionResultError(code, status); };

export function createRoomResultCatalogRouter(deps: Dependencies) {
  const router = Router();
  router.get("/session/agent-connections/room-missions/:roomId/results", async (req, res) => {
    res.set({ "Cache-Control": "no-store", "Pragma": "no-cache", "X-Content-Type-Options": "nosniff" });
    try {
      const roomId = req.params.roomId;
      if (!roomId || roomId.length > 320) deny("room_result_selection_invalid", 400);
      let owner: string | undefined;
      let ownerSession: string | undefined;
      const authorize = async () => {
        const status = await (deps.accountStatus ?? getAccountSessionStatus)(readHelixSessionCookie(req.headers.cookie));
        const session = status.session;
        if (!session) deny("session_required", 401);
        if (status.account_policy.account_type !== "developer" ||
            !status.account_policy.feature_flags.includes("shared_realtime_rooms") ||
            status.account_policy.locked_features.includes("shared_realtime_rooms")) deny("room_result_developer_required", 403);
        if ((owner && owner !== session.profile.profile_id) || (ownerSession && ownerSession !== session.session_id))
          deny("room_result_owner_changed", 403);
        owner = session.profile.profile_id; ownerSession = session.session_id;
        const links = await (deps.accountLinks ?? helixAgentAccountLinkStore).listBindings({
          session: { sessionId: session.session_id, profileId: owner } });
        if (!links.bindings.some(binding => binding.status === "active")) deny("room_result_account_link_required", 403);
        const member = await (deps.membership ?? readSharedRealtimeRoomMembership)({ profileId: owner, roomId });
        if (!member || member.role !== "owner" || member.presence !== "present" || member.roomStatus === "closed")
          deny("room_result_owner_required", 403);
        const store = deps.missionStore ?? roomExternalMissionStore;
        const mission = await store.inspect(roomId);
        if (!mission) return { session, mission: null };
        if (mission.status !== "active" || mission.owner_profile_id !== owner ||
            mission.owner_participant_id !== member.participantId) deny("room_result_mission_not_current");
        await store.requireCurrent({ roomId, ownerProfileId: owner, missionId: mission.mission_id,
          missionRevision: mission.mission_revision, bindingId: mission.reasoning_binding_id,
          bindingEpoch: mission.binding_epoch, helixConversationId: mission.helix_conversation_id,
          bindingMissionId: mission.binding_mission_id, runId: mission.run_id });
        return { session, mission };
      };
      const initial = await authorize();
      const mission = initial.mission;
      const results: RoomResultOption[] = [];
      let limited = false;
      if (mission) {
        const repo = await (deps.repository ?? createNativeRoomMissionResultRepository)();
        const refs = await repo.listEventRefs({ ownerProfileId: owner!, roomId,
          missionId: mission.mission_id, missionRevision: mission.mission_revision });
        limited = refs.length > 20;
        for (const eventRef of refs.slice(0, 20)) {
          const result = deps.readEvidence ? await deps.readEvidence(initial.session, eventRef)
            : deps.reasoningBindingStore ? await createBrowserDurableReasoningAccess(initial.session, deps.reasoningBindingStore)
              .readCurrentRoomMissionResultEvidence({ ownerProfileId: owner!, steeringEventRef: eventRef })
            : deny("room_result_source_unavailable", 503);
          if (result.ownerProfileId !== owner || result.envelope.roomId !== roomId ||
              result.envelope.roomMissionId !== mission.mission_id ||
              result.envelope.roomMissionRevision !== mission.mission_revision ||
              result.request.steeringEventRef !== eventRef) deny("room_result_source_mismatch");
          results.push({ result_ref: result.resultId, steering_event_ref: eventRef,
            room_id: roomId, room_mission_id: mission.mission_id, room_mission_revision: mission.mission_revision,
            status: result.request.status, created_at: result.createdAt });
        }
      }
      const final = await authorize();
      if (final.mission?.mission_id !== mission?.mission_id ||
          final.mission?.mission_revision !== mission?.mission_revision) deny("room_result_mission_not_current");
      res.json(roomResultCatalogSchema.parse({ schema: "helix.room_result_catalog.v1", room_id: roomId,
        mission: mission ? { mission_id: mission.mission_id, mission_revision: mission.mission_revision } : null,
        results, limited, answer_authority: false, raw_content_included: false }));
    } catch (error) {
      const known = roomResultKnownError(error);
      res.status(known?.status ?? 503).json({ ok: false, error: known?.code ?? "room_result_source_unavailable",
        answer_authority: false, raw_content_included: false });
    }
  });
  return router;
}
