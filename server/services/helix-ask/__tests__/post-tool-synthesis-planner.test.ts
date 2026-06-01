import { describe, expect, it } from "vitest";

import { planPostToolSynthesis } from "../post-tool-synthesis-planner";
import { isHelixPostToolSynthesisPlanV1 } from "../../../../shared/contracts/helix-post-tool-synthesis-plan.v1";

const receipt = (kind: string, id = `${kind}:test`) => ({ kind, receiptId: id });

describe("post-tool synthesis planner", () => {
  it("plans graph mapping for reflection-only graph prompts", () => {
    const plan = planPostToolSynthesis({
      turnId: "turn:test",
      prompt: "Where does E=hf fit in the theory graph?",
      route: "theory_context_reflection",
      receipts: [receipt("helix_theory_context_reflection_tool_receipt")],
    });

    expect(isHelixPostToolSynthesisPlanV1(plan)).toBe(true);
    expect(plan.answerIntent).toBe("mixed");
    expect(plan.secondaryIntents).toEqual(
      expect.arrayContaining(["concept_explanation", "theory_graph_mapping"]),
    );
  });

  it("plans concept explanation for meaning prompts", () => {
    const plan = planPostToolSynthesis({
      turnId: "turn:test",
      prompt: "What does E=hf mean?",
      receipts: [],
    });

    expect(plan.answerIntent).toBe("concept_explanation");
    expect(plan.requiredAnswerSections.map((section) => section.id)).toContain("concept_explanation");
  });

  it("plans numeric result for calculator prompts", () => {
    const plan = planPostToolSynthesis({
      turnId: "turn:test",
      prompt: "Calculate 2+2.",
      receipts: [receipt("calculator_receipt")],
    });

    expect(plan.answerIntent).toBe("numeric_result");
    expect(plan.requiredAnswerSections.map((section) => section.id)).toContain("numeric_result");
  });

  it("plans mixed for calculator plus graph prompts", () => {
    const plan = planPostToolSynthesis({
      turnId: "turn:test",
      prompt: "Calculate photon energy and show where E=hf fits in the theory graph.",
      route: "calculator_solve / calculator_compound_chain",
      receipts: [
        receipt("calculator_receipt"),
        receipt("helix_theory_context_reflection_tool_receipt"),
      ],
    });

    expect(plan.answerIntent).toBe("mixed");
    expect(plan.secondaryIntents).toEqual(
      expect.arrayContaining(["numeric_result", "theory_graph_mapping", "concept_explanation"]),
    );
  });

  it("plans evidence review for runtime and gate receipts", () => {
    const plan = planPostToolSynthesis({
      turnId: "turn:test",
      prompt: "Review the runtime gate receipt.",
      receipts: [receipt("theory_runtime_receipt")],
    });

    expect(plan.answerIntent).toBe("evidence_review");
    expect(plan.requiredAnswerSections.map((section) => section.id)).toContain("runtime_boundary");
  });

  it("plans debug reports for tools-used prompts", () => {
    const plan = planPostToolSynthesis({
      turnId: "turn:test",
      prompt: "Tell me what tools were used.",
      receipts: [receipt("helix_theory_context_reflection_tool_receipt")],
    });

    expect(plan.answerIntent).toBe("mixed");
    expect(plan.secondaryIntents).toContain("debug_report");
  });
});
