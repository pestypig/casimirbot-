import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA } from "../../../../../shared/helix-scholarly-research-observation";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import { buildGoldenPathCapabilityPlan } from "../capability-contract";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTerminalResult,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";

export type HelixAskGoldenPathScholarlyResearchDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathScholarlyResearchRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY) ||
    /\b(?:scholarly\s+research|research\s+papers?|paper\s+metadata|peer[-\s]?reviewed|literature|preprints?|arxiv|crossref|openalex|semantic\s+scholar)\b/.test(prompt)
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
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-scholarly:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:scholarly_research_observation`;
  const terminalArtifactId = `${turnId}:scholarly_research_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "scholarly_research_answer";
  const goalKind = "scholarly_research_lookup";
  const query = readScholarlyResearchQuery(args.body);
  const papers = readCompactScholarlyPapers(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_scholarly_query" | "missing_compact_scholarly_evidence";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "external_scholarly_research",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_scholarly_research_lookup_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult = buildGoldenPathTypedFailureTerminalResult({
      resultId: terminalResultId,
      artifactId: `${turnId}:typed_failure`,
      text: params.text,
      supportRefs: [routeGateArtifactId],
    });
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "scholarly_research_lookup_failed",
        requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executedCapability: null,
        firstBrokenRail: params.brokenRail,
        routeGate: "enabled_explicit_request",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        sourceTarget: "scholarly_research",
        family: "scholarly_research",
        executedCapability: null,
        requiredObservationKinds: ["scholarly_research_observation"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / scholarly_research_lookup",
        firstBrokenRail: params.brokenRail,
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executedCapability: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: params.brokenRail,
        terminalErrorCode: params.errorCode,
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        }),
        buildGoldenPathPayloadLedgerArtifact({
          artifactId: terminalResult.artifact_id,
          turnId,
          createdAtMs,
          goalHash,
          kind: "typed_failure",
          terminalEligible: true,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        status: "scholarly_research_lookup_failed",
        requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executedCapability: null,
        terminalResult,
        firstBrokenRail: params.brokenRail,
        terminalErrorCode: params.errorCode,
        goalSatisfactionEvaluation,
      }),
    };
  };

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
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "external_scholarly_research",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_scholarly_research_lookup_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult = buildGoldenPathTerminalResult({
    resultId: terminalResultId,
    artifactId: terminalArtifactId,
    artifactKind: requiredTerminalKind,
    finalAnswerSource: requiredTerminalKind,
    text: answerText,
    supportRefs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    ...buildGoldenPathTerminalResponseProjection({ terminalResult }),
    scholarly_research_observation: observation,
    scholarly_research_answer: {
      schema: "helix.scholarly_research_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      paper_count: normalizedPapers.length,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: "scholarly_research_lookup",
      requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      observedArtifactKind: "scholarly_research_observation",
      observedArtifactRef: observationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
      routeGate: "enabled_explicit_request",
    }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      sourceTarget: "scholarly_research",
      family: "scholarly_research",
      planArgs: { query },
      requiredObservationKinds: ["scholarly_research_observation"],
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / scholarly_research_lookup",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      observedArtifactKind: "scholarly_research_observation",
      observedArtifactRef: observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: routeGateArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        terminalEligible: false,
        promptText,
        requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: observationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        producerItemId: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        kind: "scholarly_research_observation",
        payload: observation,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        producerItemId: "golden_path_scholarly_research_synthesis",
        kind: requiredTerminalKind,
        payloadSchema: "helix.scholarly_research_answer.v1",
        terminalResult,
        extraPayload: {
          paper_count: normalizedPapers.length,
        },
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: "scholarly_research_lookup",
      privateRuntimeLoopEntered: false,
      requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      observedArtifactKind: "scholarly_research_observation",
      observedArtifactRef: observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};

export const requiredObservationKinds = ["scholarly_research_observation"] as const;
export const requiredTerminalKinds = ["scholarly_research_answer"] as const;
export const isRequested = isHelixAskGoldenPathScholarlyResearchRequested;
export const buildPayload = buildHelixAskGoldenPathScholarlyResearchPayload;
