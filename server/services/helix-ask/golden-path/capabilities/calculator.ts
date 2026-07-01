import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readString,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathCalculatorDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathCalculatorSolveRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    /\b(?:scientific\s+calculator|calculator)\b[\s\S]{0,120}\b(?:solve|evaluate|calculate|compute)\b/.test(prompt) ||
    /\b(?:solve|evaluate|calculate|compute)\b[\s\S]{0,120}\b(?:scientific\s+calculator|calculator)\b/.test(prompt)
  );
};

const normalizeCalculatorExpression = (value: string): string =>
  value.trim().replace(/[;,.!?]+$/g, "").replace(/\s+/g, " ");

const extractCalculatorMathTokenSequence = (value: string): string | null => {
  const source = value.trim();
  let start = -1;
  for (let index = 0; index < source.length; index += 1) {
    const rest = source.slice(index);
    if (
      /^[\d(]/.test(rest) ||
      /^\.\d/.test(rest) ||
      /^(?:sqrt|ln|log|sin|cos|tan|pi|e)\b/i.test(rest)
    ) {
      start = index;
      break;
    }
  }
  if (start < 0) return null;
  let index = start;
  let candidate = "";
  while (index < source.length) {
    const rest = source.slice(index);
    const numberMatch = rest.match(/^\d+(?:\.\d+)?(?:e[+\-]?\d+)?|^\.\d+(?:e[+\-]?\d+)?/i);
    if (numberMatch?.[0]) {
      candidate += numberMatch[0];
      index += numberMatch[0].length;
      continue;
    }
    const wordMatch = rest.match(/^(?:sqrt|ln|log|sin|cos|tan|pi|e)\b/i);
    if (wordMatch?.[0]) {
      candidate += wordMatch[0];
      index += wordMatch[0].length;
      continue;
    }
    const char = source[index] ?? "";
    if (/[()+\-*/^%,]/.test(char)) {
      candidate += char;
      index += 1;
      continue;
    }
    if (/\s/.test(char)) {
      candidate += char;
      index += 1;
      continue;
    }
    break;
  }
  const expression = normalizeCalculatorExpression(candidate);
  return /\d|\b(?:sqrt|ln|log|sin|cos|tan|pi|e)\b/i.test(expression) &&
    /[+\-*/^%()]|\b(?:sqrt|ln|log|sin|cos|tan)\b/i.test(expression)
    ? expression
    : null;
};

const extractNaturalCalculatorExpression = (value: string): string | null => {
  const normalized = normalizeCalculatorExpression(value)
    .replace(/\bhelix_ask_golden_path_runtime\b/gi, " ")
    .replace(/\buse\s+scientific-calculator\.solve_expression\b/gi, " ")
    .replace(/\bscientific-calculator\.solve_expression\b/gi, " ")
    .replace(/\b(?:please|can you|could you|would you)\b/gi, " ")
    .trim();
  const cueMatch = normalized.match(
    /\b(?:with\s+this\s+exact\s+expression|with\s+expression|this\s+exact\s+expression|expression\s+is|calculate|evaluate|compute|solve|expression|with)\b\s*:?\s*([\s\S]+)$/i,
  );
  const boundedCueExpression = cueMatch?.[1] ? extractCalculatorMathTokenSequence(cueMatch[1]) : null;
  if (boundedCueExpression) return boundedCueExpression;
  const boundedExpression = extractCalculatorMathTokenSequence(normalized);
  if (boundedExpression) return boundedExpression;
  const afterIntent = normalized.match(
    /\b(?:calculate|evaluate|compute|solve|expression(?:\s+is)?|with)\b\s*:?\s*([0-9eEpiPI().+\-*/^%,\s]+)$/i,
  );
  const candidate = afterIntent?.[1] ?? normalized.match(/([0-9eEpiPI().+\-*/^%,\s]{3,})$/i)?.[1];
  if (candidate) return normalizeCalculatorExpression(candidate);
  return null;
};

export const readCalculatorExpression = (body: RecordLike): string | null => {
  const direct =
    readString(body.calculator_expression) ??
    readString(body.calculatorExpression) ??
    readString(body.expression) ??
    readString(body.solve_expression) ??
    readString(body.solveExpression);
  if (direct) return normalizeCalculatorExpression(direct);
  const prompt = readHelixAskGoldenPathPrompt(body);
  const exactMatch = prompt.match(/\b(?:exact\s+)?expression\s*:\s*([^\n\r]+)/i);
  if (exactMatch?.[1]) {
    return extractNaturalCalculatorExpression(exactMatch[1]) ?? normalizeCalculatorExpression(exactMatch[1]);
  }
  const capabilityMatch = prompt.match(
    /scientific-calculator\.solve_expression(?:\s+with)?(?:\s+this\s+exact\s+expression)?\s*:?\s*([^\n\r]+)/i,
  );
  if (capabilityMatch?.[1]) {
    return extractNaturalCalculatorExpression(capabilityMatch[1]);
  }
  const naturalExpression = extractNaturalCalculatorExpression(prompt);
  if (naturalExpression) return naturalExpression;
  const compactMath = prompt.match(/((?:sqrt|ln|log|sin|cos|tan|pi|e|\d|\(|\)|\+|\-|\*|\/|\^|\s|\.){3,})/i);
  return compactMath?.[1] ? normalizeCalculatorExpression(compactMath[1]) : null;
};

export const evaluateGoldenPathCalculatorExpression = (expression: string): number | null => {
  const normalized = expression
    .replace(/\^/g, "**")
    .replace(/\blog\s*\(/gi, "Math.log10(")
    .replace(/\bln\s*\(/gi, "Math.log(")
    .replace(/\bsqrt\s*\(/gi, "Math.sqrt(")
    .replace(/\bsin\s*\(/gi, "Math.sin(")
    .replace(/\bcos\s*\(/gi, "Math.cos(")
    .replace(/\btan\s*\(/gi, "Math.tan(")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/g, "Math.E");
  if (!/^[0-9eE+\-*/().,\sMathlogsqrtincotaPIE]+$/.test(normalized)) return null;
  try {
    const value = Function(`"use strict"; return (${normalized});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

export const formatGoldenPathNumber = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  const rounded = Number(value.toPrecision(12));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

export const buildHelixAskGoldenPathCalculatorSolvePayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCalculatorDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-calculator",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "workstation_tool_evaluation";
  const goalKind = "calculator_solve";

  const makeFailurePayload = (params: {
    errorCode: "missing_calculator_expression" | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike =>
    buildGoldenPathCapabilityTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      goalKind,
      classifierReasons: ["explicit_calculator_solve_request"],
      requestedCapability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      sourceTarget: "calculator",
      family: "calculator",
      requiredObservationKinds: ["calculator_receipt", "workstation_tool_evaluation"],
      status: "calculator_solve_failed",
      route: "golden_path_runtime / calculator_solve",
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
      hashGoalFrame: args.deps.hashGoalFrame,
    });

  const expression = readCalculatorExpression(args.body);
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path calculator turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path calculator turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const observationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:workstation_tool_evaluation`;
  const resultText = formatGoldenPathNumber(result);
  const answerText = [
    "Calculator verification plan completed.",
    `Expression: ${expression}`,
    `Result: ${resultText}`,
    `Trace source: ${HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY}.`,
  ].join("\n");
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };

  return buildGoldenPathCapabilitySuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId,
    terminalArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind,
    sourceTarget: "calculator",
    family: "calculator",
    planArgs: { expression },
    classifierReasons: ["explicit_calculator_solve_request"],
    allowsWorkspaceContext: false,
    requestedCapability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    observedArtifactKind: "calculator_receipt",
    observationPayload: calculatorReceipt,
    terminalPayloadField: "workstation_tool_evaluation",
    terminalPayloadSchema: "helix.workstation_tool_evaluation.v1",
    terminalPayloadExtra: {
      capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      expression,
      result,
      result_text: resultText,
      trace_source: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    },
    answerText,
    status: "calculator_solve",
    route: "golden_path_runtime / calculator_solve",
    includeRuntimeRouteGate: false,
    includeRuntimeLegacyFallbackPossibleWhenUnhandled: false,
    requiredObservationKinds: ["calculator_receipt", "workstation_tool_evaluation"],
    answerLedgerExtraPayload: {
      expression,
      result,
      result_text: resultText,
    },
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};


export const requiredObservationKinds = ["calculator_receipt"] as const;
export const requiredTerminalKinds = ["workstation_tool_evaluation"] as const;
export const isRequested = isHelixAskGoldenPathCalculatorSolveRequested;
export const buildPayload = buildHelixAskGoldenPathCalculatorSolvePayload;
