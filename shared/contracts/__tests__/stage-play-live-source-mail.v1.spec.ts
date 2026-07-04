import { describe, expect, it } from "vitest";
import type {
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
} from "../stage-play-live-source-mail.v1";
import {
  validateStagePlayMicroReasonerRunV1,
  validateStagePlayProcessedMailPacketV1,
} from "../stage-play-live-source-mail.v1";

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
  evidenceRefs: [
    "stage_play_micro_reasoner_run:frog-claims",
    "stage_play_live_source_mail:visual-1",
    "microdeck_output:frog-claims",
  ],
  goalContextUpdateRefs: ["stage_play_goal_context_update:microdeck:frog-claims"],
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

const processedPacketFixture = (
  overrides: Partial<StagePlayProcessedMailPacketV1> = {},
): StagePlayProcessedMailPacketV1 => ({
  artifactId: "stage_play_processed_mail_packet",
  schemaVersion: "stage_play_processed_mail_packet/v1",
  packetId: "stage_play_processed_mail_packet:translation",
  jobId: "stage_play_live_source_job:translation",
  sourceId: "document_markdown:docs/example.md",
  mailIds: ["stage_play_live_source_mail:translation"],
  visualEvidenceRefs: [],
  observedFacts: ["Document translation receipt was produced."],
  inferredFacts: [],
  uncertainties: [],
  stableFactsUsed: [],
  changedFacts: [],
  sceneTags: ["document_markdown"],
  activityTags: ["translation"],
  objectTags: [],
  matchedCriteria: [],
  suppressedCriteria: [],
  riskMatches: [],
  opportunityMatches: [],
  voiceCalloutMatches: [],
  salience: {
    level: "medium",
    reasons: ["document translation traffic"],
    voiceCandidate: false,
    calloutDraft: null,
  },
  recommendedNext: "wait_for_next_summary",
  watchNext: [],
  resolutionState: "processed_packet_ready",
  microReasonerRunRefs: ["stage_play_micro_reasoner_run:translation"],
  evidenceRefs: [
    "stage_play_processed_mail_packet:translation",
    "stage_play_live_source_mail:translation",
    "stage_play_micro_reasoner_run:translation",
    "receipt:translation",
  ],
  evidenceHandles: {
    sourceReceipts: [{
      receiptId: "stage_play_live_source_mail:translation",
      sourceId: "document_markdown:docs/example.md",
      sourceKind: "document_markdown",
      mailId: "stage_play_live_source_mail:translation",
      capturedAt: "2026-06-17T14:00:00.000Z",
      evidenceRefs: [
        "stage_play_live_source_mail:translation",
        "receipt:translation",
      ],
      receiptRef: "receipt:translation",
    }],
    frameReceipts: [],
    frameIntervals: [],
    lensProducts: [],
    situationSlices: [],
  },
  createdAt: "2026-06-17T14:00:00.000Z",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  context_role: "tool_evidence",
  ...overrides,
});

describe("stage_play_processed_mail_packet/v1", () => {
  it("accepts source receipt receipt refs when they are packet-level evidence", () => {
    expect(validateStagePlayProcessedMailPacketV1(processedPacketFixture())).toEqual([]);
  });

  it("rejects source receipt receipt refs that are not preserved as evidence", () => {
    const invalid = processedPacketFixture({
      evidenceRefs: [
        "stage_play_processed_mail_packet:translation",
        "stage_play_live_source_mail:translation",
        "stage_play_micro_reasoner_run:translation",
      ],
      evidenceHandles: {
        sourceReceipts: [{
          receiptId: "stage_play_live_source_mail:translation",
          sourceId: "document_markdown:docs/example.md",
          sourceKind: "document_markdown",
          mailId: "stage_play_live_source_mail:translation",
          capturedAt: "2026-06-17T14:00:00.000Z",
          evidenceRefs: ["stage_play_live_source_mail:translation"],
          receiptRef: "receipt:translation",
        }],
        frameReceipts: [],
        frameIntervals: [],
        lensProducts: [],
        situationSlices: [],
      },
    });

    expect(validateStagePlayProcessedMailPacketV1(invalid)).toEqual(expect.arrayContaining([
      "evidenceHandles.sourceReceipts evidenceRefs must include receiptRef",
      "evidenceRefs must include source receipt receiptRef",
    ]));
  });
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

  it("rejects MicroReasoner evidence refs that omit the run, input, or output refs", () => {
    expect(validateStagePlayMicroReasonerRunV1(runFixture({
      evidenceRefs: ["stage_play_live_source_mail:visual-1", "microdeck_output:frog-claims"],
    }))).toEqual(expect.arrayContaining([
      "evidenceRefs must include runId",
    ]));

    expect(validateStagePlayMicroReasonerRunV1(runFixture({
      evidenceRefs: ["stage_play_micro_reasoner_run:frog-claims", "microdeck_output:frog-claims"],
    }))).toEqual(expect.arrayContaining([
      "evidenceRefs must include inputRefs",
    ]));

    expect(validateStagePlayMicroReasonerRunV1(runFixture({
      evidenceRefs: ["stage_play_micro_reasoner_run:frog-claims", "stage_play_live_source_mail:visual-1"],
      goalContextUpdateRefs: ["stage_play_goal_context_update:microdeck:frog-claims", ""],
    }))).toEqual(expect.arrayContaining([
      "evidenceRefs must include outputRefs",
      "goalContextUpdateRefs must include only non-empty strings",
    ]));
  });
});
