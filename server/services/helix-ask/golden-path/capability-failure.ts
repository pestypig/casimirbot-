import { buildGoldenPathRouteGateLedgerArtifact, buildGoldenPathTypedFailureLedgerArtifact } from "./artifact-ledger";
import { buildGoldenPathCapabilityGoalSatisfactionEvaluation, buildGoldenPathCapabilityPlan } from "./capability-contract";
import { HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA, type RecordLike } from "./core";
import { buildGoldenPathCapabilityDebugMirror } from "./debug-mirror";
import { buildGoldenPathRuntimeStatus } from "./runtime-status";
import { buildGoldenPathSolverTrace } from "./solver-trace";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTypedFailureResponseProjection,
  buildGoldenPathTypedFailureTerminalResult,
} from "./terminal-envelope";

export const buildGoldenPathCapabilityTypedFailurePayload = (args: {
  turnId: string;
  traceId: string;
  sessionId?: string;
  threadId?: string;
  promptText: string;
  createdAtMs: number;
  routeGateArtifactId: string;
  terminalResultId: string;
  requiredTerminalKind: string;
  goalKind: string;
  classifierReasons: readonly string[];
  requestedCapability: string;
  selectedCapability?: string;
  sourceTarget: string;
  family: string;
  planArgs?: RecordLike;
  requiredObservationKinds: readonly string[];
  status: string;
  route: string;
  errorCode: string;
  brokenRail: string;
  missingRequirement: string;
  text: string;
  hashGoalFrame: (value: unknown) => string;
}): RecordLike => {
  const selectedCapability = args.selectedCapability ?? args.requestedCapability;
  const terminalArtifactId = `${args.turnId}:typed_failure`;
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: args.turnId,
    goal_kind: args.goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: args.requiredTerminalKind,
    classifier_reasons: args.classifierReasons,
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId: args.turnId,
    goalKind: args.goalKind,
    requiredTerminalKind: args.requiredTerminalKind,
    satisfaction: "not_satisfied",
    selectedTerminalArtifactKind: "typed_failure",
    missingRequirements: [args.missingRequirement],
    firstBrokenRail: args.brokenRail,
  });
  const goalHash = args.hashGoalFrame(canonicalGoalFrame);
  const terminalResult = buildGoldenPathTypedFailureTerminalResult({
    resultId: args.terminalResultId,
    artifactId: terminalArtifactId,
    text: args.text,
    supportRefs: [args.routeGateArtifactId],
  });

  return {
    ok: false,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: args.turnId,
    trace_id: args.traceId,
    session_id: args.sessionId,
    thread_id: args.threadId,
    prompt_text: args.promptText,
    ...buildGoldenPathTypedFailureResponseProjection({
      terminalResult,
      terminalErrorCode: args.errorCode,
    }),
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: args.status,
      requestedCapability: args.requestedCapability,
      selectedCapability,
      executedCapability: null,
      firstBrokenRail: args.brokenRail,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: args.requestedCapability,
      ...(args.selectedCapability ? { selectedCapability } : {}),
      executedCapability: null,
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
      completedSolverPath: false,
      requestedCapability: args.requestedCapability,
      selectedCapability,
      executedCapability: null,
      firstBrokenRail: args.brokenRail,
      terminalArtifactKind: "typed_failure",
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: args.routeGateArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        requestedCapability: args.requestedCapability,
      }),
      buildGoldenPathTypedFailureLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        terminalResult,
        errorCode: args.errorCode,
        firstBrokenRail: args.brokenRail,
      }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      requestedCapability: args.requestedCapability,
      selectedCapability,
      executedCapability: null,
      terminalResult,
      firstBrokenRail: args.brokenRail,
      terminalErrorCode: args.errorCode,
    }),
  };
};
