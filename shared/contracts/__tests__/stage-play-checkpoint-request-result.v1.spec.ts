import { describe, expect, it } from "vitest";
import { buildStagePlayCheckpointRequestV1 } from "../stage-play-checkpoint-request.v1";
import {
  buildStagePlayCheckpointRequestResultV1,
  validateStagePlayCheckpointRequestResultV1,
} from "../stage-play-checkpoint-request-result.v1";

const checkpointRequest = buildStagePlayCheckpointRequestV1({
  checkpointRequestId: "stage_play_checkpoint_request:result-test",
  jobId: "stage_play_job:result-test",
  graphId: "stage_play_badge_graph:result-test",
  objective: "Produce a checkpoint answer snapshot for the current visual stage.",
  userPromptRef: "prompt:stage-play-result-test",
  reason: "user_requested_checkpoint",
  question: "What answer snapshot should Helix Ask produce for the current stage?",
  currentGraphRefs: ["stage_play_badge_graph:result-test"],
  compactObservationRefs: ["stage_play_compact_observation:result-test"],
  perturbationRefs: ["stage_play_perturbation_event:result-test"],
  priorAnswerSnapshotRefs: [],
  missingEvidence: [],
  checkpointPolicy: {
    autoRunEligible: false,
    requiresUserApproval: true,
    minMsSinceLastCheckpoint: 15_000,
  },
  status: "queued",
});

describe("stage_play_checkpoint_request_result/v1", () => {
  it("wraps a queued checkpoint request as evidence-only tool output", () => {
    const result = buildStagePlayCheckpointRequestResultV1({
      checkpointRequest,
      queueState: {
        schema: "stage_play_checkpoint_queue/v1",
        jobId: checkpointRequest.jobId,
        requests: [checkpointRequest],
        jobState: null,
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      readyToRun: true,
      reason: "queued",
    });

    expect(result).toMatchObject({
      schema: "stage_play_checkpoint_request_result/v1",
      readyToRun: true,
      reason: "queued",
      assistant_answer: false,
      context_role: "tool_evidence",
      checkpointRequest: {
        artifactId: "stage_play_checkpoint_request",
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      queueState: {
        schema: "stage_play_checkpoint_queue/v1",
        assistant_answer: false,
        context_role: "tool_evidence",
      },
    });
    expect(validateStagePlayCheckpointRequestResultV1(result)).toEqual([]);
  });

  it("rejects invalid authority and invalid readiness reasons", () => {
    const result = {
      schema: "stage_play_checkpoint_request_result/v1",
      checkpointRequest,
      queueState: {
        schema: "stage_play_checkpoint_queue/v1",
        jobId: checkpointRequest.jobId,
        requests: [checkpointRequest],
        jobState: null,
        assistant_answer: false,
        context_role: "tool_evidence",
      },
      readyToRun: true,
      reason: "final_answer",
      assistant_answer: true,
      context_role: "assistant_answer",
    };

    expect(validateStagePlayCheckpointRequestResultV1(result)).toEqual(expect.arrayContaining([
      "reason is invalid",
      "assistant_answer must be false",
      "context_role must be tool_evidence",
    ]));
  });
});
