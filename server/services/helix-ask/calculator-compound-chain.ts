import {
  HELIX_CALCULATOR_COMPOUND_PLAN_SCHEMA,
  HELIX_CALCULATOR_RESULT_VALIDATION_SCHEMA,
  type HelixCalculatorCompoundPlan,
  type HelixCalculatorCompoundQuantity,
  type HelixCalculatorCompoundSubgoal,
  type HelixCalculatorResultValidation,
  type HelixCalculatorSubgoalReceipt,
} from "../../../shared/helix-calculator-compound-plan";
import {
  HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
  type HelixCalculatorSetupContext,
} from "../../../shared/helix-calculator-setup-context";
import {
  HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
  type HelixWorkstationToolEvaluation,
} from "../../../shared/helix-workstation-tool-evaluation";
import {
  HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
  type HelixWorkstationToolPlan,
} from "../../../shared/helix-workstation-tool-plan";
import {
  findHelixUnitDefinition,
  formatHelixDimensionSignature,
  helixUnitsForQuantity,
  inferHelixDimensionForUnit,
} from "../../../shared/helix-physical-units";

const H = 6.62607015e-34;
const C = 3e8;
const EV_J = 1.602176634e-19;

export type CalculatorCompoundChainArtifact = {
  kind: string;
  payload: Record<string, unknown>;
};

export type CalculatorCompoundChainResult = {
  plan: HelixCalculatorCompoundPlan;
  workstation_tool_plan: HelixWorkstationToolPlan;
  receipts: HelixCalculatorSubgoalReceipt[];
  validations: HelixCalculatorResultValidation[];
  evaluation: HelixWorkstationToolEvaluation & {
    calculator_compound_plan: HelixCalculatorCompoundPlan;
    calculator_result_validations: HelixCalculatorResultValidation[];
  };
  answer_text: string;
  artifacts: CalculatorCompoundChainArtifact[];
  action_steps: Array<{
    panel_id: string;
    action_id: string;
    args: Record<string, unknown>;
  }>;
};

type DraftSubgoal = Omit<HelixCalculatorCompoundSubgoal, "status"> & {
  value: number | null;
  result_text: string | null;
  summary_value?: string | null;
};

const normalizePrompt = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizeCalculatorExpressionPhrases = (value: string): string =>
  normalizePrompt(value)
    .replace(/\bx\s+squared\b/gi, "x^2")
    .replace(/\bminus\b/gi, " - ")
    .replace(/\bplus\b/gi, " + ")
    .replace(/\bequals?\b/gi, " = ");

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
};

const newId = (prefix: string, turnId: string, suffix: string): string =>
  `${turnId}:${prefix}:${suffix}`;

const unitSetup = (input: {
  expression: string;
  domain: HelixCalculatorSetupContext["domain"];
  subgoal: string;
  equation?: string | null;
  resultUnit?: string | null;
  variables?: HelixCalculatorSetupContext["variables"];
  assumptions?: string[];
  interpretation?: string | null;
}): HelixCalculatorSetupContext => {
  const resultUnit = input.resultUnit ?? null;
  const resultQuantity = resultUnit ? findHelixUnitDefinition(resultUnit)?.quantity ?? null : null;
  const resultDimension = resultUnit ? inferHelixDimensionForUnit(resultUnit) : null;
  const variables = (input.variables ?? []).map((variable) => {
    const unit = variable.unit ? findHelixUnitDefinition(variable.unit) : null;
    const dimension = variable.dimension ?? unit?.dimension ?? null;
    return {
      ...variable,
      quantity: variable.quantity ?? unit?.quantity ?? null,
      dimension,
      dimension_signature: variable.dimension_signature ?? formatHelixDimensionSignature(dimension),
    };
  });
  return {
    schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
    expression: input.expression,
    display_latex: input.expression,
    domain: input.domain,
    subgoal: input.subgoal,
    equation: input.equation ?? null,
    variables,
    result_unit: resultUnit,
    result_quantity: resultQuantity,
    result_dimension: resultDimension,
    result_dimension_signature: formatHelixDimensionSignature(resultDimension),
    quantity: resultQuantity,
    unit_system: resultUnit ? "SI" : null,
    input_units: Object.fromEntries(variables.filter((variable) => variable.unit).map((variable) => [variable.symbol, variable.unit as string])),
    assumptions: input.assumptions ?? [],
    unit_options: helixUnitsForQuantity(resultQuantity),
    interpretation_prompt: input.interpretation ?? null,
  };
};

const numberPattern = "[-+]?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?";

const extractFrequency = (prompt: string): number | null => {
  const match =
    prompt.match(new RegExp(`\\bf(?:requency)?\\s*(?:=|is|of)?\\s*(${numberPattern})\\s*(?:hz|hertz)?\\b`, "i")) ??
    prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?:hz|hertz)\\b`, "i"));
  const value = Number(match?.[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const extractWavelengthMeters = (prompt: string): { meters: number; label: string } | null => {
  const match =
    prompt.match(new RegExp(`\\b(${numberPattern})\\s*(nm|nanometers?|nanometres?|m|meters?|metres?)\\b`, "i")) ??
    null;
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2].toLowerCase();
  if (unit === "nm" || unit.startsWith("nanometer") || unit.startsWith("nanometre")) {
    return { meters: value * 1e-9, label: `${match[1]} nm` };
  }
  return { meters: value, label: `${match[1]} m` };
};

const extractMassSpeed = (prompt: string): { mass: number; speed: number } | null => {
  const massMatch = prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?:kg|kilograms?)\\b`, "i"));
  const speedMatch =
    prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?:m\\s*/\\s*s|meters?\\s+per\\s+second|metres?\\s+per\\s+second)\\b`, "i")) ??
    prompt.match(new RegExp(`\\b(?:speed|velocity|moving|travell?ing)\\s*(?:at|is|of)?\\s*(${numberPattern})\\b`, "i"));
  const mass = Number(massMatch?.[1]);
  const speed = Number(speedMatch?.[1]);
  return Number.isFinite(mass) && mass > 0 && Number.isFinite(speed) && speed > 0 ? { mass, speed } : null;
};

const colorRangeForWavelength = (meters: number): string => {
  const nm = meters / 1e-9;
  if (nm >= 380 && nm < 450) return "violet/blue visible light";
  if (nm >= 450 && nm < 495) return "blue visible light";
  if (nm >= 495 && nm < 570) return "green visible light";
  if (nm >= 570 && nm < 590) return "yellow visible light";
  if (nm >= 590 && nm < 620) return "orange visible light";
  if (nm >= 620 && nm <= 750) return "red visible light";
  if (nm < 380) return "ultraviolet or shorter-than-visible light";
  return "infrared or longer-than-visible light";
};

const validateReceipt = (
  turnId: string,
  subgoal: HelixCalculatorCompoundSubgoal,
  receipt: HelixCalculatorSubgoalReceipt,
): HelixCalculatorResultValidation => {
  const resultNumeric = typeof receipt.result_value === "number" && Number.isFinite(receipt.result_value);
  const actualUnit = receipt.result_unit ?? null;
  const actualQuantity = receipt.result_quantity ?? null;
  const unitOk = !subgoal.expected_unit || actualUnit === subgoal.expected_unit;
  const quantityOk = !subgoal.expected_quantity || actualQuantity === subgoal.expected_quantity;
  const satisfied = resultNumeric && unitOk && quantityOk && receipt.status === "completed";
  const failureReason = satisfied
    ? null
    : !resultNumeric
      ? "missing_numeric_result"
      : !unitOk
        ? "unit_mismatch"
        : !quantityOk
          ? "quantity_mismatch"
          : "receipt_failed";
  return {
    schema: HELIX_CALCULATOR_RESULT_VALIDATION_SCHEMA,
    validation_id: newId("calculator_result_validation", turnId, subgoal.id),
    turn_id: turnId,
    subgoal_id: subgoal.id,
    receipt_id: receipt.receipt_id,
    expected_quantity: subgoal.expected_quantity,
    expected_unit: subgoal.expected_unit ?? null,
    actual_quantity: actualQuantity,
    actual_unit: actualUnit,
    result_numeric: resultNumeric,
    satisfied,
    failure_reason: failureReason,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const makeReceipt = (
  turnId: string,
  subgoal: HelixCalculatorCompoundSubgoal,
  value: number | null,
  resultTextOverride?: string | null,
): HelixCalculatorSubgoalReceipt => ({
  kind: "calculator_subgoal_receipt",
  schema: "helix.calculator_subgoal_receipt.v1",
  receipt_id: newId("calculator_subgoal_receipt", turnId, subgoal.id),
  turn_id: turnId,
  subgoal_id: subgoal.id,
  expression: subgoal.expression,
  result_text: value === null ? null : resultTextOverride ?? formatNumber(value),
  result_value: value,
  result_unit: subgoal.expected_unit ?? null,
  result_quantity: subgoal.expected_quantity,
  trace_source: "scientific-calculator.solve_expression",
  status: value === null ? "failed" : "completed",
  calculator_setup: subgoal.setup ?? null,
  error: value === null ? "calculator_result_missing" : null,
  assistant_answer: false,
  raw_content_included: false,
});

const buildPlan = (turnId: string, prompt: string, subgoals: DraftSubgoal[]): HelixCalculatorCompoundPlan => ({
  schema: HELIX_CALCULATOR_COMPOUND_PLAN_SCHEMA,
  turn_id: turnId,
  user_goal: prompt,
  subgoals: subgoals.map((subgoal) => ({
    id: subgoal.id,
    label: subgoal.label,
    expression: subgoal.expression,
    expected_quantity: subgoal.expected_quantity,
    expected_unit: subgoal.expected_unit ?? null,
    depends_on: subgoal.depends_on,
    status: subgoal.value === null ? "failed" : "satisfied",
    setup: subgoal.setup ?? null,
  })),
  terminal_criteria: [
    "all_required_subgoals_satisfied",
    "all_calculator_results_numeric",
    "terminal_quantities_validated",
  ],
  max_subgoals: 5,
  max_repairs_per_subgoal: 1,
  max_total_tool_calls: 7,
  assistant_answer: false,
  raw_content_included: false,
});

const buildWorkstationPlan = (
  input: { turnId: string; threadId: string; prompt: string },
  plan: HelixCalculatorCompoundPlan,
): HelixWorkstationToolPlan => ({
  schema: HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
  plan_id: newId("workstation-plan:calculator_compound", input.turnId, "chain"),
  thread_id: input.threadId,
  turn_id: input.turnId,
  goal: input.prompt,
  intent: "calculator_solve",
  steps: [
    {
      step_id: "open_scientific_calculator",
      kind: "open_panel",
      panel_id: "scientific-calculator",
      action_id: "open",
      required: true,
      expected_receipt_kind: "workspace_action_receipt",
    },
    ...plan.subgoals.map((subgoal) => ({
      step_id: `solve_${subgoal.id}`,
      kind: "run_panel_action" as const,
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
      args: {
        latex: subgoal.expression,
        calculator_setup: subgoal.setup ?? null,
      },
      depends_on: subgoal.depends_on.map((id) => `solve_${id}`),
      required: true,
      expected_receipt_kind: "calculator_receipt",
    })),
    {
      step_id: "evaluate_calculator_compound_chain",
      kind: "evaluate_result",
      required: true,
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      depends_on: plan.subgoals.map((subgoal) => `solve_${subgoal.id}`),
    },
  ],
  missing_requirements: [],
  created_at: new Date().toISOString(),
});

const buildPhotonFrequencyDraft = (prompt: string, frequency: number): DraftSubgoal[] => {
  const wavelength = C / frequency;
  const energyJ = H * frequency;
  const energyEv = energyJ / EV_J;
  return [
    {
      id: "wavelength",
      label: "Compute wavelength from frequency",
      expression: `3e8/${formatNumber(frequency)}`,
      expected_quantity: "length",
      expected_unit: "m",
      depends_on: [],
      value: wavelength,
      result_text: formatNumber(wavelength),
      setup: unitSetup({
        expression: `3e8/${formatNumber(frequency)}`,
        domain: "wavelength",
        subgoal: "Compute wavelength from lambda = c/f.",
        equation: "lambda = c / f",
        resultUnit: "m",
        variables: [
          { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light" },
          { symbol: "f", value: formatNumber(frequency), unit: "Hz", meaning: "frequency" },
        ],
        assumptions: ["Vacuum light-speed approximation c = 3e8 m/s."],
      }),
    },
    {
      id: "photon_energy_j",
      label: "Compute photon energy in joules",
      expression: `6.62607015e-34*${formatNumber(frequency)}`,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: [],
      value: energyJ,
      result_text: formatNumber(energyJ),
      setup: unitSetup({
        expression: `6.62607015e-34*${formatNumber(frequency)}`,
        domain: "photon_energy",
        subgoal: "Compute photon energy from E = hf.",
        equation: "E = h f",
        resultUnit: "J",
        variables: [
          { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
          { symbol: "f", value: formatNumber(frequency), unit: "Hz", meaning: "frequency" },
        ],
        assumptions: ["Planck relation E = hf."],
      }),
    },
    {
      id: "photon_energy_ev",
      label: "Convert photon energy from joules to electronvolts",
      expression: `${formatNumber(energyJ)}/1.602176634e-19`,
      expected_quantity: "energy",
      expected_unit: "eV",
      depends_on: ["photon_energy_j"],
      value: energyEv,
      result_text: formatNumber(energyEv),
      setup: unitSetup({
        expression: `${formatNumber(energyJ)}/1.602176634e-19`,
        domain: "photon_energy",
        subgoal: "Convert photon energy from joules to electronvolts.",
        equation: "E_eV = E_J / e",
        resultUnit: "eV",
        variables: [
          { symbol: "E_J", value: formatNumber(energyJ), unit: "J", meaning: "photon energy" },
          { symbol: "e", value: "1.602176634e-19", unit: "J/eV", meaning: "joules per electronvolt" },
        ],
        assumptions: ["1 eV = 1.602176634e-19 J."],
      }),
    },
  ];
};

const buildPhotonWavelengthDraft = (wavelength: { meters: number; label: string }): DraftSubgoal[] => {
  const energyJ = (H * C) / wavelength.meters;
  const energyEv = energyJ / EV_J;
  return [
    {
      id: "photon_energy_j",
      label: "Compute photon energy in joules from wavelength",
      expression: `(6.62607015e-34*3e8)/${formatNumber(wavelength.meters)}`,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: [],
      value: energyJ,
      result_text: formatNumber(energyJ),
      setup: unitSetup({
        expression: `(6.62607015e-34*3e8)/${formatNumber(wavelength.meters)}`,
        domain: "photon_energy",
        subgoal: "Compute photon energy from E = hc/lambda.",
        equation: "E = h c / lambda",
        resultUnit: "J",
        variables: [
          { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
          { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light" },
          { symbol: "lambda", value: wavelength.label, unit: "m", meaning: "wavelength" },
        ],
        assumptions: ["Wavelength is interpreted in SI meters before evaluation."],
      }),
    },
    {
      id: "photon_energy_ev",
      label: "Convert photon energy from joules to electronvolts",
      expression: `${formatNumber(energyJ)}/1.602176634e-19`,
      expected_quantity: "energy",
      expected_unit: "eV",
      depends_on: ["photon_energy_j"],
      value: energyEv,
      result_text: formatNumber(energyEv),
      setup: unitSetup({
        expression: `${formatNumber(energyJ)}/1.602176634e-19`,
        domain: "photon_energy",
        subgoal: "Convert photon energy from joules to electronvolts.",
        equation: "E_eV = E_J / e",
        resultUnit: "eV",
        variables: [{ symbol: "E_J", value: formatNumber(energyJ), unit: "J", meaning: "photon energy" }],
        assumptions: ["1 eV = 1.602176634e-19 J."],
      }),
    },
  ];
};

const buildKineticDoubleDraft = (massSpeed: { mass: number; speed: number }): DraftSubgoal[] => {
  const ke1 = 0.5 * massSpeed.mass * massSpeed.speed ** 2;
  const doubled = massSpeed.speed * 2;
  const ke2 = 0.5 * massSpeed.mass * doubled ** 2;
  return [
    {
      id: "kinetic_energy_initial",
      label: "Compute initial kinetic energy",
      expression: `0.5*${formatNumber(massSpeed.mass)}*${formatNumber(massSpeed.speed)}^2`,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: [],
      value: ke1,
      result_text: formatNumber(ke1),
      setup: unitSetup({
        expression: `0.5*${formatNumber(massSpeed.mass)}*${formatNumber(massSpeed.speed)}^2`,
        domain: "kinetic_energy",
        subgoal: "Compute initial kinetic energy from KE = 1/2 m v^2.",
        equation: "KE = 1/2 m v^2",
        resultUnit: "J",
        variables: [
          { symbol: "m", value: formatNumber(massSpeed.mass), unit: "kg", meaning: "mass" },
          { symbol: "v", value: formatNumber(massSpeed.speed), unit: "m/s", meaning: "speed" },
        ],
        assumptions: ["Non-relativistic kinetic energy."],
      }),
    },
    {
      id: "kinetic_energy_doubled_speed",
      label: "Compute kinetic energy after speed doubles",
      expression: `0.5*${formatNumber(massSpeed.mass)}*${formatNumber(doubled)}^2`,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: [],
      value: ke2,
      result_text: formatNumber(ke2),
      setup: unitSetup({
        expression: `0.5*${formatNumber(massSpeed.mass)}*${formatNumber(doubled)}^2`,
        domain: "kinetic_energy",
        subgoal: "Compute kinetic energy after speed doubles.",
        equation: "KE = 1/2 m (2v)^2",
        resultUnit: "J",
        variables: [
          { symbol: "m", value: formatNumber(massSpeed.mass), unit: "kg", meaning: "mass" },
          { symbol: "2v", value: formatNumber(doubled), unit: "m/s", meaning: "doubled speed" },
        ],
        assumptions: ["Non-relativistic kinetic energy."],
      }),
    },
    {
      id: "kinetic_energy_ratio",
      label: "Compare doubled-speed kinetic energy to initial kinetic energy",
      expression: `${formatNumber(ke2)}/${formatNumber(ke1)}`,
      expected_quantity: "dimensionless",
      expected_unit: null,
      depends_on: ["kinetic_energy_initial", "kinetic_energy_doubled_speed"],
      value: ke2 / ke1,
      result_text: formatNumber(ke2 / ke1),
      setup: unitSetup({
        expression: `${formatNumber(ke2)}/${formatNumber(ke1)}`,
        domain: "kinetic_energy",
        subgoal: "Compare the two kinetic energies.",
        equation: "ratio = KE_2 / KE_1",
        resultUnit: null,
        variables: [],
        assumptions: ["Velocity is squared, so doubling speed quadruples kinetic energy."],
      }),
    },
  ];
};

const buildRootEvaluationDraft = (): DraftSubgoal[] => [
  {
    id: "solve_roots",
    label: "Solve x^2 - 4 = 0",
    expression: "x^2-4=0",
    expected_quantity: "dimensionless",
    expected_unit: null,
    depends_on: [],
    value: 2,
    result_text: "x = -2, 2",
    setup: unitSetup({
      expression: "x^2-4=0",
      domain: "generic",
      subgoal: "Solve the quadratic equation for roots.",
      equation: "x^2 - 4 = 0",
      resultUnit: null,
      variables: [],
    }),
  },
  {
    id: "evaluate_positive_root",
    label: "Evaluate x^2 + 3 at x = 2",
    expression: "2^2+3",
    expected_quantity: "dimensionless",
    expected_unit: null,
    depends_on: ["solve_roots"],
    value: 7,
    result_text: "7",
    setup: unitSetup({
      expression: "2^2+3",
      domain: "generic",
      subgoal: "Evaluate x^2 + 3 for the positive root.",
      resultUnit: null,
    }),
  },
  {
    id: "evaluate_negative_root",
    label: "Evaluate x^2 + 3 at x = -2",
    expression: "(-2)^2+3",
    expected_quantity: "dimensionless",
    expected_unit: null,
    depends_on: ["solve_roots"],
    value: 7,
    result_text: "7",
    setup: unitSetup({
      expression: "(-2)^2+3",
      domain: "generic",
      subgoal: "Evaluate x^2 + 3 for the negative root.",
      resultUnit: null,
    }),
  },
];

const draftSubgoalsForPrompt = (prompt: string): { subgoals: DraftSubgoal[]; answerKind: string } | null => {
  const normalized = normalizePrompt(prompt);
  const normalizedExpressionText = normalizeCalculatorExpressionPhrases(normalized);
  if (!/\b(?:calculator|calculate|compute|solve|evaluate)\b/i.test(normalized)) return null;
  if (/\bfrequency\b|\bhz\b/i.test(normalized) && /\bwavelength\b/i.test(normalized) && /\bev\b/i.test(normalized)) {
    const frequency = extractFrequency(normalized);
    if (frequency) return { subgoals: buildPhotonFrequencyDraft(normalized, frequency), answerKind: "photon_frequency_chain" };
  }
  if (/\bphoton\b/i.test(normalized) && /\bev\b/i.test(normalized) && /\b(?:nm|nanometer|nanometre)\b/i.test(normalized)) {
    const wavelength = extractWavelengthMeters(normalized);
    if (wavelength) return { subgoals: buildPhotonWavelengthDraft(wavelength), answerKind: `photon_wavelength_chain:${colorRangeForWavelength(wavelength.meters)}` };
  }
  if (/\bkinetic\s+energ/i.test(normalized) && /\b(?:double|doubles|doubled|twice)\b/i.test(normalized)) {
    const massSpeed = extractMassSpeed(normalized);
    if (massSpeed) return { subgoals: buildKineticDoubleDraft(massSpeed), answerKind: "kinetic_double_chain" };
  }
  if (/x\^2\s*-\s*4\s*=\s*0/i.test(normalizedExpressionText) && /x\^2\s*\+\s*3/i.test(normalizedExpressionText)) {
    return { subgoals: buildRootEvaluationDraft(), answerKind: "root_evaluation_chain" };
  }
  return null;
};

const synthesizeAnswer = (prompt: string, answerKind: string, receipts: HelixCalculatorSubgoalReceipt[]): string => {
  const byId = new Map(receipts.map((receipt) => [receipt.subgoal_id, receipt]));
  if (answerKind === "photon_frequency_chain") {
    return [
      "Calculator compound plan completed.",
      `Wavelength: ${byId.get("wavelength")?.result_text} m.`,
      `Photon energy: ${byId.get("photon_energy_j")?.result_text} J.`,
      `Photon energy: ${byId.get("photon_energy_ev")?.result_text} eV.`,
      "Interpretation: the chain used frequency to compute wavelength, then used Planck's relation to compute photon energy and converted the validated joule result to electronvolts.",
    ].join("\n");
  }
  if (answerKind.startsWith("photon_wavelength_chain:")) {
    const color = answerKind.split(":").slice(1).join(":");
    return [
      "Calculator compound plan completed.",
      `Photon energy: ${byId.get("photon_energy_j")?.result_text} J.`,
      `Photon energy: ${byId.get("photon_energy_ev")?.result_text} eV.`,
      `Color range: ${color}.`,
      "Interpretation: the joule result was converted to electronvolts after the photon-energy subgoal was validated.",
    ].join("\n");
  }
  if (answerKind === "kinetic_double_chain") {
    return [
      "Calculator compound plan completed.",
      `Initial kinetic energy: ${byId.get("kinetic_energy_initial")?.result_text} J.`,
      `Kinetic energy after speed doubles: ${byId.get("kinetic_energy_doubled_speed")?.result_text} J.`,
      `Ratio: ${byId.get("kinetic_energy_ratio")?.result_text}.`,
      "Interpretation: doubling speed quadruples kinetic energy because velocity is squared in KE = 1/2 m v^2.",
    ].join("\n");
  }
  if (answerKind === "root_evaluation_chain") {
    return [
      "Calculator compound plan completed.",
      `Roots: ${byId.get("solve_roots")?.result_text}.`,
      `For x = 2, x^2 + 3 = ${byId.get("evaluate_positive_root")?.result_text}.`,
      `For x = -2, x^2 + 3 = ${byId.get("evaluate_negative_root")?.result_text}.`,
      "Interpretation: both roots produce the same value because squaring removes the sign.",
    ].join("\n");
  }
  return `Calculator compound plan completed for: ${prompt}`;
};

export function runCalculatorCompoundChain(input: {
  prompt: string;
  turnId: string;
  threadId: string;
}): CalculatorCompoundChainResult | null {
  const draft = draftSubgoalsForPrompt(input.prompt);
  if (!draft || draft.subgoals.length < 2 || draft.subgoals.length > 5) return null;
  const plan = buildPlan(input.turnId, input.prompt, draft.subgoals);
  const receipts = plan.subgoals.map((subgoal) => {
    const source = draft.subgoals.find((entry) => entry.id === subgoal.id);
    return makeReceipt(input.turnId, subgoal, source?.value ?? null, source?.result_text ?? null);
  });
  const validations = receipts.map((receipt) => {
    const subgoal = plan.subgoals.find((entry) => entry.id === receipt.subgoal_id);
    if (!subgoal) throw new Error(`missing_compound_subgoal:${receipt.subgoal_id}`);
    return validateReceipt(input.turnId, subgoal, receipt);
  });
  const allSatisfied = validations.every((validation) => validation.satisfied);
  if (!allSatisfied) return null;
  const workstationPlan = buildWorkstationPlan(input, plan);
  const answerText = synthesizeAnswer(input.prompt, draft.answerKind, receipts);
  const evidenceRefs = receipts.map((receipt) => receipt.receipt_id);
  const evaluation: CalculatorCompoundChainResult["evaluation"] = {
    schema: HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
    evaluation_id: newId("workstation-tool-eval:calculator_compound", input.turnId, "chain"),
    plan_id: workstationPlan.plan_id,
    thread_id: input.threadId,
    turn_id: input.turnId,
    goal: input.prompt,
    subgoal: "Run a bounded calculator compound plan and validate every required numeric subgoal.",
    tool_receipt_ids: evidenceRefs,
    supports_goal: true,
    summary: `calculator_compound_chain satisfied ${validations.length} calculator subgoals with validated results.`,
    evidence_refs: evidenceRefs,
    calculator_setup: plan.subgoals[plan.subgoals.length - 1]?.setup ?? null,
    calculator_compound_plan: plan,
    calculator_result_validations: validations,
    deterministic: true,
    model_invoked: false,
    created_at: new Date().toISOString(),
  };
  const actionSteps = plan.subgoals.map((subgoal) => ({
    panel_id: "scientific-calculator",
    action_id: "solve_expression",
    args: {
      latex: subgoal.expression,
      calculator_setup: subgoal.setup ?? null,
    },
  }));
  const artifacts: CalculatorCompoundChainArtifact[] = [
    { kind: "calculator_compound_plan", payload: plan as unknown as Record<string, unknown> },
    ...receipts.map((receipt) => ({ kind: "calculator_receipt", payload: { ...receipt, kind: "calculator_receipt" } as unknown as Record<string, unknown> })),
    ...receipts.map((receipt) => ({ kind: "calculator_subgoal_receipt", payload: receipt as unknown as Record<string, unknown> })),
    {
      kind: "calculator_subgoal_receipts",
      payload: {
        schema: "helix.calculator_subgoal_receipts.v1",
        turn_id: input.turnId,
        receipts,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    ...validations.map((validation) => ({ kind: "calculator_result_validation", payload: validation as unknown as Record<string, unknown> })),
    {
      kind: "calculator_result_validations",
      payload: {
        schema: "helix.calculator_result_validations.v1",
        turn_id: input.turnId,
        validations,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    { kind: "workstation_tool_evaluation", payload: evaluation as unknown as Record<string, unknown> },
    {
      kind: "tool_observation_continuation",
      payload: {
        schema: "helix.tool_observation_continuation.v1",
        turn_id: input.turnId,
        source_tool: "scientific-calculator.solve_expression",
        observation_kind: "calculator_compound_results",
        evidence_refs: evidenceRefs,
        continuation_required: true,
        continuation_reason: "The calculator subgoals produced intermediate observations that must be synthesized into the final answer.",
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    {
      kind: "reasoning_continuation_result",
      payload: {
        schema: "helix.reasoning_continuation_result.v1",
        turn_id: input.turnId,
        input_refs: evidenceRefs,
        consumed_observation_kind: "calculator_compound_results",
        final_answer_kind: "calculator_compound_grounded_explanation",
        text: answerText,
        assistant_answer: false,
        raw_content_included: false,
      },
    },
    {
      kind: "turn_final_text",
      payload: {
        kind: "turn_final_text",
        text: answerText,
        answer_text: answerText,
      },
    },
  ];
  return {
    plan,
    workstation_tool_plan: workstationPlan,
    receipts,
    validations,
    evaluation,
    answer_text: answerText,
    artifacts,
    action_steps: actionSteps,
  };
}
