import { describe, expect, it } from "vitest";

import { buildHelixDebugExportEnvelopeFromMasterPayload } from "@/lib/agi/debugExport";

describe("helix ask pill E68 debug export envelope", () => {
  it("projects the active completed turn into a canonical debug export", () => {
    const payload = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "turn-b",
        question: "Open Scientific Calculator",
        content: "Opening panel: Scientific Calculator.",
        mode: "read",
        debug: {},
      } as any,
      {
        selectedDebugFinalAnswer: "Opening panel: Scientific Calculator.",
        debug: {
          turn_id: "turn-b",
          selected_final_answer: "Opening panel: Scientific Calculator.",
          terminal_artifact_kind: "workspace_action_receipt",
          canonical_goal_frame: { goal_kind: "panel_control" },
          solver_controller_decision: {
            decision: "allow_terminal",
            blocking_reasons: [],
            final_route: "panel_control",
            required_terminal_kind: "workspace_action_receipt",
            selected_terminal_artifact_kind: "workspace_action_receipt",
          },
          poison_audit: { ok: true },
          route_authority_audit: { route_authority_ok: true },
          turn_id_integrity_audit: { ok: true },
          final_route_reconciliation: { ok: true },
        },
        agentLoop: {
          selected_final_answer: "Opening panel: Scientific Calculator.",
          final_answer_source: "artifact_synthesis",
          terminal_artifact_kind: "workspace_action_receipt",
          current_turn_artifact_ledger: [
            {
              artifact_id: "turn-b:panel_control:workspace_action_receipt",
              kind: "workspace_action_receipt",
              payload: {
                action_key: "scientific-calculator.open",
                target_id: "scientific-calculator",
                action_id: "open",
                status: "dispatched",
                message: "Opening panel: Scientific Calculator.",
                workspace_action_registry_audit: { verdict: "clean" },
                workspace_action_anti_determinism_audit: { verdict: "clean" },
                workspace_action_lifecycle_events: [
                  { event: "workspace_action/started" },
                  { event: "workspace_action/dispatched" },
                  { event: "workspace_action/completed" },
                ],
              },
            },
          ],
        },
      },
    );
    const parsed = JSON.parse(payload);

    expect(parsed.schema).toBe("helix.ask.debug_export.v1");
    expect(parsed.active_turn_id).toBe("turn-b");
    expect(parsed.active_prompt).toBe("Open Scientific Calculator");
    expect(parsed.selected_final_answer).toBe("Opening panel: Scientific Calculator.");
    expect(parsed.resolved_turn_summary.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(parsed.solver_controller_summary).toMatchObject({
      decision: "allow_terminal",
      final_route: "panel_control",
      required_terminal_kind: "workspace_action_receipt",
      selected_terminal_artifact_kind: "workspace_action_receipt",
      poison_ok: true,
      route_authority_ok: true,
      turn_id_integrity_ok: true,
      final_route_reconciliation_ok: true,
    });
    expect(parsed.workspace_action_debug.workspace_action_receipt.target_id).toBe("scientific-calculator");
    expect(parsed.workspace_action_debug.workspace_action_debug_proof.final_answer_receipt_backed).toBe(true);
    expect(parsed.payload_hash).toEqual(expect.any(String));
  });

  it("preserves durable live interpretation debug attachments", () => {
    const payload = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "client-turn-live",
        question: "Check live interpretation state",
        content: "Live interpretation state is attached.",
        mode: "read",
        debug: {},
      } as any,
      {
        selectedDebugFinalAnswer: "Live interpretation state is attached.",
        debug: {
          turn_id: "turn-live",
          selected_final_answer: "Live interpretation state is attached.",
          terminal_artifact_kind: "live_environment_binding_diagnosis",
          canonical_goal_frame: { goal_kind: "live_environment_binding_diagnosis" },
        },
        live_interpretation_debug: {
          schema: "helix.live_interpretation_debug.v1",
          interpretation_run_id: "live_interpretation_run:test",
          counts: { workers: 9 },
        },
        live_interpretation_run: {
          interpretation_run_id: "live_interpretation_run:test",
          first_scene_epoch_id: "observation:first",
          current_scene_epoch_id: "observation:latest",
        },
        live_interpretation_workers: [{ kind: "scene_neutral" }, { kind: "verifier" }],
        live_interpretation_worker_runs: [{ worker_kind: "verifier", status: "succeeded" }],
        live_interpretation_validation_artifacts: [{ artifact_type: "contradiction" }],
        live_interpretation_hypotheses: [{ hypothesis_id: "hypothesis:1", status: "active" }],
        live_interpretation_graph: {
          graph_id: "live_interpretation_graph:test",
          edges: [{ relation: "seeded_by" }],
        },
        agentLoop: {
          selected_final_answer: "Live interpretation state is attached.",
          final_answer_source: "live_environment_binding_diagnosis",
          terminal_artifact_kind: "live_environment_binding_diagnosis",
          terminal_answer_authority: {
            turn_id: "ask:backend-live",
            server_authoritative: true,
          },
        },
        live_interpretation_epoch_delta: {
          schema: "helix.live_interpretation_epoch_delta.v1",
          delta_id: "live_interpretation_epoch_delta:test",
          interpretation_run_id: "live_interpretation_run:test",
          previous_scene_epoch_id: "observation:first",
          current_scene_epoch_id: "observation:latest",
          reinforced_hypothesis_ids: ["hypothesis:1"],
          contradicted_hypothesis_ids: [],
          superseded_hypothesis_ids: [],
          expired_hypothesis_ids: [],
          newly_created_hypothesis_ids: ["hypothesis:2"],
        },
      },
    );
    const parsed = JSON.parse(payload);

    expect(parsed.active_turn_id).toBe("ask:backend-live");
    expect(parsed.backend_turn_id).toBe("ask:backend-live");
    expect(parsed.client_active_turn_id).toBe("client-turn-live");
    expect(parsed.resolved_turn_summary.turn_id).toBe("ask:backend-live");
    expect(parsed.live_interpretation_debug.counts.workers).toBe(9);
    expect(parsed.live_interpretation_run.interpretation_run_id).toBe("live_interpretation_run:test");
    expect(parsed.live_interpretation_workers.map((worker: any) => worker.kind)).toEqual(["scene_neutral", "verifier"]);
    expect(parsed.live_interpretation_worker_runs[0].worker_kind).toBe("verifier");
    expect(parsed.live_interpretation_validation_artifacts[0].artifact_type).toBe("contradiction");
    expect(parsed.live_interpretation_hypotheses[0].status).toBe("active");
    expect(parsed.live_interpretation_graph.edges[0].relation).toBe("seeded_by");
    expect(parsed.live_interpretation_epoch_delta).toEqual(
      expect.objectContaining({
        interpretation_run_id: "live_interpretation_run:test",
        previous_scene_epoch_id: "observation:first",
        current_scene_epoch_id: "observation:latest",
      }),
    );
  });

  it("exports the UI/debug parity harness fields for tool-backed turns", () => {
    const payload = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "ask:phase7",
        question: "Use calculator solve x^2-9=0.",
        content: "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3.",
        mode: "read",
        debug: {},
      } as any,
      {
        selectedDebugFinalAnswer: "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3.",
        debug: {
          turn_id: "ask:phase7",
          selected_final_answer: "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3.",
          terminal_artifact_kind: "workstation_tool_evaluation",
          canonical_goal_frame: { turn_id: "ask:phase7", goal_kind: "calculator_solve" },
        },
        calculator_panel_state: {
          current_compound_run_id: "compound:phase7",
          visible_compound_run_ids: ["compound:phase7"],
          stale_compound_run_visible: false,
        },
        agentLoop: {
          selected_final_answer: "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3.",
          final_answer_source: "final_answer_draft",
          terminal_artifact_kind: "workstation_tool_evaluation",
          terminal_answer_authority: {
            turn_id: "ask:phase7",
            terminal_text_preview: "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3.",
            terminal_artifact_kind: "workstation_tool_evaluation",
            final_answer_source: "final_answer_draft",
          },
          agent_runtime_loop: {
            schema: "helix.agent_runtime_loop.v1",
            iterations: [{ action_key: "scientific-calculator.solve_expression" }],
          },
          goal_satisfaction_evaluation: {
            schema: "helix.goal_satisfaction_evaluation.v1",
            satisfaction: "satisfied",
          },
          current_turn_artifact_ledger: [
            {
              artifact_id: "ask:phase7:planner",
              kind: "calculator_planner_result",
              payload: { schema: "helix.calculator_planner_result.v1", status: "valid" },
            },
            {
              artifact_id: "ask:phase7:repair",
              kind: "calculator_planner_repair_result",
              payload: { schema: "helix.calculator_planner_repair_result.v1", repair_attempted: true },
            },
            {
              artifact_id: "ask:phase7:coverage",
              kind: "calculator_plan_coverage",
              payload: { schema: "helix.calculator_plan_coverage.v1", missing_requirement_ids: [] },
            },
            {
              artifact_id: "ask:phase7:receipt",
              kind: "workspace_action_receipt",
              payload: {
                action_key: "scientific-calculator.solve_expression",
                target_id: "scientific-calculator",
                action_id: "solve_expression",
                status: "completed",
              },
            },
            {
              artifact_id: "ask:phase7:draft",
              kind: "final_answer_draft",
              payload: { schema: "helix.final_answer_draft.v1", text: "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3." },
            },
            {
              artifact_id: "ask:phase7:runtime_intent_packet",
              kind: "runtime_intent_packet",
              payload: {
                schema: "helix.runtime_intent_packet.v1",
                completion_authority: "agent_runtime_loop_and_goal_satisfaction",
              },
            },
          ],
        },
      },
    );
    const parsed = JSON.parse(payload);

    expect(parsed.terminal_answer_authority.terminal_text_preview).toBe(
      "The equation x^2 - 9 = 0 has solutions x = -3 and x = 3.",
    );
    expect(parsed.goal_satisfaction_evaluation.satisfaction).toBe("satisfied");
    expect(parsed.agent_runtime_loop.iterations).toHaveLength(1);
    expect(parsed.calculator_planner_result.status).toBe("valid");
    expect(parsed.calculator_planner_repair_result.repair_attempted).toBe(true);
    expect(parsed.calculator_plan_coverage.missing_requirement_ids).toEqual([]);
    expect(parsed.final_answer_draft.schema).toBe("helix.final_answer_draft.v1");
    expect(parsed.runtime_intent_packet.schema).toBe("helix.runtime_intent_packet.v1");
    expect(parsed.coverage_artifacts.map((artifact: any) => artifact.schema)).toContain("helix.calculator_plan_coverage.v1");
    expect(parsed.ui_debug_parity_harness).toMatchObject({
      schema: "helix.ui_debug_parity_harness.v1",
      ui_answer_equals_selected_final_answer: true,
      ui_answer_equals_terminal_authority_text: true,
      has_terminal_authority: true,
      has_goal_satisfaction: true,
      has_agent_runtime_loop: true,
      has_coverage_artifact: true,
      has_planner_artifact: true,
      has_repair_artifact: true,
      has_receipt_artifact: true,
      has_composer_artifact: true,
      calculator_panel_current_compound_run_id: "compound:phase7",
      calculator_panel_visible_compound_run_ids: ["compound:phase7"],
      calculator_panel_stale_compound_run_visible: false,
      clipboard_debug_copy_required_for_prompt_submission: false,
    });
  });

  it("exports backend selected_final_answer for model-synthesized final drafts instead of concise presentation text", () => {
    const longSelected =
      "Long model-authored synthesis: curvature is encoded by the metric and Riemann tensor, matter enters through stress-energy, and free fall follows geodesics while tidal forces reveal curvature.";
    const payload = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "ask:model-synth",
        question: "Explain spacetime curvature.",
        content: "Short projection.",
      } as any,
      {
        selectedDebugFinalAnswer: longSelected,
        selected_final_answer: longSelected,
        final_answer_source: "final_answer_draft",
        terminal_artifact_kind: "model_synthesized_answer",
        terminal_presentation: {
          concise_text: "Short projection.",
        },
        terminal_answer_authority: {
          turn_id: "ask:model-synth",
          terminal_text_preview: "Short projection.",
          terminal_artifact_kind: "model_synthesized_answer",
          final_answer_source: "final_answer_draft",
        },
        debug: {
          turn_id: "ask:model-synth",
          selected_final_answer: longSelected,
          final_answer_source: "final_answer_draft",
          terminal_artifact_kind: "model_synthesized_answer",
        },
      },
    );
    const parsed = JSON.parse(payload);

    expect(parsed.selected_final_answer).toBe(longSelected);
    expect(parsed.selected_final_answer).not.toBe("Short projection.");
  });
});
