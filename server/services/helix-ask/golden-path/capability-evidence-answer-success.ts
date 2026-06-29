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

export type GoldenPathEvidenceObservation = {
  artifactId: string;
  kind: string;
  payload: RecordLike;
  producerItemId?: string;
  terminalEligible?: boolean;
};

export const buildGoldenPathCapabilityEvidenceAnswerSuccessPayload = (args: {
  turnId: string;
  traceId: string;
  sessionId?: string;
  threadId?: string;
  promptText: string;
  createdAtMs: number;
  routeGateArtifactId: string;
  terminalArtifactId: string;
  terminalResultId: string;
  requiredTerminalKind: string;
  goalKind: string;
  answerScope: string;
  sourceTarget: string;
  family: string;
  planArgs?: RecordLike;
  classifierReasons: readonly string[];
  allowsWorkspaceContext: boolean;
  requestedCapability: string;
  selectedCapability: string;
  executedCapability: string;
  observations: readonly GoldenPathEvidenceObservation[];
  primaryObservedArtifactKind: string;
  primaryObservedArtifactRef: string;
  terminalPayloadSchema: string;
  terminalPayload: RecordLike;
  terminalExtraPayload?: RecordLike;
  answerText: string;
  status: string;
  route: string;
  requiredObservationKinds: readonly string[];
  includeRuntimeLegacyFallbackPossibleWhenUnhandled?: boolean;
  includeRuntimeRouteGate?: boolean;
  includePromptTextInRouteGate?: boolean;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: BuildGoalSatisfactionArtifact;
}): RecordLike => {
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: args.turnId,
    goal_kind: args.goalKind,
    answer_scope: args.answerScope,
    required_terminal_kind: args.requiredTerminalKind,
    allows_workspace_context: args.allowsWorkspaceContext,
    allows_prior_artifacts: false,
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
  const observationRefs = args.observations.map((observation) => observation.artifactId);
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = buildGoldenPathTerminalResult({
    resultId: args.terminalResultId,
    artifactId: args.terminalArtifactId,
    artifactKind: args.requiredTerminalKind,
    finalAnswerSource: args.requiredTerminalKind,
    text: args.answerText,
    supportRefs: [...observationRefs, args.routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });
  const terminalPayload = {
    ...args.terminalPayload,
    text: "text" in args.terminalPayload ? args.terminalPayload.text : terminalResult.text,
    answer_text: "answer_text" in args.terminalPayload ? args.terminalPayload.answer_text : terminalResult.text,
    support_refs: "support_refs" in args.terminalPayload ? args.terminalPayload.support_refs : terminalResult.support_refs,
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
    ...Object.fromEntries(args.observations.map((observation) => [observation.kind, observation.payload])),
    [args.requiredTerminalKind]: terminalPayload,
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: args.status,
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
      executedCapability: args.executedCapability,
      observedArtifactKind: args.primaryObservedArtifactKind,
      observedArtifactRef: args.primaryObservedArtifactRef,
      terminalArtifactRef: args.terminalArtifactId,
      terminalResultId: args.terminalResultId,
      ...(args.includeRuntimeLegacyFallbackPossibleWhenUnhandled === false
        ? {}
        : { legacyFallbackPossibleWhenUnhandled: true }),
      ...(args.includeRuntimeRouteGate === false ? {} : { routeGate: "enabled_explicit_request" }),
    }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
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
      selectedCapability: args.selectedCapability,
      executedCapability: args.executedCapability,
      observedArtifactKind: args.primaryObservedArtifactKind,
      observedArtifactRef: args.primaryObservedArtifactRef,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
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
        ...(args.includePromptTextInRouteGate ? { promptText: args.promptText } : {}),
        requestedCapability: args.requestedCapability,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      ...args.observations.map((observation) =>
        buildGoldenPathObservationLedgerArtifact({
          artifactId: observation.artifactId,
          turnId: args.turnId,
          createdAtMs: args.createdAtMs,
          goalHash,
          kind: observation.kind,
          payload: observation.payload,
          ...(observation.producerItemId ? { producerItemId: observation.producerItemId } : {}),
          ...(typeof observation.terminalEligible === "boolean"
            ? { terminalEligible: observation.terminalEligible }
            : {}),
        }),
      ),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: args.terminalArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        kind: args.requiredTerminalKind,
        payloadSchema: args.terminalPayloadSchema,
        terminalResult,
        ...(args.terminalExtraPayload ? { extraPayload: args.terminalExtraPayload } : {}),
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: args.status,
      privateRuntimeLoopEntered: false,
      requestedCapability: args.requestedCapability,
      selectedCapability: args.selectedCapability,
      executedCapability: args.executedCapability,
      observedArtifactKind: args.primaryObservedArtifactKind,
      observedArtifactRef: args.primaryObservedArtifactRef,
      terminalResult,
      goalSatisfactionEvaluation,
    }),
  };
};
