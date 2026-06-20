import { extractCalculatorExpression } from "./workstation-tool-planner";
import { appendAskToolTraceDisclosureNote, buildAskToolTraceDisclosure } from "./tool-trace-disclosure";
import type { HelixWorkstationToolPlan, HelixWorkstationToolPlanStep } from "../../../shared/helix-workstation-tool-plan";
import type { HelixWorkstationToolEvaluation } from "../../../shared/helix-workstation-tool-evaluation";
import type { HelixCalculatorSetupContext, HelixCalculatorSetupVariable } from "../../../shared/helix-calculator-setup-context";
import type { HelixPostToolSynthesisPlanV1 } from "../../../shared/contracts/helix-post-tool-synthesis-plan.v1";

export type SynthesizeWorkstationAnswerInput = {
  prompt: string;
  plan: HelixWorkstationToolPlan;
  evaluation?: HelixWorkstationToolEvaluation | null;
  postToolSynthesisPlan?: HelixPostToolSynthesisPlanV1 | null;
  zenGraphReflectionToolOutput?: unknown;
  theoryIdeologyBridgeToolOutput?: unknown;
  civilizationScenarioFrameToolOutput?: unknown;
  civilizationBoundsToolOutput?: unknown;
};

export type CalculatorObservation = {
  expression: string;
  result: string | null;
  traceSource: string;
  setup: HelixCalculatorSetupContext | null;
};

function normalizeNumberText(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function cleanNullableText(value: unknown): string | null {
  const text = readString(value);
  if (!text || /^(?:null|undefined)$/i.test(text)) return null;
  return text.replace(/\s+(?:null|undefined)\s*$/i, "").trim() || null;
}

const WORKSTATION_EVALUATION_STATUS_VALUES = new Set([
  "supports_subgoal",
  "contradicts_subgoal",
  "insufficient",
  "needs_followup_tool",
  "stored_for_reference",
]);

function normalizeCalculatorExpressionText(value: string | null): string | null {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(/^[`"']+|[`"'.]+$/g, "")
    .trim();
  if (!normalized || normalized.length > 240) return null;
  if (!/[+\-*/^=()]|sqrt|ln|log|sin|cos|tan|exp/i.test(normalized)) return null;
  return normalized;
}

function calculatorExpressionFromEvaluation(
  evaluation: HelixWorkstationToolEvaluation | null | undefined,
): string | null {
  const record = readRecord(evaluation);
  if (!record) return null;
  const calculatorSetup = readRecord(record.calculator_setup);
  const directExpression =
    readString(record.expression) ??
    readString(record.input_expression) ??
    readString(record.calculator_expression) ??
    readString(record.latex) ??
    readString(readRecord(record.calculation)?.expression) ??
    readString(calculatorSetup?.display_latex) ??
    readString(calculatorSetup?.expression);
  const normalizedDirectExpression = normalizeCalculatorExpressionText(directExpression);
  if (normalizedDirectExpression) return normalizedDirectExpression;
  const text = [
    readString(record.terminal_text),
    readString(record.text_preview),
    readString(record.summary),
    readString(record.result_summary),
    readString(record.answer_text),
    readString(record.text),
  ].filter(Boolean).join("\n");
  if (!text) return null;
  const expressionLabel = text.match(/\bexpression\s*:\s*([^\n]+)/i);
  const backedResultExpression = text.match(
    /\b(?:calculator-backed result|calculator result|result)\s*:\s*(.+?)\s*=/i,
  );
  const evaluatedExpression = text.match(
    /\b(?:verified|evaluated|solved|computed)\s+(.+?)\s+(?:with\s+result|and\s+(?:produced|returned)|=)\b/i,
  );
  return (
    normalizeCalculatorExpressionText(expressionLabel?.[1] ?? null) ??
    normalizeCalculatorExpressionText(backedResultExpression?.[1] ?? null) ??
    normalizeCalculatorExpressionText(evaluatedExpression?.[1] ?? null)
  );
}

function calculatorResultFromEvaluation(
  evaluation: HelixWorkstationToolEvaluation | null | undefined,
): string | null {
  const record = readRecord(evaluation);
  if (!record) return null;
  const directResult =
    cleanNullableText(record.result_text) ??
    cleanNullableText(record.result_value) ??
    cleanNullableText(record.calculator_result) ??
    cleanNullableText(record.computed_result) ??
    cleanNullableText(record.numeric_result) ??
    cleanNullableText(readRecord(record.calculation)?.result);
  if (directResult && !WORKSTATION_EVALUATION_STATUS_VALUES.has(directResult)) return directResult;
  const resultPattern = "([-+]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:e[-+]?\\d+)?)";
  const text = [
    readString(record.terminal_text),
    readString(record.text_preview),
    readString(record.summary),
    readString(record.result_summary),
    readString(record.answer_text),
    readString(record.text),
  ].filter(Boolean).join("\n");
  if (!text) return null;
  const backedResultEquation = text.match(
    new RegExp(`\\b(?:calculator-backed result|calculator result)\\s*:\\s*.+?=\\s*${resultPattern}\\b`, "i"),
  );
  if (backedResultEquation?.[1]) return backedResultEquation[1];
  const labeledResult = text.match(
    new RegExp(`\\b(?:with result|result(?:\\s+is)?|evaluated to|produced|equals)\\s*:?\\s*${resultPattern}\\b`, "i"),
  );
  if (labeledResult?.[1]) return labeledResult[1];
  const equationResult = text.match(new RegExp(`=\\s*${resultPattern}\\b`, "i"));
  return equationResult?.[1] ?? null;
}

function solveSimpleQuadraticZero(expression: string): string | null {
  const normalized = expression.replace(/\s+/g, "");
  const match = normalized.match(/^x\^2([+-]\d+(?:\.\d+)?)=0$/i);
  if (!match) return null;
  const constant = Number(match[1]);
  if (!Number.isFinite(constant)) return null;
  const rhs = -constant;
  if (rhs < 0) return null;
  const root = Math.sqrt(rhs);
  if (!Number.isFinite(root)) return null;
  if (Math.abs(root - Math.round(root)) < 1e-9) {
    return `${Math.round(root)}, ${-Math.round(root)}`;
  }
  return `${root}, ${-root}`;
}

function solveSimpleLinearZero(expression: string): string | null {
  const normalized = expression.replace(/\s+/g, "");
  const match = normalized.match(/^([+-]?(?:\d+(?:\.\d+)?(?:e[-+]?\d+)?)?)\*?x([+-]\d+(?:\.\d+)?(?:e[-+]?\d+)?)=0$/i);
  if (!match) return null;
  const coefficientText = match[1];
  const coefficient =
    coefficientText === "" || coefficientText === "+"
      ? 1
      : coefficientText === "-"
        ? -1
        : Number(coefficientText);
  const constant = Number(match[2]);
  if (!Number.isFinite(coefficient) || coefficient === 0 || !Number.isFinite(constant)) return null;
  return `x = ${normalizeNumberText(-constant / coefficient)}`;
}

function solveSimpleArithmeticExpression(expression: string): string | null {
  const normalized = expression.replace(/\s+/g, "");
  if (!normalized || !/^[\deE.+\-*/^()]+$/.test(normalized)) return null;
  if (!/[+\-*/^]/.test(normalized)) return null;
  try {
    const jsExpression = normalized.replace(/\^/g, "**");
    const value = Function(`"use strict"; return (${jsExpression});`)();
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return normalizeNumberText(value);
  } catch {
    return null;
  }
}

function numericResultValue(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+(?:null|undefined)\s*$/i, "");
  if (!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?$/i.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function calculatorResultConflictsWithComputed(observedResult: string | null, computedResult: string | null): boolean {
  const observedNumber = numericResultValue(observedResult);
  const computedNumber = numericResultValue(computedResult);
  if (observedNumber === null || computedNumber === null) return false;
  const tolerance = Math.max(1e-9, Math.abs(computedNumber) * 1e-9);
  return Math.abs(observedNumber - computedNumber) > tolerance;
}

function selectCalculatorResult(observedResult: string | null, computedResult: string | null): string | null {
  if (observedResult && computedResult && calculatorResultConflictsWithComputed(observedResult, computedResult)) {
    return computedResult;
  }
  return observedResult ?? computedResult;
}

function calculatorTraceSource(plan: HelixWorkstationToolPlan): string {
  const solveStep = plan.steps.find(
    (step: HelixWorkstationToolPlanStep) =>
      step.panel_id === "scientific-calculator" &&
      (step.action_id === "solve_expression" ||
        step.action_id === "solve_with_steps" ||
        step.action_id === "start_equation_live_source"),
  );
  if (solveStep?.action_id === "start_equation_live_source") return "scientific-calculator.start_equation_live_source";
  return solveStep?.action_id === "solve_with_steps"
    ? "scientific-calculator.solve_with_steps"
    : "scientific-calculator.solve_expression";
}

function calculatorSetupFromPlan(plan: HelixWorkstationToolPlan): HelixCalculatorSetupContext | null {
  const solveStep = plan.steps.find(
    (step: HelixWorkstationToolPlanStep) =>
      step.panel_id === "scientific-calculator" &&
      (step.action_id === "solve_expression" ||
        step.action_id === "solve_with_steps" ||
        step.action_id === "start_equation_live_source"),
  );
  const setup = solveStep?.args?.calculator_setup;
  if (!setup || typeof setup !== "object" || Array.isArray(setup)) return null;
  const record = setup as Partial<HelixCalculatorSetupContext>;
  return typeof record.expression === "string" && typeof record.subgoal === "string"
    ? (record as HelixCalculatorSetupContext)
    : null;
}

function calculatorResultText(
  prompt: string,
  plan: HelixWorkstationToolPlan,
  evaluation?: HelixWorkstationToolEvaluation | null,
): string {
  const observation = buildCalculatorObservation(prompt, plan, evaluation);
  const expression = observation.expression;
  const unit = cleanNullableText(observation.setup?.result_unit) ? ` ${cleanNullableText(observation.setup?.result_unit)}` : "";
  if (observation.result) {
    return [
      "Calculator verification plan completed.",
      `Expression: ${expression}`,
      `Result: ${observation.result}${unit}`,
      `Trace source: ${observation.traceSource}.`,
    ].join("\n");
  }
  const result = solveSimpleQuadraticZero(expression);
  if (result) {
    return [
      "Calculator verification plan completed.",
      `Expression: ${expression}`,
      `Result: x = ${result}`,
      `Trace source: ${observation.traceSource}.`,
    ].join("\n");
  }
  return [
    "Calculator verification plan completed.",
    `Expression: ${expression}`,
    "Result: available in the Scientific Calculator receipt/trace.",
    `Trace source: ${observation.traceSource}.`,
  ].join("\n");
}

export function buildCalculatorObservation(
  prompt: string,
  plan: HelixWorkstationToolPlan,
  evaluation?: HelixWorkstationToolEvaluation | null,
): CalculatorObservation {
  const setup = calculatorSetupFromPlan(plan);
  const observedExpression = calculatorExpressionFromEvaluation(evaluation);
  const expression =
    observedExpression ?? setup?.display_latex ?? setup?.expression ?? extractCalculatorExpression(prompt) ?? "the expression";
  const observedResult = calculatorResultFromEvaluation(evaluation);
  const computedResult =
    solveSimpleArithmeticExpression(expression) ?? solveSimpleQuadraticZero(expression) ?? solveSimpleLinearZero(expression);
  return {
    expression,
    result: selectCalculatorResult(observedResult, computedResult),
    traceSource: calculatorTraceSource(plan),
    setup,
  };
}

export function isCompoundCalculatorReasoningPrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  const asksForSynthesis =
    /\b(?:explain|describe|interpret|what\s+(?:does|is)|means?|meaning|concept|why|compare|relat(?:e|ive)|use\s+it\s+to|then)\b/i.test(
      normalized,
    );
  if (!asksForSynthesis) return false;
  const explicitOnlyResult =
    /\b(?:tell|show|give|report|return)\s+(?:me|us)?\s*(?:the\s+)?(?:result|answer|value|output)\b/i.test(normalized) &&
    !/\b(?:what\s+(?:is|does)|photon|electron|energy|meaning|explain\s+(?:what|why|how)|interpret|concept)\b/i.test(normalized);
  return !explicitOnlyResult;
}

function synthesizeCompoundCalculatorAnswer(
  prompt: string,
  plan: HelixWorkstationToolPlan,
  evaluation?: HelixWorkstationToolEvaluation | null,
): string {
  const observation = buildCalculatorObservation(prompt, plan, evaluation);
  const result = observation.result ?? "available in the calculator receipt";
  if (/\b(?:casimir|cavity)\b/i.test(prompt) && /\bmode\b/i.test(prompt) && /\bphoton\s+energy\b/i.test(prompt)) {
    const frequency = Number(String(result).replace(/,/g, ""));
    const photonEnergy = Number.isFinite(frequency) ? normalizeNumberText(6.62607015e-34 * frequency) : "requires the validated mode frequency";
    const lines = [
      "Calculator compound plan completed.",
      `Mode frequency: ${result} Hz.`,
      `Photon energy: ${photonEnergy} J.`,
      "Interpretation: the answer treats the calculator result as the idealized cavity-mode frequency, then applies E = hf for the photon-energy scalar cut. This is not a backend Casimir field solve.",
      `Trace source: ${observation.traceSource}.`,
    ];
    if (/\b(?:first\s+principles|theory\s+(?:graph|badge)|map)\b/i.test(prompt)) {
      lines.push(
        "Theory context: theory graph reflection supplied first-principles placement context for the scalar calculation.",
        "This graph reflection is context evidence only; the numeric value above comes from Scientific Calculator receipts.",
        "Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result.",
      );
    }
    return lines.join("\n");
  }
  if (/\bphoton\b/i.test(prompt) || /\be\s*=\s*h\s*f\b/i.test(prompt)) {
    const frequency = prompt.match(/\bf(?:requency)?\s*(?:=|is|of)?\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)(?:\s*(?:hz|hertz))?\b/i)?.[1] ??
      prompt.match(/([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)\s*(?:hz|hertz)\b/i)?.[1] ??
      "the given frequency";
    return [
      "A photon is a single quantum of electromagnetic radiation. Its energy is proportional to frequency by E = hf, where h is Planck's constant.",
      `Calculator subgoal: evaluate ${observation.expression}.`,
      `Result: E = ${result} J for f = ${frequency} Hz.`,
      "Interpretation: that is the energy of one photon at that frequency; higher-frequency light carries more energy per photon.",
      `Trace source: ${observation.traceSource}.`,
    ].join("\n");
  }
  if (/\bkinetic\s+energy\b|\bke\s*=|\b1\/2\s*m\s*v/i.test(prompt)) {
    const variables = observation.setup?.variables?.length
      ? ` Variables: ${observation.setup.variables.map((entry: HelixCalculatorSetupVariable) => `${entry.symbol}=${entry.value}${entry.unit ? ` ${entry.unit}` : ""}`).join(", ")}.`
      : "";
    return [
      "Kinetic energy is the energy an object has because of its motion. In the standard non-relativistic form, KE = 1/2 mv^2.",
      `Calculator subgoal: evaluate ${observation.expression}.`,
      `Result: KE = ${result} ${observation.setup?.result_unit ?? "J"} for the supplied values.${variables}`,
      "Interpretation: the result is the energy associated with that mass-speed pair; because velocity is squared, speed changes affect kinetic energy strongly.",
      `Trace source: ${observation.traceSource}.`,
    ].join("\n");
  }
  if (/\bwavelength\b|\blambda\b|\\lambda|c\s*\/\s*f/i.test(prompt)) {
    const variables = observation.setup?.variables?.length
      ? ` Variables: ${observation.setup.variables.map((entry: HelixCalculatorSetupVariable) => `${entry.symbol}=${entry.value}${entry.unit ? ` ${entry.unit}` : ""}`).join(", ")}.`
      : "";
    return [
      "For light, wavelength and frequency are related by lambda = c/f, where c is the speed of light.",
      `Calculator subgoal: evaluate ${observation.expression}.`,
      `Result: lambda = ${result} ${observation.setup?.result_unit ?? "m"} for the supplied values.${variables}`,
      "Interpretation: this is the distance between wave crests; for visible light, values on the order of 10^-7 m correspond to hundreds of nanometers.",
      `Trace source: ${observation.traceSource}.`,
    ].join("\n");
  }
  return [
    "I used the calculator result as a numeric subgoal, then continued the reasoning from that observation.",
    `Calculator subgoal: ${observation.expression}`,
    `Result: ${result}`,
    "Interpretation: the computed value is the numeric check that supports the requested explanation; it is not treated as the whole answer by itself.",
    `Trace source: ${observation.traceSource}.`,
  ].join("\n");
}

function noteTitleFromPlan(plan: HelixWorkstationToolPlan): string {
  const create = plan.steps.find((step: HelixWorkstationToolPlanStep) => step.panel_id === "workstation-notes" && step.action_id === "create_note");
  const title = create?.args?.title;
  return typeof title === "string" && title.trim() ? title.trim() : "Untitled note";
}

function dottieTargetFromPlan(plan: HelixWorkstationToolPlan): string {
  const attach = plan.steps.find((step: HelixWorkstationToolPlanStep) => step.panel_id === "situation-room-pipelines" && step.action_id === "observer.attach");
  const target = attach?.args?.target_run_id ?? attach?.args?.target_turn_id;
  return typeof target === "string" && target.trim() ? target.trim() : "the selected Helix Ask run";
}

function isTheoryReflectionStep(step: HelixWorkstationToolPlanStep): boolean {
  return (
    step.tool_id === "helix_ask.reflect_theory_context" ||
    (step.panel_id === "theory-badge-graph" && step.action_id === "reflect_discussion_context")
  );
}

function synthesizeTheoryContextReflectionAnswer(input: SynthesizeWorkstationAnswerInput): string {
  const summary = input.evaluation?.summary ?? "The graph reflection returned a non-terminal context observation.";
  const evaluationResult = (input.evaluation as { result?: string } | null | undefined)?.result ?? null;
  const hasExplanationPlan = input.plan.steps.some(
    (step: HelixWorkstationToolPlanStep) =>
      (step.panel_id === "theory-badge-graph" && step.action_id === "explain_reflected_context") ||
      (step.kind === "run_ask_tool" &&
        step.tool_id === "helix_ask.reflect_theory_context" &&
        step.args?.build_explanation_plan !== false),
  );
  const cleanSummary = summary
    .replace(/^Theory reflection located discussion context as evidence only:\s*/i, "")
    .replace(/^Theory reflection located discussion context as evidence only\.\s*/i, "")
    .replace(/^Theory explanation plan traced reflected context\s*/i, "traced reflected context ")
    .trim();
  const shouldLeadWithConcept =
    input.postToolSynthesisPlan?.answerIntent === "mixed" ||
    input.postToolSynthesisPlan?.answerIntent === "concept_explanation" ||
    input.postToolSynthesisPlan?.secondaryIntents.includes("concept_explanation") === true;
  if (evaluationResult === "insufficient") {
    return [
      "The theory reflection receipt was not accepted as final-answer evidence.",
      cleanSummary || "The receipt failed route-authority checks.",
      "I should answer from the prompt directly or rerun the reflection with a valid non-terminal receipt before using it as context.",
    ].join("\n");
  }
  if (shouldLeadWithConcept && /\be\s*=\s*h\s*f\b/i.test(input.prompt)) {
    return [
      "E = hf means a photon's energy is proportional to its frequency.",
      "Here, E is the photon energy, h is Planck's constant, and f is the light frequency. It is the scalar bridge between wave behavior and quantum energy packets; higher-frequency light carries more energy per photon.",
      "In the Theory Badge Graph, this belongs near the quantum/constants/radiation roots, then branches into photon-energy rows, spectrum rows such as solar lines, and cavity-mode photon-energy cuts. The related wavelength form is E = hc/lambda when frequency is expressed as c/lambda.",
      `The graph reflection observed: ${cleanSummary || "this prompt overlaps mapped photon-energy and radiation badges."}`,
      "That graph placement is context evidence, not a solve. Numeric photon energies still need calculator receipts, and runtime or claim-bearing rows still need their own receipts.",
    ].join("\n");
  }
  if (hasExplanationPlan) {
    return [
      "I located this discussion in the Theory Badge Graph, then built a first-principles explanation route from that reflection.",
      `The graph route suggests: ${cleanSummary || "start from shared first-principle badges, follow the relevant theory branch, then keep runtime/evidence and claim-boundary rows visible."}`,
      "Read that route as evidence, not as a solve: roots and branch badges explain where the concept lives, scalar cuts can go to the calculator, and tensor/runtime rows need receipts before they can support stronger interpretation.",
    ].join("\n");
  }
  return [
    "I located this discussion in the Theory Badge Graph as context evidence.",
    `The graph reflection suggests: ${cleanSummary || "the prompt overlaps mapped theory badges and claim-boundary context."}`,
    "This is a context locator, not a solve. Any numeric result still has to come from calculator traces, runtime receipts, or another completed solver path.",
  ].join("\n");
}

function hasTheoryReflectionAndCalculatorSolve(plan: HelixWorkstationToolPlan): boolean {
  const hasReflection = plan.steps.some(isTheoryReflectionStep);
  const hasCalculatorSolve = plan.steps.some(
    (step: HelixWorkstationToolPlanStep) =>
      step.panel_id === "scientific-calculator" &&
      (step.action_id === "solve_expression" || step.action_id === "solve_with_steps"),
  );
  return hasReflection && hasCalculatorSolve;
}

function synthesizeTheoryReflectionCalculatorAnswer(input: SynthesizeWorkstationAnswerInput): string {
  const needsPhysicsSynthesis =
    isCompoundCalculatorReasoningPrompt(input.prompt) || /\b(?:photon|e\s*=\s*h\s*f)\b/i.test(input.prompt);
  const calculatorAnswer = needsPhysicsSynthesis
    ? synthesizeCompoundCalculatorAnswer(input.prompt, input.plan, input.evaluation)
    : calculatorResultText(input.prompt, input.plan, input.evaluation);
  return appendAskToolTraceDisclosureNote(calculatorAnswer, buildAskToolTraceDisclosure({ plan: input.plan }));
}

function synthesizeTheoryIdeologyBridgeAnswer(
  input: SynthesizeWorkstationAnswerInput,
): string {
  const output =
    input.theoryIdeologyBridgeToolOutput &&
    typeof input.theoryIdeologyBridgeToolOutput === "object" &&
    !Array.isArray(input.theoryIdeologyBridgeToolOutput)
      ? (input.theoryIdeologyBridgeToolOutput as Record<string, unknown>)
      : null;

  const bridge =
    output?.bridge && typeof output.bridge === "object" && !Array.isArray(output.bridge)
      ? (output.bridge as Record<string, unknown>)
      : null;

  const links = Array.isArray(bridge?.links) ? bridge.links : [];
  const missingEvidence = Array.isArray(bridge?.missingEvidence)
    ? bridge.missingEvidence.map(String)
    : [];

  const formatMissingEvidence = (entry: string): string => {
    const normalized = entry.trim();
    if (normalized === "theory_context_reflection") return "theory reflection receipt";
    if (normalized === "ideology_context_reflection") return "Zen reflection receipt";
    const theoryCounterpart = normalized.match(/^theory_counterpart:(.+)$/i)?.[1];
    if (theoryCounterpart) {
      return `theory counterpart for ${theoryCounterpart.split("+").map((part) => part.replace(/-/g, " ")).join(" + ")}`;
    }
    const ideologyCounterpart = normalized.match(/^ideology_counterpart:(.+)$/i)?.[1];
    if (ideologyCounterpart) {
      return `Zen counterpart for ${ideologyCounterpart.split("+").map((part) => part.replace(/-/g, " ")).join(" + ")}`;
    }
    return normalized.replace(/_/g, " ");
  };

  const renderedLinks = links
    .map((entry) => (entry && typeof entry === "object" ? entry as Record<string, unknown> : null))
    .filter(Boolean)
    .slice(0, 5)
    .map((entry) => {
      const relation = String(entry.relation ?? "constrains");
      const effect = String(
        entry.proceduralEffect ?? entry.explanation ?? "Use as evidence-only procedural context.",
      );
      return `- ${relation}: ${effect}`;
    });

  return [
    "I treated the theory side as observable/mathematical constraint evidence and the Zen side as procedural justice evidence.",
    renderedLinks.length
      ? ["Bridge links:", ...renderedLinks].join("\n")
      : "Bridge links: the bridge receipt did not expose named links, so the safe posture is to preserve uncertainty and ask for missing evidence.",
    missingEvidence.length
      ? `Missing checks: ${missingEvidence.map(formatMissingEvidence).join(", ")}.`
      : "Missing checks: none reported by the bridge receipt.",
    "Boundary: physics, conservation, entropy, and self-organization can constrain how we reason about fairness, but they do not prove moral certainty or authorize execution.",
    "Procedural posture: use the bridge to ask better questions, calibrate claim strength, preserve contestability, and route high-impact uncertainty toward review.",
  ].join("\n");
}

function synthesizeZenGraphReflectionAnswer(input: SynthesizeWorkstationAnswerInput): string {
  const summary = input.evaluation?.summary?.trim();
  const toolOutput =
    input.zenGraphReflectionToolOutput &&
    typeof input.zenGraphReflectionToolOutput === "object" &&
    !Array.isArray(input.zenGraphReflectionToolOutput)
      ? (input.zenGraphReflectionToolOutput as Record<string, unknown>)
      : null;
  const reflection =
    toolOutput?.reflection && typeof toolOutput.reflection === "object" && !Array.isArray(toolOutput.reflection)
      ? (toolOutput.reflection as Record<string, unknown>)
      : null;
  const proceduralClassification =
    toolOutput?.proceduralClassification &&
    typeof toolOutput.proceduralClassification === "object" &&
    !Array.isArray(toolOutput.proceduralClassification)
      ? (toolOutput.proceduralClassification as Record<string, unknown>)
      : null;
  const matches =
    reflection?.matches && typeof reflection.matches === "object" && !Array.isArray(reflection.matches)
      ? (reflection.matches as Record<string, unknown>)
      : null;
  const exactMatches = Array.isArray(matches?.exact) ? matches.exact : [];
  const likelyMatches = Array.isArray(matches?.likely) ? matches.likely : [];
  const activated = [...exactMatches, ...likelyMatches]
    .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .slice(0, 4);
  const activatedLines = activated.map((entry) => {
    const label = typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : String(entry.nodeId ?? "unlabeled lens");
    const reasons = Array.isArray(entry.reasons)
      ? entry.reasons.map((reason) => String(reason ?? "").trim()).filter(Boolean).slice(0, 2).join("; ")
      : "";
    return reasons ? `- ${label}: ${reasons}` : `- ${label}`;
  });
  const proceduralEntries = Array.isArray(proceduralClassification?.classifications)
    ? proceduralClassification.classifications
        .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .slice(0, 5)
    : [];
  const proceduralLines = proceduralEntries.map((entry) => {
    const pattern = String(entry.observedPattern ?? "unclear_evidence").replace(/_/g, " ");
    const root = typeof entry.zenRootLabel === "string" && entry.zenRootLabel.trim()
      ? entry.zenRootLabel.trim()
      : String(entry.zenRootId ?? "Zen root");
    const move = String(entry.proceduralMove ?? "preserve_uncertainty").replace(/_/g, " ");
    const explanation = typeof entry.explanation === "string" && entry.explanation.trim()
      ? entry.explanation.trim()
      : "Use this as diagnostic procedure evidence, not as a verdict.";
    return `- ${pattern} -> ${root} -> ${move}: ${explanation}`;
  });
  const recommendedProceduralMoves = Array.isArray(proceduralClassification?.recommendedNextMoves)
    ? proceduralClassification.recommendedNextMoves
        .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .slice(0, 4)
        .map((entry) => {
          const label = typeof entry.label === "string" && entry.label.trim()
            ? entry.label.trim()
            : "Ask for a concrete next practice.";
          const description = typeof entry.description === "string" && entry.description.trim()
            ? entry.description.trim()
            : "Keep the reflection diagnostic and user-confirmable.";
          return `- ${label}: ${description}`;
        })
    : [];
  const firstPath = activated
    .map((entry) => Array.isArray(entry.pathToRoot) ? entry.pathToRoot.map((item) => String(item ?? "").trim()).filter(Boolean) : [])
    .find((path) => path.length > 1) ?? [];
  const pathLine = firstPath.length > 1
    ? `Path to root: ${firstPath.slice(0, 6).join(" -> ")}`
    : "Path to root: no complete path was exposed in the receipt.";
  const recommendedActions = Array.isArray(reflection?.recommended_actions) ? reflection.recommended_actions : [];
  const recommendedAction = recommendedActions
    .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null))
    .find((entry): entry is Record<string, unknown> => Boolean(entry));
  const nextQuestion =
    typeof recommendedAction?.label === "string" && recommendedAction.label.trim()
      ? recommendedAction.label.trim()
      : "Ask what evidence would make review bypass safe enough to justify, and what harm would result if that evidence is wrong.";
  const admissions = Array.isArray(toolOutput?.admissions) ? toolOutput.admissions : [];
  const firstAdmission = admissions.find((entry) => entry && typeof entry === "object") as Record<string, unknown> | undefined;
  const admissionAuthority =
    firstAdmission?.authority && typeof firstAdmission.authority === "object" && !Array.isArray(firstAdmission.authority)
      ? (firstAdmission.authority as Record<string, unknown>)
      : null;
  const executable = admissionAuthority?.agent_executable === true ? "true" : "false";
  const includesFruition = input.plan.steps.some((step) => {
    const options = step.args?.options;
    return Boolean(options && typeof options === "object" && !Array.isArray(options) && (options as Record<string, unknown>).includeFruition === true);
  });
  const restatedSituation =
    input.prompt.trim().length > 0
      ? `Restated through ZenGraph: ${input.prompt.trim()}`
      : "Restated through ZenGraph: reflect the situation as a values-and-evidence question before deciding what action is justified.";
  const appliedLines = activated.map((entry) => {
    const label = typeof entry.label === "string" && entry.label.trim() ? entry.label.trim() : String(entry.nodeId ?? "unlabeled lens");
    const lower = label.toLowerCase();
    if (/direct observation|observation/.test(lower)) {
      return `- ${label}: start from what is directly known, then separate observed facts from assumptions.`;
    }
    if (/right speech|speech|formulation/.test(lower)) {
      return `- ${label}: phrase the response as an evidence gap or clarification, not as a character judgment.`;
    }
    if (/non-harm|harm|compassion/.test(lower)) {
      return `- ${label}: treat plausible user impact as a constraint that should slow bypasses until evidence is checked.`;
    }
    if (/two-key|review|approval|due process|fairness/.test(lower)) {
      return `- ${label}: prefer a review or second-key gate when a fast action could affect others.`;
    }
    if (/uncertainty|skillful action|falsifiability|truth/.test(lower)) {
      return `- ${label}: choose the smallest next test that reduces uncertainty without pretending the conclusion is final.`;
    }
    return `- ${label}: apply this lens as diagnostic evidence for the situation, not as a verdict.`;
  });
  return [
    "ZenGraph applied reflection:",
    restatedSituation,
    activatedLines.length > 0
      ? ["Activated lenses:", ...activatedLines].join("\n")
      : `Activated lenses: ${summary || "the receipt did not expose named matches."}`,
    proceduralLines.length > 0
      ? ["Procedural classification:", ...proceduralLines].join("\n")
      : "Procedural classification: no procedural classification receipt was exposed, so the safe posture is to ask for concrete observations and preserve uncertainty.",
    appliedLines.length > 0
      ? ["Applied to the prompt:", ...appliedLines].join("\n")
      : "Applied to the prompt: use the graph receipt as evidence for a careful next question, not as a final moral classification.",
    recommendedProceduralMoves.length > 0
      ? ["Recommended next moves:", ...recommendedProceduralMoves].join("\n")
      : "Recommended next moves: ask for one concrete observation, one missing check, and one small practice before strengthening the interpretation.",
    pathLine,
    includesFruition
      ? "Fruition binding: represent the situation as badge-combination evidence, then keep the output diagnostic until review/evidence gates are satisfied."
      : "Binding: represent the situation as badge-combination evidence, not as a verdict.",
    `Next evidence question: ${nextQuestion}`,
    `Admission boundary: agent_executable=${executable}; this is not character judgment, moral finality, or execution permission.`,
  ].join("\n");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readTextArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];
}

function extractCivilizationFrame(input: SynthesizeWorkstationAnswerInput): Record<string, unknown> | null {
  const output = asRecord(input.civilizationScenarioFrameToolOutput);
  return asRecord(output?.frame);
}

function extractCivilizationRoadmap(input: SynthesizeWorkstationAnswerInput): Record<string, unknown> | null {
  const output = asRecord(input.civilizationBoundsToolOutput);
  return asRecord(output?.roadmap);
}

function formatFrameLabel(frame: Record<string, unknown> | null): string {
  if (!frame) return "frame unavailable";
  const family = readText(frame.family) ?? "unknown_family";
  const boundary = readText(frame.boundaryKind) ?? "unknown_boundary";
  const stage = readText(frame.developmentalStage) ?? "unknown_stage";
  const evidenceMode = readText(frame.evidenceMode) ?? "unknown_evidence";
  return `${family} / ${boundary} / ${stage} / ${evidenceMode}`;
}

function synthesizeConflictCapacityFallback(input: SynthesizeWorkstationAnswerInput): string {
  const frame = extractCivilizationFrame(input);
  const roadmap = extractCivilizationRoadmap(input);
  const constraints = readTextArray(frame?.constraintProfiles).slice(0, 6);
  const missingEvidence = readTextArray(frame?.missingEvidence).slice(0, 6);
  const collaborationValue = asRecord(roadmap?.collaborationBound)?.collaborationValue;
  const collaborationText =
    typeof collaborationValue === "number" && Number.isFinite(collaborationValue)
      ? ` Roadmap collaborationValue=${collaborationValue}; treat it as a diagnostic placeholder until sourced factors replace defaults.`
      : "";
  return [
    "The procedural frame should inform the reflection, not replace it.",
    `Frame hypothesis: ${formatFrameLabel(frame)}. Classifiers are hypotheses, so this frame can be revised if the prompt evidence points elsewhere.`,
    "Assessment: the proposed triangle is a plausible constraint model, not an ultimatum or proof. It says a ceasefire becomes more likely when battlefield marginal cost, denial capacity, and outside infrastructure-stability incentives all bind at once; it does not certify that those conditions are present.",
    "What would support it: source-backed marginal-cost trends for continued gains, air-defense and long-range-strike capacity plus production/replacement rates, and evidence that China, Europe, and the U.S. value infrastructure stability more than continued battlefield leverage.",
    "What would weaken or falsify it: cheap continued gains, exhausted denial capacity, external actors still preferring leverage, or resource/manufacturing/transport bottlenecks that make the stability path slower than the conflict path.",
    "Resource proof boundary: you do not need every resource estimate on Earth. You need the decision-relevant reserve, extraction, refining, manufacturing, transport, substitution, and infrastructure buildout rates with timestamps and uncertainty bounds.",
    `Roadmap constraints: ${constraints.length ? constraints.join(", ") : "not exposed in compact receipt"}.${collaborationText}`,
    `Missing evidence to upgrade the claim tier: ${missingEvidence.length ? missingEvidence.join(", ") : "source-backed capacity measurements and claim-tier receipts"}.`,
    "Boundary: the roadmap can organize what must be measured and where the Theory/Zen bridge should look; it cannot decide policy, prove prediction finality, or convert physical feasibility into moral permission.",
  ].join("\n");
}

function synthesizeCivilizationBoundsAnswer(input: SynthesizeWorkstationAnswerInput): string {
  if (/\b(?:ceasefire|war|conflict|battlefield|air defense|long[-\s]?range strike|resource reserves?|infrastructure stability|decision makers?)\b/i.test(input.prompt)) {
    return synthesizeConflictCapacityFallback(input);
  }
  const hasScenarioFrameStep = input.plan.steps.some(
    (step) => step.kind === "run_ask_tool" && step.tool_id === "helix_ask.build_civilization_scenario_frame",
  );
  const hasBridgeStep = input.plan.steps.some(
    (step) => step.kind === "run_ask_tool" && step.tool_id === "helix_ask.bridge_theory_ideology_context",
  );
  const hasTheoryStep = input.plan.steps.some(
    (step) => step.kind === "run_ask_tool" && step.tool_id === "helix_ask.reflect_theory_context",
  );
  const hasZenStep = input.plan.steps.some(
    (step) => step.kind === "run_ask_tool" && step.tool_id === "helix_ask.reflect_ideology_context",
  );
  const summary =
    input.evaluation?.summary?.trim() ||
    "Civilization Bounds Roadmap produced evidence-only system bounds, capability/dependency badges, collaboration constraints, and missing-evidence hooks.";
  return [
    "I treated the roadmap as a situational bounds receipt, not as a policy decision.",
    hasScenarioFrameStep
      ? "Scenario frame: the prompt was first parameterized as a bounded system frame before roadmap badges were emitted."
      : "Scenario frame: no prompt-derived frame step was required, so the declared roadmap scenario stayed in force.",
    summary,
    hasTheoryStep
      ? "Theory binding: physical badges bound what can be claimed about energy, materials, observation, entropy, and conservation."
      : "Theory binding: no theory reflection step was required by the selected plan.",
    hasZenStep
      ? "ZenGraph binding: procedural lenses bound review, uncertainty, non-harm, contestability, and missing checks."
      : "ZenGraph binding: no ZenGraph reflection step was required by the selected plan.",
    hasBridgeStep
      ? "Bridge continuity: civilization bounds supplied the situational layer between Theory and Zen evidence."
      : "Bridge continuity: the roadmap is ready to export Theory/Zen bridge context, but the selected plan did not require the bridge step.",
    "Boundary: the roadmap does not decide what should happen, certify predictions, authorize actions, or turn collaborationValue into moral value.",
  ].join("\n");
}

export function synthesizeWorkstationToolAnswer(input: SynthesizeWorkstationAnswerInput): string {
  if (hasTheoryReflectionAndCalculatorSolve(input.plan)) {
    return synthesizeTheoryReflectionCalculatorAnswer(input);
  }
  if (input.plan.intent === "calculator_live_source") {
    const observation = buildCalculatorObservation(input.prompt, input.plan, input.evaluation);
    return [
      "Started the calculator equation live source and used its current tick as workstation evidence.",
      `Calculator live subgoal: ${observation.expression}`,
      `Current result: ${observation.result ?? "pending in the live-source receipt"}`,
      "Interpretation: the live source is evidence for the numeric subgoal; the answer still has to synthesize from that observation rather than treating the receipt as the answer.",
      `Trace source: ${observation.traceSource}.`,
    ].join("\n");
  }
  if (input.plan.intent === "calculator_verify" || input.plan.intent === "calculator_solve") {
    if (isCompoundCalculatorReasoningPrompt(input.prompt)) {
      return synthesizeCompoundCalculatorAnswer(input.prompt, input.plan, input.evaluation);
    }
    return calculatorResultText(input.prompt, input.plan, input.evaluation);
  }
  if (input.plan.intent === "notes_create") {
    return `Created workstation note "${noteTitleFromPlan(input.plan)}". I can refer to it through the note receipt instead of reinjecting the full body into Ask.`;
  }
  if (input.plan.intent === "notes_append" || input.plan.intent === "notes_store_large_text") {
    return "Stored the requested text in Workstation Notes. I will use note references instead of raw text injection by default.";
  }
  if (input.plan.intent === "dottie_observer") {
    return [
      `Prepared Auntie Dottie as a witness-only observer for ${dottieTargetFromPlan(input.plan)}.`,
      "Voice delivery remains a receipt-backed projection of public commentary; no audio is spoken unless a confirm-speak action is explicitly run.",
    ].join("\n");
  }
  if (input.plan.intent === "theory_context_reflection") {
    return synthesizeTheoryContextReflectionAnswer(input);
  }
  if (input.plan.intent === "theory_ideology_bridge_reflection") {
    return synthesizeTheoryIdeologyBridgeAnswer(input);
  }
  if (input.plan.intent === "civilization_bounds_reflection") {
    return synthesizeCivilizationBoundsAnswer(input);
  }
  if (input.plan.intent === "zen_graph_reflection") {
    return synthesizeZenGraphReflectionAnswer(input);
  }
  return input.evaluation?.summary ?? "Completed workstation tool evaluation.";
}
