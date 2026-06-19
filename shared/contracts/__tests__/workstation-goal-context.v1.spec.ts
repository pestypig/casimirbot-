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
    evidenceRefs: ["stage_play_processed_mail_packet:1", "visual_frame:1", "stage_play_micro_reasoner_run:1"],
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
      { kind: "wake_agent", interruptKind: "urgent", reason: "urgent operator interruption" },
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
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
    sourceRefs: ["live-answer:translation", "live_answer"],
    loopRefs: ["narrator:say", "thread:helix-ask:desktop", "workstation_actuator:narrator_say"],
    evidenceRefs: [
      "helix:narrator:say:1",
      "translation_segment:latest",
      "allowed_actuator:narrator_say",
      "live-answer:translation",
      "live_answer",
      "narrator:say",
      "thread:helix-ask:desktop",
      "workstation_actuator:narrator_say",
    ],
    producedRefs: ["helix:narrator:say:1", "stage_play_goal_context_update:narrator:say"],
    goalContextUpdateId: "stage_play_goal_context_update:narrator:say",
    deliveryMode: "confirm_to_speak",
    priority: "normal",
    language: "en",
    dedupeKey: "goal:translation:narrator:say",
    terminalAuthority: {
      status: "not_terminal",
      finalAnswerEligible: false,
      completedSolverPathRequired: true,
      terminalAuthoritySingleWriterRequired: true,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  const narratorBindStreamRequest: NarratorBindStreamRequestV1 = {
    schemaVersion: WORKSTATION_NARRATOR_BIND_STREAM_REQUEST_SCHEMA,
    requestId: "helix:narrator:bind:1",
    sourceRef: "source:browser-audio",
    sourceRefs: ["source:browser-audio", "translated_transcript"],
    loopRefs: ["narrator:bind_stream", "thread:helix-ask:desktop", "workstation_actuator:narrator_bind_stream"],
    evidenceRefs: [
      "helix:narrator:bind:1",
      "source:browser-audio",
      "translated_transcript",
      "allowed_actuator:narrator_bind_stream",
      "narrator:bind_stream",
      "thread:helix-ask:desktop",
      "workstation_actuator:narrator_bind_stream",
    ],
    producedRefs: ["helix:narrator:bind:1", "stage_play_goal_context_update:narrator:bind"],
    goalContextUpdateId: "stage_play_goal_context_update:narrator:bind",
    streamKind: "translated_transcript",
    presetId: "preset:translation-visible",
    deliveryMode: "visible_only",
    voicePolicy: "confirm_speak_required",
    evidenceThreshold: "observed",
    terminalAuthority: {
      status: "not_terminal",
      finalAnswerEligible: false,
      completedSolverPathRequired: true,
      terminalAuthoritySingleWriterRequired: true,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  it("accepts goal-context updates as non-terminal workstation evidence", () => {
    expect(validateWorkstationGoalContextUpdateV1(update)).toEqual([]);
    expect(update).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
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
        evidenceRefs: [`${producerKind}:content:1`, `${producerKind}:evidence:1`],
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
        evidenceRefs: [`${updateKind}:content:1`, `${updateKind}:evidence:1`],
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
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      assistant_answer: true as false,
      terminal_eligible: true as false,
      raw_content_included: true as false,
    })).toEqual(expect.arrayContaining([
      "goal context updates must expose assistant_answer=false",
      "goal context updates must expose terminal_eligible=false",
      "goal context updates must expose raw_content_included=false",
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
      "evidenceRefs must include contentRef",
      "freshness.observedAtMs must be a positive timestamp",
      "freshness.staleAfterMs must be a positive number",
      "freshness.status is invalid",
    ]));
  });

  it("rejects goal-context updates whose evidence does not cite the content ref", () => {
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      evidenceRefs: ["visual_frame:1"],
    })).toEqual(expect.arrayContaining([
      "evidenceRefs must include contentRef",
    ]));
  });

  it("keeps wake demoted to a classified interrupt dispatch", () => {
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_live_source_mail:1" },
        { kind: "wake_agent", reason: "legacy unclassified wake" } as WorkstationGoalContextUpdateV1["suggestedDispatch"][number],
      ],
    })).toEqual(expect.arrayContaining([
      "wake_agent dispatch must include interruptKind urgent, blocked, or policy_triggered",
    ]));
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      suggestedDispatch: [
        { kind: "wake_agent", interruptKind: "blocked", reason: "source loop blocked and needs operator review" },
      ],
    })).toEqual([]);
  });

  it("rejects goal-context dispatch actions without auditable targets", () => {
    expect(validateWorkstationGoalContextUpdateV1({
      ...update,
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: "" },
        { kind: "append_goal_context", goalId: "" },
        { kind: "update_panel", panelId: "" },
        { kind: "update_live_answer", lineKey: "" },
        { kind: "speak_narrator", mode: "hidden" as WorkstationGoalContextUpdateV1["suggestedDispatch"][number]["kind"] },
        { kind: "bind_narrator_stream", sourceRef: "", streamKind: "final_answer_stream" as never, deliveryMode: "hidden" as never },
        { kind: "set_loop_state", loopRef: "", state: "stopped" as never },
        { kind: "repair_loop", loopRef: "" },
      ] as WorkstationGoalContextUpdateV1["suggestedDispatch"],
    })).toEqual(expect.arrayContaining([
      "suggestedDispatch[0].log_receipt must include receiptRef",
      "suggestedDispatch[1].append_goal_context must include goalId",
      "suggestedDispatch[2].update_panel must include panelId",
      "suggestedDispatch[3].update_live_answer must include lineKey",
      "suggestedDispatch[4].speak_narrator mode is invalid",
      "suggestedDispatch[5].bind_narrator_stream must include sourceRef",
      "suggestedDispatch[5].bind_narrator_stream streamKind is invalid",
      "suggestedDispatch[5].bind_narrator_stream deliveryMode is invalid",
      "suggestedDispatch[6].set_loop_state must include loopRef",
      "suggestedDispatch[6].set_loop_state state is invalid",
      "suggestedDispatch[7].repair_loop must include loopRef",
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
    expect(normalizeAgentGoalActuatorV1("live_env.pause_workstation_loop")).toBe("pause_loop");
    expect(normalizeAgentGoalActuatorV1("live_env.resume_workstation_loop")).toBe("resume_loop");
    expect(normalizeAgentGoalActuatorV1("live_env.set_workstation_loop_state")).toBe("set_loop_state");
    expect(normalizeAgentGoalActuatorV1("live_env.repair_workstation_source")).toBe("repair_source");
    expect(normalizeAgentGoalActuatorV1("live_env.update_live_answer_projection")).toBe("update_live_answer");
    expect(normalizeAgentGoalActuatorV1("live_env.narrator_bind_stream")).toBe("narrator_bind_stream");
    expect(normalizeAgentGoalActuatorV1("live_env.set_visual_preset")).toBe("set_visual_preset");
    expect(normalizeAgentGoalActuatorV1("live_env.set_audio_preset")).toBe("set_audio_preset");
    expect(normalizeAgentGoalActuatorV1("visual preset")).toBe("set_visual_preset");
    expect(normalizeAgentGoalActuatorV1("audio preset")).toBe("set_audio_preset");
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

  it("rejects goal sessions that are not wired to any feeds or actuators", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      contextFeeds: [],
      allowedActuators: [],
    })).toEqual(expect.arrayContaining([
      "contextFeeds must include at least one feed",
      "allowedActuators must include at least one actuator",
    ]));
  });

  it("rejects goal sessions with weak cadence, stop conditions, or checkpoint traces", () => {
    expect(validateAgentGoalSessionV1({
      ...goal,
      sourceRefs: ["visual_source:screen", ""],
      loopRefs: ["thread:helix-ask:desktop", ""],
      constructRefs: ["microdeck:frog", ""],
      contextFeeds: [
        {
          feedId: "feed:visual",
          sourceKind: "visual_summaries",
          query: "",
          relevancePolicy: "",
        },
      ],
      cadence: { kind: "interval", everyMs: 0 },
      stopConditions: [""],
      checkpoints: [
        {
          checkpointId: "",
          createdAtMs: 0,
          summary: "",
          evidenceRefs: [],
          actionsTaken: [],
          nextStep: "wake_agent" as AgentGoalSessionV1["checkpoints"][number]["nextStep"],
        },
      ],
    })).toEqual(expect.arrayContaining([
      "sourceRefs[1] must be a non-empty string",
      "loopRefs[1] must be a non-empty string",
      "constructRefs[1] must be a non-empty string",
      "contextFeeds[0].query must be a non-empty string",
      "contextFeeds[0].relevancePolicy must be a non-empty string",
      "cadence.everyMs must be a positive number",
      "stopConditions[0] must be a non-empty string",
      "checkpoints[0].checkpointId is required",
      "checkpoints[0].createdAtMs must be a positive timestamp",
      "checkpoints[0].summary is required",
      "checkpoints[0].evidenceRefs must include at least one reference",
      "checkpoints[0].actionsTaken must include at least one reference",
      "checkpoints[0].nextStep is invalid",
    ]));

    expect(validateAgentGoalSessionV1({
      ...goal,
      cadence: { kind: "event_accumulation", minUpdates: 0 },
    })).toEqual(expect.arrayContaining([
      "cadence.minUpdates must be a positive number",
    ]));
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

  it("rejects narrator requests whose evidence omits policy, source, or loop proof refs", () => {
    expect(validateNarratorSayRequestV1({
      ...narratorSayRequest,
      loopRefs: ["thread:helix-ask:desktop"],
      evidenceRefs: ["helix:narrator:say:1", "translation_segment:latest"],
    })).toEqual(expect.arrayContaining([
      "loopRefs must include narrator:say",
      "loopRefs must include workstation_actuator:narrator_say",
      "evidenceRefs must include every sourceRefs entry",
      "evidenceRefs must include every loopRefs entry",
      "evidenceRefs must include narrator_say actuator policy ref",
    ]));

    expect(validateNarratorBindStreamRequestV1({
      ...narratorBindStreamRequest,
      loopRefs: ["thread:helix-ask:desktop"],
      evidenceRefs: ["helix:narrator:bind:1", "source:browser-audio"],
    })).toEqual(expect.arrayContaining([
      "loopRefs must include narrator:bind_stream",
      "loopRefs must include workstation_actuator:narrator_bind_stream",
      "evidenceRefs must include every sourceRefs entry",
      "evidenceRefs must include every loopRefs entry",
      "evidenceRefs must include narrator_bind_stream actuator policy ref",
    ]));
  });

  it("rejects narrator say requests that try to become answer authority or raw terminal text", () => {
    expect(validateNarratorSayRequestV1({
      ...narratorSayRequest,
      sourceRefs: [],
      loopRefs: [],
      evidenceRefs: ["translation_segment:latest"],
      producedRefs: [],
      deliveryMode: "hidden" as NarratorSayRequestV1["deliveryMode"],
      terminalAuthority: {
        status: "terminal",
        finalAnswerEligible: true,
        completedSolverPathRequired: false,
        terminalAuthoritySingleWriterRequired: false,
      },
      assistant_answer: true as false,
      terminal_eligible: true as false,
      raw_content_included: true as false,
    })).toEqual(expect.arrayContaining([
      "sourceRefs must include at least one reference",
      "loopRefs must include at least one reference",
      "producedRefs must include at least one reference",
      "evidenceRefs must include requestId",
      "producedRefs must include goalContextUpdateId",
      "deliveryMode must be visible_only, confirm_to_speak, or auto_speak",
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "narrator say requests must not be assistant answers",
      "narrator say requests must not be terminal eligible",
      "narrator say requests must not include raw content",
    ]));
  });

  it("rejects narrator stream bindings that try to become answer authority or hidden terminal routes", () => {
    expect(validateNarratorBindStreamRequestV1({
      ...narratorBindStreamRequest,
      evidenceRefs: ["source:browser-audio"],
      producedRefs: ["stage_play_goal_context_update:narrator:other"],
      streamKind: "final_answer_stream" as NarratorBindStreamRequestV1["streamKind"],
      deliveryMode: "hidden" as NarratorBindStreamRequestV1["deliveryMode"],
      voicePolicy: "always_terminal" as NarratorBindStreamRequestV1["voicePolicy"],
      terminalAuthority: {
        status: "terminal",
        finalAnswerEligible: true,
        completedSolverPathRequired: false,
        terminalAuthoritySingleWriterRequired: false,
      },
      assistant_answer: true as false,
      terminal_eligible: true as false,
      raw_content_included: true as false,
    })).toEqual(expect.arrayContaining([
      "evidenceRefs must include requestId",
      "producedRefs must include requestId",
      "producedRefs must include goalContextUpdateId",
      "streamKind is invalid",
      "deliveryMode must be visible_only, confirm_to_speak, or auto_speak",
      "voicePolicy is invalid",
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "narrator bind stream requests must not be assistant answers",
      "narrator bind stream requests must not be terminal eligible",
      "narrator bind stream requests must not include raw content",
    ]));
  });
});
