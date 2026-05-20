import type { HelixPromptInterpretation } from "./prompt-interpretation";
import type { HelixIntentHypothesis, HelixIntentKind, HelixRouteCandidateForIntent } from "./intent-hypothesis";

export type HelixIntentArbitration = {
  schema: "helix.intent_arbitration.v1";
  selected_primary_intent_id: string;
  selected_primary_intent_kind: HelixIntentKind;
  secondary_intent_ids: string[];
  contextual_tool_mentions: string[];
  executable_operator_commands: string[];
  route_candidates_allowed: string[];
  route_candidates_suppressed: Array<{
    route: string;
    reason: string;
  }>;
  terminal_products_allowed: string[];
  terminal_products_forbidden: string[];
  ambiguity_status: "resolved" | "needs_evidence" | "needs_user_clarification" | "unresolved";
  assistant_answer: false;
  raw_content_included: false;
};

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const findHypothesis = (
  hypotheses: HelixIntentHypothesis[],
  kind: HelixIntentKind,
): HelixIntentHypothesis | null =>
  hypotheses.find((entry) => entry.kind === kind) ?? null;

const hasContextualCue = (promptInterpretation: HelixPromptInterpretation, cuePattern: RegExp): boolean =>
  promptInterpretation.contextual_tool_mentions.some((entry) => cuePattern.test(`${entry.verb_or_cue} ${entry.text}`));

const isMutatingRoute = (route: string): boolean =>
  /live_pipeline_control|workspace_action|workstation_action|set_rate|repair|\bopen\b|\bclick\b|\brun\b|write|update|delete/i.test(route);

const suppressRouteReason = (input: {
  route: string;
  primary: HelixIntentKind;
  promptInterpretation: HelixPromptInterpretation;
}): string | null => {
  const { route, primary, promptInterpretation } = input;
  if (promptInterpretation.negative_constraints.length > 0 && isMutatingRoute(route)) {
    return "negative_constraints_suppress_mutating_route";
  }
  if (/live_pipeline_control/i.test(route) && primary !== "control_command") {
    if (hasContextualCue(promptInterpretation, /interval|cadence|set_rate|capture/)) {
      return "live_pipeline_control_cue_is_contextual_not_primary_control";
    }
    return "live_pipeline_control_not_selected_primary_intent";
  }
  if (/workstation_action|click|open/i.test(route) && primary !== "control_command") {
    if (hasContextualCue(promptInterpretation, /click|open|start|screen_visible_text/)) {
      return "workstation_action_cue_is_contextual_not_primary_control";
    }
    return "workstation_action_not_selected_primary_intent";
  }
  if (promptInterpretation.debug_or_history_question_detected && /live_pipeline_control|workspace_action/i.test(route)) {
    return "historical_or_debug_question_suppresses_new_tool_execution";
  }
  return null;
};

const selectPrimary = (
  promptInterpretation: HelixPromptInterpretation,
  hypotheses: HelixIntentHypothesis[],
): HelixIntentHypothesis => {
  const content = findHypothesis(hypotheses, "content_question");
  const control = findHypothesis(hypotheses, "control_command");
  const debug = findHypothesis(hypotheses, "debug_diagnosis");
  const status = findHypothesis(hypotheses, "status_question");
  const implementation = findHypothesis(hypotheses, "implementation_question");
  const repo = findHypothesis(hypotheses, "repo_evidence_question");
  const procedure = findHypothesis(hypotheses, "procedure_memory_question");
  const general = findHypothesis(hypotheses, "general_reasoning") ?? hypotheses[0];

  if (procedure) return procedure;
  if (content) return content;
  if (debug && promptInterpretation.executable_operator_commands.length === 0) return debug;
  if (control && promptInterpretation.executable_operator_commands.length > 0) return control;
  if (implementation) return implementation;
  if (repo) return repo;
  if (status) return status;
  return general;
};

const defaultAllowedProducts = (primary: HelixIntentKind): string[] => {
  if (primary === "control_command") return ["live_pipeline_receipt", "workspace_action_receipt", "typed_failure", "request_user_input"];
  if (primary === "content_question") return ["situation_context_pack", "visual_context_pack", "typed_failure", "request_user_input"];
  if (primary === "debug_diagnosis") return ["repo_code_evidence_answer", "source_binding_status", "typed_failure", "request_user_input"];
  return ["typed_failure", "request_user_input"];
};

const defaultForbiddenProducts = (primary: HelixIntentKind): string[] => {
  if (primary === "control_command") return ["visual_context_pack", "situation_context_pack", "model_only_concept", "client_projection"];
  if (primary === "content_question") return ["live_pipeline_receipt", "workspace_action_receipt", "client_projection", "model_only_concept"];
  if (primary === "debug_diagnosis") return ["live_pipeline_receipt", "workspace_action_receipt", "client_projection"];
  return ["client_projection"];
};

export function arbitrateHelixIntent(input: {
  promptInterpretation: HelixPromptInterpretation;
  hypotheses: HelixIntentHypothesis[];
  routeCandidates?: HelixRouteCandidateForIntent[];
  terminalProductsAllowed?: string[];
  terminalProductsForbidden?: string[];
}): HelixIntentArbitration {
  const hypotheses = input.hypotheses.length > 0
    ? input.hypotheses
    : [{
        schema: "helix.intent_hypothesis.v1",
        id: "intent:general_reasoning:fallback",
        kind: "general_reasoning",
        confidence: 0.25,
        supporting_prompt_spans: [],
        contrary_prompt_spans: [],
        evidence_needed: [],
        tool_needed: [],
        why_this_is_not_enough_to_answer: "Fallback hypothesis only; arbitration still requires route and terminal authority.",
        risk_if_wrong: "could obscure missing intent classification",
        terminal_products_allowed: input.terminalProductsAllowed ?? [],
        terminal_products_forbidden: input.terminalProductsForbidden ?? [],
        assistant_answer: false,
        raw_content_included: false,
      }];
  const primary = selectPrimary(input.promptInterpretation, hypotheses);
  const routeCandidates = input.routeCandidates ?? [];
  const routeCandidatesFromHypotheses = hypotheses.map((entry) => entry.candidate_route).filter((entry): entry is string => Boolean(entry));
  const candidateRoutes = unique([...routeCandidates.map((entry) => entry.route), ...routeCandidatesFromHypotheses]);
  const suppressed = candidateRoutes
    .map((route) => {
      const reason = suppressRouteReason({
        route,
        primary: primary.kind,
        promptInterpretation: input.promptInterpretation,
      });
      return reason ? { route, reason } : null;
    })
    .filter((entry): entry is { route: string; reason: string } => Boolean(entry));
  const suppressedRoutes = new Set(suppressed.map((entry) => entry.route));
  const secondaryIntentIds = hypotheses
    .filter((entry) => entry.id !== primary.id)
    .map((entry) => entry.id);
  const allowedProducts = input.terminalProductsAllowed?.length
    ? input.terminalProductsAllowed
    : defaultAllowedProducts(primary.kind);
  const forbiddenProducts = unique([
    ...(input.terminalProductsForbidden ?? []),
    ...defaultForbiddenProducts(primary.kind),
  ]);

  return {
    schema: "helix.intent_arbitration.v1",
    selected_primary_intent_id: primary.id,
    selected_primary_intent_kind: primary.kind,
    secondary_intent_ids: secondaryIntentIds,
    contextual_tool_mentions: input.promptInterpretation.contextual_tool_mentions.map((entry) => entry.text || entry.verb_or_cue),
    executable_operator_commands: input.promptInterpretation.executable_operator_commands.map((entry) => entry.text || entry.action_family),
    route_candidates_allowed: candidateRoutes.filter((route) => !suppressedRoutes.has(route)),
    route_candidates_suppressed: suppressed,
    terminal_products_allowed: allowedProducts,
    terminal_products_forbidden: forbiddenProducts,
    ambiguity_status: secondaryIntentIds.length > 0 ? "needs_evidence" : "resolved",
    assistant_answer: false,
    raw_content_included: false,
  };
}
