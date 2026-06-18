import express from "express";
import request from "supertest";

const activePath =
  "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-mission-time-comparison-latest.md";

const createApp = async () => {
  const { planRouter } = await import("../server/routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const workspace = (sessionId: string, hasNoteContext: boolean) => ({
  sessionId,
  activePanel: "docs-viewer",
  activeDocPath: activePath,
  hasDocContext: true,
  hasNoteContext,
  activeNoteTitle: hasNoteContext ? "quick NHM2 test note" : undefined,
  lastCreatedNoteTitle: hasNoteContext ? "quick NHM2 test note" : undefined,
});

const run = async (name: string, question: string, hasNoteContext: boolean) => {
  const sessionId = `probe-${name}-${Date.now()}`;
  const app = await createApp();
  const response = await request(app)
    .post("/api/agi/ask/turn")
    .send({
      question,
      mode: "read",
      sessionId,
      workspace_context_snapshot: workspace(sessionId, hasNoteContext),
      debug: true,
    });
  const body = response.body ?? {};
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify({
    status: response.status,
    answer: body.assistant_answer ?? body.answer ?? body.text,
    response_type: body.response_type,
    final_status: body.final_status,
    route_reason_code: body.route_reason_code,
    dispatch_policy: body.dispatch_policy,
    final_answer_source: body.final_answer_source,
    terminal_artifact_kind: body.terminal_artifact_kind,
    terminal_error_code: body.terminal_error_code,
    canonical_goal_frame: body.canonical_goal_frame,
    note_mutation_canonical_goal_reconciled: body.note_mutation_canonical_goal_reconciled,
    note_mutation_route_reentry_repaired: body.note_mutation_route_reentry_repaired,
    note_location_route_reentry_repaired: body.note_location_route_reentry_repaired,
    note_location_route_reentry_repair_reason: body.note_location_route_reentry_repair_reason,
    pending_server_request: body.pending_server_request,
    stale_pending_server_request: body.stale_pending_server_request,
    general_controller_final_decision: body.general_controller_final_decision,
    general_controller_stop_reason: body.general_controller_stop_reason,
    general_controller_decisions: body.general_controller_decisions,
    turn_runtime: body.turn_runtime && {
      missing_required_artifacts: body.turn_runtime.missing_required_artifacts,
      satisfied_artifacts: body.turn_runtime.satisfied_artifacts,
      general_controller_final_decision: body.turn_runtime.general_controller_final_decision,
    },
    execution_trace: (body.execution_trace ?? []).map((step: any) => ({
      id: step?.id,
      status: step?.status,
      action: step?.action,
      reason: step?.reason,
    })),
    step_results: (body.step_results ?? []).map((step: any) => ({
      step_id: step?.step_id,
      actual_artifacts: step?.actual_artifacts,
      result_artifact_kind: step?.result_artifact?.kind,
      result_artifact_title: step?.result_artifact?.title,
      result_artifact_text_kind: step?.result_artifact?.text_kind,
    })),
    terminal_authority_single_writer: body.terminal_authority_single_writer,
    goal_satisfaction_evaluation: body.goal_satisfaction_evaluation,
    satisfaction_report: body.satisfaction_report,
    terminal_boundary_eligibility: body.terminal_boundary_eligibility,
    terminal_answer_envelope: body.terminal_answer_envelope,
    current_turn_artifact_kinds: (body.current_turn_artifact_ledger ?? []).map((artifact: any) => ({
      id: artifact?.artifact_id,
      kind: artifact?.kind,
      payloadKind: artifact?.payload?.kind,
      title: artifact?.payload?.title,
    })),
    solver_controller_decision: body.solver_controller_decision,
    resolved_turn_summary: body.resolved_turn_summary,
  }, null, 2));
};

const main = async () => {
  process.env.NODE_ENV = "test";
  process.env.HELIX_E11_MODEL_DECISION_LLM = "1";
  process.env.HELIX_E11_MODEL_DECISION_MAX_APPENDED_STEPS = "1";
  process.env.HELIX_E11_MODEL_DECISION_TEST_RESPONSE = JSON.stringify({
    action: "continue",
    summary: "Try to create an extra note for the same located result.",
    next_capability: "workstation-notes.append_to_note",
    next_args: {
      title: "Centerline Alpha Location",
      text: "The centerline alpha location is found in the document summary lines.",
    },
    required_artifacts: ["note_update_receipt"],
  });
  await run("duplicate-note", "put the centerline alpha location into that note", true);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
