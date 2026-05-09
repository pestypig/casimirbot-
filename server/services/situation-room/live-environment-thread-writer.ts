import type { LiveAnswerEnvironmentDelta } from "@shared/helix-live-answer-environment";

export function buildLiveEnvironmentThreadObservation(delta: LiveAnswerEnvironmentDelta) {
  return {
    schema: "helix.live_environment_thread_observation.v1",
    environment_id: delta.environment_id,
    thread_id: delta.thread_id,
    delta_id: delta.delta_id,
    reason: delta.reason,
    changed_line_keys: delta.changed_line_keys,
    next_hash: delta.next_hash,
    evidence_refs: delta.evidence_refs,
    deterministic: true,
    model_invoked: false,
    context_role: "observation_not_assistant_answer",
  };
}
