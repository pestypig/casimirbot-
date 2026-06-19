import { beforeEach, describe, expect, it } from "vitest";
import type { StagePlayMicroReasonerRunV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  getStagePlayMicroReasonerRun,
  recordStagePlayMicroReasonerRun,
  resetStagePlayProcessedMailPacketStoreForTest,
} from "../services/stage-play/stage-play-processed-mail-packet-store";

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

describe("stage play MicroReasoner run store", () => {
  beforeEach(() => {
    resetStagePlayProcessedMailPacketStoreForTest();
  });

  it("records valid evidence-only MicroReasoner runs", () => {
    const run = recordStagePlayMicroReasonerRun(runFixture());

    expect(run.assistant_answer).toBe(false);
    expect(run.terminal_eligible).toBe(false);
    expect(run.raw_content_included).toBe(false);
    expect(run.evidenceRefs).toEqual(expect.arrayContaining([
      run.runId,
      "stage_play_live_source_mail:visual-1",
      "microdeck_output:frog-claims",
    ]));
    expect(run.goalContextUpdateRefs).toEqual([]);
    expect(getStagePlayMicroReasonerRun(run.runId)).toEqual(run);
  });

  it("rejects MicroReasoner runs before they can enter trace memory as answers", () => {
    const invalidRun = {
      ...runFixture(),
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
    } as unknown as StagePlayMicroReasonerRunV1;

    expect(() => recordStagePlayMicroReasonerRun(invalidRun)).toThrow(
      /assistant_answer must be false; terminal_eligible must be false; raw_content_included must be false/,
    );
    expect(getStagePlayMicroReasonerRun(invalidRun.runId)).toBeNull();
  });
});
