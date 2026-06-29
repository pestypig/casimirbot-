import {
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "./artifact-ledger";
import {
  buildGoldenPathCapabilityCanonicalGoalFrame,
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "./capability-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "./core";
import { buildGoldenPathCapabilityDebugMirror } from "./debug-mirror";
import { buildGoldenPathRuntimeStatus } from "./runtime-status";
import { buildGoldenPathSolverTrace } from "./solver-trace";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTerminalResult,
} from "./terminal-envelope";

type BuildGoalSatisfactionArtifact = (args: {
  turnId: string;
  goalHash: string;
  evaluation: RecordLike;
  createdAtMs: number;
}) => RecordLike;

export const buildGoldenPathCapabilityTerminalPayloadSuccessPayload = (args: {
  turnId: string;
  traceId: string;
  sessionId?: string;
  threadId?: string;
  promptText: string;
  createdAtMs: number;
  routeGateArtifactId: string;
  observationArtifactId: string;
  terminalArtifactId: string;
  terminalResultId: string;
  requiredTerminalKind: string;
  goalKind: string;
  answerScope: string;
  sourceTarget: string;
  family: string;
  classifierReasons: readonly string[];
  allowsWorkspaceContext: boolean;
  requestedCapability: string;
  selectedCapability: string;
  executedCapability: string;
  observedArtifactKind: string;
  observationPayload: RecordLike;
  terminalPayload: RecordLike;
  terminalPayloadProducerItemId: string;
  answerText: string;
  status: string;
  route: string;
  requiredObservationKinds: readonly string[];
  capabilityPlanExtraFields?: RecordLike;
  solverTraceExtra?: RecordLike;
  includeRuntimeLegacyFallbackPossibleWhenUnhandled?: boolean;
  includeRuntimeRouteGate?: boolean;
  routeGateTerminalEligible?: boolean;
  includePromptTextInRouteGate?: boolean;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: BuildGoalSatisfactionArtifact;
}): RecordLike => {
  const canonicalGoalFrame = buildGoldenPathCapabilityCanonicalGoalFrame({
    turnId: args.turnId,
    goalKind: args.goalKind,
    answerScope: args.answerScope,
    requiredTerminalKind: args.requiredTerminalKind,
    allowsWorkspaceContext: args.allowsWorkspaceContext,
    classifierReasons: args.classifierReasons,
  });
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId: args.turnId,
    goalKind: args.goalKind,
    requiredTerminalKind: args.requiredTerminalKind,
  });
  const goalHash = args.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.buildGoalSatisfactionEvaluationArtifact({
    turnId: args.turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs: args.createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = buildGoldenPathTerminalResult({
    resultId: args.terminalResultId,
    artifactId: args.terminalArtifactId,
    artifactKind: args.requiredTerminalKind,
    finalAnswerSource: args.requiredTerminalKind,
    text: args.answerText,
    supportRefs: [args.observationArtifactId, args.routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });
  const terminalPayload =
    "support_refs" in args.terminalPayload
      ? args.terminalPayload
      : {
          ...args.terminalPayload,
          support_refs: terminalResult.support_refs,
        };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: args.turnId,
    trace_id: args.traceId,
    session_id: args.sessionId,
    thread_id: args.threadId,
    prompt_text: args.promptText,
    ...buildGoldenPathTerminalResponseProjection({ terminalResult }),
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: args.status,
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
      executedCapability: args.executedCapability,
      observedArtifactKind: args.observedArtifactKind,
      observedArtifactRef: args.observationArtifactId,
      terminalArtifactRef: args.terminalArtifactId,
      terminalResultId: args.terminalResultId,
      ...(args.includeRuntimeLegacyFallbackPossibleWhenUnhandled === false
        ? {}
        : { legacyFallbackPossibleWhenUnhandled: true }),
      ...(args.includeRuntimeRouteGate === false ? {} : { routeGate: "enabled_explicit_request" }),
    }),
    canonical_goal_frame: canonicalGoalFrame,
    [args.observedArtifactKind]: args.observationPayload,
    [args.requiredTerminalKind]: terminalPayload,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
      sourceTarget: args.sourceTarget,
      family: args.family,
      ...(args.capabilityPlanExtraFields ? { extraFields: args.capabilityPlanExtraFields } : {}),
      requiredObservationKinds: args.requiredObservationKinds,
      requiredTerminalKind: args.requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: args.route,
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
      executedCapability: args.executedCapability,
      observedArtifactKind: args.observedArtifactKind,
      observedArtifactRef: args.observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        ...(args.solverTraceExtra ?? {}),
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: args.routeGateArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        terminalEligible: args.routeGateTerminalEligible,
        ...(args.includePromptTextInRouteGate ? { promptText: args.promptText } : {}),
        requestedCapability: args.requestedCapability,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: args.observationArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        producerItemId: args.executedCapability,
        kind: args.observedArtifactKind,
        payload: args.observationPayload,
      }),
      buildGoldenPathPayloadLedgerArtifact({
        artifactId: args.terminalArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        terminalEligible: true,
        goalHash,
        producerItemId: args.terminalPayloadProducerItemId,
        kind: args.requiredTerminalKind,
        payload: terminalPayload,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: args.status,
      privateRuntimeLoopEntered: false,
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
      executedCapability: args.executedCapability,
      observedArtifactKind: args.observedArtifactKind,
      observedArtifactRef: args.observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};
