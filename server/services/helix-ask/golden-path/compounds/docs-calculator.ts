import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  readCalculatorExpression,
} from "../capabilities/calculator";
import {
  findGoldenPathDocLocationMatches,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "../capabilities/docs-locate";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathDocsCalculatorCompoundRequested,
} from "../compound-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readString,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";

export type HelixAskGoldenPathDocsCalculatorCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["doc_location_matches", "calculator_receipt"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    observation_kind: "doc_location_matches",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    observation_kind: "calculator_receipt",
  },
] as const;
export const isRequested = isHelixAskGoldenPathDocsCalculatorCompoundRequested;
export const buildHelixAskGoldenPathDocsCalculatorCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathDocsCalculatorCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-docs-calculator:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const calculatorObservationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);
  const expression = readCalculatorExpression(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_doc_location_query"
      | "missing_doc_content"
      | "no_doc_location_matches"
      | "missing_calculator_expression"
      | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "observation" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: "compound_capability_contract",
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_docs_calculator_compound_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: "compound_capability_contract",
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
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
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "docs_calculator_compound_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
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
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        source_target: "compound",
        family: "compound",
        args: { doc_path: docPath, query, expression },
        required_observation_kinds: ["doc_location_matches", "calculator_receipt"],
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
        route: "golden_path_runtime / docs_calculator_compound",
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
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: "compound_capability_contract",
        selectedCapability: "compound_capability_contract",
        executedCapability: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: params.brokenRail,
        terminalErrorCode: params.errorCode,
        extra: { compound_subgoal_count: 2 },
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          terminalEligible: false,
          requestedCapability: "compound_capability_contract",
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
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "docs_calculator_compound_failed",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
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
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path docs/calculator turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path docs/calculator turn because no readable document content was available.",
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
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path docs/calculator turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path docs/calculator turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const resultText = formatGoldenPathNumber(result);
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
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "docs_locate",
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observationKind: "doc_location_matches",
        observationRef: docObservationArtifactId,
        terminalContributionKind: "doc_location_matches",
      },
      {
        subgoalIdSuffix: "calculator",
        requestedCapability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        args: { expression },
        observationKind: "calculator_receipt",
        observationRef: calculatorObservationArtifactId,
        terminalContributionKind: "workstation_tool_evaluation",
      },
    ],
  });
  const answerText = [
    "Compound docs/calculator synthesis completed.",
    `Document query: ${query}`,
    docPath ? `Document: ${docPath}` : "",
    `Top document evidence: line ${matches[0]?.line ?? "unknown"} - ${matches[0]?.snippet ?? ""}`,
    `Calculator expression: ${expression}`,
    `Calculator result: ${resultText}`,
    "The document evidence and calculator receipt are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_docs_calculator_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
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
    supportRefs: [
      docObservationArtifactId,
      calculatorObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
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
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "docs_calculator_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: docObservationArtifactId,
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
    compound_capability_contract: compoundCapabilityContract,
    doc_location_matches: docLocationMatches,
    calculator_receipt: calculatorReceipt,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["doc_location_matches", "calculator_receipt"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / docs_calculator_compound",
    }),
    terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: "compound_capability_contract",
      selectedCapability: "compound_capability_contract",
      executedCapability: "compound_capability_contract",
      observedArtifactKind: "compound_subgoal_observations",
      observedArtifactRef: docObservationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        compound_subgoal_count: 2,
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
        requestedCapability: "compound_capability_contract",
        compoundCapabilityContract,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: docObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "doc_location_matches",
        producerItemId: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        terminalEligible: false,
        payload: docLocationMatches,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: calculatorObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "calculator_receipt",
        producerItemId: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        terminalEligible: false,
        payload: calculatorReceipt,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        producerItemId: "golden_path_compound_synthesis",
        payloadSchema: "helix.compound_evidence_synthesis_answer.v1",
        terminalResult,
        extraPayload: { satisfied_subgoal_count: 2 },
      }),
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "docs_calculator_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};
export const buildPayload = buildHelixAskGoldenPathDocsCalculatorCompoundPayload;
