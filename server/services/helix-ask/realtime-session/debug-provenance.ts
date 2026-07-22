import {
  HELIX_REALTIME_STAGE_PLAY_DEBUG_SCHEMA,
  type HelixRealtimeStagePlayAskHandoffV1,
  type HelixRealtimeStagePlayDebugV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import { listRealtimeStagePlayAskHandoffs } from "../live-source/realtime-stage-play-handoff";
import { readRealtimeGroundedAnswer } from "./grounded-answer-feedback";
import { readRealtimeGroundedFeedbackObserverAudit } from "./grounded-answer-feedback-audit";
import {
  listRealtimeGroundedAnswerRelays,
  readRealtimeGroundedAnswerRelay,
} from "./grounded-answer-relay";
import type { HelixRealtimeAdmittedSession } from "./session-registry";

export const buildRealtimeStagePlayDebugProvenance = (
  session: HelixRealtimeAdmittedSession,
): HelixRealtimeStagePlayDebugV1 => ({
  schema: HELIX_REALTIME_STAGE_PLAY_DEBUG_SCHEMA,
  realtime_session_id: session.realtimeSessionId,
  thread_id: session.threadId,
  bound_goal_id: session.boundGoalId,
  bound_runtime_session_ref: session.boundRuntimeSessionRef,
  bound_runtime_agent_provider: session.boundRuntimeAgentProvider,
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
    transcript_text_hash: handoff.transcript_text_hash,
    transcript_text_char_count: handoff.transcript_text_char_count,
    goal_id: handoff.goal_id,
    runtime_goal_session_ref: handoff.runtime_goal_session_ref,
    runtime_agent_provider: handoff.runtime_agent_provider,
    required_grounding_capability_ids: handoff.required_grounding_capability_ids,
    worker_admission: handoff.worker_admission,
    created_at_ms: handoff.created_at_ms,
    feedback_observer_audit: readRealtimeGroundedFeedbackObserverAudit(handoff.handoff_id),
    grounded_answer: readRealtimeGroundedAnswer(handoff.handoff_id),
    grounded_relay: readRealtimeGroundedAnswerRelay(handoff.handoff_id),
  })),
  latest_context_sync: session.latestContextSync,
  latest_grounded_relay: listRealtimeGroundedAnswerRelays({
    realtimeSessionId: session.realtimeSessionId,
    limit: 1,
  })[0] ?? null,
  authority: {
    realtime_answer_authority: false,
    workstation_action_authority: false,
    terminal_answer_authority: false,
    grounded_answer_requires_completed_solver_path: true,
    grounded_answer_requires_route_evidence: true,
    grounded_feedback_requires_issued_handoff_binding: true,
    grounded_feedback_requires_current_turn_capability_evidence: true,
    spoken_relay_requires_server_authoritative_grounded_answer: true,
    realtime_relay_answer_authority: false,
  },
  provider_call_id_included: false,
  provider_payload_included: false,
  raw_content_included: false,
});
