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

  it("accepts theory reflection receipts as evidence only", () => {
    const evaluation = evaluateWorkstationToolReceipt({
      thread_id: "thread:test",
      receipt: {
        ok: true,
        panel_id: "theory-badge-graph",
        action_id: "reflect_discussion_context",
        artifact: {
          kind: "theory_context_reflection",
          assistant_answer: false,
          raw_content_included: false,
          terminal_eligible: false,
          panel_generated_answer: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
          evidence_for_ask: {
            summary: "The discussion appears near Warp / GR / NHM2 and QEI / Stress-Energy.",
            claimBoundaries: ["Diagnostic context only."],
          },
          artifact_v1: {
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
            panel_generated_answer: false,
          },
        },
      },
    });

    expect(evaluation.result).toBe("supports_subgoal");
    expect(evaluation.summary).toMatch(/evidence only/i);
    expect(evaluation.summary).toMatch(/Warp \/ GR \/ NHM2/);
  });

  it("rejects terminal-eligible theory reflection receipts", () => {
    const evaluation = evaluateWorkstationToolReceipt({
      thread_id: "thread:test",
      receipt: {
        ok: true,
        panel_id: "theory-badge-graph",
        action_id: "reflect_discussion_context",
        artifact: {
          kind: "theory_context_reflection",
          assistant_answer: false,
          raw_content_included: false,
          terminal_eligible: true,
          artifact_v1: {
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      },
    });

    expect(evaluation.result).toBe("insufficient");
    expect(evaluation.summary).toMatch(/terminal_eligible_not_false/);
  });

  it("rejects raw-content theory reflection receipts", () => {
    const evaluation = evaluateWorkstationToolReceipt({
      thread_id: "thread:test",
      receipt: {
        ok: true,
        panel_id: "theory-badge-graph",
        action_id: "reflect_discussion_context",
        artifact: {
          kind: "theory_context_reflection",
          assistant_answer: false,
          raw_content_included: true,
          terminal_eligible: false,
          artifact_v1: {
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      },
    });

    expect(evaluation.result).toBe("insufficient");
    expect(evaluation.summary).toMatch(/raw_content_included_not_false/);
  });

  it("downgrades forbidden overclaim phrases in reflection receipts", () => {
    const evaluation = evaluateWorkstationToolReceipt({
      thread_id: "thread:test",
      receipt: {
        ok: true,
        panel_id: "theory-badge-graph",
        action_id: "reflect_discussion_context",
        artifact: {
          kind: "theory_context_reflection",
          assistant_answer: false,
          raw_content_included: false,
          terminal_eligible: false,
          evidence_for_ask: {
            summary: "QEI passed and physical mechanism confirmed.",
          },
          artifact_v1: {
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
        },
      },
    });

    expect(evaluation.result).toBe("insufficient");
    expect(evaluation.summary).toMatch(/forbidden_claim_phrase/);
  });
});
