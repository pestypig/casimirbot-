import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

describe("helix ask turn e8.14.1 artifact-gate pending escape", () => {
  it("aborts artifact-gate pending on intent switch and routes new request normally", async () => {
    const app = createApp();
    const sessionId = "e8141-intent-switch";
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open docs and then compare differences",
        mode: "read",
        sessionId,
      })
      .expect(200);

    const switched = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "go to docs and notes",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(switched.body?.route_reason_code).toBe("clarify:planner_repair_required");
    expect(switched.body?.pending_transition_trace).toContain("artifact_gate_intent_switch_abort");
  });

  it("clears artifact-gate pending for chitchat turns", async () => {
    const app = createApp();
    const sessionId = "e8141-chitchat";
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open docs and then compare differences",
        mode: "read",
        sessionId,
      })
      .expect(200);

    const hello = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "hello",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(hello.body?.route_reason_code).toBe("suppressed:filler");
    expect(hello.body?.pending_transition_trace).toContain("artifact_gate_conversation_escape_abort");
    expect(hello.body?.pending_server_request ?? null).toBeNull();
  });

  it("keeps artifact-gate pending active for same compare intent family", async () => {
    const app = createApp();
    const sessionId = "e8141-same-family";
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open docs and then compare differences",
        mode: "read",
        sessionId,
      })
      .expect(200);

    const compare = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "compare this doc with my notes and tell me differences",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(compare.body?.route_reason_code).toBe("clarify:missing_args");
    expect(compare.body?.pending_transition_trace).not.toContain("artifact_gate_intent_switch_abort");
    expect(compare.body?.pending_server_request?.kind).toBe("clarify");
  });

  it("prioritizes explicit cancel handling over conversation escape for artifact-gate pending", async () => {
    const app = createApp();
    const sessionId = "e8141-explicit-cancel";
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open docs and then compare differences",
        mode: "read",
        sessionId,
      })
      .expect(200);

    const canceled = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "cancel",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(canceled.body?.route_reason_code).toBe("suppressed:low_salience");
    expect(String(canceled.body?.text ?? "").toLowerCase()).toContain("canceled");
    expect(canceled.body?.pending_transition_trace).toContain("pending_clarify_canceled");
    expect(canceled.body?.pending_transition_trace).not.toContain("artifact_gate_conversation_escape_abort");
  });

  it("still supports navigation disambiguation roundtrip when no artifact gate exists", async () => {
    const app = createApp();
    const sessionId = "e8141-nav-roundtrip";
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "go to docs and notes",
        mode: "read",
        sessionId,
      })
      .expect(200);

    const docs = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "docs",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(docs.body?.route_reason_code).toBe("dispatch:act");
    expect(docs.body?.planner_contract?.selected_action?.panel_id).toBe("docs-viewer");
    expect(docs.body?.planner_contract?.selected_action?.action_id).toBe("open");
  });
});
