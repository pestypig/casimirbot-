import { describe, expect, it } from "vitest";
import { runCalculatorCompoundChain } from "../services/helix-ask/calculator-compound-chain";

describe("Helix Ask calculator compound chain", () => {
  it("plans and validates wavelength, photon energy, and eV conversion from frequency", () => {
    const chain = runCalculatorCompoundChain({
      prompt: "Given light frequency 6e14 Hz, use the calculator to compute wavelength, photon energy in joules, and photon energy in eV. Explain the result.",
      threadId: "thread:test",
      turnId: "turn:test",
    });

    expect(chain).not.toBeNull();
    expect(chain?.plan.subgoals.map((subgoal) => subgoal.id)).toEqual([
      "wavelength",
      "photon_energy_j",
      "photon_energy_ev",
    ]);
    expect(chain?.validations.every((validation) => validation.satisfied)).toBe(true);
    expect(chain?.evaluation.supports_goal).toBe(true);
    expect(chain?.answer_text).toContain("Wavelength:");
    expect(chain?.answer_text).toContain("Photon energy:");
    expect(chain?.artifacts.map((artifact) => artifact.kind)).toEqual(
      expect.arrayContaining([
        "calculator_compound_plan",
        "calculator_receipt",
        "calculator_subgoal_receipts",
        "calculator_result_validations",
        "workstation_tool_evaluation",
        "tool_observation_continuation",
        "reasoning_continuation_result",
      ]),
    );
  });

  it("chains kinetic energy calculations before comparing doubled speed", () => {
    const chain = runCalculatorCompoundChain({
      prompt: "A 2 kg object moves at 15 m/s, then doubles speed. Use the calculator to compute both kinetic energies and compare them.",
      threadId: "thread:test",
      turnId: "turn:test",
    });

    expect(chain).not.toBeNull();
    expect(chain?.plan.subgoals.map((subgoal) => subgoal.expression)).toEqual([
      "0.5*2*15^2",
      "0.5*2*30^2",
      "900/225",
    ]);
    expect(chain?.answer_text).toContain("Initial kinetic energy: 225 J.");
    expect(chain?.answer_text).toContain("Kinetic energy after speed doubles: 900 J.");
    expect(chain?.answer_text).toContain("Ratio: 4.");
  });

  it("normalizes spoken quadratic wording before planning dependent evaluations", () => {
    const chain = runCalculatorCompoundChain({
      prompt: "Solve x squared minus 4 equals 0 then use scientific calculator to evaluate x squared plus 3 for each root",
      threadId: "thread:test",
      turnId: "turn:test",
    });

    expect(chain).not.toBeNull();
    expect(chain?.plan.subgoals.map((subgoal) => subgoal.id)).toEqual([
      "solve_roots",
      "evaluate_positive_root",
      "evaluate_negative_root",
    ]);
    expect(chain?.validations.every((validation) => validation.satisfied)).toBe(true);
    expect(chain?.answer_text).toContain("Roots: x = -2, 2.");
    expect(chain?.answer_text).toContain("For x = 2, x^2 + 3 = 7.");
    expect(chain?.answer_text).toContain("For x = -2, x^2 + 3 = 7.");
  });

  it("keeps unrelated one-step calculator prompts outside the compound chain", () => {
    const chain = runCalculatorCompoundChain({
      prompt: "Use calculator compute kinetic energy KE=0.5*2*15^2 joules",
      threadId: "thread:test",
      turnId: "turn:test",
    });

    expect(chain).toBeNull();
  });
});
