import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathRouteGateLedgerArtifact } from "../artifact-ledger";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";

export type HelixAskGoldenPathCapabilityCatalogDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathCapabilityCatalogRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY)) return true;
  const requestedCapability = readString(body.requested_capability ?? body.requestedCapability);
  if (requestedCapability === HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY);
};

export const buildGoldenPathCapabilityCatalogObservation = (): RecordLike => ({
  schema: "helix.capability_registry.v1",
  capability_key: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  available_capabilities: [
    HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
    HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
    HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
    HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  ],
  assistant_answer: false,
  raw_content_included: false,
});

export const capabilityCatalogSummaryText = (observation: RecordLike): string => {
  const capabilities = readStringArray(observation.available_capabilities);
  const capabilityList = capabilities.length ? capabilities.join(", ") : "no capabilities reported";
  return `Capability catalog inspection completed. Available golden-path capabilities: ${capabilityList}.`;
};

export const buildHelixAskGoldenPathCapabilityCatalogPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCapabilityCatalogDependencies;
}): RecordLike => {
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-capability-catalog:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:capability_registry`;
  const terminalArtifactId = `${turnId}:capability_help_summary`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "capability_help_summary";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const answerText = capabilityCatalogSummaryText(catalogObservation);
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "capability_catalog_runtime",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_capability_catalog_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "capability_catalog_runtime",
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
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "capability_catalog",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observed_artifact_kind: "capability_registry",
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
    capability_registry: catalogObservation,
    capability_help_summary: {
      schema: "helix.capability_help_summary.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      source_target: "capability_catalog",
      family: "capability_catalog",
      required_observation_kinds: ["capability_registry"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / capability_catalog",
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
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observed_artifact_kind: "capability_registry",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        ...buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          promptText,
          requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
          goalSatisfactionArtifact,
          goalSatisfactionEvaluation,
        }),
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "capability_registry",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: catalogObservation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.capability_help_summary.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "capability_catalog",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observed_artifact_kind: "capability_registry",
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


export const requiredObservationKinds = ["capability_registry"] as const;
export const requiredTerminalKinds = ["capability_help_summary"] as const;
export const isRequested = isHelixAskGoldenPathCapabilityCatalogRequested;
export const buildPayload = buildHelixAskGoldenPathCapabilityCatalogPayload;
