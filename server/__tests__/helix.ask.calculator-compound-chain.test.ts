import { describe, expect, it } from "vitest";
import {
  runCalculatorCompoundChain,
  runCalculatorModelAuthoredChain,
} from "../services/helix-ask/calculator-compound-chain";

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

  it("does not require eV wording to decompose frequency wavelength and energy prompts", () => {
    const chain = runCalculatorCompoundChain({
      prompt: "A photon has frequency 6e14 Hz. Use the scientific calculator to find its wavelength and energy.",
      threadId: "thread:test",
      turnId: "turn:test",
    });

    expect(chain).not.toBeNull();
    expect(chain?.plan.subgoals.map((subgoal) => subgoal.id)).toEqual([
      "wavelength",
      "photon_energy_j",
    ]);
    expect(chain?.validations.every((validation) => validation.satisfied)).toBe(true);
    expect(chain?.answer_text).toContain("Wavelength:");
    expect(chain?.answer_text).toContain("Photon energy:");
    expect(chain?.answer_text).toContain("No electronvolt conversion was required");
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

  it("rejects partial model-authored chains when any proposed expression is invalid", () => {
    const chain = runCalculatorModelAuthoredChain({
      prompt:
        "Use the scientific calculator to compute kinetic energy for mass 2 kg and speed 15 m per s then compute maximum height with g 9.80665.",
      threadId: "thread:test",
      turnId: "turn:test",
      subgoals: [
        {
          id: "compute_initial_kinetic_energy",
          label: "Compute initial kinetic energy",
          expression: "0.5*2*15^2",
          expected_quantity: "energy",
          expected_unit: "J",
          equation: "KE = 0.5*m*v^2",
        },
        {
          id: "compute_maximum_height",
          label: "Compute maximum height",
          expression: "0.5*2*15^2/(2*9 80665)",
          expected_quantity: "length",
          expected_unit: "m",
          equation: "h = KE/(m*g)",
        },
      ],
    });

    expect(chain).toBeNull();
  });

  it("rejects model-authored height expressions that contradict energy conversion", () => {
    const chain = runCalculatorModelAuthoredChain({
      prompt:
        "Use the scientific calculator. A 0.20 kg ball moves at 18 m/s. Compute its kinetic energy and the maximum height it could reach if all kinetic energy converts to gravitational potential energy using g = 9.80665 m/s^2.",
      threadId: "thread:test",
      turnId: "turn:test",
      subgoals: [
        {
          id: "kinetic_energy",
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
          id: "maximum_height",
          label: "Compute maximum height",
          expression: "0.2*0.5*18^2/9.80665",
          expected_quantity: "length",
          expected_unit: "m",
          equation: "h = KE/(m*g)",
          variables: [
            { symbol: "m", value: "0.2", unit: "kg", meaning: "mass" },
            { symbol: "g", value: "9.80665", unit: "m/s^2", meaning: "gravity" },
          ],
        },
      ],
    });

    expect(chain).toBeNull();
  });
});
