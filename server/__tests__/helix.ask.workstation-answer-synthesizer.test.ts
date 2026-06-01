import { describe, expect, it } from "vitest";
import { synthesizeWorkstationToolAnswer } from "../services/helix-ask/workstation-answer-synthesizer";
import { planWorkstationToolUse } from "../services/helix-ask/workstation-tool-planner";

describe("Helix Ask workstation answer synthesizer", () => {
  it("reports solve-with-steps as the trace source when that capability was chosen", () => {
    const prompt = "Use the scientific calculator to check 12*7 and explain the result.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    expect(synthesizeWorkstationToolAnswer({ prompt, plan: plan! })).toContain(
      "Trace source: scientific-calculator.solve_with_steps.",
    );
  });

  it("reports solve-expression as the trace source for direct calculator solves", () => {
    const prompt = "Use the scientific calculator to solve 9*9.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    expect(synthesizeWorkstationToolAnswer({ prompt, plan: plan! })).toContain(
      "Trace source: scientific-calculator.solve_expression.",
    );
  });

  it("continues reasoning after calculator output for compound photon-energy prompts", () => {
    const prompt = "Explain photon energy using E=hf and calculate it for f=5e14 Hz.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({ prompt, plan: plan! });

    expect(answer).toContain("A photon is a single quantum of electromagnetic radiation.");
    expect(answer).toContain("Calculator subgoal: evaluate 6.62607015e-34*5e14.");
    expect(answer).toContain("Result: E = 3.313035e-19 J");
    expect(answer).toContain("Trace source: scientific-calculator.solve_expression.");
  });

  it("continues wavelength reasoning after a parenthesized calculator observation", () => {
    const prompt = "Use the scientific calculator to verify (3e8)/(5e14), then explain what that wavelength means for light.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({ prompt, plan: plan! });

    expect(answer).toContain("lambda = c/f");
    expect(answer).toContain("Calculator subgoal: evaluate (3e8)/(5e14).");
    expect(answer).toContain("Result: lambda = 6e-7 m");
    expect(answer).toContain("Trace source: scientific-calculator.solve_with_steps.");
  });

  it("continues kinetic-energy reasoning after calculator output", () => {
    const prompt = "Explain kinetic energy and calculate 0.5*2*12^2 with the scientific calculator.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({ prompt, plan: plan! });

    expect(answer).toContain("KE = 1/2 mv^2");
    expect(answer).toContain("Calculator subgoal: evaluate 0.5*2*12^2.");
    expect(answer).toContain("Result: KE = 144 J");
    expect(answer).toContain("Trace source: scientific-calculator.solve_expression.");
  });

  it("uses the solved linear-equation value in compound calculator answers", () => {
    const prompt = "UI calculator: Use the calculator to solve 3*x+9=0 and explain the root.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({ prompt, plan: plan! });

    expect(answer).toContain("Calculator subgoal: 3*x+9=0");
    expect(answer).toContain("Result: x = -3");
    expect(answer).not.toContain("available in the calculator receipt");
  });

  it("synthesizes a model-authored answer from theory reflection evidence", () => {
    const prompt = "Where does E=hf fit in the theory graph?";
    const plan = planWorkstationToolUse(prompt).tool_plan;
    const rawSummary = "The discussion appears near quantum energy and Solar Spectrum.";

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({
      prompt,
      plan: plan!,
      evaluation: {
        schema: "helix.workstation_tool_evaluation.v1",
        evaluation_id: "eval:test",
        thread_id: "thread:test",
        tool_receipt_id: "receipt:test",
        result: "supports_subgoal",
        summary: `Theory reflection located discussion context as evidence only: ${rawSummary}`,
        evidence_refs: ["workstation:theory-badge-graph.reflect_discussion_context"],
        model_invoked: false,
        deterministic_gate: true,
        created_at: new Date().toISOString(),
      },
    });

    expect(answer).toContain("I located this discussion in the Theory Badge Graph, then built a first-principles explanation route");
    expect(answer).toContain("The graph route suggests:");
    expect(answer).toContain("Read that route as evidence, not as a solve");
    expect(answer).not.toBe(rawSummary);
  });

  it("keeps calculator numeric authority separate from theory reflection context", () => {
    const prompt = "Explain photon energy using E=hf and calculate it for f=5e14 Hz.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({
      prompt,
      plan: plan!,
      evaluation: {
        schema: "helix.workstation_tool_evaluation.v1",
        evaluation_id: "eval:test",
        thread_id: "thread:test",
        tool_receipt_id: "receipt:test",
        result: "supports_subgoal",
        summary: "Theory reflection located discussion context as evidence only: Solar Spectrum context.",
        evidence_refs: ["workstation:theory-badge-graph.reflect_discussion_context"],
        model_invoked: false,
        deterministic_gate: true,
        created_at: new Date().toISOString(),
      },
    });

    expect(answer).toContain("Calculator subgoal");
    expect(answer).toContain("3.313035e-19 J");
    expect(answer).not.toContain("Solar Spectrum context");
  });

  it("synthesizes from both theory reflection context and calculator solve receipts", () => {
    const prompt = "Calculate photon energy for f=5e14 Hz and show where E=hf fits in the theory graph.";
    const plan = planWorkstationToolUse(prompt).tool_plan;

    expect(plan).toBeTruthy();
    const answer = synthesizeWorkstationToolAnswer({ prompt, plan: plan! });

    expect(answer).toContain("I first located the equation in the Theory Badge Graph as context evidence");
    expect(answer).toContain("The theory reflection is a non-terminal context locator, not the numeric solve.");
    expect(answer).toContain("Calculator subgoal");
    expect(answer).toContain("3.313035e-19 J");
    expect(answer).toContain("Trace source: scientific-calculator.solve_expression.");
  });
});
