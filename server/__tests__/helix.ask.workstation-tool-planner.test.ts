import { beforeEach, describe, expect, it } from "vitest";
import {
  classifyVoiceContextRequest,
  extractCalculatorExpression,
  planWorkstationToolUse,
} from "../services/helix-ask/workstation-tool-planner";
import {
  clearVoiceInterpretationContextsForTest,
  getActiveVoiceInterpretationContextDebugSummary,
  upsertVoiceInterpretationContext,
} from "../services/voice/voice-interpretation-context-store";

describe("Helix Ask workstation tool planner", () => {
  beforeEach(() => {
    clearVoiceInterpretationContextsForTest();
  });

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
          result_quantity: "length",
          result_dimension_signature: "L",
          unit_system: "SI",
          input_units: expect.objectContaining({
            c: "m/s",
            f: "Hz",
          }),
          variables: expect.arrayContaining([
            expect.objectContaining({ symbol: "c", value: "3e8", unit: "m/s", dimension_signature: "L T^-1" }),
            expect.objectContaining({ symbol: "f", value: "5e14", unit: "Hz", dimension_signature: "T^-1" }),
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
          result_quantity: "energy",
          result_dimension_signature: "L^2 M T^-2",
          unit_system: "SI",
          unit_options: expect.arrayContaining([
            expect.objectContaining({ symbol: "J", quantity: "energy" }),
            expect.objectContaining({ symbol: "eV", quantity: "energy" }),
          ]),
        }),
      }),
    });
  });

  it("strips assignment labels and units from direct photon energy calculator expressions", () => {
    const prompt = "Use the scientific calculator to compute photon energy E=(6.626e-34*3.0e8)/(500e-9) joules, then explain the result.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("(6.626e-34*3.0e8)/(500e-9)");
    expect(plan.intent).toBe("calculator_solve");
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
      args: expect.objectContaining({
        latex: "(6.626e-34*3.0e8)/(500e-9)",
        calculator_setup: expect.objectContaining({
          domain: "photon_energy",
          expression: "(6.626e-34*3.0e8)/(500e-9)",
          result_unit: "J",
          result_quantity: "energy",
          result_dimension_signature: "L^2 M T^-2",
          unit_system: "SI",
          input_units: expect.objectContaining({
            h: "J*s",
            c: "m/s",
          }),
        }),
      }),
    });
  });

  it("synthesizes kinetic-energy expressions from natural-language values", () => {
    const prompt = "Use calculator what is kinetic energy of 2 kg moving at 15 meters per second";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("0.5*2*15^2");
    expect(plan.intent).toBe("calculator_solve");
    expect(plan.action).toEqual({
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
      args: expect.objectContaining({
        latex: "0.5*2*15^2",
        calculator_setup: expect.objectContaining({
          domain: "kinetic_energy",
          expression: "0.5*2*15^2",
          result_unit: "J",
          variables: expect.arrayContaining([
            expect.objectContaining({ symbol: "m", value: "2", unit: "kg", dimension_signature: "M" }),
            expect.objectContaining({ symbol: "v", value: "15", unit: "m/s", dimension_signature: "L T^-1" }),
          ]),
        }),
      }),
    });
  });

  it("extracts calculator-ready kinetic-energy expressions instead of prose prompt tails", () => {
    const prompt =
      "Use the scientific calculator to compute the kinetic energy of a 2.5 kg object moving at 8 m/s. Show the expression, result, and units.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBe("0.5*2.5*8^2");
    expect(plan.intent).toBe("calculator_solve");
    expect(plan.action?.args).toEqual(expect.objectContaining({
      latex: "0.5*2.5*8^2",
      calculator_setup: expect.objectContaining({
        domain: "kinetic_energy",
        result_unit: "J",
        variables: expect.arrayContaining([
          expect.objectContaining({ symbol: "m", value: "2.5", unit: "kg" }),
          expect.objectContaining({ symbol: "v", value: "8", unit: "m/s" }),
        ]),
      }),
    }));
  });

  it("does not treat prose with numbers as a calculator expression", () => {
    expect(extractCalculatorExpression("Use calculator what is the mass of 2 kg in this example")).toBeNull();
  });

  it("extracts uncertainty calculator expressions instead of prose formula tails", () => {
    const prompt =
      "Use the calculator panel to help answer this. Model a simple quantum wave packet with uncertainty relation dx dp >= hbar/2. Let dx = 2.0e-10 m. Calculate the minimum dp, then estimate minimum kinetic energy p^2/(2*m_e) in joules and eV.";

    expect(extractCalculatorExpression(prompt)).toBe("1.054571817e-34/(2*2.0e-10)");
    expect(extractCalculatorExpression(prompt)).not.toContain("then estimate");
  });

  it("does not force calculator for conceptual no-numeric physics explanations", () => {
    const prompt =
      "Explain why kinetic energy depends on velocity squared instead of velocity directly. I want a conceptual explanation connected to work, force over distance, and what changes when speed doubles. Do not calculate a specific numeric case unless it helps the explanation.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBeNull();
    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
  });

  it("does not route tool diagnostic prose through the calculator", () => {
    const prompt = "Calculator panel showed stale/failed expression state even though backend receipts succeeded.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBeNull();
    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
  });

  it("does not create a missing-latex calculator action when the user says the numeric input is absent", () => {
    const prompt =
      "I am trying to estimate the kinetic energy of a 1500 kg car at highway speed for a safety comparison. I did not give you an exact speed. Decide whether the calculator is useful here, but do not invent a speed silently. If the problem is underspecified, say what value you need before producing a numeric result.";
    const plan = planWorkstationToolUse(prompt);

    expect(extractCalculatorExpression(prompt)).toBeNull();
    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
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

  it("admits theory context reflection for energy-frequency theory graph prompts", () => {
    const plan = planWorkstationToolUse("Where does E=hf fit in the theory graph?");

    expect(plan.intent).toBe("theory_context_reflection");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.reason).toBe(
      "Prompt discusses mapped theory/physics concepts; reflect discussion context as evidence before final answer.",
    );
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "reflect_theory_context",
      "evaluate_theory_context_reflection",
    ]);
    const reflectStep = plan.tool_plan?.steps.find((step) => step.step_id === "reflect_theory_context");
    expect(reflectStep).toEqual(expect.objectContaining({
      kind: "run_ask_tool",
      tool_id: "helix_ask.reflect_theory_context",
      expected_receipt_kind: "helix_theory_context_reflection_tool_receipt",
      expected_state_change: { store: "theory-map-overlay", proof_key: "lastReflectionArtifact" },
      args: expect.objectContaining({
        prompt: "Where does E=hf fit in the theory graph?",
        build_explanation_plan: true,
        sync_panel: true,
        panel_overlay_mode: "live_answer_context",
        open_panel: false,
      }),
    }));
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).not.toContain("open_theory_badge_graph");
    expect(plan.tool_plan?.steps.at(-1)).toEqual(expect.objectContaining({
      kind: "evaluate_result",
      depends_on: ["reflect_theory_context"],
    }));
  });

  it("uses legacy panel open only when the user explicitly asks to show the graph", () => {
    const plan = planWorkstationToolUse("Open the Theory Badge Graph and map source residual and QEI margin.");

    expect(plan.intent).toBe("theory_context_reflection");
    expect(plan.action).toEqual(expect.objectContaining({
      panel_id: "theory-badge-graph",
      action_id: "reflect_discussion_context",
    }));
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "open_theory_badge_graph",
      "reflect_discussion_context",
      "evaluate_theory_context_reflection",
    ]);
    expect(plan.tool_plan?.steps[1]).toEqual(expect.objectContaining({
      kind: "run_panel_action",
      panel_id: "theory-badge-graph",
      action_id: "reflect_discussion_context",
      depends_on: ["open_theory_badge_graph"],
    }));
  });

  it("admits theory context reflection for source residual and QEI mapping prompts", () => {
    const plan = planWorkstationToolUse("Map source residual and QEI margin on the badge graph.");

    expect(plan.intent).toBe("theory_context_reflection");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.find((step) => step.step_id === "reflect_theory_context")).toEqual(expect.objectContaining({
      kind: "run_ask_tool",
      tool_id: "helix_ask.reflect_theory_context",
    }));
  });

  it("does not admit theory reflection for pure arithmetic", () => {
    const plan = planWorkstationToolUse("Calculate 2+2");

    expect(plan.intent).toBe("calculator_solve");
    expect(plan.action).toEqual(expect.objectContaining({
      panel_id: "scientific-calculator",
    }));
    expect(plan.action?.action_id).not.toBe("reflect_discussion_context");
  });

  it("keeps concrete photon energy calculations on the calculator route", () => {
    const plan = planWorkstationToolUse("Calculate photon energy for f=5e14 Hz.");

    expect(plan.intent).toBe("calculator_solve");
    expect(plan.action).toEqual(expect.objectContaining({
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
    }));
    expect(plan.action?.args).toEqual(expect.objectContaining({
      latex: "6.62607015e-34*5e14",
    }));
  });

  it("chains theory reflection before calculator solves for mapped physics calculations", () => {
    const plan = planWorkstationToolUse("Calculate photon energy for f=5e14 Hz and show where E=hf fits in the theory graph.");

    expect(plan.intent).toBe("physics_calculation_context");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.reason).toBe(
      "Prompt asks for mapped theory context and a scalar calculation; reflect context before calculator solve.",
    );
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "reflect_theory_context",
      "open_scientific_calculator",
      "ingest_expression",
      "solve_expression",
      "evaluate_reflection_and_calculator",
    ]);
    const reflectStep = plan.tool_plan?.steps.find((step) => step.step_id === "reflect_theory_context");
    expect(reflectStep).toEqual(expect.objectContaining({
      kind: "run_ask_tool",
      tool_id: "helix_ask.reflect_theory_context",
      expected_receipt_kind: "helix_theory_context_reflection_tool_receipt",
      expected_state_change: { store: "theory-map-overlay", proof_key: "lastReflectionArtifact" },
      args: expect.objectContaining({
        prompt: "Calculate photon energy for f=5e14 Hz and show where E=hf fits in the theory graph.",
        build_explanation_plan: true,
        sync_panel: true,
        panel_overlay_mode: "live_answer_context",
        open_panel: false,
      }),
    }));
    expect(plan.tool_plan?.steps.find((step) => step.step_id === "open_scientific_calculator")).toEqual(expect.objectContaining({
      depends_on: ["reflect_theory_context"],
    }));
    const solveStep = plan.tool_plan?.steps.find((step) => step.step_id === "solve_expression");
    expect(solveStep).toEqual(expect.objectContaining({
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
      expected_receipt_kind: "calculator_receipt",
      args: expect.objectContaining({ latex: "6.62607015e-34*5e14" }),
    }));
    expect(plan.tool_plan?.steps.at(-1)).toEqual(expect.objectContaining({
      kind: "evaluate_result",
      depends_on: ["reflect_theory_context", "solve_expression"],
    }));
  });

  it("does not fabricate calculator solves for tensor mapping prompts without scalar cuts", () => {
    const plan = planWorkstationToolUse("Map Einstein tensor source residual and QEI margin in the theory graph.");

    expect(plan.intent).toBe("theory_context_reflection");
    expect(plan.tool_plan?.steps.map((step) => step.panel_id)).not.toContain("scientific-calculator");
    expect(plan.tool_plan?.steps.map((step) => step.tool_id)).toContain("helix_ask.reflect_theory_context");
  });

  it("still reflects mapped theory prompts when no calculator expression is available", () => {
    const plan = planWorkstationToolUse("Show where photon energy fits in the theory graph and calculate the value.");

    expect(plan.intent).toBe("theory_context_reflection");
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.map((step) => step.tool_id)).toContain("helix_ask.reflect_theory_context");
    expect(plan.tool_plan?.steps.map((step) => step.panel_id)).not.toContain("scientific-calculator");
  });

  it("honors explicit requests not to open tools for theory prompts", () => {
    const plan = planWorkstationToolUse("Do not open panels or tools; where does QEI fit in the theory graph?");

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
  });

  it("plans a Theory-Zen bridge before standalone ZenGraph or theory reflection", () => {
    const plan = planWorkstationToolUse(
      "Reflect fairness and due process through entropy, conservation, and self-organization in the Theory Badge Graph and ZenGraph.",
    );

    expect(plan.intent).toBe("theory_ideology_bridge_reflection");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.reason).toBe(
      "Prompt asks to reflect theory/physics constraints against Zen/procedural justice lenses; produce bridge evidence before final answer.",
    );
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "reflect_theory_context",
      "reflect_zen_graph_context",
      "bridge_theory_ideology_context",
      "evaluate_theory_ideology_bridge",
    ]);
    expect(plan.tool_plan?.steps.find((step) => step.step_id === "bridge_theory_ideology_context")).toEqual(
      expect.objectContaining({
        kind: "run_ask_tool",
        tool_id: "helix_ask.bridge_theory_ideology_context",
        depends_on: ["reflect_theory_context", "reflect_zen_graph_context"],
        expected_receipt_kind: "helix_theory_ideology_bridge_tool_result",
        expected_state_change: {
          store: "theory-ideology-bridge",
          proof_key: "bridge",
        },
        args: expect.objectContaining({
          prompt:
            "Reflect fairness and due process through entropy, conservation, and self-organization in the Theory Badge Graph and ZenGraph.",
          refs: ["helix-ask:current-turn"],
          theory_reflection_ref: "step:reflect_theory_context",
          ideology_reflection_ref: "step:reflect_zen_graph_context",
        }),
      }),
    );
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).not.toContain("open_theory_badge_graph");
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).not.toContain("open_zen_badge_graph");
  });

  it("does not bridge mixed Theory-Zen terms when tools are explicitly disallowed", () => {
    const plan = planWorkstationToolUse(
      "Do not use tools or panels; discuss entropy, conservation, fairness, and ZenGraph conceptually.",
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.tool_plan).toBeNull();
  });

  it("admits ZenGraph reflection and Fruition expression prompts before the scientific calculator", () => {
    const plan = planWorkstationToolUse(
      "Use the Zen Badge Graph to reflect this situation: I need to respond to a teammate who made an uncertain safety claim. Plot direct observation, right speech, and two-key review, then show what Fruition would solve before any action.",
    );

    expect(plan.intent).toBe("zen_graph_reflection");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.reason).toBe(
      "Prompt asks for ZenGraph/Fruition reflection; produce locator and procedural expression evidence before final answer.",
    );
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "reflect_zen_graph_context",
      "open_fruition_calculator",
      "evaluate_zen_graph_reflection",
    ]);
    const reflectStep = plan.tool_plan?.steps.find((step) => step.step_id === "reflect_zen_graph_context");
    expect(reflectStep).toEqual(expect.objectContaining({
      kind: "run_ask_tool",
      tool_id: "helix_ask.reflect_ideology_context",
      expected_receipt_kind: "helix_zen_graph_reflection_tool_result",
      expected_state_change: { store: "zen-graph", proof_key: "locator" },
      args: expect.objectContaining({
        inputKind: "user_prompt",
        options: expect.objectContaining({
          includeLocator: true,
          includeFruition: true,
          includeAdmissionArtifacts: true,
          includeProceduralClassification: true,
        }),
      }),
    }));
    expect(plan.tool_plan?.steps.map((step) => step.panel_id)).not.toContain("scientific-calculator");
  });

  it("routes procedural inner-practice Zen classifier prompts through ZenGraph", () => {
    const plan = planWorkstationToolUse(
      "Use the procedural Zen classifier to reflect this conversation as inner-practice: rumination, information diet, identity-view, non-attachment, and right effort.",
    );

    expect(plan.intent).toBe("zen_graph_reflection");
    expect(plan.should_use_tool).toBe(true);
    const reflectStep = plan.tool_plan?.steps.find((step) => step.step_id === "reflect_zen_graph_context");
    expect(reflectStep).toEqual(
      expect.objectContaining({
        kind: "run_ask_tool",
        tool_id: "helix_ask.reflect_ideology_context",
        expected_receipt_kind: "helix_zen_graph_reflection_tool_result",
        args: expect.objectContaining({
          options: expect.objectContaining({
            includeProceduralClassification: true,
            includeLocator: true,
            includeFruition: true,
          }),
        }),
      }),
    );
  });

  it("routes moral guilt and missing consideration prompts through ZenGraph", () => {
    const plan = planWorkstationToolUse(
      "Use the procedural Zen classifier to reflect moral guilt, ignorance is bliss, and what missing considerations or affected parties should be researched.",
    );

    expect(plan.intent).toBe("zen_graph_reflection");
    expect(plan.should_use_tool).toBe(true);
    const reflectStep = plan.tool_plan?.steps.find((step) => step.step_id === "reflect_zen_graph_context");
    expect(reflectStep).toEqual(
      expect.objectContaining({
        kind: "run_ask_tool",
        tool_id: "helix_ask.reflect_ideology_context",
        expected_receipt_kind: "helix_zen_graph_reflection_tool_result",
        args: expect.objectContaining({
          options: expect.objectContaining({
            includeProceduralClassification: true,
          }),
        }),
      }),
    );
  });

  it("opens the Zen Badge Graph only when explicitly requested", () => {
    const plan = planWorkstationToolUse("Open the Zen Badge Graph and plot right speech against two-key review.");

    expect(plan.intent).toBe("zen_graph_reflection");
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "open_zen_badge_graph",
      "reflect_zen_graph_context",
      "evaluate_zen_graph_reflection",
    ]);
    expect(plan.tool_plan?.steps.find((step) => step.step_id === "open_zen_badge_graph")).toEqual(expect.objectContaining({
      kind: "open_panel",
      panel_id: "zen-badge-graph",
    }));
  });

  it("honors explicit requests not to use ZenGraph tools", () => {
    const plan = planWorkstationToolUse(
      "Do not use tools or panels; just discuss the phrase 'Zen Badge Graph and Fruition calculator' as a concept.",
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
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

  it("routes explicit narrator debug probes through the narrator panel action", () => {
    const plan = planWorkstationToolUse(
      'Run workstation action panel_id=narrator action_id=narrator.debug_auto_speak_probe with args text="Narrator debug probe from Helix Ask" trace_id="narrator:ask-probe".',
      { threadId: "thread:narrator-probe", turnId: "turn:narrator-probe" },
    );

    expect(plan.intent).toBe("narrator_debug_probe");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual({
      panel_id: "narrator",
      action_id: "narrator.debug_auto_speak_probe",
      args: {
        text: "Narrator debug probe from Helix Ask",
        trace_id: "narrator:ask-probe",
        source: "helix_ask",
      },
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "narrator.open",
      "narrator.narrator.debug_auto_speak_probe",
      "undefined.undefined",
    ]);
    expect(plan.missing_required_args).toEqual([]);
  });

  it("does not execute negated or hypothetical narrator debug probe mentions", () => {
    for (const prompt of [
      "Do not run workstation action panel_id=narrator action_id=narrator.debug_auto_speak_probe.",
      'The document says "panel_id=narrator action_id=narrator.debug_auto_speak_probe"; explain what that means.',
      "What would happen if you ran panel_id=narrator action_id=narrator.debug_auto_speak_probe?",
      "Tomorrow run panel_id=narrator action_id=narrator.debug_auto_speak_probe.",
    ]) {
      const plan = planWorkstationToolUse(prompt, { threadId: "thread:narrator-negative" });
      expect(plan.intent).toBe("direct_answer");
      expect(plan.should_use_tool).toBe(false);
      expect(plan.action).toBeNull();
      expect(plan.tool_plan).toBeNull();
    }
  });

  it("routes explicit narrator.say commands through governed narrator control", () => {
    const plan = planWorkstationToolUse(
      'Run panel action panel_id=narrator action_id=narrator.say with text="Translation is now routed through Narrator." source_id=helix_ask:translation delivery_mode=confirm_to_speak.',
      { threadId: "thread:narrator-say", turnId: "turn:narrator-say" },
    );

    expect(plan.intent).toBe("narrator_control");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual({
      panel_id: "narrator",
      action_id: "narrator.say",
      args: expect.objectContaining({
        text: "Translation is now routed through Narrator",
        source_id: "helix_ask:translation",
        delivery_mode: "confirm_to_speak",
      }),
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "narrator.open",
      "narrator.narrator.say",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[1]).toMatchObject({
      expected_receipt_kind: "narrator_say_receipt",
      required: true,
    });
  });

  it("routes narrator stream binding requests for translated transcripts", () => {
    const plan = planWorkstationToolUse(
      "Turn on narrator for the translated transcript stream source_ref=source:browser-audio delivery_mode=visible_only.",
      { threadId: "thread:narrator-bind", turnId: "turn:narrator-bind" },
    );

    expect(plan.intent).toBe("narrator_control");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual({
      panel_id: "narrator",
      action_id: "narrator.bind_stream",
      args: expect.objectContaining({
        source_ref: "source:browser-audio",
        stream_kind: "translated_transcript",
        delivery_mode: "visible_only",
        voice_policy: "confirm_speak_required",
      }),
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "narrator.open",
      "narrator.narrator.bind_stream",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[1]).toMatchObject({
      expected_receipt_kind: "narrator_bind_stream_receipt",
      required: true,
    });
  });

  it("normalizes natural narrator bindings to canonical stream kinds", () => {
    const liveAnswerPlan = planWorkstationToolUse(
      "Turn on narrator for the live answer output source_ref=source:live-answer-active.",
      { threadId: "thread:narrator-live-answer", turnId: "turn:narrator-live-answer" },
    );
    const goalContextPlan = planWorkstationToolUse(
      "Enable narrator to announce goal context updates source_ref=source:goal-context-active.",
      { threadId: "thread:narrator-goal-context", turnId: "turn:narrator-goal-context" },
    );

    expect(liveAnswerPlan.intent).toBe("narrator_control");
    expect(liveAnswerPlan.action?.args).toMatchObject({
      source_ref: "source:live-answer-active",
      stream_kind: "typed_commentary",
    });
    expect(goalContextPlan.intent).toBe("narrator_control");
    expect(goalContextPlan.action?.args).toMatchObject({
      source_ref: "source:goal-context-active",
      stream_kind: "route_evidence",
    });
  });

  it("routes explicit live_env narrator.say through ask-tool goal-context receipts", () => {
    const plan = planWorkstationToolUse(
      'Run live_env.narrator_say goal_id=goal:translate text="Translation is now routed through Narrator." source_id=helix_ask:translation delivery_mode=confirm_to_speak.',
      { threadId: "thread:narrator-live-say", turnId: "turn:narrator-live-say" },
    );

    expect(plan.intent).toBe("narrator_control");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.map((step) => step.tool_id ?? `${step.panel_id}.${step.action_id}`)).toEqual([
      "live_env.narrator_say",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[0]).toMatchObject({
      kind: "run_ask_tool",
      tool_id: "live_env.narrator_say",
      args: expect.objectContaining({
        goal_id: "goal:translate",
        source_id: "helix_ask:translation",
      }),
      expected_receipt_kind: "helix.narrator_say_request.v1",
      expected_state_change: {
        store: "stage-play-goal-context",
        proof_key: "goalContextUpdates",
      },
      required: true,
    });
  });

  it("routes explicit live_env narrator.bind_stream through ask-tool goal-context receipts", () => {
    const plan = planWorkstationToolUse(
      "Run live_env.narrator_bind_stream goal_id=goal:translate source_ref=source:browser-audio stream_kind=translated_transcript delivery_mode=visible_only.",
      { threadId: "thread:narrator-live-bind", turnId: "turn:narrator-live-bind" },
    );

    expect(plan.intent).toBe("narrator_control");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.map((step) => step.tool_id ?? `${step.panel_id}.${step.action_id}`)).toEqual([
      "live_env.narrator_bind_stream",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[0]).toMatchObject({
      kind: "run_ask_tool",
      tool_id: "live_env.narrator_bind_stream",
      args: expect.objectContaining({
        goal_id: "goal:translate",
        source_ref: "source:browser-audio",
        stream_kind: "translated_transcript",
        delivery_mode: "visible_only",
      }),
      expected_receipt_kind: "helix.narrator_bind_stream_request.v1",
      expected_state_change: {
        store: "stage-play-goal-context",
        proof_key: "goalContextUpdates",
      },
      required: true,
    });
  });

  it("does not execute contextual, quoted, future, or negated narrator control mentions", () => {
    for (const prompt of [
      "Do not run narrator.say; just explain the narrator policy.",
      'The document says "narrator.bind_stream"; summarize that label.',
      "Could we turn on narrator for translation later?",
      "Previously you used narrator say; what did it do?",
      "Do not run live_env.narrator_say; just explain the narrator policy.",
      'The document says "live_env.narrator_bind_stream"; summarize that label.',
      "Could we run live_env.narrator_bind_stream later?",
      "Previously you used live_env.narrator_say; what did it do?",
    ]) {
      const plan = planWorkstationToolUse(prompt, { threadId: "thread:narrator-control-negative" });
      expect(plan.intent).toBe("direct_answer");
      expect(plan.should_use_tool).toBe(false);
      expect(plan.action).toBeNull();
      expect(plan.tool_plan).toBeNull();
    }
  });

  it("routes workstation goal-context inspection to non-terminal live-env query evidence", () => {
    const plan = planWorkstationToolUse(
      "Show the workstation goal context updates and per-packet traces for the active visual capture.",
      { threadId: "thread:goal-context", turnId: "turn:goal-context" },
    );

    expect(plan.intent).toBe("workstation_goal_context");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.map((step) => step.tool_id ?? `${step.panel_id}.${step.action_id}`)).toEqual([
      "live_env.query_workstation_goal_context",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[0]).toMatchObject({
      kind: "run_ask_tool",
      tool_id: "live_env.query_workstation_goal_context",
      expected_receipt_kind: "stage_play_workstation_goal_context_read_result",
      required: true,
    });
  });

  it("routes durable monitor requests through agent goal session setup before context query", () => {
    const plan = planWorkstationToolUse(
      "Start an agent goal session goal_id=goal:frog-monitor source_id=image-lens:latest objective=\"Monitor visual capture for frog classification evidence.\"",
      { threadId: "thread:frog", turnId: "turn:frog" },
    );

    expect(plan.intent).toBe("workstation_goal_context");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.tool_plan?.steps.map((step) => step.tool_id ?? `${step.panel_id}.${step.action_id}`)).toEqual([
      "live_env.start_agent_goal_session",
      "live_env.query_workstation_goal_context",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[0]).toMatchObject({
      kind: "run_ask_tool",
      tool_id: "live_env.start_agent_goal_session",
      expected_receipt_kind: "stage_play_agent_goal_session_tool_result",
      args: expect.objectContaining({
        goal_id: "goal:frog-monitor",
        source_id: "image-lens:latest",
        context_feeds: expect.arrayContaining([
          expect.objectContaining({ source_kind: "visual_summaries" }),
          expect.objectContaining({ source_kind: "audio_transcripts" }),
          expect.objectContaining({ source_kind: "translated_transcripts" }),
          expect.objectContaining({ source_kind: "microdeck_outputs" }),
          expect.objectContaining({ source_kind: "live_answer_lines" }),
          expect.objectContaining({ source_kind: "source_health" }),
          expect.objectContaining({ source_kind: "trace_memory" }),
          expect.objectContaining({ source_kind: "route_evidence" }),
        ]),
        allowed_actuators: expect.arrayContaining([
          "query_visual_summaries",
          "query_audio_transcripts",
          "query_translation_segments",
          "query_microdeck_outputs",
          "query_live_answer_state",
          "query_source_health",
          "set_audio_preset",
          "set_visual_preset",
          "change_preset",
          "bind_source",
          "unbind_source",
          "bind_narrator",
          "narrator_bind_stream",
          "narrator_say",
          "update_live_answer",
          "query_trace_memory",
          "pause_loop",
          "resume_loop",
          "set_loop_state",
          "focus_process_graph",
          "repair_source",
          "ask_user",
        ]),
        cadence: { kind: "event_accumulation", min_updates: 2 },
        stop_conditions: expect.arrayContaining([
          "User stops monitoring",
          "Source feed ends or becomes unavailable",
          "Terminal authority produces a final report",
        ]),
      }),
    });
  });

  it("routes trace-memory inspection to non-terminal trace-memory query evidence", () => {
    const plan = planWorkstationToolUse(
      "Show trace memory goal_id=goal:frog-monitor trace_id=trace:frog.",
      { threadId: "thread:trace-memory", turnId: "turn:trace-memory" },
    );

    expect(plan.intent).toBe("workstation_goal_context");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan?.steps.map((step) => step.tool_id ?? `${step.panel_id}.${step.action_id}`)).toEqual([
      "live_env.query_trace_memory",
      "undefined.undefined",
    ]);
    expect(plan.tool_plan?.steps[0]).toMatchObject({
      kind: "run_ask_tool",
      tool_id: "live_env.query_trace_memory",
      args: expect.objectContaining({
        goal_id: "goal:frog-monitor",
        trace_id: "trace:frog",
      }),
      expected_receipt_kind: "helix.workstation_reasoning_trace_query_result",
      required: true,
    });
  });

  it("routes feed-specific workstation context prompts to the matching live-env query", () => {
    const audioPlan = planWorkstationToolUse(
      "Read the latest audio transcripts for the active live source.",
      { threadId: "thread:audio-feed", turnId: "turn:audio-feed" },
    );
    expect(audioPlan.intent).toBe("workstation_goal_context");
    expect(audioPlan.tool_plan?.steps[0]).toMatchObject({
      step_id: "query_audio_transcripts",
      kind: "run_ask_tool",
      tool_id: "live_env.query_audio_transcripts",
      expected_receipt_kind: "stage_play_workstation_context_feed_query_result",
      required: true,
    });

    const microDeckPlan = planWorkstationToolUse(
      "Show MicroDeck outputs for the frog-classification goal context.",
      { threadId: "thread:microdeck-feed", turnId: "turn:microdeck-feed" },
    );
    expect(microDeckPlan.intent).toBe("workstation_goal_context");
    expect(microDeckPlan.tool_plan?.steps[0]).toMatchObject({
      step_id: "query_microdeck_outputs",
      kind: "run_ask_tool",
      tool_id: "live_env.query_microdeck_outputs",
      expected_receipt_kind: "stage_play_workstation_context_feed_query_result",
      required: true,
    });

    const sourceHealthPlan = planWorkstationToolUse(
      "Check the source health for the active live source.",
      { threadId: "thread:source-health-feed", turnId: "turn:source-health-feed" },
    );
    expect(sourceHealthPlan.intent).toBe("workstation_goal_context");
    expect(sourceHealthPlan.tool_plan?.steps[0]).toMatchObject({
      step_id: "query_source_health",
      kind: "run_ask_tool",
      tool_id: "live_env.query_source_health",
      expected_receipt_kind: "helix.situation_source_capability_read.v1",
      expected_state_change: {
        store: "stage-play-goal-context",
        proof_key: "goalContextUpdates",
      },
      required: true,
    });
  });

  it("routes affirmative workstation control prompts to governed control receipts", () => {
    const presetPlan = planWorkstationToolUse(
      "Run live_env.change_workstation_preset goal_id=goal:frog target_ref=source:visual:active preset_id=preset:frog-classifier",
      { threadId: "thread:workstation-control", turnId: "turn:workstation-control" },
    );
    expect(presetPlan.intent).toBe("workstation_control");
    expect(presetPlan.should_use_tool).toBe(true);
    expect(presetPlan.missing_required_args).toEqual([]);
    expect(presetPlan.tool_plan?.steps.map((step) => step.tool_id ?? `${step.panel_id}.${step.action_id}`)).toEqual([
      "live_env.change_workstation_preset",
      "undefined.undefined",
    ]);
    expect(presetPlan.tool_plan?.steps[0]).toMatchObject({
      step_id: "change_workstation_preset",
      kind: "run_ask_tool",
      tool_id: "live_env.change_workstation_preset",
      args: expect.objectContaining({
        goal_id: "goal:frog",
        target_ref: "source:visual:active",
        preset_id: "preset:frog-classifier",
      }),
      expected_receipt_kind: "stage_play_workstation_control_receipt",
      required: true,
    });

    const focusPlan = planWorkstationToolUse(
      "Focus the process graph node_ref=packet:visual-frog",
      { threadId: "thread:workstation-control", turnId: "turn:focus-process-graph" },
    );
    expect(focusPlan.intent).toBe("workstation_control");
    expect(focusPlan.tool_plan?.steps[0]).toMatchObject({
      step_id: "focus_process_graph",
      kind: "run_ask_tool",
      tool_id: "live_env.focus_process_graph",
      args: expect.objectContaining({
        node_ref: "packet:visual-frog",
      }),
      expected_receipt_kind: "stage_play_workstation_control_receipt",
      required: true,
    });
  });

  it("does not execute contextual, negated, or hypothetical workstation control mentions", () => {
    for (const prompt of [
      "Do not change workstation preset; explain how presets work.",
      'The UI label says "live_env.focus_process_graph"; summarize it.',
      "Could we bind the source to Live Answer later?",
      "Previously you paused the loop; what did that mean?",
      "The screen shows a button labeled Apply preset; describe the screen text.",
    ]) {
      const plan = planWorkstationToolUse(prompt, { threadId: "thread:workstation-control-negative" });
      expect(plan.intent).toBe("direct_answer");
      expect(plan.should_use_tool).toBe(false);
      expect(plan.action).toBeNull();
      expect(plan.tool_plan).toBeNull();
    }
  });

  it("does not execute contextual, negated, or hypothetical goal-context mentions", () => {
    for (const prompt of [
      "Do not query workstation goal context; explain what the term means.",
      'The docs say "live_env.query_workstation_goal_context"; summarize that sentence.',
      "Could we inspect goal context updates later after the source is running?",
      "Previously you queried per-packet traces; what did that mean?",
      "Do not query trace memory; explain the phrase.",
      'The UI label says "live_env.query_trace_memory"; summarize it.',
      'The UI label says "live_env.query_audio_transcripts"; summarize it.',
      'The UI label says "live_env.query_source_health"; summarize it.',
      "Could we check source health later after the live source is running?",
    ]) {
      const plan = planWorkstationToolUse(prompt, { threadId: "thread:goal-context-negative" });
      expect(plan.intent).toBe("direct_answer");
      expect(plan.should_use_tool).toBe(false);
      expect(plan.action).toBeNull();
      expect(plan.tool_plan).toBeNull();
    }
  });

  it("retires explicit Auntie Dottie observer Situation Room tool commands", () => {
    const plan = planWorkstationToolUse(
      [
        "Operator command: run panel action situation-room-pipelines.observer.attach",
        "target_run_id run:ask:dottie-ui-smoke observer_profile auntie_dottie voice_mode text_only max_chars 120.",
        "Then run panel action situation-room-pipelines.voice_delivery.propose_from_trace",
        "source_event_id agent_commentary:orientation source text: I am checking the public commentary path.",
        "Then run panel action situation-room-pipelines.observer.query for target_run_id run:ask:dottie-ui-smoke.",
      ].join(" "),
      { threadId: "thread:dottie-test", turnId: "turn:dottie-test" },
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
    expect(plan.reason).toContain("Retired Situation Room");
  });

  it("retires natural-language Auntie Dottie manifest action planning", () => {
    const plan = planWorkstationToolUse(
      "Manifest Auntie Dottie as a witness-only observer preset for this room.",
      { threadId: "thread:dottie-manifest", turnId: "turn:dottie-manifest" },
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
    expect(plan.reason).toContain("Retired Situation Room");
  });

  it("retires Auntie Dottie mode Situation Room manifest setup", () => {
    const plan = planWorkstationToolUse(
      "Go into Auntie Dottie mode while I play Minecraft.",
      { threadId: "thread:dottie-mode", turnId: "turn:dottie-mode" },
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
  });

  it("retires Minecraft live answer continuation Situation Room tool planning", () => {
    const plan = planWorkstationToolUse(
      "Keep watching the Minecraft server as a live answer.",
      { threadId: "thread:minecraft-live", turnId: "turn:minecraft-live" },
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toBeNull();
    expect(plan.tool_plan).toBeNull();
    expect(plan.reason).toContain("Retired Situation Room");
  });

  it("routes Dottie read-aloud requests to voice proposal planning with missing source input", () => {
    const plan = planWorkstationToolUse(
      "Have Dottie read that out loud.",
      { threadId: "thread:dottie-voice", turnId: "turn:dottie-voice" },
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.tool_plan).toBeNull();
    expect(plan.action).toBeNull();
    expect(plan.reason).toContain("Retired Situation Room");
  });

  it("accepts answer snapshot refs as Dottie delivery sources without speaking pre-solver", () => {
    const plan = planWorkstationToolUse(
      "Have Dottie read answer_snapshot.latest out loud.",
      { threadId: "thread:dottie-voice", turnId: "turn:dottie-voice" },
    );

    expect(classifyVoiceContextRequest("Have Dottie read answer_snapshot.latest out loud.")).toBe("delivery_requested");
    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.tool_plan).toBeNull();
  });

  it("keeps Dottie style and post-solver voice requests out of delivery routing", () => {
    const stylePlan = planWorkstationToolUse(
      "Answer like Auntie Dottie.",
      { threadId: "thread:voice-context", turnId: "turn:voice-context" },
    );
    const styleContext = getActiveVoiceInterpretationContextDebugSummary("thread:voice-context");
    expect(classifyVoiceContextRequest("Answer like Auntie Dottie.")).toBe("style_context_only");
    expect(stylePlan.intent).toBe("direct_answer");
    expect(stylePlan.should_use_tool).toBe(false);
    expect(stylePlan.tool_plan).toBeNull();
    expect(styleContext).toMatchObject({
      persona_profile: "auntie_dottie",
      output_mode: "manual_read_style",
      speak_policy: "muted",
      salience_policy: "manual_only",
      assistant_answer: false,
      raw_content_included: false,
      output_authority: "steering_context",
      instruction_authority: "none",
      context_role: "tool_evidence",
    });

    const mutedPlan = planWorkstationToolUse(
      "Answer like Auntie Dottie, but do not read anything out loud.",
      { threadId: "thread:voice-context" },
    );
    expect(classifyVoiceContextRequest("Answer like Auntie Dottie, but do not read anything out loud.")).toBe("voice_disabled_or_forbidden");
    expect(mutedPlan.intent).toBe("direct_answer");
    expect(mutedPlan.should_use_tool).toBe(false);
    expect(getActiveVoiceInterpretationContextDebugSummary("thread:voice-context")).toBeNull();

    const postSolver = planWorkstationToolUse(
      "Read the disclaimer out loud as Dottie.",
      { threadId: "thread:voice-lane", turnId: "turn:voice-lane" },
    );
    expect(classifyVoiceContextRequest("Read the disclaimer out loud as Dottie.")).toBe("post_solver_voice_lane_requested");
    expect(postSolver.intent).toBe("direct_answer");
    expect(postSolver.should_use_tool).toBe(false);
    expect(postSolver.missing_required_args).toEqual(["answer_snapshot"]);
    expect(getActiveVoiceInterpretationContextDebugSummary("thread:voice-lane")).toMatchObject({
      scope: "turn",
      persona_profile: "auntie_dottie",
      interpretation_job: "caveat_reader",
      output_mode: "voice_lane_only",
      speak_policy: "confirm_required",
      salience_policy: "caveats_only",
      certainty_ceiling: "source_answer_snapshot",
      applies_until: "turn_end",
      evidence_refs: ["answer_snapshot:pending"],
      reason_codes: ["post_solver_voice_lane_requested"],
      assistant_answer: false,
    });
  });

  it("keeps historical and conceptual Dottie voice mentions as direct answers", () => {
    upsertVoiceInterpretationContext({
      thread_id: "thread:historical",
      persona_profile: "auntie_dottie",
      reason_codes: ["existing_context"],
    });
    for (const prompt of [
      "Earlier you mentioned Dottie voice. What did you mean?",
      "What is the Dottie voice policy?",
    ]) {
      const plan = planWorkstationToolUse(prompt, { threadId: "thread:historical" });
      expect(classifyVoiceContextRequest(prompt)).toBe("historical_or_conceptual_mention");
      expect(plan.intent).toBe("direct_answer");
      expect(plan.should_use_tool).toBe(false);
      expect(plan.action).toBeNull();
    }
    expect(getActiveVoiceInterpretationContextDebugSummary("thread:historical")?.reason_codes).toEqual(["existing_context"]);
  });

  it("does not turn contextual Dottie debugging into observer actions", () => {
    const plan = planWorkstationToolUse(
      "What can you infer from this Dottie run and what should the next patches be?",
    );

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
  });
});
