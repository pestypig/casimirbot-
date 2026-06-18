import { describe, expect, it } from "vitest";
import {
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
  type AgentGoalSessionV1,
  type WorkstationGoalContextUpdateV1,
  validateAgentGoalSessionV1,
  validateWorkstationGoalContextUpdateV1,
} from "../workstation-goal-context.v1";

describe("workstation goal context contract", () => {
  const update: WorkstationGoalContextUpdateV1 = {
    schemaVersion: WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
    updateId: "goal_context_update:visual:1",
    createdAtMs: 1_700_000_000_000,
    sourceRefs: ["source:visual-tab"],
    loopRefs: ["stage_play_mail_loop:desktop"],
    producerKind: "microdeck",
    updateKind: "visual_observation",
    contentRef: "stage_play_processed_mail_packet:1",
    preview: "Visual source packet classified a fresh danger cue.",
    evidenceRefs: ["visual_frame:1", "stage_play_micro_reasoner_run:1"],
    receiptRefs: ["stage_play_live_source_mail:1"],
    freshness: {
      observedAtMs: 1_700_000_000_000,
      staleAfterMs: 30_000,
      status: "fresh",
    },
    goalRelevance: {
      goalId: "goal:monitor-screen",
      relevance: 0.82,
      reason: "Matches the active screen-monitoring goal.",
    },
    suggestedDispatch: [
      { kind: "log_receipt", receiptRef: "stage_play_live_source_mail:1" },
      { kind: "append_goal_context", goalId: "goal:monitor-screen" },
      { kind: "speak_narrator", mode: "confirm" },
      { kind: "wake_agent", reason: "urgent operator interruption" },
    ],
    authority: {
      assistantAnswer: false,
      terminalEligible: false,
      rawContentIncluded: false,
      postToolModelStepRequired: true,
    },
  };

  const goal: AgentGoalSessionV1 = {
    schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
    goalId: "goal:monitor-screen",
    threadId: "helix-ask:desktop",
    roomId: "room:desktop",
    objective: "Monitor the active visual source for export-control mentions.",
    userVisibleSummary: "Monitoring visual summaries and route evidence.",
    status: "active",
    sourceRefs: ["source:visual-tab"],
    loopRefs: ["stage_play_mail_loop:desktop"],
    constructRefs: ["live_answer_environment:desktop"],
    contextFeeds: [
      {
        feedId: "feed:visual-summaries",
        sourceKind: "visual_summaries",
        query: "export controls",
        freshnessMs: 30_000,
        relevancePolicy: "append matching summaries",
      },
    ],
    allowedActuators: [
      "query_visual_summaries",
      "query_audio_transcripts",
      "query_translation_segments",
      "query_microdeck_outputs",
      "query_live_answer_state",
      "query_source_health",
      "set_visual_preset",
      "bind_source",
      "unbind_source",
      "bind_narrator",
      "narrator_bind_stream",
      "narrator_say",
      "query_trace_memory",
      "resume_loop",
      "set_loop_state",
      "focus_process_graph",
    ],
    cadence: { kind: "event_accumulation", minUpdates: 2 },
    stopConditions: ["user stops the goal", "visual source disconnects"],
    checkpoints: [
      {
        checkpointId: "goal_checkpoint:1",
        createdAtMs: 1_700_000_001_000,
        summary: "No export-control mention detected yet.",
        evidenceRefs: ["stage_play_processed_mail_packet:1"],
        actionsTaken: ["queried visual summaries"],
        nextStep: "continue",
      },
    ],
    authority: {
      assistantAnswer: false,
      finalReportsRequireTerminalAuthority: true,
    },
  };

  it("accepts goal-context updates as non-terminal workstation evidence", () => {
    expect(validateWorkstationGoalContextUpdateV1(update)).toEqual([]);
  });

  it("rejects goal-context updates that try to become terminal answers", () => {
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      authority: {
        ...update.authority,
        assistantAnswer: true as false,
        terminalEligible: true as false,
      },
    })).toEqual(expect.arrayContaining([
      "goal context updates must not be assistant answers",
      "goal context updates must not be terminal eligible",
    ]));
  });

  it("rejects goal-context updates that are not source-linked, evidence-backed, or freshness-valid", () => {
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      sourceRefs: [],
      evidenceRefs: [],
      freshness: {
        observedAtMs: 0,
        staleAfterMs: 0,
        status: "expired" as WorkstationGoalContextUpdateV1["freshness"]["status"],
      },
    })).toEqual(expect.arrayContaining([
      "sourceRefs must include at least one reference",
      "evidenceRefs must include at least one reference",
      "freshness.observedAtMs must be a positive timestamp",
      "freshness.staleAfterMs must be a positive number",
      "freshness.status is invalid",
    ]));
  });

  it("accepts durable goal sessions with explicit context feeds and actuators", () => {
    expect(validateAgentGoalSessionV1(goal)).toEqual([]);
  });

  it("rejects goal sessions with unknown context feeds, actuator names, or invalid feed freshness", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      contextFeeds: [
        ...goal.contextFeeds,
        {
          feedId: "feed:unknown",
          sourceKind: "wake_candidates" as AgentGoalSessionV1["contextFeeds"][number]["sourceKind"],
          freshnessMs: 0,
        },
      ],
      allowedActuators: [
        ...goal.allowedActuators,
        "wake_agent" as AgentGoalSessionV1["allowedActuators"][number],
      ],
    })).toEqual(expect.arrayContaining([
      "contextFeeds[1].sourceKind is invalid",
      "contextFeeds[1].freshnessMs must be a positive number",
      "allowedActuators[16] is invalid",
    ]));
  });

  it("rejects goal sessions that do not require terminal authority for reports", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: false as true,
      },
    })).toEqual(expect.arrayContaining([
      "goal sessions require terminal authority for final reports",
    ]));
  });
});
