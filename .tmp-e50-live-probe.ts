import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan.ts";
const app = express(); app.use(express.json()); app.use('/api/agi', planRouter);
const prompts = [
  'In simple words: if one clock rides with the object and another clock is just the coordinate label, is that proper time versus coordinate time?',
  'I am hunting the NHM2 frontier-distance number around alpha 0p995; find the strongest source and give the actual value, not a broad summary.',
  'For NHM2 warp-profile work, translate alpha 0p7000 into normal words. What is that parameter doing?'
];
const out = [];
for (const question of prompts) {
  const r = await request(app).post('/api/agi/ask/turn').send({ question, mode: 'read', debug: true, sessionId: `e50-live-probe-${Date.now()}-${Math.random()}` });
  const b = r.body ?? {};
  out.push({
    question,
    status: r.status,
    ok: b.ok,
    selected_final_answer: b.selected_final_answer ?? b.text ?? null,
    final_status: b.final_status ?? b.response_type ?? null,
    final_answer_source: b.final_answer_source ?? null,
    terminal_error_code: b.terminal_error_code ?? null,
    canonical_goal_frame: b.canonical_goal_frame ?? null,
    terminal_consistency_check: b.terminal_consistency_check ?? null,
    terminal_artifact_kind: b.terminal_artifact_kind ?? null,
    satisfaction_report: b.satisfaction_report ?? null,
    tool_choice_arbitration: b.tool_choice_arbitration ?? null,
    current_ledger_kinds: Array.isArray(b.current_turn_artifact_ledger) ? b.current_turn_artifact_ledger.map(a => a?.kind).filter(Boolean) : [],
    rejected_terminal_candidates: b.rejected_terminal_candidates ?? [],
  });
}
console.log(JSON.stringify(out, null, 2));
