import { describe, expect, it } from "vitest";
import {
  buildStagePlayJobPlanV1,
  validateStagePlayJobPlanV1,
} from "../stage-play-job-plan.v1";

describe("stage_play_job_plan/v1", () => {
  it("represents an evidence-only Stage Play setup plan", () => {
    const plan = buildStagePlayJobPlanV1({
      jobObjective: "Predict what happens next in a YouTube tab from visual capture.",
      domain: "narrative_media",
      requiredSources: [
        {
          modality: "visual_frame",
          label: "Browser tab visual source",
          required: true,
          recommendedCadenceMs: 10_000,
          routeTo: "narrative_stage_play",
        },
        {
          modality: "audio_transcript",
          label: "Optional audio transcript source",
          required: false,
          recommendedCadenceMs: 10_000,
          routeTo: "narrative_stage_play",
        },
      ],
      nodeChain: [
        {
          nodeId: "observer.live_sources",
          nodeKind: "observer",
          label: "Observer: live source custody",
          requiredInputs: [],
          expectedOutputs: ["selected visual/audio sources"],
        },
        {
          nodeId: "helix_ask.checkpoint.latest",
          nodeKind: "helix_ask_checkpoint",
          label: "Helix Ask checkpoint",
          requiredInputs: ["checkpoint_request.queued"],
          expectedOutputs: ["model-reviewed checkpoint receipt"],
        },
        {
          nodeId: "answer_snapshot.latest",
          nodeKind: "answer_snapshot",
          label: "Answer Snapshot",
          requiredInputs: ["helix_ask.checkpoint.latest"],
          expectedOutputs: ["upheld answer for this checkpoint"],
        },
      ],
      missingSetup: ["Browser tab visual source is needed for this Stage Play job."],
      readinessChecks: [
        {
          check: "Browser tab visual source is active.",
          status: "missing",
          nextAction: "Attach browser tab visual capture at 10s cadence.",
        },
      ],
      checkpointPolicy: {
        triggerOnFirstObservation: false,
        triggerOnSceneChange: true,
        triggerOnPredictionHorizonExpired: true,
        minMsSinceLastCheckpoint: 15_000,
        manualUserPriority: true,
      },
      predictionPolicy: {
        enabled: true,
        horizon: "next_scene_beat",
        validateAgainstNextWindow: true,
      },
    });

    expect(validateStagePlayJobPlanV1(plan)).toEqual([]);
    expect(plan).toMatchObject({
      artifactId: "stage_play_job_plan",
      schemaVersion: "stage_play_job_plan/v1",
      assistant_answer: false,
      context_role: "tool_evidence",
    });
  });

  it("rejects answer-authority and malformed setup plans", () => {
    const issues = validateStagePlayJobPlanV1({
      artifactId: "stage_play_job_plan",
      schemaVersion: "stage_play_job_plan/v1",
      jobObjective: "",
      domain: "bad",
      requiredSources: [
        {
          modality: "",
          label: "",
          required: "yes",
          recommendedCadenceMs: -1,
          routeTo: "execute",
        },
      ],
      nodeChain: [
        {
          nodeId: "duplicate",
          nodeKind: "observer",
          label: "Observer",
          requiredInputs: [],
          expectedOutputs: [],
        },
        {
          nodeId: "duplicate",
          nodeKind: "magic_answer",
          label: "",
          requiredInputs: "bad",
          expectedOutputs: [],
        },
      ],
      missingSetup: ["missing"],
      readinessChecks: [{ check: "", status: "unknown", nextAction: "" }],
      checkpointPolicy: {
        triggerOnFirstObservation: true,
        triggerOnSceneChange: true,
        triggerOnPredictionHorizonExpired: true,
        minMsSinceLastCheckpoint: -1,
        manualUserPriority: false,
      },
      predictionPolicy: {
        enabled: "yes",
        horizon: "later",
        validateAgainstNextWindow: "yes",
      },
      assistant_answer: true,
      context_role: "assistant_answer",
    }).join("\n");

    expect(issues).toMatch(/jobObjective must be a non-empty string/);
    expect(issues).toMatch(/domain is invalid/);
    expect(issues).toMatch(/requiredSources\[0\]\.routeTo is invalid/);
    expect(issues).toMatch(/nodeChain\[1\]\.nodeId must be unique/);
    expect(issues).toMatch(/nodeChain\[1\]\.nodeKind is invalid/);
    expect(issues).toMatch(/checkpointPolicy.manualUserPriority must be true/);
    expect(issues).toMatch(/assistant_answer must be false/);
    expect(issues).toMatch(/context_role must be tool_evidence/);
  });
});
