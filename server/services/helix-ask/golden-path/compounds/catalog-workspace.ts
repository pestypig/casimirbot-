import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilityCatalogObservation } from "../capabilities/capability-catalog";
import { buildGoldenPathWorkspaceStatusObservation } from "../capabilities/workspace-status";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCapabilityContract,
  buildGoldenPathCompoundEvidenceSynthesisAnswer,
  isHelixAskGoldenPathCatalogWorkspaceCompoundRequested,
} from "../compound-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";

export type HelixAskGoldenPathCatalogWorkspaceCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["capability_registry", "workspace_os_status_observation"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
    observation_kind: "capability_registry",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    observation_kind: "workspace_os_status_observation",
  },
] as const;
export const isRequested = isHelixAskGoldenPathCatalogWorkspaceCompoundRequested;
export const buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCatalogWorkspaceCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-catalog-workspace:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const catalogObservationArtifactId = `${turnId}:capability_registry`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const workspaceObservationArtifactId =
    readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const counts = readRecord(workspaceObservation.capability_counts) ?? {};
  const workspaceSummary = `Workspace status: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "capability_catalog",
        requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        observationKind: "capability_registry",
        observationRef: catalogObservationArtifactId,
      },
      {
        subgoalIdSuffix: "workspace_status",
        requestedCapability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        observationKind: "workspace_os_status_observation",
        observationRef: workspaceObservationArtifactId,
      },
    ],
  });
  const answerText = [
    "Compound capability/workspace synthesis completed.",
    "Capability catalog observation completed.",
    workspaceSummary,
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_catalog_workspace_compound_request"],
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
      catalogObservationArtifactId,
      workspaceObservationArtifactId,
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
      status: "catalog_workspace_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: catalogObservationArtifactId,
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
    capability_registry: catalogObservation,
    workspace_os_status_observation: workspaceObservation,
    compound_evidence_synthesis_answer: buildGoldenPathCompoundEvidenceSynthesisAnswer({
      text: terminalResult.text,
      supportRefs: terminalResult.support_refs,
      satisfiedSubgoalCount: 2,
    }),
    capability_plan: buildGoldenPathCompoundCapabilityPlan({
      requiredObservationKinds,
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / catalog_workspace_compound",
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
      observedArtifactRef: catalogObservationArtifactId,
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
        promptText,
        requestedCapability: "compound_capability_contract",
        compoundCapabilityContract,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: catalogObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "capability_registry",
        terminalEligible: false,
        payload: catalogObservation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: workspaceObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "workspace_os_status_observation",
        terminalEligible: false,
        payload: workspaceObservation,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        payloadSchema: "helix.compound_evidence_synthesis_answer.v1",
        terminalResult,
        extraPayload: { satisfied_subgoal_count: 2 },
      }),
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "catalog_workspace_compound",
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
export const buildPayload = buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload;

