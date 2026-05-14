import type { HelixUserSteeringEvidence } from "@shared/helix-user-steering-evidence";
import { recordSubgoalEvaluation } from "../helix-ask/subgoal-evaluator";
import { recordSyntheticEvidence } from "./synthetic-evidence-ledger";
import { getActiveLiveSituationArtifactForThread, updateLiveSituationArtifact } from "./live-situation-artifact-store";
import { markClarificationNeedAnswered } from "./clarification-question-planner";
import { recordInterpretedEventForUserSteering } from "./interpreted-event-builder";
import { buildUserSteeringEvent } from "../helix-ask/user-steering-event-planner";

export function applyUserSteeringEvidence(input: {
  steering: HelixUserSteeringEvidence;
  roomId?: string | null;
  clarificationNeedId?: string | null;
}): {
  synthetic_evidence: ReturnType<typeof recordSyntheticEvidence>;
  subgoal_evaluation: ReturnType<typeof recordSubgoalEvaluation>;
  live_artifact_delta: ReturnType<typeof updateLiveSituationArtifact> | null;
} {
  if (input.clarificationNeedId) markClarificationNeedAnswered(input.clarificationNeedId);
  const syntheticEvidence = recordSyntheticEvidence({
    thread_id: input.steering.thread_id,
    produced_by: "deterministic_reducer",
    claim: `User steering: ${input.steering.user_claim}`,
    support_status: input.steering.effect === "reject" ? "contradicts" : input.steering.effect === "unknown" ? "unknown" : "supports",
    source_refs: [input.steering.steering_id, ...input.steering.evidence_refs],
    reusable_context_ref: input.steering.steering_id,
    deterministic: true,
    model_invoked: false,
  });
  const subgoalEvaluation = recordSubgoalEvaluation({
    thread_id: input.steering.thread_id,
    subgoal_id: `user-steering:${input.steering.effect}`,
    goal_label: input.steering.user_claim,
    evidence_ids: [syntheticEvidence.evidence_id, ...input.steering.target_hypothesis_ids],
    status: input.steering.effect === "reject" ? "blocked" : "active",
    evaluation_summary: `User steering applied as ${input.steering.effect}; next checks: ${input.steering.next_checks.join(", ") || "none"}.`,
    next_best_tool: "situation-room.query_interpreted_event_log",
    deterministic: true,
    model_invoked: false,
  });
  const artifact = getActiveLiveSituationArtifactForThread(input.steering.thread_id);
  const liveArtifactDelta = artifact && (!input.roomId || artifact.room_id === input.roomId)
    ? updateLiveSituationArtifact({
        artifact_id: artifact.artifact_id,
        turn_id: input.steering.steering_id,
        reason: "manual_refresh",
        current_state_lines: {
          goal: `User steering: ${input.steering.user_claim}`,
          unknowns: `Next check: ${input.steering.next_checks.join(", ") || "watch for confirming source evidence"}.`,
          last_decision: `Steering evidence recorded as ${input.steering.effect}; present-state projection updated.`,
        },
        evidence_refs: [input.steering.steering_id, syntheticEvidence.evidence_id],
      })
    : null;
  recordInterpretedEventForUserSteering(buildUserSteeringEvent({
    threadId: input.steering.thread_id,
    roomId: input.roomId ?? artifact?.room_id ?? null,
    prompt: input.steering.user_claim,
    targetIds: input.steering.target_hypothesis_ids,
    evidenceRefs: [input.steering.steering_id, syntheticEvidence.evidence_id],
  }));
  return {
    synthetic_evidence: syntheticEvidence,
    subgoal_evaluation: subgoalEvaluation,
    live_artifact_delta: liveArtifactDelta,
  };
}
