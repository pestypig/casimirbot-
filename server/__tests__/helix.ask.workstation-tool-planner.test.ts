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
    expect(plan.action).toEqual({
      panel_id: "theory-badge-graph",
      action_id: "reflect_discussion_context",
      args: expect.objectContaining({
        prompt: "Where does E=hf fit in the theory graph?",
        overlay: true,
        open_panel: true,
      }),
    });
    expect(plan.tool_plan?.steps.map((step) => step.step_id)).toEqual([
      "open_theory_badge_graph",
      "reflect_discussion_context",
      "evaluate_theory_context_reflection",
    ]);
    const reflectStep = plan.tool_plan?.steps.find((step) => step.step_id === "reflect_discussion_context");
    expect(reflectStep).toEqual(expect.objectContaining({
      expected_receipt_kind: "theory_context_reflection",
      expected_state_change: { store: "theory-map-overlay", proof_key: "softRegions" },
    }));
    expect(plan.tool_plan?.steps.at(-1)).toEqual(expect.objectContaining({
      kind: "evaluate_result",
      depends_on: ["reflect_discussion_context"],
    }));
  });

  it("admits theory context reflection for source residual and QEI mapping prompts", () => {
    const plan = planWorkstationToolUse("Map source residual and QEI margin on the badge graph.");

    expect(plan.intent).toBe("theory_context_reflection");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.action).toEqual(expect.objectContaining({
      panel_id: "theory-badge-graph",
      action_id: "reflect_discussion_context",
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

  it("honors explicit requests not to open tools for theory prompts", () => {
    const plan = planWorkstationToolUse("Do not open panels or tools; where does QEI fit in the theory graph?");

    expect(plan.intent).toBe("direct_answer");
    expect(plan.should_use_tool).toBe(false);
    expect(plan.action).toBeNull();
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

  it("routes explicit Auntie Dottie observer commands through Situation Room actions", () => {
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

    expect(plan.intent).toBe("dottie_observer");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toEqual({
      panel_id: "situation-room-pipelines",
      action_id: "observer.attach",
      args: expect.objectContaining({
        target_run_id: "run:ask:dottie-ui-smoke",
        observer_profile: "auntie_dottie",
        voice_mode: "text_only",
        max_chars: 120,
      }),
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "situation-room-pipelines.open",
      "situation-room-pipelines.observer.attach",
      "situation-room-pipelines.voice_delivery.propose_from_trace",
      "situation-room-pipelines.observer.query",
      "undefined.undefined",
    ]);
    const voiceStep = plan.tool_plan?.steps.find((step) => step.action_id === "voice_delivery.propose_from_trace");
    expect(voiceStep?.args).toEqual(expect.objectContaining({
      source_event_id: "agent_commentary:orientation",
      source_text: "I am checking the public commentary path",
      voice_mode: "text_only",
    }));
  });

  it("routes natural-language Auntie Dottie manifest requests to the manifest action", () => {
    const plan = planWorkstationToolUse(
      "Manifest Auntie Dottie as a witness-only observer preset for this room.",
      { threadId: "thread:dottie-manifest", turnId: "turn:dottie-manifest" },
    );

    expect(plan.intent).toBe("dottie_observer");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toEqual({
      panel_id: "situation-room-pipelines",
      action_id: "dottie.manifest",
      args: expect.objectContaining({
        thread_id: "thread:dottie-manifest",
        observer_profile: "auntie_dottie",
        objective: "Manifest Auntie Dottie as a witness-only Situation Room observer preset.",
      }),
    });
    expect(plan.scores[0]).toMatchObject({
      affordance_id: "situation-room-pipelines.dottie.manifest",
      action_id: "dottie.manifest",
    });
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toEqual([
      "situation-room-pipelines.open",
      "situation-room-pipelines.dottie.manifest",
      "undefined.undefined",
    ]);
  });

  it("routes Auntie Dottie mode requests as Situation Room manifest setup", () => {
    const plan = planWorkstationToolUse(
      "Go into Auntie Dottie mode while I play Minecraft.",
      { threadId: "thread:dottie-mode", turnId: "turn:dottie-mode" },
    );

    expect(plan.intent).toBe("dottie_observer");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.missing_required_args).toEqual([]);
    expect(plan.action).toEqual({
      panel_id: "situation-room-pipelines",
      action_id: "dottie.manifest",
      args: expect.objectContaining({
        thread_id: "thread:dottie-mode",
        observer_profile: "auntie_dottie",
        objective: "Manifest Auntie Dottie as a witness-only Situation Room observer preset.",
      }),
    });
  });

  it("routes Dottie read-aloud requests to voice proposal planning with missing source input", () => {
    const plan = planWorkstationToolUse(
      "Have Dottie read that out loud.",
      { threadId: "thread:dottie-voice", turnId: "turn:dottie-voice" },
    );

    expect(plan.intent).toBe("dottie_observer");
    expect(plan.should_use_tool).toBe(true);
    expect(plan.missing_required_args).toContain("source_event_id");
    expect(plan.tool_plan?.steps.map((step) => `${step.panel_id}.${step.action_id}`)).toContain(
      "situation-room-pipelines.voice_delivery.propose_from_trace",
    );
    expect(plan.action).toBeNull();
    expect(plan.scores.some((score) => score.action_id === "voice_delivery.propose_from_trace")).toBe(true);
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
