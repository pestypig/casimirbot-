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

const laneVisibleRow: HelixContinuousTurnStreamRow = {
  key: "lane-visible",
  source: "agent_work",
  label: "Lane Visible",
  text: "Lane visible: live_translation.",
  meta: "source model_visible_capability_lane_manifest | lane_visible",
  status: "available",
  tone: "working",
  evidenceRefs: [],
};

const laneBackendRow: HelixContinuousTurnStreamRow = {
  key: "lane-backend",
  source: "agent_work",
  label: "Lane Backend",
  text: "Lane backend selected: live_translation.local_runtime.",
  meta: "source capability_lane_backend_selections | lane_backend_selected",
  status: "selected",
  tone: "checkpoint",
  evidenceRefs: [],
};

const laneObservedRow: HelixContinuousTurnStreamRow = {
  key: "lane-observed",
  source: "agent_work",
  label: "Lane Observation",
  text: "Lane observation produced a translation receipt.",
  meta: "source capability_lane_call_results | lane_observation",
  status: "succeeded",
  tone: "observation",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const laneReenteredRow: HelixContinuousTurnStreamRow = {
  key: "lane-reentered",
  source: "agent_work",
  label: "Lane Re-entry",
  text: "Lane observation re-entered provider reasoning.",
  meta: "source capability_lane_observation_packets | lane_reentered",
  status: "reentered",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
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

const rejectedFinalRow: HelixContinuousTurnStreamRow = {
  key: "final-rejected",
  source: "final",
  label: "Terminal",
  text: "Terminal authority rejected direct lane output.",
  meta: "source capability_lane_call_results | terminal_rejected | terminal_authority_missing",
  status: "rejected",
  tone: "error",
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
    const panel = screen.getByTestId("helix-ask-active-turn-stream");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("requested");
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("requested");
    expect(panel.getAttribute("data-capability-lane-requested-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-visible-does-not-mean-executed")).toBe("true");
    expect(screen.getByText("lane requested")).toBeTruthy();
  });

  it("marks turn stream containers as visible-only when only lane manifest rows are present", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneVisibleRow]}
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
        workLogTestId="turn-stream"
      />,
    );

    const panel = screen.getByTestId("turn-stream");
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("visible_only");
    expect(panel.getAttribute("data-capability-lane-visible-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-requested-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-terminal-selected-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-terminal-rejected-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-visible-does-not-mean-executed")).toBe("true");
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

  it("marks backend-selected lane rows distinctly from requested rows", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneRow, laneBackendRow, finalRow]}
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
    expect(rows[1]?.getAttribute("data-capability-lane-stage")).toBe("backend_selected");
    expect(screen.getByLabelText("Turn stream").getAttribute("data-capability-lane-lifecycle")).toBe("terminal_selected");
    expect(screen.getByLabelText("Turn stream").getAttribute("data-capability-lane-backend-selected-count")).toBe("1");
    expect(screen.getByText("lane requested")).toBeTruthy();
    expect(screen.getByText("lane backend selected")).toBeTruthy();
  });

  it("marks observed and re-entered lane rows before terminal selection", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneRow, laneBackendRow, laneObservedRow, laneReenteredRow]}
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
    const panel = screen.getByLabelText("Turn stream");
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage"))).toEqual([
      "requested",
      "backend_selected",
      "observed",
      "reentered",
    ]);
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("reentered");
    expect(panel.getAttribute("data-capability-lane-requested-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-backend-selected-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-observed-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-reentered-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-terminal-selected-count")).toBe("0");
    expect(screen.getByText("lane observed")).toBeTruthy();
    expect(screen.getByText("lane reentered")).toBeTruthy();
  });

  it("marks terminal rejected lane rows distinctly from terminal selected rows", () => {
    const { container } = render(
      <HelixAskTurnStreamPanel
        rows={[laneRow, rejectedFinalRow]}
        isLatestReply
        stagePlayEventCount={0}
        finalAnswerRawText="I could not complete that turn."
        finalAnswerSourceLabel="capability lane terminal"
        finalAnswerAuthority="terminal_rejected"
        renderFinalAnswer={() => <span>I could not complete that turn.</span>}
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
    const panel = screen.getByLabelText("Turn stream");
    expect(rows[0]?.getAttribute("data-capability-lane-stage")).toBe("requested");
    expect(container.querySelector('[data-capability-lane-stage="terminal_rejected"]')).toBeTruthy();
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("terminal_rejected");
    expect(panel.getAttribute("data-capability-lane-terminal-selected-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-terminal-rejected-count")).toBe("1");
    expect(screen.getByText("lane terminal rejected")).toBeTruthy();
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
    const panel = screen.getByLabelText("Turn stream");
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage"))).toEqual([
      "session",
      "mail_loop",
      "goal_binding",
    ]);
    expect(panel.getAttribute("data-capability-lane-session-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-mail-loop-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-goal-binding-count")).toBe("1");
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
    const panel = screen.getByLabelText("Turn stream");
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage"))).toEqual([
      "goal_dispatch_plan",
      "goal_dispatch_admission",
      "goal_dispatch_readiness",
    ]);
    expect(panel.getAttribute("data-capability-lane-goal-dispatch-plan-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-goal-dispatch-admission-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-goal-dispatch-readiness-count")).toBe("1");
    expect(screen.getByText("lane goal dispatch plan")).toBeTruthy();
    expect(screen.getByText("lane goal dispatch admission")).toBeTruthy();
    expect(screen.getByText("lane goal dispatch readiness")).toBeTruthy();
  });
});
