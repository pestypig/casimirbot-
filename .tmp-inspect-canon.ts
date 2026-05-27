import express from 'express';
import request from 'supertest';
import { planRouter } from './server/routes/agi.plan.ts';
const app = express(); app.use(express.json()); app.use('/api/agi', planRouter);
const response = await request(app).post('/api/agi/ask/turn').send({question:'What is the Situation Room?', mode:'read', debug:true, sessionId:`inspect-${Date.now()}`});
const b = response.body;
console.log(JSON.stringify({
 canonical: b.canonical_goal_frame,
 text: b.selected_final_answer,
 payloadKind: b.terminal_artifact_kind,
 source: b.final_answer_source,
 hasStale: /terminal boundary blocked|could not complete/i.test(String(b.selected_final_answer)),
 obsLen: Array.isArray(b.evidence_observations) ? b.evidence_observations.length : null,
 firstObs: Array.isArray(b.evidence_observations) ? b.evidence_observations[0] : null,
}, null, 2).slice(0, 8000));
