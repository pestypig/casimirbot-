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

const activePath =
  "/docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/stage1_centerline_alpha_0p7000_v1/warp-nhm2-mission-time-comparison-latest.md";

describe("helix ask E65 active document and open receipt terminals", () => {
  it("answers active document identity from workspace state", async () => {
    const app = createApp();
    const sessionId = `e65-active-doc-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What paper am I viewing?",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          hasDocContext: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_identity");
    expect(response.body?.terminal_artifact_kind).toBe("active_doc_identity");
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
    expect(response.body?.canonical_goal_frame?.goal_kind).not.toBe("model_only_concept");
  }, 90000);

  it("lets docs source nouns outrank generic right-now visual deictics", async () => {
    const app = createApp();
    const sessionId = `e65-docs-right-now-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "OK, what docs are we looking at right now?",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          docContextPath: activePath,
          hasDocContext: true,
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.source_target_intent?.target_source).toBe("active_doc");
    expect(response.body?.source_target_intent?.precedence_reason).toBe("deictic_docs_identity_source_target");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_identity");
    expect(response.body?.terminal_artifact_kind).toBe("active_doc_identity");
    expect(response.body?.deictic_reference?.reference_type ?? "unknown").not.toBe("current_screen");
    expect(response.body?.procedure_evidence_retrieval_plan?.source_targets ?? []).not.toEqual(["visual_capture"]);
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/active visual SituationRun/i);
  }, 90000);

  it("binds generic right-now deictics to the active docs viewer before visual fallback", async () => {
    const app = createApp();
    const sessionId = `e65-generic-active-doc-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "that Are we looking at right now?",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          docContextPath: activePath,
          hasDocContext: true,
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.active_workspace_source_resolution?.schema).toBe(
      "helix.active_workspace_source_resolution.v1",
    );
    expect(response.body?.active_workspace_source_resolution?.resolved_source_target).toBe("active_doc");
    expect(response.body?.active_workspace_source_resolution?.reason).toBe("generic_deictic_bound_to_active_docs");
    expect(response.body?.source_target_intent?.target_source).toBe("active_doc");
    expect(response.body?.terminal_artifact_kind).toBe("active_doc_identity");
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/active visual SituationRun/i);
  }, 90000);

  it("routes current dock/doc location prompts to active doc search", async () => {
    const app = createApp();
    const sessionId = `e65-current-dock-location-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Find where lapse shift is found in the current dock.",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          docContextPath: activePath,
          hasDocContext: true,
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.active_workspace_source_resolution?.resolved_source_target).toBe("docs_viewer");
    expect(response.body?.active_workspace_source_resolution?.reason).toBe("active_doc_location_prompt");
    expect(response.body?.source_target_intent?.target_source).toBe("docs_viewer");
    expect(response.body?.terminal_artifact_kind).toBe("doc_location_result");
    expect(response.body?.doc_location_result?.doc_path).toBe(activePath);
    expect(response.body?.doc_location_result?.locate_query).toBe("lapse shift");
    expect(response.body?.doc_location_result?.assistant_answer).toBe(false);
    expect(response.body?.doc_location_result?.raw_content_included).toBe(false);
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/^(Locations:|No locations found)/i);
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/Completed reasoning|model_only|no_tool_direct/i);
  }, 90000);

  it("fails missing docs identity as missing doc context, not missing visual context", async () => {
    const app = createApp();
    const sessionId = `e65-docs-right-now-missing-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "OK, what docs are we looking at right now?",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          hasDocContext: false,
          docContextValid: false,
        },
      })
      .expect(200);

    expect(response.body?.source_target_intent?.target_source).toBe("active_doc");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_identity");
    expect(response.body?.terminal_artifact_kind).toBe("typed_failure");
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/active.*document|active_doc|doc/i);
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/active visual SituationRun/i);
  }, 90000);

  it("keeps best-doc open requests on doc_open_receipt instead of locations", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Find and open the best NHM2 document about alpha 0p7000 mission time comparison.",
        mode: "read",
        debug: true,
        sessionId: `e65-open-best-${Date.now()}`,
      })
      .expect(200);

    expect(["doc_open_best", "latest_doc_navigation"]).toContain(response.body?.canonical_goal_frame?.goal_kind);
    expect(response.body?.terminal_artifact_kind).toBe("doc_open_receipt");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/^Locations:/i);
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/Path:/i);
  }, 90000);

  it("does not treat polite 'for me' wording as a document search target", async () => {
    const app = createApp();
    const sessionId = `e65-open-docs-for-me-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, open docs for me.",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          docContextPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          hasDocContext: true,
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.terminal_artifact_kind).toBe("active_doc_identity");
    expect(response.body?.solver_controller_decision?.decision).toBe("allow_terminal");
    expect(JSON.stringify(response.body)).not.toContain('"query":"me"');
    expect(String(response.body?.selected_final_answer ?? "")).toContain("/docs/research/nhm2-current-status-whitepaper-2026-05-02.md");
  }, 90000);

  it("treats NH-M2 white-paper-from-docs wording as document acquisition, not panel open", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open up the NH-M2. White paper from the docks.",
        mode: "read",
        debug: true,
        sessionId: `e65-nhm2-whitepaper-docs-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("doc_open_best");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("doc_open_receipt");
    expect(response.body?.terminal_artifact_kind).toBe("doc_open_receipt");
    expect(response.body?.terminal_error_code ?? null).not.toBe("terminal_consistency_violation");
    expect(response.body?.solver_controller_decision?.decision).toBe("allow_terminal");
    expect(response.body?.final_route_reconciliation?.ok).toBe(true);
    expect(response.body?.terminal_answer_authority?.route).toBe("doc_open_best");
    expect(response.body?.poison_audit?.ok).toBe(true);
    expect(response.body?.execution_trace?.some((step: any) => step?.action?.action_id === "open_doc_by_path")).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/Path:/i);
  }, 90000);
});
