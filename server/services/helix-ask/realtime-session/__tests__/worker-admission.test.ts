import { describe, expect, it } from "vitest";
import type { HelixRealtimeStagePlayGoalBindingV1 } from "@shared/contracts/helix-realtime-stage-play.v1";
import {
  buildRealtimeTranscriptWorkerAdmission,
  resolveRealtimeFinalWorkerAdmission,
  resolveRealtimeTranscriptSourceTargetIntent,
} from "../worker-admission";

const buildAdmission = (
  transcriptText: string,
  suffix: string,
  activeGoalBinding: HelixRealtimeStagePlayGoalBindingV1 | null = null,
) => buildRealtimeTranscriptWorkerAdmission({
  handoffId: `handoff:${suffix}`,
  realtimeSessionId: "realtime:test",
  threadId: "helix-ask:desktop",
  transcriptText,
  sourceBinding: {
    focus_panel_id: "scientific-calculator",
    document_ref: "docs/research/example.md",
  },
  activeGoalBinding,
  selectedRuntimeAgentProvider: "codex",
  evidenceRefs: [`evidence:${suffix}`],
  nowMs: 100,
});

describe("Realtime transcript worker admission", () => {
  it("admits a natural paper lookup through the scholarly read-only worker route", () => {
    const transcriptText = "Okay, can you look for papers about a magnetar?";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:magnetar-papers",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
    });
    const admission = buildAdmission(transcriptText, "magnetar-papers");

    expect(sourceTargetIntent).toMatchObject({
      target_source: "scholarly_research",
      target_kind: "scholarly_research",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      selected_route: "scholarly_research",
      candidate_readonly_capability_ids: ["scholarly-research.lookup_papers"],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        read_only: true,
      },
      spoken_relay_eligible: true,
    });
  });

  it("keeps greeting-only conversation local despite a soft freshness suggestion", () => {
    const admission = buildAdmission("How are you today?", "smalltalk");

    expect(admission).toMatchObject({
      schema: "helix.realtime_worker_admission.v2",
      outcome: "conversation_local",
      dispatch: {
        kind: "none",
        state: "not_required",
        requested: false,
        suppress_parallel_ask_turn: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
    expect(admission.reason_codes).toContain("ask_smalltalk_greeting_only_policy");
  });

  it("retains greeting-only suppression after an incidental successful observation", () => {
    const preliminary = buildAdmission("How are you today?", "smalltalk-final");
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        workstation_gateway_call_results: [{
          capability_id: "internet-search.search_web",
          ok: true,
          observation_packet: { status: "succeeded" },
        }],
      },
      nowMs: 200,
    });

    expect(final).toMatchObject({
      decision_phase: "solver_final",
      outcome: "conversation_local",
      observed_readonly_capability_ids: ["internet-search.search_web"],
      dispatch: {
        kind: "none",
        state: "not_required",
        requested: false,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
    });
    expect(final.reason_codes).toContain("ask_smalltalk_greeting_only_policy_retained");
  });

  it.each([
    {
      name: "active panel",
      prompt: "What panel in the workstation is active?",
      route: "workspace_panel",
      capability: "workstation.active_context",
    },
    {
      name: "docs retrieval",
      prompt: "Search the open document for the boundary conditions.",
      route: "docs_viewer",
      capability: null,
    },
    {
      name: "calculation",
      prompt: "Use the scientific calculator to evaluate 17 * 23.",
      route: "calculator_stream",
      capability: "scientific-calculator.solve_expression",
    },
    {
      name: "reflection",
      prompt: "Reflect on the active moral graph evidence.",
      route: "unknown",
      capability: "moral-graph.reflect_context",
    },
  ])("admits a read-only $name worker turn", ({ prompt, route, capability }) => {
    const admission = buildAdmission(prompt, route);

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      selected_route: route,
      dispatch: {
        kind: "ask_runtime",
        state: "requested",
        requested: true,
        target_runtime_agent_provider: "codex",
        runtime_selection_source: "ask_ui_selected_runtime",
        suppress_parallel_ask_turn: false,
      },
      selected_runtime_agent_provider: "codex",
      worker_turn_dispatched: false,
      spoken_relay_eligible: true,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    if (capability) {
      expect(admission.candidate_readonly_capability_ids).toContain(capability);
    }
  });

  it("keeps a delayed-result clause attached to the affirmative active-panel query", () => {
    const admission = buildAdmission(
      "Use the workstation agent to verify which panel is active, tell me you're checking, then give me the verified result when it returns.",
      "active-panel-delayed-result",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      candidate_readonly_capability_ids: ["workstation.active_context"],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        read_only: true,
      },
      spoken_relay_eligible: true,
    });
  });

  it.each([
    "Use the workstation agent to verify the active panel.",
    "You can use the workstation agent to verify the active panel.",
    "Could you ask the runtime agent to check the current workspace?",
  ])("dispatches an explicit active-context delegation without a wh-question: %s", (prompt) => {
    const admission = buildAdmission(prompt, `active-panel-delegation:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      candidate_readonly_capability_ids: ["workstation.active_context"],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        read_only: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: true,
    });
  });

  it("keeps a bare panel transcript fragment in the local Realtime conversation", () => {
    const admission = buildAdmission("active panel", "active-panel-fragment");

    expect(admission).toMatchObject({
      outcome: "conversation_local",
      selected_route: "workspace_panel",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "none",
        state: "not_required",
        requested: false,
        suppress_parallel_ask_turn: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
    });
    expect(admission.reason_codes).toContain(
      "realtime_workspace_panel_fragment_without_affirmative_request",
    );
    expect(admission.reason_codes).not.toContain("source_target_workspace_panel");
  });

  it.each([
    "The button says \"active panel\".",
    "Earlier we discussed the active panel.",
    "If the active panel changes later, we can inspect it then.",
    "Do not answer which panel is active; explain the phrase.",
    "I am not asking about the current open panels; explain what a panel means in general.",
  ])("does not dispatch contextual panel wording as an Ask turn: %s", (prompt) => {
    const admission = buildAdmission(prompt, `panel-context:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "conversation_local",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "none",
        requested: false,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
    });
  });

  it("binds a transcript to the existing durable runtime goal without transferring authority", () => {
    const admission = buildAdmission(
      "What has the worker found so far?",
      "goal",
      {
        goal_id: "goal:live-proof",
        status: "active",
        runtime_session_ref: "runtime:goal:1",
        runtime_agent_provider: "codex",
        source_refs: ["goal:live-proof"],
        evidence_refs: ["runtime:goal:1"],
        answer_authority: false,
        terminal_eligible: false,
      },
    );

    expect(admission).toMatchObject({
      outcome: "durable_goal_bound",
      selected_runtime_agent_provider: "codex",
      dispatch: {
        kind: "goal_wake",
        state: "requested",
        goal_id: "goal:live-proof",
        runtime_goal_session_ref: "runtime:goal:1",
        suppress_parallel_ask_turn: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: true,
      answer_authority: false,
      terminal_eligible: false,
    });
  });

  it("classifies an admitted mutating capability only as an action candidate", () => {
    const admission = buildAdmission(
      "Run docs-viewer.open_doc for docs/research/example.md.",
      "action",
    );

    expect(admission.outcome).toBe("action_candidate");
    expect(admission.action_candidate_capability_ids).toContain("docs-viewer.open_doc");
    expect(admission).toMatchObject({
      dispatch: {
        kind: "ask_runtime_read_only",
        state: "requested",
        read_only: true,
        workstation_action_execution_allowed: false,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
  });

  it.each([
    "Do not open the docs panel.",
    "The phrase 'run docs-viewer.open_doc' is quoted on screen.",
    "Earlier I ran docs-viewer.open_doc to inspect that document.",
    "Tomorrow, open the docs panel.",
    "If needed later, run docs-viewer.open_doc for docs/research/example.md.",
    "The screen says run docs-viewer.open_doc for docs/research/example.md.",
  ])("does not promote contextual action language into executable authority: %s", (prompt) => {
    const admission = buildAdmission(prompt, `contextual:${prompt.length}`);

    expect(admission.action_candidate_capability_ids).toEqual([]);
    expect(admission.workstation_action_execution_allowed).toBe(false);
    expect(admission.realtime_provider_tool_execution_allowed).toBe(false);
  });

  it("keeps mixed read/action intent non-executable even when an action candidate is retained", () => {
    const admission = buildAdmission(
      "Run docs-viewer.open_doc for docs/research/example.md, then tell me which panel is active.",
      "mixed",
    );

    expect(admission.workstation_action_execution_allowed).toBe(false);
    expect(admission.realtime_provider_tool_execution_allowed).toBe(false);
    expect(admission.answer_authority).toBe(false);
  });

  it("upgrades relay eligibility only from completed read-only observations and records provider selection", () => {
    const preliminary = buildAdmission(
      "Search the open document for the boundary conditions.",
      "final",
    );
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        selected_agent_provider: "codex",
        language_model_policy: { resolved_model: "gpt-5.4" },
        workstation_gateway_call_results: [{
          capability_id: "docs.search",
          ok: true,
          observation_packet: { status: "succeeded" },
        }],
      },
      evidenceRefs: ["gateway-call:docs"],
      nowMs: 200,
    });

    expect(final).toMatchObject({
      decision_phase: "solver_final",
      outcome: "worker_grounded",
      selected_runtime_agent_provider: "codex",
      selected_model: "gpt-5.4",
      observed_readonly_capability_ids: ["docs.search"],
      dispatch: {
        kind: "ask_runtime",
        state: "completed",
        completed: true,
      },
      worker_turn_dispatched: true,
      spoken_relay_eligible: true,
    });
  });
});
