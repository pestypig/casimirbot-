import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "./artifact-ledger";
import { buildGoldenPathCapabilityGoalSatisfactionEvaluation, buildGoldenPathCapabilityPlan } from "./capability-contract";
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

type BuildCapabilitySuccessAdditionalFields = (args: {
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
  goalSatisfactionArtifact: RecordLike;
  goalSatisfactionEvaluation: RecordLike;
}) => RecordLike;

export const buildGoldenPathCapabilitySuccessPayload = (args: {
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
  answerScope?: string;
  sourceTarget: string;
  family: string;
  planArgs?: RecordLike;
  classifierReasons: readonly string[];
  allowsWorkspaceContext: boolean;
  includeWorkspaceContextFields?: boolean;
  requestedCapability: string;
  selectedCapability?: string;
  executedCapability?: string;
  observedArtifactKind: string;
  observationPayload: RecordLike;
  observationProducerItemId?: string;
  terminalPayloadField: string;
  terminalPayloadSchema: string;
  terminalPayloadExtra?: RecordLike;
  answerText: string;
  status: string;
  route: string;
  requiredObservationKinds: readonly string[];
  routeGateTerminalEligible?: boolean;
  includeRouteGatePromptText?: boolean;
  additionalTopLevelFields?: BuildCapabilitySuccessAdditionalFields;
  answerProducerItemId?: string;
  answerLedgerExtraPayload?: RecordLike;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: BuildGoalSatisfactionArtifact;
}): RecordLike => {
  const selectedCapability = args.selectedCapability ?? args.requestedCapability;
  const executedCapability = args.executedCapability ?? selectedCapability;
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: args.turnId,
    goal_kind: args.goalKind,
    answer_scope: args.answerScope ?? "current_turn",
    required_terminal_kind: args.requiredTerminalKind,
    ...(args.includeWorkspaceContextFields === false
      ? {}
      : {
          allows_workspace_context: args.allowsWorkspaceContext,
          allows_prior_artifacts: false,
        }),
    classifier_reasons: args.classifierReasons,
    assistant_answer: false,
    raw_content_included: false,
  };
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
      selectedCapability,
      executedCapability,
      observedArtifactKind: args.observedArtifactKind,
      observedArtifactRef: args.observationArtifactId,
      terminalArtifactRef: args.terminalArtifactId,
      terminalResultId: args.terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
      routeGate: "enabled_explicit_request",
    }),
    canonical_goal_frame: canonicalGoalFrame,
    [args.observedArtifactKind]: args.observationPayload,
    [args.terminalPayloadField]: {
      schema: args.terminalPayloadSchema,
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      ...(args.terminalPayloadExtra ?? {}),
      assistant_answer: false,
      raw_content_included: false,
    },
    ...(args.additionalTopLevelFields?.({
      terminalResult,
      goalSatisfactionArtifact,
      goalSatisfactionEvaluation,
    }) ?? {}),
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: args.requestedCapability,
      ...(args.selectedCapability ? { selectedCapability } : {}),
      sourceTarget: args.sourceTarget,
      family: args.family,
      ...(args.planArgs ? { planArgs: args.planArgs } : {}),
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
      selectedCapability,
      executedCapability,
      observedArtifactKind: args.observedArtifactKind,
      observedArtifactRef: args.observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      {
        ...buildGoldenPathRouteGateLedgerArtifact({
          artifactId: args.routeGateArtifactId,
          turnId: args.turnId,
          createdAtMs: args.createdAtMs,
          goalHash,
          terminalEligible: args.routeGateTerminalEligible,
          ...(args.includeRouteGatePromptText === false ? {} : { promptText: args.promptText }),
          requestedCapability: args.requestedCapability,
          goalSatisfactionArtifact,
          goalSatisfactionEvaluation,
        }),
      },
      buildGoldenPathObservationLedgerArtifact({
        artifactId: args.observationArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        kind: args.observedArtifactKind,
        producerItemId: args.observationProducerItemId,
        payload: args.observationPayload,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: args.terminalArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        kind: args.requiredTerminalKind,
        producerItemId: args.answerProducerItemId,
        payloadSchema: args.terminalPayloadSchema,
        terminalResult,
        extraPayload: args.answerLedgerExtraPayload,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: args.status,
      privateRuntimeLoopEntered: false,
      requestedCapability: args.requestedCapability,
      selectedCapability,
      executedCapability,
      observedArtifactKind: args.observedArtifactKind,
      observedArtifactRef: args.observationArtifactId,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};
