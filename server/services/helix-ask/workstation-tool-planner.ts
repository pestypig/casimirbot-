import {
  HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
  type HelixWorkstationToolPlan,
  type HelixWorkstationToolPlanIntent,
  type HelixWorkstationToolPlanStep,
} from "../../../shared/helix-workstation-tool-plan";
import type { HelixDerivedEquation } from "../../../shared/helix-derived-equation";
import {
  HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
  type HelixCalculatorSetupContext,
  type HelixCalculatorSetupVariable,
} from "../../../shared/helix-calculator-setup-context";
import {
  findHelixUnitDefinition,
  formatHelixDimensionSignature,
  helixUnitsForQuantity,
  inferHelixDimensionForUnit,
  inferHelixQuantityForUnit,
} from "../../../shared/helix-physical-units";

export type WorkstationToolIntent =
  | "calculator_verify"
  | "calculator_solve"
  | "calculator_live_source"
  | "notes_create"
  | "notes_append"
  | "notes_store_large_text"
  | "ideology_compare"
  | "dottie_observer"
  | "live_environment_create"
  | "direct_answer";

export type WorkstationToolPlannerAction = {
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
};

export type AffordanceScore = {
  affordance_id: string;
  panel_id: string;
  action_id: string;
  score: number;
  reason: string;
  required_args_missing: string[];
};

export type WorkstationToolPlannerResult = {
  intent: WorkstationToolIntent;
  action: WorkstationToolPlannerAction | null;
  tool_plan: HelixWorkstationToolPlan | null;
  scores: AffordanceScore[];
  should_use_tool: boolean;
  reason: string;
  missing_required_args: string[];
};

export type PlanWorkstationToolUseOptions = {
  threadId?: string | null;
  turnId?: string | null;
  now?: Date;
};

function makePlanId(intent: string): string {
  return `workstation-plan:${intent}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ");
}

function stripOuterPunctuation(value: string): string {
  return value
    .trim()
    .replace(/\s+(?:with\s+)?(?:steps?|show\s+work|trace)$/i, "")
    .replace(/^[:"'“”`{\[\(]+/g, "")
    .replace(/[.!?,"'“”`\]\)}]+$/g, "")
    .trim();
}

function stripExpressionPunctuation(value: string): string {
  return value
    .trim()
    .replace(/\s+(?:with\s+)?(?:steps?|show\s+work|trace)$/i, "")
    .replace(/^[:"'`{\[]+/g, "")
    .replace(/[.!?,"'`\]}]+$/g, "")
    .trim();
}

function parensBalanced(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function extractArithmeticCandidate(value: string): string | null {
  const matches = value.match(/[()+\-*/^\d.eE\s]+/g) ?? [];
  for (const match of matches) {
    const candidate = stripExpressionPunctuation(match).replace(/\s+/g, "");
    if (!candidate || !/\d/.test(candidate) || !/[+\-*/^]/.test(candidate)) continue;
    if (!parensBalanced(candidate)) continue;
    if (!/^[()+\-*/^\d.eE]+$/.test(candidate)) continue;
    return candidate;
  }
  return null;
}

function stripCalculatorInstructionTail(value: string): string {
  return value
    .replace(/\s+(?:and\s+)?(?:tell|show|give|report)\s+(?:me|us)?\s*(?:the\s+)?(?:result|answer|value|output)\b[\s\S]*$/i, "")
    .replace(/\s+(?:and\s+)?(?:return|provide)\s+(?:the\s+)?(?:result|answer|value|output)\b[\s\S]*$/i, "")
    .replace(/\s+(?:and\s+)?(?:explain|describe|summari[sz]e)\s+(?:the\s+)?(?:result|answer|value|output)\b[\s\S]*$/i, "")
    .replace(/\s+\band\s+(?:explain|describe|summari[sz]e)\b[\s\S]*$/i, "")
    .replace(/\s+(?:in|with|using)\s+(?:the\s+)?(?:scientific\s+)?calculator\b[\s\S]*$/i, "")
    .trim();
}

function stripCalculatorUnitTail(value: string): string {
  return value
    .replace(/\s+(?:joules?|j|hz|hertz|electronvolts?|ev|kg|m\/s|meters?|metres?|seconds?|sec|s|newtons?|n)\b[\s.,;:!?)]*$/i, "")
    .trim();
}

function normalizeCalculatorExpressionCandidate(value: string): string {
  return stripCalculatorUnitTail(stripCalculatorInstructionTail(stripOuterPunctuation(value)));
}

function numericArithmeticRhsFromAssignment(value: string): string | null {
  const match = value.match(/^\s*[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.+)$/);
  if (!match) return null;
  const rhs = stripCalculatorUnitTail(stripExpressionPunctuation(match[1])).replace(/\s+/g, "");
  if (!rhs || !/\d/.test(rhs) || !/[+\-*/^]/.test(rhs)) return null;
  if (!parensBalanced(rhs)) return null;
  return /^[()+\-*/^\d.eE]+$/.test(rhs) ? rhs : null;
}

function stripCalculatorInstructionHead(value: string): string {
  return value
    .replace(
      /^\s*(?:use\s+(?:the\s+)?(?:scientific\s+)?calculator\s+to|with\s+(?:the\s+)?(?:scientific\s+)?calculator\s*,?\s*)\s*/i,
      "",
    )
    .replace(/^\s*(?:please|can\s+you|could\s+you|would\s+you)\s+/i, "")
    .trim();
}

function isCalculatorLiveSourcePrompt(normalized: string): boolean {
  if (!isCalculatorPrompt(normalized)) return false;
  return /\b(?:live\s+source|stream|monitor|watch|tick|ticks|continuous|continuously|start\s+live|as\s+a\s+live\s+source)\b/i.test(
    normalized,
  );
}

function extractQuoted(prompt: string): string | null {
  const match = prompt.match(/["“](.+?)["”]/);
  return stripOuterPunctuation(match?.[1] ?? "") || null;
}

function extractInlineMathExpression(value: string): string | null {
  const coefficientEquation = value.match(/(?:[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*\*\s*)?[A-Za-z_][A-Za-z0-9_]*(?:\s*\^\s*[-+]?\d+(?:\.\d+)?)?(?:\s*[+\-*/]\s*[-+()A-Za-z0-9_.*\/^\\\s]+)+\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/i)?.[0];
  if (coefficientEquation) return normalizeCalculatorExpressionCandidate(coefficientEquation);
  const assignment = value.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/)?.[0];
  if (assignment) return numericArithmeticRhsFromAssignment(assignment) ?? normalizeCalculatorExpressionCandidate(assignment);
  const equation = value.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:\s*\^\s*[-+]?\d+(?:\.\d+)?)?(?:\s*[+\-*/]\s*[-+()A-Za-z0-9_.*\/^\\\s]+)+\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/)?.[0];
  if (equation) return normalizeCalculatorExpressionCandidate(equation);
  return extractArithmeticCandidate(value);
}

function extractPhotonEnergyExpression(value: string): string | null {
  if (!/\b(?:photon|e\s*=\s*h\s*f|e\s*=\s*h\n?f|planck|frequency)\b/i.test(value)) return null;
  const frequencyMatch =
    value.match(/\bf(?:requency)?\s*(?:=|is|of)?\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)(?:\s*(?:hz|hertz))?\b/i) ??
    value.match(/([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*(?:hz|hertz)\b/i);
  const rawFrequency = frequencyMatch?.[1];
  if (!rawFrequency) return null;
  const frequency = Number(rawFrequency);
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  return `6.62607015e-34*${rawFrequency}`;
}

function extractFrequencyValue(value: string): string | null {
  return (
    value.match(/\bf(?:requency)?\s*(?:=|is|of)?\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)(?:\s*(?:hz|hertz))?\b/i)?.[1] ??
    value.match(/([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*(?:hz|hertz)\b/i)?.[1] ??
    null
  );
}

function extractKineticEnergyExpression(value: string): string | null {
  if (!/\bkinetic\s+energy\b|\bke\b|\b1\/2\s*m\s*v/i.test(value)) return null;
  if (/\bchange\s+in\s+kinetic\s+energy\b|\bkinetic\s+energy\s+change\b|\bdelta\s+ke\b|\bΔke\b/i.test(value)) return null;
  const number = "[-+]?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?";
  const mass =
    value.match(new RegExp(`\\bm(?:ass)?\\s*(?:=|is|of)?\\s*(${number})\\s*(?:kg|kilograms?)\\b`, "i"))?.[1] ??
    value.match(new RegExp(`\\b(${number})\\s*(?:kg|kilograms?)\\b`, "i"))?.[1] ??
    null;
  const speed =
    value.match(new RegExp(`\\bv(?:elocity|speed)?\\s*(?:=|is|of)?\\s*(${number})\\s*(?:m\\s*/\\s*s|meters?\\s+per\\s+second|metres?\\s+per\\s+second)\\b`, "i"))?.[1] ??
    value.match(new RegExp(`\\b(?:moving|travell?ing|going)\\s+(?:at\\s+)?(${number})\\s*(?:m\\s*/\\s*s|meters?\\s+per\\s+second|metres?\\s+per\\s+second)\\b`, "i"))?.[1] ??
    value.match(new RegExp(`\\b(${number})\\s*(?:m\\s*/\\s*s|meters?\\s+per\\s+second|metres?\\s+per\\s+second)\\b`, "i"))?.[1] ??
    null;
  if (!mass || !speed) return null;
  return `0.5*${mass}*${speed}^2`;
}

function parseKineticEnergyVariables(expression: string): HelixCalculatorSetupVariable[] {
  const normalized = expression.replace(/\s+/g, "");
  const match = normalized.match(/^0\.5\*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\^2$/i);
  if (!match) return [];
  return [
    { symbol: "m", value: match[1], unit: "kg", meaning: "mass" },
    { symbol: "v", value: match[2], unit: "m/s", meaning: "speed" },
  ];
}

function defaultAssumptionsForCalculatorSetup(setup: HelixCalculatorSetupContext): string[] {
  if (setup.assumptions?.length) return setup.assumptions;
  if (setup.domain === "photon_energy") {
    return ["SI quantity calculus; constants and wavelength/frequency values are interpreted in SI-compatible units."];
  }
  if (setup.domain === "wavelength") {
    return ["Vacuum light-speed approximation is used when c appears as 3e8 m/s."];
  }
  if (setup.domain === "kinetic_energy") {
    return ["Non-relativistic kinetic energy model KE = 1/2 m v^2."];
  }
  return [];
}

function enrichCalculatorSetupUnits(setup: HelixCalculatorSetupContext): HelixCalculatorSetupContext {
  const variables = (setup.variables ?? []).map((variable) => {
    const unitDefinition = findHelixUnitDefinition(variable.unit);
    const dimension = variable.dimension ?? unitDefinition?.dimension ?? null;
    return {
      ...variable,
      quantity: variable.quantity ?? unitDefinition?.quantity ?? null,
      dimension,
      dimension_signature: variable.dimension_signature ?? formatHelixDimensionSignature(dimension),
    };
  });
  const inputUnits = Object.fromEntries(
    variables
      .filter((variable) => variable.unit)
      .map((variable) => [variable.symbol, variable.unit as string]),
  );
  const resultQuantity =
    setup.result_quantity ??
    inferHelixQuantityForUnit(setup.result_unit) ??
    (setup.domain === "photon_energy" || setup.domain === "kinetic_energy"
      ? "energy"
      : setup.domain === "wavelength"
        ? "length"
        : null);
  const resultDimension = setup.result_dimension ?? inferHelixDimensionForUnit(setup.result_unit);
  return {
    ...setup,
    variables,
    quantity: setup.quantity ?? resultQuantity,
    unit_system: setup.unit_system ?? (setup.result_unit || variables.some((variable) => variable.unit) ? "SI" : null),
    input_units: setup.input_units ?? (Object.keys(inputUnits).length ? inputUnits : undefined),
    result_quantity: resultQuantity,
    result_dimension: resultDimension,
    result_dimension_signature: setup.result_dimension_signature ?? formatHelixDimensionSignature(resultDimension),
    assumptions: defaultAssumptionsForCalculatorSetup(setup),
    unit_options: setup.unit_options ?? helixUnitsForQuantity(resultQuantity),
  };
}

function buildCalculatorSetupContext(prompt: string, expression: string | null): HelixCalculatorSetupContext | null {
  if (!expression) return null;
  const normalized = normalizePrompt(prompt);
  const frequency = extractFrequencyValue(normalized);
  if (/\bphoton\b|\be\s*=\s*h\s*f\b|planck/i.test(normalized) && frequency) {
    return enrichCalculatorSetupUnits({
      schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
      expression,
      display_latex: expression,
      domain: "photon_energy",
      subgoal: "Compute photon energy from E = hf.",
      equation: "E = h f",
      variables: [
        { symbol: "h", value: "6.62607015e-34", unit: "J*s", meaning: "Planck constant" },
        { symbol: "f", value: frequency, unit: "Hz", meaning: "frequency" },
      ],
      result_unit: "J",
      interpretation_prompt: "Use the calculator result as the energy of one photon at the supplied frequency.",
    });
  }
  if (/\bphoton\b[\s\S]{0,80}\benergy\b|\benergy\b[\s\S]{0,80}\bphoton\b|planck/i.test(normalized)) {
    return enrichCalculatorSetupUnits({
      schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
      expression,
      display_latex: expression,
      domain: "photon_energy",
      subgoal: "Compute photon energy from the supplied expression.",
      equation: "E = h c / lambda",
      variables: [
        ...(expression.includes("6.626") ? [{ symbol: "h", value: "6.626e-34", unit: "J*s", meaning: "Planck constant" }] : []),
        ...(expression.includes("3.0e8") || expression.includes("3e8") ? [{ symbol: "c", value: "3.0e8", unit: "m/s", meaning: "speed of light" }] : []),
      ],
      result_unit: "J",
      interpretation_prompt: "Use the calculator result as the energy of one photon for the supplied expression.",
    });
  }
  if (/\bwavelength\b|\blambda\b|\\lambda|c\s*\/\s*f/i.test(normalized)) {
    const divisor = expression.replace(/\s+/g, "").match(/^\(?3e8\)?\/\(?([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\)?$/i)?.[1];
    return enrichCalculatorSetupUnits({
      schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
      expression,
      display_latex: expression,
      domain: "wavelength",
      subgoal: "Compute wavelength from lambda = c/f.",
      equation: "lambda = c / f",
      variables: [
        { symbol: "c", value: "3e8", unit: "m/s", meaning: "speed of light" },
        ...(frequency || divisor ? [{ symbol: "f", value: frequency ?? divisor ?? "", unit: "Hz", meaning: "frequency" }] : []),
      ],
      result_unit: "m",
      interpretation_prompt: "Use the calculator result as the wavelength for the supplied light frequency.",
    });
  }
  if (/\bkinetic\s+energy\b|\bke\s*=|\b1\/2\s*m\s*v/i.test(normalized)) {
    return enrichCalculatorSetupUnits({
      schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
      expression,
      display_latex: expression,
      domain: "kinetic_energy",
      subgoal: "Compute kinetic energy from KE = 1/2 m v^2.",
      equation: "KE = 1/2 m v^2",
      variables: parseKineticEnergyVariables(expression),
      result_unit: "J",
      interpretation_prompt: "Use the calculator result as the non-relativistic kinetic energy for the supplied values.",
    });
  }
  return enrichCalculatorSetupUnits({
    schema: HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA,
    expression,
    display_latex: expression,
    domain: "generic",
    subgoal: "Evaluate the supplied calculator expression.",
    equation: null,
    variables: [],
    result_unit: null,
    interpretation_prompt: null,
  });
}

function calculatorArgs(latex: string | null, setup: HelixCalculatorSetupContext | null): Record<string, unknown> {
  return latex
    ? {
        latex,
        ...(setup ? { calculator_setup: setup } : {}),
      }
    : {};
}

export function extractCalculatorExpression(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  if (isWorkstationToolDiagnosticPrompt(normalized)) return null;
  const photonEnergyExpression = extractPhotonEnergyExpression(normalized);
  if (photonEnergyExpression) return photonEnergyExpression;
  const kineticEnergyExpression = extractKineticEnergyExpression(normalized);
  if (kineticEnergyExpression) return kineticEnergyExpression;

  const colonTail = normalized.match(/(?:equation|expression|claim|calculator|solve|evaluate|compute|check|verify)[^:]{0,120}:\s*(.+)$/i)?.[1];
  if (colonTail) {
    const cleaned = stripCalculatorInstructionTail(stripCalculatorInstructionHead(colonTail));
    const nestedSolveTail = cleaned.match(/\b(?:solve|evaluate|compute|calculate|check|verify)\s+(.+)$/i)?.[1];
    const candidate = nestedSolveTail
      ? stripCalculatorInstructionTail(stripCalculatorInstructionHead(nestedSolveTail))
      : cleaned;
    const inlineMath = extractInlineMathExpression(candidate);
    if (inlineMath) return stripCalculatorInstructionTail(inlineMath);
    const arithmetic = extractArithmeticCandidate(candidate);
    if (arithmetic) return arithmetic;
    if (/[=+\-*/^]|\\frac|\\sqrt/.test(candidate)) return stripOuterPunctuation(candidate);
  }

  const quoted = extractQuoted(normalized);
  if (quoted && /[=+\-*/^]|\\frac|\\sqrt|\d/.test(quoted)) return quoted;

  const solveTail = normalized.match(/\b(?:solve|evaluate|compute|calculate|check|verify)\s+(.+)$/i)?.[1];
  if (solveTail) {
    const cleaned = stripCalculatorInstructionTail(stripCalculatorInstructionHead(solveTail));
    const inlineMath = extractInlineMathExpression(cleaned);
    if (inlineMath) return stripCalculatorInstructionTail(inlineMath);
    const arithmetic = extractArithmeticCandidate(cleaned);
    if (arithmetic) return arithmetic;
    if (/[=+\-*/^]|\\frac|\\sqrt/.test(cleaned)) {
      return stripOuterPunctuation(cleaned);
    }
  }

  const inlineMath = extractInlineMathExpression(normalized);
  if (inlineMath) return stripCalculatorInstructionTail(inlineMath);

  const calculatorTail = normalized.match(/\b(?:calculator|calc)\b\s*(.+)$/i)?.[1];
  if (calculatorTail && /[=+\-*/^]|\\frac|\\sqrt/.test(calculatorTail)) {
    const cleaned = stripCalculatorInstructionTail(calculatorTail);
    return extractInlineMathExpression(cleaned) ?? extractArithmeticCandidate(cleaned) ?? stripOuterPunctuation(cleaned);
  }

  return null;
}

function extractNoteTitle(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const quotedAfterTitle = normalized.match(/\b(?:titled|called|named)\s+["“](.+?)["”]/i)?.[1];
  if (quotedAfterTitle) return stripOuterPunctuation(quotedAfterTitle);
  const afterTitle = normalized.match(/\b(?:titled|called|named)\s+(.+?)(?:\s+(?:with|containing|that says|saying|body|text)\b|$)/i)?.[1];
  const explicit = stripOuterPunctuation(afterTitle ?? "");
  if (explicit) return explicit;
  if (/\b(?:open|current|active)\s+doc(?:ument)?\b/i.test(normalized)) return "Open document summary";
  if (/\bdoc(?:ument)?\b/i.test(normalized)) return "Document summary";
  return null;
}

function extractNoteBody(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const body = normalized.match(/\b(?:with\s+body|body|containing|that\s+says|saying|with\s+text|text)\s*[:\-]?\s*(.+)$/i)?.[1];
  if (body) return stripOuterPunctuation(body);
  const afterColon = normalized.match(/:\s*(.+)$/)?.[1];
  if (afterColon && /\b(?:note|notes|notepad|store|save)\b/i.test(normalized)) return stripOuterPunctuation(afterColon);
  return null;
}

function hasConcreteCalculatorExpression(prompt: string): boolean {
  const expression = extractCalculatorExpression(prompt);
  if (!expression) return false;
  return /\d/.test(expression) || /[+\-*/^=]/.test(expression);
}

function isConceptualNoCalculatorPrompt(prompt: string): boolean {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return false;
  const negatesCalculation =
    /\b(?:do\s+not|don't|without|no\s+need\s+to)\s+(?:calculate|compute|solve|evaluate)\b/i.test(normalized) ||
    /\b(?:do\s+not|don't)\s+calculate\s+(?:a\s+)?(?:specific\s+)?numeric\s+case\b/i.test(normalized);
  const conceptual =
    /\b(?:explain|why|conceptual|intuition|relationship|depends?\s+on|connected\s+to|what\s+changes)\b/i.test(normalized);
  if (negatesCalculation && conceptual) return true;
  if (negatesCalculation && !hasConcreteCalculatorExpression(normalized)) return true;
  if (
    /\b(?:did\s+not|didn't|do\s+not|don't)\s+(?:give|provide|invent)\b[\s\S]{0,80}\b(?:exact|specific|numeric|speed|value|number)\b/i.test(normalized) &&
    /\b(?:underspecified|need|needs|required|before\s+producing\s+a\s+numeric\s+result|do\s+not\s+invent)\b/i.test(normalized)
  ) {
    return true;
  }
  return false;
}

export function isWorkstationToolDiagnosticPrompt(prompt: string): boolean {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return false;
  const mentionsWorkstationTool =
    /\b(?:calculator|scientific\s+calculator|docs?\s+(?:panel|viewer)|workstation\s+notes?|visual\s+capture|live\s+source|tool\s+call|capabilit(?:y|ies)|panel|receipt|artifact)\b/i.test(
      normalized,
    );
  const diagnosticCue =
    /\b(?:backend|debug|trace|terminal_error_code|goal_satisfaction|satisfaction|runtime|agent\s+loop|route|router|classifier|deterministic|stale|failed|failure|took\s+over|over[-\s]?eager|poison(?:ing)?|parity|codex|why\s+did|what\s+went\s+wrong|error|bug|patch|code)\b/i.test(
      normalized,
    );
  return mentionsWorkstationTool && diagnosticCue;
}

function isCalculatorPrompt(prompt: string): boolean {
  if (isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (isConceptualNoCalculatorPrompt(prompt)) return false;
  const hasConcreteExpression = hasConcreteCalculatorExpression(prompt);
  return /\b(?:calculator|solve|evaluate|compute|calculate|verify|check)\b/i.test(prompt) &&
    (/\b(?:equation|expression|math|numeric|calculation|with\s+steps|show\s+work)\b/i.test(prompt) || hasConcreteExpression);
}

function isNoteCreatePrompt(prompt: string): boolean {
  return /\b(?:create|make|new|start)\b[\s\S]{0,80}\b(?:workstation\s+)?note\b/i.test(prompt);
}

function isNoteAppendPrompt(prompt: string): boolean {
  return /\b(?:append|add|save|store|preserve)\b[\s\S]{0,120}\b(?:to|into|in)\s+(?:the\s+)?(?:workstation\s+)?notes?\b/i.test(prompt) ||
    /\b(?:save|store|preserve)\b[\s\S]{0,80}\b(?:transcript|text|chunk|large\s+context)\b/i.test(prompt);
}

function isIdeologyComparePrompt(prompt: string): boolean {
  return (
    /\b(?:compare|check|evaluate|review|analy[sz]e)\b[\s\S]{0,100}\b(?:motive|intent|intention|goal|behavior|decision|action)\b[\s\S]{0,140}\b(?:zen|ethos|ideology|mission\s+ethos)\b/i.test(prompt) ||
    /\b(?:zen|ethos|ideology|mission\s+ethos)\b[\s\S]{0,100}\b(?:compare|check|evaluate|review|analy[sz]e)\b/i.test(prompt)
  );
}

function extractIdeologyMotive(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const quoted = extractQuoted(normalized);
  if (quoted) return quoted;
  const afterColon = normalized.match(/:\s*(.+)$/)?.[1];
  if (afterColon) return stripOuterPunctuation(afterColon);
  const afterToZen = normalized.match(/\b(?:to|against|with|through|using)\s+(?:the\s+)?(?:zen|ethos|ideology|mission\s+ethos)(?:\s+framework)?\s*(.+)$/i)?.[1];
  if (afterToZen) return stripOuterPunctuation(afterToZen);
  return normalized
    .replace(/\b(?:compare|check|evaluate|review|analy[sz]e)\b/gi, " ")
    .replace(/\b(?:this|that|motive|intent|intention|goal|behavior|decision|action|to|against|with|through|using|the|a|an|zen|ethos|ideology|mission)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800) || null;
}

function extractNamedArg(prompt: string, names: string[]): string | null {
  for (const name of names) {
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b\\s*(?::|=)?\\s*([A-Za-z0-9:._-]+)`, "i");
    const match = prompt.match(pattern);
    if (match?.[1]) return stripOuterPunctuation(match[1]);
  }
  return null;
}

function extractDottieTargetRunId(prompt: string): string | null {
  return (
    extractNamedArg(prompt, ["target_run_id", "target run id", "run_id", "run id"]) ??
    prompt.match(/\brun:[A-Za-z0-9:._-]+\b/i)?.[0] ??
    null
  );
}

function extractDottieTargetTurnId(prompt: string): string | null {
  return extractNamedArg(prompt, ["target_turn_id", "target turn id", "turn_id", "turn id"]);
}

function extractDottieSourceEventId(prompt: string): string | null {
  return (
    extractNamedArg(prompt, ["source_event_id", "source event id", "event_id", "event id"]) ??
    prompt.match(/\bagent_commentary:[A-Za-z0-9:._-]+\b/i)?.[0] ??
    null
  );
}

function extractDottieObserverProfile(prompt: string): string {
  const explicit = extractNamedArg(prompt, ["observer_profile", "observer profile", "profile"]);
  if (explicit) return explicit;
  return /\bauntie\s+dottie\b/i.test(prompt) ? "auntie_dottie" : "dottie";
}

function extractDottieVoiceMode(prompt: string): string {
  const explicit = extractNamedArg(prompt, ["voice_mode", "voice mode"]);
  if (explicit) return explicit;
  if (/\b(?:prompt[-\s]?only|text[-\s]?only|do\s+not\s+speak|don't\s+speak|no\s+audio)\b/i.test(prompt)) return "text_only";
  return "voice_on_confirm";
}

function extractDottieMaxChars(prompt: string): number | null {
  const raw = extractNamedArg(prompt, ["max_chars", "max chars", "max_characters", "max characters"]);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(500, Math.max(40, Math.round(parsed))) : null;
}

function extractDottieSourceText(prompt: string): string | null {
  const match =
    prompt.match(/\b(?:public\s+)?source\s+text\s*(?::|-)\s*([\s\S]+)$/i) ??
    prompt.match(/\busing\s+this\s+(?:public\s+)?(?:source|commentary)\s+text\s*(?::|-)?\s*([\s\S]+)$/i);
  const value = stripOuterPunctuation(match?.[1] ?? "");
  if (!value) return null;
  const clipped = value
    .replace(/\s+(?:and\s+)?(?:then\s+)?(?:run\s+panel\s+action\s+)?(?:situation-room-pipelines\.)?observer\.query[\s\S]*$/i, "")
    .replace(/\s+(?:and\s+)?(?:then\s+)?(?:query|show|list)\s+(?:the\s+)?observer[\s\S]*$/i, "")
    .trim();
  return stripOuterPunctuation(clipped);
}

function isDottieObserverToolPrompt(prompt: string): boolean {
  const mentionsDottie =
    /\b(?:auntie\s+dottie|dottie)\b/i.test(prompt) ||
    /\bsituation-room-pipelines\.(?:observer|voice_delivery)\./i.test(prompt) ||
    /\b(?:observer\.attach|observer\.detach|observer\.query|voice_delivery\.propose_from_trace)\b/i.test(prompt);
  if (!mentionsDottie) return false;
  const affirmativeCommand =
    /\boperator\s+command\b/i.test(prompt) ||
    /\brun\s+panel\s+action\b/i.test(prompt) ||
    /\b(?:attach|detach|query|show|list|propose|prepare|create|add|set\s+up|start)\b[\s\S]{0,120}\b(?:auntie\s+dottie|dottie|observer|voice\s+delivery|voice_delivery)\b/i.test(prompt) ||
    /\b(?:auntie\s+dottie|dottie|observer|voice\s+delivery|voice_delivery)\b[\s\S]{0,120}\b(?:attach|detach|query|show|list|propose|prepare|create|add|watch|witness)\b/i.test(prompt);
  if (!affirmativeCommand) return false;
  const negatedCommand =
    /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to)\s+(?:attach|detach|query|show|list|propose|prepare|create|add|run)\b/i.test(prompt) ||
    /\b(?:should|could|would)\s+(?:we|you)\b[\s\S]{0,80}\b(?:attach|propose|run)\b/i.test(prompt);
  return !negatedCommand;
}

function buildToolPlan(args: {
  prompt: string;
  intent: Exclude<HelixWorkstationToolPlanIntent, "direct_answer">;
  missing: string[];
  steps: HelixWorkstationToolPlanStep[];
  options?: PlanWorkstationToolUseOptions;
}): HelixWorkstationToolPlan {
  return {
    schema: HELIX_WORKSTATION_TOOL_PLAN_SCHEMA,
    plan_id: makePlanId(args.intent),
    thread_id: args.options?.threadId?.trim() || "helix-ask:desktop",
    turn_id: args.options?.turnId?.trim() || "turn:pending",
    goal: args.prompt,
    intent: args.intent,
    steps: args.steps,
    missing_requirements: args.missing,
    created_at: (args.options?.now ?? new Date()).toISOString(),
  };
}

function makeOpenStep(panelId: string, depends_on: string[] = []): HelixWorkstationToolPlanStep {
  return {
    step_id: `open_${panelId.replace(/[^a-z0-9]+/gi, "_")}`,
    kind: "open_panel",
    panel_id: panelId,
    action_id: "open",
    args: {},
    depends_on,
    expected_receipt_kind: "workspace_action_receipt",
    expected_state_change: { panel_id: panelId, open: true },
    required: true,
  };
}

function isCompoundCalculatorPlanningPrompt(prompt: string): boolean {
  if (!/\b(?:calculator|calculate|compute|solve|evaluate|estimate)\b/i.test(prompt)) return false;
  const requestedQuantities = [
    /\bacceleration\b/i,
    /\b(?:net\s+)?force\b/i,
    /\bchange\s+in\s+kinetic\s+energy\b|\bkinetic\s+energy\s+change\b|\bdelta\s+ke\b|\bΔke\b/i,
    /\b(?:final\s+)?kinetic\s+energy\b/i,
    /\bpotential\s+energy\b/i,
    /\bmomentum\b/i,
    /\baverage\s+power\b|\bpower\b/i,
    /\bmaximum\s+height\b|\bmax\s+height\b/i,
  ].filter((pattern) => pattern.test(prompt)).length;
  return requestedQuantities >= 2;
}

export function planWorkstationToolUse(
  prompt: string,
  options: PlanWorkstationToolUseOptions = {},
): WorkstationToolPlannerResult {
  const normalized = normalizePrompt(prompt);
  const scores: AffordanceScore[] = [];
  const pushScore = (score: AffordanceScore) => scores.push(score);

  if (isDottieObserverToolPrompt(normalized)) {
    const targetRunId = extractDottieTargetRunId(normalized);
    const targetTurnId = extractDottieTargetTurnId(normalized);
    const sourceEventId = extractDottieSourceEventId(normalized);
    const sourceText = extractDottieSourceText(normalized);
    const observerProfile = extractDottieObserverProfile(normalized);
    const voiceMode = extractDottieVoiceMode(normalized);
    const maxChars = extractDottieMaxChars(normalized);
    const wantsAttach = /\b(?:observer\.attach|attach|watch|witness|set\s+up|start|add)\b/i.test(normalized);
    const wantsVoiceProposal = /\b(?:voice_delivery\.propose_from_trace|voice\s+delivery|propose|prepare|callout|speak)\b/i.test(normalized);
    const wantsQuery =
      /\b(?:observer\.query|query|show|list)\b/i.test(normalized) ||
      /\bthen\s+(?:query|show|list)\b/i.test(normalized);
    const missing = Array.from(new Set([
      ...(wantsAttach && !targetRunId ? ["target_run_id"] : []),
      ...(wantsVoiceProposal && !sourceEventId ? ["source_event_id"] : []),
    ]));
    const observerArgs = {
      ...(targetRunId ? { target_run_id: targetRunId } : {}),
      ...(targetTurnId ? { target_turn_id: targetTurnId } : {}),
      observer_profile: observerProfile,
      voice_mode: voiceMode,
      ...(maxChars ? { max_chars: maxChars } : {}),
      thread_id: options.threadId ?? "helix-ask:desktop",
    };
    const voiceArgs = {
      ...(sourceEventId ? { source_event_id: sourceEventId } : {}),
      ...(sourceText ? { source_text: sourceText } : {}),
      source_event_schema: "helix.agent_commentary.v1",
      observer_id: targetRunId ? `observer:dottie:${targetRunId.replace(/[^a-z0-9_-]+/gi, "_")}` : "observer:dottie:unassigned",
      target_agent_id: "agent:helix_ask",
      ...(targetTurnId ? { target_turn_id: targetTurnId } : {}),
      voice_mode: voiceMode,
      ...(maxChars ? { max_chars: maxChars } : {}),
    };
    const steps: HelixWorkstationToolPlanStep[] = [makeOpenStep("situation-room-pipelines")];
    let primaryAction: WorkstationToolPlannerAction | null = null;
    if (wantsAttach || !wantsVoiceProposal) {
      const attachStep: HelixWorkstationToolPlanStep = {
        step_id: "attach_dottie_observer",
        kind: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "observer.attach",
        args: observerArgs,
        depends_on: ["open_situation_room_pipelines"],
        expected_receipt_kind: "dottie_observer_subscription_receipt",
        expected_state_change: { store: "situation-room-runtime", proof_key: "observer_id" },
        required: true,
      };
      steps.push(attachStep);
      primaryAction = { panel_id: attachStep.panel_id ?? "", action_id: attachStep.action_id ?? "", args: observerArgs };
    }
    if (wantsVoiceProposal) {
      const voiceStep: HelixWorkstationToolPlanStep = {
        step_id: "propose_dottie_voice_from_trace",
        kind: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "voice_delivery.propose_from_trace",
        args: voiceArgs,
        depends_on: steps.some((step) => step.step_id === "attach_dottie_observer")
          ? ["attach_dottie_observer"]
          : ["open_situation_room_pipelines"],
        expected_receipt_kind: "dottie_voice_receipt",
        expected_state_change: { store: "situation-room-runtime", proof_key: "source_event_id" },
        required: true,
      };
      steps.push(voiceStep);
      primaryAction ??= { panel_id: voiceStep.panel_id ?? "", action_id: voiceStep.action_id ?? "", args: voiceArgs };
    }
    if (wantsQuery) {
      const queryArgs = {
        ...(targetRunId ? { target_run_id: targetRunId } : {}),
        observer_profile: observerProfile,
        thread_id: options.threadId ?? "helix-ask:desktop",
      };
      steps.push({
        step_id: "query_dottie_observer",
        kind: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "observer.query",
        args: queryArgs,
        depends_on: steps.some((step) => step.step_id === "propose_dottie_voice_from_trace")
          ? ["propose_dottie_voice_from_trace"]
          : steps.some((step) => step.step_id === "attach_dottie_observer")
            ? ["attach_dottie_observer"]
            : ["open_situation_room_pipelines"],
        expected_receipt_kind: "dottie_observer_query_receipt",
        expected_state_change: { store: "situation-room-runtime", proof_key: "count" },
        required: true,
      });
    }
    steps.push({
      step_id: "evaluate_dottie_observer_receipts",
      kind: "evaluate_result",
      depends_on: steps.filter((step) => step.kind === "run_panel_action").map((step) => step.step_id),
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    });
    pushScore({
      affordance_id: "situation-room-pipelines.observer.attach",
      panel_id: "situation-room-pipelines",
      action_id: "observer.attach",
      score: missing.length === 0 ? 0.94 : 0.64,
      reason: missing.length === 0
        ? "explicit Dottie observer command includes required public trace targets"
        : "explicit Dottie observer command is missing required target/source arguments",
      required_args_missing: missing,
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "dottie_observer",
      missing,
      options,
      steps,
    });
    return {
      intent: "dottie_observer",
      action: missing.length === 0 ? primaryAction : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt explicitly asks Situation Room to attach or inspect Dottie as a witness-only observer.",
      missing_required_args: missing,
    };
  }

  if (isNoteCreatePrompt(normalized)) {
    const title = extractNoteTitle(normalized);
    const body = extractNoteBody(normalized);
    pushScore({
      affordance_id: "workstation-notes.create_note",
      panel_id: "workstation-notes",
      action_id: "create_note",
      score: title ? 0.92 : 0.72,
      reason: title ? "note creation prompt includes a title" : "note creation prompt can create an untitled note",
      required_args_missing: [],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "notes_create",
      missing: [],
      options,
      steps: [
        makeOpenStep("workstation-notes"),
        {
          step_id: "create_note",
          kind: "run_panel_action",
          panel_id: "workstation-notes",
          action_id: "create_note",
          args: {
            ...(title ? { title } : {}),
            ...(body ? { body } : {}),
          },
          depends_on: ["open_workstation_notes"],
          expected_receipt_kind: "note_action_receipt",
          expected_state_change: { store: "workstation-notes", proof_key: "note_id" },
          required: true,
        },
        {
          step_id: "evaluate_note_receipt",
          kind: "evaluate_result",
          depends_on: ["create_note"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "notes_create",
      action: {
        panel_id: "workstation-notes",
        action_id: "create_note",
        args: {
          ...(title ? { title } : {}),
          ...(body ? { body } : {}),
        },
      },
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks to create a workstation note; notes affordance should run.",
      missing_required_args: [],
    };
  }

  if (isNoteAppendPrompt(normalized)) {
    const body = extractNoteBody(normalized) ?? extractQuoted(normalized);
    pushScore({
      affordance_id: "workstation-notes.append_to_note",
      panel_id: "workstation-notes",
      action_id: "append_to_note",
      score: body ? 0.88 : 0.58,
      reason: body ? "note storage prompt includes text" : "note storage prompt needs text or an existing artifact",
      required_args_missing: body ? [] : ["text"],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: body ? "notes_append" : "notes_store_large_text",
      missing: body ? [] : ["text"],
      options,
      steps: [
        makeOpenStep("workstation-notes"),
        {
          step_id: "append_to_note",
          kind: "run_panel_action",
          panel_id: "workstation-notes",
          action_id: "append_to_note",
          args: body ? { text: body } : {},
          depends_on: ["open_workstation_notes"],
          expected_receipt_kind: "note_action_receipt",
          expected_state_change: { store: "workstation-notes", proof_key: "section_id" },
          required: true,
        },
        {
          step_id: "evaluate_note_receipt",
          kind: "evaluate_result",
          depends_on: ["append_to_note"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: body ? "notes_append" : "notes_store_large_text",
      action: body ? { panel_id: "workstation-notes", action_id: "append_to_note", args: { text: body } } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks to store text in notes; note output should be a receipt-backed action.",
      missing_required_args: body ? [] : ["text"],
    };
  }

  if (isCalculatorLiveSourcePrompt(normalized)) {
    const latex = extractCalculatorExpression(normalized);
    const calculatorSetup = buildCalculatorSetupContext(normalized, latex);
    const actionId = "start_equation_live_source";
    pushScore({
      affordance_id: `scientific-calculator.${actionId}`,
      panel_id: "scientific-calculator",
      action_id: actionId,
      score: latex ? 0.96 : 0.66,
      reason: latex
        ? "calculator prompt asks for a live/streamed equation source with a candidate expression"
        : "calculator live-source prompt lacks a concrete expression",
      required_args_missing: latex ? [] : ["equation"],
    });
    const liveSourceArgs = {
      ...calculatorArgs(latex, calculatorSetup),
      equation: latex,
      equation_context: calculatorSetup?.subgoal ?? normalized,
      max_ticks: 1,
    };
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "calculator_live_source",
      missing: latex ? [] : ["equation"],
      options,
      steps: [
        makeOpenStep("scientific-calculator"),
        {
          step_id: "ingest_expression",
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "ingest_latex",
          args: calculatorArgs(latex, calculatorSetup),
          depends_on: ["open_scientific_calculator"],
          expected_receipt_kind: "workspace_action_receipt",
          expected_state_change: { store: "scientific-calculator", proof_key: "input_latex" },
          required: true,
        },
        {
          step_id: actionId,
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: actionId,
          args: liveSourceArgs,
          depends_on: ["ingest_expression"],
          expected_receipt_kind: "workstation_live_source_receipt",
          expected_state_change: { store: "useScientificCalculatorLiveSourceStore", proof_key: "latestTick/status" },
          required: true,
        },
        {
          step_id: "evaluate_calculator_live_source",
          kind: "evaluate_result",
          depends_on: [actionId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "calculator_live_source",
      action: latex ? { panel_id: "scientific-calculator", action_id: actionId, args: liveSourceArgs } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks to use the calculator as a live source; start the equation stream and observe it before answering.",
      missing_required_args: latex ? [] : ["equation"],
    };
  }

  if (isCalculatorPrompt(normalized)) {
    const latex = extractCalculatorExpression(normalized);
    if (!latex && isCompoundCalculatorPlanningPrompt(normalized)) {
      return {
        intent: "direct_answer",
        action: null,
        tool_plan: null,
        scores,
        should_use_tool: false,
        reason: "Narrative multi-result calculator prompt should be handled by the compound calculator runtime planner.",
        missing_required_args: [],
      };
    }
    const calculatorSetup = buildCalculatorSetupContext(normalized, latex);
    const wantsSteps = /\b(?:steps?|show\s+work|trace|verify|check)\b/i.test(normalized);
    const actionId = wantsSteps ? "solve_with_steps" : "solve_expression";
    pushScore({
      affordance_id: `scientific-calculator.${actionId}`,
      panel_id: "scientific-calculator",
      action_id: actionId,
      score: latex ? 0.94 : 0.64,
      reason: latex ? "math prompt includes a candidate expression" : "math prompt lacks a concrete expression",
      required_args_missing: latex ? [] : ["latex"],
    });
    const solveStepId = actionId;
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: wantsSteps ? "calculator_verify" : "calculator_solve",
      missing: latex ? [] : ["latex"],
      options,
      steps: [
        makeOpenStep("scientific-calculator"),
        {
          step_id: "ingest_expression",
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "ingest_latex",
          args: calculatorArgs(latex, calculatorSetup),
          depends_on: ["open_scientific_calculator"],
          expected_receipt_kind: "workspace_action_receipt",
          expected_state_change: { store: "scientific-calculator", proof_key: "input_latex" },
          required: true,
        },
        {
          step_id: solveStepId,
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: actionId,
          args: calculatorArgs(latex, calculatorSetup),
          depends_on: ["ingest_expression"],
          expected_receipt_kind: "calculator_receipt",
          expected_state_change: { store: "scientific-calculator", proof_key: "result_text" },
          required: true,
        },
        {
          step_id: "evaluate_calculator_result",
          kind: "evaluate_result",
          depends_on: [solveStepId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: wantsSteps ? "calculator_verify" : "calculator_solve",
      action: latex ? { panel_id: "scientific-calculator", action_id: actionId, args: calculatorArgs(latex, calculatorSetup) } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for math verification/evaluation; calculator affordance should run before direct answer.",
      missing_required_args: latex ? [] : ["latex"],
    };
  }

  if (isIdeologyComparePrompt(normalized)) {
    const motive = extractIdeologyMotive(normalized);
    const framework = /\b(?:mission\s+ethos|ethos|ideology)\b/i.test(normalized) && !/\bzen\b/i.test(normalized)
      ? "mission_ethos"
      : "zen";
    pushScore({
      affordance_id: "mission-ethos.compare_motive_to_zen",
      panel_id: "mission-ethos",
      action_id: "compare_motive_to_zen",
      score: motive ? 0.91 : 0.62,
      reason: motive ? "ideology comparison prompt includes a motive" : "ideology comparison prompt needs a motive",
      required_args_missing: motive ? [] : ["motive"],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "ideology_compare",
      missing: motive ? [] : ["motive"],
      options,
      steps: [
        makeOpenStep("mission-ethos"),
        {
          step_id: "compare_motive_to_zen",
          kind: "run_panel_action",
          panel_id: "mission-ethos",
          action_id: "compare_motive_to_zen",
          args: motive ? { motive, framework } : { framework },
          depends_on: ["open_mission_ethos"],
          expected_receipt_kind: "ideology_motive_comparison_receipt",
          expected_state_change: { store: "mission-ethos", proof_key: "evidence_refs" },
          required: true,
        },
        {
          step_id: "evaluate_ideology_comparison",
          kind: "evaluate_result",
          depends_on: ["compare_motive_to_zen"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "ideology_compare",
      action: motive ? { panel_id: "mission-ethos", action_id: "compare_motive_to_zen", args: { motive, framework } } : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for ideology/Zen comparison; mission-ethos affordance should run before final answer.",
      missing_required_args: motive ? [] : ["motive"],
    };
  }

  return {
    intent: "direct_answer",
    action: null,
    tool_plan: null,
    scores,
    should_use_tool: false,
    reason: "No workstation affordance is clearly required.",
    missing_required_args: [],
  };
}

export function planWorkstationToolUseFromDerivedEquation(input: {
  equation: HelixDerivedEquation;
  threadId: string;
  turnId: string;
  wantsSteps?: boolean;
}): WorkstationToolPlannerResult {
  const actionId = input.wantsSteps === false ? "solve_expression" : "solve_with_steps";
  const prompt = `Derived calculator expression: ${input.equation.expression}`;
  const calculatorSetup = buildCalculatorSetupContext(prompt, input.equation.expression);
  const steps: HelixWorkstationToolPlanStep[] = [
    makeOpenStep("scientific-calculator"),
    {
      step_id: "ingest_expression",
      kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: "ingest_latex",
      args: calculatorArgs(input.equation.expression, calculatorSetup),
      depends_on: ["open_scientific_calculator"],
      expected_receipt_kind: "workspace_action_receipt",
      expected_state_change: { store: "scientific-calculator", proof_key: "input_latex" },
      required: true,
    },
    {
      step_id: actionId,
      kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: actionId,
      args: calculatorArgs(input.equation.expression, calculatorSetup),
      depends_on: ["ingest_expression"],
      expected_receipt_kind: "calculator_receipt",
      expected_state_change: { store: "scientific-calculator", proof_key: "result_text" },
      required: true,
    },
    {
      step_id: "evaluate_calculator_result",
      kind: "evaluate_result",
      depends_on: [actionId],
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    },
  ];
  const toolPlan = buildToolPlan({
    prompt,
    intent: actionId === "solve_with_steps" ? "calculator_verify" : "calculator_solve",
    missing: [],
    options: { threadId: input.threadId, turnId: input.turnId },
    steps,
  });
  return {
    intent: toolPlan.intent,
    action: {
      panel_id: "scientific-calculator",
      action_id: actionId,
      args: calculatorArgs(input.equation.expression, calculatorSetup),
    },
    tool_plan: toolPlan,
    scores: [
      {
        affordance_id: `scientific-calculator.${actionId}`,
        panel_id: "scientific-calculator",
        action_id: actionId,
        score: 0.96,
        reason: "Derived equation provides a concrete calculator expression without prompt-string grafting.",
        required_args_missing: [],
      },
    ],
    should_use_tool: true,
    reason: "Derived equation should be evaluated through the Scientific Calculator tool chain.",
    missing_required_args: [],
  };
}
