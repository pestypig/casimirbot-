import express from "express";
import request from "supertest";
import { planRouter } from "./server/routes/agi.plan.ts";
const app = express(); app.use(express.json()); app.use("/api/agi", planRouter);
const response = await request(app).post("/api/agi/ask/turn").send({question:"what paper am I viewing?", mode:"read", sessionId:`debug-${Date.now()}`, workspace_context_snapshot:{activePanel:"docs-viewer", hasDocContext:true, activeDocPath:null, source:"doc_viewer_store"}});
console.log(JSON.stringify(response.body, null, 2).slice(0,6000));
