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

const findAction = (body: Record<string, any>, panelId: string, actionId = "open") => {
  const actions = body?.action_envelope?.workstation_actions ?? [];
  return Array.isArray(actions)
    ? actions.find((action: any) => action?.panel_id === panelId && action?.action_id === actionId)
    : null;
};

const readGoalSatisfaction = (body: Record<string, any>) => body?.goal_satisfaction_evaluation ?? null;

const readStreamFinal = (text: string): Record<string, any> => {
  const blocks = text.split(/\n\n+/);
  const finalBlock = blocks.find((block) => /^event:\s*turn_final/m.test(block));
  expect(finalBlock).toBeTruthy();
  const dataLine = finalBlock
    ?.split(/\n/)
    .find((line) => line.startsWith("data:"));
  expect(dataLine).toBeTruthy();
  return JSON.parse(String(dataLine).replace(/^data:\s*/, ""));
};

describe("helix ask E52 panel control terminal contract", () => {
  it("satisfies explicit docs-viewer panel opens with a workspace action receipt", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open panel docs-viewer",
        mode: "read",
        debug: true,
        sessionId: `e52-docs-panel-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(response.body?.canonical_goal_frame?.answer_scope).toBe("current_turn_panel");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("workspace_action_receipt");
    expect(findAction(response.body, "docs-viewer")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(response.body?.terminal_artifact_subkind).toBe("panel_action_receipt");
    expect(response.body?.terminal_consistency_check?.consistent).toBe(true);
    expect(response.body?.capability_plan).toMatchObject({
      schema: "helix.capability_plan.v1",
      required_terminal_kind: "workspace_action_receipt",
    });
    expect(response.body?.capability_adapter_request).toMatchObject({
      schema: "helix.capability_adapter_request.v1",
    });
    expect(response.body?.capability_adapter_result).toMatchObject({
      schema: "helix.capability_adapter_result.v1",
      status: "succeeded",
      selected_for_answer: true,
      reentered_solver: true,
    });
    expect(response.body?.capability_lifecycle_ledger).toMatchObject({
      schema: "helix.capability_lifecycle_ledger.v1",
      ok: true,
    });
    expect(response.body?.solver_controller_decision).toMatchObject({
      decision: "allow_terminal",
      blocking_reasons: [],
    });
    expect(response.body?.terminal_error_code).not.toBe("terminal_consistency_violation");
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/Opening panel: Docs & Papers\./);
  }, 60000);

  it("satisfies explicit workstation-notes panel opens with a workspace action receipt", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open panel workstation-notes",
        mode: "read",
        debug: true,
        sessionId: `e52-notes-panel-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "workstation-notes")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(response.body?.terminal_consistency_check?.consistent).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/Opening panel: Workstation Notes\./);
  }, 60000);

  it("routes natural notes wording as panel control, not a note mutation", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open workstation notes",
        mode: "read",
        debug: true,
        sessionId: `e52-workstation-notes-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "workstation-notes")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(response.body?.terminal_artifact_kind).not.toBe("note_update_receipt");
  }, 60000);

  it("routes notes-panel wording to panel control instead of active-doc identity", async () => {
    const app = createApp();
    const sessionId = `e52-notes-panel-natural-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open the notes panel.",
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

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "workstation-notes")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(response.body?.solver_controller_decision?.decision).toBe("allow_terminal");
    expect(String(response.body?.selected_final_answer ?? "")).toBe("Opening panel: Workstation Notes.");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/^Active doc:/i);
  }, 60000);

  it("routes open-panels status questions to process graph instead of active-doc identity", async () => {
    const app = createApp();
    const sessionId = `e52-open-panels-status-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What panels are open right now?",
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

    expect(response.body?.source_target_intent?.target_source).toBe("process_graph");
    expect(response.body?.terminal_artifact_kind).toBe("process_graph_overview");
    expect(response.body?.final_answer_source).toBe("process_graph_overview");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/^Active doc:/i);
  }, 60000);

  it("routes Docs & Papers wording to panel control without an active doc", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open docs and papers",
        mode: "read",
        debug: true,
        sessionId: `e52-docs-papers-no-context-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "docs-viewer")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/Opened document/i);
  }, 60000);

  it("routes polite docs-panel wording to panel control instead of active-doc identity", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, can you open up the Docs panel?",
        mode: "read",
        debug: true,
        sessionId: `e52-open-docs-panel-polite-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "live-answer-environment",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("workspace_action_receipt");
    expect(findAction(response.body, "docs-viewer", "open")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(readGoalSatisfaction(response.body)?.canonical_goal_kind).toBe("panel_control");
    expect(readGoalSatisfaction(response.body)?.terminal_contract).toEqual(
      expect.objectContaining({
        goal_kind: "docs_panel_open",
        required_terminal_kinds: ["workspace_action_receipt"],
        required_actions: ["docs-viewer.open"],
        forbidden_terminal_kinds: expect.arrayContaining(["active_doc_identity", "doc_open_receipt", "doc_summary"]),
      }),
    );
    expect(readGoalSatisfaction(response.body)?.required_actions?.[0]).toEqual(
      expect.objectContaining({
        action_key: "docs-viewer.open",
        required: true,
        satisfied: true,
      }),
    );
    expect(readGoalSatisfaction(response.body)?.satisfaction).toBe("satisfied");
    expect(readGoalSatisfaction(response.body)?.next_decision).toBe("allow_terminal");
    expect(String(response.body?.selected_final_answer ?? "")).toBe("Opening panel: Docs & Papers.");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/currently on|Opened document/i);
  }, 60000);

  it("routes article-qualified docs-panel wording to panel control", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open up a docs panel.",
        mode: "read",
        debug: true,
        sessionId: `e52-open-a-docs-panel-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("workspace_action_receipt");
    expect(findAction(response.body, "docs-viewer", "open")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(readGoalSatisfaction(response.body)?.terminal_contract?.goal_kind).toBe("docs_panel_open");
    expect(readGoalSatisfaction(response.body)?.satisfaction).toBe("satisfied");
    expect(response.body?.solver_controller_decision?.decision).toBe("allow_terminal");
    expect(response.body?.available_capabilities?.schema).toBe("helix.available_capabilities.v1");
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("docs-viewer.open");
    expect(response.body?.agent_step_decision?.chosen_capability).toBe("docs-viewer.open");
    expect(response.body?.initial_agent_step_decision?.authority).toBe("agent_step_decision");
    expect(response.body?.initial_agent_step_decision?.chosen_capability).toBe("docs-viewer.open");
    expect(response.body?.initial_agent_step_decision?.action).toMatchObject({
      panel_id: "docs-viewer",
      action_id: "open",
    });
    expect(response.body?.agent_step_authority_check).toMatchObject({
      expected_capability: "docs-viewer.open",
      planned_capability: "docs-viewer.open",
      consistent: true,
      enforcement: "authoritative",
    });
    expect(response.body?.observation_review?.does_it_satisfy_goal).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toBe("Opening panel: Docs & Papers.");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/terminal resolver|Opened document|currently on/i);
  }, 60000);

  it("routes corrective docs-panel follow-ups to panel control", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, you didn't open up the docs, you just told me which one I was last on. Can you open up the docs?",
        mode: "read",
        debug: true,
        sessionId: `e52-open-docs-panel-correction-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "live-answer-environment",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "docs-viewer", "open")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(readGoalSatisfaction(response.body)?.terminal_contract?.goal_kind).toBe("docs_panel_open");
    expect(readGoalSatisfaction(response.body)?.required_actions?.[0]).toEqual(
      expect.objectContaining({
        action_key: "docs-viewer.open",
        required: true,
        satisfied: true,
      }),
    );
    expect(readGoalSatisfaction(response.body)?.required_evidence?.[0]).toEqual(
      expect.objectContaining({
        kind: "workspace_action_receipt",
        required: true,
        satisfied: true,
      }),
    );
    expect(readGoalSatisfaction(response.body)?.next_decision).toBe("allow_terminal");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/currently on|Opened document/i);
  }, 60000);

  it("treats open docs for me as a docs panel action, not a document query for me", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Okay, open the docs for me.",
        mode: "read",
        debug: true,
        sessionId: `e52-open-docs-for-me-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "live-answer-environment",
          activeDocPath: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "docs-viewer", "open")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(readGoalSatisfaction(response.body)?.terminal_contract).toEqual(
      expect.objectContaining({
        goal_kind: "docs_panel_open",
        forbidden_terminal_kinds: expect.arrayContaining(["active_doc_identity", "doc_open_receipt"]),
      }),
    );
    expect(readGoalSatisfaction(response.body)?.satisfaction).toBe("satisfied");
    expect(String(response.body?.selected_final_answer ?? "")).toBe("Opening panel: Docs & Papers.");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/\"me\"|confidently identify a document/i);
  }, 60000);

  it("keeps stream debug terminal aligned with the panel receipt", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn/stream")
      .set("Accept", "text/event-stream")
      .send({
        question: "open docs and papers",
        mode: "act",
        debug: true,
        sessionId: `e52-docs-papers-stream-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: "/docs/research/nhm2-follow-up-patch-runbook.md",
          docViewer: { currentPath: "/docs/research/nhm2-follow-up-patch-runbook.md" },
        },
      })
      .expect(200);
    const body = readStreamFinal(response.text);

    expect(body?.final_status).toBe("final_answer");
    expect(body?.terminal_error_code).toBeUndefined();
    expect(body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(body?.terminal_consistency_check?.consistent).toBe(true);
    expect(body?.debug?.turn_truth_table?.terminal?.kind).toBe("final_answer");
    expect(body?.debug?.turn_truth_table?.terminal?.text).toBe("Opening panel: Docs & Papers.");
    expect(body?.debug?.capability_adapter_request?.schema).toBe("helix.capability_adapter_request.v1");
    expect(body?.debug?.capability_adapter_result).toMatchObject({
      schema: "helix.capability_adapter_result.v1",
      status: "succeeded",
      selected_for_answer: true,
      reentered_solver: true,
    });
    expect(body?.debug?.capability_lifecycle_ledger).toMatchObject({
      schema: "helix.capability_lifecycle_ledger.v1",
      ok: true,
    });
    expect(body?.debug?.solver_controller_decision?.decision).toBe("allow_terminal");
    expect(body?.turn_runtime?.missing_required_artifacts ?? []).not.toContain("workspace_action_receipt");
    expect(String(body?.selected_final_answer ?? "")).toBe("Opening panel: Docs & Papers.");
  }, 60000);

  it("does not let active doc context hijack Docs & Papers panel opens", async () => {
    const app = createApp();
    const activePath = "/docs/research/nhm2-follow-up-patch-runbook.md";
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open docs and papers",
        mode: "read",
        debug: true,
        sessionId: `e52-docs-papers-active-doc-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          docViewer: { currentPath: activePath },
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "docs-viewer", "open")).toBeTruthy();
    expect(findAction(response.body, "docs-viewer", "verify_active_doc")).toBeFalsy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/Opened document|NHM2 Follow-Up Patch Runbook/i);
    expect(response.body?.terminal_consistency_check?.consistent).toBe(true);
  }, 60000);

  it("routes tab-switch wording to panel control instead of conversation", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "switch to the Docs & Papers tab",
        mode: "read",
        debug: true,
        sessionId: `e52-docs-papers-tab-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("dispatch:act");
    expect(response.body?.dispatch_policy).toBe("workspace_only");
    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(findAction(response.body, "docs-viewer")).toBeTruthy();
  }, 60000);

  it("routes open-up calculator wording to panel control", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Can you open up the scientific calculator panel?",
        mode: "read",
        debug: true,
        sessionId: `e52-open-up-calculator-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("panel_control");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("workspace_action_receipt");
    expect(findAction(response.body, "scientific-calculator")).toBeTruthy();
    expect(response.body?.terminal_artifact_kind).toBe("workspace_action_receipt");
    expect(response.body?.terminal_error_code ?? null).toBeNull();
    expect(response.body?.terminal_consistency_check?.consistent).toBe(true);
    expect(response.body?.poison_audit?.ok).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toMatch(/Opening panel: Scientific Calculator\./);
  }, 60000);

  it("routes calculator solve requests to the scientific calculator action", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "solve x^2-4=0 in the scientific calculator",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-solve-${Date.now()}`,
      })
      .expect(200);

    const action = findAction(response.body, "scientific-calculator", "solve_expression");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("calculator_solve");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("workstation_tool_evaluation");
    expect(action).toBeTruthy();
    expect(action?.args?.latex).toBe("x^2-4=0");
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("scientific-calculator.solve_expression");
    expect(response.body?.agent_step_decision?.candidate_capabilities).toContain("scientific-calculator.solve_expression");
    expect(response.body?.agent_step_decision?.expected_artifacts).toEqual(
      expect.arrayContaining(["calculator_receipt", "workstation_tool_evaluation"]),
    );
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.ask_turn_solver_trace?.completed_solver_path).toBe(true);
  }, 60000);

  it("does not steal real document acquisition prompts", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "open a doc about NHM2 alpha 0p995",
        mode: "read",
        debug: true,
        sessionId: `e52-doc-open-conflict-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).not.toBe("panel_control");
    expect(response.body?.canonical_goal_frame?.answer_scope).not.toBe("current_turn_panel");
    expect(response.body?.terminal_artifact_subkind).not.toBe("panel_action_receipt");
  }, 60000);
});
