// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LiveAnswerReasoningCircuit } from "@/components/workstation/LiveAnswerReasoningCircuit";
import type { AgentGoalSessionV1 } from "@shared/contracts/workstation-goal-context.v1";

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
    { feedId: "feed:visual", sourceKind: "visual_summaries", freshnessMs: 10_000 },
    { feedId: "feed:packet", sourceKind: "packet_traces", freshnessMs: 10_000 },
    { feedId: "feed:source-health", sourceKind: "source_health", freshnessMs: 60_000 },
    { feedId: "feed:translation", sourceKind: "translated_transcripts", freshnessMs: 10_000 },
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
            evidenceRefs: ["frame:frog-001", "microdeck-run:frog-classifier"],
            receiptRefs: ["receipt:frog-classifier"],
            dispatch: ["narrator bind translated transcript", "wake interrupt"],
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
        ]}
        summary={{
          updateCount: 2,
          observationOnlyCount: 1,
          activeGoalCount: 1,
          narratorSpeechCount: 0,
          narratorBindingCount: 1,
          wakeCount: 1,
          packetTraceCount: 2,
          sourceHealthCount: 2,
          feedQueryCount: 5,
          routeWatchCount: 1,
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
    expect(screen.getAllByTestId("live-answer-goal-context-refs")[0]).toHaveTextContent("evidence=frame:frog-001, microdeck-run:frog-classifier");
    expect(screen.getAllByTestId("live-answer-goal-context-refs")[0]).toHaveTextContent("receipts=receipt:frog-classifier");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness")[0]).toHaveTextContent("freshness=fresh observed=1781736210000 staleAfter=30000ms");
    expect(screen.getAllByTestId("live-answer-goal-context-freshness")[1]).toHaveTextContent("freshness=blocked observed=1781736211000 staleAfter=unbounded");
    expect(screen.getAllByTestId("live-answer-packet-color-key")[0]).toHaveTextContent("packet-color=stage_play_processed_mail_packet:frog-001");
    expect(screen.getAllByTestId("live-answer-packet-color-key")[1]).toHaveTextContent("packet-color=live-answer-projection:bad-terminal");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("assistant=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("terminal=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("raw=false");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[0]).toHaveTextContent("postToolStep=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("assistant=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("terminal=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("raw=true");
    expect(screen.getAllByTestId("live-answer-goal-context-authority-chips")[1]).toHaveTextContent("postToolStep=false");
    expect(screen.getAllByTestId("live-answer-goal-context-dispatch").map((node) => node.textContent)).toEqual([
      "narrator bind translated transcript",
      "wake interrupt",
      "update live answer",
    ]);
    expect(screen.getByTestId("live-answer-narrator-binding-count")).toHaveTextContent("1 narrator bindings");
    expect(screen.getByTestId("live-answer-packet-trace-count")).toHaveTextContent("2 packet traces");
    expect(screen.getByTestId("live-answer-source-health-count")).toHaveTextContent("2 source health");
    expect(screen.getByTestId("live-answer-feed-query-count")).toHaveTextContent("5 feed queries");
    expect(screen.getByTestId("live-answer-route-watch-count")).toHaveTextContent("1 route watch");
    expect(screen.getByTestId("live-answer-trace-memory-count")).toHaveTextContent("2 trace memory");
    expect(screen.getByTestId("live-answer-observation-authority-count")).toHaveTextContent("1 observation-only");
    expect(screen.getByTestId("live-answer-terminal-authority-count")).toHaveTextContent("1 terminal authority");
    expect(screen.getByTestId("live-answer-terminal-authority-posture")).toHaveTextContent("terminal authority required");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("route_watch=1");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("packet_traces=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("source_health=2");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("feed_queries=5");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("trace_memory=2");
    expect(screen.getByTestId("live-answer-agent-goal-session")).toHaveTextContent("active / 4 feeds");
    expect(screen.getByTestId("live-answer-agent-goal-policy")).toHaveTextContent("Monitor visual and translated audio feeds.");
    expect(screen.getByTestId("live-answer-agent-goal-final-authority")).toHaveTextContent("finalAuthority=true");
    expect(screen.getByTestId("live-answer-agent-goal-cadence")).toHaveTextContent("cadence=user turn");
    expect(screen.getByTestId("live-answer-agent-goal-feeds")).toHaveTextContent("feeds=visual summaries, packet traces, source health, translated transcripts");
    expect(screen.getByTestId("live-answer-agent-goal-actuators")).toHaveTextContent("actuators=query visual summaries, query packet traces, query source health, query translation segments, narrator bind stream");
    expect(screen.getByTestId("live-answer-agent-goal-stop")).toHaveTextContent("stop=operator stops monitoring");
    expect(screen.getByTestId("live-answer-agent-goal-checkpoint")).toHaveTextContent("checkpoint=Narrator stream is bound to translated transcript evidence.");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent(
      "Receipts, MicroDeck outputs, narrator bindings, and panel projections stay evidence until the completed solver path selects a terminal answer.",
    );
  });
});
