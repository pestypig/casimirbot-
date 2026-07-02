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
  DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
  DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
  DOCS_SEARCH_CAPABILITY,
  INTERNET_SEARCH_CAPABILITY,
  REPO_SEARCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  VOICE_INTERIM_CALLOUT_CAPABILITY,
  VOICE_NARRATOR_SAY_CAPABILITY,
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

const MORAL_SUBSTRATE_DEFERRED_AFFORDANCE_CAPABILITIES = new Set([
  INTERNET_SEARCH_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  THEORY_CONTEXT_REFLECTION_CAPABILITY,
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
]);

const isMoralSubstrateRequest = (request: Record<string, unknown>): boolean =>
  (readString(request.capability_id) ?? readString(request.capabilityId)) === MORAL_SUBSTRATE_PRIMARY_CAPABILITY;

const isMoralSubstrateIntent = (request: Record<string, unknown>): boolean => {
  const sourceTargetIntent = readRecord(readRecord(request.arguments)?.source_target_intent);
  return (
    readString(sourceTargetIntent?.target_kind) === "moral_living_substrate_reflection" ||
    readString(sourceTargetIntent?.intent) === "moral_living_substrate_reflection"
  );
};

const promptExplicitlyRequestsExternalEvidence = (prompt: string): boolean =>
  /\b(?:also|and|then|with|plus|include|using|use|search|look\s+up|find|cite|citations?|sources?|papers?|research|scholarly|arxiv|web|internet|latest|current|recent)\b[\s\S]{0,120}\b(?:search|look\s+up|find|cite|citations?|sources?|papers?|research|scholarly|arxiv|web|internet|latest|current|recent)\b/i.test(
    unquotePrompt(prompt),
  );

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
  return (
    derivationSource === "helix_prompt_named_capability" ||
    explicitCues.includes("prompt_named_capability") ||
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
    source: "helix_moral_substrate_primary_request_reduction",
    capability,
    mode: readString(request.mode) ?? "read",
    purpose: "codex_selected_followup_tool",
    reason: "available_after_moral_substrate_observation_reentry",
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
): Record<string, unknown> => {
  if (affordances.length === 0) return request;
  const args = readRecord(request.arguments) ?? {};
  const sourceTargetIntent = readRecord(args.source_target_intent) ?? {};
  return {
    ...request,
    arguments: {
      ...args,
      next_affordances: [
        ...readArray(args.next_affordances),
        ...affordances,
      ],
      source_target_intent: {
        ...sourceTargetIntent,
        next_affordances: [
          ...readArray(sourceTargetIntent.next_affordances),
          ...affordances,
        ],
      },
    },
  };
};

const reduceMoralSubstrateRequestsToPrimary = (
  input: {
    requests: Record<string, unknown>[];
    prompt: string;
    promptNamedCapabilities: Set<string>;
  },
): Record<string, unknown>[] => {
  const moralIndex = input.requests.findIndex((request) => isMoralSubstrateRequest(request) && isMoralSubstrateIntent(request));
  if (moralIndex < 0) return input.requests;
  const moralRequest = input.requests[moralIndex];
  const deferredAffordances: Record<string, unknown>[] = [];
  const retained: Record<string, unknown>[] = [];

  for (const [index, request] of input.requests.entries()) {
    if (index === moralIndex) continue;
    const capability = readString(request.capability_id) ?? readString(request.capabilityId);
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

  const primary = attachNextAffordancesToRequest(moralRequest, deferredAffordances);
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
    !promptNamedCapabilities.has(VOICE_INTERIM_CALLOUT_CAPABILITY) &&
    !promptNamedCapabilities.has(VOICE_NARRATOR_SAY_CAPABILITY)
  ) {
    appendDedupe(requests, seen, buildPromptDerivedVoiceGatewayCallRequests(input.body));
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
  return reduceMoralSubstrateRequestsToPrimary({
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
