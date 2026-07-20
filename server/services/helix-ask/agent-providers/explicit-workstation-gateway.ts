import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import {
  callAccountAuthorizedWorkstationGatewayCapabilityForProvider,
  resolveWorkstationGatewayAccountContext,
  type HelixWorkstationGatewayAccountContext,
} from "../workstation-tool-gateway/account-policy";
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
  DOCS_OPEN_DOC_CAPABILITY,
  DOCS_SEARCH_CAPABILITY,
  INTERNET_SEARCH_CAPABILITY,
  MORAL_GRAPH_REFLECTION_CAPABILITY,
  REPO_SEARCH_CAPABILITY,
  SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
  VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  THEORY_BADGE_GRAPH_CURRENT_CONTEXT_CAPABILITY,
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
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
  type HelixContextualToolAdmissionSuppression,
  type HelixContextualToolSuppressionFamily,
} from "../contextual-tool-admission";
import {
  attachDependentRequestAsNextAffordance,
  isCodexReasoningDependentRequest,
  shouldAutoExecuteDependentCompoundRequest,
} from "./compound-dependency-requests";
import {
  buildActiveCalculatorContextWorkstationGatewayCallRequests,
  buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests,
  buildActiveTheoryRuntimeContextWorkstationGatewayCallRequests,
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildActiveWorkstationContextGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildPromptDerivedReadableSurfaceGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
} from "./active-context-tool-requests";
import {
  buildPromptDerivedCalculatorSolveGatewayCallRequests,
  buildPromptDerivedCivilizationBoundsGatewayCallRequests,
  buildPromptDerivedInternetSearchGatewayCallRequests,
  buildPromptDerivedMoralGraphReflectionGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  buildPromptDerivedResearchLibraryGatewayCallRequests,
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
import {
  assertCapabilityAllowedByCommittedRoute,
  readCommittedAskRoute,
} from "../committed-ask-route";
import { isAskTurnCapabilityHelpIntent } from "../capability-catalog-intent";
import { HELIX_RESEARCH_LIBRARY_READ_CAPABILITY } from "@shared/helix-research-library";

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
  [THEORY_BADGE_GRAPH_CURRENT_CONTEXT_CAPABILITY]: ["ambient_context"],
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

const gatewayCapabilityNegatedByPrompt = (prompt: string, capability: string | null): boolean => {
  if (!capability) return false;
  const clauseSafePrompt = unquotePrompt(prompt).replace(
    /\b[A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+\b/g,
    (identifier) => identifier.replace(/\./g, "_"),
  );
  const clauses = clauseSafePrompt.match(
    /\b(?:do\s+not|don't|dont|without|exclude|avoid|no\s+need\s+to|not\s+asking\s+to)\b(?:(?!\b(?:but|however|instead)\b)[^.!?;\n]){0,280}/gi,
  ) ?? [];
  if (capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) {
    return clauses.some((clause) => /\b(?:scholarly-research_lookup_papers|lookup[_\s-]*papers|run\s+(?:the\s+)?(?:scholarly\s+)?lookup)\b/i.test(clause));
  }
  if (capability === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY) {
    return clauses.some((clause) => /\b(?:scholarly-research_fetch_full_text|fetch[_\s-]*full[_\s-]*text|refetch(?:\s+the)?\s+(?:pdf|paper)|fetch(?:\s+the)?\s+(?:pdf|paper))\b/i.test(clause));
  }
  if (/image[-_.]?lens|visual[-_.]?analysis.*image/i.test(capability)) {
    return clauses.some((clause) => /\b(?:image\s+lens|image-lens|visual\s+analysis)\b/i.test(clause));
  }
  const normalizedCapability = capability.replace(/\./g, "_").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return clauses.some((clause) => new RegExp(`\\b${normalizedCapability}\\b`, "i").test(clause));
};

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

const contextualSuppressionFamilyForCapability = (
  capability: string | null | undefined,
): HelixContextualToolSuppressionFamily | null => {
  if (!capability) return null;
  if (
    capability === DOCS_SEARCH_CAPABILITY ||
    capability === DOCS_READ_VISIBLE_SURFACE_CAPABILITY ||
    capability === DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY ||
    capability === DOCS_OPEN_DOC_CAPABILITY
  ) return "docs_viewer";
  if (capability === REPO_SEARCH_CAPABILITY) return "repo_code";
  if (capability === INTERNET_SEARCH_CAPABILITY) return "internet_search";
  if (capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY || capability === HELIX_RESEARCH_LIBRARY_READ_CAPABILITY) return "scholarly_research";
  if (capability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) return "scientific_calculator";
  if (
    capability === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY ||
    capability === CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY
  ) return "calculator";
  if (
    capability === THEORY_CONTEXT_REFLECTION_CAPABILITY ||
    capability === THEORY_BADGE_GRAPH_CURRENT_CONTEXT_CAPABILITY
  ) return "theory_locator";
  if (
    capability === MORAL_GRAPH_REFLECTION_CAPABILITY ||
    capability === MORAL_SUBSTRATE_PRIMARY_CAPABILITY
  ) return "moral_graph_reflection";
  if (capability === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) return "civilization_bounds";
  if (
    capability === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY ||
    capability === WORKSPACE_OS_STATUS_CAPABILITY
  ) return "workspace_diagnostic";
  if (
    capability === VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY ||
    capability === VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY ||
    capability === VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY
  ) return "visual_capture";
  if (
    capability === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY ||
    capability === VOICE_INTERIM_CALLOUT_CAPABILITY ||
    capability === VOICE_NARRATOR_SAY_CAPABILITY
  ) return "live_environment";
  return null;
};

const filterContextuallySuppressedPromptRequests = (
  requests: Record<string, unknown>[],
  suppression: HelixContextualToolAdmissionSuppression | null,
): Record<string, unknown>[] => {
  if (!suppression) return requests;
  if (
    suppression.suppression_reason !== "negated_tool_instruction" &&
    suppression.suppression_reason !== "quoted_tool_command" &&
    suppression.suppression_reason !== "explanatory_only"
  ) {
    return requests;
  }
  return requests.filter((request) => {
    const capability = readString(request.capability_id) ?? readString(request.capabilityId);
    const narrowerSearchSuppressionAllowsFullText =
      capability === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY &&
      /^(?:internet_search\.web_research|scholarly-research\.lookup_papers)$/i.test(
        suppression.verb_or_cue,
      );
    if (narrowerSearchSuppressionAllowsFullText) return true;
    const family = contextualSuppressionFamilyForCapability(capability);
    return !family || !contextualToolSuppressionBlocksFamily(suppression, family);
  });
};

const filterRequestsAllowedByCommittedRoute = (
  body: Record<string, unknown>,
  requests: Record<string, unknown>[],
): Record<string, unknown>[] => {
  const committedRoute = readCommittedAskRoute(body);
  if (!committedRoute) return requests;
  return requests.filter((request) => {
    const capabilityId = readString(request.capability_id) ?? readString(request.capabilityId);
    if (!capabilityId) return false;
    return assertCapabilityAllowedByCommittedRoute({
      committedRoute,
      capabilityId,
      args: readRecord(request.arguments ?? request.args),
      fromShortcut: true,
    }).allowed;
  });
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
  buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests,
  buildActiveTheoryRuntimeContextWorkstationGatewayCallRequests,
  buildActiveDocsContextWorkstationGatewayCallRequests,
  buildActiveWorkstationContextGatewayCallRequests,
  buildPlannerDerivedWorkstationGatewayCallRequests,
  buildPromptDerivedReadableSurfaceGatewayCallRequests,
  buildStructuredAdmissionWorkstationGatewayCallRequests,
} from "./active-context-tool-requests";
export {
  buildPromptDerivedCalculatorSolveGatewayCallRequests,
  buildPromptDerivedCivilizationBoundsGatewayCallRequests,
  buildPromptDerivedInternetSearchGatewayCallRequests,
  buildPromptDerivedMoralGraphReflectionGatewayCallRequests,
  buildPromptDerivedRepoSearchGatewayCallRequests,
  buildPromptDerivedResearchLibraryGatewayCallRequests,
  buildPromptDerivedScholarlyResearchGatewayCallRequests,
  buildPromptDerivedTheoryReflectionGatewayCallRequests,
  buildPromptDerivedVoiceGatewayCallRequests,
  buildPromptDerivedWorkspaceStatusGatewayCallRequests,
  buildPromptNamedCapabilityGatewayCallRequests,
} from "./prompt-named-tool-requests";

const isScholarlyLookupPortfolioCloser = (request: Record<string, unknown>): boolean => {
  const capability = readString(request.capability_id) ?? readString(request.capabilityId);
  const args = readRecord(request.arguments ?? request.args);
  return capability === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY &&
    args?.allow_scholarly_dependent_chain === true &&
    args?.scholarly_claim_portfolio === true;
};

export const selectScholarlyPortfolioDependencySeedResult = (
  results: HelixWorkstationGatewayCallResult[],
  fallback: HelixWorkstationGatewayCallResult,
): HelixWorkstationGatewayCallResult =>
  [...results].reverse().find((result) =>
    result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY && result.ok === true
  ) ?? fallback;

const attachPromptRequiredScholarlyPortfolioChain = (
  body: Record<string, unknown>,
  requests: Record<string, unknown>[],
): Record<string, unknown>[] => {
  if (requests.some((request) =>
    (readString(request.capability_id) ?? readString(request.capabilityId)) === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY
  )) return requests;
  const lookupIndexes = requests.flatMap((request, index) =>
    (readString(request.capability_id) ?? readString(request.capabilityId)) === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY
      ? [index]
      : []
  );
  if (lookupIndexes.length === 0 || requests.some(isScholarlyLookupPortfolioCloser)) return requests;
  const chainTemplate = buildPromptDerivedScholarlyResearchGatewayCallRequests(body)
    .find((request) =>
      readString(request.compound_outcome) === "scholarly_research_workflow" &&
      (readString(request.dependent_capability_id) ?? readString(request.dependentCapabilityId)) ===
        SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY
    );
  if (!chainTemplate) return requests;
  const closerIndex = lookupIndexes.at(-1)!;
  const closer = requests[closerIndex];
  const closerArgs = readRecord(closer.arguments ?? closer.args) ?? {};
  const templateArgs = readRecord(chainTemplate.arguments ?? chainTemplate.args) ?? {};
  const closerIntent = readRecord(closerArgs.source_target_intent);
  const templateIntent = readRecord(templateArgs.source_target_intent);
  const enriched = [...requests];
  enriched[closerIndex] = {
    ...closer,
    compound_outcome: readString(chainTemplate.compound_outcome),
    subgoal_id: readString(chainTemplate.subgoal_id),
    dependent_capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    arguments: {
      ...closerArgs,
      allow_scholarly_dependent_chain: true,
      requested_full_text_count: templateArgs.requested_full_text_count ?? 1,
      scholarly_claim_portfolio: true,
      ...(closerArgs.scholarly_intent === undefined && templateArgs.scholarly_intent !== undefined
        ? { scholarly_intent: templateArgs.scholarly_intent }
        : {}),
      ...(closerArgs.planned_scholarly_capability_chain === undefined &&
        templateArgs.planned_scholarly_capability_chain !== undefined
        ? { planned_scholarly_capability_chain: templateArgs.planned_scholarly_capability_chain }
        : {}),
      source_target_intent: {
        ...(templateIntent ?? {}),
        ...(closerIntent ?? {}),
        compound_outcome: "scholarly_research_workflow",
        claim_portfolio_closer: true,
      },
    },
  };
  return enriched;
};

const attachRequiredTheoryBadgeGraphContextRequests = (
  body: Record<string, unknown>,
  requests: Record<string, unknown>[],
): Record<string, unknown>[] => {
  const currentContextRequests = buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(body);
  if (currentContextRequests.length === 0) return requests;
  const structuredReflectionRequests = buildStructuredAdmissionWorkstationGatewayCallRequests(body)
    .filter((request) =>
      (readString(request.capability_id) ?? readString(request.capabilityId)) === THEORY_CONTEXT_REFLECTION_CAPABILITY
    );
  const promptReflectionRequests = buildPromptDerivedTheoryReflectionGatewayCallRequests(body)
    .filter((request) =>
      (readString(request.capability_id) ?? readString(request.capabilityId)) === THEORY_CONTEXT_REFLECTION_CAPABILITY
    );
  const prompt = readPrompt(body) ?? "";
  const reflectionRequests = structuredReflectionRequests.length > 0
    ? structuredReflectionRequests
    : promptReflectionRequests.length > 0
      ? promptReflectionRequests
      : [{
          schema: "helix.workstation_gateway.theory_badge_graph_context_dependency_call_request.v1",
          derivation_source: "helix_theory_badge_graph_current_context_dependency",
          capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
          mode: "read",
          arguments: {
            prompt,
            conversation_context: prompt,
            build_explanation_plan: true,
            source_target_intent: {
              source: "helix_theory_badge_graph_current_context_dependency",
              target_source: "theory_badge_graph",
              target_kind: "theory_context_reflection",
              depends_on_capability_id: THEORY_BADGE_GRAPH_CURRENT_CONTEXT_CAPABILITY,
              dependency_binding: "current_selection_to_theory_reflection",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        }];
  const augmented: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  appendDedupe(augmented, seen, requests);
  appendDedupe(augmented, seen, reflectionRequests);
  appendDedupe(augmented, seen, currentContextRequests);
  return augmented;
};

const isTheoryContextReflectionRequest = (request: Record<string, unknown>): boolean =>
  (readString(request.capability_id) ?? readString(request.capabilityId)) ===
    THEORY_CONTEXT_REFLECTION_CAPABILITY;

/**
 * Natural-language theory reflection is runtime-owned step selection. Keep an
 * explicitly supplied gateway call, which is already a fully authored tool
 * request, but do not let prompt/planner/structured-admission fallbacks execute
 * the reflection before the runtime can resolve conversational context and
 * author the semantic arguments.
 */
const deferRuntimeTheoryReflectionRequests = (
  requests: Record<string, unknown>[],
  explicitRequests: Record<string, unknown>[] = [],
): Record<string, unknown>[] => {
  const explicitRequestRefs = new Set(
    explicitRequests.filter(isTheoryContextReflectionRequest),
  );
  return requests.filter((request) =>
    !isTheoryContextReflectionRequest(request) || explicitRequestRefs.has(request)
  );
};

export const readWorkstationGatewayCallRequestsForTurn = (input: {
  body: Record<string, unknown>;
  includePlannerDerived?: boolean;
  deferRuntimeTheoryReflection?: boolean;
}): Record<string, unknown>[] => {
  const deferRuntimeOwnedReflection = (requests: Record<string, unknown>[]) =>
    input.deferRuntimeTheoryReflection === false
      ? requests
      : deferRuntimeTheoryReflectionRequests(requests);
  const explicit = readExplicitWorkstationGatewayCallRequests(input.body);
  if (explicit.length > 0) {
    const deduplicated: Record<string, unknown>[] = [];
    appendDedupe(deduplicated, new Set<string>(), explicit);
    const chainAwareExplicit = attachPromptRequiredScholarlyPortfolioChain(input.body, deduplicated);
    const dependencyCompleteExplicit = attachRequiredTheoryBadgeGraphContextRequests(
      input.body,
      chainAwareExplicit,
    );
    const runtimeDeferredExplicit = input.deferRuntimeTheoryReflection === false
      ? dependencyCompleteExplicit
      : deferRuntimeTheoryReflectionRequests(dependencyCompleteExplicit, explicit);
    const prompt = readPrompt(input.body) ?? "";
    const admittedExplicit = filterRequestsAllowedByCommittedRoute(input.body, runtimeDeferredExplicit).filter((request) => {
      const capability = readString(request.capability_id) ?? readString(request.capabilityId);
      return !gatewayCapabilityNegatedByPrompt(prompt, capability);
    });
    if (admittedExplicit.length > 0) return admittedExplicit;
    return filterRequestsAllowedByCommittedRoute(
      input.body,
      buildPromptDerivedResearchLibraryGatewayCallRequests(input.body),
    );
  }
  if (input.body.provider_reasoning_resume === true || input.body.providerReasoningResume === true) return [];
  const directResearchLibraryRequests = buildPromptDerivedResearchLibraryGatewayCallRequests(input.body);
  if (directResearchLibraryRequests.length > 0) {
    const prompt = readPrompt(input.body) ?? "";
    return filterRequestsAllowedByCommittedRoute(input.body, directResearchLibraryRequests)
      .filter((request) => {
        const capability = readString(request.capability_id) ?? readString(request.capabilityId);
        return !gatewayCapabilityNegatedByPrompt(prompt, capability);
      })
      .slice(0, 10);
  }
  if (input.includePlannerDerived !== true) return [];
  const requests: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const prompt = readPrompt(input.body) ?? "";
  const finalizeRequests = (candidates: Record<string, unknown>[]): Record<string, unknown>[] =>
    deferRuntimeOwnedReflection(
      filterRequestsAllowedByCommittedRoute(input.body, candidates),
    )
      .filter((request) => {
        const capability = readString(request.capability_id) ?? readString(request.capabilityId);
        return !gatewayCapabilityNegatedByPrompt(prompt, capability);
      })
      .slice(0, 10);
  const contextualSuppression = detectContextualToolAdmissionSuppression(prompt);
  const appendPromptDerivedDedupe = (candidates: Record<string, unknown>[]): void => {
    appendDedupe(
      requests,
      seen,
      filterContextuallySuppressedPromptRequests(candidates, contextualSuppression),
    );
  };
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
  if (
    isAskTurnCapabilityHelpIntent(prompt) &&
    buildPromptDerivedWorkspaceStatusGatewayCallRequests(input.body).length === 0
  ) {
    return finalizeRequests(requests);
  }
  const compoundDependencyRequests = buildCompoundCapabilityDependencyGatewayCallRequests(input.body);
  appendDedupe(requests, seen, compoundDependencyRequests);
  const compoundDependencyCapabilities = new Set(
    compoundDependencyRequests
      .map((request) => readString(request.capability_id) ?? readString(request.capabilityId))
      .filter((capability): capability is string => Boolean(capability)),
  );
  // A structured source-target admission is the authoritative route decision for
  // the turn. Keep independently admitted compound dependencies, but do not let
  // lexical capability names or active-panel context append a competing source.
  // For example, a repo-code query about where `workspace_os.status` is
  // implemented must remain a repo search rather than executing workspace status.
  const hasPrimaryStructuredAdmission = Boolean(
    readRecord(input.body.source_target_intent ?? input.body.sourceTargetIntent),
  );
  if (hasPrimaryStructuredAdmission && structured.length > 0) {
    appendPromptDerivedDedupe(buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(input.body));
    return finalizeRequests(reduceMoralGraphRequestsToPrimary({
      requests,
      prompt,
      promptNamedCapabilities: new Set<string>(),
    }));
  }

  const promptNamed = filterContextuallySuppressedPromptRequests(
    buildPromptNamedCapabilityGatewayCallRequests(input.body),
    contextualSuppression,
  );
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
    appendPromptDerivedDedupe(promptNamed);
    if (!promptNamedCapabilities.has(THEORY_CONTEXT_REFLECTION_CAPABILITY)) {
      appendPromptDerivedDedupe(buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
    }
    return finalizeRequests(requests);
  }
  if (theoryFormulaDiscoveryPhase && promptNamedCapabilities.size === 0 && compoundDependencyCapabilities.size === 0) {
    appendPromptDerivedDedupe(buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
    return finalizeRequests(requests);
  }
  const hasNamedDocsSearch = promptNamed.some((request) => readString(request.capability_id) === DOCS_SEARCH_CAPABILITY);
  const activeDocsContext = buildActiveDocsContextWorkstationGatewayCallRequests(input.body);
  if (hasNamedDocsSearch) {
    appendPromptDerivedDedupe(promptNamedForAppend);
  } else {
    if (
      !compoundDependencyCapabilities.has(DOCS_SEARCH_CAPABILITY) &&
      !compoundDependencyCapabilities.has(DOCS_READ_VISIBLE_SURFACE_CAPABILITY) &&
      !compoundDependencyCapabilities.has(DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY)
    ) {
      appendPromptDerivedDedupe(activeDocsContext);
    }
    appendPromptDerivedDedupe(promptNamedForAppend);
  }
  const activeCalculatorContext = buildActiveCalculatorContextWorkstationGatewayCallRequests(input.body);
  appendPromptDerivedDedupe(activeCalculatorContext);
  appendPromptDerivedDedupe(buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(input.body));
  appendPromptDerivedDedupe(buildActiveTheoryRuntimeContextWorkstationGatewayCallRequests(input.body));
  const activeWorkstationContext = buildActiveWorkstationContextGatewayCallRequests(input.body);
  appendPromptDerivedDedupe(activeWorkstationContext);
  appendPromptDerivedDedupe(buildPromptDerivedReadableSurfaceGatewayCallRequests(input.body));
  if (!promptNamedCapabilities.has(WORKSPACE_OS_STATUS_CAPABILITY)) {
    appendPromptDerivedDedupe(buildPromptDerivedWorkspaceStatusGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY) &&
    !promptNamedCapabilities.has(VOICE_INTERIM_CALLOUT_CAPABILITY) &&
    !promptNamedCapabilities.has(VOICE_NARRATOR_SAY_CAPABILITY) &&
    compoundDependencyCapabilities.size === 0
  ) {
    appendPromptDerivedDedupe(buildPromptDerivedVoiceGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(MORAL_GRAPH_REFLECTION_CAPABILITY) &&
    compoundDependencyCapabilities.size === 0
  ) {
    appendPromptDerivedDedupe(buildPromptDerivedMoralGraphReflectionGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) &&
    !compoundDependencyCapabilities.has(CALCULATOR_SOLVE_EXPRESSION_CAPABILITY)
  ) {
    appendPromptDerivedDedupe(buildPromptDerivedCalculatorSolveGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(THEORY_CONTEXT_REFLECTION_CAPABILITY) &&
    compoundDependencyCapabilities.size === 0
  ) {
    appendPromptDerivedDedupe(buildPromptDerivedTheoryReflectionGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY)) {
    appendPromptDerivedDedupe(buildPromptDerivedCivilizationBoundsGatewayCallRequests(input.body));
  }
  if (
    promptNamedCapabilities.size === 0 &&
    (compoundDependencyCapabilities.size === 0 || allowsCompoundAdjunctCapabilities) &&
    (activeDocsContext.length === 0 || allowsCompoundAdjunctCapabilities) &&
    !paperBackedNumericBindingPhase
  ) {
    appendPromptDerivedDedupe(buildPlannerDerivedWorkstationGatewayCallRequests(input.body));
  }
  const researchLibraryRequests = buildPromptDerivedResearchLibraryGatewayCallRequests(input.body);
  appendPromptDerivedDedupe(researchLibraryRequests);
  if (
    researchLibraryRequests.length === 0 &&
    !promptNamedCapabilities.has(SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) &&
    !promptNamedCapabilities.has(SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY) &&
    !compoundDependencyCapabilities.has(SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) &&
    (compoundDependencyCapabilities.size === 0 || allowsCompoundAdjunctCapabilities)
  ) {
    appendPromptDerivedDedupe(buildPromptDerivedScholarlyResearchGatewayCallRequests(input.body));
  }
  if (
    !promptNamedCapabilities.has(INTERNET_SEARCH_CAPABILITY) &&
    (compoundDependencyCapabilities.size === 0 || allowsCompoundAdjunctCapabilities)
  ) {
    appendPromptDerivedDedupe(buildPromptDerivedInternetSearchGatewayCallRequests(input.body));
  }
  if (!promptNamedCapabilities.has(REPO_SEARCH_CAPABILITY) && !compoundDependencyCapabilities.has(REPO_SEARCH_CAPABILITY)) {
    appendPromptDerivedDedupe(buildPromptDerivedRepoSearchGatewayCallRequests(input.body));
  }
  return finalizeRequests(reduceMoralGraphRequestsToPrimary({
    requests,
    prompt,
    promptNamedCapabilities,
  }));
};

export const hasWorkstationGatewayCallsForTurn = (input: {
  body: Record<string, unknown>;
  includePlannerDerived?: boolean;
}): boolean => readWorkstationGatewayCallRequestsForTurn(input).length > 0;

export const runExplicitWorkstationGatewayCalls = async (input: {
  body: Record<string, unknown>;
  agentRuntime: HelixAgentRuntimeId;
  turnId?: string | null;
  accountContext?: HelixWorkstationGatewayAccountContext;
}): Promise<HelixWorkstationGatewayCallResult[]> => {
  const requests = readWorkstationGatewayCallRequestsForTurn({
    body: input.body,
    includePlannerDerived: hasSelectedHelixAgentRuntime(input.body),
  });
  const turnId = input.turnId ?? readHelixAgentTurnId(input.body);
  const results: HelixWorkstationGatewayCallResult[] = [];
  const accountContext = input.accountContext ??
    await resolveWorkstationGatewayAccountContext(null);
  const executeDependentChain = async (
    request: Record<string, unknown>,
    result: HelixWorkstationGatewayCallResult,
  ): Promise<void> => {
    const dependentRequest = buildDependentCompoundCapabilityGatewayCallRequest({
      request,
      result,
      results,
      turnId,
    });
    const dependencyRailStatus = buildCompoundDependencyRailStatus({
      request,
      result,
      results,
      dependentRequest,
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
    if (dependentRequest && isCodexReasoningDependentRequest(dependentRequest)) {
      attachDependentRequestAsNextAffordance(result, dependentRequest);
    }
    if (!shouldAutoExecuteDependentCompoundRequest(dependentRequest)) return;
    let nextDependentRequest: Record<string, unknown> | null = dependentRequest;
    let dependentDepth = 0;
    while (nextDependentRequest && dependentDepth < 4) {
      dependentDepth += 1;
      const dependentResult = await callAccountAuthorizedWorkstationGatewayCapabilityForProvider({
        accountContext,
        requestedRuntime: input.agentRuntime,
        requestedMode: readString(nextDependentRequest.mode),
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
  };
  let scholarlyPortfolioCloser: {
    request: Record<string, unknown>;
    result: HelixWorkstationGatewayCallResult;
  } | null = null;
  for (const [index, request] of requests.entries()) {
    const result = await callAccountAuthorizedWorkstationGatewayCapabilityForProvider({
      accountContext,
      requestedRuntime: input.agentRuntime,
      requestedMode: readString(request.mode),
      capabilityId: readString(request.capability_id) ?? readString(request.capabilityId) ?? "",
      arguments: readRecord(request.arguments ?? request.args) ?? {},
      approvalToken: readString(request.approval_token) ?? readString(request.approvalToken),
      turnId,
      iteration: typeof request.iteration === "number" ? request.iteration : index + 1,
    });
    results.push(result);
    if (isScholarlyLookupPortfolioCloser(request)) {
      scholarlyPortfolioCloser = { request, result };
      continue;
    }
    await executeDependentChain(request, result);
  }
  if (scholarlyPortfolioCloser) {
    await executeDependentChain(
      scholarlyPortfolioCloser.request,
      selectScholarlyPortfolioDependencySeedResult(results, scholarlyPortfolioCloser.result),
    );
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
