import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan";
const app = express(); app.use(express.json()); app.use("/api/agi", planRouter);
const res = await request(app).post("/api/agi/ask/turn").send({
 question:"copy the current document path to that note", mode:"read", sessionId:`debug-${Date.now()}`,
 workspace_context_snapshot:{activePanel:"docs-viewer",hasDocContext:true,activeDocPath:"/docs/research/example.md"}
});
console.log(JSON.stringify({text:res.body.text, route:res.body.route_reason_code, policy:res.body.dispatch_policy, action:res.body.workspace_action, planner:res.body.planner_contract, trace:res.body.execution_trace, links:res.body.job_ready_links}, null, 2));
