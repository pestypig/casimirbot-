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
});
