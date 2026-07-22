import {
  HELIX_REALTIME_GROUNDED_FEEDBACK_OBSERVER_AUDIT_SCHEMA,
  type HelixRealtimeGroundedFeedbackObserverAuditV1,
  type HelixRealtimeStagePlayAskHandoffV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";

const auditsByHandoffId = new Map<string, HelixRealtimeGroundedFeedbackObserverAuditV1>();

type AuditPatch = Partial<Omit<
  HelixRealtimeGroundedFeedbackObserverAuditV1,
  | "schema"
  | "handoff_id"
  | "realtime_session_id"
  | "observed_at_ms"
  | "updated_at_ms"
  | "answer_authority"
  | "assistant_answer"
  | "terminal_eligible"
  | "provider_payload_included"
  | "raw_content_included"
>>;

const createAudit = (
  handoff: HelixRealtimeStagePlayAskHandoffV1,
  nowMs: number,
): HelixRealtimeGroundedFeedbackObserverAuditV1 => ({
  schema: HELIX_REALTIME_GROUNDED_FEEDBACK_OBSERVER_AUDIT_SCHEMA,
  handoff_id: handoff.handoff_id,
  realtime_session_id: handoff.realtime_session_id,
  binding_status: "not_observed",
  binding_source: null,
  turn_final_status: "not_observed",
  terminal_authority_status: "not_evaluated",
  grounding_evidence_status: "not_evaluated",
  feedback_status: "not_recorded",
  grounding_proof_source: null,
  relay_status: null,
  ask_turn_id: null,
  failure_code: null,
  observed_at_ms: nowMs,
  updated_at_ms: nowMs,
  completed_at_ms: null,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  provider_payload_included: false,
  raw_content_included: false,
});

export const updateRealtimeGroundedFeedbackObserverAudit = (input: {
  handoff: HelixRealtimeStagePlayAskHandoffV1;
  patch: AuditPatch;
  nowMs?: number;
}): HelixRealtimeGroundedFeedbackObserverAuditV1 => {
  const nowMs = input.nowMs ?? Date.now();
  const current = auditsByHandoffId.get(input.handoff.handoff_id) ??
    createAudit(input.handoff, nowMs);
  const next: HelixRealtimeGroundedFeedbackObserverAuditV1 = {
    ...current,
    ...input.patch,
    updated_at_ms: nowMs,
  };
  auditsByHandoffId.set(input.handoff.handoff_id, next);
  return next;
};

export const readRealtimeGroundedFeedbackObserverAudit = (
  handoffId: string | null | undefined,
): HelixRealtimeGroundedFeedbackObserverAuditV1 | null =>
  handoffId ? auditsByHandoffId.get(handoffId) ?? null : null;

export const resetRealtimeGroundedFeedbackObserverAuditsForTests = (): void => {
  auditsByHandoffId.clear();
};
