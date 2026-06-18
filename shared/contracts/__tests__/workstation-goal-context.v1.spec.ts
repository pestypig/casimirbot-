import { describe, expect, it } from "vitest";
import {
  WORKSTATION_AGENT_GOAL_ACTUATORS,
  WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS,
  WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS,
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA,
  WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA,
  WORKSTATION_GOAL_CONTEXT_PRODUCER_KINDS,
  WORKSTATION_GOAL_CONTEXT_UPDATE_SCHEMA,
  WORKSTATION_GOAL_CONTEXT_UPDATE_KINDS,
  normalizeAgentGoalActuatorV1,
  type AgentGoalSessionV1,
  type GoalContextProducerKindV1,
  type GoalContextUpdateKindV1,
  type NarratorBindStreamRequestV1,
  type NarratorSayRequestV1,
  type WorkstationGoalContextUpdateV1,
  validateAgentGoalSessionV1,
  validateNarratorBindStreamRequestV1,
  validateNarratorSayRequestV1,
  validateWorkstationGoalContextUpdateV1,
} from "../workstation-goal-context.v1";

describe("workstation goal context contract", () => {
  const canonicalUpdateKindByProducer: Record<GoalContextProducerKindV1, GoalContextUpdateKindV1> = {
    visual_capture: "visual_observation",
    audio_capture: "transcript_window",
    transcription_loop: "transcript_window",
    translation_loop: "translated_transcript",
    microdeck: "classification",
    reflection: "reflection",
    live_answer: "summary",
    source_health: "source_status",
    trace_memory: "route_evidence",
    route_watch: "route_evidence",
    narrator: "suggested_action",
    automation: "automation_status",
  };

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
      "query_narrator_events",
      "configure_route_watch",
      "set_visual_preset",
      "bind_source",
      "unbind_source",
      "bind_narrator",
      "narrator_bind_stream",
      "narrator_say",
      "query_trace_memory",
      "query_packet_traces",
      "query_route_evidence",
      "query_automation_policies",
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
      finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
    },
  };

  const narratorSayRequest: NarratorSayRequestV1 = {
    schemaVersion: WORKSTATION_NARRATOR_SAY_REQUEST_SCHEMA,
    requestId: "helix:narrator:say:1",
    text: "Translation stream is ready.",
    sourceKind: "live_answer",
    sourceId: "live-answer:translation",
    evidenceRefs: ["translation_segment:latest", "allowed_actuator:narrator_say"],
    deliveryMode: "confirm_to_speak",
    priority: "normal",
    language: "en",
    dedupeKey: "goal:translation:narrator:say",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  const narratorBindStreamRequest: NarratorBindStreamRequestV1 = {
    schemaVersion: WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA,
    requestId: "helix:narrator:bind:1",
    sourceRef: "source:browser-audio",
    streamKind: "translated_transcript",
    presetId: "preset:translation-visible",
    deliveryMode: "visible_only",
    voicePolicy: "confirm_speak_required",
    evidenceThreshold: "observed",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  it("accepts goal-context updates as non-terminal workstation evidence", () => {
    expect(validateWorkstationGoalContextUpdateV1(update)).toEqual([]);
  });

  it("accepts every deterministic producer as source-linked non-terminal goal context", () => {
    for (const producerKind of WORKSTATION_GOAL_CONTEXT_PRODUCER_KINDS) {
      expect(validateWorkstationGoalContextUpdateV1({
        ...update,
        updateId: `goal_context_update:${producerKind}:1`,
        producerKind,
        updateKind: canonicalUpdateKindByProducer[producerKind],
        contentRef: `${producerKind}:content:1`,
        sourceRefs: [`${producerKind}:source:1`],
        loopRefs: [`${producerKind}:loop:1`],
        evidenceRefs: [`${producerKind}:evidence:1`],
        receiptRefs: [`${producerKind}:receipt:1`],
        preview: `${producerKind} produced an observation for the active goal.`,
      })).toEqual([]);
    }
  });

  it("keeps the full update-kind vocabulary valid for observation records", () => {
    for (const updateKind of WORKSTATION_GOAL_CONTEXT_UPDATE_KINDS) {
      expect(validateWorkstationGoalContextUpdateV1({
        ...update,
        updateId: `goal_context_update:${updateKind}:1`,
        updateKind,
        contentRef: `${updateKind}:content:1`,
        evidenceRefs: [`${updateKind}:evidence:1`],
        preview: `${updateKind} observation for the workstation reasoning circuit.`,
      })).toEqual([]);
    }
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

  it("accepts the complete query and actuator vocabulary for durable goal sessions", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      contextFeeds: WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS.map((sourceKind) => ({
        feedId: `feed:${sourceKind}`,
        sourceKind,
        freshnessMs: 30_000,
      })),
      allowedActuators: [...WORKSTATION_AGENT_GOAL_ACTUATORS],
    })).toEqual([]);
  });

  it("normalizes live-env tool names into AgentGoalSession actuator ids", () => {
    expect(normalizeAgentGoalActuatorV1("live_env.query_visual_summaries")).toBe("query_visual_summaries");
    expect(normalizeAgentGoalActuatorV1("live_env.set_workstation_loop_state")).toBe("set_loop_state");
    expect(normalizeAgentGoalActuatorV1("live_env.repair_workstation_source")).toBe("repair_source");
    expect(normalizeAgentGoalActuatorV1("live_env.update_live_answer_projection")).toBe("update_live_answer");
    expect(normalizeAgentGoalActuatorV1("live_env.narrator_bind_stream")).toBe("narrator_bind_stream");
    expect(normalizeAgentGoalActuatorV1("live_env.query_automation_policies")).toBe("query_automation_policies");
    expect(normalizeAgentGoalActuatorV1("live_env.query_narrator_events")).toBe("query_narrator_events");
    expect(normalizeAgentGoalActuatorV1("pause workstation loop")).toBe("pause_loop");
    expect(normalizeAgentGoalActuatorV1("wake_agent")).toBeNull();
  });

  it("keeps default goal-context feeds complete, fresh, and session-valid", () => {
    expect(WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS.map((feed) => feed.sourceKind).sort()).toEqual(
      [...WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS].sort(),
    );
    expect(WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS.every((feed) =>
      feed.freshnessMs > 0 && feed.relevancePolicy.trim().length > 0
    )).toBe(true);
    expect(validateAgentGoalSessionV1({
      ...goal,
      contextFeeds: WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS.map((feed) => ({
        feedId: `feed:${feed.sourceKind}`,
        sourceKind: feed.sourceKind,
        freshnessMs: feed.freshnessMs,
        relevancePolicy: feed.relevancePolicy,
      })),
      allowedActuators: [...WORKSTATION_AGENT_GOAL_ACTUATORS],
    })).toEqual([]);
  });

  it("rejects goal sessions with unknown context feeds, actuator names, or invalid feed freshness", () => {
    const issues = validateAgentGoalSessionV1({
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
    });
    expect(issues).toEqual(expect.arrayContaining([
      "contextFeeds[1].sourceKind is invalid",
      "contextFeeds[1].freshnessMs must be a positive number",
    ]));
    expect(issues.some((issue) => /^allowedActuators\[\d+\] is invalid$/.test(issue))).toBe(true);
  });

  it("rejects goal sessions that do not require terminal authority for reports", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: false as true,
        finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
      },
    })).toEqual(expect.arrayContaining([
      "goal sessions require terminal authority for final reports",
    ]));
  });

  it("rejects goal sessions that weaken final-report authority requirements", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      authority: {
        assistantAnswer: false,
        finalReportsRequireTerminalAuthority: true,
        finalReportRequirements: {
          ...WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
          completedSolverPathRequired: false as true,
          evidenceReentryRequired: false as true,
          routeAuthorityRequired: false as true,
          terminalAuthoritySingleWriterRequired: false as true,
          requiredEvidenceKinds: [],
        },
      },
    })).toEqual(expect.arrayContaining([
      "final report requirements must require completed solver path",
      "final report requirements must require evidence re-entry",
      "final report requirements must require route authority",
      "final report requirements must require terminal authority single writer",
      "authority.finalReportRequirements.requiredEvidenceKinds must include at least one reference",
    ]));
  });

  it("accepts narrator control request artifacts as non-terminal workstation observations", () => {
    expect(validateNarratorSayRequestV1(narratorSayRequest)).toEqual([]);
    expect(validateNarratorBindStreamRequestV1(narratorBindStreamRequest)).toEqual([]);
  });

  it("rejects narrator say requests that try to become answer authority or raw terminal text", () => {
    expect(validateNarratorSayRequestV1({
      ...narratorSayRequest,
      evidenceRefs: [],
      deliveryMode: "hidden" as NarratorSayRequestV1["deliveryMode"],
      assistant_answer: true as false,
      terminal_eligible: true as false,
      raw_content_included: true as false,
    })).toEqual(expect.arrayContaining([
      "evidenceRefs must include at least one reference",
      "deliveryMode must be visible_only, confirm_to_speak, or auto_speak",
      "narrator say requests must not be assistant answers",
      "narrator say requests must not be terminal eligible",
      "narrator say requests must not include raw content",
    ]));
  });

  it("rejects narrator stream bindings that try to become answer authority or hidden terminal routes", () => {
    expect(validateNarratorBindStreamRequestV1({
      ...narratorBindStreamRequest,
      streamKind: "final_answer_stream" as NarratorBindStreamRequestV1["streamKind"],
      deliveryMode: "hidden" as NarratorBindStreamRequestV1["deliveryMode"],
      voicePolicy: "always_terminal" as NarratorBindStreamRequestV1["voicePolicy"],
      assistant_answer: true as false,
      terminal_eligible: true as false,
      raw_content_included: true as false,
    })).toEqual(expect.arrayContaining([
      "streamKind is invalid",
      "deliveryMode must be visible_only, confirm_to_speak, or auto_speak",
      "voicePolicy is invalid",
      "narrator bind stream requests must not be assistant answers",
      "narrator bind stream requests must not be terminal eligible",
      "narrator bind stream requests must not include raw content",
    ]));
  });
});
