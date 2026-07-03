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
  meta: "source capability_lane_call_results | live_translation | lane_requested | capability live_translation.translate_text | target es",
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

const laneConsoleStateObservedRow: HelixContinuousTurnStreamRow = {
  key: "lane-console-state-observed",
  source: "agent_work",
  label: "Lane State",
  text: "Lane state: live_translation.translate_text is observed_pending_reentry.",
  meta: "source capability_lane_timeline_summary.console_state_rows | live_translation | capability live_translation.translate_text | backend live_translation.local_runtime | normalized stage observed | state observed_pending_reentry | runtime provider codex | adapter boundary helix_agent_provider_edge | observation ask:lane:translation:obs | receipt ask:lane:translation:receipt | terminal authority pending_helix_terminal_authority",
  status: "completed",
  tone: "observation",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const laneBackendRow: HelixContinuousTurnStreamRow = {
  key: "lane-backend",
  source: "agent_work",
  label: "Lane Backend",
  text: "Lane backend selected: live_translation.local_runtime.",
  meta: "source capability_lane_backend_selections | live_translation | lane_backend_selected | capability live_translation.translate_text | backend live_translation.local_runtime | target es",
  status: "selected",
  tone: "checkpoint",
  evidenceRefs: [],
};

const laneTimelineJsonBackendRow: HelixContinuousTurnStreamRow = {
  key: "lane-backend-json",
  source: "agent_work",
  label: "Timeline",
  text: "Capability lane backend selected.",
  meta: JSON.stringify({
    schema: "helix.capability_lane.provider_timeline_event.v1",
    stage: "lane_backend_selected",
    lane_id: "live_translation",
  }),
  status: "selected",
  tone: "checkpoint",
  evidenceRefs: [],
};

const laneObservedRow: HelixContinuousTurnStreamRow = {
  key: "lane-observed",
  source: "agent_work",
  label: "Lane Observation",
  text: "Lane observation produced a translation receipt.",
  meta: "source capability_lane_call_results | live_translation | lane_observation | runtime provider codex | adapter boundary helix_agent_provider_edge | capability live_translation.translate_text | backend live_translation.local_runtime | observation ask:lane:translation:obs | receipt ask:lane:translation:obs:projection:receipt | source id docs:nhm2 | source hash sha256:doc-a | source kind docs_viewer | source payload hash sha256:source-text-a | source payload chars 2048 | projection key docs:nhm2::sha256:source-text-a::docs_viewer.inline_translation::es-US::chunk-1::ask:lane:translation:obs:projection:receipt | projection target docs_viewer.inline_translation | account locale es-US | target es | chunk chunk-1 | chunk index 2 | dedupe docs:nhm2:chunk-1:es | source event docs:event-1 | source event ms 100 | observed 125 | freshness stale | source binding key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es | observation key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt | cancelled | terminal authority not_terminal_authority",
  status: "succeeded",
  tone: "observation",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const laneReceiptRow: HelixContinuousTurnStreamRow = {
  key: "lane-receipt",
  source: "agent_work",
  label: "Lane Receipt",
  text: "Lane projection receipt recorded for docs UI.",
  meta: "source capability_lane_projection_receipts | live_translation | lane_projection_receipt | capability live_translation.translate_text | projection key docs:nhm2::sha256:source-text-a::docs_viewer.inline_translation::es-US::chunk-1::ask:lane:translation:obs:projection:receipt | projection target docs_viewer.inline_translation | source id docs:nhm2 | source hash sha256:doc-a | source kind docs_viewer | source payload hash sha256:source-text-a | source payload chars 2048 | account locale es-US | language es | chunk chunk-1 | chunk index 2 | dedupe docs:nhm2:chunk-1:es | source event docs:event-1 | source event ms 100 | observed 125 | freshness stale | observation ask:lane:translation:obs | receipt ask:lane:translation:obs:projection:receipt | terminal authority not_terminal_authority",
  status: "recorded",
  tone: "observation",
  evidenceRefs: ["ask:lane:translation:obs:projection:receipt"],
};

const laneReenteredRow: HelixContinuousTurnStreamRow = {
  key: "lane-reentered",
  source: "agent_work",
  label: "Lane Re-entry",
  text: "Lane observation re-entered provider reasoning.",
  meta: "source capability_lane_observation_packets | live_translation | lane_reentered | capability live_translation.translate_text | observation ask:lane:translation:obs | receipt ask:lane:translation:obs:projection:receipt | terminal authority not_terminal_authority",
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
  meta: "source capability_lane_session_debug_summaries | live_translation | lane_session | action record_observation | session status running | session health healthy | session control key lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es | source binding key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es | observation key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt | latest event lane-session-docs:start:150 | has observation false",
  status: "running",
  tone: "working",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const laneMailRow: HelixContinuousTurnStreamRow = {
  key: "lane-mail",
  source: "agent_work",
  label: "Lane Mail",
  text: "Lane mail loop: live_translation.",
  meta: "source capability_lane_mail_loop_debug_summaries | live_translation | lane_mail_loop | observation session lane-session-docs | observation ask:lane:translation:obs | mail observation key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt | stage play mail stage-play-mail-translation | delivery status delivered | previous mail stage-play-mail-previous | mailbox thread helix-ask:desktop | mail status unread | wake kind mailbox_wake | materialized mail evidence true",
  status: "healthy",
  tone: "observation",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalLaneRow: HelixContinuousTurnStreamRow = {
  key: "goal-lane",
  source: "agent_work",
  label: "Goal Lane",
  text: "Goal lane binding: live_translation.",
  meta: "source capability_lane_goal_binding_debug_summaries | live_translation | lane_goal_binding | goal goal:translate-docs | goal binding goal-binding-docs | goal binding key goal:translate-docs::goal-binding-docs::lane-session-docs::live_translation | binding status active | activation policy while_goal_active | attention policy quiet_until_salient | stop condition goal_complete | report policy debug_only | quiet behavior record_only | report action record_only | report reason no_salient_change | lane session lane-session-docs | source binding key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es | observation key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt | mail observation key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt | report summary goal lane is quiet until salience",
  status: "bound",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalDispatchSessionControlKey =
  "lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es";

const goalDispatchPlanRow: HelixContinuousTurnStreamRow = {
  key: "goal-dispatch-plan",
  source: "agent_work",
  label: "Goal Dispatch",
  text: "Goal dispatch plan: live_translation; target ask_wake; target es.",
  meta:
    `source capability_lane_goal_dispatch_plans | live_translation | lane_goal_dispatch_plan | lane session lane-session-docs | session control key ${goalDispatchSessionControlKey}`,
  status: "pending",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalDispatchAdmissionRow: HelixContinuousTurnStreamRow = {
  key: "goal-dispatch-admission",
  source: "agent_work",
  label: "Goal Admission",
  text: "Goal dispatch admission: live_translation; target ask_wake; target es.",
  meta:
    `source capability_lane_goal_dispatch_admissions | live_translation | lane_goal_dispatch_admission | lane session lane-session-docs | blocked reason source_not_fresh | session control key ${goalDispatchSessionControlKey}`,
  status: "pending",
  tone: "checkpoint",
  evidenceRefs: ["ask:lane:translation:obs"],
};

const goalDispatchReadinessRow: HelixContinuousTurnStreamRow = {
  key: "goal-dispatch-readiness",
  source: "agent_work",
  label: "Goal Readiness",
  text: "Goal dispatch readiness: plans 1; next wake kinds mailbox_wake; target languages es.",
  meta:
    `source capability_lane_goal_dispatch_readiness | live_translation | lane_goal_dispatch_readiness | lane session lane-session-docs | session control key ${goalDispatchSessionControlKey} | wake kind mailbox_wake`,
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
    expect(row.getAttribute("data-capability-lane-stage-display")).toBe("requested by runtime");
    expect(row.getAttribute("data-capability-lane-id")).toBe("live_translation");
    expect(row.getAttribute("data-capability-lane-capability-id")).toBe("live_translation.translate_text");
    expect(row.getAttribute("data-capability-lane-target-language")).toBe("es");
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("requested");
    expect(panel.getAttribute("data-capability-lane-requested-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-stage-sequence")).toBe("requested");
    expect(panel.getAttribute("data-capability-lane-visible-does-not-mean-executed")).toBe("true");
    expect(screen.getByTestId("helix-ask-capability-lane-summary").textContent).toBe(
      "Lane timeline: requested 1. Status: requested. Path: requested.",
    );
    expect(screen.getByText("lane requested")).toBeTruthy();
    expect(screen.getByText("requested by runtime")).toBeTruthy();
  });

  it("exposes active stream lane chunk, source, and projection identity", () => {
    render(
      <HelixAskActiveTurnStreamPanel
        rows={[laneObservedRow]}
        activeTurnId="ask:turn-lane"
        activeTraceId="trace-lane"
        clipText={(text) => text}
        renderFinalAnswerContent={(text) => <span>{text}</span>}
        readRowClass={() => ""}
        readDotClass={() => ""}
      />,
    );

    const row = screen.getByTestId("helix-ask-active-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("observed");
    expect(row.getAttribute("data-capability-lane-runtime-provider")).toBe("codex");
    expect(row.getAttribute("data-capability-lane-adapter-boundary")).toBe("helix_agent_provider_edge");
    expect(row.getAttribute("data-capability-lane-source-id")).toBe("docs:nhm2");
    expect(row.getAttribute("data-capability-lane-source-hash")).toBe("sha256:doc-a");
    expect(row.getAttribute("data-capability-lane-source-kind")).toBe("docs_viewer");
    expect(row.getAttribute("data-capability-lane-source-text-hash")).toBe("sha256:source-text-a");
    expect(row.getAttribute("data-capability-lane-source-text-char-count")).toBe("2048");
    expect(row.getAttribute("data-capability-lane-projection-key")).toBe(
      "docs:nhm2::sha256:source-text-a::docs_viewer.inline_translation::es-US::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(row.getAttribute("data-capability-lane-projection-target")).toBe(
      "docs_viewer.inline_translation",
    );
    expect(row.getAttribute("data-capability-lane-account-locale")).toBe("es-US");
    expect(row.getAttribute("data-capability-lane-target-language")).toBe("es");
    expect(row.getAttribute("data-capability-lane-chunk-id")).toBe("chunk-1");
    expect(row.getAttribute("data-capability-lane-chunk-index")).toBe("2");
    expect(row.getAttribute("data-capability-lane-dedupe-key")).toBe("docs:nhm2:chunk-1:es");
    expect(row.getAttribute("data-capability-lane-source-event-id")).toBe("docs:event-1");
    expect(row.getAttribute("data-capability-lane-freshness-status")).toBe("stale");
    expect(row.getAttribute("data-capability-lane-source-binding-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(row.getAttribute("data-capability-lane-latest-observation-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Provider codex | Adapter helix_agent_provider_edge | Lane live_translation | Capability live_translation.translate_text | Backend live_translation.local_runtime",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Observation ask:lane:translation:obs | Receipt ask:lane:translation:obs:projection:receipt",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Authority not_terminal_authority",
    );
  });

  it("exposes active stream materialized mail evidence on lane mail rows", () => {
    render(
      <HelixAskActiveTurnStreamPanel
        rows={[laneMailRow]}
        activeTurnId="ask:turn-lane-mail"
        activeTraceId="trace-lane-mail"
        clipText={(text) => text}
        renderFinalAnswerContent={(text) => <span>{text}</span>}
        readRowClass={() => ""}
        readDotClass={() => ""}
      />,
    );

    const row = screen.getByTestId("helix-ask-active-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("mail_loop");
    expect(row.getAttribute("data-capability-lane-observation-session-id")).toBe("lane-session-docs");
    expect(row.getAttribute("data-capability-lane-observation-lane-session-id")).toBe("lane-session-docs");
    expect(row.getAttribute("data-capability-lane-stage-play-mail-id")).toBe("stage-play-mail-translation");
    expect(row.getAttribute("data-capability-lane-stage-play-mail-delivery-status")).toBe("delivered");
    expect(row.getAttribute("data-capability-lane-previous-stage-play-mail-id")).toBe(
      "stage-play-mail-previous",
    );
    expect(row.getAttribute("data-capability-lane-mailbox-thread-id")).toBe("helix-ask:desktop");
    expect(row.getAttribute("data-capability-lane-mail-status")).toBe("unread");
    expect(row.getAttribute("data-capability-lane-wake-kind")).toBe("mailbox_wake");
    expect(row.getAttribute("data-capability-lane-materialized-mail-loop-evidence")).toBe("true");
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Mail stage-play-mail-translation | Delivery delivered | Previous mail stage-play-mail-previous | Mailbox helix-ask:desktop | Mail status unread | Wake mailbox_wake",
    );
  });

  it("exposes active stream goal/session lane identity", () => {
    render(
      <HelixAskActiveTurnStreamPanel
        rows={[goalLaneRow]}
        activeTurnId="ask:turn-lane-goal"
        activeTraceId="trace-lane-goal"
        clipText={(text) => text}
        renderFinalAnswerContent={(text) => <span>{text}</span>}
        readRowClass={() => ""}
        readDotClass={() => ""}
      />,
    );

    const row = screen.getByTestId("helix-ask-active-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("goal_binding");
    expect(row.getAttribute("data-capability-lane-goal-id")).toBe("goal:translate-docs");
    expect(row.getAttribute("data-capability-lane-goal-binding-id")).toBe("goal-binding-docs");
    expect(row.getAttribute("data-capability-lane-goal-binding-status")).toBe("active");
    expect(row.getAttribute("data-capability-lane-goal-activation-policy")).toBe("while_goal_active");
    expect(row.getAttribute("data-capability-lane-goal-attention-policy")).toBe("quiet_until_salient");
    expect(row.getAttribute("data-capability-lane-goal-stop-condition")).toBe("goal_complete");
    expect(row.getAttribute("data-capability-lane-goal-report-policy")).toBe("debug_only");
    expect(row.getAttribute("data-capability-lane-goal-quiet-behavior")).toBe("record_only");
    expect(row.getAttribute("data-capability-lane-goal-report-action")).toBe("record_only");
    expect(row.getAttribute("data-capability-lane-goal-report-reason")).toBe("no_salient_change");
    expect(row.getAttribute("data-capability-lane-session-id")).toBe("lane-session-docs");
    expect(row.getAttribute("data-capability-lane-report-summary")).toBe(
      "goal lane is quiet until salience",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Binding active | Activation while_goal_active | Attention quiet_until_salient | Stop goal_complete | Report policy debug_only | Quiet record_only | Report action record_only | Report reason no_salient_change",
    );
  });

  it("exposes active stream session lifecycle action and stable session keys", () => {
    render(
      <HelixAskActiveTurnStreamPanel
        rows={[laneSessionRow]}
        activeTurnId="ask:turn-lane-session"
        activeTraceId="trace-lane-session"
        clipText={(text) => text}
        renderFinalAnswerContent={(text) => <span>{text}</span>}
        readRowClass={() => ""}
        readDotClass={() => ""}
      />,
    );

    const row = screen.getByTestId("helix-ask-active-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("session");
    expect(row.getAttribute("data-capability-lane-session-status")).toBe("running");
    expect(row.getAttribute("data-capability-lane-session-health")).toBe("healthy");
    expect(row.getAttribute("data-capability-lane-session-lifecycle-action")).toBe(
      "record_observation",
    );
    expect(row.getAttribute("data-capability-lane-session-control-key")).toBe(
      "lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(row.getAttribute("data-capability-lane-source-binding-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(row.getAttribute("data-capability-lane-latest-observation-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Action record_observation | Session control lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Session status running | Session health healthy",
    );
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
    expect(panel.getAttribute("data-capability-lane-executed-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-terminal-selected-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-terminal-rejected-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-stage-sequence")).toBe("visible");
    expect(panel.getAttribute("data-capability-lane-visible-does-not-mean-executed")).toBe("true");
    expect(screen.getByTestId("helix-ask-latest-turn-stream-row").getAttribute("data-capability-lane-stage-display")).toBe(
      "available only",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-summary").textContent).toBe(
      "Lane timeline: visible 1. Status: visible only. Path: visible. Visible lanes are available, not executed.",
    );
    expect(screen.getByText("available only")).toBeTruthy();
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "Visible only, not executed",
    );
  });

  it("renders capability lane console-state rows as first-class lane rows", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneConsoleStateObservedRow]}
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
    const row = screen.getByTestId("helix-ask-latest-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("observed");
    expect(row.getAttribute("data-capability-lane-stage-display")).toBe("observation produced");
    expect(row.getAttribute("data-capability-lane-normalized-stage")).toBe("observed");
    expect(row.getAttribute("data-capability-lane-state-label")).toBe("observed_pending_reentry");
    expect(row.getAttribute("data-capability-lane-runtime-provider")).toBe("codex");
    expect(row.getAttribute("data-capability-lane-backend-provider")).toBe("live_translation.local_runtime");
    expect(row.getAttribute("data-capability-lane-observation-ref")).toBe("ask:lane:translation:obs");
    expect(row.getAttribute("data-capability-lane-receipt-ref")).toBe("ask:lane:translation:receipt");
    expect(row.getAttribute("data-capability-lane-terminal-authority-status")).toBe(
      "pending_helix_terminal_authority",
    );
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("executed");
    expect(panel.getAttribute("data-capability-lane-observed-count")).toBe("1");
    expect(screen.getByTestId("helix-ask-capability-lane-row-detail").textContent).toContain(
      "State observed_pending_reentry | Normalized observed",
    );
  });

  it("renders active capability lane console-state rows with state metadata", () => {
    render(
      <HelixAskActiveTurnStreamPanel
        rows={[laneConsoleStateObservedRow]}
        activeTurnId="turn-lane-console-state"
        clipText={(text) => text}
        renderFinalAnswerContent={(text) => <span>{text}</span>}
        readRowClass={() => ""}
        readDotClass={() => ""}
      />,
    );

    const panel = screen.getByTestId("helix-ask-active-turn-stream");
    const row = screen.getByTestId("helix-ask-active-turn-stream-row");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("observed");
    expect(row.getAttribute("data-capability-lane-normalized-stage")).toBe("observed");
    expect(row.getAttribute("data-capability-lane-state-label")).toBe("observed_pending_reentry");
    expect(row.getAttribute("data-capability-lane-observation-ref")).toBe("ask:lane:translation:obs");
    expect(row.getAttribute("data-capability-lane-terminal-authority-status")).toBe(
      "pending_helix_terminal_authority",
    );
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("executed");
    expect(panel.getAttribute("data-capability-lane-stage-sequence")).toBe("observed");
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
    expect(screen.getByLabelText("Turn stream").getAttribute("data-capability-lane-executed-count")).toBe("1");
    expect(screen.getByLabelText("Turn stream").getAttribute("data-capability-lane-backend-selected-count")).toBe("1");
    expect(screen.getByText("lane requested")).toBeTruthy();
    expect(screen.getByText("lane backend selected")).toBeTruthy();
  });

  it("recognizes capability lane timeline JSON stage rows in the console", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneTimelineJsonBackendRow]}
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

    const row = screen.getByTestId("helix-ask-latest-turn-stream-row");
    const panel = screen.getByLabelText("Turn stream");
    expect(row.getAttribute("data-capability-lane-stage")).toBe("backend_selected");
    expect(row.getAttribute("data-capability-lane-stage-display")).toBe("backend selected");
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("executed");
    expect(panel.getAttribute("data-capability-lane-backend-selected-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-stage-sequence")).toBe("backend");
    expect(screen.getByTestId("helix-ask-capability-lane-summary").textContent).toBe(
      "Lane timeline: executed 1 / backend 1. Status: executed. Path: backend.",
    );
  });

  it("marks observed and re-entered lane rows before terminal selection", () => {
    render(
      <HelixAskTurnStreamPanel
        rows={[laneRow, laneBackendRow, laneObservedRow, laneReceiptRow, laneReenteredRow]}
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
      "receipt",
      "reentered",
    ]);
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage-display"))).toEqual([
      "requested by runtime",
      "backend selected",
      "observation produced",
      "receipt produced",
      "observation re-entered",
    ]);
    expect(rows[1]?.getAttribute("data-capability-lane-backend-provider")).toBe("live_translation.local_runtime");
    expect(rows[2]?.getAttribute("data-capability-lane-observation-ref")).toBe("ask:lane:translation:obs");
    expect(rows[2]?.getAttribute("data-capability-lane-receipt-ref")).toBe(
      "ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-runtime-provider")).toBe("codex");
    expect(rows[2]?.getAttribute("data-capability-lane-adapter-boundary")).toBe("helix_agent_provider_edge");
    expect(rows[2]?.getAttribute("data-capability-lane-source-id")).toBe("docs:nhm2");
    expect(rows[2]?.getAttribute("data-capability-lane-source-hash")).toBe("sha256:doc-a");
    expect(rows[2]?.getAttribute("data-capability-lane-source-kind")).toBe("docs_viewer");
    expect(rows[2]?.getAttribute("data-capability-lane-source-text-hash")).toBe("sha256:source-text-a");
    expect(rows[2]?.getAttribute("data-capability-lane-source-text-char-count")).toBe("2048");
    expect(rows[2]?.getAttribute("data-capability-lane-projection-key")).toBe(
      "docs:nhm2::sha256:source-text-a::docs_viewer.inline_translation::es-US::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-projection-target")).toBe(
      "docs_viewer.inline_translation",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-account-locale")).toBe("es-US");
    expect(rows[2]?.getAttribute("data-capability-lane-target-language")).toBe("es");
    expect(rows[2]?.getAttribute("data-capability-lane-chunk-id")).toBe("chunk-1");
    expect(rows[2]?.getAttribute("data-capability-lane-chunk-index")).toBe("2");
    expect(rows[2]?.getAttribute("data-capability-lane-dedupe-key")).toBe("docs:nhm2:chunk-1:es");
    expect(rows[2]?.getAttribute("data-capability-lane-source-binding-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-latest-observation-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-terminal-authority-status")).toBe(
      "not_terminal_authority",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-source-event-id")).toBe("docs:event-1");
    expect(rows[2]?.getAttribute("data-capability-lane-source-event-ms")).toBe("100");
    expect(rows[2]?.getAttribute("data-capability-lane-observed-at-ms")).toBe("125");
    expect(rows[2]?.getAttribute("data-capability-lane-freshness-status")).toBe("stale");
    expect(rows[2]?.getAttribute("data-capability-lane-cancel-requested")).toBe("true");
    expect(rows[3]?.getAttribute("data-capability-lane-receipt-ref")).toBe(
      "ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[3]?.getAttribute("data-capability-lane-observation-ref")).toBe(
      "ask:lane:translation:obs",
    );
    expect(rows[3]?.getAttribute("data-capability-lane-projection-key")).toBe(
      "docs:nhm2::sha256:source-text-a::docs_viewer.inline_translation::es-US::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[3]?.getAttribute("data-capability-lane-source-text-hash")).toBe(
      "sha256:source-text-a",
    );
    expect(rows[3]?.getAttribute("data-capability-lane-target-language")).toBe("es");
    expect(rows[3]?.getAttribute("data-capability-lane-chunk-id")).toBe("chunk-1");
    expect(rows[3]?.getAttribute("data-capability-lane-source-event-id")).toBe("docs:event-1");
    expect(rows[3]?.getAttribute("data-capability-lane-freshness-status")).toBe("stale");
    expect(rows[3]?.getAttribute("data-capability-lane-terminal-authority-status")).toBe(
      "not_terminal_authority",
    );
    expect(panel.getAttribute("data-capability-lane-lifecycle")).toBe("reentered");
    expect(panel.getAttribute("data-capability-lane-requested-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-executed-count")).toBe("4");
    expect(panel.getAttribute("data-capability-lane-backend-selected-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-observed-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-receipt-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-reentered-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-terminal-selected-count")).toBe("0");
    expect(panel.getAttribute("data-capability-lane-stage-sequence")).toBe(
      "requested > backend > observed > receipt > reentered",
    );
    expect(screen.getByTestId("helix-ask-capability-lane-summary").textContent).toBe(
      "Lane timeline: requested 1 / executed 4 / backend 1 / observed 1 / receipt 1 / re-entered 1. Status: reentered. Path: requested > backend > observed > receipt > reentered.",
    );
    expect(screen.getByText("lane observed")).toBeTruthy();
    expect(screen.getByText("lane receipt")).toBeTruthy();
    expect(screen.getByText("lane reentered")).toBeTruthy();
    expect(screen.getByText("observation produced")).toBeTruthy();
    expect(screen.getByText("receipt produced")).toBeTruthy();
    expect(screen.getByText("observation re-entered")).toBeTruthy();
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
    expect(container.querySelector('[data-capability-lane-stage-display="terminal rejected"]')).toBeTruthy();
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
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage-display"))).toEqual([
      "session active",
      "mail loop active",
      "goal bound",
    ]);
    expect(rows[0]?.getAttribute("data-capability-lane-id")).toBe("live_translation");
    expect(rows[0]?.getAttribute("data-capability-lane-session-status")).toBe("running");
    expect(rows[0]?.getAttribute("data-capability-lane-session-health")).toBe("healthy");
    expect(rows[0]?.getAttribute("data-capability-lane-latest-event-id")).toBe("lane-session-docs:start:150");
    expect(rows[0]?.getAttribute("data-capability-lane-has-observation")).toBe("false");
    expect(rows[0]?.getAttribute("data-capability-lane-source-binding-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(rows[1]?.getAttribute("data-capability-lane-observation-session-id")).toBe("lane-session-docs");
    expect(rows[1]?.getAttribute("data-capability-lane-observation-lane-session-id")).toBe("lane-session-docs");
    expect(rows[1]?.getAttribute("data-capability-lane-observation-ref")).toBe("ask:lane:translation:obs");
    expect(rows[1]?.getAttribute("data-capability-lane-latest-mail-loop-observation-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[1]?.getAttribute("data-capability-lane-stage-play-mail-id")).toBe("stage-play-mail-translation");
    expect(rows[1]?.getAttribute("data-capability-lane-stage-play-mail-delivery-status")).toBe("delivered");
    expect(rows[1]?.getAttribute("data-capability-lane-previous-stage-play-mail-id")).toBe(
      "stage-play-mail-previous",
    );
    expect(rows[1]?.getAttribute("data-capability-lane-mailbox-thread-id")).toBe("helix-ask:desktop");
    expect(rows[1]?.getAttribute("data-capability-lane-mail-status")).toBe("unread");
    expect(rows[1]?.getAttribute("data-capability-lane-wake-kind")).toBe("mailbox_wake");
    expect(rows[1]?.getAttribute("data-capability-lane-materialized-mail-loop-evidence")).toBe("true");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-binding-key")).toBe(
      "goal:translate-docs::goal-binding-docs::lane-session-docs::live_translation",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-goal-id")).toBe("goal:translate-docs");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-binding-id")).toBe("goal-binding-docs");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-binding-status")).toBe("active");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-activation-policy")).toBe("while_goal_active");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-attention-policy")).toBe("quiet_until_salient");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-stop-condition")).toBe("goal_complete");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-report-policy")).toBe("debug_only");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-quiet-behavior")).toBe("record_only");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-report-action")).toBe("record_only");
    expect(rows[2]?.getAttribute("data-capability-lane-goal-report-reason")).toBe("no_salient_change");
    expect(rows[2]?.getAttribute("data-capability-lane-session-id")).toBe("lane-session-docs");
    expect(rows[2]?.getAttribute("data-capability-lane-report-summary")).toBe(
      "goal lane is quiet until salience",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-source-binding-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-latest-observation-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
    expect(rows[2]?.getAttribute("data-capability-lane-latest-mail-loop-observation-key")).toBe(
      "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    );
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
    expect(rows.map((row) => row.getAttribute("data-capability-lane-stage-display"))).toEqual([
      "dispatch planned",
      "dispatch admitted",
      "dispatch readiness",
    ]);
    expect(panel.getAttribute("data-capability-lane-goal-dispatch-plan-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-goal-dispatch-admission-count")).toBe("1");
    expect(panel.getAttribute("data-capability-lane-goal-dispatch-readiness-count")).toBe("1");
    expect(rows[0]?.getAttribute("data-capability-lane-session-control-key")).toBe(goalDispatchSessionControlKey);
    expect(rows[1]?.getAttribute("data-capability-lane-session-control-key")).toBe(goalDispatchSessionControlKey);
    expect(rows[1]?.getAttribute("data-capability-lane-blocked-reason")).toBe("source_not_fresh");
    expect(rows[2]?.getAttribute("data-capability-lane-session-control-key")).toBe(goalDispatchSessionControlKey);
    expect(rows[2]?.getAttribute("data-capability-lane-wake-kind")).toBe("mailbox_wake");
    expect(screen.getByText("lane goal dispatch plan")).toBeTruthy();
    expect(screen.getByText("lane goal dispatch admission")).toBeTruthy();
    expect(screen.getByText("lane goal dispatch readiness")).toBeTruthy();
  });
});
