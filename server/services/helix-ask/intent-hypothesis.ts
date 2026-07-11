import crypto from "node:crypto";
import type { HelixPromptInterpretation } from "./prompt-interpretation";

export type HelixIntentKind =
  | "content_question"
  | "control_command"
  | "status_question"
  | "debug_diagnosis"
  | "implementation_question"
  | "procedure_memory_question"
  | "repo_evidence_question"
  | "general_reasoning";

export type HelixIntentHypothesis = {
  schema: "helix.intent_hypothesis.v1";
  id: string;
  kind: HelixIntentKind;
  candidate_route?: string;
  candidate_source_target?: string;
  confidence: number;
  supporting_prompt_spans: string[];
  contrary_prompt_spans: string[];
  evidence_needed: string[];
  tool_needed: string[];
  why_this_is_not_enough_to_answer: string;
  risk_if_wrong: string;
  terminal_products_allowed: string[];
  terminal_products_forbidden: string[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixRouteCandidateForIntent = {
  route: string;
  confidence?: number | null;
  reason?: string | null;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const spanMatches = (promptText: string, patterns: RegExp[]): string[] =>
  unique(patterns.map((pattern) => promptText.match(pattern)?.[0]?.trim() ?? "").filter(Boolean));

const visualPatterns = [
  /\b(?:review|explain|describe|summari[sz]e|compare|what(?:'s|\s+is)?|what\s+changed|look\s+at|see|seeing)\b[\s\S]{0,140}\b(?:screen|screenshot|capture|visual|frame|window|tab|image|picture)\b/i,
  /\b(?:screen|screenshot|capture|visual|frame|window|tab|image|picture)\b[\s\S]{0,140}\b(?:show|shows|showing|seeing|visible|happening|changed)\b/i,
];

const procedurePatterns = [
  /\b(?:what\s+changed|since\s+(?:the\s+)?(?:previous|last)\s+(?:visual|capture|frame|scene)|compare\s+(?:this|current)|replay|earlier|previous\s+(?:visual|capture|frame|scene))\b/i,
];

const repoPatterns = [
  /\b(?:repo|repository|code|source\s+file|implementation|where\s+(?:is|was).*(?:enforced|defined)|function|module)\b/i,
];

const routeForKind = (kind: HelixIntentKind, routeCandidates: HelixRouteCandidateForIntent[], selectedRoute?: string): string | undefined => {
  const routes = routeCandidates.map((entry) => entry.route);
  if (kind === "control_command") return routes.find((route) => /live_pipeline_control|workspace_action/i.test(route)) ?? selectedRoute;
  if (kind === "content_question") return routes.find((route) => /situation_context|visual|content/i.test(route)) ?? selectedRoute;
  if (kind === "debug_diagnosis") return routes.find((route) => /debug|runtime|diagnos/i.test(route)) ?? selectedRoute;
  if (kind === "repo_evidence_question") return routes.find((route) => /repo|code/i.test(route)) ?? selectedRoute;
  if (kind === "procedure_memory_question") return routes.find((route) => /procedure|epoch|memory/i.test(route)) ?? selectedRoute;
  return selectedRoute || routes[0];
};

const confidenceFor = (
  kind: HelixIntentKind,
  promptInterpretation: HelixPromptInterpretation,
  routeCandidates: HelixRouteCandidateForIntent[],
  selectedRoute?: string,
): number => {
  const route = routeForKind(kind, routeCandidates, selectedRoute);
  const routeConfidence = routeCandidates.find((entry) => entry.route === route)?.confidence;
  if (typeof routeConfidence === "number" && Number.isFinite(routeConfidence)) return routeConfidence;
  if (kind === "content_question" && promptInterpretation.content_question_detected) return 0.9;
  if (kind === "control_command" && promptInterpretation.executable_operator_commands.length > 0) return 0.88;
  if (kind === "debug_diagnosis" && promptInterpretation.debug_or_history_question_detected) return 0.86;
  if (kind === "status_question" && promptInterpretation.status_question_detected) return 0.74;
  return 0.45;
};

const sourceTargetForKind = (kind: HelixIntentKind, fallback: string): string => {
  if (kind === "content_question") return /unknown/i.test(fallback) ? "visual_capture" : fallback;
  if (kind === "control_command") return /^(?:calculator_stream|workspace_panel|workstation_state)$/i.test(fallback) ? fallback : "live_pipeline";
  if (kind === "debug_diagnosis") return "runtime_evidence";
  if (kind === "repo_evidence_question" || kind === "implementation_question") return "repo_code";
  if (kind === "procedure_memory_question") return "procedure_memory";
  return fallback || "unknown";
};

const evidenceNeededFor = (kind: HelixIntentKind, sourceTarget: string): string[] => {
  if (kind === "control_command") return [];
  if (kind === "general_reasoning") return [];
  return [sourceTarget || "admitted_source"];
};

const toolNeededFor = (kind: HelixIntentKind, sourceTarget: string): string[] => {
  if (kind === "control_command") return [sourceTarget || "operator_tool"];
  if (kind === "repo_evidence_question") return ["repo_code"];
  return [];
};

export function buildHelixIntentHypotheses(input: {
  promptText: string;
  promptInterpretation: HelixPromptInterpretation;
  selectedRoute?: string;
  sourceTarget?: string;
  routeCandidates?: HelixRouteCandidateForIntent[];
  terminalProductsAllowed?: string[];
  terminalProductsForbidden?: string[];
}): HelixIntentHypothesis[] {
  const promptInterpretation = input.promptInterpretation;
  const routeCandidates = input.routeCandidates ?? [];
  const sourceTarget = input.sourceTarget || "unknown";
  const contextualSpans = promptInterpretation.contextual_tool_mentions.map((entry) => entry.text);
  const executableSpans = promptInterpretation.executable_operator_commands.map((entry) => entry.text);
  const visualSpans = spanMatches(input.promptText, visualPatterns);
  const procedureSpans = spanMatches(input.promptText, procedurePatterns);
  const repoSpans = spanMatches(input.promptText, repoPatterns);
  const kinds: HelixIntentKind[] = [];
  const sourceTargetToolCommand = /^(?:calculator_stream|workspace_panel|workstation_state)$/i.test(sourceTarget);
  const conversationMemoryRecall =
    sourceTarget === "conversation_memory" ||
    /conversation_memory_recall/i.test(input.selectedRoute ?? "");

  if (conversationMemoryRecall || promptInterpretation.content_question_detected) kinds.push("content_question");
  if (promptInterpretation.executable_operator_commands.length > 0 || sourceTargetToolCommand) kinds.push("control_command");
  if (promptInterpretation.status_question_detected) kinds.push("status_question");
  if (!conversationMemoryRecall && promptInterpretation.debug_or_history_question_detected) kinds.push("debug_diagnosis");
  if (promptInterpretation.implementation_question_detected) kinds.push("implementation_question");
  if (procedureSpans.length > 0) kinds.push("procedure_memory_question");
  if (repoSpans.length > 0) kinds.push("repo_evidence_question");
  if (kinds.length === 0) kinds.push("general_reasoning");

  return unique(kinds).map((kind) => {
    const candidateSourceTarget = sourceTargetForKind(kind, sourceTarget);
    const candidateRoute = routeForKind(kind, routeCandidates, input.selectedRoute);
    const supportingPromptSpans =
      kind === "content_question" ? visualSpans :
      kind === "control_command" ? executableSpans :
      kind === "status_question" ? spanMatches(input.promptText, [/\b(?:was|is|whether|tell\s+me\s+whether)\b[\s\S]{0,100}\?/i]) :
      kind === "debug_diagnosis" ? contextualSpans :
      kind === "procedure_memory_question" ? procedureSpans :
      kind === "repo_evidence_question" || kind === "implementation_question" ? repoSpans :
      [];
    return {
      schema: "helix.intent_hypothesis.v1",
      id: `intent:${kind}:${hashShort([input.promptText, kind, candidateRoute, candidateSourceTarget])}`,
      kind,
      ...(candidateRoute ? { candidate_route: candidateRoute } : {}),
      ...(candidateSourceTarget ? { candidate_source_target: candidateSourceTarget } : {}),
      confidence: confidenceFor(kind, promptInterpretation, routeCandidates, input.selectedRoute),
      supporting_prompt_spans: supportingPromptSpans,
      contrary_prompt_spans: kind === "control_command" ? promptInterpretation.negative_constraints : [],
      evidence_needed: evidenceNeededFor(kind, candidateSourceTarget),
      tool_needed: toolNeededFor(kind, candidateSourceTarget),
      why_this_is_not_enough_to_answer: "Intent hypotheses are policy inputs only; source/tool admission, evidence re-entry, route authority, poison audit, and terminal authority still have to complete.",
      risk_if_wrong: kind === "control_command"
        ? "could execute contextual, historical, future, or negated tool language"
        : "could let a route classifier become answer authority before evidence and terminal arbitration",
      terminal_products_allowed: input.terminalProductsAllowed ?? [],
      terminal_products_forbidden: input.terminalProductsForbidden ?? [],
      assistant_answer: false,
      raw_content_included: false,
    };
  });
}
