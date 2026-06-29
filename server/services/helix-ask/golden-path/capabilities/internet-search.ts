import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA } from "../../../../../shared/helix-internet-search-observation";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityExplicitlyRequested,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathInternetSearchDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathInternetSearchRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityExplicitlyRequested(body, [HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY, HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY) ||
    prompt.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY) ||
    /\b(?:internet\s+search|web\s+research|web\s+search|search\s+web|look\s+up\s+online|check\s+online|current\s+web|public\s+web)\b/.test(prompt)
  );
};

export const readInternetSearchQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.internet_search_query) ??
    readString(body.internetSearchQuery) ??
    readString(body.web_research_query) ??
    readString(body.webResearchQuery) ??
    readString(body.query);
  if (direct) return direct;
  const cleaned = readHelixAskGoldenPathPrompt(body)
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/internet_search\.web_research/gi, "")
    .replace(/internet-search\.search_web/gi, "")
    .replace(/\b(?:use|run|call|lookup|look\s+up|search|find|research|web|internet|online|for|about)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

export const readCompactInternetSearchResults = (body: RecordLike): RecordLike[] => {
  const observation =
    readRecord(body.internet_search_observation) ??
    readRecord(body.internetSearchObservation) ??
    readRecord(body.compact_internet_search_observation) ??
    readRecord(body.compactInternetSearchObservation);
  const observedResults = observation
    ? readArray(observation.results).map(readRecord).filter((result): result is RecordLike => Boolean(result))
    : [];
  if (observedResults.length > 0) return observedResults;
  return readArray(body.internet_search_results ?? body.internetSearchResults ?? body.web_results ?? body.webResults)
    .map(readRecord)
    .filter((result): result is RecordLike => Boolean(result));
};


export const buildHelixAskGoldenPathInternetSearchPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathInternetSearchDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-internet",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:internet_search_observation`;
  const terminalArtifactId = `${turnId}:internet_search_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "internet_search_answer";
  const goalKind = "internet_search_lookup";
  const query = readInternetSearchQuery(args.body);
  const results = readCompactInternetSearchResults(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_internet_search_query" | "missing_compact_internet_search_evidence";
    brokenRail: "argument_extraction" | "observation";
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
      answerScope: "external_internet_search",
      goalKind,
      classifierReasons: ["explicit_internet_search_request"],
      requestedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      sourceTarget: "internet_search",
      family: "internet_search",
      requiredObservationKinds,
      status: "internet_search_lookup_failed",
      route: "golden_path_runtime / internet_search_lookup",
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
      routeGate: "enabled_explicit_request",
      debugStatus: "internet_search_lookup_failed",
      includeGoalSatisfactionInDebug: true,
      includeLedgerSupportRefs: true,
      includeTerminalErrorCodeInSolverTrace: true,
      includeFirstBrokenRailInTerminalAuthority: true,
      hashGoalFrame: args.deps.hashGoalFrame,
    });

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_internet_search_query",
      brokenRail: "argument_extraction",
      missingRequirement: "internet_search_query",
      text: "I could not complete this golden-path internet search turn because no web search query was provided.",
    });
  }
  if (results.length === 0) {
    return makeFailurePayload({
      errorCode: "missing_compact_internet_search_evidence",
      brokenRail: "observation",
      missingRequirement: "internet_search_observation",
      text: "I could not complete this golden-path internet search turn because no compact web result evidence was provided.",
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
  const evidenceRefs = normalizedResults.flatMap((result) =>
    result.evidence_refs.map((ref) => ({
      ref,
      provider: result.source_provider,
      url: result.url,
      retrieved_at_ms: createdAtMs,
    })),
  );
  const domains = readStringArray(args.body.domains);
  const recencyDays = readNumber(args.body.recency_days) ?? readNumber(args.body.recencyDays);
  const observation = {
    schema: HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
    artifact_id: observationArtifactId,
    turn_id: turnId,
    capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    query,
    providers_considered: readStringArray(args.body.providers_considered ?? args.body.providersConsidered),
    providers_called: readStringArray(args.body.providers_called ?? args.body.providersCalled),
    evidence_refs: evidenceRefs,
    results: normalizedResults,
    ...(domains.length ? { domains } : {}),
    ...(typeof recencyDays === "number" ? { recency_days: recencyDays } : {}),
    missing_requirements: [],
    selected_for_answer: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerLines = [
    `Internet search completed for: ${query}`,
    ...normalizedResults.slice(0, 3).map((result, index) => `${index + 1}. ${result.title} - ${result.url}`),
    "This answer is grounded in compact web metadata supplied to the current turn; provider lookup is not run inside the golden path.",
  ];
  const answerText = answerLines.join("\n");
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
    answerScope: "external_internet_search",
    sourceTarget: "internet_search",
    family: "internet_search",
    planArgs: { query },
    classifierReasons: ["explicit_internet_search_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
    selectedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    executedCapability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    observedArtifactKind: "internet_search_observation",
    observationPayload: observation,
    observationProducerItemId: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    terminalPayloadField: "internet_search_answer",
    terminalPayloadSchema: "helix.internet_search_answer.v1",
    terminalPayloadExtra: { result_count: normalizedResults.length },
    answerText,
    status: "internet_search_lookup",
    route: "golden_path_runtime / internet_search_lookup",
    requiredObservationKinds,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_internet_search_synthesis",
    answerLedgerExtraPayload: { result_count: normalizedResults.length },
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};

export const requiredObservationKinds = ["internet_search_observation"] as const;
export const requiredTerminalKinds = ["internet_search_answer"] as const;
export const isRequested = isHelixAskGoldenPathInternetSearchRequested;
export const buildPayload = buildHelixAskGoldenPathInternetSearchPayload;
