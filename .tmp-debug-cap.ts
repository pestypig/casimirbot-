import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan";
const app = express();
app.use(express.json());
app.use("/api/agi", planRouter);
const sessionId = `debug-cap-${Date.now()}`;
const response = await request(app).post("/api/agi/ask/turn").send({
  question: "what can i do with helix ask?",
  mode: "read",
  sessionId,
  workspace_context_snapshot: {
    sessionId,
    activePanel: "docs-viewer",
    activeDocPath: "/docs/a.md",
    hasDocContext: true,
    hasNoteContext: true,
    activeNoteTitle: "note"
  }
});
const b = response.body;
console.log(JSON.stringify({ text:b.text, route:b.route_reason_code, policy:b.dispatch_policy, pending:b.pending_server_request, pending_request:b.pending_request, planner:b.planner_contract, trace:b.execution_trace, step:b.step_results, final:[b.final_answer_contract_family,b.final_answer_contract_pass,b.final_answer_contract_fail_reason], status:b.final_status, terminal:b.turn_runtime?.terminal }, null, 2));
