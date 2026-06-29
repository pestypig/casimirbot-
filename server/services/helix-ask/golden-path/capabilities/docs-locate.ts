import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "../capability-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
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
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";

export type HelixAskGoldenPathDocsLocateDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathDocsLocateRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY) ||
    /\b(?:locate|find|cite|check)\b[\s\S]{0,120}\b(?:doc|document|white\s*paper|paper)\b/.test(prompt) ||
    /\b(?:doc|document|white\s*paper|paper)\b[\s\S]{0,120}\b(?:locate|find|cite|check)\b/.test(prompt)
  );
};


export const readGoldenPathDocPath = (body: RecordLike): string | null => {
  const direct =
    readString(body.doc_path) ??
    readString(body.docPath) ??
    readString(body.active_doc_path) ??
    readString(body.activeDocPath);
  if (direct) return direct.replace(/\\/g, "/").replace(/[),.;:!?]+$/g, "");
  const prompt = readHelixAskGoldenPathPrompt(body);
  const match = prompt.match(/\bdocs\/[^\s"'`<>]+/i);
  return match?.[0] ? match[0].replace(/[),.;:!?]+$/g, "") : null;
};

export const readGoldenPathDocContent = (body: RecordLike): string | null => {
  return (
    readString(body.doc_content) ??
    readString(body.docContent) ??
    readString(body.document_content) ??
    readString(body.documentContent) ??
    readString(body.active_doc_content) ??
    readString(body.activeDocContent)
  );
};

export const readGoldenPathDocLocateQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.query) ??
    readString(body.search_query) ??
    readString(body.searchQuery) ??
    readString(body.locate_query) ??
    readString(body.locateQuery);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const quoted = prompt.match(/["â€œ]([^"â€]{3,160})["â€]/);
  if (quoted?.[1]) return quoted[1].trim();
  const afterCapability = prompt.match(/docs-viewer\.locate_in_doc(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].replace(/\bdocs\/[^\s"'`<>]+/gi, "").trim();
  return (
    prompt
      .replace(/helix_ask_golden_path_runtime/gi, "")
      .replace(/docs-viewer\.locate_in_doc/gi, "")
      .replace(/\bdocs\/[^\s"'`<>]+/gi, "")
      .replace(/\b(?:check|locate|find|cite|in|the|white\s*paper|document|doc|paper|for|use)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  );
};

export const findGoldenPathDocLocationMatches = (args: {
  content: string;
  query: string;
  docPath: string | null;
}): Array<{ line: number; snippet: string; doc_path: string | null; score: number }> => {
  const queryTokens = Array.from(
    new Set(
      args.query
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length > 2),
    ),
  );
  if (queryTokens.length === 0) return [];
  return args.content
    .split(/\r?\n/)
    .map((line, index) => {
      const normalizedLine = line.toLowerCase();
      const hits = queryTokens.filter((token) => normalizedLine.includes(token)).length;
      return {
        line: index + 1,
        snippet: line.trim(),
        doc_path: args.docPath,
        score: hits,
      };
    })
    .filter((match) => match.snippet && match.score >= Math.min(2, queryTokens.length))
    .sort((left, right) => right.score - left.score || left.line - right.line)
    .slice(0, 5);
};


export const buildHelixAskGoldenPathDocsLocatePayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathDocsLocateDependencies;
}): RecordLike => {
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-docs-locate:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "doc_location_matches";
  const goalKind = "locate_in_doc";
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_doc_location_query" | "missing_doc_content" | "no_doc_location_matches";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const terminalArtifactId = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_docs_locate_request"],
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
      artifactId: terminalArtifactId,
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
      terminal_artifact_id: terminalArtifactId,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "docs_locate_failed",
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executedCapability: null,
        firstBrokenRail: params.brokenRail,
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executedCapability: null,
        sourceTarget: "docs_viewer",
        family: "docs_viewer",
        planArgs: { doc_path: docPath, query },
        requiredObservationKinds,
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / docs_locate_in_doc",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executedCapability: null,
        firstBrokenRail: params.brokenRail,
        terminalArtifactKind: "typed_failure",
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        }),
        buildGoldenPathPayloadLedgerArtifact({
          artifactId: terminalArtifactId,
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
            assistant_answer: false,
            raw_content_included: false,
          },
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executedCapability: null,
        terminalResult,
        firstBrokenRail: params.brokenRail,
        terminalErrorCode: params.errorCode,
      }),
    };
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path docs locate turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path docs locate turn because no readable document content was available.",
    });
  }
  const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
  if (matches.length === 0) {
    return makeFailurePayload({
      errorCode: "no_doc_location_matches",
      brokenRail: "observation",
      missingRequirement: "doc_location_matches",
      text: `I could not locate matching document evidence for: ${query}`,
    });
  }

  const observationArtifactId = `${turnId}:doc_location_matches`;
  const terminalArtifactId = observationArtifactId;
  const answerText = [
    `Located ${matches.length} document evidence match${matches.length === 1 ? "" : "es"} for: ${query}`,
    docPath ? `Document: ${docPath}` : null,
    ...matches.map((match, index) => `${index + 1}. Line ${match.line}: ${match.snippet}`),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_docs_locate_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId,
    goalKind,
    requiredTerminalKind,
  });
  const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const docLocationMatches = {
    schema: "helix.doc_location_matches.v1",
    capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    doc_path: docPath,
    query,
    match_count: matches.length,
    matches,
    assistant_answer: false,
    raw_content_included: false,
  };
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
    doc_location_matches: docLocationMatches,
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: "docs_locate_in_doc",
      requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      observedArtifactKind: "doc_location_matches",
      observedArtifactRef: observationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      sourceTarget: "docs_viewer",
      family: "docs_viewer",
      planArgs: { doc_path: docPath, query },
      requiredObservationKinds,
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / docs_locate_in_doc",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      observedArtifactKind: "doc_location_matches",
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
        promptText,
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: observationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "doc_location_matches",
        payload: docLocationMatches,
        terminalEligible: true,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: "docs_locate_in_doc",
      privateRuntimeLoopEntered: false,
      requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      observedArtifactKind: "doc_location_matches",
      observedArtifactRef: observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};


export const requiredObservationKinds = ["doc_location_matches"] as const;
export const requiredTerminalKinds = ["doc_location_matches"] as const;
export const isRequested = isHelixAskGoldenPathDocsLocateRequested;
export const buildPayload = buildHelixAskGoldenPathDocsLocatePayload;
