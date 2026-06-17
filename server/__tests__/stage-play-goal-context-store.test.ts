import { beforeEach, describe, expect, it } from "vitest";
import type {
  StagePlayLiveSourceMailItemV1,
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type { StagePlayLiveSourceMailWakeRequestV1 } from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import {
  listStagePlayAgentGoalSessions,
  listStagePlayGoalContextUpdates,
  resetStagePlayGoalContextStoreForTest,
  syncStagePlayGoalContextFromMailbox,
} from "../services/stage-play/stage-play-goal-context-store";

const threadId = "helix-ask:desktop";
const now = "2026-06-17T14:00:00.000Z";

const mailFixture = (overrides: Partial<StagePlayLiveSourceMailItemV1> = {}): StagePlayLiveSourceMailItemV1 => ({
  artifactId: "stage_play_live_source_mail_item",
  schemaVersion: "stage_play_live_source_mail_item/v1",
  mailId: "stage_play_live_source_mail:visual-1",
  threadId,
  roomId: "room:stage-play",
  environmentId: "env:desktop",
  sourceId: "visual_source:screen",
  sourceKind: "visual_frame",
  sourceRefs: {
    sourceId: "visual_source:screen",
    frameRef: "visual_frame:screen-1",
    evidenceRef: "visual_frame:screen-1",
  },
  summary: {
    text: "Screen capture shows a frog image inside ImageLens.",
    preview: "Frog image visible in ImageLens.",
    confidence: 0.92,
    analysisState: "analysis_ready",
  },
  priorContext: {},
  objective: {
    objectiveId: "goal:frog-classification",
    text: "Monitor the image source and prepare frog classification evidence.",
  },
  hints: {
    deterministicChangeHint: "summary_changed",
    sourceFreshness: "fresh",
  },
  status: "read",
  evidenceRefs: ["visual_frame:screen-1"],
  createdAt: now,
  updatedAt: now,
  assistant_answer: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  raw_content_included: false,
  ...overrides,
});

const runFixture = (overrides: Partial<StagePlayMicroReasonerRunV1> = {}): StagePlayMicroReasonerRunV1 => ({
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
  startedAt: now,
  completedAt: "2026-06-17T14:00:01.000Z",
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  context_role: "micro_reasoner_evidence",
  ...overrides,
});

const packetFixture = (overrides: Partial<StagePlayProcessedMailPacketV1> = {}): StagePlayProcessedMailPacketV1 => ({
  artifactId: "stage_play_processed_mail_packet",
  schemaVersion: "stage_play_processed_mail_packet/v1",
  packetId: "stage_play_processed_mail_packet:frog-1",
  jobId: "stage_play_live_source_job:frog",
  sourceId: "visual_source:screen",
  mailIds: ["stage_play_live_source_mail:visual-1"],
  visualEvidenceRefs: ["visual_frame:screen-1"],
  observedFacts: ["A frog-like animal is visible in ImageLens."],
  inferredFacts: ["The image can be routed through a frog classification deck."],
  uncertainties: ["Species remains unresolved."],
  stableFactsUsed: ["ImageLens source is active."],
  changedFacts: ["New image captured."],
  sceneTags: ["image_lens"],
  activityTags: ["classification"],
  objectTags: ["frog"],
  matchedCriteria: ["frog_classification_candidate"],
  suppressedCriteria: [],
  riskMatches: [],
  opportunityMatches: ["classification_evidence"],
  voiceCalloutMatches: [],
  salience: {
    level: "medium",
    reasons: ["visual classification requested"],
    voiceCandidate: false,
  },
  recommendedNext: "record_interpretation",
  watchNext: ["frog markings", "image provenance"],
  resolutionState: "processed_packet_ready",
  microReasonerRunRefs: ["stage_play_micro_reasoner_run:frog-claims"],
  evidenceRefs: ["stage_play_processed_mail_packet:frog-1", "microdeck_output:frog-claims"],
  createdAt: "2026-06-17T14:00:02.000Z",
  assistant_answer: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  ...overrides,
});

describe("stage-play goal context store", () => {
  beforeEach(() => {
    resetStagePlayGoalContextStoreForTest();
  });

  it("derives queryable non-terminal goal context and an agent goal session from mailbox packets", () => {
    const updates = syncStagePlayGoalContextFromMailbox({
      threadId,
      roomId: "room:stage-play",
      mailItems: [mailFixture()],
      processedMailPackets: [packetFixture()],
      microReasonerRuns: [runFixture()],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      schemaVersion: "helix.workstation_goal_context_update.v1",
      producerKind: "microdeck",
      updateKind: "visual_observation",
      contentRef: "stage_play_processed_mail_packet:frog-1",
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].sourceRefs).toContain("visual_source:screen");
    expect(updates[0].loopRefs).toContain(`stage_play_mail_loop:${threadId}`);
    expect(updates[0].suggestedDispatch.map((action) => action.kind)).toEqual([
      "log_receipt",
      "append_goal_context",
      "update_panel",
    ]);

    const sessions = listStagePlayAgentGoalSessions({ threadId });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      goalId: "goal:frog-classification",
      objective: "Monitor the image source and prepare frog classification evidence.",
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
      },
    });

    expect(listStagePlayGoalContextUpdates({ sourceRef: "visual_source:screen" })).toHaveLength(1);
    expect(listStagePlayGoalContextUpdates({ goalId: "goal:frog-classification" })).toHaveLength(1);
  });

  it("keeps wake as a dispatch action instead of answer authority", () => {
    const wakeRequest: StagePlayLiveSourceMailWakeRequestV1 = {
      artifactId: "stage_play_live_source_mail_wake_request",
      schemaVersion: "stage_play_live_source_mail_wake_request/v1",
      wakeRequestId: "stage_play_live_source_mail_wake_request:frog",
      threadId,
      roomId: "room:stage-play",
      environmentId: "env:desktop",
      jobId: "stage_play_live_source_job:frog",
      mailIds: ["stage_play_live_source_mail:visual-1"],
      sourceIds: ["visual_source:screen"],
      reason: "user_requested_watch",
      wakeIntent: "ask_from_processed_packet",
      status: "queued",
      decisionIds: [],
      attemptCount: 0,
      lifecycleStage: "queued",
      packetIds: ["stage_play_processed_mail_packet:frog-1"],
      evidenceRefs: ["stage_play_processed_mail_packet:frog-1"],
      queuedAt: now,
      updatedAt: now,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    };
    const [update] = syncStagePlayGoalContextFromMailbox({
      threadId,
      roomId: "room:stage-play",
      mailItems: [mailFixture()],
      processedMailPackets: [
        packetFixture({
          resolutionState: "ask_decision_needed",
          arbiter: {
            recommendedNext: "request_stage_play_checkpoint",
            wakeAsk: true,
            reason: "User asked the agent to monitor this image classification goal.",
            confidence: "high",
            voiceCandidate: true,
            calloutDraft: "Frog classification monitor is ready.",
            missingEvidence: [],
          },
          salience: {
            level: "high",
            reasons: ["user requested monitoring"],
            voiceCandidate: true,
            calloutDraft: "Frog classification monitor is ready.",
          },
        }),
      ],
      microReasonerRuns: [runFixture()],
      wakeRequests: [wakeRequest],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(update.updateKind).toBe("suggested_action");
    expect(update.suggestedDispatch.map((action) => action.kind)).toContain("wake_agent");
    expect(update.suggestedDispatch.map((action) => action.kind)).toContain("speak_narrator");
    expect(update.authority.assistantAnswer).toBe(false);
    expect(update.authority.terminalEligible).toBe(false);
    expect(update.authority.postToolModelStepRequired).toBe(true);
  });
});
