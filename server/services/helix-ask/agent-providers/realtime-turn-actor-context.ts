import { readRealtimeStagePlayTurnActorContext } from "../live-source/realtime-stage-play-handoff";
import type { HelixWorkstationGatewayAccountContext } from "../workstation-tool-gateway/account-policy";
import type { RealtimeConversationContextMaterialization } from "./realtime-conversation-context";

/**
 * Adds server-only voice speaker identity only after the existing Realtime
 * utterance/context binding has been validated. A missing private handoff
 * record becomes an explicit unavailable marker so voice never falls back to
 * the browser account's player silently.
 */
export const bindTrustedRealtimeTurnActorContext = (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  realtimeConversationContext: RealtimeConversationContextMaterialization | null;
  gatewayConversationThreadId: string;
  nowMs?: number;
}): HelixWorkstationGatewayAccountContext => {
  const verifiedRealtimeVoiceHandoff = Boolean(
    input.realtimeConversationContext?.audit.status === "materialized" &&
      input.realtimeConversationContext.trustedMailboxThreadId,
  );
  if (!verifiedRealtimeVoiceHandoff) return input.accountContext;

  const storedContext = readRealtimeStagePlayTurnActorContext(
    input.realtimeConversationContext!.audit.handoff_id,
  );
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
    trusted_turn_actor_context: storedContext ?? unavailableContext,
  };
};
