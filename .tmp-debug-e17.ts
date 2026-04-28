import express from 'express';
import request from 'supertest';
const { planRouter } = await import('./server/routes/agi.plan.ts');
const app = express(); app.use(express.json()); app.use('/api/agi', planRouter);
const activePath = '/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-mission-time-comparison-latest.md';
for (const body of [
 {question:'put the centerline alpha location into that note', mode:'read', sessionId:'debug-e17-missing', workspace_context_snapshot:{sessionId:'debug-e17-missing',activePanel:'docs-viewer',activeDocPath:activePath,hasDocContext:true,hasNoteContext:false}},
 {question:'find where centerline alpha is mentioned and put it in that note', mode:'read', sessionId:'debug-e17-final', workspace_context_snapshot:{sessionId:'debug-e17-final',activePanel:'docs-viewer',activeDocPath:activePath,hasDocContext:true,hasNoteContext:true,activeNoteTitle:'quick NHM2 test note',lastCreatedNoteTitle:'quick NHM2 test note'}}
]) {
 const res = await request(app).post('/api/agi/ask/turn').send(body);
 console.log('\nQ', body.question);
 console.log(JSON.stringify({route:res.body.route_reason_code, policy:res.body.dispatch_policy, pending:res.body.pending_server_request, workspace_action:res.body.workspace_action, text:res.body.text, gc:res.body.general_controller_decisions, final:res.body.general_controller_final_decision, step_results:res.body.step_results?.map((s:any)=>({id:s.step_id, action:s.artifact?.action_id, actual:s.actual_artifacts, contract:s.contract_pass, fail:s.contract_fail_reason, result:s.result_artifact})), trace:res.body.execution_trace?.map((s:any)=>({id:s.id, action:s.action, status:s.status, reason:s.reason}))}, null, 2).slice(0,16000));
}
