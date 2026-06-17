import express from "express";
import request from "supertest";
import { planRouter } from "../server/routes/agi.plan";

const activePath =
  "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-mission-time-comparison-latest.md";

const baseWorkspace = (sessionId: string, hasNoteContext = true) => ({
  sessionId,
  activePanel: "docs-viewer",
  activeDocPath: activePath,
  hasDocContext: true,
  hasNoteContext,
  activeNoteTitle: hasNoteContext ? "quick NHM2 test note" : undefined,
  lastCreatedNoteTitle: hasNoteContext ? "quick NHM2 test note" : undefined,
});

const app = express();
app.use(express.json());
app.use("/api/agi", planRouter);

const run = async (name: string, question: string, workspace = baseWorkspace(`probe-${name}-${Date.now()}`)) => {
  const response = await request(app)
    .post("/api/agi/ask/turn")
    .send({
      question,
      mode: "read",
      sessionId: workspace.sessionId,
      workspace_context_snapshot: workspace,
      debug: true,
    });
  const body = response.body ?? {};
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify({
    status: response.status,
    answer: body.assistant_answer ?? body.answer ?? body.text,
    final_status: body.final_status,
    response_type: body.response_type,
    route_reason_code: body.route_reason_code,
    final_answer_source: body.final_answer_source,
    terminal_artifact_kind: body.terminal_artifact_kind,
    terminal_error_code: body.terminal_error_code,
    final_answer_contract_family: body.final_answer_contract_family,
    final_answer_contract_pass: body.final_answer_contract_pass,
    final_answer_contract_fail_reason: body.final_answer_contract_fail_reason,
    final_answer_contract_repair_attempted: body.final_answer_contract_repair_attempted,
    final_answer_contract_repair_applied: body.final_answer_contract_repair_applied,
    pending_server_request: body.pending_server_request,
    general_controller_final_decision: body.general_controller_final_decision,
    general_controller_decisions: body.general_controller_decisions,
    execution_trace: (body.execution_trace ?? []).map((step: any) => ({
      id: step?.id,
      status: step?.status,
      action: step?.action,
      actual_artifacts: step?.actual_artifacts,
      reason: step?.reason,
    })),
    step_results: (body.step_results ?? []).map((step: any) => ({
      step_id: step?.step_id,
      actual_artifacts: step?.actual_artifacts,
      result_artifact: step?.result_artifact,
    })),
    terminal_authority_single_writer: body.terminal_authority_single_writer,
    terminal_answer_authority: body.terminal_answer_authority,
    terminal_presentation: body.terminal_presentation,
    terminal_consistency_check: body.terminal_consistency_check,
    visible_projection_invariant: body.visible_projection_invariant,
  }, null, 2));
};

const main = async () => {
  process.env.HELIX_E11_MODEL_DECISION_LLM = "0";
  await run("meta", "Is this working ? [[TEST_FORCE_META_TERMINAL]]");
  await run("missing-note", "put the centerline alpha location into that note", baseWorkspace(`probe-missing-note-${Date.now()}`, false));
  await run("locate-note", "find where centerline alpha is mentioned and put it in that note");
  await run("locate-only", "where does this document mention centerline alpha?");
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
  await run("duplicate-note", "put the centerline alpha location into that note");
  process.env.HELIX_E11_MODEL_DECISION_TEST_RESPONSE = JSON.stringify({
    action: "continue",
    summary: "Append the requested document summary to the note.",
    next_capability: "workstation-notes.append_to_note",
    next_args: {
      title: "quick NHM2 test note",
      text: "Summarize the key points from the document.",
    },
    required_artifacts: ["note_update_receipt"],
  });
  await run("summary-note", "okay summarize in this note about the doc");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
