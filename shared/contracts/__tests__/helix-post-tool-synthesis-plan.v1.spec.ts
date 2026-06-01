import { describe, expect, it } from "vitest";

import {
  buildHelixPostToolSynthesisPlanV1,
  isHelixPostToolSynthesisPlanV1,
  validateHelixPostToolSynthesisPlanV1,
} from "../helix-post-tool-synthesis-plan.v1";

const validPlan = () =>
  buildHelixPostToolSynthesisPlanV1({
    turnId: "turn:test",
    prompt: "Where does E=hf fit?",
    answerIntent: "mixed",
    secondaryIntents: ["concept_explanation", "theory_graph_mapping"],
    evidenceRefs: ["receipt:test"],
    observedReceiptKinds: ["helix_theory_context_reflection_tool_receipt"],
    requiredAnswerSections: [
      { id: "direct_answer", label: "Direct answer", required: true },
      { id: "concept_explanation", label: "Concept explanation", required: true },
    ],
    prohibitedMoves: ["Do not copy a receipt summary verbatim as the answer body."],
    synthesisInstructions: ["Answer the user's intent first."],
  });

describe("helix post-tool synthesis plan v1", () => {
  it("builds a valid evidence-only synthesis plan", () => {
    const plan = validPlan();

    expect(isHelixPostToolSynthesisPlanV1(plan)).toBe(true);
    expect(plan.artifactId).toBe("helix_post_tool_synthesis_plan");
    expect(plan.schemaVersion).toBe("helix_post_tool_synthesis_plan/v1");
    expect(plan.authority.assistant_answer).toBe(false);
    expect(plan.authority.terminal_eligible).toBe(false);
  });

  it("rejects invalid terminal authority", () => {
    const plan = validPlan() as any;
    plan.authority.terminal_eligible = true;

    expect(validateHelixPostToolSynthesisPlanV1(plan)).toContain("authority.terminal_eligible must be false");
  });

  it("rejects forbidden overclaim phrases", () => {
    const plan = validPlan() as any;
    plan.synthesisInstructions = ["This is a working warp drive."];

    expect(validateHelixPostToolSynthesisPlanV1(plan).join("\n")).toMatch(/forbidden overclaiming/i);
  });

  it("rejects an empty prompt", () => {
    const plan = validPlan() as any;
    plan.prompt = "";

    expect(validateHelixPostToolSynthesisPlanV1(plan)).toContain("prompt must be a non-empty string");
  });

  it("requires evidence refs when receipts are observed", () => {
    const plan = validPlan() as any;
    plan.evidenceRefs = [];

    expect(validateHelixPostToolSynthesisPlanV1(plan)).toContain(
      "evidenceRefs must be non-empty when observed receipts exist",
    );
  });
});
