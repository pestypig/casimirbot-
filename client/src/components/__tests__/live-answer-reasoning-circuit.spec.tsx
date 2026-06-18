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
    { feedId: "feed:translation", sourceKind: "translated_transcripts", freshnessMs: 10_000 },
  ],
  allowedActuators: ["query_visual_summaries", "query_translation_segments", "narrator_bind_stream"],
  cadence: { kind: "user_turn_only" },
  stopConditions: ["operator stops monitoring"],
  checkpoints: [],
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
            dispatch: ["narrator bind translated transcript", "wake interrupt"],
          },
        ]}
        summary={{
          updateCount: 1,
          observationOnlyCount: 1,
          activeGoalCount: 1,
          narratorSpeechCount: 0,
          narratorBindingCount: 1,
          wakeCount: 1,
          terminalAuthorityRequiredCount: 1,
          terminalPosture: "terminal authority required",
        }}
        sessions={[goalSession]}
      />,
    );

    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent("Reasoning circuit");
    expect(screen.getByTestId("live-answer-goal-context-row")).toHaveTextContent("visual observation");
    expect(screen.getByTestId("live-answer-goal-context-row")).toHaveTextContent("microdeck-output:frog-classifier");
    expect(screen.getByTestId("live-answer-goal-context-refs")).toHaveTextContent("sources=visual:screen-share");
    expect(screen.getByTestId("live-answer-goal-context-refs")).toHaveTextContent("loops=loop:visual-mail");
    expect(screen.getByTestId("live-answer-goal-context-refs")).toHaveTextContent("evidence=frame:frog-001, microdeck-run:frog-classifier");
    expect(screen.getByTestId("live-answer-goal-context-authority-chips")).toHaveTextContent("assistant=false");
    expect(screen.getByTestId("live-answer-goal-context-authority-chips")).toHaveTextContent("terminal=false");
    expect(screen.getByTestId("live-answer-goal-context-authority-chips")).toHaveTextContent("raw=false");
    expect(screen.getAllByTestId("live-answer-goal-context-dispatch").map((node) => node.textContent)).toEqual([
      "narrator bind translated transcript",
      "wake interrupt",
    ]);
    expect(screen.getByTestId("live-answer-narrator-binding-count")).toHaveTextContent("1 narrator bindings");
    expect(screen.getByTestId("live-answer-observation-authority-count")).toHaveTextContent("1 observation-only");
    expect(screen.getByTestId("live-answer-terminal-authority-count")).toHaveTextContent("1 terminal authority");
    expect(screen.getByTestId("live-answer-terminal-authority-posture")).toHaveTextContent("terminal authority required");
    expect(screen.getByTestId("live-answer-agent-goal-session")).toHaveTextContent("active / 2 feeds");
    expect(screen.getByTestId("live-answer-reasoning-circuit")).toHaveTextContent(
      "Receipts, MicroDeck outputs, narrator bindings, and panel projections stay evidence until the completed solver path selects a terminal answer.",
    );
  });
});
