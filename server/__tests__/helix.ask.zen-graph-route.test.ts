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

const parseSseEvents = (text: string): Array<{ event: string; data: any }> => {
  return text
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const eventLine = chunk.split(/\n/).find((line) => line.startsWith("event: "));
      const dataLine = chunk.split(/\n/).find((line) => line.startsWith("data: "));
      return {
        event: eventLine?.slice("event: ".length) ?? "message",
        data: dataLine ? JSON.parse(dataLine.slice("data: ".length)) : null,
      };
    });
};

describe("Helix Ask ZenGraph reflection route", () => {
  it("routes Zen Badge Graph and Fruition prompts through non-terminal ZenGraph evidence", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Use the Zen Badge Graph to reflect this situation: I need to respond to a teammate who made an uncertain safety claim. Plot direct observation, right speech, and two-key review, then show what Fruition would solve before any action.",
        mode: "read",
        debug: true,
        sessionId: `zen-graph-route-${Date.now()}`,
      });

    if (response.status !== 200) {
      console.error(JSON.stringify({
        error: response.body?.error,
        route: response.body?.route,
        route_reason_code: response.body?.route_reason_code,
        final_answer_source: response.body?.final_answer_source,
        terminal_artifact_kind: response.body?.terminal_artifact_kind,
        invariant_violations: response.body?.invariant_violations,
        workstation_intent: response.body?.planner_contract?.workstation_tool_plan?.intent,
        selection_fail_reason: response.body?.planner_contract?.selection_fail_reason,
      }, null, 2));
    }
    expect(response.status).toBe(200);

    const body = response.body;
    const answer = String(body?.selected_final_answer ?? body?.answer ?? body?.text ?? "");

    expect(body?.route_reason_code).toBe("zen_graph_reflection");
    expect(body?.route).toBe("zen_graph_reflection");
    expect(body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(body?.canonical_goal_frame?.goal_kind).toBe("zen_graph_reflection");
    expect(body?.canonical_goal_frame?.required_terminal_kind).toBe("workstation_tool_evaluation");
    expect(body?.route_product_contract?.allowed_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["workstation_tool_evaluation"]),
    );
    expect(body?.route_product_contract?.forbidden_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["workspace_action_receipt", "model_synthesized_answer", "direct_answer_text"]),
    );
    expect(body?.workstation_tool_plan?.intent).toBe("zen_graph_reflection");
    expect(body?.source_target_intent?.suppressed_routes).toEqual(
      expect.arrayContaining(["calculator_solve", "calculator_compound_chain"]),
    );
    expect(body?.ideology_context_reflection?.schemaVersion).toBe("ideology_context_reflection/v1");
    expect(body?.zen_badge_locator?.schemaVersion).toBe("zen_badge_locator/v1");
    expect(body?.fruition_procedure_expression?.schemaVersion).toBe("fruition_procedure_expression/v1");
    expect(body?.zen_graph_reflection_tool_result?.admissions?.[0]?.authority?.agent_executable).toBe(false);
    expect(body?.action_envelope?.workstation_actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          panel_id: "fruition-calculator",
          action_id: "open",
        }),
      ]),
    );
    expect(body?.action_envelope?.workstation_actions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          panel_id: "scientific-calculator",
        }),
      ]),
    );
    expect(answer).toMatch(/Zen Badge Graph/i);
    expect(answer).toMatch(/Fruition procedure expression/i);
    expect(answer).toMatch(/not a character verdict|not.*terminal authority|execution permission/i);
  }, 60_000);

  it("streams Zen Badge Graph and Fruition prompts through the same workstation evaluation terminal product", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn/stream")
      .send({
        question:
          "Use the Zen Badge Graph to reflect this situation: I need to respond to a teammate who made an uncertain safety claim. Plot direct observation, right speech, and two-key review, then show what Fruition would solve before any action.",
        mode: "read",
        debug: true,
        sessionId: `zen-graph-stream-route-${Date.now()}`,
      });

    expect(response.status).toBe(200);
    const events = parseSseEvents(response.text);
    const terminalEvent = events.find((entry) => entry.event === "turn_transcript_event" && entry.data?.source_event_type === "terminal_answer");
    const finalEvent = events.find((entry) => entry.event === "turn_final");
    const body = finalEvent?.data;

    expect(terminalEvent?.data?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(body?.route_reason_code).toBe("zen_graph_reflection");
    expect(body?.route).toBe("zen_graph_reflection");
    expect(body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(body?.canonical_goal_frame?.goal_kind).toBe("zen_graph_reflection");
    expect(body?.workstation_tool_plan?.intent).toBe("zen_graph_reflection");
    expect(body?.ideology_context_reflection?.schemaVersion).toBe("ideology_context_reflection/v1");
    expect(body?.zen_badge_locator?.schemaVersion).toBe("zen_badge_locator/v1");
    expect(body?.fruition_procedure_expression?.schemaVersion).toBe("fruition_procedure_expression/v1");
    expect(body?.zen_graph_reflection_tool_result?.admissions?.[0]?.authority?.agent_executable).toBe(false);
    expect(body?.terminal_answer_authority?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(body?.terminal_answer_authority?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(body?.terminal_surface_parity_invariant?.ok).toBe(true);
    expect(body?.terminal_surface_parity_invariant?.failure_codes ?? []).not.toEqual(
      expect.arrayContaining(["controller_decision_not_terminal", "controller_goal_terminal_mismatch"]),
    );
    expect(String(body?.selected_final_answer ?? body?.answer ?? body?.text ?? "")).toMatch(/Fruition procedure expression/i);
  }, 60_000);

  it("keeps the desktop Ask endpoint and debug export aligned for ZenGraph/Fruition evidence", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask")
      .send({
        question: "Use the Zen Badge Graph to plot right speech and two-key review, then load the comparison into Fruition.",
        mode: "read",
        debug: true,
        sessionId: `zen-graph-desktop-route-${Date.now()}`,
      });

    expect(response.status).toBe(200);
    const body = response.body;
    expect(body?.route_reason_code).toBe("zen_graph_reflection");
    expect(body?.route).toBe("zen_graph_reflection");
    expect(body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");
    expect(body?.canonical_goal_frame).toMatchObject({
      goal_kind: "zen_graph_reflection",
      required_terminal_kind: "workstation_tool_evaluation",
    });
    expect(body?.route_product_contract?.allowed_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["workstation_tool_evaluation"]),
    );
    expect(body?.route_product_contract?.forbidden_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["workspace_action_receipt", "model_synthesized_answer", "direct_answer_text"]),
    );
    expect(body?.ideology_context_reflection?.schemaVersion).toBe("ideology_context_reflection/v1");
    expect(body?.zen_badge_locator?.schemaVersion).toBe("zen_badge_locator/v1");
    expect(body?.fruition_procedure_expression?.schemaVersion).toBe("fruition_procedure_expression/v1");
    expect(body?.action_envelope?.workstation_actions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          panel_id: "docs-viewer",
        }),
      ]),
    );
    expect(body?.terminal_answer_authority).toMatchObject({
      final_answer_source: "workstation_tool_evaluation",
      terminal_artifact_kind: "workstation_tool_evaluation",
      route: "zen_graph_reflection",
    });
    expect(body?.terminal_surface_parity_invariant?.ok).toBe(true);
    expect(body?.final_route_reconciliation?.ok).toBe(true);
    expect(body?.solver_controller_decision).toMatchObject({
      decision: "allow_terminal",
      canonical_goal_kind: "zen_graph_reflection",
      required_terminal_kind: "workstation_tool_evaluation",
      selected_terminal_artifact_kind: "workstation_tool_evaluation",
    });

    const debugExport = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(String(body?.turn_id))}/debug-export`)
      .expect(200);
    const exported = debugExport.body?.payload;
    expect(exported?.resolved_turn_summary).toMatchObject({
      resolved_route_label: "zen_graph_reflection",
      terminal_artifact_kind: "workstation_tool_evaluation",
    });
    expect(exported?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(exported?.solver_controller_summary).toMatchObject({
      decision: "allow_terminal",
      final_route: "zen_graph_reflection",
      required_terminal_kind: "workstation_tool_evaluation",
      selected_terminal_artifact_kind: "workstation_tool_evaluation",
      final_route_reconciliation_ok: true,
    });
    expect(exported?.terminal_surface_parity_invariant?.ok).toBe(true);
  }, 60_000);
});
