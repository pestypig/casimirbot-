import { readRealtimeStagePlayAskHandoff, readRealtimeStagePlayTurnActorContext } from "../live-source/realtime-stage-play-handoff";
import type { HelixWorkstationGatewayAccountContext } from "../workstation-tool-gateway/account-policy";
import type { RealtimeConversationContextMaterialization } from "./realtime-conversation-context";
import { revalidateRealtimeRoomTurnActorContext, roomIdFromHelixAskThread } from "../realtime-room/turn-actor-context";
import { buildRealtimeRequesterRef, readAdmittedRealtimeSession } from "../realtime-session/session-registry";

/**
 * Adds server-only voice speaker identity only after the existing Realtime
 * utterance/context binding has been validated. A missing private handoff
 * record becomes an explicit unavailable marker so voice never falls back to
 * the browser account's player silently.
 */
export const bindTrustedRealtimeTurnActorContext = async (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  realtimeConversationContext: RealtimeConversationContextMaterialization | null;
  gatewayConversationThreadId: string;
  nowMs?: number;
}): Promise<HelixWorkstationGatewayAccountContext> => {
  const verifiedRealtimeVoiceHandoff = Boolean(
    input.realtimeConversationContext?.audit.status === "materialized" &&
      input.realtimeConversationContext.trustedMailboxThreadId,
  );
  if (!verifiedRealtimeVoiceHandoff) return input.accountContext;

  const storedContext = readRealtimeStagePlayTurnActorContext(
    input.realtimeConversationContext!.audit.handoff_id,
  );
  const roomId = roomIdFromHelixAskThread(input.gatewayConversationThreadId);
  const handoff = readRealtimeStagePlayAskHandoff(input.realtimeConversationContext!.audit.handoff_id);
  const sameAccountAndRoom = input.accountContext.trusted_account_session &&
    input.accountContext.session_id && storedContext?.requester_profile_id === input.accountContext.profile_id &&
    storedContext?.room_id === roomId &&
    handoff?.realtime_session_id === storedContext?.realtime_session_id &&
    handoff?.thread_id === input.gatewayConversationThreadId &&
    input.realtimeConversationContext!.trustedMailboxThreadId === input.gatewayConversationThreadId;
  const session = sameAccountAndRoom && storedContext ? readAdmittedRealtimeSession({
    realtimeSessionId: storedContext.realtime_session_id,
    requesterRef: buildRealtimeRequesterRef(input.accountContext.session_id),
    nowMs: input.nowMs,
  }) : null;
  const current = session?.threadId === input.gatewayConversationThreadId && storedContext &&
    await revalidateRealtimeRoomTurnActorContext(storedContext, input.nowMs).catch(() => false);
  const unavailableContext = {
    schema: "helix.realtime_room.turn_actor_context.v1" as const,
    origin: "realtime_voice" as const,
    room_id: input.gatewayConversationThreadId.startsWith("helix-ask:room:")
      ? input.gatewayConversationThreadId.slice("helix-ask:room:".length)
      : "unavailable",
    requester_profile_id: input.accountContext.profile_id ?? "unavailable",
    realtime_session_id: "unavailable",
    participant_id: null,
    resolution: "unavailable" as const,
    resolution_source: "speaker_unavailable" as const,
    captured_at_ms: input.nowMs ?? Date.now(),
  };
  return {
    ...input.accountContext,
    trusted_turn_actor_context: current ? storedContext : unavailableContext,
  };
};
