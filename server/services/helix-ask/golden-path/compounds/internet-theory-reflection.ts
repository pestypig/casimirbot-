import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA } from "../../../../../shared/helix-internet-search-observation";
import {
  readCompactInternetSearchResults,
  readInternetSearchQuery,
} from "../capabilities/internet-search";
import {
  readTheoryReflectionAnchors,
  readTheoryReflectionTopic,
} from "../capabilities/theory-reflection";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathInternetResearchReflectionCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readNumber,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathInternetResearchReflectionCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = [
  "internet_search_observation",
  "helix_theory_context_reflection_tool_receipt",
] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
    allowed_requested_capabilities: [
      HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    ],
    observation_kind: "internet_search_observation",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    observation_kind: "helix_theory_context_reflection_tool_receipt",
  },
] as const;
export const isRequested = isHelixAskGoldenPathInternetResearchReflectionCompoundRequested;
export const buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathInternetResearchReflectionCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-research-reflection",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const internetObservationArtifactId = `${turnId}:internet_search_observation`;
  const reflectionObservationArtifactId = `${turnId}:helix_theory_context_reflection_tool_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const query = readInternetSearchQuery(args.body);
  const results = readCompactInternetSearchResults(args.body);
  const topic = readTheoryReflectionTopic(args.body);
  const anchors = readTheoryReflectionAnchors(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_internet_search_query"
      | "missing_compact_internet_search_evidence"
      | "missing_theory_reflection_topic";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    return buildGoldenPathCompoundTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      classifierReasons: ["explicit_internet_research_reflection_compound_request"],
      hashGoalFrame: deps.hashGoalFrame,
      status: "internet_research_reflection_compound_failed",
      route: "golden_path_runtime / internet_research_reflection_compound",
      requiredObservationKinds,
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
    });
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_internet_search_query",
      brokenRail: "argument_extraction",
      missingRequirement: "internet_search_query",
      text: "I could not complete this golden-path research/reflection turn because no web search query was provided.",
    });
  }
  if (results.length === 0) {
    return makeFailurePayload({
      errorCode: "missing_compact_internet_search_evidence",
      brokenRail: "observation",
      missingRequirement: "internet_search_observation",
      text: "I could not complete this golden-path research/reflection turn because no compact web result evidence was provided.",
    });
  }
  if (!topic) {
    return makeFailurePayload({
      errorCode: "missing_theory_reflection_topic",
      brokenRail: "argument_extraction",
      missingRequirement: "theory_reflection_topic",
      text: "I could not complete this golden-path research/reflection turn because no reflection topic was provided.",
    });
  }

  const normalizedResults = results.slice(0, 5).map((result, index) => {
    const url = readString(result.url) ?? `https://example.invalid/result-${index + 1}`;
    const evidenceRefs = readStringArray(result.evidence_refs ?? result.evidenceRefs);
    return {
      result_id: readString(result.result_id) ?? readString(result.resultId) ?? `${turnId}:web_result:${index + 1}`,
      title: readString(result.title) ?? url,
      url,
      snippet: readString(result.snippet) ?? undefined,
      content_excerpt: readString(result.content_excerpt) ?? readString(result.contentExcerpt) ?? undefined,
      published_at: readString(result.published_at) ?? readString(result.publishedAt) ?? undefined,
      source_provider: readString(result.source_provider) ?? readString(result.sourceProvider) ?? "tavily",
      rank: readNumber(result.rank) ?? index + 1,
      evidence_refs: evidenceRefs.length ? evidenceRefs : [`internet_search:${index + 1}`],
      confidence: readString(result.confidence) ?? "medium",
    };
  });
  const internetEvidenceRefs = normalizedResults.flatMap((result) =>
    result.evidence_refs.map((ref) => ({
      ref,
      provider: result.source_provider,
      url: result.url,
      retrieved_at_ms: createdAtMs,
    })),
  );
  const internetObservation = {
    schema: HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
    artifact_id: internetObservationArtifactId,
    turn_id: turnId,
    capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    query,
    providers_considered: readStringArray(args.body.providers_considered ?? args.body.providersConsidered),
    providers_called: readStringArray(args.body.providers_called ?? args.body.providersCalled),
    evidence_refs: internetEvidenceRefs,
    results: normalizedResults,
    missing_requirements: [],
    selected_for_answer: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const reflectionReceipt = {
    schema: "helix.theory_context_reflection_tool_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    topic,
    anchors,
    source_refs: [internetObservationArtifactId, ...internetEvidenceRefs.map((ref) => ref.ref)].slice(0, 8),
    reflection_mode: "golden_path_research_grounded_context",
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "internet_search",
        requestedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        args: { query },
        observationKind: "internet_search_observation",
        observationRef: internetObservationArtifactId,
        terminalContributionKind: "internet_search_answer",
      },
      {
        subgoalIdSuffix: "theory_reflection",
        requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        args: { topic, anchors },
        observationKind: "helix_theory_context_reflection_tool_receipt",
        observationRef: reflectionObservationArtifactId,
        terminalContributionKind: "theory_context_reflection_answer",
      },
    ],
  });
  const answerText = [
    "Compound research/reflection synthesis completed.",
    `Research query: ${query}`,
    normalizedResults[0] ? `Top web result: ${normalizedResults[0].title} - ${normalizedResults[0].url}` : "",
    `Reflection topic: ${topic}`,
    anchors.length > 0 ? `Reflection anchors: ${anchors.join(", ")}.` : "Reflection anchors: none provided.",
    "The web observation and theory reflection receipt are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  return buildGoldenPathCompoundSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalResultId,
    terminalArtifactId,
    requiredTerminalKind,
    classifierReasons: ["explicit_internet_research_reflection_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [internetObservationArtifactId, reflectionObservationArtifactId],
    status: "internet_research_reflection_compound",
    route: "golden_path_runtime / internet_research_reflection_compound",
    observedArtifactRef: internetObservationArtifactId,
    requiredObservationKinds,
    observationFields: {
      internet_search_observation: internetObservation,
      helix_theory_context_reflection_tool_receipt: reflectionReceipt,
    },
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: [
          {
            artifactId: internetObservationArtifactId,
            kind: "internet_search_observation",
            producerItemId: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
            terminalEligible: false,
            payload: internetObservation,
          },
          {
            artifactId: reflectionObservationArtifactId,
            kind: "helix_theory_context_reflection_tool_receipt",
            producerItemId: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
            terminalEligible: false,
            payload: reflectionReceipt,
          },
        ],
      }),
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_compound_synthesis",
  });
};
export const buildPayload = buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload;
