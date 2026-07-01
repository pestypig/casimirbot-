import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { createHelixCapabilityLaneGoalBindingStore } from "../goal-binding";
import {
  buildHelixCapabilityLaneGoalBindingDebugSummaries,
  buildHelixCapabilityLaneGoalBindingDebugSummary,
} from "../goal-binding-summary";
import { createHelixCapabilityLaneSessionStore } from "../session-manager";

const buildProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

const backendDecision = {
  schema: "helix.capability_lane.backend_selection_decision.v1" as const,
  owner: "helix" as const,
  outcome: "fallback_selected" as const,
  reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
  requested_backend_provider: "google_gemini",
  requested_backend_provider_known: true,
  selected_backend_provider: "live_translation.local_runtime",
  fallback_backend_provider: "live_translation.local_runtime",
  selected_runtime_provider_remains_root: true as const,
  backend_provider_becomes_root_agent: false as const,
  dynamic_switching_executed: false as const,
  live_backend_execution_enabled: false as const,
  terminal_authority_owner: "helix" as const,
  terminal_eligible: false as const,
  assistant_answer: false as const,
  raw_content_included: false as const,
};

const buildReportedBinding = () => {
  const sessionStore = createHelixCapabilityLaneSessionStore();
  sessionStore.start({
    provider: buildProvider("codex"),
    laneId: "live_translation",
    laneSessionId: "lane-session-summary",
    sourceBinding: {
      source_id: "docs:summary",
      source_kind: "docs",
      projection_target: "docs_chunk",
      account_locale: "es-US",
    },
    requestedBackendProvider: "google_gemini",
    env: {} as NodeJS.ProcessEnv,
    nowMs: 100,
  });
  const store = createHelixCapabilityLaneGoalBindingStore({ sessionStore });
  store.bind({
    goalId: "goal:translate-summary",
    laneSessionId: "lane-session-summary",
    goalBindingId: "goal-binding-summary",
    activationPolicy: "while_goal_active",
    attentionPolicy: "quiet_until_salient",
    stopCondition: "goal_complete",
    reportPolicy: "terminal_authorized_summary",
    quietBehavior: "record_only",
    nowMs: 110,
  });
  sessionStore.recordObservation({
    laneSessionId: "lane-session-summary",
    observationRef: "ask:lane:translation:summary-obs",
    nowMs: 120,
  });
  store.recordMailLoopEvidence({
    goalBindingId: "goal-binding-summary",
    nowMs: 125,
    mailLoopSummary: {
      schema: "helix.capability_lane.mail_loop_debug_summary.v1",
      lane_session_id: "lane-session-summary",
      lane_id: "live_translation",
      capability: "live_translation.translate_text",
      observation_ref: "ask:lane:translation:summary-obs",
      stage_play_mail_id: "stage-play-mail-summary",
      stage_play_wake_expected: true,
      mailbox_thread_id: "ask-thread-summary",
      source_id: "docs:summary",
      source_kind: "document_markdown",
      chunk_id: "chunk-summary",
      projection_target: "docs_chunk",
      selected_backend_provider: "live_translation.local_runtime",
      requested_backend_provider: "google_gemini",
      backend_selection_decision: backendDecision,
      freshness_status: "fresh",
      blocked_reason: null,
      mail_status: "unread",
      evidence_refs: ["lane-session-summary", "stage-play-mail-summary"],
      reentry_required: true,
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
  });
  const reported = store.recordReportRequest({
    goalBindingId: "goal-binding-summary",
    reportRef: "ask:terminal:summary-report",
    terminalAuthorized: true,
    nowMs: 130,
  });

  if (!reported.goal_binding) {
    throw new Error("expected reported goal binding");
  }

  return reported.goal_binding;
};

describe("capability lane goal binding debug summary", () => {
  it("projects a goal-bound lane session without promoting backend or lane output to answer authority", () => {
    const binding = buildReportedBinding();
    const summary = buildHelixCapabilityLaneGoalBindingDebugSummary(binding);

    expect(summary).toMatchObject({
      schema: "helix.capability_lane.goal_binding_debug_summary.v1",
      goal_binding_id: "goal-binding-summary",
      goal_id: "goal:translate-summary",
      lane_session_id: "lane-session-summary",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        requested_backend_provider: "google_gemini",
        selected_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
      }),
      session_status: "running",
      session_health: "healthy",
      source_id: "docs:summary",
      last_observation_ref: "ask:lane:translation:summary-obs",
      latest_mail_loop_summary: {
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        stage_play_mail_id: "stage-play-mail-summary",
        observation_ref: "ask:lane:translation:summary-obs",
        backend_selection_decision: expect.objectContaining({
          outcome: "fallback_selected",
          selected_backend_provider: "live_translation.local_runtime",
        }),
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      mail_loop_refs: ["stage-play-mail-summary"],
      report_decision: {
        schema: "helix.capability_lane.goal_report_decision.v1",
        action: "record_only",
        reason: "goal_lane_evidence_recorded_for_debug_only",
        wake_expected: false,
        surface_badge_expected: false,
        terminal_report_requested: false,
        terminal_report_authorized: true,
        terminal_report_requires_authority: true,
        terminal_authority_status: "pending_helix_terminal_authority",
        evidence_ref: "ask:lane:translation:summary-obs",
        mail_loop_ref: "stage-play-mail-summary",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      dispatch_plan: {
        schema: "helix.capability_lane.goal_dispatch_plan.v1",
        target: "none",
        status: "planned_not_dispatched",
        reason: "goal_binding_policy_records_without_dispatch",
        source_report_action: "record_only",
        goal_binding_id: "goal-binding-summary",
        goal_id: "goal:translate-summary",
        lane_session_id: "lane-session-summary",
        lane_id: "live_translation",
        evidence_ref: "ask:lane:translation:summary-obs",
        mail_loop_ref: "stage-play-mail-summary",
        requires_live_mail_loop: false,
        requires_terminal_authority: false,
        side_effects_executed: false,
        wake_dispatched: false,
        badge_projected: false,
        terminal_report_emitted: false,
        terminal_authority_status: "pending_helix_terminal_authority",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      dispatch_admission: {
        schema: "helix.capability_lane.goal_dispatch_admission.v1",
        status: "admitted_debug_only",
        reason: "goal_dispatch_admission_admitted_debug_only",
        target: "none",
        goal_binding_id: "goal-binding-summary",
        goal_id: "goal:translate-summary",
        lane_session_id: "lane-session-summary",
        lane_id: "live_translation",
        evidence_ref: "ask:lane:translation:summary-obs",
        mail_loop_ref: "stage-play-mail-summary",
        blocked_reason: null,
        requires_live_mail_loop: false,
        requires_terminal_authority: false,
        side_effects_allowed: false,
        side_effects_executed: false,
        wake_dispatch_allowed: false,
        badge_projection_allowed: false,
        terminal_report_allowed: false,
        terminal_authority_status: "pending_helix_terminal_authority",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      activation_policy: "while_goal_active",
      attention_policy: "quiet_until_salient",
      stop_condition: "goal_complete",
      report_policy: "terminal_authorized_summary",
      quiet_behavior: "record_only",
      binding_status: "bound",
      last_report_ref: "ask:terminal:summary-report",
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(summary.latest_session_event).toMatchObject({
      lane_session_id: "lane-session-summary",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      selected_backend_provider: "live_translation.local_runtime",
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_backend_provider: "live_translation.local_runtime",
      }),
      reason: "lane_session_observation_recorded",
      observation_ref: "ask:lane:translation:summary-obs",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(summary.latest_goal_binding_event).toMatchObject({
      event: "report_requested",
      lane_session_observation_ref: "ask:lane:translation:summary-obs",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("builds array summaries while preserving non-terminal lane invariants", () => {
    const binding = buildReportedBinding();
    const summaries = buildHelixCapabilityLaneGoalBindingDebugSummaries([binding]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      goal_binding_id: "goal-binding-summary",
      lane_session_id: "lane-session-summary",
      latest_mail_loop_summary: expect.objectContaining({
        stage_play_mail_id: "stage-play-mail-summary",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      mail_loop_refs: ["stage-play-mail-summary"],
      report_decision: expect.objectContaining({
        schema: "helix.capability_lane.goal_report_decision.v1",
        action: "record_only",
        terminal_report_requires_authority: true,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      dispatch_plan: expect.objectContaining({
        schema: "helix.capability_lane.goal_dispatch_plan.v1",
        target: "none",
        status: "planned_not_dispatched",
        side_effects_executed: false,
        wake_dispatched: false,
        badge_projected: false,
        terminal_report_emitted: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      dispatch_admission: expect.objectContaining({
        schema: "helix.capability_lane.goal_dispatch_admission.v1",
        status: "admitted_debug_only",
        target: "none",
        side_effects_allowed: false,
        wake_dispatch_allowed: false,
        badge_projection_allowed: false,
        terminal_report_allowed: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      terminal_authority_status: "pending_helix_terminal_authority",
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("computes report decisions for badge, wake, review, and terminal-authority policies", () => {
    const sessionStore = createHelixCapabilityLaneSessionStore();
    sessionStore.start({
      provider: buildProvider("helix"),
      laneId: "live_translation",
      laneSessionId: "lane-session-policy",
      sourceBinding: {
        source_id: "docs:policy",
        source_kind: "docs",
        projection_target: "docs_chunk",
      },
      env: {} as NodeJS.ProcessEnv,
      nowMs: 100,
    });
    sessionStore.recordObservation({
      laneSessionId: "lane-session-policy",
      observationRef: "ask:lane:translation:policy-obs",
      nowMs: 110,
    });
    const store = createHelixCapabilityLaneGoalBindingStore({ sessionStore });
    store.bind({
      goalId: "goal:badge",
      laneSessionId: "lane-session-policy",
      goalBindingId: "goal-binding-badge",
      quietBehavior: "surface_badge",
    });
    store.bind({
      goalId: "goal:wake",
      laneSessionId: "lane-session-policy",
      goalBindingId: "goal-binding-wake",
      reportPolicy: "ask_on_salience",
      quietBehavior: "wake_on_salience",
    });
    store.bind({
      goalId: "goal:review",
      laneSessionId: "lane-session-policy",
      goalBindingId: "goal-binding-review",
      attentionPolicy: "manual_review",
    });
    store.bind({
      goalId: "goal:report",
      laneSessionId: "lane-session-policy",
      goalBindingId: "goal-binding-report",
      attentionPolicy: "report_each_observation",
      reportPolicy: "terminal_authorized_summary",
    });

    const summaries = buildHelixCapabilityLaneGoalBindingDebugSummaries(store.list());
    const actionByGoal = new Map(summaries.map((summary) => [
      summary.goal_id,
      summary.report_decision,
    ]));

    expect(actionByGoal.get("goal:badge")).toMatchObject({
      action: "surface_badge",
      surface_badge_expected: true,
      terminal_report_requested: false,
      terminal_report_requires_authority: true,
      evidence_ref: "ask:lane:translation:policy-obs",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(actionByGoal.get("goal:wake")).toMatchObject({
      action: "wake_on_salience",
      wake_expected: true,
      terminal_report_requested: false,
      terminal_report_requires_authority: true,
    });
    expect(actionByGoal.get("goal:review")).toMatchObject({
      action: "manual_review",
      reason: "goal_binding_waiting_for_manual_review",
      terminal_report_requested: false,
    });
    expect(actionByGoal.get("goal:report")).toMatchObject({
      action: "request_terminal_authority",
      reason: "goal_binding_policy_requests_terminal_authorized_summary",
      terminal_report_requested: true,
      terminal_report_authorized: false,
      terminal_report_requires_authority: true,
    });
    const dispatchByGoal = new Map(summaries.map((summary) => [
      summary.goal_id,
      summary.dispatch_plan,
    ]));

    expect(dispatchByGoal.get("goal:badge")).toMatchObject({
      target: "ui_badge",
      status: "planned_not_dispatched",
      source_report_action: "surface_badge",
      side_effects_executed: false,
      badge_projected: false,
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(dispatchByGoal.get("goal:wake")).toMatchObject({
      target: "ask_wake",
      source_report_action: "wake_on_salience",
      requires_live_mail_loop: true,
      wake_dispatched: false,
      side_effects_executed: false,
    });
    expect(dispatchByGoal.get("goal:review")).toMatchObject({
      target: "manual_review",
      source_report_action: "manual_review",
      side_effects_executed: false,
    });
    expect(dispatchByGoal.get("goal:report")).toMatchObject({
      target: "terminal_authority_review",
      source_report_action: "request_terminal_authority",
      requires_terminal_authority: true,
      terminal_report_emitted: false,
      side_effects_executed: false,
    });
    const admissionByGoal = new Map(summaries.map((summary) => [
      summary.goal_id,
      summary.dispatch_admission,
    ]));

    expect(admissionByGoal.get("goal:badge")).toMatchObject({
      status: "admitted_projection_only",
      target: "ui_badge",
      blocked_reason: null,
      side_effects_allowed: false,
      badge_projection_allowed: false,
    });
    expect(admissionByGoal.get("goal:wake")).toMatchObject({
      status: "blocked",
      target: "ask_wake",
      blocked_reason: "missing_mail_loop_ref",
      side_effects_allowed: false,
      wake_dispatch_allowed: false,
    });
    expect(admissionByGoal.get("goal:review")).toMatchObject({
      status: "eligible_manual_review",
      target: "manual_review",
      blocked_reason: null,
      side_effects_allowed: false,
    });
    expect(admissionByGoal.get("goal:report")).toMatchObject({
      status: "blocked",
      target: "terminal_authority_review",
      blocked_reason: "terminal_authority_not_pending",
      requires_terminal_authority: true,
      terminal_report_allowed: false,
    });
  });
});
