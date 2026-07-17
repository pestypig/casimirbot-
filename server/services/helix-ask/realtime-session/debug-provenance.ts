import {
  HELIX_REALTIME_STAGE_PLAY_DEBUG_SCHEMA,
  type HelixRealtimeStagePlayAskHandoffV1,
  type HelixRealtimeStagePlayDebugV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import { listRealtimeStagePlayAskHandoffs } from "../live-source/realtime-stage-play-handoff";
import { readRealtimeGroundedAnswer } from "./grounded-answer-feedback";
import type { HelixRealtimeAdmittedSession } from "./session-registry";

export const buildRealtimeStagePlayDebugProvenance = (
  session: HelixRealtimeAdmittedSession,
): HelixRealtimeStagePlayDebugV1 => ({
  schema: HELIX_REALTIME_STAGE_PLAY_DEBUG_SCHEMA,
  realtime_session_id: session.realtimeSessionId,
  thread_id: session.threadId,
  provider_call_ref: session.providerCallRef,
  handoffs: listRealtimeStagePlayAskHandoffs({
    realtimeSessionId: session.realtimeSessionId,
    limit: 20,
  }).map((handoff: HelixRealtimeStagePlayAskHandoffV1) => ({
    handoff_id: handoff.handoff_id,
    provider_event_ref: handoff.provider_event_ref,
    transcript_observation_ref: handoff.transcript_observation_ref,
    stage_play_event_ref: handoff.stage_play_event_ref,
    context_pack_id: handoff.context_pack_id,
    context_hash: handoff.context_hash,
    created_at_ms: handoff.created_at_ms,
    grounded_answer: readRealtimeGroundedAnswer(handoff.handoff_id),
  })),
  latest_context_sync: session.latestContextSync,
  authority: {
    realtime_answer_authority: false,
    workstation_action_authority: false,
    terminal_answer_authority: false,
    grounded_answer_requires_completed_solver_path: true,
  },
  provider_call_id_included: false,
  provider_payload_included: false,
  raw_content_included: false,
});
