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
    expect(response.body?.doc_open_coverage).toMatchObject({
      schema: "helix.doc_open_coverage.v1",
      goal_kind: "docs_panel_open",
      coverage: "complete",
      next_decision: "allow_terminal",
    });
    expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
      artifact.kind === "doc_open_coverage" &&
      artifact.payload?.coverage === "complete"
    )).toBe(true);
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
    expect(response.body?.available_capabilities?.manifest_role).toBe("model_visible_tool_menu");
    expect(response.body?.available_capabilities?.tool_manifest_version).toBe("helix.ask.capability_manifest.v1");
    expect(response.body?.available_capabilities?.model_visible_capability_keys).toEqual(
      expect.arrayContaining([
        "scientific-calculator.solve_expression",
        "scientific-calculator.open",
        "docs-viewer.search_docs",
        "workstation-notes.create",
        "workstation-notes.create_note",
        "live-source.status",
      ]),
    );
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("scientific-calculator.solve_expression");
    expect(response.body?.agent_step_decision?.decision_role).toBe("agent_step_sampling_pass");
    expect(response.body?.agent_step_decision?.sampling).toMatchObject({
      mode: "deterministic_policy_fallback",
      llm_used: false,
    });
    expect(response.body?.agent_step_decision?.next_step).toBe("answer");
    expect(response.body?.initial_agent_step_decision?.next_step).toBe("next_action");
    expect(response.body?.agent_step_decision?.candidate_capabilities).toContain("scientific-calculator.solve_expression");
    expect(response.body?.agent_step_decision?.expected_artifacts).toEqual(
      expect.arrayContaining(["calculator_receipt", "workstation_tool_evaluation"]),
    );
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.ask_turn_solver_trace?.completed_solver_path).toBe(true);
  }, 60000);

  it("exposes every workstation panel tool in the model-visible capability manifest", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Solve x^2-4=0 in the scientific calculator.",
        mode: "read",
        debug: true,
        sessionId: `e52-capability-manifest-complete-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "scientific-calculator",
          visual_context_capability: {
            schema: "helix.visual_context_capability.v1",
            source_id: "src:visual-denied",
            status: "error",
            error: "Permission denied",
            evidence_available: false,
            latest_evidence_ref: null,
            requires_agent_step_selection: true,
            promotion_policy: "available_tool_not_forced_context",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      })
      .expect(200);

    const manifest = response.body?.available_capabilities;
    const keys = manifest?.model_visible_capability_keys ?? [];
    const capabilities = manifest?.capabilities ?? [];
    const byKey = new Map(capabilities.map((capability: any) => [capability?.capability_key, capability]));
    const requiredKeys = [
      "docs-viewer.open",
      "docs-viewer.search_docs",
      "docs-viewer.open_doc_by_path",
      "docs-viewer.locate_in_doc",
      "scientific-calculator.open",
      "scientific-calculator.solve_expression",
      "scientific-calculator.start_equation_live_source",
      "workstation-notes.open",
      "workstation-notes.create",
      "workstation-notes.append",
      "situation-room.describe_visual_capture",
      "live-source.status",
      "live-source.set_rate",
    ];

    expect(manifest?.schema).toBe("helix.available_capabilities.v1");
    expect(manifest?.manifest_role).toBe("model_visible_tool_menu");
    expect(keys).toEqual(expect.arrayContaining(requiredKeys));
    for (const key of requiredKeys) {
      const capability = byKey.get(key) as any;
      expect(capability, key).toBeTruthy();
      expect(String(capability?.model_visible_description ?? ""), key).toContain(capability?.label);
      expect(capability?.model_visible_input_schema, key).toEqual(expect.objectContaining({ type: "object" }));
      expect(String(capability?.reason ?? ""), key).not.toHaveLength(0);
    }
    expect(byKey.get("situation-room.describe_visual_capture")).toEqual(
      expect.objectContaining({
        goal_fit: "possible",
      }),
    );
    expect(byKey.get("live-source.set_rate")).toEqual(
      expect.objectContaining({
        goal_fit: "forbidden",
      }),
    );
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.terminal_error_code ?? null).toBeNull();
  }, 60000);

  it("can promote the initial agent-step decision through the model-visible capability manifest", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify({
      next_step: "next_action",
      chosen_capability: "scientific-calculator.solve_expression",
      reason: "The prompt asks for a calculator solve, so the calculator tool is the best next action.",
      args: { latex: "x^2-4=0" },
      expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
      commentary: {
        turn_purpose: "Use the calculator as the numeric subgoal tool before answering.",
        why_this_capability: "The prompt explicitly asks for scientific calculator work.",
        expected_artifacts: "calculator_receipt and workstation_tool_evaluation",
        what_would_make_this_done: "The calculator evaluation satisfies the goal contract.",
        observation_summary: "No observation before the first tool call.",
        next_step_reason: "Call the calculator next.",
      },
      confidence: 0.93,
    });
    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question: "A photon has frequency 6e14 Hz. Use the scientific calculator to find its wavelength and photon energy in joules and eV, then explain the result.",
          mode: "read",
          debug: true,
          sessionId: `e52-agent-step-llm-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.initial_agent_step_decision).toMatchObject({
        schema: "helix.agent_step_decision.v1",
        decision_role: "agent_step_sampling_pass",
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        sampling: {
          mode: "llm",
          llm_used: true,
          error_code: null,
        },
      });
      expect(response.body?.initial_agent_step_decision?.model_decision).toMatchObject({
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        raw_text_included: false,
      });
      expect(response.body?.available_capabilities?.manifest_role).toBe("model_visible_tool_menu");
      expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousResponse;
    }
  }, 60000);

  it("records a post-observation agent-step loop for panel-control turns", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify({
      next_step: "next_action",
      chosen_capability: "docs-viewer.open",
      reason: "The user asked to open the Docs panel.",
      args: {},
      expected_artifacts: ["workspace_action_receipt"],
      commentary: {
        turn_purpose: "Open the Docs panel.",
        why_this_capability: "docs-viewer.open is the matching workstation action.",
        expected_artifacts: "workspace_action_receipt",
        what_would_make_this_done: "A completed docs-viewer.open receipt.",
        observation_summary: "No observation before the first tool call.",
        next_step_reason: "Call the Docs panel open action.",
      },
      confidence: 0.94,
    });
    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question: "Open up a docs panel.",
          mode: "read",
          debug: true,
          sessionId: `e52-agent-step-loop-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.initial_agent_step_decision?.sampling).toMatchObject({
        mode: "llm",
        llm_used: true,
      });
      expect(response.body?.agent_step_decision).toMatchObject({
        schema: "helix.agent_step_decision.v1",
        next_step: "answer",
      });
      expect(response.body?.agent_step_loop).toMatchObject({
        schema: "helix.agent_step_loop.v1",
      });
      expect(response.body?.agent_step_commentary).toMatchObject({
        schema: "helix.agent_step_commentary.v1",
        raw_content_included: false,
      });
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousResponse;
    }
  }, 60000);

  it("records the generic agent runtime loop for document acquisition turns", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    const previousResponseIndex = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "docs-viewer.search_docs",
        reason: "Search Docs for the requested NHM2 white paper first.",
        args: { query: "NHM2 white paper", limit: 5 },
        expected_artifacts: ["doc_search_results", "doc_candidate_validation"],
        commentary: {
          turn_purpose: "Find the requested NHM2 document before opening it.",
          why_this_capability: "The document path is not yet selected.",
          expected_artifacts: "doc_search_results",
          what_would_make_this_done: "A validated path can be opened.",
          observation_summary: "No observations yet.",
          next_step_reason: "Search first.",
        },
        confidence: 0.94,
      },
      {
        next_step: "next_action",
        chosen_capability: "docs-viewer.open_doc_by_path",
        reason: "The search observation is enough to open the known NHM2 whitepaper path.",
        args: { path: "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md" },
        expected_artifacts: ["doc_open_receipt"],
        commentary: {
          turn_purpose: "Open the validated NHM2 document.",
          why_this_capability: "The path is now known from the document search observation.",
          expected_artifacts: "doc_open_receipt",
          what_would_make_this_done: "A completed document-open receipt.",
          observation_summary: "Search results are present.",
          next_step_reason: "Open the selected path.",
        },
        confidence: 0.95,
      },
      {
        next_step: "answer",
        chosen_capability: null,
        reason: "The document-open receipt satisfies the goal.",
        args: {},
        expected_artifacts: ["doc_open_receipt"],
        commentary: {
          turn_purpose: "Finish after opening the requested document.",
          why_this_capability: "No further tool call is needed.",
          expected_artifacts: "doc_open_receipt",
          what_would_make_this_done: "The receipt is already present.",
          observation_summary: "The document was opened.",
          next_step_reason: "Answer now.",
        },
        confidence: 0.97,
      },
    ]);
    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question: "Open the NHM2 white paper from docs.",
          mode: "read",
          debug: true,
          sessionId: `e52-agent-runtime-loop-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.initial_agent_step_decision?.sampling).toMatchObject({
        mode: "llm",
        llm_used: true,
      });
      expect(response.body?.agent_runtime_loop).toMatchObject({
        schema: "helix.agent_runtime_loop.v1",
        runtime_role: "generic_next_action_observe_loop",
      });
      expect(response.body?.agent_loop_budget).toMatchObject({
        schema: "helix.agent_loop_budget.v1",
        profile: "doc_search_open",
        max_tool_calls: 3,
        exhausted: false,
      });
      expect(response.body?.agent_loop_budget?.consumed_tool_calls).toBeGreaterThanOrEqual(0);
      expect(response.body?.agent_runtime_loop_admission).toMatchObject({
        schema: "helix.agent_runtime_loop_admission.v1",
        admitted: true,
      });
      expect(response.body?.agent_runtime_loop?.iterations?.length).toBeGreaterThanOrEqual(1);
      expect(response.body?.agent_runtime_loop?.iterations?.every((iteration: any) =>
        iteration.decision_source === "llm" || iteration.decision_source === "deterministic_policy_fallback"
      )).toBe(true);
      expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) => iteration.decision_source === "llm")).toBe(true);
      expect(["terminal_satisfied", "answered"]).toContain(response.body?.agent_runtime_loop?.stop_reason);
      expect(response.body?.runtime_authority_audit).toMatchObject({
        schema: "helix.runtime_authority_audit.v1",
        runtime_intent_packet_ref: expect.stringContaining(":runtime_intent_packet"),
        capability_turn: true,
        runtime_loop_present: true,
        ok: true,
        all_subgoals_observed_terminal_authority: false,
      });
      expect(response.body?.runtime_intent_packet).toMatchObject({
        schema: "helix.runtime_intent_packet.v1",
        completion_authority: "agent_runtime_loop_and_goal_satisfaction",
        terminal_contract: expect.objectContaining({
          goal_kind: "doc_open_best",
          required_terminal_kinds: ["doc_open_receipt"],
        }),
        hints: expect.arrayContaining([
          expect.objectContaining({ authority: "hint_only" }),
        ]),
      });
      expect(response.body?.observation_review).toMatchObject({
        schema: "helix.observation_review.v1",
        supports_goal: true,
        runtime_next_action: "final",
        next_action: "final",
      });
      expect(response.body?.observation_review?.observation_refs?.length).toBeGreaterThan(0);
      expect(response.body?.terminal_artifact_kind).toBe("doc_open_receipt");
      expect(response.body?.doc_open_coverage).toMatchObject({
        schema: "helix.doc_open_coverage.v1",
        goal_kind: "doc_open_best",
        coverage: "complete",
      });
      expect(response.body?.doc_open_coverage?.required_items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "validated_doc_path", satisfied: true }),
          expect.objectContaining({ id: "doc_open_receipt", satisfied: true }),
        ]),
      );
      expect(response.body?.goal_satisfaction_evaluation?.satisfaction).toBe("satisfied");
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousResponse;
      if (previousResponseIndex === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = previousResponseIndex;
    }
  }, 60000);

  it("uses calculator output as a subgoal before answering compound photon prompts", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Explain photon energy using E=hf and calculate it for f=5e14 Hz.",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-compound-${Date.now()}`,
      })
      .expect(200);

    const action = findAction(response.body, "scientific-calculator", "solve_expression");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("calculator_solve");
    expect(action).toBeTruthy();
    expect(action?.args?.latex).toBe("6.62607015e-34*5e14");
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.route_reason_code).toBe("calculator_solve");
    expect(response.body?.source_target_intent?.target_source).toBe("calculator_stream");
    expect(response.body?.terminal_answer_authority?.route).toBe("calculator_solve");
    expect(response.body?.poison_audit?.ok).toBe(true);
    expect(response.body?.tool_observation_continuation).toMatchObject({
      schema: "helix.tool_observation_continuation.v1",
      expression: "6.62607015e-34*5e14",
      result: "3.313035e-19",
      continuation_required: true,
    });
    expect(response.body?.reasoning_continuation_result).toMatchObject({
      schema: "helix.reasoning_continuation_result.v1",
      final_answer_kind: "calculator_grounded_explanation",
    });
    expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
      artifact.kind === "tool_observation_continuation" &&
      artifact.payload?.expression === "6.62607015e-34*5e14"
    )).toBe(true);
    expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
      artifact.kind === "reasoning_continuation_result" &&
      artifact.payload?.final_answer_kind === "calculator_grounded_explanation"
    )).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toContain("A photon is a single quantum of electromagnetic radiation.");
    expect(String(response.body?.selected_final_answer ?? "")).toContain("Result: E = 3.313035e-19 J");
  }, 60000);

  it("routes multi-step calculator prompts through the compound chain on /ask/turn", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "A photon has frequency 6e14 Hz. Use the scientific calculator to find its wavelength and photon energy in joules and eV, then explain the result.",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-compound-chain-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.route_reason_code).toBe("calculator_solve / calculator_compound_chain");
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(response.body?.calculator_compound_plan?.subgoals?.map((subgoal: any) => subgoal.id)).toEqual([
      "wavelength",
      "photon_energy_j",
      "photon_energy_ev",
    ]);
    expect(response.body?.calculator_result_validations?.every((validation: any) => validation.satisfied)).toBe(true);
    expect(response.body?.agent_calculator_subgoal_plan).toMatchObject({
      schema: "helix.agent_calculator_subgoal_plan.v1",
      authority: "agent_step_decision",
      seed_plan_role: "hint_only_non_authoritative",
      rejected_deterministic_authority: true,
    });
    expect(response.body?.agent_calculator_subgoal_plan?.subgoals?.map((subgoal: any) => subgoal.id)).toEqual([
      "wavelength",
      "photon_energy_j",
      "photon_energy_ev",
    ]);
    expect(response.body?.calculator_loop_integrity).toMatchObject({
      schema: "helix.calculator_loop_integrity.v1",
      ok: true,
      violations: [],
    });
    expect(response.body?.calculator_loop_integrity?.receipt_decision_links?.map((link: any) => link.subgoal_id)).toEqual([
      "wavelength",
      "photon_energy_j",
      "photon_energy_ev",
    ]);
    expect(response.body?.calculator_loop_integrity?.receipt_decision_links?.every((link: any) => Boolean(link.decision_ref))).toBe(true);
    expect(response.body?.runtime_continuation_hints?.length).toBeGreaterThanOrEqual(3);
    expect(response.body?.runtime_continuation_hints?.every((hint: any) =>
      hint.schema === "helix.runtime_continuation_hint.v1" &&
      hint.source === "calculator_compound_chain" &&
      hint.authority === "hint_only_agent_must_decide" &&
      hint.migrated_to_agent_runtime_loop === true
    )).toBe(true);
    expect(response.body?.agent_runtime_loop_admission).toMatchObject({
      schema: "helix.agent_runtime_loop_admission.v1",
      admitted: true,
      reason: "runtime_continuation_hints_require_agent_step_decision",
    });
    expect(["record_only", "execute_or_record"]).toContain(response.body?.agent_runtime_loop_admission?.mode);
    expect(response.body?.agent_runtime_loop).toMatchObject({
      schema: "helix.agent_runtime_loop.v1",
      stop_reason: "terminal_satisfied",
    });
    expect(response.body?.agent_runtime_loop?.iterations?.filter((iteration: any) =>
      iteration.observation_role === "preobserved_tool_result" &&
      iteration.chosen_capability === "scientific-calculator.solve_expression"
    )).toHaveLength(3);
    expect(response.body?.agent_runtime_loop?.iterations?.filter((iteration: any) =>
      iteration.observation_role === "preobserved_tool_result"
    )?.every((iteration: any) =>
      Array.isArray(iteration.observed_artifact_refs) &&
      iteration.observed_artifact_refs.length > 0 &&
      iteration.produced_artifacts.includes("calculator_receipt")
    )).toBe(true);
    expect(response.body?.agent_runtime_loop?.iterations?.every((iteration: any) =>
      iteration.decision_source === "llm" || iteration.decision_source === "deterministic_policy_fallback"
    )).toBe(true);
    expect(response.body?.runtime_authority_audit).toMatchObject({
      schema: "helix.runtime_authority_audit.v1",
      runtime_intent_packet_ref: expect.stringContaining(":runtime_intent_packet"),
      capability_turn: true,
      runtime_loop_present: true,
      all_subgoals_observed_terminal_authority: false,
      ok: true,
    });
    expect(response.body?.runtime_intent_packet).toMatchObject({
      schema: "helix.runtime_intent_packet.v1",
      completion_authority: "agent_runtime_loop_and_goal_satisfaction",
      terminal_contract: expect.objectContaining({
        goal_kind: "calculator_solve",
        required_terminal_kinds: ["workstation_tool_evaluation"],
      }),
    });
    expect(response.body?.runtime_intent_packet?.hints?.every((hint: any) => hint.authority === "hint_only")).toBe(true);
    expect(response.body?.observation_review).toMatchObject({
      schema: "helix.observation_review.v1",
      supports_goal: true,
      runtime_next_action: "final",
    });
    expect(response.body?.runtime_authority_audit?.legacy_hint_count).toBeGreaterThanOrEqual(3);
    expect(response.body?.runtime_authority_audit?.migrated_hint_count).toBe(response.body?.runtime_authority_audit?.legacy_hint_count);
    expect(readGoalSatisfaction(response.body)?.satisfaction).toBe("satisfied");
    expect(response.body?.available_capabilities?.manifest_role).toBe("model_visible_tool_menu");
    expect(response.body?.available_capabilities?.model_visible_capability_keys).toEqual(
      expect.arrayContaining([
        "scientific-calculator.solve_expression",
        "docs-viewer.open",
        "workstation-notes.open",
        "situation-room.describe_visual_capture",
        "live-source.set_rate",
      ]),
    );
    expect(response.body?.initial_agent_step_decision).toMatchObject({
      schema: "helix.agent_step_decision.v1",
      decision_role: "agent_step_sampling_pass",
      chosen_capability: "scientific-calculator.solve_expression",
      next_step: "next_action",
    });
    expect(response.body?.agent_step_decision).toMatchObject({
      schema: "helix.agent_step_decision.v1",
      decision_role: "agent_step_sampling_pass",
      chosen_capability: "scientific-calculator.solve_expression",
      next_step: "answer",
    });
    expect(response.body?.agent_step_decision?.current_observations?.length).toBeGreaterThan(0);
    expect(response.body?.calculator_agent_subgoal_decisions?.length).toBeGreaterThanOrEqual(2);
    expect(response.body?.agent_step_loop?.final_state).toBe("answered");
    expect(response.body?.agent_step_loop?.steps?.map((step: any) => step.step_id)).toEqual([
      "subgoal_wavelength",
      "subgoal_photon_energy_j",
      "subgoal_photon_energy_ev",
      "post_observation",
    ]);
    expect(response.body?.agent_step_loop?.steps?.slice(0, 3).every((step: any) =>
      step.next_step === "next_action" &&
      step.chosen_capability === "scientific-calculator.solve_expression"
    )).toBe(true);
    expect(response.body?.observation_review).toMatchObject({
      schema: "helix.observation_review.v1",
      does_it_satisfy_goal: true,
      next_action: "final",
    });
    expect(String(response.body?.selected_final_answer ?? "")).toContain("Wavelength:");
    expect(String(response.body?.selected_final_answer ?? "")).toContain("Photon energy:");
  }, 60000);

  it("uses the generic calculator planner for broader force prompts", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "A 1200 kg car accelerates at 3 m/s^2. Use the scientific calculator to compute the force.",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-generic-force-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.calculator_candidate_hints).toMatchObject({
      schema: "helix.calculator_candidate_hints.v1",
      authority: "hint_only",
    });
    expect(response.body?.calculator_planner_result?.authority).toBe("deterministic_generic_fallback");
    expect(response.body?.calculator_compound_plan?.subgoals?.map((subgoal: any) => subgoal.id)).toEqual(["force"]);
    expect(response.body?.calculator_compound_plan?.subgoals?.[0]).toMatchObject({
      expression: "1200*3",
      expected_quantity: "force",
      expected_unit: "N",
    });
    expect(response.body?.calculator_result_validations?.every((validation: any) => validation.satisfied)).toBe(true);
    expect(response.body?.calculator_loop_integrity?.ok).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toContain("3600 N");
  }, 60000);

  it("derives acceleration from rest-to-final-speed prompts before force and kinetic energy", async () => {
    const app = createApp();
    const previousComposerResponse = process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
    process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE =
      "The calculations give acceleration = 3 m/s^2, force = 9 N, and final kinetic energy = 216 J. The results show that the requested values follow directly from the given mass, final speed, and time, without inventing extra measurements.";
    let response: any;
    try {
      response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question:
            "A 3 kg cart starts from rest and reaches 12 m/s in 4 seconds. Use the scientific calculator as a tool to compute acceleration, force, and final kinetic energy. Then explain how the calculator results support the answer without inventing extra measurements.",
          mode: "read",
          debug: true,
          sessionId: `e52-calculator-rest-kinematics-${Date.now()}`,
        })
        .expect(200);
    } finally {
      if (previousComposerResponse === undefined) {
        delete process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
      } else {
        process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = previousComposerResponse;
      }
    }

    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.terminal_error_code ?? null).toBeNull();
    expect(response.body?.calculator_plan_coverage).toMatchObject({
      schema: "helix.calculator_plan_coverage.v1",
      coverage: "complete",
      missing_requirement_ids: [],
    });
    expect(response.body?.calculator_compound_plan?.subgoals?.map((subgoal: any) => subgoal.id)).toEqual([
      "acceleration",
      "force",
      "final_kinetic_energy",
    ]);
    expect(response.body?.calculator_compound_plan?.subgoals?.map((subgoal: any) => subgoal.expression)).toEqual([
      "12/4",
      "3*3",
      "0.5*3*12^2",
    ]);
    expect(response.body?.calculator_subgoal_receipts?.map((receipt: any) => receipt.result_text)).toEqual([
      "3",
      "9",
      "216",
    ]);
    expect(response.body?.calculator_result_validations?.every((validation: any) => validation.satisfied)).toBe(true);
    expect(response.body?.calculator_loop_integrity?.ok).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toContain("3 m/s^2");
    expect(String(response.body?.selected_final_answer ?? "")).toContain("9 N");
    expect(String(response.body?.selected_final_answer ?? "")).toContain("216 J");
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/interpretation of these results is missing/i);
  }, 60000);

  it("uses the generic calculator planner for pendulum period prompts", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "A pendulum is 2 m long. Use the scientific calculator to estimate its small-angle period.",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-generic-pendulum-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.calculator_planner_result?.authority).toBe("deterministic_generic_fallback");
    expect(response.body?.calculator_compound_plan?.subgoals?.map((subgoal: any) => subgoal.id)).toEqual(["pendulum_period"]);
    expect(response.body?.calculator_compound_plan?.subgoals?.[0]).toMatchObject({
      expected_quantity: "time",
      expected_unit: "s",
    });
    expect(String(response.body?.calculator_compound_plan?.subgoals?.[0]?.expression ?? "")).toContain("sqrt(2/9.80665)");
    expect(response.body?.calculator_result_validations?.every((validation: any) => validation.satisfied)).toBe(true);
    expect(response.body?.calculator_loop_integrity?.ok).toBe(true);
    expect(String(response.body?.selected_final_answer ?? "")).toContain("2.837");
  }, 60000);

  it("keeps calculator planner result in debug artifacts and carries de Broglie momentum units", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "A particle has de Broglie wavelength 0.25 nm. Use the scientific calculator to compute its momentum.",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-debroglie-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.calculator_planner_result).toMatchObject({
      schema: "helix.calculator_planner_result.v1",
    });
    expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
      artifact.kind === "calculator_planner_result" &&
      artifact.payload?.schema === "helix.calculator_planner_result.v1"
    )).toBe(true);
    expect(response.body?.calculator_compound_plan?.subgoals?.[0]).toMatchObject({
      id: "de_broglie_momentum",
      expected_quantity: "momentum",
      expected_unit: "kg*m/s",
    });
    expect(response.body?.calculator_subgoal_receipts?.[0]).toMatchObject({
      result_unit: "kg*m/s",
      result_quantity: "momentum",
    });
    expect(response.body?.calculator_subgoal_receipts?.[0]?.calculator_setup).toMatchObject({
      result_dimension_signature: "L M T^-1",
    });
    expect(String(response.body?.selected_final_answer ?? "")).toContain("kg*m/s");
  }, 60000);

  it("accepts model-authored calculator planner subgoals as the calculator authority", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousAgentResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    const previousAgentIndex = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
    const previousCalculatorResponse = process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";
    process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = JSON.stringify({
      subgoals: [
        {
          id: "gravitational_potential_energy",
          label: "Compute gravitational potential energy",
          expression: "5*9.80665*10",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "U = m g h",
          assumptions: ["Use standard gravity."],
          variables: [
            { symbol: "m", value: "5", unit: "kg", meaning: "mass" },
            { symbol: "g", value: "9.80665", unit: null, meaning: "standard gravity numeric value" },
            { symbol: "h", value: "10", unit: "m", meaning: "height" },
          ],
        },
      ],
    });
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "The model-authored calculator plan has one required numeric subgoal.",
        args: { latex: "5*9.80665*10", compound_subgoal_id: "gravitational_potential_energy" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        commentary: {
          turn_purpose: "Compute the requested gravitational potential energy.",
          why_this_capability: "The calculator can evaluate the numeric expression.",
          expected_artifacts: "calculator receipt",
          what_would_make_this_done: "A validated numeric energy result.",
          observation_summary: "No calculator observation yet.",
          next_step_reason: "Run the calculator subgoal.",
        },
        confidence: 0.95,
      },
      {
        next_step: "answer",
        chosen_capability: null,
        reason: "The calculator receipt satisfies the requested numeric result.",
        args: {},
        expected_artifacts: ["workstation_tool_evaluation"],
        commentary: {
          turn_purpose: "Answer from the calculator receipt.",
          why_this_capability: "No more tool call is needed.",
          expected_artifacts: "workstation evaluation",
          what_would_make_this_done: "The receipt-backed result is present.",
          observation_summary: "The calculator result is available.",
          next_step_reason: "Answer now.",
        },
        confidence: 0.96,
      },
    ]);
    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question: "A 5 kg mass is lifted 10 m. Use the scientific calculator to compute gravitational potential energy.",
          mode: "read",
          debug: true,
          sessionId: `e52-calculator-model-planner-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.calculator_planner_result?.authority).toBe("model_authored_calculator_planner");
      expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
        artifact.kind === "calculator_planner_result" &&
        artifact.payload?.authority === "model_authored_calculator_planner"
      )).toBe(true);
      expect(response.body?.calculator_compound_plan?.subgoals?.[0]).toMatchObject({
        id: "gravitational_potential_energy",
        expression: "5*9.80665*10",
        expected_quantity: "energy",
        expected_unit: "J",
      });
      expect(response.body?.agent_calculator_subgoal_plan?.model_authored).toBe(true);
      expect(response.body?.calculator_loop_integrity?.violations).toEqual([]);
      expect(response.body?.calculator_loop_integrity?.violations).toEqual([]);
      expect(response.body?.calculator_loop_integrity?.ok).toBe(true);
      expect(String(response.body?.selected_final_answer ?? "")).toContain("490.3325 J");
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousAgentResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousAgentResponse;
      if (previousAgentIndex === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = previousAgentIndex;
      if (previousCalculatorResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = previousCalculatorResponse;
    }
  }, 60000);

  it("does not mark long calculator prompts satisfied when planner fallback under-covers requirements", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousAgentResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    const previousAgentIndex = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
    const previousCalculatorResponse = process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
    const previousRepairResponse = process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Execute the repaired calculator subgoal.",
        args: { latex: "0.5*0.5*12^2", compound_subgoal_id: "initial_kinetic_energy" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        confidence: 0.95,
      },
      {
        next_step: "answer",
        chosen_capability: null,
        reason: "Stop after the observed repaired subgoal; coverage will decide whether this is sufficient.",
        args: {},
        expected_artifacts: ["workstation_tool_evaluation"],
        confidence: 0.9,
      },
    ]);
    process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = "not valid json";
    process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE = JSON.stringify({
      subgoals: [
        {
          id: "initial_kinetic_energy",
          label: "Compute initial kinetic energy only",
          expression: "0.5*0.5*12^2",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "KE = 1/2 m v^2",
        },
      ],
    });
    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question: "Use the scientific calculator as a workstation tool and answer every part. A 0.50 kg cart rolls at 12 m/s on a level track, then climbs a ramp. First compute its initial kinetic energy. Second compute the maximum height it could reach if all kinetic energy became gravitational potential energy using g = 9.80665 m/s^2. Third compute the speed it would have after reaching a height of 3.0 m, assuming no drag and no rolling losses. Fourth compare the initial kinetic energy to the remaining kinetic energy at 3.0 m. In the final answer, show the formulas, the calculator expressions, the numeric results with units, and a short interpretation of what the energy conversion means.",
          mode: "read",
          debug: true,
          sessionId: `e52-calculator-long-undercovered-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.calculator_planner_result?.authority).toBe("model_repaired_calculator_planner");
      expect(response.body?.calculator_planner_repair_result).toMatchObject({
        schema: "helix.calculator_planner_repair_result.v1",
        attempted: true,
        repaired: true,
      });
      expect(response.body?.calculator_plan_coverage?.coverage).not.toBe("complete");
      expect(response.body?.calculator_plan_coverage?.missing_requirement_ids).toEqual(
        expect.arrayContaining(["maximum_height", "speed_after_height", "energy_comparison"]),
      );
      expect(response.body?.goal_satisfaction_evaluation?.satisfaction).toBe("not_satisfied");
      expect(response.body?.final_status).toBe("final_failure");
      expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
        artifact.kind === "typed_failure" &&
        artifact.payload?.error_code === "calculator_requirement_coverage_incomplete"
      )).toBe(true);
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousAgentResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousAgentResponse;
      if (previousAgentIndex === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = previousAgentIndex;
      if (previousCalculatorResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = previousCalculatorResponse;
      if (previousRepairResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE = previousRepairResponse;
    }
  }, 60000);

  it("uses receipt coverage and a post-observation composer for long calculator prompts", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousAgentResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    const previousAgentIndex = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
    const previousCalculatorResponse = process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
    const previousRepairResponse = process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE;
    const previousFinalAnswer = process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";
    process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = "not valid json";
    process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE = JSON.stringify({
      subgoals: [
        {
          id: "initial_kinetic_energy",
          label: "Compute initial kinetic energy",
          expression: "0.5*0.5*12^2",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "KE = 1/2 m v^2",
        },
        {
          id: "maximum_height",
          label: "Compute maximum height from initial kinetic energy",
          expression: "36/(0.5*9.80665)",
          expected_quantity: "length",
          expected_unit: "m",
          equation: "h = KE / (m g)",
        },
        {
          id: "remaining_kinetic_energy",
          label: "Compute remaining kinetic energy at 3 m",
          expression: "36-(0.5*9.80665*3)",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "KE_remaining = KE_initial - m g h",
        },
        {
          id: "speed_after_height",
          label: "Compute speed at 3 m from remaining kinetic energy",
          expression: "sqrt(2*21.290025/0.5)",
          expected_quantity: "speed",
          expected_unit: "m/s",
          equation: "v = sqrt(2 KE_remaining / m)",
        },
        {
          id: "energy_comparison",
          label: "Compare remaining kinetic energy to initial kinetic energy",
          expression: "21.290025/36",
          expected_quantity: "dimensionless",
          expected_unit: null,
          equation: "ratio = KE_remaining / KE_initial",
        },
      ],
  });

    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the first requested numeric subgoal.",
        args: { latex: "0.5*0.5*12^2", compound_subgoal_id: "initial_kinetic_energy" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        confidence: 0.95,
      },
      {
        next_step: "answer",
        chosen_capability: null,
        reason: "The final decision should answer after coverage is complete.",
        args: {},
        expected_artifacts: ["workstation_tool_evaluation"],
        confidence: 0.96,
      },
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the next requested numeric subgoal.",
        args: { latex: "36/(0.5*9.80665)", compound_subgoal_id: "maximum_height" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        confidence: 0.95,
      },
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the remaining kinetic energy subgoal.",
        args: { latex: "36-(0.5*9.80665*3)", compound_subgoal_id: "remaining_kinetic_energy" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        confidence: 0.95,
      },
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the speed subgoal.",
        args: { latex: "sqrt(2*21.290025/0.5)", compound_subgoal_id: "speed_after_height" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        confidence: 0.95,
      },
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the comparison subgoal.",
        args: { latex: "21.290025/36", compound_subgoal_id: "energy_comparison" },
        expected_artifacts: ["calculator_receipt", "workstation_tool_evaluation"],
        confidence: 0.95,
      },
    ]);
    process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = [
      "Initial kinetic energy: Formula KE = 1/2 m v^2. Calculator expression 0.5*0.5*12^2. Result: 36 J.",
      "Maximum height: Formula h = KE / (m g). Calculator expression 36/(0.5*9.80665). Result: 7.34195673344 m.",
      "Remaining kinetic energy at 3.0 m: Formula KE_remaining = KE_initial - m g h. Calculator expression 36-(0.5*9.80665*3). Result: 21.290025 J.",
      "Speed at 3.0 m: Formula v = sqrt(2 KE_remaining / m). Calculator expression sqrt(2*21.290025/0.5). Result: 9.22822301421 m/s.",
      "Energy comparison: Calculator expression 21.290025/36. Result: 0.591389583333, so about 59.1% of the initial kinetic energy remains.",
      "Interpretation: the cart trades kinetic energy for gravitational potential energy as it climbs; at 3.0 m it has less kinetic energy and therefore a lower speed.",
    ].join("\n");
    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question: "Use the scientific calculator as a workstation tool and answer every part. A 0.50 kg cart rolls at 12 m/s on a level track, then climbs a ramp. First compute its initial kinetic energy. Second compute the maximum height it could reach if all kinetic energy became gravitational potential energy using g = 9.80665 m/s^2. Third compute the speed it would have after reaching a height of 3.0 m, assuming no drag and no rolling losses. Fourth compare the initial kinetic energy to the remaining kinetic energy at 3.0 m. In the final answer, show the formulas, the calculator expressions, the numeric results with units, and a short interpretation of what the energy conversion means.",
          mode: "read",
          debug: true,
          sessionId: `e52-calculator-long-covered-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.calculator_planner_result?.authority).toBe("model_repaired_calculator_planner");
      expect(response.body?.calculator_planner_repair_result).toMatchObject({
        schema: "helix.calculator_planner_repair_result.v1",
        attempted: true,
        repaired: true,
        proposed_subgoal_count: 5,
      });
      expect(response.body?.calculator_problem_requirements?.requirements?.map((requirement: any) => requirement.id)).toEqual(
        expect.arrayContaining(["initial_kinetic_energy", "maximum_height", "speed_after_height", "energy_comparison"]),
      );
      expect(response.body?.calculator_plan_coverage).toMatchObject({
        schema: "helix.calculator_plan_coverage.v1",
        coverage: "complete",
        missing_requirement_ids: [],
      });
      expect(response.body?.agent_loop_budget).toMatchObject({
        schema: "helix.agent_loop_budget.v1",
        profile: "calculator_compound",
        max_tool_calls: 8,
        exhausted: false,
      });
      expect(response.body?.agent_loop_budget?.consumed_tool_calls).toBeGreaterThanOrEqual(1);
      expect(response.body?.final_answer_draft).toMatchObject({
        schema: "helix.final_answer_draft.v1",
        authority: "llm_post_observation_composer",
        composer_scope: "source_tool_backed",
        unsupported_claim_guard: {
          source_targeted: true,
          policy: "selected_artifacts_only",
        },
      });
      expect(response.body?.calculator_final_answer_draft).toMatchObject({
        schema: "helix.calculator_final_answer_draft.v1",
        authority: "llm_post_observation_composer",
        composer_schema: "helix.final_answer_draft.v1",
      });
      expect(response.body?.calculator_loop_integrity?.ok).toBe(true);
      expect(response.body?.goal_satisfaction_evaluation?.satisfaction).toBe("satisfied");
      expect(response.body?.final_status).toBe("final_answer");
      expect(String(response.body?.selected_final_answer ?? "")).toContain("Initial kinetic energy");
      expect(String(response.body?.selected_final_answer ?? "")).toContain("Maximum height");
      expect(String(response.body?.selected_final_answer ?? "")).toContain("9.22822301421 m/s");
      expect(String(response.body?.selected_final_answer ?? "")).toContain("Interpretation");
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousAgentResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousAgentResponse;
      if (previousAgentIndex === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = previousAgentIndex;
      if (previousCalculatorResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = previousCalculatorResponse;
      if (previousRepairResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_REPAIR_TEST_RESPONSE = previousRepairResponse;
      if (previousFinalAnswer === undefined) delete process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = previousFinalAnswer;
    }
  }, 60000);

  it("does not treat input speed as a requested speed-after-height output", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousPlannerResponse = process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
    const previousFinalAnswer = process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
    const previousAgentResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    const previousAgentIndex = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = JSON.stringify({
      subgoals: [
        {
          id: "compute_initial_kinetic_energy",
          label: "Compute initial kinetic energy",
          expression: "0.5*2*15^2",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "KE = 0.5*m*v^2",
          variables: [
            { symbol: "m", value: "2", unit: "kg", meaning: "mass" },
            { symbol: "v", value: "15", unit: "m/s", meaning: "speed" },
          ],
        },
        {
          id: "compute_maximum_height",
          label: "Compute maximum height",
          expression: "0.5*2*15^2/(2*9.80665)",
          expected_quantity: "length",
          expected_unit: "m",
          equation: "h = KE/(m*g)",
          depends_on: ["compute_initial_kinetic_energy"],
          variables: [
            { symbol: "m", value: "2", unit: "kg", meaning: "mass" },
            { symbol: "g", value: "9.80665", unit: "m/s^2", meaning: "gravity" },
          ],
        },
      ],
    });
    process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = [
      "Initial kinetic energy: 225 J.",
      "Maximum height: 11.471807396001692729 m.",
    ].join("\n");
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute kinetic energy.",
        args: { latex: "0.5*2*15^2", compound_subgoal_id: "compute_initial_kinetic_energy" },
      },
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute maximum height from the energy conversion.",
        args: { latex: "0.5*2*15^2/(2*9.80665)", compound_subgoal_id: "compute_maximum_height" },
      },
      {
        next_step: "answer",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Both requested calculator results are receipt-backed.",
      },
    ]);
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";

    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question:
            "Use the scientific calculator to compute kinetic energy for mass 2 kg and speed 15 m per s then compute maximum height with g 9.80665.",
          mode: "read",
          debug: true,
          sessionId: `e52-calculator-input-speed-${Date.now()}`,
        })
        .expect(200);

      const requirementIds = response.body?.calculator_problem_requirements?.requirements?.map((requirement: any) => requirement.id) ?? [];
      expect(requirementIds).toEqual(expect.arrayContaining(["initial_kinetic_energy", "maximum_height"]));
      expect(requirementIds).not.toContain("speed_after_height");
      expect(response.body?.calculator_plan_coverage).toMatchObject({
        coverage: "complete",
        missing_requirement_ids: [],
      });
      expect(response.body?.goal_satisfaction_evaluation?.satisfaction).toBe("satisfied");
      expect(response.body?.final_answer_source).toBe("workstation_tool_evaluation");
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousPlannerResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = previousPlannerResponse;
      if (previousFinalAnswer === undefined) delete process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = previousFinalAnswer;
      if (previousAgentResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousAgentResponse;
      if (previousAgentIndex === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = previousAgentIndex;
    }
  }, 60000);

  it("allows rounded calculator final answers when numbers are receipt-backed", async () => {
    const previousFlag = process.env.HELIX_AGENT_STEP_DECISION_LLM;
    const previousPlannerResponse = process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
    const previousFinalAnswer = process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
    const previousAgentResponse = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
    const previousAgentIndex = process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
    process.env.HELIX_AGENT_STEP_DECISION_LLM = "1";
    process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = JSON.stringify({
      subgoals: [
        {
          id: "compute_kinetic_energy",
          label: "Compute kinetic energy",
          expression: "0.5*0.2*18^2",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "KE = 0.5*m*v^2",
          variables: [
            { symbol: "m", value: "0.2", unit: "kg", meaning: "mass" },
            { symbol: "v", value: "18", unit: "m/s", meaning: "speed" },
          ],
        },
        {
          id: "compute_max_height",
          label: "Compute max height",
          expression: "0.5*0.2*18^2/(0.2*9.80665)",
          expected_quantity: "length",
          expected_unit: "m",
          equation: "h = KE/(m*g)",
          depends_on: ["compute_kinetic_energy"],
          variables: [
            { symbol: "m", value: "0.2", unit: "kg", meaning: "mass" },
            { symbol: "g", value: "9.80665", unit: "m/s^2", meaning: "gravity" },
          ],
        },
      ],
    });
    process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = [
      "Formula: KE = 0.5*m*v^2. Calculator expression: 0.5*0.2*18^2. Kinetic energy result: 32.4 J.",
      "Formula: h = KE/(m*g). Calculator expression: 0.5*0.2*18^2/(0.2*9.80665). Maximum height result: 16.52 m.",
      "Units: J for kinetic energy and m for height.",
    ].join("\n");
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = JSON.stringify([
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the kinetic-energy subgoal with the calculator.",
        args: { latex: "0.5*0.2*18^2", compound_subgoal_id: "compute_kinetic_energy" },
      },
      {
        next_step: "next_action",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "Compute the maximum-height subgoal with the calculator.",
        args: { latex: "0.5*0.2*18^2/(0.2*9.80665)", compound_subgoal_id: "compute_max_height" },
      },
      {
        next_step: "answer",
        chosen_capability: "scientific-calculator.solve_expression",
        reason: "All calculator receipts are observed and the final answer can be composed.",
      },
    ]);
    process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = "0";

    try {
      const app = createApp();
      const response = await request(app)
        .post("/api/agi/ask/turn")
        .send({
          question:
            "Use scientific calculator. A 0.20 kg ball moves at 18 m/s. Compute kinetic energy and max height if all kinetic energy becomes mgh. Show formulas expressions results units.",
          mode: "read",
          debug: true,
          sessionId: `e52-calculator-rounded-${Date.now()}`,
        })
        .expect(200);

      expect(response.body?.calculator_loop_integrity?.violations).toEqual([]);
      expect(response.body?.calculator_loop_integrity?.ok).toBe(true);
      expect(response.body?.final_answer_source).toBe("workstation_tool_evaluation");
      expect(response.body?.selected_final_answer ?? response.body?.answer).toContain("16.52 m");
    } finally {
      if (previousFlag === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_LLM;
      else process.env.HELIX_AGENT_STEP_DECISION_LLM = previousFlag;
      if (previousPlannerResponse === undefined) delete process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_PLANNER_TEST_RESPONSE = previousPlannerResponse;
      if (previousFinalAnswer === undefined) delete process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE;
      else process.env.HELIX_CALCULATOR_FINAL_ANSWER_TEST_RESPONSE = previousFinalAnswer;
      if (previousAgentResponse === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE = previousAgentResponse;
      if (previousAgentIndex === undefined) delete process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX;
      else process.env.HELIX_AGENT_STEP_DECISION_TEST_RESPONSE_INDEX = previousAgentIndex;
    }
  }, 60000);

  it("routes calculator live-source prompts through the workstation tool loop", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Start the calculator as a live source for 3*x+9=0 and explain the first tick.",
        mode: "read",
        debug: true,
        sessionId: `e52-calculator-live-source-${Date.now()}`,
      })
      .expect(200);

    const action = findAction(response.body, "scientific-calculator", "start_equation_live_source");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("calculator_live_source");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("workstation_tool_evaluation");
    expect(action).toBeTruthy();
    expect(action?.args?.latex).toBe("3*x+9=0");
    expect(action?.args?.equation).toBe("3*x+9=0");
    expect(response.body?.route_reason_code).toBe("calculator_live_source");
    expect(response.body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(response.body?.source_target_intent?.target_source).toBe("calculator_stream");
    expect(readGoalSatisfaction(response.body)?.satisfaction).toBe("satisfied");
    expect(readGoalSatisfaction(response.body)?.next_decision).toBe("allow_terminal");
    expect(response.body?.terminal_error_code ?? null).toBeNull();
    expect(String(response.body?.selected_final_answer ?? "")).not.toMatch(/live answer environment|capability_lifecycle_incomplete/i);
  }, 60000);

  it("keeps note creation in the workstation tool loop even when note body mentions reasoning policy", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Create a workstation note titled Tool Loop Test with body Calculator tools should inform the answer without hijacking general reasoning.",
        mode: "read",
        debug: true,
        sessionId: `e52-note-tool-loop-${Date.now()}`,
      })
      .expect(200);

    const action = findAction(response.body, "workstation-notes", "create_note");
    expect(action).toBeTruthy();
    expect(action?.args?.title).toBe("Tool Loop Test");
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("workstation-notes.create_note");
    expect(response.body?.agent_step_decision?.candidate_capabilities).toContain("workstation-notes.create_note");
    expect(response.body?.agent_step_decision?.chosen_capability).toBe("workstation-notes.create_note");
    expect(response.body?.final_answer_source).not.toBe("typed_failure");
    expect(response.body?.terminal_error_code ?? null).toBeNull();
    expect(response.body?.terminal_artifact_kind).toBe("note_update_receipt");
    expect(response.body?.notes_mutation_coverage).toMatchObject({
      schema: "helix.notes_mutation_coverage.v1",
      goal_kind: "note_mutation",
      coverage: "complete",
      next_decision: "allow_terminal",
    });
    expect(response.body?.poison_audit?.ok).toBe(true);
    expect(response.body?.poison_audit?.violations ?? []).toEqual([]);
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
