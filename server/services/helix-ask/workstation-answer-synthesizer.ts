import { extractCalculatorExpression } from "./workstation-tool-planner";
import { appendAskToolTraceDisclosureNote, buildAskToolTraceDisclosure } from "./tool-trace-disclosure";
import type { HelixWorkstationToolPlan, HelixWorkstationToolPlanStep } from "../../../shared/helix-workstation-tool-plan";
import type { HelixWorkstationToolEvaluation } from "../../../shared/helix-workstation-tool-evaluation";
import type { HelixCalculatorSetupContext, HelixCalculatorSetupVariable } from "../../../shared/helix-calculator-setup-context";

export type SynthesizeWorkstationAnswerInput = {
  prompt: string;
  plan: HelixWorkstationToolPlan;
  evaluation?: HelixWorkstationToolEvaluation | null;
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

function calculatorResultText(prompt: string, plan: HelixWorkstationToolPlan): string {
  const observation = buildCalculatorObservation(prompt, plan);
  const expression = observation.expression;
  const unit = observation.setup?.result_unit ? ` ${observation.setup.result_unit}` : "";
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

export function buildCalculatorObservation(prompt: string, plan: HelixWorkstationToolPlan): CalculatorObservation {
  const setup = calculatorSetupFromPlan(plan);
  const expression = setup?.display_latex ?? setup?.expression ?? extractCalculatorExpression(prompt) ?? "the expression";
  return {
    expression,
    result: solveSimpleArithmeticExpression(expression) ?? solveSimpleQuadraticZero(expression) ?? solveSimpleLinearZero(expression),
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

function synthesizeCompoundCalculatorAnswer(prompt: string, plan: HelixWorkstationToolPlan): string {
  const observation = buildCalculatorObservation(prompt, plan);
  const result = observation.result ?? "available in the calculator receipt";
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

function ideologyMotiveFromPlan(plan: HelixWorkstationToolPlan): string {
  const compare = plan.steps.find((step: HelixWorkstationToolPlanStep) => step.panel_id === "mission-ethos" && step.action_id === "compare_motive_to_zen");
  const motive = compare?.args?.motive;
  return typeof motive === "string" && motive.trim() ? motive.trim() : "the provided motive";
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
  if (evaluationResult === "insufficient") {
    return [
      "The theory reflection receipt was not accepted as final-answer evidence.",
      cleanSummary || "The receipt failed route-authority checks.",
      "I should answer from the prompt directly or rerun the reflection with a valid non-terminal receipt before using it as context.",
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
    ? synthesizeCompoundCalculatorAnswer(input.prompt, input.plan)
    : calculatorResultText(input.prompt, input.plan);
  return appendAskToolTraceDisclosureNote(calculatorAnswer, buildAskToolTraceDisclosure({ plan: input.plan }));
}

export function synthesizeWorkstationToolAnswer(input: SynthesizeWorkstationAnswerInput): string {
  if (hasTheoryReflectionAndCalculatorSolve(input.plan)) {
    return synthesizeTheoryReflectionCalculatorAnswer(input);
  }
  if (input.plan.intent === "calculator_live_source") {
    const observation = buildCalculatorObservation(input.prompt, input.plan);
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
      return synthesizeCompoundCalculatorAnswer(input.prompt, input.plan);
    }
    return calculatorResultText(input.prompt, input.plan);
  }
  if (input.plan.intent === "notes_create") {
    return `Created workstation note "${noteTitleFromPlan(input.plan)}". I can refer to it through the note receipt instead of reinjecting the full body into Ask.`;
  }
  if (input.plan.intent === "notes_append" || input.plan.intent === "notes_store_large_text") {
    return "Stored the requested text in Workstation Notes. I will use note references instead of raw text injection by default.";
  }
  if (input.plan.intent === "ideology_compare") {
    return [
      `Ran the ideology comparison tool for: ${ideologyMotiveFromPlan(input.plan)}`,
      "Use the Mission Ethos / Zen receipt as compact evidence, then synthesize the motive comparison from that evidence.",
    ].join("\n");
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
  return input.evaluation?.summary ?? "Completed workstation tool evaluation.";
}
