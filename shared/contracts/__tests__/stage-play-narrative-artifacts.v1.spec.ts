import { describe, expect, it } from "vitest";
import {
  buildStagePlayCompactObservationV1,
  isStagePlayCompactObservationV1,
  validateStagePlayCompactObservationV1,
} from "../stage-play-compact-observation.v1";
import {
  buildStagePlayPredictionHypothesisV1,
  isStagePlayPredictionHypothesisV1,
  validateStagePlayPredictionHypothesisV1,
} from "../stage-play-prediction.v1";
import {
  buildStagePlayPredictionValidationV1,
  isStagePlayPredictionValidationV1,
  validateStagePlayPredictionValidationV1,
} from "../stage-play-prediction-validation.v1";

describe("stage_play narrative evidence contracts", () => {
  it("validates compact narrative observations as tool evidence", () => {
    const observation = buildStagePlayCompactObservationV1({
      observationId: "stage_play_compact_observation:test",
      domain: "narrative_media",
      sourceWindow: {
        sourceIds: ["source:browser-tab-audio"],
        fromTs: "2026-06-02T13:00:00.000Z",
        toTs: "2026-06-02T13:00:10.000Z",
        windowId: "window:narrative:1",
      },
      sceneFacts: [
        {
          factId: "setting.bridge",
          factKind: "setting",
          label: "Bridge",
          summary: "Command bridge setting is indicated.",
          confidence: 0.76,
          evidenceRefs: ["stage_play_raw_session_buffer_entry:audio-1"],
        },
        {
          factId: "blocked.cannot_attack_yet",
          factKind: "blocked_affordance",
          label: "Cannot attack yet",
          summary: "Attack is blocked or premature under current constraints.",
          confidence: 0.8,
          evidenceRefs: ["stage_play_raw_session_buffer_entry:audio-1"],
        },
      ],
    });

    expect(validateStagePlayCompactObservationV1(observation)).toEqual([]);
    expect(isStagePlayCompactObservationV1(observation)).toBe(true);
    expect(observation.rawContentIncluded).toBe(false);
    expect(observation.assistant_answer).toBe(false);
    expect(observation.context_role).toBe("tool_evidence");
  });

  it("rejects invalid compact observation confidence and authority", () => {
    const observation = buildStagePlayCompactObservationV1({
      observationId: "stage_play_compact_observation:test",
      domain: "narrative_media",
      sourceWindow: {
        sourceIds: ["source:browser-tab-audio"],
        fromTs: "2026-06-02T13:00:00.000Z",
        toTs: "2026-06-02T13:00:10.000Z",
      },
      sceneFacts: [
        {
          factId: "actor.commander",
          factKind: "actor",
          label: "Commander",
          summary: "Commander role is indicated.",
          confidence: 0.78,
          evidenceRefs: [],
        },
      ],
    });
    const invalid = {
      ...observation,
      assistant_answer: true,
      sceneFacts: [
        {
          ...observation.sceneFacts[0],
          confidence: 1.2,
        },
      ],
    };

    expect(validateStagePlayCompactObservationV1(invalid)).toEqual(expect.arrayContaining([
      "sceneFacts[0].confidence must be between 0 and 1",
      "assistant_answer must be false",
    ]));
  });

  it("validates prediction hypotheses as scoreable tool evidence", () => {
    const prediction = buildStagePlayPredictionHypothesisV1({
      predictionId: "stage_play_prediction_hypothesis:test",
      graphId: "stage_play_badge_graph:narrative:test",
      sourceObservationWindow: {
        fromTs: "2026-06-02T13:00:00.000Z",
        toTs: "2026-06-02T13:00:10.000Z",
        evidenceRefs: ["stage_play_compact_observation:test"],
      },
      predictionWindow: {
        horizonKind: "next_scene_beat",
        expiresAfterTs: null,
      },
      predictedMoveClass: "delay",
      actorRefs: ["actor.commander"],
      supportingBadgeIds: ["binding.controlled_stalling"],
      blockedMoveIds: ["blocked.cannot_attack_yet"],
      claim: "The constrained next move class is likely delay.",
      confidence: 0.72,
      scoreableSignals: [
        "move_class:delay",
        "actor:actor.commander",
        "blocked_move:blocked.cannot_attack_yet",
      ],
      evidenceRefs: ["stage_play_compact_observation:test"],
    });

    expect(validateStagePlayPredictionHypothesisV1(prediction)).toEqual([]);
    expect(isStagePlayPredictionHypothesisV1(prediction)).toBe(true);
    expect(prediction.assistant_answer).toBe(false);
    expect(prediction.context_role).toBe("tool_evidence");
  });

  it("validates prediction validations as non-terminal scoring evidence", () => {
    const validation = buildStagePlayPredictionValidationV1({
      validationId: "stage_play_prediction_validation:test",
      predictionId: "stage_play_prediction_hypothesis:test",
      graphId: "stage_play_badge_graph:narrative:test",
      validationWindow: {
        fromTs: "2026-06-02T13:00:10.000Z",
        toTs: "2026-06-02T13:00:20.000Z",
        evidenceRefs: ["stage_play_compact_observation:later"],
      },
      outcome: "confirmed",
      matchedSignals: ["move_class:delay"],
      contradictedSignals: [],
      confidenceDelta: 0.18,
      explanation: "The later compact observation matched the predicted move class.",
    });

    expect(validateStagePlayPredictionValidationV1(validation)).toEqual([]);
    expect(isStagePlayPredictionValidationV1(validation)).toBe(true);
    expect(validation.assistant_answer).toBe(false);
    expect(validation.context_role).toBe("tool_evidence");
  });
});
