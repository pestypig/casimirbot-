import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "../capability-contract";
import {
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
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";

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
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId,
    goalKind: "capability_catalog_runtime",
    requiredTerminalKind,
  });
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
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: "capability_catalog",
      requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observedArtifactKind: "capability_registry",
      observedArtifactRef: observationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
      routeGate: "enabled_explicit_request",
    }),
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
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      sourceTarget: "capability_catalog",
      family: "capability_catalog",
      requiredObservationKinds,
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / capability_catalog",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observedArtifactKind: "capability_registry",
      observedArtifactRef: observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
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
      buildGoldenPathObservationLedgerArtifact({
        artifactId: observationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "capability_registry",
        payload: catalogObservation,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        payloadSchema: "helix.capability_help_summary.v1",
        terminalResult,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: "capability_catalog",
      privateRuntimeLoopEntered: false,
      requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observedArtifactKind: "capability_registry",
      observedArtifactRef: observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};


export const requiredObservationKinds = ["capability_registry"] as const;
export const requiredTerminalKinds = ["capability_help_summary"] as const;
export const isRequested = isHelixAskGoldenPathCapabilityCatalogRequested;
export const buildPayload = buildHelixAskGoldenPathCapabilityCatalogPayload;
