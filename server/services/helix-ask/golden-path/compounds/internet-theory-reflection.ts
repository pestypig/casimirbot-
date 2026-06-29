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
import { buildHelixReflectionObservationLayers } from "../reflection-answer-guidance";

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
  const reflectionLayers = buildHelixReflectionObservationLayers({
    promptText,
    selectedNodes: [topic, ...anchors, ...normalizedResults.slice(0, 3)],
    locatorRationale:
      "The theory reflection was selected after web research so the retrieved evidence can be interpreted with explicit claim boundaries.",
    supportRefs: [internetObservationArtifactId, ...internetEvidenceRefs.map((ref) => ref.ref)].slice(0, 8),
    constraintsIntroduced: [
      "Retrieved web evidence may support current-source claims only through cited result refs.",
      "Theory reflection can shape interpretation but cannot override missing or weak source evidence.",
      "Any trend, recommendation, or mechanism claim must stay tied to the retrieved result set.",
    ],
    missingEvidence: normalizedResults.length > 0 ? [] : ["internet_search_result_refs"],
    practicalFraming:
      "Use the research as evidence and the reflection as a claim boundary for what the final answer may safely infer.",
    allowedClaims: [
      "The final answer may summarize what the retrieved results support.",
      "The reflection may identify which claims should remain conditional or blocked.",
    ],
    conditionalClaims: [
      "Broader conclusions are conditional on source quality, recency, and additional corroborating evidence.",
    ],
    blockedClaims: [
      "Do not generalize beyond the retrieved sources.",
      "Do not treat theory reflection as a source citation.",
      "Do not claim proof or implementation readiness from research plus reflection alone.",
    ],
    reasoningMoves: [
      "Name the retrieved evidence set.",
      "Use the reflection topic to bound interpretation.",
      "Separate source-backed claims from conditional claims.",
      "Identify the next evidence gap.",
    ],
    suggestedAnswerShape: [
      "Start with the source-backed answer.",
      "Explain how the reflection constrains interpretation.",
      "State what remains conditional or blocked.",
      "Cite the evidence refs or ask for more evidence.",
    ],
    wordingGuidance:
      "Synthesize the source-backed point in prose and mention reflection only as a bounding procedure, not as a separate answer.",
    compoundHandoffNotes: {
      docs: "Use document retrieval for source-specific gaps that web results do not close.",
      calculator: "Compute only quantities explicitly present in the retrieved evidence.",
      terminal_synthesis: "Use answer_guidance for claim boundaries and internet_search_observation for facts.",
    },
  });
  const reflectionReceipt = {
    schema: "helix.theory_context_reflection_tool_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    topic,
    anchors,
    source_refs: [internetObservationArtifactId, ...internetEvidenceRefs.map((ref) => ref.ref)].slice(0, 8),
    reflection_mode: "golden_path_research_grounded_context",
    ...reflectionLayers,
    assistant_answer: false,
    terminal_eligible: false,
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
    anchors.length > 0
      ? `The reflection bounds interpretation through these anchors: ${anchors.join(", ")}.`
      : "No reflection anchors were provided, so broader interpretation stays conditional.",
    "Use the web observation for factual claims and the reflection guidance for claim limits; neither receipt is itself the final answer.",
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
