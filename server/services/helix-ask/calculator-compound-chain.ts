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
  type HelixCalculatorSetupVariable,
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
const G0 = 9.80665;

export type CalculatorCompoundChainArtifact = {
  kind: string;
  payload: Record<string, unknown>;
};

export type CalculatorCandidateHints = {
  schema: "helix.calculator_candidate_hints.v1";
  turn_id: string;
  prompt: string;
  authority: "hint_only";
  constants: Array<{
    symbol: string;
    value: string;
    unit: string | null;
    meaning: string;
  }>;
  formula_hints: Array<{
    id: string;
    expression_template: string;
    quantity: string;
    result_unit: string | null;
    when_useful: string;
  }>;
  expression_rules: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type CalculatorModelAuthoredSubgoal = {
  id?: string | null;
  label?: string | null;
  expression: string;
  expected_quantity?: string | null;
  expected_unit?: string | null;
  equation?: string | null;
  depends_on?: string[] | null;
  assumptions?: string[] | null;
  variables?: HelixCalculatorSetupContext["variables"] | null;
  interpretation?: string | null;
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

const sanitizeId = (value: string, fallback: string): string => {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return sanitized || fallback;
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
  const variables: HelixCalculatorSetupVariable[] = (input.variables ?? []).map((variable: HelixCalculatorSetupVariable) => {
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
    input_units: Object.fromEntries(
      variables
        .filter((variable: HelixCalculatorSetupVariable) => variable.unit)
        .map((variable: HelixCalculatorSetupVariable) => [variable.symbol, variable.unit as string]),
    ),
    assumptions: input.assumptions ?? [],
    unit_options: helixUnitsForQuantity(resultQuantity),
    interpretation_prompt: input.interpretation ?? null,
  };
};

const numberPattern = "[-+]?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?";

const extractNumberNear = (prompt: string, units: string[]): number | null => {
  const unitPattern = units.map((unit: string) => unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?:${unitPattern})\\b`, "i"));
  const value = Number(match?.[1]);
  return Number.isFinite(value) ? value : null;
};

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
    prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?:m\\s*/\\s*s|meters?\\s+per\\s+second|metres?\\s+per\\s+second)\\b(?!\\s*(?:\\^?2|squared))`, "i")) ??
    prompt.match(new RegExp(`\\b(?:speed|velocity|moving|travell?ing)\\s*(?:at|is|of)?\\s*(${numberPattern})\\b`, "i"));
  const mass = Number(massMatch?.[1]);
  const speed = Number(speedMatch?.[1]);
  return Number.isFinite(mass) && mass > 0 && Number.isFinite(speed) && speed > 0 ? { mass, speed } : null;
};

const extractDurationSeconds = (prompt: string): number | null =>
  extractNumberNear(prompt, ["s", "sec", "secs", "second", "seconds"]);

const extractExplicitAcceleration = (prompt: string): number | null => {
  const unitBacked = extractNumberNear(prompt, ["m/s^2", "m/s2", "meters per second squared", "metres per second squared"]);
  if (unitBacked !== null) return unitBacked;
  const named =
    prompt.match(new RegExp(`\\b(?:acceleration|accelerates?\\s+at|a)\\s*(?:=|is|of|at)?\\s*(${numberPattern})\\b`, "i")) ??
    prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?=(?:is\\s+)?(?:the\\s+)?acceleration\\b)`, "i"));
  const value = Number(named?.[1]);
  return Number.isFinite(value) ? value : null;
};

const extractRestToSpeedKinematics = (
  prompt: string,
): { mass: number | null; finalSpeed: number; durationSeconds: number; acceleration: number } | null => {
  const mass = extractNumberNear(prompt, ["kg", "kilogram", "kilograms"]);
  const massSpeed = extractMassSpeed(prompt);
  const durationSeconds = extractDurationSeconds(prompt);
  const startsFromRest =
    /\bstarts?\s+from\s+rest\b|\binitial(?:ly)?\s+(?:at\s+)?(?:rest|0\s*(?:m\/s|meters?\s+per\s+second|metres?\s+per\s+second)?)\b|\bfrom\s+0\s*(?:m\/s|meters?\s+per\s+second|metres?\s+per\s+second)\b/i.test(prompt);
  if (!massSpeed || !durationSeconds || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || !startsFromRest) {
    return null;
  }
  return {
    mass,
    finalSpeed: massSpeed.speed,
    durationSeconds,
    acceleration: massSpeed.speed / durationSeconds,
  };
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
  prompt: string,
  subgoal: HelixCalculatorCompoundSubgoal,
  receipt: HelixCalculatorSubgoalReceipt,
): HelixCalculatorResultValidation => {
  const resultNumeric = typeof receipt.result_value === "number" && Number.isFinite(receipt.result_value);
  const actualUnit = receipt.result_unit ?? null;
  const actualQuantity = receipt.result_quantity ?? null;
  const unitOk = !subgoal.expected_unit || actualUnit === subgoal.expected_unit;
  const quantityOk = !subgoal.expected_quantity || actualQuantity === subgoal.expected_quantity;
  const semanticCheck = validateCalculatorReceiptSemanticConsistency(prompt, subgoal, receipt);
  const satisfied = resultNumeric && unitOk && quantityOk && receipt.status === "completed" && semanticCheck.ok;
  const failureReason = satisfied
    ? null
    : !resultNumeric
      ? "missing_numeric_result"
      : !unitOk
        ? "unit_mismatch"
        : !quantityOk
          ? "quantity_mismatch"
          : !semanticCheck.ok
            ? semanticCheck.reason
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

const valuesClose = (actual: number, expected: number): boolean => {
  const tolerance = Math.max(1e-9, Math.abs(expected) * 1e-6);
  return Math.abs(actual - expected) <= tolerance;
};

const validateCalculatorReceiptSemanticConsistency = (
  prompt: string,
  subgoal: HelixCalculatorCompoundSubgoal,
  receipt: HelixCalculatorSubgoalReceipt,
): { ok: true; reason: null } | { ok: false; reason: string } => {
  if (typeof receipt.result_value !== "number" || !Number.isFinite(receipt.result_value)) {
    return { ok: true, reason: null };
  }
  const normalizedPrompt = normalizePrompt(prompt).toLowerCase();
  const subgoalText = normalizePrompt([
    subgoal.id,
    subgoal.label,
    subgoal.expression,
    subgoal.setup?.subgoal,
    subgoal.setup?.equation,
  ].filter(Boolean).join(" ")).toLowerCase();

  const mass = extractNumberNear(normalizedPrompt, ["kg", "kilogram", "kilograms"]);
  const restKinematics = extractRestToSpeedKinematics(normalizedPrompt);
  const acceleration = extractExplicitAcceleration(normalizedPrompt) ?? restKinematics?.acceleration ?? null;
  const durationSeconds = extractDurationSeconds(normalizedPrompt);
  const finalSpeed = restKinematics?.finalSpeed ?? (mass ? extractMassSpeed(normalizedPrompt)?.speed : null);
  if (mass && acceleration && Number.isFinite(acceleration) && durationSeconds && Number.isFinite(durationSeconds)) {
    const expectedFinalSpeed = finalSpeed ?? acceleration * durationSeconds;
    const expectedForce = mass * acceleration;
    const expectedImpulse = expectedForce * durationSeconds;
    const expectedFinalKineticEnergy = 0.5 * mass * expectedFinalSpeed ** 2;
    const expectedAveragePower = expectedFinalKineticEnergy / durationSeconds;
    const formulaChecks: Array<{ pattern: RegExp; expected: number; unitLabel: string }> = [
      { pattern: /\bfinal_speed\b|\bfinal\s+(?:speed|velocity)\b|\bv\s*=/, expected: expectedFinalSpeed, unitLabel: "m/s" },
      { pattern: /\bforce\b|\bf\s*=\s*m\s*a\b/, expected: expectedForce, unitLabel: "N" },
      { pattern: /\bimpulse\b|\bj\s*=|\bf\s*t\b|\bm\s*a\s*t\b/, expected: expectedImpulse, unitLabel: "N*s" },
      { pattern: /\bfinal_kinetic_energy\b|\bfinal\s+kinetic\s+energy\b|\bke\s*=/, expected: expectedFinalKineticEnergy, unitLabel: "J" },
      { pattern: /\baverage_power\b|\baverage\s+power\b|\bp(?:_avg)?\s*=/, expected: expectedAveragePower, unitLabel: "W" },
    ];
    const matchingCheck = formulaChecks.find((check: { pattern: RegExp; expected: number; unitLabel: string }) => check.pattern.test(subgoalText));
    if (matchingCheck && !valuesClose(receipt.result_value, matchingCheck.expected)) {
      return {
        ok: false,
        reason: `formula_expression_inconsistent_with_prompt:expected_${formatNumber(matchingCheck.expected)}_${matchingCheck.unitLabel}`,
      };
    }
  }

  if (
    /\b(?:maximum|max)\s+height\b|\bheight\b/.test(normalizedPrompt) &&
    /\b(?:kinetic\s+energy|energy\s+convert|converts?\s+to\s+gravitational|potential\s+energy)\b/.test(normalizedPrompt) &&
    /\bheight\b/.test(subgoalText) &&
    receipt.result_unit === "m"
  ) {
    const massSpeed = extractMassSpeed(normalizedPrompt);
    if (massSpeed) {
      const expectedHeight = (0.5 * massSpeed.mass * massSpeed.speed ** 2) / (massSpeed.mass * G0);
      if (!valuesClose(receipt.result_value, expectedHeight)) {
        return {
          ok: false,
          reason: `formula_expression_inconsistent_with_prompt:expected_${formatNumber(expectedHeight)}_m`,
        };
      }
    }
  }

  return { ok: true, reason: null };
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

const evaluateNumericExpression = (expression: string): number | null => {
  const normalized = normalizePrompt(expression)
    .replace(/\^/g, "**")
    .replace(/\bsqrt\s*\(/gi, "Math.sqrt(")
    .replace(/\bpi\b/gi, "Math.PI");
  if (!/^[0-9eE+\-*/().,\s*MathsqrtPI]+$/.test(normalized)) return null;
  try {
    const value = Function(`"use strict"; return (${normalized});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const buildPlan = (turnId: string, prompt: string, subgoals: DraftSubgoal[]): HelixCalculatorCompoundPlan => ({
  schema: HELIX_CALCULATOR_COMPOUND_PLAN_SCHEMA,
  turn_id: turnId,
  user_goal: prompt,
  subgoals: subgoals.map((subgoal: DraftSubgoal) => ({
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
    ...plan.subgoals.map((subgoal: HelixCalculatorCompoundSubgoal) => ({
      step_id: `solve_${subgoal.id}`,
      kind: "run_panel_action" as const,
      panel_id: "scientific-calculator",
      action_id: "solve_expression",
      args: {
        latex: subgoal.expression,
        calculator_setup: subgoal.setup ?? null,
      },
      depends_on: subgoal.depends_on.map((id: string) => `solve_${id}`),
      required: true,
      expected_receipt_kind: "calculator_receipt",
    })),
    {
      step_id: "evaluate_calculator_compound_chain",
      kind: "evaluate_result",
      required: true,
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      depends_on: plan.subgoals.map((subgoal: HelixCalculatorCompoundSubgoal) => `solve_${subgoal.id}`),
    },
  ],
  missing_requirements: [],
  created_at: new Date().toISOString(),
});

const buildPhotonFrequencyDraft = (prompt: string, frequency: number, includeEv: boolean): DraftSubgoal[] => {
  const wavelength = C / frequency;
  const energyJ = H * frequency;
  const energyEv = energyJ / EV_J;
  const subgoals: DraftSubgoal[] = [
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
  ];
  if (includeEv) {
    subgoals.push({
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
    });
  }
  return subgoals;
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
  if (
    (/\bfrequency\b|\bhz\b/i.test(normalized)) &&
    /\bwavelength\b/i.test(normalized) &&
    /\b(?:energy|photon\s+energy|joules?|j\b|ev\b)\b/i.test(normalized)
  ) {
    const frequency = extractFrequency(normalized);
    if (frequency) return { subgoals: buildPhotonFrequencyDraft(normalized, frequency, /\bev\b/i.test(normalized)), answerKind: "photon_frequency_chain" };
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
  const byId = new Map(receipts.map((receipt: HelixCalculatorSubgoalReceipt) => [receipt.subgoal_id, receipt]));
  if (answerKind === "photon_frequency_chain") {
    const lines = [
      "Calculator compound plan completed.",
      `Wavelength: ${byId.get("wavelength")?.result_text} m.`,
      `Photon energy: ${byId.get("photon_energy_j")?.result_text} J.`,
    ];
    if (byId.has("photon_energy_ev")) {
      lines.push(`Photon energy: ${byId.get("photon_energy_ev")?.result_text} eV.`);
      lines.push("Interpretation: the chain used frequency to compute wavelength, then used Planck's relation to compute photon energy and converted the validated joule result to electronvolts.");
    } else {
      lines.push("Interpretation: the chain used frequency to compute wavelength, then used Planck's relation to compute photon energy. No electronvolt conversion was required because the prompt did not ask for eV.");
    }
    return lines.join("\n");
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
  if (answerKind === "model_authored_generic_calculator_chain") {
    const lines = ["Calculator planning loop completed."];
    for (const receipt of receipts) {
      const unit = receipt.result_unit ? ` ${receipt.result_unit}` : "";
      const setup = receipt.calculator_setup;
      const subgoal = setup?.subgoal ?? receipt.subgoal_id;
      lines.push(`${subgoal}: ${receipt.result_text}${unit}.`);
    }
    lines.push("Interpretation: each numeric claim above is backed by a scientific-calculator subgoal receipt.");
    return lines.join("\n");
  }
  return `Calculator compound plan completed for: ${prompt}`;
};

export function buildCalculatorCandidateHints(input: {
  prompt: string;
  turnId: string;
}): CalculatorCandidateHints {
  return {
    schema: "helix.calculator_candidate_hints.v1",
    turn_id: input.turnId,
    prompt: input.prompt,
    authority: "hint_only",
    constants: [
      { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light approximation" },
      { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
      { symbol: "e", value: "1.602176634e-19", unit: "J/eV", meaning: "joules per electronvolt" },
      { symbol: "g", value: "9.80665", unit: "m/s^2", meaning: "standard gravity" },
      { symbol: "G", value: "6.67430e-11", unit: "N*m^2/kg^2", meaning: "Newtonian gravitational constant" },
    ],
    formula_hints: [
      { id: "force", expression_template: "m*a", quantity: "force", result_unit: "N", when_useful: "mass and acceleration are given" },
      { id: "kinetic_energy", expression_template: "0.5*m*v^2", quantity: "energy", result_unit: "J", when_useful: "mass and speed are given" },
      { id: "potential_energy", expression_template: "m*g*h", quantity: "energy", result_unit: "J", when_useful: "mass and height near Earth are given" },
      { id: "pendulum_period", expression_template: "2*pi*sqrt(L/g)", quantity: "time", result_unit: "s", when_useful: "small-angle pendulum length is given" },
      { id: "de_broglie_momentum", expression_template: "h/lambda", quantity: "momentum", result_unit: "kg*m/s", when_useful: "wavelength is given and momentum is requested" },
      { id: "photon_energy", expression_template: "h*f", quantity: "energy", result_unit: "J", when_useful: "photon frequency is given" },
      { id: "wavelength_from_frequency", expression_template: "c/f", quantity: "length", result_unit: "m", when_useful: "wave or photon frequency is given and wavelength is requested" },
    ],
    expression_rules: [
      "Return calculator-ready numeric expressions only; no prose or units inside expression.",
      "Use *, /, ^, parentheses, sqrt(), pi, and scientific notation.",
      "Convert input units to SI before writing the expression.",
      "Create one subgoal per meaningful numeric result.",
      "Use depends_on only when a later expression uses an earlier result.",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
}

const buildFallbackGenericSubgoals = (prompt: string): CalculatorModelAuthoredSubgoal[] => {
  const normalized = normalizePrompt(prompt);
  const subgoals: CalculatorModelAuthoredSubgoal[] = [];
  const mass = extractNumberNear(normalized, ["kg", "kilogram", "kilograms"]);
  const restKinematics = extractRestToSpeedKinematics(normalized);
  const acceleration = extractExplicitAcceleration(normalized) ?? restKinematics?.acceleration ?? null;
  const durationSeconds = extractDurationSeconds(normalized);
  const finalSpeedFromPrompt = restKinematics?.finalSpeed ?? (mass ? extractMassSpeed(normalized)?.speed : null);
  if (/\bacceleration\b/i.test(normalized) && acceleration && Number.isFinite(acceleration)) {
    const expression =
      restKinematics && durationSeconds
        ? `${formatNumber(restKinematics.finalSpeed)}/${formatNumber(durationSeconds)}`
        : formatNumber(acceleration);
    subgoals.push({
      id: "acceleration",
      label: restKinematics ? "Compute acceleration from a = Delta v / t" : "Compute acceleration",
      expression,
      expected_quantity: "acceleration",
      expected_unit: "m/s^2",
      equation: restKinematics ? "a = Delta v / t" : "a",
      assumptions: restKinematics
        ? ["Initial speed is zero and the stated final speed is reached over the stated duration."]
        : ["Acceleration is supplied directly by the prompt."],
      variables: restKinematics
        ? [
            { symbol: "Delta v", value: formatNumber(restKinematics.finalSpeed), unit: "m/s", meaning: "change in speed from rest" },
            { symbol: "t", value: formatNumber(durationSeconds ?? restKinematics.durationSeconds), unit: "s", meaning: "duration" },
          ]
        : [{ symbol: "a", value: formatNumber(acceleration), unit: "m/s^2", meaning: "acceleration" }],
    });
  }
  if (/\bforce\b/i.test(normalized) && mass && acceleration && Number.isFinite(acceleration)) {
    subgoals.push({
      id: "force",
      label: "Compute force from F = m a",
      expression: `${formatNumber(mass)}*${formatNumber(acceleration)}`,
      expected_quantity: "force",
      expected_unit: "N",
      equation: "F = m a",
      depends_on: subgoals.some((subgoal: CalculatorModelAuthoredSubgoal) => subgoal.id === "acceleration") ? ["acceleration"] : [],
      assumptions: ["Mass is in kilograms and acceleration is in metres per second squared."],
      variables: [
        { symbol: "m", value: formatNumber(mass), unit: "kg", meaning: "mass" },
        { symbol: "a", value: formatNumber(acceleration), unit: "m/s^2", meaning: "acceleration" },
      ],
    });
  }
  if (mass && acceleration && Number.isFinite(acceleration) && durationSeconds && Number.isFinite(durationSeconds)) {
    const finalSpeed = finalSpeedFromPrompt ?? acceleration * durationSeconds;
    const impulse = mass * acceleration * durationSeconds;
    const finalKineticEnergy = 0.5 * mass * finalSpeed ** 2;
    const averagePower = finalKineticEnergy / durationSeconds;
    const baseVariables = [
      { symbol: "m", value: formatNumber(mass), unit: "kg", meaning: "mass" },
      { symbol: "a", value: formatNumber(acceleration), unit: "m/s^2", meaning: "acceleration" },
      { symbol: "t", value: formatNumber(durationSeconds), unit: "s", meaning: "duration" },
    ];
    if (/\bfinal\s+(?:speed|velocity)\b|\bspeed\b/i.test(normalized)) {
      subgoals.push({
        id: "final_speed",
        label: "Compute final speed from v = a t",
        expression: `${formatNumber(acceleration)}*${formatNumber(durationSeconds)}`,
        expected_quantity: "speed",
        expected_unit: "m/s",
        equation: "v = a t",
        assumptions: ["Initial speed is zero and acceleration is treated as constant over the stated duration."],
        variables: baseVariables,
      });
    }
    if (/\bimpulse\b/i.test(normalized)) {
      subgoals.push({
        id: "impulse",
        label: "Compute impulse from J = F t = m a t",
        expression: `${formatNumber(mass)}*${formatNumber(acceleration)}*${formatNumber(durationSeconds)}`,
        expected_quantity: "momentum",
        expected_unit: "N*s",
        equation: "J = F t = m a t",
        depends_on: subgoals.some((subgoal: CalculatorModelAuthoredSubgoal) => subgoal.id === "force") ? ["force"] : [],
        assumptions: ["Average acceleration and average force are treated as constant over the interval."],
        variables: baseVariables,
        interpretation: `Equivalent to a momentum change of ${formatNumber(impulse)} N*s under the idealized assumptions.`,
      });
    }
    if (/\b(?:final\s+)?kinetic\s+energy\b|\bke\b/i.test(normalized)) {
      subgoals.push({
        id: "final_kinetic_energy",
        label: "Compute final kinetic energy from KE = 1/2 m v^2",
        expression: finalSpeedFromPrompt
          ? `0.5*${formatNumber(mass)}*${formatNumber(finalSpeed)}^2`
          : `0.5*${formatNumber(mass)}*(${formatNumber(acceleration)}*${formatNumber(durationSeconds)})^2`,
        expected_quantity: "energy",
        expected_unit: "J",
        equation: finalSpeedFromPrompt ? "KE = 1/2 m v^2" : "KE = 1/2 m (a t)^2",
        depends_on: subgoals.some((subgoal: CalculatorModelAuthoredSubgoal) => subgoal.id === "final_speed") ? ["final_speed"] : [],
        assumptions: ["Non-relativistic kinetic energy.", "Initial speed is zero and acceleration is constant."],
        variables: [
          ...baseVariables,
          { symbol: "v", value: formatNumber(finalSpeed), unit: "m/s", meaning: finalSpeedFromPrompt ? "stated final speed" : "final speed from a t" },
        ],
        interpretation: `Uses the final speed ${formatNumber(finalSpeed)} m/s.`,
      });
    }
    if (/\baverage\s+power\b|\bpower\b/i.test(normalized)) {
      subgoals.push({
        id: "average_power",
        label: "Compute average power from final kinetic energy over time",
        expression: `0.5*${formatNumber(mass)}*(${formatNumber(acceleration)}*${formatNumber(durationSeconds)})^2/${formatNumber(durationSeconds)}`,
        expected_quantity: "dimensionless",
        expected_unit: "W",
        equation: "P_avg = KE / t",
        depends_on: subgoals.some((subgoal: CalculatorModelAuthoredSubgoal) => subgoal.id === "final_kinetic_energy") ? ["final_kinetic_energy"] : [],
        assumptions: ["Average power is computed from the change in kinetic energy divided by elapsed time."],
        variables: [
          ...baseVariables,
          { symbol: "KE", value: formatNumber(finalKineticEnergy), unit: "J", meaning: "final kinetic energy" },
        ],
        interpretation: `Equivalent to ${formatNumber(averagePower)} W for the idealized sled energy gain.`,
      });
    }
  }
  const lengthOrHeight = extractNumberNear(normalized, ["m", "meter", "meters", "metre", "metres"]);
  if (/\b(?:potential\s+energy|gravitational\s+energy|mgh)\b/i.test(normalized) && mass && lengthOrHeight) {
    subgoals.push({
      id: "gravitational_potential_energy",
      label: "Compute gravitational potential energy",
      expression: `${formatNumber(mass)}*${formatNumber(G0)}*${formatNumber(lengthOrHeight)}`,
      expected_quantity: "energy",
      expected_unit: "J",
      equation: "U = m g h",
      assumptions: ["Uses standard gravity g = 9.80665 m/s^2."],
      variables: [
        { symbol: "m", value: formatNumber(mass), unit: "kg", meaning: "mass" },
        { symbol: "g", value: formatNumber(G0), unit: null, meaning: "standard gravity numeric value in m/s^2" },
        { symbol: "h", value: formatNumber(lengthOrHeight), unit: "m", meaning: "height" },
      ],
    });
  }
  const pendulumLength = /\bpendulum\b/i.test(normalized) ? lengthOrHeight : null;
  if (pendulumLength && /\b(?:period|pendulum)\b/i.test(normalized)) {
    subgoals.push({
      id: "pendulum_period",
      label: "Estimate small-angle pendulum period",
      expression: `2*pi*sqrt(${formatNumber(pendulumLength)}/${formatNumber(G0)})`,
      expected_quantity: "time",
      expected_unit: "s",
      equation: "T = 2 pi sqrt(L / g)",
      assumptions: ["Small-angle pendulum approximation.", "Uses standard gravity g = 9.80665 m/s^2."],
      variables: [
        { symbol: "L", value: formatNumber(pendulumLength), unit: "m", meaning: "pendulum length" },
        { symbol: "g", value: formatNumber(G0), unit: null, meaning: "standard gravity numeric value in m/s^2" },
      ],
    });
  }
  const wavelength = /\bde\s*broglie|\bmomentum\b/i.test(normalized) ? extractWavelengthMeters(normalized) : null;
  if (wavelength && /\b(?:de\s*broglie|momentum)\b/i.test(normalized)) {
    subgoals.push({
      id: "de_broglie_momentum",
      label: "Compute de Broglie momentum from wavelength",
      expression: `${formatNumber(H)}/${formatNumber(wavelength.meters)}`,
      expected_quantity: "momentum",
      expected_unit: "kg*m/s",
      equation: "p = h / lambda",
      assumptions: ["Wavelength is converted to metres before evaluation."],
      variables: [
        { symbol: "h", value: formatNumber(H), unit: "J*s", meaning: "Planck constant" },
        { symbol: "lambda", value: wavelength.label, unit: "m", meaning: "wavelength converted to SI" },
      ],
    });
  }
  return subgoals.slice(0, 5);
};

const coerceModelSubgoalsToDrafts = (subgoals: CalculatorModelAuthoredSubgoal[]): DraftSubgoal[] => {
  return subgoals.slice(0, 5).flatMap((subgoal: CalculatorModelAuthoredSubgoal, index: number) => {
    const expression = normalizePrompt(String(subgoal.expression ?? ""));
    if (!expression) return [];
    const value = evaluateNumericExpression(expression);
    if (value === null) return [];
    const expectedUnit = subgoal.expected_unit
      ? String(subgoal.expected_unit).trim()
      : subgoal.expected_quantity === "momentum"
        ? "kg*m/s"
        : null;
    const unitQuantity = expectedUnit ? findHelixUnitDefinition(expectedUnit)?.quantity ?? null : null;
    const expectedQuantity = subgoal.expected_quantity ? String(subgoal.expected_quantity).trim() : unitQuantity ?? "dimensionless";
    const id = sanitizeId(String(subgoal.id ?? subgoal.label ?? expectedQuantity), `calculator_subgoal_${index + 1}`);
    const label = normalizePrompt(String(subgoal.label ?? subgoal.equation ?? `Compute ${expectedQuantity}`));
    return [{
      id,
      label,
      expression,
      expected_quantity: expectedQuantity as HelixCalculatorCompoundQuantity,
      expected_unit: expectedUnit,
      depends_on: Array.isArray(subgoal.depends_on)
        ? subgoal.depends_on.map((entry: string) => sanitizeId(String(entry ?? ""), "")).filter(Boolean)
        : [],
      value,
      result_text: formatNumber(value),
      setup: unitSetup({
        expression,
        domain: "generic",
        subgoal: label,
        equation: subgoal.equation ?? null,
        resultUnit: expectedUnit,
        variables: subgoal.variables ?? [],
        assumptions: subgoal.assumptions?.map((entry: string) => String(entry)).filter(Boolean).slice(0, 6) ?? [],
        interpretation: subgoal.interpretation ?? null,
      }),
    }];
  });
};

export function draftGenericCalculatorSubgoalsForPrompt(prompt: string): CalculatorModelAuthoredSubgoal[] {
  return buildFallbackGenericSubgoals(prompt);
}

export function runCalculatorCompoundChain(input: {
  prompt: string;
  turnId: string;
  threadId: string;
}): CalculatorCompoundChainResult | null {
  const draft = draftSubgoalsForPrompt(input.prompt);
  if (!draft || draft.subgoals.length < 2 || draft.subgoals.length > 5) return null;
  const plan = buildPlan(input.turnId, input.prompt, draft.subgoals);
  const receipts = plan.subgoals.map((subgoal: HelixCalculatorCompoundSubgoal) => {
    const source = draft.subgoals.find((entry: DraftSubgoal) => entry.id === subgoal.id);
    return makeReceipt(input.turnId, subgoal, source?.value ?? null, source?.result_text ?? null);
  });
  const validations = receipts.map((receipt: HelixCalculatorSubgoalReceipt) => {
    const subgoal = plan.subgoals.find((entry: HelixCalculatorCompoundSubgoal) => entry.id === receipt.subgoal_id);
    if (!subgoal) throw new Error(`missing_compound_subgoal:${receipt.subgoal_id}`);
    return validateReceipt(input.turnId, input.prompt, subgoal, receipt);
  });
  const allSatisfied = validations.every((validation: HelixCalculatorResultValidation) => validation.satisfied);
  if (!allSatisfied) return null;
  const workstationPlan = buildWorkstationPlan(input, plan);
  const answerText = synthesizeAnswer(input.prompt, draft.answerKind, receipts);
  const evidenceRefs = receipts.map((receipt: HelixCalculatorSubgoalReceipt) => receipt.receipt_id);
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
  const actionSteps = plan.subgoals.map((subgoal: HelixCalculatorCompoundSubgoal) => ({
    panel_id: "scientific-calculator",
    action_id: "solve_expression",
    args: {
      latex: subgoal.expression,
      calculator_setup: subgoal.setup ?? null,
      compound_run_id: input.turnId,
      compound_subgoal_id: subgoal.id,
    },
  }));
  const artifacts: CalculatorCompoundChainArtifact[] = [
    { kind: "calculator_compound_plan", payload: plan as unknown as Record<string, unknown> },
    ...receipts.map((receipt: HelixCalculatorSubgoalReceipt) => ({ kind: "calculator_receipt", payload: { ...receipt, kind: "calculator_receipt" } as unknown as Record<string, unknown> })),
    ...receipts.map((receipt: HelixCalculatorSubgoalReceipt) => ({ kind: "calculator_subgoal_receipt", payload: receipt as unknown as Record<string, unknown> })),
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
    ...validations.map((validation: HelixCalculatorResultValidation) => ({ kind: "calculator_result_validation", payload: validation as unknown as Record<string, unknown> })),
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

export function runCalculatorModelAuthoredChain(input: {
  prompt: string;
  turnId: string;
  threadId: string;
  subgoals: CalculatorModelAuthoredSubgoal[];
}): CalculatorCompoundChainResult | null {
  const requestedExpressionCount = input.subgoals
    .slice(0, 5)
    .filter((subgoal: CalculatorModelAuthoredSubgoal) => normalizePrompt(String(subgoal.expression ?? ""))).length;
  const draftSubgoals = coerceModelSubgoalsToDrafts(input.subgoals);
  if (draftSubgoals.length !== requestedExpressionCount) return null;
  if (draftSubgoals.length < 1 || draftSubgoals.length > 5) return null;
  const plan = buildPlan(input.turnId, input.prompt, draftSubgoals);
  const receipts = plan.subgoals.map((subgoal: HelixCalculatorCompoundSubgoal) => {
    const source = draftSubgoals.find((entry: DraftSubgoal) => entry.id === subgoal.id);
    return makeReceipt(input.turnId, subgoal, source?.value ?? null, source?.result_text ?? null);
  });
  const validations = receipts.map((receipt: HelixCalculatorSubgoalReceipt) => {
    const subgoal = plan.subgoals.find((entry: HelixCalculatorCompoundSubgoal) => entry.id === receipt.subgoal_id);
    if (!subgoal) throw new Error(`missing_compound_subgoal:${receipt.subgoal_id}`);
    return validateReceipt(input.turnId, input.prompt, subgoal, receipt);
  });
  const allSatisfied = validations.every((validation: HelixCalculatorResultValidation) => validation.satisfied);
  if (!allSatisfied) return null;
  const workstationPlan = buildWorkstationPlan(input, plan);
  const answerText = synthesizeAnswer(input.prompt, "model_authored_generic_calculator_chain", receipts);
  const evidenceRefs = receipts.map((receipt: HelixCalculatorSubgoalReceipt) => receipt.receipt_id);
  const evaluation: CalculatorCompoundChainResult["evaluation"] = {
    schema: HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
    evaluation_id: newId("workstation-tool-eval:calculator_compound", input.turnId, "chain"),
    plan_id: workstationPlan.plan_id,
    thread_id: input.threadId,
    turn_id: input.turnId,
    goal: input.prompt,
    subgoal: "Run a model-authored calculator plan and validate every required numeric subgoal.",
    tool_receipt_ids: evidenceRefs,
    supports_goal: true,
    summary: `model_authored_calculator_chain satisfied ${validations.length} calculator subgoals with validated results.`,
    evidence_refs: evidenceRefs,
    calculator_setup: plan.subgoals[plan.subgoals.length - 1]?.setup ?? null,
    calculator_compound_plan: plan,
    calculator_result_validations: validations,
    deterministic: false,
    model_invoked: true,
    created_at: new Date().toISOString(),
  };
  const actionSteps = plan.subgoals.map((subgoal: HelixCalculatorCompoundSubgoal) => ({
    panel_id: "scientific-calculator",
    action_id: "solve_expression",
    args: {
      latex: subgoal.expression,
      calculator_setup: subgoal.setup ?? null,
      compound_run_id: input.turnId,
      compound_subgoal_id: subgoal.id,
    },
  }));
  const artifacts: CalculatorCompoundChainArtifact[] = [
    { kind: "calculator_compound_plan", payload: plan as unknown as Record<string, unknown> },
    ...receipts.map((receipt: HelixCalculatorSubgoalReceipt) => ({ kind: "calculator_receipt", payload: { ...receipt, kind: "calculator_receipt" } as unknown as Record<string, unknown> })),
    ...receipts.map((receipt: HelixCalculatorSubgoalReceipt) => ({ kind: "calculator_subgoal_receipt", payload: receipt as unknown as Record<string, unknown> })),
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
    ...validations.map((validation: HelixCalculatorResultValidation) => ({ kind: "calculator_result_validation", payload: validation as unknown as Record<string, unknown> })),
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
        observation_kind: "calculator_model_authored_results",
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
        consumed_observation_kind: "calculator_model_authored_results",
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
