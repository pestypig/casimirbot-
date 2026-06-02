import { describe, expect, it } from "vitest";
import {
  HELIX_CALLOUT_CANDIDATE_SCHEMA,
  HELIX_GOAL_EVALUATION_RECEIPT_SCHEMA,
  HELIX_LIVE_CONTINUATION_TICK_SCHEMA,
  HELIX_LIVE_SOURCE_ADMISSION_RECEIPT_SCHEMA,
  HELIX_LIVE_SOURCE_EVENT_OBSERVATION_SCHEMA,
  HELIX_WORKER_LANE_RECEIPT_SCHEMA,
  helixHypothesisNotAnswerFlags,
  helixObservationNotAnswerFlags,
  helixReceiptNotAnswerFlags,
  isHelixLiveContinuationArtifact,
  validateHelixLiveContinuationAntiPoisonFields,
  type HelixCalloutCandidate,
  type HelixGoalEvaluationReceipt,
  type HelixLiveContinuationArtifact,
  type HelixLiveContinuationTick,
  type HelixLiveSourceAdmissionReceipt,
  type HelixLiveSourceEventObservation,
  type HelixWorkerLaneReceipt,
} from "../helix-live-continuation";

const admission: HelixLiveSourceAdmissionReceipt = {
  schema: HELIX_LIVE_SOURCE_ADMISSION_RECEIPT_SCHEMA,
  receipt_id: "admission:test",
  thread_id: "thread:test",
  room_id: "room:test",
  environment_id: "env:test",
  contract_id: "contract:test",
  source_id: "source:minecraft",
  source_kind: "minecraft_world_events",
  transport: "cloudflarelink",
  source_identity: {
    world_id: "world:overworld",
    server_id: "server:paper",
    player_id: "player:dan",
  },
  freshness: {
    status: "connected",
    last_seen_at: "2026-06-01T22:00:00.000Z",
    stale_after_ms: 15000,
  },
  trust_level: "admitted_live_source",
  evidence_refs: ["world-source:source:minecraft"],
  ...helixReceiptNotAnswerFlags,
};

const observation: HelixLiveSourceEventObservation = {
  schema: HELIX_LIVE_SOURCE_EVENT_OBSERVATION_SCHEMA,
  observation_id: "observation:test",
  thread_id: "thread:test",
  room_id: "room:test",
  environment_id: "env:test",
  source_id: "source:minecraft",
  world_event_id: "world-event:test",
  signal_id: "signal:test",
  event_type: "player_position",
  salience: {
    reason: "entered cave mouth",
    priority: "warn",
    should_notify_helix: true,
    should_speak: false,
  },
  produced_refs: ["signal:test"],
  missing_evidence: [],
  evidence_refs: ["world-event:test"],
  ...helixObservationNotAnswerFlags,
};

const worker: HelixWorkerLaneReceipt = {
  schema: HELIX_WORKER_LANE_RECEIPT_SCHEMA,
  receipt_id: "worker:test",
  lane: "prediction_reflection",
  status: "succeeded",
  summary: "Structured risk hypothesis over recent Minecraft observations.",
  hypotheses: [
    {
      claim: "Player is likely preparing to enter a cave.",
      confidence: 0.62,
      evidence_refs: ["world-event:test"],
      missing_evidence: ["latest visual frame"],
    },
  ],
  recommended_next_observations: ["capture latest frame", "query recent entity events"],
  evidence_refs: ["world-event:test"],
  ...helixHypothesisNotAnswerFlags,
};

const goal: HelixGoalEvaluationReceipt = {
  schema: HELIX_GOAL_EVALUATION_RECEIPT_SCHEMA,
  receipt_id: "goal:test",
  job_id: "job:test",
  thread_id: "thread:test",
  room_id: "room:test",
  environment_id: "env:test",
  objective_ref: "objective:test",
  status: "needs_more_observation",
  rationale_codes: ["missing_visual_confirmation"],
  satisfied_evidence_refs: [],
  missing_evidence: ["latest visual frame"],
  next_step: "continue",
  evidence_refs: ["world-event:test"],
  ...helixReceiptNotAnswerFlags,
};

const callout: HelixCalloutCandidate = {
  schema: HELIX_CALLOUT_CANDIDATE_SCHEMA,
  candidate_id: "callout:test",
  thread_id: "thread:test",
  room_id: "room:test",
  source_event_id: "world-event:test",
  salience_receipt_id: "salience:test",
  callout_type: "warning",
  text: "Potential cave-entry risk; confirmation still requires fresh visual evidence.",
  certainty: "observed",
  blocked_reason: "confirm_speak_required",
  delivery: "voice_proposal",
  evidence_refs: ["worker:test"],
  ...helixObservationNotAnswerFlags,
};

const tick: HelixLiveContinuationTick = {
  schema: HELIX_LIVE_CONTINUATION_TICK_SCHEMA,
  tick_id: "tick:test",
  job_id: "job:test",
  thread_id: "thread:test",
  room_id: "room:test",
  environment_id: "env:test",
  contract_id: "contract:test",
  trigger: "world_event",
  status: "completed",
  selected_lanes: ["source_health", "prediction_reflection", "voice_gate"],
  worker_receipt_refs: ["worker:test"],
  goal_evaluation_ref: "goal:test",
  callout_candidate_ref: "callout:test",
  next_step: "continue",
  evidence_refs: ["world-event:test", "worker:test", "goal:test"],
  ...helixReceiptNotAnswerFlags,
};

describe("helix live continuation contracts", () => {
  it("keeps every continuation artifact non-terminal and model-reentry required", () => {
    const artifacts: HelixLiveContinuationArtifact[] = [
      admission,
      observation,
      worker,
      goal,
      callout,
      tick,
    ];

    for (const artifact of artifacts) {
      expect(validateHelixLiveContinuationAntiPoisonFields(artifact)).toEqual([]);
      expect(isHelixLiveContinuationArtifact(artifact)).toBe(true);
      expect(artifact.terminal_eligible).toBe(false);
      expect(artifact.assistant_answer).toBe(false);
      expect(artifact.raw_content_included).toBe(false);
      expect(artifact.post_tool_model_step_required).toBe(true);
      expect(artifact.evidence_refs.length).toBeGreaterThan(0);
    }
  });

  it("keeps prediction reflection as a structured hypothesis generator", () => {
    expect(worker.lane).toBe("prediction_reflection");
    expect(worker.context_role).toBe("hypothesis_not_assistant_answer");
    expect(worker.hypotheses).toEqual([
      expect.objectContaining({
        claim: expect.any(String),
        confidence: expect.any(Number),
        evidence_refs: expect.arrayContaining(["world-event:test"]),
        missing_evidence: expect.arrayContaining(["latest visual frame"]),
      }),
    ]);
  });

  it("rejects terminal or assistant-answer continuation artifacts", () => {
    expect(
      validateHelixLiveContinuationAntiPoisonFields({
        ...tick,
        terminal_eligible: true,
        assistant_answer: true,
        raw_content_included: true,
        post_tool_model_step_required: false,
      }),
    ).toEqual([
      "terminal_eligible must be false",
      "assistant_answer must be false",
      "raw_content_included must be false",
      "post_tool_model_step_required must be true",
    ]);
  });
});
