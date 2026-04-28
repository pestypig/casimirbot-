import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan";

const app = express();
app.use(express.json());
app.use("/api/agi", planRouter);

const sessionId = `ui-flow-proxy-${Date.now()}`;
let workspace = {
  activePanel: "docs-viewer",
  activeDocPath: "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-route-time-worldline-2026-04-25.md",
  activeNoteTitle: "mixed loop scratch",
  lastCreatedNoteTitle: "mixed loop scratch",
  hasDocContext: true,
  hasNoteContext: true,
  hasClipboardContext: false,
};
const prompts = [
  "hello, are you awake?",
  "what paper am I viewing?",
  "make a note called scrambled NHM2 compare scratch",
  "open a doc about light crossing speed",
  "what is this doc about?",
  "where does this document mention light crossing?",
  "put that light crossing location into scrambled NHM2 compare scratch",
  "compare this document with scrambled NHM2 compare scratch and tell me the main differences",
];

function answerText(body: any): string {
  return String(body?.assistant_answer ?? body?.answer ?? body?.text ?? "");
}
function actions(body: any): string[] {
  return (body?.execution_trace ?? [])
    .map((step: any) => step?.action)
    .filter(Boolean)
    .map((action: any) => `${action.panel_id}.${action.action_id}`);
}
function updateWorkspace(body: any) {
  const trace = body?.execution_trace ?? [];
  for (const step of trace) {
    const action = step?.action;
    if (!action || step?.status !== "completed") continue;
    if (action.panel_id === "workstation-notes" && action.action_id === "create_note" && action.args?.title) {
      workspace.activePanel = "workstation-notes";
      workspace.activeNoteTitle = action.args.title;
      workspace.lastCreatedNoteTitle = action.args.title;
      workspace.hasNoteContext = true;
    }
    if (action.panel_id === "docs-viewer") {
      workspace.activePanel = "docs-viewer";
      const path = action.args?.path;
      if (typeof path === "string" && path.trim()) {
        workspace.activeDocPath = path;
        workspace.hasDocContext = true;
      }
    }
  }
  const dbg = body?.debug ?? {};
  if (typeof dbg.open_doc_selected_path === "string" && dbg.open_doc_selected_path.trim()) {
    workspace.activeDocPath = dbg.open_doc_selected_path;
    workspace.activePanel = "docs-viewer";
    workspace.hasDocContext = true;
  }
}

const results: any[] = [];
for (const prompt of prompts) {
  const res = await request(app).post("/api/agi/ask/turn").send({
    question: prompt,
    mode: "read",
    sessionId,
    workspace_context_snapshot: workspace,
  });
  const body = res.body;
  updateWorkspace(body);
  results.push({
    prompt,
    status: res.status,
    route: body?.route_reason_code ?? body?.dispatch?.reason ?? null,
    policy: body?.planner_contract?.dispatch_policy ?? body?.debug?.dispatch_policy ?? null,
    pending: body?.pending_server_request?.required_fields ?? null,
    actions: actions(body),
    answer: answerText(body).slice(0, 600),
    finalContractPass: body?.debug?.final_answer_contract_pass ?? null,
    consumed: body?.debug?.final_composer_consumed_artifacts ?? null,
  });
}
console.log(JSON.stringify({ sessionId, workspace, results }, null, 2));
