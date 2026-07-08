import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import { callWorkstationGatewayCapability } from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import {
  buildCompoundCapabilityDependencyGatewayCallRequests,
  buildCompoundDependencyRailStatus,
  buildDependentCompoundCapabilityGatewayCallRequest,
  buildTurnCompoundDependencyPlan,
} from "./provider-compound-capability-planner";
import {
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
  CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
  CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
  DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
  DOCS_SEARCH_CAPABILITY,
  INTERNET_SEARCH_CAPABILITY,
  MORAL_GRAPH_REFLECTION_CAPABILITY,
  REPO_SEARCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
  VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  VOICE_INTERIM_CALLOUT_CAPABILITY,
  VOICE_NARRATOR_SAY_CAPABILITY,
  WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
  WORKSPACE_OS_STATUS_CAPABILITY,
  hasSelectedHelixAgentRuntime,
  readArray,
  readExplicitWorkstationGatewayCallRequests,
  readHelixAgentTurnId,
  readPrompt,
  readRecord,
  readString,
  unquotePrompt,
} from "./explicit-tool-requests";
import { appendDedupe } from "./gateway-request-dedupe";
import {
  attachDependentRequestAsNextAffordance,
  isCodexReasoningDependentRequest,
  shouldAutoExecuteDependentCompoundRequest,
} from "./compound-dependency-requests";
import {
  buildActiveCalculatorContextWorkstationGatewayCallRequests,
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildActiveWorkstationContextGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildPromptDerivedReadableSurfaceGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
} from "./active-context-tool-requests";
import {
  buildPromptDerivedCalculatorSolveGatewayCallRequests,
  buildPromptDerivedInternetSearchGatewayCallRequests,
  buildPromptDerivedMoralGraphReflectionGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  buildPromptDerivedScholarlyResearchGatewayCallRequests,
  buildPromptDerivedTheoryReflectionGatewayCallRequests,
  buildPromptDerivedVoiceGatewayCallRequests,
  buildPromptDerivedWorkspaceStatusGatewayCallRequests,
  buildPromptNamedCapabilityGatewayCallRequests,
  extractCalculatorExpressionFromPrompt,
  isConditionalPriorEvidenceCalculatorFollowup,
  isPaperBackedNumericBindingPhasePrompt,
  isTheoryFormulaDiscoveryPhasePrompt,
} from "./prompt-named-tool-requests";

const MORAL_SUBSTRATE_PRIMARY_CAPABILITY = "moral-graph.reflect_living_substrate_context" as const;
const MORAL_GRAPH_PRIMARY_CAPABILITIES = new Set([
  MORAL_GRAPH_REFLECTION_CAPABILITY,
  MORAL_SUBSTRATE_PRIMARY_CAPABILITY,
]);

const MORAL_SUBSTRATE_DEFERRED_AFFORDANCE_CAPABILITIES = new Set([
  INTERNET_SEARCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
]);

type ForbiddenEvidenceFamily =
  | "external_evidence"
  | "page_evidence"
  | "visual_evidence"
  | "calculator_evidence"
  | "ambient_context";

const MORAL_GRAPH_FORBIDDEN_ADJACENT_CAPABILITY_FAMILIES: Record<string, ForbiddenEvidenceFamily[]> = {
  [INTERNET_SEARCH_CAPABILITY]: ["external_evidence"],
  [SCHOLARLY_RESEARCH_SEARCH_CAPABILITY]: ["external_evidence", "page_evidence"],
  [DOCS_SEARCH_CAPABILITY]: ["page_evidence"],
  [DOCS_READ_VISIBLE_SURFACE_CAPABILITY]: ["page_evidence", "ambient_context"],
  [DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY]: ["page_evidence", "ambient_context"],
  [CALCULATOR_SOLVE_EXPRESSION_CAPABILITY]: ["calculator_evidence"],
  [CALCULATOR_ACTIVE_CONTEXT_CAPABILITY]: ["calculator_evidence", "ambient_context"],
  [CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY]: ["calculator_evidence", "ambient_context"],
  [VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY]: ["visual_evidence"],
  [VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY]: ["visual_evidence"],
  [VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY]: ["visual_evidence"],
  [WORKSTATION_ACTIVE_CONTEXT_CAPABILITY]: ["ambient_context"],
};

const NEGATED_EVIDENCE_FAMILY_PATTERNS: Record<ForbiddenEvidenceFamily, RegExp> = {
  external_evidence:
    /\b(?:web|internet|online|external|scholarly|research\s+papers?|papers?|arxiv|doi|cit(?:e|ed|ation)s?|sources?)\b(?:\s+(?:evidence|sources?|search|retrieval|lookup))?/i,
  page_evidence:
    /\b(?:pdfs?|pages?|docs?|documents?|visible\s+surface|current\s+(?:doc|document|page)|page[-\s]?grounded)\b(?:\s+(?:evidence|source|surface|sidecar))?/i,
  visual_evidence:
    /\b(?:images?|image\s+lens|image-lens|visual|crop|bbox|screenshot|attached\s+image|visible\s+image)\b(?:\s+(?:evidence|sidecar|observation))?/i,
  calculator_evidence:
    /\b(?:calculator|scientific\s+calculator|calculate|compute|evaluate|solve|expression)\b(?:\s+(?:evidence|result|receipt|sidecar))?/i,
  ambient_context:
    /\b(?:current[-\s]?panel|current\s+panel|active\s+panel|sidecar|stale\s+evidence|old\s+evidence|pre[-\s]?existing\s+evidence|ambient\s+evidence)\b/i,
};

const promptNegatesEvidenceFamily = (prompt: string, family: ForbiddenEvidenceFamily): boolean => {
  const unquoted = unquotePrompt(prompt);
  const negatedWindow =
    /\b(?:do\s+not|don't|dont|without|no\s+need\s+to|not\s+asking\s+to|not|avoid)\b[\s\S]{0,160}/gi;
  for (const match of unquoted.matchAll(negatedWindow)) {
    if (NEGATED_EVIDENCE_FAMILY_PATTERNS[family].test(match[0] ?? "")) return true;
  }
  return false;
};

const promptForbiddenEvidenceFamilies = (prompt: string): Set<ForbiddenEvidenceFamily> => {
  const forbidden = new Set<ForbiddenEvidenceFamily>();
  for (const family of Object.keys(NEGATED_EVIDENCE_FAMILY_PATTERNS) as ForbiddenEvidenceFamily[]) {
    if (promptNegatesEvidenceFamily(prompt, family)) forbidden.add(family);
  }
  return forbidden;
};

const forbiddenFamiliesForCapability = (
  capability: string | null,
  forbiddenFamilies: Set<ForbiddenEvidenceFamily>,
): ForbiddenEvidenceFamily[] => {
  if (!capability) return [];
  return (MORAL_GRAPH_FORBIDDEN_ADJACENT_CAPABILITY_FAMILIES[capability] ?? [])
    .filter((family) => forbiddenFamilies.has(family));
};

const isMoralGraphPrimaryRequest = (request: Record<string, unknown>): boolean => {
  const capability = readString(request.capability_id) ?? readString(request.capabilityId);
  return Boolean(capability && MORAL_GRAPH_PRIMARY_CAPABILITIES.has(capability));
};

const isMoralGraphPrimaryIntent = (request: Record<string, unknown>): boolean => {
  const sourceTargetIntent = readRecord(readRecord(request.arguments)?.source_target_intent);
  return (
    readString(sourceTargetIntent?.target_kind) === "moral_graph_reflection" ||
    readString(sourceTargetIntent?.intent) === "moral_graph_reflection" ||
    readString(sourceTargetIntent?.target_kind) === "moral_living_substrate_reflection" ||
    readString(sourceTargetIntent?.intent) === "moral_living_substrate_reflection"
  );
};

const promptNegatesExternalEvidence = (prompt: string): boolean =>
  /\b(?:do\s+not|don't|dont|without|no|not|avoid)\b[\s\S]{0,160}\b(?:search\s+(?:the\s+)?(?:web|internet|online)|web\s+search|internet\s+search|online\s+search|external\s+sources?|(?:web|internet|online|external|scholarly|research\s+papers?|papers?|pdfs?|pages?)\s+(?:evidence|sources?|search|retrieval|lookup))\b/i.test(
    unquotePrompt(prompt),
  );

const promptExplicitlyRequestsExternalEvidence = (prompt: string): boolean => {
  if (promptNegatesExternalEvidence(prompt)) return false;
  const unquoted = unquotePrompt(prompt);
  return (
    /\b(?:also|and|then|with|plus|include|using|use)\b[\s\S]{0,120}\b(?:search\s+(?:the\s+)?(?:web|internet|online)|web\s+search|internet\s+search|look\s+up|online|external\s+sources?|latest|current|recent|scholarly|arxiv|papers?)\b/i.test(
      unquoted,
    ) ||
    /\b(?:search|look\s+up|find|cite)\b[\s\S]{0,120}\b(?:web|internet|online|external|latest|current|recent|scholarly|arxiv|papers?)\b/i.test(
      unquoted,
    ) ||
    /\b(?:web|internet|online|external|latest|current|recent|scholarly|arxiv|papers?)\b[\s\S]{0,120}\b(?:search|sources?|evidence|research|citations?)\b/i.test(
      unquoted,
    )
  );
};

const promptExplicitlyRequestsCrossGraphMoralFollowup = (prompt: string): boolean => {
  const unquoted = unquotePrompt(prompt);
  return /\b(?:theory\s+badge\s+graph|theory\s+graph|civilization\s+bounds?|scientific[-\s]?calculator|calculator|fruition)\b/i.test(
    unquoted,
  );
};

const isScientificImageEvidenceScopedTurn = (body: Record<string, unknown>): boolean => {
  const routeMetadata = readRecord(body.route_metadata ?? body.routeMetadata);
  const sourceTargetIntent = readRecord(routeMetadata?.source_target_intent ?? routeMetadata?.sourceTargetIntent);
  const mandatoryNextTool = readRecord(routeMetadata?.mandatory_next_tool ?? routeMetadata?.mandatoryNextTool);
  const values = [
    readString(routeMetadata?.sourceTarget),
    readString(routeMetadata?.source_target),
    readString(routeMetadata?.requiredToolFamily),
    readString(routeMetadata?.required_tool_family),
    readString(sourceTargetIntent?.target_source),
    readString(sourceTargetIntent?.targetSource),
    readString(sourceTargetIntent?.target_kind),
    readString(sourceTargetIntent?.targetKind),
    readString(mandatoryNextTool?.missing_required_evidence),
    readString(mandatoryNextTool?.missingRequiredEvidence),
    readString(mandatoryNextTool?.canonical_goal),
    readString(mandatoryNextTool?.canonicalGoal),
  ].filter((value): value is string => Boolean(value));
  return values.some((value) => /scientific_image|scientific[-_\s]?image|image_lens|visual_analysis/i.test(value));
};

const isExplicitExternalResearchRequest = (
  request: Record<string, unknown>,
  prompt: string,
  promptNamedCapabilities: Set<string>,
): boolean => {
  const capability = readString(request.capability_id) ?? readString(request.capabilityId);
  if (!capability) return false;
  if (promptNamedCapabilities.has(capability)) return true;
  const derivationSource = readString(request.derivation_source);
  const sourceTargetIntent = readRecord(readRecord(request.arguments)?.source_target_intent);
  const explicitCues = Array.isArray(sourceTargetIntent?.explicit_cues)
    ? sourceTargetIntent.explicit_cues.filter((cue): cue is string => typeof cue === "string")
    : [];
  const explicitRouteOrCue =
    derivationSource === "helix_prompt_named_capability" ||
    explicitCues.includes("prompt_named_capability");
  if (capability === INTERNET_SEARCH_CAPABILITY || capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) {
    return explicitRouteOrCue || promptExplicitlyRequestsExternalEvidence(prompt);
  }
  if (
    capability === THEORY_CONTEXT_REFLECTION_CAPABILITY ||
    capability === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY ||
    capability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY
  ) {
    return explicitRouteOrCue || promptExplicitlyRequestsCrossGraphMoralFollowup(prompt);
  }
  return (
    explicitRouteOrCue ||
    promptExplicitlyRequestsExternalEvidence(prompt)
  );
};

const requestToProviderNextAffordance = (request: Record<string, unknown>): Record<string, unknown> | null => {
  const capability = readString(request.capability_id) ?? readString(request.capabilityId);
  if (!capability) return null;
  const args = readRecord(request.arguments) ?? {};
  const sourceTargetIntent = readRecord(args.source_target_intent) ?? {};
  return {
    schema: "helix.provider_next_affordance.v1",
    source: "helix_moral_graph_primary_request_reduction",
    capability,
    mode: readString(request.mode) ?? "read",
    purpose: "codex_selected_followup_tool",
    reason: "available_after_moral_graph_observation_reentry",
    prompt: readString(args.prompt),
    query: readString(args.query),
    expression: readString(args.expression) ?? readString(args.latex),
    source_target_intent: {
      ...sourceTargetIntent,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const attachNextAffordancesToRequest = (
  request: Record<string, unknown>,
  affordances: Record<string, unknown>[],
  rejectedAdjacentCapabilities: Record<string, unknown>[] = [],
): Record<string, unknown> => {
  if (affordances.length === 0 && rejectedAdjacentCapabilities.length === 0) return request;
  const args = readRecord(request.arguments) ?? {};
  const sourceTargetIntent = readRecord(args.source_target_intent) ?? {};
  const rejectedFamilies = Array.from(new Set(
    rejectedAdjacentCapabilities
      .flatMap((entry) => readArray(entry.forbidden_families))
      .filter((entry): entry is string => typeof entry === "string" && entry.length > 0),
  ));
  return {
    ...request,
    arguments: {
      ...args,
      ...(affordances.length > 0
        ? {
            next_affordances: [
              ...readArray(args.next_affordances),
              ...affordances,
            ],
          }
        : {}),
      ...(rejectedAdjacentCapabilities.length > 0
        ? {
            rejected_adjacent_capabilities: [
              ...readArray(args.rejected_adjacent_capabilities),
              ...rejectedAdjacentCapabilities,
            ],
            rejected_adjacent_tool_families: [
              ...readArray(args.rejected_adjacent_tool_families),
              ...rejectedFamilies,
            ],
          }
        : {}),
      source_target_intent: {
        ...sourceTargetIntent,
        ...(affordances.length > 0
          ? {
              next_affordances: [
                ...readArray(sourceTargetIntent.next_affordances),
                ...affordances,
              ],
            }
          : {}),
        ...(rejectedAdjacentCapabilities.length > 0
          ? {
              rejected_adjacent_capabilities: [
                ...readArray(sourceTargetIntent.rejected_adjacent_capabilities),
                ...rejectedAdjacentCapabilities,
              ],
              rejected_adjacent_tool_families: [
                ...readArray(sourceTargetIntent.rejected_adjacent_tool_families),
                ...rejectedFamilies,
              ],
            }
          : {}),
      },
    },
  };
};

const reduceMoralGraphRequestsToPrimary = (
  input: {
    requests: Record<string, unknown>[];
    prompt: string;
    promptNamedCapabilities: Set<string>;
  },
): Record<string, unknown>[] => {
  const moralIndex = input.requests.findIndex((request) => isMoralGraphPrimaryRequest(request) && isMoralGraphPrimaryIntent(request));
  if (moralIndex < 0) return input.requests;
  const moralRequest = input.requests[moralIndex];
  const deferredAffordances: Record<string, unknown>[] = [];
  const rejectedAdjacentCapabilities: Record<string, unknown>[] = [];
  const retained: Record<string, unknown>[] = [];
  const forbiddenFamilies = promptForbiddenEvidenceFamilies(input.prompt);

  for (const [index, request] of input.requests.entries()) {
    if (index === moralIndex) continue;
    if (isMoralGraphPrimaryRequest(request)) continue;
    const capability = readString(request.capability_id) ?? readString(request.capabilityId);
    const blockedFamilies = forbiddenFamiliesForCapability(capability ?? null, forbiddenFamilies);
    if (capability && blockedFamilies.length > 0) {
      rejectedAdjacentCapabilities.push({
        schema: "helix.moral_graph_rejected_adjacent_capability.v1",
        capability,
        reason: "negative_evidence_constraint",
        forbidden_families: blockedFamilies,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      continue;
    }
    const shouldDefer =
      capability &&
      MORAL_SUBSTRATE_DEFERRED_AFFORDANCE_CAPABILITIES.has(capability) &&
      !isExplicitExternalResearchRequest(request, input.prompt, input.promptNamedCapabilities);
    if (shouldDefer) {
      const affordance = requestToProviderNextAffordance(request);
      if (affordance) deferredAffordances.push(affordance);
      continue;
    }
    retained.push(request);
  }

  const primary = attachNextAffordancesToRequest(
    moralRequest,
    deferredAffordances,
    rejectedAdjacentCapabilities,
  );
  return [primary, ...retained];
};

export {
  hasExplicitWorkstationGatewayCalls,
  hasSelectedHelixAgentRuntime,
  readExplicitWorkstationGatewayCallRequests,
  readHelixAgentTurnId,
} from "./explicit-tool-requests";
export { appendDedupe, requestKey } from "./gateway-request-dedupe";
export {
  attachDependentRequestAsNextAffordance,
  isCodexReasoningDependentRequest,
  shouldAutoExecuteDependentCompoundRequest,
} from "./compound-dependency-requests";
export {
  buildActiveCalculatorContextWorkstationGatewayCallRequests,
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildActiveWorkstationContextGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildPromptDerivedReadableSurfaceGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
} from "./active-context-tool-requests";
export {
  buildPromptDerivedCalculatorSolveGatewayCallRequests,
  buildPromptDerivedInternetSearchGatewayCallRequests,
  buildPromptDerivedMoralGraphReflectionGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  buildPromptDerivedScholarlyResearchGatewayCallRequests,
  buildPromptDerivedTheoryReflectionGatewayCallRequests,
  buildPromptDerivedVoiceGatewayCallRequests,
  buildPromptDerivedWorkspaceStatusGatewayCallRequests,
  buildPromptNamedCapabilityGatewayCallRequests,
} from "./prompt-named-tool-requests";

export const readWorkstationGatewayCallRequestsForTurn = (input: {
  body: Record<string, unknown>;
  includePlannerDerived?: boolean;
}): Record<string, unknown>[] => {
  const explicit = readExplicitWorkstationGatewayCallRequests(input.body);
  if (explicit.length > 0) return explicit;
  if (input.includePlannerDerived !== true) return [];
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const prompt = readPrompt(input.body) ?? "";
  const scientificImageEvidenceScopedTurn = isScientificImageEvidenceScopedTurn(input.body);
  const theoryFormulaDiscoveryPhase = isTheoryFormulaDiscoveryPhasePrompt(prompt);
  const paperBackedNumericBindingPhase = isPaperBackedNumericBindingPhasePrompt(prompt);
  const conditionalPriorEvidenceCalculatorFollowup = isConditionalPriorEvidenceCalculatorFollowup(prompt);
  if (conditionalPriorEvidenceCalculatorFollowup && !extractCalculatorExpressionFromPrompt(prompt)) {
    return [];
  }
  const allowsCompoundAdjunctCapabilities =
    /\b(?:research\s+papers?|papers?|arxiv|scholarly|internet|web|sources?|reflect|reflection|theory\s+badge\s+graph|theory\s+graph|civilization\s+bounds?|civilization)\b/i.test(
      unquotePrompt(prompt),
    );
  const structured = buildStructuredAdmissionWorkstationGatewayCallRequests(input.body);
  appendDedupe(requests, seen, structured);
  const compoundDependencyRequests = buildCompoundCapabilityDependencyGatewayCallRequests(input.body);
  appendDedupe(requests, seen, compoundDependencyRequests);
  const compoundDependencyCapabilities = new Set(
    compoundDependencyRequests
      .map((request) => readString(request.capability_id) ?? readString(request.capabilityId))
      .filter((capability): capability is string => Boolean(capability)),
  );

  const promptNamed = buildPromptNamedCapabilityGatewayCallRequests(input.body);
  const promptNamedCapabilities = new Set(
    promptNamed
      .map((request) => readString(request.capability_id) ?? readString(request.capabilityId))
      .filter((capability): capability is string => Boolean(capability)),
  );
  const promptNamedForAppend = promptNamed.filter((request) => {
    const capability = readString(request.capability_id) ?? readString(request.capabilityId);
    return !capability || !compoundDependencyCapabilities.has(capability);
  });
  if (scientificImageEvidenceScopedTurn) {
    requests.length = 0;
    seen.clear();
    appendDedupe(requests, seen, promptNamed);
    if (!promptNamedCapabilities.has(THEORY_CONTEXT_REFLECTION_CAPABILITY)) {
      appendDedupe(requests, seen, buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
    }
    return requests.slice(0, 10);
  }
  if (theoryFormulaDiscoveryPhase && promptNamedCapabilities.size === 0 && compoundDependencyCapabilities.size === 0) {
    appendDedupe(requests, seen, buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
    return requests.slice(0, 10);
  }
  const hasNamedDocsSearch = promptNamed.some((request) => readString(request.capability_id) === DOCS_SEARCH_CAPABILITY);
  const activeDocsContext = buildActiveDocsContextWorkstationGatewayCallRequests(input.body);
  if (hasNamedDocsSearch) {
    appendDedupe(requests, seen, promptNamedForAppend);
  } else {
    if (
      !compoundDependencyCapabilities.has(DOCS_SEARCH_CAPABILITY) &&
      !compoundDependencyCapabilities.has(DOCS_READ_VISIBLE_SURFACE_CAPABILITY) &&
      !compoundDependencyCapabilities.has(DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY)
    ) {
      appendDedupe(requests, seen, activeDocsContext);
    }
    appendDedupe(requests, seen, promptNamedForAppend);
  }
  const activeCalculatorContext = buildActiveCalculatorContextWorkstationGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeCalculatorContext);
  const activeWorkstationContext = buildActiveWorkstationContextGatewayCallRequests(input.body);
  appendDedupe(requests, seen, activeWorkstationContext);
  appendDedupe(requests, seen, buildPromptDerivedReadableSurfaceGatewayCallRequests(input.body));
  if (!promptNamedCapabilities.has(WORKSPACE_OS_STATUS_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedWorkspaceStatusGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY) &&
    !promptNamedCapabilities.has(VOICE_INTERIM_CALLOUT_CAPABILITY) &&
    !promptNamedCapabilities.has(VOICE_NARRATOR_SAY_CAPABILITY) &&
    compoundDependencyCapabilities.size === 0
  ) {
    appendDedupe(requests, seen, buildPromptDerivedVoiceGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(MORAL_GRAPH_REFLECTION_CAPABILITY) &&
    compoundDependencyCapabilities.size === 0
  ) {
    appendDedupe(requests, seen, buildPromptDerivedMoralGraphReflectionGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) &&
    !compoundDependencyCapabilities.has(CALCULATOR_SOLVE_EXPRESSION_CAPABILITY)
  ) {
    appendDedupe(requests, seen, buildPromptDerivedCalculatorSolveGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(THEORY_CONTEXT_REFLECTION_CAPABILITY) &&
    compoundDependencyCapabilities.size === 0
  ) {
    appendDedupe(requests, seen, buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
  }
  if (
    promptNamedCapabilities.size === 0 &&
    (compoundDependencyCapabilities.size === 0 || allowsCompoundAdjunctCapabilities) &&
    (activeDocsContext.length === 0 || allowsCompoundAdjunctCapabilities) &&
    !paperBackedNumericBindingPhase
  ) {
    appendDedupe(requests, seen, buildPlannerDerivedWorkstationGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) &&
    (compoundDependencyCapabilities.size === 0 || allowsCompoundAdjunctCapabilities)
  ) {
    appendDedupe(requests, seen, buildPromptDerivedScholarlyResearchGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(INTERNET_SEARCH_CAPABILITY) &&
    (compoundDependencyCapabilities.size === 0 || allowsCompoundAdjunctCapabilities)
  ) {
    appendDedupe(requests, seen, buildPromptDerivedInternetSearchGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(REPO_SEARCH_CAPABILITY) && !compoundDependencyCapabilities.has(REPO_SEARCH_CAPABILITY)) {
    appendDedupe(requests, seen, buildPromptDerivedRepoSearchGatewayCallRequests(input.body));
  }
  return reduceMoralGraphRequestsToPrimary({
    requests,
    prompt,
    promptNamedCapabilities,
  }).slice(0, 10);
};

export const hasWorkstationGatewayCallsForTurn = (input: {
  body: Record<string, unknown>;
  includePlannerDerived?: boolean;
}): boolean => readWorkstationGatewayCallRequestsForTurn(input).length > 0;

export const runExplicitWorkstationGatewayCalls = async (input: {
  body: Record<string, unknown>;
  agentRuntime: HelixAgentRuntimeId;
  turnId?: string | null;
}): Promise<HelixWorkstationGatewayCallResult[]> => {
  const requests = readWorkstationGatewayCallRequestsForTurn({
    body: input.body,
    includePlannerDerived: hasSelectedHelixAgentRuntime(input.body),
  });
  const turnId = input.turnId ?? readHelixAgentTurnId(input.body);
  const results: HelixWorkstationGatewayCallResult[] = [];
  for (const [index, request] of requests.entries()) {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: input.agentRuntime,
      mode: readString(request.mode),
      capabilityId: readString(request.capability_id) ?? readString(request.capabilityId) ?? "",
      arguments: readRecord(request.arguments ?? request.args) ?? {},
      approvalToken: readString(request.approval_token) ?? readString(request.approvalToken),
      turnId,
      iteration: typeof request.iteration === "number" ? request.iteration : index + 1,
    });
    results.push(result);
    const dependentVoiceRequest = buildDependentCompoundCapabilityGatewayCallRequest({
      request,
      result,
      results,
      turnId,
    });
    const dependencyRailStatus = buildCompoundDependencyRailStatus({
      request,
      result,
      results,
      dependentRequest: dependentVoiceRequest,
    });
    if (dependencyRailStatus) {
      const observation = readRecord(result.observation);
      if (observation) {
        observation.compound_dependency_plan = dependencyRailStatus;
      }
      result.observation_packet.state_delta = {
        ...(readRecord(result.observation_packet.state_delta) ?? {}),
        compound_dependency_plan: dependencyRailStatus,
      };
    }
    if (dependentVoiceRequest && isCodexReasoningDependentRequest(dependentVoiceRequest)) {
      attachDependentRequestAsNextAffordance(result, dependentVoiceRequest);
    }
    if (shouldAutoExecuteDependentCompoundRequest(dependentVoiceRequest)) {
      let nextDependentRequest: Record<string, unknown> | null = dependentVoiceRequest;
      let dependentDepth = 0;
      while (nextDependentRequest && dependentDepth < 4) {
        dependentDepth += 1;
        const dependentResult = await callWorkstationGatewayCapability({
        agentRuntime: input.agentRuntime,
          mode: readString(nextDependentRequest.mode),
          capabilityId: readString(nextDependentRequest.capability_id) ?? "",
          arguments: readRecord(nextDependentRequest.arguments) ?? {},
        turnId,
        iteration: results.length + 1,
        });
        results.push(dependentResult);
        const followupDependentRequest = buildDependentCompoundCapabilityGatewayCallRequest({
          request: nextDependentRequest,
          result: dependentResult,
          results,
          turnId,
        });
        const followupRailStatus = buildCompoundDependencyRailStatus({
          request: nextDependentRequest,
          result: dependentResult,
          results,
          dependentRequest: followupDependentRequest,
        });
        if (followupRailStatus) {
          const dependentObservation = readRecord(dependentResult.observation);
          if (dependentObservation) {
            dependentObservation.compound_dependency_plan = followupRailStatus;
          }
          dependentResult.observation_packet.state_delta = {
            ...(readRecord(dependentResult.observation_packet.state_delta) ?? {}),
            compound_dependency_plan: followupRailStatus,
          };
        }
        if (followupDependentRequest && isCodexReasoningDependentRequest(followupDependentRequest)) {
          attachDependentRequestAsNextAffordance(dependentResult, followupDependentRequest);
          nextDependentRequest = null;
        } else {
          nextDependentRequest = followupDependentRequest;
        }
      }
    }
  }
  const turnCompoundDependencyPlan = buildTurnCompoundDependencyPlan({
    turnId,
    results,
  });
  if (turnCompoundDependencyPlan) {
    for (const result of results) {
      const sourceTargetIntent = readRecord(result.gateway_admission.source_target_intent);
      if (!readString(sourceTargetIntent?.compound_outcome)) continue;
      const observation = readRecord(result.observation);
      if (observation) {
        observation.compound_dependency_turn_plan = turnCompoundDependencyPlan;
      }
      result.observation_packet.state_delta = {
        ...(readRecord(result.observation_packet.state_delta) ?? {}),
        compound_dependency_turn_plan: turnCompoundDependencyPlan,
      };
    }
  }
  return results;
};
