import { describe, expect, it } from "vitest";

import { buildHelixAskConsoleAssemblyDebugSnapshot } from "@/components/helix/ask-console/HelixAskConsoleDiagnostics";
import { createHelixAskConsoleStreamIngressDebug } from "@/lib/helix/ask-active-turn-stream";

describe("Helix Ask console diagnostics", () => {
  it("builds a recrowned console assembly snapshot with stream counters and row source meta", () => {
    const streamIngress = createHelixAskConsoleStreamIngressDebug({
      turnId: "ask:turn-1",
      traceId: "trace-1",
      startedAtMs: 100,
    });
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-1",
      activeTraceId: "trace-1",
      activeStartedAtMs: 100,
      activeQuestion: "hello",
      totalLiveEventCount: 4,
      retainedLiveEventCount: 3,
      activeLiveEventCount: 3,
      visibleActiveTurnStreamRows: [
        {
          key: "row-1",
          source: "agent_work",
          label: "Model Re-entry",
          text: "Codex is evaluating the observation.",
          meta: "source live_provider_transcript | reasoning | model_reentry",
          status: "running",
          tone: "working",
          evidenceRefs: [],
        },
        {
          key: "lane-visible",
          source: "agent_work",
          label: "Lane Visible",
          text: "Lane visible: live_translation.",
          meta: "source model_visible_capability_lane_manifest | lane_visible",
          status: "available",
          tone: "working",
          evidenceRefs: [],
        },
        {
          key: "lane-requested",
          source: "agent_work",
          label: "Lane Request",
          text: "Lane requested: live_translation.translate_text.",
          meta: "source capability_lane_call_results | lane_requested",
          status: "requested",
          tone: "checkpoint",
          evidenceRefs: [],
        },
        {
          key: "lane-observed",
          source: "agent_work",
          label: "Lane Observation",
          text: "Lane observation produced a translation receipt.",
          meta: "source capability_lane_call_results | lane_observation",
          status: "succeeded",
          tone: "observation",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-reentered",
          source: "agent_work",
          label: "Lane Re-entry",
          text: "Observation packet re-entered provider context.",
          meta: "source capability_lane_observation_packets | lane_reentered",
          status: "reentered",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-session",
          source: "agent_work",
          label: "Lane Session",
          text: "Lane session: live_translation.",
          meta: "source capability_lane_session_debug_summaries | lane_session",
          status: "running",
          tone: "working",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-mail",
          source: "agent_work",
          label: "Lane Mail",
          text: "Lane mail loop: live_translation.",
          meta: "source capability_lane_mail_loop_debug_summaries | lane_mail_loop",
          status: "healthy",
          tone: "observation",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-binding",
          source: "agent_work",
          label: "Goal Lane",
          text: "Goal lane binding: live_translation.",
          meta: "source capability_lane_goal_binding_debug_summaries | lane_goal_binding",
          status: "bound",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-dispatch-plan",
          source: "agent_work",
          label: "Goal Dispatch",
          text: "Goal dispatch plan: live_translation; target ask_wake; target es.",
          meta: "source capability_lane_goal_dispatch_plans | lane_goal_dispatch_plan",
          status: "pending",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-dispatch-admission",
          source: "agent_work",
          label: "Goal Admission",
          text: "Goal dispatch admission: live_translation; target ask_wake; target es.",
          meta: "source capability_lane_goal_dispatch_admissions | lane_goal_dispatch_admission",
          status: "pending",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-dispatch-readiness",
          source: "agent_work",
          label: "Goal Readiness",
          text: "Goal dispatch readiness: plans 1; target languages es.",
          meta: "source capability_lane_goal_dispatch_readiness | lane_goal_dispatch_readiness",
          status: "pending",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "terminal-selected",
          source: "final",
          label: "Terminal",
          text: "Terminal answer selected after capability lane re-entry.",
          meta: "source capability_lane_call_results | terminal_selected",
          status: "final",
          tone: "final",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
      ],
      replies: [
        {
          id: "reply-1",
          canonicalKey: "ask:turn-0",
          createdAtMs: 50,
        },
      ],
      latestReplyId: "reply-1",
      streamIngress,
      activeStreamDom: { rowCount: 1 },
    });

    expect(snapshot).toMatchObject({
      schema: "helix.ask.console_assembly_debug.v1",
      askBusy: true,
      activeTurnId: "ask:turn-1",
      activeLiveEventCount: 3,
      activeRowCount: 12,
      filteredLiveEvents: 1,
      streamIngress,
      renderOrder: [
        {
          kind: "active_turn_stream",
          key: "ask:turn-1",
          rowCount: 12,
          renderPlacement: "inline_active_turn",
        },
        {
          kind: "completed_reply",
          replyId: "reply-1",
          canonicalKey: "ask:turn-0",
          isLatest: true,
        },
      ],
      capabilityLaneSummary: {
        visibleCount: 1,
        requestedCount: 1,
        backendSelectedCount: 0,
        observedCount: 1,
        reenteredCount: 1,
        sessionCount: 1,
        mailLoopCount: 1,
        goalBindingCount: 1,
        goalDispatchPlanCount: 1,
        goalDispatchAdmissionCount: 1,
        goalDispatchReadinessCount: 1,
        terminalSelectedCount: 1,
        visibleLaneDoesNotMeanExecuted: true,
      },
      capabilityLaneRows: [
        {
          key: "lane-visible",
          stage: "visible",
          label: "Lane Visible",
          status: "available",
        },
        {
          key: "lane-requested",
          stage: "requested",
          label: "Lane Request",
          status: "requested",
        },
        {
          key: "lane-observed",
          stage: "observed",
          label: "Lane Observation",
          status: "succeeded",
        },
        {
          key: "lane-reentered",
          stage: "reentered",
          label: "Lane Re-entry",
          status: "reentered",
        },
        {
          key: "lane-session",
          stage: "session",
          label: "Lane Session",
          status: "running",
        },
        {
          key: "lane-mail",
          stage: "mail_loop",
          label: "Lane Mail",
          status: "healthy",
        },
        {
          key: "lane-goal-binding",
          stage: "goal_binding",
          label: "Goal Lane",
          status: "bound",
        },
        {
          key: "lane-goal-dispatch-plan",
          stage: "goal_dispatch_plan",
          label: "Goal Dispatch",
          status: "pending",
        },
        {
          key: "lane-goal-dispatch-admission",
          stage: "goal_dispatch_admission",
          label: "Goal Admission",
          status: "pending",
        },
        {
          key: "lane-goal-dispatch-readiness",
          stage: "goal_dispatch_readiness",
          label: "Goal Readiness",
          status: "pending",
        },
        {
          key: "terminal-selected",
          stage: "terminal_selected",
          label: "Terminal",
          status: "final",
        },
      ],
    });
    expect(snapshot.activeRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "row-1",
        source: "agent_work",
        label: "Model Re-entry",
        status: "running",
        meta: "source live_provider_transcript | reasoning | model_reentry",
      }),
    ]));
  });

  it("keeps inactive diagnostic rows out of active row counts", () => {
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: false,
      activeTurnId: "ask:turn-1",
      activeTraceId: "trace-1",
      activeStartedAtMs: 100,
      activeQuestion: "hello",
      totalLiveEventCount: 4,
      retainedLiveEventCount: 4,
      activeLiveEventCount: 4,
      visibleActiveTurnStreamRows: [
        {
          key: "stale-row",
          source: "agent_work",
          label: "Thinking",
          text: "Stale row",
          meta: "source live_provider_transcript",
          status: "running",
          tone: "working",
          evidenceRefs: [],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug(),
      activeStreamDom: null,
    });

    expect(snapshot.activeLiveEventCount).toBe(0);
    expect(snapshot.activeRowCount).toBe(0);
    expect(snapshot.activeRows).toEqual([]);
    expect(snapshot.capabilityLaneSummary.visibleCount).toBe(0);
    expect(snapshot.capabilityLaneRows).toEqual([]);
  });
});
