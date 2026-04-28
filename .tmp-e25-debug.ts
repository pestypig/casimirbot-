import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan";
const app=express(); app.use(express.json()); app.use('/api/agi', planRouter);
const activePath='/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-route-time-worldline-2026-04-25.md';
const ws={activePanel:'docs-viewer',activeDocPath:activePath,activeNoteTitle:'E25 verified note',lastCreatedNoteTitle:'E25 verified note',recentNotes:[{title:'E25 verified note'}],hasDocContext:true,hasNoteContext:true};
const res=await request(app).post('/api/agi/ask/turn').send({question:'compare this document with a note called definitely missing E25 note and tell me the main differences',mode:'read',sessionId:'tmp',workspace_context_snapshot:ws});
console.log(JSON.stringify({text:res.body.text,pending:res.body.pending_server_request,planner:res.body.planner_contract?.selection_missing_required_args,route:res.body.route_reason_code},null,2));
