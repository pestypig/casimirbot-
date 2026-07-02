export type ScientificCalculatorWorkbenchCalculationType =
  | "scalar_arithmetic"
  | "symbolic_equation"
  | "calculus"
  | "tensor_runtime"
  | "gr_warp"
  | "paper_equation_candidate"
  | "unsupported";

export type ScientificCalculatorWorkbenchParseStatus = "ok" | "partial" | "fallback_text" | "error";

export type ScientificCalculatorWorkbenchRoute =
  | "arithmetic_safe"
  | "symbolic_solver"
  | "calculus_solver"
  | "tensor_runtime"
  | "warp_runtime"
  | "paper_equation_binder"
  | "blocked";

export type ScientificCalculatorExpressionClassification = {
  schema: "helix.scientific_calculator_expression_classification.v1";
  expression: string;
  normalized_expression: string | null;
  parse_status: ScientificCalculatorWorkbenchParseStatus;
  calculation_type: ScientificCalculatorWorkbenchCalculationType;
  detected_symbols: string[];
  missing_variables: string[];
  required_assumptions: string[];
  possible_routes: ScientificCalculatorWorkbenchRoute[];
  blocked_reasons: string[];
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
  post_tool_model_step_required: true;
};

export type ScientificCalculatorNumericBindingEvidence = {
  symbol: string;
  value: string | number;
  unit?: string | null;
  dimension_signature?: string | null;
  source_refs?: string[];
  meaning?: string | null;
};

export type ScientificCalculatorBoundVariable = {
  symbol: string;
  value: string;
  unit: string | null;
  dimension_signature: string | null;
  source_refs: string[];
  meaning: string | null;
};

export type ScientificCalculatorBindingResult = {
  schema: "helix.scientific_calculator_variable_binding.v1";
  expression: string;
  normalized_expression: string | null;
  status: "succeeded" | "blocked";
  bound_expression: string | null;
  required_symbols: string[];
  bound_symbols: Record<string, ScientificCalculatorBoundVariable>;
  missing_variables: string[];
  blocked_reasons: string[];
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
  post_tool_model_step_required: true;
};

const KNOWN_CONSTANTS = new Set([
  "c",
  "e",
  "g",
  "h",
  "hbar",
  "k",
  "pi",
  "mu0",
  "epsilon0",
  "sigma",
  "sqrt",
  "ln",
  "log",
  "sin",
  "cos",
  "tan",
  "exp",
]);

const normalizeExpressionText = (expression: string): string =>
  expression
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/[{}]/g, "");

const normalizeNumericValueText = (value: string | number): string | null => {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? normalized : null;
};

const extractSymbols = (expression: string): string[] => {
  const inputSide = expression.includes("=") ? expression.split("=").slice(1).join("=") : expression;
  const deLatexed = inputSide
    .replace(/\\[a-zA-Z]+/g, (command) => command.slice(1))
    .replace(/\b(?:frac|left|right|mathrm|operatorname|text|begin|end)\b/g, " ");
  return Array.from(new Set(
    Array.from(deLatexed.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g))
      .map((match) => match[0])
      .filter((symbol) => !KNOWN_CONSTANTS.has(symbol.toLowerCase())),
  )).slice(0, 32);
};

export function classifyScientificCalculatorExpression(
  expression: string,
): ScientificCalculatorExpressionClassification {
  const trimmed = expression.trim();
  const normalized = normalizeExpressionText(trimmed);
  if (!trimmed) {
    return {
      schema: "helix.scientific_calculator_expression_classification.v1",
      expression: "",
      normalized_expression: null,
      parse_status: "error",
      calculation_type: "unsupported",
      detected_symbols: [],
      missing_variables: [],
      required_assumptions: [],
      possible_routes: ["blocked"],
      blocked_reasons: ["missing_expression"],
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      post_tool_model_step_required: true,
    };
  }

  const detectedSymbols = extractSymbols(normalized);
  const hasEquals = normalized.includes("=");
  const hasLetters = /[A-Za-z_\\]/.test(normalized);
  const arithmeticLike = /^[\deE.+\-*/^()%\s]+$/.test(normalized) && /[+\-*/^%]/.test(normalized);
  const calculusLike = /\\(?:int|sum|prod|partial|nabla)|\b(?:integral|derivative|d\/d[a-z]|lim)\b/i.test(trimmed);
  const grWarpLike = /\b(?:einstein|metric|stress[-\s]?energy|alcubierre|warp|curvature|ricci|christoffel|extrinsic|qei|ford.?roman)\b|G_\{?\\?mu|T_\{?\\?mu/i.test(trimmed);
  const tensorLike = grWarpLike || /\b(?:tensor|rank|indices|component|invariant|covariant|contravariant)\b|R_\{?\\?mu|g_\{?\\?mu/i.test(trimmed);
  const latexLike = /\\[A-Za-z]+/.test(trimmed);

  let calculationType: ScientificCalculatorWorkbenchCalculationType = "unsupported";
  let parseStatus: ScientificCalculatorWorkbenchParseStatus = "ok";
  let possibleRoutes: ScientificCalculatorWorkbenchRoute[] = ["blocked"];
  const requiredAssumptions: string[] = [];
  const blockedReasons: string[] = [];

  if (grWarpLike) {
    calculationType = "gr_warp";
    possibleRoutes = ["warp_runtime"];
    requiredAssumptions.push("metric_convention", "coordinate_chart", "unit_system");
    blockedReasons.push("runtime_route_required");
  } else if (tensorLike) {
    calculationType = "tensor_runtime";
    possibleRoutes = ["tensor_runtime"];
    requiredAssumptions.push("index_convention", "coordinate_chart");
    blockedReasons.push("runtime_route_required");
  } else if (calculusLike) {
    calculationType = "calculus";
    possibleRoutes = ["calculus_solver"];
    if (detectedSymbols.length > 0) blockedReasons.push("symbolic_route_required");
  } else if (arithmeticLike && !hasLetters && !hasEquals) {
    calculationType = "scalar_arithmetic";
    possibleRoutes = ["arithmetic_safe"];
  } else if (hasEquals || detectedSymbols.length > 0) {
    calculationType = hasEquals ? "symbolic_equation" : "paper_equation_candidate";
    possibleRoutes = hasEquals ? ["symbolic_solver", "paper_equation_binder"] : ["paper_equation_binder"];
    if (detectedSymbols.length > 0) blockedReasons.push("missing_variable_bindings");
  } else if (latexLike) {
    calculationType = "paper_equation_candidate";
    parseStatus = "partial";
    possibleRoutes = ["paper_equation_binder"];
    blockedReasons.push("classification_needs_source_context");
  } else {
    parseStatus = "fallback_text";
    blockedReasons.push("unsupported_expression_syntax");
  }

  return {
    schema: "helix.scientific_calculator_expression_classification.v1",
    expression: trimmed,
    normalized_expression: normalized || null,
    parse_status: parseStatus,
    calculation_type: calculationType,
    detected_symbols: detectedSymbols,
    missing_variables: calculationType === "scalar_arithmetic" ? [] : detectedSymbols,
    required_assumptions: requiredAssumptions,
    possible_routes: possibleRoutes,
    blocked_reasons: blockedReasons,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    post_tool_model_step_required: true,
  };
}

export function bindScientificCalculatorVariables(input: {
  expression: string;
  numericEvidence: ScientificCalculatorNumericBindingEvidence[];
  expectedUnits?: Record<string, string | null | undefined> | null;
  expectedDimensions?: Record<string, string | null | undefined> | null;
}): ScientificCalculatorBindingResult {
  const classification = classifyScientificCalculatorExpression(input.expression);
  const requiredSymbols = classification.missing_variables;
  const blockedReasons = new Set<string>();
  const boundSymbols: Record<string, ScientificCalculatorBoundVariable> = {};
  const evidenceBySymbol = new Map<string, ScientificCalculatorNumericBindingEvidence[]>();

  for (const evidence of input.numericEvidence) {
    const symbol = String(evidence.symbol ?? "").trim();
    if (!symbol) continue;
    evidenceBySymbol.set(symbol, [...(evidenceBySymbol.get(symbol) ?? []), evidence]);
  }

  for (const symbol of requiredSymbols) {
    const candidates = evidenceBySymbol.get(symbol) ?? [];
    if (candidates.length === 0) {
      blockedReasons.add("missing_variables");
      continue;
    }
    const valid = candidates
      .map((candidate) => {
        const value = normalizeNumericValueText(candidate.value);
        const sourceRefs = Array.isArray(candidate.source_refs)
          ? candidate.source_refs.map((entry) => String(entry).trim()).filter(Boolean)
          : [];
        return value && sourceRefs.length > 0
          ? {
              candidate,
              value,
              sourceRefs,
            }
          : null;
      })
      .filter((entry): entry is { candidate: ScientificCalculatorNumericBindingEvidence; value: string; sourceRefs: string[] } => Boolean(entry));

    if (valid.length === 0) {
      const hasNumericValue = candidates.some((candidate) => normalizeNumericValueText(candidate.value));
      blockedReasons.add(hasNumericValue ? "missing_source_refs" : "missing_variables");
      continue;
    }

    const distinctValues = new Set(valid.map((entry) => entry.value));
    const distinctUnits = new Set(valid.map((entry) => String(entry.candidate.unit ?? "").trim()).filter(Boolean));
    if (distinctValues.size > 1 || distinctUnits.size > 1) {
      blockedReasons.add("ambiguous_units");
      continue;
    }

    const selected = valid[0];
    const unit = String(selected.candidate.unit ?? "").trim() || null;
    const expectedUnit = input.expectedUnits?.[symbol] ? String(input.expectedUnits[symbol]).trim() : null;
    if (expectedUnit && unit && expectedUnit !== unit) {
      blockedReasons.add("incompatible_dimensions");
      continue;
    }
    const dimensionSignature = String(selected.candidate.dimension_signature ?? "").trim() || null;
    const expectedDimension = input.expectedDimensions?.[symbol] ? String(input.expectedDimensions[symbol]).trim() : null;
    if (expectedDimension && dimensionSignature && expectedDimension !== dimensionSignature) {
      blockedReasons.add("incompatible_dimensions");
      continue;
    }

    boundSymbols[symbol] = {
      symbol,
      value: selected.value,
      unit,
      dimension_signature: dimensionSignature,
      source_refs: selected.sourceRefs,
      meaning: String(selected.candidate.meaning ?? "").trim() || null,
    };
  }

  const missingVariables = requiredSymbols.filter((symbol) => !boundSymbols[symbol]);
  if (classification.parse_status === "error") blockedReasons.add("unsupported_symbol_semantics");
  if (classification.calculation_type === "gr_warp" || classification.calculation_type === "tensor_runtime") {
    blockedReasons.add("unsupported_symbol_semantics");
  }
  if (missingVariables.length > 0 && blockedReasons.size === 0) blockedReasons.add("missing_variables");

  const status = missingVariables.length === 0 && blockedReasons.size === 0 ? "succeeded" : "blocked";
  const boundExpression = status === "succeeded"
    ? requiredSymbols.reduce((current, symbol) => {
        const bound = boundSymbols[symbol];
        if (!bound) return current;
        const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return current.replace(new RegExp(`\\b${escaped}\\b`, "g"), bound.value);
      }, classification.normalized_expression ?? classification.expression)
    : null;

  return {
    schema: "helix.scientific_calculator_variable_binding.v1",
    expression: classification.expression,
    normalized_expression: classification.normalized_expression,
    status,
    bound_expression: boundExpression,
    required_symbols: requiredSymbols,
    bound_symbols: boundSymbols,
    missing_variables: missingVariables,
    blocked_reasons: Array.from(blockedReasons),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
    post_tool_model_step_required: true,
  };
}
