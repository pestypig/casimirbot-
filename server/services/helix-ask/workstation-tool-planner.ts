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
import {
  cancelVoiceInterpretationContext,
  upsertVoiceInterpretationContext,
} from "../voice/voice-interpretation-context-store";
import {
  type AgentGoalActuatorV1,
  type AgentGoalContextFeedKindV1,
  WORKSTATION_AGENT_GOAL_ACTUATORS,
  WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS,
  normalizeAgentGoalActuatorV1,
} from "../../../shared/contracts/workstation-goal-context.v1";
import {
  WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES,
  WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS,
  type WorkstationContextFeedQueryCapability,
  workstationContextFeedQuerySpecForCapability,
} from "./workstation-context-feed-query-tool-contracts";
import {
  moralGraphPolicyAllowsLivingSubstrateReflection,
  moralGraphPolicyAllowsProceduralBadgeReflection,
  moralGraphPolicyPrefersTheoryFirst,
} from "../../../shared/moral-graph/moral-graph-agent-invocation-policy";

export type WorkstationToolIntent =
  | "calculator_verify"
  | "calculator_solve"
  | "calculator_live_source"
  | "notes_create"
  | "notes_append"
  | "notes_store_large_text"
  | "narrator_debug_probe"
  | "narrator_control"
  | "dottie_observer"
  | "live_environment_create"
  | "minecraft_live_continuation"
  | "workstation_goal_context"
  | "workstation_control"
  | "theory_context_reflection"
  | "physics_calculation_context"
  | "ideology_compare"
  | "moral_graph_reflection"
  | "moral_living_substrate_reflection"
  | "theory_ideology_bridge_reflection"
  | "civilization_bounds_reflection"
  | "direct_answer";

export type VoiceContextRequestKind =
  | "none"
  | "historical_or_conceptual_mention"
  | "chat_scoped_voice_context"
  | "style_context_only"
  | "post_solver_voice_lane_requested"
  | "delivery_requested"
  | "voice_disabled_or_forbidden";

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
  workspaceSnapshot?: Record<string, unknown> | null;
};

function makePlanId(intent: string): string {
  return `workstation-plan:${intent}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function readPlannerRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readPlannerString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readPlannerStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => readPlannerString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function plannerSituationRoomContext(options: PlanWorkstationToolUseOptions): Record<string, unknown> | null {
  return readPlannerRecord(readPlannerRecord(options.workspaceSnapshot)?.situationRoomContext);
}

function readPlannerContextString(context: Record<string, unknown> | null, keys: string[]): string | null {
  if (!context) return null;
  for (const key of keys) {
    const value = readPlannerString(context[key]);
    if (value) return value;
  }
  return null;
}

function readPlannerContextBoolean(context: Record<string, unknown> | null, keys: string[]): boolean {
  if (!context) return false;
  return keys.some((key) => context[key] === true || context[key] === "true");
}

function hasLiveAnswerWorkspaceContext(options: PlanWorkstationToolUseOptions): boolean {
  const snapshot = readPlannerRecord(options.workspaceSnapshot);
  const context = plannerSituationRoomContext(options);
  const focusedPanel =
    readPlannerContextString(context, ["focused_panel", "focusedPanel", "panel_id", "panelId", "active_panel", "activePanel"]) ??
    readPlannerString(snapshot?.activePanel);
  const openPanels = [
    ...readPlannerStringArray(context?.open_panels),
    ...readPlannerStringArray(context?.openPanels),
  ];
  const sourceModalities = [
    ...readPlannerStringArray(context?.source_modalities),
    ...readPlannerStringArray(context?.sourceModalities),
  ];
  return (
    focusedPanel === "live-answer-environment" ||
    openPanels.includes("live-answer-environment") ||
    readPlannerContextBoolean(context, ["live_answer_environment", "liveAnswerEnvironment"]) ||
    sourceModalities.some((modality) => /\b(?:visual|audio|live[-_\s]?answer)\b/i.test(modality)) ||
    Boolean(readPlannerContextString(context, ["visual_source_ref", "visualSourceRef", "audio_source_ref", "audioSourceRef"]))
  );
}

function isWeakNaturalLanguageArg(value: string | null): boolean {
  return !value || /^(?:to|for|with|as|on|in|into|from|the|a|an)$/i.test(value.trim());
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
  const matches = value.match(/(?:\d+(?:\.\d+)?(?:e[-+]?\d+)?|[()+\-*/^\s.])+/gi) ?? [];
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

function extractUncertaintyMomentumExpression(value: string): string | null {
  if (!/\b(?:uncertainty|hbar|Î”x|delta\s*x|dx|position\s+uncertainty)\b/i.test(value)) return null;
  const dx =
    value.match(/\b(?:dx|delta\s*x|position\s+uncertainty)\s*(?:=|is|of)?\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*(?:m|meters?|metres?)\b/i)?.[1] ??
    null;
  if (!dx) return null;
  const dxValue = Number(dx);
  if (!Number.isFinite(dxValue) || dxValue <= 0) return null;
  return `1.054571817e-34/(2*${dx})`;
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
  const variables = (setup.variables ?? []).map((variable: HelixCalculatorSetupVariable) => {
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
      .filter((variable: HelixCalculatorSetupVariable) => variable.unit)
      .map((variable: HelixCalculatorSetupVariable) => [variable.symbol, variable.unit as string]),
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
    unit_system: setup.unit_system ?? (setup.result_unit || variables.some((variable: HelixCalculatorSetupVariable) => variable.unit) ? "SI" : null),
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
  const uncertaintyMomentumExpression = extractUncertaintyMomentumExpression(normalized);
  if (uncertaintyMomentumExpression) return uncertaintyMomentumExpression;
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
    if (/[=+\-*/^]|\\frac|\\sqrt/.test(candidate) && !/\s/.test(candidate)) return stripOuterPunctuation(candidate);
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
    if (/[=+\-*/^]|\\frac|\\sqrt/.test(cleaned) && !/\s/.test(cleaned)) {
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

function isSourceBoundNumericEvidenceCollectionPrompt(prompt: string): boolean {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return false;
  if (
    /\b(?:postulate\s+board|postulate|candidate\s+postulate|evidence\s+refs?)\b/i.test(normalized) &&
    /\b(?:promoted|page[-\s]?grounded|exact\s+row|equation\s+row|crop\s+ref|image\s+lens|source(?:\/hash|\s+hash)?|evidence\s+depth)\b/i.test(normalized)
  ) {
    return false;
  }
  const asksForEvidence =
    /\b(?:find|grab|get|collect|look\s*up|search|return|suggest)\b[\s\S]{0,180}\b(?:cited|citation|source[-\s]?bound|unit[-\s]?bearing|research[-\s]?papers?|papers?|scholarly|numerical?\s+values?|numeric\s+values?|parameters?)\b/i.test(normalized) ||
    /\b(?:cited|citation|source[-\s]?bound|unit[-\s]?bearing|research[-\s]?papers?|papers?|scholarly)\b[\s\S]{0,180}\b(?:numerical?\s+values?|numeric\s+values?|parameters?|units?)\b/i.test(normalized);
  const bindingAsFutureUse =
    /\b(?:calculator\s+binding|calculator[-\s]?usable|use\s+for\s+(?:the\s+)?calculator|could\s+use|can\s+use|would\s+use|fit\s+to\s+(?:this|the|these)\s+(?:equations?|formulas?))\b/i.test(
      normalized,
    );
  const explicitSolveNow =
    /\b(?:plug|substitute|insert|bind)\b[\s\S]{0,80}\b(?:into|in)\b[\s\S]{0,60}\b(?:calculator|solve|expression)\b/i.test(normalized) ||
    /\b(?:run|use)\b[\s\S]{0,80}\b(?:scientific[-\s]?calculator|calculator|scientific-calculator\.solve_expression)\b/i.test(normalized) ||
    /\b(?:calculate|compute|evaluate|solve)\b[\s\S]{0,80}\b(?:now|result|answer|value|beta|estimate)\b/i.test(normalized);
  return (asksForEvidence || bindingAsFutureUse) && !explicitSolveNow;
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
  if (isSourceBoundNumericEvidenceCollectionPrompt(prompt)) return false;
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
    /\b(?:compare|check|evaluate|review|analy[sz]e)\b[\s\S]{0,100}\b(?:motive|intent|intention|goal|behavior|decision|action)\b[\s\S]{0,140}\b(?:moral|ethos|ideology|mission\s+ethos)\b/i.test(prompt) ||
    /\b(?:moral|ethos|ideology|mission\s+ethos)\b[\s\S]{0,100}\b(?:compare|check|evaluate|review|analy[sz]e)\b[\s\S]{0,100}\b(?:motive|intent|intention|goal|behavior|decision|action)\b/i.test(prompt)
  );
}

function extractIdeologyMotive(prompt: string): string | null {
  const normalized = normalizePrompt(prompt);
  const quoted = extractQuoted(normalized);
  if (quoted) return quoted;
  const afterColon = normalized.match(/:\s*(.+)$/)?.[1];
  if (afterColon) return stripOuterPunctuation(afterColon);
  const afterToZen = normalized.match(/\b(?:to|against|with|through|using)\s+(?:the\s+)?(?:moral|ethos|ideology|mission\s+ethos)(?:\s+framework)?\s*(.+)$/i)?.[1];
  if (afterToZen) return stripOuterPunctuation(afterToZen);
  return normalized
    .replace(/\b(?:compare|check|evaluate|review|analy[sz]e)\b/gi, " ")
    .replace(/\b(?:this|that|motive|intent|intention|goal|behavior|decision|action|to|against|with|through|using|the|a|an|moral|ethos|ideology|mission)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800) || null;
}

function extractNamedArg(prompt: string, names: string[]): string | null {
  for (const name of names) {
    const pattern = new RegExp(
      `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b\\s*(?::|=)?\\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9:._-]+))`,
      "i",
    );
    const match = prompt.match(pattern);
    const value = match?.[1] ?? match?.[2] ?? match?.[3];
    if (value) return stripOuterPunctuation(value);
  }
  return null;
}

function extractNamedTextArg(prompt: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const quotedPattern = new RegExp(`\\b${escaped}\\b\\s*(?::|=)?\\s*(?:"([^"]+)"|'([^']+)')`, "i");
    const quoted = prompt.match(quotedPattern);
    const quotedValue = quoted?.[1] ?? quoted?.[2];
    if (quotedValue?.trim()) return stripOuterPunctuation(quotedValue);

    const barePattern = new RegExp(
      `\\b${escaped}\\b\\s*(?::|=)\\s*([^.;]+?)(?=\\s+trace[_ ]?id\\s*(?::|=)|\\s+event[_ ]?id\\s*(?::|=)|\\s+turn[_ ]?id\\s*(?::|=)|$)`,
      "i",
    );
    const bare = prompt.match(barePattern)?.[1]?.trim();
    if (bare) return stripOuterPunctuation(bare);
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

function extractDottieAnswerSnapshotRef(prompt: string): string | null {
  return (
    (/\banswer_snapshot\.latest\b/i.test(prompt) ? "answer_snapshot.latest" : null) ??
    extractNamedArg(prompt, ["selected_text_ref", "selected text ref", "selectedTextRef"]) ??
    extractNamedArg(prompt, ["answer_snapshot", "answer snapshot", "answerSnapshot"])
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

export function classifyVoiceContextRequest(prompt: string): VoiceContextRequestKind {
  const normalized = normalizePrompt(prompt);
  const mentionsDottie = /\b(?:auntie\s+dottie|dottie)\b/i.test(normalized);
  const mentionsVoice = /\b(?:voice|read\s+aloud|read\s+out\s+loud|out\s*loud|outloud|aloud|speak|say|narrate)\b/i.test(normalized);
  if (!mentionsDottie && !mentionsVoice) return "none";

  if (/\b(?:operator\s+command|run\s+panel\s+action|voice_delivery\.propose_from_trace)\b/i.test(normalized)) {
    return "delivery_requested";
  }
  if (/\b(?:do\s+not|don't|dont|stop|disable|mute|turn\s+off|without)\b[\s\S]{0,80}\b(?:auntie\s+dottie|dottie|voice|speak|read|narrate)\b/i.test(normalized)) {
    return "voice_disabled_or_forbidden";
  }
  if (/\b(?:earlier|previously|before|last\s+time|you\s+mentioned|we\s+mentioned)\b[\s\S]{0,120}\b(?:auntie\s+dottie|dottie|voice)\b/i.test(normalized)) {
    return "historical_or_conceptual_mention";
  }
  if (/\bwhat\s+is\b[\s\S]{0,80}\b(?:auntie\s+dottie|dottie)\b[\s\S]{0,80}\b(?:voice\s+policy|policy|style|mode)\b/i.test(normalized)) {
    return "historical_or_conceptual_mention";
  }
  if (/\b(?:answer|respond|talk|write)\s+(?:like|as)\s+(?:auntie\s+dottie|dottie)\b/i.test(normalized)) {
    return "style_context_only";
  }
  if (/\b(?:use|set|make|keep)\b[\s\S]{0,80}\b(?:auntie\s+dottie|dottie)\b[\s\S]{0,80}\b(?:style|persona|tone|voice)\b/i.test(normalized)) {
    return "chat_scoped_voice_context";
  }
  if (/\b(?:read|speak|say|narrate)\b[\s\S]{0,80}\b(?:disclaimer|caveat|warning|status|ready|summary)\b[\s\S]{0,100}\b(?:out\s*loud|outloud|aloud|as\s+(?:auntie\s+dottie|dottie)|with\s+(?:auntie\s+dottie|dottie))\b/i.test(normalized)) {
    return "post_solver_voice_lane_requested";
  }
  if (
    /\b(?:have|ask|tell)\s+(?:auntie\s+)?dottie\b[\s\S]{0,120}\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me|answer_snapshot\.latest|selected_text_ref)\b/i.test(normalized) ||
    /\b(?:auntie\s+dottie|dottie)\b[\s\S]{0,120}\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me|answer_snapshot\.latest|selected_text_ref)\b/i.test(normalized) ||
    /\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|answer_snapshot\.latest|selected_text_ref|out\s*loud|outloud|aloud|to\s+me)\b[\s\S]{0,120}\b(?:auntie\s+dottie|dottie)\b/i.test(normalized)
  ) {
    return "delivery_requested";
  }
  return mentionsVoice ? "historical_or_conceptual_mention" : "none";
}

function applyVoiceInterpretationContextRequest(
  prompt: string,
  kind: VoiceContextRequestKind,
  options: PlanWorkstationToolUseOptions,
): void {
  if (
    kind !== "chat_scoped_voice_context" &&
    kind !== "style_context_only" &&
    kind !== "post_solver_voice_lane_requested" &&
    kind !== "voice_disabled_or_forbidden"
  ) {
    return;
  }

  const threadId = options.threadId ?? "helix-ask:desktop";
  if (kind === "voice_disabled_or_forbidden") {
    cancelVoiceInterpretationContext(threadId);
    return;
  }

  const personaProfile = /\bauntie\s+dottie\b/i.test(prompt)
    ? "auntie_dottie"
    : /\bdottie\b/i.test(prompt)
      ? "auntie_dottie"
      : "operator_neutral";
  const reasonCodes =
    kind === "post_solver_voice_lane_requested"
      ? ["post_solver_voice_lane_requested"]
      : kind === "style_context_only"
        ? ["style_context_only"]
        : ["chat_scoped_voice_context"];

  upsertVoiceInterpretationContext({
    thread_id: threadId,
    turn_id: options.turnId ?? null,
    scope: kind === "post_solver_voice_lane_requested" ? "turn" : "chat_session",
    persona_profile: personaProfile,
    interpretation_job:
      kind === "post_solver_voice_lane_requested"
        ? /\b(?:disclaimer|caveat)\b/i.test(prompt)
          ? "caveat_reader"
          : "status_callout"
        : "manual_read_style",
    output_mode: kind === "style_context_only" ? "manual_read_style" : "voice_lane_only",
    salience_policy:
      kind === "post_solver_voice_lane_requested"
        ? /\b(?:warning|blocker|blocked|risk)\b/i.test(prompt)
          ? "warnings_and_blockers"
          : /\b(?:status|ready)\b/i.test(prompt)
            ? "state_changes_only"
            : "caveats_only"
        : "manual_only",
    speak_policy: kind === "post_solver_voice_lane_requested" ? "confirm_required" : "muted",
    max_chars: extractDottieMaxChars(prompt) ?? 180,
    certainty_ceiling: "source_answer_snapshot",
    applies_until: kind === "post_solver_voice_lane_requested" ? "turn_end" : "explicit_cancel",
    evidence_refs: kind === "post_solver_voice_lane_requested" ? ["answer_snapshot:pending"] : [],
    reason_codes: reasonCodes,
  });
}

function isNarratorDebugProbeToolPrompt(prompt: string): boolean {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return false;
  const mentionsExactAction =
    /\bpanel[_\s-]?id\s*(?:=|:)\s*narrator\b/i.test(normalized) &&
    /\baction[_\s-]?id\s*(?:=|:)\s*narrator\.debug_auto_speak_probe\b/i.test(normalized);
  const mentionsPanelActionCommand =
    /\b(?:run|trigger|use|execute|publish)\s+(?:the\s+)?(?:workstation\s+)?(?:panel\s+)?action\b[\s\S]{0,120}\bnarrator\.debug_auto_speak_probe\b/i.test(
      normalized,
    );
  if (!mentionsExactAction && !mentionsPanelActionCommand) return false;

  const affirmative =
    /\boperator\s+command\b/i.test(normalized) ||
    /\b(?:run|trigger|use|execute|publish|send|start)\b[\s\S]{0,120}\b(?:workstation\s+action|panel\s+action|narrator\.debug_auto_speak_probe|debug\s+probe)\b/i.test(
      normalized,
    );
  if (!affirmative) return false;

  const negated =
    /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|no\s+need\s+to|never)\b[\s\S]{0,160}\b(?:run|trigger|use|execute|publish|send|start|narrator\.debug_auto_speak_probe|debug\s+probe)\b/i.test(
      normalized,
    );
  const hypothetical =
    /\b(?:what\s+would\s+happen|what\s+happens|if\s+(?:i|we|you)\s+(?:ran|run|trigger|use|execute)|would\s+you|could\s+you|should\s+(?:we|you)|tomorrow|later|next\s+time|in\s+the\s+future)\b[\s\S]{0,180}\b(?:narrator\.debug_auto_speak_probe|panel[_\s-]?id\s*(?:=|:)\s*narrator)\b/i.test(
      normalized,
    );
  const quotedOnly =
    /^["'`].*(?:panel[_\s-]?id\s*(?:=|:)\s*narrator|narrator\.debug_auto_speak_probe).*["'`]$/i.test(normalized) ||
    /\b(?:the\s+text|screen|document|quote|quoted)\b[\s\S]{0,80}\b(?:says|contains|shows)\b[\s\S]{0,160}\b(?:panel[_\s-]?id\s*(?:=|:)\s*narrator|narrator\.debug_auto_speak_probe)\b/i.test(
      normalized,
    );
  return !negated && !hypothetical && !quotedOnly;
}

function buildNarratorDebugProbePlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const text =
    extractNamedTextArg(normalized, ["text", "message", "probe text", "source text"]) ??
    "Narrator debug probe from Helix Ask.";
  const traceId =
    extractNamedArg(normalized, ["trace_id", "trace id"]) ??
    `narrator:ask-probe:${options.turnId ?? Date.now()}`;
  const args = {
    text,
    trace_id: traceId,
    source: "helix_ask",
  };
  const steps: HelixWorkstationToolPlanStep[] = [
    makeOpenStep("narrator"),
    {
      step_id: "publish_narrator_debug_auto_speak_probe",
      kind: "run_panel_action",
      panel_id: "narrator",
      action_id: "narrator.debug_auto_speak_probe",
      args,
      depends_on: ["open_narrator"],
      expected_receipt_kind: "helix.narrator_debug_auto_speak_probe_receipt.v1",
      expected_state_change: { store: "narrator", proof_key: "debug_auto_speak_probe" },
      required: true,
    },
    {
      step_id: "evaluate_narrator_debug_probe_receipt",
      kind: "evaluate_result",
      depends_on: ["publish_narrator_debug_auto_speak_probe"],
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    },
  ];
  scores.push({
    affordance_id: "narrator.debug_auto_speak_probe",
    panel_id: "narrator",
    action_id: "narrator.debug_auto_speak_probe",
    score: 0.96,
    reason: "affirmative explicit narrator debug probe command includes panel_id and action_id",
    required_args_missing: [],
  });
  return {
    intent: "narrator_debug_probe",
    action: {
      panel_id: "narrator",
      action_id: "narrator.debug_auto_speak_probe",
      args,
    },
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "narrator_debug_probe",
      missing: [],
      options,
      steps,
    }),
    scores,
    should_use_tool: true,
    reason: "Prompt explicitly asks the Narrator panel to publish the governed auto-speak debug probe.",
    missing_required_args: [],
  };
}

function isNarratorControlPrompt(prompt: string): boolean {
  const mentionsNarratorAction =
    /\blive_env\.narrator_(?:say|bind_stream)\b/i.test(prompt) ||
    /\bnarrator\.(?:say|bind_stream)\b/i.test(prompt) ||
    /\bpanel[_\s-]?id\s*(?:=|:)\s*narrator\b[\s\S]{0,120}\baction[_\s-]?id\s*(?:=|:)\s*narrator\.(?:say|bind_stream)\b/i.test(prompt);
  const naturalSay =
    /\b(?:narrator\s+say|say\s+(?:this|that)?\s*(?:with|through|using)\s+(?:the\s+)?narrator|speak\s+(?:this|that)?\s*(?:with|through|using)\s+(?:the\s+)?narrator)\b/i.test(prompt);
  const naturalBind =
    /\b(?:turn\s+on|enable|bind|route|attach)\b[\s\S]{0,100}\b(?:narrator|narration|read[-\s]?aloud)\b[\s\S]{0,160}\b(?:translation|translated\s+transcript|translated\s+speech|transcript\s+stream|live\s+answer|micro[-\s]?deck\s+output|goal\s+context\s+updates?)\b/i.test(prompt) ||
    /\b(?:narrator|narration)\b[\s\S]{0,120}\b(?:read|speak|announce)\b[\s\S]{0,160}\b(?:translation|translated\s+transcript|translated\s+speech|transcript\s+stream|live\s+answer|micro[-\s]?deck\s+output|goal\s+context\s+updates?)\b/i.test(prompt);
  if (!mentionsNarratorAction && !naturalSay && !naturalBind) return false;

  const negated =
    /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|no\s+need\s+to|never|for\s+now)\b[\s\S]{0,180}\b(?:live_env\.narrator_(?:say|bind_stream)|narrator\.(?:say|bind_stream)|narrator|narration|read[-\s]?aloud|speak)\b/i.test(prompt);
  const hypothetical =
    /\b(?:what\s+would\s+happen|what\s+happens|if\s+(?:i|we|you)|would\s+you|could\s+you|should\s+(?:we|you)|tomorrow|later|next\s+time|in\s+the\s+future|eventually)\b[\s\S]{0,180}\b(?:live_env\.narrator_(?:say|bind_stream)|narrator\.(?:say|bind_stream)|narrator|narration)\b/i.test(prompt);
  const historical =
    /\b(?:previously|earlier|last\s+time|before|already|historically|was|were|had)\b[\s\S]{0,180}\b(?:live_env\.narrator_(?:say|bind_stream)|narrator\.(?:say|bind_stream)|narrator\s+say|bind\s+narrator|narrator|narration)\b/i.test(prompt);
  const deferred =
    /\b(?:live_env\.narrator_(?:say|bind_stream)|narrator\.(?:say|bind_stream)|narrator|narration)\b[\s\S]{0,140}\b(?:later|tomorrow|next\s+time|in\s+the\s+future|eventually)\b/i.test(prompt);
  const quotedOnly =
    /^["'`].*(?:live_env\.narrator_(?:say|bind_stream)|narrator\.(?:say|bind_stream)|narrator\s+say|bind\s+narrator).*["'`]$/i.test(prompt) ||
    /\b(?:the\s+text|screen|document|quote|quoted|label|ui)\b[\s\S]{0,80}\b(?:says|contains|shows|reads)\b[\s\S]{0,160}\b(?:live_env\.narrator_(?:say|bind_stream)|narrator\.(?:say|bind_stream)|narrator\s+say|bind\s+narrator)\b/i.test(prompt);
  return !negated && !hypothetical && !historical && !deferred && !quotedOnly;
}

function narratorControlKind(prompt: string): "say" | "bind_stream" {
  if (
    /\blive_env\.narrator_say\b/i.test(prompt) ||
    /\bnarrator\.say\b/i.test(prompt) ||
    /\baction[_\s-]?id\s*(?:=|:)\s*narrator\.say\b/i.test(prompt) ||
    /\bnarrator\s+say\b/i.test(prompt)
  ) {
    return "say";
  }
  if (
    /\blive_env\.narrator_bind_stream\b/i.test(prompt) ||
    /\bnarrator\.bind_stream\b/i.test(prompt) ||
    /\b(?:turn\s+on|enable|bind|route|attach)\b[\s\S]{0,100}\b(?:narrator|narration|read[-\s]?aloud)\b/i.test(prompt) ||
    /\b(?:translation|translated\s+transcript|translated\s+speech|transcript\s+stream)\b[\s\S]{0,120}\b(?:narrator|narration|read[-\s]?aloud)\b/i.test(prompt)
  ) {
    return "bind_stream";
  }
  return "say";
}

function inferNarratorStreamKind(prompt: string): string {
  if (/\btranslated\s+speech\b/i.test(prompt)) return "translated_speech";
  if (/\b(?:translation|translated\s+transcript)\b/i.test(prompt)) return "translated_transcript";
  if (/\btranscript\s+stream\b/i.test(prompt)) return "transcript_stream";
  if (/\bsource\s+health\b/i.test(prompt)) return "source_health_status";
  if (/\bgoal\s+context\b/i.test(prompt)) return "route_evidence";
  if (/\b(?:live\s+answer|micro[-\s]?deck)\b/i.test(prompt)) return "typed_commentary";
  return "translated_transcript";
}

function defaultNarratorSourceRef(streamKind: string): string {
  return `source:${streamKind}:active`;
}

function shouldUseLiveEnvNarratorTool(prompt: string): boolean {
  if (/\blive_env\.narrator_(?:say|bind_stream)\b/i.test(prompt)) return true;
  const explicitPanelAction =
    /\bpanel[_\s-]?id\s*(?:=|:)\s*narrator\b[\s\S]{0,120}\baction[_\s-]?id\s*(?:=|:)\s*narrator\.(?:say|bind_stream)\b/i.test(prompt) ||
    /\brun\s+panel\s+action\b[\s\S]{0,160}\bnarrator\.(?:say|bind_stream)\b/i.test(prompt);
  return !explicitPanelAction;
}

function buildNarratorControlPlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const kind = narratorControlKind(normalized);
  const actionId = kind === "bind_stream" ? "narrator.bind_stream" : "narrator.say";
  const liveEnvToolId = kind === "bind_stream" ? "live_env.narrator_bind_stream" : "live_env.narrator_say";
  const useLiveEnvTool = shouldUseLiveEnvNarratorTool(normalized);
  const streamKind = inferNarratorStreamKind(normalized);
  const sourceRef =
    extractNamedArg(normalized, ["source_ref", "source ref", "source_id", "source id"]) ??
    defaultNarratorSourceRef(streamKind);
  const inferredText =
    extractNamedTextArg(normalized, ["text", "message", "say", "utterance"]) ??
    extractQuoted(normalized) ??
    normalized.replace(/^.*?\bnarrator\s+say\b[:\s-]*/i, "").trim();
  const text = inferredText || "Narrator output requested from Helix Ask.";
  const args =
    kind === "bind_stream"
      ? {
          ...(extractNamedArg(normalized, ["goal_id", "goal id"]) ? { goal_id: extractNamedArg(normalized, ["goal_id", "goal id"]) } : {}),
          source_ref: sourceRef,
          stream_kind: streamKind,
          delivery_mode: extractNamedArg(normalized, ["delivery_mode", "delivery mode"]) ?? "visible_only",
          voice_policy: extractNamedArg(normalized, ["voice_policy", "voice policy"]) ?? "confirm_speak_required",
          ...(extractNamedArg(normalized, ["preset_id", "preset id"]) ? { preset_id: extractNamedArg(normalized, ["preset_id", "preset id"]) } : {}),
        }
      : {
          ...(extractNamedArg(normalized, ["goal_id", "goal id"]) ? { goal_id: extractNamedArg(normalized, ["goal_id", "goal id"]) } : {}),
          text,
          source_kind: extractNamedArg(normalized, ["source_kind", "source kind"]) ?? "helix_console",
          source_id: extractNamedArg(normalized, ["source_id", "source id"]) ?? "helix_ask:narrator.say",
          delivery_mode: extractNamedArg(normalized, ["delivery_mode", "delivery mode"]) ?? "confirm_to_speak",
          evidence_refs: [options.turnId ?? "helix_ask:narrator_control"],
        };
  const publishStepId = kind === "bind_stream" ? "bind_narrator_stream" : "publish_narrator_say";
  const steps: HelixWorkstationToolPlanStep[] = useLiveEnvTool
    ? [
        {
          step_id: publishStepId,
          kind: "run_ask_tool",
          tool_id: liveEnvToolId,
          args,
          expected_receipt_kind: kind === "bind_stream" ? "helix.narrator_bind_stream_request.v1" : "helix.narrator_say_request.v1",
          expected_state_change: {
            store: "stage-play-goal-context",
            proof_key: "goalContextUpdates",
          },
          required: true,
        },
        {
          step_id: "evaluate_narrator_control_receipt",
          kind: "evaluate_result",
          depends_on: [publishStepId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ]
    : [
        makeOpenStep("narrator"),
        {
          step_id: publishStepId,
          kind: "run_panel_action",
          panel_id: "narrator",
          action_id: actionId,
          args,
          depends_on: ["open_narrator"],
          expected_receipt_kind: kind === "bind_stream" ? "narrator_bind_stream_receipt" : "narrator_say_receipt",
          expected_state_change: {
            store: "narrator",
            proof_key: kind === "bind_stream" ? "stream_binding" : "event_id",
          },
          required: true,
        },
        {
          step_id: "evaluate_narrator_control_receipt",
          kind: "evaluate_result",
          depends_on: [publishStepId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ];
  scores.push({
    affordance_id: useLiveEnvTool ? liveEnvToolId : actionId,
    panel_id: useLiveEnvTool ? "helix_ask" : "narrator",
    action_id: useLiveEnvTool ? liveEnvToolId : actionId,
    score: 0.94,
    reason: kind === "bind_stream"
      ? "affirmative narrator stream-binding command should bind a live output stream through governed narrator policy"
      : "affirmative narrator say command should publish a governed non-terminal narrator event",
    required_args_missing: [],
  });
  return {
    intent: "narrator_control",
    action: useLiveEnvTool
      ? null
      : {
          panel_id: "narrator",
          action_id: actionId,
          args,
        },
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "narrator_control",
      missing: [],
      options,
      steps,
    }),
    scores,
    should_use_tool: true,
    reason: kind === "bind_stream"
      ? "Prompt asks to bind Narrator to a workstation stream; produce a narrator binding receipt as observation evidence."
      : "Prompt asks Narrator to publish a custom utterance; produce a narrator event receipt as observation evidence.",
    missing_required_args: [],
  };
}

function isDottieObserverToolPrompt(prompt: string): boolean {
  const voiceContextKind = classifyVoiceContextRequest(prompt);
  if (
    voiceContextKind === "historical_or_conceptual_mention" ||
    voiceContextKind === "chat_scoped_voice_context" ||
    voiceContextKind === "style_context_only" ||
    voiceContextKind === "post_solver_voice_lane_requested" ||
    voiceContextKind === "voice_disabled_or_forbidden"
  ) {
    return false;
  }
  const mentionsDottie =
    /\b(?:auntie\s+dottie|dottie)\b/i.test(prompt) ||
    /\bsituation-room-pipelines\.(?:observer|voice_delivery|dottie)\./i.test(prompt) ||
    /\b(?:dottie\.manifest|observer\.attach|observer\.detach|observer\.query|voice_delivery\.propose_from_trace)\b/i.test(prompt);
  if (!mentionsDottie) return false;
  const affirmativeCommand =
    /\boperator\s+command\b/i.test(prompt) ||
    /\brun\s+panel\s+action\b/i.test(prompt) ||
    /\b(?:go\s+into|enter|enable|turn\s+on)\s+(?:auntie\s+dottie|dottie)\s+(?:mode|watch|preset)\b/i.test(prompt) ||
    /\b(?:have|ask|tell)\s+(?:auntie\s+)?dottie\b[\s\S]{0,120}\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me)\b/i.test(prompt) ||
    /\b(?:auntie\s+dottie|dottie)\b[\s\S]{0,120}\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me)\b/i.test(prompt) ||
    /\b(?:read|speak|say|narrate|voice)\b[\s\S]{0,100}\b(?:that|this|it|out\s*loud|outloud|aloud|to\s+me)\b[\s\S]{0,120}\b(?:auntie\s+dottie|dottie)\b/i.test(prompt) ||
    /\b(?:manifest|materiali[sz]e|attach|detach|query|show|list|propose|prepare|create|add|set\s+up|start|build)\b[\s\S]{0,120}\b(?:auntie\s+dottie|dottie|observer|voice\s+delivery|voice_delivery)\b/i.test(prompt) ||
    /\b(?:auntie\s+dottie|dottie|observer|voice\s+delivery|voice_delivery)\b[\s\S]{0,120}\b(?:manifest|materiali[sz]e|attach|detach|query|show|list|propose|prepare|create|add|watch|witness|preset|mode)\b/i.test(prompt);
  if (!affirmativeCommand) return false;
  const negatedCommand =
    /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to)\s+(?:manifest|materiali[sz]e|attach|detach|query|show|list|propose|prepare|create|add|run)\b/i.test(prompt) ||
    /\b(?:should|could|would)\s+(?:we|you)\b[\s\S]{0,80}\b(?:manifest|attach|propose|run)\b/i.test(prompt);
  return !negatedCommand;
}

function isMinecraftLiveContinuationPrompt(prompt: string): boolean {
  const mentionsMinecraft = /\b(?:minecraft|minehut|overworld|nether|server)\b/i.test(prompt);
  const mentionsLiveAnswer = /\b(?:live\s+answer|live\s+source|live\s+server|server\s+as\s+a\s+live|mission\s+controller|riding\s+shotgun)\b/i.test(prompt);
  const wantsWatch = /\b(?:keep|continue|start|set\s+up|setup|watch|monitor|observe|track)\b[\s\S]{0,100}\b(?:watching|checking|monitoring|observing|minecraft|server|live\s+answer)\b/i.test(prompt) ||
    /\b(?:watch|monitor|observe|track)\b[\s\S]{0,120}\b(?:minecraft|server)\b/i.test(prompt);
  const negated =
    /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|no\s+need\s+to)\b[\s\S]{0,100}\b(?:watch|monitor|create|start|attach|live\s+answer|live\s+continuation)\b/i.test(prompt) ||
    /\b(?:should|could|would)\s+(?:we|you)\b[\s\S]{0,100}\b(?:watch|monitor|create|start|attach)\b/i.test(prompt);
  return mentionsMinecraft && mentionsLiveAnswer && wantsWatch && !negated;
}

function buildMinecraftLiveContinuationPlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const threadId = options.threadId ?? "helix-ask:desktop";
  const roomId = extractNamedArg(normalized, ["room_id", "room id"]) ?? "room:minecraft-minehut";
  const sourceId = extractNamedArg(normalized, ["source_id", "source id"]) ?? "source:minecraft-server";
  const objective =
    extractNamedArg(normalized, ["objective"]) ??
    "Keep watching the Minecraft server as a live answer and surface only salient state changes.";
  const environmentId = `live-env:minecraft:${threadId.replace(/[^a-z0-9_-]+/gi, "_")}`;
  const createArgs = {
    thread_id: threadId,
    room_id: roomId,
    source_ids: [sourceId],
    objective,
    preset: "minecraft_mission_controller",
    mode: "standby_receipts",
    source_config: {
      source_kind: "minecraft_world_events",
      transport: "cloudflarelink",
    },
  };
  const attachArgs = {
    thread_id: threadId,
    environment_id: environmentId,
    source_id: sourceId,
    source_family: "minecraft_world_events",
    kind: "minecraft_world_events",
    panel_id: "situation-room-pipelines",
  };
  const continuationArgs = {
    thread_id: threadId,
    room_id: roomId,
    environment_id: environmentId,
    source_ids: [sourceId],
    objective,
    voice_policy: "confirm_speak_required",
    evidence_threshold: "observed",
    lanes_enabled: [
      "source_health",
      "world_state",
      "risk_watch",
      "objective_progress",
      "route_watch",
      "prediction_reflection",
      "voice_gate",
    ],
  };
  const steps: HelixWorkstationToolPlanStep[] = [
    makeOpenStep("situation-room-pipelines"),
    {
      step_id: "create_minecraft_live_answer_environment",
      kind: "run_panel_action",
      panel_id: "situation-room-pipelines",
      action_id: "create_live_answer_environment",
      args: createArgs,
      depends_on: ["open_situation_room_pipelines"],
      expected_receipt_kind: "live_answer_environment_receipt",
      expected_state_change: { store: "live-answer-environment", proof_key: "environment_id" },
      required: true,
    },
    {
      step_id: "attach_minecraft_live_source",
      kind: "run_panel_action",
      panel_id: "situation-room-pipelines",
      action_id: "attach_live_source",
      args: attachArgs,
      depends_on: ["create_minecraft_live_answer_environment"],
      expected_receipt_kind: "helix.live_source_admission_receipt.v1",
      expected_state_change: { store: "live-answer-environment", proof_key: "source_id" },
      required: true,
    },
    {
      step_id: "start_minecraft_live_continuation",
      kind: "run_panel_action",
      panel_id: "situation-room-pipelines",
      action_id: "live_continuation.start",
      args: continuationArgs,
      depends_on: ["attach_minecraft_live_source"],
      expected_receipt_kind: "helix.live_continuation_job_receipt.v1",
      expected_state_change: { store: "live-continuation-job-store", proof_key: "job_id" },
      required: true,
    },
    {
      step_id: "evaluate_minecraft_live_continuation_receipts",
      kind: "evaluate_result",
      depends_on: ["create_minecraft_live_answer_environment", "attach_minecraft_live_source", "start_minecraft_live_continuation"],
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    },
  ];
  scores.push(
    {
      affordance_id: "situation-room-pipelines.create_live_answer_environment",
      panel_id: "situation-room-pipelines",
      action_id: "create_live_answer_environment",
      score: 0.96,
      reason: "affirmative Minecraft live-answer watch request should create the live answer environment",
      required_args_missing: [],
    },
    {
      affordance_id: "situation-room-pipelines.attach_live_source",
      panel_id: "situation-room-pipelines",
      action_id: "attach_live_source",
      score: 0.95,
      reason: "Minecraft CloudflareLink source must be admitted before continuation",
      required_args_missing: [],
    },
    {
      affordance_id: "situation-room-pipelines.live_continuation.start",
      panel_id: "situation-room-pipelines",
      action_id: "live_continuation.start",
      score: 0.95,
      reason: "live continuation baton drives procedural lanes without spawning a new chat",
      required_args_missing: [],
    },
  );
  return {
    intent: "minecraft_live_continuation",
    action: {
      panel_id: "situation-room-pipelines",
      action_id: "create_live_answer_environment",
      args: createArgs,
    },
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "minecraft_live_continuation",
      missing: [],
      options,
      steps,
    }),
    scores,
    should_use_tool: true,
    reason: "Prompt asks to keep the Minecraft server attached as a live answer with a single-agent continuation baton.",
    missing_required_args: [],
  };
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

const GOAL_CONTEXT_OBJECT_PATTERN =
  "(?:workstation\\s+goal\\s+context|goal\\s+context\\s+updates?|active\\s+goal\\s+sessions?|agent\\s+goal\\s+sessions?|goal\\s+sessions?|goal\\s+satisfaction|satisfaction\\s+evaluation|final\\s+report\\s+readiness|per[-\\s]?packet\\s+traces?|packet\\s+traces?|trace\\s+memory|reasoning\\s+circuit|process\\s+graph\\s+traces?|visual\\s+summaries|audio\\s+transcripts?|translation\\s+segments?|translated\\s+transcripts?|micro[-\\s]?deck\\s+outputs?|live\\s+answer\\s+state|live\\s+answer\\s+lines?|source\\s+health|source\\s+status|source\\s+capability\\s+state|narrator\\s+events?|narrator\\s+bindings?|narrator\\s+streams?|route\\s+evidence|route[-\\s]?watch\\s+evidence|route[-\\s]?watch\\s+updates?|automation\\s+polic(?:y|ies)|workstation\\s+automations?)";
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GOAL_CONTEXT_FEED_QUERY_TOOL_PATTERN = WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES.map(escapeRegex).join("|");
const WORKSTATION_CONTEXT_FEED_NON_TRACE_QUERY_CAPABILITIES = WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES.filter(
  (capability): capability is WorkstationContextFeedTool => capability !== "live_env.query_trace_memory",
);
const GOAL_CONTEXT_NON_TRACE_FEED_QUERY_TOOL_PATTERN =
  WORKSTATION_CONTEXT_FEED_NON_TRACE_QUERY_CAPABILITIES.map(escapeRegex).join("|");
const GOAL_CONTEXT_TOOL_PATTERN =
  `(?:live_env\\.query_workstation_goal_context|live_env\\.start_agent_goal_session|live_env\\.evaluate_goal_satisfaction|${GOAL_CONTEXT_FEED_QUERY_TOOL_PATTERN})`;

type WorkstationContextFeedTool = Exclude<WorkstationContextFeedQueryCapability, "live_env.query_trace_memory">;

type WorkstationControlTool =
  | "live_env.change_workstation_preset"
  | "live_env.set_visual_preset"
  | "live_env.set_audio_preset"
  | "live_env.bind_workstation_source"
  | "live_env.unbind_workstation_source"
  | "live_env.pause_workstation_loop"
  | "live_env.resume_workstation_loop"
  | "live_env.set_workstation_loop_state"
  | "live_env.repair_loop"
  | "live_env.repair_workstation_source"
  | "live_env.update_live_answer_projection"
  | "live_env.focus_process_graph";

function promptPrefersAudioSource(prompt: string, toolId?: WorkstationControlTool | null): boolean {
  return (
    toolId === "live_env.set_audio_preset" ||
    /\b(?:audio|earbud|earbuds|transcript|translation|translate|speech|mic|microphone|narrator|voice)\b/i.test(prompt)
  );
}

function promptPrefersVisualSource(prompt: string, toolId?: WorkstationControlTool | null): boolean {
  return (
    toolId === "live_env.set_visual_preset" ||
    /\b(?:visual|screen|image|lens|camera|frame|capture|frog|classification|classifier|shade)\b/i.test(prompt)
  );
}

function inferLiveAnswerSourceRef(
  prompt: string,
  toolId: WorkstationControlTool | null,
  options: PlanWorkstationToolUseOptions,
): string | null {
  if (!hasLiveAnswerWorkspaceContext(options)) return null;
  const context = plannerSituationRoomContext(options);
  const explicitGeneric = readPlannerContextString(context, ["source_ref", "sourceRef", "source_id", "sourceId"]);
  if (promptPrefersAudioSource(prompt, toolId)) {
    return readPlannerContextString(context, ["audio_source_ref", "audioSourceRef", "audio_source_id", "audioSourceId"]) ??
      explicitGeneric ??
      "source:audio:active";
  }
  if (promptPrefersVisualSource(prompt, toolId)) {
    return readPlannerContextString(context, ["visual_source_ref", "visualSourceRef", "visual_source_id", "visualSourceId"]) ??
      explicitGeneric ??
      "source:visual:active";
  }
  return explicitGeneric ?? "source:live-answer:active";
}

function inferLiveAnswerTargetRef(
  prompt: string,
  toolId: WorkstationControlTool,
  options: PlanWorkstationToolUseOptions,
): string | null {
  if (!hasLiveAnswerWorkspaceContext(options)) return null;
  const context = plannerSituationRoomContext(options);
  const explicitGeneric = readPlannerContextString(context, ["target_ref", "targetRef", "target_id", "targetId"]);
  if (
    toolId === "live_env.change_workstation_preset" ||
    toolId === "live_env.set_visual_preset" ||
    toolId === "live_env.set_audio_preset"
  ) {
    return explicitGeneric ?? inferLiveAnswerSourceRef(prompt, toolId, options);
  }
  if (toolId === "live_env.bind_workstation_source") {
    if (promptPrefersAudioSource(prompt, toolId)) {
      return readPlannerContextString(context, ["audio_target_ref", "audioTargetRef"]) ?? explicitGeneric ?? "live-answer:audio";
    }
    if (promptPrefersVisualSource(prompt, toolId)) {
      return readPlannerContextString(context, ["visual_target_ref", "visualTargetRef"]) ?? explicitGeneric ?? "live-answer:visual";
    }
    return explicitGeneric ?? "live-answer:desktop";
  }
  return explicitGeneric;
}

function inferLiveAnswerPresetId(
  prompt: string,
  toolId: WorkstationControlTool,
  options: PlanWorkstationToolUseOptions,
): string | null {
  if (!hasLiveAnswerWorkspaceContext(options)) return null;
  const context = plannerSituationRoomContext(options);
  if (toolId === "live_env.set_audio_preset" || promptPrefersAudioSource(prompt, toolId)) {
    return readPlannerContextString(context, ["audio_preset_id", "audioPresetId", "preset_id", "presetId"]) ??
      (/\b(?:translation|translate|earbud|earbuds)\b/i.test(prompt) ? "preset:earbud-translation" : null);
  }
  if (toolId === "live_env.set_visual_preset" || promptPrefersVisualSource(prompt, toolId)) {
    return readPlannerContextString(context, ["visual_preset_id", "visualPresetId", "preset_id", "presetId"]) ??
      (/\b(?:frog|classifier|classification|scientific)\b/i.test(prompt) ? "preset:frog-classifier" : null);
  }
  return readPlannerContextString(context, ["preset_id", "presetId"]);
}

function hasContextualWorkstationGoalContextCue(prompt: string): boolean {
  const object = GOAL_CONTEXT_OBJECT_PATTERN;
  return (
    new RegExp(`["'\`][^"'\`]*(?:${GOAL_CONTEXT_TOOL_PATTERN}|${object})[^"'\`]*["'\`]`, "i").test(prompt) ||
    new RegExp(`\\b(?:if|in\\s+the\\s+future|future|later|eventually|hypothetically|tomorrow|next\\s+time|would|could|might|should)\\b[\\s\\S]{0,140}\\b(?:${GOAL_CONTEXT_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:previously|earlier|last\\s+time|before|already|historically|was|were|had)\\b[\\s\\S]{0,160}\\b(?:queried|started|created|viewed|inspected|showed|listed|checked|read|called|used)?\\b[\\s\\S]{0,120}\\b(?:${GOAL_CONTEXT_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:screen|page|button|label|ui|text|menu|dropdown|document|quote)\\b[\\s\\S]{0,90}\\b(?:says|shows|reads|contains|labeled|labelled|called|named)\\b[\\s\\S]{0,140}\\b(?:${GOAL_CONTEXT_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:do\\s+not|don't|dont|without|not\\s+asking\\s+to|no\\s+need\\s+to|for\\s+now)\\b[\\s\\S]{0,160}\\b(?:query|view|inspect|show|list|check|read|start|create|open|begin|set\\s+up|setup|monitor|use|call)?\\b[\\s\\S]{0,140}\\b(?:${GOAL_CONTEXT_TOOL_PATTERN}|${object})\\b`, "i").test(prompt)
  );
}

const WORKSTATION_CONTROL_OBJECT_PATTERN =
  "(?:workstation\\s+presets?|presets?|sources?|source\\s+bindings?|source\\s+routes?|loops?|loop\\s+state|process\\s+loops?|live\\s+answer\\s+projection|live\\s+answer\\s+line|process\\s+graph(?:\\s+focus)?|stage\\s+play\\s+graph)";
const WORKSTATION_CONTROL_TOOL_PATTERN =
  "(?:live_env\\.)?(?:change_workstation_preset|set_visual_preset|set_audio_preset|bind_workstation_source|bind_source|unbind_workstation_source|unbind_source|pause_workstation_loop|resume_workstation_loop|set_workstation_loop_state|repair_loop|repair_workstation_source|repair_source|update_live_answer_projection|focus_process_graph)";

function hasContextualWorkstationControlCue(prompt: string): boolean {
  const object = WORKSTATION_CONTROL_OBJECT_PATTERN;
  return (
    new RegExp(`["'\`][^"'\`]*(?:${WORKSTATION_CONTROL_TOOL_PATTERN}|${object})[^"'\`]*["'\`]`, "i").test(prompt) ||
    new RegExp(`\\b(?:if|in\\s+the\\s+future|future|later|eventually|hypothetically|tomorrow|next\\s+time|would|could|might|should)\\b[\\s\\S]{0,140}\\b(?:${WORKSTATION_CONTROL_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:previously|earlier|last\\s+time|before|already|historically|was|were|had)\\b[\\s\\S]{0,160}\\b(?:changed|set|applied|bound|unbound|paused|resumed|repaired|focused|updated|called|used)?\\b[\\s\\S]{0,120}\\b(?:${WORKSTATION_CONTROL_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:screen|page|button|label|ui|text|menu|dropdown|document|quote)\\b[\\s\\S]{0,90}\\b(?:says|shows|reads|contains|labeled|labelled|called|named)\\b[\\s\\S]{0,140}\\b(?:${WORKSTATION_CONTROL_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:do\\s+not|don't|dont|without|not\\s+asking\\s+to|no\\s+need\\s+to|for\\s+now)\\b[\\s\\S]{0,160}\\b(?:change|set|apply|bind|unbind|attach|detach|route|pause|resume|repair|focus|update|use|call)?\\b[\\s\\S]{0,140}\\b(?:${WORKSTATION_CONTROL_TOOL_PATTERN}|${object})\\b`, "i").test(prompt)
  );
}

function selectWorkstationControlTool(prompt: string): WorkstationControlTool | null {
  if (hasContextualWorkstationControlCue(prompt)) return null;
  const explicit = prompt.match(/\b(?:live_env\.)?(?:change_workstation_preset|set_visual_preset|set_audio_preset|bind_workstation_source|bind_source|unbind_workstation_source|unbind_source|pause_workstation_loop|resume_workstation_loop|set_workstation_loop_state|repair_loop|repair_workstation_source|repair_source|update_live_answer_projection|focus_process_graph)\b/i)?.[0]?.toLowerCase().replace(/^live_env\./, "");
  if (explicit === "bind_source") return "live_env.bind_workstation_source";
  if (explicit === "unbind_source") return "live_env.unbind_workstation_source";
  if (explicit === "repair_source") return "live_env.repair_workstation_source";
  if (explicit) return `live_env.${explicit}` as WorkstationControlTool;
  if (/\b(?:change|set|apply|switch)\b[\s\S]{0,120}\b(?:workstation\s+)?preset\b/i.test(prompt)) {
    if (/\b(?:audio|earbud|transcript|translation|speech|mic|microphone)\b/i.test(prompt)) {
      return "live_env.set_audio_preset";
    }
    if (/\b(?:visual|screen|image|lens|camera|frame|capture)\b/i.test(prompt)) {
      return "live_env.set_visual_preset";
    }
    return "live_env.change_workstation_preset";
  }
  if (/\b(?:bind|attach|route|connect)\b[\s\S]{0,120}\bsource\b/i.test(prompt)) {
    return "live_env.bind_workstation_source";
  }
  if (/\b(?:unbind|detach|remove|disconnect)\b[\s\S]{0,120}\bsource\b/i.test(prompt)) {
    return "live_env.unbind_workstation_source";
  }
  if (/\bpause\b[\s\S]{0,120}\b(?:loop|process\s+loop|mail\s+loop)\b/i.test(prompt)) {
    return "live_env.pause_workstation_loop";
  }
  if (/\bresume\b[\s\S]{0,120}\b(?:loop|process\s+loop|mail\s+loop)\b/i.test(prompt)) {
    return "live_env.resume_workstation_loop";
  }
  if (/\b(?:repair|restart|set)\b[\s\S]{0,120}\b(?:loop|process\s+loop|mail\s+loop)\b/i.test(prompt)) {
    return "live_env.set_workstation_loop_state";
  }
  if (/\b(?:repair|restart|recover)\b[\s\S]{0,120}\b(?:source|capture|live\s+source|visual\s+source|audio\s+source)\b/i.test(prompt)) {
    return "live_env.repair_workstation_source";
  }
  if (/\b(?:update|set|refresh)\b[\s\S]{0,120}\blive\s+answer\b[\s\S]{0,80}\b(?:projection|line)\b/i.test(prompt)) {
    return "live_env.update_live_answer_projection";
  }
  if (/\b(?:focus|show|select|highlight)\b[\s\S]{0,120}\bprocess\s+graph\b/i.test(prompt)) {
    return "live_env.focus_process_graph";
  }
  return null;
}

function inferLoopState(prompt: string): "paused" | "running" | "repaired" | null {
  if (/\b(?:repair|repaired|restart)\b/i.test(prompt)) return "repaired";
  if (/\b(?:pause|paused|stop)\b/i.test(prompt)) return "paused";
  if (/\b(?:resume|running|run)\b/i.test(prompt)) return "running";
  return null;
}

function workstationControlMissingRequirements(toolId: WorkstationControlTool, args: Record<string, unknown>): string[] {
  const has = (key: string) => typeof args[key] === "string" && String(args[key]).trim().length > 0;
  if (
    toolId === "live_env.change_workstation_preset" ||
    toolId === "live_env.set_visual_preset" ||
    toolId === "live_env.set_audio_preset"
  ) {
    return [
      ...(has("target_ref") ? [] : ["target_ref"]),
      ...(has("preset_id") ? [] : ["preset_id"]),
    ];
  }
  if (toolId === "live_env.bind_workstation_source") {
    return [
      ...(has("source_ref") ? [] : ["source_ref"]),
      ...(has("target_ref") ? [] : ["target_ref"]),
    ];
  }
  if (toolId === "live_env.unbind_workstation_source") return has("source_ref") ? [] : ["source_ref"];
  if (
    toolId === "live_env.pause_workstation_loop" ||
    toolId === "live_env.resume_workstation_loop" ||
    toolId === "live_env.set_workstation_loop_state" ||
    toolId === "live_env.repair_loop"
  ) return has("loop_ref") ? [] : ["loop_ref"];
  if (toolId === "live_env.repair_workstation_source") return has("source_ref") || has("loop_ref") ? [] : ["source_ref|loop_ref"];
  if (toolId === "live_env.update_live_answer_projection") return has("line_key") ? [] : ["line_key"];
  if (toolId === "live_env.focus_process_graph") return has("node_ref") ? [] : ["node_ref"];
  return [];
}

function buildWorkstationControlArgs(
  prompt: string,
  toolId: WorkstationControlTool,
  options: PlanWorkstationToolUseOptions,
): Record<string, unknown> {
  const goalId = extractNamedArg(prompt, ["goal_id", "goal id"]);
  const explicitTargetRef = extractNamedArg(prompt, ["target_ref", "target ref", "target_id", "target id", "panel_id", "panel id"]);
  const explicitSourceRef = extractNamedArg(prompt, ["source_ref", "source ref", "source_id", "source id"]);
  const explicitPresetId = extractNamedArg(prompt, ["preset_id", "preset id", "preset"]);
  const targetRef = isWeakNaturalLanguageArg(explicitTargetRef)
    ? inferLiveAnswerTargetRef(prompt, toolId, options)
    : explicitTargetRef;
  const sourceRef = isWeakNaturalLanguageArg(explicitSourceRef)
    ? inferLiveAnswerSourceRef(prompt, toolId, options)
    : explicitSourceRef;
  const presetId = isWeakNaturalLanguageArg(explicitPresetId)
    ? inferLiveAnswerPresetId(prompt, toolId, options)
    : explicitPresetId;
  const loopRef = extractNamedArg(prompt, ["loop_ref", "loop ref", "loop_id", "loop id"]);
  const lineKey = extractNamedArg(prompt, ["line_key", "line key", "live_answer_line_key", "live answer line key"]);
  const panelId = extractNamedArg(prompt, ["panel_id", "panel id"]);
  const nodeRef = extractNamedArg(prompt, ["node_ref", "node ref", "node_id", "node id"]);
  return {
    ...(goalId ? { goal_id: goalId } : {}),
    ...(targetRef ? { target_ref: targetRef } : {}),
    ...(sourceRef ? { source_ref: sourceRef } : {}),
    ...(presetId ? { preset_id: presetId } : {}),
    ...(loopRef ? { loop_ref: loopRef } : {}),
    ...(lineKey ? { line_key: lineKey } : {}),
    ...(panelId ? { panel_id: panelId } : {}),
    ...(nodeRef ? { node_ref: nodeRef } : {}),
    ...(toolId === "live_env.pause_workstation_loop" ? { state: "paused" } : {}),
    ...(toolId === "live_env.resume_workstation_loop" ? { state: "running" } : {}),
    ...(toolId === "live_env.repair_loop" || toolId === "live_env.repair_workstation_source" ? { state: "repaired" } : {}),
    ...(toolId === "live_env.set_workstation_loop_state" && inferLoopState(prompt) ? { state: inferLoopState(prompt) } : {}),
    reason: "Agent-requested governed workstation control dispatch.",
  };
}

function buildWorkstationControlPlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const toolId = selectWorkstationControlTool(normalized);
  if (!toolId) {
    return {
      intent: "direct_answer",
      action: null,
      tool_plan: null,
      scores,
      should_use_tool: false,
      reason: "No affirmative workstation control command was admitted.",
      missing_required_args: [],
    };
  }
  const args = buildWorkstationControlArgs(normalized, toolId, options);
  const missing = workstationControlMissingRequirements(toolId, args);
  const stepId = toolId.replace(/^live_env\./, "");
  scores.push({
    affordance_id: toolId,
    panel_id: "helix_ask",
    action_id: toolId,
    score: 0.88,
    reason: "affirmative workstation control prompt should prepare a governed receipt and dispatch suggestion",
    required_args_missing: missing,
  });
  return {
    intent: "workstation_control",
    action: null,
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "workstation_control",
      missing,
      options,
      steps: [
        {
          step_id: stepId,
          kind: "run_ask_tool",
          tool_id: toolId,
          args,
          expected_receipt_kind: "stage_play_workstation_control_receipt",
          expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
          required: true,
        },
        {
          step_id: "evaluate_workstation_control_receipt",
          kind: "evaluate_result",
          depends_on: [stepId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    }),
    scores,
    should_use_tool: true,
    reason: "Prompt is an affirmative workstation control command; prepare a non-terminal control receipt before any answer.",
    missing_required_args: missing,
  };
}

const WATCH_JOB_AUTOMATION_OBJECT_PATTERN =
  "(?:live[-\\s]?source\\s+watch\\s+jobs?|watch\\s+jobs?|route[-\\s]?watch\\s+loops?|source\\s+monitors?|live\\s+source\\s+monitors?|workstation\\s+automations?|automation\\s+polic(?:y|ies))";
const WATCH_JOB_AUTOMATION_TOOL_PATTERN = "live_env\\.(?:configure_route_watch|configure_live_source_watch_job)";

function hasContextualWatchJobAutomationCue(prompt: string): boolean {
  const object = WATCH_JOB_AUTOMATION_OBJECT_PATTERN;
  return (
    new RegExp(`["'\`][^"'\`]*(?:${WATCH_JOB_AUTOMATION_TOOL_PATTERN}|${object})[^"'\`]*["'\`]`, "i").test(prompt) ||
    new RegExp(`\\b(?:if|in\\s+the\\s+future|future|later|eventually|hypothetically|tomorrow|next\\s+time|would|could|might|should)\\b[\\s\\S]{0,160}\\b(?:${WATCH_JOB_AUTOMATION_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:previously|earlier|last\\s+time|before|already|historically|was|were|had)\\b[\\s\\S]{0,180}\\b(?:configured|started|created|armed|used|called)?\\b[\\s\\S]{0,140}\\b(?:${WATCH_JOB_AUTOMATION_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:screen|page|button|label|ui|text|menu|dropdown|document|quote)\\b[\\s\\S]{0,100}\\b(?:says|shows|reads|contains|labeled|labelled|called|named)\\b[\\s\\S]{0,160}\\b(?:${WATCH_JOB_AUTOMATION_TOOL_PATTERN}|${object})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:do\\s+not|don't|dont|without|not\\s+asking\\s+to|no\\s+need\\s+to|for\\s+now|not\\s+yet)\\b[\\s\\S]{0,180}\\b(?:configure|set\\s+up|setup|start|create|arm|enable|use|call)?\\b[\\s\\S]{0,160}\\b(?:${WATCH_JOB_AUTOMATION_TOOL_PATTERN}|${object})\\b`, "i").test(prompt)
  );
}

function isWatchJobAutomationPrompt(prompt: string): boolean {
  if (hasContextualWatchJobAutomationCue(prompt)) return false;
  return (
    /\blive_env\.(?:configure_route_watch|configure_live_source_watch_job)\b/i.test(prompt) ||
    /\b(?:configure|set\s+up|setup|start|create|arm|enable)\b[\s\S]{0,160}\b(?:live[-\s]?source\s+watch\s+job|watch\s+job|route[-\s]?watch\s+loop|source\s+monitor|live\s+source\s+monitor|automation\s+policy)\b/i.test(prompt) ||
    /\b(?:watch|monitor|keep\s+(?:watching|checking|tracking))\b[\s\S]{0,120}\b(?:live\s+source|visual\s+source|audio\s+source|translation|screen\s+capture)\b[\s\S]{0,120}\b(?:as|with|through|using)\b[\s\S]{0,80}\b(?:automation|watch\s+job|route[-\s]?watch)\b/i.test(prompt)
  );
}

function watchJobAutomationToolId(prompt: string): "live_env.configure_route_watch" | "live_env.configure_live_source_watch_job" {
  return /\blive_env\.configure_route_watch\b/i.test(prompt)
    ? "live_env.configure_route_watch"
    : "live_env.configure_live_source_watch_job";
}

function buildWatchJobAutomationArgs(prompt: string, options: PlanWorkstationToolUseOptions): Record<string, unknown> {
  const sourceId = extractNamedArg(prompt, ["source_id", "source id", "source_ref", "source ref"]);
  const roomId = extractNamedArg(prompt, ["room_id", "room id"]);
  const environmentId = extractNamedArg(prompt, ["environment_id", "environment id"]);
  const goalId = extractNamedArg(prompt, ["goal_id", "goal id", "agent_goal_id", "agent goal id"]);
  const objective =
    extractNamedTextArg(prompt, ["objective", "objective_text", "objective text", "goal"]) ??
    extractQuoted(prompt) ??
    stripOuterPunctuation(prompt);
  const decisionPolicyPrompt =
    extractNamedTextArg(prompt, ["decision_policy_prompt", "decision policy prompt", "policy", "decision policy"]) ??
    "Record route-watch context for new source mail; keep receipts evidence-only and require terminal authority for final answers.";
  return {
    ...(goalId ? { goal_id: goalId } : {}),
    ...(roomId ? { room_id: roomId } : {}),
    ...(environmentId ? { environment_id: environmentId } : {}),
    ...(sourceId ? { source_id: sourceId } : {}),
    objective,
    decision_policy_prompt: decisionPolicyPrompt,
    evidence_refs: Array.from(new Set([options.turnId ?? null, sourceId ?? null].filter((entry): entry is string => Boolean(entry)))),
  };
}

function buildWatchJobAutomationPlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const args = buildWatchJobAutomationArgs(normalized, options);
  const toolId = watchJobAutomationToolId(normalized);
  const stepId = toolId === "live_env.configure_route_watch" ? "configure_route_watch" : "configure_live_source_watch_job";
  scores.push({
    affordance_id: toolId,
    panel_id: "helix_ask",
    action_id: toolId,
    score: 0.9,
    reason: "affirmative watch-job automation prompt should configure a deterministic route-watch policy and record goal context",
    required_args_missing: [],
  });
  return {
    intent: "workstation_goal_context",
    action: null,
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "workstation_goal_context",
      missing: [],
      options,
      steps: [
        {
          step_id: stepId,
          kind: "run_ask_tool",
          tool_id: toolId,
          args,
          expected_receipt_kind: "stage_play_live_source_watch_job_policy_config_result",
          expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
          required: true,
        },
        {
          step_id: "evaluate_live_source_watch_job_policy",
          kind: "evaluate_result",
          depends_on: [stepId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    }),
    scores,
    should_use_tool: true,
    reason: "Prompt asks to configure a deterministic live-source watch job; create a non-terminal route-watch receipt before any answer.",
    missing_required_args: [],
  };
}

function wantsStartAgentGoalSession(prompt: string): boolean {
  const contextPrompt = prompt.replace(/\bobjective\s*=\s*["'`][^"'`]+["'`]/gi, "objective=<objective>");
  if (hasContextualWorkstationGoalContextCue(contextPrompt)) return false;
  if (/\b(?:write|draft|explain|describe|define)\b[\s\S]{0,80}\b(?:goal|goal\s+statement|project\s+goal)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\blive_env\.start_agent_goal_session\b/i.test(prompt) ||
    /\b(?:start|create|open|begin|set\s+up|setup|launch|track|monitor)\b[\s\S]{0,160}\b(?:agent\s+goal\s+session|goal\s+session|durable\s+goal|goal-directed\s+(?:monitor|session)|standing\s+agent\s+goal|agent\s+objective)\b/i.test(prompt) ||
    /\b(?:start|create|begin|set\s+up|setup|launch)\s+(?:an?\s+)?(?:agent\s+)?goal\b[\s\S]{0,120}\b(?:to|for|objective|with\s+objective|work\s+until|monitor|track|refactor|implement|test|debug|fix|wire|build)\b/i.test(prompt) ||
    /\b(?:monitor|keep\s+(?:watching|checking|tracking)|continue\s+(?:watching|checking|tracking))\b[\s\S]{0,180}\b(?:goal\s+context|trace\s+memory|packet\s+traces?|live\s+source|visual\s+capture|audio\s+capture|translation|micro[-\s]?deck)\b/i.test(prompt)
  );
}

function wantsQueryWorkstationGoalContext(prompt: string): boolean {
  if (hasContextualWorkstationGoalContextCue(prompt)) return false;
  return (
    /\blive_env\.query_workstation_goal_context\b/i.test(prompt) ||
    new RegExp(`\\b(?:${GOAL_CONTEXT_FEED_QUERY_TOOL_PATTERN})\\b`, "i").test(prompt) ||
    new RegExp(`\\b(?:query|view|inspect|show|list|get|check|read|retrieve|summari[sz]e|which|what|where)\\b[\\s\\S]{0,140}\\b${GOAL_CONTEXT_OBJECT_PATTERN}\\b`, "i").test(prompt) ||
    new RegExp(`\\b${GOAL_CONTEXT_OBJECT_PATTERN}\\b[\\s\\S]{0,140}\\b(?:query|view|inspect|show|list|get|check|read|retrieve|latest|active|available|known)\\b`, "i").test(prompt)
  );
}

function wantsTraceMemoryQuery(prompt: string): boolean {
  if (hasContextualWorkstationGoalContextCue(prompt)) return false;
  return (
    /\blive_env\.query_trace_memory\b/i.test(prompt) ||
    /\b(?:query|view|inspect|show|list|get|check|read|retrieve|summari[sz]e)\b[\s\S]{0,140}\b(?:trace\s+memory|reasoning\s+traces?|proof\s+recall\s+traces?|workstation\s+reasoning\s+traces?)\b/i.test(prompt) ||
    /\b(?:trace\s+memory|reasoning\s+traces?|proof\s+recall\s+traces?|workstation\s+reasoning\s+traces?)\b[\s\S]{0,140}\b(?:query|view|inspect|show|list|get|check|read|retrieve|latest|available|known)\b/i.test(prompt)
  );
}

function wantsGoalSatisfactionEvaluation(prompt: string): boolean {
  if (hasContextualWorkstationGoalContextCue(prompt)) return false;
  return (
    /\blive_env\.evaluate_goal_satisfaction\b/i.test(prompt) ||
    /\b(?:evaluate|check|inspect|assess|verify|determine)\b[\s\S]{0,120}\b(?:goal\s+satisfaction|whether\s+(?:the\s+)?goal\s+is\s+satisfied|final\s+report\s+readiness|terminal\s+authority\s+readiness)\b/i.test(prompt) ||
    /\b(?:is|are|was)\b[\s\S]{0,80}\b(?:goal|objective)\b[\s\S]{0,80}\b(?:satisfied|complete|ready\s+for\s+(?:a\s+)?final\s+report)\b/i.test(prompt) ||
    /\b(?:enough|sufficient)\b[\s\S]{0,80}\b(?:goal\s+context|evidence|receipts?|updates?)\b[\s\S]{0,100}\b(?:final\s+report|terminal\s+authority|complete\s+the\s+goal)\b/i.test(prompt)
  );
}

function selectWorkstationContextFeedTool(prompt: string): WorkstationContextFeedTool | null {
  if (hasContextualWorkstationGoalContextCue(prompt)) return null;
  const explicit = prompt.match(new RegExp(`\\b(?:${GOAL_CONTEXT_NON_TRACE_FEED_QUERY_TOOL_PATTERN})\\b`, "i"))?.[0]?.toLowerCase();
  if (explicit) return explicit as WorkstationContextFeedTool;
  if (/\blive_env\.query_packet_traces\b/i.test(prompt) || /\b(?:per[-\s]?packet\s+traces?|packet\s+traces?|packet\s+causal\s+traces?)\b/i.test(prompt)) {
    return "live_env.query_packet_traces";
  }
  if (/\blive_env\.query_visual_summaries\b/i.test(prompt) || /\bvisual\s+summaries\b/i.test(prompt)) {
    return "live_env.query_visual_summaries";
  }
  if (/\blive_env\.query_audio_transcripts\b/i.test(prompt) || /\baudio\s+transcripts?\b/i.test(prompt)) {
    return "live_env.query_audio_transcripts";
  }
  if (/\blive_env\.query_narrator_events\b/i.test(prompt) || /\b(?:narrator\s+events?|narrator\s+bindings?|narrator\s+streams?)\b/i.test(prompt)) {
    return "live_env.query_narrator_events";
  }
  if (
    /\blive_env\.query_translation_segments\b/i.test(prompt) ||
    /\b(?:translation\s+segments?|translated\s+transcripts?)\b/i.test(prompt)
  ) {
    return "live_env.query_translation_segments";
  }
  if (/\blive_env\.query_microdeck_outputs\b/i.test(prompt) || /\bmicro[-\s]?deck\s+outputs?\b/i.test(prompt)) {
    return "live_env.query_microdeck_outputs";
  }
  if (/\blive_env\.query_live_answer_state\b/i.test(prompt) || /\blive\s+answer\s+(?:state|lines?)\b/i.test(prompt)) {
    return "live_env.query_live_answer_state";
  }
  if (/\blive_env\.query_source_health\b/i.test(prompt) || /\b(?:source\s+health|source\s+status|source\s+capability\s+state)\b/i.test(prompt)) {
    return "live_env.query_source_health";
  }
  if (/\blive_env\.query_route_evidence\b/i.test(prompt) || /\b(?:route\s+evidence|route[-\s]?watch\s+evidence|route[-\s]?watch\s+updates?)\b/i.test(prompt)) {
    return "live_env.query_route_evidence";
  }
  if (/\blive_env\.query_automation_policies\b/i.test(prompt) || /\b(?:automation\s+polic(?:y|ies)|workstation\s+automations?)\b/i.test(prompt)) {
    return "live_env.query_automation_policies";
  }
  return null;
}

function splitPlannerListArg(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,\s]+/g)
    .map((entry) => stripOuterPunctuation(entry))
    .filter(Boolean)
    .slice(0, 12);
}

function extractNamedListArg(prompt: string, names: string[]): string[] {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const quoted = prompt.match(new RegExp(`\\b${escaped}\\b\\s*(?::|=)?\\s*(?:"([^"]+)"|'([^']+)')`, "i"));
    const quotedValue = quoted?.[1] ?? quoted?.[2];
    if (quotedValue) return splitPlannerListArg(quotedValue);
    const bare = prompt.match(new RegExp(
      `\\b${escaped}\\b\\s*(?::|=)\\s*([^.;]+?)(?=\\s+[a-z_ ]+\\s*(?::|=)|[.;]|$)`,
      "i",
    ))?.[1];
    const parsed = splitPlannerListArg(bare ?? null);
    if (parsed.length > 0) return parsed;
  }
  return [];
}

function expectedReceiptKindForWorkstationContextFeedTool(toolId: WorkstationContextFeedTool): string {
  return workstationContextFeedQuerySpecForCapability(toolId)?.plannerExpectedReceiptKind ??
    "stage_play_workstation_context_feed_query_result";
}

function extractGoalContextFreshnessStatus(prompt: string): "fresh" | "stale" | "blocked" | "unknown" | null {
  if (/\b(?:stale|expired|outdated|old)\b[\s\S]{0,140}\b(?:goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b/i.test(prompt)) {
    return "stale";
  }
  if (/\b(?:goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b[\s\S]{0,140}\b(?:stale|expired|outdated|old)\b/i.test(prompt)) {
    return "stale";
  }
  if (/\b(?:blocked|failed|unavailable|insufficient)\b[\s\S]{0,140}\b(?:goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b/i.test(prompt)) {
    return "blocked";
  }
  if (/\b(?:goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b[\s\S]{0,140}\b(?:blocked|failed|unavailable|insufficient)\b/i.test(prompt)) {
    return "blocked";
  }
  if (/\b(?:unknown|uncertain|unclassified)\b[\s\S]{0,140}\b(?:freshness|goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b/i.test(prompt)) {
    return "unknown";
  }
  if (/\b(?:fresh|current|latest|active|recent)\b[\s\S]{0,140}\b(?:goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b/i.test(prompt)) {
    return "fresh";
  }
  if (/\b(?:goal\s+context|visual\s+summaries|audio\s+transcripts?|translation\s+segments?|micro[-\s]?deck\s+outputs?|live\s+answer\s+state|source\s+health|trace\s+memory|route\s+evidence|automation\s+polic(?:y|ies))\b[\s\S]{0,140}\b(?:fresh|current|latest|active|recent)\b/i.test(prompt)) {
    return "fresh";
  }
  return null;
}

function normalizeGoalContextFeedKindForPlanner(value: unknown): AgentGoalContextFeedKindV1 | null {
  const normalized = typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    : "";
  if (!normalized) return null;
  for (const spec of WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS) {
    if (
      spec.feedKind === normalized ||
      spec.capability.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") === normalized ||
      spec.aliases.some((alias) =>
        alias.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") === normalized
      )
    ) {
      return spec.feedKind;
    }
  }
  return null;
}

function workstationGoalAliasPattern(value: string): string {
  return value
    .trim()
    .split(/[_\s-]+/g)
    .map(escapeRegex)
    .filter(Boolean)
    .join("[_\\s-]*");
}

function extractGoalContextFeedKindFilter(prompt: string): AgentGoalContextFeedKindV1 | null {
  const explicit = extractNamedArg(prompt, [
    "context_feed_kind",
    "context feed kind",
    "feed_kind",
    "feed kind",
    "context_feed",
    "context feed",
  ]);
  const explicitFeed = normalizeGoalContextFeedKindForPlanner(explicit);
  if (explicitFeed) return explicitFeed;
  for (const spec of WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS) {
    const aliases = [spec.feedKind, spec.label, ...spec.aliases]
      .map(workstationGoalAliasPattern)
      .filter(Boolean);
    const aliasPattern = aliases.join("|");
    if (
      new RegExp(`\\b(?:context\\s+feed|feed|goal\\s+session|agent\\s+goal\\s+session)s?\\b[\\s\\S]{0,120}\\b(?:${aliasPattern})\\b`, "i").test(prompt) ||
      new RegExp(`\\b(?:${aliasPattern})\\b[\\s\\S]{0,120}\\b(?:context\\s+feed|feed|goal\\s+session|agent\\s+goal\\s+session)s?\\b`, "i").test(prompt)
    ) {
      return spec.feedKind;
    }
  }
  return null;
}

function extractGoalContextAllowedActuatorFilter(prompt: string): AgentGoalActuatorV1 | null {
  const explicit = extractNamedArg(prompt, [
    "allowed_actuator",
    "allowed actuator",
    "actuator",
    "control_actuator",
    "control actuator",
  ]);
  const explicitActuator = normalizeAgentGoalActuatorV1(explicit);
  if (explicitActuator) return explicitActuator;
  for (const actuator of WORKSTATION_AGENT_GOAL_ACTUATORS) {
    const alias = workstationGoalAliasPattern(actuator);
    if (
      new RegExp(`\\b(?:allowed\\s+actuator|actuator|can\\s+(?:use|run|call)|allowed\\s+to\\s+(?:use|run|call))\\b[\\s\\S]{0,120}\\b${alias}\\b`, "i").test(prompt) ||
      new RegExp(`\\b${alias}\\b[\\s\\S]{0,120}\\b(?:allowed\\s+actuator|actuator|goal\\s+session|agent\\s+goal\\s+session)\\b`, "i").test(prompt)
    ) {
      return actuator;
    }
  }
  return null;
}

function extractGoalContextObjective(prompt: string): string {
  const explicit =
    extractNamedArg(prompt, ["objective", "goal", "goal objective"]) ??
    prompt.match(/\b(?:so|to|for)\s+(.{12,220})$/i)?.[1]?.trim();
  return stripOuterPunctuation(explicit ?? prompt).slice(0, 280) || "Monitor workstation goal context from live source evidence.";
}

function wantsGoalSessionNarratorBinding(prompt: string): boolean {
  return (
    /\b(?:turn\s+on|enable|bind|route|attach)\b[\s\S]{0,120}\b(?:narrator|narration|read[-\s]?aloud)\b/i.test(prompt) ||
    /\b(?:narrator|narration|read[-\s]?aloud)\b[\s\S]{0,120}\b(?:translation|translated\s+transcript|audio\s+transcript|live\s+answer|goal\s+context|source\s+health|route\s+evidence)\b/i.test(prompt)
  );
}

function wantsGoalSessionGraphFocus(prompt: string): boolean {
  return /\b(?:focus|show|select|highlight|open)\b[\s\S]{0,140}\b(?:process\s+graph|stage\s+play\s+graph|reasoning\s+circuit|packet\s+trace)\b/i.test(prompt);
}

function pushGoalSessionSetupControlStep(input: {
  steps: HelixWorkstationToolPlanStep[];
  stepIds: string[];
  scores: AffordanceScore[];
  stepId: string;
  toolId: WorkstationControlTool;
  args: Record<string, unknown>;
  reason: string;
}): void {
  input.stepIds.push(input.stepId);
  input.steps.push({
    step_id: input.stepId,
    kind: "run_ask_tool",
    tool_id: input.toolId,
    args: input.args,
    depends_on: ["start_agent_goal_session"],
    expected_receipt_kind: "stage_play_workstation_control_receipt",
    expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
    required: true,
  });
  input.scores.push({
    affordance_id: input.toolId,
    panel_id: "helix_ask",
    action_id: input.toolId,
    score: 0.86,
    reason: input.reason,
    required_args_missing: [],
  });
}

function buildWorkstationGoalContextPlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const startSession = wantsStartAgentGoalSession(normalized);
  const contextFeedKindFilter = extractGoalContextFeedKindFilter(normalized);
  const allowedActuatorFilter = extractGoalContextAllowedActuatorFilter(normalized);
  const hasSessionFilters = Boolean(contextFeedKindFilter || allowedActuatorFilter);
  const traceMemory = !startSession && !hasSessionFilters && wantsTraceMemoryQuery(normalized);
  const feedTool = !startSession && !traceMemory && !hasSessionFilters ? selectWorkstationContextFeedTool(normalized) : null;
  const threadId = options.threadId ?? "helix-ask:desktop";
  const objective = extractGoalContextObjective(normalized);
  const explicitSourceId = extractNamedArg(normalized, ["source_id", "source id", "source_ref", "source ref"]);
  const sourceId = isWeakNaturalLanguageArg(explicitSourceId)
    ? inferLiveAnswerSourceRef(normalized, null, options)
    : explicitSourceId;
  const freshnessStatus = extractGoalContextFreshnessStatus(normalized);
  const goalId =
    extractNamedArg(normalized, ["goal_id", "goal id"]) ??
    `goal:workstation-context:${(options.turnId ?? Date.now()).toString().replace(/[^a-z0-9_-]+/gi, "_")}`;
  const queryArgs = {
    thread_id: threadId,
    ...(sourceId ? { source_id: sourceId, source_ref: sourceId } : {}),
    ...(freshnessStatus ? { freshness_status: freshnessStatus } : {}),
    ...(contextFeedKindFilter ? { context_feed_kind: contextFeedKindFilter } : {}),
    ...(allowedActuatorFilter ? { allowed_actuator: allowedActuatorFilter } : {}),
    limit: 40,
  };
  const traceQueryArgs = {
    thread_id: threadId,
    goal_id: extractNamedArg(normalized, ["goal_id", "goal id"]) ?? undefined,
    trace_id: extractNamedArg(normalized, ["trace_id", "trace id"]) ?? undefined,
    turn_id: extractNamedArg(normalized, ["turn_id", "turn id"]) ?? undefined,
    limit: 12,
  };
  const feedQueryArgs = {
    ...queryArgs,
    goal_id: extractNamedArg(normalized, ["goal_id", "goal id"]) ?? undefined,
    limit: 24,
  };
  const postSessionControlSteps: HelixWorkstationToolPlanStep[] = [];
  const postSessionControlStepIds: string[] = [];
  if (startSession) {
    const presetToolId = /\b(?:audio|earbud|transcript|translation|speech|mic|microphone)\b/i.test(normalized)
      ? "live_env.set_audio_preset" as const
      : /\b(?:visual|screen|image|lens|camera|frame|capture|frog|classifier|classification|shade)\b/i.test(normalized)
        ? "live_env.set_visual_preset" as const
        : "live_env.change_workstation_preset" as const;
    const explicitTargetRef = extractNamedArg(normalized, ["target_ref", "target ref", "target_id", "target id"]);
    const explicitPresetId = extractNamedArg(normalized, ["preset_id", "preset id", "preset"]);
    const targetRef = isWeakNaturalLanguageArg(explicitTargetRef)
      ? inferLiveAnswerTargetRef(normalized, presetToolId, options)
      : explicitTargetRef;
    const presetId = isWeakNaturalLanguageArg(explicitPresetId)
      ? inferLiveAnswerPresetId(normalized, presetToolId, options)
      : explicitPresetId;
    const explicitBindSourceRef = extractNamedArg(normalized, ["bind_source_ref", "bind source ref", "source_ref", "source ref", "source_id", "source id"]);
    const explicitBindTargetRef = extractNamedArg(normalized, ["bind_target_ref", "bind target ref", "target_ref", "target ref", "target_id", "target id"]);
    const bindSourceRef = isWeakNaturalLanguageArg(explicitBindSourceRef)
      ? inferLiveAnswerSourceRef(normalized, "live_env.bind_workstation_source", options)
      : explicitBindSourceRef;
    const bindTargetRef = isWeakNaturalLanguageArg(explicitBindTargetRef)
      ? inferLiveAnswerTargetRef(normalized, "live_env.bind_workstation_source", options)
      : explicitBindTargetRef;
    const lineKey = extractNamedArg(normalized, ["line_key", "line key", "live_answer_line_key", "live answer line key"]);
    const loopRef = extractNamedArg(normalized, ["loop_ref", "loop ref", "loop_id", "loop id"]);
    const requestedLoopState = inferLoopState(normalized);
    if (targetRef && presetId && /\b(?:preset|shade|classifier|deck)\b/i.test(normalized)) {
      pushGoalSessionSetupControlStep({
        steps: postSessionControlSteps,
        stepIds: postSessionControlStepIds,
        scores,
        stepId: presetToolId.replace(/^live_env\./, ""),
        toolId: presetToolId,
        args: {
          goal_id: goalId,
          target_ref: targetRef,
          preset_id: presetId,
          reason: "Apply requested workstation preset as part of goal-session setup.",
        },
        reason: "goal-session setup prompt also asks to apply a workstation preset",
      });
    }
    if (bindSourceRef && bindTargetRef && /\b(?:bind|attach|route|connect)\b[\s\S]{0,120}\bsource\b/i.test(normalized)) {
      pushGoalSessionSetupControlStep({
        steps: postSessionControlSteps,
        stepIds: postSessionControlStepIds,
        scores,
        stepId: "bind_workstation_source",
        toolId: "live_env.bind_workstation_source",
        args: {
          goal_id: goalId,
          source_ref: bindSourceRef,
          target_ref: bindTargetRef,
          reason: "Bind requested source to workstation target as part of goal-session setup.",
        },
        reason: "goal-session setup prompt also asks to bind a source to a workstation target",
      });
    }
    if (lineKey && /\blive\s+answer\b[\s\S]{0,120}\b(?:projection|line|output|state)\b/i.test(normalized)) {
      pushGoalSessionSetupControlStep({
        steps: postSessionControlSteps,
        stepIds: postSessionControlStepIds,
        scores,
        stepId: "update_live_answer_projection",
        toolId: "live_env.update_live_answer_projection",
        args: {
          goal_id: goalId,
          line_key: lineKey,
          reason: "Update requested Live Answer projection as part of goal-session setup.",
        },
        reason: "goal-session setup prompt also asks to update a Live Answer projection",
      });
    }
    if (loopRef && requestedLoopState && /\b(?:loop|process\s+loop|mail\s+loop)\b/i.test(normalized)) {
      const toolId = requestedLoopState === "repaired" ? "live_env.repair_loop" as const : "live_env.set_workstation_loop_state" as const;
      pushGoalSessionSetupControlStep({
        steps: postSessionControlSteps,
        stepIds: postSessionControlStepIds,
        scores,
        stepId: requestedLoopState === "repaired" ? "repair_loop" : "set_workstation_loop_state",
        toolId,
        args: {
          goal_id: goalId,
          loop_ref: loopRef,
          state: requestedLoopState,
          reason: "Set requested process-loop state as part of goal-session setup.",
        },
        reason: "goal-session setup prompt also asks to control a workstation process loop",
      });
    }
  }
  if (startSession && wantsGoalSessionNarratorBinding(normalized)) {
    const streamKind = inferNarratorStreamKind(normalized);
    const sourceRef = sourceId ?? extractNamedArg(normalized, ["source_ref", "source ref"]) ?? defaultNarratorSourceRef(streamKind);
    const stepId = "bind_narrator_stream";
    postSessionControlStepIds.push(stepId);
    postSessionControlSteps.push({
      step_id: stepId,
      kind: "run_ask_tool",
      tool_id: "live_env.narrator_bind_stream",
      args: {
        goal_id: goalId,
        source_ref: sourceRef,
        stream_kind: streamKind,
        delivery_mode: extractNamedArg(normalized, ["delivery_mode", "delivery mode"]) ?? "visible_only",
        voice_policy: extractNamedArg(normalized, ["voice_policy", "voice policy"]) ?? "confirm_speak_required",
      },
      depends_on: ["start_agent_goal_session"],
      expected_receipt_kind: "helix.narrator_bind_stream_request.v1",
      expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
      required: true,
    });
    scores.push({
      affordance_id: "live_env.narrator_bind_stream",
      panel_id: "helix_ask",
      action_id: "live_env.narrator_bind_stream",
      score: 0.89,
      reason: "goal-session setup prompt also asks to bind Narrator to a live workstation stream",
      required_args_missing: [],
    });
  }
  if (startSession && wantsGoalSessionGraphFocus(normalized)) {
    const stepId = "focus_process_graph";
    postSessionControlStepIds.push(stepId);
    postSessionControlSteps.push({
      step_id: stepId,
      kind: "run_ask_tool",
      tool_id: "live_env.focus_process_graph",
      args: {
        goal_id: goalId,
        node_ref: extractNamedArg(normalized, ["node_ref", "node ref", "node_id", "node id"]) ?? sourceId ?? goalId,
        reason: "Focus the Stage Play process graph on the active goal session circuit.",
      },
      depends_on: ["start_agent_goal_session"],
      expected_receipt_kind: "stage_play_workstation_control_receipt",
      expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
      required: true,
    });
    scores.push({
      affordance_id: "live_env.focus_process_graph",
      panel_id: "helix_ask",
      action_id: "live_env.focus_process_graph",
      score: 0.87,
      reason: "goal-session setup prompt also asks to focus the Stage Play reasoning circuit",
      required_args_missing: [],
    });
  }
  const sessionArgs = {
    ...queryArgs,
    goal_id: goalId,
    objective,
    ...(sourceId ? { source_refs: [sourceId] } : {}),
    context_feeds: WORKSTATION_AGENT_GOAL_DEFAULT_CONTEXT_FEEDS.map((feed) => ({
      source_kind: feed.sourceKind,
      freshness_ms: feed.freshnessMs,
      relevance_policy: feed.relevancePolicy,
    })),
    allowed_actuators: [...WORKSTATION_AGENT_GOAL_ACTUATORS],
    cadence: /\b(?:continuous|continuously|ongoing|keep\s+(?:watching|checking|tracking)|monitor)\b/i.test(normalized)
      ? { kind: "event_accumulation", min_updates: 2 }
      : { kind: "user_turn_only" },
    stop_conditions: [
      "User stops monitoring",
      "Source feed ends or becomes unavailable",
      "Terminal authority produces a final report",
    ],
    checkpoint: {
      summary: "Goal session started with explicit workstation context feeds and governed actuators.",
      actions_taken: ["start_agent_goal_session"],
      next_step: "continue",
    },
  };
  const steps: HelixWorkstationToolPlanStep[] = [
    ...(startSession
      ? [{
          step_id: "start_agent_goal_session",
          kind: "run_ask_tool" as const,
          tool_id: "live_env.start_agent_goal_session",
          args: sessionArgs,
          expected_receipt_kind: "stage_play_agent_goal_session_tool_result",
          expected_state_change: { store: "stage-play-goal-context", proof_key: "agentGoalSessions" },
          required: true,
        }]
      : []),
    ...postSessionControlSteps,
    {
      step_id: traceMemory
        ? "query_trace_memory"
        : feedTool
          ? feedTool.replace(/^live_env\.query_/, "query_")
          : "query_workstation_goal_context",
      kind: "run_ask_tool",
      tool_id: traceMemory ? "live_env.query_trace_memory" : feedTool ?? "live_env.query_workstation_goal_context",
      args: traceMemory ? traceQueryArgs : feedTool ? feedQueryArgs : startSession ? { ...queryArgs, goal_id: goalId } : queryArgs,
      depends_on: startSession ? ["start_agent_goal_session", ...postSessionControlStepIds] : [],
      expected_receipt_kind: traceMemory
        ? "helix.workstation_reasoning_trace_query_result"
        : feedTool
          ? expectedReceiptKindForWorkstationContextFeedTool(feedTool)
          : "stage_play_workstation_goal_context_read_result",
      expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
      required: true,
    },
    {
      step_id: "evaluate_workstation_goal_context",
      kind: "evaluate_result",
      depends_on: [
        traceMemory
          ? "query_trace_memory"
          : feedTool
            ? feedTool.replace(/^live_env\.query_/, "query_")
            : "query_workstation_goal_context",
      ],
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    },
  ];
  scores.push({
    affordance_id: startSession
      ? "live_env.start_agent_goal_session"
      : traceMemory
        ? "live_env.query_trace_memory"
        : feedTool ?? "live_env.query_workstation_goal_context",
    panel_id: "helix_ask",
    action_id: startSession
      ? "live_env.start_agent_goal_session"
      : traceMemory
        ? "live_env.query_trace_memory"
        : feedTool ?? "live_env.query_workstation_goal_context",
    score: startSession ? 0.93 : 0.9,
    reason: startSession
      ? "affirmative goal-session prompt should create a durable agent goal record and then query non-terminal context"
      : traceMemory
        ? "trace-memory prompt should read compact workstation reasoning traces as non-terminal evidence"
        : feedTool
          ? "feed-specific prompt should read the requested workstation context feed as non-terminal evidence"
        : "goal-context inspection prompt should read workstation context updates as evidence",
    required_args_missing: [],
  });
  return {
    intent: "workstation_goal_context",
    action: null,
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "workstation_goal_context",
      missing: [],
      options,
      steps,
    }),
    scores,
    should_use_tool: true,
    reason: startSession
      ? "Prompt asks the agent to pursue a durable workstation goal; start a goal session, then query goal-context evidence before any answer."
      : traceMemory
        ? "Prompt asks for trace memory; query compact workstation reasoning traces before any answer."
        : feedTool
          ? "Prompt asks for a specific workstation context feed; query that feed before any answer."
      : "Prompt asks for workstation goal-context or packet trace evidence; query the goal-context feed before any answer.",
    missing_required_args: [],
  };
}

function buildGoalSatisfactionEvaluationPlan(
  normalized: string,
  options: PlanWorkstationToolUseOptions,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  const threadId = options.threadId ?? "helix-ask:desktop";
  const goalId =
    extractNamedArg(normalized, ["goal_id", "goal id"]) ??
    `goal:workstation-context:${(options.turnId ?? Date.now()).toString().replace(/[^a-z0-9_-]+/gi, "_")}`;
  const sourceId = extractNamedArg(normalized, ["source_id", "source id", "source_ref", "source ref"]);
  const evidenceRefs = extractNamedListArg(normalized, ["evidence_refs", "evidence refs", "evidence"]);
  const steps: HelixWorkstationToolPlanStep[] = [
    {
      step_id: "evaluate_goal_satisfaction",
      kind: "run_ask_tool",
      tool_id: "live_env.evaluate_goal_satisfaction",
      args: {
        thread_id: threadId,
        goal_id: goalId,
        ...(sourceId ? { source_id: sourceId, source_ref: sourceId } : {}),
        ...(evidenceRefs.length > 0 ? { evidence_refs: evidenceRefs } : {}),
        reason: "Evaluate current workstation goal context as non-terminal evidence before any final report.",
      },
      expected_receipt_kind: "helix.live_environment_goal_satisfaction.v1",
      expected_state_change: { store: "stage-play-goal-context", proof_key: "goalContextUpdates" },
      required: true,
    },
    {
      step_id: "evaluate_goal_satisfaction_receipt",
      kind: "evaluate_result",
      depends_on: ["evaluate_goal_satisfaction"],
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    },
  ];
  scores.push({
    affordance_id: "live_env.evaluate_goal_satisfaction",
    panel_id: "helix_ask",
    action_id: "live_env.evaluate_goal_satisfaction",
    score: 0.9,
    reason: "affirmative goal-satisfaction prompt should evaluate non-terminal workstation evidence before any final report",
    required_args_missing: [],
  });
  return {
    intent: "workstation_goal_context",
    action: null,
    tool_plan: buildToolPlan({
      prompt: normalized,
      intent: "workstation_goal_context",
      missing: [],
      options,
      steps,
    }),
    scores,
    should_use_tool: true,
    reason: "Prompt asks whether the active goal is satisfied; evaluate goal-context evidence without creating answer authority.",
    missing_required_args: [],
  };
}

function retiredSituationRoomToolResult(
  reason: string,
  scores: AffordanceScore[],
): WorkstationToolPlannerResult {
  return {
    intent: "direct_answer",
    action: null,
    tool_plan: null,
    scores,
    should_use_tool: false,
    reason,
    missing_required_args: [],
  };
}

function makeTheoryReflectionAskToolStep(prompt: string): HelixWorkstationToolPlanStep {
  return {
    step_id: "reflect_theory_context",
    kind: "run_ask_tool",
    tool_id: "helix_ask.reflect_theory_context",
    args: {
      prompt,
      build_explanation_plan: true,
      sync_panel: true,
      panel_overlay_mode: "live_answer_context",
      open_panel: false,
    },
    expected_receipt_kind: "helix_theory_context_reflection_tool_receipt",
    expected_state_change: { store: "theory-map-overlay", proof_key: "lastReflectionArtifact" },
    required: true,
  };
}

function makeMoralGraphReflectionAskToolStep(prompt: string): HelixWorkstationToolPlanStep {
  return {
    step_id: "reflect_moral_graph_context",
    kind: "run_ask_tool",
    tool_id: "helix_ask.reflect_ideology_context",
    args: {
      inputKind: "user_prompt",
      text: prompt,
      refs: ["helix-ask:current-turn"],
      options: {
        includeOverlay: true,
        includeRecommendedActions: true,
        includeAdmissionArtifacts: true,
        includeLocator: true,
        includeFruition: true,
        includeProceduralClassification: true,
      },
    },
    expected_receipt_kind: "helix_moral_graph_reflection_tool_result",
    expected_state_change: { store: "moral-graph", proof_key: "locator" },
    required: true,
  };
}

function makeMoralLivingSubstrateReflectionAskToolStep(
  prompt: string,
  depends_on: string[] = [],
): HelixWorkstationToolPlanStep {
  return {
    step_id: "reflect_moral_living_substrate_context",
    kind: "run_ask_tool",
    tool_id: "moral-graph.reflect_living_substrate_context",
    args: {
      prompt,
      refs: ["helix-ask:current-turn"],
      include_theory_bridge: true,
      include_recommended_actions: true,
    },
    depends_on,
    expected_receipt_kind: "moral_living_substrate_reflection",
    expected_state_change: { store: "moral-graph", proof_key: "livingSubstrateReflection" },
    required: true,
  };
}

function makeTheoryIdeologyBridgeAskToolStep(prompt: string): HelixWorkstationToolPlanStep {
  return {
    step_id: "bridge_theory_ideology_context",
    kind: "run_ask_tool",
    tool_id: "helix_ask.bridge_theory_ideology_context",
    args: {
      prompt,
      refs: ["helix-ask:current-turn"],
      theory_reflection_ref: "step:reflect_theory_context",
      ideology_reflection_ref: "step:reflect_moral_graph_context",
    },
    depends_on: ["reflect_theory_context", "reflect_moral_graph_context"],
    expected_receipt_kind: "helix_theory_ideology_bridge_tool_result",
    expected_state_change: {
      store: "theory-ideology-bridge",
      proof_key: "bridge",
    },
    required: true,
  };
}

function makeCivilizationScenarioFrameAskToolStep(prompt: string): HelixWorkstationToolPlanStep {
  return {
    step_id: "build_civilization_scenario_frame",
    kind: "run_ask_tool",
    tool_id: "helix_ask.build_civilization_scenario_frame",
    args: {
      prompt,
      refs: ["helix-ask:current-turn"],
      options: {
        allowFictional: true,
        allowHistorical: true,
        includeNeedleScenarioFallback: true,
      },
    },
    expected_receipt_kind: "helix_civilization_scenario_frame_tool_result",
    expected_state_change: {
      store: "civilization-scenario-frame",
      proof_key: "frame",
    },
    required: true,
  };
}

function makeCivilizationBoundsAskToolStep(
  prompt: string,
  depends_on: string[] = [],
): HelixWorkstationToolPlanStep {
  return {
    step_id: "reflect_civilization_bounds",
    kind: "run_ask_tool",
    tool_id: "helix_ask.reflect_civilization_bounds",
    args: {
      prompt,
      scenarioFrameRef: "step:build_civilization_scenario_frame",
      refs: ["helix-ask:current-turn"],
      options: {
        includeBridgeContext: true,
        includeCollaborationBounds: true,
        includeFalsificationHooks: true,
      },
    },
    depends_on,
    expected_receipt_kind: "helix_civilization_bounds_tool_result",
    expected_state_change: {
      store: "civilization-bounds-roadmap",
      proof_key: "roadmap",
    },
    required: true,
  };
}

function makePanelReflectionStep(prompt: string, depends_on: string[] = []): HelixWorkstationToolPlanStep {
  return {
    step_id: "reflect_discussion_context",
    kind: "run_panel_action",
    panel_id: "theory-badge-graph",
    action_id: "reflect_discussion_context",
    args: {
      prompt,
      build_explanation_plan: true,
      overlay: true,
      open_panel: true,
    },
    depends_on,
    expected_receipt_kind: "theory_context_reflection",
    expected_state_change: { store: "theory-map-overlay", proof_key: "softRegions" },
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

function isPhysicsCalculationContextPrompt(prompt: string): boolean {
  if (isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt)) return false;
  if (hasStagePlayReflectionCue(prompt)) return false;
  return /\b(?:theory\s+(?:map|badge|atlas)|physics\s+atlas|badge\s+graph|first\s+principles|unit\s+signature|dimension(?:al)?\s+consistency|curvature|collapse|qei|stress[-\s]?energy|starsim|stellar|fusion\s+channel|solar\s+spectrum|h[-\s]?alpha|doppler|redshift|blueshift|casimir|cavity|tokamak|plasma|nhm2|warp|general\s+relativity|\bgr\b|galactic|cosmic\s+distance|cepheid|hubble|zeeman)\b/i.test(
    prompt,
  );
}

function hasStagePlayReflectionCue(prompt: string): boolean {
  if (/\b(?:moral\s*(?:badge\s*)?graph|moral\s*batch\s*graph|moralgraph|fruition|ideology\s+(?:tree|graph|map)|theory\s+badge\s+graph|theory\s+graph|physics\s+badge\s+graph)\b/i.test(prompt)) {
    return false;
  }
  return /\b(?:stage\s*play|stage\s*builder|narrative_stage_play|procedural\s+bindings?|affordance\s+graph|observer\s*\/?\s*source\s+routing)\b/i.test(prompt);
}

function userExplicitlyDisallowsPanelsOrTools(prompt: string): boolean {
  return /\b(?:do\s+not|don't|without|no)\s+(?:open|use|call|run)\b[\s\S]{0,60}\b(?:panel|panels|tool|tools|workstation|calculator|theory\s+(?:map|graph)|badge\s+graph)\b/i.test(
    prompt,
  );
}

function userExplicitlyDisallowsMoralGraphTools(prompt: string): boolean {
  return /\b(?:do\s+not|don't|dont|without|no|not\s+asking\s+to)\s+(?:open|use|call|run|plot|map|reflect)\b[\s\S]{0,90}\b(?:moral\s*(?:badge\s*)?graph|moralgraph|moral\s*batch\s*graph|fruition|ideology\s+(?:tree|graph|map)|badge\s+graph)\b/i.test(
    prompt,
  );
}

function userExplicitlyRequestsTheoryGraphPanel(prompt: string): boolean {
  if (hasStagePlayReflectionCue(prompt)) return false;
  return (
    /\b(?:open|display|bring\s+up|pull\s+up)\b[\s\S]{0,80}\b(?:theory\s+(?:badge\s+)?graph|badge\s+graph|theory\s+panel|theory\s+map)\b/i.test(
      prompt,
    ) ||
    /\bshow\s+(?:me\s+)?(?:the\s+)?(?:theory\s+(?:badge\s+)?graph|badge\s+graph|theory\s+panel|theory\s+map)\b/i.test(
      prompt,
    )
  );
}

function userExplicitlyRequestsMoralGraphPanel(prompt: string): boolean {
  return (
    /\b(?:open|display|bring\s+up|pull\s+up|show)\b[\s\S]{0,90}\b(?:moral\s*(?:badge\s*)?graph|moralgraph|moral\s*batch\s*graph|ideology\s+(?:tree|graph|map))\b/i.test(
      prompt,
    ) ||
    /\b(?:moral\s*(?:badge\s*)?graph|moralgraph|moral\s*batch\s*graph)\b[\s\S]{0,90}\b(?:panel|visible|launch\s+panel)\b/i.test(
      prompt,
    )
  );
}

function userExplicitlyRequestsFruitionPanel(prompt: string): boolean {
  return /\b(?:open|display|bring\s+up|pull\s+up|show)\b[\s\S]{0,90}\b(?:fruition\s+(?:calculator|panel)|procedural\s+(?:calculator|expression|solve))\b|\b(?:fruition\s+(?:calculator|panel)|what\s+fruition\s+would\s+solve)\b/i.test(
    prompt,
  );
}

function hasMoralGraphPromptCue(prompt: string): boolean {
  return /\b(?:moral\s*(?:badge\s*)?graph|moral\s*batch\s*graph|moralgraph|fruition\s+(?:calculator|solve|expression)|ideology\s+(?:tree|graph|map)|compare\s+(?:this\s+)?motive\s+to\s+(?:moral|ideology|mission\s+ethos)|procedural\s+(?:moral|language|expression|action|classifier|classification)|inner[-\s]?practice|plot\s+(?:direct\s+observation|right\s+speech|two[-\s]?key)|wisdom\s+first\s+principles|right\s+speech|right\s+effort|middle\s+way|mindful\s+consumption|information\s+diet|identity[-\s]?view|non[-\s]?attachment|rumination|spiritual\s+friendship|equanimity|ignorance\s+is\s+bliss|moral\s+guilt|consideration\s+(?:debt|gap)|unconsidered\s+harm|affected\s+part(?:y|ies)|due\s+care|repair\s+readiness|two[-\s]?key\s+(?:review|approval)|direct\s+observation)\b/i.test(
    prompt,
  );
}

function hasTheoryIdeologyBridgePromptCue(prompt: string): boolean {
  const hasTheoryCue =
    /\b(?:theory\s+(?:badge\s*)?graph|physics\s+(?:badge\s*)?graph|observable\s+physics|mathematics|entropy|conservation|self[-\s]?organization|chemistry|first\s+principles|boundary\s+conditions?|feedback\s+loops?|symmetry|invariance)\b/i.test(
      prompt,
    );

  const hasMoralJusticeCue =
    /\b(?:moral\s*(?:badge\s*)?graph|moralgraph|fruition|justice|fairness|due\s+process|morality|moral|ethos|procedural\s+justice|personalization|priorit(?:y|ies)|non[-\s]?harm|right\s+speech)\b/i.test(
      prompt,
    );

  return hasTheoryCue && hasMoralJusticeCue;
}

function hasCivilizationBoundsCue(prompt: string): boolean {
  return /\b(?:civilization\s+bounds|system\s+limits|collaboration\s+constraints|bounded\s+civilization|resource\s+bounds|ideal\s+vs\s+observed|feasibility\s+map|procedural\s+atlas|civilization\s+roadmap|phase\s+roadmap|material\s+inventory|energy\s+budget|manufacturing\s+resolution|governance\s+interface|situational\s+bounds|capacity\s+bounds|collaboration\s+bound|collaboration\s+value)\b/i.test(
    prompt,
  );
}

function hasCivilizationComparisonCue(prompt: string): boolean {
  return /\b(?:compare|comparison|analogy|analogous|like|as\s+(?:a|an)\b|metaphor|similar\s+to|relation\s+between|relationship\s+between)\b/i.test(
    prompt,
  );
}

function hasCivilizationProceduralWorldCue(prompt: string): boolean {
  return /\b(?:civilization|civilis(?:ation|ed)|societ(?:y|ies)|nation(?:s|al)?|countr(?:y|ies)|state(?:s)?|polity|world\s+map|earth\s+map|planetary|global|geopolitical|borders?|trade\s+routes?|shipping\s+lanes?|ports?|chokepoints?|supply\s+chains?|infrastructure|roads?|rails?|air\s+routes?|dependency\s+(?:edge|edges|graph|analysis)|dependencies|route\s+candidates?|observed\s+flows?|physical\s+substrate|tectonic\s+plates?|weather\s+fronts?|tides?|currents?|seismic|earthquakes?|live\s+(?:sources?|measurements?|data)|historical\s+(?:sources?|measurements?|records?)|source[-\s]?backed|procedural\s+(?:world|evidence|map|atlas|system|order|dependencies)|ground(?:ing|ed)?\s+(?:against|in|to|with)|material\s+base|environmental\s+fields?)\b/i.test(
    prompt,
  );
}

function hasCivilizationGroundingRequestCue(prompt: string): boolean {
  return /\b(?:ground|anchor|map|plot|trace|reflect|use|through|with|against|relate|connect|tie|show)\b/i.test(prompt);
}

function materiallyNeedsCivilizationBoundsEvidence(prompt: string): boolean {
  if (hasCivilizationBoundsCue(prompt)) return true;
  if (hasTheoryIdeologyBridgePromptCue(prompt) && hasCivilizationProceduralWorldCue(prompt)) return true;
  if (!hasCivilizationProceduralWorldCue(prompt)) return false;
  if (hasCivilizationComparisonCue(prompt) && hasCivilizationGroundingRequestCue(prompt)) return true;
  return (
    hasCivilizationGroundingRequestCue(prompt) &&
    /\b(?:dependencies|dependency\s+(?:edge|edges|graph|analysis)|trade\s+routes?|route\s+candidates?|infrastructure|physical\s+substrate|environmental\s+fields?|observed\s+flows?|live\s+(?:sources?|measurements?|data)|historical\s+(?:sources?|measurements?|records?)|source[-\s]?backed|theory\s*(?:badge\s*)?graph|moral\s*(?:badge\s*)?graph|theory\s+moral\s+bridge)\b/i.test(
      prompt,
    )
  );
}

function isCivilizationBoundsReflectionPrompt(prompt: string): boolean {
  if (!prompt || isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt)) return false;
  return materiallyNeedsCivilizationBoundsEvidence(prompt);
}

function isTheoryIdeologyBridgeReflectionPrompt(prompt: string): boolean {
  if (!prompt || isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt)) return false;
  if (userExplicitlyDisallowsMoralGraphTools(prompt)) return false;
  return hasTheoryIdeologyBridgePromptCue(prompt);
}

function isMoralGraphReflectionPrompt(prompt: string): boolean {
  if (!prompt || isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt) || userExplicitlyDisallowsMoralGraphTools(prompt)) return false;
  const hasGeneralMoralGraphCue = hasMoralGraphPromptCue(prompt);
  const hasProceduralBadgeCue = moralGraphPolicyAllowsProceduralBadgeReflection({
    inputKind: "user_prompt",
    text: prompt,
  });
  if (!hasGeneralMoralGraphCue && !hasProceduralBadgeCue) return false;
  if (hasProceduralBadgeCue) return true;
  return /\b(?:use|through|with|plot|map|reflect|compare|classify|locate|show|calculate|solve|assemble|derive|trace|badge|fruition|lens|lenses|procedural)\b/i.test(
    prompt,
  );
}

function isMoralLivingSubstrateReflectionPrompt(prompt: string): boolean {
  if (!prompt || isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt) || userExplicitlyDisallowsMoralGraphTools(prompt)) return false;
  return moralGraphPolicyAllowsLivingSubstrateReflection({
    inputKind: "user_prompt",
    text: prompt,
  });
}

function hasReflectionCue(prompt: string): boolean {
  return /\b(?:where\s+(?:does|do)\s+(?:this|that|it|e\s*=\s*h\s*f)?\s*fit|map\s+this|plot\s+this|show\s+where\s+we\s+are|theory\s+space|theory\s+graph|theory\s+(?:map|badge|atlas)|physics\s+atlas|badge\s+graph|toe|current\s+discussion|discussion\s+zone)\b/i.test(
    prompt,
  );
}

function hasTheoryReflectionDomain(prompt: string): boolean {
  return /\b(?:gr|einstein|tensor|stress[-\s]?energy|source\s+closure|qei|casimir|starsim|solar\s+spectrum|photon|planck|adm|lapse|shift|curvature|plasma|tokamak|equation|first\s+principles|theory\s+graph|badge\s+graph|nhm2|warp|redshift|doppler|zeeman)\b/i.test(
    prompt,
  );
}

function hasInlineEquationWithPhysicsDomain(prompt: string): boolean {
  return !!extractInlineMathExpression(prompt) && hasTheoryReflectionDomain(prompt);
}

function isTheoryContextReflectionPrompt(prompt: string): boolean {
  if (!prompt || isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt)) return false;
  if (hasStagePlayReflectionCue(prompt)) return false;
  if (hasReflectionCue(prompt)) return true;
  if (hasInlineEquationWithPhysicsDomain(prompt) && !/\b(?:calculate|compute|solve|evaluate|verify|check)\b/i.test(prompt)) {
    return true;
  }
  if (hasTheoryReflectionDomain(prompt) && /\b(?:discuss|explain|connect|locate|context|relationship|overlap)\b/i.test(prompt)) {
    return !hasConcreteCalculatorExpression(prompt);
  }
  return false;
}

function isTheoryReflectionCalculatorChainPrompt(prompt: string): boolean {
  if (!prompt || isWorkstationToolDiagnosticPrompt(prompt)) return false;
  if (userExplicitlyDisallowsPanelsOrTools(prompt)) return false;
  if (!isCalculatorPrompt(prompt)) return false;
  if (!extractCalculatorExpression(prompt)) return false;
  return hasReflectionCue(prompt) && hasTheoryReflectionDomain(prompt);
}

function inferPhysicsCalculationIntent(prompt: string): "locate_only" | "load_calculator" | "solve_scalar" | "solve_scalar_and_runtime" {
  if (/\b(?:where\s+(?:does|do)|what\s+theory|which\s+theory|locate|context|map|nearest|overlap)\b/i.test(prompt)) {
    return "locate_only";
  }
  if (/\b(?:load|put|send)\b[\s\S]{0,80}\b(?:calculator|scientific\s+calculator)\b/i.test(prompt)) {
    return "load_calculator";
  }
  if (/\b(?:runtime|simulation|classify|classification|fusion\s+channel|starsim|run\s+star)\b/i.test(prompt)) {
    return "solve_scalar_and_runtime";
  }
  if (/\b(?:calculate|compute|solve|estimate|evaluate|check)\b/i.test(prompt)) {
    return "solve_scalar";
  }
  return "locate_only";
}

export function planWorkstationToolUse(
  prompt: string,
  options: PlanWorkstationToolUseOptions = {},
): WorkstationToolPlannerResult {
  const normalized = normalizePrompt(prompt);
  const scores: AffordanceScore[] = [];
  const pushScore = (score: AffordanceScore) => scores.push(score);

  if (isMinecraftLiveContinuationPrompt(normalized)) {
    return retiredSituationRoomToolResult(
      "Retired Situation Room live-continuation tool calls are no longer admitted; use the Live Answer surface and Stage Play badge graph instead.",
      scores,
    );
  }

  if (isNarratorDebugProbeToolPrompt(normalized)) {
    return buildNarratorDebugProbePlan(normalized, options, scores);
  }

  if (wantsStartAgentGoalSession(normalized)) {
    return buildWorkstationGoalContextPlan(normalized, options, scores);
  }

  if (isNarratorControlPrompt(normalized)) {
    return buildNarratorControlPlan(normalized, options, scores);
  }

  const workstationControlTool = selectWorkstationControlTool(normalized);
  if (workstationControlTool) {
    return buildWorkstationControlPlan(normalized, options, scores);
  }

  if (isWatchJobAutomationPrompt(normalized)) {
    return buildWatchJobAutomationPlan(normalized, options, scores);
  }

  if (wantsGoalSatisfactionEvaluation(normalized)) {
    return buildGoalSatisfactionEvaluationPlan(normalized, options, scores);
  }

  if (wantsQueryWorkstationGoalContext(normalized)) {
    return buildWorkstationGoalContextPlan(normalized, options, scores);
  }

  const voiceContextKind = classifyVoiceContextRequest(normalized);
  if (
    voiceContextKind === "historical_or_conceptual_mention" ||
    voiceContextKind === "chat_scoped_voice_context" ||
    voiceContextKind === "style_context_only" ||
    voiceContextKind === "post_solver_voice_lane_requested" ||
    voiceContextKind === "voice_disabled_or_forbidden"
  ) {
    applyVoiceInterpretationContextRequest(normalized, voiceContextKind, options);
    return {
      intent: "direct_answer",
      action: null,
      tool_plan: null,
      scores,
      should_use_tool: false,
      reason:
        voiceContextKind === "post_solver_voice_lane_requested"
          ? "Prompt requests a post-solver voice lane; no speech delivery is eligible before an answer snapshot exists."
          : voiceContextKind === "voice_disabled_or_forbidden"
            ? "Prompt disables or forbids voice; do not route to Dottie delivery."
            : "Prompt mentions Dottie or voice as context/style/history, not as an affirmative delivery command.",
      missing_required_args: voiceContextKind === "post_solver_voice_lane_requested" ? ["answer_snapshot"] : [],
    };
  }

  if (isDottieObserverToolPrompt(normalized)) {
    return retiredSituationRoomToolResult(
      "Retired Situation Room Dottie/observer tool calls are no longer admitted; voice and witness behavior must be derived from the Live Answer/Stage Play path.",
      scores,
    );
    const targetRunId = extractDottieTargetRunId(normalized);
    const targetTurnId = extractDottieTargetTurnId(normalized);
    const sourceEventId = extractDottieSourceEventId(normalized);
    const answerSnapshotRef = extractDottieAnswerSnapshotRef(normalized);
    const sourceRef = sourceEventId ?? answerSnapshotRef;
    const sourceText = extractDottieSourceText(normalized);
    const observerProfile = extractDottieObserverProfile(normalized);
    const voiceMode = extractDottieVoiceMode(normalized);
    const maxChars = extractDottieMaxChars(normalized);
    const wantsManifest =
      /\b(?:go\s+into|enter|enable|turn\s+on)\s+(?:auntie\s+dottie|dottie)\s+(?:mode|watch|preset)\b/i.test(normalized) ||
      /\b(?:dottie\.manifest|manifest|materiali[sz]e|create|start|set\s+up|build)\b[\s\S]{0,120}\b(?:auntie\s+dottie|dottie)\b/i.test(normalized) ||
      /\b(?:auntie\s+dottie|dottie)\b[\s\S]{0,120}\b(?:manifest|materiali[sz]e|preset|mode)\b/i.test(normalized);
    const wantsAttach = /\b(?:observer\.attach|attach|watch|witness|set\s+up|start|add)\b/i.test(normalized);
    const wantsVoiceProposal = /\b(?:voice_delivery\.propose_from_trace|voice\s+delivery|propose|prepare|callout|speak|read|say|narrate|out\s*loud|outloud|aloud)\b/i.test(normalized);
    const wantsQuery =
      /\b(?:observer\.query|query|show|list)\b/i.test(normalized) ||
      /\bthen\s+(?:query|show|list)\b/i.test(normalized);
    const missing = Array.from(new Set([
      ...(!wantsManifest && wantsAttach && !targetRunId ? ["target_run_id"] : []),
      ...(!wantsManifest && wantsVoiceProposal && !sourceRef ? ["answer_snapshot.latest_or_selected_text_ref_or_source_event_id"] : []),
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
      ...(sourceRef ? { source_event_id: sourceRef } : {}),
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
    if (wantsManifest) {
      const manifestArgs = {
        thread_id: options.threadId ?? "helix-ask:desktop",
        observer_profile: observerProfile,
        voice_mode: voiceMode,
        ...(targetRunId ? { target_run_id: targetRunId } : {}),
        ...(targetTurnId ? { target_turn_id: targetTurnId } : {}),
        ...(maxChars ? { max_chars: maxChars } : {}),
        objective: "Manifest Auntie Dottie as a witness-only Situation Room observer preset.",
      };
      const manifestStep: HelixWorkstationToolPlanStep = {
        step_id: "manifest_dottie_observer",
        kind: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: "dottie.manifest",
        args: manifestArgs,
        depends_on: ["open_situation_room_pipelines"],
        expected_receipt_kind: "dottie_manifest_preset_receipt",
        expected_state_change: { store: "situation-room-runtime", proof_key: "preset_id" },
        required: true,
      };
      steps.push(manifestStep);
      primaryAction = { panel_id: manifestStep.panel_id ?? "", action_id: manifestStep.action_id ?? "", args: manifestArgs };
    }
    if (!wantsManifest && (wantsAttach || !wantsVoiceProposal)) {
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
        depends_on: steps.some((step: HelixWorkstationToolPlanStep) => step.step_id === "attach_dottie_observer")
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
        depends_on: steps.some((step: HelixWorkstationToolPlanStep) => step.step_id === "propose_dottie_voice_from_trace")
          ? ["propose_dottie_voice_from_trace"]
          : steps.some((step: HelixWorkstationToolPlanStep) => step.step_id === "attach_dottie_observer")
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
      depends_on: steps
        .filter((step: HelixWorkstationToolPlanStep) => step.kind === "run_panel_action")
        .map((step: HelixWorkstationToolPlanStep) => step.step_id),
      expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
      required: true,
    });
    pushScore({
      affordance_id: wantsManifest
        ? "situation-room-pipelines.dottie.manifest"
        : wantsVoiceProposal
          ? "situation-room-pipelines.voice_delivery.propose_from_trace"
          : "situation-room-pipelines.observer.attach",
      panel_id: "situation-room-pipelines",
      action_id: wantsManifest
        ? "dottie.manifest"
        : wantsVoiceProposal
          ? "voice_delivery.propose_from_trace"
          : "observer.attach",
      score: missing.length === 0 ? 0.94 : 0.64,
      reason: missing.length === 0
        ? wantsManifest
          ? "explicit Dottie manifest command can create the witness-only preset"
          : wantsVoiceProposal
            ? "explicit Dottie voice request includes required public trace source"
            : "explicit Dottie observer command includes required public trace targets"
        : wantsVoiceProposal
          ? "explicit Dottie voice request is missing the required source event or source text"
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
      reason: wantsVoiceProposal
        ? "Prompt explicitly asks Situation Room to prepare Dottie voice output from a trace source."
        : "Prompt explicitly asks Situation Room to attach or inspect Dottie as a witness-only observer.",
      missing_required_args: missing,
    };
  }

  if (isNoteCreatePrompt(normalized)) {
    const title = extractNoteTitle(normalized);
    const quotedBody = /\b(?:called|named|titled)\b/i.test(normalized) ? null : extractQuoted(normalized);
    const body = extractNoteBody(normalized) ?? quotedBody;
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

  if (isMoralLivingSubstrateReflectionPrompt(normalized) && !isCivilizationBoundsReflectionPrompt(normalized)) {
    const wantsTheoryFirst = moralGraphPolicyPrefersTheoryFirst({
      inputKind: "user_prompt",
      text: normalized,
    });
    const steps: HelixWorkstationToolPlanStep[] = [
      ...(wantsTheoryFirst ? [makeTheoryReflectionAskToolStep(normalized)] : []),
      makeMoralLivingSubstrateReflectionAskToolStep(
        normalized,
        wantsTheoryFirst ? ["reflect_theory_context"] : [],
      ),
      {
        step_id: "evaluate_moral_living_substrate_reflection",
        kind: "evaluate_result",
        depends_on: ["reflect_moral_living_substrate_context"],
        expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
        required: true,
      },
    ];
    pushScore({
      affordance_id: "moral-graph.reflect_living_substrate_context",
      panel_id: "helix_ask",
      action_id: "reflect_living_substrate_context",
      score: wantsTheoryFirst ? 0.93 : 0.9,
      reason:
        "Prompt asks to translate living-system substrate mechanisms into Moral Graph reflection evidence while preserving theory/calculator ownership of mechanisms.",
      required_args_missing: [],
    });
    return {
      intent: "moral_living_substrate_reflection",
      action: null,
      tool_plan: buildToolPlan({
        prompt: normalized,
        intent: "moral_living_substrate_reflection",
        missing: [],
        options,
        steps,
      }),
      scores,
      should_use_tool: true,
      reason:
        "Prompt asks for living-system substrate Moral Graph reflection; produce non-terminal substrate evidence before synthesis.",
      missing_required_args: [],
    };
  }

  if (isTheoryIdeologyBridgeReflectionPrompt(normalized) && !isCivilizationBoundsReflectionPrompt(normalized)) {
    const steps: HelixWorkstationToolPlanStep[] = [
      makeTheoryReflectionAskToolStep(normalized),
      makeMoralGraphReflectionAskToolStep(normalized),
      makeTheoryIdeologyBridgeAskToolStep(normalized),
      {
        step_id: "evaluate_theory_ideology_bridge",
        kind: "evaluate_result",
        depends_on: ["bridge_theory_ideology_context"],
        expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
        required: true,
      },
    ];

    pushScore({
      affordance_id: "helix_ask.bridge_theory_ideology_context",
      panel_id: "helix_ask",
      action_id: "bridge_theory_ideology_context",
      score: 0.91,
      reason:
        "Prompt asks to connect theory/physics constraints with Moral/procedural justice lenses as non-terminal bridge evidence",
      required_args_missing: [],
    });

    return {
      intent: "theory_ideology_bridge_reflection",
      action: null,
      tool_plan: buildToolPlan({
        prompt: normalized,
        intent: "theory_ideology_bridge_reflection",
        missing: [],
        options,
        steps,
      }),
      scores,
      should_use_tool: true,
      reason:
        "Prompt asks to reflect theory/physics constraints against Moral/procedural justice lenses; produce bridge evidence before final answer.",
      missing_required_args: [],
    };
  }

  if (isCivilizationBoundsReflectionPrompt(normalized)) {
    const wantsBridge = isTheoryIdeologyBridgeReflectionPrompt(normalized);
    const wantsTheory = wantsBridge || hasTheoryReflectionDomain(normalized);
    const wantsZen =
      wantsBridge ||
      hasMoralGraphPromptCue(normalized) ||
      /\b(?:fairness|due\s+process|review|non[-\s]?harm|governance|procedural)\b/i.test(normalized);
    const steps: HelixWorkstationToolPlanStep[] = [
      makeCivilizationScenarioFrameAskToolStep(normalized),
      ...(wantsTheory ? [makeTheoryReflectionAskToolStep(normalized)] : []),
      ...(wantsZen ? [makeMoralGraphReflectionAskToolStep(normalized)] : []),
      makeCivilizationBoundsAskToolStep(normalized, [
        "build_civilization_scenario_frame",
        ...(wantsTheory ? ["reflect_theory_context"] : []),
        ...(wantsZen ? ["reflect_moral_graph_context"] : []),
      ]),
      ...(wantsBridge
        ? [
            {
              ...makeTheoryIdeologyBridgeAskToolStep(normalized),
              depends_on: [
                "reflect_theory_context",
                "reflect_moral_graph_context",
                "reflect_civilization_bounds",
              ],
            },
          ]
        : []),
      {
        step_id: wantsBridge
          ? "evaluate_civilization_bounds_bridge"
          : "evaluate_civilization_bounds",
        kind: "evaluate_result",
        depends_on: [wantsBridge ? "bridge_theory_ideology_context" : "reflect_civilization_bounds"],
        expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
        required: true,
      },
    ];

    pushScore({
      affordance_id: "helix_ask.reflect_civilization_bounds",
      panel_id: "helix_ask",
      action_id: "reflect_civilization_bounds",
      score: wantsBridge ? 0.92 : 0.88,
      reason:
        "Prompt asks for a read-only civilization bounds roadmap as situational evidence for capacities, dependencies, missing checks, and procedural gates",
      required_args_missing: [],
    });

    return {
      intent: "civilization_bounds_reflection",
      action: null,
      tool_plan: buildToolPlan({
        prompt: normalized,
        intent: "civilization_bounds_reflection",
        missing: [],
        options,
        steps,
      }),
      scores,
      should_use_tool: true,
      reason:
        "Prompt asks for civilization/system bounds; produce a diagnostic roadmap receipt before synthesis.",
      missing_required_args: [],
    };
  }

  if (isIdeologyComparePrompt(normalized)) {
    const motive = extractIdeologyMotive(normalized) ?? normalized;
    const action = {
      panel_id: "mission-ethos",
      action_id: "compare_motive_to_zen",
      args: {
        motive,
        framework: "moral",
      },
    };
    const steps: HelixWorkstationToolPlanStep[] = [
      makeOpenStep("mission-ethos"),
      {
        step_id: "compare_motive_to_zen",
        kind: "run_panel_action",
        panel_id: "mission-ethos",
        action_id: "compare_motive_to_zen",
        args: action.args,
        depends_on: ["open_mission_ethos"],
        expected_receipt_kind: "mission_ethos_compare_receipt",
        expected_state_change: { store: "mission-ethos", proof_key: "comparison" },
        required: true,
      },
      {
        step_id: "evaluate_ideology_compare",
        kind: "evaluate_result",
        depends_on: ["compare_motive_to_zen"],
        expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
        required: true,
      },
    ];
    pushScore({
      affordance_id: "mission-ethos.compare_motive_to_zen",
      panel_id: "mission-ethos",
      action_id: "compare_motive_to_zen",
      score: 0.88,
      reason: "Prompt asks to compare a motive or action against Moral/mission ethos guidance.",
      required_args_missing: [],
    });
    return {
      intent: "ideology_compare",
      action,
      tool_plan: buildToolPlan({
        prompt: normalized,
        intent: "ideology_compare",
        missing: [],
        options,
        steps,
      }),
      scores,
      should_use_tool: true,
      reason: "Prompt asks for a mission-ethos motive comparison; run the governed panel action and evaluate its receipt.",
      missing_required_args: [],
    };
  }

  if (isMoralGraphReflectionPrompt(normalized)) {
    const wantsVisibleMoralGraph = userExplicitlyRequestsMoralGraphPanel(normalized);
    const wantsFruitionPanel = userExplicitlyRequestsFruitionPanel(normalized) || /\bfruition\b/i.test(normalized);
    const steps: HelixWorkstationToolPlanStep[] = [
      ...(wantsVisibleMoralGraph ? [makeOpenStep("moral-badge-graph")] : []),
      makeMoralGraphReflectionAskToolStep(normalized),
      ...(wantsFruitionPanel ? [makeOpenStep("fruition-calculator", ["reflect_moral_graph_context"])] : []),
      {
        step_id: "evaluate_moral_graph_reflection",
        kind: "evaluate_result",
        depends_on: ["reflect_moral_graph_context"],
        expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
        required: true,
      },
    ];
    pushScore({
      affordance_id: "helix_ask.reflect_ideology_context",
      panel_id: "helix_ask",
      action_id: "reflect_ideology_context",
      score: 0.89,
      reason: "MoralGraph/Fruition prompt can be reflected into badge locator and procedural expression evidence",
      required_args_missing: [],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "moral_graph_reflection",
      missing: [],
      options,
      steps,
    });
    return {
      intent: "moral_graph_reflection",
      action: null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for MoralGraph/Fruition reflection; produce locator and procedural expression evidence before final answer.",
      missing_required_args: [],
    };
  }

  if (isTheoryReflectionCalculatorChainPrompt(normalized)) {
    const latex = extractCalculatorExpression(normalized);
    const calculatorSetup = buildCalculatorSetupContext(normalized, latex);
    const wantsSteps = /\b(?:steps?|show\s+work|trace|verify|check)\b/i.test(normalized);
    const actionId = wantsSteps ? "solve_with_steps" : "solve_expression";
    const solveArgs = calculatorArgs(latex, calculatorSetup);
    pushScore({
      affordance_id: "helix_ask.reflect_theory_context",
      panel_id: "helix_ask",
      action_id: "reflect_theory_context",
      score: 0.9,
      reason: "physics calculation prompt also asks to locate the equation in theory graph space",
      required_args_missing: [],
    });
    pushScore({
      affordance_id: `scientific-calculator.${actionId}`,
      panel_id: "scientific-calculator",
      action_id: actionId,
      score: 0.94,
      reason: "physics calculation prompt includes a concrete scalar expression after theory reflection",
      required_args_missing: [],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "physics_calculation_context",
      missing: [],
      options,
      steps: [
        makeTheoryReflectionAskToolStep(normalized),
        makeOpenStep("scientific-calculator", ["reflect_theory_context"]),
        {
          step_id: "ingest_expression",
          kind: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "ingest_latex",
          args: solveArgs,
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
          args: solveArgs,
          depends_on: ["ingest_expression"],
          expected_receipt_kind: "calculator_receipt",
          expected_state_change: { store: "scientific-calculator", proof_key: "result_text" },
          required: true,
        },
        {
          step_id: "evaluate_reflection_and_calculator",
          kind: "evaluate_result",
          depends_on: ["reflect_theory_context", actionId],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "physics_calculation_context",
      action: {
        panel_id: "scientific-calculator",
        action_id: actionId,
        args: solveArgs,
      },
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt asks for mapped theory context and a scalar calculation; reflect context before calculator solve.",
      missing_required_args: [],
    };
  }

  if (isTheoryContextReflectionPrompt(normalized)) {
    const wantsVisibleTheoryGraph = userExplicitlyRequestsTheoryGraphPanel(normalized);
    pushScore({
      affordance_id: wantsVisibleTheoryGraph
        ? "theory-badge-graph.reflect_discussion_context"
        : "helix_ask.reflect_theory_context",
      panel_id: wantsVisibleTheoryGraph ? "theory-badge-graph" : "helix_ask",
      action_id: wantsVisibleTheoryGraph ? "reflect_discussion_context" : "reflect_theory_context",
      score: 0.88,
      reason: "mapped physics/theory prompt can be reflected into the badge graph as non-terminal evidence",
      required_args_missing: [],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "theory_context_reflection",
      missing: [],
      options,
      steps: [
        ...(wantsVisibleTheoryGraph
          ? [
              makeOpenStep("theory-badge-graph"),
              makePanelReflectionStep(normalized, ["open_theory_badge_graph"]),
            ]
          : [makeTheoryReflectionAskToolStep(normalized)]),
        {
          step_id: "evaluate_theory_context_reflection",
          kind: "evaluate_result",
          depends_on: [wantsVisibleTheoryGraph ? "reflect_discussion_context" : "reflect_theory_context"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "theory_context_reflection",
      action: wantsVisibleTheoryGraph
        ? {
            panel_id: "theory-badge-graph",
            action_id: "reflect_discussion_context",
            args: {
              prompt: normalized,
              build_explanation_plan: true,
              overlay: true,
              open_panel: true,
            },
          }
        : null,
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt discusses mapped theory/physics concepts; reflect discussion context as evidence before final answer.",
      missing_required_args: [],
    };
  }

  if (isPhysicsCalculationContextPrompt(normalized)) {
    const physicsIntent = inferPhysicsCalculationIntent(normalized);
    const args = {
      query: normalized,
      intent: physicsIntent,
      overlay: true,
    };
    pushScore({
      affordance_id: "theory-badge-graph.plan_calculation_context",
      panel_id: "theory-badge-graph",
      action_id: "plan_calculation_context",
      score: physicsIntent === "locate_only" ? 0.84 : 0.91,
      reason: "physics prompt can be located on the theory atlas before calculator/runtime execution",
      required_args_missing: [],
    });
    const toolPlan = buildToolPlan({
      prompt: normalized,
      intent: "physics_calculation_context",
      missing: [],
      options,
      steps: [
        makeOpenStep("theory-badge-graph"),
        {
          step_id: "plan_physics_calculation_context",
          kind: "run_panel_action",
          panel_id: "theory-badge-graph",
          action_id: "plan_calculation_context",
          args,
          depends_on: ["open_theory_badge_graph"],
          expected_receipt_kind: "helix_physics_calculation_context_plan",
          expected_state_change: { store: "theory-map-overlay", proof_key: "selectedBadgeIds" },
          required: true,
        },
        {
          step_id: "evaluate_physics_context_plan",
          kind: "evaluate_result",
          depends_on: ["plan_physics_calculation_context"],
          expected_receipt_kind: "helix.workstation_tool_evaluation.v1",
          required: true,
        },
      ],
    });
    return {
      intent: "physics_calculation_context",
      action: {
        panel_id: "theory-badge-graph",
        action_id: "plan_calculation_context",
        args,
      },
      tool_plan: toolPlan,
      scores,
      should_use_tool: true,
      reason: "Prompt mentions a mapped physics domain; plan theory context before final answer.",
      missing_required_args: [],
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
