import { describe, expect, it } from "vitest";
import { evaluateWorkstationToolReceipt } from "../services/helix-ask/workstation-tool-evaluator";

describe("Helix Ask workstation receipt evaluator theory receipts", () => {
  it("marks physics context plans with next actions as needing follow-up tools", () => {
    const evaluation = evaluateWorkstationToolReceipt({
      thread_id: "thread:test",
      receipt: {
        ok: true,
        panel_id: "theory-badge-graph",
        action_id: "plan_calculation_context",
        artifact: {
          kind: "helix_physics_calculation_context_plan",
          next_actions: [{ action_id: "theory-badge-graph.solve_calculator_loadout" }],
        },
      },
    });

    expect(evaluation.result).toBe("needs_followup_tool");
    expect(evaluation.summary).toMatch(/proposed follow-up/i);
  });
});
