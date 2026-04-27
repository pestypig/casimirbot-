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

describe("helix ask turn e10.6 doc acquisition", () => {
  it("maps latest topic doc requests to a concrete docs acquisition action", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({ question: "open the latest NHM2 doc", mode: "read", sessionId: `e106-latest-${Date.now()}` })
      .expect(200);

    expect(response.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(response.body?.workspace_action?.action_id).toBe("open_latest_doc_by_topic");
    expect(response.body?.workspace_action?.args?.topic).toMatch(/nhm2/i);
    expect(response.body?.workspace_action?.args?.path).toMatch(/^\/docs\/.*\.md$/);
    expect(response.body?.text).toMatch(/Opened latest .*document: \/docs\/.*\.md/i);
    expect(response.body?.text).not.toBe("Opened Docs & Papers.");
  });

  it("maps explicit docs paths to open_doc_by_path", async () => {
    const app = createApp();
    const path = "docs/audits/research/warp-needle-hull-mark2-compact-note-paper-outline-latest.md";
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({ question: `open ${path}`, mode: "read", sessionId: `e106-path-${Date.now()}` })
      .expect(200);

    expect(response.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(response.body?.workspace_action?.action_id).toBe("open_doc_by_path");
    expect(response.body?.workspace_action?.args?.path).toBe(path);
    expect(response.body?.text).toContain(path);
    expect(response.body?.text).not.toBe("Opened Docs & Papers.");
  });

  it("treats docs workspace display wording as docs navigation", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({ question: "show me the docs workspace", mode: "read", sessionId: `e106-docs-workspace-${Date.now()}` })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("dispatch:act");
    expect(response.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(response.body?.workspace_action?.action_id).toBe("open");
    expect(response.body?.planner_contract?.dispatch_policy).toBe("workspace_only");
  });

  it("retains acquired doc context for follow-up identity turns", async () => {
    const app = createApp();
    const sessionId = `e106-followup-${Date.now()}`;
    const openResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({ question: "open the latest NHM2 doc", mode: "read", sessionId })
      .expect(200);
    const openedPath = openResponse.body?.workspace_action?.args?.path;

    const identityResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({ question: "what doc are we on?", mode: "read", sessionId })
      .expect(200);

    expect(identityResponse.body?.text).toContain(openedPath);
  });

  it("maps recent topic doc wording to latest-doc acquisition", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "pull up a recent NHM2 mission time document",
        mode: "read",
        sessionId: `e106-recent-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(response.body?.workspace_action?.action_id).toBe("open_latest_doc_by_topic");
    expect(response.body?.workspace_action?.args?.topic).toMatch(/nhm2|mission/i);
    expect(response.body?.route_reason_code).toBe("dispatch:act");
  });

  it("maps go-to latest topic-qualified doc prompts without clarifying", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Go to the latest NHM2 doc about expected clocking targets for the mission.",
        mode: "read",
        sessionId: `e106-topic-qualified-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("dispatch:act");
    expect(response.body?.dispatch_policy).toBe("workspace_only");
    expect(response.body?.pending_server_request).toBeFalsy();
    expect(response.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(["open_latest_doc_by_topic", "search_docs"]).toContain(response.body?.workspace_action?.action_id);
    const args = response.body?.workspace_action?.args ?? {};
    const topicOrQuery = String(args.topic ?? args.query ?? "");
    expect(topicOrQuery).toMatch(/NHM2/i);
    expect(topicOrQuery).toMatch(/clocking/i);
    expect(topicOrQuery).toMatch(/mission/i);
  });

  it("falls back to docs search for unresolved topic-qualified latest-doc prompts", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Go to the latest NHM2 doc about zzzquartz nonexistent mission clocking target.",
        mode: "read",
        sessionId: `e106-topic-search-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("dispatch:act");
    expect(response.body?.pending_server_request).toBeFalsy();
    expect(response.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(response.body?.workspace_action?.action_id).toBe("search_docs");
    expect(response.body?.workspace_action?.args?.query).toMatch(/NHM2/i);
    expect(response.body?.workspace_action?.args?.query).toMatch(/zzzquartz/i);
  });

  it("lets obvious new workspace goals supersede stale clarify pending state", async () => {
    const app = createApp();
    const sessionId = `e106-pending-supersede-${Date.now()}`;
    const pendingResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "copy the answer about centerline alpha into that note",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(pendingResponse.body?.route_reason_code).toBe("clarify:missing_args");
    expect(pendingResponse.body?.pending_server_request).toBeTruthy();

    const supersedeResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "go to docs",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(supersedeResponse.body?.route_reason_code).toBe("dispatch:act");
    expect(supersedeResponse.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(supersedeResponse.body?.workspace_action?.action_id).toBe("open");
    expect(supersedeResponse.body?.pending_resolution_reason).toBe("pending_superseded_by_new_user_goal");
    expect(supersedeResponse.body?.pending_intercepted_turn).toBe(false);
  });

  it("does not let stale clarify pending state capture unrelated conversation", async () => {
    const app = createApp();
    const sessionId = `e106-pending-conversation-clear-${Date.now()}`;
    const pendingResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "create a note",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(pendingResponse.body?.route_reason_code).toBe("clarify:missing_args");
    expect(pendingResponse.body?.pending_server_request).toBeTruthy();

    const conversationResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "hello after that",
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(conversationResponse.body?.route_reason_code).not.toBe("clarify:missing_args");
    expect(conversationResponse.body?.dispatch_policy).toBe("conversation_only");
    expect(conversationResponse.body?.turn_runtime?.terminal?.kind).toBe("final_answer");
    expect(conversationResponse.body?.pending_resolution_reason).toBe("pending_cleared_for_unrelated_conversation");
    expect(conversationResponse.body?.pending_intercepted_turn).toBe(false);
  });

  it("lets doc identity questions supersede stale clarify pending state", async () => {
    const app = createApp();
    const sessionId = `e106-pending-doc-identity-${Date.now()}`;
    await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "create a note",
        mode: "read",
        sessionId,
      })
      .expect(200);

    const identityResponse = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "what paper am I viewing?",
        mode: "read",
        sessionId,
        workspace_context_snapshot: {
          hasDocContext: true,
          activeDocPath: "/docs/research/example.md",
        },
      })
      .expect(200);

    expect(identityResponse.body?.route_reason_code).toBe("dispatch:act");
    expect(identityResponse.body?.workspace_action?.panel_id).toBe("docs-viewer");
    expect(identityResponse.body?.workspace_action?.action_id).toBe("identify_current_doc");
    expect(identityResponse.body?.pending_resolution_reason).toBe("pending_superseded_by_new_user_goal");
    expect(identityResponse.body?.pending_intercepted_turn).toBe(false);
  });
});

