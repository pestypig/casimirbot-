import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  findGoldenPathDocLocationMatches,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "../capabilities/docs-locate";
import {
  findGoldenPathRepoEvidence,
  readGoldenPathRepoSearchFiles,
  readRepoSearchConcept,
} from "../capabilities/repo-search-concept";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCanonicalGoalFrame,
  buildGoldenPathCompoundCapabilityContract,
  buildGoldenPathCompoundEvidenceSynthesisAnswer,
  buildGoldenPathCompoundGoalSatisfactionEvaluation,
  isHelixAskGoldenPathRepoDocsCompoundRequested,
} from "../compound-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readString,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathCompoundRuntimeStatus } from "../runtime-status";

export type HelixAskGoldenPathRepoDocsCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["repo_code_evidence_observation", "doc_location_matches"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    observation_kind: "repo_code_evidence_observation",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    observation_kind: "doc_location_matches",
  },
] as const;
export const isRequested = isHelixAskGoldenPathRepoDocsCompoundRequested;
export const buildHelixAskGoldenPathRepoDocsCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathRepoDocsCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-repo-docs:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const repoObservationArtifactId = `${turnId}:repo_code_evidence_observation`;
  const relevanceGateArtifactId = `${turnId}:repo_evidence_relevance_gate`;
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const concept = readRepoSearchConcept(args.body);
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_repo_search_concept"
      | "repo_evidence_weak_after_repair"
      | "missing_doc_location_query"
      | "missing_doc_content"
      | "no_doc_location_matches";
    brokenRail: "argument_extraction" | "observation" | "evidence_reentry";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
      turnId,
      requiredTerminalKind,
      classifierReasons: ["explicit_repo_docs_compound_request"],
    });
    const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
      turnId,
      requiredTerminalKind,
      satisfaction: "not_satisfied",
      selectedTerminalArtifactKind: "typed_failure",
      missingRequirements: [params.missingRequirement],
      firstBrokenRail: params.brokenRail,
    });
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
      golden_path_runtime: buildGoldenPathCompoundRuntimeStatus({
        status: "repo_docs_compound_failed",
        executed: false,
        firstBrokenRail: params.brokenRail,
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCompoundCapabilityPlan({
        executedCapability: null,
        planArgs: { concept, doc_path: docPath, query },
        requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
        terminalResult,
        route: "golden_path_runtime / repo_docs_compound",
        firstBrokenRail: params.brokenRail,
      }),
      terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
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
        golden_path_runtime_status: "repo_docs_compound_failed",
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

  if (!concept) {
    return makeFailurePayload({
      errorCode: "missing_repo_search_concept",
      brokenRail: "argument_extraction",
      missingRequirement: "repo_search_concept",
      text: "I could not complete this golden-path repo/docs turn because no repo concept was provided.",
    });
  }
  const evidence = findGoldenPathRepoEvidence({ concept, files: readGoldenPathRepoSearchFiles(args.body) });
  if (evidence.length === 0) {
    return makeFailurePayload({
      errorCode: "repo_evidence_weak_after_repair",
      brokenRail: "evidence_reentry",
      missingRequirement: "repo_code_evidence_observation",
      text: `I could not find strong repo evidence for: ${concept}`,
    });
  }
  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path repo/docs turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path repo/docs turn because no readable document content was available.",
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

  const selectedPaths = Array.from(new Set(evidence.map((entry) => entry.file_path)));
  const repoEvidenceObservation = {
    schema: "helix.repo_code_evidence_observation.v1",
    capability_key: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    concept,
    selected_paths: selectedPaths,
    evidence,
    match_count: evidence.length,
    assistant_answer: false,
    raw_content_included: false,
  };
  const repoEvidenceRelevanceGate = {
    schema: "helix.repo_evidence_relevance_gate.v1",
    turn_id: turnId,
    concept,
    selected_paths: selectedPaths,
    coverage: evidence.length >= 2 ? "adequate" : "weak",
    terminal_allowed: true,
    repair_required: false,
    assistant_answer: false,
    raw_content_included: false,
  };
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
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "repo_search",
        requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        args: { concept },
        observationKind: "repo_code_evidence_observation",
        observationRef: repoObservationArtifactId,
        terminalContributionKind: "repo_code_evidence_answer",
      },
      {
        subgoalIdSuffix: "docs_locate",
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observationKind: "doc_location_matches",
        observationRef: docObservationArtifactId,
        terminalContributionKind: "doc_location_matches",
      },
    ],
  });
  const answerText = [
    "Compound repo/docs synthesis completed.",
    `Repo concept: ${concept}`,
    `Repo evidence: ${evidence[0]?.file_path ?? "unknown"}:${evidence[0]?.line ?? "unknown"} - ${evidence[0]?.snippet ?? ""}`,
    `Document query: ${query}`,
    docPath ? `Document: ${docPath}` : "",
    `Top document evidence: line ${matches[0]?.line ?? "unknown"} - ${matches[0]?.snippet ?? ""}`,
    "The repo evidence, relevance gate, and document matches are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
    turnId,
    requiredTerminalKind,
    classifierReasons: ["explicit_repo_docs_compound_request"],
    includeWorkspaceContextFields: true,
  });
  const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
    turnId,
    requiredTerminalKind,
  });
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
      repoObservationArtifactId,
      relevanceGateArtifactId,
      docObservationArtifactId,
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
    golden_path_runtime: buildGoldenPathCompoundRuntimeStatus({
      status: "repo_docs_compound",
      executed: true,
      observedArtifactRef: repoObservationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    repo_code_evidence_observation: repoEvidenceObservation,
    repo_evidence_relevance_gate: repoEvidenceRelevanceGate,
    doc_location_matches: docLocationMatches,
    compound_evidence_synthesis_answer: buildGoldenPathCompoundEvidenceSynthesisAnswer({
      text: terminalResult.text,
      supportRefs: terminalResult.support_refs,
      satisfiedSubgoalCount: 2,
    }),
    capability_plan: buildGoldenPathCompoundCapabilityPlan({
      requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / repo_docs_compound",
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
      observedArtifactRef: repoObservationArtifactId,
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
        artifactId: repoObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "repo_code_evidence_observation",
        producerItemId: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        terminalEligible: false,
        payload: repoEvidenceObservation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: relevanceGateArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "repo_evidence_relevance_gate",
        producerItemId: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        terminalEligible: false,
        payload: repoEvidenceRelevanceGate,
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
      golden_path_runtime_status: "repo_docs_compound",
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
export const buildPayload = buildHelixAskGoldenPathRepoDocsCompoundPayload;
