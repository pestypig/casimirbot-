// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HelixAskActiveTurnStreamPanel } from "@/components/helix/ask-console/HelixAskActiveTurnStreamPanel";
import { HelixAskTurnStreamPanel } from "@/components/helix/ask-console/HelixAskTurnStreamPanel";
import type { HelixContinuousTurnStreamRow } from "@/lib/helix/ask-active-turn-stream";

afterEach(() => {
  cleanup();
});

const laneRow: HelixContinuousTurnStreamRow = {
  key: "lane-requested",
  source: "agent_work",
  label: "Lane Request",
  text: "Lane requested: live_translation.translate_text.",
  meta: "source capability_lane_call_results | lane_requested",
  status: "requested",
  tone: "checkpoint",
  evidenceRefs: [],
};

const finalRow: HelixContinuousTurnStreamRow = {
  key: "final",
  source: "final",
  label: "Terminal",
  text: "Done.",
  meta: "source capability_lane_call_results | terminal_selected",
  status: "final",
  tone: "final",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const laneSessionRow: HelixContinuousTurnStreamRow = {
  key: "lane-session",
  source: "agent_work",
  label: "Lane Session",
  text: "Lane session: live_translation.",
  meta: "source capability_lane_session_debug_summaries | lane_session",
  status: "running",
  tone: "working",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const laneMailRow: HelixContinuousTurnStreamRow = {
  key: "lane-mail",
  source: "agent_work",
  label: "Lane Mail",
  text: "Lane mail loop: live_translation.",
  meta: "source capability_lane_mail_loop_debug_summaries | lane_mail_loop",
  status: "healthy",
  tone: "observation",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalLaneRow: HelixContinuousTurnStreamRow = {
  key: "goal-lane",
  source: "agent_work",
  label: "Goal Lane",
  text: "Goal lane binding: live_translation.",
  meta: "source capability_lane_goal_binding_debug_summaries | lane_goal_binding",
  status: "bound",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalDispatchPlanRow: HelixContinuousTurnStreamRow = {
  key: "goal-dispatch-plan",
  source: "agent_work",
  label: "Goal Dispatch",
  text: "Goal dispatch plan: live_translation; target ask_wake; target es.",
  meta: "source capability_lane_goal_dispatch_plans | lane_goal_dispatch_plan",
  status: "pending",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalDispatchAdmissionRow: HelixContinuousTurnStreamRow = {
  key: "goal-dispatch-admission",
  source: "agent_work",
  label: "Goal Admission",
  text: "Goal dispatch admission: live_translation; target ask_wake; target es.",
  meta: "source capability_lane_goal_dispatch_admissions | lane_goal_dispatch_admission",
  status: "pending",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalDispatchReadinessRow: HelixContinuousTurnStreamRow = {
  key: "goal-dispatch-readiness",
  source: "agent_work",
  label: "Goal Readiness",
  text: "Goal dispatch readiness: plans 1; target languages es.",
  meta: "source capability_lane_goal_dispatch_readiness | lane_goal_dispatch_readiness",
  status: "pending",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const noop = vi.fn();

describe("Helix Ask turn stream lane rendering", () => {
  it("marks active stream capability lane rows with their lane stage", () => {
    render(
      <HelixAskActiveTurnStreamPanel
        rows={[laneRow]}
        activeTurnId="ask:turn-lane"
        activeTraceId="trace-lane"
        clipText={(text) => text}
        renderFinalAnswerContent={(text) => <span>{text}</span>}
        readRowClass={() => ""}
        readDotClass={() => ""}
      />,
    );

    const row = screen.getByTestId("helix-ask-active-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("requested");
    expect(screen.getByText("lane requested")).toBeTruthy();
  });

  it("marks completed stream capability lane rows with their lane stage", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneRow, finalRow]}
        isLatestReply
        stagePlayEventCount={0}
        finalAnswerRawText="Done."
        finalAnswerSourceLabel="capability lane terminal"
        finalAnswerAuthority="terminal"
        renderFinalAnswer={() => <span>Done.</span>}
        clipText={(text) => text}
        readRowClassName={() => ""}
        readDotClassName={() => ""}
        readPillClassName={() => ""}
        onCopyFinal={noop}
        onDebugCopy={noop}
        onReadAloud={noop}
        jobReadyLinks={[]}
        onRunJobReadyLink={noop}
      />,
    );

    const rows = screen.getAllByTestId("helix-ask-latest-turn-stream-row");
    expect(rows[0]?.getAttribute("data-capability-lane-stage")).toBe("requested");
    expect(screen.getByText("lane requested")).toBeTruthy();
  });

  it("marks persistent lane session, mail-loop, and goal-binding rows", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneSessionRow, laneMailRow, goalLaneRow]}
        isLatestReply
        stagePlayEventCount={0}
        finalAnswerRawText=""
        finalAnswerSourceLabel="capability lane terminal"
        finalAnswerAuthority="terminal"
        renderFinalAnswer={() => null}
        clipText={(text) => text}
        readRowClassName={() => ""}
        readDotClassName={() => ""}
        readPillClassName={() => ""}
        onCopyFinal={noop}
        onDebugCopy={noop}
        onReadAloud={noop}
        jobReadyLinks={[]}
        onRunJobReadyLink={noop}
      />,
    );

    const rows = screen.getAllByTestId("helix-ask-latest-turn-stream-row");
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage"))).toEqual([
      "session",
      "mail_loop",
      "goal_binding",
    ]);
    expect(screen.getByText("lane session")).toBeTruthy();
    expect(screen.getByText("lane mail loop")).toBeTruthy();
    expect(screen.getByText("lane goal binding")).toBeTruthy();
  });

  it("marks goal dispatch plan, admission, and readiness rows", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[goalDispatchPlanRow, goalDispatchAdmissionRow, goalDispatchReadinessRow]}
        isLatestReply
        stagePlayEventCount={0}
        finalAnswerRawText=""
        finalAnswerSourceLabel="capability lane terminal"
        finalAnswerAuthority="terminal"
        renderFinalAnswer={() => null}
        clipText={(text) => text}
        readRowClassName={() => ""}
        readDotClassName={() => ""}
        readPillClassName={() => ""}
        onCopyFinal={noop}
        onDebugCopy={noop}
        onReadAloud={noop}
        jobReadyLinks={[]}
        onRunJobReadyLink={noop}
      />,
    );

    const rows = screen.getAllByTestId("helix-ask-latest-turn-stream-row");
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage"))).toEqual([
      "goal_dispatch_plan",
      "goal_dispatch_admission",
      "goal_dispatch_readiness",
    ]);
    expect(screen.getByText("lane goal dispatch plan")).toBeTruthy();
    expect(screen.getByText("lane goal dispatch admission")).toBeTruthy();
    expect(screen.getByText("lane goal dispatch readiness")).toBeTruthy();
  });
});
