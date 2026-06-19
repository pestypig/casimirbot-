// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LiveAnswerReasoningCircuit } from "@/components/workstation/LiveAnswerReasoningCircuit";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  type AgentGoalSessionV1,
} from "@shared/contracts/workstation-goal-context.v1";

const goalSession: AgentGoalSessionV1 = {
  schemaVersion: "helix.agent_goal_session.v1",
  goalId: "goal:translate-visual-audio",
  threadId: "helix-ask:desktop",
  objective: "Monitor the visual capture and translated audio without making the circuit terminal.",
  userVisibleSummary: "Monitor visual and translated audio feeds.",
  status: "active",
  sourceRefs: ["visual:screen-share", "audio:earbuds"],
  loopRefs: ["loop:visual-mail", "loop:audio-translation"],
  constructRefs: ["live-answer:desktop"],
  contextFeeds: [
    { feedId: "feed:visual", sourceKind: "visual_summaries", freshnessMs: 10_000, relevancePolicy: "same-source-or-goal-id", query: "frog frames" },
    { feedId: "feed:packet", sourceKind: "packet_traces", freshnessMs: 10_000 },
    { feedId: "feed:source-health", sourceKind: "source_health", freshnessMs: 60_000 },
    { feedId: "feed:translation", sourceKind: "translated_transcripts", freshnessMs: 10_000 },
    { feedId: "feed:narrator-events", sourceKind: "narrator_events", freshnessMs: 60_000 },
    { feedId: "feed:automation", sourceKind: "automation_policies", freshnessMs: 120_000 },
  ],
  allowedActuators: ["query_visual_summaries", "query_packet_traces", "query_source_health", "query_translation_segments", "narrator_bind_stream"],
  cadence: { kind: "user_turn_only" },
  stopConditions: ["operator stops monitoring"],
  checkpoints: [{
    checkpointId: "checkpoint:translation-ready",
    createdAtMs: 1781736215000,
    summary: "Narrator stream is bound to translated transcript evidence.",
    evidenceRefs: ["translation:segment:latest"],
    actionsTaken: ["narrator_bind_stream"],
    nextStep: "continue",
  }],
  authority: {
    assistantAnswer: false,
    finalReportsRequireTerminalAuthority: true,
    finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  },
};

describe("LiveAnswerReasoningCircuit", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders packet refs, dispatches, sessions, and non-terminal authority", () => {
    render(
      <LiveAnswerReasoningCircuit
        rows={[
          {
            id: "goal-update:visual-frog",
            title: "visual observation",
            producer: "microdeck",
            status: "fresh",
            preview: "Frog classification deck produced an amphibian observation.",
            contentRef: "microdeck-output:frog-classifier",
            sourceRefs: ["visual:screen-share"],
            loopRefs: ["loop:visual-mail"],
            evidenceRefs: [
              "frame:frog-001",
              "microdeck-run:frog-classifier",
              "agent_goal_feed:visual",
              "freshness_filter:fresh",
              "agent_goal_session_filter:context_feed:trace_memory",
              "agent_goal_session_filter:allowed_actuator:narrator_bind_stream",
            ],
            receiptRefs: ["receipt:frog-classifier"],
            policyRefs: [
              "context_feed:visual_summaries",
              "agent_goal_context_feed:agent_goal_feed:visual",
              "allowed_actuator:query_visual_summaries",
              "agent_goal_allowed_actuator:query_visual_summaries",
            ],
            requestedToolName: "visual_preset",
            canonicalToolName: "live_env.set_visual_preset",
            matchedAllowedActuators: ["set_visual_preset"],
            matchedAllowedActuatorRefs: ["agent_goal_allowed_actuator:set_visual_preset"],
            packetCircuitRefs: [{
              updateId: "goal-update:visual-frog",
              contentRef: "microdeck-output:frog-classifier",
              packetRefs: ["stage_play_processed_mail_packet:frog-001"],
              microDeckRefs: ["microdeck-run:frog-classifier"],
              sourceRefs: ["visual:screen-share"],
              loopRefs: ["loop:visual-mail"],
              receiptRefs: ["receipt:frog-classifier"],
              freshnessStatus: "fresh",
              assistantAnswer: false,
              terminalEligible: false,
            }],
            dispatch: [
              "narrator bind translated transcript",
              "wake interrupt",
              "preset frog classifier",
              "bind source",
              "focus graph",
            ],
            packetColorKey: "stage_play_processed_mail_packet:frog-001",
            freshness: {
              observedAtMs: 1781736210000,
              staleAfterMs: 30000,
              status: "fresh",
            },
            authority: {
              assistantAnswer: false,
              terminalEligible: false,
              rawContentIncluded: false,
              postToolModelStepRequired: true,
            },
          },
          {
            id: "goal-update:bad-terminal-projection",
            title: "projection warning",
            producer: "live answer",
            status: "blocked",
            preview: "Malformed projection tried to act terminal before solver authority.",
            contentRef: "live-answer-projection:bad-terminal",
            sourceRefs: ["live-answer:desktop"],
            loopRefs: ["loop:projection"],
            evidenceRefs: ["projection:bad-terminal"],
            receiptRefs: ["receipt:bad-terminal"],
            policyRefs: [],
            requestedToolName: null,
            canonicalToolName: null,
            matchedAllowedActuators: [],
            matchedAllowedActuatorRefs: [],
            packetCircuitRefs: [{
              updateId: "goal-update:bad-terminal-projection",
              contentRef: "live-answer-projection:bad-terminal",
              packetRefs: [],
              microDeckRefs: [],
              sourceRefs: ["live-answer:desktop"],
              loopRefs: ["loop:projection"],
              receiptRefs: ["receipt:bad-terminal"],
              freshnessStatus: "blocked",
              assistantAnswer: true,
              terminalEligible: true,
            }],
            dispatch: ["update live answer"],
            packetColorKey: "live-answer-projection:bad-terminal",
            freshness: {
              observedAtMs: 1781736211000,
              status: "blocked",
            },
            authority: {
              assistantAnswer: true,
              terminalEligible: true,
              rawContentIncluded: true,
              postToolModelStepRequired: false,
            },
          },
          {
            id: "goal-update:automation-policy",
            title: "automation status",
            producer: "automation",
            status: "fresh",
            preview: "Watch-job policy is armed for the next visual summary.",
            contentRef: "stage_play_live_source_watch_job_policy:ui",
            sourceRefs: ["visual:screen-share"],
            loopRefs: ["stage_play_live_source_watch_job:ui"],
            evidenceRefs: ["stage_play_live_source_watch_job_policy:ui"],
            receiptRefs: ["stage_play_live_source_watch_job_policy:ui"],
            policyRefs: ["workstation_context_feed:automation_policies", "workstation_actuator:set_loop_state"],
            requestedToolName: "live_env.set_workstation_loop_state",
            canonicalToolName: "live_env.set_workstation_loop_state",
            matchedAllowedActuators: ["set_loop_state"],
            matchedAllowedActuatorRefs: ["agent_goal_allowed_actuator:set_loop_state"],
            packetCircuitRefs: [{
              updateId: "goal-update:automation-policy",
              contentRef: "stage_play_live_source_watch_job_policy:ui",
              packetRefs: [],
              microDeckRefs: [],
              sourceRefs: ["visual:screen-share"],
              loopRefs: ["stage_play_live_source_watch_job:ui"],
              receiptRefs: ["stage_play_live_source_watch_job_policy:ui"],
              freshnessStatus: "fresh",
              assistantAnswer: false,
              terminalEligible: false,
            }],
            dispatch: ["set loop state running"],
            packetColorKey: "stage_play_live_source_watch_job_policy:ui",
            freshness: {
              observedAtMs: 1781736212000,
              staleAfterMs: 120000,
              status: "fresh",
            },
            authority: {
              assistantAnswer: false,
              terminalEligible: false,
              rawContentIncluded: false,
              postToolModelStepRequired: true,
            },
          },
        ]}
        summary={{
          updateCount: 3,
          observationOnlyCount: 2,
          activeGoalCount: 1,
          narratorSpeechCount: 0,
          narratorBindingCount: 1,
          wakeCount: 1,
          wakeUrgentCount: 1,
          wakeBlockedCount: 0,
          wakePolicyTriggeredCount: 0,
          workstationControlDispatchCount: 6,
          presetDispatchCount: 1,
          sourceBindingDispatchCount: 1,
          loopDispatchCount: 1,
          liveAnswerDispatchCount: 1,
          processGraphDispatchCount: 1,
          visualSummaryCount: 2,
          microdeckOutputCount: 1,
          audioTranscriptCount: 0,
          translatedTranscriptCount: 1,
          packetTraceCount: 2,
          sourceHealthCount: 2,
          feedQueryCount: 7,
          routeWatchCount: 0,
          automationCount: 2,
          feedPolicyRefCount: 3,
          actuatorPolicyRefCount: 3,
          freshnessFilterRefCount: 1,
          sessionFilterRefCount: 2,
          toolAttributedUpdateCount: 2,
          matchedToolActuatorUpdateCount: 2,
          actuatorPolicyCount: 5,
          narratorEventFeedCount: 1,
          narratorActuatorPolicyCount: 1,
          traceMemoryCount: 2,
          terminalAuthorityRequiredCount: 1,
          terminalPosture: "terminal authority required",
        }}
        sessions={[goalSession]}
      />,
    );

    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("Reasoning circuit");
    expect(screen.getAllByTestId("live-answer-goal-context-row")[0]).toHaveTextContent("visual observation");
    expect(screen.getAllByTestId("live-answer-goal-context-row")[0]).toHaveTextContent("microdeck-output:frog-classifier");
    expect(screen.getAllByTestId("live-answer-goal-context-refs")[0]).toHaveTextContent("sources=visual:screen-share");
    expect(screen.getAllByTestId("live-answer-goal-context-refs")[0]).toHaveTextContent("loops=loop:visual-mail");
    expect(screen.getAllByTestId("live-answer-goal-context-refs")[0]).toHaveTextContent("evidence=frame:frog-001, microdeck-run:frog-classifier, agent_goal_feed:visual");
    expect(screen.getAllByTestId("live-answer-goal-context-refs")[0]).toHaveTextContent("receipts=receipt:frog-classifier");
    expect(screen.getAllByTestId("live-answer-goal-context-policy-refs")[0]).toHaveTextContent("policy=context_feed:visual_summaries, agent_goal_context_feed:agent_goal_feed:visual, allowed_actuator:query_visual_summaries, agent_goal_allowed_actuator:query_visual_summaries");
    expect(screen.getAllByTestId("live-answer-goal-context-policy-refs")[1]).toHaveTextContent("policy=none");
    expect(screen.getAllByTestId("live-answer-goal-context-policy-refs")[2]).toHaveTextContent("policy=workstation_context_feed:automation_policies, workstation_actuator:set_loop_state");
    expect(screen.getAllByTestId("live-answer-goal-context-policy-split")[0]).toHaveTextContent("feeds=context_feed:visual_summaries, agent_goal_context_feed:agent_goal_feed:visual; actuators=allowed_actuator:query_visual_summaries, agent_goal_allowed_actuator:query_visual_summaries");
    expect(screen.getAllByTestId("live-answer-goal-context-policy-split")[1]).toHaveTextContent("feeds=none; actuators=none");
    expect(screen.getAllByTestId("live-answer-goal-context-policy-split")[2]).toHaveTextContent("feeds=workstation_context_feed:automation_policies; actuators=workstation_actuator:set_loop_state");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness-filter")[0]).toHaveTextContent("requestedFreshness=freshness_filter:fresh");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness-filter")[1]).toHaveTextContent("requestedFreshness=none");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness-filter")[2]).toHaveTextContent("requestedFreshness=none");
    expect(screen.getAllByTestId("live-answer-goal-context-session-filter")[0]).toHaveTextContent("requestedSession=agent_goal_session_filter:context_feed:trace_memory, agent_goal_session_filter:allowed_actuator:narrator_bind_stream");
    expect(screen.getAllByTestId("live-answer-goal-context-session-filter")[1]).toHaveTextContent("requestedSession=none");
    expect(screen.getAllByTestId("live-answer-goal-context-session-filter")[2]).toHaveTextContent("requestedSession=none");
    expect(screen.getAllByTestId("live-answer-goal-context-tool-identity")[0]).toHaveTextContent("tool=visual_preset -> live_env.set_visual_preset; matched=set_visual_preset; matchedRefs=agent_goal_allowed_actuator:set_visual_preset");
    expect(screen.getAllByTestId("live-answer-goal-context-tool-identity")[1]).toHaveTextContent("tool=none; matched=none; matchedRefs=none");
    expect(screen.getAllByTestId("live-answer-goal-context-tool-identity")[2]).toHaveTextContent("tool=live_env.set_workstation_loop_state; matched=set_loop_state; matchedRefs=agent_goal_allowed_actuator:set_loop_state");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness")[0]).toHaveTextContent("freshness=fresh observed=1781736210000 staleAfter=30000ms");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness")[1]).toHaveTextContent("freshness=blocked observed=1781736211000 staleAfter=unbounded");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness")[2]).toHaveTextContent("freshness=fresh observed=1781736212000 staleAfter=120000ms");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[0]).toHaveTextContent("update=goal-update:visual-frog");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[0]).toHaveTextContent("content=microdeck-output:frog-classifier");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[0]).toHaveTextContent("packets=stage_play_processed_mail_packet:frog-001");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[0]).toHaveTextContent("microDecks=microdeck-run:frog-classifier");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[0]).toHaveTextContent("terminal=false assistant=false freshness=fresh");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[1]).toHaveTextContent("terminal=true assistant=true freshness=blocked");
    expect(screen.getAllByTestId("live-answer-packet-circuit-refs")[2]).toHaveTextContent("packets=none");
    expect(screen.getAllByTestId("live-answer-packet-color-key")[0]).toHaveTextContent("packet-color=stage_play_processed_mail_packet:frog-001");
    expect(screen.getAllByTestId("live-answer-packet-color-key")[1]).toHaveTextContent("packet-color=live-answer-projection:bad-terminal");
    expect(screen.getAllByTestId("live-answer-packet-color-key")[2]).toHaveTextContent("packet-color=stage_play_live_source_watch_job_policy:ui");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[0]).toHaveTextContent("Source visual:screen share");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[0]).toHaveTextContent("Loop loop:visual mail");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[0]).toHaveTextContent("Deck microdeck output:frog classifier");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[0]).toHaveTextContent("Dispatch narrator bind translated transcript");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[0]).toHaveTextContent("Destination narrator:translated transcript | wake interrupt | preset:frog classifier | source binding");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[0]).toHaveTextContent("Authority evidence only");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[1]).toHaveTextContent("Destination live answer projection");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[1]).toHaveTextContent("Authority blocked terminal claim");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[2]).toHaveTextContent("Source visual:screen share");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[2]).toHaveTextContent("Loop live source watch job:ui");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[2]).toHaveTextContent("Destination loop control");
    expect(screen.getAllByTestId("live-answer-goal-context-circuit-route")[2]).toHaveTextContent("Authority evidence only");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("assistant=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("terminal=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("raw=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("postToolStep=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("assistant=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("terminal=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("raw=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("postToolStep=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[2]).toHaveTextContent("assistant=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[2]).toHaveTextContent("terminal=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[2]).toHaveTextContent("raw=false");
    expect(screen.getAllByTestId("live-answer-goal-context-dispatch").map((node: HTMLElement) => node.textContent)).toEqual([
      "narrator bind translated transcript",
      "wake interrupt",
      "preset frog classifier",
      "bind source",
      "focus graph",
      "update live answer",
      "set loop state running",
    ]);
    expect(screen.getByTestId("live-answer-narrator-binding-count")).toHaveTextContent("1 narrator bindings");
    expect(screen.getByTestId("live-answer-wake-dispatch-count")).toHaveTextContent("1 wake dispatch");
    expect(screen.getByTestId("live-answer-control-dispatch-count")).toHaveTextContent("6 non-wake control dispatches");
    expect(screen.getByTestId("live-answer-microdeck-output-count")).toHaveTextContent("1 MicroDeck output");
    expect(screen.getByTestId("live-answer-visual-summary-count")).toHaveTextContent("2 visual summaries");
    expect(screen.getByTestId("live-answer-audio-transcript-count")).toHaveTextContent("0 audio transcripts");
    expect(screen.getByTestId("live-answer-translated-transcript-count")).toHaveTextContent("1 translations");
    expect(screen.getByTestId("live-answer-packet-trace-count")).toHaveTextContent("2 packet traces");
    expect(screen.getByTestId("live-answer-source-health-count")).toHaveTextContent("2 source health");
    expect(screen.getByTestId("live-answer-feed-query-count")).toHaveTextContent("7 feed queries");
    expect(screen.getByTestId("live-answer-feed-policy-ref-count")).toHaveTextContent("3 feed policy refs");
    expect(screen.getByTestId("live-answer-actuator-policy-ref-count")).toHaveTextContent("3 actuator policy refs");
    expect(screen.getByTestId("live-answer-freshness-filter-ref-count")).toHaveTextContent("1 freshness filters");
    expect(screen.getByTestId("live-answer-session-filter-ref-count")).toHaveTextContent("2 session filters");
    expect(screen.getByTestId("live-answer-tool-attribution-count")).toHaveTextContent("2 tool-attributed updates");
    expect(screen.getByTestId("live-answer-matched-tool-actuator-count")).toHaveTextContent("2 matched tool actuator updates");
    expect(screen.getByTestId("live-answer-route-watch-count")).toHaveTextContent("0 route watch");
    expect(screen.getByTestId("live-answer-automation-count")).toHaveTextContent("2 automations");
    expect(screen.getByTestId("live-answer-actuator-policy-count")).toHaveTextContent("5 actuator policies");
    expect(screen.getByTestId("live-answer-narrator-actuator-policy-count")).toHaveTextContent("1 narrator output policy");
    expect(screen.getByTestId("live-answer-narrator-event-feed-count")).toHaveTextContent("1 narrator event feeds");
    expect(screen.getByTestId("live-answer-trace-memory-count")).toHaveTextContent("2 trace memory");
    expect(screen.getByTestId("live-answer-observation-authority-count")).toHaveTextContent("2 observation-only");
    expect(screen.getByTestId("live-answer-terminal-authority-count")).toHaveTextContent("1 terminal authority");
    expect(screen.getByTestId("live-answer-terminal-authority-posture")).toHaveTextContent("terminal authority required");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("route_watch=0");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("wake_dispatches=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("microdeck_outputs=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("visual_summaries=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("automations=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("actuator_policies=5");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("narrator_output_policies=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("narrator_event_feeds=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("audio_transcripts=0");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("translations=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("packet_traces=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("source_health=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("feed_queries=7");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("feed_policy_refs=3");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("actuator_policy_refs=3");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("freshness_filters=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("session_filters=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("tool_attributed_updates=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("matched_tool_actuator_updates=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("trace_memory=2");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("control_dispatches=6");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("preset=1");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("source_binding=1");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("loop=1");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("live_answer=1");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("graph=1");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("narrator=1");
    expect(screen.getByTestId("live-answer-control-dispatch-breakdown")).toHaveTextContent("wake_interrupts=1");
    expect(screen.getByTestId("live-answer-wake-interrupt-scope")).toHaveTextContent("wake_scope urgent=1 blocked=0 policy_triggered=0");
    expect(screen.getByTestId("live-answer-agent-goal-session")).toHaveTextContent("active / 6 feeds");
    expect(screen.getByTestId("live-answer-agent-goal-policy")).toHaveTextContent("Monitor visual and translated audio feeds.");
    expect(screen.getByTestId("live-answer-agent-goal-final-authority")).toHaveTextContent("finalAuthority=true");
    expect(screen.getByTestId("live-answer-agent-goal-cadence")).toHaveTextContent("cadence=user turn");
    expect(screen.getByTestId("live-answer-agent-goal-feeds")).toHaveTextContent("feeds=visual summaries, packet traces, source health, translated transcripts, narrator events, automation policies");
    expect(screen.getByTestId("live-answer-agent-goal-actuators")).toHaveTextContent("actuators=query visual summaries, query packet traces, query source health, query translation segments, narrator bind stream");
    expect(screen.getByTestId("live-answer-agent-goal-stop")).toHaveTextContent("stop=operator stops monitoring");
    expect(screen.getByTestId("live-answer-agent-goal-checkpoint")).toHaveTextContent("checkpoint=Narrator stream is bound to translated transcript evidence.");
    expect(screen.getByTestId("live-answer-context-feed-index")).toHaveTextContent("Context feed index");
    expect(screen.getByTestId("live-answer-context-feed-index")).toHaveTextContent("Session feed lanes map to query tools as non-terminal evidence inputs.");
    expect(screen.getByTestId("live-answer-context-feed-index-count")).toHaveTextContent("6 lanes");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("visual summaries");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("feed=feed:visual");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("queryTool=query_visual_summaries");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("policy=allowed");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("feedRef=agent_goal_context_feed:feed:visual");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("actuatorRef=agent_goal_allowed_actuator:query_visual_summaries");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("freshness=10000ms");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("relevance=same-source-or-goal-id");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[0]).toHaveTextContent("query=frog frames");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[3]).toHaveTextContent("translated transcripts");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[3]).toHaveTextContent("queryTool=query_translation_segments");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[3]).toHaveTextContent("actuatorRef=agent_goal_allowed_actuator:query_translation_segments");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[4]).toHaveTextContent("narrator events");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[4]).toHaveTextContent("queryTool=query_narrator_events");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[4]).toHaveTextContent("policy=not allowed");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[4]).toHaveTextContent("feedRef=agent_goal_context_feed:feed:narrator-events");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[4]).toHaveTextContent("actuatorRef=none");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[5]).toHaveTextContent("automation policies");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[5]).toHaveTextContent("queryTool=query_automation_policies");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[5]).toHaveTextContent("policy=not allowed");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[5]).toHaveTextContent("feedRef=agent_goal_context_feed:feed:automation");
    expect(screen.getAllByTestId("live-answer-context-feed-lane")[5]).toHaveTextContent("actuatorRef=none");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent(
      "Wake is only an interrupt dispatch. Receipts, MicroDeck outputs, narrator bindings, and panel projections stay evidence until the completed solver path selects a terminal answer.",
    );
  });
});
