import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA } from "../../../../../shared/helix-internet-search-observation";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";

export type HelixAskGoldenPathInternetSearchDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathInternetSearchRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY)) return true;
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY) return true;
  if (requestedCapability === HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY) return true;
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
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-internet:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:internet_search_observation`;
  const terminalArtifactId = `${turnId}:internet_search_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "internet_search_answer";
  const goalKind = "internet_search_lookup";
  const query = readInternetSearchQuery(args.body);
  const results = readCompactInternetSearchResults(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_internet_search_query" | "missing_compact_internet_search_evidence";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "external_internet_search",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_internet_search_request"],
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
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
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
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "internet_search_lookup_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        source_target: "internet_search",
        family: "internet_search",
        required_observation_kinds: ["internet_search_observation"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / internet_search_lookup",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
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
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "internet_search_lookup_failed",
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

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
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "external_internet_search",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_internet_search_request"],
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
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    internet_search_observation: observation,
    internet_search_answer: {
      schema: "helix.internet_search_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      result_count: normalizedResults.length,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "internet_search_lookup",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      observed_artifact_kind: "internet_search_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      source_target: "internet_search",
      family: "internet_search",
      args: { query },
      required_observation_kinds: ["internet_search_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / internet_search_lookup",
    }),
    terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      observed_artifact_kind: "internet_search_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        kind: "internet_search_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: observation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_internet_search_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.internet_search_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          result_count: normalizedResults.length,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "internet_search_lookup",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      observed_artifact_kind: "internet_search_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

export const requiredObservationKinds = ["internet_search_observation"] as const;
export const requiredTerminalKinds = ["internet_search_answer"] as const;
export const isRequested = isHelixAskGoldenPathInternetSearchRequested;
export const buildPayload = buildHelixAskGoldenPathInternetSearchPayload;
