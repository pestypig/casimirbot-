import express from 'express';
import request from 'supertest';
import { planRouter } from './server/routes/agi.plan.ts';
const app = express(); app.use(express.json()); app.use('/api/agi', planRouter);
const response = await request(app).post('/api/agi/ask/turn').send({question:'What is the Situation Room?', mode:'read', debug:true, sessionId:`inspect-${Date.now()}`});
const b = response.body;
console.log(JSON.stringify({
 text: b.selected_final_answer || b.answer || b.text,
 presentation: b.terminal_presentation,
 terminal_artifact_kind: b.terminal_artifact_kind,
 final_answer_source: b.final_answer_source,
 authority: b.terminal_answer_authority,
 boundary: b.terminal_boundary_eligibility,
}, null, 2));
