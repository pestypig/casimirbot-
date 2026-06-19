import { beforeEach, describe, expect, it } from "vitest";
import type {
  StagePlayLiveSourceMailItemV1,
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
import { WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS } from "@shared/contracts/workstation-goal-context.v1";
import {
  ensureStagePlayAgentGoalSession,
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
    const claimRun = runFixture({
      evidenceRefs: [
        "stage_play_micro_reasoner_run:frog-claims",
        "stage_play_live_source_mail:visual-1",
        "microdeck_output:frog-claims",
        "microdeck_evidence:frog-claims",
      ],
      goalContextUpdateRefs: ["stage_play_goal_context_update:microdeck:upstream-claims"],
    });
    const riskRun = runFixture({
      runId: "stage_play_micro_reasoner_run:frog-risk",
      role: "risk_screener",
      outputRefs: ["microdeck_output:frog-risk"],
      evidenceRefs: [
        "stage_play_micro_reasoner_run:frog-risk",
        "stage_play_live_source_mail:visual-1",
        "microdeck_output:frog-risk",
        "microdeck_evidence:frog-risk",
      ],
      goalContextUpdateRefs: ["stage_play_goal_context_update:microdeck:upstream-risk"],
    });
    const packet = packetFixture({
      microReasonerRunRefs: [
        "stage_play_micro_reasoner_run:frog-claims",
        "stage_play_micro_reasoner_run:frog-risk",
      ],
    });
    const updates = syncStagePlayGoalContextFromMailbox({
      threadId,
      roomId: "room:stage-play",
      mailItems: [mailFixture()],
      processedMailPackets: [packet],
      microReasonerRuns: [claimRun, riskRun],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(updates).toHaveLength(2);
    expect(updates[0]).toMatchObject({
      schemaVersion: "helix.workstation_goal_context_update.v1",
      producerKind: "microdeck",
      updateKind: "visual_observation",
      contentRef: "stage_play_processed_mail_packet:frog-1",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });
    expect(updates[0].sourceRefs).toContain("visual_source:screen");
    expect(updates[0].loopRefs).toContain(`stage_play_mail_loop:${threadId}`);
    expect(updates[0].loopRefs).toEqual(expect.arrayContaining([
      "stage_play_micro_reasoner_run:frog-claims",
      "stage_play_micro_reasoner_run:frog-risk",
    ]));
    expect(updates[0].evidenceRefs).toEqual(expect.arrayContaining([
      "stage_play_micro_reasoner_run:frog-claims",
      "stage_play_micro_reasoner_run:frog-risk",
      "microdeck_evidence:frog-claims",
      "microdeck_evidence:frog-risk",
      "microdeck_output:frog-claims",
      "microdeck_output:frog-risk",
      "stage_play_goal_context_update:microdeck:upstream-claims",
      "stage_play_goal_context_update:microdeck:upstream-risk",
    ]));
    expect(updates[0].receiptRefs).toEqual(expect.arrayContaining([
      "stage_play_micro_reasoner_run:frog-claims",
      "stage_play_micro_reasoner_run:frog-risk",
    ]));
    expect(updates[0].suggestedDispatch.map((action) => action.kind)).toEqual([
      "log_receipt",
      "append_goal_context",
      "update_panel",
    ]);
    expect(updates[1]).toMatchObject({
      schemaVersion: "helix.workstation_goal_context_update.v1",
      producerKind: "visual_capture",
      updateKind: "visual_observation",
      contentRef: "stage_play_live_source_mail:visual-1",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      authority: {
        assistantAnswer: false,
        terminalEligible: false,
        rawContentIncluded: false,
        postToolModelStepRequired: true,
      },
    });

    const sessions = listStagePlayAgentGoalSessions({ threadId });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      goalId: "goal:frog-classification",
      objective: "Monitor the image source and prepare frog classification evidence.",
      contextFeeds: expect.arrayContaining([
        expect.objectContaining({ sourceKind: "visual_summaries" }),
        expect.objectContaining({ sourceKind: "audio_transcripts" }),
        expect.objectContaining({ sourceKind: "translated_transcripts" }),
        expect.objectContaining({ sourceKind: "microdeck_outputs" }),
        expect.objectContaining({ sourceKind: "live_answer_lines" }),
        expect.objectContaining({ sourceKind: "source_health" }),
        expect.objectContaining({ sourceKind: "trace_memory" }),
        expect.objectContaining({ sourceKind: "packet_traces" }),
        expect.objectContaining({ sourceKind: "route_evidence" }),
        expect.objectContaining({ sourceKind: "automation_policies" }),
      ]),
      allowedActuators: expect.arrayContaining([
        "query_visual_summaries",
        "query_audio_transcripts",
        "query_translation_segments",
        "query_microdeck_outputs",
        "query_live_answer_state",
        "query_source_health",
        "configure_route_watch",
        "set_audio_preset",
        "set_visual_preset",
        "change_preset",
        "bind_source",
        "unbind_source",
        "bind_narrator",
        "narrator_bind_stream",
        "narrator_say",
        "update_live_answer",
        "query_trace_memory",
        "query_packet_traces",
        "pause_loop",
        "resume_loop",
        "set_loop_state",
        "focus_process_graph",
        "repair_source",
        "ask_user",
      ]),
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
      },
    });

    expect(listStagePlayGoalContextUpdates({ sourceRef: "visual_source:screen" })).toHaveLength(2);
    expect(listStagePlayGoalContextUpdates({ goalId: "goal:frog-classification" })).toHaveLength(2);
  });

  it("records audio capture arrivals separately from transcript packet processing", () => {
    const audioMail = mailFixture({
      mailId: "stage_play_live_source_mail:audio-1",
      sourceId: "audio_source:share",
      sourceKind: "audio_transcript",
      sourceRefs: {
        sourceId: "audio_source:share",
        evidenceRef: "audio_chunk:share-1",
        observationRef: "audio_event:share-1",
      },
      summary: {
        text: "Audio transcript chunk: la rana esta en la hoja.",
        preview: "la rana esta en la hoja",
        confidence: 0.88,
        analysisState: "analysis_ready",
      },
      evidenceRefs: ["audio_chunk:share-1", "audio_event:share-1"],
      objective: {
        objectiveId: "goal:earbud-translation",
        text: "Monitor shared audio and prepare translation evidence.",
      },
    });
    const transcriptPacket = packetFixture({
      packetId: "stage_play_processed_mail_packet:audio-1",
      sourceId: "audio_source:share",
      mailIds: ["stage_play_live_source_mail:audio-1"],
      visualEvidenceRefs: [],
      observedFacts: ["Transcript window contains a frog mention."],
      inferredFacts: ["The audio can be routed through an earbud translation deck."],
      objectTags: [],
      activityTags: ["translation"],
      microReasonerRunRefs: [],
      evidenceRefs: ["stage_play_processed_mail_packet:audio-1", "audio_chunk:share-1"],
    });

    const updates = syncStagePlayGoalContextFromMailbox({
      threadId,
      roomId: "room:stage-play",
      mailItems: [audioMail],
      processedMailPackets: [transcriptPacket],
      microReasonerRuns: [],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(updates).toHaveLength(2);
    expect(listStagePlayGoalContextUpdates({ producerKind: "audio_capture" })).toEqual([
      expect.objectContaining({
        updateKind: "transcript_window",
        contentRef: "stage_play_live_source_mail:audio-1",
        sourceRefs: expect.arrayContaining(["audio_source:share", "audio_chunk:share-1", "audio_event:share-1"]),
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]);
    expect(listStagePlayGoalContextUpdates({ producerKind: "transcription_loop" })).toEqual([
      expect.objectContaining({
        updateKind: "transcript_window",
        contentRef: "stage_play_processed_mail_packet:audio-1",
        sourceRefs: expect.arrayContaining(["audio_source:share", "stage_play_live_source_mail:audio-1"]),
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]);
  });

  it("classifies translation deck packets as translation-loop goal context", () => {
    const audioMail = mailFixture({
      mailId: "stage_play_live_source_mail:audio-translation-1",
      sourceId: "audio_source:earbuds",
      sourceKind: "audio_transcript",
      sourceRefs: {
        sourceId: "audio_source:earbuds",
        evidenceRef: "audio_chunk:earbuds-1",
        observationRef: "audio_event:earbuds-1",
      },
      summary: {
        text: "Audio transcript chunk: la rana esta en la hoja.",
        preview: "la rana esta en la hoja",
        confidence: 0.91,
        analysisState: "analysis_ready",
      },
      evidenceRefs: ["audio_chunk:earbuds-1", "audio_event:earbuds-1"],
      objective: {
        objectiveId: "goal:earbud-translation",
        text: "Translate shared audio through an earbud deck.",
      },
    });
    const translationRun = runFixture({
      runId: "stage_play_micro_reasoner_run:earbud-translation",
      deckPresetId: "stage_play_micro_reasoner_prompt_preset:earbud-translate-english:v1",
      deckPresetTitle: "Earbud Translate To English",
      role: "packet_composer",
      sourceId: "audio_source:earbuds",
      mailIds: ["stage_play_live_source_mail:audio-translation-1"],
      inputRefs: ["stage_play_live_source_mail:audio-translation-1"],
      outputRefs: ["microdeck_output:earbud-translation"],
      inputPreview: "la rana esta en la hoja",
      outputPreview: "The frog is on the leaf.",
    });
    const translationPacket = packetFixture({
      packetId: "stage_play_processed_mail_packet:earbud-translation",
      sourceId: "audio_source:earbuds",
      mailIds: ["stage_play_live_source_mail:audio-translation-1"],
      visualEvidenceRefs: [],
      observedFacts: ["Spanish transcript mentions a frog on a leaf."],
      inferredFacts: ["English translation candidate: The frog is on the leaf."],
      objectTags: [],
      activityTags: ["translation"],
      microReasonerRunRefs: ["stage_play_micro_reasoner_run:earbud-translation"],
      evidenceRefs: ["stage_play_processed_mail_packet:earbud-translation", "microdeck_output:earbud-translation"],
      microReasonerDeck: {
        presetId: "stage_play_micro_reasoner_prompt_preset:earbud-translate-english:v1",
        presetTitle: "Earbud Translate To English",
        domain: "audio_translation",
        outputPolicy: "earbud_translation",
        promptedRoles: ["packet_composer"],
        rolePromptIds: {
          packet_composer: "stage_play_micro_reasoner_prompt:earbud-translate-english:packet_composer:v1",
        },
        sourceId: "audio_source:earbuds",
        appliedAt: "2026-06-17T14:00:01.000Z",
        deckRunPlan: "baseline_plus_prompted",
      },
    });

    syncStagePlayGoalContextFromMailbox({
      threadId,
      roomId: "room:stage-play",
      mailItems: [audioMail],
      processedMailPackets: [translationPacket],
      microReasonerRuns: [translationRun],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(listStagePlayGoalContextUpdates({ producerKind: "translation_loop" })).toEqual([
      expect.objectContaining({
        updateKind: "translated_transcript",
        contentRef: "stage_play_processed_mail_packet:earbud-translation",
        sourceRefs: expect.arrayContaining([
          "audio_source:earbuds",
          "stage_play_live_source_mail:audio-translation-1",
          "microdeck_output:earbud-translation",
        ]),
        evidenceRefs: expect.arrayContaining([
          "stage_play_processed_mail_packet:earbud-translation",
          "microdeck_output:earbud-translation",
        ]),
        receiptRefs: expect.arrayContaining([
          "stage_play_live_source_mail:audio-translation-1",
          "stage_play_micro_reasoner_run:earbud-translation",
        ]),
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]);
    expect(listStagePlayGoalContextUpdates({ producerKind: "microdeck" })).toEqual([
      expect.objectContaining({
        updateKind: "translated_transcript",
        contentRef: "stage_play_processed_mail_packet:earbud-translation",
        preview: expect.stringContaining("MicroDeck output available for packet trace"),
        sourceRefs: expect.arrayContaining([
          "audio_source:earbuds",
          "stage_play_live_source_mail:audio-translation-1",
          "microdeck_output:earbud-translation",
        ]),
        loopRefs: expect.arrayContaining([
          "stage_play_micro_reasoner_prompt_preset:earbud-translate-english:v1",
          "stage_play_micro_reasoner_run:earbud-translation",
          "microdeck_output_loop",
        ]),
        evidenceRefs: expect.arrayContaining([
          "stage_play_processed_mail_packet:earbud-translation",
          "microdeck_output:earbud-translation",
        ]),
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]);
    expect(listStagePlayGoalContextUpdates({ producerKind: "transcription_loop" })).toEqual([
      expect.objectContaining({
        updateKind: "transcript_window",
        contentRef: "stage_play_processed_mail_packet:earbud-translation",
        sourceRefs: expect.arrayContaining([
          "audio_source:earbuds",
          "stage_play_live_source_mail:audio-translation-1",
          "microdeck_output:earbud-translation",
        ]),
        evidenceRefs: expect.arrayContaining([
          "stage_play_processed_mail_packet:earbud-translation",
          "microdeck_output:earbud-translation",
        ]),
        authority: {
          assistantAnswer: false,
          terminalEligible: false,
          rawContentIncluded: false,
          postToolModelStepRequired: true,
        },
      }),
    ]);
  });

  it("keeps ordinary wake receipts from becoming agent interrupts", () => {
    const wakeRequest: StagePlayLiveSourceMailWakeRequestV1 = {
      artifactId: "stage_play_live_source_mail_wake_request",
      schemaVersion: "stage_play_live_source_mail_wake_request/v1",
      wakeRequestId: "stage_play_live_source_mail_wake_request:ordinary",
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
      processedMailPackets: [packetFixture()],
      microReasonerRuns: [runFixture()],
      wakeRequests: [wakeRequest],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(update.contentRef).toBe("stage_play_processed_mail_packet:frog-1");
    expect(update.receiptRefs).toContain("stage_play_live_source_mail_wake_request:ordinary");
    expect(update.suggestedDispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "log_receipt", receiptRef: "stage_play_processed_mail_packet:frog-1" }),
      expect.objectContaining({ kind: "append_goal_context" }),
      expect.objectContaining({ kind: "update_panel", panelId: "stage-play-badge-graph" }),
    ]));
    expect(update.suggestedDispatch.map((action) => action.kind)).not.toContain("wake_agent");
    expect(update.authority).toEqual({
      assistantAnswer: false,
      terminalEligible: false,
      rawContentIncluded: false,
      postToolModelStepRequired: true,
    });
  });

  it("uses pressure-deferred wake results as narrow interrupt dispatches", () => {
    const wakeResult: StagePlayLiveSourceMailWakeResultV1 = {
      artifactId: "stage_play_live_source_mail_wake_result",
      schemaVersion: "stage_play_live_source_mail_wake_result/v1",
      wakeResultId: "stage_play_live_source_mail_wake_result:pressure-deferred",
      wakeRequestId: "stage_play_live_source_mail_wake_request:pressure-deferred",
      threadId,
      roomId: "room:stage-play",
      environmentId: "env:desktop",
      status: "deferred_for_pressure",
      askTurnId: null,
      decisionIds: [],
      voiceCheckpointRefs: [],
      wakeIntent: "ask_from_processed_packet",
      lifecycleStage: "pressure_deferred",
      lifecycleReason: "runtime_memory_queue_deferrable",
      packetIds: ["stage_play_processed_mail_packet:frog-1"],
      evidenceRefs: ["stage_play_processed_mail_packet:frog-1"],
      createdAt: now,
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
          arbiter: undefined,
          salience: {
            level: "medium",
            reasons: ["visual classification requested"],
            voiceCandidate: false,
          },
          uncertainties: [],
          resolutionState: "processed_packet_ready",
        }),
      ],
      microReasonerRuns: [runFixture()],
      wakeResults: [wakeResult],
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(update.contentRef).toBe("stage_play_processed_mail_packet:frog-1");
    expect(update.receiptRefs).toContain("stage_play_live_source_mail_wake_result:pressure-deferred");
    expect(update.suggestedDispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "wake_agent",
        interruptKind: "blocked",
        reason: "wake result reports blocked or pressure-deferred follow-up",
      }),
      expect.objectContaining({ kind: "log_receipt", receiptRef: "stage_play_processed_mail_packet:frog-1" }),
      expect.objectContaining({ kind: "append_goal_context" }),
    ]));
    expect(update.authority).toEqual({
      assistantAnswer: false,
      terminalEligible: false,
      rawContentIncluded: false,
      postToolModelStepRequired: true,
    });
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
    expect(update.suggestedDispatch).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "wake_agent",
        interruptKind: "urgent",
        reason: "User asked the agent to monitor this image classification goal.",
      }),
    ]));
    expect(update.suggestedDispatch.map((action) => action.kind)).toContain("speak_narrator");
    expect(update.authority.assistantAnswer).toBe(false);
    expect(update.authority.terminalEligible).toBe(false);
    expect(update.authority.postToolModelStepRequired).toBe(true);
  });

  it("merges explicit agent goal session feeds, actuators, cadence, and checkpoints", () => {
    const session = ensureStagePlayAgentGoalSession({
      threadId,
      roomId: "room:stage-play",
      objectiveId: "goal:frog-classification",
      objectiveText: "Monitor visual capture, translated audio, and trace memory for frog evidence.",
      sourceRefs: ["visual_source:screen", "audio_source:share"],
      loopRefs: [`thread:${threadId}`, `stage_play_mail_loop:${threadId}`],
      constructRefs: ["live_answer_environment:frog"],
      contextFeeds: [
        {
          feedId: "feed:frog-visual",
          sourceKind: "visual_summaries",
          query: "frog morphology",
          freshnessMs: 15_000,
          relevancePolicy: "frog-evidence",
        },
        {
          feedId: "feed:frog-trace",
          sourceKind: "trace_memory",
          freshnessMs: 120_000,
        },
      ],
      allowedActuators: [
        "query_visual_summaries",
        "query_translation_segments",
        "set_visual_preset",
        "bind_source",
        "bind_narrator",
        "narrator_bind_stream",
        "query_trace_memory",
        "set_loop_state",
        "focus_process_graph",
      ],
      cadence: { kind: "event_accumulation", minUpdates: 3 },
      stopConditions: ["frog species reported through terminal authority"],
      finalReportRequirements: {
        ...WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
        requiredEvidenceKinds: [
          "goal_context_update",
          "packet_trace",
          "terminal_authority_single_writer",
        ],
        prohibitedReportSources: [
          "tool_receipt",
          "panel_projection",
          "microdeck_output",
        ],
      },
      checkpoint: {
        summary: "Started frog monitor with explicit visual and trace feeds.",
        evidenceRefs: ["visual_frame:frog-1"],
        actionsTaken: ["start_agent_goal_session"],
        nextStep: "continue",
      },
      nowMs: Date.parse("2026-06-17T14:00:03.000Z"),
    });

    expect(session).toMatchObject({
      goalId: "goal:frog-classification",
      constructRefs: ["live_answer_environment:frog"],
      contextFeeds: expect.arrayContaining([
        expect.objectContaining({
          feedId: "feed:frog-visual",
          sourceKind: "visual_summaries",
          query: "frog morphology",
          freshnessMs: 15000,
          relevancePolicy: "frog-evidence",
        }),
        expect.objectContaining({
          feedId: "feed:frog-trace",
          sourceKind: "trace_memory",
          freshnessMs: 120000,
        }),
      ]),
      allowedActuators: expect.arrayContaining([
        "query_visual_summaries",
        "query_translation_segments",
        "set_visual_preset",
        "bind_source",
        "bind_narrator",
        "narrator_bind_stream",
        "query_trace_memory",
        "set_loop_state",
        "focus_process_graph",
      ]),
      cadence: { kind: "event_accumulation", minUpdates: 3 },
      stopConditions: expect.arrayContaining(["frog species reported through terminal authority"]),
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
        finalReportRequirements: expect.objectContaining({
          completedSolverPathRequired: true,
          evidenceReentryRequired: true,
          routeAuthorityRequired: true,
          terminalAuthoritySingleWriterRequired: true,
          requiredEvidenceKinds: expect.arrayContaining([
            "goal_context_update",
            "packet_trace",
            "terminal_authority_single_writer",
          ]),
          prohibitedReportSources: expect.arrayContaining([
            "tool_receipt",
            "panel_projection",
            "microdeck_output",
          ]),
        }),
      },
    });
    expect(session?.checkpoints.at(-1)).toMatchObject({
      summary: "Started frog monitor with explicit visual and trace feeds.",
      evidenceRefs: expect.arrayContaining(["visual_frame:frog-1", "visual_source:screen"]),
      actionsTaken: ["start_agent_goal_session"],
      nextStep: "continue",
    });
  });
});
