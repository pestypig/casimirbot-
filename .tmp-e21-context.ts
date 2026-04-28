import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan";
const app = express(); app.use(express.json()); app.use("/api/agi", planRouter);
const activePath = "/docs/audits/research/halobank-warp-gr-foundations-bridge-2026-03-24.md";
const r = await request(app).post("/api/agi/ask/turn").send({question:"quick check: what note am I editing and what doc is open?", mode:"read", sessionId:`dbg-${Date.now()}`, workspace_context_snapshot:{activePanel:"workstation-notes",activeDocPath:activePath,activeNoteTitle:"artifact handoff browser e21",lastCreatedNoteTitle:"artifact handoff browser e21",hasDocContext:true,hasNoteContext:true}});
console.log(r.status);
console.log(JSON.stringify({answer:r.body.assistant_answer, plan:r.body.planner_contract?.plan_items, trace:r.body.execution_trace, step_results:r.body.step_results, inv:r.body.invariant_violations}, null, 2));
