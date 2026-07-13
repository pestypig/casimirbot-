import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA } from "../../../../../shared/helix-scholarly-research-observation";
import { isSavedResearchLibraryEvidencePrompt } from "../../../../../shared/helix-research-library";
import { isAskTurnCapabilityHelpIntent } from "../../capability-catalog-intent";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathScholarlyResearchDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathScholarlyResearchRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY])) return true;
  const rawPrompt = readHelixAskGoldenPathPrompt(body);
  if (isAskTurnCapabilityHelpIntent(rawPrompt)) return false;
  if (isSavedResearchLibraryEvidencePrompt(rawPrompt)) return false;
  const prompt = rawPrompt.toLowerCase();
  return (
    /\b(?:scholarly\s+research|scholarly\s+papers?|research\s+papers?|paper\s+metadata|papers?\s+for\s+corroboration|corroborat(?:e|ion)|peer[-\s]?reviewed|literature|preprints?|arxiv|crossref|openalex|semantic\s+scholar)\b/.test(prompt)
  );
};

export const readScholarlyResearchQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.scholarly_query) ??
    readString(body.scholarlyQuery) ??
    readString(body.research_query) ??
    readString(body.researchQuery) ??
    readString(body.query);
  if (direct) return direct;
  const cleaned = readHelixAskGoldenPathPrompt(body)
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/scholarly-research\.lookup_papers/gi, "")
    .replace(/\b(?:use|run|call|lookup|look\s+up|search|find|research|papers?|scholarly|literature|metadata|for|about)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

export const readCompactScholarlyPapers = (body: RecordLike): RecordLike[] => {
  const observation =
    readRecord(body.scholarly_research_observation) ??
    readRecord(body.scholarlyResearchObservation) ??
    readRecord(body.compact_scholarly_research_observation) ??
    readRecord(body.compactScholarlyResearchObservation);
  const observedPapers = observation
    ? readArray(observation.papers).map(readRecord).filter((paper): paper is RecordLike => Boolean(paper))
    : [];
  if (observedPapers.length > 0) return observedPapers;
  return readArray(body.scholarly_papers ?? body.scholarlyPapers ?? body.papers)
    .map(readRecord)
    .filter((paper): paper is RecordLike => Boolean(paper));
};


export const buildHelixAskGoldenPathScholarlyResearchPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathScholarlyResearchDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-scholarly",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:scholarly_research_observation`;
  const terminalArtifactId = `${turnId}:scholarly_research_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "scholarly_research_answer";
  const goalKind = "scholarly_research_lookup";
  const query = readScholarlyResearchQuery(args.body);
  const papers = readCompactScholarlyPapers(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_scholarly_query" | "missing_compact_scholarly_evidence";
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
      answerScope: "external_scholarly_research",
      goalKind,
      classifierReasons: ["explicit_scholarly_research_lookup_request"],
      requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      sourceTarget: "scholarly_research",
      family: "scholarly_research",
      requiredObservationKinds: ["scholarly_research_observation"],
      status: "scholarly_research_lookup_failed",
      route: "golden_path_runtime / scholarly_research_lookup",
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
      routeGate: "enabled_explicit_request",
      debugStatus: "scholarly_research_lookup_failed",
      includeGoalSatisfactionInDebug: true,
      includeLedgerSupportRefs: true,
      includeTerminalErrorCodeInSolverTrace: true,
      includeFirstBrokenRailInTerminalAuthority: true,
      hashGoalFrame: args.deps.hashGoalFrame,
    });

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_scholarly_query",
      brokenRail: "argument_extraction",
      missingRequirement: "scholarly_query",
      text: "I could not complete this golden-path scholarly research turn because no research query was provided.",
    });
  }
  if (papers.length === 0) {
    return makeFailurePayload({
      errorCode: "missing_compact_scholarly_evidence",
      brokenRail: "observation",
      missingRequirement: "scholarly_research_observation",
      text: "I could not complete this golden-path scholarly research turn because no compact scholarly paper evidence was provided.",
    });
  }

  const normalizedPapers = papers.slice(0, 5).map((paper, index) => {
    const title = readString(paper.title) ?? `Untitled paper ${index + 1}`;
    const evidenceRefs = readStringArray(paper.evidence_refs ?? paper.evidenceRefs);
    return {
      result_id: readString(paper.result_id) ?? readString(paper.resultId) ?? `${turnId}:paper:${index + 1}`,
      title,
      authors: readArray(paper.authors).map(readRecord).filter((author): author is RecordLike => Boolean(author)),
      year: readNumber(paper.year) ?? undefined,
      venue: readString(paper.venue) ?? undefined,
      abstract: readString(paper.abstract) ?? undefined,
      identifiers: readRecord(paper.identifiers) ?? {},
      evidence_refs: evidenceRefs.length ? evidenceRefs : [`scholarly:${index + 1}`],
      source_providers: readStringArray(paper.source_providers ?? paper.sourceProviders),
      confidence: readString(paper.confidence) ?? "medium",
    };
  });
  const evidenceRefs = normalizedPapers.flatMap((paper) => paper.evidence_refs).map((ref, index) => ({
    ref,
    provider: (readString(normalizedPapers[index]?.source_providers?.[0]) ?? "openalex") as string,
    retrieved_at_ms: createdAtMs,
  }));
  const observation = {
    schema: HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
    artifact_id: observationArtifactId,
    turn_id: turnId,
    capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    query,
    intent: readString(args.body.scholarly_intent) ?? readString(args.body.scholarlyIntent) ?? "paper_search",
    providers_considered: readStringArray(args.body.providers_considered ?? args.body.providersConsidered),
    providers_called: readStringArray(args.body.providers_called ?? args.body.providersCalled),
    evidence_refs: evidenceRefs,
    papers: normalizedPapers,
    missing_requirements: [],
    selected_for_answer: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerLines = [
    `Scholarly research lookup completed for: ${query}`,
    ...normalizedPapers.slice(0, 3).map((paper, index) => {
      const year = typeof paper.year === "number" ? ` (${paper.year})` : "";
      const venue = paper.venue ? `, ${paper.venue}` : "";
      return `${index + 1}. ${paper.title}${year}${venue}.`;
    }),
    "This answer is grounded in compact scholarly metadata supplied to the current turn; provider lookup is not run inside the golden path.",
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
    answerScope: "external_scholarly_research",
    sourceTarget: "scholarly_research",
    family: "scholarly_research",
    planArgs: { query },
    classifierReasons: ["explicit_scholarly_research_lookup_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    observedArtifactKind: "scholarly_research_observation",
    observationPayload: observation,
    observationProducerItemId: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    terminalPayloadField: "scholarly_research_answer",
    terminalPayloadSchema: "helix.scholarly_research_answer.v1",
    terminalPayloadExtra: { paper_count: normalizedPapers.length },
    answerText,
    status: "scholarly_research_lookup",
    route: "golden_path_runtime / scholarly_research_lookup",
    requiredObservationKinds: ["scholarly_research_observation"],
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_scholarly_research_synthesis",
    answerLedgerExtraPayload: { paper_count: normalizedPapers.length },
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};

export const requiredObservationKinds = ["scholarly_research_observation"] as const;
export const requiredTerminalKinds = ["scholarly_research_answer"] as const;
export const isRequested = isHelixAskGoldenPathScholarlyResearchRequested;
export const buildPayload = buildHelixAskGoldenPathScholarlyResearchPayload;
