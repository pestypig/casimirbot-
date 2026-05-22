import { describe, expect, it } from "vitest";
import { extractCalculatorExpression, planWorkstationToolUse } from "../services/helix-ask/workstation-tool-planner";

describe("Helix Ask workstation tool planner", () => {
  it("routes equation verification to scientific calculator solve-with-steps", () => {
    const plan = planWorkstationToolUse("Check this equation with the scientific calculator: x^2 - 4 = 0");

    expect(plan.intent).toBe("calculator_verify");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "solve_with_steps",
      args: expect.objectContaining({ latex: "x^2 - 4 = 0" }),
    });
    expect(plan.tool_plan?.intent).toBe("calculator_verify");
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "scientific-calculator.open",
      "scientific-calculator.ingest_latex",
      "scientific-calculator.solve_with_steps",
      "undefined.undefined",
    ]);
    expect(plan.missing_required_args).toEqual([]);
  });

  it("routes ordinary solve requests to the calculator instead of direct answer", () => {
    const plan = planWorkstationToolUse("Solve x^2 - 4 = 0 with steps");

    expect(plan.action).toMatchObject({
      panel_id: "scientific-calculator",
      action_id: "solve_with_steps",
      args: expect.objectContaining({ latex: "x^2 - 4 = 0" }),
    });
  });

  it("strips explanatory follow-up text from calculator expressions", () => {
    const prompt = "Use the scientific calculator to check 12*7 and explain the result.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("12*7");
    expect(plan.intent).toBe("calculator_verify");
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "solve_with_steps",
      args: expect.objectContaining({ latex: "12*7" }),
    });
    expect(plan.missing_required_args).toEqual([]);
  });

  it("keeps balanced parenthesized scientific-notation expressions", () => {
    const prompt = "Use the scientific calculator to verify (3e8)/(5e14), then explain what that wavelength means for light.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("(3e8)/(5e14)");
    expect(plan.intent).toBe("calculator_verify");
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "solve_with_steps",
      args: expect.objectContaining({
        latex: "(3e8)/(5e14)",
        calculator_setup: expect.objectContaining({
          domain: "wavelength",
          expression: "(3e8)/(5e14)",
          result_unit: "m",
          variables: expect.arrayContaining([
            expect.objectContaining({ symbol: "c", value: "3e8", unit: "m/s" }),
            expect.objectContaining({ symbol: "f", value: "5e14", unit: "Hz" }),
          ]),
        }),
      }),
    });
  });

  it("derives a calculator expression for photon energy prompts", () => {
    const prompt = "Explain photon energy using E=hf and calculate it for f=5e14 Hz.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("6.62607015e-34*5e14");
    expect(plan.intent).toBe("calculator_solve");
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
      args: expect.objectContaining({
        latex: "6.62607015e-34*5e14",
        calculator_setup: expect.objectContaining({
          domain: "photon_energy",
          equation: "E = h f",
          result_unit: "J",
        }),
      }),
    });
  });

  it("routes explicit calculator live-source prompts to equation stream startup", () => {
    const prompt = "Start the calculator as a live source for 3*x+9=0 and explain the first tick.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("3*x+9=0");
    expect(plan.intent).toBe("calculator_live_source");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "start_equation_live_source",
      args: expect.objectContaining({
        latex: "3*x+9=0",
        equation: "3*x+9=0",
        equation_context: expect.stringContaining("calculator"),
        max_ticks: 1,
        calculator_setup: expect.objectContaining({
          expression: "3*x+9=0",
        }),
      }),
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "scientific-calculator.open",
      "scientific-calculator.ingest_latex",
      "scientific-calculator.start_equation_live_source",
      "undefined.undefined",
    ]);
  });

  it("extracts only the calculator expression from compound solve prompts", () => {
    expect(extractCalculatorExpression("Use the calculator to solve x^2-4=0 and explain the roots.")).toBe("x^2-4=0");
    expect(
      extractCalculatorExpression(
        "Calculate 1.602e-19*5 with the scientific calculator, then explain what that energy means in joules.",
      ),
    ).toBe("1.602e-19*5");
    expect(extractCalculatorExpression("UI calculator: Use the calculator to solve 3*x+9=0 and explain the root.")).toBe(
      "3*x+9=0",
    );
  });

  it("routes note creation to workstation notes with title and body", () => {
    const plan = planWorkstationToolUse('Create a workstation note titled "Test" with body hello');

    expect(plan.intent).toBe("notes_create");
    expect(plan.action).toEqual({
      panel_id: "workstation-notes",
      action_id: "create_note",
      args: { title: "Test", body: "hello" },
    });
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "open_workstation_notes",
      "create_note",
      "evaluate_note_receipt",
    ]);
  });

  it("prefers explicit note creation even when note body contains math", () => {
    const plan = planWorkstationToolUse(
      'Create a workstation note titled "Tool Demo" with body Calculator verified x^2 - 4 = 0 gives x = 2 and x = -2.',
    );

    expect(plan.intent).toBe("notes_create");
    expect(plan.action).toEqual({
      panel_id: "workstation-notes",
      action_id: "create_note",
      args: {
        title: "Tool Demo",
        body: "Calculator verified x^2 - 4 = 0 gives x = 2 and x = -2",
      },
    });
  });

  it("keeps explicit note creation when the note body mentions reasoning policy", () => {
    const plan = planWorkstationToolUse(
      "Create a workstation note titled Tool Loop Test with body Calculator tools should inform the answer without hijacking general reasoning.",
    );

    expect(plan.intent).toBe("notes_create");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual({
      panel_id: "workstation-notes",
      action_id: "create_note",
      args: {
        title: "Tool Loop Test",
        body: "Calculator tools should inform the answer without hijacking general reasoning",
      },
    });
  });

  it("does not hijack unrelated science questions", () => {
    const plan = planWorkstationToolUse("What is a neutron star glitch?");

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
  });

  it("routes motive/Zen comparisons through mission ethos affordances", () => {
    const plan = planWorkstationToolUse("Compare this motive to Zen: I am gathering resources to survive.");

    expect(plan.intent).toBe("ideology_compare");
    expect(plan.action).toEqual({
      panel_id: "mission-ethos",
      action_id: "compare_motive_to_zen",
      args: {
        motive: "I am gathering resources to survive",
        framework: "zen",
      },
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "mission-ethos.open",
      "mission-ethos.compare_motive_to_zen",
      "undefined.undefined",
    ]);
  });
});
