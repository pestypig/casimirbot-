import { describe, expect, it } from "vitest";
import type { StagePlayMicroReasonerRunV1 } from "../stage-play-live-source-mail.v1";
import { validateStagePlayMicroReasonerRunV1 } from "../stage-play-live-source-mail.v1";

const runFixture = (
  overrides: Partial<StagePlayMicroReasonerRunV1> = {},
): StagePlayMicroReasonerRunV1 => ({
  artifactId: "stage_play_micro_reasoner_run",
  schemaVersion: "stage_play_micro_reasoner_run/v1",
  runId: "stage_play_micro_reasoner_run:frog-claims",
  promptId: "stage_play_micro_reasoner_prompt:claim_extractor:v1",
  deckPresetId: "stage_play_micro_reasoner_prompt_preset:frog-classifier:v1",
  deckPresetTitle: "Frog classifier",
  deckRunPlan: "baseline_plus_prompted",
  deckRoleIndex: 1,
  deckRoleCount: 2,
  deckExecutionMode: "independent",
  deckProductRole: false,
  role: "claim_extractor",
  jobId: "stage_play_live_source_job:frog",
  sourceId: "visual_source:screen",
  mailIds: ["stage_play_live_source_mail:visual-1"],
  inputRefs: ["stage_play_live_source_mail:visual-1"],
  outputRefs: ["microdeck_output:frog-claims"],
  inputPreview: "Frog image visible in ImageLens.",
  outputPreview: "Likely frog classification cues are visible.",
  status: "completed",
  reasoningMode: "micro_live_interval",
  selectedDecision: "record_interpretation",
  salienceLevel: "medium",
  voiceCandidate: false,
  confidence: "high",
  missingEvidence: [],
  startedAt: "2026-06-17T14:00:00.000Z",
  completedAt: "2026-06-17T14:00:01.000Z",
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  context_role: "micro_reasoner_evidence",
  ...overrides,
});

describe("stage_play_micro_reasoner_run/v1", () => {
  it("accepts MicroReasoner runs as evidence-only non-terminal observations", () => {
    expect(validateStagePlayMicroReasonerRunV1(runFixture())).toEqual([]);
  });

  it("rejects MicroReasoner runs that try to become answer authority", () => {
    const invalid = {
      ...runFixture(),
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      context_role: "assistant_answer",
    };

    expect(validateStagePlayMicroReasonerRunV1(invalid)).toEqual(expect.arrayContaining([
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
      "context_role must be tool_evidence or micro_reasoner_evidence",
    ]));
  });
});
