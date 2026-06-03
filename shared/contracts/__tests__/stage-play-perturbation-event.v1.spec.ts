import { describe, expect, it } from "vitest";
import {
  buildStagePlayPerturbationEventV1,
  validateStagePlayPerturbationEventV1,
} from "../stage-play-perturbation-event.v1";

describe("stage_play_perturbation_event/v1", () => {
  it("builds an evidence-only meaningful perturbation event", () => {
    const event = buildStagePlayPerturbationEventV1({
      perturbationId: "stage_play_perturbation_event:test",
      jobId: "stage_play_job:test",
      graphId: "stage_play_badge_graph:test",
      sourceWindowFromRefs: ["live_source_observation:before"],
      sourceWindowToRefs: ["live_source_observation:after"],
      reason: "scene_change",
      affectedBadgeIds: ["stage_interpretation.current"],
      staleAnswerSnapshotIds: ["answer_snapshot.latest"],
      materiality: "meaningful",
      checkpointSuggested: true,
      evidenceRefs: ["live_source_observation:after"],
      createdAt: "2026-06-03T12:00:00.000Z",
    });

    expect(validateStagePlayPerturbationEventV1(event)).toEqual([]);
    expect(event).toMatchObject({
      artifactId: "stage_play_perturbation_event",
      schemaVersion: "stage_play_perturbation_event/v1",
      assistant_answer: false,
      context_role: "tool_evidence",
    });
  });

  it("rejects minor perturbations that try to request checkpoints", () => {
    const event = buildStagePlayPerturbationEventV1({
      perturbationId: "stage_play_perturbation_event:minor",
      jobId: "stage_play_job:test",
      graphId: "stage_play_badge_graph:test",
      sourceWindowFromRefs: [],
      sourceWindowToRefs: ["live_source_observation:frame"],
      reason: "new_visual_frame",
      affectedBadgeIds: ["compact_observation.latest"],
      staleAnswerSnapshotIds: [],
      materiality: "minor",
      checkpointSuggested: true,
      evidenceRefs: ["live_source_observation:frame"],
      createdAt: "2026-06-03T12:00:00.000Z",
    });

    expect(validateStagePlayPerturbationEventV1(event)).toContain("minor perturbations must not suggest checkpoints");
  });
});
