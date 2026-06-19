import { describe, expect, it } from "vitest";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  queryActuatorForAgentGoalContextFeedV1,
  type AgentGoalSessionV1,
  type WorkstationGoalContextUpdateV1,
} from "../workstation-goal-context.v1";
import {
  WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA,
  validateWorkstationContextFeedQueryResultV1,
  type WorkstationContextFeedQueryResultV1,
} from "../workstation-context-feed-query-result.v1";

const updateFixture = (
  overrides: Partial<WorkstationGoalContextUpdateV1> = {},
): WorkstationGoalContextUpdateV1 => ({
  schemaVersion: "helix.workstation_goal_context_update.v1",
  updateId: "stage_play_goal_context_update:visual:1",
  createdAtMs: 1_780_000_000_000,
  sourceRefs: ["visual_source:image-lens"],
  loopRefs: ["thread:helix-ask:desktop", "stage_play_mail_loop:helix-ask:desktop"],
  producerKind: "visual_capture",
  updateKind: "visual_observation",
  contentRef: "stage_play_live_source_mail:frog",
  preview: "ImageLens shows a frog image.",
  evidenceRefs: [
    "stage_play_live_source_mail:frog",
    "visual_source:image-lens",
    "thread:helix-ask:desktop",
    "stage_play_mail_loop:helix-ask:desktop",
  ],
  receiptRefs: ["stage_play_live_source_mail:frog"],
  freshness: {
    observedAtMs: 1_780_000_000_000,
    staleAfterMs: 30_000,
    status: "fresh",
  },
  goalRelevance: {
    goalId: "goal:frog",
    relevance: 0.8,
    reason: "Frog visual source is relevant.",
  },
  suggestedDispatch: [
    { kind: "log_receipt", receiptRef: "stage_play_live_source_mail:frog" },
    { kind: "append_goal_context", goalId: "goal:frog" },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
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
  ...overrides,
});

const resultFixture = (
  overrides: Partial<WorkstationContextFeedQueryResultV1> = {},
): WorkstationContextFeedQueryResultV1 => {
  const update = updateFixture();
  const resultId = overrides.resultId ?? "stage_play_context_feed_query:visual_summaries:frog";
  const feedKind = overrides.feedKind ?? "visual_summaries";
  const requiredActuator = overrides.requiredActuator ?? queryActuatorForAgentGoalContextFeedV1(feedKind);
  const matchedContextFeeds = overrides.matchedContextFeeds ?? [{
    feedId: `feed:${feedKind}`,
    sourceKind: feedKind,
    freshnessMs: 30_000,
    relevancePolicy: "same-source-or-goal-id",
  }];
  const matchedContextFeedRefs = overrides.matchedContextFeedRefs ?? matchedContextFeeds.map((feed) => feed.feedId);
  const matchedAllowedActuators = overrides.matchedAllowedActuators ??
    (overrides.actuatorAllowed === false ? [] : [requiredActuator]);
  const matchedAllowedActuatorRefs = overrides.matchedAllowedActuatorRefs ??
    matchedAllowedActuators.map((actuator) => `agent_goal_allowed_actuator:${actuator}`);
  const sessionContextFeeds: AgentGoalSessionV1["contextFeeds"] = matchedContextFeeds.length > 0
    ? matchedContextFeeds
    : [{
        feedId: "feed:non-matching",
        sourceKind: feedKind === "visual_summaries" ? "trace_memory" : "visual_summaries",
        freshnessMs: 30_000,
        relevancePolicy: "same-source-or-goal-id",
      }];
  const agentGoalSession: AgentGoalSessionV1 = {
    schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
    goalId: "goal:frog",
    threadId: "helix-ask:desktop",
    roomId: "room:desktop",
    objective: "Identify frog images from ImageLens visual summaries.",
    userVisibleSummary: "Identifying frog imagery.",
    status: "active",
    sourceRefs: ["visual_source:image-lens"],
    loopRefs: ["thread:helix-ask:desktop", "stage_play_mail_loop:helix-ask:desktop"],
    constructRefs: ["image-lens", "live-answer-environment"],
    contextFeeds: sessionContextFeeds,
    allowedActuators: [requiredActuator],
    cadence: { kind: "user_turn_only" },
    stopConditions: ["user stops the goal", "visual source disconnects"],
    checkpoints: [{
      checkpointId: "goal_checkpoint:frog:1",
      createdAtMs: 1_780_000_000_000,
      summary: "Visual summaries queried for frog evidence.",
      evidenceRefs: ["stage_play_goal_context_update:visual:1"],
      actionsTaken: [requiredActuator],
      nextStep: "continue",
    }],
    authority: {
      assistantAnswer: false,
      finalReportsRequireTerminalAuthority: true,
      finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
    },
  };
  const goalContextUpdates = overrides.goalContextUpdates ?? [update];
  const packetCircuitRefs = overrides.packetCircuitRefs ?? goalContextUpdates.map((entry) => {
    const allRefs = Array.from(new Set([
      entry.updateId,
      entry.contentRef,
      ...entry.sourceRefs,
      ...entry.loopRefs,
      ...entry.evidenceRefs,
      ...entry.receiptRefs,
    ]));
    return {
      updateId: entry.updateId,
      producerKind: entry.producerKind,
      updateKind: entry.updateKind,
      contentRef: entry.contentRef,
      sourceRefs: entry.sourceRefs,
      loopRefs: entry.loopRefs,
      packetRefs: allRefs.filter((ref) =>
        ref.startsWith("stage_play_processed_mail_packet:") ||
        ref.startsWith("stage_play_live_source_mail:") ||
        ref.startsWith("stage_play_packet_trace:")
      ),
      microDeckRefs: allRefs.filter((ref) =>
        ref.startsWith("stage_play_micro_reasoner_run:") ||
        ref.startsWith("microdeck:")
      ),
      receiptRefs: entry.receiptRefs,
      freshnessStatus: entry.freshness.status,
      assistant_answer: false,
      terminal_eligible: false,
    };
  });
  const agentGoalSessions = overrides.agentGoalSessions ?? [agentGoalSession];
  const validGoalSessions = agentGoalSessions
    .filter((entry): entry is AgentGoalSessionV1 =>
      typeof entry === "object" && entry !== null && "goalId" in entry,
    );
  const authoritySummary = overrides.authoritySummary ?? {
    answerAuthority: "completed_solver_path_required",
    updateCount: goalContextUpdates.length,
    observationOnlyUpdateCount: goalContextUpdates.filter((entry) =>
      entry.authority.assistantAnswer === false &&
      entry.authority.terminalEligible === false &&
      entry.authority.rawContentIncluded === false
    ).length,
    assistantAnswerCount: goalContextUpdates.filter((entry) => entry.authority.assistantAnswer !== false).length,
    terminalEligibleCount: goalContextUpdates.filter((entry) => entry.authority.terminalEligible !== false).length,
    rawContentIncludedCount: goalContextUpdates.filter((entry) => entry.authority.rawContentIncluded !== false).length,
    postToolModelStepRequiredCount: goalContextUpdates.filter((entry) => entry.authority.postToolModelStepRequired === true).length,
    activeGoalSessionCount: validGoalSessions.filter((entry) =>
      entry.status === "active" ||
      entry.status === "blocked" ||
      entry.status === "paused"
    ).length,
    finalReportsRequireTerminalAuthorityCount: validGoalSessions.filter((entry) =>
      entry.authority?.finalReportsRequireTerminalAuthority === true
    ).length,
    goalContextUpdateRefs: goalContextUpdates.map((entry) => entry.updateId),
    goalSessionRefs: validGoalSessions.map((entry) => entry.goalId),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    post_tool_model_step_required: true,
  };
  const policyEvidenceRefs = overrides.policyEvidenceRefs ?? [
    `context_feed:${feedKind}`,
    `allowed_actuator:${requiredActuator}`,
    ...matchedContextFeedRefs.map((feedRef) => `agent_goal_context_feed:${feedRef}`),
    ...matchedAllowedActuatorRefs,
  ];
  const sourceRefs = overrides.sourceRefs ?? ["visual_source:image-lens"];
  const loopRefs = overrides.loopRefs ?? [
    "thread:helix-ask:desktop",
    "stage_play_mail_loop:helix-ask:desktop",
    `workstation_context_feed:${feedKind}`,
    `workstation_actuator:${requiredActuator}`,
  ];
  const evidenceRefs = overrides.evidenceRefs ?? [
    resultId,
    ...policyEvidenceRefs,
    ...matchedContextFeedRefs,
    ...matchedAllowedActuatorRefs,
    ...sourceRefs,
    ...loopRefs,
    ...goalContextUpdates.flatMap((entry) => [
      entry.updateId,
      entry.contentRef,
      ...entry.evidenceRefs,
      ...entry.receiptRefs,
    ]),
  ];
  return {
    schema: WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA,
    resultId,
    feedKind,
    label: "visual summaries",
    mailboxThreadId: "helix-ask:desktop",
    mailboxThreadResolution: { mailboxThreadId: "helix-ask:desktop" },
    sourceRef: "visual_source:image-lens",
    goalId: "goal:frog",
    status: "read",
    missingRequirements: [],
    policyEvidenceRefs,
    sourceRefs,
    loopRefs,
    evidenceRefs,
    freshnessStatus: "fresh",
    goalSessionFound: true,
    feedAllowed: true,
    requiredActuator,
    actuatorAllowed: true,
    matchedContextFeeds,
    matchedContextFeedRefs,
    matchedAllowedActuators,
    matchedAllowedActuatorRefs,
    agentGoalSession,
    agentGoalSessions,
    goalContextUpdates,
    authoritySummary,
    packetCircuitRefs,
    updateCount: overrides.updateCount ?? goalContextUpdates.length,
    syncedWindow: {
      mailItemCount: 1,
      processedPacketCount: 0,
      microReasonerRunCount: 0,
    },
    goalContextUpdateId: "stage_play_goal_context_update:route_watch:feed-query",
    terminalAuthority: {
      status: "not_terminal",
      finalAnswerEligible: false,
      completedSolverPathRequired: true,
      terminalAuthoritySingleWriterRequired: true,
    },
    post_tool_model_step_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    ...overrides,
  };
};

describe("stage_play_workstation_context_feed_query_result/v1", () => {
  it("accepts feed query results as non-terminal tool evidence", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture())).toEqual([]);
  });

  it("requires feed query results to carry both feed and actuator policy refs", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      policyEvidenceRefs: ["context_feed:visual_summaries"],
    }))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include actuator policy ref",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      policyEvidenceRefs: ["allowed_actuator:query_visual_summaries"],
    }))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include context feed policy ref",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      requiredActuator: "query_trace_memory",
      policyEvidenceRefs: ["context_feed:visual_summaries", "allowed_actuator:query_trace_memory"],
      loopRefs: [
        "thread:helix-ask:desktop",
        "stage_play_mail_loop:helix-ask:desktop",
        "workstation_context_feed:visual_summaries",
        "workstation_actuator:query_trace_memory",
      ],
      evidenceRefs: [
        "stage_play_context_feed_query:visual_summaries:frog",
        "context_feed:visual_summaries",
        "allowed_actuator:query_trace_memory",
        "visual_source:image-lens",
        "thread:helix-ask:desktop",
        "stage_play_mail_loop:helix-ask:desktop",
        "workstation_context_feed:visual_summaries",
        "workstation_actuator:query_trace_memory",
      ],
    }))).toEqual(expect.arrayContaining([
      "requiredActuator must match feedKind query actuator",
      "policyEvidenceRefs must include feed query actuator policy ref",
      "loopRefs must include feed query actuator loop ref",
    ]));
  });

  it("requires feed query results to carry source, loop, evidence, and freshness proof refs", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      loopRefs: ["thread:helix-ask:desktop"],
      evidenceRefs: [
        "stage_play_context_feed_query:visual_summaries:frog",
        "context_feed:visual_summaries",
        "allowed_actuator:query_visual_summaries",
      ],
    }))).toEqual(expect.arrayContaining([
      "loopRefs must include workstation context feed loop ref",
      "loopRefs must include required actuator loop ref",
      "evidenceRefs must include every sourceRefs entry",
      "evidenceRefs must include every loopRefs entry",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      evidenceRefs: [
        "context_feed:visual_summaries",
        "allowed_actuator:query_visual_summaries",
        "visual_source:image-lens",
        "thread:helix-ask:desktop",
        "stage_play_mail_loop:helix-ask:desktop",
        "workstation_context_feed:visual_summaries",
        "workstation_actuator:query_visual_summaries",
      ],
    }))).toEqual(expect.arrayContaining([
      "evidenceRefs must include resultId",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      freshnessStatus: "blocked",
    }))).toEqual(expect.arrayContaining([
      "read feed query results must not have blocked freshnessStatus",
    ]));
  });

  it("requires read results to be admitted and blocked results to suppress updates", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      feedAllowed: false,
      actuatorAllowed: false,
    }))).toEqual(expect.arrayContaining([
      "read feed query results must have feedAllowed=true",
      "read feed query results must have actuatorAllowed=true",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      status: "blocked",
      missingRequirements: ["context_feed:visual_summaries"],
      feedAllowed: false,
      freshnessStatus: "blocked",
    }))).toEqual(expect.arrayContaining([
      "blocked feed query results must not include goalContextUpdates",
    ]));
  });

  it("requires exact matched actuator refs for goal-authorized feed queries", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      matchedAllowedActuators: [],
      matchedAllowedActuatorRefs: [],
    }))).toEqual(expect.arrayContaining([
      "actuatorAllowed=true for a goal session requires matchedAllowedActuators",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      matchedAllowedActuatorRefs: [],
    }))).toEqual(expect.arrayContaining([
      "matchedAllowedActuatorRefs must include every matchedAllowedActuators policy ref",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      policyEvidenceRefs: [
        "context_feed:visual_summaries",
        "allowed_actuator:query_visual_summaries",
        "agent_goal_context_feed:feed:visual_summaries",
      ],
    }))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include every matched allowed actuator policy ref",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      evidenceRefs: [
        "stage_play_context_feed_query:visual_summaries:frog",
        "context_feed:visual_summaries",
        "allowed_actuator:query_visual_summaries",
        "agent_goal_context_feed:feed:visual_summaries",
        "feed:visual_summaries",
        "visual_source:image-lens",
        "thread:helix-ask:desktop",
        "stage_play_mail_loop:helix-ask:desktop",
        "workstation_context_feed:visual_summaries",
        "workstation_actuator:query_visual_summaries",
      ],
    }))).toEqual(expect.arrayContaining([
      "evidenceRefs must include every matchedAllowedActuatorRefs entry",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      actuatorAllowed: false,
      matchedAllowedActuators: ["query_visual_summaries"],
    }))).toEqual(expect.arrayContaining([
      "actuatorAllowed=false must not expose matchedAllowedActuators",
    ]));
  });

  it("rejects feed query results that claim a found goal session without session evidence", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      goalSessionFound: true,
      agentGoalSession: null,
      agentGoalSessions: [],
    }))).toEqual(expect.arrayContaining([
      "goalSessionFound=true requires agentGoalSession",
      "goalSessionFound=true requires at least one agentGoalSessions entry",
    ]));
  });

  it("rejects feed query results whose session evidence is malformed or for another goal", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      agentGoalSession: {
        goalId: "goal:wrong",
        threadId: "helix-ask:desktop",
      },
      agentGoalSessions: [{
        goalId: "goal:wrong",
        threadId: "helix-ask:desktop",
      }],
    }))).toEqual(expect.arrayContaining([
      "agentGoalSession.schemaVersion must match agent goal session schema",
      "agentGoalSession.goalId must match goalId",
      "agentGoalSessions[0].schemaVersion must match agent goal session schema",
      "agentGoalSessions[0].goalId must match goalId",
    ]));
  });

  it("rejects authority summaries that do not cite the summarized update and session refs", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      authoritySummary: {
        answerAuthority: "completed_solver_path_required",
        goalContextUpdateRefs: [],
        goalSessionRefs: [],
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        post_tool_model_step_required: true,
      },
    }))).toEqual(expect.arrayContaining([
      "authoritySummary.goalContextUpdateRefs must include every goalContextUpdates updateId",
      "authoritySummary.goalSessionRefs must include every agentGoalSessions goalId",
    ]));
  });

  it("rejects authority summaries whose counts do not match embedded evidence", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      authoritySummary: {
        answerAuthority: "completed_solver_path_required",
        updateCount: 0,
        observationOnlyUpdateCount: 0,
        assistantAnswerCount: 1,
        terminalEligibleCount: 1,
        rawContentIncludedCount: 1,
        postToolModelStepRequiredCount: 0,
        activeGoalSessionCount: 0,
        finalReportsRequireTerminalAuthorityCount: 0,
        goalContextUpdateRefs: ["stage_play_goal_context_update:visual:1"],
        goalSessionRefs: ["goal:frog"],
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        post_tool_model_step_required: true,
      },
    }))).toEqual(expect.arrayContaining([
      "authoritySummary.updateCount must match goalContextUpdates length",
      "authoritySummary.observationOnlyUpdateCount must match observation-only updates",
      "authoritySummary.assistantAnswerCount must match assistant-answer updates",
      "authoritySummary.terminalEligibleCount must match terminal-eligible updates",
      "authoritySummary.rawContentIncludedCount must match raw-content updates",
      "authoritySummary.postToolModelStepRequiredCount must match post-tool update count",
      "authoritySummary.activeGoalSessionCount must match active goal sessions",
      "authoritySummary.finalReportsRequireTerminalAuthorityCount must match authority-bound sessions",
    ]));
  });

  it("requires packet circuit refs to mirror every embedded goal-context update without terminal authority", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      packetCircuitRefs: [],
    }))).toEqual(expect.arrayContaining([
      "packetCircuitRefs must include one entry for every goalContextUpdates item",
    ]));

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      packetCircuitRefs: [{
        updateId: "stage_play_goal_context_update:wrong",
        producerKind: "microdeck",
        updateKind: "classification",
        contentRef: "stage_play_processed_mail_packet:wrong",
        sourceRefs: [],
        loopRefs: [],
        packetRefs: [],
        microDeckRefs: [],
        receiptRefs: [],
        freshnessStatus: "stale",
        assistant_answer: true as false,
        terminal_eligible: true as false,
      }],
    } as Partial<WorkstationContextFeedQueryResultV1>))).toEqual(expect.arrayContaining([
      "packetCircuitRefs[0].updateId must match a goalContextUpdates item",
      "packetCircuitRefs[0].assistant_answer must be false",
      "packetCircuitRefs[0].terminal_eligible must be false",
    ]));
  });

  it("accepts MicroDeck updates only on the MicroDeck feed lane", () => {
    const microdeckUpdate = updateFixture({
      updateId: "stage_play_goal_context_update:microdeck:1",
      producerKind: "microdeck",
      updateKind: "classification",
      contentRef: "stage_play_processed_mail_packet:frog",
      preview: "MicroDeck classified the packet as amphibian visual evidence.",
      evidenceRefs: [
        "stage_play_processed_mail_packet:frog",
        "visual_source:image-lens",
        "thread:helix-ask:desktop",
        "stage_play_mail_loop:helix-ask:desktop",
      ],
      receiptRefs: ["stage_play_processed_mail_packet:frog"],
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      resultId: "stage_play_context_feed_query:microdeck_outputs:frog",
      feedKind: "microdeck_outputs",
      label: "MicroDeck outputs",
      policyEvidenceRefs: [
        "context_feed:microdeck_outputs",
        "allowed_actuator:query_microdeck_outputs",
        "agent_goal_context_feed:feed:microdeck_outputs",
        "agent_goal_allowed_actuator:query_microdeck_outputs",
      ],
      requiredActuator: "query_microdeck_outputs",
      goalContextUpdates: [microdeckUpdate],
      updateCount: 1,
    }))).toEqual([]);
  });

  it("rejects visual feed query results carrying MicroDeck updates", () => {
    const microdeckUpdate = updateFixture({
      updateId: "stage_play_goal_context_update:microdeck:wrong-lane",
      producerKind: "microdeck",
      updateKind: "classification",
      contentRef: "stage_play_processed_mail_packet:frog",
      preview: "MicroDeck classified the packet as amphibian visual evidence.",
      evidenceRefs: ["stage_play_processed_mail_packet:frog"],
      receiptRefs: ["stage_play_processed_mail_packet:frog"],
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      goalContextUpdates: [microdeckUpdate],
      updateCount: 1,
    }))).toEqual(expect.arrayContaining([
      "goalContextUpdates[0] does not match feedKind visual_summaries",
    ]));
  });

  it("rejects Live Answer feed query results carrying route-watch evidence", () => {
    const routeWatchUpdate = updateFixture({
      updateId: "stage_play_goal_context_update:route_watch:wrong-lane",
      producerKind: "route_watch",
      updateKind: "route_evidence",
      contentRef: "stage_play_context_feed_query:visual_summaries:frog",
      preview: "Route watch recorded that a visual summaries query happened.",
      evidenceRefs: ["context_feed:visual_summaries"],
      receiptRefs: ["stage_play_context_feed_query:visual_summaries:frog"],
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      resultId: "stage_play_context_feed_query:live_answer_lines:frog",
      feedKind: "live_answer_lines",
      label: "Live Answer state",
      policyEvidenceRefs: ["context_feed:live_answer_lines", "allowed_actuator:query_live_answer_state"],
      requiredActuator: "query_live_answer_state",
      goalContextUpdates: [routeWatchUpdate],
      updateCount: 1,
    }))).toEqual(expect.arrayContaining([
      "goalContextUpdates[0] does not match feedKind live_answer_lines",
    ]));
  });

  it("accepts route evidence feed results carrying route-watch automation status", () => {
    const automationUpdate = updateFixture({
      updateId: "stage_play_goal_context_update:automation:route-watch-policy",
      producerKind: "automation",
      updateKind: "automation_status",
      contentRef: "stage_play_live_source_watch_job_policy:route-watch",
      preview: "Route-watch automation policy is armed for source packets.",
      evidenceRefs: [
        "stage_play_live_source_watch_job_policy:route-watch",
        "visual_source:image-lens",
        "thread:helix-ask:desktop",
        "stage_play_mail_loop:helix-ask:desktop",
      ],
      receiptRefs: ["stage_play_live_source_watch_job_policy:route-watch"],
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      resultId: "stage_play_context_feed_query:route_evidence:frog",
      feedKind: "route_evidence",
      label: "route evidence",
      policyEvidenceRefs: [
        "context_feed:route_evidence",
        "allowed_actuator:query_route_evidence",
        "agent_goal_context_feed:feed:route_evidence",
        "agent_goal_allowed_actuator:query_route_evidence",
      ],
      requiredActuator: "query_route_evidence",
      goalContextUpdates: [automationUpdate],
      updateCount: 1,
    }))).toEqual([]);
  });

  it("rejects automation policy feed results carrying route-watch evidence records", () => {
    const routeWatchUpdate = updateFixture({
      updateId: "stage_play_goal_context_update:route_watch:automation-wrong-lane",
      producerKind: "route_watch",
      updateKind: "route_evidence",
      contentRef: "route_watch_evidence:frog",
      preview: "Route-watch query evidence should not appear in automation policy feeds.",
      evidenceRefs: ["route_watch_evidence:frog"],
      receiptRefs: ["route_watch_evidence:frog"],
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      resultId: "stage_play_context_feed_query:automation_policies:frog",
      feedKind: "automation_policies",
      label: "automation policies",
      policyEvidenceRefs: ["context_feed:automation_policies", "allowed_actuator:query_automation_policies"],
      requiredActuator: "query_automation_policies",
      goalContextUpdates: [routeWatchUpdate],
      updateCount: 1,
    }))).toEqual(expect.arrayContaining([
      "goalContextUpdates[0] does not match feedKind automation_policies",
    ]));
  });

  it("accepts blocked feed query results when no updates are returned", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      status: "blocked",
      missingRequirements: ["context_feed:visual_summaries"],
      feedAllowed: false,
      matchedContextFeeds: [],
      matchedContextFeedRefs: [],
      policyEvidenceRefs: [
        "context_feed:visual_summaries",
        "allowed_actuator:query_visual_summaries",
        "agent_goal_allowed_actuator:query_visual_summaries",
      ],
      goalContextUpdates: [],
      updateCount: 0,
      freshnessStatus: "blocked",
      syncedWindow: {
        mailItemCount: 0,
        processedPacketCount: 0,
        microReasonerRunCount: 0,
      },
    } as Partial<WorkstationContextFeedQueryResultV1>))).toEqual([]);
  });

  it("rejects feed query results that carry terminalizing updates", () => {
    const invalidUpdate = updateFixture({
      assistant_answer: true as false,
      terminal_eligible: true as false,
      raw_content_included: true as false,
      authority: {
        assistantAnswer: true as false,
        terminalEligible: true as false,
        rawContentIncluded: true as false,
        postToolModelStepRequired: false as true,
      },
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      goalContextUpdates: [invalidUpdate],
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      terminalAuthority: {
        status: "terminal",
        finalAnswerEligible: true,
        completedSolverPathRequired: false,
        terminalAuthoritySingleWriterRequired: false,
      },
      authoritySummary: {
        answerAuthority: "panel_projection",
        assistant_answer: true,
        terminal_eligible: true,
        raw_content_included: true,
        post_tool_model_step_required: false,
      },
    } as Partial<WorkstationContextFeedQueryResultV1>))).toEqual(expect.arrayContaining([
      "goalContextUpdates[0].goal context updates must expose assistant_answer=false",
      "goalContextUpdates[0].goal context updates must expose terminal_eligible=false",
      "goalContextUpdates[0].goal context updates must expose raw_content_included=false",
      "goalContextUpdates[0].goal context updates must not be assistant answers",
      "goalContextUpdates[0].goal context updates must not be terminal eligible",
      "goalContextUpdates[0].goal context updates must not include raw content",
      "goalContextUpdates[0].goal context updates require a post-tool model step before answers",
      "authoritySummary.assistant_answer must be false",
      "authoritySummary.terminal_eligible must be false",
      "authoritySummary.raw_content_included must be false",
      "authoritySummary.post_tool_model_step_required must be true",
      "authoritySummary.answerAuthority must require completed solver path",
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
    ]));
  });
});
