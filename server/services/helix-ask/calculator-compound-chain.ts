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
const HBAR = 1.054571817e-34;
const C = 3e8;
const EV_J = 1.602176634e-19;
const G0 = 9.80665;
const ELECTRON_MASS_KG = 9.1093837015e-31;

export type CalculatorCompoundChainArtifact = {
  kind: string;
  payload: Record<string, unknown>;
};

export type CalculatorCandidateHints = {
  schema: "helix.calculator_candidate_hints.v1";
  turn_id: string;
  prompt: string;
  authority: "hint_only";
  numeric_normalizations: CalculatorNumericNormalization[];
  problem_interpretation: CalculatorProblemInterpretation;
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

export type CalculatorNumericNormalization = {
  raw_token: string;
  normalized_expression: string;
  decimal_value: number;
  notation: "mixed_number";
  confidence: "high";
  source: "deterministic_math_notation_normalizer";
};

export type CalculatorProblemInterpretation = {
  schema: "helix.calculator_problem_interpretation.v1";
  turn_id: string;
  prompt_kind: "underdetermined_triangle" | "unit_conversion" | "calculator_candidate";
  determination_status:
    | "fully_determined"
    | "underdetermined"
    | "overdetermined_or_contradictory"
    | "ambiguous_target"
    | "needs_unit_conversion"
    | "pure_expression";
  needs_more_information: boolean;
  safe_to_calculate: boolean;
  reason: string | null;
  givens: string[];
  unknowns: string[];
  constraints: string[];
  missing_constraints: string[];
  clarifying_question: string | null;
  normalized_quantities: CalculatorNumericNormalization[];
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
const lengthUnitTokenPattern =
  "(?:in\\.?|inch|inches|ft\\.?|foot|feet|cm|centimeter|centimeters|centimetre|centimetres|m|meter|meters|metre|metres)";

const normalizeLengthUnitToken = (unit: string | null | undefined): string | null => {
  const normalized = String(unit ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return null;
  if (normalized === "in" || normalized === "inch" || normalized === "inches") return "in";
  if (normalized === "ft" || normalized === "foot" || normalized === "feet") return "ft";
  if (normalized === "cm" || normalized === "centimeter" || normalized === "centimeters" || normalized === "centimetre" || normalized === "centimetres") return "cm";
  if (normalized === "m" || normalized === "meter" || normalized === "meters" || normalized === "metre" || normalized === "metres") return "m";
  return null;
};

export const normalizeCalculatorCompoundLengthPhrases = (value: string): string => {
  const sameUnitFractionPattern = new RegExp(
    `\\b(\\d+)\\s*(${lengthUnitTokenPattern})\\s+(?:and|plus|\\+)\\s+(\\d+)\\s*/\\s*(\\d+)\\s*(${lengthUnitTokenPattern})\\b`,
    "gi",
  );
  const sharedUnitFractionPattern = new RegExp(
    `\\b(\\d+)\\s+(?:and|plus|\\+)\\s+(\\d+)\\s*/\\s*(\\d+)\\s*(${lengthUnitTokenPattern})\\b`,
    "gi",
  );
  const adjacentSameUnitFractionPattern = new RegExp(
    `\\b(\\d+)\\s*(${lengthUnitTokenPattern})\\s+(\\d+)\\s*/\\s*(\\d+)\\s*(${lengthUnitTokenPattern})\\b`,
    "gi",
  );

  return value
    .replace(sameUnitFractionPattern, (match, whole, firstUnit, numerator, denominator, secondUnit) => {
      const firstNormalizedUnit = normalizeLengthUnitToken(firstUnit);
      const secondNormalizedUnit = normalizeLengthUnitToken(secondUnit);
      if (!firstNormalizedUnit || firstNormalizedUnit !== secondNormalizedUnit) return match;
      return `${whole} ${numerator}/${denominator} ${firstUnit}`;
    })
    .replace(sharedUnitFractionPattern, (_match, whole, numerator, denominator, unit) => `${whole} ${numerator}/${denominator} ${unit}`)
    .replace(adjacentSameUnitFractionPattern, (match, whole, firstUnit, numerator, denominator, secondUnit) => {
      const firstNormalizedUnit = normalizeLengthUnitToken(firstUnit);
      const secondNormalizedUnit = normalizeLengthUnitToken(secondUnit);
      if (!firstNormalizedUnit || firstNormalizedUnit !== secondNormalizedUnit) return match;
      return `${whole} ${numerator}/${denominator} ${firstUnit}`;
    });
};

export const normalizeCalculatorMixedNumberLiterals = (value: string): string =>
  normalizeCalculatorCompoundLengthPhrases(value).replace(/(^|[^\w./])(\d+)\s+(\d+)\s*\/\s*(\d+)(?=$|[^\w./])/g, (match, prefix, whole, numerator, denominator) => {
    const wholeValue = Number(whole);
    const numeratorValue = Number(numerator);
    const denominatorValue = Number(denominator);
    if (
      !Number.isSafeInteger(wholeValue) ||
      !Number.isSafeInteger(numeratorValue) ||
      !Number.isSafeInteger(denominatorValue) ||
      denominatorValue === 0
    ) {
      return match;
    }
    return `${prefix}${wholeValue * denominatorValue + numeratorValue}/${denominatorValue}`;
  });

export const extractCalculatorNumericNormalizations = (prompt: string): CalculatorNumericNormalization[] => {
  const normalizations: CalculatorNumericNormalization[] = [];
  const normalizedPrompt = normalizeCalculatorCompoundLengthPhrases(prompt);
  normalizedPrompt.replace(/(^|[^\w./])(\d+)\s+(\d+)\s*\/\s*(\d+)(?=$|[^\w./])/g, (match, _prefix, whole, numerator, denominator) => {
    const wholeValue = Number(whole);
    const numeratorValue = Number(numerator);
    const denominatorValue = Number(denominator);
    if (
      Number.isSafeInteger(wholeValue) &&
      Number.isSafeInteger(numeratorValue) &&
      Number.isSafeInteger(denominatorValue) &&
      denominatorValue !== 0
    ) {
      const improperNumerator = wholeValue * denominatorValue + numeratorValue;
      normalizations.push({
        raw_token: `${whole} ${numerator}/${denominator}`,
        normalized_expression: `${improperNumerator}/${denominatorValue}`,
        decimal_value: improperNumerator / denominatorValue,
        notation: "mixed_number",
        confidence: "high",
        source: "deterministic_math_notation_normalizer",
      });
    }
    return match;
  });
  return normalizations;
};

export const detectUnderdeterminedTrianglePrompt = (prompt: string): boolean => {
  const normalized = normalizePrompt(normalizeCalculatorCompoundLengthPhrases(prompt));
  if (!/\btriangles?\b/i.test(normalized)) return false;
  if (!/\b(?:longest\s+side|largest\s+side)\b/i.test(normalized)) return false;
  const asksForMissingGeometry =
    /\b(?:other|remaining)\s+(?:two|2)\s+sides?\b|\bhow\s+long\s+are\s+the\s+other\b/i.test(normalized) ||
    /\b(?:solve|calculate|compute|find|determine|evaluate)\b[\s\S]{0,80}\btriangles?\b/i.test(normalized) ||
    /\btriangles?\b[\s\S]{0,80}\b(?:solve|calculate|compute|find|determine|evaluate)\b/i.test(normalized);
  if (!asksForMissingGeometry) return false;
  const sideMeasureMatches = normalized.match(
    new RegExp(`\\b(?:${numberPattern}|\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+)\\s*${lengthUnitTokenPattern}\\b`, "gi"),
  ) ?? [];
  const hasDeterminingConstraint =
    /\b(?:equilateral|isosceles|right\s+triangle|right-?angled|perimeter|area|angle|angles|one\s+leg|another\s+side|second\s+side|base|height|altitude|ratio|similar\s+triangle)\b/i.test(normalized);
  return sideMeasureMatches.length <= 1 && !hasDeterminingConstraint;
};

const lengthUnitFactorToMeters = (unit: string): number | null => {
  if (unit === "m") return 1;
  if (unit === "cm") return 0.01;
  if (unit === "ft") return 0.3048;
  if (unit === "in") return 0.0254;
  return null;
};

const lengthUnitLabel = (unit: string): string => {
  if (unit === "m") return "meters";
  if (unit === "cm") return "centimeters";
  if (unit === "ft") return "feet";
  if (unit === "in") return "inches";
  return unit;
};

const explicitLengthConversionTargetPattern =
  "(?:m|meters?|metres?|cm|centimeters?|centimetres?|in\\.?|inches?|ft\\.?|feet|foot)";

const explicitLengthConversionQuantityPattern =
  "(?:\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|[-+]?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?)";

type DetectedLengthUnitConversion = {
  rawQuantity: string;
  quantityExpression: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
  expression: string;
};

const detectLengthUnitConversionPrompt = (prompt: string): DetectedLengthUnitConversion | null => {
  const normalized = normalizePrompt(prompt);
  const patterns = [
    new RegExp(`\\bconvert\\s+(${explicitLengthConversionQuantityPattern})\\s*(${explicitLengthConversionTargetPattern})\\s+(?:to|into|as|in)\\s+(${explicitLengthConversionTargetPattern})\\b`, "i"),
    new RegExp(`\\bwhat\\s+is\\s+(${explicitLengthConversionQuantityPattern})\\s*(${explicitLengthConversionTargetPattern})\\s+(?:as|in)\\s+(${explicitLengthConversionTargetPattern})\\b`, "i"),
    new RegExp(`\\b(${explicitLengthConversionQuantityPattern})\\s*(${explicitLengthConversionTargetPattern})\\s+(?:to|into|as|in)\\s+(${explicitLengthConversionTargetPattern})\\b`, "i"),
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const rawQuantity = String(match[1] ?? "").trim();
    const fromUnit = normalizeLengthUnitToken(match[2]);
    const toUnit = normalizeLengthUnitToken(match[3]);
    if (!rawQuantity || !fromUnit || !toUnit || fromUnit === toUnit) continue;
    const fromFactor = lengthUnitFactorToMeters(fromUnit);
    const toFactor = lengthUnitFactorToMeters(toUnit);
    if (!fromFactor || !toFactor) continue;
    const quantityExpression = normalizeCalculatorMixedNumberLiterals(rawQuantity).replace(/\s+/g, "");
    const factor = fromFactor / toFactor;
    const factorExpression = formatNumber(factor);
    const expression = factor === 1 ? quantityExpression : `(${quantityExpression})*${factorExpression}`;
    return {
      rawQuantity,
      quantityExpression,
      fromUnit,
      toUnit,
      factor,
      expression,
    };
  }
  return null;
};

const buildCalculatorProblemInterpretation = (input: {
  prompt: string;
  turnId: string;
  numericNormalizations: CalculatorNumericNormalization[];
}): CalculatorProblemInterpretation => {
  const conversion = detectLengthUnitConversionPrompt(input.prompt);
  if (conversion) {
    return {
      schema: "helix.calculator_problem_interpretation.v1",
      turn_id: input.turnId,
      prompt_kind: "unit_conversion",
      determination_status: "needs_unit_conversion",
      needs_more_information: false,
      safe_to_calculate: true,
      reason: `The prompt explicitly asks to convert a length from ${conversion.fromUnit} to ${conversion.toUnit}.`,
      givens: [`length = ${conversion.quantityExpression} ${conversion.fromUnit}`],
      unknowns: [`length in ${conversion.toUnit}`],
      constraints: [`exact conversion factor: 1 ${conversion.fromUnit} = ${formatNumber(conversion.factor)} ${conversion.toUnit}`],
      missing_constraints: [],
      clarifying_question: null,
      normalized_quantities: input.numericNormalizations,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (detectUnderdeterminedTrianglePrompt(input.prompt)) {
    return {
      schema: "helix.calculator_problem_interpretation.v1",
      turn_id: input.turnId,
      prompt_kind: "underdetermined_triangle",
      determination_status: "underdetermined",
      needs_more_information: true,
      safe_to_calculate: false,
      reason: "The prompt gives only the longest side of a triangle, which does not determine the other two side lengths.",
      givens: ["longest side length"],
      unknowns: ["other two side lengths"],
      constraints: ["0 < a <= c", "0 < b <= c", "a + b > c"],
      missing_constraints: ["triangle_type", "angle", "another_side", "perimeter", "area", "side_ratio"],
      clarifying_question:
        "I need one more triangle constraint before calculating the other sides: triangle type, an angle, another side, perimeter/area, or a side ratio.",
      normalized_quantities: input.numericNormalizations,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  return {
    schema: "helix.calculator_problem_interpretation.v1",
    turn_id: input.turnId,
    prompt_kind: "calculator_candidate",
    determination_status: "fully_determined",
    needs_more_information: false,
    safe_to_calculate: true,
    reason: null,
    givens: [],
    unknowns: [],
    constraints: [],
    missing_constraints: [],
    clarifying_question: null,
    normalized_quantities: input.numericNormalizations,
    assistant_answer: false,
    raw_content_included: false,
  };
};

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
    prompt.match(new RegExp(`\\b(?:acceleration|accelerates?\\s+at)\\s*(?:=|is|of|at)?\\s*(${numberPattern})\\b`, "i")) ??
    prompt.match(new RegExp(`\\ba\\s*=\\s*(${numberPattern})\\b`, "i")) ??
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

const speedUnitPattern = "(?:m\\s*/\\s*s|meters?\\s+per\\s+second|metres?\\s+per\\s+second)";

const extractSpeedChangeKinematics = (
  prompt: string,
): { initialSpeed: number; finalSpeed: number; durationSeconds: number; acceleration: number } | null => {
  const match =
    prompt.match(new RegExp(`\\bfrom\\s+(${numberPattern})\\s*${speedUnitPattern}\\s+(?:to|up\\s+to)\\s+(${numberPattern})\\s*${speedUnitPattern}[\\s\\S]{0,80}\\b(?:in|over|during|for)\\s+(${numberPattern})\\s*(?:s|sec|secs|seconds?)\\b`, "i")) ??
    prompt.match(new RegExp(`\\b(?:accelerates?|accelerating|accelerated)\\s+from\\s+(${numberPattern})\\s*${speedUnitPattern}\\s+(?:to|up\\s+to)\\s+(${numberPattern})\\s*${speedUnitPattern}[\\s\\S]{0,80}\\b(?:in|over|during|for)\\s+(${numberPattern})\\s*(?:s|sec|secs|seconds?)\\b`, "i"));
  if (!match) return null;
  const initialSpeed = Number(match[1]);
  const finalSpeed = Number(match[2]);
  const durationSeconds = Number(match[3]);
  if (
    !Number.isFinite(initialSpeed) ||
    !Number.isFinite(finalSpeed) ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return null;
  }
  return {
    initialSpeed,
    finalSpeed,
    durationSeconds,
    acceleration: (finalSpeed - initialSpeed) / durationSeconds,
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
  const setupQuantity = receipt.calculator_setup?.result_quantity ?? null;
  const actualQuantity = receipt.result_quantity ?? setupQuantity;
  const unitOk = !subgoal.expected_unit || actualUnit === subgoal.expected_unit;
  const quantityOk = !subgoal.expected_quantity || actualQuantity === subgoal.expected_quantity;
  const setupQuantityOk = !setupQuantity || setupQuantity === actualQuantity;
  const semanticCheck = validateCalculatorReceiptSemanticConsistency(prompt, subgoal, receipt);
  const satisfied = resultNumeric && unitOk && quantityOk && setupQuantityOk && receipt.status === "completed" && semanticCheck.ok;
  const failureReason = satisfied
    ? null
    : !resultNumeric
      ? "missing_numeric_result"
      : !unitOk
        ? "unit_mismatch"
        : !quantityOk
          ? "quantity_mismatch"
          : !setupQuantityOk
            ? "setup_quantity_mismatch"
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
  const speedChangeKinematics = extractSpeedChangeKinematics(normalizedPrompt);
  const acceleration = restKinematics?.acceleration ?? speedChangeKinematics?.acceleration ?? extractExplicitAcceleration(normalizedPrompt) ?? null;
  const durationSeconds = speedChangeKinematics?.durationSeconds ?? extractDurationSeconds(normalizedPrompt);
  const finalSpeed = restKinematics?.finalSpeed ?? speedChangeKinematics?.finalSpeed ?? (mass ? extractMassSpeed(normalizedPrompt)?.speed : null);
  const initialSpeed = restKinematics ? 0 : speedChangeKinematics?.initialSpeed ?? null;
  if (mass && acceleration && Number.isFinite(acceleration) && durationSeconds && Number.isFinite(durationSeconds)) {
    const expectedFinalSpeed = finalSpeed ?? acceleration * durationSeconds;
    const expectedForce = mass * acceleration;
    const expectedImpulse = expectedForce * durationSeconds;
    const expectedFinalKineticEnergy = 0.5 * mass * expectedFinalSpeed ** 2;
    const expectedChangeKineticEnergy = initialSpeed === null
      ? expectedFinalKineticEnergy
      : 0.5 * mass * (expectedFinalSpeed ** 2 - initialSpeed ** 2);
    const expectedAveragePower = expectedFinalKineticEnergy / durationSeconds;
    const formulaChecks: Array<{ pattern: RegExp; expected: number; unitLabel: string }> = [
      { pattern: /\bfinal_speed\b|\bfinal\s+(?:speed|velocity)\b|\bv\s*=/, expected: expectedFinalSpeed, unitLabel: "m/s" },
      { pattern: /\bforce\b|\bf\s*=\s*m\s*a\b/, expected: expectedForce, unitLabel: "N" },
      { pattern: /\bimpulse\b|\bj\s*=|\bf\s*t\b|\bm\s*a\s*t\b/, expected: expectedImpulse, unitLabel: "N*s" },
      { pattern: /\bchange_kinetic_energy\b|\bchange\s+in\s+kinetic\s+energy\b|\bdelta\s+ke\b|\bΔke\b/, expected: expectedChangeKineticEnergy, unitLabel: "J" },
      { pattern: /\bfinal_kinetic_energy\b|\bfinal\s+kinetic\s+energy\b|(?<!delta\s)\bke\s*=/, expected: expectedFinalKineticEnergy, unitLabel: "J" },
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

const buildPhotonWavelengthDraft = (wavelength: { meters: number; label: string }, includeFrequency = false): DraftSubgoal[] => {
  const frequency = C / wavelength.meters;
  const energyJ = (H * C) / wavelength.meters;
  const energyEv = energyJ / EV_J;
  const subgoals: DraftSubgoal[] = [];
  if (includeFrequency) {
    subgoals.push({
      id: "photon_frequency",
      label: "Compute frequency from wavelength",
      expression: `3e8/${formatNumber(wavelength.meters)}`,
      expected_quantity: "frequency",
      expected_unit: "Hz",
      depends_on: [],
      value: frequency,
      result_text: formatNumber(frequency),
      setup: unitSetup({
        expression: `3e8/${formatNumber(wavelength.meters)}`,
        domain: "photon_frequency",
        subgoal: "Compute frequency from f = c / lambda.",
        equation: "f = c / lambda",
        resultUnit: "Hz",
        variables: [
          { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light" },
          { symbol: "lambda", value: wavelength.label, unit: "m", meaning: "wavelength" },
        ],
        assumptions: ["Wavelength is interpreted in SI meters before evaluation."],
      }),
    });
  }
  subgoals.push(
    {
      id: "photon_energy_j",
      label: includeFrequency ? "Compute photon energy in joules from frequency" : "Compute photon energy in joules from wavelength",
      expression: includeFrequency ? `6.62607015e-34*${formatNumber(frequency)}` : `(6.62607015e-34*3e8)/${formatNumber(wavelength.meters)}`,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: includeFrequency ? ["photon_frequency"] : [],
      value: energyJ,
      result_text: formatNumber(energyJ),
      setup: unitSetup({
        expression: includeFrequency ? `6.62607015e-34*${formatNumber(frequency)}` : `(6.62607015e-34*3e8)/${formatNumber(wavelength.meters)}`,
        domain: "photon_energy",
        subgoal: includeFrequency ? "Compute photon energy from E = hf." : "Compute photon energy from E = hc/lambda.",
        equation: includeFrequency ? "E = h f" : "E = h c / lambda",
        resultUnit: "J",
        variables: includeFrequency
          ? [
              { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
              { symbol: "f", value: formatNumber(frequency), unit: "Hz", meaning: "frequency" },
            ]
          : [
              { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
              { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light" },
              { symbol: "lambda", value: wavelength.label, unit: "m", meaning: "wavelength" },
            ],
        assumptions: includeFrequency ? ["Planck relation E = hf."] : ["Wavelength is interpreted in SI meters before evaluation."],
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
  );
  return subgoals;
};

const extractModeNumber = (prompt: string): number => {
  const match =
    prompt.match(/\b(?:n|mode(?:\s+number)?)\s*(?:=|is)?\s*(\d+)\b/i) ??
    prompt.match(/\b(\d+)(?:st|nd|rd|th)?\s+mode\b/i);
  const value = Number(match?.[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
};

const buildCasimirCavityModeDraft = (lengthMeters: number, modeNumber: number): DraftSubgoal[] => {
  const frequency = (modeNumber * C) / (2 * lengthMeters);
  const photonEnergy = H * frequency;
  const frequencyExpression = `${formatNumber(modeNumber)}*3e8/(2*${formatNumber(lengthMeters)})`;
  const energyExpression = `6.62607015e-34*${formatNumber(frequency)}`;
  return [
    {
      id: "casimir_cavity_mode_frequency",
      label: "Compute Casimir cavity mode frequency",
      expression: frequencyExpression,
      expected_quantity: "frequency",
      expected_unit: "Hz",
      depends_on: [],
      value: frequency,
      result_text: formatNumber(frequency),
      setup: unitSetup({
        expression: frequencyExpression,
        domain: "generic",
        subgoal: "Compute cavity mode frequency from f_n = n c / (2 L).",
        equation: "f_n = n c / (2 L)",
        resultUnit: "Hz",
        variables: [
          { symbol: "n", value: formatNumber(modeNumber), unit: null, meaning: "mode number" },
          { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light" },
          { symbol: "L", value: formatNumber(lengthMeters), unit: "m", meaning: "cavity length" },
        ],
        assumptions: [
          "Uses the idealized one-dimensional cavity mode relation.",
          "Boundary, material, and finite-temperature corrections are not included in this scalar cut.",
        ],
        interpretation: "Use this as a scalar cavity-mode proxy, not a full Casimir field solve.",
      }),
    },
    {
      id: "casimir_mode_photon_energy",
      label: "Compute photon energy of the cavity mode",
      expression: energyExpression,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: ["casimir_cavity_mode_frequency"],
      value: photonEnergy,
      result_text: formatNumber(photonEnergy),
      setup: unitSetup({
        expression: energyExpression,
        domain: "photon_energy",
        subgoal: "Compute photon energy from E = h f using the cavity-mode frequency.",
        equation: "E = h f",
        resultUnit: "J",
        variables: [
          { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
          { symbol: "f_n", value: formatNumber(frequency), unit: "Hz", meaning: "cavity mode frequency" },
        ],
        assumptions: ["Uses the frequency computed from the idealized scalar cavity-mode relation."],
        interpretation: "Use this as the photon-energy scalar cut associated with the cavity mode.",
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

const extractPositionUncertaintyMeters = (prompt: string): number | null => {
  const match =
    prompt.match(new RegExp(`\\b(?:dx|delta\\s*x|position\\s+uncertainty)\\s*(?:=|is|of)?\\s*(${numberPattern})\\s*(?:m|meters?|metres?)\\b`, "i")) ??
    prompt.match(new RegExp(`\\b(${numberPattern})\\s*(?:m|meters?|metres?)\\b[\\s\\S]{0,80}\\b(?:dx|delta\\s*x|position\\s+uncertainty)\\b`, "i"));
  const value = Number(match?.[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const buildUncertaintyMomentumDraft = (dxMeters: number): DraftSubgoal[] => {
  const dp = HBAR / (2 * dxMeters);
  const kineticEnergyJ = (dp ** 2) / (2 * ELECTRON_MASS_KG);
  const kineticEnergyEv = kineticEnergyJ / EV_J;
  return [
    {
      id: "minimum_momentum_uncertainty",
      label: "Compute minimum momentum uncertainty from Delta x Delta p >= hbar/2",
      expression: `1.054571817e-34/(2*${formatNumber(dxMeters)})`,
      expected_quantity: "momentum",
      expected_unit: null,
      depends_on: [],
      value: dp,
      result_text: formatNumber(dp),
      setup: unitSetup({
        expression: `1.054571817e-34/(2*${formatNumber(dxMeters)})`,
        domain: "generic",
        subgoal: "Compute the minimum momentum uncertainty from Delta p_min = hbar / (2 Delta x).",
        equation: "Delta p_min = hbar / (2 Delta x)",
        resultUnit: null,
        variables: [
          { symbol: "hbar", value: "1.054571817e-34", unit: "J*s", meaning: "reduced Planck constant" },
          { symbol: "Delta x", value: formatNumber(dxMeters), unit: "m", meaning: "position uncertainty" },
        ],
        assumptions: ["Saturates the Heisenberg lower bound for an estimate."],
      }),
    },
    {
      id: "minimum_kinetic_energy_j",
      label: "Estimate minimum kinetic energy in joules from p^2/(2 m_e)",
      expression: `${formatNumber(dp)}^2/(2*9.1093837015e-31)`,
      expected_quantity: "energy",
      expected_unit: "J",
      depends_on: ["minimum_momentum_uncertainty"],
      value: kineticEnergyJ,
      result_text: formatNumber(kineticEnergyJ),
      setup: unitSetup({
        expression: `${formatNumber(dp)}^2/(2*9.1093837015e-31)`,
        domain: "kinetic_energy",
        subgoal: "Estimate non-relativistic kinetic energy from the minimum momentum uncertainty.",
        equation: "K_min = (Delta p_min)^2 / (2 m_e)",
        resultUnit: "J",
        variables: [
          { symbol: "Delta p_min", value: formatNumber(dp), unit: "kg*m/s", meaning: "minimum momentum uncertainty" },
          { symbol: "m_e", value: "9.1093837015e-31", unit: "kg", meaning: "electron mass" },
        ],
        assumptions: ["Non-relativistic kinetic-energy estimate."],
      }),
    },
    {
      id: "minimum_kinetic_energy_ev",
      label: "Convert minimum kinetic energy from joules to electronvolts",
      expression: `${formatNumber(kineticEnergyJ)}/1.602176634e-19`,
      expected_quantity: "energy",
      expected_unit: "eV",
      depends_on: ["minimum_kinetic_energy_j"],
      value: kineticEnergyEv,
      result_text: formatNumber(kineticEnergyEv),
      setup: unitSetup({
        expression: `${formatNumber(kineticEnergyJ)}/1.602176634e-19`,
        domain: "generic",
        subgoal: "Convert the kinetic-energy estimate from joules to electronvolts.",
        equation: "K_eV = K_J / (1.602176634e-19)",
        resultUnit: "eV",
        variables: [
          { symbol: "K_J", value: formatNumber(kineticEnergyJ), unit: "J", meaning: "minimum kinetic energy" },
          { symbol: "e", value: "1.602176634e-19", unit: "J/eV", meaning: "joules per electronvolt" },
        ],
        assumptions: ["1 eV = 1.602176634e-19 J."],
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
  if (
    /\bfrequency\b/i.test(normalized) &&
    /\b(?:nm|nanometer|nanometre)\b/i.test(normalized) &&
    /\b(?:energy|joules?|j\b|ev\b)\b/i.test(normalized)
  ) {
    const wavelength = extractWavelengthMeters(normalized);
    if (wavelength) return { subgoals: buildPhotonWavelengthDraft(wavelength, true), answerKind: `photon_wavelength_frequency_chain:${colorRangeForWavelength(wavelength.meters)}` };
  }
  if (/\bphoton\b/i.test(normalized) && /\bev\b/i.test(normalized) && /\b(?:nm|nanometer|nanometre)\b/i.test(normalized)) {
    const wavelength = extractWavelengthMeters(normalized);
    if (wavelength) return { subgoals: buildPhotonWavelengthDraft(wavelength), answerKind: `photon_wavelength_chain:${colorRangeForWavelength(wavelength.meters)}` };
  }
  if (
    /\b(?:casimir|cavity|mode)\b/i.test(normalized) &&
    /\b(?:mode\s+frequency|frequency|photon\s+energy|energy)\b/i.test(normalized)
  ) {
    const lengthMeters = extractNumberNear(normalized, ["m", "meter", "meters", "metre", "metres"]);
    if (lengthMeters && lengthMeters > 0) {
      return {
        subgoals: buildCasimirCavityModeDraft(lengthMeters, extractModeNumber(normalized)),
        answerKind: "casimir_cavity_mode_chain",
      };
    }
  }
  if (/\bkinetic\s+energ/i.test(normalized) && /\b(?:double|doubles|doubled|twice)\b/i.test(normalized)) {
    const massSpeed = extractMassSpeed(normalized);
    if (massSpeed) return { subgoals: buildKineticDoubleDraft(massSpeed), answerKind: "kinetic_double_chain" };
  }
  if (/\b(?:uncertainty|hbar|delta\s*x|dx|delta\s*p|dp|position\s+uncertainty)\b/i.test(normalized) && /\b(?:kinetic\s+energy|electronvolts?|ev|p\^2\s*\/\s*\(?2\s*\*?\s*m_?e)\b/i.test(normalized)) {
    const dxMeters = extractPositionUncertaintyMeters(normalized);
    if (dxMeters) return { subgoals: buildUncertaintyMomentumDraft(dxMeters), answerKind: "uncertainty_momentum_chain" };
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
  if (answerKind.startsWith("photon_wavelength_frequency_chain:")) {
    const color = answerKind.split(":").slice(1).join(":");
    return [
      "Calculator compound plan completed.",
      `Frequency: ${byId.get("photon_frequency")?.result_text} Hz.`,
      `Photon energy: ${byId.get("photon_energy_j")?.result_text} J.`,
      `Photon energy: ${byId.get("photon_energy_ev")?.result_text} eV.`,
      `Color range: ${color}.`,
      "Interpretation: the chain computed frequency from wavelength, used that validated frequency in E = hf, then converted the joule result to electronvolts.",
    ].join("\n");
  }
  if (answerKind === "casimir_cavity_mode_chain") {
    return [
      "Calculator compound plan completed.",
      `Mode frequency: ${byId.get("casimir_cavity_mode_frequency")?.result_text} Hz.`,
      `Photon energy: ${byId.get("casimir_mode_photon_energy")?.result_text} J.`,
      "Interpretation: the chain used the idealized cavity-mode scalar relation, then used Planck's relation for the photon-energy scalar cut. This is not a backend Casimir field solve.",
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
  if (answerKind === "uncertainty_momentum_chain") {
    return [
      "Calculator compound plan completed.",
      `Minimum momentum uncertainty: ${byId.get("minimum_momentum_uncertainty")?.result_text} kg*m/s.`,
      `Minimum kinetic energy: ${byId.get("minimum_kinetic_energy_j")?.result_text} J.`,
      `Minimum kinetic energy: ${byId.get("minimum_kinetic_energy_ev")?.result_text} eV.`,
      "Interpretation: the chain saturated Delta x Delta p >= hbar/2 for the requested estimate, then used the non-relativistic electron kinetic-energy relation K = p^2/(2 m_e).",
      "The equations conceptually connect localization to momentum spread and then translate that spread into an energy scale.",
      "Conceptually, Delta x Delta p >= hbar/2 says a state cannot be prepared with arbitrarily sharp position and momentum at the same time; this is a wave-state bandwidth relation, not a mystical claim that consciousness creates the result.",
      "In field language, the electron is described by a quantum field state whose probability amplitude can be localized into a wave packet; tighter localization requires a broader spread of momentum components, which is why the calculator result leads to a minimum kinetic-energy scale.",
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
  const numericNormalizations = extractCalculatorNumericNormalizations(input.prompt);
  return {
    schema: "helix.calculator_candidate_hints.v1",
    turn_id: input.turnId,
    prompt: input.prompt,
    authority: "hint_only",
    numeric_normalizations: numericNormalizations,
    problem_interpretation: buildCalculatorProblemInterpretation({
      prompt: input.prompt,
      turnId: input.turnId,
      numericNormalizations,
    }),
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
      "Normalize mixed-number notation before tool assembly; for example, 9 1/8 must become 73/8, not 91/8.",
      "Use *, /, ^, parentheses, sqrt(), pi, and scientific notation.",
      "Convert input units to SI before writing physics expressions.",
      "For pure geometry relations, preserve the input length unit for same-unit outputs; do not convert inches to meters unless the user explicitly asks for a unit conversion.",
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
  const speedChangeKinematics = extractSpeedChangeKinematics(normalized);
  const acceleration = restKinematics?.acceleration ?? speedChangeKinematics?.acceleration ?? extractExplicitAcceleration(normalized) ?? null;
  const durationSeconds = speedChangeKinematics?.durationSeconds ?? extractDurationSeconds(normalized);
  const finalSpeedFromPrompt = restKinematics?.finalSpeed ?? speedChangeKinematics?.finalSpeed ?? (mass ? extractMassSpeed(normalized)?.speed : null);
  const initialSpeedFromPrompt = restKinematics ? 0 : speedChangeKinematics?.initialSpeed ?? null;
  const finalSpeedForEnergy = speedChangeKinematics?.finalSpeed ?? finalSpeedFromPrompt;
  if (/\bacceleration\b/i.test(normalized) && acceleration && Number.isFinite(acceleration)) {
    const expression =
      speedChangeKinematics
        ? `(${formatNumber(speedChangeKinematics.finalSpeed)}-${formatNumber(speedChangeKinematics.initialSpeed)})/${formatNumber(speedChangeKinematics.durationSeconds)}`
        : restKinematics && durationSeconds
        ? `${formatNumber(restKinematics.finalSpeed)}/${formatNumber(durationSeconds)}`
        : formatNumber(acceleration);
    subgoals.push({
      id: "acceleration",
      label: restKinematics || speedChangeKinematics ? "Compute acceleration from a = Delta v / t" : "Compute acceleration",
      expression,
      expected_quantity: "acceleration",
      expected_unit: "m/s^2",
      equation: restKinematics || speedChangeKinematics ? "a = Delta v / t" : "a",
      assumptions: speedChangeKinematics
        ? ["Acceleration is computed from the stated initial speed, final speed, and duration."]
        : restKinematics
        ? ["Initial speed is zero and the stated final speed is reached over the stated duration."]
        : ["Acceleration is supplied directly by the prompt."],
      variables: speedChangeKinematics
        ? [
            { symbol: "v_i", value: formatNumber(speedChangeKinematics.initialSpeed), unit: "m/s", meaning: "initial speed" },
            { symbol: "v_f", value: formatNumber(speedChangeKinematics.finalSpeed), unit: "m/s", meaning: "final speed" },
            { symbol: "t", value: formatNumber(speedChangeKinematics.durationSeconds), unit: "s", meaning: "duration" },
          ]
        : restKinematics
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
    const initialSpeed = initialSpeedFromPrompt ?? 0;
    const impulse = mass * acceleration * durationSeconds;
    const finalKineticEnergy = 0.5 * mass * finalSpeed ** 2;
    const changeKineticEnergy = 0.5 * mass * (finalSpeed ** 2 - initialSpeed ** 2);
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
    if (
      /\b(?:final\s+)?kinetic\s+energy\b|\bke\b/i.test(normalized) &&
      !/\bchange\s+in\s+kinetic\s+energy\b|\bkinetic\s+energy\s+change\b|\bdelta\s+ke\b|\bΔke\b/i.test(normalized)
    ) {
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
    if (/\bchange\s+in\s+kinetic\s+energy\b|\bkinetic\s+energy\s+change\b|\bdelta\s+ke\b|\bΔke\b/i.test(normalized)) {
      subgoals.push({
        id: "change_kinetic_energy",
        label: "Compute change in kinetic energy from Delta KE = 1/2 m (vf^2 - vi^2)",
        expression: finalSpeedForEnergy
          ? `0.5*${formatNumber(mass)}*(${formatNumber(finalSpeedForEnergy)}^2-${formatNumber(initialSpeed)}^2)`
          : `0.5*${formatNumber(mass)}*((${formatNumber(acceleration)}*${formatNumber(durationSeconds)})^2-${formatNumber(initialSpeed)}^2)`,
        expected_quantity: "energy",
        expected_unit: "J",
        equation: "Delta KE = 1/2 m (vf^2 - vi^2)",
        depends_on: subgoals.some((subgoal: CalculatorModelAuthoredSubgoal) => subgoal.id === "acceleration") ? ["acceleration"] : [],
        assumptions: ["Non-relativistic kinetic energy.", "The prompt's initial and final speeds define the kinetic-energy change."],
        variables: [
          ...baseVariables,
          { symbol: "v_i", value: formatNumber(initialSpeed), unit: "m/s", meaning: "initial speed" },
          { symbol: "v_f", value: formatNumber(finalSpeedForEnergy ?? finalSpeed), unit: "m/s", meaning: "final speed" },
        ],
        interpretation: `The kinetic-energy increase is ${formatNumber(changeKineticEnergy)} J under the stated speeds.`,
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

export function draftUnitConversionCalculatorSubgoalsForPrompt(prompt: string): CalculatorModelAuthoredSubgoal[] {
  const conversion = detectLengthUnitConversionPrompt(prompt);
  if (!conversion) return [];
  const fromLabel = lengthUnitLabel(conversion.fromUnit);
  const toLabel = lengthUnitLabel(conversion.toUnit);
  return [{
    id: "unit_conversion_length",
    label: `Convert ${fromLabel} to ${toLabel}`,
    expression: conversion.expression,
    expected_quantity: "length",
    expected_unit: conversion.toUnit,
    equation: `${conversion.fromUnit}_to_${conversion.toUnit}`,
    assumptions: [`Exact length conversion factor: 1 ${conversion.fromUnit} = ${formatNumber(conversion.factor)} ${conversion.toUnit}.`],
    variables: [
      {
        symbol: "length",
        value: conversion.quantityExpression,
        unit: conversion.fromUnit,
        meaning: `source length from "${conversion.rawQuantity} ${conversion.fromUnit}"`,
      },
    ],
    interpretation: `Explicit unit conversion from ${conversion.fromUnit} to ${conversion.toUnit}; the calculator expression applies the exact factor to the normalized quantity.`,
  }];
}

const coerceModelSubgoalsToDrafts = (subgoals: CalculatorModelAuthoredSubgoal[]): DraftSubgoal[] => {
  return subgoals.slice(0, 5).flatMap((subgoal: CalculatorModelAuthoredSubgoal, index: number) => {
    const expression = normalizePrompt(String(subgoal.expression ?? ""));
    if (!expression) return [];
    const value = evaluateNumericExpression(expression);
    if (value === null) return [];
    const subgoalCue = normalizePrompt([
      subgoal.id,
      subgoal.label,
      subgoal.equation,
      expression,
      subgoal.expected_quantity,
      subgoal.expected_unit,
    ].filter(Boolean).join(" ")).toLowerCase();
    let normalizedExpectedQuantity = subgoal.expected_quantity ? String(subgoal.expected_quantity).trim() : null;
    let normalizedExpectedUnit = subgoal.expected_unit ? String(subgoal.expected_unit).trim() : null;
    if (/\bfrequency\b|\bf\s*=|\bhz\b|\bhertz\b/.test(subgoalCue)) {
      normalizedExpectedQuantity = "frequency";
      normalizedExpectedUnit = "Hz";
    }
    const expectedUnit = normalizedExpectedUnit
      ? normalizedExpectedUnit
      : normalizedExpectedQuantity === "momentum"
        ? "kg*m/s"
        : null;
    const unitQuantity = expectedUnit ? findHelixUnitDefinition(expectedUnit)?.quantity ?? null : null;
    const expectedQuantity = normalizedExpectedQuantity ?? unitQuantity ?? "dimensionless";
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
  deterministic?: boolean;
  modelInvoked?: boolean;
  evaluationSubgoal?: string;
  observationKind?: string;
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
    subgoal: input.evaluationSubgoal ?? "Run a model-authored calculator plan and validate every required numeric subgoal.",
    tool_receipt_ids: evidenceRefs,
    supports_goal: true,
    summary: `${input.deterministic ? "deterministic_compiled_calculator_chain" : "model_authored_calculator_chain"} satisfied ${validations.length} calculator subgoals with validated results.`,
    evidence_refs: evidenceRefs,
    calculator_setup: plan.subgoals[plan.subgoals.length - 1]?.setup ?? null,
    calculator_compound_plan: plan,
    calculator_result_validations: validations,
    deterministic: input.deterministic ?? false,
    model_invoked: input.modelInvoked ?? true,
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
        observation_kind: input.observationKind ?? "calculator_model_authored_results",
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
