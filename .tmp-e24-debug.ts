import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan";
const app = express(); app.use(express.json({limit:"2mb"})); app.use("/api/agi", planRouter);
const activePath = "/docs/audits/research/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p7600_v1/warp-nhm2-mission-time-comparison-2026-04-23.md";
const ws = { activePanel:"docs-viewer", activeDocPath:activePath, docViewer:{ mode:"doc", currentPath:activePath, path:activePath, title:"warp-nhm2-mission-time-comparison-2026-04-23.md"}, openPanels:["docs-viewer"], activeNoteId:null, activeNoteTitle:null, lastCreatedNoteId:null, lastCreatedNoteTitle:null, recentNotes:[] };
const res = await request(app).post("/api/agi/ask/turn").send({question:"compare this document with that note and tell me the main differences", mode:"read", sessionId:`debug-${Date.now()}`, workspace_context_snapshot:ws});
console.log(JSON.stringify({status:res.status, text:res.body.text, answer:res.body.answer, final_status:res.body.final_status, response_type:res.body.response_type, pending:res.body.pending_server_request, terminal:res.body.terminal_artifact, runtime:res.body.turn_runtime?.terminal, route:res.body.route_reason_code, policy:res.body.dispatch_policy, invariant:res.body.invariant_violations, step_results:res.body.step_results?.map((s:any)=>({id:s.step_id,status:s.status,error:s.error_code,artifact:s.result_artifact?.kind, blocked:s.blocked_missing_artifacts}))}, null, 2));
