import { describe, expect, it } from "vitest";
import {
  buildStagePlayCheckpointRequestV1,
  validateStagePlayCheckpointRequestV1,
} from "../stage-play-checkpoint-request.v1";

describe("stage_play_checkpoint_request/v1", () => {
  it("builds an evidence-only queued checkpoint request", () => {
    const request = buildStagePlayCheckpointRequestV1({
      checkpointRequestId: "stage_play_checkpoint_request:test",
      jobId: "stage_play_job:test",
      graphId: "stage_play_badge_graph:test",
      objective: "Track the current visual source and predict the next beat.",
      userPromptRef: null,
      reason: "meaningful_perturbation",
      question: "What answer snapshot should be produced for the current stage?",
      currentGraphRefs: ["stage_play_badge_graph:test"],
      compactObservationRefs: ["stage_play_compact_observation:test"],
      perturbationRefs: ["stage_play_perturbation_event:test"],
      priorAnswerSnapshotRefs: ["answer_snapshot:prior"],
      missingEvidence: ["Audio transcript is missing."],
      checkpointPolicy: {
        autoRunEligible: true,
        requiresUserApproval: true,
        minMsSinceLastCheckpoint: 15_000,
      },
      status: "queued",
    });

    expect(request).toMatchObject({
      artifactId: "stage_play_checkpoint_request",
      schemaVersion: "stage_play_checkpoint_request/v1",
      assistant_answer: false,
      context_role: "tool_evidence",
    });
    expect(validateStagePlayCheckpointRequestV1(request)).toEqual([]);
  });

  it("rejects requests that try to become assistant answers", () => {
    const request = {
      artifactId: "stage_play_checkpoint_request",
      schemaVersion: "stage_play_checkpoint_request/v1",
      checkpointRequestId: "stage_play_checkpoint_request:bad",
      jobId: "stage_play_job:test",
      graphId: "stage_play_badge_graph:test",
      objective: "Track the source.",
      reason: "user_requested_checkpoint",
      question: "What changed?",
      currentGraphRefs: [],
      compactObservationRefs: [],
      perturbationRefs: [],
      priorAnswerSnapshotRefs: [],
      missingEvidence: [],
      checkpointPolicy: {
        autoRunEligible: false,
        requiresUserApproval: true,
        minMsSinceLastCheckpoint: 15_000,
      },
      status: "queued",
      assistant_answer: true,
      context_role: "tool_evidence",
    };

    expect(validateStagePlayCheckpointRequestV1(request)).toContain("assistant_answer must be false");
  });
});
